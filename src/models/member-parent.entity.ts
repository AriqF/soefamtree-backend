import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Member } from './member.entity';

// MemberParent Entity
export const MEMBER_PARENT_TABLE = 'member_parents';

export enum ParentRelation {
  FATHER = 'father',
  MOTHER = 'mother',
}

@Entity(MEMBER_PARENT_TABLE)
@Index('parent_id')
export class MemberParent {
  @Column({ primary: true })
  child_id: number;

  @Column({ primary: true })
  parent_id: number;

  @Column({ type: 'varchar' })
  relation: ParentRelation;

  @ManyToOne(() => Member, (member) => member.parents)
  @JoinColumn({ name: 'child_id' })
  child: Member;

  @ManyToOne(() => Member, (member) => member.children)
  @JoinColumn({ name: 'parent_id' })
  parent: Member;
}
