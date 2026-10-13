
document.addEventListener("DOMContentLoaded", () => {
  initLanding();
  initStory();
  initCollection();
});

function goBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = "index.html";
  }
}

function initLanding() {
  const shape = document.querySelector("#landingShape");
  const polygon = document.querySelector("#landingPolygon");
  const link = document.querySelector("#shapeLink");
  const label = document.querySelector("#shapeLabel");

  if (!shape || !polygon || !link || !label) return;

  // Use many points for every shape so the circle is visually round,
  // while all shapes can still morph point-by-point without snapping.
  const POINT_COUNT = 40;

  function resampleClosedPolygon(vertices, count) {
    const segments = vertices.map((point, i) => {
      const next = vertices[(i + 1) % vertices.length];
      const dx = next[0] - point[0];
      const dy = next[1] - point[1];
      return { a: point, b: next, length: Math.hypot(dx, dy) };
    });

    const perimeter = segments.reduce((sum, seg) => sum + seg.length, 0);
    const step = perimeter / count;
    const points = [];

    for (let i = 0; i < count; i++) {
      let distance = i * step;
      let segIndex = 0;

      while (distance > segments[segIndex].length && segIndex < segments.length - 1) {
        distance -= segments[segIndex].length;
        segIndex++;
      }

      const seg = segments[segIndex];
      const t = seg.length === 0 ? 0 : distance / seg.length;
      points.push([
        seg.a[0] + (seg.b[0] - seg.a[0]) * t,
        seg.a[1] + (seg.b[1] - seg.a[1]) * t
      ]);
    }

    return points;
  }

  function circlePoints(count, cx = 50, cy = 50, radius = 45) {
    return Array.from({ length: count }, (_, i) => {
      const angle = -Math.PI / 2 + (i / count) * Math.PI * 2;
      return [
        cx + Math.cos(angle) * radius,
        cy + Math.sin(angle) * radius
      ];
    });
  }

  function nearestPointIndices(points, corners) {
    return corners.map(([cx, cy]) => {
      let bestIndex = 0;
      let bestDistance = Infinity;

      points.forEach(([x, y], i) => {
        const d = Math.hypot(x - cx, y - cy);
        if (d < bestDistance) {
          bestDistance = d;
          bestIndex = i;
        }
      });

      return bestIndex;
    });
  }

  const triangleVertices = [[50,5],[95,95],[5,95]];
  const squareVertices = [[50,5],[95,5],[95,95],[5,95],[5,5]];
  const hexVertices = [[50,5],[75,5],[95,50],[75,95],[25,95],[5,50],[25,5]];

  const triangle = resampleClosedPolygon(triangleVertices, POINT_COUNT);
  const square = resampleClosedPolygon(squareVertices, POINT_COUNT);
  const circle = circlePoints(POINT_COUNT);
  const hexagon = resampleClosedPolygon(hexVertices, POINT_COUNT);

  const pages = [
    {
      label: "FORM RECEIVED",
      href: "received.html",
      points: triangle,
      corners: nearestPointIndices(triangle, triangleVertices)
    },
    {
      label: "FORM DESTROYED",
      href: "destroyed.html",
      points: square,
      corners: nearestPointIndices(square, [[95,5],[95,95],[5,95],[5,5]])
    },
    {
      label: "FORM GIVEN AGAIN",
      href: "given-again.html",
      points: circle,
      // A circle has no corners, so every point moves together smoothly.
      corners: Array.from({ length: POINT_COUNT }, (_, i) => i)
    },
    {
      label: "COLLECTION",
      href: "collection.html",
      points: hexagon,
      corners: nearestPointIndices(hexagon, [[75,5],[95,50],[75,95],[25,95],[5,50],[25,5]])
    }
  ];

  const morphDuration = 620;
  const holdDuration = 190;
  const cornerLead = 90;

  let index = 0;
  let currentPoints = pages[0].points.map(([x, y]) => [x, y]);
  let timeoutId = null;
  let frameId = null;
  let paused = false;
  let morphing = false;

  function pointsToString(points) {
    return points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  }

  function easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function renderMeta(item) {
    label.textContent = item.label;
    link.href = item.href;
    link.setAttribute("aria-label", `Open ${item.label}`);
  }

  function morphTo(targetIndex) {
    if (morphing) return;
    morphing = true;

    const from = currentPoints.map(([x, y]) => [x, y]);
    const target = pages[targetIndex];
    const to = target.points;
    const cornerSet = new Set(target.corners);
    const startTime = performance.now();

    renderMeta(target);

    function frame(now) {
      const elapsed = now - startTime;

      const nextPoints = from.map(([sx, sy], pointIndex) => {
        const delay = cornerSet.has(pointIndex) ? 0 : cornerLead;
        const localT = Math.max(0, Math.min(1, (elapsed - delay) / (morphDuration - delay)));
        const eased = easeInOutCubic(localT);
        const [tx, ty] = to[pointIndex];

        return [
          sx + (tx - sx) * eased,
          sy + (ty - sy) * eased
        ];
      });

      polygon.setAttribute("points", pointsToString(nextPoints));

      if (elapsed < morphDuration) {
        frameId = requestAnimationFrame(frame);
      } else {
        currentPoints = to.map(([x, y]) => [x, y]);
        polygon.setAttribute("points", pointsToString(currentPoints));
        index = targetIndex;
        morphing = false;
        scheduleNext();
      }
    }

    cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(frame);
  }

  function scheduleNext(delay = holdDuration) {
    clearTimeout(timeoutId);
    if (paused || morphing) return;

    timeoutId = window.setTimeout(() => {
      morphTo((index + 1) % pages.length);
    }, delay);
  }

  link.addEventListener("mouseenter", () => {
    paused = true;
    clearTimeout(timeoutId);
  });

  link.addEventListener("mouseleave", () => {
    paused = false;
    scheduleNext();
  });

  polygon.setAttribute("points", pointsToString(currentPoints));
  renderMeta(pages[0]);
  scheduleNext(900);
}


function createTextInterlude(className, text, ariaLabel) {
  const section = document.createElement("section");
  section.className = `story-text-interlude ${className}`;
  section.setAttribute("aria-label", ariaLabel);

  const paragraph = document.createElement("p");
  paragraph.className = "story-static-text";
  paragraph.textContent = text;

  section.appendChild(paragraph);
  return section;
}

function createGivenTextInterlude() {
  const text = `A button or handle begins as an instruction. Its shape and position tell the body where to press, grip, pull, or push. Repeated use turns that instruction into a visible trace. Paint disappears from the center. Metal becomes brighter where hands return. Areas outside the usual path remain comparatively unchanged.

The object initially organizes the movement of the body. Over time, the relationship reverses. The accumulated movement of many bodies begins to reorganize the surface of the object. Use becomes a second design process.`;

  return createTextInterlude(
    "given-text-interlude",
    text,
    "Form Given Again text interlude"
  );
}

function createDestroyedTextInterlude() {
  const text = `Destruction rarely happens in a single moment. It begins at the surface, where paint lifts, bark separates, and protective layers lose their grip. Weather, friction, moisture, and time enter through these openings and continue the process. The object is no longer shaped only by the intention that produced it. Other forces begin to participate in its form.

In The Ruin, Georg Simmel describes decay as the moment when a human construction is overtaken by forces beyond its original design. The earlier form is damaged, but form itself does not disappear. Every missing layer produces another edge. Every exposed interior becomes a new surface. What has broken away remains visible through the outline it leaves behind.

These objects do not exist between form and formlessness. They have already entered another form, one produced through separation, exposure, and loss. Destruction is not the absence of form. It is the condition through which another form becomes visible.`;

  return createTextInterlude(
    "destroyed-text-interlude",
    text,
    "Form Destroyed text interlude"
  );
}

function createDestroyedRuinInterlude() {
  const text = `[THE RUIN] Georg Simmel

Weathering is not a single act of destruction. It is a slow exchange between material and environment. Water enters cracks. Oxygen reacts with exposed metal. Heat and cold expand and contract the surface. Paint lifts, rust spreads, wood softens, and layers that were meant to protect the object begin to separate from it.

The resulting surface is neither entirely designed nor entirely accidental. It contains the intention of the original construction and the effects of everything that followed. Stains reveal the path of water. Rust marks the reach of air and moisture. Cracks record repeated changes in temperature, pressure, and use.

Weathering makes time visible. The city does not simply become older. It develops new textures, boundaries, and colors through continuous contact with its surroundings. What appears to be damage is also an active record of relation.`;

  return createTextInterlude(
    "destroyed-ruin-interlude",
    text,
    "The Ruin by Georg Simmel interlude"
  );
}

function createReceivedTextInterlude() {
  const text = `The Body Rewrites The Object

A button or handle begins as an instruction. Its shape and position tell the body where to press, grip, pull, or push. Repeated use turns that instruction into a visible trace. Paint disappears from the center. Metal becomes brighter where hands return. Areas outside the usual path remain comparatively unchanged.

The object initially organizes the movement of the body. Over time, the relationship reverses. The accumulated movement of many bodies begins to reorganize the surface of the object. Use becomes a second design process.`;

  return createTextInterlude(
    "received-text-interlude",
    text,
    "Form Received text interlude"
  );
}

function initStory() {
  const body = document.body;
  if (!body.classList.contains("story-page")) return;

  const theme = body.dataset.theme;
  const stage = document.querySelector("#storyStage");
  const overlay = document.querySelector("#textOverlay");
  const overlayClose = document.querySelector("#overlayClose");
  const kicker = document.querySelector("#overlayKicker");
  const title = document.querySelector("#overlayTitle");
  const bodyText = document.querySelector("#overlayBody");

  if (!stage || !overlay || !overlayClose) return;

  const data = (typeof STORY_DATA !== "undefined" && STORY_DATA[theme]) ? STORY_DATA[theme] : [];
  if (!data.length) return;

  function openOverlay(item) {
    if (kicker) kicker.textContent = item.kicker || "";
    if (title) title.textContent = (item.title || "").toUpperCase();
    if (bodyText) bodyText.textContent = item.body || "";
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
  }

  function closeOverlay() {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
  }

  overlayClose.addEventListener("click", closeOverlay);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeOverlay();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeOverlay();
  });

  data.forEach((item, index) => {
    const storyItem = document.createElement("article");
    storyItem.className = "story-scroll-item";
    storyItem.id = `story-item-${index}`;
    storyItem.dataset.item = String(index);

    const imageButton = document.createElement("button");
    imageButton.className = "image-button";
    imageButton.type = "button";
    imageButton.setAttribute("aria-label", `Read text for ${item.title || `image ${index + 1}`}`);

    const media = document.createElement("div");
    media.className = `story-media effect-${theme === "given" ? "given" : theme}`;

    const image = document.createElement("img");
    image.src = item.src;
    image.alt = item.alt || "";
    image.decoding = "async";
    if (index > 0) image.loading = "lazy";

    media.appendChild(image);

    if (theme === "received") {
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("class", "filter-defs");
      svg.setAttribute("width", "0");
      svg.setAttribute("height", "0");
      svg.setAttribute("aria-hidden", "true");

      const filter = document.createElementNS(svgNS, "filter");
      const filterId = `receivedDistort-${index}`;
      filter.setAttribute("id", filterId);
      filter.setAttribute("x", "-20%");
      filter.setAttribute("y", "-20%");
      filter.setAttribute("width", "140%");
      filter.setAttribute("height", "140%");

      const turbulence = document.createElementNS(svgNS, "feTurbulence");
      turbulence.setAttribute("type", "fractalNoise");
      turbulence.setAttribute("baseFrequency", "0.008 0.03");
      turbulence.setAttribute("numOctaves", "1");
      turbulence.setAttribute("seed", String(7 + index));
      turbulence.setAttribute("result", "noise");

      const displacement = document.createElementNS(svgNS, "feDisplacementMap");
      displacement.setAttribute("in", "SourceGraphic");
      displacement.setAttribute("in2", "noise");
      displacement.setAttribute("scale", "0");
      displacement.setAttribute("xChannelSelector", "R");
      displacement.setAttribute("yChannelSelector", "G");

      filter.appendChild(turbulence);
      filter.appendChild(displacement);
      svg.appendChild(filter);
      media.appendChild(svg);

      image.style.filter = `url(#${filterId})`;
      setupReceived(media, displacement);
    }

    if (theme === "destroyed") {
      const slices = document.createElement("div");
      slices.className = "destroy-slices";
      slices.setAttribute("aria-hidden", "true");
      media.appendChild(slices);
      setupDestroyed(media, image, slices);
    }

    if (theme === "given") {
      const renewalLayer = document.createElement("div");
      renewalLayer.className = "renewal-layer";
      renewalLayer.setAttribute("aria-hidden", "true");

      const renewalRing = document.createElement("div");
      renewalRing.className = "renewal-ring";
      renewalRing.setAttribute("aria-hidden", "true");

      media.appendChild(renewalLayer);
      media.appendChild(renewalRing);
      setupGiven(media, image, renewalLayer);
    }

    imageButton.appendChild(media);
    imageButton.addEventListener("click", () => openOverlay(item));

    storyItem.appendChild(imageButton);
    stage.appendChild(storyItem);

    if (theme === "given" && index === 2) {
      stage.appendChild(createGivenTextInterlude());
    }

    if (theme === "destroyed" && index === 4) {
      stage.appendChild(createDestroyedTextInterlude());
    }

    if (theme === "destroyed" && index === 11) {
      stage.appendChild(createDestroyedRuinInterlude());
    }

    if (theme === "received" && index === 5) {
      stage.appendChild(createReceivedTextInterlude());
    }
  });

  const params = new URLSearchParams(window.location.search);
  const requestedIndex = Number.parseInt(params.get("item"), 10);

  if (
    Number.isFinite(requestedIndex) &&
    requestedIndex >= 0 &&
    requestedIndex < data.length
  ) {
    requestAnimationFrame(() => {
      const target = document.querySelector(`#story-item-${requestedIndex}`);
      if (target) target.scrollIntoView({ block: "center", behavior: "auto" });
    });
  }

  const items = [...stage.querySelectorAll(".story-scroll-item")];

  if ("IntersectionObserver" in window && items.length > 1) {
    const observer = new IntersectionObserver((entries) => {
      const mostVisible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!mostVisible) return;

      const itemIndex = Number(mostVisible.target.dataset.item);
      const url = new URL(window.location.href);
      url.searchParams.set("item", String(itemIndex));
      window.history.replaceState(null, "", `${url.pathname}?${url.searchParams.toString()}`);
    }, {
      threshold: [0.45, 0.6, 0.75]
    });

    items.forEach((item) => observer.observe(item));
  }
}

function setupReceived(media, displacement) {
  media.addEventListener("pointermove", (event) => {
    const rect = media.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    const nx = (x - 0.5) * 2;
    const ny = (y - 0.5) * 2;

    media.style.setProperty("--mx", nx.toFixed(3));
    media.style.setProperty("--my", ny.toFixed(3));

    if (displacement) {
      const distance = Math.sqrt(nx * nx + ny * ny);
      const scale = 18 + (1 - Math.min(distance, 1)) * 26;
      displacement.setAttribute("scale", scale.toFixed(1));
    }
  });

  media.addEventListener("pointerleave", () => {
    media.style.setProperty("--mx", 0);
    media.style.setProperty("--my", 0);
    if (displacement) displacement.setAttribute("scale", "8");
  });
}

function setupDestroyed(media, image, slices) {
  if (!slices || !image) return;

  const src = image.getAttribute("src");
  const count = 11;

  slices.innerHTML = "";

  for (let i = 0; i < count; i++) {
    const slice = document.createElement("div");
    slice.className = "destroy-slice";

    const top = (i / count) * 100;
    const bottom = 100 - ((i + 1) / count) * 100;

    slice.style.setProperty("--slice-image", `url("${src}")`);
    slice.style.setProperty("--top", `${top}%`);
    slice.style.setProperty("--bottom", `${bottom}%`);
    slice.style.setProperty("--shift", "0px");

    slices.appendChild(slice);
  }

  const sliceEls = [...slices.querySelectorAll(".destroy-slice")];

  media.addEventListener("pointermove", (event) => {
    const rect = media.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const nx = (x - 0.5) * 2;

    sliceEls.forEach((slice, i) => {
      const center = (i + 0.5) / count;
      const distance = Math.abs(center - y);
      const influence = Math.max(0, 1 - distance * 4.2);
      const direction = i % 2 === 0 ? 1 : -1;
      const amount = nx * 70 * influence * direction;

      slice.style.setProperty("--shift", `${amount}px`);
      slice.style.opacity = `${0.2 + influence * 0.8}`;
    });
  });

  media.addEventListener("pointerleave", () => {
    sliceEls.forEach((slice) => {
      slice.style.setProperty("--shift", "0px");
      slice.style.opacity = "0.55";
    });
  });
}

function setupGiven(media, image, renewalLayer) {
  if (!renewalLayer || !image) return;

  const src = image.getAttribute("src");
  renewalLayer.style.setProperty("--renew-image", `url("${src}")`);

  media.style.setProperty("--repair-x", "50%");
  media.style.setProperty("--repair-y", "50%");
  media.style.setProperty("--repair-size", "0px");
  media.classList.remove("is-renewing");

  media.addEventListener("pointerenter", () => {
    media.classList.add("is-renewing");
    media.style.setProperty("--repair-size", "86px");
  });

  media.addEventListener("pointermove", (event) => {
    const rect = media.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));

    media.style.setProperty("--repair-x", `${x.toFixed(2)}%`);
    media.style.setProperty("--repair-y", `${y.toFixed(2)}%`);
    media.style.setProperty("--repair-size", "86px");
  });

  media.addEventListener("pointerleave", () => {
    media.classList.remove("is-renewing");
    media.style.setProperty("--repair-size", "0px");
  });
}

function getFlatStoryItems() {
  if (typeof STORY_DATA === "undefined") return [];

  const order = [
    { key: "received", symbol: "△", page: "received.html" },
    { key: "destroyed", symbol: "□", page: "destroyed.html" },
    { key: "given", symbol: "○", page: "given-again.html" }
  ];

  let runningIndex = 0;

  return order.flatMap((section) => {
    const items = STORY_DATA[section.key] || [];
    return items.map((item, localIndex) => ({
      ...item,
      theme: section.key,
      symbol: section.symbol,
      page: section.page,
      localIndex,
      globalIndex: ++runningIndex
    }));
  });
}

function initCollection() {
  const body = document.body;
  if (!body.classList.contains("collection-page")) return;

  const grid = document.querySelector("#collectionGrid");
  const buttons = [...document.querySelectorAll(".filter-button")];
  if (!grid || !buttons.length) return;

  const allItems = getFlatStoryItems();
  let activeFilter = "all";

  function render() {
    const visibleItems = activeFilter === "all"
      ? allItems
      : allItems.filter((item) => item.theme === activeFilter);

    grid.innerHTML = visibleItems.map((item) => {
      const label = item.collectionLabel || item.title || item.kicker || "UNTITLED";
      return `
        <a class="collection-item" href="${item.page}?item=${item.localIndex}">
          <img src="${item.src}" alt="${item.alt || ""}" />
          <span>${item.symbol} ${String(item.globalIndex).padStart(3, "0")} / ${label.toUpperCase()}</span>
        </a>
      `;
    }).join("");
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter || "all";
      buttons.forEach((btn) => btn.classList.toggle("active", btn === button));
      render();
    });
  });

  render();
}


/* Smooth reveal for the closing Ruin text on FORM RECEIVED */
function initRuinReveal() {
  const section = document.querySelector(".ruin-quote-section");
  if (!section) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          section.classList.add("is-visible");
          observer.disconnect();
        }
      });
    },
    { threshold: 0.16 }
  );

  observer.observe(section);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initRuinReveal);
} else {
  initRuinReveal();
}
