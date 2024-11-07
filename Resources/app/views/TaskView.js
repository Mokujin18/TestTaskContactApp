
class TaskView {
    constructor() {
        this.view = Ti.UI.createWindow({
            backgroundColor: '#fff',
            layout: 'vertical'
        });

        const infoLabel = Ti.UI.createLabel({
            text: 'This app allows users to manage contacts with the following features:\n' +
                '1. Add new contacts (name, email, phone).\n' +
                '2. Edit existing contacts.\n' +
                '3. Delete contacts.\n' +
                '4. Form validation for email and phone number.',
            top: 20,
            color: '#000',
            font: { fontSize: 18 },
            textAlign: 'center'
        });

        this.view.add(infoLabel);
    }

    getView() {
        return this.view;
    }
}

module.exports = TaskView;
