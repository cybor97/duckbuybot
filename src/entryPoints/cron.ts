import cron from "node-cron";
import { ConfigDao } from "../orm/dao/configDao";
import { Api, HttpClient } from "tonapi-sdk-js";
import { Telegraf } from "telegraf";
import { fromNano } from "@ton/core";

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

  cron.schedule(
    "* * * * *",
    async () => {
      try {
        const addresses = await configDao.getTokenAddresses();
        for (const address of addresses) {
          const tokenInfo = await client.jettons.getJettonInfo(
            address.tokenAddress,
          );
          const holders = await client.jettons.getJettonHolders(
            address.tokenAddress,
          );
          const configs = await configDao.findConfigsByAddress(
            address.tokenAddress,
          );
          for (const config of configs) {
            const content = `🚨 DUCK New Buy!🚨 

🦆🦆🦆
 
🧳Bought: ${Math.floor(
              parseFloat(fromNano(holders.addresses[0].balance)),
            )} DUCK 
👋New Holder! Welcome
📊Total supply: ${fromNano(tokenInfo.total_supply)} DUCK
💸Check buyers [wallet](https://tonviewer.com/${holders.addresses[0].address})
📈Chart | Buy
👨${tokenInfo.holders_count} Holders

🚀Trending position 1`
              .split("\n")
              .map((line) => line.trim())
              .join("\n");

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
        }
      } catch (err) {
        console.log(err);
      }
    },
    { runOnInit: true },
  );
}
