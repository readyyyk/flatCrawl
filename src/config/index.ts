/**
 * Configuration module for the FlatCrawl application
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { AppConfig, DataConfig, SourceConfig } from '../types/index.js';
import { validateAppConfig } from './schema.js';

// Load environment variables from .env file
dotenv.config();

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Partial<AppConfig> = {
  csvPath: path.join(process.cwd(), 'urls.csv'),
  server: {
    port: 3000
  },
  gist: {
    token: '',
    description: 'FlatCrawl URL Database',
    filename: 'urls.csv'
  }
};

/**
 * Load configuration from environment variables and config files
 */
export function loadConfig(): AppConfig {
  // Load data config from config.json
  const configPath = path.join(process.cwd(), 'config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }
  
  const dataConfig: DataConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  // Create config object
  const config: AppConfig = {
    csvPath: process.env.CSV_PATH || DEFAULT_CONFIG.csvPath!,
    dataConfig,
    gist: {
      token: process.env.GITHUB_TOKEN || '',
      gistId: process.env.GIST_ID,
      description: process.env.GIST_DESCRIPTION || DEFAULT_CONFIG.gist!.description!,
      filename: process.env.GIST_FILENAME || DEFAULT_CONFIG.gist!.filename!
    },
    server: {
      port: process.env.PORT ? parseInt(process.env.PORT, 10) : DEFAULT_CONFIG.server!.port!
    }
  };
  
  // Validate configuration
  validateConfig(config);
  
  return config;
}

/**
 * Validate the configuration
 */
function validateConfig(config: AppConfig): void {
  validateAppConfig(config);
}

/**
 * Get the configuration for a specific source
 */
export function getSourceConfig(config: AppConfig, source: string) {
  const sourceConfig = config.dataConfig[source];
  if (!sourceConfig) {
    throw new Error(`Source not found: ${source}`);
  }
  return sourceConfig;
}

// Export default config
const config = loadConfig();
export default config;