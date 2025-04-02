import puppeteer from 'puppeteer';
import winston from 'winston';
import fs from 'fs';
import path from 'path';

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

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Create data directory if it doesn't exist
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const devicesDataFile = path.join(dataDir, 'online_devices_history.json');

// Function to load existing data
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

// Function to save devices data
function saveDevicesData(data: any[]) {
  try {
    fs.writeFileSync(devicesDataFile, JSON.stringify(data, null, 2));
    logger.info('Devices data saved successfully');
  } catch (error) {
    logger.error('Error saving devices data:', error);
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
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = path.join(screenshotsDir, `screenshot_${timestamp}.png`);

    // Take screenshot
    logger.info('Taking screenshot...');
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    logger.info(`Screenshot saved successfully: ${screenshotPath}`);

    // Save the online devices count to JSON file
    logger.info('Saving devices data...');
    const devicesData = loadDevicesData();
    devicesData.push({
      timestamp: new Date().toISOString(),
      onlineDevices: onlineDevicesCount,
      screenshotPath: `/screenshots/screenshot_${timestamp}.png`
    });
    saveDevicesData(devicesData);
    logger.info('Devices data saved successfully');
    
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