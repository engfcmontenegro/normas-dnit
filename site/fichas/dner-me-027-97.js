/*
 * Ficha: DNER-ME 027/97 — Pigmentos — grau de dispersão no veículo de tinta para demarcação viária (fineza de moagem).
 * Usa FE.sinalizacao (definido em dner-me-018-94.js).
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  // Tabela — Equivalência de escalas (3.1.1.1): Hegman × micrômetros
  var EQ = [[0, 100], [1, 90], [2, 75], [3, 65], [4, 50], [5, 40], [6, 25], [7, 15], [8, 0]];
  function umParaH(um) { return FE.interpolar(EQ.map(function (x) { return [x[1], x[0]]; }).reverse(), um); }
  function hParaUm(h) { return FE.interpolar(EQ, h); }

  FE.FICHAS["dner-me-027-97"] = {
    titulo: "Tinta para demarcação viária — grau de dispersão (fineza de moagem)",
    resumo: "Bloco medidor com dois sulcos de profundidade decrescente e cunha; leitura onde começa a maior concentração de partículas/aglomerados, a 20°–30°; média das duas últimas leituras, arredondada para a divisão de 10 µm imediatamente superior (5.7, 5.8 e 6.1).",
    blocos: [],
    params: S.paramsTinta().concat([
      { k: "escala", r: "Escala lida no aparelho", tipo: "select", recarrega: true,
        opcoes: [["um", "Micrômetros (µm)"], ["H", "Unidades Hegman"]] },
    ]).concat(S.paramsEspec("finura")),
    padrao: { cor: "branca", espec: "", escala: "um" },
    tabelas: function (d) {
      var H = (d.params || {}).escala === "H";
      return [{ chave: "leit", titulo: "Leituras (5.6 e 5.7)", rotulo: "Leitura", iniciais: 3, min: 2,
        dica: "a primeira é o ensaio inicial de orientação; o resultado usa as duas últimas leituras",
        linhas: [
          { k: "v", r: "Grau de dispersão lido", u: H ? "Hegman" : "µm" },
          { calc: H ? "um" : "h", r: H ? "Equivalente em micrômetros (Tabela)" : "Equivalente Hegman (Tabela)", u: H ? "µm" : "Hegman", casas: 1 },
        ] }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], H = P.escala === "H";
      var tab = (d.leit || []).map(function (p) {
        var v = num(p.v);
        return H ? { v: v, um: hParaUm(v) } : { v: v, h: umParaH(v) };
      });
      var vs = tab.filter(function (o) { return ok(o.v); });
      var r = { escala: H ? "H" : "um", lim: S.limite("finura", P) };
      if (vs.length < 2) {
        if (vs.length) avisos.push("Repita o ensaio: o resultado é a média das duas últimas leituras (5.7).");
      } else {
        var a = vs[vs.length - 2], b = vs[vs.length - 1];
        var umA = H ? a.um : a.v, umB = H ? b.um : b.v;
        r.mediaLida = (a.v + b.v) / 2;
        r.umMedia = (umA + umB) / 2;
        // 5.8: entre duas divisões de 10 µm, aproxima-se para a imediatamente superior
        r.um = H ? r.umMedia : Math.ceil(r.umMedia / 10 - 1e-9) * 10;
        r.H = H ? r.mediaLida : umParaH(r.um);
        r.desvio = Math.abs(umA - umB) / 2;
        if (r.desvio > 10 + 1e-9) avisos.push("As duas últimas leituras diferem " + fmt(Math.abs(umA - umB), 0) + " µm (±" + fmt(r.desvio, 0) + " µm em torno da média): acima de ±10 µm (6.2) — repita as leituras.");
      }
      if (vs.some(function (o) { return H ? o.v < 0 || o.v > 8 : o.v < 0 || o.v > 100; })) avisos.push("Leitura fora da escala da Tabela (0 a 100 µm / 0 a 8 Hegman).");
      r.conforme = S.confere(r.H, r.lim);
      S.avisoLimite(avisos, "Finura de moagem", r.H, r.lim, "Hegman", 1);
      return { tab: { leit: tab }, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      var lim = r.lim ? " · exigido " + esc(S.textoLimite(r.lim, "Hegman", 0)) + " " + S.selo(r.conforme) : "";
      return '<div class="fe-res">' +
        S.itemRes(fmt(r.um, r.escala === "H" ? 1 : 0) + " <small>µm</small>", "Grau de dispersão" + (r.escala === "um" ? " — média das duas últimas leituras (" + fmt(r.umMedia, 1) + " µm) arredondada para a divisão superior (5.8)" : " — equivalente da média em Hegman")) +
        S.itemRes(fmt(r.H, 1) + " <small>Hegman</small>", (r.escala === "H" ? "Média das duas últimas leituras" : "Equivalente pela Tabela de escalas") + lim, r.lim ? "" : "fe-res-p") + "</div>";
    },
    relatorio: {
      notas: "Resultado: média das duas últimas leituras (5.7); em micrômetros, quando entre duas divisões de 10 µm, aproxima-se para a imediatamente superior (5.8). Conversão µm ↔ Hegman pela Tabela de equivalência de escalas (3.1.1.1), com interpolação linear. Tolerância ±10 µm (6.2) verificada como a meia-diferença entre as duas últimas leituras. A DNER-EM 276/00 exige finura de moagem ≥ 4 Hegman.",
      resultados: function (calc, d) {
        var r = calc.resultados;
        return S.linhaTinta(d.params).concat([["Grau de dispersão", (ok(r.um) ? fmt(r.um, r.escala === "H" ? 1 : 0) + " µm" : "—") + " — " + (ok(r.H) ? fmt(r.H, 1) + " Hegman" : "—") +
          (r.lim ? " — " + S.parecer("", r.H, r.lim, "Hegman", 0) : "")]]);
      },
    },
    exemplos: [
      { nome: "Tinta acrílica emulsionada, branca — 40 µm / 5 Hegman (atende)", dados: function () {
        return { ident: { registro: "EX-TS-027-1", obra: "Obra A", origem: "Fornecedor C" },
          params: { tinta: "Acrílica emulsionada em água", cor: "branca", lote: "0102", espec: "em276", escala: "um" },
          leit: [{ v: "45" }, { v: "38" }, { v: "36" }] };
      } },
      { nome: "Tinta acrílica emulsionada, amarela — 3 Hegman, moagem grossa (reprovada)", dados: function () {
        return { ident: { registro: "EX-TS-027-2", obra: "Obra B", origem: "Fornecedor C" },
          params: { tinta: "Acrílica emulsionada em água", cor: "amarela", lote: "0103", espec: "em276", escala: "H" },
          leit: [{ v: "3" }, { v: "3" }, { v: "3" }] };
      } },
    ],
  };
})();
