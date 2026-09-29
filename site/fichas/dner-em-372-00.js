/*
 * Ficha: DNER-EM 372/00 — Material termoplástico para sinalização horizontal rodoviária — recebimento da partida.
 * Motor: FE.recebimentoMaterial (site/fichas/dner-em-276-00.js). Ensaios de origem (FE.sinalizacao2): DNER-ME 241 a
 * 249/94 e DNIT 069/2005-ME. Inspeção visual das embalagens: DNER-PRO 132/94 (citada na seção 6.1 da EM).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, R = FE.recebimentoMaterial, ok = FE.ok;

  var G4 = "Condições gerais (seção 4)", G5 = "Condições específicas (seção 5)";
  function num1(f) { return function (r) { var v = f(r); return ok(v) ? v : null; }; }
  function satisf(r) {
    if (r.satisf !== true && r.satisf !== false) return null;
    var o = (r.obs || [])[0];
    return { q: r.satisf, txt: o && o.rot ? o.rot.toLowerCase() : r.satisf ? "satisfatória" : "não satisfatória" };
  }
  var branco = function (P) { return P.cor !== "amarelo"; };
  var amarelo = function (P) { return P.cor === "amarelo"; };

  var REQ = [
    { id: "estab", grupo: G4, tipo: "qual", r: "Estabilidade ao aquecimento (até 4 ciclos de aquecimento e resfriamento; sem fumos tóxicos)", secao: "4.10",
      metodo: "DNER-ME 244/94", exig: "satisfatória", imp: { de: ["dner-me-244-94"], valor: satisf } },
    { id: "diesel", grupo: G4, tipo: "qual", r: "Resistência à ação do óleo diesel", secao: "4.6", metodo: "DNIT 069/2005-ME", exig: "satisfatória",
      imp: { de: ["dnit-069-2005-me"], valor: satisf } },
    { id: "pigNat", grupo: G4, tipo: "qual", r: "Natureza do pigmento — branco: TiO₂ rutilo (pureza ≥ 90 %); amarelo: cromato de chumbo ou sulfeto de cádmio", secao: "4.13",
      metodo: "certificado do fabricante", exig: "atende", bom: "atende", mau: "não atende", ph: "atende / não atende" },
    { id: "ligante", grupo: G5, tipo: "num", r: "Teor de agente ligante", secao: "5.1", metodo: "DNER-ME 248/94", u: "% em massa", casas: 1, casasLim: 0,
      lim: { min: 18, max: 24 }, imp: { de: ["dner-me-248-94"], valor: num1(function (r) { return r.teor; }) } },
    { id: "tio2", grupo: G5, tipo: "num", r: "Dióxido de titânio na composição — termoplástico branco", secao: "5.2", metodo: "DNER-ME 241/94", u: "% em massa", casas: 1, casasLim: 0,
      se: branco, lim: { min: 10, max: null }, imp: { de: ["dner-me-241-94"], valor: num1(function (r) { return r.tt; }) } },
    { id: "pbcro4", grupo: G5, tipo: "num", r: "Cromato de chumbo na mistura — termoplástico amarelo", secao: "5.2", metodo: "DNER-ME 242/94", u: "% em massa", casas: 2, casasLim: 0,
      se: function (P) { return amarelo(P) && P.pigAm !== "cds"; }, lim: { min: 2, max: null }, imp: { de: ["dner-me-242-94"], valor: num1(function (r) { return r.pt; }) } },
    { id: "cds", grupo: G5, tipo: "num", r: "Sulfeto de cádmio na mistura — termoplástico amarelo", secao: "5.2", metodo: "método não citado na EM", u: "% em massa", casas: 2, casasLim: 0,
      se: function (P) { return amarelo(P) && P.pigAm === "cds"; }, lim: { min: 1, max: null } },
    { id: "granular", grupo: G5, tipo: "num", r: "Partículas granulares, pigmentos e microesferas de vidro", secao: "5.3", metodo: "DNER-ME 248/94 (100 − ligante)", u: "% em massa",
      casas: 1, casasLim: 0, lim: { min: 76, max: 82 }, imp: { de: ["dner-me-248-94"], valor: num1(function (r) { return r.mineral; }) } },
    { id: "pa", grupo: G5, tipo: "num", r: "Ponto de amolecimento (anel e bola)", secao: "5.4", metodo: "DNER-ME 247/94", u: "°C", casas: 1, casasLim: 0,
      lim: { min: 80, max: 110 }, imp: { de: ["dner-me-247-94"], valor: num1(function (r) { return r.pa; }) } },
    { id: "dens", grupo: G5, tipo: "num", r: "Densidade relativa a 25 °C/25 °C", secao: "5.5", metodo: "DNER-ME 243/94", u: "", casas: 2,
      lim: { min: 1.85, max: 2.25 }, imp: { de: ["dner-me-243-94"], valor: num1(function (r) { return r.D; }) } },
    { id: "desliz", grupo: G5, tipo: "num", r: "Índice de deslizamento", secao: "5.6", metodo: "método não citado na EM", u: "%", casas: 1, casasLim: 0, lim: { min: null, max: 5 } },
    { id: "taber", grupo: G5, tipo: "num", r: "Desgaste no abrasômetro Taber (200 revoluções, 25 °C, rodas H-22 com 500 g)", secao: "5.7", metodo: "abrasômetro Taber",
      u: "g", casas: 2, casasLim: 1, lim: { min: null, max: 0.4 } },
    { id: "innermix", grupo: G5, tipo: "num", r: "Microesferas de vidro \"innermix\" (tipo I A) na composição", secao: "5.8 a", metodo: "DNER-ME 249/94", u: "% em massa",
      casas: 1, casasLim: 0, lim: { min: 18, max: 22 }, imp: { de: ["dner-me-249-94"], valor: num1(function (r) { return r.pt; }) } },
    { id: "cor", grupo: G5, tipo: "cor", r: "Cor (notação Munsell Highway)", secao: "5.11 · 5.12", metodo: "DNER-ME 245/94",
      exig: function (P) { return amarelo(P) ? "10 YR 7,5/14 e suas tolerâncias, exceto 2,0 Y 7,5/14 e 10 YR 6,5/14" : "N 9,5, tolerância N 9,0"; },
      ph: "ex.: N 9,5 / 10 YR 7,5/14 / conforme",
      imp: { de: ["dner-me-245-94"], valor: function (r) {
        if (r.conforme === true || r.conforme === false) return { q: r.conforme, txt: (r.notacao || "") + " — " + (r.conforme ? "conforme" : "não conforme") };
        return r.notacao ? { txt: r.notacao } : null;
      } } },
    { id: "luz", grupo: G5, tipo: "qual", r: "Resistência à luz", secao: "5.13", metodo: "DNER-ME 246/94", exig: "satisfatória", imp: { de: ["dner-me-246-94"], valor: satisf } },
  ];

  // cor digitada: mesma exigência das tintas (DNER-ME 183/94 avalia a notação)
  function avaliarCor(txt, P) {
    var t = String(txt || "");
    if (/n[ãa]o\s+(conforme|atende)/i.test(t)) return { q: false };
    if (/\b(conforme|atende)\b/i.test(t)) return { q: true };
    if (/^(s|sim|n|n[ãa]o)$/i.test(t.trim())) return { q: R.lerQual(t) };
    var F183 = FE.FICHAS["dner-me-183-94"];
    if (!F183) return {};
    try {
      var r = F183.calcular({ params: { cor: P.cor === "amarelo" ? "amarela" : "branca", espec: "em368" }, cps: [{ not: t.replace(/(\d+)\s+(YR|Y)\b/g, "$1$2"), tol: "" }] }).resultados;
      return r.conforme === true || r.conforme === false ? { q: r.conforme, motivo: (r.motivos || []).join("; ") }
        : { motivo: "notação \"" + t + "\" diferente da nominal: informe \"conforme\" ou \"não conforme\" (comparação com a escala — DNER-ME 245/94)" };
    } catch (e) { return {}; }
  }

  var F = FE.FICHAS["dner-em-372-00"] = R.criar({
    codigo: "DNER-EM 372/00",
    titulo: "Recebimento de material termoplástico para sinalização horizontal",
    resumo: "Recebimento da partida: inspeção visual das embalagens (DNER-PRO 132/94) e requisitos das seções 4 e 5 — estabilidade, óleo diesel, ligante, pigmento (TiO₂ / PbCrO₄ / CdS), partículas granulares, ponto de amolecimento, densidade, deslizamento, desgaste Taber, microesferas innermix, cor e resistência à luz —, com importação das fichas DNER-ME e parecer (seção 7).",
    nomeMaterial: function (P) { return "Material termoplástico " + (P.cor === "amarelo" ? "amarelo" : "branco"); },
    unidCompra: "kg", dicaQtd: "a unidade de compra é o quilograma (5.14)",
    rotuloValidade: "Máxima temperatura de aquecimento (°C) — da embalagem", phValidade: "ex.: 200",
    params: [
      { k: "cor", r: "Cor do material", tipo: "select", recarrega: true, opcoes: [["branco", "Branco"], ["amarelo", "Amarelo"]], dica: "define o pigmento exigido (5.2) e a cor (5.11 / 5.12)" },
      { k: "pigAm", r: "Pigmento do termoplástico amarelo (4.13)", tipo: "select", recarrega: true, opcoes: [["cromato", "Cromato de chumbo"], ["cds", "Sulfeto de cádmio"]],
        se: function (d) { return ((d.params || {}).cor) === "amarelo"; } },
      { k: "sistema", r: "Sistema de aplicação previsto (5.10)", tipo: "select", opcoes: [["extrusao", "Extrusão — espessura 3 mm"], ["spray", "Spray — espessura 1,5 mm"]],
        dica: "informativo: a espessura é verificada na execução" },
    ],
    padrao: { cor: "branco", pigAm: "cromato", sistema: "extrusao" },
    inspecao: { plano: "pro132", secao: "6.1 · 7.1", lote: "embalagens (sacos) com a mesma data de fabricação" },
    secRejInsp: "7.1", secAceita: "7.2", secRejeita: "7.2", dispensa: "6.2", secInsp: "6",
    conferirOrigem: function (e, P, notas) {
      var c = ((e.dados || {}).params || {}).cor;
      if (c && P.cor && c !== P.cor) notas.push(A.importacao.rotulo(e) + ": ensaio de material " + c + "; esta partida é de material " + P.cor + " — confira.");
    },
    sobrepor: function (fid) { return /^dner-me-24\d-94$|^dnit-069-2005-me$/.test(fid) ? { espec: "372" } : null; },
    avaliarCor: avaliarCor,
    requisitos: REQ,
    notas: "Critérios da DNER-EM 372/00: condições gerais (4.6 óleo diesel; 4.10 estabilidade em até 4 ciclos; 4.13 natureza do pigmento) e específicas: ligante 18 a 24 % (5.1); TiO₂ ≥ 10 % (branco), PbCrO₄ ≥ 2 % ou CdS ≥ 1 % (amarelo) (5.2); partículas granulares + pigmentos + microesferas 76 a 82 % (5.3); ponto de amolecimento 80 a 110 °C (5.4); densidade 1,85 a 2,25 (5.5); índice de deslizamento ≤ 5 % (5.6); desgaste Taber ≤ 0,4 g (5.7); microesferas innermix 18 a 22 % (5.8 a); cor N 9,5 (tol. N 9,0) ou 10 YR 7,5/14 (5.11/5.12); resistência à luz satisfatória (5.13). " +
      "Inspeção visual pela DNER-PRO 132/94 — rejeição total ou parcial à vista da inspeção (7.1). O material que atende a especificação é aceito; caso contrário, rejeitado (7.2). Ensaios podem ser dispensados a critério do órgão (6.2). " +
      "A EM não cita amostragem para laboratório nem métodos para deslizamento, desgaste Taber e CdS. Teor 5.3 importado como 100 − ligante (DNER-ME 248/94).",
    exemplos: [
      { nome: "Termoplástico amarelo — partida aceita (ensaios importados das fichas DNER-ME)", dados: function () {
        var d = { ident: { registro: "REC-TP-2026-01", data: "2026-03-25", obra: "Obra A — sinalização horizontal", origem: "Fornecedor A", camada: "Termoplástico amarelo (extrusão)" },
          params: { cor: "amarelo", pigAm: "cromato", sistema: "extrusao", fabricante: "Fornecedor A", produto: "Termoplástico amarelo", partida: "TP-2603", dataFab: "03/03/2026",
            validade: "200", nf: "010557", quantidade: "6000", nRec: "240", inspTipo: "normal" },
          insp: [{ n: "4", def: "0" }, {}] };
        return R.exemplo(F, d, [["dner-me-248-94", 0], ["dner-me-242-94", 0], ["dner-me-247-94", 0], ["dner-me-243-94", 0], ["dner-me-249-94", 0],
          ["dner-me-245-94", 0], ["dner-me-246-94", 0]],
          { estab: "satisfatória", diesel: "satisfatória", pigNat: "atende", desliz: "2,8", taber: "0,21" });
      } },
      { nome: "Termoplástico branco — partida rejeitada (ligante, TiO₂, granulares, amolecimento, densidade, desgaste Taber, microesferas, cor e luz)", dados: function () {
        var d = { ident: { registro: "REC-TP-2026-02", data: "2026-06-09", obra: "Obra B — sinalização horizontal", origem: "Fornecedor B", camada: "Termoplástico branco" },
          params: { cor: "branco", sistema: "spray", fabricante: "Fornecedor B", produto: "Termoplástico branco", partida: "TP-0518", dataFab: "18/05/2026", nf: "078812",
            quantidade: "3000", nRec: "120", inspTipo: "normal" },
          insp: [{ n: "2", def: "0" }, {}] };
        return R.exemplo(F, d, [["dner-me-248-94", 1], ["dner-me-241-94", 1], ["dner-me-247-94", 1], ["dner-me-243-94", 1], ["dner-me-249-94", 1],
          ["dner-me-245-94", 1], ["dner-me-246-94", 1], ["dner-me-244-94", 0]],
          { diesel: "satisfatória", pigNat: "atende", desliz: "4,1", taber: "0,52" });
      } },
    ],
  });
})();
