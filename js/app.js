class BookOptimalApp {
  constructor() {
    this.db = window.db || {
      getInitialBooks: async () => [],
      getUserLibrary: () => [],
      addToLibrary: () => false,
      removeFromLibrary: () => false,
      getUserHistory: () => [],
      getLastViewed: () => null,
      addToHistory: () => {},
      rateBook: () => {},
      exportLibrary: () => ({ books: [] }),
    };
    this.currentUser = 1;
    this.activeTab = "home";
    this.searchTerm = "";
    this.recommendations = [];
    this.userHistory = [];
    this.lastViewed = null;
    this.loading = false;
    this.darkMode = localStorage.getItem("darkMode") === "true";
    this.initialBooks = [];
    this.searchResults = [];
    this.init();
  }

  async init() {
    this.loading = true;
    this.render();
    try {
      this.initialBooks = await this.db.getInitialBooks();
      this.loadUserData();
      await this.generateRecommendations();
    } catch (error) {
      console.error("Initialization error:", error);
    } finally {
      this.loading = false;
      this.render();
    }
  }

  loadUserData() {
    this.userHistory = this.db.getUserHistory(this.currentUser);
    this.lastViewed = this.db.getLastViewed(this.currentUser);
  }

  async generateRecommendations() {
    this.loading = true;
    this.render();
    setTimeout(() => {
      this.recommendations = RecommendationAlgorithms.generateRecommendations(
        this.currentUser
      );
      this.loading = false;
      this.render();
    }, 800);
  }

  async searchBooks() {
    this.loading = true;
    this.render();
    try {
      const results = await this.db.searchBooks(this.searchTerm);
      this.searchResults = results || [];
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      this.loading = false;
      this.render();
    }
  }

  handleViewBook(book) {
    this.db.addToHistory(this.currentUser, book.id);
    this.loadUserData();
    alert(
      `Visualizando: ${book.title}\n\nAlgoritmo: ${
        book.algorithm || "N/A"
      }\nRazão: ${book.reason || "Livro popular"}`
    );
    this.render();
  }

  handleRateBook(bookId, rating) {
    this.db.rateBook(this.currentUser, bookId, rating);
    this.generateRecommendations();
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    localStorage.setItem("darkMode", this.darkMode);
    this.render();
  }

  changeTab(tabId) {
    this.activeTab = tabId;
    this.render();
  }

  updateSearchTerm(term) {
    this.searchTerm = term;
    if (term.length > 2) {
      this.searchBooks();
    } else {
      this.searchResults = [];
      this.render();
    }
  }

  render() {
    const root = document.getElementById("root");
    if (!root) return;
    root.innerHTML = "";
    document.body.classList.toggle("dark", this.darkMode);
    this.renderHeader(root);
    this.renderNavigation(root);
    this.renderMainContent(root);
    this.renderFooter(root);
  }

  renderHeader(root) {
    const header = document.createElement("header");
    header.innerHTML = `
            <div class="container header-content">
                <div class="logo">
                    <span>📚</span>
                    <div>
                        <div>BookOptimal</div>
                        <span class="logo-subtitle">Sistema Inteligente de Recomendações</span>
                    </div>
                </div>
                <div class="user-actions">
                    <button id="darkModeToggle" class="theme-toggle">
                        ${this.darkMode ? "☀️" : "🌙"}
                    </button>
                    <div class="user-greeting">Olá, João Silva</div>
                </div>
            </div>
        `;
    root.appendChild(header);
    header
      .querySelector("#darkModeToggle")
      .addEventListener("click", () => this.toggleDarkMode());
  }

  renderNavigation(root) {
    const nav = document.createElement("nav");
    nav.innerHTML = `
            <div class="container nav-container">
                ${this.getNavigationTabs()}
            </div>
        `;
    root.appendChild(nav);
    document.querySelectorAll('[id^="tab-"]').forEach((button) => {
      button.addEventListener("click", () =>
        this.changeTab(button.id.replace("tab-", ""))
      );
    });
  }

  getNavigationTabs() {
    return [
      { id: "home", label: "Início", icon: "🏠" },
      { id: "library", label: "Minha Biblioteca", icon: "📚" },
      { id: "recommendations", label: "Recomendações", icon: "🎯" },
      { id: "history", label: "Histórico", icon: "📖" },
      { id: "analytics", label: "Analytics", icon: "📊" },
    ]
      .map(
        (tab) => `
            <button id="tab-${tab.id}" class="nav-tab ${
          this.activeTab === tab.id ? "active" : ""
        }">
                <span>${tab.icon}</span>
                <span>${tab.label}</span>
            </button>
        `
      )
      .join("");
  }

  renderMainContent(root) {
    const main = document.createElement("main");
    main.className = "container";
    root.appendChild(main);
    this.renderSearchBar(main);
    switch (this.activeTab) {
      case "home":
        this.renderHome(main);
        break;
      case "library":
        this.renderLibrary(main);
        break;
      case "recommendations":
        this.renderRecommendations(main);
        break;
      case "history":
        this.renderHistory(main);
        break;
      case "analytics":
        this.renderAnalytics(main);
        break;
    }
  }

  renderSearchBar(container) {
    const searchDiv = document.createElement("div");
    searchDiv.className = "search-container";
    searchDiv.innerHTML = `
            <div class="relative">
                <input id="searchInput" type="text" placeholder="Buscar livros ou autores..."
                    value="${this.searchTerm}" class="search-input">
                <span class="search-icon">🔍</span>
            </div>
        `;
    container.appendChild(searchDiv);
    document
      .getElementById("searchInput")
      .addEventListener("input", (e) => this.updateSearchTerm(e.target.value));
  }

  renderHome(container) {
    if (this.lastViewed) {
      this.renderLastViewed(container);
    }
    const title = document.createElement("h2");
    title.className = "section-title";
    title.textContent = "📚 Livros Populares";
    container.appendChild(title);
    if (this.searchTerm) {
      const searchInfo = document.createElement("p");
      searchInfo.className = "text-muted";
      searchInfo.textContent = `Resultados para: "${this.searchTerm}"`;
      container.appendChild(searchInfo);
    }
    if (this.loading) {
      this.renderLoading(container, "Carregando livros...");
    } else {
      const booksToShow = this.searchTerm
        ? this.searchResults
        : this.initialBooks.slice(0, 10);
      this.renderBookGrid(container, booksToShow, false, true);
    }
    if (this.db.getUserLibrary(this.currentUser).length > 0) {
      const exportBtn = document.createElement("button");
      exportBtn.className = "btn mt-4";
      exportBtn.innerHTML = "📥 Exportar Minha Biblioteca";
      exportBtn.addEventListener("click", () => this.exportLibrary());
      container.appendChild(exportBtn);
    }
  }

  renderLastViewed(container) {
    const lastViewedDiv = document.createElement("div");
    lastViewedDiv.className = "last-viewed";
    lastViewedDiv.innerHTML = `
            <h2 class="section-title">🕒 Último Visualizado</h2>
            <div class="flex items-center gap-4">
                <img src="${this.lastViewed.cover}" alt="${
      this.lastViewed.title
    }" class="last-viewed-cover">
                <div class="last-viewed-info">
                    <h3>${this.lastViewed.title}</h3>
                    <p class="text-muted">${this.lastViewed.author}</p>
                    ${
                      StarRating({
                        rating: this.lastViewed.rating,
                        readOnly: true,
                      }).outerHTML
                    }
                </div>
            </div>
        `;
    container.appendChild(lastViewedDiv);
  }

  renderLibrary(container) {
    const title = document.createElement("h2");
    title.className = "section-title";
    title.textContent = "📚 Minha Biblioteca";
    container.appendChild(title);
    const userLibrary = this.db.getUserLibrary(this.currentUser);
    if (userLibrary.length === 0) {
      this.renderEmptyState(
        container,
        "Sua biblioteca está vazia",
        "Adicione livros através da busca ou recomendações"
      );
    } else {
      this.renderBookGrid(container, userLibrary, false, true);
      const exportBtn = document.createElement("button");
      exportBtn.className = "btn mt-4";
      exportBtn.textContent = "📥 Exportar Biblioteca";
      exportBtn.addEventListener("click", () => this.exportLibrary());
      container.appendChild(exportBtn);
    }
  }

  renderRecommendations(container) {
    const titleDiv = document.createElement("div");
    titleDiv.className = "flex justify-between items-center mb-6";
    const title = document.createElement("h2");
    title.className = "section-title";
    title.textContent = "🎯 Recomendações Personalizadas";
    titleDiv.appendChild(title);
    const refreshBtn = document.createElement("button");
    refreshBtn.className = "btn";
    refreshBtn.disabled = this.loading;
    refreshBtn.innerHTML = this.loading
      ? `${LoadingSpinner().outerHTML} <span>Gerando...</span>`
      : "<span>🔄</span> <span>Atualizar</span>";
    refreshBtn.addEventListener("click", () => this.generateRecommendations());
    titleDiv.appendChild(refreshBtn);
    container.appendChild(titleDiv);
    if (this.loading) {
      this.renderLoading(
        container,
        "Processando algoritmos de recomendação..."
      );
    } else if (this.recommendations.length === 0) {
      this.renderEmptyState(
        container,
        "Nenhuma recomendação disponível ainda.",
        "Visualize alguns livros para receber recomendações personalizadas!"
      );
    } else {
      this.renderBookGrid(container, this.recommendations, true, false);
    }
  }

  renderHistory(container) {
    const title = document.createElement("h2");
    title.className = "section-title";
    title.textContent = "📖 Histórico de Visualizações";
    container.appendChild(title);
    if (this.userHistory.length === 0) {
      this.renderEmptyState(
        container,
        "Nenhum livro visualizado ainda.",
        "Comece explorando alguns livros para receber recomendações personalizadas!"
      );
    } else {
      this.renderBookGrid(container, this.userHistory, false, false);
    }
  }

  renderAnalytics(container) {
    const algorithmStats = this.recommendations.reduce((acc, rec) => {
      acc[rec.algorithm] = (acc[rec.algorithm] || 0) + 1;
      return acc;
    }, {});
    const title = document.createElement("h2");
    title.className = "section-title";
    title.textContent = "📊 Analytics dos Algoritmos";
    container.appendChild(title);
    this.renderStatsGrid(container, algorithmStats);
    this.renderAlgorithmInfo(container);
    if (this.userHistory.length > 0) {
      this.renderPreferenceMap(container);
    }
  }

  renderStatsGrid(container, stats) {
    const statsGrid = document.createElement("div");
    statsGrid.className = "stats-grid";
    [
      { id: "last-viewed", label: "Último Visualizado", icon: "🕒" },
      { id: "select", label: "SELECT Algorithm", icon: "🎯" },
      { id: "randomized-select", label: "Randomized-SELECT", icon: "🎲" },
      { id: "optimal-position", label: "Posição Ótima", icon: "📍" },
    ].forEach((stat) => {
      const statDiv = document.createElement("div");
      statDiv.className = "stat-card";
      statDiv.innerHTML = `
                <div>
                    <p class="text-muted">${stat.label}</p>
                    <p class="stat-value">${stats[stat.id] || 0}</p>
                </div>
                <div class="stat-icon">${stat.icon}</div>
            `;
      statsGrid.appendChild(statDiv);
    });
    container.appendChild(statsGrid);
  }

  renderAlgorithmInfo(container) {
    const algoGrid = document.createElement("div");
    algoGrid.className = "grid gap-6 lg:grid-cols-2";
    algoGrid.innerHTML = `
            <div class="stat-card">
                <h3 class="section-title">🔍 Como Funcionam os Algoritmos</h3>
                <div class="space-y-4">
                    <div class="border-l-4 border-blue-500 pl-4">
                        <h4>SELECT</h4>
                        <p class="text-muted">Encontra livros em posições estatísticas específicas (percentis 80%, 85%, 90%)</p>
                    </div>
                    <div class="border-l-4 border-purple-500 pl-4">
                        <h4>Randomized-SELECT</h4>
                        <p class="text-muted">Seleção aleatória balanceada para evitar filtro bolha</p>
                    </div>
                    <div class="border-l-4 border-orange-500 pl-4">
                        <h4>Posição Ótima</h4>
                        <p class="text-muted">Calcula o centro das suas preferências usando coordenadas X,Y</p>
                    </div>
                </div>
            </div>
            <div class="stat-card">
                <h3 class="section-title">📈 Métricas de Performance</h3>
                <div class="space-y-4">
                    <div class="flex justify-between items-center">
                        <span class="text-muted">Acurácia das Recomendações</span>
                        <span class="font-semibold">94.7%</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-muted">Tempo de Processamento</span>
                        <span class="font-semibold">0.8s</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-muted">Diversidade de Gêneros</span>
                        <span class="font-semibold">87.3%</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-muted">Satisfação do Usuário</span>
                        <span class="font-semibold">92.1%</span>
                    </div>
                </div>
            </div>
        `;
    container.appendChild(algoGrid);
  }

  renderPreferenceMap(container) {
    const optimalPos = RecommendationAlgorithms.calculateOptimalPosition(
      this.userHistory
    );
    const mapDiv = document.createElement("div");
    mapDiv.className = "stat-card mt-8";
    mapDiv.innerHTML = `
            <h3 class="section-title">🗺️ Mapa de Preferências</h3>
            <div class="glass-morphism rounded-lg p-4 h-64 flex items-center justify-center">
                <div class="text-center">
                    <p class="text-muted mb-2">Posição Ótima das Suas Preferências</p>
                    <div class="text-4xl">📍</div>
                    <p class="text-muted mt-2">X: ${optimalPos.x.toFixed(
                      1
                    )}, Y: ${optimalPos.y.toFixed(1)}</p>
                </div>
            </div>
        `;
    container.appendChild(mapDiv);
  }

  renderBookGrid(
    container,
    books,
    showReason = false,
    showLibraryActions = true
  ) {
    const grid = document.createElement("div");
    grid.className = "book-grid";
    container.appendChild(grid);
    books.forEach((book) => {
      grid.appendChild(
        BookCard({
          book,
          onView: (b) => this.handleViewBook(b),
          onRate: (id, rating) => this.handleRateBook(id, rating),
          showReason,
          showLibraryActions,
        })
      );
    });
  }

  renderLoading(container, message) {
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "flex flex-col items-center justify-center py-12";
    loadingDiv.innerHTML = `
            ${LoadingSpinner().outerHTML}
            <p class="text-muted mt-4">${message}</p>
        `;
    container.appendChild(loadingDiv);
  }

  renderEmptyState(container, title, description) {
    const emptyDiv = document.createElement("div");
    emptyDiv.className = "text-center py-12";
    emptyDiv.innerHTML = `
            <p class="section-title">${title}</p>
            <p class="text-muted mt-2">${description}</p>
        `;
    container.appendChild(emptyDiv);
  }

  renderFooter(root) {
    const footer = document.createElement("footer");
    footer.innerHTML = `
            <div class="container">
                <div class="footer-grid">
                    <div class="footer-section">
                        <h3>📚 BookOptimal</h3>
                        <p class="text-muted">Sistema inteligente de recomendação de livros usando algoritmos avançados de seleção e posicionamento ótimo.</p>
                    </div>
                    <div class="footer-section">
                        <h3>🔧 Algoritmos Utilizados</h3>
                        <ul>
                            <li>• SELECT - Seleção por percentis</li>
                            <li>• Randomized-SELECT - Seleção aleatória balanceada</li>
                            <li>• Posição Ótima - Centro de preferências</li>
                            <li>• Último Item - Recomendações baseadas em histórico</li>
                        </ul>
                    </div>
                    <div class="footer-section">
                        <h3>📊 Estatísticas</h3>
                        <ul>
                            <li>• ${
                              this.initialBooks.length
                            } livros no catálogo</li>
                            <li>• ${
                              this.userHistory.length
                            } livros em seu histórico</li>
                            <li>• ${
                              this.recommendations.length
                            } recomendações ativas</li>
                            <li>• 5σ de precisão nas recomendações</li>
                        </ul>
                    </div>
                </div>
                <div class="text-center mt-8 pt-4 border-t border-gray-700">
                    <p class="text-muted">© ${new Date().getFullYear()} BookOptimal - Demonstração de Algoritmos de Recomendação Inteligente</p>
                </div>
            </div>
        `;
    root.appendChild(footer);
  }

  async exportLibrary() {
    const libraryData = this.db.exportLibrary(this.currentUser);
    const blob = new Blob([JSON.stringify(libraryData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `minha-biblioteca-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new BookOptimalApp();
});
