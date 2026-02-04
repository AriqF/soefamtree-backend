import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from 'src/models/account.entity';
import { FamilyModule } from 'src/family/family.module';

@Module({
  imports:[
    TypeOrmModule.forFeature([Account]),
    FamilyModule
  ],
  controllers: [AccountController],
  providers: [AccountService],
  exports: [AccountService]
})
export class AccountModule {}
