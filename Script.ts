
// @ts-nocheck
/**
 * GOOGLE APPS SCRIPT - PHIÊN BẢN FIX LỖI LỆCH DÒNG & ĐỒNG BỘ VERCEL
 */

var SPREADSHEET_ID = "1OiSvTPGmhmVsNA_VszzCvYMlxt52Dgx86U4kf_2FMfc";

function getSS() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function doGet(e) {
  var ss = getSS();
  var feeSheet = ss.getSheetByName("hocphi");
  var password = feeSheet ? feeSheet.getRange("C2").getValue() : "123456";
  
  var targetSheets = ["Lop9", "Lop10", "Lop11", "Lop12"];
  var data = {
    sheets: {},
    password: password
  };

  targetSheets.forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (sheet) {
      var values = sheet.getDataRange().getValues();
      var students = [];
      for (var i = 1; i < values.length; i++) {
        var row = values[i];
        // Bỏ qua hàng trống hoặc dữ liệu rác
        if (!row[1] || String(row[1]).trim() === "" || String(row[1]).includes("68686868")) continue; 
        
        students.push({
          stt: row[0],
          name: String(row[1]).trim(),
          class: String(row[2]),
          school: String(row[3]),
          phoneNumber: String(row[4]),
          attendance: row.slice(5, 15).map(function(v) { 
            if (v === "" || v === null || v === undefined) return null;
            return (Number(v) === 1) ? 1 : 0;
          }),
          totalAmount: Number(row[15]) || 0
        });
      }
      data.sheets[name] = { className: name, students: students };
    }
  });

  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var ss = getSS();
  var contents = e.postData.contents;
  var postData = JSON.parse(contents);
  var action = postData.action;

  if (action === "updateSettings") {
    var feeSheet = ss.getSheetByName("hocphi");
    if (feeSheet) {
      if (postData.password) feeSheet.getRange("C2").setValue(postData.password);
      if (postData.fees) {
        var feeValues = feeSheet.getDataRange().getValues();
        postData.fees.forEach(function(item) {
          // Tìm hàng chứa tên lớp ở cột A để cập nhật cột B, tránh lỗi lệch dòng
          for (var r = 0; r < feeValues.length; r++) {
            var label = String(feeValues[r][0]).toLowerCase().replace(/\s/g, "");
            var target = String(item.className).toLowerCase().replace(/\s/g, "");
            if (label === target || label.indexOf(target) !== -1) {
              feeSheet.getRange(r + 1, 2).setValue(item.fee);
              break;
            }
          }
        });
      }
      return createResponse("Cập nhật thành công", 200);
    }
    return createResponse("Không tìm thấy sheet hocphi", 404);
  }

  if (action === "importStudents") {
    var students = postData.data;
    var grouped = {};
    students.forEach(function(s) {
      if (!grouped[s.gradeKey]) grouped[s.gradeKey] = [];
      grouped[s.gradeKey].push(s);
    });
    
    for (var grade in grouped) {
      var sheet = ss.getSheetByName(grade);
      if (sheet) {
        var lastRow = sheet.getLastRow();
        if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 16).clearContent();
        var rows = grouped[grade].map(function(s, index) {
          return [index + 1, s.name, s.class, s.school, String(s.phoneNumber), "", "", "", "", "", "", "", "", "", "", 0];
        });
        if (rows.length > 0) sheet.getRange(2, 1, rows.length, 16).setValues(rows);
      }
    }
    return createResponse("Nhập danh sách thành công", 200);
  }

  if (action === "updateAttendance") {
    var sheet = ss.getSheetByName(postData.className);
    if (!sheet) return createResponse("Lớp không tồn tại", 404);
    var values = sheet.getDataRange().getValues();
    var students = postData.students;
    
    students.forEach(function(s) {
      for (var i = 1; i < values.length; i++) {
        // So khớp chính xác Tên (Cột B) và SĐT (Cột E)
        var sheetName = String(values[i][1]).trim();
        var sheetPhone = String(values[i][4]).trim();
        var syncName = String(s.name).trim();
        var syncPhone = String(s.phoneNumber).trim();

        if (sheetName === syncName && (sheetPhone === syncPhone || syncPhone === "")) {
          var targetCol = -1;
          // Tìm ô trống đầu tiên trong 10 buổi điểm danh (Cột F đến O)
          for (var col = 5; col <= 14; col++) {
            if (values[i][col] === "" || values[i][col] === null || values[i][col] === undefined) {
              targetCol = col + 1;
              break;
            }
          }
          // Nếu tất cả đã đầy, cập nhật vào ô cuối cùng của điểm danh (Cột O)
          if (targetCol === -1) targetCol = 15;
          
          sheet.getRange(i + 1, targetCol).setValue(s.isPresent ? 1 : 0);
          sheet.getRange(i + 1, 16).setValue(s.totalAmount);
          break;
        }
      }
    });
    return createResponse("Điểm danh thành công", 200);
  }

  return createResponse("Hành động không xác định", 400);
}

function createResponse(msg, code) {
  return ContentService.createTextOutput(JSON.stringify({ message: msg, status: code }))
    .setMimeType(ContentService.MimeType.JSON);
}
