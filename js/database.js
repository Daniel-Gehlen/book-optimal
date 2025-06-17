class Database {
  constructor() {
    this.users = JSON.parse(localStorage.getItem("bookoptimal_users")) || [
      { id: 1, name: "João Silva", email: "joao@email.com" },
    ];
    this.userLibrary =
      JSON.parse(localStorage.getItem("bookoptimal_user_library")) || {};
    this.history =
      JSON.parse(localStorage.getItem("bookoptimal_history")) || [];
    this.ratings =
      JSON.parse(localStorage.getItem("bookoptimal_ratings")) || {};
  }

  async getInitialBooks() {
    try {
      const response = await fetch(
        "https://openlibrary.org/search.json?subject=fiction&limit=10"
      );
      const data = await response.json();
      return this.formatBooks(data.docs);
    } catch (error) {
      console.error("Error fetching books:", error);
      return [];
    }
  }

  formatBooks(books) {
    return books.map((book) => ({
      id: `ol-${book.key.replace("/works/", "")}`,
      title: book.title || "Unknown Title",
      author: book.author_name ? book.author_name.join(", ") : "Unknown Author",
      year: book.first_publish_year || "Unknown Year",
      genre: book.subject
        ? book.subject.slice(0, 3).join(", ")
        : "Unknown Genre",
      x: Math.floor(Math.random() * 30) + 70,
      y: Math.floor(Math.random() * 30) + 70,
      rating: 3.5 + Math.random() * 1.5,
      cover: book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
        : "",
      olKey: book.key,
    }));
  }

  getUserLibrary(userId) {
    return this.userLibrary[userId] || [];
  }

  addToLibrary(userId, book) {
    if (!this.userLibrary[userId]) {
      this.userLibrary[userId] = [];
    }
    if (!this.userLibrary[userId].some((b) => b.id === book.id)) {
      this.userLibrary[userId].push(book);
      this.saveToLocalStorage();
    }
  }

  removeFromLibrary(userId, bookId) {
    if (this.userLibrary[userId]) {
      this.userLibrary[userId] = this.userLibrary[userId].filter(
        (b) => b.id !== bookId
      );
      this.saveToLocalStorage();
    }
  }

  addToHistory(userId, bookId) {
    this.history.push({
      userId,
      bookId,
      timestamp: Date.now(),
    });
    this.saveToLocalStorage();
  }

  getLastViewed(userId) {
    const userHistory = this.history
      .filter((h) => h.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp);
    if (userHistory.length === 0) return null;
    const lastBookId = userHistory[0].bookId;
    const libraryBooks = this.userLibrary[userId] || [];
    return libraryBooks.find((b) => b.id === lastBookId) || null;
  }

  getUserHistory(userId) {
    return this.history
      .filter((h) => h.userId === userId)
      .map((h) => {
        const libraryBooks = this.userLibrary[userId] || [];
        return libraryBooks.find((b) => b.id === h.bookId);
      })
      .filter(Boolean);
  }

  rateBook(userId, bookId, rating) {
    if (!this.ratings[userId]) this.ratings[userId] = {};
    this.ratings[userId][bookId] = rating;
    this.saveToLocalStorage();
  }

  exportLibrary(userId) {
    const library = this.userLibrary[userId] || [];
    return {
      date: new Date().toISOString(),
      count: library.length,
      books: library.map((book) => ({
        title: book.title,
        author: book.author,
        year: book.year,
        genre: book.genre,
        rating: this.ratings[userId]?.[book.id] || "Não avaliado",
        link: `https://openlibrary.org${book.olKey}`,
      })),
    };
  }

  saveToLocalStorage() {
    localStorage.setItem(
      "bookoptimal_user_library",
      JSON.stringify(this.userLibrary)
    );
    localStorage.setItem("bookoptimal_history", JSON.stringify(this.history));
    localStorage.setItem("bookoptimal_ratings", JSON.stringify(this.ratings));
  }
}

window.db = new Database();
