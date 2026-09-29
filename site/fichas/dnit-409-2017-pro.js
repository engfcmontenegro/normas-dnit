/*
 * Ficha: DNIT 409/2017-PRO — Medida da retrorrefletividade com equipamento dinâmico.
 * Registra-se no motor de site/fichas.js (window.FE).
 * Aferição (seção 6): 10 medições no segmento-teste de 1 km, variação ≤ 20 %. Tratamento dos dados (seção 8): médias
 * RL̄ a cada 100 m por faixa/linha; por trecho de 10 km, excluem-se o maior e o menor RL̄ e calculam-se a média x̄ e o
 * desvio-padrão s; aceito se x̄ − s ≥ valor mínimo admitido (BR-Legal, informado) e s ≤ 20 % (tomado em relação à
 * média). Verifica velocidade (60–100 km/h), espaçamento das leituras (20–50 cm) e o prazo da leitura inicial (≤ 15 dias).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  function desvio(v) { var m = media(v); return v.length > 1 ? Math.sqrt(v.reduce(function (a, x) { return a + (x - m) * (x - m); }, 0) / (v.length - 1)) : NaN; }
  function dias(a, b) { var x = Date.parse(a), y = Date.parse(b); return isFinite(x) && isFinite(y) ? (y - x) / 86400000 : NaN; }

  FE.FICHAS["dnit-409-2017-pro"] = {
    titulo: "Retrorrefletividade com equipamento dinâmico",
    rotuloImportar: function (r) { var t = (r.trechos || [])[0]; return t ? "x̄ − s " + fmt(t.xs, 0) + " mcd/(lx·m²) · " + (t.aceito === true ? "aceito" : t.aceito === false ? "não aceito" : "—") : ""; },
    resumo: "Aferição com 10 medições (variação ≤ 20 %), médias RL̄ a cada 100 m e avaliação por trecho de 10 km: exclusão do maior e do menor RL̄, x̄ e s, aceitação se x̄ − s ≥ mínimo admitido e s ≤ 20 % (seção 8).",
    blocos: [],
    params: [
      { k: "equip", r: "Equipamento — identificação" },
      { k: "geom", r: "Geometria (Tabela 1)", tipo: "select", opcoes: [["30", "30 m — incidência 88,76°, observação 1,05°"], ["15", "15 m — incidência 86,5°, observação 1,5°"]],
        dica: "não comparar medidas de geometrias diferentes" },
      { k: "tipo", r: "Avaliação", tipo: "select", opcoes: [["inicial", "Retrorrefletividade inicial (até 15 dias da aplicação, 3.12)"], ["residual", "Retrorrefletividade residual (3.13)"]] },
      { k: "linha", r: "Linha avaliada (continuidade, cor, localização)", ph: "ex.: bordo direito contínuo, branca" },
      { k: "sentido", r: "Sentido / faixa de tráfego", ph: "crescente, faixa 1" },
      { k: "dtaplic", r: "Data da aplicação da demarcação", tipo: "date" },
      { k: "dtmed", r: "Data da medição", tipo: "date" },
      { k: "kmi", r: "km inicial do trecho", ph: "0,0" },
      { k: "vel", r: "Velocidade média do veículo (km/h)", ph: "70", dica: "7 b: entre 60 e 100 km/h, preferencialmente constante" },
      { k: "esp", r: "Distância entre pontos de leitura (cm)", ph: "30", dica: "7 c: entre 20 e 50 cm" },
      { k: "minimo", r: "Valor mínimo admitido — BR-Legal (mcd/lx/m²)", dica: "Instrução de Serviço nº 04/2016 (BR-Legal), conforme cor, material e fase — não transcrito na norma" },
      { k: "calib", r: "Data da última calibração (≤ 12 meses recomendado, seção 5)", tipo: "date" },
      { k: "cond", r: "Condições (temperatura, umidade, limpeza da superfície — 9 h, 9 i)" },
    ],
    padrao: { geom: "30", tipo: "inicial" },
    tabelas: function () {
      return [
        { chave: "af", titulo: "Aferição — 10 medições no segmento-teste de 1 km (seção 6)", rotulo: "Medição", iniciais: 10, min: 1, fixo: false,
          dica: "RL médio de cada passada (leituras interpoladas a cada 100 m)",
          linhas: [{ k: "rl", r: "RL médio da passada", u: "mcd/(lx·m²)" }] },
        { chave: "seg", titulo: "Diagrama linear — média das leituras a cada 100 m (RL̄)", rotulo: "100 m", iniciais: 10, min: 1,
          dica: "uma coluna por segmento de 100 m, na ordem da quilometragem; a cada 100 colunas forma-se um trecho de 10 km",
          linhas: [{ k: "rl", r: "RL̄ — média das leituras no segmento", u: "mcd/(lx·m²)" }, { k: "ev", r: "Evento / observação", texto: true }] },
      ];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], r = {};
      var v = num(P.vel), esp = num(P.esp);
      if (ok(v) && (v < 60 || v > 100)) avisos.push("Velocidade de " + fmt(v, 0) + " km/h fora de 60 a 100 km/h (7 b).");
      if (ok(esp) && (esp < 20 || esp > 50)) avisos.push("Distância entre leituras de " + fmt(esp, 0) + " cm fora de 20 a 50 cm (7 c).");
      var dd = dias(P.dtaplic, P.dtmed);
      if (P.tipo === "inicial" && ok(dd) && dd > 15) avisos.push("Medição " + fmt(dd, 0) + " dias após a aplicação: a retrorrefletividade inicial é avaliada até 15 dias (3.12).");
      var dc = dias(P.calib, P.dtmed);
      if (ok(dc) && dc > 366) avisos.push("Calibração com mais de 12 meses (seção 5).");
      // aferição
      var af = (d.af || []).map(function (x) { return num(x.rl); }).filter(ok);
      if (af.length) {
        var ma = media(af);
        r.afMedia = ma; r.afVar = Math.max.apply(null, af.map(function (x) { return Math.abs(x - ma) / ma * 100; }));
        r.afAmp = (Math.max.apply(null, af) - Math.min.apply(null, af)) / ma * 100;
        r.afOk = r.afVar <= 20;
        if (af.length < 10) avisos.push("Aferição com " + af.length + " medições: são exigidas 10 (seção 6).");
        if (!r.afOk) avisos.push("Aferição: variação de " + fmt(r.afVar, 1) + " % em relação à média (máximo 20 %, seção 6) — equipamento não aferido.");
      } else avisos.push("Registre a aferição (10 medições no segmento-teste de 1 km) antes do serviço (seção 6).");
      // trechos de 10 km
      var segs = (d.seg || []).map(function (x) { return num(x.rl); }), kmi = num(P.kmi) || 0, min = num(P.minimo);
      r.trechos = [];
      for (var i = 0; i < segs.length; i += 100) {
        var vals = segs.slice(i, i + 100).filter(ok), t = { kmi: kmi + i / 10, kmf: kmi + Math.min(segs.length, i + 100) / 10, n: vals.length };
        if (vals.length >= 3) {
          var ord = vals.slice().sort(function (a, b) { return a - b; });
          t.max = ord[ord.length - 1]; t.min = ord[0];
          var usados = ord.slice(1, -1);
          t.x = media(usados); t.s = desvio(usados); t.cv = t.s / t.x * 100; t.xs = t.x - t.s;
          t.okMin = ok(min) ? t.xs >= min : null; t.okS = t.cv <= 20;
          t.aceito = t.okMin === null ? null : t.okMin && t.okS;
          if (t.okMin === false) avisos.push("Trecho km " + fmt(t.kmi, 1) + " – " + fmt(t.kmf, 1) + ": x̄ − s = " + fmt(t.xs, 0) + " < mínimo " + fmt(min, 0) + " — não aceito (seção 8).");
          if (!t.okS) avisos.push("Trecho km " + fmt(t.kmi, 1) + " – " + fmt(t.kmf, 1) + ": desvio-padrão de " + fmt(t.cv, 1) + " % da média, acima de 20 % (seção 8).");
          if (vals.length < 100) avisos.push("Trecho km " + fmt(t.kmi, 1) + " – " + fmt(t.kmf, 1) + " com " + fmt(vals.length / 10, 1) + " km: a avaliação é feita em trechos de 10 km (seção 8).");
        } else avisos.push("Trecho com menos de 3 médias de 100 m: não é possível excluir máximo e mínimo.");
        r.trechos.push(t);
      }
      if (!ok(min)) avisos.push("Informe o valor mínimo admitido (BR-Legal) para o parecer de aceitação (seção 8).");
      r.segs = segs;
      return { tab: { af: [], seg: [] }, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, h = '<div class="fe-res">';
      r.trechos.forEach(function (t) {
        if (!ok(t.x)) return;
        h += '<div class="fe-res-item"><div class="fe-res-v">' + fmt(t.xs, 0) + ' <small>mcd/(lx·m²)</small></div><div class="fe-res-r">km ' + fmt(t.kmi, 1) + " – " + fmt(t.kmf, 1) + ": x̄ − s (x̄ = " + fmt(t.x, 0) + ", s = " + fmt(t.s, 0) + " = " + fmt(t.cv, 1) + " %) — " +
          (t.aceito === null ? "sem mínimo informado" : t.aceito ? '<span class="fe-ok">ACEITO</span>' : '<span class="fe-nok">NÃO ACEITO</span>') + "</div></div>";
      });
      if (ok(r.afVar)) h += '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + fmt(r.afVar, 1) + ' %</div><div class="fe-res-r">Aferição — maior variação em relação à média (máx. 20 %) — ' + (r.afOk ? '<span class="fe-ok">aferido</span>' : '<span class="fe-nok">fora</span>') + "</div></div>";
      return h + "</div>";
    },
    graficos: function (calc, d, opt) {
      opt = opt || {};
      var sg = calc.resultados.segs, v = sg.filter(ok);
      if (!v.length) return ['<div class="fe-graf-vazio">O diagrama linear aparece com as médias a cada 100 m.</div>'];
      var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)", cor = imp ? "#1f5fbf" : "#4f8cff";
      var W = opt.w || 600, H = opt.h || 260, m = { l: 50, r: 12, t: 16, b: 40 }, min = num((d.params || {}).minimo), kmi = num((d.params || {}).kmi) || 0;
      var ymax = Math.ceil(Math.max.apply(null, v.concat(ok(min) ? [min] : [])) * 1.15 / 50) * 50, n = sg.length;
      function X(i) { return m.l + (i + 0.5) / n * (W - m.l - m.r); }
      function Y(y) { return H - m.b - y / ymax * (H - m.t - m.b); }
      var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10.5">';
      for (var y = 0; y <= ymax; y += ymax > 400 ? 100 : 50) s += '<line x1="' + m.l + '" y1="' + Y(y) + '" x2="' + (W - m.r) + '" y2="' + Y(y) + '" stroke="' + grade + '" stroke-width="0.6"/><text x="' + (m.l - 5) + '" y="' + (Y(y) + 4) + '" text-anchor="end" fill="' + txt + '">' + y + "</text>";
      var cada = Math.max(1, Math.ceil(n / 10));
      for (var i = 0; i < n; i += cada) s += '<text x="' + X(i) + '" y="' + (H - m.b + 13) + '" text-anchor="middle" fill="' + txt + '">' + fmt(kmi + i / 10, 1) + "</text>";
      s += '<path d="' + sg.map(function (x, k) { return ok(x) ? (k && ok(sg[k - 1]) ? "L" : "M") + X(k).toFixed(1) + " " + Y(x).toFixed(1) : ""; }).join(" ") + '" fill="none" stroke="' + cor + '" stroke-width="1.5"/>';
      if (ok(min)) s += '<line x1="' + m.l + '" y1="' + Y(min) + '" x2="' + (W - m.r) + '" y2="' + Y(min) + '" stroke="#c0392b" stroke-dasharray="5 3"/><text x="' + (W - m.r - 4) + '" y="' + (Y(min) - 4) + '" text-anchor="end" fill="' + txt + '">mínimo ' + fmt(min, 0) + "</text>";
      calc.resultados.trechos.forEach(function (t) { if (ok(t.xs)) s += '<line x1="' + m.l + '" y1="' + Y(t.xs) + '" x2="' + (W - m.r) + '" y2="' + Y(t.xs) + '" stroke="' + (imp ? "#555" : "var(--text)") + '" stroke-dasharray="2 3"/>'; });
      s += '<text x="' + (W / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + txt + '">km</text><text transform="translate(12 ' + (H / 2) + ') rotate(-90)" text-anchor="middle" fill="' + txt + '">RL̄ (mcd/lx/m²)</text>';
      return [s + "</svg>"];
    },
    relatorio: {
      notas: "Seção 8: por trecho de 10 km excluem-se o maior e o menor RL̄ de 100 m; x̄ = média e s = desvio-padrão (n − 1) dos demais; aceito se x̄ − s ≥ valor mínimo admitido (BR-Legal) e s ≤ 20 % (interpretado como 20 % da média). Aferição: maior desvio de uma medição em relação à média das 10 medições ≤ 20 %.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        rows.push(["Linha / sentido", (P.linha || "—") + " / " + (P.sentido || "—") + " — geometria " + P.geom + " m; " + (P.tipo === "residual" ? "residual" : "inicial")]);
        if (ok(r.afVar)) rows.push(["Aferição (seção 6)", "média " + fmt(r.afMedia, 0) + "; maior variação " + fmt(r.afVar, 1) + " % — " + (r.afOk ? "aferido" : "FORA (> 20 %)")]);
        r.trechos.forEach(function (t) {
          if (!ok(t.x)) return;
          rows.push(["Trecho km " + fmt(t.kmi, 1) + " – " + fmt(t.kmf, 1), t.n + " médias de 100 m (excluídos máx. " + fmt(t.max, 0) + " e mín. " + fmt(t.min, 0) + "); x̄ = " + fmt(t.x, 1) + "; s = " + fmt(t.s, 1) + " (" + fmt(t.cv, 1) + " %); x̄ − s = " + fmt(t.xs, 1) +
            (t.aceito === null ? "" : t.aceito ? " — ACEITO" : " — NÃO ACEITO") + (ok(num(P.minimo)) ? " (mínimo " + P.minimo + ")" : "")]);
        });
        return rows;
      },
    },
    exemplos: [
      { nome: "Leitura inicial — 10 km de bordo branco, aceito (dados gerados)", dados: function () {
        var seg = [], s = 5;
        for (var i = 0; i < 100; i++) { s = (s * 9301 + 49297) % 233280; seg.push({ rl: fmt(265 + (s / 233280 - 0.5) * 70 + (i === 37 ? 140 : 0) - (i === 71 ? 120 : 0), 0) }); }
        return { ident: { registro: "EX-RL-001", data: "2026-04-15", obra: "BR-000", trecho: "km 20,0 – km 30,0, sentido crescente" },
          params: { equip: "Retrorrefletômetro dinâmico — unidade 1", geom: "30", tipo: "inicial", linha: "Bordo direito contínuo, branca", sentido: "Crescente, faixa 1",
            dtaplic: "2026-04-05", dtmed: "2026-04-15", kmi: "20", vel: "72", esp: "30", minimo: "200", calib: "2025-11-20", cond: "25 °C, pista seca e limpa" },
          af: [262, 270, 255, 268, 259, 274, 261, 266, 257, 271].map(function (x) { return { rl: String(x) }; }), seg: seg };
      } },
      { nome: "Leitura residual — 4 km de eixo amarelo, não aceito (dados gerados)", dados: function () {
        var seg = [], s = 9;
        for (var i = 0; i < 40; i++) { s = (s * 9301 + 49297) % 233280; seg.push({ rl: fmt(130 + (s / 233280 - 0.5) * 110 - (i > 25 ? 35 : 0), 0) }); }
        return { ident: { registro: "EX-RL-002", data: "2026-09-02", obra: "BR-000", trecho: "km 44,0 – km 48,0, sentido decrescente" },
          params: { equip: "Retrorrefletômetro dinâmico — unidade 1", geom: "30", tipo: "residual", linha: "Eixo seccionado, amarela", sentido: "Decrescente",
            dtaplic: "2025-08-10", dtmed: "2026-09-02", kmi: "44", vel: "55", esp: "60", minimo: "100", calib: "2025-06-01", cond: "22 °C, pista seca" },
          af: [120, 131, 108, 142, 118, 125, 99, 136, 128, 115].map(function (x) { return { rl: String(x) }; }), seg: seg };
      } },
    ],
  };
})();
