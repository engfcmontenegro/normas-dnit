/*
 * Ficha de ES: DNIT 073/2006-ES — Tratamento ambiental de áreas de uso de obras e do passivo ambiental de áreas planas
 * ou de pouca declividade por revegetação arbórea e arbustiva — aceitação do plantio de mudas (A.fichaSimples via
 * FE.aceitacaoG11, definido em es-dnit-071-2006-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG11, num = FE.num, ok = FE.ok;

  var arv = function (P) { return P.tipo !== "arbustos"; };
  var C = [
    { id: "analise", texto: "Análise física e química do solo em laboratório credenciado (correção de pH e nutrientes)", secao: "5.4.1 d", grupo: "Materiais",
      tipo: "sim_nao", exigido: "realizada antes do plantio" },
    { id: "especies", texto: "Espécies conforme o projeto paisagístico / ambiental (nativas preferidas; Tabelas 1 e 2)", secao: "5.1.2; 5.4.1", grupo: "Materiais",
      tipo: "sim_nao", exigido: "espécies e posições do projeto" },
    { id: "fito", texto: "Mudas inspecionadas: sem pragas ou doenças; embalagem sem ervas daninhas", secao: "5.4.1 e", grupo: "Materiais", tipo: "sim_nao",
      exigido: "inspeção antes do plantio" },
    { id: "altmuda", texto: "Altura das mudas na expedição", secao: "5.4.2 t", grupo: "Materiais", tipo: "valor", unid: "m", casas: 2, falha: "ressalva",
      min: function (P) { return P.rua === "sim" ? 1.5 : 0.4; }, max: function (P) { return P.rua === "sim" ? NaN : 0.7; },
      exigido: "0,40 a 0,70 m (arborização de rua: ≥ 1,5 m)", freq: G.lote() },
    { id: "cova", texto: "Dimensões das covas (lado e profundidade)", secao: "5.4.1 b", grupo: "Execução", tipo: "valor", unid: "m", casas: 2, falha: "ressalva",
      min: function (P) { return arv(P) ? 0.6 : 0.4; }, exigido: "árvores 0,60 × 0,60 × 0,60 m; arbustos 0,40 × 0,40 × 0,40 m (ajustáveis ao solo)", freq: G.lote() },
    { id: "antcova", texto: "Antecedência do preparo das covas em relação ao plantio", secao: "5.2", grupo: "Execução", tipo: "valor", unid: "dias", casas: 0,
      min: 20, falha: "ressalva", exigido: "≥ 20 dias", freq: G.lote() },
    { id: "adub", texto: "Adubação mínima por cova (150 g de calcário, 120 g de NPK 10-20-10 + S e micronutrientes, 1.000 g de adubo orgânico) ou conforme a análise do solo",
      secao: "5.2", grupo: "Execução", tipo: "sim_nao", exigido: "em cada cova" },
    { id: "espac", texto: "Espaçamento entre covas", secao: "5.4.1 a", grupo: "Execução", tipo: "valor", unid: "m", casas: 2,
      min: function (P) { return arv(P) ? 5 : 3; }, exigido: "árvores ≥ 5 m (5 × 5 m); arbustos ≥ 3 m (3 × 3 m)", freq: G.lote() },
    { id: "irrig", texto: "Irrigação ≥ 5 L por cova até o pegamento; 3 vezes por semana no 1º mês e 2 vezes por semana depois", secao: "5.4.1 a, e",
      grupo: "Execução", tipo: "sim_nao", falha: "ressalva", exigido: "registro das irrigações" },
    { id: "tutor", texto: "Tutoramento / proteção das mudas (tripé de estacas ou 4 estacas com 1,60 m livres)", secao: "5.4.1 f", grupo: "Execução", tipo: "sim_nao",
      exigido: "em cada muda" },
    { id: "tratos", texto: "Tratos culturais: coroamento, combate a formigas e pragas, ≥ 2 adubações por ano, recomposição das mudas mortas 3 meses após o plantio",
      secao: "5.4.1 d, e, g", grupo: "Execução", tipo: "sim_nao", se: G.etapa2, naoAplicaPor: "verificado na 2ª etapa", exigido: "registro dos tratos" },
    { id: "visual", texto: "Controle visual da Fiscalização: germinação, brotamento e crescimento; substituição das mudas doentes ou mortas", secao: "6",
      grupo: "Produto", tipo: "sim_nao", exigido: "aprovado pela Fiscalização" },
    G.mudasEst("6; 7 b; 8"),
  ];

  A.fichaSimples({
    id: "dnit-073-2006-es",
    titulo: "Revegetação arbórea e arbustiva (plantio de mudas) — aceitação do plantio",
    resumo: "Verificações da DNIT 073/2006-ES: análise do solo, espécies, sanidade e altura das mudas, covas (dimensões, antecedência, adubação), espaçamento (5 × 5 m árvores; 3 × 3 m arbustos), irrigação, tutoramento, tratos culturais e mudas estabelecidas (2ª etapa, com as mudas a substituir).",
    lote: false,
    params: [G.paramMudas, G.ETAPA,
      { k: "tipo", r: "Espécies do lote", tipo: "select", recarrega: true, opcoes: [["arvores", "Árvores (arbóreas)"], ["arbustos", "Arbustos (arbustivas)"]] },
      { k: "rua", r: "Mudas para arborização de rua?", tipo: "select", opcoes: G.SIM_NAO }, G.paramDias],
    padrao: { etapa: "1", tipo: "arvores", rua: "nao" },
    criterios: C,
    extra: function (ctx) {
      G.extraMudas(ctx);
      var d = num(ctx.P.dias);
      if (G.etapa2(ctx.P) && ok(d) && d < 90) ctx.avisos.push("2ª etapa com " + d + " dias: a recomposição das mudas mortas é prevista 3 meses após o plantio (5.4.1 e).");
    },
    notas: "Critérios da DNIT 073/2006-ES: a seção 6 prevê o controle visual da Fiscalização (germinação, brotamento, crescimento e substituição das mudas doentes ou mortas); os valores medidos vêm das seções 5.2, 5.4.1 e 5.4.2 t. Dimensões das covas conforme 5.4.1 b (0,60 m árvores; 0,40 m arbustos — a seção 5.2 cita 0,40 × 0,40 × 0,60 m), tratadas como ressalva por poderem variar com o solo; espaçamento mínimo (\"deverá ser\") como não conformidade. Mudas não estabelecidas: ressalva com o nº a substituir (não são pagas — seção 8).",
    exemplos: [
      { nome: "Bosque em jazida — 2ª etapa, todas estabelecidas (aceito)", dados: function () {
        var P = { mudas: "400", etapa: "2", tipo: "arvores", rua: "nao", dias: "120" };
        return { ident: { registro: "AMB-073-01", data: "2026-03-10", obra: "Obra A", trecho: "BR-000 — km 30", local: "Jazida 1 (1 ha)" },
          params: P, verificacoes: G.verif(C, P),
          altmuda: G.vals([["Amostra lote viveiro", "0,55"], ["Amostra 2", "0,62"], ["Amostra 3", "0,48"]]),
          cova: G.vals([["Cova 12", "0,60"], ["Cova 87", "0,62"]]),
          antcova: G.vals([["Abertura → plantio", "25"]]),
          espac: G.vals([["Linha 1", "5,0"], ["Linha 5", "5,2"]]),
          estab: G.vals([["Contagem aos 120 dias", "100"]]) };
      } },
      { nome: "Arbustos em banquetas — 2ª etapa com falhas (ressalva / rejeitado)", dados: function () {
        var P = { mudas: "600", etapa: "2", tipo: "arbustos", rua: "nao", dias: "75" };
        return { ident: { registro: "AMB-073-02", data: "2026-08-01", obra: "Obra B", trecho: "BR-000 — km 5", local: "Banquetas do aterro, est. 40 a 52" },
          params: P, verificacoes: G.verif(C, P, { tutor: { real: "600", nc: "45", obs: "mudas sem tutor" } }),
          altmuda: G.vals([["Amostra 1", "0,35"], ["Amostra 2", "0,45"]]),
          cova: G.vals([["Cova 3", "0,40"], ["Cova 40", "0,35"]]),
          antcova: G.vals([["Abertura → plantio", "12"]]),
          espac: G.vals([["Linha 1", "3,0"], ["Linha 2", "2,5"]]),
          estab: G.vals([["Contagem aos 75 dias", "92"]]) };
      } },
    ],
  });
})();
