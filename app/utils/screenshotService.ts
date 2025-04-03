import puppeteer from 'puppeteer';
import winston from 'winston';
import fs from 'fs';
import path from 'path';
import pb from '@/lib/pocketbase';
import { createScreenshotRecord, isPocketBaseAvailable } from '@/lib/pocketbase-utils';

// Set up logging
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

// Create screenshots directory if it doesn't exist (for temporary storage)
const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Create data directory if it doesn't exist (for backup)
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const devicesDataFile = path.join(dataDir, 'online_devices_history.json');

// Function to load existing data from backup file
function loadDevicesData() {
  if (fs.existsSync(devicesDataFile)) {
    try {
      return JSON.parse(fs.readFileSync(devicesDataFile, 'utf8'));
    } catch (error) {
      logger.error('Error reading devices data file:', error);
      return [];
    }
  }
  return [];
}

// Function to save devices data to backup file
function saveDevicesData(data: any[]) {
  try {
    fs.writeFileSync(devicesDataFile, JSON.stringify(data, null, 2));
    logger.info('Devices data saved to backup file successfully');
  } catch (error) {
    logger.error('Error saving devices data to backup file:', error);
  }
}

export async function takeScreenshot(): Promise<boolean> {
  try {
    logger.info('Starting screenshot process...');
    const browser = await puppeteer.launch({
      headless: true,  // Using headless mode
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
      defaultViewport: null
    });
    logger.info('Browser launched successfully');

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    logger.info('Page created and viewport set');

    // Navigate to the page with increased timeout
    logger.info('Navigating to UISP devices page...');
    await page.goto('https://uisp.parkcomm.net/nms/devices', {
      waitUntil: 'networkidle0',
      timeout: 60000
    });
    logger.info('Page navigation completed');

    // Wait for the login form to be visible
    logger.info('Waiting for login form elements...');
    await page.waitForSelector('#username', { timeout: 60000 });
    await page.waitForSelector('#password', { timeout: 60000 });
    logger.info('Login form elements found');

    // Login
    logger.info('Attempting login...');
    await page.type('#username', 'alex');
    await page.type('#password', 'Headset6248!');
    logger.info('Login credentials entered');
    
    // Wait for and click the login button
    logger.info('Waiting for login button...');
    await page.waitForSelector('#root > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div > form > footer > div > div > button');
    await page.click('#root > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div > form > footer > div > div > button');
    logger.info('Login button clicked');

    // Wait for the page to load after login
    logger.info('Waiting for post-login page load...');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 });
    logger.info('Post-login page load completed');

    // Wait for and click the online dropdown menu using CSS selector
    logger.info('Looking for online devices dropdown...');
    const dropdownSelector = 'div.jss91:nth-child(3) > div:nth-child(1) > div:nth-child(2)';
    await page.waitForSelector(dropdownSelector, { timeout: 60000 });
    await page.click(dropdownSelector);
    logger.info('Online devices dropdown clicked');

    // Wait longer for the dropdown to fully appear and data to load
    logger.info('Waiting for dropdown data to load...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    logger.info('Dropdown data load wait completed');

    // Extract the number of online devices with retries
    const onlineDevicesSelector = 'div.option__mY5aLaMX:nth-child(2) > span:nth-child(2) > label:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(1) > span:nth-child(2)';
    
    // Wait for the selector to be visible and stable
    logger.info('Waiting for online devices count to be visible...');
    await page.waitForSelector(onlineDevicesSelector, { 
      timeout: 60000,
      visible: true 
    });
    logger.info('Online devices count element found');

    // Additional wait to ensure the content is loaded
    logger.info('Additional wait for content stability...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    logger.info('Content stability wait completed');

    // Try to get the text content with retries
    let onlineDevicesCount = 0;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      logger.info(`Attempt ${retryCount + 1} to read online devices count...`);
      const onlineDevicesText = await page.$eval(onlineDevicesSelector, (el) => el.textContent);
      onlineDevicesCount = parseInt(onlineDevicesText || '0', 10);
      
      if (onlineDevicesCount > 0) {
        logger.info(`Successfully read online devices count: ${onlineDevicesCount}`);
        break;
      }
      
      logger.warn(`Attempt ${retryCount + 1}: Failed to read online devices count, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      retryCount++;
    }

    if (onlineDevicesCount === 0) {
      logger.error('Failed to read online devices count after all retries');
    }

    // Generate timestamp for filename
    const timestamp = new Date().toISOString();
    const formattedTimestamp = timestamp.replace(/[:.]/g, '-');
    const tempScreenshotPath = path.join(screenshotsDir, `screenshot_${formattedTimestamp}.png`);

    // Take screenshot
    logger.info('Taking screenshot...');
    await page.screenshot({
      path: tempScreenshotPath,
      fullPage: true
    });
    logger.info(`Screenshot saved temporarily: ${tempScreenshotPath}`);

    // Save the screenshot and data to PocketBase if available
    logger.info('Checking PocketBase availability...');
    const isPbAvailable = await isPocketBaseAvailable();
    
    if (isPbAvailable) {
      logger.info('PocketBase is available. Saving screenshot to database...');
      try {
        // Create FormData for PocketBase
        const formData = new FormData();
        
        // Read file and create File object
        const fileData = fs.readFileSync(tempScreenshotPath);
        logger.info(`Screenshot file size: ${fileData.length} bytes`);
        
        // Create a proper File object
        const fileName = path.basename(tempScreenshotPath);
        const file = new File([fileData], fileName, { type: 'image/png' });
        
        // Add to form data
        formData.append('screenshot', file);
        formData.append('timestamp', timestamp);
        formData.append('onlineDevices', onlineDevicesCount.toString());
        
        // Log form data entries
        logger.info('FormData contents:');
        for (const pair of formData.entries()) {
          logger.info(`- ${pair[0]}: ${typeof pair[1]} ${pair[1] instanceof File ? '(File: ' + pair[1].name + ', ' + pair[1].size + ' bytes)' : pair[1]}`);
        }
        
        // Save to PocketBase
        const record = await pb.collection('screenshots').create(formData);
        logger.info(`Screenshot saved to PocketBase with ID: ${record.id}`);
        
        // Verify the file was uploaded correctly
        if (record.screenshot) {
          const fileUrl = pb.files.getURL(record, record.screenshot);
          logger.info(`Screenshot URL: ${fileUrl}`);
        } else {
          logger.warn('Screenshot file may not have been saved correctly');
        }
        
        // Save to backup file as well
        const devicesData = loadDevicesData();
        devicesData.push({
          timestamp,
          onlineDevices: onlineDevicesCount,
          screenshotId: record.id
        });
        saveDevicesData(devicesData);
        logger.info('Devices data saved to backup file');
        
        // Delete the temporary file
        fs.unlinkSync(tempScreenshotPath);
        logger.info('Temporary screenshot file deleted');
      } catch (error) {
        logger.error('Error saving to PocketBase:', error);
        
        // Keep the file in the public directory as a fallback
        logger.info('Keeping screenshot in public directory as fallback');
        
        // Save to backup file
        const devicesData = loadDevicesData();
        devicesData.push({
          timestamp,
          onlineDevices: onlineDevicesCount,
          screenshotPath: `/screenshots/screenshot_${formattedTimestamp}.png`
        });
        saveDevicesData(devicesData);
        logger.info('Devices data saved to backup file with local path');
      }
    } else {
      logger.info('PocketBase is not available. Saving screenshot to file system only...');
      
      // Save to backup file only
      const devicesData = loadDevicesData();
      devicesData.push({
        timestamp,
        onlineDevices: onlineDevicesCount,
        screenshotPath: `/screenshots/screenshot_${formattedTimestamp}.png`
      });
      saveDevicesData(devicesData);
      logger.info('Devices data saved to backup file with local path');
    }
    
    // Close browser
    logger.info('Closing browser...');
    await browser.close();
    logger.info('Browser closed successfully');
    return true;
  } catch (error) {
    logger.error('Error taking screenshot:', error);
    return false;
  }
} 