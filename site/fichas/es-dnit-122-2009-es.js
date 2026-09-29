/*
 * Ficha de ES: DNIT 122/2009-ES — Pontes e viadutos rodoviários — Estruturas de concreto armado (aparelhos de apoio,
 * juntas, dispositivos de segurança, sobrelaje e acabamentos). Usa FE.aceitacao e FE.aceitacaoG9b.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG9b, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var ID = "dnit-122-2009-es";
  function sob(P) { return P.sobrelaje === "concreto"; }

  var GA = "Aparelhos de apoio (5.3.1; 7.1; 7.2.1)", GJ = "Juntas, segurança e acabamentos (5.1.2 a 5.1.5; 5.3.2 a 5.3.5; 7.2.2)", GS = "Sobrelaje de concreto (5.1.4 a; 5.3.4; 7.2.3)";
  var CRIT = [
    { id: "ap_cert", grupo: GA, texto: "Aparelhos conforme projeto, com certificado de qualidade; elastômero fretado conforme NBR 9783; sem defeitos de fabricação", secao: "5.1.1; 7.1; 7.2.1 a", tipo: "sim_nao" },
    { id: "ap_berco", grupo: GA, texto: "Assentamento em berço liso e horizontal (≈ 5 cm); concreto e fretagem do projeto; acesso para vistoria e substituição", secao: "7.2.1 c–f", tipo: "sim_nao" },
    { id: "ap_folga", grupo: GA, texto: "Folga da área de assentamento", secao: "7.2.1 b", tipo: "valor", unid: "cm", casas: 1, min: 5, exigido: "folgas mínimas de 5 a 10 cm" },
    { id: "ap_livre", grupo: GA, texto: "Ao término: aparelhos em perfeitas condições e livres para os movimentos e rotações de projeto", secao: "5.3.1; 7.2.1 g", tipo: "sim_nao" },
    { id: "freyss", grupo: GA, texto: "Articulação Freyssinet: seção estrangulada de 5 cm a 1/3 da dimensão do pilar; ≥ 5 cm das bordas", secao: "5.3.1", tipo: "sim_nao",
      se: function (P) { return P.freyssinet === "sim"; }, naoAplicaPor: "sem articulação de concreto" },
    { id: "juntas", grupo: GJ, texto: "Juntas estruturais do fabricante, com garantia ≥ 5 anos; lábios poliméricos ou cantoneiras em toda a largura; sem defeitos", secao: "5.1.2; 5.3.2; 7.1; 7.2.2", tipo: "sim_nao" },
    { id: "seg", grupo: GJ, texto: "Guarda-corpos alinhados/nivelados; barreiras padronizadas conforme projeto, com balizadores; sem defeitos", secao: "5.1.3; 5.3.3; 7.2.2", tipo: "sim_nao" },
    { id: "dreno_d", grupo: GJ, texto: "Drenos da pista — diâmetro do tubo de PVC", secao: "5.1.5 a", tipo: "valor", unid: "cm", casas: 1, min: 10,
      freq: { por: "contagem", qtd: function (P) { return 2 * Math.ceil(num(P.compr) / 4); }, a_cada: 1, minimo: 1, regra: "espaçamento ≤ 4 m por meia pista (2 × ⌈comprimento/4⌉)" } },
    { id: "dreno_s", grupo: GJ, texto: "Drenos — saliência da estrutura (ponta em bisel)", secao: "5.1.5 a; 5.3.5 a", tipo: "valor", unid: "cm", casas: 1, min: 10, max: 15,
      exigido: "10 a 15 cm (5.3.5 a; 5.1.5 a pede ≥ 15 cm)" },
    { id: "dreno_e", grupo: GJ, texto: "Drenos — espaçamento por meia pista", secao: "5.1.5 a", tipo: "valor", unid: "m", casas: 1, max: 4 },
    { id: "pinga", grupo: GJ, texto: "Pingadeiras de concreto armado solidárias à laje (≥ 5 cm de altura e ≥ 30 cm de largura; rebaixos não aceitos)", secao: "5.1.5 c; 5.3.5 b", tipo: "sim_nao" },
    { id: "sinal", grupo: GJ, texto: "Sinalização balizadora: catadióptricos nas extremidades e faixas a 45° em guarda-corpos e barreiras", secao: "5.1.5 d", tipo: "sim_nao" },
    { id: "pintura", grupo: GJ, texto: "Pintura só após inspeção detalhada da estrutura; tintas protetoras em meio agressivo", secao: "5.1.5 e", tipo: "sim_nao" },
    { id: "s_sup", grupo: GS, texto: "Laje estrutural áspera (apicoada/jateada), saturada superfície seca no lançamento", secao: "5.3.4", tipo: "sim_nao", se: sob, naoAplicaPor: "sem sobrelaje de concreto" },
    { id: "s_tela", grupo: GS, texto: "Armadura (tela T-283 ou projeto) contínua, à meia altura, a 5 cm dos bordos; juntas coincidentes com as do tabuleiro", secao: "5.3.4", tipo: "sim_nao", se: sob, naoAplicaPor: "sem sobrelaje de concreto" },
    { id: "s_decl", grupo: GS, texto: "Declividade transversal conforme projeto (tangente: a da pista; 2 %)", secao: "5.1.4 a", tipo: "sim_nao", se: sob, naoAplicaPor: "sem sobrelaje de concreto" },
    { id: "s_esp", grupo: GS, texto: "Espessura da sobrelaje (nas extremidades)", secao: "5.1.4 a", tipo: "valor", unid: "cm", casas: 1, min: 7, se: sob, naoAplicaPor: "sem sobrelaje de concreto" },
    { id: "s_cc", grupo: GS, texto: "Consumo de cimento", secao: "5.1.4 a", tipo: "valor", unid: "kg/m³", casas: 0, min: 320, se: sob, naoAplicaPor: "sem sobrelaje de concreto" },
    { id: "s_ac", grupo: GS, texto: "Relação água/cimento", secao: "5.1.4 a", tipo: "valor", casas: 2, max: 0.55, se: sob, naoAplicaPor: "sem sobrelaje de concreto" },
    { id: "s_abat", grupo: GS, texto: "Abatimento", secao: "5.1.4 a", tipo: "valor", unid: "mm", casas: 0, min: 40, max: 60, exigido: "50 ± 10 mm", metodo: "NBR NM 67 (DNER-ME 404)",
      importar: G.imp404, se: sob, naoAplicaPor: "sem sobrelaje de concreto" },
    { id: "s_ar", grupo: GS, texto: "Teor de ar", secao: "5.1.4 a", tipo: "valor", unid: "%", casas: 1, max: 5, metodo: "NBR NM 47", se: sob, naoAplicaPor: "sem sobrelaje de concreto" },
    { id: "s_dmax", grupo: GS, texto: "Dimensão máxima característica do agregado", secao: "5.1.4 a", tipo: "valor", unid: "mm", casas: 1,
      max: function (P) { var e = num(P.espSob); return ok(e) ? Math.min(19, e * 10 / 3) : 19; }, exigido: "≤ 1/3 da espessura e ≤ 19 mm", se: sob, naoAplicaPor: "sem sobrelaje de concreto" },
    { id: "s_jab", grupo: GS, texto: "Juntas serradas — abertura do corte", secao: "5.3.4", tipo: "valor", unid: "mm", casas: 1, min: 3, max: 5, se: sob, naoAplicaPor: "sem sobrelaje de concreto" },
    { id: "s_jprof", grupo: GS, texto: "Juntas serradas — profundidade do corte", secao: "5.3.4", tipo: "valor", unid: "mm", casas: 0, min: 20, exigido: "20 mm (adotado como mínimo)",
      se: sob, naoAplicaPor: "sem sobrelaje de concreto" },
    { id: "fc", grupo: GS, texto: "Resistência à compressão da sobrelaje aos 28 dias — exemplares", secao: "5.1.4 a; 7.2.3", tipo: "valor", unid: "MPa", casas: 1, min: 30,
      importar: G.imp091, metodo: "NBR 5738/5739 (DNER-ME 091)", exigido: "fck ≥ 30 MPa (fck,est pela DNIT 117)", se: sob, naoAplicaPor: "sem sobrelaje de concreto" },
  ];

  var F = A.fichaSimples({
    id: ID, registrar: false,
    titulo: "Pontes e viadutos — estruturas de concreto armado (apoios, juntas, sobrelaje e acabamentos) — aceitação",
    resumo: "Aceitação dos serviços complementares da estrutura de concreto armado pela DNIT 122/2009-ES: aparelhos de apoio (7.2.1 a–g), juntas, dispositivos de segurança e acabamentos (drenos Ø ≥ 10 cm a cada ≤ 4 m, saliência 10 a 15 cm; pingadeiras; sinalização — 5.1.5; 5.3.5; 7.2.2) e sobrelaje de concreto (5.1.4 a: fck ≥ 30 MPa, consumo ≥ 320 kg/m³, abatimento 50 ± 10 mm, ar ≤ 5 %, a/c ≤ 0,55, Dmáx ≤ e/3 e 19 mm, espessura ≥ 7 cm; juntas serradas 3 a 5 mm × 20 mm — 5.3.4). Concreto, armaduras, fôrmas e escoramentos: DNIT 117, 118, 120 e 124.",
    lote: false,
    params: [
      { k: "obra", r: "Obra de arte / trecho", ph: "ex.: ponte sobre o rio A — tabuleiro" },
      { k: "compr", r: "Comprimento do tabuleiro (m)", dica: "para o número mínimo de drenos (≤ 4 m por meia pista)" },
      { k: "freyssinet", r: "Há articulação Freyssinet?", tipo: "select", opcoes: [["nao", "Não"], ["sim", "Sim"]] },
      { k: "sobrelaje", r: "Pista de rolamento (5.1.4)", tipo: "select", opcoes: [["concreto", "Sobrelaje de concreto"], ["asfalto", "Concreto asfáltico (outra ES)"]] },
      { k: "espSob", r: "Espessura de projeto da sobrelaje (cm)", se: function (d) { return (d.params || {}).sobrelaje === "concreto"; } },
      { k: "cond", r: "Condição de preparo do concreto (DNIT 117)", tipo: "select", opcoes: [["A", "A"], ["B", "B"]], se: function (d) { return (d.params || {}).sobrelaje === "concreto"; } },
    ],
    padrao: { freyssinet: "nao", sobrelaje: "concreto", cond: "A" },
    criterios: CRIT,
    refs: { reprova: "7.3", atende: "7.3", regra: "7.3" },
    extra: function (ctx) {
      var P = ctx.P, lf = ctx.item.fc;
      if (lf && lf.situacao !== "nao_exigido") G.avaliarFck(lf, { fck: 30, cond: P.cond, amostragem: "parcial", fonte: "5.1.4 a; resistência avaliada pela DNIT 117, 7.3.1" });
      var dm = ctx.item.s_dmax, e = num(P.espSob);
      if (dm && ok(e)) dm.exigido = "≤ " + fmt(Math.min(19, e * 10 / 3), 1) + " mm (menor entre e/3 = " + fmt(e * 10 / 3, 1) + " mm e 19 mm)";
      if (ok(e) && e < 7) ctx.avisos.push("Espessura de projeto da sobrelaje abaixo de 7 cm (5.1.4 a).");
    },
    notas: "Critérios da DNIT 122/2009-ES. Serviços que não atenderem à ES devem ser rejeitados, corrigidos, complementados ou refeitos (7.3). Sobrelaje: fck ≥ 30 MPa aos 28 dias; a ES (7.2.3) manda controlar a resistência pela DNER-ES 325/97 — aqui avaliada pelo fck,est da DNIT 117/2009-ES (7.3.1), a ES de concreto do mesmo grupo. Profundidade do corte das juntas \"de 20,0 mm\" tomada como mínimo. Drenos: 5.1.5 a pede saliência mínima de 15 cm e 5.3.5 a de 10 a 15 cm — adotado 10 a 15 cm.",
    exemplos: [
      { nome: "Tabuleiro de 40 m com sobrelaje C30 (6 exemplares) — aceito", dados: function () {
        return { ident: { registro: "EST-01", obra: "Obra A — ponte sobre o rio A", camada: "Tabuleiro — apoios, juntas e sobrelaje", data: "2025-09-05" },
          params: { obra: "Ponte sobre o rio A — tabuleiro", compr: "40", freyssinet: "nao", sobrelaje: "concreto", espSob: "8", cond: "A" },
          verificacoes: [{ atende: "S", real: "8" }, { atende: "S", real: "8" }, { atende: "S", real: "8" }, {}, { atende: "S", real: "2" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" },
            { atende: "S" }, { atende: "S" }, { atende: "S" }],
          ap_folga: [{ est: "P1", v: "7" }, { est: "P2", v: "6,5" }],
          dreno_d: "1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20".split(" ").map(function (i) { return { est: "dreno " + i, v: "10" }; }),
          dreno_s: [{ est: "dreno 1", v: "12" }, { est: "dreno 10", v: "13" }], dreno_e: [{ est: "lado direito", v: "4,0" }, { est: "lado esquerdo", v: "3,8" }],
          s_esp: [{ est: "bordo direito", v: "7,5" }, { est: "bordo esquerdo", v: "7,8" }], s_cc: [{ est: "traço", v: "350" }], s_ac: [{ est: "traço", v: "0,48" }],
          s_abat: [{ est: "caminhão 1", v: "50" }, { est: "caminhão 2", v: "55" }, { est: "caminhão 3", v: "45" }], s_ar: [{ est: "caminhão 1", v: "3,5" }],
          s_dmax: [{ est: "brita 1", v: "19" }], s_jab: [{ est: "junta 1", v: "4" }, { est: "junta 2", v: "4" }], s_jprof: [{ est: "junta 1", v: "22" }, { est: "junta 2", v: "21" }],
          fc: [["E1", "33,8"], ["E2", "35,1"], ["E3", "32,9"], ["E4", "36,4"], ["E5", "34,2"], ["E6", "33,5"]].map(function (x) { return { est: "sobrelaje", pos: x[0], v: x[1] }; }) };
      } },
      { nome: "Aparelho de apoio travado, drenos curtos e sobrelaje com a/c e espessura fora — rejeitado", dados: function () {
        var d = { ident: { registro: "EST-02", obra: "Obra B — viaduto", camada: "Tabuleiro — apoios, drenos e sobrelaje", data: "2025-10-20" },
          params: { obra: "Viaduto B — tabuleiro", compr: "24", freyssinet: "nao", sobrelaje: "concreto", espSob: "7", cond: "A" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { real: "6", nc: "1", obs: "aparelho do apoio P2 com rotação impedida por nata" }, {}, { atende: "S" }, { atende: "S" }, { atende: "N", obs: "pingadeira por rebaixo" }, { atende: "S" }, { atende: "S" },
            { atende: "S" }, { atende: "S" }, { atende: "S" }],
          ap_folga: [{ est: "P1", v: "6" }, { est: "P2", v: "4" }],
          dreno_d: [{ est: "dreno 1", v: "10" }, { est: "dreno 2", v: "7,5" }],
          dreno_s: [{ est: "dreno 1", v: "6" }, { est: "dreno 2", v: "11" }], dreno_e: [{ est: "lado direito", v: "6,0" }],
          s_esp: [{ est: "bordo direito", v: "6,2" }, { est: "bordo esquerdo", v: "7,1" }], s_cc: [{ est: "traço", v: "330" }], s_ac: [{ est: "traço", v: "0,60" }],
          s_ar: [{ est: "caminhão 1", v: "4,0" }], s_dmax: [{ est: "brita 1", v: "25" }], s_jab: [{ est: "junta 1", v: "4" }], s_jprof: [{ est: "junta 1", v: "15" }] };
        A.exemplos.importar(FE.FICHAS[ID].params, d, "imp_s_abat", [["dner-me-404-00", 1]]);
        A.exemplos.importar(FE.FICHAS[ID].params, d, "imp_fc", [["dner-me-091-98", 2]]);
        return d;
      } },
    ],
  });
  G.registrar(F, ID);
})();
