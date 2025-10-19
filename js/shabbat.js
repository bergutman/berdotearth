function isShabbat() {
  const now = new Date();
  const day = now.getDay();
  const hours = now.getHours();

  // Shabbat is from Friday sunset to Saturday sunset.
  // We'll approximate this as Friday 6 PM to Saturday 7 PM.
  if (day === 5 && hours >= 18) {
    // Friday after 6 PM
    return true;
  }
  if (day === 6 && hours < 19) {
    // Saturday before 7 PM
    return true;
  }
  return false;
}

function shouldShowShabbatOverlay() {
  const dismissedUntil = localStorage.getItem("shabbatOverlayDismissedUntil");
  if (dismissedUntil) {
    const now = Date.now();
    return now > parseInt(dismissedUntil);
  }
  return true;
}

function showShabbatOverlay() {
  if (isShabbat() && shouldShowShabbatOverlay()) {
    const overlay = document.createElement("div");
    overlay.id = "shabbat-overlay";
    overlay.classList.add("bg-cloudy");
    overlay.innerHTML = `
      <div class="image-expand-content">
        <div class="image-expand-titlebar">
          <div class="image-expand-title">Ber97</div>
          <div class="image-expand-close" id="shabbat-close"></div>
        </div>
        <div class="shabbat-content">
          <img src="img/clipart/sod.gif" alt="Sod" class="shabbat-image">
          <h1>Shabbat Shalom!</h1>
          <p>Shabbat is the Jewish day of rest, which begins at sunset on Friday and ends at sunset on Saturday. During this time, I refrain from using technology and engaging in work-related activities. I encourage you to do the same!</p>
          <div class="shabbat-toggle-container">
            <label class="switch-windows95">
              <input type="checkbox" id="shabbat-toggle">
              <span class="slider-windows95 round"></span>
              <span class="slider-text-windows95 text-bold">GOY MODE: </span>
            </label>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.body.classList.add("shabbat-overlay-active");

    document.body.classList.add("shabbat-overlay-active");

    for (let i = 0; i < 5; i++) {
      const bouncingShalom = document.createElement("div");
      bouncingShalom.classList.add("bouncing-shalom");
      bouncingShalom.innerHTML =
        '<img src="img/clipart/shalom.gif" alt="Shalom">';
      overlay.appendChild(bouncingShalom);

      const size = Math.random() * 250 + 50; // Random size between 50 and 300
      bouncingShalom.style.width = `${size}px`;
      bouncingShalom.style.height = `${size}px`;

      const image = bouncingShalom.querySelector("img");
      let x = Math.random() * (window.innerWidth - size);
      let y = Math.random() * (window.innerHeight - size);
      let vx = (Math.random() - 0.5) * 8; // Faster velocity
      let vy = (Math.random() - 0.5) * 8; // Faster velocity

      function bounce() {
        const rect = bouncingShalom.getBoundingClientRect();
        x += vx;
        y += vy;

        if (x + rect.width > window.innerWidth || x < 0) {
          vx = -vx;
        }

        if (y + rect.height > window.innerHeight || y < 0) {
          vy = -vy;
        }

        bouncingShalom.style.left = `${x}px`;
        bouncingShalom.style.top = `${y}px`;

        requestAnimationFrame(bounce);
      }

      if (image.complete) {
        bounce();
      } else {
        image.onload = () => {
          bounce();
        };
      }
    }

    document.getElementById("shabbat-close").addEventListener("click", () => {
      overlay.style.display = "none";
      document.body.classList.remove("shabbat-overlay-active");
    });

    document
      .getElementById("shabbat-toggle")
      .addEventListener("change", (event) => {
        if (event.target.checked) {
          // Store dismissal for 24 hours
          const dismissedUntil = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now
          localStorage.setItem(
            "shabbatOverlayDismissedUntil",
            dismissedUntil.toString(),
          );

          setTimeout(() => {
            overlay.style.display = "none";
            document.body.classList.remove("shabbat-overlay-active");
          }, 500); // 500ms delay
        }
      });
  }
}

// Utility function to check and reset local storage for testing
function debugShabbatOverlay() {
  console.log("=== Shabbat Overlay Debug Info ===");
  console.log("Current page URL:", window.location.href);
  console.log("isShabbat():", isShabbat());
  console.log(
    "localStorage 'shabbatOverlayDismissedUntil':",
    localStorage.getItem("shabbatOverlayDismissedUntil"),
  );
  console.log("shouldShowShabbatOverlay():", shouldShowShabbatOverlay());
  console.log("All localStorage keys:", Object.keys(localStorage));

  // Add buttons to test functionality
  const debugDiv = document.createElement("div");
  debugDiv.style.cssText =
    "position:fixed;top:10px;right:10px;background:white;padding:10px;border:1px solid black;z-index:10000;";
  debugDiv.innerHTML = `
    <h3>Shabbat Overlay Debug</h3>
    <button onclick="localStorage.setItem('shabbatOverlayDismissedUntil', (Date.now() + 24 * 60 * 60 * 1000).toString()); console.log('Set dismissed for 24 hours')">Set Dismissed (24h)</button>
    <button onclick="localStorage.removeItem('shabbatOverlayDismissedUntil'); console.log('Removed dismissed')">Clear Dismissed</button>
    <button onclick="location.reload()">Reload Page</button>
  `;
  document.body.appendChild(debugDiv);
}

document.addEventListener("DOMContentLoaded", showShabbatOverlay);
