/*
 * Ficha de ACEITAÇÃO DE LOTE: DNIT 167/2013-ES — Reciclagem profunda de pavimentos "in situ" com adição de cimento Portland.
 * Construtor comum FE.aceitacaoG2 (es-dnit-140-2022-es.js). O que a ES manda (seções do PDF):
 *   5.1.3 agregados adicionais: LA ≤ 55 % (maior com desempenho comprovado), IF ≥ 0,5, lamelaridade < 20 %,
 *         durabilidade < 12 %; miúdo: EA ≥ 40 %.   5.1.4 b emulsão RR-2C: residual de 0,4 a 0,6 l/m² (referência).
 *   5.3.1.1 Tabela 1: faixas I e II, tolerâncias ± 7 / 5 / 2 em torno da faixa de projeto.
 *   5.3.1.2 revestimento ≤ 50 % da massa; ≥ 95 % passando na 2"; ≤ 15 % passando na nº 200; RCS aos 7 dias 2,1 a 2,5 MPa;
 *           RT (compressão diametral) aos 7 dias 0,25 a 0,35 MPa.
 *   5.3.2 c cimento → início da mistura ≤ 30 min.   5.3.3 d GC ≥ 98 % (energia modificada).   5.3.4 trabalhabilidade ≤ 2 h.
 *   7.1.1 finura do cimento em cada carga (NBR 11579).  7.1.2 LA/forma/durabilidade no início; EA por dia.
 *   7.2.1.1 a cada 250 m por faixa de tráfego: granulometria do fresado, umidade, taxa de cimento, taxa de agregados,
 *           3 CPs de RCS e 3 CPs de RT.   7.2.2 compactação (Proctor modificado, DNIT 164) e GC (DNER-ME 092).
 *   7.3   geometria: largura até +10 cm (sem falta); flecha +20 % ou declividade +0,5 % (sem falta); espessura ± 10 %;
 *         NOTA: deflexão complementar — cada valor < projeto.
 *   7.4.2 X̄ − k·s ≥ mín.; X̄ + k·s ≤ máx.; k da Tabela 1 da DNER-PRO 277/97 (sem n = 11).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G2 = FE.aceitacaoG2, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var ID = "dnit-167-2013-es";
  var F250 = { por: "faixa", a_cada: 250 };
  function f250(ens, met, conta, sec) { return Object.assign({ ensaio: ens, metodo: met, secao: sec || "7.2.1.1", conta: conta }, F250); }
  function avisoCPs(nome) {
    return function (ctx, cols) {
      var p = cols.filter(function (c) { return ok(num(c.v)) && ok(num(c.ncp)) && num(c.ncp) < 3; });
      if (p.length) ctx.avisos.push(nome + ": " + p.length + " ponto(s) com menos de 3 corpos de prova (7.2.1.1 e, f).");
      var id = cols.filter(function (c) { return ok(num(c.v)) && ok(num(c.idade)) && num(c.idade) !== 7; });
      if (id.length) ctx.avisos.push(nome + ": " + id.length + " ponto(s) com idade diferente de 7 dias (5.3.1.2 e, 7.2.1.2 b).");
    };
  }
  var GR = [
    G2.granulometria({ secao: "5.3.1.1 / 7.2.1.1 a", obrig: true, titulo: "Granulometria do material fresado (sem cimento) — % passando",
      rotuloFaixa: "Faixa granulométrica de projeto (Tabela 1)", dica: "coletada na pista, sem adição de cimento (DNER-ME 080 → DNIT 412)",
      extras: [{ mm: 0.075, max: 15 }], freq: f250("Granulometria do fresado", "DNIT 412", null) }),
    G2.umidade({ secao: "7.2.1.1 b", modo: "info", titulo: "Umidade do material fresado, antes da adição de materiais", exigido: "registrar", criterio: "Umidade do fresado: Δw = w − h ót (informativo)",
      motivoInfo: "a ES não fixa tolerância de umidade", freq: f250("Umidade do fresado", "DNER-ME 052 → DNIT 456", null) }),
    G2.valores({ chave: "cim", titulo: "Taxas de cimento e de agregados e tempos de execução", secao: "7.2.1.1 c, d / 5.3.2 c / 5.3.4", rotulo: "Det.",
      campos: [
        { k: "taxa", r: "Taxa de cimento", u: "kg/m²", casas: 1, crit: { criterio: "Taxa de aplicação de cimento", secao: "7.2.1.1 c", informativo: true, proj: function (P) { return num(P.taxaProj); },
          exigido: function (P) { return ok(num(P.taxaProj)) ? "≈ " + fmt(num(P.taxaProj), 1) + " kg/m² (dosagem)" : "conforme dosagem"; }, motivoInfo: "a ES não fixa tolerância: comparar com a dosagem" } },
        { k: "tag", r: "Taxa de agregados adicionais", u: "m³/m²", casas: 3, crit: { criterio: "Taxa de aplicação de agregados", secao: "7.2.1.1 d", informativo: true, exigido: "conforme dosagem",
          aplica: function (P) { return P.agreg === "sim"; }, naoAplicaPor: "sem adição de agregados" } },
        { k: "t0", r: "Tempo aplicação do cimento → início da mistura", u: "min", casas: 0, crit: { criterio: "Tempo cimento → início da mistura", secao: "5.3.2 c", max: 30, individual: true, exigido: "≤ 30 min" } },
        { k: "tt", r: "Prazo de trabalhabilidade (início da mistura → fim da compactação e acabamento)", u: "h", casas: 2, crit: { criterio: "Prazo de trabalhabilidade", secao: "5.3.4", max: 2, individual: true, exigido: "≤ 2 h" } },
      ],
      freq: f250("Taxa de cimento", "—", ["taxa"]) }),
    G2.valores({ chave: "rcs", titulo: "Resistência à compressão simples aos 7 dias (CPs Ø 10 × 20 cm, câmara úmida)", secao: "5.3.1.2 e / 7.2.1.2 c", rotulo: "Ponto",
      dica: "pelo menos 3 CPs por ponto (5 camadas de 4 cm, 41 golpes, soquete de 4,48 kg); DNER-ME 201; 2,1 a 2,5 MPa",
      importar: { k: "impRCS", r: "RCS — importar (DNER-ME 201)", de: "dner-me-201-94", map: G2.map.rcs },
      texto: [{ k: "idade", r: "Idade (dias)", texto: false }, { k: "ncp", r: "Nº de CPs", texto: false }],
      campos: [{ k: "v", r: "RCS (média dos CPs)", u: "MPa", casas: 2, crit: { criterio: "Resistência à compressão simples aos 7 dias", min: 2.1, max: 2.5, grafico: true } }],
      freq: f250("Resistência à compressão simples", "DNER-ME 201", ["v"], "7.2.1.1 e"), extra: avisoCPs("RCS") }),
    G2.valores({ chave: "rt", titulo: "Resistência à tração por compressão diametral aos 7 dias", secao: "5.3.1.2 e / 7.2.1.2 c", rotulo: "Ponto",
      dica: "pelo menos 3 CPs por ponto; DNER-ME 181 (citada) — importável também da DNIT 136; 0,25 a 0,35 MPa",
      importar: { k: "impRT", r: "Tração por compressão diametral — importar (DNER-ME 181 / DNIT 136)", de: ["dner-me-181-94", "dnit-136-2018-me"], map: G2.map.rt },
      texto: [{ k: "idade", r: "Idade (dias)", texto: false }, { k: "ncp", r: "Nº de CPs", texto: false }],
      campos: [{ k: "v", r: "RT (média dos CPs)", u: "MPa", casas: 2, crit: { criterio: "Resistência à tração por compressão diametral aos 7 dias", min: 0.25, max: 0.35, grafico: true } }],
      freq: f250("Tração por compressão diametral", "DNER-ME 181", ["v"], "7.2.1.1 f"), extra: avisoCPs("RT") }),
    G2.valores({ chave: "comp", titulo: "Densidade de referência — Proctor modificado em molde CBR (após adição de materiais)", secao: "7.2.2 a", rotulo: "Amostra",
      importar: { k: "impComp", r: "Compactação — importar (DNIT 164)", de: ["dnit-164-2013-me", "dnit-172-2016-me"], map: G2.map.compactacao },
      campos: [{ k: "gs", r: "γs,máx (energia modificada)", u: "g/cm³", casas: 3, crit: { criterio: "Massa específica aparente seca máxima (referência do GC)", informativo: true, exigido: "referência" } },
        { k: "hot", r: "Umidade ótima", u: "%", casas: 1 }],
      freq: { ensaio: "Compactação (Proctor modificado)", metodo: "DNIT 164", secao: "7.2.2 a, 7.4.1", por: "plano", minimo: 1, conta: ["gs"] } }),
    G2.valores({ chave: "gc", titulo: "Grau de compactação na pista (frasco de areia)", secao: "5.3.3 d / 7.2.2 b", rotulo: "Furo", posicao: true,
      dica: "DNER-ME 092 (hoje DNIT 458); GC ≥ 98 % em relação à densidade da energia modificada",
      importar: { k: "impGC", r: "Grau de compactação — importar furos (DNIT 458, DNER-ME 036, DNIT 417)", de: ["dnit-458-2025-me", "dner-me-036-94", "dnit-417-2019-me"], map: G2.map.gc },
      campos: [{ k: "gc", r: "Grau de compactação (GC)", u: "%", casas: 1, crit: { criterio: "Grau de compactação (energia modificada)", min: 98, grafico: true } },
        { k: "w", r: "Umidade do furo (informativa)", u: "%" }, { k: "gref", r: "γs,máx de referência usado no GC", u: "g/cm³" }],
      freq: { ensaio: "Grau de compactação", metodo: "DNER-ME 092 → DNIT 458", secao: "7.2.2 b, 7.4.1", por: "plano", minimo: 5, motivoMin: "menor n da Tabela 1 da DNER-PRO 277", conta: ["gc"] } }),
    G2.valores({ chave: "fin", titulo: "Cimento Portland — finura (NBR 11579)", secao: "7.1.1", rotulo: "Carga",
      campos: [{ k: "res", r: "Finura — resíduo na peneira 75 µm", u: "%", casas: 1, crit: { criterio: "Finura do cimento", informativo: true, exigido: "DNER-EM 036 / NBR 5732 (a ES não fixa o limite)" } }],
      freq: { ensaio: "Finura do cimento", metodo: "NBR 11579", secao: "7.1.1", por: "carregamento", regra: "1 por carga recebida" } }),
    G2.valores({ chave: "emu", titulo: "Pintura de proteção — taxa residual de emulsão RR-2C (bandejas)", secao: "5.1.4 b / 7.2.3", rotulo: "Bandeja",
      dica: "TR = (P₂ − P₁) / A; em geral 0,4 a 0,6 l/m² de residual, fixada no projeto e ajustada na obra",
      campos: [{ k: "tr", r: "Taxa residual (TR)", u: "l/m²", casas: 2, crit: { criterio: "Taxa residual da pintura de proteção", informativo: true, proj: function (P) { return num(P.trProj); },
        exigido: function (P) { return ok(num(P.trProj)) ? "≈ " + fmt(num(P.trProj), 2) + " l/m² (projeto)" : "projeto (em geral 0,4 a 0,6 l/m²)"; } } }],
      freq: { ensaio: "Taxa de emulsão", metodo: "bandejas", secao: "7.2.3", por: "lote", minimo: 1, regra: "aleatória (adotado mín. 1 por lote)" } }),
  ].concat(G2.agregados({ sec5: "5.1.3", sec7: "7.1.2", lamelar: true })).concat([
    G2.deflexao({ secao: "7.3", modo: "complementar" }),
    G2.geometria({ secao: "7.3", largura: "semFalta" }),
  ]);

  G2.criar({
    id: ID, codigo: "DNIT 167/2013-ES", grupos: GR, porFaixa: true, tabelaK: G2.K_PRO277,
    titulo: "Reciclagem profunda in situ com cimento Portland — aceitação de lote",
    resumo: "Reúne os ensaios do lote (importados das fichas ME ou digitados), confere a frequência (a cada 250 m de faixa de tráfego) e aplica os critérios da DNIT 167/2013-ES: " +
      "granulometria na faixa I ou II (Tabela 1), RCS aos 7 dias de 2,1 a 2,5 MPa, RT de 0,25 a 0,35 MPa, GC ≥ 98 % (energia modificada), tempos, agregados adicionais, " +
      "controle geométrico e deflexão complementar, com o controle estatístico de 7.4.2 (Tabela 1 da DNER-PRO 277/97).",
    refs: { reprova: "7.4.2 a", atende: "7.4.2 a", corrige: "7.4.2 c", regra: "7.4.2", tabela: "Tabela 1 da DNER-PRO 277/97" },
    dicaEspessura: "tolerância ± 10 % (7.3 c)",
    rotuloPlano: "Plano de amostragem: 1 determinação de GC a cada … m de faixa — opcional",
    params: [
      { k: "taxaProj", r: "Taxa de cimento de projeto (kg/m²) — opcional" },
      { k: "trProj", r: "Taxa residual de emulsão de projeto (l/m²) — opcional" },
      { k: "nCarreg", r: "Cargas de cimento recebidas no período", ph: "0" },
    ].concat(G2.paramsAgregados),
    padrao: { nFaixas: "1", jornadas: "1", nCarreg: "1", agreg: "nao", laDesemp: "nao", defl: "nao", secaoT: "simples", declProj: "3", espGeo: "20" },
    verificacoes: [
      { id: "dos", texto: "Projeto de dosagem e metodologia aprovados pelo DNIT", secao: "4.1 b" },
      { id: "cert", texto: "Cimento com certificado de fabricação (DNER-EM 036, NBR 5732) em cada carga", secao: "5.1.1" },
      { id: "temp", texto: "Temperatura ambiente entre 5 °C e 35 °C; sem chuva", secao: "4.1 c, d" },
      { id: "rev", texto: "Revestimento ≤ 50 % da massa da mistura reciclada; curva sem patamares", secao: "5.3.1.2 a, d" },
      { id: "emu", texto: "Emulsão RR-2C (DNIT 165) ensaiada em cada carregamento (resíduo, peneiramento, viscosidade, carga da partícula)", secao: "7.1.3" },
      { id: "junta", texto: "Juntas longitudinais com sobreposição ≥ 15 cm; juntas transversais tratadas", secao: "5.3.2 e / NOTAS" },
      { id: "prot", texto: "Pintura de proteção sem asfalto diluído", secao: "5.3.5" },
      { id: "traf", texto: "Liberação ao tráfego após capa selante e ≥ 3 dias", secao: "5.3.6 a" },
    ],
    textos: { REJEITADO: { titulo: "LOTE REJEITADO", texto: "Há critério não conforme (7.4.2 a). O serviço corrigido só é aceito se as correções o colocarem em conformidade com a norma; caso contrário, é rejeitado (7.4.2 c)." } },
    notas: "DNIT 167/2013-ES. Frequências: ensaios de campo a cada 250 m por faixa de tráfego (7.2.1.1); GC: a ES não fixa (plano de amostragem, 7.4.1) — sem plano informado, 5 (menor n da tabela). " +
      "RCS e RT são avaliadas pela média dos CPs de cada ponto, com limite bilateral (5.3.1.2 e). Granulometria: faixa I ou II (Tabela 1) ∩ projeto ± tolerância, " +
      "com passante na nº 200 ≤ 15 % (5.3.1.2 c); a Tabela 1 exige 100 % na 2\", mais restritiva que os ≥ 95 % de 5.3.1.2 b (adotada a Tabela 1). " +
      "Métodos citados e substituídos: DNER-ME 080 → DNIT 412; DNER-ME 052 → DNIT 456; DNER-ME 092 → DNIT 458; DNER-ME 035 → DNIT 451; DNER-ME 054 → DNIT 450.",
    exemplos: function (F) {
      var X = G2.ex;
      function base(reg, extra) {
        return { ident: Object.assign({ registro: reg, data: "2026-05-12", obra: "Obra F — BR-000", origem: "Pavimento existente + cimento do Fornecedor A", camada: "Base reciclada com 4 % de cimento" }, extra.ident || {}),
          params: Object.assign({}, F.padrao, extra.params), gran: [{}], umid: [{}], cim: [{}], rcs: [{}], rt: [{}], comp: [{}], gc: [{}], fin: [{}], emu: [{}], obs: "" };
      }
      return [
        { nome: "Lote aceito — 500 m de uma faixa, faixa II (RCS da DNER-ME 201 e compactação da DNIT 164 importadas)", dados: function () {
          var d = base("LOTE-RC-01", { ident: { trecho: "Faixa direita", local: "Est. 500 a 525" },
            params: { estIni: "500", estFim: "525", largura: "3,60", espessura: "25", faixa: "dnit-167-2013-es-II", taxaProj: "20,0", trProj: "0,5", defl: "realizado", lse: "45" } });
          d.gran = [{ est: "505", reg: "GR-1 · DNIT 412", p50_8: "100", p25_4: "100", p9_5: "71", p4_75: "52", p2: "38", p0_425: "22", p0_075: "9" },
            { est: "518", reg: "GR-2 · DNIT 412", p50_8: "100", p25_4: "100", p9_5: "68", p4_75: "50", p2: "36", p0_425: "21", p0_075: "10" }];
          d.proj = [{ p50_8: "100", p25_4: "100", p9_5: "70", p4_75: "51", p2: "37", p0_425: "22", p0_075: "9" }];
          d.umid = X.cols(["w"], [["505", 4.8], ["518", 5.3]], { reg: "Speedy" });
          d.cim = X.cols(["taxa", "t0", "tt"], [["505", 20.3, 18, 1.6], ["518", 19.8, 22, 1.8]], { reg: "Pesagem" });
          X.importar(F, d, "impRCS", [["dner-me-201-94", 1]]);
          d.rcs[0].est = "505"; d.rcs[0].ncp = "3";
          d.rcs.push({ est: "518", reg: "RCS-2 · DNER-ME 201 (digitado)", idade: "7", ncp: "3", v: "2,34" });
          d.rt = X.cols(["idade", "ncp", "v"], [["505", "7", "3", 0.29], ["518", "7", "3", 0.31]], { reg: "RT · DNER-ME 181" });
          X.importar(F, d, "impComp", [["dnit-164-2013-me", 2]]);
          d.comp[0].est = "510";
          d.gc = [["501", "LE", 99.1], ["505", "eixo", 98.8], ["510", "LD", 99.6], ["514", "LE", 98.9], ["519", "eixo", 99.4], ["523", "LD", 99.0]]
            .map(function (x, i) { return { est: x[0], pos: x[1], reg: "DNIT 458 — furo " + (i + 1), gc: A.nstr(x[2], 1) }; });
          d.fin = X.cols(["res"], [["canteiro", 2.1]], { reg: "NBR 11579" });
          d.emu = X.cols(["tr"], [["508", 0.48], ["520", 0.52]], { reg: "Bandeja" });
          d.defl = X.deflexoes(500, [32, 35, 30, 38, 34, 31, 36, 33, 37, 32, 35, 30, 34, 36, 33, 31, 35, 32, 34, 36, 33, 31, 35, 34, 32, 33]);
          d.geo = X.secoes(500, [[3.64, 25.3, 3.1, 3.0], [3.62, 24.6, 3.2, 3.1], [3.66, 25.8, 3.0, 3.2], [3.63, 24.9, 3.1, 3.1], [3.65, 25.2, 3.3, 3.0], [3.61, 25.5, 3.2, 3.1],
            [3.64, 24.7, 3.0, 3.2], [3.66, 25.1, 3.1, 3.1], [3.62, 25.4, 3.2, 3.0], [3.63, 24.8, 3.3, 3.2], [3.65, 25.6, 3.1, 3.1], [3.64, 25.0, 3.0, 3.3], [3.62, 24.9, 3.2, 3.2],
            [3.66, 25.3, 3.1, 3.0], [3.63, 25.1, 3.0, 3.1], [3.64, 24.6, 3.2, 3.2], [3.65, 25.5, 3.1, 3.0], [3.62, 25.2, 3.3, 3.1], [3.64, 24.8, 3.0, 3.2], [3.63, 25.4, 3.1, 3.1],
            [3.66, 25.0, 3.2, 3.0], [3.62, 24.7, 3.1, 3.2], [3.65, 25.3, 3.0, 3.1], [3.64, 25.1, 3.2, 3.1], [3.63, 24.9, 3.1, 3.0], [3.65, 25.2, 3.3, 3.2]]);
          d.verif = X.verif(8);
          d.obs = "Exemplo: RCS (DNER-ME 201, exemplo nº 2) e γs,máx (DNIT 164, energia modificada) importados dos exemplos das fichas ME; demais determinações digitadas.";
          return d;
        } },
        { nome: "Lote rejeitado — RCS acima de 2,5 MPa (X̄ + k·s), RT fora de 0,25–0,35 MPa, nº 200 acima de 15 %, tempo de trabalhabilidade excedido", dados: function () {
          var d = base("LOTE-RC-02", { ident: { trecho: "Faixa esquerda", local: "Est. 600 a 625" },
            params: { estIni: "600", estFim: "625", largura: "3,60", espessura: "25", faixa: "dnit-167-2013-es-I", nFaixas: "1" } });
          d.gran = [{ est: "610", reg: "GR-3 · DNIT 412", p50_8: "100", p25_4: "86", p9_5: "62", p4_75: "46", p2: "35", p0_425: "25", p0_075: "16" }];
          d.proj = [{}];
          d.umid = X.cols(["w"], [["605", 5.9], ["618", 6.4]], { reg: "Speedy" });
          d.cim = X.cols(["taxa", "t0", "tt"], [["605", 24.8, 25, 2.4], ["618", 25.1, 40, 1.9]], { reg: "Pesagem" });
          d.rcs = X.cols(["idade", "ncp", "v"], [["603", "7", "3", 2.48], ["608", "7", "3", 2.62], ["613", "7", "3", 2.41], ["618", "7", "3", 2.55], ["623", "7", "2", 2.46]], { reg: "RCS · DNER-ME 201" });
          X.importar(F, d, "impRT", [["dnit-136-2018-me", 2]]);
          d.rt[0].est = "610"; d.rt[0].idade = "7";
          d.rt.push({ est: "620", reg: "RT · DNER-ME 181 (digitado)", idade: "7", ncp: "3", v: "0,41" });
          d.comp = X.cols(["gs", "hot"], [["612", 2.142, 6.1]], { reg: "DNIT 164 (modificado)" });
          X.importar(F, d, "impGC", [["dnit-458-2025-me", 1]]);
          d.gc.forEach(function (c, i) { c.est = String(602 + 6 * i); });
          d.gc.push({ est: "624", pos: "LE", reg: "DNIT 458 — furo digitado", gc: "97,4" });
          d.fin = X.cols(["res"], [["canteiro", 2.4]], { reg: "NBR 11579" });
          d.emu = X.cols(["tr"], [["615", 0.46]], { reg: "Bandeja" });
          d.geo = X.secoes(600, [[3.62, 24.1, 3.0, 3.1], [3.58, 23.4, 3.1, 3.0], [3.64, 24.8, 3.2, 3.1], [3.63, 23.9, 3.0, 3.2], [3.61, 24.5, 3.1, 3.0], [3.65, 23.7, 3.2, 3.1],
            [3.62, 24.2, 3.0, 3.1], [3.63, 23.6, 3.1, 3.2], [3.64, 24.4, 3.2, 3.0], [3.61, 23.8, 3.0, 3.1], [3.62, 24.6, 3.1, 3.1], [3.65, 24.0, 3.2, 3.0], [3.63, 23.5, 3.0, 3.2],
            [3.62, 24.3, 3.1, 3.1], [3.64, 23.9, 3.2, 3.0], [3.61, 24.1, 3.0, 3.1], [3.63, 24.7, 3.1, 3.2], [3.62, 23.8, 3.2, 3.1], [3.64, 24.2, 3.0, 3.0], [3.63, 24.0, 3.1, 3.1],
            [3.65, 23.6, 3.2, 3.2], [3.62, 24.4, 3.0, 3.1], [3.64, 24.1, 3.1, 3.0], [3.63, 23.9, 3.2, 3.1], [3.62, 24.5, 3.0, 3.2], [3.64, 24.0, 3.1, 3.1]]);
          d.verif = X.verif(8);
          d.obs = "Exemplo de reprovação: mistura rígida demais (RCS com X̄ + k·s > 2,5 MPa; RT 0,60 e 0,41 MPa > 0,35 MPa), finos acima de 15 %, tempo cimento → mistura de 40 min e " +
            "trabalhabilidade de 2,4 h; largura abaixo do projeto na estaca 601.";
          return d;
        } },
      ];
    },
  });
})();
