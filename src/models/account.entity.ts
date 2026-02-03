import { Entity, PrimaryGeneratedColumn } from "typeorm";

export const ACCOUNT_TABLE = 'accounts';

@Entity(ACCOUNT_TABLE)
export class Account {
@PrimaryGeneratedColumn()
id: number;
}