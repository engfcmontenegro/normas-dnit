/*
 * Ficha de ACEITAÇÃO DE LOTE: DNIT 108/2009-ES — Terraplenagem — Aterros (com a Errata 1).
 * Funções comuns (importação de GC/Δw e de compactação/ISC, itens e frequências de compactação): FE.aceitacaoG7,
 * definido em es-dnit-104-2009-es.js (primeiro arquivo do grupo).
 *
 * O que a ES manda (seções do PDF):
 *   5.1 c  corpo do aterro: ISC ≥ 2 % e expansão ≤ 4 % (compactação Método A — DNER-ME 129, hoje DNIT 164; ISC DNER-ME 049, hoje DNIT 172).
 *   5.1 d  camada final: "a melhor capacidade de suporte" (valor do projeto) e expansão ≤ 2 % (Método B).
 *   5.3.4  espessura compactada: corpo ≤ 0,30 m; camadas finais ≤ 0,20 m (p. 4).
 *   5.3.5  corpo: h ót ± 3 % e 100 % da MEAS máx. do Método A; camada final: 100 % do Método B; trechos abaixo: escarificar
 *          e recompactar (5.3.5 c).
 *   7.1    frequências: compactação 1/1.000 m³ (corpo, a) e 1/200 m³ (camada final, b); granulometria + LL + LP 1 por grupo
 *          de 10 compactações (corpo, c) ou de 4 (camada final, d); ISC 1 por grupo de 4 compactações (camada final, e) (p. 8).
 *   7.2.1  autorização, origem do material conforme a distribuição do projeto, seções 4 e 5.   7.2.2 consolidação (5.3.9, 5.3.10).
 *   7.2.3  GC em locais aleatórios por camada (DNER-ME 092 [hoje DNIT 458] e DNER-ME 037); pelo menos 5 determinações em
 *          segmentos de até 1.200 m³ (corpo) / 800 m³ (camada final); número conforme a Tabela 1 (risco do executante);
 *          GC ≥ 100 % no corpo e nas camadas finais (p. 8–9).
 *   7.3.1  geometria: altura (eixo e bordas) ± 0,04 m; largura da plataforma + 0,30 m, sem variação negativa (p. 9).
 *   7.3.2  taludes (visual; 5.3.7, 5.3.8).   7.3.3 ambiental.
 *   7.4    ISC e GC: X̄ − k·s ≥ mínimo; expansão: X̄ + k·s ≤ máximo; k da Tabela 1 (Tabela de amostragem variável, p. 8).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G7 = FE.aceitacaoG7, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var ID = "dnit-108-2009-es";
  function camada(P) { return P.camada === "final" ? "final" : "corpo"; }
  var OPT = { camada: camada, volume: "volume" };

  var itens = G7.itensCompactacao(OPT).concat([
    { id: "esp", grupo: "Compactação (5.3.5 e 7.2.3)", texto: "Espessura da camada compactada", secao: "5.3.4", tipo: "valor", unid: "cm", casas: 0,
      max: function (P) { return camada(P) === "final" ? 20 : 30; }, metodo: "nivelamento / sondagem" },
    { id: "cota", grupo: "Controle geométrico (7.3.1)", texto: "Desvio de cota do eixo e das bordas em relação ao projeto", secao: "7.3.1 a", tipo: "valor",
      unid: "cm", casas: 1, min: -4, max: 4, exigido: "± 4 cm (± 0,04 m)", metodo: "nivelamento", freq: { por: "extensao", a_cada: 20, pontos: true } },
    { id: "larg", grupo: "Controle geométrico (7.3.1)", texto: "Variação da largura da plataforma (medida − projeto)", secao: "7.3.1 b", tipo: "valor",
      unid: "cm", casas: 0, min: 0, max: 30, exigido: "0 a + 30 cm (sem variação negativa)", metodo: "trena / topografia", freq: { por: "extensao", a_cada: 20, pontos: true } },
    { id: "aut", grupo: "Verificações (7.2 e 7.3)", texto: "Execução autorizada pela Fiscalização; origem do material conforme a distribuição do projeto", secao: "7.2.1",
      tipo: "sim_nao", exigido: "autorizado e conforme o projeto" },
    { id: "mat", grupo: "Verificações (7.2 e 7.3)", texto: "Material isento de matéria orgânica, micácea e diatomácea; sem turfa ou argila orgânica", secao: "5.1 b; 7.1",
      tipo: "sim_nao", exigido: "isento (inspeção)" },
    { id: "cons", grupo: "Verificações (7.2 e 7.3)", texto: "Consolidação: recalques/pressões neutras controlados e remoção de solos moles conforme 5.3.10", secao: "7.2.2",
      tipo: "sim_nao", se: function (P) { return P.moles === "sim"; }, naoAplicaPor: "aterro sem solo mole na fundação", exigido: "conforme 5.3.9 e 5.3.10" },
    { id: "talude", grupo: "Verificações (7.2 e 7.3)", texto: "Taludes: inclinação de projeto e acabamento (visual, gabarito)", secao: "7.3.2", tipo: "sim_nao",
      exigido: "conforme 5.3.7 e 5.3.8" },
    G7.ambiental("7.3.3", "6", "Verificações (7.2 e 7.3)"),
  ]);

  A.fichaSimples({
    id: ID,
    titulo: "Aterros — aceitação de camada / segmento",
    resumo: "Reúne os ensaios da camada (importados das fichas ME ou digitados) e aplica a DNIT 108/2009-ES: frequências da 7.1 e 7.2.3, ISC e expansão (5.1 c/d), " +
      "grau de compactação ≥ 100 % e umidade h ót ± 3 % (5.3.5), espessura da camada (5.3.4), cotas ± 0,04 m e largura + 0,30 m (7.3.1), com o controle estatístico da 7.4.",
    lote: { largura: false, volume: true },
    params: [
      { k: "camada", r: "Camada controlada", tipo: "select", recarrega: true,
        opcoes: [["corpo", "Corpo do aterro — Método A; ISC ≥ 2 %, expansão ≤ 4 %, espessura ≤ 30 cm"], ["final", "Camada final — Método B; ISC de projeto, expansão ≤ 2 %, espessura ≤ 20 cm"]] },
      { k: "iscMin", r: "ISC mínimo de projeto da camada final (%)", dica: "5.1 d: \"a melhor capacidade de suporte\" — valor fixado no projeto (o estudo inclui ao menos uma alternativa com CBR ≥ 6 %)",
        se: function (d) { return (d.params || {}).camada === "final"; } },
      { k: "gcMin", r: "Grau de compactação mínimo (%)", ph: "100", dica: "5.3.5 a/b e 7.2.3 c: 100 % (\"ordinariamente\"; conforme o projeto)" },
      { k: "nGC", r: "Nº de determinações de GC informado pelo executante (NOTA da 7.2.3) — opcional", dica: "vazio = mínimo de 5 (7.2.3 a)" },
      { k: "moles", r: "Aterro sobre solo mole (5.3.9 / 5.3.10)?", tipo: "select", recarrega: true, opcoes: [["nao", "Não"], ["sim", "Sim — verificar a consolidação (7.2.2)"]] },
      G7.paramGC("impGC", "gc", "dw"),
      G7.paramComp("impComp", { comp: "comp", isc: "isc", exp: "exp" }),
    ],
    padrao: { camada: "corpo", gcMin: "100", moles: "nao" },
    refs: { reprova: "7.4", atende: "7.4", corrige: "5.3.5 c / 7.4", regra: "7.4", tabela: "Tabela 1" },
    criterios: itens,
    extra: function (ctx) {
      var P = ctx.P;
      G7.freqCompactacao(ctx, OPT);
      G7.freq(ctx, "esp", { exigido: 1, regra: "a ES não fixa — mín. 1 por lote (adotado)" });
      G7.freqSecoes(ctx, "cota", 20, 3, "eixo e 2 bordas a cada 20 m, incluindo as pontas (adotado — a ES não fixa)");
      G7.freqSecoes(ctx, "larg", 20, 1, "1 seção a cada 20 m, incluindo as pontas (adotado — a ES não fixa)");
      var gcMin = ok(num(P.gcMin)) ? num(P.gcMin) : 100;
      if (gcMin < 100) ctx.avisos.push("GC mínimo informado (" + fmt(gcMin, 1) + " %) menor que o preconizado pela ES (100 %, 5.3.5 e 7.2.3 c) — só com justificativa do projeto.");
      var vol = num(P.volume), limV = camada(P) === "final" ? 800 : 1200;
      if (ok(vol) && vol > limV) ctx.avisos.push("Volume de " + fmt(vol, 0) + " m³ acima de " + fmt(limV, 0) + " m³: o mínimo de 5 determinações de GC (7.2.3 a) vale para segmentos até esse volume; " +
        "acima, o número deve seguir a Tabela 1 conforme o risco assumido pelo executante (7.2.3 b) — informe-o no parâmetro.");
      var isc = ctx.item.isc;
      if (camada(P) === "final" && isc && isc.situacao !== "nao_exigido" && ok(num(P.iscMin)) && num(P.iscMin) < 6)
        ctx.avisos.push("ISC de projeto da camada final abaixo de 6 %: confira a análise técnico-econômica do projeto (5.1 d).");
    },
    textos: {
      REJEITADO: { titulo: "CAMADA REJEITADA", texto: "Há critério não conforme (7.4): o serviço deve ser corrigido ou refeito (trechos com compactação insuficiente: escarificar, homogeneizar, umedecer e recompactar — 5.3.5 c) e só é aceito se as correções o colocarem em conformidade." },
      ACEITO: { titulo: "CAMADA ACEITA", texto: "Critérios da DNIT 108/2009-ES atendidos (7.4), com a frequência exigida." },
      RESSALVA: { titulo: "CAMADA ACEITA COM RESSALVA", texto: "Estatística da 7.4 atendida, mas há pontos a corrigir ou documentar (\"todo componente ou detalhe incorreto ou mal executado deve ser corrigido\" — 7.4)." },
      PENDENTE: { titulo: "CAMADA PENDENTE — CONTROLE INCOMPLETO", texto: "Nenhum critério reprovado, mas faltam ensaios, determinações ou informações exigidos (7.1, 7.2.3): complete o controle antes de aceitar." },
    },
    notas: "Critérios da DNIT 108/2009-ES (com a Errata 1). Métodos citados e substituídos: DNER-ME 129 → DNIT 164; DNER-ME 049 → DNIT 172; DNER-ME 080 → DNIT 412; DNER-ME 092 → DNIT 458. " +
      "Adotado pela ficha: ISC e expansão do corpo do aterro verificados com mín. 1 ensaio por lote (a 7.1 só fixa ISC para a camada final, mas a 5.1 c exige ISC ≥ 2 % e expansão ≤ 4 % no corpo); " +
      "granulometria/LL/IP por grupo de 10 (corpo) ou 4 (camada final) ensaios de compactação, contados pelo maior entre o exigido e o realizado; umidade h ót ± 3 % (5.3.5 a) aplicada também à camada final " +
      "(a 5.3.5 b não repete o intervalo) e tratada como ressalva (a seção 7 não controla a umidade); Δw vem dos furos de GC; espessura ≤ 30/20 cm (5.3.4) como valor individual; " +
      "geometria (7.3.1) por valor individual, uma seção por estaca (20 m) com eixo e bordas. Aterro em rocha (5.3.12) e aterro em areia (5.3.13) não são tratados pela ficha.",
    exemplos: [
      { nome: "Corpo do aterro aceito — 200 m, 1.150 m³ (ensaios dos exemplos ME + campo digitado)", dados: function () {
        var d = { ident: { registro: "ATR-C-07", data: "2026-07-15", obra: "Obra A — BR-000", trecho: "Aterro 3", local: "Est. 100 a 110", camada: "Corpo do aterro — 7ª camada", origem: "Corte 2" },
          params: { estIni: "100", estFim: "110", volume: "1150", camada: "corpo", gcMin: "100", moles: "nao" } };
        var par = FE.FICHAS[ID].params;
        A.exemplos.importar(par, d, "impComp", [["dnit-164-2013-me", 1], ["dnit-172-2016-me", 1]]);
        d.comp[0].est = "102"; d.comp[1].est = "106";
        d.comp.push({ est: "109", pos: "", reg: "PR-0415 · DNIT 164 (digitado)", v: "1,612" });
        d.isc[0].est = "106"; d.exp[0].est = "106";
        A.exemplos.importar(par, d, "impGC", [["dnit-405-2017-me", 0], ["dner-me-036-94", 0]]);
        var ests = ["101", "103", "104", "106", "107", "108", "110"];
        d.gc.forEach(function (c, i) { c.est = ests[i]; });
        d.dw.forEach(function (c, i) { c.est = ests[i]; });
        A.exemplos.importar(par, d, "imp_ll", [["dner-me-082-94", 2]]);
        A.exemplos.importar(par, d, "imp_ip", [["dner-me-082-94", 2]]);
        d.ll[0].est = "106"; d.ip[0].est = "106";
        d.gran = [{ est: "106", pos: "", reg: "GR-0212 · DNIT 412 (digitado)", v: "68,4" }];
        d.esp = [{ est: "102", reg: "Nivelamento", v: "28" }, { est: "106", reg: "Nivelamento", v: "27" }, { est: "109", reg: "Nivelamento", v: "30" }];
        d.cota = []; d.larg = [];
        var dc = [[1.2, -0.8, 2.1], [0.5, 1.9, -1.4], [-2.2, 0.7, 1.1], [1.6, -0.3, -2.8], [0.9, 2.4, 0.2], [-1.1, -1.7, 1.3], [2.0, 0.4, -0.6], [-0.4, 1.2, 3.1], [1.8, -2.5, 0.8], [0.1, 1.4, -1.9], [-1.5, 0.6, 2.2]];
        var dl = [12, 8, 15, 21, 9, 5, 18, 11, 24, 7, 14];
        dc.forEach(function (s, i) {
          ["LE", "eixo", "LD"].forEach(function (p, j) { d.cota.push({ est: String(100 + i), pos: p, reg: "Nivelamento", v: A.nstr(s[j], 1) }); });
          d.larg.push({ est: String(100 + i), pos: "", reg: "Trena", v: String(dl[i]) });
        });
        d.verificacoes = [{ atende: "S", real: "1" }, { atende: "S", real: "2" }, {}, { atende: "S", real: "2" }, { atende: "S", real: "1" }];
        d.obs = "Exemplo: compactação/ISC, GC/Δw e LL/IP importados dos exemplos das fichas ME (estacas ajustadas ao lote); demais valores digitados.";
        return d;
      } },
      { nome: "Camada final rejeitada — GC estatístico abaixo de 100 %, espessura e largura fora, compactações insuficientes", dados: function () {
        var d = { ident: { registro: "ATR-F-02", data: "2026-08-02", obra: "Obra B", trecho: "Aterro 5", local: "Est. 200 a 215", camada: "Camada final do aterro", origem: "Empréstimo E-3" },
          params: { estIni: "200", estFim: "215", volume: "700", camada: "final", iscMin: "8", gcMin: "100", moles: "nao" } };
        var par = FE.FICHAS[ID].params;
        A.exemplos.importar(par, d, "impComp", [["dnit-172-2016-me", 1]]);
        d.comp[0].est = "207"; d.isc[0].est = "207"; d.exp[0].est = "207";
        A.exemplos.importar(par, d, "impGC", [["dner-me-036-94", 1], ["dnit-405-2017-me", 1]]);
        var ests = ["201", "204", "206", "209", "211", "214"];
        d.gc.forEach(function (c, i) { c.est = ests[i]; });
        d.dw.forEach(function (c, i) { c.est = ests[i]; });
        A.exemplos.importar(par, d, "imp_ll", [["dner-me-082-94", 2]]);
        A.exemplos.importar(par, d, "imp_ip", [["dner-me-082-94", 2]]);
        d.ll[0].est = "207"; d.ip[0].est = "207";
        d.gran = [{ est: "207", reg: "GR-0230 · DNIT 412 (digitado)", v: "64,0" }];
        d.esp = [{ est: "203", reg: "Nivelamento", v: "19" }, { est: "208", reg: "Nivelamento", v: "24" }, { est: "213", reg: "Nivelamento", v: "18" }];
        d.cota = []; d.larg = [];
        for (var i = 0; i <= 15; i++) {
          ["LE", "eixo", "LD"].forEach(function (p, j) { d.cota.push({ est: String(200 + i), pos: p, reg: "Nivelamento", v: A.nstr([1.5, -2.0, 0.8, 2.6, -1.2, 3.4][(i + j) % 6], 1) }); });
          d.larg.push({ est: String(200 + i), reg: "Trena", v: String(i === 9 ? -6 : [10, 14, 6, 20, 12][i % 5]) });
        }
        d.verificacoes = [{ atende: "S" }, { atende: "S" }, {}, { atende: "S" }, { atende: "S" }];
        d.obs = "Exemplo de reprovação: X̄ − k·s do GC < 100 %, camada com 24 cm (> 20 cm), largura 6 cm menor que a de projeto na estaca 209 e só 1 ensaio de compactação para 700 m³ (exigidos 4).";
        return d;
      } },
    ],
  });
})();
