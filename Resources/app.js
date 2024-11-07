const ContactController = require('./app/controllers/ContactController');
const ContactView = require('./app/views/ContactView');
const TaskView = require('./app/views/TaskView');

const contactController = new ContactController();

const contactView = new ContactView(contactController);

contactController.contactView = contactView;

const taskView = new TaskView();

const mainWindow = Ti.UI.createTabGroup();

const contactTab = Ti.UI.createTab({
    title: 'Contacts',
    window: contactView.getView()  
});
const taskTab = Ti.UI.createTab({
    title: 'Task Info',
    window: taskView.getView()  
});

mainWindow.addTab(contactTab);
mainWindow.addTab(taskTab);

mainWindow.open();
