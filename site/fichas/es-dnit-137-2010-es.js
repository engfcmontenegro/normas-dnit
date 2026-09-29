/*
 * Ficha de ACEITAÇÃO DE LOTE: DNIT 137/2010-ES — Regularização do subleito.
 *
 * Este arquivo também define FE.aceitacaoG1: motor comum das fichas de aceitação das camadas de solo / granulares
 * do grupo (DNIT 137, 138, 139, 098, 151, 152, 406, 407, 114, 115). Cada ES descreve seus blocos de ensaios
 * (umidade, compactação/ISC, grau de compactação, caracterização, insumo, granulometrias, verificações, deflexão,
 * geometria) e escreve os próprios critérios/frequências em cfg.criterios(ctx, H), usando os helpers H:
 *   H.pts(tabela, campo|fn, {rot, np})  pontos {v, est, x, rot} da tabela
 *   H.av({...})                         A.avaliar com as refs e a tabela de k da ES (acrescenta a linha)
 *   H.info(linha, texto)                marca uma linha como "informativo"
 *   H.freq({ensaio, metodo, por, a_cada, a_cadaH, jornada, minimo, min5area, min5vol, exigido, regra, realizado, aplica})
 *   H.conta(tabela, [campos])           nº de colunas com algum dos campos preenchido
 *   H.gran(chave)                       avalia uma tabela de granulometria (faixa ∩ projeto ± tolerância)
 *   H.geo()                             controle geométrico conforme cfg.blocos.geo
 *   H.verif()                           verificações S/N (cfg.blocos.verif)
 * A.avaliar (es-comum.js) faz a estatística: n ≥ 5 → X̄ − k·s ≥ mín. / X̄ + k·s ≤ máx.; n < 5 → valores individuais.
 *
 * DNIT 137/2010-ES (PDF, 7 p.):
 *   5.1 (p. 3)  material de substituição/adição: expansão ≤ 2 % e "a melhor capacidade de suporte" (DNIT 108, 5.1 d);
 *               na caracterização: sem partículas > 76 mm (3") e IG ≤ IG do subleito do projeto.
 *   7.1 (p. 3–4) caracterização e compactação: 1 amostra a cada 200 m ou por jornada (400 m, materiais homogêneos);
 *               ISC e expansão a cada 400 m (800 m); área ≤ 4.000 m² → pelo menos 5 amostras.
 *   7.2 (p. 4)  umidade a cada 100 m, h ót ± 2 %; GC ≥ 100 % (≤ 1.250 m³ → mín. 5 determinações; demais: plano 7.4).
 *   7.3 (p. 4)  largura ± 10 cm; flecha até +20 % (sem falta); cotas ± 3 cm do greide.
 *   7.5 (p. 4–5) X̄ − k·s ≥ mín.; X̄ + k·s ≤ máx. — k "tabelado" sem tabela na ES: usa-se a Tabela 1 da DNER-PRO 277/97 (7.4).
 *   8   medição em m² com a largura média do controle geométrico, limitada ao projeto.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var COD = A.codigoCurto, EPS = 1e-9;

  // =====================================================================================================
  // MOTOR COMUM (FE.aceitacaoG1)
  // =====================================================================================================
  // DNER-PRO 277/97, Tabela 1 — amostragem variável (sem n = 11: n = 11 usa o k de n = 10)
  var K_PRO277 = [[5, 1.55, 0.45], [6, 1.41, 0.35], [7, 1.36, 0.30], [8, 1.31, 0.25], [9, 1.25, 0.19], [10, 1.21, 0.15],
    [12, 1.16, 0.10], [13, 1.13, 0.08], [14, 1.11, 0.06], [15, 1.10, 0.05], [16, 1.08, 0.04], [17, 1.06, 0.03], [19, 1.04, 0.02], [21, 1.01, 0.01]];

  function nstr(x, c) { return ok(x) ? A.nstr(x, c) : ""; }
  function inteiro(x) { return ok(x) ? String(Math.round(x)) : ""; }
  function perto(a, b) { return Math.abs(a - b) / b < 0.04; }
  function kPen(mm) { return "p" + String(mm).replace(".", "_"); }
  function passante(media_, mm) {
    var m = (media_ || []).filter(function (x) { return perto(x.mm, mm) && ok(x.pass); })[0];
    if (m) return m.pass;
    // peneira maior que a maior da amostra, com 100 % passando na maior: 100 %
    var v = (media_ || []).filter(function (x) { return ok(x.pass); });
    if (v.length) {
      var top = v.reduce(function (a, b) { return a.mm > b.mm ? a : b; });
      if (top.mm < mm && top.pass >= 99.95) return 100;
    }
    return NaN;
  }

  // catálogo de campos (linhas das tabelas)
  var CAMPO = {
    w: { r: "Teor de umidade (w)", u: "%" },
    hot: { r: "Umidade ótima de referência", u: "%" },
    gs: { r: "γs,máx (DNIT 164)", u: "g/cm³" },
    isc: { r: "ISC (DNIT 172)", u: "%" },
    exp: { r: "Expansão no ISC (DNIT 172)", u: "%" },
    expb: { r: "Expansibilidade (DNIT 160, antiga DNER-ME 029)", u: "%" },
    pexp: { r: "Potencial de expansão — média de 3 CPs (DNIT 113)", u: "%" },
    mr: { r: "Módulo de resiliência na h ót (DNIT 134)", u: "MPa" },
    p76: { r: "Passante na peneira de 76 mm (3\")", u: "%" },
    p200: { r: "Passante na nº 200 (0,075 mm)", u: "%" },
    ll: { r: "Limite de liquidez (DNER-ME 122)", u: "%", texto: true },
    ip: { r: "Índice de plasticidade (DNER-ME 082)", u: "%", texto: true },
    ig: { r: "Índice de grupo digitado (opcional)", u: "" },
    ea: { r: "Equivalente de areia (DNIT 450)", u: "%" },
    sr: { r: "Relação S/R = Kr (DNER-ME 030)", u: "" },
    la: { r: "Desgaste Los Angeles (DNIT 451)", u: "%" },
    fi: { r: "Índice de forma f (DNIT 424)", u: "" },
    lam: { r: "Partículas lamelares (DNIT 424)", u: "%" },
    durNa: { r: "Durabilidade — perda com sulfato de sódio (DNER-ME 089)", u: "%" },
    durMg: { r: "Durabilidade — perda com sulfato de magnésio (DNER-ME 089)", u: "%" },
    faces: { r: "Partículas com duas faces britadas", u: "%" },
    dmax: { r: "Diâmetro máximo do agregado", u: "mm" },
    espB: { r: "Espessura da camada de bloqueio", u: "cm" },
    mct: { r: "Grupo MCT (DNER-CLA 259: LA, LA', LG'...)", u: "", texto: true },
  };
  // campos que cada ficha ME de origem fornece (resultados recalculados → texto da célula)
  var FONTES = {
    "dnit-456-2025-me": function (r) { return { w: nstr(r.w, 1) }; },
    "dnit-164-2013-me": function (r) { return { gs: nstr(r.gsMax, 3), hot: nstr(r.hOt, 1) }; },
    "dnit-172-2016-me": function (r) { return { gs: nstr(r.gsMax, 3), hot: nstr(r.hOt, 1), isc: inteiro(r.isc), exp: nstr(r.exp, 2) }; },
    "dnit-160-2012-me": function (r) { return { expb: inteiro(r.exp) }; },
    "dnit-113-2009-me": function (r) { return { pexp: nstr(r.media, 2) }; },
    "dner-me-082-94": function (r) { return { ll: r.llNP ? "NP" : inteiro(r.LL), ip: r.ipNP ? "NP" : inteiro(r.IP) }; },
    "dner-me-122-94": function (r) { return { ll: r.np ? "NP" : inteiro(r.LL) }; },
    "dnit-450-2024-me": function (r) { return { ea: inteiro(r.ea) }; },
    "dnit-451-2024-me": function (r) { return { la: inteiro(r.A) }; },
    "dner-me-030-94": function (r) { return { sr: nstr(r.kr, 2) }; },
    "dnit-424-2020-me": function (r) { return { fi: nstr(r.f, 2), lam: nstr(r.lam, 1) }; },
    "dnit-412-2025-me": function (r) { return { p76: nstr(passante(r.media, 76.2), 1), p200: nstr(passante(r.media, 0.075), 1) }; },
  };
  var CAMPO_FONTE = {};
  Object.keys(FONTES).forEach(function (fid) {
    Object.keys(FONTES[fid]({ media: [] })).forEach(function (k) { (CAMPO_FONTE[k] = CAMPO_FONTE[k] || []).push(fid); });
  });
  function fontesDe(campos) {
    var out = [];
    campos.forEach(function (k) { (CAMPO_FONTE[k] || []).forEach(function (f) { if (out.indexOf(f) < 0) out.push(f); }); });
    return out;
  }

  // Índice de grupo (classificação TRB — Manual de Pavimentação): IG = 0,2a + 0,005ac + 0,01bd
  function indiceGrupo(p200, ll, ip) {
    if (!ok(p200) || !ok(ll) || !ok(ip)) return NaN;
    function lim(x, m) { return Math.max(0, Math.min(m, x)); }
    var a = lim(p200 - 35, 40), b = lim(p200 - 15, 40), c = lim(ll - 40, 20), dd = lim(ip - 10, 20);
    return Math.round(0.2 * a + 0.005 * a * c + 0.01 * b * dd);
  }
  function igDe(c) {
    var t = num(c.ig);
    if (ok(t)) return t;
    var ll = A.numOuNP(c.ll), ip = A.numOuNP(c.ip);
    return indiceGrupo(num(c.p200), ll.np ? 0 : ll.v, ip.np ? 0 : ip.v);
  }
  function normMct(t) { return String(t || "").trim().toUpperCase().replace(/[´’`′]/g, "'"); }

  var L_EST = { k: "est", r: "Estaca / local", texto: true };
  var L_REG = { k: "reg", r: "Registro / origem", texto: true };

  function criar(cfg) {
    var B = cfg.blocos || {}, GR = B.gran || [], ID = cfg.id;
    function P_(d) { return d.params || {}; }
    function seB(b) { return function (d) { return !b.se || b.se(P_(d)); }; }

    // ---------------- parâmetros ----------------
    var params = [
      { k: "estIni", r: "Estaca inicial do lote", ph: "ex.: 20 ou 20 + 10,00", dica: "estaca de 20 m" },
      { k: "estFim", r: "Estaca final do lote", ph: "ex.: 40" },
      { k: "ext", r: "Extensão do lote (m) — opcional", dica: "vazio = diferença entre as estacas" },
      { k: "largura", r: cfg.rotLargura || "Largura de projeto da plataforma (m)", dica: "controle geométrico e área do lote" },
    ];
    if (cfg.espessura !== false) params.push({ k: "espessura", r: "Espessura de projeto da camada (cm)", dica: cfg.dicaEsp || "tolerância ± 10 %" });
    if (cfg.volume) params.push({ k: "volume", r: "Volume de material do lote (m³) — opcional", dica: "vazio = área × espessura de projeto; as frequências são por volume" });
    params.push({ k: "jornadas", r: "Jornadas diárias de trabalho no lote", ph: "1", dica: "as amostras são também exigidas por jornada" });
    if (cfg.homog) params.push({ k: "homog", r: "Frequência reduzida — materiais homogêneos (a critério da Fiscalização)", tipo: "select",
      opcoes: [["nao", "Não — frequência normal"], ["sim", "Sim — frequência reduzida autorizada"]] });
    if (B.umid) params.push({ k: "hOt", r: "Umidade ótima de referência (%) — opcional", dica: "vazio = média das umidades ótimas da tabela de compactação" });
    params = params.concat(cfg.params || []);
    params.push({ k: "espGeo", r: "Espaçamento das seções do controle geométrico (m)", ph: "20", dica: "a ES não fixa; padrão: uma seção por estaca" });

    // importações
    function impAmostras(chave, titulo, campos, se) {
      var fontes = fontesDe(campos).filter(function (f) { return f !== "dnit-412-2025-me" || campos.indexOf("p200") >= 0 || campos.indexOf("p76") >= 0; });
      if (!fontes.length) return;
      params.push({ k: "imp_" + chave, r: titulo + " — importar (" + fontes.map(COD).join(" / ") + ")", tipo: "importarVarios",
        de: fontes.length === 1 ? fontes[0] : fontes, se: se,
        dica: "ensaios com o mesmo registro vão para a mesma coluna; as colunas digitadas são mantidas",
        aplicar: function (lista, P, d) {
          A.importacao.substituir(d, chave, A.importacao.juntarPorRegistro(lista.map(function (e) {
            var i = A.importacao.ident(e), v = FONTES[e.ficha] ? FONTES[e.ficha](e.resultados || {}) : {}, c = { est: i.local || "", reg: A.importacao.rotulo(e) };
            Object.keys(v).forEach(function (k) { if (campos.indexOf(k) >= 0) c[k] = v[k]; });
            return { chave: i.registro || "", cod: COD(e.ficha), col: c };
          })));
        } });
    }
    if (B.umid) params.push({ k: "imp_umid", r: "Umidade antes da compactação — importar (DNIT 456)", tipo: "importarVarios", de: "dnit-456-2025-me",
      dica: "estaca = campo \"Estaca / local\" da ficha de origem",
      aplicar: function (lista, P, d) {
        A.importacao.substituir(d, "umid", lista.map(function (e) {
          return { est: A.importacao.ident(e).local || "", reg: A.importacao.rotulo(e), w: nstr((e.resultados || {}).w, 1) };
        }));
      } });
    if (B.comp) impAmostras("comp", B.comp.titulo || "Compactação e ISC", ["gs", "hot"].concat(B.comp.campos || []));
    if (B.gc) params.push({ k: "imp_gc", r: "Grau de compactação — importar furos/pontos (DNIT 458, DNER-ME 036, DNIT 417)", tipo: "importarVarios",
      de: ["dnit-458-2025-me", "dner-me-036-94", "dnit-417-2019-me"], dica: "cada furo/ponto vira uma coluna, com a estaca e a posição da ficha de origem",
      aplicar: function (lista, P, d) {
        var cols = [];
        lista.forEach(function (e) {
          var r = e.resultados || {}, i = A.importacao.ident(e), pts = r.furos || r.pts || [], nome = e.ficha === "dnit-417-2019-me" ? "ponto " : "furo ";
          pts.forEach(function (f, j) {
            if (!ok(f.GC)) return;
            var w = ok(f.uW) ? f.uW : f.w;
            cols.push({ est: f.estaca || i.local || "", pos: f.posicao || "", reg: A.importacao.rotulo(e, nome + (j + 1)), gc: nstr(f.GC, 1), w: nstr(w, 1) });
          });
        });
        A.importacao.substituir(d, "gc", cols);
      } });
    if (B.carac) impAmostras("carac", B.carac.titulo || "Caracterização", B.carac.campos, B.carac.se ? seB(B.carac) : undefined);
    if (B.ins) impAmostras("ins", B.ins.titulo || "Insumo", B.ins.campos, B.ins.se ? seB(B.ins) : undefined);
    GR.forEach(function (g) {
      params.push({ k: "imp_" + g.chave, r: g.titulo + " — importar (DNIT 412)", tipo: "importarVarios", de: "dnit-412-2025-me", se: g.se ? seB(g) : undefined,
        aplicar: function (lista, P, d) {
          A.importacao.substituir(d, g.chave, lista.map(function (e) {
            var r = e.resultados || {}, c = { est: A.importacao.ident(e).local || "", reg: A.importacao.rotulo(e) };
            g.pen.forEach(function (p) { c[kPen(p[0])] = nstr(passante(r.media, p[0]), 1); });
            return c;
          }));
        } });
    });

    // ---------------- tabelas ----------------
    function linhasCampos(campos) { return campos.map(function (k) { var c = CAMPO[k]; return { k: k, r: c.r, u: c.u, texto: c.texto }; }); }
    function rotPen(p) { return p[1] + " (" + fmt(p[0], p[0] < 1 ? 3 : 1).replace(/,?0+$/, "") + " mm)"; }
    function tabelas(d) {
      var P = P_(d), T = [];
      if (B.umid) T.push({ chave: "umid", titulo: "Teor de umidade imediatamente antes da compactação (" + B.umid.secao + ")", rotulo: "Det.", iniciais: 1, min: 1,
        dica: B.umid.dica || "", linhas: [L_EST, L_REG, { k: "w", r: CAMPO.w.r, u: "%" }, { k: "hot", r: "Umidade ótima de referência", u: "%", padrao: "hOt" },
          { calc: "dw", r: "Δw = w − h ót", u: "p.p.", casas: 1, destaque: true }] });
      if (B.comp) T.push({ chave: "comp", titulo: (B.comp.titulo || "Compactação e ISC") + " (" + B.comp.secao + ")", rotulo: "Amostra", iniciais: 1, min: 1,
        dica: B.comp.dica || "", linhas: [L_EST, L_REG].concat(linhasCampos(["gs", "hot"].concat(B.comp.campos || []))) });
      if (B.gc) T.push({ chave: "gc", titulo: "Grau de compactação na pista (" + B.gc.secao + ")", rotulo: "Furo", iniciais: 1, min: 1,
        dica: B.gc.dica || "GC ≥ 100 %", linhas: [L_EST, { k: "pos", r: "Posição (LE / eixo / LD)", texto: true }, L_REG,
          { k: "gc", r: "Grau de compactação (GC)", u: "%" }, { k: "w", r: "Umidade do furo (informativa)", u: "%" }] });
      if (B.carac && (!B.carac.se || B.carac.se(P))) {
        var lc = [L_EST, L_REG].concat(linhasCampos(B.carac.campos));
        if (B.carac.campos.indexOf("ig") >= 0) lc.push({ calc: "igA", r: "Índice de grupo adotado (digitado ou calculado)", u: "", casas: 0, destaque: true });
        T.push({ chave: "carac", titulo: (B.carac.titulo || "Caracterização") + " (" + B.carac.secao + ")", rotulo: "Amostra", iniciais: 1, min: 1,
          dica: B.carac.dica || "\"NP\" aceito em LL/IP", linhas: lc });
      }
      if (B.ins && (!B.ins.se || B.ins.se(P))) T.push({ chave: "ins", titulo: (B.ins.titulo || "Insumo") + " (" + B.ins.secao + ")", rotulo: "Amostra", iniciais: 1, min: 1,
        dica: B.ins.dica || "", linhas: [L_REG].concat(linhasCampos(B.ins.campos)) });
      GR.forEach(function (g) {
        if (g.se && !g.se(P)) return;
        T.push({ chave: g.chave, titulo: g.titulo + " — % passando (" + g.secao + ")", rotulo: "Amostra", iniciais: 1, min: 1, dica: g.dica || "",
          linhas: [L_EST, L_REG].concat(g.pen.map(function (p) { return { k: kPen(p[0]), r: rotPen(p), u: "%" }; })).concat(linhasCampos(g.extras || [])) });
        if (g.proj !== false) T.push({ chave: g.chave + "P", titulo: g.titulo + " — curva de projeto (faixa de trabalho = projeto ± tolerância)", rotulo: "Curva",
          iniciais: 1, min: 1, fixo: true, nomes: ["Projeto"], dica: "deixe vazio se não houver curva de projeto: vale só a faixa",
          linhas: g.pen.map(function (p) { return { k: kPen(p[0]), r: rotPen(p) + (p[2] !== null ? " — tolerância ± " + p[2] : ""), u: "%" }; }) });
      });
      if (B.verif) {
        if (Array.isArray(d.verif)) while (d.verif.length < B.verif.length) d.verif.push({});
        T.push({ chave: "verif", titulo: "Verificações (" + B.verifSecao + ")", rotulo: "Item", iniciais: B.verif.length, min: B.verif.length, fixo: true,
          nomes: B.verif.map(function (v) { return v.texto + " (" + v.secao + ")"; }), dica: "\"S\" / \"N\", ou nº de verificações e de não conformes",
          linhas: [{ k: "atende", r: "Atende? (S / N)", texto: true }, { k: "real", r: "Verificações realizadas", u: "nº" },
            { k: "nc", r: "Verificações não conformes", u: "nº" }, { k: "obs", r: "Observação", texto: true }] });
      }
      if (B.defl && (!B.defl.se || B.defl.se(P))) T.push({ chave: "defl", titulo: "Deflexões D₀ (" + B.defl.secao + ")", rotulo: "Det.", iniciais: 1, min: 1,
        dica: B.defl.dica || "", linhas: [L_EST, { k: "pos", r: "Posição (bordo / eixo)", texto: true }, { k: "d0", r: "D₀", u: "0,01 mm" }] });
      if (B.geo) {
        var G = B.geo, lg = [L_EST, { k: "larg", r: G.rotLarg || "Largura", u: "m" }];
        if (G.esp) lg.push({ k: "esp", r: "Espessura da camada", u: "cm" });
        if (G.flecha && P.secaoT !== "simples") lg.push({ k: "flecha", r: "Flecha de abaulamento", u: "cm" });
        if (G.decl) lg.push({ k: "decl", r: "Declividade transversal", u: "%" });
        if (G.cotas) lg.push({ k: "dcx", r: "Cota − greide de projeto: eixo", u: "cm" }, { k: "dce", r: "Cota − greide: bordo esquerdo", u: "cm" },
          { k: "dcd", r: "Cota − greide: bordo direito", u: "cm" });
        T.push({ chave: "geo", titulo: "Controle geométrico — relocação e nivelamento (" + G.secao + ")", rotulo: "Seção", iniciais: 1, min: 1, dica: G.dica || "", linhas: lg });
      }
      return T;
    }

    // ---------------- cálculo ----------------
    function calcular(d) {
      var P = P_(d), L = A.lote(P), av = [], tab = {};
      var espP = num(P.espessura), jorn = ok(num(P.jornadas)) && num(P.jornadas) > 0 ? Math.round(num(P.jornadas)) : 1;
      var V = ok(num(P.volume)) ? num(P.volume) : ok(L.area) && ok(espP) ? L.area * espP / 100 : NaN;
      if (!ok(L.ext)) av.push("Informe as estacas inicial e final (ou a extensão) do lote: as frequências dependem da extensão.");
      if (!ok(L.larg)) av.push("Informe a largura de projeto (controle geométrico e área do lote).");
      if (cfg.espLim && ok(espP) && (espP < cfg.espLim[0] || espP > cfg.espLim[1]))
        av.push("Espessura de projeto de " + fmt(espP, 1) + " cm: " + cfg.espLimTxt);
      var hRef = ok(num(P.hOt)) ? num(P.hOt) : media((d.comp || []).map(function (c) { return num(c.hot); }));
      if (B.umid) {
        tab.umid = (d.umid || []).map(function (c) {
          var w = num(c.w), h = ok(num(c.hot)) ? num(c.hot) : hRef;
          return { dw: ok(w) && ok(h) ? w - h : NaN };
        });
        if ((d.umid || []).some(function (c) { return ok(num(c.w)) && !ok(num(c.hot)); }) && !ok(hRef))
          av.push("Sem umidade ótima de referência: importe a compactação (DNIT 164/172) ou informe a h ót.");
      }
      if (B.carac) tab.carac = (d.carac || []).map(function (c) { return { igA: igDe(c) }; });
      var ctx = { d: d, P: P, L: L, V: V, espP: espP, jorn: jorn, hRef: hRef, av: av, tab: tab, linhas: [], freqs: [], gran: {}, geo: {} };
      var H = helpers(ctx);
      cfg.criterios(ctx, H);
      // estacas fora do lote
      if (ok(L.ini) && ok(L.fim)) ["umid", "comp", "gc", "carac", "defl", "geo"].concat(GR.map(function (g) { return g.chave; })).forEach(function (ch) {
        var fora = (d[ch] || []).filter(function (c) { var x = A.estacaM(c.est); return ok(x) && (x < L.ini - 1e-6 || x > L.fim + 1e-6); });
        if (fora.length) av.push("Tabela \"" + ch + "\": " + fora.length + " coluna(s) com estaca fora do lote (" + fora.map(function (c) { return c.est; }).join("; ") + ").");
      });
      ctx.freqs.forEach(function (f) { if (f.situacao === "insuficiente") av.push("Frequência: " + f.ensaio + " — " + f.realizado + " de " + f.exigido + " exigida(s) (" + f.regra + ")."); });
      var nota = ctx.linhas.filter(function (l) { return (l.situacao === "conforme" || l.situacao === "ressalva") && /^valores individuais \(n </.test(l.regra || ""); })
        .map(function (l) { return l.criterio; });
      var par = A.parecer(ctx.linhas, ctx.freqs, { textos: cfg.textos,
        nota: nota.length ? "Avaliados por valor individual (n < 5, fora da tabela de k): " + nota.join("; ") + "." : "" });
      // medição
      var g = ctx.geo, med = NaN, medProj = NaN;
      if (cfg.medicao === "area") { med = ok(L.ext) && ok(g.largM) ? L.ext * g.largM : NaN; medProj = ok(L.ext) && ok(L.larg) ? L.ext * L.larg : NaN; }
      if (cfg.medicao === "volume") { med = ok(L.ext) && ok(g.largM) && ok(g.espM) ? L.ext * g.largM * g.espM / 100 : NaN; medProj = ok(L.ext) && ok(L.larg) && ok(espP) ? L.ext * L.larg * espP / 100 : NaN; }
      var medF = ok(med) && ok(medProj) ? Math.min(med, medProj) : med;
      return { tab: tab, avisos: av, resultados: { lote: L, V: V, hRef: hRef, linhas: ctx.linhas, freqs: ctx.freqs, gran: ctx.gran, parecer: par,
        largM: g.largM, espM: g.espM, med: medF, medExec: med, medProj: medProj, conforme: par.parecer === "ACEITO" || par.parecer === "RESSALVA" } };
    }

    function helpers(ctx) {
      var d = ctx.d, P = ctx.P, L = ctx.L;
      function pts(chave, campo, o) {
        o = o || {};
        var out = [];
        (d[chave] || []).forEach(function (c, i) {
          var v;
          if (typeof campo === "function") v = campo(c, i);
          else { var x = A.numOuNP(c[campo]); v = x.np ? (o.np === undefined ? NaN : o.np) : x.v; }
          if (ok(v)) out.push({ v: v, est: c.est || "", x: A.estacaM(c.est), rot: (o.rot || "amostra") + " " + (i + 1) });
        });
        return out;
      }
      function av(o) {
        var c = Object.assign({ refs: cfg.refs, tabelaK: cfg.tabelaK }, o);
        if (!c.pontos) c.pontos = pts(o.tab, o.campo, o);
        var l = A.avaliar(c);
        l.graf = !!o.graf;
        ctx.linhas.push(l);
        return l;
      }
      function info(l, texto) { l.situacao = "informativo"; l.motivo = texto; l.motivos = []; return l; }
      function conta(chave, campos) {
        return (d[chave] || []).filter(function (c) { return campos.some(function (k) { var x = A.numOuNP(c[k]); return x.np || ok(x.v); }); }).length;
      }
      function exig(o) {
        if (o.exigido !== undefined) return { exigido: o.exigido, regra: o.regra || "—" };
        var min = o.minimo || 1;
        if (o.por === "lote") return { exigido: min, regra: o.regra || (min + " por lote") };
        if (o.por === "jornada") return { exigido: o.qtd * ctx.jorn, regra: o.regra || (o.qtd + " por jornada de 8 h (" + ctx.jorn + " jornada(s))") };
        var homog = P.homog === "sim" && o.a_cadaH, passo = homog ? o.a_cadaH : o.a_cada;
        var vol = o.por === "volume", q = vol ? ctx.V : L.ext, un = vol ? " m³" : " m";
        var base = ok(q) ? Math.ceil(q / passo - EPS) : NaN;
        if (o.jornada && !homog && ok(base)) base = Math.max(base, ctx.jorn);
        var m5 = "";
        if (o.min5area && ok(L.area) && L.area <= 4000 + EPS) { min = Math.max(min, 5); m5 = " (área ≤ 4.000 m²)"; }
        if (o.min5vol && ok(ctx.V) && ctx.V <= o.min5vol + EPS) { min = Math.max(min, 5); m5 = " (≤ " + fmt(o.min5vol, 0) + " m³)"; }
        return { exigido: ok(base) ? Math.max(base, min) : NaN,
          regra: o.regra || ("1 a cada " + fmt(passo, 0) + un + (o.jornada && !homog ? " ou por jornada" : "") + (homog ? " (reduzida: material homogêneo)" : "") +
            (min > 1 ? "; mín. " + min + m5 : "") + (o.secao ? " (" + o.secao + ")" : "")) };
      }
      function freq(o) {
        var e = exig(o);
        var f = A.frequencia({ ensaio: o.ensaio, metodo: o.metodo || "—", regra: e.regra, exigido: e.exigido, realizado: o.realizado || 0, aplica: o.aplica });
        ctx.freqs.push(f);
        return f;
      }
      function gran(chave) {
        var g = GR.filter(function (x) { return x.chave === chave; })[0];
        if (g.se && !g.se(P)) return null;
        var fid = typeof g.faixa === "function" ? g.faixa(P) : g.faixa;
        var fx = (FE.granulometria.faixasDisponiveis() || []).filter(function (f) { return f.id === fid; })[0] || null;
        var proj = (d[chave + "P"] || [])[0] || {}, rows = d[chave] || [];
        var cols = rows.filter(function (c) { return g.pen.some(function (p) { return ok(num(c[kPen(p[0])])); }); });
        var temProj = g.pen.some(function (p) { return ok(num(proj[kPen(p[0])])); });
        var pens = g.pen.map(function (p) {
          var k = kPen(p[0]), pj = num(proj[k]), lim = fx ? fx.peneiras.filter(function (x) { return perto(x.mm, p[0]); })[0] : null, mn = NaN, mx = NaN;
          if (ok(pj) && p[2] !== null) { mn = Math.max(0, pj - p[2]); mx = Math.min(100, pj + p[2]); }
          if (lim) { mn = ok(mn) ? Math.max(mn, lim.min) : lim.min; mx = ok(mx) ? Math.min(mx, lim.max) : lim.max; }
          if (ok(pj) && lim && (pj < lim.min - EPS || pj > lim.max + EPS)) ctx.av.push(g.titulo + ": curva de projeto fora da faixa " + fx.faixa + " na peneira " + p[1] + " (" + fmt(pj, 0) + " %; " + lim.min + "–" + lim.max + ").");
          if (ok(mn) && ok(mx) && mn > mx + EPS) ctx.av.push(g.titulo + ": projeto ± tolerância não cruza a faixa na peneira " + p[1] + ".");
          var pp = pts(chave, k, { rot: "amostra" });
          var l = A.avaliar({ criterio: "Peneira " + p[1], secao: g.secao, unid: "%", casas: 1, pontos: pp, min: mn, max: mx, individual: g.individual,
            aplica: ok(mn) || ok(mx), naoAplicaPor: "sem limite (faixa / projeto)", refs: cfg.refs, tabelaK: cfg.tabelaK });
          return { mm: p[0], nome: p[1], tol: p[2], proj: pj, ref: lim, min: mn, max: mx, l: l, media: media(pp.map(function (x) { return x.v; })) };
        });
        var sum = A.linha({ id: chave, criterio: g.nome, secao: g.secao, n: cols.length, semMedia: true, txtEstat: "—", casas: 1,
          exigido: (fx ? "faixa " + fx.faixa : "") + (fx && temProj ? " ∩ " : "") + (temProj ? "projeto ± tolerância" : "") || "—" });
        if (!fx && !temProj) { sum.situacao = "nao_exigido"; sum.motivo = g.semLimite || "sem faixa e sem curva de projeto"; }
        else if (!cols.length) { sum.situacao = "sem_dados"; sum.motivo = "sem determinações"; }
        else {
          var avaliadas = pens.filter(function (x) { return x.l.situacao !== "nao_exigido" && x.l.situacao !== "sem_dados"; });
          var sit = avaliadas.reduce(function (s, x) { return A.pior(s, x.l.situacao); }, "conforme");
          var ruins = avaliadas.filter(function (x) { return x.l.situacao !== "conforme"; });
          sum.situacao = sit;
          sum.motivo = ruins.length ? ruins.map(function (x) { return x.nome + " — " + x.l.motivo; }).join(" | ")
            : (cols.length >= 5 && !g.individual ? "todas as peneiras atendem X̄ ± k·s" : "todas as peneiras atendem (valores individuais)");
          if (sit !== "conforme") sum.motivos = [{ situacao: sit, texto: sum.motivo }];
          var semDet = pens.filter(function (x) { return (ok(x.min) || ok(x.max)) && x.l.situacao === "sem_dados"; });
          if (semDet.length) sum.motivo += " (sem determinação em: " + semDet.map(function (x) { return x.nome; }).join(", ") + ")";
        }
        ctx.linhas.push(sum);
        ctx.gran[chave] = { g: g, fx: fx, pens: pens, n: cols.length, temProj: temProj };
        return sum;
      }
      function geo() {
        var G = B.geo, larg = L.larg, e = ctx.espP;
        function linhaProj(o, proj, pp, nomeProj) {
          if (ok(proj)) return av(Object.assign(o, { pontos: pp }));
          var l = A.linha({ id: o.id, criterio: o.criterio, secao: o.secao, n: pp.length, exigido: o.exigidoSem || "—" });
          l.situacao = pp.length ? "pendente" : "sem_dados";
          l.motivo = pp.length ? "informe " + nomeProj : "sem determinações";
          l.motivos = [{ situacao: l.situacao, texto: l.motivo }];
          ctx.linhas.push(l);
          return l;
        }
        var pl = pts("geo", "larg", { rot: "seção" });
        linhaProj({ id: "larg", criterio: G.rotLarg || "Largura da plataforma", secao: G.secao + " a", unid: "m", casas: 2,
          min: ok(larg) ? larg - G.larg : NaN, max: ok(larg) ? larg + G.larg : NaN, exigido: "projeto ± " + fmt(G.larg * 100, 0) + " cm" + (ok(larg) ? " (" + fmt(larg - G.larg, 2) + " a " + fmt(larg + G.larg, 2) + " m)" : "") }, larg, pl, "a largura de projeto");
        if (G.esp) linhaProj({ id: "esp", criterio: "Espessura da camada", secao: G.secao + " c", unid: "cm", casas: 1, graf: true,
          min: ok(e) ? e * 0.9 : NaN, max: ok(e) ? e * 1.1 : NaN, exigido: "projeto ± 10 %" + (ok(e) ? " (" + fmt(e * 0.9, 1) + " a " + fmt(e * 1.1, 1) + " cm)" : "") },
          e, pts("geo", "esp", { rot: "seção" }), "a espessura de projeto");
        if (G.flecha) {
          if (P.secaoT === "simples") {
            var ln = A.linha({ id: "flecha", criterio: "Flecha de abaulamento", secao: G.secao + " b", situacao: "nao_exigido",
              motivo: "seção em caimento simples: a ES só fixa tolerância para a flecha de abaulamento" });
            ctx.linhas.push(ln);
          } else {
            var fl = num(P.flechaProj);
            linhaProj({ id: "flecha", criterio: "Flecha de abaulamento", secao: G.secao + " b", unid: "cm", casas: 1, min: fl, max: ok(fl) ? fl * 1.2 : NaN, obrigMin: true,
              exigido: "até +20 % (sem falta)" + (ok(fl) ? " (" + fmt(fl, 1) + " a " + fmt(fl * 1.2, 1) + " cm)" : "") }, fl, pts("geo", "flecha", { rot: "seção" }), "a flecha de projeto");
          }
        }
        if (G.decl) {
          var dp = num(P.declProj);
          linhaProj({ id: "decl", criterio: "Declividade transversal", secao: G.secao + " b", unid: "%", casas: 1, min: dp, max: ok(dp) ? dp + G.decl : NaN, obrigMin: true,
            exigido: "até +" + fmt(G.decl, 0) + " p.p. (sem falta)" + (ok(dp) ? " (" + fmt(dp, 1) + " a " + fmt(dp + G.decl, 1) + " %)" : "") }, dp, pts("geo", "decl", { rot: "seção" }), "a declividade de projeto");
        }
        if (G.cotas) {
          var pc = [];
          (d.geo || []).forEach(function (c, i) {
            [["dcx", "eixo"], ["dce", "LE"], ["dcd", "LD"]].forEach(function (k) {
              var v = num(c[k[0]]);
              if (ok(v)) pc.push({ v: v, est: c.est || "", x: A.estacaM(c.est), rot: "seção " + (i + 1) + " " + k[1] });
            });
          });
          av({ id: "cotas", criterio: "Cotas em relação ao greide de projeto", secao: G.secao + " c", unid: "cm", casas: 1, min: -G.cotas, max: G.cotas, pontos: pc,
            exigido: "± " + fmt(G.cotas, 0) + " cm", graf: true });
        }
        var espGeo = ok(num(P.espGeo)) && num(P.espGeo) > 0 ? num(P.espGeo) : 20;
        freq({ ensaio: "Controle geométrico (seções)", metodo: "relocação e nivelamento", exigido: ok(L.ext) ? A.nPontos(L.ext, espGeo) : NaN,
          regra: "eixo e bordas (" + G.secao + "); 1 seção a cada " + fmt(espGeo, 0) + " m (adotado — a ES não fixa)",
          realizado: conta("geo", ["larg", "esp", "flecha", "decl", "dcx", "dce", "dcd"]) });
        ctx.geo.largM = media((d.geo || []).map(function (c) { return num(c.larg); }));
        ctx.geo.espM = media((d.geo || []).map(function (c) { return num(c.esp); }));
      }
      function verif() {
        function sn(t) {
          t = String(t === undefined || t === null ? "" : t).trim().toLowerCase();
          if (/^(s|sim|ok|c|x|1)$/.test(t)) return true;
          if (/^(n|n[aã]o|nc|0)$/.test(t)) return false;
          return null;
        }
        B.verif.forEach(function (it, i) {
          var c = (d.verif || [])[i] || {}, s = sn(c.atende), real = num(c.real), nc = num(c.nc);
          if (!ok(real)) real = s === null ? (ok(nc) ? nc : 0) : 1;
          if (!ok(nc)) nc = s === false ? 1 : 0;
          if (nc > real) real = nc;
          var l = A.linha({ id: "v" + i, criterio: it.texto, secao: it.secao, n: real, exigido: it.exigido || "conforme a ES",
            resultado: real ? (real - nc) + " de " + real + " conforme(s)" : "—", semMedia: true, txtEstat: "—" });
          if (!real) A.marcar(l, "sem_dados", "não verificado");
          else if (nc) A.marcar(l, "nao_conforme", nc + " de " + real + " verificação(ões) não conforme(s)" + (c.obs ? " — " + c.obs : ""));
          else l.motivo = real + " verificação(ões) conforme(s)" + (c.obs ? " — " + c.obs : "");
          ctx.linhas.push(l);
        });
      }
      return { pts: pts, av: av, info: info, conta: conta, freq: freq, exig: exig, gran: gran, geo: geo, verif: verif, normMct: normMct };
    }

    // ---------------- apresentação ----------------
    function tabGran(r, relat) {
      var cls = relat ? "gr" : "fe-resumo", h = "";
      Object.keys(r.gran).forEach(function (ch) {
        var G = r.gran[ch];
        if (!G.n && !G.temProj) return;
        h += (relat ? "<h2>" : '<h4 style="margin:12px 0 4px">') + esc(G.g.nome) + (relat ? "</h2>" : "</h4>") +
          '<table class="' + cls + '"><thead><tr><th>Peneira</th><th>Projeto</th>' + (G.fx ? "<th>Faixa " + esc(G.fx.faixa) + "</th>" : "") +
          "<th>Limites adotados</th><th>n</th><th>X̄</th><th>X̄ − k·s / X̄ + k·s</th><th>Situação</th></tr></thead><tbody>" + G.pens.map(function (p) {
            var l = p.l;
            return "<tr><td>" + esc(p.nome) + "</td><td>" + (ok(p.proj) ? fmt(p.proj, 0) + (p.tol !== null ? " ± " + p.tol : "") : "—") + "</td>" +
              (G.fx ? "<td>" + (p.ref ? p.ref.min + "–" + p.ref.max : "—") + "</td>" : "") + "<td>" + (ok(p.min) ? fmt(p.min, 0) + "–" + fmt(p.max, 0) : "—") +
              "</td><td>" + (l.n || 0) + "</td><td>" + (ok(p.media) ? fmt(p.media, 1) : "—") + "</td><td>" + (ok(l.inf) ? fmt(l.inf, 1) + " / " + fmt(l.sup, 1) : "—") +
              "</td><td>" + A.situacaoHtml(l.situacao, relat) + "</td></tr>";
          }).join("") + "</tbody></table>";
      });
      return h;
    }
    function resultadosHtml(calc) {
      var r = calc.resultados, L = r.lote;
      return A.htmlParecer(r.parecer) + '<div class="fe-res">' +
        A.cartao(ok(L.ext) ? fmt(L.ext, 0) + " m" : "—", "Extensão do lote" + (ok(L.ini) && ok(L.fim) ? " (est. " + A.fmtEstaca(L.ini, { simples: true }) + " a " + A.fmtEstaca(L.fim, { simples: true }) + ")" : "")) +
        A.cartao(ok(L.area) ? fmt(L.area, 0) + " m²" : "—", "Área (extensão × largura de projeto)") +
        (cfg.volume ? A.cartao(ok(r.V) ? fmt(r.V, 0) + " m³" : "—", "Volume de material do lote") : "") +
        (B.umid ? A.cartao(ok(r.hRef) ? fmt(r.hRef, 1) + " %" : "—", "Umidade ótima de referência") : "") +
        (cfg.medicao ? A.cartao(ok(r.med) ? fmt(r.med, cfg.medicao === "area" ? 0 : 1) + (cfg.medicao === "area" ? " m²" : " m³") : "—",
          "Quantidade para medição (" + cfg.secMedicao + ")" + (ok(r.medExec) && ok(r.medProj) && r.medExec > r.medProj ? " — limitada ao projeto" : "")) : "") +
        "</div>" +
        '<h4 style="margin:12px 0 4px">Critérios de aceitação</h4>' + A.htmlCriterios(r.linhas, { estilo: "estatistico" }) +
        '<h4 style="margin:12px 0 4px">Frequência dos ensaios</h4>' + A.htmlFrequencia(r.freqs) + tabGran(r, false);
    }
    function graficos(calc, d, opt) {
      var r = calc.resultados, out = r.linhas.filter(function (l) { return l.graf && l.n && l.est; }).map(function (l) { return A.graficoLinha(l, opt); }).filter(Boolean);
      Object.keys(r.gran).forEach(function (ch) {
        var G = r.gran[ch];
        var amostras = (d[ch] || []).map(function (c) {
          var pen = G.g.pen.map(function (p) { return { mm: p[0], pass: num(c[kPen(p[0])]) }; }).filter(function (x) { return ok(x.pass); });
          return pen.length >= 2 ? { pen: pen } : null;
        }).filter(Boolean);
        if (!amostras.length) return;
        var med = G.pens.filter(function (p) { return ok(p.media); }).map(function (p) {
          var lim = ok(p.min) ? { min: p.min, max: p.max } : null;
          return { mm: p.mm, pass: p.media, lim: lim, dentro: lim ? p.media >= lim.min - EPS && p.media <= lim.max + EPS : null };
        });
        out.push(FE.granulometria.grafico({ amostras: amostras, resultados: { media: med } }, opt));
      });
      return out.length ? out : ['<div class="fe-graf-vazio">Os gráficos aparecem com os resultados do lote.</div>'];
    }
    var notaK = " Conformidade: X̄ − k·s ≥ mínimo e X̄ + k·s ≤ máximo (X̄ = Σxᵢ/n; s = √[Σ(xᵢ − X̄)²/(n − 1)]); k da " + cfg.tabelaNome +
      ". Critérios adotados pela ficha: n < 5 → valores individuais; n não tabelado → k do n tabelado imediatamente inferior; n > 21 → k = 1,01; " +
      "com a estatística atendida, valor individual fora do limite gera ressalva (corrigir o local), exceto quando a ES não tolera falta. " +
      "Parecer: rejeitado se algum critério não conforme; pendente se faltar ensaio/determinação exigido; aceito com ressalva; aceito.";
    FE.FICHAS[ID] = {
      titulo: cfg.titulo, rotuloLink: "Aceitação de lote", resumo: cfg.resumo, blocos: [], params: params, padrao: cfg.padrao || {},
      tabelas: tabelas, calcular: calcular, resultadosHtml: resultadosHtml, graficos: graficos,
      relatorio: {
        notas: (cfg.notas || "") + notaK,
        parametros: [["Critério de aceitação", cfg.criterioTxt]],
        resultados: function (calc) {
          var r = calc.resultados, L = r.lote, rows = [["Parecer do lote", r.parecer.titulo],
            ["Lote", (ok(L.ini) && ok(L.fim) ? "estaca " + A.fmtEstaca(L.ini, { simples: true }) + " a " + A.fmtEstaca(L.fim, { simples: true }) + " · " : "") +
              (ok(L.ext) ? fmt(L.ext, 0) + " m" : "—") + (ok(L.area) ? " · " + fmt(L.area, 0) + " m²" : "") + (cfg.volume && ok(r.V) ? " · " + fmt(r.V, 0) + " m³" : "")]];
          if (ok(r.largM) || ok(r.espM)) rows.push(["Largura / espessura médias (controle geométrico)", (ok(r.largM) ? fmt(r.largM, 2) + " m" : "—") + (B.geo && B.geo.esp ? " / " + (ok(r.espM) ? fmt(r.espM, 1) + " cm" : "—") : "")]);
          if (cfg.medicao && ok(r.med)) rows.push(["Quantidade para medição (" + cfg.secMedicao + ")", fmt(r.med, cfg.medicao === "area" ? 0 : 1) + (cfg.medicao === "area" ? " m²" : " m³") +
            (ok(r.medExec) && ok(r.medProj) && r.medExec > r.medProj ? " (limitada ao projeto)" : "")]);
          return rows;
        },
        extraHtml: function (calc) {
          var r = calc.resultados;
          return A.htmlParecer(r.parecer, { relat: true }) + "<h2>Critérios de aceitação</h2>" + A.htmlCriterios(r.linhas, { relat: true, estilo: "estatistico" }) +
            "<h2>Frequência dos ensaios</h2>" + A.htmlFrequencia(r.freqs, true) + tabGran(r, true);
        },
      },
      exemplos: [],
    };
    return FE.FICHAS[ID];
  }

  // ---------- geradores para os exemplos ----------
  // valores por estaca: lista de [estaca, valor] → colunas {est, reg, campo}
  function colunas(lista, campo, reg, casas) {
    return lista.map(function (x, i) {
      var c = { est: String(x[0]), reg: typeof reg === "function" ? reg(i) : reg };
      c[campo] = typeof x[1] === "string" ? x[1] : nstr(x[1], casas === undefined ? 1 : casas);
      return c;
    });
  }
  // seções de 20 em 20 m a partir da estaca ini: obj(i) → {larg, esp, flecha, decl, dcx...}
  function secoes(ini, n, fn) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var o = fn(i), c = { est: String(ini + i) };
      Object.keys(o).forEach(function (k) { c[k] = nstr(o[k], k === "larg" ? 2 : 1); });
      out.push(c);
    }
    return out;
  }
  // pequena variação determinística (para os exemplos)
  function onda(i, a) { return a * Math.sin(i * 1.7 + 0.3); }

  FE.aceitacaoG1 = { criar: criar, K_PRO277: K_PRO277, indiceGrupo: indiceGrupo, kPen: kPen,
    ex: { colunas: colunas, secoes: secoes, onda: onda, importar: function (F, d, k, refs) { A.exemplos.importar(F.params, d, k, refs); } } };

  // =====================================================================================================
  // DNIT 137/2010-ES — Regularização do subleito
  // =====================================================================================================
  var REFS = { reprova: "7.5 b", atende: "7.5 a", corrige: "7.5", regra: "7.5", tabela: "DNER-PRO 277/97, Tabela 1" };
  var F = criar({
    id: "dnit-137-2010-es",
    titulo: "Regularização do subleito — aceitação de lote",
    resumo: "Reúne os ensaios do lote (importados das fichas ME ou digitados), confere a frequência (7.1, 7.2) e aplica os critérios da ES: umidade (h ót ± 2 %), " +
      "grau de compactação ≥ 100 %, material de substituição/adição (expansão ≤ 2 %, IG ≤ IG do subleito, sem partículas > 76 mm) e controle geométrico " +
      "(largura ± 10 cm, flecha até +20 %, cotas ± 3 cm), com o controle estatístico da 7.5.",
    refs: REFS, tabelaK: K_PRO277, tabelaNome: "DNER-PRO 277/97, Tabela 1 (a ES diz \"k tabelado\" mas não traz a tabela; 7.4 remete à PRO 277)",
    espessura: false, homog: true, medicao: "area", secMedicao: "8 a, b, c",
    params: [
      { k: "material", r: "Material da camada (5.1)", tipo: "select", opcoes: [["proprio", "Próprio subleito"], ["adicao", "Substituição ou adição de material (jazida do projeto)"]] },
      { k: "igSub", r: "IG do subleito indicado no projeto (5.1)", se: function (d) { return (d.params || {}).material === "adicao"; } },
      { k: "iscProj", r: "ISC de referência do projeto (%) — opcional", dica: "a ES só pede \"a melhor capacidade de suporte\" (DNIT 108, 5.1 d)",
        se: function (d) { return (d.params || {}).material === "adicao"; } },
      { k: "espGC", r: "Plano de amostragem: espaçamento das determinações de GC (m) — opcional", dica: "7.2 b/7.4: vazio = mínimo de 5 determinações" },
      { k: "secaoT", r: "Seção transversal", tipo: "select", opcoes: [["abaul", "Abaulamento — flecha (7.3 b)"], ["simples", "Caimento simples (a ES só fixa a flecha)"]] },
      { k: "flechaProj", r: "Flecha de abaulamento de projeto (cm)", se: function (d) { return (d.params || {}).secaoT !== "simples"; } },
    ],
    padrao: { material: "proprio", homog: "nao", jornadas: "1", secaoT: "abaul", espGeo: "20" },
    blocos: {
      umid: { secao: "7.2 a", dica: "a cada 100 m; tolerância h ót ± 2 %" },
      comp: { titulo: "Compactação, ISC e expansão", secao: "5.1; 7.1 b, c", campos: ["isc", "exp"], dica: "compactação a cada 200 m ou jornada; ISC e expansão a cada 400 m" },
      gc: { secao: "7.2 b, c" },
      carac: { titulo: "Caracterização do material", secao: "5.1; 7.1 a", campos: ["p76", "p200", "ll", "ip", "ig"], dica: "IG calculado de p200, LL e IP (ou digitado); \"NP\" aceito" },
      geo: { secao: "7.3", larg: 0.10, flecha: true, cotas: 3, dica: "largura ± 10 cm; flecha até +20 % (sem falta); cotas ± 3 cm" },
    },
    criterioTxt: "DNIT 137/2010-ES, 7.5 — controle estatístico com a Tabela 1 da DNER-PRO 277/97",
    notas: "DNIT 137/2010-ES. Métodos citados e substituídos: DNER-ME 129 → DNIT 164; DNER-ME 049 → DNIT 172; DNER-ME 080 → DNIT 412; DNER-ME 052/088 → DNIT 456; DNER-ME 092 → DNIT 458. " +
      "IG pela classificação TRB (IG = 0,2a + 0,005ac + 0,01bd). Umidade: tolerância em pontos percentuais em torno da h ót. Os requisitos de 5.1 são aplicados só ao material de substituição/adição.",
    criterios: function (c, H) {
      var P = c.P, L = c.L, adic = P.material === "adicao";
      // frequências
      H.freq({ ensaio: "Caracterização (granulometria, LL, LP)", metodo: "DNIT 412 / DNER-ME 122 / 082", a_cada: 200, a_cadaH: 400, jornada: true, min5area: true, secao: "7.1 a, d",
        realizado: H.conta("carac", ["p200", "ll", "ip", "ig"]) });
      H.freq({ ensaio: "Compactação (γs,máx e h ót)", metodo: "DNIT 164 (DNER-ME 129 citada)", a_cada: 200, a_cadaH: 400, jornada: true, min5area: true, secao: "7.1 b, d",
        realizado: H.conta("comp", ["gs"]) });
      H.freq({ ensaio: "ISC e expansão", metodo: "DNIT 172 (DNER-ME 049 citada)", a_cada: 400, a_cadaH: 800, min5area: true, secao: "7.1 c, d",
        realizado: H.conta("comp", ["isc", "exp"]) });
      H.freq({ ensaio: "Umidade antes da compactação", metodo: "DNIT 456 (DNER-ME 052/088 citadas)", a_cada: 100, secao: "7.2 a", realizado: H.conta("umid", ["w"]) });
      var espGC = num(P.espGC);
      H.freq({ ensaio: "Grau de compactação", metodo: "DNIT 458 / DNER-ME 036", exigido: ok(espGC) && espGC > 0 && ok(L.ext) ? A.nMin(L.ext, espGC, 5) : 5,
        regra: ok(espGC) && espGC > 0 ? "1 a cada " + fmt(espGC, 0) + " m (plano, 7.4); mín. 5" : "plano de amostragem (7.4); mín. 5 (7.2 b)", realizado: H.conta("gc", ["gc"]) });
      // execução
      H.av({ id: "umid", criterio: "Umidade antes da compactação: Δw = w − h ót", secao: "7.2 a", unid: "p.p.", casas: 1, min: -2, max: 2, graf: true,
        exigido: "h ót ± 2 (Δw de −2,0 a +2,0)", pontos: H.pts("umid", function (x, i) { return c.tab.umid[i].dw; }, { rot: "det." }) });
      H.av({ id: "gc", criterio: "Grau de compactação", secao: "7.2 c", unid: "%", casas: 1, min: 100, tab: "gc", campo: "gc", rot: "furo", graf: true });
      // material (5.1) — substituição/adição
      var nAp = "material do próprio subleito (5.1: requisitos do material de substituição/adição)";
      H.av({ id: "exp", criterio: "Expansão", secao: "5.1", unid: "%", casas: 2, max: 2, tab: "comp", campo: "exp", aplica: adic, naoAplicaPor: nAp });
      var iscP = num(P.iscProj);
      var li = H.av({ id: "isc", criterio: "ISC", secao: "5.1", unid: "%", casas: 0, min: ok(iscP) ? iscP : NaN, tab: "comp", campo: "isc", aplica: adic, naoAplicaPor: nAp,
        exigido: ok(iscP) ? "≥ " + fmt(iscP, 0) + " % (projeto)" : "\"a melhor capacidade de suporte\"" });
      if (adic && !ok(iscP) && li.n) H.info(li, "a ES não fixa ISC mínimo (\"a melhor capacidade de suporte\", 5.1 / DNIT 108 5.1 d) — informe o ISC do projeto para comparar");
      var igS = num(P.igSub);
      var lg = H.av({ id: "ig", criterio: "Índice de grupo", secao: "5.1", unid: "", casas: 0, max: igS, aplica: adic, naoAplicaPor: nAp, exigido: ok(igS) ? "≤ " + fmt(igS, 0) + " (IG do subleito)" : "≤ IG do subleito do projeto",
        pontos: H.pts("carac", function (x, i) { return c.tab.carac[i].igA; }) });
      if (adic && !ok(igS) && lg.n) A.marcar(lg, "pendente", "informe o IG do subleito indicado no projeto");
      H.av({ id: "p76", criterio: "Sem partículas > 76 mm (passante na peneira de 3\")", secao: "5.1", unid: "%", casas: 0, min: 100, individual: true, obrigMin: true,
        exigido: "100 % passando", tab: "carac", campo: "p76", aplica: adic, naoAplicaPor: nAp });
      H.geo();
    },
  });

  // ---------- exemplos ----------
  var X = FE.aceitacaoG1.ex;
  F.exemplos = [
    { nome: "Lote aceito — regularização em material do próprio subleito, 400 m (GC e compactação importados dos exemplos ME)", dados: function () {
      var d = { ident: { registro: "LOTE-RS-001", data: "2026-08-10", obra: "Obra A — BR-000", trecho: "Lote 1 — pista direita", local: "Est. 5 a 25",
          camada: "Regularização do subleito", origem: "Subleito (corte km 12)" },
        params: Object.assign({}, F.padrao, { estIni: "5", estFim: "25", largura: "12,00", flechaProj: "12", jornadas: "2" }), obs: "" };
      X.importar(F, d, "imp_comp", [["dnit-164-2013-me", 1], ["dnit-172-2016-me", 1]]);
      d.comp[0].est = "8"; d.comp[1].est = "18";
      d.umid = X.colunas([[6, 21.4], [11, 22.9], [15, 21.1], [19, 23.2], [23, 22.4]], "w", "Campo — Speedy");
      X.importar(F, d, "imp_gc", [["dner-me-036-94", 0]]);
      d.gc = d.gc.concat([{ est: "7", pos: "LE", reg: "DNER-ME 036 — furo digitado", gc: "101,8" }, { est: "21", pos: "eixo", reg: "DNER-ME 036 — furo digitado", gc: "100,9" },
        { est: "24", pos: "LD", reg: "DNER-ME 036 — furo digitado", gc: "101,5" }]);
      d.carac = [{ est: "8", reg: "CAR-101", p76: "100", p200: "68", ll: "45", ip: "18" }, { est: "18", reg: "CAR-102", p76: "100", p200: "64", ll: "43", ip: "16" }];
      d.geo = X.secoes(5, 21, function (i) { return { larg: 12.04 + X.onda(i, 0.04), flecha: 12.9 + X.onda(i, 0.6), dcx: X.onda(i, 1.6), dce: X.onda(i + 2, 1.9), dcd: X.onda(i + 4, 1.7) }; });
      d.obs = "Exemplo: compactação/ISC (DNIT 164/172) e 3 furos (DNER-ME 036) importados dos exemplos das fichas ME; demais valores digitados. Material do próprio subleito: requisitos de 5.1 não se aplicam.";
      return d;
    } },
    { nome: "Lote rejeitado — material de adição com expansão e IG acima, GC e cotas fora; caracterização incompleta", dados: function () {
      var d = { ident: { registro: "LOTE-RS-002", data: "2026-08-18", obra: "Obra B — BR-000", trecho: "Lote 2", local: "Est. 0 a 12", camada: "Regularização do subleito",
          origem: "Jazida 1 (adição)" },
        params: Object.assign({}, F.padrao, { estIni: "0", estFim: "12", largura: "10,00", material: "adicao", igSub: "8", flechaProj: "10" }), obs: "" };
      X.importar(F, d, "imp_comp", [["dnit-172-2016-me", 1]]);
      d.comp[0].est = "3";
      d.comp.push({ est: "9", reg: "ISC-0212 (digitado)", gs: "1,612", hot: "21,6", isc: "11", exp: "2,40" });
      d.umid = X.colunas([[1, 22.5], [4, 24.6], [8, 21.8]], "w", "Campo — Speedy");
      X.importar(F, d, "imp_gc", [["dner-me-036-94", 1]]);
      d.gc = d.gc.concat([{ est: "2", pos: "eixo", reg: "DNER-ME 036 — furo digitado", gc: "98,9" }, { est: "10", pos: "LE", reg: "DNER-ME 036 — furo digitado", gc: "100,4" }]);
      d.carac = [{ est: "3", reg: "CAR-201", p76: "100", p200: "72", ll: "52", ip: "24" }];
      d.geo = X.secoes(0, 13, function (i) { return { larg: 10.02 + X.onda(i, 0.05), flecha: 10.6 + X.onda(i, 0.7), dcx: i === 6 ? 4.3 : X.onda(i, 2.2), dce: X.onda(i + 1, 2.0), dcd: X.onda(i + 3, 2.1) }; });
      d.obs = "Exemplo de reprovação: expansão de 2,40 % na amostra da estaca 9, IG da jazida (15) acima do IG do subleito (8), GC com X̄ − k·s < 100 %, flecha abaixo do projeto na estaca 10 (não se tolera falta), cota +4,3 cm na estaca 6, umidade 2,8 p.p. acima da ótima na estaca 4; só 1 caracterização de 5 exigidas (área ≤ 4.000 m²).";
      return d;
    } },
  ];
})();
