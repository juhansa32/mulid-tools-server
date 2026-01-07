const express = require("express");
const fileUpload = require("express-fileupload");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3000;

/* ===============================
   기본 설정
================================ */
app.use(fileUpload());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Mulid Tools Server is running!");
});

/* ===============================
   폴더 준비 (중요)
================================ */
const uploadDir = path.join(__dirname, "uploads");
const outputDir = path.join(__dirname, "outputs");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

/* ===============================
   오디오 변환 API
   POST /convert/audio
================================ */
app.post("/convert/audio", async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).send("파일이 없습니다");
    }

    const inputFile = req.files.file;
    const format = req.body.format || "wav";

    const timestamp = Date.now();
    const inputPath = path.join(uploadDir, `${timestamp}-${inputFile.name}`);
    const outputPath = path.join(outputDir, `converted-${timestamp}.${format}`);

    // 파일 저장
    await inputFile.mv(inputPath);

    /* ===============================
       FFmpeg 명령어
    ================================ */
    let ffmpegCmd = "";

    if (format === "mp3") {
      ffmpegCmd = `ffmpeg -y -i "${inputPath}" -vn -acodec libmp3lame -ab 192k "${outputPath}"`;
    } else if (format === "wav") {
      ffmpegCmd = `ffmpeg -y -i "${inputPath}" "${outputPath}"`;
    } else if (format === "ogg") {
      ffmpegCmd = `ffmpeg -y -i "${inputPath}" -acodec libvorbis "${outputPath}"`;
    } else if (format === "m4a") {
      ffmpegCmd = `ffmpeg -y -i "${inputPath}" -acodec aac "${outputPath}"`;
    } else {
      return res.status(400).send("지원하지 않는 포맷");
    }

    /* ===============================
       FFmpeg 실행 (중요!)
       → 끝난 다음에만 다운로드
    ================================ */
    exec(ffmpegCmd, (error) => {
      if (error) {
        console.error("FFmpeg 오류:", error);
        return res.status(500).send("변환 실패");
      }

      // 파일 존재 확인
      if (!fs.existsSync(outputPath)) {
        return res.status(500).send("출력 파일 생성 실패");
      }

      // 다운로드
      res.download(outputPath, () => {
        // 정리 (선택)
        fs.unlink(inputPath, () => {});
        fs.unlink(outputPath, () => {});
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("서버 오류");
  }
});

/* ===============================
   서버 시작
================================ */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
