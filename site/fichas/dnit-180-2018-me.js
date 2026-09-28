/*
 * Ficha: DNIT 180/2018-ME — Misturas asfálticas — Dano por umidade induzida (RRT).
 * Registra-se no motor de site/fichas.js (window.FE). Gmb e vazios calculados aqui a partir das pesagens
 * (NBR 15573 / DNIT 428-ME), com o Gmm informado diretamente.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var RHO = 0.99707;  // massa específica da água a 25 °C (g/cm³), Nota da eq. 3
  var G = 9.80665;

  function leituras(x, pref) {
    return [1, 2, 3, 4].map(function (i) { return num(x[pref + i]); }).filter(ok);
  }
  function cargaN(x, P) {
    var v = num(x.f);
    if (!ok(v)) return NaN;
    if (P.carga === "kN") return v * 1000;
    if (P.carga === "anel") { var k = num(P.constante); return ok(k) ? v * k * G : NaN; }
    return v;
  }
  function rotCP(x, i, pre) { return pre + " " + (x.id || i + 1); }

  // cálculo de um CP (cond = conjunto condicionado)
  function calcCP(x, P, gmm, cond) {
    var fat = P.unidade === "cm" ? 10 : 1;
    var A = num(x.a), im = num(x.im), sss = num(x.sss), B = num(x.b);
    var ld = leituras(x, "d"), lh = leituras(x, "h");
    var o = { D: ld.length ? media(ld) * fat : NaN, H: lh.length ? media(lh) * fat : NaN, F: cargaN(x, P), nd: ld.length, nh: lh.length };
    if (ok(A) && ok(im) && ok(sss) && sss - im > 0) {
      o.gmb = A / (sss - im);                                   // NBR 15573 / DNIT 428
      o.abs = (sss - A) / (sss - im) * 100;
    }
    if (ok(o.gmb) && ok(gmm) && gmm > 0) o.vv = 100 * (1 - o.gmb / gmm);   // eq. 1
    o.E = P.volume === "dim" ? (ok(o.D) && ok(o.H) ? Math.PI * o.D * o.D / 4 * o.H / 1000 : NaN)
      : (ok(sss) && ok(im) && sss - im > 0 ? (sss - im) / RHO : NaN);
    if (cond) {
      if (ok(o.vv) && ok(o.E)) o.va = o.vv * o.E / 100;          // eq. 2
      if (ok(B) && ok(A)) o.J = (B - A) / RHO;                    // eq. 3
      if (ok(o.J) && ok(o.va) && o.va > 0) o.S = 100 * o.J / o.va; // eq. 4
    }
    o.rt = ok(o.D) && ok(o.H) && ok(o.F) && o.D > 0 && o.H > 0 ? 2 * o.F / (Math.PI * o.D * o.H) : NaN;  // DNIT 136, eq. 1
    return o;
  }

  function linhasGrupo(P, cond) {
    var u = P.unidade === "cm" ? "cm" : "mm", uf = P.carga === "kN" ? "kN" : P.carga === "anel" ? "div." : "N";
    var L = [{ k: "id", r: "Identificação do CP", texto: true }, { k: "fab", r: "Data de fabricação (8 c)", texto: true, ph: "dd/mm/aaaa" },
      { grupo: "Massa específica aparente e vazios (6.1, 6.2)" },
      { k: "a", r: "Massa seca ao ar (A)", u: "g" },
      { k: "im", r: "Massa imersa em água", u: "g" },
      { k: "sss", r: "Massa na condição saturada com superfície seca", u: "g" },
      { calc: "gmb", r: "Gmb = A / (m.sss − m.imersa)", u: "", casas: 3 },
      { calc: "vv", r: "Vazios com ar Var = 100 (1 − Gmb/Gmm) (eq. 1)", u: "%", casas: 1, destaque: true },
      { grupo: "Dimensões — paquímetro, 0,1 mm (6.3)" }];
    [1, 2, 3, 4].forEach(function (i) { L.push({ k: "h" + i, r: "Altura — leitura " + i + " (a 90°)", u: u }); });
    L.push({ calc: "H", r: "Altura média (H)", u: "mm", casas: 1 });
    [1, 2, 3, 4].forEach(function (i) { L.push({ k: "d" + i, r: "Diâmetro — leitura " + i + (i <= 2 ? " (face superior)" : " (face inferior)"), u: u }); });
    L.push({ calc: "D", r: "Diâmetro médio (D)", u: "mm", casas: 1 });
    if (cond) {
      L.push({ grupo: "Saturação a vácuo (6.4, 6.5 a–f)" },
        { calc: "E", r: "Volume do corpo de prova (E)", u: "cm³", casas: 1 },
        { calc: "va", r: "Va = Var · E / 100 (eq. 2)", u: "cm³", casas: 1 },
        { k: "b", r: "Massa após saturação, superfície enxuta (B)", u: "g" },
        { calc: "J", r: "J = (B − A) / 0,99707 (eq. 3)", u: "cm³", casas: 1 },
        { calc: "S", r: "Grau de saturação S = 100 J / Va (eq. 4)", u: "%", casas: 1, destaque: true });
    }
    L.push({ grupo: "Ruptura por compressão diametral (DNIT 136-ME)" },
      { k: "f", r: P.carga === "anel" ? "Leitura do anel dinamométrico na ruptura" : "Carga de ruptura (F)", u: uf });
    if (P.carga !== "N") L.push({ calc: "F", r: "Carga de ruptura (F)", u: "N", casas: 0 });
    L.push({ calc: "rt", r: "σR = 2F / (π·D·H)", u: "MPa", casas: 3, destaque: true },
      { calc: "dev", r: "Variação em relação à média do conjunto", u: "%", casas: 1 });
    return L;
  }

  FE.FICHAS["dnit-180-2018-me"] = {
    titulo: "Misturas asfálticas — Dano por umidade induzida (Lottman modificado)",
    resumo: "Seis CPs com 7 % ± 1 % de vazios: três condicionados (saturação a vácuo com 55 % < S < 80 %, congelamento a −18 °C por ≥ 16 h, banho a 60 °C por 24 h) e três sem condicionamento; RRT = RTc / RT × 100 %.",
    blocos: [],
    params: [
      { k: "mistura", r: "Mistura — ligante (tipo e teor), faixa e agregados (8 a)", ph: "ex.: CBUQ faixa C, CAP 50/70, 5,3 %" },
      { k: "aditivos", r: "Melhorador de adesividade / cal / aditivo de mistura morna (tipo e teor) (8 a)", ph: "ex.: DOPE 0,5 %; sem cal" },
      { k: "gmm", r: "Gmm — densidade relativa máxima medida a 25 °C (6.1)", ph: "ex.: 2,452",
        dica: "NBR 15619 / DNIT 427-ME (Rice), no mesmo teor de ligante dos CPs" },
      { k: "volume", r: "Volume do CP (E) para a eq. 2", tipo: "select",
        opcoes: [["pes", "Pelas pesagens: (m.sss − m.imersa) / 0,99707"], ["dim", "Pelas dimensões: π·D²·H / 4"]],
        dica: "a norma não diz como obter E; o padrão usa as mesmas pesagens do Gmb (NBR 15573)" },
      { k: "unidade", r: "Unidade das leituras de paquímetro", tipo: "select", recarrega: true, opcoes: [["mm", "mm"], ["cm", "cm"]] },
      { k: "carga", r: "Leitura da carga de ruptura", tipo: "select", recarrega: true,
        opcoes: [["N", "Carga em N (célula de carga)"], ["kN", "Carga em kN (célula de carga)"], ["anel", "Anel dinamométrico — leitura × constante (kgf/div)"]] },
      { k: "constante", r: "Constante do anel dinamométrico (kgf/divisão)", ph: "ex.: 2",
        se: function (d) { return (d.params || {}).carga === "anel"; } },
      { k: "vacuo", r: "Vácuo aplicado — pressão absoluta (kPa) (6.5 b)", ph: "13 a 67" },
      { k: "tvacuo", r: "Tempo sob vácuo (min) (6.5 b)", ph: "5 a 10" },
      { k: "tcong", r: "Tempo de congelamento a −18 ± 3 °C (h) (6.5 g)", ph: "≥ 16" },
      { k: "tbanho", r: "Tempo no banho a 60 ± 1 °C (h) (6.5 g)", ph: "24 ± 1" },
      { k: "minimo", r: "RRT mínima de projeto (%) — opcional", ph: "70",
        dica: "limite de projeto/especificação (ex.: DNIT 385/2026-ES: razão ≥ 0,75 = 75 %); aceita razão (0,75) ou % (75)" },
    ],
    padrao: { volume: "pes", unidade: "mm", carga: "N" },
    tabelas: function (d) {
      var P = d.params || {};
      return [
        { chave: "cond", titulo: "Conjunto 1 — condicionados (6.4, 6.5)", rotulo: "CP", iniciais: 3, min: 1, linhas: linhasGrupo(P, true),
          dica: "três CPs saturados a vácuo, congelados e mantidos em banho a 60 °C; rompidos após 2 h a 3 h a 25 °C" },
        { chave: "nc", titulo: "Conjunto 2 — sem condicionamento (6.5 j)", rotulo: "CP", iniciais: 3, min: 1, linhas: linhasGrupo(P, false),
          dica: "três CPs rompidos a 25 °C sem condicionamento" },
      ];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], gmm = num(P.gmm);
      if (!ok(gmm)) avisos.push("Informe o Gmm (6.1) para calcular os vazios com ar e o grau de saturação.");
      else if (gmm < 2 || gmm > 3.2) avisos.push("Gmm = " + fmt(gmm, 3) + " fora da faixa usual de misturas asfálticas — confira.");
      if (P.carga === "anel" && !ok(num(P.constante))) avisos.push("Informe a constante do anel dinamométrico.");
      var fat = P.unidade === "cm" ? 10 : 1;

      function grupo(lista, cond, nome) {
        var cps = (lista || []).map(function (x, i) {
          var o = calcCP(x, P, gmm, cond), r = rotCP(x, i, nome + " — CP");
          if (ok(o.vv) && (o.vv < 6 || o.vv > 8)) avisos.push(r + ": vazios de " + fmt(o.vv, 1) + " % fora de 7 % ± 1 % (5 b, 6.1) — ajuste energia, altura ou massa do CP.");
          if (ok(o.abs) && o.abs > 2) avisos.push(r + ": absorção de " + fmt(o.abs, 2) + " % (> 2 %) — o Gmb por pesagem saturada com superfície seca não é adequado (NBR 15573 / DNIT 428).");
          if (ok(o.H) && (o.H < 50 || o.H > 70)) avisos.push(r + ": altura de " + fmt(o.H, 1) + " mm fora de 50 a 70 mm (4 a).");
          if (ok(o.D) && (o.D < 98 || o.D > 102)) avisos.push(r + ": diâmetro de " + fmt(o.D, 1) + " mm fora de 100 ± 2 mm (4 a).");
          if (ok(o.D) && fat === 1 && o.D < 30) avisos.push(r + ": diâmetro de " + fmt(o.D, 1) + " mm — as leituras parecem estar em cm; ajuste a unidade.");
          if ((o.nh && o.nh < 4) || (o.nd && o.nd < 4)) avisos.push(r + ": a altura e o diâmetro são médias de quatro leituras (6.3); há " + o.nh + " de altura e " + o.nd + " de diâmetro.");
          if (cond && ok(o.S)) {
            if (o.S < 55) avisos.push(r + ": grau de saturação S = " + fmt(o.S, 1) + " % < 55 % — submergir novamente e repetir a saturação com mais vácuo ou mais tempo (6.5 f).");
            else if (o.S > 80) avisos.push(r + ": grau de saturação S = " + fmt(o.S, 1) + " % > 80 % — o corpo de prova deve ser descartado (6.5 f).");
          }
          if (cond && ok(o.J) && o.J < 0) avisos.push(r + ": massa após saturação (B) menor que a massa seca (A) — confira.");
          return o;
        });
        var vals = cps.map(function (o) { return o.rt; }).filter(ok), m = media(vals);
        cps.forEach(function (o) { o.dev = ok(o.rt) && ok(m) && m > 0 ? (o.rt - m) / m * 100 : NaN; });
        var vmax = vals.length ? Math.max.apply(null, cps.map(function (o) { return ok(o.dev) ? Math.abs(o.dev) : 0; })) : NaN;
        if (vals.length && vals.length !== 3) avisos.push(nome + ": a média é de três corpos de prova (5 a, 7); há " + vals.length + ".");
        if (vals.length >= 2 && vmax > 10) avisos.push(nome + ": variação de " + fmt(vmax, 1) + " % entre um CP e a média — a média não obedece ao critério de ± 10 % da DNIT 136-ME (7).");
        return { cps: cps, m: m, n: vals.length, vmax: vmax, vv: media(cps.map(function (o) { return o.vv; })),
          S: media(cps.map(function (o) { return o.S; })), sFora: cps.filter(function (o) { return ok(o.S) && (o.S < 55 || o.S > 80); }).length };
      }
      var c = grupo(d.cond, true, "Condicionados"), n = grupo(d.nc, false, "Não condicionados");
      var rrt = ok(c.m) && ok(n.m) && n.m > 0 ? c.m / n.m * 100 : NaN;   // eq. 5

      var vac = num(P.vacuo), tv = num(P.tvacuo), tc = num(P.tcong), tb = num(P.tbanho);
      if (ok(vac) && (vac < 13 || vac > 67)) avisos.push("Vácuo de " + fmt(vac, 0) + " kPa fora da faixa de 13 a 67 kPa de pressão absoluta (6.5 b).");
      if (ok(tv) && (tv < 5 || tv > 10)) avisos.push("Tempo sob vácuo de " + fmt(tv, 0) + " min fora de 5 a 10 min (6.5 b).");
      if (ok(tc) && tc < 16) avisos.push("Congelamento por " + fmt(tc, 1) + " h — mínimo de 16 h (6.5 g).");
      if (ok(tb) && (tb < 23 || tb > 25)) avisos.push("Banho a 60 °C por " + fmt(tb, 1) + " h — deve ser 24 h ± 1 h (6.5 g).");

      var minimo = num(P.minimo);
      if (ok(minimo) && minimo <= 1.5) minimo *= 100;   // razão -> %
      var conforme = ok(rrt) && ok(minimo) ? Math.round(rrt) >= minimo : null;
      if (conforme === false) avisos.push("RRT = " + fmt(rrt, 0) + " %, abaixo do limite de projeto de " + fmt(minimo, 0) +
        " % — refazer os ensaios alterando/substituindo componentes da mistura ou introduzindo melhorador de adesividade (7).");
      return { tab: { cond: c.cps, nc: n.cps }, resultados: { rtc: c.m, rt: n.m, rrt: rrt, nC: c.n, nN: n.n, vmaxC: c.vmax, vmaxN: n.vmax,
        vvC: c.vv, vvN: n.vv, S: c.S, sFora: c.sFora, minimo: minimo, conforme: conforme }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + fmt(r.rrt, 0) + ' <small>%</small></div>' +
        '<div class="fe-res-r">RRT = RTc / RT × 100 (eq. 5)' + (ok(r.rrt) ? " — razão " + fmt(r.rrt / 100, 2) : "") +
        (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>') + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + fmt(r.rtc, 2) + " / " + fmt(r.rt, 2) + ' MPa</div><div class="fe-res-r">RTc (condicionados) / RT (sem condicionamento)</div></div>' +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + fmt(r.vvC, 1) + " / " + fmt(r.vvN, 1) + " %</div>" +
        '<div class="fe-res-r">Vazios médios (7 % ± 1 %) · S médio ' + fmt(r.S, 1) + " % " +
        (ok(r.S) ? (r.sFora ? '<span class="fe-nok">(' + r.sFora + " fora de 55–80 %)</span>" : '<span class="fe-ok">(55–80 %)</span>') : "") + "</div></div></div>";
    },
    relatorio: {
      notas: "Var = 100 (1 − Gmb/Gmm) (eq. 1), Gmb = A / (m.sss − m.imersa) (NBR 15573 / DNIT 428-ME); Va = Var·E/100 (eq. 2); J = (B − A)/0,99707 (eq. 3); S = 100 J/Va (eq. 4), aceito com 55 % < S < 80 % (6.5 f); σR = 2F/(π·D·H) (DNIT 136-ME); RTc e RT = médias de três CPs, cada uma com os individuais a ± 10 % da média; RRT = RTc/RT × 100 % (eq. 5). A norma não diz como obter o volume E: por padrão, E = (m.sss − m.imersa)/0,99707.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.mistura) rows.push(["Mistura", P.mistura]);
        if (P.aditivos) rows.push(["Aditivos", P.aditivos]);
        rows.push(["RTc — média dos condicionados (" + r.nC + " CPs)", fmt(r.rtc, 2) + " MPa" + (r.vmaxC > 10 ? " — variação de " + fmt(r.vmaxC, 1) + " % (> ± 10 %)" : "")]);
        rows.push(["RT — média dos não condicionados (" + r.nN + " CPs)", fmt(r.rt, 2) + " MPa" + (r.vmaxN > 10 ? " — variação de " + fmt(r.vmaxN, 1) + " % (> ± 10 %)" : "")]);
        rows.push(["Vazios médios (condicionados / não condicionados)", fmt(r.vvC, 1) + " % / " + fmt(r.vvN, 1) + " %"]);
        rows.push(["Grau de saturação médio dos condicionados", fmt(r.S, 1) + " %" + (r.sFora ? " — " + r.sFora + " CP(s) fora de 55–80 %" : "")]);
        rows.push(["Razão de resistência à tração retida (RRT)", fmt(r.rrt, 0) + " % (razão " + fmt(r.rrt / 100, 2) + ")" +
          (r.conforme === null ? "" : r.conforme ? " — atende ao limite de " + fmt(r.minimo, 0) + " %" : " — NÃO ATENDE ao limite de " + fmt(r.minimo, 0) + " %")]);
        return rows;
      },
    },
    exemplos: [
      { nome: "CBUQ 4,0 % CAP — pesagens reais do projeto de traço, saturação e rupturas ilustrativas", dados: function () {
        // PROJETO TRAÇO ASFALTO.xlsx, aba "Traço Teor Ótimo" (Unidade B), tentativa I (4,0 % de CAP 30/45): massas A, imersa e sss
        // reais dos três CPs (vazios 6,6 / 6,8 / 7,5 %), com a DMT 2,5642 da planilha no lugar do Gmm medido.
        // Os três CPs sem condicionamento repetem os pesos com pequenas variações; altura/diâmetro, B e cargas são ilustrativos.
        return { ident: { registro: "EX-DUI-001", obra: "Projeto de traço CBUQ — Unidade B", camada: "CBUQ faixa B, CAP 30/45", origem: "Agregados Y" },
          params: { mistura: "CBUQ faixa B, CAP 30/45, 4,0 %", aditivos: "sem melhorador de adesividade; sem cal", gmm: "2,5642", volume: "pes", unidade: "mm", carga: "N",
            vacuo: "40", tvacuo: "8", tcong: "16", tbanho: "24", minimo: "70" },
          cond: [
            { id: "C1", a: "1194,35", im: "703,97", sss: "1202,41", h1: "63,1", h2: "63,0", h3: "62,9", h4: "63,0", d1: "101,4", d2: "101,5", d3: "101,5", d4: "101,6", b: "1217,9", f: "9870" },
            { id: "C2", a: "1185,87", im: "699,81", sss: "1195,76", h1: "62,9", h2: "63,0", h3: "63,1", h4: "63,0", d1: "101,5", d2: "101,4", d3: "101,5", d4: "101,5", b: "1210,4", f: "9420" },
            { id: "C3", a: "1187,95", im: "698,15", sss: "1198,72", h1: "63,3", h2: "63,2", h3: "63,2", h4: "63,3", d1: "101,5", d2: "101,6", d3: "101,5", d4: "101,5", b: "1214,6", f: "9050" }],
          nc: [
            { id: "N1", a: "1193,10", im: "703,20", sss: "1201,30", h1: "63,0", h2: "63,1", h3: "63,0", h4: "62,9", d1: "101,5", d2: "101,5", d3: "101,4", d4: "101,5", f: "11920" },
            { id: "N2", a: "1186,40", im: "699,60", sss: "1196,10", h1: "63,0", h2: "62,9", h3: "63,0", h4: "63,1", d1: "101,5", d2: "101,6", d3: "101,5", d4: "101,5", f: "11480" },
            { id: "N3", a: "1188,70", im: "699,90", sss: "1197,90", h1: "63,2", h2: "63,2", h3: "63,3", h4: "63,2", d1: "101,4", d2: "101,5", d3: "101,5", d4: "101,6", f: "12310" }] };
      } },
      { nome: "Mistura com DOPE — RRT ≥ 75 %, anel dinamométrico", dados: function () {
        // valores-alvo: Gmm 2,452, vazios ≈ 7 %, S ≈ 70 %, RT ≈ 0,95 MPa, RTc ≈ 0,80 MPa
        function cp(id, a, vv, h, rt, sat) {
          var gmb = 2.452 * (1 - vv / 100), vol = a / gmb, sss = a + 3.5, im = sss - vol;
          var o = { id: id, a: a.toFixed(1).replace(".", ","), im: im.toFixed(1).replace(".", ","), sss: sss.toFixed(1).replace(".", ","),
            h1: h.toFixed(1).replace(".", ","), h2: (h + 0.2).toFixed(1).replace(".", ","), h3: (h - 0.1).toFixed(1).replace(".", ","), h4: (h + 0.1).toFixed(1).replace(".", ","),
            d1: "101,6", d2: "101,5", d3: "101,6", d4: "101,7" };
          var H = h + 0.05, F = rt * Math.PI * 101.6 * H / 2;
          o.f = String(Math.round(F / (2 * 9.80665)));
          if (sat) o.b = (a + sat * (vv * (vol / 0.99707) / 100) * 0.99707 / 100).toFixed(1).replace(".", ",");
          return o;
        }
        return { ident: { registro: "EX-DUI-002", camada: "Capa — CBUQ faixa C", origem: "Pedreira A" },
          params: { mistura: "CBUQ faixa C, CAP 50/70, 5,3 %", aditivos: "DOPE amínico 0,5 % sobre o ligante", gmm: "2,452", volume: "pes", unidade: "mm", carga: "anel", constante: "2",
            vacuo: "30", tvacuo: "7", tcong: "18", tbanho: "24", minimo: "0,75" },
          cond: [cp("C1", 1175.4, 7.2, 62.8, 0.81, 72), cp("C2", 1180.2, 6.8, 63.0, 0.79, 68), cp("C3", 1178.6, 7.0, 62.9, 0.80, 74)],
          nc: [cp("N1", 1177.9, 7.1, 62.9, 0.96), cp("N2", 1181.0, 6.9, 63.1, 0.93), cp("N3", 1176.5, 7.0, 62.8, 0.95)] };
      } },
      { nome: "Sem melhorador — saturação fora da faixa e RRT reprovada", dados: function () {
        return { ident: { registro: "EX-DUI-003", camada: "Binder — CBUQ faixa B", origem: "Pedreira B (granito)" },
          params: { mistura: "CBUQ faixa B, CAP 30/45, 4,8 %", aditivos: "sem melhorador de adesividade", gmm: "2,488", volume: "pes", unidade: "mm", carga: "kN",
            vacuo: "70", tvacuo: "12", tcong: "14", tbanho: "24", minimo: "70" },
          cond: [
            { id: "C1", a: "1190,2", im: "680,1", sss: "1195,0", h1: "63,4", h2: "63,5", h3: "63,3", h4: "63,4", d1: "101,6", d2: "101,6", d3: "101,5", d4: "101,6", b: "1221,3", f: "6,10" },
            { id: "C2", a: "1186,8", im: "679,5", sss: "1191,9", h1: "63,1", h2: "63,2", h3: "63,2", h4: "63,1", d1: "101,5", d2: "101,6", d3: "101,6", d4: "101,6", b: "1204,5", f: "6,55" },
            { id: "C3", a: "1192,5", im: "681,1", sss: "1197,6", h1: "63,5", h2: "63,4", h3: "63,5", h4: "63,6", d1: "101,6", d2: "101,7", d3: "101,6", d4: "101,6", b: "1217,0", f: "5,20" }],
          nc: [
            { id: "N1", a: "1189,5", im: "680,3", sss: "1194,4", h1: "63,3", h2: "63,3", h3: "63,4", h4: "63,3", d1: "101,6", d2: "101,6", d3: "101,5", d4: "101,6", f: "10,40" },
            { id: "N2", a: "1188,0", im: "680,7", sss: "1193,0", h1: "63,2", h2: "63,3", h3: "63,2", h4: "63,2", d1: "101,5", d2: "101,6", d3: "101,6", d4: "101,6", f: "10,05" },
            { id: "N3", a: "1191,1", im: "680,9", sss: "1196,2", h1: "63,4", h2: "63,4", h3: "63,5", h4: "63,4", d1: "101,6", d2: "101,6", d3: "101,6", d4: "101,7", f: "10,70" }] };
      } },
    ],
  };
})();
