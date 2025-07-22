/**
 * Date formatting utilities for consistent date display across the application
 */

/**
 * Format a date for user-friendly display
 * @param date - Date string, Date object, or timestamp
 * @param format - Format type: 'relative', 'short', 'long', 'time'
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date | number, 
  format: 'relative' | 'short' | 'long' | 'time' = 'relative'
): string {
  if (!date) return 'Never';
  
  const dateObj = new Date(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  switch (format) {
    case 'relative':
      if (diffSeconds < 60) {
        return 'Just now';
      } else if (diffMinutes < 60) {
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else if (diffDays < 7) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months !== 1 ? 's' : ''} ago`;
      } else {
        const years = Math.floor(diffDays / 365);
        return `${years} year${years !== 1 ? 's' : ''} ago`;
      }
      
    case 'short':
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      
    case 'long':
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
    case 'time':
      return dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
    default:
      return dateObj.toLocaleString();
  }
}

/**
 * Format timestamp for transaction displays
 * @param timestamp - ISO date string or timestamp
 * @returns User-friendly timestamp
 */
export function formatTransactionTimestamp(timestamp: string | number): string {
  return formatDate(timestamp, 'relative');
}

/**
 * Format last activity for wallet analysis
 * @param lastActivity - ISO date string or timestamp
 * @returns User-friendly last activity string
 */
export function formatLastActivity(lastActivity: string | number): string {
  if (!lastActivity) return 'No recent activity';
  
  const formatted = formatDate(lastActivity, 'relative');
  return formatted === 'Never' ? 'No recent activity' : formatted;
}

/**
 * Format date for chat messages
 * @param timestamp - Date object or ISO string
 * @returns Time string for chat display
 */
export function formatChatTimestamp(timestamp: Date | string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format date for detailed transaction modal
 * @param timestamp - ISO date string
 * @returns Full date and time string
 */
export function formatDetailedTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
