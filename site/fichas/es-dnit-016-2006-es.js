/*
 * DNIT 016/2006-ES — Drenagem — Drenos sub-superficiais — aceitação do serviço.
 * Usa FE.aceitacao.fichaSimples via FE.drenagemES (definido em es-dnit-015-2006-es.js, carregado antes).
 * A ES não tem concreto nem controle estatístico: materiais (5.1), execução (5.3) e verificação do produto (7.3), em que
 * "caso se apresentem em desacordo com esta Norma ou com as tolerâncias indicadas, os serviços serão recusados, devendo ser refeitos".
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, D = FE.drenagemES;
  var G = { MAT: "Materiais (5.1)", EXE: "Execução (4 e 5.3)", PRO: "Verificação do produto (7.3)", AMB: "Manejo ambiental (6)" };
  function S(id, texto, secao, grupo, exigido, extra) { return D.sn(id, texto, secao, grupo, exigido, extra); }
  function tubo(P) { return P.tipo !== "cego"; }
  function manta(P) { return P.tipo === "manta" || P.tipo === "cego"; }
  var CRIT = [
    S("drenante", "Material drenante: natural ou britado, rocha sã, isento de impurezas e torrões de argila; granulometria e permeabilidade do projeto", "5.1 / 5.1.1", G.MAT,
      "ensaios de textura e granulometria; não colmatável, permeável e compatível com os furos dos tubos"),
    S("filtrante", "Material filtrante (areia quartzosa) com granulometria aprovada previamente por ensaios", "5.1.2", G.MAT,
      "isento de impurezas orgânicas e torrões de argila; granulometria aprovada", { se: function (P) { return P.tipo === "granular"; } }),
    S("manta", "Manta sintética / geotêxtil não tecido com permeabilidade e espessura do projeto", "5.1.2 / 5.1.4", G.MAT,
      "especificação do fabricante; se não prevista no projeto, estudo específico prévio", { se: manta }),
    S("tubos", "Tubos perfurados / porosos conforme ABNT, DNIT 093-EM (PEAD) e ASTM C444 (concreto perfurado); PVC pela NBR 7362 / 7367", "5.1.3", G.MAT,
      "dimensões, perfurações, resistência e posicionamento do projeto; sem defeitos", { se: tubo }),
    S("rejunte", "Rejuntamento com argamassa de cimento e areia 1:4 em massa", "5.1.5", G.MAT, "traço 1:4 em massa (DNER-ES 330)",
      { se: function (P) { return P.rejunte === "sim"; } }),
    // execução
    S("valas", "Valas abertas nas dimensões do projeto-tipo, de jusante para montante (longitudinais) ou na reta de maior declive (transversais)", "5.3 a–c", G.EXE,
      "dimensões e posição do projeto"),
    { id: "decl", texto: "Declividade longitudinal do fundo da vala", secao: "5.3 d", grupo: G.EXE, tipo: "valor", unid: "%", casas: 2, min: 1, metodo: "topografia" },
    { id: "cota", texto: "Variação de cota do berço (antes da colocação dos tubos)", secao: "7.3", grupo: G.EXE, tipo: "valor", unid: "cm", casas: 1, min: -1, max: 1,
      exigido: "|variação| ≤ 1 cm", metodo: "topografia / gabarito", se: tubo },
    S("fundo", "Camada de 10 cm de material filtrante/drenante compactada no fundo da vala", "5.3.1 a / 5.3.2.1 b", G.EXE, "10 cm compactados antes do tubo"),
    { id: "camada", texto: "Espessura das camadas de enchimento da vala", secao: "5.3 i / 5.3.1 c / 5.3.2.1 d", grupo: G.EXE, tipo: "valor", unid: "cm", casas: 0, max: 30,
      exigido: "≤ 30 cm, camadas de igual espessura", metodo: "medida direta" },
    S("compact", "Preenchimento de montante para jusante, na umidade do projeto, adensado com rolo ou placa vibratória; integridade dos tubos", "5.3 h, i / 5.3.1 d", G.EXE,
      "camadas adensadas sem danificar os tubos"),
    S("envolv", "Material de envolvimento lançado em camadas, antes do material de preenchimento, em segmentos de mesma espessura", "7.3", G.EXE, "sequência e espessuras conforme 7.3"),
    { id: "sobrep", texto: "Sobreposição longitudinal da manta nas emendas", secao: "5.3.2.1 f", grupo: G.EXE, tipo: "valor", unid: "cm", casas: 0,
      min: function (P) { return P.costura === "sim" ? 20 : 50; }, exigido: "≥ 20 cm com costura; ≥ 50 cm sem costura", se: manta },
    S("grampos", "Manta fixada com grampos de 5 mm em U; dobragem e costura com sobreposição transversal de cerca de 20 cm", "5.3.2.1 a, e", G.EXE,
      "grampos de ferro de 5 mm; sobreposição transversal ≈ 20 cm", { se: manta }),
    S("tubosInsp", "Tubos: sem peças quebradas ou rachadas nem de lotes com ensaios insatisfatórios; colocados só após inspeção da vala e compactação do berço", "7.3", G.EXE,
      "tubos íntegros e de lotes aprovados", { se: tubo }),
    S("tampao", "Tubos tamponados e camadas protegidas até o reaterro", "4 / 7.3", G.EXE, "tamponamento durante toda a construção", { se: tubo }),
    S("vistoria", "Vistoria e comprovação da operacionalidade (inspeção visual) antes do fechamento das valas", "4", G.EXE, "fechamento só após a vistoria"),
    S("saidas", "Bocas de saída dos tubos de condução em seção de aterro (ou descarga em caixa coletora / dreno profundo)", "5.3.2.2", G.EXE, "conforme projeto"),
    // produto
    S("geom", "Alinhamentos e profundidades conforme Notas de Serviço (topografia e gabarito)", "7.3", G.PRO, "conforme projeto / Notas de Serviço"),
    S("materiais", "Todos os materiais conforme as especificações próprias", "7.3", G.PRO, "especificações de cada material"),
    S("amb", "Manejo ambiental: excedentes removidos, proteção nos deságues, posicionamento e deságues conforme projeto", "6", G.AMB, "itens a) a g) do capítulo 6"),
  ];

  var F = D.montar({
    id: "dnit-016-2006-es",
    titulo: "Drenos sub-superficiais — aceitação do serviço",
    resumo: "Controle da DNIT 016/2006-ES: materiais drenante e filtrante, tubos e manta (5.1), execução — declividade ≥ 1 %, camadas ≤ 30 cm, " +
      "sobreposição da manta (5.3) — e verificação do produto: variação de cota do berço ≤ 1 cm, alinhamentos e profundidades (7.3).",
    lote: { largura: false },
    refs: { reprova: "7.3", atende: "7.3", regra: "7.3" },
    params: [
      { k: "tipo", r: "Tipo de dreno", tipo: "select", recarrega: true,
        opcoes: [["granular", "Dreno com tubo e filtro granular (5.3.1)"], ["manta", "Dreno tubular com filtro de manta (5.3.2.1)"], ["cego", "Dreno cego com manta (5.3.2.2)"]] },
      { k: "costura", r: "Emendas longitudinais da manta costuradas?", tipo: "select", recarrega: true, se: function (d) { return manta(d.params || {}); },
        opcoes: [["sim", "Sim (≥ 20 cm)"], ["nao", "Não (≥ 50 cm)"]] },
      { k: "rejunte", r: "Há rejuntamento com argamassa?", tipo: "select", recarrega: true, opcoes: [["nao", "Não"], ["sim", "Sim"]] },
    ],
    padrao: { tipo: "granular", costura: "sim", rejunte: "nao" },
    criterios: CRIT,
    notas: "Critérios da DNIT 016/2006-ES. Valores medidos avaliados individualmente: declividade do fundo da vala ≥ 1 % (5.3 d); variação de cota do berço ≤ 1 cm (7.3); " +
      "camadas de enchimento ≤ 30 cm (5.3 i, 5.3.1 c, 5.3.2.1 d); sobreposição longitudinal da manta ≥ 20 cm com costura ou ≥ 50 cm sem costura (5.3.2.1 f). " +
      "Serviços em desacordo com a Norma ou com as tolerâncias são recusados e refeitos (7.3). A ES não fixa frequência de ensaios: o plano da qualidade da obra define (7.1, 7.2).",
  });

  function V(mapa) { return D.verificacoes(CRIT, mapa); }
  F.exemplos = [
    { nome: "Dreno longitudinal raso com tubo PEAD e filtro de areia — segmento aceito", dados: function () {
      return {
        ident: { registro: "LOTE-DSS-01", obra: "Obra A", trecho: "BR-000 — pista direita", camada: "Dreno longitudinal raso de base", data: "2026-04-22" },
        params: { estIni: "210", estFim: "225", tipo: "granular", rejunte: "nao" },
        verificacoes: V({ tubosInsp: { real: "15", nc: "0" }, vistoria: { real: "3", nc: "0" }, geom: { real: "16", nc: "0" } }),
        decl: [{ est: "212", v: "1,35" }, { est: "216", v: "1,20" }, { est: "220", v: "1,10" }, { est: "224", v: "1,42" }],
        cota: [{ est: "212", v: "0,5" }, { est: "216", v: "-0,8" }, { est: "220", v: "0,3" }, { est: "224", v: "-0,4" }],
        camada: [{ est: "214", pos: "1ª camada", v: "25" }, { est: "214", pos: "2ª camada", v: "25" }, { est: "222", pos: "1ª camada", v: "28" }, { est: "222", pos: "2ª camada", v: "27" }],
      };
    } },
    { nome: "Dreno tubular com manta — declividade, cota do berço e sobreposição fora (rejeitado)", dados: function () {
      return {
        ident: { registro: "LOTE-DSS-02", obra: "Obra B", trecho: "BR-000 — pista esquerda", camada: "Dreno longitudinal raso de base", data: "2026-05-06" },
        params: { estIni: "50", estFim: "58", tipo: "manta", costura: "nao", rejunte: "nao" },
        verificacoes: V({ tubosInsp: { real: "8", nc: "0" }, vistoria: { real: "2", nc: "0" }, geom: { real: "9", nc: "0" } }),
        decl: [{ est: "51", v: "1,15" }, { est: "54", v: "0,80" }, { est: "57", v: "1,05" }],
        cota: [{ est: "51", v: "0,6" }, { est: "54", v: "1,5" }, { est: "57", v: "-0,7" }],
        camada: [{ est: "53", pos: "1ª camada", v: "30" }, { est: "53", pos: "2ª camada", v: "30" }],
        sobrep: [{ est: "52", pos: "emenda 1", v: "55" }, { est: "56", pos: "emenda 2", v: "35" }],
      };
    } },
  ];
})();
