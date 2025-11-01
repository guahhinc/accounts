// Guahh Account Backend - Final Version

// Set the name of the sheet where user data is stored.
const sheetName = "Sheet1"; 
const scriptProp = PropertiesService.getScriptProperties();

// This function only needs to be run once during the initial setup.
function initialSetup() {
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  scriptProp.setProperty("key", activeSpreadsheet.getId());
}

// Handles POST requests for both creating and updating users.
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    const doc = SpreadsheetApp.openById(scriptProp.getProperty("key"));
    const sheet = doc.getSheetByName(sheetName);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    // --- LOGIC FOR UPDATING AN EXISTING USER ---
    if (e.parameter.action === 'update') {
      const userID = e.parameter.UserID;
      if (!userID) { throw new Error("UserID is required for an update."); }

      const userIDCol = headers.indexOf('UserID') + 1;
      const data = sheet.getRange(2, userIDCol, sheet.getLastRow() - 1, 1).getValues();
      let userRowIndex = -1;

      for (let i = 0; i < data.length; i++) {
        if (data[i][0].toString() === userID.toString()) {
          userRowIndex = i + 2; // +2 because sheets are 1-based and we skipped the header.
          break;
        }
      }

      if (userRowIndex === -1) { throw new Error("User not found for update."); }

      // Update the allowed fields
      headers.forEach((header, index) => {
        if (['DisplayName', 'ProfilePictureURL', 'Description'].includes(header)) {
          if (e.parameter[header] !== undefined) {
            sheet.getRange(userRowIndex, index + 1).setValue(e.parameter[header]);
          }
        }
      });
      
      // Fetch the full updated row to send back to the user.
      const updatedRowData = sheet.getRange(userRowIndex, 1, 1, headers.length).getValues()[0];
      const userObject = {};
      headers.forEach((header, index) => {
        if (header !== 'Password') { userObject[header] = updatedRowData[index]; }
      });
      
      return ContentService.createTextOutput(JSON.stringify({ "result": "success", "user": userObject })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // --- LOGIC FOR CREATING A NEW USER ---
    const nextRow = sheet.getLastRow() + 1;
    const newRow = headers.map(header => {
      if (header === "UserID") return new Date().getTime();
      if (header === "Balance") return 0; // Set default balance to 0 for new users.
      return e.parameter[header] !== undefined ? e.parameter[header] : "";
    });

    sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);
    return ContentService.createTextOutput(JSON.stringify({ "result": "success", "row": nextRow })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": err.message })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Handles GET requests for login.
function doGet(e) {
  if (e.parameter.action == 'login') {
    const loginIdentifier = e.parameter.loginIdentifier;
    const password = e.parameter.password;
    try {
      const doc = SpreadsheetApp.openById(scriptProp.getProperty("key"));
      const sheet = doc.getSheetByName(sheetName);
      const data = sheet.getDataRange().getValues();
      const headers = data.shift();
      const emailCol=headers.indexOf('Email'), usernameCol=headers.indexOf('Username'), passwordCol=headers.indexOf('Password');

      for (const userRow of data) {
        if ((userRow[usernameCol] === loginIdentifier || userRow[emailCol] === loginIdentifier) && userRow[passwordCol] === password) {
          const userObject = {};
          headers.forEach((header, index) => {
            if (header !== 'Password') { userObject[header] = userRow[index]; }
          });
          return ContentService.createTextOutput(JSON.stringify({ "result": "success", "user": userObject })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ "result": "error", "message": "Invalid credentials" })).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ "result": "error", "message": err.toString() })).setMimeType(ContentService.MimeType.JSON);
    }
  }
}
