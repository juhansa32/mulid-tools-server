const express = require("express");
const fileUpload = require("express-fileupload");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 10000;

const UPLOAD_DIR = path.join(__dirname, "uploads");
const OUTPUT_DIR = path.join(__dirname, "outputs");

// 폴더 없으면 생성
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

app.use(fileUpload());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Mulid Tools Server is running!");
});

app.post("/convert/audio", async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).send("No file uploaded");
    }

    const file = req.files.file;
    const format = req.body.format || "mp3";
    const bitrate = req.body.bitrate || "192";

    const originalName = file.name;
    const baseName = path.parse(originalName).name;

    const inputPath = path.join(UPLOAD_DIR, file.name);
    const outputPath = path.join(OUTPUT_DIR, `${baseName}.${format}`);

    await file.mv(inputPath);

    let command = ffmpeg(inputPath).toFormat(format);

    if (format === "mp3") {
      command = command.audioBitrate(bitrate);
    }

    command
      .on("start", cmd => {
        console.log("▶ FFmpeg start:", cmd);
      })
      .on("end", () => {
        console.log("✅ Convert done:", outputPath);
        res.download(outputPath, `${baseName}.${format}`, () => {
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);
        });
      })
      .on("error", err => {
        console.error("❌ FFmpeg error:", err);
        res.status(500).send("Convert failed");
      })
      .save(outputPath);

  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).send("Server error");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
