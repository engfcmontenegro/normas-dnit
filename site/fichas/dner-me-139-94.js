/*
 * Ficha: DNER-ME 139/94 — Tinta para demarcação viária — determinação da aderência.
 * Usa FE.sinalizacao.fichaQualitativa (definida em dner-me-018-94.js).
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao, C = S.COND, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  FE.FICHAS["dner-me-139-94"] = S.fichaQualitativa({
    titulo: "Tinta para demarcação viária — aderência",
    nomeResultado: "Aderência",
    resumo: "Película úmida de 0,38 mm em placa de alumínio; 72 h a 25 °C; 24 h em água destilada; 2 h ao ar; dois cortes paralelos a 25,4 mm, fita adesiva aplicada transversalmente e arrancada: destaque ≤ 15 % da área de ensaio = satisfatório (seção 6).",
    chave: "aderencia",
    condicoes: [
      C.espessura("5.2"),
      C.temp("tseca", "Temperatura de secagem", 25, 2, "5.3"),
      C.duracao("hseca", "Tempo de secagem na horizontal", 72, "5.3"),
      C.temp("tag", "Temperatura da água destilada", 25, 2, "5.4"),
      C.duracao("hima", "Tempo de imersão", 24, "5.4"),
      C.duracao("har", "Secagem ao ar após a imersão", 2, "5.5"),
      { k: "sep", r: "Separação entre os cortes — 25,4 mm (5.6)", u: "mm", cs: 1 },
      { k: "larg", r: "Largura da fita adesiva — ≈ 25,4 mm (3 c)", u: "mm", cs: 1 },
    ],
    grupoObs: "",
    observacoes: [],
    linhasExtra: [
      { grupo: "Exame da área de ensaio após o arrancamento da fita (5.8)" },
      { calc: "area", r: "Área de ensaio = separação × largura da fita", u: "mm²", casas: 0 },
      { k: "dest", r: "Área destacada (medida)", u: "mm²" },
      { k: "pct", r: "…ou destaque estimado visualmente", u: "%" },
      { calc: "destaque", r: "Destaque = área destacada / área de ensaio × 100 (6)", u: "%", casas: 1, destaque: true },
    ],
    faltaExtra: "a área destacada (mm²) ou o destaque estimado (%)",
    calc: function (p, o, rot, avisos, defeitos) {
      var sep = num(p.sep), larg = num(p.larg);
      if (!ok(sep)) sep = 25.4;
      if (!ok(larg)) larg = 25.4;
      o.area = sep * larg;
      var dest = num(p.dest), pct = num(p.pct);
      o.destaque = ok(dest) ? dest / o.area * 100 : pct;
      if (ok(num(p.sep)) && Math.abs(num(p.sep) - 25.4) > 0.5) avisos.push(rot + ": cortes separados de " + fmt(num(p.sep), 1) + " mm; a norma prescreve 25,4 mm (5.6).");
      if (!ok(o.destaque)) return "falta";
      if (o.destaque > 100 || o.destaque < 0) avisos.push(rot + ": destaque fora de 0 a 100 % — confira.");
      if (o.destaque > 15) defeitos.push("destaque de " + fmt(o.destaque, 1) + " % (> 15 %)");
    },
    relExtra: function (calc) {
      var v = calc.tab.cps.filter(function (o) { return ok(o.destaque); }).map(function (o) { return fmt(o.destaque, 1) + " %"; });
      return v.length ? [["Destaque da película (limite 15 %)", v.join("; ")]] : [];
    },
    notas: "Fita adesiva de ≈ 25,4 mm (adesão 1,1 kgf/25 mm; tração 44 kgf/25 mm; espessura 0,255 mm), arrancada com movimento brusco. Área de ensaio: a confinada entre os dois cortes e a fita. Destaque ≤ 15 % da área de ensaio → satisfatório; > 15 % → não satisfatório (6.1 e 6.2). Sem valores medidos, a área de ensaio é 25,4 × 25,4 mm.",
    exemplos: [
      { nome: "Tinta acrílica base solvente, branca — destaque de 5 %, satisfatória", dados: function () {
        return { ident: { registro: "EX-TS-139-1", obra: "Obra A", origem: "Fornecedor A" },
          params: { tinta: "Acrílica base solvente", cor: "branca", lote: "0001", espec: "em368" },
          cps: [{ esp: "0,38", tseca: "25", hseca: "72", tag: "25", hima: "24", har: "2", sep: "25,4", larg: "25,4", dest: "32" }] };
      } },
      { nome: "Tinta amarela — destaque estimado de 30 %, não satisfatória", dados: function () {
        return { ident: { registro: "EX-TS-139-2", obra: "Obra B", origem: "Fornecedor B" },
          params: { tinta: "Estireno-acrilato base solvente", cor: "amarela", lote: "0417", espec: "em371" },
          cps: [{ esp: "0,38", tseca: "25", hseca: "72", tag: "25", hima: "24", har: "2", sep: "25,4", larg: "25,4", pct: "30" }] };
      } },
    ],
  });
})();
