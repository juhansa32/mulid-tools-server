// index.js - Mulid Tools Server full version
const express = require("express");
const fileUpload = require("express-fileupload");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static"); // Render에서 FFmpeg 경로 지정
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 10000;

// FFmpeg 명시적 경로
ffmpeg.setFfmpegPath(ffmpegPath);

// 업로드된 파일 임시 폴더 + 출력 폴더
const UPLOAD_DIR = path.join(__dirname, "uploads");
const OUTPUT_DIR = path.join(__dirname, "outputs");

// 폴더 없으면 생성
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

app.use(fileUpload());

// 상태 체크
app.get("/", (req, res) => {
  res.send("Mulid Tools Server is running!");
});

// 오디오 변환
app.post("/convert/audio", async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).send("파일이 업로드되지 않았습니다.");
    }

    const audioFile = req.files.file;
    const format = req.body.format || "mp3";
    const bitrate = req.body.bitrate || "192";

    // 업로드 임시 저장
    const inputPath = path.join(UPLOAD_DIR, audioFile.name);
    await audioFile.mv(inputPath);

    // 출력 파일 이름
    const timestamp = Date.now();
    const ext = format.toLowerCase();
    const outputFileName = `${path.parse(audioFile.name).name}-${timestamp}.${ext}`;
    const outputPath = path.join(OUTPUT_DIR, outputFileName);

    // FFmpeg 변환
    ffmpeg(inputPath)
      .toFormat(ext)
      .audioBitrate(bitrate)
      .on("error", (err) => {
        console.error("FFmpeg error:", err);
        res.status(500).send("변환 실패: " + err.message);
      })
      .on("end", () => {
        console.log(`✅ Convert done: ${outputPath}`);
        res.download(outputPath, outputFileName, (err) => {
          if (err) console.error("Download error:", err);
          // 임시 파일 삭제
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);
        });
      })
      .run();
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).send("서버 에러: " + err.message);
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
