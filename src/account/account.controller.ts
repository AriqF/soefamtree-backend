import { Body, Controller, ForbiddenException, Get, Post, UseGuards } from '@nestjs/common';
import { AccountService } from './account.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateAccountDto } from './dto/create-account.dto';
import AccountGuard from 'src/auth/account.guard';
import { GetAccount } from 'src/common/decorators/get-logged-in-entity.decorator';
import { Account } from 'src/models/account.entity';

@ApiTags('API Admin - Account Module')
@ApiBearerAuth('account-access-token')
@UseGuards(AccountGuard)
@Controller('admin/account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('me')
  async getMe(@GetAccount() acc: Account){
    return acc;
  }

  @Post()
  async createAccount(@Body() body: CreateAccountDto, @GetAccount() acc: Account){
    if(!acc.is_admin) throw new ForbiddenException('ADMIN_ACCESS_ONLY')
    return await this.accountService.createAccount(body)
  }

}
