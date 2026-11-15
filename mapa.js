(function () {
	var el = document.getElementById('mapa-ag');
	var fonte = document.getElementById('dados-ag');
	if (!el || !fonte || !window.L) return;
	var dados = JSON.parse(fonte.textContent);
	var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	var mapa = L.map(el, { scrollWheelZoom: false, zoomControl: true, attributionControl: true }).setView([41.41, -8.49], 12);
	L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
		maxZoom: 18,
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
	}).addTo(mapa);

	var marcas = {};
	var grupo = [];
	var lenco = function (n, ativo) {
		return L.divIcon({
			className: 'pin' + (ativo ? ' pin--ativo' : ''),
			html: '<span class="pin__lenco"></span><span class="pin__n">' + n.replace(/^0+/, '') + '</span>',
			iconSize: [44, 40], iconAnchor: [22, 38], popupAnchor: [0, -34]
		});
	};
	dados.forEach(function (d, i) {
		if (d.lat === null) return;
		var m = L.marker([d.lat, d.lng], { icon: lenco(d.n), title: d.l + ' (' + d.n + ')', riseOnHover: true });
		m.bindPopup('<strong>' + d.l + '</strong><br>Agrupamento ' + d.n + '<br>' + d.ca + '<br><a href="mailto:' + d.e + '">' + d.e + '</a>' + (d.apx ? '<br><em>Posição aproximada</em>' : ''));
		m.on('click', function () { realca(d.n, false); });
		marcas[d.n] = m;
		grupo.push([d.lat, d.lng]);
		if (!reduz) {
			m.addTo(mapa);
			var no = m.getElement();
			if (no) { no.style.animationDelay = (i * 25) + 'ms'; no.classList.add('pin--cai'); }
		} else {
			m.addTo(mapa);
		}
	});
	var ajusta = function () { mapa.invalidateSize(); if (grupo.length) mapa.fitBounds(grupo, { padding: [24, 24] }); };
	ajusta();
	window.addEventListener('load', ajusta);
	setTimeout(ajusta, 300);

	var atual = null;
	function realca(n, voar) {
		if (atual && marcas[atual]) marcas[atual].setIcon(lenco(atual));
		document.querySelectorAll('.emblema.ativo').forEach(function (e) { e.classList.remove('ativo'); });
		atual = n;
		var c = document.getElementById('ag-' + n);
		if (c) {
			c.classList.add('ativo');
			if (!voar) c.scrollIntoView({ behavior: reduz ? 'auto' : 'smooth', block: 'nearest' });
		}
		if (marcas[n]) {
			marcas[n].setIcon(lenco(n, true));
			if (voar) {
				mapa.flyTo(marcas[n].getLatLng(), 14, { duration: reduz ? 0 : .8 });
				marcas[n].openPopup();
			}
		}
	}

	document.querySelectorAll('[data-ver]').forEach(function (b) {
		b.addEventListener('click', function () {
			realca(b.getAttribute('data-ver'), true);
			if (window.innerWidth < 900) el.scrollIntoView({ behavior: reduz ? 'auto' : 'smooth', block: 'center' });
		});
	});

	// Esconder no mapa os que o filtro esconde
	var input = document.getElementById('filtro-ag');
	if (input) input.addEventListener('input', function () {
		setTimeout(function () {
			dados.forEach(function (d) {
				var c = document.getElementById('ag-' + d.n);
				var m = marcas[d.n];
				if (!m || !c) return;
				if (c.hidden) { mapa.removeLayer(m); } else if (!mapa.hasLayer(m)) { m.addTo(mapa); }
			});
		}, 0);
	});

	// O mais perto de mim
	var rad = function (x) { return x * Math.PI / 180; };
	var dist = function (a, b, c, d) {
		var R = 6371, dLat = rad(c - a), dLng = rad(d - b);
		var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(rad(a)) * Math.cos(rad(c)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
		return 2 * R * Math.asin(Math.sqrt(h));
	};
	var botao = document.getElementById('perto-de-mim');
	var conta = document.querySelector('[data-conta]');
	if (botao) botao.addEventListener('click', function () {
		if (!navigator.geolocation) { conta.textContent = 'Este browser não permite saber a localização. Procura pela tua freguesia.'; return; }
		botao.disabled = true;
		botao.textContent = 'A procurar…';
		navigator.geolocation.getCurrentPosition(function (p) {
			var la = p.coords.latitude, lo = p.coords.longitude;
			var lista = document.getElementById('lista-ag');
			var ordem = dados.filter(function (d) { return d.lat !== null; }).map(function (d) {
				return { d: d, km: dist(la, lo, d.lat, d.lng) };
			}).sort(function (x, y) { return x.km - y.km; });
			ordem.forEach(function (o) {
				var c = document.getElementById('ag-' + o.d.n);
				if (!c) return;
				c.querySelector('[data-dist]').textContent = ', a ' + (o.km < 10 ? o.km.toFixed(1).replace('.', ',') : Math.round(o.km)) + ' km';
				lista.appendChild(c);
			});
			L.circleMarker([la, lo], { radius: 8, color: '#0F2A1C', weight: 3, fillColor: '#FFC100', fillOpacity: 1 }).addTo(mapa).bindTooltip('Estás aqui');
			realca(ordem[0].d.n, true);
			conta.textContent = 'O mais perto é ' + ordem[0].d.l + '. A lista está ordenada pela distância.';
			botao.disabled = false;
			botao.textContent = 'Qual fica mais perto de mim?';
		}, function () {
			conta.textContent = 'Não foi possível saber a tua localização. Procura pela tua freguesia.';
			botao.disabled = false;
			botao.textContent = 'Qual fica mais perto de mim?';
		}, { enableHighAccuracy: false, timeout: 10000 });
	});

	// Vindo da página inicial com uma freguesia escolhida
	var m = location.hash.match(/^#q=(.+)$/);
	if (input && (input.value || m)) {
		var alvo = dados.filter(function (d) { return d.l === (input.value || decodeURIComponent(m[1])); })[0];
		if (alvo) setTimeout(function () { realca(alvo.n, true); }, 400);
	}
})();
