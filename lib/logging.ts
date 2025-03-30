import winston from 'winston';
import LokiTransport from 'winston-loki';

// Prüfe, ob wir uns im Browser befinden
const isBrowser = typeof window !== 'undefined';

const options = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'auraspeak' },
  transports: [
    // Füge Loki nur serverseitig hinzu
    ...(isBrowser ? [] : [
      new LokiTransport({
        host: process.env.LOKI_HOST || 'http://localhost:3100',
        labels: {
          service: 'auraspeak',
          environment: process.env.NODE_ENV || 'development'
        },
        format: winston.format.json(),
        replaceTimestamp: true,
        json: true,
        batching: false
      })
    ]),
    // Konsolen-Transport für alle Umgebungen
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
};

const logger = winston.createLogger(options);

export default logger;
