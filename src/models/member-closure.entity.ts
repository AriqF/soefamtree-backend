import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Member } from './member.entity';

export const MEMBER_CLOSURE_TABLE = 'member_closure';

@Entity(MEMBER_CLOSURE_TABLE)
@Index('descendant_id')
@Index('depth')
export class MemberClosure {
  @Column({ primary: true })
  ancestor_id: number;

  @Column({ primary: true })
  descendant_id: number;

  @Column({ type: 'int' })
  depth: number;

  @ManyToOne(() => Member, (member) => member.descendants)
  @JoinColumn({ name: 'ancestor_id' })
  ancestor: Member;

  @ManyToOne(() => Member, (member) => member.ancestors)
  @JoinColumn({ name: 'descendant_id' })
  descendant: Member;
}
