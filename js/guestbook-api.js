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

  // Technical security pattern detection (no content filtering)
  const technicalPatterns = [
    // URL patterns
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi,
    /(www\.)[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi,
    /[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}/g,

    // Email patterns
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

    // Phone number patterns
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    /\+\d{1,3}[-.]?\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,

    // SQL injection patterns
    /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|SCRIPT)\b)/gi,
    /['"]\s*(OR|AND)\s*['"]\w*['"]\s*=\s*['"]\w*['"]\s*/gi,
    /\b(OR|AND)\s+\d+\s*=\s*\d+/gi,

    // XSS patterns
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<\s*script/gi,
    /<\s*iframe/gi,

    // HTML/BBCode tags
    /<[^>]*>/g,
    /\[\/?[^]]*\]/g,

    // Markdown/Code blocks
    /```[\s\S]*?```/g,
    /`[^`]+`/g,

    // Excessive repeated characters (for readability only)
    /([!?]){6,}/g,
    /([a-zA-Z0-9])\1{7,}/g,
  ];

  // Check for technical patterns in both name and message
  const combinedText = `${trimmedName} ${trimmedMessage}`;

  technicalPatterns.forEach((pattern) => {
    if (pattern.test(combinedText)) {
      if (
        pattern.source.includes("javascript") ||
        pattern.source.includes("on\\w+") ||
        pattern.source.includes("<\\s*script")
      ) {
        errors.push(
          "❌ Security Threat: JavaScript/XSS patterns are not allowed for security reasons",
        );
      } else if (pattern.source.includes("UNION|SELECT|INSERT")) {
        errors.push(
          "❌ Security Threat: SQL injection patterns are not allowed",
        );
      } else if (
        pattern.source.includes("<[^>]*>") ||
        pattern.source.includes("\\[\\/[^]]*\\]")
      ) {
        errors.push(
          "❌ HTML/BBCode tags are not allowed - please use plain text only",
        );
      } else if (
        pattern.source.includes("https?://") ||
        pattern.source.includes("@") ||
        pattern.source.includes("\\d{3}")
      ) {
        // Check specifically what was found to give a more precise error
        if (
          combinedText.match(/https?:\/\/[^\s]+/gi) ||
          combinedText.match(/www\.[^\s]+/gi)
        ) {
          errors.push(
            "❌ URLs are not allowed - please share website links in your message text instead",
          );
        } else if (
          combinedText.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/g)
        ) {
          errors.push("❌ Email addresses are not allowed");
        } else if (combinedText.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g)) {
          errors.push("❌ Phone numbers are not allowed");
        } else {
          errors.push("❌ URLs, emails, and phone numbers are not allowed");
        }
      } else if (
        pattern.source.includes("```") ||
        pattern.source.includes("`[^`]+`")
      ) {
        errors.push(
          "❌ Code blocks are not allowed - please describe code in plain text instead",
        );
      } else {
        errors.push(
          "❌ Invalid formatting detected - please use plain text only",
        );
      }
    }
  });

  // Message length validation (updated to 1-10,000 characters)
  if (trimmedMessage.length < 1) {
    errors.push("❌ Message is required (minimum 1 character)");
  }

  // Check for excessive character repetition (only for readability)
  const repeatedChars = trimmedMessage.match(/(.)\1{6,}/g);
  if (repeatedChars && repeatedChars.length > 1) {
    errors.push(
      "❌ Please reduce excessive character repetition (e.g., 'aaaaaa', '????????')",
    );
  }

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
