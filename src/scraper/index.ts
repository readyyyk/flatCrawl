/**
 * Scraper module for the FlatCrawl application
 */
export * from './browser.js';
export * from './extractor.js';

import { BrowserController } from './browser.js';
import { UrlExtractor } from './extractor.js';
import { CsvStorage } from '../storage/csv.js';
import { AppConfig, DataConfig } from '../types/index.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('Scraper');

/**
 * Scraper class
 */
export class Scraper {
  private browser: BrowserController;
  private extractor: UrlExtractor;
  
  /**
   * Create a new scraper
   * @param config Data configuration
   * @param storage CSV storage
   */
  constructor(
    private config: DataConfig,
    private storage: CsvStorage
  ) {
    this.browser = new BrowserController();
    this.extractor = new UrlExtractor(this.browser);
    
    logger.debug('Scraper initialized');
  }
  
  /**
   * Scrape a specific source
   * @param source Source name
   * @returns Number of new links added
   */
  async scrapeSource(source: string): Promise<number> {
    try {
      logger.info(`Scraping source: ${source}`);
      
      // Get source configuration
      const sourceConfig = this.config[source];
      if (!sourceConfig) {
        throw new Error(`Source "${source}" not found in configuration`);
      }
      
      // Extract URLs
      const urls = await this.extractor.extractUrls(source, sourceConfig);
      logger.info(`Found ${urls.length} links in total`);
      
      if (urls.length === 0) {
        logger.info('No links found for this source, skipping');
        return 0;
      }
      
      // Filter existing URLs
      const existingUrls = this.storage.getExistingUrls();
      const paramsToRemove = sourceConfig.normalization?.removeParams || [];
      const newUrls = this.extractor.filterNewUrls(urls, existingUrls, paramsToRemove);
      
      if (newUrls.length === 0) {
        logger.info('No new links to add, skipping');
        return 0;
      }
      
      // Create and store records
      const records = this.extractor.createUrlRecords(source, newUrls);
      this.storage.appendRecords(records);
      
      logger.info(`Added ${newUrls.length} new links for source ${source}`);
      return newUrls.length;
    } catch (error) {
      logger.error(`Error scraping source ${source}:`, error);
      throw new Error(`Failed to scrape source ${source}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      // Close the browser
      await this.browser.close();
    }
  }
  
  /**
   * Scrape all sources
   * @returns Total number of new links added
   */
  async scrapeAll(): Promise<number> {
    logger.info('Scraping all sources');
    
    const sources = Object.keys(this.config);
    let totalLinks = 0;
    
    for (const source of sources) {
      try {
        const newLinks = await this.scrapeSource(source);
        totalLinks += newLinks;
      } catch (error) {
        logger.error(`Error processing source ${source}:`, error);
        // Continue with other sources
      }
    }
    
    logger.info(`Added ${totalLinks} new links in total`);
    return totalLinks;
  }
  
  /**
   * Close the browser
   */
  async close(): Promise<void> {
    await this.browser.close();
  }
}

/**
 * Create a scraper instance
 * @param config Application configuration
 * @returns Scraper instance
 */
export function createScraper(config: AppConfig): Scraper {
  const csvStorage = new CsvStorage(config.csvPath);
  return new Scraper(config.dataConfig, csvStorage);
}