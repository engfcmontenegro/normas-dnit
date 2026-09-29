/*
 * Ficha de ES: DNIT 090/2006-ES — Patologias do concreto (recuperação de elementos deteriorados).
 * Usa FE.aceitacao (es-comum.js) e FE.aceitacaoG9a (es-dnit-079-2006-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG9a, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var ID = "dnit-090-2006-es";

  function pat(v) { return function (P) { return P.patologia === v; }; }
  // fck exigido: campo digitado ou o da patologia (4.1.1: ≥ 28 MPa; 4.1.2/6.2: 40 MPa; 8/11: 30 MPa)
  var FCK = { abrasao: [28, "4.1.1"], erosao: [40, "4.1.2; 6.2"] };
  function fckDe(P) { var f = num(P.fck); return ok(f) ? f : (FCK[P.patologia] || [30])[0]; }
  function secFck(P) { return ok(num(P.fck)) ? "projeto" : (FCK[P.patologia] || [0, "8 h, l, m"])[1]; }
  function comConcreto(P) { return P.concreto === "sim"; }

  var pc = G.paramsConcreto({ se: comConcreto, rotuloFck: "fck de projeto (MPa) — vazio: o da ES para a patologia",
    dicaFck: "abrasão: ≥ 28 MPa (4.1.1); erosão: 40 MPa aos 28 dias (4.1.2; 6.2); demais recomposições: 30 MPa (8 h, l, m)" });

  A.fichaSimples({
    id: ID,
    titulo: "Recuperação de patologias do concreto — aceitação",
    resumo: "Recuperação conforme a patologia (seções 6 e 7): abrasão (argamassa enriquecida; concreto ≥ 28 MPa), erosão (concreto projetado de 40 MPa aos 28 dias), cavitação (causas " +
      "eliminadas), fogo (estabilidade e escoramento), eflorescência (solução ácida diluída em áreas ≤ 0,5 m², com saturação prévia, espera de 5 min e lavagem com água pura), " +
      "sulfatos (a/c ≤ 0,45, consumo ≥ 370 kg/m³, cimento resistente a sulfatos), álcali-agregado e magnésio. Acompanhamento constante de engenheiro; não conformes refeitos (10).",
    rotuloLink: "Aceitação do serviço",
    lote: false,
    params: [
      { k: "patologia", r: "Patologia tratada", tipo: "select", recarrega: true,
        opcoes: [["abrasao", "Desgaste por abrasão (6.1)"], ["erosao", "Desgaste por erosão (6.2)"], ["cavitacao", "Desgaste por cavitação (6.3)"], ["fogo", "Ação do fogo (6.5)"],
          ["eflorescencia", "Eflorescência (7.4)"], ["sulfato", "Ataque por sulfatos (7.5.1)"], ["raa", "Reação álcali-agregado (7.5.2)"], ["magnesio", "Sais de magnésio / sais de cálcio (7.1 a 7.3)"]] },
      { k: "concreto", r: "Houve concretagem ou concreto projetado? (8 h, l, m)", tipo: "select", recarrega: true, opcoes: G.SIMNAO },
      { k: "area", r: "Área tratada (m²)" },
    ].concat(pc),
    padrao: Object.assign({ patologia: "abrasao", concreto: "nao" }, G.padraoConcreto),
    textos: G.textos("Serviço não conforme: deve ser refeito antes do prosseguimento dos serviços (10)."),
    criterios: [
      G.itEngenheiro("9; 10", "Geral"),
      G.itSinalizacao("8 a, b", "Geral"),
      G.itPlataforma("8 c", "Geral"),
      { id: "abrPrep", grupo: "Abrasão", texto: "Superfície escarificada e área afetada alargada; reposição com argamassa de cimento enriquecida (microsílica, acrílico, látex ou epóxi)",
        secao: "6.1", tipo: "sim_nao", se: pat("abrasao"), naoAplicaPor: "outra patologia" },
      { id: "eroPrep", grupo: "Erosão", texto: "Limpeza com jatos de areia e água; concreto projetado de alta dureza e baixa a/c", secao: "6.2", tipo: "sim_nao", se: pat("erosao"), naoAplicaPor: "outra patologia" },
      { id: "cavit", grupo: "Cavitação", texto: "Causas eliminadas (desalinhamentos, mudanças bruscas de declividade)", secao: "6.3", tipo: "sim_nao", se: pat("cavitacao"), naoAplicaPor: "outra patologia" },
      { id: "fogo", grupo: "Fogo", texto: "Estabilidade verificada e escoramento; decisão com temperatura, duração e análise de corpos de prova extraídos", secao: "6.5", tipo: "sim_nao",
        se: pat("fogo"), naoAplicaPor: "outra patologia" },
      { id: "eflTeste", grupo: "Eflorescência", texto: "Solução ácida diluída conforme 7.4 a–c, testada antes em pequena área não contaminada", secao: "7.4", tipo: "sim_nao", se: pat("eflorescencia"), naoAplicaPor: "outra patologia" },
      { id: "eflSat", grupo: "Eflorescência", texto: "Superfície saturada com água pura antes da solução e lavada com água pura logo após a remoção", secao: "7.4 a, d", tipo: "sim_nao",
        se: pat("eflorescencia"), naoAplicaPor: "outra patologia" },
      { id: "eflArea", grupo: "Eflorescência", texto: "Área por aplicação da solução ácida", secao: "7.4 b", tipo: "valor", unid: "m²", casas: 2, max: 0.5, se: pat("eflorescencia"), naoAplicaPor: "outra patologia" },
      { id: "eflTempo", grupo: "Eflorescência", texto: "Espera antes da escovação", secao: "7.4 c", tipo: "valor", unid: "min", casas: 0, min: 5, falha: "ressalva", exigido: "5 min",
        se: pat("eflorescencia"), naoAplicaPor: "outra patologia" },
      { id: "sulfAc", grupo: "Sulfatos", texto: "Relação água/cimento do concreto de proteção", secao: "7.5.1", tipo: "valor", unid: "", casas: 2, max: 0.45, se: pat("sulfato"), naoAplicaPor: "outra patologia" },
      { id: "sulfCons", grupo: "Sulfatos", texto: "Consumo de cimento", secao: "7.5.1", tipo: "valor", unid: "kg/m³", casas: 0, min: 370, se: pat("sulfato"), naoAplicaPor: "outra patologia" },
      { id: "sulfRS", grupo: "Sulfatos", texto: "Cimento Portland resistente a sulfatos e camada protetora de concreto", secao: "7.5.1", tipo: "sim_nao", se: pat("sulfato"), naoAplicaPor: "outra patologia" },
      { id: "raa", grupo: "Álcali-agregado", texto: "Reação identificada em laboratório; trincas tratadas com argamassa fraca e injeção de epóxi só após 3 a 5 anos", secao: "7.5.2", tipo: "sim_nao",
        se: pat("raa"), naoAplicaPor: "outra patologia" },
      { id: "magnesio", grupo: "Sais de magnésio / cálcio", texto: "Trincas tratadas; revestimento com concreto de alta resistência, pouco poroso, com microsílica; pinturas impermeabilizantes quando for o caso",
        secao: "7.1 a 7.3", tipo: "sim_nao", se: pat("magnesio"), naoAplicaPor: "outra patologia" },
    ].concat(G.itensConcreto({ se: comConcreto, secao: "4.1; 6; 8", grupo: "Concreto" })).concat([G.itManejo("8 q")]),
    extra: function (ctx) {
      G.extraConcreto(ctx, { fck: fckDe, secao: secFck(ctx.P) });
      G.ajustarFreq(ctx);
    },
    notas: "Critérios da DNIT 090/2006-ES. fck: vazio = o da ES para a patologia — abrasão ≥ 28 MPa (4.1.1); erosão 40 MPa aos 28 dias (4.1.2; 6.2, embora 8 e 11 listem " +
      "concreto projetado de 30 MPa); demais recomposições 30 MPa (8 h, l, m). Espera de 5 min na eflorescência (7.4 c) tomada como mínima (menos: ressalva)." + G.notaConcreto,
    exemplos: [
      { nome: "Erosão em pilar recuperada com concreto projetado de 40 MPa — aceito", dados: function () {
        var d = { ident: { registro: "PAT-01", obra: "Obra A", local: "Ponte sobre o rio A — pilares P2 e P3 (nível d'água)", data: "2025-07-30" },
          params: { patologia: "erosao", concreto: "sim", area: "18", fck: "", condPreparo: "A", amostragem: "parcial", volConc: "3,2" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, {}, { atende: "S" }, {}, {}, {}, {}, {}, {}, {}, { atende: "S" }],
          fc: G.fcTabela(["44,2", "45,8", "43,5", "46,1", "44,9", "45,3"], "P2/P3") };
        return d;
      } },
      { nome: "Eflorescência em áreas grandes e concreto de recomposição fraco — não conforme", dados: function () {
        return { ident: { registro: "PAT-02", obra: "Obra B", local: "Viaduto B — face inferior da laje", data: "2025-09-18" },
          params: { patologia: "eflorescencia", concreto: "sim", area: "12", fck: "", condPreparo: "A", amostragem: "parcial", volConc: "1,5" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, {}, {}, {}, {}, { atende: "S" }, { real: "4", nc: "0" }, {}, {}, {}, { atende: "S" }],
          eflArea: [{ est: "área 1", v: "0,40" }, { est: "área 2", v: "0,50" }, { est: "área 3", v: "1,20" }],
          eflTempo: [{ est: "área 1", v: "5" }, { est: "área 2", v: "5" }, { est: "área 3", v: "3" }],
          fc: G.fcTabela(["31,0", "29,5"], "recomposição") };
      } },
    ],
  });
})();
