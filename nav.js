document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const accLinks = document.querySelector('.acc-links');
    const body = document.body;

    // Fungsi untuk memeriksa apakah kita berada di perangkat mobile
    function isMobile() {
        return window.innerWidth <= 768;
    }

    // Fungsi untuk membuka/menutup menu
    function toggleMenu() {
        if (!isMobile()) return;
        
        navLinks.classList.toggle('active');
        accLinks.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
        
        // Mencegah scroll body ketika menu terbuka
        if (navLinks.classList.contains('active')) {
            body.style.overflow = 'hidden';
        } else {
            body.style.overflow = '';
        }
    }

    // Fungsi untuk menutup menu
    function closeMenu() {
        if (!isMobile()) return;
        
        navLinks.classList.remove('active');
        accLinks.classList.remove('active');
        mobileMenuBtn.classList.remove('active');
        body.style.overflow = '';
    }

    // Inisialisasi tombol menu mobile
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleMenu();
        });
    }

    // Tutup menu mobile ketika mengklik di luar menu
    document.addEventListener('click', function(event) {
        const isClickInsideNav = event.target.closest('nav');
        const isClickOnMenuBtn = event.target.closest('.mobile-menu-btn');

        if (!isClickInsideNav && !isClickOnMenuBtn && navLinks.classList.contains('active')) {
            closeMenu();
        }
    });

    // Tutup menu mobile ketika mengklik link
    const navItems = document.querySelectorAll('.nav-links a, .acc-links a');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            if (isMobile()) {
                closeMenu();
            }
        });
    });

    // Menangani perubahan ukuran jendela dengan debounce
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            if (!isMobile()) {
                closeMenu();
            }
        }, 250);
    });

    // Pemeriksaan awal untuk perangkat mobile
    if (!isMobile()) {
        closeMenu();
    }
}); 