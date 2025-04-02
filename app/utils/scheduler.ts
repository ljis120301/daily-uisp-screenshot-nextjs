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

let lastScreenshotTime = 0;

export function startScheduler() {
  // Schedule task to run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      const currentTime = Date.now();
      
      // Check if 24 hours have passed
      if (currentTime - lastScreenshotTime >= 24 * 60 * 60 * 1000) {
        const success = await takeScreenshot();
        if (success) {
          lastScreenshotTime = currentTime;
          logger.info('Daily screenshot completed successfully');
        } else {
          logger.warn('Daily screenshot failed, will retry in 1 hour');
          // Retry after 1 hour
          setTimeout(async () => {
            const retrySuccess = await takeScreenshot();
            if (retrySuccess) {
              lastScreenshotTime = Date.now();
              logger.info('Retry screenshot completed successfully');
            } else {
              logger.error('Retry screenshot failed');
            }
          }, 60 * 60 * 1000);
        }
      }
    } catch (error) {
      logger.error('Scheduler error:', error);
    }
  });

  logger.info('Screenshot scheduler started');
} 