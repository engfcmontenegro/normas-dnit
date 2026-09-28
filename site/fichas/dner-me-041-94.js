/*
 * Ficha: DNER-ME 041/94 — Solos — Preparação de amostras para ensaios de caracterização (registro e verificação).
 * Secagem (≤ 60 °C), destorroamento, redução a ~1 500 g (argilosos/siltosos) ou ~2 000 g (arenosos/pedregulhosos),
 * peneiramento na 2,0 mm e na 0,42 mm e separação das porções de cada ensaio (4 e 5). Registra-se em window.FE.
 * Não há resultado de ensaio: a ficha confere massas e operações contra a norma. "Cerca de" = ± 20 % (critério da ficha).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var FOLGA = 0.20;  // "cerca de": tolerância adotada pela ficha

  var CHECK = [
    ["chkDest", "4.1", "Torrões desagregados no almofariz com mão de gral revestida de borracha (ou dispositivo mecânico), sem reduzir as partículas"],
    ["chkRed", "4.2", "Amostra reduzida com repartidor de amostras ou por quarteamento"],
    ["chkTor2", "4.4", "Torrões remanescentes desfeitos ao passar na peneira de 2,0 mm (só grãos maiores que a malha ficam retidos)"],
    ["chkLav", "5.1.1", "Retido na 2,0 mm lavado nesta peneira e seco em estufa a 105–110 °C até constância de peso"],
    ["chkPor", "5.1.2 e 5.2.2", "Porções de 250 g e de 200 g separadas com repartidor ou por quarteamento"],
    ["chkTor042", "5.2.1", "Torrões desfeitos ao passar na peneira de 0,42 mm"],
  ];
  var SN = [["", "— não verificado"], ["sim", "Sim"], ["nao", "Não"]];

  FE.FICHAS["dner-me-041-94"] = {
    titulo: "Solos — Preparação de amostras para ensaios de caracterização",
    resumo: "Registro e verificação da preparação: secagem até 60 °C, destorroamento, redução a cerca de 1 500 g ou 2 000 g, peneiras de 2,0 mm e 0,42 mm e porções para umidade higroscópica, granulometria, densidade real, LL, LP e contração (4 e 5).",
    blocos: ["umidade"],
    params: [
      { k: "solo", r: "Tipo de solo (4.2 e 5.1.2 b)", tipo: "select",
        opcoes: [["fino", "Argiloso ou siltoso — cerca de 1 500 g; 70 g para granulometria < 2 mm"], ["grosso", "Arenoso ou pedregulhoso — cerca de 2 000 g; 120 g para granulometria < 2 mm"]] },
      { k: "secagem", r: "Secagem (4.1)", tipo: "select",
        opcoes: [["ar", "Ao ar"], ["secador", "Aparelho secador (infravermelho ou similar) — amostra até 60 °C"]] },
      { k: "acima60", r: "Temperatura acima de 60 °C comprovadamente inócua para este solo?", tipo: "select",
        opcoes: [["nao", "Não"], ["sim", "Sim — experiência prévia (4.1)"]], se: function (d) { return (d.params || {}).secagem === "secador"; } },
      { k: "ensaios", r: "Ensaios a que se destina", ph: "ex.: granulometria com sedimentação, LL, LP, densidade real" },
    ].concat(CHECK.map(function (c) { return { k: c[0], r: c[2] + " (" + c[1] + ")", tipo: "select", opcoes: SN }; })),
    padrao: { solo: "fino", secagem: "ar", acima60: "nao" },
    tabelas: function () {
      var U = FE.BLOCOS.umidade;
      var linhas = [
        { grupo: "Operações preliminares (4)" },
        { k: "tSec", r: "Temperatura máxima da amostra na secagem (4.1)", u: "°C", ph: "ambiente" },
        { k: "mTot", r: "Peso total da amostra seca ao ar, com aproximação de 5 g (4.3)", u: "g" },
        { grupo: "Peneira de 2,0 mm (4.4 e 5.1.1)" },
        { k: "mRet2", r: "Retido na 2,0 mm (seco ao ar, antes da lavagem)", u: "g" },
        { k: "mPas2", r: "Passante na 2,0 mm (seco ao ar)", u: "g" },
        { calc: "dif", r: "Diferença: total − (retido + passante)", u: "g", casas: 0 },
        { k: "mRet2L", r: "Retido na 2,0 mm lavado e seco em estufa (5.1.1)", u: "g" },
        { calc: "pRet2", r: "Retido na 2,0 mm (lavado, seco) / amostra total seca", u: "%", casas: 1 },
        { grupo: "Fração < 2,0 mm — porção de cerca de 250 g (5.1.2)" },
        { k: "m250", r: "Porção separada da fração < 2,0 mm", u: "g", ph: "≈ 250" },
        { k: "mGran", r: "Para a granulometria < 2,0 mm (b)", u: "g", ph: "≈ 70 ou 120" },
        { k: "mDR", r: "Para a densidade real (c)", u: "g", ph: "≈ 10" },
        { grupo: "Umidade higroscópica — cerca de 50 g (5.1.2 a; eq. 1 da DNIT 456-ME)" },
      ].concat(U.linhas("hg", "", "lab")).concat([
        { calc: "mHig", r: "Massa úmida para a umidade higroscópica", u: "g", casas: 1 },
        { calc: "mSeca", r: "Peso total da amostra seca (4.3 corrigido pela umidade higroscópica)", u: "g", casas: 0 },
        { grupo: "Fração < 0,42 mm — porção de cerca de 200 g (5.2)" },
        { k: "m200", r: "Porção separada da fração < 0,42 mm (5.2.2)", u: "g", ph: "≈ 200" },
        { k: "mLL", r: "Para o limite de liquidez", u: "g", ph: "≈ 70" },
        { k: "mLP", r: "Para o limite de plasticidade", u: "g", ph: "≈ 50" },
        { k: "mLC", r: "Para os fatores de contração", u: "g", ph: "≈ 50" },
      ]);
      return [{ chave: "am", titulo: "Amostras", rotulo: "Amostra", iniciais: 1, min: 1, linhas: linhas,
        dica: "uma coluna por amostra preparada; deixe em branco as porções de ensaios não previstos" }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], grosso = P.solo === "grosso";
      function cerca(rot, v, alvo, sec) {
        if (ok(v) && Math.abs(v - alvo) > alvo * FOLGA) avisos.push(rot + ": " + fmt(v, v < 100 ? 1 : 0) + " g — a norma indica cerca de " + alvo.toLocaleString("pt-BR") + " g (" + sec + ").");
      }
      var am = (d.am || []).map(function (x, i) {
        var rot = "Amostra " + (i + 1), o = {};
        var t = num(x.tSec);
        if (ok(t) && t > 60 && !(P.secagem === "secador" && P.acima60 === "sim")) avisos.push(rot + ": amostra aquecida a " + fmt(t, 0) + " °C — a temperatura não deve exceder 60 °C, salvo experiência prévia de que não altera o solo (4.1).");
        var tot = num(x.mTot), r2 = num(x.mRet2), p2 = num(x.mPas2), r2L = num(x.mRet2L);
        cerca(rot + " — amostra representativa", tot, grosso ? 2000 : 1500, "4.2");
        if (ok(tot) && Math.round(tot) % 5 !== 0) avisos.push(rot + ": o peso total é anotado com aproximação de 5 g (4.3; balança de 5 kg sensível a 5 g).");
        o.dif = ok(tot) && ok(r2) && ok(p2) ? tot - r2 - p2 : NaN;
        if (ok(o.dif) && Math.abs(o.dif) > Math.max(10, tot * 0.005)) avisos.push(rot + ": retido + passante na 2,0 mm diferem " + fmt(o.dif, 0) + " g do peso total — confira perdas no peneiramento (critério da ficha: 0,5 % ou 10 g).");
        if (ok(r2L) && ok(r2) && r2L > r2) avisos.push(rot + ": o retido lavado e seco em estufa pesa mais que o retido seco ao ar — confira.");
        var u = FE.BLOCOS.umidade.calcular(x, "hg", "lab");
        o.hgW = u.w;
        o.mHig = u.mUmida;
        o.mSeca = ok(tot) && ok(u.w) ? tot / (1 + u.w / 100) : NaN;
        var base = ok(o.mSeca) ? o.mSeca : tot;
        o.pRet2 = ok(r2L) && ok(base) && base > 0 ? r2L / base * 100 : NaN;
        cerca(rot + " — porção da fração < 2,0 mm", num(x.m250), 250, "5.1.2");
        cerca(rot + " — umidade higroscópica", o.mHig, 50, "5.1.2 a");
        cerca(rot + " — granulometria < 2,0 mm", num(x.mGran), grosso ? 120 : 70, "5.1.2 b");
        cerca(rot + " — densidade real", num(x.mDR), 10, "5.1.2 c");
        cerca(rot + " — porção da fração < 0,42 mm", num(x.m200), 200, "5.2.2");
        cerca(rot + " — limite de liquidez", num(x.mLL), 70, "5.2.2");
        cerca(rot + " — limite de plasticidade", num(x.mLP), 50, "5.2.2");
        cerca(rot + " — fatores de contração", num(x.mLC), 50, "5.2.2");
        var s1 = (num(x.mGran) || 0) + (o.mHig || 0) + (num(x.mDR) || 0), m250 = num(x.m250);
        if (ok(m250) && s1 > m250) avisos.push(rot + ": as porções tiradas da fração < 2,0 mm (" + fmt(s1, 0) + " g) excedem a porção separada de " + fmt(m250, 0) + " g (5.1.2).");
        var s2 = (num(x.mLL) || 0) + (num(x.mLP) || 0) + (num(x.mLC) || 0), m200 = num(x.m200);
        if (ok(m200) && s2 > m200) avisos.push(rot + ": as porções de LL, LP e contração (" + fmt(s2, 0) + " g) excedem a porção separada de " + fmt(m200, 0) + " g (5.2.2).");
        if (ok(m250) && ok(p2) && m250 > p2) avisos.push(rot + ": porção de 250 g maior que o passante na 2,0 mm.");
        return o;
      });
      var feitos = 0, pend = [];
      CHECK.forEach(function (c) {
        if (P[c[0]] === "sim") feitos++;
        else if (P[c[0]] === "nao") avisos.push("Não atendido (" + c[1] + "): " + c[2] + ".");
        else pend.push(c[1]);
      });
      var o0 = am[0] || {};
      return { tab: { am: am }, resultados: { feitos: feitos, total: CHECK.length, pendentes: pend, nao: CHECK.filter(function (c) { return P[c[0]] === "nao"; }).length,
        hg: o0.hgW, pRet2: o0.pRet2, mSeca: o0.mSeca, nAvisos: avisos.length }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      function cx(v, rot, p) { return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var st = r.nao || r.nAvisos ? '<span class="fe-nok">' + (r.nAvisos) + " verificação(ões) com aviso</span>" : r.pendentes.length ? "itens pendentes: " + esc(r.pendentes.join(", ")) : '<span class="fe-ok">conforme a norma</span>';
      return '<div class="fe-res">' + cx(r.feitos + " / " + r.total, "Operações confirmadas (4 e 5) · " + st) +
        cx(fmt(r.hg, 2) + " <small>%</small>", "Umidade higroscópica (amostra 1)") +
        cx(fmt(r.pRet2, 1) + " <small>%</small>", "Retido na 2,0 mm, lavado e seco (amostra 1)") +
        cx(fmt(r.mSeca, 0) + " <small>g</small>", "Amostra total seca (amostra 1)") + "</div>";
    },
    relatorio: {
      notas: "Preparação conforme a DNER-ME 041/94: secagem ao ar ou em secador sem exceder 60 °C (4.1); redução a cerca de 1 500 g (argilosos/siltosos) ou 2 000 g (arenosos/pedregulhosos), peso anotado a 5 g (4.2 e 4.3); retido na 2,0 mm lavado e seco em estufa (5.1.1); da fração < 2,0 mm, cerca de 250 g: 50 g para umidade higroscópica, 70 g ou 120 g para granulometria e 10 g para densidade real (5.1.2); da fração < 0,42 mm, cerca de 200 g: 70 g (LL), 50 g (LP) e 50 g (contração) (5.2.2). \"Cerca de\" verificado com ± 20 % (critério da ficha). Umidade higroscópica pela eq. 1 da DNIT 456-ME; peso seco = peso seco ao ar / (1 + h/100).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.ensaios) rows.push(["Ensaios a que se destina", P.ensaios]);
        (d.am || []).forEach(function (x, i) {
          var o = calc.tab.am[i];
          rows.push(["Amostra " + (i + 1), "total seco ao ar " + (x.mTot || "—") + " g · umidade higroscópica " + fmt(o.hgW, 2) + " % · retido na 2,0 mm " + fmt(o.pRet2, 1) + " %"]);
        });
        CHECK.forEach(function (c) { rows.push([c[2] + " (" + c[1] + ")", P[c[0]] === "sim" ? "sim" : P[c[0]] === "nao" ? "NÃO" : "não verificado"]); });
        return rows;
      },
    },
    exemplos: [
      { nome: "Cascalho arenoso — 2 000 g, umidade higroscópica da planilha do laboratório", dados: function () {
        // planilha do laboratório: porção de 2 000 g para a granulometria; cápsula 161 da umidade higroscópica (62,9 / 62,7 / 10,2 g)
        return { ident: { registro: "EX-PA-001", obra: "Obra A", local: "Est. 353", origem: "Jazida 1", camada: "Subleito", data: "2024-08-09" },
          params: { solo: "grosso", secagem: "ar", ensaios: "Granulometria com sedimentação, LL, LP, densidade real, contração",
            chkDest: "sim", chkRed: "sim", chkTor2: "sim", chkLav: "sim", chkPor: "sim", chkTor042: "sim" },
          am: [{ tSec: "", mTot: "2000", mRet2: "615", mPas2: "1380", mRet2L: "598,4", m250: "255", mGran: "121,3", mDR: "10,2",
            hgn: "161", hgt: "10,2", hgu: "62,9", hgs: "62,7", m200: "205", mLL: "71,5", mLP: "50,8", mLC: "49,6" }] };
      } },
      { nome: "Argila — secagem a 75 °C, amostra pequena e porções fora do previsto", dados: function () {
        return { ident: { registro: "EX-PA-002", obra: "Obra B", origem: "Corte 4", camada: "Subleito — argila", data: "2025-10-20" },
          params: { solo: "fino", secagem: "secador", acima60: "nao", ensaios: "LL, LP, contração",
            chkDest: "sim", chkRed: "nao", chkTor2: "sim", chkLav: "", chkPor: "sim", chkTor042: "nao" },
          am: [{ tSec: "75", mTot: "1180", mRet2: "96", mPas2: "1049", mRet2L: "88,5", m250: "250", mGran: "70,4", mDR: "10,1",
            hgn: "22", hgt: "14,05", hgu: "44,60", hgs: "42,93", m200: "150", mLL: "40,2", mLP: "50,3", mLC: "48,8" }] };
      } },
    ],
  };
})();
