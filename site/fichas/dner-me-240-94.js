/*
 * Ficha: DNER-ME 240/94 — Tinta para demarcação viária — determinação qualitativa de breu.
 * Usa FE.sinalizacao.fichaQualitativa (definida em dner-me-018-94.js).
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao;
  FE.FICHAS["dner-me-240-94"] = S.fichaQualitativa({
    titulo: "Tinta para demarcação viária — determinação qualitativa de breu",
    nomeResultado: "Breu e derivados",
    resumo: "Ensaios de Lieberman-Storch (anidrido acético + ácido sulfúrico na placa de toque) e Halphen-Hicks (solução em fenol exposta a vapores de bromo): coloração violeta indica presença de breu (seção 7).",
    chave: "breu",
    bom: "Ausência", mau: "Presença",
    rotulo: "Ensaio",
    nomes: ["Lieberman-Storch", "Halphen-Hicks"],
    tabTitulo: "Procedimentos (seção 6)",
    dica: "coluna 1 = Lieberman-Storch (6.1); coluna 2 = Halphen-Hicks (6.2). Deixe em branco o procedimento não realizado. S = sim, N = não",
    condicoes: [
      { k: "massa", r: "Massa de amostra — Lieberman-Storch: 0,1 a 0,2 g (6.1.1)", curto: "massa de amostra", u: "g", cs: 2 },
      { k: "reag", r: "Reagente — anidrido acético 15 ml (6.1.1) / fenol 1 a 2 ml (6.2.1)", u: "ml", cs: 1 },
    ],
    observacoes: [
      { k: "viol", r: "Coloração violeta (imediata no L-S; na parte plana da placa no H-H) (7.1.1, 7.2)", curto: "coloração violeta" },
      { k: "rosa", r: "Coloração rosa ou marrom — ignorada (7.1.2)", curto: "rosa/marrom (ignorada)", defeito: false },
      { k: "ctrl", r: "Prova de comparação com breu adicionado ficou violeta (7.1.3, opcional)", curto: "prova de comparação", defeito: false },
    ],
    calc: function (p, o, rot, avisos) {
      var m = FE.num(p.massa);
      if (FE.ok(m) && rot === "Lieberman-Storch" && (m < 0.1 || m > 0.2)) avisos.push("Lieberman-Storch: massa de amostra de " + FE.fmt(m, 2) + " g fora de 0,1 a 0,2 g (6.1.1).");
      if (S.sn(p.ctrl) === false) avisos.push(rot + ": a prova de comparação (tinta com breu adicionado) não ficou violeta — reagentes suspeitos; repita o ensaio.");
    },
    notas: "Lieberman-Storch: violeta imediata indica breu; coloração rosa ou marrom deve ser ignorada; uma amostra com breu adicionado pode ser ensaiada para comparação (7.1). Halphen-Hicks: coloração violeta, melhor observada na parte plana da placa, indica breu (7.2). Presença em qualquer dos procedimentos → presença de breu.",
    exemplos: [
      { nome: "Tinta acrílica base solvente, branca — ausência de breu nos dois ensaios", dados: function () {
        return { ident: { registro: "EX-TS-240-1", obra: "Obra A", origem: "Fornecedor A" },
          params: { tinta: "Acrílica base solvente", cor: "branca", lote: "0001", espec: "em368" },
          cps: [{ massa: "0,15", reag: "15", viol: "N", rosa: "S", ctrl: "S" }, { reag: "2", viol: "N", rosa: "N" }] };
      } },
      { nome: "Tinta amarela — violeta imediata (Lieberman-Storch), presença de breu", dados: function () {
        return { ident: { registro: "EX-TS-240-2", obra: "Obra B", origem: "Fornecedor B" },
          params: { tinta: "Estireno-acrilato base solvente", cor: "amarela", lote: "0417", espec: "em371" },
          cps: [{ massa: "0,18", reag: "15", viol: "S", rosa: "N" }, { reag: "1,5", viol: "S", rosa: "N" }] };
      } },
    ],
  });
})();
