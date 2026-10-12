document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Toggle Logic
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileMenu && navMenu) {
        mobileMenu.addEventListener('click', () => {
            mobileMenu.classList.toggle('is-active');
            navMenu.classList.toggle('active');
        });

        // Tutup menu saat link diklik
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('is-active');
                navMenu.classList.remove('active');
            });
        });
    }

    // 2. Auth State Check (Login Status)
    const authSection = document.getElementById('auth-section');
    
    if (authSection) {
        renderAuthSection(authSection);
    }
});

// Fungsi untuk membersihkan string dari karakter aneh
function cleanString(str) {
    if (!str) return '';
    // Hapus karakter kontrol dan karakter non-printable
    return String(str)
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        .replace(/[^\w\s\u00C0-\u00FF.,'-]/g, '')
        .trim();
}

// Fungsi untuk escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

// Fungsi untuk render auth section
function renderAuthSection(authSection) {
    // Ambil data user dari sessionStorage atau localStorage
    let currentUser = sessionStorage.getItem('currentUser');
    
    if (!currentUser) {
        currentUser = localStorage.getItem('currentUser');
    }

    if (currentUser) {
        try {
            const user = JSON.parse(currentUser);
            
            // Validasi data user
            if (!user.name || !user.nim) {
                throw new Error('Invalid user data');
            }

            // Bersihkan nama
            const cleanName = cleanString(user.name);
            
            // Jika nama kosong setelah dibersihkan, gunakan default
            const displayName = cleanName || 'User';

            // Batasi panjang nama untuk tampilan
            const displayText = displayName.length > 20 
                ? displayName.substring(0, 20).trim() + '...' 
                : displayName;

            // Format NIM dengan spasi setiap 4 digit
            const nimStr = String(user.nim).trim();
            const formattedNIM = nimStr.match(/.{1,4}/g)?.join(' ') || nimStr;
            
            // Ambil inisial untuk avatar
            const nameParts = displayName.split(' ').filter(n => n.length > 0);
            const initials = nameParts.length >= 2 
                ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
                : displayName.substring(0, 2).toUpperCase();

            authSection.innerHTML = `
                <div class="user-info-card">
                    <div class="user-avatar-circle">
                        <span class="avatar-initials">${escapeHtml(initials)}</span>
                    </div>
                    <div class="user-details-container">
                        <span class="user-display-name" title="${escapeHtml(displayName)}">${escapeHtml(displayText)}</span>
                        <span class="user-display-nim">${escapeHtml(formattedNIM)}</span>
                    </div>
                    <button class="btn-logout-circle" id="logout-btn" title="Logout">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            `;

            // Event listener logout
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', handleLogout);
            }

        } catch (error) {
            console.error('Error parsing user data:', error);
            // Jika error, bersihkan data dan tampilkan login
            sessionStorage.removeItem('currentUser');
            localStorage.removeItem('currentUser');
            showLoginButtons(authSection);
        }
    } else {
        showLoginButtons(authSection);
    }
}

// Fungsi untuk menampilkan tombol login
function showLoginButtons(authSection) {
    authSection.innerHTML = `
        <div class="auth-buttons-container">
            <a href="login.html" class="btn-auth-nav btn-login-nav">
                <i class="fas fa-sign-in-alt"></i> Sign In
            </a>
            <a href="login.html" class="btn-auth-nav btn-signup-nav">
                <i class="fas fa-user-plus"></i> Sign Up
            </a>
            <a href="adminlogin.html" class="btn-auth-nav btn-login-nav">
                <i class="fas fa-sign-in-alt"></i> Admin Sign In
                </a>
        </div>
    `;
}

// Fungsi handle logout
function handleLogout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        sessionStorage.removeItem('currentUser');
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
}