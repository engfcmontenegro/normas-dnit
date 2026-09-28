/*
 * Ficha: DNER-ME 162/94 — Solos — Ensaio de compactação utilizando amostras trabalhadas.
 * Registra-se no motor de site/fichas.js (window.FE). Reusa o bloco Compactação (FE.BLOCOS.compactacao) e o
 * gráfico da ficha DNIT 164/2013-ME: mesmo molde (Ø 15,24 cm com disco espaçador), cinco camadas, soquete de 4,536 kg.
 * Diferença para a DNIT 164: uma única amostra (~6 kg ou ~7 kg, 4.1) recompactada com acréscimos de 1 % a 2 % de água (5.4).
 *
 * Campos de calcular(d).resultados (gravados com o ensaio salvo; as fichas DNER-ME 036/94 e 037/94 importam):
 *   resultados.gsMax  massa específica aparente seca máxima (g/cm³) — vértice da curva (8.2)
 *   resultados.hOt    umidade ótima (%) (8.3)
 *   resultados.energia "A", "B" ou "C"
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var C = FE.BLOCOS.compactacao, U = FE.BLOCOS.umidade;
  var VOL_PADRAO = Math.round(Math.PI * Math.pow(15.24 / 2, 2) * (17.78 - 6.35));  // = bloco Compactação
  var ENERGIAS = { A: ["Normal — Método A", 12], B: ["Intermediária — Método B", 26], C: ["Modificada — Método C", 55] };  // seção 6
  var MASSA = { fino: [6, "siltosos ou argilosos"], grosso: [7, "arenosos ou pedregulhosos"] };  // 4.1 (kg)
  var M_CAPSULA = 250;  // 5.3: duas amostras de cerca de 250 g

  FE.FICHAS["dner-me-162-94"] = {
    titulo: "Solos — Compactação utilizando amostras trabalhadas",
    rotuloImportar: function (r) { return "γs,máx " + fmt(r.gsMax, 3) + " · h ót " + fmt(r.hOt, 1) + " % (amostra trabalhada)"; },
    resumo: "Fração passando na peneira de 19 mm; uma amostra de ~6 kg (siltosos/argilosos) ou ~7 kg (arenosos/pedregulhosos) recompactada com teores crescentes de umidade (acréscimos de 1 % a 2 %); curva de compactação, massa específica aparente seca máxima e umidade ótima (seções 7 e 8).",
    blocos: ["umidade", "compactacao"],
    params: [
      { k: "energia", r: "Energia de compactação (seção 6)", tipo: "select",
        opcoes: Object.keys(ENERGIAS).map(function (k) { return [k, ENERGIAS[k][0] + " — " + ENERGIAS[k][1] + " golpes/camada"]; }) },
      { k: "solo", r: "Tipo de solo (4.1)", tipo: "select",
        opcoes: [["fino", "Siltoso ou argiloso — amostra de ~6 kg"], ["grosso", "Arenoso ou pedregulhoso — amostra de ~7 kg"]] },
      { k: "massa", r: "Massa da amostra representativa (kg)", dica: "aproximadamente 6 kg ou 7 kg, conforme o tipo de solo (4.1)" },
      { k: "volumePadrao", r: "Volume do molde (cm³)", recarrega: "tabela", ph: String(VOL_PADRAO),
        dica: "Ø 15,24 cm × (17,78 − 6,35) cm ≈ " + VOL_PADRAO + " cm³; use a capacidade aferida (informe por ponto se variar)" },
      { k: "ret19", r: "Material retido na peneira de 19 mm (%)", dica: "substituído por igual massa passando na 19 mm e retida na 4,8 mm (4.2); retido na 50 mm eliminado antes (Nota)" },
      { k: "gs", r: "Massa específica dos grãos (g/cm³) — opcional", dica: "só para traçar a curva de saturação (S = 100 %) no gráfico" },
    ],
    padrao: { energia: "A", solo: "fino" },
    tabelas: function () {
      var linhas = C.linhas("5.3 e 7.1", "5.2 e 7.2").map(function (l) {
        if (!l.r) return l;
        return Object.assign({}, l, { r: l.r.replace("Cápsula 2 (siltosos/argilosos)", "Cápsula 2") });
      });
      return [{ chave: "pontos", titulo: "Pontos da curva — compactações sucessivas da mesma amostra", rotulo: "Ponto", iniciais: 5, min: 5, usar: true,
        dica: "uma coluna por compactação, na ordem em que foram feitas (teores crescentes de umidade, 5.4 e 5.5); duas cápsulas por ponto (5.3). Desmarque \"usar\" para tirar um ponto discrepante do ajuste.",
        linhas: linhas }];
    },
    calcular: function (d) {
      var P = d.params || {};
      var c = C.calcular(d, 5, "Ponto");
      var avisos = c.avisos.slice();
      // 5.3: duas amostras do centro do corpo de prova, cerca de 250 g cada
      var semSegunda = [], leves = [];
      (d.pontos || []).forEach(function (p, i) {
        var o = c.pontos[i];
        if (ok(o.c1W) !== ok(o.c2W) && (ok(o.c1W) || ok(o.c2W))) semSegunda.push(i + 1);
        ["c1", "c2"].forEach(function (pref) {
          var m = U.calcular(p, pref, "lab").mUmida;
          if (ok(m) && m < 0.8 * M_CAPSULA) leves.push(i + 1);
        });
      });
      if (semSegunda.length) avisos.push("Ponto(s) " + semSegunda.join(", ") + ": a umidade de cada compactação é a média de duas amostras (5.3) — falta uma cápsula.");
      leves = leves.filter(function (v, k) { return leves.indexOf(v) === k; });
      if (leves.length) avisos.push("Ponto(s) " + leves.join(", ") + ": amostra de umidade com menos de 200 g; a norma pede duas amostras de cerca de 250 g (5.3).");
      // 5.4 e 5.5: mesma amostra, teores crescentes, acréscimos de 1 % a 2 % de água
      var seq = c.pontos.filter(function (o) { return ok(o.h); });
      for (var i = 1; i < seq.length; i++) {
        var dh = seq[i].h - seq[i - 1].h;
        if (dh <= 0) avisos.push("Os teores de umidade devem ser crescentes (5.5): um ponto tem umidade de " + fmt(seq[i].h, 2) +
          " %, não maior que a do anterior (" + fmt(seq[i - 1].h, 2) + " %). Confira a ordem das colunas.");
        else if (dh < 0.5 || dh > 2.5) avisos.push("Acréscimo de umidade de " + fmt(dh, 2) + " p.p. entre pontos consecutivos (" + fmt(seq[i - 1].h, 1) + " → " +
          fmt(seq[i].h, 1) + " %); a norma manda adicionar 1 % a 2 % de água a cada compactação (5.4).");
      }
      var massa = num(P.massa), M = MASSA[P.solo || "fino"];
      if (ok(massa) && Math.abs(massa - M[0]) > 0.1 * M[0]) avisos.push("Amostra de " + fmt(massa, 1) + " kg; para solos " + M[1] + " a norma indica aproximadamente " + M[0] + " kg (4.1).");
      var res = Object.assign({}, c.res, { energia: P.energia || "A" });
      return { tab: { pontos: c.pontos }, pontos: c.pontos, resultados: res, avisos: avisos };
    },
    resultadosHtml: function (calc, d) {
      var r = calc.resultados, en = ENERGIAS[(d.params || {}).energia || "A"];
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + fmt(r.gsMax, 3) +
        ' <small>g/cm³</small></div><div class="fe-res-r">Massa específica aparente seca máxima (8.2)</div></div>' +
        '<div class="fe-res-item"><div class="fe-res-v">' + fmt(r.hOt, 1) + ' <small>%</small></div><div class="fe-res-r">Umidade ótima (8.3)</div></div>' +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + esc(en[0]) + '</div><div class="fe-res-r">Energia · ' + en[1] +
        " golpes/camada, 5 camadas</div></div></div>";
    },
    graficos: function (calc, d, opt) { return [FE.FICHAS["dnit-164-2013-me"].grafico(calc, d, opt)]; },
    relatorio: {
      parametros: [["Compactação", "Amostra trabalhada (reusada a cada ponto); 5 camadas, soquete de 4,536 kg, queda de 45,72 cm, molde Ø 15,24 cm com disco espaçador (5.1)"]],
      notas: "h = (Ph − Ps) / Ps × 100, média de duas amostras por ponto (5.3 e 7.1); γh = P'h / V; γs = γh × 100 / (100 + h) (7.2). Curva de compactação: parábola ajustada por mínimos quadrados aos pontos considerados; γs,máx e umidade ótima no vértice (8.2 e 8.3).",
      resultados: function (calc) {
        return [["Massa específica aparente seca máxima", fmt(calc.resultados.gsMax, 3) + " g/cm³"],
          ["Umidade ótima", fmt(calc.resultados.hOt, 1) + " %"]];
      },
    },
    exemplos: [
      { nome: "Subleito argiloso — Proctor intermediário, amostra de 6 kg (planilha do laboratório, registro 2)", dados: function () {
        // matriz de solos da Unidade B, registro 2 (18/03/2024): moldes e massas da planilha; umidade de cada ponto =
        // umidade higroscópica 0,68 % + água adicionada (900 a 1 140 g em 6 000 g), reproduzida aqui em duas cápsulas de 250 g
        var hs = [15.7857, 16.7925, 17.7993, 18.8062, 19.8130];
        var moldes = [["11", 4070, 2049, 8245], ["11", 4070, 2049, 8290], ["25", 4090, 2067, 8405], ["11", 4070, 2049, 8310], ["13", 4190, 2031, 8415]];
        return { ident: { registro: "2", data: "2024-03-18", obra: "Obra C", trecho: "BR-000", local: "Estaca 353-354", camada: "Subleito — argila", origem: "Jazida 2" },
          params: { energia: "B", solo: "fino", massa: "6", ret19: "0" },
          pontos: pontos(hs, moldes),
          obs: "Planilha do laboratório (rotulada DNIT 164/2013-ME): uma bandeja de 6 000 g recebendo 60 g de água (1 %) a cada ponto; a umidade de cada ponto foi calculada pela água adicionada, não medida em cápsulas (5.3 pede duas amostras de ~250 g por ponto). A planilha adota como máximo o maior ponto medido (1,772 g/cm³ a 17,8 %), sem traçar a curva." };
      } },
      { nome: "Corpo de aterro — Proctor normal, amostra de 6 kg (planilha do laboratório, registro 2)", dados: function () {
        var hs = [16.6865, 17.6924, 18.6984, 19.7043, 20.7102];
        var moldes = [["3", 4350, 2049, 8245], ["8", 4260, 2068, 8350], ["6", 4340, 2047, 8455], ["8", 4260, 2068, 8365], ["3", 4350, 2049, 8465]];
        return { ident: { registro: "2", data: "2024-03-18", obra: "Obra C", trecho: "BR-000", local: "Estaca 353-354", camada: "Corpo de aterro — argila", origem: "Jazida 2" },
          params: { energia: "A", solo: "fino", massa: "6", ret19: "0" },
          pontos: pontos(hs, moldes),
          obs: "Planilha do laboratório: mesma amostra, energia normal; umidade calculada pela água adicionada (60 g por ponto em 6 000 g). O 5º ponto (1,664 g/cm³) ficou acima do 4º (1,658 g/cm³), o que achata o ramo úmido. A planilha adota 1,694 g/cm³ a 18,7 % (maior ponto)." };
      } },
      { nome: "Solo arenoso — Proctor modificado, acréscimos irregulares e um só ponto no ramo úmido", dados: function () {
        var hs = [5.2, 6.4, 7.5, 8.4, 11.3], gss = [1.975, 2.010, 2.035, 2.040, 1.990];
        var moldes = hs.map(function (h, i) { var m = 4980 + i * 5, V = 2085; return [String(30 + i), m, V, Math.round(m + gss[i] * (1 + h / 100) * V)]; });
        var pts = pontos(hs, moldes, 180);
        pts[1].c2u = fmt(num(pts[1].c2u) + 2.2, 2);   // cápsulas do ponto 2 discordantes
        return { ident: { registro: "EX-162-003", camada: "Sub-base — areia siltosa", origem: "Jazida 2" },
          params: { energia: "C", solo: "grosso", massa: "7,2", ret19: "4", gs: "2,66" },
          pontos: pts };
      } },
    ],
  };

  // pontos com duas cápsulas por compactação reproduzindo a umidade h (massa úmida de cada amostra ≈ mu g)
  function pontos(hs, moldes, mu) {
    mu = mu || M_CAPSULA;
    return hs.map(function (h, i) {
      var t1 = 30 + i * 1.7, t2 = 28.5 + i * 1.3, s1 = mu / (1 + h / 100), s2 = (mu + 6) / (1 + h / 100);
      return { usar: true,
        c1n: String(101 + 2 * i), c1t: fmt(t1, 2), c1s: fmt(t1 + s1, 2), c1u: fmt(t1 + s1 * (1 + h / 100), 2),
        c2n: String(102 + 2 * i), c2t: fmt(t2, 2), c2s: fmt(t2 + s2, 2), c2u: fmt(t2 + s2 * (1 + h / 100), 2),
        moldeN: moldes[i][0], moldeM: String(moldes[i][1]), moldeV: String(moldes[i][2]), moldeSolo: String(moldes[i][3]) };
    });
  }
})();
