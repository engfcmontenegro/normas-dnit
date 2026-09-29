/*
 * Ficha: DNIT 055/2004-ME — Pavimento rígido — Prova de carga estática: coeficiente de recalque (k) de subleito e sub-base.
 * Pressões × deslocamentos (média de três defletômetros a partir das leituras de referência sob Pad/2), curva
 * pressão-deslocamento (10.1) e k = (P0,127 − Pad/2) / w, com w = 0,127 cm (10.2); sub-base cimentada: k na pressão de 68,9 kPa.
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var KGF = 0.0980665;       // 1 kgf/cm² = 0,0980665 MPa
  var W127 = 1.27;           // mm (0,127 cm = 0,05")
  var P689 = 0.0689;         // MPa (68,9 kPa = 10 psi)
  var UN = [["MPa", "MPa (pressão na placa)"], ["kgf/cm²", "kgf/cm² (pressão na placa)"], ["kN", "kN (carga total na placa)"], ["tf", "tf (carga total na placa)"]];
  var NDEF = 3;

  function areaPlaca(P) { var dc = num(P.diam); if (!ok(dc) || dc <= 0) dc = 79.9; return Math.PI * dc * dc / 4; }  // cm²
  // valor lido -> MPa
  function mpa(v, P) {
    var x = num(v);
    if (!ok(x)) return NaN;
    if (P.unidade === "kgf/cm²") return x * KGF;
    if (P.unidade === "kN") return x * 1000 / (areaPlaca(P) * 100);            // N / mm²
    if (P.unidade === "tf") return x * 9806.65 / (areaPlaca(P) * 100);
    return x;
  }
  // interpolação linear de y em x num ramo monotônico
  function interp(xs, ys, x) {
    for (var i = 1; i < xs.length; i++) {
      var a = xs[i - 1], b = xs[i];
      if ((x >= a && x <= b) || (x <= a && x >= b)) return b === a ? ys[i] : ys[i - 1] + (ys[i] - ys[i - 1]) * (x - a) / (b - a);
    }
    return NaN;
  }

  FE.FICHAS["dnit-055-2004-me"] = {
    titulo: "Prova de carga estática — Coeficiente de recalque (k)",
    rotuloImportar: function (r) { return "k = " + (ok(r.k) ? fmt(r.k, 0) + " MPa/m" : "—"); },
    resumo: "Placa rígida de Ø ≥ 76 cm (recomendada 79,9 cm = 5000 cm²); acomodação até 0,25–0,50 mm (Pad), leituras de referência sob Pad/2, incrementos de 0,015 a 0,020 MPa até 0,15–0,18 MPa (≥ 6 pontos) e descarregamento. k = (P0,127 − Pad/2) / w, com w = 0,127 cm, em MPa/m (10.2); sub-base cimentada: k na pressão de 68,9 kPa.",
    blocos: [],
    params: [
      { k: "fund", r: "Fundação ensaiada (10.2)", tipo: "select",
        opcoes: [["natural", "Subleito ou sub-base não tratada — k no deslocamento de 1,27 mm"], ["cimento", "Sub-base estabilizada com cimento — k na pressão de 68,9 kPa"]] },
      { k: "wAlt", r: "Ruptura antes de 1,27 mm — deslocamento adotado (mm) — opcional",
        dica: "10.2: \"exceto quando a ruptura do terreno ocorrer antes... caso em que se adotará outro valor\"", se: function (d) { return (d.params || {}).fund !== "cimento"; } },
      { k: "unidade", r: "Unidade das pressões/cargas lidas", tipo: "select", opcoes: UN },
      { k: "diam", r: "Diâmetro da placa (cm)", ph: "79,9", dica: "mínimo de 76 cm (5.3)" },
      { k: "pad", r: "Pressão de adensamento Pad (na unidade acima)", dica: "carregamento de acomodação que deu 0,25 a 0,50 mm (8)" },
      { k: "wad", r: "Deslocamento no carregamento de acomodação (mm)", ph: "0,35", dica: "entre 0,25 e 0,50 mm (8)" },
      { k: "sentido", r: "Leitura dos defletômetros com o recalque", tipo: "select", opcoes: [["cresce", "Aumenta"], ["decresce", "Diminui"]] },
      { k: "reacao", r: "Reação do sistema de carga (kN)", dica: "mínimo de 78 a 98 kN (5.1)" },
      { k: "dist", r: "Distância dos apoios da reação à periferia da placa (m)", dica: "mínimo de 2,40 m (5.1)" },
      { k: "cava", r: "Diâmetro da área preparada (m) — ensaio no subleito", dica: "em torno de 2,00 m, nunca menor que o dobro do diâmetro da placa (6)" },
      { k: "horario", r: "Horário de início e fim; condições climáticas (9)", ph: "08:10 – 10:05; céu claro" },
    ],
    padrao: { fund: "natural", unidade: "MPa", diam: "79,9", sentido: "cresce" },
    tabelas: function (d) {
      var P = d.params || {}, u = P.unidade || "MPa";
      var lin = [{ k: "p", r: "Pressão (ou carga) lida", u: u }];
      if (u !== "MPa") lin.push({ calc: "P", r: "Pressão na placa", u: "MPa", casas: 4 });
      for (var i = 1; i <= NDEF; i++) lin.push({ k: "d" + i, r: "Defletômetro " + i + " — leitura", u: "mm" });
      lin.push({ calc: "w", r: "Deslocamento médio (10.1)", u: "mm", casas: 3, destaque: true }, { k: "obs", r: "Fase / observação", texto: true, ph: "carga, descarga, final" });
      return [{ chave: "est", titulo: "Leituras — referência (Pad/2), carregamento e descarregamento (8)", rotulo: "Estágio", iniciais: 10, min: 3,
        nomes: ["Ref. (Pad/2)"], linhas: lin,
        dica: "1ª coluna = leituras iniciais de referência sob Pad/2, após estabilização (≤ 0,02 mm em 2 min); depois um estágio por coluna, na ordem" }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], sinal = P.sentido === "decresce" ? -1 : 1;
      var est = d.est || [], ref = est[0] || {};
      var L0 = [];
      for (var i = 1; i <= NDEF; i++) L0.push(num(ref["d" + i]));
      var nDef = L0.filter(ok).length;
      var col = est.map(function (x, j) {
        var o = { P: mpa(x.p, P) }, ws = [];
        for (var i = 1; i <= NDEF; i++) { var L = num(x["d" + i]); if (ok(L) && ok(L0[i - 1])) ws.push(sinal * (L - L0[i - 1])); }
        o.w = j === 0 ? (nDef ? 0 : NaN) : ws.length ? media(ws) : NaN;
        o.nw = ws.length;
        return o;
      });
      if (nDef && nDef < 3) avisos.push("Só " + nDef + " defletômetro(s) — no mínimo três, em triângulo equilátero sobre a placa (5.4 e 7).");
      var pts = col.map(function (o, j) { return { j: j, P: o.P, w: o.w }; }).filter(function (p) { return ok(p.P) && ok(p.w); });
      var padIn = mpa(P.pad, P), pad2 = ok(padIn) ? padIn / 2 : (pts.length && pts[0].j === 0 ? pts[0].P : NaN);
      if (!ok(padIn) && pts.length) avisos.push("Pad não informada — adotada Pad/2 = pressão das leituras de referência (" + fmt(pad2, 4) + " MPa).");
      if (ok(padIn) && pts.length && pts[0].j === 0 && Math.abs(pts[0].P - pad2) > Math.max(0.002, 0.1 * pad2)) avisos.push("Leituras de referência sob " + fmt(pts[0].P, 4) + " MPa — deveriam ser sob Pad/2 = " + fmt(pad2, 4) + " MPa (8).");
      // ramos
      var iMax = -1;
      pts.forEach(function (p, k) { if (iMax < 0 || p.P > pts[iMax].P) iMax = k; });
      var carga = iMax >= 0 ? pts.slice(0, iMax + 1) : [], desc = iMax >= 0 ? pts.slice(iMax + 1) : [];
      var nCarga = carga.filter(function (p) { return p.j > 0; }).length;
      var Pmax = iMax >= 0 ? pts[iMax].P : NaN;
      // verificações do procedimento (8)
      var wad = num(P.wad);
      if (ok(wad) && (wad < 0.25 || wad > 0.50)) avisos.push("Carregamento de acomodação com " + fmt(wad, 2) + " mm — deve dar deslocamento entre 0,25 e 0,50 mm (8).");
      if (pts.length > 1) {
        if (nCarga < 6) avisos.push("Só " + nCarga + " ponto(s) de carregamento — no mínimo 6 para o traçado da curva (8).");
        var fora = [];
        for (var k = 1; k < carga.length; k++) { var inc = carga[k].P - carga[k - 1].P; if (inc < 0.0145 || inc > 0.0205) fora.push(fmt(inc, 4)); }
        if (fora.length) avisos.push("Incrementos de pressão fora de 0,015 a 0,020 MPa (8): " + fora.join("; ") + " MPa.");
        if (Pmax < 0.15 - 1e-9 || Pmax > 0.18 + 1e-9) avisos.push("Pressão máxima de " + fmt(Pmax, 3) + " MPa — o carregamento deve ir até 0,15 a 0,18 MPa (8).");
        for (k = 1; k < carga.length; k++) if (carga[k].w < carga[k - 1].w - 0.005) { avisos.push("Deslocamento diminuiu durante o carregamento (estágio " + (carga[k].j + 1) + ") — confira as leituras e o sentido dos defletômetros."); break; }
        if (!desc.length) avisos.push("Sem leituras de descarregamento — fazer duas a três leituras intermediárias e uma final na pressão de referência (8).");
        else if (desc.length < 3) avisos.push("Descarregamento com " + desc.length + " leitura(s) — duas a três intermediárias e uma final (8).");
      }
      var resid = desc.length ? desc[desc.length - 1].w : NaN;
      if (desc.length && ok(pad2) && Math.abs(desc[desc.length - 1].P - pad2) > Math.max(0.003, 0.15 * pad2)) avisos.push("A leitura final do descarregamento deve ser na pressão das leituras de referência (Pad/2) para o recalque residual (8).");
      // coeficiente de recalque (10.2)
      var ws = carga.map(function (p) { return p.w; }), ps = carga.map(function (p) { return p.P; });
      var modo = P.fund === "cimento" ? "pressao" : "desl", wk = NaN, Pk = NaN, k = NaN;
      if (modo === "desl") {
        wk = ok(num(P.wAlt)) && num(P.wAlt) > 0 ? num(P.wAlt) : W127;
        Pk = interp(ws, ps, wk);
        if (ok(num(P.wAlt))) avisos.push("Coeficiente calculado no deslocamento adotado de " + fmt(wk, 2) + " mm (ruptura antes de 1,27 mm — 10.2).");
        if (!ok(Pk) && carga.length > 1) avisos.push("O carregamento não atingiu o deslocamento de " + fmt(wk, 2) + " mm (máx. " + fmt(Math.max.apply(null, ws), 3) + " mm) — k não calculado; prossiga o carregamento ou, se houve ruptura, informe o deslocamento adotado (10.2).");
      } else {
        Pk = P689;
        wk = interp(ps, ws, Pk);
        if (!ok(wk) && carga.length > 1) avisos.push("O carregamento não passou pela pressão de 68,9 kPa — k não calculado (10.2).");
      }
      if (ok(Pk) && ok(wk) && wk > 0 && ok(pad2)) k = (Pk - pad2) / (wk / 1000);
      var diam = num(P.diam);
      if (ok(diam) && diam < 76) avisos.push("Placa de Ø " + fmt(diam, 1) + " cm — mínimo de 76 cm (5.3).");
      var reac = num(P.reacao), dist = num(P.dist), cava = num(P.cava);
      if (ok(reac) && reac < 78) avisos.push("Reação de " + fmt(reac, 0) + " kN — mínimo de 78 a 98 kN (8 a 10 tf) (5.1).");
      if (ok(dist) && dist < 2.4) avisos.push("Apoios da reação a " + fmt(dist, 2) + " m da placa — mínimo de 2,40 m (5.1).");
      if (ok(cava) && ok(diam) && cava < 2 * diam / 100) avisos.push("Área preparada de Ø " + fmt(cava, 2) + " m — nunca inferior ao dobro do diâmetro da placa (" + fmt(2 * diam / 100, 2) + " m) (6).");
      return { tab: { est: col }, resultados: { k: k, Pk: Pk, wk: wk, pad2: pad2, modo: modo, resid: resid, Pmax: Pmax, carga: carga, desc: desc, nCarga: nCarga }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      function item(v, rot, p) { return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      return '<div class="fe-res">' +
        item(ok(r.k) ? fmt(r.k, 0) + " <small>MPa/m</small>" : "—", "Coeficiente de recalque k (10.2)" + (ok(r.k) ? " = " + fmt(r.k * 0.1019716, 2) + " kgf/cm³" : "")) +
        item(fmt(r.Pk, 4) + " MPa", r.modo === "pressao" ? "Pressão de cálculo (68,9 kPa — sub-base cimentada)" : "Pressão no deslocamento de " + fmt(r.wk, 2) + " mm (interpolada)", true) +
        item(fmt(r.wk, 3) + " mm", r.modo === "pressao" ? "Deslocamento na pressão de 68,9 kPa (interpolado)" : "Deslocamento de cálculo w", true) +
        item(fmt(r.pad2, 4) + " MPa", "Pad/2 — pressão das leituras de referência", true) +
        item(fmt(r.Pmax, 3) + " MPa", "Pressão máxima aplicada (" + r.nCarga + " estágios de carga)", true) +
        item(fmt(r.resid, 2) + " mm", "Recalque residual (após o descarregamento)", true) + "</div>";
    },
    graficos: function (calc, d, opt) { return [grafico(calc, opt || {})]; },
    relatorio: {
      notas: "Placa de aço de Ø ≥ 76 cm (recomendada 79,9 cm, 5000 cm²), três defletômetros de 0,01 mm em triângulo equilátero (5.3, 5.4, 7). Carregamento de acomodação até 0,25–0,50 mm (pressão Pad) e descarga; leituras de referência sob Pad/2 após estabilização (oscilação ≤ 0,02 mm em 2 min); incrementos de 0,015 a 0,020 MPa até 0,15–0,18 MPa (≥ 6 pontos); descarregamento com 2 a 3 leituras intermediárias e uma final na pressão de referência (recalque residual) (8). Curva: deslocamento médio dos três defletômetros × pressão (10.1). k = (P0,127 − Pad/2) / w, w = 0,127 cm, em MPa/m (10.2), com P0,127 interpolada linearmente no ramo de carregamento; sub-base estabilizada com cimento: a norma manda calcular k \"para a pressão de 68,9 kPa\" — a ficha usa k = (68,9 kPa − Pad/2) / w68,9, coerente com a fórmula de 10.2. A norma não prevê correção de curvatura inicial nem de saturação/flexão da placa. Na seção 3.1 a unidade de P aparece como \"MPa/m (kgf/cm²/cm)\", que é a unidade de k (erro da norma). 1 MPa/m = 0,10197 kgf/cm³.",
      resultados: function (calc, d) {
        var r = calc.resultados, rows = [];
        rows.push(["Coeficiente de recalque k", ok(r.k) ? fmt(r.k, 0) + " MPa/m (" + fmt(r.k * 0.1019716, 2) + " kgf/cm³)" : "não calculado"]);
        rows.push([r.modo === "pressao" ? "Deslocamento na pressão de 68,9 kPa" : "Pressão no deslocamento de " + fmt(r.wk, 2) + " mm", r.modo === "pressao" ? fmt(r.wk, 3) + " mm" : fmt(r.Pk, 4) + " MPa"]);
        rows.push(["Pad/2 (referência)", fmt(r.pad2, 4) + " MPa"]);
        rows.push(["Pressão máxima / estágios de carga", fmt(r.Pmax, 3) + " MPa / " + r.nCarga]);
        if (ok(r.resid)) rows.push(["Recalque residual", fmt(r.resid, 2) + " mm"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Subleito — placa de 79,9 cm, 8 estágios até 0,155 MPa, k ≈ 50 MPa/m", dados: function () {
        return gerar({ registro: "EX-PC-001", obra: "Obra A", trecho: "BR-000", local: "Estaca 120 — eixo", camada: "Subleito", data: "2025-06-03" },
          { fund: "natural", unidade: "MPa", diam: "79,9", pad: "0,030", wad: "0,38", sentido: "cresce", reacao: "98", dist: "2,60", cava: "2,00", horario: "08:10 – 10:05; céu claro" },
          0.015, [0.0325, 0.050, 0.0675, 0.085, 0.1025, 0.120, 0.1375, 0.155], [0.110, 0.065, 0.035], function (pn) { return pn / 0.06 * (1 + 3 * pn); },
          ["5,00", "5,12", "4,96"], [1.02, 0.97, 1.01], function (x) { return fmt(x, 4); });
      } },
      { nome: "Sub-base cimentada — carga em kN, dois defletômetros, poucos estágios e incrementos grandes", dados: function () {
        var A = Math.PI * 76 * 76 / 4 * 100;  // mm²
        return gerar({ registro: "EX-PC-002", obra: "Obra C", local: "Estaca 45 — borda direita", camada: "Sub-base de solo-cimento", data: "2025-10-14" },
          { fund: "cimento", unidade: "kN", diam: "76", pad: "13,6", wad: "0,20", sentido: "decresce", reacao: "70", dist: "2,10", horario: "14:00 – 15:10; nublado" },
          0.015, [0.045, 0.075, 0.105, 0.135], [0.060], function (pn) { return pn / 0.25 * (1 + 2 * pn); },
          ["10,00", "10,00"], [1.03, 0.97], function (x) { return fmt(x * A / 1000, 1); });
      } },
    ],
  };

  // leituras de exemplo: pressão de referência (MPa), pressões de carga e de descarga (MPa), w(P − Pref) em mm (carga),
  // L0 dos defletômetros, fator de cada defletômetro, conversão MPa -> valor lido
  function gerar(ident, params, pref, cargas, descargas, wf, L0s, fat, conv) {
    var s = params.sentido === "decresce" ? -1 : 1, est = [], wmax = wf(cargas[cargas.length - 1] - pref);
    function col(Pm, w, obs) {
      var c = { p: conv(Pm), obs: obs };
      L0s.forEach(function (l, i) { c["d" + (i + 1)] = fmt(Math.round((num(l) + s * w * fat[i]) * 100) / 100, 2); });
      return c;
    }
    est.push(col(pref, 0, "referência"));
    cargas.forEach(function (p) { est.push(col(p, wf(p - pref), "carga")); });
    // descarga: recuperação elástica de ~60 % do deslocamento proporcional à redução de pressão
    var pm = cargas[cargas.length - 1];
    descargas.concat([pref]).forEach(function (p, i, arr) { est.push(col(p, wmax - 0.6 * wmax * (pm - p) / (pm - pref), i === arr.length - 1 ? "final" : "descarga")); });
    return { ident: ident, params: params, est: est };
  }

  function grafico(calc, opt) {
    var r = calc.resultados, pts = r.carga.concat(r.desc);
    if (pts.length < 2) return '<div class="fe-graf-vazio">A curva pressão × deslocamento aparece com as leituras.</div>';
    var W = opt.w || 560, H = opt.h || 300, m = { l: 56, r: 16, t: 16, b: 42 };
    var wMax = Math.max.apply(null, pts.map(function (p) { return p.w; }).concat([r.modo === "desl" ? r.wk : 0, 0.5]));
    var pMax = Math.max.apply(null, pts.map(function (p) { return p.P; }).concat([0.05]));
    var px = wMax > 3 ? 1 : wMax > 1.2 ? 0.5 : 0.25, x1 = Math.ceil(wMax * 1.05 / px) * px;
    var py = pMax > 0.12 ? 0.02 : 0.01, y1 = Math.ceil(pMax * 1.05 / py) * py;
    function X(v) { return m.l + v / x1 * (W - m.l - m.r); }
    function Y(v) { return H - m.b - v / y1 * (H - m.t - m.b); }
    var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)", cor = imp ? "#1f5fbf" : "#4f8cff", cor2 = imp ? "#c0392b" : "#e0a13a";
    var g = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
    for (var v = 0; v <= x1 + 1e-9; v += px) {
      g += '<line x1="' + X(v) + '" y1="' + m.t + '" x2="' + X(v) + '" y2="' + (H - m.b) + '" stroke="' + grade + '" stroke-width="0.6"/>';
      g += '<text x="' + X(v) + '" y="' + (H - m.b + 15) + '" text-anchor="middle" fill="' + txt + '">' + fmt(v, px < 0.5 ? 2 : 1) + "</text>";
    }
    for (v = 0; v <= y1 + 1e-9; v += py) {
      g += '<line x1="' + m.l + '" y1="' + Y(v) + '" x2="' + (W - m.r) + '" y2="' + Y(v) + '" stroke="' + grade + '" stroke-width="0.6"/>';
      g += '<text x="' + (m.l - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end" fill="' + txt + '">' + fmt(v, 2) + "</text>";
    }
    g += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + txt + '"/>';
    g += '<text x="' + ((W + m.l - m.r) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + txt + '">Deslocamento vertical médio (mm)</text>';
    g += '<text transform="translate(13 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + txt + '">Pressão na placa (MPa)</text>';
    function linha(arr, c, tr) { return '<path d="' + arr.map(function (p, i) { return (i ? "L" : "M") + X(p.w).toFixed(1) + " " + Y(p.P).toFixed(1); }).join(" ") + '" fill="none" stroke="' + c + '" stroke-width="2"' + (tr ? ' stroke-dasharray="5 4"' : "") + "/>"; }
    g += linha(r.carga, cor);
    if (r.desc.length) g += linha([r.carga[r.carga.length - 1]].concat(r.desc), cor2, true);
    r.carga.forEach(function (p) { g += '<circle cx="' + X(p.w).toFixed(1) + '" cy="' + Y(p.P).toFixed(1) + '" r="3" fill="' + cor + '"/>'; });
    r.desc.forEach(function (p) { g += '<circle cx="' + X(p.w).toFixed(1) + '" cy="' + Y(p.P).toFixed(1) + '" r="3" fill="none" stroke="' + cor2 + '" stroke-width="1.5"/>'; });
    if (ok(r.Pk) && ok(r.wk)) {
      g += '<path d="M' + X(r.wk).toFixed(1) + " " + (H - m.b) + " L" + X(r.wk).toFixed(1) + " " + Y(r.Pk).toFixed(1) + " L" + m.l + " " + Y(r.Pk).toFixed(1) + '" fill="none" stroke="' + txt + '" stroke-dasharray="3 3"/>';
      g += '<circle cx="' + X(r.wk).toFixed(1) + '" cy="' + Y(r.Pk).toFixed(1) + '" r="4.5" fill="none" stroke="' + txt + '" stroke-width="1.5"/>';
    }
    if (ok(r.pad2)) g += '<line x1="' + m.l + '" y1="' + Y(r.pad2).toFixed(1) + '" x2="' + (W - m.r) + '" y2="' + Y(r.pad2).toFixed(1) + '" stroke="' + txt + '" stroke-width="0.6" stroke-dasharray="2 4"/>';
    g += '<text x="' + (m.l + 8) + '" y="' + (m.t + 16) + '" fill="' + cor + '" font-weight="bold">' + (ok(r.k) ? "k = " + fmt(r.k, 0) + " MPa/m" : "k não calculado") + "</text>";
    g += '<text x="' + (m.l + 8) + '" y="' + (m.t + 30) + '" fill="' + txt + '">— carga  - - descarga</text>';
    return g + "</svg>";
  }
})();
