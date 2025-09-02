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

// ========== BOOKS API ==========
async function initBooksPage() {
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error');
  const booksContainer = document.getElementById('books-container');
  const retryBtn = document.getElementById('retry-btn');
  const searchInput = document.getElementById('bookSearch');
  const clearBtn = document.getElementById('clearSearch');
  const searchResults = document.getElementById('searchResults');

  if (!booksContainer) return; // Not on books page

  let allBooks = []; // Store all books for searching

  // Simple fuzzy search function
  function fuzzySearch(query, text) {
    if (!query || !text) return false;
    
    query = query.toLowerCase();
    text = text.toLowerCase();
    
    // Exact match gets highest priority
    if (text.includes(query)) return true;
    
    // Fuzzy matching - allow for typos and partial matches
    let queryIndex = 0;
    let textIndex = 0;
    let matches = 0;
    
    while (queryIndex < query.length && textIndex < text.length) {
      if (query[queryIndex] === text[textIndex]) {
        matches++;
        queryIndex++;
      }
      textIndex++;
    }
    
    // Return true if most characters match (70% threshold)
    return (matches / query.length) >= 0.7;
  }

  function searchBooks(query) {
    if (!query.trim()) {
      displayFilteredBooks(allBooks);
      updateSearchResults('');
      return;
    }

    const filteredBooks = allBooks.filter(book => {
      // Search in title
      if (fuzzySearch(query, book.title)) return true;
      
      // Search in year
      if (book.first_publish_year && query.includes(book.first_publish_year.toString())) return true;
      
      // Search in subjects
      if (book.subject && book.subject.some(subject => fuzzySearch(query, subject))) return true;
      
      // Search in subtitle
      if (book.subtitle && fuzzySearch(query, book.subtitle)) return true;
      
      return false;
    });

    displayFilteredBooks(filteredBooks);
    updateSearchResults(query, filteredBooks.length, allBooks.length);
  }

  function updateSearchResults(query, filteredCount, totalCount) {
    if (!query) {
      searchResults.textContent = '';
      clearBtn.style.display = 'none';
      return;
    }

    clearBtn.style.display = 'block';
    
    if (filteredCount === 0) {
      searchResults.innerHTML = `<span style="color: #e74c3c;">No books found for "${query}"</span>`;
    } else if (filteredCount === totalCount) {
      searchResults.textContent = `Showing all ${totalCount} books`;
    } else {
      searchResults.textContent = `Found ${filteredCount} of ${totalCount} books for "${query}"`;
    }
  }

  function displayFilteredBooks(books) {
    booksContainer.innerHTML = '';

    if (books.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'no-results';
      noResults.innerHTML = `
        <h3>No books found</h3>
        <p>Try adjusting your search terms or clear the search to see all books.</p>
      `;
      booksContainer.appendChild(noResults);
      return;
    }

    books.forEach(book => {
      const bookElement = createBookElement(book);
      booksContainer.appendChild(bookElement);
    });
  }

  function highlightSearchTerm(text, query) {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
  }

  async function fetchBooks() {
    try {
      // Show loading state
      loadingEl.style.display = 'block';
      errorEl.style.display = 'none';
      booksContainer.style.display = 'none';

      // Fetch all books by increasing the limit significantly
      const response = await fetch('https://openlibrary.org/search.json?author=J.K.+Rowling&limit=100');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      displayBooks(data.docs);
      
      // Show books container
      loadingEl.style.display = 'none';
      booksContainer.style.display = 'grid';
      
    } catch (error) {
      console.error('Error fetching books:', error);
      // Show error state
      loadingEl.style.display = 'none';
      errorEl.style.display = 'block';
      booksContainer.style.display = 'none';
    }
  }

  function displayBooks(books) {
    // Filter books to remove duplicates and less relevant entries, but keep more books
    const seenTitles = new Set();
    const filteredBooks = books
      .filter(book => book.title && book.first_publish_year)
      .filter(book => {
        // Filter out duplicates and less relevant books
        const title = book.title.toLowerCase().trim();
        
        // Skip if we've already seen this title
        if (seenTitles.has(title)) {
          return false;
        }
        seenTitles.add(title);
        
        // Filter out box sets, collections, and other non-individual books
        return !title.includes('large print') && 
               !title.includes('audio book') && 
               !title.includes('audiobook') &&
               !title.includes('[microform]') &&
               !title.includes('braille') &&
               !title.includes('box set') &&
               !title.includes('boxset') &&
               !title.includes('collection') &&
               !title.includes('complete series') &&
               !title.includes('complete set') &&
               !title.includes('books 1-') &&
               !title.includes('books 1 ') &&
               !title.includes('volumes 1-') &&
               !title.includes('hardcover box set') &&
               !title.includes('paperback box set') &&
               !title.includes('gift set') &&
               !title.includes('omnibus') &&
               !title.includes('anthology') &&
               !title.includes('collector') &&
               !title.includes('special edition set') &&
               !title.includes('deluxe edition set') &&
               !title.includes('library set') &&
               !title.includes('school set') &&
               !title.includes('classroom set') &&
               title.length > 2; // Remove very short titles that might be artifacts
      })
      .sort((a, b) => {
        // Sort by publication year (newest first), then by title
        const yearDiff = (b.first_publish_year || 0) - (a.first_publish_year || 0);
        if (yearDiff !== 0) return yearDiff;
        return a.title.localeCompare(b.title);
      });

    // Store all books for searching
    allBooks = filteredBooks;

    // Display all filtered books initially
    displayFilteredBooks(filteredBooks);

    // Add a count display
    const existingCount = document.querySelector('.books-count');
    if (existingCount) {
      existingCount.remove();
    }
    
    const countElement = document.createElement('p');
    countElement.className = 'books-count';
    countElement.textContent = `Showing ${filteredBooks.length} individual books by J.K. Rowling`;
    booksContainer.parentNode.insertBefore(countElement, booksContainer);
  }

  function createBookElement(book) {
    const bookDiv = document.createElement('div');
    bookDiv.className = 'book-item';

    // Get cover image URL
    const coverId = book.cover_i;
    const coverUrl = coverId 
      ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
      : 'https://via.placeholder.com/300x450/f0f0f0/666?text=No+Cover';

    // Format subjects for display
    const subjects = book.subject ? book.subject.slice(0, 3) : [];
    const subjectsHtml = subjects.length > 0 
      ? `<div class="book-subjects">
           ${subjects.map(subject => `<span class="subject-tag">${subject}</span>`).join('')}
         </div>`
      : '';

    // Create description from available data
    let description = '';
    if (book.subtitle) {
      description = book.subtitle;
    } else if (book.subject && book.subject.length > 0) {
      description = `A work exploring themes of ${book.subject.slice(0, 2).join(' and ')}.`;
    } else {
      description = 'A captivating work by J.K. Rowling.';
    }

    // Get current search query for highlighting
    const currentQuery = searchInput ? searchInput.value.trim() : '';
    const titleDisplay = currentQuery ? highlightSearchTerm(book.title, currentQuery) : book.title;
    const descriptionDisplay = currentQuery ? highlightSearchTerm(description, currentQuery) : description;

    // Create Amazon search URL
    const amazonSearchQuery = encodeURIComponent(`${book.title} J.K. Rowling`);
    const amazonUrl = `https://www.amazon.com/s?k=${amazonSearchQuery}&i=stripbooks&ref=nb_sb_noss`;

    bookDiv.innerHTML = `
      <img src="${coverUrl}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/300x450/f0f0f0/666?text=No+Cover'">
      <h3>${titleDisplay}</h3>
      <p class="book-year">${book.first_publish_year || 'Unknown'}</p>
      <p class="book-description">${descriptionDisplay}</p>
      ${subjectsHtml}
      <div class="book-actions">
        <button class="details-btn" onclick="showBookDetails(${JSON.stringify(book).replace(/"/g, '&quot;')})">
          <span class="details-icon">ℹ️</span>
          View Details
        </button>
        <a href="${amazonUrl}" target="_blank" rel="noopener noreferrer" class="buy-btn amazon-btn">
          <span class="amazon-icon">📚</span>
          Buy on Amazon
        </a>
      </div>
    `;

    return bookDiv;
  }

  // Initial fetch
  fetchBooks();

  // Retry button functionality
  if (retryBtn) {
    addEvent(retryBtn, 'click', fetchBooks);
  }

  // Search functionality
  if (searchInput) {
    let searchTimeout;
    
    addEvent(searchInput, 'input', (e) => {
      clearTimeout(searchTimeout);
      const query = e.target.value;
      
      // Debounce search to avoid too many calls
      searchTimeout = setTimeout(() => {
        searchBooks(query);
      }, 300);
    });

    addEvent(searchInput, 'keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        searchBooks('');
      }
    });
  }

  if (clearBtn) {
    addEvent(clearBtn, 'click', () => {
      searchInput.value = '';
      searchBooks('');
      searchInput.focus();
    });
  }
}

// ========== BOOK DETAILS MODAL ==========
function showBookDetails(book) {
  // Create modal if it doesn't exist
  let modal = document.getElementById('bookModal');
  if (!modal) {
    modal = createBookModal();
    document.body.appendChild(modal);
  }

  // Populate modal with book details
  populateBookModal(book);
  
  // Show modal
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function createBookModal() {
  const modal = document.createElement('div');
  modal.id = 'bookModal';
  modal.className = 'book-modal';
  
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeBookModal()"></div>
    <div class="modal-content">
      <button class="modal-close" onclick="closeBookModal()">&times;</button>
      <div class="modal-body">
        <div class="modal-image">
          <img id="modalBookCover" src="" alt="Book Cover">
        </div>
        <div class="modal-info">
          <h2 id="modalBookTitle"></h2>
          <p class="modal-author">by J.K. Rowling</p>
          <div class="modal-details">
            <div class="detail-item">
              <strong>Publication Year:</strong>
              <span id="modalBookYear"></span>
            </div>
            <div class="detail-item">
              <strong>First Published:</strong>
              <span id="modalFirstPublished"></span>
            </div>
            <div class="detail-item" id="modalLanguageContainer">
              <strong>Languages:</strong>
              <span id="modalLanguages"></span>
            </div>
            <div class="detail-item" id="modalPublisherContainer">
              <strong>Publishers:</strong>
              <span id="modalPublishers"></span>
            </div>
            <div class="detail-item" id="modalSubjectsContainer">
              <strong>Subjects:</strong>
              <div id="modalSubjects" class="modal-subjects"></div>
            </div>
            <div class="detail-item" id="modalDescriptionContainer">
              <strong>Description:</strong>
              <p id="modalDescription"></p>
            </div>
          </div>
          <div class="modal-actions">
            <a id="modalAmazonLink" href="" target="_blank" rel="noopener noreferrer" class="buy-btn amazon-btn">
              <span class="amazon-icon">📚</span>
              Buy on Amazon
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
  
  return modal;
}

function populateBookModal(book) {
  // Cover image
  const coverId = book.cover_i;
  const coverUrl = coverId 
    ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
    : 'https://via.placeholder.com/400x600/f0f0f0/666?text=No+Cover';
  
  document.getElementById('modalBookCover').src = coverUrl;
  document.getElementById('modalBookTitle').textContent = book.title;
  document.getElementById('modalBookYear').textContent = book.first_publish_year || 'Unknown';
  document.getElementById('modalFirstPublished').textContent = book.first_publish_year || 'Unknown';
  
  // Languages
  const languageContainer = document.getElementById('modalLanguageContainer');
  if (book.language && book.language.length > 0) {
    document.getElementById('modalLanguages').textContent = book.language.slice(0, 5).join(', ');
    languageContainer.style.display = 'block';
  } else {
    languageContainer.style.display = 'none';
  }
  
  // Publishers
  const publisherContainer = document.getElementById('modalPublisherContainer');
  if (book.publisher && book.publisher.length > 0) {
    document.getElementById('modalPublishers').textContent = book.publisher.slice(0, 3).join(', ');
    publisherContainer.style.display = 'block';
  } else {
    publisherContainer.style.display = 'none';
  }
  
  // Subjects
  const subjectsContainer = document.getElementById('modalSubjectsContainer');
  const subjectsDiv = document.getElementById('modalSubjects');
  if (book.subject && book.subject.length > 0) {
    subjectsDiv.innerHTML = book.subject.slice(0, 10).map(subject => 
      `<span class="subject-tag">${subject}</span>`
    ).join('');
    subjectsContainer.style.display = 'block';
  } else {
    subjectsContainer.style.display = 'none';
  }
  
  // Description
  const descriptionContainer = document.getElementById('modalDescriptionContainer');
  let description = '';
  if (book.subtitle) {
    description = book.subtitle;
  } else if (book.subject && book.subject.length > 0) {
    description = `A captivating work exploring themes of ${book.subject.slice(0, 3).join(', ')}.`;
  } else {
    description = 'A captivating work by J.K. Rowling that has enchanted readers worldwide.';
  }
  
  document.getElementById('modalDescription').textContent = description;
  descriptionContainer.style.display = 'block';
  
  // Amazon link
  const amazonSearchQuery = encodeURIComponent(`${book.title} J.K. Rowling`);
  const amazonUrl = `https://www.amazon.com/s?k=${amazonSearchQuery}&i=stripbooks&ref=nb_sb_noss`;
  document.getElementById('modalAmazonLink').href = amazonUrl;
}

function closeBookModal() {
  const modal = document.getElementById('bookModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore background scrolling
  }
}

// Close modal when pressing Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeBookModal();
  }
});

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
  initBooksPage(); // Initialize books page functionality
  preventReloadOnCurrentPage(); 
});
