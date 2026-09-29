/*
 * Ficha: taxa de aplicação de ligante (e de espalhamento de agregado) por bandeja.
 * Registrada em DNIT 144/2014-ES (não há ME próprio: o controle está nas especificações de serviço).
 * O parâmetro "Serviço" escolhe a ES e traz as taxas recomendadas, tolerâncias e o procedimento de controle:
 *   DNIT 144/2014-ES imprimação · DNIT 145/2012-ES pintura de ligação · DNIT 146/147/148-2012-ES tratamentos
 *   superficiais simples/duplo/triplo · DNER-ES 391/392/393/99 tratamentos com asfalto polímero ·
 *   DNER-ES 394/99 macadame por penetração com asfalto polímero · DNER-ES 395/99 pintura de ligação com asfalto polímero.
 * (DNIT 150/2010-ES lama asfáltica não entra: o teor de ligante é controlado por extração Soxhlet, 7.2.2, e não por bandeja.)
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  // ---------- coeficiente k (plano de amostragem variável) ----------
  // DNER-PRO 277/97, Tabela 1 (reproduzida em DNER-ES 394/99 7.2.4 e 395/99 7.2.2.3) — não tabela n = 11
  var K_277 = [[5, 1.55], [6, 1.41], [7, 1.36], [8, 1.31], [9, 1.25], [10, 1.21], [12, 1.16], [13, 1.13], [14, 1.11],
    [15, 1.10], [16, 1.08], [17, 1.06], [19, 1.04], [21, 1.01]];
  // DNER-ES 391, 392 e 393/99 (7.2.3): a mesma tabela com n = 11 → k = 1,19
  var K_39X = K_277.slice(0, 6).concat([[11, 1.19]], K_277.slice(6));
  // n não tabelado: usa-se o k do maior n tabelado abaixo dele (mais conservador); n > 21 → 1,01
  function coefK(n, tab) {
    if (!(n >= 5)) return { k: NaN, exato: false };
    var sel = null;
    tab.forEach(function (x) { if (x[0] <= n) sel = x; });
    return { k: sel[1], exato: sel[0] === n, nTab: sel[0] };
  }

  // ---------- serviços ----------
  // tipo do ligante: cap (cimento asfáltico — pesa-se o próprio ligante), emu (emulsão / asfalto diluído — há resíduo)
  var LIG = {
    cm30: { nome: "Asfalto diluído CM-30 (DNER-EM 363/97)", tipo: "emu", resNome: "destilação (NBR 14856)" },
    eai: { nome: "Emulsão asfáltica EAI (DNIT 165/2013-EM)", tipo: "emu", resNome: "resíduo por evaporação (NBR 14376)" },
    rr1c: { nome: "Emulsão RR-1C (DNER-EM 369/97)", tipo: "emu", resNome: "resíduo por evaporação (NBR 14376)" },
    outra145: { nome: "Outra emulsão (ex.: RR-2C) — não prevista em 5.1 a", tipo: "emu", foraNorma: true, resNome: "resíduo da emulsão" },
    cap: { nome: "Cimento asfáltico CAP-150/200 (DNIT 095/2006-EM)", tipo: "cap" },
    rr2c: { nome: "Emulsão RR-2C (DNER-EM 369/97)", tipo: "emu", resNome: "resíduo de destilação (NBR 6568)" },
    capPol: { nome: "Cimento asfáltico modificado por polímero SBS", tipo: "cap" },
    emuPol: { nome: "Emulsão RR-1C ou RR-2C modificada por polímero SBS", tipo: "emu", resNome: "resíduo por evaporação (NBR 6568)" },
    emuPol395: { nome: "Emulsão RR-1C modificada por polímero SBR ou SBS", tipo: "emu", resNome: "resíduo por evaporação (NBR 6568)" },
  };

  // rec: taxas recomendadas por camada [ligante l/m², agregado kg/m²]
  var SERV = {
    "144": { cod: "DNIT 144/2014-ES", nome: "Imprimação", ligantes: ["eai", "cm30"], agr: false, tolL: 0.2, secTolL: "5.3 e",
      secT: "7.2.2 a", k: K_277, secK: "7.5 (DNER-PRO 277/97, Tabela 1)", regraArea: "4000", secMin: "7.2.2 b, c",
      recLig: { cm30: [0.8, 1.6], eai: [0.9, 1.7] }, secRec: "5.1 b",
      formula: "TR = (P₂ − P₁) / A, com a bandeja pesada depois da cura total (até massa constante); T = TR / resíduo do carregamento (7.2.2 a)" },
    "145": { cod: "DNIT 145/2012-ES", nome: "Pintura de ligação", ligantes: ["rr1c", "outra145"], agr: false, diluida: true, tolL: 0.2,
      secTolL: "5.3 f", secT: "7.2.2 a", k: K_277, secK: "7.5 (DNER-PRO 277/97)", regraArea: "4000", secMin: "7.2.2 b, c",
      recLig: [0.8, 1.0], recRes: [0.3, 0.4], secRec: "5.1 b",
      formula: "TR = (P₂ − P₁) / A, com a bandeja pesada depois da ruptura total (até massa constante); T da emulsão diluída pelo resíduo do carregamento (7.2.2 a)" },
    "146": { cod: "DNIT 146/2012-ES", nome: "Tratamento superficial simples", ligantes: ["rr2c", "cap"], agr: true, tolL: 0.2, tolA: 1.5,
      secTolL: "7.2.2 a", secTolA: "7.2.2 c", secT: "7.2.2 a, b", k: K_277, secK: "7.5", regraArea: "3000", secMin: "7.2.2 d",
      camadas: [[0.8, 1.2, 8, 12]], secRec: "Tabela 2" },
    "147": { cod: "DNIT 147/2012-ES", nome: "Tratamento superficial duplo", ligantes: ["rr2c", "cap"], agr: true, tolL: 0.2, tolA: 1.5,
      secTolL: "7.2.2 a", secTolA: "7.2.2 c", secT: "7.2.2 a, b", k: K_277, secK: "7.5", regraArea: "3000", secMin: "7.2.2 d",
      camadas: [[1.2, 1.8, 20, 25], [0.8, 1.2, 10, 12]], secRec: "Tabela 2" },
    "148": { cod: "DNIT 148/2012-ES", nome: "Tratamento superficial triplo", ligantes: ["rr2c", "cap"], agr: true, tolL: 0.2, tolA: 1.5,
      secTolL: "7.2.2 a", secTolA: "7.2.2 c", secT: "7.2.2 a, b", k: K_277, secK: "7.5", regraArea: "3000", secMin: "7.2.2 d",
      camadas: [[1.0, 1.5, 20, 25], [0.6, 0.9, 10, 12], [0.4, 0.6, 5, 7]], secRec: "Tabela 2" },
    "391": { cod: "DNER-ES 391/99", nome: "Tratamento superficial simples com asfalto polímero", ligantes: ["capPol", "emuPol"], agr: true,
      residual: true, tolL: 0.2, tolA: 1.5, secTolL: "7.2.2.1", secTolA: "7.2.2.2", secT: "7.2.2.1", k: K_39X, secK: "7.2.3 e 7.4.2",
      regraArea: "3000", secMin: "7.2.3", camadas: [[0.8, 1.2, 8, 12]], secRec: "5.1.4.4" },
    "392": { cod: "DNER-ES 392/99", nome: "Tratamento superficial duplo com asfalto polímero", ligantes: ["capPol", "emuPol"], agr: true,
      residual: true, tolL: 0.2, tolA: 1.5, secTolL: "7.2.2.1", secTolA: "7.2.2.2", secT: "7.2.2.1", k: K_39X, secK: "7.2.3 e 7.4.2",
      regraArea: "3000", secMin: "7.2.3", camadas: [[1.2, 1.8, 20, 25], [0.8, 1.2, 10, 12]], secRec: "5.1.4.4" },
    "393": { cod: "DNER-ES 393/99", nome: "Tratamento superficial triplo com asfalto polímero", ligantes: ["capPol", "emuPol"], agr: true,
      residual: true, tolL: 0.2, tolA: 1.5, secTolL: "7.2.2.1", secTolA: "7.2.2.2", secT: "7.2.2.1", k: K_39X, secK: "7.2.3 e 7.4.2",
      regraArea: "3000", secMin: "7.2.3", camadas: [[1.0, 1.5, 20, 25], [0.6, 0.9, 10, 12], [0.4, 0.6, 5, 7]], secRec: "5.1.4.4" },
    "394": { cod: "DNER-ES 394/99", nome: "Macadame por penetração com asfalto polímero", ligantes: ["capPol", "emuPol"], agr: true,
      residual: true, faixaQuadro: true, secT: "7.2.3", secTolL: "7.2.3 (quadro de 5.1.3)", secTolA: "7.2.1 (quadro de 5.1.3)",
      k: K_277, secK: "7.2.4", regraArea: "3000", secMin: "7.2.4", secRec: "quadro de 5.1.3" },
    "395": { cod: "DNER-ES 395/99", nome: "Pintura de ligação com asfalto polímero", ligantes: ["emuPol395"], agr: false, diluida: true,
      tolL: 0.2, secTolL: "5.3.4", secT: "7.2.2.1", k: K_277, secK: "7.2.2.3 e 7.3.3", regraArea: "4000", secMin: "7.2.2.2, 7.2.2.3",
      recRes: [0.3, 0.4], secRec: "5.1.2" },
  };
  // DNER-ES 394/99, quadro de 5.1.3: agregado (kg/m²), CAP 1ª e 2ª aplicação (l/m²); 2ª camada de agregado = faixa II-A (5.1.4.2)
  var Q394 = { "I-A": [160, 210, 4.5, 8.2, 5.4, 6.8], "I-B": [135, 160, 4.1, 5.4, 3.2, 6.8], "I-C": [110, 135, 3.2, 5.0, 3.6, 4.5],
    "I-D": [80, 110, 2.7, 4.1, 1.8, 4.5], "I-E": [55, 80, 1.9, 3.6, 1.3, 2.7] };

  function servico(d) { var s = ((d.params || {}).servico) || "144"; return SERV[s] ? s : "144"; }
  function ligDe(d) {
    var S = SERV[servico(d)], l = (d.params || {}).ligante;
    return S.ligantes.indexOf(l) >= 0 ? l : S.ligantes[0];
  }
  function nCamadas(d) { var s = servico(d); return s === "394" ? 2 : (SERV[s].camadas || []).length; }
  function camadaDe(d) { var c = Number((d.params || {}).camada) || 1; return Math.min(Math.max(c, 1), Math.max(nCamadas(d), 1)); }
  function ehEmulsao(d) { return LIG[ligDe(d)].tipo === "emu"; }
  function criterioFaixa(d) { return servico(d) === "394" || (d.params || {}).criterio === "faixa"; }

  // faixa recomendada pela norma para a camada: {lig:[a,b], agr:[a,b], res:[a,b]}
  function recomendada(d) {
    var s = servico(d), S = SERV[s], c = camadaDe(d), o = {};
    if (s === "394") {
      var q = Q394[(d.params || {}).faixa394] || Q394["I-C"];
      o.lig = c === 1 ? [q[2], q[3]] : [q[4], q[5]];
      o.agr = c === 1 ? [q[0], q[1]] : [6, 6];
    } else if (S.camadas) {
      var t = S.camadas[c - 1]; o.lig = [t[0], t[1]]; o.agr = [t[2], t[3]];
    } else if (S.recLig) {
      o.lig = Array.isArray(S.recLig) ? S.recLig : S.recLig[ligDe(d)];
    }
    if (S.recRes) o.res = S.recRes;
    return o;
  }
  function faixaTxt(f, u) { return f ? (f[0] === f[1] ? fmt(f[0], f[0] < 3 ? 1 : 0) : fmt(f[0], f[0] < 3 ? 1 : 0) + " a " + fmt(f[1], f[1] < 3 ? 1 : 0)) + " " + u : "—"; }

  // limites de aceitação: projeto ± tolerância (ou faixa de projeto informada)
  function limites(d, mat) {
    var P = d.params || {}, S = SERV[servico(d)], rec = recomendada(d);
    var L = mat === "lig" ? "L" : "A", tol = mat === "lig" ? S.tolL : S.tolA;
    if (criterioFaixa(d)) {
      var mn = num(P["min" + L]), mx = num(P["max" + L]), auto = false;
      if (servico(d) === "394" && !ok(mn) && !ok(mx) && rec[mat === "lig" ? "lig" : "agr"]) {
        var f = rec[mat === "lig" ? "lig" : "agr"]; mn = f[0]; mx = f[1]; auto = true;
      }
      return { min: mn, max: mx, proj: ok(mn) && ok(mx) ? (mn + mx) / 2 : NaN, faixa: true, auto: auto };
    }
    var pj = num(P["proj" + L]);
    return { min: pj - tol, max: pj + tol, proj: pj, tol: tol, faixa: false };
  }

  // ---------- estatística por segmento ----------
  function desvio(v) {
    if (v.length < 2) return NaN;
    var m = media(v);
    return Math.sqrt(v.reduce(function (a, x) { return a + (x - m) * (x - m); }, 0) / (v.length - 1));
  }
  function chave(s) { return String(s || "").trim().replace(/\s+/g, " ").toUpperCase(); }
  function estatistica(itens, lim, tabK) {
    var v = itens.map(function (o) { return o.x; });
    var n = v.length, m = media(v), s = desvio(v), K = coefK(n, tabK);
    var lo = m - K.k * s, hi = m + K.k * s, conf = null;
    if (ok(lo) && ok(hi) && ok(lim.min) && ok(lim.max)) conf = lo >= lim.min && hi <= lim.max;
    return { n: n, media: m, s: s, k: K.k, kExato: K.exato, nTab: K.nTab, lo: lo, hi: hi, conforme: conf,
      fora: v.filter(function (x) { return (ok(lim.min) && x < lim.min - 1e-9) || (ok(lim.max) && x > lim.max + 1e-9); }).length };
  }
  function agrupar(itens, lim, tabK) {
    var segs = [], porSeg = {};
    itens.forEach(function (o) {
      var ks = chave(o.seg) || "—";
      if (!porSeg[ks]) { porSeg[ks] = { nome: String(o.seg || "").trim() || "(sem segmento)", itens: [], lados: {}, ordemLados: [] }; segs.push(porSeg[ks]); }
      var G = porSeg[ks]; G.itens.push(o);
      var kl = chave(o.lado) || "—";
      if (!G.lados[kl]) { G.lados[kl] = { nome: String(o.lado || "").trim() || "—", v: [] }; G.ordemLados.push(kl); }
      G.lados[kl].v.push(o.x);
    });
    segs.forEach(function (G) {
      G.est = estatistica(G.itens, lim, tabK);
      G.lados = G.ordemLados.map(function (kl) { var L = G.lados[kl]; return { nome: L.nome, n: L.v.length, media: media(L.v) }; });
    });
    return segs;
  }

  // situação do conjunto: não conforme se algum segmento reprova; conforme se os segmentos avaliados aprovam
  function conjunto(segs) {
    var av = segs.filter(function (G) { return G.est.conforme !== null; });
    if (!av.length) return null;
    return av.every(function (G) { return G.est.conforme; });
  }

  // ---------- cálculo de uma bandeja ----------
  function bandeja(p, P, areaPad) {
    var A = ok(num(p.A)) ? num(p.A) : areaPad, P1 = num(p.P1), P2 = num(p.P2);
    var mg = P2 - P1;
    var q = ok(mg) && ok(A) && A > 0 && mg > 0 ? mg / 1000 / A : NaN;  // kg/m²
    return { A: A, mg: ok(mg) ? mg : NaN, q: q };
  }

  FE.FICHAS["dnit-144-2014-es"] = {
    titulo: "Taxa de aplicação de ligante (e de agregado) por bandeja",
    rotuloImportar: function (r) { return (r.cod || "") + (r.nomeServ ? " " + r.nomeServ : "") + " · ligante " + (ok(r.mediaL) ? fmt(r.mediaL, 2) + " l/m²" : "—") + " (" + (r.nL || 0) + ")" + (ok(r.mediaA) ? " · agregado " + fmt(r.mediaA, 1) + " kg/m² (" + r.nA + ")" : ""); },
    resumo: "Controle da execução pelas ES: bandejas de massa (P₁) e área (A) conhecidas na pista; taxa = (P₂ − P₁) / A; resíduo → taxa do ligante aplicado; kg/m² → l/m² pela massa específica; X̄ ± ks por segmento contra projeto ± tolerância.",
    blocos: [],
    params: [
      { k: "servico", r: "Serviço (especificação)", tipo: "select", recarrega: true,
        opcoes: Object.keys(SERV).map(function (s) { return [s, SERV[s].cod + " — " + SERV[s].nome]; }),
        dica: "define taxas recomendadas, tolerâncias, forma de cálculo e o k da amostragem" },
      { k: "ligante", r: "Ligante asfáltico", tipo: "select", recarrega: true,
        opcoes: function (d) { return SERV[servico(d)].ligantes.map(function (l) { return [l, LIG[l].nome]; }); } },
      { k: "camada", r: "Camada / aplicação", tipo: "select", recarrega: true,
        opcoes: function (d) {
          var o = [];
          for (var i = 1; i <= nCamadas(d); i++) o.push([String(i), servico(d) === "394" ? (i === 1 ? "1ª — agregado da faixa + 1ª aplicação de ligante" : "2ª — agregado II-A + 2ª aplicação de ligante") : i + "ª camada"]);
          return o;
        },
        se: function (d) { return nCamadas(d) > 1; } },
      { k: "faixa394", r: "Faixa granulométrica do macadame (quadro de 5.1.3)", tipo: "select", recarrega: true,
        opcoes: Object.keys(Q394).map(function (f) { return [f, f]; }), se: function (d) { return servico(d) === "394"; } },
      { k: "pesagem", r: "Pesagem da bandeja com ligante (P₂)", tipo: "select", recarrega: true,
        opcoes: [["cura", "Após cura / ruptura total, até massa constante — mede o resíduo TR (como a norma)"],
          ["imediata", "Logo após a passagem do distribuidor — mede o material como aplicado"]],
        se: function (d) { return ehEmulsao(d); } },
      { k: "residuo", r: "Resíduo do carregamento (%)", ph: "ex.: 62",
        dica: "ensaio de recebimento do carregamento (resíduo por evaporação/destilação)", se: function (d) { return ehEmulsao(d); } },
      { k: "diluicao", r: "Diluição — partes de água por parte de emulsão", ph: "1 (= 1:1)",
        dica: "a emulsão é diluída 1:1 antes da aplicação; a taxa T controlada é a da emulsão diluída", se: function (d) { return !!SERV[servico(d)].diluida; } },
      { k: "rho", r: "Massa específica do material aplicado (kg/l = g/cm³)", ph: "ex.: 1,00",
        dica: "converte massa em volume: T (l/m²) = T (kg/m²) / ρ" },
      { k: "rhoRes", r: "Massa específica do resíduo asfáltico (kg/l)", ph: "1,00",
        dica: "converte a taxa de resíduo TR em l/m²", se: function (d) { return ehEmulsao(d); } },
      { k: "criterio", r: "Critério de aceitação", tipo: "select", recarrega: true,
        opcoes: [["tol", "Taxa de projeto ± tolerância da norma"], ["faixa", "Faixa de projeto (mínimo e máximo)"]],
        se: function (d) { return servico(d) !== "394"; } },
      { k: "projL", r: "Taxa de projeto do ligante (l/m²)", ph: "ex.: 1,20",
        dica: "fixada no projeto e ajustada no campo", se: function (d) { return !criterioFaixa(d); } },
      { k: "minL", r: "Ligante — mínimo de projeto (l/m²)", se: function (d) { return criterioFaixa(d); } },
      { k: "maxL", r: "Ligante — máximo de projeto (l/m²)", se: function (d) { return criterioFaixa(d); } },
      { k: "projA", r: "Taxa de projeto do agregado (kg/m²)", ph: "ex.: 10",
        se: function (d) { return SERV[servico(d)].agr && !criterioFaixa(d); } },
      { k: "minA", r: "Agregado — mínimo de projeto (kg/m²)", se: function (d) { return SERV[servico(d)].agr && criterioFaixa(d); } },
      { k: "maxA", r: "Agregado — máximo de projeto (kg/m²)", se: function (d) { return SERV[servico(d)].agr && criterioFaixa(d); } },
      { k: "area", r: "Área padrão das bandejas (m²)", ph: "ex.: 0,25", dica: "usada quando a coluna não informa a área" },
      { k: "areaSeg", r: "Área do segmento controlado (m²) — opcional", dica: "verifica o número mínimo de determinações" },
    ],
    padrao: { servico: "144", ligante: "eai", camada: "1", faixa394: "I-C", pesagem: "cura", criterio: "tol", rhoRes: "1,00", diluicao: "1" },

    tabelas: function (d) {
      var S = SERV[servico(d)], emu = ehEmulsao(d), cura = emu && (d.params || {}).pesagem !== "imediata";
      var ident = [
        { k: "seg", r: "Segmento / trecho", texto: true },
        { k: "est", r: "Estaca", texto: true },
        { k: "lado", r: "Posição (LE / eixo / LD)", texto: true },
        { k: "A", r: "Área da bandeja (A)", u: "m²", padrao: "area" },
        { k: "P1", r: "Massa da bandeja — tara (P₁)", u: "g" },
      ];
      var lig = ident.concat([
        { k: "P2", r: cura ? "Bandeja + resíduo, após cura até massa constante (P₂)" : "Bandeja + ligante (P₂)", u: "g" },
        { calc: "mg", r: "Massa coletada (P₂ − P₁)", u: "g", casas: 1 },
      ]);
      if (!emu) lig.push({ calc: "q", r: "T = (P₂ − P₁) / A (" + S.secT + ")", u: "kg/m²", casas: 3 });
      else if (cura) lig.push({ calc: "q", r: "TR = (P₂ − P₁) / A — resíduo (" + S.secT + ")", u: "kg/m²", casas: 3 },
        { calc: "tm", r: "Taxa do material aplicado = TR / resíduo", u: "kg/m²", casas: 3 });
      else lig.push({ calc: "q", r: "Taxa do material aplicado = (P₂ − P₁) / A", u: "kg/m²", casas: 3 },
        { calc: "tr", r: "TR — resíduo = taxa × resíduo", u: "kg/m²", casas: 3 });
      if (S.residual && emu) {
        lig.push({ calc: "tv", r: "Taxa do material aplicado (÷ ρ)", u: "l/m²", casas: 2 },
          { calc: "x", r: "Taxa de ligante residual = TR / ρ resíduo (" + S.secT + ")", u: "l/m²", casas: 2, destaque: true });
      } else {
        lig.push({ calc: "x", r: (S.diluida ? "T da emulsão diluída" : "Taxa de aplicação T") + " = kg/m² ÷ ρ", u: "l/m²", casas: 2, destaque: true });
        if (emu) lig.push({ calc: "trv", r: "Taxa de resíduo = TR / ρ resíduo", u: "l/m²", casas: 2 });
      }
      lig.push({ calc: "dv", r: criterioFaixa(d) ? "Situação em relação à faixa (−1 abaixo, 0 dentro, +1 acima)" : "Desvio em relação ao projeto", u: criterioFaixa(d) ? "" : "l/m²", casas: criterioFaixa(d) ? 0 : 2 });
      var tabs = [{ chave: "lig", titulo: "Ligante asfáltico — bandejas", rotulo: "Bandeja", iniciais: 5, min: 1, linhas: lig,
        dica: "bandejas colocadas ao acaso na pista antes da passagem do carro distribuidor; massas em gramas" }];
      if (S.agr) {
        tabs.push({ chave: "agr", titulo: "Agregado — bandejas", rotulo: "Bandeja", iniciais: 5, min: 1,
          dica: "bandejas na pista antes da passagem do distribuidor de agregado (" + S.secTolA + ")",
          linhas: ident.concat([
            { k: "P2", r: "Bandeja + agregado (P₂)", u: "g" },
            { calc: "mg", r: "Massa de agregado (P₂ − P₁)", u: "g", casas: 1 },
            { calc: "x", r: "Taxa de espalhamento = (P₂ − P₁) / A", u: "kg/m²", casas: 2, destaque: true },
            { calc: "dv", r: criterioFaixa(d) ? "Situação em relação à faixa (−1 abaixo, 0 dentro, +1 acima)" : "Desvio em relação ao projeto", u: criterioFaixa(d) ? "" : "kg/m²", casas: criterioFaixa(d) ? 0 : 2 },
          ]) });
      }
      return tabs;
    },

    calcular: function (d) {
      var P = d.params || {}, s = servico(d), S = SERV[s], lg = ligDe(d), L = LIG[lg], emu = L.tipo === "emu";
      var cura = emu && P.pesagem !== "imediata", avisos = [];
      var areaPad = num(P.area), rho = num(P.rho), rhoRes = num(P.rhoRes), r = num(P.residuo);
      var agua = S.diluida ? (ok(num(P.diluicao)) ? num(P.diluicao) : 1) : 0;
      var fe = 1 / (1 + agua);                         // fração de emulsão no material aplicado
      var fr = ok(r) && r > 0 ? r / 100 * fe : NaN;    // fração de resíduo no material aplicado
      var limL = limites(d, "lig"), limA = S.agr ? limites(d, "agr") : null, rec = recomendada(d);

      function situacao(x, lim) {
        if (!ok(x)) return NaN;
        if (lim.faixa) return ok(lim.min) && x < lim.min - 1e-9 ? -1 : ok(lim.max) && x > lim.max + 1e-9 ? 1 : 0;
        return ok(lim.proj) ? x - lim.proj : NaN;
      }

      // ligante
      var itL = [];
      var tabL = (d.lig || []).map(function (p, i) {
        var b = bandeja(p, P, areaPad), o = { mg: b.mg, q: b.q };
        var tm, tr;
        if (!emu) { tm = b.q; tr = b.q; }
        else if (cura) { tr = b.q; tm = ok(fr) ? tr / fr : NaN; }
        else { tm = b.q; tr = ok(fr) ? b.q * fr : NaN; }
        o.tm = tm; o.tr = tr;
        o.tv = ok(rho) && rho > 0 ? tm / rho : NaN;
        o.trv = ok(rhoRes) && rhoRes > 0 ? tr / rhoRes : NaN;
        o.x = S.residual && emu ? o.trv : o.tv;
        o.dv = situacao(o.x, limL);
        if (ok(num(p.P1)) && ok(num(p.P2)) && num(p.P2) <= num(p.P1)) avisos.push("Ligante, bandeja " + (i + 1) + ": P₂ não é maior que P₁ — confira as pesagens.");
        if (ok(num(p.P2)) && !ok(b.A)) avisos.push("Ligante, bandeja " + (i + 1) + ": informe a área da bandeja (ou a área padrão).");
        if (ok(o.x)) itL.push({ x: o.x, seg: p.seg, lado: p.lado, i: i });
        return o;
      });
      // agregado
      var itA = [], tabA = [];
      if (S.agr) {
        tabA = (d.agr || []).map(function (p, i) {
          var b = bandeja(p, P, areaPad), o = { mg: b.mg, x: b.q };
          o.dv = situacao(o.x, limA);
          if (ok(num(p.P1)) && ok(num(p.P2)) && num(p.P2) <= num(p.P1)) avisos.push("Agregado, bandeja " + (i + 1) + ": P₂ não é maior que P₁ — confira as pesagens.");
          if (ok(o.x)) itA.push({ x: o.x, seg: p.seg, lado: p.lado, i: i });
          return o;
        });
      }

      // avisos de parâmetros
      var temLig = (d.lig || []).some(function (p) { return ok(num(p.P2)); });
      if (temLig && !(ok(rho) && rho > 0) && !(S.residual && emu)) avisos.push("Informe a massa específica do material aplicado para converter kg/m² em l/m².");
      if (ok(rho) && (rho < 0.85 || rho > 1.15)) avisos.push("Massa específica do ligante de " + fmt(rho, 2) + " kg/l fora do usual para ligantes asfálticos (≈ 0,9 a 1,05) — confira.");
      if (emu && temLig && !ok(fr)) {
        if (cura || (S.residual)) avisos.push("Informe o resíduo do carregamento (%): a norma obtém a taxa " + (S.residual ? "residual" : "T") + " pelo resíduo verificado no recebimento (" + S.secT + ").");
      }
      if (emu && ok(r) && (r < 30 || r > 80)) avisos.push("Resíduo de " + fmt(r, 1) + " % fora do usual para " + (lg === "cm30" ? "asfalto diluído" : "emulsões") + " — confira.");
      if (emu && !cura && temLig && !S.residual) avisos.push("Pesagem logo após a aplicação: a norma pesa a bandeja depois da " + (s === "144" ? "cura total" : "ruptura total") +
        " (até massa constante) e obtém T pelo resíduo do carregamento (" + S.secT + "). A taxa acima é a do material como aplicado (inclui água/solvente).");
      if (emu && !cura && S.residual && temLig) avisos.push("Pesagem logo após a aplicação: a norma considera o asfalto residual após peso constante (" + S.secT + "); o resíduo foi estimado pelo teor do carregamento.");
      if (L.foraNorma) avisos.push("Ligante não previsto na norma: a pintura de ligação da " + S.cod + " usa emulsão RR-1C (5.1 a).");
      if (s === "146" || s === "147" || s === "148") {
        if (lg === "rr2c") avisos.push("A tolerância de ± 0,2 l/m² está escrita para o cimento asfáltico (" + S.secTolL + "); para a RR-2C (7.2.2 b) a norma não repete o valor — aplicada por analogia.");
      }
      if (!criterioFaixa(d)) {
        if (!ok(limL.proj) && temLig) avisos.push("Informe a taxa de projeto do ligante para verificar a tolerância.");
        if (S.agr && !ok(limA.proj) && itA.length) avisos.push("Informe a taxa de projeto do agregado para verificar a tolerância.");
      } else {
        if (limL.auto) avisos.push("Limites do ligante tomados do quadro de 5.1.3 (faixa " + (P.faixa394 || "I-C") + ", " + camadaDe(d) + "ª aplicação); valores exatos devem ser fixados no projeto (5.1.4.4).");
        if (limA && limA.auto) avisos.push("Limites do agregado tomados do quadro de 5.1.3" + (camadaDe(d) === 2 ? " (faixa II-A: 6 kg/m², valor único — informe a faixa de projeto)" : "") + ".");
        if (s !== "394" && (!ok(limL.min) || !ok(limL.max)) && temLig) avisos.push("Informe o mínimo e o máximo de projeto do ligante.");
      }
      // projeto × faixa recomendada
      if (!criterioFaixa(d)) {
        var recL = rec.lig;
        if (recL && ok(limL.proj) && !(S.residual && emu) && !S.diluida && (limL.proj < recL[0] || limL.proj > recL[1]))
          avisos.push("Taxa de projeto do ligante (" + fmt(limL.proj, 2) + " l/m²) fora da faixa usual/recomendada de " + faixaTxt(recL, "l/m²") + " (" + S.secRec + ") — admissível se fixada no projeto.");
        if (S.diluida && recL && ok(limL.proj) && (limL.proj < recL[0] || limL.proj > recL[1]))
          avisos.push("Taxa de projeto da emulsão diluída (" + fmt(limL.proj, 2) + " l/m²) fora da ordem de " + faixaTxt(recL, "l/m²") + " (" + S.secRec + ").");
        if (S.agr && rec.agr && ok(limA.proj) && (limA.proj < rec.agr[0] || limA.proj > rec.agr[1]))
          avisos.push("Taxa de projeto do agregado (" + fmt(limA.proj, 1) + " kg/m²) fora da faixa recomendada de " + faixaTxt(rec.agr, "kg/m²") + " (" + S.secRec + ").");
      }

      // estatística por segmento
      var segL = agrupar(itL, limL, S.k), segA = S.agr ? agrupar(itA, limA, S.k) : [];
      function avisosSeg(segs, nome) {
        segs.forEach(function (G) {
          var e = G.est, rot = nome + (segs.length > 1 || G.nome !== "(sem segmento)" ? " — " + G.nome : "");
          if (e.n < 5) avisos.push(rot + ": " + e.n + " determinação(ões); o mínimo é 5 por segmento (" + S.secMin + ") — sem análise estatística X̄ ± ks.");
          else if (!e.kExato) avisos.push(rot + ": n = " + e.n + " não consta da tabela de amostragem variável (" + S.secK + "); usado k = " + fmt(e.k, 2) + " de n = " + e.nTab + (e.n > 21 ? "" : " (mais conservador)") + ".");
          if (e.conforme === false) avisos.push(rot + ": NÃO CONFORME — X̄ − ks = " + fmt(e.lo, 2) + " e X̄ + ks = " + fmt(e.hi, 2) + " fora do intervalo " + fmt(G.lim.min, 2) + " a " + fmt(G.lim.max, 2) + " (" + S.secK + ").");
          if (e.fora) avisos.push(rot + ": " + e.fora + " de " + e.n + " bandeja(s) fora do intervalo de projeto.");
        });
      }
      segL.forEach(function (G) { G.lim = limL; });
      segA.forEach(function (G) { G.lim = limA; });
      avisosSeg(segL, "Ligante");
      avisosSeg(segA, "Agregado");

      // resíduo × taxa residual recomendada (pinturas de ligação)
      var trMedia = media(tabL.map(function (o) { return o.trv; }));
      if (rec.res && ok(trMedia) && (trMedia < rec.res[0] - 1e-9 || trMedia > rec.res[1] + 1e-9))
        avisos.push("Taxa média de ligante residual de " + fmt(trMedia, 2) + " l/m², fora da recomendada de 0,3 a 0,4 l/m² (" + S.secRec + ").");

      // área do segmento × número de determinações
      var aSeg = num(P.areaSeg);
      if (ok(aSeg)) {
        if (S.regraArea === "4000") {
          if (aSeg > 4000 && aSeg < 20000) avisos.push("Segmento de " + fmt(aSeg, 0) + " m² (entre 4.000 e 20.000 m²): número de determinações pelo plano de amostragem variável aprovado pela Fiscalização (" + S.secMin + ").");
          if (aSeg >= 20000) avisos.push("Segmento de " + fmt(aSeg, 0) + " m²: a norma trata segmentos de até 20.000 m² — subdivida o controle (" + S.secMin + ").");
        } else if (aSeg >= 3000) avisos.push("Segmento de " + fmt(aSeg, 0) + " m²: o mínimo de 5 determinações vale para área inferior a 3.000 m² (" + S.secMin + ") — compatibilize com o plano de amostragem variável.");
      }

      return {
        tab: { lig: tabL, agr: tabA },
        resultados: {
          servico: s, cod: S.cod, nomeServ: S.nome, ligante: L.nome, emu: emu, cura: cura, residual: !!(S.residual && emu),
          limL: limL, limA: limA, rec: rec, segL: segL, segA: segA, trMedia: trMedia,
          mediaL: media(itL.map(function (o) { return o.x; })), mediaA: media(itA.map(function (o) { return o.x; })),
          nL: itL.length, nA: itA.length, itL: itL, itA: itA,
          conformeL: conjunto(segL), parcialL: segL.some(function (G) { return G.est.conforme === null; }),
          conformeA: conjunto(segA), parcialA: segA.some(function (G) { return G.est.conforme === null; }),
        },
        avisos: avisos,
      };
    },

    resultadosHtml: function (calc, d) {
      var r = calc.resultados;
      function sit(c, parc) { return c === null || c === undefined ? "" : c ? ' · <span class="fe-ok">conforme</span>' + (parc ? " (segmentos com n ≥ 5)" : "") : ' · <span class="fe-nok">não conforme</span>'; }
      function limTxt(lim, u, c) { return lim && ok(lim.min) && ok(lim.max) ? fmt(lim.min, c) + " a " + fmt(lim.max, c) + " " + u : "limites não informados"; }
      var uL = "l/m²", nomeL = r.residual ? "Taxa de ligante residual" : SERV[r.servico].diluida ? "Taxa T da emulsão diluída" : "Taxa de aplicação T do ligante";
      var h = '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + fmt(r.mediaL, 2) + " <small>" + uL + "</small></div>" +
        '<div class="fe-res-r">' + esc(nomeL) + " — média de " + r.nL + " bandeja(s) · aceitação " + esc(limTxt(r.limL, uL, 2)) + sit(r.conformeL, r.parcialL) + "</div></div>";
      if (r.limA) h += '<div class="fe-res-item"><div class="fe-res-v">' + fmt(r.mediaA, 2) + ' <small>kg/m²</small></div><div class="fe-res-r">Taxa de espalhamento do agregado — média de ' +
        r.nA + " bandeja(s) · aceitação " + esc(limTxt(r.limA, "kg/m²", 1)) + sit(r.conformeA, r.parcialA) + "</div></div>";
      if (r.emu && !r.residual && ok(r.trMedia)) h += '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + fmt(r.trMedia, 2) + ' <small>l/m²</small></div><div class="fe-res-r">Taxa de ligante residual (média)' +
        (r.rec.res ? " · recomendada 0,3 a 0,4 l/m²" : "") + "</div></div>";
      h += '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + esc(r.cod) + '</div><div class="fe-res-r">' + esc(r.nomeServ + " — " + r.ligante) +
        (r.rec.lig ? " · recomendado: ligante " + faixaTxt(r.rec.lig, "l/m²") : "") + (r.rec.agr && r.limA ? ", agregado " + faixaTxt(r.rec.agr, "kg/m²") : "") + "</div></div></div>";
      h += tabelaSeg(r, false);
      return h;
    },

    graficos: function (calc, d, opt) {
      var r = calc.resultados, g = [grafico(r.itL, r.limL, r.segL, r.residual ? "Ligante residual (l/m²)" : "T do ligante (l/m²)", 2, opt)];
      if (r.limA) g.push(grafico(r.itA, r.limA, r.segA, "Agregado (kg/m²)", 1, opt));
      return g;
    },

    relatorio: {
      notas: "Taxa por bandeja = (P₂ − P₁) / A. Emulsões e asfalto diluído: com a bandeja pesada após cura/ruptura até massa constante, (P₂ − P₁) / A é a taxa de resíduo TR e a taxa do material aplicado é TR / resíduo do carregamento (na pintura de ligação, resíduo × fração de emulsão da mistura diluída). Conversão para l/m² dividindo pela massa específica (kg/l). Nas ES com asfalto polímero (DNER-ES 391 a 394/99) controla-se o ligante residual. Aceitação por segmento: X̄ − ks ≥ mínimo e X̄ + ks ≤ máximo, s com n − 1, k da tabela de amostragem variável (DNER-PRO 277/97); mínimo de 5 determinações por segmento.",
      resultados: function (calc, d) {
        var r = calc.resultados, rows = [];
        rows.push(["Serviço", r.cod + " — " + r.nomeServ + " — " + r.ligante]);
        rows.push([r.residual ? "Ligante residual — média" : "Taxa do ligante — média", fmt(r.mediaL, 2) + " l/m² (" + r.nL + " bandejas) — aceitação " +
          (ok(r.limL.min) && ok(r.limL.max) ? fmt(r.limL.min, 2) + " a " + fmt(r.limL.max, 2) + " l/m²" : "—") +
          (r.conformeL === null ? "" : r.conformeL ? " — CONFORME" + (r.parcialL ? " (segmentos com n ≥ 5)" : "") : " — NÃO CONFORME")]);
        if (r.emu && !r.residual && ok(r.trMedia)) rows.push(["Taxa de ligante residual — média", fmt(r.trMedia, 2) + " l/m²"]);
        if (r.limA) rows.push(["Taxa do agregado — média", fmt(r.mediaA, 2) + " kg/m² (" + r.nA + " bandejas) — aceitação " +
          (ok(r.limA.min) && ok(r.limA.max) ? fmt(r.limA.min, 1) + " a " + fmt(r.limA.max, 1) + " kg/m²" : "—") +
          (r.conformeA === null ? "" : r.conformeA ? " — CONFORME" + (r.parcialA ? " (segmentos com n ≥ 5)" : "") : " — NÃO CONFORME")]);
        return rows;
      },
      extraHtml: function (calc) { return tabelaSeg(calc.resultados, true); },
    },
    exemplos: [],
  };

  // ---------- tabela-resumo por segmento e posição ----------
  function tabelaSeg(r, relat) {
    var blocos = [["Ligante", r.segL, r.limL, "l/m²", 2]];
    if (r.limA) blocos.push(["Agregado", r.segA, r.limA, "kg/m²", 2]);
    var h = "";
    blocos.forEach(function (b) {
      if (!b[1].length) return;
      var c = b[4];
      h += '<table class="' + (relat ? "gr" : "fe-resumo") + '"><thead><tr><th>' + b[0] + " (" + b[3] + ")</th><th>Segmento</th><th>Posição</th><th>n</th><th>Média</th><th>s</th><th>k</th><th>X̄ − ks</th><th>X̄ + ks</th><th>Situação</th></tr></thead><tbody>";
      b[1].forEach(function (G) {
        var e = G.est;
        G.lados.forEach(function (L) {
          h += "<tr><td></td><td>" + esc(G.nome) + "</td><td>" + esc(L.nome) + "</td><td>" + L.n + "</td><td>" + fmt(L.media, c) + "</td><td></td><td></td><td></td><td></td><td></td></tr>";
        });
        var st = e.n < 5 ? "n < 5" : e.conforme === null ? "—" : e.conforme ? (relat ? "CONFORME" : '<span class="fe-ok">conforme</span>') : (relat ? "NÃO CONFORME" : '<span class="fe-nok">não conforme</span>');
        h += "<tr><td></td><td><b>" + esc(G.nome) + "</b></td><td><b>segmento</b></td><td><b>" + e.n + "</b></td><td><b>" + fmt(e.media, c) + "</b></td><td>" + fmt(e.s, 3) +
          "</td><td>" + (ok(e.k) ? fmt(e.k, 2) : "—") + "</td><td>" + (e.n >= 5 ? fmt(e.lo, c) : "—") + "</td><td>" + (e.n >= 5 ? fmt(e.hi, c) : "—") + "</td><td>" + st + "</td></tr>";
      });
      h += "</tbody></table>";
    });
    return h;
  }

  // ---------- gráfico: taxa de cada bandeja × limites ----------
  function grafico(itens, lim, segs, rotulo, casas, opt) {
    opt = opt || {};
    if (!itens.length) return '<div class="fe-graf-vazio">O gráfico aparece quando houver bandejas completas.</div>';
    var W = opt.w || 560, H = opt.h || 260, m = { l: 52, r: 14, t: 14, b: 36 };
    var cor = opt.imprimir ? { eixo: "#333", grade: "#ddd", txt: "#222", pt: "#1f5fbf", lim: "#c0392b", proj: "#2e7d32", med: "#888" }
      : { eixo: "var(--text-dim)", grade: "var(--border)", txt: "var(--text-dim)", pt: "#4f8cff", lim: "#e5534b", proj: "#34c38f", med: "#9aa3b2" };
    var vals = itens.map(function (o) { return o.x; }).concat([lim.min, lim.max].filter(ok));
    segs.forEach(function (G) { if (G.est.n >= 5) vals.push(G.est.lo, G.est.hi); });
    vals = vals.filter(ok);
    var y0 = Math.min.apply(null, vals), y1 = Math.max.apply(null, vals), pad = Math.max((y1 - y0) * 0.12, y1 * 0.03, 0.02);
    y0 = Math.max(0, y0 - pad); y1 = y1 + pad;
    var n = itens.length;
    function X(i) { return m.l + (i + 0.5) / n * (W - m.l - m.r); }
    function Y(v) { return H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b); }
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
    var passo = Math.pow(10, Math.floor(Math.log10((y1 - y0) / 4)));
    if ((y1 - y0) / passo > 10) passo *= 2;
    for (var gy = Math.ceil(y0 / passo) * passo; gy <= y1 + 1e-9; gy += passo) {
      s += '<line x1="' + m.l + '" y1="' + Y(gy) + '" x2="' + (W - m.r) + '" y2="' + Y(gy) + '" stroke="' + cor.grade + '" stroke-width="0.6"/>' +
        '<text x="' + (m.l - 6) + '" y="' + (Y(gy) + 4) + '" text-anchor="end" fill="' + cor.txt + '">' + fmt(gy, passo < 0.1 ? 2 : passo < 1 ? 1 : 0) + "</text>";
    }
    s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + cor.eixo + '"/>';
    s += '<text transform="translate(13 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + cor.txt + '">' + esc(rotulo) + "</text>";
    s += '<text x="' + ((W + m.l - m.r) / 2) + '" y="' + (H - 6) + '" text-anchor="middle" fill="' + cor.txt + '">Bandeja</text>';
    [["min", "mín."], ["max", "máx."]].forEach(function (a) {
      if (ok(lim[a[0]])) s += '<line x1="' + m.l + '" y1="' + Y(lim[a[0]]) + '" x2="' + (W - m.r) + '" y2="' + Y(lim[a[0]]) + '" stroke="' + cor.lim + '" stroke-dasharray="6 4"/>' +
        '<text x="' + (W - m.r - 4) + '" y="' + (Y(lim[a[0]]) - 4) + '" text-anchor="end" fill="' + cor.lim + '">' + a[1] + " " + fmt(lim[a[0]], casas) + "</text>";
    });
    if (ok(lim.proj) && !lim.faixa) s += '<line x1="' + m.l + '" y1="' + Y(lim.proj) + '" x2="' + (W - m.r) + '" y2="' + Y(lim.proj) + '" stroke="' + cor.proj + '"/>' +
      '<text x="' + (m.l + 4) + '" y="' + (Y(lim.proj) - 4) + '" fill="' + cor.proj + '">projeto ' + fmt(lim.proj, casas) + "</text>";
    // faixa X̄ ± ks de cada segmento, sobre as suas bandejas
    var pos = 0;
    segs.forEach(function (G) {
      var idx = G.itens.map(function (o) { return itens.indexOf(o); });
      var xa = X(Math.min.apply(null, idx)) - 8, xb = X(Math.max.apply(null, idx)) + 8;
      if (G.est.n >= 5) s += '<rect x="' + xa + '" y="' + Y(G.est.hi) + '" width="' + (xb - xa) + '" height="' + Math.max(1, Y(G.est.lo) - Y(G.est.hi)) +
        '" fill="' + cor.med + '" fill-opacity="0.18" stroke="' + cor.med + '" stroke-dasharray="2 2"/>';
      if (ok(G.est.media)) s += '<line x1="' + xa + '" y1="' + Y(G.est.media) + '" x2="' + xb + '" y2="' + Y(G.est.media) + '" stroke="' + cor.med + '" stroke-width="1.5"/>';
      if (segs.length > 1) s += '<text x="' + ((xa + xb) / 2) + '" y="' + (m.t + 11) + '" text-anchor="middle" fill="' + cor.txt + '" font-size="10">' + esc(G.nome) + "</text>";
      pos++;
    });
    itens.forEach(function (o, i) {
      var fora = (ok(lim.min) && o.x < lim.min - 1e-9) || (ok(lim.max) && o.x > lim.max + 1e-9);
      s += '<circle cx="' + X(i) + '" cy="' + Y(o.x) + '" r="4.5" fill="' + (fora ? cor.lim : cor.pt) + '"/>';
      if (n <= 24) s += '<text x="' + X(i) + '" y="' + (H - m.b + 14) + '" text-anchor="middle" fill="' + cor.txt + '" font-size="10">' + (o.i + 1) + "</text>";
    });
    return s + "</svg>";
  }

  // =====================================================================================
  // Exemplos
  // =====================================================================================
  function col(seg, est, lado, A, P1, P2) { return { seg: seg, est: est, lado: lado, A: A, P1: P1, P2: P2 }; }
  // gera a coluna de uma bandeja a partir da taxa-alvo (kg/m² na bandeja): P₂ = P₁ + q × A × 1000
  function alvo(seg, est, lado, A, P1, q) { return col(seg, est, lado, A, P1, fmt(num(P1) + q * num(A) * 1000, 1).replace(/\./g, "")); }

  FE.FICHAS["dnit-144-2014-es"].exemplos = [
    { nome: "Imprimação com EAI — 12 bandejas (planilha do laboratório, 25/01/2026)", dados: function () {
      // planilha "TAXA DE IMPRIMAÇÃO.xlsx", aba "IMPRIMAÇÃO 25-JAN-26" (massas em g; a planilha as rotula "Kg")
      var a = "RUA C LE", b = "RUA B", e = "0+10 e 5+10";
      return { ident: { registro: "EX-TX-001", data: "2026-01-25", obra: "Obra A", trecho: "Rua C (LE) / Rua B", camada: "Imprimação — EAI" },
        params: { servico: "144", ligante: "eai", pesagem: "imediata", residuo: "", rho: "0,96", rhoRes: "1,00", criterio: "tol", projL: "1,10", area: "0,34" },
        lig: [col(a, e, "LE", "0,35", "2670", "3044"), col(a, e, "LE", "0,35", "2690", "3050"), col(a, e, "LE", "0,35", "2670", "3025"),
          col(a, e, "Eixo", "0,34", "2810", "3178"), col(a, e, "Eixo", "0,34", "2980", "3320"), col(a, e, "Eixo", "0,34", "2930", "3270"),
          col(a, e, "LD", "0,34", "3010", "3390"), col(a, e, "LD", "0,34", "3029", "3388"), col(a, e, "LD", "0,34", "3010", "3388"),
          col(b, e, "LE", "0,34", "3001", "3350"), col(b, e, "Eixo", "0,34", "3080", "3455"), col(b, e, "LD", "0,34", "3190", "3544")],
        obs: "Planilha: \"taxa prevista 0,9 a 1,8 l/m²\"; adotada taxa de projeto de 1,10 l/m² (± 0,2). Bandejas pesadas logo após a passagem do distribuidor (sem cura). A planilha converte kg/m² em l/m² multiplicando pela densidade 0,96; aqui divide-se (l/m² = kg/m² ÷ kg/l)." };
    } },
    { nome: "Pintura de ligação com RR-2C diluída — Rua B (planilha do laboratório, 28/01/2026)", dados: function () {
      // aba " RUA B (RR2-C DILUIDO) PL": a mesma bandeja é reutilizada — a tara de cada pesagem é a pesagem anterior
      var a = "RUA B", e = "0+10 a 4";
      return { ident: { registro: "EX-TX-002", data: "2026-01-28", obra: "Obra A", trecho: "Rua B", camada: "Pintura de ligação — RR-2C diluída" },
        params: { servico: "145", ligante: "outra145", pesagem: "imediata", residuo: "", diluicao: "1", rho: "1,02", rhoRes: "1,00", criterio: "tol", projL: "0,80", area: "0,20" },
        lig: [col(a, e, "LE", "0,2", "2385", "2540"), col(a, e, "LE", "0,2", "2540", "2705"), col(a, e, "Eixo", "0,2", "2705", "2835"),
          col(a, e, "Eixo", "0,2", "2835", "2940"), col(a, e, "LD", "0,2", "2395", "2485"), col(a, e, "LD", "0,2", "2485", "2605")],
        obs: "Planilha: \"taxa prevista 0,5 a 1,0 l/m²\"; adotada taxa de projeto da emulsão diluída de 0,80 l/m² (5.1 b: da ordem de 0,8 a 1,0 l/m²). Resíduo do carregamento não registrado na planilha: taxa residual não calculada." };
    } },
    { nome: "TSS com RR-2C e brita 0 — Rua C, 8 + 8 bandejas (planilhas do laboratório)", dados: function () {
      // abas "TSS RUA C (RR2-C DILUIDO)" e "TSS RUA C (BRITA 0)"
      var a = "RUA C", e = "0+10 a 5+10";
      return { ident: { registro: "EX-TX-003", obra: "Obra A", trecho: "Rua C", camada: "TSS — RR-2C e brita 0" },
        params: { servico: "146", ligante: "rr2c", pesagem: "imediata", residuo: "", rho: "1,02", rhoRes: "1,00", criterio: "tol", projL: "1,00", projA: "10", area: "0,20" },
        lig: [col(a, e, "LE", "0,2", "2385", "2930"), col(a, e, "LE", "0,2", "2930", "3310"), col(a, e, "LE", "0,2", "3310", "3565"),
          col(a, e, "Eixo", "0,2", "3565", "3715"), col(a, e, "Eixo", "0,2", "2395", "2765"), col(a, e, "LD", "0,2", "2765", "2935"),
          col(a, e, "LD", "0,2", "2935", "3210"), col(a, e, "LD", "0,2", "3210", "3595")],
        agr: [col(a, e, "LE", "0,24", "1505", "3860"), col(a, e, "LE", "0,24", "1505", "4265"), col(a, e, "LE", "0,24", "1505", "4985"),
          col(a, e, "Eixo", "0,24", "1505", "4390"), col(a, e, "Eixo", "0,24", "1505", "4720"), col(a, e, "LD", "0,24", "1505", "4350"),
          col(a, e, "LD", "0,24", "1505", "4915"), col(a, e, "LD", "0,24", "1505", "4510")],
        obs: "Planilhas: ligante \"RR-2C diluído\", taxa prevista 0,5 a 1,0 l/m²; brita 0, taxa prevista 8 a 12 kg/m². Adotados projeto de 1,00 l/m² (± 0,2) e 10 kg/m² (± 1,5), centro da Tabela 2. A planilha do agregado multiplica kg/m² pela \"densidade\" 1,37 para obter l/m² — sem sentido para o agregado, cuja taxa a norma controla em kg/m²." };
    } },
    { nome: "TSD — 2ª camada com RR-2C pesada após ruptura (resíduo 67 %) e agregado — conforme", dados: function () {
      var a = "Est. 120 a 135", A = "0,25";
      var tl = [0.98, 1.05, 0.93, 1.02, 1.08, 0.96], ta = [10.6, 11.4, 10.9, 11.8, 11.2, 10.4];
      var lados = ["LE", "Eixo", "LD", "LE", "Eixo", "LD"], ests = ["121", "123", "125", "128", "131", "134"];
      var taras = ["1852,4", "1848,9", "1861,2", "1855,0", "1849,7", "1858,3"];
      return { ident: { registro: "EX-TX-004", obra: "Exemplo", trecho: "Est. 120 a 135", camada: "TSD — 2ª camada" },
        params: { servico: "147", ligante: "rr2c", camada: "2", pesagem: "cura", residuo: "67", rho: "1,00", rhoRes: "1,01", criterio: "tol", projL: "1,00", projA: "11", area: A, areaSeg: "2800" },
        // resíduo na bandeja = T (l/m²) × ρ (kg/l) × resíduo × A
        lig: tl.map(function (t, i) { return alvo(a, ests[i], lados[i], A, taras[i], t * 1.00 * 0.67); }),
        agr: ta.map(function (t, i) { return alvo(a, ests[i], lados[i], A, taras[i], t); }) };
    } },
  ];
})();
