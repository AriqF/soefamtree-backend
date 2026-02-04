import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Account } from 'src/models/account.entity';
import { AccountService } from 'src/account/account.service';
import { JWTAccount } from './common/auth.interface';

@Injectable()
export class AccountStrategy extends PassportStrategy(Strategy, 'account-access-token') {
  constructor(
    private accountService: AccountService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCOUNT_SECRET'),
    });
  }

  async validate(payload: JWTAccount): Promise<Account> {
    const account: Account = await this.accountService.getOneByEmail(payload.email);

    if (!account) {
      throw new UnauthorizedException();
    }

    return account;
  }
}
