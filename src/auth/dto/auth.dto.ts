import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";


export class AuthDto {
    @ApiProperty({ required: true })
    @IsNotEmpty()
    @IsString()
    email: string;

    @ApiProperty({ required: true })
    @IsNotEmpty()
    @IsString()
    password: string;
}

export class AuthRequestOTPDto{
    @ApiProperty({ required: true })
    @IsNotEmpty()
    @IsString()
    email: string;
}

export class AuthOTPDto {
    @ApiProperty({ required: true })
    @IsNotEmpty()
    @IsString()
    email: string;

    @ApiProperty({required: true})
    @IsNotEmpty()
    @IsString()
    otp: string;
}