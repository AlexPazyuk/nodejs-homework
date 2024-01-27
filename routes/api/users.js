const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const multer = require('multer');
const Jimp = require('jimp');
const gravatar = require('gravatar');
const User = require('../../models/user');
const authMiddleware = require('../../middleware/authMiddleware');

const userJoiSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const loginJoiSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// !Регістрація

router.post('/register', async (req, res, next) => {
    try {
    const { error } = userJoiSchema.validate(req.body);
      if (error) {
      return res.status(400).json({ message: error.message });
    }

    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email in use' });
    }

      const hashedPassword = await bcrypt.hash(password, 10);
      const avatarURL = gravatar.url(email, { s: '250' }, true);

    const newUser = await User.create({
      email,
      password: hashedPassword,
       avatarURL,
    });

    res.status(201).json({
      user: {
        email: newUser.email,
        subscription: newUser.subscription,
        avatarURL: newUser.avatarURL,
      },
    });
  } catch (error) {
    next(error);
  }
});


// !Логін

router.post('/login' , async (req, res, next) => {
  const { error } = loginJoiSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Email or password is wrong' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '2h',
    });

    user.token = token;
    await user.save();

    const userData = {
      email: user.email,
      subscription: user.subscription,
    };

    res.status(200).json({ token, user: userData });
  } catch (error) {
    next(error);
  }
});
 
// !Логаут

router.post('/logout', authMiddleware, async (req, res, next) => {
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);

      if (!user) {
        console.log('hi')
      return res.status(401).json({ message: 'Not authorized' });
    }

    user.token = null; // Видалення токену у користувача
    await user.save();

    res.status(204).end(); // Успішна відповідь без тіла
  } catch (error) {
    next(error);
  }
});

// !Поточний користувач

router.get('/current', authMiddleware, async (req, res, next) => {
  try {
    const currentUser = req.user;

    if (currentUser) {
      res.status(200).json({
        email: currentUser.email,
        subscription: currentUser.subscription,
      });
    } else {
      res.status(401).json({ message: 'Not authorized' });
    }
  } catch (error) {
    next(error);
  }
});


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
