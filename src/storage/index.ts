/**
 * Storage module for the FlatCrawl application
 */
export * from './csv.js';
export * from './gist.js';

import { CsvStorage } from './csv.js';
import { GistStorage } from './gist.js';
import { AppConfig } from '../types/index.js';
import { Logger } from '../utils/logger.js';
import fs from 'fs';

const logger = new Logger('Storage');

/**
 * Sync CSV data to GitHub Gist
 * @param config Application configuration
 * @returns ID of the Gist
 */
export async function syncCsvToGist(config: AppConfig): Promise<string> {
  try {
    logger.info('Syncing CSV data to GitHub Gist...');
    
    // Check if CSV file exists
    if (!fs.existsSync(config.csvPath)) {
      throw new Error(`CSV file not found: ${config.csvPath}`);
    }
    
    // Read CSV file
    const csvContent = fs.readFileSync(config.csvPath, 'utf8');
    logger.info(`CSV file read successfully (${csvContent.split('\n').length} lines)`);
    
    // Create Gist storage
    const gistStorage = new GistStorage(config.gist);
    
    // Sync content to Gist
    const gistId = await gistStorage.syncContent(csvContent);
    logger.info(`CSV data synced to Gist with ID: ${gistId}`);
    
    return gistId;
  } catch (error) {
    logger.error('Error syncing CSV to Gist:', error);
    throw new Error(`Failed to sync CSV to Gist: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Create storage instances
 * @param config Application configuration
 * @returns Storage instances
 */
export function createStorage(config: AppConfig): {
  csvStorage: CsvStorage;
  gistStorage: GistStorage;
} {
  const csvStorage = new CsvStorage(config.csvPath);
  const gistStorage = new GistStorage(config.gist);
  
  return {
    csvStorage,
    gistStorage
  };
}