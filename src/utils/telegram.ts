import { Telegraf } from "telegraf";
import { Config } from "../orm/entities/config";
import { JettonHolders, JettonInfo } from "tonapi-sdk-js";
import { getNotification } from "../content";
import logger from "./logger";

export async function broadcastNotification(opts: {
  telegraf: Telegraf;
  configs: Config[];
  address: JettonHolders["addresses"][0];
  tokenInfo: JettonInfo;
  tickerValue: string | null;
  isNewHolder: boolean;
  diff: string;
}) {
  const {
    telegraf,
    configs,
    address,
    tokenInfo,
    isNewHolder,
    tickerValue,
    diff,
  } = opts;
  for (const config of configs) {
    if (
      config.value.minBuy === null ||
      // No matter in this case true or false :D 
      // This field is always null (no value yet), string (limit set) or boolean (false, no limit)
      typeof config.value.minBuy === "boolean" ||
      parseFloat(diff) > parseFloat(config.value.minBuy)
    ) {
      logger.info(
        `Broadcasting notification to ${config.chatId} (${diff} > ${config.value.minBuy})`,
      );
      const content = getNotification({
        address,
        tokenInfo,
        isNewHolder,
        tickerValue,
        // it will always be string, null or false. True is never going to happen, otherwise noone cares :D
        emoji:
          typeof config.value.emoji === "boolean" ? null : config.value.emoji,
      });
      await sendNotification(telegraf, config, content);
    }
  }
}

export async function sendNotification(
  telegraf: Telegraf,
  config: Config,
  content: string,
): Promise<void> {
  if (!config.value.gif) {
    await telegraf.telegram.sendMessage(config.chatId, content, {
      parse_mode: "Markdown",
    });
    return;
  }

  await telegraf.telegram.sendAnimation(
    config.chatId,
    // @ts-expect-error message.animation is expected
    config.value.gif,
    {
      parse_mode: "Markdown",
      caption: content,
    },
  );
}
