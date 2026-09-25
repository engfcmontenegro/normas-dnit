/*
 * Aba "Fichas de Ensaios": formulários de cálculo dos métodos de ensaio (ME) e relatório.
 *
 * Motor genérico (identificação, pontos em colunas, salvar/abrir no navegador, exportar/importar,
 * relatório para imprimir/PDF) + uma definição por ficha em FICHAS[<id da norma>]:
 *   { titulo, resumo, params: [...campos], linhas: [...linhas da tabela de pontos],
 *     pontosMin, pontosIniciais, exemplo(), calcular(dados) -> {pontos, resultados, avisos},
 *     grafico(calc, dados) -> svg, resultadosHtml(calc) }
 * Os cálculos seguem o texto da norma (seções citadas em cada campo).
 */
(function () {
  "use strict";

  var FICHAS = {};
  var STORE = "fichas_ensaio_v1";

  // ---------- utilidades ----------
  function num(v) {
    if (v === null || v === undefined) return NaN;
    var s = String(v).trim().replace(/\s/g, "");
    if (!s) return NaN;
    if (s.indexOf(",") !== -1) s = s.replace(/\./g, "").replace(",", ".");  // 1.234,5 -> 1234.5
    return Number(s);
  }
  function ok(x) { return typeof x === "number" && isFinite(x); }
  function fmt(x, casas) {
    if (!ok(x)) return "—";
    return x.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
  }
  function esc(s) {
    return String(s === undefined || s === null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function media(arr) {
    var v = arr.filter(ok);
    return v.length ? v.reduce(function (a, b) { return a + b; }, 0) / v.length : NaN;
  }
  function uid() { return "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  // parábola y = a x² + b x + c por mínimos quadrados (mesmo método das planilhas de laboratório)
  function parabola(xs, ys) {
    var n = xs.length;
    if (n < 3) return null;
    var sx = 0, sx2 = 0, sx3 = 0, sx4 = 0, sy = 0, sxy = 0, sx2y = 0;
    for (var i = 0; i < n; i++) {
      var x = xs[i], y = ys[i], x2 = x * x;
      sx += x; sx2 += x2; sx3 += x2 * x; sx4 += x2 * x2; sy += y; sxy += x * y; sx2y += x2 * y;
    }
    // sistema normal 3x3 resolvido por Cramer
    var M = [[sx4, sx3, sx2], [sx3, sx2, sx], [sx2, sx, n]], V = [sx2y, sxy, sy];
    function det(m) {
      return m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
        m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
    }
    var D = det(M);
    if (!D) return null;
    function troca(col) { return M.map(function (r, i) { return r.map(function (v, j) { return j === col ? V[i] : v; }); }); }
    return { a: det(troca(0)) / D, b: det(troca(1)) / D, c: det(troca(2)) / D };
  }

  // ---------- armazenamento (navegador) ----------
  function lerTodos() {
    try { return JSON.parse(localStorage.getItem(STORE) || "[]"); } catch (e) { return []; }
  }
  function gravarTodos(lista) {
    try { localStorage.setItem(STORE, JSON.stringify(lista)); return true; } catch (e) { return false; }
  }

  // ---------- identificação comum a todas as fichas ----------
  var IDENT = [
    { k: "registro", r: "Registro / nº da amostra" },
    { k: "data", r: "Data do ensaio", tipo: "date" },
    { k: "obra", r: "Obra / rodovia" },
    { k: "trecho", r: "Trecho / segmento" },
    { k: "local", r: "Estaca / local de coleta" },
    { k: "origem", r: "Jazida / origem do material" },
    { k: "camada", r: "Camada / material" },
    { k: "laboratorista", r: "Laboratorista" },
    { k: "responsavel", r: "Responsável técnico" },
  ];

  // =====================================================================================
  // DNIT 164/2013-ME — Solos — Compactação utilizando amostras não trabalhadas
  // =====================================================================================
  var ENERGIAS = { A: { nome: "Normal (Método A)", golpes: 12 }, B: { nome: "Intermediária (Método B)", golpes: 26 },
    C: { nome: "Modificada (Método C)", golpes: 55 } };
  // volume útil do molde: Ø 15,24 cm, altura 17,78 cm menos o disco espaçador de 6,35 cm (seção 3 a/b)
  var VOL_PADRAO = Math.round(Math.PI * Math.pow(15.24 / 2, 2) * (17.78 - 6.35));

  FICHAS["dnit-164-2013-me"] = {
    titulo: "Solos — Compactação utilizando amostras não trabalhadas",
    resumo: "Curva de compactação (massa específica aparente seca × umidade), massa específica aparente seca máxima e umidade ótima.",
    params: [
      { k: "energia", r: "Energia de compactação (seção 6)", tipo: "select",
        opcoes: [["A", "Normal — 12 golpes/camada"], ["B", "Intermediária — 26 golpes/camada"], ["C", "Modificada — 55 golpes/camada"]] },
      { k: "volumePadrao", r: "Volume do molde padrão (cm³)", dica: "Ø 15,24 cm × (17,78 − 6,35) cm ≈ " + VOL_PADRAO +
        " cm³; use a capacidade aferida do seu molde", ph: String(VOL_PADRAO) },
      { k: "ret19", r: "Material retido na peneira de 19 mm (%)", dica: "substituído por igual massa passando na 19 mm e retido na 4,8 mm (4.2)" },
      { k: "gs", r: "Massa específica dos grãos (g/cm³) — opcional", dica: "só para traçar a curva de saturação (S = 100 %) no gráfico" },
    ],
    pontosMin: 5,
    pontosIniciais: 5,
    // linhas da tabela de pontos (uma coluna por ponto); "calc" = linha calculada
    linhas: [
      { grupo: "Umidade do corpo de prova (5.1 e 7.1)" },
      { k: "c1n", r: "Cápsula 1 — nº", texto: true },
      { k: "c1t", r: "Cápsula 1 — massa da cápsula", u: "g" },
      { k: "c1u", r: "Cápsula 1 — cápsula + solo úmido", u: "g" },
      { k: "c1s", r: "Cápsula 1 — cápsula + solo seco", u: "g" },
      { calc: "h1", r: "Umidade cápsula 1 (h)", u: "%", casas: 2 },
      { k: "c2n", r: "Cápsula 2 — nº (siltosos/argilosos)", texto: true },
      { k: "c2t", r: "Cápsula 2 — massa da cápsula", u: "g" },
      { k: "c2u", r: "Cápsula 2 — cápsula + solo úmido", u: "g" },
      { k: "c2s", r: "Cápsula 2 — cápsula + solo seco", u: "g" },
      { calc: "h2", r: "Umidade cápsula 2 (h)", u: "%", casas: 2 },
      { calc: "h", r: "Teor de umidade médio (h)", u: "%", casas: 2, destaque: true },
      { grupo: "Corpo de prova compactado (5.3 e 7.2)" },
      { k: "moldeN", r: "Molde nº", texto: true },
      { k: "moldeM", r: "Massa do molde", u: "g" },
      { k: "moldeV", r: "Volume do molde (V)", u: "cm³", padrao: "volumePadrao" },
      { k: "moldeSolo", r: "Molde + solo úmido compactado", u: "g" },
      { calc: "Ph", r: "Massa do solo úmido (P'h)", u: "g", casas: 0 },
      { calc: "gh", r: "Massa específica aparente úmida (γh = P'h / V)", u: "g/cm³", casas: 3 },
      { calc: "gs", r: "Massa específica aparente seca (γs = γh × 100 / (100 + h))", u: "g/cm³", casas: 3, destaque: true },
    ],

    calcular: function (d) {
      var P = d.params || {};
      var volPad = num(P.volumePadrao);
      if (!ok(volPad)) volPad = VOL_PADRAO;
      var avisos = [];
      var pontos = (d.pontos || []).map(function (p, i) {
        function umid(t, u, s) {
          t = num(t); u = num(u); s = num(s);
          if (!ok(t) || !ok(u) || !ok(s)) return NaN;
          if (s - t <= 0 || u < s) return NaN;
          return (u - s) / (s - t) * 100;       // h = (Ph − Ps) / Ps × 100  (7.1)
        }
        var h1 = umid(p.c1t, p.c1u, p.c1s), h2 = umid(p.c2t, p.c2u, p.c2s);
        var h = media([h1, h2]);
        var V = ok(num(p.moldeV)) ? num(p.moldeV) : volPad;
        var Ph = num(p.moldeSolo) - num(p.moldeM);
        var gh = ok(Ph) && Ph > 0 ? Ph / V : NaN;  // γh = P'h / V  (7.2 a)
        var gs = ok(gh) && ok(h) ? gh * 100 / (100 + h) : NaN;  // γs = γh × 100/(100+h)  (7.2 b)
        if (ok(h1) && ok(h2) && Math.abs(h1 - h2) > 1) {
          avisos.push("Ponto " + (i + 1) + ": as duas cápsulas diferem " + fmt(Math.abs(h1 - h2), 2) +
            " ponto(s) percentual(is) de umidade — confira as pesagens.");
        }
        return { h1: h1, h2: h2, h: h, Ph: Ph, gh: gh, gs: gs, usar: p.usar !== false };
      });
      var validos = pontos.filter(function (p) { return ok(p.h) && ok(p.gs); });
      var usados = validos.filter(function (p) { return p.usar; });
      if (validos.length < 5) {
        avisos.push("A norma pede no mínimo cinco pontos (5.4); há " + validos.length + " ponto(s) completo(s).");
      }
      var res = { gsMax: NaN, hOt: NaN, ajuste: null };
      if (usados.length >= 3) {
        var fit = parabola(usados.map(function (p) { return p.h; }), usados.map(function (p) { return p.gs; }));
        if (fit && fit.a < 0) {
          res.ajuste = fit;
          res.hOt = -fit.b / (2 * fit.a);
          res.gsMax = fit.a * res.hOt * res.hOt + fit.b * res.hOt + fit.c;
          var hs = usados.map(function (p) { return p.h; });
          var minH = Math.min.apply(null, hs), maxH = Math.max.apply(null, hs);
          if (res.hOt < minH || res.hOt > maxH) {
            avisos.push("O máximo da curva ficou fora do intervalo de umidades ensaiadas: faça mais pontos no ramo " +
              (res.hOt < minH ? "seco" : "úmido") + ".");
          }
          var secos = hs.filter(function (h) { return h < res.hOt; }).length, umidos = hs.length - secos;
          if (secos < 2 || umidos < 2) {
            avisos.push("Recomenda-se ao menos dois pontos em cada ramo da curva (há " + secos + " no ramo seco e " +
              umidos + " no úmido).");
          }
        } else {
          avisos.push("Os pontos marcados não formam uma curva com máximo (concavidade para baixo): revise os pontos ou desmarque os discrepantes.");
        }
      } else if (validos.length) {
        avisos.push("Marque ao menos três pontos para traçar a curva de compactação.");
      }
      return { pontos: pontos, resultados: res, avisos: avisos };
    },

    resultadosHtml: function (calc, d) {
      var r = calc.resultados, en = ENERGIAS[(d.params || {}).energia || "B"];
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + fmt(r.gsMax, 3) +
        ' <small>g/cm³</small></div><div class="fe-res-r">Massa específica aparente seca máxima (8.2)</div></div>' +
        '<div class="fe-res-item"><div class="fe-res-v">' + fmt(r.hOt, 1) + ' <small>%</small></div>' +
        '<div class="fe-res-r">Umidade ótima (8.3)</div></div>' +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + esc(en ? en.nome : "—") + '</div>' +
        '<div class="fe-res-r">Energia · ' + (en ? en.golpes : "—") + " golpes/camada, 5 camadas</div></div></div>";
    },

    grafico: function (calc, d, opt) {
      opt = opt || {};
      var W = opt.w || 560, H = opt.h || 320, m = { l: 58, r: 16, t: 14, b: 42 };
      var pts = calc.pontos.filter(function (p) { return ok(p.h) && ok(p.gs); });
      if (!pts.length) return '<div class="fe-graf-vazio">O gráfico aparece quando houver pontos completos.</div>';
      var r = calc.resultados;
      var xs = pts.map(function (p) { return p.h; }), ys = pts.map(function (p) { return p.gs; });
      var x0 = Math.floor(Math.min.apply(null, xs) - 1), x1 = Math.ceil(Math.max.apply(null, xs) + 1);
      var yMin = Math.min.apply(null, ys), yMax = Math.max.apply(null, ys.concat(ok(r.gsMax) ? [r.gsMax] : []));
      var pad = Math.max((yMax - yMin) * 0.25, 0.02);
      var y0 = Math.floor((yMin - pad) * 100) / 100, y1 = Math.ceil((yMax + pad) * 100) / 100;
      function X(v) { return m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r); }
      function Y(v) { return H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b); }
      var cor = opt.imprimir ? { eixo: "#333", grade: "#ddd", txt: "#222", curva: "#1f5fbf", sat: "#888", pt: "#1f5fbf" }
        : { eixo: "var(--text-dim)", grade: "var(--border)", txt: "var(--text-dim)", curva: "#4f8cff", sat: "#9aa3b2", pt: "#4f8cff" };
      var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
      // grade e eixos
      var passoX = (x1 - x0) > 12 ? 2 : 1;
      for (var gx = x0; gx <= x1; gx += passoX) {
        s += '<line x1="' + X(gx) + '" y1="' + m.t + '" x2="' + X(gx) + '" y2="' + (H - m.b) + '" stroke="' + cor.grade + '" stroke-width="0.6"/>';
        s += '<text x="' + X(gx) + '" y="' + (H - m.b + 15) + '" text-anchor="middle" fill="' + cor.txt + '">' + gx + "</text>";
      }
      var passoY = (y1 - y0) > 0.3 ? 0.05 : (y1 - y0) > 0.12 ? 0.02 : 0.01;
      for (var gy = Math.ceil(y0 / passoY) * passoY; gy <= y1 + 1e-9; gy += passoY) {
        s += '<line x1="' + m.l + '" y1="' + Y(gy) + '" x2="' + (W - m.r) + '" y2="' + Y(gy) + '" stroke="' + cor.grade + '" stroke-width="0.6"/>';
        s += '<text x="' + (m.l - 6) + '" y="' + (Y(gy) + 4) + '" text-anchor="end" fill="' + cor.txt + '">' + fmt(gy, 3) + "</text>";
      }
      s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + cor.eixo + '"/>';
      s += '<text x="' + ((W + m.l) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + cor.txt + '">Teor de umidade h (%)</text>';
      s += '<text transform="translate(14 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + cor.txt + '">γs (g/cm³)</text>';
      // curva de saturação (opcional): γs = Gs / (1 + h·Gs/100), γw = 1 g/cm³
      var Gs = num((d.params || {}).gs);
      if (ok(Gs) && Gs > 1.5 && Gs < 4) {
        var ds = "";
        for (var hx = x0; hx <= x1 + 1e-9; hx += (x1 - x0) / 60) {
          var ysat = Gs / (1 + hx * Gs / 100);
          if (ysat >= y0 && ysat <= y1) ds += (ds ? " L" : "M") + X(hx).toFixed(1) + " " + Y(ysat).toFixed(1);
        }
        if (ds) s += '<path d="' + ds + '" fill="none" stroke="' + cor.sat + '" stroke-dasharray="5 4"/>' +
          '<text x="' + (W - m.r - 4) + '" y="' + (m.t + 12) + '" text-anchor="end" fill="' + cor.sat + '">S = 100 %</text>';
      }
      // curva ajustada
      if (r.ajuste) {
        var a = r.ajuste, us = calc.pontos.filter(function (p) { return p.usar && ok(p.h) && ok(p.gs); });
        var ha = Math.min.apply(null, us.map(function (p) { return p.h; })) - 0.5;
        var hb = Math.max.apply(null, us.map(function (p) { return p.h; })) + 0.5;
        var dc = "";
        for (var hc = ha; hc <= hb + 1e-9; hc += (hb - ha) / 60) {
          var yc = a.a * hc * hc + a.b * hc + a.c;
          dc += (dc ? " L" : "M") + X(hc).toFixed(1) + " " + Y(Math.max(yc, y0)).toFixed(1);
        }
        s += '<path d="' + dc + '" fill="none" stroke="' + cor.curva + '" stroke-width="2"/>';
        if (ok(r.gsMax)) {
          s += '<line x1="' + X(r.hOt) + '" y1="' + Y(r.gsMax) + '" x2="' + X(r.hOt) + '" y2="' + (H - m.b) + '" stroke="' + cor.curva + '" stroke-dasharray="3 3"/>';
          s += '<line x1="' + m.l + '" y1="' + Y(r.gsMax) + '" x2="' + X(r.hOt) + '" y2="' + Y(r.gsMax) + '" stroke="' + cor.curva + '" stroke-dasharray="3 3"/>';
          s += '<text x="' + (X(r.hOt) + 6) + '" y="' + (Y(r.gsMax) - 6) + '" fill="' + cor.curva + '" font-weight="bold">' +
            fmt(r.gsMax, 3) + " g/cm³ · " + fmt(r.hOt, 1) + " %</text>";
        }
      }
      calc.pontos.forEach(function (p, i) {
        if (!ok(p.h) || !ok(p.gs)) return;
        s += '<circle cx="' + X(p.h) + '" cy="' + Y(p.gs) + '" r="4.5" fill="' + (p.usar ? cor.pt : "none") + '" stroke="' + cor.pt + '" stroke-width="1.5"/>';
        s += '<text x="' + (X(p.h) + 7) + '" y="' + (Y(p.gs) + 13) + '" fill="' + cor.txt + '" font-size="10">' + (i + 1) + "</text>";
      });
      return s + "</svg>";
    },

    // exemplo para conhecer a ficha (valores da ordem dos de um Proctor intermediário de solo-cimento)
    exemplo: function () {
      var hs = [8.77, 10.80, 12.83, 14.86, 16.88];
      var moldes = [["10", 5007, 2320, 9000], ["45", 4129, 2298, 8750], ["2", 5202, 2305, 10150], ["16", 4990, 2310, 10000], ["31", 4720, 2305, 9500]];
      return {
        ident: { registro: "EX-001", obra: "Exemplo", camada: "Base — solo-cimento 3 %", origem: "Jazida 1" },
        params: { energia: "B", volumePadrao: "", ret19: "0", gs: "2,65" },
        pontos: hs.map(function (h, i) {
          var t = 15 + i, seco = t + 100, umido = seco + h;  // 100 g de solo seco por cápsula
          return { usar: true, c1n: String(20 + i), c1t: fmt(t, 2), c1u: fmt(umido, 2), c1s: fmt(seco, 2),
            moldeN: moldes[i][0], moldeM: String(moldes[i][1]), moldeV: String(moldes[i][2]), moldeSolo: String(moldes[i][3]) };
        }),
      };
    },
  };

  // relatório completo (HTML autônomo, A4) de um ensaio
  function montarRelatorio(F, n, d) {
      var calc = F.calcular(d);
      var i = d.ident || {};
      var identHtml = IDENT.map(function (f) {
        var v = i[f.k] || "";
        if (f.tipo === "date" && v) v = v.split("-").reverse().join("/");
        return "<tr><th>" + esc(f.r) + "</th><td>" + esc(v) + "</td></tr>";
      }).join("");
      var paramHtml = F.params.map(function (f) {
        var v = (d.params || {})[f.k] || "";
        if (f.tipo === "select") v = (f.opcoes.filter(function (o) { return o[0] === v; })[0] || ["", ""])[1];
        if (f.k === "volumePadrao" && !v) v = VOL_PADRAO + " (nominal)";
        return v ? "<tr><th>" + esc(f.r.replace(/ — opcional$/, "")) + "</th><td>" + esc(v) + "</td></tr>" : "";
      }).join("");
      var pts = d.pontos;
      var tab = '<table class="pts"><tr><th>Ponto</th><th></th>' + pts.map(function (p, k) {
        return "<th>" + (k + 1) + (p.usar === false ? "*" : "") + "</th>";
      }).join("") + "</tr>" + F.linhas.map(function (l) {
        if (l.grupo) return '<tr class="g"><td colspan="' + (pts.length + 2) + '">' + esc(l.grupo) + "</td></tr>";
        var vals = pts.map(function (p, k) {
          return l.calc ? fmt(calc.pontos[k][l.calc], l.casas) : (p[l.k] || (l.padrao && !p[l.k] ? ((d.params || {})[l.padrao] || VOL_PADRAO) : ""));
        });
        // linha sem nenhum dado (ex.: 2ª cápsula não usada) não vai para o relatório
        if (vals.every(function (v) { return v === "" || v === "—"; })) return "";
        return "<tr" + (l.destaque ? ' class="d"' : "") + "><th>" + esc(l.r) + "</th><td class=\"u\">" + esc(l.u || "") + "</td>" +
          vals.map(function (v) { return "<td>" + esc(v) + "</td>"; }).join("") + "</tr>";
      }).join("") + "</table>" + (pts.some(function (p) { return p.usar === false; }) ? '<p class="nota">* ponto não considerado no ajuste da curva.</p>' : "");
      var canc = n.status === "cancelada" ? '<div class="canc">ATENÇÃO: norma cancelada pelo DNIT — não está mais em vigor.</div>' : "";
      var hoje = new Date().toLocaleString("pt-BR");
      var doc = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório ' + esc(n.codigo) + " " + esc(i.registro || "") + "</title><style>" +
        "@page{size:A4;margin:14mm 12mm}body{font:11px/1.35 Arial,sans-serif;color:#111;margin:0}" +
        "h1{font-size:15px;margin:0}h2{font-size:12px;margin:14px 0 5px;border-bottom:1px solid #999;padding-bottom:2px;text-transform:uppercase;letter-spacing:.03em}" +
        ".cab{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #111;padding-bottom:6px}" +
        ".cab .n{font-size:12px;font-weight:bold;text-align:right}.sub{color:#444;margin-top:2px}" +
        "table{border-collapse:collapse;width:100%}th,td{border:1px solid #bbb;padding:3px 5px;text-align:left;vertical-align:top}" +
        ".duas{display:grid;grid-template-columns:1fr 1fr;gap:10px}.duas th{width:45%;background:#f2f2f2;font-weight:normal}" +
        ".pts th,.pts td{text-align:center;font-size:10.5px}.pts th:first-child{text-align:left;width:34%}.pts .u{color:#555}" +
        ".pts tr.g td{background:#e9e9e9;text-align:left;font-weight:bold}.pts tr.d td{font-weight:bold}" +
        ".res{display:flex;gap:10px}.res div{flex:1;border:1.5px solid #111;padding:6px 8px}.res b{display:block;font-size:17px}" +
        ".graf{text-align:center;margin-top:8px}.graf svg{width:100%;max-width:560px}" +
        ".av{border:1px solid #c77d12;background:#fff6e5;padding:5px 8px;margin-top:6px}.nota{color:#555;margin:4px 0}" +
        ".canc{border:2px solid #c0392b;color:#c0392b;font-weight:bold;padding:5px 8px;margin:8px 0}" +
        ".ass{display:flex;gap:30px;margin-top:34px}.ass div{flex:1;border-top:1px solid #111;text-align:center;padding-top:3px}" +
        ".rod{margin-top:14px;color:#666;font-size:9.5px;border-top:1px solid #ccc;padding-top:4px}" +
        ".btn{position:fixed;top:10px;right:10px;padding:6px 12px}@media print{.btn{display:none}}" +
        '</style></head><body><button class="btn" onclick="print()">Imprimir / salvar PDF</button>' +
        '<div class="cab"><div><h1>RELATÓRIO DE ENSAIO</h1><div class="sub">' + esc(F.titulo) + '</div></div><div class="n">' + esc(n.codigo) +
        "<br><span style=\"font-weight:normal\">Registro: " + esc(i.registro || "—") + "</span></div></div>" + canc +
        '<h2>Identificação</h2><div class="duas"><table>' + identHtml.split("</tr>").slice(0, 5).join("</tr>") + "</tr></table><table>" +
        identHtml.split("</tr>").slice(5).join("</tr>") + "</table></div>" +
        "<h2>Parâmetros</h2><table class=\"duas-t\"><tr><th style=\"width:45%;background:#f2f2f2;font-weight:normal\">Norma</th><td>" + esc(n.codigo) + " — " + esc(n.titulo) +
        "</td></tr>" + paramHtml.replace(/<th>/g, '<th style="background:#f2f2f2;font-weight:normal">') +
        '<tr><th style="background:#f2f2f2;font-weight:normal">Compactação</th><td>5 camadas, soquete de 4,536 kg, queda de 45,72 cm, molde Ø 15,24 cm com disco espaçador</td></tr></table>' +
        "<h2>Determinações</h2>" + tab +
        '<h2>Resultados</h2><div class="res"><div>Massa específica aparente seca máxima<b>' + fmt(calc.resultados.gsMax, 3) +
        " g/cm³</b></div><div>Umidade ótima<b>" + fmt(calc.resultados.hOt, 1) + " %</b></div></div>" +
        '<div class="graf">' + F.grafico(calc, d, { imprimir: true, w: 620, h: 330 }) + "</div>" +
        '<p class="nota">Curva de compactação: parábola ajustada por mínimos quadrados aos pontos considerados; γs,máx e h ótima no vértice (8.2 e 8.3).</p>' +
        (calc.avisos.length ? '<div class="av">' + calc.avisos.map(function (a) { return "⚠ " + esc(a); }).join("<br>") + "</div>" : "") +
        (d.obs ? "<h2>Observações</h2><p>" + esc(d.obs).replace(/\n/g, "<br>") + "</p>" : "") +
        '<div class="ass"><div>' + esc(i.laboratorista || "Laboratorista") + "</div><div>" + esc(i.responsavel || "Responsável técnico") + "</div></div>" +
        '<div class="rod">Calculado conforme ' + esc(n.codigo) + " · gerado em " + esc(hoje) + " pelo acervo Normas DNER/DNIT.</div></body></html>";
      return doc;
  }

  // =====================================================================================
  // Motor da aba
  // =====================================================================================
  window.initFichas = function (ctx) {
    var byId = ctx.byId, DEPS = ctx.DEPS || {};
    var lista = document.getElementById("fe-lista");
    var painel = document.getElementById("fe-painel");
    var estado = { ficha: null, ensaio: null };  // ensaio = {uid, ficha, dados, atualizado}

    function fichasDisponiveis() {
      return Object.keys(FICHAS).filter(function (id) { return byId[id]; });
    }
    function novoEnsaio(fid) {
      var F = FICHAS[fid], pts = [];
      for (var i = 0; i < (F.pontosIniciais || 1); i++) pts.push({ usar: true });
      return { uid: uid(), ficha: fid, dados: { ident: { data: new Date().toISOString().slice(0, 10) }, params: { energia: "B" }, pontos: pts, obs: "" } };
    }

    function renderLista() {
      var salvos = lerTodos();
      lista.innerHTML = '<div class="fe-sec">Fichas disponíveis</div>' + fichasDisponiveis().map(function (id) {
        var n = byId[id], qtd = salvos.filter(function (s) { return s.ficha === id; }).length;
        return '<div class="norma-item' + (estado.ficha === id ? " selected" : "") + '" data-f="' + esc(id) + '">' +
          '<div class="codigo">' + esc(n.codigo) + "</div><div class=\"titulo\">" + esc(FICHAS[id].titulo) +
          (qtd ? " · " + qtd + " salvo(s)" : "") + "</div></div>";
      }).join("") +
        '<div class="fe-sec fe-sec-em">Em preparação</div><div class="fe-prox">Próximas fichas (após aprovação desta): ' +
        "teor de umidade, ISC, massa específica in situ / grau de compactação, granulometria…</div>";
    }

    function relacoes(fid) {
      var d = DEPS[fid] || { depende: [], usado_por: [] };
      function link(id) { return byId[id] ? '<a class="fe-rel" data-id="' + esc(id) + '">' + esc(byId[id].codigo) + "</a>" : ""; }
      var antes = d.depende.map(function (x) { return x.id ? link(x.id) : esc(x.codigo); }).join(" ");
      var depois = d.usado_por.map(link).join(" ");
      return '<div class="fe-relacoes"><span><b>Pré-requisitos:</b> preparação da amostra (seção 4); o teor de umidade de cada ponto é ' +
        "calculado nesta ficha (7.1)" + (antes ? " · " + antes : "") + "</span>" +
        (depois ? "<span><b>Usam este resultado:</b> " + depois + " · e o grau de compactação no controle das ES</span>" : "") + "</div>";
    }

    function campo(grupo, f, valor) {
      var id = "fe-" + grupo + "-" + f.k;
      var input;
      if (f.tipo === "select") {
        input = '<select id="' + id + '" data-g="' + grupo + '" data-k="' + f.k + '">' + f.opcoes.map(function (o) {
          return '<option value="' + esc(o[0]) + '"' + (valor === o[0] ? " selected" : "") + ">" + esc(o[1]) + "</option>";
        }).join("") + "</select>";
      } else {
        input = '<input id="' + id + '" data-g="' + grupo + '" data-k="' + f.k + '" type="' + (f.tipo === "date" ? "date" : "text") +
          '" value="' + esc(valor || "") + '"' + (f.ph ? ' placeholder="' + esc(f.ph) + '"' : "") + ">";
      }
      return '<label class="fe-campo"><span>' + esc(f.r) + "</span>" + input + (f.dica ? '<small>' + esc(f.dica) + "</small>" : "") + "</label>";
    }

    function renderFicha() {
      var fid = estado.ficha;
      if (!fid) {
        painel.innerHTML = '<div class="empty-state">Escolha uma ficha à esquerda.</div>';
        return;
      }
      var F = FICHAS[fid], n = byId[fid];
      if (!estado.ensaio || estado.ensaio.ficha !== fid) estado.ensaio = novoEnsaio(fid);
      var d = estado.ensaio.dados;
      var salvos = lerTodos().filter(function (s) { return s.ficha === fid; });

      var html = '<div class="content-header"><div class="header-top"><div>' +
        '<div class="codigo">' + esc(F.titulo) + "</div>" +
        '<div class="meta"><a class="fe-rel" data-id="' + esc(fid) + '">' + esc(n.codigo) + "</a> — " + esc(F.resumo) + "</div></div>" +
        '<div class="header-actions"><button class="edit-btn" id="fe-novo">Novo</button>' +
        '<button class="edit-btn" id="fe-exemplo">Carregar exemplo</button>' +
        '<button class="edit-btn save" id="fe-salvar">Salvar</button>' +
        '<button class="edit-btn save" id="fe-relatorio">Gerar relatório</button></div></div>' +
        relacoes(fid) + "</div>";

      html += '<div class="fe-salvos"><label>Ensaios salvos neste navegador: <select id="fe-abrir"><option value="">— abrir um ensaio salvo —</option>' +
        salvos.map(function (s) {
          var i = s.dados.ident || {};
          return '<option value="' + esc(s.uid) + '"' + (s.uid === estado.ensaio.uid ? " selected" : "") + ">" +
            esc((i.registro || "sem registro") + " · " + (i.data || "") + " · " + (i.local || i.origem || "")) + "</option>";
        }).join("") + '</select></label> <button class="fe-link" id="fe-exportar">Exportar arquivo</button>' +
        ' <label class="fe-link">Importar arquivo<input type="file" id="fe-importar" accept=".json" hidden></label>' +
        (salvos.some(function (s) { return s.uid === estado.ensaio.uid; }) ? ' <button class="fe-link fe-perigo" id="fe-excluir">Excluir este ensaio</button>' : "") +
        '<span id="fe-status"></span></div>';

      html += '<h3 class="fe-h">Identificação</h3><div class="fe-grid">' +
        IDENT.map(function (f) { return campo("ident", f, (d.ident || {})[f.k]); }).join("") + "</div>";
      html += '<h3 class="fe-h">Parâmetros do ensaio</h3><div class="fe-grid">' +
        F.params.map(function (f) { return campo("params", f, (d.params || {})[f.k]); }).join("") + "</div>";

      html += '<h3 class="fe-h">Pontos da curva <span class="fe-hint">uma coluna por corpo de prova; mínimo de ' + F.pontosMin +
        ' (5.4). Desmarque "usar" para tirar um ponto discrepante do ajuste.</span></h3>' +
        '<div class="fe-tab-wrap"><table class="fe-tab" id="fe-tab"></table></div>' +
        '<div class="fe-pts-acoes"><button class="edit-btn" id="fe-add">+ Ponto</button> <button class="edit-btn" id="fe-rem">− Último ponto</button></div>';

      html += '<h3 class="fe-h">Resultados</h3><div id="fe-resultados"></div>' +
        '<div class="fe-graf-box" id="fe-grafico"></div><div id="fe-avisos"></div>' +
        '<h3 class="fe-h">Observações</h3><textarea id="fe-obs" class="fe-obs" rows="3" placeholder="Ocorrências, desvios, material, etc.">' +
        esc(d.obs || "") + "</textarea>";
      painel.innerHTML = html;
      renderTabela();
      recalcular();
      ligarEventos();
    }

    function renderTabela() {
      var F = FICHAS[estado.ficha], d = estado.ensaio.dados;
      var cab = '<tr><th class="fe-rot">Ponto</th><th class="fe-u"></th>' + d.pontos.map(function (p, i) {
        return '<th><div>' + (i + 1) + '</div><label class="fe-usar"><input type="checkbox" data-i="' + i + '" data-k="usar"' +
          (p.usar !== false ? " checked" : "") + "> usar</label></th>";
      }).join("") + "</tr>";
      var corpo = F.linhas.map(function (l) {
        if (l.grupo) return '<tr class="fe-grupo"><td colspan="' + (d.pontos.length + 2) + '">' + esc(l.grupo) + "</td></tr>";
        var tds = d.pontos.map(function (p, i) {
          if (l.calc) return '<td class="fe-calc' + (l.destaque ? " fe-dest" : "") + '" data-c="' + l.calc + '" data-i="' + i + '">—</td>';
          var ph = l.padrao ? (d.params[l.padrao] || (l.padrao === "volumePadrao" ? String(VOL_PADRAO) : "")) : "";
          return '<td><input data-i="' + i + '" data-k="' + l.k + '" value="' + esc(p[l.k] || "") + '"' +
            (ph ? ' placeholder="' + esc(ph) + '"' : "") + (l.texto ? "" : ' inputmode="decimal"') + "></td>";
        }).join("");
        return '<tr class="' + (l.calc ? "fe-linha-calc" : "") + '"><th class="fe-rot">' + esc(l.r) + '</th><td class="fe-u">' + esc(l.u || "") + "</td>" + tds + "</tr>";
      }).join("");
      document.getElementById("fe-tab").innerHTML = "<thead>" + cab + "</thead><tbody>" + corpo + "</tbody>";
    }

    var ultimoCalc = null;
    function recalcular() {
      var F = FICHAS[estado.ficha], d = estado.ensaio.dados;
      var calc = F.calcular(d);
      ultimoCalc = calc;
      Array.prototype.forEach.call(painel.querySelectorAll("td.fe-calc"), function (td) {
        var l = F.linhas.filter(function (x) { return x.calc === td.dataset.c; })[0];
        var v = calc.pontos[Number(td.dataset.i)][td.dataset.c];
        td.textContent = fmt(v, l.casas);
      });
      document.getElementById("fe-resultados").innerHTML = F.resultadosHtml(calc, d);
      document.getElementById("fe-grafico").innerHTML = F.grafico(calc, d);
      document.getElementById("fe-avisos").innerHTML = calc.avisos.length
        ? '<div class="fe-avisos">' + calc.avisos.map(function (a) { return "<div>⚠ " + esc(a) + "</div>"; }).join("") + "</div>" : "";
    }

    function status(t) {
      var s = document.getElementById("fe-status");
      if (s) { s.textContent = t; setTimeout(function () { if (s.textContent === t) s.textContent = ""; }, 3000); }
    }

    // ---------- navegação de planilha na tabela de pontos (como no Excel) ----------
    // ↑/↓ e Enter/Shift+Enter mudam de linha (Enter na última linha vai para o topo do próximo ponto);
    // ←/→ mudam de coluna quando o cursor está no início/fim do texto ou com tudo selecionado;
    // Tab/Shift+Tab mudam de coluna. Ao entrar na célula o conteúdo fica selecionado.
    function celulaVizinha(inp, dLin, dCol, quebra) {
      var tab = document.getElementById("fe-tab");
      var linhas = Array.prototype.filter.call(tab.querySelectorAll("tbody tr"), function (tr) {
        return tr.querySelector("input[data-i]");
      });
      var lin = linhas.indexOf(inp.closest("tr")), col = Number(inp.dataset.i);
      var nCol = estado.ensaio.dados.pontos.length;
      var L = lin + dLin, C = col + dCol;
      if (quebra && L >= linhas.length) { L = 0; C = col + 1; }       // Enter no fim da coluna -> próximo ponto
      if (quebra && L < 0) { L = linhas.length - 1; C = col - 1; }    // Shift+Enter no topo -> ponto anterior
      if (L < 0 || L >= linhas.length || C < 0 || C >= nCol) return null;
      return linhas[L].querySelector('input[data-i="' + C + '"]');
    }

    function navegarTabela(ev) {
      var t = ev.target;
      if (!t.matches || !t.matches("#fe-tab tbody input[data-i]")) return;
      var tudo = t.selectionStart === 0 && t.selectionEnd === t.value.length;
      var alvo = null;
      switch (ev.key) {
        case "ArrowDown": alvo = celulaVizinha(t, 1, 0); break;
        case "ArrowUp": alvo = celulaVizinha(t, -1, 0); break;
        case "Enter": alvo = celulaVizinha(t, ev.shiftKey ? -1 : 1, 0, true); break;
        case "ArrowRight": if (tudo || t.selectionEnd === t.value.length) alvo = celulaVizinha(t, 0, 1); break;
        case "ArrowLeft": if (tudo || t.selectionStart === 0) alvo = celulaVizinha(t, 0, -1); break;
        case "Tab": alvo = celulaVizinha(t, 0, ev.shiftKey ? -1 : 1); if (!alvo) return; break;
        default: return;
      }
      if (ev.key === "Enter" || ev.key === "Tab" || alvo) ev.preventDefault();
      if (alvo) { alvo.focus(); alvo.select(); }
    }

    function ligarEventos() {
      painel.onkeydown = navegarTabela;
      painel.onfocusin = function (ev) {
        var t = ev.target;
        // entrar na célula seleciona o conteúdo (digitar substitui, como no Excel)
        if (t.matches && t.matches("#fe-tab tbody input[data-i]")) setTimeout(function () { if (document.activeElement === t) t.select(); }, 0);
      };
      var d = estado.ensaio.dados;
      painel.oninput = function (ev) {
        var t = ev.target;
        if (t.id === "fe-obs") { d.obs = t.value; return; }
        if (t.dataset.g) {
          d[t.dataset.g] = d[t.dataset.g] || {};
          d[t.dataset.g][t.dataset.k] = t.value;
          if (t.dataset.k === "volumePadrao") renderTabela();
          recalcular();
          return;
        }
        if (t.dataset.i !== undefined && t.dataset.k) {
          d.pontos[Number(t.dataset.i)][t.dataset.k] = t.type === "checkbox" ? t.checked : t.value;
          recalcular();
        }
      };
      painel.onchange = painel.oninput;
      painel.onclick = function (ev) {
        var a = ev.target.closest(".fe-rel");
        if (a) { ctx.abrirNorma(a.dataset.id); return; }
      };
      document.getElementById("fe-add").onclick = function () { d.pontos.push({ usar: true }); renderTabela(); recalcular(); };
      document.getElementById("fe-rem").onclick = function () { if (d.pontos.length > 1) { d.pontos.pop(); renderTabela(); recalcular(); } };
      document.getElementById("fe-novo").onclick = function () { estado.ensaio = novoEnsaio(estado.ficha); renderFicha(); };
      document.getElementById("fe-exemplo").onclick = function () {
        var ex = FICHAS[estado.ficha].exemplo();
        ex.ident.data = new Date().toISOString().slice(0, 10);
        estado.ensaio = { uid: uid(), ficha: estado.ficha, dados: Object.assign({ obs: "" }, ex) };
        renderFicha();
      };
      document.getElementById("fe-salvar").onclick = function () {
        var todos = lerTodos().filter(function (s) { return s.uid !== estado.ensaio.uid; });
        estado.ensaio.atualizado = new Date().toISOString();
        estado.ensaio.resultados = ultimoCalc ? ultimoCalc.resultados : null;  // disponível para as fichas que dependem desta
        todos.push(estado.ensaio);
        if (gravarTodos(todos)) { renderLista(); renderFicha(); status("Salvo neste navegador."); }
        else status("Não foi possível salvar (armazenamento do navegador indisponível) — use Exportar arquivo.");
      };
      var ex = document.getElementById("fe-excluir");
      if (ex) ex.onclick = function () {
        if (!confirm("Excluir este ensaio salvo neste navegador?")) return;
        gravarTodos(lerTodos().filter(function (s) { return s.uid !== estado.ensaio.uid; }));
        estado.ensaio = novoEnsaio(estado.ficha);
        renderLista(); renderFicha();
      };
      document.getElementById("fe-abrir").onchange = function (ev) {
        var s = lerTodos().filter(function (x) { return x.uid === ev.target.value; })[0];
        if (s) { estado.ensaio = s; renderFicha(); }
      };
      document.getElementById("fe-exportar").onclick = function () {
        var blob = new Blob([JSON.stringify(estado.ensaio, null, 1)], { type: "application/json" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = (byId[estado.ficha].codigo + "_" + ((d.ident || {}).registro || "ensaio")).replace(/[^\w.-]+/g, "_") + ".json";
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      };
      document.getElementById("fe-importar").onchange = function (ev) {
        var f = ev.target.files[0];
        if (!f) return;
        f.text().then(function (t) {
          var e = JSON.parse(t);
          if (!e || !FICHAS[e.ficha] || !e.dados) throw new Error("arquivo não é um ensaio desta aba");
          estado.ficha = e.ficha;
          estado.ensaio = e;
          renderLista(); renderFicha(); status("Ensaio importado (salve para guardar neste navegador).");
        }).catch(function (err) { alert("Não foi possível importar: " + err.message); });
      };
      document.getElementById("fe-relatorio").onclick = function () { relatorio(); };
    }

    // ---------- relatório (nova janela, pronta para imprimir / salvar em PDF) ----------
    function relatorio() {
      var doc = montarRelatorio(FICHAS[estado.ficha], byId[estado.ficha], estado.ensaio.dados);
      var w = window.open("", "_blank");
      if (!w) { alert("O navegador bloqueou a janela do relatório: permita pop-ups para esta página."); return; }
      w.document.open();
      w.document.write(doc);
      w.document.close();
    }

    lista.onclick = function (ev) {
      var it = ev.target.closest(".norma-item");
      if (!it) return;
      estado.ficha = it.dataset.f;
      estado.ensaio = null;
      renderLista();
      renderFicha();
    };

    estado.ficha = fichasDisponiveis()[0] || null;
    renderLista();
    renderFicha();
    return {
      abrir: function (fid) { if (FICHAS[fid]) { estado.ficha = fid; estado.ensaio = null; renderLista(); renderFicha(); } },
      temFicha: function (fid) { return !!FICHAS[fid]; },
    };
  };
  window.FICHAS_ENSAIO = FICHAS;
  window.montarRelatorioFicha = montarRelatorio;
})();
