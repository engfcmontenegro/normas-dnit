/*
 * Ficha de ACEITAÇÃO DE LOTE: DNIT 152/2010-ES — Macadame hidráulico (motor FE.aceitacaoG1, em es-dnit-137-2010-es.js).
 *   5.1.1 (p. 2–3) agregado graúdo: faixa A, B ou C da Tabela 1 (tolerância ± 7 na curva de projeto; espessura máxima da
 *                  camada 25/20/20 cm ± 10 %); diâmetro máximo entre 1/2 e 2/3 da espessura final da camada; durabilidade
 *                  (sulfato de sódio ≤ 20 %, de magnésio ≤ 30 %); Los Angeles < 50 % (maior admitido com desempenho anterior
 *                  comprovado); pedregulho/cascalho britado: ≥ 75 % de partículas com duas faces britadas.
 *   5.1.2 (p. 3)   enchimento: Tabela 2 (A ou B; ± 7/7/7/5/5/3); LL ≤ 25 %, IP ≤ 6 %; EA ≥ 55 %.
 *   5.1.3 (p. 3–4) bloqueio: Tabela 3 (A ou B; ± 7/7/7/5/5/3/2); IP < 6 %; EA ≥ 55 %; espessura 4 ± 1 cm.
 *   5.3.1 (p. 4)   bloqueio obrigatório quando a camada subjacente tem mais de 35 % passando na nº 200.
 *   7.1 (p. 6)     granulometrias: 2 por jornada de 8 h; EA: 1 por jornada; LL/LP: a cada 200 m; durabilidade e LA: no início
 *                  da utilização do agregado e quando houver variação.
 *   7.2.1 (p. 6)   verificações visuais da compressão (a, b, c).  7.2.2 (p. 7): deflexões (facultativas) 1 por estaca,
 *                  analisadas estatisticamente contra o valor de projeto.
 *   7.3 (p. 7)     largura ± 10 cm; flecha até +20 % (sem falta); espessura ± 10 %.   7.5: estatística; k: DNER-PRO 277/97.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G1 = FE.aceitacaoG1, num = FE.num, ok = FE.ok, fmt = FE.fmt, X = G1.ex, kPen = G1.kPen;
  function P_(d) { return d.params || {}; }
  var PEN_G = [[101.6, "4\"", 7], [88.9, "3 1/2\"", 7], [76.2, "3\"", 7], [63.5, "2 1/2\"", 7], [50.8, "2\"", 7], [38.1, "1 1/2\"", 7], [25.4, "1\"", 7], [19.1, "3/4\"", 7], [12.7, "1/2\"", 7]];
  var PEN_E = [[19.1, "3/4\"", 7], [12.7, "1/2\"", 7], [9.5, "3/8\"", 7], [4.8, "nº 4", 5], [2.0, "nº 10", 5], [0.42, "nº 40", 3]];
  var PEN_B = PEN_E.concat([[0.075, "nº 200", 2]]);
  var ESPMAX = { A: 25, B: 20, C: 20 };
  var F = G1.criar({
    id: "dnit-152-2010-es",
    titulo: "Macadame hidráulico — aceitação de lote",
    resumo: "Reúne os ensaios do lote e aplica os critérios da ES: granulometria do agregado graúdo (Tabela 1), do enchimento (Tabela 2) e do bloqueio (Tabela 3) " +
      "com as tolerâncias da curva de projeto; durabilidade, Los Angeles, faces britadas e diâmetro máximo do graúdo; LL, IP e EA dos finos; verificações visuais da " +
      "compressão (7.2.1); deflexões (7.2.2, se medidas) e controle geométrico (7.3), com a frequência da 7.1 e o controle estatístico da 7.5.",
    refs: { reprova: "7.5 b", atende: "7.5 a", corrige: "7.5", regra: "7.5", tabela: "DNER-PRO 277/97, Tabela 1" },
    tabelaK: G1.K_PRO277, tabelaNome: "DNER-PRO 277/97, Tabela 1 (a ES não traz a tabela; 7.4 remete à PRO 277)",
    medicao: "volume", secMedicao: "8 a, b, c",
    params: [
      { k: "faixaG", r: "Faixa do agregado graúdo (Tabela 1)", tipo: "select", opcoes: [["A", "Faixa A — camada até 25 cm"], ["B", "Faixa B — camada até 20 cm"], ["C", "Faixa C — camada até 20 cm"]] },
      { k: "faixaE", r: "Faixa do agregado de enchimento (Tabela 2)", tipo: "select", opcoes: [["A", "Faixa A"], ["B", "Faixa B"]] },
      { k: "p200Sub", r: "Passante na nº 200 da camada subjacente (%) (5.3.1)", dica: "> 35 % → camada de bloqueio obrigatória" },
      { k: "bloqueio", r: "Camada de bloqueio", tipo: "select", recarrega: true, opcoes: [["nao", "Não executada"], ["sim", "Executada (4 ± 1 cm)"]] },
      { k: "faixaB", r: "Faixa do agregado de bloqueio (Tabela 3)", tipo: "select", opcoes: [["A", "Faixa A"], ["B", "Faixa B"]], se: function (d) { return P_(d).bloqueio === "sim"; } },
      { k: "britado", r: "Agregado graúdo de pedregulho ou cascalho britado? (5.1.1 b)", tipo: "select", opcoes: [["nao", "Não — pedra britada"], ["sim", "Sim — ≥ 75 % com duas faces britadas"]] },
      { k: "inicio", r: "Durabilidade e Los Angeles neste lote? (7.1.2)", tipo: "select", opcoes: [["sim", "Sim — início da utilização ou variação do agregado"], ["nao", "Não — ensaios já feitos em lote anterior"]] },
      { k: "laDesemp", r: "Desempenho anterior satisfatório comprovado? (LA ≥ 50 %)", tipo: "select", opcoes: [["nao", "Não"], ["sim", "Sim — admite-se LA maior"]] },
      { k: "defl", r: "Deflexões (7.2.2 — facultativas)", tipo: "select", recarrega: true, opcoes: [["nao", "Não medidas"], ["sim", "Medidas — comparar com o projeto"]] },
      { k: "dProj", r: "Deflexão de projeto no topo da camada (0,01 mm)", se: function (d) { return P_(d).defl === "sim"; } },
      { k: "secaoT", r: "Seção transversal", tipo: "select", opcoes: [["abaul", "Abaulamento — flecha (7.3 b)"], ["simples", "Caimento simples (a ES só fixa a flecha)"]] },
      { k: "flechaProj", r: "Flecha de abaulamento de projeto (cm)", se: function (d) { return P_(d).secaoT !== "simples"; } },
    ],
    padrao: { jornadas: "1", faixaG: "B", faixaE: "A", bloqueio: "nao", faixaB: "A", britado: "nao", inicio: "sim", laDesemp: "nao", defl: "nao", secaoT: "abaul", espGeo: "20" },
    blocos: {
      ins: { titulo: "Agregado graúdo — durabilidade, Los Angeles e faces britadas", secao: "5.1.1; 7.1.2", campos: ["durNa", "durMg", "la", "faces"],
        se: function (P) { return P.inicio !== "nao"; } },
      carac: { titulo: "Agregado de enchimento — LL, IP e equivalente de areia", secao: "5.1.2; 7.1.3", campos: ["ll", "ip", "ea"] },
      gran: [
        { chave: "granG", titulo: "Agregado graúdo", nome: "Granulometria do agregado graúdo (Tabela 1)", secao: "5.1.1; Tabela 1", pen: PEN_G, extras: ["dmax"],
          faixa: function (P) { return "dnit-152-2010-es-graudo-" + (P.faixaG || "B"); } },
        { chave: "granE", titulo: "Agregado de enchimento", nome: "Granulometria do enchimento (Tabela 2)", secao: "5.1.2; Tabela 2", pen: PEN_E,
          faixa: function (P) { return "dnit-152-2010-es-enchimento-" + (P.faixaE || "A"); } },
        { chave: "granB", titulo: "Agregado da camada de bloqueio", nome: "Granulometria do bloqueio (Tabela 3)", secao: "5.1.3; Tabela 3", pen: PEN_B, extras: ["ip", "ea", "espB"],
          faixa: function (P) { return "dnit-152-2010-es-bloqueio-" + (P.faixaB || "A"); }, se: function (P) { return P.bloqueio === "sim"; } },
      ],
      verifSecao: "7.2.1",
      verif: [
        { texto: "Passagem do rolo após cada compressão, antes do enchimento — sem sulcos ou ondulações", secao: "7.2.1 a" },
        { texto: "Enchimento dos vazios após a irrigação — onda de pasta à frente do rolo", secao: "7.2.1 b" },
        { texto: "Compactação final — pedra à frente do rolo esmagada sem penetrar na camada", secao: "7.2.1 c" },
      ],
      defl: { secao: "7.2.2", dica: "1 por estaca, alternando bordas e eixo", se: function (P) { return P.defl === "sim"; } },
      geo: { secao: "7.3", larg: 0.10, esp: true, flecha: true },
    },
    criterioTxt: "DNIT 152/2010-ES, 7.5 — controle estatístico com a Tabela 1 da DNER-PRO 277/97",
    notas: "DNIT 152/2010-ES. Métodos citados e substituídos: DNER-ME 083/080 → DNIT 412; DNER-ME 035 → DNIT 451; DNER-ME 054 → DNIT 450; DNER-ME 024 → DNIT 133. " +
      "A nº 200 da Tabela 3 é tomada como 0,075 mm (a ES escreve 0,74). Granulometria: faixa ∩ projeto ± tolerância. Diâmetro máximo comparado com a espessura de projeto da camada.",
    criterios: function (c, H) {
      var P = c.P, L = c.L, bloq = P.bloqueio === "sim", ini = P.inicio !== "nao";
      var eG = ESPMAX[P.faixaG || "B"];
      if (ok(c.espP) && c.espP > eG * 1.1 + 1e-9) c.av.push("Espessura de projeto de " + fmt(c.espP, 1) + " cm acima da máxima da faixa " + (P.faixaG || "B") + " (" + eG + " cm ± 10 %, Tabela 1): executar em mais de uma camada.");
      // frequências (7.1)
      H.freq({ ensaio: "Granulometria do agregado graúdo", metodo: "DNIT 412 (DNER-ME 083 citada)", por: "jornada", qtd: 2, realizado: H.conta("granG", PEN_G.map(function (p) { return kPen(p[0]); })) });
      H.freq({ ensaio: "Durabilidade e Los Angeles do graúdo", metodo: "DNER-ME 089 / DNIT 451", por: "lote", regra: "no início da utilização e quando houver variação (7.1.2)",
        realizado: Math.min(H.conta("ins", ["durNa", "durMg"]), H.conta("ins", ["la"])), aplica: ini });
      H.freq({ ensaio: "Granulometria do enchimento", metodo: "DNIT 412", por: "jornada", qtd: 2, realizado: H.conta("granE", PEN_E.map(function (p) { return kPen(p[0]); })) });
      H.freq({ ensaio: "Equivalente de areia do enchimento", metodo: "DNIT 450", por: "jornada", qtd: 1, realizado: H.conta("carac", ["ea"]) });
      H.freq({ ensaio: "LL e LP do enchimento", metodo: "DNER-ME 122 / 082", a_cada: 200, secao: "7.1.3", realizado: Math.min(H.conta("carac", ["ll"]), H.conta("carac", ["ip"])) });
      if (bloq) {
        H.freq({ ensaio: "Granulometria do bloqueio", metodo: "DNIT 412", por: "jornada", qtd: 2, realizado: H.conta("granB", PEN_B.map(function (p) { return kPen(p[0]); })) });
        H.freq({ ensaio: "Equivalente de areia do bloqueio", metodo: "DNIT 450", por: "jornada", qtd: 1, realizado: H.conta("granB", ["ea"]) });
        H.freq({ ensaio: "LL e LP do bloqueio", metodo: "DNER-ME 122 / 082", a_cada: 200, secao: "7.1.1", realizado: H.conta("granB", ["ip"]) });
      }
      if (P.defl === "sim") H.freq({ ensaio: "Deflexão", metodo: "DNIT 133 (DNER-ME 024 citada)", exigido: ok(L.ext) ? A.nPontos(L.ext, 20) : NaN,
        regra: "1 por estaca, alternando bordas e eixo (7.2.2 b)", realizado: H.conta("defl", ["d0"]) });
      // agregado graúdo
      H.gran("granG");
      var e = c.espP;
      H.av({ id: "dmax", criterio: "Diâmetro máximo do graúdo (1/2 a 2/3 da espessura)", secao: "5.1.1 b", unid: "mm", casas: 0, tab: "granG", campo: "dmax",
        min: ok(e) ? e * 10 / 2 : NaN, max: ok(e) ? e * 10 * 2 / 3 : NaN, exigido: ok(e) ? fmt(e * 5, 0) + " a " + fmt(e * 20 / 3, 0) + " mm" : "1/2 a 2/3 da espessura", aplica: ok(e),
        naoAplicaPor: "informe a espessura de projeto" });
      var nI = "ensaios feitos no início da utilização (lote anterior)";
      H.av({ id: "durNa", criterio: "Durabilidade — sulfato de sódio", secao: "5.1.1 b", unid: "%", casas: 1, max: 20, tab: "ins", campo: "durNa", aplica: ini, naoAplicaPor: nI });
      H.av({ id: "durMg", criterio: "Durabilidade — sulfato de magnésio", secao: "5.1.1 b", unid: "%", casas: 1, max: 30, tab: "ins", campo: "durMg", aplica: ini, naoAplicaPor: nI });
      var la = H.av({ id: "la", criterio: "Desgaste Los Angeles", secao: "5.1.1 b", unid: "%", casas: 0, max: 50 - 1e-6, exigido: "< 50 %", tab: "ins", campo: "la", aplica: ini, naoAplicaPor: nI });
      if (la.situacao === "nao_conforme" && P.laDesemp === "sim") { la.situacao = "ressalva"; la.motivo = "admitido por desempenho anterior comprovado (5.1.1 b) — anexar a comprovação: " + la.motivo; la.motivos = [{ situacao: "ressalva", texto: la.motivo }]; }
      H.av({ id: "faces", criterio: "Partículas com duas faces britadas", secao: "5.1.1 b", unid: "%", casas: 0, min: 75, tab: "ins", campo: "faces",
        aplica: ini && P.britado === "sim", naoAplicaPor: P.britado === "sim" ? nI : "pedra britada (exigência só para pedregulho/cascalho britado)" });
      // enchimento
      H.gran("granE");
      H.av({ id: "llE", criterio: "Enchimento — limite de liquidez", secao: "5.1.2 b", unid: "%", casas: 0, max: 25, tab: "carac", campo: "ll", np: 0 });
      H.av({ id: "ipE", criterio: "Enchimento — índice de plasticidade", secao: "5.1.2 b", unid: "%", casas: 0, max: 6, tab: "carac", campo: "ip", np: 0 });
      H.av({ id: "eaE", criterio: "Enchimento — equivalente de areia", secao: "5.1.2 b", unid: "%", casas: 0, min: 55, tab: "carac", campo: "ea" });
      // bloqueio
      var p2 = num(P.p200Sub), lb = A.linha({ id: "bloq", criterio: "Camada de bloqueio", secao: "5.3.1", exigido: "obrigatória se a subjacente tiver > 35 % na nº 200",
        semMedia: true, txtEstat: "—", resultado: bloq ? "executada" : "não executada" });
      if (ok(p2) && p2 > 35 && !bloq) A.marcar(lb, "nao_conforme", "subjacente com " + fmt(p2, 0) + " % passando na nº 200 (> 35 %) e sem camada de bloqueio");
      else if (!ok(p2) && !bloq) A.marcar(lb, "pendente", "informe o passante na nº 200 da camada subjacente para verificar a necessidade do bloqueio");
      else lb.motivo = bloq ? "executada" : "não exigida (subjacente com " + fmt(p2, 0) + " % na nº 200)";
      c.linhas.push(lb);
      if (bloq) {
        H.gran("granB");
        H.av({ id: "ipB", criterio: "Bloqueio — índice de plasticidade", secao: "5.1.3 b", unid: "%", casas: 0, max: 6 - 1e-6, exigido: "< 6 %", tab: "granB", campo: "ip", np: 0 });
        H.av({ id: "eaB", criterio: "Bloqueio — equivalente de areia", secao: "5.1.3 b", unid: "%", casas: 0, min: 55, tab: "granB", campo: "ea" });
        H.av({ id: "espB", criterio: "Bloqueio — espessura", secao: "5.3.1; Tabela 3", unid: "cm", casas: 1, min: 3, max: 5, exigido: "4 ± 1 cm", tab: "granB", campo: "espB" });
      }
      // execução e produto
      H.verif();
      if (P.defl === "sim") {
        var dp = num(P.dProj);
        var ld = H.av({ id: "defl", criterio: "Deflexão D₀ (X̄ + k·s ≤ projeto)", secao: "7.2.2 a; 7.5", unid: "0,01 mm", casas: 0, max: dp, tab: "defl", campo: "d0", rot: "det.", graf: true,
          exigido: ok(dp) ? "≤ " + fmt(dp, 0) + " (projeto)" : "valor de projeto" });
        if (!ok(dp) && ld.n) A.marcar(ld, "pendente", "informe a deflexão de projeto para o topo da camada");
      }
      H.geo();
    },
  });

  function gran(pen, ests, lista, reg, extras) {
    return lista.map(function (v, i) {
      var c = { est: String(ests[i]), reg: reg + "-" + (i + 1) };
      pen.forEach(function (p, j) { if (v[j] !== null) c[kPen(p[0])] = A.nstr(v[j], 1); });
      if (extras) Object.keys(extras[i] || {}).forEach(function (k) { c[k] = extras[i][k]; });
      return c;
    });
  }
  // faixa B (Tabela 1): 3" 100; 2 1/2" 90–100; 2" 35–70; 1 1/2" 0–15; 3/4" 0–5
  var G_OK = [[null, null, 100, 96, 55, 8, null, 2, null], [null, null, 100, 94, 50, 6, null, 1, null], [null, null, 100, 97, 58, 9, null, 3, null], [null, null, 100, 95, 53, 7, null, 2, null]];
  var E_OK = [[100, 94, null, null, 62, 39], [100, 92, null, null, 60, 37], [100, 95, null, null, 64, 41], [100, 93, null, null, 61, 38]];
  F.exemplos = [
    { nome: "Lote aceito — macadame hidráulico faixa B, 14 cm, 200 m, 2 jornadas", dados: function () {
      var d = { ident: { registro: "LOTE-MH-001", data: "2026-07-08", obra: "Obra A — BR-000", trecho: "Lote 1", local: "Est. 10 a 20", camada: "Base de macadame hidráulico", origem: "Pedreira X" },
        params: Object.assign({}, F.padrao, { estIni: "10", estFim: "20", largura: "7,20", espessura: "14", jornadas: "2", p200Sub: "22", flechaProj: "7" }), obs: "" };
      d.granG = gran(PEN_G, [11, 13, 16, 19], G_OK, "GR-G", [{ dmax: "76" }, { dmax: "76" }, { dmax: "76" }, { dmax: "76" }]);
      d.granGP = [{ p76_2: "100", p63_5: "95", p50_8: "54", p38_1: "8", p19_1: "2" }];
      d.granE = gran(PEN_E, [11, 13, 16, 19], E_OK, "GR-E");
      d.granEP = [{ p19_1: "100", p12_7: "93", p2: "62", p0_42: "39" }];
      d.ins = [{ reg: "AG-0152", durNa: "6,4", durMg: "9,8", la: "31" }];
      d.carac = [{ est: "12", reg: "EN-01", ll: "NP", ip: "NP", ea: "68" }, { est: "18", reg: "EN-02", ll: "NP", ip: "NP", ea: "71" }];
      d.verif = [{ atende: "S", real: "4" }, { atende: "S", real: "4" }, { atende: "S", real: "2" }];
      d.geo = X.secoes(10, 11, function (i) { return { larg: 7.24 + X.onda(i, 0.04), esp: 14.3 + X.onda(i, 0.9), flecha: 7.7 + X.onda(i, 0.5) }; });
      d.obs = "Exemplo gerado: pedra britada (faces não exigidas); subjacente com 22 % na nº 200 (bloqueio não exigido); durabilidade e LA no início da utilização.";
      return d;
    } },
    { nome: "Lote rejeitado — sem bloqueio sobre subleito argiloso, LA ≥ 50 %, EA do enchimento < 55 %, verificação final não conforme", dados: function () {
      var d = { ident: { registro: "LOTE-MH-002", data: "2026-07-21", obra: "Obra B — BR-000", trecho: "Lote 2", local: "Est. 40 a 50", camada: "Base de macadame hidráulico", origem: "Pedreira Y" },
        params: Object.assign({}, F.padrao, { estIni: "40", estFim: "50", largura: "7,20", espessura: "14", jornadas: "1", p200Sub: "48", flechaProj: "7", defl: "sim", dProj: "60" }), obs: "" };
      d.granG = gran(PEN_G, [42, 47], [G_OK[0], [null, null, 100, 92, 72, 18, null, 4, null]], "GR-G", [{ dmax: "76" }, { dmax: "76" }]);
      d.granGP = [{ p76_2: "100", p63_5: "95", p50_8: "54", p38_1: "8", p19_1: "2" }];
      d.granE = gran(PEN_E, [42, 47], [E_OK[0], E_OK[1]], "GR-E");
      d.granEP = [{ p19_1: "100", p12_7: "93", p2: "62", p0_42: "39" }];
      d.ins = [{ reg: "AG-0161", durNa: "8,2", durMg: "12,5", la: "54" }];
      d.carac = [{ est: "44", reg: "EN-11", ll: "NP", ip: "NP", ea: "50" }];
      d.verif = [{ atende: "S", real: "3" }, { atende: "S", real: "3" }, { atende: "N", real: "2", nc: "1", obs: "pedra penetrou na camada na estaca 46" }];
      d.defl = [48, 52, 57, 61, 55, 66, 58, 63, 54, 59, 62].map(function (v, i) { return { est: String(40 + i), pos: ["LE", "eixo", "LD"][i % 3], d0: String(v) }; });
      d.geo = X.secoes(40, 11, function (i) { return { larg: 7.23 + X.onda(i, 0.04), esp: 13.9 + X.onda(i, 1.0), flecha: 7.6 + X.onda(i, 0.5) }; });
      d.obs = "Exemplo de reprovação: subjacente com 48 % na nº 200 sem camada de bloqueio (5.3.1); LA de 54 % sem desempenho comprovado; EA do enchimento 50 %; " +
        "granulometria do graúdo fora na peneira de 2\" (amostra da estaca 47); compactação final não conforme; Dc = X̄ + k·s acima da deflexão de projeto.";
      return d;
    } },
  ];
})();
