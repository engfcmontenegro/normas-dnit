/*
 * Ficha: DNIT 432/2020-ME — Agregados — propriedades de forma por Processamento Digital de Imagens (PDI).
 * O equipamento calcula, por partícula, as expressões do Anexo A (angularidade, textura superficial, esfericidade,
 * forma 2D, RC, RA, RCA) e fornece média e desvio-padrão por fração (7). A ficha registra esses índices por fração,
 * confere a quantidade mínima de partículas (Tabela 1), calcula médias ponderadas entre frações (informativo) e
 * classifica cada fração pela Tabela D1 (Anexo D, informativo).
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  var GRAUDAS = ["25", "19", "12,5", "9,5", "4,75"];
  var MIUDAS = ["2,36", "1,18", "0,6", "0,3", "0,15", "0,075"];
  var NMIN = { g: 50, m: 150 };  // Tabela 1
  // Tabela D1 (Anexo D): limites crescentes e classes
  var CLASSES = {
    ang: { lim: [1260, 4080, 7180], nomes: ["Arredondado", "Subarredondado", "Subangular", "Angular"], faixa: [0, 10000], nome: "Angularidade" },
    ts: { lim: [260, 440, 600, 825], nomes: ["Polido", "Macio", "Pouco rugoso", "Moderadamente rugoso", "Muito rugoso"], faixa: [0, 1000], nome: "Textura superficial" },
    esf: { lim: [0.5, 0.7, 0.9], nomes: ["Achatado/alongado", "Pouco esférico", "Moderadamente esférico", "Muito esférico"], faixa: [0, 1], nome: "Esfericidade" },
    f2d: { lim: [4, 11, 15.5], nomes: ["Circular", "Semicircular", "Semialongado", "Alongado"], faixa: [0, 20], nome: "Forma 2D" },
  };
  function classe(p, v) {
    if (!ok(v)) return "";
    var c = CLASSES[p], i = 0;
    while (i < c.lim.length && v >= c.lim[i]) i++;
    return c.nomes[i];
  }
  var CASAS = { ang: 1, ts: 1, esf: 2, f2d: 1 };
  var RAZOES = ["2", "3", "4", "5"];

  function tipo(d) { var t = (d.params || {}).tipo; return t === "graudo" || t === "miudo" ? t : "ambos"; }
  function ajusta(arr, n) { if (Array.isArray(arr)) { while (arr.length < n) arr.push({}); if (arr.length > n) arr.length = n; } }

  // média ponderada de uma propriedade entre frações (pesos: % retida ou nº de partículas)
  function ponderada(cols, k, modo) {
    var sp = 0, sv = 0;
    cols.forEach(function (c) {
      var v = num(c[k]), w = modo === "retida" ? num(c.pr) : num(c.n);
      if (ok(v) && ok(w) && w > 0) { sp += w; sv += w * v; }
    });
    return sp ? sv / sp : NaN;
  }

  FE.FICHAS["dnit-432-2020-me"] = {
    titulo: "Propriedades de forma de agregados por PDI",
    resumo: "Por fração: número de partículas, média e desvio-padrão da angularidade, textura superficial, esfericidade (graúdo) e forma 2D (miúdo), e % de partículas achatadas e/ou alongadas fornecidos pelo equipamento; verificação da Tabela 1, médias ponderadas e classificação pela Tabela D1.",
    blocos: [],
    params: [
      { k: "material", r: "Material (tipo, origem, processo de produção — 8 a)", ph: "ex.: brita granítica, britador de impacto" },
      { k: "equip", r: "Equipamento (8 c)", ph: "ex.: sistema de PDI (tipo AIMS)" },
      { k: "tipo", r: "Frações analisadas", tipo: "select", recarrega: true,
        opcoes: [["ambos", "Graúdas e miúdas"], ["graudo", "Somente graúdas (retidas na 4,75 mm)"], ["miudo", "Somente miúdas (passantes na 4,75 mm)"]] },
      { k: "pond", r: "Média ponderada entre frações (informativo)", tipo: "select",
        opcoes: [["n", "Pelo número de partículas"], ["retida", "Pela % retida em cada fração (granulometria)"]],
        dica: "a norma pede média e desvio por fração (7, 8 f); a média ponderada é um resumo adicional" },
    ],
    padrao: { tipo: "ambos", pond: "n" },
    tabelas: function (d) {
      var t = tipo(d), tabs = [];
      ajusta(d.graudo, GRAUDAS.length); ajusta(d.miudo, MIUDAS.length);
      var base = [{ k: "pr", r: "% retida na fração — opcional (ponderação)", u: "%" }, { k: "n", r: "Nº de partículas analisadas (Tabela 1)", u: "" }];
      if (t !== "miudo") tabs.push({ chave: "graudo", titulo: "Frações graúdas — valores do equipamento (7.1 a 7.3, 7.5, 7.6)", rotulo: "Fração (mm)", iniciais: GRAUDAS.length, min: GRAUDAS.length, fixo: true,
        nomes: GRAUDAS, dica: "mínimo de 50 partículas por fração; deixe em branco as frações não analisadas",
        linhas: base.concat([
          { grupo: "Angularidade (0 a 10 000)" }, { k: "angM", r: "Média", u: "" }, { k: "angDP", r: "Desvio-padrão", u: "" },
          { grupo: "Textura superficial (0 a 1 000)" }, { k: "tsM", r: "Média", u: "" }, { k: "tsDP", r: "Desvio-padrão", u: "" },
          { grupo: "Esfericidade (0 a 1)" }, { k: "esfM", r: "Média", u: "" }, { k: "esfDP", r: "Desvio-padrão", u: "" },
          { grupo: "Partículas achatadas e alongadas — RCA = dMa / dMe (7.6)" },
        ], RAZOES.map(function (q) { return { k: "rca" + q, r: "% com RCA > " + q + ":1", u: "%" }; }),
        [{ grupo: "Partículas achatadas ou alongadas — RC = dI / dMe ou RA = dMa / dI (7.5)" }],
        RAZOES.map(function (q) { return { k: "rc" + q, r: "% com RC ou RA > " + q + ":1", u: "%" }; })) });
      if (t !== "graudo") tabs.push({ chave: "miudo", titulo: "Frações miúdas — valores do equipamento (7.1 e 7.4)", rotulo: "Fração (mm)", iniciais: MIUDAS.length, min: MIUDAS.length, fixo: true,
        nomes: MIUDAS, dica: "mínimo de 150 partículas por fração; deixe em branco as frações não analisadas",
        linhas: base.concat([
          { grupo: "Angularidade (0 a 10 000)" }, { k: "angM", r: "Média", u: "" }, { k: "angDP", r: "Desvio-padrão", u: "" },
          { grupo: "Forma 2D (0 a 20)" }, { k: "f2dM", r: "Média", u: "" }, { k: "f2dDP", r: "Desvio-padrão", u: "" },
        ]) });
      return tabs;
    },
    calcular: function (d) {
      var P = d.params || {}, t = tipo(d), avisos = [], modo = P.pond === "retida" ? "retida" : "n";
      var grupos = [];
      if (t !== "miudo") grupos.push({ g: "g", chave: "graudo", nomes: GRAUDAS, props: ["ang", "ts", "esf"], titulo: "graúda" });
      if (t !== "graudo") grupos.push({ g: "m", chave: "miudo", nomes: MIUDAS, props: ["ang", "f2d"], titulo: "miúda" });
      var res = { t: t, modo: modo, grupos: [] };
      grupos.forEach(function (G) {
        var cols = (d[G.chave] || []).map(function (c, i) { return { c: c, nome: G.nomes[i] }; }).filter(function (o) {
          return Object.keys(o.c).some(function (k) { return String(o.c[k] || "").trim() !== ""; });
        });
        var linhas = cols.map(function (o) {
          var c = o.c, n = num(c.n), fr = "Fração " + o.nome + " mm";
          if (!ok(n)) avisos.push(fr + ": informe o número de partículas analisadas (8 e).");
          else if (n < NMIN[G.g]) avisos.push(fr + ": " + fmt(n, 0) + " partículas — mínimo de " + NMIN[G.g] + " (Tabela 1); substitua as partículas e repita a captura até completar (6 d).");
          var L = { nome: o.nome, n: n, cls: {} };
          G.props.forEach(function (p) {
            var v = num(c[p + "M"]), s = num(c[p + "DP"]), F = CLASSES[p].faixa;
            if (ok(v) && (v < F[0] || v > F[1])) avisos.push(fr + ": " + CLASSES[p].nome.toLowerCase() + " média " + fmt(v, CASAS[p]) + " fora da escala de " + fmt(F[0], 0) + " a " + fmt(F[1], 0) + " (3.4 a 3.7).");
            if (ok(s) && s < 0) avisos.push(fr + ": desvio-padrão negativo em " + CLASSES[p].nome.toLowerCase() + ".");
            L[p] = v; L[p + "DP"] = s; L.cls[p] = classe(p, v);
          });
          if (G.g === "g") ["rca", "rc"].forEach(function (pre) {
            var ant = NaN;
            RAZOES.forEach(function (q) {
              var v = num(c[pre + q]);
              L[pre + q] = v;
              if (ok(v) && (v < 0 || v > 100)) avisos.push(fr + ": % " + (pre === "rca" ? "RCA" : "RC ou RA") + " > " + q + ":1 fora de 0 a 100 %.");
              if (ok(v) && ok(ant) && v > ant + 1e-9) avisos.push(fr + ": % com " + (pre === "rca" ? "RCA" : "RC ou RA") + " > " + q + ":1 (" + fmt(v, 1) + " %) maior que a da razão anterior (" + fmt(ant, 1) + " %) — as porcentagens acumuladas devem decrescer.");
              if (ok(v)) ant = v;
            });
          });
          if (modo === "retida" && !ok(num(c.pr))) avisos.push(fr + ": sem % retida — fica fora da média ponderada.");
          return L;
        });
        var med = {};
        G.props.forEach(function (p) { med[p] = ponderada(cols.map(function (o) { return o.c; }), p + "M", modo); med["cls_" + p] = classe(p, med[p]); });
        if (G.g === "g") RAZOES.forEach(function (q) {
          med["rca" + q] = ponderada(cols.map(function (o) { return o.c; }), "rca" + q, modo);
          med["rc" + q] = ponderada(cols.map(function (o) { return o.c; }), "rc" + q, modo);
        });
        var nTot = linhas.reduce(function (a, l) { return a + (ok(l.n) ? l.n : 0); }, 0);
        if (!linhas.length) avisos.push("Nenhuma fração " + G.titulo + " preenchida.");
        res.grupos.push({ g: G.g, titulo: G.titulo, props: G.props, linhas: linhas, med: med, nTot: nTot });
      });
      return { tab: {}, resultados: res, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, h = '<div class="fe-res">';
      r.grupos.forEach(function (G) {
        G.props.forEach(function (p) {
          if (!ok(G.med[p])) return;
          h += '<div class="fe-res-item"><div class="fe-res-v' + (p === "ang" && G.g === "g" || p === "f2d" ? "" : " fe-res-p") + '">' + fmt(G.med[p], CASAS[p]) + '</div><div class="fe-res-r">' +
            CLASSES[p].nome + " — fração " + G.titulo + " (média ponderada) · " + esc(G.med["cls_" + p]) + "</div></div>";
        });
        if (G.g === "g" && ok(G.med.rca3)) h += '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + fmt(G.med.rca3, 1) + ' %</div><div class="fe-res-r">Partículas com RCA > 3:1 (média ponderada)</div></div>';
      });
      h += "</div>";
      r.grupos.forEach(function (G) {
        if (!G.linhas.length) return;
        h += '<table class="fe-resumo"><thead><tr><th>Fração ' + G.titulo + " (mm)</th><th>N</th>" + G.props.map(function (p) { return "<th>" + CLASSES[p].nome + "</th>"; }).join("") +
          (G.g === "g" ? "<th>RCA > 2:1 / 3:1</th>" : "") + "</tr></thead><tbody>" +
          G.linhas.map(function (L) {
            return "<tr><td>" + L.nome + "</td><td>" + fmt(L.n, 0) + "</td>" + G.props.map(function (p) {
              return "<td>" + (ok(L[p]) ? fmt(L[p], CASAS[p]) + (ok(L[p + "DP"]) ? " ± " + fmt(L[p + "DP"], CASAS[p]) : "") + " — " + esc(L.cls[p]) : "—") + "</td>";
            }).join("") + (G.g === "g" ? "<td>" + fmt(L.rca2, 1) + " % / " + fmt(L.rca3, 1) + " %</td>" : "") + "</tr>";
          }).join("") + "</tbody></table>";
      });
      return h;
    },
    graficos: function (calc, d, opt) {
      opt = opt || {};
      var pts = [];
      calc.resultados.grupos.forEach(function (G) { G.linhas.forEach(function (L) { if (ok(L.ang)) pts.push({ nome: L.nome, v: L.ang, s: ok(L.angDP) ? L.angDP : 0, g: G.g }); }); });
      if (!pts.length) return ['<div class="fe-graf-vazio">O gráfico aparece quando houver angularidade por fração.</div>'];
      var W = opt.w || 560, H = opt.h || 320, m = { l: 56, r: 110, t: 14, b: 42 };
      var yMax = Math.max(8000, Math.max.apply(null, pts.map(function (p) { return p.v + p.s; })) * 1.05);
      yMax = Math.ceil(yMax / 1000) * 1000;
      var n = pts.length, larg = (W - m.l - m.r) / n;
      function X(i) { return m.l + larg * (i + 0.5); }
      function Y(v) { return H - m.b - Math.max(0, v) / yMax * (H - m.t - m.b); }
      var cor = opt.imprimir ? { eixo: "#333", grade: "#ddd", txt: "#222", g: "#1f5fbf", m: "#c0392b", lim: "#888", faixa: ["#f4f7fb", "#ffffff"] }
        : { eixo: "var(--text-dim)", grade: "var(--border)", txt: "var(--text-dim)", g: "#4f8cff", m: "#e0a13a", lim: "#9aa3b2", faixa: ["rgba(127,127,127,.07)", "rgba(0,0,0,0)"] };
      var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
      var lims = [0].concat(CLASSES.ang.lim, [yMax]);
      for (var j = 0; j < lims.length - 1; j++) {
        var a = lims[j], b = Math.min(lims[j + 1], yMax);
        if (a >= yMax) break;
        s += '<rect x="' + m.l + '" y="' + Y(b).toFixed(1) + '" width="' + (W - m.l - m.r) + '" height="' + (Y(a) - Y(b)).toFixed(1) + '" fill="' + cor.faixa[j % 2] + '"/>';
        s += '<text x="' + (W - m.r + 6) + '" y="' + ((Y(a) + Y(b)) / 2 + 4).toFixed(1) + '" fill="' + cor.lim + '" font-size="10">' + CLASSES.ang.nomes[j] + "</text>";
        if (j > 0) s += '<line x1="' + m.l + '" y1="' + Y(a).toFixed(1) + '" x2="' + (W - m.r) + '" y2="' + Y(a).toFixed(1) + '" stroke="' + cor.lim + '" stroke-dasharray="4 3"/>';
      }
      for (var gy = 0; gy <= yMax; gy += 1000) s += '<text x="' + (m.l - 6) + '" y="' + (Y(gy) + 4).toFixed(1) + '" text-anchor="end" fill="' + cor.txt + '">' + fmt(gy, 0) + "</text>";
      s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + cor.eixo + '"/>';
      pts.forEach(function (p, i) {
        var c = cor[p.g], x = X(i);
        s += '<line x1="' + x.toFixed(1) + '" y1="' + Y(p.v - p.s).toFixed(1) + '" x2="' + x.toFixed(1) + '" y2="' + Y(p.v + p.s).toFixed(1) + '" stroke="' + c + '" stroke-width="1.4"/>';
        s += '<line x1="' + (x - 5).toFixed(1) + '" y1="' + Y(p.v - p.s).toFixed(1) + '" x2="' + (x + 5).toFixed(1) + '" y2="' + Y(p.v - p.s).toFixed(1) + '" stroke="' + c + '"/>';
        s += '<line x1="' + (x - 5).toFixed(1) + '" y1="' + Y(p.v + p.s).toFixed(1) + '" x2="' + (x + 5).toFixed(1) + '" y2="' + Y(p.v + p.s).toFixed(1) + '" stroke="' + c + '"/>';
        s += '<circle cx="' + x.toFixed(1) + '" cy="' + Y(p.v).toFixed(1) + '" r="4" fill="' + c + '"/>';
        s += '<text x="' + x.toFixed(1) + '" y="' + (H - m.b + 15) + '" text-anchor="middle" fill="' + cor.txt + '" font-size="10">' + p.nome + "</text>";
      });
      s += '<text x="' + ((W + m.l - m.r) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + cor.txt + '">Fração (mm) — média ± desvio-padrão</text>';
      s += '<text transform="translate(14 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + cor.txt + '">Angularidade</text>';
      return [s + "</svg>"];
    },
    relatorio: {
      notas: "Índices calculados pelo programa do equipamento, partícula a partícula, com as expressões do Anexo A (a seção 4.1 remete, por engano, ao Anexo B): angularidade pelo método do gradiente (0 a 10 000), textura superficial por wavelets (0 a 1 000), esfericidade = ∛(dMe · dI / dMa²), forma 2D (0 a 20), RC = dI / dMe, RA = dMa / dI e RCA = dMa / dMe. Quantidade mínima de partículas por fração: 50 (graúdas) e 150 (miúdas) (Tabela 1). A média ponderada entre frações (pelo número de partículas ou pela % retida) é informativa; a norma pede média e desvio-padrão por fração (7, 8 f). Classificação pela Tabela D1 do Anexo D (informativo, proposta para o equipamento AIMS); valores iguais a um limite vão para a classe superior.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        if (P.equip) rows.push(["Equipamento", P.equip]);
        r.grupos.forEach(function (G) {
          rows.push(["Frações " + G.titulo + "s analisadas", G.linhas.map(function (l) { return l.nome; }).join("; ") + " mm — " + fmt(G.nTot, 0) + " partículas"]);
          G.props.forEach(function (p) {
            if (ok(G.med[p])) rows.push([CLASSES[p].nome + " — fração " + G.titulo + " (média ponderada " + (r.modo === "retida" ? "pela % retida" : "pelo nº de partículas") + ")", fmt(G.med[p], CASAS[p]) + " — " + G.med["cls_" + p]]);
          });
          if (G.g === "g" && ok(G.med.rca2)) rows.push(["% achatadas e alongadas RCA > 2:1 / 3:1 / 4:1 / 5:1", RAZOES.map(function (q) { return fmt(G.med["rca" + q], 1); }).join(" / ") + " %"]);
          if (G.g === "g" && ok(G.med.rc2)) rows.push(["% achatadas ou alongadas RC ou RA > 2:1 / 3:1 / 4:1 / 5:1", RAZOES.map(function (q) { return fmt(G.med["rc" + q], 1); }).join(" / ") + " %"]);
        });
        return rows;
      },
      extraHtml: function (calc) {
        var r = calc.resultados, h = "";
        r.grupos.forEach(function (G) {
          if (!G.linhas.length) return;
          h += '<table class="gr"><thead><tr><th>Fração ' + G.titulo + " (mm)</th><th>N</th>" + G.props.map(function (p) { return "<th>" + CLASSES[p].nome + " (média ± DP)</th><th>Classe (D1)</th>"; }).join("") + "</tr></thead><tbody>" +
            G.linhas.map(function (L) {
              return "<tr><td>" + L.nome + "</td><td>" + fmt(L.n, 0) + "</td>" + G.props.map(function (p) {
                return "<td>" + (ok(L[p]) ? fmt(L[p], CASAS[p]) + (ok(L[p + "DP"]) ? " ± " + fmt(L[p + "DP"], CASAS[p]) : "") : "—") + "</td><td>" + esc(L.cls[p] || "—") + "</td>";
              }).join("") + "</tr>";
            }).join("") + "</tbody></table>";
        });
        return h;
      },
    },
    exemplos: [
      { nome: "Brita de britador de impacto — graúdas e miúdas (valores do Anexo B da norma)", dados: function () {
        function col(n, a, as_, t, ts, e, es, rca, rc) {
          var o = { n: n, angM: a, angDP: as_ };
          if (t) { o.tsM = t; o.tsDP = ts; o.esfM = e; o.esfDP = es; RAZOES.forEach(function (q, i) { o["rca" + q] = rca[i]; o["rc" + q] = rc[i]; }); }
          return o;
        }
        return { ident: { registro: "EX-PDI-001", data: "2025-04-22", obra: "Obra A", origem: "Pedreira X", camada: "Brita e pó de pedra — rocha fonolítica" },
          params: { material: "Agregado britado de rocha fonolítica — britador de impacto de eixo vertical", equip: "Sistema de PDI (tipo AIMS)", tipo: "ambos", pond: "n" },
          graudo: [{},
            col("75", "3051,0", "553,2", "433,7", "122,6", "0,72", "0,08", ["53,3", "5,3", "0,0", "0,0"], ["14,7", "1,3", "0,0", "0,0"]),
            col("74", "2990,0", "597,8", "382,2", "102,6", "0,68", "0,08", ["67,6", "10,8", "0,0", "0,0"], ["23,0", "0,0", "0,0", "0,0"]),
            col("75", "3347,8", "629,1", "362,5", "106,6", "0,69", "0,08", ["64,0", "8,0", "2,7", "0,0"], ["21,3", "0,0", "0,0", "0,0"]),
            col("71", "3316,8", "776,6", "282,5", "87,5", "0,67", "0,08", ["66,2", "15,5", "0,0", "0,0"], ["23,9", "0,0", "0,0", "0,0"])],
          miudo: [{ n: "200", angM: "3442,9", angDP: "797,9", f2dM: "7,9", f2dDP: "1,8" }, { n: "200", angM: "3464,2", angDP: "749,3", f2dM: "8,0", f2dDP: "1,7" },
            { n: "201", angM: "3542,9", angDP: "787,4", f2dM: "8,3", f2dDP: "2,0" }, { n: "202", angM: "3165,5", angDP: "901,2", f2dM: "7,8", f2dDP: "2,1" },
            { n: "200", angM: "2740,7", angDP: "817,0", f2dM: "7,4", f2dDP: "1,9" }, { n: "201", angM: "2321,6", angDP: "1022,6", f2dM: "8,4", f2dDP: "2,1" }] };
      } },
      { nome: "Seixo britado — graúdas, fração com poucas partículas e % incoerente (avisos)", dados: function () {
        return { ident: { registro: "EX-PDI-002", data: "2025-04-29", obra: "Obra B", origem: "Jazida 4", camada: "Seixo rolado britado" },
          params: { material: "Seixo rolado britado — britador de mandíbulas", equip: "Sistema de PDI (tipo AIMS)", tipo: "graudo", pond: "retida" },
          graudo: [{},
            { pr: "18,5", n: "60", angM: "2105,4", angDP: "702,3", tsM: "198,6", tsDP: "71,4", esfM: "0,64", esfDP: "0,09", rca2: "71,7", rca3: "18,3", rca4: "3,3", rca5: "0,0", rc2: "28,3", rc3: "3,3", rc4: "0,0", rc5: "0,0" },
            { pr: "32,0", n: "42", angM: "2388,0", angDP: "655,8", tsM: "221,3", tsDP: "80,2", esfM: "0,61", esfDP: "0,10", rca2: "76,2", rca3: "21,4", rca4: "4,8", rca5: "0,0", rc2: "31,0", rc3: "4,8", rc4: "0,0", rc5: "0,0" },
            { pr: "27,5", n: "58", angM: "2541,7", angDP: "690,1", tsM: "240,9", tsDP: "77,5", esfM: "0,62", esfDP: "0,09", rca2: "70,7", rca3: "22,4", rca4: "5,2", rca5: "1,7", rc2: "25,9", rc3: "6,9", rc4: "1,7", rc5: "0,0" },
            { pr: "22,0", n: "55", angM: "2712,3", angDP: "748,9", tsM: "268,4", tsDP: "85,0", esfM: "0,60", esfDP: "0,10", rca2: "74,5", rca3: "20,0", rca4: "7,3", rca5: "9,1", rc2: "29,1", rc3: "5,5", rc4: "1,8", rc5: "0,0" }] };
      } },
    ],
  };
})();
