/*
 * Ficha: DNIT 438/2022-PRO — Seleção granulométrica de agregados para concreto asfáltico pelo Método Bailey.
 * Dois modos: verificação do intertravamento de uma mistura conhecida (seção 4: TNM, peneiras de controle das
 * Tabelas 1 e 3, comportamento graúdo/fino pela Tabela 2, proporções AG, GAF e FAF — eq. 5 a 7 — e limites das
 * Tabelas 4 e 5) e seleção granulométrica (5.3 a–n: MUE, vazios dos graúdos — eq. 10 —, porcentagens iniciais,
 * correções — eq. 11 e 12 —, material de enchimento — eq. 13 e 14) seguida da verificação da mistura final.
 * Importa granulometria (DNIT 412-ME), massas unitárias (DNIT 437-ME) e MEsb (DNIT 411-ME / 413-ME).
 * Registra-se em window.FE.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  var PEN = [37.5, 25, 19, 12.5, 9.5, 6.3, 4.75, 2.36, 1.18, 0.6, 0.3, 0.15, 0.075];
  var NOME = { 37.5: "1 ½\"", 25: "1\"", 19: "3/4\"", 12.5: "1/2\"", 9.5: "3/8\"", 6.3: "1/4\"", 4.75: "nº 4", 2.36: "nº 8", 1.18: "nº 16", 0.6: "nº 30", 0.3: "nº 50", 0.15: "nº 100", 0.075: "nº 200" };
  function kp(mm) { return "p" + String(mm).replace(".", "_"); }
  function fmm(mm) { return fmt(mm, mm < 1 ? 3 : 2).replace(/,?0+$/, ""); }
  function npen(mm) { return NOME[mm] + " (" + fmm(mm) + " mm)"; }
  // Tabela 1 (comportamento graúdo) e Tabela 3 (fino): TNM → [PM, PCP, PCS, PCT]
  var TAB1 = { 37.5: [19, 9.5, 2.36, 0.6], 25: [12.5, 4.75, 1.18, 0.3], 19: [9.5, 4.75, 1.18, 0.3], 12.5: [6.3, 2.36, 0.6, 0.15], 9.5: [4.75, 2.36, 0.6, 0.15], 4.75: [2.36, 1.18, 0.3, 0.075] };
  var TAB3 = { 37.5: [4.75, 2.36, 0.6, 0.15], 25: [2.36, 1.18, 0.3, 0.075], 19: [2.36, 1.18, 0.3, 0.075], 12.5: [1.18, 0.6, 0.15, null], 9.5: [1.18, 0.6, 0.15, null], 4.75: [0.6, 0.3, 0.075, null] };
  var TAB2 = { 25: [4.75, 40], 19: [4.75, 47], 12.5: [2.36, 39], 9.5: [2.36, 47] };  // PCP e % de controle
  var TAB4_AG = { 37.5: [0.80, 0.95], 25: [0.70, 0.85], 19: [0.60, 0.75], 12.5: [0.50, 0.65], 9.5: [0.40, 0.55], 4.75: [0.30, 0.45] };
  var LIM_F = [0.35, 0.50], TAB5_AG = [0.60, 1.0];

  function maisProxima(v) { return PEN.reduce(function (a, b) { return Math.abs(b - v) < Math.abs(a - v) ? b : a; }); }
  function controle(tnm) {  // eq. 1 a 4 (peneira de abertura mais próxima) quando o TNM não está na Tabela 1
    if (TAB1[tnm]) return { pen: TAB1[tnm], fonte: "Tabela 1" };
    var pcp = maisProxima(0.22 * tnm), pcs = maisProxima(0.22 * pcp);
    return { pen: [maisProxima(0.5 * tnm), pcp, pcs, maisProxima(0.22 * pcs)], fonte: "eq. 1 a 4" };
  }
  function txt(v, c) { return v.toFixed(c).replace(".", ","); }  // sem separador de milhar (num lê "1.390" como 1,39)
  function r2(x) { return ok(x) ? Math.round(x * 100) / 100 : NaN; }

  // tipos das colunas: graúdos, finos e material de enchimento
  function colunas(P) {
    var nG = Math.max(1, Math.min(4, Number(P.nG) || 2)), nF = Math.max(1, Math.min(3, Number(P.nF) || 1)), cols = [];
    for (var i = 0; i < nG; i++) cols.push({ tipo: "G", nome: "AG" + (i + 1) });
    for (var j = 0; j < nF; j++) cols.push({ tipo: "F", nome: "AF" + (j + 1) });
    if (P.mate === "sim") cols.push({ tipo: "E", nome: "MatE" });
    return cols;
  }
  // % passante de uma coluna em cada peneira; em branco acima da 1ª peneira preenchida = 100 %
  function passantes(x) {
    var achou = false;
    return PEN.map(function (mm) {
      var v = num(x[kp(mm)]);
      if (ok(v)) { achou = true; return v; }
      return achou ? NaN : 100;
    });
  }
  // composição: frações (%) × passantes → mistura
  function compor(pas, pct) {
    return PEN.map(function (mm, j) {
      var s = 0, falta = false;
      pas.forEach(function (p, i) { if (!pct[i]) return; if (!ok(p[j])) falta = true; else s += pct[i] * p[j] / 100; });
      return falta ? NaN : s;
    });
  }
  function passNa(mist, mm) { var j = PEN.indexOf(mm); return j >= 0 ? mist[j] : NaN; }
  // TNM (3.5): peneira imediatamente acima da que retém mais de 10 % (acumulado)
  function tnmDe(mist) {
    for (var j = 0; j < PEN.length; j++) if (ok(mist[j]) && 100 - mist[j] > 10) return j > 0 ? PEN[j - 1] : PEN[0];
    return NaN;
  }

  // verificação da seção 4 sobre uma granulometria de mistura
  function verificar(mist, P, avisos) {
    var V = { tnm: tnmDe(mist) };
    if (!ok(V.tnm)) { avisos.push("Não foi possível determinar o TNM da mistura (3.5) — confira as granulometrias."); return V; }
    var C = controle(V.tnm);
    if (C.fonte !== "Tabela 1") avisos.push("TNM de " + fmm(V.tnm) + " mm fora da Tabela 1: peneiras de controle pelas eq. 1 a 4 (abertura mais próxima).");
    V.orig = { PM: C.pen[0], PCP: C.pen[1], PCS: C.pen[2], PCT: C.pen[3], fonte: C.fonte };
    ["PM", "PCP", "PCS", "PCT"].forEach(function (k) { V.orig["p" + k] = passNa(mist, V.orig[k]); });
    var o = V.orig;
    o.AG = (o.pPM - o.pPCP) / (100 - o.pPM); o.GAF = o.pPCS / o.pPCP; o.FAF = o.pPCT / o.pPCS;  // eq. 5, 6 e 7
    // comportamento (4 d, Tabela 2)
    var t2 = TAB2[V.tnm];
    V.controle = t2 ? t2[1] : NaN;
    if (P.comportamento === "graudo" || P.comportamento === "fino") { V.comp = P.comportamento; V.compFonte = "definido pelo usuário"; }
    else if (t2) { V.comp = o.pPCP <= t2[1] ? "graudo" : "fino"; V.compFonte = "Tabela 2: passante na PCP " + fmt(o.pPCP, 1) + " % " + (V.comp === "graudo" ? "≤ " : "> ") + fmt(t2[1], 1) + " %"; }
    else { V.comp = "graudo"; V.compFonte = "TNM sem ponto de controle na Tabela 2 — adotado graúdo"; avisos.push("A Tabela 2 não traz ponto de controle para TNM de " + fmm(V.tnm) + " mm: comportamento adotado como graúdo — escolha-o no parâmetro \"Comportamento\" se for o caso."); }
    if (V.comp === "graudo") {
      V.usar = o;
      V.lim = { AG: TAB4_AG[V.tnm] || null, GAF: LIM_F, FAF: LIM_F, tab: "Tabela 4" };
    } else {
      // 4 e: fração passante na PCP original como 100 %; novas peneiras (Tabela 3)
      var t3 = TAB3[V.tnm], base = o.pPCP;
      V.novo = { mist: mist.map(function (v, j) { return PEN[j] <= o.PCP + 1e-9 && ok(v) && base > 0 ? v / base * 100 : NaN; }) };
      if (!t3) { avisos.push("TNM de " + fmm(V.tnm) + " mm fora da Tabela 3 — não há peneiras de controle para o comportamento fino."); V.usar = null; return V; }
      var n = V.novo;
      n.PM = t3[0]; n.PCP = t3[1]; n.PCS = t3[2]; n.PCT = t3[3]; n.fonte = "Tabela 3";
      ["PM", "PCP", "PCS", "PCT"].forEach(function (k) { n["p" + k] = n[k] === null ? NaN : passNa(n.mist, n[k]); });
      n.AG = (n.pPM - n.pPCP) / (100 - n.pPM); n.GAF = n.pPCS / n.pPCP; n.FAF = n.PCT === null ? NaN : n.pPCT / n.pPCS;
      V.usar = n;
      V.lim = { AG: TAB5_AG, GAF: LIM_F, FAF: n.PCT === null ? null : LIM_F, tab: "Tabela 5" };
      if (n.PCT === null) avisos.push("Comportamento fino com TNM de " + fmm(V.tnm) + " mm: a Tabela 3 não define PCT — FAF não calculada.");
    }
    V.prop = ["AG", "GAF", "FAF"].map(function (k) {
      var v = V.usar[k], lim = V.lim[k], vr = r2(v);
      return { k: k, v: v, vr: vr, lim: lim, atende: lim && ok(vr) ? vr >= lim[0] - 1e-9 && vr <= lim[1] + 1e-9 : null };
    });
    V.enquadra = V.prop.every(function (p) { return p.atende !== false; }) && V.prop.some(function (p) { return p.atende === true; });
    V.prop.forEach(function (p) {
      if (p.atende === false) avisos.push("Proporção " + p.k + " = " + fmt(p.vr, 2) + " fora do limite " + fmt(p.lim[0], 2) + "–" + fmt(p.lim[1], 2) + " (" + V.lim.tab + ") — altere os valores escolhidos (5.2) e refaça a seleção.");
      if (!ok(p.v) && p.lim) avisos.push("Proporção " + p.k + " não calculada: falta o passante numa das peneiras de controle.");
    });
    if (!V.lim.AG) avisos.push("Sem limite de AG na Tabela 4 para TNM de " + fmm(V.tnm) + " mm.");
    return V;
  }

  // seleção granulométrica (5.3 a–n)
  function selecionar(d, P, cols, pas, avisos) {
    var ag = d.ag || [], S = { passos: [] }, pMUs = num(P.pMUs), desej = num(P.filler);
    var G = [], F = [], E = null;
    cols.forEach(function (c, i) {
      var x = ag[i] || {}, o = { i: i, nome: (x.nome || c.nome), col: c.nome, mesb: num(x.mesb), mus: num(x.mus), muc: num(x.muc), pFr: num(x.pFr), pas: pas[i] };
      if (c.tipo === "G") G.push(o); else if (c.tipo === "F") F.push(o); else E = o;
    });
    if (!ok(pMUs)) { avisos.push("Informe o percentual da MUs adotado como MUE dos graúdos (5.2.1)."); return null; }
    var faixa = P.tipoMistura === "fino" ? [60, 85] : [95, 105];
    if (pMUs < faixa[0] || pMUs > faixa[1]) avisos.push("MUE = " + fmt(pMUs, 0) + " % da MUs, fora da faixa recomendada de " + faixa[0] + " % a " + faixa[1] + " % para mistura de comportamento " + (P.tipoMistura === "fino" ? "fino" : "graúdo") + " (5.2.1).");
    var sG = G.reduce(function (s, o) { return s + (ok(o.pFr) ? o.pFr : 0); }, 0), sF = F.reduce(function (s, o) { return s + (ok(o.pFr) ? o.pFr : 0); }, 0);
    if (Math.abs(sG - 100) > 0.05) avisos.push("As porcentagens dos agregados graúdos na mistura de graúdos somam " + fmt(sG, 1) + " % (devem somar 100 %, 5.2.3).");
    if (Math.abs(sF - 100) > 0.05) avisos.push("As porcentagens dos agregados finos na mistura de finos somam " + fmt(sF, 1) + " % (devem somar 100 %, 5.2.4).");
    var falta = G.filter(function (o) { return !ok(o.mus) || !ok(o.mesb) || !ok(o.pFr); }).map(function (o) { return o.col; })
      .concat(F.filter(function (o) { return !ok(o.muc) || !ok(o.pFr); }).map(function (o) { return o.col; }));
    if (falta.length) { avisos.push("Faltam dados para a seleção (MUs e MEsb dos graúdos, MUc dos finos e % na fração): " + falta.join(", ") + " (5.1)."); return null; }
    // a) b) c)
    var vvTot = 0;
    G.forEach(function (o) { o.mue = o.mus * pMUs / 100; o.contrib = o.mue * o.pFr / 100; o.vv = (1 - o.mue / (1000 * o.mesb)) * o.pFr; vvTot += o.vv; });
    // d) e) f)
    F.forEach(function (o) { o.mue = o.muc; o.contrib = o.mue * o.pFr / 100 * vvTot / 100; });
    var todos = G.concat(F), muMist = todos.reduce(function (s, o) { return s + o.contrib; }, 0);
    todos.forEach(function (o) { o.ini = o.contrib / muMist * 100; });
    // g) granulometria preliminar, TNM e PCP
    var pctIni = cols.map(function (c, i) { var o = todos.filter(function (t) { return t.i === i; })[0]; return o ? o.ini : 0; });
    var mistIni = compor(pas, pctIni), tnm0 = tnmDe(mistIni), pcp0 = ok(tnm0) ? controle(tnm0).pen[1] : NaN;
    if (!ok(pcp0)) { avisos.push("Não foi possível determinar o TNM e a PCP da granulometria preliminar (5.3 g)."); return null; }
    // h) i) j)
    var afAgTot = 0, agAfTot = 0;
    G.forEach(function (o) { o.pPCP = passNa(o.pas, pcp0); o.afag = o.ini * o.pPCP / 100; afAgTot += o.afag; });
    F.forEach(function (o) { o.rPCP = 100 - passNa(o.pas, pcp0); o.agaf = o.ini * o.rPCP / 100; agAfTot += o.agaf; });
    var agTot = G.reduce(function (s, o) { return s + o.ini; }, 0), afTot = F.reduce(function (s, o) { return s + o.ini; }, 0);
    // k) eq. 11 e 12
    G.forEach(function (o) { o.cor = o.ini + o.afag - o.ini * agAfTot / agTot; });
    F.forEach(function (o) { o.cor = o.ini + o.agaf - o.ini * afAgTot / afTot; });
    // l) filler da mistura corrigida
    var filler = todos.reduce(function (s, o) { return s + o.cor * passNa(o.pas, 0.075) / 100; }, 0);
    // m) eq. 13 (em %: diferença / % de filler no MatE × 100)
    var mate = 0, fMate = E ? passNa(E.pas, 0.075) : NaN;
    if (ok(desej)) {
      if (desej > filler) {
        if (E && ok(fMate) && fMate > 0) mate = (desej - filler) / fMate * 100;
        else avisos.push("Filler da mistura (" + fmt(filler, 2) + " %) abaixo do desejado (" + fmt(desej, 2) + " %): inclua uma coluna de material de enchimento (5.3 m).");
      } else if (desej < filler - 1e-9) avisos.push("O filler dos agregados (" + fmt(filler, 2) + " %) já excede o desejado (" + fmt(desej, 2) + " %): sem material de enchimento; reveja os valores escolhidos (5.2.2).");
    } else avisos.push("Informe a porcentagem desejada de filler (5.2.2).");
    // n) eq. 14
    var afCorTot = F.reduce(function (s, o) { return s + o.cor; }, 0);
    G.forEach(function (o) { o.fin = o.cor; });
    F.forEach(function (o) { o.fin = o.cor - o.cor * mate / afCorTot; });
    if (E) E.fin = mate;
    var pctFin = cols.map(function (c, i) { var o = todos.concat(E ? [E] : []).filter(function (t) { return t.i === i; })[0]; return o ? o.fin : 0; });
    return { G: G, F: F, E: E, vvTot: vvTot, muMist: muMist, mistIni: mistIni, tnm0: tnm0, pcp0: pcp0, afAgTot: afAgTot, agAfTot: agAfTot, agTot: agTot, afTot: afTot,
      filler: filler, desej: desej, mate: mate, fMate: fMate, pctIni: pctIni, pct: pctFin, pMUs: pMUs };
  }

  FE.FICHAS["dnit-438-2022-pro"] = {
    titulo: "Misturas asfálticas — Seleção granulométrica pelo Método Bailey",
    rotuloImportar: function (r) {
      return "TNM " + (ok(r.tnm) ? fmm(r.tnm) + " mm" : "—") + " · " + (r.comp === "fino" ? "fino" : "graúdo") + " · AG " + fmt(r.AG, 2) + " · GAF " + fmt(r.GAF, 2) + " · FAF " + fmt(r.FAF, 2) + (r.enquadra ? " · atende" : " · não atende");
    },
    resumo: "Verificação do intertravamento de mistura conhecida (seção 4) ou seleção granulométrica (5.3): TNM, peneiras de controle PM, PCP, PCS e PCT (Tabelas 1 e 3), comportamento graúdo ou fino (Tabela 2), proporções AG, GAF e FAF (eq. 5 a 7) e limites das Tabelas 4 e 5.",
    blocos: [],
    params: [
      { k: "modo", r: "Procedimento", tipo: "select", recarrega: true,
        opcoes: [["verif", "Verificação de uma mistura conhecida (seção 4)"], ["selecao", "Seleção granulométrica pelo Método Bailey (seção 5)"]] },
      { k: "nG", r: "Agregados graúdos", tipo: "select", recarrega: true, opcoes: [["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]] },
      { k: "nF", r: "Agregados finos", tipo: "select", recarrega: true, opcoes: [["1", "1"], ["2", "2"], ["3", "3"]] },
      { k: "mate", r: "Material de enchimento (cal, cimento, fíler)", tipo: "select", recarrega: true, opcoes: [["sim", "Sim — última coluna (MatE)"], ["nao", "Não"]] },
      { k: "comportamento", r: "Comportamento da mistura (4 d)", tipo: "select",
        opcoes: [["auto", "Automático — Tabela 2"], ["graudo", "Graúdo (definido pelo usuário)"], ["fino", "Fino (definido pelo usuário)"]],
        dica: "use o automático; os outros só quando o TNM não tem ponto de controle na Tabela 2 (37,5 e 4,75 mm)" },
      { k: "tipoMistura", r: "Tipo de mistura desejada (5.2.1)", tipo: "select",
        opcoes: [["graudo", "Comportamento graúdo — MUE de 95 % a 105 % da MUs"], ["fino", "Comportamento fino — MUE de 60 % a 85 % da MUs"]],
        se: function (d) { return (d.params || {}).modo === "selecao"; } },
      { k: "pMUs", r: "MUE dos graúdos = % da MUs (5.2.1)", ph: "100", dica: "NOTA 4: comece pelo valor médio da faixa", se: function (d) { return (d.params || {}).modo === "selecao"; } },
      { k: "filler", r: "Porcentagem desejada de filler — passante na 0,075 mm (5.2.2)", se: function (d) { return (d.params || {}).modo === "selecao"; } },
      { k: "destino", r: "Coluna de destino das importações", tipo: "select",
        opcoes: function (d) { return colunas(d.params || {}).map(function (c, i) { var n = ((d.ag || [])[i] || {}).nome; return [String(i), c.nome + (n ? " — " + n : "")]; }); },
        dica: "escolha a coluna antes de importar cada ensaio" },
      { k: "imp412", r: "Importar granulometria (DNIT 412-ME) para a coluna de destino", tipo: "importar", de: "dnit-412-2025-me",
        aplicar: function (e, P, d) {
          var i = Number(P.destino) || 0, O = FE.FICHAS[e.ficha], dd = JSON.parse(JSON.stringify(e.dados));
          dd.params = Object.assign({}, O.padrao || {}, dd.params || {});
          var med = (O.calcular(dd).resultados || {}).media || [];
          d.ag = d.ag || []; while (d.ag.length <= i) d.ag.push({});
          var x = d.ag[i], id = e.dados.ident || {};
          PEN.forEach(function (mm) {
            var m = med.filter(function (q) { return Math.abs(q.mm - mm) / mm < 0.04; })[0];
            x[kp(mm)] = m && ok(m.pass) ? txt(m.pass, 1) : "";
          });
          if (!x.nome) x.nome = id.camada || id.origem || id.registro || "";
          x.ref412 = id.registro || "";
        } },
      { k: "imp437", r: "Importar massas unitárias (DNIT 437-ME) para a coluna de destino", tipo: "importar", de: "dnit-437-2022-me",
        aplicar: function (e, P, d) {
          var i = Number(P.destino) || 0, R = e.resultados || {};
          d.ag = d.ag || []; while (d.ag.length <= i) d.ag.push({});
          var x = d.ag[i];
          function mu(r) { return r ? (ok(r.MUr) ? r.MUr : r.MU) : NaN; }
          if (ok(mu(R.solto))) x.mus = txt(mu(R.solto), 0);
          if (ok(mu(R.comp))) x.muc = txt(mu(R.comp), 0);
          var me = num((e.dados.params || {}).mesb);
          if (!x.mesb && ok(me)) x.mesb = txt(me, 3);
        } },
      { k: "imp413", r: "Importar MEsb de agregado graúdo (DNIT 413-ME) para a coluna de destino", tipo: "importar", de: "dnit-413-2021-me",
        aplicar: function (e, P, d) { var i = Number(P.destino) || 0, v = (e.resultados || {}).mesb; d.ag = d.ag || []; while (d.ag.length <= i) d.ag.push({}); if (ok(v)) d.ag[i].mesb = txt(v, 3); } },
      { k: "imp411", r: "Importar MEsb de agregado miúdo (DNIT 411-ME) para a coluna de destino", tipo: "importar", de: "dnit-411-2021-me",
        aplicar: function (e, P, d) { var i = Number(P.destino) || 0, v = (e.resultados || {}).mesb; d.ag = d.ag || []; while (d.ag.length <= i) d.ag.push({}); if (ok(v)) d.ag[i].mesb = txt(v, 3); } },
    ],
    padrao: { modo: "verif", nG: "2", nF: "1", mate: "sim", comportamento: "auto", tipoMistura: "graudo", pMUs: "100", destino: "0" },
    tabelas: function (d) {
      var P = d.params || {}, cols = colunas(P), sel = P.modo === "selecao";
      if (Array.isArray(d.ag)) { while (d.ag.length < cols.length) d.ag.push({}); if (d.ag.length > cols.length) d.ag.length = cols.length; }
      var L = [{ k: "nome", r: "Agregado (nome / origem)", texto: true }];
      if (sel) L.push({ k: "pFr", r: "% dentro da mistura de graúdos (AG) ou de finos (AF) (5.2.3 e 5.2.4)", u: "%" },
        { calc: "ini", r: "% inicial na mistura (5.3 f)", u: "%", casas: 2 }, { calc: "cor", r: "% corrigida (eq. 11 e 12)", u: "%", casas: 2 },
        { calc: "pct", r: "% final na mistura (eq. 13 e 14)", u: "%", casas: 2, destaque: true });
      else L.push({ k: "pUso", r: "% utilizado na mistura", u: "%" });
      L.push({ grupo: "% passante em cada peneira (DNIT 412-ME)" });
      PEN.forEach(function (mm) { L.push({ k: kp(mm), r: npen(mm), u: "%" }); });
      L.push({ grupo: "Massas específica e unitárias" + (sel ? " (5.1)" : " — só para a seleção") },
        { k: "mesb", r: "Massa específica aparente MEsb (DNIT 411/413-ME)", u: "g/cm³" },
        { k: "mus", r: "Massa unitária solta MUs (DNIT 437-ME) — graúdos", u: "kg/m³" },
        { k: "muc", r: "Massa unitária compactada MUc (DNIT 437-ME)", u: "kg/m³" });
      if (sel) L.push({ calc: "mue", r: "MUE (5.3 a)", u: "kg/m³", casas: 1 }, { calc: "contrib", r: "Contribuição na massa unitária (5.3 b, d)", u: "kg/m³", casas: 1 },
        { calc: "vv", r: "Vazios na mistura compactada — graúdos (eq. 10 × % na fração)", u: "%", casas: 2 });
      return [{ chave: "ag", titulo: "Agregados", rotulo: "Agregado", iniciais: cols.length, min: cols.length, fixo: true,
        nomes: cols.map(function (c) { return c.nome; }), linhas: L,
        dica: "colunas: agregados graúdos (AG), finos (AF) e material de enchimento (MatE); peneiras acima da primeira preenchida contam como 100 % passante" }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], cols = colunas(P), ag = d.ag || [], sel = P.modo === "selecao";
      var pas = cols.map(function (c, i) { return passantes(ag[i] || {}); });
      pas.forEach(function (p, i) {
        for (var j = 1; j < p.length; j++) if (ok(p[j]) && ok(p[j - 1]) && p[j] > p[j - 1] + 1e-9) { avisos.push(cols[i].nome + ": o passante cresce da " + npen(PEN[j - 1]) + " para a " + npen(PEN[j]) + " — confira."); break; }
      });
      var R = { modo: sel ? "selecao" : "verif", cols: cols.map(function (c, i) { return { nome: c.nome, desc: (ag[i] || {}).nome || "", tipo: c.tipo }; }) }, tab = cols.map(function () { return {}; }), pct;
      if (sel) {
        var S = selecionar(d, P, cols, pas, avisos);
        if (S) {
          S.G.concat(S.F).forEach(function (o) { tab[o.i] = { mue: o.mue, contrib: o.contrib, vv: o.vv, ini: o.ini, cor: o.cor, pct: o.fin }; });
          if (S.E) tab[S.E.i] = { pct: S.mate };
          pct = S.pct;
          R.sel = { vvTot: S.vvTot, muMist: S.muMist, tnm0: S.tnm0, pcp0: S.pcp0, afAgTot: S.afAgTot, agAfTot: S.agAfTot, agTot: S.agTot, afTot: S.afTot, filler: S.filler,
            desej: S.desej, mate: S.mate, fMate: S.fMate, pMUs: S.pMUs,
            itens: S.G.concat(S.F).map(function (o) { return { col: o.col, nome: o.nome, tipo: S.G.indexOf(o) >= 0 ? "G" : "F", mue: o.mue, contrib: o.contrib, vv: o.vv, ini: o.ini, pPCP: o.pPCP, rPCP: o.rPCP, afag: o.afag, agaf: o.agaf, cor: o.cor, fin: o.fin }; }) };
        }
      } else {
        pct = cols.map(function (c, i) { var v = num((ag[i] || {}).pUso); return ok(v) ? v : 0; });
        var soma = pct.reduce(function (a, b) { return a + b; }, 0);
        if (soma > 0 && Math.abs(soma - 100) > 0.05) avisos.push("As porcentagens utilizadas somam " + fmt(soma, 1) + " % (devem somar 100 %).");
        if (!soma) avisos.push("Informe a % utilizada de cada agregado na mistura.");
      }
      R.pct = pct || [];
      if (pct && pct.some(function (v) { return v > 0; })) {
        var mist = compor(pas, pct);
        R.mist = mist;
        R.fr = pas.map(function (p, i) { return p.map(function (v) { return ok(v) ? v * pct[i] / 100 : NaN; }); });
        var V = verificar(mist, P, avisos);
        R.tnm = V.tnm; R.comp = V.comp; R.compFonte = V.compFonte; R.controle = V.controle; R.orig = V.orig; R.novo = V.novo ? { PM: V.novo.PM, PCP: V.novo.PCP, PCS: V.novo.PCS, PCT: V.novo.PCT,
          pPM: V.novo.pPM, pPCP: V.novo.pPCP, pPCS: V.novo.pPCS, pPCT: V.novo.pPCT, AG: V.novo.AG, GAF: V.novo.GAF, FAF: V.novo.FAF, mist: V.novo.mist } : null;
        R.prop = V.prop; R.lim = V.lim; R.enquadra = V.enquadra;
        if (V.usar) { R.AG = V.usar.AG; R.GAF = V.usar.GAF; R.FAF = V.usar.FAF; }
        if (sel && V.comp && P.tipoMistura && V.comp !== P.tipoMistura) avisos.push("A mistura selecionada tem comportamento " + (V.comp === "fino" ? "fino" : "graúdo") + ", diferente do tipo desejado — reveja a MUE escolhida (5.2.1).");
      }
      return { tab: { ag: tab }, resultados: R, avisos: avisos };
    },
    resultadosHtml: function (calc, d) {
      var r = calc.resultados;
      function cx(v, rot, p) { return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      if (!r.mist) return '<div class="fe-res">' + cx("—", "Informe as granulometrias e as porcentagens") + "</div>";
      var h = '<div class="fe-res">' + cx(ok(r.tnm) ? fmm(r.tnm) + " <small>mm</small>" : "—", "TNM da mistura (3.5)") +
        cx(r.comp === "fino" ? "Fino" : "Graúdo", "Comportamento (4 d) — " + esc(r.compFonte || ""), true) +
        (r.prop ? cx(r.enquadra ? '<span class="fe-ok">Atende</span>' : '<span class="fe-nok">Não atende</span>', "Limites do Método Bailey (" + (r.lim ? r.lim.tab : "") + ")", true) : "") +
        (r.sel ? cx(fmt(r.sel.mate, 2) + " <small>%</small>", "Material de enchimento (eq. 13) · filler antes " + fmt(r.sel.filler, 2) + " %", true) : "") + "</div>";
      // peneiras de controle
      var o = r.orig || {}, n = r.novo;
      h += '<table class="fe-resumo"><tr><th>Peneira de controle</th><th>mm</th><th>% passante</th>' + (n ? "<th>Nova peneira (4 e)</th><th>% passante (&lt; PCP = 100 %)</th>" : "") + "</tr>" +
        ["PM", "PCP", "PCS", "PCT"].map(function (k) {
          return "<tr><td>" + k + "</td><td>" + fmm(o[k]) + "</td><td>" + fmt(o["p" + k], 1) + "</td>" + (n ? "<td>" + (n[k] === null ? "—" : fmm(n[k])) + "</td><td>" + fmt(n["p" + k], 1) + "</td>" : "") + "</tr>";
        }).join("") + "</table>";
      if (r.prop) h += '<table class="fe-resumo" style="margin-top:6px"><tr><th>Proporção</th>' + (n ? "<th>Valor (peneiras originais)</th>" : "") + "<th>Limites</th><th>Valor</th><th>Enquadramento</th></tr>" +
        r.prop.map(function (p) {
          return "<tr><td>" + p.k + "</td>" + (n ? "<td>" + fmt(o[p.k], 2) + "</td>" : "") + "<td>" + (p.lim ? fmt(p.lim[0], 2) + " – " + fmt(p.lim[1], 2) : "—") + "</td><td><b>" + fmt(p.vr, 2) + "</b></td><td>" +
            (p.atende === null ? "—" : p.atende ? '<span class="fe-ok">sim</span>' : '<span class="fe-nok">não</span>') + "</td></tr>";
        }).join("") + "</table>";
      // composição
      h += '<table class="fe-resumo" style="margin-top:6px"><tr><th>Peneira</th>' + r.cols.map(function (c, i) { return "<th>" + esc(c.nome) + " (" + fmt(r.pct[i], 2) + " %)</th>"; }).join("") + "<th>Mistura</th></tr>" +
        PEN.map(function (mm, j) {
          return "<tr><td>" + npen(mm) + "</td>" + r.fr.map(function (f) { return "<td>" + fmt(f[j], 2) + "</td>"; }).join("") + "<td><b>" + fmt(r.mist[j], 1) + "</b></td></tr>";
        }).join("") + "</table>";
      return h;
    },
    graficos: function (calc, d, opt) {
      opt = opt || {};
      var r = calc.resultados;
      if (!r.mist) return ['<div class="fe-graf-vazio">A curva aparece com as granulometrias e as porcentagens.</div>'];
      var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)", azul = imp ? "#1f5fbf" : "#4f8cff", verm = imp ? "#c0392b" : "#e5534b";
      var cores = imp ? ["#888", "#2e8b57", "#8e44ad", "#c77d12", "#16a085", "#7f8c8d", "#d35400"] : ["#9aa3b2", "#34c38f", "#b083f0", "#e0a13a", "#2ec4b6", "#8892a6", "#f08a4b"];
      var W = opt.w || 600, H = opt.h || 330, m = { l: 48, r: 16, t: 16, b: 44 };
      var xmin = Math.log10(0.05), xmax = Math.log10(50);
      function X(mm) { return m.l + (Math.log10(mm) - xmin) / (xmax - xmin) * (W - m.l - m.r); }
      function Y(v) { return H - m.b - v / 100 * (H - m.t - m.b); }
      var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10">';
      PEN.forEach(function (mm) {
        s += '<line x1="' + X(mm) + '" y1="' + m.t + '" x2="' + X(mm) + '" y2="' + (H - m.b) + '" stroke="' + grade + '" stroke-width="0.6"/>';
        s += '<text x="' + X(mm) + '" y="' + (H - m.b + 13) + '" text-anchor="middle" fill="' + txt + '">' + fmm(mm) + "</text>";
      });
      for (var v = 0; v <= 100; v += 10) s += '<line x1="' + m.l + '" y1="' + Y(v) + '" x2="' + (W - m.r) + '" y2="' + Y(v) + '" stroke="' + grade + '" stroke-width="0.6"/><text x="' + (m.l - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end" fill="' + txt + '">' + v + "</text>";
      // peneiras de controle
      var o = r.orig || {};
      ["PM", "PCP", "PCS", "PCT"].forEach(function (k) {
        if (!ok(o[k])) return;
        s += '<line x1="' + X(o[k]) + '" y1="' + m.t + '" x2="' + X(o[k]) + '" y2="' + (H - m.b) + '" stroke="' + verm + '" stroke-dasharray="5 3"/>';
        s += '<text x="' + (X(o[k]) + 3) + '" y="' + (m.t + 10) + '" fill="' + verm + '" font-weight="bold">' + k + "</text>";
      });
      // agregados (finas) e mistura (grossa)
      var ag = d.ag || [];
      r.cols.forEach(function (c, i) {
        var p = passantes(ag[i] || {}), pts = PEN.map(function (mm, j) { return [mm, p[j]]; }).filter(function (q) { return ok(q[1]); });
        if (pts.length < 2) return;
        s += '<path d="' + pts.map(function (q, j) { return (j ? "L" : "M") + X(q[0]).toFixed(1) + " " + Y(q[1]).toFixed(1); }).join(" ") + '" fill="none" stroke="' + cores[i % cores.length] + '" stroke-width="1.2" stroke-dasharray="3 2"/>';
        s += '<text x="' + (m.l + 6) + '" y="' + (m.t + 24 + i * 12) + '" fill="' + cores[i % cores.length] + '">' + esc(c.nome + (c.desc && c.desc !== c.nome ? " — " + c.desc : "")) + "</text>";
      });
      var mp = PEN.map(function (mm, j) { return [mm, r.mist[j]]; }).filter(function (q) { return ok(q[1]); });
      s += '<path d="' + mp.map(function (q, j) { return (j ? "L" : "M") + X(q[0]).toFixed(1) + " " + Y(q[1]).toFixed(1); }).join(" ") + '" fill="none" stroke="' + azul + '" stroke-width="2.4"/>';
      mp.forEach(function (q) { s += '<circle cx="' + X(q[0]) + '" cy="' + Y(q[1]) + '" r="3" fill="' + azul + '"/>'; });
      s += '<text x="' + (m.l + 6) + '" y="' + (m.t + 12) + '" fill="' + azul + '" font-weight="bold">Mistura</text>';
      s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + txt + '"/>';
      s += '<text x="' + ((W + m.l) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + txt + '">Abertura da peneira (mm) — escala logarítmica</text>';
      s += '<text transform="translate(13 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + txt + '">% passando</text>';
      return [s + "</svg>"];
    },
    relatorio: {
      notas: "PCP = 0,22 × TNM, PCS = 0,22 × PCP, PCT = 0,22 × PCS, PM = 0,5 × TNM (eq. 1 a 4; valores das Tabelas 1 e 3). TNM: peneira imediatamente acima da que retém mais de 10 % acumulado (3.5). AG = (%PM − %PCP)/(100 − %PM); GAF = %PCS/%PCP; FAF = %PCT/%PCS (eq. 5 a 7), comparadas com duas casas decimais aos limites das Tabelas 4 (graúdo) e 5 (fino). Comportamento: passante na PCP inferior ao controle da Tabela 2 = graúdo, superior = fino (igualdade tratada como graúdo); no fino, o passante na PCP original vira 100 % e usam-se as peneiras da Tabela 3 (4 e). Seleção (5.3): MUE dos graúdos = % escolhido × MUs; dos finos = MUc; vazios dos graúdos = (1 − MUE/(1000 × MEsb)) × % na fração (eq. 10); contribuição dos finos = MUc × % na fração × vazios totais; % inicial = contribuição / massa unitária da mistura; correções pelas eq. 11 e 12; material de enchimento %MatE = (%desejado − %filler)/%filler no MatE × 100 (eq. 13, em porcentagem como no Anexo C); finos finais pela eq. 14.",
      resultados: function (calc, d) {
        var r = calc.resultados, rows = [];
        if (!r.mist) return [["Resultado", "dados incompletos"]];
        rows.push(["Procedimento", r.modo === "selecao" ? "Seleção granulométrica (seção 5)" : "Verificação de mistura conhecida (seção 4)"]);
        rows.push(["Composição", r.cols.map(function (c, i) { return c.nome + (c.desc && c.desc !== c.nome ? " (" + c.desc + ")" : "") + " " + fmt(r.pct[i], 2) + " %"; }).join("; ")]);
        rows.push(["TNM / comportamento", fmm(r.tnm) + " mm — " + (r.comp === "fino" ? "fino" : "graúdo") + " (" + (r.compFonte || "") + ")"]);
        var o = r.orig || {};
        rows.push(["Peneiras de controle (" + (o.fonte || "") + ")", ["PM", "PCP", "PCS", "PCT"].map(function (k) { return k + " " + fmm(o[k]) + " mm: " + fmt(o["p" + k], 1) + " %"; }).join(" · ")]);
        if (r.novo) rows.push(["Novas peneiras — comportamento fino (Tabela 3)", ["PM", "PCP", "PCS", "PCT"].map(function (k) { return k + " " + (r.novo[k] === null ? "—" : fmm(r.novo[k]) + " mm: " + fmt(r.novo["p" + k], 1) + " %"); }).join(" · ")]);
        (r.prop || []).forEach(function (p) {
          rows.push(["Proporção " + p.k, fmt(p.vr, 2) + " — limites " + (p.lim ? fmt(p.lim[0], 2) + " a " + fmt(p.lim[1], 2) : "—") + " — " + (p.atende === null ? "sem limite" : p.atende ? "atende" : "NÃO ATENDE")]);
        });
        rows.push(["Parecer", r.enquadra ? "Composição granulométrica enquadrada em todos os limites do Método Bailey" : "Composição NÃO enquadrada em todos os limites do Método Bailey — alterar os valores escolhidos e refazer"]);
        if (r.sel) {
          var S = r.sel;
          rows.push(["Valores escolhidos (5.2)", "MUE = " + fmt(S.pMUs, 0) + " % da MUs · filler desejado " + fmt(S.desej, 2) + " %"]);
          S.itens.forEach(function (o) {
            rows.push([o.col + (o.nome && o.nome !== o.col ? " — " + o.nome : ""), "MUE " + fmt(o.mue, 1) + " kg/m³ · contribuição " + fmt(o.contrib, 1) + " kg/m³" + (o.tipo === "G" ? " · vazios " + fmt(o.vv, 2) + " % · passa na PCP " + fmt(o.pPCP, 1) + " % → AF@AG " + fmt(o.afag, 2) + " %"
              : " · retido na PCP " + fmt(o.rPCP, 1) + " % → AG@AF " + fmt(o.agaf, 2) + " %") + " · inicial " + fmt(o.ini, 2) + " % · corrigido " + fmt(o.cor, 2) + " % · final " + fmt(o.fin, 2) + " %"]);
          });
          rows.push(["Passo a passo (5.3)", "vazios totais dos graúdos " + fmt(S.vvTot, 2) + " % · massa unitária da mistura " + fmt(S.muMist, 1) + " kg/m³ · TNM/PCP preliminares " + fmm(S.tnm0) + " / " + fmm(S.pcp0) + " mm · AF@AG total " + fmt(S.afAgTot, 2) +
            " % · AG@AF total " + fmt(S.agAfTot, 2) + " % · filler após correção " + fmt(S.filler, 2) + " % · MatE " + fmt(S.mate, 2) + " % (filler no MatE " + fmt(S.fMate, 1) + " %)"]);
        }
        return rows;
      },
    },
    exemplos: [
      { nome: "Anexo B, exemplo 1 — verificação, comportamento graúdo (atende)", dados: function () {
        return { ident: { registro: "EX-BY-001", obra: "Obra A", origem: "Pedreira X", camada: "Concreto asfáltico — TNM 12,5 mm" },
          params: { modo: "verif", nG: "2", nF: "1", mate: "sim", comportamento: "auto" },
          ag: [{ nome: "Brita 1", pUso: "28", p25: "100", p19: "99,5", p12_5: "82,8", p9_5: "40,6", p6_3: "13,4", p4_75: "1,3", p2_36: "0,2", p1_18: "0,2", p0_6: "0,1", p0_3: "0,1", p0_15: "0,1", p0_075: "0,0" },
            { nome: "Brita 0", pUso: "30", p25: "100", p19: "100", p12_5: "100", p9_5: "95,8", p6_3: "49,3", p4_75: "20,2", p2_36: "11,2", p1_18: "7,6", p0_6: "0,2", p0_3: "0,1", p0_15: "0,1", p0_075: "0,1" },
            { nome: "Pó de pedra", pUso: "39", p25: "100", p19: "100", p12_5: "100", p9_5: "100", p6_3: "100", p4_75: "97,3", p2_36: "82,5", p1_18: "63,2", p0_6: "39,1", p0_3: "23,7", p0_15: "12,6", p0_075: "3,0" },
            { nome: "Cal", pUso: "3", p25: "100", p19: "100", p12_5: "100", p9_5: "100", p6_3: "100", p4_75: "100", p2_36: "100", p1_18: "100", p0_6: "100", p0_3: "100", p0_15: "100", p0_075: "99,0" }] };
      } },
      { nome: "Anexo B, exemplo 2 — verificação, comportamento fino (novas peneiras)", dados: function () {
        return { ident: { registro: "EX-BY-002", obra: "Obra A", origem: "Pedreira X", camada: "Concreto asfáltico — TNM 19 mm" },
          params: { modo: "verif", nG: "2", nF: "1", mate: "sim", comportamento: "auto" },
          ag: [{ nome: "Brita 1", pUso: "25", p25: "100", p19: "97,5", p12_5: "38,1", p9_5: "9,5", p6_3: "0,7", p4_75: "0,4", p2_36: "0,2", p1_18: "0,2", p0_6: "0,2", p0_3: "0,2", p0_15: "0,2", p0_075: "0,1" },
            { nome: "Brita 0", pUso: "30", p25: "100", p19: "100", p12_5: "100", p9_5: "94,1", p6_3: "53,1", p4_75: "24,0", p2_36: "2,0", p1_18: "1,5", p0_6: "1,3", p0_3: "1,1", p0_15: "0,9", p0_075: "0,5" },
            { nome: "Pó de pedra", pUso: "42", p25: "100", p19: "100", p12_5: "100", p9_5: "100", p6_3: "100", p4_75: "99,5", p2_36: "89,3", p1_18: "69,0", p0_6: "49,5", p0_3: "28,5", p0_15: "13,9", p0_075: "6,5" },
            { nome: "Cal", pUso: "3", p25: "100", p19: "100", p12_5: "100", p9_5: "100", p6_3: "100", p4_75: "100", p2_36: "100", p1_18: "100", p0_6: "100", p0_3: "100", p0_15: "99,0", p0_075: "85,0" }] };
      } },
      { nome: "Anexo C, exemplo 3 — seleção granulométrica (MUE = 103 % MUs, filler 4,5 %)", dados: function () {
        return { ident: { registro: "EX-BY-003", obra: "Obra B", origem: "Pedreira Y", camada: "Concreto asfáltico — seleção Bailey" },
          params: { modo: "selecao", nG: "2", nF: "1", mate: "sim", comportamento: "auto", tipoMistura: "graudo", pMUs: "103", filler: "4,5" },
          ag: [{ nome: "AG1", pFr: "25", p25: "100", p19: "100", p12_5: "94,0", p9_5: "38,0", p6_3: "17,0", p4_75: "3,0", p2_36: "1,9", p1_18: "1,8", p0_6: "1,8", p0_3: "1,8", p0_15: "1,8", p0_075: "1,7", mesb: "2,702", mus: "1425", muc: "1608" },
            { nome: "AG2", pFr: "75", p25: "100", p19: "100", p12_5: "100", p9_5: "99,0", p6_3: "75,0", p4_75: "30,0", p2_36: "5,0", p1_18: "2,5", p0_6: "1,9", p0_3: "1,4", p0_15: "1,3", p0_075: "1,2", mesb: "2,698", mus: "1400", muc: "1592" },
            { nome: "AF1", pFr: "100", p25: "100", p19: "100", p12_5: "100", p9_5: "100", p6_3: "100", p4_75: "99,0", p2_36: "79,9", p1_18: "48,8", p0_6: "29,0", p0_3: "14,2", p0_15: "8,8", p0_075: "3,0", mesb: "3,162", muc: "2167" },
            { nome: "MatE", p25: "100", p19: "100", p12_5: "100", p9_5: "100", p6_3: "100", p4_75: "100", p2_36: "100", p1_18: "100", p0_6: "100", p0_3: "100", p0_15: "98,0", p0_075: "90,0", mesb: "2,806" }] };
      } },
      { nome: "Verificação — excesso de pó de pedra: AG e GAF fora dos limites", dados: function () {
        return { ident: { registro: "EX-BY-004", obra: "Obra C", origem: "Pedreira Z", camada: "Concreto asfáltico — TNM 12,5 mm" },
          params: { modo: "verif", nG: "2", nF: "1", mate: "nao", comportamento: "auto" },
          ag: [{ nome: "Brita 1", pUso: "32", p25: "100", p19: "99,5", p12_5: "82,8", p9_5: "40,6", p6_3: "13,4", p4_75: "1,3", p2_36: "0,2", p1_18: "0,2", p0_6: "0,1", p0_3: "0,1", p0_15: "0,1", p0_075: "0,0" },
            { nome: "Brita 0", pUso: "33", p25: "100", p19: "100", p12_5: "100", p9_5: "95,8", p6_3: "49,3", p4_75: "20,2", p2_36: "11,2", p1_18: "7,6", p0_6: "0,2", p0_3: "0,1", p0_15: "0,1", p0_075: "0,1" },
            { nome: "Pó de pedra fino", pUso: "35", p25: "100", p19: "100", p12_5: "100", p9_5: "100", p6_3: "100", p4_75: "98,0", p2_36: "88,0", p1_18: "76,0", p0_6: "60,0", p0_3: "44,0", p0_15: "30,0", p0_075: "14,0" }] };
      } },
    ],
  };
})();
