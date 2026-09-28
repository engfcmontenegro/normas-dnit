/*
 * Ficha: DNER-ME 030/94 — Solos — Relações sílica-alumina (Ki) e sílica-sesquióxidos (Kr).
 * Ataque sulfúrico de 2 g da fração < 2 mm; SiO₂ por gravimetria, Al₂O₃ por EDTA/ZnSO₄, Fe₂O₃ por dicromato;
 * resultados referidos à amostra seca em estufa pelo fator f (5.1). Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  // relações moleculares da norma (6.1 e 6.2): massas moleculares arredondadas 60, 102 e 160
  function ki(s, a) { return ok(s) && ok(a) && a > 0 ? (s / 60) / (a / 102) : NaN; }
  function kr(s, a, f) { return ok(s) && ok(a) && ok(f) && (a / 102 + f / 160) > 0 ? (s / 60) / (a / 102 + f / 160) : NaN; }

  FE.FICHAS["dner-me-030-94"] = {
    titulo: "Solos — Relações sílica-alumina (Ki) e sílica-sesquióxidos (Kr)",
    resumo: "Fator de correção f (seca ao ar / seca em estufa); % SiO₂ = 200 × p × f; % Al₂O₃ = 2,55 (t₁ − t₂) f; % Fe₂O₃ = n × f; Ki = (% SiO₂ / 60) / (% Al₂O₃ / 102) e Kr = (% SiO₂ / 60) / (% Al₂O₃ / 102 + % Fe₂O₃ / 160).",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: cascalho laterítico, argila vermelha" },
      { k: "preparo", r: "Preparação (4)", ph: "ex.: seca ao ar, destorroada, passante na peneira de 2 mm",
        dica: "pouco mais de 2 kg secos ao ar, grumos desfeitos com rolo de madeira sem quebrar partículas; usa-se a fração < 2 mm" },
      { k: "criterio", r: "Verificação (opcional)", tipo: "select",
        opcoes: [["", "Nenhuma — só as relações"], ["lat", "Solo laterítico para base/sub-base: Kr < 2 (DNIT 098/2007-ES, 5.1)"]] },
    ],
    padrao: { criterio: "" },
    tabelas: function () {
      return [{
        chave: "det", titulo: "Determinações", rotulo: "Det.", iniciais: 2, min: 1,
        dica: "uma coluna por determinação (ataque); o resultado usa a média dos teores de óxidos",
        linhas: [
          { grupo: "Fator de correção para 100 °C a 105 °C (5.1) — cerca de 10 g, estufa durante a noite" },
          { k: "pfT", r: "Pesa-filtro (tara)", u: "g" },
          { k: "pfAr", r: "Pesa-filtro + amostra seca ao ar", u: "g" },
          { k: "pfEst", r: "Pesa-filtro + amostra seca em estufa", u: "g" },
          { calc: "mAr", r: "Massa da amostra seca ao ar", u: "g", casas: 4 },
          { calc: "f", r: "f = seca ao ar / seca em estufa (5.1)", u: "", casas: 4, destaque: true },
          { grupo: "Ataque sulfúrico (5.2) e sílica (5.3) — 50 ml do filtrado alcalino de 200 ml, calcinado a 900–1 000 °C" },
          { k: "mAt", r: "Massa de amostra seca ao ar atacada (5.2)", u: "g", ph: "2,0000" },
          { k: "cadT", r: "Cadinho (tara)", u: "g" },
          { k: "cadR", r: "Cadinho + resíduo calcinado", u: "g" },
          { calc: "p", r: "Resíduo calcinado (p)", u: "g", casas: 4 },
          { calc: "si", r: "% SiO₂ = 200 × p × f (5.3)", u: "%", casas: 2, destaque: true },
          { grupo: "Alumínio (5.4) — alíquota de 25 ml, EDTA 0,05 M e retorno com ZnSO₄ 0,05 M" },
          { k: "t1", r: "EDTA 0,05 M adicionado (t₁: 10 ml; 15 ml se Al₂O₃ > 20 %)", u: "ml" },
          { k: "t2", r: "ZnSO₄ 0,05 M gasto na titulação (t₂)", u: "ml" },
          { calc: "al", r: "% Al₂O₃ = 2,55 (t₁ − t₂) f (5.4)", u: "%", casas: 2, destaque: true },
          { grupo: "Ferro (5.5) — alíquota de 50 ml, dicromato de potássio 0,050 1 N" },
          { k: "n", r: "Dicromato de potássio 0,050 1 N gasto (n)", u: "ml" },
          { calc: "fe", r: "% Fe₂O₃ = n × f (5.5)", u: "%", casas: 2, destaque: true },
          { grupo: "Relações moleculares (6)" },
          { calc: "ki", r: "Ki = (% SiO₂ / 60) / (% Al₂O₃ / 102) (6.1)", u: "", casas: 2 },
          { calc: "kr", r: "Kr = (% SiO₂ / 60) / (% Al₂O₃ / 102 + % Fe₂O₃ / 160) (6.2)", u: "", casas: 2 },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var det = (d.det || []).map(function (x, i) {
        var rot = "Determinação " + (i + 1), o = {};
        var t = num(x.pfT), ar = num(x.pfAr), est = num(x.pfEst);
        o.mAr = ok(t) && ok(ar) ? ar - t : NaN;
        var mEst = ok(t) && ok(est) ? est - t : NaN;
        o.f = ok(o.mAr) && ok(mEst) && mEst > 0 ? o.mAr / mEst : NaN;
        if (ok(o.mAr) && (o.mAr < 9 || o.mAr > 11)) avisos.push(rot + ": " + fmt(o.mAr, 2) + " g de amostra para o fator f — a norma pede quantidade próxima de 10 g (5.1).");
        if (ok(o.f) && o.f < 1) avisos.push(rot + ": f = " + fmt(o.f, 4) + " < 1 (a amostra seca em estufa pesou mais que a seca ao ar) — confira as pesagens.");
        if (ok(o.f) && o.f > 1.2) avisos.push(rot + ": f = " + fmt(o.f, 4) + " — umidade higroscópica acima de 20 %; confira as pesagens.");
        var mAt = num(x.mAt);
        if (ok(mAt) && Math.abs(mAt - 2) > 0.01) avisos.push(rot + ": ataque com " + fmt(mAt, 4) + " g — as fórmulas da norma (200 × p × f; 2,55 (t₁ − t₂) f; n × f) pressupõem 2 g de amostra (5.2); os teores não foram corrigidos.");
        var ct = num(x.cadT), cr = num(x.cadR);
        o.p = ok(ct) && ok(cr) ? cr - ct : NaN;
        if (ok(o.p) && o.p < 0) avisos.push(rot + ": resíduo calcinado negativo — confira as pesagens do cadinho.");
        o.si = ok(o.p) && ok(o.f) ? 200 * o.p * o.f : NaN;
        var t1 = num(x.t1), t2 = num(x.t2);
        o.al = ok(t1) && ok(t2) && ok(o.f) ? 2.55 * (t1 - t2) * o.f : NaN;
        if (ok(t1) && ok(t2) && t2 >= t1) avisos.push(rot + ": ZnSO₄ gasto (t₂) igual ou maior que o EDTA adicionado (t₁) — não houve excesso de EDTA; repita com 15 ml de EDTA.");
        if (ok(o.al) && ok(t1)) {
          if (o.al > 20 && t1 < 15) avisos.push(rot + ": Al₂O₃ = " + fmt(o.al, 2) + " % (> 20 %) com " + fmt(t1, 0) + " ml de EDTA — para teor superior a 20 % a norma manda juntar 15 ml (5.4); repita a titulação.");
          if (o.al <= 20 && t1 > 10) avisos.push(rot + ": Al₂O₃ = " + fmt(o.al, 2) + " % (≤ 20 %) com " + fmt(t1, 0) + " ml de EDTA — a norma indica 10 ml para teores até 20 % (5.4).");
        }
        var n = num(x.n);
        o.fe = ok(n) && ok(o.f) ? n * o.f : NaN;
        o.ki = ki(o.si, o.al);
        o.kr = kr(o.si, o.al, o.fe);
        var soma = o.si + o.al + o.fe;
        if (ok(soma) && soma > 100) avisos.push(rot + ": SiO₂ + Al₂O₃ + Fe₂O₃ = " + fmt(soma, 1) + " % (acima de 100 %) — confira as leituras.");
        return o;
      });
      var si = media(det.map(function (o) { return o.si; })), al = media(det.map(function (o) { return o.al; })), fe = media(det.map(function (o) { return o.fe; }));
      var nDet = det.filter(function (o) { return ok(o.si) && ok(o.al) && ok(o.fe); }).length;
      var res = { si: si, al: al, fe: fe, ki: ki(si, al), kiSimpl: ok(si) && ok(al) && al > 0 ? si / al * 1.7 : NaN, kr: kr(si, al, fe), n: nDet, lateritico: null };
      if (P.criterio === "lat" && ok(res.kr)) {
        res.lateritico = Math.round(res.kr * 100) / 100 < 2;
        if (!res.lateritico) avisos.push("Kr = " + fmt(res.kr, 2) + " (≥ 2): o solo não se enquadra como laterítico para base/sub-base (DNIT 098/2007-ES, 5.1 — relação sílica-sesquióxidos menor que 2).");
      }
      return { tab: { det: det }, resultados: res, avisos: avisos };
    },
    rotuloImportar: function (r) { return "Ki " + fmt(r.ki, 2) + " · Kr " + fmt(r.kr, 2); },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      function cx(v, rot, extra) { return '<div class="fe-res-item"><div class="fe-res-v">' + v + '</div><div class="fe-res-r">' + rot + (extra || "") + "</div></div>"; }
      var lat = r.lateritico === undefined || r.lateritico === null ? "" : r.lateritico ? ' · <span class="fe-ok">laterítico (Kr &lt; 2)</span>' : ' · <span class="fe-nok">não laterítico (Kr ≥ 2)</span>';
      return '<div class="fe-res">' + cx(fmt(r.ki, 2), "Ki — relação molecular sílica-alumina (6.1)") +
        cx(fmt(r.kr, 2), "Kr — relação molecular sílica-sesquióxidos (6.2)", lat) +
        cx(fmt(r.si, 2) + " <small>%</small>", "SiO₂ (5.3)") + cx(fmt(r.al, 2) + " <small>%</small>", "Al₂O₃ (5.4)") +
        cx(fmt(r.fe, 2) + " <small>%</small>", "Fe₂O₃ (5.5) · média de " + r.n + " determinação(ões)") + "</div>";
    },
    relatorio: {
      parametros: [["Ataque", "2 g de amostra seca ao ar (fração < 2 mm) com 50 ml de H₂SO₄ 1:1, fervura de 30 min, filtrado em balão de 250 ml (5.2)"]],
      notas: "f = massa seca ao ar / massa seca em estufa (5.1); % SiO₂ = 200 × p × f (5.3); % Al₂O₃ = 2,55 (t₁ − t₂) f (5.4); % Fe₂O₃ = n × f (5.5); Ki = (% SiO₂ / 60) / (% Al₂O₃ / 102) = 1,7 × % SiO₂ / % Al₂O₃ (6.1); Kr = (% SiO₂ / 60) / (% Al₂O₃ / 102 + % Fe₂O₃ / 160) (6.2). Com mais de uma determinação, Ki e Kr são calculados com a média dos teores (a norma não fixa número de determinações nem arredondamento; relações com duas casas).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Teores (média de " + r.n + " determinação(ões))", "SiO₂ " + fmt(r.si, 2) + " % · Al₂O₃ " + fmt(r.al, 2) + " % · Fe₂O₃ " + fmt(r.fe, 2) + " %"]);
        rows.push(["Relação molecular sílica-alumina (Ki)", fmt(r.ki, 2)]);
        rows.push(["Relação molecular sílica-sesquióxidos (Kr)", fmt(r.kr, 2) +
          (r.lateritico === true ? " — laterítico (Kr < 2, DNIT 098/2007-ES)" : r.lateritico === false ? " — NÃO laterítico (Kr ≥ 2, DNIT 098/2007-ES)" : "")]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Cascalho laterítico para base — duplicata, Kr < 2", dados: function () {
        return { ident: { registro: "EX-KI-001", obra: "Obra A", origem: "Jazida 1", camada: "Base — solo laterítico", data: "2025-09-15" },
          params: { material: "Cascalho laterítico (fração < 2 mm)", preparo: "Seca ao ar, destorroada com rolo de madeira, passante na peneira de 2 mm", criterio: "lat" },
          det: [{ pfT: "25,4312", pfAr: "35,4520", pfEst: "35,1785", mAt: "2,0003", cadT: "18,2150", cadR: "18,2855", t1: "15", t2: "4,2", n: "12,4" },
            { pfT: "24,9876", pfAr: "34,9981", pfEst: "34,7243", mAt: "1,9998", cadT: "17,8842", cadR: "17,9551", t1: "15", t2: "4,3", n: "12,3" }] };
      } },
      { nome: "Argila siltosa saprolítica — Kr ≥ 2, EDTA insuficiente e amostra pequena para f", dados: function () {
        return { ident: { registro: "EX-KI-002", obra: "Obra B", origem: "Jazida 3", camada: "Sub-base (estudo)", data: "2025-10-02" },
          params: { material: "Argila siltosa (fração < 2 mm)", preparo: "Seca ao ar, passante na peneira de 2 mm", criterio: "lat" },
          det: [{ pfT: "25,1020", pfAr: "31,6034", pfEst: "31,5260", mAt: "2,0010", cadT: "18,0544", cadR: "18,2124", t1: "10", t2: "1,8", n: "3,1" }] };
      } },
    ],
  };
})();
