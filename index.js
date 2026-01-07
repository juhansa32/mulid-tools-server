// 1️⃣ 필수 패키지 불러오기
const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 2️⃣ 미들웨어
app.use(cors()); // 모든 도메인에서 요청 허용
app.use(express.json());
app.use(fileUpload());
app.use('/outputs', express.static(path.join(__dirname, 'outputs')));

// 3️⃣ 업로드 & 변환 라우트 (예제: 오디오/영상/이미지)
app.post('/convert/:type', async (req, res) => {
  try {
    if (!req.files || !req.files.file) return res.json({ success: false, message: '파일 없음' });
    const file = req.files.file;
    const type = req.params.type; // audio, video, image
    const ext = path.extname(file.name).toLowerCase();
    const timestamp = Date.now();
    const outputFileName = `/outputs/${path.parse(file.name).name}-${timestamp}.${type === 'audio' ? 'wav' : type === 'video' ? 'mp4' : 'png'}`;
    const outputPath = path.join(__dirname, outputFileName);

    // 파일 그대로 저장 (실제 ffmpeg 변환은 여기서 하면 됨)
    await file.mv(outputPath);

    res.json({ success: true, output: outputFileName });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
});

// 4️⃣ 서버 실행
app.get('/', (req, res) => {
  res.send('Mulid Tools Server is running!');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});