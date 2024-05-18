import dotenv from "dotenv";

dotenv.config();

import { initBot } from "./entryPoints/bot";
import { initCron } from "./entryPoints/cron";
import AppDataSource from "./orm";

async function main() {
  await AppDataSource.initialize();
  // initBot();
  initCron();
}

main();
