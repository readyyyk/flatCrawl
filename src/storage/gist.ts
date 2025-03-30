/**
 * GitHub Gist storage implementation for the FlatCrawl application
 */
import { Octokit } from '@octokit/rest';
import { GistConfig } from '../types/index.js';
import { Logger } from '../utils/logger.js';
import { retry } from '../utils/helpers.js';

const logger = new Logger('GistStorage');

/**
 * GitHub Gist storage class
 */
export class GistStorage {
  private octokit: Octokit;
  
  /**
   * Create a new GitHub Gist storage
   * @param config GitHub Gist configuration
   */
  constructor(private config: GistConfig) {
    if (!config.token) {
      throw new Error('GitHub token is required');
    }
    
    this.octokit = new Octokit({
      auth: config.token
    });
    
    logger.debug('GistStorage initialized');
  }
  
  /**
   * Create a new Gist
   * @param content Content to store in the Gist
   * @returns ID of the created Gist
   */
  async createGist(content: string): Promise<string> {
    try {
      logger.info('Creating new Gist...');
      
      const response = await this.octokit.gists.create({
        description: this.config.description,
        public: false,
        files: {
          [this.config.filename]: {
            content
          }
        }
      });
      
      logger.info(`Gist created successfully with ID: ${response.data.id}`);
      return response.data.id;
    } catch (error) {
      logger.error('Error creating Gist:', error);
      throw new Error(`Failed to create Gist: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Update an existing Gist
   * @param gistId ID of the Gist to update
   * @param content New content for the Gist
   */
  async updateGist(gistId: string, content: string): Promise<void> {
    try {
      logger.info(`Updating Gist with ID: ${gistId}...`);
      
      await this.octokit.gists.update({
        gist_id: gistId,
        files: {
          [this.config.filename]: {
            content
          }
        }
      });
      
      logger.info('Gist updated successfully');
    } catch (error) {
      logger.error('Error updating Gist:', error);
      throw new Error(`Failed to update Gist: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Sync content to GitHub Gist
   * @param content Content to sync
   * @returns ID of the Gist
   */
  async syncContent(content: string): Promise<string> {
    return retry(async () => {
      if (this.config.gistId) {
        await this.updateGist(this.config.gistId, content);
        return this.config.gistId;
      } else {
        const gistId = await this.createGist(content);
        return gistId;
      }
    }, 3, 2000);
  }
  
  /**
   * Get content from a GitHub Gist
   * @returns Content of the Gist
   */
  async getContent(): Promise<string> {
    try {
      if (!this.config.gistId) {
        throw new Error('Gist ID is required for fetching content');
      }
      
      logger.info(`Fetching content from Gist with ID: ${this.config.gistId}...`);
      
      const response = await this.octokit.gists.get({
        gist_id: this.config.gistId
      });
      
      const file = response.data.files?.[this.config.filename];
      if (!file || !file.content) {
        throw new Error(`File ${this.config.filename} not found in gist`);
      }
      
      logger.info('Gist content fetched successfully');
      return file.content;
    } catch (error) {
      logger.error('Error fetching Gist content:', error);
      throw new Error(`Failed to fetch Gist content: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Check if a Gist exists
   * @param gistId ID of the Gist to check
   * @returns True if the Gist exists, false otherwise
   */
  async gistExists(gistId: string): Promise<boolean> {
    try {
      await this.octokit.gists.get({
        gist_id: gistId
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}