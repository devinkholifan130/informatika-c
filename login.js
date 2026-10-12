// Toggle antara Sign In dan Sign Up
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

// Event listener untuk tombol Sign Up
if (signUpButton) {
    signUpButton.addEventListener('click', () => {
        container.classList.add('right-panel-active');
    });
}

// Event listener untuk tombol Sign In
if (signInButton) {
    signInButton.addEventListener('click', () => {
        container.classList.remove('right-panel-active');
    });
}

// Form validation dan handling
document.addEventListener('DOMContentLoaded', () => {
    // Sign Up Form
    const signUpForm = document.querySelector('.sign-up-container form');
    const signInForm = document.querySelector('.sign-in-container form');
    
    // ================= SIGN UP FORM SUBMISSION =================
    if (signUpForm) {
        signUpForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('signup-name')?.value.trim() || '';
            const nim = document.getElementById('signup-nim')?.value.trim() || '';
            
            // Validasi Nama (minimal 3 karakter)
            if (!name || name.length < 3) {
                alert('Nama minimal 3 karakter!');
                return;
            }

            // Validasi NIM (harus angka dan panjang tertentu)
            if (!nim || !/^\d+$/.test(nim)) {
                alert('NIM harus berisi angka!');
                return;
            }
            
            if (nim.length < 8 || nim.length > 12) {
                alert('NIM harus antara 8-12 digit!');
                return;
            }
            
            // Cek apakah NIM sudah terdaftar
            if (localStorage.getItem('user_' + nim)) {
                alert('NIM ini sudah terdaftar! Silakan langsung Sign In.');
                container.classList.remove('right-panel-active'); // Pindah ke Sign In
                return;
            }

            // Siapkan data user
            const userData = {
                name: name,
                nim: nim,
                registeredAt: new Date().toISOString()
            };
            
            // Simpan ke localStorage dengan penanganan error
            try {
                localStorage.setItem('user_' + nim, JSON.stringify(userData));
                
                alert('Registrasi berhasil! Silakan masuk dengan NIM Anda.');
                
                // Clear form
                signUpForm.reset();
                
                // OTOMATIS PINDAH KE PANEL SIGN IN
                container.classList.remove('right-panel-active');
            } catch (error) {
                console.error('Error saving user data:', error);
                alert('Terjadi kesalahan saat registrasi. Silakan coba lagi.');
            }
        });
    }
    
    // ================= SIGN IN FORM SUBMISSION =================
    if (signInForm) {
        signInForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const nim = document.getElementById('signin-nim')?.value.trim() || '';
            
            // Validasi NIM
            if (!nim || !/^\d+$/.test(nim)) {
                alert('NIM harus berisi angka!');
                return;
            }
            
            // Cari user berdasarkan NIM di localStorage
            const storedUser = localStorage.getItem('user_' + nim);
            
            if (storedUser) {
                try {
                    const userData = JSON.parse(storedUser);
                    
                    // Validasi data agar tidak korup
                    if (!userData.name || !userData.nim) {
                        throw new Error('Invalid user data');
                    }
                    
                    // Simpan session agar terbaca di Navbar index.html
                    sessionStorage.setItem('currentUser', JSON.stringify(userData));
                    
                    alert(`Selamat datang, ${userData.name}!`);
                    
                    // OTOMATIS REDIRECT KE INDEX.HTML
                    window.location.href = 'index.html'; 
                } catch (error) {
                    console.error('Error parsing stored user:', error);
                    alert('Data user korup. Silakan registrasi ulang.');
                    // Hapus data yang korup
                    localStorage.removeItem('user_' + nim);
                }
            } else {
                alert('NIM tidak terdaftar! Silakan registrasi terlebih dahulu.');
            }
        });
    }
});

// Animasi tambahan saat halaman dimuat
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s';
        document.body.style.opacity = '1';
    }, 100);
});

// Real-time validation untuk NIM (Hanya mengizinkan angka)
document.addEventListener('input', (e) => {
    if (e.target.tagName === 'INPUT') {
        const value = e.target.value;
        
        // Validasi NIM - hapus karakter non-angka secara real-time
        if (e.target.id === 'signup-nim' || e.target.id === 'signin-nim') {
            if (value && !/^\d*$/.test(value)) {
                e.target.value = value.replace(/\D/g, ''); 
            }
        }
    }
});