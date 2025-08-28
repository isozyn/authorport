// Toggle Hamburger Menu
const hamburger = document.getElementById('hamburger');
const navbar = document.getElementById('navbar');

hamburger.addEventListener('click', () => {
  navbar.classList.toggle('show');
});

// Back to Top Button
const backToTopButton = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
  if (window.pageYOffset > 300) {
    backToTopButton.classList.add('visible');
  } else {
    backToTopButton.classList.remove('visible');
  }
});

backToTopButton.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Card Slider Functionality
// let currentSlide = 0;
// const slider = document.getElementById('cardSlider');
// const cards = document.querySelectorAll('.card');
// const totalCards = cards.length;
// const cardsVisible = 3; // Number of cards visible at once

// function slideLeft() {
//   if (currentSlide > 0) {
//     currentSlide--;
//     updateSlider();
//   }
// }

// function slideRight() {
//   if (currentSlide < totalCards - cardsVisible) {
//     currentSlide++;
//     updateSlider();
//   }
// }

// function updateSlider() {
//   const cardWidth = cards[0].offsetWidth + 20; // card width + gap
//   const translateX = -currentSlide * cardWidth;
//   slider.style.transform = `translateX(${translateX}px)`;
// }

// // Auto-scroll functionality (optional)
// setInterval(() => {
//   if (currentSlide < totalCards - cardsVisible) {
//     slideRight();
//   } else {
//     currentSlide = 0;
//     updateSlider();
//   }
// }, 4000);

// // Handle window resize to recalculate slider positions
// window.addEventListener('resize', () => {
//   updateSlider();
// });