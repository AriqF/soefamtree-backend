import { Controller } from '@nestjs/common';
import { FamilyService } from '../family.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('API User - Family Module')
@Controller('family')
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}
}
