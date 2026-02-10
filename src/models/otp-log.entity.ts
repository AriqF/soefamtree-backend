import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


export const LOG_OTP_TABLE = 'log_otp'
@Entity(LOG_OTP_TABLE)
@Index(['email', 'is_verified', 'expires_at'])
export class LogOTP {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar' })
    email: string;

    @Column({ length: 6, type: 'varchar' })
    otp: string;

    @Column({ type: 'boolean', default: false })
    is_verified: boolean;

    @Column({
        type: 'timestamp',
        nullable: true,
    })
    verified_at: Date;

    @Column({ type: 'int', default: 1 })
    attempt: number;

    @Column({
        type: 'timestamp',
    })
    expires_at: Date;

    @Column({ type: 'text', nullable: true })
    user_agent: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date | null;
}