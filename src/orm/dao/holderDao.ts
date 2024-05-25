import { Repository } from "typeorm";
import AppDataSource from "..";
import { Holder } from "../entities/holder";
import { PoolAddress } from "../entities/poolAddress";
import logger from "../../utils/logger";
import { inspect } from "util";

export class HolderDao {
  private holdersRepository: Repository<Holder>;
  private poolAddressesRepository: Repository<PoolAddress>;
  private static dao: HolderDao;

  private constructor() {
    this.holdersRepository = AppDataSource.getRepository(Holder);
    this.poolAddressesRepository = AppDataSource.getRepository(PoolAddress);
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

  public async getPoolAddress(
    tokenAddress: string,
    address: string,
  ): Promise<PoolAddress | null> {
    return this.poolAddressesRepository.findOne({
      where: { tokenAddress, address },
    });
  }

  public async addPoolAddress(
    tokenAddress: string,
    address: string,
  ): Promise<void> {
    try {
      const poolAddress = new PoolAddress();
      poolAddress.tokenAddress = tokenAddress;
      poolAddress.address = address;
      await this.poolAddressesRepository.save(poolAddress);
    } catch (e) {
      logger.error(
        `Unable to add pool address ${address} for token ${tokenAddress}: ${inspect(
          e,
        )}`,
      );
    }
  }
}
