// ==================== APP VERSION INFO ====================
const APP_CONFIG = {
    version: '1.0.0',
    build: '20261006',
    year: '2026',
    name: 'Website Resmi INF C',
    developer: 'Devin Kholifandriya',
    institution: 'UIN Prof. K.H. Saifuddin Zuhri'
};

// ==================== INDEXEDDB SETUP ====================
const DB_NAME = 'INF_C_Database';
const DB_VERSION = 1;
const STORE_NAME = 'uploads';
let db;

function initIndexedDB() {
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
        };
    });
}

function getAllMaterialsFromDB() {
    return new Promise((resolve, reject) => {
        if (!db) {
            resolve([]);
            return;
        }
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => {
            const materials = request.result.filter(item => item.type === 'material');
            const sorted = materials.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
            resolve(sorted);
        };
        request.onerror = () => reject(request.error);
    });
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
    
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    try {
        await initIndexedDB();
        const user = JSON.parse(currentUser);
        if (!user.name || !user.nim) throw new Error('Invalid user data');

        applySavedTheme();
        applySavedFontSize();
        loadUserData(user);
        initSidebarMenu();
        initProfileForm(user);
        initAppearanceSettings();
        await initNotificationSettings();
        initPrivacySettings();
        initAccountActions(user);
        initAboutSection();
        initLogoutButton();

    } catch (error) {
        console.error('Error initializing settings:', error);
        showToast('Terjadi kesalahan saat memuat pengaturan', 'error');
    }
});

// ==================== THEME FUNCTIONS ====================
function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
}

function applyTheme(themeName) {
    document.body.classList.remove('theme-light', 'theme-dark');
    
    if (themeName === 'dark') {
        document.body.classList.add('theme-dark');
    } else if (themeName === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            document.body.classList.add('theme-dark');
        } else {
            document.body.classList.add('theme-light');
        }
    } else {
        document.body.classList.add('theme-light');
    }
    
    const radio = document.querySelector(`input[name="theme"][value="${themeName}"]`);
    if (radio) {
        radio.checked = true;
        updateThemeCardVisual(themeName);
    }
}

function updateThemeCardVisual(themeName) {
    document.querySelectorAll('.theme-option').forEach(card => {
        card.classList.remove('active');
    });
    
    const selectedCard = document.querySelector(`input[name="theme"][value="${themeName}"]`).closest('.theme-option');
    if (selectedCard) {
        selectedCard.classList.add('active');
    }
}

// Fungsi global untuk memilih tema
function selectTheme(themeName) {
    localStorage.setItem('theme', themeName);
    applyTheme(themeName);
    showToast(`Tema diubah ke: ${getThemeName(themeName)}`, 'success');
}

function getThemeName(value) {
    const names = { light: 'Terang', dark: 'Gelap', auto: 'Otomatis' };
    return names[value] || value;
}

// ==================== FONT SIZE FUNCTIONS ====================
function applySavedFontSize() {
    const savedSize = localStorage.getItem('fontSize') || 'medium';
    applyFontSize(savedSize);
}

function applyFontSize(size) {
    const root = document.documentElement;
    const sizes = {
        small: '14px',
        medium: '16px',
        large: '18px'
    };
    
    root.style.setProperty('--base-font-size', sizes[size] || '16px');
    
    document.querySelectorAll('.font-size-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.size === size) {
            btn.classList.add('active');
        }
    });
}

// Fungsi global untuk memilih ukuran font
function selectFontSize(size) {
    localStorage.setItem('fontSize', size);
    applyFontSize(size);
    showToast(`Ukuran font diubah ke: ${getFontSizeName(size)}`, 'success');
}

function getFontSizeName(size) {
    const names = { small: 'Kecil', medium: 'Sedang', large: 'Besar' };
    return names[size] || size;
}

// ==================== LOAD USER DATA ====================
function loadUserData(user) {
    const cleanName = cleanString(user.name);
    const displayName = cleanName || 'User';
    const nim = String(user.nim).trim();
    const formattedNIM = nim.match(/.{1,4}/g)?.join(' ') || nim;
    
    const nameParts = displayName.split(' ').filter(n => n.length > 0);
    const initials = nameParts.length >= 2 
        ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
        : displayName.substring(0, 2).toUpperCase();

    document.getElementById('sidebar-initials').textContent = initials;
    document.getElementById('sidebar-name').textContent = displayName;
    document.getElementById('sidebar-nim').textContent = `NIM: ${formattedNIM}`;

    const badge = document.getElementById('settings-user-badge');
    badge.innerHTML = `
        <div class="badge-avatar">${initials}</div>
        <span class="badge-name">${escapeHtml(displayName)}</span>
    `;

    document.getElementById('profile-initials').textContent = initials;
    document.getElementById('profile-display-name').textContent = displayName;
    document.getElementById('profile-display-nim').textContent = `NIM: ${formattedNIM}`;
    
    const joinedDate = user.registeredAt 
        ? new Date(user.registeredAt).toLocaleDateString('id-ID', { 
            day: 'numeric', month: 'long', year: 'numeric' 
          })
        : 'Tidak diketahui';
    document.getElementById('profile-joined-date').textContent = joinedDate;

    document.getElementById('edit-name').value = displayName;
    document.getElementById('edit-nim').value = nim;

    document.getElementById('last-login-time').textContent = 
        new Date().toLocaleString('id-ID', { 
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
}

// ==================== SIDEBAR MENU ====================
function initSidebarMenu() {
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.settings-section');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(mi => mi.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            item.classList.add('active');

            const sectionId = 'section-' + item.dataset.section;
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
}

// ==================== PROFILE FORM ====================
function initProfileForm(user) {
    const form = document.getElementById('profile-form');
    const cancelBtn = document.getElementById('btn-cancel-profile');

    cancelBtn.addEventListener('click', () => {
        document.getElementById('edit-name').value = user.name;
        showToast('Perubahan dibatalkan', 'warning');
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const newName = document.getElementById('edit-name').value.trim();

        if (!newName || newName.length < 3) {
            showToast('Nama minimal 3 karakter!', 'error');
            return;
        }

        try {
            const userData = {
                ...user,
                name: newName,
                updatedAt: new Date().toISOString()
            };

            localStorage.setItem('user_' + user.nim, JSON.stringify(userData));
            sessionStorage.setItem('currentUser', JSON.stringify(userData));

            loadUserData(userData);
            showToast('Profil berhasil diperbarui!', 'success');
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast('Gagal memperbarui profil', 'error');
        }
    });
}

// ==================== APPEARANCE SETTINGS ====================
function initAppearanceSettings() {
    // Theme selection via radio buttons
    const themeRadios = document.querySelectorAll('input[name="theme"]');
    themeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const selectedTheme = e.target.value;
            localStorage.setItem('theme', selectedTheme);
            applyTheme(selectedTheme);
            showToast(`Tema diubah ke: ${getThemeName(selectedTheme)}`, 'success');
        });
    });

    // Font size selection via buttons
    const fontBtns = document.querySelectorAll('.font-size-btn');
    fontBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedSize = btn.dataset.size;
            localStorage.setItem('fontSize', selectedSize);
            applyFontSize(selectedSize);
            showToast(`Ukuran font diubah ke: ${getFontSizeName(selectedSize)}`, 'success');
        });
    });
}

// ==================== NOTIFICATION SETTINGS ====================
async function initNotificationSettings() {
    const globalToggles = ['toggle-email', 'toggle-announcement'];
    
    globalToggles.forEach(id => {
        const toggle = document.getElementById(id);
        if (toggle) {
            const saved = localStorage.getItem(id);
            if (saved !== null) {
                toggle.checked = saved === 'true';
            }

            toggle.addEventListener('change', (e) => {
                localStorage.setItem(id, e.target.checked);
                const label = e.target.parentElement.previousElementSibling.querySelector('strong').textContent;
                showToast(`${label}: ${e.target.checked ? 'Aktif' : 'Nonaktif'}`, 'success');
            });
        }
    });

    await renderDynamicNotifications();
}

async function renderDynamicNotifications() {
    const listContainer = document.getElementById('notification-items-list');
    if (!listContainer) return;

    try {
        const materials = await getAllMaterialsFromDB();
        
        if (!materials || materials.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-notification">
                    <i class="fas fa-inbox"></i>
                    <p>Belum ada materi atau tugas yang diupload</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = '';

        materials.forEach(item => {
            const toggleId = `notif_material_${item.id}`;
            const isChecked = localStorage.getItem(toggleId) === 'true';
            const iconClass = item.materialType === 'pdf' ? 'fa-file-pdf' : 
                             item.materialType === 'ppt' ? 'fa-file-powerpoint' : 'fa-file-word';
            const iconTypeClass = item.materialType === 'pdf' ? 'pdf' : 
                                 item.materialType === 'ppt' ? 'ppt' : 'doc';
            const fileSizeMB = item.fileSize ? (item.fileSize / 1024 / 1024).toFixed(2) : '';

            const itemHTML = `
                <div class="notification-item">
                    <div class="notification-item-info">
                        <div class="file-icon ${iconTypeClass}">
                            <i class="fas ${iconClass}"></i>
                        </div>
                        <div class="file-details">
                            <span class="file-name" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</span>
                            <span class="file-date">
                                <i class="far fa-calendar-alt"></i> 
                                Ditambahkan: ${formatDate(item.uploadedAt)}
                                ${fileSizeMB ? ` • ${fileSizeMB} MB` : ''}
                            </span>
                        </div>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="${toggleId}" ${isChecked ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
            `;
            listContainer.insertAdjacentHTML('beforeend', itemHTML);

            const toggleEl = document.getElementById(toggleId);
            toggleEl.addEventListener('change', (e) => {
                localStorage.setItem(toggleId, e.target.checked);
                showToast(`Notifikasi untuk "${item.title}" ${e.target.checked ? 'diaktifkan' : 'dinonaktifkan'}`, 'success');
            });
        });

    } catch (error) {
        console.error('Error loading notifications:', error);
        listContainer.innerHTML = `
            <div class="error-notification">
                <i class="fas fa-exclamation-circle"></i>
                <p>Gagal memuat notifikasi</p>
            </div>
        `;
    }
}

function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
    });
}

// ==================== PRIVACY SETTINGS ====================
function initPrivacySettings() {
    const toggles = ['toggle-public-profile', 'toggle-show-nim'];
    
    toggles.forEach(id => {
        const toggle = document.getElementById(id);
        if (toggle) {
            const saved = localStorage.getItem(id);
            if (saved !== null) {
                toggle.checked = saved === 'true';
            }

            toggle.addEventListener('change', (e) => {
                localStorage.setItem(id, e.target.checked);
                showToast('Pengaturan privasi diperbarui', 'success');
            });
        }
    });
}

// ==================== ACCOUNT ACTIONS ====================
function initAccountActions(user) {
    document.getElementById('btn-clear-data').addEventListener('click', () => {
        if (confirm('Hapus semua data lokal (tema, notifikasi, dll)? Data akun tetap aman.')) {
            const keysToKeep = ['currentUser', 'user_' + user.nim];
            const allKeys = Object.keys(localStorage);
            
            allKeys.forEach(key => {
                if (!keysToKeep.includes(key)) {
                    localStorage.removeItem(key);
                }
            });

            showToast('Data lokal berhasil dihapus', 'success');
            setTimeout(() => location.reload(), 1500);
        }
    });

    document.getElementById('btn-delete-account').addEventListener('click', () => {
        const confirmText = prompt(`Ketik "HAPUS" untuk menghapus akun Anda secara permanen:`);
        
        if (confirmText === 'HAPUS') {
            localStorage.removeItem('user_' + user.nim);
            sessionStorage.removeItem('currentUser');
            localStorage.removeItem('currentUser');
            
            showToast('Akun berhasil dihapus', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } else if (confirmText !== null) {
            showToast('Penghapusan dibatalkan', 'warning');
        }
    });
}

// ==================== ABOUT SECTION ====================
function initAboutSection() {
    document.getElementById('app-version').textContent = `v${APP_CONFIG.version} (Build ${APP_CONFIG.build})`;
    document.getElementById('app-year').textContent = APP_CONFIG.year;
    document.getElementById('app-developer').textContent = APP_CONFIG.developer;
    document.getElementById('app-institution').textContent = APP_CONFIG.institution;

    document.getElementById('btn-check-update').addEventListener('click', () => {
        showToast(`Anda menggunakan versi terbaru: ${APP_CONFIG.version}`, 'success');
    });

    document.getElementById('btn-view-changelog').addEventListener('click', () => {
        alert(`Changelog v${APP_CONFIG.version}:\n\n• First Release\n• Fitur Upload Materi & Tugas\n• Integrasi IndexedDB\n• Notifikasi Real-time`);
    });
}

// ==================== LOGOUT ====================
function initLogoutButton() {
    document.getElementById('btn-logout-settings').addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin keluar?')) {
            sessionStorage.removeItem('currentUser');
            localStorage.removeItem('currentUser');
            showToast('Berhasil keluar', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        }
    });
}

// ==================== UTILITY FUNCTIONS ====================
function cleanString(str) {
    if (!str) return '';
    return String(str)
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        .replace(/[^\w\s\u00C0-\u00FF.,'-]/g, '')
        .trim();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle'
    };

    toast.innerHTML = `
        <i class="fas ${icons[type] || 'fa-info-circle'}"></i>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}