# URL Normalization Feature Design

## Problem Statement

Currently, when checking for duplicate URLs, the application compares the full URL strings. This means that URLs with different query parameters (like "searchId") are considered different, even if they point to the same content. For example, these URLs would be considered different:

```
https://www.kufar.by/item/123456?searchId=abc123
https://www.kufar.by/item/123456?searchId=def456
```

This leads to duplicate entries in the database for what is essentially the same content.

## Proposed Solution

Add URL normalization functionality to remove specified query parameters (like "searchId") before checking for uniqueness. This will ensure that URLs pointing to the same content are considered the same, regardless of certain query parameters.

## Design

### 1. Add URL Normalization Method

Add a new method to the `UrlExtractor` class to normalize URLs by removing specified query parameters:

```typescript
/**
 * Normalize a URL by removing specified query parameters
 * @param url The URL to normalize
 * @param paramsToRemove Array of query parameters to remove
 * @returns The normalized URL
 */
normalizeUrl(url: string, paramsToRemove: string[] = []): string {
  try {
    const urlObj = new URL(url);
    
    // Remove specified query parameters
    for (const param of paramsToRemove) {
      urlObj.searchParams.delete(param);
    }
    
    return urlObj.toString();
  } catch (error) {
    // If URL parsing fails, return the original URL
    return url;
  }
}
```

### 2. Add Source-Specific Normalization Configuration

Extend the `SourceConfig` interface to include URL normalization configuration:

```typescript
interface SourceConfig {
  url: string;
  command: string;
  normalization?: {
    removeParams?: string[];
  };
}
```

This allows different sources to have different normalization rules.

### 3. Modify the Filter Method

Update the `filterNewUrls` method to use normalized URLs for comparison:

```typescript
/**
 * Filter new URLs that don't exist in the existing URLs set
 * @param urls Array of URLs
 * @param existingUrls Set of existing URLs
 * @param paramsToRemove Array of query parameters to remove during normalization
 * @returns Array of new URLs
 */
filterNewUrls(
  urls: string[], 
  existingUrls: Set<string>,
  paramsToRemove: string[] = ['searchId']
): string[] {
  // Normalize existing URLs
  const normalizedExistingUrls = new Set<string>();
  for (const url of existingUrls) {
    normalizedExistingUrls.add(this.normalizeUrl(url, paramsToRemove));
  }
  
  // Filter new URLs based on normalized comparison
  const newUrls = urls.filter(url => {
    const normalizedUrl = this.normalizeUrl(url, paramsToRemove);
    return !normalizedExistingUrls.has(normalizedUrl);
  });
  
  logger.info(`Found ${newUrls.length} new URLs (${urls.length - newUrls.length} duplicates filtered out)`);
  return newUrls;
}
```

### 4. Update the Scraper Class

Modify the `scrapeSource` method to pass normalization parameters:

```typescript
// Extract URLs
const urls = await this.extractor.extractUrls(source, sourceConfig);
logger.info(`Found ${urls.length} links in total`);

if (urls.length === 0) {
  logger.info('No links found for this source, skipping');
  return 0;
}

// Filter existing URLs
const existingUrls = this.storage.getExistingUrls();
const paramsToRemove = sourceConfig.normalization?.removeParams || ['searchId'];
const newUrls = this.extractor.filterNewUrls(urls, existingUrls, paramsToRemove);
```

## Implementation Plan

1. Add the `normalizeUrl` method to the `UrlExtractor` class
2. Update the `SourceConfig` interface in `types/index.ts`
3. Modify the `filterNewUrls` method to use normalized URLs
4. Update the `scrapeSource` method in the `Scraper` class
5. Add tests for the URL normalization functionality
6. Update configuration examples in the documentation

## Example Configuration

```json
{
  "kufar": {
    "url": "https://www.kufar.by/listings",
    "command": "[...document.querySelectorAll('.listings-item')].map(item => item.querySelector('a').href)",
    "normalization": {
      "removeParams": ["searchId", "utm_source", "utm_medium", "utm_campaign"]
    }
  }
}
```

## Benefits

1. **Reduced Duplicates**: Eliminates duplicate entries for the same content with different query parameters
2. **Configurable**: Different sources can have different normalization rules
3. **Maintainable**: Centralized normalization logic that can be easily updated
4. **Extensible**: Can be extended to handle other URL normalization needs in the future

## Considerations

1. **Backward Compatibility**: Existing URLs in the CSV file won't be normalized automatically
2. **Performance Impact**: Minimal, as URL normalization is a lightweight operation
3. **Edge Cases**: Need to handle invalid URLs gracefully