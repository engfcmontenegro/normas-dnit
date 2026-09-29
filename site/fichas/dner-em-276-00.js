/*
 * Ficha: DNER-EM 276/00 — Tinta para sinalização rodoviária horizontal, à base de resina acrílica emulsionada em água
 * — recebimento da partida.
 *
 * Este arquivo também define o motor comum das fichas de RECEBIMENTO DE MATERIAL DE SINALIZAÇÃO E SELANTES
 * (window.FE.recebimentoMaterial, abreviado R), usado por:
 *   dner-em-368-00 e dner-em-371-00 (tintas — R.tinta), dner-em-372-00 (termoplástico), dner-em-373-00 e
 *   dner-em-379-98 (microesferas / esferas de vidro — R.microesferas, definido em dner-em-373-00.js) e
 *   dnit-046-2004-em (selante de juntas).
 * Por isso ele carrega antes dessas fichas (ordem das tags <script> em index.html).
 *
 * O motor monta a ficha a partir da lista de REQUISITOS da EM:
 *   - inspeção visual dos recipientes/sacos com o plano de amostragem da PRO citada pela EM (DNER-PRO 231/94 para
 *     tintas, DNER-PRO 132/94 para sacos de microesferas e termoplástico): nº de aceitação e de rejeição, amostragem
 *     simples ou dupla, inspeção normal ou rigorosa (reinspeção);
 *   - amostra para o laboratório (DNER-PRO 104/94: ≥ 2 L por cor, tipo e lote; DNER-PRO 251/94: sacos e ≈ 2 500 g);
 *   - uma linha por requisito (condições gerais e específicas), com o resultado digitado ou IMPORTADO das fichas ME
 *     (parâmetro "importarVarios"): o ensaio de origem é recalculado com a especificação/tipo de junta da EM e o
 *     valor comparado com o limite da EM (a ficha não confia no parecer salvo da ME);
 *   - contraprova (quando a EM prevê: DNIT 046, exemplar reservado);
 *   - parecer da partida com FE.aceitacao (A.parecer / A.htmlParecer), relatório com o parecer primeiro (lote: true).
 *
 * Requisito (cfg.requisitos[]):
 *   { id, grupo, r (rótulo), secao, metodo, u, casas, tipo: "num" | "qual" | "cor" | "externo",
 *     lim(P) -> {min, max, minX, maxX} (num; minX/maxX = limite estrito "> / <") | null,
 *     exig: texto ou function (P) (qual), ph, se(P) (aplica-se?),
 *     conds(P) -> ["N", "E", "I"] (séries aceitas na importação: cura normal / após estufa / após intemperismo),
 *     avaliar(d, P, avisos) -> {situacao, resultado, motivo} (externo: avaliado a partir de outra tabela),
 *     imp: {de: [fids], valor(Rres, e, P, d, notas) -> número | boolean | {v, q, txt, c, rel} | [...] | null} }
 * Resultado digitado: número (aceita "< 1,50", "> 100"), texto qualitativo ("satisfatória", "ausência", "S", "N",
 * "não embaçada", "presença"...) ou "dispensado" (quando a EM permite dispensar ensaios).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var EPS = 1e-9;
  var R = {};

  // =====================================================================================
  // Planos de inspeção visual
  // =====================================================================================
  // faixas: [lote mín., lote máx., [[tamanho da amostra, tamanho cumulativo, nº de aceitação, nº de rejeição], ...]]
  R.PLANOS = {
    pro231: { codigo: "DNER-PRO 231/94", unid: "recipientes", item: "recipiente",
      normal: { tab: "Tabela 1", faixas: [
        [2, 180, [[7, 7, 0, 1]]],
        [181, 500, [[15, 15, 0, 3], [30, 45, 2, 3]]],
        [501, 800, [[25, 25, 1, 4], [50, 75, 3, 4]]],
        [801, 1300, [[35, 35, 1, 5], [70, 105, 4, 5]]],
        [1301, 3200, [[50, 50, 2, 7], [100, 150, 6, 7]]]] },
      rigorosa: { tab: "Tabela 2", faixas: [
        [2, 65, [[7, 7, 0, 1]]],
        [66, 300, [[10, 10, 0, 1]]],
        [301, 800, [[25, 25, 1, 3], [50, 75, 2, 3]]],
        [801, 1300, [[35, 35, 1, 3], [70, 105, 2, 3]]],
        [1301, 3200, [[50, 50, 1, 6], [100, 150, 5, 6]]]] },
      todos: "Nota 1: amostra ≥ lote → inspecionar todos os recipientes",
      defeitos: "deficiência de enchimento, fechamento imperfeito, vazamento, amassamento, falta/insegurança da alça, má conservação, identificação deficiente, outros (3.7)" },
    pro132: { codigo: "DNER-PRO 132/94", unid: "sacos", item: "saco",
      normal: { tab: "Tabela 1", faixas: [
        [2, 180, [[2, 2, 0, 1]]],
        [181, 500, [[4, 4, 0, 2], [6, 10, 1, 2]]],
        [501, 800, [[8, 8, 2, 4], [10, 18, 3, 4]]],
        [801, 1300, [[10, 10, 2, 5], [14, 24, 4, 5]]]] },
      rigorosa: { tab: "Tabela 2", faixas: [
        [2, 15, [[1, 1, 0, 1]]], [16, 40, [[3, 3, 0, 1]]], [41, 90, [[4, 4, 0, 1]]], [91, 165, [[5, 5, 1, 2]]],
        [166, 275, [[6, 6, 1, 2]]], [276, 410, [[7, 7, 1, 2]]], [411, 610, [[8, 8, 2, 3]]], [611, 860, [[9, 9, 2, 3]]],
        [861, 1160, [[10, 10, 2, 3]]]] },
      defeitos: "embalagem inadequada, deficiência de enchimento, fechamento imperfeito, vazamento, má conservação, identificação deficiente, outros (3.7)" },
  };
  function planoDe(pl, N, rig) {
    var t = rig ? pl.rigorosa : pl.normal;
    var f = t.faixas.filter(function (x) { return N >= x[0] && N <= x[1]; })[0];
    return f ? { ini: f[0], fim: f[1], am: f[2], tab: t.tab, faixas: t.faixas } : null;
  }
  R.planoDe = planoDe;

  // DNER-PRO 251/94, tabela de 4.2: sacos retirados para formar a amostra de laboratório
  R.PRO251 = [[2, 90, 2], [91, 275, 4], [276, 610, 8], [611, 1160, 10]];

  // =====================================================================================
  // Leitura dos resultados
  // =====================================================================================
  function vazio(x) { return x === undefined || x === null || String(x).trim() === ""; }
  // true (atende) / false (não atende) / undefined
  function lerQual(s) {
    var t = String(s === undefined || s === null ? "" : s).trim().toLowerCase();
    if (!t) return undefined;
    if (/^n[ãa]o\s+(embaç|embac|apresent|perfur|houve|h[áa]\s|sangr|alter|espum|desprend|fissur)/.test(t)) return true;
    if (/n[ãa]o\s+(conforme|atende|satisf)/.test(t)) return false;
    if (/^(n|n[ãa]o|insatisf|presen|embaç|embac|reprov|nok|fora|com\s|perfur|alterad|retid|interromp|desprend|n\.\s*c\.?)/.test(t)) return false;
    if (/^(s|sim|satisf|aus[êe]ncia|ok|conforme|atende|inalterad|limp|livre|escoa|flui|sem\s|dentro|isent|bandas)/.test(t)) return true;
    return undefined;
  }
  R.lerQual = lerQual;
  // número, com "< x" / "> x" e unidade no fim
  function lerRes(s) {
    var t = String(s === undefined || s === null ? "" : s).trim();
    if (!t) return { vazio: true };
    if (/^disp/i.test(t)) return { disp: true, txt: t };
    var rel = "", corpo = t, m = /^([<>≤≥])\s*(.*)$/.exec(t);
    if (m) { rel = m[1]; corpo = m[2]; }
    var v = num(corpo.replace(/\s*(%|mm|ml|mL|g|UK|L|min|°C|N\/mm|g\/cm³|g\/cm3|unidades|Hegman)\s*$/i, ""));
    if (ok(v)) return { v: v, rel: rel, txt: t };
    return { q: lerQual(t), txt: t };
  }
  R.lerRes = lerRes;
  function nstr(x, casas) { return ok(x) ? x.toFixed(casas).replace(".", ",") : ""; }
  function fmtN(x, casas) { return ok(x) ? fmt(x, casas).replace(/^-/, "−") : "—"; }
  function txtLim(lim, casas, u) {
    if (!lim) return "—";
    var U = u ? " " + u : "";
    var mi = ok(lim.min) ? lim.min : null, ma = ok(lim.max) ? lim.max : null;
    if (mi !== null && ma !== null) return (mi === ma ? fmtN(mi, casas) : fmtN(mi, casas) + " a " + fmtN(ma, casas)) + U;
    if (mi !== null) return (lim.minX ? "> " : "≥ ") + fmtN(mi, casas) + U;
    if (ma !== null) return (lim.maxX ? "< " : "≤ ") + fmtN(ma, casas) + U;
    return "—";
  }
  R.txtLim = txtLim;
  function confereNum(v, rel, lim) {
    if (!lim || !ok(v)) return null;
    var x = rel === "<" ? v - 1e-6 : rel === ">" ? v + 1e-6 : v;
    var okMin = !ok(lim.min) || (lim.minX ? x > lim.min + EPS : x >= lim.min - EPS);
    var okMax = !ok(lim.max) || (lim.maxX ? x < lim.max - EPS : x <= lim.max + EPS);
    return okMin && okMax;
  }
  R.confereNum = confereNum;
  // quanto o valor está "fora" (maior = pior) — escolhe o pior entre vários importados
  function escore(v, lim) {
    if (!lim) return 0;
    var s = -Infinity;
    if (ok(lim.min)) s = Math.max(s, lim.min - v);
    if (ok(lim.max)) s = Math.max(s, v - lim.max);
    return s === -Infinity ? 0 : s;
  }
  var COND = { N: "cura normal", E: "após estufa — DNIT 044", I: "após intemperismo — DNIT 045" };
  R.COND = COND;

  // =====================================================================================
  // Motor
  // =====================================================================================
  R.criar = function (cfg) {
    var REQ = cfg.requisitos, INS = cfg.inspecao ? R.PLANOS[cfg.inspecao.plano] : null;
    var TXT = cfg.textos || {};
    var COLS = cfg.contraprova ? ["Resultado", "Contraprova (exemplar reservado)"] : ["Resultado"];
    var fontes = [];
    REQ.forEach(function (q) { ((q.imp || {}).de || []).forEach(function (f) { if (fontes.indexOf(f) === -1) fontes.push(f); }); });

    function P_(d) { return Object.assign({}, cfg.padrao || {}, (d || {}).params || {}); }
    function aplica(q, P) { return !q.se || q.se(P); }
    function visiveis(P) { return REQ.filter(function (q) { return aplica(q, P); }); }
    function limQ(q, P) { return typeof q.lim === "function" ? q.lim(P) : q.lim || null; }
    function secQ(q, P) { return typeof q.secao === "function" ? q.secao(P) : q.secao || ""; }
    function exigQ(q, P) {
      if (q.tipo === "num") return txtLim(limQ(q, P), q.casasLim !== undefined ? q.casasLim : q.casas, q.u);
      return typeof q.exig === "function" ? q.exig(P) : q.exig || "—";
    }

    // ---------------- importação ----------------
    function recalc(e, P) {
      var F = FE.FICHAS[e.ficha];
      var sob = cfg.sobrepor ? cfg.sobrepor(e.ficha, P, e) : null;
      if (!F || !sob) return e.resultados || {};
      var dados = JSON.parse(JSON.stringify(e.dados || {}));
      dados.params = Object.assign({}, F.padrao || {}, dados.params || {}, sob);
      try { return F.calcular(dados).resultados || {}; } catch (err) { return e.resultados || {}; }
    }
    function aplicar(lista, P0, d) {
      var P = Object.assign({}, cfg.padrao || {}, P0 || {});
      var reqs = visiveis(P), acum = {}, notas = [];
      lista.forEach(function (e) {
        var Rr = recalc(e, P), reg = A.importacao.rotulo(e);
        if (cfg.conferirOrigem) cfg.conferirOrigem(e, P, notas);
        var usado = false;
        reqs.forEach(function (q) {
          if (!q.imp || !q.imp.valor || (q.imp.de || []).indexOf(e.ficha) === -1) return;
          var x = null;
          try { x = q.imp.valor(Rr, e, P, d, notas); } catch (err) { x = null; }
          if (x === null || x === undefined) return;
          var cs = q.conds ? q.conds(P) : null, fora = [];
          (Array.isArray(x) ? x : [x]).forEach(function (y) {
            if (y === null || y === undefined) return;
            if (typeof y !== "object") y = typeof y === "boolean" ? { q: y } : { v: y };
            if (!ok(y.v) && typeof y.q !== "boolean" && !y.txt) return;
            if (y.c && cs && cs.indexOf(y.c) === -1) { fora.push(COND[y.c]); return; }
            y.reg = reg + (y.c ? " (" + COND[y.c] + ")" : "");
            (acum[q.id] = acum[q.id] || []).push(y);
            usado = true;
          });
          if (fora.length && !(acum[q.id] || []).some(function (y) { return y.reg.indexOf(reg) === 0; })) {
            notas.push(reg + ": " + q.r + " — resultado só " + fora.join(" / ") + "; a EM exige " + cs.map(function (c) { return COND[c]; }).join(" / ") + " (" + secQ(q, P) + ").");
          }
        });
        if (!usado && !reqs.some(function (q) { return q.imp && q.imp.aplicar && (q.imp.de || []).indexOf(e.ficha) !== -1; })) {
          notas.push(reg + ": nenhum resultado aproveitável para os requisitos desta EM com os parâmetros atuais.");
        }
      });
      d.res = d.res || [{}];
      var col = d.res[0] = d.res[0] || {};
      var impAnt = d.imp || {};
      d.imp = {};
      // importações anteriores: saem (ou são trocadas) se não foram alteradas à mão; as alteradas ficam como digitadas
      Object.keys(impAnt).forEach(function (id) { if (String(col[id] === undefined ? "" : col[id]) === String(impAnt[id].v)) delete col[id]; });
      reqs.forEach(function (q) {
        var ys = acum[q.id];
        if (!ys || !ys.length) return;
        var txt, regs = ys.map(function (y) { return y.reg; }).filter(function (r, i, a) { return a.indexOf(r) === i; });
        var nums = ys.filter(function (y) { return ok(y.v); }), quals = ys.filter(function (y) { return !ok(y.v); });
        if (q.tipo === "num" && nums.length && !quals.some(function (y) { return y.q === false; })) {
          var lim = limQ(q, P), pior = nums[0];
          nums.forEach(function (y) { if (escore(y.v, lim) > escore(pior.v, lim)) pior = y; });
          txt = (pior.rel ? pior.rel + " " : "") + nstr(pior.v, q.casasImp !== undefined ? q.casasImp : q.casas);
          if (nums.length > 1) regs = [pior.reg + " — pior de " + nums.length + " valores importados"];
        } else {
          var mau = ys.filter(function (y) { return y.q === false; })[0], bom = ys.filter(function (y) { return y.q === true; })[0];
          var y0 = mau || bom || ys[0];
          txt = y0.txt || "";
          // o texto importado precisa ser lido de volta com o mesmo sentido (senão, usa o rótulo padrão do requisito)
          if ((y0.q === true || y0.q === false) && q.tipo !== "cor" && lerQual(txt) !== y0.q) txt = y0.q ? q.bom || "satisfatória" : q.mau || "não satisfatória";
          if (!txt && ok(y0.v)) txt = nstr(y0.v, q.casas);
        }
        if (!vazio(col[q.id])) { notas.push(q.r + ": mantido o valor digitado \"" + col[q.id] + "\" (importado: \"" + txt + "\" — apague o campo e importe de novo para usá-lo)."); return; }
        col[q.id] = txt;
        d.imp[q.id] = { v: txt, reg: regs.join(" + ") };
      });
      reqs.forEach(function (q) { if (q.imp && q.imp.aplicar) q.imp.aplicar(lista, P, d, notas, recalc); });
      d.impNotas = notas;
    }

    // ---------------- inspeção visual e amostragem ----------------
    var G_INS = "Inspeção e amostragem (seção " + (cfg.secInsp || "6") + ")";
    function avaliarInspecao(P, d, avisos) {
      var pl = INS, N = num(P.nRec), rig = P.inspTipo === "rigorosa";
      var l = A.linha({ id: "insp", grupo: G_INS, criterio: "Inspeção visual dos " + pl.unid + " (" + pl.codigo + ", inspeção " + (rig ? "rigorosa" : "normal") + ")",
        secao: cfg.inspecao.secao, metodo: pl.codigo });
      var c = d.insp || [], a1 = c[0] || {}, a2 = c[1] || {};
      var n1 = num(a1.n), d1 = num(a1.def), n2 = num(a2.n), d2 = num(a2.def);
      if (!ok(N)) { l.situacao = "pendente"; l.motivo = "informe o número de " + pl.unid + " do lote"; return l; }
      var p = planoDe(pl, N, rig);
      if (!p) {
        var f = (rig ? pl.rigorosa : pl.normal).faixas;
        l.situacao = "pendente"; l.motivo = "lote de " + N + " " + pl.unid + " fora da " + (rig ? pl.rigorosa.tab : pl.normal.tab) + " (" + f[0][0] + " a " + f[f.length - 1][1] + ")";
        return l;
      }
      var am = p.am, req1 = Math.min(am[0][0], N), todos = am[0][0] >= N;
      l.exigido = (am.length === 1 ? "amostra única de " + req1 + ": aceita com ≤ " + am[0][2] + ", rejeita com ≥ " + am[0][3] + " defeituoso(s)"
        : "1ª amostra de " + am[0][0] + " (Ac " + am[0][2] + " / Re " + am[0][3] + "); 2ª de " + am[1][0] + " (acumulado " + am[1][1] + ": Ac " + am[1][2] + " / Re " + am[1][3] + ")") +
        " — " + pl.codigo + ", " + p.tab + ", lote de " + p.ini + " a " + p.fim + (todos && pl.todos ? " (" + pl.todos + ")" : "");
      if (!ok(n1) || !ok(d1)) { l.situacao = "pendente"; l.motivo = "registre os " + pl.unid + " examinados e os defeituosos da 1ª amostra"; return l; }
      if (d1 > n1) avisos.push("Inspeção visual: mais defeituosos (" + d1 + ") que examinados (" + n1 + ") na 1ª amostra — confira.");
      l.resultado = d1 + " defeituoso(s) em " + n1;
      l.n = n1;
      if (n1 < req1) { A.marcar(l, "pendente", "examinados " + n1 + " " + pl.unid + "; o plano pede " + req1 + (todos ? " (todos os do lote)" : "")); return l; }
      if (d1 <= am[0][2]) { l.situacao = "conforme"; l.motivo = "aceito na " + (am.length === 1 ? "amostra única" : "1ª amostra") + " (4.3.1)"; return l; }
      if (d1 >= am[0][3]) {
        A.marcar(l, "nao_conforme", d1 + " defeituoso(s) ≥ nº de rejeição " + am[0][3] + " (4.3.1): lote rejeitado na inspeção visual (EM " + cfg.secRejInsp + ")");
        l.prov = "Rejeição total ou parcial à vista da inspeção (" + cfg.secRejInsp + "); o lote pode ser reinspecionado (inspeção rigorosa, 4.4) depois que o fornecedor eliminar ou recondicionar os " + pl.unid + " defeituosos.";
        return l;
      }
      // entre Ac e Re: 2ª amostra
      if (!ok(n2) || !ok(d2)) { A.marcar(l, "pendente", d1 + " defeituoso(s) entre Ac " + am[0][2] + " e Re " + am[0][3] + ": forme a 2ª amostra de " + am[1][0] + " (4.3.1)"); return l; }
      if (d2 > n2) avisos.push("Inspeção visual: mais defeituosos (" + d2 + ") que examinados (" + n2 + ") na 2ª amostra — confira.");
      var dt = d1 + d2;
      l.resultado = dt + " defeituoso(s) em " + (n1 + n2) + " (1ª + 2ª)";
      l.n = n1 + n2;
      if (n2 < am[1][0]) { A.marcar(l, "pendente", "2ª amostra com " + n2 + " " + pl.unid + "; o plano pede " + am[1][0]); return l; }
      if (dt <= am[1][2]) { l.situacao = "conforme"; l.motivo = "aceito na 2ª amostra: " + dt + " ≤ " + am[1][2] + " (4.3.2)"; return l; }
      if (dt >= am[1][3]) {
        A.marcar(l, "nao_conforme", dt + " defeituoso(s) nas duas amostras ≥ nº de rejeição " + am[1][3] + " (4.3.2): lote rejeitado na inspeção visual (EM " + cfg.secRejInsp + ")");
        l.prov = "Rejeição total ou parcial à vista da inspeção (" + cfg.secRejInsp + "); reinspeção rigorosa (4.4) só após eliminar/recondicionar os defeituosos.";
        return l;
      }
      A.marcar(l, "pendente", "resultado da 2ª amostra entre Ac e Re — confira os números");
      return l;
    }

    // ---------------- requisito ----------------
    function avaliarReq(q, P, d, avisos) {
      var col0 = ((d.res || [])[0] || {}), col1 = ((d.res || [])[1] || {});
      var l = A.linha({ id: q.id, grupo: q.grupo, criterio: q.r, secao: secQ(q, P), metodo: q.metodo || "", exigido: exigQ(q, P), unid: q.u || "" });
      if (q.tipo === "externo") {
        var o = q.avaliar(d, P, avisos) || {};
        l.situacao = o.situacao || "pendente"; l.resultado = o.resultado || "—"; l.motivo = o.motivo || ""; l.origem = o.origem || "";
        if (o.exigido) l.exigido = o.exigido;
        if (l.situacao !== "conforme" && l.motivo) l.motivos = [{ situacao: l.situacao, texto: l.motivo }];
        if (l.situacao === "nao_exigido") l.disp = true;
        return l;
      }
      var v0 = col0[q.id], v1 = cfg.contraprova ? col1[q.id] : undefined;
      var imp = (d.imp || {})[q.id];
      l.origem = vazio(v0) ? "" : imp && String(imp.v) === String(v0) ? imp.reg : "digitado";
      function julgar(v) {
        var r = lerRes(v), o = { r: r, sit: null, txt: "", mot: "" };
        if (r.vazio) return o;
        if (r.disp) { o.txt = "dispensado"; return o; }
        if (q.tipo === "num" && ok(r.v)) {
          o.txt = (r.rel ? r.rel + " " : "") + fmtN(r.v, casasDe(r.txt, q.casas)) + (q.u ? " " + q.u : "");
          var c = confereNum(r.v, r.rel, limQ(q, P));
          o.sit = c === null ? null : c;
          if (c === false) o.mot = "fora do exigido (" + exigQ(q, P) + ")";
          return o;
        }
        var qv = q.tipo === "cor" && cfg.avaliarCor ? cfg.avaliarCor(r.txt, P) : { q: r.q };
        o.txt = r.txt;
        if (qv.q === true || qv.q === false) { o.sit = qv.q; if (!qv.q) o.mot = qv.motivo || "não atende (" + exigQ(q, P) + ")"; }
        else o.mot = qv.motivo || "resultado \"" + r.txt + "\" não reconhecido — escreva " + (q.tipo === "num" ? "o valor numérico" : "\"" + (q.bom || "satisfatória") + "\" ou \"" + (q.mau || "não satisfatória") + "\"");
        return o;
      }
      var j0 = julgar(v0), j1 = julgar(v1);
      l.resultado = j0.txt || "—";
      if (j0.r.disp || (j0.r.vazio && P.naoRealizados === "dispensados" && cfg.dispensa)) {
        if (cfg.dispensa) { l.situacao = "nao_exigido"; l.disp = true; l.resultado = j0.r.disp ? "dispensado" : "—"; l.motivo = (j0.r.disp ? "dispensado" : "não realizado — dispensado") + " a critério do órgão (" + cfg.dispensa + ")"; return l; }
        A.marcar(l, "pendente", "esta EM não prevê dispensa de ensaios"); return l;
      }
      if (j0.r.vazio) {
        if (!j1.r.vazio && j1.sit !== null) { l.resultado = "—"; l.contra = j1.txt; }
        else { A.marcar(l, "pendente", "sem resultado" + (q.metodo && !/n[ãa]o citado|^[—(]/.test(q.metodo) ? " (" + q.metodo + ")" : "")); return l; }
      }
      if (j0.sit === null && !j0.r.vazio) { A.marcar(l, "pendente", j0.mot); return l; }
      if (j0.sit === true) { l.situacao = "conforme"; if (!j1.r.vazio) avisos.push(q.r + ": contraprova registrada, mas o resultado original já atende."); return l; }
      // não atende (ou só contraprova)
      if (cfg.contraprova) {
        if (j1.r.vazio) {
          A.marcar(l, "nao_conforme", j0.mot + " — pode-se repetir o ensaio no exemplar reservado (" + cfg.contraprova + ")");
          l.prov = "Repetir o ensaio no exemplar reservado, em laboratório escolhido por consenso entre as partes (" + cfg.contraprova + ").";
          return l;
        }
        l.contra = j1.txt;
        l.resultado = (j0.txt || "—") + " → contraprova " + j1.txt;
        if (j1.sit === true) { l.situacao = "conforme"; l.motivo = "original fora do exigido; contraprova no exemplar reservado atende (" + cfg.contraprova + ")"; return l; }
        if (j1.sit === false) { A.marcar(l, "nao_conforme", "original e contraprova (" + cfg.contraprova + ") fora do exigido (" + exigQ(q, P) + ")"); return l; }
        A.marcar(l, "pendente", "contraprova: " + j1.mot); return l;
      }
      A.marcar(l, "nao_conforme", j0.mot);
      return l;
    }
    function casasDe(txt, c) {
      var m = /[.,](\d+)/.exec(String(txt || ""));
      return m ? m[1].length : 0;
    }

    function calcular(d) {
      var P = P_(d), avisos = [], linhas = [];
      (d.impNotas || []).forEach(function (n) { avisos.push("Importação: " + n); });
      if (INS) linhas.push(avaliarInspecao(P, d, avisos));
      if (cfg.amostra) { var la = cfg.amostra(P, d, avisos, G_INS); if (la) linhas.push(la); }
      visiveis(P).forEach(function (q) { linhas.push(avaliarReq(q, P, d, avisos)); });
      if (cfg.extra) cfg.extra({ P: P, d: d, linhas: linhas, avisos: avisos });
      var disp = linhas.filter(function (l) { return l.disp; });
      var textos = {
        ACEITO: { titulo: TXT.aceito || "PARTIDA ACEITA", texto: (INS ? "Inspeção e todos os requisitos" : "Todos os requisitos") + " avaliados atendem à " + cfg.codigo + " (" + cfg.secAceita + ")." +
          (disp.length ? " Ensaios dispensados: " + disp.length + "." : "") },
        RESSALVA: { titulo: (TXT.aceito || "PARTIDA ACEITA") + " COM RESSALVA", texto: "Nenhum requisito reprovado, mas há pontos a regularizar (ressalvas abaixo)." },
        PENDENTE: { titulo: "RECEBIMENTO PENDENTE", texto: "Nenhum requisito reprovado até aqui, mas faltam ensaios ou informações exigidos pela " + cfg.codigo + " para concluir o recebimento." },
        REJEITADO: { titulo: TXT.rejeitado || "PARTIDA REJEITADA", texto: "Há requisito não atendido: a " + cfg.codigo + " manda rejeitar o material (" + cfg.secRejeita + ")." },
      };
      var par = A.parecer(linhas, [], { textos: textos, nota: cfg.notaParecer || "",
        providencias: function (p, ls) { return ls.map(function (l) { return l.prov; }).filter(function (x, i, a) { return x && a.indexOf(x) === i; }); } });
      var cont = { conforme: 0, nao_conforme: 0, pendente: 0, nao_exigido: 0, ressalva: 0 };
      linhas.forEach(function (l) { var s = l.situacao === "sem_dados" ? "pendente" : l.situacao; if (cont[s] !== undefined) cont[s]++; });
      d.res = d.res || [];
      while (d.res.length < COLS.length) d.res.push({});
      return { tab: { res: d.res.map(function () { return {}; }), insp: (d.insp || []).map(function () { return {}; }) },
        resultados: { linhas: linhas, parecer: par, cont: cont, material: cfg.nomeMaterial ? cfg.nomeMaterial(P) : cfg.titulo, partida: P.partida || "" },
        avisos: avisos };
    }

    function sitHtml(l, relat) {
      if (l.disp) return relat ? "dispensado" : '<span style="opacity:.7">dispensado</span>';
      return A.situacaoHtml(l.situacao, relat);
    }
    function tabela(linhas, relat) {
      var cls = relat ? "gr" : "fe-resumo", g = "", L = '<td style="text-align:left">';
      var h = '<table class="' + cls + '"' + (relat ? "" : ' style="width:100%"') + '><thead><tr><th style="text-align:left">Requisito</th><th>Seção</th>' +
        '<th style="text-align:left">Método</th><th style="text-align:left">Resultado</th><th style="text-align:left">Exigido</th><th style="text-align:left">Origem</th>' +
        '<th style="text-align:left">Situação</th></tr></thead><tbody>';
      linhas.forEach(function (l) {
        if (l.grupo && l.grupo !== g) {
          g = l.grupo;
          h += '<tr><td colspan="7" style="text-align:left;font-weight:bold;background:' + (relat ? "#e9e9e9" : "rgba(127,127,127,.12)") + '">' + esc(g) + "</td></tr>";
        }
        h += "<tr>" + L + esc(l.criterio) + "</td><td>" + esc(l.secao || "") + "</td>" + L + esc(l.metodo || "") + "</td>" + L + "<b>" + esc(l.resultado || "—") + "</b></td>" +
          L + esc(l.exigido || "—") + "</td>" + L + '<small style="font-size:.9em">' + esc(l.origem || "") + "</small></td>" + L + sitHtml(l, relat) +
          (l.motivo && (l.situacao !== "conforme" || l.contra) && !l.disp ? '<br><small style="font-size:.9em">' + esc(l.motivo) + "</small>" : "") + "</td></tr>";
      });
      return h + "</tbody></table>";
    }
    function resumoCont(c) {
      return c.conforme + " conforme(s) · " + c.nao_conforme + " não conforme(s) · " + c.pendente + " pendente(s)" +
        (c.ressalva ? " · " + c.ressalva + " com ressalva" : "") + (c.nao_exigido ? " · " + c.nao_exigido + " dispensado(s)" : "");
    }

    // ---------------- parâmetros e tabelas ----------------
    var params = (cfg.params || []).concat([
      { k: "fabricante", r: "Fabricante / fornecedor" },
      { k: "produto", r: "Nome comercial / numeração do produto" },
      { k: "partida", r: "Partida (lote) de fabricação" },
      { k: "dataFab", r: "Data de fabricação", ph: "dd/mm/aaaa" },
      { k: "validade", r: cfg.rotuloValidade || "Prazo de validade", ph: cfg.phValidade !== undefined ? cfg.phValidade : "dd/mm/aaaa" },
      { k: "nf", r: "Nota fiscal / pedido nº" },
      { k: "quantidade", r: "Quantidade entregue" + (cfg.unidCompra ? " (" + cfg.unidCompra + ")" : ""), dica: cfg.dicaQtd || "" },
    ]);
    if (INS) {
      params.push({ k: "nRec", r: "Nº de " + INS.unid + " do lote (" + INS.codigo + ", 3.1)", ph: "ex.: 120", dica: "lote: " + (cfg.inspecao.lote || "mesmo tipo e data de fabricação") });
      params.push({ k: "inspTipo", r: "Inspeção visual", tipo: "select", opcoes: [["normal", "Normal (" + INS.normal.tab + ")"], ["rigorosa", "Rigorosa — reinspeção de lote rejeitado (" + INS.rigorosa.tab + ", 4.4)"]] });
    }
    (cfg.paramsAmostra || []).forEach(function (p) { params.push(p); });
    if (cfg.dispensa) params.push({ k: "naoRealizados", r: "Requisitos sem resultado", tipo: "select",
      opcoes: [["pendentes", "Pendentes — todos os ensaios da EM são exigidos"], ["dispensados", "Dispensados pelo órgão (" + cfg.dispensa + ")"]],
      dica: "a EM permite ao órgão dispensar ensaios; também é possível escrever \"dispensado\" no resultado" });
    if (fontes.length) params.push({ k: "imp", r: "Importar resultados de ensaios salvos (" + fontes.map(A.codigoCurto).join(", ") + ")", tipo: "importarVarios", de: fontes,
      dica: "os ensaios são recalculados com a especificação/parâmetros desta ficha; o pior resultado de cada requisito vai para a tabela",
      aplicar: aplicar });

    function tabelas(d) {
      var P = P_(d), T = [];
      if (INS) {
        if (d && Array.isArray(d.insp)) { while (d.insp.length < 2) d.insp.push({}); if (d.insp.length > 2) d.insp.length = 2; }
        T.push({ chave: "insp", titulo: "Inspeção visual — " + INS.codigo + " (defeitos: " + INS.defeitos + ")", rotulo: "Amostra", iniciais: 2, min: 2, fixo: true,
          nomes: ["1ª amostra (ou única)", "2ª amostra"], dica: "a 2ª amostra só quando os defeituosos da 1ª ficarem entre o nº de aceitação e o de rejeição (4.3.1)",
          linhas: [{ k: "n", r: INS.unid.charAt(0).toUpperCase() + INS.unid.slice(1) + " examinados", u: "un" },
            { k: "def", r: INS.unid.charAt(0).toUpperCase() + INS.unid.slice(1) + " defeituosos (1 ou mais defeitos)", u: "un" },
            { k: "tipos", r: "Defeitos observados", texto: true, ph: "ex.: 1 amassado" }] });
      }
      (cfg.tabelasAntes ? cfg.tabelasAntes(d, P) : []).forEach(function (t) { T.push(t); });
      if (d && Array.isArray(d.res)) { while (d.res.length < COLS.length) d.res.push({}); if (d.res.length > COLS.length) d.res.length = COLS.length; }
      var linhas = [], g = null;
      visiveis(P).forEach(function (q) {
        if (q.tipo === "externo") return;
        if (q.grupo !== g) { linhas.push({ grupo: q.grupo }); g = q.grupo; }
        var ph = q.ph || (q.tipo === "num" ? exigQ(q, P) : (q.bom || "satisfatória") + " / " + (q.mau || "não satisfatória"));
        linhas.push({ k: q.id, r: q.r + " (" + secQ(q, P) + ")" + (q.metodo ? " — " + q.metodo : ""), u: q.tipo === "num" ? q.u || "" : "", texto: q.tipo !== "num", ph: ph });
      });
      T.push({ chave: "res", titulo: "Resultados dos ensaios e verificações — " + cfg.codigo, rotulo: "Requisito", iniciais: COLS.length, min: COLS.length, fixo: true, nomes: COLS,
        dica: "resultado de cada requisito (o marcador de posição mostra o exigido); \"dispensado\" quando o órgão dispensar o ensaio" +
          (cfg.contraprova ? "; contraprova = repetição no exemplar reservado (" + cfg.contraprova + ")" : ""), linhas: linhas });
      (cfg.tabelasDepois ? cfg.tabelasDepois(d, P) : []).forEach(function (t) { T.push(t); });
      return T;
    }

    return {
      titulo: cfg.titulo,
      resumo: cfg.resumo,
      lote: true,
      blocos: [],
      rotuloImportar: function (r) { return (r.material || "") + (r.partida ? " · partida " + r.partida : "") + " · " + ((r.parecer || {}).titulo || "—"); },
      params: params,
      padrao: Object.assign({ inspTipo: "normal", naoRealizados: "pendentes" }, cfg.padrao || {}),
      tabelas: tabelas,
      calcular: calcular,
      resultadosHtml: function (calc) {
        var r = calc.resultados;
        return A.htmlParecer(r.parecer) + '<div class="fe-res">' + A.cartao(esc(resumoCont(r.cont)), "Requisitos da " + esc(cfg.codigo) + " — " + esc(r.material)) + "</div>" +
          '<div class="fe-tab-wrap">' + tabela(r.linhas, false) + "</div>";
      },
      relatorio: {
        notas: cfg.notas,
        resultados: function (calc, d) {
          var r = calc.resultados, P = P_(d);
          var rows = [["Material", r.material]];
          if (P.fabricante || P.produto) rows.push(["Fabricante / produto", [P.fabricante, P.produto].filter(Boolean).join(" — ")]);
          if (P.partida) rows.push(["Partida de fabricação", P.partida + (P.dataFab ? " (fabricação " + P.dataFab + ")" : "")]);
          if (P.quantidade) rows.push(["Quantidade", P.quantidade + (cfg.unidCompra ? " " + cfg.unidCompra : "") + (P.nf ? " — NF/pedido " + P.nf : "")]);
          rows.push(["Parecer", r.parecer.titulo]);
          rows.push(["Requisitos", resumoCont(r.cont)]);
          return rows;
        },
        extraHtml: function (calc) { var r = calc.resultados; return A.htmlParecer(r.parecer, { relat: true }) + tabela(r.linhas, true); },
      },
      exemplos: cfg.exemplos,
    };
  };

  // atalho dos exemplos: importa exemplos das fichas ME e completa os campos digitados
  R.exemplo = function (F, dados, refs, digitados) {
    var d = dados;
    d.res = d.res || [{}];
    if (refs && refs.length) A.exemplos.importar(F.params, d, "imp", refs);
    Object.keys(digitados || {}).forEach(function (k) { d.res[0][k] = digitados[k]; });
    return d;
  };

  FE.recebimentoMaterial = R;

  // =====================================================================================
  // Tintas para sinalização horizontal (DNER-EM 276/00, 368/00 e 371/00) — limites de FE.sinalizacao
  // =====================================================================================
  var S = FE.sinalizacao;
  var TINTA_ME = {
    sangramento: "dner-me-018-94", flexibilidade: "dner-me-019-94", agua: "dner-me-020-94", aderencia: "dner-me-139-94",
    diluicao: "dner-me-184-94", nata: "dner-me-185-94", calor: "dner-me-234-94", breu: "dner-me-240-94",
  };
  var NOMES_ME = {
    consistencia: "DNER-ME 028/94", estabArm: "DNER-ME 038/94", naoVolatil: "DNER-ME 235/94", veicNV: "DNER-ME 235/94 · PRO 250/94",
    veicTotal: "DNER-ME 235/94 · PRO 250/94", pigmento: "DNER-ME 237/94", tio2: "DNER-ME 238/94", pbcro4: "DNER-ME 233/94",
    secagem: "DNER-ME 186/94", brilho: "DNER-ME 236/94", abrasao: "DNER-ME 239/94", finura: "DNER-ME 027/97", cobertura: "DNER-ME 026/98",
    massaEsp: "DNER-ME 190/94", solidosVol: "—",
    sangramento: "DNER-ME 018/94", flexibilidade: "DNER-ME 019/94", agua: "DNER-ME 020/94", aderencia: "DNER-ME 139/94", diluicao: "DNER-ME 184/94",
    nata: "DNER-ME 185/94", calor: "DNER-ME 234/94", breu: "DNER-ME 240/94", cor: "DNER-ME 183/94",
  };
  // importação dos ensaios quantitativos: ficha de origem e valor dos resultados
  var TINTA_IMP = {
    consistencia: ["dner-me-028-94", function (r) { return r.uk; }],
    estabArm: ["dner-me-038-94", function (r) { return r.delta; }],
    naoVolatil: ["dner-me-235-94", function (r) { return r.NV; }],
    veicNV: ["dner-me-235-94", function (r) { return r.Sv; }],
    veicTotal: ["dner-me-235-94", function (r) { return r.Vt; }],
    pigmento: ["dner-me-237-94", function (r) { return r.pct; }],
    tio2: ["dner-me-238-94", function (r) { return r.pct; }],
    pbcro4: ["dner-me-233-94", function (r) { return r.pct; }],
    secagem: ["dner-me-186-94", function (r) { return r.t; }],
    brilho: ["dner-me-236-94", function (r) { return r.b; }],
    abrasao: ["dner-me-239-94", function (r) { return r.A; }],
    finura: ["dner-me-027-97", function (r) { return r.H; }],
    cobertura: ["dner-me-026-98", function (r) { return r.L; }],
  };
  // limites próprios (não estão em FE.sinalizacao)
  var TINTA_EXTRA = {
    massaEsp: { nome: "Massa específica", un: "g/cm³", casas: 2, em276: { min: 1.59 }, em368: { min: 1.30, max: 1.45 }, em371: { min: 1.35, max: 1.45 } },
    solidosVol: { nome: "Sólidos por volume", un: "%", casas: 2, em276: { min: 62 } },
  };
  function limTinta(key, em) {
    return function (P) {
      if (TINTA_EXTRA[key]) { var e = TINTA_EXTRA[key][em]; return e ? { min: e.min, max: e.max } : null; }
      return S.limite(key, { espec: em, cor: P.cor });
    };
  }
  function linhaQuant(key, em, grupo, secao, extra) {
    var L = S.LIM[key] || TINTA_EXTRA[key], imp = TINTA_IMP[key];
    var q = { id: key, grupo: grupo, tipo: "num", r: extra && extra.r || L.nome, u: L.un, casas: L.casas, casasLim: 2, secao: secao,
      metodo: NOMES_ME[key] || "", lim: limTinta(key, em) };
    if (imp) q.imp = { de: [imp[0]], valor: function (r) { var v = imp[1](r); return ok(v) ? v : null; } };
    return Object.assign(q, extra || {});
  }
  function linhaQual(key, em, grupo, secao, extra) {
    var Q = S.QUALI[key], fid = TINTA_ME[key];
    var req = Q && Q[em] ? Q[em].req : "Satisfatória";
    var aus = /aus[êe]ncia/i.test(req);
    var q = { id: key, grupo: grupo, tipo: "qual", r: Q ? Q.nome : key, secao: secao, metodo: NOMES_ME[key] || "", exig: req,
      bom: aus ? "ausência" : "satisfatória", mau: aus ? "presença" : "não satisfatória" };
    if (fid) q.imp = { de: [fid], valor: function (r) { return r.ver === true || r.ver === false ? { q: r.ver, txt: String(r.texto || "").toLowerCase() } : null; } };
    return Object.assign(q, extra || {});
  }
  // cor: notação Munsell avaliada pela DNER-ME 183/94 (mesma exigência nas três EM)
  function avaliarCorTinta(em) {
    return function (txt, P) {
      var t = String(txt || "");
      if (/n[ãa]o\s+(conforme|atende)/i.test(t)) return { q: false };
      if (/\b(conforme|atende)\b/i.test(t)) return { q: true };
      var sn = /^(s|sim|n|n[ãa]o)$/i.test(t.trim()) ? lerQual(t) : undefined;
      if (sn !== undefined) return { q: sn };
      var F = FE.FICHAS["dner-me-183-94"];
      if (!F) return {};
      try {
        var r = F.calcular({ params: { cor: P.cor || "branca", espec: em }, cps: [{ not: t, tol: "" }] }).resultados;
        return r.conforme === true || r.conforme === false ? { q: r.conforme, motivo: (r.motivos || []).join("; ") }
          : { motivo: "notação \"" + t + "\" diferente da nominal: informe \"conforme\" ou \"não conforme\" (comparação com a escala — DNER-ME 183/94)" };
      } catch (e) { return {}; }
    };
  }
  function exigCor(P) {
    return P.cor === "amarela" ? "10YR 7,5/14 e suas tolerâncias, exceto 2,0Y 7,5/14 e 10YR 6,5/14" : "N 9.5 (tolerância N 9.0) ou padrão branco";
  }

  // cfg: {em, id, codigo, titulo, resumo, tabQuant, tabQual, quant: [keys], qual: [keys ou objetos], gerais: [...], notas, exemplos}
  R.tinta = function (o) {
    var em = o.em, GG = "Condições gerais (seção 4)", GQ = "Requisitos quantitativos (" + o.tabQuant + ")", GL = "Requisitos qualitativos (" + o.tabQual + ")";
    var reqs = [{ id: "aspecto", grupo: GG, tipo: "qual", r: "Sem sedimentos, nata e grumos não redispersíveis; aspecto homogêneo após agitação manual", secao: "4.2",
      metodo: "exame na abertura do recipiente", exig: "atende", bom: "atende", mau: "não atende", ph: "atende / não atende" }];
    (o.gerais || []).forEach(function (g) { reqs.push(g.key ? linhaQual(g.key, em, GG, g.secao, g.extra) : Object.assign({ grupo: GG }, g)); });
    o.quant.forEach(function (k) {
      var x = typeof k === "string" ? { key: k } : k, key = x.key;
      var e = { };
      if (key === "tio2") e.se = function (P) { return P.cor !== "amarela"; };
      if (key === "pbcro4") { e.se = function (P) { return P.cor === "amarela"; }; e.r = "Cromato de chumbo (PbCrO₄) no pigmento — tinta amarela"; }
      if (key === "tio2") e.r = "Dióxido de titânio (TiO₂) no pigmento — tinta branca";
      if (key === "cobertura") e.r = "Poder de cobertura — leitura máxima na placa cristal nº 7";
      if (key === "massaEsp" && em !== "em276") e.metodo = "DNER-ME 190/94";
      if (key === "solidosVol") e.metodo = "método não citado na EM";
      reqs.push(linhaQuant(key, em, GQ, x.secao || o.tabQuant + (key === "cobertura" ? " e Tabela 2" : ""), Object.assign(e, x.extra || {})));
    });
    o.qual.forEach(function (k) {
      if (typeof k !== "string") { reqs.push(Object.assign({ grupo: GL, tipo: "qual", secao: o.tabQual }, k)); return; }
      if (k === "cor") {
        reqs.push({ id: "cor", grupo: GL, tipo: "cor", r: "Cor (notação Munsell Highway)", secao: o.tabQual + " · 4.3", metodo: "DNER-ME 183/94", exig: exigCor,
          ph: "ex.: N 9.5 / 10YR 7,5/14 / conforme",
          imp: { de: ["dner-me-183-94"], valor: function (r) {
            if (r.conforme === true || r.conforme === false) return { q: r.conforme, txt: (r.notacoes || []).join("; ") + " — " + (r.conforme ? "conforme" : "não conforme") };
            return (r.notacoes || []).length ? { txt: r.notacoes.join("; ") } : null;
          } } });
        return;
      }
      reqs.push(linhaQual(k, em, GL, o.tabQual));
    });
    return R.criar({
      codigo: o.codigo, titulo: o.titulo, resumo: o.resumo, notas: o.notas, exemplos: o.exemplos,
      nomeMaterial: function (P) { return "Tinta " + (P.cor === "amarela" ? "amarela" : "branca") + " — " + S.ESPECS[em].nome; },
      unidCompra: "L", dicaQtd: "a unidade de compra é o litro",
      rotuloValidade: "Prazo de validade (estocagem mín. 6 meses após a entrega)",
      params: [
        { k: "cor", r: "Cor da tinta", tipo: "select", recarrega: true, opcoes: [["branca", "Branca (branco-neve)"], ["amarela", "Amarela"]],
          dica: "muda os requisitos de pigmento, abrasão e cobertura" },
      ],
      padrao: { cor: "branca" },
      inspecao: { plano: "pro231", secao: "6.1 · 7.1", lote: "recipientes de um só tipo, capacidade e conteúdo, com a mesma data de fabricação (PRO 231, 3.1)" },
      secRejInsp: "7.1", secAceita: "7.2", secRejeita: "7.2", dispensa: "6.3.3", secInsp: "6",
      paramsAmostra: [{ k: "volAm", r: "Amostra para o laboratório (L)", ph: "ex.: 3,6", dica: "mínimo de 2 litros por cor, tipo e lote (DNER-PRO 104/94, 4.1.1)" },
        { k: "recAm", r: "Recipiente(s) da amostra — identificação / lacre" }],
      amostra: function (P, d, avisos, grupo) {
        var v = num(P.volAm), l = A.linha({ id: "amostra", grupo: grupo, criterio: "Amostra para ensaios de laboratório", secao: "6.2", metodo: "DNER-PRO 104/94",
          exigido: "≥ 2 L por cor, tipo e lote (4.1.1)", resultado: ok(v) ? fmt(v, 1) + " L" + (P.recAm ? " — " + P.recAm : "") : "—" });
        if (!ok(v)) A.marcar(l, "pendente", "registre o volume da amostra enviada ao laboratório");
        else if (v < 2 - EPS) { A.marcar(l, "ressalva", "amostra de " + fmt(v, 1) + " L, abaixo do mínimo de 2 L (DNER-PRO 104/94, 4.1.1)"); l.prov = "Completar a amostra (mínimo de 2 L por cor, tipo e lote)."; }
        return l;
      },
      conferirOrigem: function (e, P, notas) {
        var c = ((e.dados || {}).params || {}).cor;
        if (c && P.cor && c !== P.cor && /^dner-me-(018|019|020|026|028|038|139|183|184|185|186|233|234|235|236|237|238|239|240)/.test(e.ficha)) {
          notas.push(A.importacao.rotulo(e) + ": ensaio de tinta " + c + "; esta partida é de tinta " + P.cor + " — confira.");
        }
      },
      sobrepor: function (fid) { return /^dner-me-/.test(fid) ? { espec: em } : null; },
      avaliarCor: avaliarCorTinta(em),
      requisitos: reqs,
    });
  };

  // =====================================================================================
  // DNER-EM 276/00 — tinta à base de resina acrílica emulsionada em água
  // =====================================================================================
  var F276 = FE.FICHAS["dner-em-276-00"] = R.tinta({
    em: "em276", codigo: "DNER-EM 276/00",
    titulo: "Recebimento de tinta para sinalização horizontal — resina acrílica emulsionada em água",
    resumo: "Recebimento da partida: inspeção visual dos recipientes (DNER-PRO 231/94), amostra (DNER-PRO 104/94) e requisitos das Tabelas 1, 2 e 3 (consistência, estabilidade, não voláteis, secagem, massa específica, brilho, sólidos, finura, abrasão, cobertura, cor e ensaios qualitativos), com importação das fichas DNER-ME e parecer (seção 7).",
    tabQuant: "Tabela 1", tabQual: "Tabela 3",
    gerais: [{ key: "sangramento", secao: "4.14" }],
    quant: ["consistencia", "estabArm", "naoVolatil", "veicNV", "secagem", "massaEsp", "brilho", "solidosVol", "finura", "abrasao", "cobertura"],
    qual: ["cor", "flexibilidade", "calor", "agua", "diluicao", "aderencia", "nata",
      { id: "ivnv", r: "Identificação do veículo não volátil (espectrograma no infravermelho)", metodo: "método não citado na EM",
        exig: "bandas de resinas acrílicas, sem outro tipo de copolímero", bom: "atende", mau: "não atende", ph: "atende / não atende" },
      { id: "gasolina", r: "Resistência à gasolina, 2 h", metodo: "método não citado na EM", exig: "Inalterada", bom: "inalterada", mau: "alterada" },
      { id: "intCor", r: "Resistência ao intemperismo (400 h) — cor", metodo: "método não citado na EM", exig: "Satisfatória" },
      { id: "intInt", r: "Resistência ao intemperismo (400 h) — integridade", metodo: "método não citado na EM", exig: "Satisfatória" }],
    notas: "Critérios da DNER-EM 276/00: condições gerais (seção 4), Tabela 1 (quantitativos), Tabela 2 (poder de cobertura, placa cristal nº 7: branca ≤ 10 mm, amarela ≤ 16 mm) e Tabela 3 (qualitativos). " +
      "Inspeção visual pela DNER-PRO 231/94 (Tabela 1 normal / Tabela 2 rigorosa; um recipiente com um ou mais defeitos é defeituoso) — o órgão pode rejeitar total ou parcialmente à vista da inspeção (7.1). Amostragem: DNER-PRO 104/94 (≥ 2 L por cor, tipo e lote). " +
      "A partida que satisfaz as seções 4 e 5 é aceita; caso contrário, rejeitada (7.2). A exclusivo critério do órgão, podem ser dispensados ensaios (6.3.3). " +
      "Ensaios importados das fichas DNER-ME são recalculados e comparados com os limites desta EM (o pior resultado de cada requisito). A EM não cita método para sólidos por volume, identificação do veículo, gasolina e intemperismo, nem a DNER-ME 026/98 (cobertura), 027/97 (finura) e 184/94 (diluição) na seção 2; a massa específica é a DNER-ME 190/94, fora do acervo.",
    exemplos: [
      { nome: "Tinta branca — partida aceita (ensaios importados das fichas DNER-ME)", dados: function () {
        var d = { ident: { registro: "REC-TA-2026-01", data: "2026-04-14", obra: "Obra A — sinalização horizontal", origem: "Fornecedor A", camada: "Tinta acrílica emulsionada — branca" },
          params: { cor: "branca", fabricante: "Fornecedor A", produto: "Tinta acrílica emulsionada — branca", partida: "0102", dataFab: "02/03/2026", validade: "02/03/2027",
            nf: "004512", quantidade: "3600", nRec: "200", inspTipo: "normal", volAm: "3,6", recAm: "lata de 3,6 L lacrada nº 17" },
          insp: [{ n: "15", def: "0", tipos: "" }, {}] };
        return R.exemplo(F276, d, [["dner-me-028-94", 0], ["dner-me-038-94", 0], ["dner-me-186-94", 0], ["dner-me-236-94", 0], ["dner-me-027-97", 0],
          ["dner-me-026-98", 0], ["dner-me-018-94", 0], ["dner-me-183-94", 0], ["dner-me-019-94", 0], ["dner-me-234-94", 0], ["dner-me-020-94", 0],
          ["dner-me-184-94", 0], ["dner-me-139-94", 0], ["dner-me-185-94", 0]],
          { aspecto: "atende", naoVolatil: "78,4", veicNV: "45,1", massaEsp: "1,62", solidosVol: "63,5", abrasao: "104", ivnv: "atende", gasolina: "inalterada",
            intCor: "satisfatória", intInt: "satisfatória" });
      } },
      { nome: "Tinta amarela — partida rejeitada (consistência, não voláteis, abrasão, cobertura, finura; 1 recipiente defeituoso; demais ensaios dispensados)", dados: function () {
        var d = { ident: { registro: "REC-TA-2026-02", data: "2026-05-20", obra: "Obra B — sinalização horizontal", origem: "Fornecedor B", camada: "Tinta acrílica emulsionada — amarela" },
          params: { cor: "amarela", fabricante: "Fornecedor B", produto: "Tinta acrílica emulsionada — amarela", partida: "0103", dataFab: "10/04/2026", nf: "118877",
            quantidade: "1800", nRec: "100", inspTipo: "normal", volAm: "1,5", naoRealizados: "dispensados" },
          insp: [{ n: "7", def: "1", tipos: "1 recipiente amassado com vazamento" }, {}] };
        return R.exemplo(F276, d, [["dner-me-235-94", 1], ["dner-me-239-94", 1], ["dner-me-026-98", 1], ["dner-me-027-97", 1], ["dner-me-028-94", 1]],
          { aspecto: "atende", secagem: "11" });
      } },
    ],
  });
})();
