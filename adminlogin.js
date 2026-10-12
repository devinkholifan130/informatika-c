// ==================== ADMIN CREDENTIALS ====================
// Default admin credentials (dalam produksi nyata, ini harus di server)
const DEFAULT_ADMIN = {
    username: 'admin',
    password: 'admin123',
    name: 'Administrator',
    role: 'superadmin'
};

// ==================== TOGGLE PANEL ====================
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

if (signUpButton) {
    signUpButton.addEventListener('click', () => {
        container.classList.add('right-panel-active');
    });
}

if (signInButton) {
    signInButton.addEventListener('click', () => {
        container.classList.remove('right-panel-active');
    });
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    // Tampilkan SweetAlert peringatan saat halaman dimuat
    showAdminWarning();
    
    // Inisialisasi admin default jika belum ada
    initDefaultAdmin();
    
    // Setup form handlers
    setupAdminLoginForm();
    setupAdminRegisterForm();
});

// ==================== SWEETALERT WARNING ====================
function showAdminWarning() {
    Swal.fire({
        icon: 'warning',
        title: '️ Halaman Khusus Admin',
        html: `
            <div style="text-align: left; font-size: 14px;">
                <p>Halaman ini <strong>hanya untuk administrator</strong> yang berwenang.</p>
                <p>Jika Anda bukan admin, silakan kembali ke halaman login user.</p>
                <div style="background: #fff3cd; padding: 10px; border-radius: 8px; margin-top: 10px; border-left: 4px solid #ffc107;">
                    <strong>Credentials Default:</strong><br>
                    Username: <code>admin</code><br>
                    Password: <code>admin123</code>
                </div>
            </div>
        `,
        confirmButtonText: 'Saya Mengerti',
        confirmButtonColor: '#ee5a6f',
        showCancelButton: true,
        cancelButtonText: 'Kembali ke Login User',
        cancelButtonColor: '#0047AB',
        allowOutsideClick: false,
        allowEscapeKey: false
    }).then((result) => {
        if (result.dismiss === Swal.DismissReason.cancel) {
            window.location.href = 'login.html';
        }
    });
}

// ==================== INIT DEFAULT ADMIN ====================
function initDefaultAdmin() {
    if (!localStorage.getItem('admin_default')) {
        localStorage.setItem('admin_default', JSON.stringify(DEFAULT_ADMIN));
        console.log('Default admin credentials initialized');
    }
}

// ==================== ADMIN LOGIN FORM ====================
function setupAdminLoginForm() {
    const signInForm = document.querySelector('.sign-in-container form');
    
    if (signInForm) {
        signInForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const username = document.getElementById('admin-username')?.value.trim() || '';
            const password = document.getElementById('admin-password')?.value.trim() || '';
            
            // Validasi input
            if (!username || !password) {
                Swal.fire({
                    icon: 'error',
                    title: 'Input Tidak Lengkap',
                    text: 'Username dan password harus diisi!',
                    confirmButtonColor: '#ee5a6f'
                });
                return;
            }
            
            // Cek credentials
            const defaultAdmin = JSON.parse(localStorage.getItem('admin_default'));
            const registeredAdmins = JSON.parse(localStorage.getItem('registered_admins') || '[]');
            
            // Cek apakah credentials cocok dengan default admin atau admin terdaftar
            const isValidDefault = username === defaultAdmin.username && password === defaultAdmin.password;
            const isValidRegistered = registeredAdmins.some(admin => 
                admin.username === username && admin.password === password
            );
            
            if (isValidDefault || isValidRegistered) {
                const adminData = isValidDefault ? defaultAdmin : registeredAdmins.find(a => a.username === username);
                
                // Simpan session admin
                const adminSession = {
                    username: adminData.username,
                    name: adminData.name,
                    role: adminData.role || 'admin',
                    loginAt: new Date().toISOString()
                };
                
                sessionStorage.setItem('adminSession', JSON.stringify(adminSession));
                
                // SweetAlert sukses
                Swal.fire({
                    icon: 'success',
                    title: 'Login Berhasil!',
                    html: `
                        <div>
                            <p>Selamat datang, <strong>${adminData.name}</strong>!</p>
                            <p style="color: #666; font-size: 13px;">Anda akan diarahkan ke panel admin...</p>
                        </div>
                    `,
                    timer: 2000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    willClose: () => {
                        window.location.href = 'admindashboard.html';
                    }
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Login Gagal!',
                    html: `
                        <div>
                            <p>Username atau password salah!</p>
                            <p style="color: #666; font-size: 13px;">Pastikan Anda menggunakan credentials admin yang valid.</p>
                        </div>
                    `,
                    confirmButtonColor: '#ee5a6f'
                });
            }
        });
    }
}

// ==================== ADMIN REGISTER FORM ====================
function setupAdminRegisterForm() {
    const signUpForm = document.querySelector('.sign-up-container form');
    
    if (signUpForm) {
        signUpForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('admin-signup-name')?.value.trim() || '';
            const username = document.getElementById('admin-signup-username')?.value.trim() || '';
            const password = document.getElementById('admin-signup-password')?.value.trim() || '';
            
            // Validasi
            if (!name || name.length < 3) {
                Swal.fire({
                    icon: 'error',
                    title: 'Nama Tidak Valid',
                    text: 'Nama admin minimal 3 karakter!',
                    confirmButtonColor: '#ee5a6f'
                });
                return;
            }
            
            if (!username || username.length < 4) {
                Swal.fire({
                    icon: 'error',
                    title: 'Username Tidak Valid',
                    text: 'Username minimal 4 karakter!',
                    confirmButtonColor: '#ee5a6f'
                });
                return;
            }
            
            if (!password || password.length < 6) {
                Swal.fire({
                    icon: 'error',
                    title: 'Password Tidak Valid',
                    text: 'Password minimal 6 karakter!',
                    confirmButtonColor: '#ee5a6f'
                });
                return;
            }
            
            // Cek apakah username sudah terdaftar
            const defaultAdmin = JSON.parse(localStorage.getItem('admin_default'));
            const registeredAdmins = JSON.parse(localStorage.getItem('registered_admins') || '[]');
            
            if (username === defaultAdmin.username) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Username Sudah Digunakan',
                    text: 'Username ini sudah digunakan oleh default admin!',
                    confirmButtonColor: '#ee5a6f'
                });
                return;
            }
            
            if (registeredAdmins.some(admin => admin.username === username)) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Username Sudah Terdaftar',
                    text: 'Username ini sudah digunakan oleh admin lain!',
                    confirmButtonColor: '#ee5a6f'
                });
                return;
            }
            
            // Tambah admin baru
            const newAdmin = {
                name: name,
                username: username,
                password: password,
                role: 'admin',
                registeredAt: new Date().toISOString()
            };
            
            registeredAdmins.push(newAdmin);
            localStorage.setItem('registered_admins', JSON.stringify(registeredAdmins));
            
            // SweetAlert sukses
            Swal.fire({
                icon: 'success',
                title: 'Admin Berhasil Didaftarkan!',
                html: `
                    <div>
                        <p>Admin baru <strong>${name}</strong> berhasil ditambahkan.</p>
                        <p style="color: #666; font-size: 13px;">Silakan login dengan credentials yang telah dibuat.</p>
                    </div>
                `,
                confirmButtonColor: '#ee5a6f',
                confirmButtonText: 'Lanjut ke Login'
            }).then(() => {
                signUpForm.reset();
                container.classList.remove('right-panel-active');
            });
        });
    }
}

// ==================== ANIMASI LOAD ====================
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s';
        document.body.style.opacity = '1';
    }, 100);
});