const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

const app = express();
const PORT = process.env.PORT || 10000;

/* =========================
   기본 설정
========================= */

app.use(cors());
app.use(express.json());

console.log("🚀 Server booting...");
console.log("🎬 ffmpeg path:", ffmpegPath);

if (!ffmpegPath) {
  console.error("❌ ffmpeg-static path not found");
} else {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

/* =========================
   업로드 폴더 보장
========================= */

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log("📁 uploads folder created");
}

/* =========================
   Multer 설정
========================= */

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

/* =========================
   헬스 체크
========================= */

app.get("/", (req, res) => {
  res.send("✅ Mulid Audio Convert Server Alive");
});

/* =========================
   오디오 변환 라우트
========================= */

app.post("/convert/audio", upload.single("file"), (req, res) => {
  console.log("📥 /convert/audio called");

  try {
    if (!req.file) {
      console.error("❌ No file received");
      return res.status(400).send("No file uploaded");
    }

    const format = req.body.format || "mp3";
    const bitrate = req.body.bitrate || "192";

    console.log("📄 File:", req.file.originalname);
    console.log("🎯 Format:", format);
    console.log("🎚 Bitrate:", bitrate);

    const inputPath = req.file.path;
    const outputPath = path.join(
      uploadDir,
      `${req.file.filename}.${format}`
    );

    let command = ffmpeg(inputPath);

    if (format === "mp3") {
      command = command.audioBitrate(bitrate);
    }

    command
      .toFormat(format)
      .on("start", (cmd) => {
        console.log("▶ ffmpeg start:", cmd);
      })
      .on("error", (err) => {
        console.error("❌ ffmpeg error:", err.message);
        if (!res.headersSent) {
          res.status(500).send("Conversion failed");
        }
      })
      .on("end", () => {
        console.log("✅ ffmpeg finished");

        res.download(outputPath, (err) => {
          if (err) {
            console.error("❌ download error:", err);
          }

          // 파일 정리
          fs.unlink(inputPath, () => {});
          fs.unlink(outputPath, () => {});
        });
      })
      .save(outputPath);

  } catch (e) {
    console.error("🔥 Server exception:", e);
    res.status(500).send("Server crashed");
  }
});

/* =========================
   서버 시작
========================= */

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});