import { createLogger, format, transports } from 'winston';
/** @fileoverview Winston structured logger — never logs user text, only metadata. */
const { combine, timestamp, json, colorize, simple } = format;
const isDev = process.env['NODE_ENV'] !== 'production';
export const logger = createLogger({
    level: isDev ? 'debug' : 'info',
    format: isDev
        ? combine(colorize(), timestamp(), simple())
        : combine(timestamp(), json()),
    transports: [new transports.Console()],
    silent: process.env['NODE_ENV'] === 'test',
});
//# sourceMappingURL=logger.js.map