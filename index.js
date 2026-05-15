const express = require("express");
const cors = require("cors");
const yts = require("yt-search");
const ytdl = require("@distube/ytdl-core");

const app = express();
app.use(cors());

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

// ✅ Download Link
app.get("/api", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "URL missing" });

  try {
    const info = await ytdl.getInfo(url);
    const format = ytdl.chooseFormat(info.formats, {
      quality: "highestvideo",
      filter: "videoandaudio"
    });

    res.json({
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails?.slice(-1)[0]?.url,
      duration: info.videoDetails.lengthSeconds,
      views: info.videoDetails.viewCount,
      author: info.videoDetails.author.name,
      downloadUrl: format.url
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`YT Rocky API on port ${PORT}`));
module.exports = app;
