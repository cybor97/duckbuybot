import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class Ticker {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar")
  @Index("ticker_token_address_idx", { unique: true })
  tokenAddress: string;

  @Column("varchar", { nullable: true })
  conmarketcapId: string | null;

  @Column("varchar", { nullable: true })
  value: string | null;

  @CreateDateColumn({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @UpdateDateColumn({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;
}
