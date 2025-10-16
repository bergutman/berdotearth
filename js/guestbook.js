document.addEventListener("DOMContentLoaded", () => {
  const guestbookEntries = document.getElementById("guestbook-entries");
  const guestbookForm = document.getElementById("guestbook-form");
  const formFeedback = document.getElementById("form-feedback");

  function loadGuestbookEntries() {
    const url =
      "https://corsproxy.io/?https://docs.google.com/spreadsheets/d/e/2PACX-1vR6NMovjyP5XdnE-yN59kdL3Fgy8iLZF4FfVGuLfK9xwTEi0E_xVvxbvRRZJOLfSwPHKoQp5obY0G9_/pub?gid=1194882694&single=true&output=csv";
    guestbookEntries.innerHTML =
      '<img src="img/clipart/Advertise_Here.gif" id="loading-gif" alt="Loading..." />';

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

        guestbookEntries.innerHTML = "";
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
          if (row.length < 3) return;

          const timestamp = row[0];
          const message = row[1];
          const name = row[2];

          const entry = document.createElement("div");
          entry.className = "bg-shadow";
          entry.style =
            "margin: 10px 0; padding: 10px; border: 1px solid var(--lime-green);";

          const nameEl = document.createElement("div");
          nameEl.style = "color: var(--lime-green); font-weight: bold;";
          nameEl.textContent = name;

          const dateEl = document.createElement("div");
          dateEl.style = "color: var(--sun-yellow); font-size: 0.8rem;";
          const date = new Date(timestamp);
          dateEl.textContent = `Posted: ${date.toLocaleDateString()}`;

          const messageEl = document.createElement("p");
          messageEl.textContent = message;

          entry.appendChild(nameEl);
          entry.appendChild(dateEl);
          entry.appendChild(messageEl);

          guestbookEntries.appendChild(entry);
        });
      })
      .catch((error) => {
        console.error("Error fetching Google Sheet data:", error);
        guestbookEntries.innerHTML = `<p>Error loading guestbook entries. Please try again.</p><button id="retry-button" class="retro-button">Retry</button>`;
        document
          .getElementById("retry-button")
          .addEventListener("click", loadGuestbookEntries);
      });
  }

  guestbookForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(guestbookForm);
    const name = formData.get("entry.641373449");
    const message = formData.get("entry.1667421222");
    const url =
      "https://docs.google.com/forms/u/0/d/e/1FAIpQLSebd_HdyhqPpo9V8Qg5tem2oNTLhIE4i8zoTlleDxiYBEfNJg/formResponse";

    // Optimistic UI update
    const entry = document.createElement("div");
    entry.className = "guestbook-entry bg-shadow";

    const nameEl = document.createElement("div");
    nameEl.style = "color: var(--lime-green); font-weight: bold;";
    nameEl.textContent = name;

    const dateEl = document.createElement("div");
    dateEl.style = "color: var(--sun-yellow); font-size: 0.8rem;";
    dateEl.textContent = `Posted: ${new Date().toLocaleDateString()}`;

    const messageEl = document.createElement("p");
    messageEl.textContent = message;

    entry.appendChild(nameEl);
    entry.appendChild(dateEl);
    entry.appendChild(messageEl);

    guestbookEntries.prepend(entry);

    fetch(url, {
      method: "POST",
      mode: "no-cors",
      body: new URLSearchParams(formData),
    })
      .then(() => {
        formFeedback.textContent = "Thank you for your submission!";
        guestbookForm.reset();
        setTimeout(() => {
          formFeedback.textContent = "";
        }, 3000);
      })
      .catch((error) => {
        console.error("Error submitting form:", error);
        formFeedback.textContent =
          "There was an error submitting your message. Please try again.";
        entry.remove();
      });
  });

  // Initial load of guestbook entries
  loadGuestbookEntries();
});
