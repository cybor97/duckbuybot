import { fromNano } from "@ton/core";
import { JettonHolders, JettonInfo } from "tonapi-sdk-js";
import { getFiatCurrency } from "../utils/currency";

export interface NotificationData {
  tokenInfo: JettonInfo;
  address: JettonHolders["addresses"][0];
  isNewHolder: boolean;
  tickerValue: string | null;
  emoji: string | null;
}

export function getNotification(data: NotificationData) {
  const { tickerValue, isNewHolder, emoji, address, tokenInfo } = data;
  const symbol = tokenInfo.metadata.symbol;

  const tickerValueFloat = tickerValue ? parseFloat(tickerValue) : null;

  const fiatCurrency = getFiatCurrency();
  const fiatFormat = new Intl.NumberFormat("en", {
    style: "currency",
    currency: fiatCurrency,
  });
  const cryptoFormat = new Intl.NumberFormat("en", { style: "decimal" });

  const tokenBalance = Math.floor(parseFloat(fromNano(address.balance)));

  const spentSubstring =
    tickerValueFloat === null
      ? ""
      : fiatFormat.format(tickerValueFloat * tokenBalance);
  const marketcapSubstring = `${
    tickerValueFloat === null
      ? ""
      : fiatFormat.format(
          parseFloat(fromNano(BigInt(tokenInfo.total_supply))) *
            tickerValueFloat,
        )
  }`;

  const balanceSubstring = `${cryptoFormat.format(tokenBalance)} ${symbol}`;

  return (
    `🚨 ${symbol} New Buy!🚨

    ${emoji ?? "🦆"}
    
    🧳Bought: ${balanceSubstring} (${spentSubstring})
    ${isNewHolder ? "\n👋New Holder! Welcome!\n" : ""}
    📊Market cap: ${marketcapSubstring}
    💸Check buyers [wallet](https://tonviewer.com/${address.address})
    👨${tokenInfo.holders_count} Holders`
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      // One empty like is ok
      .replace("\n\n\n", "\n")
  );
}
