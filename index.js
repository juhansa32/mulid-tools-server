import express from "express";
import multer from "multer";
import cors from "cors";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const upload = multer({ dest: "uploads/" });

if (!fs.existsSync("outputs")) fs.mkdirSync("outputs");
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

app.post("/upload-and-convert", upload.single("file"), (req, res) => {
  const inputPath = req.file.path;
  const outputFile = `${Date.now()}.wav`;
  const outputPath = path.join("outputs", outputFile);

  exec(`ffmpeg -i ${inputPath} ${outputPath}`, (err) => {
    fs.unlinkSync(inputPath);

    if (err) {
      return res.status(500).json({ success: false });
    }

    res.json({
      success: true,
      file: outputFile,
      url: `/download/${outputFile}`
    });
  });
});

app.get("/download/:file", (req, res) => {
  const filePath = path.join("outputs", req.params.file);
  res.download(filePath);
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
