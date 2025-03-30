/**
 * URL extractor for the FlatCrawl application
 */
import { SourceConfig, UrlRecord } from '../types/index.js';
import { BrowserController } from './browser.js';
import { Logger } from '../utils/logger.js';
import { isValidUrl } from '../utils/helpers.js';

const logger = new Logger('UrlExtractor');

/**
 * URL extractor class
 */
export class UrlExtractor {
  /**
   * Create a new URL extractor
   * @param browser Browser controller
   */
  constructor(private browser: BrowserController) {}
  
  /**
   * Extract URLs from a source
   * @param source Source name
   * @param config Source configuration
   * @returns Array of extracted URLs
   */
  async extractUrls(source: string, config: SourceConfig): Promise<string[]> {
    try {
      logger.info(`Extracting URLs from source: ${source}`);
      logger.debug(`Source config: ${JSON.stringify(config)}`);
      
      // Execute command in browser
      const urls = await this.browser.executeCommand(config.url, config.command);
      
      // Filter and validate URLs
      const validUrls = this.filterValidUrls(urls);
      
      logger.info(`Extracted ${validUrls.length} valid URLs from ${urls.length} total URLs`);
      return validUrls;
    } catch (error) {
      logger.error(`Error extracting URLs from source ${source}:`, error);
      throw new Error(`Failed to extract URLs from source ${source}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Filter valid URLs
   * @param urls Array of URLs
   * @returns Array of valid URLs
   */
  filterValidUrls(urls: string[]): string[] {
    return urls.filter(url => {
      // Check if URL is valid
      if (!url || typeof url !== 'string') {
        return false;
      }
      
      // Check if URL is a valid URL
      if (!isValidUrl(url)) {
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * Normalize a URL by removing specified query parameters
   * @param url The URL to normalize
   * @param paramsToRemove Array of query parameters to remove
   * @returns The normalized URL
   */
  normalizeUrl(url: string, paramsToRemove: string[] = []): string {
    try {
      // If no parameters to remove or URL is invalid, return the original URL
      if (paramsToRemove.length === 0 || !isValidUrl(url)) {
        return url;
      }
      
      const urlObj = new URL(url);
      
      // Remove specified query parameters
      for (const param of paramsToRemove) {
        if (urlObj.searchParams.has(param)) {
          logger.debug(`Removing parameter ${param} from URL: ${url}`);
          urlObj.searchParams.delete(param);
        }
      }
      
      const normalizedUrl = urlObj.toString();
      if (normalizedUrl !== url) {
        logger.debug(`Normalized URL: ${url} -> ${normalizedUrl}`);
      }
      
      return normalizedUrl;
    } catch (error) {
      // If URL parsing fails, return the original URL
      logger.warn(`Failed to normalize URL: ${url}`, error);
      return url;
    }
  }

  /**
   * Filter new URLs that don't exist in the existing URLs set
   * @param urls Array of URLs
   * @param existingUrls Set of existing URLs
   * @param paramsToRemove Array of query parameters to remove during normalization
   * @returns Array of new URLs
   */
  filterNewUrls(
    urls: string[],
    existingUrls: Set<string>,
    paramsToRemove: string[] = []
  ): string[] {
    logger.debug(`Filtering ${urls.length} URLs against ${existingUrls.size} existing URLs`);
    logger.debug(`Parameters to remove: ${paramsToRemove.join(', ') || 'none'}`);
    
    // If no parameters to remove, use the original implementation
    if (paramsToRemove.length === 0) {
      const newUrls = urls.filter(url => !existingUrls.has(url));
      logger.info(`Found ${newUrls.length} new URLs (${urls.length - newUrls.length} duplicates filtered out)`);
      return newUrls;
    }
    
    // Normalize existing URLs
    const normalizedExistingUrls = new Set<string>();
    for (const url of existingUrls) {
      normalizedExistingUrls.add(this.normalizeUrl(url, paramsToRemove));
    }
    
    logger.debug(`Normalized ${existingUrls.size} existing URLs to ${normalizedExistingUrls.size} unique normalized URLs`);
    
    // Filter new URLs based on normalized comparison
    const duplicates: string[] = [];
    const newUrls = urls.filter(url => {
      const normalizedUrl = this.normalizeUrl(url, paramsToRemove);
      const isDuplicate = normalizedExistingUrls.has(normalizedUrl);
      if (isDuplicate) {
        duplicates.push(url);
      }
      return !isDuplicate;
    });
    
    if (duplicates.length > 0 && duplicates.length <= 5) {
      logger.debug(`Filtered out duplicates: ${duplicates.join(', ')}`);
    } else if (duplicates.length > 5) {
      logger.debug(`Filtered out ${duplicates.length} duplicates (showing first 5): ${duplicates.slice(0, 5).join(', ')}...`);
    }
    
    logger.info(`Found ${newUrls.length} new URLs (${urls.length - newUrls.length} duplicates filtered out)`);
    return newUrls;
  }
  
  /**
   * Create URL records from URLs
   * @param source Source name
   * @param urls Array of URLs
   * @returns Array of URL records
   */
  createUrlRecords(source: string, urls: string[]): Omit<UrlRecord, 'id'>[] {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    
    return urls.map(url => ({
      source,
      url,
      dateAdded: timestamp,
      seen: false,
      ok: false,
      called: false,
      active: false
    }));
  }
}