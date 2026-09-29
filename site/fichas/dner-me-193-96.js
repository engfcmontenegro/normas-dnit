/*
 * Ficha: DNER-ME 193/96 — Materiais betuminosos líquidos e semissólidos — Densidade e massa específica (picnômetro).
 * Registra-se no motor de site/fichas.js (window.FE). Estrutura igual à de site/fichas/dnit-450-2024-me.js.
 *
 * Densidade a 25/25 °C ou 15,6/15,6 °C: líquido Dl = (c − a) / (b − a) (10.1.1); semissólido
 * Ds = (d − a) / [(b − a) − (e − d)] (10.1.2); massa específica = densidade × Ma (10.1.3, Nota 4).
 * Resultado = média de duas determinações, na terceira casa decimal (10.2.1); repetibilidade 0,002 (25 °C) / 0,003 (15,6 °C).
 * Limite opcional: DNER-EM 364/97 (alcatrões, densidade a 25/25 °C mínima por tipo). A DNIT 095/2006-EM não limita a densidade do CAP.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  var MA = { "25": 0.9971, "15.6": 0.9990 };                       // Nota 4 — massa específica da água (g/cm³)
  var REP = { "25": 0.002, "15.6": 0.003 }, REPR = { "25": 0.005, "15.6": 0.007 };  // 11.1 e 11.2
  // DNER-EM 364/97 — Tabela: densidade a 25/25 mínima dos alcatrões RT-1 a RT-12
  var RT = [1.08, 1.08, 1.09, 1.09, 1.10, 1.10, 1.12, 1.14, 1.14, 1.15, 1.16, 1.16];
  var ESPEC = [["", "Sem comparação com especificação", null]]
    .concat(RT.map(function (v, i) { return ["RT-" + (i + 1), "Alcatrão RT-" + (i + 1) + " — DNER-EM 364/97 (densidade 25/25 ≥ " + fmt(v, 2) + ")", v]; }))
    .concat([["outro", "Outra — informar mínimo e/ou máximo", null]]);
  function espec(P) { return ESPEC.filter(function (x) { return x[0] === (P.espec || ""); })[0] || ESPEC[0]; }
  function arred(x, c) { var f = Math.pow(10, c); return ok(x) ? Math.round(x * f + (x >= 0 ? 1e-9 : -1e-9)) / f : NaN; }

  FE.FICHAS["dner-me-193-96"] = {
    titulo: "Densidade e massa específica de materiais betuminosos — picnômetro",
    resumo: "Picnômetro de 24 mL a 30 mL calibrado com água na temperatura do ensaio (25 °C ou 15,6 °C); densidade do líquido (c − a)/(b − a) ou do semissólido (d − a)/[(b − a) − (e − d)]; massa específica = densidade × massa específica da água; média de duas determinações com três casas decimais.",
    rotuloImportar: function (r) { return "densidade " + (ok(r.D) ? fmt(r.D, 3) : "—") + (r.T ? " a " + String(r.T).replace(".", ",") + " °C" : ""); },
    blocos: [],
    params: [
      { k: "material", r: "Material betuminoso", ph: "ex.: CAP 50/70, asfalto diluído CM-30, alcatrão RT-10" },
      { k: "tipo", r: "Consistência do material", tipo: "select", recarrega: true,
        opcoes: [["semi", "Semissólido — picnômetro com ~3/4 de amostra + água (9.2)"], ["liquido", "Líquido — picnômetro cheio de amostra (9.1)"]] },
      { k: "temp", r: "Temperatura do ensaio", tipo: "select", recarrega: true, opcoes: [["25", "25/25 °C — Ma = 0,9971 g/cm³"], ["15.6", "15,6/15,6 °C — Ma = 0,9990 g/cm³"]],
        dica: "o picnômetro deve ter sido calibrado nesta mesma temperatura (Nota 1)" },
      { k: "espec", r: "Especificação para comparação — opcional", tipo: "select", recarrega: true, opcoes: ESPEC.map(function (x) { return [x[0], x[1]]; }),
        dica: "DNER-EM 364/97 (alcatrões): densidade 25/25 mínima; para CAP a DNIT 095/2006-EM não fixa limite" },
      { k: "min", r: "Densidade mínima", se: function (d) { return (d.params || {}).espec === "outro"; } },
      { k: "max", r: "Densidade máxima", se: function (d) { return (d.params || {}).espec === "outro"; } },
      { k: "outroLab", r: "Densidade obtida por outro laboratório — opcional", dica: "reprodutibilidade: 0,005 (25 °C) ou 0,007 (15,6 °C) (11.2)" },
    ],
    padrao: { tipo: "semi", temp: "25", espec: "" },
    tabelas: function (d) {
      var semi = (d.params || {}).tipo !== "liquido";
      var linhas = [
        { k: "pic", r: "Picnômetro nº", u: "", texto: true },
        { k: "a", r: "a — picnômetro vazio, com tampa (8.1)", u: "g" },
        { k: "b", r: "b — picnômetro com tampa cheio de água (8.4)", u: "g" },
      ];
      if (semi) {
        linhas.push({ k: "d", r: "d — picnômetro + amostra (~3/4 da capacidade) (9.2.5)", u: "g" });
        linhas.push({ k: "e", r: "e — picnômetro + amostra + água (9.2.8)", u: "g" });
        linhas.push({ calc: "encher", r: "Volume ocupado pela amostra (≈ 3/4, 9.2.3)", u: "%", casas: 0 });
        linhas.push({ calc: "D", r: "Ds = (d − a) / [(b − a) − (e − d)] (10.1.2)", u: "", casas: 4, destaque: true });
      } else {
        linhas.push({ k: "c", r: "c — picnômetro com tampa cheio de amostra (9.1.2)", u: "g" });
        linhas.push({ calc: "D", r: "Dl = (c − a) / (b − a) (10.1.1)", u: "", casas: 4, destaque: true });
      }
      linhas.push({ calc: "me", r: "Massa específica = densidade × Ma (10.1.3)", u: "g/cm³", casas: 4 });
      return [{ chave: "det", titulo: "Determinações", rotulo: "Determinação", iniciais: 2, min: 2, fixo: true, nomes: ["1", "2"],
        dica: "massas com aproximação de 1 mg; banho com variação máxima de 0,1 °C e permanência mínima de 30 min (7.3, 8.3, 9.2.7)", linhas: linhas }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], semi = P.tipo !== "liquido", T = P.temp === "15.6" ? "15.6" : "25", ma = MA[T];
      var dets = (d.det || []).map(function (x, i) {
        var a = num(x.a), b = num(x.b), c = num(x.c), dd = num(x.d), e = num(x.e), o = { D: NaN, me: NaN, encher: NaN }, n = "Determinação " + (i + 1) + ": ";
        if (ok(a) && ok(b)) {
          var agua = b - a;
          if (a > 40 + 1e-9) avisos.push(n + "picnômetro com tampa de " + fmt(a, 3) + " g — a norma pede no máximo 40 g (4 a).");
          if (agua <= 0) avisos.push(n + "b deve ser maior que a.");
          else if (agua / ma < 24 - 0.3 || agua / ma > 30 + 0.3) avisos.push(n + "capacidade do picnômetro de " + fmt(agua / ma, 1) + " mL (b − a = " + fmt(agua, 3) + " g) — a norma pede 24 mL a 30 mL (4 a).");
          if (semi && ok(dd) && ok(e) && agua > 0) {
            var vol = agua - (e - dd);                        // volume da amostra em "massa de água"
            o.D = vol > 0 ? (dd - a) / vol : NaN;
            o.encher = vol / agua * 100;
            if (dd <= a || e <= dd) avisos.push(n + "confira as massas (deve valer a < d < e).");
            if (ok(o.encher) && (o.encher < 60 || o.encher > 90)) avisos.push(n + "a amostra ocupa " + fmt(o.encher, 0) + " % do picnômetro — a norma pede cerca de três quartos (9.2.3).");
          } else if (!semi && ok(c) && agua > 0) {
            o.D = (c - a) / agua;
            if (c <= a) avisos.push(n + "c deve ser maior que a.");
          }
        }
        o.me = ok(o.D) ? o.D * ma : NaN;
        return o;
      });
      var Ds = dets.map(function (o) { return o.D; }).filter(ok), MEs = dets.map(function (o) { return o.me; }).filter(ok);
      var D = arred(media(Ds), 3), me = arred(media(MEs), 3), dif = NaN;
      if (Ds.length === 1) avisos.push("O resultado é a média de duas determinações (10.2.1); há uma.");
      if (Ds.length >= 2) {
        dif = Math.abs(Ds[0] - Ds[1]);
        if (dif > REP[T] + 1e-9) avisos.push("As duas determinações diferem de " + fmt(dif, 4) + " — acima de " + fmt(REP[T], 3) + " (repetibilidade a " + (T === "25" ? "25 °C" : "15,6 °C") + ", 11.1): repita o ensaio.");
      }
      var R = NaN, outro = num(P.outroLab);
      if (ok(D) && ok(outro)) {
        R = Math.abs(D - outro);
        if (R > REPR[T] + 1e-9) avisos.push("Diferença de " + fmt(R, 3) + " em relação ao outro laboratório, acima de " + fmt(REPR[T], 3) + " (reprodutibilidade, 11.2).");
      }
      var E = espec(P), mn = E[0] === "outro" ? num(P.min) : E[2], mx = E[0] === "outro" ? num(P.max) : NaN, conforme = null;
      if (ok(D) && (ok(mn) || ok(mx))) {
        conforme = (!ok(mn) || D >= mn - 1e-9) && (!ok(mx) || D <= mx + 1e-9);
        if (E[0] !== "outro" && T !== "25") avisos.push("A DNER-EM 364/97 fixa a densidade a 25/25 °C; o ensaio foi feito a 15,6/15,6 °C.");
        if (!conforme) avisos.unshift("Densidade " + fmt(D, 3) + " fora da especificação (" + (ok(mn) ? "mín. " + fmt(mn, 2) : "") + (ok(mn) && ok(mx) ? ", " : "") + (ok(mx) ? "máx. " + fmt(mx, 2) : "") + ").");
      }
      return { tab: { det: dets }, resultados: { D: D, me: me, dif: dif, T: T, ma: ma, semi: semi, R: R, mn: mn, mx: mx, conforme: conforme, esp: E, n: Ds.length }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, t = r.T === "25" ? "25/25 °C" : "15,6/15,6 °C";
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + fmt(r.D, 3) + '</div><div class="fe-res-r">Densidade a ' + t + " — média de " + r.n + " determinação(ões)" +
        (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>') + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v">' + fmt(r.me, 3) + ' <small>g/cm³</small></div><div class="fe-res-r">Massa específica a ' + (r.T === "25" ? "25" : "15,6") + " °C (Ma = " + fmt(r.ma, 4) + " g/cm³)</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (ok(r.dif) ? fmt(r.dif, 4) : "—") + '</div><div class="fe-res-r">Diferença entre as determinações (máx. ' + fmt(REP[r.T], 3) + ")</div></div></div>";
    },
    relatorio: {
      notas: "Líquido: Dl = (c − a)/(b − a) (10.1.1); semissólido: Ds = (d − a)/[(b − a) − (e − d)] (10.1.2), com a = picnômetro vazio, b = cheio de água, c = cheio de amostra, d = com amostra (~3/4), e = com amostra e água. " +
        "Massa específica = densidade × Ma, Ma = 0,9971 g/cm³ a 25 °C e 0,9990 g/cm³ a 15,6 °C (10.1.3, Nota 4). Resultado = média de duas determinações na terceira casa decimal (10.2.1). " +
        "Repetibilidade 0,002 (25 °C) e 0,003 (15,6 °C); reprodutibilidade 0,005 e 0,007 (seção 11). Picnômetro calibrado na temperatura do ensaio (Nota 1).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [], t = r.T === "25" ? "25/25 °C" : "15,6/15,6 °C";
        if (P.material) rows.push(["Material", P.material + (r.semi ? " (semissólido)" : " (líquido)")]);
        rows.push(["Densidade a " + t, fmt(r.D, 3) + " — média de " + r.n + " determinação(ões)"]);
        rows.push(["Massa específica a " + (r.T === "25" ? "25" : "15,6") + " °C", fmt(r.me, 3) + " g/cm³"]);
        rows.push(["Diferença entre as determinações", ok(r.dif) ? fmt(r.dif, 4) + " (máx. " + fmt(REP[r.T], 3) + ")" : "—"]);
        if (r.conforme !== null) rows.push(["Especificação", r.esp[1] + " — " + (r.conforme ? "ATENDE" : "NÃO ATENDE")]);
        if (ok(r.R)) rows.push(["Comparação com outro laboratório", "diferença de " + fmt(r.R, 3) + " (máx. " + fmt(REPR[r.T], 3) + ")"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "CAP 30/45 — semissólido a 25/25 °C (densidade 1,03, como no resumo de projeto do laboratório)", dados: function () {
        return { ident: { registro: "EX-DENS-001", data: "2026-02-10", obra: "Obra A", origem: "Distribuidora A", camada: "CAP 30/45" },
          params: { material: "CAP 30/45", tipo: "semi", temp: "25", espec: "" },
          det: [{ pic: "P-3", a: "31,842", b: "57,215", d: "51,468", e: "57,797" }, { pic: "P-5", a: "32,106", b: "57,321", d: "51,202", e: "57,867" }] };
      } },
      { nome: "Asfalto diluído CM-30 — líquido a 15,6/15,6 °C", dados: function () {
        return { ident: { registro: "EX-DENS-002", camada: "CM-30 — imprimação", origem: "Distribuidora C" },
          params: { material: "Asfalto diluído CM-30", tipo: "liquido", temp: "15.6", espec: "" },
          det: [{ pic: "P-1", a: "30,512", b: "55,984", c: "54,778" }, { pic: "P-2", a: "31,027", b: "56,436", c: "55,236" }] };
      } },
      { nome: "Alcatrão RT-10 — abaixo do mínimo da EM e duplicata fora da repetibilidade", dados: function () {
        return { ident: { registro: "EX-DENS-003", camada: "Alcatrão RT-10", origem: "Fornecedor A" },
          params: { material: "Alcatrão para pavimentação RT-10", tipo: "semi", temp: "25", espec: "RT-10", outroLab: "1,146" },
          det: [{ pic: "P-3", a: "31,842", b: "57,215", d: "51,510", e: "59,630" }, { pic: "P-5", a: "32,106", b: "57,321", d: "51,300", e: "59,715" }] };
      } },
    ],
  };
})();
