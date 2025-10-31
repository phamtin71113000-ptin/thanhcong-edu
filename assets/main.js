// main.js — dynamic page loader (SPA-like) for static site
(() => {
  const content = document.getElementById('content');
  const linksSelector = '[data-link]';
  const mobileToggle = document.getElementById('mobileToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const yearEl = document.getElementById('year');
  yearEl && (yearEl.textContent = new Date().getFullYear());

  // map route name -> page path
  const routeToPath = {
    'home': 'thanhcong-edu/pages/home.html',
    'gioi-thieu': 'thanhcong-edu/pages/gioi-thieu.html',
    'khoa-hoc': 'thanhcong-edu/pages/khoa-hoc.html',
    'lich-khai-giang': 'thanhcong-edu/pages/lich-khai-giang.html',
    'tin-tuc': 'thanhcong-edu/pages/tin-tuc.html',
    'cam-nhan': 'thanhcong-edu/pages/cam-nhan.html',
    'dang-ky': 'thanhcong-edu/pages/dang-ky.html',
    'lien-he': 'thanhcong-edu/pages/lien-he.html'
  };

  // load page via fetch and inject into #content
  async function loadPage(routeName, push = true) {
    const path = routeToPath[routeName] || routeToPath['home'];
    try {
      const res = await fetch(path, {cache: "no-store"});
      if(!res.ok) throw new Error('Không thể tải nội dung');
      const html = await res.text();
      content.innerHTML = html;
      // update active nav styles
      document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
      document.querySelectorAll('[data-link]').forEach(a => {
        if(a.getAttribute('data-link') === routeName) a.classList.add('active');
      });
      // update title (simple)
      const titleEl = content.querySelector('h1, h2');
      if(titleEl) document.title = `${titleEl.textContent.trim()} — Trung Tâm Thành Công`;
      // focus main for accessibility
      content.focus();
      // push state
      if(push) history.pushState({route: routeName}, '', `#${routeName}`);
      // close mobile menu if open
      if(mobileMenu && mobileMenu.style.display === 'block') {
        mobileMenu.style.display = 'none';
      }
      // run optional inline scripts from loaded html (if any)
      runInlineScripts(content);
    } catch (err) {
      content.innerHTML = `<div class="card"><h2>Đã có lỗi</h2><p class="muted">${err.message}</p></div>`;
      console.error(err);
    }
  }

  // Evaluate inline <script> tags inside injected HTML
  function runInlineScripts(container) {
    const scripts = container.querySelectorAll('script');
    scripts.forEach(s => {
      try {
        const code = s.textContent;
        if(code) (new Function(code))();
      } catch (e) {
        console.warn('Script error in injected page', e);
      }
    });
  }

  // Handle clicks on any element with data-link
  function onNavClick(e) {
    const link = e.currentTarget;
    const route = link.getAttribute('data-link');
    if(route) {
      e.preventDefault();
      loadPage(route, true);
    }
  }

  // attach nav listeners
  function attachNavHandlers() {
    document.querySelectorAll(linksSelector).forEach(a => {
      a.removeEventListener('click', onNavClick);
      a.addEventListener('click', onNavClick);
    });
  }

  // handle popstate (back/forward)
  window.addEventListener('popstate', (e) => {
    const route = (e.state && e.state.route) || (location.hash ? location.hash.replace('#','') : 'home');
    loadPage(route, false);
  });

  // mobile toggle
  mobileToggle && mobileToggle.addEventListener('click', () => {
    if(mobileMenu.style.display === 'block') mobileMenu.style.display = 'none';
    else mobileMenu.style.display = 'block';
  });

  // initial load: pick from hash or default home
  const initialRoute = location.hash ? location.hash.replace('#','') : 'home';
  loadPage(initialRoute, false).then(()=> {
    attachNavHandlers();
  });

  // re-attach handlers after each navigation (in case new links present)
  // observe changes to content to rebind any [data-link] inside loaded content
  const observer = new MutationObserver(() => attachNavHandlers());
  observer.observe(content, {childList:true, subtree:true});
})();


