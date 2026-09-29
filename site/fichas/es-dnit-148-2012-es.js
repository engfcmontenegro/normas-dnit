/*
 * Ficha de ACEITAÇÃO DE LOTE: DNIT 148/2012-ES — Tratamento superficial triplo (TST).
 * Motor comum do grupo: FE.aceitacaoG4a.tratamento (site/fichas/es-dnit-144-2014-es.js).
 *   5.1.1 CAP-150/200 ou RR-2C (emulsão só se empregada em todas as camadas) · 5.1.3 agregado: LA ≤ 40 %, índice de forma > 0,5,
 *   durabilidade < 12 %, Tabela 1: faixas A, B e C (1ª, 2ª e 3ª camadas) · 5.1.4 Tabela 2: 1,0–1,5 / 0,6–0,9 / 0,4–0,6 l/m² e
 *   20–25 / 10–12 / 5–7 kg/m² · 7.2.2 taxas por bandeja em cada camada: ± 0,2 l/m² e ± 1,5 kg/m²; mín. 5 por segmento < 3.000 m²
 *   7.3 réguas ≤ 0,5 cm, alinhamento ± 5 cm · 7.5 X̄ ± k·s (Tabela 1 da DNER-PRO 277/97)
 */
(function () {
  "use strict";
  var FE = window.FE, G = FE.aceitacaoG4a, fmt = FE.fmt;
  if (!G) { if (window.console) console.error("es-dnit-148-2012-es.js: carregue antes site/fichas/es-dnit-144-2014-es.js (motor FE.aceitacaoG4a)."); return; }
  var V = G.verif, B = G.bandejas;
  function geo(ini, lista) {
    return lista.map(function (x, i) { return { est: String(ini + i), r12: fmt(x[0], 1), r3: fmt(x[1], 1), ae: fmt(x[2], 0), ale: fmt(x[3], 0), ald: fmt(x[4], 0) }; });
  }
  // bandejas de uma camada a partir dos valores (estacas e posições alternadas)
  function cam(ini, vals, casas) { return B(vals.map(function (v, i) { return [ini + 2 * i, ["LE", "eixo", "LD"][i % 3], v]; }), casas); }

  G.tratamento({
    id: "dnit-148-2012-es", codigo: "DNIT 148/2012-ES", nome: "triplo", nc: 3, ligUnico: "5.1.1",
    rec: [[1.0, 1.5, 20, 25], [0.6, 0.9, 10, 12], [0.4, 0.6, 5, 7]],
    faixas: [["dnit-148-2012-es-A"], ["dnit-148-2012-es-B"], ["dnit-148-2012-es-C"]],
    resumo: "Reúne, para as três camadas, as taxas de ligante e de agregado por bandeja (importadas da ficha de taxa ou digitadas), o recebimento do ligante, a granulometria e a qualidade do agregado, " +
      "as temperaturas e o controle do produto; aplica 7.5 (projeto ± 0,2 l/m² e ± 1,5 kg/m² em cada camada) e as frequências.",
    exemplos: [
      { nome: "Lote aceito — TST com CAP-150/200, três camadas, 2.000 m²", importar: [["impAgq", [["dnit-451-2024-me", 1], ["dnit-424-2020-me", 0], ["dnit-452-2024-me", 1]]]],
        dados: function () {
          return { ident: { registro: "LOTE-TST-001", data: "2026-07-08", obra: "Obra A — BR-000", trecho: "Pista direita", local: "Est. 400 a 410", camada: "TST — CAP-150/200", origem: "Pedreira X" },
            params: { estIni: "400", estFim: "410", largura: "10,00", ligante: "cap", projL1: "1,20", projA1: "22", projL2: "0,75", projA2: "11", projL3: "0,50", projA3: "6",
              faixa1: "dnit-148-2012-es-A", faixa2: "dnit-148-2012-es-B", faixa3: "dnit-148-2012-es-C", tMin: "150", tMax: "175", nAplic: "3", nCarreg: "1", ton: "5", jornadas: "1", volAgr: "70" },
            lig1: cam(400, [1.18, 1.25, 1.16, 1.22, 1.27, 1.19]), agr1: cam(400, [21.6, 22.8, 22.1, 21.4, 22.5, 22.9], 1),
            lig2: cam(400, [0.74, 0.79, 0.71, 0.77, 0.73, 0.76]), agr2: cam(400, [11.3, 10.8, 11.6, 10.9, 11.2, 11.0], 1),
            lig3: cam(400, [0.49, 0.53, 0.47, 0.51, 0.52, 0.48]), agr3: cam(400, [6.2, 5.8, 6.4, 5.9, 6.1, 6.3], 1),
            rec: [{ reg: "REC-CAP-09 · DNIT 095 (digitado)", classe: "150/200", sit: "aprovado" }],
            temp: [{ est: "400", t: "160" }, { est: "404", t: "163" }, { est: "408", t: "161" }],
            gran1: [{ est: "08/07", reg: "GR-401", p38_1: "100", p25_4: "94,1", p19_1: "36,0", p12_7: "7,2", p9_5: "2,1", p0_074: "0,7" }],
            gran2: [{ est: "09/07", reg: "GR-402", p12_7: "100", p9_5: "91,5", p4_8: "19,8", p2: "4,6", p0_074: "0,9" }],
            gran3: [{ est: "10/07", reg: "GR-403", p9_5: "100", p4_8: "91,8", p2: "26,3", p0_074: "1,2" }],
            proj: [{ p38_1: "100", p25_4: "95", p19_1: "37", p12_7: "7", p9_5: "2", p0_074: "0,5" }, { p12_7: "100", p9_5: "92", p4_8: "20", p2: "5", p0_074: "1" },
              { p9_5: "100", p4_8: "92", p2: "25", p0_074: "1" }],
            geo: geo(400, [[0.2, 0.3, 1, -1, 2], [0.1, 0.2, 0, 2, -1], [0.3, 0.4, -1, 1, 0], [0.2, 0.3, 2, -2, 1], [0.2, 0.3, 0, 1, -2], [0.1, 0.4, 1, 0, 1],
              [0.3, 0.2, -2, 1, 0], [0.2, 0.3, 1, -1, 2], [0.2, 0.4, 0, 2, -1], [0.1, 0.3, -1, 0, 1], [0.2, 0.2, 1, 1, 0]]),
            verif: V(["S", "S", ["S", 1, 0], ["S", 1, 0], "S"]),
            obs: "Adesividade satisfatória só com 0,5 % de melhorador (exemplo DNIT 452): melhorador incorporado ao CAP no canteiro e verificado (7.1.3)." };
        },
        depois: function (d) { d.agq.push({ reg: "DUR-12 · DNER-ME 089 (digitado)", dur: "6,1" }); } },
      { nome: "Lote rejeitado — 3ª camada com ligante baixo, sem bandejas de agregado da 3ª camada e alinhamento fora",
        dados: function () {
          return { ident: { registro: "LOTE-TST-002", data: "2026-07-20", obra: "Obra B", trecho: "Lote 5", local: "Est. 500 a 510", camada: "TST — CAP-150/200" },
            params: { estIni: "500", estFim: "510", largura: "7,00", ligante: "cap", projL1: "1,20", projA1: "22", projL2: "0,75", projA2: "11", projL3: "0,60", projA3: "6",
              faixa1: "dnit-148-2012-es-A", faixa2: "dnit-148-2012-es-B", faixa3: "dnit-148-2012-es-C", tMin: "150", tMax: "175", nAplic: "3", nCarreg: "1", ton: "2", jornadas: "1" },
            lig1: cam(500, [1.21, 1.17, 1.24, 1.19, 1.22]), agr1: cam(500, [22.4, 21.9, 22.7, 22.2, 21.5], 1),
            lig2: cam(500, [0.76, 0.72, 0.79, 0.74, 0.75]), agr2: cam(500, [11.1, 10.7, 11.4, 11.0, 10.9], 1),
            lig3: cam(500, [0.38, 0.42, 0.35, 0.44, 0.40]), agr3: [{}],
            rec: [{ reg: "REC-CAP-11 · DNIT 095 (digitado)", classe: "CAP 150/200", sit: "aprovado" }],
            temp: [{ est: "500", t: "158" }, { est: "503", t: "162" }, { est: "505", t: "160" }],
            agq: [{ reg: "AG-52 (digitado)", la: "34", fi: "0,61", dur: "7,2", ades: "satisfatória" }],
            gran1: [{ est: "20/07", reg: "GR-501", p38_1: "100", p25_4: "93", p19_1: "40", p12_7: "9", p9_5: "3", p0_074: "0,8" }],
            geo: geo(500, [[0.2, 0.3, 4, 6, 3], [0.3, 0.4, 5, 7, 2], [0.2, 0.3, 3, 6, 4], [0.1, 0.2, 4, 5, 6], [0.2, 0.4, 5, 3, 4], [0.3, 0.3, 6, 4, 5]]),
            verif: V(["S", "S", ["S", 1, 0], "", "S"]),
            obs: "Exemplo: taxa de ligante da 3ª aplicação abaixo do projeto (X̄ − k·s < 0,30 l/m²), bandejas de agregado da 3ª camada não coletadas, granulometria da 2ª e 3ª camadas não ensaiada e eixo deslocado." };
        } },
    ],
  });
})();
