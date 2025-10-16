document.addEventListener("DOMContentLoaded", function () {
  const ctx = document.getElementById("politicalCompass").getContext("2d");

  // Create consistent wobbly effect by adding seeded noise to points
  function addWobble(points, magnitude = 0.8) {
    // Use a fixed seed for consistent wobble across refreshes
    const seed = 42; // Fixed seed for consistency
    let counter = 0;

    return points.map((point) => {
      // Simple pseudo-random generator using the seed
      const random1 = Math.sin(seed + counter) * 10000;
      const random2 = Math.sin(seed + counter + 1) * 10000;
      const wobbleX = (random1 - Math.floor(random1) - 0.5) * magnitude;
      const wobbleY = (random2 - Math.floor(random2) - 0.5) * magnitude;
      counter += 2;

      return {
        x: point.x + wobbleX,
        y: point.y + wobbleY,
      };
    });
  }

  // Political compass data - positions of various ideologies
  const ideologies = [
    { label: "Needs\nto touch\ngrass", x: -8, y: -8, color: "#7CDA01" }, // neon-pink
    { label: "Target\nDollar\nSection", x: 8, y: -8, color: "#FC3E3E" }, // electric-blue
    { label: "Shocks\ntheir dog", x: -8, y: 8, color: "#FC3E3E" }, // sun-yellow
    { label: "Addicted to\ntrans porn", x: 7, y: 8, color: "#7CDA01" }, // lime-green
    { label: "Swifties", x: 0, y: 0, color: "white" }, // deep-purple
    { label: "Harry\nPotter\nAdults", x: -4, y: 2, color: "#FF950C" }, // neon-pink variant
    { label: "Disney\nAdults", x: 4, y: 4, color: "#0D8DFF" }, // electric-blue variant
    { label: "European Union\nexclusive DLC", x: -5, y: -4, color: "#B02FF7" }, // lime-green variant
    { label: "Owns a house", x: 5, y: -4, color: "#FEDC03" },
  ];

  // Add wobble to all points
  const wobblyIdeologies = ideologies.map((ideology) => ({
    ...ideology,
    ...addWobble([{ x: ideology.x, y: ideology.y }], 0.8)[0],
  }));

  const politicalCompass = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Political Ideologies",
          data: wobblyIdeologies,
          backgroundColor: "transparent",
          borderColor: "transparent",
          borderWidth: 0,
          pointRadius: 0,
          pointHoverRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1,
      scales: {
        x: {
          min: -10,
          max: 10,
          grid: {
            display: false,
          },
          ticks: {
            display: false,
          },
          title: {
            display: false,
          },
          border: {
            display: false,
          },
        },
        y: {
          min: -10,
          max: 10,
          grid: {
            display: false,
          },
          ticks: {
            display: false,
          },
          title: {
            display: false,
          },
          border: {
            display: false,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
        },
      },
      elements: {
        point: {
          borderWidth: 2,
        },
      },
    },
  });

  // Bouncing text class for DVD screensaver effect
  class BouncingText {
    constructor(text, color, initialX, initialY, quadrant) {
      this.text = text;
      this.color = color;
      this.x = initialX;
      this.y = initialY;
      this.quadrant = quadrant;
      this.dx = (Math.random() * 2 + 1) * (Math.random() > 0.5 ? 1 : -1);
      this.dy = (Math.random() * 2 + 1) * (Math.random() > 0.5 ? 1 : -1);
      this.size = 16;
    }

    update(chartArea) {
      // Move the text
      this.x += this.dx;
      this.y += this.dy;

      // Define quadrant boundaries
      const centerX = chartArea.left + (chartArea.right - chartArea.left) / 2;
      const centerY = chartArea.top + (chartArea.bottom - chartArea.top) / 2;

      let leftBound, rightBound, topBound, bottomBound;

      switch (this.quadrant) {
        case 1: // Top-right
          leftBound = centerX;
          rightBound = chartArea.right - 40;
          topBound = chartArea.top + 20;
          bottomBound = centerY;
          break;
        case 2: // Top-left
          leftBound = chartArea.left + 20;
          rightBound = centerX;
          topBound = chartArea.top + 20;
          bottomBound = centerY;
          break;
        case 3: // Bottom-left
          leftBound = chartArea.left + 20;
          rightBound = centerX;
          topBound = centerY;
          bottomBound = chartArea.bottom - 20;
          break;
        case 4: // Bottom-right
          leftBound = centerX;
          rightBound = chartArea.right - 40;
          topBound = centerY;
          bottomBound = chartArea.bottom - 20;
          break;
      }

      // Bounce off boundaries
      if (this.x <= leftBound || this.x >= rightBound) {
        this.dx = -this.dx;
        this.x = Math.max(leftBound, Math.min(rightBound, this.x));
      }
      if (this.y <= topBound || this.y >= bottomBound) {
        this.dy = -this.dy;
        this.y = Math.max(topBound, Math.min(bottomBound, this.y));
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.fillStyle = this.color;
      ctx.font = `bold ${this.size}px "Comic Relief", system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.text, this.x, this.y);
      ctx.restore();
    }
  }

  // Create bouncing texts for each quadrant
  const bouncingTexts = [
    new BouncingText("AUTH", "rgba(255, 102, 204, 0.8)", 450, 100, 1), // Top-right (neon-pink)
    new BouncingText("LEFT", "rgba(153, 255, 0, 0.8)", 150, 100, 2), // Top-left (lime-green)
    new BouncingText("LIB", "rgba(0, 204, 255, 0.8)", 150, 400, 3), // Bottom-left (electric-blue)
    new BouncingText("RIGHT", "rgba(255, 255, 102, 0.8)", 450, 400, 4), // Bottom-right (sun-yellow)
  ];

  // Add straight axis lines and arrows manually
  function drawAxisLinesAndArrows() {
    const chartArea = politicalCompass.chartArea;
    const ctx = politicalCompass.ctx;

    ctx.save();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.8)"; // black
    ctx.lineWidth = 3;

    // Draw straight vertical line (y-axis)
    ctx.beginPath();
    ctx.moveTo(
      chartArea.left + (chartArea.right - chartArea.left) / 2,
      chartArea.top,
    );
    ctx.lineTo(
      chartArea.left + (chartArea.right - chartArea.left) / 2,
      chartArea.bottom,
    );
    ctx.stroke();

    // Draw straight horizontal line (x-axis)
    ctx.beginPath();
    ctx.moveTo(
      chartArea.left,
      chartArea.top + (chartArea.bottom - chartArea.top) / 2,
    );
    ctx.lineTo(
      chartArea.right,
      chartArea.top + (chartArea.bottom - chartArea.top) / 2,
    );
    ctx.stroke();

    // Draw arrows at axis ends
    ctx.strokeStyle = "rgba(0, 0, 0, 1)"; // black
    ctx.lineWidth = 3;

    // Calculate arrow size based on chart size for responsiveness
    const arrowSize = Math.min(10, (chartArea.right - chartArea.left) * 0.02);
    const arrowHeadSize = arrowSize * 0.5;

    // Left arrow (x-axis)
    ctx.beginPath();
    ctx.moveTo(
      chartArea.left + arrowSize,
      chartArea.top + (chartArea.bottom - chartArea.top) / 2,
    );
    ctx.lineTo(
      chartArea.left,
      chartArea.top + (chartArea.bottom - chartArea.top) / 2,
    );
    ctx.lineTo(
      chartArea.left + arrowHeadSize,
      chartArea.top + (chartArea.bottom - chartArea.top) / 2 - arrowHeadSize,
    );
    ctx.moveTo(
      chartArea.left,
      chartArea.top + (chartArea.bottom - chartArea.top) / 2,
    );
    ctx.lineTo(
      chartArea.left + arrowHeadSize,
      chartArea.top + (chartArea.bottom - chartArea.top) / 2 + arrowHeadSize,
    );
    ctx.stroke();

    // Right arrow (x-axis)
    ctx.beginPath();
    ctx.moveTo(
      chartArea.right - arrowSize,
      chartArea.top + (chartArea.bottom - chartArea.top) / 2,
    );
    ctx.lineTo(
      chartArea.right,
      chartArea.top + (chartArea.bottom - chartArea.top) / 2,
    );
    ctx.lineTo(
      chartArea.right - arrowHeadSize,
      chartArea.top + (chartArea.bottom - chartArea.top) / 2 - arrowHeadSize,
    );
    ctx.moveTo(
      chartArea.right,
      chartArea.top + (chartArea.bottom - chartArea.top) / 2,
    );
    ctx.lineTo(
      chartArea.right - arrowHeadSize,
      chartArea.top + (chartArea.bottom - chartArea.top) / 2 + arrowHeadSize,
    );
    ctx.stroke();

    // Top arrow (y-axis)
    ctx.beginPath();
    ctx.moveTo(
      chartArea.left + (chartArea.right - chartArea.left) / 2,
      chartArea.top + arrowSize,
    );
    ctx.lineTo(
      chartArea.left + (chartArea.right - chartArea.left) / 2,
      chartArea.top,
    );
    ctx.lineTo(
      chartArea.left + (chartArea.right - chartArea.left) / 2 - arrowHeadSize,
      chartArea.top + arrowHeadSize,
    );
    ctx.moveTo(
      chartArea.left + (chartArea.right - chartArea.left) / 2,
      chartArea.top,
    );
    ctx.lineTo(
      chartArea.left + (chartArea.right - chartArea.left) / 2 + arrowHeadSize,
      chartArea.top + arrowHeadSize,
    );
    ctx.stroke();

    // Bottom arrow (y-axis)
    ctx.beginPath();
    ctx.moveTo(
      chartArea.left + (chartArea.right - chartArea.left) / 2,
      chartArea.bottom - arrowSize,
    );
    ctx.lineTo(
      chartArea.left + (chartArea.right - chartArea.left) / 2,
      chartArea.bottom,
    );
    ctx.lineTo(
      chartArea.left + (chartArea.right - chartArea.left) / 2 - arrowHeadSize,
      chartArea.bottom - arrowHeadSize,
    );
    ctx.moveTo(
      chartArea.left + (chartArea.right - chartArea.left) / 2,
      chartArea.bottom,
    );
    ctx.lineTo(
      chartArea.left + (chartArea.right - chartArea.left) / 2 + arrowHeadSize,
      chartArea.bottom - arrowHeadSize,
    );
    ctx.stroke();

    ctx.restore();
  }

  // Draw bouncing texts
  function drawBouncingTexts() {
    const chartArea = politicalCompass.chartArea;
    const ctx = politicalCompass.ctx;

    bouncingTexts.forEach((text) => {
      text.update(chartArea);
      text.draw(ctx);
    });
  }

  // Single bouncing text like DVD logo
  const bouncingText = {
    text: "ANTISEMITISM",
    x: 0,
    y: 0,
    dx: 0.8, // Consistent speed and direction
    dy: 0.4, // Consistent speed and direction
    color: "rgba(255, 0, 0, 1)",
  };

  // Function to update bouncing text position
  function updateBouncingText() {
    const chartArea = politicalCompass.chartArea;
    const scaleX = politicalCompass.scales.x;
    const scaleY = politicalCompass.scales.y;

    // Update position
    bouncingText.x += bouncingText.dx * 0.11;
    bouncingText.y += bouncingText.dy * 0.11;

    // Bounce off edges (chart coordinate space: -10 to 10)
    if (bouncingText.x <= -9 || bouncingText.x >= 9) {
      bouncingText.dx *= -1;
      bouncingText.x = Math.max(-9, Math.min(9, bouncingText.x));
    }
    if (bouncingText.y <= -9 || bouncingText.y >= 9) {
      bouncingText.dy *= -1;
      bouncingText.y = Math.max(-9, Math.min(9, bouncingText.y));
    }
  }

  // Function to draw ideology labels
  function drawIdeologyLabels() {
    const chartArea = politicalCompass.chartArea;
    const ctx = politicalCompass.ctx;
    const scaleX = politicalCompass.scales.x;
    const scaleY = politicalCompass.scales.y;

    ctx.save();
    ctx.font = 'bold 18px "Comic Relief", system-ui';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Draw all ideology labels with black outlines
    wobblyIdeologies.forEach((ideology) => {
      const pixelX = scaleX.getPixelForValue(ideology.x);
      const pixelY = scaleY.getPixelForValue(ideology.y);

      // Check if label has line breaks
      const lines = ideology.label.split("\n");
      const lineHeight = 24;
      const startY = pixelY - ((lines.length - 1) * lineHeight) / 2;

      // Draw each line with black outline and colored text
      lines.forEach((line, index) => {
        const lineY = startY + index * lineHeight;

        // Draw black outline
        ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
        ctx.lineWidth = 3;
        ctx.strokeText(line, pixelX, lineY);

        // Draw colored text
        ctx.fillStyle = ideology.color;
        ctx.fillText(line, pixelX, lineY);
      });
    });

    ctx.restore();
  }

  // Function to draw bouncing text
  function drawBouncingText() {
    const chartArea = politicalCompass.chartArea;
    const ctx = politicalCompass.ctx;
    const scaleX = politicalCompass.scales.x;
    const scaleY = politicalCompass.scales.y;

    ctx.save();
    ctx.font = 'bold 20px "Comic Relief", system-ui';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Convert chart coordinates to pixel coordinates
    const pixelX = scaleX.getPixelForValue(bouncingText.x);
    const pixelY = scaleY.getPixelForValue(bouncingText.y);

    // Draw black outline for ANTISEMITISM
    ctx.strokeStyle = "rgba(0, 0, 0, 1)";
    ctx.lineWidth = 3;
    ctx.strokeText(bouncingText.text, pixelX, pixelY);

    // Create rainbow gradient for ANTISEMITISM
    const gradient = ctx.createLinearGradient(
      pixelX - 80,
      pixelY,
      pixelX + 80,
      pixelY,
    );
    gradient.addColorStop(0, "rgba(255, 0, 0, 1)"); // Red
    gradient.addColorStop(0.16, "rgba(255, 165, 0, 1)"); // Orange
    gradient.addColorStop(0.33, "rgba(255, 255, 0, 1)"); // Yellow
    gradient.addColorStop(0.5, "rgba(0, 128, 0, 1)"); // Green
    gradient.addColorStop(0.66, "rgba(0, 0, 255, 1)"); // Blue
    gradient.addColorStop(0.83, "rgba(75, 0, 130, 1)"); // Indigo
    gradient.addColorStop(1, "rgba(238, 130, 238, 1)"); // Violet

    // Draw rainbow ANTISEMITISM text
    ctx.fillStyle = gradient;
    ctx.fillText(bouncingText.text, pixelX, pixelY);

    ctx.restore();
  }

  // Override the draw method to add axis lines, arrows, ideology labels, and bouncing text
  const originalDraw = politicalCompass.draw;
  politicalCompass.draw = function () {
    originalDraw.call(this);
    drawAxisLinesAndArrows();
    drawIdeologyLabels();
    drawBouncingText();
  };

  // Animation loop for bouncing text
  function animate() {
    updateBouncingText();
    politicalCompass.update("none"); // Update without animation for performance
    requestAnimationFrame(animate);
  }

  politicalCompass.update();
  animate();
});
