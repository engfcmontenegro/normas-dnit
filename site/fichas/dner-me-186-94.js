/*
 * Ficha: DNER-ME 186/94 — Tinta para demarcação viária — tempo de secagem "no pick-up time".
 * Usa FE.sinalizacao (definido em dner-me-018-94.js).
 */
(function () {
  "use strict";
  var FE = window.FE, S = FE.sinalizacao, C = S.COND, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  var CONDICOES = [
    S.COND.espessura("5.2"),
    C.temp("temp", "Temperatura do ambiente", 25, 0.2, "5.4"),
    { k: "ur", r: "Umidade relativa do ar — 50 % a 60 % (5.4)", curto: "umidade relativa", u: "%", lo: 50, hi: 60, cs: 0, sec: "5.4" },
    { k: "cil", r: "Massa do cilindro com anéis — 5,386 ± 0,028 kg (3 a)", curto: "massa do cilindro", u: "kg", lo: 5.358, hi: 5.414, cs: 3, sec: "3 a" },
  ];

  FE.FICHAS["dner-me-186-94"] = {
    titulo: "Tinta para demarcação viária — tempo de secagem \"no pick-up time\"",
    resumo: "Película úmida de 0,38 mm em placa de vidro a 25 °C e 50 % a 60 % de UR; o cilindro de aço com anéis de borracha rola pela rampa sobre a placa a intervalos regulares; tempo, em minutos, desde a pintura até a tinta não aderir mais aos anéis (seção 6).",
    blocos: [],
    params: S.paramsTinta().concat(S.paramsEspec("secagem")),
    padrao: { cor: "branca", espec: "" },
    tabelas: function () {
      return [{ chave: "det", titulo: "Determinações", rotulo: "Placa", iniciais: 1, min: 1,
        dica: "uma coluna por placa; tempo contado a partir do acionamento do cronômetro logo após a pintura (5.3)",
        linhas: [{ grupo: "Condições do ensaio (tolerâncias da norma)" }].concat(CONDICOES).concat([
          { grupo: "Passadas do cilindro (5.5 e 5.6)" },
          { k: "ult", r: "Última passada com tinta aderida aos anéis", u: "min" },
          { k: "npu", r: "Primeira passada sem tinta aderida (cronômetro travado, 5.7)", u: "min" },
          { calc: "npuV", r: "Tempo de secagem \"no pick-up time\" (6)", u: "min", casas: 1, destaque: true },
        ]) }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], fora = 0;
      var tab = (d.det || []).map(function (p, i) {
        var rot = "Placa " + (i + 1), o = {};
        fora += S.verificarCondicoes(CONDICOES, p, rot, avisos);
        var u = num(p.ult), n = num(p.npu);
        o.npuV = n;
        if (ok(u) && ok(n) && u >= n) avisos.push(rot + ": a última passada com tinta aderida deve ser anterior ao tempo final — confira.");
        return o;
      });
      var vals = tab.map(function (o) { return o.npuV; }).filter(ok);
      var r = { t: FE.media(vals), n: vals.length, lim: S.limite("secagem", P), fora: fora };
      r.conforme = S.confere(r.t, r.lim);
      S.avisoLimite(avisos, "Tempo de secagem", r.t, r.lim, "min", 1);
      if (fora) avisos.push("Ensaio com condição fora do prescrito (5.4): o tempo de secagem depende fortemente da temperatura e da umidade — repita nas condições da norma.");
      return { tab: { det: tab }, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res">' + S.itemRes(fmt(r.t, 1) + " <small>min</small>", "Tempo de secagem \"no pick-up time\"" + (r.n > 1 ? " (média de " + r.n + " placas)" : "") +
        (r.lim ? " · exigido " + esc(S.textoLimite(r.lim, "min", 0)) + " " + S.selo(r.conforme) : "") + (r.fora ? " · condições fora da norma" : "")) + "</div>";
    },
    relatorio: {
      notas: "Tempo de secagem \"no pick-up time\": tempo decorrido entre a pintura da placa e o instante em que a tinta não adere mais aos anéis de borracha do cilindro de aço (seção 6). Com mais de uma placa, o resultado é a média. As especificações fixam o máximo com umidade relativa entre 50 % e 60 %.",
      resultados: function (calc, d) {
        var r = calc.resultados;
        return S.linhaTinta(d.params).concat([["Tempo de secagem \"no pick-up time\"", (ok(r.t) ? fmt(r.t, 1) + " min" : "—") +
          (r.lim ? " — " + S.parecer("", r.t, r.lim, "min", 0) : "") + (r.fora ? " (condições fora da norma)" : "")]]);
      },
    },
    exemplos: [
      { nome: "Tinta acrílica emulsionada em água, branca — 9,5 min (atende)", dados: function () {
        return { ident: { registro: "EX-TS-186-1", obra: "Obra A", origem: "Fornecedor C" },
          params: { tinta: "Acrílica emulsionada em água", cor: "branca", lote: "0102", espec: "em276" },
          det: [{ esp: "0,38", temp: "25,0", ur: "55", cil: "5,386", ult: "9,0", npu: "9,5" }] };
      } },
      { nome: "Tinta amarela — 18 min, acima do máximo (reprovada)", dados: function () {
        return { ident: { registro: "EX-TS-186-2", obra: "Obra B", origem: "Fornecedor B" },
          params: { tinta: "Estireno-acrilato base solvente", cor: "amarela", lote: "0417", espec: "em371" },
          det: [{ esp: "0,38", temp: "25,1", ur: "58", cil: "5,390", ult: "17", npu: "18" }] };
      } },
    ],
  };
})();
