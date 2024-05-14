import { Repository } from "typeorm";
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

  public async findOrCreateConfig(chatId: string): Promise<Config> {
    const config = await this.configRepository.findOne({ where: { chatId } });
    if (!config) {
      const newConfig = new Config();
      newConfig.chatId = chatId;
      newConfig.value = {
        gif: null,
        emoji: null,
        minBuy: null,
        tokenRequested: false,
        gifRequested: false,
        emojiRequested: false,
        minBuyRequested: false,
      };
      await this.configRepository.save(newConfig);
      return this.findOrCreateConfig(chatId);
    }
    return config;
  }

  public async updateConfig(data: Partial<Config>): Promise<void> {
    await this.configRepository.save(data);
  }

  public async getTokenAddresses() {
    return this.configRepository.query(
      `select distinct tokenAddress from config where tokenAddress is not null`,
    );
  }

  public async findConfigsByAddress(address: string) {
    return this.configRepository.find({ where: { tokenAddress: address } });
  }
}
