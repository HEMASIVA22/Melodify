/* library.js — Library view */
const Library = {
  tab: "Playlists",
  init() {
    this.list = document.getElementById("libList");
    document.querySelectorAll(".lib-tabs .chip").forEach((c) =>
      c.addEventListener("click", () => {
        document
          .querySelectorAll(".lib-tabs .chip")
          .forEach((x) => x.classList.remove("active"));
        c.classList.add("active");
        this.tab = c.dataset.lib;
        this.render();
      }),
    );
    document.querySelectorAll("[data-lib-add]").forEach((b) =>
      b.addEventListener("click", () => {
        toast(`${b.dataset.libAdd} saved to your library`);
        const key = "custom" + b.dataset.libAdd;
        const items = MelodifyStorage.get(key, []);
        items.push({
          id: Date.now().toString(),
          title: `New ${b.dataset.libAdd}`,
          sub: "Just added",
        });
        MelodifyStorage.set(key, items);
      }),
    );
    document
      .getElementById("libCreatePlaylist")
      .addEventListener("click", () => {
        switchView("create");
        document.getElementById("playlistForm").classList.remove("hidden");
      });
  },

  async render() {
    const el = this.list;
    el.innerHTML = "";
    if (this.tab === "Playlists") {
      const userPls = MelodifyStorage.get("playlists", []);
      const seed = await DeezerAPI.getPlaylists();
      const items = [...userPls, ...seed];
      items.forEach((p) =>
        el.appendChild(
          this._row(p.cover || null, p.title, p.desc || "Playlist"),
        ),
      );
    } else if (this.tab === "Artists") {
      const chosenIds = MelodifyStorage.get("artists", []);
      const all = await DeezerAPI.searchArtists("");
      all
        .filter((a) => chosenIds.includes(a.id))
        .forEach((a) => el.appendChild(this._row(a.img, a.name, "Artist")));
    } else if (this.tab === "Albums") {
      const albums = await DeezerAPI.getAlbums();
      albums
        .slice(0, 6)
        .forEach((a) => el.appendChild(this._row(a.cover, a.title, "Album")));
    } else if (this.tab === "Podcasts") {
      ["The Design Hour", "Melody Talks", "Code & Coffee"].forEach((t) =>
        el.appendChild(this._row(null, t, "Podcast")),
      );
    } else if (this.tab === "Liked") {
      const liked = MelodifyStorage.get("liked", []);
      if (!liked.length)
        el.innerHTML = `<p class="muted">Nothing liked yet.</p>`;
      liked.forEach((s) =>
        el.appendChild(this._row(s.cover, s.title, s.artist)),
      );
    }
  },
  _row(img, title, sub) {
    const div = document.createElement("div");
    div.className = "lib-item";
    const thumb = img
      ? `<img class="thumb" src="${img}" alt=""/>`
      : `<div class="thumb">${title[0] || "M"}</div>`;
    div.innerHTML = `${thumb}<div><h4>${title}</h4><div class="sub">${sub}</div></div>`;
    return div;
  },
};

window.Library = Library;
