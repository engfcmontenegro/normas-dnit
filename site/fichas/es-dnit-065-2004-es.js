/*
 * Ficha de ES: DNIT 065/2004-ES — Sub-base de concreto de cimento Portland adensado por vibração — aceitação do trecho.
 * Resistência à compressão (7.3.1: fck,est = fc28·(1 − 0,842·v) ≥ 7,5 MPa, v = s / fc28; 20 exemplares por trecho de até
 * 2.500 m²; verificação suplementar: ≥ 6 testemunhos, nenhum < 4,6 MPa — 7.3.2), abatimento 80 ± 20 mm a cada moldagem
 * (5.1.6 c; 7.1.1), geometria (7.2: largura ± 10 cm; espessura ± 10 %), água (5.1.3) e execução (seção 5).
 * Usa FE.aceitacaoG6 (definida em es-dnit-047-2004-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG6, num = FE.num, ok = FE.ok, sn = G.sn;
  var ID = "dnit-065-2004-es";
  var crit = [
    sn("cim", "Cimento CP-I, CP-II, CP-III ou CP-IV; agregados NBR 7211; aditivos NBR 11768", "5.1.1; 5.1.2; 5.1.4", "Insumos", "recebimento DNER-EM 036/037/038"),
    sn("dos", "Dosagem: C ≥ 100 kg/m³; Dmáx ≤ 1/3 da espessura e ≤ 25 mm; ar ≤ 5 % (NBR 11686); exsudação ≤ 1,5 %", "5.1.6 b, d, e, f", "Concreto", "estudo de dosagem"),
    G.itemAbatimento({ secao: "5.1.6 c; 7.1.1", min: 60, max: 100, exigido: "80 ± 20 mm (60 a 100 mm)",
      freqG: function (P, L, d) { var n = (d.res || []).filter(function (c) { return ok(num(c.cp1)) || ok(num(c.cp2)); }).length; return { exigido: Math.max(1, n), regra: "cada moldagem de corpos de prova (7.1.1)" }; } }),
    sn("larg", "Sub-base excede em ≥ 50 cm a largura total do pavimento; superfície lisa e desempenada", "5.3.1", "Execução", "≥ 50 cm além do pavimento"),
    sn("formas", "Fôrmas firmes; desvios altimétricos ≤ 3 mm e planimétricos ≤ 5 mm; untadas", "5.3.2", "Execução", "≤ 3 / 5 mm"),
    sn("fundo", "Fundo de caixa: espessura não inferior à de projeto em toda a seção", "5.3.2", "Execução", "\"não se admitindo\" espessura inferior", "nao_conforme"),
    sn("tempo", "Mistura→lançamento ≤ 30 min (≤ 90 min em caminhão-betoneira com agitação), sem redosagem; subleito saturado sem poças", "5.3.3", "Execução", "≤ 30 / 90 min"),
    sn("regua", "Régua de 3 m: variações > 5 mm corrigidas (saliências cortadas, depressões preenchidas)", "5.3.4", "Execução", "≤ 5 mm"),
    sn("cura", "Cura com pintura betuminosa (emulsão catiônica RM) 0,8 a 1,5 l/m², logo após o acabamento; sub-base interditada ao tráfego", "5.1.5; 5.3.5", "Execução", "membrana contínua"),
  ];
  G.criarFicha({
    id: ID,
    titulo: "Sub-base de concreto adensado por vibração — aceitação do trecho",
    resumo: "Trecho de até 2.500 m²: fck,est = fc28·(1 − 0,842·v) ≥ 7,5 MPa com 20 exemplares (7.3), abatimento 80 ± 20 mm, largura (± 10 cm) e espessura (± 10 %) a cada 20 m, água e execução.",
    lote: { largura: true },
    params: G.paramInsumos,
    padrao: { fck: "7,5", idadeCtrl: "28", resSup: "nao", insumos: "lote" },
    criterios: crit,
    componentes: [
      G.compResistencia({ tipos: ["compressao"], formula: "cv", fkPadrao: 7.5, secao: "7.3.1", secAuto: "7.3.2", secMold: "7.1.2", secSup: "7.3.2 a, b", secaoExig: "5.1.6 a",
        exPorTrecho: 20, areaTrecho: 2500, sup: "individual", supMin: 4.6, importar: ["dner-me-091-98"],
        provNC: "De comum acordo entre as partes: demolir e reconstruir a parte condenada ou reforçar a sub-base (7.3.2 c)." }),
      G.compGeometria({ modo: "065", secao: "7.2", secLarg: "7.2 a", secEsp: "7.2 b", medicao: "projeto", secMed: "8 a", base: "camada subjacente",
        provEsp: "Corrigir a espessura ou decidir entre as partes (7.2)." }),
      G.compAgua({ secao: "5.1.3" }),
    ],
    notas: "Critérios da DNIT 065/2004-ES. Resistência (7.3.1): fck,est = fc28·(1 − 0,842·v), v = s / fc28 (s com n − 1) — equivale a fc28 − 0,842·s com k fixo; aceitação automática se fck,est ≥ 7,5 MPa (7.3.2); " +
      "20 exemplares por trecho de até 2.500 m², exemplar = maior de 2 CPs cilíndricos rompidos aos 28 dias (7.1.2). Sem aceitação automática: ≥ 6 testemunhos Ø 15 cm (NBR 7680) — adotado: aceito se nenhum resultado < 4,6 MPa (7.3.2 b). " +
      "Abatimento 80 ± 20 mm em cada moldagem de CPs (7.1.1). Geometria (7.2): largura ± 10 cm e espessura ± 10 % do projeto em cada ponto (relocação e nivelamento a cada 20 m). " +
      "Exigências da seção 5 não atendidas = ressalva, salvo proibições expressas (fundo de caixa).",
    exemplos: [
      { nome: "Trecho aceito — 20 exemplares, fck,est ≥ 7,5 MPa", dados: function () {
        var F = FE.FICHAS[ID];
        var d = { ident: { registro: "LOTE-SBC-001", data: "2026-04-15", obra: "Obra A — BR-000", trecho: "Sub-base — trecho 1", local: "Est. 200 a 215", camada: "Sub-base de concreto vibrado 10 cm" },
          params: Object.assign({}, F.padrao, { estIni: "200", estFim: "215", largura: "8,20", largProj: "8,20", espProj: "10" }), verificacoes: G.verifEx(F), res: [], abat: [], agua: [{}] };
        var v = [9.8, 10.4, 9.5, 11.0, 10.1, 9.2, 10.7, 9.9, 10.3, 9.6, 10.9, 10.0, 9.4, 10.6, 10.2, 9.7, 11.2, 9.9, 10.5, 9.8];
        d.res = v.map(function (x, i) { return { est: String(200 + Math.floor(i * 0.75)), reg: "CP-SBC-" + (100 + i), idade: "28", cp1: A.nstr(x, 1), cp2: A.nstr(x - 0.3 - (i % 2) * 0.2, 1) }; });
        d.abat = v.map(function (x, i) { return { reg: "moldagem " + (i + 1), v: String([75, 82, 90, 70, 85][i % 5]) }; });
        A.exemplos.importar(F.params, d, "impAgua", [["dnit-036-2004-me", 0]]);
        var geo = [];
        for (var i = 0; i <= 15; i++) geo.push({ est: String(200 + i), pos: "eixo", larg: A.nstr(8.22 + (i % 3) * 0.02, 2), esp: A.nstr(10.2 + (i % 4) * 0.2, 1) });
        d.geo = geo;
        return d;
      } },
      { nome: "Trecho rejeitado — fck,est < 7,5 MPa e testemunho abaixo de 4,6 MPa; espessura fora de ± 10 %", dados: function () {
        var F = FE.FICHAS[ID];
        var d = { ident: { registro: "LOTE-SBC-002", data: "2026-04-29", obra: "Obra A — BR-000", trecho: "Sub-base — trecho 2", local: "Est. 215 a 230", camada: "Sub-base de concreto vibrado 10 cm" },
          params: Object.assign({}, F.padrao, { estIni: "215", estFim: "230", largura: "8,20", largProj: "8,20", espProj: "10", resSup: "sim", insumos: "previo", insumosReg: "RI-03" }),
          verificacoes: G.verifEx(F), res: [], abat: [], ext: [] };
        var v = [8.1, 9.6, 7.2, 10.4, 8.8, 6.9, 9.9, 7.8, 8.5, 10.8, 7.4, 9.1, 6.6, 8.9, 10.1, 7.9, 9.4, 8.2, 7.1, 9.7];
        d.res = v.map(function (x, i) { return { est: String(215 + Math.floor(i * 0.75)), reg: "CP-SBC-" + (200 + i), idade: "28", cp1: A.nstr(x - 0.6, 1), cp2: A.nstr(x - 1.0, 1) }; });
        d.abat = v.map(function (x, i) { return { reg: "moldagem " + (i + 1), v: String([75, 82, 105, 70, 85][i % 5]) }; });
        d.ext = [["217", 6.2], ["220", 4.3], ["223", 5.8], ["225", 7.0], ["227", 5.1], ["229", 6.5]].map(function (x, i) { return { est: x[0], reg: "Testemunho T" + (i + 1), v: A.nstr(x[1], 1) }; });
        var geo = [];
        for (var i = 0; i <= 15; i++) geo.push({ est: String(215 + i), pos: "eixo", larg: A.nstr(8.21 + (i % 3) * 0.02, 2), esp: A.nstr(i === 9 ? 8.6 : 10.1 + (i % 4) * 0.2, 1) });
        d.geo = geo;
        d.obs = "Exemplo: coeficiente de variação alto (v ≈ 14 %); testemunho T2 com 4,3 MPa; espessura de 8,6 cm na estaca 224 (< 9,0 cm).";
        return d;
      } },
    ],
  });
})();
