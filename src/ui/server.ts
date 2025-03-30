/**
 * UI server for the FlatCrawl application
 */
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { AppConfig } from '../types/index.js';
import { CsvStorage } from '../storage/csv.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('UIServer');

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * UI server class
 */
export class UIServer {
  private app: express.Application;
  private storage: CsvStorage;
  
  /**
   * Create a new UI server
   * @param config Application configuration
   */
  constructor(private config: AppConfig) {
    this.app = express();
    this.storage = new CsvStorage(config.csvPath);
    
    this.setupMiddleware();
    this.setupRoutes();
    
    logger.debug('UI server initialized');
  }
  
  /**
   * Set up middleware
   */
  private setupMiddleware(): void {
    // Serve static files from public directory
    this.app.use(express.static(path.join(__dirname, 'public')));
    
    // Parse JSON request bodies
    this.app.use(express.json());
  }
  
  /**
   * Set up routes
   */
  private setupRoutes(): void {
    // Serve the viewer HTML
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
    
    // API: Get CSV data
    this.app.get('/api/data', (req, res) => {
      try {
        const records = this.storage.read();
        res.json(records);
      } catch (error) {
        logger.error('Error reading CSV:', error);
        res.status(500).json({ error: 'Failed to read CSV data' });
      }
    });
    
    // API: Update CSV data
    this.app.post('/api/data', (req, res) => {
      try {
        const updatedRecords = req.body;
        this.storage.write(updatedRecords);
        res.json({ success: true, message: 'CSV data updated successfully' });
      } catch (error) {
        logger.error('Error updating CSV:', error);
        res.status(500).json({ error: 'Failed to update CSV data' });
      }
    });
    
    // API: Trigger sync to GitHub Gist
    this.app.post('/api/sync', (req, res) => {
      exec('pnpm run sync', (error, stdout, stderr) => {
        if (error) {
          logger.error(`Sync error: ${error.message}`);
          return res.status(500).json({ error: 'Sync failed', details: error.message });
        }
        
        if (stderr) {
          logger.error(`Sync stderr: ${stderr}`);
        }
        
        logger.info(`Sync stdout: ${stdout}`);
        res.json({ success: true, message: 'Sync completed successfully' });
      });
    });
  }
  
  /**
   * Start the server
   * @param port Port to listen on
   * @returns Promise that resolves when the server is started
   */
  start(port: number): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(port, () => {
        logger.info(`Server running at http://localhost:${port}`);
        resolve();
      });
    });
  }
}

/**
 * Start the UI server
 * @param port Port to listen on
 * @param config Application configuration
 * @returns Promise that resolves when the server is started
 */
export async function startServer(port: number, config: AppConfig): Promise<void> {
  const server = new UIServer(config);
  await server.start(port);
}