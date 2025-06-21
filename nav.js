document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const accLinks = document.querySelector('.acc-links');
    const body = document.body;
    const mainHeaderNav = document.querySelector('header nav');
    const navOverlay = document.querySelector('.nav-overlay');
    const originalAccLinksParent = accLinks.parentElement;
    const originalAccLinksNextSibling = accLinks.nextElementSibling;

    // mobileMenuCloseButton related declarations and logic are removed

    function isMobileScreen() {
        return window.innerWidth <= 1023;
    }

    function toggleMobileMenuState() {
        const isMenuOpen = navLinks.classList.contains('active');
        const currentIsMobile = isMobileScreen();

        // If not mobile and menu is not open, do nothing
        if (!currentIsMobile && !isMenuOpen) {
            return;
        }

        // Toggle 'active' class for both menu and button
        navLinks.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');

        if (navLinks.classList.contains('active')) {
            // Menu is opening
            body.classList.add('menu-open-body');

            if (currentIsMobile) {
                navLinks.appendChild(accLinks); // Move accLinks into the mobile menu
                if (navOverlay) {
                    navOverlay.classList.add('active'); // Show the overlay
                }
            }
        } else {
            // Menu is closing
            body.classList.remove('menu-open-body');

            if (currentIsMobile) {
                if (navOverlay) {
                    navOverlay.classList.remove('active'); // Hide the overlay
                }

                // Move accLinks back to its original position
                if (originalAccLinksNextSibling) {
                    originalAccLinksParent.insertBefore(accLinks, originalAccLinksNextSibling);
                } else {
                    originalAccLinksParent.appendChild(accLinks);
                }
            }
        }
    }

    function closeMobileMenu() {
        if (navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
            body.classList.remove('menu-open-body');

            if (isMobileScreen() && navOverlay) {
                navOverlay.classList.remove('active');
            }

            // Move accLinks back to its original position
            if (originalAccLinksNextSibling) {
                originalAccLinksParent.insertBefore(accLinks, originalAccLinksNextSibling);
            } else {
                originalAccLinksParent.appendChild(accLinks);
            }
        }
    }

    // Event listener for the mobile menu button (toggles open/close)
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent clicks from bubbling up to document/window
            toggleMobileMenuState();
        });
    }

    // Event listener for the navOverlay to close the menu when clicked
    if (navOverlay) {
        navOverlay.addEventListener('click', function() {
            closeMobileMenu();
        });
    }

    // Close menu when a clickable item inside the menu is clicked
    const allClickableMobileMenuItems = document.querySelectorAll('.nav-links a, .acc-links button, .acc-links a');
    allClickableMobileMenuItems.forEach(item => {
        item.addEventListener('click', function() {
            if (isMobileScreen() && navLinks.classList.contains('active')) {
                closeMobileMenu();
            }
        });
    });

    // Handle window resize events
    let resizeTimeoutId;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeoutId);
        resizeTimeoutId = setTimeout(function() {
            // If resized to desktop, ensure menu is closed and accLinks are in place
            if (!isMobileScreen() && navLinks.classList.contains('active')) {
                closeMobileMenu();
            }
            if (!isMobileScreen() && accLinks.parentElement !== originalAccLinksParent) {
                if (originalAccLinksNextSibling) {
                    originalAccLinksParent.insertBefore(accLinks, originalAccLinksNextSibling);
                } else {
                    originalAccLinksParent.appendChild(accLinks);
                }
            }
        }, 250); // Debounce to prevent excessive calls during resize
    });

    // Initialize: Close menu if screen is desktop on load
    if (!isMobileScreen() && navLinks.classList.contains('active')) {
        closeMobileMenu();
    }

    // Add scroll effect to header
    if (mainHeaderNav) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                mainHeaderNav.classList.add('nav-scrolled');
            } else {
                mainHeaderNav.classList.remove('nav-scrolled');
            }
        });
    }
});