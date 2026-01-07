// index.js - Mulid Tools Audio Convert Server (Render 안정판)
const express = require("express");
const fileUpload = require("express-fileupload");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const ffmpegPath = require("ffmpeg-static");

const app = express();
const PORT = process.env.PORT || 10000;

// ffmpeg 경로 지정
ffmpeg.setFfmpegPath(ffmpegPath);

// outputs 폴더 자동 생성
const outputDir = path.join(__dirname, "outputs");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

app.use(fileUpload());

// 루트 테스트
app.get("/", (req, res) => {
  res.send("Mulid Tools Server is running!");
});

// 오디오 변환
app.post("/convert/audio", async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).send("No file uploaded");
    }

    const uploadedFile = req.files.file;
    const format = req.body.format || "mp3";
    const bitrate = req.body.bitrate || "192"; // mp3 bitrate 기본값
    const originalName = path.parse(uploadedFile.name).name;
    const outputFile = path.join(outputDir, `${originalName}.${format}`);

    // 변환
    ffmpeg()
      .input(uploadedFile.data)
      .format(format)
      .audioBitrate(format === "mp3" ? bitrate : undefined)
      .on("error", (err) => {
        console.error("FFmpeg error:", err);
        res.status(500).send("Audio conversion failed");
      })
      .on("end", () => {
        res.download(outputFile, `${originalName}.${format}`, (err) => {
          if (err) console.error("Download error:", err);
          fs.unlinkSync(outputFile); // 변환 후 파일 삭제
        });
      })
      .save(outputFile);

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).send("Server error during conversion");
  }
});

app.listen(PORT, () => {
  console.log(`Mulid Tools Server is running on port ${PORT}`);
});
