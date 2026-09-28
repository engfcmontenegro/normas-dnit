/*
 * Ficha: DNIT 417/2019-ME — Solos — Controle de compactação com densímetro eletromagnético.
 * Registra-se no motor de site/fichas.js (window.FE).
 * Calibração in situ por correlação (7.5.2: ≥ 3 locais, ≥ 5 leituras por local, densidade pelo frasco de areia e
 * umidade por método normalizado); correções = média das diferenças referência − aparelho (7.5.3 e 7.5.4).
 * Por ponto: ρt e w lidos (9.1, 9.2), correções (8.5), ρd = ρt − Mw (eq. 1) ou ρd = ρt / (1 + w/100) (eq. 2),
 * grau de compactação (9.4). Temperatura do solo: 10 °C a 40 °C e até 10 °C da calibração (5.4).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var NLEIT = 3, NCAL = 5;

  var UMID = [["w", "Pelo aparelho — teor de umidade w (%) (9.2, eq. 1)"], ["mw", "Pelo aparelho — massa de água por volume Mw (eq. 1)"],
    ["lab", "Amostra — estufa (DNIT 456) (9.3.2, eq. 2)"], ["frigideira", "Amostra — frigideira (DNIT 456) (eq. 2)"], ["speedy", "Amostra — \"Speedy\" (DNIT 456) (eq. 2)"]];
  function doAparelho(P) { var u = P.umid || "w"; return u === "w" || u === "mw"; }
  function fatorU(P) { return P.unidade === "gcm3" ? 1000 : 1; }
  function aplicarLab(e, P) {
    var r = e.resultados || {}, i = (e.dados || {}).ident || {};
    if (ok(r.gsMax)) P.meLab = fmt(r.gsMax, 3);
    if (ok(r.hOt)) P.hOt = fmt(r.hOt, 1);
    P.labRegistro = (i.registro || "") + (i.origem ? " · " + i.origem : "") + (i.data ? " · " + i.data.split("-").reverse().join("/") : "");
  }
  function meses(de, ate) {
    var a = new Date(de), b = new Date(ate);
    return isNaN(a) || isNaN(b) ? NaN : (b - a) / (1000 * 3600 * 24 * 30.44);
  }
  function lista(p, pref, n) {
    var v = [];
    for (var j = 1; j <= n; j++) { var x = num(p[pref + j]); if (ok(x)) v.push(x); }
    return v;
  }

  FE.FICHAS["dnit-417-2019-me"] = {
    titulo: "Solos — Controle de compactação com densímetro eletromagnético",
    resumo: "Leituras de densidade (ρt) e umidade por ponto, correções da calibração in situ (7.5.3 e 7.5.4), massa específica aparente seca ρd = ρt − Mw (eq. 1) ou ρt / (1 + w/100) (eq. 2) e grau de compactação (9.4).",
    blocos: ["umidade"],
    params: [
      { k: "equipamento", r: "Equipamento — marca, modelo e nº de série (10 f)" },
      { k: "modelo", r: "Modelo de calibração / parâmetros do solo no aparelho (7.3, 10 g)", ph: "ex.: modelo de fábrica \"argila arenosa\", Cu, Cc" },
      { k: "dataFab", r: "Data da calibração de fábrica", tipo: "date", dica: "intervalo não superior a 12 meses (B.1)" },
      { k: "unidade", r: "Unidade de ρt (e de Mw) nas leituras", tipo: "select", opcoes: [["kgm3", "kg/m³"], ["gcm3", "g/cm³"]] },
      { k: "umid", r: "Teor de umidade (9.2 / 9.3)", tipo: "select", recarrega: true, opcoes: UMID },
      { k: "curvaSp", r: "Curva de calibração do Speedy (kPa = %)", ph: "20=2,5; 50=6,1; 100=12,0",
        se: function (d) { return (d.params || {}).umid === "speedy"; } },
      { k: "correcao", r: "Correções de densidade e umidade (7.5.3, 7.5.4, 8.5)", tipo: "select", recarrega: true,
        opcoes: [["calib", "Calcular pela calibração in situ (tabela abaixo, 7.5.2)"], ["manual", "Informar as correções (calibração anterior)"],
          ["aparelho", "Já inseridas no aparelho / não aplicáveis (7.5.3.1, 7.5.4.1)"]] },
      { k: "corrD", r: "Correção de densidade (kg/m³, somada às leituras)", se: function (d) { return (d.params || {}).correcao === "manual"; } },
      { k: "corrW", r: "Correção de umidade (pontos percentuais, somada)", se: function (d) { return (d.params || {}).correcao === "manual"; } },
      { k: "tCal", r: "Temperatura do solo na calibração (°C)", dica: "as medições devem estar a menos de 10 °C dela (5.4, 7.5.2.1)" },
      { k: "importar", r: "Referência de laboratório: buscar compactação salva", tipo: "importar", de: "dnit-164-2013-me", aplicar: aplicarLab },
      { k: "meLab", r: "Massa específica aparente seca máxima de laboratório (g/cm³)", dica: "DNIT 164-ME (7.3.2, 9.4)" },
      { k: "hOt", r: "Umidade ótima do laboratório (%)" },
      { k: "labRegistro", r: "Ensaio de compactação de referência" },
      { k: "gcMin", r: "Grau de compactação mínimo exigido (%) — opcional", dica: "da especificação de serviço" },
      { k: "nPrec", r: "Precisão (Anexo C) — nº de medições repetidas — opcional", dica: "mínimo 20 no mesmo local (C.2)" },
      { k: "sdPrec", r: "Precisão (Anexo C) — desvio-padrão das medições de densidade (kg/m³) — opcional" },
    ],
    padrao: { unidade: "kgm3", umid: "w", correcao: "calib" },
    tabelas: function (d) {
      var P = d.params || {}, un = P.unidade === "gcm3" ? "g/cm³" : "kg/m³", u = P.umid || "w", tabs = [];
      if (P.correcao === "calib") {
        var lc = [{ k: "local", r: "Local (estaca / posição)", texto: true }, { k: "temp", r: "Temperatura do solo", u: "°C" },
          { grupo: "Leituras do aparelho — pelo menos cinco por local (7.5.2)" }];
        for (var j = 1; j <= NCAL; j++) lc.push({ k: "r" + j, r: "ρt — leitura " + j, u: un });
        for (var k = 1; k <= NCAL; k++) lc.push({ k: "w" + k, r: "w — leitura " + k, u: "%" });
        lc.push({ calc: "rMed", r: "ρt médio do aparelho", u: "kg/m³", casas: 0 }, { calc: "wMed", r: "w médio do aparelho", u: "%", casas: 1 },
          { grupo: "Referência — frasco de areia (DNER-ME 092) e umidade (DNER-ME 213 / 088)" },
          { k: "rRef", r: "Massa específica aparente úmida de referência", u: un },
          { k: "wRef", r: "Teor de umidade de referência", u: "%" },
          { calc: "dR", r: "Diferença de densidade (referência − aparelho)", u: "kg/m³", casas: 0, destaque: true },
          { calc: "dW", r: "Diferença de umidade (referência − aparelho)", u: "p.p.", casas: 2, destaque: true });
        tabs.push({ chave: "cal", titulo: "Calibração in situ — correlação (7.5.2 a 7.5.4)", rotulo: "Local", iniciais: 3, min: 3, linhas: lc,
          dica: "no mínimo três locais com umidades e densidades diferentes, na faixa prevista para a obra; a média das leituras é o ponto de correlação" });
      }
      var lp = [{ k: "estaca", r: "Estaca / local (10 b)", texto: true }, { k: "posicao", r: "Posição (LE / eixo / LD)", texto: true },
        { k: "cota", r: "Elevação ou profundidade (10 d)", texto: true }, { k: "temp", r: "Temperatura do solo (8.4, precisão 1 °C)", u: "°C" },
        { grupo: "Leituras do aparelho (8.3, 9.1" + (doAparelho(P) ? ", 9.2" : "") + ")" }];
      for (var a = 1; a <= NLEIT; a++) lp.push({ k: "r" + a, r: "ρt — leitura " + a, u: un });
      if (u === "w") for (var b = 1; b <= NLEIT; b++) lp.push({ k: "w" + b, r: "w — leitura " + b, u: "%" });
      if (u === "mw") for (var c = 1; c <= NLEIT; c++) lp.push({ k: "m" + c, r: "Mw — leitura " + c, u: un });
      lp.push({ calc: "rLido", r: "ρt médio lido", u: "kg/m³", casas: 0 });
      if (doAparelho(P)) lp.push({ calc: "wLido", r: "w médio lido" + (u === "mw" ? " (= Mw / (ρt − Mw) × 100)" : ""), u: "%", casas: 1 });
      else lp = lp.concat([{ grupo: "Umidade de amostra — bloco Teor de umidade, DNIT 456-ME (9.3.2)" }]).concat(FE.BLOCOS.umidade.linhas("u", "", u));
      lp.push({ grupo: "Resultados (seção 9)" },
        { calc: "rt", r: "ρt corrigida (9.1 + correção 7.5.4)", u: "kg/m³", casas: 0 },
        { calc: "w", r: "w" + (doAparelho(P) ? " corrigido (9.2 + correção 7.5.3)" : " da amostra"), u: "%", casas: 1, destaque: true });
      if (doAparelho(P)) lp.push({ calc: "Mw", r: "Mw = ρt × w / (100 + w)", u: "kg/m³", casas: 0 },
        { calc: "rd", r: "ρd = ρt − Mw (eq. 1)", u: "kg/m³", casas: 0 });
      else lp.push({ calc: "rd", r: "ρd = ρt / (1 + w/100) (eq. 2)", u: "kg/m³", casas: 0 });
      lp.push({ calc: "meas", r: "Massa específica aparente seca ρd", u: "g/cm³", casas: 3, destaque: true },
        { calc: "GC", r: "Grau de compactação = ρd / ρd,máx × 100 (9.4)", u: "%", casas: 1, destaque: true },
        { calc: "dw", r: "Desvio de umidade (w − h ótima)", u: "p.p.", casas: 1 });
      tabs.push({ chave: "pts", titulo: "Pontos ensaiados", rotulo: "Ponto", iniciais: 3, min: 1, linhas: lp,
        dica: "uma coluna por ponto; local livre de objetos metálicos, material orgânico e linhas de alta tensão (5.1, 5.9)" });
      return tabs;
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], fu = fatorU(P), u = P.umid || "w", apar = doAparelho(P);
      var tCal = num(P.tCal);
      // ---- calibração in situ (7.5.2 a 7.5.4) ----
      var cal = [], corrD = 0, corrW = 0, origem = "sem correção";
      if (P.correcao === "calib") {
        cal = (d.cal || []).map(function (c, i) {
          var rs = lista(c, "r", NCAL), ws = lista(c, "w", NCAL), rot = "Calibração, local " + (i + 1) + (c.local ? " (" + c.local + ")" : "");
          var o = { rMed: rs.length ? media(rs) * fu : NaN, wMed: media(ws) };
          var rRef = num(c.rRef) * fu, wRef = num(c.wRef);
          o.dR = ok(rRef) && ok(o.rMed) ? rRef - o.rMed : NaN;
          o.dW = ok(wRef) && ok(o.wMed) ? wRef - o.wMed : NaN;
          if ((rs.length && rs.length < 5) || (ws.length && ws.length < 5)) avisos.push(rot + ": " + Math.min(rs.length || 99, ws.length || 99) + " leitura(s); a norma pede pelo menos cinco por local (7.5.2).");
          var t = num(c.temp);
          if (ok(t) && ok(tCal) && Math.abs(t - tCal) > 10) avisos.push(rot + ": temperatura de " + fmt(t, 0) + " °C, a mais de 10 °C da temperatura de calibração informada.");
          return o;
        });
        var dRs = cal.map(function (o) { return o.dR; }).filter(ok), dWs = cal.map(function (o) { return o.dW; }).filter(ok);
        if (cal.some(function (o) { return ok(o.rMed); }) && dRs.length < 3) avisos.push("Calibração in situ: são necessários pelo menos três locais completos (7.5.2); há " + dRs.length + ".");
        corrD = dRs.length ? media(dRs) : 0; corrW = dWs.length ? media(dWs) : 0;
        origem = dRs.length ? "calibração in situ (" + dRs.length + " locais)" : "calibração incompleta — sem correção";
        var wsRef = (d.cal || []).map(function (c) { return num(c.wRef); }).filter(ok);
        if (wsRef.length >= 3 && Math.max.apply(null, wsRef) - Math.min.apply(null, wsRef) < 1)
          avisos.push("Os locais de calibração têm praticamente a mesma umidade: devem representar a gama de umidades e densidades da obra (7.5.2).");
      } else if (P.correcao === "manual") {
        corrD = ok(num(P.corrD)) ? num(P.corrD) : 0; corrW = ok(num(P.corrW)) ? num(P.corrW) : 0;
        origem = "correções informadas";
      } else origem = "correções no aparelho / não aplicáveis";
      if (!apar) corrW = 0;  // a correção de umidade vale para a leitura do aparelho (7.5.3)
      var dataEns = (d.ident || {}).data || new Date().toISOString().slice(0, 10), mf = P.dataFab ? meses(P.dataFab, dataEns) : NaN;
      if (ok(mf) && mf > 12) avisos.push("Calibração de fábrica feita há " + fmt(mf, 0) + " meses: o intervalo não deve superar 12 meses (B.1).");

      // ---- pontos ----
      var meLab = num(P.meLab), hOt = num(P.hOt), gcMin = num(P.gcMin), curvaSp = FE.curvaSpeedy(P.curvaSp);
      var pts = (d.pts || []).map(function (p, i) {
        var rot = "Ponto " + (i + 1) + (p.estaca ? " (" + p.estaca + ")" : ""), o = {}, msgs = [];
        var rs = lista(p, "r", NLEIT);
        o.rLido = rs.length ? media(rs) * fu : NaN;
        if (u === "w") o.wLido = media(lista(p, "w", NLEIT));
        else if (u === "mw") {
          var ms = lista(p, "m", NLEIT), mw = ms.length ? media(ms) * fu : NaN;
          o.wLido = ok(mw) && ok(o.rLido) && o.rLido > mw ? mw / (o.rLido - mw) * 100 : NaN;
        }
        o.rt = ok(o.rLido) ? o.rLido + corrD : NaN;
        if (apar) {
          o.w = ok(o.wLido) ? o.wLido + corrW : NaN;
          o.Mw = ok(o.rt) && ok(o.w) ? o.rt * o.w / (100 + o.w) : NaN;
          o.rd = ok(o.Mw) ? o.rt - o.Mw : NaN;                              // eq. 1
        } else {
          var um = FE.BLOCOS.umidade.calcular(p, "u", u, curvaSp);
          o.uW = um.w; o.w = um.w;
          if (um.aviso) msgs.push(um.aviso);
          o.rd = ok(o.rt) && ok(o.w) ? o.rt / (1 + o.w / 100) : NaN;          // eq. 2
        }
        o.meas = o.rd / 1000;
        o.GC = ok(o.rd) && ok(meLab) && meLab > 0 ? o.rd / (meLab * 1000) * 100 : NaN;
        o.dw = ok(o.w) && ok(hOt) ? o.w - hOt : NaN;
        var t = num(p.temp);
        if (ok(o.rt) && !ok(t)) msgs.push("registre a temperatura do solo (8.4, 10 n)");
        if (ok(t) && (t < 10 || t > 40)) msgs.push("temperatura do solo de " + fmt(t, 0) + " °C fora de 10 °C a 40 °C (5.4)");
        if (ok(t) && ok(tCal) && Math.abs(t - tCal) > 10) msgs.push("temperatura " + fmt(Math.abs(t - tCal), 0) + " °C diferente da calibração: calibre o efeito da temperatura (5.4)");
        if (ok(o.GC) && o.GC < 80) msgs.push("material compactado a menos de 80 % da massa específica máxima: maior erro esperado (5.7)");
        if (P.unidade !== "gcm3" && ok(o.rLido) && o.rLido < 100) msgs.push("ρt parece estar em g/cm³ (troque a unidade)");
        if (ok(o.GC) && ok(gcMin) && o.GC < gcMin) msgs.push("GC = " + fmt(o.GC, 1) + " %, abaixo do mínimo exigido de " + fmt(gcMin, 1) + " %");
        if (msgs.length) avisos.push(rot + ": " + msgs.join("; ") + ".");
        o.estaca = p.estaca || ""; o.posicao = p.posicao || ""; o.temp = t;
        o.conforme = ok(o.GC) && ok(gcMin) ? o.GC >= gcMin : null;
        return o;
      });
      if (pts.some(function (o) { return ok(o.rd); }) && !ok(meLab)) avisos.push("Informe a massa específica aparente seca máxima de laboratório (ou busque uma compactação salva) para o grau de compactação (9.4).");
      var nP = num(P.nPrec);
      if (ok(nP) && nP < 20) avisos.push("Precisão do medidor: " + fmt(nP, 0) + " medições repetidas; o Anexo C pede no mínimo 20 (C.2).");
      return { tab: { cal: cal, pts: pts }, pontos: pts,
        resultados: { corrD: corrD, corrW: corrW, origem: origem, meLab: meLab, hOt: hOt, gcMin: gcMin, pts: pts, sdPrec: num(P.sdPrec),
          gcMedio: media(pts.map(function (o) { return o.GC; })) }, avisos: avisos };
    },
    resultadosHtml: function (calc, d) {
      var r = calc.resultados, apar = doAparelho(d.params || {});
      function cx(v, rot, p) { return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var h = '<div class="fe-res">' +
        cx((r.corrD >= 0 ? "+" : "") + fmt(r.corrD, 0) + " <small>kg/m³</small>" + (apar ? " · " + (r.corrW >= 0 ? "+" : "") + fmt(r.corrW, 2) + " <small>p.p.</small>" : ""),
          "Correções de densidade" + (apar ? " e de umidade" : "") + " — " + esc(r.origem), true) +
        cx(fmt(r.meLab, 3) + " <small>g/cm³</small>", "Referência de laboratório · h ótima " + fmt(r.hOt, 1) + " %", true) +
        cx(fmt(r.gcMedio, 1) + " <small>%</small>", "Grau de compactação médio" + (ok(r.gcMin) ? " · mínimo " + fmt(r.gcMin, 1) + " %" : "")) + "</div>";
      var linhas = r.pts.map(function (o, i) {
        var s = o.conforme === null ? "—" : o.conforme ? '<span class="fe-ok">conforme</span>' : '<span class="fe-nok">abaixo do mínimo</span>';
        return "<tr><td>" + (i + 1) + "</td><td>" + esc(o.estaca) + "</td><td>" + esc(o.posicao) + "</td><td>" + fmt(o.temp, 0) + "</td><td>" + fmt(o.rt, 0) +
          "</td><td>" + fmt(o.w, 1) + "</td><td>" + fmt(o.meas, 3) + "</td><td><b>" + fmt(o.GC, 1) + "</b></td><td>" + s + "</td></tr>";
      }).join("");
      return h + '<table class="fe-resumo"><thead><tr><th>Ponto</th><th>Estaca</th><th>Posição</th><th>T (°C)</th><th>ρt (kg/m³)</th><th>w (%)</th><th>ρd (g/cm³)</th><th>GC (%)</th><th>Situação</th></tr></thead><tbody>' +
        linhas + "</tbody></table>";
    },
    relatorio: {
      notas: "Correções (7.5.3 e 7.5.4): média das diferenças entre os valores de referência (frasco de areia, DNER-ME 092; umidade por DNER-ME 213 ou 088) e a média das leituras do aparelho em cada local de calibração, somada às leituras de campo. " +
        "Densidade comparada na calibração: massa específica aparente úmida (ρt, a grandeza lida pelo aparelho). ρd = ρt − Mw (eq. 1), com Mw = ρt·w/(100 + w) quando o aparelho mostra w; ou ρd = ρt/(1 + w/100) com umidade de amostra (eq. 2). GC = ρd / ρd,máx × 100 (9.4).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.modelo) rows.push(["Correlação / modelo do aparelho", P.modelo]);
        rows.push(["Correções aplicadas", "densidade " + (r.corrD >= 0 ? "+" : "") + fmt(r.corrD, 0) + " kg/m³" + (doAparelho(P) ? "; umidade " + (r.corrW >= 0 ? "+" : "") + fmt(r.corrW, 2) + " p.p." : "") + " — " + r.origem]);
        rows.push(["Referência de laboratório / umidade ótima", fmt(r.meLab, 3) + " g/cm³ / " + fmt(r.hOt, 1) + " %"]);
        r.pts.forEach(function (o, i) {
          rows.push(["Ponto " + (i + 1) + (o.estaca ? " — " + o.estaca : "") + (o.posicao ? " (" + o.posicao + ")" : ""),
            "T = " + fmt(o.temp, 0) + " °C · ρt = " + fmt(o.rt, 0) + " kg/m³ · w = " + fmt(o.w, 1) + " % · ρd = " + fmt(o.meas, 3) + " g/cm³ · GC = " + fmt(o.GC, 1) + " %" +
            (o.conforme === null ? "" : o.conforme ? " · conforme" : " · ABAIXO DO MÍNIMO")]);
        });
        if (ok(r.sdPrec)) rows.push(["Precisão do medidor (Anexo C)", fmt(r.sdPrec, 1) + " kg/m³ (desvio-padrão das medições repetidas)"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Regularização do subleito — calibração in situ em 3 locais, w pelo aparelho (dados gerados)", dados: function () {
        var F164 = FE.FICHAS["dnit-164-2013-me"], ref = F164.calcular(F164.exemplos[1].dados()).resultados;
        var meLab = Math.round(ref.gsMax * 1000) / 1000, hOt = Math.round(ref.hOt * 10) / 10;
        var CD = -18, CW = 0.8;  // aparelho lê 18 kg/m³ a mais e 0,8 p.p. a menos que as referências
        var dv = [-5, 3, 1, 4, -3], dw = [0.2, -0.1, 0, 0.1, -0.2];
        function local(nome, t, rtRef, wRef) {
          var c = { local: nome, temp: String(t), rRef: String(rtRef), wRef: fmt(wRef, 1) };
          for (var j = 0; j < 5; j++) { c["r" + (j + 1)] = String(Math.round(rtRef - CD + dv[j])); c["w" + (j + 1)] = fmt(wRef - CW + dw[j], 1); }
          return c;
        }
        // [estaca, posição, T, GC alvo, w alvo]
        var alvo = [["402", "LD", 27, 100.8, 21.4], ["404", "eixo", 28, 101.6, 22.2], ["406", "LE", 29, 100.3, 22.9], ["408", "eixo", 30, 102.0, 21.0]];
        var lv = [[-3, 4, -1], [2, -2, 0], [4, -3, 1], [-1, 2, -2]], lw = [[0.1, -0.1, 0], [-0.2, 0.1, 0.1], [0, 0.2, -0.2], [0.1, 0, -0.1]];
        return { ident: { registro: "EX-DE-001", data: "2026-08-25", obra: "Obra A", trecho: "BR-000 — km 30 ao km 31", camada: "Regularização do subleito", origem: "Jazida 1", laboratorista: "Equipe de campo" },
          params: { equipamento: "Densímetro eletromagnético — modelo Y, nº de série 0000", modelo: "Modelo de fábrica \"argila siltosa\"; ρd,máx e h ótima do Proctor normal inseridos",
            dataFab: "2026-02-10", unidade: "kgm3", umid: "w", correcao: "calib", tCal: "28", importar: "ex:dnit-164-2013-me:1",
            meLab: fmt(meLab, 3), hOt: fmt(hOt, 1), labRegistro: "EX-002 · Corte km 12 (exemplo Proctor normal)", gcMin: "100", nPrec: "20", sdPrec: "6,2" },
          cal: [local("400 LD", 26, 1912, 19.8), local("401 eixo", 28, 1968, 22.1), local("403 LE", 30, 1990, 24.6)],
          pts: alvo.map(function (a, i) {
            var rd = a[3] / 100 * meLab * 1000, rt = rd * (1 + a[4] / 100), p = { estaca: a[0], posicao: a[1], cota: "topo do subleito", temp: String(a[2]) };
            for (var j = 0; j < 3; j++) { p["r" + (j + 1)] = String(Math.round(rt - CD + lv[i][j])); p["w" + (j + 1)] = fmt(a[4] - CW + lw[i][j], 1); }
            return p;
          }) };
      } },
      { nome: "Base granular — correções informadas, solo quente e ponto abaixo do mínimo (dados gerados)", dados: function () {
        var F164 = FE.FICHAS["dnit-164-2013-me"], ref = F164.calcular(F164.exemplos[2].dados()).resultados;
        var meLab = Math.round(ref.gsMax * 1000) / 1000, hOt = Math.round(ref.hOt * 10) / 10;
        var CD = 25, CW = -0.5;
        var alvo = [["512", "LD", 33, 100.7, 6.4], ["514", "eixo", 38, 97.8, 7.9], ["516", "LE", 42, 101.2, 6.1]];
        var lv = [[-4, 2, 3], [3, -2, -1], [1, -3, 2]];
        return { ident: { registro: "EX-DE-002", data: "2026-09-22", obra: "Obra B", trecho: "Rua A", camada: "Base — solo-brita", origem: "Jazida 4" },
          params: { equipamento: "Densímetro eletromagnético — modelo Y, nº de série 0000", modelo: "Modelo \"solo-agregado\" com correções da calibração de 12/09/2026",
            dataFab: "2025-06-30", unidade: "gcm3", umid: "mw", correcao: "manual", corrD: fmt(CD, 0), corrW: fmt(CW, 1), tCal: "26",
            importar: "ex:dnit-164-2013-me:2", meLab: fmt(meLab, 3), hOt: fmt(hOt, 1), labRegistro: "EX-003 · Jazida 4 (exemplo Proctor modificado)", gcMin: "100" },
          obs: "Leituras à tarde com a superfície aquecida; ponto da estaca 514 recompactado e reensaiado no dia seguinte.",
          pts: alvo.map(function (a, i) {
            var rd = a[3] / 100 * meLab * 1000, w = a[4] - CW, rt = rd * (1 + a[4] / 100) - CD, mw = rt * w / (100 + w);
            var p = { estaca: a[0], posicao: a[1], cota: "topo da base", temp: String(a[2]) };
            for (var j = 0; j < 3; j++) { p["r" + (j + 1)] = fmt((rt + lv[i][j]) / 1000, 3); p["m" + (j + 1)] = fmt((mw + lv[i][j] * 0.05) / 1000, 3); }
            return p;
          }) };
      } },
    ],
  };
})();
