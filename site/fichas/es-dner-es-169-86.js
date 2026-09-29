/*
 * Ficha de CONTROLE DE QUALIDADE DO LEVANTAMENTO: DNER-ES 169/86 — Controle de qualidade de levantamento da condição de
 * superfície de pavimentos flexíveis ou semirrígidos (gerência de pavimentos em nível de rede).
 * Não é aceitação de serviço de obra: o Coordenador do Distrito recontrola uma amostra dos segmentos-testemunha
 * levantados pela Residência (DNER-ES 128/83) e aceita ou rejeita o levantamento.
 *
 * O que a ES manda (seções do PDF):
 *   4.2  amostra = levantamento de 10 % do total de segmentos-testemunha da Residência (4.3: a mais representativa possível).
 *   5    inspeção e contagem de defeitos nos segmentos da amostra e comparação com as fichas (quadro de controle, Anexo).
 *   6.1  amarração: o segmento está de fato no marco quilométrico / referência da ficha.
 *   6.2  tipo de revestimento: o registrado na ficha.
 *   6.3  quantidade de defeitos (DNER-ES 128/83, exceto trincas classe 1): diferença entre a contagem do controle e a da
 *        ficha ≤ 0 (0–4 defeitos no levantamento), 1 (5–9), 2 (10–18), 3 (19–24), 4 (25–30), 5 (acima de 30) (p. 3).
 *   7.1  amostra que satisfaz 6.1 a 6.3: levantamento aceito.
 *   7.2  segmento que não satisfaz: repetir o controle nele e no segmento-testemunha vizinho do mesmo subtrecho;
 *        7.2.1 satisfazendo, aceito; 7.2.2 não satisfazendo, rejeita-se o levantamento desses segmentos e refaz-se o do
 *        subtrecho.   7.3 não aceitação em 10 % dos subtrechos do PNV da Residência: rejeita-se todo o levantamento.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var ID = "dner-es-169-86";

  // 6.3 (PDF p. 3): quantidade de defeitos no levantamento → diferença máxima admissível
  var TAB63 = [[4, 0, "0 – 4"], [9, 1, "5 – 9"], [18, 2, "10 – 18"], [24, 3, "19 – 24"], [30, 4, "25 – 30"], [Infinity, 5, "> 30"]];
  function tol(n) { for (var i = 0; i < TAB63.length; i++) if (n <= TAB63[i][0]) return TAB63[i][1]; return 5; }
  function sn(t) {
    t = String(t === undefined || t === null ? "" : t).trim().toLowerCase();
    if (/^(s|sim|ok|c|1)$/.test(t)) return true;
    if (/^(n|n[aã]o|0)$/.test(t)) return false;
    return null;
  }
  function vazio(c, ks) { return ks.every(function (k) { return String(c[k] === undefined ? "" : c[k]).trim() === ""; }); }
  // avalia um controle (6.1 a 6.3): {ok: true|false|null, falhas: [...], dif, tol}
  function controle(am, rv, dRes, dCoo) {
    var a = sn(am), r = sn(rv), x = num(dRes), y = num(dCoo), o = { falhas: [], dif: NaN, tol: NaN };
    if (a === null || r === null || !ok(x) || !ok(y)) { o.ok = null; return o; }
    o.dif = Math.abs(y - x); o.tol = tol(x);
    if (!a) o.falhas.push("amarração não confere (6.1)");
    if (!r) o.falhas.push("revestimento diferente da ficha (6.2)");
    if (o.dif > o.tol) o.falhas.push("|Δ| = " + o.dif + " > " + o.tol + " defeito(s) admissível(is) para " + x + " no levantamento (6.3)");
    o.ok = !o.falhas.length;
    return o;
  }
  function nomeSeg(c, i) { return (c.seg || "segmento " + (i + 1)) + (c.sub ? " (subtrecho " + c.sub + ")" : ""); }

  function tabelas() {
    return [{ chave: "seg", titulo: "Quadro de controle (Anexo) — segmentos-testemunha da amostra", rotulo: "Segmento", iniciais: 3, min: 1,
      dica: "uma coluna por segmento da amostra; amarração e revestimento: S (confere) ou N; defeitos contados pela DNER-ES 128/83, sem as trincas classe 1",
      linhas: [
        { grupo: "Segmento-testemunha (4)" },
        { k: "sub", r: "Subtrecho do PNV", texto: true, ph: "ex.: ST-03" },
        { k: "seg", r: "Segmento-testemunha / km", texto: true, ph: "ex.: km 104" },
        { grupo: "Controle do Coordenador (6.1 a 6.3)" },
        { k: "amarr", r: "Amarração confere? (S/N) — 6.1", texto: true },
        { k: "rev", r: "Revestimento confere? (S/N) — 6.2", texto: true },
        { k: "dRes", r: "Defeitos na ficha do Residente", u: "nº" },
        { k: "dCoo", r: "Defeitos contados no controle", u: "nº" },
        { calc: "dif", r: "Diferença |Δ|", u: "nº", casas: 0 },
        { calc: "tol", r: "Diferença máxima admissível (6.3)", u: "nº", casas: 0, destaque: true },
        { grupo: "Repetição (7.2) — só se o segmento não atender" },
        { k: "amarrR", r: "Mesmo segmento: amarração (S/N)", texto: true },
        { k: "revR", r: "Mesmo segmento: revestimento (S/N)", texto: true },
        { k: "dCooR", r: "Mesmo segmento: nova contagem", u: "nº" },
        { k: "viz", r: "Segmento vizinho (mesmo subtrecho)", texto: true },
        { k: "amarrV", r: "Vizinho: amarração (S/N)", texto: true },
        { k: "revV", r: "Vizinho: revestimento (S/N)", texto: true },
        { k: "dResV", r: "Vizinho: defeitos na ficha", u: "nº" },
        { k: "dCooV", r: "Vizinho: defeitos contados", u: "nº" },
      ] }];
  }

  function calcular(d) {
    var P = d.params || {}, avisos = [], linhas = [], tab = [], segs = [];
    var cols = (d.seg || []).map(function (c, i) { return { c: c, i: i }; }).filter(function (o) { return !vazio(o.c, ["sub", "seg", "amarr", "rev", "dRes", "dCoo"]); });
    (d.seg || []).forEach(function (c) {
      var o = controle(c.amarr, c.rev, c.dRes, c.dCoo);
      tab.push({ dif: o.dif, tol: o.tol });
    });
    cols.forEach(function (o) {
      var c = o.c, i = o.i, p = controle(c.amarr, c.rev, c.dRes, c.dCoo), s = { sub: String(c.sub || "").trim(), nome: nomeSeg(c, i), p: p, est: "" };
      s.x = num(c.dRes); s.y = num(c.dCoo);
      var l = A.linha({ id: "seg" + i, grupo: "Segmentos da amostra (6 / 7.1 / 7.2)", criterio: s.nome, secao: "6.1 a 6.3", n: 1,
        exigido: "amarração e revestimento conferem; |Δ| ≤ " + (ok(p.tol) ? p.tol : "tabela 6.3"),
        resultado: p.ok === null ? "—" : "amarração " + (sn(c.amarr) ? "S" : "N") + " · revest. " + (sn(c.rev) ? "S" : "N") + " · defeitos " + num(c.dRes) + " × " + num(c.dCoo) + " (|Δ| " + p.dif + ")" });
      if (p.ok === null) A.marcar(l, "pendente", "preencha amarração, revestimento e as duas contagens de defeitos");
      else if (p.ok) l.motivo = "atende a 6.1, 6.2 e 6.3 (7.1)";
      else {
        // 7.2: repetir no mesmo segmento e no vizinho do mesmo subtrecho
        var r = controle(c.amarrR, c.revR, c.dRes, c.dCooR), v = controle(c.amarrV, c.revV, c.dResV, c.dCooV);
        l.secao = "6.1 a 6.3 / 7.2";
        l.resultado += " → repetição: mesmo " + (r.ok === null ? "—" : r.ok ? "atende" : "não atende") + "; vizinho" + (c.viz ? " " + c.viz : "") + " " + (v.ok === null ? "—" : v.ok ? "atende" : "não atende");
        if (r.ok === null || v.ok === null) A.marcar(l, "pendente", p.falhas.join("; ") + " — repetir o controle no mesmo segmento e no vizinho do mesmo subtrecho (7.2)" +
          (r.ok === null && v.ok === null ? "" : r.ok === null ? " (falta o mesmo segmento)" : " (falta o vizinho)"));
        else if (r.ok && v.ok) { l.motivo = "no 1º controle: " + p.falhas.join("; ") + "; repetição atendida no mesmo segmento e no vizinho (7.2.1)"; s.repetido = true; }
        else {
          s.rejeitado = true;
          s.motivo = "1º controle: " + p.falhas.join("; ") + "; repetição: " + [r.ok ? "" : "mesmo segmento — " + r.falhas.join(", "), v.ok ? "" : "vizinho — " + v.falhas.join(", ")].filter(Boolean).join("; ");
        }
      }
      s.linha = l; segs.push(s); linhas.push(l);
    });
    // 7.3: subtrechos rejeitados × total de subtrechos da Residência
    var rej = {};
    segs.forEach(function (s) { if (s.rejeitado) rej[s.sub || s.nome] = true; });
    var nRej = Object.keys(rej).length, outros = num(P.outrosRej), nSub = num(P.nSub);
    var totRej = nRej + (ok(outros) ? outros : 0), frac = ok(nSub) && nSub > 0 ? totRej / nSub * 100 : NaN, total = ok(frac) && frac >= 10 - 1e-9;
    segs.forEach(function (s) {
      if (!s.rejeitado) return;
      A.marcar(s.linha, total ? "nao_conforme" : "ressalva", s.motivo + " — levantamento destes segmentos rejeitado; refazer o do subtrecho " + (s.sub || "?") + " (7.2.2)");
    });
    var l73 = A.linha({ id: "l73", grupo: "Levantamento da Residência (7.3)", criterio: "Subtrechos com levantamento não aceito", secao: "7.3", n: totRej,
      exigido: "< 10 % dos subtrechos do PNV da Residência",
      resultado: totRej + (ok(nSub) ? " de " + nSub + " subtrechos" + (ok(frac) ? " = " + fmt(frac, 1) + " %" : "") : "") + (ok(outros) && outros ? " (" + outros + " de outros controles)" : "") });
    if (!totRej) l73.motivo = "nenhum subtrecho rejeitado";
    else if (!ok(nSub)) A.marcar(l73, "pendente", "informe o total de subtrechos do PNV da Residência para aplicar o 7.3");
    else if (total) A.marcar(l73, "nao_conforme", fmt(frac, 1) + " % ≥ 10 %: rejeitar todo o levantamento de rodovias da jurisdição da Residência (7.3)");
    else l73.motivo = fmt(frac, 1) + " % < 10 %: só os subtrechos rejeitados são refeitos (7.2.2)";
    linhas.push(l73);
    // 4.2: tamanho da amostra
    var N = num(P.nSegTotal);
    var freqs = [A.frequencia({ ensaio: "Segmentos-testemunha controlados (amostra)", metodo: "inspeção e contagem (DNER-ES 128/83)", por: "contagem", a_cada: 10,
      qtd: N, unidade: "segmentos-testemunha", regra: "10 % dos segmentos-testemunha da Residência (4.2)", realizado: segs.length })];
    if (!ok(N)) avisos.push("Informe o total de segmentos-testemunha da Residência: a amostra deve ter 10 % deles (4.2).");
    var subsAm = {};
    segs.forEach(function (s) { if (s.sub) subsAm[s.sub] = true; });
    if (segs.length > 2 && Object.keys(subsAm).length < 2) avisos.push("Todos os segmentos da amostra estão no mesmo subtrecho: a amostra deve ser a mais representativa possível (4.3).");
    var par = A.parecer(linhas, freqs, {
      textos: {
        ACEITO: { titulo: "LEVANTAMENTO ACEITO", texto: "A amostra satisfaz 6.1, 6.2 e 6.3 (7.1 / 7.2.1)." },
        RESSALVA: { titulo: "LEVANTAMENTO ACEITO, EXCETO SUBTRECHO(S) A REFAZER", texto: "Segmento(s) sem conformidade após a repetição: o levantamento do(s) subtrecho(s) indicados é rejeitado e deve ser refeito (7.2.2); o restante é aceito." },
        PENDENTE: { titulo: "CONTROLE INCOMPLETO", texto: "Amostra menor que 10 % dos segmentos (4.2), controle incompleto ou repetição (7.2) ainda não feita." },
        REJEITADO: { titulo: "LEVANTAMENTO DA RESIDÊNCIA REJEITADO", texto: "Não aceitação em 10 % ou mais dos subtrechos do PNV da Residência: todo o levantamento da jurisdição deve ser refeito (7.3)." },
      } });
    return { tab: { seg: tab }, resultados: { linhas: linhas, freqs: freqs, parecer: par, segs: segs, nRej: totRej, frac: frac, N: N }, avisos: avisos };
  }

  function cartoes(r) {
    var ex = r.freqs[0];
    return '<div class="fe-res">' + A.cartao(r.segs.length + (ok(ex.exigido) ? " / " + ex.exigido : ""), "Segmentos controlados / mínimo (10 %)") +
      A.cartao(String(r.segs.filter(function (s) { return s.p.ok; }).length), "Atendem no 1º controle") +
      A.cartao(String(r.segs.filter(function (s) { return s.repetido; }).length), "Aceitos após repetição (7.2.1)") +
      A.cartao(String(r.nRej) + (ok(r.frac) ? " (" + fmt(r.frac, 1) + " %)" : ""), "Subtrechos rejeitados (7.3)") + "</div>";
  }
  function htmlTab63(relat) {
    return '<table class="' + (relat ? "gr" : "fe-resumo") + '"><thead><tr><th>Defeitos no levantamento</th>' + TAB63.map(function (t) { return "<th>" + esc(t[2]) + "</th>"; }).join("") +
      "</tr></thead><tbody><tr><td>Diferença máx. admissível</td>" + TAB63.map(function (t) { return "<td>" + t[1] + "</td>"; }).join("") + "</tr></tbody></table>";
  }
  function resultadosHtml(calc) {
    var r = calc.resultados;
    return A.htmlParecer(r.parecer) + cartoes(r) + '<h4 style="margin:12px 0 4px">Critérios (6 e 7)</h4>' + A.htmlCriterios(r.linhas, { estilo: "resultado" }) +
      '<h4 style="margin:12px 0 4px">Tamanho da amostra (4.2)</h4>' + A.htmlFrequencia(r.freqs) + '<h4 style="margin:12px 0 4px">Tabela de 6.3</h4>' + htmlTab63();
  }
  // defeitos do Residente × do controle, com a faixa admissível de 6.3
  function graficos(calc, d, opt) {
    opt = opt || {};
    var pts = calc.resultados.segs.filter(function (s) { return ok(s.x) && ok(s.y); });
    if (!pts.length) return ['<div class="fe-graf-vazio">O gráfico aparece com as contagens dos segmentos.</div>'];
    var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", grade = imp ? "#ddd" : "var(--border)", cor = imp ? "#1f5fbf" : "#4f8cff", verm = imp ? "#c0392b" : "#e5534b";
    var W = 560, H = 300, m = { l: 46, r: 14, t: 22, b: 36 };
    var vmax = Math.max(10, Math.max.apply(null, pts.map(function (s) { return Math.max(s.x, s.y); })) + 3);
    function X(v) { return m.l + v / vmax * (W - m.l - m.r); }
    function Y(v) { return H - m.b - v / vmax * (H - m.t - m.b); }
    var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10">';
    s += '<text x="' + m.l + '" y="13" fill="' + txt + '" font-weight="bold" font-size="11">Defeitos: ficha do Residente × controle (faixa admissível de 6.3)</text>';
    var passo = vmax > 40 ? 10 : 5;
    for (var g = 0; g <= vmax; g += passo) {
      s += '<line x1="' + m.l + '" y1="' + Y(g) + '" x2="' + (W - m.r) + '" y2="' + Y(g) + '" stroke="' + grade + '" stroke-width="0.6"/>';
      s += '<text x="' + (m.l - 4) + '" y="' + (Y(g) + 3) + '" text-anchor="end" fill="' + txt + '">' + g + "</text>";
      s += '<text x="' + X(g) + '" y="' + (H - m.b + 13) + '" text-anchor="middle" fill="' + txt + '">' + g + "</text>";
    }
    // faixa |Δ| ≤ tol(x) (degraus)
    var sup = [], inf = [];
    for (var x = 0; x <= Math.floor(vmax); x++) { sup.push([x, x + tol(x)]); inf.push([x, Math.max(0, x - tol(x))]); }
    var poli = sup.concat(inf.reverse()).map(function (p) { return X(p[0]).toFixed(1) + "," + Y(Math.min(vmax, p[1])).toFixed(1); }).join(" ");
    s += '<polygon points="' + poli + '" fill="' + (imp ? "#d8ecd8" : "rgba(46,139,87,.18)") + '" stroke="none"/>';
    s += '<line x1="' + X(0) + '" y1="' + Y(0) + '" x2="' + X(vmax) + '" y2="' + Y(vmax) + '" stroke="' + txt + '" stroke-width="0.6" stroke-dasharray="3 3"/>';
    s += '<rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '" fill="none" stroke="' + txt + '" stroke-width="0.6"/>';
    pts.forEach(function (p) {
      var fora = p.p.dif > p.p.tol;
      s += '<circle cx="' + X(p.x).toFixed(1) + '" cy="' + Y(p.y).toFixed(1) + '" r="4" fill="' + (fora ? verm : cor) + '"><title>' + esc(p.nome) + "</title></circle>";
    });
    s += '<text x="' + ((W + m.l) / 2) + '" y="' + (H - 5) + '" text-anchor="middle" fill="' + txt + '">Defeitos na ficha do Residente</text>';
    s += '<text transform="translate(12,' + ((H - m.b + m.t) / 2) + ') rotate(-90)" text-anchor="middle" fill="' + txt + '">Defeitos no controle</text>';
    return [s + "</svg>"];
  }

  // exemplo: coluna do quadro de controle
  function col(sub, seg, am, rv, dr, dc, rep) {
    var c = { sub: sub, seg: seg, amarr: am, rev: rv, dRes: String(dr), dCoo: String(dc) };
    if (rep) Object.keys(rep).forEach(function (k) { c[k] = String(rep[k]); });
    return c;
  }

  FE.FICHAS[ID] = {
    titulo: "Controle de qualidade do levantamento da condição de superfície (DNER-ES 169/86)",
    resumo: "Recontrole de uma amostra de 10 % dos segmentos-testemunha (4.2): amarração (6.1), tipo de revestimento (6.2) e diferença na contagem de defeitos pela tabela de 6.3; repetição no mesmo segmento e no vizinho (7.2) e rejeição de todo o levantamento com 10 % dos subtrechos não aceitos (7.3).",
    rotuloLink: "Controle do levantamento",
    lote: true, blocos: [],
    params: [
      { k: "residencia", r: "Residência / Distrito", ph: "ex.: Residência A — Distrito B" },
      { k: "nSegTotal", r: "Total de segmentos-testemunha da Residência", dica: "4.2: a amostra deve ter 10 % deles" },
      { k: "nSub", r: "Total de subtrechos do PNV da Residência", dica: "7.3: rejeição total com 10 % dos subtrechos não aceitos" },
      { k: "outrosRej", r: "Subtrechos já rejeitados em outros controles do mesmo levantamento", ph: "0" },
    ],
    padrao: {},
    tabelas: tabelas, calcular: calcular, resultadosHtml: resultadosHtml, graficos: graficos,
    relatorio: {
      notas: "DNER-ES 169/86: amostra de 10 % dos segmentos-testemunha (4.2); controle de amarração (6.1), revestimento (6.2) e quantidade de defeitos " +
        "(6.3, DNER-ES 128/83, exceto trincas classe 1), com a diferença máxima admissível da tabela de 6.3; o último intervalo, impresso \"30\" na ES, é lido como " +
        "\"acima de 30\". Segmento que não atende: repetir no mesmo e no vizinho do subtrecho (7.2); persistindo, refazer o levantamento do subtrecho (7.2.2); " +
        "10 % ou mais dos subtrechos não aceitos: rejeitar todo o levantamento da Residência (7.3).",
      resultados: function (calc) {
        var r = calc.resultados, ex = r.freqs[0];
        return [["Parecer", r.parecer.titulo], ["Amostra", r.segs.length + " segmento(s)" + (ok(ex.exigido) ? " (mínimo " + ex.exigido + " = 10 % de " + r.N + ")" : "")],
          ["Subtrechos rejeitados", r.nRej + (ok(r.frac) ? " (" + fmt(r.frac, 1) + " % dos subtrechos)" : "")]];
      },
      extraHtml: function (calc) {
        var r = calc.resultados;
        return A.htmlParecer(r.parecer, { relat: true }) + "<h2>Critérios (6 e 7)</h2>" + A.htmlCriterios(r.linhas, { relat: true, estilo: "resultado" }) +
          "<h2>Tamanho da amostra (4.2)</h2>" + A.htmlFrequencia(r.freqs, true) + "<h2>Tabela de 6.3</h2>" + htmlTab63(true);
      },
    },
    exemplos: [
      { nome: "Amostra de 6 segmentos; um aceito após a repetição (levantamento aceito)", dados: function () {
        return { ident: { registro: "CQ-LEV-01", data: "2025-05-20", obra: "Rede do PNV — Residência A", trecho: "BR-000", responsavel: "Coordenador de gerência" },
          params: { residencia: "Residência A — Distrito B", nSegTotal: "58", nSub: "14", outrosRej: "0" },
          seg: [col("ST-01", "km 12", "S", "S", 3, 3), col("ST-03", "km 41", "S", "S", 7, 8), col("ST-05", "km 77", "S", "S", 12, 15,
            { amarrR: "S", revR: "S", dCooR: 13, viz: "km 81", amarrV: "S", revV: "S", dResV: 7, dCooV: 8 }),
            col("ST-08", "km 118", "S", "S", 21, 19), col("ST-10", "km 150", "S", "S", 0, 0), col("ST-13", "km 196", "S", "S", 33, 36)] };
      } },
      { nome: "Dois subtrechos não aceitos após a repetição, 14,3 % (levantamento rejeitado)", dados: function () {
        return { ident: { registro: "CQ-LEV-02", data: "2025-06-03", obra: "Rede do PNV — Residência C", trecho: "BR-000", responsavel: "Coordenador de gerência" },
          params: { residencia: "Residência C — Distrito B", nSegTotal: "58", nSub: "14", outrosRej: "0" },
          seg: [col("ST-01", "km 8", "S", "S", 6, 6), col("ST-03", "km 39", "N", "S", 10, 11,
            { amarrR: "N", revR: "S", dCooR: 11, viz: "km 44", amarrV: "S", revV: "S", dResV: 5, dCooV: 5 }),
            col("ST-06", "km 90", "S", "S", 15, 16), col("ST-09", "km 132", "S", "S", 3, 5,
            { amarrR: "S", revR: "S", dCooR: 4, viz: "km 136", amarrV: "S", revV: "S", dResV: 2, dCooV: 2 }),
            col("ST-11", "km 170", "S", "N", 20, 22, { amarrR: "S", revR: "S", dCooR: 21, viz: "km 175", amarrV: "S", revV: "S", dResV: 9, dCooV: 10 }),
            col("ST-14", "km 205", "S", "S", 27, 25)] };
      } },
    ],
  };
})();
