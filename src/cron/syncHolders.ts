import { Telegraf } from "telegraf";
import { Api, HttpClient, JettonHolders } from "tonapi-sdk-js";

import { ConfigDao } from "../orm/dao/configDao";
import { HolderDao } from "../orm/dao/holderDao";
import { broadcastNotification } from "../utils/telegram";
import { fromNano } from "@ton/core";
import { TickerDao } from "../orm/dao/tickerDao";
import logger from "../utils/logger";

export async function syncHolders(opts: {
  telegraf: Telegraf;
  configDao: ConfigDao;
  holderDao: HolderDao;
  tickerDao: TickerDao;
  client: Api<HttpClient>;
}) {
  const { telegraf, configDao, holderDao, tickerDao, client } = opts;
  const tokenAddresses = await configDao.getTokenAddresses();
  for (const tokenAddress of tokenAddresses) {
    const tokenInfo = await client.jettons.getJettonInfo(tokenAddress);

    const holders: JettonHolders = { addresses: [], total: 0 };
    let total: number | null = null;
    for (let i = 0; total === null || i < total; i += 1000) {
      logger.info(
        `Fetching holders for ${tokenAddress} ${i}-${i + 1000}/${total}`,
      );
      const holdersChunk = await client.jettons.getJettonHolders(tokenAddress, {
        limit: 1000,
        offset: i,
      });
      holders.addresses = holders.addresses.concat(holdersChunk.addresses);
      holders.total = holdersChunk.total;
      total = holdersChunk.total;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const configs = await configDao.findConfigsByAddress(tokenAddress);

    const firstSync = configs.every((c) => c.firstSync);
    const firstSyncForSome = configs.some((c) => c.firstSync);
    if (!firstSync && firstSyncForSome) {
      await configDao.notFirstSync(tokenAddress);
    }

    const dbHolders = await holderDao.getAllHolders(tokenAddress);
    const dbHoldersMap = dbHolders.reduce((acc, holder) => {
      acc.set(holder.address, holder.balance);
      return acc;
    }, new Map<string, string>());

    const ticker = await tickerDao.getTicker(tokenAddress);
    const tickerValue = ticker?.value ?? null;

    for (const holder of holders.addresses) {
      if (firstSync) {
        logger.info(
          `First sync for ${tokenAddress} ${holders.addresses.indexOf(
            holder,
          )}/${holders.addresses.length}`,
        );
      }
      const dbHolderBalance = dbHoldersMap.get(holder.address);
      if (dbHolderBalance === undefined) {
        if (!firstSync) {
          await broadcastNotification({
            telegraf,
            configs,
            configDao,
            address: holder,
            tokenInfo,
            isNewHolder: true,
            tickerValue,
            diff: fromNano(holder.balance),
          });
        }
        await holderDao.findOrUpdateHolder(
          tokenAddress,
          holder.address,
          holder.balance,
        );
        continue;
      }
      if (holder.balance > dbHolderBalance) {
        const diff = fromNano(BigInt(holder.balance) - BigInt(dbHolderBalance));
        if (!firstSync) {
          await broadcastNotification({
            telegraf,
            configs,
            configDao,
            address: holder,
            tokenInfo,
            isNewHolder: false,
            tickerValue,
            diff,
          });
        }
        await holderDao.findOrUpdateHolder(
          tokenAddress,
          holder.address,
          holder.balance,
        );
      }
    }

    await configDao.notFirstSync(tokenAddress);
  }
}
