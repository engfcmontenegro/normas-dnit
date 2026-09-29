/*
 * Ficha: DNIT 259/2023-CLA — Classificação de solos finos tropicais (metodologia MCT).
 * Entradas: c', d', Pi' (ou AF e Pi com Mini-MCV 10 e 15, 3.8) — digitados ou importados de um ensaio da ficha
 * DNIT 258/2023-ME; e' = ∛(Pi'/100 + 20/d') (eq. 1); grupo pelo gráfico da Figura A1 (5.1 c), com os critérios para
 * pontos próximos da linha L/N; propriedades típicas (Anexo B) e descrição do grupo (Anexo C).
 * Expõe FE.mct (classificar, gráfico, grupos) — usado pela ficha DNIT 444/2023-CLA (carregada depois).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  // ---------- Figura A1 ----------
  // linha L/N: e' = 1,40 até c' = 0,59; tracejado até (0,70; 1,15); e' = 1,15 daí em diante
  function eLN(c) { return c < 0.59 ? 1.4 : c < 0.7 ? 1.4 - (c - 0.59) * 0.25 / 0.11 : 1.15; }
  // linha NA | demais N: (0,27; 2,2) – (0,45; 1,75) – (0,59; 1,40) – (0,70; 1,15)
  function cNA(e) { return e >= 1.4 ? 0.27 + (2.2 - e) / 2.5 : 0.59 + (1.4 - e) * 0.11 / 0.25; }
  // linha NS' | NA': (0,45; 1,75) – (1,70; 1,15)
  function eNS(c) { return 1.75 - (c - 0.45) * 0.6 / 1.25; }
  function grupoL(c) { return c < 0.7 ? "LA" : c < 1.5 ? "LA'" : "LG'"; }
  // o traço vertical c' = 1,5 separa NS' de NG' só acima da linha NS'|NA' (e' ≈ 1,25); abaixo dela, até c' = 1,70, é NA'
  function classificar(c, e) {
    if (!ok(c) || !ok(e)) return "";
    if (e < eLN(c)) return grupoL(c);
    if (c < cNA(e)) return "NA";
    if (c >= 0.45 && c <= 1.7 && e <= eNS(c)) return "NA'";
    return c >= 1.5 ? "NG'" : "NS'";
  }
  var GRUPOS = {
    LA: { classe: "L", nome: "Laterítico — areias com pouca argila", desc: "Solos pouco coesivos e com alto módulo de resiliência, compostos por areias com poucos finos; em grumos subarredondados, de coloração avermelhada (oxidação do ferro).", corr: "Neossolo quartzarênico (NQ)" },
    "LA'": { classe: "L", nome: "Laterítico — arenoso (areias argilosas, argilas arenosas)", desc: "Os melhores solos para base e sub-base de pavimentos: razoável coesão e alto módulo de resiliência; areias argilosas e finos lateríticos.", corr: "Latossolos (L) ou Argissolos (P) de textura média-arenosa" },
    "LG'": { classe: "L", nome: "Laterítico — argiloso", desc: "Podem apresentar elevada contração em camadas compactadas e menores capacidade de suporte e módulo de resiliência; argilas, argilas siltosas e arenosas e siltes argilosos.", corr: "Latossolos (L) ou Argissolos (P) de textura média-argilosa" },
    NA: { classe: "N", nome: "Não laterítico — areias, areias siltosas e siltes quartzosos", desc: "Pouco expansivos e de baixo coeficiente de argilosidade; os melhores são os próximos do grupo LA. Quartzo e/ou micas nas frações areia e silte.", corr: "Alteração de arenitos e quartzitos" },
    "NA'": { classe: "N", nome: "Não laterítico — arenoso (areias siltosas e argilosas)", desc: "Coeficiente de argilosidade médio; os de alta porcentagem de finos (argila) são muito expansivos (os piores); os melhores ficam próximos de LA e LA'. Areias quartzosas com finos e mica.", corr: "Saprólitos de rochas ricas em quartzo (arenitos, granitos, gnaisses)" },
    "NS'": { classe: "N", nome: "Não laterítico — siltoso", desc: "Muito resilientes; não recomendados como camada final de terraplenagem nem para o pavimento, nem para misturas solo-agregado. Siltes e siltes arenosos, argilosidade baixa a média.", corr: "Alteração de basalto, diabásio e metabasito" },
    "NG'": { classe: "N", nome: "Não laterítico — argiloso", desc: "Alto coeficiente de argilosidade, elevadas expansão, plasticidade, compressibilidade e contração. Argilas, argilas siltosas e arenosas, siltes argilosos. Não indicado para camadas nobres.", corr: "Saprólitos de basalto, diabásio, metabasito, gnaisses, folhelhos, granitos e calcários" },
  };
  // Anexo B — propriedades típicas: [Mini-CBR sem embebição, perda de suporte por embebição, expansão, contração, permeabilidade, plasticidade]
  var PROP_ROT = ["Mini-CBR sem embebição", "Perda de suporte por embebição", "Expansão", "Contração", "Permeabilidade (log k)", "Plasticidade"];
  var PROP = {
    NA: ["Alta a média", "Baixa a média", "Baixa", "Baixa a média", "Alta a média", "Baixa a NP"],
    "NA'": ["Alta", "Baixa", "Baixa", "Baixa a média", "Baixa", "Média a NP"],
    "NS'": ["Alta a média", "Alta", "Alta", "Média", "Média a alta", "Média a alta"],
    "NG'": ["Alta", "Alta", "Alta a média", "Alta a média", "Baixa a média", "Alta"],
    LA: ["Alta", "Baixa", "Baixa", "Baixa", "Baixa a média", "NP a baixa"],
    "LA'": ["Alta a muito alta", "Baixa", "Baixa", "Baixa a média", "Baixa", "Baixa a média"],
    "LG'": ["Alta", "Baixa", "Baixa", "Baixa a alta", "Baixa", "Média a alta"],
  };
  // plasticidade (Anexo B): Alta IP > 30 / LL > 70; Média 7–30 / 30–70; Baixa < 7 / < 30
  function nivelPlast(LL, IP, np) {
    if (np) return "NP";
    var n = function (v, a, b) { return !ok(v) ? null : v > b ? 3 : v >= a ? 2 : 1; };
    var i = n(IP, 7, 30), l = n(LL, 30, 70), x = i !== null ? i : l;
    return x === null ? "" : ["", "baixa", "média", "alta"][x];
  }

  // ---------- gráfico da Figura A1 ----------
  function cores(opt) {
    return opt && opt.imprimir ? { eixo: "#333", grade: "#ddd", txt: "#222", dest: "#c0392b" } : { eixo: "var(--text-dim)", grade: "var(--border)", txt: "var(--text-dim)", dest: "#ff5c5c" };
  }
  function grafico(c, e, grupo, opt) {
    opt = opt || {};
    var k = cores(opt), W = opt.w || 560, H = opt.h || 340, m = { l: 52, r: 14, t: 12, b: 42 };
    function X(v) { return m.l + v / 2.5 * (W - m.l - m.r); }
    function Y(v) { return H - m.b - (v - 0.5) / 1.7 * (H - m.t - m.b); }
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
    for (var gx = 0; gx <= 2.5 + 1e-9; gx += 0.1) s += '<line x1="' + X(gx) + '" y1="' + m.t + '" x2="' + X(gx) + '" y2="' + (H - m.b) + '" stroke="' + k.grade + '" stroke-width="' + (Math.abs(gx * 2 - Math.round(gx * 2)) < 1e-6 ? 0.8 : 0.3) + '"/>';
    for (var gy = 0.5; gy <= 2.2 + 1e-9; gy += 0.1) s += '<line x1="' + m.l + '" y1="' + Y(gy) + '" x2="' + (W - m.r) + '" y2="' + Y(gy) + '" stroke="' + k.grade + '" stroke-width="0.4"/><text x="' + (m.l - 5) + '" y="' + (Y(gy) + 4) + '" text-anchor="end" fill="' + k.txt + '">' + fmt(gy, 1) + "</text>";
    [0, 0.5, 1, 1.5, 2, 2.5].forEach(function (v) { s += '<text x="' + X(v) + '" y="' + (H - m.b + 15) + '" text-anchor="middle" fill="' + k.txt + '">' + fmt(v, 1) + "</text>"; });
    s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + k.eixo + '" stroke-width="1.5"/>' +
      '<text x="' + ((W + m.l - m.r) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + k.txt + '">Coeficiente c\'</text>' +
      '<text transform="translate(14 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + k.txt + '">Índice e\'</text>';
    function ln(pts, tr) { return '<path d="' + pts.map(function (p, i) { return (i ? "L" : "M") + X(p[0]).toFixed(1) + " " + Y(p[1]).toFixed(1); }).join(" ") + '" fill="none" stroke="' + k.eixo + '" stroke-width="2"' + (tr ? ' stroke-dasharray="6 4"' : "") + "/>"; }
    s += ln([[0.27, 2.2], [0.45, 1.75], [0.59, 1.4]]) + ln([[0.59, 1.4], [0.7, 1.15]], 1) + ln([[0, 1.4], [0.59, 1.4]], 1) + ln([[0.45, 1.75], [1.7, 1.15]]) +
      ln([[1.5, 2.2], [1.5, eNS(1.5)]]) + ln([[1.5, 0.5], [1.5, 1.15]]) + ln([[0.7, 0.5], [0.7, 1.15]]) + ln([[0.7, 1.15], [2.5, 1.15]], 1);
    [[0.18, 1.8, "NA"], [0.95, 1.95, "NS'"], [0.95, 1.35, "NA'"], [2.0, 1.75, "NG'"], [0.35, 0.9, "LA"], [1.1, 0.8, "LA'"], [2.0, 0.8, "LG'"]].forEach(function (t) {
      s += '<text x="' + X(t[0]) + '" y="' + Y(t[1]) + '" text-anchor="middle" fill="' + k.txt + '" font-weight="bold" font-size="13">' + t[2] + "</text>";
    });
    if (ok(c) && ok(e)) {
      var cx = Math.min(Math.max(c, 0), 2.5), ey = Math.min(Math.max(e, 0.5), 2.2);
      s += '<circle cx="' + X(cx) + '" cy="' + Y(ey) + '" r="6" fill="' + k.dest + '"/>' +
        '<text x="' + Math.min(X(cx) + 9, W - m.r - 120) + '" y="' + (Y(ey) - 8) + '" fill="' + k.dest + '" font-weight="bold">' + esc((grupo || "") + " (" + fmt(c, 2) + "; " + fmt(e, 2) + ")") + "</text>";
    }
    return s + "</svg>";
  }

  FE.mct = { eLN: eLN, cNA: cNA, eNS: eNS, grupoL: grupoL, classificar: classificar, GRUPOS: GRUPOS, PROP: PROP, PROP_ROT: PROP_ROT, grafico: grafico };

  var SNI = [["", "— não determinado —"], ["sim", "Sim"], ["nao", "Não"]];
  function simNao(v) { return v === "sim" ? true : v === "nao" ? false : null; }

  FE.FICHAS["dnit-259-2023-cla"] = {
    titulo: "Solos finos tropicais — Classificação MCT",
    rotuloImportar: function (r) { return "c' " + fmt(r.c, 2) + " · e' " + fmt(r.e, 2) + " · " + (r.grupo || "—"); },
    resumo: "Classificação MCT (Miniatura, Compactado, Tropical) a partir de c', d' e Pi' do ensaio Mini-MCV (DNIT 258-ME): índice e', grupo pelo gráfico da Figura A1, propriedades típicas (Anexo B) e descrição (Anexo C).",
    blocos: [],
    params: [
      { k: "imp258", r: "Importar c', d', Pi' e critérios de um ensaio Mini-MCV (DNIT 258)", tipo: "importar", de: "dnit-258-2023-me",
        dica: "copia c', d', AF₁₀, Pi com Mini-MCV 10 e 15 e os critérios de 5.1 c",
        aplicar: function (e, P, d) {
          var r = e.resultados || {}, dd = e.dados || {};
          var f = function (v, c) { return ok(v) ? fmt(v, c).replace(/\./g, "") : ""; };
          P.c = f(r.c, 3); P.d = f(r.d, 2); P.AF10 = f(r.AF10, 2); P.PiL = f(r.PiL, 1); P.modoPi = "direto";
          // Pi em Mini-MCV 10 e 15 (se o ensaio salvo trouxer os CPs)
          var cps = (r.cps || []).filter(function (o) { return ok(o.mcv) && ok(o.Pi); }).sort(function (a, b) { return a.mcv - b.mcv; });
          function interp(x) {
            for (var i = 1; i < cps.length; i++) if (x >= cps[i - 1].mcv && x <= cps[i].mcv && cps[i].mcv !== cps[i - 1].mcv) return cps[i - 1].Pi + (cps[i].Pi - cps[i - 1].Pi) * (x - cps[i - 1].mcv) / (cps[i].mcv - cps[i - 1].mcv);
            return NaN;
          }
          P.Pi10 = f(interp(10), 1); P.Pi15 = f(interp(15), 1);
          if (P.AF10 && (P.Pi10 || P.Pi15)) P.modoPi = "curva";
          P.piNeg = r.piNeg === true ? "sim" : r.piNeg === false ? "nao" : "";
          P.concCima = r.concCima === true ? "sim" : r.concCima === false ? "nao" : "";
          P.serie = r.serie === "Parsons" ? "pars" : "simp";
          P.origem258 = ((dd.ident || {}).registro || "exemplo") + ((dd.ident || {}).origem ? " · " + dd.ident.origem : "") + " — DNIT 258: grupo " + (r.grupo || "—");
        } },
      { k: "origem258", r: "Ensaio Mini-MCV de origem" },
      { k: "serie", r: "Série de golpes do Mini-MCV (para d')", tipo: "select", opcoes: [["simp", "Simplificada — d' da curva de 10 golpes"], ["pars", "Parsons — d' da curva de 12 golpes"]] },
      { k: "c", r: "Coeficiente de argilosidade c' (3.4)" },
      { k: "d", r: "Coeficiente d' (kg/m³/%) (3.6)" },
      { k: "modoPi", r: "Pi' (3.8)", tipo: "select", recarrega: true,
        opcoes: [["curva", "Calcular: AF e Pi com Mini-MCV = 10 e 15"], ["direto", "Pi' já determinado"], ["eDireto", "e' já calculado (sem d' e Pi')"]] },
      { k: "AF10", r: "Altura final AF com Mini-MCV = 10 (mm) — 3.8 b", se: function (d) { return ((d.params || {}).modoPi || "curva") === "curva"; } },
      { k: "Pi10", r: "Pi com Mini-MCV = 10 (%)", se: function (d) { return ((d.params || {}).modoPi || "curva") === "curva"; } },
      { k: "Pi15", r: "Pi com Mini-MCV = 15 (%)", se: function (d) { return ((d.params || {}).modoPi || "curva") === "curva"; } },
      { k: "PiL", r: "Pi' (%)", se: function (d) { return (d.params || {}).modoPi === "direto"; } },
      { k: "eMan", r: "Índice e'", se: function (d) { return (d.params || {}).modoPi === "eDireto"; } },
      { k: "piNeg", r: "Curva Pi × Mini-MCV com inclinação negativa entre 10 e 15? (5.1 c)", tipo: "select", opcoes: SNI },
      { k: "concCima", r: "Curva Mini-MCV × hc com concavidade para cima? (5.1 c)", tipo: "select", opcoes: SNI },
      { k: "tol", r: "Distância à linha L/N considerada \"próxima\" (Δe')", ph: "0,05", dica: "a norma não fixa a distância (5.1 c)" },
      { k: "massa", r: "Massa da amostra passando na peneira nº 10 (kg) — 4", dica: "mínimo de 2,5 kg" },
      { k: "impLim", r: "Importar LL e IP (DNER-ME 082) — informativo", tipo: "importar", de: "dner-me-082-94",
        dica: "compara a plasticidade medida com a típica do grupo (Anexo B)",
        aplicar: function (e, P) {
          var r = e.resultados || {};
          P.LL = r.llNP ? "NP" : ok(r.LL) ? fmt(r.LL, 0) : P.LL || "";
          P.IP = r.ipNP ? "NP" : ok(r.IP) ? fmt(r.IP, 0) : "";
        } },
      { k: "impLL", r: "…ou só o LL (DNER-ME 122)", tipo: "importar", de: "dner-me-122-94",
        aplicar: function (e, P) { var r = e.resultados || {}; P.LL = r.np ? "NP" : ok(r.LL) ? fmt(r.LL, 0) : ""; } },
      { k: "LL", r: "Limite de liquidez LL (%) — opcional" },
      { k: "IP", r: "Índice de plasticidade IP (%) — opcional", ph: "número ou NP" },
    ],
    padrao: { serie: "simp", modoPi: "curva", piNeg: "", concCima: "" },
    tabelas: function () { return []; },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], modo = P.modoPi || "curva";
      var r = { c: num(P.c), d: num(P.d), AF10: num(P.AF10), Pi10: num(P.Pi10), Pi15: num(P.Pi15), modo: modo };
      if (modo === "curva") {
        if (ok(r.AF10)) {
          r.baixa = r.AF10 >= 48;                 // 3.8 b / c: AF ≥ 48,0 mm → baixa densidade
          r.mcvPi = r.baixa ? 10 : 15;
          r.PiL = r.baixa ? r.Pi10 : r.Pi15;
          if (!ok(r.PiL)) avisos.push("Informe Pi com Mini-MCV = " + r.mcvPi + " (solo de " + (r.baixa ? "baixa" : "alta") + " densidade, 3.8 c).");
        } else avisos.push("Informe AF com Mini-MCV = 10 para decidir entre Pi com Mini-MCV = 10 ou 15 (3.8 b).");
      } else if (modo === "direto") r.PiL = num(P.PiL);
      if (ok(r.PiL) && r.PiL < 0) r.PiL = 0;
      // e' (eq. 1)
      if (modo === "eDireto") r.e = num(P.eMan);
      else if (ok(r.PiL) && ok(r.d) && r.d > 0) r.e = Math.cbrt(r.PiL / 100 + 20 / r.d);
      else r.e = NaN;
      if (ok(r.d) && r.d <= 0) avisos.push("d' deve ser positivo (inclinação do ramo seco da curva de compactação, 3.6).");
      if (!ok(r.c)) avisos.push("Informe o coeficiente c' (3.4).");
      if (modo !== "eDireto" && !ok(r.d)) avisos.push("Informe o coeficiente d' (3.6).");
      r.grupoGrafico = FE.mct.classificar(r.c, r.e);
      r.grupo = r.grupoGrafico;
      // pontos próximos da linha L/N (5.1 c)
      var tol = ok(num(P.tol)) ? num(P.tol) : 0.05, pn = simNao(P.piNeg), cc = simNao(P.concCima);
      r.proximo = ok(r.c) && ok(r.e) ? Math.abs(r.e - eLN(r.c)) <= tol : false;
      if (r.proximo) {
        var crit = pn === true && cc === true, falta = pn === null || cc === null;
        if (r.grupo.charAt(0) === "N" && crit) {
          r.grupo = grupoL(r.c);
          r.obs = "Ponto próximo da linha L/N (Δe' ≤ " + fmt(tol, 2) + ") e atende aos dois critérios de 5.1 c: considerado laterítico — " + r.grupo + " (no gráfico cai em " + r.grupoGrafico + ").";
        } else if (r.grupo.charAt(0) === "L" && !crit) {
          r.grupo = falta ? r.grupo : (FE.mct.classificar(r.c, eLN(r.c) + 1e-6) || r.grupo);
          r.obs = falta ? "Ponto próximo da linha L/N: informe os dois critérios de 5.1 c (Pi × Mini-MCV e Mini-MCV × hc) para confirmar o comportamento laterítico."
            : "Ponto próximo da linha L/N que não atende aos dois critérios de 5.1 c: não pode ser considerado laterítico — adotado " + r.grupo + " (no gráfico cai em " + r.grupoGrafico + ").";
        } else if (r.grupo.charAt(0) === "N") {
          r.obs = "Ponto próximo da linha L/N" + (falta ? ": informe os critérios de 5.1 c para verificar se pode ser considerado laterítico." : ", mas não atende aos dois critérios de 5.1 c — mantido como não laterítico.");
        } else r.obs = "Ponto próximo da linha L/N; atende aos dois critérios de 5.1 c — laterítico confirmado.";
        if (falta) avisos.push("Ponto próximo da linha L/N: a classificação depende dos critérios de 5.1 c (inclinação de Pi × Mini-MCV e concavidade de Mini-MCV × hc).");
      }
      var massa = num(P.massa);
      if (ok(massa) && massa < 2.5) avisos.push("Amostra de " + fmt(massa, 2) + " kg: a norma exige no mínimo 2,5 kg de fração passando na peneira nº 10 (seção 4).");
      // plasticidade medida × típica (Anexo B) — informativo
      var np = /^np$/i.test(String(P.IP || "").trim()) || /^np$/i.test(String(P.LL || "").trim());
      r.LL = num(P.LL); r.IP = num(P.IP); r.plast = nivelPlast(r.LL, r.IP, np);
      if (r.plast && r.grupo && PROP[r.grupo]) {
        // faixa típica "X a Y" em níveis ordenados: NP < baixa < média < alta
        var NIV = { np: 0, baixa: 1, "média": 2, alta: 3 }, tip = PROP[r.grupo][5].toLowerCase().split(" a ").map(function (w) { return NIV[w.trim()]; });
        var med = NIV[r.plast.toLowerCase()];
        r.plastTip = PROP[r.grupo][5];
        r.plastConf = med >= Math.min.apply(null, tip) && med <= Math.max.apply(null, tip);
        if (!r.plastConf) avisos.push("Plasticidade medida " + r.plast + (ok(r.IP) ? " (IP " + fmt(r.IP, 0) + " %)" : "") + " diferente da típica do grupo " + r.grupo + " (" + PROP[r.grupo][5].toLowerCase() + ", Anexo B) — informativo; confira o ensaio.");
      }
      return { tab: {}, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, g = GRUPOS[r.grupo];
      function cx(v, u, rot, p) { return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + " <small>" + u + '</small></div><div class="fe-res-r">' + rot + "</div></div>"; }
      var h = '<div class="fe-res">' + cx(r.grupo ? esc(r.grupo) : "—", "", g ? esc(g.nome) + " — Figura A1" : "Grupo MCT (Figura A1)") +
        cx(fmt(r.e, 2), "", "Índice de laterização e' (eq. 1)") + cx(fmt(r.c, 2), "", "Coeficiente c'") + cx(fmt(r.d, 1), "kg/m³/%", "Coeficiente d'") +
        cx(fmt(r.PiL, 0), "%", "Pi'" + (r.mcvPi ? " — Pi com Mini-MCV = " + r.mcvPi + " (" + (r.baixa ? "baixa" : "alta") + " densidade, AF₁₀ = " + fmt(r.AF10, 1) + " mm)" : "")) + "</div>";
      if (r.obs) h += "<p>" + esc(r.obs) + "</p>";
      if (g) {
        h += '<table class="fe-resumo"><tr><th colspan="2">Grupo ' + esc(r.grupo) + " — propriedades típicas (Anexo B) e descrição (Anexo C)</th></tr>" +
          PROP_ROT.map(function (t, i) { return "<tr><td>" + esc(t) + "</td><td>" + esc(PROP[r.grupo][i]) + (i === 5 && r.plast ? " — medida: " + esc(r.plast) : "") + "</td></tr>"; }).join("") +
          "<tr><td>Descrição</td><td>" + esc(g.desc) + "</td></tr><tr><td>Correlação (Embrapa / geologia)</td><td>" + esc(g.corr) + "</td></tr></table>";
      }
      return h;
    },
    graficos: function (calc, d, opt) { var r = calc.resultados; return [grafico(r.c, r.e, r.grupo, opt)]; },
    relatorio: {
      notas: "Pi' = Pi com Mini-MCV = 10 se AF (Mini-MCV = 10) ≥ 48,0 mm (baixa densidade), senão Pi com Mini-MCV = 15 (3.8); e' = ∛(Pi'/100 + 20/d') — a eq. 1 está impressa com índice \"S\" na raiz; adotada a raiz cúbica da metodologia MCT. Grupo pela posição (c'; e') na Figura A1; ponto próximo da linha L/N é laterítico só se Pi × Mini-MCV tiver inclinação negativa entre 10 e 15 e Mini-MCV × hc for côncava para cima (5.1 c). No gráfico, a vertical c' = 1,5 só separa NS' de NG' acima da linha NS'/NA'; entre c' = 1,5 e 1,7, abaixo dessa linha e acima de e' = 1,15, o solo é NA'. Propriedades típicas: Anexo B; descrições: Anexo C.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, g = GRUPOS[r.grupo];
        var rows = [];
        if (P.origem258) rows.push(["Ensaio Mini-MCV (DNIT 258)", P.origem258]);
        rows.push(["Coeficientes c' / d'", fmt(r.c, 2) + " / " + fmt(r.d, 1) + " kg/m³/% (curva de " + (P.serie === "pars" ? "12" : "10") + " golpes)"]);
        if (r.modo === "curva") rows.push(["AF com Mini-MCV = 10", fmt(r.AF10, 1) + " mm — " + (r.baixa === undefined ? "—" : r.baixa ? "baixa densidade" : "alta densidade")]);
        rows.push(["Pi'", fmt(r.PiL, 0) + " %" + (r.mcvPi ? " (Pi com Mini-MCV = " + r.mcvPi + ")" : "")],
          ["Índice de laterização e'", fmt(r.e, 2)],
          ["Classificação MCT", r.grupo ? r.grupo + " — " + g.nome : "—"]);
        if (r.obs) rows.push(["Observação (5.1 c)", r.obs]);
        if (g) rows.push(["Propriedades típicas (Anexo B)", PROP_ROT.map(function (t, i) { return t + ": " + PROP[r.grupo][i].toLowerCase(); }).join("; ")],
          ["Descrição (Anexo C)", g.desc + " Correlação: " + g.corr + "."]);
        if (r.plast) rows.push(["Plasticidade medida (informativo)", (ok(r.LL) ? "LL " + fmt(r.LL, 0) + " %; " : "") + (ok(r.IP) ? "IP " + fmt(r.IP, 0) + " %; " : "") + r.plast + " — típica do grupo: " + (r.plastTip || "—").toLowerCase()]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Importado do exemplo da norma DNIT 258 (Figura A8)", dados: function () {
        var d = { ident: { registro: "EX-MCT-001", camada: "Solo fino tropical (exemplo da DNIT 258)", origem: "Figura A8 da DNIT 258" },
          params: { serie: "simp", modoPi: "curva", tol: "0,05", massa: "3,0" } };
        var ens = { dados: FE.FICHAS["dnit-258-2023-me"].exemplos[0].dados() };
        ens.dados.params = Object.assign({}, FE.FICHAS["dnit-258-2023-me"].padrao, ens.dados.params);
        ens.resultados = FE.FICHAS["dnit-258-2023-me"].calcular(ens.dados).resultados;
        d.params.imp258 = "ex:dnit-258-2023-me:0";
        FE.FICHAS["dnit-259-2023-cla"].params[0].aplicar(ens, d.params, d);
        return d;
      } },
      { nome: "Argila arenosa laterítica — valores digitados (LA')", dados: function () {
        return { ident: { registro: "EX-MCT-002", obra: "Obra A", camada: "Subleito — argila arenosa vermelha", origem: "Jazida 2" },
          params: { serie: "simp", c: "1,20", d: "65", modoPi: "curva", AF10: "46,5", Pi10: "40", Pi15: "12", piNeg: "sim", concCima: "sim", massa: "3,2", LL: "38", IP: "14" } };
      } },
      { nome: "Solo arenoso próximo da linha L/N sem os critérios de 5.1 c, amostra pequena (NA')", dados: function () {
        return { ident: { registro: "EX-MCT-003", obra: "Obra B", camada: "Corte — areia siltosa de alteração", origem: "Jazida 5" },
          params: { serie: "pars", c: "1,05", d: "22", modoPi: "direto", PiL: "60", piNeg: "nao", concCima: "sim", massa: "1,8", LL: "62", IP: "33" } };
      } },
    ],
  };
})();
