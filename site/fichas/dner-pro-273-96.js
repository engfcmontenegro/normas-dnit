/*
 * Ficha: DNER-PRO 273/96 — Determinação de deflexões com o deflectômetro de impacto (FWD).
 * Registra-se no motor de site/fichas.js (window.FE); usa FE.defl (dner-pro-010-79.js) na estatística opcional.
 * Uma coluna por golpe (altura de queda) em cada estação, como no formato de saída da seção 5: estaca, temperaturas,
 * altura, pressão (kPa), carga (kN) e deflexões DF1…DFn em 0,001 mm (4.4.2). Confere a carga aplicada com a
 * especificada (4.1.1 b, normalmente 40 kN), a pressão com a carga e a área da placa, a distância ao bordo pela
 * Tabela (4.3) e a bacia. A PRO 273 não define normalização nem estatística: são opcionais e indicadas como tal.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var DF = FE.defl;

  // Tabela (4.3) — largura da faixa × distância ao bordo
  function bordo(larg) {
    if (!ok(larg)) return NaN;
    if (larg >= 3.5) return 0.90;
    if (larg >= 3.3) return 0.75;
    if (larg >= 3.0) return 0.60;
    return 0.45;
  }
  function sensores(P) {
    return String(P.dist || "0 200 300 450 650 900 1200").split(/[\s;]+/).map(num).filter(ok);
  }
  var CORES = [["#4f8cff", "#1f5fbf"], ["#e5534b", "#c0392b"], ["#34c38f", "#2e8b57"], ["#b37feb", "#7d3c98"], ["#f0a030", "#b9770e"], ["#7fb3d5", "#5d6d7e"]];
  function sub(n) { return String(n).replace(/\d/g, function (c) { return "₀₁₂₃₄₅₆₇₈₉"[c]; }); }

  FE.FICHAS["dner-pro-273-96"] = {
    titulo: "Deflexões com o deflectômetro de impacto (FWD)",
    rotuloImportar: function (r) { return (r.nEst || 0) + " estação(ões) · D1 " + (ok(r.dMin) ? fmt(r.dMin, 1) + "–" + fmt(r.dMax, 1) + " (0,01 mm)" : "—"); },
    resumo: "Golpes por estação com carga (kN), pressão (kPa) e deflexões DF1…DFn em 0,001 mm (4.4.2, seção 5); verificação da carga especificada (4.1.1 b), da pressão × área da placa e da distância ao bordo (Tabela, 4.3); bacia de deflexões; normalização e estatística opcionais.",
    blocos: [],
    params: [
      { k: "equip", r: "Equipamento FWD — identificação / nº de série" },
      { k: "placa", r: "Diâmetro da placa de carga (mm)", ph: "300" },
      { k: "dist", r: "Distâncias dos sensores à placa (mm), separadas por espaço", ph: "0 200 300 450 650 900 1200", recarrega: true,
        dica: "4.1.1 a: posicionados de modo a definir a bacia para o tipo de pavimento" },
      { k: "carga", r: "Carga especificada no projeto (kN)", ph: "40", dica: "4.1.1 b: normalmente 40 kN" },
      { k: "tol", r: "Tolerância para a carga aplicada (%) — critério do contrato", ph: "5",
        dica: "a norma manda ajustar a altura de queda até obter a carga especificada; a tolerância não é fixada na PRO 273" },
      { k: "golpe", r: "Golpe representativo de cada estação", tipo: "select",
        opcoes: [["prox", "O de carga mais próxima da especificada"], ["ult", "O último golpe da estação"]] },
      { k: "norm", r: "Normalizar à carga especificada (opcional — fora da PRO 273)", tipo: "select",
        opcoes: [["nao", "Não — deflexões medidas"], ["sim", "Sim — D × Pespecificada / Paplicada (proporção linear)"]] },
      { k: "largura", r: "Largura da faixa de tráfego (m) — opcional" },
      { k: "borda", r: "Distância das estações ao bordo do revestimento (m) — opcional" },
      { k: "estat", r: "Estatística do segmento (opcional)", tipo: "select", recarrega: true,
        opcoes: [["nao", "Não calcular (a PRO 273 não define)"], ["pro011", "D1 das estações — critério da DNER-PRO 011/79, 4.2.7"]] },
    ],
    padrao: { placa: "300", dist: "0 200 300 450 650 900 1200", carga: "40", tol: "5", golpe: "prox", norm: "nao", estat: "nao" },
    tabelas: function (d) {
      var x = sensores(d.params || {});
      var l = [
        { k: "estaca", r: "Estaca (vazio = mesma estação do golpe anterior)", texto: true, ph: "165" },
        { k: "lado", r: "Faixa / trilha", texto: true, ph: "LE" },
        { k: "hora", r: "Hora", texto: true },
        { k: "tar", r: "Temperatura do ar", u: "°C" },
        { k: "tpav", r: "Temperatura do pavimento", u: "°C" },
        { k: "alt", r: "Altura de queda (nº)", texto: true },
        { k: "kpa", r: "Pressão", u: "kPa" },
        { k: "kn", r: "Carga", u: "kN" },
        { grupo: "Deflexões (0,001 mm) — 4.4.2" },
      ];
      x.forEach(function (xx, i) { l.push({ k: "df" + (i + 1), r: "DF" + (i + 1) + " — a " + fmt(xx, 0) + " mm", u: "0,001 mm" }); });
      l.push({ calc: "pcalc", r: "Pressão = carga / área da placa", u: "kPa", casas: 0 });
      l.push({ calc: "D1", r: "D1 em 0,01 mm" + " (normalizada, se escolhido)", u: "0,01 mm", casas: 1, destaque: true });
      return [{ chave: "g", titulo: "Golpes", rotulo: "Golpe", iniciais: 6, min: 1, dica: "uma coluna por golpe, na ordem do arquivo de saída do FWD (seção 5)", linhas: l }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], x = sensores(P), ns = x.length;
      var diam = num(P.placa) || 300, area = Math.PI * Math.pow(diam / 2000, 2), Pesp = num(P.carga), tol = ok(num(P.tol)) ? num(P.tol) : 5;
      if (x.length < 2) avisos.push("Informe as distâncias dos sensores à placa (4.1.1 a).");
      if (x.length && x[0] !== 0) avisos.push("O primeiro sensor não está sob a placa (distância 0): D1 não é a deflexão máxima.");
      var larg = num(P.largura), bor = num(P.borda), bT = bordo(larg);
      if (ok(larg) && ok(bor) && Math.abs(bor - bT) > 0.005) avisos.push("Estações a " + fmt(bor, 2) + " m do bordo; para faixa de " + fmt(larg, 2) + " m a Tabela (4.3) indica " + fmt(bT, 2) + " m.");
      var est = null, estacoes = [], cargaFora = [];
      var gs = (d.g || []).map(function (p, i) {
        var o = {}, kn = num(p.kn), kpa = num(p.kpa);
        if ((p.estaca || "").trim() || !est) {
          est = { estaca: (p.estaca || "").trim() || String(estacoes.length + 1), lado: (p.lado || "").trim(), golpes: [] };
          estacoes.push(est);
        }
        o.pcalc = ok(kn) ? kn / area : NaN;
        if (ok(kn) && ok(kpa) && Math.abs(o.pcalc - kpa) / kpa > 0.02) avisos.push("Golpe " + (i + 1) + ": pressão de " + fmt(kpa, 0) + " kPa incompatível com " + fmt(kn, 2) + " kN na placa de " + fmt(diam, 0) + " mm (" + fmt(o.pcalc, 0) + " kPa).");
        var fator = P.norm === "sim" && ok(Pesp) && ok(kn) && kn > 0 ? Pesp / kn : 1;
        o.df = x.map(function (xx, k) { var v = num(p["df" + (k + 1)]); return ok(v) ? v * fator / 10 : NaN; });  // 0,01 mm
        o.D1 = o.df[0];
        var sobe = [];
        for (var k = 1; k < o.df.length; k++) if (ok(o.df[k]) && ok(o.df[k - 1]) && o.df[k] > o.df[k - 1] + 1e-9) sobe.push("DF" + (k + 1));
        if (sobe.length) avisos.push("Golpe " + (i + 1) + " (est. " + est.estaca + "): bacia não decrescente em " + sobe.join(", ") + " — confira os sensores.");
        o.kn = kn; o.i = i;
        est.golpes.push(o);
        return o;
      });
      // golpe representativo e verificação da carga
      estacoes.forEach(function (e) {
        var gv = e.golpes.filter(function (g) { return ok(g.D1); });
        if (!gv.length) return;
        var rep = P.golpe === "ult" || !ok(Pesp) ? gv[gv.length - 1] : gv.slice().sort(function (a, b) { return Math.abs(a.kn - Pesp) - Math.abs(b.kn - Pesp); })[0];
        e.rep = rep; e.def = rep.D1; e.bacia = x.map(function (xx, k) { return [xx, rep.df[k]]; }).filter(function (b) { return ok(b[1]); });
        e.kn = rep.kn;
        if (ok(Pesp) && ok(rep.kn) && Math.abs(rep.kn - Pesp) / Pesp * 100 > tol) cargaFora.push("est. " + e.estaca + " (" + fmt(rep.kn, 2) + " kN)");
      });
      if (cargaFora.length) avisos.push("Carga do golpe representativo diferente da especificada (" + fmt(Pesp, 1) + " kN ± " + fmt(tol, 0) + " %) em " + cargaFora.join("; ") +
        ": ajustar a altura de queda (4.1.1 b)" + (P.norm === "sim" ? "; deflexões normalizadas proporcionalmente (fora da PRO 273)." : "."));
      var pontos = estacoes.filter(function (e) { return ok(e.def); }).map(function (e, i) {
        return { estaca: e.estaca, lado: e.lado, def: e.def, bacia: e.bacia, kn: e.kn, nome: "Estação " + (i + 1) + " (est. " + e.estaca + ")" };
      });
      var defs = pontos.map(function (o) { return o.def; });
      var r = { nEst: pontos.length, nGolpes: gs.length, dMin: defs.length ? Math.min.apply(null, defs) : NaN, dMax: defs.length ? Math.max.apply(null, defs) : NaN,
        dMed: media(defs), area: area, x: x, est: null };
      if (P.estat === "pro011") {
        r.est = DF.estatistica(pontos.map(function (o, i) { return { v: o.def, i: i, nome: o.nome }; }));
        if (!r.est) avisos.push("Estatística: são necessárias pelo menos 3 estações.");
        else {
          r.est.elim.forEach(function (e) { pontos[e.i].elim = true; });
          if (r.est.elim.length) avisos.push("Estatística (PRO 011/79, 4.2.7): eliminado(s) fora de D ± zσ — " + r.est.elim.map(function (e) { return e.nome + " = " + fmt(e.v, 1); }).join("; ") + ".");
        }
      }
      return { tab: { g: gs }, pontos: pontos, estacoes: estacoes, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, e = r.est, I = DF.item;
      var h = '<div class="fe-res">' +
        I(r.nEst ? fmt(r.dMin, 1) + " – " + fmt(r.dMax, 1) + " <small>0,01 mm</small>" : "—", "D1 do golpe representativo — menor e maior de " + r.nEst + " estação(ões) (" + r.nGolpes + " golpes)") +
        I(ok(r.dMed) ? fmt(r.dMed, 1) + " <small>0,01 mm</small>" : "—", "Média de D1", true);
      if (e) h += I(fmt(e.media, 1) + " ± " + fmt(e.sd, 1), "Estatística (PRO 011/79) — n = " + e.n + " de " + e.n0, true) + I(fmt(e.dc, 1) + " <small>0,01 mm</small>", "Dc = D̄ + σ (opcional)");
      return h + "</div>";
    },
    graficos: function (calc, d, opt) {
      opt = opt || {};
      var pts = calc.pontos.filter(function (o) { return o.bacia.length >= 2; });
      if (!pts.length) return ['<div class="fe-graf-vazio">A bacia aparece com as deflexões dos sensores.</div>'];
      var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)";
      var W = opt.w || 600, H = opt.h || 280, m = { l: 50, r: 100, t: 14, b: 40 };
      var xmax = Math.max.apply(null, calc.resultados.x), ymax = Math.max.apply(null, pts.map(function (o) { return o.bacia[0][1]; })) * 1.08;
      var st = Math.pow(10, Math.floor(Math.log10(ymax / 5))), yM = Math.ceil(ymax / st) * st;
      if (yM / st > 10) { st *= 2; yM = Math.ceil(ymax / st) * st; }
      function X(v) { return m.l + v / xmax * (W - m.l - m.r); }
      function Y(v) { return m.t + v / yM * (H - m.t - m.b); }
      var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10.5">';
      for (var v = 0; v <= yM + 1e-9; v += st) {
        s += '<line x1="' + m.l + '" y1="' + Y(v) + '" x2="' + X(xmax) + '" y2="' + Y(v) + '" stroke="' + grade + '" stroke-width="0.6"/><text x="' + (m.l - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end" fill="' + txt + '">' + fmt(v, 0) + "</text>";
      }
      calc.resultados.x.forEach(function (xx) {
        s += '<line x1="' + X(xx) + '" y1="' + m.t + '" x2="' + X(xx) + '" y2="' + (H - m.b) + '" stroke="' + grade + '" stroke-width="0.6"/><text x="' + X(xx) + '" y="' + (H - m.b + 14) + '" text-anchor="middle" fill="' + txt + '">' + fmt(xx, 0) + "</text>";
      });
      s += '<text x="' + ((m.l + X(xmax)) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + txt + '">Distância do sensor ao centro da placa (mm)</text>';
      s += '<text transform="translate(13 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + txt + '">Deflexão (0,01 mm)</text>';
      pts.forEach(function (o, j) {
        var cor = CORES[j % CORES.length][imp ? 1 : 0];
        s += '<path d="' + o.bacia.map(function (b, k) { return (k ? "L" : "M") + X(b[0]).toFixed(1) + " " + Y(b[1]).toFixed(1); }).join(" ") + '" fill="none" stroke="' + cor + '" stroke-width="1.6"/>';
        o.bacia.forEach(function (b) { s += '<circle cx="' + X(b[0]).toFixed(1) + '" cy="' + Y(b[1]).toFixed(1) + '" r="2.5" fill="' + cor + '"/>'; });
        if (j < 14) s += '<rect x="' + (X(xmax) + 12) + '" y="' + (m.t + 4 + j * 15) + '" width="12" height="4" fill="' + cor + '"/><text x="' + (X(xmax) + 28) + '" y="' + (m.t + 9 + j * 15) + '" fill="' + txt + '">' + esc(o.estaca) + "</text>";
      });
      return [s + "</svg>"];
    },
    relatorio: {
      notas: "Deflexões DF em 0,001 mm (4.4.2), apresentadas também em 0,01 mm (÷ 10) para comparação com a viga Benkelman. Golpe representativo: o de carga mais próxima da especificada (ou o último da estação). Pressão conferida por carga / (π d²/4). " +
        "A PRO 273 não fixa tolerância de carga, normalização nem tratamento estatístico; quando usados, são critérios do contrato ou da DNER-PRO 011/79 (4.2.7). O uso das deflexões FWD em procedimentos de avaliação da viga Benkelman exige correlação.",
      parametros: [["Sequência", "4.4.1: soltar as travas, ligar o sistema, abrir o arquivo, medir, fechar o arquivo, desligar, travar"]],
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        rows.push(["Estações / golpes", r.nEst + " / " + r.nGolpes]);
        rows.push(["D1 (0,01 mm)", r.nEst ? "mín. " + fmt(r.dMin, 1) + "; média " + fmt(r.dMed, 1) + "; máx. " + fmt(r.dMax, 1) + (P.norm === "sim" ? " — normalizadas a " + P.carga + " kN" : "") : "—"]);
        calc.pontos.forEach(function (o) { rows.push(["Est. " + o.estaca + (o.lado ? " " + o.lado : ""), "carga " + fmt(o.kn, 2) + " kN; bacia " + o.bacia.map(function (b) { return fmt(b[1], 1); }).join(" · ") + " (0,01 mm)"]); });
        if (r.est) rows.push(["Estatística (PRO 011/79)", "D̄ = " + fmt(r.est.media, 1) + "; σ = " + fmt(r.est.sd, 1) + "; Dc = " + fmt(r.est.dc, 1) + " (n = " + r.est.n + " de " + r.est.n0 + ")"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Exemplo da seção 5 da norma — três cargas por estação, faixa esquerda", dados: function () {
        var L = [
          ["165", "35", "57", "11:32", "1", "358", "25,31", "377 227 158 85 48 32 27"], ["", "", "", "", "2", "539", "38,10", "504 318 230 135 81 55 45"], ["", "", "", "", "4", "888", "62,77", "734 486 367 235 151 105 83"],
          ["164+10", "36", "58", "11:33", "1", "359", "25,34", "332 198 138 80 50 34 27"], ["", "", "", "", "2", "541", "38,22", "445 280 204 125 81 55 43"], ["", "", "", "", "4", "890", "62,89", "648 431 330 218 146 102 78"],
          ["164", "37", "57", "11:34", "1", "355", "25,08", "342 220 158 90 54 35 27"], ["", "", "", "", "2", "539", "38,10", "470 316 235 144 90 58 44"], ["", "", "", "", "4", "887", "62,68", "700 492 379 250 164 108 81"],
          ["163+10", "36", "57", "11:35", "1", "355", "25,11", "330 210 154 93 57 35 28"], ["", "", "", "", "2", "541", "38,26", "458 305 233 151 96 61 46"], ["", "", "", "", "4", "889", "62,84", "682 478 380 266 179 117 87"],
          ["163", "37", "56", "11:36", "1", "356", "25,18", "337 207 143 82 51 35 28"], ["", "", "", "", "2", "540", "38,14", "460 297 214 133 85 59 44"], ["", "", "", "", "4", "889", "62,84", "680 461 352 234 162 114 85"],
          ["162+10", "37", "54", "11:37", "1", "359", "25,34", "313 186 129 70 41 27 23"], ["", "", "", "", "2", "540", "38,15", "418 260 187 110 67 45 37"], ["", "", "", "", "4", "893", "63,12", "608 393 298 187 122 85 69"],
        ];
        return { ident: { registro: "EX-FWD-001", obra: "Exemplo da norma", trecho: "Faixa esquerda, est. 165 a 162+10" },
          params: { placa: "300", dist: "0 200 300 450 650 900 1200", carga: "40", tol: "5", golpe: "prox", norm: "nao", estat: "nao" },
          obs: "Dados da tabela da seção 5 da DNER-PRO 273/96 (sequência de três cargas).",
          g: L.map(function (x) {
            var v = x[7].split(" "), o = { estaca: x[0], lado: x[0] ? "LE" : "", tar: x[1], tpav: x[2], hora: x[3], alt: x[4], kpa: x[5], kn: x[6] };
            v.forEach(function (dv, k) { o["df" + (k + 1)] = dv; });
            return o;
          }) };
      } },
      { nome: "Segmento de 8 estações, um golpe de 40 kN — carga fora e estatística (dados gerados)", dados: function () {
        var L = [["200", "40,6", "412 301 238 160 101 66 48"], ["202", "39,8", "455 332 262 176 112 73 53"], ["204", "40,2", "398 290 229 153 97 63 46"],
          ["206", "36,1", "371 270 213 143 90 59 43"], ["208", "40,4", "436 318 251 168 107 70 50"], ["210", "39,9", "610 455 362 243 150 95 66"],
          ["212", "40,1", "425 309 244 164 104 68 49"], ["214", "40,3", "447 326 257 172 109 71 51"]];
        return { ident: { registro: "EX-FWD-002", data: "2026-07-09", obra: "BR-000", trecho: "Segmento homogêneo 1 — est. 200 a 214", camada: "CBUQ 5 cm" },
          params: { equip: "FWD — unidade 1", placa: "300", dist: "0 200 300 450 650 900 1200", carga: "40", tol: "5", golpe: "prox", norm: "sim", largura: "3,50", borda: "0,75", estat: "pro011" },
          g: L.map(function (x, i) {
            var v = x[2].split(" "), kn = num(x[1]), o = { estaca: x[0], lado: i % 2 ? "LE" : "LD", tar: "27", tpav: "36", alt: "3", kn: x[1], kpa: fmt(kn / (Math.PI * 0.0225), 0) };
            v.forEach(function (dv, k) { o["df" + (k + 1)] = dv; });
            return o;
          }) };
      } },
    ],
  };
})();
