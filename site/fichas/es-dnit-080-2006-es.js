/*
 * Ficha de ES: DNIT 080/2006-ES — Preparação de superfícies de concreto: apicoamento e jateamentos.
 * Usa FE.aceitacao (es-comum.js) e FE.aceitacaoG9a (es-dnit-079-2006-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG9a, num = FE.num, ok = FE.ok;

  function usa(k) { return function (P) { return P[k] === "sim"; }; }
  function agua(P) { return P.agua && P.agua !== "nao"; }
  var PRESSAO = { baixa: [NaN, 35], alta: [40, 120], muito: [140, 240] };

  A.fichaSimples({
    id: "dnit-080-2006-es",
    titulo: "Preparação de superfícies de concreto (apicoamento e jateamentos) — aceitação",
    resumo: "Verificações da seção 7.1 (inspeção preliminar e projeto, plataformas, equipamentos, recolhimento de detritos), restrições de cada método (5.1 a 5.4), " +
      "pressão do jateamento de água por faixa (5.3.1: < 35 MPa; 5.3.2: 40 a 120 ou 140 a 240 N/mm²) e inspeção visual da superfície final — concreto são, limpo e " +
      "adequadamente áspero; preparação insuficiente não é conforme e é retomada (7.2).",
    rotuloLink: "Aceitação do serviço",
    lote: false,
    params: [
      { k: "apic", r: "Apicoamento (5.1)", tipo: "select", recarrega: true, opcoes: G.SIMNAO },
      { k: "ar", r: "Jateamento de ar (5.2)", tipo: "select", recarrega: true, opcoes: G.SIMNAO },
      { k: "agua", r: "Jateamento de água (5.3)", tipo: "select", recarrega: true,
        opcoes: [["nao", "Não"], ["baixa", "Baixa pressão — limpeza (< 35 MPa)"], ["alta", "Alta pressão — remoção de concreto deteriorado (40 a 120 N/mm²)"], ["muito", "Muito alta pressão (140 a 240 N/mm²)"]] },
      { k: "areia", r: "Jateamento de areia / abrasivo (5.4)", tipo: "select", recarrega: true, opcoes: G.SIMNAO },
      { k: "area", r: "Área tratada (m²)", dica: "critério de medição (8)" },
      { k: "nAreas", r: "Nº de áreas / elementos preparados", dica: "a inspeção visual final (7.2) é feita em cada área antes do tratamento seguinte" },
    ],
    padrao: { apic: "sim", ar: "sim", agua: "baixa", areia: "nao", nAreas: "1" },
    textos: G.textos("Preparação insuficiente ou irregular: os serviços não são conformes e devem ser retomados até atingirem o nível de conformidade (7.2)."),
    criterios: [
      { id: "preliminar", grupo: "Planejamento", texto: "Inspeção preliminar e projeto de recuperação", secao: "7.1 a", tipo: "sim_nao" },
      G.itPlataforma("5.2; 7.1 b"),
      { id: "equip", grupo: "Equipamentos", texto: "Equipamentos verificados (compressores, bombas, mangueiras, bicos e depósitos)", secao: "7.1 c", tipo: "sim_nao" },
      { id: "detritos", grupo: "Equipamentos", texto: "Dispositivos de proteção e recolhimento de detritos, poeiras e água", secao: "6 b–d; 7.1 d", tipo: "sim_nao" },
      { id: "apicFerr", grupo: "Apicoamento", texto: "Apicoamento manual só em áreas muito pequenas; áreas maiores com ferramentas elétricas", secao: "5.1", tipo: "sim_nao",
        se: usa("apic"), naoAplicaPor: "sem apicoamento" },
      { id: "arUso", grupo: "Jateamento de ar", texto: "Jateamento de ar usado só para expulsão de resíduos", secao: "5.2", tipo: "sim_nao", se: usa("ar"), naoAplicaPor: "sem jateamento de ar" },
      { id: "pressao", grupo: "Jateamento de água", texto: "Pressão do jateamento de água", secao: "5.3.1 a; 5.3.2 a", tipo: "valor", unid: "MPa", casas: 0,
        min: function (P) { return (PRESSAO[P.agua] || [])[0]; }, max: function (P) { return (PRESSAO[P.agua] || [])[1]; },
        exigido: undefined, metodo: "manômetro da bomba", se: agua, naoAplicaPor: "sem jateamento de água", falha: "ressalva" },
      { id: "aguaSao", grupo: "Jateamento de água", texto: "Alta pressão não aplicada para remoção de concreto são", secao: "5.3.2 b", tipo: "sim_nao",
        se: function (P) { return P.agua === "alta" || P.agua === "muito"; }, naoAplicaPor: "sem jateamento de alta pressão" },
      { id: "aguaUmid", grupo: "Jateamento de água", texto: "Materiais e equipamentos sensíveis à umidade afastados; água e detritos captados e conduzidos a escoadouros naturais",
        secao: "5.3.1 c; 5.3.2 c; 6 c", tipo: "sim_nao", se: agua, naoAplicaPor: "sem jateamento de água" },
      { id: "areiaUso", grupo: "Jateamento de areia", texto: "Sem uso em pinturas resilientes ou não curadas, em grande volume de concreto ou sem proteção dos materiais", secao: "5.4 c", tipo: "sim_nao",
        se: usa("areia"), naoAplicaPor: "sem jateamento de areia" },
      { id: "areiaRec", grupo: "Jateamento de areia", texto: "Areia recolhida após o uso (ou inofensiva ao meio ambiente)", secao: "6 d", tipo: "sim_nao",
        se: usa("areia"), naoAplicaPor: "sem jateamento de areia" },
      { id: "final", grupo: "Superfície preparada", texto: "Inspeção visual: concreto são, limpo e adequadamente áspero (sem insuficiências nem excessos)", secao: "3; 5.1; 7.1; 7.2", tipo: "sim_nao",
        exigido: "superfície apta ao tratamento seguinte (apicoamento: bastante áspera)", freq: { por: "contagem", a_cada: 1, qtd: "nAreas", unidade: "área(s)", regra: "cada área preparada" } },
      G.itManejo("6 a, e"),
    ],
    extra: function (ctx) {
      var l = ctx.item.pressao, P = ctx.P;
      if (l && l.situacao !== "nao_exigido") {
        l.exigido = P.agua === "baixa" ? "< 35 MPa (5.000 psi)" : P.agua === "alta" ? "40 a 120 N/mm²" : "140 a 240 N/mm²";
        if (P.agua === "baixa" && l.pontos.some(function (p) { return ok(p.v) && p.v >= 35; }))
          A.marcar(l, "ressalva", "pressão ≥ 35 MPa não é mais \"baixa pressão\" (5.3.1 a)");
      }
      if (P.apic === "nao" && P.ar === "nao" && P.agua === "nao" && P.areia === "nao") ctx.avisos.push("Marque ao menos um método de preparação (apicoamento ou jateamento).");
      G.ajustarFreq(ctx);
    },
    notas: "Critérios da DNIT 080/2006-ES. A ES não prevê ensaios: a preparação é acompanhada durante o desenvolvimento, para que não haja excessos nem insuficiências (7.1), e a " +
      "inspeção visual final decide a conformidade — preparação insuficiente é retomada até a conformidade (7.2). A pressão do jateamento de água é conferida contra a faixa do " +
      "processo declarado (fora da faixa: ressalva, pois a ES só define as faixas de aplicação de cada processo).",
    exemplos: [
      { nome: "Apicoamento elétrico + jato de água de baixa pressão — aceito", dados: function () {
        return { ident: { registro: "PREP-01", obra: "Obra A", local: "Ponte sobre o rio A — longarinas V1 e V2", data: "2025-07-15" },
          params: { apic: "sim", ar: "sim", agua: "baixa", areia: "nao", area: "36", nAreas: "3" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S", obs: "martelete elétrico" }, { atende: "S" }, {},
            { atende: "S" }, {}, {}, { real: "3", nc: "0" }, { atende: "S" }],
          pressao: [{ est: "V1", reg: "leitura 1", v: "25" }, { est: "V2", reg: "leitura 2", v: "28" }] };
      } },
      { nome: "Hidrodemolição com área mal preparada — não conforme", dados: function () {
        return { ident: { registro: "PREP-02", obra: "Obra B", local: "Viaduto B — laje do vão 1", data: "2025-08-20" },
          params: { apic: "nao", ar: "sim", agua: "alta", areia: "sim", area: "52", nAreas: "4" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { real: "2", nc: "1", obs: "água sem captação no 2º dia" }, {}, { atende: "S" }, { atende: "S" },
            { atende: "S" }, { atende: "S" }, { atende: "S" }, { real: "4", nc: "1", obs: "área 3 com concreto friável remanescente" }, { atende: "S" }],
          pressao: [{ est: "vão 1", reg: "leitura 1", v: "110" }, { est: "vão 1", reg: "leitura 2", v: "130" }] };
      } },
    ],
  });
})();
