const express = require("express");
const cors = require("cors");
const yts = require("yt-search");
const axios = require("axios");

const app = express();
app.use(cors());

const RAPID_KEY = "59e10dd197mshb490a9bab23a36dp102ad9jsna74fceef3523";

app.get("/", (req, res) => {
  res.json({
    status: "✅ Running",
    api_name: "YT Rocky API",
    author: "Rocky Chowdhury",
    endpoints: {
      search: "/yt?search=QUERY",
      download: "/api?url=YOUTUBE_URL"
    }
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

// ✅ Download via RapidAPI
app.get("/api", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "URL missing" });

  try {
    // Extract video ID
    let videoId = "";
    if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0];
    } else if (url.includes("v=")) {
      videoId = new URL(url).searchParams.get("v");
    }
    if (!videoId) throw new Error("Invalid YouTube URL");

    // RapidAPI - Youtube Mp4 by Opachi
    const rapidRes = await axios.get(
      `https://youtube-mp41.p.rapidapi.com/download`,
      {
        params: { id: videoId },
        headers: {
          "x-rapidapi-key": RAPID_KEY,
          "x-rapidapi-host": "youtube-mp41.p.rapidapi.com"
        },
        timeout: 25000
      }
    );

    let downloadUrl = rapidRes.data?.url || null;

    // If processing, wait and retry once
    if (!downloadUrl && rapidRes.data?.status === "processing") {
      await new Promise(r => setTimeout(r, 5000));
      const retry = await axios.get(
        `https://youtube-mp41.p.rapidapi.com/download`,
        {
          params: { id: videoId },
          headers: {
            "x-rapidapi-key": RAPID_KEY,
            "x-rapidapi-host": "youtube-mp41.p.rapidapi.com"
          },
          timeout: 25000
        }
      );
      downloadUrl = retry.data?.url || null;
    }

    // Get video info
    const info = await yts({ videoId });

    res.json({
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.timestamp,
      views: info.views,
      author: info.author.name,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      downloadUrl: downloadUrl
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`YT Rocky API running on port ${PORT}`));
module.exports = app;
