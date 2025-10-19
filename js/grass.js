function isMobile() {
  // Check for common mobile device indicators
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    ) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 2) ||
    window.innerWidth <= 768
  );
}

function shouldShowMobileOverlay() {
  return localStorage.getItem("mobileOverlayDismissed") !== "true";
}

function showMobileOverlay() {
  if (isMobile() && shouldShowMobileOverlay()) {
    const overlay = document.createElement("div");
    overlay.id = "mobile-overlay";
    overlay.classList.add("bg-grass");
    overlay.innerHTML = `
      <div class="image-expand-content">
        <div class="image-expand-titlebar">
          <div class="image-expand-title">Ber97</div>
          <div class="image-expand-close" id="mobile-close"></div>
        </div>
        <div class="mobile-content">
          <img src="img/clipart/welcome.gif" alt="Grass" class="mobile-image">
          <p>You're browsing on a mobile device? Go touch grass! This site is best viewed on desktop where you can fully appreciate its retro glory. But hey, if you're determined to scroll through this masterpiece on a tiny screen, I won't stop you... just don't say I didn't warn you!</p>
          <div class="mobile-button-container">
            <button id="mobile-enter-button" class="enter-button">ENTER</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.body.classList.add("mobile-overlay-active");

    for (let i = 0; i < 5; i++) {
      const bouncingGrass = document.createElement("div");
      bouncingGrass.classList.add("bouncing-grass");
      bouncingGrass.innerHTML =
        '<img src="img/clipart/goodluck.gif" alt="Grass">';
      overlay.appendChild(bouncingGrass);

      const size = Math.random() * 80 + 30; // Random size between 30 and 110
      bouncingGrass.style.width = `${size}px`;
      bouncingGrass.style.height = `${size}px`;

      const image = bouncingGrass.querySelector("img");
      let x = Math.random() * (window.innerWidth - size);
      let y = Math.random() * (window.innerHeight - size);
      let vx = (Math.random() - 0.5) * 8; // Faster velocity
      let vy = (Math.random() - 0.5) * 8; // Faster velocity

      function bounce() {
        const rect = bouncingGrass.getBoundingClientRect();
        x += vx;
        y += vy;

        if (x + rect.width > window.innerWidth || x < 0) {
          vx = -vx;
        }

        if (y + rect.height > window.innerHeight || y < 0) {
          vy = -vy;
        }

        bouncingGrass.style.left = `${x}px`;
        bouncingGrass.style.top = `${y}px`;

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

    document.getElementById("mobile-close").addEventListener("click", () => {
      overlay.style.display = "none";
      document.body.classList.remove("mobile-overlay-active");
    });

    document
      .getElementById("mobile-enter-button")
      .addEventListener("click", () => {
        // Store permanent dismissal in local storage (site-wide)
        localStorage.setItem("mobileOverlayDismissed", "true");
        overlay.style.display = "none";
        document.body.classList.remove("mobile-overlay-active");
      });
  }
}

// Test function to debug local storage
function testMobileOverlayStorage() {
  console.log("Mobile overlay storage test:");
  console.log("isMobile:", isMobile());
  console.log("shouldShowMobileOverlay:", shouldShowMobileOverlay());
  console.log(
    "localStorage.getItem('mobileOverlayDismissed'):",
    localStorage.getItem("mobileOverlayDismissed"),
  );
}

// Utility function to check and reset local storage for testing
function debugMobileOverlay() {
  console.log("=== Mobile Overlay Debug Info ===");
  console.log("Current page URL:", window.location.href);
  console.log("isMobile():", isMobile());
  console.log(
    "localStorage 'mobileOverlayDismissed':",
    localStorage.getItem("mobileOverlayDismissed"),
  );
  console.log("shouldShowMobileOverlay():", shouldShowMobileOverlay());
  console.log("All localStorage keys:", Object.keys(localStorage));

  // Add buttons to test functionality
  const debugDiv = document.createElement("div");
  debugDiv.style.cssText =
    "position:fixed;top:10px;right:10px;background:white;padding:10px;border:1px solid black;z-index:10000;";
  debugDiv.innerHTML = `
    <h3>Mobile Overlay Debug</h3>
    <button onclick="localStorage.setItem('mobileOverlayDismissed', 'true'); console.log('Set dismissed to true')">Set Dismissed</button>
    <button onclick="localStorage.removeItem('mobileOverlayDismissed'); console.log('Removed dismissed')">Clear Dismissed</button>
    <button onclick="location.reload()">Reload Page</button>
  `;
  document.body.appendChild(debugDiv);
}

document.addEventListener("DOMContentLoaded", showMobileOverlay);
