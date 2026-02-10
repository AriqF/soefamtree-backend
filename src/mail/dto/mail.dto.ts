import { IsArray, IsNotEmpty, IsObject, IsString, IsOptional } from 'class-validator';

export class EmailDto {

  @IsString()
  @IsOptional()
  from?: string;

  @IsArray()
  @IsNotEmpty()
  to: string[];

  @IsString()
  @IsNotEmpty()
  subject: string;

  template: string;

  @IsObject()
  body: object;

  @IsString()
  @IsOptional()
  html?: string;
}

export class EmailTextDto {
  @IsArray()
  @IsNotEmpty()
  to: string[];

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  text: string;
}
