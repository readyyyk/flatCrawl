# URL Normalization Implementation Plan

This document outlines the detailed implementation plan for the URL normalization feature in FlatCrawl.

## Overview

The URL normalization feature will allow FlatCrawl to normalize URLs by removing specified query parameters (like "searchId") before checking for uniqueness. This will ensure that URLs pointing to the same content are considered the same, regardless of certain query parameters.

## Implementation Steps

### 1. Update the SourceConfig Interface

First, we need to extend the `SourceConfig` interface in `src/types/index.ts` to include URL normalization configuration:

```typescript
/**
 * Configuration for a source to scrape
 */
export interface SourceConfig {
  /** URL to navigate to */
  url: string;
  /** JavaScript command to execute in the browser context to extract URLs */
  command: string;
  /** URL normalization configuration */
  normalization?: {
    /** Query parameters to remove during normalization */
    removeParams?: string[];
  };
}
```

### 2. Add URL Normalization Method to UrlExtractor

Next, we'll add a new method to the `UrlExtractor` class in `src/scraper/extractor.ts` to normalize URLs:

```typescript
/**
 * Normalize a URL by removing specified query parameters
 * @param url The URL to normalize
 * @param paramsToRemove Array of query parameters to remove
 * @returns The normalized URL
 */
normalizeUrl(url: string, paramsToRemove: string[] = []): string {
  try {
    // If no parameters to remove or URL is invalid, return the original URL
    if (paramsToRemove.length === 0 || !isValidUrl(url)) {
      return url;
    }
    
    const urlObj = new URL(url);
    
    // Remove specified query parameters
    for (const param of paramsToRemove) {
      urlObj.searchParams.delete(param);
    }
    
    return urlObj.toString();
  } catch (error) {
    // If URL parsing fails, return the original URL
    logger.warn(`Failed to normalize URL: ${url}`, error);
    return url;
  }
}
```

### 3. Update the filterNewUrls Method

Modify the `filterNewUrls` method in the `UrlExtractor` class to use normalized URLs for comparison:

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
  paramsToRemove: string[] = []
): string[] {
  // If no parameters to remove, use the original implementation
  if (paramsToRemove.length === 0) {
    const newUrls = urls.filter(url => !existingUrls.has(url));
    logger.info(`Found ${newUrls.length} new URLs (${urls.length - newUrls.length} duplicates filtered out)`);
    return newUrls;
  }
  
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

Modify the `scrapeSource` method in the `Scraper` class in `src/scraper/index.ts` to pass normalization parameters:

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
const paramsToRemove = sourceConfig.normalization?.removeParams || [];
const newUrls = this.extractor.filterNewUrls(urls, existingUrls, paramsToRemove);
```

### 5. Add Tests for URL Normalization

Create tests for the URL normalization functionality:

```typescript
// Test normalizeUrl method
describe('normalizeUrl', () => {
  it('should remove specified query parameters', () => {
    const extractor = new UrlExtractor(new BrowserController());
    const url = 'https://www.kufar.by/item/123456?searchId=abc123&category=1';
    const normalized = extractor.normalizeUrl(url, ['searchId']);
    expect(normalized).toBe('https://www.kufar.by/item/123456?category=1');
  });
  
  it('should handle URLs without query parameters', () => {
    const extractor = new UrlExtractor(new BrowserController());
    const url = 'https://www.kufar.by/item/123456';
    const normalized = extractor.normalizeUrl(url, ['searchId']);
    expect(normalized).toBe('https://www.kufar.by/item/123456');
  });
  
  it('should handle invalid URLs', () => {
    const extractor = new UrlExtractor(new BrowserController());
    const url = 'invalid-url';
    const normalized = extractor.normalizeUrl(url, ['searchId']);
    expect(normalized).toBe('invalid-url');
  });
});

// Test filterNewUrls method with normalization
describe('filterNewUrls with normalization', () => {
  it('should filter out duplicates based on normalized URLs', () => {
    const extractor = new UrlExtractor(new BrowserController());
    const urls = [
      'https://www.kufar.by/item/123456?searchId=abc123',
      'https://www.kufar.by/item/789012?searchId=def456'
    ];
    const existingUrls = new Set([
      'https://www.kufar.by/item/123456?searchId=xyz789'
    ]);
    const newUrls = extractor.filterNewUrls(urls, existingUrls, ['searchId']);
    expect(newUrls).toHaveLength(1);
    expect(newUrls[0]).toBe('https://www.kufar.by/item/789012?searchId=def456');
  });
});
```

### 6. Update Configuration Examples

Update the example configuration in the documentation to include normalization settings:

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

## Implementation Considerations

### Backward Compatibility

The implementation is designed to be backward compatible:
- If no `normalization` configuration is provided, the behavior will be the same as before
- Existing URLs in the CSV file won't be normalized automatically, but new URLs will be compared against normalized versions of existing URLs

### Performance Impact

The performance impact should be minimal:
- URL normalization is a lightweight operation
- The normalization is only performed during the duplicate check, not during storage
- For sources without normalization configuration, there's no additional overhead

### Error Handling

The implementation includes proper error handling:
- If URL parsing fails, the original URL is returned
- Invalid URLs are handled gracefully
- Logging is added for debugging purposes

## Next Steps After Implementation

1. **Testing**: Thoroughly test the implementation with real-world URLs
2. **Documentation**: Update the documentation to explain the URL normalization feature
3. **Monitoring**: Monitor the application to ensure the normalization is working as expected
4. **Future Enhancements**: Consider additional URL normalization options, such as:
   - Case normalization (e.g., converting to lowercase)
   - Path normalization (e.g., removing trailing slashes)
   - Domain normalization (e.g., removing "www" prefix)