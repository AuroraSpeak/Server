import winston from 'winston';
import LokiTransport from 'winston-loki';

const options = {
  transports: [
    new LokiTransport({
      host: 'http://localhost:3100',
    }),
    new winston.transports.Console(),
  ],
};

const logger = winston.createLogger(options);

export default logger;
