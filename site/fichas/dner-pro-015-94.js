/*
 * Ficha: DNER-PRO 015/94 — Inspeção de usinas para misturas betuminosas (relatório diário de inspeção).
 * Registra-se em window.FE (usa FE.aceitacao: linhas de critério e parecer).
 *
 * O que a PRO manda (e a ficha verifica):
 *   4.1 / 4.2  atribuições do inspetor e inspeção da instalação (checklist); exatidão das balanças com pesos padronizados
 *              (4.2) — erro de cada ponto de aferição × tolerância (a PRO não fixa o valor: parâmetro, padrão 0,5 %);
 *   4.3.1      percentagens de projeto de ligante e de cada agregado, com as tolerâncias dadas pela fiscalização:
 *              pesos acumulados das bateladas (Quadro 2) → massa e % de cada componente → desvio × tolerância;
 *   4.3.2      pré-misturado a frio com emulsão: umedecimento com a água do projeto;
 *   4.3.3 / 4.3.4  silos frios (aberturas) e secador; 4.3.5 usina gravimétrica: aferição semanal da balança, tara da cuba
 *              do ligante (compensação do ligante aderido), escoamento, sequência e tempo de mistura;
 *   4.3.6      usina volumétrica: aberturas calibradas, ligante por revolução, quantidades por revolução aprovadas;
 *   4.3.7      ligante medido por volume: peso por volume à temperatura de operação → volume exigido e teor efetivo;
 *              pesagem dos caminhões para confirmar as bateladas (recomendação); silos quentes uniformes; mistura homogênea;
 *   4.3.8      temperaturas dos agregados (nos silos quentes), do ligante e da mistura dentro das faixas dadas pela
 *              fiscalização — fora da faixa a mistura deve ser interrompida;
 *   5.1 / 5.2 e Quadro 1  amostragem do dia: mistura ≥ 2 por dia de 8 h (5.1.2) e massa orientativa pelo Dmáx (Quadro 1,
 *              item 7); agregados quentes ≥ 2 por dia (5.2.3); frios 1 por dia (5.2.2); material de enchimento 1 por
 *              carregamento e por dia (5.2.1); ligante de todo carregamento (5.1.1); corretivo de adesividade: 2, 3 ou 4
 *              tambores para lotes de 2–8, 9–27, 28–64 tambores (Quadro 1, item 6);
 *   5.1.4 / 5.3  livro de registro e relatório diário (Quadro 2).
 * Dias de 8 h: jornadas = ⌈horas de funcionamento / 8⌉ (mín. 1).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var ID = "dner-pro-015-94", EPS = 1e-9;
  var SN = [["", "— não verificado"], ["S", "Atende"], ["N", "Não atende"], ["NA", "Não se aplica"]];
  // Quadro 1, item 7 — mistura betuminosa na usina: Dmáx do agregado (mm) → quantidade de mistura (kg)
  var Q7 = [[2.0, 2], [4.8, 2], [9.5, 4], [12.7, 6], [19.0, 8], [25.0, 10], [38.0, 12], [50.0, 16]];
  function P_(d) { return d.params || {}; }
  function grav(P) { return (P.usina || "grav") === "grav"; }
  function quente(P) { return (P.mistura || "quente") === "quente"; }
  function seP(f) { return function (d) { return f(P_(d)); }; }
  var CHECK = [
    { k: "cInst", secao: "4.2", t: "Instalação conforme o contrato: armazenagem e manuseio dos materiais, alimentadores de agregados frios, secador, misturador" },
    { k: "cFrios", secao: "4.3.3", t: "Aberturas dos silos frios conferidas e sem alteração; alimentação contínua e uniforme (miúdos e úmidos)" },
    { k: "cSecador", secao: "4.3.4", t: "Agregado seco e aquecido à temperatura desejada; alimentação compatível com a capacidade do secador", se: quente },
    { k: "cUmed", secao: "4.3.2", t: "Pré-misturado a frio com emulsão: agregados umedecidos com a quantidade de água do projeto", se: function (P) { return !quente(P); } },
    { k: "cFluxo", secao: "4.3.5", t: "Silos quentes e cuba do ligante fluem livremente; indicador da balança volta a zero após a descarga", se: grav },
    { k: "cEscoa", secao: "4.3.5", t: "Ligante escoa completamente em cada batelada", se: grav },
    { k: "cSeq", secao: "4.3.5", t: "Sequência de descarga no misturador (pugmill) e tempo de mistura suficientes para mistura homogênea", se: grav },
    { k: "cCalib", secao: "4.3.6.1", t: "Aberturas calibradas do silo quente e do depósito de filler; cálculos da empreiteira conferidos com os gráficos de calibração", se: function (P) { return !grav(P); } },
    { k: "cRev", secao: "4.3.6.2", t: "Escoamento de ligante por revolução (ou precisão das cubas dosadas) verificado", se: function (P) { return !grav(P); } },
    { k: "cQtdRev", secao: "4.3.6.3", t: "Quantidades por revolução aprovadas pela fiscalização", se: function (P) { return !grav(P); } },
    { k: "cSilosQ", secao: "4.3.7 / 5.2.3 b", t: "Silos quentes com granulometria conhecida e uniforme, sem contaminação entre silos (graúdo no fino, miúdo transbordado no graúdo)" },
    { k: "cVisual", secao: "4.3.7", t: "Observação visual: bateladas homogêneas, de cor e textura uniformes" },
    { k: "cVeic", secao: "4.1 l", t: "Veículos de transporte dos materiais e da mistura em condições", falha: "ressalva" },
    { k: "cCarreta", secao: "5.1.1", t: "Carreta de ligante aguardou os resultados dos ensaios antes da descarga", falha: "ressalva", opcional: true },
    { k: "cVidro", secao: "5.1.1", t: "Amostra de corretivo de adesividade em recipiente de vidro", falha: "ressalva", opcional: true },
    { k: "cRejeit", secao: "5.1.3", t: "Amostras dos materiais rejeitados enviadas ao laboratório", falha: "ressalva", opcional: true },
    { k: "cLivro", secao: "5.1.4", t: "Livro de registro com numeração contínua, sem duplicatas; recipientes identificados", falha: "ressalva" },
    { k: "cRelat", secao: "5.3.3", t: "Relatório diário numerado enviado à fiscalização e ao laboratório", falha: "ressalva" },
  ];
  function horaMin(s) {
    var m = /^\s*(\d{1,2})(?:[:hH.,](\d{1,2}))?\s*$/.exec(String(s || ""));
    return m ? Number(m[1]) * 60 + (m[2] ? Number(m[2]) : 0) : NaN;
  }
  function dataDia(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || "").trim()) || null, b = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(s || "").trim());
    if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]) / 864e5;
    if (b) return Date.UTC(+b[3], +b[2] - 1, +b[1]) / 864e5;
    return NaN;
  }
  function faixaTxt(a, b) { return ok(a) && ok(b) ? fmt(a, 0) + " a " + fmt(b, 0) + " °C" : ok(a) ? "≥ " + fmt(a, 0) + " °C" : ok(b) ? "≤ " + fmt(b, 0) + " °C" : "—"; }
  function dopeMin(t) { return !ok(t) || t < 1 ? NaN : t === 1 ? 1 : t <= 8 ? 2 : t <= 27 ? 3 : t <= 64 ? 4 : NaN; }
  function pp(x, c) { return (x >= 0 ? "+" : "−") + fmt(Math.abs(x), c); }

  function calcular(d) {
    var P = P_(d), avisos = [], linhas = [], r = {}, tab = {}, Q = quente(P), G;
    // ---------------- funcionamento ----------------
    var h0 = horaMin(P.hIni), h1 = horaMin(P.hFim), hs = num(P.horas);
    r.horas = ok(hs) ? hs : ok(h0) && ok(h1) ? ((h1 - h0 + 1440) % 1440) / 60 : NaN;
    r.jornadas = ok(r.horas) && r.horas > 0 ? Math.max(1, Math.ceil(r.horas / 8 - 1e-9)) : NaN;
    r.prod = num(P.producao);
    r.taxa = ok(r.prod) && ok(r.horas) && r.horas > 0 ? r.prod / r.horas : NaN;

    // ---------------- temperaturas (4.3.8, Quadro 2) ----------------
    G = "Temperaturas (4.3.8)";
    var T = (d.temp || []);
    var silos = ["s1", "s2", "s3", "s4"];
    var tAg = [], tLig = [], tMis = [];
    tab.temp = T.map(function (c, i) {
      var o = {}, sv = silos.map(function (k) { return num(c[k]); }).filter(ok), ma = num(c.ma);
      o.agMax = sv.length ? Math.max.apply(null, sv) : NaN; o.agMin = sv.length ? Math.min.apply(null, sv) : NaN;
      var rot = (c.hora ? c.hora : (i + 1) + "ª det.");
      sv.forEach(function (v) { tAg.push({ v: v, rot: rot }); });
      if (ok(ma)) tAg.push({ v: ma, rot: rot });
      if (ok(num(c.lig))) tLig.push({ v: num(c.lig), rot: rot });
      if (ok(num(c.mb))) tMis.push({ v: num(c.mb), rot: rot, x: i + 1 });
      return o;
    });
    function linhaTemp(id, nome, sec, pts, a, b) {
      var l = A.linha({ id: id, grupo: G, criterio: nome, secao: sec, unid: "°C", casas: 0, n: pts.length, exigido: faixaTxt(a, b) });
      if (!pts.length) { if (Q) A.marcar(l, "pendente", "temperatura não registrada"); else { l.situacao = "nao_exigido"; l.motivo = "não registrada (mistura a frio)"; } return l; }
      var vs = pts.map(function (p) { return p.v; }), mn = Math.min.apply(null, vs), mx = Math.max.apply(null, vs);
      l.resultado = pts.length > 1 ? fmt(mn, 0) + " a " + fmt(mx, 0) + " °C (" + pts.length + " leituras; amplitude " + fmt(mx - mn, 0) + " °C)" : fmt(mn, 0) + " °C";
      if (!ok(a) && !ok(b)) {
        if (Q) A.marcar(l, "pendente", "faixa de temperatura não informada — instruções da fiscalização (4.3.8)");
        else { l.situacao = "informativo"; }
        return l;
      }
      var fora = pts.filter(function (p) { return (ok(a) && p.v < a - EPS) || (ok(b) && p.v > b + EPS); });
      var grp = [], por = {};
      fora.forEach(function (p) { if (!por[p.rot]) { por[p.rot] = []; grp.push(p.rot); } por[p.rot].push(p.v); });
      if (fora.length) A.marcar(l, "nao_conforme", grp.map(function (k) {
        var v = por[k], a1 = Math.min.apply(null, v), b1 = Math.max.apply(null, v);
        return k + ": " + fmt(a1, 0) + (b1 !== a1 ? " a " + fmt(b1, 0) : "") + " °C";
      }).join("; ") + " — fora da faixa: interromper a mistura até a temperatura apropriada (4.3.8)");
      return l;
    }
    var fA = [num(P.tAgMin), num(P.tAgMax)], fL = [num(P.tLigMin), num(P.tLigMax)], fM = [num(P.tMisMin), num(P.tMisMax)];
    linhas.push(linhaTemp("tAg", "Agregados — silos quentes e mistura de agregados", "4.3.8", tAg, fA[0], fA[1]));
    linhas.push(linhaTemp("tLig", "Ligante betuminoso", "4.3.8", tLig, fL[0], fL[1]));
    linhas.push(linhaTemp("tMis", "Mistura betuminosa", "4.3.8", tMis, fM[0], fM[1]));
    r.tMis = tMis; r.tAg = tAg; r.faixaMis = fM; r.faixaAg = fA;
    var tmix = T.map(function (c) { return num(c.tmix); }).filter(ok);
    if (tmix.length) r.tmix = [Math.min.apply(null, tmix), Math.max.apply(null, tmix)];

    // ---------------- dosagem (4.3.1, 5.3.1 c) ----------------
    G = "Dosagem da mistura (4.3.1 / 5.3.1 c)";
    var prev = 0, total = 0, ligCol = -1, comp = [];
    tab.dos = (d.dos || []).map(function (c, i) {
      var o = {}, ac = num(c.acum), lg = num(c.lig);
      if (ok(lg)) { o.mInd = lg; ligCol = i; }
      else if (ok(ac)) { o.mInd = ac - prev; prev = ac; }
      if (ok(o.mInd)) total += o.mInd;
      comp.push({ c: c, o: o, i: i });
      return o;
    });
    comp.forEach(function (x) {
      if (ok(x.o.mInd) && total > 0) x.o.pct = x.o.mInd / total * 100;
      var pj = num(x.c.proj);
      if (ok(x.o.pct) && ok(pj)) x.o.dev = x.o.pct - pj;
      if (ok(x.o.mInd) && x.o.mInd < 0) avisos.push((x.c.mat || "Componente " + (x.i + 1)) + ": peso acumulado menor que o anterior — confira a ordem das colunas (pesos acumulados na ordem de pesagem).");
    });
    r.mBat = total > 0 ? total : NaN;
    var somaProj = comp.reduce(function (s, x) { var v = num(x.c.proj); return ok(v) ? s + v : s; }, 0);
    if (somaProj > 0 && Math.abs(somaProj - 100) > 0.1) avisos.push("As percentagens de projeto somam " + fmt(somaProj, 1) + " % — devem somar 100 % da mistura total (4.3.1).");
    var tolLig = num(P.tolLig), tolAg = num(P.tolAg);
    // ligante: coluna com massa de ligante, ou material com nome de ligante
    if (ligCol < 0) comp.forEach(function (x) { if (ligCol < 0 && /ligante|cap\b|asfalto|emuls|betum/i.test(x.c.mat || "")) ligCol = x.i; });
    var LG = ligCol >= 0 ? comp[ligCol] : null;
    r.teorProj = LG ? num(LG.c.proj) : NaN;
    r.teorPesado = LG && ok(LG.o.pct) ? LG.o.pct : NaN;
    var lL = A.linha({ id: "lig", grupo: G, criterio: "Teor de ligante na batelada (pesagem)", secao: "4.3.1", unid: "%", casas: 2,
      exigido: ok(r.teorProj) ? fmt(r.teorProj, 2) + (ok(tolLig) ? " ± " + fmt(tolLig, 2) : "") + " %" : "—", n: ok(r.teorPesado) ? 1 : 0 });
    if (!LG) A.marcar(lL, P.ligVol === "sim" ? "nao_exigido" : "pendente", "coluna do ligante não informada na dosagem");
    else if (!ok(r.teorPesado)) { if (P.ligVol === "sim") { lL.situacao = "nao_exigido"; lL.motivo = "ligante medido por volume (ver abaixo)"; } else A.marcar(lL, "pendente", "informe os pesos acumulados e a massa de ligante da batelada"); }
    else {
      lL.resultado = fmt(r.teorPesado, 2) + " %" + (ok(r.teorProj) ? " (desvio " + pp(r.teorPesado - r.teorProj, 2) + ")" : "") + " — batelada de " + fmt(total, 1) + " kg";
      if (!ok(r.teorProj)) A.marcar(lL, "pendente", "teor de projeto não informado (4.3.1)");
      else if (!ok(tolLig)) A.marcar(lL, "pendente", "tolerância do teor de ligante não informada — instrução da fiscalização (4.3.1)");
      else if (Math.abs(r.teorPesado - r.teorProj) > tolLig + EPS) A.marcar(lL, "nao_conforme", "desvio de " + pp(r.teorPesado - r.teorProj, 2) + " pontos — fora da tolerância; comunicar por escrito e rejeitar a produção subsequente se não corrigida (4.1 h)");
    }
    linhas.push(lL);
    var agr = comp.filter(function (x) { return x.i !== ligCol && ok(x.o.pct); });
    if (agr.length) {
      var la = A.linha({ id: "agr", grupo: G, criterio: "Proporções dos agregados e do filler na batelada", secao: "4.3.1 / 5.2.2", unid: "%", casas: 1, n: agr.length,
        exigido: ok(tolAg) ? "projeto ± " + fmt(tolAg, 1) + " pontos" : "projeto (tolerância não informada)" });
      la.resultado = agr.map(function (x) { return (x.c.mat || "comp. " + (x.i + 1)) + " " + fmt(x.o.pct, 1) + (ok(x.o.dev) ? " (" + pp(x.o.dev, 1) + ")" : ""); }).join("; ");
      var fora = agr.filter(function (x) { return ok(x.o.dev) && ok(tolAg) && Math.abs(x.o.dev) > tolAg + EPS; });
      if (fora.length) A.marcar(la, "ressalva", fora.map(function (x) { return x.c.mat || "comp. " + (x.i + 1); }).join(", ") + " fora da tolerância — ajustar as aberturas/alimentação (4.3.3, 5.2.2)");
      else if (!ok(tolAg)) la.situacao = "informativo";
      linhas.push(la);
    }
    // tara da cuba (4.3.5)
    var t0 = num(P.taraIni), t1 = num(P.taraAtual);
    if (grav(P) && ok(t0) && ok(t1)) {
      var ader = t1 - t0, mLig = LG && ok(LG.o.mInd) ? LG.o.mInd : NaN;
      var lt = A.linha({ id: "tara", grupo: G, criterio: "Tara da cuba do ligante — ligante aderido", secao: "4.3.5", unid: "kg", casas: 2, n: 1, exigido: "compensar o ligante aderido",
        resultado: fmt(ader, 2) + " kg" + (ok(mLig) && mLig > 0 ? " (" + fmt(ader / mLig * 100, 2) + " % do ligante da batelada)" : "") });
      if (ok(mLig) && mLig > 0 && ader / mLig > 0.005) A.marcar(lt, "ressalva", "ligante aderido acima de 0,5 % da massa de ligante da batelada — compensar " + fmt(ader, 2) + " kg por batelada (4.3.5; critério da ficha)");
      linhas.push(lt);
      r.ader = ader;
    }
    // ligante por volume (4.3.7 / 4.3.6.2)
    if (P.ligVol === "sim") {
      var rho = num(P.rhoT), vMed = num(P.vMed), mRef = ok(num(P.mRef)) ? num(P.mRef) : r.mBat;
      var lv = A.linha({ id: "ligv", grupo: "Ligante medido por volume (4.3.7)", criterio: "Teor de ligante efetivo pelo medidor de volume", secao: "4.3.7 / 4.3.6.2", unid: "%", casas: 2,
        exigido: ok(r.teorProj) ? fmt(r.teorProj, 2) + (ok(tolLig) ? " ± " + fmt(tolLig, 2) : "") + " %" : "—" });
      if (!ok(rho)) A.marcar(lv, "pendente", "determine o peso por volume do ligante à temperatura de operação (4.3.7)");
      else if (!ok(vMed) || !ok(mRef) || !ok(r.teorProj)) A.marcar(lv, "pendente", "informe o volume ajustado no medidor, a massa de mistura de referência e o teor de projeto");
      else {
        r.vReq = r.teorProj / 100 * mRef / rho; r.teorVol = vMed * rho / mRef * 100; lv.n = 1;
        lv.resultado = fmt(r.teorVol, 2) + " % — medidor " + fmt(vMed, 2) + " L × " + fmt(rho, 3) + " kg/L ÷ " + fmt(mRef, 1) + " kg (volume exigido " + fmt(r.vReq, 2) + " L; " + pp((vMed - r.vReq) / r.vReq * 100, 1) + " %)";
        if (!ok(tolLig)) A.marcar(lv, "pendente", "tolerância do teor de ligante não informada (4.3.1)");
        else if (Math.abs(r.teorVol - r.teorProj) > tolLig + EPS) A.marcar(lv, "nao_conforme", "teor efetivo fora da tolerância — ajustar o medidor para " + fmt(r.vReq, 2) + " L à temperatura de operação (4.3.7)");
      }
      linhas.push(lv);
    }

    // ---------------- balanças (4.2, 4.3.5) ----------------
    G = "Exatidão das balanças (4.2 / 4.3.5)";
    var tolBal = num(P.tolBal), pts = [];
    tab.bal = (d.bal || []).map(function (c) {
      var o = {}, p = num(c.pp), l = num(c.lei);
      if (ok(p) && ok(l) && p > 0) { o.err = l - p; o.errp = o.err / p * 100; pts.push({ c: c, o: o }); }
      return o;
    });
    var lb = A.linha({ id: "bal", grupo: G, criterio: "Aferição com pesos padronizados", secao: "4.2", unid: "%", casas: 2, n: pts.length, exigido: ok(tolBal) ? "|erro| ≤ " + fmt(tolBal, 2) + " %" : "—" });
    if (!pts.length) A.marcar(lb, "sem_dados", "nenhum ponto de aferição registrado");
    else {
      var maxE = pts.reduce(function (m, x) { return Math.abs(x.o.errp) > Math.abs(m) ? x.o.errp : m; }, 0);
      r.maxErr = maxE;
      lb.resultado = pts.length + " ponto(s); maior erro " + pp(maxE, 2) + " %";
      if (!ok(tolBal)) A.marcar(lb, "pendente", "tolerância de aferição não informada (da especificação/contrato)");
      else {
        var ruins = pts.filter(function (x) { return Math.abs(x.o.errp) > tolBal + EPS; });
        if (ruins.length) A.marcar(lb, "nao_conforme", ruins.map(function (x) { return (x.c.bal || "balança") + " " + fmt(num(x.c.pp), 0) + " kg: " + pp(x.o.errp, 2) + " %"; }).join("; ") + " — ajustar a balança antes de prosseguir");
      }
    }
    linhas.push(lb);
    var dHoje = dataDia((d.ident || {}).data), dAf = dataDia(P.dataAfer);
    var lf = A.linha({ id: "afer", grupo: G, criterio: "Periodicidade da conferência da balança", secao: "4.3.5", exigido: "inicial e semanal (ou sob suspeita)", n: 1 });
    if (pts.length) lf.resultado = "aferida nesta inspeção";
    else if (ok(dHoje) && ok(dAf)) {
      var dias = dHoje - dAf;
      lf.resultado = "última aferição há " + fmt(dias, 0) + " dia(s)";
      if (dias > 7) A.marcar(lf, "ressalva", "mais de uma semana desde a última aferição (4.3.5)");
    } else { lf.n = 0; A.marcar(lf, "pendente", "informe a data da última aferição"); }
    linhas.push(lf);
    // caminhões (4.3.7)
    var tolCam = num(P.tolCam), cams = [];
    tab.cam = (d.cam || []).map(function (c) {
      var o = {}, nb = num(c.nb), mb = ok(num(c.mb)) ? num(c.mb) : r.mBat, pl = num(c.pl);
      if (ok(nb) && ok(mb) && ok(pl) && nb > 0 && mb > 0) { o.esp = nb * mb; o.dif = (pl - o.esp) / o.esp * 100; cams.push({ c: c, o: o }); }
      return o;
    });
    if (cams.length) {
      var lc = A.linha({ id: "cam", grupo: G, criterio: "Pesagem dos caminhões × soma das bateladas", secao: "4.3.7", unid: "%", casas: 1, n: cams.length,
        exigido: ok(tolCam) ? "|diferença| ≤ " + fmt(tolCam, 1) + " %" : "confirmação (recomendada)" });
      lc.resultado = cams.map(function (x) { return (x.c.id || "caminhão") + " " + pp(x.o.dif, 1) + " %"; }).join("; ");
      var fc = cams.filter(function (x) { return ok(tolCam) && Math.abs(x.o.dif) > tolCam + EPS; });
      if (fc.length) A.marcar(lc, "ressalva", "diferença acima da tolerância — conferir as balanças/aberturas da usina (4.2, 4.3.7)");
      else if (!ok(tolCam)) lc.situacao = "informativo";
      linhas.push(lc);
    }

    // ---------------- amostragem (5.1, 5.2, Quadro 1) ----------------
    G = "Amostragem do dia (5.1 / 5.2 / Quadro 1)";
    var J = r.jornadas;
    function amo(id, nome, sec, real, exig, regra) {
      var l = A.linha({ id: id, grupo: G, criterio: nome, secao: sec, exigido: regra, n: ok(real) ? real : 0 });
      l.real = ok(real) ? real : 0; if (ok(exig)) l.exig = exig;
      l.resultado = ok(real) ? fmt(real, 0) + (ok(exig) ? " de " + fmt(exig, 0) : "") : "—";
      if (!ok(exig)) { if (ok(real)) l.situacao = "informativo"; else { l.situacao = "nao_exigido"; l.motivo = "não informado"; } }
      else if (!ok(real)) A.marcar(l, "pendente", "número de amostras não informado");
      else if (real < exig) A.marcar(l, "pendente", "faltam " + fmt(exig - real, 0) + " amostra(s) (" + sec + ")");
      linhas.push(l);
      return l;
    }
    if (!ok(J)) avisos.push("Informe o horário de funcionamento (ou as horas) para calcular o número mínimo de amostras por dia de 8 h.");
    amo("aMis", "Mistura betuminosa — granulometria, teor de ligante (extração) e Marshall", "5.1.2", num(P.nMis), ok(J) ? 2 * J : NaN, "≥ 2 por dia de 8 h");
    var dmax = num(P.dmax), q7 = Q7.filter(function (x) { return Math.abs(x[0] - dmax) < 1e-6; })[0], mMis = num(P.mMis);
    if (q7) {
      var lm = A.linha({ id: "mMis", grupo: G, criterio: "Quantidade de mistura por amostra (Dmáx " + fmt(q7[0], 1) + " mm)", secao: "Quadro 1, item 7", unid: "kg", casas: 1, exigido: "≥ " + fmt(q7[1], 0) + " kg", n: ok(mMis) ? 1 : 0 });
      if (!ok(mMis)) { lm.situacao = "nao_exigido"; lm.motivo = "massa não informada"; }
      else { lm.resultado = fmt(mMis, 1) + " kg"; if (mMis < q7[1] - EPS) A.marcar(lm, "ressalva", "abaixo da quantidade orientativa do Quadro 1 (" + fmt(q7[1], 0) + " kg)"); }
      linhas.push(lm);
    }
    amo("aQ", "Agregados dos silos quentes (granulometria)", "5.2.3", num(P.nQuente), ok(J) ? 2 * J : NaN, "≥ 2 por dia de 8 h");
    amo("aF", "Agregados frios (DNER-ME 083)", "5.2.2", num(P.nFrio), ok(J) ? J : NaN, "1 por dia de 8 h");
    var cF = num(P.cFiller);
    amo("aFil", "Material de enchimento (ASTM D 546), completamente seco", "5.2.1", num(P.nFiller), ok(J) || ok(cF) ? Math.max(ok(J) ? J : 0, ok(cF) ? cF : 0) : NaN, "1 por carregamento e por dia de 8 h");
    var cL = num(P.cLig);
    amo("aLig", "Ligante betuminoso (≈ 4 L; NB-174)", "5.1.1", num(P.nLig), ok(cL) ? cL : NaN, "todo carregamento recebido");
    var tD = num(P.tDope), eD = dopeMin(tD);
    if (ok(tD) && tD > 64) avisos.push("Corretivo de adesividade: " + fmt(tD, 0) + " tambores — o Quadro 1 só vai até 64 tambores (4 amostrados); combine com a fiscalização.");
    if (ok(tD) && tD > 0) amo("aDope", "Corretivo de adesividade — tambores amostrados (lote de " + fmt(tD, 0) + ")", "Quadro 1, item 6", num(P.aDope), eD, "2–8 tamb.: 2; 9–27: 3; 28–64: 4");

    // ---------------- checklist ----------------
    CHECK.forEach(function (c) {
      if (c.se && !c.se(P)) return;
      var v = P[c.k] || "";
      var l = A.linha({ id: c.k, grupo: "Inspeção da usina e registros (4.1 a 5.3)", criterio: c.t, secao: c.secao, exigido: "atende", n: v && v !== "NA" ? 1 : 0,
        resultado: v === "S" ? "atende" : v === "N" ? "não atende" : v === "NA" ? "não se aplica" : "—" });
      if (v === "N") A.marcar(l, c.falha || "nao_conforme", "não atende (" + c.secao + ")");
      else if (v === "NA") { l.situacao = "nao_exigido"; l.motivo = "não se aplica"; }
      else if (!v) { if (c.opcional) { l.situacao = "nao_exigido"; l.motivo = "não verificado"; } else A.marcar(l, "pendente", "verificação não registrada"); }
      linhas.push(l);
    });
    if (!Q && ok(num(P.aguaProj)) && ok(num(P.aguaReal))) {
      var dA = num(P.aguaReal) - num(P.aguaProj);
      linhas.push(A.linha({ id: "agua", grupo: "Inspeção da usina e registros (4.1 a 5.3)", criterio: "Água de umedecimento (pré-misturado a frio)", secao: "4.3.2", unid: "%", casas: 1, n: 1,
        exigido: fmt(num(P.aguaProj), 1) + " % (projeto)", resultado: fmt(num(P.aguaReal), 1) + " % (" + pp(dA, 1) + ")", situacao: "informativo" }));
    }

    var par = A.parecer(linhas, [], { textos: {
      ACEITO: { titulo: "PRODUÇÃO CONFORME", texto: "Usina e mistura do dia dentro das exigências verificadas (4 e 5)." },
      RESSALVA: { titulo: "PRODUÇÃO CONFORME COM RESSALVA", texto: "Nenhuma exigência descumprida, mas há ajustes ou registros a providenciar." },
      PENDENTE: { titulo: "INSPEÇÃO INCOMPLETA", texto: "Faltam registros, faixas/tolerâncias da fiscalização ou amostras do dia para concluir." },
      REJEITADO: { titulo: "PRODUÇÃO NÃO CONFORME", texto: "Informar por escrito a firma empreiteira e rejeitar a produção subsequente se não houver correção (4.1 h); temperatura fora da faixa: interromper a mistura (4.3.8)." } } });
    r.linhas = linhas; r.parecer = par; r.usina = grav(P) ? "gravimétrica" : "volumétrica"; r.quente = Q;
    return { tab: tab, resultados: r, avisos: avisos };
  }

  function graficos(calc, d, opt) {
    var r = calc.resultados, out = [];
    function g(tit, pts, fx) {
      if (!pts.length) return;
      var lin = [];
      if (ok(fx[0])) lin.push({ y: fx[0], tipo: "lim", txt: "mín. " + fmt(fx[0], 0) });
      if (ok(fx[1])) lin.push({ y: fx[1], tipo: "lim", txt: "máx. " + fmt(fx[1], 0) });
      out.push(A.grafico(tit, pts.map(function (p, i) { return { x: i + 1, y: p.v, fora: (ok(fx[0]) && p.v < fx[0]) || (ok(fx[1]) && p.v > fx[1]) }; }), lin, opt || {}, "idx"));
    }
    g("Temperatura da mistura betuminosa (°C) por determinação", r.tMis || [], r.faixaMis || []);
    g("Temperatura dos agregados — silos quentes e mistura de agregados (°C) por leitura", r.tAg || [], r.faixaAg || []);
    return out;
  }

  var opQuente = seP(quente);
  FE.FICHAS[ID] = {
    titulo: "Inspeção de usina de misturas betuminosas — relatório diário",
    lote: true,
    resumo: "Relatório diário de inspeção (Quadro 2): temperaturas × faixas da fiscalização (4.3.8), dosagem pelos pesos acumulados e teor de ligante × tolerância (4.3.1), ligante medido por volume (4.3.7), tara da cuba (4.3.5), aferição das balanças com pesos padrão (4.2) e pesagem de caminhões (4.3.7), amostragem do dia (5.1, 5.2, Quadro 1) e checklist da inspeção; parecer da produção.",
    rotuloImportar: function (r) { return "usina " + (r.usina || "—") + (ok(r.teorPesado) ? " · ligante " + fmt(r.teorPesado, 2) + " %" : "") + (r.parecer ? " · " + r.parecer.titulo.toLowerCase() : ""); },
    params: [
      { k: "usina", r: "Tipo de usina", tipo: "select", recarrega: true, opcoes: [["grav", "Gravimétrica — por bateladas (4.3.5)"], ["vol", "Volumétrica (4.3.6)"]] },
      { k: "mistura", r: "Mistura", tipo: "select", recarrega: true, opcoes: [["quente", "Usinada a quente"], ["frio", "Pré-misturado a frio com emulsão (4.3.2)"]] },
      { k: "tipoMistura", r: "Tipo de mistura (Quadro 2)", ph: "ex.: CBUQ faixa C, CAP 50/70" },
      { k: "hIni", r: "Funcionamento — início (hh:mm)", ph: "07:00" },
      { k: "hFim", r: "Funcionamento — fim (hh:mm)", ph: "17:00" },
      { k: "horas", r: "…ou horas de funcionamento — opcional", dica: "se preenchido, substitui início/fim (desconte paradas longas)" },
      { k: "producao", r: "Produção do dia (t)" },
      { k: "tAgMin", r: "Agregados (silos quentes) — temperatura mínima (°C)", dica: "faixas: instruções da fiscalização (4.3.8)", se: opQuente },
      { k: "tAgMax", r: "Agregados (silos quentes) — temperatura máxima (°C)", se: opQuente },
      { k: "tLigMin", r: "Ligante — temperatura mínima (°C)", se: opQuente },
      { k: "tLigMax", r: "Ligante — temperatura máxima (°C)", se: opQuente },
      { k: "tMisMin", r: "Mistura — temperatura mínima (°C)", se: opQuente },
      { k: "tMisMax", r: "Mistura — temperatura máxima (°C)", se: opQuente },
      { k: "tolLig", r: "Tolerância do teor de ligante (± pontos %)", dica: "instrução da fiscalização / especificação (4.3.1)" },
      { k: "tolAg", r: "Tolerância das proporções dos agregados (± pontos %) — opcional", dica: "sem ela as proporções ficam só registradas" },
      { k: "ligVol", r: "Ligante medido por volume (4.3.7)", tipo: "select", recarrega: true, opcoes: [["nao", "Não — pesado na cuba"], ["sim", "Sim — medidor de volume / por revolução"]] },
      { k: "rhoT", r: "Peso por volume do ligante à temperatura de operação (kg/L)", se: function (d) { return P_(d).ligVol === "sim"; } },
      { k: "vMed", r: "Volume ajustado no medidor, por batelada/revolução (L)", se: function (d) { return P_(d).ligVol === "sim"; } },
      { k: "mRef", r: "Massa de mistura por batelada/revolução (kg)", dica: "vazio = total da dosagem", se: function (d) { return P_(d).ligVol === "sim"; } },
      { k: "taraIni", r: "Tara da cuba vazia — inicial (kg)", se: function (d) { return grav(P_(d)); } },
      { k: "taraAtual", r: "Tara da cuba vazia — nesta verificação (kg)", se: function (d) { return grav(P_(d)); } },
      { k: "tolBal", r: "Tolerância de aferição das balanças (± %)", dica: "a PRO não fixa: use a da especificação/contrato" },
      { k: "dataAfer", r: "Data da última aferição da balança", tipo: "date", dica: "4.3.5: semanal; dispensada se aferida nesta inspeção" },
      { k: "tolCam", r: "Tolerância da pesagem de caminhões (± %) — opcional" },
      { k: "aguaProj", r: "Água de umedecimento — projeto (%)", se: function (d) { return !quente(P_(d)); } },
      { k: "aguaReal", r: "Água de umedecimento — aplicada (%)", se: function (d) { return !quente(P_(d)); } },
      { k: "dmax", r: "Dmáx do agregado da mistura (Quadro 1, item 7)", tipo: "select", opcoes: [["", "—"]].concat(Q7.map(function (x) { return [String(x[0]), fmt(x[0], 1) + " mm → " + fmt(x[1], 0) + " kg de mistura"]; })) },
      { k: "nMis", r: "Amostras de mistura coletadas no dia (5.1.2)" },
      { k: "mMis", r: "Menor massa de mistura por amostra (kg)" },
      { k: "nQuente", r: "Amostras de agregados dos silos quentes (5.2.3)" },
      { k: "nFrio", r: "Amostras de agregados frios (5.2.2)" },
      { k: "cFiller", r: "Carregamentos de material de enchimento recebidos" },
      { k: "nFiller", r: "Amostras de material de enchimento (5.2.1)" },
      { k: "cLig", r: "Carregamentos de ligante recebidos" },
      { k: "nLig", r: "Amostras de ligante (5.1.1)" },
      { k: "tDope", r: "Tambores de corretivo de adesividade no carregamento" },
      { k: "aDope", r: "Tambores de corretivo amostrados (Quadro 1, item 6)" },
    ].concat(CHECK.map(function (c) { return { k: c.k, r: c.t + " (" + c.secao + ")", tipo: "select", opcoes: SN, se: c.se ? seP(c.se) : undefined }; })),
    padrao: { usina: "grav", mistura: "quente", ligVol: "nao", tolLig: "0,3", tolBal: "0,5", dmax: "" },
    tabelas: function () {
      return [
        { chave: "temp", titulo: "Temperaturas (°C) — determinações ao longo das 8 h de trabalho (Quadro 2; 4.3.8)", rotulo: "Determinação", iniciais: 4, min: 1, nomes: ["1ª", "2ª", "3ª", "4ª", "5ª", "6ª", "7ª", "8ª"],
          linhas: [{ k: "hora", r: "Hora da observação", texto: true }, { grupo: "Silos quentes (medida dos agregados — 4.3.8)" }, { k: "s1", r: "Silo nº 1", u: "°C" }, { k: "s2", r: "Silo nº 2", u: "°C" },
            { k: "s3", r: "Silo nº 3", u: "°C" }, { k: "s4", r: "Silo nº 4", u: "°C" }, { calc: "agMax", r: "Maior temperatura dos silos", u: "°C", casas: 0 },
            { grupo: "Mistura" }, { k: "ma", r: "Mistura de agregados", u: "°C" }, { k: "lig", r: "Ligante betuminoso", u: "°C" }, { k: "mb", r: "Mistura betuminosa", u: "°C", destaque: true },
            { k: "tmix", r: "Tempo de misturação", u: "s" }, { k: "amb", r: "Temperatura ambiente", u: "°C" }, { k: "tempo", r: "Tempo (bom, nublado, chuvoso)", texto: true }] },
        { chave: "dos", titulo: "Dosagem — pesos acumulados da batelada e aberturas dos silos (Quadro 2; 4.3.1)", rotulo: "Componente", iniciais: 6, min: 1,
          dica: "colunas na ordem de pesagem; na coluna do ligante preencha a massa de ligante em vez do peso acumulado",
          linhas: [{ k: "mat", r: "Material / silo", texto: true }, { k: "proj", r: "% de projeto na mistura total", u: "%" }, { k: "acum", r: "Peso acumulado na balança de agregados", u: "kg" },
            { k: "lig", r: "Massa de ligante (cuba)", u: "kg" }, { calc: "mInd", r: "Massa do componente", u: "kg", casas: 1 }, { calc: "pct", r: "% na mistura produzida", u: "%", casas: 2, destaque: true },
            { calc: "dev", r: "Desvio em relação ao projeto", u: "pontos", casas: 2 }, { k: "abF", r: "Abertura do silo frio", texto: true }, { k: "abQ", r: "Abertura do silo quente", texto: true }] },
        { chave: "bal", titulo: "Aferição das balanças com pesos padronizados (4.2 / 4.3.5)", rotulo: "Ponto", iniciais: 3, min: 1,
          linhas: [{ k: "bal", r: "Balança (agregados, ligante, filler, rodoviária)", texto: true }, { k: "pp", r: "Peso padrão aplicado", u: "kg" }, { k: "lei", r: "Leitura da balança", u: "kg" },
            { calc: "err", r: "Erro", u: "kg", casas: 2 }, { calc: "errp", r: "Erro relativo", u: "%", casas: 2, destaque: true }] },
        { chave: "cam", titulo: "Pesagem dos caminhões carregados — confirmação das bateladas (4.3.7)", rotulo: "Caminhão", iniciais: 2, min: 1,
          linhas: [{ k: "id", r: "Caminhão / nota", texto: true }, { k: "nb", r: "Número de bateladas", u: "nº" }, { k: "mb", r: "Massa da batelada (vazio = total da dosagem)", u: "kg" },
            { k: "pl", r: "Peso líquido na balança rodoviária", u: "kg" }, { calc: "esp", r: "Soma das bateladas", u: "kg", casas: 0 }, { calc: "dif", r: "Diferença", u: "%", casas: 2, destaque: true }] },
      ];
    },
    calcular: calcular,
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return A.htmlParecer(r.parecer) + '<div class="fe-res">' +
        A.cartao(ok(r.horas) ? fmt(r.horas, 1) + " <small>h</small>" : "—", "Funcionamento" + (ok(r.jornadas) ? " (" + r.jornadas + " × 8 h)" : "")) +
        A.cartao(ok(r.prod) ? fmt(r.prod, 0) + " <small>t</small>" : "—", "Produção" + (ok(r.taxa) ? " · " + fmt(r.taxa, 0) + " t/h" : "")) +
        A.cartao(ok(r.teorPesado) ? fmt(r.teorPesado, 2) + " <small>%</small>" : ok(r.teorVol) ? fmt(r.teorVol, 2) + " <small>%</small>" : "—", "Teor de ligante produzido" + (ok(r.teorProj) ? " (projeto " + fmt(r.teorProj, 2) + " %)" : "")) +
        A.cartao(ok(r.maxErr) ? (r.maxErr >= 0 ? "+" : "−") + fmt(Math.abs(r.maxErr), 2) + " <small>%</small>" : "—", "Maior erro de aferição") + "</div>" +
        A.htmlCriterios(r.linhas, { estilo: "resultado" });
    },
    graficos: graficos,
    relatorio: {
      notas: "DNER-PRO 015/94. Temperaturas: agregados medidos nos silos quentes; faixas por instrução da fiscalização; fora da faixa, interromper a mistura (4.3.8). Dosagem: percentagens de projeto e tolerâncias dadas pela fiscalização (4.3.1); massa de cada componente = diferença dos pesos acumulados; % = massa ÷ massa total da batelada. Ligante por volume: volume exigido = teor × massa de mistura ÷ peso por volume à temperatura de operação (4.3.7). Balanças: erro = (leitura − peso padrão) ÷ peso padrão; aferição inicial e semanal (4.2, 4.3.5). Amostragem (5.1, 5.2, Quadro 1): mistura ≥ 2 por dia de 8 h; agregados quentes ≥ 2 por dia; frios 1 por dia; filler 1 por carregamento e por dia; ligante todo carregamento; corretivo de adesividade 2/3/4 tambores para 2–8/9–27/28–64. Critérios da ficha (a PRO não fixa valores): tolerâncias como parâmetros; ligante aderido na cuba > 0,5 % do ligante da batelada → compensar.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {};
        var rows = [["Parecer", r.parecer.titulo], ["Usina / mistura", "usina " + r.usina + " · " + (P.tipoMistura || (r.quente ? "mistura a quente" : "pré-misturado a frio"))],
          ["Funcionamento", (P.hIni || "—") + " às " + (P.hFim || "—") + (ok(r.horas) ? " (" + fmt(r.horas, 1) + " h)" : "") + (ok(r.prod) ? " · " + fmt(r.prod, 0) + " t" + (ok(r.taxa) ? " (" + fmt(r.taxa, 0) + " t/h)" : "") : "")]];
        if (ok(r.teorPesado)) rows.push(["Teor de ligante (pesagem)", fmt(r.teorPesado, 2) + " %" + (ok(r.teorProj) ? " — projeto " + fmt(r.teorProj, 2) + " %" : "")]);
        if (ok(r.teorVol)) rows.push(["Teor de ligante (medidor de volume)", fmt(r.teorVol, 2) + " % — volume exigido " + fmt(r.vReq, 2) + " L"]);
        if (r.tmix) rows.push(["Tempo de misturação", fmt(r.tmix[0], 0) + (r.tmix[1] !== r.tmix[0] ? " a " + fmt(r.tmix[1], 0) : "") + " s"]);
        if (ok(r.maxErr)) rows.push(["Maior erro de aferição das balanças", (r.maxErr >= 0 ? "+" : "−") + fmt(Math.abs(r.maxErr), 2) + " %"]);
        return rows;
      },
      extraHtml: function (calc) {
        var r = calc.resultados;
        return A.htmlParecer(r.parecer, { relat: true }) + A.htmlCriterios(r.linhas, { relat: true, estilo: "resultado" });
      },
    },
    exemplos: [
      { nome: "Usina gravimétrica, CBUQ faixa C — dia de 10 h conforme", dados: function () {
        var t = function (hora, s, ma, lig, mb, tmix, amb) { return { hora: hora, s1: s[0], s2: s[1], s3: s[2], s4: s[3], ma: ma, lig: lig, mb: mb, tmix: tmix, amb: amb, tempo: "bom" }; };
        return { ident: { registro: "IU-2026-041", data: "2026-03-10", obra: "Obra A", local: "Usina A — pátio da obra", origem: "Pedreira X; Distribuidora C", camada: "Revestimento — CBUQ faixa C", responsavel: "Inspetor A" },
          params: { usina: "grav", mistura: "quente", tipoMistura: "CBUQ faixa C, CAP 50/70", hIni: "07:00", hFim: "17:00", producao: "820",
            tAgMin: "155", tAgMax: "170", tLigMin: "145", tLigMax: "160", tMisMin: "145", tMisMax: "160", tolLig: "0,3", tolAg: "2", ligVol: "nao",
            taraIni: "38,0", taraAtual: "38,1", tolBal: "0,5", dataAfer: "2026-03-10", tolCam: "2", dmax: "19", nMis: "4", mMis: "10", nQuente: "4", nFrio: "2", cFiller: "1", nFiller: "2", cLig: "1", nLig: "1",
            tDope: "6", aDope: "2", cInst: "S", cFrios: "S", cSecador: "S", cFluxo: "S", cEscoa: "S", cSeq: "S", cSilosQ: "S", cVisual: "S", cVeic: "S", cCarreta: "S", cVidro: "S", cRejeit: "NA", cLivro: "S", cRelat: "S" },
          temp: [t("07:40", ["162", "164", "165", "163"], "163", "152", "154", "45", "21"), t("10:15", ["165", "166", "164", "166"], "165", "153", "155", "45", "25"),
            t("13:30", ["160", "163", "162", "161"], "162", "150", "152", "45", "28"), t("16:10", ["158", "161", "160", "159"], "160", "149", "150", "45", "26")],
          dos: [{ mat: "Silo 1 — pó de pedra", proj: "30,0", acum: "302", abF: "35 %", abQ: "—" }, { mat: "Silo 2 — pedrisco", proj: "12,5", acum: "426", abF: "20 %" },
            { mat: "Silo 3 — brita 0", proj: "24,0", acum: "668", abF: "30 %" }, { mat: "Silo 4 — brita 1", proj: "26,0", acum: "929", abF: "32 %" },
            { mat: "Filler — cal hidratada", proj: "2,0", acum: "948" }, { mat: "Ligante — CAP 50/70", proj: "5,5", lig: "55,3" }],
          bal: [{ bal: "Agregados", pp: "500", lei: "501" }, { bal: "Agregados", pp: "1000", lei: "1003" }, { bal: "Ligante (cuba)", pp: "50", lei: "50,1" }],
          cam: [{ id: "Caminhão 1 — NF 1021", nb: "14", pl: "14080" }, { id: "Caminhão 2 — NF 1022", nb: "13", pl: "12990" }] };
      } },
      { nome: "Usina volumétrica com ligante por volume — temperatura alta, balança fora, amostragem incompleta", dados: function () {
        var t = function (hora, s, ma, lig, mb, amb) { return { hora: hora, s1: s[0], s2: s[1], s3: s[2], s4: "", ma: ma, lig: lig, mb: mb, amb: amb, tempo: "nublado" }; };
        return { ident: { registro: "IU-2026-057", data: "2026-04-22", obra: "Obra B", local: "Usina B", origem: "Pedreira Y; Distribuidora C", camada: "Binder — CBUQ faixa B", responsavel: "Inspetor B" },
          params: { usina: "vol", mistura: "quente", tipoMistura: "CBUQ faixa B, CAP 50/70", hIni: "06:00", hFim: "16:30", producao: "1150",
            tAgMin: "155", tAgMax: "170", tLigMin: "145", tLigMax: "160", tMisMin: "145", tMisMax: "160", tolLig: "0,3", ligVol: "sim", rhoT: "0,940", vMed: "12,4", mRef: "250",
            tolBal: "0,5", dataAfer: "2026-04-08", dmax: "19", nMis: "2", mMis: "6", nQuente: "1", nFrio: "2", cFiller: "1", nFiller: "2", cLig: "2", nLig: "1", tDope: "30", aDope: "3",
            cInst: "S", cFrios: "S", cSecador: "S", cCalib: "S", cRev: "S", cSilosQ: "N", cVisual: "S", cVeic: "S", cCarreta: "N", cLivro: "S", cRelat: "S" },
          temp: [t("06:50", ["166", "168", "167"], "166", "154", "156", "18"), t("09:40", ["170", "172", "171"], "171", "156", "158", "22"),
            t("12:20", ["176", "178", "175"], "176", "158", "171", "27"), t("15:30", ["168", "169", "167"], "167", "155", "157", "24")],
          dos: [{ mat: "Silo 1 — pó de pedra", proj: "32,0", abF: "38 %" }, { mat: "Silo 2 — brita 0", proj: "30,0", abF: "34 %" }, { mat: "Silo 3 — brita 1", proj: "31,0", abF: "36 %" },
            { mat: "Filler — cimento", proj: "2,0" }, { mat: "Ligante — CAP 50/70", proj: "5,0" }],
          bal: [{ bal: "Rodoviária", pp: "10000", lei: "10120" }], cam: [{}] };
      } },
    ],
  };
})();
