/*
 * Ficha: DNER-ME 383/99 — Desgaste por abrasão de misturas betuminosas com asfalto polímero — ensaio Cantabro.
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  // A = (P − P') / P × 100   (seção 5)
  function desgaste(x) {
    var P = num(x.p), P2 = num(x.p2);
    return ok(P) && ok(P2) && P > 0 ? (P - P2) / P * 100 : NaN;
  }

  FE.FICHAS["dner-me-383-99"] = {
    titulo: "Desgaste por abrasão Cantabro (mistura com asfalto polímero)",
    resumo: "Corpo de prova Marshall no tambor Los Angeles sem esferas, 300 revoluções a 30–33 rpm a 25 °C; A = (P − P') / P × 100, com aproximação de 1 %; resultado: média de três corpos de prova do mesmo teor de betume, cada um dentro de ± 20 % da média.",
    blocos: [],
    params: [
      { k: "mistura", r: "Mistura", ph: "ex.: camada porosa de atrito com asfalto polímero" },
      { k: "ligante", r: "Asfalto polímero", ph: "ex.: AMP 60/85" },
      { k: "teor", r: "Teor de betume (%)", dica: "os três CPs devem ter o mesmo teor (seção 6)" },
      { k: "temp", r: "Temperatura de ensaio (°C)", ph: "25", dica: "4 c: 25 °C" },
      { k: "rev", r: "Revoluções do tambor", ph: "300", dica: "4 c: 300 revoluções" },
      { k: "rpm", r: "Velocidade (rpm)", ph: "30 a 33", dica: "4 c: 30 a 33 rpm" },
      { k: "limite", r: "Desgaste máximo admitido (%) — opcional", dica: "DNER-ES 386/99 (camada porosa de atrito): Cantabro ≤ 25 %" },
    ],
    padrao: {},
    rotuloImportar: function (r) { return "Cantabro " + (ok(r.a) ? fmt(r.a, 0) + " %" : "—"); },
    tabelas: function () {
      return [{
        chave: "cp", titulo: "Corpos de prova Marshall (seções 3 e 4)", rotulo: "CP", iniciais: 3, min: 1,
        dica: "pesagem com resolução de 1 g",
        linhas: [
          { k: "id", r: "Identificação do CP", texto: true },
          { k: "p", r: "Massa antes do ensaio (P) — 4 a", u: "g" },
          { k: "p2", r: "Massa após 300 revoluções (P') — 4 d", u: "g" },
          { calc: "ax", r: "A = (P − P') / P × 100 (seção 5)", u: "%", casas: 1 },
          { calc: "a", r: "A com aproximação de 1 %", u: "%", casas: 0, destaque: true },
          { calc: "desv", r: "Diferença em relação à média", u: "%", casas: 1 },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var vals = (d.cp || []).map(desgaste);
      var m = media(vals);
      var cps = vals.map(function (v, i) {
        var desv = ok(v) && ok(m) && m > 0 ? (v - m) / m * 100 : NaN;
        var x = (d.cp || [])[i] || {};
        if (ok(num(x.p)) && ok(num(x.p2)) && num(x.p2) > num(x.p)) avisos.push("CP " + (i + 1) + ": massa após o ensaio maior que a inicial — confira.");
        if (ok(desv) && Math.abs(desv) > 20) avisos.push("CP " + (i + 1) + ": desgaste de " + fmt(v, 1) + " % difere " + fmt(desv, 1) + " % da média — os valores individuais não devem diferir de ± 20 % do valor médio (seção 6).");
        return { ax: v, a: ok(v) ? Math.round(v) : NaN, desv: desv };
      });
      var n = vals.filter(ok).length;
      if (n && n !== 3) avisos.push("O resultado é a média aritmética de três ensaios (seção 6); há " + n + ".");
      var t = num(P.temp), rev = num(P.rev), rpm = num(P.rpm);
      if (ok(t) && Math.abs(t - 25) > 0.5) avisos.push("Temperatura de ensaio de " + fmt(t, 1) + " °C; a norma fixa 25 °C (4 c).");
      if (ok(rev) && rev !== 300) avisos.push("Foram " + fmt(rev, 0) + " revoluções; a norma fixa 300 (4 c).");
      if (ok(rpm) && (rpm < 30 || rpm > 33)) avisos.push("Velocidade de " + fmt(rpm, 1) + " rpm fora de 30 a 33 rpm (4 c).");
      var final = ok(m) ? Math.round(m) : NaN, lim = num(P.limite);
      if (ok(final) && ok(lim) && final > lim) avisos.push("Desgaste Cantabro de " + final + " %, acima do máximo admitido de " + fmt(lim, 0) + " %.");
      return { tab: { cp: cps }, resultados: { a: final, aExato: m, n: n, limite: lim, conforme: ok(final) && ok(lim) ? final <= lim : null }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + (ok(r.a) ? r.a : "—") + ' <small>%</small></div>' +
        '<div class="fe-res-r">Desgaste Cantabro — média de ' + r.n + " CP(s)" + (ok(r.aExato) ? " (" + fmt(r.aExato, 1) + " %)" : "") +
        (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>') + "</div></div></div>";
    },
    relatorio: {
      notas: "A = (P − P') / P × 100 (seção 5), P = massa do CP Marshall antes do ensaio e P' = após 300 revoluções no tambor Los Angeles sem carga abrasiva, a 30–33 rpm e 25 °C (4 a–d). Resultado: média aritmética de três CPs do mesmo teor de betume, com aproximação de 1 %; valores individuais dentro de ± 20 % do valor médio (seção 6), interpretado como diferença relativa à média.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.mistura) rows.push(["Mistura", P.mistura + (P.teor ? " — teor de betume " + P.teor + " %" : "")]);
        rows.push(["Desgaste por abrasão Cantabro (A)", (ok(r.a) ? r.a + " %" : "—") + " — média de " + r.n + " CPs" +
          (r.conforme === null ? "" : r.conforme ? " — atende ao máximo de " + fmt(r.limite, 0) + " %" : " — NÃO ATENDE ao máximo de " + fmt(r.limite, 0) + " %")]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Camada porosa de atrito — três CPs (atende a 25 %)", dados: function () {
        return { ident: { registro: "EX-CAN-001", obra: "Obra A", trecho: "BR-000, km 10 ao km 12", camada: "Camada porosa de atrito" },
          params: { mistura: "Camada porosa de atrito com asfalto polímero", ligante: "AMP 60/85", teor: "4,5", temp: "25", rev: "300", rpm: "31", limite: "25" },
          cp: [{ id: "CP-1", p: "1052", p2: "878" }, { id: "CP-2", p: "1047", p2: "861" }, { id: "CP-3", p: "1058", p2: "890" }] };
      } },
      { nome: "Teor baixo de betume — CP disperso e média acima de 25 %", dados: function () {
        return { ident: { registro: "EX-CAN-002", obra: "Obra B", camada: "Camada porosa de atrito" },
          params: { mistura: "Camada porosa de atrito com asfalto polímero", ligante: "AMP 60/85", teor: "3,5", temp: "25", rev: "300", rpm: "34", limite: "25" },
          cp: [{ id: "CP-1", p: "1041", p2: "771" }, { id: "CP-2", p: "1036", p2: "690" }, { id: "CP-3", p: "1049", p2: "812" }] };
      } },
    ],
  };
})();
