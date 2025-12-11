import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Member } from './member.entity';

export const MEMBER_DETAIL_TABLE = 'member_details';

@Entity(MEMBER_DETAIL_TABLE)
@Index(['deleted_at', 'member_id'])
export class MemberDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  member_id: number;

  @Column({ type: 'varchar', nullable: true })
  profession: string | null;

  @Column({ type: 'varchar', nullable: true })
  domicile: string | null;

  @Column({ type: 'varchar', nullable: true })
  full_address: string | null;

  @Column({
    type: 'varchar',
    nullable: true,
    comment: 'format 628xxx',
  })
  whatsapp_number: string | null;

  @Column({
    type: 'varchar',
    nullable: true,
    comment: 'without @',
  })
  instagram_handle: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'member_id' })
  member: Member;
}
