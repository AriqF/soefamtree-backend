import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { FamilyService } from '../family.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AddFamilyMemberDto, FamilyTreeResponseDto } from '../dto/member.dto';
import { GetOneByIdDto } from 'src/common/dto/global-request.dto';

@ApiTags('API Admin - Family Module')
@Controller('admin/family')
export class FamilyAdminController {
  constructor(private readonly familyService: FamilyService) {}

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
  async addFamilyMember(@Body() body: AddFamilyMemberDto) {
    return await this.familyService.addMember(body);
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
    return await this.familyService.viewFamilyTreeV3(param.id);
  }
}
