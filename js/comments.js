document.addEventListener("DOMContentLoaded", () => {
  const commentsContainer = document.getElementById("comments-container");
  if (!commentsContainer) return; // Don't run if there's no comments container

  const postId = commentsContainer.dataset.postId;
  const commentsList = document.getElementById("comments-list");
  const commentsGrid = document.createElement("div");
  commentsGrid.className = "grid grid-2 gap-30 m-t-15 m-b-15";
  const stickyColors = [
    "bg-sticky-yellow",
    "bg-sticky-orange",
    "bg-sticky-pink",
    "bg-sticky-blue",
    "bg-sticky-green",
  ];
  const commentFormContainer = document.querySelector(".comment-form");
  const commentsForm = document.getElementById("comment-form");
  const formFeedback = document.getElementById("comment-form-feedback");
  const postIdInput = document.getElementById("post-id-input");

  // Move form container above comments and style as single column
  if (commentFormContainer) {
    const formWrapper = document.createElement("div");
    formWrapper.className = "flex justify-center m-b-30";
    commentFormContainer.className += " w-50";
    formWrapper.appendChild(commentFormContainer);
    commentsList.parentNode.insertBefore(formWrapper, commentsList);
  }

  // Set the post ID in the hidden form field
  if (postIdInput) {
    postIdInput.value = postId;
  }

  function loadComments() {
    const url =
      "https://corsproxy.io/?https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_tHMdbJbaRy6bD4zUJ4ktu0WCKvjOiJ62_U2XwFQp6I2uwPLpYlLyG08UVAllCd1ePSQcuctD-r1s/pub?gid=495620982&single=true&output=csv";
    commentsList.innerHTML =
      '<div class="text-center m-b-30"><img src="../img/clipart/Advertise_Here.gif" id="loading-gif" alt="Loading..." /></div>';
    commentsList.appendChild(commentsGrid);

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
        commentsList.appendChild(commentsGrid);
        commentsGrid.innerHTML = "";
        function parseCSV(text) {
          let result = [];
          let currentLine = [];
          let currentField = "";
          let inQuotes = false;
          let i = 0;

          // Skip header line
          let headerEnd = text.indexOf("\n");
          if (headerEnd === -1) return result;
          i = headerEnd + 1;

          while (i < text.length) {
            let char = text[i];

            if (char === '"') {
              inQuotes = !inQuotes;
              i++;
            } else if (char === "," && !inQuotes) {
              currentLine.push(currentField.trim());
              currentField = "";
              i++;
            } else if (char === "\n" && !inQuotes) {
              currentLine.push(currentField.trim());
              if (currentLine.length > 0) {
                result.push(currentLine);
              }
              currentLine = [];
              currentField = "";
              i++;
            } else if (char === "\n" && inQuotes) {
              // Preserve line breaks within quoted fields
              currentField += "\n";
              i++;
            } else {
              currentField += char;
              i++;
            }
          }

          // Add the last line if there's any content
          if (currentField.trim() !== "" || currentLine.length > 0) {
            currentLine.push(currentField.trim());
            if (currentLine.length > 0) {
              result.push(currentLine);
            }
          }

          return result;
        }

        // Remove the old parseCSVLine function as it's no longer needed
        const rows = parseCSV(data);

        rows.reverse();

        let commentIndex = 0;
        rows.forEach((row) => {
          if (row.length < 4) return;

          const commentPostId = row[1];
          if (commentPostId === postId) {
            const timestamp = row[0];
            const name = row[2];
            const message = row[3];

            const entry = document.createElement("div");
            const colorClass = stickyColors[commentIndex % stickyColors.length];
            const tiltClass =
              commentIndex % 2 === 0 ? "tilted-reverse" : "tilted";
            entry.className = `comment-entry block m-b-20 p-25 p-t-30 no-decoration text-inherit ${colorClass} border-solid raised ${tiltClass}`;
            commentIndex++;

            const pinEl = document.createElement("img");
            pinEl.className = "absolute left-0 right-0 m-h-a m-t--30";
            const pinColors = {
              "bg-sticky-yellow": "../img/bullets/purplepush.gif",
              "bg-sticky-orange": "../img/bullets/bluepush.gif",
              "bg-sticky-pink": "../img/bullets/greenpush.gif",
              "bg-sticky-blue": "../img/bullets/orangepush.gif",
              "bg-sticky-green": "../img/bullets/redpush.gif",
            };
            pinEl.src = pinColors[colorClass];

            const metaEl = document.createElement("div");
            metaEl.className = "flex justify-space-between m-b-10";

            const nameIcon = document.createElement("i");
            nameIcon.className = "fas fa-user";

            const nameEl = document.createElement("span");
            nameEl.className = "comment-name";
            nameEl.appendChild(nameIcon);
            nameEl.appendChild(document.createTextNode(" " + name));

            const dateEl = document.createElement("span");
            dateEl.className = "comment-date";
            const dateIcon = document.createElement("i");
            dateIcon.className = "fas fa-calendar";
            const date = new Date(timestamp);
            dateEl.appendChild(dateIcon);
            dateEl.appendChild(
              document.createTextNode(
                ` ${date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
              ),
            );

            const messageEl = document.createElement("p");
            messageEl.textContent = message;
            messageEl.className = "comment-message";

            entry.appendChild(pinEl);
            entry.appendChild(metaEl);
            metaEl.appendChild(nameEl);
            metaEl.appendChild(dateEl);
            entry.appendChild(messageEl);

            commentsGrid.appendChild(entry);
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
      const existingComments = commentsGrid.querySelectorAll(".comment-entry");
      const colorClass =
        stickyColors[existingComments.length % stickyColors.length];
      const tiltClass =
        existingComments.length % 2 === 0 ? "tilted-reverse" : "tilted";
      entry.className = `comment-entry block m-b-20 p-25 p-t-30 no-decoration text-inherit ${colorClass} border-solid raised ${tiltClass}`;

      const pinEl = document.createElement("img");
      pinEl.className = "absolute left-0 right-0 m-h-a m-t--30";
      const pinColors = {
        "bg-sticky-yellow": "../img/bullets/purplepush.gif",
        "bg-sticky-orange": "../img/bullets/bluepush.gif",
        "bg-sticky-pink": "../img/bullets/greenpush.gif",
        "bg-sticky-blue": "../img/bullets/orangepush.gif",
        "bg-sticky-green": "../img/bullets/redpush.gif",
      };
      pinEl.src = pinColors[colorClass];

      const metaEl = document.createElement("div");
      metaEl.className = "flex justify-space-between m-b-10";

      const nameIcon = document.createElement("i");
      nameIcon.className = "fas fa-comment";

      const nameEl = document.createElement("span");
      nameEl.className = "comment-name";
      nameEl.appendChild(nameIcon);
      nameEl.appendChild(document.createTextNode(" " + name));

      const dateEl = document.createElement("span");
      dateEl.className = "comment-date";
      const dateIcon = document.createElement("i");
      dateIcon.className = "fas fa-calendar";
      const date = new Date();
      dateEl.appendChild(dateIcon);
      dateEl.appendChild(
        document.createTextNode(
          ` Posted: ${date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
        ),
      );

      const messageEl = document.createElement("p");
      messageEl.textContent = message;
      messageEl.className = "comment-message";

      entry.appendChild(pinEl);
      entry.appendChild(metaEl);
      metaEl.appendChild(nameEl);
      metaEl.appendChild(dateEl);
      entry.appendChild(messageEl);

      commentsGrid.prepend(entry);

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
