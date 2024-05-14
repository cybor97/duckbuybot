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
  ): Promise<void> {
    const holder = await this.holdersRepository.findOne({ where: { address } });
    if (!holder) {
      const newHolder = new Holder();
      newHolder.tokenAddress = tokenAddress;
      newHolder.address = address;
      newHolder.balance = balance;
      await this.holdersRepository.save(newHolder);
      return;
    }
    if (balance !== holder.balance) {
      holder.balance = balance;
      await this.holdersRepository.save(holder);
    }
  }

  public async getAllHolders(tokenAddress: string): Promise<Holder[]> {
    return this.holdersRepository.find({
      where: { tokenAddress },
    });
  }
}
