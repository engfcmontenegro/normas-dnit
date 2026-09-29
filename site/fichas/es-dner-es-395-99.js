/*
 * Ficha de ACEITAÇÃO DE LOTE: DNER-ES 395/99 — Pintura de ligação com asfalto polímero.
 * Motor comum do grupo: FE.aceitacaoG4a (site/fichas/es-dnit-144-2014-es.js).
 *   4.1    sem chuva e temperatura ≥ 10 °C · 5.1.1 emulsão RR-1C modificada por polímero SBR ou SBS
 *   5.1.2  taxa residual recomendada 0,3 a 0,4 l/m² · 5.3.3 temperatura de aplicação ≤ 60 °C · 5.3.4 tolerância da taxa da emulsão
 *          diluída ± 0,2 l/m²
 *   7.1.1  todo carregamento: resíduo por evaporação, peneiramento, carga da partícula, recuperação elástica do resíduo; 100 t: sedimentação
 *   7.2.2  taxa por bandejas (7.2.2.1); até 4.000 m² → 5 determinações (7.2.2.2); 4.000 a 20.000 m² → n pela tabela de amostragem
 *          variável (7.2.2.3); 9.2 recomenda α = 0,10 (n = 12) e determinações a cada 700 m²
 *   7.3    aceitação: material (7.3.1), temperatura (7.3.2), taxa X̄ − k·s ≥ mín. e X̄ + k·s ≤ máx. (7.3.3.1); rejeitados → corrigidos,
 *          complementados ou refeitos (7.3.3.2)
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG4a, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  if (!G) { if (window.console) console.error("es-dner-es-395-99.js: carregue antes site/fichas/es-dnit-144-2014-es.js (motor FE.aceitacaoG4a)."); return; }
  var V = G.verif, B = G.bandejas;
  function plano(area) { return Math.max(12, Math.ceil(area / 700 - 1e-9)); }

  G.criar({
    id: "dner-es-395-99", codigo: "DNER-ES 395/99",
    titulo: "Pintura de ligação com asfalto polímero — aceitação de lote",
    resumo: "Reúne as taxas da emulsão diluída por bandeja (importadas da ficha de taxa ou digitadas), a taxa residual, o recebimento da emulsão RR-1C modificada por polímero, as temperaturas (≤ 60 °C) e as verificações; " +
      "aplica a aceitação estatística de 7.3.3 (projeto ± 0,2 l/m²) com a tabela de amostragem variável de 7.2.2.3.",
    refs: { reprova: "7.3.3.1", atende: "7.3.3.1", corrige: "7.3.3.2", regra: "7.3.3.1", tabela: "tabela de amostragem variável (7.2.2.3)" },
    secConf: "7.3.3", secPlano: "7.2.2.2 e 7.2.2.3", secLig: "5.1.1", secTaxa: "7.2.2.1", secTemp: "7.2.1 / 7.3.2", secReceb: "7.1.1 a", secReceb100: "7.1.1 b",
    tMaxFixo: 60, secTMax: "5.3.3",
    textoRejeicao: "Há critério não conforme (7.3): os serviços rejeitados devem ser corrigidos, complementados ou refeitos (7.3.3.2; 9.1).",
    servicos: ["395"],
    ligantes: [
      { id: "rr1cpol", nome: "Emulsão RR-1C modificada por polímero SBR ou SBS", classes: ["RR-1C"], taxaLig: ["emuPol395"],
        aviso: "Emulsão modificada por polímero: a ficha de recebimento DNIT 165 confere os limites da RR-1C convencional — confira também a especificação da emulsão modificada e a recuperação elástica do resíduo (7.1.1 a, DNER-ME 382).",
        ens: [["residuo", "resíduo por evaporação"], ["pen084", "peneiramento"], ["carga", "carga da partícula"]] },
    ],
    recebFichas: ["dnit-165-2013-em"], nomeResiduo: "resíduo por evaporação", recElastica: "7.1.1 a",
    residual: { rec: [0.3, 0.4], sec: "5.1.2" },
    nomeLig: function () { return "Pintura de ligação"; },
    nomeTaxaLig: function () { return "taxa da emulsão diluída"; },
    limLig: function (P) {
      var pj = num(P.projL), o = { sec: "5.3.4 / 7.3.3", min: ok(pj) ? pj - 0.2 : NaN, max: ok(pj) ? pj + 0.2 : NaN };
      o.txt = ok(pj) ? fmt(pj - 0.2, 2) + " a " + fmt(pj + 0.2, 2) + " l/m² (projeto " + fmt(pj, 2) + " ± 0,2)" : "projeto ± 0,2 l/m²";
      return o;
    },
    params: [
      { k: "projL", r: "Taxa de projeto da emulsão diluída em água (l/m²)", ph: "ex.: 0,90", dica: "tolerância ± 0,2 l/m² (5.3.4); taxa residual recomendada 0,3 a 0,4 l/m² (5.1.2)" },
    ],
    padrao: { ligante: "rr1cpol", nCarreg: "1", nAplic: "1" },
    freqTaxa: { tipo: "4000", sec: "7.2.2.2", secPlano: "7.2.2.3", plano: plano, phPlano: "12", txtPlano: "adotado n ≥ 12 (9.2: α = 0,10) e 1 a cada 700 m² (9.2)" },
    verif: [
      { id: "clima", texto: "Condições climáticas: sem chuva e temperatura ≥ 10 °C", secao: "4.1", exigido: "atendidas em todas as aplicações" },
      { id: "e100", texto: "Sedimentação a cada 100 t", secao: "7.1.1 b", exigido: "1 a cada 100 t", metodo: "DNER-ME 006",
        freq: function (P) { var t = num(P.ton); return { exigido: ok(t) ? A.nMin(t, 100) : NaN, regra: "1 a cada 100 t" }; } },
      { id: "exec", texto: "Execução: superfície varrida, base de solo-cimento/concreto magro umedecida, pista inteira no mesmo turno, faixas de papel nas juntas, falhas corrigidas", secao: "5.3", exigido: "conforme 5.3" },
    ],
    notas: "Taxa por bandeja (7.2.2.1): taxa da emulsão diluída (e do ligante residual) calculada na ficha de taxa por bandeja. Aceitação (7.3.3.1): taxa de projeto ± 0,2 l/m² (5.3.4) com X̄ − k·s ≥ mínimo e X̄ + k·s ≤ máximo; " +
      "a taxa residual de 0,3 a 0,4 l/m² (5.1.2) é recomendação — fora dela, ressalva. Temperatura ≤ 60 °C (5.3.3) e no intervalo de projeto (7.3.2). " +
      "Frequência: até 4.000 m² — 5 determinações (7.2.2.2); de 4.000 a 20.000 m² — n da tabela de amostragem variável (7.2.2.3), adotado n ≥ 12 (α = 0,10, recomendado em 9.2) e no mínimo 1 a cada 700 m² (9.2). " +
      "Recebimento (7.1.1 a): resíduo por evaporação, peneiramento, carga da partícula e recuperação elástica do resíduo (DNER-ME 382) em todo carregamento.",
    exemplos: [
      { nome: "Lote aceito — pintura de ligação com RR-1C-polímero, 7 bandejas em 3.000 m²",
        dados: function () {
          var t = [[301, "LE", 0.88, 0.31], [303, "eixo", 0.95, 0.33], [305, "LD", 0.91, 0.32], [308, "LE", 0.86, 0.30], [311, "eixo", 0.97, 0.34], [314, "LD", 0.90, 0.32], [318, "eixo", 0.93, 0.33]];
          var lig = B(t.map(function (x) { return [x[0], x[1], x[2]]; }));
          lig.forEach(function (c, i) { c.res = fmt(t[i][3], 2); });
          return { ident: { registro: "LOTE-PLP-001", data: "2026-05-19", obra: "Obra A — BR-000", trecho: "Faixa 1", local: "Est. 300 a 320", camada: "Pintura de ligação — RR-1C-polímero" },
            params: { estIni: "300", estFim: "320", largura: "7,50", projL: "0,90", tMin: "30", tMax: "60", nAplic: "2", nCarreg: "1", ton: "4" },
            lig1: lig,
            rec: [{ reg: "REC-RR1CP-01 · DNIT 165 (digitado)", classe: "RR-1C-E", sit: "aprovado", res: "63,8", rec: "72" }],
            temp: [{ est: "300", t: "48" }, { est: "310", t: "51" }], verif: V(["S", ["S", 1, 0], "S"]),
            obs: "Emulsão diluída 1:1; taxas calculadas na ficha de taxa por bandeja com o resíduo do carregamento." };
        } },
      { nome: "Lote rejeitado — 8.400 m² com 8 bandejas, temperatura acima de 60 °C, residual baixo e carregamento reprovado", importar: [["impReceb", [["dnit-165-2013-em", 0]]]],
        dados: function () {
          var t = [[401, "LE", 0.72, 0.24], [405, "eixo", 0.81, 0.27], [409, "LD", 0.69, 0.23], [413, "LE", 0.78, 0.26], [418, "eixo", 0.74, 0.25], [423, "LD", 0.83, 0.28], [428, "LE", 0.70, 0.23], [433, "eixo", 0.77, 0.26]];
          var lig = B(t.map(function (x) { return [x[0], x[1], x[2]]; }));
          lig.forEach(function (c, i) { c.res = fmt(t[i][3], 2); });
          return { ident: { registro: "LOTE-PLP-002", data: "2026-06-03", obra: "Obra B", trecho: "Lote 4", local: "Est. 400 a 435", camada: "Pintura de ligação — RR-1C-polímero" },
            params: { estIni: "400", estFim: "435", largura: "12,00", projL: "0,90", tMin: "30", tMax: "60", nAplic: "3", nCarreg: "1", ton: "9" },
            lig1: lig, temp: [{ est: "400", t: "58" }, { est: "415", t: "66" }, { est: "430", t: "55" }], verif: V(["S", "", ["N", 1, 1, "sobreposição nas juntas transversais"]]),
            obs: "Exemplo de reprovação." };
        } },
    ],
  });
})();
