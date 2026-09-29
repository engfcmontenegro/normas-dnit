/*
 * Ficha: DNIT 170/2016-PRO — Determinação de deflexões com o Curviâmetro (registro do levantamento).
 * Registra-se em window.FE (usa FE.aceitacao para critérios e parecer).
 *
 * O que a PRO manda (seções do PDF):
 *   4.1   eixo traseiro simples de roda dupla, entre-eixos 5 000 ± 100 mm, pneus a 0,56 MPa, 10,3 tf (ajustável de 8 a
 *         13 tf quando julgado conveniente).
 *   4.2   velocidade de 5 ± 0,19 m/s; corrente de 15 ± 0,015 m com 3 geofones a 5 ± 0,005 m; sensores de temperatura ± 1 °C.
 *   5.2   calibração dos sensores no início de cada jornada (DNIT 171/2016-PRO — ficha importável; o texto diz
 *         "DNIT-xxx/2015-PRO").
 *   5.3   medições na trilha externa; bacia de 4 m (100 medições), dM a cada 5 m (5.3 l); velocidade fora de
 *         5 ± 0,19 m/s → o sistema acusa falha (5.3 r).
 *   6.1   por medição: distância e km, dM, deflexões d da bacia, Rc, temperaturas do pavimento e do ar, UTM, velocidade.
 *   Anexo D  exemplo de relatório: D0, 200, 250, 300, 450, 600, 900, 1 200, 1 500, 1 800 e 2 100 mm e raio de curvatura;
 *         o raio do exemplo confere com Rc = 6 250 / [2·(D0 − D250)] (mesma expressão da DNIT 133-ME, eq. 3) — a ficha
 *         recalcula e compara com o valor fornecido pelo equipamento (a PRO só define Rc como o raio da circunferência
 *         que melhor se ajusta à bacia, 3.5).
 * Estatística (média, desvio n − 1, máximo de D0) informativa: a PRO não a define.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var ID = "dnit-170-2016-pro";
  var SN = [["", "—"], ["sim", "Sim"], ["nao", "Não"]];
  var DIST = [200, 250, 300, 450, 600, 900, 1200, 1500, 1800, 2100];

  function desvio(v) { var m = media(v); return v.length > 1 ? Math.sqrt(v.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0) / (v.length - 1)) : NaN; }
  function faixa(id, grupo, crit, secao, v, lo, hi, exig, casas, u, falha) {
    var x = num(v), l = A.linha({ id: id, grupo: grupo, criterio: crit, secao: secao, exigido: exig, resultado: ok(x) ? fmt(x, casas) + " " + u : "—", n: ok(x) ? 1 : 0 });
    if (!ok(x)) A.marcar(l, "pendente", "não informado");
    else if (x < lo - 1e-9 || x > hi + 1e-9) A.marcar(l, falha || "nao_conforme", "fora de " + exig);
    return l;
  }

  function calcular(d) {
    var P = d.params || {}, avisos = [], linhas = [];
    var G0 = "Calibração e equipamento (4 / 5.2)", G1 = "Medições (5.3 / 6.1)";
    var lc = A.linha({ id: "cal", grupo: G0, criterio: "Calibração dos sensores no início da jornada (DNIT 171/2016-PRO)", secao: "5.2", exigido: "calibrado", resultado: P.calRef || (P.calOk === "sim" ? "sim" : P.calOk === "nao" ? "não" : "—"), n: 1 });
    if (P.calOk === "nao") A.marcar(lc, "nao_conforme", "calibração não aceita: não medir");
    else if (P.calOk !== "sim") A.marcar(lc, "pendente", "informe ou importe a calibração do dia");
    linhas.push(lc);
    linhas.push(faixa("eixos", G0, "Distância entre eixos", "4.1", P.eixos, 4900, 5100, "5 000 ± 100 mm", 0, "mm"));
    linhas.push(faixa("press", G0, "Pressão dos pneus", "4.1", P.pressao, 0.555, 0.565, "0,56 MPa", 2, "MPa"));
    var q = num(P.carga), lq = A.linha({ id: "carga", grupo: G0, criterio: "Carga no eixo traseiro", secao: "4.1 / 4.2 f", exigido: "10,3 tf (8 a 13 tf quando conveniente)", resultado: ok(q) ? fmt(q, 1) + " tf" : "—", n: ok(q) ? 1 : 0 });
    if (!ok(q)) A.marcar(lq, "pendente", "não informada");
    else if (q < 8 - 1e-9 || q > 13 + 1e-9) A.marcar(lq, "nao_conforme", "fora de 8 a 13 tf");
    else if (Math.abs(q - 10.3) > 0.05) A.marcar(lq, "ressalva", "carga diferente de 10,3 tf: justificar (4.1)");
    linhas.push(lq);
    linhas.push(faixa("corr", G0, "Comprimento da corrente", "4.2 a", P.corrente, 14.985, 15.015, "15 ± 0,015 m", 3, "m"));
    linhas.push(faixa("geo", G0, "Espaçamento entre geofones", "4.2 a", P.espac, 4.995, 5.005, "5 ± 0,005 m", 3, "m"));

    var pts = (d.pt || []).map(function (c, i) {
      var o = { km: num(c.km), ref: c.ref || "", rot: c.km ? "km " + c.km : "medição " + (i + 1), d0: num(c.d0), rc: num(c.rc), v: num(c.v), tp: num(c.tp), ta: num(c.ta) };
      DIST.forEach(function (x) { o["d" + x] = num(c["d" + x]); });
      o.rcCalc = ok(o.d0) && ok(o.d250) && o.d0 > o.d250 ? 6250 / (2 * (o.d0 - o.d250)) : NaN;
      o.difRc = ok(o.rc) && ok(o.rcCalc) ? o.rc - o.rcCalc : NaN;
      return o;
    }).filter(function (o) { return ok(o.d0) || ok(o.km); });
    var lm = A.linha({ id: "med", grupo: G1, criterio: "Medições (dM na trilha externa, bacia, Rc, temperaturas, velocidade)", secao: "6.1", n: pts.length, exigido: "dados de 6.1", resultado: pts.length + " medição(ões)" });
    if (!pts.length) A.marcar(lm, "sem_dados", "sem medições");
    var semBacia = pts.filter(function (o) { return !ok(o.d0) || !ok(o.d250) || !ok(o.rc); });
    if (semBacia.length) A.marcar(lm, "ressalva", "sem D0, D250 ou Rc: " + semBacia.slice(0, 5).map(function (o) { return o.rot; }).join(", "));
    var mono = pts.filter(function (o) { var a = [o.d0].concat(DIST.map(function (x) { return o["d" + x]; })).filter(ok); return a.some(function (v, i) { return i && v > a[i - 1] + 1e-9; }); });
    if (mono.length) A.marcar(lm, "ressalva", "bacia não decrescente com a distância: " + mono.map(function (o) { return o.rot; }).join(", "));
    var semT = pts.filter(function (o) { return !ok(o.tp) || !ok(o.ta); });
    if (semT.length && semT.length < pts.length) A.marcar(lm, "ressalva", semT.length + " medição(ões) sem temperatura do pavimento/ar (6.1 e)");
    else if (pts.length && semT.length === pts.length) A.marcar(lm, "pendente", "registre as temperaturas do pavimento e do ar (6.1 e)");
    linhas.push(lm);
    // espaçamento de 5 m (5.3 l)
    var ks = pts.map(function (o) { return o.km; }).filter(ok), passos = [];
    for (var i = 1; i < ks.length; i++) passos.push(Math.abs(ks[i] - ks[i - 1]) * 1000);
    var foraP = passos.filter(function (p) { return Math.abs(p - 5) > 0.5; });
    var le = A.linha({ id: "passo", grupo: G1, criterio: "Espaçamento entre deflexões máximas", secao: "5.3 l", exigido: "5 m", n: passos.length,
      resultado: passos.length ? fmt(Math.min.apply(null, passos), 1) + " a " + fmt(Math.max.apply(null, passos), 1) + " m" : "—", situacao: passos.length ? "conforme" : "informativo" });
    if (foraP.length) A.marcar(le, "ressalva", foraP.length + " intervalo(s) diferente(s) de 5 m (critério da ficha: ± 0,5 m) — falha de medição ou trecho interrompido");
    linhas.push(le);
    var vs = pts.filter(function (o) { return ok(o.v); }), foraV = vs.filter(function (o) { return Math.abs(o.v - 5) > 0.19 + 1e-9; });
    var lv = A.linha({ id: "vel", grupo: G1, criterio: "Velocidade em cada medição", secao: "4.2 / 5.3 r", exigido: "5 ± 0,19 m/s", n: vs.length,
      resultado: vs.length ? fmt(Math.min.apply(null, vs.map(function (o) { return o.v; })), 2) + " a " + fmt(Math.max.apply(null, vs.map(function (o) { return o.v; })), 2) + " m/s" : "—" });
    if (!vs.length) A.marcar(lv, "pendente", "registre a velocidade de cada medição (6.1 g)");
    else if (foraV.length) A.marcar(lv, "nao_conforme", "fora de 5 ± 0,19 m/s — medições inválidas: " + foraV.map(function (o) { return o.rot + " (" + fmt(o.v, 2) + ")"; }).join(", "));
    linhas.push(lv);
    var comRc = pts.filter(function (o) { return ok(o.difRc); }), divRc = comRc.filter(function (o) { return Math.abs(o.difRc) > Math.max(1, 0.01 * o.rcCalc); });
    var lr = A.linha({ id: "rc", grupo: G1, criterio: "Rc fornecido × 6 250 / [2·(D0 − D250)] (Anexo D)", secao: "3.5 / Anexo D", exigido: "coerente (± 1 %)", n: comRc.length, situacao: comRc.length ? "conforme" : "informativo",
      resultado: comRc.length ? (comRc.length - divRc.length) + " de " + comRc.length + " coerentes" : "—" });
    if (divRc.length) A.marcar(lr, "ressalva", "Rc diferente da expressão do Anexo D: " + divRc.slice(0, 5).map(function (o) { return o.rot + " (" + fmt(o.rc, 0) + " × " + fmt(o.rcCalc, 0) + ")"; }).join(", ") + " — confira o critério de ajuste do equipamento");
    linhas.push(lr);

    var d0s = pts.map(function (o) { return o.d0; }).filter(ok);
    var est = { n: d0s.length, m: media(d0s), s: desvio(d0s), max: d0s.length ? Math.max.apply(null, d0s) : NaN, min: d0s.length ? Math.min.apply(null, d0s) : NaN };
    var par = A.parecer(linhas, [], { textos: {
      ACEITO: { titulo: "LEVANTAMENTO VÁLIDO", texto: "Levantamento com o Curviâmetro conforme a DNIT 170/2016-PRO." },
      RESSALVA: { titulo: "LEVANTAMENTO VÁLIDO COM RESSALVA", texto: "Dados utilizáveis; há pontos a registrar." },
      PENDENTE: { titulo: "LEVANTAMENTO COM REGISTROS INCOMPLETOS", texto: "Faltam registros exigidos pela PRO." },
      REJEITADO: { titulo: "LEVANTAMENTO NÃO CONFORME", texto: "Equipamento fora das condições da PRO, sem calibração válida ou medições fora da velocidade: refazer os trechos afetados." } } });
    return { tab: { pt: pts.map(function (o) { return { rcCalc: o.rcCalc, difRc: o.difRc }; }) }, resultados: { linhas: linhas, parecer: par, pts: pts, est: est }, avisos: avisos };
  }

  function graficos(calc, d, opt) {
    opt = opt || {};
    var r = calc.resultados, out = [];
    var s = r.pts.filter(function (o) { return ok(o.km) && ok(o.d0); }).map(function (o) { return { x: o.km * 1000, y: o.d0, fora: false }; });
    if (s.length) out.push(A.grafico("D0 (0,01 mm) ao longo do trecho — posição em m (km × 1 000)", s, [{ y: r.est.m, tipo: "med", txt: "média " + fmt(r.est.m, 1) }], opt));
    // bacias
    var bac = r.pts.filter(function (o) { return ok(o.d0); });
    if (bac.length) {
      var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)", cor = imp ? "#1f5fbf" : "#4f8cff";
      var W = 560, H = 240, m = { l: 44, r: 14, t: 22, b: 36 }, xmax = 2100, ymax = Math.max.apply(null, bac.map(function (o) { return o.d0; })) * 1.1;
      var X = function (v) { return m.l + v / xmax * (W - m.l - m.r); }, Y = function (v) { return m.t + v / ymax * (H - m.t - m.b); };
      var g = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10"><text x="' + m.l + '" y="13" fill="' + txt + '" font-weight="bold" font-size="11">Bacias de deflexão (0,01 mm) × distância à carga (mm)</text>';
      for (var k = 0; k <= 5; k++) { var yy = ymax * k / 5; g += '<line x1="' + m.l + '" y1="' + Y(yy) + '" x2="' + (W - m.r) + '" y2="' + Y(yy) + '" stroke="' + grade + '" stroke-width="0.6"/><text x="' + (m.l - 4) + '" y="' + (Y(yy) + 3) + '" text-anchor="end" fill="' + txt + '">' + Math.round(yy) + "</text>"; }
      [0].concat(DIST).forEach(function (x) { if (x % 300 === 0) g += '<text x="' + X(x) + '" y="' + (H - m.b + 13) + '" text-anchor="middle" fill="' + txt + '">' + x + "</text>"; });
      g += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + txt + '" stroke-width="0.6"/>';
      bac.forEach(function (o) {
        var pp = [[0, o.d0]].concat(DIST.map(function (x) { return [x, o["d" + x]]; })).filter(function (p) { return ok(p[1]); });
        g += '<path d="' + pp.map(function (p, j) { return (j ? "L" : "M") + X(p[0]).toFixed(1) + " " + Y(p[1]).toFixed(1); }).join(" ") + '" fill="none" stroke="' + cor + '" stroke-opacity="0.6" stroke-width="1"/>';
      });
      g += '<text x="' + ((W + m.l) / 2) + '" y="' + (H - 5) + '" text-anchor="middle" fill="' + txt + '">Distância ao ponto de deflexão máxima (mm)</text>';
      out.push(g + "</svg>");
    }
    return out.filter(Boolean);
  }

  // Anexo D, Tabela 1: km, referência, D0, 200 … 2100, Rc
  var ANEXO_D = [["519,640", "OAE", 10, 9, 9, 8, 6, 4, 4, 3, 3, 1, 1, 3125], ["519,635", "Fim OAE", 10, 8, 8, 7, 5, 4, 3, 0, 0, 0, 0, 1563], ["519,630", "", 18, 15, 14, 13, 10, 9, 6, 2, 0, 0, 0, 781],
    ["519,625", "", 22, 16, 15, 14, 12, 10, 9, 3, 0, 0, 0, 446], ["519,620", "", 25, 20, 19, 18, 13, 9, 8, 3, 1, 0, 0, 521], ["519,615", "", 26, 22, 20, 17, 12, 7, 2, 0, 0, 0, 0, 521],
    ["519,610", "Trevo A", 26, 21, 19, 16, 12, 7, 3, 1, 1, 0, 0, 446], ["519,605", "Trevo A", 27, 24, 22, 20, 16, 11, 5, 2, 1, 0, 0, 625], ["519,600", "", 35, 30, 28, 25, 20, 14, 7, 3, 1, 1, 0, 446],
    ["519,595", "", 39, 33, 30, 27, 22, 15, 8, 4, 2, 1, 1, 347], ["519,590", "", 32, 28, 26, 23, 18, 12, 5, 2, 1, 0, 0, 521], ["519,585", "", 35, 30, 27, 24, 19, 13, 6, 3, 1, 1, 0, 391],
    ["519,580", "", 38, 32, 29, 26, 20, 13, 6, 3, 2, 1, 0, 347], ["519,575", "", 32, 28, 26, 23, 18, 12, 6, 2, 1, 0, 0, 521], ["519,570", "", 32, 28, 26, 23, 18, 12, 6, 2, 1, 0, 0, 521]];
  function colunas(rows, extra) {
    return rows.map(function (x, i) {
      var c = { km: x[0], ref: x[1], d0: String(x[2]), rc: String(x[13]) };
      DIST.forEach(function (dd, j) { c["d" + dd] = String(x[3 + j]); });
      if (extra) Object.keys(extra(i)).forEach(function (k) { c[k] = extra(i)[k]; });
      return c;
    });
  }

  var LIN = [{ k: "km", r: "km", texto: true, ph: "519,640" }, { k: "ref", r: "Referência (OAE, placa km, troca de revestimento…)", texto: true },
    { k: "d0", r: "D0 — deflexão máxima dM", u: "0,01 mm" }].concat(DIST.map(function (x) { return { k: "d" + x, r: "d a " + x + " mm", u: "0,01 mm" }; })).concat([
    { k: "rc", r: "Rc fornecido pelo equipamento", u: "m" }, { k: "v", r: "Velocidade", u: "m/s" }, { k: "tp", r: "Temperatura do pavimento", u: "°C" }, { k: "ta", r: "Temperatura do ar", u: "°C" },
    { k: "utm", r: "Coordenadas UTM (X; Y)", texto: true }, { calc: "rcCalc", r: "Rc = 6 250 / [2(D0 − D250)] (Anexo D)", u: "m", casas: 0 }, { calc: "difRc", r: "Rc fornecido − Rc calculado", u: "m", casas: 0 }]);

  FE.FICHAS[ID] = {
    titulo: "Deflexões com o Curviâmetro",
    lote: true,
    resumo: "Registro do levantamento com o Curviâmetro: calibração do dia (DNIT 171-PRO), caminhão (5 000 ± 100 mm, 0,56 MPa, 10,3 tf), corrente e geofones, velocidade 5 ± 0,19 m/s por medição, dM a cada 5 m, bacia (D0 a 2 100 mm) e raio de curvatura conferido com 6 250 / [2(D0 − D250)].",
    rotuloImportar: function (r) { return r.est && r.est.n ? "D0 médio " + fmt(r.est.m, 1) + " · máx. " + fmt(r.est.max, 0) + " (0,01 mm), n = " + r.est.n : "—"; },
    blocos: [],
    params: [
      { k: "impCal", r: "Calibração do dia: importar da DNIT 171/2016-PRO", tipo: "importar", de: "dnit-171-2016-pro",
        aplicar: function (e, P) {
          var r = e.resultados || {}, i = (e.dados || {}).ident || {}, cod = (r.parecer || {}).parecer;
          P.calOk = cod === "ACEITO" || cod === "RESSALVA" ? "sim" : cod === "REJEITADO" ? "nao" : "";
          P.calRef = (i.registro || "calibração") + (i.data ? " — " + A.dataBR(i.data) : "") + " — " + ((r.parecer || {}).titulo || "");
        } },
      { k: "calOk", r: "Calibração do dia aceita (5.2)?", tipo: "select", opcoes: SN },
      { k: "calRef", r: "Referência da calibração" },
      { k: "equip", r: "Equipamento", ph: "Curviâmetro A" },
      { k: "eixos", r: "Distância entre eixos (mm) (4.1)", ph: "5000" },
      { k: "pressao", r: "Pressão dos pneus (MPa) (4.1)", ph: "0,56" },
      { k: "carga", r: "Carga no eixo traseiro (tf) (4.1)", ph: "10,3" },
      { k: "corrente", r: "Comprimento da corrente (m) (4.2 a)", ph: "15,000" },
      { k: "espac", r: "Espaçamento entre geofones (m) (4.2 a)", ph: "5,000" },
      { k: "faixa", r: "Pista / faixa / sentido" },
    ],
    padrao: {},
    tabelas: function () {
      return [{ chave: "pt", titulo: "Medições — relatório de resultados (6.1, Anexo D)", rotulo: "Medição", iniciais: 10, min: 1, linhas: LIN,
        dica: "uma coluna por deflexão máxima (a cada 5 m), com a bacia e os demais registros do equipamento" }];
    },
    calcular: calcular,
    resultadosHtml: function (calc) {
      var r = calc.resultados, e = r.est;
      return A.htmlParecer(r.parecer) + '<div class="fe-res">' + A.cartao(fmt(e.m, 1), "D0 médio (0,01 mm), n = " + e.n) + A.cartao(fmt(e.s, 1), "Desvio-padrão (n − 1)") +
        A.cartao(fmt(e.min, 0) + " – " + fmt(e.max, 0), "D0 mín. – máx.") + "</div>" + A.htmlCriterios(r.linhas, { estilo: "resultado" });
    },
    graficos: graficos,
    relatorio: {
      notas: "DNIT 170/2016-PRO: deflexões em 0,01 mm na trilha externa, dM a cada 5 m (5.3 l); Rc conferido com 6 250 / [2(D0 − D250)], expressão com que o exemplo do Anexo D confere (a PRO define Rc em 3.5 como o raio da circunferência que melhor se ajusta à bacia). Estatística de D0 informativa.",
      resultados: function (calc) {
        var r = calc.resultados, e = r.est;
        return [["Parecer", r.parecer.titulo], ["Medições", String(e.n)], ["D0 médio / desvio / máx.", fmt(e.m, 1) + " / " + fmt(e.s, 1) + " / " + fmt(e.max, 0) + " (0,01 mm)"]];
      },
      extraHtml: function (calc) { var r = calc.resultados; return A.htmlParecer(r.parecer, { relat: true }) + A.htmlCriterios(r.linhas, { relat: true, estilo: "resultado" }); },
    },
    exemplos: [
      { nome: "Relatório do Anexo D (15 medições, km 519,640 a 519,570)", dados: function () {
        return { ident: { registro: "CV-01", data: "2026-09-01", obra: "Obra A", trecho: "BR-000 — km 519,640 a 519,570" },
          params: { calOk: "sim", calRef: "CAL-CV-01 — 01/09/2026", equip: "Curviâmetro A", eixos: "5000", pressao: "0,56", carga: "10,3", corrente: "15,000", espac: "5,000", faixa: "pista simples, faixa direita, sentido decrescente" },
          pt: colunas(ANEXO_D, function (i) { return { v: String(5 + ((i * 3) % 5 - 2) / 100).replace(".", ","), tp: String(34 + (i % 3)), ta: String(27 + (i % 2)) }; }) };
      } },
      { nome: "Levantamento com perda de velocidade e medição faltante (dados gerados)", dados: function () {
        var rows = ANEXO_D.slice(2, 10).map(function (x) { return x.slice(); });
        rows.splice(4, 1);  // falta uma medição: salto de 10 m
        return { ident: { registro: "CV-02", data: "2026-09-03", obra: "Obra A", trecho: "BR-000 — km 519,630 a 519,595" },
          params: { calOk: "sim", calRef: "CAL-CV-03", equip: "Curviâmetro A", eixos: "5010", pressao: "0,56", carga: "11,0", corrente: "15,000", espac: "5,000" },
          pt: colunas(rows, function (i) { return { v: i === 3 ? "4,62" : "5,02", tp: "31", ta: "25" }; }) };
      } },
    ],
  };
})();
