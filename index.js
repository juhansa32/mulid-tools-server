const express = require('express');
const fileUpload = require('express-fileupload');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   필수 폴더 자동 생성
========================= */
const uploadsDir = path.join(__dirname, 'uploads');
const outputsDir = path.join(__dirname, 'outputs');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(outputsDir)) {
  fs.mkdirSync(outputsDir, { recursive: true });
}

/* =========================
   미들웨어
========================= */
app.use(fileUpload());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   서버 확인용
========================= */
app.get('/', (req, res) => {
  res.send('Mulid Tools Server is running!');
});

/* =========================
   업로드 & 변환 API
========================= */
app.post('/upload-and-convert', async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: '파일이 없습니다' });
    }

    const uploadedFile = req.files.file;
    const inputPath = path.join(uploadsDir, uploadedFile.name);
    const outputName = `${path.parse(uploadedFile.name).name}-${Date.now()}.wav`;
    const outputPath = path.join(outputsDir, outputName);

    await uploadedFile.mv(inputPath);

    ffmpeg(inputPath)
      .toFormat('wav')
      .on('end', () => {
        fs.unlinkSync(inputPath);
        res.download(outputPath, outputName, () => {
          fs.unlinkSync(outputPath);
        });
      })
      .on('error', (err) => {
        console.error(err);
        res.status(500).json({ error: '변환 실패' });
      })
      .save(outputPath);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   서버 시작
========================= */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
