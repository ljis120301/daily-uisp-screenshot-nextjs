import cron from 'node-cron';
import { takeScreenshot } from './screenshotService';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'screenshot_service.log' }),
    new winston.transports.Console()
  ]
});

export function startScheduler() {
  // Schedule task to run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      logger.info('Starting scheduled screenshot task...');
      const success = await takeScreenshot();
      
      if (success) {
        logger.info('Scheduled screenshot completed successfully');
      } else {
        logger.error('Scheduled screenshot failed');
        // Retry after 1 hour
        setTimeout(async () => {
          logger.info('Retrying failed screenshot...');
          const retrySuccess = await takeScreenshot();
          if (retrySuccess) {
            logger.info('Retry screenshot completed successfully');
          } else {
            logger.error('Retry screenshot failed');
          }
        }, 60 * 60 * 1000);
      }
    } catch (error) {
      logger.error('Scheduler error:', error);
    }
  });

  logger.info('Screenshot scheduler started successfully');
} 