/*
 * DNIT 024/2025-ES — Drenagem — Bueiros metálicos sem interrupção do tráfego (tunnel liner) — aceitação do serviço.
 * Usa FE.aceitacao.fichaSimples via FE.drenagemES (definido em es-dnit-015-2006-es.js, carregado antes).
 * Controle: certificados das chapas e fixações (8.1), sondagem prévia (4.2), montagem dos anéis com vedante e reaperto (6 d),
 * alinhamento e nivelamento a cada 3 anéis (6 e), injeção de solo-cimento (6 f), controle geométrico (8.2.1) e acabamento (8.2.2).
 * Revestimento interno em concreto (opcional): controle pela NBR 12655 (8.1) — fck,est ≥ fck de projeto.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, D = FE.drenagemES, num = FE.num;
  var G = { MAT: "Materiais (5.1 e 8.1)", EXE: "Condições gerais e execução (4 e 6)", PRO: "Verificação do produto (8.2)", AMB: "Condicionantes ambientais (7)" };
  function S(id, texto, secao, grupo, exigido, extra) { return D.sn(id, texto, secao, grupo, exigido, extra); }
  function revest(P) { return P.revest === "sim"; }
  function nVerif(P) { var n = num(P.aneis); return FE.ok(n) ? Math.floor(n / 3 + 1e-9) : NaN; }
  var CRIT = [
    S("cert", "Chapas corrugadas e elementos de fixação com certificados de qualidade (NBR 16091)", "5.1.1 / 5.1.2 / 8.1", G.MAT,
      "certificados do tipo de aço; fixações com o mesmo tratamento"),
    S("prot", "Proteção adequada ao meio: galvanizada (baixa acidez) ou epóxi (meio agressivo); revestimento danificado reparado com tinta epóxi", "5.1.1 / 5.1.2", G.MAT,
      "tratamento conforme a agressividade da água e do solo"),
    S("argam", "Argamassa de solo-cimento autoadensável conforme o projeto (plano de controle de insumos)", "5.1.3 / 8.1", G.MAT, "especificação do projeto"),
    S("vedante", "Tiras de feltro (ou material do fabricante) entre as chapas justapostas", "5.1.4 / 6 d", G.MAT, "estanqueidade das juntas"),
    D.itemFc({ id: "fc", secao: "8.1", grupo: G.MAT, texto: "Revestimento interno em concreto — resistência aos 28 dias (exemplares)", se: revest }),
    D.itemAbat({ id: "abat", secao: "8.1", grupo: G.MAT, se: revest }),
    // execução
    S("sinal", "Sinalização da obra implantada e mantida", "4.1", G.EXE, "segurança do tráfego"),
    S("sond", "Sondagem e levantamento topográfico antes da escavação (lençol freático, geomorfologia, interferências)", "4.2 / 6 b", G.EXE, "tipo de escoramento definido"),
    S("escor", "Poços de ataque escorados e medidas de reforço (abas, escudos, estroncas, enfilagens) quando necessárias", "4.3 / 6 c", G.EXE, "conforme projeto"),
    S("esgot", "Esgotamento com bomba e reservatório abaixo da geratriz inferior; ensecadeira removida", "4.4", G.EXE, "quando necessário",
      { se: function (P) { return P.esgot === "sim"; } }),
    S("seg", "Execução de jusante para montante com a boca de montante tamponada; sem chuva; profissionais qualificados; NR-18, NR-33 e NBR 9061", "4.5", G.EXE,
      "segurança e sequência executiva"),
    S("escav", "Escavação restrita ao perímetro externo, com profundidade ≈ à do anel; anel montado logo após a escavação", "6 c, d", G.EXE, "conforme projeto"),
    { id: "alin", texto: "Controle do alinhamento e nivelamento a cada 3 anéis", secao: "6 e", grupo: G.EXE, tipo: "sim_nao", exigido: "conforme projeto específico",
      freq: { por: "contagem", a_cada: 1, qtd: nVerif, unidade: "verificação(ões)", regra: "ao final da montagem de cada 3 anéis" } },
    S("reaperto", "Parafusos reapertados com o torque do projeto ou do fabricante; tamponamento e limpeza ao término", "6 d", G.EXE, "torque recomendado"),
    S("injecao", "Vazios entre chapas e terreno preenchidos por injeção de argamassa de solo-cimento", "6 f", G.EXE, "sem fluxo de água na interface"),
    S("ilum", "Iluminação de 12 V protegida e ventilação forçada quando necessárias", "6 Nota 6", G.EXE, "sistema de 12 V", { se: function (P) { return P.ilum === "sim"; } }),
    // produto
    S("geom", "Alinhamento, esconsidade, declividade, comprimentos e cotas do bueiro e das bocas conforme projeto (topografia)", "8.2.1", G.PRO, "Notas de Serviço"),
    S("deform", "Controle topográfico das deformações da seção na frente de escavação (forma dos segmentos mantida)", "8.2.1", G.PRO,
      "estroncas, tirantes ou escoramentos telescópicos ajustados"),
    S("recalq", "Instrumentação da superfície para acompanhamento de recalques", "8.2.1", G.PRO, "conforme projeto", { se: function (P) { return P.recalq === "sim"; } }),
  ].concat(D.itensGeo("8.2.1", G.PRO), [
    S("acab", "Acabamento (inspeção visual)", "8.2.2", G.PRO, "sem prejuízo à operação hidráulica da canalização"),
    S("amb", "Condicionantes ambientais (DNIT 070-PRO e componente ambiental do projeto)", "7", G.AMB, "conforme documentação ambiental"),
  ]);

  var F = D.montar({
    id: "dnit-024-2025-es",
    titulo: "Bueiros metálicos sem interrupção do tráfego — aceitação do serviço",
    resumo: "Controle da DNIT 024/2025-ES: certificados das chapas (NBR 16091), sondagem prévia, montagem dos anéis com vedante e reaperto, alinhamento e nivelamento " +
      "a cada 3 anéis, injeção de solo-cimento, controle geométrico (seções ≤ 1 %, espessuras ± 10 %), deformações e acabamento.",
    lote: { largura: false },
    refs: { reprova: "8.2.3", atende: "8.2.3", regra: "8.2.3" },
    params: [
      { k: "aneis", r: "Anéis montados no lote", dica: "controle de alinhamento e nivelamento ao final de cada 3 anéis (6 e)" },
      { k: "esgot", r: "Houve esgotamento / desvio do fluxo?", tipo: "select", recarrega: true, opcoes: [["nao", "Não"], ["sim", "Sim"]] },
      { k: "ilum", r: "Iluminação / ventilação no túnel?", tipo: "select", recarrega: true, opcoes: [["nao", "Não"], ["sim", "Sim"]] },
      { k: "recalq", r: "Instrumentação de recalques prevista no projeto?", tipo: "select", recarrega: true, opcoes: [["nao", "Não"], ["sim", "Sim"]] },
      { k: "revest", r: "Revestimento interno em concreto?", tipo: "select", recarrega: true, opcoes: [["nao", "Não"], ["sim", "Sim"]] },
      { k: "fck", r: "fck do concreto do revestimento (MPa)", se: function (d) { return revest(d.params || {}); }, dica: "a ES não fixa o fck: vale o do projeto" },
    ].concat(D.paramsConcreto(function (d) { return revest(d.params || {}); })),
    padrao: { esgot: "nao", ilum: "nao", recalq: "nao", revest: "nao", amostragem: "parcial", condicao: "B" },
    criterios: CRIT,
    extra: function (ctx) { D.extraConcreto(ctx, [{ id: "fc", fck: num(ctx.P.fck), secao: "8.1" }], "abat"); },
    notas: "Critérios da DNIT 024/2025-ES. Alinhamento e nivelamento verificados ao final de cada 3 anéis (6 e); seções transversais com desvio ≤ 1 % em pontos isolados " +
      "e espessuras em ± 10 % (8.2.1). A ES não traz critério de resistência na seção 8.2.3; com revestimento interno em concreto, o controle da NBR 12655 citado em 8.1 " +
      "é aplicado aqui como fck,est ≥ fck de projeto. Detalhe incorreto deve ser corrigido; só é aceito se a correção o colocar em conformidade (8.2.3).",
  });

  function V(mapa) { return D.verificacoes(CRIT, mapa); }
  F.exemplos = [
    { nome: "Tunnel liner Ø 1,60 m com 24 anéis — aceito", dados: function () {
      return {
        ident: { registro: "LOTE-BM-01", obra: "Obra A", trecho: "BR-000 — travessia sob o aterro", camada: "Bueiro metálico Ø 1,60 m (tunnel liner)", data: "2026-05-28" },
        params: { estIni: "212", estFim: "213+04", aneis: "24", esgot: "sim", ilum: "sim", recalq: "sim", revest: "nao" },
        verificacoes: V({ alin: { real: "8", nc: "0" }, deform: { real: "24", nc: "0" }, recalq: { real: "6", nc: "0" } }),
        geoSec: [{ est: "", elem: "anel 6 — diâmetro vertical", proj: "160", med: "160,9" }, { est: "", elem: "anel 12 — diâmetro horizontal", proj: "160", med: "159,2" },
          { est: "", elem: "anel 18 — diâmetro vertical", proj: "160", med: "161,1" }],
        geoEsp: [{ est: "", elem: "anel 12 — camada de solo-cimento injetada", proj: "10", med: "10,8" }],
      };
    } },
    { nome: "Tunnel liner Ø 1,20 m com 30 anéis — controle de alinhamento incompleto e seção deformada (rejeitado)", dados: function () {
      return {
        ident: { registro: "LOTE-BM-02", obra: "Obra B", trecho: "BR-000 — travessia sob o aterro", camada: "Bueiro metálico Ø 1,20 m (tunnel liner)", data: "2026-07-21" },
        params: { estIni: "80", estFim: "81+10", aneis: "30", esgot: "nao", ilum: "nao", recalq: "nao", revest: "nao" },
        verificacoes: V({ alin: { real: "7", nc: "0", obs: "sem controle após os anéis 22 a 30" },
          deform: { real: "30", nc: "1", obs: "ovalização no anel 17" } }),
        geoSec: [{ est: "", elem: "anel 10 — diâmetro vertical", proj: "120", med: "120,8" }, { est: "", elem: "anel 17 — diâmetro vertical", proj: "120", med: "117,6" }],
        geoEsp: [{ est: "", elem: "anel 17 — camada de solo-cimento injetada", proj: "10", med: "9,5" }],
      };
    } },
  ];
})();
