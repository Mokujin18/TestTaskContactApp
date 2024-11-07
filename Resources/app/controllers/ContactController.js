class ContactController {
    constructor(contactView) {
        this.contacts = [];
        this.contactView = contactView;
    }

    getContacts() {
        return this.contacts;
    }

    addContact(name, email, phone) {
        if (this.contacts.some(contact => contact.email === email)) {
            Ti.UI.createAlertDialog({
                title: 'Error',
                message: 'Contact with this email already exists.'
            }).show();
            return;
        }
        this.contacts.push({ name, email, phone });
        this.contactView.updateContactsList();
    }

    updateContact(contactId, name, email, phone) {
        const contact = this.contacts[contactId];
        if (contact) {
            contact.name = name;
            contact.email = email;
            contact.phone = phone;
            console.info(`[INFO] Contact updated: ${JSON.stringify(contact)}`);
            this.contactView.updateContactsList();
        }
    }

    deleteContact(contactId) {
        if (contactId !== undefined && contactId >= 0 && contactId < this.contacts.length) {
            this.contacts.splice(contactId, 1);
            this.contactView.updateContactsList();
        } else {
            Ti.UI.createAlertDialog({
                title: 'Error',
                message: 'Invalid contact ID.'
            }).show();
        }
    }

    validateEmail(email) {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regex.test(email);
    }

    validatePhone(phone) {
        const regex = /^[0-9]{10}$/;
        return regex.test(phone);
    }
}

module.exports = ContactController;
