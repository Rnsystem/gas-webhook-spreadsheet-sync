function doPost(e) {
  try {
    console.log("doPost started"); // Cloud Logging に記録
    if (!e.postData || !e.postData.contents) {
      console.error("No data received");
      return ContentService.createTextOutput(JSON.stringify({ error: "No data received" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var jsonString = e.postData.contents;
    console.log("Received JSON: " + jsonString);
    var params;
    try {
      params = JSON.parse(jsonString);
      console.log("JSON parsed successfully");
    } catch (error) {
      console.error("JSON Parse Error: " + error.message);
      return ContentService.createTextOutput(JSON.stringify({ error: "JSON Parse Error", message: error.message }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (!params.fileName || !params.sheetName || !params.data || params.idColumnIndex === undefined) {
      console.error("Invalid JSON structure: " + JSON.stringify(params));
      return ContentService.createTextOutput(JSON.stringify({ error: "Invalid JSON structure" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var fileName = params.fileName;
    var sheetName = params.sheetName;
    var data = params.data;
    var idColumnIndex = params.idColumnIndex;
    console.log("Looking for spreadsheet: " + fileName);
    var file = getSpreadsheetByName(fileName);
    if (!file) {
      console.error("File not found: " + fileName);
      return ContentService.createTextOutput(JSON.stringify({ error: "File not found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    console.log("Opening sheet: " + sheetName);
    var sheet = file.getSheetByName(sheetName);
    if (!sheet) {
      console.error("Sheet not found: " + sheetName);
      return ContentService.createTextOutput(JSON.stringify({ error: "Sheet not found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    console.log("Searching for matching rows...");
    var lastRow = sheet.getLastRow();
    var idColumnValues = sheet.getRange(2, idColumnIndex, lastRow - 1, 1).getValues().flat();
    var updatedRows = 0;
    var newRows = [];
    data.forEach(row => {
      var idValue = row[idColumnIndex - 1];
      var found = false;
      for (var i = 0; i < idColumnValues.length; i++) {
        if (idColumnValues[i] == idValue) {
          console.log("Updating existing row: " + (i + 2));
          var updateRange = sheet.getRange(i + 2, 1, 1, row.length);
          updateRange.setValues([row]);
          updatedRows++;
          found = true;
          break;
        }
      }
      if (!found) {
        newRows.push(row);
      }
    });
    if (newRows.length > 0) {
      console.log("Appending new rows...");
      var startRow = lastRow + 1;
      var targetRange = sheet.getRange(startRow, 1, newRows.length, newRows[0].length);
      targetRange.setValues(newRows);
    }
    console.log("Data processing completed successfully");
    return ContentService.createTextOutput(JSON.stringify({ status: "success", rowsUpdated: updatedRows, rowsAdded: newRows.length }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error("Unexpected Error: " + error.message);
    return ContentService.createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
function getSpreadsheetByName(fileName) {
  var files = DriveApp.searchFiles('title = "' + fileName + '" and mimeType = "application/vnd.google-apps.spreadsheet"');
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }
  return null;
}