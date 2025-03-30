# FlatCrawl Project Brief

## Project Overview

FlatCrawl is a web scraping application that automates the process of extracting links from websites. It opens a browser with URLs provided in configuration, executes JavaScript commands within the browser context to extract links, and saves them to a CSV file. The application also includes GitHub Gists integration for data syncing and a UI viewer for data management.

## Core Features

1. **Web Scraping**
   - Opens a browser with URLs from configuration
   - Executes JavaScript commands to extract links
   - Supports custom extraction logic per source

2. **Data Management**
   - Saves links to a CSV file with metadata
   - Checks for duplicate links
   - Tracks link status (seen, ok, called, active)

3. **GitHub Gists Integration**
   - Syncs CSV data to GitHub Gists
   - Provides backup and remote access to data
   - Supports creating new gists or updating existing ones

4. **UI Viewer**
   - Web-based interface for viewing and editing data
   - Direct GitHub Gist integration
   - Responsive design for desktop and mobile

## Current Status

The project is currently undergoing a major refactoring effort to:
1. Convert all JavaScript to TypeScript for better type safety
2. Improve code organization with a modular architecture
3. Enhance error handling and logging
4. Centralize configuration management
5. Reduce code duplication

## Technical Stack

- **Language**: TypeScript (being migrated from JavaScript)
- **Browser Automation**: Puppeteer
- **GitHub Integration**: Octokit
- **Environment Variables**: Dotenv
- **UI**: HTML, CSS, JavaScript (with Express server option)

## Project Structure (Planned)

The refactored project will follow a modular architecture with the following components:

1. **Configuration Module**: Manages application settings
2. **Scraper Module**: Handles browser automation and URL extraction
3. **Storage Module**: Manages data persistence (CSV and GitHub Gists)
4. **UI Module**: Provides web interface for data management
5. **Utilities**: Includes logging and helper functions

## Development Roadmap

The refactoring plan is divided into several phases:

1. Project Setup and Configuration
2. Storage Module Implementation
3. Scraper Module Implementation
4. UI Module Implementation
5. Utilities and Main Application

## Key Challenges

1. Ensuring backward compatibility during refactoring
2. Maintaining data integrity during storage operations
3. Handling browser automation edge cases
4. Providing a responsive and intuitive UI
5. Managing GitHub API rate limits and authentication

## Success Criteria

1. Complete TypeScript migration with proper type definitions
2. Modular architecture with clear separation of concerns
3. Improved error handling and logging
4. Reduced code duplication
5. Enhanced user experience in the UI viewer