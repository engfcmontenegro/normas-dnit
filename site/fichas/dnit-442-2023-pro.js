/*
 * Ficha: DNIT 442/2023-PRO — Levantamento do perfil longitudinal com perfilômetro inercial.
 * Registra-se no motor de site/fichas.js (window.FE).
 * Resultados por segmento de extensão constante (9 c, 10 g): IRI e QI de cada sensor vertical e médias, ATR das
 * trilhas interna e externa, macrotextura e velocidade (Tabela C1). ATR pela eq. 1 a partir das leituras La, Lb e Lc
 * (com a linha entre La e Lb quando os módulos não são equidistantes). Estatística do trecho, calibração do odômetro
 * (4.1.2 c: erro ≤ 0,1 %) e verificações de extensão e velocidade. O IRI e o QI vêm do software do perfilômetro
 * (9 b: ASTM E 1926; 9 a: DNER-ES 173); a norma não fixa limites de aceitação — um limite contratual é opcional.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  function desvio(v) { var m = media(v); return v.length > 1 ? Math.sqrt(v.reduce(function (a, x) { return a + (x - m) * (x - m); }, 0) / (v.length - 1)) : NaN; }
  function est(v) { v = v.filter(ok); return { n: v.length, media: media(v), sd: desvio(v), max: v.length ? Math.max.apply(null, v) : NaN, min: v.length ? Math.min.apply(null, v) : NaN }; }
  function se(k, v) { return function (d) { return (d.params || {})[k] === v; }; }

  FE.FICHAS["dnit-442-2023-pro"] = {
    titulo: "Perfil longitudinal com perfilômetro inercial — IRI, QI e ATR",
    rotuloImportar: function (r) { return "IRI médio " + fmt((r.iri || {}).media, 2) + " m/km · " + (r.n || 0) + " segmentos"; },
    resumo: "IRI e QI por sensor e médios em segmentos de extensão constante, ATR pela eq. 1 (La, Lb, Lc), macrotextura e velocidade; estatística do trecho, calibração do odômetro (erro ≤ 0,1 %) e limite contratual opcional.",
    blocos: [],
    params: [
      { k: "equip", r: "Perfilômetro — identificação", ph: "Perfilômetro laser, 5 sensores" },
      { k: "calib", r: "Data da última calibração (10 e)" },
      { k: "sup", r: "Superfície avaliada (10 c)", ph: "ex.: concreto asfáltico" },
      { k: "interv", r: "Extensão dos segmentos (m)", ph: "20", dica: "9 c: preferencialmente entre 20 m e 1000 m; 10 g: 20, 100, 200 ou 1000 m" },
      { k: "sens", r: "Sensores de irregularidade (verticais)", ph: "1 2 5", dica: "9 c: calcular IRI/QI só com módulos verticais; os diagonais servem ao ATR" },
      { k: "vmin", r: "Velocidade mínima de operação do fabricante (km/h) — opcional" },
      { k: "vmax", r: "Velocidade máxima de operação do fabricante (km/h) — opcional" },
      { k: "odtrena", r: "Calibração do odômetro — distância medida com trena (m) — opcional" },
      { k: "odleit", r: "Calibração do odômetro — distância indicada pelo odômetro (m) — opcional" },
      { k: "atrmodo", r: "ATR", tipo: "select", recarrega: true, opcoes: [["dir", "Valores do software por segmento"], ["eq1", "Calcular pela eq. 1 a partir de La, Lb e Lc"]] },
      { k: "xa", r: "Posição transversal de La (m)", ph: "0", se: se("atrmodo", "eq1"), dica: "vazio = módulos equidistantes (eq. 1)" },
      { k: "xc", r: "Posição transversal de Lc (m)", se: se("atrmodo", "eq1") },
      { k: "xb", r: "Posição transversal de Lb (m)", se: se("atrmodo", "eq1") },
      { k: "limiri", r: "Limite de IRI do contrato (m/km) — opcional, fora da norma" },
    ],
    padrao: { interv: "20", sens: "1 2 5", atrmodo: "dir" },
    tabelas: function (d) {
      var P = d.params || {}, s = String(P.sens || "1 2 5").split(/[\s;,]+/).filter(Boolean);
      var l = [{ k: "estaca", r: "Estaca / km inicial do segmento", texto: true }];
      s.forEach(function (x) { l.push({ k: "iri" + x, r: "IRI — sensor " + x, u: "m/km" }); });
      s.forEach(function (x) { l.push({ k: "qi" + x, r: "QI — sensor " + x, u: "cont./km" }); });
      if (P.atrmodo === "eq1") {
        ["i", "e"].forEach(function (t) {
          var T = t === "i" ? "interna" : "externa";
          l.push({ k: "la" + t, r: "Trilha " + T + " — La", u: "mm" }, { k: "lc" + t, r: "Trilha " + T + " — Lc (centro)", u: "mm" }, { k: "lb" + t, r: "Trilha " + T + " — Lb", u: "mm" });
        });
      } else l.push({ k: "atri", r: "ATR — trilha interna", u: "mm" }, { k: "atre", r: "ATR — trilha externa", u: "mm" });
      l.push({ k: "mt", r: "Macrotextura MPD", u: "mm" }, { k: "vel", r: "Velocidade", u: "km/h" }, { k: "obs", r: "Observações do operador", texto: true },
        { calc: "iri", r: "IRI médio", u: "m/km", casas: 2, destaque: true }, { calc: "qi", r: "QI médio", u: "cont./km", casas: 1 });
      if (P.atrmodo === "eq1") l.push({ calc: "ATRi", r: "ATR interna (eq. 1)", u: "mm", casas: 1 }, { calc: "ATRe", r: "ATR externa (eq. 1)", u: "mm", casas: 1 });
      return [{ chave: "seg", titulo: "Resultados por segmento (Tabela C1)", rotulo: "Segmento", iniciais: 5, min: 1, linhas: l }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], s = String(P.sens || "1 2 5").split(/[\s;,]+/).filter(Boolean);
      var itv = num(P.interv);
      if (ok(itv) && (itv < 20 || itv > 1000)) avisos.push("Segmentos de " + fmt(itv, 0) + " m: os índices devem ser calculados em intervalos preferencialmente entre 20 m e 1000 m (9 c).");
      else if (ok(itv) && [20, 100, 200, 1000].indexOf(itv) < 0) avisos.push("Segmentos de " + fmt(itv, 0) + " m: 10 g pede resultados em 20, 100, 200 ou 1000 m.");
      var xa = num(P.xa), xb = num(P.xb), xc = num(P.xc), equi = !(ok(xa) && ok(xb) && ok(xc));
      if (!equi && Math.abs(xc - (xa + xb) / 2) < 1e-6) equi = true;
      function atr(la, lc, lb) {
        if (!ok(la) || !ok(lb) || !ok(lc)) return NaN;
        if (equi) return lc - (la + lb) / 2;  // eq. 1
        return lc - (la + (lb - la) * (xc - xa) / (xb - xa));  // linha entre La e Lb na posição de Lc
      }
      var vmin = num(P.vmin), vmax = num(P.vmax), fora = [];
      var seg = (d.seg || []).map(function (g, i) {
        var o = {}, iris = s.map(function (x) { return num(g["iri" + x]); }).filter(ok), qis = s.map(function (x) { return num(g["qi" + x]); }).filter(ok);
        o.iri = media(iris); o.qi = media(qis);
        if (P.atrmodo === "eq1") { o.ATRi = atr(num(g.lai), num(g.lci), num(g.lbi)); o.ATRe = atr(num(g.lae), num(g.lce), num(g.lbe)); }
        else { o.ATRi = num(g.atri); o.ATRe = num(g.atre); }
        o.mt = num(g.mt); o.vel = num(g.vel); o.estaca = g.estaca || String(i + 1);
        if (ok(o.vel) && ((ok(vmin) && o.vel < vmin) || (ok(vmax) && o.vel > vmax))) fora.push(o.estaca + " (" + fmt(o.vel, 0) + " km/h)");
        if (iris.length && iris.length < s.length) avisos.push("Segmento " + o.estaca + ": falta IRI de algum sensor — média com " + iris.length + ".");
        return o;
      });
      if (fora.length) avisos.push("Velocidade fora da faixa de operação do fabricante em " + fora.join(", ") + " — perda de acurácia (7.3 e).");
      var r = { n: seg.filter(function (o) { return ok(o.iri); }).length, iri: est(seg.map(function (o) { return o.iri; })), qi: est(seg.map(function (o) { return o.qi; })),
        atri: est(seg.map(function (o) { return o.ATRi; })), atre: est(seg.map(function (o) { return o.ATRe; })), mt: est(seg.map(function (o) { return o.mt; })), vel: est(seg.map(function (o) { return o.vel; })),
        ext: ok(itv) ? itv * seg.length : NaN, equi: equi };
      var ot = num(P.odtrena), ol = num(P.odleit);
      if (ok(ot) && ok(ol) && ot > 0) {
        r.odErro = (ol - ot) / ot * 100;
        if (Math.abs(r.odErro) > 0.1) avisos.push("Erro do odômetro de " + fmt(r.odErro, 3) + " % (máximo 0,1 %, 1 m/km — 4.1.2 c): recalibrar.");
      }
      var lim = num(P.limiri);
      if (ok(lim)) {
        r.acima = seg.filter(function (o) { return ok(o.iri) && o.iri > lim; });
        if (r.acima.length) avisos.push(r.acima.length + " segmento(s) com IRI acima do limite contratual de " + fmt(lim, 2) + " m/km: " + r.acima.map(function (o) { return o.estaca + " (" + fmt(o.iri, 2) + ")"; }).join(", ") + ".");
      }
      return { tab: { seg: seg }, pontos: seg, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, h = '<div class="fe-res">';
      function it(v, rot, p) { return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      h += it(fmt(r.iri.media, 2) + " <small>m/km</small>", "IRI médio do trecho — σ = " + fmt(r.iri.sd, 2) + "; máx. " + fmt(r.iri.max, 2) + " (" + r.n + " segmentos)");
      h += it(fmt(r.qi.media, 1) + " <small>cont./km</small>", "QI médio do trecho — σ = " + fmt(r.qi.sd, 1), true);
      h += it(fmt(r.atri.media, 1) + " / " + fmt(r.atre.media, 1) + " <small>mm</small>", "ATR médio — trilha interna / externa (máx. " + fmt(r.atri.max, 1) + " / " + fmt(r.atre.max, 1) + ")", true);
      if (r.mt.n) h += it(fmt(r.mt.media, 2) + " <small>mm</small>", "Macrotextura média (MPD)", true);
      if (ok(r.odErro)) h += it(fmt(r.odErro, 3) + " %", "Erro do odômetro (máx. 0,1 %)", true);
      return h + "</div>";
    },
    graficos: function (calc, d, opt) {
      opt = opt || {};
      var seg = calc.pontos.filter(function (o) { return ok(o.iri); });
      if (!seg.length) return ['<div class="fe-graf-vazio">O gráfico aparece com os IRI dos segmentos.</div>'];
      var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)", cor = imp ? "#1f5fbf" : "#4f8cff";
      var W = opt.w || 600, H = opt.h || 260, m = { l: 46, r: 12, t: 16, b: 40 }, lim = num((d.params || {}).limiri);
      var ymax = Math.ceil(Math.max.apply(null, seg.map(function (o) { return o.iri; }).concat(ok(lim) ? [lim] : [])) * 1.15), n = seg.length, bw = (W - m.l - m.r) / n;
      function Y(v) { return H - m.b - v / ymax * (H - m.t - m.b); }
      var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10.5">';
      for (var v = 0; v <= ymax; v += ymax > 8 ? 2 : 1) s += '<line x1="' + m.l + '" y1="' + Y(v) + '" x2="' + (W - m.r) + '" y2="' + Y(v) + '" stroke="' + grade + '" stroke-width="0.6"/><text x="' + (m.l - 5) + '" y="' + (Y(v) + 4) + '" text-anchor="end" fill="' + txt + '">' + v + "</text>";
      var cada = Math.max(1, Math.ceil(n / 20));
      seg.forEach(function (o, i) {
        s += '<rect x="' + (m.l + i * bw + bw * 0.15).toFixed(1) + '" y="' + Y(o.iri).toFixed(1) + '" width="' + (bw * 0.7).toFixed(1) + '" height="' + (H - m.b - Y(o.iri)).toFixed(1) + '" fill="' + (ok(lim) && o.iri > lim ? "#c0392b" : cor) + '"/>';
        if (!(i % cada)) s += '<text x="' + (m.l + (i + 0.5) * bw).toFixed(1) + '" y="' + (H - m.b + 13) + '" text-anchor="middle" fill="' + txt + '">' + esc(o.estaca) + "</text>";
      });
      if (ok(lim)) s += '<line x1="' + m.l + '" y1="' + Y(lim) + '" x2="' + (W - m.r) + '" y2="' + Y(lim) + '" stroke="#c0392b" stroke-dasharray="5 3"/>';
      s += '<text x="' + (W / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + txt + '">Segmento (estaca)</text><text transform="translate(12 ' + (H / 2) + ') rotate(-90)" text-anchor="middle" fill="' + txt + '">IRI médio (m/km)</text>';
      return [s + "</svg>"];
    },
    relatorio: {
      notas: "IRI e QI médios = média dos sensores verticais de cada segmento (Tabela C1). ATR = Lc − (La + Lb)/2 (eq. 1) com módulos equidistantes; caso contrário, distância de Lc à reta entre La e Lb na posição transversal de Lc. Estatística do trecho: média e desvio-padrão (n − 1) dos valores por segmento. A norma não define limites de aceitação. Não converter IRI em QI (ou o inverso) por correlações (NOTA 8); ATR com cinco sensores é estimativo, só para nível de rede (NOTA 2).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        rows.push(["Segmentos", r.n + " de " + fmt(num(P.interv), 0) + " m" + (ok(r.ext) ? " — distância " + fmt(r.ext, 0) + " m" : "")]);
        rows.push(["IRI (m/km)", "média " + fmt(r.iri.media, 2) + "; σ " + fmt(r.iri.sd, 2) + "; mín. " + fmt(r.iri.min, 2) + "; máx. " + fmt(r.iri.max, 2)]);
        rows.push(["QI (cont./km)", "média " + fmt(r.qi.media, 1) + "; σ " + fmt(r.qi.sd, 1) + "; máx. " + fmt(r.qi.max, 1)]);
        rows.push(["ATR (mm)", "interna: média " + fmt(r.atri.media, 1) + ", máx. " + fmt(r.atri.max, 1) + "; externa: média " + fmt(r.atre.media, 1) + ", máx. " + fmt(r.atre.max, 1)]);
        if (r.mt.n) rows.push(["Macrotextura (mm)", "média " + fmt(r.mt.media, 2) + "; mín. " + fmt(r.mt.min, 2)]);
        if (r.vel.n) rows.push(["Velocidade (km/h)", "média " + fmt(r.vel.media, 0) + "; " + fmt(r.vel.min, 0) + " a " + fmt(r.vel.max, 0)]);
        if (ok(r.odErro)) rows.push(["Odômetro", "erro " + fmt(r.odErro, 3) + " % (máx. 0,1 %)"]);
        if (r.acima) rows.push(["Limite contratual de IRI", fmt(num(P.limiri), 2) + " m/km — " + r.acima.length + " segmento(s) acima"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Tabela C1 da norma — 16 segmentos, sensores 1, 2 e 5", dados: function () {
        var L = ["2,4 3,1 3,95 3,94 3,50 51,4 51,2 45,5 0,98 62", "3,3 2,8 3,70 3,90 2,73 48,1 50,7 35,5 1,11 61", "2,5 2,9 3,60 3,13 3,20 46,8 40,7 41,6 1,03 60",
          "2,4 2,8 3,59 3,34 3,04 46,7 43,4 39,5 1,32 69", "2,3 2,5 2,72 3,15 2,93 35,4 41,0 38,1 1,12 69", "3,0 2,7 3,01 2,85 2,83 39,1 37,1 36,8 0,99 69",
          "2,5 2,9 2,90 2,84 2,92 37,7 36,9 38,0 1,06 60", "2,5 2,9 2,75 2,79 2,83 35,8 36,3 36,8 1,01 61", "2,7 2,8 2,25 2,75 2,96 29,3 35,8 38,5 0,94 61",
          "2,6 2,9 2,53 2,99 2,56 32,9 38,9 33,3 1,09 61", "2,9 3,0 2,23 2,72 2,77 29,0 35,4 36,0 1,01 62", "3,3 2,5 3,44 2,54 2,77 44,7 33,0 36,0 0,98 63",
          "2,9 3,1 2,58 2,72 2,91 33,5 35,4 37,8 0,94 62", "2,9 2,5 2,83 2,99 2,93 36,8 38,9 38,1 0,75 63", "2,5 2,5 2,82 2,76 2,82 36,7 35,9 36,7 1,05 63",
          "2,7 2,6 2,63 2,88 3,18 34,2 37,4 41,3 1,08 63"];
        return { ident: { registro: "EX-PERF-001", obra: "Exemplo da norma (Anexo C)", trecho: "Estacas 1 a 16" },
          params: { equip: "Perfilômetro laser com 5 sensores", sup: "Revestimento asfáltico", interv: "20", sens: "1 2 5", atrmodo: "dir" },
          obs: "Valores da Tabela C1 da DNIT 442/2023-PRO; as médias calculadas conferem com as da tabela.",
          seg: L.map(function (x, i) {
            var v = x.split(" ");
            return { estaca: String(i + 1), atri: v[0], atre: v[1], iri1: v[2], iri2: v[3], iri5: v[4], qi1: v[5], qi2: v[6], qi5: v[7], mt: v[8], vel: v[9] };
          }) };
      } },
      { nome: "ATR pela eq. 1, odômetro e limite contratual — segmentos de 100 m (dados gerados)", dados: function () {
        var seg = [];
        for (var i = 0; i < 8; i++) {
          var b = 2.1 + (i * 37 % 11) / 10 + (i === 5 ? 1.8 : 0);
          seg.push({ estaca: "km " + fmt(12 + i * 0.1, 1), iri1: fmt(b + 0.12, 2), iri2: fmt(b - 0.05, 2), iri5: fmt(b + 0.2, 2), qi1: fmt(b * 13, 1), qi2: fmt(b * 12.6, 1), qi5: fmt(b * 13.4, 1),
            lai: fmt(302 + i % 3, 1), lci: fmt(307 + (i * 5) % 4, 1), lbi: fmt(303 + i % 2, 1), lae: fmt(301 + i % 2, 1), lce: fmt(309 + (i * 3) % 5, 1), lbe: fmt(302, 1),
            mt: fmt(0.8 + (i % 4) / 10, 2), vel: i === 3 ? "38" : "62" });
        }
        return { ident: { registro: "EX-PERF-002", data: "2026-08-27", obra: "BR-000", trecho: "km 12,0 – km 12,8, faixa direita" },
          params: { equip: "Perfilômetro laser — unidade 2", calib: "2026-08-01", sup: "CBUQ", interv: "100", sens: "1 2 5", vmin: "40", vmax: "100",
            odtrena: "1000", odleit: "1001,6", atrmodo: "eq1", xa: "0", xc: "0,40", xb: "0,90", limiri: "3,5" },
          seg: seg };
      } },
    ],
  };
})();
