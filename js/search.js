/* search.js — Search view */
const CATEGORIES = [
  { name: "Music", color: "#1DB954" },
  { name: "Podcasts", color: "#8b5cf6" },
  { name: "Live Events", color: "#ef4444" },
  { name: "Tamil", color: "#f59e0b" },
  { name: "Malayalam", color: "#06b6d4" },
  { name: "English", color: "#3b82f6" },
  { name: "Trending", color: "#ec4899" },
  { name: "Pop", color: "#f97316" },
  { name: "Rock", color: "#dc2626" },
  { name: "Hip-Hop", color: "#a855f7" },
];

const Search = {
  filter: "All",

  init() {
    this.input = document.getElementById("searchInput");
    this.chips = document.getElementById("searchFilters");
    this.catGrid = document.getElementById("catGrid");
    this.results = document.getElementById("searchResults");
    this.resultsTitle = document.getElementById("searchResultsTitle");

    this._renderCategories();
    this.input.addEventListener("input", (e) => this._run(e.target.value));
    this.chips.querySelectorAll(".chip").forEach((c) =>
      c.addEventListener("click", () => {
        this.chips
          .querySelectorAll(".chip")
          .forEach((x) => x.classList.remove("active"));
        c.classList.add("active");
        this.filter = c.dataset.filter;
        this._run(this.input.value);
      }),
    );
  },

  _renderCategories() {
    this.catGrid.innerHTML = "";
    CATEGORIES.forEach((c) => {
      const el = document.createElement("div");
      el.className = "cat-card";
      el.style.background = `linear-gradient(135deg, ${c.color}, ${c.color}66)`;
      el.textContent = c.name;
      el.addEventListener("click", () => {
        this.input.value = c.name;
        this._run(c.name);
      });
      this.catGrid.appendChild(el);
    });
  },

  async _run(query) {
    if (!query || !query.trim()) {
      this.results.innerHTML = "";
      this.resultsTitle.style.display = "none";
      return;
    }
    this.resultsTitle.style.display = "block";
    const [songs, artists, playlists] = await Promise.all([
      DeezerAPI.searchSongs(query),
      DeezerAPI.searchArtists(query),
      DeezerAPI.getPlaylists(),
    ]);
    const q = query.toLowerCase();
    const pls = playlists.filter(
      (p) =>
        p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q),
    );
    this.results.innerHTML = "";
    songs.forEach((s) =>
      this.results.appendChild(
        this._item(s.cover, s.title, `Song · ${s.artist}`, () =>
          Player.setQueue([s]),
        ),
      ),
    );
    artists.forEach((a) =>
      this.results.appendChild(this._item(a.img, a.name, "Artist")),
    );
    pls.forEach((p) =>
      this.results.appendChild(
        this._item(p.cover, p.title, `Playlist · ${p.desc}`, async () => {
          const all = await DeezerAPI.getTrendingSongs();
          Player.setQueue(all);
        }),
      ),
    );
    if (!this.results.children.length) {
      this.results.innerHTML = `<p class="muted">No results for "${query}".</p>`;
    }
  },

  _item(img, title, sub, onClick) {
    const el = document.createElement("div");
    el.className = "result-item";
    el.innerHTML = `<img src="${img}" alt=""/><div><div class="r-title">${title}</div><div class="r-sub">${sub}</div></div>`;
    if (onClick) el.addEventListener("click", onClick);
    return el;
  },
};

window.Search = Search;
