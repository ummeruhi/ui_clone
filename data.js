// data.js — UI-only dataset

window.SPOTIFY_DATA = {
  playlists: [
    { id: "liked", name: "Liked Songs", type: "playlist", cover: "cover-liked", desc: "Your favorite tracks in one place." },
    { id: "mix1", name: "Daily Mix 1", type: "mix", cover: "cover-mix1", desc: "A mix made just for you." },
    { id: "mix2", name: "Daily Mix 2", type: "mix", cover: "cover-mix2", desc: "Your daily soundtrack." },
    { id: "chill", name: "Chill Vibes", type: "playlist", cover: "cover-chill", desc: "Relax, unwind, repeat." },
    { id: "focus", name: "Focus Flow", type: "playlist", cover: "cover-focus", desc: "Deep focus music." },
    { id: "hits", name: "Top Hits", type: "playlist", cover: "cover-hits", desc: "Biggest hits right now." },
    { id: "lofi", name: "Lo-Fi Beats", type: "playlist", cover: "cover-lofi", desc: "Chill instrumental beats." },
    { id: "deep", name: "Deep Focus", type: "playlist", cover: "cover-deep", desc: "Work mode on." },
    { id: "acoustic", name: "Evening Acoustic", type: "album", cover: "cover-acoustic", desc: "Soft acoustic moods." },
    { id: "workout", name: "Workout Energy", type: "playlist", cover: "cover-workout", desc: "High energy tracks." },
    { id: "throwbacks", name: "Throwbacks", type: "playlist", cover: "cover-throwbacks", desc: "Old school favorites." },
  ],

  artists: [
    { id: "a1", name: "Lo-Fi Lab", cover: "cover-lofi" },
    { id: "a2", name: "Focus Mode", cover: "cover-deep" },
    { id: "a3", name: "Acoustic Hour", cover: "cover-acoustic" },
    { id: "a4", name: "Workout Crew", cover: "cover-workout" },
    { id: "a5", name: "Chill Society", cover: "cover-chill" },
    { id: "a6", name: "Hit Factory", cover: "cover-hits" },
    { id: "a7", name: "Throwback FM", cover: "cover-throwbacks" },
  ],

  categories: [
    { id: "c1", name: "Podcasts", cover: "cover-mix1" },
    { id: "c2", name: "Made For You", cover: "cover-focus" },
    { id: "c3", name: "Charts", cover: "cover-hits" },
    { id: "c4", name: "New Releases", cover: "cover-mix2" },
    { id: "c5", name: "Discover", cover: "cover-chill" },
    { id: "c6", name: "Workout", cover: "cover-workout" },
    { id: "c7", name: "Chill", cover: "cover-lofi" },
    { id: "c8", name: "Throwback", cover: "cover-throwbacks" },
  ],

  tracks: [
    { id: "t1",  title: "Midnight Tape (Very Long Track Title Example That Scrolls Smoothly)", artist: "Lo-Fi Lab",     dur: 208, cover: "cover-lofi" },
    { id: "t2",  title: "Calm Circuit",    artist: "Focus Mode",    dur: 195, cover: "cover-deep" },
    { id: "t3",  title: "Sunset Strings",  artist: "Acoustic Hour", dur: 214, cover: "cover-acoustic" },
    { id: "t4",  title: "Neon Sprint",     artist: "Workout Crew",  dur: 186, cover: "cover-workout" },
    { id: "t5",  title: "Retro Glow",      artist: "Throwback FM",  dur: 221, cover: "cover-throwbacks" },
    { id: "t6",  title: "Ocean Drift",     artist: "Chill Society", dur: 203, cover: "cover-chill" },
    { id: "t7",  title: "Topline",         artist: "Hit Factory",   dur: 177, cover: "cover-hits" },
    { id: "t8",  title: "Deep Work",       artist: "Focus Mode",    dur: 240, cover: "cover-deep" },
    { id: "t9",  title: "Warm Coffee",     artist: "Lo-Fi Lab",     dur: 189, cover: "cover-lofi" },
    { id: "t10", title: "Late Night Mix",  artist: "Daily Mix",     dur: 230, cover: "cover-mix1" },
    { id: "t11", title: "Golden Hour",     artist: "Acoustic Hour", dur: 201, cover: "cover-acoustic" },
    { id: "t12", title: "Energy Boost",    artist: "Workout Crew",  dur: 199, cover: "cover-workout" },
  ],

  playlistTracks: {
    liked:      ["t1","t2","t3","t4","t5","t6"],
    mix1:       ["t10","t1","t7","t9","t6"],
    mix2:       ["t2","t8","t3","t11","t6"],
    chill:      ["t6","t1","t9","t3"],
    focus:      ["t2","t8","t9","t1"],
    hits:       ["t7","t10","t12","t4"],
    lofi:       ["t1","t9","t6","t2"],
    deep:       ["t2","t8","t1","t9"],
    acoustic:   ["t3","t11","t6","t9"],
    workout:    ["t4","t12","t7","t10"],
    throwbacks: ["t5","t7","t10","t6"]
  }
};
