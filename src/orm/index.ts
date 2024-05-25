import { DataSource } from "typeorm";
import logger from "../utils/logger";
import { join } from "path";
import { Config } from "./entities/config";
import { Holder } from "./entities/holder";
import { Ticker } from "./entities/ticker";
import { PoolAddress } from "./entities/poolAddress";

const AppDataSource = new DataSource({
  type: "better-sqlite3",
  // at the root of the project
  database: join(__dirname, "../../app.db"),
  entities: [Config, Holder, Ticker, PoolAddress],
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
