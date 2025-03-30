# FlatCrawl

A simple application that opens a browser with URLs provided in configuration, executes JavaScript commands within the browser context to extract links, and saves them to a CSV file.

## Features

- Opens a browser with the URL provided in the configuration
- Executes JavaScript commands within the browser context to extract links
- Writes links to a CSV file with metadata
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

## Development

### Project Structure

- `index.ts`: Main application file
- `config.json`: Configuration file
- `urls.csv`: CSV file for storing links
- `tsconfig.json`: TypeScript configuration

### Dependencies

- Puppeteer: For browser automation
- TypeScript: For type-safe JavaScript

## License

ISC