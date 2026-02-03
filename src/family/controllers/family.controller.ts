import { Controller, Get, Param } from '@nestjs/common';
import { FamilyService } from '../family.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetOneByIdDto } from 'src/common/dto/global-request.dto';
import { FamilyTreeResponseDto } from '../dto/member.dto';

@ApiTags('API User - Family Module')
@Controller('family')
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

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
    return await this.familyService.viewFamilyTree(+param.id);
  }

  @Get('member/:id')
  @ApiOperation({
    summary: 'Get a member detail',
  })
  @ApiResponse({
    status: 200,
    description: 'Family tree successfully retrieved',
    type: FamilyTreeResponseDto,
  })
  async getMemberDetail(@Param() param: GetOneByIdDto){
    return await this.familyService.getOneMemberDetail(+param.id)
  }
}
