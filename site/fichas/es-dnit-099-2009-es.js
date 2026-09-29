/*
 * Ficha de ES: DNIT 099/2009-ES — Obras complementares — Cercas de arame farpado — aceitação (A.fichaSimples via
 * FE.aceitacaoG11, definido em es-dnit-071-2006-es.js). Seção 7: controle dos insumos (arame, mourões de concreto
 * com amostra de 1 % — flexão e absorção — e de madeira), da execução e do produto.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG11, num = FE.num;

  var conc = function (P) { return P.mourao === "concreto"; };
  var mad = function (P) { return P.mourao !== "concreto"; };
  // 7.1.2 d: amostras na base de 1 % das unidades de cada lote fornecido (por fabricante)
  var um = function (k, txt) { return { por: "contagem", qtd: k, a_cada: 100, minimo: 1, unidade: "unid.", regra: "1 % das unidades " + txt + " (7.1.2 d); mín. 1" }; };
  var cada50 = { por: "extensao", a_cada: 50, pontos: true, regra: "1 a cada 50 m — em cada mourão esticador (5.3.7 b / 5.3.8 b); amostragem adotada" };
  var C = [
    { id: "etiqueta", texto: "Arame farpado: etiqueta dos rolos (produtor, comprimento, massa, classe, categoria de zincagem, diâmetro dos fios, espaçamento das farpas)",
      secao: "7.1.1 a", grupo: "Insumos", tipo: "sim_nao", exigido: "em cada rolo / carretel" },
    { id: "visual", texto: "Arame farpado: inspeção visual e dimensional (fixação das farpas, zincagem, bitolas e tolerâncias, farpas, nº de torções)",
      secao: "7.1.1 b", grupo: "Insumos", tipo: "sim_nao" },
    { id: "atest", texto: "Arame farpado: propriedades atestadas — carga de ruptura e alongamento (NBR 6207), desenrolamento e aderência do zinco (NBR 6347), massa de zinco (NBR 7397); DNER-EM 366/97",
      secao: "7.1.1 c; 5.1.6", grupo: "Insumos", tipo: "sim_nao", exigido: "certificado / relatório de ensaio" },
    { id: "mconc", texto: "Mourões de concreto: preparo, adensamento e cura (NBR 12655); sem trincas, arestas esborcinadas, falhas de concretagem, saliências ou reparos; DNER-EM 174/94",
      secao: "7.1.2 a, b; 5.1.5", grupo: "Insumos", tipo: "sim_nao", se: conc, naoAplicaPor: "mourões de madeira" },
    { id: "flexs", texto: "Resistência à flexão — mourão de suporte e de escora", secao: "7.1.2 c", grupo: "Insumos", tipo: "valor", unid: "kgf", casas: 0, min: 60,
      se: conc, naoAplicaPor: "mourões de madeira", freq: um("nsup", "de suporte e escora") },
    { id: "flexe", texto: "Resistência à flexão — mourão esticador", secao: "7.1.2 c", grupo: "Insumos", tipo: "valor", unid: "kgf", casas: 0, min: 150,
      se: conc, naoAplicaPor: "mourões de madeira", freq: um("nest", "esticadoras") },
    { id: "absor", texto: "Absorção de água dos mourões (NBR 6124)", secao: "7.1.2 c", grupo: "Insumos", tipo: "valor", unid: "%", casas: 1, max: 7,
      se: conc, naoAplicaPor: "mourões de madeira", freq: { por: "contagem", a_cada: 100, minimo: 1, unidade: "unid.", regra: "1 % das unidades (7.1.2 d); mín. 1",
        qtd: function (P) { return (num(P.nsup) || 0) + (num(P.nest) || 0); } } },
    { id: "mmad", texto: "Mourões de madeira: fabricante registrado no IBAMA; tratamento preservativo (DNER-EM 033/94, NBR 9480); retos, sem fendas, chanfrados no topo e aparados na base; comprimentos 2,10 m (suporte) e 2,20 m (esticador)",
      secao: "7.1.3; 5.1.1 a 5.1.4", grupo: "Insumos", tipo: "sim_nao", se: mad, naoAplicaPor: "mourões de concreto" },
    { id: "dsup", texto: "Diâmetro do mourão de madeira de suporte", secao: "5.1.3; 7.1.3 b", grupo: "Insumos", tipo: "valor", unid: "m", casas: 3, min: 0.10,
      se: mad, naoAplicaPor: "mourões de concreto", freq: G.lote("inspeção visual; amostragem adotada") },
    { id: "dest", texto: "Diâmetro do mourão de madeira esticador", secao: "5.1.4; 7.1.3 b", grupo: "Insumos", tipo: "valor", unid: "m", casas: 3, min: 0.15,
      se: mad, naoAplicaPor: "mourões de concreto", freq: G.lote("inspeção visual; amostragem adotada") },
    { id: "locacao", texto: "Locação topográfica conforme o projeto geométrico (delimitação da faixa de domínio)", secao: "7.2.1; 5.3.1", grupo: "Execução", tipo: "sim_nao" },
    { id: "limpeza", texto: "Largura da faixa limpa (desmatamento e destocamento), centrada na linha da cerca", secao: "7.2.2; 5.3.2", grupo: "Execução", tipo: "valor",
      unid: "m", casas: 2, min: 2.0, falha: "ressalva", freq: cada50 },
    { id: "psup", texto: "Profundidade de cravação dos mourões de suporte", secao: "5.3.7 a; 5.3.8 a; 7.2.3 a", grupo: "Execução", tipo: "valor", unid: "m", casas: 2,
      min: function (P) { return conc(P) ? 0.6 : 0.5; }, exigido: "madeira 0,50 m; concreto 0,60 m", freq: cada50 },
    { id: "pest", texto: "Profundidade de cravação dos mourões esticadores", secao: "5.3.7 b; 5.3.8 b; 7.2.3 a", grupo: "Execução", tipo: "valor", unid: "m", casas: 2,
      min: 0.6, freq: cada50 },
    { id: "esup", texto: "Espaçamento entre mourões de suporte", secao: "5.3.7 a; 5.3.8 a; 7.2.3 a", grupo: "Execução", tipo: "valor", unid: "m", casas: 2, max: 2.5,
      falha: "ressalva", exigido: "2,50 m (adotado como máximo)", freq: cada50 },
    { id: "eest", texto: "Distância entre mourões esticadores", secao: "5.3.7 b; 5.3.8 b; 7.2.3 c", grupo: "Execução", tipo: "valor", unid: "m", casas: 1, max: 50,
      exigido: "a cada 50,0 m e nas mudanças de alinhamento", freq: cada50 },
    { id: "prumo", texto: "Mourões alinhados e aprumados, reaterro compactado; esticadores nas mudanças de alinhamento, escorados por 2 mourões de escora",
      secao: "5.3.4; 5.3.6; 5.3.7 c; 7.2.3 b, c", grupo: "Execução", tipo: "sim_nao" },
    { id: "fios", texto: "Fios: 4 fios a partir de 0,10 m do topo, espaçamentos 0,40 / 0,40 / 0,40 m e 0,30 m inferior (5 fios com gado de pequeno porte: 0,15 m do topo, 0,35 / 0,35 / 0,25 / 0,25 m)",
      secao: "5.3.5; 7.2.4 a", grupo: "Execução", tipo: "sim_nao", exigido: "conforme o projeto" },
    { id: "fixa", texto: "Fixação dos arames: grampos de aço zincado nos mourões de madeira; arame liso de aço zincado nº 14 nos de concreto", secao: "7.2.4 b; 5.3.5",
      grupo: "Execução", tipo: "sim_nao" },
    { id: "final", texto: "Verificação final visual: cerca alinhada sobre a divisa da faixa de domínio, mourões firmes, arames fixados no espaçamento especificado, esticadores nos locais especificados",
      secao: "7.3", grupo: "Produto", tipo: "sim_nao" },
  ];

  A.fichaSimples({
    id: "dnit-099-2009-es",
    titulo: "Cercas de arame farpado — aceitação",
    resumo: "Verificações da DNIT 099/2009-ES, seção 7: arame farpado (etiqueta, inspeção, propriedades atestadas), mourões de concreto (amostra de 1 %: flexão ≥ 60 / 150 kgf, absorção ≤ 7 %) ou de madeira (IBAMA, tratamento, diâmetros ≥ 0,10 / 0,15 m), locação, faixa limpa de 2,0 m, cravação (0,50 / 0,60 m), espaçamentos (2,50 m; esticadores a cada 50 m), fios, fixação e verificação final.",
    lote: { largura: false },
    params: [{ k: "mourao", r: "Tipo de mourão", tipo: "select", recarrega: true, opcoes: [["madeira", "Madeira preservada"], ["concreto", "Concreto armado"]] },
      { k: "nsup", r: "Mourões de suporte e escora do lote fornecido (nº)", se: conc }, { k: "nest", r: "Mourões esticadores do lote fornecido (nº)", se: conc }],
    padrao: { mourao: "madeira" },
    criterios: C,
    notas: "Critérios da DNIT 099/2009-ES: seção 7 (inspeções) com os requisitos das seções 4 e 5 (7.4). A ES não fixa a amostragem das verificações de execução: adotada 1 verificação a cada 50 m (em cada mourão esticador); mourões de concreto: amostra de 1 % das unidades do lote (7.1.2 d). Flexão em \"kg\" na ES, lida como kgf. Espaçamento de 2,50 m e faixa limpa de 2,00 m tratados como ressalva; profundidades de cravação e distância entre esticadores como não conformidade. A ES cita controle estatístico (7.4) sem definir critério: avaliação por valores individuais.",
    exemplos: [
      { nome: "Cerca com mourões de concreto (aceita)", dados: function () {
        var P = { estIni: "0", estFim: "10", mourao: "concreto", nsup: "250", nest: "8" };
        function col(ests, vs) { return vs.map(function (v, i) { return { est: ests[i], pos: "", reg: "", v: v }; }); }
        var e = ["0", "2+10", "5", "7+10", "10"];
        return { ident: { registro: "OC-099-01", data: "2026-03-03", obra: "Obra A", trecho: "BR-000 — km 14", local: "Divisa da faixa de domínio LD, est. 0 a 10" },
          params: P, verificacoes: G.verif(C, P),
          flexs: G.vals([["Mourão S-17", "72", "Lote F-3"], ["Mourão S-96", "68", "Lote F-3"], ["Mourão S-201", "75", "Lote F-3"]]),
          flexe: G.vals([["Mourão E-2", "168", "Lote F-3"]]),
          absor: G.vals([["S-17", "5,8"], ["S-96", "6,2"], ["S-201", "5,5"]]),
          limpeza: col(e, ["2,00", "2,10", "2,05", "2,00", "2,20"]),
          psup: col(e, ["0,62", "0,60", "0,65", "0,61", "0,60"]),
          pest: col(e, ["0,62", "0,60", "0,64", "0,63", "0,60"]),
          esup: col(e, ["2,50", "2,48", "2,50", "2,45", "2,50"]),
          eest: col(e, ["50,0", "49,5", "50,0", "48,0", "50,0"]) };
      } },
      { nome: "Cerca com mourões de madeira — cravação rasa e fixação errada (rejeitada)", dados: function () {
        var P = { estIni: "120", estFim: "125", mourao: "madeira" };
        function col(ests, vs) { return vs.map(function (v, i) { return { est: ests[i], pos: "", reg: "", v: v }; }); }
        var e = ["120", "122+10", "125"];
        return { ident: { registro: "OC-099-02", data: "2026-08-19", obra: "Obra C", trecho: "BR-000 — km 70", local: "Divisa LE, est. 120 a 125" },
          params: P, verificacoes: G.verif(C, P, { fixa: { atende: "N", obs: "arame liso no lugar de grampos em mourões de madeira" } }),
          dsup: G.vals([["Amostra 1", "0,11"], ["Amostra 2", "0,09"]]), dest: G.vals([["Esticador 1", "0,16"]]),
          limpeza: col(e, ["1,80", "2,00", "2,00"]),
          psup: col(e, ["0,50", "0,42", "0,50"]),
          pest: col(e, ["0,60", "0,60", "0,55"]),
          esup: col(e, ["2,50", "2,80", "2,50"]),
          eest: col(e, ["50,0", "50,0", "50,0"]) };
      } },
    ],
  });
})();
