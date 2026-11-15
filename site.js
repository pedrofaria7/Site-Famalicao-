(function () {
	// Menu em ecrãs pequenos
	var botao = document.querySelector('.topo__abrir');
	var nav = document.getElementById('navegacao');
	if (botao && nav) {
		botao.addEventListener('click', function () {
			var aberto = botao.getAttribute('aria-expanded') === 'true';
			botao.setAttribute('aria-expanded', String(!aberto));
			document.body.classList.toggle('menu-aberto', !aberto);
		});
	}

	// Submenus: botão próprio para teclado e toque
	document.querySelectorAll('.nav__lista > .menu-item-has-children').forEach(function (li, i) {
		var link = li.querySelector(':scope > a');
		var sub = li.querySelector(':scope > .sub-menu');
		if (!link || !sub) return;
		sub.id = 'sub-' + i;
		var b = document.createElement('button');
		b.className = 'nav__sub-botao';
		b.setAttribute('aria-expanded', 'false');
		b.setAttribute('aria-controls', sub.id);
		b.innerHTML = '<span class="visualmente-oculto">Abrir ' + link.textContent + '</span>';
		link.after(b);
		var alterna = function (e) {
			e.preventDefault();
			var aberto = li.classList.toggle('aberto');
			b.setAttribute('aria-expanded', String(aberto));
		};
		b.addEventListener('click', alterna);
		if (link.getAttribute('href') === '#') link.addEventListener('click', alterna);
	});
	document.addEventListener('click', function (e) {
		document.querySelectorAll('.nav__lista > li.aberto').forEach(function (li) {
			if (!li.contains(e.target)) {
				li.classList.remove('aberto');
				var b = li.querySelector('.nav__sub-botao');
				if (b) b.setAttribute('aria-expanded', 'false');
			}
		});
	});
	document.addEventListener('keydown', function (e) {
		if (e.key !== 'Escape') return;
		document.querySelectorAll('.nav__lista > li.aberto').forEach(function (li) { li.classList.remove('aberto'); });
	});

	// Filtros de listas (agrupamentos, circulares)
	var tira = function (s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
	document.querySelectorAll('[data-filtro]').forEach(function (input) {
		var alvo = document.querySelector(input.getAttribute('data-filtro'));
		var conta = input.parentNode.querySelector('[data-conta]');
		var vazio = alvo.parentNode.querySelector('[data-vazio]');
		var itens = alvo.querySelectorAll('[data-procura]');
		var aplica = function () {
			var q = tira(input.value.trim());
			var n = 0;
			itens.forEach(function (it) {
				var ok = !q || it.getAttribute('data-procura').indexOf(q) !== -1;
				it.hidden = !ok;
				if (ok) n++;
			});
			alvo.querySelectorAll('section').forEach(function (s) {
				s.hidden = !s.querySelector('[data-procura]:not([hidden])');
			});
			if (conta) conta.textContent = q ? n + (n === 1 ? ' resultado' : ' resultados') : '';
			if (vazio) vazio.hidden = n !== 0;
		};
		input.addEventListener('input', aplica);
		aplica();
		if (input.value && itens.length) {
			var primeiro = alvo.querySelector('[data-procura]:not([hidden])');
			if (primeiro) primeiro.classList.add('realce');
		}
	});
})();

/* ---------- v3: interações ---------- */
(function () {
	var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var pad = function (n) { return (n < 10 ? '0' : '') + n; };

	// Adicionar ao calendário (.ics)
	window.nucleoICS = function (e) {
		var d = function (s, mais) { var p = s.split('-'); var x = new Date(+p[0], +p[1] - 1, +p[2] + (mais || 0)); return x.getFullYear() + pad(x.getMonth() + 1) + pad(x.getDate()); };
		var limpa = function (s) { return (s || '').replace(/[,;\\]/g, function (c) { return '\\' + c; }).replace(/\n/g, '\\n'); };
		var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Nucleo de Famalicao//Agenda//PT', 'BEGIN:VEVENT',
			'UID:' + d(e.i) + '-' + Math.random().toString(36).slice(2) + '@famalicao.escutismo.pt',
			'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
			'DTSTART;VALUE=DATE:' + d(e.i), 'DTEND;VALUE=DATE:' + d(e.f || e.i, 1),
			'SUMMARY:' + limpa(e.t), 'LOCATION:' + limpa(e.l),
			'DESCRIPTION:' + limpa((e.h ? e.h + '. ' : '') + (e.r || '')), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
		var a = document.createElement('a');
		a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
		a.download = (e.t || 'atividade').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-') + '.ics';
		document.body.appendChild(a); a.click(); a.remove();
	};
	document.querySelectorAll('.evento[data-ev]').forEach(function (li) {
		var b = li.querySelector('.evento__ics');
		if (!b) return;
		b.hidden = false;
		b.addEventListener('click', function () { window.nucleoICS(JSON.parse(li.getAttribute('data-ev'))); });
	});

	// Trilho que se desenha ao aparecer
	var trilhos = document.querySelectorAll('.pista__mascara');
	trilhos.forEach(function (p) {
		var L = p.getTotalLength();
		p.style.strokeDasharray = L;
		p.style.strokeDashoffset = reduz ? 0 : L;
	});
	// Números que contam
	var conta = function (el) {
		var alvo = +el.getAttribute('data-conta-ate'), t0 = null, dur = 1400;
		var fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
		var passo = function (t) {
			if (!t0) t0 = t;
			var k = Math.min(1, (t - t0) / dur);
			el.textContent = fmt(Math.round(alvo * (1 - Math.pow(1 - k, 3))));
			if (k < 1) requestAnimationFrame(passo);
		};
		requestAnimationFrame(passo);
	};
	if ('IntersectionObserver' in window && !reduz) {
		var io = new IntersectionObserver(function (ents) {
			ents.forEach(function (en) {
				if (!en.isIntersecting) return;
				var el = en.target;
				if (el.classList.contains('pista__mascara')) { el.style.transition = 'stroke-dashoffset 1.8s ease-in-out'; el.style.strokeDashoffset = 0; }
				if (el.hasAttribute('data-conta-ate')) conta(el);
				io.unobserve(el);
			});
		}, { threshold: .3 });
		trilhos.forEach(function (p) { io.observe(p); });
		document.querySelectorAll('[data-conta-ate]').forEach(function (n) { n.textContent = '0'; io.observe(n); });
	}

	// Polaroids arrastáveis no mural
	if (window.matchMedia('(pointer: fine)').matches) {
		var z = 5;
		document.querySelectorAll('.mural .polaroid').forEach(function (p) {
			var x = 0, y = 0, sx, sy, ativo = false;
			p.addEventListener('pointerdown', function (e) {
				ativo = true; sx = e.clientX - x; sy = e.clientY - y;
				p.setPointerCapture(e.pointerId); p.classList.add('a-arrastar'); p.style.zIndex = ++z;
				e.preventDefault();
			});
			p.addEventListener('pointermove', function (e) {
				if (!ativo) return;
				x = e.clientX - sx; y = e.clientY - sy;
				p.style.setProperty('--dx', x + 'px'); p.style.setProperty('--dy', y + 'px');
			});
			var fim = function () { ativo = false; p.classList.remove('a-arrastar'); };
			p.addEventListener('pointerup', fim); p.addEventListener('pointercancel', fim);
		});
	} else {
		var dica = document.querySelector('.mural__dica'); if (dica) dica.hidden = true;
	}
})();

/* Títulos grandes nunca partem palavras: encolhem até caberem */
(function () {
	var titulos = document.querySelectorAll('.sec-cab__titulo, .cab__titulo, .hero__titulo, .artigo__titulo, .faixa-foto blockquote p');
	if (!titulos.length) return;
	var ajusta = function () {
		titulos.forEach(function (el) {
			el.style.fontSize = '';
			var tam = parseFloat(getComputedStyle(el).fontSize), min = 28, n = 0;
			// mede a palavra mais comprida contra a largura disponível
			var cabe = function () {
				var w = el.clientWidth, maior = 0;
				var r = document.createRange();
				var palavras = el.textContent.trim().split(/\s+/);
				var sonda = document.createElement('span');
				sonda.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font:inherit;letter-spacing:inherit;font-stretch:inherit';
				el.appendChild(sonda);
				palavras.forEach(function (p) { sonda.textContent = p; maior = Math.max(maior, sonda.getBoundingClientRect().width); });
				sonda.remove();
				return maior <= w + 1;
			};
			while (!cabe() && tam > min && n++ < 40) { tam *= 0.95; el.style.fontSize = tam + 'px'; }
		});
	};
	ajusta();
	if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajusta);
	var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(ajusta, 120); });
})();
