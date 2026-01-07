const express = require("express");
const fileUpload = require("express-fileupload");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

/* ===============================
   기본 미들웨어
================================ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload({
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    abortOnLimit: true,
  })
);

/* ===============================
   outputs 폴더 보장
================================ */
const OUTPUT_DIR = path.join(__dirname, "outputs");
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
  console.log("📁 outputs 폴더 생성됨");
}

/* ===============================
   서버 상태 확인
================================ */
app.get("/", (req, res) => {
  res.send("Mulid Tools Server is running!");
});

/* ===============================
   🎵 오디오 변환 API
   POST /convert/audio
================================ */
app.post("/convert/audio", async (req, res) => {
  console.log("➡️ 요청 들어옴");

  try {
    if (!req.files || !req.files.file) {
      console.error("❌ 파일 없음");
      return res.status(400).json({ error: "파일이 없습니다" });
    }

    const file = req.files.file;
    const format = req.body.format || "mp3";
    const bitrate = req.body.bitrate || "192";

    console.log("📄 파일명:", file.name);
    console.log("🎯 포맷:", format, "비트레이트:", bitrate);

    const inputPath = path.join(OUTPUT_DIR, `input-${Date.now()}-${file.name}`);
    const outputPath = path.join(
      OUTPUT_DIR,
      `converted-${Date.now()}.${format}`
    );

    await file.mv(inputPath);
    console.log("✅ 업로드 완료:", inputPath);

    let command = ffmpeg(inputPath);

    if (format === "mp3") {
      command = command.audioBitrate(bitrate);
    }

    command
      .toFormat(format)
      .on("start", (cmd) => {
        console.log("🚀 FFmpeg 시작:", cmd);
      })
      .on("error", (err) => {
        console.error("❌ FFmpeg 오류:", err.message);
        if (!res.headersSent) {
          res.status(500).json({ error: "변환 실패" });
        }
      })
      .on("end", () => {
        console.log("✅ 변환 완료:", outputPath);

        res.download(outputPath, () => {
          console.log("⬇️ 다운로드 완료");

          // 정리
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);
        });
      })
      .save(outputPath);
  } catch (err) {
    console.error("🔥 서버 에러:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

/* ===============================
   서버 실행
================================ */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
