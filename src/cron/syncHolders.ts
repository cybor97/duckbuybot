import { Telegraf } from "telegraf";
import { Api, HttpClient, JettonHolders, Transaction } from "tonapi-sdk-js";

import { ConfigDao } from "../orm/dao/configDao";
import { HolderDao } from "../orm/dao/holderDao";
import { broadcastNotification } from "../utils/telegram";
import { TickerDao } from "../orm/dao/tickerDao";
import logger from "../utils/logger";
import { JettonTransfer, getNonBouncedJettonTransfer } from "../utils/jetton";
import { findInterface } from "../utils/traces";
import { Holder } from "../orm/entities/holder";
import { waitTONRPSDelay } from "../utils/runtime";
import { inspect } from "util";
import { getDexConfig } from "../utils/config";

// 2h in seconds
const LAST_TRANSACTION_TIMEFRAME = 7200;
const HOLDERS_CHUNK_SIZE = 1000;

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
    await waitTONRPSDelay();

    const holders: JettonHolders = { addresses: [], total: 0 };
    let total: number | null = null;
    for (let i = 0; total === null || i < total; i += HOLDERS_CHUNK_SIZE) {
      logger.info(
        `Fetching holders for ${tokenAddress} ${i}-${i + HOLDERS_CHUNK_SIZE}/${
          total ?? "unknown"
        }`,
      );
      const holdersChunk = await client.jettons.getJettonHolders(tokenAddress, {
        limit: 1000,
        offset: i,
      });
      holders.addresses = holders.addresses.concat(holdersChunk.addresses);
      holders.total = holdersChunk.total;
      total = holdersChunk.total;
      await waitTONRPSDelay();
    }
    const configs = await configDao.findConfigsByAddress(tokenAddress);

    const firstSync = configs.every((c) => c.firstSync);
    const firstSyncForSome = configs.some((c) => c.firstSync);
    if (!firstSync && firstSyncForSome) {
      await configDao.notFirstSync(tokenAddress);
    }

    const dbHolders = await holderDao.getAllHolders(tokenAddress);
    const dbHoldersMap = dbHolders.reduce((acc, holder) => {
      acc.set(holder.address, holder);
      return acc;
    }, new Map<string, Holder>());

    const ticker = await tickerDao.getTicker(tokenAddress);
    const tickerValue = ticker?.value ?? null;

    for (const holder of holders.addresses) {
      logger.info(
        `Syncing ${tokenAddress} ${holders.addresses.indexOf(holder)}/${
          holders.addresses.length
        }. First sync: ${firstSync}`,
      );

      const dbHolder = dbHoldersMap.get(holder.address);
      if (dbHolder && dbHolder.balance === holder.balance) {
        continue;
      }
      if (dbHolder === undefined) {
        const poolAddress = await holderDao.getPoolAddress(
          tokenAddress,
          holder.address,
        );
        if (poolAddress) {
          // skip pool addresses
          continue;
        }
        if (!poolAddress) {
          await waitTONRPSDelay();
          const walletData =
            await client.blockchain.execGetMethodForBlockchainAccount(
              holder.address,
              "get_wallet_data",
            );
          const ownerAddress = walletData.decoded?.owner;
          await waitTONRPSDelay();
          const addressInfo = await client.accounts.getAccount(ownerAddress);
          const interfaces = addressInfo.interfaces ?? [];
          if (interfaces.length > 0) {
            const dexConfig = getDexConfig();
            if (interfaces.some((inf) => dexConfig.has(inf))) {
              logger.info(
                `Found dex address ${ownerAddress} (via holder ${holder.address}) for token ${tokenAddress}, skipping...`,
              );
              // skip dex addresses
              await holderDao.addPoolAddress(tokenAddress, holder.address);
              continue;
            }
          }
        }
      }

      const transactionsData = await getPurchasesByHolder(
        dbHolder,
        client,
        holder,
      );

      let maxLT: null | number = null;
      for (const { transaction, dex } of transactionsData) {
        if (dbHolder === undefined) {
          if (!firstSync) {
            await broadcastNotification({
              telegraf,
              configs,
              configDao,
              address: holder,
              tokenInfo,
              isNewHolder: true,
              tickerValue,
              transaction,
              dex,
            });
          }
        } else if (BigInt(transaction.amount) > 0) {
          if (!firstSync) {
            await broadcastNotification({
              telegraf,
              configs,
              configDao,
              address: holder,
              tokenInfo,
              isNewHolder: false,
              tickerValue,
              transaction,
              dex,
            });
          }
        }
        if (maxLT === null || transaction.lt > maxLT) {
          maxLT = transaction.lt;
        }
      }
      await holderDao.findOrUpdateHolder(
        tokenAddress,
        holder.address,
        holder.balance,
        maxLT?.toString() ?? null,
      );
    }

    await holderDao.setHoldersUpdated(tokenAddress);
    await configDao.notFirstSync(tokenAddress);
  }
}

async function getPurchasesByHolder(
  dbHolder: Holder | undefined,
  client: Api<HttpClient>,
  holder: JettonHolders["addresses"][0],
) {
  const result: { transaction: JettonTransfer; dex: string }[] = [];

  try {
    let lastLT: number | undefined = undefined;
    if (dbHolder?.lastLT) {
      lastLT = parseInt(dbHolder.lastLT);
    }
    const jettonWalletAddress = holder.address;

    let transactions: Transaction[] = [];
    let hashes = new Set<string>();
    let lastUpdatedHolderTimestamp: number | undefined = undefined;
    if (dbHolder?.updatedAt && dbHolder.updatedAt instanceof Date) {
      lastUpdatedHolderTimestamp = dbHolder.updatedAt.getTime() / 1000;
    }
    const lastUpdatedTimestamp =
      (lastUpdatedHolderTimestamp ?? Date.now()) - LAST_TRANSACTION_TIMEFRAME;

    let currentLowestLT: number | null = null;
    let currentLowestTimestamp: number | null = null;
    while (
      currentLowestLT === null ||
      currentLowestTimestamp === null ||
      (lastLT !== undefined &&
        currentLowestLT !== null &&
        currentLowestLT > lastLT) ||
      (currentLowestTimestamp !== null &&
        currentLowestTimestamp > lastUpdatedTimestamp)
    ) {
      const txData = await client.blockchain.getBlockchainAccountTransactions(
        jettonWalletAddress,
        {
          after_lt: lastLT,
          before_lt: currentLowestLT ?? undefined,
          limit: 10,
        },
      );
      await waitTONRPSDelay();
      if (txData.transactions.length === 0) {
        break;
      }
      currentLowestLT = Math.min(...txData.transactions.map((tx) => tx.lt));
      currentLowestTimestamp = Math.min(
        ...txData.transactions.map((tx) => tx.utime),
      );

      const newTransactions = txData.transactions
        .filter((tx) => !hashes.has(tx.hash))
        .filter((tx) => lastLT === undefined || tx.lt > lastLT);
      if (newTransactions.length > 0) {
        transactions.push(...newTransactions);
        txData.transactions.forEach((tx) => hashes.add(tx.hash));
      } else {
        logger.warn("All transactions already processed");
        break;
      }
    }

    const internalTokenTransfers = transactions
      .map((tx) => getNonBouncedJettonTransfer(tx))
      .filter(Boolean) as JettonTransfer[];

    for (const internalTokenTransfer of internalTokenTransfers) {
      await waitTONRPSDelay();
      const trace = await client.traces.getTrace(internalTokenTransfer.id);
      const interfaceConfig = getDexConfig();
      const dexKeys = Array.from(interfaceConfig.keys());
      const dexKey = dexKeys.find((key) => findInterface(trace, key));
      if (dexKey) {
        result.push({
          transaction: internalTokenTransfer,
          dex: dexKey,
        });
      }
    }
  } catch (e) {
    logger.error(
      `Failed to get transactions for ${holder.address}, error: ${inspect(e)}`,
    );
  }
  return result;
}
