/**
 * Wine Bar on the River — "Let's Keep in Touch"
 * Google Apps Script Web App
 * -------------------------------------------------------------------
 * This script receives each Netlify form submission (via a Netlify
 * "outgoing webhook") and adds it as a new row in your Google Sheet.
 * No third-party service is involved — the data goes straight from
 * Netlify to your own Google Sheet.
 *
 * SETUP: see SETUP.md, "Part 2 — Connect submissions to Google Sheets".
 * -------------------------------------------------------------------
 */

// The tab (sheet) name inside your spreadsheet where rows are added.
var SHEET_NAME = 'Contacts';

// The columns, in order. The header row is created automatically.
var HEADERS = ['Date', 'Name', 'Email', 'Phone', 'Interested In'];

/**
 * Runs automatically every time Netlify sends a form submission.
 */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    // Netlify may send the submission at the top level or wrapped in "payload".
    var submission = body.payload || body;
    var fields = submission.data || submission;

    // Checkboxes with the same name arrive as an array — join them for the cell.
    var interests = fields.interests;
    if (Array.isArray(interests)) {
      interests = interests.join(', ');
    }

    var row = [
      new Date(),                 // Date the row was added
      fields.name || '',
      fields.email || '',
      fields.phone || '',
      interests || ''
    ];

    var sheet = getSheet_();
    sheet.appendRow(row);

    return jsonResponse_({ result: 'success' });
  } catch (err) {
    return jsonResponse_({ result: 'error', message: String(err) });
  }
}

/**
 * Lets you confirm the web app is live by visiting its URL in a browser.
 */
function doGet() {
  return jsonResponse_({ result: 'ok', message: 'Wine Bar keep-in-touch endpoint is running.' });
}

/** Returns the target sheet, creating it and the header row if needed. */
function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Helper: return a JSON response. */
function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
