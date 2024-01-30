const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/user');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const Jimp = require('jimp');
const gravatar = require('gravatar');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

const multerMiddleware = require('../middleware/multerMiddleware');


const userJoiSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const loginJoiSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// !Verification//

const sendVerificationEmail = async (email, verificationToken) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'example-email@meta.ua',
      pass: 'Example-password-1234',
    },
  });

  const mailOptions = {
    from: 'example-email@meta.ua',
    to: email,
    subject: 'Verify Your Email',
    text: `Click the following link to verify your email: http://localhost:3000/users/verify/${verificationToken}`,
  };

  await transporter.sendMail(mailOptions);
};

// !Registration//

const register = async (req, res, next) => {
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
    const verificationToken = uuidv4();
    User.verificationToken = verificationToken;
    await User.save();

    await sendVerificationEmail(newUser.email, verificationToken);

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
};

// !Loging In//

const login = async (req, res, next) => {
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
      avatarURL: user.avatarURL,
    };

    res.status(200).json({ token, user: userData });
  } catch (error) {
    next(error);
  }
};

// !Loging Out//

const logout = async (req, res, next) => {
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
};

// !Current User//

const getCurrentUser = async (req, res, next) => {
  try {
    res.status(200).json({
      email: req.user.email,
      subscription: req.user.subscription,
    });
  } catch (error) {
    next(error);
  }
};

// ! Avatar Update//

// Ендпойнт для оновлення аватарки
const updateAvatar = async (req, res, next) => {
  multerMiddleware.single('avatar')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: 'Multer error' });
    } else if (err) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }
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
  })
};
  


module.exports = { register, login, logout, getCurrentUser, updateAvatar};