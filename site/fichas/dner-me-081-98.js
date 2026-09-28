/*
 * Fichas: DNER-ME 081/98 — Absorção e densidade de agregado graúdo, e
 *         DNER-ME 195/97 — Absorção e massa específica de agregado graúdo (mesmas contas: pesagem hidrostática).
 * As duas normas usam as mesmas pesagens (seca, saturada superfície seca e imersa), a mesma expressão para a
 * densidade aparente / massa específica na condição seca, a mesma absorção, a mesma combinação por frações e a
 * mesma repetibilidade (0,02 e 0,25 %). A 195/97 acrescenta a massa específica na condição saturada superfície seca.
 * Registram-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  // Tabela 1 (iguais nas duas normas): massa mínima (kg) pela dimensão máxima característica
  var TAB1 = [["12,5", 2], ["19", 3], ["25", 4], ["38", 5], ["50", 8], ["64", 12], ["76", 18], ["100", 40], ["125", 75], ["152", 125]];
  // Tabela 2: massa mínima por fração (kg) — [retida, passa, kg]. A 081/98 imprime "33" na 1ª linha (a 195/97, 38)
  var TAB2 = [[38, 50, 3], [50, 64, 4], [64, 76, 6], [76, 100, 22], [100, 125, 35], [125, 152, 50]];
  function r2(x) { return ok(x) ? Math.round(x * 100) / 100 : NaN; }
  function r1(x) { return ok(x) ? Math.round(x * 10) / 10 : NaN; }

  // cfg: {id, titulo, resumo, s: {seco, sss, imerso} símbolos, sec: {...} seções, tAgua:[t, tol], sss: bool, rot: {...}, exemplos}
  function criar(cfg) {
    var S = cfg.s, sec = cfg.sec;
    function fracoes(d) { return (d.params || {}).fracoes === "sim"; }
    function det(x) {
      var Ms = num(x.ms), Mh = num(x.mh), L = num(x.l), o = {};
      if (ok(Ms) && ok(Mh) && ok(L) && Mh - L > 0) {
        o.vol = Mh - L;
        o.dap = Ms / (Mh - L);
        if (cfg.sss) o.gsss = Mh / (Mh - L);
      }
      if (ok(Ms) && ok(Mh) && Ms > 0) o.abs = (Mh - Ms) / Ms * 100;
      return o;
    }
    var rotDap = cfg.rot.dap, u = cfg.rot.u;
    return {
      titulo: cfg.titulo,
      resumo: cfg.resumo,
      blocos: [],
      params: [
        { k: "material", r: "Material", ph: "ex.: brita 2" },
        { k: "fracoes", r: "Ensaio por frações granulométricas ou porções (" + sec.fr + ")", tipo: "select", recarrega: true,
          opcoes: [["nao", "Não — amostra única, determinações consecutivas"], ["sim", "Sim — uma coluna por fração (ou porção)"]],
          dica: "obrigatório nas frações superiores quando mais de 15 % fica retido na peneira de 38 mm (" + sec.fracao + ")" },
        { k: "dmax", r: "Dimensão máxima característica (mm)", tipo: "select",
          opcoes: [["", "—"]].concat(TAB1.map(function (t) { return [t[0], t[0] + " mm — mínimo " + fmt(t[1], 1) + " kg (Tabela 1)"]; })),
          se: function (d) { return !fracoes(d); } },
        { k: "temperatura", r: "Temperatura da água na pesagem imersa (°C)", ph: String(cfg.tAgua[0]),
          dica: sec.agua + ": (" + cfg.tAgua[0] + " ± " + cfg.tAgua[1] + ") °C" },
      ],
      padrao: { fracoes: "nao", temperatura: String(cfg.tAgua[0]) },
      tabelas: function (d) {
        var fr = fracoes(d), linhas = [];
        if (fr) {
          linhas.push({ k: "ret", r: "Peneira em que a fração fica retida (mm)", ph: "ex.: 38" });
          linhas.push({ k: "P", r: "Porcentagem retida da fração na amostra original (P)", u: "%" });
        }
        linhas = linhas.concat([
          { k: "mh", r: "Massa saturada superfície seca, ao ar (" + S.sss + ") (" + sec.sss + ")", u: "g" },
          { k: "l", r: "Leitura com o agregado submerso (" + S.imerso + ") — balança zerada com o recipiente imerso (" + sec.imerso + ")", u: "g" },
          { k: "ms", r: "Massa seca em estufa, ao ar (" + S.seco + ") (" + sec.seco + ")", u: "g" },
          { calc: "vol", r: "Volume do agregado " + S.sss + " − " + S.imerso, u: "cm³", casas: 1 },
          { calc: "dap", r: rotDap + " = " + S.seco + " / (" + S.sss + " − " + S.imerso + ") (" + sec.dap + ")", u: u, casas: 3, destaque: true },
        ]);
        if (cfg.sss) linhas.push({ calc: "gsss", r: cfg.rot.sss + " = " + S.sss + " / (" + S.sss + " − " + S.imerso + ") (" + sec.gsss + ")", u: u, casas: 3, destaque: true });
        linhas.push({ calc: "abs", r: "Absorção a = (" + S.sss + " − " + S.seco + ") / " + S.seco + " × 100 (" + sec.abs + ")", u: "%", casas: 2, destaque: true });
        return [{
          chave: "det", titulo: fr ? "Frações" : "Determinações", rotulo: fr ? "Fração" : "Det.", iniciais: 2, min: 1,
          dica: fr ? "uma coluna por fração; resultado pela média harmônica ponderada (densidade) e ponderada (absorção) — " + sec.fr
            : "duas determinações consecutivas com amostras do mesmo agregado (" + sec.rep + "); o resultado é a média",
          linhas: linhas,
        }];
      },
      calcular: function (d) {
        var P = d.params || {}, fr = fracoes(d), avisos = [];
        var T = num(P.temperatura);
        if (ok(T) && Math.abs(T - cfg.tAgua[0]) > cfg.tAgua[1]) avisos.push("Temperatura da água de " + fmt(T, 1) + " °C fora de (" + cfg.tAgua[0] + " ± " + cfg.tAgua[1] + ") °C (" + sec.agua + ").");
        var minT1 = (TAB1.filter(function (t) { return t[0] === P.dmax; })[0] || [])[1];
        var rot = fr ? "Fração " : "Determinação ";
        var dets = (d.det || []).map(function (x, i) {
          var o = det(x), n = rot + (i + 1) + ": ";
          var Ms = num(x.ms), Mh = num(x.mh), L = num(x.l);
          if (ok(Ms) && ok(Mh) && Ms > Mh) avisos.push(n + "massa seca maior que a saturada superfície seca — confira as pesagens.");
          if (ok(Ms) && ok(L) && L >= Ms) avisos.push(n + "leitura imersa maior ou igual à massa seca — confira as pesagens.");
          var minimo = null, fonte = "";
          if (fr) {
            var ret = num(x.ret), t2 = TAB2.filter(function (t) { return ok(ret) && Math.abs(t[0] - ret) < 0.01; })[0];
            if (t2) { minimo = t2[2]; fonte = "Tabela 2, passa " + t2[1] + " mm e retida " + t2[0] + " mm"; }
          } else if (minT1) { minimo = minT1; fonte = "Tabela 1, dimensão máxima " + P.dmax + " mm"; }
          if (minimo && ok(Ms) && Ms < minimo * 1000) avisos.push(n + "amostra de " + fmt(Ms, 1) + " g (seca), abaixo do mínimo de " + fmt(minimo, 1) + " kg (" + fonte + ").");
          o.P = num(x.P);
          return o;
        });
        var R = { fr: fr, n: 0 };
        var chaves = cfg.sss ? ["dap", "gsss", "abs"] : ["dap", "abs"];
        if (!fr) {
          var vals = function (k) { return dets.map(function (o) { return o[k]; }).filter(ok); };
          chaves.forEach(function (k) { R[k] = media(vals(k)); });
          R.n = vals("dap").length;
          if (R.n > 1) {
            var amp = function (k) { var v = vals(k); return Math.max.apply(null, v) - Math.min.apply(null, v); };
            R.difDap = amp("dap"); R.difAbs = amp("abs");
            if (cfg.sss) R.difGsss = amp("gsss");
            if (R.difDap > 0.02 + 1e-9) avisos.push("As determinações diferem " + fmt(R.difDap, 3) + " na " + cfg.rot.curto + " (máximo 0,02 — " + sec.rep + "): repita o ensaio.");
            if (cfg.sss && R.difGsss > 0.02 + 1e-9) avisos.push("As determinações diferem " + fmt(R.difGsss, 3) + " na massa específica saturada superfície seca (máximo 0,02 — " + sec.rep + ").");
            if (ok(R.abs) && R.abs < 2 && R.difAbs > 0.25 + 1e-9) avisos.push("As absorções diferem " + fmt(R.difAbs, 2) + " % (máximo 0,25 % para absorção menor que 2 % — " + sec.repAbs + "): repita o ensaio.");
          } else if (R.n === 1) avisos.push("A repetibilidade (" + sec.rep + ") é verificada com duas determinações consecutivas; há uma.");
        } else {
          var us = dets.filter(function (o) { return ok(o.P) && ok(o.dap) && ok(o.abs); });
          var soma = us.reduce(function (s, o) { return s + o.P; }, 0);
          R.n = us.length; R.somaP = soma;
          if (us.length && Math.abs(soma - 100) > 0.05) avisos.push("A soma das porcentagens das frações é " + fmt(soma, 1) + " % (deve ser 100 %).");
          if (us.length) {
            // D = 100 / Σ (Pi / Di);  a = Σ (Pi × ai) / 100
            ["dap"].concat(cfg.sss ? ["gsss"] : []).forEach(function (k) { R[k] = 100 / us.reduce(function (s, o) { return s + o.P / o[k]; }, 0); });
            R.abs = us.reduce(function (s, o) { return s + o.P * o.abs; }, 0) / 100;
          } else chaves.forEach(function (k) { R[k] = NaN; });
          if (dets.length && us.length < dets.length) avisos.push("Informe P (%) e as três pesagens de cada fração para combinar os resultados.");
        }
        return { tab: { det: dets }, resultados: R, avisos: avisos };
      },
      resultadosHtml: function (calc) {
        var r = calc.resultados;
        function item(v, un, rotulo, casas, p) {
          return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + fmt(v, casas) + (un ? " <small>" + un + "</small>" : "") + '</div><div class="fe-res-r">' + rotulo + "</div></div>";
        }
        var base = r.fr ? "combinação de " + r.n + " frações (" + sec.fr + ")" : r.n > 1 ? "média de " + r.n + " determinações" : "uma determinação";
        var h = '<div class="fe-res">' + item(r2(r.dap), u, esc(rotDap) + " — " + esc(base) + " (" + fmt(r.dap, 3) + ")", 2);
        if (cfg.sss) h += item(r2(r.gsss), u, esc(cfg.rot.sss) + " (" + fmt(r.gsss, 3) + ")", 2);
        h += item(r1(r.abs), "%", "Absorção (" + fmt(r.abs, 2) + " %)", 1);
        if (!r.fr && r.n > 1) h += item(r.difDap, "", "Diferença entre determinações (máx. 0,02) · absorção: " + fmt(r.difAbs, 2) + " % (máx. 0,25 % se a < 2 %)", 3, true);
        return h + "</div>";
      },
      relatorio: {
        notas: cfg.notas,
        resultados: function (calc, d) {
          var r = calc.resultados, P = d.params || {}, rows = [];
          if (P.material) rows.push(["Material", P.material]);
          rows.push([rotDap, fmt(r2(r.dap), 2) + (u ? " " + u : "")]);
          if (cfg.sss) rows.push([cfg.rot.sss, fmt(r2(r.gsss), 2) + " " + u]);
          rows.push(["Absorção", fmt(r1(r.abs), 1) + " %"]);
          rows.push(["Base do resultado", r.fr ? "combinação de " + r.n + " frações (" + sec.fr + ")" : r.n > 1 ? "média de " + r.n + " determinações — diferença " +
            fmt(r.difDap, 3) + " (máx. 0,02); absorção " + fmt(r.difAbs, 2) + " % (máx. 0,25 % se a < 2 %)" : "uma determinação"]);
          return rows;
        },
      },
      exemplos: cfg.exemplos,
    };
  }

  // exemplos (as pesagens são as mesmas nas duas normas; muda só a nomenclatura)
  function exBrita2(reg) {
    // RECEBIMENTO DE INSUMO.xlsx (Unidade A), aba "Gran B2 10-10": duas determinações de 500 g (cesto imerso 152,9 g descontado)
    return { ident: { registro: reg, obra: "Obra A", origem: "Pedreira X", camada: "Brita 2 — caracterização", data: "2025-10-10" },
      params: { material: "Brita 2", fracoes: "nao", dmax: "25", temperatura: "" },
      det: [{ mh: "501,9", l: "296,9", ms: "500,0" }, { mh: "501,8", l: "296,7", ms: "500,0" }] };
  }
  function exBrita0(reg) {
    // RECEBIMENTO DE INSUMO.xlsx (Unidade A), aba "Gran B0 08-10": determinações de 1 000 g e 500 g muito discrepantes
    return { ident: { registro: reg, obra: "Obra A", origem: "Pedreira X", camada: "Brita 0 — caracterização", data: "2025-10-08" },
      params: { material: "Brita 0", fracoes: "nao", dmax: "12,5", temperatura: "" },
      det: [{ mh: "1012,2", l: "611,7", ms: "1000,0" }, { mh: "510,3", l: "246,5", ms: "500,0" }] };
  }
  function exFracoes(reg, t) {
    return { ident: { registro: reg, origem: "Pedreira A", camada: "Rachão / pedra de mão" },
      params: { material: "Agregado graúdo com 30 % retido em 38 mm", fracoes: "sim", temperatura: t },
      det: [{ ret: "4,8", P: "70", mh: "5030", l: "3190", ms: "4985" }, { ret: "38", P: "30", mh: "3040", l: "1925", ms: "3016" }] };
  }

  FE.FICHAS["dner-me-081-98"] = criar({
    titulo: "Absorção e densidade de agregado graúdo",
    resumo: "Pesagem hidrostática após imersão de (24 ± 4) h: Dap = Ms / (Mh − L); a = (Mh − Ms) / Ms × 100; duas determinações não devem diferir mais de 0,02 (densidade) e 0,25 % (absorção < 2 %).",
    s: { seco: "Ms", sss: "Mh", imerso: "L" },
    sec: { fr: "7.1.3", fracao: "5.4", agua: "6.3", sss: "6.2", imerso: "6.3", seco: "6.4", dap: "7.1.1", abs: "7.1.2", rep: "7.1.4.1", repAbs: "7.1.4.2" },
    tAgua: [24, 2], sss: false,
    rot: { dap: "Densidade aparente Dap", curto: "densidade aparente", u: "" },
    notas: "Dap = Ms/(Mh − L) (7.1.1); a = (Mh − Ms)/Ms × 100 (7.1.2). Ms = massa seca em estufa; Mh = massa saturada superfície seca; L = leitura com o agregado submerso (balança zerada com o recipiente imerso). Por frações: Dap = 100/Σ(Pi/Dapi) e a = Σ(Pi × ai)/100 (7.1.3). Duas determinações consecutivas não devem diferir mais de 0,02 na densidade (7.1.4.1) nem, para absorção < 2 %, mais de 0,25 % (7.1.4.2); resultados com aproximação de 0,01 e 0,1 % (Notas 3 e 4). O resultado é a média das determinações. A massa mínima (Tabelas 1 e 2) é conferida com a massa seca.",
    exemplos: [
      { nome: "Brita 2 — duplicata (planilha do laboratório)", dados: function () { return exBrita2("EX-081-001"); } },
      { nome: "Brita 0 — duplicata fora da repetibilidade (planilha do laboratório)", dados: function () { return exBrita0("EX-081-002"); } },
      { nome: "Agregado com 30 % retido em 38 mm — duas frações (7.1.3)", dados: function () { return exFracoes("EX-081-003", "24"); } },
    ],
  });

  FE.FICHAS["dner-me-195-97"] = criar({
    titulo: "Absorção e massa específica de agregado graúdo",
    resumo: "Pesagem hidrostática após imersão de (24 ± 4) h: γs = A / (B − C), γsss = B / (B − C), a = (B − A) / A × 100; duas determinações não devem diferir mais de 0,02 g/cm³ e 0,25 % (absorção < 2 %).",
    s: { seco: "A", sss: "B", imerso: "C" },
    sec: { fr: "7.1.4", fracao: "5.1.4", agua: "6.3", sss: "6.2", imerso: "6.3", seco: "6.4", dap: "7.1.1", gsss: "7.1.2", abs: "7.1.3", rep: "7.1.5.1", repAbs: "7.1.5.2" },
    tAgua: [23, 2], sss: true,
    rot: { dap: "Massa específica na condição seca γs", sss: "Massa específica na condição saturada superfície seca γsss", curto: "massa específica", u: "g/cm³" },
    notas: "γs = A/(B − C) (7.1.1); γsss = B/(B − C) (7.1.2 — a norma imprime A/(B − C), igual à 7.1.1; usada a massa saturada superfície seca B, conforme a definição 3.3 e a Nota 4, em que B − C é o volume); a = (B − A)/A × 100 (7.1.3). A = massa seca; B = massa saturada superfície seca; C = leitura com o agregado imerso (balança zerada com o recipiente imerso). Por frações: γ = 100/Σ(Pi/γi) e a = Σ(Pi × ai)/100 (7.1.4). Duas determinações consecutivas não devem diferir mais de 0,02 g/cm³ (7.1.5.1) nem, para absorção < 2 %, mais de 0,25 % (7.1.5.2); resultados com aproximação de 0,01 g/cm³ e 0,1 % (Notas 5 e 6). O resultado é a média das determinações. A massa mínima (Tabelas 1 e 2) é conferida com a massa seca.",
    exemplos: [
      { nome: "Brita 2 — duplicata (planilha do laboratório)", dados: function () { return exBrita2("EX-195-001"); } },
      { nome: "Brita 0 — duplicata fora da repetibilidade (planilha do laboratório)", dados: function () { return exBrita0("EX-195-002"); } },
      { nome: "Agregado com 30 % retido em 38 mm — duas frações (7.1.4)", dados: function () { return exFracoes("EX-195-003", "23"); } },
    ],
  });
})();
