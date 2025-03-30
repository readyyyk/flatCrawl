/**
 * Helper functions for the FlatCrawl application
 */

/**
 * Format a Unix timestamp as a localized date string
 * @param timestamp The Unix timestamp (seconds since epoch)
 * @returns A formatted date string
 */
export function formatDate(timestamp: number | string): string {
  const date = new Date(
    typeof timestamp === 'string' 
      ? parseInt(timestamp, 10) * 1000 
      : timestamp * 1000
  );
  return date.toLocaleString();
}

/**
 * Retry a function multiple times with a delay between attempts
 * @param fn The function to retry
 * @param maxRetries The maximum number of retries
 * @param delay The delay between retries in milliseconds
 * @returns The result of the function
 * @throws The last error encountered
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt}/${maxRetries} failed:`, error);
      
      if (attempt < maxRetries) {
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

/**
 * Sleep for a specified number of milliseconds
 * @param ms The number of milliseconds to sleep
 * @returns A promise that resolves after the specified time
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if a string is a valid URL
 * @param url The URL to check
 * @returns True if the URL is valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Generate a unique ID
 * @returns A unique ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}