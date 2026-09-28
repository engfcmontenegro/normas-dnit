/*
 * Ficha: DNIT 443/2023-ME — Pavimentação — Solos — Ensaio de compactação utilizando moldes tripartidos.
 * Registra-se no motor de site/fichas.js (window.FE). Reusa a conta do bloco Compactação (umidade média de duas
 * cápsulas, γs, parábola por mínimos quadrados) e o gráfico da ficha DNIT 164/2013-ME.
 *
 * Campos de calcular(d).resultados: gsMax (MEAS máxima, g/cm³), hOt (umidade ótima, %), molde, energia, golpes, E.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var C = FE.BLOCOS.compactacao, U = FE.BLOCOS.umidade;

  // Tabela A1 (Anexo A): moldes, energias e golpes por camada (10 camadas) para cada soquete/altura de queda
  var MOLDES = { m10: { nome: "Ø 10 cm × 20 cm", V: 1570.8, massaMin: 30 }, m15: { nome: "Ø 15 cm × 30 cm", V: 5301.5, massaMin: 75 } };
  var ENERGIAS = { N: ["Normal", 6.0], I: ["Intermediária", 13.0], M: ["Modificada", 27.3] };
  var SOQUETES = { l305: [2.5, 30.5, "Leve 2,500 kg — queda 30,5 cm"], p457: [4.536, 45.7, "Pesado 4,536 kg — queda 45,7 cm"],
    p305: [4.536, 30.5, "Pesado 4,536 kg — queda 30,5 cm"], l457: [2.5, 45.7, "Leve 2,500 kg — queda 45,7 cm"] };
  var GOLPES = {
    m10: { N: { l305: 12, p457: 5, p305: 7, l457: 8 }, I: { l305: 27, p457: 10, p305: 15, l457: 18 }, M: { l305: 56, p457: 21, p305: 31, l457: 38 } },
    m15: { N: { l305: 42, p457: 15, p305: 23, l457: 28 }, I: { l305: 90, p457: 33, p305: 50, l457: 60 }, M: { l305: 190, p457: 70, p305: 105, l457: 127 } },
  };
  var CAMADAS = 10, M_CAPSULA = 250;

  function config(P) {
    var mo = MOLDES[P.molde] ? P.molde : "m10", en = ENERGIAS[P.energia] ? P.energia : "N", so = SOQUETES[P.soquete] ? P.soquete : "l305";
    var g = GOLPES[mo][en][so], S = SOQUETES[so];
    // eq. 1: E = M × H × N × n / V  (kgf·cm/cm³)
    return { mo: mo, en: en, so: so, golpes: g, E: S[0] * S[1] * g * CAMADAS / MOLDES[mo].V };
  }

  FE.FICHAS["dnit-443-2023-me"] = {
    titulo: "Solos — Compactação em moldes tripartidos",
    rotuloImportar: function (r) { return "MEAS máx " + fmt(r.gsMax, 3) + " · h ót " + fmt(r.hOt, 1) + " % (molde tripartido)"; },
    resumo: "Molde tripartido Ø 10 × 20 cm ou Ø 15 × 30 cm, 10 camadas, golpes da Tabela A1 conforme energia e soquete; amostras não trabalhadas (cinco porções); MEAS = Mh × 100 / ((100 + hc) × V) (eq. 3); curva de compactação, MEAS máxima e umidade ótima.",
    blocos: ["umidade", "compactacao"],
    params: [
      { k: "molde", r: "Molde tripartido (4 a, seção 5)", tipo: "select", recarrega: true,
        opcoes: [["m10", "Ø 10 cm × 20 cm — V = 1 570,8 cm³"], ["m15", "Ø 15 cm × 30 cm — V = 5 301,5 cm³"]] },
      { k: "energia", r: "Energia de compactação (Tabela A1)", tipo: "select",
        opcoes: Object.keys(ENERGIAS).map(function (k) { return [k, ENERGIAS[k][0] + " — " + fmt(ENERGIAS[k][1], 1) + " kgf·cm/cm³"]; }) },
      { k: "soquete", r: "Soquete e altura de queda (4 b, Tabela A1)", tipo: "select",
        opcoes: Object.keys(SOQUETES).map(function (k) { return [k, SOQUETES[k][2]]; }) },
      { k: "golpesAplic", r: "Golpes por camada aplicados — opcional", dica: "conferido com a Tabela A1" },
      { k: "volume", r: "Volume interno do cilindro aferido (cm³) — opcional", recarrega: "tabela", dica: "se vazio, o nominal da Tabela A1; pode variar por ponto" },
      { k: "material", r: "Material (6 i)", tipo: "select",
        opcoes: [["solo", "Solo — variação de umidade entre pontos ≈ 2 %"], ["pedreg", "Solo pedregulhoso / brita — ≈ 1 %"]] },
      { k: "pass375", r: "Passante na peneira de 37,5 mm (%)", dica: "percentuais da seção 5 — constam do relatório (9 b)" },
      { k: "pass25", r: "Passante na peneira de 25 mm (%)" },
      { k: "pass475", r: "Passante na peneira de 4,75 mm (%)" },
      { k: "descarte25", r: "Retido na 25 mm descartado para usar o molde de 10 cm (5 b)", tipo: "select",
        opcoes: [["nao", "Não"], ["sim", "Sim — até 10 % retido e material insuficiente para o molde de 15 cm"]] },
      { k: "massaAmostra", r: "Massa de material coletado (kg) — opcional", dica: "mínimo 30 kg (molde de 10 cm) ou 75 kg (molde de 15 cm), seção 5" },
      { k: "gs", r: "Massa específica dos grãos (g/cm³) — opcional", dica: "só para a curva de saturação no gráfico" },
    ],
    padrao: { molde: "m10", energia: "N", soquete: "l305", material: "solo", descarte25: "nao" },
    tabelas: function (d) {
      var P = d.params || {}, mo = MOLDES[P.molde] || MOLDES.m10;
      var linhas = [{ grupo: "Corpo de prova compactado (7.1)" },
        { k: "moldeN", r: "Cilindro nº", texto: true },
        { k: "moldeM", r: "M1 — cilindro tripartido + braçadeiras (7.1 c)", u: "g" },
        { k: "moldeV", r: "V — volume interno do cilindro", u: "cm³", padrao: "volume", padraoFixo: String(mo.V).replace(".", ",") },
        { k: "moldeSolo", r: "M2 — corpo de prova + cilindro + braçadeiras (7.1 j)", u: "g" },
        { calc: "Ph", r: "Mh = M2 − M1 — massa úmida do CP", u: "g", casas: 1 },
        { calc: "gh", r: "Massa específica aparente úmida (Mh / V)", u: "g/cm³", casas: 3 },
        { grupo: "Umidade de compactação — duas amostras de 250 g do centro do CP (7.1 l, 7.2 e 8.1)" }]
        .concat(U.linhas("c1", "Cápsula A (A1, A2, A3)", "lab")).concat(U.linhas("c2", "Cápsula B (B1, B2, B3)", "lab"))
        .concat([{ calc: "h", r: "hc — umidade média (7.2 e)", u: "%", casas: 2, destaque: true },
          { calc: "gs", r: "MEAS = Mh × 100 / ((100 + hc) × V) (eq. 3)", u: "g/cm³", casas: 3, destaque: true }]);
      return [{ chave: "pontos", titulo: "Pontos da curva (cinco porções, umidades crescentes)", rotulo: "Ponto", iniciais: 5, min: 5, usar: true,
        dica: "uma coluna por porção, em ordem crescente de umidade (6 i e 7.1 m); acrescente a 6ª porção se um ramo tiver só um ponto (8.2)",
        linhas: linhas }];
    },
    calcular: function (d) {
      var P = d.params || {}, cf = config(P), mo = MOLDES[cf.mo];
      var vol = ok(num(P.volume)) ? num(P.volume) : mo.V;
      var c = C.calcular({ params: { volumePadrao: String(vol) }, pontos: d.pontos || [] }, 5, "Ponto");
      // o aviso genérico de ramos do bloco é substituído pela regra da 8.2
      var avisos = c.avisos.filter(function (a) { return a.indexOf("Recomenda-se ao menos dois pontos") !== 0; });
      var usados = c.pontos.filter(function (o) { return o.usar && ok(o.h) && ok(o.gs); });
      if (ok(c.res.hOt) && usados.length >= 3) {
        var secos = usados.filter(function (o) { return o.h < c.res.hOt; }).length, umidos = usados.length - secos;
        if (secos < 2 || umidos < 2) avisos.push("O ramo " + (secos < 2 ? "seco" : "úmido") + " tem apenas " + Math.min(secos, umidos) +
          " ponto: prepare uma sexta porção com a umidade adequada para completar a curva (8.2).");
      }
      // 6 i: umidades crescentes, variação ≈ 2 % (solos) ou ≈ 1 % (pedregulhosos e britas)
      var alvo = P.material === "pedreg" ? 1 : 2, seq = c.pontos.filter(function (o) { return ok(o.h); });
      for (var i = 1; i < seq.length; i++) {
        var dh = seq[i].h - seq[i - 1].h;
        if (dh <= 0) avisos.push("As porções devem ter umidades sucessivamente crescentes (6 i): " + fmt(seq[i].h, 2) + " % após " + fmt(seq[i - 1].h, 2) + " %.");
        else if (dh < alvo / 2 || dh > alvo * 1.5) avisos.push("Variação de umidade de " + fmt(dh, 1) + " p.p. entre pontos consecutivos (" + fmt(seq[i - 1].h, 1) + " → " +
          fmt(seq[i].h, 1) + " %); a norma indica aproximadamente " + alvo + " % (6 i).");
      }
      // 7.1 l: amostras de 250 g
      var leves = [];
      (d.pontos || []).forEach(function (p, k) {
        ["c1", "c2"].forEach(function (pref) { var m = U.calcular(p, pref, "lab").mUmida; if (ok(m) && m < 0.8 * M_CAPSULA && leves.indexOf(k + 1) < 0) leves.push(k + 1); });
        var o = c.pontos[k];
        if ((ok(o.c1W) || ok(o.c2W)) && !(ok(o.c1W) && ok(o.c2W))) avisos.push("Ponto " + (k + 1) + ": a umidade é a média de duas amostras (7.2 e) — falta uma cápsula.");
      });
      if (leves.length) avisos.push("Ponto(s) " + leves.join(", ") + ": amostra de umidade com menos de 200 g; a norma pede duas amostras de 250 g (7.1 l).");
      // golpes (Tabela A1)
      var gA = num(P.golpesAplic);
      if (ok(gA) && gA !== cf.golpes) avisos.push("Golpes aplicados (" + gA + ") diferentes dos " + cf.golpes + " golpes por camada da Tabela A1 para esta energia, soquete e molde.");
      // seção 5: escolha do molde pela granulometria
      var p375 = num(P.pass375), p25 = num(P.pass25);
      if (cf.mo === "m10") {
        if (ok(p375) && p375 < 100) avisos.push("Há material retido na peneira de 37,5 mm: substituir essa fração por igual massa passante na 37,5 mm e retida na 25 mm e ensaiar no molde de 15 × 30 cm (5 b).");
        else if (ok(p25) && p25 < 100) {
          if (100 - p25 > 10) avisos.push("Retido de " + fmt(100 - p25, 1) + " % na peneira de 25 mm: use o molde de 15 × 30 cm (5 b); o descarte só é admitido até 10 %.");
          else if (P.descarte25 !== "sim") avisos.push("Há material retido na peneira de 25 mm: use o molde de 15 × 30 cm, ou descarte o retido (até 10 %, material insuficiente) e registre no relatório (5 b).");
        }
      } else if (ok(p25) && p25 >= 100 && (!ok(p375) || p375 >= 100)) {
        avisos.push("Amostra integralmente passante na peneira de 25 mm: a norma indica o molde de 10 × 20 cm (5 a e b).");
      }
      var mA = num(P.massaAmostra);
      if (ok(mA) && mA < mo.massaMin) avisos.push("Material coletado de " + fmt(mA, 1) + " kg, abaixo do mínimo de " + mo.massaMin + " kg para o molde " + mo.nome + " (seção 5).");
      var res = Object.assign({}, c.res, { molde: cf.mo, energia: cf.en, soquete: cf.so, golpes: cf.golpes, E: cf.E, V: vol });
      return { tab: { pontos: c.pontos }, pontos: c.pontos, resultados: res, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + fmt(r.gsMax, 3) +
        ' <small>g/cm³</small></div><div class="fe-res-r">Massa específica aparente seca máxima (3.4)</div></div>' +
        '<div class="fe-res-item"><div class="fe-res-v">' + fmt(r.hOt, 1) + ' <small>%</small></div><div class="fe-res-r">Umidade ótima (3.7)</div></div>' +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + esc(ENERGIAS[r.energia][0]) + " · " + r.golpes + ' golpes/camada</div><div class="fe-res-r">' +
        esc(MOLDES[r.molde].nome + " · " + SOQUETES[r.soquete][2]) + " · E = " + fmt(r.E, 1) + " kgf·cm/cm³ (eq. 1)</div></div></div>";
    },
    graficos: function (calc, d, opt) { return [FE.FICHAS["dnit-164-2013-me"].grafico(calc, d, opt)]; },
    relatorio: {
      notas: "Umidade h = (mh − ms) × 100 / ms (eq. 2), média das duas cápsulas; MEAS = Mh × 100 / ((100 + hc) × V) (eq. 3), com Mh = M2 − M1; E = M × H × N × n / V (eq. 1). Curva de compactação: parábola por mínimos quadrados aos pontos considerados; MEAS máxima e umidade ótima no vértice teórico (3.2, 3.4 e 3.7).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {};
        var pass = ["37,5 mm: " + (P.pass375 || "—"), "25 mm: " + (P.pass25 || "—"), "4,75 mm: " + (P.pass475 || "—")].join(" · ");
        return [["Energia de compactação (9 a)", ENERGIAS[r.energia][0] + " — " + r.golpes + " golpes/camada, 10 camadas, " + SOQUETES[r.soquete][2] +
            " (E = " + fmt(r.E, 1) + " kgf·cm/cm³)"],
          ["Percentuais passantes (9 b)", pass + " %" + (P.descarte25 === "sim" ? " — retido na 25 mm descartado (5 b)" : "")],
          ["Molde (9 c)", MOLDES[r.molde].nome + " — V = " + fmt(r.V, 1) + " cm³"],
          ["Massa específica aparente seca máxima (9 e)", fmt(r.gsMax, 3) + " g/cm³"],
          ["Teor de umidade ótima (9 f)", fmt(r.hOt, 1) + " %"]];
      },
    },
    exemplos: [
      { nome: "Exemplo da própria norma (Anexo D, Figura D1) — energia normal, molde 10 × 20 cm", dados: function () {
        // Figura D1: M1 = 4 824,0 g, V = 1 570,8 cm³; cápsulas (nº, úmida, seca, tara) — duas por ponto
        var M2 = [7571.1, 7647.5, 7740.5, 7740.0, 7708.3], cil = ["12", "35", "41", "25", "19"];
        var cap = [[["150", 186.4, 153.4, 42.0], ["155", 138.6, 116.1, 40.4]], [["45", 129.8, 108.7, 41.0], ["217", 136.7, 115.1, 44.3]],
          [["49", 161.4, 130.7, 39.8], ["52", 143.8, 118.1, 40.7]], [["206", 138.6, 113.7, 43.9], ["213", 142.1, 116.6, 46.0]],
          [["44", 149.7, 119.9, 39.9], ["208", 157.7, 126.5, 43.5]]];
        return { ident: { registro: "EX-443-001", camada: "Solo (exemplo da norma)" },
          params: { molde: "m10", energia: "N", soquete: "l305", material: "solo", pass375: "100", pass25: "100", pass475: "100", descarte25: "nao" },
          pontos: M2.map(function (m2, i) {
            var a = cap[i][0], b = cap[i][1];
            return { usar: true, moldeN: cil[i], moldeM: "4824,0", moldeV: "1570,8", moldeSolo: fmt(m2, 1),
              c1n: a[0], c1u: fmt(a[1], 1), c1s: fmt(a[2], 1), c1t: fmt(a[3], 1), c2n: b[0], c2u: fmt(b[1], 1), c2s: fmt(b[2], 1), c2t: fmt(b[3], 1) };
          }),
          obs: "Dados da Figura D1 da norma. A figura dá MEAS máxima 1,390 g/cm³ e umidade ótima 33,24 %, lidas na curva desenhada; as amostras de umidade têm 70 g a 150 g, e não os 250 g da 7.1 l." };
      } },
      { nome: "Brita graduada com 6 % retido na 25 mm — molde 15 × 30 cm, intermediária, soquete pesado", dados: function () {
        return { ident: { registro: "EX-443-002", camada: "Base — brita graduada", origem: "Pedreira X" },
          params: { molde: "m15", energia: "I", soquete: "p457", golpesAplic: "33", material: "pedreg", pass375: "100", pass25: "94", pass475: "38",
            descarte25: "nao", massaAmostra: "80", gs: "2,72" },
          pontos: gerar([3.6, 4.5, 5.5, 6.4, 7.4], [2.215, 2.262, 2.281, 2.268, 2.232], 5301.5, 12850, 400) };
      } },
      { nome: "Solo argiloso — molde 10 × 20 cm, modificada; golpes errados e só um ponto no ramo úmido", dados: function () {
        return { ident: { registro: "EX-443-003", camada: "Subleito — argila", origem: "Corte km 12" },
          params: { molde: "m10", energia: "M", soquete: "p457", golpesAplic: "26", material: "solo", pass375: "100", pass25: "100", pass475: "96",
            descarte25: "nao", massaAmostra: "22", gs: "2,70" },
          pontos: gerar([14.1, 16.0, 18.1, 20.2, 22.9], [1.630, 1.678, 1.712, 1.735, 1.728], 1570.8, 4824, 250) };
      } },
    ],
  };

  // pontos gerados de umidade e MEAS-alvo (duas cápsulas de massa úmida mu)
  function gerar(hs, meas, V, M1, mu) {
    return hs.map(function (h, i) {
      var Mh = meas[i] * (1 + h / 100) * V, t1 = 40 + i, t2 = 42.5 + i, s1 = mu / (1 + h / 100), s2 = (mu + 4) / (1 + h / 100);
      return { usar: true, moldeN: String(i + 1), moldeM: fmt(M1, 1), moldeSolo: fmt(M1 + Mh, 1),
        c1n: String(60 + 2 * i), c1t: fmt(t1, 1), c1s: fmt(t1 + s1, 1), c1u: fmt(t1 + s1 * (1 + h / 100), 1),
        c2n: String(61 + 2 * i), c2t: fmt(t2, 1), c2s: fmt(t2 + s2, 1), c2u: fmt(t2 + s2 * (1 + h / 100), 1) };
    });
  }
})();
