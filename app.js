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

                    // Format item.Jam e.g. "3 (09.10-09.45)"
                    let jamStr = item.Jam || "1 (08.00-08.35)";
                    let jamKeMatch = jamStr.match(/^(\d+)/);
                    let jamKe = jamKeMatch ? jamKeMatch[1] : "1";

                    let timeMatch = jamStr.match(/\(([\d\.]+)-/);
                    let hour = "08";
                    let min = "00";
                    let ampm = "AM";
                    if (timeMatch) {
                        let parts = timeMatch[1].split('.');
                        let h = parseInt(parts[0]);
                        ampm = h >= 12 ? "PM" : "AM";
                        let h12 = h > 12 ? h - 12 : h;
                        if (h12 === 0) h12 = 12;
                        hour = h12.toString().padStart(2, '0');
                        min = parts[1] || "00";
                    }

                    const html = `
                        <a href="kelas.html?kelas=${kelasEncoded}" class="flex gap-4 p-3 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer mb-3 items-center">
                            <div class="flex flex-col items-center justify-center w-12 border-r border-outline-variant pr-4">
                                <span class="font-label-md text-primary font-bold">${hour}:${min}</span>
                                <span class="text-[10px] text-tertiary font-bold">${ampm}</span>
                            </div>
                            <div class="flex-1">
                                <p class="font-label-md text-on-surface font-bold text-sm leading-tight mb-1">${item.Kelas || 'Kelas'}</p>
                                <p class="font-body-sm text-tertiary text-xs line-clamp-1 mb-1">${item.Materi || 'Informatika'}</p>
                                <p class="text-[10px] text-primary font-bold">Jam ke-${jamKe}</p>
                            </div>
                            <div>
                                <span class="material-symbols-outlined text-tertiary">arrow_forward</span>
                            </div>
                        </a>
                    `;
                    container.insertAdjacentHTML('beforeend', html);
                });
            }
        } else {
            container.innerHTML = `<p class="text-center text-tertiary">Jadwal kosong.</p>`;
        }
    } catch (error) {
        console.error("Gagal memuat jadwal:", error);
        loader.classList.add('hidden');
        errorMsg.classList.remove('hidden');
    }
}

async function loadJadwalMingguan() {
    const loader = document.getElementById('loader-jadwal');
    // Cari container untuk tailwind (dynamic-events) atau fallback (schedule-container)
    const container = document.getElementById('dynamic-events') || document.getElementById('schedule-container');

    if (!container) return;

    if (GAS_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE") return;

    try {
        if (loader) loader.classList.remove('hidden');
        const response = await fetch(`${GAS_URL}?action=getJadwal`);
        const result = await response.json();

        if (loader) loader.classList.add('hidden');

        if (result.status === "success" && result.data.length > 0) {
            container.innerHTML = '';

            // Jika container adalah dynamic-events (Tailwind Absolute Positioning)
            if (container.id === 'dynamic-events') {
                const dayMap = { 'Senin': 0, 'Selasa': 1, 'Rabu': 2, 'Kamis': 3, 'Jumat': 4 };
                const colors = [
                    { bg: 'bg-primary-fixed', border: 'border-primary', text: 'text-primary' },
                    { bg: 'bg-secondary-fixed-dim', border: 'border-secondary', text: 'text-on-secondary-fixed-variant' },
                    { bg: 'bg-surface-container-high', border: 'border-surface-tint', text: 'text-on-primary-fixed-variant' },
                    { bg: 'bg-error-container', border: 'border-error', text: 'text-on-error-container' },
                    { bg: 'bg-secondary-container', border: 'border-secondary', text: 'text-on-secondary-container' }
                ];

                result.data.forEach((item) => {
                    const hari = item.Hari ? item.Hari.trim() : '';
                    if (dayMap[hari] === undefined) return;
                    const dayIndex = dayMap[hari];

                    let startH = 8, startM = 0, endH = 9, endM = 0;
                    let match = (item.Jam || "").match(/\(([\d\.]+)-([\d\.]+)\)/);
                    if (match) {
                        let p1 = match[1].split('.');
                        let p2 = match[2].split('.');
                        if (p1.length >= 2) { startH = parseInt(p1[0]); startM = parseInt(p1[1]); }
                        if (p2.length >= 2) { endH = parseInt(p2[0]); endM = parseInt(p2[1]); }
                    }

                    let startTotalMins = (startH - 8) * 60 + startM;
                    let endTotalMins = (endH - 8) * 60 + endM;
                    let durationMins = endTotalMins - startTotalMins;
                    if (durationMins <= 0) durationMins = 35; // fallback

                    let topPx = startTotalMins * (80 / 60);
                    let heightPx = durationMins * (80 / 60);

                    let leftStyle = `calc(80px + (100% - 80px) / 5 * ${dayIndex})`;
                    let widthStyle = `calc((100% - 80px) / 5)`;

                    const color = colors[dayIndex % colors.length];
                    const kelasEncoded = encodeURIComponent(item.Kelas);
                    let timeStr = match ? `${match[1].replace('.', ':')} - ${match[2].replace('.', ':')}` : (item.Jam || '');

                    const html = `
                    <div class="absolute p-1 z-10 pointer-events-auto hover:z-50" style="left: ${leftStyle}; top: ${topPx}px; width: ${widthStyle}; min-height: ${heightPx}px;">
                        <a href="kelas.html?kelas=${kelasEncoded}" class="block min-h-full h-auto ${color.bg} border-l-4 ${color.border} rounded-lg p-2 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer no-underline text-left">
                            <p class="font-bold text-[10px] md:text-xs ${color.text} mb-1 uppercase">${item.Kelas || 'Kelas'}</p>
                            <p class="text-[10px] md:text-sm font-bold text-on-surface leading-tight">${item.Materi || 'Informatika'}</p>
                            <p class="text-[9px] md:text-[11px] ${color.text} mt-1">${timeStr}</p>
                        </a>
                    </div>`;
                    container.insertAdjacentHTML('beforeend', html);
                });
            } else {
                // Fallback rendering lama
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

// Fitur Profil
async function loadProfil() {
    console.log("loadProfil() dipanggil!");
    try {
        const response = await fetch(`${GAS_URL}?action=getProfil&t=${new Date().getTime()}`);
        const result = await response.json();
        console.log("Hasil profil:", result);

        if (result.status === "success" && result.data) {
            const profil = result.data;
            const namaGuru = profil['Nama Guru'] || profil['Nama'];
            const tahunAjaran = profil['Tahun Ajaran'];
            const mapel = profil['Mata Pelajaran'];
            const fotoUrl = profil['Foto Profil URL'];

            // Update DOM jika ada id
            const elSapaan = document.getElementById('sapaan-guru');
            if (elSapaan && namaGuru) elSapaan.textContent = `Selamat Datang, ${namaGuru}`;

            const elNamaSidebar = document.getElementById('nama-guru-sidebar');
            if (elNamaSidebar && namaGuru) elNamaSidebar.textContent = namaGuru;

            const elTahunSidebar = document.getElementById('tahun-ajaran-sidebar');
            if (elTahunSidebar && tahunAjaran) elTahunSidebar.textContent = tahunAjaran;

            const elFoto = document.getElementById('foto-profil-sidebar');
            if (elFoto && fotoUrl) elFoto.src = fotoUrl;
        }
    } catch (error) {
        console.error("Gagal memuat profil:", error);
    }
}
