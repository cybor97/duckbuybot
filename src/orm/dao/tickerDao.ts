import { Repository } from "typeorm";
import AppDataSource from "..";
import { Ticker } from "../entities/ticker";

export class TickerDao {
  private tickerRepository: Repository<Ticker>;
  private static dao: TickerDao;

  private constructor() {
    this.tickerRepository = AppDataSource.getRepository(Ticker);
  }

  public static getDao(): TickerDao {
    if (!TickerDao.dao) {
      TickerDao.dao = new TickerDao();
    }
    return TickerDao.dao;
  }

  public async getAllTickers(): Promise<Ticker[]> {
    return this.tickerRepository.find();
  }

  public async getOrCreateTicker(
    tokenAddress: string,
    coinmarketcapId?: string,
    value?: string,
  ): Promise<Ticker> {
    const ticker = await this.tickerRepository.findOne({
      where: { tokenAddress },
    });
    if (!ticker) {
      const newTicker = new Ticker();
      newTicker.tokenAddress = tokenAddress;
      newTicker.conmarketcapId = coinmarketcapId ?? null;
      newTicker.value = value ?? null;
      await this.tickerRepository.save(newTicker);
      return this.getOrCreateTicker(tokenAddress, coinmarketcapId, value);
    }
    return ticker;
  }

  public async getTicker(tokenAddress: string): Promise<Ticker | null> {
    return this.tickerRepository.findOne({
      where: { tokenAddress },
    });
  }

  public async updateTicker(data: Partial<Ticker>): Promise<void> {
    await this.tickerRepository.save(data);
  }
}
