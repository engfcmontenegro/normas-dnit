/*
 * Ficha de ACEITAÇÃO: DNIT 106/2009-ES — Terraplenagem — Cortes.
 * Funções comuns: FE.aceitacaoG7 (es-dnit-104-2009-es.js).
 *
 * O que a ES manda (seções do PDF):
 *   5.3.4 a  rocha sã/em decomposição no nível da plataforma: rebaixo do greide da ordem de 0,40 m e preenchimento com material inerte.
 *   5.3.4 b  solos de expansão > 2 % e baixa capacidade de suporte: remoção com rebaixo de 0,60 m e novas camadas de material selecionado.
 *   5.3.4 c  cortes em solo: verificar o grau de compactação dos 0,60 m superiores (equivalente à camada final do aterro); segmentos
 *            abaixo do mínimo: escarificar, homogeneizar, umedecer e recompactar na energia do projeto.
 *   5.3.5–5.3.7, 5.3.12, 5.3.15 taludes (inclinação, desempeno, blocos soltos, banquetas ≥ 3 m em cortes altos).
 *   7.1   insumos da substituição/tratamento das camadas superficiais: como a 7.1 da DNIT 108/2009-ES.
 *   7.2   autorização, avanço, compatibilidade com a distribuição; substituição/tratamento: 7.2.1 e 7.2.3 da DNIT 108 (compactação).
 *   7.3.1 geometria: altura do eixo e bordas ± 0,05 m (solo) / ± 0,10 m (rocha); largura + 0,20 m por semiplataforma, sem negativa (p. 8).
 *   7.3.2 taludes (visual); 7.3.3 solos inadequados, drenagem, instabilidade, corta-rios (visual); 7.3.4 ambiental.
 *   7.4   conformidade inferida de 7.1 e 7.2; incorreto → corrigir; corrigido só é aceito se ficar conforme.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G7 = FE.aceitacaoG7, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var ID = "dnit-106-2009-es";
  function rocha(P) { return P.material === "rocha"; }
  function trat(P) { return P.trat === "sim"; }
  var OPT = { camada: function () { return "final"; }, se: trat, seGC: function (P) { return !rocha(P); }, seDw: trat, volume: "volume",
    grupoIns: "Substituição/tratamento da camada superficial — insumos (7.1 → DNIT 108, 7.1)", grupoComp: "Compactação da camada superficial (5.3.4 c; 7.2 → DNIT 108, 7.2.3)",
    secComp: "7.1 (108: 7.1 b)", secGran: "7.1 (108: 7.1 d)", secIsc: "5.3.4 b; 7.1 (108: 5.1 d, 7.1 e)", secExp: "5.3.4 b; 7.1 (108: 5.1 d)",
    secGC: "5.3.4 c; 7.2 (108: 7.2.3, 7.4)", secDw: "7.2 (108: 5.3.5)", secFreqGC: "108: 7.2.3 a" };

  var itens = [
    { id: "expNat", grupo: "Subleito do corte (5.3.4)", texto: "Expansão do solo do subleito in natura", secao: "5.3.4 b", tipo: "valor", unid: "%", casas: 2, max: 2,
      exigido: "≤ 2 % (acima: remover 0,60 m e substituir)", metodo: "DNIT 172", se: function (P) { return !rocha(P) && !trat(P); },
      naoAplicaPor: "corte em rocha ou camada superficial substituída/tratada (ver insumos)",
      importar: { de: "dnit-172-2016-me", valores: function (e) { return (e.resultados || {}).exp; } } },
  ].concat(G7.itensCompactacao(OPT)).concat([
    { id: "cota", grupo: "Controle geométrico (7.3.1)", texto: "Desvio de altura do eixo e das bordas em relação ao projeto", secao: "7.3.1 a", tipo: "valor", unid: "cm", casas: 1,
      min: function (P) { return rocha(P) ? -10 : -5; }, max: function (P) { return rocha(P) ? 10 : 5; }, metodo: "nivelamento" },
    { id: "larg", grupo: "Controle geométrico (7.3.1)", texto: "Variação da largura de cada semiplataforma (medida − projeto)", secao: "7.3.1 b", tipo: "valor", unid: "cm", casas: 0,
      min: 0, max: 20, exigido: "0 a + 20 cm por semiplataforma (sem variação negativa)", metodo: "trena / topografia" },
    { id: "aut", grupo: "Verificações (7.2 e 7.3)", texto: "Escavação autorizada; avanço e ritmo compatíveis com o acabamento e com a distribuição dos materiais", secao: "7.2",
      tipo: "sim_nao", exigido: "autorizada e compatível" },
    { id: "rochaReb", grupo: "Verificações (7.2 e 7.3)", texto: "Rocha na plataforma: rebaixo do greide da ordem de 0,40 m preenchido com material inerte", secao: "5.3.4 a",
      tipo: "sim_nao", se: rocha, naoAplicaPor: "corte em solo", exigido: "conforme projeto ou revisão" },
    { id: "talude", grupo: "Verificações (7.2 e 7.3)", texto: "Taludes: inclinação de projeto, superfície desempenada, sem blocos soltos; banquetas ≥ 3 m em cortes altos", secao: "7.3.2",
      tipo: "sim_nao", exigido: "5.3.5, 5.3.6, 5.3.7, 5.3.12, 5.3.15" },
    { id: "inad", grupo: "Verificações (7.2 e 7.3)", texto: "Solos inadequados removidos; drenagem superficial e profunda executada; sem instabilidade", secao: "7.3.3",
      tipo: "sim_nao", exigido: "visual, conforme projeto" },
    { id: "transicao", grupo: "Verificações (7.2 e 7.3)", texto: "Passagem corte-aterro: escavação transversal ao eixo antes do aterro", secao: "5.3.13", tipo: "sim_nao",
      se: function (P) { return P.transicao === "sim"; }, naoAplicaPor: "sem passagem corte-aterro no lote", exigido: "profundidade para evitar recalques diferenciais" },
    { id: "cortario", grupo: "Verificações (7.2 e 7.3)", texto: "Corta-rios conforme projeto", secao: "5.3.16; 7.3.3", tipo: "sim_nao",
      se: function (P) { return P.cortario === "sim"; }, naoAplicaPor: "sem corta-rio" },
    G7.ambiental("7.3.4", "6", "Verificações (7.2 e 7.3)"),
  ]);

  A.fichaSimples({
    id: ID,
    titulo: "Cortes — aceitação de segmento",
    resumo: "Aplica a DNIT 106/2009-ES a um segmento de corte: subleito (expansão ≤ 2 %, 5.3.4 b; GC dos 0,60 m superiores, 5.3.4 c), substituição/tratamento da camada " +
      "superficial com os ensaios da DNIT 108 (7.1 e 7.2), geometria (altura ± 0,05 m em solo / ± 0,10 m em rocha; largura + 0,20 m por semiplataforma — 7.3.1) e as verificações visuais da 7.3.",
    lote: { largura: false },
    params: [
      { k: "material", r: "Material no nível da plataforma", tipo: "select", recarrega: true, opcoes: [["solo", "Corte em solo (± 0,05 m)"], ["rocha", "Corte em rocha (± 0,10 m)"]] },
      { k: "trat", r: "Houve substituição/tratamento das camadas superficiais (5.3.4 b/c)?", tipo: "select", recarrega: true,
        opcoes: [["nao", "Não — solo in natura"], ["sim", "Sim — controle de insumos e compactação da DNIT 108 (7.1 e 7.2)"]] },
      { k: "volume", r: "Volume de material da substituição/tratamento (m³)", se: function (d) { return (d.params || {}).trat === "sim"; },
        dica: "frequência dos ensaios de compactação: 1 a cada 200 m³ (DNIT 108, 7.1 b — camada final)" },
      { k: "iscMin", r: "ISC mínimo de projeto da camada superficial (%)", se: function (d) { return (d.params || {}).trat === "sim"; },
        dica: "DNIT 108, 5.1 d: valor fixado no projeto" },
      { k: "gcMin", r: "Grau de compactação mínimo (%)", ph: "100", dica: "5.3.4 c: energia do projeto; DNIT 108 (7.2.3 c): ≥ 100 %",
        se: function (d) { return (d.params || {}).material !== "rocha"; } },
      { k: "nGC", r: "Nº de determinações de GC informado pelo executante — opcional", dica: "vazio = mínimo de 5 (DNIT 108, 7.2.3 a)",
        se: function (d) { return (d.params || {}).material !== "rocha"; } },
      { k: "transicao", r: "Há passagem corte-aterro no lote (5.3.13)?", tipo: "select", recarrega: true, opcoes: [["nao", "Não"], ["sim", "Sim"]] },
      { k: "cortario", r: "Há corta-rio no lote (5.3.16)?", tipo: "select", recarrega: true, opcoes: [["nao", "Não"], ["sim", "Sim"]] },
      G7.paramGC("impGC", "gc", "dw", { se: function (d) { return (d.params || {}).material !== "rocha"; } }),
      G7.paramComp("impComp", { comp: "comp", isc: "isc", exp: "exp" }, { se: function (d) { return (d.params || {}).trat === "sim"; } }),
    ],
    padrao: { material: "solo", trat: "nao", gcMin: "100", transicao: "nao", cortario: "nao" },
    refs: { reprova: "7.4; DNIT 108, 7.4", atende: "DNIT 108, 7.4", corrige: "5.3.4 c", regra: "DNIT 108, 7.4", tabela: "Tabela 1 da DNIT 108" },
    criterios: itens,
    extra: function (ctx) {
      var P = ctx.P;
      G7.freqCompactacao(ctx, OPT);
      G7.ocultar(ctx, ["comp", "gran", "ll", "ip", "isc", "exp", "gc", "dw", "expNat"]);
      G7.freqSecoes(ctx, "cota", 20, 3, "eixo e 2 bordas a cada 20 m, incluindo as pontas (adotado — a ES não fixa)");
      G7.freqSecoes(ctx, "larg", 20, 2, "2 semiplataformas a cada 20 m, incluindo as pontas (adotado — a ES não fixa)");
      if (!rocha(P) && !trat(P)) G7.freq(ctx, "expNat", { exigido: 1, regra: "a ES não fixa — mín. 1 por lote (adotado)" });
      var e = ctx.item.expNat;
      if (e && e.situacao === "nao_conforme") e.motivo += " — remover o solo com rebaixo de 0,60 m e executar novas camadas de material selecionado (5.3.4 b)";
      var g = ctx.item.gc;
      if (g && (g.situacao === "nao_conforme" || g.situacao === "ressalva")) ctx.avisos.push("Segmentos abaixo do GC mínimo: escarificar, homogeneizar, levar à umidade adequada e recompactar na energia do projeto (5.3.4 c).");
      var gcMin = num(P.gcMin);
      if (ok(gcMin) && gcMin < 100) ctx.avisos.push("GC mínimo de " + fmt(gcMin, 1) + " %: a DNIT 108 (7.2.3 c), à qual a 7.2 remete, exige ≥ 100 % na camada final.");
    },
    notas: "Critérios da DNIT 106/2009-ES; a 7.1 e a 7.2 remetem à DNIT 108/2009-ES (insumos, compactação e estatística da 7.4 com a Tabela 1). Adotado pela ficha: a camada superficial de 0,60 m " +
      "tratada como camada final da DNIT 108 (5.3.4 c: \"equivalente à camada final do aterro\"): compactação 1/200 m³, granulometria/LL/IP e ISC 1 por grupo de 4 compactações, " +
      "expansão ≤ 2 % e ISC mínimo do projeto; GC do solo in natura avaliado como na DNIT 108 (mín. 5 determinações, X̄ − k·s ≥ mínimo); expansão do subleito in natura por valor individual (5.3.4 b); " +
      "geometria por valor individual, uma seção por estaca (20 m). A 7.4 cita só 7.1 e 7.2, mas a ficha também avalia a 7.3 (tolerâncias geométricas e verificações visuais).",
    exemplos: [
      { nome: "Corte em solo aceito — 160 m, subleito in natura (GC e expansão dos exemplos ME)", dados: function () {
        var d = { ident: { registro: "CRT-04", data: "2026-06-20", obra: "Obra A — BR-000", trecho: "Corte 4", local: "Est. 300 a 308", camada: "Plataforma do corte (0,60 m superiores)" },
          params: { estIni: "300", estFim: "308", material: "solo", trat: "nao", gcMin: "100", transicao: "sim", cortario: "nao" } };
        var par = FE.FICHAS[ID].params;
        A.exemplos.importar(par, d, "imp_expNat", [["dnit-172-2016-me", 1]]);
        d.expNat[0].est = "304";
        A.exemplos.importar(par, d, "impGC", [["dner-me-037-94", 0], ["dnit-417-2019-me", 0]]);
        var ests = ["300", "301", "303", "304", "305", "306", "308"];
        d.gc.forEach(function (c, i) { c.est = ests[i]; });
        d.dw.forEach(function (c, i) { c.est = ests[i]; });
        d.cota = []; d.larg = [];
        for (var i = 0; i <= 8; i++) {
          ["LE", "eixo", "LD"].forEach(function (p, j) { d.cota.push({ est: String(300 + i), pos: p, reg: "Nivelamento", v: A.nstr([2.1, -1.4, 0.6, -3.2, 1.8, 4.1, -0.9][(i * 3 + j) % 7], 1) }); });
          d.larg.push({ est: String(300 + i), pos: "LE", reg: "Trena", v: String([8, 12, 5, 15, 10][i % 5]) });
          d.larg.push({ est: String(300 + i), pos: "LD", reg: "Trena", v: String([6, 3, 11, 14, 9][i % 5]) });
        }
        d.verificacoes = [{ atende: "S", real: "2" }, {}, { atende: "S", real: "2" }, { atende: "S", real: "1" }, { atende: "S", real: "1", obs: "degrau de 1,0 m na est. 308" }, {}, { atende: "S" }];
        return d;
      } },
      { nome: "Corte em rocha rejeitado — altura fora de ± 10 cm e semiplataforma estreita; rebaixo não verificado", dados: function () {
        var d = { ident: { registro: "CRT-09", data: "2026-07-08", obra: "Obra B", trecho: "Corte 9", local: "Est. 520 a 526", camada: "Plataforma do corte em rocha" },
          params: { estIni: "520", estFim: "526", material: "rocha", trat: "nao", transicao: "nao", cortario: "nao" } };
        d.cota = []; d.larg = [];
        for (var i = 0; i <= 6; i++) {
          ["LE", "eixo", "LD"].forEach(function (p, j) { d.cota.push({ est: String(520 + i), pos: p, reg: "Nivelamento", v: A.nstr(i === 3 && j === 1 ? 13.5 : [4.2, -6.8, 8.1, -2.5, 5.9][(i + j) % 5], 1) }); });
          d.larg.push({ est: String(520 + i), pos: "LE", reg: "Trena", v: String(i === 5 ? -4 : [10, 16, 7][i % 3]) });
          d.larg.push({ est: String(520 + i), pos: "LD", reg: "Trena", v: String([12, 4, 18][i % 3]) });
        }
        d.verificacoes = [{ atende: "S" }, {}, { real: "2", nc: "1", obs: "blocos soltos no talude da est. 523" }, { atende: "S" }, {}, {}, { atende: "S" }];
        return d;
      } },
    ],
  });
})();
