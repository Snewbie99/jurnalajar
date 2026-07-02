/**
 * JURNAL MENGAJAR INFORMATIKA - GOOGLE APPS SCRIPT
 * 
 * CARA DEPLOY:
 * 1. Buka Google Sheets Anda.
 * 2. Klik menu Ekstensi > Apps Script.
 * 3. Hapus kode yang ada, copy dan paste semua kode dari file ini.
 * 4. Klik tombol "Terapkan" (Deploy) > "Penerapan Baru" (New Deployment).
 * 5. Pilih jenis: Aplikasi Web (Web App).
 * 6. Akses: "Siapa saja" (Anyone) - PENTING AGAR API BISA DIAKSES GITHUB PAGES.
 * 7. Copy Web App URL yang diberikan.
 */

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === "getJadwal") {
    return ContentService.createTextOutput(JSON.stringify(getJadwal()))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === "getSiswa") {
    return ContentService.createTextOutput(JSON.stringify(getSiswa(e.parameter.kelas)))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Default response
  return ContentService.createTextOutput(JSON.stringify({status: "success", message: "API is running"}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  // Parsing JSON dari Request Body (krn frontend mengirim dengan JSON)
  const data = JSON.parse(e.postData.contents);
  const action = data.action;

  let response = {status: "error", message: "Unknown action"};

  if (action === "saveJurnal") {
    response = saveJurnal(data.payload);
  } else if (action === "saveAbsensi") {
    response = saveAbsensi(data.payload);
  } else if (action === "saveNilai") {
    response = saveNilai(data.payload);
  }

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// FUNGSI GET (BACA DATA)
// ==========================================

function getJadwal() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("JADWAL");
  if (!sheet) return { status: "error", message: "Sheet JADWAL tidak ditemukan" };

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  let jadwal = [];
  
  for (let i = 1; i < data.length; i++) {
    let row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    if (row["Kelas"]) {
      jadwal.push(row);
    }
  }
  
  return { status: "success", data: jadwal };
}

function getSiswa(namaKelas) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(namaKelas);
  if (!sheet) return { status: "error", message: `Sheet ${namaKelas} tidak ditemukan` };

  const data = sheet.getDataRange().getValues();
  let siswa = [];
  
  // Asumsi header ada di baris pertama atau kedua. Cari kolom "Nama"
  let namaIndex = -1;
  let headerRow = 0;
  
  for(let i=0; i<3; i++) { // Cari dalam 3 baris pertama
    for(let j=0; j<data[i].length; j++) {
      if(String(data[i][j]).toLowerCase().includes("nama")) {
        namaIndex = j;
        headerRow = i;
        break;
      }
    }
    if(namaIndex !== -1) break;
  }

  if (namaIndex === -1) return { status: "error", message: "Kolom Nama tidak ditemukan" };

  for (let i = headerRow + 1; i < data.length; i++) {
    let nama = data[i][namaIndex];
    if (nama) {
      siswa.push({ no: i - headerRow, nama: nama });
    }
  }
  
  return { status: "success", data: siswa };
}

// ==========================================
// FUNGSI POST (TULIS DATA)
// ==========================================

function saveJurnal(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("JURNAL");
  if (!sheet) {
    sheet = ss.insertSheet("JURNAL");
    sheet.appendRow(["Hari Tanggal", "Kelas", "Jam Ke", "Materi", "Kegiatan Pembelajaran", "Asesmen", "Catatan"]);
  }

  // ['Hari Tanggal', 'Kelas', 'Jam Ke', 'TP/Materi', 'Kegiatan', 'Asesmen', 'Catatan']
  const dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
  
  sheet.appendRow([
    dateStr,
    payload.kelas,
    payload.jamKe,
    payload.materi,
    payload.kegiatan,
    payload.asesmen || "",
    payload.catatan || ""
  ]);

  return { status: "success", message: "Jurnal berhasil disimpan" };
}

function saveAbsensi(payload) {
  // Payload: { kelas: "7 A", tanggal: "2026-07-02", dataSiswa: [{nama: "Budi", status: "Hadir"}, ...] }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(payload.kelas);
  if (!sheet) return { status: "error", message: "Sheet kelas tidak ditemukan" };

  // Untuk kesederhanaan, kita bisa menyimpan rekap absen di sheet terpisah "REKAP ABSEN" 
  // atau langsung di sheet kelas (menambah kolom baru).
  // Di sini kita pilih menambah row di sheet "REKAP ABSEN" agar tidak merusak format excel asli.
  let absenSheet = ss.getSheetByName("REKAP ABSEN");
  if(!absenSheet) {
    absenSheet = ss.insertSheet("REKAP ABSEN");
    absenSheet.appendRow(["Tanggal", "Kelas", "Nama Siswa", "Status"]);
  }

  payload.dataSiswa.forEach(siswa => {
    absenSheet.appendRow([payload.tanggal, payload.kelas, siswa.nama, siswa.status]);
  });

  return { status: "success", message: "Absensi berhasil disimpan" };
}

function saveNilai(payload) {
  // Menyimpan di sheet "REKAP NILAI" agar rapi
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let nilaiSheet = ss.getSheetByName("REKAP NILAI");
  if(!nilaiSheet) {
    nilaiSheet = ss.insertSheet("REKAP NILAI");
    nilaiSheet.appendRow(["Tanggal", "Kelas", "Nama Tugas/Materi", "Nama Siswa", "Nilai"]);
  }

  payload.dataSiswa.forEach(siswa => {
    nilaiSheet.appendRow([payload.tanggal, payload.kelas, payload.materi, siswa.nama, siswa.nilai]);
  });

  return { status: "success", message: "Nilai berhasil disimpan" };
}

// SETUP HELPER (untuk membuat struktur tabel secara otomatis jika dijalankan di Editor)
function setupTabelAwal() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if(!ss.getSheetByName("JADWAL")) {
    let sheet = ss.insertSheet("JADWAL");
    sheet.appendRow(["Hari", "Jam", "Kelas", "Materi"]);
    sheet.appendRow(["Senin", "1-2", "7 A", "Berpikir Komputasional"]);
    sheet.appendRow(["Senin", "3-4", "7 B", "Algoritma"]);
  }
}
