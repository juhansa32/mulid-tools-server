const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(fileUpload());
app.use('/outputs', express.static(path.join(__dirname, 'outputs')));

// outputs 폴더 없으면 생성
if (!fs.existsSync('outputs')) fs.mkdirSync('outputs');

// 기본 테스트
app.get('/', (req, res) => {
    res.send('Mulid Tools Server is running!');
});

// ---------------------------
// 음악 / 영상 변환 (FFmpeg)
// ---------------------------
app.post('/convert/audio', async (req, res) => {
    if (!req.files || !req.files.file) return res.status(400).send('No file uploaded');
    const file = req.files.file;
    const format = req.body.format || 'wav';
    const outputName = `${Date.now()}.${format}`;
    const outputPath = path.join(__dirname, 'outputs', outputName);
    const inputPath = path.join(__dirname, 'outputs', file.name);

    await file.mv(inputPath);

    exec(`ffmpeg -y -i "${inputPath}" "${outputPath}"`, (err) => {
        fs.unlinkSync(inputPath);
        if (err) return res.status(500).send(err.message);
        res.json({ success: true, output: `/outputs/${outputName}` });
    });
});

app.post('/convert/video', async (req, res) => {
    if (!req.files || !req.files.file) return res.status(400).send('No file uploaded');
    const file = req.files.file;
    const format = req.body.format || 'mp4';
    const outputName = `${Date.now()}.${format}`;
    const outputPath = path.join(__dirname, 'outputs', outputName);
    const inputPath = path.join(__dirname, 'outputs', file.name);

    await file.mv(inputPath);

    exec(`ffmpeg -y -i "${inputPath}" "${outputPath}"`, (err) => {
        fs.unlinkSync(inputPath);
        if (err) return res.status(500).send(err.message);
        res.json({ success: true, output: `/outputs/${outputName}` });
    });
});

// ---------------------------
// 이미지 변환 (PNG/JPG/GIF)
// ---------------------------
app.post('/convert/image', async (req, res) => {
    if (!req.files || !req.files.file) return res.status(400).send('No file uploaded');
    const file = req.files.file;
    const format = req.body.format || 'png';
    const outputName = `${Date.now()}.${format}`;
    const outputPath = path.join(__dirname, 'outputs', outputName);
    const inputPath = path.join(__dirname, 'outputs', file.name);

    await file.mv(inputPath);

    exec(`ffmpeg -y -i "${inputPath}" "${outputPath}"`, (err) => {
        fs.unlinkSync(inputPath);
        if (err) return res.status(500).send(err.message);
        res.json({ success: true, output: `/outputs/${outputName}` });
    });
});

// ---------------------------
// 파일 다운로드
// ---------------------------
app.get('/download/:file', (req, res) => {
    const filePath = path.join(__dirname, 'outputs', req.params.file);
    if (!fs.existsSync(filePath)) return res.status(404).send('File not found');
    res.download(filePath);
});

// ---------------------------
// TODO: 문서, 전자책, 글꼴, 아카이브, OCR, 자막 변환
// 구조만 placeholder
// ---------------------------
app.post('/convert/document', (req,res)=> res.json({success:true, message:"Document conversion placeholder"}));
app.post('/convert/ebook', (req,res)=> res.json({success:true, message:"Ebook conversion placeholder"}));
app.post('/convert/font', (req,res)=> res.json({success:true, message:"Font conversion placeholder"}));
app.post('/convert/archive', (req,res)=> res.json({success:true, message:"Archive conversion placeholder"}));
app.post('/convert/ocr', (req,res)=> res.json({success:true, message:"OCR placeholder"}));
app.post('/convert/subtitle', (req,res)=> res.json({success:true, message:"Subtitle conversion placeholder"}));

app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));
