/*
 * Ficha: DNIT 135/2018-ME — Misturas asfálticas — Módulo de resiliência (compressão diametral, carga repetida).
 * O equipamento fornece, para cada corpo de prova e cada nível de carga, a carga cíclica e os deslocamentos
 * dos cinco últimos ciclos (7.1); a ficha aplica as fórmulas da seção 7 e as verificações das seções 3, 5, 6 e 8.
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, media = FE.media;
  var NIV = [1, 2, 3];  // carga inicial, +5 %, +10 % (6.6)

  // coeficiente de Poisson pela razão |ΔH/ΔV| (eqs. 9 a 12)
  function poisson(r, sensor) {
    if (!ok(r)) return NaN;
    r = Math.abs(r);
    return sensor === "14" ? (-0.14 + 0.49 * r) / (0.45 - 0.16 * r) : (-0.23 + 1.07 * r) / (0.78 - 0.31 * r);
  }
  // fator de forma de MI e MT conforme o comprimento de medida (eqs. 14 a 19)
  function fatorMIMT(mu, sensor) {
    if (!ok(mu)) return NaN;
    return sensor === "12" ? 0.23 + 0.78 * mu : sensor === "14" ? 0.14 + 0.45 * mu : 0.27 + mu;
  }
  function leit(x, pref, n) {
    var v = [];
    for (var i = 1; i <= n; i++) { var a = num(x[pref + i]); if (ok(a)) v.push(a); }
    return v;
  }
  function desvioMax(vals) {  // maior afastamento (%) de um valor em relação à média do conjunto
    var v = vals.filter(ok), m = media(v);
    if (v.length < 2 || !(m !== 0)) return NaN;
    return Math.max.apply(null, v.map(function (x) { return Math.abs(x - m) / Math.abs(m) * 100; }));
  }

  FE.FICHAS["dnit-135-2018-me"] = {
    titulo: "Misturas asfálticas — Módulo de resiliência",
    resumo: "Compressão diametral sob carga repetida a 25 °C (pulso de 0,1 s e repouso de 0,9 s). Para cada CP, três níveis de carga (inicial, +5 % e +10 %), cada um com a média dos cinco últimos de 15 ciclos: MR = P·(0,2692 + 0,9976μ)/(ΔH·t) (eq. 13); opcionalmente coeficiente de Poisson (eqs. 9–12), módulo instantâneo e módulo total (eqs. 14–19). Resultado: média dos três níveis e de pelo menos três CPs (8).",
    blocos: [],
    rotuloImportar: function (r) { return "MR " + (ok(r.mr) ? fmt(r.mr, 0) : "—") + " MPa"; },
    params: [
      { k: "mistura", r: "Mistura asfáltica", ph: "ex.: CBUQ faixa C, CAP 50/70, 5,3 %" },
      { k: "origem", r: "Origem dos corpos de prova (5.1, 5.2)", tipo: "select", recarrega: true,
        opcoes: [["lab", "Moldados em laboratório (Marshall ou giratório)"], ["pista", "Extraídos da pista"]],
        dica: "laboratório: resultado = média de pelo menos três CPs semelhantes (8)" },
      { k: "importarRT", r: "Resistência à tração: importar de um ensaio salvo (DNIT 136)", tipo: "importar", de: "dnit-136-2018-me",
        dica: "traz a RT média para conferir a faixa de carga de 5 % a 25 % da RT (6.1)",
        aplicar: function (e, P) {
          var r = e.resultados || {}, i = (e.dados || {}).ident || {};
          if (ok(r.rt)) P.rt = fmt(r.rt, 3);
          P.rtRegistro = (i.registro || "ensaio salvo") + (i.camada ? " · " + i.camada : "");
        } },
      { k: "rtRegistro", r: "Ensaio de resistência à tração de origem" },
      { k: "rt", r: "Resistência à tração média — RT (MPa) (6.1)", ph: "ex.: 1,20",
        dica: "de pelo menos 3 CPs de mesmas características (DNIT 136-ME); a carga cíclica deve ficar entre 5 % e 25 % da RT" },
      { k: "sensor", r: "Medida do deslocamento horizontal (4.5)", tipo: "select", recarrega: true,
        opcoes: [["1", "LVDT externo — comprimento de medida de 1 diâmetro (alça)"], ["12", "LVDT interno — ½ diâmetro (colado nas faces)"],
          ["14", "LVDT interno — ¼ de diâmetro (colado nas faces)"]] },
      { k: "poisson", r: "Coeficiente de Poisson (4.5, 7.2)", tipo: "select", recarrega: true,
        opcoes: function (d) {
          var o = [["adotado", "Adotado (só o sensor horizontal)"]];
          if (((d || {}).params || {}).sensor && d.params.sensor !== "1") o.push(["medido", "Medido — deslocamentos horizontal e vertical (sensores internos)"]);
          return o;
        } },
      { k: "mu", r: "Coeficiente de Poisson adotado", tipo: "select", opcoes: [["0,30", "0,30 (prática corrente a 25 °C — nota de 7.3)"], ["0,25", "0,25 (4.5)"]],
        se: function (d) { return (d.params || {}).poisson !== "medido" || (d.params || {}).sensor === "1"; } },
      { k: "modulos", r: "Módulos calculados", tipo: "select", recarrega: true,
        opcoes: [["mr", "Só o módulo de resiliência (MR)"], ["todos", "MR, módulo instantâneo (MI) e módulo total (MT)"]] },
      { k: "unidade", r: "Unidade dos deslocamentos", tipo: "select", recarrega: true, opcoes: [["mm", "mm"], ["um", "µm (10⁻³ mm)"]] },
      { k: "temperatura", r: "Temperatura do ensaio (°C)", ph: "25", dica: "25 ± 0,5 °C, condicionamento mínimo de 4 h (6.2)" },
    ],
    padrao: { origem: "lab", sensor: "1", poisson: "adotado", mu: "0,30", modulos: "mr", unidade: "mm", temperatura: "25" },
    tabelas: function (d) {
      var P = d.params || {}, u = P.unidade === "um" ? "µm" : "mm";
      var medido = P.poisson === "medido" && P.sensor !== "1", todos = P.modulos === "todos";
      var L = [{ k: "id", r: "Identificação do CP", texto: true }, { grupo: "Dimensões — paquímetro, 0,1 mm (5.3)" }];
      [1, 2, 3, 4].forEach(function (i) { L.push({ k: "d" + i, r: "Diâmetro — leitura " + i, u: "mm" }); });
      L.push({ calc: "D", r: "Diâmetro médio", u: "mm", casas: 1 });
      [1, 2, 3, 4].forEach(function (i) { L.push({ k: "h" + i, r: "Altura — leitura " + i + " (a 90°)", u: "mm" }); });
      L.push({ calc: "t", r: "Altura (espessura) média — t", u: "mm", casas: 1 },
        { k: "pc", r: "Carga de contato Pc (3.3)", u: "N", ph: "25 a 75" });
      NIV.forEach(function (n) {
        L.push({ grupo: "Nível " + n + (n === 1 ? " — carga inicial" : n === 2 ? " — carga inicial + 5 %" : " — carga inicial + 10 %") +
          " (média dos 5 últimos de 15 ciclos, 6.6–6.7)" });
        L.push({ k: "p" + n, r: "Carga cíclica P", u: "N" }, { k: "dh" + n, r: "ΔH resiliente — interseção das tangentes (eq. 4)", u: u });
        if (todos || medido) L.push({ k: "hi" + n, r: "ΔHins — deslocamento horizontal instantâneo (eq. 5)", u: u },
          { k: "ht" + n, r: "ΔHt — deslocamento horizontal total (eq. 7)", u: u });
        if (medido) L.push({ k: "vi" + n, r: "ΔVins — deslocamento vertical instantâneo", u: u },
          { k: "vt" + n, r: "ΔVt — deslocamento vertical total", u: u });
        L.push({ calc: "pct" + n, r: "Tensão de tração / RT (6.1: 5 % a 25 %)", u: "%", casas: 1 });
        if (medido) L.push({ calc: "mui" + n, r: "μins (eq. " + (P.sensor === "14" ? "10" : "9") + ")", u: "", casas: 3 },
          { calc: "mut" + n, r: "μt (eq. " + (P.sensor === "14" ? "12" : "11") + ")", u: "", casas: 3 });
        L.push({ calc: "mr" + n, r: "MR (eq. 13)", u: "MPa", casas: 0 });
        if (todos) L.push({ calc: "mi" + n, r: "MI (eq. " + (P.sensor === "12" ? "15" : P.sensor === "14" ? "16" : "14") + ")", u: "MPa", casas: 0 },
          { calc: "mt" + n, r: "MT (eq. " + (P.sensor === "12" ? "18" : P.sensor === "14" ? "19" : "17") + ")", u: "MPa", casas: 0 });
      });
      L.push({ grupo: "Resultado do CP — média dos três níveis (8)" });
      if (medido) L.push({ calc: "mui", r: "Coeficiente de Poisson μins", u: "", casas: 2 }, { calc: "mut", r: "Coeficiente de Poisson μt", u: "", casas: 2 });
      L.push({ calc: "mr", r: "Módulo de resiliência MR", u: "MPa", casas: 0, destaque: true },
        { calc: "dvMr", r: "Maior afastamento de um nível em relação à média (6.7: ≤ 5 %)", u: "%", casas: 1 });
      if (todos) L.push({ calc: "mi", r: "Módulo instantâneo MI", u: "MPa", casas: 0 }, { calc: "mt", r: "Módulo total MT", u: "MPa", casas: 0 });
      return [{ chave: "cp", titulo: "Corpos de prova", rotulo: "CP", iniciais: 3, min: 1, linhas: L,
        dica: "uma coluna por CP; carga e deslocamentos lidos no programa do equipamento (média dos cinco últimos ciclos de cada conjunto de 15)" }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], fu = P.unidade === "um" ? 0.001 : 1;
      var medido = P.poisson === "medido" && P.sensor !== "1", todos = P.modulos === "todos", pista = P.origem === "pista";
      var muAd = num(P.mu || "0,30"), rt = num(P.rt);
      var pctFora = [], pcFora = [], incr = [], dim = [], niv67 = [], semMu = [];
      var cps = (d.cp || []).map(function (x, i) {
        var rot = "CP " + (x.id || i + 1);
        var ld = leit(x, "d", 4), lh = leit(x, "h", 4);
        var o = { D: media(ld), t: media(lh) }, pc = num(x.pc);
        if (ok(o.D) && (o.D < 97.8 || o.D > 105.4)) dim.push(rot + ": diâmetro " + fmt(o.D, 1) + " mm (101,6 ± 3,8 mm)");
        if (ok(o.t) && (o.t < 35 || o.t > 70)) dim.push(rot + ": altura " + fmt(o.t, 1) + " mm (35 a 70 mm)");
        if ((ld.length && ld.length < 4) || (lh.length && lh.length < 4)) dim.push(rot + ": D e t são médias de 4 leituras (5.3)");
        if (ok(pc) && (pc < 25 || pc > 75)) pcFora.push(rot + " (" + fmt(pc, 0) + " N)");
        var mrs = [], mis = [], mts = [], muis = [], muts = [], pp = [];
        NIV.forEach(function (n) {
          var p = num(x["p" + n]), dh = num(x["dh" + n]) * fu, hi = num(x["hi" + n]) * fu, ht = num(x["ht" + n]) * fu;
          var vi = num(x["vi" + n]) * fu, vt = num(x["vt" + n]) * fu;
          pp.push(p);
          if (ok(p) && ok(o.D) && ok(o.t) && ok(rt) && rt > 0) {
            o["pct" + n] = 2 * p / (Math.PI * o.D * o.t) / rt * 100;
            if (o["pct" + n] < 5 || o["pct" + n] > 25) pctFora.push(rot + " nível " + n + " (" + fmt(o["pct" + n], 1) + " %)");
          }
          var mui = medido && ok(hi) && ok(vi) && vi !== 0 ? poisson(hi / vi, P.sensor) : NaN;
          var mut = medido && ok(ht) && ok(vt) && vt !== 0 ? poisson(ht / vt, P.sensor) : NaN;
          o["mui" + n] = mui; o["mut" + n] = mut;
          var muMR = medido ? mui : muAd, muT = medido ? mut : muAd;
          if (medido && ok(p) && !ok(mui)) semMu.push(rot + " nível " + n);
          o["mr" + n] = ok(p) && ok(dh) && dh !== 0 && ok(o.t) && ok(muMR) ? p / (Math.abs(dh) * o.t) * (0.2692 + 0.9976 * muMR) : NaN;
          if (todos) {
            o["mi" + n] = ok(p) && ok(hi) && hi !== 0 && ok(o.t) ? p / (Math.abs(hi) * o.t) * fatorMIMT(muMR, P.sensor) : NaN;
            o["mt" + n] = ok(p) && ok(ht) && ht !== 0 && ok(o.t) ? p / (Math.abs(ht) * o.t) * fatorMIMT(muT, P.sensor) : NaN;
            mis.push(o["mi" + n]); mts.push(o["mt" + n]);
          }
          mrs.push(o["mr" + n]); muis.push(mui); muts.push(mut);
        });
        if (ok(pp[0]) && pp[0] > 0) [1, 2].forEach(function (k) {
          if (!ok(pp[k])) return;
          var inc = (pp[k] / pp[0] - 1) * 100, alvo = 5 * k;
          if (Math.abs(inc - alvo) > 1) incr.push(rot + " nível " + (k + 1) + ": +" + fmt(inc, 1) + " % (previsto +" + alvo + " %)");
        });
        o.mr = media(mrs); o.mi = media(mis); o.mt = media(mts); o.mui = media(muis); o.mut = media(muts);
        o.dvMr = desvioMax(mrs);
        [["MR", mrs], ["MI", mis], ["MT", mts], ["μins", muis], ["μt", muts]].forEach(function (par) {
          var dv = desvioMax(par[1]);
          if (ok(dv) && dv > 5) niv67.push(rot + " — " + par[0] + ": " + fmt(dv, 1) + " %");
        });
        o.nNiv = mrs.filter(ok).length;
        if (o.nNiv && o.nNiv < 3) avisos.push(rot + ": só " + o.nNiv + " nível(is) de carga — o resultado é a média dos três níveis (6.6, 8).");
        return o;
      });
      if (dim.length) avisos.push("Dimensões fora do especificado (5.1, 5.3): " + dim.join("; ") + ".");
      if (!ok(rt)) avisos.push("Informe a resistência à tração (RT) média — a carga cíclica deve ficar entre 5 % e 25 % da RT (6.1).");
      if (pctFora.length) avisos.push("Carga fora da faixa de 5 % a 25 % da RT (6.1): " + pctFora.join("; ") + ".");
      if (pcFora.length) avisos.push("Carga de contato fora de 25 a 75 N (3.3): " + pcFora.join("; ") + ".");
      if (incr.length) avisos.push("Incremento de carga diferente de 5 % por nível (6.6; a norma não fixa tolerância — aviso acima de ± 1 ponto): " + incr.join("; ") + ".");
      if (niv67.length) avisos.push("Média de um nível de carga difere mais de 5 % da média global (6.7) — repita o ensaio do CP: " + niv67.join("; ") + ".");
      if (semMu.length) avisos.push("Poisson medido: faltam ΔHins/ΔVins em " + semMu.join(", ") + " — sem μins não há MR nesses níveis.");
      if (P.sensor !== "1") avisos.push("A eq. 13 (MR) é dada para ΔH medido no diâmetro com sensor externo, em CP de 101,6 mm (7.3); com sensor interno, confira se o ΔH informado corresponde a essa condição.");
      if (medido) cps.forEach(function (o, i) {
        [o.mui, o.mut].forEach(function (mu) {
          if (ok(mu) && (mu < 0.1 || mu > 0.5)) avisos.push("CP " + ((d.cp[i] || {}).id || i + 1) + ": coeficiente de Poisson de " + fmt(mu, 2) + " — valor fora do usual (0,1 a 0,5); confira os deslocamentos.");
        });
      });
      var t = num(P.temperatura);
      if (ok(t) && Math.abs(t - 25) > 0.5) avisos.push("Ensaio a " + fmt(t, 1) + " °C (usual 25 ± 0,5 °C, 1 e 6.2); informe a temperatura no relatório.");
      var mrV = cps.map(function (o) { return o.mr; }).filter(ok);
      var r = { mr: media(mrV), n: mrV.length, individuais: mrV, pista: pista, medido: medido, todos: todos,
        mi: media(cps.map(function (o) { return o.mi; }).filter(ok)), mt: media(cps.map(function (o) { return o.mt; }).filter(ok)),
        mui: media(cps.map(function (o) { return o.mui; }).filter(ok)), mut: media(cps.map(function (o) { return o.mut; }).filter(ok)),
        mu: medido ? NaN : muAd, dp: NaN, cv: NaN, rt: rt };
      if (mrV.length > 1) {
        r.dp = Math.sqrt(mrV.reduce(function (s, v) { return s + (v - r.mr) * (v - r.mr); }, 0) / (mrV.length - 1));
        r.cv = r.dp / r.mr * 100;
      }
      if (!pista && mrV.length && mrV.length < 3) avisos.push("CPs de laboratório: use pelo menos três CPs semelhantes e a média dos três (8); há " + mrV.length + ".");
      return { tab: { cp: cps }, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      function cx(v, u, rot, casas, p) {
        return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + fmt(v, casas) + " <small>" + u + '</small></div><div class="fe-res-r">' + rot + "</div></div>";
      }
      var h = '<div class="fe-res">' + cx(r.mr, "MPa", r.pista ? "MR — média dos CPs extraídos (cada CP vale por si)" : "Módulo de resiliência — média de " + r.n + " CP(s)", 0);
      if (r.pista && r.n) h += '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + r.individuais.map(function (v) { return fmt(v, 0); }).join(" · ") + ' <small>MPa</small></div><div class="fe-res-r">MR de cada CP</div></div>';
      if (ok(r.cv)) h += cx(r.cv, "%", "Coeficiente de variação entre CPs (informativo)", 1, true);
      if (r.medido) h += cx(r.mui, "", "Coeficiente de Poisson instantâneo (médio)", 2, true) + cx(r.mut, "", "Coeficiente de Poisson total (médio)", 2, true);
      else h += cx(r.mu, "", "Coeficiente de Poisson adotado", 2, true);
      if (r.todos) h += cx(r.mi, "MPa", "Módulo instantâneo MI (médio)", 0, true) + cx(r.mt, "MPa", "Módulo total MT (médio)", 0, true);
      return h + "</div>";
    },
    relatorio: {
      parametros: [["Carregamento", "Pulso haversine de 0,1 s + repouso de 0,9 s (1 Hz); 50 ciclos de condicionamento; 3 × 15 ciclos (carga inicial, +5 %, +10 %)"]],
      notas: "MR = P·(0,2692 + 0,9976μ)/(|ΔH|·t) (eq. 13), com P em N, ΔH (interseção das tangentes aos segmentos 1 e 3, eq. 4) e t em mm → MPa. Poisson medido: μ = (−0,23 + 1,07|ΔH/ΔV|)/(0,78 − 0,31|ΔH/ΔV|) para ½ diâmetro (eqs. 9, 11) ou (−0,14 + 0,49|ΔH/ΔV|)/(0,45 − 0,16|ΔH/ΔV|) para ¼ (eqs. 10, 12); no MR usa-se μins (nota de 7.4). MI = P·(0,27 + μ)/(|ΔHins|·t) para 1 diâmetro, (0,23 + 0,78μ) para ½ e (0,14 + 0,45μ) para ¼ (eqs. 14–16); MT idem com ΔHt e μt (eqs. 17–19). Cada nível = média dos cinco últimos de 15 ciclos; a média de cada nível não pode diferir mais de 5 % da média global (6.7). Resultado = média dos três níveis; CPs de laboratório: média de pelo menos três CPs (8). Carga cíclica entre 5 % e 25 % da RT (6.1), verificada pela tensão 2P/(π·D·t).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.mistura) rows.push(["Mistura", P.mistura]);
        rows.push(["Módulo de resiliência" + (r.pista ? " (CPs extraídos — média)" : " (média de " + r.n + " CPs)"), fmt(r.mr, 0) + " MPa"]);
        if (r.n > 1) rows.push(["MR de cada CP", r.individuais.map(function (v) { return fmt(v, 0); }).join("; ") + " MPa" + (ok(r.cv) ? " (CV " + fmt(r.cv, 1) + " %)" : "")]);
        rows.push(["Coeficiente de Poisson", r.medido ? "determinado — μins " + fmt(r.mui, 2) + "; μt " + fmt(r.mut, 2) : "adotado — " + fmt(r.mu, 2)]);
        if (r.todos) rows.push(["Módulo instantâneo / módulo total", fmt(r.mi, 0) + " / " + fmt(r.mt, 0) + " MPa"]);
        if (ok(r.rt)) rows.push(["Resistência à tração (DNIT 136)", fmt(r.rt, 2) + " MPa" + (P.rtRegistro ? " — " + P.rtRegistro : "")]);
        rows.push(["Temperatura do ensaio", (P.temperatura || "25") + " °C"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "CBUQ faixa C — 3 CPs, LVDT externo, Poisson adotado 0,30", dados: function () {
        // valores-alvo: MR ≈ 4.850 / 5.120 / 4.700 MPa; RT = 1,15 MPa; P1 ≈ 10 % da RT; ΔH = P(0,2692 + 0,9976·0,30)/(MR·t)
        var cps = [["1", [101.6, 101.7, 101.5, 101.6], [63.4, 63.6, 63.5, 63.3], 50, 1165, 4850, [1, 0.99, 1.01]],
          ["2", [101.5, 101.6, 101.6, 101.7], [62.8, 62.9, 63.1, 63.0], 48, 1150, 5120, [1.01, 1, 0.99]],
          ["3", [101.7, 101.6, 101.6, 101.8], [64.1, 64.0, 63.8, 64.1], 52, 1180, 4700, [0.99, 1.01, 1]]];
        return { ident: { registro: "EX-MR-001", camada: "Capa — CBUQ faixa C", origem: "Usina A" },
          params: { mistura: "CBUQ faixa C, CAP 50/70, 5,3 %", origem: "lab", rt: "1,15", rtRegistro: "EX-RT (valor informado)", sensor: "1",
            poisson: "adotado", mu: "0,30", modulos: "todos", unidade: "mm", temperatura: "25" },
          cp: cps.map(function (c) {
            var x = { id: c[0], pc: String(c[3]) }, t = media(c[2]);
            c[1].forEach(function (v, i) { x["d" + (i + 1)] = fmt(v, 1); });
            c[2].forEach(function (v, i) { x["h" + (i + 1)] = fmt(v, 1); });
            NIV.forEach(function (n, k) {
              var p = Math.round(c[4] * (1 + 0.05 * k)), mr = c[5] * c[6][k];
              var dh = p * (0.2692 + 0.9976 * 0.3) / (mr * t);
              x["p" + n] = String(p); x["dh" + n] = fmt(dh, 5);
              x["hi" + n] = fmt(p * (0.27 + 0.3) / (mr * 1.08 * t), 5);   // MI ≈ 1,08·MR
              x["ht" + n] = fmt(p * (0.27 + 0.3) / (mr * 0.82 * t), 5);   // MT ≈ 0,82·MR
            });
            return x;
          }) };
      } },
      { nome: "Sensores internos (½ diâmetro), Poisson medido — nível fora de 5 % e carga acima de 25 % da RT", dados: function () {
        // alvos: μins ≈ 0,28 / 0,31 / 0,33; razão |ΔH/ΔV| obtida invertendo a eq. 9: r = (0,23 + 0,78μ)/(1,07 + 0,31μ)
        // CP B: MR do nível 3 cerca de 12 % acima (6.7); CP C: carga inicial de 3.500 N (≈ 26 % da RT)
        function razao(mu) { return (0.23 + 0.78 * mu) / (1.07 + 0.31 * mu); }
        var cps = [["A", 101.4, 60.2, 40, 1250, 3900, [1, 1.01, 0.99], 0.28], ["B", 101.6, 61.0, 45, 1260, 4100, [1, 1.02, 1.12], 0.31],
          ["C", 101.5, 60.6, 60, 3500, 4000, [1, 0.99, 1.01], 0.33]];
        return { ident: { registro: "EX-MR-002", obra: "Obra B", camada: "Binder — CBUQ faixa B", origem: "Usina B" },
          params: { mistura: "CBUQ faixa B, CAP 30/45", origem: "lab", rt: "1,40", sensor: "12", poisson: "medido", modulos: "mr", unidade: "um", temperatura: "25" },
          cp: cps.map(function (c) {
            var x = { id: c[0], pc: String(c[3]) };
            [0.1, -0.1, 0.0, 0.1].forEach(function (e, i) { x["d" + (i + 1)] = fmt(c[1] + e, 1); x["h" + (i + 1)] = fmt(c[2] - e, 1); });
            NIV.forEach(function (n, k) {
              var p = Math.round(c[4] * (1 + 0.05 * k)), mr = c[5] * c[6][k], mu = c[7];
              var dh = p * (0.2692 + 0.9976 * mu) / (mr * c[2]) * 1000;  // µm
              x["p" + n] = String(p); x["dh" + n] = fmt(dh, 3);
              var hi = dh * 0.47;  // ΔH instantâneo no comprimento de ½ diâmetro
              x["vi" + n] = fmt(hi / razao(mu), 3); x["hi" + n] = fmt(hi, 3);
              x["vt" + n] = fmt(hi * 1.2 / razao(mu + 0.02), 3); x["ht" + n] = fmt(hi * 1.2, 3);
            });
            return x;
          }) };
      } },
    ],
  };
})();
