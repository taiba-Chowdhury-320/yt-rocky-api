const express = require("express");
const cors = require("cors");
const yts = require("yt-search");
const axios = require("axios");

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.json({
    status: "✅ Running",
    api_name: "YT Rocky API",
    author: "Rocky Chowdhury"
  });
});

// ✅ Search
app.get("/yt", async (req, res) => {
  const query = req.query.search;
  if (!query) return res.status(400).json({ error: "Query missing" });
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

// ✅ Download - RyzenDesu API use করে
app.get("/api", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "URL missing" });

  try {
    let videoId = "";
    if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0];
    } else if (url.includes("v=")) {
      videoId = url.split("v=")[1].split("&")[0];
    }

    const fullUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const encoded = encodeURIComponent(fullUrl);

    // RyzenDesu API try করো
    let downloadUrl = null;

    try {
      const r1 = await axios.get(
        `https://api.ryzendesu.vip/api/downloader/ytmp4?url=${encoded}`,
        { timeout: 15000 }
      );
      downloadUrl = r1.data?.data?.url || r1.data?.url || null;
    } catch(e) {}

    // Fallback: y2meta style
    if (!downloadUrl) {
      try {
        const r2 = await axios.post(
          "https://www.y2meta.com/mates/analyzeV2/ajax",
          `query=${encoded}&vt=home`,
          {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            timeout: 15000
          }
        );
        const links = r2.data?.links?.mp4;
        if (links) {
          const key = Object.keys(links)[0];
          downloadUrl = links[key]?.url || null;
        }
      } catch(e) {}
    }

    // Video info
    const info = await yts({ videoId });

    res.json({
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.timestamp,
      views: info.views,
      author: info.author.name,
      url: fullUrl,
      downloadUrl: downloadUrl
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`YT Rocky API on port ${PORT}`));
module.exports = app;
