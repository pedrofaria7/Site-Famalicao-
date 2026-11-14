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
