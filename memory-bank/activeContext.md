# Active Context

## Current Focus

The current focus is on refactoring the FlatCrawl application from JavaScript to TypeScript with a more modular architecture. This involves:

1. Converting all JavaScript to TypeScript
2. Implementing a modular architecture with clear separation of concerns
3. Enhancing error handling and logging
4. Centralizing configuration management
5. Reducing code duplication
6. Implementing URL normalization for better duplicate detection
7. Adding frontend GitHub Gist integration without backend dependency
8. Adding archiving capability and cost tracking for records

## Active Tasks

Based on the refactoring plan, the following tasks are currently in progress:

1. **Project Setup and Configuration**
   - Update TypeScript configuration
   - Define core types and interfaces
   - Create configuration module

2. **Storage Module Implementation**
   - CSV Storage implementation
   - GitHub Gist Storage implementation

3. **Scraper Module Implementation**
   - Browser Controller implementation
   - URL Extractor implementation
   - URL normalization for duplicate detection

4. **UI Module Implementation**
   - Server implementation
   - Client-side implementation
   - Frontend GitHub Gist integration
   - Archiving records functionality
   - Cost field implementation

5. **Utilities and Main Application**
   - Logging utility implementation
   - Helper functions implementation
   - Main application implementation

## New Feature: URL Normalization

A new feature is being implemented to normalize URLs before checking for duplicates:

1. **Problem**: URLs with different query parameters (like "searchId") are considered different, even if they point to the same content
2. **Solution**: Add URL normalization to remove specified query parameters before checking for uniqueness
3. **Implementation**: 
   - Add a `normalizeUrl` method to the `UrlExtractor` class
   - Extend the `SourceConfig` interface to include normalization configuration
   - Modify the `filterNewUrls` method to use normalized URLs for comparison
4. **Status**: Design completed, ready for implementation

## New Feature: Frontend GitHub Gist Integration

A new feature is being designed to allow direct GitHub Gist integration from the frontend:

1. **Problem**: Currently, the application requires a backend server to update GitHub Gists
2. **Solution**: Implement GitHub OAuth flow on the frontend to allow direct GitHub API calls
3. **Implementation**:
   - Add GitHub OAuth authentication to the frontend
   - Create a minimal proxy server for token exchange
   - Implement GitHub API client for direct Gist operations
   - Update the UI to support authentication and Gist selection
4. **Status**: Design completed, ready for implementation

## New Feature: Archiving Records and Cost Field

A new feature is being implemented to allow archiving records and tracking costs:

1. **Problem**: Users need to track costs associated with records and archive records they no longer need to actively track
2. **Solution**: Add a cost field and archiving capability to the application
3. **Implementation**:
   - Add a "cost" field to the CSV structure right after the "source" field
   - Add an "archived" field to the CSV structure
   - Update the UI to display and allow editing of these new fields
   - Add an "Archive" button in the UI actions column
   - Style the cost field with centered text and monospace font
4. **Status**: Design completed, ready for implementation

## Open Questions

1. How should we handle backward compatibility during the refactoring process?
2. What testing strategy should we implement for the refactored code?
3. How should we handle error cases in the browser automation process?
4. What performance optimizations can be made in the data storage and retrieval?
5. How can we improve the UI viewer experience?
6. Should we add a utility to normalize existing URLs in the database?
7. How should we handle GitHub API rate limits in the frontend Gist integration?
8. What security measures should we implement for token storage in the browser?
9. How should we handle data migration for existing CSV files when adding new fields?
10. Should we add filtering or sorting capabilities based on the new archived status?

## Next Steps

1. Review the current implementation of the core modules
2. Implement the URL normalization feature in the `UrlExtractor` class
3. Update the `SourceConfig` interface to include normalization configuration
4. Modify the `Scraper` class to use the new normalization feature
5. Implement the frontend GitHub Gist integration
   - Create the OAuth proxy server
   - Implement the GitHub OAuth client
   - Implement the GitHub Gist client
   - Update the viewer.html file
6. Implement the archiving and cost field features
   - Update the UrlRecord interface
   - Modify the CSV storage class
   - Update the UI components
   - Add styling for the cost field
7. Add tests for the new features
8. Update documentation with examples of the new features
9. Prioritize remaining tasks based on dependencies and impact
10. Develop a testing strategy for the refactored code