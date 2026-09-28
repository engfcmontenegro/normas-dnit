/*
 * Ficha: DNER-ME 087/94 — Solos — Fatores de contração (limite de contração, razão de contração, mudança volumétrica).
 * Pastilha de solo moldada em massa fluida (fração < 0,42 mm), seca em estufa; volume seco pelo mercúrio deslocado.
 * LC = (Vs / Ps × μa − 1 / δ) × 100; RC = Ps / Vs; MV = (h1 − LC) × RC (7.1 a 7.3). Registra-se em window.FE.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var RHO_HG = 13.546;  // g/cm³ a 20 °C (só para a alternativa de volume pela massa de mercúrio)

  FE.FICHAS["dner-me-087-94"] = {
    titulo: "Solos — Fatores de contração (LC, RC e mudança volumétrica)",
    resumo: "Cerca de 50 g da fração < 0,42 mm (DNER-ME 041) em massa fluida na cápsula de contração, seca ao ar e em estufa; Ps pesado a 0,01 g e Vs pelo mercúrio deslocado; LC = (Vs / Ps × μa − 1/δ) × 100, RC = Ps / Vs e MV = (h1 − LC) × RC (7).",
    blocos: [],
    rotuloImportar: function (r) { return "LC " + (ok(r.LC) ? fmt(r.LC, 1) : "—") + " % · RC " + (ok(r.RC) ? fmt(r.RC, 2) : "—"); },
    params: [
      { k: "importarD", r: "Densidade real δ: buscar ensaio salvo (DNER-ME 093/94)", tipo: "importar", de: "dner-me-093-94",
        aplicar: function (e, P) {
          var r = e.resultados || {}, i = (e.dados || {}).ident || {};
          if (ok(r.D20)) P.delta = fmt(r.D20, 2);
          P.deltaRef = (i.registro || "") + (i.origem ? " · " + i.origem : "");
        } },
      { k: "delta", r: "Densidade real do solo δ (7.1)", ph: "ex.: 2,68", dica: "DNER-ME 093/94 (picnômetro)" },
      { k: "deltaRef", r: "Ensaio de densidade real de referência" },
      { k: "mua", r: "Massa específica da água μa (g/cm³)", ph: "1,000", dica: "7.1; ≈ 0,998 a 20 °C e 0,997 a 25 °C" },
      { k: "importarLL", r: "h1 = limite de liquidez: buscar ensaio salvo (DNER-ME 122/94) — opcional", tipo: "importar", de: "dner-me-122-94",
        aplicar: function (e, P) {
          var r = e.resultados || {}, i = (e.dados || {}).ident || {};
          if (!r.np && ok(r.LL)) { P.h1 = String(r.LL); P.h1Ref = "LL — " + (i.registro || "") + (i.origem ? " · " + i.origem : ""); }
        } },
      { k: "h1", r: "Teor de água h1 para a mudança volumétrica (%) — opcional", ph: "ex.: 45", dica: "7.3: teor de umidade de partida (ex.: LL ou umidade de campo); MV = (h1 − LC) × RC" },
      { k: "h1Ref", r: "Origem de h1", ph: "ex.: LL, umidade natural" },
      { k: "volume", r: "Volume da pastilha seca", tipo: "select", recarrega: true,
        opcoes: [["proveta", "Mercúrio deslocado medido na proveta (6.5.2)"], ["massa", "Massa do mercúrio deslocado ÷ 13,546 g/cm³ (alternativa, fora do texto da norma)"]] },
    ],
    padrao: { volume: "proveta", mua: "1,000" },
    tabelas: function (d) {
      var massa = (d.params || {}).volume === "massa";
      var linhas = [
        { k: "cap", r: "Cápsula de contração nº", texto: true },
        { grupo: "Peso do solo seco — pastilha seca ao ar e em estufa 105–110 °C até constância (6.3 e 6.4)" },
        { k: "tara", r: "Cápsula de contração (tara)", u: "g" },
        { k: "cs", r: "Cápsula + pastilha seca", u: "g" },
        { calc: "Ps", r: "Peso da pastilha seca Ps (± 0,01 g)", u: "g", casas: 2 },
        { grupo: "Volume da pastilha seca — imersão no mercúrio com a placa de três pinos (6.5)" },
      ];
      if (massa) linhas.push({ k: "mHg", r: "Massa do mercúrio deslocado", u: "g" });
      else linhas.push({ k: "vHg", r: "Volume do mercúrio deslocado, lido na proveta (0,2 ml)", u: "cm³" });
      linhas.push({ calc: "Vs", r: "Volume da pastilha seca Vs", u: "cm³", casas: 2 },
        { grupo: "Fatores de contração (7)" },
        { calc: "LC", r: "LC = (Vs / Ps × μa − 1 / δ) × 100 (7.1)", u: "%", casas: 1, destaque: true },
        { calc: "RC", r: "RC = Ps / Vs (7.2)", u: "", casas: 2, destaque: true },
        { calc: "MV", r: "MV = (h1 − LC) × RC (7.3)", u: "%", casas: 1 });
      return [{ chave: "past", titulo: "Pastilhas", rotulo: "Pastilha", iniciais: 1, min: 1, usar: true, linhas: linhas,
        dica: "uma coluna por pastilha (a norma descreve uma; com mais de uma o resultado é a média das marcadas)" }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], massa = P.volume === "massa";
      var delta = num(P.delta), mua = ok(num(P.mua)) ? num(P.mua) : 1, h1 = num(P.h1);
      if (!ok(delta)) avisos.push("Informe a densidade real do solo δ (DNER-ME 093/94) para calcular o limite de contração (7.1).");
      else if (delta < 2.2 || delta > 3.2) avisos.push("δ = " + fmt(delta, 2) + " — valor incomum para solos; confira.");
      if (ok(num(P.mua)) && (mua < 0.99 || mua > 1.001)) avisos.push("μa = " + fmt(mua, 3) + " g/cm³ — confira a massa específica da água.");
      if (massa) avisos.push("Volume da pastilha pela massa de mercúrio (÷ 13,546 g/cm³): a norma mede o volume do mercúrio deslocado na proveta (6.5.2) — registre a alternativa nas observações.");
      var past = (d.past || []).map(function (x, i) {
        var rot = "Pastilha " + (i + 1), o = { usar: x.usar !== false };
        var t = num(x.tara), cs = num(x.cs);
        o.Ps = ok(t) && ok(cs) ? cs - t : NaN;
        o.Vs = massa ? (ok(num(x.mHg)) ? num(x.mHg) / RHO_HG : NaN) : num(x.vHg);
        o.LC = ok(o.Ps) && ok(o.Vs) && o.Ps > 0 && ok(delta) ? (o.Vs / o.Ps * mua - 1 / delta) * 100 : NaN;
        o.RC = ok(o.Ps) && ok(o.Vs) && o.Vs > 0 ? o.Ps / o.Vs : NaN;
        o.MV = ok(h1) && ok(o.LC) && ok(o.RC) ? (h1 - o.LC) * o.RC : NaN;
        if (ok(o.Ps) && o.Ps <= 0) avisos.push(rot + ": peso da pastilha seca não é positivo — confira as pesagens.");
        if (ok(o.Vs) && !massa && o.Vs > 25) avisos.push(rot + ": " + fmt(o.Vs, 1) + " cm³ — acima da capacidade da proveta de 25 ml (4 g).");
        if (ok(o.LC) && o.LC < 0) avisos.push(rot + ": LC negativo (" + fmt(o.LC, 1) + " %) — Vs / Ps menor que 1/δ; a pastilha não pode ter volume menor que o dos grãos: confira Vs, Ps e δ.");
        if (ok(o.RC) && ok(delta) && o.RC > delta) avisos.push(rot + ": RC = " + fmt(o.RC, 2) + " maior que δ — incoerente; confira Vs e Ps.");
        if (ok(o.MV) && o.MV < 0) avisos.push(rot + ": h1 (" + fmt(h1, 1) + " %) é menor que o LC (" + fmt(o.LC, 1) + " %) — abaixo do limite de contração não há mudança de volume (3.1); MV negativo não tem significado.");
        return o;
      });
      var us = past.filter(function (o) { return o.usar; });
      function m(k) { return media(us.map(function (o) { return o[k]; })); }
      var res = { LC: m("LC"), RC: m("RC"), MV: m("MV"), Ps: m("Ps"), Vs: m("Vs"), n: us.filter(function (o) { return ok(o.LC); }).length, h1: h1, delta: delta };
      var lcs = us.map(function (o) { return o.LC; }).filter(ok);
      if (lcs.length >= 2) {
        res.amp = Math.max.apply(null, lcs) - Math.min.apply(null, lcs);
        if (res.amp > 2) avisos.push("Os limites de contração das pastilhas diferem " + fmt(res.amp, 1) + " pontos percentuais — verifique bolhas de ar na moldagem (6.2) ou ar sob a placa na imersão (6.5.2). A norma não fixa tolerância.");
      }
      return { tab: { past: past }, resultados: res, avisos: avisos };
    },
    resultadosHtml: function (calc, d) {
      var r = calc.resultados, P = d.params || {};
      function cx(v, u, rot) { return '<div class="fe-res-item"><div class="fe-res-v">' + v + (u ? " <small>" + u + "</small>" : "") + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      return '<div class="fe-res">' + cx(fmt(r.LC, 1), "%", "Limite de contração LC (7.1)" + (r.n > 1 ? " — média de " + r.n + " pastilhas" : "")) +
        cx(fmt(r.RC, 2), "", "Razão de contração RC = Ps / Vs (7.2)") +
        cx(ok(r.MV) ? fmt(r.MV, 1) : "—", ok(r.MV) ? "%" : "", "Mudança volumétrica MV (7.3)" + (ok(r.h1) ? " — de h1 = " + fmt(r.h1, 1) + " %" + (P.h1Ref ? " (" + esc(P.h1Ref) + ")" : "") : " — informe h1")) + "</div>";
    },
    relatorio: {
      parametros: [["Amostra", "Cerca de 50 g passando na peneira de 0,42 mm, preparada conforme a DNER-ME 041/94 (5); cápsula de contração Ø ≈ 4 cm × 1 cm untada com vaselina, 3 camadas de massa fluida (6.2)"]],
      notas: "LC = (Vs / Ps × μa − 1 / δ) × 100 (7.1); RC = Ps / Vs (7.2); MV = (h1 − LC) × RC (7.3), com h1 = teor de água considerado. A norma não fixa o arredondamento: LC e MV com uma casa, RC com duas. RC = Ps / Vs é numericamente a massa específica aparente seca da pastilha em g/cm³ (a norma não divide por μa).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        rows.push(["Limite de contração (LC)", fmt(r.LC, 1) + " %" + (r.n > 1 ? " (média de " + r.n + " pastilhas)" : "")]);
        rows.push(["Razão de contração (RC)", fmt(r.RC, 2)]);
        rows.push(["Mudança volumétrica (MV)", ok(r.MV) ? fmt(r.MV, 1) + " % — a partir de h1 = " + fmt(r.h1, 1) + " %" + (P.h1Ref ? " (" + P.h1Ref + ")" : "") : "— (h1 não informado)"]);
        rows.push(["Densidade real δ adotada", ok(r.delta) ? fmt(r.delta, 2) + (P.deltaRef ? " (" + P.deltaRef + ")" : "") : "—"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Argila de subleito — duas pastilhas, MV a partir do LL", dados: function () {
        return { ident: { registro: "EX-LC-101", obra: "Obra A", local: "Est. 120", origem: "Corte 2", camada: "Subleito — argila", data: "2025-09-18" },
          params: { delta: "2,68", deltaRef: "EX-DR-001", mua: "1,000", h1: "48", h1Ref: "LL (DNER-ME 122)", volume: "proveta" },
          past: [{ usar: true, cap: "C-3", tara: "12,35", cs: "29,17", vHg: "9,6" }, { usar: true, cap: "C-5", tara: "11,98", cs: "29,03", vHg: "9,8" }] };
      } },
      { nome: "Silte arenoso — volume pela massa de mercúrio, h1 abaixo do LC", dados: function () {
        return { ident: { registro: "EX-LC-102", obra: "Obra B", origem: "Jazida 2", camada: "Sub-base (estudo)", data: "2025-10-09" },
          params: { delta: "2,70", mua: "0,997", h1: "18", h1Ref: "umidade natural", volume: "massa" },
          past: [{ usar: true, cap: "C-1", tara: "12,10", cs: "30,50", mHg: "150,0" }, { usar: true, cap: "C-2", tara: "12,44", cs: "30,61", mHg: "157,9" }] };
      } },
    ],
  };
})();
