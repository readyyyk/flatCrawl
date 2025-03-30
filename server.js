import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const CSV_PATH = path.join(__dirname, 'urls.csv');

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Serve the viewer HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'viewer.html'));
});

// API: Get CSV data
app.get('/api/data', (req, res) => {
  try {
    // Read the CSV file
    const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
    
    // Parse CSV to JSON
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    // Convert string boolean values to actual booleans
    const formattedRecords = records.map(record => ({
      ...record,
      seen: record.seen === 'true',
      ok: record.ok === 'true',
      called: record.called === 'true',
      active: record.active === 'true'
    }));
    
    res.json(formattedRecords);
  } catch (error) {
    console.error('Error reading CSV:', error);
    res.status(500).json({ error: 'Failed to read CSV data' });
  }
});

// API: Update CSV data
app.post('/api/data', (req, res) => {
  try {
    const updatedRecords = req.body;
    
    // Read the current CSV to get the header
    const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
    const lines = csvContent.split('\n');
    const header = lines[0];
    
    // Convert boolean values back to strings
    const formattedRecords = updatedRecords.map(record => ({
      ...record,
      seen: String(record.seen),
      ok: String(record.ok),
      called: String(record.called),
      active: String(record.active)
    }));
    
    // Convert JSON back to CSV
    const csvOutput = stringify(formattedRecords, { 
      header: true,
      columns: header.split(',')
    });
    
    // Write back to the CSV file
    fs.writeFileSync(CSV_PATH, csvOutput);
    
    res.json({ success: true, message: 'CSV data updated successfully' });
  } catch (error) {
    console.error('Error updating CSV:', error);
    res.status(500).json({ error: 'Failed to update CSV data' });
  }
});

// API: Trigger sync to GitHub Gist
app.post('/api/sync', (req, res) => {
  exec('pnpm run sync-to-gist', (error, stdout, stderr) => {
    if (error) {
      console.error(`Sync error: ${error.message}`);
      return res.status(500).json({ error: 'Sync failed', details: error.message });
    }
    
    if (stderr) {
      console.error(`Sync stderr: ${stderr}`);
    }
    
    console.log(`Sync stdout: ${stdout}`);
    res.json({ success: true, message: 'Sync completed successfully' });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});