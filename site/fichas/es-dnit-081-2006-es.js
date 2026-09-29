/*
 * Ficha de ES: DNIT 081/2006-ES — Remoções no concreto (limpeza, corte e demolição).
 * Usa FE.aceitacao (es-comum.js) e FE.aceitacaoG9a (es-dnit-079-2006-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG9a, num = FE.num, ok = FE.ok, fmt = FE.fmt;

  function usa(k) { return function (P) { return P[k] === "sim"; }; }
  function limita(P) { return P.limitacao === "sim" || P.demParcial === "sim"; }
  function demolicao(P) { return P.demParcial === "sim" || P.demTotal === "sim"; }

  A.fichaSimples({
    id: "dnit-081-2006-es",
    titulo: "Remoções no concreto (limpeza, corte e demolição) — aceitação",
    resumo: "Inspeção preliminar e sequência de atividades (4), limpeza com solução ácida/alcalina com saturação prévia e lavagem com água pura (5.1), corte do concreto degradado " +
      "até ≥ 2 cm além da armadura oxidada (5.2.1), juntas de contração com sulco de 4 mm e profundidade de ¼ da espessura da sobrelaje, serrado de 8 a 12 h (5.2.2 a), " +
      "corte de limitação de 25 mm (5.2.2 b; 5.3.1) e demolições controladas em sequência predeterminada (5.3).",
    rotuloLink: "Aceitação do serviço",
    lote: false,
    params: [
      { k: "quimica", r: "Limpeza com solução ácida ou alcalina (5.1)", tipo: "select", recarrega: true, opcoes: G.SIMNAO },
      { k: "corte", r: "Corte de concreto degradado (5.2.1)", tipo: "select", recarrega: true, opcoes: G.SIMNAO },
      { k: "juntas", r: "Juntas de contração em sobrelaje (5.2.2 a)", tipo: "select", recarrega: true, opcoes: G.SIMNAO },
      { k: "espLaje", r: "Espessura da sobrelaje (mm)", se: function (d) { return (d.params || {}).juntas === "sim"; }, dica: "profundidade do sulco = ¼ da espessura (5.2.2 a)" },
      { k: "limitacao", r: "Corte de limitação de remoções (5.2.2 b)", tipo: "select", recarrega: true, opcoes: G.SIMNAO },
      { k: "demParcial", r: "Demolição parcial (5.3.1)", tipo: "select", recarrega: true, opcoes: G.SIMNAO },
      { k: "demTotal", r: "Demolição total (5.3.2)", tipo: "select", recarrega: true, opcoes: G.SIMNAO },
      { k: "nAreas", r: "Nº de áreas de corte de concreto degradado", se: function (d) { return (d.params || {}).corte === "sim"; } },
    ],
    padrao: { quimica: "nao", corte: "sim", juntas: "nao", limitacao: "nao", demParcial: "nao", demTotal: "nao", nAreas: "1" },
    textos: G.textos("Há etapa não conforme: a remoção deve ser corrigida (ou o elemento recuperado) antes do prosseguimento — as etapas devem ser acompanhadas durante todo o desenvolvimento (8)."),
    criterios: [
      { id: "preliminar", grupo: "Planejamento", texto: "Inspeção preliminar e projeto / sequência completa de atividades", secao: "4", tipo: "sim_nao" },
      { id: "equipe", grupo: "Planejamento", texto: "Pessoal especializado sob supervisão de engenheiro; equipamentos adequados, revisados e aferidos", secao: "4; 7", tipo: "sim_nao" },
      { id: "escora", grupo: "Planejamento", texto: "Escoramentos parciais ou totais, quando necessários", secao: "4", tipo: "sim_nao" },
      G.itPlataforma("6 a"),
      { id: "saturacao", grupo: "Limpeza (remoção superficial externa)", texto: "Saturação prévia do elemento e lavagem cuidadosa final, ambas com água pura", secao: "5.1; 7", tipo: "sim_nao",
        se: usa("quimica"), naoAplicaPor: "sem solução ácida/alcalina", exigido: "obrigatórias quando se usam soluções ácidas ou alcalinas" },
      { id: "prof", grupo: "Corte de concreto degradado", texto: "Profundidade do corte além da armadura oxidada", secao: "5.2.1", tipo: "valor", unid: "cm", casas: 1, min: 2,
        metodo: "medição após a remoção", se: usa("corte"), naoAplicaPor: "sem corte de concreto degradado",
        freq: { por: "contagem", a_cada: 1, qtd: "nAreas", unidade: "área(s)", regra: "cada área de corte" } },
      { id: "comprimento", grupo: "Corte de concreto degradado", texto: "Comprimento de remoção controlado (armaduras não ficam inoperantes)", secao: "5.2.1", tipo: "sim_nao",
        se: usa("corte"), naoAplicaPor: "sem corte de concreto degradado" },
      { id: "limpeza", grupo: "Corte de concreto degradado", texto: "Superfície limpa com jatos de areia, ar comprimido e água antes do novo concreto; detritos coletados no local", secao: "5.2.1", tipo: "sim_nao",
        se: usa("corte"), naoAplicaPor: "sem corte de concreto degradado" },
      { id: "sulcoL", grupo: "Juntas de contração", texto: "Largura do sulco da junta de contração", secao: "5.2.2 a", tipo: "valor", unid: "mm", casas: 1, min: 4, max: 4, falha: "ressalva",
        exigido: "4 mm (serra circular diamantada)", metodo: "medição", se: usa("juntas"), naoAplicaPor: "sem juntas de contração" },
      { id: "sulcoP", grupo: "Juntas de contração", texto: "Profundidade do sulco da junta de contração", secao: "5.2.2 a", tipo: "valor", unid: "mm", casas: 0,
        min: function (P) { return num(P.espLaje) / 4; }, metodo: "medição", se: usa("juntas"), naoAplicaPor: "sem juntas de contração" },
      { id: "serragem", grupo: "Juntas de contração", texto: "Idade do concreto na serragem do sulco", secao: "5.2.2 a", tipo: "valor", unid: "h", casas: 1, min: 8, max: 12, falha: "ressalva",
        exigido: "8 a 12 h (ou sulco moldado no concreto fresco)", se: usa("juntas"), naoAplicaPor: "sem juntas de contração" },
      { id: "selante", grupo: "Juntas de contração", texto: "Sulco preenchido com material selante", secao: "5.2.2 a", tipo: "sim_nao", se: usa("juntas"), naoAplicaPor: "sem juntas de contração" },
      { id: "corteLim", grupo: "Limitação de remoções / demolição parcial", texto: "Profundidade do corte de limitação (serra circular diamantada)", secao: "5.2.2 b; 5.3.1", tipo: "valor", unid: "mm", casas: 0,
        min: 25, exigido: "25 mm", metodo: "medição", se: limita, naoAplicaPor: "sem limitação de remoções" },
      { id: "sequencia", grupo: "Demolições", texto: "Demolição controlada, em sequência predeterminada (sem colapso brusco)", secao: "5.3", tipo: "sim_nao", se: demolicao, naoAplicaPor: "sem demolição" },
      { id: "preserva", grupo: "Demolições", texto: "Demolição parcial sobre fôrmas escoradas, sem danificar a estrutura remanescente e preservando as armaduras a aproveitar", secao: "5.3.1",
        tipo: "sim_nao", se: usa("demParcial"), naoAplicaPor: "sem demolição parcial" },
      { id: "total", grupo: "Demolições", texto: "Processo de demolição total adequado ao vulto da obra (martelos, agentes expansivos ou implosão) e remoção por guindastes", secao: "5.3.2",
        tipo: "sim_nao", se: usa("demTotal"), naoAplicaPor: "sem demolição total" },
      G.itManejo("5.2.1; 6"),
    ],
    extra: function (ctx) {
      var P = ctx.P, l = ctx.item.sulcoP;
      if (l && l.situacao !== "nao_exigido") {
        if (!ok(num(P.espLaje))) A.marcar(l, "pendente", "informe a espessura da sobrelaje");
        else l.exigido = "≥ ¼ × " + fmt(num(P.espLaje), 0) + " = " + fmt(num(P.espLaje) / 4, 0) + " mm";
      }
      if (["quimica", "corte", "juntas", "limitacao", "demParcial", "demTotal"].every(function (k) { return P[k] !== "sim"; }))
        ctx.avisos.push("Marque ao menos um tipo de remoção (limpeza, corte ou demolição).");
      G.ajustarFreq(ctx);
    },
    notas: "Critérios da DNIT 081/2006-ES. A ES não prevê ensaios: as etapas são acompanhadas durante todo o desenvolvimento, por pessoal qualificado supervisionado por engenheiro (7; 8). " +
      "Profundidade do sulco: a ES diz \"igual a ¼ da espessura\"; aceita-se ≥ ¼ (sulco mais raso não enfraquece a seção). Largura de 4 mm e idade de serragem de 8 a 12 h sem tolerância na ES: " +
      "fora delas, ressalva. A ES diz serrar \"8 a 12 horas após a cura\"; adota-se a idade do concreto contada do lançamento.",
    exemplos: [
      { nome: "Corte de concreto degradado em três áreas — aceito", dados: function () {
        return { ident: { registro: "REM-01", obra: "Obra A", local: "Ponte sobre o rio A — pilar P2", data: "2025-06-10" },
          params: { quimica: "nao", corte: "sim", juntas: "nao", limitacao: "nao", demParcial: "nao", demTotal: "nao", nAreas: "3" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S", obs: "escoramento não necessário" }, { atende: "S" }, {}, { atende: "S" }, { atende: "S" },
            {}, {}, {}, {}, { atende: "S" }],
          prof: [{ est: "P2 face norte", v: "2,5" }, { est: "P2 face sul", v: "3,0" }, { est: "P2 face leste", v: "2,2" }] };
      } },
      { nome: "Limpeza ácida sem saturação e corte raso — não conforme", dados: function () {
        return { ident: { registro: "REM-02", obra: "Obra B", local: "Viaduto B — encontro E1 e sobrelaje", data: "2025-09-02" },
          params: { quimica: "sim", corte: "sim", juntas: "sim", espLaje: "100", limitacao: "nao", demParcial: "nao", demTotal: "nao", nAreas: "2" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { real: "2", nc: "1", obs: "área 2 lavada sem saturação prévia" }, { atende: "S" }, { atende: "S" },
            { atende: "S" }, {}, {}, {}, { atende: "S" }],
          prof: [{ est: "E1 área 1", v: "2,4" }, { est: "E1 área 2", v: "1,5" }],
          sulcoL: [{ est: "junta 1", v: "4" }, { est: "junta 2", v: "4" }],
          sulcoP: [{ est: "junta 1", v: "25" }, { est: "junta 2", v: "22" }],
          serragem: [{ est: "junta 1", v: "10" }, { est: "junta 2", v: "14" }] };
      } },
    ],
  });
})();
