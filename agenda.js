(function () {
	var fonte = document.getElementById('dados-agenda');
	if (!fonte) return;
	var ev = JSON.parse(fonte.textContent);
	var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
	var pad = function (n) { return (n < 10 ? '0' : '') + n; };
	var ymd = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
	var data = function (s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
	var hoje = new Date(); hoje.setHours(0, 0, 0, 0);
	var hojeS = ymd(hoje);
	var esc = function (s) { var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; };
	var quando = function (e) {
		var a = data(e.i), b = data(e.f);
		if (e.i === e.f) return a.getDate() + ' de ' + MESES[a.getMonth()];
		if (a.getMonth() === b.getMonth()) return a.getDate() + ' a ' + b.getDate() + ' de ' + MESES[a.getMonth()];
		return a.getDate() + ' de ' + MESES[a.getMonth()] + ' a ' + b.getDate() + ' de ' + MESES[b.getMonth()];
	};

	// Próxima atividade, com contagem decrescente
	var prox = ev.filter(function (e) { return e.f >= hojeS; })[0];
	var caixa = document.getElementById('proxima');
	if (prox && caixa) {
		var dias = Math.round((data(prox.i) - hoje) / 864e5);
		var falta = dias <= 0 ? 'É hoje' : dias === 1 ? 'Falta 1 dia' : 'Faltam ' + dias + ' dias';
		caixa.innerHTML =
			'<p class="proxima__falta"><span class="proxima__n">' + (dias > 0 ? dias : '') + '</span><span>' + (dias > 0 ? (dias === 1 ? 'dia' : 'dias') : falta) + '</span></p>' +
			'<div class="proxima__texto"><p class="proxima__rot">' + falta + ' para a próxima atividade</p><h2 class="proxima__titulo">' + esc(prox.t) + '</h2>' +
			'<p>' + esc(quando(prox)) + (prox.h ? ', ' + esc(prox.h) : '') + (prox.l ? '. ' + esc(prox.l) : '') + '</p>' +
			'<p><button type="button" class="botao botao--amarelo" data-ics-de="' + prox.id + '">Adicionar ao meu calendário</button></p></div>';
		caixa.hidden = false;
		caixa.querySelector('[data-ics-de]').addEventListener('click', function () { window.nucleoICS && window.nucleoICS(prox); });
	}

	// Calendário mensal
	var cal = document.getElementById('calendario');
	if (!cal) return;
	cal.hidden = false;
	var corpo = cal.querySelector('[data-dias]');
	var titulo = cal.querySelector('[data-mes]');
	var lista = cal.querySelector('[data-lista-mes]');
	var vazio = cal.querySelector('[data-vazio-mes]');
	var ref = prox ? data(prox.i) : new Date(hoje);
	var ano = ref.getFullYear(), mes = ref.getMonth();
	var escolhido = null;

	function doDia(s) { return ev.filter(function (e) { return e.i <= s && e.f >= s; }); }

	function desenha() {
		titulo.textContent = MESES[mes].charAt(0).toUpperCase() + MESES[mes].slice(1) + ' de ' + ano;
		var primeiro = new Date(ano, mes, 1);
		var inicio = (primeiro.getDay() + 6) % 7;
		var nDias = new Date(ano, mes + 1, 0).getDate();
		var html = '<tr>';
		for (var i = 0; i < inicio; i++) html += '<td class="vazio-dia"></td>';
		for (var d = 1; d <= nDias; d++) {
			var s = ano + '-' + pad(mes + 1) + '-' + pad(d);
			var tem = doDia(s);
			var cls = (s === hojeS ? ' hoje' : '') + (tem.length ? ' tem' : '') + (s < hojeS ? ' passou' : '') + (s === escolhido ? ' escolhido' : '');
			var rot = d + ' de ' + MESES[mes] + (tem.length ? ': ' + tem.map(function (e) { return e.t; }).join(', ') : '');
			html += '<td class="dia' + cls + '">' + (tem.length
				? '<button type="button" data-dia="' + s + '" aria-label="' + esc(rot) + '"><span>' + d + '</span><i aria-hidden="true"></i></button>'
				: '<span aria-label="' + esc(rot) + '">' + d + '</span>') + '</td>';
			if ((inicio + d) % 7 === 0 && d < nDias) html += '</tr><tr>';
		}
		html += '</tr>';
		corpo.innerHTML = html;
		corpo.querySelectorAll('[data-dia]').forEach(function (b) {
			b.addEventListener('click', function () { escolhido = b.getAttribute('data-dia'); desenha(); });
		});
		var doMes = ev.filter(function (e) {
			var a = ano + '-' + pad(mes + 1) + '-01', z = ano + '-' + pad(mes + 1) + '-31';
			return e.i <= z && e.f >= a;
		});
		lista.innerHTML = doMes.map(function (e) {
			var on = escolhido && e.i <= escolhido && e.f >= escolhido;
			var a = data(e.i);
			return '<li class="evento-mini' + (on ? ' realce' : '') + (e.f < hojeS ? ' passou' : '') + '">' +
				'<span class="evento-mini__dia">' + a.getDate() + '</span>' +
				'<span><strong>' + esc(e.t) + '</strong><br>' + esc(quando(e)) + (e.l ? ', ' + esc(e.l) : '') + '</span></li>';
		}).join('');
		vazio.hidden = doMes.length > 0;
	}
	cal.querySelectorAll('[data-mover]').forEach(function (b) {
		b.addEventListener('click', function () {
			var m = +b.getAttribute('data-mover');
			if (m === 0) { ano = hoje.getFullYear(); mes = hoje.getMonth(); }
			else { mes += m; if (mes < 0) { mes = 11; ano--; } if (mes > 11) { mes = 0; ano++; } }
			escolhido = null;
			desenha();
		});
	});
	desenha();
})();
