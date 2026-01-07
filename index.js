// index.js - Render 안정형 Mulid Tools Audio Server
const express = require("express");
const fileUpload = require("express-fileupload");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 10000;

// outputs 폴더 존재 확인
const outputDir = path.join(__dirname, "outputs");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// 미들웨어
app.use(fileUpload());
app.use(express.static(path.join(__dirname, "public"))); // HTML 위치

// 테스트용 기본 라우트
app.get("/", (req, res) => {
  res.send("Mulid Tools Server is running!");
});

// 오디오 변환
app.post("/convert/audio", async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).send("파일이 업로드되지 않았습니다.");
  }

  const uploadedFile = req.files.file;
  const format = req.body.format || "mp3"; // 기본 mp3
  const bitrate = req.body.bitrate || "192"; // mp3 음질 기본 192kbps

  // 임시 저장 경로
  const tempInputPath = path.join(outputDir, `temp-${Date.now()}-${uploadedFile.name}`);
  const ext = path.extname(uploadedFile.name);
  const outputFileName = path.basename(uploadedFile.name, ext) + "." + format;
  const outputFilePath = path.join(outputDir, outputFileName);

  try {
    // 업로드된 파일 임시 저장
    await uploadedFile.mv(tempInputPath);

    let command = ffmpeg(tempInputPath).output(outputFilePath);

    // mp3 음질 옵션
    if (format === "mp3") command.audioBitrate(bitrate);

    command
      .on("end", () => {
        // 변환 후 다운로드
        res.download(outputFilePath, outputFileName, (err) => {
          // 임시 파일 삭제
          fs.unlinkSync(tempInputPath);
          fs.unlinkSync(outputFilePath);
        });
      })
      .on("error", (err) => {
        console.error("FFmpeg 에러:", err);
        fs.unlinkSync(tempInputPath);
        return res.status(500).send("오디오 변환 실패");
      })
      .run();
  } catch (err) {
    console.error("서버 에러:", err);
    if (fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
    return res.status(500).send("오디오 변환 실패");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
