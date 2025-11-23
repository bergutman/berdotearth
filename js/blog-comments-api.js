/**
 * Blog Comments API Functions
 *
 * This file contains all the functions for interacting with the Supabase blog comments API.
 * Replaces the Google Sheets-based comment system with a modern Supabase backend.
 */

/**
 * Submit a new blog comment
 * @param {string} postId - The blog post ID
 * @param {string} name - The comment author's name
 * @param {string} message - The comment message
 * @returns {Promise<Object>} The result of the submission
 */
async function submitBlogComment(postId, name, message) {
  // Check rate limits first (reuse guestbook rate limiting)
  const rateLimitStatus = checkBlogCommentRateLimit();
  if (!rateLimitStatus.canSubmit) {
    return {
      success: false,
      error: rateLimitStatus.reason,
      waitTime: rateLimitStatus.waitTime,
    };
  }

  try {
    const { data, error } = await window.guestbookSupabase.supabase
      .from("blog_comments")
      .insert([
        {
          post_id: postId.trim(),
          name: name.trim(),
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
    updateBlogCommentRateLimit();

    return { success: true, data };
  } catch (error) {
    console.error("Error submitting blog comment:", error);
    return {
      success: false,
      error: error.message || "Failed to submit comment",
    };
  }
}

/**
 * Fetch comments for a specific blog post
 * @param {string} postId - The blog post ID
 * @param {number} limit - Maximum number of comments to fetch (optional)
 * @returns {Promise<Object>} The result of the fetch operation
 */
async function fetchBlogComments(postId, limit = 50) {
  try {
    const { data, error } = await window.guestbookSupabase.supabase
      .from("blog_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Error fetching blog comments:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch comments",
      data: [],
    };
  }
}

/**
 * Fetch comment counts for multiple posts
 * @param {Array<string>} postIds - Array of post IDs
 * @returns {Promise<Object>} The result of the fetch operation
 */
async function fetchBlogCommentCounts(postIds) {
  try {
    const { data, error } = await window.guestbookSupabase.supabase
      .from("blog_comments")
      .select("post_id")
      .in("post_id", postIds);

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    // Count comments per post ID
    const counts = {};
    (data || []).forEach((comment) => {
      counts[comment.post_id] = (counts[comment.post_id] || 0) + 1;
    });

    return { success: true, counts };
  } catch (error) {
    console.error("Error fetching comment counts:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch comment counts",
      counts: {},
    };
  }
}

/**
 * Create a DOM element for a blog comment
 * @param {Object} comment - The comment data
 * @returns {HTMLElement} The created DOM element
 */
function createBlogCommentElement(comment) {
  const { escapeHtml, formatDate } = window.guestbookSupabase;

  const commentDiv = document.createElement("div");
  commentDiv.className =
    "comment-entry block m-b-20 p-25 p-t-30 no-decoration text-inherit border-solid raised";

  // Alternate between different sticky note styles (matching original system)
  const colors = [
    "bg-sticky-yellow",
    "bg-sticky-pink",
    "bg-sticky-orange",
    "bg-sticky-blue",
    "bg-sticky-green",
  ];
  const tilts = ["tilted", "tilted-reverse"];
  const colorIndex = Math.floor(Math.random() * colors.length);
  const tiltIndex = Math.floor(Math.random() * tilts.length);

  commentDiv.classList.add(colors[colorIndex]);
  commentDiv.classList.add(tilts[tiltIndex]);

  // Create comment content matching original structure
  commentDiv.innerHTML = `
    <img class="absolute left-0 right-0 m-h-a m-t--30" src="../img/bullets/purplepush.gif" />
    <div class="flex justify-space-between m-b-10">
      <span class="comment-name"><i class="fas fa-user"></i> ${escapeHtml(comment.name)}</span>
      <span class="comment-date"><i class="fas fa-calendar"></i> ${formatDate(comment.created_at)}</span>
    </div>
    <p class="comment-message">${escapeHtml(comment.message)}</p>
  `;

  return commentDiv;
}

/**
 * Validate blog comment input with enhanced spam protection
 * @param {string} postId - The post ID
 * @param {string} name - The comment author's name
 * @param {string} message - The comment message
 * @returns {Object} Validation result with isValid boolean and errors array
 */
function validateBlogCommentInput(postId, name, message) {
  const errors = [];

  // Trim inputs
  const trimmedPostId = postId.trim();
  const trimmedName = name.trim();
  const trimmedMessage = message.trim();

  // Validate post ID
  if (!trimmedPostId) {
    errors.push("❌ Post ID is required");
  } else if (trimmedPostId.length > 100) {
    errors.push("❌ Post ID must be 100 characters or less");
  }

  // Validate name
  if (!trimmedName) {
    errors.push("❌ Display name is required");
  } else if (trimmedName.length > 100) {
    errors.push("❌ Display name must be 100 characters or less");
  }

  // Validate message
  if (!trimmedMessage) {
    errors.push("❌ Comment is required");
  } else if (trimmedMessage.length < 1) {
    errors.push("❌ Comment must be at least 1 character long");
  } else if (trimmedMessage.length > 10000) {
    errors.push("❌ Comment must be 10,000 characters or less");
  }

  // Technical security pattern detection (reuse guestbook patterns)
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

  // Check for technical patterns in all fields
  const combinedText = `${trimmedPostId} ${trimmedName} ${trimmedMessage}`;

  technicalPatterns.forEach((pattern) => {
    if (pattern.test(combinedText)) {
      if (
        pattern.source.includes("javascript") ||
        pattern.source.includes("on\\w+") ||
        pattern.source.includes("<\\s*script")
      ) {
        errors.push(
          "❌ Security Threat: JavaScript/XSS patterns are not allowed",
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
          errors.push("❌ URLs are not allowed");
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
          "❌ Code blocks are not allowed - please describe code in plain text",
        );
      } else {
        errors.push(
          "❌ Invalid formatting detected - please use plain text only",
        );
      }
    }
  });

  // Check for excessive character repetition (only for readability)
  const repeatedChars = trimmedMessage.match(/(.)\1{6,}/g);
  if (repeatedChars && repeatedChars.length > 1) {
    errors.push("❌ Please reduce excessive character repetition");
  }

  return {
    isValid: errors.length === 0,
    errors,
    trimmedPostId,
    trimmedName,
    trimmedMessage,
  };
}

/**
 * Check rate limit for blog comment submissions
 * @returns {Object} Rate limit status with canSubmit boolean and waitTime if needed
 */
function checkBlogCommentRateLimit() {
  // Use a different rate limiting key than guestbook
  const RATE_LIMIT_MINUTES = 2; // Allow one comment per 2 minutes (more frequent than guestbook)
  const MAX_COMMENTS_PER_HOUR = 20; // Maximum 20 comments per hour

  const now = Date.now();
  const rateLimitData = localStorage.getItem("blogCommentRateLimit");

  if (!rateLimitData) {
    return { canSubmit: true, waitTime: 0 };
  }

  try {
    const data = JSON.parse(rateLimitData);
    const lastSubmissionTime = data.lastSubmission || 0;
    const submissionCount = data.submissionCount || 0;
    const hourlyComments = data.hourlyComments || [];

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
        reason: "Please wait a moment between comments",
      };
    }

    // Clean old hourly submissions (older than 1 hour)
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentComments = hourlyComments.filter((time) => time > oneHourAgo);

    // Check hourly limit
    if (recentComments.length >= MAX_COMMENTS_PER_HOUR) {
      const oldestComment = Math.min(...recentComments);
      const waitTime = Math.ceil((oldestComment + 60 * 60 * 1000 - now) / 1000);
      return {
        canSubmit: false,
        waitTime,
        reason: `Hourly limit reached (${MAX_COMMENTS_PER_HOUR} comments per hour)`,
      };
    }

    return { canSubmit: true, waitTime: 0 };
  } catch (error) {
    console.error("Error parsing blog comment rate limit data:", error);
    // If we can't parse the data, allow submission (fail safe)
    return { canSubmit: true, waitTime: 0 };
  }
}

/**
 * Update rate limit after a blog comment submission
 * @returns {void}
 */
function updateBlogCommentRateLimit() {
  try {
    const now = Date.now();
    const rateLimitData = localStorage.getItem("blogCommentRateLimit");

    let data = rateLimitData
      ? JSON.parse(rateLimitData)
      : {
          lastSubmission: 0,
          submissionCount: 0,
          hourlyComments: [],
        };

    data.lastSubmission = now;
    data.submissionCount = (data.submissionCount || 0) + 1;
    data.hourlyComments = (data.hourlyComments || []).filter(
      (time) => time > now - 60 * 60 * 1000, // Keep only last hour
    );
    data.hourlyComments.push(now);

    localStorage.setItem("blogCommentRateLimit", JSON.stringify(data));
  } catch (error) {
    console.error("Error updating blog comment rate limit data:", error);
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    submitBlogComment,
    fetchBlogComments,
    fetchBlogCommentCounts,
    createBlogCommentElement,
    validateBlogCommentInput,
    checkBlogCommentRateLimit,
    updateBlogCommentRateLimit,
  };
} else {
  window.blogCommentsAPI = {
    submitBlogComment,
    fetchBlogComments,
    fetchBlogCommentCounts,
    createBlogCommentElement,
    validateBlogCommentInput,
    checkBlogCommentRateLimit,
    updateBlogCommentRateLimit,
  };
}
