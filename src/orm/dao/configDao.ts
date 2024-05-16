import { IsNull, Not, Repository } from "typeorm";
import AppDataSource from "..";
import { Config } from "../entities/config";

export class ConfigDao {
  private configRepository: Repository<Config>;
  private static dao: ConfigDao;

  private constructor() {
    this.configRepository = AppDataSource.getRepository(Config);
  }

  public static getDao(): ConfigDao {
    if (!ConfigDao.dao) {
      ConfigDao.dao = new ConfigDao();
    }
    return ConfigDao.dao;
  }

  public async findOrCreateConfig(chatId: string): Promise<[Config, boolean]> {
    let config = await this.configRepository.findOne({ where: { chatId } });
    if (!config) {
      const newConfig = new Config();
      newConfig.chatId = chatId;
      newConfig.value = {
        gif: null,
        photo: null,
        emoji: null,
        minBuy: null,
        tokenRequested: false,
        gifRequested: false,
        emojiRequested: false,
        minBuyRequested: false,
      };
      await this.configRepository.save(newConfig);
      const config = await this.configRepository.findOne({ where: { chatId } });
      return [config as Config, true];
    }
    return [config, false];
  }

  public async updateConfig(data: Partial<Config>): Promise<void> {
    await this.configRepository.save(data);
  }

  public async getTokenAddresses(): Promise<string[]> {
    const configs = await this.configRepository.find({
      select: ["tokenAddress"],
      where: { tokenAddress: Not(IsNull()) },
    });
    const addresses = Array.from(
      new Set(configs.map((config) => config.tokenAddress)),
    ).filter(Boolean);
    return addresses as string[];
  }

  public async stillExists(chatId: string): Promise<boolean> {
    return !!(await this.configRepository.findOne({ where: { chatId } }));
  }

  public async deleteForChat(chatId: string): Promise<void> {
    await this.configRepository.delete({ chatId });
  }

  public async findConfigsByAddress(address: string) {
    return this.configRepository.find({ where: { tokenAddress: address } });
  }

  /**
   * Oh, not MY first sync :D
   * @param address Token address
   */
  public async notFirstSync(address: string) {
    await this.configRepository.update(
      { tokenAddress: address },
      { firstSync: false },
    );
  }
}
