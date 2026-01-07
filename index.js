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

// outputs 폴더 자동 생성
const outputsDir = path.join(__dirname, 'outputs');
if (!fs.existsSync(outputsDir)) {
  fs.mkdirSync(outputsDir, { recursive: true });
}

// 서버 확인
app.get('/', (req, res) => {
  res.send('Mulid Tools Server is running!');
});

// 오디오 변환 (포맷 선택)
app.post('/convert/audio', (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).send('No file uploaded');
  }

  const format = req.body.format || 'wav'; // 기본 wav
  const file = req.files.file;

  const timestamp = Date.now();
  const inputPath = path.join(outputsDir, `${timestamp}-${file.name}`);
  const outputPath = path.join(outputsDir, `converted-${timestamp}.${format}`);

  file.mv(inputPath, (err) => {
    if (err) return res.status(500).send('Upload failed');

    const cmd = `ffmpeg -y -i "${inputPath}" "${outputPath}"`;

    exec(cmd, (error) => {
      fs.unlinkSync(inputPath);

      if (error) {
        console.error(error);
        return res.status(500).send('Conversion failed');
      }

      res.download(outputPath, () => {
        fs.unlinkSync(outputPath);
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

