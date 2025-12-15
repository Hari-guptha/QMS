import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsObject,
  ValidateIf,
} from 'class-validator';

export class CreateTicketDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  customerPhone?: string;

  @ApiProperty({ required: false })
  @ValidateIf((o) => o.customerEmail && o.customerEmail.trim() !== '')
  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @ApiProperty({ required: false, type: 'object' })
  @IsObject()
  @IsOptional()
  formData?: Record<string, any>;
}

