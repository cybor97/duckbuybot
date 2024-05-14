import dotenv from "dotenv";

dotenv.config();

import { Telegraf } from "telegraf";
import { ConfigDao } from "../orm/dao/configDao";
import { Address, toNano } from "@ton/core";
import { HttpClient, Api } from "tonapi-sdk-js";
import { TickerDao } from "../orm/dao/tickerDao";
import { getTONTokenId, getTicker } from "../utils/coinmarketcap";
import { getFiatCurrency } from "../utils/currency";

export async function initBot() {
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

  const configDao = ConfigDao.getDao();
  const tickerDao = TickerDao.getDao();

  const telegraf = new Telegraf(process.env.BOT_TOKEN as string);

  telegraf.telegram.setMyCommands([{ command: "start", description: "Start" }]);
  telegraf.on("message", async (ctx) => {
    const config = await configDao.findOrCreateConfig(ctx.chat.id.toString());
    if (!config.value.tokenRequested) {
      await ctx.reply("Please send me an address of token to track");
      config.value.tokenRequested = true;
      await configDao.updateConfig(config);
      return;
    }
    if (config.value.tokenRequested && config.tokenAddress === null) {
      // @ts-expect-error message.text is string | undefined
      const tokenAddress = ctx.message?.text;
      if (
        !Address.isAddress(tokenAddress) &&
        !Address.isFriendly(tokenAddress) &&
        !Address.isRaw(tokenAddress)
      ) {
        await ctx.reply("Please send me a valid address of token to track");
        return;
      }
      try {
        const tokenData = await client.jettons.getJettonInfo(tokenAddress);
        if (tokenData.holders_count === 0) {
          await ctx.reply(`There are no holders for token ${tokenAddress}`);
          return;
        }
        config.tokenAddress = tokenAddress;
        await configDao.updateConfig(config);

        const dbTicker = await tickerDao.getOrCreateTicker(tokenAddress);
        if (dbTicker.conmarketcapId === null) {
          dbTicker.conmarketcapId = await getTONTokenId(tokenAddress);
          if (dbTicker.conmarketcapId !== null) {
            await tickerDao.updateTicker(dbTicker);
          }
        }
        if (dbTicker.conmarketcapId === null) {
          await ctx.reply(
            `Got token ${tokenData.metadata.symbol} with ${tokenData.holders_count} holders. Though I can't find it on coinmarketcap. I'll try to find it later`,
          );
          return;
        }
        if (dbTicker.value === null) {
          const newTickerValue = await getTicker(dbTicker.conmarketcapId);
          dbTicker.value = newTickerValue;
          if (newTickerValue !== null) {
            await tickerDao.updateTicker(dbTicker);
          }
        }
        if (dbTicker.value === null) {
          await ctx.reply(
            `Got token ${tokenData.metadata.symbol} with ${tokenData.holders_count} holders. Though there is no ticker for it. I'll try to find it later`,
          );
          return;
        }
        const fiatCurrency = getFiatCurrency();
        const fiatFormat = new Intl.NumberFormat("en", {
          style: "currency",
          currency: fiatCurrency,
        });

        await ctx.reply(
          `Got token ${tokenData.metadata.symbol} with ${
            tokenData.holders_count
          } holders\nPrice is ${fiatFormat.format(parseFloat(dbTicker.value))}`,
        );
      } catch (err) {
        await ctx.reply("Unable to get token info");
        return;
      }
    }

    if (!config.value.emojiRequested) {
      config.value.emojiRequested = true;
      await configDao.updateConfig(config);
      await ctx.reply("Please send me some emoji");
      return;
    }
    if (config.value.emojiRequested && config.value.emoji === null) {
      // @ts-expect-error message.text is string | undefined
      if (ctx.message.text?.toLowerCase() === "no") {
        config.value.emoji = false;
        await ctx.reply("Okay, got it");
      }
      // @ts-expect-error message.text is string | undefined
      if (ctx.message.text?.length >= 1) {
        // @ts-expect-error message.text is string | undefined
        config.value.emoji = ctx.message?.text;
        await ctx.reply("Okay, I'll use this emoji");
      }
    }

    if (!config.value.gifRequested) {
      config.value.gifRequested = true;
      await configDao.updateConfig(config);
      await ctx.reply("Please send me some animation");
      return;
    }
    if (config.value.gifRequested && config.value.gif === null) {
      // @ts-expect-error message.text is string | undefined
      if (ctx.message.text?.toLowerCase() === "no") {
        config.value.gif = false;
        await ctx.reply("Okay, got it");
        return;
      }
      // @ts-expect-error message.animation is expected
      if (!ctx.message.animation && !ctx.message.video) {
        await ctx.reply("Please send me an animation (video or gif)");
        return;
      }

      config.value.gif =
        // @ts-expect-error message.animation is expected
        ctx.message.video?.file_id ?? ctx.message.animation?.file_id;
      await configDao.updateConfig(config);
      await ctx.reply("Okay, I'll use this animation");
      // @ts-expect-error message.animation is expected
      await ctx.replyWithVideo(config.value.gif);
    }

    if (!config.value.minBuyRequested) {
      config.value.minBuyRequested = true;
      await configDao.updateConfig(config);
      await ctx.reply(
        "Please send me the minimum amount of tokens to care about",
      );
      return;
    }
    if (config.value.minBuyRequested && config.value.minBuy === null) {
      // @ts-expect-error message.text is string | undefined
      if (ctx.message.text?.toLowerCase() === "no") {
        config.value.minBuy = false;
        await configDao.updateConfig(config);
        await ctx.reply("Okay, got it");
        return;
      }
      // @ts-expect-error message.text is string | undefined
      if (Number.isNaN(parseInt(ctx.message.text))) {
        await ctx.reply("Please send me a valid number");
        return;
      }
      // @ts-expect-error message.text is string | undefined
      if (ctx.message.text?.length >= 1) {
        // @ts-expect-error message.text is string | undefined
        config.value.minBuy = toNano(ctx.message?.text).toString();
        await configDao.updateConfig(config);
        await ctx.reply("Okay, I'll use this amount");
      }
    }
  });
  telegraf.launch();
}
