// Utility: Safe event binding
function addEvent(el, event, handler) {
  el?.addEventListener(event, handler);
}

// ========== HAMBURGER MENU ==========
function initHamburgerMenu(hamburgerId = 'hamburger', navbarId = 'navbar') {
  const hamburger = document.getElementById(hamburgerId);
  const navbar = document.getElementById(navbarId);

  addEvent(hamburger, 'click', () => {
    navbar?.classList.toggle('show');
  });
}

// ========== BACK TO TOP ==========
function initBackToTop(btnId = 'backToTop', threshold = 300) {
  const backToTopButton = document.getElementById(btnId);

  addEvent(window, 'scroll', () => {
    if (!backToTopButton) return;
    backToTopButton.classList.toggle('visible', window.scrollY > threshold);
  });

  addEvent(backToTopButton, 'click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ========== CARD SLIDER ==========
function initCardSlider({
  sliderId = 'cardSlider',
  cardSelector = '.card',
  visibleCount = 3,
  autoScroll = true,
  interval = 4000
} = {}) {
  const slider = document.getElementById(sliderId);
  const cards = document.querySelectorAll(cardSelector);
  if (!slider || cards.length === 0) return;

  let currentSlide = 0;
  const totalCards = cards.length;

  function updateSlider() {
    const cardWidth = cards[0].offsetWidth + 20; // adjust gap if needed
    slider.style.transform = `translateX(${-currentSlide * cardWidth}px)`;
  }

  function slideLeft() {
    if (currentSlide > 0) {
      currentSlide--;
      updateSlider();
    }
  }

  function slideRight() {
    if (currentSlide < totalCards - visibleCount) {
      currentSlide++;
      updateSlider();
    } else {
      currentSlide = 0; // loop back to start
      updateSlider();
    }
  }

  // Auto-scroll
  if (autoScroll) {
    setInterval(slideRight, interval);
  }

  addEvent(window, 'resize', updateSlider);
}

// ========== LOAD HEADER ==========
function loadHeader(placeholderId = 'header-placeholder', url = 'partials/header.html') {
  fetch(url)
    .then(r => r.text())
    .then(html => {
      document.getElementById(placeholderId).innerHTML = html;
      initHamburgerMenu(); // re-init after header loads
    })
    .catch(err => console.error('Header load failed:', err));
}

// ========== FORM HANDLER ==========
function initContactForm(formId = 'contactForm') {
  const form = document.getElementById(formId);
  addEvent(form, 'submit', (e) => {
    e.preventDefault();
    alert('Thank you for your message. It has been sent.');
    e.target.reset();
  });
}



// ========== INIT APP ==========
document.addEventListener('DOMContentLoaded', () => {
  // Redirect to home.html if on index.html or site root
  if (window.location.pathname.endsWith("index.html") || window.location.pathname === "/") {
    window.location.href = "home.html";
    return; // stop running inits before redirect
  }

  // ========== PREVENT RELOAD ON CURRENT PAGE LINKS ==========
function preventReloadOnCurrentPage() {
  const links = document.querySelectorAll("a[href]");

  links.forEach(link => {
    addEvent(link, "click", (e) => {
      const currentUrl = window.location.pathname + window.location.search + window.location.hash;
      const linkUrl = new URL(link.href, window.location.origin);
      const targetPath = linkUrl.pathname + linkUrl.search + linkUrl.hash;

      // Compare normalized paths
      if (currentUrl === targetPath) {
        e.preventDefault(); // stop reload
        console.log("Already on this page/section:", targetPath);
      }
    });
  });
}


  initHamburgerMenu();
  initBackToTop();
  initCardSlider();
  loadHeader();
  initContactForm();
  preventReloadOnCurrentPage(); 
});
