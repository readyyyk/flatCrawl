import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

// Constants and configuration
const MAX_RETRIES = 2; // Total attempts will be 3 (initial + 2 retries)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GIST_ID = process.env.GIST_ID;
const GIST_DESCRIPTION = process.env.GIST_DESCRIPTION || 'FlatCrawl URL Database';
const GIST_FILENAME = process.env.GIST_FILENAME || 'urls.csv';
const CSV_PATH = path.join(process.cwd(), 'urls.csv');

// Validate environment
if (!GITHUB_TOKEN) {
  console.error('Error: GITHUB_TOKEN is required. Please set it in your .env file.');
  process.exit(1);
}

if (!fs.existsSync(CSV_PATH)) {
  console.error(`Error: CSV file not found at ${CSV_PATH}`);
  process.exit(1);
}

// Initialize GitHub API client
const octokit = new Octokit({
  auth: GITHUB_TOKEN
});

/**
 * Create a new Gist with the CSV content
 * @param csvContent The content of the CSV file
 * @returns The ID of the created Gist
 */
async function createGist(csvContent: string): Promise<string> {
  console.log('Creating new Gist...');
  
  const response = await octokit.gists.create({
    description: GIST_DESCRIPTION,
    public: false,
    files: {
      [GIST_FILENAME]: {
        content: csvContent
      }
    }
  });
  
  console.log(`Gist created successfully with ID: ${response.data.id}`);
  console.log(`Add this ID to your .env file as GIST_ID=${response.data.id}`);
  
  return response.data.id;
}

/**
 * Update an existing Gist with new CSV content
 * @param gistId The ID of the Gist to update
 * @param csvContent The new content of the CSV file
 */
async function updateGist(gistId: string, csvContent: string): Promise<void> {
  console.log(`Updating Gist with ID: ${gistId}...`);
  
  await octokit.gists.update({
    gist_id: gistId,
    files: {
      [GIST_FILENAME]: {
        content: csvContent
      }
    }
  });
  
  console.log('Gist updated successfully');
}

/**
 * Sync the local CSV file to GitHub Gists with retry logic
 */
async function syncToGist(): Promise<void> {
  let retries = 0;
  let success = false;
  
  // Read the CSV file
  console.log(`Reading CSV file from ${CSV_PATH}...`);
  const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
  console.log(`CSV file read successfully (${csvContent.split('\n').length} lines)`);
  
  while (!success && retries <= MAX_RETRIES) {
    try {
      if (retries > 0) {
        console.log(`Retry attempt ${retries}/${MAX_RETRIES}...`);
      }
      
      if (GIST_ID) {
        // Update existing Gist
        await updateGist(GIST_ID, csvContent);
      } else {
        // Create new Gist
        await createGist(csvContent);
      }
      
      success = true;
    } catch (error) {
      retries++;
      
      if (error instanceof Error) {
        console.error(`Error syncing to Gist: ${error.message}`);
      } else {
        console.error('Unknown error syncing to Gist');
      }
      
      if (retries <= MAX_RETRIES) {
        console.log(`Retrying in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.error('All retry attempts failed');
        process.exit(1);
      }
    }
  }
  
  console.log('Sync completed successfully');
}

// Run the sync function
syncToGist().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});