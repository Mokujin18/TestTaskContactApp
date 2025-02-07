
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJtYXBwaW5ncyI6IjtBQUNBLE1BQU1BLFFBQVEsQ0FBQztFQUNYQyxXQUFXQSxDQUFBLEVBQUc7SUFDVixJQUFJLENBQUNDLElBQUksR0FBR0MsRUFBRSxDQUFDQyxFQUFFLENBQUNDLFlBQVksQ0FBQztNQUMzQkMsZUFBZSxFQUFFLE1BQU07TUFDdkJDLE1BQU0sRUFBRTtJQUNaLENBQUMsQ0FBQzs7SUFFRixNQUFNQyxTQUFTLEdBQUdMLEVBQUUsQ0FBQ0MsRUFBRSxDQUFDSyxXQUFXLENBQUM7TUFDaENDLElBQUksRUFBRSx5RUFBeUU7TUFDM0UsNkNBQTZDO01BQzdDLDhCQUE4QjtNQUM5Qix1QkFBdUI7TUFDdkIsZ0RBQWdEO01BQ3BEQyxHQUFHLEVBQUUsRUFBRTtNQUNQQyxLQUFLLEVBQUUsTUFBTTtNQUNiQyxJQUFJLEVBQUUsRUFBRUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDO01BQ3RCQyxTQUFTLEVBQUU7SUFDZixDQUFDLENBQUM7O0lBRUYsSUFBSSxDQUFDYixJQUFJLENBQUNjLEdBQUcsQ0FBQ1IsU0FBUyxDQUFDO0VBQzVCOztFQUVBUyxPQUFPQSxDQUFBLEVBQUc7SUFDTixPQUFPLElBQUksQ0FBQ2YsSUFBSTtFQUNwQjtBQUNKOztBQUVBZ0IsTUFBTSxDQUFDQyxPQUFPLEdBQUduQixRQUFRIiwibmFtZXMiOlsiVGFza1ZpZXciLCJjb25zdHJ1Y3RvciIsInZpZXciLCJUaSIsIlVJIiwiY3JlYXRlV2luZG93IiwiYmFja2dyb3VuZENvbG9yIiwibGF5b3V0IiwiaW5mb0xhYmVsIiwiY3JlYXRlTGFiZWwiLCJ0ZXh0IiwidG9wIiwiY29sb3IiLCJmb250IiwiZm9udFNpemUiLCJ0ZXh0QWxpZ24iLCJhZGQiLCJnZXRWaWV3IiwibW9kdWxlIiwiZXhwb3J0cyJdLCJzb3VyY2VSb290IjoiL1VzZXJzL2t1cnlzaGNodWsvV29yay9KdXN0SXQvQ29udGFjdEFwcC9SZXNvdXJjZXMvYXBwL3ZpZXdzIiwic291cmNlcyI6WyJUYXNrVmlldy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJcbmNsYXNzIFRhc2tWaWV3IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy52aWV3ID0gVGkuVUkuY3JlYXRlV2luZG93KHtcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJyNmZmYnLFxuICAgICAgICAgICAgbGF5b3V0OiAndmVydGljYWwnXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGluZm9MYWJlbCA9IFRpLlVJLmNyZWF0ZUxhYmVsKHtcbiAgICAgICAgICAgIHRleHQ6ICdUaGlzIGFwcCBhbGxvd3MgdXNlcnMgdG8gbWFuYWdlIGNvbnRhY3RzIHdpdGggdGhlIGZvbGxvd2luZyBmZWF0dXJlczpcXG4nICtcbiAgICAgICAgICAgICAgICAnMS4gQWRkIG5ldyBjb250YWN0cyAobmFtZSwgZW1haWwsIHBob25lKS5cXG4nICtcbiAgICAgICAgICAgICAgICAnMi4gRWRpdCBleGlzdGluZyBjb250YWN0cy5cXG4nICtcbiAgICAgICAgICAgICAgICAnMy4gRGVsZXRlIGNvbnRhY3RzLlxcbicgK1xuICAgICAgICAgICAgICAgICc0LiBGb3JtIHZhbGlkYXRpb24gZm9yIGVtYWlsIGFuZCBwaG9uZSBudW1iZXIuJyxcbiAgICAgICAgICAgIHRvcDogMjAsXG4gICAgICAgICAgICBjb2xvcjogJyMwMDAnLFxuICAgICAgICAgICAgZm9udDogeyBmb250U2l6ZTogMTggfSxcbiAgICAgICAgICAgIHRleHRBbGlnbjogJ2NlbnRlcidcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy52aWV3LmFkZChpbmZvTGFiZWwpO1xuICAgIH1cblxuICAgIGdldFZpZXcoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnZpZXc7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRhc2tWaWV3O1xuIl0sInZlcnNpb24iOjN9
