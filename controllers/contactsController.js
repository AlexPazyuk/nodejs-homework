const Contact = require('../models/contacts');
const mongoose = require('mongoose');

// Отримання списку контактів
const getContacts = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const contactsList = await Contact.find({ owner: userId });
    console.log('Contacts:', contactsList);
    res.status(200).json(contactsList);
  } catch (error) {
    next(error);
  }
};

// Отримання конкретного контакту за ID
const getContactById = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: 'Not found' });
  }

  try {
    const contact = await Contact.findOne({ _id: id, owner: userId });

    if (contact) {
      res.status(200).json(contact);
    } else {
      res.status(404).json({ message: 'Not found' });
    }
  } catch (error) {
    next(error);
  }
};

// Створення нового контакту
const createContact = async (req, res, next) => {
  const { body } = req;

  try {
    const requiredFields = ['name', 'email', 'phone'];
    const missingField = requiredFields.find(field => !(field in body));

    if (missingField) {
      return res.status(400).json({ message: `missing required ${missingField} field` });
    }

    const newContact = await Contact.create(body);
    res.status(201).json(newContact);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// Видалення контакту за ID
const deleteContactById = async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: 'Not found' });
  }
  try {
    const removedContact = await Contact.findByIdAndDelete(id);

    if (removedContact) {
      res.status(200).json({ message: 'contact deleted' });
    } else {
      res.status(404).json({ message: 'Not found' });
    }
  } catch (error) {
    next(error);
  }
};

// Оновлення контакту за ID
const updateContactById = async (req, res, next) => {
  const { id } = req.params;
  const { body } = req;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: 'ID Not found' });
  }
  try {
    const updatedContact = await Contact.findByIdAndUpdate(id, body, { new: true });

    if (updatedContact) {
      res.status(200).json(updatedContact);
    } else {
      res.status(404).json({ message: 'Not found' });
    }
  } catch (error) {
    next(error);
  }
};

// Оновлення статусу улюбленого контакту за ID
const updateFavoriteStatus = async (req, res, next) => {
  const { id } = req.params;
  const { body } = req;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: 'Not found' });
  }
  try {
    const updatedContact = await Contact.findByIdAndUpdate(
      id,
      { favorite: body.favorite },
      { new: true }
    );

    if (updatedContact) {
      res.status(200).json(updatedContact);
    } else {
      res.status(404).json({ message: 'Not found' });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getContacts,
  getContactById,
  createContact,
  deleteContactById,
  updateContactById,
  updateFavoriteStatus,
};