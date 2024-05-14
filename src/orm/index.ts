import { DataSource } from "typeorm";
import logger from "../utils/logger";
import { join } from "path";
import { Config } from "./entities/config";
import { Holder } from "./entities/holder";
import { Ticker } from "./entities/ticker";

const AppDataSource = new DataSource({
  type: "better-sqlite3",
  database: join(__dirname, "app.db"),
  entities: [Config, Holder, Ticker],
  migrations: [join(__dirname, "migrations/*.ts")],
});

if (process.env.WITH_MIGRATION_DATASOURCE === "true") {
  AppDataSource.initialize()
    .then(() => {
      logger.info("[DataSource][init] Data Source has been initialized!");
    })
    .catch((err) => {
      logger.error(
        "[DataSource][init] Error during Data Source initialization",
        err,
      );
    });
}

export default AppDataSource;
