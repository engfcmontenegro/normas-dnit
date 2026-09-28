/*
 * Ficha: DNIT 052/2004-ME — Pavimento rígido — Selante de juntas — Puncionamento estático.
 * Usa o código comum de window.FE.selantes (definido em dnit-038-2004-me.js).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, S = FE.selantes;
  // classificação do resultado (seção 6), da pior para a melhor
  var CLASSES = {
    a: "Perfuração facilmente visível a olho nu",
    b: "Perfuração possível, mas não visível a olho nu",
    c: "Marca sem apresentar perfuração",
    d: "Sem perfuração nem marcas",
  };
  function classe(t) {
    var s = String(t || "").trim().toLowerCase().replace(/[^a-d]/g, "").charAt(0);
    return CLASSES[s] ? s : "";
  }

  FE.FICHAS["dnit-052-2004-me"] = {
    titulo: "Selante de juntas — puncionamento estático",
    resumo: "Placa de 200 × 200 mm e 2 mm de espessura sobre substrato de borracha; pistão de ponta Ø 11 mm (≈ 1 cm²) com carga de 8,5 kg por uma hora; resultado classificado de a (perfuração visível) a d (sem perfuração nem marcas) (seção 6).",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: selante de silicone — Fornecedor A" },
      S.paramJunta("não apresentar perfuração — exigido só para junta de expansão (5.3 g)"),
      { k: "idade", r: "Idade da placa ao cortar os CPs (dias)", ph: "7", dica: "aguardar sete dias (4 c)" },
    ].concat(S.paramsCond("5 a"), [
      { k: "carga", r: "Carga aplicada (kg)", ph: "8,5", dica: "8,5 kg (3.1 g, 5 d)" },
      { k: "tempo", r: "Tempo de aplicação da carga (min)", ph: "60", dica: "uma hora (5 d)" },
    ]),
    padrao: { junta: "" },
    tabelas: function () {
      return [{
        chave: "cp", titulo: "Corpos-de-prova", rotulo: "CP", iniciais: 1, min: 1,
        dica: "resultado: a, b, c ou d (seção 6); a norma não fixa o número de CPs",
        linhas: [
          { k: "e", r: "Espessura da placa (4 a)", u: "mm", ph: "2,00" },
          { k: "lado", r: "Dimensões do CP (4 d)", u: "mm", texto: true, ph: "200 × 200" },
          { k: "res", r: "Resultado — a / b / c / d (seção 6)", texto: true, ph: "a, b, c ou d" },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var cps = (d.cp || []).map(function (x, i) {
        var e = num(x.e), c = classe(x.res), nm = "CP " + (i + 1) + ": ";
        if (S.faixa(e, 2, 0.01)) avisos.push(nm + "espessura de " + fmt(e, 2) + " mm, fora de (2,00 ± 0,01) mm (4 a).");
        if (String(x.res || "").trim() && !c) avisos.push(nm + "resultado \"" + x.res + "\" não reconhecido — use a, b, c ou d (seção 6).");
        return { c: c };
      });
      S.avisosCond(P, avisos, "5 a");
      var id = num(P.idade), cg = num(P.carga), tp = num(P.tempo);
      if (ok(id) && id < 7) avisos.push("CPs cortados com " + fmt(id, 0) + " dia(s); a norma manda aguardar sete dias (4 c).");
      if (ok(cg) && Math.abs(cg - 8.5) > 0.05) avisos.push("Carga de " + fmt(cg, 2) + " kg; a norma fixa 8,5 kg (5 d).");
      if (ok(tp) && tp !== 60) avisos.push("Carga aplicada por " + fmt(tp, 0) + " min; a norma fixa uma hora (5 d).");
      var cls = cps.map(function (o) { return o.c; }).filter(Boolean);
      var pior = cls.length ? cls.slice().sort()[0] : "";
      var perfura = cls.filter(function (c) { return c === "a" || c === "b"; }).length;
      var lim = S.limite(P, "puncionamento"), conforme = null;
      if (lim && cls.length) {
        conforme = perfura === 0;
        if (!conforme) avisos.push(perfura + " CP(s) com perfuração (resultado a ou b): o selante não atende à DNIT 046/2004-EM, 5.3 g.");
      }
      if (P.junta && P.junta !== "expansao") avisos.push("A DNIT 046/2004-EM só exige o ensaio de puncionamento para juntas de expansão (5.3 g).");
      return { tab: { cp: cps }, resultados: { classes: cls, pior: pior, perfura: perfura, lim: lim, conforme: conforme }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res">' +
        S.item(r.pior ? r.pior + ")" : "—", "", r.pior ? esc(CLASSES[r.pior]) + " — pior resultado" + (r.classes.length > 1 ? " entre " + r.classes.length + " CPs" : "") : "Informe o resultado de cada CP", r.conforme) +
        (r.classes.length > 1 ? S.item(esc(r.classes.join(" · ")), "", "Resultados individuais", null, true) : "") + "</div>";
    },
    relatorio: {
      notas: "Resultado anotado conforme a seção 6: a) perfuração facilmente visível a olho nu; b) perfuração possível, mas não visível a olho nu; c) marca sem apresentar perfuração; d) sem perfuração nem marcas. Para a DNIT 046/2004-EM (5.3 g, junta de expansão), os resultados a e b são tratados como perfuração (não atende); c e d atendem.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        (d.cp || []).forEach(function (x, i) {
          var c = (calc.tab.cp[i] || {}).c;
          if (c) rows.push(["CP " + (i + 1), c + ") " + CLASSES[c]]);
        });
        if (r.pior) rows.push(["Pior resultado", r.pior + ") " + CLASSES[r.pior]]);
        if (r.conforme !== null) rows.push(["Parecer — " + S.nomeJunta(P.junta), (r.conforme ? "Atende" : "NÃO ATENDE") + " (sem perfuração — DNIT 046/2004-EM, 5.3 g)"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Silicone — junta de expansão, sem perfuração", dados: function () {
        return { ident: { registro: "EX-SEL-PU-01", obra: "Obra C", origem: "Fornecedor C", camada: "Selante — junta de expansão" },
          params: { material: "Selante de silicone de baixo módulo", junta: "expansao", idade: "7", temp: "23", horas: "2", carga: "8,5", tempo: "60" },
          cp: [{ e: "2,00", lado: "200 × 200", res: "c" }, { e: "2,01", lado: "200 × 200", res: "d" }, { e: "2,00", lado: "200 × 200", res: "c" }] };
      } },
      { nome: "Selante acrílico — perfuração sob o pistão", dados: function () {
        return { ident: { registro: "EX-SEL-PU-02", obra: "Obra D", origem: "Fornecedor D", camada: "Selante — junta de expansão" },
          params: { material: "Selante acrílico", junta: "expansao", idade: "7", temp: "23", horas: "2", carga: "8,5", tempo: "60" },
          cp: [{ e: "2,00", lado: "200 × 200", res: "b" }, { e: "2,00", lado: "200 × 200", res: "a" }, { e: "1,99", lado: "200 × 200", res: "c" }] };
      } },
    ],
  };
})();
