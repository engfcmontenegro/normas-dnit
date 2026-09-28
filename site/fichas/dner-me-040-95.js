/*
 * Ficha: DNER-ME 040/95 — Prospecção geofísica pelo método de eletrorresistividade — sondagem elétrica vertical.
 * ρa = K × ΔV / I (3.2), com K do arranjo usado: Schlumberger / retângulo K = 2π (a² − b²) / (4b) (5.2, 5.4),
 * Wenner K = 4π b (5.1), Lee K = 6π a (5.3), geral K = 2π / (1/AM − 1/AN − 1/BM + 1/BN) (3.2) e furo de
 * sondagem K = 4π r1 r2 / (r1 − r2) (5.5); a = AB/2 e b = MN/2 (Anexo A, Figuras 2 e 3).
 * Curva ρa × AB/2 em escala bilogarítmica, com o mesmo módulo nos dois eixos (6 e 7).
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, fmtSig = FE.fmtSig, esc = FE.esc;
  var PI = Math.PI;

  var ARRANJOS = [
    ["schlumberger", "Schlumberger (5.2)"], ["retangulo", "Retângulo (5.4 — K do Schlumberger)"], ["wenner", "Wenner (5.1)"],
    ["lee", "Lee (5.3)"], ["geral", "Geral — quatro distâncias (3.2)"], ["furo", "Resistividade em furo de sondagem (5.5)"],
  ];
  function arranjo(d) { var a = (d.params || {}).arranjo; return ARRANJOS.some(function (x) { return x[0] === a; }) ? a : "schlumberger"; }
  function nomeArranjo(a) { return (ARRANJOS.filter(function (x) { return x[0] === a; })[0] || ["", ""])[1]; }

  // coeficiente geométrico K (m) de uma leitura
  function coefK(arr, x) {
    var a = num(x.ab2), b = num(x.mn) / 2;
    if (arr === "schlumberger" || arr === "retangulo") return ok(a) && ok(b) && b > 0 && a > b ? 2 * PI * (a * a - b * b) / (4 * b) : NaN;
    if (arr === "wenner") return ok(b) && b > 0 ? 4 * PI * b : NaN;
    if (arr === "lee") return ok(a) && a > 0 ? 6 * PI * a : NaN;
    if (arr === "geral") {
      var am = num(x.am), an = num(x.an), bm = num(x.bm), bn = num(x.bn);
      if (![am, an, bm, bn].every(function (v) { return ok(v) && v > 0; })) return NaN;
      var den = 1 / am - 1 / an - 1 / bm + 1 / bn;
      return den ? 2 * PI / den : NaN;
    }
    if (arr === "furo") {
      var r1 = num(x.r1), r2 = num(x.r2);
      return ok(r1) && ok(r2) && r1 > 0 && r2 > 0 && r1 !== r2 ? 4 * PI * r1 * r2 / (r1 - r2) : NaN;
    }
    return NaN;
  }
  function abscissa(arr, x) { return num(arr === "furo" ? x.prof : x.ab2); }

  FE.FICHAS["dner-me-040-95"] = {
    titulo: "Eletrorresistividade — sondagem elétrica vertical",
    resumo: "Para cada espaçamento: K do arranjo (a = AB/2, b = MN/2), ρa = K × ΔV / I (ΔV em mV, I em mA, ρa em Ω·m) e curva de resistividade aparente × AB/2 em escala bilogarítmica, com interpretação por camadas (resistividade e espessura) registrada pelo operador.",
    blocos: [],
    params: [
      { k: "arranjo", r: "Arranjo de eletrodos", tipo: "select", recarrega: true, opcoes: ARRANJOS },
      { k: "sev", r: "Sondagem elétrica nº", ph: "ex.: SE-01" },
      { k: "equip", r: "Equipamento (resistivímetro)", ph: "ex.: resistivímetro de corrente contínua" },
      { k: "coord", r: "Coordenadas do centro O / estaca 0", ph: "ex.: E 000000, N 0000000" },
      { k: "direcao", r: "Direção da linha AB", ph: "ex.: N45E, ao longo do eixo" },
    ],
    padrao: { arranjo: "schlumberger" },
    tabelas: function (d) {
      var arr = arranjo(d), L;
      var lei = [{ k: "U", r: "Tensão aplicada U — opcional", u: "V" }, { k: "I", r: "Corrente I", u: "mA" }, { k: "dv", r: "Diferença de potencial ΔV", u: "mV" }];
      var res = [{ calc: "K", r: "Coeficiente geométrico K", u: "m", casas: 2 }, { calc: "rho", r: "ρa = K × ΔV / I (3.2)", u: "Ω·m", casas: 1, destaque: true }];
      if (arr === "geral") {
        L = [{ k: "ab2", r: "AB/2 — abscissa do gráfico", u: "m" }, { k: "am", r: "AM", u: "m" }, { k: "an", r: "AN", u: "m" }, { k: "bm", r: "BM", u: "m" }, { k: "bn", r: "BN", u: "m" }]
          .concat(lei, [{ calc: "K", r: "K = 2π / (1/AM − 1/AN − 1/BM + 1/BN) (3.2)", u: "m", casas: 2 }, res[1]]);
      } else if (arr === "furo") {
        L = [{ k: "prof", r: "Profundidade do eletrodo no furo", u: "m" }, { k: "r1", r: "r1 (Figura 7)", u: "m" }, { k: "r2", r: "r2 (Figura 7)", u: "m" }]
          .concat(lei.slice(1), [{ calc: "K", r: "K = 4π r1 r2 / (r1 − r2) (5.5)", u: "m", casas: 2 }, res[1]]);
      } else {
        var rotK = arr === "wenner" ? "K = 4π b (5.1)" : arr === "lee" ? "K = 6π a (5.3)" : "K = 2π (a² − b²) / (4b) (5.2)";
        L = [{ k: "ab2", r: "AB/2 = a", u: "m" }, { k: "mn", r: "MN = 2b", u: "m" }].concat(lei,
          [{ calc: "rel", r: "Relação AB/MN", u: "", casas: 1 }, { calc: "K", r: rotK, u: "m", casas: 2 }, res[1]]);
      }
      return [
        { chave: "leituras", titulo: "Leituras — " + nomeArranjo(arr) + " (Anexo B, Tabelas 1 e 2)", rotulo: "Nº", iniciais: 8, min: 2,
          dica: arr === "schlumberger" ? "ao aumentar MN, repita duas leituras com o MN anterior e o novo (embreagem, 5.2)" : "centro O fixo; aumente AB a cada leitura (3.3)",
          linhas: L },
        { chave: "camadas", titulo: "Interpretação — camadas geoelétricas (7)", rotulo: "Camada", iniciais: 3, min: 1,
          dica: "resultado da comparação com curvas teóricas / programa e da calibração com sondagem mecânica; deixe a espessura da última em branco",
          linhas: [
            { k: "rho", r: "Resistividade da camada", u: "Ω·m" },
            { k: "esp", r: "Espessura", u: "m" },
            { calc: "topo", r: "Profundidade do topo", u: "m", casas: 1 },
            { calc: "base", r: "Profundidade da base", u: "m", casas: 1 },
            { k: "desc", r: "Interpretação geológica", u: "", texto: true, ph: "ex.: solo arenoso seco" },
          ] },
      ];
    },
    calcular: function (d) {
      var arr = arranjo(d), avisos = [];
      if (arr === "lee") avisos.push("Arranjo de Lee: K = 6π·a conforme impresso em 5.3 (a = AB/2, Figura 2). Pela teoria do arranjo de Lee (leitura entre o eletrodo central e um lateral), K = 4π·MN = 8π·b — confira antes de usar os valores.");
      var mn0 = NaN;
      var L = (d.leituras || []).map(function (x, i) {
        var K = coefK(arr, x), I = num(x.I), dv = num(x.dv), n = i + 1;
        var rho = ok(K) && ok(I) && ok(dv) && I !== 0 ? K * dv / I : NaN;
        var ab2 = num(x.ab2), mn = num(x.mn), rel = ok(ab2) && ok(mn) && mn > 0 ? 2 * ab2 / mn : NaN;
        if (ok(mn) && !ok(mn0)) mn0 = mn;
        if (ok(rho) && rho <= 0) avisos.push("Leitura " + n + ": ρa ≤ 0 — confira sinais de ΔV e I.");
        if ((arr === "schlumberger") && ok(rel)) {
          if (rel < 3) avisos.push("Leitura " + n + ": AB/MN = " + fmt(rel, 1) + " — o Schlumberger exige AB/MN ≥ 5 (≥ 3 só nas primeiras medições) (5.2).");
          else if (rel < 5 && mn !== mn0) avisos.push("Leitura " + n + ": AB/MN = " + fmt(rel, 1) + " < 5 — a relação ≥ 3 só é admitida nas primeiras medições da SEV (5.2).");
        }
        if ((arr === "schlumberger" || arr === "retangulo") && ok(ab2) && ok(mn) && mn / 2 >= ab2) avisos.push("Leitura " + n + ": MN/2 ≥ AB/2 — geometria impossível.");
        if (arr === "wenner" && ok(ab2) && ok(mn) && Math.abs(ab2 - 1.5 * mn) > 0.01 * ab2) avisos.push("Leitura " + n + ": no Wenner AM = MN = NB (a = 3b, AB/2 = 1,5 × MN); informado AB/2 = " + fmt(ab2, 2) + " m e MN = " + fmt(mn, 2) + " m (5.1).");
        return { K: K, rho: rho, rel: arr === "schlumberger" || arr === "retangulo" || arr === "wenner" || arr === "lee" ? rel : NaN, x: abscissa(arr, x), mn: mn };
      });
      // embreagem (5.2): ao trocar MN, duas leituras superpostas (mesmo AB/2) com o MN anterior e o novo
      if (arr === "schlumberger") {
        var mns = [];
        L.forEach(function (o) { if (ok(o.mn) && mns.indexOf(o.mn) === -1) mns.push(o.mn); });
        for (var j = 1; j < mns.length; j++) {
          var ant = L.filter(function (o) { return o.mn === mns[j - 1] && ok(o.x); }).map(function (o) { return o.x; });
          var nov = L.filter(function (o) { return o.mn === mns[j] && ok(o.x); }).map(function (o) { return o.x; });
          var comuns = ant.filter(function (v) { return nov.indexOf(v) !== -1; }).length;
          if (comuns < 2) avisos.push("Embreagem MN " + fmt(mns[j - 1], 1) + " → " + fmt(mns[j], 1) + " m: " + comuns + " AB/2 superposto(s); a norma pede duas leituras com o MN anterior e o novo (5.2, Figura 4).");
        }
      }
      var validos = L.filter(function (o) { return ok(o.rho) && o.rho > 0 && ok(o.x) && o.x > 0; });
      var xs = validos.map(function (o) { return o.x; }), rs = validos.map(function (o) { return o.rho; });
      // camadas interpretadas
      var prof = 0, cam = (d.camadas || []).map(function (c, i, arrC) {
        var e = num(c.esp), r = num(c.rho), o = { topo: NaN, base: NaN };
        if (!ok(r) && !ok(e)) return o;
        o.topo = prof;
        if (ok(e)) { prof += e; o.base = prof; }
        else if (i < arrC.length - 1 && arrC.slice(i + 1).some(function (z) { return ok(num(z.rho)); })) avisos.push("Camada " + (i + 1) + ": informe a espessura (só a última camada fica sem base).");
        return o;
      });
      return { tab: { leituras: L, camadas: cam }, resultados: {
        arr: arr, n: validos.length, xMin: xs.length ? Math.min.apply(null, xs) : NaN, xMax: xs.length ? Math.max.apply(null, xs) : NaN,
        rMin: rs.length ? Math.min.apply(null, rs) : NaN, rMax: rs.length ? Math.max.apply(null, rs) : NaN,
        camadas: (d.camadas || []).map(function (c, i) { return { rho: num(c.rho), esp: num(c.esp), topo: cam[i].topo, base: cam[i].base, desc: c.desc || "" }; })
          .filter(function (c) { return ok(c.rho) || ok(c.esp); }) }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, abs = r.arr === "furo" ? "Profundidade" : "AB/2";
      var h = '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + r.n + '</div><div class="fe-res-r">Leituras válidas — ' + esc(nomeArranjo(r.arr)) + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + fmtSig(r.xMin, 2) + " a " + fmtSig(r.xMax, 3) + ' m</div><div class="fe-res-r">' + abs + " investigado</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + fmtSig(r.rMin, 3) + " a " + fmtSig(r.rMax, 3) + ' Ω·m</div><div class="fe-res-r">Faixa de resistividade aparente</div></div></div>';
      if (r.camadas.length) {
        h += '<table class="fe-resumo"><thead><tr><th>Camada</th><th>ρ (Ω·m)</th><th>Profundidade (m)</th><th>Espessura (m)</th><th>Interpretação</th></tr></thead><tbody>' +
          r.camadas.map(function (c, i) {
            return "<tr><td>" + (i + 1) + "</td><td>" + fmtSig(c.rho, 3) + "</td><td>" + fmt(c.topo, 1) + (ok(c.base) ? " a " + fmt(c.base, 1) : " em diante") + "</td><td>" +
              (ok(c.esp) ? fmt(c.esp, 1) : "—") + "</td><td>" + esc(c.desc) + "</td></tr>";
          }).join("") + "</tbody></table>";
      }
      return h;
    },
    graficos: function (calc, d, opt) {
      opt = opt || {};
      var arr = calc.resultados.arr, pts = [];
      (calc.tab.leituras || []).forEach(function (o, i) { if (ok(o.rho) && o.rho > 0 && ok(o.x) && o.x > 0) pts.push({ x: o.x, y: o.rho, mn: o.mn, i: i }); });
      if (!pts.length) return ['<div class="fe-graf-vazio">A curva aparece quando houver leituras completas.</div>'];
      var lg = Math.log10;
      var x0 = Math.floor(lg(Math.min.apply(null, pts.map(function (p) { return p.x; })))), x1 = Math.ceil(lg(Math.max.apply(null, pts.map(function (p) { return p.x; }))));
      var y0 = Math.floor(lg(Math.min.apply(null, pts.map(function (p) { return p.y; })))), y1 = Math.ceil(lg(Math.max.apply(null, pts.map(function (p) { return p.y; }))));
      if (x1 === x0) x1++;
      if (y1 === y0) y1++;
      // mesmo módulo (comprimento de uma década) nos dois eixos (6: 62,5 mm por ciclo nos dois eixos)
      var m = { l: 58, r: 16, t: 14, b: 42 }, Wmax = opt.w || 560, Hmax = (opt.h || 330) + 60;
      var mod = Math.min((Wmax - m.l - m.r) / (x1 - x0), (Hmax - m.t - m.b) / (y1 - y0), 170);
      var W = m.l + m.r + mod * (x1 - x0), H = m.t + m.b + mod * (y1 - y0);
      function X(v) { return m.l + (lg(v) - x0) * mod; }
      function Y(v) { return H - m.b - (lg(v) - y0) * mod; }
      var cor = opt.imprimir ? { eixo: "#333", grade: "#ddd", grade2: "#bbb", txt: "#222", ser: ["#1f5fbf", "#c0392b", "#2e8b57", "#8e44ad", "#d35400", "#555"] }
        : { eixo: "var(--text-dim)", grade: "var(--border)", grade2: "var(--text-dim)", txt: "var(--text-dim)", ser: ["#4f8cff", "#e0a13a", "#3fb950", "#bc8cff", "#ff7b72", "#9aa3b2"] };
      var s = '<svg class="fe-graf" viewBox="0 0 ' + W.toFixed(0) + " " + H.toFixed(0) + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
      function rot(v) { return v >= 1 ? fmt(v, 0) : fmt(v, -Math.floor(lg(v))); }
      for (var e = x0; e <= x1; e++) for (var k = 1; k <= 9; k++) {
        var vx = k * Math.pow(10, e);
        if (lg(vx) > x1 + 1e-9) break;
        s += '<line x1="' + X(vx).toFixed(1) + '" y1="' + m.t + '" x2="' + X(vx).toFixed(1) + '" y2="' + (H - m.b) + '" stroke="' + (k === 1 ? cor.grade2 : cor.grade) + '" stroke-width="' + (k === 1 ? 0.8 : 0.5) + '"/>';
        if (k === 1 || k === 2 || k === 5) s += '<text x="' + X(vx).toFixed(1) + '" y="' + (H - m.b + 14) + '" text-anchor="middle" fill="' + cor.txt + '"' + (k === 1 ? "" : ' font-size="9"') + ">" + rot(vx) + "</text>";
      }
      for (var f = y0; f <= y1; f++) for (var q = 1; q <= 9; q++) {
        var vy = q * Math.pow(10, f);
        if (lg(vy) > y1 + 1e-9) break;
        s += '<line x1="' + m.l + '" y1="' + Y(vy).toFixed(1) + '" x2="' + (W - m.r) + '" y2="' + Y(vy).toFixed(1) + '" stroke="' + (q === 1 ? cor.grade2 : cor.grade) + '" stroke-width="' + (q === 1 ? 0.8 : 0.5) + '"/>';
        if (q === 1 || q === 2 || q === 5) s += '<text x="' + (m.l - 5) + '" y="' + (Y(vy) + 4).toFixed(1) + '" text-anchor="end" fill="' + cor.txt + '"' + (q === 1 ? "" : ' font-size="9"') + ">" + rot(vy) + "</text>";
      }
      s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r).toFixed(1) + '" height="' + (H - m.t - m.b).toFixed(1) + '" fill="none" stroke="' + cor.eixo + '"/>';
      s += '<text x="' + ((W + m.l - m.r) / 2).toFixed(1) + '" y="' + (H - 8).toFixed(1) + '" text-anchor="middle" fill="' + cor.txt + '">' + (arr === "furo" ? "Profundidade (m)" : "AB/2 (m)") + "</text>";
      s += '<text transform="translate(14 ' + ((H - m.b + m.t) / 2).toFixed(1) + ') rotate(-90)" text-anchor="middle" fill="' + cor.txt + '">ρa (Ω·m)</text>';
      // ramos: mesmo MN no Schlumberger / retângulo (embreagem, Figura 4); uma só curva nos demais
      var ramos = {}, ordem = [];
      pts.forEach(function (p) {
        var ch = (arr === "schlumberger" || arr === "retangulo") && ok(p.mn) ? String(p.mn) : "_";
        if (!ramos[ch]) { ramos[ch] = []; ordem.push(ch); }
        ramos[ch].push(p);
      });
      ordem.forEach(function (ch, j) {
        var c = cor.ser[j % cor.ser.length], rp = ramos[ch].slice().sort(function (a, b) { return a.x - b.x; });
        if (rp.length > 1) s += '<path d="' + rp.map(function (p, i) { return (i ? "L" : "M") + X(p.x).toFixed(1) + " " + Y(p.y).toFixed(1); }).join(" ") + '" fill="none" stroke="' + c + '" stroke-width="1.6"/>';
        rp.forEach(function (p) { s += '<circle cx="' + X(p.x).toFixed(1) + '" cy="' + Y(p.y).toFixed(1) + '" r="3.5" fill="' + c + '"/>'; });
        if (ch !== "_") {  // legenda dos ramos (embreagem) no canto inferior direito
          var ly = H - m.b - 10 - (ordem.length - 1 - j) * 14, lx = W - m.r - 78;
          s += '<rect x="' + lx.toFixed(1) + '" y="' + (ly - 4).toFixed(1) + '" width="8" height="8" fill="' + c + '"/>' +
            '<text x="' + (lx + 12).toFixed(1) + '" y="' + (ly + 4).toFixed(1) + '" fill="' + c + '" font-size="10">MN = ' + fmt(Number(ch), Number(ch) < 1 ? 1 : 0) + " m</text>";
        }
      });
      return [s + "</svg>"];
    },
    relatorio: {
      notas: "ρa = K × ΔV / I (3.2), K em m, ΔV em mV e I em mA. K conforme o arranjo: Schlumberger e retângulo K = 2π (a² − b²) / (4b) (5.2, 5.4); Wenner K = 4π b, com a = 3b (5.1); Lee K = 6π a (5.3, como impresso); geral K = 2π / (1/AM − 1/AN − 1/BM + 1/BN) (3.2); furo de sondagem K = 4π r1 r2 / (r1 − r2) (5.5); a = AB/2 e b = MN/2 (Anexo A). Schlumberger: AB/MN ≥ 5 (≥ 3 só nas primeiras medições) e duas leituras superpostas a cada aumento de MN (embreagem, 5.2). Curva em escala bilogarítmica com o mesmo módulo nos dois eixos (6; a norma fixa 62,5 mm por ciclo). A interpretação (7) compara a curva com curvas teóricas e deve ser calibrada por sondagem mecânica; precisão exigida de ρa ≥ 10 % e fugas ≤ 10 % de ΔV (4).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        rows.push(["Arranjo", nomeArranjo(r.arr) + (P.sev ? " — " + P.sev : "")]);
        rows.push([r.arr === "furo" ? "Profundidades investigadas" : "AB/2 investigado", fmtSig(r.xMin, 2) + " a " + fmtSig(r.xMax, 3) + " m (" + r.n + " leituras)"]);
        rows.push(["Resistividade aparente", fmtSig(r.rMin, 3) + " a " + fmtSig(r.rMax, 3) + " Ω·m"]);
        r.camadas.forEach(function (c, i) {
          rows.push(["Camada " + (i + 1), "ρ = " + fmtSig(c.rho, 3) + " Ω·m; " + fmt(c.topo, 1) + (ok(c.base) ? " a " + fmt(c.base, 1) + " m" : " m em diante") + (c.desc ? " — " + c.desc : "")]);
        });
        return rows;
      },
    },
    exemplos: [
      { nome: "SEV Schlumberger em jazida — solo seco / argila saturada / rocha", dados: function () {
        return { ident: { registro: "EX-SEV-001", data: "2025-07-08", obra: "Obra A", trecho: "Jazida 1", local: "Estaca 0 — centro da SEV", responsavel: "" },
          params: { arranjo: "schlumberger", sev: "SE-01", equip: "Resistivímetro de corrente contínua", coord: "E 000000, N 0000000", direcao: "N45E" },
          leituras: [
            { ab2: "1", mn: "0,6", U: "100", I: "35", dv: "3232" }, { ab2: "1,5", mn: "0,6", U: "100", I: "40", dv: "1485" },
            { ab2: "2", mn: "0,6", U: "100", I: "42", dv: "789,8" }, { ab2: "3", mn: "0,6", U: "150", I: "55", dv: "365,5" },
            { ab2: "5", mn: "0,6", U: "150", I: "60", dv: "94,3" }, { ab2: "7", mn: "0,6", U: "200", I: "75", dv: "46,86" },
            { ab2: "5", mn: "2", U: "150", I: "60", dv: "337,4" }, { ab2: "7", mn: "2", U: "200", I: "75", dv: "164,1" },
            { ab2: "10", mn: "2", U: "200", I: "80", dv: "64,31" }, { ab2: "15", mn: "2", U: "250", I: "90", dv: "26,09" },
            { ab2: "20", mn: "2", U: "250", I: "95", dv: "14,55" },
            { ab2: "15", mn: "6", U: "250", I: "90", dv: "84,35" }, { ab2: "20", mn: "6", U: "250", I: "95", dv: "45,94" },
            { ab2: "30", mn: "6", U: "300", I: "110", dv: "24,76" }, { ab2: "40", mn: "6", U: "300", I: "110", dv: "16,9" },
            { ab2: "60", mn: "6", U: "400", I: "130", dv: "12,45" }, { ab2: "80", mn: "6", U: "400", I: "130", dv: "9,324" },
            { ab2: "60", mn: "20", U: "400", I: "130", dv: "43,98" }, { ab2: "80", mn: "20", U: "400", I: "130", dv: "32,18" },
            { ab2: "100", mn: "20", U: "500", I: "150", dv: "28,94" },
          ],
          camadas: [{ rho: "460", esp: "1,8", desc: "Solo arenoso seco (cascalho laterítico)" }, { rho: "70", esp: "11", desc: "Argila arenosa saturada" },
            { rho: "2000", esp: "", desc: "Rocha (topo do embasamento)" }] };
      } },
      { nome: "Wenner — espaçamento incoerente numa leitura (aviso)", dados: function () {
        return { ident: { registro: "EX-SEV-002", data: "2025-07-15", obra: "Obra B", trecho: "Pedreira X", local: "Linha 2 — ponto central" },
          params: { arranjo: "wenner", sev: "SE-02", equip: "Resistivímetro de corrente contínua", direcao: "E-W" },
          leituras: [
            { ab2: "1,5", mn: "1", U: "100", I: "30", dv: "4297" }, { ab2: "3", mn: "2", U: "100", I: "35", dv: "2395" },
            { ab2: "4,5", mn: "3", U: "150", I: "45", dv: "1958" }, { ab2: "6", mn: "4", U: "150", I: "45", dv: "1253" },
            { ab2: "7,5", mn: "5", U: "200", I: "60", dv: "1222" }, { ab2: "15", mn: "10", U: "250", I: "70", dv: "601,6" },
            { ab2: "22,5", mn: "16", U: "300", I: "80", dv: "424,4" }, { ab2: "30", mn: "20", U: "300", I: "85", dv: "378,8" },
            { ab2: "45", mn: "30", U: "400", I: "100", dv: "371,4" }, { ab2: "60", mn: "40", U: "400", I: "100", dv: "338,2" },
          ],
          camadas: [{ rho: "900", esp: "3", desc: "Solo residual seco" }, { rho: "350", esp: "12", desc: "Saprolito / rocha alterada" },
            { rho: "2500", esp: "", desc: "Rocha sã (granito)" }] };
      } },
    ],
  };
})();
