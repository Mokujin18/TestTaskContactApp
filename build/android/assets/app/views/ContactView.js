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

ContactView.prototype.getView = function () {
  return this.window;
};

ContactView.prototype.showAddContactForm = function () {
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

ContactView.prototype.showEditContactForm = function (index) {
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

ContactView.prototype.updateContactsList = function () {
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
      left: 10
    });

    const emailLabel = Ti.UI.createLabel({
      text: contact.email,
      color: '#777',
      font: { fontSize: 12 },
      textAlign: 'left',
      height: Ti.UI.SIZE,
      left: 10
    });

    const phoneLabel = Ti.UI.createLabel({
      text: contact.phone,
      color: '#777',
      font: { fontSize: 12 },
      textAlign: 'left',
      height: Ti.UI.SIZE,
      left: 10
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
      right: 0
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
      padding: 5
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
      padding: 5
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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LEVBQUUsQ0FBQzBELENBQUMsS0FBSztRQUNqRCxJQUFJQSxDQUFDLENBQUNoQyxLQUFLLEtBQUssQ0FBQyxFQUFFO1VBQ2YsSUFBSSxDQUFDdkQsaUJBQWlCLENBQUN3RixhQUFhLENBQUNqQyxLQUFLLENBQUM7VUFDM0MsSUFBSSxDQUFDeEIsa0JBQWtCLEVBQUU7UUFDN0I7TUFDSixDQUFDLENBQUM7O01BRUZxRCxtQkFBbUIsQ0FBQ2hDLElBQUksRUFBRTtJQUM5QixDQUFDLENBQUM7O0lBRUYwQixnQkFBZ0IsQ0FBQ2pFLEdBQUcsQ0FBQ3FFLFNBQVMsQ0FBQztJQUMvQkosZ0JBQWdCLENBQUNqRSxHQUFHLENBQUNzRSxXQUFXLENBQUM7O0lBRWpDcEIsR0FBRyxDQUFDbEQsR0FBRyxDQUFDdUQsb0JBQW9CLENBQUM7SUFDN0JMLEdBQUcsQ0FBQ2xELEdBQUcsQ0FBQ2lFLGdCQUFnQixDQUFDO0lBQ3pCbEIsSUFBSSxDQUFDNkIsSUFBSSxDQUFDMUIsR0FBRyxDQUFDO0VBQ2xCLENBQUMsQ0FBQzs7RUFFRixJQUFJLENBQUN6RCxLQUFLLENBQUNvRixPQUFPLENBQUM5QixJQUFJLENBQUM7QUFDNUIsQ0FBQzs7QUFFRCtCLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHN0YsV0FBVyIsIm5hbWVzIjpbIkNvbnRhY3RWaWV3IiwiY29udGFjdENvbnRyb2xsZXIiLCJ3aW5kb3ciLCJUaSIsIlVJIiwiY3JlYXRlV2luZG93IiwidGl0bGUiLCJ0YWJsZSIsImNyZWF0ZVRhYmxlVmlldyIsImRhdGEiLCJ0b3AiLCJib3R0b20iLCJib3JkZXJXaWR0aCIsImJvcmRlckNvbG9yIiwiYWRkIiwiYWRkQ29udGFjdEJ1dHRvbiIsImNyZWF0ZUJ1dHRvbiIsIndpZHRoIiwiaGVpZ2h0IiwiYm9yZGVyUmFkaXVzIiwiYmFja2dyb3VuZENvbG9yIiwiY29sb3IiLCJmb250IiwiZm9udFNpemUiLCJmb250V2VpZ2h0Iiwic2hhZG93Q29sb3IiLCJzaGFkb3dPZmZzZXQiLCJ4IiwieSIsInNoYWRvd1JhZGl1cyIsImFkZEV2ZW50TGlzdGVuZXIiLCJzaG93QWRkQ29udGFjdEZvcm0iLCJ1cGRhdGVDb250YWN0c0xpc3QiLCJwcm90b3R5cGUiLCJnZXRWaWV3IiwiZm9ybVdpbmRvdyIsIm5hbWVJbnB1dCIsImNyZWF0ZVRleHRGaWVsZCIsImhpbnRUZXh0IiwicGFkZGluZ0xlZnQiLCJlbWFpbElucHV0IiwicGhvbmVJbnB1dCIsImFkZEJ1dHRvbiIsIm5hbWUiLCJ2YWx1ZSIsImVtYWlsIiwicGhvbmUiLCJ2YWxpZGF0ZUVtYWlsIiwidmFsaWRhdGVQaG9uZSIsImFkZENvbnRhY3QiLCJjbG9zZSIsImNyZWF0ZUFsZXJ0RGlhbG9nIiwibWVzc2FnZSIsInNob3ciLCJvcGVuIiwic2hvd0VkaXRDb250YWN0Rm9ybSIsImluZGV4IiwiY29udGFjdCIsImdldENvbnRhY3RzIiwic2F2ZUJ1dHRvbiIsInVwZGF0ZUNvbnRhY3QiLCJyb3dzIiwiY29udGFjdHMiLCJmb3JFYWNoIiwicm93IiwiY3JlYXRlVGFibGVWaWV3Um93IiwibGF5b3V0IiwiU0laRSIsIm1hcmdpblRvcCIsImNvbnRhY3RJbmZvQ29udGFpbmVyIiwiY3JlYXRlVmlldyIsInBhZGRpbmciLCJuYW1lTGFiZWwiLCJjcmVhdGVMYWJlbCIsInRleHQiLCJ0ZXh0QWxpZ24iLCJsZWZ0IiwiZW1haWxMYWJlbCIsInBob25lTGFiZWwiLCJhY3Rpb25zQ29udGFpbmVyIiwianVzdGlmeUNvbnRlbnQiLCJhbGlnbkl0ZW1zIiwicmlnaHQiLCJlZGl0TGFiZWwiLCJkZWxldGVMYWJlbCIsImRlbGV0ZUNvbmZpcm1EaWFsb2ciLCJidXR0b25OYW1lcyIsImNhbmNlbCIsImUiLCJkZWxldGVDb250YWN0IiwicHVzaCIsInNldERhdGEiLCJtb2R1bGUiLCJleHBvcnRzIl0sInNvdXJjZVJvb3QiOiIvVXNlcnMva3VyeXNoY2h1ay9Xb3JrL0p1c3RJdC9Db250YWN0QXBwL1Jlc291cmNlcy9hcHAvdmlld3MiLCJzb3VyY2VzIjpbIkNvbnRhY3RWaWV3LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImZ1bmN0aW9uIENvbnRhY3RWaWV3KGNvbnRhY3RDb250cm9sbGVyKSB7XG4gICAgdGhpcy5jb250YWN0Q29udHJvbGxlciA9IGNvbnRhY3RDb250cm9sbGVyO1xuICAgIHRoaXMud2luZG93ID0gVGkuVUkuY3JlYXRlV2luZG93KHsgdGl0bGU6ICdDb250YWN0cycgfSk7XG5cbiAgICB0aGlzLnRhYmxlID0gVGkuVUkuY3JlYXRlVGFibGVWaWV3KHtcbiAgICAgICAgZGF0YTogW10sXG4gICAgICAgIHRvcDogMCxcbiAgICAgICAgYm90dG9tOiA2MCxcbiAgICAgICAgYm9yZGVyV2lkdGg6IDEsXG4gICAgICAgIGJvcmRlckNvbG9yOiAnI2NjYydcbiAgICB9KTtcbiAgICB0aGlzLndpbmRvdy5hZGQodGhpcy50YWJsZSk7XG5cbiAgICB0aGlzLmFkZENvbnRhY3RCdXR0b24gPSBUaS5VSS5jcmVhdGVCdXR0b24oe1xuICAgICAgICB0aXRsZTogJ0FkZCBDb250YWN0JyxcbiAgICAgICAgYm90dG9tOiAxMCxcbiAgICAgICAgd2lkdGg6ICc4MCUnLFxuICAgICAgICBoZWlnaHQ6IDUwLFxuICAgICAgICBib3JkZXJSYWRpdXM6IDgsXG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogJyMwMDdiZmYnLFxuICAgICAgICBjb2xvcjogJyNmZmYnLFxuICAgICAgICBmb250OiB7IGZvbnRTaXplOiAxNiwgZm9udFdlaWdodDogJ2JvbGQnIH0sXG4gICAgICAgIGJvcmRlcldpZHRoOiAxLFxuICAgICAgICBib3JkZXJDb2xvcjogJyMwMDU2YjMnLFxuICAgICAgICBzaGFkb3dDb2xvcjogJyMzMzMnLFxuICAgICAgICBzaGFkb3dPZmZzZXQ6IHsgeDogMCwgeTogNSB9LFxuICAgICAgICBzaGFkb3dSYWRpdXM6IDVcbiAgICB9KTtcbiAgICB0aGlzLndpbmRvdy5hZGQodGhpcy5hZGRDb250YWN0QnV0dG9uKTtcblxuICAgIHRoaXMuYWRkQ29udGFjdEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgdGhpcy5zaG93QWRkQ29udGFjdEZvcm0oKTtcbiAgICB9KTtcblxuICAgIHRoaXMudXBkYXRlQ29udGFjdHNMaXN0KCk7XG59XG5cbkNvbnRhY3RWaWV3LnByb3RvdHlwZS5nZXRWaWV3ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMud2luZG93O1xufTtcblxuQ29udGFjdFZpZXcucHJvdG90eXBlLnNob3dBZGRDb250YWN0Rm9ybSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZm9ybVdpbmRvdyA9IFRpLlVJLmNyZWF0ZVdpbmRvdyh7IHRpdGxlOiAnQWRkIENvbnRhY3QnIH0pO1xuXG4gICAgY29uc3QgbmFtZUlucHV0ID0gVGkuVUkuY3JlYXRlVGV4dEZpZWxkKHtcbiAgICAgICAgaGludFRleHQ6ICdOYW1lJyxcbiAgICAgICAgdG9wOiAyMCxcbiAgICAgICAgd2lkdGg6ICc4MCUnLFxuICAgICAgICBoZWlnaHQ6IDQwLFxuICAgICAgICBib3JkZXJSYWRpdXM6IDgsXG4gICAgICAgIGJvcmRlckNvbG9yOiAnI2NjYycsXG4gICAgICAgIHBhZGRpbmdMZWZ0OiAxMCxcbiAgICAgICAgZm9udDogeyBmb250U2l6ZTogMTYgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgZW1haWxJbnB1dCA9IFRpLlVJLmNyZWF0ZVRleHRGaWVsZCh7XG4gICAgICAgIGhpbnRUZXh0OiAnRW1haWwnLFxuICAgICAgICB0b3A6IDgwLFxuICAgICAgICB3aWR0aDogJzgwJScsXG4gICAgICAgIGhlaWdodDogNDAsXG4gICAgICAgIGJvcmRlclJhZGl1czogOCxcbiAgICAgICAgcGFkZGluZ0xlZnQ6IDEwLFxuICAgICAgICBmb250OiB7IGZvbnRTaXplOiAxNiB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBwaG9uZUlucHV0ID0gVGkuVUkuY3JlYXRlVGV4dEZpZWxkKHtcbiAgICAgICAgaGludFRleHQ6ICdQaG9uZScsXG4gICAgICAgIHRvcDogMTQwLFxuICAgICAgICB3aWR0aDogJzgwJScsXG4gICAgICAgIGhlaWdodDogNDAsXG4gICAgICAgIGJvcmRlclJhZGl1czogOCxcbiAgICAgICAgcGFkZGluZ0xlZnQ6IDEwLFxuICAgICAgICBmb250OiB7IGZvbnRTaXplOiAxNiB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBhZGRCdXR0b24gPSBUaS5VSS5jcmVhdGVCdXR0b24oe1xuICAgICAgICB0aXRsZTogJ0FkZCBDb250YWN0JyxcbiAgICAgICAgYm90dG9tOiAyMCxcbiAgICAgICAgd2lkdGg6ICc4MCUnLFxuICAgICAgICBoZWlnaHQ6IDUwLFxuICAgICAgICBib3JkZXJSYWRpdXM6IDgsXG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogJyMyOGE3NDUnLFxuICAgICAgICBjb2xvcjogJyNmZmYnLFxuICAgICAgICBmb250OiB7IGZvbnRTaXplOiAxNiwgZm9udFdlaWdodDogJ2JvbGQnIH1cbiAgICB9KTtcblxuICAgIGFkZEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgY29uc3QgbmFtZSA9IG5hbWVJbnB1dC52YWx1ZTtcbiAgICAgICAgY29uc3QgZW1haWwgPSBlbWFpbElucHV0LnZhbHVlO1xuICAgICAgICBjb25zdCBwaG9uZSA9IHBob25lSW5wdXQudmFsdWU7XG5cbiAgICAgICAgaWYgKHRoaXMuY29udGFjdENvbnRyb2xsZXIudmFsaWRhdGVFbWFpbChlbWFpbCkgJiYgdGhpcy5jb250YWN0Q29udHJvbGxlci52YWxpZGF0ZVBob25lKHBob25lKSkge1xuICAgICAgICAgICAgdGhpcy5jb250YWN0Q29udHJvbGxlci5hZGRDb250YWN0KG5hbWUsIGVtYWlsLCBwaG9uZSk7XG4gICAgICAgICAgICB0aGlzLmZvcm1XaW5kb3cuY2xvc2UoKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udGFjdHNMaXN0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBUaS5VSS5jcmVhdGVBbGVydERpYWxvZyh7XG4gICAgICAgICAgICAgICAgdGl0bGU6ICdJbnZhbGlkIElucHV0JyxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnUGxlYXNlIGNoZWNrIGVtYWlsIGFuZCBwaG9uZSBudW1iZXIuJ1xuICAgICAgICAgICAgfSkuc2hvdygpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLmZvcm1XaW5kb3cuYWRkKG5hbWVJbnB1dCk7XG4gICAgdGhpcy5mb3JtV2luZG93LmFkZChlbWFpbElucHV0KTtcbiAgICB0aGlzLmZvcm1XaW5kb3cuYWRkKHBob25lSW5wdXQpO1xuICAgIHRoaXMuZm9ybVdpbmRvdy5hZGQoYWRkQnV0dG9uKTtcbiAgICB0aGlzLmZvcm1XaW5kb3cub3BlbigpO1xufTtcblxuQ29udGFjdFZpZXcucHJvdG90eXBlLnNob3dFZGl0Q29udGFjdEZvcm0gPSBmdW5jdGlvbihpbmRleCkge1xuICAgIGNvbnN0IGNvbnRhY3QgPSB0aGlzLmNvbnRhY3RDb250cm9sbGVyLmdldENvbnRhY3RzKClbaW5kZXhdO1xuXG4gICAgdGhpcy5mb3JtV2luZG93ID0gVGkuVUkuY3JlYXRlV2luZG93KHsgdGl0bGU6ICdFZGl0IENvbnRhY3QnIH0pO1xuXG4gICAgY29uc3QgbmFtZUlucHV0ID0gVGkuVUkuY3JlYXRlVGV4dEZpZWxkKHtcbiAgICAgICAgdmFsdWU6IGNvbnRhY3QubmFtZSxcbiAgICAgICAgdG9wOiAyMCxcbiAgICAgICAgd2lkdGg6ICc4MCUnLFxuICAgICAgICBoZWlnaHQ6IDQwLFxuICAgICAgICBib3JkZXJSYWRpdXM6IDgsXG4gICAgICAgIHBhZGRpbmdMZWZ0OiAxMCxcbiAgICAgICAgZm9udDogeyBmb250U2l6ZTogMTYgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgZW1haWxJbnB1dCA9IFRpLlVJLmNyZWF0ZVRleHRGaWVsZCh7XG4gICAgICAgIHZhbHVlOiBjb250YWN0LmVtYWlsLFxuICAgICAgICB0b3A6IDgwLFxuICAgICAgICB3aWR0aDogJzgwJScsXG4gICAgICAgIGhlaWdodDogNDAsXG4gICAgICAgIGJvcmRlclJhZGl1czogOCxcbiAgICAgICAgcGFkZGluZ0xlZnQ6IDEwLFxuICAgICAgICBmb250OiB7IGZvbnRTaXplOiAxNiB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBwaG9uZUlucHV0ID0gVGkuVUkuY3JlYXRlVGV4dEZpZWxkKHtcbiAgICAgICAgdmFsdWU6IGNvbnRhY3QucGhvbmUsXG4gICAgICAgIHRvcDogMTQwLFxuICAgICAgICB3aWR0aDogJzgwJScsXG4gICAgICAgIGhlaWdodDogNDAsXG4gICAgICAgIGJvcmRlclJhZGl1czogOCxcbiAgICAgICAgcGFkZGluZ0xlZnQ6IDEwLFxuICAgICAgICBmb250OiB7IGZvbnRTaXplOiAxNiB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBzYXZlQnV0dG9uID0gVGkuVUkuY3JlYXRlQnV0dG9uKHtcbiAgICAgICAgdGl0bGU6ICdTYXZlIENoYW5nZXMnLFxuICAgICAgICBib3R0b206IDIwLFxuICAgICAgICB3aWR0aDogJzgwJScsXG4gICAgICAgIGhlaWdodDogNTAsXG4gICAgICAgIGJvcmRlclJhZGl1czogOCxcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiAnIzI4YTc0NScsXG4gICAgICAgIGNvbG9yOiAnI2ZmZicsXG4gICAgICAgIGZvbnQ6IHsgZm9udFNpemU6IDE2LCBmb250V2VpZ2h0OiAnYm9sZCcgfVxuICAgIH0pO1xuXG4gICAgc2F2ZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgY29uc3QgbmFtZSA9IG5hbWVJbnB1dC52YWx1ZTtcbiAgICAgICAgY29uc3QgZW1haWwgPSBlbWFpbElucHV0LnZhbHVlO1xuICAgICAgICBjb25zdCBwaG9uZSA9IHBob25lSW5wdXQudmFsdWU7XG5cbiAgICAgICAgaWYgKHRoaXMuY29udGFjdENvbnRyb2xsZXIudmFsaWRhdGVFbWFpbChlbWFpbCkgJiYgdGhpcy5jb250YWN0Q29udHJvbGxlci52YWxpZGF0ZVBob25lKHBob25lKSkge1xuICAgICAgICAgICAgdGhpcy5jb250YWN0Q29udHJvbGxlci51cGRhdGVDb250YWN0KGluZGV4LCBuYW1lLCBlbWFpbCwgcGhvbmUpO1xuICAgICAgICAgICAgdGhpcy5mb3JtV2luZG93LmNsb3NlKCk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnRhY3RzTGlzdCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgVGkuVUkuY3JlYXRlQWxlcnREaWFsb2coe1xuICAgICAgICAgICAgICAgIHRpdGxlOiAnSW52YWxpZCBJbnB1dCcsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ1BsZWFzZSBjaGVjayBlbWFpbCBhbmQgcGhvbmUgbnVtYmVyLidcbiAgICAgICAgICAgIH0pLnNob3coKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5mb3JtV2luZG93LmFkZChuYW1lSW5wdXQpO1xuICAgIHRoaXMuZm9ybVdpbmRvdy5hZGQoZW1haWxJbnB1dCk7XG4gICAgdGhpcy5mb3JtV2luZG93LmFkZChwaG9uZUlucHV0KTtcbiAgICB0aGlzLmZvcm1XaW5kb3cuYWRkKHNhdmVCdXR0b24pO1xuICAgIHRoaXMuZm9ybVdpbmRvdy5vcGVuKCk7XG59O1xuXG5Db250YWN0Vmlldy5wcm90b3R5cGUudXBkYXRlQ29udGFjdHNMaXN0ID0gZnVuY3Rpb24oKSB7XG4gICAgY29uc3Qgcm93cyA9IFtdO1xuICAgIGNvbnN0IGNvbnRhY3RzID0gdGhpcy5jb250YWN0Q29udHJvbGxlci5nZXRDb250YWN0cygpO1xuXG4gICAgY29udGFjdHMuZm9yRWFjaCgoY29udGFjdCwgaW5kZXgpID0+IHtcbiAgICAgICAgY29uc3Qgcm93ID0gVGkuVUkuY3JlYXRlVGFibGVWaWV3Um93KHtcbiAgICAgICAgICAgIGxheW91dDogJ2hvcml6b250YWwnLFxuICAgICAgICAgICAgaGVpZ2h0OiBUaS5VSS5TSVpFLFxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAnI2ZmZmZmZicsXG4gICAgICAgICAgICBib3JkZXJDb2xvcjogJyNjY2MnLFxuICAgICAgICAgICAgYm9yZGVyV2lkdGg6IDEsXG4gICAgICAgICAgICBib3JkZXJSYWRpdXM6IDgsXG4gICAgICAgICAgICBtYXJnaW5Ub3A6IDE1XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGNvbnRhY3RJbmZvQ29udGFpbmVyID0gVGkuVUkuY3JlYXRlVmlldyh7XG4gICAgICAgICAgICBsYXlvdXQ6ICd2ZXJ0aWNhbCcsXG4gICAgICAgICAgICB3aWR0aDogJzgwJScsXG4gICAgICAgICAgICBoZWlnaHQ6IFRpLlVJLlNJWkUsXG4gICAgICAgICAgICBwYWRkaW5nOiAxMFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBuYW1lTGFiZWwgPSBUaS5VSS5jcmVhdGVMYWJlbCh7XG4gICAgICAgICAgICB0ZXh0OiBjb250YWN0Lm5hbWUsXG4gICAgICAgICAgICBjb2xvcjogJyMzMzMnLFxuICAgICAgICAgICAgZm9udDogeyBmb250U2l6ZTogMTgsIGZvbnRXZWlnaHQ6ICdib2xkJyB9LFxuICAgICAgICAgICAgdGV4dEFsaWduOiAnbGVmdCcsXG4gICAgICAgICAgICBoZWlnaHQ6IFRpLlVJLlNJWkUsXG4gICAgICAgICAgICBsZWZ0OiAxMCxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgZW1haWxMYWJlbCA9IFRpLlVJLmNyZWF0ZUxhYmVsKHtcbiAgICAgICAgICAgIHRleHQ6IGNvbnRhY3QuZW1haWwsXG4gICAgICAgICAgICBjb2xvcjogJyM3NzcnLFxuICAgICAgICAgICAgZm9udDogeyBmb250U2l6ZTogMTIgfSxcbiAgICAgICAgICAgIHRleHRBbGlnbjogJ2xlZnQnLFxuICAgICAgICAgICAgaGVpZ2h0OiBUaS5VSS5TSVpFLFxuICAgICAgICAgICAgbGVmdDogMTAsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IHBob25lTGFiZWwgPSBUaS5VSS5jcmVhdGVMYWJlbCh7XG4gICAgICAgICAgICB0ZXh0OiBjb250YWN0LnBob25lLFxuICAgICAgICAgICAgY29sb3I6ICcjNzc3JyxcbiAgICAgICAgICAgIGZvbnQ6IHsgZm9udFNpemU6IDEyIH0sXG4gICAgICAgICAgICB0ZXh0QWxpZ246ICdsZWZ0JyxcbiAgICAgICAgICAgIGhlaWdodDogVGkuVUkuU0laRSxcbiAgICAgICAgICAgIGxlZnQ6IDEwLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb250YWN0SW5mb0NvbnRhaW5lci5hZGQobmFtZUxhYmVsKTtcbiAgICAgICAgY29udGFjdEluZm9Db250YWluZXIuYWRkKGVtYWlsTGFiZWwpO1xuICAgICAgICBjb250YWN0SW5mb0NvbnRhaW5lci5hZGQocGhvbmVMYWJlbCk7XG5cbiAgICAgICAgY29uc3QgYWN0aW9uc0NvbnRhaW5lciA9IFRpLlVJLmNyZWF0ZVZpZXcoe1xuICAgICAgICAgICAgbGF5b3V0OiAndmVydGljYWwnLFxuICAgICAgICAgICAgd2lkdGg6ICcyMCUnLFxuICAgICAgICAgICAgaGVpZ2h0OiBUaS5VSS5TSVpFLFxuICAgICAgICAgICAganVzdGlmeUNvbnRlbnQ6ICdjZW50ZXInLFxuICAgICAgICAgICAgYWxpZ25JdGVtczogJ2ZsZXgtZW5kJyxcbiAgICAgICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBlZGl0TGFiZWwgPSBUaS5VSS5jcmVhdGVMYWJlbCh7XG4gICAgICAgICAgICB0ZXh0OiAnRWRpdCcsXG4gICAgICAgICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgICAgICAgaGVpZ2h0OiAzMCxcbiAgICAgICAgICAgIHRvcDogNSxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJyMyOGE3NDUnLFxuICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiA1LFxuICAgICAgICAgICAgdGV4dEFsaWduOiAnY2VudGVyJyxcbiAgICAgICAgICAgIGNvbG9yOiAnI2ZmZicsXG4gICAgICAgICAgICBib3JkZXJXaWR0aDogMSxcbiAgICAgICAgICAgIGJvcmRlckNvbG9yOiAnIzI4YTc0NScsXG4gICAgICAgICAgICBwYWRkaW5nOiA1LFxuICAgICAgICB9KTtcblxuICAgICAgICBlZGl0TGFiZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNob3dFZGl0Q29udGFjdEZvcm0oaW5kZXgpO1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBkZWxldGVMYWJlbCA9IFRpLlVJLmNyZWF0ZUxhYmVsKHtcbiAgICAgICAgICAgIHRleHQ6ICdEZWxldGUnLFxuICAgICAgICAgICAgd2lkdGg6ICcxMDAlJyxcbiAgICAgICAgICAgIGhlaWdodDogMzAsXG4gICAgICAgICAgICB0b3A6IDUsXG4gICAgICAgICAgICBib3R0b206IDUsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICcjZmY0MTM2JyxcbiAgICAgICAgICAgIGJvcmRlclJhZGl1czogNSxcbiAgICAgICAgICAgIHRleHRBbGlnbjogJ2NlbnRlcicsXG4gICAgICAgICAgICBjb2xvcjogJyNmZmYnLFxuICAgICAgICAgICAgYm9yZGVyV2lkdGg6IDEsXG4gICAgICAgICAgICBib3JkZXJDb2xvcjogJyNmZjQxMzYnLFxuICAgICAgICAgICAgcGFkZGluZzogNSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZGVsZXRlTGFiZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBkZWxldGVDb25maXJtRGlhbG9nID0gVGkuVUkuY3JlYXRlQWxlcnREaWFsb2coe1xuICAgICAgICAgICAgICAgIHRpdGxlOiAnQ29uZmlybSBEZWxldGlvbicsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ0FyZSB5b3Ugc3VyZSB5b3Ugd2FudCB0byBkZWxldGUgdGhpcyBjb250YWN0PycsXG4gICAgICAgICAgICAgICAgYnV0dG9uTmFtZXM6IFsnQ2FuY2VsJywgJ0RlbGV0ZSddLFxuICAgICAgICAgICAgICAgIGNhbmNlbDogMFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGRlbGV0ZUNvbmZpcm1EaWFsb2cuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlLmluZGV4ID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGFjdENvbnRyb2xsZXIuZGVsZXRlQ29udGFjdChpbmRleCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udGFjdHNMaXN0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGRlbGV0ZUNvbmZpcm1EaWFsb2cuc2hvdygpO1xuICAgICAgICB9KTtcblxuICAgICAgICBhY3Rpb25zQ29udGFpbmVyLmFkZChlZGl0TGFiZWwpO1xuICAgICAgICBhY3Rpb25zQ29udGFpbmVyLmFkZChkZWxldGVMYWJlbCk7XG5cbiAgICAgICAgcm93LmFkZChjb250YWN0SW5mb0NvbnRhaW5lcik7XG4gICAgICAgIHJvdy5hZGQoYWN0aW9uc0NvbnRhaW5lcik7XG4gICAgICAgIHJvd3MucHVzaChyb3cpO1xuICAgIH0pO1xuXG4gICAgdGhpcy50YWJsZS5zZXREYXRhKHJvd3MpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb250YWN0VmlldztcbiJdLCJ2ZXJzaW9uIjozfQ==