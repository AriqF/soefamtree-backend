import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { MemberClosure } from './member-closure.entity';
import { MemberParent } from './member-parent.entity';

export const MEMBER_TABLE = 'members';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

@Entity(MEMBER_TABLE)
@Index('birth_date')
@Index('spouse_id')
@Index('deleted_at')
export class Member {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  fullname: string;

  @Column({ type: 'varchar' })
  nickname: string;

  @Column({ type: 'varchar' })
  gender: Gender;

  @Column({ type: 'date' })
  birth_date: Date;

  @Column({ type: 'date', nullable: true })
  death_date: Date | null;

  @Column({ type: 'text', nullable: true })
  photo_url: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ nullable: true })
  spouse_id: number | null;

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn({ name: 'spouse_id' })
  spouse: Member | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;

  // Relations
  @OneToMany(() => MemberParent, (memberParent) => memberParent.child)
  parents: MemberParent[];

  @OneToMany(() => MemberParent, (memberParent) => memberParent.parent)
  children: MemberParent[];

  @OneToMany(() => MemberClosure, (closure) => closure.ancestor)
  descendants: MemberClosure[];

  @OneToMany(() => MemberClosure, (closure) => closure.descendant)
  ancestors: MemberClosure[];
}
