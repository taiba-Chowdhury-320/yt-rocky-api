const express = require("express");
const cors = require("cors");
const yts = require("yt-search");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

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

// ✅ Download - yt-dlp ব্যবহার করে
app.get("/api", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "URL missing" });

  try {
    // yt-dlp দিয়ে direct download URL বের করো
    const command = `yt-dlp -f "best[ext=mp4][height<=480]" --get-url "${url}"`;
    
    exec(command, { timeout: 30000 }, async (error, stdout, stderr) => {
      if (error || !stdout.trim()) {
        // fallback: yt-search থেকে info নাও
        let videoId = "";
        if (url.includes("youtu.be/")) {
          videoId = url.split("youtu.be/")[1].split("?")[0];
        } else if (url.includes("v=")) {
          videoId = url.split("v=")[1].split("&")[0];
        }
        const r = await yts({ videoId });
        return res.json({
          title: r.title,
          thumbnail: r.thumbnail,
          duration: r.timestamp,
          views: r.views,
          author: r.author.name,
          downloadUrl: null,
          error: "yt-dlp failed"
        });
      }

      const downloadUrl = stdout.trim().split("\n")[0];

      // Video info
      let videoId = "";
      if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1].split("?")[0];
      } else if (url.includes("v=")) {
        videoId = url.split("v=")[1].split("&")[0];
      }

      const r = await yts({ videoId });

      res.json({
        title: r.title,
        thumbnail: r.thumbnail,
        duration: r.timestamp,
        views: r.views,
        author: r.author.name,
        downloadUrl: downloadUrl
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`YT Rocky API on port ${PORT}`));
module.exports = app;
