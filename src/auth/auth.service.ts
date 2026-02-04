import { Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountService } from 'src/account/account.service';
import { AuthDto } from './dto/auth.dto';
import { compare } from 'bcrypt';
import { Repository } from 'typeorm';
import { Account } from 'src/models/account.entity';
import { JWTAccount } from './common/auth.interface';
import { JwtService } from '@nestjs/jwt';
import moment from 'moment-timezone';


@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private accountService: AccountService,
        @InjectRepository(Account)
        private accountRepo: Repository<Account>,
        private jwtService: JwtService,
    ) { }

    private getJwtAccessToken(payloadJwt: JWTAccount) {
        const token = this.jwtService.sign(payloadJwt);
        return token;
      }

    async signIn(payload: AuthDto) {
        const { email, password } = payload;
        try {
            const account = await this.accountRepo.findOne({
                select: ['id', 'member_id', 'email', 'secure_password', 'is_admin', 'admin_auth_index'],
                where: { email }
            })
            const isMatch = await compare(password, account.secure_password);

            if (account && isMatch) {
                let jwtPayload: JWTAccount = {
                    id: account.id,
                    email: account.email,
                    is_admin: account.is_admin,
                    admin_auth_index: account.admin_auth_index
                };

                const token: string = this.getJwtAccessToken(jwtPayload);
                let exp = moment.tz('Asia/Jakarta').add(5, 'hours').unix();

                return {
                    token,
                    exp
                }
            } else {
                throw new UnauthorizedException('INVALID_LOGIN_CREDENTIAL')
            }
        } catch (error) {
            this.logger.error('SIGN_IN_ERR ' + error);
            throw new InternalServerErrorException(error);
        }
    }
}

