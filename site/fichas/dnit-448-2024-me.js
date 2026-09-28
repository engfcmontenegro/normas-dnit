/*
 * Ficha: DNIT 448/2024-ME — Ligante asfáltico — Propriedades reológicas no reômetro de cisalhamento dinâmico (DSR).
 * Registra-se no motor de site/fichas.js (window.FE). Estrutura igual à de site/fichas/dnit-450-2024-me.js.
 * Usa FE.reologiaGrafico, definido em site/fichas/dnit-423-2020-me.js (carregado antes no index.html).
 *
 * Entradas: |G*| e δ lidos no DSR em cada temperatura (uma coluna por temperatura) e, opcionalmente, o teste de
 * linearidade do Anexo D. Contas: G' = |G*| cos δ e G'' = |G*| sen δ (eq. 2 e 3); critério |G*|/sen δ (ligante
 * original e RTFOT) ou |G*|·sen δ (PAV) — seção 10 r/s — com os valores de referência das Tabelas 1 e 2
 * (1,0 kPa, 2,2 kPa e 5000 kPa); temperatura de falha por interpolação log-linear entre as temperaturas ensaiadas
 * (ASTM D7643, bibliografia) e grau PG da ASTM D6373 (referência normativa); verificações das seções 5, 9 e 11.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, fmtSig = FE.fmtSig, esc = FE.esc;
  var graf = function (o) { return FE.reologiaGrafico ? FE.reologiaGrafico(o) : '<div class="fe-graf-vazio">Gráfico indisponível.</div>'; };

  // Tabelas 1 e 2 (9 e, f) e Tabelas 3 e 4 (seção 11)
  var COND = {
    original: { nome: "Ligante original", min: "ligante original", crit: 1.0, tipo: "div", def: [12, 9, 15], ten: [0.12, 0.09, 0.15], rep: [2.3, 6.4], repr: [6.0, 17.0] },
    rtfot: { nome: "Resíduo RTFOT", min: "resíduo RTFOT", crit: 2.2, tipo: "div", def: [10, 8, 12], ten: [0.22, 0.18, 0.26], rep: [3.2, 9.0], repr: [7.8, 22.2] },
    pav: { nome: "Resíduo PAV", min: "resíduo PAV", crit: 5000, tipo: "mul", def: [1, 0.8, 1.2], ten: [500, 400, 600], rep: [4.9, 13.8], repr: [14.2, 40.2] },
  };
  var PG_ALTA = [46, 52, 58, 64, 70, 76, 82, 88];
  var NIVEIS = { deformacao: ["2", "4", "6", "8", "10", "12"], tensao: ["0,015", "0,030", "0,045", "0,060", "0,075", "0,090"] };

  function cond(P) { return COND[P.condicao] || COND.original; }
  function rotCrit(c) { return c.tipo === "div" ? "|G*|/sen δ" : "|G*|·sen δ"; }
  function sig3(x) { return ok(x) ? fmtSig(Number(x.toPrecision(3)), 3) : "—"; }
  function atende(c, v) { return c.tipo === "div" ? v >= c.crit - 1e-12 : v <= c.crit + 1e-12; }

  // temperatura em que o critério é atingido: interpolação linear de log(parâmetro) × T
  function tempFalha(pts, crit) {
    var s = pts.slice().sort(function (a, b) { return a.T - b.T; }), L = Math.log10(crit);
    for (var i = 1; i < s.length; i++) {
      var a = s[i - 1], b = s[i];
      var la = Math.log10(a.p), lb = Math.log10(b.p);
      if ((la - L) * (lb - L) <= 0 && la !== lb) return { T: a.T + (L - la) * (b.T - a.T) / (lb - la), dentro: true };
    }
    return { T: NaN, dentro: false };
  }
  // parâmetro numa temperatura (medido ou interpolado em log)
  function paramEm(pts, T) {
    var s = pts.slice().sort(function (a, b) { return a.T - b.T; });
    for (var i = 0; i < s.length; i++) if (Math.abs(s[i].T - T) < 0.05) return { v: s[i].p, medido: true };
    for (var j = 1; j < s.length; j++) {
      if (s[j - 1].T < T && s[j].T > T) {
        var u = (T - s[j - 1].T) / (s[j].T - s[j - 1].T);
        return { v: Math.pow(10, Math.log10(s[j - 1].p) + u * (Math.log10(s[j].p) - Math.log10(s[j - 1].p))), medido: false };
      }
    }
    return { v: NaN, medido: false };
  }

  FE.FICHAS["dnit-448-2024-me"] = {
    titulo: "Propriedades reológicas no DSR — |G*|, δ e critério de desempenho",
    resumo: "Reômetro de cisalhamento dinâmico com placas paralelas (25 mm/1 mm ou 8 mm/2 mm), 10 rad/s, 4 °C a 88 °C: módulo dinâmico |G*| e ângulo de fase δ por temperatura; G', G''; |G*|/sen δ (original ≥ 1,0 kPa, RTFOT ≥ 2,2 kPa) ou |G*|·sen δ (PAV ≤ 5000 kPa); temperatura de falha, grau PG e teste de linearidade (Anexo D).",
    blocos: [],
    params: [
      { k: "material", r: "Ligante asfáltico", ph: "ex.: CAP 50/70" },
      { k: "condicao", r: "Condição da amostra", tipo: "select", recarrega: true,
        opcoes: [["original", "Ligante original — |G*|/sen δ ≥ 1,0 kPa"], ["rtfot", "Resíduo RTFOT (ABNT NBR 15235) — |G*|/sen δ ≥ 2,2 kPa"],
          ["pav", "Resíduo PAV (ASTM D6521) — |G*|·sen δ ≤ 5000 kPa"]] },
      { k: "placa", r: "Placas paralelas (4.3.1, 5.1)", tipo: "select", recarrega: true,
        opcoes: [["25", "25 mm — gap 1 mm (|G*| de 100 Pa a 100 kPa)"], ["8", "8 mm — gap 2 mm (|G*| de 100 kPa a 10 MPa)"]] },
      { k: "gap", r: "Gap do ensaio (µm) (10 j)", ph: "1000" },
      { k: "modo", r: "Modo de aplicação da carga (10 m)", tipo: "select", recarrega: true,
        opcoes: [["deformacao", "Deformação controlada (Tabela 1)"], ["tensao", "Tensão controlada (Tabela 2)"]] },
      { k: "amp", r: "Amplitude aplicada — deformação (%) ou tensão (kPa) (10 o)", dica: "vale para todas as temperaturas, salvo se informada na tabela" },
      { k: "freq", r: "Frequência (rad/s) (10 n)", ph: "10" },
      { k: "pgAlvo", r: "Temperatura a verificar (°C) — opcional", dica: "ex.: 64 para PG 64 (ligante original/RTFOT) ou 25 para a temperatura intermediária (PAV)" },
      { k: "repet", r: "Repetibilidade — critério em 2 ou 3 corpos de prova numa mesma temperatura (kPa) — opcional", ph: "ex.: 2,31; 2,38",
        dica: "CV = desvio-padrão / média, comparado com a Tabela 3 (seção 11)" },
      { k: "dsr", r: "Fabricante e modelo do DSR (10 a)" },
      { k: "dsrId", r: "Código do DSR (10 b) — se houver mais de um" },
      { k: "software", r: "Versão do software (10 c)" },
      { k: "arquivo", r: "Código do arquivo do ensaio (10 d)" },
      { k: "tempoTotal", r: "Tempo total do ensaio (10 h)", ph: "ex.: 1 h 20 min", dica: "com várias temperaturas, concluir em até 2 h após a preparação da amostra (9 h)" },
      { k: "linear", r: "Teste de linearidade (Anexo D)", tipo: "select", recarrega: true,
        opcoes: [["nao", "Não registrar nesta ficha"], ["sim", "Registrar (placa de 25 mm, 10 rad/s, na temperatura do ensaio)"]] },
      { k: "linT", r: "Temperatura do teste de linearidade (°C)", se: function (d) { return (d.params || {}).linear === "sim"; } },
    ],
    padrao: { condicao: "original", placa: "25", modo: "deformacao", freq: "10", linear: "nao" },
    tabelas: function (d) {
      var P = d.params || {}, c = cond(P), def = P.modo !== "tensao";
      var t = [{
        chave: "temp", titulo: "Temperaturas de ensaio (seção 9)", rotulo: "Temperatura", iniciais: 3, min: 1,
        dica: "uma coluna por temperatura, na ordem do ensaio (placa de 25 mm: da menor para a maior; 8 mm: da maior para a menor — 9 b)",
        linhas: [
          { k: "T", r: "Temperatura do ensaio (10 k)", u: "°C" },
          { k: "corr", r: "Correção de temperatura aplicada (6.3, 10 l) — opcional", u: "°C" },
          { k: "amp", r: "Amplitude, se diferente da dos parâmetros", u: def ? "%" : "kPa" },
          { k: "G", r: "|G*| — módulo dinâmico de cisalhamento (10 p)", u: "kPa" },
          { k: "d", r: "δ — ângulo de fase (10 q)", u: "°" },
          { calc: "Gp", r: "G' = |G*| cos δ — módulo de armazenamento (eq. 2)", u: "kPa", casas: 3 },
          { calc: "Gpp", r: "G'' = |G*| sen δ — módulo de perda (eq. 3)", u: "kPa", casas: 3 },
          { calc: "p", r: rotCrit(c) + " (10 " + (c.tipo === "div" ? "r" : "s") + ")", u: "kPa", casas: 3, destaque: true },
        ],
      }];
      if (P.linear === "sim") {
        if (Array.isArray(d.lin)) { while (d.lin.length < 6) d.lin.push({}); if (d.lin.length > 6) d.lin.length = 6; }
        t.push({ chave: "lin", titulo: "Teste de linearidade — Anexo D", rotulo: "Nível", iniciais: 6, min: 6, fixo: true,
          dica: def ? "deformações de 2 % a 12 % (D d)" : "tensões de 0,015 kPa a 0,090 kPa (D e)",
          linhas: [
            { k: "nivel", r: def ? "Deformação aplicada (D l)" : "Tensão aplicada (D m)", u: def ? "%" : "kPa", ph: "" },
            { k: "G", r: "|G*| (D n)", u: "kPa" },
            { calc: "razao", r: "Razão |G*| / |G*| do menor nível (D f)", u: "%", casas: 1, destaque: true },
          ] });
      }
      return t;
    },
    calcular: function (d) {
      var P = d.params || {}, c = cond(P), avisos = [], def = P.modo !== "tensao";
      var placa = P.placa === "8" ? 8 : 25, ampP = num(P.amp), freq = num(P.freq);
      var temps = (d.temp || []).map(function (x, i) {
        var T = num(x.T), G = num(x.G), dl = num(x.d), rad = dl * Math.PI / 180;
        var o = { T: T, G: G, d: dl };
        if (ok(G) && ok(dl)) {
          o.Gp = G * Math.cos(rad); o.Gpp = G * Math.sin(rad);
          o.p = c.tipo === "div" ? G / Math.sin(rad) : G * Math.sin(rad);
        }
        o.amp = ok(num(x.amp)) ? num(x.amp) : ampP;
        var rot = "Temperatura " + (i + 1) + (ok(T) ? " (" + fmt(T, 1) + " °C)" : "");
        if (ok(dl) && (dl <= 0 || dl > 90)) avisos.push(rot + ": δ = " + fmt(dl, 1) + "° fora de 0° a 90° — confira.");
        if (ok(T) && (T < 4 || T > 88)) avisos.push(rot + ": fora da faixa de 4 °C a 88 °C (9 b).");
        if (ok(G)) {
          if (G < 0.1 || G > 10000) avisos.push(rot + ": |G*| = " + sig3(G) + " kPa fora da faixa do método (100 Pa a 10 MPa, 5.1).");
          else if (placa === 25 && G > 100) avisos.push(rot + ": |G*| = " + sig3(G) + " kPa acima de 100 kPa — use a placa de 8 mm (5.1).");
          else if (placa === 8 && G < 100) avisos.push(rot + ": |G*| = " + sig3(G) + " kPa abaixo de 100 kPa — use a placa de 25 mm (5.1).");
        }
        if ((ok(G) || ok(dl)) && !(ok(G) && ok(dl))) avisos.push(rot + ": informe |G*| e δ.");
        if (ok(o.p) && !ok(T)) avisos.push("Coluna " + (i + 1) + ": informe a temperatura do ensaio.");
        return o;
      });
      var val = temps.filter(function (o) { return ok(o.T) && ok(o.p) && o.p > 0; });
      // incrementos e ordem das temperaturas (9 b)
      for (var i = 1; i < val.length; i++) {
        var dT = val[i].T - val[i - 1].T;
        if (Math.abs(dT) > 10 + 1e-9) avisos.push("Incremento de " + fmt(Math.abs(dT), 1) + " °C entre temperaturas sucessivas; o máximo é 10 °C (9 b).");
        if ((placa === 25 && dT < 0) || (placa === 8 && dT > 0)) {
          avisos.push("Ordem das temperaturas: com a placa de " + placa + " mm o ensaio começa pela " + (placa === 25 ? "menor" : "maior") + " temperatura (9 b).");
          break;
        }
      }
      // gap (5.1) e frequência (4.3.5, 5.1)
      var gap = num(P.gap), gapN = placa === 25 ? 1000 : 2000;
      if (ok(gap) && Math.abs(gap - gapN) > 1e-9) avisos.push("Gap de " + gap + " µm: para a placa de " + placa + " mm o gap do ensaio é " + gapN + " µm (5.1); o gap extra de abaulamento é eliminado antes do ensaio (8.3 c).");
      if (ok(freq) && (freq < 1 || freq > 160)) avisos.push("Frequência de " + fmt(freq, 1) + " rad/s fora de 1 a 160 rad/s (5.1).");
      else if (ok(freq) && Math.abs(freq - 10) > 0.1) avisos.push("Os valores de referência (Tabelas 1 e 2) e os critérios de desempenho são a 10 rad/s (5.1); o ensaio foi a " + fmt(freq, 1) + " rad/s.");
      if (placa === 8 && P.condicao !== "pav") avisos.push("Ligante original ou RTFOT com placa de 8 mm: essas condições são ensaiadas, em geral, em temperaturas altas com a placa de 25 mm (|G*| < 100 kPa) — confira.");
      // amplitude × Tabelas 1 e 2 (9 e, f)
      var faixa = def ? c.def : c.ten;
      var ampFora = temps.filter(function (o) { return ok(o.amp) && ok(o.p) && (o.amp < faixa[1] - 1e-9 || o.amp > faixa[2] + 1e-9); });
      if (ampFora.length) {
        avisos.push((def ? "Deformação" : "Tensão") + " de " + ampFora.map(function (o) { return fmt(o.amp, def ? 1 : 3); }).filter(function (v, k, a) { return a.indexOf(v) === k; }).join("; ") +
          (def ? " %" : " kPa") + " fora da faixa da Tabela " + (def ? "1" : "2") + " para " + c.min + " (" + fmt(faixa[1], def ? 1 : 2) + " a " + fmt(faixa[2], def ? 1 : 2) + (def ? " %" : " kPa") +
          "); fora dela, só na região de linearidade verificada no Anexo D, registrando as condições (NOTA 14)." +
          (!def && P.condicao === "pav" ? " Observação: a Tabela 2 traz 500 kPa (400 a 600 kPa) para o resíduo PAV; na ASTM D7175 o valor é 50 kPa (40 a 60 kPa) — confira." : ""));
      }
      if (!temps.some(function (o) { return ok(o.amp); }) && val.length) avisos.push("Informe a amplitude de " + (def ? "deformação (%)" : "tensão (kPa)") + " aplicada, com três algarismos significativos (10 o).");
      // critério por temperatura
      val.forEach(function (o) { o.ok = atende(c, o.p); });
      var falha = tempFalha(val, c.crit);
      var r = { cond: c, temps: temps, val: val, Tc: falha.T, dentro: falha.dentro, placa: placa, def: def };
      if (val.length && !falha.dentro) {
        var todos = val.every(function (o) { return o.ok; }), nenhum = val.every(function (o) { return !o.ok; });
        r.faixaTc = todos ? (c.tipo === "div" ? "acima de " : "abaixo de ") + fmt(c.tipo === "div" ? Math.max.apply(null, val.map(function (o) { return o.T; })) : Math.min.apply(null, val.map(function (o) { return o.T; })), 1) + " °C"
          : nenhum ? (c.tipo === "div" ? "abaixo de " : "acima de ") + fmt(c.tipo === "div" ? Math.min.apply(null, val.map(function (o) { return o.T; })) : Math.max.apply(null, val.map(function (o) { return o.T; })), 1) + " °C" : "";
        if (val.length >= 1) avisos.push("As temperaturas ensaiadas não cercam o critério de " + rotCrit(c) + (c.tipo === "div" ? " ≥ " : " ≤ ") + fmt(c.crit, c.crit < 10 ? 1 : 0) +
          " kPa: a temperatura de falha fica " + (r.faixaTc || "indeterminada") + " — ensaie mais uma temperatura para interpolá-la.");
      }
      // grau PG (ASTM D6373): alta temperatura em múltiplos de 6 °C; PAV: temperatura intermediária em passos de 3 °C
      if (ok(r.Tc)) {
        if (c.tipo === "div") r.pg = PG_ALTA.filter(function (t) { return t <= r.Tc + 1e-9; }).pop() || null;
        else r.pg = Math.ceil((r.Tc - 1 - 1e-9) / 3) * 3 + 1;  // ..., 19, 22, 25, 28, ... (ASTM D6373)
      }
      // temperatura a verificar
      var alvo = num(P.pgAlvo);
      if (ok(alvo) && val.length) {
        var pe = paramEm(val, alvo);
        r.alvo = { T: alvo, v: pe.v, medido: pe.medido, ok: ok(pe.v) ? atende(c, Number(pe.v.toPrecision(3))) : null };
        if (!ok(pe.v)) avisos.push("A temperatura a verificar (" + fmt(alvo, 1) + " °C) está fora das temperaturas ensaiadas — ensaie nela.");
        else if (!r.alvo.ok) avisos.unshift(rotCrit(c) + " = " + sig3(pe.v) + " kPa a " + fmt(alvo, 1) + " °C" + (pe.medido ? "" : " (interpolado)") + ": não atende ao critério " +
          (c.tipo === "div" ? "≥ " : "≤ ") + fmt(c.crit, c.crit < 10 ? 1 : 0) + " kPa (Tabelas 1 e 2; ASTM D6373).");
        if (ok(pe.v) && !pe.medido) avisos.push("Valor a " + fmt(alvo, 1) + " °C obtido por interpolação log-linear; a especificação pede o ensaio na própria temperatura.");
      }
      // repetibilidade (seção 11, Tabela 3)
      var reps = String(P.repet || "").split(/[;\s]+/).map(num).filter(ok);
      if (reps.length >= 2) {
        var m = reps.reduce(function (a, b) { return a + b; }, 0) / reps.length;
        var sd = Math.sqrt(reps.reduce(function (a, b) { return a + (b - m) * (b - m); }, 0) / (reps.length - 1));
        var cv = sd / m * 100, lim = reps.length >= 3 ? c.rep[0] : c.rep[1];
        r.rep = { n: reps.length, media: m, cv: cv, lim: lim };
        if (reps.length > 3) avisos.push("A Tabela 3 prevê 2 ou 3 amostras; usou-se o limite de 3 amostras.");
        if (cv > lim) avisos.push("Repetibilidade: CV de " + fmt(cv, 1) + " % entre " + reps.length + " determinações, acima de " + fmt(lim, 1) + " % (Tabela 3, " + c.min + ") — resultados suspeitos (seção 11).");
      }
      // linearidade (Anexo D)
      var lin = [];
      if (P.linear === "sim") {
        var niv = NIVEIS[def ? "deformacao" : "tensao"];
        var G1 = NaN;
        lin = (d.lin || []).map(function (x, k) {
          var nv = ok(num(x.nivel)) ? num(x.nivel) : num(niv[k]), G = num(x.G);
          if (ok(G) && !ok(G1)) G1 = G;
          return { nivel: nv, G: G };
        });
        lin.forEach(function (o) { o.razao = ok(o.G) && ok(G1) ? o.G / G1 * 100 : NaN; });
        var comDados = lin.filter(function (o) { return ok(o.razao); });
        var limLin = NaN;
        for (var q = 0; q < comDados.length; q++) { if (comDados[q].razao >= 95 - 1e-9) limLin = comDados[q].nivel; else break; }
        r.linLim = limLin; r.linN = comDados.length;
        if (comDados.length && comDados.some(function (o) { return o.razao < 95 - 1e-9; }))
          avisos.push("Teste de linearidade: razão abaixo de 95 % a partir de " + fmt(comDados.filter(function (o) { return o.razao < 95 - 1e-9; })[0].nivel, def ? 1 : 3) + (def ? " %" : " kPa") + " — região linear até " + (ok(limLin) ? fmt(limLin, def ? 1 : 3) + (def ? " %" : " kPa") : "abaixo do primeiro nível; refaça com níveis menores (D i)") + " (D h).");
        var ampMax = Math.max.apply(null, temps.map(function (o) { return o.amp; }).filter(ok).concat([-Infinity]));
        if (ok(limLin) && ok(ampMax) && ampMax > limLin + 1e-9) avisos.push("A amplitude do ensaio (" + fmt(ampMax, def ? 1 : 3) + (def ? " %" : " kPa") + ") passa do limite da região linear verificada (" + fmt(limLin, def ? 1 : 3) + (def ? " %" : " kPa") + ") — NOTA 14.");
        if (ok(num(P.linT)) && !val.some(function (o) { return Math.abs(o.T - num(P.linT)) < 0.05; })) avisos.push("O teste de linearidade deve ser feito na temperatura do ensaio (Anexo D).");
      } else if (P.condicao !== "pav" && val.length) {
        avisos.push("Faça o teste de linearidade do Anexo D para cada ligante original ou RTFOT (9 a) — registre-o nesta ficha ou anexe-o.");
      }
      return { tab: { temp: temps.map(function (o) { return { Gp: o.Gp, Gpp: o.Gpp, p: o.p }; }), lin: lin.map(function (o) { return { razao: o.razao }; }) },
        resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, c = r.cond;
      function cx(v, rot, p) { return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var crit = rotCrit(c) + (c.tipo === "div" ? " ≥ " : " ≤ ") + fmt(c.crit, c.crit < 10 ? 1 : 0) + " kPa";
      var h = '<div class="fe-res">' +
        cx(ok(r.Tc) ? fmt(r.Tc, 1) + " <small>°C</small>" : (r.faixaTc ? "<small>" + esc(r.faixaTc) + "</small>" : "—"), "Temperatura de falha — " + esc(crit) + " (interpolação log-linear)") +
        cx(r.pg ? (c.tipo === "div" ? "PG " + r.pg + "-xx" : r.pg + " °C") : "—", c.tipo === "div" ? "Grau PG de alta temperatura atendido por esta condição (ASTM D6373)" : "Temperatura intermediária atendida (passos de 3 °C, ASTM D6373)", true);
      if (r.alvo) h += cx(sig3(r.alvo.v) + " kPa", rotCrit(c) + " a " + fmt(r.alvo.T, 1) + " °C" + (r.alvo.medido ? "" : " (interpolado)") +
        (r.alvo.ok === null ? "" : r.alvo.ok ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>'), true);
      if (r.rep) h += cx(fmt(r.rep.cv, 1) + " %", "CV entre " + r.rep.n + " determinações (máx. " + fmt(r.rep.lim, 1) + " %, Tabela 3)", true);
      if (r.linN) h += cx(ok(r.linLim) ? "até " + String(r.linLim).replace(".", ",") + (calc.resultados.def ? " %" : " kPa") : "—", "Região viscoelástica linear (razão ≥ 95 %, Anexo D)", true);
      return h + "</div>";
    },
    graficos: function (calc, d, opt) {
      opt = opt || {};
      var r = calc.resultados, c = r.cond, W = opt.w || 560, H = opt.h || 300, out = [];
      var pts = r.val.slice().sort(function (a, b) { return a.T - b.T; });
      out.push(graf({ w: W, h: H, imprimir: opt.imprimir, ylog: true, xlabel: "Temperatura (°C)", ylabel: rotCrit(c) + " (kPa)",
        series: [{ nome: rotCrit(c), pts: pts.map(function (o) { return [o.T, o.p]; }), cor: 0, linha: true, ponto: true },
          { nome: ok(r.Tc) ? "temperatura de falha " + fmt(r.Tc, 1) + " °C" : "", pts: ok(r.Tc) ? [[r.Tc, c.crit]] : [], cor: 3, ponto: true, raio: 5 }],
        hlinhas: [{ y: c.crit, rot: "critério " + fmt(c.crit, c.crit < 10 ? 1 : 0) + " kPa", cor: 3 }],
        vazio: "O gráfico aparece com |G*| e δ de ao menos uma temperatura." }));
      out.push(graf({ w: W, h: Math.round(H * 0.8), imprimir: opt.imprimir, y0: 0, y1: 90, xlabel: "Temperatura (°C)", ylabel: "δ (°)",
        series: [{ nome: "", pts: pts.map(function (o) { return [o.T, o.d]; }), cor: 1, linha: true, ponto: true }], legEsq: true,
        vazio: "" }));
      var lin = (calc.tab.lin || []).map(function (o, k) { return [num(((d.lin || [])[k] || {}).nivel) || num(NIVEIS[(d.params || {}).modo === "tensao" ? "tensao" : "deformacao"][k]), o.razao]; })
        .filter(function (p) { return ok(p[0]) && ok(p[1]); });
      if (lin.length) out.push(graf({ w: W, h: Math.round(H * 0.8), imprimir: opt.imprimir, xlabel: (d.params || {}).modo === "tensao" ? "Tensão (kPa)" : "Deformação (%)", ylabel: "|G*| / |G*| inicial (%)",
        y0: Math.min(90, Math.min.apply(null, lin.map(function (p) { return p[1]; })) - 2), y1: 102,
        series: [{ nome: "teste de linearidade (Anexo D)", pts: lin, cor: 2, linha: true, ponto: true }], hlinhas: [{ y: 95, rot: "95 %", cor: 3 }], legEsq: true }));
      return out;
    },
    relatorio: {
      notas: "G' = |G*| cos δ (eq. 2); G'' = |G*| sen δ (eq. 3); critério |G*|/sen δ para ligante original (≥ 1,0 kPa) e resíduo RTFOT (≥ 2,2 kPa) e |G*|·sen δ para resíduo PAV (≤ 5000 kPa) — seção 10 r/s e Tabelas 1 e 2. " +
        "|G*| com três algarismos significativos e δ com 0,1° (10 p, q). Temperatura de falha por interpolação linear de log(critério) entre as temperaturas ensaiadas (ASTM D7643, bibliografia); " +
        "grau PG pela ASTM D6373 (referência normativa): alta temperatura em múltiplos de 6 °C; temperatura intermediária (PAV) em passos de 3 °C. " +
        "Repetibilidade: CV = desvio-padrão/média (seção 11), comparado com a Tabela 3 (2 ou 3 amostras). Linearidade: razão ≥ 95 % do módulo no menor nível (Anexo D).",
      resultados: function (calc, d) {
        var r = calc.resultados, c = r.cond, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Ligante asfáltico", P.material + " — " + c.min]);
        rows.push(["Diâmetro da placa / gap (10 i, j)", fmt(r.placa, 1) + " mm / " + (ok(num(P.gap)) ? String(num(P.gap)) : (r.placa === 25 ? "1000" : "2000")) + " µm"]);
        rows.push(["Modo de carga / frequência (10 m, n)", (P.modo === "tensao" ? "tensão controlada" : "deformação controlada") + " / " + (ok(num(P.freq)) ? fmt(num(P.freq), 1) : "10,0") + " rad/s"]);
        r.val.forEach(function (o) {
          rows.push([fmt(o.T, 1) + " °C", "|G*| = " + sig3(o.G) + " kPa; δ = " + fmt(o.d, 1) + "°; " + rotCrit(c) + " = " + sig3(o.p) + " kPa — " + (o.ok ? "atende" : "não atende") +
            (ok(o.amp) ? " (" + (P.modo === "tensao" ? "tensão " + fmt(o.amp, 3) + " kPa" : "deformação " + fmt(o.amp, 1) + " %") + ")" : "")]);
        });
        rows.push(["Temperatura de falha (" + rotCrit(c) + (c.tipo === "div" ? " = " : " = ") + fmt(c.crit, c.crit < 10 ? 1 : 0) + " kPa)", ok(r.Tc) ? fmt(r.Tc, 1) + " °C" : (r.faixaTc || "—")]);
        if (r.pg) rows.push([c.tipo === "div" ? "Grau PG de alta temperatura desta condição (ASTM D6373)" : "Temperatura intermediária atendida (ASTM D6373)", c.tipo === "div" ? "PG " + r.pg : fmt(r.pg, 0) + " °C"]);
        if (r.alvo) rows.push(["Verificação a " + fmt(r.alvo.T, 1) + " °C", sig3(r.alvo.v) + " kPa" + (r.alvo.medido ? "" : " (interpolado)") + (r.alvo.ok === null ? "" : r.alvo.ok ? " — ATENDE" : " — NÃO ATENDE")]);
        if (r.rep) rows.push(["Repetibilidade (seção 11)", "CV = " + fmt(r.rep.cv, 1) + " % em " + r.rep.n + " determinações (máx. " + fmt(r.rep.lim, 1) + " %, Tabela 3)"]);
        if (r.linN) rows.push(["Linearidade (Anexo D)", ok(r.linLim) ? "linear até " + String(r.linLim).replace(".", ",") + (P.modo === "tensao" ? " kPa" : " %") + (ok(num(P.linT)) ? " a " + fmt(num(P.linT), 1) + " °C" : "") : "sem região linear nos níveis ensaiados"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "CAP 50/70 original — placa de 25 mm, 4 temperaturas, com teste de linearidade", dados: function () {
        return { ident: { registro: "EX-DSR-001", data: "2026-05-04", obra: "Obra A", origem: "Distribuidora A", camada: "CAP 50/70" },
          params: { material: "CAP 50/70", condicao: "original", placa: "25", gap: "1000", modo: "deformacao", amp: "12", freq: "10", pgAlvo: "64",
            dsr: "Reômetro modelo X", software: "v. 1.0", arquivo: "DSR-2026-051", tempoTotal: "1 h 10 min", linear: "sim", linT: "64" },
          temp: [{ T: "58,0", G: "5,00", d: "84,6" }, { T: "64,0", G: "2,20", d: "86,0" }, { T: "70,0", G: "1,01", d: "87,3" }, { T: "76,0", G: "0,483", d: "88,4" }],
          lin: [{ nivel: "2", G: "2,23" }, { nivel: "4", G: "2,22" }, { nivel: "6", G: "2,21" }, { nivel: "8", G: "2,20" }, { nivel: "10", G: "2,19" }, { nivel: "12", G: "2,17" }] };
      } },
      { nome: "CAP 50/70 — resíduo RTFOT, não atende a 70 °C, repetições discordantes e gap fora", dados: function () {
        return { ident: { registro: "EX-DSR-002", data: "2026-05-04", obra: "Obra A", origem: "Distribuidora A", camada: "CAP 50/70 — resíduo RTFOT" },
          params: { material: "CAP 50/70", condicao: "rtfot", placa: "25", gap: "1050", modo: "deformacao", amp: "10", freq: "10", pgAlvo: "70", repet: "3,37; 3,95", linear: "nao" },
          temp: [{ T: "64,0", G: "3,35", d: "84,1" }, { T: "70,0", G: "1,52", d: "85,9" }] };
      } },
      { nome: "Resíduo PAV — placa de 8 mm, temperatura intermediária", dados: function () {
        return { ident: { registro: "EX-DSR-003", data: "2026-05-06", obra: "Obra B", origem: "Distribuidora C", camada: "CAP 50/70 — resíduo PAV" },
          params: { material: "CAP 50/70", condicao: "pav", placa: "8", gap: "2000", modo: "deformacao", amp: "1", freq: "10", pgAlvo: "25", linear: "nao" },
          temp: [{ T: "28,0", G: "3060", d: "50,2" }, { T: "25,0", G: "4890", d: "47,8" }, { T: "22,0", G: "7700", d: "45,3" }] };
      } },
    ],
  };
})();
