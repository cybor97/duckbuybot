# TON Token Buy Notifications Bot

This project is a Telegram bot that sends notifications about new TON token buys from DeDust and STON.fi. The bot is built using TypeScript and Node.js, and it utilizes the Telegram API for communication.

## Features

- Monitors DeDust and STON.fi for new token buys
- Sends notifications to specified Telegram channels or groups with details about the new buys, including:
  - token information
  - transaction details
  - market cap
  - holders count
  - links to the corresponding address and transaction tree within https://tonviewer.com/
- Allows customization per-chat. Chat owners can set up:
  - their own emoji
  - gif/video
  - threshold value
  - token to monitor

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/cybor97/duckbuybot.git
cd duckbuybot
```

2. Install dependencies:

```bash
yarn install
```

3. Create a `.env` file in the root directory of your project and add the following environment variables:

```
BOT_TOKEN=your_telegram_bot_token
TONAPI_KEY=your_tonapi_key
COINMARKETCAP_KEY=your_coinmarketcap_key
TICKER_UPDATE_CRON="*/10 * * * *"
FIAT_CURRENCY=USD
RPS_DELAY=100
DEX_CONFIG=stonfi_router:STON.fi,dedust_vault:DeDust
```

Replace `your_telegram_bot_token`, `your_tonapi_key`, and `your_coinmarketcap_key` with your actual values.

The provided values for `TICKER_UPDATE_CRON` and `FIAT_CURRENCY` are there by default, so it makes sense to set them only if you want to change this behaviour. However take into consideration that fiat currency should be one of those listed on https://coinmarketcap.com/ . Also too "frequent" value for `TICKER_UPDATE_CRON` can drain your API usage limit, but too "rare" may result in sending irrelevant data.

Value for `RPS_DELAY` depends on your https://tonapi.io/ account configuration. You can safely set it to 1000/requests_per_second. For the free plan at the moment of publishing RPS_DELAY would be 1000 which is default.

Value for `DEX_CONFIG` should be comma-separated dex_interface_name:dex_display_name pairs. To get more context check out [TON docs](https://docs.ton.org/learn/glossary#dex), DEXes available on the [marketplace](https://ton.app/dex), [example](https://tonviewer.com/EQCMLWHcGz4AkNTnP6CTMG0Guo68_DTZ5Dc-AGHqtN8leJ0h) of such address.

4. Set up DB:
   
Bot uses SQLite, therefore it doesn't require any additional DB software to be installed. Just run the following command to init DB

```bash
yarn db:migration:run
```

5. Run the bot:

For local environment

```bash
yarn dev
```

Or for production environment

```bash
pm2 start ecosystem.config.js
```

The bot will start monitoring DeDust and STON.fi for the new token buys and send notifications to the subscribed Telegram chats.

## Contributing

Contributions are welcome! If you have any ideas or improvements, feel free to open an issue or submit a pull request.

## Disclaimer

This bot is provided as-is and without any warranties. Use at your own risk.

## Note

This bot is categorized as a "buybot" as it focuses on notifying users about TON token buys. It is important to note that the term "buybot" is not an official or recognized term within the blockchain or cryptocurrency community. However, it is a common practice among developers and users to refer to bots that monitor and alert about token purchases as "buybots."
