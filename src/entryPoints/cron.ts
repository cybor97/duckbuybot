import cron from "node-cron";
import { Api, HttpClient } from "tonapi-sdk-js";
import { Telegraf } from "telegraf";

import { ConfigDao } from "../orm/dao/configDao";
import logger from "../utils/logger";
import { HolderDao } from "../orm/dao/holderDao";
import { syncHolders } from "../cron/syncHolders";
import { TickerDao } from "../orm/dao/tickerDao";
import { getTONTokenId, getTicker } from "../utils/coinmarketcap";
import { inspect } from "util";

export async function initCron() {
  const httpClient = new HttpClient({
    baseUrl: "https://tonapi.io",
    baseApiParams: {
      headers: {
        Authorization: `Bearer ${process.env.TONAPI_KEY}`,
        "Content-type": "application/json",
      },
    },
  });
  const client = new Api(httpClient);
  const telegraf = new Telegraf(process.env.BOT_TOKEN as string);

  const configDao = ConfigDao.getDao();
  const holderDao = HolderDao.getDao();
  const tickerDao = TickerDao.getDao();

  scheduleSyncHolders({ telegraf, configDao, holderDao, tickerDao, client });
  scheduleTickerUpdate({ tickerDao });

  logger.info("Cron inited");
}

function scheduleSyncHolders(opts: {
  telegraf: Telegraf;
  configDao: ConfigDao;
  holderDao: HolderDao;
  tickerDao: TickerDao;
  client: Api<HttpClient>;
}) {
  const { telegraf, configDao, holderDao, tickerDao, client } = opts;
  let running = false;
  cron.schedule(
    "*/5 * * * *",
    async () => {
      if (running) {
        return;
      }
      running = true;

      try {
        await syncHolders({
          telegraf,
          configDao,
          holderDao,
          tickerDao,
          client,
        });
      } catch (err) {
        logger.error(inspect(err));
      }

      running = false;
    },
    { runOnInit: true },
  );
}

function scheduleTickerUpdate(opts: { tickerDao: TickerDao }) {
  const { tickerDao } = opts;
  let running = false;
  const tickerUpdateCron = process.env.TICKER_UPDATE_CRON ?? "*/10 * * * *";
  cron.schedule(
    tickerUpdateCron,
    async () => {
      if (running) {
        return;
      }
      running = true;

      try {
        const allDbTickers = await tickerDao.getAllTickers();
        for (const dbTicker of allDbTickers) {
          if (!dbTicker.conmarketcapId) {
            dbTicker.conmarketcapId = await getTONTokenId(
              dbTicker.tokenAddress,
            );
            await tickerDao.updateTicker(dbTicker);
          }
          if (!dbTicker.conmarketcapId) {
            logger.warn(`No conmarketcapId for ${dbTicker.tokenAddress}`);
            continue;
          }
          const newTickerValue = await getTicker(dbTicker.conmarketcapId);
          if (newTickerValue !== dbTicker.value) {
            dbTicker.value = newTickerValue;
            await tickerDao.updateTicker(dbTicker);
          }
        }
      } catch (err) {
        logger.error(inspect(err));
      }

      running = false;
    },
    { runOnInit: true },
  );
}
