/*
 * Ficha: DNIT 419/2019-ME — Solo-cal — Estimativa do teor mínimo de cal pelo pH (método de Eades e Grim, ASTM D 6276).
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  var PH_ALVO = 12.4, SECO = 25;
  function ft(t) { return fmt(t, t % 1 ? 1 : 0); }
  function r1(x) { return Math.round(x * 10) / 10; }

  function grafico(calc, opt) {
    opt = opt || {};
    var W = opt.w || 560, H = opt.h || 300, m = { l: 52, r: 16, t: 16, b: 42 };
    var pts = calc.pts;
    if (pts.length < 2) return '<div class="fe-graf-vazio">O gráfico aparece quando houver ao menos dois teores com pH.</div>';
    var r = calc.resultados;
    var x0 = 0, x1 = Math.ceil(Math.max.apply(null, pts.map(function (p) { return p.teor; })) + 1);
    var ys = pts.map(function (p) { return p.ph; }).concat([PH_ALVO]);
    var y0 = Math.floor(Math.min.apply(null, ys) * 5 - 1) / 5, y1 = Math.ceil(Math.max.apply(null, ys) * 5 + 1) / 5;
    var passoY = y1 - y0 > 3 ? 0.5 : y1 - y0 > 1.2 ? 0.2 : 0.1;
    function X(v) { return m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r); }
    function Y(v) { return H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b); }
    var cor = opt.imprimir ? { eixo: "#333", grade: "#ddd", txt: "#222", c: "#1f5fbf", d: "#c0392b" } : { eixo: "var(--text-dim)", grade: "var(--border)", txt: "var(--text-dim)", c: "#4f8cff", d: "#e0a13a" };
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
    for (var gx = x0; gx <= x1; gx += x1 > 16 ? 2 : 1) {
      s += '<line x1="' + X(gx) + '" y1="' + m.t + '" x2="' + X(gx) + '" y2="' + (H - m.b) + '" stroke="' + cor.grade + '" stroke-width="0.6"/>' +
        '<text x="' + X(gx) + '" y="' + (H - m.b + 15) + '" text-anchor="middle" fill="' + cor.txt + '">' + gx + "</text>";
    }
    for (var gy = Math.ceil(y0 / passoY - 1e-9) * passoY; gy <= y1 + 1e-9; gy += passoY) {
      s += '<line x1="' + m.l + '" y1="' + Y(gy) + '" x2="' + (W - m.r) + '" y2="' + Y(gy) + '" stroke="' + cor.grade + '" stroke-width="0.6"/>' +
        '<text x="' + (m.l - 6) + '" y="' + (Y(gy) + 4) + '" text-anchor="end" fill="' + cor.txt + '">' + fmt(gy, 1) + "</text>";
    }
    s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + cor.eixo + '"/>' +
      '<text x="' + ((W + m.l - m.r) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="' + cor.txt + '">Teor de cal (%)</text>' +
      '<text transform="translate(14 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + cor.txt + '">pH</text>' +
      '<line x1="' + m.l + '" y1="' + Y(PH_ALVO) + '" x2="' + (W - m.r) + '" y2="' + Y(PH_ALVO) + '" stroke="' + cor.d + '" stroke-dasharray="6 4"/>' +
      '<text x="' + (W - m.r - 6) + '" y="' + (Y(PH_ALVO) + 14) + '" text-anchor="end" fill="' + cor.d + '">pH 12,4</text>';
    s += '<path d="' + pts.map(function (p, i) { return (i ? "L" : "M") + X(p.teor).toFixed(1) + " " + Y(p.ph).toFixed(1); }).join(" ") + '" fill="none" stroke="' + cor.c + '" stroke-width="2"/>';
    pts.forEach(function (p) { s += '<circle cx="' + X(p.teor) + '" cy="' + Y(p.ph) + '" r="4.5" fill="' + cor.c + '"/>'; });
    if (ok(r.teor)) {
      var pr = pts.filter(function (p) { return p.teor === r.teor; })[0];
      s += '<circle cx="' + X(r.teor) + '" cy="' + Y(pr.ph) + '" r="7.5" fill="none" stroke="' + cor.d + '" stroke-width="2"/>' +
        '<text x="' + (X(r.teor) + 4) + '" y="' + (Y(pr.ph) + 22) + '" fill="' + cor.d + '" font-weight="bold">' + ft(r.teor) + " % de cal</text>";
    }
    return s + "</svg>";
  }

  FE.FICHAS["dnit-419-2019-me"] = {
    titulo: "Solo-cal — Teor mínimo de cal pelo pH",
    rotuloImportar: function (r) { return "teor mínimo de cal " + (ok(r.teor) ? fmt(r.teor, 0) + " %" : "—"); },
    resumo: "Frascos com o equivalente a 25 g de solo seco (passante na peneira nº 40), teores de cal de 2 % a 10 % e 100 ml de água destilada, agitados 30 s a cada 10 min durante 1 h; pH medido nos últimos 15 min. O menor teor que alcança pH 12,4 é o teor mínimo de cal (8); com pH máximo de 12,3 constante em dois teores sucessivos após a repetição, adota-se o menor deles.",
    blocos: [],
    params: [
      { k: "w", r: "Teor de umidade do solo seco ao ar W (%) — DNER-ME 213", dica: "Ms ar = 25 × (1,0 + W/100) (7 c)" },
      { k: "cal", r: "Cal — identificação, caracterização e procedência (8 d)", ph: "ex.: cal hidratada CH-I, Fornecedor A" },
      { k: "phCal", r: "pH da solução cal-água (2 g de cal + 100 ml) (7 e; 8 b)", ph: "ex.: 12,45" },
      { k: "repetido", r: "Ensaio", tipo: "select", opcoes: [["nao", "Primeiro ensaio (teores de 2 % a 10 %)"], ["sim", "Repetição com maiores porcentagens de cal (8)"]] },
      { k: "temperatura", r: "Temperatura das soluções (°C) — opcional", dica: "registre para a leitura do pHmetro" },
    ],
    padrao: { repetido: "nao" },
    tabelas: function () {
      return [{ chave: "frascos", titulo: "Frascos solo-cal", rotulo: "Frasco", iniciais: 5, min: 1,
        dica: "uma coluna por frasco; cinco frascos com teores de 2 % a 10 % em relação a 25 g de solo seco (7 b, e)",
        linhas: [
          { k: "teor", r: "Teor de cal (% da massa de solo seco)", u: "%" },
          { calc: "msar", r: "Massa de solo seco ao ar Ms ar = 25 × (1 + W/100) (7 c)", u: "g", casas: 2 },
          { calc: "mcal", r: "Massa de cal = teor × 25 g", u: "g", casas: 2 },
          { k: "ph", r: "pH da solução solo-cal (7 j, k)", u: "" },
        ] }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], W = num(P.w), rep = P.repetido === "sim";
      var frascos = (d.frascos || []).map(function (p) {
        var t = num(p.teor);
        return { msar: ok(W) ? SECO * (1 + W / 100) : NaN, mcal: ok(t) ? t / 100 * SECO : NaN, teor: t, ph: num(p.ph) };
      });
      if (!ok(W) && frascos.some(function (o) { return ok(o.teor); })) avisos.push("Informe o teor de umidade do solo seco ao ar (W) para calcular a massa de solo de cada frasco (7 a, c).");
      var pts = frascos.filter(function (o) { return ok(o.teor) && ok(o.ph); }).sort(function (a, b) { return a.teor - b.teor; });
      pts.forEach(function (o) { if (o.ph < 0 || o.ph > 14) avisos.push("pH de " + fmt(o.ph, 2) + " no teor de " + ft(o.teor) + " % — fora da escala 0–14."); });
      var res = { teor: NaN, criterio: "", phMax: NaN, valido: true };
      if (pts.length) {
        var phMax = Math.max.apply(null, pts.map(function (o) { return o.ph; }));
        res.phMax = phMax;
        var atinge = pts.filter(function (o) { return o.ph >= PH_ALVO - 1e-9; })[0];
        if (atinge) { res.teor = atinge.teor; res.criterio = "menor teor com pH ≥ 12,4"; }
        else {
          // pH máximo de 12,3 constante em dois teores sucessivos -> o menor deles (8, 2º parágrafo)
          var par = null;
          for (var i = 1; i < pts.length; i++) {
            if (r1(pts[i].ph) === 12.3 && r1(pts[i - 1].ph) === 12.3 && r1(phMax) === 12.3) { par = pts[i - 1]; break; }
          }
          if (par && rep) { res.teor = par.teor; res.criterio = "pH máximo de 12,3 constante em dois teores sucessivos (após a repetição) — adotado o menor"; }
          else if (par) avisos.push("O pH de 12,4 não foi alcançado; o pH máximo de 12,3 repetiu-se em dois teores sucessivos. A norma manda repetir o ensaio com maiores porcentagens de cal; se, na repetição, o pH se mantiver em 12,3, adota-se o menor dos dois teores (8).");
          else if (rep && r1(phMax) < 12.3) { res.valido = false; avisos.push("Na repetição o pH máximo foi " + fmt(phMax, 2) + " (< 12,3): o ensaio é inválido — verifique o equipamento e as amostras e/ou repita com maiores porcentagens de cal (8)."); }
          else avisos.push("Nenhum teor alcançou pH 12,4 (máximo " + fmt(phMax, 2) + "): realize novo ensaio com maiores porcentagens de cal (8)." +
            " Em certos solos tropicais ricos em óxi-hidróxidos de ferro e alumínio o pH de 12,4 pode não ser atingido (Nota 1).");
        }
      }
      var n = pts.length;
      if (n && !rep) {
        if (n < 5) avisos.push("A norma prevê cinco frascos de solo-cal (7 b, e); há " + n + ".");
        if (pts.some(function (o) { return o.teor < 2 || o.teor > 10; })) avisos.push("No primeiro ensaio os teores de cal variam de 2 % a 10 % (7 e); há teores fora dessa faixa.");
      }
      var phCal = num(P.phCal);
      if (!ok(phCal) && n) avisos.push("Registre o pH da solução cal-água (2 g de cal em 100 ml), exigido no relatório (7 e; 8 b).");
      else if (ok(phCal) && phCal < PH_ALVO - 1e-9) avisos.push("pH da solução cal-água de " + fmt(phCal, 2) + ", abaixo de 12,4 (valor de uma solução saturada de Ca(OH)₂, Anexo A) — verifique a cal (DNIT 418-EM) e a calibração do pHmetro.");
      return { tab: { frascos: frascos }, pts: pts, resultados: res, avisos: avisos };
    },
    resultadosHtml: function (calc, d) {
      var r = calc.resultados, P = d.params || {};
      function cx(v, rot, p) { return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      return '<div class="fe-res">' + cx((ok(r.teor) ? ft(r.teor) : "—") + " <small>%</small>", "Teor mínimo de cal para estabilizar o solo (8)" + (r.criterio ? " — " + esc(r.criterio) : !r.valido ? ' — <span class="fe-nok">ensaio inválido</span>' : "")) +
        cx(fmt(r.phMax, 2), "pH máximo das soluções solo-cal") + cx(ok(num(P.phCal)) ? fmt(num(P.phCal), 2) : "—", "pH da solução cal-água (8 b)") + "</div>";
    },
    graficos: function (calc, d, opt) { return [grafico(calc, opt)]; },
    relatorio: {
      notas: "Ms ar = 25 × (1,0 + W/100) (7 c); massa de cal = teor × 25 g de solo seco. Resultado (8): o menor teor de cal que alcança pH 12,4 é o teor mínimo; não alcançado, repete-se o ensaio com maiores teores; na repetição, se o pH máximo for 12,3 e constante em dois teores sucessivos, adota-se o menor; pH máximo menor que 12,3 torna o ensaio inválido. pH comparado com aproximação de 0,1 na regra do 12,3.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.cal) rows.push(["Cal", P.cal]);
        rows.push(["pH da solução cal-água", ok(num(P.phCal)) ? fmt(num(P.phCal), 2) : "—"]);
        calc.pts.forEach(function (o) { rows.push(["pH com " + ft(o.teor) + " % de cal", fmt(o.ph, 2)]); });
        rows.push(["Teor mínimo de cal para estabilização", ok(r.teor) ? ft(r.teor) + " % — " + r.criterio : !r.valido ? "ensaio inválido" : "não determinado — repetir com maiores teores de cal"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Exemplo do Anexo B da norma — teores de 1 % a 10 % (valores lidos no gráfico; resultado 5 %)", dados: function () {
        return fr({ registro: "EX-CAL-001", camada: "Solo-cal (exemplo da norma)", origem: "DNIT 419/2019-ME, Anexo B" },
          { w: "3,2", cal: "Cal hidratada calcítica", phCal: "12,48", repetido: "nao" },
          [[1, 11.23], [2, 11.85], [3, 12.16], [4, 12.32], [5, 12.41], [6, 12.45], [7, 12.47], [8, 12.47], [9, 12.48], [10, 12.48]]);
      } },
      { nome: "Argila siltosa — 5 frascos de 2 % a 10 % (resultado 6 %)", dados: function () {
        return fr({ registro: "EX-CAL-002", camada: "Subleito — solo-cal (estudo)", origem: "Jazida 2" },
          { w: "4,6", cal: "Cal hidratada CH-I, Fornecedor A", phCal: "12,46", repetido: "nao", temperatura: "25" },
          [[2, 11.62], [4, 12.21], [6, 12.40], [8, 12.44], [10, 12.45]]);
      } },
      { nome: "Solo laterítico — repetição com 6 % a 14 %, pH estaciona em 12,3", dados: function () {
        return fr({ registro: "EX-CAL-003", camada: "Base — solo-cal (estudo)", origem: "Jazida 6" },
          { w: "5,1", cal: "Cal hidratada CH-III, Fornecedor B", phCal: "12,31", repetido: "sim" },
          [[6, 11.94], [8, 12.18], [10, 12.21], [12, 12.30], [14, 12.31]]);
      } },
    ],
  };

  function fr(ident, params, lista) {
    return { ident: ident, params: params, frascos: lista.map(function (x) { return { teor: String(x[0]), ph: fmt(x[1], 2) }; }) };
  }
})();
