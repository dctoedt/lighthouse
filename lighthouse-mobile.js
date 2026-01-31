/**
 * Mobile Navigation Toggle for Lighthouse Protocols
 * Handles hamburger menu for sidebar on mobile devices
 */

(function() {
    'use strict';
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        // Create mobile menu elements
        createMobileMenu();
        
        // Set up event listeners
        setupEventListeners();
    }
    
    function createMobileMenu() {
        // Create hamburger button
        const menuButton = document.createElement('button');
        menuButton.id = 'menu-toggle';
        menuButton.innerHTML = '☰'; // Hamburger icon
        menuButton.setAttribute('aria-label', 'Toggle navigation menu');
        menuButton.setAttribute('aria-expanded', 'false');
        
        // Create overlay (for clicking outside to close)
        const overlay = document.createElement('div');
        overlay.id = 'sidebar-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        
        // Add to page
        document.body.insertBefore(menuButton, document.body.firstChild);
        document.body.insertBefore(overlay, document.body.firstChild);
    }
    
    function setupEventListeners() {
        const menuButton = document.getElementById('menu-toggle');
        const sidebar = document.getElementById('table-of-contents');
        const overlay = document.getElementById('sidebar-overlay');
        
        if (!menuButton || !sidebar || !overlay) {
            console.warn('Mobile menu elements not found');
            return;
        }
        
        // Toggle sidebar when button clicked
        menuButton.addEventListener('click', function() {
            toggleSidebar();
        });
        
        // Close sidebar when overlay clicked
        overlay.addEventListener('click', function() {
            closeSidebar();
        });
        
        // Close sidebar when a link is clicked (on mobile)
        const sidebarLinks = sidebar.querySelectorAll('a');
        sidebarLinks.forEach(function(link) {
            link.addEventListener('click', function() {
                // Only close on mobile screens
                if (window.innerWidth <= 900) {
                    closeSidebar();
                }
            });
        });
        
        // Close sidebar when ESC key pressed
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && sidebar.classList.contains('show')) {
                closeSidebar();
            }
        });
        
        // Handle window resize - close sidebar if resizing to desktop
        let resizeTimeout;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function() {
                if (window.innerWidth > 900) {
                    closeSidebar();
                }
            }, 250);
        });
    }
    
    function toggleSidebar() {
        const sidebar = document.getElementById('table-of-contents');
        const overlay = document.getElementById('sidebar-overlay');
        const menuButton = document.getElementById('menu-toggle');
        
        const isOpen = sidebar.classList.contains('show');
        
        if (isOpen) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }
    
    function openSidebar() {
        const sidebar = document.getElementById('table-of-contents');
        const overlay = document.getElementById('sidebar-overlay');
        const menuButton = document.getElementById('menu-toggle');
        
        sidebar.classList.add('show');
        overlay.classList.add('show');
        menuButton.setAttribute('aria-expanded', 'true');
        menuButton.innerHTML = '✕'; // Change to X icon when open
        
        // Prevent body scroll when menu is open
        document.body.style.overflow = 'hidden';
    }
    
    function closeSidebar() {
        const sidebar = document.getElementById('table-of-contents');
        const overlay = document.getElementById('sidebar-overlay');
        const menuButton = document.getElementById('menu-toggle');
        
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.innerHTML = '☰'; // Change back to hamburger
        
        // Restore body scroll
        document.body.style.overflow = '';
    }
})();
