import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class Holder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("varchar")
  @Index("address_idx", { unique: true })
  address: string;

  @Column("varchar")
  @Index("holder_token_address_idx", { unique: true })
  tokenAddress: string;

  @Column("varchar")
  balance: string;

  @CreateDateColumn({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @UpdateDateColumn({ type: "datetime", default: () => "CURRENT_TIMESTAMP" })
  updatedAt: Date;
}
