/*
 * Ficha de aceitação — DNER-ES 358/97 Edificações — Instalações de água.
 * Usa FE.aceitacaoG10b (definido em es-dner-es-353-97.js).
 */
(function () {
  "use strict";
  var FE = window.FE, G = FE.aceitacaoG10b, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  // 6.3.2: pressão de prova 50 % superior à estática máxima da instalação
  function pProva(P) { var p = num((P || {}).pEst); return ok(p) ? 1.5 * p : NaN; }
  var sim = G.se;

  var F = G.ficha({
    id: "dner-es-358-97",
    titulo: "Instalações de água (DNER-ES 358/97) — aceitação",
    resumo: "Inspeção das canalizações de água fria e quente (seção 5) — declividade ≥ 2 % no sentido do escoamento (5.4), recobrimento " +
      "≥ 0,5 m sob vias e ≥ 0,3 m nos demais casos (5.5), braçadeiras a cada 3,0 m (5.2), juntas, PVC, aço galvanizado, água quente e aquecedores — " +
      "e prova de pressão interna (6.3): 1,5 × a pressão estática máxima, nunca menos de 1 kgf/cm² em ponto algum, por 6 h no mínimo.",
    lote: false,
    params: [
      { k: "nUnid", r: "Nº de unidades de serviço do lote", dica: "medição por unidade de serviço executado (seção 7)" },
      { k: "pEst", r: "Pressão estática máxima na instalação (kgf/cm²)", dica: "6.3.2: a prova é feita com pressão 50 % superior (1 kgf/cm² ≈ 10 m c.a.)" },
      G.sel("aparente", "Há colunas não embutidas (chaminés falsas / shafts)? (5.2)"),
      G.sel("enterrada", "Há canalizações enterradas? (5.5)"),
      G.sel("galv", "Há tubos de aço galvanizado? (5.9)"),
      G.sel("pvc", "Há tubos de PVC? (5.10)"),
      G.sel("recalque", "Há sucção/recalque de bombas? (5.9.2/5.9.3)"),
      G.sel("quente", "Há água quente? (5.6/5.11 a 5.13)"),
      G.sel("aquecedor", "Há aquecedores de acumulação ou de passagem? (5.14)"),
    ],
    padrao: { aparente: "nao", enterrada: "sim", galv: "nao", pvc: "sim", recalque: "sim", quente: "nao", aquecedor: "nao" },
    providencias: G.providencias("6.4.3"),
    criterios: [
      { id: "projeto", grupo: "Condições gerais", texto: "Execução conforme projeto, desenhos e demais elementos", secao: "4.1", tipo: "sim_nao", exigido: "conforme o projeto" },
      { id: "antes", grupo: "Assentamento", texto: "Canalizações assentes antes das alvenarias; colunas embutidas (ou em espaços previstos, com braçadeiras)", secao: "5.1/5.2",
        tipo: "sim_nao", exigido: "5.1 e 5.2 atendidos" },
      { id: "bracad", grupo: "Assentamento", texto: "Espaçamento das braçadeiras das colunas não embutidas", secao: "5.2", tipo: "valor", unid: "m", casas: 2, max: 3.0,
        se: sim("aparente"), metodo: "trena", exigido: "de 3,0 m em 3,0 m, no mínimo (≤ 3,0 m)" },
      { id: "furos", grupo: "Assentamento", texto: "Passagens na estrutura locadas com tacos, buchas ou bainhas antes da concretagem; estanqueidade em reservatórios",
        secao: "5.3", tipo: "sim_nao", exigido: "passagens previstas; sem esforços; dilatação livre" },
      { id: "decl", grupo: "Assentamento", texto: "Declividade das canalizações de distribuição no sentido do escoamento", secao: "5.4", tipo: "valor", unid: "%", casas: 1, min: 2.0,
        metodo: "nível / trena", exigido: "≥ 2 % (nunca horizontais nem em sentido inverso)" },
      { id: "recVia", grupo: "Assentamento", texto: "Recobrimento das canalizações enterradas sob o leito de vias trafegáveis", secao: "5.5", tipo: "valor", unid: "m", casas: 2,
        min: 0.5, se: sim("enterrada"), metodo: "trena" },
      { id: "recOut", grupo: "Assentamento", texto: "Recobrimento das canalizações enterradas nos demais casos", secao: "5.5", tipo: "valor", unid: "m", casas: 2, min: 0.3,
        se: sim("enterrada"), metodo: "trena" },
      { id: "protEnt", grupo: "Assentamento", texto: "Enterradas protegidas contra acesso de água poluída; nenhuma canalização dentro de fossas, poços, caixas de inspeção ou valas",
        secao: "5.5/5.7", tipo: "sim_nao", exigido: "5.5 e 5.7 atendidos" },
      { id: "bujoes", grupo: "Assentamento", texto: "Extremidades livres vedadas com bujões ou plugues rosqueados (não buchas de madeira ou papel)", secao: "5.8", tipo: "sim_nao",
        exigido: "bujões/plugues apertados" },
      { id: "galvI", grupo: "Tubos e juntas", texto: "Aço galvanizado não curvado (joelhos e curvas); juntas rosqueadas com sisal + zarcão ou calafetador de resina, sem excesso",
        secao: "5.9/5.9.1", tipo: "sim_nao", se: sim("galv"), exigido: "5.9 e 5.9.1 atendidos" },
      { id: "recalqI", grupo: "Tubos e juntas", texto: "Sucção/recalque: curvas (não joelhos) nas deflexões de 90°; uniões ou flanges para desmontagem", secao: "5.9.2/5.9.3",
        tipo: "sim_nao", se: sim("recalque"), exigido: "curvas; uniões/flanges" },
      { id: "pvcI", grupo: "Tubos e juntas", texto: "PVC: roscas com tarraxa, corte em esquadro, vedação adequada; sem tubos rosqueados enterrados; curvamento só com areia e calor sem chama; leito sem pedras",
        secao: "5.10 a 5.10.5", tipo: "sim_nao", se: sim("pvc"), exigido: "5.10 a 5.10.5 atendidos" },
      { id: "quenteI", grupo: "Água quente", texto: "Água quente: canaletas inspecionáveis abaixo do solo, materiais próprios, isolamento térmico, juntas de dilatação e pontos fixos/deslizantes; cuidado na união cobre–aço",
        secao: "5.6/5.11 a 5.13", tipo: "sim_nao", se: sim("quente"), exigido: "5.6 e 5.11 a 5.13 atendidos" },
      { id: "aquecI", grupo: "Água quente", texto: "Aquecedores ligados conforme o tipo (alimentação por baixo, registro de gaveta, suspiro / válvula de segurança sem válvula de retenção)",
        secao: "5.14", tipo: "sim_nao", se: sim("aquecedor"), exigido: "5.14.1 e 5.14.2 atendidos" },
      { id: "embal", grupo: "Inspeção", texto: "Materiais recebidos nas embalagens originais invioladas", secao: "6.1", tipo: "sim_nao", exigido: "embalagens invioladas" },
      { id: "cotas", grupo: "Inspeção", texto: "Alinhamentos, cotas e dimensões conforme o projeto", secao: "6.2", tipo: "sim_nao", exigido: "conforme o projeto" },
    ],
    medicoes: [
      G.prova({ id: "prova", grupo: "Verificação final", texto: "Prova de pressão interna das tubulações de distribuição", secao: "6.3.1/6.3.2",
        unid: "kgf/cm²", casas: 2, pMin: pProva, durMin: 6, durUnid: "h", metodo: "manômetro; tubulação cheia lentamente, sem ar",
        regra: "todas as tubulações, antes de pintura, fechamento de rasgos ou isolamento",
        colunas: [{ k: "pPonto", r: "Menor pressão na canalização (ponto mais alto)", u: "kgf/cm²" }],
        exigidoExtra: "≥ 1 kgf/cm² em todos os pontos",
        checarExtra: function (c, P, f) {
          var pp = num(c.pPonto);
          if (ok(pp) && pp < 1 - 1e-9) f.push({ txt: "pressão de " + fmt(pp, 2) + " kgf/cm² no ponto mais desfavorável (< 1 kgf/cm²)" });
        } }),
    ],
    extra: function (ctx) {
      if (!ok(num(ctx.P.pEst))) {
        var l = ctx.item.prova;
        if (l && l.n) FE.aceitacao.marcar(l, "pendente", "informe a pressão estática máxima da instalação (parâmetro) para conferir a pressão de prova");
      }
    },
    notas: "DNER-ES 358/97: aceitação condicionada ao atendimento das exigências (6.4.1); trabalhos em desacordo são rejeitados e refeitos pelo executante (6.4.2/6.4.3). " +
      "Prova de pressão (6.3.2): água a 1,5 × a pressão estática máxima, sem descer a menos de 1 kgf/cm² em ponto algum, por no mínimo 6 h; conforme se não houver " +
      "queda de pressão nem vazamento. Braçadeiras \"de 3,0 m em 3,0 m, no mínimo\" (5.2) lidas como espaçamento máximo de 3,0 m.",
  });

  F.exemplos = [
    { nome: "Lote aceito — água fria do bloco com recalque (Obra A)", dados: function () {
      return G.dados(F, { ident: { registro: "AGU-01", data: "2026-08-18", obra: "Obra A — edifício administrativo", local: "Bloco 1 — ramais, colunas e recalque",
          camada: "PVC soldável e aço galvanizado no recalque" },
        params: { nUnid: "1", pEst: "1,2", galv: "sim" },
        verif: {},
        decl: [{ est: "Ramal sanitários", v: "2,5" }, { est: "Ramal copa", v: "2,0" }, { est: "Barrilete", v: "2,2" }],
        recVia: [{ est: "Travessia do pátio", v: "0,60" }],
        recOut: [{ est: "Alimentação — jardim", v: "0,35" }, { est: "Recalque — lateral", v: "0,40" }],
        prova: [{ local: "Ramais do térreo", p: "1,80", pPonto: "1,50", t: "6,0", queda: "0", vaz: "N" },
          { local: "Colunas e barrilete", p: "1,85", pPonto: "1,10", t: "6,5", queda: "0", vaz: "N" }] });
    } },
    { nome: "Lote rejeitado — ramal horizontal e prova curta com queda de pressão (Obra B)", dados: function () {
      return G.dados(F, { ident: { registro: "AGU-02", data: "2026-09-09", obra: "Obra B — posto de pesagem", local: "Alojamento e vestiários",
          camada: "PVC soldável" },
        params: { nUnid: "1", pEst: "0,8", recalque: "nao", quente: "sim" },
        verif: { quenteI: { real: "3", nc: "1", obs: "trecho do chuveiro 2 sem isolamento térmico" } },
        decl: [{ est: "Ramal vestiário", v: "2,0" }, { est: "Ramal alojamento", v: "0,5" }],
        recVia: [{ est: "Acesso de veículos", v: "0,45" }],
        recOut: [{ est: "Alimentação", v: "0,30" }],
        prova: [{ local: "Vestiários", p: "1,20", pPonto: "1,00", t: "6,0", queda: "0", vaz: "N" },
          { local: "Alojamento", p: "1,20", pPonto: "0,90", t: "4,0", queda: "0,15", vaz: "N" }] });
    } },
  ];
})();
