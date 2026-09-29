/*
 * Ficha de ES: DNIT 083/2006-ES — Tratamento de trincas e fissuras.
 * Usa FE.aceitacao (es-comum.js) e FE.aceitacaoG9a (es-dnit-079-2006-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG9a, num = FE.num, ok = FE.ok, fmt = FE.fmt;

  function tipo(v) { return function (P) { return P.trinca === v; }; }

  A.fichaSimples({
    id: "dnit-083-2006-es",
    titulo: "Tratamento de trincas e fissuras — aceitação",
    resumo: "Mapeamento e classificação das trincas (4; 5.1); no concreto armado toda fissura com abertura ≥ 0,3 mm deve ser tratada e, no protendido, qualquer fissura (3). " +
      "Trincas passivas: limpeza, secagem, selagem, furos a cada 10 a 30 cm com tubos de ponta saliente de 10 cm, injeção sequencial de epóxi e acabamento (5.4); ativas: " +
      "monitoramento e junta móvel com selante (5.2); especiais: estudo especial (5.3). Etapa não conforme paralisa os serviços (7.2).",
    rotuloLink: "Aceitação do serviço",
    lote: false,
    params: [
      { k: "estrutura", r: "Elemento (3)", tipo: "select", recarrega: true, opcoes: [["armado", "Concreto armado"], ["protendido", "Concreto protendido"]] },
      { k: "trinca", r: "Tipo de trinca tratada", tipo: "select", recarrega: true,
        opcoes: [["passiva", "Passiva — injeção de epóxi (5.4)"], ["ativa", "Ativa — junta móvel com selante (5.2)"], ["especial", "Especial — corrosão, reação álcali-agregado, cloretos (5.3)"]] },
      { k: "larguraJunta", r: "Largura calculada da junta móvel (mm)", se: function (d) { return (d.params || {}).trinca === "ativa"; },
        dica: "para absorver a amplitude monitorada (5.2 c) — a ES fala em \"comprimento\"" },
      { k: "extensao", r: "Extensão de trincas tratadas (m)", dica: "critério de medição (8 c)" },
      { k: "nTrincas", r: "Nº de trincas tratadas", dica: "o espaçamento dos furos é conferido em cada trinca" },
    ],
    padrao: { estrutura: "armado", trinca: "passiva", nTrincas: "1" },
    textos: G.textos("Etapa não conforme: os serviços são paralisados e só retomados após a eliminação dos serviços não conformes (7.2)."),
    criterios: [
      { id: "projeto", grupo: "Projeto", texto: "Inspeção preliminar; projeto com mapeamento das trincas e tipo de tratamento", secao: "5.1; 7.1 a", tipo: "sim_nao" },
      { id: "classif", grupo: "Projeto", texto: "Trincas classificadas em ativas ou passivas, com as causas conhecidas", secao: "4", tipo: "sim_nao" },
      { id: "abertura", grupo: "Projeto", texto: "Abertura das fissuras deixadas sem tratamento", secao: "3", tipo: "valor", unid: "mm", casas: 2,
        max: function (P) { return P.estrutura === "protendido" ? 0 : 0.2999; }, metodo: "fissurômetro",
        exigido: undefined, freq: { por: "lote", minimo: 0 } },
      G.itPlataforma("5.1; 7.1 b"),
      G.itSinalizacao("5.1; 7.1 c"),
      { id: "produto", grupo: "Trincas passivas", texto: "Produtos do projeto; operador ou empresa com experiência reconhecida", secao: "5.4 a", tipo: "sim_nao", se: tipo("passiva"), naoAplicaPor: "trinca não passiva" },
      { id: "limpeza", grupo: "Trincas passivas", texto: "Trinca limpa de contaminantes (jato de água) e seca (jato de ar)", secao: "5.4 b, c; 7.1 d", tipo: "sim_nao", se: tipo("passiva"), naoAplicaPor: "trinca não passiva" },
      { id: "selagem", grupo: "Trincas passivas", texto: "Superfícies da trinca seladas contra vazamento do epóxi", secao: "5.4 d; 7.1 e", tipo: "sim_nao", se: tipo("passiva"), naoAplicaPor: "trinca não passiva" },
      { id: "espFuros", grupo: "Trincas passivas", texto: "Espaçamento dos furos ao longo da trinca", secao: "5.4 e", tipo: "valor", unid: "cm", casas: 0, min: 10, max: 30,
        metodo: "medição", se: tipo("passiva"), naoAplicaPor: "trinca não passiva",
        freq: { por: "contagem", a_cada: 1, qtd: "nTrincas", unidade: "trinca(s)", regra: "cada trinca" } },
      { id: "tubos", grupo: "Trincas passivas", texto: "Furos ligeiramente mais profundos que a trinca; tubos com pontas salientes de 10 cm fixados no selante", secao: "5.4 e, f; 7.1 f",
        tipo: "sim_nao", se: tipo("passiva"), naoAplicaPor: "trinca não passiva" },
      { id: "injecao", grupo: "Trincas passivas", texto: "Injeção de epóxi tubo a tubo (de baixo para cima na vertical; de uma extremidade na horizontal), demais tubos obturados",
        secao: "5.4 g; 7.1 g", tipo: "sim_nao", se: tipo("passiva"), naoAplicaPor: "trinca não passiva" },
      { id: "acabamento", grupo: "Trincas passivas", texto: "Pontas dos tubos cortadas; superfície limpa e lixada", secao: "5.4 h; 7.1 h, i", tipo: "sim_nao", se: tipo("passiva"), naoAplicaPor: "trinca não passiva" },
      { id: "monitor", grupo: "Trincas ativas", texto: "Amplitude da movimentação medida por monitoramento; necessidade de junta móvel definida", secao: "5.2 a, b", tipo: "sim_nao",
        se: tipo("ativa"), naoAplicaPor: "trinca não ativa" },
      { id: "larguraJ", grupo: "Trincas ativas", texto: "Largura da abertura alargada com cinzel (junta móvel)", secao: "5.2 c, d", tipo: "valor", unid: "mm", casas: 1,
        min: function (P) { return num(P.larguraJunta); }, metodo: "medição", se: tipo("ativa"), naoAplicaPor: "trinca não ativa" },
      { id: "selante", grupo: "Trincas ativas", texto: "Abertura limpa e seca (jatos de água e ar) e cheia de selante plástico", secao: "5.2 e, f", tipo: "sim_nao", se: tipo("ativa"), naoAplicaPor: "trinca não ativa" },
      { id: "especial", grupo: "Trincas especiais", texto: "Estudo especial: remoção de concreto e tratamento da corrosão, ou monitoramento e impregnação (álcali-agregado, cloretos)",
        secao: "5.3", tipo: "sim_nao", se: tipo("especial"), naoAplicaPor: "trinca não especial" },
      G.itManejo("6; 7.1 i"),
    ],
    extra: function (ctx) {
      var P = ctx.P, l = ctx.item.abertura, j = ctx.item.larguraJ;
      if (l) {
        l.exigido = P.estrutura === "protendido" ? "nenhuma (no protendido toda fissura é tratada)" : "< 0,30 mm (≥ 0,3 mm devem ser tratadas)";
        if (l.situacao === "sem_dados") { l.situacao = "informativo"; l.motivo = "nenhuma fissura remanescente registrada"; l.resultado = "—"; }
        else if (l.situacao === "nao_conforme") {
          l.motivo = "fissura(s) que deveria(m) ser tratada(s): " + l.fora.map(function (p) { return fmt(p.v, 2) + " mm" + (p.est ? " (" + p.est + ")" : ""); }).join("; ");
          l.motivos = [{ situacao: "nao_conforme", texto: l.motivo }];
        }
      }
      if (j && j.situacao !== "nao_exigido") {
        if (!ok(num(P.larguraJunta))) A.marcar(j, "pendente", "informe a largura calculada da junta móvel");
        else j.exigido = "≥ " + fmt(num(P.larguraJunta), 1) + " mm (calculada)";
      }
      ctx.freqs.forEach(function (f, i) { if (f.ensaio === (l || {}).criterio) { ctx.freqs[i].situacao = "nao_exigido"; ctx.freqs[i].regra = "registrar as existentes"; } });
      G.ajustarFreq(ctx);
    },
    notas: "Critérios da DNIT 083/2006-ES. A tabela \"Abertura das fissuras deixadas sem tratamento\" registra as fissuras que o projeto mantém sem injeção: no concreto armado todas devem " +
      "ter abertura < 0,3 mm; no protendido nenhuma fissura pode ficar sem estudo e tratamento (3). Espaçamento dos furos de 10 a 30 cm (5.4 e). A ES não prevê ensaios: as etapas " +
      "são acompanhadas e inspecionadas durante todo o desenvolvimento (7.1).",
    exemplos: [
      { nome: "Injeção de epóxi em trincas passivas de longarina — aceito", dados: function () {
        return { ident: { registro: "TRI-01", obra: "Obra A", local: "Ponte sobre o rio A — longarina V1", data: "2025-04-22" },
          params: { estrutura: "armado", trinca: "passiva", extensao: "7,5", nTrincas: "3" },
          verificacoes: [{ atende: "S" }, { atende: "S", obs: "retração térmica, estabilizadas" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { real: "3", nc: "0" },
            { real: "3", nc: "0" }, { real: "3", nc: "0" }, { real: "3", nc: "0" }, { real: "3", nc: "0" }, {}, {}, {}, { atende: "S" }],
          abertura: [{ est: "V1 alma", pos: "fissura capilar", v: "0,15" }, { est: "V1 mesa", pos: "fissura capilar", v: "0,20" }],
          espFuros: [{ est: "trinca 1", v: "20" }, { est: "trinca 2", v: "25" }, { est: "trinca 3", v: "15" }] };
      } },
      { nome: "Viga protendida com fissura não tratada e furos espaçados demais — não conforme", dados: function () {
        return { ident: { registro: "TRI-02", obra: "Obra B", local: "Viaduto B — viga protendida V3", data: "2025-09-15" },
          params: { estrutura: "protendido", trinca: "passiva", extensao: "4", nTrincas: "2" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { real: "2", nc: "0" },
            { real: "2", nc: "0" }, { real: "2", nc: "1", obs: "tubos sem fixação no selante na trinca 2" }, { real: "2", nc: "0" }, { real: "2", nc: "0" }, {}, {}, {}, { atende: "S" }],
          abertura: [{ est: "V3 alma", pos: "fissura de flexão", v: "0,10" }],
          espFuros: [{ est: "trinca 1", v: "25" }, { est: "trinca 2", v: "40" }] };
      } },
    ],
  });
})();
