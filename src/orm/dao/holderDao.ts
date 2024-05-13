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
    address: string,
    balance: string,
  ): Promise<string> {
    const holder = await this.holdersRepository.findOne({ where: { address } });
    if (!holder) {
      const newHolder = new Holder();
      newHolder.address = address;
      newHolder.balance = balance;
      await this.holdersRepository.save(newHolder);
      return balance;
    }
    if (balance !== holder.balance) {
      const diff = BigInt(balance) - BigInt(holder.balance);
      holder.balance = balance;
      await this.holdersRepository.save(holder);
      return diff.toString();
    }
    return "0";
  }
}
