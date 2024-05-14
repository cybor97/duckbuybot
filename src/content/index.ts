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

  const fiatCurrency = getFiatCurrency();
  const fiatFormat = new Intl.NumberFormat("en", {
    style: "currency",
    currency: fiatCurrency,
  });
  const cryptoFormat = new Intl.NumberFormat("en", {
    style: "unit",
    unit: symbol,
  });

  const tokenBalance = Math.floor(parseFloat(fromNano(address.balance)));

  const spentSubstring =
    tickerValue === null
      ? ""
      : fiatFormat.format(parseFloat(tickerValue) * tokenBalance);
  const supplySubstring = cryptoFormat.format(
    BigInt(fromNano(tokenInfo.total_supply)),
  );
  const balanceSubstring = cryptoFormat.format(tokenBalance);

  return (
    `🚨 ${symbol} New Buy!🚨

    ${emoji ?? "🦆"}
    
    💰Spent: ${spentSubstring}
    🧳Bought: ${balanceSubstring}
    ${isNewHolder ? "👋New Holder! Welcome" : ""}
    📊Total supply: ${supplySubstring}
    💸Check buyers [wallet](https://tonviewer.com/${address.address})
    📈Chart | Buy
    👨${tokenInfo.holders_count} Holders
    
    🚀Trending position 1`
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      // One empty like is ok
      .replace("\n\n\n", "\n")
  );
}
