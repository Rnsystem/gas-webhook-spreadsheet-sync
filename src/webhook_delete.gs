function doPost(e) {
  try {
    var params = JSON.parse(e.postData.contents);
    var fileName = params.fileName;
    var sheetName = params.sheetName;
    var keyColumn = params.keyColumn; // 1-based index
    var keyValue = params.keyValue;
    if (!fileName || !sheetName || !keyColumn || !keyValue) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Missing parameters" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var file = findSpreadsheetByName(fileName);
    if (!file) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Spreadsheet not found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var sheet = file.getSheetByName(sheetName);
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Sheet not found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var data = sheet.getDataRange().getValues();
    for (var i = 0; i < data.length; i++) {
      if (data[i][keyColumn - 1] == keyValue) { // keyColumn is 1-based
        sheet.deleteRow(i + 1); // deleteRow is 1-based
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Row deleted" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: "Key not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
function findSpreadsheetByName(name) {
  var files = DriveApp.getFilesByName(name);
  while (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }
  return null;
}