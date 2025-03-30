# Archiving Records and Cost Field Implementation Plan

## Overview

This document outlines the plan for implementing two new features in the FlatCrawl application:

1. **Archiving Records**: Add the ability to mark records as archived, which will help users organize and manage their data more effectively.
2. **Cost Field**: Add a new "cost" field to store pricing information for each record.

## Current System Analysis

Based on the code review, the FlatCrawl application currently:

- Stores data in a CSV file with the following structure: `id,source,url,dateAdded,seen,ok,called,active`
- Provides a web UI for viewing and editing the data
- Allows syncing data to GitHub Gist

## Implementation Requirements

### 1. CSV Structure Updates

We need to modify the CSV structure to include the new fields:

- Add a `cost` field after the `source` field
- Add an `archived` field at the end of the record

Updated CSV structure: `id,source,cost,url,dateAdded,seen,ok,called,active,archived`

### 2. TypeScript Type Updates

Update the `UrlRecord` interface in `src/types/index.ts` to include the new fields:

```typescript
export interface UrlRecord {
  /** Unique identifier */
  id: string;
  /** Source name */
  source: string;
  /** Cost information */
  cost: string;
  /** The URL */
  url: string;
  /** Unix timestamp when the URL was added */
  dateAdded: string;
  /** Whether the URL has been seen */
  seen: boolean;
  /** Whether the URL is OK */
  ok: boolean;
  /** Whether the URL has been called */
  called: boolean;
  /** Whether the URL is active */
  active: boolean;
  /** Whether the record is archived */
  archived: boolean;
}
```

### 3. CSV Storage Updates

Modify the `CsvStorage` class in `src/storage/csv.ts` to:

- Update the CSV header when creating a new file
- Include the new fields when reading/writing records
- Handle the new fields in the conversion between CSV and JavaScript objects

### 4. UI Updates

#### HTML Updates (src/ui/public/index.html)

- Add a new column for "Cost" after the "Source" column
- Add a new column for "Archived" at the end of the table

#### JavaScript Updates (src/ui/public/js/app.js)

- Update the table rendering to include the new fields
- Add input field for the "Cost" column with centered text and monospace font
- Add checkbox for the "Archived" column
- Add an "Archive" button in the actions column that sets the "archived" field to true
- Add a confirmation dialog when clicking the "Archive" button to prevent accidental archiving
- Apply visual styling to archived rows (strikethrough or grayed out) to make them visually distinct

#### CSS Updates (src/ui/public/css/styles.css)

- Add styles for the cost input field to center text and use monospace font
- Add styles for the archive button
- Add styles for archived rows to make them visually distinct (strikethrough or grayed out)

## Implementation Steps

### Step 1: Update TypeScript Types

Update the `UrlRecord` interface in `src/types/index.ts` to include the new fields.

### Step 2: Update CSV Storage

Modify the `CsvStorage` class in `src/storage/csv.ts` to handle the new fields.

### Step 3: Update UI HTML

Update the HTML table structure in `src/ui/public/index.html` to include the new columns.

### Step 4: Update UI JavaScript

Modify the JavaScript in `src/ui/public/js/app.js` to:
- Render the new fields
- Add input for cost with proper styling
- Add checkbox for archived status
- Add archive button functionality with confirmation dialog
- Apply visual styling to archived rows

### Step 5: Update CSS

Add new styles in `src/ui/public/css/styles.css` for:
- The cost input field (centered text, monospace font)
- The archive button
- Archived rows (strikethrough or grayed out)

### Step 6: Testing

Test the implementation to ensure:
- The CSV file structure is correctly updated
- The UI correctly displays and allows editing of the new fields
- The archive button works as expected with confirmation dialog
- The cost field displays correctly with centered text and monospace font
- Archived rows are visually distinct

## Technical Considerations

### Data Migration

When implementing these changes, we need to consider existing data:
- For existing records, the new fields will be initialized with default values (empty string for cost, false for archived)
- The CSV file structure will be updated when the application writes to it

### UI Design

- The cost field should be a text input with centered text and monospace font
- The archived field should be a checkbox similar to other boolean fields
- The archive button should be added to the actions column
- A confirmation dialog should appear when clicking the archive button
- Archived rows should be visually distinct (strikethrough or grayed out)

### Performance

The changes should have minimal impact on performance as we're only adding two fields to the data structure.

## Conclusion

This implementation plan provides a comprehensive approach to adding the archiving feature and cost field to the FlatCrawl application. By following these steps, we can ensure a smooth integration of these new features while maintaining compatibility with existing functionality.