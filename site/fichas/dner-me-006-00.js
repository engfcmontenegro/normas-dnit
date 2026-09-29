/*
 * Ficha: DNER-ME 006/00 — Emulsões asfálticas — Determinação da sedimentação.
 * Registra-se no motor de site/fichas.js (window.FE). Estrutura igual à de site/fichas/dnit-450-2024-me.js.
 *
 * Duas provetas de 500 mL em repouso por 5 dias; resíduo por evaporação (2 h + 1 h a 163 °C) de ~50 g do topo e do
 * fundo de cada proveta; sedimentação (5 dias) = D − C, com C = média dos resíduos do topo e D = média dos do fundo (5.1).
 * Resíduo de cada béquer = (béquer + bastão + resíduo − béquer + bastão) / massa de emulsão × 100 — igual a 2 (A − B)
 * da seção 4.7 quando a massa de emulsão é exatamente 50 g.
 * Limites opcionais: DNIT 165/2013-EM (Tabela 1 do Anexo A — os mesmos de site/fichas/dnit-165-2013-em.js) e
 * DNIT 128/2010-EM (emulsões modificadas por polímero).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  // [chave, rótulo, máximo (% m/m)]
  var ESPEC = [["", "Sem comparação com especificação", null]]
    .concat(["RR-1C", "RR-2C", "RM-1C", "RM-2C", "RL-1C", "LA-1C", "LAN", "LARC"].map(function (c) { return [c, c + " — DNIT 165/2013-EM (máx. 5 %)", 5]; }))
    .concat([["EAI", "EAI — DNIT 165/2013-EM (máx. 10 %)", 10],
      ["E", "Emulsão modificada por polímero (RR1C-E, RR2C-E, RM1C-E, RC1C-E, RL1C-E) — DNIT 128/2010-EM (máx. 5 %)", 5],
      ["outro", "Outra — informar o máximo", null]]);
  function espec(P) { return ESPEC.filter(function (x) { return x[0] === (P.espec || ""); })[0] || ESPEC[0]; }
  // repetitividade (6.1) e reprodutibilidade (6.2): 0,4 / 0,8 % em massa até 1,0 %; acima, 5 % / 10 % do valor médio
  function tolRep(m) { return m <= 1 ? 0.4 : 0.05 * m; }
  function tolRepr(m) { return m <= 1 ? 0.8 : 0.10 * m; }
  function residuo(x) {
    var t = num(x.tara), em = num(x.emul), rs = num(x.res);
    var mEm = ok(t) && ok(em) ? em - t : NaN, mRes = ok(t) && ok(rs) ? rs - t : NaN;
    return { mEm: mEm, mRes: mRes, pct: ok(mEm) && ok(mRes) && mEm > 0 ? mRes / mEm * 100 : NaN };
  }
  var NOMES = ["Proveta 1 — topo", "Proveta 2 — topo", "Proveta 1 — fundo", "Proveta 2 — fundo"];

  FE.FICHAS["dner-me-006-00"] = {
    titulo: "Sedimentação de emulsões asfálticas",
    resumo: "Duas provetas de 500 mL em repouso por 5 dias; resíduo por evaporação a 163 °C de 50 g retirados do topo (primeiros ~55 mL) e do fundo (após retirar mais ~390 mL) de cada proveta; sedimentação = média dos resíduos do fundo − média dos resíduos do topo.",
    rotuloImportar: function (r) { return "sedimentação " + (ok(r.res) ? fmt(r.res, 1) + " %" : "—") + (r.conforme === false ? " · acima do máximo" : ""); },
    blocos: [],
    params: [
      { k: "material", r: "Emulsão", ph: "ex.: RR-2C, RR-1C, EAI" },
      { k: "espec", r: "Especificação para comparação — opcional", tipo: "select", recarrega: true, opcoes: ESPEC.map(function (x) { return [x[0], x[1]]; }),
        dica: "sedimentação máxima da Tabela 1 do Anexo A da DNIT 165/2013-EM ou da DNIT 128/2010-EM" },
      { k: "maximo", r: "Sedimentação máxima (% m/m)", se: function (d) { return (d.params || {}).espec === "outro"; } },
      { k: "inicio", r: "Data de enchimento das provetas", ph: "dd/mm/aaaa" },
      { k: "fim", r: "Data da retirada das amostras", ph: "dd/mm/aaaa", dica: "repouso de 5 dias à temperatura ambiente (4.3)" },
      { k: "outroLab", r: "Resultado de outro laboratório (%) — opcional", dica: "reprodutibilidade: 0,8 % até 1,0 %; acima, 10 % do valor médio (6.2)" },
    ],
    padrao: { espec: "" },
    tabelas: function () {
      return [{
        chave: "bq", titulo: "Resíduo por evaporação — topo e fundo das duas provetas", rotulo: "Béquer", iniciais: 4, min: 4, fixo: true, nomes: NOMES,
        dica: "pesagens com precisão de 0,1 g, béquer sempre com o bastão; estufa a (163 ± 3) °C por 2 h, agitar, mais 1 h, esfriar e pesar (4.5–4.6)",
        linhas: [
          { k: "n", r: "Béquer nº", u: "", texto: true },
          { k: "tara", r: "Béquer + bastão (tara)", u: "g" },
          { k: "emul", r: "Béquer + bastão + emulsão (~50 g, 4.5)", u: "g" },
          { k: "res", r: "Béquer + bastão + resíduo, após 163 °C (4.6)", u: "g" },
          { calc: "mEm", r: "Massa de emulsão", u: "g", casas: 1 },
          { calc: "pct", r: "Resíduo = resíduo / emulsão × 100 (4.7)", u: "%", casas: 2, destaque: true },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var bq = (d.bq || []).map(function (x, i) {
        var o = residuo(x);
        if (ok(o.mEm) && Math.abs(o.mEm - 50) > 0.5 + 1e-9) avisos.push(NOMES[i] + ": massa de emulsão de " + fmt(o.mEm, 1) + " g — a norma pede 50 g pesados com precisão de 0,1 g (4.5); a ficha calcula o resíduo com a massa real.");
        if (ok(o.pct) && (o.pct <= 0 || o.pct >= 100)) avisos.push(NOMES[i] + ": resíduo de " + fmt(o.pct, 1) + " % — confira as pesagens.");
        return o;
      });
      var p = bq.map(function (o) { return o.pct; });
      var C = media([p[0], p[1]]), D = media([p[2], p[3]]);
      var sed = ok(C) && ok(D) ? D - C : NaN;
      var s1 = ok(p[0]) && ok(p[2]) ? p[2] - p[0] : NaN, s2 = ok(p[1]) && ok(p[3]) ? p[3] - p[1] : NaN;
      [0, 1].forEach(function (k) {
        if ((ok(p[k]) || ok(p[k + 2])) && !(ok(p[k]) && ok(p[k + 2]))) avisos.push("Proveta " + (k + 1) + ": informe o resíduo do topo e o do fundo.");
      });
      if (ok(sed) && !(ok(p[0]) && ok(p[1]) && ok(p[2]) && ok(p[3]))) avisos.push("O ensaio usa duas provetas (4.2): C e D devem ser médias das duas.");
      // repetitividade entre as duas provetas (6.1)
      var dif = NaN, tol = NaN;
      if (ok(s1) && ok(s2)) {
        dif = Math.abs(s1 - s2); tol = tolRep(Math.abs((s1 + s2) / 2));
        if (dif > tol + 1e-9) avisos.push("As sedimentações das duas provetas (" + fmt(s1, 2) + " % e " + fmt(s2, 2) + " %) diferem de " + fmt(dif, 2) +
          " %, acima da repetitividade (" + fmt(tol, 2) + " %, 6.1): resultado suspeito.");
      }
      if (ok(sed) && sed < 0) avisos.push("Resíduo do topo maior que o do fundo (sedimentação negativa) — confira a identificação dos béqueres e as pesagens.");
      // repouso de 5 dias (4.3)
      var dias = NaN;
      var m1 = String(P.inicio || "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/), m2 = String(P.fim || "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (m1 && m2) {
        dias = Math.round((Date.UTC(+m2[3], +m2[2] - 1, +m2[1]) - Date.UTC(+m1[3], +m1[2] - 1, +m1[1])) / 86400000);
        if (dias !== 5) avisos.push("Repouso de " + dias + " dia(s) entre o enchimento e a retirada; a norma fixa 5 dias (4.3).");
      }
      var R = NaN, outro = num(P.outroLab);
      if (ok(sed) && ok(outro)) {
        R = Math.abs(sed - outro);
        var tR = tolRepr(Math.abs((sed + outro) / 2));
        if (R > tR + 1e-9) avisos.push("Diferença de " + fmt(R, 2) + " % em relação ao outro laboratório, acima da reprodutibilidade (" + fmt(tR, 2) + " %, 6.2).");
      }
      var E = espec(P), mx = E[0] === "outro" ? num(P.maximo) : E[2], res = Math.round(sed * 10 + 1e-9) / 10, conforme = null;
      if (ok(sed) && ok(mx)) {
        conforme = res <= mx + 1e-9;
        if (!conforme) avisos.unshift("Sedimentação de " + fmt(res, 1) + " %, acima do máximo de " + fmt(mx, 0) + " % (" + (E[0] === "outro" ? "especificação informada" : E[1].replace(/ \(máx.*$/, "")) + ").");
      }
      return { tab: { bq: bq }, resultados: { C: C, D: D, sed: sed, res: res, s1: s1, s2: s2, dif: dif, tol: tol, dias: dias, R: R, mx: mx, conforme: conforme, esp: E }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + fmt(r.res, 1) + ' <small>%</small></div><div class="fe-res-r">Sedimentação (5 dias) = D − C' +
        (ok(r.mx) ? " · máx. " + fmt(r.mx, 0) + " %" : "") + (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>') + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">C = ' + fmt(r.C, 2) + " % · D = " + fmt(r.D, 2) + ' %</div><div class="fe-res-r">Médias dos resíduos do topo (C) e do fundo (D)</div></div>' +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + fmt(r.s1, 2) + " % / " + fmt(r.s2, 2) + ' %</div><div class="fe-res-r">Sedimentação de cada proveta' +
        (ok(r.tol) ? " — diferença " + fmt(r.dif, 2) + " % (máx. " + fmt(r.tol, 2) + " %)" : "") + "</div></div></div>";
    },
    relatorio: {
      notas: "Resíduo de cada porção = massa do resíduo após 2 h + 1 h a (163 ± 3) °C / massa de emulsão × 100, que equivale a 2 (A − B) da seção 4.7 para 50 g de emulsão. " +
        "Sedimentação (5 dias) = D − C, com C = média dos resíduos do topo e D = média dos resíduos do fundo das duas provetas (5.1); resultado com uma casa decimal (adotado). " +
        "Repetitividade entre as provetas: 0,4 % até 1,0 % de sedimentação; acima, 5 % do valor médio (6.1). Reprodutibilidade: 0,8 % e 10 % (6.2).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Emulsão", P.material]);
        rows.push(["Sedimentação (5 dias)", ok(r.sed) ? fmt(r.res, 1) + " % (D − C = " + fmt(r.D, 2) + " − " + fmt(r.C, 2) + ")" : "—"]);
        if (r.conforme !== null) rows.push(["Especificação", "máx. " + fmt(r.mx, 0) + " % (" + r.esp[1].replace(/ \(máx.*$/, "") + ") — " + (r.conforme ? "ATENDE" : "NÃO ATENDE")]);
        rows.push(["Sedimentação por proveta", fmt(r.s1, 2) + " % e " + fmt(r.s2, 2) + " %" + (ok(r.tol) ? " — diferença " + fmt(r.dif, 2) + " % (máx. " + fmt(r.tol, 2) + " %)" : "")]);
        if (ok(r.dias)) rows.push(["Repouso", r.dias + " dia(s)"]);
        if (ok(r.R)) rows.push(["Comparação com outro laboratório", "diferença de " + fmt(r.R, 2) + " %"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "RR-2C — sedimentação dentro do limite", dados: function () {
        return { ident: { registro: "EX-SED-001", data: "2026-03-07", obra: "Unidade A — usina de asfalto", origem: "Distribuidora C", camada: "RR-2C — pintura de ligação" },
          params: { material: "RR-2C", espec: "RR-2C", inicio: "02/03/2026", fim: "07/03/2026" },
          bq: [{ n: "1", tara: "182,4", emul: "232,4", res: "213,6" }, { n: "2", tara: "178,9", emul: "228,9", res: "210,1" },
            { n: "3", tara: "185,1", emul: "235,1", res: "217,8" }, { n: "4", tara: "180,6", emul: "230,6", res: "213,3" }] };
      } },
      { nome: "EAI — imprimação, limite de 10 %", dados: function () {
        return { ident: { registro: "EX-SED-002", camada: "EAI — imprimação", origem: "Distribuidora C" },
          params: { material: "EAI", espec: "EAI", inicio: "03/11/2025", fim: "08/11/2025" },
          bq: [{ n: "5", tara: "176,2", emul: "226,2", res: "203,7" }, { n: "6", tara: "181,0", emul: "231,1", res: "208,4" },
            { n: "7", tara: "179,3", emul: "229,3", res: "210,1" }, { n: "8", tara: "183,8", emul: "233,8", res: "214,3" }] };
      } },
      { nome: "RR-1C — sedimentação acima de 5 %, provetas discordantes, repouso de 7 dias", dados: function () {
        return { ident: { registro: "EX-SED-003", camada: "RR-1C", origem: "Distribuidora B" },
          params: { material: "RR-1C", espec: "RR-1C", inicio: "01/04/2026", fim: "08/04/2026" },
          bq: [{ n: "1", tara: "182,4", emul: "232,5", res: "210,6" }, { n: "2", tara: "178,9", emul: "228,1", res: "208,1" },
            { n: "3", tara: "185,1", emul: "235,1", res: "219,4" }, { n: "4", tara: "180,6", emul: "230,6", res: "214,3" }] };
      } },
    ],
  };
})();
