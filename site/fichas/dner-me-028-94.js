/*
 * Ficha: DNER-ME 028/94 — Tinta para demarcação viária — determinação da consistência (viscosímetro Stormer).
 * Usa FE.sinalizacao (definido em dner-me-018-94.js): limites das EM e tabelas de Unidades Krebs (Anexo B).
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao, K = S.krebs, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  // reta carga = a + b × tempo (mínimos quadrados) — Anexo A, Figura 6
  function reta(pts) {
    var n = pts.length;
    if (n < 2) return null;
    var sx = 0, sy = 0, sxx = 0, sxy = 0;
    pts.forEach(function (p) { sx += p.t; sy += p.g; sxx += p.t * p.t; sxy += p.t * p.g; });
    var den = n * sxx - sx * sx;
    if (!den) return null;
    var b = (n * sxy - sx * sy) / den;
    return { a: (sy - b * sx) / n, b: b };
  }

  function grafico(calc, d, opt) {
    opt = opt || {};
    var pts = calc.pontos || [];
    if (!pts.length) return '<div class="fe-graf-vazio">O gráfico aparece com as leituras (carga × tempo).</div>';
    var W = opt.w || 560, H = opt.h || 300, m = { l: 52, r: 16, t: 14, b: 40 };
    var cor = opt.imprimir ? { eixo: "#333", grade: "#ddd", txt: "#222", pt: "#1f5fbf", ln: "#c0392b" }
      : { eixo: "var(--text-dim)", grade: "var(--border)", txt: "var(--text-dim)", pt: "#4f8cff", ln: "#e0a13a" };
    var gs = pts.map(function (p) { return p.g; }), ts = pts.map(function (p) { return p.t; }).concat([30]);
    var r = calc.resultados;
    if (ok(r.carga)) gs.push(r.carga);
    var x0 = Math.floor(Math.min.apply(null, gs) / 50) * 50 - 50, x1 = Math.ceil(Math.max.apply(null, gs) / 50) * 50 + 50;
    var y0 = Math.floor(Math.min.apply(null, ts)) - 2, y1 = Math.ceil(Math.max.apply(null, ts)) + 2;
    x0 = Math.max(0, x0);
    function X(v) { return m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r); }
    function Y(v) { return H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b); }
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
    var px = (x1 - x0) > 600 ? 100 : 50;
    for (var gx = Math.ceil(x0 / px) * px; gx <= x1; gx += px) {
      s += '<line x1="' + X(gx) + '" y1="' + m.t + '" x2="' + X(gx) + '" y2="' + (H - m.b) + '" stroke="' + cor.grade + '" stroke-width="0.6"/>' +
        '<text x="' + X(gx) + '" y="' + (H - m.b + 14) + '" text-anchor="middle" fill="' + cor.txt + '">' + gx + "</text>";
    }
    for (var gy = y0; gy <= y1; gy += 1) {
      s += '<line x1="' + m.l + '" y1="' + Y(gy) + '" x2="' + (W - m.r) + '" y2="' + Y(gy) + '" stroke="' + cor.grade + '" stroke-width="0.6"/>' +
        ((gy - y0) % 2 === 0 ? '<text x="' + (m.l - 6) + '" y="' + (Y(gy) + 4) + '" text-anchor="end" fill="' + cor.txt + '">' + gy + "</text>" : "");
    }
    s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + cor.eixo + '"/>';
    s += '<text x="' + ((W + m.l - m.r) / 2) + '" y="' + (H - 6) + '" text-anchor="middle" fill="' + cor.txt + '">Carga (g)</text>';
    s += '<text transform="translate(14 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + cor.txt + '">Tempo para 100 rotações (s)</text>';
    // faixa 27–33 s (6.1.7)
    s += '<rect x="' + m.l + '" y="' + Y(33) + '" width="' + (W - m.l - m.r) + '" height="' + (Y(27) - Y(33)) + '" fill="' + cor.pt + '" opacity="0.07"/>';
    if (r.reta) {
      // t = (g − a)/b
      var tA = (x0 - r.reta.a) / r.reta.b, tB = (x1 - r.reta.a) / r.reta.b;
      s += '<defs><clipPath id="fe-clip-028"><rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '"/></clipPath></defs>' +
        '<line clip-path="url(#fe-clip-028)" x1="' + X(x0) + '" y1="' + Y(tA) + '" x2="' + X(x1) + '" y2="' + Y(tB) + '" stroke="' + cor.ln + '" stroke-width="1.8"/>';
    }
    if (ok(r.carga)) {
      s += '<line x1="' + m.l + '" y1="' + Y(30) + '" x2="' + X(r.carga) + '" y2="' + Y(30) + '" stroke="' + cor.ln + '" stroke-dasharray="3 3"/>' +
        '<line x1="' + X(r.carga) + '" y1="' + Y(30) + '" x2="' + X(r.carga) + '" y2="' + (H - m.b) + '" stroke="' + cor.ln + '" stroke-dasharray="3 3"/>' +
        '<text x="' + (X(r.carga) + 6) + '" y="' + (Y(30) - 6) + '" fill="' + cor.ln + '" font-weight="bold">C = ' + fmt(r.carga, 0) + " g · " + fmt(r.uk, 0) + " UK</text>";
    }
    pts.forEach(function (p) { s += '<circle cx="' + X(p.g) + '" cy="' + Y(p.t) + '" r="4.5" fill="' + cor.pt + '"/>'; });
    return s + "</svg>";
  }

  FE.FICHAS["dner-me-028-94"] = {
    titulo: "Tinta para demarcação viária — consistência (viscosímetro Stormer)",
    resumo: "Procedimento A: tempo para 100 rotações sob ≥ 3 cargas (duas leituras entre 27 e 33 s); a carga que dá 100 rotações em 30 s, lida na reta, convertida em Unidades Krebs (Tabela I). Procedimento B: carga que dá 200 rpm (estroboscópio), Tabela II.",
    blocos: [],
    params: S.paramsTinta().concat([
      { k: "proc", r: "Procedimento", tipo: "select", recarrega: true,
        opcoes: [["A", "A — cronômetro (tempo para 100 rotações)"], ["B", "B — cronômetro estroboscópico (200 rpm)"]] },
      { k: "temp", r: "Temperatura da amostra (°C) — 25 ± 0,2 °C (6.1.3)", ph: "25,0" },
      { k: "cargaB", r: "Carga que ajusta a rotação em 200 rpm (g) — 6.2.5", se: function (d) { return (d.params || {}).proc === "B"; } },
    ]).concat(S.paramsEspec("consistencia")),
    padrao: { cor: "branca", espec: "", proc: "A" },
    tabelas: function (d) {
      if ((d.params || {}).proc === "B") return [];
      return [{ chave: "leit", titulo: "Leituras — Procedimento A (6.1.6 e 6.1.7)", rotulo: "Leitura", iniciais: 3, min: 3,
        dica: "uma coluna por carga; no mínimo 3 cargas, com ao menos duas leituras entre 27 e 33 s",
        linhas: [
          { k: "g", r: "Carga (massa no porta-pesos)", u: "g" },
          { k: "t", r: "Tempo para 100 rotações (após ≥ 10 rotações)", u: "s" },
          { calc: "uk", r: "UK da leitura — Tabela I, interpolada (7.1.3)", u: "UK", casas: 1 },
        ] }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], res = { proc: P.proc || "A" };
      var tmp = num(P.temp);
      if (ok(tmp) && Math.abs(tmp - 25) > 0.2 + 1e-9) avisos.push("Temperatura da amostra " + fmt(tmp, 1) + " °C fora de 25 ± 0,2 °C (6.1.3).");
      var tab = { leit: [] }, pontos = [];
      if (res.proc === "B") {
        var g = num(P.cargaB);
        res.carga = g;
        res.ukExato = K.ukCarga(g);
        if (ok(g) && !ok(res.ukExato)) avisos.push("Carga de " + fmt(g, 0) + " g fora da Tabela II (70 a 1 090 g).");
      } else {
        tab.leit = (d.leit || []).map(function (p, i) {
          var g = num(p.g), t = num(p.t), o = { uk: K.ukLeitura(t, g) };
          if (ok(g) && ok(t)) {
            pontos.push({ g: g, t: t, uk: o.uk });
            if (t < 24 || t > 40) avisos.push("Leitura " + (i + 1) + ": " + fmt(t, 1) + " s fora da Tabela I (24 a 40 s).");
          }
          return o;
        });
        var cargas = {};
        pontos.forEach(function (p) { cargas[p.g] = 1; });
        var nCargas = Object.keys(cargas).length, naFaixa = pontos.filter(function (p) { return p.t >= 27 && p.t <= 33; }).length;
        if (pontos.length && nCargas < 3) avisos.push("A norma pede no mínimo 3 cargas diferentes (6.1.7); há " + nCargas + ".");
        if (pontos.length && naFaixa < 2) avisos.push("Pelo menos duas leituras devem ficar entre 27 e 33 s (6.1.7); há " + naFaixa + ". Ajuste as cargas.");
        res.reta = nCargas >= 2 ? reta(pontos) : null;
        if (res.reta && res.reta.b >= 0) { avisos.push("A carga deveria diminuir com o tempo para 100 rotações — confira as leituras."); res.reta = null; }
        res.carga = res.reta ? res.reta.a + res.reta.b * 30 : NaN;
        res.ukExato = K.ukCarga(res.carga);
        if (ok(res.carga) && !ok(res.ukExato)) avisos.push("Carga a 30 s de " + fmt(res.carga, 0) + " g fora das tabelas (70 a 1 090 g).");
        res.ukMedia = FE.media(pontos.map(function (p) { return p.uk; }));
      }
      res.uk = ok(res.ukExato) ? Math.round(res.ukExato) : NaN;
      res.lim = S.limite("consistencia", P);
      res.conforme = S.confere(res.uk, res.lim);
      S.avisoLimite(avisos, "Consistência", res.uk, res.lim, "UK", 0);
      return { tab: tab, pontos: pontos, resultados: res, avisos: avisos };
    },
    rotuloImportar: function (r) { return "consistência " + (ok(r.uk) ? fmt(r.uk, 0) : "—") + " UK"; },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      var h = '<div class="fe-res">' + S.itemRes(fmt(r.uk, 0) + " <small>UK</small>", "Consistência (" + (r.proc === "B" ? "Procedimento B, Tabela II" : "Procedimento A, carga a 30 s") + ")" +
        (r.lim ? " · exigido " + esc(S.textoLimite(r.lim, "UK", 0)) + " " + S.selo(r.conforme) : ""));
      h += S.itemRes(fmt(r.carga, 0) + " <small>g</small>", r.proc === "B" ? "Carga a 200 rpm" : "Carga para 100 rotações em 30 s (reta, 7.1.2)", "fe-res-p");
      if (r.proc !== "B" && ok(r.ukMedia)) h += S.itemRes(fmt(r.ukMedia, 1) + " <small>UK</small>", "Média das leituras pela Tabela I (alternativa, 7.1.3)", "fe-res-p");
      return h + "</div>";
    },
    graficos: function (calc, d, opt) { return (d.params || {}).proc === "B" ? [] : [grafico(calc, d, opt)]; },
    relatorio: {
      notas: "Procedimento A: reta carga × tempo para 100 rotações ajustada por mínimos quadrados às leituras; a carga C correspondente a 30 s dá a consistência (7.1.2). Conversão em UK pela Tabela II, cujos valores coincidem com a linha de 30 s da Tabela I; interpolação linear. UK de cada leitura pela Tabela I (interpolação em carga e tempo, 7.1.3). Resultado arredondado ao inteiro.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.tinta) rows.push(["Tinta", P.tinta + " — " + (P.cor || "") + (P.lote ? " — lote " + P.lote : "")]);
        rows.push(["Consistência", (ok(r.uk) ? fmt(r.uk, 0) + " UK" : "—") + (r.lim ? " — " + S.parecer("", r.uk, r.lim, "UK", 0) : "")]);
        rows.push([r.proc === "B" ? "Carga a 200 rpm" : "Carga para 100 rotações em 30 s", ok(r.carga) ? fmt(r.carga, 0) + " g" : "—"]);
        if (r.proc !== "B" && ok(r.ukMedia)) rows.push(["Média das UK das leituras (Tabela I)", fmt(r.ukMedia, 1) + " UK"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Tinta acrílica base solvente, branca — Procedimento A, 3 cargas", dados: function () {
        return { ident: { registro: "EX-TS-028-1", obra: "Obra A", origem: "Fornecedor A" },
          params: { tinta: "Acrílica base solvente", cor: "branca", lote: "0001", espec: "em368", proc: "A", temp: "25,0" },
          leit: [{ g: "225", t: "33,5" }, { g: "250", t: "30,6" }, { g: "275", t: "28,0" }] };
      } },
      { nome: "Tinta amarela — Procedimento B, consistência alta (reprovada)", dados: function () {
        return { ident: { registro: "EX-TS-028-2", obra: "Obra B", origem: "Fornecedor B" },
          params: { tinta: "Estireno-acrilato base solvente", cor: "amarela", lote: "0417", espec: "em371", proc: "B", temp: "25,1", cargaB: "520" } };
      } },
    ],
  };
})();
