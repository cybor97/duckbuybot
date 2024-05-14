import { Telegraf } from "telegraf";
import { Api, HttpClient } from "tonapi-sdk-js";

import { ConfigDao } from "../orm/dao/configDao";
import { HolderDao } from "../orm/dao/holderDao";
import { broadcastNotification } from "../utils/telegram";
import { fromNano } from "@ton/core";
import { TickerDao } from "../orm/dao/tickerDao";

export async function syncHolders(opts: {
  telegraf: Telegraf;
  configDao: ConfigDao;
  holderDao: HolderDao;
  tickerDao: TickerDao;
  client: Api<HttpClient>;
}) {
  const { telegraf, configDao, holderDao, tickerDao, client } = opts;
  const tokenAddresses = await configDao.getTokenAddresses();
  for (const { tokenAddress } of tokenAddresses) {
    const tokenInfo = await client.jettons.getJettonInfo(tokenAddress);
    const holders = await client.jettons.getJettonHolders(tokenAddress);
    const configs = await configDao.findConfigsByAddress(tokenAddress);

    const dbHolders = await holderDao.getAllHolders(tokenAddress);
    const dbHoldersMap = dbHolders.reduce((acc, holder) => {
      acc.set(holder.address, holder.balance);
      return acc;
    }, new Map<string, string>());

    const ticker = await tickerDao.getTicker(tokenAddress);
    const tickerValue = ticker?.value ?? null;

    for (const holder of holders.addresses) {
      const dbHolderBalance = dbHoldersMap.get(holder.address);
      if (dbHolderBalance === undefined) {
        await broadcastNotification({
          telegraf,
          configs,
          address: holder,
          tokenInfo,
          isNewHolder: true,
          tickerValue,
          diff: BigInt(fromNano(holder.balance)),
        });
        await holderDao.findOrUpdateHolder(holder.address, holder.balance);
        continue;
      }
      if (holder.balance > dbHolderBalance) {
        const diff =
          BigInt(fromNano(holder.balance)) - BigInt(fromNano(dbHolderBalance));
        await broadcastNotification({
          telegraf,
          configs,
          address: holder,
          tokenInfo,
          isNewHolder: false,
          tickerValue,
          diff,
        });
        await holderDao.findOrUpdateHolder(holder.address, holder.balance);
      }
    }
  }
}
