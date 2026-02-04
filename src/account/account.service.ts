import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from 'src/models/account.entity';
import { Repository } from 'typeorm';
import { CreateAccountDto } from './dto/create-account.dto';
import { FamilyService } from 'src/family/family.service';
import { Member } from 'src/models/member.entity';
import {genSalt, hash} from 'bcrypt'

@Injectable()
export class AccountService {
    private readonly logger = new Logger(AccountService.name);
    constructor(
        @InjectRepository(Account)
        private accountRepo: Repository<Account>,
        private readonly familyService: FamilyService
    ){}

    async getOneByEmail(email: string){
        return await this.accountRepo.findOne({where: {email}})
    }

    async createAccount(payload: CreateAccountDto){
        try {
            let member: Member| null = null
            if(payload.member_id){
                member = await this.familyService.findOneMemberById(payload.member_id);
            }

            const salt = await genSalt();
            const hashed = await hash(payload.password, salt); 

            const account = await this.accountRepo.save({
                member_id: member?.id ?? null,
                email: payload.email,
                secure_password: hashed,
                is_admin: payload.is_admin,
                admin_auth_index: payload.admin_auth_index
            });

            return account;
        } catch (error) {
            this.logger.error('CREATE_ACCOUNT_ERR ' + error);
            throw new InternalServerErrorException(error);
        }
    }
}
