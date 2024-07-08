import { hostname } from "os";

import { AbstractConfigV2 } from "./abstract-config-v2";

export class ConfigService extends AbstractConfigV2 {

  readonly app = {
    name: hostname(),
    version: this.getString("VERSION", "unknown"),

    port: this.getNumber("PORT", 6001),
    env: this.getString("NODE_ENV"),
    // frontendUrl: this.getString("FRONTEND_URL"),
    // corsUrls: this.getStringArray("CORS_URLS", ","),
  };

  readonly files = {
    directoryPath: this.getString("FILES_DIRECTORY_PATH", "./files"),
  };

  readonly aws = {
    region: this.getString("AWS_REGION"),
    credentials: {
      accessKeyId: this.getString("AWS_ACCESS_KEY_ID"),
      secretAccessKey: this.getString("AWS_SECRET_ACCESS_KEY"),
    },
    s3: {
      bucket: {
        name: this.getString("AWS_S3_BUCKET_NAME"),
        prefix: this.getString("AWS_S3_BUCKET_PREFIX"),
      },
    },
  };
}
