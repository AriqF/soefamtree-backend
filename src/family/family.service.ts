import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, MoreThan, Repository } from 'typeorm';
import { AddBulkFamilyMemberDto, AddFamilyMemberDto, FamilyTreeResponseDto, UpdateFamilyMemberDto } from './dto/member.dto';
import { Member } from 'src/models/member.entity';
import { MemberParent, ParentRelation } from 'src/models/member-parent.entity';
import { MemberDetail } from 'src/models/member-detail.entity';
import { MemberClosure } from 'src/models/member-closure.entity';
import { FamilyResponse } from './family.interface';

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
  ) { }

  /**
   * TODO:
   * - photo url pakai apa?
   * - migrasi dan testing
   */
  async addMember(body: AddFamilyMemberDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

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

  async addBulkMembers(body: AddBulkFamilyMemberDto) {
    try {
      let membersAdded = 0
      for (const element of body.data) {
        await this.addMember(element);
        membersAdded++
      }
      return {
        added: membersAdded
      }
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error)
    }
  }

  /**
   * Update a family member with proper handling of:
   * - Basic member information
   * - Member details
   * - Spouse relationship (bidirectional)
   * - Parent relationships (father/mother) with closure table recalculation
   */
  async updateMember(memberId: number, body: UpdateFamilyMemberDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // 1. Check if member exists
      const existingMember = await queryRunner.manager.findOne(Member, {
        where: { id: memberId },
        relations: ['parents', 'detail'],
      });

      if (!existingMember) {
        throw new BadRequestException(`Member with ID ${memberId} not found`);
      }

      // 2. Handle spouse update
      if (body.spouse_id !== undefined) {
        await this.handleSpouseUpdate(
          queryRunner,
          memberId,
          existingMember.spouse_id,
          body.spouse_id,
        );
      }

      // 3. Update basic member information
      const memberUpdateData: Partial<Member> = {};
      if (body.fullname !== undefined) memberUpdateData.fullname = body.fullname;
      if (body.nickname !== undefined) memberUpdateData.nickname = body.nickname;
      if (body.gender !== undefined) memberUpdateData.gender = body.gender;
      if (body.birth_date !== undefined)
        memberUpdateData.birth_date = body.birth_date as any;
      if (body.death_date !== undefined)
        memberUpdateData.death_date = body.death_date as any;
      if (body.photo_url !== undefined)
        memberUpdateData.photo_url = body.photo_url;
      if (body.bio !== undefined) memberUpdateData.bio = body.bio;
      if (body.spouse_id !== undefined)
        memberUpdateData.spouse_id = body.spouse_id;

      if (Object.keys(memberUpdateData).length > 0) {
        await queryRunner.manager.update(Member, { id: memberId }, memberUpdateData);
      }

      // 4. Update member details
      if (body.detail) {
        const detailUpdateData: Partial<MemberDetail> = {};
        if (body.detail.profession !== undefined)
          detailUpdateData.profession = body.detail.profession;
        if (body.detail.domicile !== undefined)
          detailUpdateData.domicile = body.detail.domicile;
        if (body.detail.full_address !== undefined)
          detailUpdateData.full_address = body.detail.full_address;
        if (body.detail.whatsapp_number !== undefined)
          detailUpdateData.whatsapp_number = body.detail.whatsapp_number;
        if (body.detail.instagram_handle !== undefined)
          detailUpdateData.instagram_handle = body.detail.instagram_handle;

        if (Object.keys(detailUpdateData).length > 0) {
          await queryRunner.manager.update(
            MemberDetail,
            { member_id: memberId },
            detailUpdateData,
          );
        }
      }

      // 5. Handle parent updates (father and/or mother)
      const hasParentUpdate =
        body.father_id !== undefined || body.mother_id !== undefined;

      if (hasParentUpdate) {
        await this.handleParentUpdate(
          queryRunner,
          memberId,
          existingMember.parents,
          body.father_id,
          body.mother_id,
        );
      }

      await queryRunner.commitTransaction();

      return { message: 'Member updated successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('UPDATE_MEMBER_ERR ' + error.message);
      if (error instanceof HttpException) throw error;
      else throw new InternalServerErrorException(error);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Handle spouse update with bidirectional relationship
   */
  private async handleSpouseUpdate(
    queryRunner: any,
    memberId: number,
    oldSpouseId: number | null,
    newSpouseId: number | null,
  ) {
    // Remove old spouse relationship
    if (oldSpouseId && oldSpouseId !== newSpouseId) {
      await queryRunner.manager.update(
        Member,
        { id: oldSpouseId },
        { spouse_id: null },
      );
    }

    // Add new spouse relationship
    if (newSpouseId) {
      const newSpouse = await queryRunner.manager.findOne(Member, {
        where: { id: newSpouseId },
        select: ['id', 'spouse_id'],
      });

      if (!newSpouse) {
        throw new BadRequestException(
          `Spouse with ID ${newSpouseId} not found`,
        );
      }

      // Check if new spouse already has a different spouse
      if (newSpouse.spouse_id && newSpouse.spouse_id !== memberId) {
        throw new BadRequestException(
          `Cannot assign spouse to someone who already has a spouse`,
        );
      }

      // Update new spouse to point back to this member
      if (newSpouse.spouse_id !== memberId) {
        await queryRunner.manager.update(
          Member,
          { id: newSpouseId },
          { spouse_id: memberId },
        );
      }
    }
  }

  /**
   * Handle parent update (father/mother) with closure table recalculation
   */
  private async handleParentUpdate(
    queryRunner: any,
    memberId: number,
    existingParents: MemberParent[],
    newFatherId: number | null | undefined,
    newMotherId: number | null | undefined,
  ) {
    // Get current father and mother
    const currentFather = existingParents.find(
      (p) => p.relation === ParentRelation.FATHER,
    );
    const currentMother = existingParents.find(
      (p) => p.relation === ParentRelation.MOTHER,
    );

    const fatherChanged =
      newFatherId !== undefined &&
      newFatherId !== currentFather?.parent_id;
    const motherChanged =
      newMotherId !== undefined &&
      newMotherId !== currentMother?.parent_id;

    if (!fatherChanged && !motherChanged) {
      return; // No changes needed
    }

    // If parents are changing, we need to recalculate the entire closure tree
    // for this member and all their descendants

    // Step 1: Remove old parent relationships if they're changing
    if (fatherChanged && currentFather) {
      await queryRunner.manager.delete(MemberParent, {
        child_id: memberId,
        parent_id: currentFather.parent_id,
        relation: ParentRelation.FATHER,
      });
    }

    if (motherChanged && currentMother) {
      await queryRunner.manager.delete(MemberParent, {
        child_id: memberId,
        parent_id: currentMother.parent_id,
        relation: ParentRelation.MOTHER,
      });
    }

    // Step 2: Add new parent relationships
    const newParents: MemberParent[] = [];

    if (newFatherId !== undefined && newFatherId !== null) {
      newParents.push(
        queryRunner.manager.create(MemberParent, {
          child_id: memberId,
          parent_id: newFatherId,
          relation: ParentRelation.FATHER,
        }),
      );
    }

    if (newMotherId !== undefined && newMotherId !== null) {
      newParents.push(
        queryRunner.manager.create(MemberParent, {
          child_id: memberId,
          parent_id: newMotherId,
          relation: ParentRelation.MOTHER,
        }),
      );
    }

    if (newParents.length > 0) {
      await queryRunner.manager.save(MemberParent, newParents);
    }

    // Step 3: Recalculate closure table for this member and all descendants
    await this.recalculateClosureForSubtree(queryRunner, memberId);
  }

  /**
   * Recalculate closure table for a member and all their descendants
   * This is needed when parent relationships change
   */
  private async recalculateClosureForSubtree(
    queryRunner: any,
    memberId: number,
  ) {
    // Get all descendants of this member (including the member itself)
    const descendants = await queryRunner.manager.find(MemberClosure, {
      where: { ancestor_id: memberId },
    });

    const descendantIds = descendants.map((d: MemberClosure) => d.descendant_id);

    // Delete all closure records where descendant is in our subtree
    // EXCEPT the self-referencing records (depth = 0)
    if (descendantIds.length > 0) {
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(MemberClosure)
        .where('descendant_id IN (:...ids)', { ids: descendantIds })
        .andWhere('depth > 0')
        .execute();
    }

    // Rebuild closure records for each descendant
    for (const descendantId of descendantIds) {
      await this.rebuildClosureForMember(queryRunner, descendantId);
    }
  }

  /**
   * Rebuild closure records for a single member based on their parents
   */
  private async rebuildClosureForMember(queryRunner: any, memberId: number) {
    // Get this member's parents
    const parents = await queryRunner.manager.find(MemberParent, {
      where: { child_id: memberId },
    });

    if (parents.length === 0) {
      return; // No parents, no closure records to add (except self which already exists)
    }

    const closureMap = new Map<string, Partial<MemberClosure>>();

    for (const p of parents) {
      const parentId = p.parent_id;

      // Add direct parent relationship
      const directParentKey = `${parentId}-${memberId}`;
      closureMap.set(directParentKey, {
        ancestor_id: parentId,
        descendant_id: memberId,
        depth: 1,
      });

      // Add all ancestors of the parent
      const parentAncestors = await queryRunner.manager.find(MemberClosure, {
        where: { descendant_id: parentId },
      });

      for (const pa of parentAncestors) {
        const key = `${pa.ancestor_id}-${memberId}`;
        const newDepth = pa.depth + 1;

        if (!closureMap.has(key) || closureMap.get(key)!.depth! > newDepth) {
          closureMap.set(key, {
            ancestor_id: pa.ancestor_id,
            descendant_id: memberId,
            depth: newDepth,
          });
        }
      }
    }

    const closureToInsert = Array.from(closureMap.values());
    if (closureToInsert.length > 0) {
      await queryRunner.manager.insert(MemberClosure, closureToInsert);
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

  async viewFamilyTree(ancestorId: number) {
    try {
      // Get all descendants of the ancestor from closure table
      const closureRecords: { mc_descendant_id: number, mc_depth: number }[] = await this.memberClosureRepo
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

      console.log(closureRecords)
      const descendantMaps = new Map<number, number>(closureRecords.map((c) => [c.mc_descendant_id, c.mc_depth]))
      const descendantIds = closureRecords.map((r) => r.mc_descendant_id);

      // Get all members with their relationships
      const members = await this.memberRepo
        .createQueryBuilder('m')
        .leftJoinAndSelect('m.parents', 'parentRel')
        .leftJoinAndSelect('m.children', 'childRel')
        .leftJoinAndSelect('m.detail', 'detail')
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
          .leftJoinAndSelect('m.detail', 'detail')
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

        const memberData: FamilyResponse = {
          id: member.id.toString(),
          fullname: member.fullname,
          nickname: member.nickname,
          domicile: member.detail?.domicile ?? null,
          gender: member.gender,
          birthDate: member.birth_date,
          photoUrl: member.photo_url,
          depth: descendantMaps.get(member.id) ?? null,
          spouseId: null,
          deathDate: null,
          parentIds: [],
          childrenIds: []
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

  async findOneMemberById(memberId: number) {
    try {
      return await this.memberRepo.findOne({ where: { id: memberId } })
    } catch (error) {
      this.logger.error('FIND_ONE_MEMBER_ERR ' + error);
      throw new InternalServerErrorException(error);
    }
  }

  async getOneMemberDetail(memberId: number) {
    try {
      const member = await this.memberRepo.createQueryBuilder('m')
        .leftJoin('m.detail', 'dtl')
        .select(['m.id', 'm.fullname', 'm.nickname', 'm.gender', 'm.birth_date',
          'm.death_date', 'm.photo_url', 'm.bio', 'dtl.profession', 'dtl.domicile',
          'dtl.full_address', 'dtl.whatsapp_number',
        ])
        .where('m.id = :mid', { mid: memberId })
        .getOne();
      if (!member) throw new NotFoundException('NOT_FOUND');
      return member;
    } catch (error) {
      this.logger.error('GET_MEMBER_DETAIL_ERR ' + error);
      throw new InternalServerErrorException(error);
    }
  }
}
