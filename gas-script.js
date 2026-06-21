// ============================================================
// GOOGLE APPS SCRIPT - Deploy ke script.google.com
// ============================================================
// CARA PASANG:
// 1. Buka https://script.google.com
// 2. Klik "New Project"
// 3. Hapus semua kode default, lalu paste seluruh kode ini
// 4. Ganti SPREADSHEET_ID dengan ID Spreadsheet Anda
//    (ID ada di URL: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit)
// 5. Buat Spreadsheet dengan sheet: Tasks, KPI, EVM, Risk, Budget, Milestone
//    - Baris pertama = header kolom (harus cocok dengan field di dashboard)
// 6. Klik "Deploy" > "New deployment"
// 7. Pilih type: "Web app"
// 8. Execute as: "Me"
// 9. Who has access: "Anyone" (atau "Anyone with Google account")
// 10. Klik "Deploy", salin URL yang muncul
// 11. Paste URL tersebut ke CONFIG.GAS_URL di config.js
// ============================================================

// ============ KONFIGURASI ============
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // GANTI INI

// ============ DO GET (READ) ============
function doGet(e) {
  const action = e.parameter.action;
  const sheetName = e.parameter.sheet;

  if (action === 'getData') {
    return getData(sheetName);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ success: false, message: 'Action tidak dikenal' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============ DO POST (CREATE/UPDATE/DELETE) ============
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const sheetName = body.sheet;

    switch (action) {
      case 'addRow':
        return addRow(sheetName, body.data);
      case 'updateRow':
        return updateRow(sheetName, body.rowId, body.data);
      case 'deleteRow':
        return deleteRow(sheetName, body.rowId);
      default:
        return jsonResponse({ success: false, message: 'Action tidak dikenal: ' + action });
    }
  } catch (err) {
    return jsonResponse({ success: false, message: 'Error parsing request: ' + err.message });
  }
}

// ============ HELPER: Buka Sheet ============
function getSheet(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Sheet "' + sheetName + '" tidak ditemukan');
  }
  return sheet;
}

// ============ HELPER: Konversi sheet ke array of objects ============
function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const headers = data[0].map(h => String(h).trim());
  const rows = data.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i] !== undefined && row[i] !== null ? String(row[i]) : '';
    });
    return obj;
  });
}

// ============ HELPER: Cari baris berdasarkan ID ============
function findRowIndex(sheet, idColumn, rowId) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const idColIndex = headers.indexOf(idColumn);

  if (idColIndex === -1) {
    // Coba kolom pertama sebagai fallback
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(rowId).trim()) {
        return i + 1; // 1-based row number
      }
    }
    return -1;
  }

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idColIndex]).trim() === String(rowId).trim()) {
      return i + 1; // 1-based row number
    }
  }
  return -1;
}

// ============ HELPER: Tentukan kolom ID berdasarkan nama sheet ============
function getIdColumnName(sheetName) {
  const map = {
    'Tasks': 'ID',
    'KPI': 'ID',
    'EVM': 'ID',
    'Risk': 'ID',
    'Budget': 'Kategori',
    'Milestone': 'Milestone'
  };
  return map[sheetName] || 'ID';
}

// ============ HELPER: Auto-calculate fields berdasarkan sheet ============
function autoCalculate(sheetName, rowData) {
  const data = Object.assign({}, rowData);

  if (sheetName === 'Risk') {
    // Skor = Likelihood × Impact
    const likelihood = parseInt(data.Likelihood) || 0;
    const impact = parseInt(data.Impact) || 0;
    data.Skor = String(likelihood * impact);
  }

  if (sheetName === 'Budget') {
    // Status otomatis berdasarkan Planned vs Actual
    const planned = parseFloat(data.Planned) || 0;
    const actual = parseFloat(data.Actual) || 0;
    if (actual > planned) {
      data.Status = 'Overbudget';
    } else if (actual > planned * 0.9) {
      data.Status = 'Warning';
    } else {
      data.Status = 'Normal';
    }
  }

  if (sheetName === 'KPI') {
    // Status otomatis berdasarkan Target vs Aktual
    const target = parseFloat(data.Target) || 0;
    const aktual = parseFloat(data.Aktual) || 0;
    if (target > 0) {
      const ratio = aktual / target;
      if (ratio >= 1.0) {
        data.Status = 'On Track';
      } else if (ratio >= 0.9) {
        data.Status = 'At Risk';
      } else {
        data.Status = 'Critical';
      }
    }
  }

  if (sheetName === 'Milestone') {
    // Status otomatis berdasarkan Target vs Realisasi
    if (data.Realisasi && data.Target) {
      const targetDate = new Date(data.Target);
      const realDate = new Date(data.Realisasi);
      if (realDate <= targetDate) {
        data.Status = 'On Track';
      } else {
        const diffDays = Math.ceil((realDate - targetDate) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) {
          data.Status = 'Delayed';
        } else {
          data.Status = 'Critical Delay';
        }
      }
    } else if (!data.Realisasi) {
      // Belum ada realisasi, cek apakah sudah lewat target
      if (data.Target) {
        const targetDate = new Date(data.Target);
        const today = new Date();
        if (today > targetDate) {
          data.Status = 'Critical Delay';
        } else {
          data.Status = 'On Track';
        }
      }
    }
  }

  return data;
}

// ============ HELPER: JSON Response ============
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============ READ ============
function getData(sheetName) {
  try {
    const sheet = getSheet(sheetName);
    const data = sheetToObjects(sheet);
    return jsonResponse({ success: true, data: data });
  } catch (err) {
    return jsonResponse({ success: false, message: err.message, data: [] });
  }
}

// ============ CREATE (Append Row) ============
function addRow(sheetName, rowData) {
  try {
    const sheet = getSheet(sheetName);
    const headers = sheet.getDataRange().getValues()[0].map(h => String(h).trim());

    // Auto-calculate fields
    const calculated = autoCalculate(sheetName, rowData);

    // Susun nilai sesuai urutan header
    const rowValues = headers.map(header => calculated[header] !== undefined ? calculated[header] : '');

    sheet.appendRow(rowValues);
    return jsonResponse({ success: true, message: 'Data berhasil ditambahkan', data: calculated });
  } catch (err) {
    return jsonResponse({ success: false, message: err.message });
  }
}

// ============ UPDATE ============
function updateRow(sheetName, rowId, rowData) {
  try {
    const sheet = getSheet(sheetName);
    const idColumn = getIdColumnName(sheetName);
    const rowIndex = findRowIndex(sheet, idColumn, rowId);

    if (rowIndex === -1) {
      return jsonResponse({ success: false, message: 'Data dengan ID "' + rowId + '" tidak ditemukan' });
    }

    const headers = sheet.getDataRange().getValues()[0].map(h => String(h).trim());

    // Auto-calculate fields
    const calculated = autoCalculate(sheetName, rowData);

    // Update kolom yang ada di calculated data
    headers.forEach((header, colIndex) => {
      if (calculated[header] !== undefined) {
        sheet.getRange(rowIndex, colIndex + 1).setValue(calculated[header]);
      }
    });

    return jsonResponse({ success: true, message: 'Data berhasil diupdate', data: calculated });
  } catch (err) {
    return jsonResponse({ success: false, message: err.message });
  }
}

// ============ DELETE ============
function deleteRow(sheetName, rowId) {
  try {
    const sheet = getSheet(sheetName);
    const idColumn = getIdColumnName(sheetName);
    const rowIndex = findRowIndex(sheet, idColumn, rowId);

    if (rowIndex === -1) {
      return jsonResponse({ success: false, message: 'Data dengan ID "' + rowId + '" tidak ditemukan' });
    }

    sheet.deleteRow(rowIndex);
    return jsonResponse({ success: true, message: 'Data berhasil dihapus' });
  } catch (err) {
    return jsonResponse({ success: false, message: err.message });
  }
}