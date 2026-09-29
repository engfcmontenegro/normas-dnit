/*
 * Ficha de ES: DNIT 100/2018-ES — Sinalização horizontal — aceitação do segmento (A.fichaSimples via
 * FE.aceitacaoG11, definido em es-dnit-071-2006-es.js). Insumos (7.1), condições de aplicação (5.6 e 7.2),
 * controle na aplicação (7.3), geometria ± 5 % e desvio de borda (7.4.1), acabamento (7.4.2) e
 * retrorrefletividade inicial mínima (5.4 e 7.5).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG11, num = FE.num, ok = FE.ok, fmt = FE.fmt;

  // espessura de referência por material (Tabela 2 e 5.3.2.2 e) — mm
  var MAT = {
    em368: ["Tinta DNIT EM-368 (Tabela 2)", 0.6, "tinta"], em276: ["Tinta DNIT EM-276 (Tabela 2)", 0.5, "tinta"],
    nbr13731: ["Tinta NBR 13731 (Tabela 2)", 0.6, "tinta"], agua: ["Tinta acrílica à base de água — NBR 13699 (0,3 a 0,5 mm úmida)", 0.3, "tinta"],
    tpasp: ["Termoplástico por aspersão (1,5 mm)", 1.5, "termo"], tpext: ["Termoplástico por extrusão (3,0 mm)", 3.0, "termo"],
    relevo: ["Termoplástico alto-relevo — base (2,0 mm)", 2.0, "termo"], preform: ["Termoplástico pré-formado / elastoplástico (1,0 mm)", 1.0, "outro"],
    frio: ["Plástico a frio (NBR 15870) — espessura do projeto", NaN, "outro"],
  };
  function espMin(P) { var e = num(P.espProj); return ok(e) ? e : (MAT[P.material] || [])[1]; }
  var termo = function (P) { return (MAT[P.material] || [])[2] === "termo"; };
  var tinta = function (P) { return (MAT[P.material] || [])[2] === "tinta"; };
  var tachas = function (P) { return G.sim(P, "tachas"); };
  var def = function (P) { return P.sinal !== "provisoria"; };
  var branca = function (P) { return P.cores !== "amarela"; };
  var amarela = function (P) { return P.cores !== "branca"; };
  function tol(P, k, s) { var v = num(P[k]); return ok(v) ? v * (1 + s * 0.05) : NaN; }
  var retro = { por: "lote", minimo: 1, regra: "estações e leituras conforme NBR 14723 (5.4); 1 valor por estação" };
  var C = [
    { id: "relat", texto: "Relatório de ensaio do lote de fabricação (fabricante com certificação ISO ou laboratório credenciado) e etiquetas (tipo, quantidade, fabricação, validade, cor, tratamento das microesferas)",
      secao: "7.1; 4.3 b, c", grupo: "Insumos", tipo: "sim_nao", exigido: "por lote de fabricação" },
    { id: "escolha", texto: "Material e espessura compatíveis com o VMDa e o projeto (Tabelas 1 e 2)", secao: "5.3.1", grupo: "Insumos", tipo: "sim_nao" },
    { id: "talt", texto: "Tachas: altura acima do pavimento", secao: "5.1.6.3 b", grupo: "Insumos", tipo: "valor", unid: "cm", casas: 1, min: 1.7, max: 2.2,
      se: tachas, naoAplicaPor: "sem tachas", freq: G.lote("amostra do lote de tachas") },
    { id: "tlarg", texto: "Tachas: largura (paralela à face refletiva)", secao: "5.1.6.3 b", grupo: "Insumos", tipo: "valor", unid: "cm", casas: 1, min: 9.6, max: 13,
      se: tachas, naoAplicaPor: "sem tachas", freq: G.lote("amostra do lote de tachas") },
    { id: "tcomp", texto: "Tachas: comprimento", secao: "5.1.6.3 b", grupo: "Insumos", tipo: "valor", unid: "cm", casas: 1, min: 7.4, max: 11,
      se: tachas, naoAplicaPor: "sem tachas", freq: G.lote("amostra do lote de tachas") },
    { id: "cond", texto: "Superfície limpa, seca e isenta de óleos; pavimento ≥ 3 °C acima do ponto de orvalho (teste 4.8.4 da NBR 15402); sem chuva, neblina ou vento excessivo; sinalização de obra implantada",
      secao: "5.6 a, d; 7.2", grupo: "Aplicação", tipo: "sim_nao", exigido: "em cada jornada de aplicação" },
    { id: "tsup", texto: "Temperatura da superfície da via na aplicação", secao: "7.2", grupo: "Aplicação", tipo: "valor", unid: "°C", casas: 0, min: 5, max: 40,
      freq: G.lote("em cada jornada de aplicação") },
    { id: "tamb", texto: "Temperatura ambiente na aplicação", secao: "5.6 b, c", grupo: "Aplicação", tipo: "valor", unid: "°C", casas: 0, min: 10, max: 40,
      freq: G.lote("em cada jornada de aplicação") },
    { id: "ur", texto: "Umidade relativa do ar na aplicação", secao: "7.2", grupo: "Aplicação", tipo: "valor", unid: "%", casas: 0, max: 90,
      freq: G.lote("em cada jornada de aplicação") },
    { id: "tfusao", texto: "Temperatura de fusão do termoplástico", secao: "5.6; 7.3", grupo: "Aplicação", tipo: "valor", unid: "°C", casas: 0, min: 180, max: 200,
      se: termo, naoAplicaPor: "material não termoplástico", freq: G.lote("controle contínuo na aplicação") },
    { id: "solvente", texto: "Diluição da tinta com solvente", secao: "5.6", grupo: "Aplicação", tipo: "valor", unid: "% vol.", casas: 1, max: 5,
      se: tinta, naoAplicaPor: "material não é tinta", freq: G.lote() },
    { id: "espessura", texto: "Espessura do material aplicado", secao: "5.3.2.1 g; 5.3.2.2 e; Tabela 2; 7.3", grupo: "Aplicação", tipo: "valor", unid: "mm", casas: 2,
      min: espMin, exigido: "≥ espessura de projeto (Tabela 2 / 5.3.2.2 e)", freq: G.lote("durante a aplicação") },
    { id: "premarc", texto: "Pré-marcação conforme o projeto (reta nas tangentes, acompanhando o arco nas curvas); cadência das linhas seccionadas; homogeneização e consumo; tempo de secagem",
      secao: "5.6; 7.2; 7.3", grupo: "Aplicação", tipo: "sim_nao" },
    { id: "tachimp", texto: "Tachas: espaçamento do projeto (ou 16 m em tangente, 8 m em curva, 4 m em 150 m antes de obstáculos), fora das linhas, ≈ 10 cm para fora da linha de borda",
      secao: "5.1.6.2", grupo: "Aplicação", tipo: "sim_nao", se: tachas, naoAplicaPor: "sem tachas" },
    { id: "largura", texto: "Largura das faixas", secao: "7.4.1", grupo: "Produto", tipo: "valor", unid: "cm", casas: 1,
      min: function (P) { return tol(P, "largProj", -1); }, max: function (P) { return tol(P, "largProj", 1); }, exigido: "projeto ± 5 %",
      freq: G.lote("levantamento topográfico") },
    { id: "compr", texto: "Comprimento dos segmentos das linhas seccionadas", secao: "7.4.1", grupo: "Produto", tipo: "valor", unid: "m", casas: 2,
      min: function (P) { return tol(P, "compProj", -1); }, max: function (P) { return tol(P, "compProj", 1); }, exigido: "projeto ± 5 %",
      se: function (P) { return ok(num(P.compProj)); }, naoAplicaPor: "sem linhas seccionadas", freq: G.lote("levantamento topográfico") },
    { id: "borda", texto: "Desvio de borda em marcas retas (em 10 m)", secao: "7.4.1", grupo: "Produto", tipo: "valor", unid: "cm/10 m", casas: 1, max: 1.0,
      exigido: "≤ 0,01 m em 10 m", freq: G.lote("levantamento topográfico") },
    { id: "linear", texto: "Acabamento: linearidade das faixas (inspeção visual)", secao: "7.4.2", grupo: "Produto", tipo: "sim_nao" },
    { id: "rbranca", texto: "Retrorrefletividade inicial — cor branca", secao: "5.4; 7.5", grupo: "Produto", tipo: "valor", unid: "mcd/lx·m²", casas: 0,
      min: function (P) { return def(P) ? 250 : 150; }, se: branca, naoAplicaPor: "sem faixas brancas", exigido: "≥ 250 (definitiva) / ≥ 150 (provisória)", freq: retro },
    { id: "ramarela", texto: "Retrorrefletividade inicial — cor amarela", secao: "5.4; 7.5", grupo: "Produto", tipo: "valor", unid: "mcd/lx·m²", casas: 0,
      min: function (P) { return def(P) ? 150 : 100; }, se: amarela, naoAplicaPor: "sem faixas amarelas", exigido: "≥ 150 (definitiva) / ≥ 100 (provisória)", freq: retro },
  ];

  A.fichaSimples({
    id: "dnit-100-2018-es",
    titulo: "Sinalização horizontal — aceitação do segmento",
    resumo: "Verificações da DNIT 100/2018-ES: insumos e tachas (dimensões), condições de aplicação (superfície 5 a 40 °C, ambiente 10 a 40 °C, UR ≤ 90 %), fusão do termoplástico (180 a 200 °C), solvente ≤ 5 %, espessura, geometria (± 5 %, desvio de borda ≤ 1 cm em 10 m), linearidade e retrorrefletividade inicial (branca ≥ 250 / 150, amarela ≥ 150 / 100 mcd/lx·m²).",
    lote: { largura: false },
    params: [{ k: "material", r: "Material aplicado", tipo: "select", recarrega: true, opcoes: Object.keys(MAT).map(function (k) { return [k, MAT[k][0]]; }) },
      { k: "espProj", r: "Espessura de projeto (mm) — opcional", ph: "pelo material", dica: "vazio = espessura de referência do material (Tabela 2 / 5.3.2.2 e)" },
      { k: "sinal", r: "Sinalização", tipo: "select", opcoes: [["definitiva", "Definitiva"], ["provisoria", "Provisória"]] },
      { k: "cores", r: "Cores das faixas do segmento", tipo: "select", recarrega: true, opcoes: [["ambas", "Branca e amarela"], ["branca", "Só branca"], ["amarela", "Só amarela"]] },
      { k: "largProj", r: "Largura das faixas de projeto (cm)" }, { k: "compProj", r: "Comprimento de projeto dos segmentos seccionados (m) — se houver", recarrega: true },
      { k: "diasRetro", r: "Dias entre a aplicação e a medição da retrorrefletividade inicial" },
      { k: "tachas", r: "Tachas refletivas no segmento?", tipo: "select", recarrega: true, opcoes: G.SIM_NAO }],
    padrao: { material: "tpasp", sinal: "definitiva", cores: "ambas", largProj: "10", tachas: "nao" },
    criterios: C,
    extra: function (ctx) {
      var P = ctx.P, dr = num(P.diasRetro);
      if (ok(dr) && dr > 15) ctx.avisos.push("Retrorrefletividade inicial medida " + fmt(dr, 0) + " dias após a aplicação: 5.4 manda medir em até 15 dias (7.5 fala em 7 dias após a abertura ao tráfego).");
      if (!ok(espMin(P))) ctx.avisos.push("Informe a espessura de projeto do material.");
    },
    notas: "Critérios da DNIT 100/2018-ES: seção 7 (inspeções) e 7.5 (conformidade: retrorrefletividade mínima medida após a abertura ao tráfego). Retrorrefletividade: cada valor é a média de uma estação (NBR 14723); valor abaixo do mínimo é não conformidade. Espessura mínima = espessura de projeto (Tabela 2 e 5.3.2.2 e). Dimensões das marcas: projeto ± 5 %; desvio de borda ≤ 0,01 m em 10 m. Retrorrefletividade residual (≥ 100 branca / 80 amarela) acompanha a garantia e não entra na aceitação. A ES remete o controle estatístico à DNIT 011/2004-PRO sem critério próprio: avaliação por valores individuais.",
    exemplos: [
      { nome: "Termoplástico por aspersão, pista nova (aceito)", dados: function () {
        var P = { estIni: "0", estFim: "250", material: "tpasp", sinal: "definitiva", cores: "ambas", largProj: "15", compProj: "4", diasRetro: "7", tachas: "sim" };
        return { ident: { registro: "OC-100-01", data: "2026-06-15", obra: "Obra A", trecho: "BR-000 — km 0 a km 5", local: "Est. 0 a 250" },
          params: P, verificacoes: G.verif(C, P),
          talt: G.vals([["Tacha 1", "1,9"], ["Tacha 2", "2,0"]]), tlarg: G.vals([["Tacha 1", "10,2"]]), tcomp: G.vals([["Tacha 1", "8,5"]]),
          tsup: G.vals([["Jornada 1", "28"], ["Jornada 2", "33"]]), tamb: G.vals([["Jornada 1", "24"], ["Jornada 2", "27"]]),
          ur: G.vals([["Jornada 1", "65"], ["Jornada 2", "58"]]), tfusao: G.vals([["Jornada 1", "190"], ["Jornada 2", "195"]]),
          espessura: G.vals([["Est. 20 (massa/área)", "1,55", "", "20"], ["Est. 130", "1,62", "", "130"], ["Est. 240", "1,58", "", "240"]]),
          largura: G.vals([["Bordo LD", "15,2", "", "50"], ["Eixo", "14,8", "", "150"]]), compr: G.vals([["Eixo", "4,05", "", "150"]]),
          borda: G.vals([["Est. 60", "0,6", "", "60"], ["Est. 200", "0,8", "", "200"]]),
          rbranca: G.vals([["Estação 1", "312", "", "10"], ["Estação 2", "298", "", "120"], ["Estação 3", "305", "", "230"]]),
          ramarela: G.vals([["Estação 1", "205", "", "10"], ["Estação 2", "198", "", "120"], ["Estação 3", "188", "", "230"]]) };
      } },
      { nome: "Tinta EM-276 — espessura e retrorrefletividade baixas (rejeitado)", dados: function () {
        var P = { estIni: "500", estFim: "600", material: "em276", sinal: "definitiva", cores: "ambas", largProj: "10", diasRetro: "20", tachas: "nao" };
        return { ident: { registro: "OC-100-02", data: "2026-09-01", obra: "Obra B", trecho: "BR-000 — km 10 a km 12", local: "Est. 500 a 600" },
          params: P, verificacoes: G.verif(C, P),
          tsup: G.vals([["Jornada 1", "42"]]), tamb: G.vals([["Jornada 1", "31"]]), ur: G.vals([["Jornada 1", "70"]]), solvente: G.vals([["Jornada 1", "4"]]),
          espessura: G.vals([["Est. 520", "0,45", "", "520"], ["Est. 580", "0,52", "", "580"]]),
          largura: G.vals([["Bordo LE", "9,3", "", "510"], ["Eixo", "10,2", "", "560"]]),
          borda: G.vals([["Est. 540", "1,5", "", "540"]]),
          rbranca: G.vals([["Estação 1", "260", "", "505"], ["Estação 2", "231", "", "595"]]),
          ramarela: G.vals([["Estação 1", "160", "", "505"], ["Estação 2", "142", "", "595"]]) };
      } },
    ],
  });
})();
