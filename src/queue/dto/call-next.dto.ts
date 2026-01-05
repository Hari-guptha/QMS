import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CallNextDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  note?: string;
}

