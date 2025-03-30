import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// Define interfaces
interface SourceConfig {
  url: string;
  command: string;
}

interface DataConfig {
  [key: string]: SourceConfig;
}

// Read existing links from CSV
function readExistingLinks(csvPath: string): Set<string> {
  const existingLinks = new Set<string>();
  
  if (fs.existsSync(csvPath)) {
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    // Skip header
    if (lines.length > 1) {
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length >= 3) {
          // The URL is the third column (index 2)
          const url = parts[2].trim();
          if (url) {
            existingLinks.add(url);
          }
        }
      }
    }
  }
  
  console.log('Existing links:', Array.from(existingLinks));
  return existingLinks;
}

// Get the highest ID from existing CSV
function getHighestId(csvPath: string): number {
  try {
    if (!fs.existsSync(csvPath)) {
      return 0;
    }

    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    // Skip header
    if (lines.length <= 1) {
      return 0;
    }
    
    let highestId = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      const id = parseInt(parts[0], 10);
      if (!isNaN(id) && id > highestId) {
        highestId = id;
      }
    }
    
    return highestId;
  } catch (error) {
    console.error('Error getting highest ID:', error);
    return 0;
  }
}

// Main function
async function main() {
  try {
    console.log('Starting application...');
    
    // Prepare CSV path
    const csvPath = path.join(process.cwd(), 'urls.csv');
    console.log(`CSV path: ${csvPath}`);
    
    // Load configuration
    const configPath = path.join(process.cwd(), 'config.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    const config: DataConfig = JSON.parse(configData);
    
    // Get source from command line arguments
    const specificSource = process.argv[2];
    
    // Determine which sources to process
    let sourcesToProcess: string[] = [];
    
    if (specificSource && !specificSource.startsWith('--')) {
      // Check if source exists in config
      if (!config[specificSource]) {
        console.error(`Source "${specificSource}" not found in config.json`);
        process.exit(1);
      }
      sourcesToProcess = [specificSource];
    } else {
      // Process all sources
      sourcesToProcess = Object.keys(config);
    }
    
    console.log(`Processing ${sourcesToProcess.length} sources: ${sourcesToProcess.join(', ')}`);
    
    // Ensure CSV file exists with headers
    if (!fs.existsSync(csvPath)) {
      fs.writeFileSync(csvPath, 'id,source,url,dateAdded,seen,ok,called,active\n');
    }
    
    // Get highest ID from existing CSV
    let highestId = getHighestId(csvPath);
    console.log(`Highest existing ID: ${highestId}`);
    
    // Read existing links from CSV
    const existingLinks = readExistingLinks(csvPath);
    console.log(`Found ${existingLinks.size} existing unique links in CSV`);
    
    let totalLinks = 0;
    let currentId = highestId;
    
    // Process each source
    for (const source of sourcesToProcess) {
      const sourceConfig = config[source];
      console.log(`\n=== Processing source: ${source} ===`);
      console.log(`URL: ${sourceConfig.url}`);
      
      // Launch browser
      console.log('Launching browser...');
      const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      try {
        // Create a new page
        const page = await browser.newPage();
        
        // Navigate to URL
        console.log(`Navigating to ${sourceConfig.url}`);
        await page.goto(sourceConfig.url, { 
          waitUntil: 'networkidle2',
          timeout: 60000
        });
        console.log('Page loaded successfully');
        
        // Execute the command in the browser context
        console.log('Executing command in browser context...');
        const links = await page.evaluate((command) => {
          try {
            // Execute the command and return the result
            return eval(command);
          } catch (error) {
            console.error('Error executing command in browser:', error);
            return [];
          }
        }, sourceConfig.command);
        
        console.log(`Found ${links.length} links in total`);
        
        // Close browser
        await browser.close();
        console.log('Browser closed');
        
        if (links.length === 0) {
          console.log('No links found for this source, skipping');
          continue;
        }
        
        // Filter out links that already exist in the CSV
        const newLinks = links.filter((url: string) => !existingLinks.has(url));
        console.log(`Found ${newLinks.length} new links (${links.length - newLinks.length} duplicates filtered out)`);
        
        if (newLinks.length === 0) {
          console.log('No new links to add, skipping');
          continue;
        }
        
        // Prepare CSV rows
        const timestamp = Math.floor(Date.now() / 1000);
        const rows = newLinks.map((url: string) => {
          currentId++;
          // Add the URL to the set of existing links to prevent duplicates in the same run
          existingLinks.add(url);
          return `${currentId},${source},${url},${timestamp},false,false,false,false`;
        });
        
        // Append to CSV
        fs.appendFileSync(csvPath, rows.join('\n') + '\n');
        console.log(`Added ${newLinks.length} links to ${csvPath}`);
        
        totalLinks += newLinks.length;
      } catch (error) {
        console.error('Error processing page:', error);
        // Make sure to close the browser even if there's an error
        try {
          await browser.close();
        } catch (closeError) {
          console.error('Error closing browser:', closeError);
        }
      }
    }
    
    console.log(`\n=== Summary ===`);
    console.log(`Processed ${sourcesToProcess.length} sources`);
    console.log(`Added ${totalLinks} links to ${csvPath}`);
    console.log('Application completed successfully!');
  } catch (error) {
    console.error('Application error:', error);
    process.exit(1);
  }
}

// Run the main function
main();