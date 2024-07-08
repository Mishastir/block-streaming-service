import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class GetBlockParams {
  @ApiProperty()
  @IsString()
  blockNumber: string;

  @ApiProperty()
  @IsString()
  blockHash: string;
}
