/**
 * FlatCrawl - Application that opens browser with URLs and tracks them in CSV
 */
import { Command } from 'commander';
import config from './config/index.js';
import { Logger } from './utils/logger.js';
import { createScraper } from './scraper/index.js';
import { syncCsvToGist } from './storage/index.js';

// Create logger
const logger = new Logger('Main');

/**
 * Main function
 */
async function main() {
  try {
    const program = new Command();
    
    program
      .name('flatcrawl')
      .description('Application that opens browser with URLs and tracks them in CSV')
      .version('1.0.0');
    
    program
      .command('scrape')
      .description('Scrape URLs from configured sources')
      .argument('[source]', 'specific source to scrape')
      .action(async (source?: string) => {
        try {
          logger.info('Starting scraper...');
          
          // Create scraper
          const scraper = createScraper(config);
          
          // Scrape URLs
          if (source) {
            logger.info(`Scraping source: ${source}`);
            await scraper.scrapeSource(source);
          } else {
            logger.info('Scraping all sources');
            await scraper.scrapeAll();
          }
          
          logger.info('Scraping completed successfully');
        } catch (error) {
          logger.error('Error during scraping:', error);
          process.exit(1);
        }
      });
    
    program
      .command('serve')
      .description('Start the UI server')
      .option('-p, --port <port>', 'port to run the server on', String(config.server.port))
      .action(async (options: { port: string }) => {
        try {
          const port = parseInt(options.port, 10);
          logger.info(`Starting server on port ${port}...`);
          
          // Import server module dynamically to avoid loading it when not needed
          const { startServer } = await import('./ui/server.js');
          await startServer(port, config);
          
          logger.info(`Server running at http://localhost:${port}`);
        } catch (error) {
          logger.error('Error starting server:', error);
          process.exit(1);
        }
      });
    
    program
      .command('sync')
      .description('Sync CSV data to GitHub Gist')
      .action(async () => {
        try {
          logger.info('Syncing CSV data to GitHub Gist...');
          
          // Sync CSV to Gist
          const gistId = await syncCsvToGist(config);
          
          logger.info(`Sync completed successfully. Gist ID: ${gistId}`);
        } catch (error) {
          logger.error('Error syncing to GitHub Gist:', error);
          process.exit(1);
        }
      });
    
    // Parse command line arguments
    program.parse();
  } catch (error) {
    logger.error('Unhandled error:', error);
    process.exit(1);
  }
}

// Run the main function
main();