import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, MoreThan, Repository } from 'typeorm';
import { AddFamilyMemberDto, FamilyTreeResponseDto } from './dto/member.dto';
import { Member } from 'src/models/member.entity';
import { MemberParent, ParentRelation } from 'src/models/member-parent.entity';
import { MemberDetail } from 'src/models/member-detail.entity';
import { MemberClosure } from 'src/models/member-closure.entity';

@Injectable()
export class FamilyService {
  private readonly logger = new Logger(FamilyService.name);
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Member)
    private readonly memberRepo: Repository<Member>,
    @InjectRepository(MemberClosure)
    private readonly memberClosureRepo: Repository<MemberClosure>,
    @InjectRepository(MemberDetail)
    private readonly memberDetailRepo: Repository<MemberDetail>,
    @InjectRepository(MemberParent)
    private readonly memberParentRepo: Repository<MemberParent>,
  ) {}

  /**
   * TODO:
   * - photo url pakai apa?
   * - migrasi dan testing
   */
  async addMember(body: AddFamilyMemberDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      queryRunner.startTransaction();

      let spouse: Member | null = null;
      if (body.spouse_id) {
        spouse = await queryRunner.manager.findOne(Member, {
          where: { id: body.spouse_id },
          select: ['id', 'spouse_id'],
        });
        if (spouse?.spouse)
          throw new BadRequestException(
            `Cannot assign spouse to someone already have spouse`,
          );
      }

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

      if (spouse && spouse.spouse_id == null) {
        await queryRunner.manager.update(
          Member,
          { id: spouse.id },
          { spouse_id: member.id, spouse: { id: member.id } },
        );
      } else if (spouse && spouse.spouse_id) {
        throw new BadRequestException(
          `Cannot assign spouse to someone already have spouse`,
        );
      }

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

      const closureMap = new Map<string, Partial<MemberClosure>>();

      for (const p of parents) {
        this.logger.debug(`inserting closure for parent id ${p.parent_id}`);
        const parentId = p.parent_id;

        const directParentKey = `${parentId}-${member.id}`;
        closureMap.set(directParentKey, {
          ancestor_id: parentId,
          descendant_id: member.id,
          depth: 1,
        });

        const parentAncestors = await queryRunner.manager.find(MemberClosure, {
          where: { descendant_id: parentId },
        });

        for (const pa of parentAncestors) {
          const key = `${pa.ancestor_id}-${member.id}`;
          const newDepth = pa.depth + 1;

          if (!closureMap.has(key) || closureMap.get(key)!.depth! > newDepth) {
            closureMap.set(key, {
              ancestor_id: pa.ancestor_id,
              descendant_id: member.id,
              depth: newDepth,
            });
          }
        }
      }

      const closureToInsert = Array.from(closureMap.values());
      if (closureToInsert.length > 0)
        await queryRunner.manager.insert(MemberClosure, closureToInsert);

      await queryRunner.commitTransaction();

      return 'OK';
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('ADD_FAMILY_ERR ' + error.message);
      if (error instanceof HttpException) throw error;
      else throw new InternalServerErrorException(error);
    } finally {
      await queryRunner.release();
    }
  }

  async viewFamilyTree(): Promise<FamilyTreeResponseDto> {
    try {
      // Get all members with their relationships
      const members = await this.memberRepo
        .createQueryBuilder('member')
        .leftJoinAndSelect('member.parents', 'parentRel')
        .leftJoinAndSelect('parentRel.parent', 'parent')
        .leftJoinAndSelect('member.children', 'childRel')
        .leftJoinAndSelect('childRel.child', 'child')
        .orderBy('member.birth_date', 'ASC')
        .getMany();

      // Get the max depth from closure table to determine number of generations
      const maxDepthResult = await this.memberClosureRepo
        .createQueryBuilder('mc')
        .select('MAX(mc.depth)', 'maxDepth')
        .getRawOne();

      const maxDepth = maxDepthResult?.maxDepth ?? 0;

      // For each member, calculate their generation level
      // Generation is determined by the max depth from root ancestors
      const memberGenerations = new Map<number, number>();

      for (const member of members) {
        // Find the maximum depth where this member is an ancestor
        // This tells us how many generations down from them (how deep their lineage goes)
        const depthResult = await this.memberClosureRepo
          .createQueryBuilder('mc')
          .select('MAX(mc.depth)', 'memberDepth')
          .where('mc.ancestor_id = :memberId', { memberId: member.id })
          .getRawOne();

        const memberDepth = depthResult?.memberDepth ?? 0;
        // Generation level: older ancestors have higher depth values (more descendants)
        // We invert it so oldest = level 0
        const generationLevel = maxDepth - memberDepth;
        memberGenerations.set(member.id, generationLevel);
      }

      // Group members by generation
      const generationMap = new Map<number, any[]>();

      for (const member of members) {
        const generation = memberGenerations.get(member.id) ?? 0;

        // Extract parent IDs
        const fatherRel = member.parents?.find(
          (p) => p.relation === ParentRelation.FATHER,
        );
        const motherRel = member.parents?.find(
          (p) => p.relation === ParentRelation.MOTHER,
        );

        // Extract children IDs
        const childrenIds = member.children?.map((c) => c.child_id) ?? [];

        const memberData = {
          id: member.id,
          fullname: member.fullname,
          nickname: member.nickname,
          gender: member.gender,
          birth_date: member.birth_date,
          death_date: member.death_date,
          photo_url: member.photo_url,
          bio: member.bio,
          spouse_id: member.spouse_id ?? null,
          father_id: fatherRel?.parent_id ?? null,
          mother_id: motherRel?.parent_id ?? null,
          children_ids: childrenIds.length > 0 ? childrenIds : null,
        };

        if (!generationMap.has(generation)) {
          generationMap.set(generation, []);
        }
        generationMap.get(generation)!.push(memberData);
      }

      // Sort generations and create the final response
      const sortedGenerations = Array.from(generationMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([level, members]) => ({
          level,
          label: this.getGenerationLabel(level, maxDepth),
          members: members.sort((a, b) => {
            // Sort by birth_date within generation
            const dateA = new Date(a.birth_date).getTime();
            const dateB = new Date(b.birth_date).getTime();
            return dateA - dateB;
          }),
        }));

      return {
        generations: sortedGenerations,
        total_members: members.length,
        total_generations: sortedGenerations.length,
      };
    } catch (error) {
      this.logger.error('VIEW_FAMILY_TREE_ERR: ' + error.message);
      throw new InternalServerErrorException(error);
    }
  }

  private getGenerationLabel(level: number, maxDepth: number): string {
    // Calculate how many generations down from the root
    const generationsFromRoot = level;

    if (generationsFromRoot === 0) {
      return maxDepth >= 4
        ? 'Great-Great-Grandparents'
        : maxDepth >= 3
          ? 'Great-Grandparents'
          : maxDepth >= 2
            ? 'Grandparents'
            : 'Parents';
    } else if (generationsFromRoot === 1) {
      return maxDepth >= 3
        ? 'Great-Grandparents'
        : maxDepth >= 2
          ? 'Grandparents'
          : 'Parents';
    } else if (generationsFromRoot === 2) {
      return maxDepth >= 2 ? 'Grandparents' : 'Parents';
    } else if (generationsFromRoot === 3) {
      return 'Parents Generation';
    } else if (generationsFromRoot === maxDepth - 1) {
      return 'Current Generation';
    } else if (generationsFromRoot === maxDepth) {
      return 'Children';
    } else {
      return `Generation ${generationsFromRoot}`;
    }
  }

  async viewFamilyTreeV2(ancestorId: number) {
    try {
      const result = await this.memberClosureRepo
        .createQueryBuilder('mc')
        .leftJoin('mc.descendant', 'm')
        .leftJoin('m.spouse', 's')
        .select(['m', 'mc.depth', 's'])
        .where('mc.ancestor_id = :aid', { aid: ancestorId })
        .andWhere('mc.depth IN (0, 1)')
        .orderBy('mc.depth', 'ASC')
        .getMany();
      return result;

      // return rootAncestors.map((r) => r.ancestor_id);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }

  async viewFamilyTreeV3(ancestorId: number) {
    try {
      // Get all descendants of the ancestor from closure table
      const closureRecords = await this.memberClosureRepo
        .createQueryBuilder('mc')
        .select(['mc.descendant_id', 'mc.depth'])
        .where('mc.ancestor_id = :a', { a: ancestorId })
        .getRawMany();

      if (closureRecords.length === 0) {
        return {
          rootId: ancestorId.toString(),
          members: [],
        };
      }

      const descendantIds = closureRecords.map((r) => r.mc_descendant_id);

      // Get all members with their relationships
      const members = await this.memberRepo
        .createQueryBuilder('m')
        .leftJoinAndSelect('m.parents', 'parentRel')
        .leftJoinAndSelect('m.children', 'childRel')
        .where('m.id IN (:...ids)', { ids: descendantIds })
        .getMany();

      // Collect all spouse IDs from the descendants
      const spouseIds = members
        .filter((m) => m.spouse_id !== null)
        .map((m) => m.spouse_id as number)
        .filter((id) => !descendantIds.includes(id)); // Only get spouses not already in descendants

      // Fetch spouses if there are any
      let spouses: Member[] = [];
      if (spouseIds.length > 0) {
        spouses = await this.memberRepo
          .createQueryBuilder('m')
          .leftJoinAndSelect('m.parents', 'parentRel')
          .leftJoinAndSelect('m.children', 'childRel')
          .where('m.id IN (:...ids)', { ids: spouseIds })
          .getMany();
      }

      // Combine descendants and spouses
      const allMembers = [...members, ...spouses];

      // Transform to the desired format
      const membersResponse = allMembers.map((member) => {
        // Get parent IDs
        const parentIds =
          member.parents?.map((p) => p.parent_id.toString()) ?? [];

        // Get children IDs
        const childrenIds =
          member.children?.map((c) => c.child_id.toString()) ?? [];

        // Split fullname into first and last name (adjust this logic as needed)
        const nameParts = member.fullname.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName =
          nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        const memberData: any = {
          id: member.id.toString(),
          firstName: firstName,
          lastName: lastName,
          gender: member.gender,
          birthDate: member.birth_date,
          photoUrl: member.photo_url,
          bio: member.bio,
        };

        // Add optional fields only if they exist
        if (member.death_date) {
          memberData.deathDate = member.death_date;
        }

        if (member.spouse_id) {
          memberData.spouseId = member.spouse_id.toString();
        }

        if (parentIds.length > 0) {
          memberData.parentIds = parentIds;
        }

        if (childrenIds.length > 0) {
          memberData.childrenIds = childrenIds;
        }

        return memberData;
      });

      return {
        rootId: ancestorId.toString(),
        members: membersResponse,
      };
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }
}
