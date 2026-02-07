// Mobile menu toggle
document.getElementById('mobile-menu-button').addEventListener('click', function() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('hidden');
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });

            // Close mobile menu if open
            const mobileMenu = document.getElementById('mobile-menu');
            if (!mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
            }
        }
    });
});

// Add shadow to navbar on scroll
window.addEventListener('scroll', function() {
    const nav = document.querySelector('nav');
    if (window.scrollY > 10) {
        nav.classList.add('shadow-xl');
    } else {
        nav.classList.remove('shadow-xl');
    }
});

// Automatically setting the fill of the progressbar on top
document.addEventListener('DOMContentLoaded', function() {
    const comicCount = document.getElementById('comic-count').textContent;
    const [current, total] = comicCount.split('/').map(Number);
    const percentage = ((current / total) * 100).toFixed(1);

    document.getElementById('progress-fill').style.width = `${percentage}%`;
    document.getElementById('progress-fill-text').textContent = `${percentage}%`;
});
