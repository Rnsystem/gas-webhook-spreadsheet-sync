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
    if (!params.fileName || !params.sheetName || !params.data) {
      console.error("Invalid JSON structure: " + JSON.stringify(params));
      return ContentService.createTextOutput(JSON.stringify({ error: "Invalid JSON structure" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var fileName = params.fileName;
    var sheetName = params.sheetName;
    var data = params.data;
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
    // **:pushpin: 修正ポイント: ヘッダーを残し、それ以降のデータを削除**
    console.log("Clearing all data except headers...");
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    }
    // **:pushpin: 修正ポイント: 新しいデータを挿入**
    console.log("Setting range for data insertion. Rows: " + data.length + ", Columns: " + data[0].length);
    var targetRange = sheet.getRange(2, 1, data.length, data[0].length);
    console.log("Writing new data to sheet...");
    targetRange.setValues(data);
    console.log("Data written successfully");
    return ContentService.createTextOutput(JSON.stringify({ status: "success", rowsAdded: data.length }))
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