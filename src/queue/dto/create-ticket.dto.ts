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

  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  customerPhone: string;

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

