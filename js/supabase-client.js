/**
 * Supabase Client Configuration
 *
 * This file contains the Supabase client setup and configuration.
 */

const SUPABASE_URL = 'https://xkvkzrhsbuziacnpzusd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhrdmt6cmhzYnV6aWFjbnB6dXNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NDU0OTcsImV4cCI6MjA3OTQyMTQ5N30.mq2KzzFXLafrSV2VJxL7z8mPL-XSzQAPT4LaO2NnlY8';

/**
 * Create Supabase client
 */
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Escape HTML special characters to prevent XSS and rendering issues
 * @param {string} text - The text to escape
 * @returns {string} The escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format a timestamp for display
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted date string
 */
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { supabase, escapeHtml, formatDate };
} else {
  window.guestbookSupabase = { supabase, escapeHtml, formatDate };
}
