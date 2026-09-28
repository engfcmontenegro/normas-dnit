/*
 * Ficha: DNIT 069/2005-ME — Material termoplástico — Resistência ao óleo diesel.
 * Registra-se no motor de site/fichas.js (window.FE); usa o código comum de FE.sinalizacao2 (dner-me-011-94.js).
 *
 * Procedimento A (pó): ~300 g aquecidos a 180 °C (amarelo) ou 200 °C (branco), estendidos com extensor de 3 mm sobre
 * no mínimo três placas revestidas de papel alumínio, 3 h a (25 ± 2) °C. Procedimento B (barra): no mínimo três pedaços.
 * Gotas de óleo diesel; de hora em hora, durante 6 h, pressão com o polegar: qualquer desprendimento → não resistente (6).
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao2, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var HORAS = [1, 2, 3, 4, 5, 6];
  // S = houve desprendimento; N = não houve
  function sn(v) {
    var s = String(v || "").trim().toLowerCase();
    if (!s) return null;
    if (/^(s|sim|d|desp)/.test(s)) return true;
    if (/^(n|n[aã]o|-)/.test(s)) return false;
    return undefined;
  }
  function condA(P) {
    var t = P.cor === "amarelo" ? 180 : 200;
    return [
      { k: "massa", r: "Massa de material aquecida (5.1 — aprox. 300 g)", u: "g", min: 270, max: 330, casas: 0 },
      { k: "tAq", r: "Temperatura de aquecimento (5.1 — " + t + " °C)", u: "°C", min: t * 0.99, max: t * 1.01, casas: 0 },
      { k: "extensor", r: "Abertura do extensor (4.2 — 3 mm)", u: "mm", min: 2.97, max: 3.03, casas: 2 },
      { k: "tResfr", r: "Temperatura de resfriamento (5.1 — 25 ± 2 °C)", u: "°C", min: 23, max: 27, casas: 0 },
      { k: "resfr", r: "Tempo de resfriamento, horizontal, sem poeira nem luz direta (5.1 — mín. 3 h)", u: "h", min: 3, casas: 1 },
    ];
  }

  FE.FICHAS["dnit-069-2005-me"] = {
    titulo: "Material termoplástico — resistência ao óleo diesel",
    resumo: "Película (procedimento A, pó) ou pedaços da barra (procedimento B) com gotas de óleo diesel; de hora em hora, por 6 h, pressão com o polegar: satisfatório (resistente) se não houver desprendimento em nenhuma observação (6).",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: termoplástico branco em pó" },
      { k: "proc", r: "Procedimento (5)", tipo: "select", recarrega: true,
        opcoes: [["A", "A — material em pó (placas de alumínio)"], ["B", "B — material em barra (pedaços)"]] },
      { k: "cor", r: "Cor do material", tipo: "select", recarrega: true, opcoes: [["branco", "Branco — aquecer a 200 °C"], ["amarelo", "Amarelo — aquecer a 180 °C"]] },
    ].concat(condA({}).map(function (c) {
      // condições do procedimento A registradas nos parâmetros (a temperatura prescrita depende da cor)
      return { k: c.k, r: c.r.replace("200 °C)", "180 °C amarelo / 200 °C branco)") + " — registrado", se: function (d) { return (d.params || {}).proc !== "B"; } };
    }), [{ k: "espec", r: "Especificação para comparação — opcional", tipo: "select",
      opcoes: [["", "— sem comparação —"], ["372", "DNER-EM 372/2000 — 4.6: deve ser resistente à ação do óleo diesel"]] }]),
    padrao: { proc: "A", cor: "branco", espec: "" },
    tabelas: function (d) {
      var B = (d.params || {}).proc === "B";
      return [{
        chave: "cp", titulo: B ? "Pedaços da barra (5.2)" : "Placas (5.1)", rotulo: B ? "Pedaço" : "Placa", iniciais: 3, min: 3,
        dica: "S = houve desprendimento de material no polegar; N = não houve (5.1). Mínimo de três " + (B ? "pedaços, na parte lisa e na porosa (5.2)" : "placas (4.1)"),
        linhas: HORAS.map(function (h) { return { k: "h" + h, r: "Desprendimento após " + h + " h de ação do óleo (S/N)", texto: true, ph: "S / N" }; })
          .concat([{ calc: "nd", r: "Observações com desprendimento", u: "", casas: 0, destaque: true }]),
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], A = P.proc !== "B";
      if (A) condA(P).forEach(function (c) { var a = S.condicao(c, num(P[c.k])); if (a) avisos.push(a); });
      var desp = 0, reg = 0, invalid = 0, usados = 0, primeira = null;
      var cps = (d.cp || []).map(function (x, i) {
        var nd = 0, n = 0;
        HORAS.forEach(function (h) {
          var v = sn(x["h" + h]);
          if (v === undefined) { invalid++; return; }
          if (v === null) return;
          n++;
          if (v) { nd++; if (!primeira || h < primeira.h) primeira = { h: h, cp: i + 1 }; }
        });
        if (n) usados++;
        desp += nd; reg += n;
        return { nd: n ? nd : NaN };
      });
      var total = (d.cp || []).length * HORAS.length;
      if (invalid) avisos.push("Há " + invalid + " registro(s) que não são S nem N — corrija.");
      if (usados && usados < 3) avisos.push("Foram registrados " + usados + " corpo(s) de prova; a norma pede no mínimo três (" + (A ? "4.1" : "5.2") + ").");
      var satisf = desp ? false : reg && reg >= Math.max(total, 18) && usados >= 3 ? true : null;
      if (!desp && reg && satisf === null) avisos.push("Registre as seis observações horárias de todos os corpos de prova (5.1) para concluir.");
      if (desp) avisos.unshift("Houve desprendimento de material no polegar (" + desp + " observação(ões); a primeira após " + primeira.h + " h, " + (A ? "placa " : "pedaço ") + primeira.cp + "): material não resistente ao óleo diesel (6).");
      var conf = P.espec === "372" && satisf !== null ? satisf : null;
      return { tab: { cp: cps }, resultados: { satisf: satisf, desp: desp, reg: reg, total: total, primeira: primeira, conforme: conf, proc: A ? "A" : "B" }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res">' + S.card(S.parecerHtml(r.satisf), r.satisf === null ? "Resultado" : r.satisf ? "Resistente ao óleo diesel" : "Não resistente ao óleo diesel", true) +
        S.card(r.reg + " / " + r.total, "Observações registradas" + (r.desp ? " — " + r.desp + " com desprendimento" : "")) +
        (r.conforme === null ? "" : S.card(r.conforme ? '<span class="fe-ok">atende</span>' : '<span class="fe-nok">não atende</span>', "DNER-EM 372/2000, 4.6")) + "</div>";
    },
    relatorio: {
      notas: "Satisfatório se não houver desprendimento do material termoplástico em nenhuma observação durante as seis horas: o material é resistente ao óleo diesel; havendo desprendimento, não satisfatório — não resistente (6). " +
        "Procedimento A para material em pó, B para material em barra (5). Condições sem tolerância na norma: temperatura de aquecimento com aviso acima de 1 %, massa \"aproximada\" com aviso acima de 10 %, tempo de resfriamento como mínimo.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Procedimento", r.proc === "A" ? "A — material em pó" : "B — material em barra"]);
        rows.push(["Observações", r.reg + " de " + r.total + " registradas; " + (r.desp ? r.desp + " com desprendimento (primeira após " + r.primeira.h + " h)" : "nenhuma com desprendimento")]);
        rows.push(["Resultado", S.parecerTxt(r.satisf) + (r.satisf === null ? "" : r.satisf ? " — resistente ao óleo diesel" : " — não resistente ao óleo diesel")]);
        if (P.espec === "372") rows.push(["Especificação", "DNER-EM 372/2000, 4.6" + S.sitTxt(r.conforme)]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Termoplástico branco em pó (A) — sem desprendimento", dados: function () {
        var n = {}; HORAS.forEach(function (h) { n["h" + h] = "N"; });
        return { ident: { registro: "EX-TP069-01", data: "2026-04-20", obra: "Obra A", local: "Partida 115", origem: "Fornecedor D", camada: "Termoplástico branco (pó)" },
          params: { material: "Termoplástico branco em pó", proc: "A", cor: "branco", massa: "300", tAq: "200", extensor: "3,00", tResfr: "25", resfr: "3", espec: "372" },
          cp: [Object.assign({}, n), Object.assign({}, n), Object.assign({}, n)] };
      } },
      { nome: "Termoplástico amarelo em barra (B) — desprendeu na 3ª hora (reprovado)", dados: function () {
        return { ident: { registro: "EX-TP069-02", data: "2026-04-21", obra: "Obra B", local: "Partida 88", origem: "Fornecedor E", camada: "Termoplástico amarelo (barra)" },
          params: { material: "Termoplástico amarelo em barra", proc: "B", cor: "amarelo", espec: "372" },
          cp: [{ h1: "N", h2: "N", h3: "N", h4: "S", h5: "S", h6: "S" }, { h1: "N", h2: "N", h3: "S", h4: "S", h5: "S", h6: "S" },
            { h1: "N", h2: "N", h3: "N", h4: "N", h5: "S", h6: "S" }] };
      } },
    ],
  };
})();
