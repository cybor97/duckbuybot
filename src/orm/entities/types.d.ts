export interface BotConfig {
  gif: string | boolean | null;
  emoji: string | boolean | null;

  tokenRequested: boolean;
  gifRequested: boolean;
  emojiRequested: boolean;
}
