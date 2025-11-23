/**
 * Blog Comments System - Supabase Implementation
 *
 * This file replaces the Google Sheets-based comment system with Supabase.
 * It maintains the same user experience and styling while using a modern backend.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Only run on blog post pages
  const commentsContainer = document.getElementById("comments-container");
  if (!commentsContainer) return;

  const postId = commentsContainer.dataset.postId;
  if (!postId) {
    console.error("No post ID found on comments container");
    return;
  }

  const commentForm = document.getElementById("comment-form");
  const commentName = document.getElementById("comment-name");
  const commentMessage = document.getElementById("comment-message");
  const submitButton = commentForm
    ? commentForm.querySelector('button[type="submit"]')
    : null;
  const formFeedback = document.getElementById("form-feedback");

  // Wrap comment form in proper container for styling
  const commentFormWrapper = document.querySelector(".comment-form");
  if (
    commentFormWrapper &&
    !commentFormWrapper.parentElement.classList.contains("flex")
  ) {
    const formWrapper = document.createElement("div");
    formWrapper.className = "flex justify-center m-b-30";

    // Add w-50 class to make form smaller
    commentFormWrapper.classList.add("w-50");

    // Replace the form with the wrapped version
    commentFormWrapper.parentNode.insertBefore(formWrapper, commentFormWrapper);
    formWrapper.appendChild(commentFormWrapper);
  }

  /**
   * Load and display blog comments for the current post
   */
  async function loadBlogComments() {
    try {
      // Find the comments list div - it should already exist in the HTML
      let commentsList = document.getElementById("comments-list");
      if (!commentsList) {
        commentsList = document.createElement("div");
        commentsList.id = "comments-list";
        commentsList.className = "comments-list";
        commentsList.style.textAlign = "center";
        commentsContainer.appendChild(commentsList);
      }

      // Show loading state and remove any optimistic comments
      commentsList.innerHTML =
        '<img src="../img/clipart/Advertise_Here.gif" alt="Loading comments..." />';

      const result = await window.blogCommentsAPI.fetchBlogComments(postId);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Clear loading state
      commentsList.innerHTML = "";

      if (result.data.length === 0) {
        commentsList.innerHTML =
          '<p style="color: var(--lime-green); text-align: center;">No comments yet. Be the first to comment!</p>';
      } else {
        // Display comments in a grid layout (matching original system)
        const commentsGrid = document.createElement("div");
        commentsGrid.className = "grid grid-2 gap-30 m-t-15 m-b-15";

        result.data.forEach((comment) => {
          const commentElement =
            window.blogCommentsAPI.createBlogCommentElement(comment);
          commentsGrid.appendChild(commentElement);
        });

        commentsList.appendChild(commentsGrid);
      }
    } catch (error) {
      console.error("Error loading blog comments:", error);
      // Find or create comments list for error display
      let commentsList = document.getElementById("comments-list");
      if (!commentsList) {
        commentsList = document.createElement("div");
        commentsList.id = "comments-list";
        commentsList.className = "comments-list";
        commentsContainer.insertBefore(
          commentsList,
          commentsContainer.firstChild,
        );
      }

      commentsList.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <p style="color: var(--lime-green);">Error loading comments: ${error.message}</p>
          <button id="retry-comments" class="retro-button" style="margin-top: 10px;">
            <i class="fas fa-redo"></i> Retry
          </button>
        </div>
      `;

      // Add retry functionality
      const retryButton = document.getElementById("retry-comments");
      if (retryButton) {
        retryButton.addEventListener("click", loadBlogComments);
      }
    }
  }

  /**
   * Handle comment form submission
   */
  async function handleCommentSubmission(event) {
    event.preventDefault();

    if (!commentName || !commentMessage) {
      console.error("Form elements not found");
      return;
    }

    // Get form values
    const name = commentName.value.trim();
    const message = commentMessage.value.trim();

    // Validate input
    const validation = window.blogCommentsAPI.validateBlogCommentInput(
      postId,
      name,
      message,
    );

    if (!validation.isValid) {
      // Show validation errors
      if (formFeedback) {
        formFeedback.innerHTML = validation.errors
          .map(
            (error) => `<p style="color: #ff6b6b; margin: 2px 0;">${error}</p>`,
          )
          .join("");
        formFeedback.style.display = "block";
      }
      return;
    }

    // Clear any previous error messages
    if (formFeedback) {
      formFeedback.innerHTML = "";
      formFeedback.style.display = "block";
      formFeedback.innerHTML =
        '<p style="color: var(--sun-yellow);"><i class="fas fa-spinner fa-spin"></i> Submitting comment...</p>';
    }

    // Disable submit button to prevent double submissions
    if (submitButton) {
      const originalButtonText = submitButton.innerHTML;
      submitButton.disabled = true;
      submitButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    }

    try {
      // Create optimistic UI comment
      const optimisticComment = {
        post_id: postId,
        name: validation.trimmedName,
        message: validation.trimmedMessage,
        created_at: new Date().toISOString(),
      };

      // Add comment to the top of the list
      const commentElement =
        window.blogCommentsAPI.createBlogCommentElement(optimisticComment);

      // Find or create comments grid
      const commentsList = document.getElementById("comments-list");
      let commentsGrid = commentsList.querySelector(".grid");
      if (!commentsGrid) {
        // Clear loading message and create grid
        commentsList.innerHTML = "";
        commentsGrid = document.createElement("div");
        commentsGrid.className = "grid grid-2 gap-30 m-t-15 m-b-15";
        commentsList.appendChild(commentsGrid);
      }

      // Add optimistic comment to the top
      commentsGrid.insertBefore(commentElement, commentsGrid.firstChild);

      // Submit to Supabase
      const result = await window.blogCommentsAPI.submitBlogComment(
        postId,
        validation.trimmedName,
        validation.trimmedMessage,
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      // Success!
      if (formFeedback) {
        formFeedback.innerHTML =
          '<p style="color: var(--lime-green);"><i class="fas fa-check"></i> Comment submitted successfully!</p>';
      }

      // Reset form
      if (commentForm) {
        commentForm.reset();
      }

      // Reload comments to get the real data and update comment count
      setTimeout(() => {
        loadBlogComments();
        updateCommentCount();

        if (formFeedback) {
          formFeedback.innerHTML = "";
          formFeedback.style.display = "none";
        }
      }, 2000);
    } catch (error) {
      console.error("Error submitting blog comment:", error);

      // Remove optimistic comment if submission failed
      const commentsList = document.getElementById("comments-list");
      const optimisticCommentElement = commentsList.querySelector(
        ".grid .comment-entry",
      );
      if (
        optimisticCommentElement &&
        commentsList.querySelector(".grid").children.length === 1
      ) {
        // If it's the only comment, show the no comments message
        commentsList.innerHTML =
          '<p style="color: var(--lime-green); text-align: center;">No comments yet. Be the first to comment!</p>';
      } else if (optimisticCommentElement) {
        optimisticCommentElement.remove();
      }

      // Show error message
      if (formFeedback) {
        if (error.message.includes("Rate limit")) {
          formFeedback.innerHTML = `<p style="color: #ff6b6b;">⏱️ ${error.message}</p>`;
        } else {
          formFeedback.innerHTML = `<p style="color: #ff6b6b;"><i class="fas fa-exclamation-triangle"></i> ${error.message || "Failed to submit comment. Please try again."}</p>`;
        }
      }
    } finally {
      // Re-enable submit button
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
      }
    }
  }

  /**
   * Update comment count for the current post
   */
  async function updateCommentCount() {
    try {
      const result = await window.blogCommentsAPI.fetchBlogComments(postId);

      if (result.success) {
        const count = result.data.length;
        const commentCountElements = document.querySelectorAll(
          `.comment-count[data-post-id="${postId}"]`,
        );

        commentCountElements.forEach((element) => {
          element.textContent = `${count} ${count === 1 ? "Comment" : "Comments"}`;
        });
      }
    } catch (error) {
      console.error("Error updating comment count:", error);
    }
  }

  /**
   * Update comment counts for all posts on the page
   */
  async function updateAllCommentCounts() {
    try {
      // Get all unique post IDs from comment count elements
      const commentCountElements = document.querySelectorAll(
        ".comment-count[data-post-id]",
      );
      const postIds = Array.from(commentCountElements).map(
        (el) => el.dataset.postId,
      );

      if (postIds.length === 0) return;

      const result =
        await window.blogCommentsAPI.fetchBlogCommentCounts(postIds);

      if (result.success) {
        commentCountElements.forEach((element) => {
          const postId = element.dataset.postId;
          const count = result.counts[postId] || 0;
          element.textContent = `${count} ${count === 1 ? "Comment" : "Comments"}`;
        });
      }
    } catch (error) {
      console.error("Error updating comment counts:", error);
    }
  }

  // Set up form submission handler
  if (commentForm) {
    commentForm.addEventListener("submit", handleCommentSubmission);
  }

  // Load comments for individual post pages
  if (postId) {
    loadBlogComments();
  }

  // Update comment counts for blog listing pages
  updateAllCommentCounts();
});
