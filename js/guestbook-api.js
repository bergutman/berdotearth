/**
 * Guestbook API Functions
 *
 * This file contains all the functions for interacting with the Supabase guestbook API.
 */

/**
 * Check rate limit for guestbook submissions
 * @returns {Object} Rate limit status with canSubmit boolean and waitTime if needed
 */
function checkRateLimit() {
  const RATE_LIMIT_MINUTES = 5; // Allow one submission per 5 minutes
  const MAX_SUBMISSIONS_PER_HOUR = 10; // Maximum 10 submissions per hour

  const now = Date.now();
  const rateLimitData = localStorage.getItem("guestbookRateLimit");

  if (!rateLimitData) {
    return { canSubmit: true, waitTime: 0 };
  }

  try {
    const data = JSON.parse(rateLimitData);
    const lastSubmissionTime = data.lastSubmission || 0;
    const submissionCount = data.submissionCount || 0;
    const hourlySubmissions = data.hourlySubmissions || [];

    // Check minimum time between submissions
    const timeSinceLastSubmission = now - lastSubmissionTime;
    const minTimeBetween = RATE_LIMIT_MINUTES * 60 * 1000; // Convert to milliseconds

    if (timeSinceLastSubmission < minTimeBetween) {
      const waitTime = Math.ceil(
        (minTimeBetween - timeSinceLastSubmission) / 1000,
      );
      return {
        canSubmit: false,
        waitTime,
        reason: "Please wait a moment between submissions",
      };
    }

    // Clean old hourly submissions (older than 1 hour)
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentSubmissions = hourlySubmissions.filter(
      (time) => time > oneHourAgo,
    );

    // Check hourly limit
    if (recentSubmissions.length >= MAX_SUBMISSIONS_PER_HOUR) {
      const oldestSubmission = Math.min(...recentSubmissions);
      const waitTime = Math.ceil(
        (oldestSubmission + 60 * 60 * 1000 - now) / 1000,
      );
      return {
        canSubmit: false,
        waitTime,
        reason: `Hourly limit reached (${MAX_SUBMISSIONS_PER_HOUR} submissions per hour)`,
      };
    }

    return { canSubmit: true, waitTime: 0 };
  } catch (error) {
    console.error("Error parsing rate limit data:", error);
    // If we can't parse the data, allow submission (fail safe)
    return { canSubmit: true, waitTime: 0 };
  }
}

/**
 * Update rate limit after a submission
 * @returns {void}
 */
function updateRateLimit() {
  try {
    const now = Date.now();
    const rateLimitData = localStorage.getItem("guestbookRateLimit");

    let data = rateLimitData
      ? JSON.parse(rateLimitData)
      : {
          lastSubmission: 0,
          submissionCount: 0,
          hourlySubmissions: [],
        };

    data.lastSubmission = now;
    data.submissionCount = (data.submissionCount || 0) + 1;
    data.hourlySubmissions = (data.hourlySubmissions || []).filter(
      (time) => time > now - 60 * 60 * 1000, // Keep only last hour
    );
    data.hourlySubmissions.push(now);

    localStorage.setItem("guestbookRateLimit", JSON.stringify(data));
  } catch (error) {
    console.error("Error updating rate limit data:", error);
  }
}

/**
 * Submit a new guestbook entry with rate limiting
 * @param {string} displayName - The user's display name
 * @param {string} message - The guestbook message
 * @returns {Promise<Object>} The result of the submission
 */
async function submitGuestbookEntry(displayName, message) {
  // Check rate limits first
  const rateLimitStatus = checkRateLimit();
  if (!rateLimitStatus.canSubmit) {
    return {
      success: false,
      error: rateLimitStatus.reason,
      waitTime: rateLimitStatus.waitTime,
    };
  }

  try {
    const { data, error } = await window.guestbookSupabase.supabase
      .from("guestbook_entries")
      .insert([
        {
          display_name: displayName.trim(),
          message: message.trim(),
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    // Update rate limit after successful submission
    updateRateLimit();

    return { success: true, data };
  } catch (error) {
    console.error("Error submitting guestbook entry:", error);
    return {
      success: false,
      error: error.message || "Failed to submit entry",
    };
  }
}

/**
 * Fetch all guestbook entries
 * @param {number} limit - Maximum number of entries to fetch (optional)
 * @returns {Promise<Object>} The result of the fetch operation
 */
async function fetchGuestbookEntries(limit = 100) {
  try {
    const { data, error } = await window.guestbookSupabase.supabase
      .from("guestbook_entries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Error fetching guestbook entries:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch entries",
      data: [],
    };
  }
}

/**
 * Create a DOM element for a guestbook entry
 * @param {Object} entry - The guestbook entry data
 * @returns {HTMLElement} The created DOM element
 */
function createGuestbookEntryElement(entry) {
  const { escapeHtml, formatDate } = window.guestbookSupabase;

  const entryDiv = document.createElement("div");
  entryDiv.className = "bg-shadow";
  entryDiv.style =
    "margin: 10px 0; padding: 10px; border: 1px solid var(--lime-green);";

  // Name element
  const nameEl = document.createElement("div");
  nameEl.style = "color: var(--lime-green); font-weight: bold;";
  nameEl.textContent = escapeHtml(entry.display_name);

  // Date element
  const dateEl = document.createElement("div");
  dateEl.style = "color: var(--sun-yellow); font-size: 0.8rem;";
  dateEl.textContent = `Posted: ${formatDate(entry.created_at)}`;

  // Message element (with proper HTML escaping)
  const messageEl = document.createElement("p");
  messageEl.textContent = entry.message; // textContent automatically escapes HTML

  // Assemble the entry
  entryDiv.appendChild(nameEl);
  entryDiv.appendChild(dateEl);
  entryDiv.appendChild(messageEl);

  return entryDiv;
}

/**
 * Validate guestbook form input with enhanced spam protection
 * @param {string} displayName - The display name
 * @param {string} message - The message
 * @returns {Object} Validation result with isValid boolean and errors array
 */
function validateGuestbookInput(displayName, message) {
  const errors = [];

  // Trim inputs
  const trimmedName = displayName.trim();
  const trimmedMessage = message.trim();

  // Validate display name
  if (!trimmedName) {
    errors.push("❌ Display name is required");
  } else if (trimmedName.length > 100) {
    errors.push("❌ Display name must be 100 characters or less");
  }

  // Validate message
  if (!trimmedMessage) {
    errors.push("❌ Message is required");
  } else if (trimmedMessage.length < 1) {
    errors.push("❌ Message must be at least 1 character long");
  } else if (trimmedMessage.length > 10000) {
    errors.push("❌ Message must be 10,000 characters or less");
  }

  // Only check for actual dangerous patterns, not common technical terms
  const dangerousPatterns = [
    // Actual SQL injection patterns (syntax, not words)
    {
      pattern:
        /['"]\s*;\s*(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|SCRIPT)\s*/gi,
      message: "❌ Security Threat: SQL injection patterns are not allowed",
    },
    {
      pattern: /['"]\s*OR\s*['"]\w*['"]\s*=\s*['"]\w*['"]\s*/gi,
      message: "❌ Security Threat: SQL injection patterns are not allowed",
    },

    // Actual XSS patterns
    {
      pattern: /javascript\s*:/gi,
      message:
        "❌ Security Threat: JavaScript execution patterns are not allowed",
    },
    {
      pattern: /on\w+\s*=\s*['"][^'"]*['"]/gi,
      message: "❌ Security Threat: Event handler patterns are not allowed",
    },
    {
      pattern: /<\s*script[^>]*>/gi,
      message: "❌ Security Threat: Script tags are not allowed",
    },
    {
      pattern: /<\s*iframe[^>]*>/gi,
      message: "❌ Security Threat: Iframe tags are not allowed",
    },

    // Dangerous HTML tags only
    {
      pattern:
        /<\s*\/?\s*(script|iframe|object|embed|form|input|button|link|meta|style)\b[^>]*>/gi,
      message: "❌ Security Threat: Dangerous HTML tags are not allowed",
    },

    // Actual URLs (not conceptual mentions)
    {
      pattern: /https?:\/\/[^\s]+/gi,
      message: "❌ URLs are not allowed - please share website names instead",
    },

    // Actual email addresses (not conceptual mentions)
    {
      pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      message: "❌ Email addresses are not allowed",
    },

    // Actual phone numbers
    {
      pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      message: "❌ Phone numbers are not allowed",
    },
    {
      pattern: /\+\d{1,3}[-.]?\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      message: "❌ Phone numbers are not allowed",
    },
  ];

  // Check for dangerous patterns in both name and message
  const combinedText = `${trimmedName} ${trimmedMessage}`;

  dangerousPatterns.forEach(({ pattern, message: errorMessage }) => {
    if (pattern.test(combinedText)) {
      errors.push(errorMessage);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    trimmedName,
    trimmedMessage,
  };
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    submitGuestbookEntry,
    fetchGuestbookEntries,
    createGuestbookEntryElement,
    validateGuestbookInput,
  };
} else {
  window.guestbookAPI = {
    submitGuestbookEntry,
    fetchGuestbookEntries,
    createGuestbookEntryElement,
    validateGuestbookInput,
  };
}
