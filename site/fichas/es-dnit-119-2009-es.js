/*
 * Ficha de ES: DNIT 119/2009-ES — Pontes e viadutos rodoviários — Armaduras para concreto protendido (aceitação dos
 * insumos e da montagem dos cabos). Usa FE.aceitacao e FE.aceitacaoG9b (es-dnit-116-2009-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG9b, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var ID = "dnit-119-2009-es";
  var GI = "Insumos (4; 5.1; 7.1)", GE = "Armazenagem e montagem (5.3; 7.2)";

  var CRIT = [
    { id: "cert", grupo: GI, texto: "Certificados do fabricante: data, lote, nº e quantidade de rolos, características dimensionais, mecânicas e químicas", secao: "7.1", tipo: "sim_nao",
      exigido: "conforme NBR 7482 (fios) / NBR 7483 (cordoalhas)" },
    { id: "ident", grupo: GI, texto: "Identificação de cada rolo/carretel (produtor, norma, categoria, relaxação, diâmetro, nº, massa)", secao: "5.1.1 a, b", tipo: "sim_nao" },
    { id: "corrosao", grupo: GI, texto: "Aço sem corrosão (rejeição imediata); integridade física verificada", secao: "4; 7.1 a", tipo: "sim_nao",
      exigido: "sem corrosão; leve oxidação superficial e uniforme só a critério da Fiscalização (5.3.3)" },
    { id: "ensaios", grupo: GI, texto: "Ensaios de tração, relaxação e dobramento alternado satisfatórios", secao: "7.1; 7.3", tipo: "sim_nao",
      metodo: "NBR 6349, NBR 7484, NBR 6004", exigido: "aceitação/rejeição pela seção 7 da NBR 7482 ou NBR 7483",
      freq: { por: "contagem", qtd: "massa", a_cada: 25, minimo: 1, unidade: "t do mesmo lote", regra: "1 rolo (amostra da extremidade externa) a cada 25 t do mesmo lote" } },
    { id: "cp_l", grupo: GI, texto: "Comprimento dos corpos de prova", secao: "7.1", tipo: "valor", unid: "mm", casas: 0, falha: "ressalva",
      min: function (P) { return lMin(P); }, exigido: "L ≥ Lo + 45·√Sn (recomendado)",
      se: function (P) { return ok(lMin(P)); }, naoAplicaPor: "informe diâmetro/passo e área nominal" },
    { id: "armaz", grupo: GE, texto: "Armazenagem abrigada, sobre estrados ≥ 20 cm acima do solo; sem mistura de procedências", secao: "5.3.1", tipo: "sim_nao" },
    { id: "bainha_d", grupo: GE, texto: "Bainhas sem amassamentos, furos ou rasgos; emendas por luvas estanques", secao: "5.3.1; 5.3.2", tipo: "sim_nao" },
    { id: "emendas", grupo: GE, texto: "Fios e cordoalhas sem emendas (barras de aço duplo filetado: só por luvas)", secao: "5.3.2", tipo: "sim_nao" },
    { id: "cabo", grupo: GE, texto: "Cabos cortados conforme projeto, limpos, de uma mesma partida de aço", secao: "5.3.3", tipo: "sim_nao" },
    { id: "purg", grupo: GE, texto: "Purgadores nos locais do projeto, protegidos, sem amassamento ou estrangulamento", secao: "5.3.3", tipo: "sim_nao" },
    { id: "ancor", grupo: GE, texto: "Ancoragens limpas; armaduras de fretagem colocadas; sem vazios na zona das ancoragens", secao: "5.3.4", tipo: "sim_nao" },
    { id: "fix", grupo: GE, texto: "Espaçamento entre as fixações das bainhas", secao: "5.3.3", tipo: "valor", unid: "m", casas: 2, max: 0.99, exigido: "< 1,0 m (espaços regulares)" },
    { id: "pos_bainha", grupo: GE, texto: "Posição das bainhas — desvio em relação ao projeto", secao: "7.2", tipo: "valor", unid: "mm", casas: 0, min: -5, max: 5, exigido: "± 5 mm",
      freq: { por: "contagem", qtd: "cabos", a_cada: 1, minimo: 1, regra: "ao menos 1 ponto por cabo" } },
    { id: "pos_anc", grupo: GE, texto: "Posição das ancoragens — desvio em relação ao projeto", secao: "7.2", tipo: "valor", unid: "mm", casas: 0, min: -1, max: 1, exigido: "± 1 mm",
      freq: { por: "contagem", qtd: function (P) { return 2 * num(P.cabos); }, a_cada: 1, minimo: 1, regra: "2 ancoragens por cabo" } },
    { id: "equip", grupo: GE, texto: "Macacos e bombas aferidos e testados antes da protensão e da injeção", secao: "5.2", tipo: "sim_nao" },
  ];
  // 7.1: L = Lo + 45·√Sn; Lo = 40φ (barras e fios) ou 4 passos (cordoalhas); Sn em mm² → L em mm
  function lMin(P) {
    var Sn = num(P.area), lo = P.produto === "cordoalha" ? 4 * num(P.passo) : 40 * num(P.diam);
    return ok(Sn) && ok(lo) ? lo + 45 * Math.sqrt(Sn) : NaN;
  }

  var F = A.fichaSimples({
    id: ID, registrar: false,
    titulo: "Pontes e viadutos — armaduras de protensão — aceitação",
    resumo: "Aceitação dos fios, cordoalhas e barras de protensão e da montagem dos cabos pela DNIT 119/2009-ES: certificados e ensaios (7.1 — 1 rolo a cada 25 t do mesmo lote; comprimento do CP L = Lo + 45·√Sn), ausência de corrosão (4), armazenagem, bainhas, purgadores e ancoragens (5.3) e tolerâncias de posição (7.2: bainhas ± 5 mm; ancoragens ± 1 mm).",
    lote: false,
    params: [
      { k: "lote", r: "Lote / partida", ph: "ex.: cordoalhas CP-190 RB 12,7 — partida 1" },
      { k: "produto", r: "Produto", tipo: "select", opcoes: [["cordoalha", "Cordoalha (NBR 7483)"], ["fio", "Fio (NBR 7482)"], ["barra", "Barra de alta resistência"]] },
      { k: "massa", r: "Massa do lote (t)" },
      { k: "diam", r: "Diâmetro nominal (mm)", se: function (d) { return (d.params || {}).produto !== "cordoalha"; } },
      { k: "passo", r: "Passo da cordoalha (mm)", se: function (d) { return (d.params || {}).produto === "cordoalha"; } },
      { k: "area", r: "Área nominal da seção Sn (mm²)" },
      { k: "cabos", r: "Cabos montados no elemento (nº)" },
    ],
    padrao: { produto: "cordoalha" },
    criterios: CRIT,
    refs: { reprova: "7.3", atende: "7.3", regra: "7.3" },
    extra: function (ctx) {
      var L = lMin(ctx.P);
      if (ok(L)) ctx.avisos.push("Comprimento mínimo recomendado do corpo de prova (7.1): L = Lo + 45·√Sn = " + fmt(L, 0) + " mm.");
    },
    notas: "Critérios da DNIT 119/2009-ES. Insumos: certificados e ensaios conforme NBR 7482/7483 (seção 6: amostragem; seção 7: aceitação), 1 amostra da extremidade externa de um rolo a cada 25 t do mesmo lote, sem tensionamento nem aquecimento; comprimento do CP L = Lo + 45·√Sn (Lo = 40φ para fios e barras, 4 passos para cordoalhas). Aço corroído: rejeição (4). Execução: bainhas fixadas a menos de 1,0 m, posição ± 5 mm; ancoragens ± 1 mm (7.2). Armaduras passivas: DNIT 118/2009-ES (5.1.2).",
    exemplos: [
      { nome: "Cordoalhas CP-190 RB 12,7, 48 t, 4 cabos — aceito", dados: function () {
        return { ident: { registro: "PROT-01", obra: "Obra A — ponte sobre o rio A", camada: "Vigas longarinas — cabos 4 × 12φ12,7", data: "2025-06-03" },
          params: { lote: "Cordoalhas CP-190 RB 12,7 — partida 1", produto: "cordoalha", massa: "48", passo: "200", area: "98,7", cabos: "4" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S", real: "2", obs: "2 rolos ensaiados (2 × 25 t)" }, { atende: "S" }, { atende: "S" },
            { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }],
          cp_l: [{ est: "rolo 11", v: "1300" }, { est: "rolo 27", v: "1300" }],
          fix: [{ est: "viga V1", v: "0,80" }, { est: "viga V2", v: "0,80" }],
          pos_bainha: [{ est: "cabo 1", pos: "meio do vão", v: "3" }, { est: "cabo 2", pos: "meio do vão", v: "-2" }, { est: "cabo 3", pos: "1/4 do vão", v: "4" }, { est: "cabo 4", pos: "1/4 do vão", v: "-1" }],
          pos_anc: [{ est: "cabo 1", v: "0" }, { est: "cabo 1", v: "1" }, { est: "cabo 2", v: "0" }, { est: "cabo 2", v: "-1" }, { est: "cabo 3", v: "1" }, { est: "cabo 3", v: "0" }, { est: "cabo 4", v: "0" }, { est: "cabo 4", v: "0" }] };
      } },
      { nome: "Rolo com corrosão, bainha fora de posição e fixação a 1,2 m — rejeitado", dados: function () {
        return { ident: { registro: "PROT-02", obra: "Obra B — viaduto", camada: "Laje protendida — cabos monocordoalha", data: "2025-07-21" },
          params: { lote: "Cordoalhas CP-190 RB 15,2 — partida 2", produto: "cordoalha", massa: "30", passo: "230", area: "140", cabos: "3" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { real: "4", nc: "1", obs: "rolo 8 com pontos de corrosão" }, { atende: "S", real: "1" }, { atende: "S" }, { atende: "N", obs: "bainha amassada no cabo 2" },
            { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }],
          cp_l: [{ est: "rolo 3", v: "1450" }],
          fix: [{ est: "cabo 1", v: "0,90" }, { est: "cabo 2", v: "1,20" }],
          pos_bainha: [{ est: "cabo 1", v: "4" }, { est: "cabo 2", v: "9" }, { est: "cabo 3", v: "-3" }],
          pos_anc: [{ est: "cabo 1", v: "1" }, { est: "cabo 1", v: "0" }, { est: "cabo 2", v: "2" }, { est: "cabo 2", v: "0" }, { est: "cabo 3", v: "0" }, { est: "cabo 3", v: "-1" }] };
      } },
    ],
  });
  G.registrar(F, ID);
})();
