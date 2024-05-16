export interface BotConfig {
  gif: string | boolean | null;
  photo: string | boolean | null;
  emoji: string | boolean | null;
  minBuy: string | boolean | null;

  tokenRequested: boolean;
  gifRequested: boolean;
  emojiRequested: boolean;
  minBuyRequested: boolean;
}
