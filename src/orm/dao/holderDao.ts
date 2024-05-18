import { Repository } from "typeorm";
import AppDataSource from "..";
import { Holder } from "../entities/holder";

export class HolderDao {
  private holdersRepository: Repository<Holder>;
  private static dao: HolderDao;

  private constructor() {
    this.holdersRepository = AppDataSource.getRepository(Holder);
  }

  public static getDao(): HolderDao {
    if (!HolderDao.dao) {
      HolderDao.dao = new HolderDao();
    }
    return HolderDao.dao;
  }

  public async findOrUpdateHolder(
    tokenAddress: string,
    address: string,
    balance: string,
    lastLT: string | null,
  ): Promise<void> {
    const holder = await this.holdersRepository.findOne({ where: { address } });
    if (!holder) {
      const newHolder = new Holder();
      newHolder.tokenAddress = tokenAddress;
      newHolder.address = address;
      newHolder.balance = balance;
      newHolder.lastLT = lastLT;
      await this.holdersRepository.save(newHolder);
      return;
    }
    if (balance !== holder.balance) {
      holder.balance = balance;
      holder.lastLT = lastLT;
      await this.holdersRepository.save(holder);
    }
  }

  public async getAllHolders(tokenAddress: string): Promise<Holder[]> {
    return this.holdersRepository.find({
      where: { tokenAddress },
    });
  }

  public async setHoldersUpdated(tokenAddress: string): Promise<void> {
    await this.holdersRepository.update(
      { tokenAddress },
      { updatedAt: new Date() },
    );
  }
}
