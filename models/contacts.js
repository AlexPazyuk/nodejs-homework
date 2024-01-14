const fs = require('fs/promises');
const path = require('path');

const contactsPath = path.join(__dirname,'contacts.json');

async function listContacts(){
  try {
    const data = await fs.readFile(contactsPath, 'utf-8');
    const parsedData = JSON.parse(data);
    return parsedData;
  } catch (error) {
    console.error(error)
    return [];
  }
};

async function getContactById(contactId) {
  try {
    const contacts = await listContacts();
    return contacts.find(contact => contact.id === contactId) || null;
  } catch (error) {
    return null;
  }
};

async function removeContact(contactId){
  try {
    const contacts = await listContacts();
    const updatedContacts = contacts.filter(contact => contact.id !== contactId);
    await fs.writeFile(contactsPath, JSON.stringify(updatedContacts, null, 2));

    const removedContact = contacts.find(contact => contact.id === contactId) || null;
    return removedContact;
  } catch (error) {
    return null;
  }
};

async function addContact(body){
  try {
    const newContact = { id: Date.now().toString(), ...body };
    const contacts = await listContacts();
    const updatedContacts = [...contacts, newContact];
    await fs.writeFile(contactsPath, JSON.stringify(updatedContacts, null, 2));

    return newContact;
  } catch (error) {
    return null;
  }
};

async function updateContact(contactId, body) {
  try {
    const contacts = await listContacts();
    const index = contacts.findIndex((contact) => contact.id === contactId);

    if (index === -1) {
      return { message: 'Not found' };
    }

    const updatedContact = { ...contacts[index], ...body };
    contacts[index] = updatedContact;

    await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2));

    return updatedContact;
  } catch (error) {
    return null;
  }
}

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
};
