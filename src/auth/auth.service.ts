import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountService } from 'src/account/account.service';
import { AuthDto, AuthOTPDto, AuthRequestOTPDto } from './dto/auth.dto';
import { compare } from 'bcrypt';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { Account } from 'src/models/account.entity';
import { JWTAccount } from './common/auth.interface';
import { JwtService } from '@nestjs/jwt';
import moment from 'moment-timezone';
import { MailService } from 'src/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { randomInt } from 'crypto';
import { LogOTP } from 'src/models/otp-log.entity';


@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    /**OTP expiration in minute */
    private readonly OTP_EXPIRATION: number = 5;
    private readonly MAX_OTP_ATTEMPT: number = 5;

    constructor(
        private accountService: AccountService,
        @InjectRepository(Account)
        private accountRepo: Repository<Account>,
        private jwtService: JwtService,
        private readonly mailService: MailService,
        private readonly configService: ConfigService,
        @InjectRepository(LogOTP)
        private logOTPRepo: Repository<LogOTP>,
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

    async requestOTP(payload: AuthRequestOTPDto) {
        try {
            //room improvement: add limiter once redis service available
            const acc = await this.accountRepo.findOne({ where: { email: payload.email }, select: ['email'] })
            if (!acc) return 'OK'; //not letting requestor account found or not
            const otp = this.generateOtpCode();

            await this.logOTPRepo.insert({
                email: payload.email,
                otp,
                expires_at: new Date(new Date().getTime() + this.OTP_EXPIRATION * 60 * 1000),
            })

            await this.mailService.send({
                to: [acc.email],
                subject: 'Kode OTP Autentikasi DjonHub',
                template: 'otp-code',
                body: {
                    otp
                }
            });

            return 'OK';
        } catch (error) {
            this.logger.error('REQUEST_OTP_ERR ' + error.message);
            throw new InternalServerErrorException(error);
        }
    }

    async verifyOTP(payload: AuthOTPDto) {
        try {
            const record = await this.logOTPRepo.findOne({
                select: ['id', 'email', 'otp', 'attempt', 'is_verified', 'verified_at', 'expires_at'],
                where: { email: payload.email, is_verified: false, expires_at: MoreThan(new Date()) }
            });
            if (!record) throw new NotFoundException('NOT_FOUND');
            if(record.attempt >= this.MAX_OTP_ATTEMPT){
                //TODO: how to block account for requesting otp for 1 hours w/out redis
            }

            if (record.otp !== payload.otp) {
                await this.logOTPRepo.increment(
                    {
                        id: record.id,
                    },
                    'attempt',
                    1,
                );
                throw new BadRequestException(
                    `INVALID_OTP ${record.attempt}/${this.MAX_OTP_ATTEMPT}`,
                );
            }


            await this.logOTPRepo.update(record.id, {
                verified_at: new Date(),
                is_verified: true,
            });

            const account = await this.accountRepo.findOne({ 
                where: { email: record.email }, 
                select: ['id', 'email', 'is_admin', 'admin_auth_index'] 
            })

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
        } catch (error) {
            this.logger.error('VERIFY_OTP_ERR ' + error.message);
            if(error instanceof HttpException) throw error;
            throw new InternalServerErrorException(error);
        }
    }

    private generateOtpCode(): string {
        const otp = randomInt(0, 1_000_000);
        return otp.toString().padStart(6, '0');
    }
}

