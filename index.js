// ✅ Video Info + Download Link Route
app.get("/api", async (req, res) => {
  const url = req.query.url;

  if (!url) return res.status(400).json({
    error: "URL missing",
    example: "/api?url=https://youtu.be/VIDEO_ID"
  });

  try {
    let videoId = "";
    if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0];
    } else if (url.includes("v=")) {
      videoId = url.split("v=")[1].split("&")[0];
    } else {
      videoId = url.trim();
    }

    const r = await yts({ videoId });

    // ✅ নতুন download services
    const downloads = [
      `https://api.downloadsound.cloud/video/${videoId}`,
      `https://yt-download.org/api/button/mp4/${videoId}`,
      `https://loader.to/api/button/?url=https://youtube.com/watch?v=${videoId}&f=mp4`
    ];

    res.json({
      title: r.title,
      url: r.url,
      thumbnail: r.thumbnail,
      duration: r.timestamp,
      views: r.views,
      author: r.author.name,
      downloadUrl: downloads[0],
      downloadUrl2: downloads[1],
      downloadUrl3: downloads[2]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
