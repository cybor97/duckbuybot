import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class PoolAddress {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar")
  @Index("pool_address_idx", { unique: false })
  address: string;

  @Column("varchar")
  @Index("pool_token_address_idx", { unique: false })
  tokenAddress: string;

  @CreateDateColumn({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @UpdateDateColumn({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;
}
