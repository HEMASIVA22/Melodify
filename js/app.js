/* app.js — Bootstrap, navigation, home rendering */

/* ---------- Toast ---------- */
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.add("hidden"), 2200);
}
window.toast = toast;

/* ---------- View switcher ---------- */
function switchView(view) {
  document
    .querySelectorAll(".view")
    .forEach((v) => v.classList.remove("active"));
  const el = document.getElementById("view-" + view);
  if (el) el.classList.add("active");
  document
    .querySelectorAll(".side-link, .bn-item")
    .forEach((x) => x.classList.toggle("active", x.dataset.view === view));
  document
    .querySelectorAll("[data-music-section]")
    .forEach((x) => x.classList.remove("active"));
  document.getElementById("main").scrollTo?.({ top: 0, behavior: "smooth" });
  window.scrollTo({ top: 0, behavior: "smooth" });
  // Lazy renders
  if (view === "library") Library.render();
}
window.switchView = switchView;

/* ---------- Screen navigation ---------- */
function showScreen(id) {
  ["splash", "auth", "onb1", "onb2", "onb3"].forEach((s) =>
    document.getElementById(s).classList.add("hidden"),
  );
  const el = document.getElementById(id);
  if (el) el.classList.remove("hidden");
  document.getElementById("app").classList.add("hidden");
}
function enterApp() {
  ["splash", "auth", "onb1", "onb2", "onb3"].forEach((s) =>
    document.getElementById(s).classList.add("hidden"),
  );
  document.getElementById("app").classList.remove("hidden");
  renderHome();
  updateGreeting();
  updateAvatar();
  RecentlyPlayed.render();
  animateStats();
}

/* ---------- Greeting + avatar ---------- */
function updateGreeting() {
  document.getElementById("greeting").textContent = getGreeting();
}
function updateAvatar() {
  const user = MelodifyStorage.get("user", { email: "guest@melodify" });
  const initial = (user.email || "M")[0].toUpperCase();
  document.getElementById("avatarInitials").textContent = initial;
}

/* ---------- Home rails + Made For You ---------- */
async function renderHome() {
  const [songs, playlists] = await Promise.all([
    DeezerAPI.getTrendingSongs(),
    DeezerAPI.getPlaylists(),
  ]);
  // Made For You
  const mfy = document.getElementById("madeForYou");
  mfy.innerHTML = "";
  playlists.slice(0, 6).forEach((p) => {
    const c = document.createElement("div");
    c.className = "mfy-card";
    c.innerHTML = `
      <img src="${p.cover}" alt=""/>
      <button class="play-fab" aria-label="Play">▶</button>
      <h3>${p.title}</h3>
      <p>${p.desc}</p>`;
    c.addEventListener("mousemove", (e) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty("--x", `${e.clientX - r.left}px`);
      c.style.setProperty("--y", `${e.clientY - r.top}px`);
    });
    c.querySelector(".play-fab").addEventListener("click", (e) => {
      e.stopPropagation();
      Player.setQueue(songs);
      toast(`Now playing ${p.title}`);
    });
    c.addEventListener("click", () => {
      Player.setQueue(songs);
      toast(`Now playing ${p.title}`);
    });
    mfy.appendChild(c);
  });

  const rails = {
    "rail-stations": playlists,
    "rail-today": [...playlists].reverse(),
    "rail-albums": playlists.slice(2),
    "rail-singles": songs,
    "rail-radio": playlists,
    "rail-editor": [...playlists].sort(() => 0.5 - Math.random()),
  };
  Object.entries(rails).forEach(([id, items]) => {
    const rail = document.getElementById(id);
    rail.innerHTML = "";
    items.forEach((it) => {
      const card = document.createElement("div");
      card.className = "rail-card hover-scale";
      card.innerHTML = `<img src="${it.cover}" alt=""/><h4>${it.title}</h4><p>${it.desc || it.artist || ""}</p>`;
      card.addEventListener("click", () => {
        if (it.src) Player.setQueue([it]);
        else Player.setQueue(songs);
        toast(`Now playing ${it.title}`);
      });
      rail.appendChild(card);
    });
  });
}

/* ---------- Animated stats counters ---------- */
function animateStats() {
  const played = MelodifyStorage.get("songsPlayed", 0);
  const mins = MelodifyStorage.get("minutesListened", 0);
  const fav =
    MelodifyStorage.get("playlists", [])[0]?.title ||
    MelodifyStorage.get("recent", [])[0]?.title ||
    "Made For You";
  countTo(document.getElementById("statSongs"), played);
  countTo(document.getElementById("statMins"), mins);
  document.getElementById("statFav").textContent = fav;
}
function countTo(el, target) {
  const start = 0;
  const dur = 900;
  const t0 = performance.now();
  function step(now) {
    const p = Math.min(1, (now - t0) / dur);
    el.textContent = Math.floor(
      start + (target - start) * (0.5 - Math.cos(p * Math.PI) / 2),
    );
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ---------- Bootstrap flow with Clerk ---------- */
/* ---------- Bootstrap flow with Clerk ---------- */
async function initClerkAndCheckSession() {
  if (!window.Clerk) {
    // Wait for the Clerk SDK script to finish loading asynchronously
    await new Promise((resolve) => {
      const check = setInterval(() => {
        if (window.Clerk) {
          clearInterval(check);
          resolve();
        }
      }, 50);
    });
  }

  try {
    await window.Clerk.load();
  } catch (err) {
    console.error("Clerk failed to load: ", err);
    toast("Authentication server is currently unavailable. Using guest session.");
    MelodifyStorage.set("user", { email: "guest@melodify", guest: true });
    checkOnboardingAndRedirect();
    return;
  }

  // Check if this is a page reload (refresh)
  const navs = performance.getEntriesByType("navigation");
  const isReload = navs.length > 0 && navs[0].type === "reload";
  if (isReload) {
    MelodifyStorage.clear();
    if (window.Clerk.user) {
      await window.Clerk.signOut();
    }
    window.location.replace("index.html");
    return;
  }

  // Handle active session state change listener
  window.Clerk.addListener(({ user }) => {
    if (user) {
      const email = user.primaryEmailAddress?.emailAddress || "user@melodify";
      MelodifyStorage.set("user", { email });
      // Reset onboarding selections on sign in to ensure questions are always asked
      MelodifyStorage.set("languages", []);
      MelodifyStorage.set("artists", []);
      MelodifyStorage.set("moods", []);
      checkOnboardingAndRedirect();
    } else {
      MelodifyStorage.set("user", null);
      MelodifyStorage.set("languages", []);
      MelodifyStorage.set("artists", []);
      MelodifyStorage.set("moods", []);
      showScreen("auth");
      mountClerkSignIn();
    }
  });

  // Check initial state
  const clerkUser = window.Clerk.user;
  if (clerkUser) {
    const email = clerkUser.primaryEmailAddress?.emailAddress || "user@melodify";
    MelodifyStorage.set("user", { email });
    checkOnboardingAndRedirect();
  } else {
    MelodifyStorage.set("user", null);
    MelodifyStorage.set("languages", []);
    MelodifyStorage.set("artists", []);
    MelodifyStorage.set("moods", []);
    showScreen("auth");
    mountClerkSignIn();
  }
}

function mountClerkSignIn() {
  const container = document.getElementById("clerk-signin-container");
  if (!container) return;
  container.innerHTML = ""; // Clear loader if any
  window.Clerk.mountSignIn(container, {
    appearance: {
      layout: {
        socialButtonsVariant: 'blockButton',
        socialButtonsPlacement: 'top'
      },
      elements: {
        socialButtonsBlockButton: {
          color: '#ffffff',
          borderColor: 'rgba(255, 255, 255, 0.15)',
          backgroundColor: 'rgba(255, 255, 255, 0.05)'
        },
        socialButtonsBlockButtonText: {
          color: '#ffffff',
          fontWeight: '500'
        }
      },
      variables: {
        colorPrimary: "#1db954",
        colorBackground: "#181818",
        colorInputBackground: "#242424",
        colorText: "#ffffff",
        colorInputText: "#ffffff",
        colorTextSecondary: "#b3b3b3"
      }
    }
  });
}

function checkOnboardingAndRedirect() {
  const langs = MelodifyStorage.get("languages", []);
  const artists = MelodifyStorage.get("artists", []);
  const moods = MelodifyStorage.get("moods", []);

  if (!langs.length) {
    showScreen("onb1");
    renderLanguageChips();
  } else if (artists.length < 3) {
    showScreen("onb2");
    renderArtists();
  } else if (!moods.length) {
    showScreen("onb3");
    renderMoodChips();
  } else {
    enterApp();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  Player.init();
  Search.init();
  Library.init();
  Premium.init();

  // Splash → next screen after 2s
  setTimeout(() => {
    initClerkAndCheckSession();
  }, 2000);

  /* Onboarding continues */
  document.getElementById("lang-continue").addEventListener("click", () => {
    if (!MelodifyStorage.get("languages", []).length)
      return toast("Pick at least one language");
    showScreen("onb2");
    renderArtists();
  });
  document.getElementById("artist-done").addEventListener("click", () => {
    if (MelodifyStorage.get("artists", []).length < 3) return;
    showScreen("onb3");
    renderMoodChips();
  });
  document.getElementById("mood-continue").addEventListener("click", () => {
    if (!MelodifyStorage.get("moods", []).length)
      return toast("Pick at least one vibe");
    enterApp();
    toast("Your Melodify is ready ✨");
  });

  /* Nav */
  document
    .querySelectorAll(".side-link, .bn-item")
    .forEach((el) => {
      if (el.dataset.view) {
        el.addEventListener("click", () => switchView(el.dataset.view));
      }
    });

  /* Sidebar Music Sections */
  document.querySelectorAll("[data-music-section]").forEach((el) => {
    el.addEventListener("click", () => {
      const section = el.dataset.musicSection;
      if (section === "tamil") {
        switchView("search");
        document.getElementById("searchInput").value = "Tamil";
        Search._run("Tamil");
      } else if (section === "podcasts") {
        switchView("search");
        document.getElementById("searchInput").value = "Podcasts";
        Search._run("Podcasts");
      } else if (section === "trending") {
        switchView("home");
      } else if (section === "liked") {
        switchView("library");
        Library.tab = "Liked";
        Library.render();
        document.querySelectorAll(".lib-tabs .chip").forEach((c) => {
          c.classList.toggle("active", c.dataset.lib === "Liked");
        });
      }
      // Highlight active state
      document.querySelectorAll(".side-link").forEach((x) => x.classList.remove("active"));
      el.classList.add("active");
    });
  });

  /* Profile & Notifications dropdowns */
  const menu = document.getElementById("profileMenu");
  const notiMenu = document.getElementById("notiMenu");

  document.getElementById("profileBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.toggle("hidden");
    notiMenu.classList.add("hidden");
  });

  document.getElementById("notiBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    notiMenu.classList.toggle("hidden");
    menu.classList.add("hidden");
  });

  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && e.target.id !== "profileBtn") {
      menu.classList.add("hidden");
    }
    if (!notiMenu.contains(e.target) && e.target.id !== "notiBtn") {
      notiMenu.classList.add("hidden");
    }
  });

  menu.querySelectorAll("button").forEach((b) =>
    b.addEventListener("click", () => {
      menu.classList.add("hidden");
      const k = b.dataset.menu;
      if (k === "logout") {
        MelodifyStorage.clear();
        if (window.Clerk) {
          window.Clerk.signOut().then(() => {
            location.reload();
          });
        } else {
          location.reload();
        }
      } else if (k === "premium") switchView("premium");
      else if (k === "settings") toast("Settings coming soon");
      else if (k === "account")
        toast(
          `Signed in as ${MelodifyStorage.get("user", { email: "guest" }).email}`,
        );
      else if (k === "activity") switchView("home");
      else if (k === "updates") toast("You're on the latest version");
    }),
  );

  /* Hero CTAs */
  document
    .getElementById("startListening")
    .addEventListener("click", async () => {
      const songs = await DeezerAPI.getTrendingSongs();
      Player.setQueue(songs);
    });
  document
    .getElementById("exploreMusic")
    .addEventListener("click", () => switchView("search"));

  /* Create */
  document.querySelectorAll("[data-create]").forEach((c) =>
    c.addEventListener("click", () => {
      document.getElementById("playlistForm").classList.remove("hidden");
      const kind = c.dataset.create;
      document.getElementById("plName").value =
        kind === "collab"
          ? "Our Shared Playlist"
          : kind === "mood"
            ? "Mood: " +
              (MelodifyStorage.get("languages", ["Chill"])[0] || "Chill")
            : "";
    }),
  );
  document.getElementById("playlistForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("plName").value.trim();
    if (!name) return;
    const desc = document.getElementById("plDesc").value.trim();
    const pls = MelodifyStorage.get("playlists", []);
    pls.unshift({
      id: "u-" + Date.now(),
      title: name,
      desc: desc || "Custom playlist",
      cover: `https://picsum.photos/seed/${encodeURIComponent(name)}/500/500`,
    });
    MelodifyStorage.set("playlists", pls);
    toast(`Playlist "${name}" created`);
    e.target.reset();
    e.target.classList.add("hidden");
    switchView("library");
    Library.tab = "Playlists";
    Library.render();
  });
});
