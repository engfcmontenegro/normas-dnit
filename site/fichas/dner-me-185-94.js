/*
 * Ficha: DNER-ME 185/94 — Tinta para demarcação viária — determinação da formação de nata.
 * Usa FE.sinalizacao.fichaQualitativa (definida em dner-me-018-94.js).
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao, C = S.COND;
  FE.FICHAS["dner-me-185-94"] = S.fichaQualitativa({
    titulo: "Tinta para demarcação viária — formação de nata",
    nomeResultado: "Formação de nata",
    resumo: "600 ml (3/4) de tinta homogeneizada em recipiente metálico de 800 ml, tampado e invertido alguns segundos, em repouso no escuro a 25 °C por 48 h; exame quanto à presença de nata (seção 5).",
    chave: "nata",
    bom: "Ausência de nata", mau: "Presença de nata",
    rotulo: "Recipiente",
    tabTitulo: "Recipientes ensaiados",
    dica: "uma coluna por recipiente; S = sim, N = não",
    condicoes: [
      { k: "cap", r: "Capacidade do recipiente — 800 ml (3 a)", u: "ml", cs: 0 },
      { k: "vol", r: "Volume de tinta — 3/4 da capacidade, 600 ml (4.1)", u: "ml", cs: 0 },
      { k: "inv", r: "Recipiente tampado e invertido alguns segundos (4.2) — S/N", texto: true, ph: "S/N" },
      C.temp("temp", "Temperatura do local", 25, 2, "4.3"),
      { k: "esc", r: "Local sem entrada de luz (4.3) — S/N", texto: true, ph: "S/N" },
      C.duracao("hrep", "Repouso sem movimentar", 48, "4.4"),
    ],
    observacoes: [
      { k: "nata", r: "Formação de nata na superfície (4.5)", curto: "nata" },
    ],
    linhasExtra: [{ calc: "frac", r: "Enchimento = volume / capacidade × 100 (3/4 = 75 %)", u: "%", casas: 1 }],
    calc: function (p, o, rot, avisos) {
      var v = FE.num(p.vol), c = FE.num(p.cap);
      o.frac = FE.ok(v) && FE.ok(c) && c > 0 ? v / c * 100 : NaN;
      if (FE.ok(o.frac) && Math.abs(o.frac - 75) > 2.5) avisos.push(rot + ": recipiente cheio a " + FE.fmt(o.frac, 1) + " % da capacidade; a norma prescreve 3/4 (4.1).");
      if (S.sn(p.inv) === false) avisos.push(rot + ": o recipiente deve ser tampado e invertido por alguns segundos (4.2).");
      if (S.sn(p.esc) === false) avisos.push(rot + ": o recipiente deve ficar em local sem entrada de luz (4.3).");
    },
    notas: "Recipiente cilíndrico metálico de 800 ml, com boa vedação e marca interna de 3/4 (600 ml). Sem formação de nata → ausência de nata; caso contrário → presença de nata (seção 5). Aviso de enchimento quando difere de 3/4 em mais de 2,5 pontos (critério adotado; a norma não fixa tolerância).",
    exemplos: [
      { nome: "Tinta acrílica base solvente, branca — ausência de nata", dados: function () {
        return { ident: { registro: "EX-TS-185-1", obra: "Obra A", origem: "Fornecedor A" },
          params: { tinta: "Acrílica base solvente", cor: "branca", lote: "0001", espec: "em368" },
          cps: [{ cap: "800", vol: "600", inv: "S", temp: "25", esc: "S", hrep: "48", nata: "N" }] };
      } },
      { nome: "Tinta amarela — película de nata após 48 h, reprovada", dados: function () {
        return { ident: { registro: "EX-TS-185-2", obra: "Obra B", origem: "Fornecedor B" },
          params: { tinta: "Estireno-acrilato base solvente", cor: "amarela", lote: "0417", espec: "em371" },
          cps: [{ cap: "800", vol: "600", inv: "S", temp: "26", esc: "S", hrep: "48", nata: "S" }] };
      } },
    ],
  });
})();
