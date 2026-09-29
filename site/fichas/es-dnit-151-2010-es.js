/*
 * Ficha de ACEITAÇÃO DE LOTE: DNIT 151/2010-ES — Acostamentos (motor FE.aceitacaoG1, em es-dnit-137-2010-es.js).
 *   5.1.1 (p. 2–3) com revestimento: as camadas seguem as ES correspondentes do DNIT (use a ficha dessas ES para o material).
 *   5.1.2 d (p. 3) sem revestimento, parte correspondente à base: passante nº 200 ≤ 30 %; LL ≤ 40 %; IP ≤ 10 %; EA > 30 %;
 *                  ISC ≥ 40 % e expansão ≤ 0,5 % (energia do Método B).
 *   7.1 (p. 4)     caracterização e EA: 1 por camada a cada 750 m³ ou jornada de 8 h; compactação e ISC: 1 a cada 250 m³ ou
 *                  jornada; materiais homogêneos: 1 por 2.250 m³ (a critério da Fiscalização).
 *   7.2 (p. 4–5)   umidade a cada 250 m³ (± 2 % da ótima); GC a cada 250 m³ (≤ 1.200 m³ → mín. 5); GC ≥ 100 %.
 *   7.3 (p. 5)     largura ± 5 cm; declividade transversal até +1 % em excesso (sem falta); espessura ± 10 %.
 *   7.5 (p. 5)     X̄ ∓ k·s — k sem tabela na ES: DNER-PRO 277/97, Tabela 1.   8: medição pelas ES dos serviços correspondentes.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G1 = FE.aceitacaoG1, num = FE.num, ok = FE.ok, fmt = FE.fmt, X = G1.ex;
  var F = G1.criar({
    id: "dnit-151-2010-es",
    titulo: "Acostamentos — aceitação de lote",
    resumo: "Reúne os ensaios do lote (importados das fichas ME ou digitados), confere a frequência por volume (7.1, 7.2) e aplica os critérios da ES: " +
      "material da base de acostamento sem revestimento (p200 ≤ 30 %, LL ≤ 40 %, IP ≤ 10 %, EA > 30 %, ISC ≥ 40 %, expansão ≤ 0,5 %), umidade h ót ± 2 %, " +
      "GC ≥ 100 % e controle geométrico (largura ± 5 cm, declividade até +1 %, espessura ± 10 %), com o controle estatístico da 7.5.",
    refs: { reprova: "7.5 b", atende: "7.5 a", corrige: "7.5", regra: "7.5", tabela: "DNER-PRO 277/97, Tabela 1" },
    tabelaK: G1.K_PRO277, tabelaNome: "DNER-PRO 277/97, Tabela 1 (a ES não traz a tabela; 7.4 remete à PRO 277)",
    homog: true, volume: true, rotLargura: "Largura de projeto do acostamento (m)",
    params: [
      { k: "tipo", r: "Tipo de acostamento (5.1)", tipo: "select", opcoes: [["sem", "Sem revestimento — requisitos de 5.1.2 d"], ["com", "Com revestimento — material pelas ES das camadas correspondentes (5.1.1)"]] },
      { k: "declProj", r: "Declividade transversal de projeto (%)", ph: "5" },
    ],
    padrao: { homog: "nao", jornadas: "1", tipo: "sem", espGeo: "20" },
    blocos: {
      umid: { secao: "7.2 a", dica: "por camada, a cada 250 m³; ± 2 % em torno da ótima" },
      comp: { titulo: "Compactação, ISC e expansão", secao: "5.1.2 d; 7.1 b, d", campos: ["isc", "exp"], dica: "energia de projeto (Método B para a base sem revestimento)" },
      gc: { secao: "7.2 b, c" },
      carac: { titulo: "Caracterização e equivalente de areia", secao: "5.1.2 d; 7.1 a", campos: ["p200", "ll", "ip", "ea"] },
      geo: { secao: "7.3", larg: 0.05, esp: true, decl: 1, rotLarg: "Largura do acostamento", dica: "largura ± 5 cm; declividade até +1 p.p. (sem falta); espessura ± 10 %" },
    },
    criterioTxt: "DNIT 151/2010-ES, 7.5 — controle estatístico com a Tabela 1 da DNER-PRO 277/97",
    notas: "DNIT 151/2010-ES. Métodos citados e substituídos: DNER-ME 129 → DNIT 164; DNER-ME 049 → DNIT 172; DNER-ME 054 → DNIT 450; DNER-ME 080 → DNIT 412; " +
      "DNER-ME 052/088 → DNIT 456; DNER-ME 092 → DNIT 458. Volume do lote: informado ou área × espessura de projeto. Declividade: tolerância de +1 ponto percentual. " +
      "Medição: pelos critérios das ES dos serviços correspondentes (seção 8).",
    criterios: function (c, H) {
      var P = c.P, sem = P.tipo !== "com";
      if (!ok(c.V)) c.av.push("Informe o volume de material do lote ou a espessura de projeto: as frequências da ES são por volume (7.1, 7.2).");
      H.freq({ ensaio: "Caracterização e equivalente de areia", metodo: "DNIT 412 / DNER-ME 122 / 082 / DNIT 450", por: "volume", a_cada: 750, a_cadaH: 2250, jornada: true, secao: "7.1 a",
        realizado: H.conta("carac", ["p200", "ll", "ip", "ea"]) });
      H.freq({ ensaio: "Compactação (γs,máx e h ót)", metodo: "DNIT 164", por: "volume", a_cada: 250, a_cadaH: 2250, jornada: true, secao: "7.1 b", realizado: H.conta("comp", ["gs"]) });
      H.freq({ ensaio: "ISC e expansão", metodo: "DNIT 172", por: "volume", a_cada: 250, a_cadaH: 2250, jornada: true, secao: "7.1 d", realizado: H.conta("comp", ["isc", "exp"]) });
      H.freq({ ensaio: "Umidade antes da compactação", metodo: "DNIT 456", por: "volume", a_cada: 250, secao: "7.2 a", realizado: H.conta("umid", ["w"]) });
      H.freq({ ensaio: "Grau de compactação", metodo: "DNIT 458 / DNER-ME 036", por: "volume", a_cada: 250, min5vol: 1200, secao: "7.2 b", realizado: H.conta("gc", ["gc"]) });
      H.av({ id: "umid", criterio: "Umidade antes da compactação: Δw = w − h ót", secao: "7.2 a", unid: "p.p.", casas: 1, min: -2, max: 2, graf: true,
        exigido: "h ót ± 2 (Δw de −2,0 a +2,0)", pontos: H.pts("umid", function (x, i) { return c.tab.umid[i].dw; }, { rot: "det." }) });
      H.av({ id: "gc", criterio: "Grau de compactação", secao: "7.2 c", unid: "%", casas: 1, min: 100, tab: "gc", campo: "gc", rot: "furo", graf: true });
      var nAp = "acostamento com revestimento: material pelas ES das camadas correspondentes (5.1.1 c)";
      H.av({ id: "p200", criterio: "Passante na peneira nº 200", secao: "5.1.2 d", unid: "%", casas: 1, max: 30, tab: "carac", campo: "p200", aplica: sem, naoAplicaPor: nAp });
      H.av({ id: "ll", criterio: "Limite de liquidez", secao: "5.1.2 d", unid: "%", casas: 0, max: 40, tab: "carac", campo: "ll", np: 0, aplica: sem, naoAplicaPor: nAp });
      H.av({ id: "ip", criterio: "Índice de plasticidade", secao: "5.1.2 d", unid: "%", casas: 0, max: 10, tab: "carac", campo: "ip", np: 0, aplica: sem, naoAplicaPor: nAp });
      H.av({ id: "ea", criterio: "Equivalente de areia", secao: "5.1.2 d", unid: "%", casas: 0, min: 30, minEstrito: true, tab: "carac", campo: "ea", aplica: sem, naoAplicaPor: nAp });
      H.av({ id: "isc", criterio: "ISC", secao: "5.1.2 d", unid: "%", casas: 0, min: 40, tab: "comp", campo: "isc", aplica: sem, naoAplicaPor: nAp });
      H.av({ id: "exp", criterio: "Expansão", secao: "5.1.2 d", unid: "%", casas: 2, max: 0.5, tab: "comp", campo: "exp", aplica: sem, naoAplicaPor: nAp });
      H.geo();
    },
  });

  function secGeo(ini, n, fn) { return X.secoes(ini, n, fn); }
  F.exemplos = [
    { nome: "Lote aceito — acostamento sem revestimento, 2 × 400 m × 2,5 m × 15 cm (300 m³)", dados: function () {
      var d = { ident: { registro: "LOTE-AC-001", data: "2026-08-26", obra: "Obra A — BR-000", trecho: "Acostamentos LE e LD", local: "Est. 300 a 320", camada: "Acostamento — base", origem: "Jazida 2" },
        params: Object.assign({}, F.padrao, { estIni: "300", estFim: "320", largura: "2,50", espessura: "15", volume: "300", declProj: "5", jornadas: "1" }), obs: "" };
      d.comp = [[303, "2,012", "10,8", "52", "0,18"], [310, "2,020", "10,5", "48", "0,22"], [316, "2,008", "11,0", "55", "0,15"]]
        .map(function (x, i) { return { est: String(x[0]), reg: "CP-" + (151 + i), gs: x[1], hot: x[2], isc: x[3], exp: x[4] }; });
      d.carac = [{ est: "305", reg: "CAR-151", p200: "22", ll: "31", ip: "8", ea: "36" }];
      d.umid = X.colunas([[302, 10.1], [308, 11.6], [314, 10.9]], "w", "Campo — Speedy");
      d.gc = [[301, "LE", 101.0], [305, "LD", 100.6], [309, "LE", 101.5], [313, "LD", 100.9], [318, "LE", 101.8]]
        .map(function (x, i) { return { est: String(x[0]), pos: x[1], reg: "DNIT 458 — furo " + (i + 1), gc: fmt(x[2], 1) }; });
      d.geo = secGeo(300, 21, function (i) { return { larg: 2.52 + X.onda(i, 0.015), esp: 15.3 + X.onda(i, 0.8), decl: 5.4 + X.onda(i, 0.3) }; });
      d.obs = "Exemplo gerado: 300 m³ → caracterização 1 (750 m³), compactação/ISC e umidade 2 (250 m³), GC 5 (≤ 1.200 m³).";
      return d;
    } },
    { nome: "Lote rejeitado — IP e p200 acima, declividade abaixo do projeto e GC insuficiente", dados: function () {
      var d = { ident: { registro: "LOTE-AC-002", data: "2026-09-09", obra: "Obra B — BR-000", trecho: "Acostamento LD", local: "Est. 40 a 70", camada: "Acostamento — base", origem: "Jazida 6" },
        params: Object.assign({}, F.padrao, { estIni: "40", estFim: "70", largura: "2,50", espessura: "15", declProj: "5", jornadas: "2" }), obs: "" };
      d.comp = [[44, "1,962", "13,1", "44", "0,34"], [53, "1,955", "13,4", "41", "0,41"], [62, "1,970", "12,8", "46", "0,29"]]
        .map(function (x, i) { return { est: String(x[0]), reg: "CP-" + (171 + i), gs: x[1], hot: x[2], isc: x[3], exp: x[4] }; });
      d.carac = [{ est: "46", reg: "CAR-171", p200: "34", ll: "38", ip: "12", ea: "31" }];
      d.umid = X.colunas([[42, 12.2], [50, 14.1], [58, 13.0]], "w", "Campo — Speedy");
      d.gc = [[41, "LD", 99.2], [48, "LD", 100.4], [55, "LD", 98.9], [63, "LD", 100.1], [69, "LD", 99.6]]
        .map(function (x, i) { return { est: String(x[0]), pos: x[1], reg: "DNIT 458 — furo " + (i + 1), gc: fmt(x[2], 1) }; });
      d.geo = secGeo(40, 31, function (i) { return { larg: 2.51 + X.onda(i, 0.02), esp: 15.1 + X.onda(i, 0.9), decl: i === 12 ? 4.6 : 5.3 + X.onda(i, 0.25) }; });
      d.obs = "Exemplo de reprovação: 600 m × 2,5 m × 15 cm = 225 m³; IP 12 % e p200 34 %; GC com X̄ − k·s < 100 %; declividade de 4,6 % na estaca 52 (falta não tolerada).";
      return d;
    } },
  ];
})();
