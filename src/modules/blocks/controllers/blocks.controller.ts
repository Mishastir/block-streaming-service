import { Controller, Get, Param, Res } from "@nestjs/common";
import { Response } from "express";

import { GetBlockParams } from "../dto";
import { BlocksService } from "../services";

@Controller("block")
export class BlocksController {
  constructor(
    private readonly fileParserService: BlocksService,
  ) {}

  @Get(":blockNumber/:blockHash")
  async getFile(@Param() params: GetBlockParams, @Res() res: Response): Promise<void> {
    const stream = await this.fileParserService.getBlock(params);

    res.set({
      "Content-Type": "application/json",
    });

    stream.pipe(res);
  }
}
