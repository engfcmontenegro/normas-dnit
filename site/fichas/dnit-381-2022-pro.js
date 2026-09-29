/*
 * Ficha: DNIT 381/2022-PRO — Projeto de aterros sobre solos moles para obras viárias.
 * Verificações fechadas do projeto: classe do aterro (4.1) e tipo de rodovia (4.2); fatores de segurança mínimos por
 * etapa (Tabela 1); sobrecargas de 10 kPa e 20 kPa (4.3.4); recalques residuais longitudinais e diferenciais transversais
 * de 10 e 25 anos (Tabelas 2 e 3); quantidade de furos da investigação preliminar (5.4.2.2) e complementar
 * (Tabelas 4 e 5); requisitos dos geocompostos para drenagem vertical e do colchão drenante (6.3.3) e limite da
 * consolidação a vácuo (6.3.4); instrumentação exigida (7; Tabelas 6 e 7: seções, 3 placas por seção, inclinômetro nos
 * encontros); correções N_SPT,60 (eq. 1) e N_kt (eq. 2).
 * Controle de campo: leituras das placas de recalque, piezômetros e inclinômetros, frequência mínima de leituras (7.4) e
 * previsão do recalque final pelo método de Asaoka (7.4.1) com o grau de adensamento para a retirada da pré-carga.
 * Usa FE.aceitacao para critérios e parecer. Registra-se em window.FE.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var ID = "dnit-381-2022-pro";
  var SN = [["", "—"], ["sim", "Sim"], ["nao", "Não"]];
  var FS_MIN = { cons: 1.2, fim: 1.3, longo: 1.5, rebaix: 1.3 };                 // Tabela 1
  var REC_L = { I: [2, 5] }, REC_T = { I: [2, 5], II: [5, 10], III: [5, 10] };   // Tabelas 2 e 3 (cm; 10 e 25 anos)
  var FASE = { C: ["execução do aterro", 1], S: ["sobrecarga temporária", 7], P: ["após a retirada da sobrecarga", 15] }; // 7.4
  var PLACAS = ["p1", "p2", "p3", "p4"];

  function P_(d) { return d.params || {}; }
  function classeDe(P) {
    var h = num(P.h);
    if (P.junto === "sim" || P.estaq === "sim") return { c: "I", txt: "Classe I — junto a estrutura rígida/sensível (4.1 a; 6.7; 6.8)" };
    if (!ok(h)) return { c: "", txt: "—" };
    if (h > 3) return { c: "II", txt: "Classe II — alto, h = " + fmt(h, 2) + " m > 3 m (4.1 b)" };
    if (h < 3) return { c: "III", txt: "Classe III — baixo, h = " + fmt(h, 2) + " m < 3 m (4.1 c)" };
    return { c: "II", amb: true, txt: "h = 3,00 m: a norma não enquadra (II: h > 3 m; III: h < 3 m) — adotada a Classe II (mais exigente)" };
  }

  // Asaoka (1978): ρ_j = β0 + β1·ρ_(j−1) com leituras a intervalos Δt constantes; ρ_final = β0 / (1 − β1)
  function asaoka(serie, t0, dt) {
    var pts = serie.filter(function (p) { return p[0] >= t0 - 1e-9; });
    if (pts.length < 2 || !(dt > 0)) return null;
    var tf = pts[pts.length - 1][0], amostra = [];
    for (var t = t0; t <= tf + 1e-9; t += dt) {
      for (var i = 1; i < pts.length; i++) {
        if (t <= pts[i][0] + 1e-9) { var a = pts[i - 1], b = pts[i]; amostra.push([t, b[0] === a[0] ? b[1] : a[1] + (b[1] - a[1]) * (t - a[0]) / (b[0] - a[0])]); break; }
      }
      if (t < pts[0][0]) amostra.push([t, pts[0][1]]);
    }
    if (amostra.length < 4) return { n: amostra.length, amostra: amostra };
    var xs = [], ys = [];
    for (var j = 1; j < amostra.length; j++) { xs.push(amostra[j - 1][1]); ys.push(amostra[j][1]); }
    var n = xs.length, mx = FE.media(xs), my = FE.media(ys), sxy = 0, sxx = 0, syy = 0;
    for (var k = 0; k < n; k++) { sxy += (xs[k] - mx) * (ys[k] - my); sxx += (xs[k] - mx) * (xs[k] - mx); syy += (ys[k] - my) * (ys[k] - my); }
    if (!sxx) return { n: amostra.length, amostra: amostra };
    var b1 = sxy / sxx, b0 = my - b1 * mx, r2 = syy ? sxy * sxy / (sxx * syy) : NaN;
    var rf = b1 > 0 && b1 < 1 ? b0 / (1 - b1) : NaN, ru = pts[pts.length - 1][1];
    return { n: amostra.length, amostra: amostra, pares: xs.map(function (x, i) { return [x, ys[i]]; }), b0: b0, b1: b1, r2: r2, rf: rf, ru: ru, tu: tf,
      U: ok(rf) && rf > 0 ? ru / rf * 100 : NaN, res: ok(rf) ? rf - ru : NaN, tau: b1 > 0 && b1 < 1 ? -dt / Math.log(b1) : NaN };
  }

  function linhasLeit(d) {
    return (d.leit || []).map(function (x) {
      var o = { t: num(x.t), data: x.data || "", fase: String(x.fase || "").trim().toUpperCase().charAt(0), h: num(x.h), u: num(x.u), dh: num(x.dh) };
      PLACAS.forEach(function (p) { o[p] = num(x[p]); });
      var v = PLACAS.map(function (p) { return o[p]; }).filter(ok);
      o.med = v.length ? FE.media(v) : NaN;
      return o;
    });
  }
  function linhasCampo(d) {
    return (d.campo || []).map(function (x) {
      var o = { z: num(x.z), N: num(x.N), E: num(x.E), qt: num(x.qt), sv0: num(x.sv0), su: num(x.su) };
      o.N60 = ok(o.N) && ok(o.E) ? o.N * (o.E / 100) / 0.60 : NaN;          // eq. 1 (energia como fração da teórica)
      o.Nkt = ok(o.qt) && ok(o.sv0) && ok(o.su) && o.su > 0 ? (o.qt - o.sv0) / o.su : NaN;  // eq. 2
      return o;
    });
  }

  function calcular(d) {
    var P = P_(d), avisos = [], L = [], cl = classeDe(P), C = cl.c, t2 = P.tipoRod === "2";
    var G0 = "Classificação (4.1; 4.2)", G1 = "Estabilidade — estado limite último (4.3)", G2 = "Recalques residuais — estado limite de utilização (4.4)",
      G3 = "Investigações geotécnicas (5.4)", G4 = "Soluções (6.3)", G5 = "Instrumentação (7; 7.3)", G6 = "Monitoramento (7.4; 7.4.1)";
    var ext = num(P.ext);
    // classificação
    var lc = A.linha({ grupo: G0, criterio: "Classe do aterro e tipo de rodovia", secao: "4.1; 4.2", exigido: "definidos", resultado: cl.txt + " · Rodovia Tipo " + (P.tipoRod || "?") });
    if (!C) A.marcar(lc, "pendente", "informe a altura do aterro ou se está junto a estrutura rígida/sensível");
    if (!P.tipoRod) A.marcar(lc, "pendente", "informe o tipo de rodovia");
    if (cl.amb) A.marcar(lc, "ressalva", cl.txt);
    if (P.tipoRod === "1" && P.pavFut === "sim") A.marcar(lc, "ressalva", "rodovia não pavimentada com pavimentação prevista em projeto é Tipo 2 (NOTA 1)");
    if (P.junto === "sim" && ok(num(P.extI)) && num(P.extI) < 50) A.marcar(lc, "nao_conforme", "extensão do aterro Classe I de " + fmt(num(P.extI), 0) + " m: deve ser ≥ 50 m para cada lado da interseção (4.1 a)");
    L.push(lc);
    var t2e = t2 || (P.tipoRod === "1" && P.pavFut === "sim");
    // FS (Tabela 1)
    [["cons", "Período construtivo", "fsCons"], ["fim", "Final de construção", "fsFim"], ["longo", "Longo prazo", "fsLongo"], ["rebaix", "Rebaixamento rápido", "fsReb"]].forEach(function (x) {
      var aplica = x[0] !== "rebaix" || P.rebaix === "sim";
      L.push(A.avaliar({ grupo: G1, criterio: "FS mínimo — " + x[1], secao: "Tabela 1", pontos: ok(num(P[x[2]])) ? [num(P[x[2]])] : [], min: FS_MIN[x[0]], casas: 2,
        exigido: "≥ " + fmt(FS_MIN[x[0]], 1), aplica: aplica, naoAplicaPor: "sem rebaixamento rápido sazonal (NOTA 3)", individual: true }));
    });
    var lm = A.linha({ grupo: G1, criterio: "Método de equilíbrio limite (Bishop simplificado, Spencer, Morgenstern-Price)", secao: "4.3", exigido: "requisito mínimo", resultado: P.eqLim === "sim" ? "sim" : P.eqLim === "nao" ? "não" : "—" });
    if (P.eqLim === "nao") A.marcar(lm, "nao_conforme", "o FS por elementos finitos deve ser complementado por equilíbrio limite (4.3)"); else if (P.eqLim !== "sim") A.marcar(lm, "pendente", "informe o método");
    L.push(lm);
    [["sobC", "Sobrecarga no período construtivo", 10, "4.3.4 a"], ["sobO", "Sobrecarga no período operacional (pista e acostamento)", 20, "4.3.4 b"]].forEach(function (x) {
      L.push(A.avaliar({ grupo: G1, criterio: x[1], secao: x[3], unid: "kPa", casas: 0, pontos: ok(num(P[x[0]])) ? [num(P[x[0]])] : [], min: x[2], exigido: "≥ " + x[2] + " kPa (salvo condições mais críticas)", individual: true }));
    });
    // recalques residuais (Tabelas 2 e 3)
    [["rl10", "Longitudinal — 10 anos", 0, "L"], ["rl25", "Longitudinal — 25 anos", 1, "L"], ["rt10", "Diferencial transversal — 10 anos", 0, "T"], ["rt25", "Diferencial transversal — 25 anos", 1, "T"]].forEach(function (x) {
      var lim = NaN, ex = "";
      if (x[3] === "T") { lim = C ? REC_T[C][x[2]] : NaN; ex = ok(lim) ? "≤ " + lim + " cm (Tabela 3)" : "—"; }
      else if (C === "I") { lim = REC_L.I[x[2]]; ex = "≤ " + lim + " cm (Tabela 2)"; }
      else { lim = num(P[x[2] ? "limL25" : "limL10"]); ex = ok(lim) ? "≤ " + fmt(lim, 1) + " cm (definido no projeto — Tabela 2, Obs.)" : "definir no projeto (Tabela 2, Obs.)"; }
      var v = num(P[x[0]]);
      var l = A.avaliar({ grupo: G2, criterio: "Recalque residual " + x[1], secao: x[3] === "T" ? "4.4.2; Tabela 3" : "4.4.2; Tabela 2", unid: "cm", casas: 1,
        pontos: ok(v) ? [v] : [], max: lim, exigido: ex, individual: true, aplica: !(x[3] === "T" && P.transv === "nao"), naoAplicaPor: "não aplicável (Tabela 3)" });
      if (x[3] === "L" && C && C !== "I" && !ok(lim) && ok(v)) { l.situacao = "pendente"; l.motivo = "limite longitudinal das Classes II/III deve ser definido pelo projeto"; l.motivos = [{ situacao: "pendente", texto: l.motivo }]; }
      L.push(l);
    });
    // investigações
    if (ok(ext)) {
      var nPre = Math.max(3, Math.ceil(ext / 100) + 1), rPre = num(P.nPre);
      var lp = A.linha({ grupo: G3, criterio: "Furos/sondagens da investigação preliminar (SPT" + (t2e ? " e CPTU" : "") + ")", secao: "5.4.2.1; 5.4.2.2", exigido: "≥ " + nPre + " (mín. 3; espaçamento médio ≤ 100 m em " + fmt(ext, 0) + " m)",
        resultado: ok(rPre) ? fmt(rPre, 0) : "—" });
      if (!ok(rPre)) A.marcar(lp, "pendente", "informe o número de furos"); else if (rPre < nPre) A.marcar(lp, "nao_conforme", "abaixo do mínimo");
      L.push(lp);
      var nExt = ok(num(P.nExtr)) ? num(P.nExtr) : 2;
      var passo = C === "II" ? 250 : C === "III" ? 500 : NaN;
      function exig(porExt) { return C === "I" ? porExt * nExt : ok(passo) ? Math.max(1, Math.ceil(ext / passo)) : NaN; }
      var ens = [["nSPT", "Sondagens SPT", exig(1)], ["nAm", t2e ? "Verticais de amostras deformadas e indeformadas (caracterização completa e adensamento)" : "Verticais de amostras para caracterização", exig(1)],
        ["nFVT", "Verticais de ensaio de palheta (FVT)", exig(t2e ? 2 : 1)]];
      if (t2e) ens.push(["nCPTU", "Ensaios de piezocone (CPTU) com dissipação", exig(1)]);
      if (P.complementar === "sim") ens.forEach(function (e) {
        var r = num(P[e[0]]);
        var l = A.linha({ grupo: G3, criterio: e[1] + " — investigação complementar", secao: t2e ? "5.4.3.1 b; Tabela 5" : "5.4.3.1 a; Tabela 4",
          exigido: ok(e[2]) ? "≥ " + e[2] + (C === "I" ? " (" + (e[0] === "nFVT" && t2e ? "duas" : "uma") + " por extremidade × " + nExt + ")" : " (1 a cada " + passo + " m)") : "—", resultado: ok(r) ? fmt(r, 0) : "—" });
        if (!ok(r)) A.marcar(l, "pendente", "informe"); else if (ok(e[2]) && r < e[2]) A.marcar(l, "nao_conforme", "abaixo da quantidade mínima");
        L.push(l);
      });
    }
    var lpr = A.linha({ grupo: G3, criterio: "Profundidade das sondagens", secao: "5.4.2.1; 5.4.2.2", exigido: "atingir a base da última camada mole (N_SPT > 10 / q_t > 3000 kPa)" + (C === "I" ? "; ≥ 1 até o impenetrável" : ""),
      resultado: [P.base === "sim" ? "base atingida" : P.base === "nao" ? "base não atingida" : "", C === "I" ? (P.impen === "sim" ? "impenetrável atingido" : P.impen === "nao" ? "nenhuma no impenetrável" : "") : ""].filter(Boolean).join(" · ") || "—" });
    if (P.base === "nao") A.marcar(lpr, "nao_conforme", "sondagens devem atravessar todo o depósito mole");
    else if (P.base !== "sim") A.marcar(lpr, "pendente", "informe");
    if (C === "I" && P.impen === "nao") A.marcar(lpr, "nao_conforme", "aterro Classe I: pelo menos uma sondagem até o impenetrável");
    else if (C === "I" && P.impen !== "sim") A.marcar(lpr, "pendente", "informe se alguma sondagem atingiu o impenetrável");
    L.push(lpr);
    if (P.fvtB === "sim") L.push(A.marcar(A.linha({ grupo: G3, criterio: "Equipamento de palheta", secao: "5.2.1.3 a", exigido: "tipo A", resultado: "tipo B" }), "nao_conforme", "palheta tipo B não é aceita pelo DNIT"));
    if (P.cptSemU === "sim") L.push(A.marcar(A.linha({ grupo: G3, criterio: "Ensaio de cone", secao: "5.2.1.2; NOTA 5", exigido: "piezocone com poropressão", resultado: "cone mecânico/elétrico sem u" }), "nao_conforme", "não aceito pelo DNIT"));
    // soluções: GCDV e vácuo
    if (P.gcdv === "sim") {
      [["qw", "Capacidade de descarga do GCDV", "m³/s/m", 1.6e-5, NaN, "≥ 1,6 × 10⁻⁵ m³/s/m", "6.3.3 a"], ["tr", "Resistência à tração do GCDV", "kN/m", 2.5, NaN, "> 2,5 kN/m", "6.3.3 b", true],
        ["def", "Deformação axial antes da ruptura", "%", 30, NaN, "≥ 30 %", "6.3.3 b"], ["mand", "Área da seção do mandril", "cm²", NaN, 70, "< 70 cm²", "6.3.3 d"],
        ["colchao", "Espessura do colchão drenante", "m", 0.3, NaN, "≥ 0,3 m", "6.3.3"], ["esp", "Espaçamento entre GCDV em planta", "m", 0.9, NaN, "≥ 0,9 m (usual 0,9 a 2,5 m)", "6.3.3"]].forEach(function (x) {
        var v = num(P[x[0]]);
        var l = A.avaliar({ grupo: G4, criterio: x[1], secao: x[6], unid: x[2], casas: x[0] === "qw" ? 7 : x[0] === "esp" || x[0] === "colchao" ? 2 : 1, pontos: ok(v) ? [v] : [], min: x[3], max: x[4], minEstrito: !!x[7], exigido: x[5], individual: true });
        if (x[0] === "mand" && ok(v) && v >= 70) { l.situacao = "nao_conforme"; l.motivo = "mandril deve ter área inferior a 70 cm²"; l.motivos = [{ situacao: "nao_conforme", texto: l.motivo }]; }
        if (x[0] === "qw" && ok(v)) l.resultado = v.toExponential(2).replace(".", ",") + " m³/s/m";
        if (x[0] === "esp" && ok(v) && v > 2.5) A.marcar(l, "ressalva", "acima da faixa usual de 0,9 a 2,5 m");
        L.push(l);
      });
      var lmd = A.linha({ grupo: G4, criterio: "Instalação com mandril/agulha fechada; GCDV atravessando toda a camada mole", secao: "6.3.3 c", exigido: "sim",
        resultado: P.mandFech === "sim" ? "sim" : P.mandFech === "nao" ? "não" : "—" });
      if (P.mandFech === "nao") A.marcar(lmd, "nao_conforme", "exigida instalação com mandril fechado"); else if (P.mandFech !== "sim") A.marcar(lmd, "pendente", "informe");
      L.push(lmd);
    }
    if (P.vacuo === "sim") L.push(A.avaliar({ grupo: G4, criterio: "Altura do aterro com consolidação a vácuo", secao: "6.3.4", unid: "m", casas: 2, pontos: ok(num(P.h)) ? [num(P.h)] : [], max: 4, exigido: "≤ 4 m", individual: true }));
    // instrumentação
    var exigeI = t2e || C === "I";
    var nSec = C === "I" ? 1 : ok(ext) ? Math.max(1, Math.ceil(ext / 250)) : 1, rSec = num(P.nSec), rPl = num(P.nPlacas), nEnc = num(P.nEnc) || 0;
    if (!exigeI) L.push(A.linha({ grupo: G5, criterio: "Instrumentação", secao: "7", exigido: "Tipo 1: só aterros Classe I", resultado: "não exigida", situacao: "nao_exigido", motivo: "Rodovia Tipo 1, aterro Classe " + (C || "?") }));
    else {
      var ls = A.linha({ grupo: G5, criterio: "Seções instrumentadas", secao: t2e ? "Tabela 7" : "Tabela 6", exigido: "≥ " + nSec + (C === "I" ? " (e todos os encontros)" : " (1 por trecho, 1 a cada 250 m)"), resultado: ok(rSec) ? fmt(rSec, 0) : "—" });
      if (!ok(rSec)) A.marcar(ls, "pendente", "informe"); else if (rSec < nSec) A.marcar(ls, "nao_conforme", "abaixo do mínimo");
      if (nEnc && ok(num(P.nEncI)) && num(P.nEncI) < nEnc) A.marcar(ls, "nao_conforme", "todos os encontros de ponte/viaduto devem ser instrumentados (" + fmt(num(P.nEncI), 0) + " de " + nEnc + ")");
      L.push(ls);
      var sec = ok(rSec) ? Math.max(rSec, nSec) : nSec;
      var lpl = A.linha({ grupo: G5, criterio: "Placas de recalque", secao: "7.3", exigido: "≥ 3 por seção (≥ " + 3 * sec + ")", resultado: ok(rPl) ? fmt(rPl, 0) : "—" });
      if (!ok(rPl)) A.marcar(lpl, "pendente", "informe"); else if (rPl < 3 * sec) A.marcar(lpl, "nao_conforme", "mínimo de 3 placas por seção");
      L.push(lpl);
      if (P.esfH === "sim") {
        var ri = num(P.nInc), li = A.linha({ grupo: G5, criterio: "Inclinômetros nos encontros com esforços horizontais relevantes", secao: "7.3", exigido: "≥ 1 por encontro (≥ " + Math.max(1, nEnc) + ")", resultado: ok(ri) ? fmt(ri, 0) : "—" });
        if (!ok(ri)) A.marcar(li, "pendente", "informe"); else if (ri < Math.max(1, nEnc)) A.marcar(li, "nao_conforme", "pelo menos 1 inclinômetro por encontro");
        L.push(li);
      }
    }
    // monitoramento: leituras, frequência, Asaoka
    var lt = linhasLeit(d).filter(function (o) { return ok(o.t); }), ruim = { C: [], S: [], P: [] }, semFase = 0;
    lt.forEach(function (o, i) {
      if (!FASE[o.fase]) { semFase++; return; }
      if (i && ok(lt[i - 1].t)) {
        var dt = o.t - lt[i - 1].t;
        if (dt <= 0) avisos.push("Leitura do dia " + fmt(o.t, 0) + ": tempo não crescente.");
        else if (dt > FASE[o.fase][1] + 1e-6) ruim[o.fase].push(fmt(lt[i - 1].t, 0) + "→" + fmt(o.t, 0));
      }
    });
    var U = num(P.Uexig), dtA = num(P.dtA), t0 = num(P.t0A), asa = {};
    if (lt.length) {
      var lf = A.linha({ grupo: G6, criterio: "Frequência mínima de leituras", secao: "7.4", exigido: "diárias na execução; semanais com sobrecarga; quinzenais após a retirada", resultado: lt.length + " leitura(s)" });
      if (ruim.C.length) A.marcar(lf, "nao_conforme", "execução do aterro sem leitura diária: " + ruim.C.join(", ") + " (dias)");
      if (ruim.S.length) A.marcar(lf, "ressalva", "sobrecarga: intervalo > 7 dias em " + ruim.S.join(", ") + " (salvo critério do projetista)");
      if (ruim.P.length) A.marcar(lf, "ressalva", "após a retirada: intervalo > 15 dias em " + ruim.P.join(", ") + " (salvo critério do projetista)");
      if (semFase) A.marcar(lf, "pendente", semFase + " leitura(s) sem a fase (C, S ou P)");
      L.push(lf);
      if (!ok(t0)) { var fimC = lt.filter(function (o) { return o.fase === "C"; }).map(function (o) { return o.t; }); t0 = fimC.length ? Math.max.apply(null, fimC) : lt[0].t; }
      var tF = lt[lt.length - 1].t;
      if (!ok(dtA)) dtA = Math.max(1, Math.round((tF - t0) / 8));
      PLACAS.forEach(function (p) {
        var serie = lt.filter(function (o) { return ok(o[p]); }).map(function (o) { return [o.t, o[p]]; });
        if (serie.length >= 2) asa[p] = asaoka(serie, t0, dtA);
      });
      var ks = Object.keys(asa).filter(function (p) { return asa[p] && ok(asa[p].rf); });
      if (P.preCarga === "sim") {
        var la = A.linha({ grupo: G6, criterio: "Grau de adensamento para a retirada da pré-carga (Asaoka)", secao: "7.4.1", exigido: ok(U) ? "U ≥ " + fmt(U, 0) + " % (projeto)" : "U definido no projeto",
          resultado: ks.length ? ks.map(function (p) { return p.toUpperCase() + " " + fmt(asa[p].U, 0) + " %"; }).join(" · ") : "—", n: ks.length });
        if (!ks.length) A.marcar(la, "sem_dados", "Asaoka exige ≥ 4 pontos a Δt constante no trecho sob carga constante, com 0 < β1 < 1");
        else if (!ok(U)) A.marcar(la, "pendente", "informe o grau de adensamento exigido pelo projeto");
        else {
          var falt = ks.filter(function (p) { return asa[p].U < U; });
          if (falt.length) A.marcar(la, "nao_conforme", "retirada NÃO liberada: " + falt.map(function (p) { return p.toUpperCase() + " com U = " + fmt(asa[p].U, 1) + " %"; }).join("; "));
          else la.motivo = "retirada liberada: todas as placas com U ≥ " + fmt(U, 0) + " %";
        }
        L.push(la);
      } else if (ks.length) {
        L.push(A.linha({ grupo: G6, criterio: "Previsão do recalque final (Asaoka)", secao: "7.4.1", exigido: "informativo", situacao: "informativo",
          resultado: ks.map(function (p) { return p.toUpperCase() + " ρf = " + fmt(asa[p].rf, 0) + " mm (U = " + fmt(asa[p].U, 0) + " %)"; }).join(" · ") }));
      }
      ks.forEach(function (p) { if (asa[p].r2 < 0.95) avisos.push(p.toUpperCase() + ": ajuste de Asaoka com R² = " + fmt(asa[p].r2, 3) + " — avalie as limitações do método (7.4.1)."); });
      var lu = lt.filter(function (o) { return ok(o.u); });
      if (lu.length >= 2) {
        var uMax = Math.max.apply(null, lu.map(function (o) { return o.u; })), uUlt = lu[lu.length - 1].u, u0 = num(P.u0);
        if (ok(u0) && uMax > u0) avisos.push("Piezometria: excesso de poropressão máximo " + fmt(uMax - u0, 1) + " kPa; atual " + fmt(uUlt - u0, 1) + " kPa (" + fmt((1 - (uUlt - u0) / (uMax - u0)) * 100, 0) + " % dissipado) — a PRO não fixa limite de alerta (7.4.1).");
      }
    }
    if (exigeI && !lt.length && P.fase === "obra") avisos.push("Aterro instrumentado: lance as leituras das placas de recalque (7.4).");
    if (P.subst === "sim" && ((ok(ext) && ext >= 200) || (ok(num(P.espMole)) && num(P.espMole) >= 3))) avisos.push("Substituição total é usual em depósitos com menos de 200 m de comprimento e menos de 3 m de espessura (6.1).");
    if (P.preCarga === "sim" && ok(num(P.pSob)) && ok(num(P.pAterro)) && num(P.pAterro) > 0) {
      var rel = num(P.pSob) / num(P.pAterro) * 100;
      if (rel < 25 || rel > 30) avisos.push("Sobrecarga temporária de " + fmt(rel, 0) + " % do peso do aterro (em geral 25 % a 30 %, 6.3.2).");
    }
    var cp = linhasCampo(d);
    var par = A.parecer(L, [], { textos: {
      ACEITO: { titulo: "PROJETO / CONTROLE CONFORME À PRO", texto: "Todas as verificações fechadas da DNIT 381/2022-PRO atendidas." },
      RESSALVA: { titulo: "CONFORME COM RESSALVAS", texto: "Nenhuma verificação reprovada; há pontos a justificar ou acompanhar." },
      PENDENTE: { titulo: "VERIFICAÇÃO INCOMPLETA", texto: "Faltam dados para concluir as verificações da PRO." },
      REJEITADO: { titulo: "NÃO CONFORME À PRO", texto: "Há verificação reprovada: revisar o projeto/controle antes de prosseguir." } } });
    var r = { classe: cl, linhas: L, parecer: par, asa: asa, dtA: dtA, t0: t0, lt: lt, cp: cp };
    return { tab: { leit: linhasLeit(d), campo: cp }, resultados: r, avisos: avisos };
  }

  function tabAsaoka(r, relat) {
    var ks = Object.keys(r.asa).filter(function (p) { return r.asa[p]; });
    if (!ks.length) return "";
    var cls = relat ? "gr" : "fe-resumo";
    return '<table class="' + cls + '"><thead><tr><th>Placa</th><th>Pontos (Δt = ' + fmt(r.dtA, 0) + ' d desde o dia ' + fmt(r.t0, 0) + ')</th><th>β0 (mm)</th><th>β1</th><th>R²</th><th>ρ atual (mm)</th><th>ρ final (mm)</th><th>U (%)</th><th>Remanescente primário (mm)</th></tr></thead><tbody>' +
      ks.map(function (p) {
        var a = r.asa[p];
        return "<tr><td>" + p.toUpperCase() + "</td><td>" + a.n + "</td><td>" + fmt(a.b0, 1) + "</td><td>" + fmt(a.b1, 4) + "</td><td>" + fmt(a.r2, 4) + "</td><td>" + fmt(a.ru, 0) + "</td><td>" + fmt(a.rf, 0) + "</td><td><b>" + fmt(a.U, 1) + "</b></td><td>" + fmt(a.res, 0) + "</td></tr>";
      }).join("") + "</tbody></table>";
  }
  function tabCampo(r, relat) {
    var cp = r.cp.filter(function (o) { return ok(o.N60) || ok(o.Nkt) || ok(o.su); });
    if (!cp.length) return "";
    return '<table class="' + (relat ? "gr" : "fe-resumo") + '"><thead><tr><th>Prof. (m)</th><th>N_SPT,60 (eq. 1)</th><th>N_kt (eq. 2)</th><th>S_u (kPa)</th><th>Argila (5.1 f)</th></tr></thead><tbody>' +
      cp.map(function (o) {
        return "<tr><td>" + fmt(o.z, 2) + "</td><td>" + fmt(o.N60, 1) + "</td><td>" + fmt(o.Nkt, 1) + "</td><td>" + fmt(o.su, 1) + "</td><td>" + (ok(o.su) ? (o.su <= 12 ? "muito mole" : o.su <= 25 ? "mole" : "—") : "—") + "</td></tr>";
      }).join("") + "</tbody></table>";
  }

  var COR = ["#4f8cff", "#e0772d", "#34c38f", "#b05cd6"];
  function graficos(calc, d, opt) {
    opt = opt || {};
    var r = calc.resultados, lt = r.lt, out = [], imp = opt.imprimir;
    var txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)";
    if (!lt.length) return ['<div class="fe-graf-vazio">Os gráficos aparecem com as leituras das placas de recalque.</div>'];
    var W = 620, H = 300, ml = 52, mr = 46, mt = 22, mb = 36;
    var ts = lt.map(function (o) { return o.t; }), tMax = Math.max.apply(null, ts) || 1;
    var rs = []; lt.forEach(function (o) { PLACAS.forEach(function (p) { if (ok(o[p])) rs.push(o[p]); }); });
    var rMax = Math.max.apply(null, rs.concat([1]));
    Object.keys(r.asa).forEach(function (p) { if (r.asa[p] && ok(r.asa[p].rf) && r.asa[p].rf < 3 * rMax) rMax = Math.max(rMax, r.asa[p].rf); });
    rMax = Math.ceil(rMax * 1.08 / 50) * 50;
    var hs = lt.map(function (o) { return o.h; }).filter(ok), hMax = hs.length ? Math.ceil(Math.max.apply(null, hs) + 0.5) : 0;
    function X(t) { return ml + t / tMax * (W - ml - mr); }
    function Y(v) { return mt + v / rMax * (H - mt - mb); }
    function YH(h) { return H - mb - h / (hMax || 1) * (H - mt - mb) * 0.45; }
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10">';
    s += '<text x="' + (W / 2) + '" y="13" text-anchor="middle" fill="' + txt + '">Recalque das placas × tempo (7.2.3) — altura do aterro (cinza)</text>';
    for (var i = 0; i <= 5; i++) {
      var v = rMax * i / 5, t = tMax * i / 5;
      s += '<line x1="' + ml + '" y1="' + Y(v) + '" x2="' + (W - mr) + '" y2="' + Y(v) + '" stroke="' + grade + '"/><text x="' + (ml - 4) + '" y="' + (Y(v) + 3) + '" text-anchor="end" fill="' + txt + '">' + fmt(v, 0) + "</text>";
      s += '<text x="' + X(t) + '" y="' + (H - mb + 14) + '" text-anchor="middle" fill="' + txt + '">' + fmt(t, 0) + "</text>";
    }
    s += '<text x="' + (W / 2) + '" y="' + (H - 6) + '" text-anchor="middle" fill="' + txt + '">tempo (dias)</text>';
    s += '<text x="12" y="' + (H / 2) + '" transform="rotate(-90 12 ' + (H / 2) + ')" text-anchor="middle" fill="' + txt + '">recalque (mm)</text>';
    if (hMax) {
      var ph = lt.filter(function (o) { return ok(o.h); }).map(function (o) { return X(o.t) + "," + YH(o.h); });
      s += '<polyline points="' + ph.join(" ") + '" fill="none" stroke="#999" stroke-width="2" opacity="0.7"/>';
      s += '<text x="' + (W - mr + 4) + '" y="' + (YH(hMax) + 3) + '" fill="' + txt + '" font-size="9">h ' + fmt(hMax, 1) + " m</text>";
    }
    PLACAS.forEach(function (p, k) {
      var pts = lt.filter(function (o) { return ok(o[p]); });
      if (!pts.length) return;
      s += '<polyline points="' + pts.map(function (o) { return X(o.t) + "," + Y(o[p]); }).join(" ") + '" fill="none" stroke="' + COR[k] + '" stroke-width="1.6"/>';
      pts.forEach(function (o) { s += '<circle cx="' + X(o.t) + '" cy="' + Y(o[p]) + '" r="2" fill="' + COR[k] + '"/>'; });
      var a = r.asa[p];
      if (a && ok(a.rf) && a.rf <= rMax) s += '<line x1="' + X(r.t0) + '" y1="' + Y(a.rf) + '" x2="' + (W - mr) + '" y2="' + Y(a.rf) + '" stroke="' + COR[k] + '" stroke-dasharray="5 3"/><text x="' + (W - mr + 3) + '" y="' + (Y(a.rf) + 3) + '" fill="' + COR[k] + '" font-size="9">ρf ' + p.toUpperCase() + "</text>";
      s += '<rect x="' + (ml + 8 + k * 60) + '" y="' + (H - mb - 14) + '" width="10" height="3" fill="' + COR[k] + '"/><text x="' + (ml + 22 + k * 60) + '" y="' + (H - mb - 10) + '" fill="' + txt + '" font-size="9">' + p.toUpperCase() + "</text>";
    });
    out.push(s + "</svg>");
    // Asaoka
    var ks = Object.keys(r.asa).filter(function (p) { return r.asa[p] && r.asa[p].pares; });
    if (ks.length) {
      var vs = []; ks.forEach(function (p) { r.asa[p].pares.forEach(function (q) { vs.push(q[0], q[1]); }); if (ok(r.asa[p].rf)) vs.push(r.asa[p].rf); });
      var lo = Math.floor(Math.min.apply(null, vs) / 50) * 50, hi = Math.ceil(Math.max.apply(null, vs) * 1.03 / 50) * 50, S = 300, m = 44;
      function Z(v) { return m + (v - lo) / (hi - lo) * (S - m - 14); }
      function ZY(v) { return S - m + 10 - (v - lo) / (hi - lo) * (S - m - 14); }
      var g = '<svg class="fe-graf" viewBox="0 0 ' + (S + 180) + " " + (S + 6) + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10">';
      g += '<text x="' + (S / 2 + 20) + '" y="13" text-anchor="middle" fill="' + txt + '">Asaoka: ρ(j) × ρ(j−1), Δt = ' + fmt(r.dtA, 0) + " dias</text>";
      for (var q = 0; q <= 4; q++) {
        var vv = lo + (hi - lo) * q / 4;
        g += '<line x1="' + Z(vv) + '" y1="' + ZY(lo) + '" x2="' + Z(vv) + '" y2="' + ZY(hi) + '" stroke="' + grade + '"/><line x1="' + Z(lo) + '" y1="' + ZY(vv) + '" x2="' + Z(hi) + '" y2="' + ZY(vv) + '" stroke="' + grade + '"/>';
        g += '<text x="' + Z(vv) + '" y="' + (ZY(lo) + 13) + '" text-anchor="middle" fill="' + txt + '" font-size="9">' + fmt(vv, 0) + '</text><text x="' + (Z(lo) - 4) + '" y="' + (ZY(vv) + 3) + '" text-anchor="end" fill="' + txt + '" font-size="9">' + fmt(vv, 0) + "</text>";
      }
      g += '<line x1="' + Z(lo) + '" y1="' + ZY(lo) + '" x2="' + Z(hi) + '" y2="' + ZY(hi) + '" stroke="' + txt + '" stroke-dasharray="4 3"/><text x="' + (Z(hi) - 4) + '" y="' + (ZY(hi) + 12) + '" text-anchor="end" fill="' + txt + '" font-size="9">45°</text>';
      g += '<text x="' + (S / 2 + 20) + '" y="' + (S + 2) + '" text-anchor="middle" fill="' + txt + '">ρ(j−1) (mm)</text>';
      ks.forEach(function (p) {
        var a = r.asa[p], k = PLACAS.indexOf(p);
        a.pares.forEach(function (x) { g += '<circle cx="' + Z(x[0]) + '" cy="' + ZY(x[1]) + '" r="2.6" fill="' + COR[k] + '"/>'; });
        var x2 = ok(a.rf) ? Math.min(hi, a.rf) : hi;
        g += '<line x1="' + Z(lo) + '" y1="' + ZY(a.b0 + a.b1 * lo) + '" x2="' + Z(x2) + '" y2="' + ZY(a.b0 + a.b1 * x2) + '" stroke="' + COR[k] + '"/>';
        if (ok(a.rf) && a.rf <= hi) g += '<circle cx="' + Z(a.rf) + '" cy="' + ZY(a.rf) + '" r="4" fill="none" stroke="' + COR[k] + '" stroke-width="1.5"/>';
        g += '<text x="' + (S + 8) + '" y="' + (40 + k * 16) + '" fill="' + COR[k] + '">' + p.toUpperCase() + ": ρf = " + fmt(a.rf, 0) + " mm · U = " + fmt(a.U, 0) + " %</text>";
      });
      out.push(g + "</svg>");
    }
    var lu = lt.filter(function (o) { return ok(o.u); });
    if (lu.length >= 2) {
      out.push(serieTempo("Poropressão no piezômetro (kPa) × tempo (dias) — tracejado: u hidrostática", lu.map(function (o) { return [o.t, o.u]; }), num(P_(d).u0), opt));
    }
    var li = lt.filter(function (o) { return ok(o.dh); });
    if (li.length >= 2) out.push(serieTempo("Deslocamento horizontal máximo no inclinômetro (mm) × tempo (dias)", li.map(function (o) { return [o.t, o.dh]; }), NaN, opt));
    return out;
  }
  function serieTempo(titulo, pts, ref, opt) {
    var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)";
    var W = 620, H = 220, ml = 50, mr = 14, mt = 22, mb = 34;
    var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; }).concat(ok(ref) ? [ref] : []);
    var x1 = Math.max.apply(null, xs) || 1, y0 = Math.min(0, Math.min.apply(null, ys)), y1 = Math.max.apply(null, ys) * 1.1 || 1;
    function X(v) { return ml + v / x1 * (W - ml - mr); }
    function Y(v) { return H - mb - (v - y0) / (y1 - y0) * (H - mt - mb); }
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10">';
    s += '<text x="' + ml + '" y="13" fill="' + txt + '" font-weight="bold" font-size="11">' + esc(titulo) + "</text>";
    for (var i = 0; i <= 4; i++) {
      var v = y0 + (y1 - y0) * i / 4, t = x1 * i / 4;
      s += '<line x1="' + ml + '" y1="' + Y(v) + '" x2="' + (W - mr) + '" y2="' + Y(v) + '" stroke="' + grade + '"/><text x="' + (ml - 4) + '" y="' + (Y(v) + 3) + '" text-anchor="end" fill="' + txt + '">' + fmt(v, 0) + "</text>";
      s += '<text x="' + X(t) + '" y="' + (H - mb + 14) + '" text-anchor="middle" fill="' + txt + '">' + fmt(t, 0) + "</text>";
    }
    if (ok(ref)) s += '<line x1="' + ml + '" y1="' + Y(ref) + '" x2="' + (W - mr) + '" y2="' + Y(ref) + '" stroke="#e5534b" stroke-dasharray="6 3"/>';
    s += '<polyline points="' + pts.map(function (p) { return X(p[0]) + "," + Y(p[1]); }).join(" ") + '" fill="none" stroke="#4f8cff" stroke-width="1.5"/>';
    pts.forEach(function (p) { s += '<circle cx="' + X(p[0]) + '" cy="' + Y(p[1]) + '" r="2.3" fill="#4f8cff"/>'; });
    return s + "</svg>";
  }

  var params = [
    { k: "fase", r: "Fase", tipo: "select", opcoes: [["projeto", "Projeto"], ["obra", "Obra / monitoramento"]] },
    { k: "tipoRod", r: "Tipo de rodovia (4.2)", tipo: "select", opcoes: [["", "—"], ["1", "Tipo 1 — não pavimentada"], ["2", "Tipo 2 — pavimentada"]] },
    { k: "pavFut", r: "Tipo 1 com pavimentação prevista em projeto? (NOTA 1)", tipo: "select", opcoes: SN },
    { k: "junto", r: "Aterro junto a estrutura rígida/sensível (encontro, interseção, bueiro em estacas, duto)? (4.1 a)", tipo: "select", opcoes: SN },
    { k: "extI", r: "Extensão do aterro Classe I para cada lado da interseção, m (≥ 50)" },
    { k: "estaq", r: "Aterro estaqueado? (6.7 — Classe I)", tipo: "select", opcoes: SN },
    { k: "h", r: "Altura do aterro (terreno natural ao topo do pavimento), m (4.1)" },
    { k: "ext", r: "Extensão do trecho de solo mole, m" },
    { k: "espMole", r: "Espessura do depósito mole, m" },
    { k: "nEnc", r: "Nº de encontros de ponte/viaduto no trecho" },
    { k: "eqLim", r: "FS por equilíbrio limite (4.3)?", tipo: "select", opcoes: SN },
    { k: "fsCons", r: "FS — período construtivo (mín. 1,2)" },
    { k: "fsFim", r: "FS — final de construção (mín. 1,3)" },
    { k: "fsLongo", r: "FS — longo prazo (mín. 1,5)" },
    { k: "rebaix", r: "Há rebaixamento rápido sazonal do NA? (NOTA 3)", tipo: "select", opcoes: SN },
    { k: "fsReb", r: "FS — rebaixamento rápido (mín. 1,3)" },
    { k: "sobC", r: "Sobrecarga considerada no período construtivo, kPa (≥ 10)" },
    { k: "sobO", r: "Sobrecarga considerada no período operacional, kPa (≥ 20)" },
    { k: "rl10", r: "Recalque residual longitudinal previsto — 10 anos, cm" },
    { k: "rl25", r: "Recalque residual longitudinal previsto — 25 anos, cm" },
    { k: "limL10", r: "Classes II/III: limite longitudinal 10 anos definido no projeto, cm (Tabela 2, Obs.)" },
    { k: "limL25", r: "Classes II/III: limite longitudinal 25 anos definido no projeto, cm" },
    { k: "transv", r: "Recalque diferencial transversal aplicável? (Tabela 3)", tipo: "select", opcoes: [["sim", "Sim"], ["nao", "Não aplicável"]] },
    { k: "rt10", r: "Recalque residual diferencial transversal — 10 anos, cm" },
    { k: "rt25", r: "Recalque residual diferencial transversal — 25 anos, cm" },
    { k: "nPre", r: "Investigação preliminar: nº de furos/sondagens no trecho (5.4.2.2)" },
    { k: "base", r: "Sondagens atingiram a base do depósito mole? (5.4.2.2)", tipo: "select", opcoes: SN },
    { k: "impen", r: "Classe I: ao menos uma sondagem até o impenetrável? (5.4.2.1)", tipo: "select", opcoes: SN },
    { k: "complementar", r: "Investigação complementar realizada? (5.4.3)", tipo: "select", opcoes: SN },
    { k: "nExtr", r: "Classe I: nº de extremidades de estrutura adjacentes ao aterro (Tabelas 4 e 5)", ph: "2" },
    { k: "nSPT", r: "Complementar: verticais SPT" }, { k: "nAm", r: "Complementar: verticais de amostragem" },
    { k: "nFVT", r: "Complementar: verticais de palheta (FVT)" }, { k: "nCPTU", r: "Complementar: ensaios CPTU (Tipo 2)" },
    { k: "fvtB", r: "Palheta tipo B (em furo de sondagem) usada? (5.2.1.3 a)", tipo: "select", opcoes: SN },
    { k: "cptSemU", r: "Cone sem medida de poropressão usado? (NOTA 5)", tipo: "select", opcoes: SN },
    { k: "subst", r: "Solução com substituição total da argila mole? (6.1)", tipo: "select", opcoes: SN },
    { k: "gcdv", r: "Geocompostos para drenagem vertical (GCDV)? (6.3.3)", tipo: "select", recarrega: true, opcoes: SN },
    { k: "qw", r: "GCDV: capacidade de descarga, m³/s/m (≥ 1,6e-5)", se: function (d) { return P_(d).gcdv === "sim"; } },
    { k: "tr", r: "GCDV: resistência à tração, kN/m (> 2,5)", se: function (d) { return P_(d).gcdv === "sim"; } },
    { k: "def", r: "GCDV: deformação antes da ruptura, % (≥ 30)", se: function (d) { return P_(d).gcdv === "sim"; } },
    { k: "mand", r: "Mandril: área da seção, cm² (< 70)", se: function (d) { return P_(d).gcdv === "sim"; } },
    { k: "mandFech", r: "Mandril/agulha fechada e GCDV atravessando a camada mole?", tipo: "select", opcoes: SN, se: function (d) { return P_(d).gcdv === "sim"; } },
    { k: "colchao", r: "Colchão drenante: espessura, m (≥ 0,3)", se: function (d) { return P_(d).gcdv === "sim"; } },
    { k: "esp", r: "Espaçamento da malha de GCDV, m (≥ 0,9)", se: function (d) { return P_(d).gcdv === "sim"; } },
    { k: "vacuo", r: "Consolidação a vácuo? (6.3.4 — aterro ≤ 4 m)", tipo: "select", opcoes: SN },
    { k: "preCarga", r: "Pré-carregamento / sobrecarga temporária? (6.3.2)", tipo: "select", opcoes: SN },
    { k: "pSob", r: "Sobrecarga temporária, kPa (em geral 25 % a 30 % do aterro)" },
    { k: "pAterro", r: "Tensão aplicada pelo aterro, kPa" },
    { k: "nSec", r: "Seções instrumentadas (Tabelas 6 e 7)" },
    { k: "nEncI", r: "Encontros instrumentados" },
    { k: "nPlacas", r: "Placas de recalque instaladas (≥ 3 por seção)" },
    { k: "esfH", r: "Encontro com esforços horizontais relevantes nas fundações? (7.3)", tipo: "select", opcoes: SN },
    { k: "nInc", r: "Inclinômetros instalados nos encontros" },
    { k: "Uexig", r: "Grau de adensamento para a retirada da pré-carga, % (projeto)" },
    { k: "t0A", r: "Asaoka: início do trecho sob carga constante, dia", ph: "fim da fase C" },
    { k: "dtA", r: "Asaoka: intervalo constante Δt, dias", ph: "auto" },
    { k: "u0", r: "Poropressão hidrostática no piezômetro, kPa" },
  ];

  // leituras sintéticas: ρ(t) = ρf·(1 − e^(−(t − t0)/τ)) após o alteamento (dados gerados a partir de valores-alvo)
  function gerarLeituras(dias, fases, hs, rf, tau, t0, fr0) {
    return dias.map(function (t, i) {
      var o = { t: String(t), fase: fases[i], h: hs[i] };
      rf.forEach(function (R, k) {
        var ini = fr0 * R * Math.min(1, t / t0), v = t <= t0 ? ini : ini + (R - fr0 * R) * (1 - Math.exp(-(t - t0) / tau));
        o["p" + (k + 1)] = fmt(v + ((i * 7 + k * 3) % 5 - 2) * 0.8, 0);
      });
      return o;
    });
  }

  FE.FICHAS[ID] = {
    titulo: "Aterros sobre solos moles — verificações de projeto e monitoramento",
    lote: true,
    resumo: "Classe do aterro e tipo de rodovia (4.1; 4.2), FS mínimos por etapa (Tabela 1), sobrecargas (4.3.4), recalques residuais (Tabelas 2 e 3), investigações mínimas (5.4; Tabelas 4 e 5), GCDV e vácuo (6.3), instrumentação mínima (Tabelas 6 e 7), frequência de leituras (7.4) e previsão de Asaoka para a retirada da pré-carga (7.4.1); N_SPT,60 (eq. 1) e N_kt (eq. 2).",
    rotuloImportar: function (r) { return "Classe " + ((r.classe || {}).c || "?") + " · " + ((r.parecer || {}).titulo || ""); },
    params: params,
    padrao: { fase: "projeto", transv: "sim" },
    tabelas: function () {
      return [
        { chave: "leit", titulo: "Leituras da instrumentação (7.2; 7.4)", rotulo: "Leitura", iniciais: 4, min: 0, dica: "uma coluna por leitura; fase C = execução do aterro, S = com sobrecarga, P = após a retirada",
          linhas: [{ k: "t", r: "Tempo desde o início do aterro", u: "dias" }, { k: "data", r: "Data", texto: true }, { k: "fase", r: "Fase (C / S / P)", texto: true },
            { k: "h", r: "Altura do aterro sobre a placa", u: "m" },
            { k: "p1", r: "Placa PR1 — recalque", u: "mm" }, { k: "p2", r: "Placa PR2 — recalque", u: "mm" }, { k: "p3", r: "Placa PR3 — recalque", u: "mm" }, { k: "p4", r: "Placa PR4 — recalque", u: "mm" },
            { calc: "med", r: "Recalque médio das placas", u: "mm", casas: 0, destaque: true },
            { k: "u", r: "Piezômetro — poropressão", u: "kPa" }, { k: "dh", r: "Inclinômetro — deslocamento horizontal máximo", u: "mm" }] },
        { chave: "campo", titulo: "Ensaios de campo — correções (5.2.1.1 eq. 1; 5.2.1.2 eq. 2)", rotulo: "Profundidade", iniciais: 0, min: 0, dica: "opcional",
          linhas: [{ k: "z", r: "Profundidade", u: "m" }, { k: "N", r: "N_SPT medido", u: "golpes" }, { k: "E", r: "Energia aplicada (% da teórica)", u: "%" },
            { calc: "N60", r: "N_SPT,60 = N × E / 0,60 (eq. 1)", u: "", casas: 1 }, { k: "qt", r: "q_t do CPTU", u: "kPa" }, { k: "sv0", r: "σ_v0", u: "kPa" },
            { k: "su", r: "S_u da palheta (FVT)", u: "kPa" }, { calc: "Nkt", r: "N_kt = (q_t − σ_v0) / S_u (eq. 2)", u: "", casas: 1 }] }];
    },
    calcular: calcular,
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return A.htmlParecer(r.parecer) + '<div class="fe-res">' + A.cartao(r.classe.c ? "Classe " + r.classe.c : "—", r.classe.txt) + "</div>" +
        A.htmlCriterios(r.linhas, { estilo: "resultado" }) + (tabAsaoka(r) ? '<h4 style="margin:12px 0 4px">Asaoka (7.4.1)</h4>' + tabAsaoka(r) : "") +
        (tabCampo(r) ? '<h4 style="margin:12px 0 4px">Ensaios de campo</h4>' + tabCampo(r) : "");
    },
    graficos: graficos,
    relatorio: {
      notas: "DNIT 381/2022-PRO. FS mínimos da Tabela 1 (independentes da classe); recalques residuais das Tabelas 2 e 3 (longitudinal das Classes II e III definido no projeto); instrumentação mínima de 3 placas por seção (7.3). Asaoka (1978): leituras interpoladas a intervalos Δt constantes no trecho sob carga constante, ρ(j) = β0 + β1·ρ(j−1), ρ final = β0/(1 − β1), U = ρ atual/ρ final — só o adensamento primário. Eq. 1 com a energia como fração da teórica. A PRO não fixa limites de alerta para piezômetros e inclinômetros: as leituras são registradas e analisadas conforme os objetivos do monitoramento (7.4.1).",
      resultados: function (calc) {
        var r = calc.resultados, rows = [["Parecer", r.parecer.titulo], ["Classe do aterro", r.classe.txt]];
        Object.keys(r.asa).forEach(function (p) { var a = r.asa[p]; if (a && ok(a.rf)) rows.push(["Asaoka " + p.toUpperCase(), "ρf = " + fmt(a.rf, 0) + " mm · U = " + fmt(a.U, 1) + " %"]); });
        return rows;
      },
      extraHtml: function (calc) { var r = calc.resultados; return A.htmlParecer(r.parecer, { relat: true }) + A.htmlCriterios(r.linhas, { relat: true, estilo: "resultado" }) + (tabAsaoka(r, true) ? "<h2>Asaoka</h2>" + tabAsaoka(r, true) : "") + (tabCampo(r, true) ? "<h2>Ensaios de campo</h2>" + tabCampo(r, true) : ""); },
    },
    exemplos: [
      { nome: "Encontro de ponte (Classe I, Tipo 2) com GCDV e pré-carga — retirada liberada", dados: function () {
        var dias = [0, 1, 2, 3, 4, 5, 6], fases = ["C", "C", "C", "C", "C", "C", "C"], hs = ["0,5", "1,2", "1,9", "2,6", "3,3", "4,0", "4,6"];
        for (var t = 13; t <= 160; t += 7) { dias.push(t); fases.push("S"); hs.push("4,6"); }
        return { ident: { registro: "ASM-01", data: "2026-06-30", obra: "Obra A — BR-000", trecho: "Encontro E1 da ponte sobre o Rio A", local: "Est. 210 a 216", responsavel: "Engenheiro A" },
          params: { fase: "obra", tipoRod: "2", junto: "sim", extI: "60", h: "4,6", ext: "120", espMole: "9", nEnc: "1", eqLim: "sim", fsCons: "1,25", fsFim: "1,34", fsLongo: "1,62",
            rebaix: "nao", sobC: "10", sobO: "20", rl10: "1,6", rl25: "3,8", transv: "sim", rt10: "1,1", rt25: "2,9", nPre: "5", base: "sim", impen: "sim", complementar: "sim", nExtr: "2",
            nSPT: "2", nAm: "2", nFVT: "4", nCPTU: "2", fvtB: "nao", cptSemU: "nao", subst: "nao", gcdv: "sim", qw: "2,1e-5", tr: "3,2", def: "45", mand: "62", mandFech: "sim", colchao: "0,50", esp: "1,5",
            vacuo: "nao", preCarga: "sim", pSob: "24", pAterro: "88", nSec: "1", nEncI: "1", nPlacas: "3", esfH: "sim", nInc: "1", Uexig: "85", t0A: "6", dtA: "14", u0: "60" },
          leit: gerarLeituras(dias, fases, hs, [860, 920, 780], 55, 6, 0.12).map(function (o, i) { o.u = fmt(60 + (i < 7 ? 12 * i : 72 * Math.exp(-(Number(o.t) - 6) / 50)), 1); o.dh = fmt(i < 7 ? 3 * i : 18 + 4 * (1 - Math.exp(-(Number(o.t) - 6) / 40)), 1); return o; }),
          campo: [{ z: "2", N: "1", E: "72", su: "9" }, { z: "4", N: "1", E: "72", qt: "210", sv0: "58", su: "12" }, { z: "6", N: "2", E: "72", qt: "285", sv0: "87", su: "16" }] };
      } },
      { nome: "Aterro alto (Classe II) — FS longo prazo, sobrecarga, recalque transversal e instrumentação insuficientes", dados: function () {
        var dias = [0, 3, 6, 10, 20, 30, 40, 50, 60], fases = ["C", "C", "C", "C", "S", "S", "S", "S", "S"], hs = ["1,0", "2,0", "3,2", "4,2", "4,2", "4,2", "4,2", "4,2", "4,2"];
        return { ident: { registro: "ASM-02", data: "2026-08-12", obra: "Obra B — BR-000", trecho: "Várzea do km 18", local: "Est. 900 a 940" },
          params: { fase: "obra", tipoRod: "2", junto: "nao", h: "4,2", ext: "800", espMole: "6", eqLim: "sim", fsCons: "1,21", fsFim: "1,30", fsLongo: "1,40", rebaix: "sim", fsReb: "1,25",
            sobC: "10", sobO: "10", rl10: "6", rl25: "11", limL10: "", limL25: "", transv: "sim", rt10: "4", rt25: "12", nPre: "7", base: "sim", complementar: "sim",
            nSPT: "3", nAm: "2", nFVT: "4", nCPTU: "4", gcdv: "sim", qw: "1,2e-5", tr: "2,5", def: "35", mand: "75", mandFech: "sim", colchao: "0,25", esp: "0,8",
            preCarga: "sim", pSob: "20", pAterro: "80", nSec: "1", nPlacas: "2", Uexig: "90", t0A: "10", dtA: "10" },
          leit: gerarLeituras(dias, fases, hs, [640, 700], 60, 10, 0.15).map(function (o) { delete o.p3; return o; }) };
      } },
    ],
  };
})();
