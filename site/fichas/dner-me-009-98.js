/*
 * Ficha: DNER-ME 009/98 — Petróleo e derivados — Determinação da densidade — Método do densímetro.
 * Registra-se no motor de site/fichas.js (window.FE). Estrutura igual à de site/fichas/dnit-450-2024-me.js.
 *
 * Leitura do densímetro (aproximação de 0,0005) + correção de menisco (líquidos opacos, Nota 2 ≈ 0,0007) e do
 * instrumento; temperatura do ensaio = média das leituras antes e depois (aprox. 0,5 °C; diferença ≤ 0,5 °C, 5.2.7).
 * Correção para 20 °C (6.2): a norma remete à Resolução CNP 6/70, cujas tabelas não estão no texto. A ficha oferece:
 *  - "tabela": o laboratório lança a densidade a 20/4 °C lida na tabela da Resolução CNP 6/70;
 *  - "astm": cálculo pelos coeficientes de expansão térmica da ASTM D 1250-80 / ISO 91-1 (Tabelas 53/54 A, B e D):
 *    α15 = K0/ρ15² + K1/ρ15; ρt = ρ15 · exp[−α15 Δt (1 + 0,8 α15 Δt)], Δt = t − 15 °C; ρ15 obtido por iteração a
 *    partir de ρt e levado a 20 °C; correção da dilatação do vidro do densímetro (calibrado a 20 °C):
 *    × [1 − 0,000023 (t − 20) − 0,00000002 (t − 20)²]. Densidade 20/4 = ρ20 / 999,972 kg/m³.
 * Precisão (7): repetibilidade 0,0005 (transparente) / 0,0006 (opaco), só para ensaios entre −2 °C e 25 °C.
 * Não há limite de densidade em EM do DNIT para estes produtos: faixa opcional informada pelo usuário.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  var AGUA4 = 999.972;  // kg/m³, água a 4 °C
  // grupos ASTM D 1250-80 (ρ15 em kg/m³, α15 em 1/°C)
  function alfa(grupo, r) {
    if (grupo === "cru") return 613.9723 / (r * r);                       // Tabela 54A — petróleo cru
    if (grupo === "lub") return 0.6278 / r;                               // Tabela 54D — óleos lubrificantes
    // Tabela 54B — produtos, grupo pela densidade
    if (r < 770.5) return 346.4228 / (r * r) + 0.4388 / r;                // gasolinas
    if (r < 787.5) return -0.00336312 + 2680.3206 / (r * r);              // zona de transição
    if (r < 838.5) return 594.5418 / (r * r);                             // querosenes / jet
    return 186.9696 / (r * r) + 0.4862 / r;                               // óleos combustíveis, diesel, asfaltos diluídos
  }
  function grupoNome(grupo, r) {
    if (grupo === "cru") return "petróleo cru (54A)";
    if (grupo === "lub") return "lubrificantes (54D)";
    return r < 770.5 ? "gasolinas (54B)" : r < 787.5 ? "transição (54B)" : r < 838.5 ? "querosenes/jet (54B)" : "óleos combustíveis (54B)";
  }
  function ctl(a, t) { var dt = t - 15; return Math.exp(-a * dt * (1 + 0.8 * a * dt)); }
  // ρt (kg/m³, já corrigido do vidro) -> ρ20
  function para20(rt, t, grupo) {
    var r15 = rt;
    for (var i = 0; i < 50; i++) {
      var novo = rt / ctl(alfa(grupo, r15), t);
      if (Math.abs(novo - r15) < 1e-7) { r15 = novo; break; }
      r15 = novo;
    }
    return { r15: r15, r20: r15 * ctl(alfa(grupo, r15), 20), alfa: alfa(grupo, r15) };
  }
  function arredPasso(x, p) { return ok(x) ? Math.round(x / p + 1e-9) * p : NaN; }
  function fT(x) { return fmt(x, 1).replace(/^-/, "−"); }

  var TIPOS = [
    ["nv", "Não voláteis — P.I. ebulição acima de 120 °C: qualquer temperatura entre −18 °C e +90 °C"],
    ["mv", "Moderadamente voláteis — P.I.E. até 120 °C: resfriar a 18 °C ou menos"],
    ["mvv", "Moderadamente voláteis e viscosos — aquecer à temperatura mínima de fluidez"],
    ["av", "Altamente voláteis — P.V. Reid abaixo de 1,8 kg: resfriar a 2 °C ou menos"],
    ["mist", "Misturas com produtos não derivados de petróleo — ensaiar a (20 ± 0,2) °C"],
  ];

  FE.FICHAS["dner-me-009-98"] = {
    titulo: "Densidade de petróleo e derivados — densímetro",
    resumo: "Leitura do densímetro com aproximação de 0,0005 e temperatura da amostra antes e depois da leitura; correção de menisco para líquidos opacos; densidade convertida a 20/4 °C (tabela da Resolução CNP 6/70 ou cálculo pelos coeficientes da ASTM D 1250).",
    blocos: [],
    params: [
      { k: "material", r: "Produto", ph: "ex.: óleo diesel, querosene, asfalto diluído CM-30" },
      { k: "tipo", r: "Tipo de amostra (Tabela — condições de temperatura)", tipo: "select", opcoes: TIPOS },
      { k: "aspecto", r: "Aspecto do líquido", tipo: "select", recarrega: true,
        opcoes: [["transp", "Transparente — leitura no plano da superfície (5.2.6.1)"], ["opaco", "Opaco — leitura no topo do menisco + correção (5.2.6.2)"]] },
      { k: "menisco", r: "Correção de menisco a somar", ph: "0,0007", se: function (d) { return (d.params || {}).aspecto === "opaco"; },
        dica: "determinada para o densímetro em uso com óleo transparente de tensão superficial semelhante; da ordem de 0,0007 (Nota 2)" },
      { k: "corrDens", r: "Correção do densímetro (certificado) — opcional", ph: "0", dica: "somada à leitura (6.1)" },
      { k: "corrTerm", r: "Correção do termômetro (certificado, °C) — opcional", ph: "0", dica: "somada às leituras de temperatura (6.1)" },
      { k: "conv", r: "Conversão para 20/4 °C (6.2)", tipo: "select", recarrega: true,
        opcoes: [["astm", "Calcular — coeficientes de expansão da ASTM D 1250-80 / ISO 91-1"], ["tabela", "Informar o valor lido na tabela da Resolução CNP 6/70"]] },
      { k: "grupo", r: "Grupo de produtos (ASTM D 1250)", tipo: "select",
        opcoes: [["prod", "Derivados — grupo pela densidade (Tabela 54B)"], ["cru", "Petróleo cru (Tabela 54A)"], ["lub", "Óleos lubrificantes (Tabela 54D)"]] },
      { k: "vidro", r: "Correção da dilatação do vidro do densímetro (calibrado a 20 °C)", tipo: "select", opcoes: [["sim", "Aplicar"], ["nao", "Não aplicar"]] },
      { k: "min", r: "Densidade a 20/4 °C mínima — opcional", dica: "da especificação do produto (não há limite em EM do DNIT)" },
      { k: "max", r: "Densidade a 20/4 °C máxima — opcional" },
      { k: "outroLab", r: "Densidade a 20/4 °C de outro laboratório — opcional", dica: "reprodutibilidade 0,0012 (transparente) / 0,0015 (opaco), entre −2 °C e 25 °C (7.2)" },
    ],
    padrao: { tipo: "nv", aspecto: "transp", conv: "astm", grupo: "prod", vidro: "sim" },
    tabelas: function (d) {
      var tab = (d.params || {}).conv === "tabela";
      var linhas = [
        { k: "t1", r: "Temperatura antes da leitura (5.2.4)", u: "°C" },
        { k: "L", r: "Leitura do densímetro (aprox. 0,0005, 5.2.6)", u: "" },
        { k: "t2", r: "Temperatura após a leitura (5.2.7)", u: "°C" },
        { calc: "t", r: "Temperatura do ensaio — média, aprox. 0,5 °C (6.1)", u: "°C", casas: 1 },
        { calc: "Lc", r: "Leitura corrigida (menisco e instrumento, 6.1)", u: "", casas: 4 },
        { calc: "dAstm", r: "Densidade a 20/4 °C — ASTM D 1250" + (tab ? " (conferência)" : ""), u: "", casas: 4, destaque: !tab },
      ];
      if (tab) {
        linhas.push({ k: "dTab", r: "Densidade a 20/4 °C — tabela da Resolução CNP 6/70 (6.2)", u: "" });
        linhas.push({ calc: "d20", r: "Densidade a 20/4 °C adotada", u: "", casas: 4, destaque: true });
      }
      return [{ chave: "det", titulo: "Determinações", rotulo: "Determinação", iniciais: 2, min: 1, nomes: ["1", "2", "3", "4"],
        dica: "leitura estabilizada com o densímetro flutuando livremente; repetir se as temperaturas antes e depois diferirem mais de 0,5 °C (5.2.7)", linhas: linhas }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], opaco = P.aspecto === "opaco", tab = P.conv === "tabela";
      var men = opaco ? (ok(num(P.menisco)) ? num(P.menisco) : 0.0007) : 0;
      var cD = ok(num(P.corrDens)) ? num(P.corrDens) : 0, cT = ok(num(P.corrTerm)) ? num(P.corrTerm) : 0;
      var grupo = P.grupo || "prod", vidro = P.vidro !== "nao", info = null;
      var dets = (d.det || []).map(function (x, i) {
        var n = "Determinação " + (i + 1) + ": ", t1 = num(x.t1), t2 = num(x.t2), L = num(x.L), o = {};
        var ts = [t1, t2].filter(ok).map(function (v) { return v + cT; });
        o.t = arredPasso(media(ts), 0.5);
        if (ok(t1) && ok(t2) && Math.abs(t1 - t2) > 0.5 + 1e-9) avisos.push(n + "temperaturas antes e depois da leitura diferem " + fmt(Math.abs(t1 - t2), 2) + " °C (máx. 0,5 °C) — repetir as leituras até estabilizar (5.2.7).");
        if (ok(L) && ts.length === 1) avisos.push(n + "anote a temperatura antes e depois da leitura (6.1).");
        o.Lc = ok(L) ? L + men + cD : NaN;
        if (ok(o.Lc) && ok(o.t)) {
          var t = o.t, rt = o.Lc * AGUA4;
          if (vidro) rt *= 1 - 0.000023 * (t - 20) - 0.00000002 * (t - 20) * (t - 20);
          var c = para20(rt, t, grupo);
          o.dAstm = c.r20 / AGUA4; o.r15 = c.r15;
          info = { alfa: c.alfa, grupo: grupoNome(grupo, c.r15) };
          if (grupo === "prod" && (c.r15 < 653 || c.r15 > 1075)) avisos.push(n + "densidade fora do campo da Tabela 54B (653 a 1075 kg/m³ a 15 °C) — use a tabela da Resolução CNP 6/70.");
        } else o.dAstm = NaN;
        o.d20 = tab ? num(x.dTab) : o.dAstm;
        if (tab && ok(o.d20) && ok(o.dAstm) && Math.abs(o.d20 - o.dAstm) > 0.0010) avisos.push(n + "o valor da tabela difere " + fmt(Math.abs(o.d20 - o.dAstm), 4) + " do cálculo pela ASTM D 1250 — confira a leitura na tabela.");
        return o;
      });
      var vals = dets.map(function (o) { return o.d20; }).filter(ok), ts = dets.map(function (o) { return o.t; }).filter(ok);
      var d20 = media(vals), tm = media(ts);
      // temperatura do ensaio x tipo de amostra (Tabela e 5.2.1.1)
      ts.forEach(function (t) {
        if (t < -18 || t > 90) avisos.push("Temperatura de " + fT(t) + " °C fora do intervalo do método (−18 °C a +90 °C, 5.2.1.1).");
      });
      var tMax = ts.length ? Math.max.apply(null, ts) : NaN, tMin = ts.length ? Math.min.apply(null, ts) : NaN;
      if (ok(tMax)) {
        if (P.tipo === "av" && tMax > 2) avisos.push("Amostra altamente volátil: resfriar a 2 °C ou menos (Tabela).");
        if (P.tipo === "mv" && tMax > 18) avisos.push("Amostra moderadamente volátil: resfriar a 18 °C ou menos (Tabela).");
        if (P.tipo === "mist" && (Math.abs(tMax - 20) > 0.2 + 1e-9 || Math.abs(tMin - 20) > 0.2 + 1e-9)) avisos.push("Mistura com produtos não derivados de petróleo: ensaiar a (20 ± 0,2) °C (Tabela) — as tabelas de correção não se aplicam.");
      }
      // repetibilidade (7.1)
      var dif = NaN, lim = opaco ? 0.0006 : 0.0005, precisao = ok(tMin) && tMin >= -2 && tMax <= 25;
      if (vals.length >= 2) {
        dif = Math.max.apply(null, vals) - Math.min.apply(null, vals);
        if (!precisao) avisos.push("Ensaio fora de −2 °C a 25 °C: a precisão não é estabelecida (7.2.1).");
        else if (dif > lim + 1e-9) avisos.push("As determinações diferem " + fmt(dif, 4) + " — acima da repetibilidade de " + fmt(lim, 4) + " (" + (opaco ? "líquido opaco" : "líquido transparente") + ", 7.1).");
      }
      var R = NaN, outro = num(P.outroLab);
      if (ok(d20) && ok(outro)) {
        R = Math.abs(d20 - outro);
        var lr = opaco ? 0.0015 : 0.0012;
        if (precisao && R > lr + 1e-9) avisos.push("Diferença de " + fmt(R, 4) + " em relação ao outro laboratório, acima de " + fmt(lr, 4) + " (reprodutibilidade, 7.2).");
      }
      var mn = num(P.min), mx = num(P.max), res = Math.round(d20 * 10000) / 10000, conforme = null;
      if (ok(d20) && (ok(mn) || ok(mx))) {
        conforme = (!ok(mn) || res >= mn - 1e-9) && (!ok(mx) || res <= mx + 1e-9);
        if (!conforme) avisos.unshift("Densidade a 20/4 °C de " + fmt(res, 4) + " fora da faixa especificada (" + (ok(mn) ? "mín. " + fmt(mn, 4) : "") + (ok(mn) && ok(mx) ? ", " : "") + (ok(mx) ? "máx. " + fmt(mx, 4) : "") + ").");
      }
      return { tab: { det: dets }, resultados: { d20: res, rho: ok(d20) ? d20 * AGUA4 : NaN, t: tm, dif: dif, lim: lim, precisao: precisao, R: R, mn: mn, mx: mx,
        conforme: conforme, tab: tab, info: info, men: men, n: vals.length }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + fmt(r.d20, 4) + '</div><div class="fe-res-r">Densidade a 20/4 °C — ' + (r.tab ? "tabela da Resolução CNP 6/70" : "ASTM D 1250" + (r.info ? ", " + esc(r.info.grupo) : "")) +
        " — média de " + r.n + " determinação(ões)" + (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>') + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v">' + fmt(r.rho, 1) + ' <small>kg/m³</small></div><div class="fe-res-r">Massa específica a 20 °C · temperatura do ensaio ' + (ok(r.t) ? fT(r.t) + " °C" : "—") + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (ok(r.dif) ? fmt(r.dif, 4) : "—") + '</div><div class="fe-res-r">Diferença entre determinações (máx. ' + fmt(r.lim, 4) + (r.precisao ? "" : "; precisão não estabelecida fora de −2 °C a 25 °C") + ")</div></div></div>";
    },
    relatorio: {
      notas: "Leitura do densímetro com aproximação de 0,0005, somadas as correções do instrumento e, em líquido opaco, a de menisco (≈ 0,0007, Nota 2); temperatura do ensaio = média das leituras antes e depois, com aproximação de 0,5 °C (6.1). " +
        "Conversão para 20/4 °C (6.2): a norma remete às tabelas da Resolução CNP 6/70, não reproduzidas no texto. Quando calculada, usa os coeficientes da ASTM D 1250-80 / ISO 91-1: α15 = K0/ρ15² + K1/ρ15, ρt = ρ15 · exp[−α15 Δt (1 + 0,8 α15 Δt)], Δt = t − 15 °C, " +
        "com correção da dilatação do vidro do densímetro [1 − 0,000023 (t − 20) − 0,00000002 (t − 20)²]; densidade 20/4 = ρ20 / 999,972 kg/m³. Repetibilidade 0,0005 (transparente) e 0,0006 (opaco); reprodutibilidade 0,0012 e 0,0015 — só entre −2 °C e 25 °C (seção 7).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Produto", P.material]);
        rows.push(["Densidade a 20/4 °C", fmt(r.d20, 4) + " — " + (r.tab ? "tabela da Resolução CNP 6/70" : "calculada pela ASTM D 1250" + (r.info ? " (" + r.info.grupo + ")" : ""))]);
        rows.push(["Massa específica a 20 °C", fmt(r.rho, 1) + " kg/m³"]);
        rows.push(["Temperatura do ensaio", ok(r.t) ? fT(r.t) + " °C" : "—"]);
        if (r.men) rows.push(["Correção de menisco", "+" + fmt(r.men, 4)]);
        rows.push(["Diferença entre determinações", ok(r.dif) ? fmt(r.dif, 4) + " (máx. " + fmt(r.lim, 4) + (r.precisao ? ")" : "; precisão não estabelecida)") : "—"]);
        if (r.conforme !== null) rows.push(["Faixa especificada", (ok(r.mn) ? "mín. " + fmt(r.mn, 4) + " " : "") + (ok(r.mx) ? "máx. " + fmt(r.mx, 4) : "") + " — " + (r.conforme ? "ATENDE" : "NÃO ATENDE")]);
        if (ok(r.R)) rows.push(["Comparação com outro laboratório", "diferença de " + fmt(r.R, 4)]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Óleo diesel — transparente, leitura a 28,5 °C convertida a 20 °C", dados: function () {
        return { ident: { registro: "EX-DSM-001", data: "2026-03-12", obra: "Unidade A — usina de asfalto", origem: "Fornecedor A", camada: "Óleo diesel — combustível do secador" },
          params: { material: "Óleo diesel", tipo: "nv", aspecto: "transp", conv: "astm", grupo: "prod", vidro: "sim", min: "0,8150", max: "0,8650" },
          det: [{ t1: "28,50", L: "0,8385", t2: "28,75" }, { t1: "28,50", L: "0,8385", t2: "28,50" }] };
      } },
      { nome: "Asfalto diluído CM-30 — opaco, a 40 °C, conversão pela tabela CNP 6/70", dados: function () {
        return { ident: { registro: "EX-DSM-002", camada: "CM-30 — imprimação", origem: "Distribuidora C" },
          params: { material: "Asfalto diluído CM-30", tipo: "nv", aspecto: "opaco", menisco: "0,0007", conv: "tabela", grupo: "prod", vidro: "sim" },
          det: [{ t1: "40,0", L: "0,9250", t2: "40,25", dTab: "0,9398" }, { t1: "40,25", L: "0,9255", t2: "40,25", dTab: "0,9401" }] };
      } },
      { nome: "Querosene — temperatura instável, duplicata dispersa e fora da faixa", dados: function () {
        return { ident: { registro: "EX-DSM-003", camada: "Querosene — solvente", origem: "Fornecedor B" },
          params: { material: "Querosene", tipo: "nv", aspecto: "transp", conv: "astm", grupo: "prod", vidro: "sim", min: "0,7710", max: "0,8000" },
          det: [{ t1: "22,00", L: "0,8015", t2: "22,75" }, { t1: "22,25", L: "0,8025", t2: "22,50" }] };
      } },
    ],
  };
})();
