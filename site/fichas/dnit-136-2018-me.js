/*
 * Ficha: DNIT 136/2018-ME — Misturas asfálticas — Resistência à tração por compressão diametral.
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var G = 9.80665;  // kgf -> N

  // limites dimensionais da seção 4 (mm)
  var DIM = {
    "100": { dMin: 98, dMax: 102, hMin: 35, hMax: 65, rot: "Ø 10 ± 0,2 cm, altura de 3,50 a 6,50 cm" },
    "150": { dMin: 148, dMax: 152, hMin: 50, hMax: 100, rot: "Ø 15 ± 0,2 cm, altura de 5,0 a 10,0 cm" },
  };
  var CARGAS = [["N", "Carga de ruptura em N (célula de carga)"], ["kN", "Carga de ruptura em kN (célula de carga)"],
    ["anel", "Anel dinamométrico — leitura × constante (kgf/div)"]];

  function leituras(x, pref) {
    return [1, 2, 3, 4].map(function (i) { return num(x[pref + i]); }).filter(ok);
  }
  // carga de ruptura em N conforme o modo de leitura
  function cargaN(x, P) {
    var v = num(x.f);
    if (!ok(v)) return NaN;
    if (P.carga === "kN") return v * 1000;
    if (P.carga === "anel") { var k = num(P.constante); return ok(k) ? v * k * G : NaN; }
    return v;
  }

  FE.FICHAS["dnit-136-2018-me"] = {
    titulo: "Misturas asfálticas — Resistência à tração por compressão diametral",
    resumo: "Corpos de prova cilíndricos a 25 °C rompidos por compressão diametral a 0,8 ± 0,1 mm/s; σR = 2F / (π·D·H), com D e H médias de quatro leituras. Em CPs moldados, o resultado é a média de três CPs, cada um a ± 10 % da média.",
    blocos: [],
    params: [
      { k: "mistura", r: "Mistura asfáltica", ph: "ex.: CBUQ faixa C, CAP 30/45, 5,2 %" },
      { k: "origem", r: "Origem dos corpos de prova (4)", tipo: "select", recarrega: true,
        opcoes: [["lab", "Moldados em laboratório (DNER-ME 043 ou DNIT 178-PRO)"], ["pista", "Extraídos da pista (sonda rotativa)"]],
        dica: "moldados: média de três CPs; extraídos: resultado de cada CP (6)" },
      { k: "diametro", r: "Diâmetro nominal (4)", tipo: "select", opcoes: [["100", "100 mm — " + DIM["100"].rot], ["150", "150 mm — " + DIM["150"].rot]] },
      { k: "unidade", r: "Unidade das leituras de paquímetro", tipo: "select", recarrega: true, opcoes: [["mm", "mm"], ["cm", "cm"]] },
      { k: "carga", r: "Leitura da carga (5 g)", tipo: "select", recarrega: true, opcoes: CARGAS },
      { k: "constante", r: "Constante do anel dinamométrico (kgf/divisão)", ph: "ex.: 2",
        dica: "carga F = leitura × constante × 9,80665 N", se: function (d) { return (d.params || {}).carga === "anel"; } },
      { k: "temperatura", r: "Temperatura do ensaio (°C)", ph: "25",
        dica: "25 ± 0,5 °C por 4 h antes do ensaio (5 c); outra temperatura só para estudos específicos, citada no relatório (3 d, Nota)" },
      { k: "minimo", r: "Resistência à tração mínima exigida (MPa) — opcional", ph: "0,65",
        dica: "da especificação: ex.: ≥ 0,65 MPa (DNIT 031/2006-ES); ≥ 0,70 MPa (DNIT 385/2026-ES, CAP modificado)" },
    ],
    padrao: { origem: "lab", diametro: "100", unidade: "mm", carga: "N", temperatura: "25" },
    tabelas: function (d) {
      var P = d.params || {}, u = P.unidade === "cm" ? "cm" : "mm";
      var uf = P.carga === "kN" ? "kN" : P.carga === "anel" ? "div." : "N";
      var linhas = [{ k: "id", r: "Identificação do CP", texto: true }, { grupo: "Diâmetro — quatro posições distintas (5 b)" }];
      [1, 2, 3, 4].forEach(function (i) { linhas.push({ k: "d" + i, r: "Diâmetro — leitura " + i, u: u }); });
      linhas.push({ calc: "D", r: "Diâmetro médio (D)", u: "mm", casas: 1 }, { grupo: "Altura — quatro posições equidistantes (5 a)" });
      [1, 2, 3, 4].forEach(function (i) { linhas.push({ k: "h" + i, r: "Altura — leitura " + i, u: u }); });
      linhas.push({ calc: "H", r: "Altura média (H)", u: "mm", casas: 1 }, { grupo: "Ruptura (5 f, g; 6)" },
        { k: "f", r: P.carga === "anel" ? "Leitura do anel dinamométrico na ruptura" : "Carga de ruptura (F)", u: uf });
      if (P.carga !== "N") linhas.push({ calc: "F", r: "Carga de ruptura (F)", u: "N", casas: 0 });
      linhas.push({ calc: "rt", r: "σR = 2F / (π·D·H) (eq. 1)", u: "MPa", casas: 3, destaque: true },
        { calc: "dev", r: "Variação em relação à média", u: "%", casas: 1 });
      return [{ chave: "cp", titulo: "Corpos de prova", rotulo: "CP", iniciais: 3, min: 1, linhas: linhas,
        dica: "uma coluna por corpo de prova; leituras de paquímetro na unidade escolhida (convertidas para mm)" }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], fat = P.unidade === "cm" ? 10 : 1, lim = DIM[P.diametro] || DIM["100"];
      var pista = P.origem === "pista";
      var poucas = [];
      var cps = (d.cp || []).map(function (x, i) {
        var rot = "CP " + (x.id || i + 1);
        var ld = leituras(x, "d"), lh = leituras(x, "h");
        var o = { D: ld.length ? media(ld) * fat : NaN, H: lh.length ? media(lh) * fat : NaN, F: cargaN(x, P) };
        o.rt = ok(o.D) && ok(o.H) && ok(o.F) && o.D > 0 && o.H > 0 ? 2 * o.F / (Math.PI * o.D * o.H) : NaN;
        if ((ld.length && ld.length < 4) || (lh.length && lh.length < 4)) poucas.push(rot + " (" + ld.length + " D, " + lh.length + " H)");
        if (ok(o.D) && (o.D < lim.dMin || o.D > lim.dMax)) avisos.push(rot + ": diâmetro de " + fmt(o.D, 1) + " mm fora de " + fmt(lim.dMin, 0) + " a " + fmt(lim.dMax, 0) + " mm (4).");
        if (ok(o.H) && (o.H < lim.hMin || o.H > lim.hMax)) avisos.push(rot + ": altura de " + fmt(o.H, 1) + " mm fora de " + fmt(lim.hMin, 0) + " a " + fmt(lim.hMax, 0) + " mm (4).");
        if (ok(o.D) && ok(o.H) && fat === 1 && o.D < 30) avisos.push(rot + ": diâmetro de " + fmt(o.D, 1) + " mm — as leituras parecem estar em cm; ajuste a unidade.");
        return o;
      });
      if (poucas.length) avisos.push("Menos de quatro leituras de diâmetro ou de altura: " + poucas.join("; ") + " — D e H são médias de quatro leituras (5 a, b).");
      if (P.carga === "anel" && !ok(num(P.constante))) avisos.push("Informe a constante do anel dinamométrico para converter a leitura em carga.");
      var vals = cps.map(function (o) { return o.rt; }).filter(ok);
      var m = media(vals), dp = NaN, vmax = NaN;
      cps.forEach(function (o) { o.dev = ok(o.rt) && ok(m) && m > 0 ? (o.rt - m) / m * 100 : NaN; });
      if (vals.length > 1) dp = Math.sqrt(vals.reduce(function (s, v) { return s + (v - m) * (v - m); }, 0) / (vals.length - 1));
      vmax = vals.length ? Math.max.apply(null, cps.map(function (o) { return ok(o.dev) ? Math.abs(o.dev) : 0; })) : NaN;
      var criterio = null;
      if (!pista) {
        if (vals.length && vals.length !== 3) avisos.push("CPs moldados: o resultado é a média de três corpos de prova (6); há " + vals.length + ".");
        if (vals.length >= 2) {
          criterio = vmax <= 10;
          cps.forEach(function (o, i) {
            if (ok(o.dev) && Math.abs(o.dev) > 10) avisos.push("CP " + ((d.cp[i] || {}).id || i + 1) + ": σR = " + fmt(o.rt, 3) + " MPa difere " + fmt(o.dev, 1) +
              " % da média (limite ± 10 %, seção 6) — a média não atende ao critério da norma; ensaie novo conjunto de CPs.");
          });
        }
      } else if (vals.length) {
        avisos.push("CPs extraídos da pista: a resistência refere-se a cada CP; a resistência representativa do segmento exige análise estatística (6).");
      }
      var t = num(P.temperatura);
      if (ok(t) && Math.abs(t - 25) > 0.5) avisos.push("Ensaio a " + fmt(t, 1) + " °C (padrão 25 ± 0,5 °C): válido só para estudos específicos, com a temperatura citada no relatório (3 d, Nota).");
      var minimo = num(P.minimo), conforme = null;
      if (ok(minimo) && vals.length) {
        if (pista) {
          var abaixo = vals.filter(function (v) { return v < minimo; }).length;
          conforme = abaixo === 0;
          if (abaixo) avisos.push(abaixo + " CP(s) com σR abaixo do mínimo de " + fmt(minimo, 2) + " MPa.");
        } else {
          conforme = Math.round(m * 100) / 100 >= minimo;
          if (!conforme) avisos.push("σR médio = " + fmt(m, 2) + " MPa, abaixo do mínimo exigido de " + fmt(minimo, 2) + " MPa.");
        }
      }
      return { tab: { cp: cps }, resultados: { rt: m, n: vals.length, dp: dp, vmax: vmax, criterio: criterio, pista: pista,
        min: vals.length ? Math.min.apply(null, vals) : NaN, max: vals.length ? Math.max.apply(null, vals) : NaN,
        individuais: vals, minimo: minimo, conforme: conforme }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      var sel = r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">atende ao mínimo</span>' : ' · <span class="fe-nok">não atende ao mínimo</span>';
      if (r.pista) {
        return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + (r.n ? r.individuais.map(function (v) { return fmt(v, 2); }).join(" · ") : "—") +
          ' <small>MPa</small></div><div class="fe-res-r">σR de cada CP extraído (6)' + sel + '</div></div>' +
          '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + fmt(r.rt, 2) + " MPa" + (ok(r.dp) ? " · s = " + fmt(r.dp, 3) : "") +
          '</div><div class="fe-res-r">Média e desvio-padrão (informativos — ver análise estatística)</div></div></div>';
      }
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + fmt(r.rt, 2) + ' <small>MPa</small></div>' +
        '<div class="fe-res-r">Resistência à tração — média de ' + r.n + " CP(s)" + sel + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (ok(r.vmax) ? "± " + fmt(r.vmax, 1) + " %" : "—") + '</div><div class="fe-res-r">Maior variação em relação à média (limite ± 10 %)' +
        (r.criterio === null ? "" : r.criterio ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>') + "</div></div></div>";
    },
    relatorio: {
      notas: "σR = 2F / (π·D·H) (eq. 1), com F em N e D, H em mm (médias de quatro leituras de paquímetro, 5 a–b) → MPa. CPs moldados em laboratório: resultado = média de três CPs, desde que cada valor individual esteja a ± 10 % da média (seção 6). CPs extraídos da pista: resultado de cada CP; a resistência representativa do segmento requer análise estatística. A norma não fixa arredondamento: individuais com três casas, média com duas. Anel dinamométrico: F = leitura × constante × 9,80665 N.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.mistura) rows.push(["Mistura", P.mistura]);
        if (r.pista) {
          rows.push(["σR de cada CP (extraídos da pista)", r.individuais.map(function (v) { return fmt(v, 3); }).join("; ") + " MPa"]);
          rows.push(["Média / desvio-padrão / mínimo (informativos)", fmt(r.rt, 3) + " / " + fmt(r.dp, 3) + " / " + fmt(r.min, 3) + " MPa"]);
        } else {
          rows.push(["Resistência à tração por compressão diametral (média de " + r.n + " CPs)", fmt(r.rt, 2) + " MPa" +
            (r.criterio === false ? " — NÃO ATENDE ao critério de ± 10 % da seção 6" : "")]);
          rows.push(["Maior variação individual em relação à média", ok(r.vmax) ? fmt(r.vmax, 1) + " % (limite ± 10 %)" : "—"]);
        }
        if (r.conforme !== null) rows.push(["Mínimo exigido", fmt(r.minimo, 2) + " MPa — " + (r.conforme ? "atende" : "NÃO ATENDE")]);
        rows.push(["Temperatura do ensaio", (P.temperatura || "25") + " °C"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "CBUQ faixa A — 3 CPs moldados, anel dinamométrico (planilha do laboratório)", dados: function () {
        // MATRIZ CBUQ.xlsx, aba DIAMETRAL (Unidade B): espessura e diâmetro com uma leitura cada (cm), leituras do anel 410/445/555,
        // constante 2 kgf/div. A planilha registra como "carga de ruptura" o valor 2F (9,8 × 2 × leitura × constante).
        return { ident: { registro: "EX-RT-001", camada: "Camada de ligação (binder) — CBUQ faixa A, CAP 30/45", origem: "Brita e pó de pedra Y" },
          params: { mistura: "CBUQ faixa A, CAP 30/45, 4,6 %", origem: "lab", diametro: "100", unidade: "cm", carga: "anel", constante: "2", temperatura: "25", minimo: "0,65" },
          cp: [{ id: "1", d1: "10,1", h1: "6,5", f: "410" }, { id: "3", d1: "10,1", h1: "6,1", f: "445" }, { id: "5", d1: "10,2", h1: "6,4", f: "555" }] };
      } },
      { nome: "CPs extraídos da pista — dimensões reais, cargas ilustrativas", dados: function () {
        // dimensões dos CPs CB3-1, CB3-2 e CB3-3 (RELATÓRIO DE DADOS DOS ENSAIOS (CP CBUQ).xls, Unidade A — duas leituras de diâmetro
        // e quatro de altura, em cm); cargas de ruptura ilustrativas (a planilha não traz a ruptura)
        return { ident: { registro: "EX-RT-002", obra: "Unidade A", local: "CB3-1 a CB3-3", camada: "Revestimento — CBUQ" },
          params: { mistura: "CBUQ (pista)", origem: "pista", diametro: "100", unidade: "cm", carga: "kN", temperatura: "25", minimo: "0,65" },
          cp: [{ id: "CB3-1", d1: "9,979", d2: "9,991", h1: "6,369", h2: "6,555", h3: "6,503", h4: "6,423", f: "8,62" },
            { id: "CB3-2", d1: "9,970", d2: "9,965", h1: "5,880", h2: "5,877", h3: "5,839", h4: "5,808", f: "6,95" },
            { id: "CB3-3", d1: "9,879", d2: "9,865", h1: "6,509", h2: "6,561", h3: "6,693", h4: "6,796", f: "5,98" }] };
      } },
      { nome: "Ø 100 mm, célula de carga — resistência abaixo do mínimo", dados: function () {
        // valores-alvo σR ≈ 0,58 / 0,62 / 0,60 MPa com D ≈ 101,6 mm e H ≈ 63,5 mm
        return { ident: { registro: "EX-RT-003", camada: "Capa — CBUQ faixa C" },
          params: { mistura: "CBUQ faixa C, CAP 50/70", origem: "lab", diametro: "100", unidade: "mm", carga: "N", temperatura: "25", minimo: "0,65" },
          cp: [{ id: "A", d1: "101,5", d2: "101,7", d3: "101,6", d4: "101,6", h1: "63,4", h2: "63,6", h3: "63,5", h4: "63,5", f: "5879" },
            { id: "B", d1: "101,6", d2: "101,6", d3: "101,8", d4: "101,6", h1: "63,9", h2: "64,1", h3: "64,0", h4: "64,0", f: "6337" },
            { id: "C", d1: "101,4", d2: "101,6", d3: "101,5", d4: "101,5", h1: "62,8", h2: "63,0", h3: "63,1", h4: "62,9", f: "6030" }] };
      } },
    ],
  };
})();
