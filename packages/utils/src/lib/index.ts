// Export all utility functions here
export * from './example';

// Example utility function
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString();
}
