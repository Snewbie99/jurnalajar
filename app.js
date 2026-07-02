/**
 * JURNAL MENGAJAR - FRONTEND LOGIC
 * Ganti URL di bawah ini dengan Web App URL dari Google Apps Script Anda setelah di-deploy.
 */
const GAS_URL = "https://script.google.com/macros/s/AKfycbxsr_cCyBNPtztZFcYAmyECv1sxhKeLHzNiAmLykiOTEsqhyWEKWYhzSOYDwoYM9cziew/exec";

// Utility: Mendapatkan Parameter dari URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Format Tanggal YYYY-MM-DD
function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// ==========================================
// LOGIKA DASHBOARD (index.html)
// ==========================================
async function loadJadwal() {
    const loader = document.getElementById('loader-jadwal');
    const errorMsg = document.getElementById('error-jadwal');
    const container = document.getElementById('schedule-container');

    if (!container) return; // Bukan di halaman index

    if (GAS_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE") {
        loader.classList.add('hidden');
        container.innerHTML = `
            <div style="background: rgba(239, 68, 68, 0.2); padding: 15px; border-radius: 8px; border: 1px solid var(--danger);">
                <strong>Perhatian:</strong> Anda belum memasukkan GAS_URL di app.js. Silakan ikuti panduan setup Google Apps Script terlebih dahulu.
            </div>`;
        return;
    }

    try {
        loader.classList.remove('hidden');
        const response = await fetch(`${GAS_URL}?action=getJadwal`);
        const result = await response.json();

        loader.classList.add('hidden');

        if (result.status === "success" && result.data.length > 0) {
            container.innerHTML = ''; // bersihkan

            // Dapatkan hari ini dalam bahasa Indonesia
            const namaHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
            const hariIni = namaHari[new Date().getDay()];

            // Filter jadwal hanya hari ini
            const jadwalHariIni = result.data.filter(item => item.Hari === hariIni);

            if (jadwalHariIni.length === 0) {
                container.innerHTML = `<p style="text-align:center; color: var(--text-muted);">Tidak ada jadwal mengajar pada hari ${hariIni}.</p>`;
            } else {
                jadwalHariIni.forEach(item => {
                    const kelasEncoded = encodeURIComponent(item.Kelas);
                    const html = `
                        <a href="kelas.html?kelas=${kelasEncoded}" class="schedule-item">
                            <div>
                                <div class="schedule-time">${item.Jam || ''}</div>
                                <div class="schedule-class">${item.Kelas || 'Kelas'}</div>
                                <div class="schedule-subject">${item.Materi || 'Informatika'}</div>
                            </div>
                            <div class="schedule-action">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                            </div>
                        </a>
                    `;
                    container.insertAdjacentHTML('beforeend', html);
                });
            }
        } else {
            container.innerHTML = `<p style="text-align:center; color: var(--text-muted);">Jadwal kosong.</p>`;
        }
    } catch (error) {
        console.error("Gagal memuat jadwal:", error);
        loader.classList.add('hidden');
        errorMsg.classList.remove('hidden');
    }
}

async function loadJadwalMingguan() {
    const loader = document.getElementById('loader-jadwal');
    const container = document.getElementById('schedule-container');

    if (!container) return;

    if (GAS_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE") return;

    try {
        loader.classList.remove('hidden');
        const response = await fetch(`${GAS_URL}?action=getJadwal`);
        const result = await response.json();

        loader.classList.add('hidden');

        if (result.status === "success" && result.data.length > 0) {
            container.innerHTML = '';

            const grouped = {};
            result.data.forEach(item => {
                const hari = item.Hari || 'Lainnya';
                if (!grouped[hari]) grouped[hari] = [];
                grouped[hari].push(item);
            });

            for (const hari in grouped) {
                const htmlHeader = `<h4 style="margin: 15px 0 10px 0; color: #818cf8; border-bottom: 1px solid var(--glass-border); padding-bottom: 5px;">${hari}</h4>`;
                container.insertAdjacentHTML('beforeend', htmlHeader);

                grouped[hari].forEach(item => {
                    const kelasEncoded = encodeURIComponent(item.Kelas);
                    const html = `
                        <a href="kelas.html?kelas=${kelasEncoded}" class="schedule-item">
                            <div>
                                <div class="schedule-time">${item.Jam || ''}</div>
                                <div class="schedule-class">${item.Kelas || 'Kelas'}</div>
                                <div class="schedule-subject">${item.Materi || 'Informatika'}</div>
                            </div>
                        </a>
                    `;
                    container.insertAdjacentHTML('beforeend', html);
                });
            }
        } else {
            container.innerHTML = `<p style="text-align:center; color: var(--text-muted);">Tidak ada jadwal.</p>`;
        }
    } catch (err) {
        console.error(err);
    }
}


// ==========================================
// LOGIKA HALAMAN KELAS (kelas.html)
// ==========================================

let currentClassData = []; // Simpan data siswa sementara

async function initKelasPage() {
    const kelas = getQueryParam('kelas');
    if (!kelas) {
        window.location.href = 'index.html'; // redirect jika tidak ada param
        return;
    }

    document.getElementById('class-title').innerText = `Kelas ${kelas}`;

    // Load data siswa untuk absensi dan nilai
    await loadSiswa(kelas);
}

function switchTab(tabId) {
    // Hilangkan active dari semua tombol dan konten
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Aktifkan yang dipilih
    document.querySelector(`button[onclick="switchTab('${tabId}')"]`).classList.add('active');
    document.getElementById(`tab-${tabId}`).classList.add('active');
}

async function loadSiswa(kelas) {
    const loader = document.getElementById('loader-siswa');
    const containerAbsen = document.getElementById('student-list-absensi');
    const containerNilai = document.getElementById('student-list-nilai');

    if (GAS_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE") return;

    try {
        loader.classList.remove('hidden');
        const response = await fetch(`${GAS_URL}?action=getSiswa&kelas=${encodeURIComponent(kelas)}`);
        const result = await response.json();

        loader.classList.add('hidden');

        if (result.status === "success" && result.data) {
            currentClassData = result.data;
            renderSiswa(result.data, containerAbsen, containerNilai);
        } else {
            containerAbsen.innerHTML = `<p style="color:var(--danger)">Gagal memuat data siswa. Pastikan Sheet bernama '${kelas}' ada.</p>`;
            containerNilai.innerHTML = '';
        }

    } catch (error) {
        console.error("Gagal memuat siswa:", error);
        loader.classList.add('hidden');
    }
}

function renderSiswa(dataSiswa, containerAbsen, containerNilai) {
    containerAbsen.innerHTML = '';
    containerNilai.innerHTML = '';

    dataSiswa.forEach((siswa, index) => {
        // Render Absensi
        const htmlAbsen = `
            <div class="student-item">
                <div class="student-name">${siswa.no}. ${siswa.nama}</div>
                <div class="status-options">
                    <input type="radio" name="status-${index}" id="h-${index}" class="status-radio" value="Hadir" checked>
                    <label for="h-${index}" class="status-label" data-status="H">H</label>

                    <input type="radio" name="status-${index}" id="s-${index}" class="status-radio" value="Sakit">
                    <label for="s-${index}" class="status-label" data-status="S">S</label>

                    <input type="radio" name="status-${index}" id="i-${index}" class="status-radio" value="Izin">
                    <label for="i-${index}" class="status-label" data-status="I">I</label>

                    <input type="radio" name="status-${index}" id="a-${index}" class="status-radio" value="Alpa">
                    <label for="a-${index}" class="status-label" data-status="A">A</label>
                </div>
            </div>
        `;
        containerAbsen.insertAdjacentHTML('beforeend', htmlAbsen);

        // Render Nilai
        const htmlNilai = `
            <div class="student-item">
                <div class="student-name">${siswa.no}. ${siswa.nama}</div>
                <div>
                    <input type="number" id="nilai-${index}" class="form-control nilai-input" min="0" max="100" placeholder="0">
                </div>
            </div>
        `;
        containerNilai.insertAdjacentHTML('beforeend', htmlNilai);
    });
}

// POST REQUEST HELPER
async function sendPostRequest(payload, actionName, btnId) {
    const btn = document.getElementById(btnId);
    const originalText = btn.innerText;
    btn.innerText = 'Menyimpan...';
    btn.disabled = true;

    try {
        const response = await fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: actionName,
                payload: payload
            })
        });

        const result = await response.json();
        if (result.status === "success") {
            alert("Data berhasil disimpan!");
        } else {
            alert("Gagal: " + result.message);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Terjadi kesalahan jaringan.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}


// AKSI TOMBOL SUBMIT
async function submitAbsensi() {
    const kelas = getQueryParam('kelas');
    let dataSiswa = [];

    currentClassData.forEach((siswa, index) => {
        const selectedRadio = document.querySelector(`input[name="status-${index}"]:checked`);
        dataSiswa.push({
            nama: siswa.nama,
            status: selectedRadio ? selectedRadio.value : "Hadir"
        });
    });

    const payload = {
        kelas: kelas,
        tanggal: getTodayDate(),
        dataSiswa: dataSiswa
    };

    await sendPostRequest(payload, "saveAbsensi", "btn-submit-absen");
}

async function submitJurnal() {
    const kelas = getQueryParam('kelas');
    const jamKe = document.getElementById('jurnal-jam').value;
    const materi = document.getElementById('jurnal-materi').value;
    const kegiatan = document.getElementById('jurnal-kegiatan').value;
    const asesmen = document.getElementById('jurnal-asesmen').value;
    const catatan = document.getElementById('jurnal-catatan').value;

    if (!jamKe || !materi || !kegiatan) {
        alert("Harap lengkapi jam, materi, dan kegiatan.");
        return;
    }

    const payload = {
        kelas: kelas,
        jamKe: jamKe,
        materi: materi,
        kegiatan: kegiatan,
        asesmen: asesmen,
        catatan: catatan
    };

    await sendPostRequest(payload, "saveJurnal", "btn-submit-jurnal");
}

async function submitNilai() {
    const kelas = getQueryParam('kelas');
    const materi = document.getElementById('nilai-materi').value;

    if (!materi) {
        alert("Harap isi nama tugas/asesmen terlebih dahulu.");
        return;
    }

    let dataSiswa = [];
    currentClassData.forEach((siswa, index) => {
        const nilaiInput = document.getElementById(`nilai-${index}`).value;
        if (nilaiInput !== "") {
            dataSiswa.push({
                nama: siswa.nama,
                nilai: nilaiInput
            });
        }
    });

    if (dataSiswa.length === 0) {
        alert("Belum ada nilai yang diinput satupun.");
        return;
    }

    const payload = {
        kelas: kelas,
        tanggal: getTodayDate(),
        materi: materi,
        dataSiswa: dataSiswa
    };

    await sendPostRequest(payload, "saveNilai", "btn-submit-nilai");
}
