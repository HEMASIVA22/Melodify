/* recently-played.js — history tracker */
const RecentlyPlayed = {
  add(song) {
    MelodifyStorage.push(
      "recent",
      {
        id: song.id,
        title: song.title,
        artist: song.artist,
        cover: song.cover,
        src: song.src,
        duration: song.duration,
      },
      12,
    );
    this.render();
  },
  render() {
    const rail = document.getElementById("rail-recent");
    if (!rail) return;
    const items = MelodifyStorage.get("recent", []);
    if (!items.length) {
      rail.innerHTML = `<p class="muted small pad">Nothing yet — press play to start your history.</p>`;
      return;
    }
    rail.innerHTML = "";
    items.forEach((s) => {
      const card = document.createElement("div");
      card.className = "rail-card hover-scale";
      card.innerHTML = `<img src="${s.cover}" alt=""/><h4>${s.title}</h4><p>${s.artist}</p>`;
      card.addEventListener("click", () => Player.setQueue([s]));
      rail.appendChild(card);
    });
  },
};
window.RecentlyPlayed = RecentlyPlayed;
