import { Module } from '@nestjs/common';
import { FamilyService } from './family.service';
import { FamilyController } from './controllers/family.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from 'src/models/member.entity';
import { MemberClosure } from 'src/models/member-closure.entity';
import { MemberDetail } from 'src/models/member-detail.entity';
import { MemberParent } from 'src/models/member-parent.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Member,
      MemberClosure,
      MemberDetail,
      MemberParent,
    ]),
  ],
  controllers: [FamilyController],
  providers: [FamilyService],
})
export class FamilyModule {}
