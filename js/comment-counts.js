/**
 * Blog Comment Counts - Supabase Implementation
 *
 * This file replaces the Google Sheets-based comment count system with Supabase.
 * It fetches comment counts for all posts and updates the display elements.
 */

document.addEventListener("DOMContentLoaded", () => {
  /**
   * Update comment counts for all blog posts on the page
   */
  async function updateAllCommentCounts() {
    try {
      // Get all unique post IDs from comment count elements
      const commentCountElements = document.querySelectorAll('.comment-count[data-post-id]');
      const postIds = Array.from(commentCountElements).map(el => el.dataset.postId);

      if (postIds.length === 0) return;

      const result = await window.blogCommentsAPI.fetchBlogCommentCounts(postIds);

      if (result.success) {
        commentCountElements.forEach(element => {
          const postId = element.dataset.postId;
          const count = result.counts[postId] || 0;
          element.textContent = `${count} ${count === 1 ? 'Comment' : 'Comments'}`;
        });
      }
    } catch (error) {
      console.error("Error updating comment counts:", error);
      // Fallback: set all counts to 0 on error
      const commentCountElements = document.querySelectorAll('.comment-count[data-post-id]');
      commentCountElements.forEach(element => {
        element.textContent = '0 Comments';
      });
    }
  }

  // Update comment counts on page load
  updateAllCommentCounts();
});
