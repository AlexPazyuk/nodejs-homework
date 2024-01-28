const multer = require('multer');
const path = require('path');

// Папка для завантаження тимчасових файлів
const uploadDir = path.join(__dirname, '../tmp');

// Конфігурація Multer
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

module.exports = upload;
