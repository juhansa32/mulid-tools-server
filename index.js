// ================================================
// Mulid Tools Server - Node.js + Express
// Render 배포용, 초보도 바로 사용 가능
// ================================================

// 필요한 패키지 로드
const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process'); // ffmpeg 명령어 사용

const app = express();
const PORT = process.env.PORT || 3000;

// 업로드된 파일과 결과물을 저장할 폴더
const OUTPUT_DIR = path.join(__dirname, 'outputs');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

// 파일 업로드 설정
app.use(fileUpload());

// 간단 테스트용 기본 라우트
app.get('/', (req, res) => {
  res.send('Mulid Tools Server is running!');
});

// =========================
// 변환 API
// =========================

// 오디오 변환 (mp3 → wav)
app.post('/convert/audio', async (req, res) => {
  if (!req.files || !req.files.file) return res.json({ success: false, message: '파일 없음' });

  const file = req.files.file;
  const inputPath = path.join(OUTPUT_DIR, file.name);
  const outputFileName = path.parse(file.name).name + '.wav';
  const outputPath = path.join(OUTPUT_DIR, outputFileName);

  // 업로드 파일 저장
  await file.mv(inputPath);

  // ffmpeg 명령어 실행
  exec(`ffmpeg -y -i "${inputPath}" "${outputPath}"`, (err) => {
    if (err) {
      console.error(err);
      return res.json({ success: false, message: '오디오 변환 실패' });
    }
    res.json({ success: true, output: `/outputs/${outputFileName}` });
  });
});

// 영상 변환 (mp4)
app.post('/convert/video', async (req, res) => {
  if (!req.files || !req.files.file) return res.json({ success: false, message: '파일 없음' });

  const file = req.files.file;
  const inputPath = path.join(OUTPUT_DIR, file.name);
  const outputFileName = path.parse(file.name).name + '.mp4';
  const outputPath = path.join(OUTPUT_DIR, outputFileName);

  await file.mv(inputPath);

  exec(`ffmpeg -y -i "${inputPath}" "${outputPath}"`, (err) => {
    if (err) {
      console.error(err);
      return res.json({ success: false, message: '영상 변환 실패' });
    }
    res.json({ success: true, output: `/outputs/${outputFileName}` });
  });
});

// 이미지 변환 (png)
app.post('/convert/image', async (req, res) => {
  if (!req.files || !req.files.file) return res.json({ success: false, message: '파일 없음' });

  const file = req.files.file;
  const inputPath = path.join(OUTPUT_DIR, file.name);
  const outputFileName = path.parse(file.name).name + '.png';
  const outputPath = path.join(OUTPUT_DIR, outputFileName);

  await file.mv(inputPath);

  exec(`ffmpeg -y -i "${inputPath}" "${outputPath}"`, (err) => {
    if (err) {
      console.error(err);
      return res.json({ success: false, message: '이미지 변환 실패' });
    }
    res.json({ success: true, output: `/outputs/${outputFileName}` });
  });
});

// =========================
// outputs 폴더 접근 허용
// =========================
app.use('/outputs', express.static(OUTPUT_DIR));

// 서버 시작
app.listen(PORT, () => {
  console.log(`Mulid Tools Server running on port ${PORT}`);
});

