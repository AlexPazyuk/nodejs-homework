const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const authController = require('../../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.get('/current', authMiddleware, authController.getCurrentUser);
router.patch('/avatars', authMiddleware, authController.updateAvatar);



// !Оновлення аватарки

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

// Ендпойнт для оновлення аватарки
router.patch(
  '/avatars',
  authMiddleware,
  upload.single('avatar'),
  async (req, res, next) => {
    try {
      // Перевірка чи був завантажений файл
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const user = req.user;
      const tmpFilePath = req.file.path;

      // Використовуємо бібліотеку Jimp для зміни розмірів та обробки зображення
      const image = await Jimp.read(tmpFilePath);
      await image.resize(250, 250);
      const avatarBuffer = await image.getBufferAsync(Jimp.AUTO);

      // Зберігаємо оброблену аватарку в папку public/avatars з унікальним ім'ям
      const avatarFileName = `${user._id.toString()}${path.extname(req.file.originalname)}`;
      const avatarFilePath = path.join(__dirname, '../public/avatars', avatarFileName);
      await fs.writeFile(avatarFilePath, avatarBuffer);

      // Оновлюємо поле avatarURL користувача
      user.avatarURL = `/avatars/${avatarFileName}`;
      await user.save();

      // Видаляємо тимчасовий файл
      await fs.unlink(tmpFilePath);

      res.status(200).json({ avatarURL: user.avatarURL });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
