/* Deezer API service layer (Live JSONP Integration with Local Fallbacks).
   Queries the live Deezer public API without CORS blocks using JSONP. */

function fetchDeezerJSONP(urlPath, params = {}) {
  return new Promise((resolve, reject) => {
    const callbackName = "deezer_callback_" + Math.floor(Math.random() * 1000000);
    window[callbackName] = (data) => {
      delete window[callbackName];
      document.body.removeChild(script);
      resolve(data);
    };

    const url = new URL("https://api.deezer.com" + urlPath);
    url.searchParams.set("output", "jsonp");
    url.searchParams.set("callback", callbackName);
    for (const [key, val] of Object.entries(params)) {
      url.searchParams.set(key, val);
    }

    const script = document.createElement("script");
    script.src = url.toString();
    script.onerror = () => {
      delete window[callbackName];
      document.body.removeChild(script);
      reject(new Error("JSONP request failed"));
    };
    document.body.appendChild(script);
  });
}

function getAbsoluteLocalPath(relativePath) {
  let base = window.location.href.split('?')[0].split('#')[0];
  if (!base.endsWith('/') && !base.toLowerCase().endsWith('.html') && !base.toLowerCase().endsWith('.htm')) {
    base += '/';
  } else {
    base = base.substring(0, base.lastIndexOf('/') + 1);
  }
  return new URL(relativePath, base).href;
}

async function _loadLocal(path) {
  const resolved = getAbsoluteLocalPath(path);
  const res = await fetch(resolved);
  if (!res.ok) throw new Error(`Failed loading ${resolved}`);
  return res.json();
}

const DeezerAPI = {
  async searchSongs(query) {
    const q = query && query.trim() ? query.trim() : "tamil";
    try {
      const res = await fetchDeezerJSONP("/search", { q });
      if (res && res.data && res.data.length > 0) {
        return res.data.map(track => ({
          id: "dz-" + track.id,
          title: track.title,
          artist: track.artist.name,
          cover: track.album.cover_medium || "https://picsum.photos/seed/placeholder/400/400",
          src: track.preview,
          duration: track.duration
        }));
      }
    } catch (e) {
      console.warn("Live Deezer API search failed, falling back to local search.", e);
    }
    
    // Fallback to local songs
    const songs = await _loadLocal("data/songs.json");
    if (!query) return songs;
    const lowerQ = query.toLowerCase();
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(lowerQ) || s.artist.toLowerCase().includes(lowerQ),
    );
  },

  async searchArtists(query) {
    const q = query && query.trim() ? query.trim() : "tamil";
    try {
      const res = await fetchDeezerJSONP("/search/artist", { q });
      if (res && res.data && res.data.length > 0) {
        return res.data.map(artist => ({
          id: "dz-art-" + artist.id,
          name: artist.name,
          tag: q.toLowerCase().includes("tamil") ? "Tamil" : "International",
          img: artist.picture_medium || "https://picsum.photos/seed/placeholder/300/300"
        }));
      }
    } catch (e) {
      console.warn("Live Deezer API searchArtists failed, falling back to local artists.", e);
    }

    // Fallback to local artists
    const artists = await _loadLocal("data/artists.json");
    if (!query) return artists;
    const lowerQ = query.toLowerCase();
    return artists.filter((a) => a.name.toLowerCase().includes(lowerQ));
  },

  async getTrendingSongs() {
    // Queries the live Deezer API for Tamil songs to display on the dashboard
    return this.searchSongs("tamil");
  },

  async getAlbums() {
    return this.getPlaylists();
  },

  async getPlaylists() {
    try {
      const res = await fetchDeezerJSONP("/search/playlist", { q: "tamil" });
      if (res && res.data && res.data.length > 0) {
        return res.data.slice(0, 10).map(pl => ({
          id: "dz-pl-" + pl.id,
          title: pl.title,
          desc: "Playlist · By " + (pl.user?.name || "Deezer"),
          cover: pl.picture_medium || "https://picsum.photos/seed/placeholder/500/500"
        }));
      }
    } catch (e) {
      console.warn("Live Deezer API playlists failed, falling back to local playlists.", e);
    }
    return _loadLocal("data/playlists.json");
  },
};

window.DeezerAPI = DeezerAPI;
