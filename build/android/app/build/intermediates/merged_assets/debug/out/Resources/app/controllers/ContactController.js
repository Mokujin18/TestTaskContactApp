class ContactController {
  constructor(contactView) {
    this.contacts = [];
    this.contactView = contactView;
  }

  getContacts() {
    return this.contacts;
  }

  addContact(name, email, phone) {
    if (this.contacts.some((contact) => contact.email === email)) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJtYXBwaW5ncyI6IkFBQUEsTUFBTUEsaUJBQWlCLENBQUM7RUFDcEJDLFdBQVdBLENBQUNDLFdBQVcsRUFBRTtJQUNyQixJQUFJLENBQUNDLFFBQVEsR0FBRyxFQUFFO0lBQ2xCLElBQUksQ0FBQ0QsV0FBVyxHQUFHQSxXQUFXO0VBQ2xDOztFQUVBRSxXQUFXQSxDQUFBLEVBQUc7SUFDVixPQUFPLElBQUksQ0FBQ0QsUUFBUTtFQUN4Qjs7RUFFQUUsVUFBVUEsQ0FBQ0MsSUFBSSxFQUFFQyxLQUFLLEVBQUVDLEtBQUssRUFBRTtJQUMzQixJQUFJLElBQUksQ0FBQ0wsUUFBUSxDQUFDTSxJQUFJLENBQUMsQ0FBQUMsT0FBTyxLQUFJQSxPQUFPLENBQUNILEtBQUssS0FBS0EsS0FBSyxDQUFDLEVBQUU7TUFDeERJLEVBQUUsQ0FBQ0MsRUFBRSxDQUFDQyxpQkFBaUIsQ0FBQztRQUNwQkMsS0FBSyxFQUFFLE9BQU87UUFDZEMsT0FBTyxFQUFFO01BQ2IsQ0FBQyxDQUFDLENBQUNDLElBQUksRUFBRTtNQUNUO0lBQ0o7SUFDQSxJQUFJLENBQUNiLFFBQVEsQ0FBQ2MsSUFBSSxDQUFDLEVBQUVYLElBQUksRUFBRUMsS0FBSyxFQUFFQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQzFDLElBQUksQ0FBQ04sV0FBVyxDQUFDZ0Isa0JBQWtCLEVBQUU7RUFDekM7O0VBRUFDLGFBQWFBLENBQUNDLFNBQVMsRUFBRWQsSUFBSSxFQUFFQyxLQUFLLEVBQUVDLEtBQUssRUFBRTtJQUN6QyxNQUFNRSxPQUFPLEdBQUcsSUFBSSxDQUFDUCxRQUFRLENBQUNpQixTQUFTLENBQUM7SUFDeEMsSUFBSVYsT0FBTyxFQUFFO01BQ1RBLE9BQU8sQ0FBQ0osSUFBSSxHQUFHQSxJQUFJO01BQ25CSSxPQUFPLENBQUNILEtBQUssR0FBR0EsS0FBSztNQUNyQkcsT0FBTyxDQUFDRixLQUFLLEdBQUdBLEtBQUs7TUFDckJhLE9BQU8sQ0FBQ0MsSUFBSSxDQUFFLDJCQUEwQkMsSUFBSSxDQUFDQyxTQUFTLENBQUNkLE9BQU8sQ0FBRSxFQUFDLENBQUM7TUFDbEUsSUFBSSxDQUFDUixXQUFXLENBQUNnQixrQkFBa0IsRUFBRTtJQUN6QztFQUNKOztFQUVBTyxhQUFhQSxDQUFDTCxTQUFTLEVBQUU7SUFDckIsSUFBSUEsU0FBUyxLQUFLTSxTQUFTLElBQUlOLFNBQVMsSUFBSSxDQUFDLElBQUlBLFNBQVMsR0FBRyxJQUFJLENBQUNqQixRQUFRLENBQUN3QixNQUFNLEVBQUU7TUFDL0UsSUFBSSxDQUFDeEIsUUFBUSxDQUFDeUIsTUFBTSxDQUFDUixTQUFTLEVBQUUsQ0FBQyxDQUFDO01BQ2xDLElBQUksQ0FBQ2xCLFdBQVcsQ0FBQ2dCLGtCQUFrQixFQUFFO0lBQ3pDLENBQUMsTUFBTTtNQUNIUCxFQUFFLENBQUNDLEVBQUUsQ0FBQ0MsaUJBQWlCLENBQUM7UUFDcEJDLEtBQUssRUFBRSxPQUFPO1FBQ2RDLE9BQU8sRUFBRTtNQUNiLENBQUMsQ0FBQyxDQUFDQyxJQUFJLEVBQUU7SUFDYjtFQUNKOztFQUVBYSxhQUFhQSxDQUFDdEIsS0FBSyxFQUFFO0lBQ2pCLE1BQU11QixLQUFLLEdBQUcsa0RBQWtEO0lBQ2hFLE9BQU9BLEtBQUssQ0FBQ0MsSUFBSSxDQUFDeEIsS0FBSyxDQUFDO0VBQzVCOztFQUVBeUIsYUFBYUEsQ0FBQ3hCLEtBQUssRUFBRTtJQUNqQixNQUFNc0IsS0FBSyxHQUFHLGFBQWE7SUFDM0IsT0FBT0EsS0FBSyxDQUFDQyxJQUFJLENBQUN2QixLQUFLLENBQUM7RUFDNUI7QUFDSjs7QUFFQXlCLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHbEMsaUJBQWlCIiwibmFtZXMiOlsiQ29udGFjdENvbnRyb2xsZXIiLCJjb25zdHJ1Y3RvciIsImNvbnRhY3RWaWV3IiwiY29udGFjdHMiLCJnZXRDb250YWN0cyIsImFkZENvbnRhY3QiLCJuYW1lIiwiZW1haWwiLCJwaG9uZSIsInNvbWUiLCJjb250YWN0IiwiVGkiLCJVSSIsImNyZWF0ZUFsZXJ0RGlhbG9nIiwidGl0bGUiLCJtZXNzYWdlIiwic2hvdyIsInB1c2giLCJ1cGRhdGVDb250YWN0c0xpc3QiLCJ1cGRhdGVDb250YWN0IiwiY29udGFjdElkIiwiY29uc29sZSIsImluZm8iLCJKU09OIiwic3RyaW5naWZ5IiwiZGVsZXRlQ29udGFjdCIsInVuZGVmaW5lZCIsImxlbmd0aCIsInNwbGljZSIsInZhbGlkYXRlRW1haWwiLCJyZWdleCIsInRlc3QiLCJ2YWxpZGF0ZVBob25lIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJzb3VyY2VSb290IjoiL1VzZXJzL2t1cnlzaGNodWsvV29yay9KdXN0SXQvQ29udGFjdEFwcC9SZXNvdXJjZXMvYXBwL2NvbnRyb2xsZXJzIiwic291cmNlcyI6WyJDb250YWN0Q29udHJvbGxlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJjbGFzcyBDb250YWN0Q29udHJvbGxlciB7XG4gICAgY29uc3RydWN0b3IoY29udGFjdFZpZXcpIHtcbiAgICAgICAgdGhpcy5jb250YWN0cyA9IFtdO1xuICAgICAgICB0aGlzLmNvbnRhY3RWaWV3ID0gY29udGFjdFZpZXc7XG4gICAgfVxuXG4gICAgZ2V0Q29udGFjdHMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnRhY3RzO1xuICAgIH1cblxuICAgIGFkZENvbnRhY3QobmFtZSwgZW1haWwsIHBob25lKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbnRhY3RzLnNvbWUoY29udGFjdCA9PiBjb250YWN0LmVtYWlsID09PSBlbWFpbCkpIHtcbiAgICAgICAgICAgIFRpLlVJLmNyZWF0ZUFsZXJ0RGlhbG9nKHtcbiAgICAgICAgICAgICAgICB0aXRsZTogJ0Vycm9yJyxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnQ29udGFjdCB3aXRoIHRoaXMgZW1haWwgYWxyZWFkeSBleGlzdHMuJ1xuICAgICAgICAgICAgfSkuc2hvdygpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY29udGFjdHMucHVzaCh7IG5hbWUsIGVtYWlsLCBwaG9uZSB9KTtcbiAgICAgICAgdGhpcy5jb250YWN0Vmlldy51cGRhdGVDb250YWN0c0xpc3QoKTtcbiAgICB9XG5cbiAgICB1cGRhdGVDb250YWN0KGNvbnRhY3RJZCwgbmFtZSwgZW1haWwsIHBob25lKSB7XG4gICAgICAgIGNvbnN0IGNvbnRhY3QgPSB0aGlzLmNvbnRhY3RzW2NvbnRhY3RJZF07XG4gICAgICAgIGlmIChjb250YWN0KSB7XG4gICAgICAgICAgICBjb250YWN0Lm5hbWUgPSBuYW1lO1xuICAgICAgICAgICAgY29udGFjdC5lbWFpbCA9IGVtYWlsO1xuICAgICAgICAgICAgY29udGFjdC5waG9uZSA9IHBob25lO1xuICAgICAgICAgICAgY29uc29sZS5pbmZvKGBbSU5GT10gQ29udGFjdCB1cGRhdGVkOiAke0pTT04uc3RyaW5naWZ5KGNvbnRhY3QpfWApO1xuICAgICAgICAgICAgdGhpcy5jb250YWN0Vmlldy51cGRhdGVDb250YWN0c0xpc3QoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRlbGV0ZUNvbnRhY3QoY29udGFjdElkKSB7XG4gICAgICAgIGlmIChjb250YWN0SWQgIT09IHVuZGVmaW5lZCAmJiBjb250YWN0SWQgPj0gMCAmJiBjb250YWN0SWQgPCB0aGlzLmNvbnRhY3RzLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhpcy5jb250YWN0cy5zcGxpY2UoY29udGFjdElkLCAxKTtcbiAgICAgICAgICAgIHRoaXMuY29udGFjdFZpZXcudXBkYXRlQ29udGFjdHNMaXN0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBUaS5VSS5jcmVhdGVBbGVydERpYWxvZyh7XG4gICAgICAgICAgICAgICAgdGl0bGU6ICdFcnJvcicsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ0ludmFsaWQgY29udGFjdCBJRC4nXG4gICAgICAgICAgICB9KS5zaG93KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YWxpZGF0ZUVtYWlsKGVtYWlsKSB7XG4gICAgICAgIGNvbnN0IHJlZ2V4ID0gL15bYS16QS1aMC05Ll8lKy1dK0BbYS16QS1aMC05Li1dK1xcLlthLXpBLVpdezIsfSQvO1xuICAgICAgICByZXR1cm4gcmVnZXgudGVzdChlbWFpbCk7XG4gICAgfVxuXG4gICAgdmFsaWRhdGVQaG9uZShwaG9uZSkge1xuICAgICAgICBjb25zdCByZWdleCA9IC9eWzAtOV17MTB9JC87XG4gICAgICAgIHJldHVybiByZWdleC50ZXN0KHBob25lKTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udGFjdENvbnRyb2xsZXI7XG4iXSwidmVyc2lvbiI6M30=
