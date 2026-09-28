/*
 * Ficha: DNER-ME 202/94 — Solo-cimento — Moldagem e cura de corpos de prova cilíndricos (registro e aceitação).
 * Molde de 1 000 cm³ (Ø 100 × 127,3 mm), 3 camadas × 25 golpes do soquete de 2,5 kg (305 mm); umidade h (6.1.1),
 * γs = γu / (h + 100) × 100 (6.1.2); CP rejeitado se |h − ho| > 1 ou |γs − γm| > 0,030 g/cm³ (6.2.3);
 * cura em câmara úmida 23 ± 2 °C, UR ≥ 95 %, 7 dias na dosagem (5.3). ho e γm podem vir da DNER-ME 216 salva.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var VOL = 1000, TOL_H = 1, TOL_G = 0.030;
  var METODOS = { A: "Método A — passante na 4,8 mm (1.2 a)", B: "Método B — passante na 19 mm, parte retida na 4,8 mm (1.2 b)" };

  function grafico(calc, d, opt) {
    opt = opt || {};
    var r = calc.resultados, cps = calc.tab.cp.filter(function (o) { return ok(o.h) && ok(o.gs); });
    if (!cps.length) return '<div class="fe-graf-vazio">O gráfico aparece com a umidade e a massa específica dos CPs.</div>';
    var W = opt.w || 560, H = opt.h || 280, m = { l: 58, r: 16, t: 16, b: 40 };
    var xs = cps.map(function (o) { return o.h; }), ys = cps.map(function (o) { return o.gs; });
    if (ok(r.ho)) xs = xs.concat([r.ho - 1.6, r.ho + 1.6]);
    if (ok(r.gm)) ys = ys.concat([r.gm - 0.05, r.gm + 0.05]);
    var x0 = Math.floor(Math.min.apply(null, xs) - 0.5), x1 = Math.ceil(Math.max.apply(null, xs) + 0.5);
    var y0 = Math.floor((Math.min.apply(null, ys) - 0.01) * 100) / 100, y1 = Math.ceil((Math.max.apply(null, ys) + 0.01) * 100) / 100;
    function X(v) { return m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r); }
    function Y(v) { return H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b); }
    var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)", eixo = imp ? "#333" : "var(--text-dim)";
    var cOk = imp ? "#1e8a5a" : "#34c38f", cNok = imp ? "#c0392b" : "#e5534b", cBox = imp ? "#1f5fbf" : "#4f8cff";
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11">';
    for (var gx = x0; gx <= x1 + 1e-9; gx += 1) {
      s += '<line x1="' + X(gx) + '" y1="' + m.t + '" x2="' + X(gx) + '" y2="' + (H - m.b) + '" stroke="' + grade + '" stroke-width="0.6"/>' +
        '<text x="' + X(gx) + '" y="' + (H - m.b + 15) + '" text-anchor="middle" fill="' + txt + '">' + gx + "</text>";
    }
    var passo = (y1 - y0) > 0.15 ? 0.02 : 0.01;
    for (var gy = Math.ceil(y0 / passo) * passo; gy <= y1 + 1e-9; gy += passo) {
      s += '<line x1="' + m.l + '" y1="' + Y(gy) + '" x2="' + (W - m.r) + '" y2="' + Y(gy) + '" stroke="' + grade + '" stroke-width="0.6"/>' +
        '<text x="' + (m.l - 6) + '" y="' + (Y(gy) + 4) + '" text-anchor="end" fill="' + txt + '">' + fmt(gy, 2) + "</text>";
    }
    s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + eixo + '"/>' +
      '<text x="' + ((W + m.l - m.r) / 2) + '" y="' + (H - 6) + '" text-anchor="middle" fill="' + txt + '">Umidade de moldagem h (%)</text>' +
      '<text transform="translate(14 ' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + txt + '">γs (g/cm³)</text>';
    if (ok(r.ho) && ok(r.gm)) {
      s += '<rect x="' + X(r.ho - TOL_H) + '" y="' + Y(r.gm + TOL_G) + '" width="' + (X(r.ho + TOL_H) - X(r.ho - TOL_H)) + '" height="' + (Y(r.gm - TOL_G) - Y(r.gm + TOL_G)) +
        '" fill="' + cBox + '" fill-opacity="0.10" stroke="' + cBox + '" stroke-dasharray="5 3"/>' +
        '<text x="' + (X(r.ho) + 4) + '" y="' + (Y(r.gm) - 4) + '" fill="' + cBox + '">+ ho ' + fmt(r.ho, 1) + " % · γm " + fmt(r.gm, 3) + "</text>" +
        '<text x="' + (X(r.ho + TOL_H) - 4) + '" y="' + (Y(r.gm + TOL_G) + 12) + '" text-anchor="end" fill="' + cBox + '" font-size="10">± 1 % · ± 0,030 g/cm³ (6.2.3)</text>';
    }
    calc.tab.cp.forEach(function (o, i) {
      if (!ok(o.h) || !ok(o.gs)) return;
      var c = o.aceito === false ? cNok : cOk;
      s += '<circle cx="' + X(o.h).toFixed(1) + '" cy="' + Y(o.gs).toFixed(1) + '" r="5" fill="' + c + '"/>' +
        '<text x="' + (X(o.h) + 7).toFixed(1) + '" y="' + (Y(o.gs) + 4).toFixed(1) + '" fill="' + txt + '">' + esc(o.nome) + "</text>";
    });
    return s + "</svg>";
  }

  FE.FICHAS["dner-me-202-94"] = {
    titulo: "Solo-cimento — Moldagem e cura de corpos de prova cilíndricos",
    resumo: "CPs de solo-cimento na energia normal (molde de 1 000 cm³, 3 camadas × 25 golpes, soquete de 2,5 kg, queda de 305 mm) para compressão axial (DNER-ME 201) e durabilidade (DNER-ME 203); h e γs de cada CP comparados com ho e γm da DNER-ME 216: rejeita-se o CP com desvio de umidade > 1 % ou de γs > 0,030 g/cm³ (6.2.3); cura em câmara úmida (5.3).",
    blocos: ["umidade"],
    params: [
      { k: "metodo", r: "Método (1.2)", tipo: "select", recarrega: true, opcoes: Object.keys(METODOS).map(function (k) { return [k, METODOS[k]]; }) },
      { k: "importar", r: "ho e γm: buscar compactação de solo-cimento salva (DNER-ME 216/94)", tipo: "importar", de: "dner-me-216-94",
        dica: "traz a umidade ótima e a massa específica aparente seca máxima (6.2.1 e 6.2.2)",
        aplicar: function (e, P) {
          var r = e.resultados || {}, i = (e.dados || {}).ident || {}, p = (e.dados || {}).params || {};
          if (ok(r.gsMax)) P.gm = fmt(r.gsMax, 3);
          if (ok(r.hOt)) P.ho = fmt(r.hOt, 1);
          if (p.metodo) P.metodo = p.metodo;
          if (p.cimento) P.cimento = p.cimento;
          if (p.tipoCimento) P.tipoCimento = p.tipoCimento;
          P.ref216 = (i.registro || "") + (i.origem ? " · " + i.origem : "") + (i.data ? " · " + i.data.split("-").reverse().join("/") : "");
        } },
      { k: "ref216", r: "Compactação de referência (DNER-ME 216/94)" },
      { k: "ho", r: "Umidade ótima ho (%)", dica: "3.2; DNER-ME 216/94" },
      { k: "gm", r: "Massa específica aparente seca máxima γm (g/cm³)", dica: "3.3; DNER-ME 216/94" },
      { k: "cimento", r: "Teor de cimento (%)", ph: "ex.: 6" },
      { k: "tipoCimento", r: "Cimento Portland", ph: "ex.: CP II-F-32" },
      { k: "hMist", r: "Umidade visada na mistura (%) — opcional", dica: "ho + 0,5 a 1,0 ponto, para compensar a evaporação (5.1.2.2 e 5.2.2.2)" },
      { k: "massaSolo", r: "Massa de solo seco preparada (g) — opcional", dica: "Método A: cerca de 2 500 g (5.1.1.1); Método B: mais de 3 000 g (5.2.1.4)" },
      { k: "retido", r: "Retido entre 4,8 e 19 mm na mistura (%) — Método B", se: function (d) { return (d.params || {}).metodo === "B"; },
        dica: "deve ser igual à porcentagem retida entre 76 e 4,8 mm na amostra original (5.2.1.4)" },
      { k: "retOrig", r: "Retido entre 76 e 4,8 mm na amostra original (%) — Método B", se: function (d) { return (d.params || {}).metodo === "B"; } },
      { k: "volume", r: "Volume do molde (cm³)", recarrega: "tabela", ph: String(VOL), dica: "1 000 ± 10 cm³ (4.1); use o volume aferido" },
      { k: "finalidade", r: "Finalidade da cura (5.3)", tipo: "select",
        opcoes: [["dosagem", "Dosagem — cura obrigatória de 7 dias completos"], ["controle", "Controle de obra / pesquisa — outra idade"]] },
      { k: "idade", r: "Período de cura (dias)", ph: "7" },
      { k: "tCam", r: "Temperatura da câmara úmida (°C)", ph: "23", dica: "23 ± 2 °C (5.3)" },
      { k: "urCam", r: "Umidade relativa da câmara (%)", ph: "≥ 95", dica: "não inferior a 95 % (5.3)" },
    ],
    padrao: { metodo: "A", finalidade: "dosagem" },
    tabelas: function (d) {
      var B = (d.params || {}).metodo === "B";
      var U = FE.BLOCOS.umidade.linhas("c1", "", "lab").map(function (l) {
        var o = Object.assign({}, l);
        o.r = { c1n: "Cápsula nº", c1t: "Cápsula (m)", c1u: "Cápsula + amostra úmida (mbu)", c1s: "Cápsula + amostra seca (mbs)" }[l.k] ||
          (l.calc === "c1W" ? "h = (mbu − mbs) / (mbs − m) × 100 (6.1.1)" : l.r);
        if (l.calc === "c1W") o.destaque = true;
        return o;
      });
      var linhas = [{ k: "id", r: "Identificação do CP", texto: true },
        { grupo: "Umidade de moldagem — amostra retirada ao colocar a 2ª camada: " + (B ? "≥ 280 g (5.2.2.3)" : "80 g a 120 g (5.1.2.3)") }]
        .concat(U).concat([
          { calc: "mUm", r: "Massa úmida da amostra de umidade", u: "g", casas: 1 },
          { grupo: "Corpo de prova — 3 camadas × 25 golpes, topo rasado (5.1.2.3 / 5.2.2.3)" },
          { k: "moldeN", r: "Molde nº", texto: true },
          { k: "moldeM", r: "Massa do molde", u: "g" },
          { k: "moldeV", r: "Volume do molde (v)", u: "cm³", padrao: "volume", padraoFixo: String(VOL) },
          { k: "moldeCP", r: "Molde + corpo de prova úmido (± 1 g)", u: "g" },
          { calc: "mu", r: "Massa do CP úmido mu", u: "g", casas: 0 },
          { calc: "gu", r: "γu = mu / v (6.1.2)", u: "g/cm³", casas: 3 },
          { calc: "gs", r: "γs = γu / (h + 100) × 100 (6.1.2)", u: "g/cm³", casas: 3, destaque: true },
          { grupo: "Tolerâncias (6.2) — rejeitar se |h − ho| > 1 ou |γs − γm| > 0,030 g/cm³" },
          { calc: "dh", r: "h − ho", u: "p.p.", casas: 1, destaque: true },
          { calc: "dg", r: "γs − γm", u: "g/cm³", casas: 3, destaque: true },
        ]);
      return [{ chave: "cp", titulo: "Corpos de prova", rotulo: "CP", iniciais: 3, min: 1, linhas: linhas,
        dica: "uma coluna por corpo de prova moldado" }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], B = P.metodo === "B";
      var ho = num(P.ho), gm = num(P.gm), V0 = ok(num(P.volume)) ? num(P.volume) : VOL;
      if (!ok(ho) || !ok(gm)) avisos.push("Informe (ou importe da DNER-ME 216/94) a umidade ótima e a massa específica aparente seca máxima para verificar as tolerâncias (6.2).");
      if (ok(num(P.volume)) && Math.abs(V0 - VOL) > 10) avisos.push("Volume do molde de " + fmt(V0, 1) + " cm³ — fora de 1 000 ± 10 cm³ (4.1).");
      var cps = (d.cp || []).map(function (x, i) {
        var nome = x.id ? String(x.id) : "CP " + (i + 1), rot = "CP " + (x.id || i + 1), o = { nome: nome };
        var u = FE.BLOCOS.umidade.calcular(x, "c1", "lab");
        o.c1W = u.w; o.h = u.w; o.mUm = u.mUmida;
        if (ok(o.mUm)) {
          if (B && o.mUm < 280) avisos.push(rot + ": amostra de umidade de " + fmt(o.mUm, 1) + " g — no Método B a massa não pode ser inferior a 280 g (5.2.2.3).");
          if (!B && (o.mUm < 80 || o.mUm > 120)) avisos.push(rot + ": amostra de umidade de " + fmt(o.mUm, 1) + " g — no Método A retira-se cerca de 80 g a 120 g (5.1.2.3).");
        }
        var V = ok(num(x.moldeV)) ? num(x.moldeV) : V0;
        if (ok(num(x.moldeV)) && Math.abs(V - VOL) > 10) avisos.push(rot + ": volume do molde de " + fmt(V, 1) + " cm³, fora de 1 000 ± 10 cm³ (4.1).");
        o.mu = num(x.moldeCP) - num(x.moldeM);
        o.gu = ok(o.mu) && o.mu > 0 ? o.mu / V : NaN;
        o.gs = ok(o.gu) && ok(o.h) ? o.gu / (o.h + 100) * 100 : NaN;
        o.dh = ok(o.h) && ok(ho) ? o.h - ho : NaN;
        o.dg = ok(o.gs) && ok(gm) ? o.gs - gm : NaN;
        o.aceito = null;
        if (ok(o.dh) || ok(o.dg)) {
          var foraH = ok(o.dh) && Math.round(Math.abs(o.dh) * 10) / 10 > TOL_H;
          var foraG = ok(o.dg) && Math.round(Math.abs(o.dg) * 1000) / 1000 > TOL_G;
          o.aceito = !(foraH || foraG);
          if (foraH) avisos.push(rot + ": umidade de moldagem de " + fmt(o.h, 1) + " % difere " + fmt(o.dh, 1) + " ponto(s) da ótima (" + fmt(ho, 1) + " %) — mais de 1 %: CP rejeitado (6.2.3).");
          if (foraG) avisos.push(rot + ": γs = " + fmt(o.gs, 3) + " g/cm³ difere " + fmt(o.dg, 3) + " g/cm³ de γm (" + fmt(gm, 3) + ") — mais de 0,030 g/cm³ (30 kg/m³): CP rejeitado (6.2.3).");
        }
        return o;
      });
      var hMist = num(P.hMist);
      if (ok(hMist) && ok(ho) && (Math.round((hMist - ho) * 10) / 10 < 0.5 || Math.round((hMist - ho) * 10) / 10 > 1)) avisos.push("Umidade visada na mistura de " + fmt(hMist, 1) + " % — a norma manda preparar a mistura com ho + 0,5 a 1,0 ponto (" + fmt(ho + 0.5, 1) + " a " + fmt(ho + 1, 1) + " %) para compensar a evaporação (5.1.2.2 / 5.2.2.2).");
      var ms = num(P.massaSolo);
      if (ok(ms) && !B && Math.abs(ms - 2500) > 250) avisos.push("Massa de solo de " + fmt(ms, 0) + " g — no Método A prepara-se cerca de 2 500 g por CP (5.1.1.1).");
      if (ok(ms) && B && ms <= 3000) avisos.push("Massa de amostra de " + fmt(ms, 0) + " g — no Método B a massa total deve ser superior a 3 000 g (5.2.1.4).");
      var ret = num(P.retido), retO = num(P.retOrig);
      if (B && ok(ret) && ok(retO) && Math.abs(ret - retO) > 0.5) avisos.push("Retido entre 4,8 e 19 mm na mistura (" + fmt(ret, 1) + " %) diferente do retido entre 76 e 4,8 mm na amostra original (" + fmt(retO, 1) + " %) — devem ser iguais (5.2.1.4).");
      if (B && ok(retO) && retO > 10 && ok(ms) && ms <= 3000) avisos.push("Mais de 10 % de partículas maiores que 4,8 mm: aumente a quantidade de amostra (5.2.1.4).");
      var idade = num(P.idade);
      if (P.finalidade === "dosagem" && ok(idade) && idade !== 7) avisos.push("Cura de " + fmt(idade, 0) + " dias — para dosagem de solo-cimento o período é obrigatoriamente de 7 dias completos (5.3).");
      var tc = num(P.tCam), ur = num(P.urCam);
      if (ok(tc) && Math.abs(tc - 23) > 2) avisos.push("Câmara úmida a " + fmt(tc, 1) + " °C — fora de 23 ± 2 °C (5.3).");
      if (ok(ur) && ur < 95) avisos.push("Umidade relativa da câmara de " + fmt(ur, 0) + " % — não pode ser inferior a 95 % (5.3).");
      var aval = cps.filter(function (o) { return o.aceito !== null; });
      return { tab: { cp: cps }, resultados: { ho: ho, gm: gm, n: cps.filter(function (o) { return ok(o.gs); }).length,
        aceitos: aval.filter(function (o) { return o.aceito; }).map(function (o) { return o.nome; }),
        rejeitados: aval.filter(function (o) { return !o.aceito; }).map(function (o) { return o.nome; }),
        hMedia: media(cps.map(function (o) { return o.h; })), gsMedia: media(cps.map(function (o) { return o.gs; })) }, avisos: avisos };
    },
    rotuloImportar: function (r) { return (r.aceitos || []).length + " CP(s) aceito(s)"; },
    resultadosHtml: function (calc, d) {
      var r = calc.resultados, P = d.params || {};
      function cx(v, rot, p) { return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var ac = r.aceitos.length, rj = r.rejeitados.length;
      return '<div class="fe-res">' +
        cx(ac + " / " + (ac + rj), "CPs aceitos (6.2.3)" + (rj ? ' · <span class="fe-nok">rejeitados: ' + esc(r.rejeitados.join(", ")) + "</span>" : ac ? ' · <span class="fe-ok">todos dentro das tolerâncias</span>' : "")) +
        cx(fmt(r.hMedia, 1) + " <small>%</small>", "Umidade média de moldagem" + (ok(r.ho) ? " · ho " + fmt(r.ho, 1) + " %" : "")) +
        cx(fmt(r.gsMedia, 3) + " <small>g/cm³</small>", "γs médio dos CPs" + (ok(r.gm) ? " · γm " + fmt(r.gm, 3) + " g/cm³" : "")) +
        cx(esc(METODOS[P.metodo || "A"]) + (P.cimento ? " · " + esc(P.cimento) + " % de cimento" : ""), "Cura: " + (P.finalidade === "controle" ? "controle de obra" : "dosagem (7 dias obrigatórios)") + (P.idade ? " · informado " + esc(P.idade) + " dias" : ""), true) + "</div>";
    },
    graficos: function (calc, d, opt) { return [grafico(calc, d, opt)]; },
    relatorio: {
      parametros: [["Moldagem", "Molde Ø 100 mm × 127,3 mm (1 000 cm³); 3 camadas × 25 golpes, soquete de 2,5 kg (face Ø 50 mm), queda de 305 mm; topos das camadas escarificados"],
        ["Cura", "Câmara úmida a 23 ± 2 °C e umidade relativa ≥ 95 %; 7 dias completos na dosagem (5.3)"]],
      notas: "h = (mbu − mbs) / (mbs − m) × 100 (6.1.1); γu = mu / v; γs = γu / (h + 100) × 100 (6.1.2). O CP é rejeitado quando a umidade de moldagem difere da ótima de mais de 1 % (ponto percentual) ou quando γs difere de γm de mais de 30 kg/m³ = 0,030 g/cm³ — a norma impressa diz \"30 g/cm³\" (6.2.3), erro de unidade evidente (a própria norma dá γs em kg/m³ ou g/cm³ em 6.1.2).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        rows.push(["Método", METODOS[P.metodo || "A"] + (P.cimento ? " — " + P.cimento + " % de cimento" + (P.tipoCimento ? " (" + P.tipoCimento + ")" : "") : "")]);
        rows.push(["Referência (DNER-ME 216/94)", "ho " + fmt(r.ho, 1) + " % · γm " + fmt(r.gm, 3) + " g/cm³" + (P.ref216 ? " — " + P.ref216 : "")]);
        calc.tab.cp.forEach(function (o) {
          rows.push([o.nome, "h " + fmt(o.h, 1) + " % (" + (o.dh >= 0 ? "+" : "") + fmt(o.dh, 1) + ") · γs " + fmt(o.gs, 3) + " g/cm³ (" + (o.dg >= 0 ? "+" : "") + fmt(o.dg, 3) + ") — " +
            (o.aceito === null ? "sem referência" : o.aceito ? "ACEITO" : "REJEITADO")]);
        });
        rows.push(["Cura", (P.finalidade === "controle" ? "Controle de obra" : "Dosagem") + (P.idade ? " — " + P.idade + " dias" : "") + (P.tCam ? " · " + P.tCam + " °C" : "") + (P.urCam ? " · UR " + P.urCam + " %" : "")]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Dosagem — solo arenoso + 6 % de cimento (Método A), três CPs aceitos", dados: function () {
        return gerar({ registro: "EX-MC-001", obra: "Obra A", origem: "Jazida 1", camada: "Base — solo-cimento (dosagem)", data: "2025-09-22" },
          { metodo: "A", importar: "ex:dner-me-216-94:0", ref216: "EX-SC-001 · Jazida 1", ho: "10,3", gm: "1,919", cimento: "6", tipoCimento: "CP II-F-32",
            hMist: "11,0", massaSolo: "2500", volume: "998", finalidade: "dosagem", idade: "7", tCam: "23", urCam: "97" },
          [["6-1", 10.1, 1.905, 100], ["6-2", 10.6, 1.912, 95], ["6-3", 9.8, 1.898, 105]], 998);
      } },
      { nome: "Método B — CPs fora da tolerância, amostra de umidade pequena e cura irregular", dados: function () {
        return gerar({ registro: "EX-MC-002", obra: "Obra B", origem: "Jazida 2", camada: "Sub-base — solo-cimento (dosagem)", data: "2025-10-14" },
          { metodo: "B", importar: "ex:dner-me-216-94:1", ref216: "EX-SC-002 · Jazida 2", ho: "8,0", gm: "2,100", cimento: "5", tipoCimento: "CP II-E-32",
            hMist: "8,2", massaSolo: "3200", retido: "22", retOrig: "22", volume: "1002", finalidade: "dosagem", idade: "5", tCam: "27", urCam: "90" },
          [["5-1", 9.4, 2.081, 300], ["5-2", 8.3, 2.055, 290], ["5-3", 7.7, 2.094, 180]], 1002);
      } },
    ],
  };

  // dados a partir de alvos [id, h, γs, massa seca da amostra de umidade]: molde de 4 150 g
  function gerar(ident, params, alvos, V) {
    return { ident: ident, params: params, cp: alvos.map(function (a, i) {
      var tara = 14.2 + i * 1.1, ms = a[3], mu = a[2] * (1 + a[1] / 100) * V;
      return { id: a[0], c1n: String(40 + i), c1t: fmt(tara, 2), c1s: fmt(tara + ms, 2), c1u: fmt(tara + ms * (1 + a[1] / 100), 2),
        moldeN: "M" + (i + 1), moldeM: "4150", moldeCP: String(Math.round(4150 + mu)) };
    }) };
  }
})();
