import { CacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";

import { S3Module } from "../s3";

import { BlocksController } from "./controllers";
import { BlocksService } from "./services";

@Module({
  imports: [
    S3Module,
    CacheModule.register({
      max: 10000,
      ttl: 5 * 60 * 1000, // 5 minutes
    }),
  ],
  providers: [BlocksService],
  controllers: [BlocksController],
})
export class BlocksModule {}
