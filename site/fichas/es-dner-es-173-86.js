/*
 * Ficha de CÁLCULO E VERIFICAÇÃO: DNER-ES 173/86 — Método de nível e mira para calibração de sistemas medidores de
 * irregularidade tipo resposta (quociente de irregularidade QI).
 * A ES é um método: a ficha recebe as leituras do nivelamento (ficha do Anexo C, codificação do Anexo B), confere o
 * que a ES impõe e calcula VA(1,0), VA(2,5) e o QI de cada alinhamento e do trecho.
 *
 * O que a ES manda (seções do PDF):
 *   3.2  alinhamento externo (direito) na trilha direita; interno (esquerdo) a 1,40 m do externo.
 *   4    equipe: 2 topógrafos, 1 porta-mira, 1 anotador.
 *   5    nível ótico com precisão de 1,5 mm/km; mira de 2 a 4 m, divisões de pelo menos meio centímetro (leitura em mm);
 *        trena de 50 m graduada em cm.
 *   6.1  Quadro 1: distância das trilhas à borda por largura da faixa (2,70 → 0,45/1,85; 3,00 → 0,60/2,00;
 *        3,30 → 0,75/2,15; 3,50 → 0,90/2,30 m); trilha externa já definida pelo tráfego prevalece (OBS).
 *   6.2  estacas inteiras a cada 5,0 m, intermediárias a cada 0,50 m (L0 … L9).  6.3 RN implantada; leituras ao mm.
 *   6.4  codificação: estaca 001 no início do trecho (pos. 16–18); D = externo, E = interno, fichas distintas (pos. 19);
 *        L0 … L9 (pos. 20–59); cota do instrumento (pos. 60–64) — CI − leitura sempre positiva;
 *        6.4.2 posições 3 a 64 todas preenchidas; 6.4.3 posições 20 a 64 numéricas.
 *   7    QI = −8,54 + 6,17·VA(1,0) + 19,38·VA(2,5) (contagens/km);  VA(b) = [Σ_{i=k+1}^{N−k} SBᵢ² / (N − 2k)]^½;
 *        SBᵢ = (Y_{i+k} − 2·Yᵢ + Y_{i−k}) / (k·S)²;  k = b / S;  S = 0,5 m;  Y = cota (mm).
 *        QI do trecho = média aritmética dos QI dos alinhamentos externo e interno.  Anexo D: exemplo (QI = 67).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var ID = "dner-es-173-86";
  var S = 0.5;                                   // m (7)
  var QUADRO1 = { "2,70": [0.45, 1.85], "3,00": [0.60, 2.00], "3,30": [0.75, 2.15], "3,50": [0.90, 2.30] };
  var LS = ["L0", "L1", "L2", "L3", "L4", "L5", "L6", "L7", "L8", "L9"];
  var AL = [["D", "D", "Alinhamento externo (direito) — D"], ["E", "E", "Alinhamento interno (esquerdo) — E"]];

  function vazio(v) { return v === undefined || v === null || String(v).trim() === ""; }
  // VA(b) (7): Y em mm, S em m → mm/m²
  function VA(Y, b) {
    var k = Math.round(b / S), N = Y.length, s = 0, n = 0;
    if (N < 2 * k + 1) return NaN;
    for (var i = k; i < N - k; i++) { var sb = (Y[i + k] - 2 * Y[i] + Y[i - k]) / Math.pow(k * S, 2); s += sb * sb; n++; }
    return Math.sqrt(s / n);
  }
  function qi(v1, v2) { return -8.54 + 6.17 * v1 + 19.38 * v2; }

  // um alinhamento: {cols, Y, N, falhas: {branco, texto, neg, est}, va1, va25, qi}
  function alinhamento(cols) {
    var r = { Y: [], x: [], branco: [], texto: [], neg: [], est: [], tab: [], nCols: 0 };
    var usadas = (cols || []).map(function (c, i) { return { c: c, i: i }; }).filter(function (o) {
      return ["est", "ci"].concat(LS).some(function (k) { return !vazio(o.c[k]); });
    });
    (cols || []).forEach(function (c) {
      var ci = num(c.ci), mn = NaN;
      LS.forEach(function (k) { var v = num(c[k]); if (ok(v) && ok(ci)) mn = ok(mn) ? Math.min(mn, ci - v) : ci - v; });
      r.tab.push({ minDif: mn });
    });
    r.nCols = usadas.length;
    var e0 = NaN, quebra = false;
    usadas.forEach(function (o, j) {
      var c = o.c, rot = "estaca " + (vazio(c.est) ? "(col. " + (o.i + 1) + ")" : String(c.est).trim()), e = num(c.est), ci = num(c.ci);
      if (vazio(c.est)) r.branco.push(rot + ": nº da estaca");
      else if (!ok(e)) r.texto.push(rot + ": nº da estaca não numérico");
      if (j === 0) e0 = e;
      else if (ok(e) && ok(e0) && e !== e0 + j) { r.est.push(rot + " fora de sequência (esperada " + (e0 + j) + ")"); quebra = true; }
      if (vazio(c.ci)) r.branco.push(rot + ": cota do instrumento");
      else if (!ok(ci)) r.texto.push(rot + ": cota do instrumento não numérica");
      LS.forEach(function (k, m) {
        var v = num(c[k]);
        if (vazio(c[k])) { r.branco.push(rot + ": " + k); quebra = true; return; }
        if (!ok(v)) { r.texto.push(rot + ": " + k + " não numérica"); quebra = true; return; }
        if (!ok(ci)) { quebra = true; return; }
        var y = ci - v;
        if (!(y > 0)) r.neg.push(rot + ": CI − " + k + " = " + fmt(y, 0) + " mm");
        r.Y.push(y); r.x.push((ok(e) && ok(e0) ? (e - e0) : j) * 5 + m * S);
      });
    });
    r.e0 = e0; r.quebra = quebra;
    r.N = r.Y.length;
    if (!quebra && r.N) { r.va1 = VA(r.Y, 1.0); r.va25 = VA(r.Y, 2.5); r.qi = ok(r.va1) && ok(r.va25) ? qi(r.va1, r.va25) : NaN; }
    else { r.va1 = r.va25 = r.qi = NaN; }
    r.ext = r.N ? (r.N - 1) * S : NaN;
    return r;
  }

  function tabelas() {
    return AL.map(function (a) {
      return { chave: a[0], titulo: a[2] + " — leituras da mira (6.4, Anexo B)", rotulo: "Estaca", iniciais: 3, min: 1,
        dica: "uma coluna por estaca inteira (5 m); L0 na estaca e L1 … L9 a cada 0,50 m; leituras e cota do instrumento em mm",
        linhas: [{ k: "est", r: "Nº da estaca (pos. 16–18)", texto: true, ph: "001" }].concat(LS.map(function (k, m) {
          return { k: k, r: k + " — " + fmt(m * S, 1) + " m (pos. " + (20 + 4 * m) + "–" + (23 + 4 * m) + ")", u: "mm" };
        })).concat([{ k: "ci", r: "Cota do instrumento (pos. 60–64)", u: "mm" }, { calc: "minDif", r: "Menor CI − leitura (6.4.1)", u: "mm", casas: 0 }]) };
    });
  }

  function linhaSN(id, grupo, crit, secao, v, exig, falha) {
    var l = A.linha({ id: id, grupo: grupo, criterio: crit, secao: secao, exigido: exig, resultado: v === "sim" ? "sim" : v === "nao" ? "não" : "—", n: v ? 1 : 0 });
    if (v === "nao") A.marcar(l, falha || "nao_conforme", "não atende");
    else if (v !== "sim") A.marcar(l, "pendente", "não informado");
    return l;
  }

  function calcular(d) {
    var P = d.params || {}, linhas = [], avisos = [], tab = {}, al = {};
    var G1 = "Equipe e aparelhagem (4 / 5 / 6.3)", G2 = "Localização das trilhas (3.2 / 6.1)";
    // ---- 4 e 5
    linhas.push(linhaSN("equipe", G1, "Equipe: 2 topógrafos, 1 porta-mira e 1 anotador", "4", P.equipe, "conforme 4"));
    var pr = num(P.precNivel);
    var lp = A.linha({ id: "nivel", grupo: G1, criterio: "Precisão do nível ótico", secao: "5 a", exigido: "≤ 1,5 mm/km", resultado: ok(pr) ? fmt(pr, 1) + " mm/km" : "—", n: ok(pr) ? 1 : 0 });
    if (!ok(pr)) A.marcar(lp, "pendente", "não informada"); else if (pr > 1.5 + 1e-9) A.marcar(lp, "nao_conforme", "precisão pior que 1,5 mm/km");
    linhas.push(lp);
    var mc = num(P.miraComp), md = num(P.miraDiv);
    var lm = A.linha({ id: "mira", grupo: G1, criterio: "Mira: comprimento e graduação", secao: "5 b", exigido: "2 a 4 m; divisões ≤ 5 mm (leitura em mm)",
      resultado: (ok(mc) ? fmt(mc, 1) + " m" : "—") + " · " + (ok(md) ? fmt(md, 0) + " mm" : "—"), n: ok(mc) && ok(md) ? 1 : 0 });
    if (!ok(mc) || !ok(md)) A.marcar(lm, "pendente", "informe comprimento e divisão da mira");
    if (ok(mc) && (mc < 2 - 1e-9 || mc > 4 + 1e-9)) A.marcar(lm, "nao_conforme", "comprimento fora de 2 a 4 m");
    if (ok(md) && md > 5 + 1e-9) A.marcar(lm, "nao_conforme", "divisões maiores que meio centímetro");
    linhas.push(lm);
    linhas.push(linhaSN("trena", G1, "Trena de 50 m graduada em centímetros", "5 c", P.trena, "conforme 5 c"));
    linhas.push(linhaSN("rn", G1, "Referência de nível (RN) implantada; leituras ao milímetro", "6.3", P.rn, "RN implantada"));
    // ---- 6.1 e 3.2.2
    var q = QUADRO1[P.faixa], de = num(P.distExt), di = num(P.distInt);
    var lt = A.linha({ id: "trilhaExt", grupo: G2, criterio: "Distância do alinhamento externo à borda", secao: "6.1 (Quadro 1)", n: ok(de) ? 1 : 0,
      exigido: P.trilhaTrafego === "sim" ? "trilha externa definida pelo tráfego (OBS do Quadro 1)" : q ? fmt(q[0], 2) + " m (faixa de " + P.faixa + " m)" : "Quadro 1 (faixa não tabelada)",
      resultado: ok(de) ? fmt(de, 2) + " m" : "—" });
    if (!ok(de)) A.marcar(lt, "pendente", "não informada");
    else if (P.trilhaTrafego !== "sim" && q && Math.abs(de - q[0]) > 0.005) A.marcar(lt, "nao_conforme", "difere do Quadro 1 (" + fmt(q[0], 2) + " m)");
    else if (P.trilhaTrafego !== "sim" && !q) A.marcar(lt, "ressalva", "largura de faixa fora do Quadro 1: justificar a posição adotada");
    linhas.push(lt);
    var li = A.linha({ id: "trilhaInt", grupo: G2, criterio: "Afastamento entre os alinhamentos (interno − externo)", secao: "3.2.2 / 6.1", n: ok(de) && ok(di) ? 1 : 0,
      exigido: "1,40 m" + (q && P.trilhaTrafego !== "sim" ? " (interno a " + fmt(q[1], 2) + " m da borda)" : ""), resultado: ok(de) && ok(di) ? fmt(di - de, 2) + " m" : "—" });
    if (!ok(de) || !ok(di)) A.marcar(li, "pendente", "informe as duas distâncias à borda");
    else if (Math.abs(di - de - 1.40) > 0.005) A.marcar(li, "nao_conforme", "o interno deve distar 1,40 m do externo (3.2.2)");
    linhas.push(li);
    // ---- 6.4 e 7, por alinhamento
    var G3 = "Codificação e cálculo do QI (6.4 / 7)";
    var lc = A.linha({ id: "cod", grupo: G3, criterio: "Identificação: código do trecho, data e sentido / código do PNV", secao: "6.4 (pos. 3–15) / 6.4.2",
      exigido: "preenchimento obrigatório", resultado: [P.codigo || "—", (d.ident || {}).data ? A.dataBR(d.ident.data) : "—", P.sentido || "—"].join(" · "), n: 1 });
    if (vazio(P.codigo) || vazio(P.sentido) || !(d.ident || {}).data) A.marcar(lc, "nao_conforme", "posições em branco (6.4.2: nenhuma posição de 3 a 64 em branco)");
    else if (String(P.codigo).trim().length > 3) A.marcar(lc, "ressalva", "o código do trecho ocupa 3 posições (3–5)");
    linhas.push(lc);
    AL.forEach(function (a) {
      var r = alinhamento(d[a[0]]);
      al[a[0]] = r; tab[a[0]] = r.tab;
      var nome = a[1] === "D" ? "externo (D)" : "interno (E)";
      var l1 = A.linha({ id: "prc" + a[0], grupo: G3, criterio: "Alinhamento " + nome + ": preenchimento das estacas e leituras", secao: "6.2 / 6.4 / 6.4.2 / 6.4.3",
        n: r.nCols, exigido: "estacas consecutivas a partir de 001; L0 … L9 e CI numéricos, sem branco",
        resultado: r.nCols ? r.nCols + " estaca(s), " + r.N + " cotas" + (ok(r.e0) ? " a partir da estaca " + r.e0 : "") : "—" });
      if (!r.nCols) A.marcar(l1, "sem_dados", "sem leituras do alinhamento");
      if (r.branco.length) A.marcar(l1, "nao_conforme", "em branco (6.4.2): " + r.branco.slice(0, 6).join("; ") + (r.branco.length > 6 ? " …" : ""));
      if (r.texto.length) A.marcar(l1, "nao_conforme", "não numérico (6.4.3): " + r.texto.slice(0, 6).join("; "));
      if (r.est.length) A.marcar(l1, "nao_conforme", "estaqueamento (6.2): " + r.est.join("; "));
      if (r.nCols && ok(r.e0) && r.e0 !== 1) A.marcar(l1, "ressalva", "o trecho deve começar na estaca 001 (6.4, pos. 16–18)");
      if (r.nCols && !r.quebra && r.N < 11) A.marcar(l1, "nao_conforme", "menos de 11 cotas: VA(2,5) exige N ≥ 2k + 1 = 11");
      linhas.push(l1);
      var l2 = A.linha({ id: "neg" + a[0], grupo: G3, criterio: "Alinhamento " + nome + ": CI − leitura > 0", secao: "6.4.1 (pos. 60–64)", n: r.N,
        exigido: "sempre positiva", resultado: r.N ? (r.neg.length ? r.neg.length + " leitura(s) ≤ 0" : "todas positivas") : "—" });
      if (!r.N) A.marcar(l2, "sem_dados", "sem leituras");
      else if (r.neg.length) A.marcar(l2, "nao_conforme", r.neg.join("; "));
      linhas.push(l2);
      var l3 = A.linha({ id: "qi" + a[0], grupo: G3, criterio: "Alinhamento " + nome + ": QI = −8,54 + 6,17·VA(1,0) + 19,38·VA(2,5)", secao: "7", n: r.N,
        situacao: "informativo", exigido: "contagens/km", resultado: ok(r.qi) ? "N = " + r.N + " (" + fmt(r.ext, 1) + " m) · VA(1,0) = " + fmt(r.va1, 2) + " · VA(2,5) = " +
          fmt(r.va25, 2) + " mm/m² · QI = " + fmt(r.qi, 1) : "—" });
      if (!ok(r.qi)) A.marcar(l3, r.nCols ? "nao_conforme" : "sem_dados", r.nCols ? "QI não calculado: corrija o preenchimento" : "sem leituras");
      linhas.push(l3);
    });
    var qD = al.D.qi, qE = al.E.qi, qT = ok(qD) && ok(qE) ? (qD + qE) / 2 : NaN;
    var lq = A.linha({ id: "qiT", grupo: G3, criterio: "QI do trecho = média dos alinhamentos externo e interno", secao: "7", n: (ok(qD) ? 1 : 0) + (ok(qE) ? 1 : 0),
      situacao: "informativo", exigido: "contagens/km (inteiro, como no Anexo D)", resultado: ok(qT) ? "(" + fmt(qD, 1) + " + " + fmt(qE, 1) + ") / 2 = " + fmt(qT, 1) + " → QI = " + Math.round(qT) + " contagens/km" : "—" });
    if (!ok(qT)) A.marcar(lq, "pendente", "é preciso o QI dos dois alinhamentos");
    linhas.push(lq);
    if (ok(al.D.ext) && ok(al.E.ext) && Math.abs(al.D.ext - al.E.ext) > 1e-6) avisos.push("Os alinhamentos têm extensões diferentes (" + fmt(al.D.ext, 1) + " m e " + fmt(al.E.ext, 1) + " m).");
    var par = A.parecer(linhas, [], {
      textos: {
        ACEITO: { titulo: "LEVANTAMENTO VÁLIDO — QI = " + (ok(qT) ? Math.round(qT) : "—") + " contagens/km", texto: "Nivelamento executado e codificado conforme a DNER-ES 173/86; QI calculado pela seção 7." },
        RESSALVA: { titulo: "LEVANTAMENTO VÁLIDO COM RESSALVA — QI = " + (ok(qT) ? Math.round(qT) : "—") + " contagens/km", texto: "QI calculado, mas há pontos a documentar." },
        PENDENTE: { titulo: "LEVANTAMENTO INCOMPLETO", texto: "Faltam informações de equipe/aparelhagem ou um dos alinhamentos." },
        REJEITADO: { titulo: "LEVANTAMENTO INVÁLIDO PARA CALIBRAÇÃO", texto: "Há exigência da ES não atendida (aparelhagem, trilhas ou codificação): corrigir ou refazer o nivelamento." },
      } });
    return { tab: tab, resultados: { linhas: linhas, parecer: par, D: al.D, E: al.E, qD: qD, qE: qE, qT: qT }, avisos: avisos };
  }

  function cartoes(r) {
    return '<div class="fe-res">' + A.cartao(ok(r.qT) ? String(Math.round(r.qT)) : "—", "QI do trecho (contagens/km)") +
      A.cartao(ok(r.qD) ? fmt(r.qD, 1) : "—", "QI externo (D)") + A.cartao(ok(r.qE) ? fmt(r.qE, 1) : "—", "QI interno (E)") +
      A.cartao(ok(r.D.ext) ? fmt(r.D.ext, 1) + " m" : "—", "Extensão nivelada (N − 1) × 0,5 m") + "</div>";
  }
  function htmlVA(r, relat) {
    return '<table class="' + (relat ? "gr" : "fe-resumo") + '"><thead><tr><th style="text-align:left">Alinhamento</th><th>N</th><th>VA(1,0) k = 2</th><th>VA(2,5) k = 5</th><th>QI</th></tr></thead><tbody>' +
      [["Externo (D)", r.D, r.qD], ["Interno (E)", r.E, r.qE]].map(function (x) {
        return '<tr><td style="text-align:left">' + x[0] + "</td><td>" + (x[1].N || "—") + "</td><td>" + fmt(x[1].va1, 2) + "</td><td>" + fmt(x[1].va25, 2) + "</td><td>" + fmt(x[2], 1) + "</td></tr>";
      }).join("") + '<tr><td style="text-align:left"><b>Trecho (média)</b></td><td></td><td></td><td></td><td><b>' + (ok(r.qT) ? fmt(r.qT, 1) + " → " + Math.round(r.qT) : "—") + "</b></td></tr></tbody></table>";
  }
  function resultadosHtml(calc) {
    var r = calc.resultados;
    return A.htmlParecer(r.parecer) + cartoes(r) + '<h4 style="margin:12px 0 4px">VA e QI (7)</h4>' + htmlVA(r) +
      '<h4 style="margin:12px 0 4px">Verificações</h4>' + A.htmlCriterios(r.linhas, { estilo: "resultado" });
  }
  // perfil longitudinal dos dois alinhamentos (cota Y × distância)
  function graficos(calc, d, opt) {
    opt = opt || {};
    var r = calc.resultados, ser = [[r.D, "D (externo)"], [r.E, "E (interno)"]].filter(function (s) { return s[0].N > 1; });
    if (!ser.length) return ['<div class="fe-graf-vazio">O perfil aparece com as leituras de um alinhamento.</div>'];
    var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)", cores = imp ? ["#1f5fbf", "#c0392b"] : ["#4f8cff", "#e5534b"];
    var W = 560, H = 240, m = { l: 54, r: 14, t: 22, b: 36 };
    var ys = [], xs = [];
    ser.forEach(function (s) { ys = ys.concat(s[0].Y); xs = xs.concat(s[0].x); });
    var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys), pad = Math.max(2, (y1 - y0) * 0.1); y0 -= pad; y1 += pad;
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs); if (x1 <= x0) x1 = x0 + 1;
    function X(v) { return m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r); }
    function Y(v) { return H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b); }
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10">';
    s += '<text x="' + m.l + '" y="13" fill="' + txt + '" font-weight="bold" font-size="11">Perfil nivelado: Y = CI − leitura (mm) × distância (m)</text>';
    var py = Math.max(1, Math.round((y1 - y0) / 5));
    for (var g = Math.ceil(y0 / py) * py; g <= y1; g += py) {
      s += '<line x1="' + m.l + '" y1="' + Y(g) + '" x2="' + (W - m.r) + '" y2="' + Y(g) + '" stroke="' + grade + '" stroke-width="0.6"/><text x="' + (m.l - 4) + '" y="' + (Y(g) + 3) + '" text-anchor="end" fill="' + txt + '">' + g + "</text>";
    }
    var px = x1 - x0 > 60 ? 10 : 5;
    for (var gx = Math.ceil(x0 / px) * px; gx <= x1 + 1e-9; gx += px) s += '<text x="' + X(gx) + '" y="' + (H - m.b + 13) + '" text-anchor="middle" fill="' + txt + '">' + gx + "</text>";
    s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + txt + '" stroke-width="0.6"/>';
    ser.forEach(function (sr, i) {
      s += '<path d="' + sr[0].Y.map(function (y, j) { return (j ? "L" : "M") + X(sr[0].x[j]).toFixed(1) + " " + Y(y).toFixed(1); }).join(" ") + '" fill="none" stroke="' + cores[i] + '" stroke-width="1.2"/>';
      s += '<text x="' + (W - m.r - 4) + '" y="' + (m.t + 12 + 12 * i) + '" text-anchor="end" fill="' + cores[i] + '">' + esc(sr[1]) + "</text>";
    });
    s += '<text x="' + ((W + m.l) / 2) + '" y="' + (H - 5) + '" text-anchor="middle" fill="' + txt + '">Distância desde a estaca inicial (m)</text>';
    return [s + "</svg>"];
  }

  // ---------- exemplos ----------
  // Anexo B da ES (p. 9): ficha de exemplo do alinhamento interno (E), estacas 001 a 021 — [L0 … L9, CI] em mm
  var ANEXO_B = [
    [3210, 3211, 3212, 3213, 3213, 3212, 3212, 3212, 3210, 3211, 12573], [3209, 3206, 3206, 3204, 3202, 3200, 3198, 3197, 3199, 3196, 12573],
    [3194, 3196, 3195, 3194, 3194, 3194, 3194, 3195, 3197, 3196, 12573], [3196, 3194, 3196, 3194, 3194, 3191, 3191, 3194, 3195, 3195, 12573],
    [3196, 3196, 3197, 3200, 3200, 3199, 3200, 3202, 3200, 3203, 12573], [3205, 3207, 3206, 3208, 3208, 3206, 3206, 3206, 3206, 3206, 12573],
    [3207, 3208, 3210, 3210, 3210, 3212, 3213, 3215, 3217, 3218, 12573], [3214, 3212, 3218, 3218, 3218, 3217, 3218, 3217, 3215, 3215, 12573],
    [3214, 3213, 3213, 3212, 3213, 3213, 3213, 3214, 3213, 3212, 12573], [3212, 3210, 3208, 3207, 3208, 3206, 3205, 3203, 3201, 3198, 12573],
    [3193, 3193, 3193, 3193, 3193, 3193, 3195, 3196, 3200, 3201, 12568], [3203, 3204, 3205, 3210, 3209, 3212, 3213, 3212, 3212, 3213, 12568],
    [3210, 3210, 3210, 3210, 3211, 3211, 3210, 3209, 3209, 3209, 12568], [3209, 3211, 3209, 3210, 3209, 3209, 3210, 3210, 3210, 3210, 12568],
    [3210, 3208, 3209, 3210, 3210, 3211, 3210, 3212, 3213, 3212, 12568], [3211, 3210, 3210, 3210, 3210, 3210, 3209, 3210, 3210, 3210, 12568],
    [3210, 3211, 3211, 3212, 3210, 3209, 3209, 3209, 3208, 3207, 12568], [3208, 3206, 3206, 3206, 3207, 3205, 3202, 3201, 3200, 3199, 12568],
    [3198, 3201, 3200, 3201, 3202, 3202, 3203, 3204, 3205, 3206, 12568], [3208, 3209, 3208, 3208, 3208, 3208, 3207, 3207, 3207, 3206, 12568],
    [3198, 3197, 3196, 3196, 3194, 3194, 3194, 3194, 3193, 3194, 12560]];
  function colunas(rows) {
    return rows.map(function (r, i) {
      var c = { est: ("00" + (i + 1)).slice(-3), ci: String(r[10]) };
      LS.forEach(function (k, j) { c[k] = String(r[j]); });
      return c;
    });
  }
  // alinhamento externo do exemplo 1: gerado a partir do interno com pequenas diferenças determinísticas
  function externo() {
    return ANEXO_B.map(function (r, i) { return r.map(function (v, j) { return j === 10 ? v + 2 : v + 2 + ((i * 7 + j * 3) % 5) - 2; }); });
  }

  FE.FICHAS[ID] = {
    titulo: "Irregularidade pelo método de nível e mira — QI para calibração (DNER-ES 173/86)",
    resumo: "Calcula VA(1,0), VA(2,5) e o quociente de irregularidade QI de cada alinhamento e do trecho (7) a partir das leituras L0 … L9 e da cota do instrumento, e confere equipe, aparelhagem (5), posição das trilhas (Quadro 1) e codificação (6.4).",
    rotuloLink: "Cálculo do QI",
    blocos: [],
    params: [
      { k: "codigo", r: "Código do trecho de calibração (pos. 3–5)", ph: "ex.: R10" },
      { k: "sentido", r: "Sentido do nivelamento / código do PNV (pos. 12–15)", ph: "ex.: sentido crescente — PNV 000" },
      { k: "faixa", r: "Largura da faixa de tráfego (m) — Quadro 1", tipo: "select", opcoes: [["2,70", "2,70"], ["3,00", "3,00"], ["3,30", "3,30"], ["3,50", "3,50"], ["outra", "outra"]] },
      { k: "trilhaTrafego", r: "Trilha externa já definida pelo tráfego (OBS do Quadro 1)?", tipo: "select", opcoes: [["nao", "Não"], ["sim", "Sim"]] },
      { k: "distExt", r: "Distância do alinhamento externo à borda (m)" },
      { k: "distInt", r: "Distância do alinhamento interno à borda (m)" },
      { k: "equipe", r: "Equipe: 2 topógrafos, 1 porta-mira, 1 anotador (4)?", tipo: "select", opcoes: [["", "—"], ["sim", "Sim"], ["nao", "Não"]] },
      { k: "precNivel", r: "Precisão do nível ótico (mm/km)", dica: "5 a: 1,5 mm/km" },
      { k: "miraComp", r: "Comprimento da mira (m)", dica: "5 b: 2 a 4 m" },
      { k: "miraDiv", r: "Divisão da mira (mm)", dica: "5 b: pelo menos meio centímetro (≤ 5 mm)" },
      { k: "trena", r: "Trena de 50 m graduada em cm (5 c)?", tipo: "select", opcoes: [["", "—"], ["sim", "Sim"], ["nao", "Não"]] },
      { k: "rn", r: "RN implantada e leituras ao milímetro (6.3)?", tipo: "select", opcoes: [["", "—"], ["sim", "Sim"], ["nao", "Não"]] },
    ],
    padrao: { faixa: "3,50", trilhaTrafego: "nao" },
    tabelas: tabelas, calcular: calcular, resultadosHtml: resultadosHtml, graficos: graficos,
    relatorio: {
      notas: "DNER-ES 173/86, seção 7: Y = cota do instrumento − leitura (mm), S = 0,5 m; SBᵢ = (Y_{i+k} − 2Yᵢ + Y_{i−k}) / (kS)²; VA(b) = [Σ SBᵢ² / (N − 2k)]^½ " +
        "para i = k+1 … N−k, com k = 2 (b = 1,0 m) e k = 5 (b = 2,5 m); QI = −8,54 + 6,17·VA(1,0) + 19,38·VA(2,5) contagens/km; QI do trecho = média dos " +
        "alinhamentos externo e interno, arredondada ao inteiro como no Anexo D. As cotas formam uma série contínua (estacas de 5 m consecutivas); mudança da " +
        "cota do instrumento entre estacas é aceita (nova estação). Verificação da fórmula: Anexo D (SB₃ = −7, SB₆ = −1,12, SB₇ = −0,64 mm/m², VA(2,5) = 0,91, QI = 67).",
      resultados: function (calc) {
        var r = calc.resultados;
        return [["Parecer", r.parecer.titulo], ["QI externo (D)", ok(r.qD) ? fmt(r.qD, 1) + " contagens/km" : "—"], ["QI interno (E)", ok(r.qE) ? fmt(r.qE, 1) + " contagens/km" : "—"],
          ["QI do trecho", ok(r.qT) ? Math.round(r.qT) + " contagens/km" : "—"]];
      },
      extraHtml: function (calc) {
        var r = calc.resultados;
        return A.htmlParecer(r.parecer, { relat: true }) + "<h2>VA e QI (7)</h2>" + htmlVA(r, true) + "<h2>Verificações</h2>" + A.htmlCriterios(r.linhas, { relat: true, estilo: "resultado" });
      },
    },
    exemplos: [
      { nome: "Trecho de 105 m: alinhamento E da ficha do Anexo B e D correspondente (válido)", dados: function () {
        return { ident: { registro: "QI-R10", data: "1983-11-01", obra: "Trecho de calibração A", trecho: "BR-000 — km 104", responsavel: "Topografia" },
          params: { codigo: "R10", sentido: "sentido crescente — PNV 000", faixa: "3,50", trilhaTrafego: "nao", distExt: "0,90", distInt: "2,30", equipe: "sim",
            precNivel: "1,5", miraComp: "4", miraDiv: "5", trena: "sim", rn: "sim" },
          D: colunas(externo()), E: colunas(ANEXO_B) };
      } },
      { nome: "Trecho curto com leitura em branco, CI − leitura negativa e trilha mal locada (inválido)", dados: function () {
        var E = colunas(ANEXO_B.slice(0, 6)), D = colunas(externo().slice(0, 6));
        E[2].L4 = ""; D[3].L7 = "13580"; D[4].est = "006";
        return { ident: { registro: "QI-T02", data: "2025-04-15", obra: "Trecho de calibração B", trecho: "BR-000 — km 12" },
          params: { codigo: "T2", sentido: "", faixa: "3,30", trilhaTrafego: "nao", distExt: "0,75", distInt: "2,05", equipe: "sim",
            precNivel: "3", miraComp: "4", miraDiv: "10", trena: "sim", rn: "sim" },
          D: D, E: E };
      } },
    ],
  };
})();
