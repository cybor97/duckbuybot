import dotenv from "dotenv";

dotenv.config();

import { Telegraf } from "telegraf";
import { ConfigDao } from "../orm/dao/configDao";
import { Address } from "@ton/core";
import { HttpClient, Api } from "tonapi-sdk-js";

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

  const telegraf = new Telegraf(process.env.BOT_TOKEN as string);

  telegraf.telegram.setMyCommands([{ command: "start", description: "Start" }]);
  telegraf.on("message", async (ctx) => {
    const config = await ConfigDao.getDao().findOrCreateConfig(
      ctx.chat.id.toString(),
    );
    if (!config.value.tokenRequested) {
      await ctx.reply("Please send me an address of token to track");
      config.value.tokenRequested = true;
      await ConfigDao.getDao().updateConfig(config);
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
        await ConfigDao.getDao().updateConfig(config);
      } catch (err) {
        await ctx.reply("Unable to get token info");
        return;
      }
    }

    if (!config.value.emojiRequested) {
      config.value.emojiRequested = true;
      await ConfigDao.getDao().updateConfig(config);
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
      await ConfigDao.getDao().updateConfig(config);
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
      await ConfigDao.getDao().updateConfig(config);
      await ctx.reply("Okay, I'll use this animation");
      // @ts-expect-error message.animation is expected
      await ctx.replyWithVideo(config.value.gif);
    }
  });
  telegraf.launch();
}
