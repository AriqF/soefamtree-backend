import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";


export class CreateAccountDto{
    @ApiProperty({required: true})
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({required: true})
    @IsNotEmpty()
    @IsString()
    password: string;

    @ApiPropertyOptional({required: false})
    @IsOptional()
    @IsInt()
    member_id: number;

    @ApiProperty({required: true, default: false})
    @IsNotEmpty()
    @IsBoolean()
    is_admin: boolean;

    @ApiProperty({required: true, default: 0})
    @IsNotEmpty()
    @IsInt()
    admin_auth_index: number;
}