/**
 * Supabase Client Configuration
 *
 * This file contains the Supabase client setup and configuration.
 */

// Prevent multiple initializations by checking if already set up
if (window.guestbookSupabase && window.guestbookSupabase._initialized) {
  console.log("DEBUG: Supabase client already initialized, reusing existing");
} else {
  const SUPABASE_URL = "https://xkvkzrhsbuziacnpzusd.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhrdmt6cmhzYnV6aWFjbnB6dXNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NDU0OTcsImV4cCI6MjA3OTQyMTQ5N30.mq2KzzFXLafrSV2VJxL7z8mPL-XSzQAPT4LaO2NnlY8";

  /**
   * Initialize Supabase client with retry logic
   */
  function initializeSupabase(retryCount = 0) {
    const maxRetries = 10;
    const retryDelay = 100;

    // Check if Supabase SDK is loaded
    if (typeof window.supabase === "undefined") {
      if (retryCount < maxRetries) {
        console.log(
          `DEBUG: Supabase SDK not loaded yet, retrying (${retryCount + 1}/${maxRetries})`,
        );
        setTimeout(() => initializeSupabase(retryCount + 1), retryDelay);
        return;
      } else {
        console.error("Supabase SDK failed to load after multiple retries");
        return;
      }
    }

    try {
      console.log("DEBUG: Creating Supabase client...");
      // Create new client using the Supabase v2 SDK API
      const { createClient } = window.supabase;
      const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log("DEBUG: Successfully created Supabase client");

      // Store the client globally
      window.guestbookSupabase = window.guestbookSupabase || {};
      window.guestbookSupabase.supabase = client;
      window.guestbookSupabase._initialized = true;

      // Also store the utility functions
      window.guestbookSupabase.escapeHtml = escapeHtml;
      window.guestbookSupabase.formatDate = formatDate;

      console.log(
        "DEBUG: Final window.guestbookSupabase:",
        window.guestbookSupabase,
      );
    } catch (error) {
      console.error("Error creating Supabase client:", error);
    }
  }

  /**
   * Escape HTML special characters to prevent XSS and rendering issues
   * @param {string} text - The text to escape
   * @returns {string} The escaped text
   */
  function escapeHtml(text) {
    const div = document.createElement("div");
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
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // Initialize the global namespace first
  window.guestbookSupabase = window.guestbookSupabase || {
    supabase: null,
    escapeHtml: escapeHtml,
    formatDate: formatDate,
    _initialized: false,
  };

  // Start initialization when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeSupabase);
  } else {
    // DOM is already loaded, initialize now
    initializeSupabase();
  }

  // Export for use in other modules (Node.js compatibility)
  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      supabase: window.guestbookSupabase.supabase,
      escapeHtml,
      formatDate,
    };
  }
}
