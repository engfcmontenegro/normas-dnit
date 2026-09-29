/*
 * Ficha: DNER-PRO 231/94 — Inspeção visual de recipientes com tinta para demarcação viária.
 * Lote = recipientes de um só tipo, capacidade e conteúdo, com a mesma data de fabricação (3.1). Inspeção normal
 * (Tabela 1, amostragem simples ou dupla) ou rigorosa na reinspeção (Tabela 2, 4.4); amostra ≥ lote → inspecionar
 * todos (Nota 1); recipientes defeituosos pelos defeitos de 3.7 (enchimento de preferência por pesagem e dedução da
 * tara, 3.7.1) e parecer ACEITO / REJEITADO / 2ª AMOSTRAGEM (4.3); disposição dos recipientes da amostra (4.5).
 * Usa FE.inspecaoVisual, definido em dner-pro-132-94.js (carregado antes). Registra-se em window.FE.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt;

  var DEF = [["dEnch", "a) deficiência de enchimento — pesagem menos tara (3.7.1)"], ["dFech", "b) fechamento imperfeito — tampa, bujão, selo (3.7.2)"],
    ["dVaz", "c) vazamento (3.7.3)"], ["dAmas", "d) amassamento (3.7.4)"], ["dAlca", "e) falta ou insegurança da alça (3.7.5)"],
    ["dCons", "f) má conservação — ferrugem, sujeira, intempéries (3.7.6)"], ["dIdent", "g) identificação deficiente — inclusive na tampa ou no fundo (3.7.7)"],
    ["dOutros", "h) outros defeitos (3.7.8)"]];
  // conteúdo declarado em massa: informado, ou volume × massa específica
  function declarado(P) {
    var m = num(P.declKg); if (ok(m)) return m;
    var v = num(P.declL), rho = num(P.rho);
    return ok(v) && ok(rho) ? v * rho : NaN;
  }

  FE.FICHAS["dner-pro-231-94"] = FE.inspecaoVisual({
    titulo: "Tinta para demarcação viária — Inspeção visual dos recipientes",
    resumo: "Inspeção visual dos recipientes fechados de tinta no recebimento: amostragem simples ou dupla da Tabela 1 (inspeção normal) ou da Tabela 2 (inspeção rigorosa na reinspeção), contagem dos recipientes defeituosos pelos defeitos de 3.7 (enchimento por pesagem menos tara) e parecer ACEITO / REJEITADO / 2ª amostragem (4.3).",
    un: ["recipiente", "recipientes"], fem: false, kEnch: "dEnch",
    T1: [[2, 180, [7, 0, 1], null], [181, 500, [15, 0, 3], [30, 2, 3]], [501, 800, [25, 1, 4], [50, 3, 4]], [801, 1300, [35, 1, 5], [70, 4, 5]], [1301, 3200, [50, 2, 7], [100, 6, 7]]],
    T2: [[2, 65, [7, 0, 1], null], [66, 300, [10, 0, 1], null], [301, 800, [25, 1, 3], [50, 2, 3]], [801, 1300, [35, 1, 3], [70, 2, 3]], [1301, 3200, [50, 1, 6], [100, 5, 6]]],
    tabRef: { t1: "Tabela 1", t2: "Tabela 2" },
    secoes: { ac1: "4.3.1", ac2: "4.3.2", reinc: "Nota 2" },
    nota1: "Nota 1",
    textoLote: "Lote formado por recipientes de um só tipo, capacidade e conteúdo, com a mesma data de fabricação",
    textoRepos: "Recipientes defeituosos da amostra eliminados e substituídos por perfeitos, reincorporados ao lote com os perfeitos da amostra",
    defeitos: DEF,
    paramsExtra: [
      { k: "tinta", r: "Tinta (resina / produto) e cor", ph: "ex.: acrílica base solvente, branca" },
      { k: "recip", r: "Recipiente — tipo e capacidade (3.1)", ph: "ex.: balde de 18 L" },
      { k: "dataFab", r: "Data de fabricação do lote (3.1)", ph: "ex.: 03/2025" },
      { k: "partida", r: "Partida de fabricação / nota fiscal" },
      { k: "declKg", r: "Conteúdo declarado por recipiente, em massa (kg) — rótulo (3.7.1)", dica: "se o rótulo declara volume, deixe em branco e informe volume e massa específica" },
      { k: "declL", r: "Conteúdo declarado em volume (L) — opcional", se: function (d) { return !ok(num((d.params || {}).declKg)); } },
      { k: "rho", r: "Massa específica da tinta (kg/L) — opcional", se: function (d) { return !ok(num((d.params || {}).declKg)); } },
      { k: "tolEnch", r: "Tolerância de enchimento na pesagem (kg) — opcional", ph: "0", dica: "a norma considera defeito qualquer falta em relação ao declarado; use a tolerância da especificação/pedido, se houver" },
    ],
    padrao: {},
    pesagem: { titulo: "Pesagem dos recipientes — deficiência de enchimento (3.7.1)", secao: "3.7.1", declarado: declarado },
    extraAvisos: function (d, r, avisos) {
      var P = d.params || {};
      if (!ok(num(P.declKg)) && ok(num(P.declL)) && !ok(num(P.rho)) && r.nPes) avisos.push("Conteúdo declarado em volume: informe a massa específica da tinta para converter em massa (3.7.1).");
    },
    notas: "Inspeção visual conforme a DNER-PRO 231/94 (não exime a verificação dos demais requisitos do produto, 1.3). Tabela 1 — inspeção normal (lote em recipientes → amostra, nº de aceitação/rejeição): 2–180 simples 7 (0/1); 181–500 dupla 15 (0/3) + 30, cumulativo 45 (2/3); 501–800 dupla 25 (1/4) + 50 = 75 (3/4); 801–1 300 dupla 35 (1/5) + 70 = 105 (4/5); 1 301–3 200 dupla 50 (2/7) + 100 = 150 (6/7). Tabela 2 — inspeção rigorosa (reinspeção): 2–65 simples 7 (0/1); 66–300 simples 10 (0/1); 301–800 dupla 25 (1/3) + 50 = 75 (2/3); 801–1 300 dupla 35 (1/3) + 70 = 105 (2/3); 1 301–3 200 dupla 50 (1/6) + 100 = 150 (5/6). Amostra ≥ lote: inspecionar todos (Nota 1). Aceito se defeituosos ≤ Ac; rejeitado se ≥ Re; entre os dois, 2ª amostra (sem reincorporar a 1ª, Nota 2), com o total das duas comparado aos números da 2ª (4.3). Recipiente com um ou mais defeitos de 3.7 = defeituoso (4.2). Pesagem: falta = conteúdo declarado (massa, ou volume × massa específica) − (massa bruta − tara).",
    exemplos: [
      { nome: "Lote de 640 baldes — inspeção normal dupla, aceito na 2ª amostra", dados: function () {
        return { ident: { registro: "EX-PRO231-01", data: "2025-04-15", obra: "Obra A", origem: "Fornecedor A", camada: "Tinta acrílica branca" },
          params: { inspecao: "normal", lote: "640", tinta: "Acrílica base solvente, branca", recip: "Balde de 18 L", dataFab: "03/2025", partida: "P-0325-14",
            declKg: "", declL: "18", rho: "1,55", tolEnch: "0,10", chkLote: "sim", chkAcaso: "sim", chkReinc: "sim", chkRepos: "sim" },
          insp: [{ nInsp: "25", nDef: "2", dAmas: "1", dIdent: "1" }, { nInsp: "50", nDef: "1", dAlca: "1" }],
          pes: [{ id: "B-031", bruta: "29,05", tara: "1,10" }, { id: "B-207", bruta: "29,12", tara: "1,10" }, { id: "B-415", bruta: "28,98", tara: "1,10" }] };
      } },
      { nome: "Reinspeção de 90 latas — inspeção rigorosa com vazamento e falta de conteúdo (rejeitado)", dados: function () {
        return { ident: { registro: "EX-PRO231-02", data: "2025-09-03", obra: "Obra B", origem: "Fornecedor B", camada: "Tinta amarela" },
          params: { inspecao: "rigorosa", lote: "90", tinta: "Estireno-acrilato base solvente, amarela", recip: "Lata de 3,6 L", dataFab: "07/2025", partida: "L-77",
            declKg: "5,40", chkLote: "sim", chkAcaso: "sim", chkRecond: "nao" },
          insp: [{ nInsp: "10", nDef: "2", dVaz: "1", dFech: "1", dEnch: "1" }, {}],
          pes: [{ id: "L-04", bruta: "5,62", tara: "0,40" }, { id: "L-51", bruta: "5,83", tara: "0,40" }] };
      } },
    ],
  });
})();
