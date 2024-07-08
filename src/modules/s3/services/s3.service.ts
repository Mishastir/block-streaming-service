import { Readable } from "node:stream";

import { GetObjectCommand, ListObjectsOutput, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { Hash } from "@aws-sdk/hash-node";
import { Injectable, Logger } from "@nestjs/common";

import { ConfigService } from "@config";

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);

  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly prefix: string;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.bucketName = this.configService.aws.s3.bucket.name;
    this.prefix = this.configService.aws.s3.bucket.prefix;

    // Credentials will be set on deploy
    this.s3Client = new S3Client({
      region: this.configService.aws.region,
      sha256: Hash.bind(null, "sha256"),
      credentials: this.configService.aws.credentials,
    });
  }

  async getFilesList(): Promise<ListObjectsOutput["Contents"]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: this.prefix,
    });

    try {
      const file = await this.s3Client.send(command);
      return file.Contents;
      // eslint-disable-next-line
    } catch (err: any) {
      const errorMessage = `Failed to list files for ${this.prefix}. Error: ${err.name} ${err.message}`;
      this.logger.error(err);

      throw new Error(errorMessage);
    }
  }

  async getRangeStream(fileKey: string, start: number, end: number): Promise<Readable> {
    const key = this.buildKey(fileKey);

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Range: `bytes=${start}-${end}`,
      // Range: "bytes=9012-44638",
    });

    try {
      const file = await this.s3Client.send(command);

      return file.Body as Readable;
      // eslint-disable-next-line
    } catch (err: any) {
      this.logger.error(`Failed to get file range ${start}-${end} from S3: ${err.name} ${err.message} ${err.stack}`);
      throw new Error(err);
    }
  }

  async getRangeBuffer(fileKey: string, start: number, end: number): Promise<Buffer> {
    const key = this.buildKey(fileKey);

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Range: `bytes=${start}-${end}`,
    });

    try {
      const file = await this.s3Client.send(command);

      const fileBufferRaw = await file.Body.transformToByteArray();

      return Buffer.from(fileBufferRaw.buffer);
      // eslint-disable-next-line
    } catch (err: any) {
      this.logger.error(`Failed to get file from S3: ${err.name} ${err.message} ${err.stack}`);
      throw new Error(err);
    }
  }

  private buildKey(key: string): string {
    return `${this.prefix}/${key}`;
  }
}
