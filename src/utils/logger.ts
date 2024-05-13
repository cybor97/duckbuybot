import winston from "winston";
import { ConsoleTransportInstance } from "winston/lib/winston/transports";

const transports: Array<ConsoleTransportInstance> = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.printf(
        (info) => `[${info.timestamp}] ${info.level}: ${info.message}`,
      ),
    ),
  }),
];

const logger = winston.createLogger({ transports });

export default logger;
