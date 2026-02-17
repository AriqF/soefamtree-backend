import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class GetOneByIdDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  id: number;
}

export class PaginateOptionsDto {
  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    minimum: 1,
    default: 5,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 5;
}

export class PageOptionsDto extends PaginateOptionsDto {
  @ApiProperty({
    description: 'Filter keyword',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  q: string;
}

export class QueryOptionDto {
  @ApiProperty({
    description: 'Filter keyword',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  q: string;
}
