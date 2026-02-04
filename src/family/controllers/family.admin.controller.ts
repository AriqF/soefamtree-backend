import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { FamilyService } from '../family.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AddBulkFamilyMemberDto, AddFamilyMemberDto, FamilyTreeResponseDto, UpdateFamilyMemberDto } from '../dto/member.dto';
import { GetOneByIdDto } from 'src/common/dto/global-request.dto';
import AccountGuard from 'src/auth/account.guard';
import { GetAccount } from 'src/common/decorators/get-logged-in-entity.decorator';
import { Account } from 'src/models/account.entity';

@ApiTags('API Admin - Family Module')
@ApiBearerAuth('account-access-token')
@UseGuards(AccountGuard)
@Controller('admin/family')
export class FamilyAdminController {
  constructor(private readonly familyService: FamilyService) { }

  @Post()
  @ApiOperation({
    summary: 'Add a new family member',
    description:
      'Creates a new family member with optional parent and spouse relationships',
  })
  @ApiResponse({
    status: 201,
    description: 'Family member successfully created',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async addFamilyMember(@GetAccount() acc: Account, @Body() body: AddFamilyMemberDto) {
    if (!acc.is_admin) throw new ForbiddenException('ADMIN_ACCESS_ONLY')
    return await this.familyService.addMember(body);
  }

  @Post('bulk')
  @ApiOperation({
    summary: 'Add a new family member',
    description:
      'Creates bulk family members',
  })
  @ApiResponse({
    status: 201,
    description: 'Family member successfully created',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async addBulkFamilyMember(@GetAccount() acc: Account, @Body() body: AddBulkFamilyMemberDto) {
    if (!acc.is_admin) throw new ForbiddenException('ADMIN_ACCESS_ONLY')
    return await this.familyService.addBulkMembers(body);
  }

  @Get('tree/:id')
  @ApiOperation({
    summary: 'Get complete family tree',
    description:
      'Returns the entire family tree organized by generations, from oldest ancestors to youngest descendants',
  })
  @ApiResponse({
    status: 200,
    description: 'Family tree successfully retrieved',
    type: FamilyTreeResponseDto,
  })
  async getFamilyTree(@Param() param: GetOneByIdDto) {
    return await this.familyService.viewFamilyTree(param.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a family member',
    description:
      'Updates a family member including their basic info, details, spouse, and parent relationships. ' +
      'When updating parents, the closure table is automatically recalculated for proper ancestry tracking. ' +
      'Spouse relationships are bidirectional - updating one member\'s spouse will also update the spouse\'s relationship.',
  })
  @ApiResponse({
    status: 200,
    description: 'Family member successfully updated',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or member not found' })
  async updateFamilyMember(
    @GetAccount() acc: Account,
    @Param() param: GetOneByIdDto,
    @Body() body: UpdateFamilyMemberDto,
  ) {
    if (!acc.is_admin) throw new ForbiddenException('ADMIN_ACCESS_ONLY')

    return await this.familyService.updateMember(param.id, body);
  }
}
