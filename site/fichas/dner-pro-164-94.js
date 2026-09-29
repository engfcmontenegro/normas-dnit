/*
 * Ficha: DNER-PRO 164/94 — Calibração e controle de sistemas medidores de irregularidade tipo resposta
 * (Integrador IPR/USP e Maysmeter). Registra-se em window.FE (usa FE.aceitacao para critérios e parecer).
 *
 * O que a PRO manda (seções do PDF):
 *   3.3   equação de calibração QI = a + b·L (a) ou QI = a + b·L + c·L² (b), mínimos quadrados; L = leitura do medidor.
 *   4     operações preliminares: carga de 883 ± 9,8 N (90 ± 1 kgf) no piso (4.2); 8 ímãs na roda (4.3); alinhamento e
 *         balanceamento (4.4); magnetos a 6 ± 0,5 mm do sensor (4.5); pneus na pressão do fabricante (4.6); fluido da
 *         bateria 1 230 a 1 260 gf/cm³ (4.7); medidor de distância ajustado num trecho de 320 ± 0,1 m (4.8);
 *         viagem de 100 ± 5 km se o sistema ainda não operou (4.9).
 *   5.2   20 trechos de referência de 320 m, em tangente e nível, com ampla faixa de irregularidade.
 *   5.3   QI dos trechos por nível e mira (DNER-ES 173/86 — ficha da DNER-ES 173, importável).
 *   5.4   5 corridas a 80, 50 e 30 km/h por trecho; L = média das leituras, por velocidade.
 *   5.6   equação aceitável com r² ≥ 0,8.
 *   5.7   Quadro resumo (Anexos D/E): V = faixa de variação (máx. − mín.) das leituras do trecho; V̄ = ΣV / nº de trechos;
 *         limite superior de controle da variação = 2,11·V̄; limites de controle da média = ± 0,58·V̄ (Anexo E).
 *         V > 2,11·V̄ → medir de novo o trecho; repetindo, eliminar o trecho e recalcular os limites.
 *   6.2   controle depois do levantamento: 5 trechos de referência sorteados; Δ = Lmáx − Lmín (≤ 2,11·V̄, 6.2.3) e
 *         ΔL̄ = L̄ inicial − L̄ atual (dentro de ± 0,58·V̄, 6.2.4; o texto diz "V", o Anexo E dá 0,58·V̄); fora dos limites:
 *         levantamento prejudicado e refeito (6.2.4: e recalibrar o sistema, Capítulo 5). Anexo L: L̄ atual = soma / 5.
 * Interpretações: 6.2.2 fala em percorrer "2 vezes" os 5 trechos, mas o Anexo L registra 5 percursos e os fatores 2,11 e
 * 0,58 são os de gráficos de controle para subgrupos de 5 leituras — a ficha aceita 2 a 5 percursos e avisa quando < 5.
 * Os limites de controle usam a velocidade escolhida no parâmetro (o Anexo E não indica a velocidade).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var ID = "dner-pro-164-94";
  var VELS = ["80", "50", "30"];
  var D4 = 2.11, A2 = 0.58;
  var SN = [["", "—"], ["sim", "Sim"], ["nao", "Não"]];

  function vazio(v) { return v === undefined || v === null || String(v).trim() === ""; }
  // regressão (3.3): linear ou quadrática; r² = 1 − SQres/SQtot
  function regressao(xs, ys, grau) {
    var n = xs.length;
    if (n < grau + 2) return null;
    var co;
    if (grau === 1) {
      var mx = media(xs), my = media(ys), sxy = 0, sxx = 0;
      xs.forEach(function (x, i) { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) * (x - mx); });
      if (!sxx) return null;
      co = { b: sxy / sxx }; co.a = my - co.b * mx; co.c = 0;
    } else {
      var p = FE.parabola(xs, ys);
      if (!p) return null;
      co = { a: p.c, b: p.b, c: p.a };
    }
    var my2 = media(ys), sr = 0, st = 0;
    xs.forEach(function (x, i) { var f = co.a + co.b * x + co.c * x * x; sr += Math.pow(ys[i] - f, 2); st += Math.pow(ys[i] - my2, 2); });
    co.r2 = st > 0 ? 1 - sr / st : NaN; co.n = n; co.grau = grau;
    co.f = function (x) { return co.a + co.b * x + co.c * x * x; };
    return co;
  }
  function eqTxt(co) {
    if (!co) return "—";
    function sg(v, c) { return (v < 0 ? " − " : " + ") + fmt(Math.abs(v), c); }
    return "QI = " + fmt(co.a, 2) + sg(co.b, 4) + "·L" + (co.grau === 2 ? sg(co.c, 7) + "·L²" : "");
  }
  function leituras(c, v) {
    var out = [];
    for (var j = 1; j <= 5; j++) { var x = num(c["l" + v + "_" + j]); if (ok(x)) out.push(x); }
    return out;
  }
  function linhaSN(id, grupo, crit, secao, v, exig) {
    var l = A.linha({ id: id, grupo: grupo, criterio: crit, secao: secao, exigido: exig, resultado: v === "sim" ? "sim" : v === "nao" ? "não" : "—", n: v ? 1 : 0 });
    if (v === "nao") A.marcar(l, "nao_conforme", "não atende");
    else if (v !== "sim") A.marcar(l, "pendente", "não informado");
    return l;
  }
  function faixaNum(id, grupo, crit, secao, v, lo, hi, exig, casas, u) {
    var x = num(v), l = A.linha({ id: id, grupo: grupo, criterio: crit, secao: secao, exigido: exig, resultado: ok(x) ? fmt(x, casas) + (u ? " " + u : "") : "—", n: ok(x) ? 1 : 0 });
    if (!ok(x)) A.marcar(l, "pendente", "não informado");
    else if (x < lo - 1e-9 || x > hi + 1e-9) A.marcar(l, "nao_conforme", "fora de " + exig);
    return l;
  }

  function calcular(d) {
    var P = d.params || {}, avisos = [], linhas = [];
    var vc = P.velControle || "80", grau = P.forma === "b" ? 2 : 1;
    // ---- calibração: por trecho e velocidade
    var tr = (d.tr || []).map(function (c, i) {
      var o = { nome: c.trecho || "trecho " + (i + 1), qi: num(c.qi), usar: c.usar !== false };
      VELS.forEach(function (v) {
        var L = leituras(c, v);
        o["n" + v] = L.length;
        o["L" + v] = L.length ? media(L) : NaN;
        o["V" + v] = L.length > 1 ? Math.max.apply(null, L) - Math.min.apply(null, L) : NaN;
      });
      return o;
    });
    var validos = tr.filter(function (o) { return VELS.some(function (v) { return o["n" + v]; }) || ok(o.qi); });
    var porVel = {};
    VELS.forEach(function (v) {
      var comL = tr.filter(function (o) { return o["n" + v]; });
      var Vs = comL.map(function (o) { return o["V" + v]; }).filter(ok);
      var Vb = Vs.length ? media(Vs) : NaN;
      var par = comL.filter(function (o) { return ok(o.qi); });
      var xs = par.map(function (o) { return o["L" + v]; }), ys = par.map(function (o) { return o.qi; });
      porVel[v] = { n: comL.length, Vtot: Vs.reduce(function (a, b) { return a + b; }, 0), Vb: Vb, lsc: D4 * Vb, lcm: A2 * Vb,
        reg1: regressao(xs, ys, 1), reg2: regressao(xs, ys, 2), pares: par.length,
        acima: comL.filter(function (o) { return ok(o["V" + v]) && o["V" + v] > D4 * Vb + 1e-9; }).map(function (o) { return o.nome + " (V = " + fmt(o["V" + v], 0) + ")"; }),
        incompletos: comL.filter(function (o) { return o["n" + v] < 5; }).map(function (o) { return o.nome + " (" + o["n" + v] + ")"; }) };
    });

    var G0 = "Operações preliminares (4)", G1 = "Calibração (5)", G2 = "Controle depois do levantamento (6.2)";
    if (P.etapa !== "controle") {
      linhas.push(faixaNum("carga", G0, "Carga no piso do veículo", "4.2", P.carga, 873.2, 892.8, "883 ± 9,8 N (90 ± 1 kgf)", 1, "N"));
      linhas.push(faixaNum("imas", G0, "Quantidade de ímãs na roda", "4.3", P.imas, 8, 8, "8 ímãs", 0));
      linhas.push(linhaSN("alinh", G0, "Alinhamento e balanceamento das 4 rodas e do estepe", "4.4", P.alinh, "feito"));
      linhas.push(faixaNum("gap", G0, "Espaçamento magnetos – sensor", "4.5", P.gap, 5.5, 6.5, "6 ± 0,5 mm", 1, "mm"));
      linhas.push(linhaSN("pneus", G0, "Pneus na pressão recomendada pelo fabricante", "4.6", P.pneus, "calibrados"));
      linhas.push(faixaNum("bat", G0, "Peso específico do fluido da bateria", "4.7", P.bateria, 1230, 1260, "1 230 a 1 260 gf/cm³", 0, "gf/cm³"));
      linhas.push(linhaSN("dist", G0, "Medidor de distância ajustado num trecho de 320 ± 0,1 m (constante anotada)", "4.8", P.distancia, "ajustado"));
      if (P.novo === "sim") linhas.push(faixaNum("viagem", G0, "Viagem prévia (sistema que ainda não operou)", "4.9", P.viagem, 95, 105, "100 ± 5 km", 0, "km"));
      // trechos
      var nT = tr.filter(function (o) { return ok(o.qi) && VELS.some(function (v) { return o["n" + v]; }); }).length;
      var lt = A.linha({ id: "ntr", grupo: G1, criterio: "Trechos de referência com QI e leituras", secao: "5.2", exigido: "20 trechos de 320 m, tangente e nível", resultado: nT + " trecho(s)", n: nT });
      if (!nT) A.marcar(lt, "sem_dados", "sem trechos");
      else if (nT < 20) A.marcar(lt, "ressalva", nT + " trechos (5.2 pede 20)");
      var ext = num(P.extensao);
      if (ok(ext) && Math.abs(ext - 320) > 0.5) A.marcar(lt, "ressalva", "trechos de " + fmt(ext, 0) + " m (5.2: 320 m)");
      linhas.push(lt);
      var semQI = tr.filter(function (o) { return !ok(o.qi) && VELS.some(function (v) { return o["n" + v]; }); }).map(function (o) { return o.nome; });
      if (semQI.length) avisos.push("Trechos sem QI de nível e mira (5.3): " + semQI.join(", ") + " — fora da regressão.");
      VELS.forEach(function (v) {
        var pv = porVel[v], reg = grau === 2 ? pv.reg2 : pv.reg1;
        var lr = A.linha({ id: "reg" + v, grupo: G1, criterio: "Equação de calibração a " + v + " km/h — forma (" + (grau === 2 ? "b" : "a") + ")", secao: "3.3 / 5.5 / 5.6",
          exigido: "r² ≥ 0,80", n: pv.pares, resultado: reg ? eqTxt(reg) + " · r² = " + fmt(reg.r2, 3) : "—" });
        if (!pv.n) A.marcar(lr, "sem_dados", "sem leituras a " + v + " km/h (5.4: 80, 50 e 30 km/h)");
        else if (!reg) A.marcar(lr, "pendente", "pares QI × L insuficientes para a regressão");
        else if (reg.r2 < 0.8 - 1e-12) A.marcar(lr, "nao_conforme", "r² = " + fmt(reg.r2, 3) + " < 0,80: manutenção do sistema e revisão das planilhas de nível e mira (5.6)");
        if (pv.incompletos.length) A.marcar(lr, "ressalva", "trechos com menos de 5 corridas (5.4): " + pv.incompletos.join(", "));
        linhas.push(lr);
        if (pv.n) {
          var lv = A.linha({ id: "var" + v, grupo: G1, criterio: "Faixa de variação V × limite 2,11·V̄ a " + v + " km/h", secao: "5.7 (Anexo E)", n: pv.n,
            exigido: "V ≤ 2,11·V̄", resultado: "V̄ = " + fmt(pv.Vb, 2) + " · 2,11·V̄ = " + fmt(pv.lsc, 2) + " · ± 0,58·V̄ = " + fmt(pv.lcm, 2) });
          if (pv.acima.length) A.marcar(lv, "pendente", "medir de novo e refazer o quadro resumo (5.7): " + pv.acima.join(", "));
          linhas.push(lv);
        }
      });
    }
    // ---- controle (6.2)
    var calV = porVel[vc], Vb = num(P.vbarra);
    var VbUsado = ok(Vb) ? Vb : calV.Vb, fonteVb = ok(Vb) ? "informado" : "da calibração a " + vc + " km/h";
    var mapa = {};
    tr.forEach(function (o) { if (o.nome) mapa[String(o.nome).trim().toUpperCase()] = o["L" + vc]; });
    var ctl = (d.ct || []).map(function (c, i) {
      var L = [];
      for (var j = 1; j <= 5; j++) { var x = num(c["p" + j]); if (ok(x)) L.push(x); }
      var l0 = num(c.l0);
      if (!ok(l0) && c.trecho) l0 = mapa[String(c.trecho).trim().toUpperCase()];
      var o = { nome: c.trecho || "trecho " + (i + 1), n: L.length, soma: L.reduce(function (a, b) { return a + b; }, 0), l0u: l0 };
      // Anexos E e L: L̄ inteiro (L̄ atual = soma / 5, arredondado) antes da diferença
      if (ok(l0)) l0 = Math.round(l0);
      o.l0u = l0;
      o.la = L.length ? Math.round(o.soma / L.length) : NaN;
      o.delta = L.length > 1 ? Math.max.apply(null, L) - Math.min.apply(null, L) : NaN;
      o.dl = ok(l0) && ok(o.la) ? l0 - o.la : NaN;
      return o;
    });
    var ctlUsados = ctl.filter(function (o) { return o.n; });
    if (ctlUsados.length || P.etapa === "controle") {
      var lsc = D4 * VbUsado, lcm = A2 * VbUsado;
      var lc = A.linha({ id: "ctn", grupo: G2, criterio: "Trechos de controle e percursos", secao: "6.2.2 / Anexo L", exigido: "5 trechos sorteados; 5 percursos (Anexo L)",
        resultado: ctlUsados.length + " trecho(s) · " + ctlUsados.map(function (o) { return o.n; }).join("/") + " percursos", n: ctlUsados.length });
      if (!ctlUsados.length) A.marcar(lc, "sem_dados", "sem leituras de controle");
      else {
        if (ctlUsados.length < 5) A.marcar(lc, "ressalva", ctlUsados.length + " trechos (6.2.2: 5)");
        if (ctlUsados.some(function (o) { return o.n < 2; })) A.marcar(lc, "pendente", "trecho com menos de 2 percursos");
        else if (ctlUsados.some(function (o) { return o.n < 5; })) A.marcar(lc, "ressalva", "menos de 5 percursos: os fatores 2,11 e 0,58 valem para 5 leituras (Anexo L)");
      }
      linhas.push(lc);
      var ld = A.linha({ id: "ctd", grupo: G2, criterio: "Variação Δ = Lmáx − Lmín de cada trecho", secao: "6.2.3", n: ctlUsados.length,
        exigido: "Δ ≤ 2,11·V̄ = " + fmt(lsc, 2) + " (V̄ " + fonteVb + ")", resultado: ctlUsados.map(function (o) { return o.nome + ": " + fmt(o.delta, 0); }).join(" · ") || "—" });
      var mL = A.linha({ id: "ctm", grupo: G2, criterio: "Diferença ΔL̄ = L̄ inicial − L̄ atual", secao: "6.2.4", n: ctlUsados.length,
        exigido: "|ΔL̄| ≤ 0,58·V̄ = " + fmt(lcm, 2), resultado: ctlUsados.map(function (o) { return o.nome + ": " + fmt(o.dl, 0); }).join(" · ") || "—" });
      if (!ok(VbUsado)) { A.marcar(ld, "pendente", "V̄ desconhecido: faça a calibração ou informe V̄"); A.marcar(mL, "pendente", "V̄ desconhecido"); }
      else {
        var foraD = ctlUsados.filter(function (o) { return ok(o.delta) && o.delta > lsc + 1e-9; });
        if (foraD.length) A.marcar(ld, "nao_conforme", "fora do limite: " + foraD.map(function (o) { return o.nome + " (Δ = " + fmt(o.delta, 0) + ")"; }).join(", ") + " — levantamento prejudicado e refeito (6.2.3)");
        var semL0 = ctlUsados.filter(function (o) { return !ok(o.dl); });
        if (semL0.length) A.marcar(mL, "pendente", "sem L̄ inicial: " + semL0.map(function (o) { return o.nome; }).join(", "));
        var foraM = ctlUsados.filter(function (o) { return ok(o.dl) && Math.abs(o.dl) > lcm + 1e-9; });
        if (foraM.length) A.marcar(mL, "nao_conforme", "fora dos limites: " + foraM.map(function (o) { return o.nome + " (ΔL̄ = " + fmt(o.dl, 0) + ")"; }).join(", ") + " — levantamento refeito e sistema recalibrado (6.2.4)");
      }
      linhas.push(ld); linhas.push(mL);
    }
    var par = A.parecer(linhas, [], { textos: {
      ACEITO: { titulo: P.etapa === "controle" ? "CONTROLE ATENDIDO — LEVANTAMENTO VÁLIDO" : "SISTEMA CALIBRADO", texto: "Critérios da DNER-PRO 164/94 atendidos." },
      RESSALVA: { titulo: P.etapa === "controle" ? "CONTROLE ATENDIDO COM RESSALVA" : "SISTEMA CALIBRADO COM RESSALVA", texto: "Critérios atendidos; há pontos a documentar." },
      PENDENTE: { titulo: "CALIBRAÇÃO / CONTROLE INCOMPLETO", texto: "Faltam dados, velocidades ou há trechos a medir de novo (5.7)." },
      REJEITADO: { titulo: "NÃO CONFORME", texto: "Calibração não aceita (r² < 0,8) ou controle fora dos limites: levantamento prejudicado, refazer e recalibrar." } } });
    var tabTr = tr.map(function (o) { var x = {}; VELS.forEach(function (v) { x["L" + v] = o["L" + v]; x["V" + v] = o["V" + v]; }); return x; });
    return { tab: { tr: tabTr, ct: ctl.map(function (o) { return { l0u: o.l0u, la: o.la, delta: o.delta, dl: o.dl }; }) },
      resultados: { linhas: linhas, parecer: par, porVel: porVel, grau: grau, vc: vc, VbUsado: VbUsado, ctl: ctlUsados, tr: tr, nTrechos: validos.length }, avisos: avisos };
  }

  function htmlResumo(r, relat) {
    var cls = relat ? "gr" : "fe-resumo";
    return '<table class="' + cls + '"><thead><tr><th style="text-align:left">Velocidade</th><th>Trechos</th><th style="text-align:left">Forma (a) — linear</th><th>r²</th><th style="text-align:left">Forma (b) — quadrática</th><th>r²</th><th>V̄</th><th>2,11·V̄</th><th>± 0,58·V̄</th></tr></thead><tbody>' +
      VELS.map(function (v) {
        var p = r.porVel[v];
        return '<tr><td style="text-align:left">' + v + " km/h</td><td>" + p.n + '</td><td style="text-align:left">' + esc(eqTxt(p.reg1)) + "</td><td>" + (p.reg1 ? fmt(p.reg1.r2, 3) : "—") +
          '</td><td style="text-align:left">' + esc(eqTxt(p.reg2)) + "</td><td>" + (p.reg2 ? fmt(p.reg2.r2, 3) : "—") + "</td><td>" + fmt(p.Vb, 2) + "</td><td>" + fmt(p.lsc, 2) + "</td><td>" + fmt(p.lcm, 2) + "</td></tr>";
      }).join("") + "</tbody></table>";
  }

  function svgBase(W, H, m, titulo, imp) {
    var txt = imp ? "#222" : "var(--text-dim)";
    return '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10"><text x="' + m.l + '" y="13" fill="' + txt + '" font-weight="bold" font-size="11">' + esc(titulo) + "</text>";
  }
  function graficos(calc, d, opt) {
    opt = opt || {};
    var r = calc.resultados, out = [], imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)";
    var cores = imp ? { "80": "#1f5fbf", "50": "#c0392b", "30": "#2e8b57" } : { "80": "#4f8cff", "50": "#e5534b", "30": "#34c38f" };
    // 1) QI × L̄ com as equações
    var pts = [];
    VELS.forEach(function (v) { r.tr.forEach(function (o) { if (ok(o.qi) && ok(o["L" + v])) pts.push([o["L" + v], o.qi, v]); }); });
    if (pts.length >= 2) {
      var W = 560, H = 260, m = { l: 46, r: 14, t: 22, b: 36 };
      var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
      var x0 = 0, x1 = Math.max.apply(null, xs) * 1.08, y0 = Math.min(0, Math.min.apply(null, ys)), y1 = Math.max.apply(null, ys) * 1.1;
      var X = function (v) { return m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r); }, Y = function (v) { return H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b); };
      var s = svgBase(W, H, m, "QI (nível e mira) × leitura média L̄ — equação de calibração (3.3)", imp);
      for (var g = 0; g <= 5; g++) {
        var gy = y0 + (y1 - y0) * g / 5, gx = x0 + (x1 - x0) * g / 5;
        s += '<line x1="' + m.l + '" y1="' + Y(gy) + '" x2="' + (W - m.r) + '" y2="' + Y(gy) + '" stroke="' + grade + '" stroke-width="0.6"/><text x="' + (m.l - 4) + '" y="' + (Y(gy) + 3) + '" text-anchor="end" fill="' + txt + '">' + Math.round(gy) + '</text><text x="' + X(gx) + '" y="' + (H - m.b + 13) + '" text-anchor="middle" fill="' + txt + '">' + Math.round(gx) + "</text>";
      }
      s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + txt + '" stroke-width="0.6"/>';
      var k = 0;
      VELS.forEach(function (v) {
        var reg = r.grau === 2 ? r.porVel[v].reg2 : r.porVel[v].reg1;
        var pv = pts.filter(function (p) { return p[2] === v; });
        if (!pv.length) return;
        pv.forEach(function (p) { s += '<circle cx="' + X(p[0]).toFixed(1) + '" cy="' + Y(p[1]).toFixed(1) + '" r="2.6" fill="' + cores[v] + '"/>'; });
        if (reg) {
          var lo = Math.min.apply(null, pv.map(function (p) { return p[0]; })), hi = Math.max.apply(null, pv.map(function (p) { return p[0]; })), dd = "";
          for (var q = 0; q <= 40; q++) { var xx = lo + (hi - lo) * q / 40; dd += (q ? "L" : "M") + X(xx).toFixed(1) + " " + Y(reg.f(xx)).toFixed(1); }
          s += '<path d="' + dd + '" fill="none" stroke="' + cores[v] + '" stroke-width="1.2"/>';
        }
        s += '<text x="' + (m.l + 8) + '" y="' + (m.t + 12 + 12 * k++) + '" fill="' + cores[v] + '">' + v + " km/h" + (reg ? " — r² = " + fmt(reg.r2, 3) : "") + "</text>";
      });
      s += '<text x="' + ((W + m.l) / 2) + '" y="' + (H - 5) + '" text-anchor="middle" fill="' + txt + '">Leitura média do medidor L̄</text>';
      out.push(s + "</svg>");
    }
    // 2) V por trecho (velocidade de controle) × 2,11·V̄  (Anexo G)
    var pvc = r.porVel[r.vc];
    var ptsV = r.tr.map(function (o, i) { return { x: i + 1, y: o["V" + r.vc], fora: ok(o["V" + r.vc]) && o["V" + r.vc] > pvc.lsc }; }).filter(function (p) { return ok(p.y); });
    if (ptsV.length) out.push(A.grafico("Controle da variação — V por trecho a " + r.vc + " km/h (Anexo G)", ptsV, [{ y: pvc.lsc, tipo: "lim", txt: "2,11·V̄ = " + fmt(pvc.lsc, 2) }, { y: pvc.Vb, tipo: "med", txt: "V̄ = " + fmt(pvc.Vb, 2) }], opt, "idx"));
    // 3) controle: Δ e ΔL̄ (Anexos G e I)
    if (r.ctl.length && ok(r.VbUsado)) {
      out.push(A.grafico("Controle das médias — ΔL̄ = L̄ inicial − L̄ atual (Anexo I)", r.ctl.map(function (o, i) { return { x: i + 1, y: o.dl, fora: Math.abs(o.dl) > A2 * r.VbUsado }; }),
        [{ y: A2 * r.VbUsado, tipo: "lim", txt: "+0,58·V̄" }, { y: -A2 * r.VbUsado, tipo: "lim", txt: "−0,58·V̄" }, { y: 0, tipo: "med", txt: "0" }], opt, "idx"));
      out.push(A.grafico("Controle da variação — Δ dos trechos de controle (Anexo G)", r.ctl.map(function (o, i) { return { x: i + 1, y: o.delta, fora: o.delta > D4 * r.VbUsado }; }),
        [{ y: D4 * r.VbUsado, tipo: "lim", txt: "2,11·V̄" }], opt, "idx"));
    }
    return out.filter(Boolean);
  }

  function linhasTr() {
    var L = [{ k: "trecho", r: "Trecho de referência", texto: true, ph: "M-10" }, { k: "qi", r: "QI — nível e mira (DNER-ES 173)", u: "cont./km" }];
    VELS.forEach(function (v) {
      L.push({ grupo: "Corridas a " + v + " km/h (5.4)" });
      for (var j = 1; j <= 5; j++) L.push({ k: "l" + v + "_" + j, r: "L" + j + " — " + v + " km/h", u: "" });
      L.push({ calc: "L" + v, r: "L̄ — média a " + v + " km/h", u: "", casas: 0, destaque: true });
      L.push({ calc: "V" + v, r: "V — faixa de variação a " + v + " km/h", u: "", casas: 0 });
    });
    return L;
  }

  // ---- exemplos ----
  // Anexo E (p. 12): leituras L1…L5 dos 23 trechos (M-10 sem L4)
  var ANEXO_E = [["M-10", [194, 198, 202, "", 205]], ["M-11", [314, 304, 309, 328, 314]], ["M-12", [201, 199, 215, 199, 203]], ["M-13", [379, 379, 380, 376, 406]],
    ["M-14", [341, 327, 328, 327, 333]], ["M-15", [367, 367, 376, 369, 399]], ["M-17", [153, 177, 177, 177, 177]], ["M-18", [167, 185, 188, 189, 196]],
    ["M-19", [130, 134, 137, 145, 142]], ["M-20", [170, 172, 160, 172, 190]], ["M-23", [145, 148, 153, 153, 159]], ["M-27", [250, 252, 255, 258, 244]],
    ["M-28", [329, 307, 324, 321, 312]], ["M-29", [399, 398, 396, 414, 386]], ["M-30", [413, 411, 413, 413, 411]], ["M-31", [395, 391, 419, 396, 396]],
    ["M-32", [207, 226, 205, 216, 208]], ["M-33", [345, 334, 327, 345, 333]], ["M-34", [373, 383, 379, 391, 402]], ["M-35", [414, 415, 414, 414, 413]],
    ["M-36", [360, 348, 311, 344, 343]], ["M-37", [381, 408, 416, 392, 384]], ["M-38", [610, 631, 625, 633, 625]]];
  // QI ilustrativo (o Anexo E não traz o QI de nível e mira): QI ≈ 4 + 0,11·L̄ com pequena dispersão
  function qiIlustr(Lm, i) { return Math.round(4 + 0.11 * Lm + ((i * 37) % 9) - 4); }
  function colsAnexoE() {
    return ANEXO_E.map(function (t, i) {
      var c = { trecho: t[0] }, vs = t[1].filter(function (x) { return x !== ""; });
      c.qi = String(qiIlustr(media(vs), i));
      t[1].forEach(function (x, j) { c["l80_" + (j + 1)] = String(x); });
      return c;
    });
  }
  // calibração completa gerada: 20 trechos, 3 velocidades (leitura cresce com a velocidade)
  function colsGeradas() {
    var out = [];
    for (var i = 0; i < 20; i++) {
      var qi = 18 + i * 4.6 + ((i * 13) % 5) - 2, c = { trecho: "R-" + (i + 1 < 10 ? "0" : "") + (i + 1), qi: String(Math.round(qi + ((i * 7) % 9) - 4)) };
      [["80", 1.0], ["50", 0.82], ["30", 0.66]].forEach(function (vf) {
        var base = (qi - 3) / 0.11 * vf[1];
        for (var j = 1; j <= 5; j++) c["l" + vf[0] + "_" + j] = String(Math.round(base + (((i + 1) * (j + 2) * 7) % 17) - 8));
      });
      out.push(c);
    }
    return out;
  }

  FE.FICHAS[ID] = {
    titulo: "Calibração e controle de medidor de irregularidade tipo resposta",
    lote: true,
    resumo: "Leituras das 5 corridas a 80, 50 e 30 km/h nos trechos de referência (5.4), equação QI = a + b·L (+ c·L²) por mínimos quadrados com r² ≥ 0,8 (3.3, 5.6), quadro resumo com V, V̄, 2,11·V̄ e ± 0,58·V̄ (5.7, Anexo E) e controle depois do levantamento (6.2, Anexo L). QI importável da ficha da DNER-ES 173.",
    rotuloImportar: function (r) {
      var p = r.porVel && r.porVel[r.vc], reg = p ? (r.grau === 2 ? p.reg2 : p.reg1) : null;
      return reg ? r.vc + " km/h: " + eqTxt(reg) + " (r² " + fmt(reg.r2, 3) + ")" : "—";
    },
    blocos: [],
    params: [
      { k: "etapa", r: "Etapa", tipo: "select", opcoes: [["calibracao", "Calibração (5) — e controle, se houver leituras"], ["controle", "Só controle depois/antes do levantamento (6.2 / 6.3)"]] },
      { k: "sistema", r: "Sistema medidor", tipo: "select", opcoes: [["ipr", "Integrador IPR/USP"], ["mays", "Maysmeter"], ["outro", "Outro tipo resposta"]] },
      { k: "smi", r: "Identificação do sistema (SMI nº / veículo)", ph: "ex.: SMI 01 — veículo A" },
      { k: "forma", r: "Forma da equação de calibração (3.3)", tipo: "select", opcoes: [["a", "(a) QI = a + b·L"], ["b", "(b) QI = a + b·L + c·L²"]] },
      { k: "velControle", r: "Velocidade dos limites de controle (5.7)", tipo: "select", opcoes: [["80", "80 km/h"], ["50", "50 km/h"], ["30", "30 km/h"]] },
      { k: "extensao", r: "Extensão dos trechos de referência (m)", ph: "320" },
      { k: "impQI", r: "QI dos trechos: importar das fichas da DNER-ES 173/86", tipo: "importarVarios", de: "dner-es-173-86",
        dica: "uma coluna por nivelamento importado (código do trecho e QI); as leituras do medidor continuam digitadas",
        aplicar: function (lista, P, d) {
          A.importacao.substituir(d, "tr", lista.map(function (e) {
            var r = e.resultados || {}, pe = (e.dados || {}).params || {}, i = (e.dados || {}).ident || {};
            return { trecho: pe.codigo || i.registro || "", qi: ok(r.qT) ? String(Math.round(r.qT)) : "" };
          }), { chave: ["trecho"] });
        } },
      { k: "carga", r: "Carga no piso do veículo (N) (4.2)", ph: "883" },
      { k: "imas", r: "Ímãs na roda (4.3)", ph: "8" },
      { k: "alinh", r: "Alinhamento e balanceamento feitos (4.4)?", tipo: "select", opcoes: SN },
      { k: "gap", r: "Espaçamento magnetos – sensor (mm) (4.5)", ph: "6" },
      { k: "pneus", r: "Pneus calibrados na pressão do fabricante (4.6)?", tipo: "select", opcoes: SN },
      { k: "bateria", r: "Peso específico do fluido da bateria (gf/cm³) (4.7)", ph: "1 230 a 1 260" },
      { k: "distancia", r: "Medidor de distância ajustado em 320 m (4.8)?", tipo: "select", opcoes: SN },
      { k: "novo", r: "Sistema que ainda não operou (4.9)?", tipo: "select", recarrega: true, opcoes: [["nao", "Não"], ["sim", "Sim — viagem prévia de 100 ± 5 km"]] },
      { k: "viagem", r: "Viagem prévia (km)", se: function (d) { return (d.params || {}).novo === "sim"; } },
      { k: "vbarra", r: "V̄ da calibração em vigor — opcional", dica: "para o controle sem a calibração nesta ficha (Anexo E: V̄ = Vtotal / nº de trechos)" },
    ],
    padrao: { etapa: "calibracao", sistema: "ipr", forma: "a", velControle: "80", extensao: "320", novo: "nao" },
    tabelas: function () {
      var ct = [{ k: "trecho", r: "Trecho de referência (seção)", texto: true, ph: "M-10" }, { k: "l0", r: "L̄ inicial (quadro resumo) — vazio: busca na calibração", u: "" }];
      for (var j = 1; j <= 5; j++) ct.push({ k: "p" + j, r: "Percurso " + j, u: "" });
      ct.push({ calc: "l0u", r: "L̄ inicial usado", u: "", casas: 0 }, { calc: "la", r: "L̄ atual = soma / nº de percursos (inteiro)", u: "", casas: 0, destaque: true },
        { calc: "delta", r: "Δ = Lmáx − Lmín (6.2.3)", u: "", casas: 0 }, { calc: "dl", r: "ΔL̄ = L̄ inicial − L̄ atual (6.2.4)", u: "", casas: 0, destaque: true });
      return [
        { chave: "tr", titulo: "Trechos de referência — quadro resumo da calibração (5.4 / 5.7, Anexos D e E)", rotulo: "Trecho", iniciais: 20, min: 1, linhas: linhasTr(),
          dica: "uma coluna por trecho de 320 m; QI do nível e mira e as 5 leituras de cada velocidade" },
        { chave: "ct", titulo: "Controle das medições (6.2, Anexos J e L)", rotulo: "Trecho", iniciais: 5, min: 1, linhas: ct,
          dica: "5 trechos de referência sorteados, percorridos na volta à base antes de lavagem/manutenção" },
      ];
    },
    calcular: calcular,
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return A.htmlParecer(r.parecer) + '<h4 style="margin:12px 0 4px">Equações de calibração e limites de controle</h4>' + htmlResumo(r) +
        '<h4 style="margin:12px 0 4px">Verificações</h4>' + A.htmlCriterios(r.linhas, { estilo: "resultado" });
    },
    graficos: graficos,
    relatorio: {
      notas: "DNER-PRO 164/94: L̄ = média das corridas de cada trecho e velocidade (5.4); equação QI = a + b·L ou a + b·L + c·L² por mínimos quadrados sobre os pares (QI, L̄), aceitável com r² ≥ 0,8 (3.3, 5.5, 5.6). " +
        "V = Lmáx − Lmín; V̄ = ΣV / nº de trechos; limite de controle da variação 2,11·V̄ e das médias ± 0,58·V̄ (5.7, Anexo E). Controle: Δ ≤ 2,11·V̄ (6.2.3) e |L̄ inicial − L̄ atual| ≤ 0,58·V̄ (6.2.4); fora: levantamento prejudicado, refeito, e sistema recalibrado.",
      resultados: function (calc, d) {
        var r = calc.resultados, rows = [["Parecer", r.parecer.titulo]];
        VELS.forEach(function (v) {
          var p = r.porVel[v], reg = r.grau === 2 ? p.reg2 : p.reg1;
          if (p.n) rows.push(["Equação a " + v + " km/h", eqTxt(reg) + (reg ? " · r² = " + fmt(reg.r2, 3) : "") + " · V̄ = " + fmt(p.Vb, 2)]);
        });
        if (r.ctl.length) rows.push(["Limites de controle usados", "2,11·V̄ = " + fmt(D4 * r.VbUsado, 2) + " · ± 0,58·V̄ = " + fmt(A2 * r.VbUsado, 2)]);
        return rows;
      },
      extraHtml: function (calc) {
        var r = calc.resultados;
        return A.htmlParecer(r.parecer, { relat: true }) + "<h2>Equações e limites</h2>" + htmlResumo(r, true) + "<h2>Verificações</h2>" + A.htmlCriterios(r.linhas, { relat: true, estilo: "resultado" });
      },
    },
    exemplos: [
      { nome: "Anexo E (quadro resumo, 23 trechos a 80 km/h, QI ilustrativo) + controle do Anexo L — levantamento prejudicado", dados: function () {
        // Anexo L (p. 18): percurso 4 do M-38 impresso "497"; a soma 3080 e Δ = 38 só fecham com 597
        var AL = [["M-10", [191, 203, 217, 209, 192]], ["M-14", [352, 331, 347, 333, 316]], ["M-19", [115, 123, 137, 119, 112]], ["M-35", [437, 436, 413, 450, 399]], ["M-38", [635, 621, 609, 597, 618]]];
        return { ident: { registro: "CAL-IRR-E", data: "1979-12-19", obra: "Base de calibração A", responsavel: "Laboratório A" },
          params: { etapa: "calibracao", sistema: "ipr", smi: "SMI 0562", forma: "a", velControle: "80", extensao: "320", carga: "883", imas: "8", alinh: "sim", gap: "6,0",
            pneus: "sim", bateria: "1250", distancia: "sim", novo: "nao" },
          tr: colsAnexoE(), ct: AL.map(function (t) { var c = { trecho: t[0] }; t[1].forEach(function (x, j) { c["p" + (j + 1)] = String(x); }); return c; }),
          obs: "Leituras do Anexo E da PRO 164 (sem velocidade indicada; lançadas a 80 km/h). QI ilustrativo: o Anexo E não traz o QI de nível e mira." };
      } },
      { nome: "Calibração completa gerada — 20 trechos, 80/50/30 km/h, controle atendido", dados: function () {
        var tr = colsGeradas();
        var ct = [0, 4, 9, 13, 18].map(function (i, q) {
          var c = { trecho: tr[i].trecho };
          for (var j = 1; j <= 5; j++) c["p" + j] = String(num(tr[i]["l80_" + j]) + ((q + j) % 3) - 1);
          return c;
        });
        return { ident: { registro: "CAL-IRR-02", data: "2026-04-14", obra: "Base de calibração B", responsavel: "Laboratório A" },
          params: { etapa: "calibracao", sistema: "mays", smi: "SMI 02 — veículo B", forma: "a", velControle: "80", extensao: "320", carga: "885", imas: "8", alinh: "sim", gap: "6,2",
            pneus: "sim", bateria: "1245", distancia: "sim", novo: "sim", viagem: "102" },
          tr: tr, ct: ct };
      } },
    ],
  };
})();
