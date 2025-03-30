/**
 * Browser controller for the FlatCrawl application
 */
import puppeteer, { Browser, Page, WaitForOptions } from 'puppeteer';
import { Logger } from '../utils/logger.js';
import { sleep } from '../utils/helpers.js';

const logger = new Logger('BrowserController');

/**
 * Browser controller class
 */
export class BrowserController {
  private browser: Browser | null = null;
  
  /**
   * Launch the browser
   * @returns Puppeteer Browser instance
   */
  async launch(): Promise<Browser> {
    try {
      logger.info('Launching browser...');
      
      this.browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      logger.info('Browser launched successfully');
      return this.browser;
    } catch (error) {
      logger.error('Error launching browser:', error);
      throw new Error(`Failed to launch browser: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Close the browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      try {
        logger.info('Closing browser...');
        await this.browser.close();
        this.browser = null;
        logger.info('Browser closed successfully');
      } catch (error) {
        logger.error('Error closing browser:', error);
      }
    }
  }
  
  /**
   * Navigate to a URL
   * @param url URL to navigate to
   * @param options Navigation options
   * @returns Puppeteer Page instance
   */
  async navigateTo(url: string, options: {
    timeout?: number;
    waitUntil?: WaitForOptions['waitUntil'];
  } = {}): Promise<Page> {
    try {
      if (!this.browser) {
        await this.launch();
      }
      
      logger.info(`Navigating to ${url}...`);
      
      const page = await this.browser!.newPage();
      
      // Set default user agent and viewport
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.setViewport({ width: 1366, height: 768 });
      
      // Navigate to URL
      await page.goto(url, { 
        waitUntil: options.waitUntil || 'networkidle2',
        timeout: options.timeout || 60000
      });
      
      logger.info('Page loaded successfully');
      return page;
    } catch (error) {
      logger.error('Error navigating to URL:', error);
      throw new Error(`Failed to navigate to ${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Execute a command in the browser context
   * @param url URL to navigate to
   * @param command JavaScript command to execute
   * @returns Result of the command
   */
  async executeCommand(url: string, command: string): Promise<string[]> {
    let page: Page | null = null;
    
    try {
      // Navigate to URL
      page = await this.navigateTo(url);
      
      // Wait a bit for any dynamic content to load
      await sleep(1000);
      
      // Execute command
      logger.info('Executing command in browser context...');
      const result = await page.evaluate((cmd: string) => {
        try {
          // eslint-disable-next-line no-eval
          return eval(cmd) as string[];
        } catch (error) {
          console.error('Error executing command in browser:', error);
          return [] as string[];
        }
      }, command);
      
      logger.info('Command executed successfully');
      return result || [];
    } catch (error) {
      logger.error('Error executing command:', error);
      throw new Error(`Failed to execute command: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      // Close the page
      if (page) {
        await page.close();
      }
    }
  }
}