const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(fileUpload());
app.use(express.json());

// outputs 폴더 자동 생성 (Render ENOENT 방지)
const outputsDir = path.join(__dirname, 'outputs');
if (!fs.existsSync(outputsDir)) {
  fs.mkdirSync(outputsDir, { recursive: true });
}

// 서버 상태 확인용
app.get('/', (req, res) => {
  res.send('Mulid Tools Server is running!');
});

// 업로드 + mp3 → wav 변환
app.post('/upload-and-convert', (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).send('No file uploaded');
  }

  const file = req.files.file;
  const timestamp = Date.now();
  const inputPath = path.join(outputsDir, `${timestamp}-${file.name}`);
  const outputPath = path.join(outputsDir, `converted-${timestamp}.wav`);

  file.mv(inputPath, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('File upload failed');
    }

    const cmd = `ffmpeg -y -i "${inputPath}" "${outputPath}"`;

    exec(cmd, (error) => {
      // 입력 파일 삭제
      fs.unlinkSync(inputPath);

      if (error) {
        console.error(error);
        return res.status(500).send('Conversion failed');
      }

      // ⭐ 핵심: 새 창 ❌ → 바로 다운로드 ⬇️
      res.download(outputPath, () => {
        // 다운로드 끝나면 결과 파일도 삭제 (서버 용량 보호)
        fs.unlinkSync(outputPath);
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
