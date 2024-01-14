const express = require('express');
const Joi = require('joi');

const router = express.Router();

const {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
} = require('../../models/contacts');


const contactSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
});



router.get('/', async (req, res, next) => {
  try {
    const contactsList = await listContacts();
    console.log('Contacts:', contactsList);
    res.status(200).json(contactsList);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  const { id } = req.params;

  try {
    const contact = await getContactById(id);

    if (contact) {
      res.status(200).json(contact);
    } else {
      res.status(404).json({ message: 'Not found' });
    }
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  const { body } = req;

  try {
    const { error } = contactSchema.validate(body);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const newContact = await addContact(body);
    res.status(201).json(newContact);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;

  try {
    const removedContact = await removeContact(id);

    if (removedContact) {
      res.status(200).json({ message: 'contact deleted' });
    } else {
      res.status(404).json({ message: 'Not found' });
    }
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  const { id } = req.params;
  const { body } = req;

  try {
    const { error } = contactSchema.validate(body);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const updatedContact = await updateContact(id, body);

    if (updatedContact) {
      res.status(200).json(updatedContact);
    } else {
      res.status(404).json({ message: 'Not found' });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
