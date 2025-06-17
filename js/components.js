function StarRating({ rating, onRate, readOnly = false }) {
  const stars = document.createElement("div");
  stars.className = "star-rating";

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("span");
    star.className = `star ${rating >= i ? "filled" : ""}`;
    star.textContent = "★";
    star.style.cursor = readOnly ? "default" : "pointer";

    if (!readOnly) {
      star.addEventListener("mouseenter", () => {
        stars.querySelectorAll(".star").forEach((s, idx) => {
          s.classList.toggle("filled", idx < i);
        });
      });

      star.addEventListener("mouseleave", () => {
        stars.querySelectorAll(".star").forEach((s, idx) => {
          s.classList.toggle("filled", idx < rating);
        });
      });

      star.addEventListener("click", () => onRate(i));
    }

    stars.appendChild(star);
  }

  return stars;
}

function BookCard({
  book,
  onView,
  onRate,
  showReason = false,
  showLibraryActions = true,
}) {
  const card = document.createElement("div");
  card.className = "book-card";

  const coverImg = document.createElement("img");
  coverImg.src =
    book.cover ||
    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect width="200" height="300" fill="%23ddd"/><text x="100" y="150" text-anchor="middle" font-family="Arial" font-size="14" fill="%23666">Sem Capa</text></svg>';
  coverImg.alt = book.title;
  coverImg.className = "book-cover";
  coverImg.onerror = () => {
    coverImg.src =
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"><rect width="200" height="300" fill="%23ddd"/><text x="100" y="150" text-anchor="middle" font-family="Arial" font-size="14" fill="%23666">Sem Capa</text></svg>';
  };

  const contentDiv = document.createElement("div");
  contentDiv.className = "book-content";

  const title = document.createElement("h3");
  title.className = "book-title";
  title.textContent = book.title;

  const author = document.createElement("p");
  author.className = "book-author";
  author.textContent = book.author;

  const meta = document.createElement("div");
  meta.className = "book-meta";
  meta.innerHTML = `
        <span>${book.genre}</span>
        <span>${book.year}</span>
    `;

  const ratingDiv = document.createElement("div");
  ratingDiv.className = "book-rating";

  const stars = StarRating({
    rating: book.rating,
    readOnly: true,
  });

  const ratingText = document.createElement("span");
  ratingText.className = "text-muted";
  ratingText.textContent = book.rating.toFixed(1);

  ratingDiv.appendChild(stars);
  ratingDiv.appendChild(ratingText);

  contentDiv.appendChild(title);
  contentDiv.appendChild(author);
  contentDiv.appendChild(meta);
  contentDiv.appendChild(ratingDiv);

  if (showReason && book.reason) {
    const reasonDiv = document.createElement("div");
    reasonDiv.className = "book-reason";
    reasonDiv.textContent = book.reason;
    contentDiv.appendChild(reasonDiv);
  }

  const viewBtn = document.createElement("button");
  viewBtn.className = "btn";
  viewBtn.textContent = "Ver Detalhes";
  viewBtn.addEventListener("click", () => onView(book));

  contentDiv.appendChild(viewBtn);

  if (showLibraryActions) {
    const libraryBtn = document.createElement("button");
    libraryBtn.className = "library-btn";

    const userLibrary = window.db?.getUserLibrary?.(1) || [];
    const inLibrary = userLibrary.some((b) => b.id === book.id);
    libraryBtn.textContent = inLibrary
      ? "Remover da Biblioteca"
      : "Adicionar à Biblioteca";

    libraryBtn.addEventListener("click", () => {
      if (!window.db) return;

      if (inLibrary) {
        window.db.removeFromLibrary(1, book.id);
        libraryBtn.textContent = "Adicionar à Biblioteca";
      } else {
        window.db.addToLibrary(1, book);
        libraryBtn.textContent = "Remover da Biblioteca";
      }
      libraryBtn.classList.toggle("in-library", !inLibrary);
    });

    contentDiv.appendChild(libraryBtn);
  }

  const rateDiv = document.createElement("div");
  rateDiv.className = "rating-container";

  const rateText = document.createElement("span");
  rateText.className = "text-muted";
  rateText.textContent = "Avaliar:";

  const rateStars = StarRating({
    rating: 0,
    onRate: (rating) => {
      onRate(book.id, rating);
    },
  });

  rateDiv.appendChild(rateText);
  rateDiv.appendChild(rateStars);

  contentDiv.appendChild(rateDiv);

  card.appendChild(coverImg);
  card.appendChild(contentDiv);

  return card;
}

function LoadingSpinner() {
  const spinner = document.createElement("div");
  spinner.className = "loading-spinner";
  return spinner;
}
