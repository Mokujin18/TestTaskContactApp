const ContactController = require('./app/controllers/ContactController');
const ContactView = require('./app/views/ContactView');
const TaskView = require('./app/views/TaskView');

// Створюємо ContactController
const contactController = new ContactController();

// Створюємо ContactView і передаємо в нього contactController
const contactView = new ContactView(contactController);

// Пов'язуємо controller з виглядом
contactController.contactView = contactView;

// Створюємо інші вигляди
const taskView = new TaskView();

// Створюємо головне вікно та вкладки
const mainWindow = Ti.UI.createTabGroup();

// Вкладка для контактів
const contactTab = Ti.UI.createTab({
  title: 'Contacts',
  window: contactView.getView() // Передаємо вигляд контактів
});

// Вкладка для задач
const taskTab = Ti.UI.createTab({
  title: 'Task Info',
  window: taskView.getView() // Передаємо вигляд задач
});

// Додаємо вкладки до головного вікна
mainWindow.addTab(contactTab);
mainWindow.addTab(taskTab);

// Відкриваємо головне вікно
mainWindow.open();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJtYXBwaW5ncyI6IkFBQUEsTUFBTUEsaUJBQWlCLEdBQUdDLE9BQU8sQ0FBQyxxQ0FBcUMsQ0FBQztBQUN4RSxNQUFNQyxXQUFXLEdBQUdELE9BQU8sQ0FBQyx5QkFBeUIsQ0FBQztBQUN0RCxNQUFNRSxRQUFRLEdBQUdGLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQzs7QUFFaEQ7QUFDQSxNQUFNRyxpQkFBaUIsR0FBRyxJQUFJSixpQkFBaUIsRUFBRTs7QUFFakQ7QUFDQSxNQUFNSyxXQUFXLEdBQUcsSUFBSUgsV0FBVyxDQUFDRSxpQkFBaUIsQ0FBQzs7QUFFdEQ7QUFDQUEsaUJBQWlCLENBQUNDLFdBQVcsR0FBR0EsV0FBVzs7QUFFM0M7QUFDQSxNQUFNQyxRQUFRLEdBQUcsSUFBSUgsUUFBUSxFQUFFOztBQUUvQjtBQUNBLE1BQU1JLFVBQVUsR0FBR0MsRUFBRSxDQUFDQyxFQUFFLENBQUNDLGNBQWMsRUFBRTs7QUFFekM7QUFDQSxNQUFNQyxVQUFVLEdBQUdILEVBQUUsQ0FBQ0MsRUFBRSxDQUFDRyxTQUFTLENBQUM7RUFDL0JDLEtBQUssRUFBRSxVQUFVO0VBQ2pCQyxNQUFNLEVBQUVULFdBQVcsQ0FBQ1UsT0FBTyxFQUFFLENBQUU7QUFDbkMsQ0FBQyxDQUFDOztBQUVGO0FBQ0EsTUFBTUMsT0FBTyxHQUFHUixFQUFFLENBQUNDLEVBQUUsQ0FBQ0csU0FBUyxDQUFDO0VBQzVCQyxLQUFLLEVBQUUsV0FBVztFQUNsQkMsTUFBTSxFQUFFUixRQUFRLENBQUNTLE9BQU8sRUFBRSxDQUFFO0FBQ2hDLENBQUMsQ0FBQzs7QUFFRjtBQUNBUixVQUFVLENBQUNVLE1BQU0sQ0FBQ04sVUFBVSxDQUFDO0FBQzdCSixVQUFVLENBQUNVLE1BQU0sQ0FBQ0QsT0FBTyxDQUFDOztBQUUxQjtBQUNBVCxVQUFVLENBQUNXLElBQUksRUFBRSIsIm5hbWVzIjpbIkNvbnRhY3RDb250cm9sbGVyIiwicmVxdWlyZSIsIkNvbnRhY3RWaWV3IiwiVGFza1ZpZXciLCJjb250YWN0Q29udHJvbGxlciIsImNvbnRhY3RWaWV3IiwidGFza1ZpZXciLCJtYWluV2luZG93IiwiVGkiLCJVSSIsImNyZWF0ZVRhYkdyb3VwIiwiY29udGFjdFRhYiIsImNyZWF0ZVRhYiIsInRpdGxlIiwid2luZG93IiwiZ2V0VmlldyIsInRhc2tUYWIiLCJhZGRUYWIiLCJvcGVuIl0sInNvdXJjZVJvb3QiOiIvVXNlcnMva3VyeXNoY2h1ay9Xb3JrL0p1c3RJdC9Db250YWN0QXBwL1Jlc291cmNlcyIsInNvdXJjZXMiOlsiYXBwLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImNvbnN0IENvbnRhY3RDb250cm9sbGVyID0gcmVxdWlyZSgnLi9hcHAvY29udHJvbGxlcnMvQ29udGFjdENvbnRyb2xsZXInKTtcbmNvbnN0IENvbnRhY3RWaWV3ID0gcmVxdWlyZSgnLi9hcHAvdmlld3MvQ29udGFjdFZpZXcnKTtcbmNvbnN0IFRhc2tWaWV3ID0gcmVxdWlyZSgnLi9hcHAvdmlld3MvVGFza1ZpZXcnKTtcblxuLy8g0KHRgtCy0L7RgNGO0ZTQvNC+IENvbnRhY3RDb250cm9sbGVyXG5jb25zdCBjb250YWN0Q29udHJvbGxlciA9IG5ldyBDb250YWN0Q29udHJvbGxlcigpO1xuXG4vLyDQodGC0LLQvtGA0Y7RlNC80L4gQ29udGFjdFZpZXcg0ZYg0L/QtdGA0LXQtNCw0ZTQvNC+INCyINC90YzQvtCz0L4gY29udGFjdENvbnRyb2xsZXJcbmNvbnN0IGNvbnRhY3RWaWV3ID0gbmV3IENvbnRhY3RWaWV3KGNvbnRhY3RDb250cm9sbGVyKTtcblxuLy8g0J/QvtCyJ9GP0LfRg9GU0LzQviBjb250cm9sbGVyINC3INCy0LjQs9C70Y/QtNC+0LxcbmNvbnRhY3RDb250cm9sbGVyLmNvbnRhY3RWaWV3ID0gY29udGFjdFZpZXc7XG5cbi8vINCh0YLQstC+0YDRjtGU0LzQviDRltC90YjRliDQstC40LPQu9GP0LTQuFxuY29uc3QgdGFza1ZpZXcgPSBuZXcgVGFza1ZpZXcoKTtcblxuLy8g0KHRgtCy0L7RgNGO0ZTQvNC+INCz0L7Qu9C+0LLQvdC1INCy0ZbQutC90L4g0YLQsCDQstC60LvQsNC00LrQuFxuY29uc3QgbWFpbldpbmRvdyA9IFRpLlVJLmNyZWF0ZVRhYkdyb3VwKCk7XG5cbi8vINCS0LrQu9Cw0LTQutCwINC00LvRjyDQutC+0L3RgtCw0LrRgtGW0LJcbmNvbnN0IGNvbnRhY3RUYWIgPSBUaS5VSS5jcmVhdGVUYWIoe1xuICAgIHRpdGxlOiAnQ29udGFjdHMnLFxuICAgIHdpbmRvdzogY29udGFjdFZpZXcuZ2V0VmlldygpICAvLyDQn9C10YDQtdC00LDRlNC80L4g0LLQuNCz0LvRj9C0INC60L7QvdGC0LDQutGC0ZbQslxufSk7XG5cbi8vINCS0LrQu9Cw0LTQutCwINC00LvRjyDQt9Cw0LTQsNGHXG5jb25zdCB0YXNrVGFiID0gVGkuVUkuY3JlYXRlVGFiKHtcbiAgICB0aXRsZTogJ1Rhc2sgSW5mbycsXG4gICAgd2luZG93OiB0YXNrVmlldy5nZXRWaWV3KCkgIC8vINCf0LXRgNC10LTQsNGU0LzQviDQstC40LPQu9GP0LQg0LfQsNC00LDRh1xufSk7XG5cbi8vINCU0L7QtNCw0ZTQvNC+INCy0LrQu9Cw0LTQutC4INC00L4g0LPQvtC70L7QstC90L7Qs9C+INCy0ZbQutC90LBcbm1haW5XaW5kb3cuYWRkVGFiKGNvbnRhY3RUYWIpO1xubWFpbldpbmRvdy5hZGRUYWIodGFza1RhYik7XG5cbi8vINCS0ZbQtNC60YDQuNCy0LDRlNC80L4g0LPQvtC70L7QstC90LUg0LLRltC60L3QvlxubWFpbldpbmRvdy5vcGVuKCk7XG4iXSwidmVyc2lvbiI6M30=
