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

  const tokenBalance = Math.floor(parseFloat(fromNano(address.balance)));
  const fiatCurrency = getFiatCurrency();
  return `🚨 ${symbol} New Buy!🚨 
    ${emoji ?? "🦆"}
    
    ${tickerValue === null ? "" : `${tickerValue} ${fiatCurrency}`}
    
    🧳Bought: ${tokenBalance} ${symbol} 
    ${isNewHolder ? "👋New Holder! Welcome" : ""}
    📊Total supply: ${fromNano(tokenInfo.total_supply)} ${symbol}
    💸Check buyers [wallet](https://tonviewer.com/${address.address})
    📈Chart | Buy
    👨${tokenInfo.holders_count} Holders
    
    🚀Trending position 1`
    .split("\n")
    .map((line) => line.trim())
    .join("\n");
}
