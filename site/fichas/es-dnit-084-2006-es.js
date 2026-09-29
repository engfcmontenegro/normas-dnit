/*
 * Ficha de ES: DNIT 084/2006-ES — Tratamento de corrosão (armaduras).
 * Usa FE.aceitacao (es-comum.js) e FE.aceitacaoG9a (es-dnit-079-2006-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG9a, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var ID = "dnit-084-2006-es";

  var F = A.fichaSimples({
    id: ID,
    titulo: "Tratamento de corrosão das armaduras — aceitação",
    resumo: "Etapas da seção 5.1 e inspeções da 7.1: remoção do concreto contaminado deixando ≥ 2 cm livres atrás da armadura e até barra íntegra (5.1 d), limpeza e avaliação " +
      "das barras — perda de seção > 10 % exige suplementação (5.1 f), pintura anti-ferruginosa (5.1 g), recomposição com concreto aditivado e cura ≥ 7 dias (5.1 h) e fck do " +
      "concreto novo não superior em mais de 20 % ao do existente (5.1 i). Concreto: fck estimado (NBR 12655) a partir dos exemplares da DNER-ME 091.",
    rotuloLink: "Aceitação do serviço",
    lote: false,
    params: [
      { k: "recomp", r: "Recomposição da seção (5.1 h)", tipo: "select", opcoes: [["moldado", "Concreto convencional moldado no local, aditivado"], ["projetado", "Concreto projetado, aditivado e desempenado"]] },
      { k: "fckExist", r: "fck (ou resistência estimada) do concreto existente (MPa)", dica: "5.1 i: o fck do concreto novo não deve ser 20 % superior ao do existente" },
      { k: "suplem", r: "Barras com perda > 10 % foram suplementadas? (5.1 f)", tipo: "select", opcoes: [["", "—"], ["sim", "Sim"], ["nao", "Não"]] },
      { k: "nAreas", r: "Nº de áreas tratadas", dica: "o espaço livre atrás da armadura é conferido em cada área" },
    ].concat(G.paramsConcreto({ rotuloFck: "fck do concreto novo (MPa)" })),
    padrao: Object.assign({ recomp: "moldado", suplem: "", nAreas: "1" }, G.padraoConcreto),
    textos: G.textos("Etapa não conforme: os serviços são paralisados e retomados a partir do início da etapa considerada não conforme (7.2)."),
    criterios: [
      { id: "projeto", grupo: "Projeto e acesso", texto: "Inspeção preliminar e projeto de recuperação com a área a tratar", secao: "4; 5.1 a; 7.1 a", tipo: "sim_nao" },
      G.itSinalizacao("5.1 b; 7.1 c", "Projeto e acesso"),
      G.itPlataforma("5.1 c; 7.1 b", "Projeto e acesso"),
      { id: "remocao", grupo: "Remoção do concreto", texto: "Concreto contaminado removido com jato d'água ou ferramentas manuais, prolongado até comprimento de ancoragem de barra íntegra",
        secao: "5.1 d; 7.1 d", tipo: "sim_nao" },
      { id: "espaco", grupo: "Remoção do concreto", texto: "Espaço livre entre a armadura e o concreto são", secao: "5.1 d", tipo: "valor", unid: "cm", casas: 1, min: 2,
        metodo: "medição após a remoção", freq: { por: "contagem", a_cada: 1, qtd: "nAreas", unidade: "área(s)", regra: "cada área tratada" } },
      { id: "fragil", grupo: "Remoção do concreto", texto: "Fragilização da estrutura avaliada e necessidade de reforços verificada", secao: "4; 7.1 e", tipo: "sim_nao" },
      { id: "limpeza", grupo: "Armaduras", texto: "Barras limpas (escova de aço ou jato de areia)", secao: "5.1 e; 7.1 f", tipo: "sim_nao" },
      { id: "perda", grupo: "Armaduras", texto: "Perda de seção das barras corroídas", secao: "5.1 f", tipo: "valor", unid: "%", casas: 1, max: 10,
        exigido: "≤ 10 % (acima: barra suplementada)", metodo: "medição do diâmetro residual" },
      { id: "pintura", grupo: "Armaduras", texto: "Armadura tratada e suplementar pintadas com tinta anti-ferruginosa", secao: "5.1 g", tipo: "sim_nao" },
      { id: "recomposicao", grupo: "Recomposição", texto: "Seção recomposta com concreto aditivado (moldado ou projetado), considerando as vibrações do tráfego", secao: "5.1 h; 7.1 g", tipo: "sim_nao" },
      { id: "cura", grupo: "Recomposição", texto: "Duração da cura", secao: "5.1 h", tipo: "valor", unid: "dias", casas: 0, min: 7, metodo: "diário de obra" },
    ].concat(G.itensConcreto({ secao: "5.1 h, i", grupo: "Recomposição" })).concat([G.itManejo("6")]),
    extra: function (ctx) {
      var P = ctx.P, l = ctx.item.perda;
      if (l && l.fora && l.fora.length && l.situacao !== "nao_exigido") {
        var lista = l.fora.map(function (p) { return fmt(p.v, 1) + " %" + (p.est ? " (" + p.est + ")" : ""); }).join("; ");
        if (P.suplem === "sim") { l.situacao = "conforme"; l.motivos = []; l.motivo = "barras com perda > 10 % suplementadas: " + lista; }
        else if (P.suplem === "nao") { l.situacao = "nao_conforme"; l.motivo = "perda > 10 % sem suplementação: " + lista; l.motivos = [{ situacao: "nao_conforme", texto: l.motivo }]; }
        else { l.situacao = "pendente"; l.motivo = "perda > 10 % (" + lista + "): informe se as barras foram suplementadas"; l.motivos = [{ situacao: "pendente", texto: l.motivo }]; }
      }
      G.extraConcreto(ctx, { secao: "5.1 h" });
      // 5.1 i — relação entre o fck do concreto novo e o do existente
      var fck = num(P.fck), fe = num(P.fckExist);
      var r = A.linha({ id: "relacao", grupo: "Recomposição", criterio: "fck do concreto novo em relação ao do existente", secao: "5.1 i",
        exigido: ok(fe) ? "≤ 1,20 × " + fmt(fe, 1) + " = " + fmt(1.2 * fe, 1) + " MPa" : "≤ 1,20 × fck existente" });
      if (!ok(fck) || !ok(fe)) A.marcar(r, "pendente", "informe o fck do concreto novo e o do existente");
      else {
        r.resultado = fmt(fck, 1) + " MPa = " + fmt(fck / fe * 100, 0) + " % do existente";
        if (fck > 1.2 * fe + 1e-9) A.marcar(r, "nao_conforme", "o fck do concreto novo supera em mais de 20 % o do existente (" + fmt(fck, 1) + " > " + fmt(1.2 * fe, 1) + " MPa)");
        else r.motivo = "fck novo ≤ 1,2 × fck existente";
      }
      var ic = ctx.linhas.indexOf(ctx.item.fc);
      ctx.linhas.splice(ic >= 0 ? ic + 1 : ctx.linhas.length, 0, r);
      G.ajustarFreq(ctx);
    },
    notas: "Critérios da DNIT 084/2006-ES. 5.1 i lido literalmente: o fck do concreto novo não deve superar em mais de 20 % o do existente (a DNIT 087/2006-ES, 5.6 e, pede o contrário para o " +
      "concreto projetado: ≥ 1,2 × substrato). Perda de seção > 10 %: conforme só com a barra suplementada (5.1 f). Etapa não conforme paralisa os serviços, retomados do início da etapa (7.2)." + G.notaConcreto,
    exemplos: [
      { nome: "Pilar recuperado com concreto C25 (6 exemplares, 2 importados da DNER-ME 091) — aceito", dados: function () {
        var d = { ident: { registro: "COR-01", obra: "Ponte sobre o rio A", local: "Pilar P3 — faces norte e leste", data: "2025-04-10" },
          params: { recomp: "moldado", fckExist: "22", suplem: "sim", nAreas: "2", fck: "25", condPreparo: "A", amostragem: "parcial", volConc: "4,5", abatEsp: "100", abatTol: "20" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { real: "2", nc: "0" }, { atende: "S" }, { real: "2", nc: "0" }, { atende: "S" }, { atende: "S" }, { atende: "S" }],
          espaco: [{ est: "P3 face norte", v: "2,5" }, { est: "P3 face leste", v: "2,0" }],
          perda: [{ est: "N1", v: "4,5" }, { est: "N2", v: "12,0" }, { est: "N3", v: "6,0" }],
          cura: [{ est: "P3", v: "7" }],
          fc: G.fcTabela(["27,0", "26,4", "28,2", "25,9"], "P3"),
          abat: [{ est: "P3", reg: "caminhão 1", v: "95" }] };
        A.exemplos.importar(FE.FICHAS[ID].params, d, "imp_fc", [["dner-me-091-98", 1]]);
        return d;
      } },
      { nome: "Espaço livre insuficiente, cura curta e concreto novo 40 % mais forte — não conforme", dados: function () {
        return { ident: { registro: "COR-02", obra: "Obra B", local: "Viaduto B — viga V2", data: "2025-08-05" },
          params: { recomp: "projetado", fckExist: "20", suplem: "", nAreas: "2", fck: "28", condPreparo: "A", amostragem: "parcial", volConc: "3" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { real: "2", nc: "0" }, { atende: "S" }, { real: "2", nc: "0" }, { atende: "S" }, { atende: "S" }, { atende: "S" }],
          espaco: [{ est: "V2 vão", v: "2,0" }, { est: "V2 apoio", v: "1,2" }],
          perda: [{ est: "N1", v: "8,0" }, { est: "N4", v: "15,0" }],
          cura: [{ est: "V2", v: "5" }],
          fc: G.fcTabela(["27,5", "29,0", "28,8"], "V2") };
      } },
    ],
  });
})();
