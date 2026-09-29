/*
 * Ficha: DNER-ME 247/94 — Material termoplástico — Ponto de amolecimento (anel e bola).
 * Registra-se no motor de site/fichas.js (window.FE); usa o código comum de FE.sinalizacao2 (dner-me-011-94.js).
 *
 * Banho de glicerina USP, início a (25 ± 1) °C, aquecimento a (5 ± 0,5) °C/min a partir de ~32 °C (6.3 a 6.6).
 * Duplicata: diferença > 1 °C → repetir o ensaio (6.8). Resultado = média da duplicata, com aproximação de 0,5 °C (7).
 * Reprodutibilidade: resultados de dois laboratórios suspeitos se diferirem mais de 2 °C (7.2).
 * Limite opcional: DNER-EM 372/2000, 5.4 — 80 °C a 110 °C.
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao2, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var ESPEC = [["372", "DNER-EM 372/2000 — ponto de amolecimento de 80 °C a 110 °C (5.4)", 80, 110, "DNER-EM 372/2000, 5.4"]];
  var COND = [
    { k: "glic", r: "Altura da glicerina no bécher (6.1 — 102 a 108 mm)", u: "mm", min: 102, max: 108, casas: 0 },
    { k: "tIni", r: "Temperatura inicial do banho (6.3 — 25 ± 1 °C)", u: "°C", min: 24, max: 26, casas: 1 },
    { k: "resfr", r: "Resfriamento dos anéis cheios (5.6 — mín. 30 min)", u: "min", min: 30, casas: 0 },
    { k: "fusao", r: "Tempo de aquecimento para fundir a amostra (5.3 — máx. 30 min)", u: "min", max: 30, casas: 0 },
    { k: "tTotal", r: "Tempo entre o enchimento dos anéis e o fim do ensaio (5.10 — máx. 240 min)", u: "min", max: 240, casas: 0 },
  ];

  FE.FICHAS["dner-me-247-94"] = {
    titulo: "Material termoplástico — ponto de amolecimento (anel e bola)",
    resumo: "Anéis cheios com o termoplástico fundido, banho de glicerina a (25 ± 1) °C, aquecimento a (5 ± 0,5) °C/min; temperatura quando o material que envolve cada bola toca a placa inferior (25,4 mm abaixo); duplicata com diferença ≤ 1 °C; resultado = média, com aproximação de 0,5 °C.",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: termoplástico branco" },
      { k: "taxa", r: "Velocidade de aquecimento (6.5, 6.6)", tipo: "select",
        opcoes: [["ok", "Mantida em 5 ± 0,5 °C/min após os 3 min iniciais"], ["nao", "Não foi possível manter 5 ± 0,5 °C/min"]],
        dica: "não tirar a média da velocidade; se não conseguir ajustá-la, abandonar o ensaio (6.6)" },
    ].concat(COND.map(function (c) { return { k: c.k, r: c.r + " — registrado" }; }),
      [{ k: "outroLab", r: "Resultado de outro laboratório (°C) — opcional", dica: "reprodutibilidade: suspeitos se diferirem mais de 2 °C (7.2)" }],
      S.paramsLimite(ESPEC, "°C", "DNER-EM 372/2000 (5.4)")),
    padrao: { taxa: "ok", espec: "" },
    tabelas: function () {
      return [{
        chave: "ens", titulo: "Ensaios (duplicata)", rotulo: "Ensaio", iniciais: 1, min: 1,
        dica: "temperatura lida no instante em que o material que envolve a esfera toca a placa inferior, sem correção de haste emergente (6.7); acrescente um ensaio quando a duplicata diferir mais de 1 °C",
        linhas: [
          { k: "t1", r: "Temperatura — anel e bola 1 (6.7)", u: "°C" },
          { k: "t2", r: "Temperatura — anel e bola 2 (6.7)", u: "°C" },
          { calc: "dif", r: "Diferença da duplicata (máx. 1 °C, 6.8)", u: "°C", casas: 1 },
          { calc: "media", r: "Média da duplicata (7)", u: "°C", casas: 2, destaque: true },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      if (P.taxa === "nao") avisos.push("Velocidade de aquecimento fora de 5 ± 0,5 °C/min: o ensaio deve ser abandonado (6.6).");
      COND.forEach(function (c) { var a = S.condicao(c, num(P[c.k])); if (a) avisos.push(a); });
      var ens = (d.ens || []).map(function (x, i) {
        var t1 = num(x.t1), t2 = num(x.t2);
        var o = { dif: ok(t1) && ok(t2) ? Math.abs(t1 - t2) : NaN, media: ok(t1) && ok(t2) ? (t1 + t2) / 2 : NaN };
        o.valido = ok(o.dif) && o.dif <= 1 + 1e-9;
        if (ok(o.dif) && !o.valido) avisos.push("Ensaio " + (i + 1) + ": a duplicata difere " + fmt(o.dif, 1) + " °C (máx. 1 °C) — repetir o ensaio (6.8, 7.1).");
        if ((ok(t1) || ok(t2)) && !(ok(t1) && ok(t2))) avisos.push("Ensaio " + (i + 1) + ": informe as duas temperaturas (determinação em duplicata, 7).");
        return o;
      });
      var validos = ens.filter(function (o) { return o.valido; }), ult = validos.length ? validos[validos.length - 1] : null;
      var exato = ult ? ult.media : NaN, pa = ok(exato) ? Math.round(exato * 2 + 1e-9) / 2 : NaN;
      if (P.taxa === "nao") pa = NaN;
      if (ens.some(function (o) { return ok(o.media); }) && !ult) avisos.push("Nenhuma duplicata com diferença ≤ 1 °C: não há resultado — repita o ensaio.");
      var R = NaN, outro = num(P.outroLab);
      if (ok(pa) && ok(outro)) {
        R = Math.abs(pa - outro);
        if (R > 2 + 1e-9) avisos.push("Diferença de " + fmt(R, 1) + " °C em relação ao outro laboratório: resultados suspeitos (reprodutibilidade 2 °C, 7.2).");
      }
      var lim = S.limite(P, ESPEC), conf = S.confere(pa, lim);
      if (conf === false) avisos.unshift("Ponto de amolecimento de " + fmt(pa, 1) + " °C, fora do limite de " + S.textoLim(lim, 0, "°C") + " (" + lim.ref + ").");
      return { tab: { ens: ens }, resultados: { pa: pa, exato: exato, nValidos: validos.length, R: R, lim: lim, conforme: conf }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res">' + S.card((ok(r.pa) ? fmt(r.pa, 1) : "—") + " <small>°C</small>",
        "Ponto de amolecimento" + (ok(r.exato) ? " (média " + fmt(r.exato, 2) + " °C, aproximação de 0,5 °C)" : "") +
        (r.lim ? " · limite " + esc(S.textoLim(r.lim, 0, "°C")) + S.sit(r.conforme) : ""), true) +
        S.card(String(r.nValidos), "Duplicata(s) válida(s) — diferença ≤ 1 °C" + (ok(r.R) ? " · outro laboratório: " + fmt(r.R, 1) + " °C (R = 2 °C)" : "")) + "</div>";
    },
    relatorio: {
      notas: "Ponto de amolecimento = média das temperaturas da determinação em duplicata, com aproximação de 0,5 °C (7); diferença entre as duas superior a 1 °C: repetir o ensaio (6.8); o resultado é o da última duplicata válida. " +
        "Banho de glicerina USP iniciado a (25 ± 1) °C, aquecimento a (5 ± 0,5) °C/min (6.3 a 6.6). Repetibilidade 1 °C e reprodutibilidade 2 °C (7.1, 7.2).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Ponto de amolecimento (anel e bola, glicerina)", ok(r.pa) ? fmt(r.pa, 1) + " °C" : "—"]);
        rows.push(["Duplicatas válidas", String(r.nValidos)]);
        if (ok(r.R)) rows.push(["Comparação com outro laboratório", "diferença de " + fmt(r.R, 1) + " °C (R = 2 °C)"]);
        if (r.lim) rows.push(["Especificação", S.textoLim(r.lim, 0, "°C") + " (" + r.lim.ref + ")" + S.sitTxt(r.conforme)]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Termoplástico branco — 1ª duplicata discordante, repetida (97,5 °C)", dados: function () {
        return { ident: { registro: "EX-TP247-01", data: "2026-04-10", obra: "Obra A", local: "Partida 115", origem: "Fornecedor D", camada: "Termoplástico branco (extrusão)" },
          params: { material: "Termoplástico branco", taxa: "ok", glic: "105", tIni: "25", resfr: "30", fusao: "25", tTotal: "150", espec: "372" },
          ens: [{ t1: "96,5", t2: "98,0" }, { t1: "97,2", t2: "97,9" }] };
      } },
      { nome: "Termoplástico amarelo — ponto de amolecimento abaixo de 80 °C (reprovado)", dados: function () {
        return { ident: { registro: "EX-TP247-02", data: "2026-04-11", obra: "Obra B", local: "Partida 88", origem: "Fornecedor E", camada: "Termoplástico amarelo (aspersão)" },
          params: { material: "Termoplástico amarelo", taxa: "ok", glic: "104", tIni: "25,5", resfr: "30", fusao: "35", tTotal: "180", outroLab: "78,0", espec: "372" },
          ens: [{ t1: "75,0", t2: "75,5" }] };
      } },
    ],
  };
  window.FE.FICHAS["dner-me-247-94"].rotuloImportar = function (r) { return "PA " + window.FE.fmt(r.pa, 1) + " °C"; };
})();
