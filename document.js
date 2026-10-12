// ==================== INDEXEDDB SETUP ====================
const DB_NAME = 'INF_C_Database';
const DB_VERSION = 2; // Ditingkatkan ke v2 agar bisa membaca store 'jadwal'
const STORE_NAME = 'uploads';
let db;

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
            if (!database.objectStoreNames.contains('jadwal')) {
                database.createObjectStore('jadwal', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

function getAllUploads() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => {
            const data = request.result.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
            resolve(data);
        };
        request.onerror = () => reject(request.error);
    });
}

function getAllJadwalFromIndexedDB() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['jadwal'], 'readonly');
        const store = transaction.objectStore('jadwal');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// ==================== RENDER FUNCTIONS ====================
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function renderPublicContent() {
    try {
        const items = await getAllUploads();
        
        // 1. Render Learning Materials
        const materials = items.filter(i => i.type === 'material');
        const learningGrid = document.getElementById('learning-grid');
        if (learningGrid) {
            if (materials.length === 0) {
                learningGrid.innerHTML = `<div class="empty-state"><i class="fas fa-book"></i><p>Belum ada materi yang diupload.</p></div>`;
            } else {
                learningGrid.innerHTML = materials.map(item => {
                    const iconClass = item.materialType === 'ppt' ? 'ppt' : item.materialType === 'doc' ? 'doc' : 'pdf';
                    const iconFa = item.materialType === 'ppt' ? 'fa-file-powerpoint' : item.materialType === 'doc' ? 'fa-file-word' : 'fa-file-pdf';
                    const fileSizeMB = item.fileSize ? (item.fileSize / 1024 / 1024).toFixed(2) : '0';
                    const fileUrl = URL.createObjectURL(item.fileData);
                    
                    return `
                    <div class="learning-card">
                        <div class="learning-card-header">
                            <div class="material-icon ${iconClass}"><i class="fas ${iconFa}"></i></div>
                            <div class="material-type">${item.materialType.toUpperCase()}</div>
                        </div>
                        <div class="learning-card-body">
                            <h3>${escapeHtml(item.title)}</h3>
                            <p class="material-meta"><i class="fas fa-calendar"></i> ${formatDate(item.uploadedAt)}</p>
                            <p class="material-file"><i class="fas fa-file"></i> ${escapeHtml(item.fileName)} (${fileSizeMB} MB)</p>
                        </div>
                        <div class="learning-card-footer">
                            <a href="${fileUrl}" target="_blank" class="btn-download">
                                <i class="fas fa-external-link-alt"></i> Buka / Download
                            </a>
                        </div>
                    </div>`;
                }).join('');
            }
        }

        // 2. Render Photos
        const photos = items.filter(i => i.type === 'photo');
        const photoGrid = document.getElementById('photo-grid');
        if (photoGrid) {
            if (photos.length === 0) {
                photoGrid.innerHTML = `<div class="empty-state"><i class="fas fa-camera"></i><p>Belum ada foto yang diupload.</p></div>`;
            } else {
                photoGrid.innerHTML = photos.map(item => {
                    const photoUrl = URL.createObjectURL(item.fileData);
                    return `
                    <div class="photo-card" onclick="viewPublicPhoto('${escapeHtml(item.title)}', '${photoUrl}')">
                        <div class="photo-image">
                            <img src="${photoUrl}" alt="${escapeHtml(item.title)}" loading="lazy" onload="URL.revokeObjectURL(this.src)">
                            <div class="photo-overlay"><i class="fas fa-search-plus"></i></div>
                        </div>
                        <div class="photo-info">
                            <h4>${escapeHtml(item.title)}</h4>
                            <p>${formatDate(item.uploadedAt)}</p>
                        </div>
                    </div>`;
                }).join('');
            }
        }

        // 3. Render Videos
        const videos = items.filter(i => i.type === 'video');
        const videoGrid = document.getElementById('video-grid');
        if (videoGrid) {
            if (videos.length === 0) {
                videoGrid.innerHTML = `<div class="empty-state"><i class="fas fa-video"></i><p>Belum ada video yang diupload.</p></div>`;
            } else {
                videoGrid.innerHTML = videos.map(item => `
                    <div class="video-card">
                        <div class="video-thumbnail">
                            <div class="video-placeholder"><i class="fas fa-play-circle"></i></div>
                            <div class="video-overlay" onclick="openPublicVideo('${escapeHtml(item.url)}', '${escapeHtml(item.title)}')">
                                <i class="fas fa-play"></i>
                                <span>Tonton Video</span>
                            </div>
                        </div>
                        <div class="video-info">
                            <h3>${escapeHtml(item.title)}</h3>
                            <p class="video-meta"><i class="fas fa-calendar"></i> ${formatDate(item.uploadedAt)}</p>
                        </div>
                    </div>
                `).join('');
            }
        }

        // 4. Render TikToks
        const tiktoks = items.filter(i => i.type === 'tiktok');
        const tiktokGrid = document.getElementById('tiktok-grid');
        if (tiktokGrid) {
            if (tiktoks.length === 0) {
                tiktokGrid.innerHTML = `<div class="empty-state"><i class="fab fa-tiktok"></i><p>Belum ada video TikTok yang diupload.</p></div>`;
            } else {
                tiktokGrid.innerHTML = tiktoks.map(item => `
                    <div class="video-card">
                        <div class="video-thumbnail">
                            <div class="video-placeholder"><i class="fab fa-tiktok"></i></div>
                            <div class="video-overlay" onclick="openPublicTiktok('${escapeHtml(item.url)}', '${escapeHtml(item.title)}')">
                                <i class="fas fa-play"></i>
                                <span>Tonton TikTok</span>
                            </div>
                        </div>
                        <div class="video-info">
                            <h3>${escapeHtml(item.title)}</h3>
                            <p class="video-meta"><i class="fas fa-calendar"></i> ${formatDate(item.uploadedAt)}</p>
                        </div>
                    </div>
                `).join('');
            }
        }

    } catch (error) {
        console.error('Gagal memuat konten:', error);
    }
}

async function renderPublicJadwal() {
    try {
        const jadwalData = await getAllJadwalFromIndexedDB();
        const tbody = document.getElementById('public-jadwal-body');
        const emptyState = document.getElementById('empty-state-public-jadwal');
        const table = document.getElementById('public-jadwal-table');

        if (!tbody) return;

        if (jadwalData.length === 0) {
            table.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            table.style.display = 'table';
            emptyState.style.display = 'none';
            
            const hariOrder = { 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6 };
            jadwalData.sort((a, b) => {
                if (hariOrder[a.hari] !== hariOrder[b.hari]) {
                    return hariOrder[a.hari] - hariOrder[b.hari];
                }
                return a.kode.localeCompare(b.kode);
            });

            tbody.innerHTML = jadwalData.map((item, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td><strong>${item.hari}</strong></td>
                    <td>${item.kode}</td>
                    <td>${escapeHtml(item.mk)}</td>
                    <td style="text-align: center;">${item.sks}</td>
                    <td>${item.ruang}</td>
                    <td>
                        <div style="font-weight: 600;">${escapeHtml(item.pjNama)}</div>
                        <small style="color: #666;">NIM: ${escapeHtml(item.pjNim)}</small>
                    </td>
                    <td>
                        <a href="https://wa.me/${item.pjWa.replace(/\D/g, '')}" target="_blank" class="btn-action btn-edit" style="text-decoration: none; display: inline-flex; align-items: center; gap: 5px;">
                            <i class="fab fa-whatsapp"></i> ${item.pjWa}
                        </a>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Gagal memuat jadwal:', error);
    }
}

// ==================== INTERACTION FUNCTIONS ====================
function viewPublicPhoto(title, imageUrl) {
    Swal.fire({
        title: escapeHtml(title),
        imageUrl: imageUrl,
        imageAlt: title,
        showConfirmButton: true,
        confirmButtonText: 'Tutup',
        confirmButtonColor: '#0047AB',
        width: '80%',
        imageMaxWidth: '100%',
        imageMaxHeight: '70vh'
    });
}

function openPublicVideo(url, title) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        const videoId = (match && match[2].length === 11) ? match[2] : null;
        
        if (videoId) {
            Swal.fire({
                title: escapeHtml(title),
                html: `
                    <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
                        <iframe src="https://www.youtube.com/embed/${videoId}" 
                            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen></iframe>
                    </div>
                `,
                width: '80%',
                showConfirmButton: false,
                showCloseButton: true
            });
            return;
        }
    }
    window.open(url, '_blank');
}

function openPublicTiktok(url, title) {
    window.open(url, '_blank');
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initDB();
        renderPublicContent();
        renderPublicJadwal();
    } catch (error) {
        console.error('Database initialization failed:', error);
    }
});