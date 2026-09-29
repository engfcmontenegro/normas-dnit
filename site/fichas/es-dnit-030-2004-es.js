/*
 * Ficha de ACEITAÇÃO: DNIT 030/2004-ES — Drenagem — Dispositivos de drenagem pluvial urbana.
 *
 * O que a ES manda (seções do PDF):
 *   4     conforme o projeto; sem projeto, Álbum de projetos-tipo e padronização municipal (perímetro urbano).
 *   5.1   tubos de concreto ponta e bolsa (NBR 9793/9794); rejuntamento: argamassa cimento-areia 1:4 em massa (5.1.3 —
 *         mas 5.3.1/5.3.2/5.3.3 mandam 1:3; ver nota); demais materiais conforme ABNT/DNIT.
 *   5.3.1 galerias: DNIT 023-ES (tubulares) ou 025-ES (celulares); vala com largura ≥ diâmetro + 60 cm; fundo compactado
 *         mecanicamente; berço de concreto nas áreas trafegáveis (ciclópico com 30 % de pedra de mão ou concreto simples/
 *         armado, fck ≥ 15 MPa); juntas com argamassa 1:3, sem excesso no interior; bolsas a montante; cotas e alinhamento
 *         do projeto; reaterro após a fixação, em camadas ≤ 15 cm, compactação manual até 60 cm acima da geratriz superior.
 *   5.3.2 bocas-de-lobo: base de concreto fck ≥ 15 MPa; alvenaria de tijolo maciço ou bloco com argamassa 1:3, revestida
 *         internamente; cinta de concreto 15 MPa; grelha de ferro fundido ou de concreto armado fck ≥ 22 MPa.
 *   5.3.3 poços de visita: lastro de concreto magro fck ≥ 11 MPa; fundo/paredes da câmara fck ≥ 15 MPa; laje de cobertura
 *         fck ≥ 22 MPa; chaminé de alvenaria (argamassa 1:3) ou anéis (NBR 9794); escada de marinheiro com degraus de aço
 *         CA-25 Ø 16 mm espaçados no máximo 30 cm; cinta, laje de redução e tampão de ferro fundido.
 *   7.1   controle do concreto (NBR 12654, NBR 12655, DNER-ES 330); plano de CPs; tubos: lotes de 100 a 200 unidades por
 *         partida, 4 tubos por lote — 2 à permeabilidade (NBR 9796) e 2 à compressão diametral (NBR 9795) e absorção
 *         (NBR 9794); consistência (NBR NM 67/68).
 *   7.2   acabamento visual sem prejuízo hidráulico; embasamento e enchimento das valas; concreto ciclópico pela DNER-ES 330.
 *   7.3   seções transversais: diferença ≤ 1 % do projeto em pontos isolados; espessuras ± 10 % da de projeto.
 *   7.4   fck,est ≥ fck → conformidade; fck,est < fck → não conformidade.
 * fck,est pela ABNT NBR 12655 e controle geométrico: FE.aceitacaoDrenagem (definido em es-dnit-025-2025-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, D = FE.aceitacaoDrenagem, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  function tipo(P) { return P.tipo || "galeria"; }
  function eh(t) { return function (P) { return tipo(P) === t; }; }
  var gal = eh("galeria"), bl = eh("bocalobo"), pv = eh("pv");
  function grelhaConc(P) { return bl(P) && P.grelha === "concreto"; }
  function nLotes(P) { var n = num(P.nTubos); return ok(n) && n > 0 ? Math.max(1, Math.ceil(n / 200 - 1e-9)) : NaN; }
  var GM = "Materiais e ensaios dos tubos (5.1; 7.1)", GC = "Controle do concreto (7.1; 7.4)", GE = "Execução (5.3)", GA = "Acabamento e meio ambiente (6; 7.2)";
  var freqTubo = { por: "contagem", a_cada: 1, qtd: function (P) { return 2 * nLotes(P); }, unidade: "tubo", regra: "2 tubos por lote de 100 a 200 tubos da partida" };

  function preencher(F, d, falhas) {
    d.verificacoes = [];
    F.simples.criterios.filter(function (it) { return it.tipo === "sim_nao"; }).forEach(function (it) {
      if (it.se && !it.se(d.params)) { d.verificacoes.push({}); return; }
      d.verificacoes.push((falhas || {})[it.id] || { atende: "S", real: "1" });
    });
  }

  var F = A.fichaSimples({
    id: "dnit-030-2004-es",
    titulo: "Dispositivos de drenagem pluvial urbana — aceitação (DNIT 030/2004-ES)",
    resumo: "Aceitação de galeria, boca-de-lobo ou poço de visita: tubos (lotes de 100 a 200, 4 tubos ensaiados por lote — 7.1), concreto por classe com fck,est ≥ fck (15, 11 e 22 MPa; 7.4, NBR 12655), execução (5.3), controle geométrico com seções a ± 1 % e espessuras a ± 10 % (7.3) e acabamento (7.2).",
    lote: false,
    params: [
      { k: "tipo", r: "Dispositivo", tipo: "select", recarrega: true, opcoes: [["galeria", "Galeria de tubos de concreto (5.3.1)"], ["bocalobo", "Boca-de-lobo (5.3.2)"], ["pv", "Poço de visita (5.3.3)"]] },
      { k: "disp", r: "Identificação do dispositivo / trecho", ph: "ex.: galeria Ø 0,80 m, PV-3 a PV-4" },
      { k: "nTubos", r: "Tubos da partida recebida (unid.)", dica: "7.1: lotes de 100 a 200 tubos; 4 tubos ensaiados por lote", se: function (d) { return gal((d && d.params) || {}); } },
      { k: "trafegavel", r: "Galeria em área trafegável?", tipo: "select", recarrega: true, opcoes: [["sim", "Sim — berço de concreto"], ["nao", "Não"]], se: function (d) { return gal((d && d.params) || {}); } },
      { k: "grelha", r: "Grelha da boca-de-lobo", tipo: "select", recarrega: true, opcoes: [["ferro", "Ferro fundido"], ["concreto", "Concreto armado (fck ≥ 22 MPa)"]], se: function (d) { return bl((d && d.params) || {}); } },
      D.paramCond,
      D.paramModo("fc15", "concreto de 15 MPa"),
      D.paramModo("fc11", "concreto magro de 11 MPa", pv),
      D.paramModo("fc22", "concreto de 22 MPa", function (P) { return pv(P) || grelhaConc(P); }),
    ],
    padrao: { tipo: "galeria", trafegavel: "sim", grelha: "ferro", condPreparo: "B", modo_fc15: "excepcional", modo_fc11: "excepcional", modo_fc22: "excepcional" },
    refs: { reprova: "7.4", corrige: "7.4", regra: "7.4" },
    providencias: function (par) { return par.parecer === "ACEITO" ? [] : ["Não conformidades dos insumos, da produção e do produto tratadas conforme a DNIT 011/2004-PRO (7.4)."]; },
    criterios: [
      // tubos
      { id: "tubos", grupo: GM, texto: "Tubos de concreto ponta e bolsa, do tipo e dimensões do projeto (NBR 9793 / NBR 9794); partida inspecionada", secao: "5.1.1; 7.1", tipo: "sim_nao", se: gal, naoAplicaPor: "não é galeria" },
      { id: "perm", grupo: GM, texto: "Permeabilidade (NBR 9796) — 2 tubos por lote", secao: "7.1", tipo: "sim_nao", metodo: "NBR 9796", freq: freqTubo, se: gal, naoAplicaPor: "não é galeria" },
      { id: "compr", grupo: GM, texto: "Compressão diametral (NBR 9795) — 2 tubos por lote", secao: "7.1", tipo: "sim_nao", metodo: "NBR 9795", freq: freqTubo, se: gal, naoAplicaPor: "não é galeria" },
      { id: "absor", grupo: GM, texto: "Absorção (NBR 9794) — nos 2 tubos da compressão diametral", secao: "7.1", tipo: "sim_nao", metodo: "NBR 9794", freq: freqTubo, se: gal, naoAplicaPor: "não é galeria" },
      { id: "argam", grupo: GM, texto: "Argamassa de cimento e areia 1:3 em massa (juntas, assentamento e revestimento da alvenaria)", secao: "5.3.1; 5.3.2; 5.3.3 (5.1.3: 1:4)", tipo: "sim_nao" },
      // concreto
      D.itemFc({ id: "fc15", grupo: GC, texto: "Concreto fck ≥ 15 MPa (berço/base, cinta, fundo e paredes do PV) — exemplares aos 28 dias", secao: "5.3; 7.4" }),
      D.itemFc({ id: "fc11", grupo: GC, texto: "Concreto magro do lastro do PV fck ≥ 11 MPa — exemplares aos 28 dias", secao: "5.3.3; 7.4", se: pv, naoAplicaPor: "não é poço de visita" }),
      D.itemFc({ id: "fc22", grupo: GC, texto: "Concreto fck ≥ 22 MPa (grelha de concreto, lajes de cobertura e de redução) — exemplares aos 28 dias", secao: "5.3.2; 5.3.3; 7.4",
        se: function (P) { return pv(P) || grelhaConc(P); }, naoAplicaPor: "sem peça de 22 MPa" }),
      { id: "plano", grupo: GC, texto: "Plano de retirada de CPs e de amostras de aço, cimento e agregados estabelecido previamente", secao: "7.1", tipo: "sim_nao" },
      { id: "consist", grupo: GC, texto: "Consistência (NBR NM 67/68) na 1ª amassada do dia, após interrupção > 2 h, a cada moldagem de CPs e com variação de umidade dos agregados", secao: "7.1", tipo: "sim_nao" },
      { id: "ciclop", grupo: GC, texto: "Concreto ciclópico (30 % de pedra de mão), quando usado no berço, controlado pela DNER-ES 330", secao: "5.3.1; 7.2", tipo: "sim_nao", se: gal, naoAplicaPor: "não é galeria" },
      // galeria
      { id: "sobrelarg", grupo: GE, texto: "Sobrelargura da vala (largura − diâmetro externo da canalização)", secao: "5.3.1", tipo: "valor", unid: "m", casas: 2, min: 0.6, se: gal, naoAplicaPor: "não é galeria" },
      { id: "fundoGal", grupo: GE, texto: "Fundo da vala compactado mecanicamente até a resistência do projeto; material fraco substituído ou reforçado (pedra de mão/rachão)", secao: "5.3.1", tipo: "sim_nao", se: gal, naoAplicaPor: "não é galeria" },
      { id: "berco", grupo: GE, texto: "Tubulação assente em berço de concreto (área trafegável)", secao: "5.3.1", tipo: "sim_nao", se: function (P) { return gal(P) && P.trafegavel !== "nao"; }, naoAplicaPor: "fora de área trafegável" },
      { id: "assent", grupo: GE, texto: "Tubos nas cotas e alinhamento do projeto, bolsas a montante; juntas preenchidas e argamassa excedente removida do interior", secao: "5.3.1", tipo: "sim_nao", se: gal, naoAplicaPor: "não é galeria" },
      { id: "camadas", grupo: GE, texto: "Espessura das camadas do reaterro", secao: "5.3.1", tipo: "valor", unid: "cm", casas: 1, max: 15, se: gal, naoAplicaPor: "não é galeria" },
      { id: "altManual", grupo: GE, texto: "Altura sobre a geratriz superior em que começou a compactação mecânica (até ela, só manual)", secao: "5.3.1", tipo: "valor", unid: "cm", casas: 0, min: 60, se: gal, naoAplicaPor: "não é galeria" },
      // boca-de-lobo
      { id: "blBase", grupo: GE, texto: "Fundo compactado e base de concreto (15 MPa) sob a boca-de-lobo", secao: "5.3.2", tipo: "sim_nao", se: bl, naoAplicaPor: "não é boca-de-lobo" },
      { id: "blAlv", grupo: GE, texto: "Paredes de tijolo maciço recozido ou bloco de concreto, assentes e revestidas internamente com argamassa 1:3, desempenada e alisada", secao: "5.3.2", tipo: "sim_nao", se: bl, naoAplicaPor: "não é boca-de-lobo" },
      { id: "blGrelha", grupo: GE, texto: "Cinta de concreto (15 MPa) com quadro fixado; grelha nas dimensões e formas do projeto", secao: "5.3.2", tipo: "sim_nao", se: bl, naoAplicaPor: "não é boca-de-lobo" },
      // poço de visita
      { id: "pvCamara", grupo: GE, texto: "Lastro sobre fundo regularizado e compactado; câmara de trabalho com fôrmas, tubos convergentes, armaduras e concreto vibrado", secao: "5.3.3", tipo: "sim_nao", se: pv, naoAplicaPor: "não é poço de visita" },
      { id: "pvChamine", grupo: GE, texto: "Chaminé de tijolo maciço com argamassa 1:3 revestida internamente (ou anéis de concreto armado, NBR 9794); cinta, laje de redução e tampão de ferro fundido", secao: "5.3.3", tipo: "sim_nao", se: pv, naoAplicaPor: "não é poço de visita" },
      { id: "pvDegrau", grupo: GE, texto: "Degraus da escada de marinheiro de aço CA-25 Ø 16 mm chumbados à alvenaria", secao: "5.3.3", tipo: "sim_nao", se: pv, naoAplicaPor: "não é poço de visita" },
      { id: "pvEsp", grupo: GE, texto: "Espaçamento entre degraus da escada de marinheiro", secao: "5.3.3", tipo: "valor", unid: "cm", casas: 0, max: 30, se: pv, naoAplicaPor: "não é poço de visita" },
      { id: "geomConf", grupo: GE, texto: "Cotas, alinhamentos e dimensões conforme projeto / Notas de Serviço (levantamento topográfico e gabaritos)", secao: "4; 7.3", tipo: "sim_nao" },
      // acabamento
      { id: "acab", grupo: GA, texto: "Acabamento (visual) sem prejuízo à operação hidráulica; embasamento e enchimento das valas acompanhados", secao: "7.2", tipo: "sim_nao" },
      { id: "amb", grupo: GA, texto: "Manejo ambiental: excedente removido a local definido com a Fiscalização; proteção dos deságues; sem tráfego desnecessário; DNER-ISA 07", secao: "6", tipo: "sim_nao" },
    ],
    extra: function (ctx) {
      var P = ctx.P;
      D.avaliarFck(ctx, "fc15", 15, { modo: P.modo_fc15, cond: P.condPreparo, secao: "7.4" });
      D.avaliarFck(ctx, "fc11", 11, { modo: P.modo_fc11, cond: P.condPreparo, secao: "5.3.3; 7.4" });
      D.avaliarFck(ctx, "fc22", 22, { modo: P.modo_fc22, cond: P.condPreparo, secao: "7.4" });
      D.avaliarGeom(ctx, { secao: "7.3" });
      if (gal(P)) {
        var n = num(P.nTubos), nl = nLotes(P);
        if (!ok(n)) ctx.avisos.push("Informe o número de tubos da partida: a frequência dos ensaios dos tubos depende do número de lotes (7.1).");
        else {
          D.info(ctx, { id: "lotes", grupo: GM, criterio: "Lotes de tubos da partida", secao: "7.1", exigido: "lotes de 100 a 200 tubos; 4 tubos ensaiados por lote",
            resultado: fmt(n, 0) + " tubos → " + nl + " lote(s) de ≈ " + fmt(n / nl, 0) + " tubos", motivo: "exigidos " + 4 * nl + " tubos ensaiados (" + 2 * nl + " à permeabilidade e " + 2 * nl + " à compressão diametral e absorção)" });
          if (n < 100) ctx.avisos.push("Partida com " + fmt(n, 0) + " tubos (< 100): a ES forma lotes de 100 a 200 unidades — considerado 1 lote (7.1).");
        }
      }
    },
    notas: "Critérios da DNIT 030/2004-ES. fck,est pela ABNT NBR 12655 (a ES remete à NBR 12655): amostragem parcial (n ≥ 6) fck,est = 2(f1+…+fm−1)/(m−1) − fm, m = n/2, não menor que ψ6·f1; amostragem total fck,est = f1 (n ≤ 20) ou fi com i = 0,05n; caso excepcional (≤ 10 m³, 2 a 5 exemplares) fck,est = ψ6·f1. Tubos: lotes de 100 a 200 unidades (nº de lotes = ⌈tubos/200⌉), 4 tubos por lote. A ES não fixa as cargas mínimas de compressão diametral nem os limites de absorção e permeabilidade (remete às NBR): registre em cada ensaio de tubo se atende (S/N). Argamassa: a 5.1.3 indica 1:4, mas as seções de execução (5.3.1 a 5.3.3) mandam 1:3 — a ficha adota 1:3. Controle geométrico: |desvio| ≤ 1 % nas seções transversais e ± 10 % nas espessuras (7.3).",
    exemplos: [
      { nome: "Galeria de tubos de concreto em área trafegável — aceita", dados: function () {
        var d = { ident: { registro: "DPU-A-001", data: "2026-05-20", obra: "Obra A — travessia urbana BR-000", trecho: "Galeria Ø 0,80 m, PV-3 a PV-4", local: "Rua A" },
          params: { tipo: "galeria", disp: "Galeria Ø 0,80 m — PV-3 a PV-4 (48 m)", nTubos: "300", trafegavel: "sim", condPreparo: "B", modo_fc15: "excepcional" },
          fc15: [{ est: "berço — trecho 1", pos: "ex. 1", v: "19,6" }, { est: "berço — trecho 2", pos: "ex. 2", v: "21,0" }, { est: "berço — trecho 3", pos: "ex. 3", v: "20,3" }],
          sobrelarg: [{ est: "PV-3 + 10 m", v: "0,62" }, { est: "PV-3 + 30 m", v: "0,65" }],
          camadas: [{ est: "1ª camada", v: "14" }, { est: "2ª camada", v: "15" }, { est: "3ª camada", v: "13" }],
          altManual: [{ est: "PV-3 + 20 m", v: "62" }],
          geom: [
            { est: "PV-3 + 10 m", elem: "diâmetro interno do tubo", tipo: "D", proj: "0,800", med: "0,802" },
            { est: "PV-3 + 10 m", elem: "largura do berço", tipo: "D", proj: "1,20", med: "1,21" },
            { est: "PV-3 + 10 m", elem: "espessura do berço sob o tubo", tipo: "E", proj: "0,15", med: "0,16" }] };
        preencher(F, d, { perm: { atende: "S", real: "4" }, compr: { atende: "S", real: "4" }, absor: { atende: "S", real: "4" } });
        return d;
      } },
      { nome: "Poço de visita — rejeitado (laje de 22 MPa e escada de marinheiro)", dados: function () {
        var d = { ident: { registro: "DPU-B-002", data: "2026-06-11", obra: "Obra B — travessia urbana BR-000", trecho: "PV-7", local: "Rua B" },
          params: { tipo: "pv", disp: "Poço de visita PV-7 (câmara 1,20 × 1,20 m)", condPreparo: "B", modo_fc15: "excepcional", modo_fc11: "excepcional", modo_fc22: "excepcional" },
          fc15: [{ est: "fundo", pos: "ex. 1", v: "21,0" }, { est: "paredes", pos: "ex. 2", v: "20,4" }],
          fc11: [{ est: "lastro", pos: "ex. M1", v: "15,2" }, { est: "lastro", pos: "ex. M2", v: "15,0" }],
          fc22: [{ est: "laje de cobertura", pos: "ex. L1", v: "26,4" }, { est: "laje de redução", pos: "ex. L2", v: "27,8" }],
          pvEsp: [{ est: "degraus 1–2", v: "30" }, { est: "degraus 2–3", v: "29" }, { est: "degraus 5–6", v: "36" }],
          geom: [
            { est: "câmara", elem: "dimensão interna N–S", tipo: "D", proj: "1,20", med: "1,205" },
            { est: "câmara", elem: "dimensão interna L–O", tipo: "D", proj: "1,20", med: "1,19" },
            { est: "parede S", elem: "parede da câmara", tipo: "E", proj: "0,15", med: "0,14" }] };
        preencher(F, d);
        return d;
      } },
    ],
  });
  D.estender(F, { tabelas: function () { return [D.tabelaGeom({ unid: "m" })]; }, geom: ["geom"], fck: ["fc15", "fc11", "fc22"], semEstaca: true });
})();
