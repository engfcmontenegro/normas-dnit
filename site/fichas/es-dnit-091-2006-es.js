/*
 * Ficha de ES: DNIT 091/2006-ES — Recuperação de aparelhos de apoio.
 * Usa FE.aceitacao (es-comum.js) e FE.aceitacaoG9a (es-dnit-079-2006-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG9a, num = FE.num, ok = FE.ok, fmt = FE.fmt;

  function tipo() { var l = [].slice.call(arguments); return function (P) { return l.indexOf(P.tipo) >= 0; }; }
  var elast = tipo("elastomerico"), concr = tipo("freyssinet", "mesnager", "cilindrica", "pendConc");
  var metal = tipo("metFixo", "metMovel", "deslizamento", "pendMet");
  var cada = { por: "contagem", a_cada: 1, qtd: "nAp", unidade: "aparelho(s)", regra: "cada aparelho" };
  function it(id, grupo, texto, secao, se, extra) {
    var o = { id: id, grupo: grupo, texto: texto, secao: secao, tipo: "sim_nao", se: se, naoAplicaPor: "outro tipo de aparelho", freq: cada };
    Object.keys(extra || {}).forEach(function (k) { o[k] = extra[k]; });
    return o;
  }

  A.fichaSimples({
    id: "dnit-091-2006-es",
    titulo: "Recuperação de aparelhos de apoio — aceitação",
    resumo: "Elastoméricos: verificações estruturais (5.1.1), inspeção dos itens a–j de 5.1.2 em cada aparelho (fissuras de 2 a 3 mm toleráveis) e decisão de aproveitar ou substituir — " +
      "o elastomérico não é recuperável (5.1.3). Chumbo: substituição (5.2.2); articulações de concreto: limpeza, tratamento de quebras e trincas e reforço de fretagem (5.2.3); " +
      "metálicas: inspeção, verificações, limpeza, jateamento e pintura anticorrosiva (5.2.4); pendulares (5.2.5); neoprene contido (5.2.6). Etapa não atendida → refazer (7).",
    rotuloLink: "Aceitação do serviço",
    lote: false,
    params: [
      { k: "tipo", r: "Tipo de aparelho de apoio", tipo: "select", recarrega: true,
        opcoes: [["elastomerico", "Elastomérico (5.1)"], ["chumbo", "Articulação de chumbo (5.2.2)"], ["freyssinet", "Articulação Freyssinet (5.2.3.1)"],
          ["mesnager", "Articulação Mesnager (5.2.3.2)"], ["cilindrica", "Contato de superfícies cilíndricas (5.2.3.3)"], ["metFixo", "Metálica fixa (5.2.4.2)"],
          ["metMovel", "Metálica móvel — rolos (5.2.4.3)"], ["deslizamento", "Metálica de deslizamento (5.2.4.4)"], ["pendConc", "Pendular de concreto (5.2.5.1)"],
          ["pendMet", "Pendular metálico (5.2.5.2)"], ["pot", "Neoprene contido — pot bearing (5.2.6)"]] },
      { k: "decisao", r: "Decisão do engenheiro (5.1.3)", tipo: "select", se: function (d) { return (d.params || {}).tipo === "elastomerico"; },
        opcoes: [["", "—"], ["aproveitar", "Aproveitar o aparelho existente"], ["substituir", "Substituir o aparelho"]] },
      { k: "nAp", r: "Nº de aparelhos de apoio tratados/inspecionados" },
    ],
    padrao: { tipo: "elastomerico", decisao: "", nAp: "1" },
    textos: G.textos("Serviço de recuperação que não atende a alguma das etapas pertinentes: não é conforme e deve ser refeito (7)."),
    criterios: [
      G.itPlataforma("6 a; 8 a", "Acesso"),
      // elastomérico
      it("estrutural", "Elastomérico", "Verificações estruturais à compressão, à rotação e ao cisalhamento", "5.1.1", elast, { freq: undefined }),
      it("vulc", "Elastomérico", "Vulcanização correta; sem chapas fretantes visíveis e oxidadas", "5.1.2 b", elast),
      it("contato", "Elastomérico", "Faces superior e inferior totalmente em contato com a estrutura (se descolado: ângulos medidos)", "5.1.2 c, d", elast),
      it("medidas", "Elastomérico", "Alturas nas arestas e no centro e distorções medidas; posição original conferida", "5.1.2 e–g", elast),
      it("nocivos", "Elastomérico", "Sem óleos, graxas ou substâncias nocivas; sem juntas defeituosas próximas ou sobre o aparelho; assentamento (berço) verificado", "5.1.2 h–j", elast),
      it("regiao", "Elastomérico", "Separação nítida entre superestrutura e meso/infraestrutura, sem trincas ou fissuras na região do apoio", "5.1", elast),
      { id: "fissura", grupo: "Elastomérico", texto: "Profundidade das fissuras nas faces do elastômero", secao: "5.1.2 a", tipo: "valor", unid: "mm", casas: 1, max: 3, falha: "ressalva",
        exigido: "até 2 a 3 mm (toleráveis)", metodo: "inspeção visual e medição", se: elast, naoAplicaPor: "outro tipo de aparelho", freq: { por: "lote", minimo: 0 } },
      // chumbo
      it("chumbo", "Articulação de chumbo", "Articulação substituída após inspeção visual (não recuperada nem substituída por outra de chumbo)", "5.2.2", tipo("chumbo")),
      // concreto
      it("concLimpa", "Articulações de concreto", "Detritos que impedem as rotações removidos; articulação limpa e desimpedida", "5.2.3", concr),
      it("concFret", "Articulações de concreto", "Quebras de cantos, trincas e fissuras tratadas; fretagem reforçada com encamisamento e cintamento", "5.2.3.1; 5.2.3.2", concr),
      it("vertical", "Articulações de concreto", "Verticalidade do pêndulo e solicitações de eventual inclinação verificadas", "5.2.5.1", tipo("pendConc")),
      // metálicos
      it("metInsp", "Articulações metálicas", "Inspeção minuciosa e verificações estruturais", "5.2.4.1 a, b", metal),
      it("metLimp", "Articulações metálicas", "Detritos removidos, liberando os elementos da articulação", "5.2.4.1 c", metal),
      it("metPint", "Articulações metálicas", "Corrosão superficial tratada com jateamento de areia e pintura anticorrosiva (lubrificante não é solução duradoura)", "5.2.4.1 d", metal),
      it("desliz", "Articulações metálicas", "Substituição por apoio elastomérico avaliada (recuperação difícil e temporária)", "5.2.4.4", tipo("deslizamento"), { falha: "ressalva" }),
      // pot
      it("potTipo", "Neoprene contido", "Tipo identificado (deslocamentos e rotações permitidos)", "5.2.6 a", tipo("pot")),
      it("potSolda", "Neoprene contido", "Soldas íntegras, sem fissuras; parafusos de fixação íntegros", "5.2.6 b, d", tipo("pot")),
      it("potEstanq", "Neoprene contido", "Neoprene perfeitamente contido entre tampa e vaso (estanqueidade) — condição para recuperar", "5.2.6 c", tipo("pot")),
      it("potPos", "Neoprene contido", "Posição relativa dos elementos correta; sem detritos", "5.2.6 e, f", tipo("pot")),
      G.itManejo("6"),
    ],
    extra: function (ctx) {
      var P = ctx.P, f = ctx.item.fissura;
      if (f) {
        if (f.situacao === "sem_dados") { f.situacao = "informativo"; f.motivo = "nenhuma fissura registrada"; }
        else if (f.situacao === "ressalva") { f.motivos = [{ situacao: "ressalva", texto: "fissura(s) acima da tolerância — avaliar substituição (5.1.3): " + f.fora.map(function (p) { return fmt(p.v, 1) + " mm" + (p.est ? " (" + p.est + ")" : ""); }).join("; ") }]; f.motivo = f.motivos[0].texto; }
      }
      ctx.freqs.forEach(function (fr, i) { if (f && fr.ensaio === f.criterio) { ctx.freqs[i].situacao = "nao_exigido"; ctx.freqs[i].regra = "registrar as existentes"; } });
      if (P.tipo === "elastomerico") {
        var d = A.linha({ id: "decisao", grupo: "Elastomérico", criterio: "Decisão de aproveitar ou substituir coerente com a inspeção", secao: "5.1; 5.1.3",
          exigido: "aproveitar só se não houver deficiência que prejudique a estrutura" });
        var ruins = ["contato", "regiao", "vulc", "nocivos"].filter(function (id) { var l = ctx.item[id]; return l && l.situacao === "nao_conforme"; })
          .map(function (id) { return ctx.item[id].secao; });
        if (f && f.fora && f.fora.length) ruins.push("fissuras > 3 mm");
        if (!P.decisao) A.marcar(d, "pendente", "informe a decisão do engenheiro");
        else if (P.decisao === "substituir") { d.resultado = "substituir"; d.motivo = "aparelho substituído (o elastomérico não é recuperável)";
          // a inspeção que motivou a substituição não reprova o serviço
          ["contato", "regiao", "vulc", "nocivos"].forEach(function (id) { var l = ctx.item[id]; if (l && l.situacao === "nao_conforme") { l.situacao = "informativo"; l.motivos = []; l.motivo = "deficiência que motivou a substituição"; } });
          if (f && f.situacao === "ressalva") { f.situacao = "informativo"; f.motivos = []; }
        } else {
          d.resultado = "aproveitar";
          if (ruins.length) A.marcar(d, "nao_conforme", "aparelho aproveitado apesar de deficiências na inspeção (" + ruins.join("; ") + ") — substituir");
          else d.motivo = "inspeção sem deficiências — aproveitamento admitido";
        }
        ctx.linhas.splice(ctx.linhas.indexOf(f) + 1, 0, d);
      }
      G.ajustarFreq(ctx);
    },
    notas: "Critérios da DNIT 091/2006-ES. Os itens de inspeção são conferidos em cada aparelho (informe realizadas / não conformes). Elastomérico: fissuras de 2 a 3 mm são toleráveis " +
      "(5.1.2 a; a ES diz \"profundidade\" e \"comprimento\" — a ficha mede a profundidade); decisão \"substituir\" torna informativas as deficiências que a motivaram; \"aproveitar\" com " +
      "deficiência é não conforme (5.1; 5.1.3). A ES não fixa limites numéricos para alturas, distorções ou verticalidade: são verificações.",
    exemplos: [
      { nome: "Quatro apoios elastoméricos inspecionados e aproveitados — aceito", dados: function () {
        return { ident: { registro: "APO-01", obra: "Obra A", local: "Ponte sobre o rio A — encontro E1 (4 apoios)", data: "2025-06-03" },
          params: { tipo: "elastomerico", decisao: "aproveitar", nAp: "4" },
          verificacoes: [{ atende: "S" }, { atende: "S", obs: "memória de verificação nº 3" }, { real: "4", nc: "0" }, { real: "4", nc: "0" }, { real: "4", nc: "0" }, { real: "4", nc: "0" },
            { real: "4", nc: "0" }, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, { atende: "S" }],
          fissura: [{ est: "apoio 2", v: "2,0" }, { est: "apoio 3", v: "2,5" }] };
      } },
      { nome: "Pot bearing sem estanqueidade recuperado — não conforme", dados: function () {
        return { ident: { registro: "APO-02", obra: "Obra B", local: "Viaduto B — pilar P4 (2 apoios)", data: "2025-09-09" },
          params: { tipo: "pot", nAp: "2" },
          verificacoes: [{ atende: "S" }, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
            { real: "2", nc: "0" }, { real: "2", nc: "0" }, { real: "2", nc: "1", obs: "extrusão do elastômero no apoio P4-B" }, { real: "2", nc: "0" }, { atende: "S" }] };
      } },
    ],
  });
})();
