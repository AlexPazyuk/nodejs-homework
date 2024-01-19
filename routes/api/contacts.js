// const express = require('express');
// const Joi = require('joi');

// const router = express.Router();

// const {
//   listContacts,
//   getContactById,
//   removeContact,
//   addContact,
//   updateContact,
// } = require('../../models/contacts');


// const contactSchema = Joi.object({
//   name: Joi.string().required(),
//   email: Joi.string().email().required(),
//   phone: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
// });

// const contactPutSchema = Joi.object({
//   name: Joi.string(),
//   email: Joi.string().email(),
//   phone: Joi.alternatives().try(Joi.string(), Joi.number()),
// });


// router.get('/', async (req, res, next) => {
//   try {
//     const contactsList = await listContacts();
//     console.log('Contacts:', contactsList);
//     res.status(200).json(contactsList);
//   } catch (error) {
//     next(error);
//   }
// });

// router.get('/:id', async (req, res, next) => {
//   const { id } = req.params;

//   try {
//     const contact = await getContactById(id);

//     if (contact) {
//       res.status(200).json(contact);
//     } else {
//       res.status(404).json({ message: 'Not found' });
//     }
//   } catch (error) {
//     next(error);
//   }
// });



// router.post('/', async (req, res, next) => {
//   const { body } = req;

//   try {
//     const { error } = contactSchema.validate(body);
// const requiredFields = ['name', 'email', 'phone'];

//     // Check if all required fields are present
//     const missingField = requiredFields.find(field => !(field in body));

//     if (missingField) {
//       return res.status(400).json({ message: `missing required ${missingField} field` });
//     }
//     if (error) {
//       return res.status(400).json({ message: error.message });
//     }
    
//     const newContact = await addContact(body);
//     res.status(201).json(newContact);
//   } catch (error) {
//     next(error);
//   }
// });



// router.delete('/:id', async (req, res, next) => {
//   const { id } = req.params;

//   try {
//     const removedContact = await removeContact(id);

//     if (removedContact) {
//       res.status(200).json({ message: 'contact deleted' });
//     } else {
//       res.status(404).json({ message: 'Not found' });
//     }
//   } catch (error) {
//     next(error);
//   }
// });

// router.put('/:id', async (req, res, next) => {
//   const { id } = req.params;
//   const { body } = req;

//   try {
//     if (!body || Object.keys(body).length === 0) {
//       return res.status(400).json({ message: 'missing fields' });
//     }
//     const { error } = contactPutSchema.validate(body);

//     if (error) {
//       return res.status(400).json({ message: error.message });
//     }

//     const updatedContact = await updateContact(id, body);

//     if (updatedContact) {
//       res.status(200).json(updatedContact);
//     } else {
//       res.status(404).json({ message: 'Not found' });
//     }
//   } catch (error) {
//     next(error);
//   }
// });

// module.exports = router;


const express = require('express');
const Joi = require('joi');
const Contact = require('../../models/contacts');
const mongoose = require('mongoose');


const router = express.Router();

const contactJoiSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
});

const contactJoiPutSchema = Joi.object({
  name: Joi.string(),
  email: Joi.string().email(),
  phone: Joi.alternatives().try(Joi.string(), Joi.number()),
});

const contactJoiPatchSchema = Joi.object({
  favorite: Joi.boolean().required(),
});

router.get('/', async (req, res, next) => {
  try {
    const contactsList = await Contact.find({});
    console.log('Contacts:', contactsList);
    res.status(200).json(contactsList);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: 'Not found' });
  }

  try {
    const contact = await Contact.findById(id);

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
    const { error } = contactJoiSchema.validate(body);
    const requiredFields = ['name', 'email', 'phone'];
    const missingField = requiredFields.find(field => !(field in body));

    if (missingField) {
      return res.status(400).json({message:`missing required ${missingField} field`})
    }
    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const newContact = await Contact.create(body);
    res.status(201).json(newContact);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
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
});

router.put('/:id', async (req, res, next) => {
  const { id } = req.params;
  const { body } = req;
if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: 'ID Not found' });
  }
  try {
    if (!body || Object.keys(body).length === 0) {
      return res.status(400).json({ message: 'missing fields' });
    }

    const { error } = contactJoiPutSchema.validate(body);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const updatedContact = await Contact.findByIdAndUpdate(id, body, { new: true });

    if (updatedContact) {
      res.status(200).json(updatedContact);
    } else {
      res.status(404).json({ message: 'Not found' });
    }
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/favorite', async (req, res, next) => {
  const { id } = req.params;
  const { body } = req;
if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: 'Not found' });
  }
  try {
    if (!body || Object.keys(body).length === 0 || !('favorite' in body)) {
      return res.status(400).json({ message: 'missing field favorite' });
    }

    const { error } = contactJoiPatchSchema.validate(body);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

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
});

module.exports = router;

