class SmoothNavigation {
    constructor() {
        this.cache = new Map();
        this.mainContent = document.querySelector('main');
        this.isTransitioning = false;
        
        // Précharger les pages
        this.prefetchPages();
        // Gérer la navigation
        this.handleNavigation();
    }

    async prefetchPages() {
        const links = document.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="../"], a[href^="http"]');
        links.forEach(link => {
            if (link.href.includes(window.location.origin)) {
                this.prefetch(link.href);
            }
        });
    }

    async prefetch(url) {
        if (!this.cache.has(url)) {
            try {
                const response = await fetch(url);
                const text = await response.text();
                this.cache.set(url, text);
            } catch (error) {
                console.error('Prefetch error:', error);
            }
        }
    }

    handleNavigation() {
        document.addEventListener('click', async (e) => {
            const link = e.target.closest('a');
            if (link && link.href.includes(window.location.origin)) {
                e.preventDefault();
                if (this.isTransitioning) return;
                
                this.isTransitioning = true;
                await this.navigateTo(link.href);
                this.isTransitioning = false;
            }
        });

        window.addEventListener('popstate', async (e) => {
            if (this.isTransitioning) return;
            this.isTransitioning = true;
            await this.navigateTo(window.location.href, false);
            this.isTransitioning = false;
        });
    }

    async navigateTo(url, addToHistory = true) {
        document.body.classList.add('fade-out');
        
        try {
            const content = await this.getContent(url);
            if (addToHistory) {
                window.history.pushState({}, '', url);
            }
            
            await this.updateContent(content);
            document.body.classList.remove('fade-out');
            
            // Réinitialiser les scripts
            this.reinitializeScripts();
        } catch (error) {
            console.error('Navigation error:', error);
            window.location.href = url;
        }
    }

    async getContent(url) {
        if (this.cache.has(url)) {
            return this.cache.get(url);
        }
        
        const response = await fetch(url);
        const text = await response.text();
        this.cache.set(url, text);
        return text;
    }

    async updateContent(content) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        document.title = doc.title;
        
        const newMain = doc.querySelector('main');
        if (newMain) {
            this.mainContent.innerHTML = newMain.innerHTML;
        }
    }

    reinitializeScripts() {
        // Réinitialiser les animations
        if (window.reveal) reveal();
        
        // Réinitialiser les autres fonctionnalités
        document.dispatchEvent(new CustomEvent('navigation-complete'));
    }
}

// Initialiser la navigation fluide
window.addEventListener('DOMContentLoaded', () => {
    new SmoothNavigation();
});
