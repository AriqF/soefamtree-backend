import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In } from 'typeorm';
import { AddFamilyMemberDto } from './dto/member.dto';
import { Member } from 'src/models/member.entity';
import { MemberParent, ParentRelation } from 'src/models/member-parent.entity';
import { MemberDetail } from 'src/models/member-detail.entity';
import { MemberClosure } from 'src/models/member-closure.entity';

@Injectable()
export class FamilyService {
  private readonly logger = new Logger(FamilyService.name);
  constructor(private readonly dataSource: DataSource) {}

  /**
   * TODO:
   * - photo url pakai apa?
   * - migrasi dan testing
   */
  async addMember(body: AddFamilyMemberDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      queryRunner.startTransaction();

      let member = queryRunner.manager.create(Member, {
        fullname: body.fullname,
        nickname: body.nickname,
        gender: body.gender,
        birth_date: body.birth_date,
        death_date: body.death_date ?? null,
        photo_url: body.photo_url ?? null,
        bio: body.bio ?? null,
        spouse: body.spouse_id ? { id: body.spouse_id } : null,
        spouse_id: body.spouse_id ?? null,
      });
      member = await queryRunner.manager.save(Member, member);

      let memberDetail = queryRunner.manager.create(MemberDetail, {
        profession: body.detail?.profession,
        domicile: body.detail?.domicile,
        full_address: body.detail?.full_address,
        whatsapp_number: body.detail?.whatsapp_number,
        instagram_handle: body.detail?.instagram_handle,
        member: { id: member.id },
        member_id: member.id,
      });

      await queryRunner.manager.insert(MemberDetail, memberDetail);

      let parentsToCreate: MemberParent[] = [];
      if (body.father_id) {
        parentsToCreate.push(
          queryRunner.manager.create(MemberParent, {
            child: { id: member.id },
            child_id: member.id,
            parent: { id: body.father_id },
            parent_id: body.father_id,
            relation: ParentRelation.FATHER,
          }),
        );
      }

      if (body.mother_id) {
        parentsToCreate.push(
          queryRunner.manager.create(MemberParent, {
            child: { id: member.id },
            child_id: member.id,
            parent: { id: body.mother_id },
            parent_id: body.mother_id,
            relation: ParentRelation.MOTHER,
          }),
        );
      }

      let parents = await queryRunner.manager.save(parentsToCreate);

      await queryRunner.manager.insert(MemberClosure, {
        ancestor_id: member.id,
        descendant_id: member.id,
        depth: 0,
      });

      for (const p of parents) {
        const parentId = p.parent_id;

        await queryRunner.manager.insert(MemberClosure, {
          ancestor_id: parentId,
          descendant_id: member.id,
          depth: 1,
        });

        const parentAncestors = await queryRunner.manager.find(MemberClosure, {
          where: { descendant_id: parentId },
        });
        const closureToInsert = parentAncestors.map(
          (pa) =>
            ({
              ancestor_id: pa.ancestor_id,
              descendant_id: member.id,
              depth: pa.depth + 1,
            }) as Partial<MemberClosure>,
        );

        if (closureToInsert.length > 0)
          await queryRunner.manager.insert(MemberClosure, closureToInsert);
      }

      await queryRunner.commitTransaction();

      return 'OK';
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('ADD_FAMILY_ERR ' + error.message);
    } finally {
      await queryRunner.release();
    }
  }
}
