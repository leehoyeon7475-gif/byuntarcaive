const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const PASSWORD = "1234";

const UPLOAD_DIR = path.join(__dirname, 'uploads');
const DB_FILE = path.join(__dirname, 'posts.json');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify([]));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
  }
});

app.get('/api/posts', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: '게시물을 불러오지 못했습니다.' });
  }
});

app.post('/api/posts', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '사진 파일을 첨부해주세요.' });
  }

  const { author, caption } = req.body;
  const newPost = {
    id: Date.now(),
    author: author || '익명',
    caption: caption || '',
    imageUrl: `/uploads/${req.file.filename}`,
    createdAt: new Date().toLocaleString('ko-KR')
  };

  try {
    const posts = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    posts.unshift(newPost);
    fs.writeFileSync(DB_FILE, JSON.stringify(posts, null, 2));
    res.json({ success: true, post: newPost });
  } catch (err) {
    res.status(500).json({ error: '저장 실패' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 아카이브 서버 실행 중: http://localhost:${PORT}`);
});