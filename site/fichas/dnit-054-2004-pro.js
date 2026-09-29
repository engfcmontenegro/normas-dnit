/*
 * Ficha: DNIT 054/2004-PRO — Pavimento rígido — Estudos de traços de concreto e ensaios de caracterização de materiais.
 * Registra-se no motor de site/fichas.js (window.FE).
 * - Materiais (3.1, 3.2, 6.1): identificação e caracterização (digitadas ou importadas das fichas DNIT 050-EM,
 *   462-EM, 454-EM, 036-ME e 037-ME).
 * - Requisitos (4): dimensão máxima do agregado (1/5 a 1/4 da espessura da placa, ≤ 50 mm), consistência pelo
 *   abatimento (≥ 20 mm) ou VeBe (< 20 mm), consumo ≥ 320 kg/m³, a/c de 0,40 a 0,56, ar ≤ 0,5 %, exsudação ≤ 1,5 %.
 * - Traços experimentais (5.1 d, ≥ 3): consumo teórico pelas massas específicas, resultados no estado fresco e
 *   endurecido (abatimento/VeBe e resistência à compressão importáveis das fichas DNER-ME 404, DNIT 064 e DNER-ME 091).
 * - Traço final (5.3): fctM,j = fctM,k + 0,84·Sd (e fc,j = fck + 0,84·Sd), Sd conhecido (≥ 20 resultados) ou pelo
 *   padrão de qualidade (rigoroso 0,6/4,0 MPa; razoável 0,9/5,5 MPa); correlações f × a/c (lei de Abrams,
 *   ln f = ln A − (a/c)·ln B) e fctM × fc (reta), a/c do traço final, consumo e traço unitário pelo diagrama de dosagem
 *   (Lyse: m = k3 + k4·a/c; Molinari: 1000/C = k5 + k6·m) — método de dosagem livre na norma (5.1).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  var AC_MIN = 0.40, AC_MAX = 0.56, C_MIN = 320, AR_MAX = 0.5, EXS_MAX = 1.5, DMAX_ABS = 50;  // 4.3
  var SD = { rigoroso: { f: 0.6, c: 4.0 }, razoavel: { f: 0.9, c: 5.5 } };  // 5.3
  var K_QUANTIL = 0.84;  // 5.3

  // regressão linear y = a + b x
  function reta(xs, ys) {
    var n = xs.length;
    if (n < 2) return null;
    var mx = media(xs), my = media(ys), sxx = 0, sxy = 0, syy = 0;
    for (var i = 0; i < n; i++) { sxx += (xs[i] - mx) * (xs[i] - mx); sxy += (xs[i] - mx) * (ys[i] - my); syy += (ys[i] - my) * (ys[i] - my); }
    if (!sxx) return null;
    var b = sxy / sxx;
    return { a: my - b * mx, b: b, r2: syy ? sxy * sxy / (sxx * syy) : 1, n: n };
  }
  // lei de Abrams f = A / B^x  ->  ln f = ln A − x ln B
  function abrams(xs, fs) {
    var r = reta(xs, fs.map(Math.log));
    if (!r || r.b >= 0) return r ? { erro: true } : null;
    return { A: Math.exp(r.a), B: Math.exp(-r.b), r2: r.r2, n: r.n, f: function (x) { return Math.exp(r.a + r.b * x); }, x: function (f) { return (Math.log(f) - r.a) / r.b; } };
  }
  function linhaMat(e) {
    var fid = e.ficha, r = e.resultados || {}, i = (e.dados || {}).ident || {}, P = (e.dados || {}).params || {};
    var nome = fid === "dnit-050-2004-em" ? "Cimento " + (r.classe || "") : fid === "dnit-462-2025-em" ? "Agregado — " + (r.classe || "") : "Água";
    var O = FE.FICHAS[fid], par = r.parecer ? r.parecer.titulo : O && O.rotuloImportar ? O.rotuloImportar(r) : "";
    var norma = { "dnit-050-2004-em": "DNIT 050-EM", "dnit-462-2025-em": "DNIT 462-EM", "dnit-454-2025-em": "DNIT 454-EM", "dnit-036-2004-me": "DNIT 036-ME", "dnit-037-2004-me": "DNIT 037-ME" }[fid] || fid;
    var ids = [P.fornecedor, i.origem, i.local].filter(function (x, k, a) { return x && a.indexOf(x) === k && !a.some(function (y) { return y !== x && y && String(y).indexOf(x) >= 0; }); });
    return { mat: nome, id: ids.join(" · "), data: String(i.data || "").split("-").reverse().join("/"), res: norma + " — " + par, reg: i.registro || (e.exemplo ? "exemplo" : ""), imp: fid };
  }
  function garantirTracos(d, n) { d.tr = d.tr || []; while (d.tr.length < n) d.tr.push({}); }
  function anexarOrigem(t, txt) { var o = String(t.orig || ""); if (o.indexOf(txt) < 0) t.orig = o ? o + "; " + txt : txt; }

  FE.FICHAS["dnit-054-2004-pro"] = {
    titulo: "Pavimento rígido — estudo de traço de concreto",
    rotuloImportar: function (r) { return ok(r.acFinal) ? "a/c " + fmt(r.acFinal, 2) + (ok(r.Cfin) ? " · C " + fmt(r.Cfin, 0) + " kg/m³" : "") + " · fctM,j " + fmt(r.fctj, 2) + " MPa" : "—"; },
    resumo: "Requisitos da seção 4 (Dmáx, consistência, consumo ≥ 320 kg/m³, a/c 0,40–0,56, ar ≤ 0,5 %, exsudação ≤ 1,5 %), traços experimentais (≥ 3), resistência de dosagem fctM,j = fctM,k + 0,84·Sd (5.3), correlações com a/c e entre fctM e fc, a/c, consumo e traço final.",
    blocos: [],
    params: [
      { k: "impMat", r: "Materiais: importar caracterizações salvas (DNIT 050-EM, 462-EM, 454-EM, 036-ME, 037-ME)", tipo: "importarVarios",
        de: ["dnit-050-2004-em", "dnit-462-2025-em", "dnit-454-2025-em", "dnit-036-2004-me", "dnit-037-2004-me"],
        dica: "cada ensaio escolhido vira uma coluna da tabela de materiais (colunas digitadas são mantidas)",
        aplicar: function (lista, P, d) {
          var novos = lista.map(linhaMat), regs = novos.map(function (x) { return x.imp + "|" + x.reg; });
          d.mat = (d.mat || []).filter(function (m) { return (m.mat || m.id || m.res) && (!m.imp || regs.indexOf(m.imp + "|" + m.reg) < 0); }).concat(novos);
        } },
      { k: "impCons", r: "Traços: importar consistência (DNER-ME 404 abatimento / DNIT 064 VeBe)", tipo: "importarVarios", de: ["dner-me-404-00", "dnit-064-2004-me"],
        dica: "o 1º ensaio escolhido vai para o 1º traço, o 2º para o 2º… (média das determinações)",
        aplicar: function (lista, P, d) {
          garantirTracos(d, lista.length);
          lista.forEach(function (e, j) {
            var r = e.resultados || {}, t = d.tr[j], reg = ((e.dados || {}).ident || {}).registro || "exemplo";
            if (e.ficha === "dnit-064-2004-me") { if (ok(r.med)) t.vebe = fmt(r.med, 1); anexarOrigem(t, "VeBe: " + reg); }
            else { var v = (r.ens || []).map(function (x) { return x.abr; }).filter(ok); if (v.length) t.abat = fmt(media(v), 0); anexarOrigem(t, "abatimento: " + reg); }
          });
        } },
      { k: "impFc", r: "Traços: importar resistência à compressão (DNER-ME 091)", tipo: "importarVarios", de: "dner-me-091-98",
        dica: "o 1º ensaio escolhido vai para o 1º traço…; média dos resultados na idade j (ou de todos, se nenhum na idade j)",
        aplicar: function (lista, P, d) {
          garantirTracos(d, lista.length);
          var j = num(P.idade) || 28;
          lista.forEach(function (e, k) {
            var l = ((e.resultados || {}).lista || []).filter(function (x) { return ok(x.fc); }), na = l.filter(function (x) { return x.idade === j; });
            var v = media((na.length ? na : l).map(function (x) { return x.fc; }));
            if (ok(v)) d.tr[k].fc = fmt(v, 1);
            anexarOrigem(d.tr[k], "fc: " + (((e.dados || {}).ident || {}).registro || "exemplo"));
          });
        } },
      { k: "metodo", r: "Método de dosagem adotado (5.1)", ph: "ex.: método do diagrama de dosagem (Abrams–Lyse–Molinari)" },
      { k: "esp", r: "Espessura da placa (mm)", ph: "220", dica: "Dmáx do agregado de 1/5 a 1/4 da espessura, nunca superior a 50 mm (4.3; 5.1 a)" },
      { k: "dmax", r: "Dimensão máxima do agregado graúdo adotada (mm)", ph: "38" },
      { k: "consist", r: "Consistência especificada (4.2)", tipo: "select", opcoes: [["abat", "Abatimento — NBR NM 67 (concreto plástico, ≥ 20 mm)"], ["vebe", "Índice VeBe — DNIT 064-ME (concreto seco, abatimento < 20 mm)"]] },
      { k: "consEsp", r: "Consistência especificada (mm de abatimento ou s de VeBe)", ph: "40" },
      { k: "fctmk", r: "fctM,k — resistência característica à tração na flexão (MPa)", ph: "4,5" },
      { k: "fck", r: "fck — resistência característica à compressão (MPa) — opcional", dica: "só quando houver correlação confiável com a tração na flexão, com materiais semelhantes (4.1)" },
      { k: "idade", r: "Idade j de controle (dias)", ph: "28" },
      { k: "sdModo", r: "Desvio-padrão Sd (5.3)", tipo: "select", recarrega: true, opcoes: [["rigoroso", "Padrão rigoroso — Sd = 0,6 MPa (flexão) / 4,0 MPa (compressão)"],
        ["razoavel", "Padrão razoável — Sd = 0,9 MPa (flexão) / 5,5 MPa (compressão)"], ["conhecido", "Conhecido — desvio-padrão de ≥ 20 resultados da obra"]] },
      { k: "sdF", r: "Sd conhecido — tração na flexão (MPa)", se: function (d) { return (d.params || {}).sdModo === "conhecido"; } },
      { k: "sdC", r: "Sd conhecido — compressão (MPa)", se: function (d) { return (d.params || {}).sdModo === "conhecido"; } },
      { k: "sdN", r: "Nº de resultados que deram o Sd", se: function (d) { return (d.params || {}).sdModo === "conhecido"; } },
      { k: "gc", r: "Massa específica do cimento (g/cm³)", ph: "3,10" },
      { k: "ga", r: "Massa específica do agregado miúdo (g/cm³)", ph: "2,63" },
      { k: "gb", r: "Massa específica do agregado graúdo (g/cm³)", ph: "2,70", dica: "com as massas específicas a ficha calcula o consumo teórico: C = (1000 − 10·ar) / (1/γc + a/γa + p/γb + a/c)" },
    ],
    padrao: { consist: "abat", idade: "28", sdModo: "rigoroso", gc: "3,10" },
    tabelas: function () {
      return [
        { chave: "mat", titulo: "Materiais constituintes (3.2; 6.1)", rotulo: "Material", iniciais: 4, min: 1,
          dica: "cimento: marca, tipo e classe; agregados: origem e fornecedor; água: origem; aditivos: marca, tipo e dosagem (6.1)",
          linhas: [
            { k: "mat", r: "Material", texto: true, ph: "Cimento CP III-40" },
            { k: "id", r: "Marca / tipo / origem / fornecedor / dosagem", texto: true },
            { k: "data", r: "Data da amostragem", texto: true },
            { k: "res", r: "Caracterização (3.2) — resultado / parecer", texto: true, ph: "DNIT 462-EM — lote aceito" },
          ] },
        { chave: "tr", titulo: "Traços experimentais (5.1 d; 5.2)", rotulo: "Traço", iniciais: 3, min: 1,
          dica: "traço unitário em massa 1 : a : p; ar, consistência e exsudação no concreto fresco; resistências na idade j",
          linhas: [
            { k: "id", r: "Traço", texto: true, ph: "T1" },
            { grupo: "Traço unitário (em massa) e consumo" },
            { k: "a", r: "Agregado miúdo a (kg/kg de cimento)", u: "" },
            { k: "p", r: "Agregado graúdo p (kg/kg de cimento)", u: "" },
            { k: "ac", r: "Relação água/cimento", u: "" },
            { k: "C", r: "Consumo de cimento medido (vazio = teórico)", u: "kg/m³" },
            { calc: "m", r: "m = a + p", u: "", casas: 2 },
            { calc: "alfa", r: "Teor de argamassa α = (1 + a)/(1 + m)", u: "%", casas: 1 },
            { calc: "Cteo", r: "Consumo teórico", u: "kg/m³", casas: 0 },
            { calc: "Cad", r: "Consumo adotado", u: "kg/m³", casas: 0, destaque: true },
            { grupo: "Concreto fresco (5.2.1)" },
            { k: "abat", r: "Abatimento — NBR NM 67", u: "mm" },
            { k: "vebe", r: "Índice VeBe — DNIT 064-ME", u: "s" },
            { k: "ar", r: "Teor de ar incorporado — NBR NM 47", u: "%" },
            { k: "exs", r: "Exsudação — NBR NM 102 (recomendada)", u: "%" },
            { k: "pega", r: "Tempos de pega — NBR 9832 (início/fim)", texto: true, ph: "4h10 / 6h05" },
            { grupo: "Concreto endurecido (5.2.2), idade j" },
            { k: "fct", r: "Tração na flexão fctM — NBR 12142", u: "MPa" },
            { k: "fc", r: "Compressão fc — NBR 5739", u: "MPa" },
            { k: "fcd", r: "Tração por compressão diametral (optativa)", u: "MPa" },
            { k: "orig", r: "Registros importados / observações", texto: true },
          ] },
      ];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], r = { req: [] };
      function req(item, valor, exig, sit) { r.req.push({ item: item, valor: valor, exig: exig, sit: sit }); }
      // ---------- materiais ----------
      var mats = (d.mat || []).filter(function (m) { return String(m.mat || "").trim() || String(m.res || "").trim(); });
      r.mats = mats;
      if (!mats.length) avisos.push("Registre os materiais constituintes e os resultados da caracterização (3.2; 6.1).");
      mats.forEach(function (m) {
        if (/rejeit|não satisf|nao satisf|fora dos limites|não atende/i.test(m.res || "")) avisos.push("Material \"" + (m.mat || "?") + "\": caracterização não satisfatória (" + m.res + ") — os materiais do estudo devem ser de fontes consideradas adequadas (3.1; 3.2).");
        if (!String(m.data || "").trim()) avisos.push("Material \"" + (m.mat || "?") + "\": informe a data da amostragem (6.1).");
      });
      ["cimento", "miúdo|areia", "graúdo|brita", "água"].forEach(function (k) {
        if (mats.length && !mats.some(function (m) { return new RegExp(k, "i").test((m.mat || "") + " " + (m.res || "")); })) avisos.push("Falta a caracterização de: " + k.split("|")[0] + " (3.2).");
      });
      // ---------- Dmáx ----------
      var esp = num(P.esp), dmax = num(P.dmax);
      if (ok(esp)) {
        r.dmin = esp / 5; r.dmaxLim = Math.min(esp / 4, DMAX_ABS);
        if (ok(dmax)) {
          var okD = dmax <= r.dmaxLim + 1e-9 && dmax <= DMAX_ABS;
          req("Dimensão máxima do agregado graúdo (4.3)", fmt(dmax, 1) + " mm", "1/5 a 1/4 da espessura (" + fmt(r.dmin, 1) + " a " + fmt(esp / 4, 1) + " mm) e ≤ 50 mm", okD ? (dmax < r.dmin - 1e-9 ? "abaixo" : "ok") : "nok");
          if (!okD) avisos.push("Dmáx de " + fmt(dmax, 1) + " mm acima do limite de " + fmt(r.dmaxLim, 1) + " mm (1/4 da espessura de " + fmt(esp, 0) + " mm, nunca superior a 50 mm — 4.3).");
          else if (dmax < r.dmin - 1e-9) avisos.push("Dmáx de " + fmt(dmax, 1) + " mm abaixo de 1/5 da espessura (" + fmt(r.dmin, 1) + " mm) — a norma indica de 1/5 a 1/4 da espessura (4.3).");
        }
      } else avisos.push("Informe a espessura da placa para verificar a dimensão máxima do agregado (4.3; 5.1 a).");
      // ---------- consistência especificada ----------
      var ce = num(P.consEsp);
      if (P.consist === "abat" && ok(ce) && ce < 20) avisos.push("Abatimento especificado de " + fmt(ce, 0) + " mm < 20 mm: concreto seco — a consistência deve ser medida pelo índice VeBe (4.2.2).");
      // ---------- traços ----------
      var gc = num(P.gc), ga = num(P.ga), gb = num(P.gb), j = num(P.idade) || 28;
      var tracos = [];
      var tab = (d.tr || []).map(function (x, i) {
        var o = {}, a = num(x.a), p = num(x.p), ac = num(x.ac), ar = num(x.ar), nome = String(x.id || "").trim() || "Traço " + (i + 1);
        if (!ok(ac) && !ok(a) && !ok(num(x.fct)) && !ok(num(x.fc))) return o;
        if (ok(a) && ok(p)) { o.m = a + p; o.alfa = (1 + a) / (1 + o.m) * 100; }
        if (ok(a) && ok(p) && ok(ac) && ok(gc) && ok(ga) && ok(gb)) o.Cteo = (1000 - 10 * (ok(ar) ? ar : 0)) / (1 / gc + a / ga + p / gb + ac);
        o.Cad = ok(num(x.C)) ? num(x.C) : o.Cteo;
        var t = { nome: nome, ac: ac, m: o.m, alfa: o.alfa, C: o.Cad, ar: ar, exs: num(x.exs), abat: num(x.abat), vebe: num(x.vebe), fct: num(x.fct), fc: num(x.fc), fcd: num(x.fcd), falhas: [] };
        if (ok(ac) && (ac < AC_MIN - 1e-9 || ac > AC_MAX + 1e-9)) t.falhas.push("a/c " + fmt(ac, 2) + " fora de 0,40–0,56");
        if (ok(t.C) && t.C < C_MIN) t.falhas.push("consumo " + fmt(t.C, 0) + " < 320 kg/m³");
        if (ok(ar) && ar > AR_MAX) t.falhas.push("ar " + fmt(ar, 1) + " % > 0,5 %");
        if (ok(t.exs) && t.exs > EXS_MAX) t.falhas.push("exsudação " + fmt(t.exs, 1) + " % > 1,5 %");
        if (!ok(ar)) t.falhas.push("teor de ar não informado (NBR NM 47, 5.2.1)");
        if (P.consist === "abat" && ok(t.abat) && t.abat < 20) t.falhas.push("abatimento " + fmt(t.abat, 0) + " mm < 20 mm — usar o VeBe (4.2)");
        if (P.consist === "abat" && !ok(t.abat)) t.falhas.push("abatimento não informado (5.2.1)");
        if (P.consist === "vebe" && !ok(t.vebe)) t.falhas.push("índice VeBe não informado (5.2.1)");
        if (t.falhas.length) avisos.push(nome + ": " + t.falhas.join("; ") + " (4.3; 5.1 d).");
        tracos.push(t);
        return o;
      });
      r.tracos = tracos;
      if (tracos.length < 3) avisos.push("Foram estudados " + tracos.length + " traço(s): calcular e preparar no mínimo 3 traços experimentais (5.1 d).");
      var acs = tracos.map(function (t) { return t.ac; });
      if (tracos.length && !(gc && ga && gb) && tracos.some(function (t) { return !ok(t.C); })) avisos.push("Informe o consumo medido ou as massas específicas dos materiais para obter o consumo de cimento dos traços.");
      // ---------- Sd e resistências de dosagem ----------
      var sdF, sdC;
      if (P.sdModo === "conhecido") {
        sdF = num(P.sdF); sdC = num(P.sdC); var nsd = num(P.sdN);
        if (!ok(nsd) || nsd < 20) avisos.push("Sd conhecido só vale com pelo menos 20 resultados da mesma dosagem ou de concreto com o mesmo equipamento, organização e controle (5.3)" + (ok(nsd) ? " — informados " + nsd : "") + "; senão adote o padrão rigoroso ou razoável.");
        if (!ok(sdF)) avisos.push("Informe o Sd conhecido da tração na flexão.");
      } else { var s = SD[P.sdModo] || SD.rigoroso; sdF = s.f; sdC = s.c; }
      r.sdF = sdF; r.sdC = sdC;
      var fctmk = num(P.fctmk), fck = num(P.fck);
      if (!ok(fctmk)) avisos.push("Informe a resistência característica à tração na flexão fctM,k (4.1).");
      r.fctj = ok(fctmk) && ok(sdF) ? fctmk + K_QUANTIL * sdF : NaN;
      r.fcj = ok(fck) && ok(sdC) ? fck + K_QUANTIL * sdC : NaN;
      // ---------- correlações (5.3) ----------
      var pF = tracos.filter(function (t) { return ok(t.ac) && ok(t.fct) && t.fct > 0; }), pC = tracos.filter(function (t) { return ok(t.ac) && ok(t.fc) && t.fc > 0; });
      var pD = tracos.filter(function (t) { return ok(t.ac) && ok(t.fcd) && t.fcd > 0; }), pFC = tracos.filter(function (t) { return ok(t.fct) && ok(t.fc); });
      r.abF = pF.length >= 2 ? abrams(pF.map(function (t) { return t.ac; }), pF.map(function (t) { return t.fct; })) : null;
      r.abC = pC.length >= 2 ? abrams(pC.map(function (t) { return t.ac; }), pC.map(function (t) { return t.fc; })) : null;
      r.abD = pD.length >= 2 ? abrams(pD.map(function (t) { return t.ac; }), pD.map(function (t) { return t.fcd; })) : null;
      r.cFC = pFC.length >= 2 ? reta(pFC.map(function (t) { return t.fc; }), pFC.map(function (t) { return t.fct; })) : null;
      [["abF", "tração na flexão"], ["abC", "compressão"], ["abD", "compressão diametral"]].forEach(function (x) {
        if (r[x[0]] && r[x[0]].erro) { avisos.push("A " + x[1] + " não diminui com a relação a/c nos traços — correlação sem sentido físico; revise os resultados."); r[x[0]] = null; }
      });
      if (pF.length < 3) avisos.push("Correlação fctM × a/c com " + pF.length + " ponto(s) — são necessários os resultados dos (no mínimo) 3 traços (5.1 d; 5.3).");
      if (r.abF && r.abF.r2 < 0.9) avisos.push("Correlação fctM × a/c com R² = " + fmt(r.abF.r2, 3) + " — baixa aderência; confira os ensaios.");
      // a/c pela flexão (e pela compressão, se houver fck)
      if (r.abF && ok(r.fctj)) r.acF = r.abF.x(r.fctj);
      if (r.abC && ok(r.fcj)) r.acC = r.abC.x(r.fcj);
      else if (ok(fck) && !r.abC) avisos.push("fck informado mas sem correlação fc × a/c (faltam resultados de compressão).");
      var cand = [r.acF, r.acC].filter(ok);
      if (cand.length) {
        r.acCalc = Math.min.apply(null, cand);
        r.governa = ok(r.acC) && r.acC < r.acF ? "compressão" : "tração na flexão";
        r.acFinal = Math.min(r.acCalc, AC_MAX);
        if (r.acCalc > AC_MAX) avisos.push("A resistência de dosagem seria atingida com a/c = " + fmt(r.acCalc, 3) + " — adotado o máximo de 0,56 (4.3).");
        if (r.acFinal < AC_MIN) avisos.push("a/c necessária de " + fmt(r.acFinal, 3) + " < 0,40: a resistência de dosagem não é alcançada dentro do intervalo de 0,40 a 0,56 (4.3) — rever materiais, aditivos ou o método.");
        var xs = acs.filter(ok);
        if (xs.length && (r.acFinal < Math.min.apply(null, xs) - 0.01 || r.acFinal > Math.max.apply(null, xs) + 0.01)) avisos.push("a/c do traço final (" + fmt(r.acFinal, 3) + ") fora do intervalo estudado (" + fmt(Math.min.apply(null, xs), 2) + "–" + fmt(Math.max.apply(null, xs), 2) + ") — extrapolação; estude traços que envolvam esse valor.");
        r.fctEsp = r.abF ? r.abF.f(r.acFinal) : NaN;
        r.fcEsp = r.abC ? r.abC.f(r.acFinal) : NaN;
        r.fcdEsp = r.abD ? r.abD.f(r.acFinal) : NaN;
      }
      // fck correspondente (correlação fctM × fc)
      if (r.cFC && r.cFC.b > 0 && ok(fctmk)) { r.fckCorr = (fctmk - r.cFC.a) / r.cFC.b; r.fcjCorr = (r.fctj - r.cFC.a) / r.cFC.b; }
      // ---------- consumo e traço final (diagrama de dosagem) ----------
      var pm = tracos.filter(function (t) { return ok(t.ac) && ok(t.m); }), pcm = tracos.filter(function (t) { return ok(t.m) && ok(t.C) && t.C > 0; });
      r.lyse = pm.length >= 2 ? reta(pm.map(function (t) { return t.ac; }), pm.map(function (t) { return t.m; })) : null;
      r.moli = pcm.length >= 2 ? reta(pcm.map(function (t) { return t.m; }), pcm.map(function (t) { return 1000 / t.C; })) : null;
      if (ok(r.acFinal) && r.lyse) {
        r.mFin = r.lyse.a + r.lyse.b * r.acFinal;
        r.alfaFin = media(tracos.map(function (t) { return t.alfa; })) / 100;
        if (ok(r.alfaFin)) { r.aFin = r.alfaFin * (1 + r.mFin) - 1; r.pFin = r.mFin - r.aFin; }
        if (r.moli) r.Cfin = 1000 / (r.moli.a + r.moli.b * r.mFin);
      }
      if (ok(r.Cfin) && r.Cfin < C_MIN) avisos.push("Consumo de cimento do traço final de " + fmt(r.Cfin, 0) + " kg/m³ < 320 kg/m³ (4.3) — adotar traço mais rico (menor m) que atenda ao consumo mínimo.");
      // ---------- requisitos (seção 4) resumidos ----------
      if (ok(r.acFinal)) req("Relação água/cimento do traço final (4.3)", fmt(r.acFinal, 3), "0,40 a 0,56", r.acFinal >= AC_MIN - 1e-9 && r.acFinal <= AC_MAX + 1e-9 ? "ok" : "nok");
      if (ok(r.Cfin)) req("Consumo de cimento do traço final (4.3)", fmt(r.Cfin, 0) + " kg/m³", "≥ 320 kg/m³", r.Cfin >= C_MIN ? "ok" : "nok");
      var ars = tracos.map(function (t) { return t.ar; }).filter(ok), exs = tracos.map(function (t) { return t.exs; }).filter(ok);
      if (ars.length) req("Teor de ar incorporado dos traços (4.3; NBR NM 47)", fmt(Math.min.apply(null, ars), 1) + " a " + fmt(Math.max.apply(null, ars), 1) + " %", "≤ 0,5 %", Math.max.apply(null, ars) <= AR_MAX ? "ok" : "nok");
      if (exs.length) req("Exsudação dos traços (4.3; NBR NM 102)", fmt(Math.min.apply(null, exs), 1) + " a " + fmt(Math.max.apply(null, exs), 1) + " %", "≤ 1,5 %", Math.max.apply(null, exs) <= EXS_MAX ? "ok" : "nok");
      req("Traços experimentais (5.1 d)", String(tracos.length), "≥ 3", tracos.length >= 3 ? "ok" : "nok");
      r.parecer = !ok(r.acFinal) ? "PENDENTE" : r.req.some(function (x) { return x.sit === "nok"; }) || r.acFinal < AC_MIN ? "NÃO ATENDE" : "ATENDE";
      r.j = j;
      return { tab: { tr: tab }, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc, d) {
      var r = calc.resultados, P = d.params || {}, h = '<div class="fe-res">';
      h += '<div class="fe-res-item"><div class="fe-res-v">' + fmt(r.acFinal, 2) + '</div><div class="fe-res-r">a/c do traço final — ' +
        (r.parecer === "ATENDE" ? '<span class="fe-ok">atende à seção 4</span>' : r.parecer === "NÃO ATENDE" ? '<span class="fe-nok">não atende à seção 4</span>' : "pendente") +
        (r.governa ? " (governa a " + r.governa + ")" : "") + "</div></div>";
      h += '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + fmt(r.fctj, 2) + '</div><div class="fe-res-r">fctM,' + r.j + " = fctM,k + 0,84 × " + fmt(r.sdF, 2) + " MPa (5.3)</div></div>";
      if (ok(r.fcj)) h += '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + fmt(r.fcj, 1) + '</div><div class="fe-res-r">fc,' + r.j + " = fck + 0,84 × " + fmt(r.sdC, 1) + " MPa</div></div>";
      if (ok(r.Cfin)) h += '<div class="fe-res-item"><div class="fe-res-v">' + fmt(r.Cfin, 0) + '</div><div class="fe-res-r">Consumo de cimento do traço final (kg/m³)</div></div>';
      if (ok(r.aFin)) h += '<div class="fe-res-item"><div class="fe-res-v">1 : ' + fmt(r.aFin, 2) + " : " + fmt(r.pFin, 2) + '</div><div class="fe-res-r">Traço unitário final (cimento : miúdo : graúdo), a/c ' + fmt(r.acFinal, 2) + "</div></div>";
      if (ok(r.fckCorr)) h += '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + fmt(r.fckCorr, 1) + '</div><div class="fe-res-r">fck correspondente ao fctM,k pela correlação fctM × fc (MPa)</div></div>';
      h += "</div>";
      if (r.req.length) h += '<table class="fe-resumo"><thead><tr><th>Requisito</th><th>Valor</th><th>Exigido</th><th>Situação</th></tr></thead><tbody>' + r.req.map(function (x) {
        return "<tr><td>" + esc(x.item) + "</td><td>" + esc(x.valor) + "</td><td>" + esc(x.exig) + "</td><td>" + (x.sit === "ok" ? '<span class="fe-ok">atende</span>' : x.sit === "abaixo" ? "abaixo de 1/5" : '<span class="fe-nok">não atende</span>') + "</td></tr>";
      }).join("") + "</tbody></table>";
      var cor = [];
      if (r.abF) cor.push(["fctM = A / B^(a/c)", "A = " + fmt(r.abF.A, 2) + "; B = " + fmt(r.abF.B, 3) + "; R² = " + fmt(r.abF.r2, 3)]);
      if (r.abC) cor.push(["fc = A / B^(a/c)", "A = " + fmt(r.abC.A, 1) + "; B = " + fmt(r.abC.B, 3) + "; R² = " + fmt(r.abC.r2, 3)]);
      if (r.abD) cor.push(["ft,D = A / B^(a/c) (optativa)", "A = " + fmt(r.abD.A, 2) + "; B = " + fmt(r.abD.B, 3) + "; R² = " + fmt(r.abD.r2, 3)]);
      if (r.cFC) cor.push(["fctM = a + b·fc", "a = " + fmt(r.cFC.a, 3) + "; b = " + fmt(r.cFC.b, 4) + "; R² = " + fmt(r.cFC.r2, 3)]);
      if (r.lyse) cor.push(["m = k3 + k4·a/c (Lyse)", "k3 = " + fmt(r.lyse.a, 3) + "; k4 = " + fmt(r.lyse.b, 3)]);
      if (r.moli) cor.push(["1000/C = k5 + k6·m (Molinari)", "k5 = " + fmt(r.moli.a, 4) + "; k6 = " + fmt(r.moli.b, 4)]);
      if (cor.length) h += '<table class="fe-resumo"><thead><tr><th>Correlação (5.3)</th><th>Coeficientes</th></tr></thead><tbody>' + cor.map(function (c) { return "<tr><td>" + esc(c[0]) + "</td><td>" + esc(c[1]) + "</td></tr>"; }).join("") + "</tbody></table>";
      return h;
    },
    graficos: function (calc, d, opt) {
      var r = calc.resultados, out = [];
      var ts = r.tracos;
      out.push(grafico(opt, "Relação água/cimento", "fctM (MPa)", ts.filter(function (t) { return ok(t.ac) && ok(t.fct); }).map(function (t) { return [t.ac, t.fct, t.nome]; }),
        r.abF ? r.abF.f : null, ok(r.acFinal) ? { x: r.acFinal, y: r.fctEsp, ry: r.fctj, rot: "fctM,j = " + fmt(r.fctj, 2) } : null, [AC_MIN, AC_MAX]));
      if (ts.some(function (t) { return ok(t.fc); }))
        out.push(grafico(opt, "Relação água/cimento", "fc (MPa)", ts.filter(function (t) { return ok(t.ac) && ok(t.fc); }).map(function (t) { return [t.ac, t.fc, t.nome]; }),
          r.abC ? r.abC.f : null, ok(r.acFinal) && ok(r.fcEsp) ? { x: r.acFinal, y: r.fcEsp, ry: r.fcj, rot: ok(r.fcj) ? "fc,j = " + fmt(r.fcj, 1) : "" } : null, [AC_MIN, AC_MAX]));
      if (r.cFC) out.push(grafico(opt, "fc (MPa)", "fctM (MPa)", ts.filter(function (t) { return ok(t.fc) && ok(t.fct); }).map(function (t) { return [t.fc, t.fct, t.nome]; }),
        function (x) { return r.cFC.a + r.cFC.b * x; }, ok(r.fckCorr) ? { x: r.fckCorr, y: num(d.params.fctmk), rot: "fctM,k → fck " + fmt(r.fckCorr, 1) } : null));
      return out;
    },
    relatorio: {
      notas: "Requisitos (4): Dmáx de 1/5 a 1/4 da espessura da placa e ≤ 50 mm; consistência por abatimento (NBR NM 67, ≥ 20 mm) ou VeBe (DNIT 064-ME, < 20 mm); consumo ≥ 320 kg/m³; a/c de 0,40 a 0,56; ar incorporado ≤ 0,5 % (NBR NM 47); exsudação ≤ 1,5 % (NBR NM 102). " +
        "No mínimo 3 traços experimentais (5.1 d). Resistência média de dosagem fctM,j = fctM,k + 0,84·Sd ou fc,j = fck + 0,84·Sd (5.3); Sd = desvio-padrão de ≥ 20 resultados, ou padrão rigoroso (0,6 MPa flexão / 4,0 MPa compressão) ou razoável (0,9 / 5,5 MPa). " +
        "A norma deixa o método de dosagem livre (5.1): a ficha ajusta a lei de Abrams (fctM e fc × a/c, regressão de ln f), a reta fctM × fc, a lei de Lyse (m × a/c) e a de Molinari (1000/C × m) pelos mínimos quadrados, e mantém no traço final o teor de argamassa médio dos traços. " +
        "Consumo teórico C = (1000 − 10·ar) / (1/γc + a/γa + p/γb + a/c). O traço final pode sofrer ajustes no campo (6.4).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        rows.push(["Parecer do estudo", r.parecer === "ATENDE" ? "Traço final atende aos requisitos da seção 4" : r.parecer === "NÃO ATENDE" ? "Há requisito da seção 4 não atendido" : "Pendente — faltam resultados"]);
        if (P.metodo) rows.push(["Método de dosagem", P.metodo]);
        r.mats.forEach(function (m) { rows.push(["Material — " + (m.mat || "—"), [m.id, m.data ? "amostragem " + m.data : "", m.res].filter(Boolean).join("; ")]); });
        rows.push(["Sd adotado (5.3)", fmt(r.sdF, 2) + " MPa (flexão)" + (ok(r.sdC) ? " / " + fmt(r.sdC, 1) + " MPa (compressão)" : "") + " — " + ({ rigoroso: "padrão rigoroso", razoavel: "padrão razoável", conhecido: "conhecido" }[P.sdModo] || "")]);
        rows.push(["Resistência de dosagem", "fctM," + r.j + " = " + fmt(num(P.fctmk), 2) + " + 0,84 × " + fmt(r.sdF, 2) + " = " + fmt(r.fctj, 2) + " MPa" + (ok(r.fcj) ? "; fc," + r.j + " = " + fmt(num(P.fck), 1) + " + 0,84 × " + fmt(r.sdC, 1) + " = " + fmt(r.fcj, 1) + " MPa" : "")]);
        r.tracos.forEach(function (t) {
          rows.push([t.nome, "a/c " + fmt(t.ac, 2) + "; m " + fmt(t.m, 2) + "; C " + fmt(t.C, 0) + " kg/m³; ar " + fmt(t.ar, 1) + " %" + (ok(t.abat) ? "; abat. " + fmt(t.abat, 0) + " mm" : "") + (ok(t.vebe) ? "; VeBe " + fmt(t.vebe, 1) + " s" : "") +
            (ok(t.exs) ? "; exsud. " + fmt(t.exs, 1) + " %" : "") + "; fctM " + fmt(t.fct, 2) + (ok(t.fc) ? "; fc " + fmt(t.fc, 1) : "") + " MPa" + (t.falhas.length ? " — " + t.falhas.join("; ") : "")]);
        });
        if (r.abF) rows.push(["Correlação fctM × a/c", "fctM = " + fmt(r.abF.A, 2) + " / " + fmt(r.abF.B, 3) + "^(a/c); R² = " + fmt(r.abF.r2, 3)]);
        if (r.abC) rows.push(["Correlação fc × a/c", "fc = " + fmt(r.abC.A, 1) + " / " + fmt(r.abC.B, 3) + "^(a/c); R² = " + fmt(r.abC.r2, 3)]);
        if (r.cFC) rows.push(["Correlação fctM × fc", "fctM = " + fmt(r.cFC.a, 3) + " + " + fmt(r.cFC.b, 4) + " × fc; R² = " + fmt(r.cFC.r2, 3) + (ok(r.fckCorr) ? "; fck correspondente ao fctM,k = " + fmt(r.fckCorr, 1) + " MPa" : "")]);
        rows.push(["Relação a/c do traço final", ok(r.acFinal) ? fmt(r.acFinal, 3) + (r.governa ? " (" + r.governa + ")" : "") + (ok(r.fctEsp) ? "; fctM esperado " + fmt(r.fctEsp, 2) + " MPa" : "") + (ok(r.fcEsp) ? "; fc esperado " + fmt(r.fcEsp, 1) + " MPa" : "") : "—"]);
        if (ok(r.aFin)) rows.push(["Traço final (em massa)", "1 : " + fmt(r.aFin, 2) + " : " + fmt(r.pFin, 2) + " : a/c " + fmt(r.acFinal, 2) + (ok(r.Cfin) ? "; consumo " + fmt(r.Cfin, 0) + " kg/m³" : "")]);
        return rows;
      },
      extraHtml: function (calc) {
        var r = calc.resultados;
        if (!r.req.length) return "";
        return '<table class="res" style="margin-top:6px"><tr><th>Requisito</th><td><b>Valor</b> — exigido — situação</td></tr>' + r.req.map(function (x) {
          return "<tr><th>" + esc(x.item) + "</th><td>" + esc(x.valor) + " — " + esc(x.exig) + " — " + (x.sit === "ok" ? "atende" : x.sit === "abaixo" ? "abaixo de 1/5" : "NÃO ATENDE") + "</td></tr>";
        }).join("") + "</table>";
      },
    },
    exemplos: [
      { nome: "Pavimento em fôrma-trilho — fctM,k 4,5 MPa, 3 traços, padrão rigoroso (dados gerados)", dados: function () {
        return { ident: { registro: "EX-TR-001", data: "2026-06-15", obra: "Obra C — pavimento de concreto", trecho: "BR-000 — km 10 ao km 18", local: "Laboratório da Unidade A", camada: "Placas de concreto" },
          params: { metodo: "Diagrama de dosagem (Abrams–Lyse–Molinari)", esp: "180", dmax: "38", consist: "abat", consEsp: "40", fctmk: "4,5", idade: "28", sdModo: "rigoroso",
            gc: "3,10", ga: "2,63", gb: "2,70", impMat: ["ex:dnit-050-2004-em:0", "ex:dnit-462-2025-em:0", "ex:dnit-454-2025-em:0"] },
          mat: [
            { mat: "Cimento CP III-40", id: "Fabricante A — marca X", data: "06/04/2026", res: "DNIT 050-EM — LOTE ACEITO", reg: "REC-CIM-PR-01", imp: "dnit-050-2004-em" },
            { mat: "Agregado — Miúdo — areia natural", id: "Areal 1", data: "05/05/2026", res: "DNIT 462-EM — LOTE ACEITO", reg: "REC-AGC-01", imp: "dnit-462-2025-em" },
            { mat: "Agregado graúdo — brita 1 e brita 2 (50/50)", id: "Pedreira X", data: "05/05/2026", res: "granulometria, abrasão Los Angeles 24 %, índice de forma 2,1 — adequado" },
            { mat: "Água", id: "Poço 1 e rede", data: "09/03/2026", res: "DNIT 454-EM — ÁGUA ACEITA", reg: "AG-454-01", imp: "dnit-454-2025-em" }],
          tr: [
            { id: "T1 (rico)", a: "1,60", p: "2,60", ac: "0,42", abat: "40", ar: "0,3", exs: "0,8", pega: "4h20 / 6h10", fct: "5,58", fc: "42,8", fcd: "4,10" },
            { id: "T2 (médio)", a: "2,00", p: "3,00", ac: "0,48", abat: "45", ar: "0,4", exs: "1,0", pega: "4h35 / 6h30", fct: "5,14", fc: "36,0", fcd: "3,65" },
            { id: "T3 (pobre)", a: "2,40", p: "3,40", ac: "0,54", abat: "50", ar: "0,4", exs: "1,2", pega: "4h50 / 6h55", fct: "4,61", fc: "31,4", fcd: "3,28" }] };
      } },
      { nome: "Estudo incompleto — 2 traços fora dos limites, Sd com poucos resultados, Dmáx e consistência inadequados (dados gerados)", dados: function () {
        return { ident: { registro: "EX-TR-002", data: "2026-08-11", obra: "Obra D — pavimento de concreto", local: "Laboratório da Unidade B" },
          params: { metodo: "Método do fornecedor de concreto", esp: "180", dmax: "50", consist: "abat", consEsp: "15", fctmk: "5,0", fck: "35", idade: "28", sdModo: "conhecido", sdF: "0,45", sdC: "3,2", sdN: "12",
            gc: "3,05", ga: "2,62", gb: "2,72" },
          mat: [{ mat: "Cimento CP II-Z-32", id: "Fabricante B, sacos", data: "", res: "DNIT 050-EM — LOTE REJEITADO" }, { mat: "Areia natural", id: "Jazida 2", data: "02/08/2026", res: "sem ensaios" }],
          tr: [
            { id: "T1", a: "2,30", p: "3,50", ac: "0,50", abat: "15", ar: "1,2", exs: "1,8", fct: "4,70", fc: "33,0" },
            { id: "T2", a: "2,80", p: "4,10", ac: "0,60", abat: "25", ar: "0,9", exs: "2,1", fct: "4,05", fc: "26,5" }] };
      } },
    ],
  };

  // gráfico de pontos com curva ajustada e o ponto do traço final
  function grafico(opt, rx, ry, pts, f, alvo, faixaX) {
    opt = opt || {};
    if (pts.length < 1) return '<div class="fe-graf-vazio">' + esc(ry) + " × " + esc(rx) + ": informe os resultados dos traços.</div>";
    var W = opt.w || 560, H = opt.h || 300, m = { l: 52, r: 16, t: 16, b: 42 };
    var xs = pts.map(function (p) { return p[0]; }).concat(alvo && ok(alvo.x) ? [alvo.x] : []).concat(faixaX || []);
    var ys = pts.map(function (p) { return p[1]; }).concat(alvo && ok(alvo.y) ? [alvo.y] : []).concat(alvo && ok(alvo.ry) ? [alvo.ry] : []);
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    var dx = (x1 - x0) || Math.abs(x0) || 1, dy = (y1 - y0) || Math.abs(y0) || 1;
    x0 -= dx * 0.08; x1 += dx * 0.08; y0 -= dy * 0.15; y1 += dy * 0.15;
    function X(v) { return m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r); }
    function Y(v) { return H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b); }
    var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)", cor = imp ? "#1f5fbf" : "#4f8cff", cor2 = imp ? "#c0392b" : "#e0a13a";
    var g = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
    function passo(a, b) { var s = (b - a) / 5, p = Math.pow(10, Math.floor(Math.log10(s))), n = s / p; return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * p; }
    var px = passo(x0, x1), py = passo(y0, y1), cx = px < 0.1 ? 2 : px < 1 ? 1 : 0, cy = py < 0.1 ? 2 : py < 1 ? 1 : 0;
    for (var v = Math.ceil(x0 / px) * px; v <= x1 + 1e-9; v += px) {
      g += '<line x1="' + X(v).toFixed(1) + '" y1="' + m.t + '" x2="' + X(v).toFixed(1) + '" y2="' + (H - m.b) + '" stroke="' + grade + '" stroke-width="0.6"/>';
      g += '<text x="' + X(v).toFixed(1) + '" y="' + (H - m.b + 15) + '" text-anchor="middle" fill="' + txt + '">' + fmt(v, cx) + "</text>";
    }
    for (v = Math.ceil(y0 / py) * py; v <= y1 + 1e-9; v += py) {
      g += '<line x1="' + m.l + '" y1="' + Y(v).toFixed(1) + '" x2="' + (W - m.r) + '" y2="' + Y(v).toFixed(1) + '" stroke="' + grade + '" stroke-width="0.6"/>';
      g += '<text x="' + (m.l - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end" fill="' + txt + '">' + fmt(v, cy) + "</text>";
    }
    if (faixaX) g += '<rect x="' + X(faixaX[0]).toFixed(1) + '" y="' + m.t + '" width="' + (X(faixaX[1]) - X(faixaX[0])).toFixed(1) + '" height="' + (H - m.t - m.b) + '" fill="' + cor + '" fill-opacity="0.06"/>';
    g += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + txt + '"/>';
    g += '<text x="' + ((W + m.l - m.r) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + txt + '">' + esc(rx) + "</text>";
    g += '<text transform="translate(13 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + txt + '">' + esc(ry) + "</text>";
    if (f) {
      var d = "", N = 60;
      for (var i = 0; i <= N; i++) { var xx = x0 + (x1 - x0) * i / N, yy = f(xx); if (ok(yy) && yy >= y0 && yy <= y1) d += (d ? "L" : "M") + X(xx).toFixed(1) + " " + Y(yy).toFixed(1) + " "; }
      if (d) g += '<path d="' + d + '" fill="none" stroke="' + cor + '" stroke-width="2"/>';
    }
    pts.forEach(function (p) {
      g += '<circle cx="' + X(p[0]).toFixed(1) + '" cy="' + Y(p[1]).toFixed(1) + '" r="4" fill="' + cor + '"/>';
      g += '<text x="' + (X(p[0]) + 6).toFixed(1) + '" y="' + (Y(p[1]) - 6).toFixed(1) + '" fill="' + txt + '" font-size="10">' + esc(p[2]) + "</text>";
    });
    if (alvo && ok(alvo.x) && ok(alvo.y)) {
      g += '<path d="M' + X(alvo.x).toFixed(1) + " " + (H - m.b) + " L" + X(alvo.x).toFixed(1) + " " + Y(alvo.y).toFixed(1) + " L" + m.l + " " + Y(alvo.y).toFixed(1) + '" fill="none" stroke="' + cor2 + '" stroke-dasharray="4 3"/>';
      g += '<circle cx="' + X(alvo.x).toFixed(1) + '" cy="' + Y(alvo.y).toFixed(1) + '" r="5" fill="none" stroke="' + cor2 + '" stroke-width="2"/>';
      if (alvo.rot) g += '<text x="' + (m.l + 8) + '" y="' + (m.t + 16) + '" fill="' + cor2 + '" font-weight="bold">' + esc(alvo.rot) + "</text>";
    }
    return g + "</svg>";
  }
})();
