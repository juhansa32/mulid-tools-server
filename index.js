const express = require("express");
const fileUpload = require("express-fileupload");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// 업로드 설정
app.use(fileUpload());
app.use(express.json());

// outputs 폴더 보장
const OUTPUT_DIR = path.join(__dirname, "outputs");
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// 서버 상태 확인
app.get("/", (req, res) => {
  res.send("Mulid Tools Server is running!");
});

// 오디오 변환
app.post("/convert/audio", async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).send("파일이 없습니다.");
  }

  const file = req.files.file;
  const format = req.body.format;
  const bitrate = req.body.bitrate || "192"; // MP3 기본값

  const inputPath = path.join(OUTPUT_DIR, file.name);
  const outputName =
    path.parse(file.name).name + "-" + Date.now() + "." + format;
  const outputPath = path.join(OUTPUT_DIR, outputName);

  // 파일 저장
  await file.mv(inputPath);

  // ffmpeg 명령어
  let command = "";

  if (format === "mp3") {
    command = `ffmpeg -y -i "${inputPath}" -ab ${bitrate}k "${outputPath}"`;
  } else {
    command = `ffmpeg -y -i "${inputPath}" "${outputPath}"`;
  }

  exec(command, (error) => {
    fs.unlinkSync(inputPath); // 원본 삭제

    if (error) {
      console.error(error);
      return res.status(500).send("변환 실패");
    }

    res.download(outputPath, () => {
      fs.unlinkSync(outputPath); // 다운로드 후 삭제
    });
  });
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});