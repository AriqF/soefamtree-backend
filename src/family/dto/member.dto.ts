import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsOptional,
  IsInt,
  ValidateNested,
  Matches,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Gender } from '../../models/member.entity';

export class MemberDetailDto {
  @ApiPropertyOptional({ example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  profession?: string;

  @ApiPropertyOptional({ example: 'Jakarta' })
  @IsOptional()
  @IsString()
  domicile?: string;

  @ApiPropertyOptional({ example: 'Jl. Sudirman No. 123, Jakarta Selatan' })
  @IsOptional()
  @IsString()
  full_address?: string;

  @ApiPropertyOptional({
    example: '6281234567890',
    description: 'WhatsApp number in format 628xxx',
  })
  @IsOptional()
  @IsString()
  @Matches(/^628\d+$/, { message: 'whatsapp_number must be in format 628xxx' })
  whatsapp_number?: string;

  @ApiPropertyOptional({
    example: 'john_doe',
    description: 'Instagram handle without @',
  })
  @IsOptional()
  @IsString()
  instagram_handle?: string;
}

export class AddFamilyMemberDto {
  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  fullname: string;

  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  @IsString()
  nickname: string;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({
    example: '1990-05-15',
    description: 'Date in YYYY-MM-DD format',
  })
  @IsNotEmpty()
  @IsDateString()
  birth_date: string;

  @ApiPropertyOptional({
    example: '2024-01-01',
    description: 'Date in YYYY-MM-DD format',
  })
  @IsOptional()
  @IsDateString()
  death_date?: string;

  @ApiPropertyOptional({ example: 'https://example.com/photo.jpg' })
  @IsOptional()
  @IsString()
  photo_url?: string;

  @ApiPropertyOptional({ example: 'A brief biography of the family member' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID of the spouse (must be an existing member)',
  })
  @IsOptional()
  @IsInt()
  spouse_id?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'ID of the father (must be an existing male member)',
  })
  @IsOptional()
  @IsInt()
  father_id?: number;

  @ApiPropertyOptional({
    example: 11,
    description: 'ID of the mother (must be an existing female member)',
  })
  @IsOptional()
  @IsInt()
  mother_id?: number;

  @ApiPropertyOptional({ type: MemberDetailDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MemberDetailDto)
  detail?: MemberDetailDto;
}

// Response DTOs for Family Tree View

export class FamilyTreeMemberDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John Doe' })
  fullname: string;

  @ApiProperty({ example: 'John' })
  nickname: string;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  gender: Gender;

  @ApiProperty({ example: '1990-05-15' })
  birth_date: Date;

  @ApiPropertyOptional({ example: '2024-01-01' })
  death_date: Date | null;

  @ApiPropertyOptional({ example: 'https://example.com/photo.jpg' })
  photo_url: string | null;

  @ApiPropertyOptional({ example: 'A brief biography' })
  bio: string | null;

  @ApiPropertyOptional({ example: 2, description: 'ID of the spouse' })
  spouse_id: number | null;

  @ApiPropertyOptional({ example: 10, description: 'ID of the father' })
  father_id: number | null;

  @ApiPropertyOptional({ example: 11, description: 'ID of the mother' })
  mother_id: number | null;

  @ApiPropertyOptional({
    example: [20, 21],
    description: 'Array of children IDs',
    type: [Number],
  })
  children_ids: number[] | null;
}

export class GenerationDto {
  @ApiProperty({ example: 0, description: 'Generation level (0 = oldest)' })
  level: number;

  @ApiProperty({
    example: 'Great-Grandparents',
    description: 'Label for this generation',
  })
  label: string;

  @ApiProperty({
    type: [FamilyTreeMemberDto],
    description: 'Members in this generation',
  })
  members: FamilyTreeMemberDto[];
}

export class FamilyTreeResponseDto {
  @ApiProperty({
    type: [GenerationDto],
    description: 'Family tree organized by generations',
  })
  generations: GenerationDto[];

  @ApiProperty({ example: 15, description: 'Total number of family members' })
  total_members: number;

  @ApiProperty({ example: 5, description: 'Total number of generations' })
  total_generations: number;
}
