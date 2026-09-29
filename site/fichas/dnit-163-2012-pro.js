/*
 * Ficha: DNIT 163/2012-PRO — Calibração do deflectógrafo Lacroix (antes de cada jornada de trabalho).
 * Registra-se em window.FE (usa FE.aceitacao para critérios e parecer).
 *
 * O que a PRO manda (seções do PDF):
 *   5.1 a–c viga baixada com mosquetes destravados, sem contato com o veículo; braços sem jogo lateral; comparador
 *           apoiado e nivelado sob o braço (eixo ou borda).
 *   5.1 d   comparador em "0": tensão do sensor entre −5,0 e −9,5 V e 1º pré-levantamento entre 1 e 15.
 *   5.1 e   comparador em 300 centésimos (3 voltas = 3,00 mm).
 *   5.2 a   verificação, feita duas vezes: 1º pré-levantamento "muito próximo de 5";
 *   5.2 b   comparador em passos: 5 → 10 ± 3; 10 → 15 ± 3; 100 → 105 ± 3; 200 → 205 ± 4; 300 → 305 ± 5.
 *   5.2 c   verificação reprovada: refazer a calibração (5.1 d) e a verificação.  5.2 d/e: repetir no outro lado.
 * Critério da ficha para "muito próximo de 5": |pré-levantamento − 5| ≤ 1 (a PRO não quantifica); os valores esperados
 * seguem a PRO ao pé da letra (5 + deslocamento), com a leitura inicial registrada à parte.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var ID = "dnit-163-2012-pro";
  var PASSOS = [[5, 10, 3], [10, 15, 3], [100, 105, 3], [200, 205, 4], [300, 305, 5]];  // [centésimos, esperado, tolerância]
  var NOMES = ["Eixo — verificação 1", "Eixo — verificação 2", "Borda — verificação 1", "Borda — verificação 2"];
  var SN = [["", "—"], ["sim", "Sim"], ["nao", "Não"]];
  var CHECK = [["mosq", "5.1 a", "Viga no solo, mosquetes destravados, sem contato com o veículo"], ["jogo", "5.1 b", "Braços da viga sem jogo lateral"],
    ["nivel", "5.1 c", "Comparador bem apoiado no solo e nivelado sob o braço"], ["trava", "5.1 d", "Travamento do sensor confirmado pelo sistema"]];

  function calcular(d) {
    var P = d.params || {}, avisos = [], linhas = [], tab = [], lados = { eixo: [], borda: [] };
    var G0 = "Preparação (5.1 a–d)", G1 = "Calibração e verificações (5.1 d–e / 5.2)";
    CHECK.forEach(function (c) {
      var v = P[c[0]], l = A.linha({ id: c[0], grupo: G0, criterio: c[2], secao: c[1], exigido: "sim", resultado: v === "sim" ? "sim" : v === "nao" ? "não" : "—", n: v ? 1 : 0 });
      if (v === "nao") A.marcar(l, "nao_conforme", "não atende"); else if (v !== "sim") A.marcar(l, "pendente", "não verificado");
      linhas.push(l);
    });
    (d.vf || []).forEach(function (c, i) {
      var o = {}, rot = NOMES[i] || "Verificação " + (i + 1), lado = i < 2 ? "eixo" : "borda";
      var ten = num(c.tensao), pc = num(c.pcal), p0 = num(c.p0);
      var algum = [ten, pc, p0].concat(PASSOS.map(function (p) { return num(c["s" + p[0]]); })).some(ok);
      o.dev = []; o.okT = !ok(ten) || (ten >= -9.5 - 1e-9 && ten <= -5.0 + 1e-9); o.okP = !ok(pc) || (pc >= 1 && pc <= 15);
      o.okP0 = !ok(p0) || Math.abs(p0 - 5) <= 1 + 1e-9;
      var foraPassos = [], faltam = 0;
      PASSOS.forEach(function (p) {
        var v = num(c["s" + p[0]]);
        o["d" + p[0]] = ok(v) ? v - p[1] : NaN;
        if (!ok(v)) faltam++;
        else if (Math.abs(v - p[1]) > p[2] + 1e-9) foraPassos.push(p[0] + " → " + fmt(v, 0) + " (esperado " + p[1] + " ± " + p[2] + ")");
      });
      tab.push({ d5: o.d5, d10: o.d10, d100: o.d100, d200: o.d200, d300: o.d300 });
      if (!algum) { lados[lado].push(null); return; }
      var l = A.linha({ id: "v" + i, grupo: G1, criterio: rot, secao: "5.1 d / 5.2 a–b", n: PASSOS.length - faltam,
        exigido: "tensão −5,0 a −9,5 V; 1º pré-lev. 1 a 15; inicial ≈ 5; passos ± 3/3/3/4/5",
        resultado: "tensão " + (ok(ten) ? fmt(ten, 2) + " V" : "—") + " · pré-lev. " + (ok(pc) ? fmt(pc, 0) : "—") + " · inicial " + (ok(p0) ? fmt(p0, 0) : "—") +
          " · 300 → " + (ok(num(c.s300)) ? fmt(num(c.s300), 0) : "—") });
      if (!o.okT) A.marcar(l, "nao_conforme", "tensão do sensor fora de −5,0 a −9,5 V (5.1 d)");
      if (!o.okP) A.marcar(l, "nao_conforme", "1º pré-levantamento da calibração fora de 1 a 15 (5.1 d)");
      if (!ok(ten) || !ok(pc)) A.marcar(l, "pendente", "registre a tensão e o 1º pré-levantamento (5.1 d)");
      if (!ok(p0)) A.marcar(l, "pendente", "registre o pré-levantamento inicial da verificação (5.2 a)");
      else if (!o.okP0) A.marcar(l, "ressalva", "pré-levantamento inicial " + fmt(p0, 0) + " — deveria ser muito próximo de 5 (critério da ficha: ± 1)");
      if (foraPassos.length) A.marcar(l, "nao_conforme", "fora da tolerância: " + foraPassos.join("; ") + " — refazer a calibração (5.2 c)");
      else if (faltam) A.marcar(l, "pendente", faltam + " passo(s) sem leitura");
      lados[lado].push(l.situacao);
      linhas.push(l);
    });
    ["eixo", "borda"].forEach(function (lado) {
      var feitas = lados[lado].filter(Boolean).length;
      if (feitas < 2) {
        var l = A.linha({ id: "n" + lado, grupo: G1, criterio: "Verificações do sensor da " + (lado === "eixo" ? "trilha interna (eixo)" : "trilha externa (borda)"), secao: "5.2 a / d",
          exigido: "2 verificações", resultado: feitas + " de 2", n: feitas });
        A.marcar(l, feitas ? "pendente" : "sem_dados", "a PRO pede duas verificações em cada lado");
        linhas.push(l);
      }
    });
    var par = A.parecer(linhas, [], { textos: {
      ACEITO: { titulo: "DEFLECTÓGRAFO CALIBRADO — PRONTO PARA A JORNADA", texto: "Calibração e duas verificações de cada sensor conforme a DNIT 163/2012-PRO (5.2 e)." },
      RESSALVA: { titulo: "DEFLECTÓGRAFO CALIBRADO COM RESSALVA", texto: "Tolerâncias atendidas; há pontos a documentar." },
      PENDENTE: { titulo: "CALIBRAÇÃO INCOMPLETA", texto: "Faltam verificações ou leituras." },
      REJEITADO: { titulo: "CALIBRAÇÃO NÃO ACEITA", texto: "Verificação fora da tolerância ou preparação não conforme: refazer a calibração (5.1 d) e as verificações (5.2 c)." } } });
    return { tab: { vf: tab }, resultados: { linhas: linhas, parecer: par }, avisos: avisos };
  }

  function colunas(v) {
    return v.map(function (x) { return { tensao: x[0], pcal: x[1], p0: x[2], s5: x[3], s10: x[4], s100: x[5], s200: x[6], s300: x[7] }; });
  }

  FE.FICHAS[ID] = {
    titulo: "Calibração do deflectógrafo Lacroix",
    lote: true,
    resumo: "Calibração de cada sensor (tensão −5,0 a −9,5 V, 1º pré-levantamento 1 a 15 — 5.1 d) e duas verificações por lado com o comparador em 5, 10, 100, 200 e 300 centésimos (10 ± 3, 15 ± 3, 105 ± 3, 205 ± 4, 305 ± 5 — 5.2 b), antes de cada jornada.",
    rotuloImportar: function (r) { return r.parecer ? r.parecer.parecer === "ACEITO" || r.parecer.parecer === "RESSALVA" ? "calibrado" : r.parecer.parecer.toLowerCase() : "—"; },
    blocos: [],
    params: [
      { k: "equip", r: "Deflectógrafo (identificação)", ph: "ex.: Deflectógrafo A — caminhão 01" },
      { k: "software", r: "Programa de operação", ph: "Deflectographe 98" },
      { k: "tecA", r: "Técnico A (cabine)" },
      { k: "tecB", r: "Técnico B (viga e comparador)" },
    ].concat(CHECK.map(function (c) { return { k: c[0], r: c[2] + " (" + c[1] + ")", tipo: "select", opcoes: SN }; })),
    padrao: { software: "Deflectographe 98" },
    tabelas: function () {
      var L = [{ grupo: "Calibração (5.1 d)" }, { k: "tensao", r: "Tensão do sensor com o comparador em 0", u: "V", ph: "−5,0 a −9,5" }, { k: "pcal", r: "1º pré-levantamento na calibração", u: "", ph: "1 a 15" },
        { grupo: "Verificação (5.2 a–b)" }, { k: "p0", r: "Pré-levantamento inicial (comparador em 0)", u: "", ph: "≈ 5" }];
      PASSOS.forEach(function (p) { L.push({ k: "s" + p[0], r: "Comparador em " + p[0] + " centésimos — leitura (esperado " + p[1] + " ± " + p[2] + ")", u: "" }); });
      PASSOS.forEach(function (p) { L.push({ calc: "d" + p[0], r: "Desvio no passo " + p[0], u: "", casas: 0 }); });
      return [{ chave: "vf", titulo: "Verificações — sensor do eixo (trilha interna) e da borda (trilha externa)", rotulo: "Verificação", iniciais: 4, min: 4, fixo: true, nomes: NOMES, linhas: L,
        dica: "tensão e 1º pré-levantamento da calibração (ou recalibração) que antecede cada verificação" }];
    },
    calcular: calcular,
    resultadosHtml: function (calc) { var r = calc.resultados; return A.htmlParecer(r.parecer) + A.htmlCriterios(r.linhas, { estilo: "resultado" }); },
    relatorio: {
      notas: "DNIT 163/2012-PRO: tensão do sensor −5,0 a −9,5 V e 1º pré-levantamento 1 a 15 com o comparador em 0 (5.1 d); verificação em duplicata por lado com pré-levantamento inicial ≈ 5 e leituras em 5, 10, 100, 200 e 300 centésimos dentro de 10 ± 3, 15 ± 3, 105 ± 3, 205 ± 4 e 305 ± 5 (5.2 b). \"Muito próximo de 5\": ± 1 (critério da ficha).",
      resultados: function (calc, d) { return [["Parecer", calc.resultados.parecer.titulo], ["Equipamento", (d.params || {}).equip || "—"]]; },
      extraHtml: function (calc) { var r = calc.resultados; return A.htmlParecer(r.parecer, { relat: true }) + A.htmlCriterios(r.linhas, { relat: true, estilo: "resultado" }); },
    },
    exemplos: [
      { nome: "Calibração do início da jornada — eixo e borda aprovados", dados: function () {
        return { ident: { registro: "CAL-LX-01", data: "2026-08-17", obra: "Obra A", trecho: "BR-000 — km 10 a 60" },
          params: { equip: "Deflectógrafo A", software: "Deflectographe 98", tecA: "Técnico A", tecB: "Técnico B", mosq: "sim", jogo: "sim", nivel: "sim", trava: "sim" },
          vf: colunas([["-7,2", "6", "5", "10", "15", "104", "205", "303"], ["-7,2", "5", "5", "11", "16", "106", "206", "307"],
            ["-6,8", "8", "5", "9", "14", "105", "203", "304"], ["-6,8", "4", "6", "11", "16", "106", "207", "308"]]) };
      } },
      { nome: "Borda fora da tolerância em 300 centésimos e tensão fora da faixa — recalibrar", dados: function () {
        return { ident: { registro: "CAL-LX-02", data: "2026-08-18", obra: "Obra A" },
          params: { equip: "Deflectógrafo A", software: "Deflectographe 98", mosq: "sim", jogo: "sim", nivel: "sim", trava: "sim" },
          vf: colunas([["-7,0", "5", "5", "10", "15", "105", "204", "305"], ["-7,0", "5", "5", "10", "15", "104", "204", "304"],
            ["-4,6", "17", "8", "13", "19", "110", "212", "314"], ["", "", "", "", "", "", "", ""]]) };
      } },
    ],
  };
})();
