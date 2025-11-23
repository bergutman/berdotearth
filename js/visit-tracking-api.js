/**
 * Visit Tracking API - Supabase Implementation
 *
 * Privacy-respecting visit tracking system that:
 * - Uses browser session ID for visit identification
 * - No IP logging or personal data collection
 * - Deduplicates visits per page per day
 * - Uses localStorage for session persistence
 */

(function () {
  "use strict";

  // Visit tracking API functions
  const visitTrackingAPI = {
    /**
     * Generate a session ID for the browser
     * @returns {string} Session ID
     */
    generateSessionId() {
      // Generate session ID from various browser characteristics
      const browserFingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + "x" + screen.height,
        new Date().getTimezoneOffset(),
        // Add some randomization for privacy
        Math.random().toString(36).substring(2, 15),
      ].join("|");

      // Hash the fingerprint to create session ID
      return this.simpleHash(browserFingerprint);
    },

    /**
     * Simple hash function for creating IDs
     * @param {string} str - String to hash
     * @returns {string} Hashed string
     */
    simpleHash(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(16);
    },

    /**
     * Hash user agent string for basic bot detection
     * @returns {string} Hashed user agent
     */
    hashUserAgent() {
      return this.simpleHash(navigator.userAgent);
    },

    /**
     * Get or create session ID from localStorage
     * @returns {string} Session ID
     */
    getSessionId() {
      let sessionId = localStorage.getItem("visit_session_id");

      if (!sessionId) {
        sessionId = this.generateSessionId();
        localStorage.setItem("visit_session_id", sessionId);
      }

      return sessionId;
    },

    /**
     * Check if a visit should be recorded for this page today
     * @param {string} pageSlug - Page identifier
     * @returns {boolean} True if visit should be recorded
     */
    shouldRecordVisit(pageSlug) {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const lastVisitKey = `last_visit_${pageSlug}`;
      const lastVisit = localStorage.getItem(lastVisitKey);

      // Only record if we haven't visited this page today
      if (lastVisit === today) {
        return false;
      }

      return true;
    },

    /**
     * Mark that we've recorded a visit for this page today
     * @param {string} pageSlug - Page identifier
     */
    markVisitRecorded(pageSlug) {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const lastVisitKey = `last_visit_${pageSlug}`;
      localStorage.setItem(lastVisitKey, today);
    },

    /**
     * Record a visit to a specific page
     * @param {string} pageSlug - Page identifier ('index' or 'guestbook')
     * @returns {Promise<Object>} Result of the visit recording
     */
    async recordVisit(pageSlug) {
      try {
        // Check if we should record this visit
        if (!this.shouldRecordVisit(pageSlug)) {
          const result = await this.getVisitCount(pageSlug);
          return {
            success: true,
            totalVisits: result.total_visits,
            isDuplicate: true,
            message: "Already visited today",
          };
        }

        const sessionId = this.getSessionId();
        const userAgentHash = this.hashUserAgent();

        // Handle referrer - filter out localhost and empty referrers
        let referrer = null;
        if (document.referrer && document.referrer.trim() !== "") {
          const referrerUrl = new URL(document.referrer);
          const currentUrl = new URL(window.location.href);

          // Only store referrer if it's from a different domain
          if (referrerUrl.hostname !== currentUrl.hostname) {
            referrer = document.referrer;
          }
        }

        // Call the Supabase function to record the visit
        const { data, error } = await window.guestbookSupabase.supabase.rpc(
          "record_visit",
          {
            p_page_slug: pageSlug,
            p_session_id: sessionId,
            p_user_agent_hash: userAgentHash,
            p_referrer: referrer,
          },
        );

        if (error) {
          console.error("Visit recording error:", error);
          throw error;
        }

        // Mark this visit as recorded
        this.markVisitRecorded(pageSlug);

        return {
          success: true,
          totalVisits: data[0]?.total_visits || 0,
          isDuplicate: data[0]?.is_duplicate || false,
          message: "Visit recorded successfully",
        };
      } catch (error) {
        console.error("Error recording visit:", error);
        return {
          success: false,
          error: error.message,
          totalVisits: 0,
          isDuplicate: false,
        };
      }
    },

    /**
     * Get the current visit count for a page
     * @param {string} pageSlug - Page identifier
     * @returns {Promise<Object>} Visit statistics
     */
    async getVisitCount(pageSlug) {
      try {
        const { data, error } = await window.guestbookSupabase.supabase.rpc(
          "get_visit_stats",
          {
            p_page_slug: pageSlug,
          },
        );

        if (error) {
          throw error;
        }

        return {
          success: true,
          total_visits: data[0]?.total_visits || 0,
          today_visits: data[0]?.today_visits || 0,
          unique_days: data[0]?.unique_days || 0,
        };
      } catch (error) {
        console.error("Error getting visit count:", error);
        return {
          success: false,
          error: error.message,
          total_visits: 0,
          today_visits: 0,
          unique_days: 0,
        };
      }
    },

    /**
     * Update visitor counter element on the page
     * @param {string} elementId - ID of the counter element
     * @param {number} count - Visit count to display
     */
    updateCounterElement(elementId, count) {
      const element = document.getElementById(elementId);
      if (element) {
        // Format with leading zeros (5 digits minimum)
        const formattedCount = count.toString().padStart(5, "0");
        element.textContent = formattedCount;
      }
    },
  };

  // Expose the API globally
  if (typeof window !== "undefined") {
    window.visitTrackingAPI = visitTrackingAPI;
  }

  // For Node.js environments
  if (typeof module !== "undefined" && module.exports) {
    module.exports = visitTrackingAPI;
  }
})();
