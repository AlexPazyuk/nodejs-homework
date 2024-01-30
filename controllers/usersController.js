const User = require('../models/user');
const { v4: uuidv4 } = require('uuid');
const { sendVerificationEmail } = require('./authController');

//! Verification//

const verifyUser = async (req, res, next) => {
  try {
    const { verificationToken } = req.params;

    const user = await User.findOne({ verificationToken });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Встановлюємо verificationToken в null і verify в true
    user.verificationToken = null;
    user.verify = true;
    await user.save();

    return res.status(200).json({ message: 'Verification successful' });
  } catch (error) {
    next(error);
  }
};

//! Repeat Verification email//

const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'missing required field email' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.verify) {
      return res.status(400).json({ message: 'Verification has already been passed' });
    }

    const verificationToken = uuidv4();
    user.verificationToken = verificationToken;
    await user.save();

    await sendVerificationEmail(user.email, verificationToken);

    return res.status(200).json({ message: 'Verification email sent' });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  verifyUser,
  resendVerificationEmail,
};
