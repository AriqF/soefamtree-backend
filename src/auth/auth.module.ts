import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from 'src/models/account.entity';
import { AccountModule } from 'src/account/account.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AccountStrategy } from './account.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { MailModule } from 'src/mail/mail.module';
import { LogOTP } from 'src/models/otp-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, LogOTP]),
    AccountModule,
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_ACCOUNT_SECRET'),
        signOptions: {
          expiresIn: 3600 * 5, //5 hours
        },
      }),
    }),
    MailModule
  ],
  controllers: [AuthController],
  providers: [AuthService, AccountStrategy],
})
export class AuthModule {}
