import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  UpdateDateColumn,
} from "typeorm";
import { BotConfig } from "./types";

@Entity()
export class Config {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar")
  @Index("chat_id_idx", { unique: true })
  chatId: string;

  @Column("json")
  value: BotConfig;

  @Column("varchar", { nullable: true })
  @Index("token_address_idx", { unique: false })
  tokenAddress: string | null;

  @Column("boolean", { default: true, nullable: false })
  firstSync: boolean;

  @CreateDateColumn({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @UpdateDateColumn({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;
}
