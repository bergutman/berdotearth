document.addEventListener("DOMContentLoaded", () => {
  const guestbookEntries = document.getElementById("guestbook-entries");
  const guestbookForm = document.getElementById("guestbook-form");
  const formFeedback = document.getElementById("form-feedback");

  /**
   * Load and display guestbook entries from Supabase
   */
  async function loadGuestbookEntries() {
    // Show loading state
    guestbookEntries.innerHTML =
      '<img src="img/clipart/Advertise_Here.gif" id="loading-gif" alt="Loading..." />';

    try {
      const result = await window.guestbookAPI.fetchGuestbookEntries();

      if (!result.success) {
        throw new Error(result.error);
      }

      // Clear loading state
      guestbookEntries.innerHTML = "";

      if (result.data.length === 0) {
        guestbookEntries.innerHTML =
          '<p style="color: var(--lime-green);">No entries yet. Be the first to sign the guestbook!</p>';
        return;
      }

      // Display entries (newest first - Supabase already returns them in that order)
      result.data.forEach((entry) => {
        const entryElement =
          window.guestbookAPI.createGuestbookEntryElement(entry);
        guestbookEntries.appendChild(entryElement);
      });
    } catch (error) {
      console.error("Error loading guestbook entries:", error);
      guestbookEntries.innerHTML = `
        <p style="color: var(--lime-green);">Error loading guestbook entries: ${error.message}</p>
        <button id="retry-button" class="retro-button" style="margin-top: 10px;">
          <i class="fas fa-redo"></i> Retry
        </button>
      `;

      // Add retry functionality
      const retryButton = document.getElementById("retry-button");
      if (retryButton) {
        retryButton.addEventListener("click", loadGuestbookEntries);
      }
    }
  }

  /**
   * Handle form submission to Supabase
   */
  async function handleFormSubmit(event) {
    event.preventDefault();

    // Get form data
    const formData = new FormData(guestbookForm);
    const displayName = formData.get("display_name");
    const message = formData.get("message");

    // Validate input
    const validation = window.guestbookAPI.validateGuestbookInput(
      displayName,
      message,
    );

    if (!validation.isValid) {
      // Show validation errors
      formFeedback.innerHTML = validation.errors
        .map(
          (error) => `<p style="color: #ff6b6b; margin: 2px 0;">• ${error}</p>`,
        )
        .join("");
      formFeedback.style.display = "block";
      return;
    }

    // Clear any previous error messages
    formFeedback.innerHTML = "";
    formFeedback.style.display = "block";
    formFeedback.innerHTML =
      '<p style="color: var(--sun-yellow);"><i class="fas fa-spinner fa-spin"></i> Submitting...</p>';

    // Disable submit button to prevent double submissions
    const submitButton = guestbookForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Submitting...';

    try {
      // Create optimistic UI entry
      const optimisticEntry = window.guestbookAPI.createGuestbookEntryElement({
        display_name: validation.trimmedName,
        message: validation.trimmedMessage,
        created_at: new Date().toISOString(),
      });

      // Add entry to the top of the list
      if (
        guestbookEntries.firstChild &&
        guestbookEntries.firstChild.id !== "loading-gif"
      ) {
        guestbookEntries.insertBefore(
          optimisticEntry,
          guestbookEntries.firstChild,
        );
      } else {
        guestbookEntries.innerHTML = "";
        guestbookEntries.appendChild(optimisticEntry);
      }

      // Submit to Supabase
      const result = await window.guestbookAPI.submitGuestbookEntry(
        validation.trimmedName,
        validation.trimmedMessage,
      );

      if (!result.success) {
        // Handle rate limit specifically
        if (result.waitTime) {
          throw new Error(
            `⏱️ ${result.error}. Please wait ${result.waitTime} seconds.`,
          );
        } else {
          throw new Error(result.error);
        }
      }

      // Success!
      formFeedback.innerHTML =
        '<p style="color: var(--lime-green);"><i class="fas fa-check"></i> Thank you for your submission!</p>';

      // Reset form
      guestbookForm.reset();

      // Reload entries to get the real data (in case of any server-side processing)
      setTimeout(() => {
        loadGuestbookEntries();
        formFeedback.innerHTML = "";
        formFeedback.style.display = "none";
      }, 2000);
    } catch (error) {
      console.error("Error submitting guestbook entry:", error);

      // Remove optimistic entry if submission failed
      const optimisticEntry = guestbookEntries.firstChild;
      if (optimisticEntry && optimisticEntry.className === "bg-shadow") {
        optimisticEntry.remove();
      }

      // Show error message
      formFeedback.innerHTML = `<p style="color: #ff6b6b;"><i class="fas fa-exclamation-triangle"></i> ${error.message || "Failed to submit entry. Please try again."}</p>`;
    } finally {
      // Re-enable submit button
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonText;
    }
  }

  // Set up form submission handler
  guestbookForm.addEventListener("submit", handleFormSubmit);

  // Initial load of guestbook entries
  loadGuestbookEntries();
});
