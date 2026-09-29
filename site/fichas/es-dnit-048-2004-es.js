/*
 * Ficha de ES: DNIT 048/2004-ES — Pavimento rígido com equipamento de fôrma-trilho — aceitação do trecho de inspeção.
 * Critérios idênticos aos da DNIT 047/2004-ES na seção 7 (resistência 7.4.1 com a Tabela 1 de Student, geometria 7.3.1,
 * acabamento 7.3.2); diferenças na execução (5.3.3 fôrmas com apoio contínuo; 5.3.4 central gravimétrica).
 * Usa FE.aceitacaoG6 (definida em es-dnit-047-2004-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG6;
  var ID = "dnit-048-2004-es";
  G.fichaConcreto({
    id: ID, codigo: "DNIT 048/2004-ES", variante: "048",
    titulo: "Pavimento rígido com fôrma-trilho — aceitação do trecho",
    resumo: "Trecho de inspeção de até 2.500 m²: resistência característica estimada (fctM,est ou fck,est = f̄ − k·s, Tabela 1 de Student), abatimento de cada amassada, " +
      "coeficiente de recalque do subleito, largura e espessura (7.3.1), nota de acabamento DNIT 063-PRO (7.3.2), insumos e verificações de execução da seção 5.",
    exemplos: [
      { nome: "Trecho aceito com ressalva — compressão (fck 25 MPa), exemplares importados da DNER-ME 091 + digitados; régua de 3 m corrigida", dados: function () {
        var F = FE.FICHAS[ID];
        var d = { ident: { registro: "LOTE-PR-011", data: "2026-07-10", obra: "Obra C — BR-000", trecho: "Trecho de inspeção 4", local: "Est. 300 a 310", camada: "Placas de concreto — fôrma-trilho" },
          params: Object.assign({}, F.padrao, { estIni: "300", estFim: "310", largura: "7,50", largProj: "7,50", espProj: "20", resTipo: "compressao", fck: "25", amassadas: "7",
            recalque: "homog", kProj: "45", insumos: "previo", insumosReg: "Registro de aprovação de insumos RI-07 (água, selante)" }),
          verificacoes: [], res: [{}], abat: [{}], krec: [{}], nota063: [{}] };
        A.exemplos.importar(F.params, d, "impRes", [["dner-me-091-98", 1]]);
        d.res = d.res.concat([[26.4, 27.9], [29.3, 28.2], [27.1, 26.5], [28.8, 30.1], [26.9, 27.7]].map(function (x, i) {
          return { est: "P-4" + (10 + i * 7), reg: "CP-C-" + (21 + i), idade: "28", cp1: A.nstr(x[0], 1), cp2: A.nstr(x[1], 1) }; }));
        d.abat = [74, 66, 71, 78, 69, 72, 70].map(function (v, i) { return { reg: "caminhão " + (i + 1), v: String(v) }; });
        d.krec = [{ est: "302", pos: "eixo", reg: "PC-0501", v: "52" }, { est: "308", pos: "BE", reg: "PC-0502", v: "48" }];
        d.verificacoes = G.verifEx(F, { regua: { real: "20", nc: "1", obs: "depressão de 7 mm na placa P-431, corrigida com concreto fresco" } });
        d.nota063 = [{ reg: "Laudo DNIT 063-PRO nº 21", v: "65" }];
        d.geo = G.exSecoes(300, [[7.52, 20.3, 20.1, 20.4], [7.50, 20.2, 20.0, 20.5], [7.51, 20.4, 20.2, 20.3], [7.53, 20.1, 20.0, 20.2], [7.49, 20.5, 20.3, 20.6],
          [7.50, 20.2, 20.1, 20.4], [7.52, 20.3, 20.2, 20.5], [7.51, 20.0, 20.1, 20.3], [7.50, 20.4, 20.2, 20.2], [7.52, 20.3, 20.4, 20.5], [7.51, 20.2, 20.1, 20.3]]);
        d.obs = "Solo de fundação homogêneo: provas de carga a cada 200 m (5.3.1). Exemplares aos 7 dias do registro importado ficam fora da estimativa (idade de controle 28 dias).";
        return d;
      } },
      { nome: "Trecho pendente — sem aceitação automática (testemunhos não extraídos); abatimento fora em 3 caminhões; lote > 2.500 m²", dados: function () {
        var F = FE.FICHAS[ID];
        var d = { ident: { registro: "LOTE-PR-012", data: "2026-07-24", obra: "Obra C — BR-000", trecho: "Trecho de inspeção 5", local: "Est. 310 a 330", camada: "Placas de concreto — fôrma-trilho" },
          params: Object.assign({}, F.padrao, { estIni: "310", estFim: "330", largura: "7,50", largProj: "7,50", espProj: "20", fctmk: "4,5", amassadas: "12", recalque: "nao",
            insumos: "previo", insumosReg: "RI-07" }),
          verificacoes: [], res: [{}], abat: [{}], nota063: [{}] };
        d.res = [[4.61, 4.52], [4.38, 4.50], [4.85, 4.70], [4.33, 4.41], [4.66, 4.88], [4.52, 4.47], [5.02, 4.90], [4.45, 4.36], [4.79, 4.62]].map(function (x, i) {
          return { est: String(311 + 2 * i), reg: "CP-F-" + (40 + i), idade: "28", cp1: A.nstr(x[0], 2), cp2: A.nstr(x[1], 2) }; });
        A.exemplos.importar(F.params, d, "imp_abat", [["dner-me-404-00", 1]]);
        d.abat = d.abat.concat([72, 70, 68, 75, 71, 66, 73, 69, 74].map(function (v, i) { return { reg: "caminhão " + (i + 4), v: String(v) }; }));
        d.verificacoes = G.verifEx(F);
        d.nota063 = [{ reg: "Laudo DNIT 063-PRO nº 22", v: "61" }];
        d.geo = G.exSecoes(310, [[7.51, 20.3, 20.1, 20.4], [7.50, 20.2, 20.0, 20.5], [7.52, 20.4, 20.2, 20.3], [7.53, 20.1, 20.0, 20.2], [7.49, 20.5, 20.3, 20.6],
          [7.50, 20.2, 20.1, 20.4], [7.52, 20.3, 20.2, 20.5], [7.51, 20.0, 20.1, 20.3], [7.50, 20.4, 20.2, 20.2], [7.52, 20.3, 20.4, 20.5], [7.51, 20.2, 20.1, 20.3],
          [7.50, 20.3, 20.1, 20.2], [7.52, 20.4, 20.3, 20.5], [7.51, 20.1, 20.0, 20.3], [7.50, 20.2, 20.2, 20.4], [7.49, 20.3, 20.1, 20.5], [7.51, 20.4, 20.2, 20.3],
          [7.52, 20.2, 20.0, 20.4], [7.50, 20.3, 20.1, 20.2], [7.51, 20.5, 20.3, 20.4], [7.50, 20.2, 20.1, 20.3]]);
        d.obs = "Exemplo de pendência: fctM,est < fctM,k — extrair ao menos 6 CPs das placas de menor resistência (7.4.1.3). Abatimentos dos 3 primeiros caminhões importados da DNER-ME 404 (os 3 fora de 70 ± 10 mm).";
        return d;
      } },
    ],
  });
})();
