import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Member } from "./member.entity";

export const ACCOUNT_TABLE = 'accounts';

@Index(['member_id'], { unique: true })
@Index(['email'], { unique: true })
@Entity(ACCOUNT_TABLE)
export class Account {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    member_id: number;

    @Column({ nullable: false })
    email: string;

    @Column({ nullable: false, select: false })
    secure_password: string;

    @Column({ default: false, type: 'boolean' })
    is_admin: boolean;

    @Column({ default: 0, type: 'smallint' })
    admin_auth_index: number;

    @OneToOne(() => Member, (member) => member.id)
    @JoinColumn({ name: 'member_id' })
    member: Member;

    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;
  
    @DeleteDateColumn()
    deleted_at: Date | null;
}