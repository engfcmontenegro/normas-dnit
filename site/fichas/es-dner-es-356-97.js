/*
 * Ficha de aceitação — DNER-ES 356/97 Edificações — Pintura.
 * Usa FE.aceitacaoG10b (definido em es-dner-es-353-97.js).
 */
(function () {
  "use strict";
  var FE = window.FE, G = FE.aceitacaoG10b, num = FE.num, ok = FE.ok;
  function demaosMin(P) { var n = num((P || {}).demaosFab); return Math.max(2, ok(n) ? n : 2); }
  function intervalo(P) { var h = num((P || {}).intervalo); return ok(h) ? h : 24; }
  var sub = function (v) { return function (P) { return P.substrato === v; }; };

  var F = G.ficha({
    id: "dner-es-356-97",
    titulo: "Pintura (DNER-ES 356/97) — aceitação do serviço",
    resumo: "Verificação das etapas da pintura (5.1 a 5.5): preparação da superfície, fundos/massas/primer conforme o substrato, " +
      "número de demãos (suficiente para cobrir e nunca inferior a duas), intervalo de 24 h entre demãos, proteção das superfícies, " +
      "embalagens originais invioladas (6.1.1) e verificação final visual da uniformidade de cor e ausência de manchas (6.2).",
    lote: false,
    params: [
      { k: "qtd", r: "Área pintada no lote (m²)", dica: "medição por m² de superfície trabalhada (seção 7)" },
      G.sel("substrato", "Superfície", [["reboco", "Parede com reboco"], ["madeira", "Madeira"], ["metal", "Ferro ou aço"]]),
      G.sel("verniz", "Aplicação de verniz? (5.5)"),
      { k: "demaosFab", r: "Nº de demãos especificado pelo fabricante", ph: "2", dica: "5.4: nunca inferior a duas" },
      { k: "intervalo", r: "Intervalo mínimo entre demãos (h)", ph: "24", dica: "5.4.1: 24 h, salvo especificado em contrário" },
    ],
    padrao: { substrato: "reboco", verniz: "nao", demaosFab: "2", intervalo: "24" },
    providencias: G.providencias("6.3.3"),
    criterios: [
      { id: "projeto", grupo: "Condições gerais", texto: "Execução conforme projeto, normas ABNT e prescrições do fabricante da tinta", secao: "4/5.1", tipo: "sim_nao",
        exigido: "conforme projeto e fabricante" },
      { id: "prep", grupo: "Preparação da superfície", texto: "Superfície limpa, seca, lisa, plana, isenta de graxas, óleos, ceras, sais e ferrugem; lixada e sem poeira",
        secao: "5.2.1 a 5.2.3", tipo: "sim_nao", exigido: "superfície preparada; porosidade exagerada corrigida (5.2.2)" },
      { id: "fundoReb", grupo: "Fundos, massas e condicionantes", texto: "Reboco: selador, massa nas falhas após a 1ª demão do selador e aparelhamento", secao: "5.3.1",
        tipo: "sim_nao", se: sub("reboco"), exigido: "selador + massa + aparelhamento" },
      { id: "fundoMad", grupo: "Fundos, massas e condicionantes", texto: "Madeira: mesma sequência do reboco (selador, massa, aparelhamento)", secao: "5.3.2",
        tipo: "sim_nao", se: sub("madeira"), exigido: "sequência do 5.3.1" },
      { id: "fundoMet", grupo: "Fundos, massas e condicionantes", texto: "Ferro/aço: desengraxe, remoção da ferrugem (areia, jato ou esmeril) e primer (zarcão, óxido de ferro ou cromato de zinco)",
        secao: "5.2.4/5.3.3", tipo: "sim_nao", se: sub("metal"), exigido: "desengraxe + limpeza + primer" },
      { id: "demaos", grupo: "Pintura", texto: "Número de demãos de acabamento", secao: "5.4", tipo: "valor", unid: "demãos", casas: 0,
        min: demaosMin, metodo: "registro de aplicação", exigido: "suficiente para cobrir; ≥ 2 e ≥ o do fabricante" },
      { id: "interv", grupo: "Pintura", texto: "Intervalo entre demãos sucessivas", secao: "5.4.1", tipo: "valor", unid: "h", casas: 0, min: intervalo,
        metodo: "diário de obra", exigido: "≥ 24 h (salvo especificado em contrário), demão anterior seca" },
      { id: "chuva", grupo: "Pintura", texto: "Demão sobre a anterior seca; pintura em locais desabrigados suspensa em tempo de chuva", secao: "5.4.1/5.4.2",
        tipo: "sim_nao", exigido: "sem aplicação sobre demão úmida ou sob chuva" },
      { id: "protec", grupo: "Pintura", texto: "Superfícies não destinadas à pintura protegidas (guarnições de esquadrias etc.)", secao: "5.4.3", tipo: "sim_nao",
        exigido: "sem respingos em superfícies não pintadas" },
      { id: "verniz", grupo: "Verniz", texto: "Verniz sem adição de óleo ou álcool (aguarrás só em pequena quantidade); aplicado a pincel ou boneca", secao: "5.5.1/5.5.2",
        tipo: "sim_nao", se: G.se("verniz"), exigido: "sem óleo ou álcool" },
      { id: "embal", grupo: "Inspeção", texto: "Materiais recebidos nas embalagens originais invioladas", secao: "6.1.1", tipo: "sim_nao", exigido: "embalagens invioladas" },
      { id: "final", grupo: "Inspeção", texto: "Verificação final visual: uniformidade de coloração e inexistência de manchas", secao: "6.2", tipo: "sim_nao",
        exigido: "cor uniforme, sem manchas", freq: { por: "lote", minimo: 1, regra: "toda a superfície pintada (por ambiente/pano)" } },
    ],
    notas: "DNER-ES 356/97: aceitação condicionada ao atendimento das exigências da ES (6.3.1); trabalhos em desacordo são rejeitados e refeitos pelo executante (6.3.2/6.3.3). " +
      "Número de demãos: o maior entre 2 e o especificado pelo fabricante (5.4); intervalo de 24 h salvo especificação em contrário (5.4.1).",
  });

  F.exemplos = [
    { nome: "Lote aceito — pintura acrílica em paredes rebocadas (Obra A)", dados: function () {
      return G.dados(F, { ident: { registro: "PIN-01", data: "2026-09-01", obra: "Obra A — edifício administrativo", local: "Bloco 1 — salas 1 a 6",
          camada: "Selador acrílico + massa corrida + tinta acrílica fosca" },
        params: { qtd: "412", substrato: "reboco" },
        verificacoes: [{ atende: "S" }, { real: "6", nc: "0" }, { real: "6", nc: "0" }, {}, {}, { atende: "S" }, { atende: "S" }, {}, { atende: "S" }, { real: "6", nc: "0" }],
        demaos: [{ est: "Sala 1", v: "2" }, { est: "Sala 2", v: "2" }, { est: "Sala 3", v: "3" }, { est: "Sala 4", v: "2" }, { est: "Sala 5", v: "2" }, { est: "Sala 6", v: "2" }],
        interv: [{ est: "Salas 1–3", v: "26" }, { est: "Salas 4–6", v: "24" }] });
    } },
    { nome: "Lote rejeitado — esmalte em portão com uma demão e manchas (Obra B)", dados: function () {
      return G.dados(F, { ident: { registro: "PIN-02", data: "2026-09-10", obra: "Obra B — posto de pesagem", local: "Portões e gradis",
          camada: "Primer de zarcão + esmalte sintético" },
        params: { qtd: "56", substrato: "metal" },
        verificacoes: [{ atende: "S" }, { atende: "S" }, {}, {}, { atende: "S" }, { atende: "S" }, { atende: "S" }, {}, { atende: "S" },
          { real: "4", nc: "1", obs: "manchas e falhas de cobertura no portão 2" }],
        demaos: [{ est: "Portão 1", v: "2" }, { est: "Portão 2", v: "1" }, { est: "Gradil", v: "2" }],
        interv: [{ est: "Portão 1", v: "24" }, { est: "Gradil", v: "18" }] });
    } },
  ];
})();
