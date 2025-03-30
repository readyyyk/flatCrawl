# FlatCrawl

A simple application that opens a browser with URLs provided in configuration, executes JavaScript commands within the browser context to extract links, and saves them to a CSV file.

## Features

- Opens a browser with the URL provided in the configuration
- Executes JavaScript commands within the browser context to extract links
- Writes links to a CSV file with metadata
- Checks for duplicate links to avoid adding the same link multiple times
- Can process a single source or all sources at once
- Supports browser automation with Puppeteer

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/flatcrawl.git
cd flatcrawl

# Install dependencies
pnpm install
```

## Configuration

Create a `config.json` file in the root directory with the following structure:

```json
{
  "sourceName": {
    "url": "https://example.com",
    "command": "[...document.querySelectorAll('a')].map(a => a.href)"
  }
}
```

Each source should have:
- A unique name (e.g., "example", "github", "news")
- A `url` property specifying the URL to open in the browser
- A `command` property containing JavaScript code that will be executed in the browser context to extract links

### Example Commands

1. Extract all links from a page:
```
"[...document.querySelectorAll('a')].map(a => a.href)"
```

2. Extract links from specific elements:
```
"[...document.querySelectorAll('.product-item')].map(item => item.querySelector('a.product-link').href)"
```

3. Extract links with filtering:
```
"[...document.querySelectorAll('a')].map(a => a.href).filter(href => href.includes('article'))"
```

4. Extract links from real estate listings:
```
"[...document.querySelectorAll('[data-index]')].map(a=>a.firstChild).map(x=>x.querySelector('a').href)"
```

## Usage

### Build the application

```bash
pnpm run build
```

### Run the application

Process a specific source:

```bash
pnpm run dev -- sourceName
```

Process all sources:

```bash
pnpm run dev
```

## CSV Format

The application writes links to a CSV file (`urls.csv`) with the following columns:

- `id`: Unique identifier (integer)
- `source`: Source name (string)
- `url`: Link URL (string)
- `dateAdded`: Timestamp when the link was added (integer, Unix timestamp)
- `seen`: Whether the link has been seen (boolean, default: false)
- `ok`: Whether the link is OK (boolean, default: false)
- `called`: Whether the link has been called (boolean, default: false)
- `active`: Whether the link is active (boolean, default: false)

## Duplicate Handling

The application checks if a link already exists in the CSV file before adding it. This prevents duplicate entries and keeps the CSV file clean. When running the application, it will:

1. Read all existing links from the CSV file
2. Compare new links found in the browser against the existing links
3. Only add links that don't already exist in the CSV file
4. Report how many duplicates were filtered out

## GitHub Gists Integration

FlatCrawl can sync your CSV data to GitHub Gists, providing a backup and remote access to your data.

### Setup

1. Create a GitHub Personal Access Token:
   - Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
   - Click "Generate new token" (classic)
   - Give it a name (e.g., "FlatCrawl Gist Access")
   - Select the "gist" scope
   - Click "Generate token"
   - Copy the token (you won't be able to see it again)

2. Create a `.env` file in the root directory:
   ```
   # GitHub Personal Access Token with gist scope
   GITHUB_TOKEN=your_personal_access_token_here

   # Optional: ID of an existing Gist to update (leave empty to create a new one)
   GIST_ID=

   # Description for the Gist (used when creating a new Gist)
   GIST_DESCRIPTION=FlatCrawl URL Database

   # Filename for the CSV content in the Gist
   GIST_FILENAME=urls.csv
   ```

3. Install the required dependencies:
   ```bash
   pnpm install
   ```

### Usage

Sync your CSV data to GitHub Gists:

```bash
pnpm run sync-to-gist
```

Run the application and then sync to GitHub Gists:

```bash
pnpm run start-and-sync
```

### Notes

- The first time you run the sync, a new Gist will be created
- The Gist ID will be displayed in the console output
- Add this Gist ID to your `.env` file to update the same Gist in future runs
- If syncing fails, the script will retry up to 3 times before giving up

## UI Viewer

FlatCrawl includes a web-based UI for viewing and editing your data, with direct GitHub Gists integration.

### Features

- View all your scraped URLs in a table format
- Edit boolean values (seen, ok, called, active) with simple toggles
- Save changes to the local CSV file
- Sync changes to GitHub Gists
- Responsive design that works on desktop and mobile
- **Direct GitHub Gist Integration**: Loads data directly from your GitHub Gist

### Setup

1. The UI viewer requires the same setup as the GitHub Gists integration (see above).
2. Update the Gist URL in the `viewer.html` file to point to your own Gist:
   ```javascript
   const gistUrl = 'https://gist.githubusercontent.com/yourusername/yourgistid/raw/yourfilename';
   ```

### Usage

#### Option 1: Using the Express Server

Start the UI viewer with the Express server:

```bash
pnpm run viewer
```

Then open your browser to:

```
http://localhost:3000
```

#### Option 2: Direct HTML File (Recommended)

Simply open the `viewer.html` file directly in your browser:

```bash
# On macOS
open viewer.html

# On Windows
start viewer.html

# On Linux
xdg-open viewer.html
```

### Using the UI

1. **View Data**: All your scraped URLs will be displayed in a table, loaded directly from GitHub Gist
2. **Edit Data**: Toggle the checkboxes to change boolean values
3. **Save Changes**: Click the "Save Changes" button to update the local CSV file
4. **Sync to Gist**: Click the "Sync to GitHub Gist" button to sync your changes to GitHub

### Notes

- The UI automatically loads data directly from your GitHub Gist
- Changes are not saved until you click the "Save Changes" button
- Syncing to GitHub Gist is a separate step after saving
- The viewer works offline once loaded, but requires internet connection to fetch the latest data and sync changes

## Development

### Project Structure

- `index.ts`: Main application file
- `syncToGist.ts`: Script for syncing CSV data to GitHub Gists
- `config.json`: Configuration file
- `urls.csv`: CSV file for storing links
- `.env`: Environment variables (not tracked in git)
- `tsconfig.json`: TypeScript configuration

### Dependencies

- Puppeteer: For browser automation
- Octokit: For GitHub API integration
- Dotenv: For loading environment variables
- TypeScript: For type-safe JavaScript

## License

ISC