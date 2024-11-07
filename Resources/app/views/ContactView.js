function ContactView(contactController) {
    this.contactController = contactController;
    this.window = Ti.UI.createWindow({ title: 'Contacts' });

    this.table = Ti.UI.createTableView({
        data: [],
        top: 0,
        bottom: 60,
        borderWidth: 1,
        borderColor: '#ccc'
    });
    this.window.add(this.table);

    this.addContactButton = Ti.UI.createButton({
        title: 'Add Contact',
        bottom: 10,
        width: '80%',
        height: 50,
        borderRadius: 8,
        backgroundColor: '#007bff',
        color: '#fff',
        font: { fontSize: 16, fontWeight: 'bold' },
        borderWidth: 1,
        borderColor: '#0056b3',
        shadowColor: '#333',
        shadowOffset: { x: 0, y: 5 },
        shadowRadius: 5
    });
    this.window.add(this.addContactButton);

    this.addContactButton.addEventListener('click', () => {
        this.showAddContactForm();
    });

    this.updateContactsList();
}

ContactView.prototype.getView = function() {
    return this.window;
};

ContactView.prototype.showAddContactForm = function() {
    this.formWindow = Ti.UI.createWindow({ title: 'Add Contact' });

    const nameInput = Ti.UI.createTextField({
        hintText: 'Name',
        top: 20,
        width: '80%',
        height: 40,
        borderRadius: 8,
        borderColor: '#ccc',
        paddingLeft: 10,
        font: { fontSize: 16 }
    });

    const emailInput = Ti.UI.createTextField({
        hintText: 'Email',
        top: 80,
        width: '80%',
        height: 40,
        borderRadius: 8,
        paddingLeft: 10,
        font: { fontSize: 16 }
    });

    const phoneInput = Ti.UI.createTextField({
        hintText: 'Phone',
        top: 140,
        width: '80%',
        height: 40,
        borderRadius: 8,
        paddingLeft: 10,
        font: { fontSize: 16 }
    });

    const addButton = Ti.UI.createButton({
        title: 'Add Contact',
        bottom: 20,
        width: '80%',
        height: 50,
        borderRadius: 8,
        backgroundColor: '#28a745',
        color: '#fff',
        font: { fontSize: 16, fontWeight: 'bold' }
    });

    addButton.addEventListener('click', () => {
        const name = nameInput.value;
        const email = emailInput.value;
        const phone = phoneInput.value;

        if (this.contactController.validateEmail(email) && this.contactController.validatePhone(phone)) {
            this.contactController.addContact(name, email, phone);
            this.formWindow.close();
            this.updateContactsList();
        } else {
            Ti.UI.createAlertDialog({
                title: 'Invalid Input',
                message: 'Please check email and phone number.'
            }).show();
        }
    });

    this.formWindow.add(nameInput);
    this.formWindow.add(emailInput);
    this.formWindow.add(phoneInput);
    this.formWindow.add(addButton);
    this.formWindow.open();
};

ContactView.prototype.showEditContactForm = function(index) {
    const contact = this.contactController.getContacts()[index];

    this.formWindow = Ti.UI.createWindow({ title: 'Edit Contact' });

    const nameInput = Ti.UI.createTextField({
        value: contact.name,
        top: 20,
        width: '80%',
        height: 40,
        borderRadius: 8,
        paddingLeft: 10,
        font: { fontSize: 16 }
    });

    const emailInput = Ti.UI.createTextField({
        value: contact.email,
        top: 80,
        width: '80%',
        height: 40,
        borderRadius: 8,
        paddingLeft: 10,
        font: { fontSize: 16 }
    });

    const phoneInput = Ti.UI.createTextField({
        value: contact.phone,
        top: 140,
        width: '80%',
        height: 40,
        borderRadius: 8,
        paddingLeft: 10,
        font: { fontSize: 16 }
    });

    const saveButton = Ti.UI.createButton({
        title: 'Save Changes',
        bottom: 20,
        width: '80%',
        height: 50,
        borderRadius: 8,
        backgroundColor: '#28a745',
        color: '#fff',
        font: { fontSize: 16, fontWeight: 'bold' }
    });

    saveButton.addEventListener('click', () => {
        const name = nameInput.value;
        const email = emailInput.value;
        const phone = phoneInput.value;

        if (this.contactController.validateEmail(email) && this.contactController.validatePhone(phone)) {
            this.contactController.updateContact(index, name, email, phone);
            this.formWindow.close();
            this.updateContactsList();
        } else {
            Ti.UI.createAlertDialog({
                title: 'Invalid Input',
                message: 'Please check email and phone number.'
            }).show();
        }
    });

    this.formWindow.add(nameInput);
    this.formWindow.add(emailInput);
    this.formWindow.add(phoneInput);
    this.formWindow.add(saveButton);
    this.formWindow.open();
};

ContactView.prototype.updateContactsList = function() {
    const rows = [];
    const contacts = this.contactController.getContacts();

    contacts.forEach((contact, index) => {
        const row = Ti.UI.createTableViewRow({
            layout: 'horizontal',
            height: Ti.UI.SIZE,
            backgroundColor: '#ffffff',
            borderColor: '#ccc',
            borderWidth: 1,
            borderRadius: 8,
            marginTop: 15
        });

        const contactInfoContainer = Ti.UI.createView({
            layout: 'vertical',
            width: '80%',
            height: Ti.UI.SIZE,
            padding: 10
        });

        const nameLabel = Ti.UI.createLabel({
            text: contact.name,
            color: '#333',
            font: { fontSize: 18, fontWeight: 'bold' },
            textAlign: 'left',
            height: Ti.UI.SIZE,
            left: 10,
        });

        const emailLabel = Ti.UI.createLabel({
            text: contact.email,
            color: '#777',
            font: { fontSize: 12 },
            textAlign: 'left',
            height: Ti.UI.SIZE,
            left: 10,
        });

        const phoneLabel = Ti.UI.createLabel({
            text: contact.phone,
            color: '#777',
            font: { fontSize: 12 },
            textAlign: 'left',
            height: Ti.UI.SIZE,
            left: 10,
        });

        contactInfoContainer.add(nameLabel);
        contactInfoContainer.add(emailLabel);
        contactInfoContainer.add(phoneLabel);

        const actionsContainer = Ti.UI.createView({
            layout: 'vertical',
            width: '20%',
            height: Ti.UI.SIZE,
            justifyContent: 'center',
            alignItems: 'flex-end',
            right: 0,
        });

        const editLabel = Ti.UI.createLabel({
            text: 'Edit',
            width: '100%',
            height: 30,
            top: 5,
            backgroundColor: '#28a745',
            borderRadius: 5,
            textAlign: 'center',
            color: '#fff',
            borderWidth: 1,
            borderColor: '#28a745',
            padding: 5,
        });

        editLabel.addEventListener('click', () => {
            this.showEditContactForm(index);
        });

        const deleteLabel = Ti.UI.createLabel({
            text: 'Delete',
            width: '100%',
            height: 30,
            top: 5,
            bottom: 5,
            backgroundColor: '#ff4136',
            borderRadius: 5,
            textAlign: 'center',
            color: '#fff',
            borderWidth: 1,
            borderColor: '#ff4136',
            padding: 5,
        });

        deleteLabel.addEventListener('click', () => {
            const deleteConfirmDialog = Ti.UI.createAlertDialog({
                title: 'Confirm Deletion',
                message: 'Are you sure you want to delete this contact?',
                buttonNames: ['Cancel', 'Delete'],
                cancel: 0
            });

            deleteConfirmDialog.addEventListener('click', (e) => {
                if (e.index === 1) {
                    this.contactController.deleteContact(index);
                    this.updateContactsList();
                }
            });

            deleteConfirmDialog.show();
        });

        actionsContainer.add(editLabel);
        actionsContainer.add(deleteLabel);

        row.add(contactInfoContainer);
        row.add(actionsContainer);
        rows.push(row);
    });

    this.table.setData(rows);
};

module.exports = ContactView;
