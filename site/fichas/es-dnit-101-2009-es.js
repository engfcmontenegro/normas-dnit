/*
 * Ficha de ES: DNIT 101/2009-ES — Sinalização vertical — aceitação de um conjunto de placas do mesmo tipo de
 * implantação (A.fichaSimples via FE.aceitacaoG11, definido em es-dnit-071-2006-es.js). Seção 7: insumos, execução
 * (ângulo, altura, afastamento — 5.4), acabamento e retrorrefletividade (NBR 15426 / NBR 14644).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG11, num = FE.num;

  var susp = function (P) { return P.tipo === "suspensa"; };
  var urb = function (P) { return P.ambiente === "urbano"; };
  var placa = { por: "contagem", qtd: "nplacas", a_cada: 1, unidade: "placa(s)", regra: "1 por placa (7.2.2 / 7.3.1 — levantamento topográfico)" };
  function hMin(P) { return susp(P) ? (urb(P) && G.sim(P, "foraDNIT") ? 4.5 : 5.5) : urb(P) ? 2.0 : 1.2; }
  function afMin(P) { return urb(P) ? (P.trecho === "curva" ? 0.4 : 0.3) : susp(P) ? 1.8 : 2.0; }
  var C = [
    { id: "relat", texto: "Materiais com relatório de ensaio (fabricante com certificação ISO ou laboratório credenciado); controle de chapas, películas, suportes e fixações pelas normas da seção 2",
      secao: "7.1", grupo: "Insumos", tipo: "sim_nao", exigido: "por lote de material" },
    { id: "adeq", texto: "Placas conforme o projeto: dimensões, formas e cores (5.2), dizeres e formatação das mensagens, tipo de película, dimensões dos suportes",
      secao: "7.1; 5.2", grupo: "Insumos", tipo: "sim_nao", exigido: "em cada placa" },
    { id: "chapas", texto: "Chapas: verso com tinta preta fosca, face com primer; alumínio com espessura ≥ 1,5 mm; sinais totalmente retrorrefletivos, exceto as partes pretas",
      secao: "5.3.1; 5.3.2", grupo: "Insumos", tipo: "sim_nao" },
    { id: "sinobra", texto: "Implantação precedida da sinalização de obras", secao: "7.2.1", grupo: "Execução", tipo: "sim_nao" },
    { id: "local", texto: "Localização conforme o projeto (alteração só por obstrução da visibilidade, comunicada à Fiscalização)", secao: "7.2.2 a, b; 5.6.3",
      grupo: "Execução", tipo: "sim_nao", exigido: "em cada placa", freq: placa },
    { id: "angulo", texto: "Ângulo da placa", secao: "5.4.1; 7.2.2 e", grupo: "Execução", tipo: "valor", unid: "°", casas: 1,
      min: function (P) { return susp(P) ? 3 : 93; }, max: function (P) { return susp(P) ? 5 : 95; },
      exigido: "laterais: 93° a 95° com o eixo da via; suspensas: 3° a 5° com a vertical", freq: placa },
    { id: "altura", texto: "Altura até a parte inferior da placa (gabarito, nas suspensas)", secao: "5.4.2; 7.3.1 b", grupo: "Execução", tipo: "valor", unid: "m", casas: 2,
      min: hMin, max: function (P) { return !susp(P) && urb(P) ? 2.5 : NaN; },
      exigido: "laterais: 1,20 m (rural, adotado como mínimo) ou 2,0 a 2,5 m (urbano); suspensas: ≥ 5,5 m (4,5 m em vias urbanas fora da circunscrição do DNIT)", freq: placa },
    { id: "afast", texto: "Afastamento da placa (ou do suporte, nas aéreas) ao bordo da pista", secao: "5.4.3; 7.3.1 a", grupo: "Execução", tipo: "valor", unid: "m", casas: 2,
      min: afMin, exigido: "rural: ≥ 2,0 m (chão) / ≥ 1,80 m (aérea); urbano: ≥ 0,3 m (tangente) / ≥ 0,4 m (curva)", freq: placa },
    { id: "fundacao", texto: "Fundação dos suportes em concreto nas dimensões e resistência previstas", secao: "7.2.2 f; 5.6.6", grupo: "Execução", tipo: "sim_nao" },
    { id: "fixacao", texto: "Fixação: suportes rígidos, sem balançar, girar ou deslocar; braçadeiras, parafusos, arruelas, porcas e contraporcas", secao: "7.2.2 g; 5.6.7; 5.6.8",
      grupo: "Execução", tipo: "sim_nao", freq: placa },
    { id: "acab", texto: "Acabamento: verticalidade dos suportes e uniformidade de altura das placas idênticas em sequência (inspeção visual)", secao: "7.3.2",
      grupo: "Produto", tipo: "sim_nao" },
    { id: "retro", texto: "Retrorrefletividade das películas (NBR 15426)", secao: "7.3.3; 7.4", grupo: "Produto", tipo: "valor", unid: "cd/lx·m²", casas: 0,
      min: function (P) { return num(P.retroMin); }, exigido: "≥ valor da ABNT NBR 14644 para a película e a cor (informe nos parâmetros)",
      freq: { por: "lote", minimo: 1, regra: "conforme NBR 15426 (a ES não fixa a amostragem)" } },
  ];

  A.fichaSimples({
    id: "dnit-101-2009-es",
    titulo: "Sinalização vertical — aceitação de placas",
    resumo: "Verificações da DNIT 101/2009-ES, seção 7: materiais e adequação ao projeto, sinalização de obra, localização, ângulo (93° a 95°; suspensas 3° a 5°), altura (1,20 m rural, 2,0 a 2,5 m urbano, gabarito 5,5 m), afastamento lateral, fundação, fixação, acabamento e retrorrefletividade (NBR 14644).",
    lote: false,
    params: [{ k: "nplacas", r: "Placas no lote (nº)", ph: "ex.: 6" },
      { k: "ambiente", r: "Ambiente", tipo: "select", recarrega: true, opcoes: [["rural", "Rodovia em área rural"], ["urbano", "Trecho urbano / travessia urbana"]] },
      { k: "tipo", r: "Tipo de placa", tipo: "select", recarrega: true, opcoes: [["lateral", "Lateral (no chão)"], ["suspensa", "Suspensa (aérea)"]] },
      { k: "trecho", r: "Trecho (afastamento urbano)", tipo: "select", opcoes: [["tangente", "Tangente"], ["curva", "Curva"]], se: urb },
      { k: "foraDNIT", r: "Via urbana fora da circunscrição do DNIT (gabarito 4,5 m)?", tipo: "select", opcoes: G.SIM_NAO, se: function (P) { return urb(P) && susp(P); } },
      { k: "retroMin", r: "Retrorrefletividade mínima da NBR 14644 (cd/lx·m²)", dica: "valor da tabela da NBR 14644 para o tipo de película, a cor e a geometria de medição" }],
    padrao: { ambiente: "rural", tipo: "lateral", trecho: "tangente", foraDNIT: "nao" },
    criterios: C,
    notas: "Critérios da DNIT 101/2009-ES: seção 7 com os requisitos de posicionamento de 5.4. A altura das placas laterais rurais (\"1,20 m do bordo da pista\") não tem tolerância na ES: adotada como mínimo. Retrorrefletividade: a ES remete aos valores da NBR 14644 (não transcritos) — informe o mínimo da película usada. Controle estatístico citado em 7.4 sem critério próprio: avaliação por valores individuais. Geometria fora dos limites: não conformidade (reposicionar a placa).",
    exemplos: [
      { nome: "Placas laterais em rodovia rural (aceito)", dados: function () {
        var P = { nplacas: "4", ambiente: "rural", tipo: "lateral", trecho: "tangente", foraDNIT: "nao", retroMin: "250" };
        return { ident: { registro: "OC-101-01", data: "2026-07-07", obra: "Obra A", trecho: "BR-000 — km 20 a km 26", local: "Placas R-19, A-2a, A-21e e I-5" },
          params: P, verificacoes: G.verif(C, P, { local: { real: "4" }, fixacao: { real: "4" } }),
          angulo: G.vals([["Placa 1 (km 20,3)", "94"], ["Placa 2", "93,5"], ["Placa 3", "94,5"], ["Placa 4", "95"]]),
          altura: G.vals([["Placa 1", "1,22"], ["Placa 2", "1,25"], ["Placa 3", "1,20"], ["Placa 4", "1,21"]]),
          afast: G.vals([["Placa 1", "2,10"], ["Placa 2", "2,00"], ["Placa 3", "2,20"], ["Placa 4", "2,05"]]),
          retro: G.vals([["Placa 1 — fundo branco", "310"], ["Placa 3 — fundo amarelo", "268"]]) };
      } },
      { nome: "Pórtico em travessia urbana — gabarito baixo (rejeitado)", dados: function () {
        var P = { nplacas: "2", ambiente: "urbano", tipo: "suspensa", trecho: "curva", foraDNIT: "nao", retroMin: "250" };
        return { ident: { registro: "OC-101-02", data: "2026-09-15", obra: "Obra B", trecho: "BR-000 — travessia urbana A", local: "Pórtico no km 44,1" },
          params: P, verificacoes: G.verif(C, P, { local: { real: "2" }, fixacao: { real: "2", nc: "1", obs: "painel 2 balançando" } }),
          angulo: G.vals([["Painel 1", "4"], ["Painel 2", "7"]]),
          altura: G.vals([["Painel 1", "5,60"], ["Painel 2", "5,35"]]),
          afast: G.vals([["Coluna esquerda", "0,50"], ["Coluna direita", "0,45"]]),
          retro: G.vals([["Painel 1", "280"], ["Painel 2", "230"]]) };
      } },
    ],
  });
})();
