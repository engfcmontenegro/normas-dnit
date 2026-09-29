/*
 * Ficha de aceitação — DNER-ES 360/97 Edificações — Instalação de gás.
 * Usa FE.aceitacaoG10b (definido em es-dner-es-353-97.js).
 */
(function () {
  "use strict";
  var FE = window.FE, G = FE.aceitacaoG10b, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var sim = G.se;

  var F = G.ficha({
    id: "dner-es-360-97",
    titulo: "Instalação de gás (DNER-ES 360/97) — aceitação",
    resumo: "Inspeção da instalação interna de gás (seção 5) — locais proibidos ao ramal (5.1), alvenaria sem tijolos furados a 50,0 cm da prumada (5.2), " +
      "afastamento ≥ 0,2 m de outras canalizações (5.5), juntas, purgadores, registros, bainha com diâmetro interno 1\" (25,4 mm) maior que o ramal (5.11) — " +
      "e prova com ar comprimido a mais de 10,0 m c.a., sem variação durante 20 min (6.3).",
    lote: false,
    params: [
      { k: "nUnid", r: "Nº de unidades de serviço do lote", dica: "medição por unidade de serviço executado (seção 7)" },
      G.sel("embutida", "Há prumadas embutidas em paredes? (5.2)"),
      G.sel("bainha", "Há ramal passando em bainha? (5.11)"),
    ],
    padrao: { embutida: "sim", bainha: "nao" },
    providencias: G.providencias("6.4.3"),
    criterios: [
      { id: "projeto", grupo: "Condições gerais", texto: "Execução conforme projeto e códigos/posturas dos órgãos competentes", secao: "4", tipo: "sim_nao", exigido: "conforme o projeto" },
      { id: "locais", grupo: "Condições específicas", texto: "Ramal fora de tubos de lixo/ar condicionado, reservatórios, compartimentos elétricos, poços de elevador/ventilação e locais não ventilados",
        secao: "5.1", tipo: "sim_nao", exigido: "nenhuma passagem proibida (5.1.1 a 5.1.5)" },
      { id: "tijolo", grupo: "Condições específicas", texto: "Faixa de parede sem tijolos furados de cada lado da prumada embutida", secao: "5.2", tipo: "valor", unid: "cm", casas: 0, min: 50,
        se: sim("embutida"), metodo: "inspeção / trena", exigido: "≥ 50,0 cm para cada lado" },
      { id: "futuro", grupo: "Condições específicas", texto: "Canalizações para uso futuro fechadas com bujão de rosca ou tampa de metal em todas as entradas", secao: "5.3", tipo: "sim_nao",
        exigido: "todas as entradas fechadas" },
      { id: "tubos", grupo: "Condições específicas", texto: "Tubos sem rebarbas e sem defeitos de estrutura e de roscas", secao: "5.4", tipo: "sim_nao", exigido: "sem defeitos" },
      { id: "afast", grupo: "Condições específicas", texto: "Afastamento das ramificações de gás a canalizações de outra natureza", secao: "5.5", tipo: "valor", unid: "m", casas: 2, min: 0.2,
        metodo: "trena" },
      { id: "acima", grupo: "Condições específicas", texto: "Em superposição, gás acima das demais tubulações; declividade dirigindo o condensado aos coletores; purgadores onde necessário",
        secao: "5.5/5.8", tipo: "sim_nao", exigido: "5.5 e 5.8 atendidos" },
      { id: "juntas", grupo: "Condições específicas", texto: "Emendas por rosca à direita, flanges ou chumbo rebatido; vedação das juntas por processo do 5.7", secao: "5.6/5.7", tipo: "sim_nao",
        exigido: "vedação perfeita" },
      { id: "aparelhos", grupo: "Condições específicas", texto: "Aparelhos ligados por conexões rígidas, com registro que os isole sem interromper os demais", secao: "5.9", tipo: "sim_nao",
        exigido: "registro por aparelho" },
      { id: "purga", grupo: "Condições específicas", texto: "Na admissão do gás, ar retido expulso pelos registros dos aparelhos, com os locais arejados", secao: "5.10", tipo: "sim_nao",
        exigido: "purga do ar com ventilação" },
      { id: "embal", grupo: "Inspeção", texto: "Materiais em embalagens originais invioladas e com as características dos fabricantes", secao: "6.1.1/6.1.2", tipo: "sim_nao",
        exigido: "6.1 atendido" },
      { id: "cotas", grupo: "Inspeção", texto: "Cotas, alinhamentos e dimensões conforme o projeto", secao: "6.2", tipo: "sim_nao", exigido: "conforme o projeto" },
      { id: "semChama", grupo: "Verificação final", texto: "Pesquisa de escapamento sem chama e sem pressão de água na tubulação", secao: "6.3", tipo: "sim_nao",
        exigido: "proibido chama ou água" },
    ],
    medicoes: [
      { id: "bainhaD", apos: "afast", grupo: "Condições específicas", texto: "Bainha: diâmetro interno maior que o diâmetro externo do ramal", secao: "5.11", se: sim("bainha"),
        metodo: "paquímetro / catálogo", exigido: "Di,bainha − De,ramal ≥ 25,4 mm (1\")",
        colunas: [{ k: "di", r: "Diâmetro interno da bainha", u: "mm" }, { k: "de", r: "Diâmetro externo do ramal", u: "mm" }],
        checar: function (c) {
          var di = num(c.di), de = num(c.de);
          if (!ok(di) || !ok(de)) return { falta: "informe os dois diâmetros" };
          return { falhas: di - de < 25.4 - 1e-9 ? [{ txt: "folga diametral " + fmt(di - de, 1) + " mm < 25,4 mm" }] : [] };
        } },
      G.prova({ id: "prova", grupo: "Verificação final", texto: "Prova com ar comprimido (antes do fechamento dos rasgos e vazios)", secao: "6.3",
        unid: "m c.a.", casas: 1, pMin: 10.0, estrito: true, durMin: 20, durUnid: "min", rotuloQueda: "Variação de pressão observada",
        metodo: "manômetro", regra: "todas as tubulações, antes do fechamento dos rasgos" }),
    ],
    notas: "DNER-ES 360/97: aceitação condicionada ao atendimento das exigências (6.4.1); trabalhos em desacordo são rejeitados e refeitos pelo executante (6.4.2/6.4.3). " +
      "Prova (6.3): ar comprimido a pressão superior a 10,0 m c.a. (> 10,0), sem variação do valor durante 20 min; proibida a pesquisa de escapamento com chama ou água. " +
      "Bainha (5.11): diâmetro interno 1\" (25,4 mm) maior que o externo do ramal, conferido como diferença mínima.",
  });

  F.exemplos = [
    { nome: "Lote aceito — rede de gás da copa e do aquecedor (Obra A)", dados: function () {
      return G.dados(F, { ident: { registro: "GAS-01", data: "2026-08-31", obra: "Obra A — edifício administrativo", local: "Bloco 1 — copa e área técnica",
          camada: "Aço galvanizado 3/4\" com conexões roscadas" },
        params: { nUnid: "1", bainha: "sim" },
        verif: {},
        tijolo: [{ est: "Prumada P1 — lado esq.", v: "55" }, { est: "Prumada P1 — lado dir.", v: "60" }],
        afast: [{ est: "Cruzamento com água fria", v: "0,25" }, { est: "Paralelo ao eletroduto", v: "0,30" }],
        bainhaD: [{ local: "Travessia do piso da copa", di: "52,5", de: "26,7" }],
        prova: [{ local: "Rede completa", p: "12,0", t: "20", queda: "0", vaz: "N" }] });
    } },
    { nome: "Lote rejeitado — ramal colado ao eletroduto e prova com queda (Obra B)", dados: function () {
      return G.dados(F, { ident: { registro: "GAS-02", data: "2026-09-14", obra: "Obra B — posto de pesagem", local: "Cozinha do alojamento",
          camada: "Cobre com conexões soldadas" },
        params: { nUnid: "1" },
        verif: { semChama: { real: "1", nc: "1", obs: "vazamento procurado com chama de isqueiro" } },
        tijolo: [{ est: "Prumada — lado esq.", v: "50" }, { est: "Prumada — lado dir.", v: "50" }],
        afast: [{ est: "Paralelo ao eletroduto", v: "0,12" }],
        prova: [{ local: "Rede completa", p: "10,0", t: "20", queda: "0,3", vaz: "N" }] });
    } },
  ];
})();
