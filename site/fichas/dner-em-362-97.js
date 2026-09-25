/*
 * Fichas: asfaltos diluídos — recebimento do carregamento.
 *   DNER-EM 362/97 — cura rápida (CR-70, CR-250), Tabela 1.
 *   DNER-EM 363/97 — cura média (CM-30, CM-70), Tabela 2 — registrada neste mesmo arquivo (o CM-30 é o da imprimação).
 * Usa o motor comum FE.recebimentoLigante, definido em site/fichas/dnit-095-2006-em.js (carregado antes).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var RL = FE.recebimentoLigante;
  if (!RL) { if (window.console) console.error("dner-em-362-97.js: carregue antes site/fichas/dnit-095-2006-em.js (motor de recebimento de ligantes)."); return; }
  var L = RL.L;

  var G1 = "Asfalto diluído", G2 = "Destilação até 360 °C (NBR 9619) — volumes destilados em % do volume da amostra",
    G3 = "Resíduo da destilação";

  // % do total destilado a T = destilado até T / destilado até 360 °C × 100
  function pctTotal(k) {
    return function (p) {
      var a = num(p[k]), t = num(p.d360);
      return ok(a) && ok(t) && t > 0 ? a / t * 100 : NaN;
    };
  }
  function residuo360(p) { var t = num(p.d360); return ok(t) ? 100 - t : NaN; }

  // tipos: {classe: [...]}; lim(obj) -> função (classe) -> limite
  function montar(cfg) {
    var C = cfg.classes;
    function por(a) { var o = {}; C.forEach(function (c, i) { o[c] = a[i] || null; }); return o; }
    var vis = function (tipo) { return function (P) { return (P.viscosidade || "cin") === tipo; }; };
    var ens = [
      { id: "vcin", grupo: G1, r: "Viscosidade cinemática a 60 °C", u: "cSt", casas: 0, metodo: "DNER-ME 151/94", se: vis("cin"), lim: por(cfg.vcin) },
    ];
    cfg.sf.forEach(function (s) {
      ens.push({ id: "sf" + s.t, grupo: G1, r: "Viscosidade Saybolt-Furol a " + s.t + " °C", u: "s", casas: 1, metodo: "DNER-ME 004/94", se: vis("sf"), lim: por(s.lim) });
    });
    ens.push({ id: "fulgor", grupo: G1, r: "Ponto de fulgor (vaso aberto Tag), mín.", u: "°C", casas: 0, metodo: "NBR 5765", lim: por(cfg.fulgor) });
    ens.push({ id: "agua", grupo: G1, r: "Água, % volume, máx.", u: "% vol.", casas: 1, metodo: "ABNT MB-37", lim: por(C.map(function () { return L(null, 0.2); })) });
    // entradas da destilação (auxiliares)
    cfg.temps.forEach(function (t) {
      ens.push({ id: "d" + t.t, grupo: G2, tipo: "aux", r: "Destilado até " + t.t + " °C", u: "% vol.", casas: 1 });
    });
    ens.push({ id: "d360", grupo: G2, tipo: "aux", r: "Destilado até 360 °C (total)", u: "% vol.", casas: 1 });
    cfg.temps.forEach(function (t) {
      ens.push({ id: "p" + t.t, grupo: G2, tipo: "col", entradas: [], usa: ["d" + t.t, "d360"], r: "% do total destilado a " + t.t + " °C" + t.sufixo,
        rCalc: "% do total destilado a " + t.t + " °C = destilado até " + t.t + " / destilado até 360 × 100", u: "%", casas: 1, casasCol: 1,
        metodo: "NBR 9619", lim: por(t.lim), col: pctTotal("d" + t.t) });
    });
    ens.push({ id: "res360", grupo: G2, tipo: "col", entradas: [], usa: ["d360"], r: "Resíduo a 360 °C, por diferença, % volume mín.",
      rCalc: "Resíduo a 360 °C = 100 − destilado até 360 (por diferença)", u: "% vol.", casas: 1, casasCol: 1, metodo: "NBR 9619", lim: por(cfg.res360), col: residuo360 });
    ens.push({ id: "pen", grupo: G3, r: "Penetração (100 g, 5 s, 25 °C)", u: "0,1 mm", casas: 0, metodo: "DNER-ME 003", nMin: 3, nMinRef: "NBR 6576 / DNER-ME 003",
      verifica: RL.tolPenetracao("Penetração do resíduo"), lim: por(C.map(function () { return L(80, 120); })) });
    ens.push({ id: "betume", grupo: G3, r: "Betume, % peso, mín.", u: "%", casas: 1, metodo: "DNER-ME 010", lim: por(C.map(function () { return L(99, null); })) });
    ens.push({ id: "duct", grupo: G3, r: "Ductilidade a 25 °C, mín. (\"> 100\" se passar do curso)", curto: "Ductilidade a 25 °C, mín.", u: "cm", casas: 0,
      metodo: "DNER-ME 163", ph: "ex.: > 100", usa: ["duct15"], lim: por(C.map(function () { return L(100, null); })) });
    ens.push({ id: "duct15", grupo: G3, tipo: "aux", r: "Ductilidade a 15 °C — só se a 25 °C der < 100 cm (Nota)", u: "cm", casas: 0, ph: "ex.: > 100" });
    return ens;
  }

  function criarFicha(cfg) {
    return RL.criar({
      titulo: cfg.titulo, resumo: cfg.resumo, tabela: cfg.tabela, classes: cfg.classes.map(function (c) { return [c, c]; }),
      rotuloClasse: "Tipo/classe do asfalto diluído",
      textoTodos: "A amostra deve satisfazer a todas as condições da " + cfg.tabela + " (6.2); o resultado geral vale só para os ensaios realizados.",
      padrao: { classe: cfg.classes[0], viscosidade: "cin" },
      params: [
        { k: "viscosidade", r: "Viscosidade ensaiada", tipo: "select", recarrega: true,
          opcoes: [["cin", "Cinemática a 60 °C (cSt)"], ["sf", "Saybolt-Furol (s)"]], dica: "a " + cfg.tabela + " exige a cinemática OU a Saybolt-Furol" },
      ],
      dicaTabela: "destilação: volumes acumulados em % do volume da amostra",
      ensaios: montar(cfg),
      // Nota da tabela: ductilidade a 25 °C < 100 cm é aceita se a 15 °C for maior que 100 cm
      ajustar: function (res, V, P, avisos) {
        var o = res.filter(function (x) { return x.e.id === "duct"; })[0];
        if (!o || o.situacao !== false) return;
        var d15 = V.duct15, maior = V["duct15>"];
        if (ok(d15) && (d15 > 100 || (maior && d15 >= 100))) {
          o.situacao = true;
          o.dets = o.dets.concat(["a 15 °C: " + (maior ? "> " : "") + fmt(d15, 0)]);
          avisos.push("Ductilidade a 25 °C abaixo de 100 cm, aceita porque a ductilidade a 15 °C é maior que 100 cm (Nota da " + cfg.tabela + ").");
        } else {
          avisos.push("Ductilidade a 25 °C abaixo de 100 cm: o material ainda pode ser aceito se a ductilidade a 15 °C for maior que 100 cm (Nota da " + cfg.tabela + ").");
        }
      },
      avisos: function (res, V, P, avisos) {
        var seq = cfg.temps.map(function (t) { return V["d" + t.t]; }).concat([V.d360]).filter(ok);
        for (var i = 1; i < seq.length; i++) {
          if (seq[i] < seq[i - 1]) { avisos.push("Destilação: os volumes destilados devem ser acumulados e crescentes com a temperatura — confira."); break; }
        }
      },
      notas: "Resultado de cada ensaio = média das determinações, comparada com a " + cfg.tabela + " da " + cfg.codigo + " para o tipo. " +
        "Destilação: volumes acumulados (% do volume da amostra); % do total destilado a T = destilado até T / destilado até 360 °C × 100; " +
        "resíduo a 360 °C = 100 − destilado até 360 °C (por diferença). Ductilidade a 25 °C menor que 100 cm é aceita se a 15 °C for maior que 100 cm (Nota). " +
        "Fornecimento aceito se todos os resultados atenderem; rejeitado se um ou mais não atenderem (6.2.3).",
      exemplos: cfg.exemplos,
    });
  }

  // ---------------- DNER-EM 362/97 — cura rápida (Tabela 1) ----------------
  FE.FICHAS["dner-em-362-97"] = criarFicha({
    codigo: "DNER-EM 362/97", tabela: "Tabela 1",
    titulo: "Recebimento de asfalto diluído — cura rápida (CR)",
    resumo: "Ensaios de recebimento comparados com a Tabela 1 (CR-70, CR-250): viscosidade cinemática ou Saybolt-Furol, fulgor Tag, destilação até 360 °C, água e ensaios no resíduo (penetração, betume, ductilidade). Para CM-30/CM-70 use a ficha da DNER-EM 363/97.",
    classes: ["CR-70", "CR-250"],
    vcin: [L(70, 140), L(250, 500)],
    sf: [{ t: 50, lim: [L(60, 120), null] }, { t: 60, lim: [null, L(125, 250)] }],
    fulgor: [null, L(27, null)],
    temps: [
      { t: 190, sufixo: ", mín.", lim: [L(10, null), null] },
      { t: 225, sufixo: ", mín.", lim: [L(50, null), L(35, null)] },
      { t: 260, sufixo: ", mín.", lim: [L(70, null), L(60, null)] },
      { t: 316, sufixo: ", mín.", lim: [L(85, null), L(80, null)] },
    ],
    res360: [L(55, null), L(65, null)],
    exemplos: [
      { nome: "CR-250 — ensaios completos, aprovado", dados: function () {
        return { ident: { registro: "REC-CR-EX-01", obra: "Exemplo", origem: "Distribuidora A", camada: "CR-250" },
          params: { classe: "CR-250", viscosidade: "cin", nf: "77120", quantidade: "15,0", procedencia: "Distribuidora A", certificado: "AD-310" },
          det: [{ vcin: "318", fulgor: "35", d225: "16", d260: "23", d316: "29", d360: "33", agua: "0,1", pen: "95", betume: "99,5", duct: "> 100" },
            { vcin: "322", pen: "97" }, { pen: "96" }] };
      } },
      { nome: "CR-70 — destilação e resíduo fora da especificação", dados: function () {
        return { ident: { registro: "REC-CR-EX-02", obra: "Exemplo", origem: "Distribuidora B", camada: "CR-70" },
          params: { classe: "CR-70", viscosidade: "sf", nf: "80311", quantidade: "12,5", procedencia: "Distribuidora B" },
          det: [{ sf50: "92", d190: "3", d225: "21", d260: "30", d316: "39", d360: "48", agua: "0,4", pen: "128", betume: "99,2", duct: "> 100" },
            { sf50: "95", pen: "131" }, { pen: "129" }] };
      } },
    ],
  });

  // ---------------- DNER-EM 363/97 — cura média (Tabela 2) ----------------
  FE.FICHAS["dner-em-363-97"] = criarFicha({
    codigo: "DNER-EM 363/97", tabela: "Tabela 2",
    titulo: "Recebimento de asfalto diluído — cura média (CM)",
    resumo: "Ensaios de recebimento comparados com a Tabela 2 (CM-30, CM-70; o CM-30 é o usual na imprimação): viscosidade cinemática ou Saybolt-Furol, fulgor Tag, destilação até 360 °C, água e ensaios no resíduo.",
    classes: ["CM-30", "CM-70"],
    vcin: [L(30, 60), L(70, 140)],
    sf: [{ t: 25, lim: [L(75, 150), null] }, { t: 50, lim: [null, L(60, 120)] }],
    fulgor: [L(38, null), L(38, null)],
    temps: [
      { t: 225, sufixo: ", máx.", lim: [L(null, 25), L(null, 20)] },
      { t: 250, sufixo: "", lim: [L(40, 70), L(20, 60)] },
      { t: 315, sufixo: "", lim: [L(75, 93), L(65, 90)] },
    ],
    res360: [L(50, null), L(55, null)],
    exemplos: [
      { nome: "CM-30 para imprimação — ensaios completos, aprovado", dados: function () {
        return { ident: { registro: "REC-CM30-EX-01", obra: "Exemplo", origem: "Distribuidora A", camada: "CM-30 — imprimação" },
          params: { classe: "CM-30", viscosidade: "sf", nf: "66501", quantidade: "10,0", procedencia: "Distribuidora A", certificado: "AD-288" },
          det: [{ sf25: "108", fulgor: "52", d225: "8", d250: "20", d315: "32", d360: "38", agua: "0,1", pen: "95", betume: "99,7", duct: "> 100" },
            { sf25: "112", pen: "98" }, { pen: "96" }] };
      } },
      { nome: "CM-30 — viscosidade, fulgor e destilação fora; ductilidade aceita pela Nota (15 °C)", dados: function () {
        return { ident: { registro: "REC-CM30-EX-02", obra: "Exemplo", origem: "Distribuidora B", camada: "CM-30 — imprimação" },
          params: { classe: "CM-30", viscosidade: "sf", nf: "70844", quantidade: "10,0", procedencia: "Distribuidora B" },
          det: [{ sf25: "164", fulgor: "35", d225: "12", d250: "22", d315: "33", d360: "40", agua: "0,1", pen: "88", betume: "99,4", duct: "85", duct15: "> 100" },
            { sf25: "168", pen: "90", duct: "88" }, { pen: "89" }] };
      } },
    ],
  });
})();
