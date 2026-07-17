import winston from 'winston';

const { combine, timestamp, json, colorize, simple } = winston.format;

const isProduction = process.env.NODE_ENV === 'production';

// Production: newline-delimited JSON to stdout, minimum level info
// Non-production: human-readable colorized output to stdout, minimum level debug
const logger = winston.createLogger({
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  },
  level: isProduction ? 'info' : 'debug',
  transports: [
    new winston.transports.Console({
      format: isProduction
        ? combine(timestamp(), json())
        : combine(colorize(), simple()),
    }),
  ],
});

export default logger;
