/**
 * Visit Tracking - Page Implementation
 *
 * This script handles visit tracking for individual pages.
 * It records visits and updates the display counters.
 */

(function () {
  "use strict";

  /**
   * Initialize visit tracking for the current page
   */
  async function initializeVisitTracking() {
    // Only proceed if required dependencies are loaded
    if (!window.guestbookSupabase || !window.visitTrackingAPI) {
      console.error("Visit tracking dependencies not loaded");
      return;
    }

    // Determine page type based on current URL or page content
    const pageSlug = determinePageSlug();
    if (!pageSlug) {
      console.log("Visit tracking not enabled for this page");
      return;
    }

    // Record the visit and update counter
    try {
      const result = await window.visitTrackingAPI.recordVisit(pageSlug);

      if (result.success) {
        console.log(
          `Visit recorded for ${pageSlug}:`,
          result.totalVisits,
          "total visits",
        );

        // Update the counter element
        updatePageCounter(pageSlug, result.totalVisits);

        // If it was a duplicate visit, that's fine - we still have the count
        if (result.isDuplicate) {
          console.log("Already visited this page today");
        }
      } else {
        console.error("Failed to record visit:", result.error);
        // Still try to get current count on error
        const countResult =
          await window.visitTrackingAPI.getVisitCount(pageSlug);
        if (countResult.success) {
          updatePageCounter(pageSlug, countResult.total_visits);
        }
      }
    } catch (error) {
      console.error("Error initializing visit tracking:", error);

      // Fallback: try to get current count
      try {
        const countResult =
          await window.visitTrackingAPI.getVisitCount(pageSlug);
        if (countResult.success) {
          updatePageCounter(pageSlug, countResult.total_visits);
        }
      } catch (fallbackError) {
        console.error("Error getting fallback visit count:", fallbackError);
      }
    }
  }

  /**
   * Determine the page slug based on the current page
   * @returns {string|null} Page slug or null if not trackable
   */
  function determinePageSlug() {
    // Check if we're on the index page
    if (document.getElementById("visitor-count")) {
      return "index";
    }

    // Check if we're on the guestbook page
    if (
      document.querySelector(".counter") &&
      document.body.innerHTML.includes("Guestbook")
    ) {
      return "guestbook";
    }

    // Check URL path
    const path = window.location.pathname;
    if (path === "/" || path.endsWith("index.html")) {
      return "index";
    } else if (path.endsWith("guestbook.html")) {
      return "guestbook";
    }

    // Check page title
    const title = document.title.toLowerCase();
    if (title.includes("guestbook")) {
      return "guestbook";
    } else if (
      title.includes("home") ||
      title.includes("welcome") ||
      title.includes("ber.earth")
    ) {
      return "index";
    }

    return null;
  }

  /**
   * Update the counter element based on page type
   * @param {string} pageSlug - Page identifier
   * @param {number} count - Visit count
   */
  function updatePageCounter(pageSlug, count) {
    if (pageSlug === "index") {
      // Update index page counter
      window.visitTrackingAPI.updateCounterElement("visitor-count", count);
    } else if (pageSlug === "guestbook") {
      // Update guestbook page counter
      // Guestbook has a different structure - find the counter span
      const counterSpan = document.querySelector(".counter span");
      if (counterSpan) {
        const formattedCount = count.toString().padStart(6, "0");
        counterSpan.textContent = formattedCount;
      }
    }
  }

  // Initialize visit tracking when DOM is loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeVisitTracking);
  } else {
    // DOM is already loaded
    initializeVisitTracking();
  }
})();
