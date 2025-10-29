document.addEventListener('DOMContentLoaded', () => {
    // Menu elements
    const menuIcon = document.querySelector('.menu-icon');
    const menuList = document.getElementById('menuList') || document.querySelector('nav ul');

    // Search elements
    const searchIcon = document.querySelector('.search-icon');
    const form = document.getElementById('siteSearch');
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');
    const submit = document.getElementById('searchSubmit');

    // Products (loaded from produtos.json)
    let products = [];
    let productsLoaded = false;

    async function loadProducts() {
        try {
            // ajuste o caminho se necessário
            const resp = await fetch('recursos/produtos.json', { cache: 'no-store' });
            if (!resp.ok) throw new Error('fetch error ' + resp.status);
            const data = await resp.json();
            // aceita array raiz ou { products: [...] }
            products = Array.isArray(data) ? data : (data.products || []);
        } catch (err) {
            console.error('Erro ao carregar produtos.json:', err);
            products = [];
        } finally {
            productsLoaded = true;
        }
    }

    // Safety checks
    if (!menuIcon || !menuList) {
        // still wire up search if menu missing
        loadProducts();
        initSearch();
        return;
    }

    const iconElement = menuIcon.querySelector('i');

    function setIconOpen(open) {
        if (iconElement) {
            iconElement.classList.toggle('fa-times', open);
            iconElement.classList.toggle('fa-bars', !open);
        } else {
            menuIcon.textContent = open ? '✕' : '≡';
        }
    }
    
    menuIcon.addEventListener('click', () => {
        const isOpen = menuList.classList.toggle('open');
        setIconOpen(isOpen);

        if (isOpen) {
            // close search if open
            if (form) {
                form.classList.remove('open');
            }
            if (results) {
                results.classList.remove('open');
                results.setAttribute('aria-hidden', 'true');
            }
        }
    });

    // Close menu when a menu link is clicked
    menuList.addEventListener('click', (e) => {
        if (e.target.tagName.toLowerCase() === 'a') {
            menuList.classList.remove('open');
            setIconOpen(false);
        }
    });

    // Initialize search handlers (also used if menu elements missing)
    function initSearch() {
        if (!form || !input || !results || !searchIcon) return;

        // start loading products once
        loadProducts();

        searchIcon.addEventListener('click', () => {
            const opened = form.classList.toggle('open');

            // when opening search, ensure menu is closed
            if (opened && menuList) {
                if (menuList.classList.contains('open')) {
                    menuList.classList.remove('open');
                    setIconOpen(false);
                }
            }

            // hide results when closing search
            if (!opened) {
                results.classList.remove('open');
                results.setAttribute('aria-hidden', 'true');
            } else {
                results.setAttribute('aria-hidden', 'false');
                input.focus();
            }
        });

        submit.addEventListener('click', () => performProductSearch(input.value));
        input.addEventListener('input', debounce(() => performProductSearch(input.value), 220));

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                form.classList.remove('open');
                results.classList.remove('open');
                // also close menu on Escape
                if (menuList) {
                    menuList.classList.remove('open');
                    setIconOpen(false);
                }
            }
        });
    }

    // call to wire search handlers
    initSearch();

    // fechar menu / search ao rolar a página

    /* ---------- product-only search implementation ---------- */
    function normalizeName(p) {
        return (p.name || p.nome || p.title || p.titulo || '').toString();
    }

    function getProductLink(p) {
        // tenta vários campos comuns; ajuste conforme seu JSON
        if (p.url) return p.url;
        if (p.link) return p.link;
        if (p.href) return p.href;
        if (p.slug) return `/produto/${p.slug}`;
        return null;
    }

    function performProductSearch(query) {
        results.innerHTML = '';

        if (!query || !query.trim()) {
            results.classList.remove('open');
            return;
        }

        const q = query.trim().toLowerCase();

        if (!productsLoaded) {
            results.innerHTML = '<div class="search-item">Carregando produtos...</div>';
            results.classList.add('open');
            return;
        }

        if (!products || products.length === 0) {
            results.innerHTML = '<div class="search-item">Nenhum produto disponível</div>';
            results.classList.add('open');
            return;
        }

        const matches = products
            .map(p => ({ p, name: normalizeName(p) }))
            .filter(item => item.name && item.name.toLowerCase().includes(q))
            .slice(0, 30);

        if (matches.length === 0) {
            results.innerHTML = '<div class="search-item">Nenhum resultado</div>';
            results.classList.add('open');
            return;
        }

        matches.forEach(m => {
            const div = document.createElement('div');
            div.className = 'search-item';
            div.tabIndex = 0;
            div.innerHTML = highlight(m.name, q);
            const link = getProductLink(m.p);
            div.addEventListener('click', () => {
                if (link) {
                    window.location.href = link;
                } else {
                    // sem link: tenta rolar até um elemento na página que contenha o nome
                    const el = Array.from(document.querySelectorAll('*')).find(elm => (elm.textContent || '').includes(m.name));
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        form.classList.remove('open');
                        results.classList.remove('open');
                    }
                }
            });
            results.appendChild(div);
        });
        results.classList.add('open');
    }

    function highlight(text, q) {
        if (!text) return '';
        const lower = text.toLowerCase();
        const idx = lower.indexOf(q);
        if (idx === -1) return escapeHtml(text.slice(0, 120));
        const before = escapeHtml(text.slice(Math.max(0, idx - 40), idx));
        const match = escapeHtml(text.substr(idx, q.length));
        const after = escapeHtml(text.substr(idx + q.length, 120));
        return `${before}<mark>${match}</mark>${after}`;
    }

    function escapeHtml(s) {
        return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function debounce(fn, ms) {
        let t;
        return function (...args) {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, args), ms);
        };
    }
});