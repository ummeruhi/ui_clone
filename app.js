(() => {
  const DATA = window.SPOTIFY_DATA;
  if (!DATA) return;

  // ---------- helpers ----------
  const $ = (q, root=document) => root.querySelector(q);
  const $$ = (q, root=document) => Array.from(root.querySelectorAll(q));
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const getParam = (k) => new URLSearchParams(location.search).get(k);

  const fmtTime = (sec) => {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  };

  const store = {
    get(key, fallback){
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
      catch { return fallback; }
    },
    set(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  };

  const byId = (arr, id) => arr.find(x => x.id === id);
  const defaultQueue = ["t1","t2","t3","t4","t5"];

  const state = store.get("spotify_ui_state_v3", {
    theme: "dark",               // dark|amoled|light
    reduceMotion: false,
    queue: defaultQueue,
    currentId: "t1",
    isPlaying: false,
    t: 12,
    bufferedPct: 35,
    shuffle: false,
    repeat: "off",               // off|all|one
    volume: 70,
    lastVolume: 70,
    muted: false,
    liked: [],
    libraryFilter: "all",
    librarySort: "recent",
    recentSearches: []           // Search page feature
  });

  const trackById = (id) => byId(DATA.tracks, id) || DATA.tracks[0];
  const playlistById = (id) => byId(DATA.playlists, id) || DATA.playlists[0];

  function save(){ store.set("spotify_ui_state_v3", state); }

  function unique(arr){
    const s = new Set();
    const out = [];
    arr.forEach(x => { if (!s.has(x)) { s.add(x); out.push(x); } });
    return out;
  }

  // ---------- icon helper ----------
  function icon(id, cls="ico"){
    return `<svg class="${cls}" aria-hidden="true"><use href="#${id}"></use></svg>`;
  }

  // ---------- skeleton ----------
  function setupSkeleton(){
    const sk = $("#skeleton");
    if (!sk) return;
    setTimeout(() => sk.remove(), 850);
  }

  // ---------- theme & motion ----------
  function applyTheme(){
    document.body.classList.toggle("theme-amoled", state.theme === "amoled");
    document.body.classList.toggle("theme-light", state.theme === "light");
    document.body.classList.toggle("reduce-motion", !!state.reduceMotion);

    const label = state.theme === "amoled" ? "AMOLED" : state.theme === "light" ? "Light" : "Dark";
    const tbtn = $("#themeToggle");
    if (tbtn) tbtn.textContent = label;

    const sw = $("#reduceMotionSwitch");
    if (sw) sw.classList.toggle("on", !!state.reduceMotion);
  }

  // dynamic playlist gradient by cover theme
  const PLAYLIST_GRADS = {
    "cover-liked": "linear-gradient(180deg, rgba(127,0,255,.35), rgba(0,0,0,0))",
    "cover-mix1": "linear-gradient(180deg, rgba(0,114,255,.30), rgba(0,0,0,0))",
    "cover-mix2": "linear-gradient(180deg, rgba(255,210,0,.28), rgba(0,0,0,0))",
    "cover-chill": "linear-gradient(180deg, rgba(56,239,125,.22), rgba(0,0,0,0))",
    "cover-focus": "linear-gradient(180deg, rgba(76,161,175,.22), rgba(0,0,0,0))",
    "cover-hits": "linear-gradient(180deg, rgba(249,83,198,.22), rgba(0,0,0,0))",
    "cover-lofi": "linear-gradient(180deg, rgba(72,85,99,.28), rgba(0,0,0,0))",
    "cover-deep": "linear-gradient(180deg, rgba(36,59,85,.26), rgba(0,0,0,0))",
    "cover-acoustic": "linear-gradient(180deg, rgba(46,191,145,.22), rgba(0,0,0,0))",
    "cover-workout": "linear-gradient(180deg, rgba(221,36,118,.22), rgba(0,0,0,0))",
    "cover-throwbacks": "linear-gradient(180deg, rgba(153,242,200,.22), rgba(0,0,0,0))",
  };

  function setPlaylistGrad(coverClass){
    const grad = PLAYLIST_GRADS[coverClass] || "linear-gradient(180deg, rgba(0,0,0,.65), rgba(0,0,0,0))";
    document.documentElement.style.setProperty("--playlistGrad", grad);
  }

  // ---------- toast ----------
  let toastTimer = null;
  function toast(msg){
    clearTimeout(toastTimer);
    $$(".toast").forEach(t => t.remove());
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<span class="dot"></span><div style="font-weight:900">${msg}</div>`;
    document.body.appendChild(el);
    toastTimer = setTimeout(() => el.remove(), 1600);
  }

  // ---------- sidebar mobile ----------
  function setupSidebar(){
    const sidebar = $("#sidebar");
    const overlay = $("#overlay");
    const openBtn = $("#openSidebar");
    const closeBtn = $("#closeSidebar");

    if (sidebar && overlay) {
      const open = () => { sidebar.classList.add("open"); overlay.classList.add("show"); };
      const close = () => { sidebar.classList.remove("open"); overlay.classList.remove("show"); };

      openBtn && openBtn.addEventListener("click", open);
      closeBtn && closeBtn.addEventListener("click", close);
      overlay.addEventListener("click", close);
    }

    const page = document.body.dataset.page || "";
    $$(".nav-item").forEach(a => a.classList.toggle("active", a.dataset.page === page));
  }

  // ---------- topbar scroll ----------
  function setupTopbarScroll(){
    const topbar = $("#topbar");
    const content = $("#contentScroll");
    if (!topbar || !content) return;
    content.addEventListener("scroll", () => {
      topbar.classList.toggle("scrolled", content.scrollTop > 10);
      const hero = $("#playlistHero");
      if (hero) hero.classList.toggle("shrink", content.scrollTop > 20);
    });
  }

  // ---------- settings modal ----------
  function setupSettings(){
    const openBtn = $("#openSettings");
    const closeBtn = $("#closeSettings");
    const overlay = $("#modalOverlay");
    const modal = $("#settingsModal");

    const open = () => { overlay?.classList.add("show"); modal?.classList.add("show"); };
    const close = () => { overlay?.classList.remove("show"); modal?.classList.remove("show"); };

    openBtn?.addEventListener("click", open);
    closeBtn?.addEventListener("click", close);
    overlay?.addEventListener("click", close);

    $("#themeToggle")?.addEventListener("click", () => {
      // cycle: dark -> amoled -> light -> dark
      state.theme = state.theme === "dark" ? "amoled" : state.theme === "amoled" ? "light" : "dark";
      save(); applyTheme();
      toast(`Theme: ${state.theme.toUpperCase()}`);
    });

    $("#reduceMotionSwitch")?.addEventListener("click", () => {
      state.reduceMotion = !state.reduceMotion;
      save(); applyTheme();
      toast(state.reduceMotion ? "Reduced motion ON" : "Reduced motion OFF");
    });

    $("#clearData")?.addEventListener("click", () => {
      localStorage.removeItem("spotify_ui_state_v3");
      toast("Saved data cleared");
      setTimeout(() => location.reload(), 500);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  // ---------- sidebar playlists ----------
  function setupCommonPlaylistSidebar(){
    const list = $("#sidebarPlaylists");
    if (!list) return;
    const selectedId = getParam("id");
    list.innerHTML = "";
    DATA.playlists.slice(0, 9).forEach(p => {
      const btn = document.createElement("button");
      btn.className = "pill" + (selectedId === p.id ? " active" : "");
      btn.textContent = p.name;
      btn.addEventListener("click", () => location.href = `playlist.html?id=${encodeURIComponent(p.id)}`);
      list.appendChild(btn);
    });
  }

  // ---------- playback ----------
  let tickTimer = null;

  function ensureQueueNotEmpty(){
    if (!Array.isArray(state.queue) || state.queue.length === 0) state.queue = defaultQueue.slice();
  }

  function setCurrent(id, autoplay=true){
    const t = trackById(id);
    state.currentId = t.id;
    state.t = clamp(state.t, 0, t.dur);
    if (autoplay) state.isPlaying = true;
    save();
    renderAll();
  }

  function playPause(){
    state.isPlaying = !state.isPlaying;
    save();
    renderPlayer();
    syncPausedClass();
  }

  function syncPausedClass(){
    document.body.classList.toggle("paused", !state.isPlaying);
  }

  function nextTrack(){
    ensureQueueNotEmpty();
    if (state.repeat === "one") { state.t = 0; save(); renderPlayer(); return; }

    const idx = state.queue.indexOf(state.currentId);
    let nextId;

    if (state.shuffle) {
      const pool = state.queue.filter(x => x !== state.currentId);
      nextId = pool.length ? pool[Math.floor(Math.random() * pool.length)] : state.currentId;
    } else {
      if (idx === state.queue.length - 1 && state.repeat === "off") {
        state.isPlaying = false; save(); renderPlayer(); syncPausedClass(); return;
      }
      nextId = state.queue[(idx + 1) % state.queue.length];
    }

    state.t = 0;
    setCurrent(nextId, true);
  }

  function prevTrack(){
    ensureQueueNotEmpty();
    if (state.t > 3) { state.t = 0; save(); renderPlayer(); return; }
    const idx = state.queue.indexOf(state.currentId);
    const prevId = state.queue[(idx - 1 + state.queue.length) % state.queue.length];
    state.t = 0;
    setCurrent(prevId, true);
  }

  function toggleShuffle(btn){
    state.shuffle = !state.shuffle;
    save();
    btn?.classList.toggle("toggle-on", state.shuffle);
    renderPlayer();
  }

  function toggleRepeat(btn){
    state.repeat = state.repeat === "off" ? "all" : state.repeat === "all" ? "one" : "off";
    save();
    btn?.classList.toggle("toggle-on", state.repeat !== "off");
    renderPlayer();
    toast(state.repeat === "off" ? "Repeat Off" : state.repeat === "all" ? "Repeat All" : "Repeat One");
  }

  function simulateBuffer(){
    const tr = trackById(state.currentId);
    const playedPct = tr.dur ? Math.round((state.t / tr.dur) * 100) : 0;
    const target = clamp(playedPct + 15 + Math.floor(Math.random()*10), 10, 100);
    state.bufferedPct = clamp(Math.max(state.bufferedPct, target), 0, 100);
  }

  function startTicker(){
    if (tickTimer) return;
    tickTimer = setInterval(() => {
      if (!state.isPlaying) return;
      const tr = trackById(state.currentId);
      state.t += 1;
      simulateBuffer();
      if (state.t >= tr.dur) {
        state.t = tr.dur;
        save();
        renderPlayer(true);
        nextTrack();
        return;
      }
      save();
      renderPlayer(true);
    }, 1000);
  }

  // ---------- marquee helper ----------
  function setMarquee(el, text){
    if (!el) return;
    if (text.length >= 22) {
      el.classList.add("marquee");
      // duplicate text for smooth loop
      el.innerHTML = `<span>${text} • ${text} • ${text} • </span>`;
    } else {
      el.classList.remove("marquee");
      el.textContent = text;
    }
  }

  // ---------- player UI ----------
  function renderPlayer(light=false){
    const tr = trackById(state.currentId);

    const title = $("#trackTitle");
    const artist = $("#trackArtist");
    const art = $("#trackArt");
    const playBtn = $("#playBtn");
    const curTime = $("#curTime");
    const durTime = $("#durTime");
    const progress = $("#progress");
    const vol = $("#volume");
    const muteBtn = $("#muteBtn");
    const sh = $("#shuffleBtn");
    const rp = $("#repeatBtn");

    if (title) setMarquee(title, tr.title);
    if (artist) artist.textContent = tr.artist;
    if (art) art.className = `track-art ${tr.cover}`;

    if (playBtn) playBtn.innerHTML = state.isPlaying ? icon("i-pause","ico") : icon("i-play","ico");

    if (curTime) curTime.textContent = fmtTime(state.t);
    if (durTime) durTime.textContent = fmtTime(tr.dur);

    const playedPct = tr.dur ? Math.round((state.t / tr.dur) * 100) : 0;
    $(".progress-played") && ($(".progress-played").style.width = `${playedPct}%`);
    $(".progress-buffer") && ($(".progress-buffer").style.width = `${state.bufferedPct}%`);
    if (progress) progress.value = String(playedPct);

    if (!light && vol) vol.value = String(state.muted ? 0 : state.volume);

    // mute icon
    if (muteBtn) {
      const isMute = state.muted || state.volume === 0;
      muteBtn.innerHTML = isMute ? icon("i-volume-x") : icon(state.volume < 35 ? "i-volume-1" : "i-volume-2");
      muteBtn.title = isMute ? "Unmute" : "Mute";
    }

    sh && sh.classList.toggle("toggle-on", state.shuffle);
    rp && rp.classList.toggle("toggle-on", state.repeat !== "off");

    // repeat icon swap
    if (rp) rp.innerHTML = state.repeat === "one" ? icon("i-repeat-1") : icon("i-repeat");

    syncPausedClass();
    startTicker();
  }

  function setupSeekTooltip(){
    const wrap = $("#progressWrap");
    const tip = $("#seekTip");
    if (!wrap || !tip) return;

    const showAt = (clientX) => {
      const rect = wrap.getBoundingClientRect();
      const x = clamp(clientX - rect.left, 0, rect.width);
      const pct = x / rect.width;
      const tr = trackById(state.currentId);
      const sec = Math.round(pct * tr.dur);
      tip.textContent = fmtTime(sec);
      tip.style.left = `${x}px`;
      tip.classList.add("show");
    };

    wrap.addEventListener("mousemove", (e) => showAt(e.clientX));
    wrap.addEventListener("mouseenter", (e) => showAt(e.clientX));
    wrap.addEventListener("mouseleave", () => tip.classList.remove("show"));

    wrap.addEventListener("touchstart", (e) => showAt(e.touches[0].clientX), {passive:true});
    wrap.addEventListener("touchmove", (e) => showAt(e.touches[0].clientX), {passive:true});
    wrap.addEventListener("touchend", () => tip.classList.remove("show"));
  }

  function setupPlayerControls(){
    $("#playBtn")?.addEventListener("click", playPause);
    $("#nextBtn")?.addEventListener("click", nextTrack);
    $("#prevBtn")?.addEventListener("click", prevTrack);

    const shuffleBtn = $("#shuffleBtn");
    const repeatBtn = $("#repeatBtn");
    shuffleBtn?.addEventListener("click", () => toggleShuffle(shuffleBtn));
    repeatBtn?.addEventListener("click", () => toggleRepeat(repeatBtn));

    $("#progress")?.addEventListener("input", () => {
      const tr = trackById(state.currentId);
      const pct = Number($("#progress").value) / 100;
      state.t = Math.round(pct * tr.dur);
      simulateBuffer();
      save();
      renderPlayer();
      highlightNowPlaying();
    });

    $("#volume")?.addEventListener("input", () => {
      const v = Number($("#volume").value);
      if (v === 0) state.muted = true;
      else { state.muted = false; state.volume = v; state.lastVolume = v; }
      save();
      renderPlayer();
    });

    $("#muteBtn")?.addEventListener("click", () => {
      state.muted = !state.muted;
      if (!state.muted) state.volume = state.lastVolume || 70;
      save();
      renderPlayer();
      toast(state.muted ? "Muted" : "Unmuted");
    });

    $("#likeNow")?.addEventListener("click", () => {
      const id = state.currentId;
      const set = new Set(state.liked);
      if (set.has(id)) { set.delete(id); toast("Removed from Liked Songs"); }
      else { set.add(id); toast("Added to Liked Songs"); }
      state.liked = Array.from(set);
      save();
      highlightNowPlaying();
    });

    setupSeekTooltip();
  }

  // ---------- queue drawer + drag reorder ----------
  function renderQueue(){
    const body = $("#queueBody");
    if (!body) return;

    ensureQueueNotEmpty();

    if (!state.queue.length) {
      body.innerHTML = `<div class="queue-empty">Queue is empty</div>`;
      return;
    }

    body.innerHTML = "";
    state.queue.forEach((id) => {
      const tr = trackById(id);
      const item = document.createElement("div");
      item.className = "queue-item" + (id === state.currentId ? " active" : "");
      item.draggable = true;
      item.dataset.trackId = id;

      item.innerHTML = `
        <button class="qi-drag" title="Drag to reorder" aria-label="Drag">${icon("i-grip","ico sm")}</button>
        <div class="qi-art ${tr.cover}"></div>
        <div class="qi-meta">
          <div class="qi-title" id="qtitle-${id}"></div>
          <div class="qi-sub">${tr.artist}</div>
          <div class="eq" aria-hidden="true"><span></span><span></span><span></span></div>
        </div>
        <button class="qi-x" title="Remove" aria-label="Remove">${icon("i-x","ico sm")}</button>
      `;

      // marquee in queue titles
      const qTitle = item.querySelector(`#qtitle-${CSS.escape(id)}`);
      if (qTitle) setMarquee(qTitle, tr.title);

      item.addEventListener("click", (e) => {
        if (e.target.closest(".qi-x") || e.target.closest(".qi-drag")) return;
        state.t = 0;
        setCurrent(id, true);
        toast("Playing now");
      });

      item.querySelector(".qi-x").addEventListener("click", (e) => {
        e.stopPropagation();
        state.queue = state.queue.filter(x => x !== id);
        if (state.currentId === id) {
          if (state.queue.length) setCurrent(state.queue[0], true);
          else { state.currentId = "t1"; state.isPlaying = false; }
        }
        save();
        renderQueue();
        highlightNowPlaying();
      });

      // drag events
      item.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", id);
        item.style.opacity = "0.6";
      });
      item.addEventListener("dragend", () => { item.style.opacity = "1"; });
      item.addEventListener("dragover", (e) => { e.preventDefault(); });
      item.addEventListener("drop", (e) => {
        e.preventDefault();
        const fromId = e.dataTransfer.getData("text/plain");
        const toId = id;
        if (!fromId || fromId === toId) return;

        const arr = state.queue.slice();
        const fromIdx = arr.indexOf(fromId);
        const toIdx = arr.indexOf(toId);
        arr.splice(fromIdx, 1);
        arr.splice(toIdx, 0, fromId);
        state.queue = arr;
        save();
        renderQueue();
      });

      body.appendChild(item);
    });
  }

  function setupQueue(){
    const queue = $("#queue");
    const openBtn = $("#openQueue");
    const closeBtn = $("#closeQueue");
    const overlay = $("#queueOverlay");

    const open = () => { queue?.classList.add("open"); overlay?.classList.add("show"); };
    const close = () => { queue?.classList.remove("open"); overlay?.classList.remove("show"); };

    openBtn?.addEventListener("click", open);
    closeBtn?.addEventListener("click", close);
    overlay?.addEventListener("click", close);

    $("#clearQueue")?.addEventListener("click", () => {
      state.queue = [];
      save();
      renderQueue();
      toast("Queue cleared");
    });
  }

  // ---------- Now Playing highlight ----------
  function highlightNowPlaying(){
    $$(".row").forEach(r => r.classList.toggle("playing", r.dataset.trackId === state.currentId));

    // like button icon state in player
    const likeNow = $("#likeNow");
    if (likeNow){
      const liked = state.liked.includes(state.currentId);
      likeNow.innerHTML = liked ? icon("i-heart-fill","ico") : icon("i-heart","ico");
      likeNow.title = liked ? "Unlike" : "Like";
    }
  }

  // ---------- Pages ----------
  function setupHome(){
    $$(".quick-card").forEach((el) => {
      el.addEventListener("click", () => {
        const pid = el.dataset.playlistId;
        if (pid) location.href = `playlist.html?id=${encodeURIComponent(pid)}`;
      });
    });

    $$(".card").forEach((card) => {
      const pid = card.dataset.playlistId;
      const playFab = $(".play-fab", card);

      playFab?.addEventListener("click", (e) => {
        e.stopPropagation();
        if (pid) playPlaylist(pid, true);
      });

      card.addEventListener("click", () => {
        if (pid) location.href = `playlist.html?id=${encodeURIComponent(pid)}`;
      });
    });

    const chips = $$(".chip");
    chips.forEach(ch => {
      ch.addEventListener("click", () => {
        chips.forEach(x => x.classList.remove("active"));
        ch.classList.add("active");
        const f = ch.dataset.filter;
        $$(".card").forEach(c => {
          const type = (c.dataset.type || "all");
          c.style.display = (f === "all" || type === f) ? "" : "none";
        });
      });
    });

    // set base gradient for home
    setPlaylistGrad("cover-lofi");
  }

  function addRecentSearch(q){
    const cleaned = q.trim();
    if (!cleaned) return;
    state.recentSearches = unique([cleaned, ...state.recentSearches]).slice(0, 8);
    save();
  }

  function renderRecent(){
    const wrap = $("#recentWrap");
    if (!wrap) return;
    wrap.innerHTML = "";
    state.recentSearches.forEach((q) => {
      const b = document.createElement("button");
      b.className = "recent-item";
      b.innerHTML = `${icon("i-clock","ico sm")} <span>${q}</span>`;
      b.addEventListener("click", () => {
        const input = $("#searchInput");
        if (input){ input.value = q; input.dispatchEvent(new Event("input")); input.focus(); }
      });
      wrap.appendChild(b);
    });

    if (!state.recentSearches.length){
      wrap.innerHTML = `<div class="badge">${icon("i-info","ico sm")} Start searching to see recent searches</div>`;
    }
  }

  function setupSearch(){
    const input = $("#searchInput");
    const topResult = $("#topResult");
    const songList = $("#songList");
    const artistList = $("#artistList");
    const catGrid = $("#catGrid");
    const empty = $("#searchEmpty");

    if (!input || !topResult || !songList || !artistList || !catGrid || !empty) return;

    // set gradient for search page
    setPlaylistGrad("cover-mix1");

    // browse categories
    catGrid.innerHTML = "";
    DATA.categories.forEach(c => {
      const btn = document.createElement("button");
      btn.className = "cat-card";
      btn.innerHTML = `
        <div class="mini ${c.cover}"></div>
        <div class="t">${c.name}</div>
        <div class="s">Browse</div>
      `;
      btn.addEventListener("click", () => toast(`Browsing: ${c.name}`));
      catGrid.appendChild(btn);
    });

    const render = () => {
      const q = input.value.trim().toLowerCase();

      const songs = DATA.tracks.filter(t =>
        !q || t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
      );
      const artists = DATA.artists.filter(a => !q || a.name.toLowerCase().includes(q));

      const hasAny = q ? (songs.length || artists.length) : true;
      empty.style.display = (!hasAny) ? "" : "none";

      // top result
      topResult.innerHTML = "";
      if (q && songs.length) {
        const t = songs[0];
        const box = document.createElement("div");
        box.className = "top-result";
        box.innerHTML = `
          <div class="qi-art ${t.cover}" style="width:54px;height:54px;border-radius:12px"></div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:900; font-size:16px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.title}</div>
            <div style="color:var(--muted); font-weight:800; font-size:12px;">${t.artist} • Song</div>
          </div>
          <button class="btn" style="padding:10px 12px">${icon("i-play","ico sm")} Play</button>
        `;
        box.querySelector(".btn").addEventListener("click", () => {
          state.queue = unique([t.id, ...state.queue]);
          state.t = 0;
          setCurrent(t.id, true);
          toast("Playing Top Result");
        });
        topResult.appendChild(box);
      } else {
        topResult.innerHTML = `<div class="badge">${icon("i-search","ico sm")} Type to see Top Result</div>`;
      }

      // songs list
      songList.innerHTML = "";
      (q ? songs.slice(0, 6) : DATA.tracks.slice(0, 6)).forEach(t => {
        const row = document.createElement("div");
        row.className = "queue-item";
        row.innerHTML = `
          <div class="qi-art ${t.cover}"></div>
          <div class="qi-meta">
            <div class="qi-title">${t.title}</div>
            <div class="qi-sub">${t.artist}</div>
          </div>
          <button class="qi-x" title="Add to queue" aria-label="Add">${icon("i-plus","ico sm")}</button>
        `;
        row.addEventListener("click", (e) => {
          if (e.target.closest(".qi-x")) return;
          state.queue = unique([t.id, ...state.queue]);
          state.t = 0;
          setCurrent(t.id, true);
          toast("Playing now");
        });
        row.querySelector(".qi-x").addEventListener("click", (e) => {
          e.stopPropagation();
          state.queue = unique([...state.queue, t.id]);
          save();
          renderQueue();
          toast("Added to queue");
        });
        songList.appendChild(row);
      });

      // artists
      artistList.innerHTML = "";
      (q ? artists.slice(0, 6) : DATA.artists.slice(0, 6)).forEach(a => {
        const pill = document.createElement("div");
        pill.className = "artist-pill";
        pill.innerHTML = `
          <div class="artist-avatar ${a.cover}"></div>
          <div style="min-width:0; flex:1">
            <div style="font-weight:900; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${a.name}</div>
            <div style="color:var(--muted); font-size:12px; font-weight:800">Artist</div>
          </div>
          <button class="icon-btn" title="Play" style="background:rgba(127,127,127,.10)">${icon("i-play","ico sm")}</button>
        `;
        pill.querySelector("button").addEventListener("click", () => {
          const t = DATA.tracks.find(x => x.artist === a.name) || DATA.tracks[0];
          state.queue = unique([t.id, ...state.queue]);
          state.t = 0;
          setCurrent(t.id, true);
          toast(`Playing ${a.name}`);
        });
        artistList.appendChild(pill);
      });

      // recent searches update
      if (q) addRecentSearch(input.value);
      renderRecent();
    };

    input.addEventListener("input", render);
    renderRecent();
    render();
  }

  function setupLibrary(){
    const grid = $("#libraryGrid");
    const chipWrap = $("#libChips");
    const sortSel = $("#libSort");
    const search = $("#libSearch");
    if (!grid || !chipWrap || !sortSel || !search) return;

    setPlaylistGrad("cover-focus");

    const chips = $$(".chip", chipWrap);
    chips.forEach(c => c.classList.toggle("active", c.dataset.filter === state.libraryFilter));
    sortSel.value = state.librarySort;

    const render = () => {
      const q = search.value.trim().toLowerCase();
      const filter = state.libraryFilter;
      const sort = state.librarySort;

      let items = DATA.playlists.slice();

      if (filter !== "all") items = items.filter(p => p.type === filter);
      if (q) items = items.filter(p => p.name.toLowerCase().includes(q));
      if (sort === "az") items.sort((a,b) => a.name.localeCompare(b.name));

      grid.innerHTML = "";
      items.forEach(p => {
        const card = document.createElement("article");
        card.className = "card";
        card.dataset.playlistId = p.id;
        card.dataset.type = p.type;
        card.innerHTML = `
          <div class="cover ${p.cover}"></div>
          <div class="card-title">${p.name}</div>
          <div class="card-sub">${p.desc}</div>
          <button class="play-fab" aria-label="Play">${icon("i-play","ico sm")}</button>
        `;
        card.querySelector(".play-fab").addEventListener("click", (e) => {
          e.stopPropagation();
          playPlaylist(p.id, true);
        });
        card.addEventListener("click", () => location.href = `playlist.html?id=${encodeURIComponent(p.id)}`);
        grid.appendChild(card);
      });

      if (!items.length) grid.innerHTML = `<div class="queue-empty" style="grid-column:1/-1">No items found</div>`;
    };

    chips.forEach(ch => {
      ch.addEventListener("click", () => {
        chips.forEach(x => x.classList.remove("active"));
        ch.classList.add("active");
        state.libraryFilter = ch.dataset.filter;
        save();
        render();
      });
    });

    sortSel.addEventListener("change", () => {
      state.librarySort = sortSel.value;
      save();
      render();
    });

    search.addEventListener("input", render);
    render();
  }

  function setupPlaylist(){
    const pid = getParam("id") || "liked";
    const p = playlistById(pid);

    setPlaylistGrad(p.cover);

    const heroCover = $("#playlistCover");
    const title = $("#playlistTitle");
    const meta = $("#playlistMeta");
    const playAll = $("#playPlaylist");
    const tableBody = $("#trackRows");

    heroCover && (heroCover.className = `big-cover ${p.cover}`);
    title && (title.textContent = p.name);
    meta && (meta.textContent = `${p.type.toUpperCase()} • UI Only`);

    playAll && (playAll.innerHTML = `${icon("i-play","ico sm")} Play`);
    playAll?.addEventListener("click", () => playPlaylist(pid, true));

    if (!tableBody) return;

    const ids = DATA.playlistTracks[pid] || DATA.playlistTracks.liked;
    const tracks = ids.map(trackById);

    tableBody.innerHTML = "";
    if (!tracks.length) {
      tableBody.innerHTML = `<div class="queue-empty">No tracks</div>`;
      return;
    }

    tracks.forEach((t, i) => {
      const row = document.createElement("div");
      row.className = "row" + (t.id === state.currentId ? " playing" : "");
      row.dataset.trackId = t.id;

      const liked = state.liked.includes(t.id);

      row.innerHTML = `
        <div class="num">${i + 1}</div>
        <div class="hover-play">${icon("i-play","ico sm")}</div>
        <div>
          <div class="t-title">${t.title}</div>
          <div class="t-artist">${t.artist}</div>
          <div class="eq" aria-hidden="true"><span></span><span></span><span></span></div>
        </div>
        <div class="t-artist">Album • UI</div>
        <div class="t-dur">${fmtTime(t.dur)}</div>
        <div style="display:flex;justify-content:center">
          <button class="like-btn" title="Like">${liked ? icon("i-heart-fill","ico sm") : icon("i-heart","ico sm")}</button>
        </div>
      `;

      row.addEventListener("click", () => {
        state.queue = unique([t.id, ...state.queue]);
        state.t = 0;
        setCurrent(t.id, true);
        toast("Playing now");
      });

      row.querySelector(".like-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        const set = new Set(state.liked);
        if (set.has(t.id)) { set.delete(t.id); toast("Removed from Liked Songs"); }
        else { set.add(t.id); toast("Added to Liked Songs"); }
        state.liked = Array.from(set);
        save();
        e.currentTarget.innerHTML = state.liked.includes(t.id) ? icon("i-heart-fill","ico sm") : icon("i-heart","ico sm");
        highlightNowPlaying();
      });

      tableBody.appendChild(row);
    });

    highlightNowPlaying();
  }

  function playPlaylist(pid, autoplay){
    const ids = DATA.playlistTracks[pid] || DATA.playlistTracks.liked;
    state.queue = ids.slice();
    state.t = 0;
    state.bufferedPct = 35;
    setCurrent(state.queue[0] || "t1", autoplay);
    toast(`Playing: ${playlistById(pid).name}`);
  }

  // ---------- shortcuts ----------
  function setupShortcuts(){
    document.addEventListener("keydown", (e) => {
      const tag = document.activeElement?.tagName || "";
      const typing = tag === "INPUT" || tag === "TEXTAREA";

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        $("#searchInput")?.focus();
        return;
      }

      if (e.key === "Escape") {
        $("#queue")?.classList.remove("open");
        $("#queueOverlay")?.classList.remove("show");
        $("#sidebar")?.classList.remove("open");
        $("#overlay")?.classList.remove("show");
        $("#modalOverlay")?.classList.remove("show");
        $("#settingsModal")?.classList.remove("show");
        return;
      }

      if (typing) return;

      if (e.code === "Space") {
        e.preventDefault();
        playPause();
        return;
      }

      if (e.key === "ArrowRight") {
        const tr = trackById(state.currentId);
        state.t = clamp(state.t + 5, 0, tr.dur);
        simulateBuffer();
        save(); renderPlayer(); highlightNowPlaying();
      }
      if (e.key === "ArrowLeft") {
        const tr = trackById(state.currentId);
        state.t = clamp(state.t - 5, 0, tr.dur);
        save(); renderPlayer(); highlightNowPlaying();
      }
    });
  }

  // ---------- init SVG icons in static buttons ----------
  function hydrateStaticIcons(){
    const map = {
      openSidebar: "i-menu",
      closeSidebar: "i-x",
      openSettings: "i-settings",
      closeSettings: "i-x",
      openQueue: "i-queue",
      closeQueue: "i-x",
      clearQueue: "i-trash",
      shuffleBtn: "i-shuffle",
      prevBtn: "i-skip-back",
      nextBtn: "i-skip-forward",
      repeatBtn: "i-repeat",
    };

    Object.entries(map).forEach(([id, ico]) => {
      const el = document.getElementById(id);
      if (el && !el.dataset.hydrated) {
        el.innerHTML = icon(ico);
        el.dataset.hydrated = "1";
      }
    });

    // nav icons
    $$(".nav-item").forEach(a => {
      const p = a.dataset.page;
      const ico = p === "home" ? "i-home" : p === "search" ? "i-search" : "i-library";
      if (!a.querySelector("svg")) a.insertAdjacentHTML("afterbegin", icon(ico));
    });

    // quick card play buttons
    $$(".qc-play").forEach(el => el.innerHTML = icon("i-play","ico sm"));

    // play fabs
    $$(".play-fab").forEach(el => el.innerHTML = icon("i-play","ico sm"));
  }

  // ---------- render all ----------
  function renderAll(){
    renderQueue();
    renderPlayer();
    highlightNowPlaying();
  }

  // ---------- init ----------
  document.addEventListener("DOMContentLoaded", () => {
    setupSkeleton();
    applyTheme();
    setupSettings();
    setupSidebar();
    setupTopbarScroll();
    setupCommonPlaylistSidebar();
    setupQueue();
    setupPlayerControls();
    setupShortcuts();

    hydrateStaticIcons();
    renderAll();

    const page = document.body.dataset.page;
    if (page === "home") setupHome();
    if (page === "search") setupSearch();
    if (page === "library") setupLibrary();
    if (page === "playlist") setupPlaylist();
  });
})();
document.addEventListener("keydown",e=>{

if(e.code==="Space"){
e.preventDefault()
playPause()
}

if(e.code==="ArrowRight"){
state.t+=5
renderPlayer()
}

if(e.code==="ArrowLeft"){
state.t-=5
renderPlayer()
}

})