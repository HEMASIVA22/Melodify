/* onboarding.js — Languages + Artists */
const LANGUAGES = [
  "Tamil",
  "English",
  "Malayalam",
  "Telugu",
  "Kannada",
  "Hindi",
  "Marathi",
  "Gujarati",
  "Punjabi",
  "Bengali",
  "Other",
];
const MORE_ARTIST_IDS = [
  "a11",
  "a12",
  "a13",
  "a14",
  "a15",
  "a16",
  "a17",
  "a18",
  "a19",
  "a20",
];

function renderLanguageChips() {
  const grid = document.getElementById("langChips");
  const selected = new Set(MelodifyStorage.get("languages", []));
  grid.innerHTML = "";
  LANGUAGES.forEach((lang) => {
    const b = document.createElement("button");
    b.className = "chip" + (selected.has(lang) ? " active" : "");
    b.textContent = lang;
    b.type = "button";
    b.addEventListener("click", () => {
      if (selected.has(lang)) selected.delete(lang);
      else selected.add(lang);
      MelodifyStorage.set("languages", [...selected]);
      b.classList.toggle("active");
    });
    grid.appendChild(b);
  });
}

async function renderArtists() {
  const grid = document.getElementById("artistGrid");
  const tabsEl = document.getElementById("artistTabs");
  const searchEl = document.getElementById("artistSearch");
  const doneBtn = document.getElementById("artist-done");
  const countEl = document.getElementById("artistCount");
  const all = await DeezerAPI.searchArtists("");
  const selected = new Set(MelodifyStorage.get("artists", []));
  let showMore = false;
  let activeTab = "For You";
  let query = "";

  function updateCount() {
    countEl.textContent = selected.size;
    doneBtn.disabled = selected.size < 3;
  }

  function filtered() {
    let base = all;
    if (activeTab === "Tamil") base = all.filter((a) => a.tag === "Tamil");
    else if (activeTab === "International")
      base = all.filter((a) => a.tag === "International");
    else {
      // "For You": first 10 unless showMore
      base = showMore ? all : all.slice(0, 10);
    }
    if (query) {
      const q = query.toLowerCase();
      base = base.filter((a) => a.name.toLowerCase().includes(q));
    }
    return base;
  }

  function paint() {
    grid.innerHTML = "";
    const list = filtered();
    list.forEach((a) => {
      const el = document.createElement("div");
      el.className = "artist-tile" + (selected.has(a.id) ? " selected" : "");
      el.innerHTML = `<img src="${a.img}" alt="${a.name}"/><div class="name">${a.name}</div>`;
      el.addEventListener("click", () => {
        if (selected.has(a.id)) selected.delete(a.id);
        else selected.add(a.id);
        MelodifyStorage.set("artists", [...selected]);
        el.classList.toggle("selected");
        updateCount();
      });
      grid.appendChild(el);
    });
    // Show more button (For You only)
    if (activeTab === "For You" && !showMore && !query) {
      const b = document.createElement("button");
      b.className = "artist-tile";
      b.style.display = "grid";
      b.style.placeItems = "center";
      b.innerHTML = `<div class="name">Show More →</div>`;
      b.addEventListener("click", () => {
        showMore = true;
        paint();
      });
      grid.appendChild(b);
    }
  }

  tabsEl.querySelectorAll(".tab").forEach((t) =>
    t.addEventListener("click", () => {
      tabsEl
        .querySelectorAll(".tab")
        .forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
      activeTab = t.dataset.tab;
      paint();
    }),
  );
  searchEl.addEventListener("input", (e) => {
    query = e.target.value;
    paint();
  });

  updateCount();
  paint();
}

window.renderLanguageChips = renderLanguageChips;
window.renderArtists = renderArtists;

const MOODS = [
  "Chill",
  "Workout",
  "Focus",
  "Party",
  "Romance",
  "Happy",
  "Sad",
  "Tamil Kuthu",
  "Melody",
  "Classical",
  "Rock",
  "Hip-Hop"
];

function renderMoodChips() {
  const grid = document.getElementById("moodChips");
  const selected = new Set(MelodifyStorage.get("moods", []));
  grid.innerHTML = "";
  MOODS.forEach((mood) => {
    const b = document.createElement("button");
    b.className = "chip" + (selected.has(mood) ? " active" : "");
    b.textContent = mood;
    b.type = "button";
    b.addEventListener("click", () => {
      if (selected.has(mood)) selected.delete(mood);
      else selected.add(mood);
      MelodifyStorage.set("moods", [...selected]);
      b.classList.toggle("active");
    });
    grid.appendChild(b);
  });
}

window.renderMoodChips = renderMoodChips;
