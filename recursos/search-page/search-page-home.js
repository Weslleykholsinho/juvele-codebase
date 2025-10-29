document.addEventListener('DOMContentLoaded', () => {
    // Menu elements
    const menuIcon = document.querySelector('.menu-icon');
    const menuList = document.getElementById('menuList') || document.querySelector('nav ul');

    // Search elements
    // pick the first visible search icon (nav one), but tolerate duplicates
    const searchIcon = document.querySelector('.search-icon');
    const form = document.getElementById('siteSearch');
    const input = document.getElementById('searchInput');
    const results = document.getElementById('searchResults');
    const submit = document.getElementById('searchSubmit');

    // Safety checks
    if (!menuIcon || !menuList) {
        // still wire up search if menu missing
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

        submit.addEventListener('click', () => performSearch(input.value));
        input.addEventListener('input', debounce(() => performSearch(input.value), 220));

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

    /* ---------- search implementation (unchanged) ---------- */
    function getSearchable() {
        return Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, p, a, li, .promo-text'))
            .filter(el => el.textContent && el.textContent.trim().length);
    }

    function performSearch(query) {
        results.innerHTML = '';
        if (!query || !query.trim()) {
            results.classList.remove('open');
            return;
        }
        const q = query.trim().toLowerCase();
        const candidates = getSearchable();
        const matches = candidates
            .map(el => ({ el, text: el.textContent.trim(), link: findClosestHref(el) }))
            .filter(item => item.text.toLowerCase().includes(q))
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
            div.innerHTML = highlight(m.text, q);
            div.addEventListener('click', () => {
                if (m.link) {
                    window.location.href = m.link;
                } else {
                    m.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    form.classList.remove('open');
                }
            });
            results.appendChild(div);
        });
        results.classList.add('open');
    }

    function findClosestHref(el) {
        const a = el.closest('a');
        return a && a.href ? a.href : null;
    }

    function highlight(text, q) {
        const idx = text.toLowerCase().indexOf(q);
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