/* Panelas: comportamento do site. Sem dependências além de GSAP, ScrollTrigger e Lenis locais. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const pt = document.body.dataset.lang === 'pt';
  const root = pt ? '../' : '';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const ease = t => t * t * (3 - 2 * t);
  const isDesk = () => innerWidth > 860;

  gsap.registerPlugin(ScrollTrigger);
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- cabeçalho e menu móvel */
  const hd = $('#hd');
  const dark = !!$('.lid, .st-hero, .c-hero, .v-hero');
  const onScroll = () => {
    const limit = $('.lid') ? innerHeight * 2.4 : innerHeight * .7;
    hd.classList.toggle('solid', !dark || scrollY > limit);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const bb = $('.burger-btn'), mnav = $('#mnav');
  bb.addEventListener('click', () => {
    const open = bb.getAttribute('aria-expanded') !== 'true';
    bb.setAttribute('aria-expanded', open);
    bb.setAttribute('aria-label', open ? (pt ? 'Fechar menu' : 'Close menu') : (pt ? 'Abrir menu' : 'Open menu'));
    mnav.hidden = !open;
    hd.classList.toggle('menu-open', open);
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (lenis) open ? lenis.stop() : lenis.start();
  });

  /* ---------- status ao vivo em Los Angeles */
  const laNow = () => {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', weekday: 'short', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false });
    const o = Object.fromEntries(f.formatToParts(new Date()).map(x => [x.type, x.value]));
    const h = +o.hour % 24;
    return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday), h, m: +o.minute, s: +o.second, mins: h * 60 + +o.minute };
  };
  const refresh = () => {
    const n = laNow();
    const open = n.mins >= 660 && n.mins < 1140;
    const hh = open && n.day >= 1 && n.day <= 5 && n.mins >= 900;
    const left = 1140 - n.mins;
    const short = open
      ? (pt ? 'Fogão aceso até 19h' : 'Stove on until 7 PM')
      : (pt ? `Fogão apagado, abre ${n.mins < 660 ? 'às 11h' : 'amanhã às 11h'}` : `Stove off, opens ${n.mins < 660 ? 'at 11 AM' : 'tomorrow 11 AM'}`);
    const long = open
      ? (left <= 60 ? (pt ? `Aberto agora: fecha em ${left} min` : `Open now: closes in ${left} min`) : (pt ? 'Aberto agora, até as 19h' : 'Open now, until 7 PM'))
      : (pt ? `Fechado agora. Abre ${n.mins < 660 ? 'hoje' : 'amanhã'} às 11h` : `Closed now. Opens ${n.mins < 660 ? 'today' : 'tomorrow'} at 11 AM`);
    const st = $('[data-status]');
    st.classList.toggle('on', open);
    $('[data-status-text]').textContent = short;
    $$('[data-status-long]').forEach(e => { e.textContent = long; });
    $$('tr[data-day]').forEach(tr => tr.classList.toggle('today', +tr.dataset.day === n.day));
    const live = $('[data-hh-live]');
    if (live) {
      live.classList.toggle('on', hh);
      live.textContent = hh ? (pt ? 'Happy Hour agora' : 'Happy Hour right now') : (pt ? 'De segunda a sexta' : 'Monday to Friday');
    }
    const hH = $('#hc-h'), hM = $('#hc-m');
    if (hH) {
      hH.style.transform = `rotate(${(n.h % 12) * 30 + n.m / 2}deg)`;
      hM.style.transform = `rotate(${n.m * 6}deg)`;
    }
  };
  refresh(); setInterval(refresh, 30000);

  /* ---------- vídeo e mapa sob demanda */
  const io = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) {
      $$('source[data-src]', v).forEach(s => { s.src = s.dataset.src; s.removeAttribute('data-src'); v.load(); });
      if (!reduce) v.play().catch(() => {});
    } else if (!v.paused) v.pause();
  }), { rootMargin: '200px' });
  $$('video[data-lazy]').forEach(v => io.observe(v));
  $$('.c-hero video, .v-hero video').forEach(v => { if (reduce) { v.removeAttribute('autoplay'); v.pause(); } });
  const mapIo = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.src = e.target.dataset.map; mapIo.unobserve(e.target); }
  }), { rootMargin: '400px' });
  $$('iframe[data-map]').forEach(f => mapIo.observe(f));

  /* ---------- HERO: tire a tampa */
  const stage = $('[data-lid]');
  if (stage) {
    const pot = $('.pot', stage), lid = $('.lidtop', stage), man = $('.lid-man', stage), copy = $('.lid-copy', stage),
      hint = $('.lid-hint', stage), shade = $('.lid-shade', stage), pls = $$('.pl', stage), fire = $('.v-fire', stage),
      grill = $('.v-grill', stage), canvas = $('.steam', stage), ctx = canvas.getContext('2d');
    let G = {}, prog = 0, target = 0;

    const measure = () => {
      const W = stage.clientWidth, H = stage.clientHeight, desk = W > 860;
      const size = desk ? Math.min(H * .86, W * .52) : Math.min(W * 1.02, H * .52);
      const cx0 = desk ? W * .655 : W * .5;
      const cy0 = desk ? H * .53 : H * .71;
      stage.style.setProperty('--pot', size + 'px');
      G = { W, H, desk, size, cx0, cy0, r0: size * .31, diag: Math.hypot(W, H) * .62 };
      stage.style.setProperty('--r0', G.r0 + 'px');
      canvas.width = W; canvas.height = H;
    };
    const dirs = [[.2, -1], [1, -.6], [1, .7], [-.1, 1]], dirsM = [[1.2, 0], [-1.2, 0], [1.2, .2], [-1.2, .2]];
    const render = p => {
      const { W, H, size, cx0, cy0, r0, diag, desk } = G;
      const a = ease(seg(p, 0, .34));           // tampa sobe e sai
      const b = ease(seg(p, .26, .6));          // panela vai ao centro
      const c = ease(seg(p, .46, .86));         // abertura toma a tela
      const cx = cx0 + (W / 2 - cx0) * b, cy = cy0 + (H / 2 - cy0) * b;
      const r = r0 + (diag - r0) * c * c;
      stage.style.setProperty('--cx', cx + 'px');
      stage.style.setProperty('--cy', cy + 'px');
      stage.style.setProperty('--r', r + 'px');
      stage.style.setProperty('--fire', 1 - seg(c, desk ? .12 : 2, desk ? .34 : 3));
      const s = r / r0;
      pot.style.transform = `translate(${cx - size / 2}px, ${cy - size / 2}px) scale(${s})`;
      pot.style.opacity = 1 - seg(s, 2.6, 3.8);
      const lift = Math.sin(Math.min(a * 1.3, 1) * Math.PI / 2);
      lid.style.transform = `translate(${cx0 - size / 2 + a * W * (desk ? .62 : .5)}px, ${cy0 - size / 2 - a * H * .86}px) rotate(${a * 62}deg) scale(${1 + lift * .2})`;
      lid.style.filter = `drop-shadow(0 ${20 + lift * 44}px ${20 + lift * 34}px rgba(44,12,6,.45))`;
      lid.style.opacity = 1 - seg(a, .9, 1);
      pls.forEach((el, i) => {
        const d = (desk ? dirs : dirsM)[i], k = ease(seg(p, .04, .3));
        el.style.transform = `translate(${d[0] * k * W * .5}px, ${d[1] * k * H * .7}px) rotate(${(i % 2 ? 1 : -1) * (6 + k * 18)}deg)`;
      });
      copy.style.opacity = 1 - seg(p, .05, .22);
      copy.style.transform = `translateY(${desk ? -46 : 0}%) translateY(${-p * 160}px)`;
      copy.style.pointerEvents = p > .2 ? 'none' : '';
      hint.style.opacity = 1 - seg(p, 0, .08);
      stage.style.setProperty('--shade', .5 * seg(p, .78, .95));
      shade.style.background = `rgba(30,10,6,${.56 * seg(p, .76, .95)})`;
      man.style.opacity = seg(p, .82, .95);
      man.style.transform = `translateY(${(1 - seg(p, .82, .95)) * 34}px)`;
    };

    /* vapor */
    const sprite = document.createElement('canvas'); sprite.width = sprite.height = 160;
    const sc = sprite.getContext('2d'), gr = sc.createRadialGradient(80, 80, 0, 80, 80, 80);
    gr.addColorStop(0, 'rgba(255,240,222,.2)'); gr.addColorStop(.5, 'rgba(255,240,222,.07)'); gr.addColorStop(1, 'rgba(255,246,232,0)');
    sc.fillStyle = gr; sc.fillRect(0, 0, 160, 160);
    const puffs = Array.from({ length: 12 }, () => ({ life: Math.random() }));
    const spawn = q => {
      const t = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * G.r0 * .9;
      q.x = rr * Math.cos(t); q.y = rr * Math.sin(t) * .8; q.life = 0;
      q.v = .0035 + Math.random() * .004; q.sz = (.5 + Math.random() * .8) * G.r0; q.dx = (Math.random() - .5) * 26; q.rot = Math.random() * 6;
    };
    puffs.forEach(q => { const l = q.life; spawn(q); q.life = l; });
    const drawSteam = p => {
      const amt = (.3 + .4 * ease(seg(p, .06, .22))) * (1 - seg(p, .24, .42));
      ctx.clearRect(0, 0, G.W, G.H);
      if (amt <= .01) return;
      const b = ease(seg(p, .26, .6));
      const cx = G.cx0 + (G.W / 2 - G.cx0) * b, cy = G.cy0 + (G.H / 2 - G.cy0) * b;
      for (const q of puffs) {
        q.life += q.v;
        if (q.life >= 1) spawn(q);
        const l = q.life, al = Math.sin(l * Math.PI) * amt;
        const s = q.sz * (1 + l * 1.5);
        ctx.globalAlpha = al;
        ctx.drawImage(sprite, cx + q.x + q.dx * l - s, cy + q.y - l * G.r0 * 2 - s, s * 2, s * 2);
      }
      ctx.globalAlpha = 1;
    };

    measure(); render(0);
    if (reduce) {
      render(0); canvas.remove(); fire.pause();
    } else {
      if (isDesk()) {
        const s = $('source[data-src]', grill);
        if (s) { s.src = s.dataset.src; s.removeAttribute('data-src'); grill.load(); grill.play().catch(() => {}); }
      }
      const pinTrig = ScrollTrigger.create({
        trigger: '#lid', pin: true, start: 'top top', end: () => '+=' + innerHeight * 2.2, anticipatePin: 1,
        onUpdate: s => { target = s.progress; },
      });
      let visible = true;
      new IntersectionObserver(e => {
        visible = e[0].isIntersecting;
        [fire, grill].forEach(v => { if (!v.src && !v.currentSrc) return; visible ? v.play().catch(() => {}) : v.pause(); });
      }).observe(stage);
      gsap.ticker.add(() => {
        if (!visible) return;
        prog += (target - prog) * .14;
        if (Math.abs(target - prog) < .0004) prog = target;
        render(prog); drawSteam(prog);
      });
      addEventListener('resize', () => { measure(); render(prog); });
      window.__lidTrig = pinTrig;
    }
  }

  /* ---------- fogão */
  $$('[data-stove]').forEach(stove => {
    const mode = stove.dataset.stove;
    const burners = $$('.burner', stove), knobs = $$('.knob', stove);
    const read = mode === 'home' ? $('.stove-read') : null;
    const select = id => {
      burners.forEach(b => { const on = b.dataset.cat === id; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      knobs.forEach(k => k.classList.toggle('on', k.dataset.cat === id));
      if (read) $$('.sr', read).forEach(a => { a.hidden = a.dataset.for !== id; });
    };
    stove._select = select;
    const go = id => {
      select(id);
      if (mode === 'menu') {
        const t = document.getElementById(id);
        history.replaceState(null, '', '#' + id);
        if (lenis) { lenis.resize(); lenis.scrollTo(t); } else t.scrollIntoView();
      }
    };
    if (mode === 'home' && !reduce) ScrollTrigger.create({ trigger: stove, start: 'top 70%', once: true, onEnter: () => {
      burners.forEach((b, i) => { setTimeout(() => b.classList.add('peek'), i * 130); setTimeout(() => b.classList.remove('peek'), i * 130 + 420); });
    } });
    burners.forEach(b => b.addEventListener('click', () => go(b.dataset.cat)));
    knobs.forEach(k => k.addEventListener('click', () => go(k.dataset.cat)));
    select(mode === 'home' ? 'plates' : (location.hash.slice(1) || 'appetizers'));
  });

  /* ---------- cardápio: scrollspy, busca, happy hour */
  const cats = $$('.m-cat');
  if (cats.length) {
    const stove = $('[data-stove=menu]'), strip = $('.m-strip');
    const spy = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const id = e.target.dataset.cat;
      stove._select(id);
      $$('a', strip).forEach(a => {
        const on = a.dataset.cat === id;
        a.classList.toggle('on', on);
        if (on) strip.scrollTo({ left: a.offsetLeft - 60, behavior: 'smooth' });
      });
    }), { rootMargin: '-30% 0px -60% 0px' });
    cats.forEach(c => spy.observe(c));
    const showStrip = () => strip.classList.toggle('show', scrollY > $('.m-wrap').offsetTop - 80);
    addEventListener('scroll', showStrip, { passive: true }); showStrip();
    $$('a', strip).forEach(a => a.addEventListener('click', ev => {
      ev.preventDefault();
      const t = document.getElementById(a.dataset.cat);
      if (lenis) { lenis.resize(); lenis.scrollTo(t); } else t.scrollIntoView();
    }));
    const q = $('#m-q'), hhBtn = $('#m-hh'), nEl = $('#m-n'), empty = $('#m-empty');
    const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const items = $$('.dish, .line', $('.m-main'));
    items.forEach(i => { i._s = norm(i.dataset.s || ''); });
    const filter = () => {
      const t = norm(q.value.trim()), hh = hhBtn.getAttribute('aria-pressed') === 'true';
      let n = 0;
      items.forEach(i => { const ok = (!t || i._s.includes(t)) && (!hh || i.dataset.hh); i.hidden = !ok; if (ok) n++; });
      cats.forEach(c => { c.hidden = !$$('.dish, .line', c).some(i => !i.hidden); });
      nEl.textContent = n; empty.hidden = n > 0;
      if (lenis) lenis.resize();
      ScrollTrigger.refresh();
    };
    q.addEventListener('input', filter);
    hhBtn.addEventListener('click', () => { hhBtn.setAttribute('aria-pressed', hhBtn.getAttribute('aria-pressed') !== 'true'); filter(); });
    if (location.hash) setTimeout(() => { const t = $(location.hash); if (t && lenis) lenis.scrollTo(t, { offset: -140, immediate: true }); }, 120);
  }

  /* ---------- ficha do prato */
  const sheet = $('#sheet');
  const openDish = el => {
    const d = el.dataset;
    $('#sheet-name').textContent = d.name; $('#sheet-sub').textContent = d.sub && d.sub !== d.desc ? d.sub : '';
    $('#sheet-desc').textContent = d.desc || (d.sub || '');
    $('#sheet-price').textContent = d.price || (pt ? 'Preço na Toast' : 'Price on Toast');
    $('#sheet-hh').textContent = d.hh ? `Happy Hour ${d.hh}` : '';
    $('#sheet-order').href = d.toast;
    const m = $('#sheet-media'); m.className = 'sheet-media ' + (d.kind || 'none');
    m.innerHTML = d.img ? `<img src="${root}img/${d.img}.webp" alt="${d.name.replace(/"/g, '&quot;')}">` : '';
    if (lenis) lenis.stop();
    sheet.showModal();
  };
  document.addEventListener('click', e => { const b = e.target.closest('[data-dish]'); if (b) openDish(b); });
  sheet.addEventListener('click', e => { if (e.target === sheet || e.target.closest('[data-close]')) sheet.close(); });
  sheet.addEventListener('close', () => { if (lenis) lenis.start(); });

  /* ---------- anatomia do prato */
  const anat = $('#anatomy');
  if (anat) {
    const pins = $$('.pin', anat), lis = $$('.anat-list li', anat);
    const show = n => { pins.forEach((e, i) => e.classList.toggle('on', i < n)); lis.forEach((e, i) => e.classList.toggle('on', i < n)); };
    const wrapD = $('.anat-disc', anat);
    if (reduce) show(8);
    else if (isDesk() && innerHeight > 620) {
      ScrollTrigger.create({
        trigger: anat, pin: true, start: 'top top', end: () => '+=' + innerHeight * 1.5,
        onUpdate: s => { show(Math.ceil(s.progress * 9)); wrapD.style.setProperty('--rot', ((s.progress - .5) * 14).toFixed(2) + 'deg'); },
      });
    } else {
      ScrollTrigger.create({ trigger: '.anat-disc', start: 'top 70%', end: 'bottom 35%', onUpdate: s => show(Math.ceil(s.progress * 9)), onLeave: () => show(8) });
    }
  }

  /* ---------- estufa: brilho do vidro */
  const glass = $('[data-case]');
  if (glass && !reduce) glass.addEventListener('pointermove', e => {
    const r = glass.getBoundingClientRect();
    glass.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
  });

  /* ---------- claquete */
  $$('[data-slate]').forEach(s => {
    if (reduce) { s.classList.add('clap'); return; }
    ScrollTrigger.create({ trigger: s, start: 'top 72%', onEnter: () => s.classList.add('clap'), onLeaveBack: () => s.classList.remove('clap') });
  });

  /* ---------- paralaxe e revelações */
  if (!reduce) {
    $$('[data-par] img').forEach(i => gsap.fromTo(i, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: i.closest('section'), scrub: true } }));
    const rv = $$('.sec-head, .sr-wrap, .vit-head, .chef-copy, .press-it, .cat-t-copy, .find-copy, .cs-list li, .c-two article, .st-warm article, .m-frozen, .v-act, .v-hours');
    rv.forEach(e => { e.setAttribute('data-rv', ''); ScrollTrigger.create({ trigger: e, start: 'top 90%', once: true, onEnter: () => e.classList.add('in') }); });
    const hero = $('.st-bg');
    if (hero) gsap.to(hero, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.st-hero', start: 'top top', scrub: true } });
  }

  /* ---------- reels oficiais do Instagram, carregados ao clicar */
  $$('[data-reel]').forEach(b => b.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = `https://www.instagram.com/reel/${b.dataset.reel}/embed`;
    f.title = 'Instagram'; f.allow = 'autoplay; encrypted-media'; f.loading = 'lazy';
    b.replaceChildren(f);
  }, { once: true }));

  /* ---------- catering: monte a mesa */
  const cat = $('[data-catering]');
  if (cat) {
    const plates = ['bbq', 'feijoada', 'strogonoff', 'carne', 'parmigiana', 'churrasquinho', 'brazilian', 'fitness', 'vegetarian', 'milanesa', 'kids'];
    const box = $('#lt-items'), nEl = $('#ct-n'), gEl = $('#ct-g'), st = $('#ct-status');
    let guests = 20, where = $('.seg .on', cat).dataset.where;
    const emptyEl = $('.lt-empty', box);
    const picks = $$('.pick', cat);
    const sel = () => picks.filter(p => p.getAttribute('aria-pressed') === 'true');
    const draw = () => {
      const n = sel().length;
      nEl.textContent = n; emptyEl.hidden = n > 0;
      $$('img', box).forEach(i => i.remove());
      sel().forEach((p, i) => {
        const im = new Image(); im.alt = ''; im.src = `${root}img/plate-${plates[i % plates.length]}.webp`;
        box.append(im);
      });
    };
    picks.forEach(p => p.addEventListener('click', () => { p.setAttribute('aria-pressed', p.getAttribute('aria-pressed') !== 'true'); draw(); st.textContent = ''; }));
    $$('[data-step]', cat).forEach(b => b.addEventListener('click', () => { guests = clamp(guests + +b.dataset.step, 5, 500); gEl.textContent = guests; }));
    $$('.seg button', cat).forEach(b => b.addEventListener('click', () => { $$('.seg button', cat).forEach(x => x.classList.toggle('on', x === b)); where = b.dataset.where; }));
    $('#ct-copy').addEventListener('click', async () => {
      const list = sel().map(p => '- ' + p.dataset.item).join('\n') || (pt ? '(ainda sem pratos)' : '(no dishes yet)');
      const date = $('#ct-date').value, type = $('#ct-type').value.trim();
      const text = (pt
        ? `Olá, Panelas! Gostaria de um orçamento de catering.\nConvidados: ${guests}\nData: ${date || 'a definir'}\nEvento: ${type || 'a definir'}\nLocal: ${where}\nPratos:\n${list}`
        : `Hi Panelas! I'd like a catering quote.\nGuests: ${guests}\nDate: ${date || 'TBD'}\nEvent: ${type || 'TBD'}\nWhere: ${where}\nDishes:\n${list}`);
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch {
        const ta = document.createElement('textarea'); ta.value = text; document.body.append(ta); ta.select();
        try { ok = document.execCommand('copy'); } catch {} ta.remove();
      }
      st.dataset.copied = text;
      st.textContent = ok ? (pt ? 'Lista copiada. Cole no formulário, no Direct ou leia por telefone.' : 'List copied. Paste it into the form or a DM, or read it over the phone.') : (pt ? 'Não foi possível copiar automaticamente.' : 'Could not copy automatically.');
    });
  }

  addEventListener('load', () => ScrollTrigger.refresh());
})();
