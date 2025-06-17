const recommendationCache = new Map();

class RecommendationAlgorithms {
  static select(array, k) {
    if (k < 0 || k >= array.length) return null;

    const sorted = [...array].sort((a, b) => b.rating - a.rating);
    return sorted[k];
  }

  static randomizedSelect(array, k) {
    if (array.length === 0) return null;

    const shuffled = [...array];

    const quickSelect = (arr, left, right, k) => {
      if (left === right) return arr[left];

      const pivotIndex = left + Math.floor(Math.random() * (right - left + 1));
      const pivot = arr[pivotIndex];

      [arr[pivotIndex], arr[right]] = [arr[right], arr[pivotIndex]];

      let storeIndex = left;
      for (let i = left; i < right; i++) {
        if (arr[i].rating >= pivot.rating) {
          [arr[i], arr[storeIndex]] = [arr[storeIndex], arr[i]];
          storeIndex++;
        }
      }

      [arr[storeIndex], arr[right]] = [arr[right], arr[storeIndex]];

      if (k === storeIndex) return arr[k];
      else if (k < storeIndex) return quickSelect(arr, left, storeIndex - 1, k);
      else return quickSelect(arr, storeIndex + 1, right, k);
    };

    return quickSelect(
      shuffled,
      0,
      shuffled.length - 1,
      Math.min(k, shuffled.length - 1)
    );
  }

  static calculateOptimalPosition(userBooks) {
    if (userBooks.length === 0) return { x: 80, y: 85 };

    const sumX = userBooks.reduce((sum, book) => sum + book.x, 0);
    const sumY = userBooks.reduce((sum, book) => sum + book.y, 0);

    return {
      x: sumX / userBooks.length,
      y: sumY / userBooks.length,
    };
  }

  static euclideanDistance(point1, point2) {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static generateRecommendations(userId) {
    const cacheKey = `rec-${userId}-${db.history.length}`;

    if (recommendationCache.has(cacheKey)) {
      return recommendationCache.get(cacheKey);
    }

    const userHistory = db.getUserHistory(userId);
    const lastViewed = db.getLastViewed(userId);
    const userLibrary = db.getUserLibrary(userId);
    const viewedIds = userHistory.map((b) => b.id);
    const availableBooks = userLibrary.filter((b) => !viewedIds.includes(b.id));

    if (availableBooks.length === 0) {
      recommendationCache.set(cacheKey, []);
      return [];
    }

    const recommendations = [];

    if (lastViewed && lastViewed.id) {
      const similarBooks = availableBooks
        .filter(
          (book) =>
            book.genre === lastViewed.genre ||
            Math.abs(book.rating - lastViewed.rating) < 0.5
        )
        .sort((a, b) =>
          this.euclideanDistance(
            { x: a.x, y: a.y },
            { x: lastViewed.x, y: lastViewed.y }
          )
        )
        .slice(0, 2);

      recommendations.push(
        ...similarBooks.map((book) => ({
          ...book,
          reason: "Baseado no último livro visualizado",
          algorithm: "last-viewed",
        }))
      );
    }

    const percentileRecommendations = [];
    for (let i = 0; i < 3; i++) {
      const percentile = Math.floor(availableBooks.length * (0.8 + i * 0.05));
      const book = this.select(availableBooks, percentile);
      if (book && !recommendations.find((r) => r.id === book.id)) {
        percentileRecommendations.push({
          ...book,
          reason: `Top ${Math.round(
            (1 - percentile / availableBooks.length) * 100
          )}% das avaliações`,
          algorithm: "select",
        });
      }
    }
    recommendations.push(...percentileRecommendations);

    const randomRecommendations = [];
    for (let i = 0; i < 2; i++) {
      const randomK = Math.floor(
        Math.random() * Math.min(availableBooks.length, 10)
      );
      const book = this.randomizedSelect(availableBooks, randomK);
      if (book && !recommendations.find((r) => r.id === book.id)) {
        randomRecommendations.push({
          ...book,
          reason: "Descoberta aleatória balanceada",
          algorithm: "randomized-select",
        });
      }
    }
    recommendations.push(...randomRecommendations);

    if (userHistory.length > 0) {
      const optimalPos = this.calculateOptimalPosition(userHistory);
      const nearOptimal = availableBooks
        .map((book) => ({
          ...book,
          distance: this.euclideanDistance(
            { x: book.x, y: book.y },
            optimalPos
          ),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 1)
        .map((book) => ({
          ...book,
          reason: "Próximo ao centro das suas preferências",
          algorithm: "optimal-position",
        }));

      recommendations.push(...nearOptimal);
    }

    const finalRecommendations = recommendations.slice(0, 8);
    recommendationCache.set(cacheKey, finalRecommendations);
    return finalRecommendations;
  }
}
