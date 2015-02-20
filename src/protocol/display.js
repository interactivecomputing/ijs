// display.js
//

function createDisplayData(value) {
  var displayData = {};

  if ((value === null) || (value === undefined)) {
    return displayData;
  }

  var useStringFallback = true;

  if (typeof value.toHTML == 'function') {
    displayData['text/html'] = value.toHTML();
    useStringFallback = false;
  }

  if (useStringFallback) {
    displayData['text/plain'] = value.toString();
  }

  return displayData;
}

module.exports = {
  data: createDisplayData
};
