/**
 * Schema validation for configuration objects
 */
import { AppConfig, DataConfig, SourceConfig, GistConfig } from '../types/index.js';

/**
 * Validate a source configuration
 * @param source The source name
 * @param config The source configuration
 * @throws Error if the configuration is invalid
 */
export function validateSourceConfig(source: string, config: SourceConfig): void {
  if (!config.url || typeof config.url !== 'string') {
    throw new Error(`Invalid URL for source ${source}: ${config.url}`);
  }
  
  if (!config.command || typeof config.command !== 'string') {
    throw new Error(`Invalid command for source ${source}: ${config.command}`);
  }
  
  try {
    // Validate URL format
    new URL(config.url);
  } catch (error) {
    throw new Error(`Invalid URL format for source ${source}: ${config.url}`);
  }
}

/**
 * Validate the data configuration
 * @param config The data configuration
 * @throws Error if the configuration is invalid
 */
export function validateDataConfig(config: DataConfig): void {
  if (!config || typeof config !== 'object') {
    throw new Error('Data configuration must be an object');
  }
  
  if (Object.keys(config).length === 0) {
    throw new Error('No data sources configured');
  }
  
  // Validate each source
  for (const [source, sourceConfig] of Object.entries(config)) {
    validateSourceConfig(source, sourceConfig);
  }
}

/**
 * Validate the GitHub Gist configuration
 * @param config The Gist configuration
 * @throws Error if the configuration is invalid
 */
export function validateGistConfig(config: GistConfig): void {
  if (!config.token && config.gistId) {
    throw new Error('GitHub token is required when a Gist ID is provided');
  }
  
  if (config.gistId && typeof config.gistId !== 'string') {
    throw new Error(`Invalid Gist ID: ${config.gistId}`);
  }
  
  if (!config.description || typeof config.description !== 'string') {
    throw new Error(`Invalid Gist description: ${config.description}`);
  }
  
  if (!config.filename || typeof config.filename !== 'string') {
    throw new Error(`Invalid Gist filename: ${config.filename}`);
  }
}

/**
 * Validate the server configuration
 * @param config The server configuration
 * @throws Error if the configuration is invalid
 */
export function validateServerConfig(config: AppConfig['server']): void {
  if (!config.port || typeof config.port !== 'number' || config.port <= 0) {
    throw new Error(`Invalid server port: ${config.port}`);
  }
}

/**
 * Validate the complete application configuration
 * @param config The application configuration
 * @throws Error if the configuration is invalid
 */
export function validateAppConfig(config: AppConfig): void {
  if (!config.csvPath || typeof config.csvPath !== 'string') {
    throw new Error(`Invalid CSV path: ${config.csvPath}`);
  }
  
  validateDataConfig(config.dataConfig);
  validateGistConfig(config.gist);
  validateServerConfig(config.server);
}