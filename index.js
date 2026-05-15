const express = require("express");
const cors = require("cors");
const yts = require("yt-search");

const app = express();
app.use(cors());

// ✅ Home
app.get("/", (req, res) => {
  res.json({
    status: "running",
    author: "Rocky Chowdhury",
    api_name: "YT Rocky API",
    endpoints: {
      search: "/api?url=YOUR_YOUTUBE_URL",
      yt_search: "/yt?search=QUERY"
    }
  });
});

// ✅ /api?url= → Download info (same as yt-api-imran)
app.get("/api", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({
    error: "URL missing",
    example: "/api?url=https://youtu.be/VIDEO_ID"
  });

  try {
    // Extract video ID
    let videoId = "";
    if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0];
    } else if (url.includes("v=")) {
      videoId = url.split("v=")[1].split("&")[0];
    } else {
      videoId = url.trim();
    }

    const r = await yts({ videoId });

    res.json({
      title: r.title,
      thumbnail: r.thumbnail,
      duration: r.timestamp,
      views: r.views,
      author: r.author.name,
      url: r.url,
      downloadUrl: `https://api.vevioz.com/api/button/mp4/${videoId}`
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ /yt?search= → Search (same as betadash)
app.get("/yt", async (req, res) => {
  const query = req.query.search;
  if (!query) return res.status(400).json({
    error: "Search query missing",
    example: "/yt?search=Believer"
  });

  try {
    const r = await yts(query);
    const videos = r.videos.slice(0, 5).map(v => ({
      title: v.title,
      time: v.timestamp,
      thumbnail: v.thumbnail,
      url: v.url,
      views: v.views,
      channelName: v.author.name
    }));
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`YT Rocky API on port ${PORT}`));

module.exports = app;
