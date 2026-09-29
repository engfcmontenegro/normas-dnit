/*
 * Ficha: DNIT 178/2018-PRO — Preparação de corpos de prova de misturas asfálticas no compactador giratório Superpave
 * ou no Marshall (registro e verificação). Temperaturas de mistura e compactação pela viscosidade (5.2), aquecimento
 * dos agregados (5.3 a), mistura e condicionamento de curto prazo (5.3 e/f, 5.4), molde (5.3 g), energia (5.5.3 e
 * Tabela 1 do Anexo C), dimensões e massas (6.1), Gmb, Vv e densidade relativa corrigida Cn (eq. 1, 6.2.1).
 * Registra-se em window.FE. Não há critério de aceitação do CP na norma (NOTA da seção 7): o Vv alvo é do usuário.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var RHO_W = 0.9971;  // massa específica da água a 25 °C (g/cm³), para a massa estimada do CP

  // Anexo C, Tabela 1 — número de giros por volume de tráfego comercial
  var TRAFEGO = { mb: ["Muito baixo", 6, 50, 75], med: ["Médio", 7, 75, 115], pes: ["Pesado", 8, 100, 160], mp: ["Muito pesado", 9, 125, 205] };
  // 5.2 — viscosidades-alvo: mistura e compactação
  var VISC = { pas: { u: "Pa·s", mis: [0.17, 0.02], comp: [0.28, 0.03] }, ssf: { u: "SSF", mis: [85, 10], comp: [140, 15] } };

  function giratorio(P) { return (P.compactador || "giratorio") === "giratorio"; }
  function tr(P) { return TRAFEGO[P.trafego] || null; }
  // pares "T=η; T=η" → ajuste ln η = A + B·T (mínimos quadrados); devolve T para uma viscosidade
  function curvaVisc(texto) {
    var pts = FE.curvaSpeedy(texto).filter(function (p) { return p[1] > 0; });
    if (pts.length < 2) return null;
    var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return Math.log(p[1]); });
    var mx = media(xs), my = media(ys), sxx = 0, sxy = 0;
    xs.forEach(function (x, i) { sxx += (x - mx) * (x - mx); sxy += (x - mx) * (ys[i] - my); });
    if (!sxx) return null;
    var B = sxy / sxx, A = my - B * mx;
    if (B >= 0) return null;
    return { pts: pts, A: A, B: B, T: function (eta) { return (Math.log(eta) - A) / B; }, eta: function (T) { return Math.exp(A + B * T); } };
  }
  // faixas de temperatura (°C) de mistura e compactação: pela curva de viscosidade ou informadas (NOTA 1)
  function faixas(P) {
    var V = VISC[P.viscU] || VISC.pas, c = curvaVisc(P.visc), f = { curva: c };
    if (P.modificado === "sim") {
      f.mis = [num(P.tMisMin), num(P.tMisMax)]; f.comp = [num(P.tCompMin), num(P.tCompMax)]; f.fonte = "fabricante do ligante modificado (5.2, NOTA 1)";
    } else if (c) {
      f.mis = [c.T(V.mis[0] + V.mis[1]), c.T(V.mis[0] - V.mis[1])]; f.comp = [c.T(V.comp[0] + V.comp[1]), c.T(V.comp[0] - V.comp[1])];
      f.fonte = "curva viscosidade × temperatura (5.2)";
    } else { f.mis = [NaN, NaN]; f.comp = [NaN, NaN]; f.fonte = ""; }
    var tm = num(P.tMis), tc = num(P.tComp);
    f.tMis = ok(tm) ? tm : ok(f.mis[0]) && ok(f.mis[1]) ? (f.mis[0] + f.mis[1]) / 2 : NaN;
    f.tComp = ok(tc) ? tc : ok(f.comp[0]) && ok(f.comp[1]) ? (f.comp[0] + f.comp[1]) / 2 : NaN;
    return f;
  }
  // alturas por giro digitadas como "giro=altura; ..."
  function alturas(texto) { return FE.curvaSpeedy(texto).filter(function (p) { return p[0] >= 0 && p[1] > 0; }); }
  function alturaNo(pts, n) { var p = pts.filter(function (x) { return x[0] === n; })[0]; return p ? p[1] : NaN; }

  FE.FICHAS["dnit-178-2018-pro"] = {
    titulo: "Misturas asfálticas — Preparação de CPs no compactador giratório ou Marshall",
    rotuloImportar: function (r) { return (r.n || 0) + " CP(s) · Vv médio " + (ok(r.vvMedio) ? fmt(r.vvMedio, 1) + " %" : "—") + (r.compactador ? " · " + r.compactador : ""); },
    resumo: "Registro da moldagem: temperaturas pela viscosidade (0,17 ± 0,02 Pa·s mistura; 0,28 ± 0,03 Pa·s compactação), agregados até 10 °C acima da mistura, condicionamento de 2 h à temperatura de compactação, molde ≥ 45 min, giros (Tabela 1) ou golpes (50/75 por face), dimensões e massas, Gmb, Vv e Cn = Gmb·hm/(Gmm·hn) × 100 (eq. 1).",
    blocos: [],
    params: [
      { k: "compactador", r: "Compactador (4.1 e 4.2)", tipo: "select", recarrega: true,
        opcoes: [["giratorio", "Giratório Superpave (preferencial)"], ["marshall_mec", "Marshall — soquete mecânico"], ["marshall_man", "Marshall — soquete manual"]] },
      { k: "origem", r: "Mistura (3.14 a 3.16 e 5.4)", tipo: "select", recarrega: true,
        opcoes: [["lab", "Preparada e compactada em laboratório (5.3)"], ["usina", "Produzida em usina e compactada em laboratório (5.4.2)"],
          ["pista", "Coletada em pista antes da compactação e reaquecida (5.4.1)"], ["reaquecida", "Usinada, resfriada e reaquecida — estudos especiais (3.16)"]] },
      { k: "cond", r: "Condicionamento de curto prazo", tipo: "select",
        opcoes: [["simples", "5.3 e — 2 h ± 10 min (um ou vários CPs de uma batelada)"], ["multiplas", "5.3 f — bateladas múltiplas quarteadas: 2 h ± 5 min"],
          ["nenhum", "Nenhum — compactar logo após a produção (5.4.2 a)"], ["outro", "Outro, a critério do projetista (5.4.2 c)"]] },
      { k: "ligante", r: "Ligante asfáltico — tipo e procedência (7)", ph: "ex.: CAP 50/70 — Distribuidora C" },
      { k: "modificado", r: "Ligante modificado, asfalto-borracha ou com aditivos?", tipo: "select", recarrega: true,
        opcoes: [["nao", "Não — temperaturas pela viscosidade (5.2)"], ["sim", "Sim — faixas indicadas pelo fabricante (NOTA 1)"]] },
      { k: "viscU", r: "Unidade da viscosidade", tipo: "select", opcoes: [["pas", "Pa·s (rotacional, NBR 15184)"], ["ssf", "SSF (Saybolt-Furol, NBR 14950)"]],
        se: function (d) { return (d.params || {}).modificado !== "sim"; } },
      { k: "visc", r: "Viscosidade × temperatura (°C = viscosidade)", ph: "135=0,40; 150=0,20; 177=0,075",
        dica: "pares separados por ponto e vírgula; ajuste ln η × T para achar as faixas de 5.2", se: function (d) { return (d.params || {}).modificado !== "sim"; } },
      { k: "tMisMin", r: "Mistura — temperatura mínima do fabricante (°C)", se: function (d) { return (d.params || {}).modificado === "sim"; } },
      { k: "tMisMax", r: "Mistura — temperatura máxima do fabricante (°C)", se: function (d) { return (d.params || {}).modificado === "sim"; } },
      { k: "tCompMin", r: "Compactação — temperatura mínima do fabricante (°C)", se: function (d) { return (d.params || {}).modificado === "sim"; } },
      { k: "tCompMax", r: "Compactação — temperatura máxima do fabricante (°C)", se: function (d) { return (d.params || {}).modificado === "sim"; } },
      { k: "tMis", r: "Temperatura de mistura adotada (°C)", dica: "em branco: centro da faixa" },
      { k: "tComp", r: "Temperatura de compactação adotada (°C)", dica: "em branco: centro da faixa" },
      { k: "agregados", r: "Agregados — tipo, origem e granulometria (7)", ph: "ex.: gnaisse, Pedreira X, faixa C" },
      { k: "tnm", r: "Dimensão máxima nominal do agregado (mm)", dica: "molde de 100 mm: até 25 mm (1)" },
      { k: "diam", r: "Diâmetro do molde (mm)", tipo: "select", opcoes: [["100", "100 mm (ensaios mecânicos)"], ["150", "150 mm (dosagem Superpave)"], ["101,6", "101,6 mm (Marshall)"]] },
      { k: "hAlvo", r: "Altura final pretendida do CP (mm)", dica: "ex.: 60 mm (≈ 1 200 g), 170 mm (≈ 2 800 g) para Ø 100 mm (5.3 b)" },
      { k: "trafego", r: "Volume de tráfego (Anexo C, Tabela 1)", tipo: "select", recarrega: true,
        opcoes: [["", "—"]].concat(Object.keys(TRAFEGO).map(function (k) { var t = TRAFEGO[k]; return [k, t[0] + " — Nini " + t[1] + ", Nprojeto " + t[2] + ", Nmáx " + t[3]]; })),
        se: function (d) { return giratorio(d.params || {}); } },
      { k: "parada", r: "Critério de parada (5.5.3.1 a)", tipo: "select", opcoes: [["giros", "Número de giros especificado"], ["altura", "Altura especificada (NOTA 2)"]],
        se: function (d) { return giratorio(d.params || {}); } },
      { k: "nGiros", r: "Número de giros especificado", dica: "em branco: Nprojeto da Tabela 1; pode variar para atingir um Vv específico (NOTA 2)", se: function (d) { return giratorio(d.params || {}); } },
      { k: "golpes", r: "Golpes por face (5.5.3.2 a)", tipo: "select", opcoes: [["75", "75"], ["50", "50"]], se: function (d) { return !giratorio(d.params || {}); } },
      { k: "freq", r: "Frequência dos golpes (golpes/min)", dica: "64 ± 4 (5.5.3.2 a)", se: function (d) { return !giratorio(d.params || {}); } },
      { k: "importarGmm", r: "Gmm: importar de um ensaio da DNIT 427-ME (Rice)", tipo: "importar", de: "dnit-427-2020-me",
        aplicar: function (e, P) { var g = (e.resultados || {}).gmm; if (ok(g)) P.gmm = fmt(g, 3); P.gmmRef = (e.dados.ident || {}).registro || ""; } },
      { k: "gmm", r: "Densidade máxima teórica Gmm (6.1.3)", dica: "amostra de referência nas mesmas condições do CP (NBR 15619 / DNIT 427-ME)" },
      { k: "vvAlvo", r: "Volume de vazios alvo (%) — opcional", dica: "para ensaios mecânicos que pedem um Vv específico (NOTA 2 de 5.5.3.1)" },
      { k: "vvTol", r: "Tolerância do Vv alvo (± %)", ph: "0,5", dica: "definida pelo ensaio a que o CP se destina (NOTA da seção 7)" },
      { k: "angulo", r: "Ângulo externo do giratório (°)", ph: "1,25", dica: "1,25 ± 0,02° (4.1 b)", se: function (d) { return giratorio(d.params || {}); } },
      { k: "pressao", r: "Pressão vertical (kPa)", ph: "600", dica: "600 ± 18 kPa (4.1 d)", se: function (d) { return giratorio(d.params || {}); } },
      { k: "rpm", r: "Velocidade de rotação (rpm)", ph: "30", dica: "30 ± 0,5 rpm (4.1 c)", se: function (d) { return giratorio(d.params || {}); } },
      { k: "calib", r: "Data da última calibração do giratório", tipo: "date", dica: "a cada 100 h de uso ou anualmente (4.1)", se: function (d) { return giratorio(d.params || {}); } },
      { k: "soquete", r: "Massa do soquete (g)", ph: "4540", dica: "4 540 ± 1 g, queda de 457,2 ± 1,5 mm (4.2 c)", se: function (d) { return !giratorio(d.params || {}); } },
      { k: "queda", r: "Altura de queda (mm)", ph: "457,2", se: function (d) { return !giratorio(d.params || {}); } },
    ],
    padrao: { compactador: "giratorio", origem: "lab", cond: "simples", modificado: "nao", viscU: "pas", diam: "100", parada: "giros", golpes: "75", vvTol: "0,5" },
    tabelas: function (d) {
      var P = d.params || {}, gir = giratorio(P), lab = (P.origem || "lab") === "lab";
      var L = [{ k: "id", r: "Identificação do CP", texto: true }];
      if (lab) L.push({ grupo: "Mistura (5.3)" },
        { k: "mAg", r: "Massa de agregados (e fíler/cal) pesada", u: "g" },
        { k: "mLig", r: "Massa de ligante acrescida", u: "g" },
        { calc: "teor", r: "Teor de ligante = ligante / (agregados + ligante)", u: "%", casas: 2 },
        { k: "tAg", r: "Temperatura dos agregados ao misturar (5.3 a)", u: "°C" },
        { k: "tLig", r: "Temperatura do ligante", u: "°C" },
        { k: "tMistura", r: "Temperatura da mistura", u: "°C" },
        { k: "tempoMist", r: "Tempo de mistura (≈ 60 s um CP; ≈ 120 s vários, 5.3 d)", u: "s" });
      else L.push({ grupo: "Mistura de usina (5.4)" }, { k: "tChegada", r: "Temperatura da mistura ao chegar ao laboratório", u: "°C" },
        { k: "tempoReaq", r: "Tempo de reaquecimento até a temperatura de compactação (5.4.1)", u: "min" });
      L.push({ grupo: "Condicionamento e molde (5.3 e–g)" },
        { k: "condT", r: "Temperatura da estufa no condicionamento", u: "°C" },
        { k: "condMin", r: "Duração do condicionamento", u: "min" },
        { k: "mexida", r: "Mistura revolvida após", u: "min" },
        { k: "moldeT", r: "Temperatura do molde", u: "°C" },
        { k: "moldeMin", r: "Molde na estufa antes da compactação", u: "min" },
        { k: "tCompCP", r: "Temperatura da mistura ao compactar", u: "°C" },
        { k: "mCP", r: "Massa de mistura colocada no molde", u: "g" });
      if (gir) L.push({ grupo: "Compactação giratória (5.5.3.1)" },
        { k: "N", r: "Número de giros aplicado (final)", u: "giros" },
        { k: "hm", r: "Altura registrada no giro final (hm)", u: "mm" },
        { k: "hIni", r: "Altura no Nini (opcional)", u: "mm" },
        { k: "hProj", r: "Altura no Nprojeto (se o final for outro, opcional)", u: "mm" },
        { k: "curva", r: "Alturas por giro (giro=altura; ...) — opcional", texto: true, ph: "1=128,4; 8=118,2; 50=108,9" });
      else L.push({ grupo: "Compactação Marshall (5.5.3.2)" },
        { k: "g1", r: "Golpes na 1ª face", u: "golpes" }, { k: "g2", r: "Golpes na 2ª face (após inverter o molde)", u: "golpes" });
      L.push({ grupo: "Após a extração (6.1)" },
        { k: "alt", r: "Altura do CP (paquímetro, 0,1 mm)", u: "mm" },
        { k: "dia", r: "Diâmetro do CP (0,1 mm)", u: "mm" },
        { k: "A", r: "Massa seca ao ar (0,1 g)", u: "g" },
        { k: "C", r: "Massa imersa em água", u: "g" },
        { k: "B", r: "Massa saturada com superfície seca", u: "g" },
        { k: "gmbInf", r: "ou Gmb já determinada (NBR 15573 / DNIT 428-ME)", u: "" },
        { calc: "gmb", r: "Gmb = A / (B − C)", u: "", casas: 3, destaque: true },
        { calc: "vv", r: "Vv = (1 − Gmb / Gmm) × 100", u: "%", casas: 1, destaque: true },
        { calc: "gc", r: "Densidade relativa final = Gmb / Gmm × 100", u: "%", casas: 1 });
      if (gir) L.push({ calc: "cIni", r: "Cn no Nini (eq. 1)", u: "% Gmm", casas: 1 }, { calc: "cProj", r: "Cn no Nprojeto (eq. 1)", u: "% Gmm", casas: 1 });
      return [{ chave: "cps", titulo: "Corpos de prova", rotulo: "CP", iniciais: 3, min: 1, linhas: L,
        dica: "uma coluna por corpo de prova; deixe em branco o que não se aplica" }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], gir = giratorio(P), lab = (P.origem || "lab") === "lab", T = tr(P);
      var F = faixas(P), gmm = num(P.gmm), vvAlvo = num(P.vvAlvo), vvTol = ok(num(P.vvTol)) ? num(P.vvTol) : 0.5, dia = num(P.diam), hAlvo = num(P.hAlvo);
      var nEsp = gir ? (ok(num(P.nGiros)) ? num(P.nGiros) : T ? T[2] : NaN) : NaN;
      var golpes = num(P.golpes) || 75;
      // verificações gerais
      if (P.modificado !== "sim" && !F.curva && P.visc) avisos.push("Informe pelo menos dois pares temperatura = viscosidade, com a viscosidade caindo com a temperatura (5.2).");
      if (P.modificado === "sim" && !(ok(F.mis[0]) && ok(F.comp[0]))) avisos.push("Ligante modificado: informe as faixas de temperatura de mistura e de compactação indicadas pelo fabricante (5.2, NOTA 1).");
      if (ok(num(P.tMis)) && ok(F.mis[0]) && (num(P.tMis) < F.mis[0] - 0.5 || num(P.tMis) > F.mis[1] + 0.5)) avisos.push("Temperatura de mistura adotada (" + fmt(num(P.tMis), 0) + " °C) fora da faixa " + fmt(F.mis[0], 0) + "–" + fmt(F.mis[1], 0) + " °C (5.2).");
      if (ok(num(P.tComp)) && ok(F.comp[0]) && (num(P.tComp) < F.comp[0] - 0.5 || num(P.tComp) > F.comp[1] + 0.5)) avisos.push("Temperatura de compactação adotada (" + fmt(num(P.tComp), 0) + " °C) fora da faixa " + fmt(F.comp[0], 0) + "–" + fmt(F.comp[1], 0) + " °C (5.2).");
      var tnm = num(P.tnm);
      if (ok(tnm) && dia <= 101.6 && tnm > 25) avisos.push("Molde de 100 mm só para agregados de dimensão máxima nominal até 25 mm (seção 1).");
      if (!ok(gmm)) avisos.push("Informe a Gmm (6.1.3) para calcular o Vv e as densidades relativas.");
      if (P.origem === "reaquecida") avisos.push("Mistura reaquecida: só para estudos especiais; não usar com asfalto-borracha nem com misturas com cal (3.16).");
      if (gir) {
        if (!ok(nEsp) && P.parada !== "altura") avisos.push("Escolha o volume de tráfego (Tabela 1) ou informe o número de giros especificado.");
        var ang = num(P.angulo), pr = num(P.pressao), rpm = num(P.rpm);
        if (ok(ang) && Math.abs(ang - 1.25) > 0.02 + 1e-9) avisos.push("Ângulo externo de " + fmt(ang, 2) + "° — deve ser 1,25 ± 0,02° (4.1 b).");
        if (ok(pr) && Math.abs(pr - 600) > 18 + 1e-9) avisos.push("Pressão vertical de " + fmt(pr, 0) + " kPa — 600 ± 18 kPa após os cinco primeiros giros (4.1 d; 5.5.3.1 a).");
        if (ok(rpm) && Math.abs(rpm - 30) > 0.5 + 1e-9) avisos.push("Rotação de " + fmt(rpm, 1) + " rpm — deve ser 30 ± 0,5 rpm (4.1 c).");
        var dc = Date.parse(P.calib), de = Date.parse((d.ident || {}).data);
        if (ok(dc) && ok(de) && (de - dc) / 86400000 > 366) avisos.push("Última calibração do giratório há mais de um ano — calibrar a cada 100 h de uso ou anualmente (4.1).");
        if (P.modificado === "sim" && /borracha/i.test(P.ligante || "")) avisos.push("Asfalto-borracha: o compactador Marshall é o mais indicado (seção 1, NOTA).");
      } else {
        var fq = num(P.freq), sq = num(P.soquete), qd = num(P.queda);
        if (ok(fq) && Math.abs(fq - 64) > 4 + 1e-9) avisos.push("Frequência de " + fmt(fq, 0) + " golpes/min — deve ser 64 ± 4 (5.5.3.2 a).");
        if (ok(sq) && Math.abs(sq - 4540) > 1 + 1e-9) avisos.push("Soquete de " + fmt(sq, 0) + " g — deve ter 4 540 ± 1 g (4.2 c).");
        if (ok(qd) && Math.abs(qd - 457.2) > 1.5 + 1e-9) avisos.push("Altura de queda de " + fmt(qd, 1) + " mm — deve ser 457,2 ± 1,5 mm (4.2 c).");
      }
      // massa estimada para a altura pretendida
      var mEst = ok(gmm) && ok(dia) && ok(hAlvo) ? gmm * RHO_W * (1 - (ok(vvAlvo) ? vvAlvo : 4) / 100) * Math.PI * Math.pow(dia / 20, 2) * (hAlvo / 10) : NaN;
      var tMis = F.tMis, tComp = F.tComp;
      var condTol = P.cond === "multiplas" ? 5 : 10;
      var cps = (d.cps || []).map(function (x, i) {
        var o = {}, rot = "CP " + (x.id || i + 1);
        function av(t) { avisos.push(rot + ": " + t); }
        if (lab) {
          var mAg = num(x.mAg), mLig = num(x.mLig);
          o.teor = ok(mAg) && ok(mLig) && mAg + mLig > 0 ? mLig / (mAg + mLig) * 100 : NaN;
          var tAg = num(x.tAg), tMx = num(x.tMistura), tpm = num(x.tempoMist);
          if (ok(tAg) && ok(tMis)) {
            if (tAg <= tMis) av("agregados a " + fmt(tAg, 0) + " °C — devem estar acima da temperatura de mistura (" + fmt(tMis, 0) + " °C) (5.3 a).");
            else if (tAg > tMis + 10) av("agregados a " + fmt(tAg, 0) + " °C — no máximo 10 °C acima da temperatura de mistura (" + fmt(tMis + 10, 0) + " °C) (5.3 a).");
          }
          if (ok(tMx) && ok(F.mis[0]) && (tMx < F.mis[0] - 0.5 || tMx > F.mis[1] + 0.5)) av("mistura a " + fmt(tMx, 0) + " °C, fora da faixa de mistura " + fmt(F.mis[0], 0) + "–" + fmt(F.mis[1], 0) + " °C (5.2 e 5.3 d).");
          if (ok(tpm)) { var ref = P.cond === "multiplas" ? 120 : 60; if (Math.abs(tpm - ref) > ref * 0.5) av("tempo de mistura de " + fmt(tpm, 0) + " s — a norma indica aproximadamente " + ref + " s (5.3 d; alerta além de ± 50 %, critério da ficha)."); }
        } else if (P.origem === "pista" || P.origem === "reaquecida") {
          if (ok(num(x.tChegada)) && ok(tComp) && num(x.tChegada) > tComp + 3) av("mistura a " + fmt(num(x.tChegada), 0) + " °C, acima da temperatura de compactação — reaquecer só o tempo necessário, em recipiente coberto (5.4.1).");
        }
        // condicionamento (5.3 e/f) e molde (5.3 g)
        var cT = num(x.condT), cM = num(x.condMin), mx = num(x.mexida), mT = num(x.moldeT), mM = num(x.moldeMin), tc = num(x.tCompCP);
        var condAplica = P.cond === "simples" || P.cond === "multiplas" || (lab && P.cond !== "nenhum" && P.cond !== "outro");
        if (condAplica) {
          if (ok(cT) && ok(tComp) && Math.abs(cT - tComp) > 3 + 1e-9) av("estufa de condicionamento a " + fmt(cT, 0) + " °C — temperatura de compactação ± 3 °C (" + fmt(tComp, 0) + " °C) (5.3 " + (P.cond === "multiplas" ? "f" : "e") + ").");
          if (ok(cM) && Math.abs(cM - 120) > condTol + 1e-9) av("condicionamento de " + fmt(cM, 0) + " min — 2 h ± " + condTol + " min (5.3 " + (P.cond === "multiplas" ? "f" : "e") + ").");
          if (ok(mx) && Math.abs(mx - 60) > 5 + 1e-9) av("mistura revolvida aos " + fmt(mx, 0) + " min — deve ser aos 60 ± 5 min (5.3 e/f).");
          if (!ok(cM) && (ok(cT) || ok(tc))) av("informe a duração do condicionamento de curto prazo (2 h, 5.3 e/f).");
        }
        if (ok(mT) && ok(tComp) && Math.abs(mT - tComp) > 5 + 1e-9) av("molde a " + fmt(mT, 0) + " °C — temperatura de compactação ± 5 °C (5.3 g).");
        if (ok(mM) && mM < 45) av("molde na estufa por " + fmt(mM, 0) + " min — pelo menos 45 min antes da compactação do primeiro CP (5.3 g).");
        if (ok(tc) && ok(F.comp[0]) && (tc < F.comp[0] - 0.5 || tc > F.comp[1] + 0.5)) av("compactado a " + fmt(tc, 0) + " °C, fora da faixa de compactação " + fmt(F.comp[0], 0) + "–" + fmt(F.comp[1], 0) + " °C (5.2).");
        // energia
        if (gir) {
          var N = num(x.N);
          if (ok(N) && ok(nEsp) && P.parada !== "altura" && N !== nEsp) av(N + " giros aplicados, diferente dos " + nEsp + " especificados (5.5.3.1 a).");
          if (P.parada === "altura" && ok(hAlvo) && ok(num(x.hm)) && Math.abs(num(x.hm) - hAlvo) > 0.1 + 1e-9) av("altura final de " + fmt(num(x.hm), 1) + " mm diferente da altura especificada de " + fmt(hAlvo, 1) + " mm (5.5.3.1 a).");
          if (P.parada === "altura" && !x.curva) av("compactação por critério de altura: registre a altura a cada giro (0,1 mm) e o número de giros final (7).");
        } else {
          [num(x.g1), num(x.g2)].forEach(function (g, j) { if (ok(g) && g !== golpes) av(fmt(g, 0) + " golpes na " + (j + 1) + "ª face — especificado " + golpes + " por face (5.5.3.2 a)."); });
          if (ok(num(x.g1)) !== ok(num(x.g2))) av("o mesmo número de golpes deve ser aplicado nas duas faces (5.5.3.2 a).");
        }
        // Gmb, Vv, Cn
        var A = num(x.A), B = num(x.B), Cm = num(x.C);
        o.gmb = ok(num(x.gmbInf)) ? num(x.gmbInf) : ok(A) && ok(B) && ok(Cm) && B - Cm > 0 ? A / (B - Cm) : NaN;
        if (ok(A) && ok(B) && B < A) av("massa saturada com superfície seca menor que a massa seca — confira.");
        o.vv = ok(o.gmb) && ok(gmm) ? (1 - o.gmb / gmm) * 100 : NaN;
        o.gc = ok(o.gmb) && ok(gmm) ? o.gmb / gmm * 100 : NaN;
        if (ok(o.vv) && ok(vvAlvo) && Math.abs(o.vv - vvAlvo) > vvTol + 1e-9) av("Vv = " + fmt(o.vv, 1) + " %, fora do alvo " + fmt(vvAlvo, 1) + " ± " + fmt(vvTol, 1) + " % — ajuste a energia (giros) ou a massa de mistura (NOTA 2 de 5.5.3.1).");
        if (ok(o.vv) && o.vv < 0) av("Gmb maior que a Gmm — confira.");
        var hm = num(x.hm), pts = alturas(x.curva);
        o.pts = pts;
        if (!ok(hm) && pts.length) hm = pts[pts.length - 1][1];
        o.hm = hm;
        var cn = function (hn) { return ok(o.gmb) && ok(gmm) && ok(hm) && ok(hn) && hn > 0 ? o.gmb * hm / (gmm * hn) * 100 : NaN; };
        var hI = num(x.hIni), hP = num(x.hProj);
        if (T && !ok(hI)) hI = alturaNo(pts, T[1]);
        if (T && !ok(hP)) hP = alturaNo(pts, T[2]);
        if (T && !ok(hP) && ok(num(x.N)) && num(x.N) === T[2]) hP = hm;
        o.cIni = gir ? cn(hI) : NaN; o.cProj = gir ? cn(hP) : NaN;
        o.cn = pts.map(function (p) { return [p[0], cn(p[1])]; });
        var alt = num(x.alt), di = num(x.dia);
        if (ok(di) && ok(dia) && Math.abs(di - dia) > 2) av("diâmetro medido de " + fmt(di, 1) + " mm, diferente do molde de " + fmt(dia, 1) + " mm — confira.");
        if (ok(alt) && ok(hAlvo) && P.parada !== "altura" && Math.abs(alt - hAlvo) > 0.05 * hAlvo) av("altura de " + fmt(alt, 1) + " mm, afastada mais de 5 % da pretendida (" + fmt(hAlvo, 1) + " mm) — ajuste a massa de mistura (critério da ficha).");
        return o;
      });
      var vvs = cps.map(function (o) { return o.vv; }).filter(ok);
      var R = { n: cps.filter(function (o) { return ok(o.gmb); }).length, vvMedio: media(vvs), gmbMedio: media(cps.map(function (o) { return o.gmb; })),
        vvMin: vvs.length ? Math.min.apply(null, vvs) : NaN, vvMax: vvs.length ? Math.max.apply(null, vvs) : NaN,
        faixaMis: F.mis, faixaComp: F.comp, fonte: F.fonte, tMis: tMis, tComp: tComp, nEsp: nEsp, trafego: T ? T[0] : "", nIni: T ? T[1] : NaN, nProj: T ? T[2] : NaN, nMax: T ? T[3] : NaN,
        golpes: gir ? NaN : golpes, mEst: mEst, gmm: gmm, vvAlvo: vvAlvo, vvTol: vvTol,
        compactador: gir ? "giratório" : P.compactador === "marshall_man" ? "Marshall manual" : "Marshall mecânico",
        foraAlvo: ok(vvAlvo) ? vvs.filter(function (v) { return Math.abs(v - vvAlvo) > vvTol + 1e-9; }).length : null };
      return { tab: { cps: cps }, resultados: R, avisos: avisos };
    },
    resultadosHtml: function (calc, d) {
      var r = calc.resultados, P = d.params || {};
      function cx(v, rot, p) { return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      function fx(f) { return ok(f[0]) && ok(f[1]) ? fmt(f[0], 0) + "–" + fmt(f[1], 0) + " °C" : "—"; }
      return '<div class="fe-res">' +
        cx(fmt(r.vvMedio, 1) + " <small>%</small>", "Vv médio de " + r.n + " CP(s) (" + fmt(r.vvMin, 1) + " a " + fmt(r.vvMax, 1) + " %)" +
          (r.foraAlvo === null ? "" : r.foraAlvo ? ' · <span class="fe-nok">' + r.foraAlvo + " fora do alvo</span>" : ' · <span class="fe-ok">no alvo ' + fmt(r.vvAlvo, 1) + " ± " + fmt(r.vvTol, 1) + " %</span>")) +
        cx(fmt(r.gmbMedio, 3), "Gmb média · Gmm " + fmt(r.gmm, 3), true) +
        cx(fx(r.faixaMis) + " / " + fx(r.faixaComp), "Faixas de mistura / compactação" + (r.fonte ? " — " + esc(r.fonte) : ""), true) +
        cx(giratorio(P) ? (ok(r.nEsp) ? r.nEsp + " giros" : "—") + (r.trafego ? " (" + esc(r.trafego) + ": " + r.nIni + " / " + r.nProj + " / " + r.nMax + ")" : "") : r.golpes + " golpes por face",
          "Energia de compactação — " + r.compactador, true) +
        (ok(r.mEst) ? cx(fmt(r.mEst, 0) + " g", "Massa estimada de mistura para a altura pretendida (Gmm, Vv alvo ou 4 %)", true) : "") + "</div>";
    },
    graficos: function (calc, d, opt) {
      opt = opt || {};
      var P = d.params || {}, r = calc.resultados;
      if (!giratorio(P)) return [];
      var series = calc.tab.cps.map(function (o, i) { return { nome: (d.cps[i] || {}).id || "CP " + (i + 1), pts: o.cn.filter(function (p) { return ok(p[1]) && p[0] > 0; }) }; }).filter(function (s) { return s.pts.length >= 2; });
      if (!series.length) return ['<div class="fe-graf-vazio">A curva de densificação (% Gmm × giros) aparece com as alturas por giro, a Gmb e a Gmm.</div>'];
      var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)";
      var cores = imp ? ["#1f5fbf", "#c0392b", "#2e8b57", "#8e44ad", "#c77d12"] : ["#4f8cff", "#e5534b", "#34c38f", "#b083f0", "#e0a13a"];
      var W = opt.w || 560, H = opt.h || 300, m = { l: 48, r: 16, t: 14, b: 44 };
      var nmax = Math.max.apply(null, series.map(function (s) { return s.pts[s.pts.length - 1][0]; }));
      var ys = []; series.forEach(function (s) { s.pts.forEach(function (p) { ys.push(p[1]); }); });
      var y0 = Math.floor(Math.min.apply(null, ys) / 2) * 2, y1 = Math.min(100, Math.ceil(Math.max.apply(null, ys) / 2) * 2 + 2);
      var x0 = 0, x1 = Math.log10(Math.max(10, nmax) * 1.3);
      function X(n) { return m.l + (Math.log10(n) - x0) / (x1 - x0) * (W - m.l - m.r); }
      function Y(v) { return H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b); }
      var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10.5">';
      [1, 2, 5, 10, 20, 50, 100, 200, 500].filter(function (n) { return Math.log10(n) <= x1; }).forEach(function (n) {
        s += '<line x1="' + X(n) + '" y1="' + m.t + '" x2="' + X(n) + '" y2="' + (H - m.b) + '" stroke="' + grade + '" stroke-width="0.6"/><text x="' + X(n) + '" y="' + (H - m.b + 14) + '" text-anchor="middle" fill="' + txt + '">' + n + "</text>";
      });
      for (var v = y0; v <= y1; v += 2) s += '<line x1="' + m.l + '" y1="' + Y(v) + '" x2="' + (W - m.r) + '" y2="' + Y(v) + '" stroke="' + grade + '" stroke-width="0.6"/><text x="' + (m.l - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end" fill="' + txt + '">' + v + "</text>";
      [[r.nIni, "Nini"], [r.nProj, "Nproj"], [r.nMax, "Nmáx"]].forEach(function (q) {
        if (ok(q[0]) && Math.log10(q[0]) <= x1) s += '<line x1="' + X(q[0]) + '" y1="' + m.t + '" x2="' + X(q[0]) + '" y2="' + (H - m.b) + '" stroke="' + txt + '" stroke-dasharray="4 3"/><text x="' + (X(q[0]) + 3) + '" y="' + (m.t + 11) + '" fill="' + txt + '">' + q[1] + "</text>";
      });
      series.forEach(function (se, k) {
        var c = cores[k % cores.length];
        s += '<path d="' + se.pts.map(function (p, j) { return (j ? "L" : "M") + X(p[0]).toFixed(1) + " " + Y(p[1]).toFixed(1); }).join(" ") + '" fill="none" stroke="' + c + '" stroke-width="2"/>';
        se.pts.forEach(function (p) { s += '<circle cx="' + X(p[0]) + '" cy="' + Y(p[1]) + '" r="2.5" fill="' + c + '"/>'; });
        s += '<text x="' + (W - m.r - 6) + '" y="' + (H - m.b - 8 - k * 13) + '" text-anchor="end" fill="' + c + '">' + esc(se.nome) + "</text>";
      });
      s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + txt + '"/>';
      s += '<text x="' + ((W + m.l) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + txt + '">Número de giros (escala logarítmica)</text>';
      s += '<text transform="translate(13 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + txt + '">Cn (% Gmm) — eq. 1</text>';
      return [s + "</svg>"];
    },
    relatorio: {
      notas: "Temperaturas: ligante com viscosidade de 0,17 ± 0,02 Pa·s (85 ± 10 SSF) na mistura e 0,28 ± 0,03 Pa·s (140 ± 15 SSF) na compactação (5.2), faixas obtidas pelo ajuste ln η × T dos pares informados; ligantes modificados: faixas do fabricante (NOTA 1). Agregados acima da temperatura de mistura, sem excedê-la em mais de 10 °C (5.3 a). Condicionamento de curto prazo à temperatura de compactação ± 3 °C por 2 h ± 10 min (5.3 e) ou 2 h ± 5 min em bateladas múltiplas (5.3 f), revolvendo aos 60 ± 5 min; molde a ± 5 °C por ≥ 45 min (5.3 g). Giratório: 600 ± 18 kPa, 1,25 ± 0,02°, 30 ± 0,5 rpm (4.1); giros pela Tabela 1 (Anexo C) ou por altura. Marshall: 50 ou 75 golpes por face a 64 ± 4 golpes/min (5.5.3.2). Gmb = A/(B − C) (NBR 15573); Vv = (1 − Gmb/Gmm) × 100; Cn = Gmb·hm/(Gmm·hn) × 100 (eq. 1, aproximação — NOTA de 6.2.1). A norma não fixa aceitação do CP: vale o critério do ensaio a que se destina (NOTA da seção 7); o Vv alvo e a tolerância são do usuário. Massa estimada = Gmm × 0,9971 g/cm³ × (1 − Vv/100) × volume do CP.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        function fx(f) { return ok(f[0]) && ok(f[1]) ? fmt(f[0], 0) + " a " + fmt(f[1], 0) + " °C" : "—"; }
        rows.push(["Compactador / energia", r.compactador + " — " + (giratorio(P) ? (ok(r.nEsp) ? r.nEsp + " giros" : "critério de altura") + (r.trafego ? " (tráfego " + r.trafego.toLowerCase() + ": Nini " + r.nIni + ", Nprojeto " + r.nProj + ", Nmáx " + r.nMax + ")" : "") : r.golpes + " golpes por face")]);
        rows.push(["Faixa de temperatura de mistura / compactação", fx(r.faixaMis) + " / " + fx(r.faixaComp) + (r.fonte ? " — " + r.fonte : "")]);
        rows.push(["Temperaturas adotadas", "mistura " + fmt(r.tMis, 0) + " °C · compactação " + fmt(r.tComp, 0) + " °C"]);
        (d.cps || []).forEach(function (x, i) {
          var o = calc.tab.cps[i];
          if (!ok(o.gmb)) return;
          rows.push(["CP " + (x.id || i + 1), "h " + (x.alt || "—") + " mm · Ø " + (x.dia || "—") + " mm · Gmb " + fmt(o.gmb, 3) + " · Vv " + fmt(o.vv, 1) + " %" +
            (giratorio(P) ? " · " + (x.N || "—") + " giros" + (ok(o.cIni) ? " · Cn(Nini) " + fmt(o.cIni, 1) + " %" : "") : "")]);
        });
        rows.push(["Vv médio", fmt(r.vvMedio, 1) + " %" + (ok(r.vvAlvo) ? " (alvo " + fmt(r.vvAlvo, 1) + " ± " + fmt(r.vvTol, 1) + " %: " + (r.foraAlvo ? r.foraAlvo + " CP(s) fora" : "todos no alvo") + ")" : "")]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Giratório — 3 CPs Ø 100 × 63,5 mm para resistência à tração, tráfego médio (conforme)", dados: function () {
        var cp = function (id, mLig, N, hm, alt, A, C, B, curva) {
          return { id: id, mAg: "1140", mLig: mLig, tAg: "163", tLig: "155", tMistura: "157", tempoMist: "60", condT: "144", condMin: "120", mexida: "60",
            moldeT: "144", moldeMin: "60", tCompCP: "144", mCP: "1200", N: N, hm: hm, curva: curva, alt: alt, dia: "100,0", A: A, C: C, B: B };
        };
        return { ident: { registro: "EX-CPG-001", obra: "Obra A", origem: "Pedreira X", camada: "CBUQ faixa C", data: "2025-09-10" },
          params: { compactador: "giratorio", origem: "lab", cond: "simples", ligante: "CAP 50/70 — Distribuidora C", modificado: "nao", viscU: "pas",
            visc: "135=0,42; 150=0,21; 177=0,075", tMis: "157", tComp: "144", agregados: "Gnaisse — Pedreira X — faixa C", tnm: "12,5", diam: "100", hAlvo: "63,5", trafego: "med", parada: "giros",
            gmm: "2,487", vvAlvo: "4,0", vvTol: "0,5", angulo: "1,25", pressao: "600", rpm: "30", calib: "2025-03-02" },
          cps: [cp("G1", "60,0", "75", "63,6", "63,5", "1198,4", "697,2", "1200,3", "1=72,3; 7=69,0; 20=66,6; 50=64,6; 75=63,6"),
            cp("G2", "60,0", "75", "63,4", "63,3", "1199,1", "698,5", "1200,6", "1=72,0; 7=68,8; 20=66,4; 50=64,4; 75=63,4"),
            cp("G3", "60,0", "75", "63,8", "63,7", "1197,9", "696,1", "1199,7", "1=72,6; 7=69,3; 20=66,9; 50=64,8; 75=63,8")] };
      } },
      { nome: "Marshall manual — temperaturas fora da faixa, condicionamento curto e golpes a menos", dados: function () {
        return { ident: { registro: "EX-CPG-002", obra: "Obra B", origem: "Usina 1", camada: "CBUQ faixa B", data: "2025-10-21" },
          params: { compactador: "marshall_man", origem: "lab", cond: "simples", ligante: "CAP 30/45", modificado: "nao", viscU: "ssf",
            visc: "135=185; 150=95; 175=38", tMis: "165", tnm: "19", diam: "101,6", hAlvo: "63,5", golpes: "75", freq: "72", soquete: "4540", queda: "457",
            gmm: "2,455", vvAlvo: "4,0", vvTol: "0,5" },
          cps: [{ id: "M1", mAg: "1130", mLig: "65", tAg: "182", tLig: "160", tMistura: "164", tempoMist: "60", condT: "150", condMin: "95", mexida: "45",
              moldeT: "130", moldeMin: "30", tCompCP: "150", g1: "75", g2: "70", alt: "64,8", dia: "101,6", A: "1190,2", C: "680,5", B: "1195,0" },
            { id: "M2", mAg: "1130", mLig: "65", tAg: "170", tLig: "160", tMistura: "157", tempoMist: "60", condT: "148", condMin: "120", mexida: "60",
              moldeT: "146", moldeMin: "60", tCompCP: "146", g1: "75", g2: "75", alt: "63,9", dia: "101,6", A: "1192,5", C: "690,8", B: "1194,1" }] };
      } },
    ],
  };
})();
