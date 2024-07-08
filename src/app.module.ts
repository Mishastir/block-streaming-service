import { Module } from "@nestjs/common";

import { BlocksModule } from "./modules/blocks";

import { ConfigModule } from "@config";


@Module({
  imports: [
    ConfigModule,
    BlocksModule,
  ],
})
export class AppModule {}
