const checkFieldsMiddleware = (req, res, next) => {
  const { body } = req;

  if (!body || Object.keys(body).length === 0) {
    return res.status(400).json({ message: 'missing fields' });
  }

  next();
};

module.exports = checkFieldsMiddleware;
