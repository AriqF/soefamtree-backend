import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, AuthOTPDto, AuthRequestOTPDto } from './dto/auth.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('API Auth - Auth Module')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('check-signin')
  async signIn(@Body() body: AuthDto){
    return await this.authService.signIn(body);
  }

  @Post('otp/request')
  async requestOTP(@Body() body: AuthRequestOTPDto){
    return await this.authService.requestOTP(body);
  }

  @Post('otp/verify')
  async verifyOTP(@Body() body: AuthOTPDto){
    return await this.authService.verifyOTP(body);
  }
}
