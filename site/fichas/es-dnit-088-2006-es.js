/*
 * Ficha de ES: DNIT 088/2006-ES — Recuperação de guarda-rodas, guarda-corpos e barreiras.
 * Usa FE.aceitacao (es-comum.js) e FE.aceitacaoG9a (es-dnit-079-2006-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG9a, num = FE.num, ok = FE.ok, fmt = FE.fmt;

  function usa(k) { return function (P) { return P[k] === "sim"; }; }
  // sistemas de pintura de 5.2.2: [primer (demãos × µm), acabamento (demãos × µm), preparo]
  var PINT = {
    pouco: { primer: [2, 30], acab: [2, 30], prep: "lixamento ou limpeza com solventes (St 1 ou SP 1)", nome: "pouco agressivo — primer alquídico + esmalte sintético" },
    agressivo: { primer: [1, 120], acab: [2, 40], prep: "jato abrasivo quase branco Sa 2 ½", nome: "agressivo — primer epoxídico + esmalte epoxídico" },
    muito: { primer: [1, 120], acab: [1, 120], prep: "jato abrasivo quase branco Sa 2 ½", nome: "muito agressivo — primer epoxídico + esmalte epoxídico" },
  };
  function sis(P) { return PINT[P.ambiente] || PINT.pouco; }
  function ePrimer(P) { var s = sis(P); return s.primer[0] * s.primer[1]; }
  function eTotal(P) { var s = sis(P); return ePrimer(P) + s.acab[0] * s.acab[1]; }

  A.fichaSimples({
    id: "dnit-088-2006-es",
    titulo: "Recuperação de guarda-rodas, guarda-corpos e barreiras — aceitação",
    resumo: "Guarda-rodas: anomalias corrigidas com argamassa de cimento e areia 1:3 e inclusão de pingadeiras (5.1); aliviados: atenção ao concreto e à armadura da face interna (5.1.2). " +
      "Guarda-corpos de concreto: substituição por peças padrão DNIT (5.2.1); metálicos: sistema de pintura conforme a agressividade do meio — preparo e espessura de película seca " +
      "por demão (5.2.2). Barreiras New Jersey: recuperação ou substituição de trechos muito deteriorados (5.3). Serviço não conforme é refeito (7).",
    rotuloLink: "Aceitação do serviço",
    lote: false,
    params: [
      { k: "gr", r: "Recuperação de guarda-rodas (5.1)", tipo: "select", recarrega: true, opcoes: G.SIMNAO },
      { k: "aliviado", r: "Guarda-rodas de 0,90 m com peso aliviado? (5.1.2)", tipo: "select", recarrega: true, opcoes: G.SIMNAO, se: function (d) { return (d.params || {}).gr === "sim"; } },
      { k: "gcc", r: "Guarda-corpos de concreto (5.2.1)", tipo: "select", recarrega: true, opcoes: G.SIMNAO },
      { k: "gcm", r: "Guarda-corpos metálicos — pintura (5.2.2)", tipo: "select", recarrega: true, opcoes: G.SIMNAO },
      { k: "ambiente", r: "Agressividade do meio (5.2.2)", tipo: "select", recarrega: true, se: function (d) { return (d.params || {}).gcm === "sim"; },
        opcoes: [["pouco", "Pouco agressivo (a)"], ["agressivo", "Agressivo (b)"], ["muito", "Muito agressivo (c)"]] },
      { k: "barreira", r: "Recuperação de barreiras New Jersey (5.3)", tipo: "select", recarrega: true, opcoes: G.SIMNAO },
      { k: "extensao", r: "Extensão recuperada (m)", dica: "critério de medição (8)" },
    ],
    padrao: { gr: "sim", aliviado: "nao", gcc: "nao", gcm: "nao", ambiente: "pouco", barreira: "nao" },
    textos: G.textos("Etapa não conforme: os serviços considerados não conformes devem ser refeitos (7)."),
    criterios: [
      G.itPlataforma("8 a", "Acesso"),
      G.itSinalizacao("8 b", "Acesso"),
      { id: "argamassa", grupo: "Guarda-rodas", texto: "Trincas, quebras e desgastes corrigidos com argamassa de cimento e areia 1:3, colher de pedreiro e acabamento", secao: "5.1.1", tipo: "sim_nao",
        se: usa("gr"), naoAplicaPor: "sem guarda-rodas" },
      { id: "pingadeira", grupo: "Guarda-rodas", texto: "Pingadeiras em placas pré-moldadas incluídas na recuperação (DNIT 089/2006-ES)", secao: "5.1.1; 5.1.2", tipo: "sim_nao",
        se: usa("gr"), naoAplicaPor: "sem guarda-rodas" },
      { id: "faceInt", grupo: "Guarda-rodas", texto: "Estado do concreto e da armadura (corrosão, ancoragem) da face interna junto à pista verificado e tratado", secao: "5.1.2", tipo: "sim_nao",
        se: function (P) { return P.gr === "sim" && P.aliviado === "sim"; }, naoAplicaPor: "guarda-rodas maciço" },
      { id: "gcConc", grupo: "Guarda-corpos de concreto", texto: "Peças com corrosão generalizada ou quebradas recuperadas ou substituídas (preferência: peças padrão DNIT de estoque)", secao: "5.2.1",
        tipo: "sim_nao", se: usa("gcc"), naoAplicaPor: "sem guarda-corpo de concreto" },
      { id: "preparo", grupo: "Guarda-corpos metálicos", texto: "Preparação de superfície do sistema de pintura", secao: "5.2.2", tipo: "sim_nao", se: usa("gcm"), naoAplicaPor: "sem guarda-corpo metálico" },
      { id: "demaos", grupo: "Guarda-corpos metálicos", texto: "Número de demãos e produtos (primer e esmalte) do sistema", secao: "5.2.2", tipo: "sim_nao", se: usa("gcm"), naoAplicaPor: "sem guarda-corpo metálico" },
      { id: "epsPrimer", grupo: "Guarda-corpos metálicos", texto: "Espessura de película seca do primer", secao: "5.2.2", tipo: "valor", unid: "µm", casas: 0,
        min: ePrimer, metodo: "medidor de espessura de película seca", se: usa("gcm"), naoAplicaPor: "sem guarda-corpo metálico", freq: { por: "lote", minimo: 3 } },
      { id: "epsTotal", grupo: "Guarda-corpos metálicos", texto: "Espessura de película seca total (primer + esmalte)", secao: "5.2.2", tipo: "valor", unid: "µm", casas: 0,
        min: eTotal, metodo: "medidor de espessura de película seca", se: usa("gcm"), naoAplicaPor: "sem guarda-corpo metálico", freq: { por: "lote", minimo: 3 } },
      { id: "barreiras", grupo: "Barreiras", texto: "Trincas, corrosão e desplacamentos recuperados; trechos muito deteriorados substituídos integralmente", secao: "5.3", tipo: "sim_nao",
        se: usa("barreira"), naoAplicaPor: "sem barreiras" },
      G.itManejo("6", "Detritos coletados e encaminhados a locais predeterminados"),
    ],
    extra: function (ctx) {
      var P = ctx.P, s = sis(P);
      ["preparo", "demaos"].forEach(function (id) {
        var l = ctx.item[id];
        if (l && l.situacao !== "nao_exigido") l.exigido = id === "preparo" ? s.prep : s.primer[0] + " demão(ões) de primer × " + s.primer[1] + " µm + " + s.acab[0] + " de esmalte × " + s.acab[1] + " µm";
      });
      var a = ctx.item.epsPrimer, b = ctx.item.epsTotal;
      if (a && a.situacao !== "nao_exigido") a.exigido = "≥ " + s.primer[0] + " × " + s.primer[1] + " = " + fmt(ePrimer(P), 0) + " µm";
      if (b && b.situacao !== "nao_exigido") b.exigido = "≥ " + fmt(ePrimer(P), 0) + " + " + s.acab[0] + " × " + s.acab[1] + " = " + fmt(eTotal(P), 0) + " µm";
      ctx.freqs.forEach(function (f) { if (/película/.test(f.ensaio)) f.regra = "mín. 3 leituras (a ES não fixa)"; });
      if (["gr", "gcc", "gcm", "barreira"].every(function (k) { return P[k] !== "sim"; })) ctx.avisos.push("Marque ao menos um dispositivo recuperado.");
      G.ajustarFreq(ctx);
    },
    notas: "Critérios da DNIT 088/2006-ES. Espessuras de película seca de 5.2.2 por demão; a ficha confere a espessura acumulada após o primer e a total do sistema (pouco agressivo: 60 e 120 µm; " +
      "agressivo: 120 e 200 µm; muito agressivo: 120 e 240 µm), como mínimos. A ES não fixa o número de leituras: adotam-se ao menos 3 por serviço. Acompanhamento contínuo, conformidade " +
      "julgada em cada etapa; não conformes são refeitos (7).",
    exemplos: [
      { nome: "Guarda-rodas de 0,50 m e guarda-corpo metálico em meio agressivo — aceito", dados: function () {
        return { ident: { registro: "GR-01", obra: "Obra A", local: "Ponte sobre o rio A — lado direito", data: "2025-05-27" },
          params: { gr: "sim", aliviado: "nao", gcc: "nao", gcm: "sim", ambiente: "agressivo", barreira: "nao", extensao: "85" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, {}, {}, { atende: "S", obs: "Sa 2 ½" }, { atende: "S" }, {}, { atende: "S" }],
          epsPrimer: [{ est: "painel 1", v: "130" }, { est: "painel 4", v: "125" }, { est: "painel 8", v: "140" }],
          epsTotal: [{ est: "painel 1", v: "215" }, { est: "painel 4", v: "208" }, { est: "painel 8", v: "230" }] };
      } },
      { nome: "Guarda-rodas aliviado sem tratar a face interna e pintura fina — não conforme", dados: function () {
        return { ident: { registro: "GR-02", obra: "Obra B", local: "Viaduto B — lado esquerdo", data: "2025-08-14" },
          params: { gr: "sim", aliviado: "sim", gcc: "nao", gcm: "sim", ambiente: "muito", barreira: "nao", extensao: "60" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { real: "3", nc: "1", obs: "armadura corroída exposta no trecho 2" }, {},
            { atende: "S" }, { atende: "S" }, {}, { atende: "S" }],
          epsPrimer: [{ est: "painel 2", v: "125" }, { est: "painel 5", v: "118" }, { est: "painel 9", v: "130" }],
          epsTotal: [{ est: "painel 2", v: "250" }, { est: "painel 5", v: "225" }, { est: "painel 9", v: "246" }] };
      } },
    ],
  });
})();
