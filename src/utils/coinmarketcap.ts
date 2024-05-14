import { inspect } from "util";
import logger from "./logger";

const baseUrl = "https://pro-api.coinmarketcap.com/v2";

interface MetadataResponse {
  data: {
    [id: string]: {
      symbol: string;
      contract_address: {
        contract_address: string;
        platform: {
          coin: {
            symbol: string;
          };
        };
      }[];
    };
  };
}

interface PriceConversionResponse {
  data: {
    symbol: string;
    quote: {
      USD: {
        price: number;
      };
    };
  };
}

export async function getTONTokenId(
  tokenAddress: string,
): Promise<string | null> {
  try {
    const coinmarketcapKey = process.env.COINMARKETCAP_KEY;
    const res = await fetch(
      `${baseUrl}/cryptocurrency/info?address=${tokenAddress}`,
      {
        // @ts-expect-error custom headers
        headers: {
          "X-CMC_PRO_API_KEY": coinmarketcapKey,
        },
      },
    );
    if (res.status !== 200) {
      return null;
    }
    const metadata = (await res.json()) as MetadataResponse;
    for (let id in metadata.data) {
      const contracts = metadata.data[id]?.contract_address ?? [];
      if (
        contracts.some(
          (c) =>
            c?.contract_address === tokenAddress &&
            c?.platform?.coin?.symbol === "TON",
        )
      ) {
        return id;
      }
    }
    return null;
  } catch (err) {
    logger.error(inspect(err));
    return null;
  }
}

export async function getTicker(symbolId: string): Promise<string | null> {
  try {
    const coinmarketcapKey = process.env.COINMARKETCAP_KEY;
    const res = await fetch(
      `${baseUrl}/tools/price-conversion?amount=1&id=${symbolId}&convert=USD`,
      {
        // @ts-expect-error custom headers
        headers: {
          "X-CMC_PRO_API_KEY": coinmarketcapKey,
        },
      },
    );
    if (res.status !== 200) {
      return null;
    }
    const priceConversion = (await res.json()) as PriceConversionResponse;
    return priceConversion.data.quote.USD.price.toString();
  } catch (err) {
    logger.error(inspect(err));
    return null;
  }
}
