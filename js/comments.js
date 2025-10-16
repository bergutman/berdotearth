document.addEventListener("DOMContentLoaded", () => {
  const commentsContainer = document.getElementById("comments-container");
  if (!commentsContainer) return; // Don't run if there's no comments container

  const postId = commentsContainer.dataset.postId;
  const commentsList = document.getElementById("comments-list");
  const commentsForm = document.getElementById("comment-form");
  const formFeedback = document.getElementById("comment-form-feedback");
  const postIdInput = document.getElementById("post-id-input");

  // Set the post ID in the hidden form field
  if (postIdInput) {
    postIdInput.value = postId;
  }

  function loadComments() {
    const url =
      "https://corsproxy.io/?https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_tHMdbJbaRy6bD4zUJ4ktu0WCKvjOiJ62_U2XwFQp6I2uwPLpYlLyG08UVAllCd1ePSQcuctD-r1s/pub?gid=495620982&single=true&output=csv";
    commentsList.innerHTML =
      '<img src="../img/clipart/Advertise_Here.gif" id="loading-gif" alt="Loading..." />';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    fetch(url, { signal: controller.signal })
      .then((response) => {
        clearTimeout(timeoutId);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then((data) => {
        if (!data || !data.includes(",")) {
          // Basic check for valid CSV
          throw new Error("Invalid CSV data received.");
        }

        commentsList.innerHTML = "";
        function parseCSV(text) {
          let lines = text.split("\n");
          let result = [];
          for (let i = 1; i < lines.length; i++) {
            let currentline = lines[i].split(",");
            result.push(currentline);
          }
          return result;
        }
        const rows = parseCSV(data);

        rows.reverse();

        rows.forEach((row) => {
          if (row.length < 4) return;

          const commentPostId = row[1];
          if (commentPostId === postId) {
            const timestamp = row[0];
            const name = row[2];
            const message = row[3];

            const entry = document.createElement("div");
            entry.className = "comment-entry bg-shadow";

            const nameEl = document.createElement("div");
            nameEl.className = "comment-name";
            nameEl.textContent = name;

            const dateEl = document.createElement("div");
            dateEl.className = "comment-date";
            const date = new Date(timestamp);
            dateEl.textContent = `Posted: ${date.toLocaleDateString()}`;

            const messageEl = document.createElement("p");
            messageEl.textContent = message;

            entry.appendChild(nameEl);
            entry.appendChild(dateEl);
            entry.appendChild(messageEl);

            commentsList.appendChild(entry);
          }
        });
      })
      .catch((error) => {
        console.error("Error fetching comments:", error);
        commentsList.innerHTML =
          '<p>Error loading comments. Please try again.</p><button id="retry-button" class="retro-button">Retry</button>';
        document
          .getElementById("retry-button")
          .addEventListener("click", loadComments);
      });
  }

  if (commentsForm) {
    commentsForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const formData = new FormData(commentsForm);
      const name = formData.get("entry.2022230315");
      const message = formData.get("entry.141164213");
      const url =
        "https://docs.google.com/forms/u/0/d/e/1FAIpQLSdQANVcbWI8hw_kkSiZ7oBuK7oqvT6x1sYGT2DpYQv63eqQtw/formResponse";

      // Optimistic UI update
      const entry = document.createElement("div");
      entry.className = "comment-entry bg-shadow";

      const nameEl = document.createElement("div");
      nameEl.className = "comment-name";
      nameEl.textContent = name;

      const dateEl = document.createElement("div");
      dateEl.className = "comment-date";
      dateEl.textContent = `Posted: ${new Date().toLocaleDateString()}`;

      const messageEl = document.createElement("p");
      messageEl.textContent = message;

      entry.appendChild(nameEl);
      entry.appendChild(dateEl);
      entry.appendChild(messageEl);

      commentsList.prepend(entry);

      fetch(url, {
        method: "POST",
        mode: "no-cors",
        body: new URLSearchParams(formData),
      })
        .then(() => {
          formFeedback.textContent = "Thank you for your comment!";
          commentsForm.reset();
          postIdInput.value = postId;
          setTimeout(() => {
            formFeedback.textContent = "";
          }, 3000);
        })
        .catch((error) => {
          console.error("Error submitting comment:", error);
          formFeedback.textContent =
            "There was an error submitting your comment. Please try again.";
          entry.remove();
        });
    });
  }

  loadComments();
});
