import * as fs from "node:fs";
import { hrtime } from "node:process";
import { Readable } from "node:stream";
import * as zlib from "node:zlib";

import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  OnApplicationBootstrap,
  RequestTimeoutException,
} from "@nestjs/common";

import { S3Service } from "../../s3";
import { GetBlockParams } from "../dto";
import { getFileHeaderLength, HEADER_START_LENGTH, readFileHeader } from "../utils";

import { ConfigService } from "@config";

interface RangeData {
  start: number;
  end: number;
  filePath: string;
  isDownloading: boolean;
  compressedFileName: string;
}

@Injectable()
export class BlocksService implements OnApplicationBootstrap {
  private readonly directoryPath: string;

  constructor(
    private readonly s3Service: S3Service,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {
    this.directoryPath = this.configService.files.directoryPath;
  }

  /**
   * Pre-start operation
   * 1. Create directory {@link this.directoryPath} if it does not exist
   * 2. Start "cron" each 4.5-5 minutes to get bucket files list
   * 2.1 Get first bytes of each file to define header length with {@link getFileHeaderLength}
   * 2.2 Get full header and read it with {@link readFileHeader} to get all ranges data
   * 2.3 Save all key pairs {[blockNumber-blockHash]: RangeData} to cache
   */
  async onApplicationBootstrap(): Promise<void> {
    if (!fs.existsSync(this.directoryPath)) {
      await new Promise((resolve, reject) => {
        fs.mkdir(this.directoryPath, (err) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(null);
        });
      });
    }

    const storedFilesArray = await new Promise<string[]>((resolve, reject) => {
      fs.readdir(this.directoryPath, (err, dirrFiles) => {
        if (err) {
          return reject(err);
        }

        resolve(dirrFiles);
      });
    });

    const storedFiles = storedFilesArray.reduce((acc, curr) => {
      acc[curr] = true;
      return acc;
    }, {});

    await this.cacheManager.wrap("cron", async () => {
      const files = await this.s3Service.getFilesList();
      const prefix = this.configService.aws.s3.bucket.prefix;

      const toSet = [];
      for await (const { Key } of files) {
        const fileName = Key.replace(`${prefix}/`, "");

        const fileHeaderStart = await this.s3Service.getRangeBuffer(fileName, 0, HEADER_START_LENGTH - 1);

        const fileHeaderLength = getFileHeaderLength(fileHeaderStart);
        const fileHeader = await this.s3Service.getRangeBuffer(fileName, 0, fileHeaderLength);
        const mapping = readFileHeader(fileHeader);

        for (const [key, value] of mapping) {
          const [blockNumber] = key.split("-");
          const storedFileName = `uncompressed-${blockNumber}.json`;
          const rangeData: RangeData = {
            ...value,
            filePath: "",
            isDownloading: false,
            compressedFileName: fileName,
          };

          if (storedFiles[storedFileName]) {
            rangeData.filePath = `${this.directoryPath}/${storedFileName}`;
          }

          toSet.push([key, JSON.stringify(rangeData)]);
        }
      }

      await this.cacheManager.store.mset(toSet);

      return Date.now();
    }, 5 * 60 * 1000, 4.5 * 60 * 1000, { nonBlockingSet: true });
  }

  async getBlock(data: GetBlockParams): Promise<Readable> {
    const rangeData = await this.waitForRangeData(data);

    return await this.getFile({ ...rangeData, ...data });
  }

  /**
   * Look into {@link data} to determine how to get file
   * 1. `data.filePath` -- get data from file system
   * 2. `!data.filePath` -- get range from S3 and pipe unzip to it, return it.
   * Write unzipped to file and update cache
   * @param {RangeData & GetBlockParams} data
   * @private
   * @returns {Readable} File stream
   */
  private async getFile(data: RangeData & GetBlockParams): Promise<Readable> {
    const { blockNumber, blockHash, ...rangeData } = data;
    const { filePath, compressedFileName, start, end } = rangeData;
    const key = `${blockNumber}-${blockHash}`;

    const fileName = `${this.directoryPath}/uncompressed-${blockNumber}.json`;

    if (filePath) {
      return fs.createReadStream(fileName);
    }

    const range = await this.s3Service.getRangeStream(compressedFileName, start, end);
    // We need 2 separated unzip streams to process returning data and writing ones
    const gunzip = zlib.createGunzip();
    const gunzip2 = zlib.createGunzip();

    const fsWrite = fs.createWriteStream(fileName, { flags: "w" });

    const result = Readable.from(range).pipe(gunzip);

    fsWrite.on("close", async () => {
      await this.cacheManager.set(key, JSON.stringify({ ...rangeData, filePath: fileName, isDownloading: false }));
    });
    range.pipe(gunzip2).pipe(fsWrite);

    return result;
  }

  /**
   * Call {@link getRangeData} once and then each ~100ms until 5 seconds threshold is met
   * @param {GetBlockParams} data
   * @throws {RequestTimeoutException | HttpException}
   * {@link RequestTimeoutException} when we are waiting more than 5 seconds.
   * {@link HttpException} re-throw error from {@link getRangeData}
   * @private
   * @returns {RangeData}
   */
  private async waitForRangeData(data: GetBlockParams): Promise<RangeData> {
    // eslint-disable-next-line no-async-promise-executor
    return await new Promise<RangeData>(async (resolve, reject) => {
      const start = hrtime.bigint();

      try {
        const cachedRangeData = await this.getRangeData(data);

        if (cachedRangeData) {
          resolve(cachedRangeData);
          return;
        }
      } catch (e) {
        reject(e);
        return;
      }

      const interval = setInterval(async () => {
        const end = hrtime.bigint();

        if (end - start >= 5_000_000_000) {
          return reject(new RequestTimeoutException());
        }

        try {
          const cachedRangeData = await this.getRangeData(data);

          if (cachedRangeData) {
            resolve(cachedRangeData);
            clearInterval(interval);
          }
        } catch (e) {
          reject(e);
          clearInterval(interval);
        }
      }, 100);
    });
  }

  /**
   * Get range data from cache
   * 1. If no key, throw an exception
   * 2. If there is `filePath` return all data
   * 3. If there is `isDownloading` return null (to continue waiting in {@link waitForRangeData})
   * 4. If there is `!filePath & !isDownloading` return all data
   * @param {GetBlockParams} data
   * @throws {HttpException} If there is no key in cache
   * @private
   * @returns {RangeData | null}
   */
  private async getRangeData(data: GetBlockParams): Promise<RangeData> {
    const { blockNumber, blockHash } = data;
    const key = `${blockNumber}-${blockHash}`;

    const value = await this.cacheManager.get<string>(`${blockNumber}-${blockHash}`);

    if (!value) {
      throw new HttpException("Unknown block", HttpStatus.NOT_FOUND);
    }

    const parsedValue: RangeData = JSON.parse(value);

    if (parsedValue.filePath) {
      return parsedValue;
    }

    if (parsedValue.isDownloading) {
      return null;
    }

    // !filePath and !isDownloading
    await this.cacheManager.set(key, JSON.stringify({ ...parsedValue, isDownloading: true }));
    return parsedValue;
  }
}

