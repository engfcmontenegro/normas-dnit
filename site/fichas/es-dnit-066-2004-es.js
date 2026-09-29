/*
 * Ficha de ES: DNIT 066/2004-ES — Pavimento com peças pré-moldadas de concreto — aceitação do trecho.
 * A ES só tem controle de materiais (5.1 / 7.1) e a verificação final (7.2): largura com variação < ± 10 % e espessura
 * média ≥ projeto com (maior − menor) ≤ 1 cm, a cada 20 m. As exigências de execução da seção 5 entram como verificações.
 * Usa FE.aceitacaoG6 (definida em es-dnit-047-2004-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG6, sn = G.sn;
  var ID = "dnit-066-2004-es";
  var crit = [
    sn("pecas", "Peças conforme NBR 9781, formato regular, dimensões mínimas da 5.1.1 (40 × 10 × 6 cm); resistência verificada (esclerômetro NBR 7584 entre 15 e 60 dias)", "5.1.1", "Materiais", "NBR 9781"),
    sn("areia", "Areia ou pó de pedra do colchão conforme NBR 7211", "5.1.2", "Materiais", "NBR 7211"),
    sn("cap", "Rejuntamento com cimento asfáltico de penetração 40/50 ou 50/60", "5.1.3", "Materiais", "CAP 40/50 ou 50/60"),
    sn("subleito", "Subleito regularizado (DNER-ES 299) e reforçado se necessário (DNER-ES 300)", "5.3.1", "Execução", "conforme projeto"),
    { id: "espSB", texto: "Espessura da sub-base", secao: "5.3.2", grupo: "Execução", tipo: "valor", unid: "cm", casas: 1, min: 15, falha: "nao_conforme",
      exigido: "≥ 15 cm (e a de projeto); material não expansivo nem bombeável; caimentos dados na sub-base", freq: { por: "lote", minimo: 1 } },
    sn("colchao", "Colchão de areia/pó de pedra com espessura uniforme de 4 cm após compactado", "5.3.3", "Execução", "4 cm"),
    sn("guias", "Guias e sarjetas colocadas (confinamento obrigatório do colchão)", "5.3.3", "Execução", "obrigatórias", "nao_conforme"),
    sn("linhas", "Linhas de referência: ponteiros a ≤ 10 m, cordéis nivelados conforme o abaulamento", "5.3.4.2", "Execução", "≤ 10 m"),
    sn("assent", "Assentamento: fileiras normais ao eixo, juntas acertadas e alinhadas, nivelamento com régua entre cordéis", "5.3.4.3", "Execução", "conforme 5.3.4.3"),
    sn("rejunte", "Rejuntamento: pedrisco em ~3/4 da altura, compressão com rolo liso 10–12 t (bordas → centro), asfalto até aflorar", "5.3.4.4; 5.2 a", "Execução", "conforme 5.3.4.4"),
    sn("prot", "Valetas provisórias durante a construção; sem tráfego sobre a pista em execução", "5.3.4.5", "Execução", "sem tráfego"),
  ];
  G.criarFicha({
    id: ID,
    titulo: "Pavimento de peças pré-moldadas de concreto — aceitação do trecho",
    resumo: "Verificação final (7.2): largura (< ± 10 %) e espessura (média ≥ projeto; maior − menor ≤ 1 cm) a cada 20 m; materiais (5.1) e verificações de execução (5.3); área para medição.",
    lote: { largura: true },
    params: [], padrao: {},
    criterios: crit,
    componentes: [
      G.compGeometria({ modo: "rigido", secao: "7.2", secLarg: "7.2 a", secEsp: "7.2 b", medicao: "area", secMed: "8 b", base: "sub-base", nomeEsp: "Espessura do pavimento",
        provEsp: "O trecho não é aceito (7.2): corrigir o assentamento/colchão e refazer a verificação." }),
    ],
    notas: "Critérios da DNIT 066/2004-ES. Verificação final (7.2): relocação e nivelamento do eixo e bordos a cada 20 m; largura com variação < ± 10 % do projeto; espessura média ≥ projeto e diferença entre o maior e o menor valor ≤ 1 cm " +
      "(a espessura sai das cotas do topo da sub-base e do topo do pavimento, ou é digitada). A ES não fixa critério de resistência das peças além da NBR 9781. Sub-base ≥ 15 cm (5.3.2). Medição em m² com as larguras médias (8). " +
      "Exigências da seção 5 não atendidas = ressalva, salvo as obrigatórias (guias e sarjetas; sub-base ≥ 15 cm).",
    exemplos: [
      { nome: "Trecho aceito — via urbana, 200 m × 6,0 m", dados: function () {
        var F = FE.FICHAS[ID];
        var d = { ident: { registro: "LOTE-PM-001", data: "2026-03-10", obra: "Obra C — Rua A", trecho: "Quadra 1", local: "Est. 0 a 10", camada: "Pavimento de peças pré-moldadas" },
          params: Object.assign({}, F.padrao, { estIni: "0", estFim: "10", largura: "6,00", largProj: "6,00", espProj: "10" }), verificacoes: G.verifEx(F), espSB: [] };
        d.espSB = [0, 2, 4, 6, 8, 10].map(function (e, i) { return { est: String(e), pos: "eixo", reg: "nivelamento", v: A.nstr(15.4 + (i % 3) * 0.3, 1) }; });
        var g = [];
        for (var i = 0; i <= 10; i++) g.push({ est: String(i), pos: "eixo", larg: A.nstr(6.02 - (i % 2) * 0.03, 2), cb: A.nstr(100 + i * 0.1, 3), ct: A.nstr(100 + i * 0.1 + 0.101 + (i % 3) * 0.002, 3) });
        d.geo = g;
        d.obs = "Espessura do pavimento (peça + colchão) pelas cotas do topo da sub-base e do topo das peças.";
        return d;
      } },
      { nome: "Trecho rejeitado — espessura irregular (> 1 cm) e guias não colocadas em um trecho", dados: function () {
        var F = FE.FICHAS[ID];
        var d = { ident: { registro: "LOTE-PM-002", data: "2026-03-24", obra: "Obra C — Rua B", trecho: "Quadra 2", local: "Est. 10 a 18", camada: "Pavimento de peças pré-moldadas" },
          params: Object.assign({}, F.padrao, { estIni: "10", estFim: "18", largura: "6,00", largProj: "6,00", espProj: "10" }),
          verificacoes: G.verifEx(F, { guias: { real: "2", nc: "1", obs: "guia ausente entre as estacas 15 e 16 (LE)" } }), espSB: [] };
        d.espSB = [10, 12, 14, 16, 18].map(function (e, i) { return { est: String(e), pos: "eixo", reg: "nivelamento", v: A.nstr([15.2, 14.6, 15.5, 15.1, 15.3][i], 1) }; });
        d.geo = [10.3, 10.1, 9.6, 10.8, 10.2, 9.9, 10.9, 10.0, 10.4].map(function (e, i) { return { est: String(10 + i), pos: "eixo", larg: A.nstr(6.01, 2), esp: A.nstr(e, 1) }; });
        return d;
      } },
    ],
  });
})();
