/**
 * Core type definitions for the FlatCrawl application
 */

/**
 * Configuration for a source to scrape
 */
export interface SourceConfig {
  /** URL to navigate to */
  url: string;
  /** JavaScript command to execute in the browser context to extract URLs */
  command: string;
  /** URL normalization configuration */
  normalization?: {
    /** Query parameters to remove during normalization */
    removeParams?: string[];
  };
}

/**
 * Configuration for all sources
 */
export interface DataConfig {
  [key: string]: SourceConfig;
}

/**
 * Represents a URL record in the database
 */
export interface UrlRecord {
  /** Unique identifier */
  id: string;
  /** Source name */
  source: string;
  /** Cost information */
  cost: string;
  /** The URL */
  url: string;
  /** Unix timestamp when the URL was added */
  dateAdded: string;
  /** Whether the URL has been seen */
  seen: boolean;
  /** Whether the URL is OK */
  ok: boolean;
  /** Whether the URL has been called */
  called: boolean;
  /** Whether the URL is active */
  active: boolean;
  /** Whether the record is archived */
  archived: boolean;
}

/**
 * Configuration for GitHub Gist integration
 */
export interface GistConfig {
  /** GitHub personal access token */
  token: string;
  /** ID of an existing Gist to update (optional) */
  gistId?: string;
  /** Description for the Gist */
  description: string;
  /** Filename for the CSV content in the Gist */
  filename: string;
}

/**
 * Application configuration
 */
export interface AppConfig {
  /** Path to the CSV file */
  csvPath: string;
  /** Configuration for data sources */
  dataConfig: DataConfig;
  /** Configuration for GitHub Gist integration */
  gist: GistConfig;
  /** Server configuration */
  server: {
    /** Port to run the server on */
    port: number;
  };
}