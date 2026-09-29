/*
 * Ficha: DNIT 037/2004-ME — Pavimento rígido — Água para amassamento do concreto — Ensaios comparativos.
 * Tempos de pega (pasta, NBR 11580/11581) e resistência à compressão (argamassa, NBR 7215) com a água em exame
 * e com a água de referência: diferenças de pega em h:min (6.1) e relação de resistências em % (6.2).
 * Critérios de aceitação da especificação de serviço (DNIT 047/048/049/065/068-ES ou DNIT 117/2009-ES).
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var NCP = 4;  // NBR 7215: quatro corpos de prova por idade
  function r1(x) { return ok(x) ? Math.round(x * 10) / 10 : NaN; }

  // "2:35", "2h35", "2h", "155 min", "155" (minutos) -> minutos
  function minutos(s) {
    s = String(s || "").trim().toLowerCase();
    if (!s) return NaN;
    var m = s.match(/^(\d+)\s*[:h]\s*(\d{1,2})?\s*(min)?$/);
    if (m) return +m[1] * 60 + (m[2] ? +m[2] : 0);
    var n = num(s.replace(/\s*min$/, ""));
    return ok(n) ? n : NaN;
  }
  function hmin(x, sinal) {
    if (!ok(x)) return "—";
    var a = Math.round(Math.abs(x)), h = Math.floor(a / 60), mm = a % 60;
    return (sinal ? (x > 0 ? "+" : x < 0 ? "−" : "±") : "") + h + ":" + (mm < 10 ? "0" : "") + mm;
  }
  // média e desvio relativo máximo (NBR 7215): DRM > 6 % -> descarta o valor mais afastado e recalcula
  function mediaDRM(vals) {
    var v = vals.filter(ok);
    if (!v.length) return { med: NaN, drm: NaN, n: 0 };
    var m = media(v), drm = Math.max.apply(null, v.map(function (x) { return Math.abs(x - m) / m * 100; }));
    var o = { med: m, drm: drm, n: v.length, drm0: drm };
    if (drm > 6 && v.length >= 3) {
      var pior = v.reduce(function (a, b) { return Math.abs(b - m) > Math.abs(a - m) ? b : a; });
      var w = v.slice(); w.splice(w.indexOf(pior), 1);
      var m2 = media(w), drm2 = Math.max.apply(null, w.map(function (x) { return Math.abs(x - m2) / m2 * 100; }));
      o = { med: m2, drm: drm2, n: w.length, drm0: drm, descartado: pior };
    }
    return o;
  }
  var CRIT = {
    "047": "DNIT 047/048/049/065/068-ES: início de pega diferindo no máximo ± 30 min; resistência ≥ 85 % da obtida com a água de referência",
    "117": "DNIT 117/2009-ES: início de pega ≥ referência − 30 min; fim de pega ≤ referência + 30 min; redução de resistência ≤ 10 % aos 7 e 28 dias",
  };

  FE.FICHAS["dnit-037-2004-me"] = {
    titulo: "Água de amassamento do concreto — Ensaios comparativos (pega e resistência)",
    rotuloImportar: function (r) { return "pega Δ " + (ok(r.dIni) ? r.dIni : "—") + " / " + (ok(r.dFim) ? r.dFim : "—") + " min" + (r.atende === true ? " · satisfatória" : r.atende === false ? " · não satisfatória" : ""); },
    resumo: "Pastas (NBR 11580/11581) e argamassas (NBR 7215) preparadas com a água de referência e com a água em exame. Pega: diferença exame − referência em h:min, (+) aumento e (−) diminuição (6.1). Resistência: exame / referência × 100 (%) (6.2).",
    blocos: [],
    params: [
      { k: "agua", r: "Água em exame — procedência", ph: "ex.: poço, açude, caminhão-pipa" },
      { k: "ref", r: "Água de referência (3)", ph: "água destilada" },
      { k: "cimento", r: "Cimento (5.1.1 — atende à DNIT 050-EM)", ph: "ex.: CP II-F-32" },
      { k: "aguaPasta", r: "Água da pasta de consistência normal, com a água de referência (5.3 — NBR 11580)", ph: "ex.: 28,5 %" },
      { k: "crit", r: "Critério de aceitação", tipo: "select",
        opcoes: [["047", "DNIT 047/048/049/065/068-ES — pega ± 30 min; resistência ≥ 85 %"],
          ["117", "DNIT 117/2009-ES — início ≥ ref − 30 min; fim ≤ ref + 30 min; resistência ≥ 90 % aos 7 e 28 d"],
          ["nenhum", "Não comparar"]],
        dica: "a DNIT 037 só define o método; os critérios são da especificação de serviço" },
    ],
    padrao: { ref: "água destilada", crit: "047" },
    tabelas: function (d) {
      if (Array.isArray(d.pega)) { while (d.pega.length < 2) d.pega.push({}); d.pega.length = 2; }
      var rc = [{ k: "idade", r: "Idade de ruptura", u: "dias" }, { grupo: "Argamassa com água de referência — NBR 7215" }];
      for (var i = 1; i <= NCP; i++) rc.push({ k: "r" + i, r: "CP " + i + " — referência", u: "MPa" });
      rc.push({ calc: "refMed", r: "Média — referência", u: "MPa", casas: 1 }, { calc: "refDRM", r: "Desvio relativo máximo — referência", u: "%", casas: 1 },
        { grupo: "Argamassa com água em exame — NBR 7215" });
      for (i = 1; i <= NCP; i++) rc.push({ k: "e" + i, r: "CP " + i + " — em exame", u: "MPa" });
      rc.push({ calc: "exMed", r: "Média — em exame", u: "MPa", casas: 1 }, { calc: "exDRM", r: "Desvio relativo máximo — em exame", u: "%", casas: 1 },
        { calc: "rel", r: "Exame / referência × 100 (6.2)", u: "%", casas: 1, destaque: true });
      return [
        { chave: "pega", titulo: "Tempos de pega (5.3 — NBR 11581)", rotulo: "Pasta", iniciais: 2, min: 2, fixo: true,
          nomes: ["Água de referência", "Água em exame"], dica: "tempos contados do contato da água com o cimento, em h:min (ex.: 2:35) ou em minutos",
          linhas: [
            { k: "ini", r: "Início de pega", u: "h:min", texto: true, ph: "2:35" },
            { k: "fim", r: "Fim de pega", u: "h:min", texto: true, ph: "3:40" },
            { calc: "iniM", r: "Início de pega", u: "min", casas: 0 },
            { calc: "fimM", r: "Fim de pega", u: "min", casas: 0 },
          ] },
        { chave: "rc", titulo: "Resistência à compressão das argamassas (5.4 — NBR 7215)", rotulo: "Idade", iniciais: 2, min: 1, linhas: rc,
          dica: "uma coluna por idade; resistência de cada corpo de prova (Ø 50 × 100 mm) em MPa" },
      ];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], crit = CRIT[P.crit] ? P.crit : null;
      var pega = (d.pega || []).map(function (x) { return { iniM: minutos(x.ini), fimM: minutos(x.fim) }; });
      var R = pega[0] || {}, E = pega[1] || {};
      var dIni = ok(R.iniM) && ok(E.iniM) ? E.iniM - R.iniM : NaN, dFim = ok(R.fimM) && ok(E.fimM) ? E.fimM - R.fimM : NaN;
      pega.forEach(function (o, i) {
        var nome = i ? "Água em exame" : "Água de referência";
        if (ok(o.iniM) && ok(o.fimM) && o.fimM <= o.iniM) avisos.push(nome + ": fim de pega não posterior ao início — confira.");
      });
      (d.pega || []).forEach(function (x, i) {
        ["ini", "fim"].forEach(function (k) { if (String(x[k] || "").trim() && !ok(minutos(x[k]))) avisos.push((i ? "Água em exame" : "Água de referência") + ": tempo \"" + x[k] + "\" não reconhecido — use h:min (2:35) ou minutos."); });
      });
      var rc = (d.rc || []).map(function (x, j) {
        var ref = [], ex = [];
        for (var i = 1; i <= NCP; i++) { ref.push(num(x["r" + i])); ex.push(num(x["e" + i])); }
        var a = mediaDRM(ref), b = mediaDRM(ex), idade = num(x.idade), rot = ok(idade) ? idade + " dias" : "idade " + (j + 1);
        var o = { idade: idade, rot: rot, refMed: r1(a.med), refDRM: a.drm, exMed: r1(b.med), exDRM: b.drm, nRef: a.n, nEx: b.n };
        o.rel = ok(o.refMed) && ok(o.exMed) && o.refMed > 0 ? o.exMed / o.refMed * 100 : NaN;  // médias com 0,1 MPa (NBR 7215)
        [[a, "de referência"], [b, "em exame"]].forEach(function (q) {
          var s = q[0];
          if (!s.n) return;
          if (s.n < 3 || (s.descartado === undefined && s.n < NCP)) avisos.push(rot + " — argamassa com água " + q[1] + ": " + s.n + " CP(s); a NBR 7215 rompe quatro por idade.");
          if (s.descartado !== undefined) {
            avisos.push(rot + " — argamassa com água " + q[1] + ": desvio relativo máximo de " + fmt(s.drm0, 1) + " % > 6 % — descartado o CP de " + fmt(s.descartado, 1) + " MPa; nova média " + fmt(s.med, 1) + " MPa (NBR 7215)." +
              (s.drm > 6 ? " O desvio continua acima de 6 % (" + fmt(s.drm, 1) + " %) — refaça o ensaio nessa idade." : ""));
          }
        });
        return o;
      });
      // critérios
      var checks = [];
      if (crit === "047") {
        if (ok(dIni)) checks.push({ item: "Início de pega (exame − referência)", val: hmin(dIni, true), lim: "± 0:30", ok: Math.abs(dIni) <= 30 });
        rc.forEach(function (o) { if (ok(o.rel)) checks.push({ item: "Resistência aos " + o.rot, val: fmt(o.rel, 1) + " %", lim: "≥ 85 %", ok: Math.round(o.rel * 10) / 10 >= 85 }); });
      } else if (crit === "117") {
        if (ok(dIni)) checks.push({ item: "Início de pega (exame − referência)", val: hmin(dIni, true), lim: "≥ −0:30", ok: dIni >= -30 });
        if (ok(dFim)) checks.push({ item: "Fim de pega (exame − referência)", val: hmin(dFim, true), lim: "≤ +0:30", ok: dFim <= 30 });
        rc.forEach(function (o) { if (ok(o.rel)) checks.push({ item: "Resistência aos " + o.rot + " (redução ≤ 10 %)", val: fmt(o.rel, 1) + " %", lim: "≥ 90 %", ok: Math.round(o.rel * 10) / 10 >= 90 }); });
        [7, 28].forEach(function (id) { if (!rc.some(function (o) { return o.idade === id && ok(o.rel); })) avisos.push("DNIT 117-ES: falta a comparação de resistência aos " + id + " dias."); });
      }
      checks.filter(function (c) { return !c.ok; }).forEach(function (c) { avisos.push(c.item + ": " + c.val + " — não atende (" + c.lim + ")."); });
      var atende = checks.length ? checks.every(function (c) { return c.ok; }) : null;
      return { tab: { pega: pega, rc: rc }, resultados: { dIni: dIni, dFim: dFim, R: R, E: E, rc: rc, checks: checks, atende: atende, crit: crit }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      var itens = '<div class="fe-res">' +
        '<div class="fe-res-item"><div class="fe-res-v">' + hmin(r.dIni, true) + '</div><div class="fe-res-r">Início de pega: exame − referência (h:min) · ' + hmin(r.E.iniM) + " × " + hmin(r.R.iniM) + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v">' + hmin(r.dFim, true) + '</div><div class="fe-res-r">Fim de pega: exame − referência (h:min) · ' + hmin(r.E.fimM) + " × " + hmin(r.R.fimM) + "</div></div>" +
        r.rc.map(function (o) {
          return '<div class="fe-res-item"><div class="fe-res-v">' + fmt(o.rel, 1) + ' <small>%</small></div><div class="fe-res-r">Resistência aos ' + esc(o.rot) + ": " + fmt(o.exMed, 1) + " / " + fmt(o.refMed, 1) + " MPa</div></div>";
        }).join("") + "</div>";
      var tab = r.checks.length ? '<table class="fe-resumo"><thead><tr><th>Verificação</th><th>Resultado</th><th>Critério</th><th>Situação</th></tr></thead><tbody>' +
        r.checks.map(function (c) { return "<tr><td>" + esc(c.item) + "</td><td>" + esc(c.val) + "</td><td>" + esc(c.lim) + "</td><td>" + (c.ok ? '<span class="fe-ok">atende</span>' : '<span class="fe-nok">não atende</span>') + "</td></tr>"; }).join("") +
        "</tbody></table>" : "";
      var sit = r.atende === null ? "" : '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (r.atende ? '<span class="fe-ok">água satisfatória</span>' : '<span class="fe-nok">água não satisfatória</span>') +
        '</div><div class="fe-res-r">' + esc(CRIT[r.crit]) + "</div></div></div>";
      return itens + tab + sit;
    },
    relatorio: {
      notas: "Pasta de consistência normal com a quantidade de água determinada com a água de referência (NBR 11580) e tempos de pega pela NBR 11581, para as duas águas (5.3). Argamassas de cimento e areia normal pela NBR 7215 (5.4): média de quatro corpos de prova por idade; desvio relativo máximo acima de 6 % → descarta-se o valor mais afastado e recalcula-se a média (NBR 7215). Resultados: pega = exame − referência, em h:min, (+) aumento e (−) diminuição (6.1); resistência = exame / referência, em % (6.2 — omitido na transcrição em markdown, presente no PDF, p. 3). Critérios da especificação de serviço escolhida.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.agua) rows.push(["Água em exame", P.agua]);
        rows.push(["Início de pega — exame × referência", hmin(r.E.iniM) + " × " + hmin(r.R.iniM) + " → " + hmin(r.dIni, true)]);
        rows.push(["Fim de pega — exame × referência", hmin(r.E.fimM) + " × " + hmin(r.R.fimM) + " → " + hmin(r.dFim, true)]);
        r.rc.forEach(function (o) { rows.push(["Resistência aos " + o.rot + " — exame / referência", fmt(o.exMed, 1) + " / " + fmt(o.refMed, 1) + " MPa = " + fmt(o.rel, 1) + " %"]); });
        r.checks.forEach(function (c) { rows.push([c.item, c.val + " (" + c.lim + ") — " + (c.ok ? "atende" : "NÃO ATENDE")]); });
        if (r.atende !== null) rows.push(["Conclusão (" + (r.crit === "117" ? "DNIT 117-ES" : "DNIT 047-ES") + ")", r.atende ? "água satisfatória" : "ÁGUA NÃO SATISFATÓRIA"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Poço tubular — pega +0:15 e resistências ≥ 95 % (satisfatória)", dados: function () {
        return { ident: { registro: "EX-AC-001", obra: "Obra A", trecho: "BR-000", camada: "Água de amassamento — pavimento de concreto", data: "2025-05-12" },
          params: { agua: "Poço tubular da central de concreto", ref: "água destilada", cimento: "CP II-F-32 (Fornecedor A)", aguaPasta: "28,5 %", crit: "047" },
          pega: [{ ini: "2:35", fim: "3:40" }, { ini: "2:50", fim: "4:00" }],
          rc: [{ idade: "7", r1: "24,1", r2: "24,8", r3: "25,3", r4: "24,5", e1: "23,6", e2: "24,2", e3: "23,9", e4: "24,4" },
            { idade: "28", r1: "33,2", r2: "34,0", r3: "33,6", r4: "32,9", e1: "32,4", e2: "33,1", e3: "31,9", e4: "32,8" }] };
      } },
      { nome: "Água de açude — pega retardada 0:50 e resistência de 82 % aos 7 d (não satisfatória); CP discrepante", dados: function () {
        return { ident: { registro: "EX-AC-002", obra: "Obra B", camada: "Água de amassamento — fonte alternativa", data: "2025-08-18" },
          params: { agua: "Açude próximo ao canteiro", ref: "água destilada", cimento: "CP II-Z-32", aguaPasta: "27,0 %", crit: "047" },
          pega: [{ ini: "2:40", fim: "3:50" }, { ini: "3:30", fim: "4:55" }],
          rc: [{ idade: "7", r1: "24,6", r2: "25,2", r3: "24,9", r4: "25,5", e1: "19,8", e2: "20,5", e3: "20,1", e4: "21,0" },
            { idade: "28", r1: "33,2", r2: "34,0", r3: "29,1", r4: "33,6", e1: "29,4", e2: "30,2", e3: "29,8", e4: "28,9" }] };
      } },
    ],
  };
})();
