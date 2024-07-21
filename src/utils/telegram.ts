import { inspect } from "util";
import { Telegraf } from "telegraf";
import { JettonHolders, JettonInfo } from "tonapi-sdk-js";

import { Config } from "../orm/entities/config";
import { getNotification } from "../content";
import logger from "./logger";
import { ConfigDao } from "../orm/dao/configDao";
import { JettonTransfer } from "./jetton";
import { fromNano } from "@ton/core";

export async function broadcastNotification(opts: {
  telegraf: Telegraf;
  configs: Config[];
  configDao: ConfigDao;
  address: JettonHolders["addresses"][0];
  tokenInfo: JettonInfo;
  tickerValue: string | null;
  isNewHolder: boolean;
  transaction: JettonTransfer;
  dex: string;
}) {
  const {
    telegraf,
    configs,
    configDao,
    address,
    tokenInfo,
    isNewHolder,
    tickerValue,
    transaction,
    dex,
  } = opts;
  const amount = fromNano(transaction.amount);
  for (const config of configs) {
    if (
      config.value.minBuy === null ||
      // No matter in this case true or false :D
      // This field is always null (no value yet), string (limit set) or boolean (false, no limit)
      typeof config.value.minBuy === "boolean" ||
      parseFloat(amount) > parseFloat(config.value.minBuy)
    ) {
      logger.info(
        `Broadcasting notification to ${config.chatId} (${amount} > ${config.value.minBuy})`,
      );
      const stillExists = await configDao.stillExists(config.chatId);
      if (!stillExists) {
        logger.warn(`Chat ${config.chatId} no longer exists, skipping`);
        continue;
      }
      const content = getNotification({
        address,
        tokenInfo,
        isNewHolder,
        tickerValue,
        // it will always be string, null or false. True is never going to happen, otherwise noone cares :D
        emoji:
          typeof config.value.emoji === "boolean" ? null : config.value.emoji,
        tokenAmount: amount,
        transactionId: transaction.id,
        dex,
      });
      try {
        await sendNotification(telegraf, config, content);
      } catch (e) {
        logger.error(
          `Error sending notification to ${config.chatId} ${inspect(e)}`,
        );
      }
    }
  }
}

export async function sendNotification(
  telegraf: Telegraf,
  config: Config,
  content: string,
): Promise<void> {
  const inline_keyboard = [
    [
      {
        text: "Buy with DeDust.io",
        url: `https://dedust.io/swap/TON/${config.tokenAddress}`,
      },
      {
        text: "Buy with STON.fi",
        url: `https://app.ston.fi/swap?chartVisible=false&ft=TON&tt=${config.tokenAddress}`,
      },
    ],
  ];
  if (!config.value.gif && !config.value.photo) {
    await telegraf.telegram.sendMessage(config.chatId, content, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard,
      },
    });
    return;
  }

  if (config.value.gif) {
    await telegraf.telegram.sendAnimation(
      config.chatId,
      // @ts-expect-error message.animation is expected
      config.value.gif,
      {
        parse_mode: "Markdown",
        caption: content,
        reply_markup: {
          inline_keyboard,
        },
      },
    );
  }
  if (config.value.photo) {
    await telegraf.telegram.sendPhoto(
      config.chatId,
      // @ts-expect-error message.photo is expected
      config.value.photo,
      {
        parse_mode: "Markdown",
        caption: content,
        reply_markup: {
          inline_keyboard,
        },
      },
    );
  }
}
