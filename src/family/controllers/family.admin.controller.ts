import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { FamilyService } from '../family.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AddBulkFamilyMemberDto, AddFamilyDto, AddFamilyMemberDto, FamilyTreeResponseDto, UpdateFamilyMemberDto } from '../dto/member.dto';
import { GetOneByIdDto } from 'src/common/dto/global-request.dto';

@ApiTags('API Admin - Family Module')
@Controller('admin/family')
export class FamilyAdminController {
  constructor(private readonly familyService: FamilyService) {}

  @Post()
  @ApiOperation({
    summary: 'Add a new family',
    description:
      'Creates a new family member with optional parent and spouse relationships',
  })
  @ApiResponse({
    status: 201,
    description: 'Family member successfully created',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async addFamily(@Body() body: AddFamilyDto) {
    return await this.familyService.addFamily(body);
  }

  @Post('member')
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
  async addFamilyMember(@Body() body: AddFamilyMemberDto) {
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
  async addBulkFamilyMember(@Body() body: AddBulkFamilyMemberDto) {
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
    @Param() param: GetOneByIdDto,
    @Body() body: UpdateFamilyMemberDto,
  ) {
    return await this.familyService.updateMember(param.id, body);
  }
}
