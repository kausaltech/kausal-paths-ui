import chalk from 'chalk';
import winston from 'winston';
import expressWinston from 'express-winston';
import type { Request, Response, NextFunction } from 'express';

type LoggedRequest = Request & {
  _startTime: Date;
  _startBytes: number;
};

type LoggedResponse = Response & {
  responseTime: number;
};

function levelFromStatus(res: LoggedResponse) {
  let level = '';
  if (res.statusCode >= 100) {
    level = 'info';
  } else if (res.statusCode >= 400) {
    level = 'warn';
  } else if (res.statusCode >= 500) {
    level = 'error';
  }
  return level;
}

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: 'debug',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss.SSS',
        }),
        winston.format.align(),
        winston.format.printf((info) => {
          return `${chalk.blue(info.timestamp)} ${info.level} ${info.message}`;
        })
      ),
    }),
  ],
});

export function logRequest(
  req: LoggedRequest,
  res: LoggedResponse,
  next: NextFunction
) {
  req._startTime = new Date();
  req._startBytes = req.socket.bytesWritten;
  if (req.path.startsWith('/__nextjs_original-stack-frame')) {
    return next();
  }
  const end = res.end;
  res.end = function (...args: any[]) {
    res.responseTime = new Date().getTime() - req._startTime.getTime();
    res.end = end;
    end.call(this, ...args);
    const url = req.originalUrl || req.url;
    let statusColor = 'green';
    if (res.statusCode >= 500) statusColor = 'red';
    else if (res.statusCode >= 400) statusColor = 'yellow';
    else if (res.statusCode >= 300) statusColor = 'cyan';
    const status = chalk[statusColor](`HTTP ${res.statusCode}`);
    const level = levelFromStatus(res);
    const bytesWritten = req.socket.bytesWritten - req._startBytes;
    // @ts-ignore
    const size = chalk.yellow(`${bytesWritten.toString().padStart(9)}  `);
    const responseTime = res.responseTime.toString().padStart(5, ' ');
    const msg = `${status} ${responseTime}ms ${size} ${req.method} ${url} `;
    logger.log(level, msg);
    return res;
  };
  next();
}
