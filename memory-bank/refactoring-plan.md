# FlatCrawl Refactoring Plan

This document outlines the plan for refactoring the FlatCrawl application, focusing on converting JavaScript to TypeScript and improving code organization.

## Goals

1. **Convert all JavaScript to TypeScript** for better type safety and developer experience
2. **Improve code organization** with a modular architecture
3. **Enhance error handling and logging**
4. **Centralize configuration management**
5. **Reduce code duplication**

## New Project Structure

```
flatcrawl/
├── src/
│   ├── config/
│   │   ├── index.ts           # Configuration management
│   │   └── schema.ts          # Configuration validation schemas
│   ├── scraper/
│   │   ├── index.ts           # Scraper module entry point
│   │   ├── browser.ts         # Browser controller
│   │   └── extractor.ts       # URL extraction logic
│   ├── storage/
│   │   ├── index.ts           # Storage module entry point
│   │   ├── csv.ts             # CSV storage implementation
│   │   └── gist.ts            # GitHub Gist storage implementation
│   ├── ui/
│   │   ├── index.ts           # UI module entry point
│   │   ├── server.ts          # API server
│   │   └── public/            # Static assets
│   │       ├── index.html     # Main UI page
│   │       ├── js/            # Client-side JavaScript
│   │       └── css/           # Stylesheets
│   ├── utils/
│   │   ├── logger.ts          # Logging utility
│   │   └── helpers.ts         # Helper functions
│   └── index.ts               # Application entry point
├── .env.example               # Example environment variables
├── .gitignore                 # Git ignore file
├── package.json               # Package configuration
├── tsconfig.json              # TypeScript configuration
└── README.md                  # Project documentation
```

## Implementation Plan

### Phase 1: Project Setup and Configuration

1. **Update TypeScript Configuration**
   - Modify `tsconfig.json` to support the new structure
   - Configure module resolution and paths

2. **Define Core Types and Interfaces**
   - Create type definitions for all data structures
   - Define interfaces for components

3. **Create Configuration Module**
   - Centralize configuration loading
   - Add validation for configuration
   - Support environment variables and config files

### Phase 2: Storage Module

1. **CSV Storage Implementation**
   - Create a class for CSV file operations
   - Add methods for reading, writing, and querying data
   - Implement proper error handling

2. **GitHub Gist Storage Implementation**
   - Create a class for GitHub Gist operations
   - Add methods for creating, updating, and fetching gists
   - Implement retry logic and error handling

### Phase 3: Scraper Module

1. **Browser Controller**
   - Create a class for browser automation
   - Add methods for page navigation and command execution
   - Implement proper error handling and cleanup

2. **URL Extractor**
   - Create a class for URL extraction logic
   - Add methods for filtering and processing URLs
   - Implement data transformation

### Phase 4: UI Module

1. **Server Implementation**
   - Create a TypeScript Express server
   - Add API routes for data operations
   - Implement proper error handling

2. **Client-Side Implementation**
   - Organize client-side JavaScript
   - Improve UI components
   - Enhance error handling and user feedback

### Phase 5: Utilities and Main Application

1. **Logging Utility**
   - Create a flexible logging system
   - Support different log levels
   - Add context to log messages

2. **Helper Functions**
   - Create reusable utility functions
   - Add error handling helpers
   - Implement retry logic

3. **Main Application**
   - Create a CLI interface
   - Implement command handlers
   - Add proper error handling

## Detailed Component Specifications

### Core Types

```typescript
// Types for configuration
export interface SourceConfig {
  url: string;
  command: string;
}

export interface DataConfig {
  [key: string]: SourceConfig;
}

// Types for data records
export interface UrlRecord {
  id: string;
  source: string;
  url: string;
  dateAdded: string;
  seen: boolean;
  ok: boolean;
  called: boolean;
  active: boolean;
}

// Types for GitHub Gist configuration
export interface GistConfig {
  token: string;
  gistId?: string;
  description: string;
  filename: string;
}
```

### Storage Module

The storage module will provide interfaces and implementations for data persistence:

```typescript
// CSV Storage
export class CsvStorage {
  constructor(private csvPath: string) {}
  
  read(): UrlRecord[] { /* ... */ }
  write(records: UrlRecord[]): void { /* ... */ }
  getHighestId(): number { /* ... */ }
  getExistingUrls(): Set<string> { /* ... */ }
  appendRecords(newRecords: Omit<UrlRecord, 'id'>[]): UrlRecord[] { /* ... */ }
}

// GitHub Gist Storage
export class GistStorage {
  constructor(private config: GistConfig) {}
  
  async createGist(content: string): Promise<string> { /* ... */ }
  async updateGist(content: string): Promise<void> { /* ... */ }
  async syncContent(content: string): Promise<string> { /* ... */ }
  async getContent(): Promise<string> { /* ... */ }
}
```

### Scraper Module

The scraper module will handle browser automation and URL extraction:

```typescript
// Browser Controller
export class BrowserController {
  async executeCommand(url: string, command: string): Promise<string[]> { /* ... */ }
}

// URL Extractor
export class UrlExtractor {
  constructor(private browser: BrowserController) {}
  
  async extractUrls(source: string, config: SourceConfig): Promise<string[]> { /* ... */ }
  filterNewUrls(urls: string[], existingUrls: Set<string>): string[] { /* ... */ }
  createUrlRecords(source: string, urls: string[]): Omit<UrlRecord, 'id'>[] { /* ... */ }
}

// Main Scraper
export class Scraper {
  constructor(private config: DataConfig, private storage: CsvStorage) {}
  
  async scrapeSource(source: string): Promise<number> { /* ... */ }
  async scrapeAll(): Promise<number> { /* ... */ }
}
```

### UI Module

The UI module will provide a web interface for viewing and editing data:

```typescript
// Server
export class Server {
  constructor() {}
  
  private setupMiddleware(): void { /* ... */ }
  private setupRoutes(): void { /* ... */ }
  start(port: number): void { /* ... */ }
}

// Client-side code will be organized in the public directory
```

### Utilities

The utilities module will provide helper functions and logging:

```typescript
// Logger
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export class Logger {
  constructor(private context: string, private minLevel: LogLevel = LogLevel.INFO) {}
  
  debug(message: string, ...args: any[]): void { /* ... */ }
  info(message: string, ...args: any[]): void { /* ... */ }
  warn(message: string, ...args: any[]): void { /* ... */ }
  error(message: string, ...args: any[]): void { /* ... */ }
}

// Helper Functions
export function formatDate(timestamp: number | string): string { /* ... */ }
export async function retry<T>(fn: () => Promise<T>, maxRetries: number, delay: number): Promise<T> { /* ... */ }
```

### Main Application

The main application will provide a CLI interface:

```typescript
// Main Application
async function main() {
  const program = new Command();
  
  program
    .command('scrape')
    .description('Scrape URLs from configured sources')
    .argument('[source]', 'specific source to scrape')
    .action(async (source?: string) => { /* ... */ });
  
  program
    .command('serve')
    .description('Start the UI server')
    .action(() => { /* ... */ });
  
  program.parse();
}
```

## Migration Strategy

To ensure a smooth transition, we'll follow these steps:

1. Create the new directory structure
2. Implement the core types and configuration module
3. Implement the storage module
4. Implement the scraper module
5. Implement the UI module
6. Implement the utilities and main application
7. Update package.json scripts
8. Test the refactored application

## Package.json Updates

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js scrape",
    "dev": "tsx src/index.ts scrape",
    "serve": "tsx src/index.ts serve",
    "sync-to-gist": "tsx src/scripts/syncToGist.ts"
  }
}
```

This refactoring plan provides a comprehensive guide for converting the FlatCrawl application to TypeScript and improving its code organization. The modular architecture will make the code more maintainable, testable, and extensible.