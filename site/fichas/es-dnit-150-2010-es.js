/*
 * Ficha de ACEITAÇÃO DE LOTE: DNIT 150/2010-ES — Lama asfáltica.
 *
 * Este arquivo também define o NÚCLEO COMUM das fichas de ES de revestimentos a frio e tratamentos
 * (FE.aceitacaoG4b), usado por es-dnit-153-2010-es.js, es-dner-es-390-99.js, es-dner-es-391-99.js (que acrescenta
 * FE.aceitacaoG4b.ts, usado por 392, 393 e 394). Carregue-o antes desses arquivos (ordem das tags <script>).
 *
 * FE.aceitacaoG4b (G4):
 *   G4.montar(cfg)            ficha inteira a partir de "seções" (cada seção traz params, tabelas e o cálculo das
 *                             suas linhas de critério e frequências no modelo da biblioteca FE.aceitacao).
 *   Seções prontas: G4.secMistura (extração: teor de ligante + granulometria do agregado extraído, faixa de
 *   trabalho), G4.secMarshall (DNER-ME 107), G4.secGC (grau de compactação/compressão), G4.secGeo (espessura,
 *   alinhamento, régua), G4.secValor (valor medido com mín./máx. e frequência, ex.: VRD), G4.secLigante (recebimento
 *   dos carregamentos — DNIT 165-EM / DNIT 095-EM), G4.secAgregados (EA, adesividade, LA, durabilidade, índice de
 *   forma, granulometria dos agregados por jornada), G4.secVerif (verificações S/N).
 *   Utilidades: G4.K_277 (DNER-PRO 277/97, sem n = 11), G4.K_39X (DNER-ES 391–393/99, com n = 11), G4.faixa,
 *   G4.opcoesFaixa, G4.avaliarGran, G4.est (estaca), G4.colGran (granulometria de uma ficha 053/412).
 *
 * DNIT 150/2010-ES — o que a ficha verifica (seções do PDF):
 *   7.2.2 teor de ligante por extração (Soxhlet, ASTM D 2172): projeto ± 0,30 %; 7.2.3 granulometria do agregado
 *   extraído na faixa de trabalho = curva de projeto ± tolerâncias da Tabela 2; 5.1.5 c curva de projeto dentro da
 *   faixa I, II ou III; 7.2.4 mínimo de 5 determinações por segmento (área < 3.000 m²); 7.5 X̄ − ks ≥ mín. e
 *   X̄ + ks ≤ máx. (k "tabelado" — a ES não traz a tabela: usada a da DNER-PRO 277/97, citada em 7.4);
 *   7.3.1 acabamento; 7.3.2 alinhamentos ± 5 cm; 7.3.3 VRD > 55 (pêndulo britânico) a cada 200 m;
 *   7.1.1 ligante: viscosidade SF, resíduo, peneiramento e carga por carregamento + sedimentação a cada 100 t;
 *   7.1.2 agregados por jornada: 2 granulometrias de cada agregado, 1 adesividade, 1 equivalente de areia;
 *   5.1.4 a) LA ≤ 40 % (admite-se maior com desempenho anterior satisfatório), durabilidade < 12 %, EA ≥ 55 %,
 *   adesividade > 90 %; Tabela 2: taxa de aplicação da lama (kg/m²) por faixa.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media, G = FE.granulometria;
  var G4 = FE.aceitacaoG4b = FE.aceitacaoG4b || {};

  // =====================================================================================
  // tabelas de k
  // =====================================================================================
  // DNER-PRO 277/97 (Tabela 1), reproduzida na DNER-ES 390/99 (7.2.1.4) e na DNER-ES 394/99 (7.2.4): não tabela n = 11
  G4.K_277 = [[5, 1.55, 0.45], [6, 1.41, 0.35], [7, 1.36, 0.30], [8, 1.31, 0.25], [9, 1.25, 0.19], [10, 1.21, 0.15],
    [12, 1.16, 0.10], [13, 1.13, 0.08], [14, 1.11, 0.06], [15, 1.10, 0.05], [16, 1.08, 0.04], [17, 1.06, 0.03], [19, 1.04, 0.02], [21, 1.01, 0.01]];
  // DNER-ES 391, 392 e 393/99 (7.2.3): a mesma tabela com n = 11 → k = 1,19 (α = 0,13)
  G4.K_39X = G4.K_277.slice(0, 6).concat([[11, 1.19, 0.13]], G4.K_277.slice(6));
  G4.txtK = function (tab) { return tab.map(function (x) { return "n = " + x[0] + ": " + fmt(x[1], 2); }).join("; "); };

  // =====================================================================================
  // utilidades
  // =====================================================================================
  // estaca: "40" e "40+10,5" (estrito) ou "Est. 42" / "Estaca 42"; texto qualquer ("Saída do misturador") → NaN
  G4.est = function (s) {
    var t = String(s === undefined || s === null ? "" : s).trim();
    var x = A.estacaM(t, { estrito: true });
    if (ok(x)) return x;
    return /^(est\.?|estaca|e-)\s*\d/i.test(t) ? A.estacaM(t) : NaN;
  };
  function vazio(x) { return x === undefined || x === null || String(x).trim() === ""; }
  G4.vazio = vazio;
  // S/N: true, false ou null
  G4.simNao = function (t) {
    t = String(t === undefined || t === null ? "" : t).trim().toLowerCase();
    if (!t) return null;
    if (/^(s|sim|ok|c|conforme|atende|x|sat|satisfat[oó]rio|aprovado|a)$/.test(t)) return true;
    if (/^(n|n[aã]o|nc|n[aã]o conforme|reprovado|r|n[aã]o satisfat[oó]rio)$/.test(t)) return false;
    return null;
  };
  G4.faixa = function (id) { return G.faixasDisponiveis().filter(function (f) { return f.id === id; })[0] || null; };
  // opções de faixa da norma (sem a do fíler); filtro(f) opcional
  G4.opcoesFaixa = function (norma, filtro) {
    return G.faixasDisponiveis().filter(function (f) { return f.norma === norma && !/f[ií]ler/i.test(f.faixa) && (!filtro || filtro(f)); })
      .map(function (f) { return [f.id, "Faixa " + f.faixa + (f.condicao ? " — " + f.condicao : "")]; });
  };
  function perto(a, b) { return Math.abs(a - b) / b < 0.04; }
  G4.perto = perto;
  function nomePen(p) { return p.nome + " (" + fmt(p.mm, p.mm < 1 ? 3 : p.mm < 10 ? 2 : 1).replace(/,?0+$/, "") + " mm)"; }
  G4.nomePen = nomePen;
  function tolDe(fx, mm) {
    var t = (fx.tolerancia || []).filter(function (x) { return perto(x.mm, mm); })[0];
    return t ? t.tol : NaN;
  }
  // granulometria (% passando por abertura) de um ensaio importado: DNER-ME 053 (recalculada: agregado recuperado) ou DNIT 412
  G4.colGran = function (e) {
    var med = null, teor = NaN;
    if (e.ficha === "dner-me-053-94") {
      var c = FE.FICHAS[e.ficha].calcular(e.dados);
      teor = c.resultados.teor;
      med = c.gr ? c.gr.resultados.media : null;
    } else med = (e.resultados || {}).media;
    return { teor: teor, media: (med || []).filter(function (m) { return ok(m.pass); }) };
  };
  // % passando da coluna importada nas peneiras da faixa (casa aberturas próximas: 12,5 ↔ 12,7)
  G4.pensDaFaixa = function (fx, med, col) {
    (fx ? fx.peneiras : []).forEach(function (p) {
      var m = med.filter(function (x) { return perto(x.mm, p.mm); })[0];
      if (m) col[G.chavePen(p.mm)] = A.nstr(m.pass, 1);
    });
    return col;
  };
  G4.linhasPen = function (fx, sufixo) {
    return (fx ? fx.peneiras : []).map(function (p) { return { k: G.chavePen(p.mm), r: nomePen(p) + (sufixo ? sufixo(p) : ""), u: "%" }; });
  };
  // parâmetros "importarVarios" com a dica padrão
  G4.imp = function (k, r, de, aplicar, extra) {
    return Object.assign({ k: k, r: r + " — importar", tipo: "importarVarios", de: de, aplicar: aplicar,
      dica: "marque os ensaios e clique em \"Importar selecionados\" (substitui as colunas importadas antes; as digitadas são mantidas)" }, extra || {});
  };
  function nInt(x, pad) { var v = num(x); return ok(v) && v > 0 ? v : pad; }
  G4.nInt = nInt;
  function pontos(arr, k, rot, fnV) {
    return (arr || []).map(function (c, i) {
      var v = fnV ? fnV(c, i) : num(c[k]), x = G4.est(c.est);
      return { v: v, est: ok(x) ? c.est : "", x: x, rot: (rot || "det. ") + (i + 1) + (c.pos ? " " + c.pos : "") + (!ok(x) && !vazio(c.est) ? " — " + c.est : "") };
    }).filter(function (p) { return ok(p.v); });
  }
  G4.pontos = pontos;

  // =====================================================================================
  // granulometria: faixa de trabalho por peneira (curva de projeto ± tolerância; opcionalmente limitada pela faixa)
  // =====================================================================================
  // o: {cols, proj, fx, limitarFaixa, grupo, secao, secFaixa, tabelaK, refs, nome, rot}
  G4.avaliarGran = function (o) {
    var fx = o.fx, proj = o.proj || {}, linhas = [], pen = [];
    if (!fx) return { linhas: [], pen: [], temProj: false };
    var temProj = fx.peneiras.some(function (p) { return ok(num(proj[G.chavePen(p.mm)])); });
    var foraProj = [];
    fx.peneiras.forEach(function (p) {
      var k = G.chavePen(p.mm), pj = num(proj[k]), tol = tolDe(fx, p.mm), mn, mx;
      if (ok(pj) && (pj < p.min - 1e-9 || pj > p.max + 1e-9)) foraProj.push(p.nome + " (" + fmt(pj, 1) + "; faixa " + p.min + "–" + p.max + ")");
      if (ok(pj) && ok(tol)) { mn = pj - tol; mx = pj + tol; } else if (ok(pj)) { mn = p.min; mx = p.max; } else { mn = p.min; mx = p.max; }
      if (o.limitarFaixa || !ok(pj)) { mn = Math.max(mn, p.min); mx = Math.min(mx, p.max); }
      mn = Math.max(0, mn); mx = Math.min(100, mx);
      var pts = pontos(o.cols, k, o.rot || "amostra ");
      var l = A.avaliar({ id: (o.id || "gran") + k, grupo: o.grupo, criterio: "Peneira " + nomePen(p), secao: o.secao, unid: "%", casas: 1, pontos: pts,
        min: mn, max: mx, tabelaK: o.tabelaK, refs: o.refs,
        exigido: fmt(mn, 0) + " a " + fmt(mx, 0) + " %" + (ok(pj) ? (ok(tol) ? " (projeto " + fmt(pj, 0) + " ± " + tol + ")" : " (projeto " + fmt(pj, 0) + "; faixa)") : " (faixa " + fx.faixa + ")") });
      if (!pts.length) { l.situacao = "sem_dados"; l.motivo = "sem determinações nesta peneira"; l.motivos = [{ situacao: "sem_dados", texto: l.motivo }]; }
      linhas.push(l);
      pen.push({ mm: p.mm, nome: p.nome, proj: pj, tol: tol, min: mn, max: mx, faixa: [p.min, p.max], av: l, media: l.media });
    });
    // curva de projeto dentro da faixa da ES
    var lp = A.linha({ id: (o.id || "gran") + "Proj", grupo: o.grupo, criterio: "Curva granulométrica de projeto dentro da faixa " + fx.faixa, secao: o.secFaixa || "",
      exigido: "faixa " + fx.faixa + " da " + fx.codigo, resultado: temProj ? (foraProj.length ? foraProj.length + " peneira(s) fora" : "dentro da faixa") : "—" });
    lp.semMedia = true; lp.txtEstat = "—";
    if (!temProj) A.marcar(lp, "ressalva", "curva de projeto não informada — a faixa de trabalho foi tomada como a própria faixa " + fx.faixa);
    else if (foraProj.length) A.marcar(lp, "nao_conforme", "curva de projeto fora da faixa: " + foraProj.join("; "));
    else lp.motivo = "curva de projeto dentro da faixa " + fx.faixa;
    linhas.unshift(lp);
    // peneira sem determinação (ex.: 3/8" num ensaio da série miúda) não deixa o lote pendente se as demais têm dados
    var comDados = linhas.filter(function (l) { return l.n; }).length;
    if (comDados) linhas.forEach(function (l) {
      if (l.situacao === "sem_dados" && l !== lp) { l.situacao = "informativo"; l.motivo = "peneira não ensaiada nas amostras do lote"; l.motivos = []; }
    });
    return { linhas: linhas, pen: pen, temProj: temProj, fx: fx };
  };
  // retido entre peneiras consecutivas ≥ mín. (5.2 c da DNIT 153; 5.2.2 da DNER-ES 390), na curva de projeto
  G4.retidoConsecutivas = function (fx, proj, minimo) {
    var falhas = [], pts = fx.peneiras.map(function (p) { return { p: p, v: num(proj[G.chavePen(p.mm)]) }; }).filter(function (x) { return ok(x.v); });
    for (var i = 1; i < pts.length; i++) {
      var r = pts[i - 1].v - pts[i].v;
      if (r < minimo - 1e-9) falhas.push(pts[i - 1].p.nome + " → " + pts[i].p.nome + ": " + fmt(r, 1) + " %");
    }
    return { n: pts.length, falhas: falhas };
  };
  // gráfico da granulometria (média das amostras com a faixa de trabalho)
  G4.graficoGran = function (res, cols, opt, titulo) {
    if (!res || !res.fx) return null;
    var amostras = (cols || []).map(function (c) {
      var pen = res.fx.peneiras.map(function (p) { return { mm: p.mm, pass: num(c[G.chavePen(p.mm)]) }; }).filter(function (x) { return ok(x.pass); });
      return pen.length >= 2 ? { pen: pen } : null;
    }).filter(Boolean);
    if (!amostras.length) return null;
    var med = res.pen.filter(function (g) { return ok(g.media); }).map(function (g) {
      return { mm: g.mm, pass: g.media, lim: { min: g.min, max: g.max }, dentro: g.media >= g.min - 1e-9 && g.media <= g.max + 1e-9 };
    });
    var svg = G.grafico({ amostras: amostras, resultados: { media: med } }, opt);
    var cor = opt && opt.imprimir ? "#222" : "var(--text-dim)";
    return titulo ? svg.replace("</svg>", '<text x="56" y="28" fill="' + cor + '" font-weight="bold" font-size="11">' + esc(titulo) + "</text></svg>") : svg;
  };

  // =====================================================================================
  // montagem da ficha a partir de seções
  // =====================================================================================
  // cfg: {id, norma?, titulo, resumo, notas, secoes: [{params, tabelas(d, P), calcular(ctx)}], params, padrao, tabelaK, nMin,
  //       refs, textos, providencias, exemplos, cartoes(ctx) -> [[valor, rótulo]], parametrosRelatorio}
  // ctx: {d, P, L, J (jornadas), linhas, freqs, avisos, graf: [fn(opt)], blocos: [{titulo, html(relat)}], tab: {}, cfg}
  G4.montar = function (cfg) {
    var secs = cfg.secoes || [];
    var params = A.paramsLote({ largura: true }).concat([
      { k: "jornadas", r: "Jornadas de 8 h de trabalho no lote", ph: "1", dica: "frequências \"por jornada\" da ES" }]).concat(cfg.params || []);
    secs.forEach(function (s) { params = params.concat(s.params || []); });
    function tabelas(d) {
      var P = d.params || {}, T = [];
      secs.forEach(function (s) { if (s.tabelas) T = T.concat(s.tabelas(d, P) || []); });
      return T;
    }
    function calcular(d) {
      var P = d.params || {}, L = A.lote(P);
      var ctx = { d: d, P: P, L: L, J: nInt(P.jornadas, 1), linhas: [], freqs: [], avisos: [], graf: [], blocos: [], cartoes: [], tab: {}, cfg: cfg };
      if (!ok(L.ext)) ctx.avisos.push("Informe as estacas inicial e final (ou a extensão) do lote: as frequências dependem da extensão e da área.");
      else if (!ok(L.area)) ctx.avisos.push("Informe a largura executada: algumas frequências dependem da área do lote.");
      secs.forEach(function (s) { if (s.calcular) s.calcular(ctx); });
      if (cfg.extra) cfg.extra(ctx);
      // pontos fora das estacas do lote
      if (ok(L.ini) && ok(L.fim)) {
        ctx.linhas.forEach(function (l) {
          var fora = (l.pontos || []).filter(function (p) { return ok(p.x) && (p.x < L.ini - 1e-6 || p.x > L.fim + 1e-6); });
          if (fora.length && !l.naoAvisarEstaca) ctx.avisos.push(l.criterio + ": " + fora.length + " determinação(ões) fora das estacas do lote (" + fora.map(function (p) { return p.est; }).join("; ") + ").");
        });
      }
      ctx.freqs.forEach(function (f) { if (f.situacao === "insuficiente") ctx.avisos.push("Frequência: " + f.ensaio + " — " + f.realizado + " de " + f.exigido + " exigida(s) (" + f.regra + ")."); });
      var nm = cfg.nMin || (cfg.tabelaK || A.K_DNIT)[0][0];
      var indiv = ctx.linhas.filter(function (l) { return (l.situacao === "conforme" || l.situacao === "ressalva") && /^valores individuais \(n </.test(l.regra || ""); })
        .map(function (l) { return /^Peneira /.test(l.criterio) && l.grupo ? l.grupo.replace(/ \(.*\)$/, "") + " (peneiras)" : l.criterio; })
        .filter(function (t, i, arr) { return arr.indexOf(t) === i; });
      var par = A.parecer(ctx.linhas, ctx.freqs, { textos: cfg.textos, providencias: cfg.providencias,
        nota: indiv.length ? "Avaliados por valor individual (n < " + nm + ", fora da tabela de k): " + indiv.join("; ") + "." : "" });
      return { tab: ctx.tab, resultados: { lote: L, J: ctx.J, linhas: ctx.linhas, freqs: ctx.freqs, parecer: par, blocos: ctx.blocos, graf: ctx.graf,
        cartoes: ctx.cartoes, conforme: par.parecer === "ACEITO" || par.parecer === "RESSALVA" }, avisos: ctx.avisos };
    }
    function cartoes(r) {
      var L = r.lote;
      return '<div class="fe-res">' + A.cartao(ok(L.ext) ? fmt(L.ext, 0) + " m" : "—", "Extensão do lote" + (ok(L.ini) && ok(L.fim) ? " (est. " + A.fmtEstaca(L.ini) + " a " + A.fmtEstaca(L.fim) + ")" : "")) +
        A.cartao(ok(L.area) ? fmt(L.area, 0) + " m²" : "—", "Área (extensão × largura)") + A.cartao(String(r.J), "Jornada(s) de 8 h") +
        r.cartoes.map(function (c) { return A.cartao(c[0], c[1]); }).join("") + "</div>";
    }
    function blocosHtml(r, relat) {
      return r.blocos.map(function (b) { var h = b.html(relat); return h ? (relat ? "<h2>" + esc(b.titulo) + "</h2>" : '<h4 style="margin:12px 0 4px">' + esc(b.titulo) + "</h4>") + h : ""; }).join("");
    }
    function resultadosHtml(calc) {
      var r = calc.resultados;
      return A.htmlParecer(r.parecer) + cartoes(r) + '<h4 style="margin:12px 0 4px">Critérios de aceitação</h4>' + A.htmlCriterios(r.linhas, { estilo: "estatistico" }) +
        (r.freqs.length ? '<h4 style="margin:12px 0 4px">Frequência dos ensaios e determinações</h4>' + A.htmlFrequencia(r.freqs) : "") + blocosHtml(r, false);
    }
    function graficos(calc, d, opt) {
      var r = calc.resultados, out = [];
      r.linhas.forEach(function (l) { if (l.graf && l.est && l.n) { var g = A.graficoLinha(l, opt); if (g) out.push(g); } });
      r.graf.forEach(function (f) { var g = f(opt); if (g) out.push(g); });
      return out.length ? out : ['<div class="fe-graf-vazio">Os gráficos aparecem com os resultados do lote.</div>'];
    }
    var nm = cfg.nMin || (cfg.tabelaK || A.K_DNIT)[0][0];
    var F = {
      titulo: cfg.titulo, resumo: cfg.resumo, rotuloLink: cfg.rotuloLink || "Aceitação de lote", blocos: [], params: params,
      padrao: Object.assign({ jornadas: "1" }, cfg.padrao || {}), tabelas: tabelas, calcular: calcular, resultadosHtml: resultadosHtml, graficos: graficos,
      relatorio: {
        notas: (cfg.notas || "") + " Controle estatístico: X̄ − k·s ≥ mínimo e X̄ + k·s ≤ máximo, X̄ = Σxᵢ/n, s = √[Σ(xᵢ − X̄)²/(n − 1)]; k da " +
          ((cfg.refs || {}).tabela || "tabela de amostragem variável") + " (" + G4.txtK(cfg.tabelaK || A.K_DNIT) + "). Critérios adotados pela ficha: n < " + nm +
          " → cada valor individual deve atender; n não tabelado → k do n tabelado imediatamente inferior; n > 21 → k = 1,01; com a estatística atendida, valor individual fora do limite gera ressalva (corrigir o local), salvo quando a ES não o tolera. " +
          "Parecer: rejeitado se algum critério não conforme; pendente se faltar ensaio/determinação exigido; aceito com ressalva se houver ressalvas; aceito se tudo atender.",
        parametros: cfg.parametrosRelatorio,
        resultados: function (calc) {
          var r = calc.resultados, L = r.lote, rows = [["Parecer do lote", r.parecer.titulo]];
          rows.push(["Lote", (ok(L.ini) && ok(L.fim) ? "estaca " + A.fmtEstaca(L.ini) + " a " + A.fmtEstaca(L.fim) + " · " : "") + (ok(L.ext) ? fmt(L.ext, 0) + " m" : "—") +
            (ok(L.area) ? " · " + fmt(L.area, 0) + " m²" : "") + " · " + r.J + " jornada(s)"]);
          r.cartoes.forEach(function (c) { rows.push([c[1], String(c[0]).replace(/<[^>]+>/g, "")]); });
          rows.push(["Critérios", r.linhas.length + " verificados: " + ["conforme", "ressalva", "pendente", "sem_dados", "nao_conforme", "nao_exigido", "informativo"].map(function (s) {
            var n = r.linhas.filter(function (l) { return l.situacao === s; }).length;
            return n ? n + " " + A.SITUACAO[s][0] : "";
          }).filter(Boolean).join(", ")]);
          return rows;
        },
        extraHtml: function (calc) {
          var r = calc.resultados;
          return A.htmlParecer(r.parecer, { relat: true }) + "<h2>Critérios de aceitação</h2>" + A.htmlCriterios(r.linhas, { relat: true, estilo: "estatistico" }) +
            (r.freqs.length ? "<h2>Frequência dos ensaios e determinações</h2>" + A.htmlFrequencia(r.freqs, true) : "") + blocosHtml(r, true);
        },
      },
      exemplos: cfg.exemplos || [],
    };
    if (!F.relatorio.parametros) delete F.relatorio.parametros;
    if (cfg.norma) F.norma = cfg.norma;
    FE.FICHAS[cfg.id] = F;
    return F;
  };

  // =====================================================================================
  // SEÇÃO: mistura usinada — extração (teor de ligante) e granulometria do agregado extraído
  // =====================================================================================
  // o: {norma, faixaPadrao, tolTeor, secTeor, secGran, secFaixa, secFreq, limitarFaixa, retidoMin, secRetido, rotTeor,
  //     metodoTeor, avisoFonte(e) -> texto, freq(ctx) -> {exigido, regra}, tabelaK, refs}
  G4.secMistura = function (o) {
    function fxDe(P) { return G4.faixa(P.faixa) || G4.faixa(o.faixaPadrao); }
    var params = [
      { k: "faixa", r: "Faixa granulométrica de projeto (" + o.secFaixa + ")", tipo: "select", recarrega: true, opcoes: function () { return G4.opcoesFaixa(o.norma); },
        dica: "diâmetro máximo ≤ 2/3 da espessura da camada, quando houver" },
      { k: "teorProj", r: (o.rotTeor || "Teor de ligante") + " de projeto (%)", dica: "tolerância ± " + fmt(o.tolTeor, 1) + " % (" + o.secTeor + ")" },
      G4.imp("impExt", "Extrações (teor + granulometria) ou granulometrias", ["dner-me-053-94", "dnit-412-2025-me"], function (lista, P, d) {
        var fx = fxDe(P);
        A.importacao.substituir(d, "ext", lista.map(function (e) {
          var g = G4.colGran(e), i = A.importacao.ident(e);
          var col = { est: "", pos: i.local || "", reg: A.importacao.rotulo(e), teor: ok(g.teor) ? A.nstr(g.teor, 2) : "" };
          return G4.pensDaFaixa(fx, g.media, col);
        }));
      }),
    ];
    function tabelas(d, P) {
      var fx = fxDe(P);
      return [
        { chave: "proj", titulo: "Curva granulométrica de projeto — % passando (faixa " + (fx ? fx.faixa : "?") + ")", rotulo: "Curva", iniciais: 1, min: 1, fixo: true, nomes: ["Projeto"],
          dica: "faixa de trabalho = projeto ± tolerância (" + o.secFaixa + ")" + (o.limitarFaixa ? ", sem ultrapassar os limites da faixa" : ""),
          linhas: G4.linhasPen(fx, function (p) { var t = tolDe(fx, p.mm); return " — faixa " + p.min + "–" + p.max + (ok(t) ? " (± " + t + ")" : ""); }) },
        { chave: "ext", titulo: "Extrações — teor de ligante e granulometria do agregado extraído (" + o.secTeor + "; " + o.secGran + ")", rotulo: "Amostra", iniciais: 1, min: 1,
          dica: (o.metodoTeor || "") + "; uma coluna por amostra (estaca onde a mistura foi aplicada)",
          linhas: [{ k: "est", r: "Estaca", texto: true }, { k: "pos", r: "Local / caminhão / posição", texto: true }, { k: "reg", r: "Registro / origem", texto: true },
            { k: "teor", r: (o.rotTeor || "Teor de ligante") + " (extração)", u: "%" }, { grupo: "Agregado extraído — % passando" }].concat(G4.linhasPen(fx)) },
      ];
    }
    function calcular(ctx) {
      var d = ctx.d, P = ctx.P, fx = fxDe(P), tp = num(P.teorProj), R = o.refs;
      var cols = (d.ext || []).filter(function (c) { return Object.keys(c).some(function (k) { return k !== "imp" && k !== "impOrig" && !vazio(c[k]); }); });
      var pts = pontos(cols, "teor", "amostra ");
      var lt = A.avaliar({ id: "teor", grupo: "Mistura — extração", criterio: (o.rotTeor || "Teor de ligante") + " (projeto ± " + fmt(o.tolTeor, 1) + ")", secao: o.secTeor, unid: "%", casas: 2,
        pontos: pts, min: ok(tp) ? tp - o.tolTeor : NaN, max: ok(tp) ? tp + o.tolTeor : NaN, tabelaK: o.tabelaK, refs: R,
        exigido: ok(tp) ? fmt(tp - o.tolTeor, 2) + " a " + fmt(tp + o.tolTeor, 2) + " % (" + fmt(tp, 2) + " ± " + fmt(o.tolTeor, 2) + ")" : "projeto ± " + fmt(o.tolTeor, 2) + " %" });
      lt.graf = true;
      if (lt.n && !ok(tp)) A.marcar(lt, "pendente", "informe o teor de projeto");
      ctx.linhas.push(lt);
      var gr = G4.avaliarGran({ id: "ext", cols: cols, proj: (d.proj || [])[0] || {}, fx: fx, limitarFaixa: o.limitarFaixa, grupo: "Mistura — granulometria do agregado extraído (" + o.secGran + ")",
        secao: o.secGran, secFaixa: o.secFaixa, tabelaK: o.tabelaK, refs: R });
      ctx.linhas = ctx.linhas.concat(gr.linhas);
      if (o.retidoMin && fx) {
        var rc = G4.retidoConsecutivas(fx, (d.proj || [])[0] || {}, o.retidoMin);
        if (rc.n >= 2) {
          var lr = A.linha({ id: "retido", grupo: gr.linhas.length ? gr.linhas[0].grupo : "", criterio: "Fração retida entre peneiras consecutivas (curva de projeto)", secao: o.secRetido,
            exigido: "≥ " + o.retidoMin + " % do total", resultado: rc.falhas.length ? rc.falhas.length + " intervalo(s) abaixo" : "atende" });
          lr.semMedia = true; lr.txtEstat = "—";
          if (rc.falhas.length) A.marcar(lr, "ressalva", "curva de projeto com fração retida < " + o.retidoMin + " %: " + rc.falhas.join("; ") + " — rever a dosagem");
          else lr.motivo = "todas as frações retidas ≥ " + o.retidoMin + " %";
          ctx.linhas.push(lr);
        }
      }
      var fr = o.freq(ctx);
      ctx.freqs.push(A.frequencia({ ensaio: "Extração — " + (o.rotTeor || "teor de ligante").toLowerCase(), metodo: o.metodoTeor || "DNER-ME 053", regra: fr.regra, exigido: fr.exigido, realizado: lt.n }));
      var nGran = cols.filter(function (c) { return fx && fx.peneiras.some(function (p) { return ok(num(c[G.chavePen(p.mm)])); }); }).length;
      ctx.freqs.push(A.frequencia({ ensaio: "Granulometria do agregado extraído", metodo: "DNER-ME 083 → DNIT 412", regra: fr.regra, exigido: fr.exigido, realizado: nGran }));
      if (cols.some(function (c) { return /DNER-ME 053/.test(c.reg || ""); }) && o.avisoFonte) ctx.avisos.push(o.avisoFonte);
      if (ok(lt.media)) ctx.cartoes.push([fmt(lt.media, 2) + " %", (o.rotTeor || "Teor de ligante") + " médio (" + lt.n + " det.)"]);
      ctx.blocos.push({ titulo: "Granulometria por peneira — faixa de trabalho", html: function (relat) { return G4.htmlGran(gr, relat); } });
      ctx.graf.push(function (opt) { return G4.graficoGran(gr, cols, opt, "Agregado extraído — faixa de trabalho" + (fx ? " (faixa " + fx.faixa + ")" : "")); });
      ctx.gran = gr;
    }
    return { params: params, tabelas: tabelas, calcular: calcular };
  };
  G4.htmlGran = function (gr, relat) {
    if (!gr || !gr.pen.some(function (g) { return g.av.n || ok(g.proj); })) return "";
    var cls = relat ? "gr" : "fe-resumo";
    return '<table class="' + cls + '"><thead><tr><th style="text-align:left">Peneira</th><th>Faixa ' + esc(gr.fx.faixa) + "</th><th>Projeto</th><th>Faixa de trabalho</th><th>n</th><th>X̄</th><th>X̄ − ks / X̄ + ks</th><th style=\"text-align:left\">Situação</th></tr></thead><tbody>" +
      gr.pen.map(function (g) {
        var a = g.av;
        return '<tr><td style="text-align:left">' + esc(nomePen(g)) + "</td><td>" + g.faixa[0] + "–" + g.faixa[1] + "</td><td>" + (ok(g.proj) ? fmt(g.proj, 1) : "—") + "</td><td>" +
          fmt(g.min, 0) + "–" + fmt(g.max, 0) + "</td><td>" + (a.n || 0) + "</td><td>" + (ok(a.media) ? fmt(a.media, 1) : "—") + "</td><td>" +
          (ok(a.inf) ? fmt(a.inf, 1) + " / " + fmt(a.sup, 1) : "—") + '</td><td style="text-align:left">' + A.situacaoHtml(a.situacao, relat) + "</td></tr>";
      }).join("") + "</tbody></table>";
  };

  // =====================================================================================
  // SEÇÃO: valor medido com limites (VRD, viscosidade, temperatura...) — tabela própria
  // =====================================================================================
  // o: {id, grupo, criterio, secao, unid, casas, min(P), max(P), minEstrito, obrigMin, obrigMax, individual, falha, exigido(P),
  //     se(P), metodo, freq(ctx) -> {exigido, regra}, titulo, dica, rotV, importar: {k, r, de, valores(e) -> [{v, est, pos, rot}]}, graf}
  G4.secValor = function (o) {
    function aplica(P) { return !o.se || o.se(P); }
    var params = o.params || [];
    if (o.importar) params = params.concat([G4.imp(o.importar.k, o.importar.r, o.importar.de, function (lista, P, d) {
      var cols = [];
      lista.forEach(function (e) {
        o.importar.valores(e).forEach(function (x) {
          if (!ok(x.v)) return;
          cols.push({ est: x.est || "", pos: x.pos || "", reg: A.importacao.rotulo(e, x.rot), v: A.nstr(x.v, o.casas === undefined ? 1 : o.casas) });
        });
      });
      A.importacao.substituir(d, o.id, cols);
    }, { se: function (d) { return aplica(d.params || {}); } })]);
    return {
      params: params,
      tabelas: function (d, P) {
        if (!aplica(P)) return [];
        return [{ chave: o.id, titulo: o.titulo || o.criterio + " (" + o.secao + ")", rotulo: "Det.", iniciais: 1, min: 1, dica: o.dica,
          linhas: [{ k: "est", r: "Estaca", texto: true }, { k: "pos", r: o.rotPos || "Posição / local", texto: true }, { k: "reg", r: "Registro / origem", texto: true },
            { k: "v", r: o.rotV || o.criterio, u: o.unid || "" }] }];
      },
      calcular: function (ctx) {
        var P = ctx.P, ap = aplica(P);
        var mn = typeof o.min === "function" ? o.min(P, ctx) : o.min, mx = typeof o.max === "function" ? o.max(P, ctx) : o.max;
        var l = A.avaliar({ id: o.id, grupo: o.grupo, criterio: o.criterio, secao: o.secao, unid: o.unid, casas: o.casas, pontos: ap ? pontos(ctx.d[o.id], "v") : [],
          min: mn, max: mx, minEstrito: o.minEstrito, obrigMin: o.obrigMin, obrigMax: o.obrigMax, individual: o.individual, falha: o.falha,
          exigido: o.exigido ? o.exigido(P, ctx) : undefined, aplica: ap, naoAplicaPor: o.naoAplicaPor, tabelaK: ctx.cfg.tabelaK, refs: ctx.cfg.refs });
        l.graf = o.graf !== false;
        if (ap && l.n && !ok(mn) && !ok(mx)) A.marcar(l, "pendente", o.faltaLimite || "informe o valor de projeto");
        if (o.depois) o.depois(l, ctx);
        ctx.linhas.push(l);
        if (o.freq) {
          var fr = o.freq(ctx);
          ctx.freqs.push(A.frequencia({ ensaio: o.criterio, metodo: o.metodo || "—", regra: fr.regra, exigido: fr.exigido, realizado: l.n, aplica: ap }));
        }
      },
    };
  };

  // =====================================================================================
  // SEÇÃO: Marshall da mistura a frio (DNER-ME 107/94) — CPs de controle por jornada
  // =====================================================================================
  // o: {secao, secLim, estMin(P), vv: [a, b], flu: [a, b], golpes: ["75", "50"], freq(ctx), tabelaK, refs, estatEst (bool)}
  G4.secMarshall = function (o) {
    var params = [];
    if (o.golpes && o.golpes.length > 1) params.push({ k: "golpes", r: "Energia de compactação do ensaio (fixada no projeto)", tipo: "select",
      opcoes: o.golpes.map(function (g) { return [g, g + " golpes por face"]; }), dica: o.secLim });
    params.push(G4.imp("impMar", "Ensaios Marshall a frio (DNER-ME 107)", "dner-me-107-94", function (lista, P, d) {
      var cols = [];
      lista.forEach(function (e) {
        var i = A.importacao.ident(e);
        (e.resultados.teores || []).forEach(function (t) {
          cols.push({ est: "", pos: i.local || "", reg: A.importacao.rotulo(e, (ok(t.teor) ? "teor " + fmt(t.teor, 1) + " % · " : "") + t.n + " CP"),
            est_: "", estab: ok(t.est) ? A.nstr(t.est, 0) : "", flu: ok(t.flu) ? A.nstr(t.flu, 2) : "", vv: ok(t.vv) ? A.nstr(t.vv, 1) : "", ncp: String(t.n || ""),
            golpes: (e.dados.params || {}).golpes || "" });
        });
      });
      A.importacao.substituir(d, "mar", cols);
    }));
    return {
      params: params,
      tabelas: function () {
        return [{ chave: "mar", titulo: "Ensaio Marshall da mistura — média dos CPs de cada ensaio (" + o.secao + ")", rotulo: "Ensaio", iniciais: 1, min: 1,
          dica: "amostras na saída do misturador; " + o.secLim,
          linhas: [{ k: "est", r: "Estaca / data", texto: true }, { k: "pos", r: "Local / jornada", texto: true }, { k: "reg", r: "Registro / origem", texto: true },
            { k: "ncp", r: "Nº de CPs", texto: true }, { k: "golpes", r: "Golpes por face", texto: true },
            { k: "estab", r: "Estabilidade (corrigida)", u: "kgf" }, { k: "flu", r: "Fluência", u: "mm" }, { k: "vv", r: "Porcentagem de vazios", u: "%" }] }];
      },
      calcular: function (ctx) {
        var P = ctx.P, d = ctx.d, R = ctx.cfg.refs, K = ctx.cfg.tabelaK, grp = "Mistura — ensaio Marshall (" + o.secao + ")";
        var em = o.estMin(P);
        var cols = d.mar || [];
        var le = A.avaliar({ id: "estab", grupo: grp, criterio: "Estabilidade Marshall", secao: o.secLim, unid: "kgf", casas: 0, pontos: pontos(cols, "estab", "ensaio "),
          min: em, tabelaK: K, refs: R, individual: !o.estatEst });
        var lf = A.avaliar({ id: "flu", grupo: grp, criterio: "Fluência", secao: o.secLim, unid: "mm", casas: 1, pontos: pontos(cols, "flu", "ensaio "),
          min: o.flu[0], max: o.flu[1], tabelaK: K, refs: R, individual: !o.estatEst });
        var lv = A.avaliar({ id: "vv", grupo: grp, criterio: "Porcentagem de vazios", secao: o.secLim, unid: "%", casas: 1, pontos: pontos(cols, "vv", "ensaio "),
          min: o.vv[0], max: o.vv[1], tabelaK: K, refs: R, individual: !o.estatEst });
        [le, lf, lv].forEach(function (l) { l.naoAvisarEstaca = true; });
        if (!lv.n && le.n) { lv.situacao = "ressalva"; lv.motivo = "vazios não determinados (5.2: verificação das condições de vazios)"; lv.motivos = [{ situacao: "ressalva", texto: lv.motivo }]; }
        ctx.linhas.push(le, lf, lv);
        var gDif = cols.filter(function (c) { return !vazio(c.golpes) && o.golpesAtual && String(c.golpes) !== o.golpesAtual(P); });
        if (gDif.length) ctx.avisos.push("Marshall: " + gDif.length + " ensaio(s) com energia diferente da fixada (" + o.golpesAtual(P) + " golpes).");
        cols.forEach(function (c, i) { var n = num(c.ncp); if (ok(n) && n < 3) ctx.avisos.push("Marshall, ensaio " + (i + 1) + ": " + n + " CP(s); a ES pede três corpos de prova por ensaio (" + o.secao + ")."); });
        var fr = o.freq(ctx);
        ctx.freqs.push(A.frequencia({ ensaio: "Ensaio Marshall (3 CPs)", metodo: "DNER-ME 107", regra: fr.regra, exigido: fr.exigido, realizado: Math.max(le.n, lf.n) }));
      },
    };
  };

  // =====================================================================================
  // SEÇÃO: grau de compactação/compressão na pista (CPs extraídos: massa específica ÷ referência)
  // =====================================================================================
  // o: {secao, secFreq, min(P), obrigMin, exigidoTxt(P), refTxt, params, freq(ctx), estatistico}
  G4.secGC = function (o) {
    var params = [{ k: "gmbRef", r: "Massa específica aparente de referência (g/cm³)", dica: o.refTxt || "massa específica de projeto (ou dos CPs moldados no local)" }]
      .concat(o.params || []);
    params.push(G4.imp("impGC", "CPs extraídos da pista (DNIT 428)", "dnit-428-2022-me", function (lista, P, d) {
      var cols = [];
      lista.forEach(function (e) {
        var i = A.importacao.ident(e), cps = e.resultados.cps || [];
        var usados = cps.filter(function (c) { return ok(c.gmb); });
        if (!usados.length && ok(e.resultados.gmb)) usados = [{ gmb: e.resultados.gmb }];
        usados.forEach(function (c, j) {
          cols.push({ est: c.estaca || "", pos: c.posicao || c.id || i.local || "", reg: A.importacao.rotulo(e, "CP " + (j + 1)), gmb: A.nstr(c.gmb, 3), gc: "" });
        });
      });
      A.importacao.substituir(d, "gc", cols);
    }));
    return {
      params: params,
      tabelas: function () {
        return [{ chave: "gc", titulo: "Grau de compressão na pista (" + o.secao + ")", rotulo: "CP", iniciais: 1, min: 1,
          dica: "CPs extraídos por sonda rotativa em locais aleatórios; GC = massa específica do CP ÷ referência × 100 (ou digite o GC)",
          linhas: [{ k: "est", r: "Estaca", texto: true }, { k: "pos", r: "Posição (LE / eixo / LD)", texto: true }, { k: "reg", r: "Registro / origem", texto: true },
            { k: "gmb", r: "Massa específica aparente do CP", u: "g/cm³" }, { k: "gc", r: "GC digitado (opcional)", u: "%" },
            { calc: "gcc", r: "Grau de compressão (GC)", u: "%", casas: 1, destaque: true }] }];
      },
      calcular: function (ctx) {
        var P = ctx.P, ref = num(P.gmbRef), cols = ctx.d.gc || [];
        ctx.tab.gc = cols.map(function (c) { var g = num(c.gc), m = num(c.gmb); return { gcc: ok(g) ? g : ok(m) && ok(ref) && ref > 0 ? m / ref * 100 : NaN }; });
        var semRef = cols.some(function (c) { return ok(num(c.gmb)) && !ok(num(c.gc)); }) && !ok(ref);
        var mn = o.min(P);
        var l = A.avaliar({ id: "gc", grupo: "Pista — compactação", criterio: "Grau de compressão (GC)", secao: o.secao, unid: "%", casas: 1,
          pontos: pontos(cols, null, "CP ", function (c, i) { return ctx.tab.gc[i].gcc; }), min: mn, obrigMin: o.obrigMin, individual: !o.estatistico,
          exigido: o.exigidoTxt ? o.exigidoTxt(P) : undefined, tabelaK: ctx.cfg.tabelaK, refs: ctx.cfg.refs });
        l.graf = true;
        if (semRef) { A.marcar(l, "pendente", "informe a massa específica de referência para calcular o GC dos CPs"); ctx.avisos.push("Grau de compressão: informe a massa específica aparente de referência."); }
        ctx.linhas.push(l);
        var fr = o.freq(ctx);
        ctx.freqs.push(A.frequencia({ ensaio: "Grau de compressão (CPs extraídos)", metodo: "sonda rotativa + DNIT 428", regra: fr.regra, exigido: fr.exigido, realizado: l.n }));
        if (ok(l.media)) ctx.cartoes.push([fmt(l.media, 1) + " %", "GC médio (" + l.n + " CP)"]);
      },
    };
  };

  // =====================================================================================
  // SEÇÃO: controle geométrico e acabamento por estaca (espessura, alinhamento, régua)
  // =====================================================================================
  // o: {esp: {tol (fração), sec}, alin: {tol cm, sec}, regua: {max cm, sec}, titulo}
  G4.secGeo = function (o) {
    var params = [];
    if (o.esp) params.push({ k: "espProj", r: "Espessura de projeto (cm)", dica: "tolerância ± " + fmt(o.esp.tol * 100, 0) + " % (" + o.esp.sec + ")" });
    return {
      params: params,
      tabelas: function () {
        var lin = [{ k: "est", r: "Estaca", texto: true }];
        if (o.esp) lin.push({ k: "esp", r: "Espessura (" + o.esp.sec + ")", u: "cm" });
        if (o.alin) lin.push({ k: "alin", r: "Desvio de alinhamento — eixo/bordos (" + o.alin.sec + ")", u: "cm" });
        if (o.regua) lin.push({ k: "regua", r: "Régua de 3,00 m / 1,20 m — maior variação (" + o.regua.sec + ")", u: "cm" });
        return [{ chave: "geo", titulo: o.titulo || "Controle geométrico e acabamento — por estaca", rotulo: "Seção", iniciais: 1, min: 1,
          dica: "uma coluna por estaca da locação; desvio de alinhamento com sinal (+/−), o maior da seção", linhas: lin }];
      },
      calcular: function (ctx) {
        var P = ctx.P, geo = ctx.d.geo || [], K = ctx.cfg.tabelaK, R = ctx.cfg.refs, n = [];
        if (o.esp) {
          var ep = num(P.espProj);
          var le = A.avaliar({ id: "esp", grupo: "Produto — geometria e acabamento", criterio: "Espessura da camada", secao: o.esp.sec, unid: "cm", casas: 1,
            pontos: pontos(geo, "esp", "seção "), min: ok(ep) ? ep * (1 - o.esp.tol) : NaN, max: ok(ep) ? ep * (1 + o.esp.tol) : NaN, tabelaK: K, refs: R,
            exigido: ok(ep) ? fmt(ep * (1 - o.esp.tol), 1) + " a " + fmt(ep * (1 + o.esp.tol), 1) + " cm (" + fmt(ep, 1) + " ± " + fmt(o.esp.tol * 100, 0) + " %)" : "projeto ± " + fmt(o.esp.tol * 100, 0) + " %" });
          le.graf = true;
          if (le.n && !ok(ep)) A.marcar(le, "pendente", "informe a espessura de projeto");
          ctx.linhas.push(le); n.push(le.n);
          if (ok(le.media)) ctx.cartoes.push([fmt(le.media, 1) + " cm", "Espessura média (" + le.n + " seções)"]);
        }
        if (o.alin) {
          var la = A.avaliar({ id: "alin", grupo: "Produto — geometria e acabamento", criterio: "Alinhamento do eixo e bordos (desvio)", secao: o.alin.sec, unid: "cm", casas: 1,
            pontos: pontos(geo, "alin", "seção "), min: -o.alin.tol, max: o.alin.tol, individual: true, exigido: "± " + fmt(o.alin.tol, 0) + " cm" });
          ctx.linhas.push(la); n.push(la.n);
        }
        if (o.regua) {
          var lr = A.avaliar({ id: "regua", grupo: "Produto — geometria e acabamento", criterio: "Acabamento — variação sob a régua", secao: o.regua.sec, unid: "cm", casas: 1,
            pontos: pontos(geo, "regua", "seção "), max: o.regua.max, individual: true, exigido: "≤ " + fmt(o.regua.max, 1) + " cm (réguas de 3,00 m e 1,20 m)" });
          ctx.linhas.push(lr); n.push(lr.n);
        }
        var exig = ok(ctx.L.ext) ? A.nPontos(ctx.L.ext, 20) : NaN;
        ctx.freqs.push(A.frequencia({ ensaio: "Controle geométrico / acabamento (seções)", metodo: "trena, nivelamento, réguas", regra: "em cada estaca da locação (20 m)",
          exigido: exig, realizado: Math.max.apply(null, n.concat([0])) }));
      },
    };
  };

  // =====================================================================================
  // SEÇÃO: recebimento do ligante — carregamentos (DNIT 165/2013-EM, DNIT 095/2006-EM)
  // =====================================================================================
  // o: {sec, porCarg: {texto, ids: [[id ou [ids alternativos], nome]]}, por100: {sec, texto, ids}, por500: {...}, de: [fichas], tipoTxt}
  G4.secLigante = function (o) {
    function faltam(e, ids) {
      var res = e.resultados.ensaios || [];
      function feito(id) { return res.some(function (x) { return x.e.id === id && ((ok(x.valor)) || (x.texto && x.texto !== "—")); }); }
      return ids.filter(function (it) { var alt = Array.isArray(it[0]) ? it[0] : [it[0]]; return !alt.some(feito); }).map(function (it) { return it[1]; });
    }
    function sn(e, g) {
      if (!g) return "";
      if (!g.ids) return "";
      var f = faltam(e, g.ids);
      return { v: f.length ? "N" : "S", falta: f };
    }
    var params = [G4.imp("impLig", "Recebimento do ligante — carregamentos (DNIT 165-EM / 095-EM)", o.de || ["dnit-165-2013-em", "dnit-095-2006-em"], function (lista, P, d) {
      A.importacao.substituir(d, "lig", lista.map(function (e) {
        var r = e.resultados || {}, pa = e.dados.params || {};
        var a = sn(e, o.porCarg), b = sn(e, o.por100), c = sn(e, o.por500);
        var falta = [].concat(a.falta || [], b.falta || [], c.falta || []);
        return { reg: A.importacao.rotulo(e), tipo: String(r.classe || "").replace(/ — .*/, ""), massa: pa.quantidade || "",
          ensC: a.v || "", ens100: b.v || "", ens500: c.v || "",
          res: r.geral === "reprovado" ? "reprovado" : r.geral === "aprovado" ? "aprovado" : r.geral === "parcial" ? "aprovado (parcial)" : "",
          obs: falta.length ? "sem: " + falta.join(", ") : "" };
      }), { chave: ["reg"] });
    })];
    return {
      params: params,
      tabelas: function (d, P) {
        var lin = [{ k: "reg", r: "Registro / nota fiscal", texto: true }, { k: "tipo", r: "Tipo do ligante", texto: true }, { k: "massa", r: "Massa do carregamento", u: "t" },
          { k: "ensC", r: "Ensaios de todo carregamento feitos? (S/N) — " + o.porCarg.texto, texto: true }];
        if (o.por100 && (!o.por100.se || o.por100.se(P))) lin.push({ k: "ens100", r: "Ensaios a cada 100 t feitos? (S/N) — " + o.por100.texto, texto: true });
        if (o.por500) lin.push({ k: "ens500", r: "Ensaio a cada 500 t feito? (S/N) — " + o.por500.texto, texto: true });
        lin.push({ k: "res", r: "Resultado do recebimento (aprovado / reprovado)", texto: true }, { k: "obs", r: "Observação", texto: true });
        return [{ chave: "lig", titulo: "Ligante asfáltico — carregamentos recebidos (" + o.sec + ")", rotulo: "Carreg.", iniciais: 1, min: 1,
          dica: "um carregamento por coluna; resultado pela EM do ligante (" + (o.tipoTxt || "DNIT 165/2013-EM") + ")", linhas: lin }];
      },
      calcular: function (ctx) {
        var cols = (ctx.d.lig || []).filter(function (c) { return !vazio(c.reg) || !vazio(c.res) || !vazio(c.massa); });
        ctx.nCarreg = cols.length;
        var massa = cols.reduce(function (s, c) { var m = num(c.massa); return s + (ok(m) ? m : 0); }, 0);
        var semMassa = cols.filter(function (c) { return !ok(num(c.massa)); }).length;
        ctx.massaLig = massa;
        var l = A.linha({ id: "lig", grupo: "Insumos — ligante asfáltico", criterio: "Recebimento do ligante (ensaios da EM por carregamento)", secao: o.sec, exigido: "carregamentos aprovados",
          n: cols.length, resultado: cols.length ? cols.length + " carregamento(s)" + (massa ? ", " + fmt(massa, 1) + " t" : "") : "—" });
        l.semMedia = true; l.txtEstat = "—";
        var rep = cols.filter(function (c) { return /reprov|^r$|^n$/i.test(String(c.res).trim()); });
        var semRes = cols.filter(function (c) { return vazio(c.res); });
        if (!cols.length) A.marcar(l, "sem_dados", "nenhum carregamento registrado no lote");
        else {
          if (rep.length) A.marcar(l, "nao_conforme", rep.length + " carregamento(s) reprovado(s): " + rep.map(function (c) { return c.reg || "?"; }).join("; ") + " — ligante não pode ser aplicado");
          if (semRes.length) A.marcar(l, "pendente", semRes.length + " carregamento(s) sem resultado de recebimento");
          if (!rep.length && !semRes.length) l.motivo = "todos os carregamentos aprovados";
        }
        ctx.linhas.push(l);
        function conta(k) { return cols.filter(function (c) { return G4.simNao(c[k]) === true; }).length; }
        ctx.freqs.push(A.frequencia({ ensaio: "Ligante — ensaios de todo carregamento", metodo: o.porCarg.texto, regra: "1 de cada por carregamento (" + o.porCarg.sec + ")", exigido: Math.max(cols.length, 1), realizado: conta("ensC") }));
        [["por100", "ens100", 100], ["por500", "ens500", 500]].forEach(function (x) {
          var g = o[x[0]];
          if (!g || (g.se && !g.se(ctx.P))) return;
          var ex = massa > 0 ? Math.max(1, Math.ceil(massa / x[2] - 1e-9)) : cols.length ? 1 : NaN;
          ctx.freqs.push(A.frequencia({ ensaio: "Ligante — ensaios a cada " + x[2] + " t", metodo: g.texto, regra: "1 a cada " + x[2] + " t (" + g.sec + ")", exigido: ex, realizado: conta(x[1]) }));
        });
        if (semMassa && cols.length) ctx.avisos.push("Ligante: informe a massa (t) de " + semMassa + " carregamento(s) para calcular as frequências por tonelada.");
      },
    };
  };

  // =====================================================================================
  // SEÇÃO: agregados — ensaios de controle (EA, adesividade, LA, durabilidade, índice de forma, granulometria)
  // =====================================================================================
  // o: {sec, itens: [{k: "ea"|"ades"|"la"|"dur"|"if"|"gran", nome, secao, min, max, minEstrito, desempenho (LA), freq: {por:
  //     "jornada"|"mes"|"volume"|"carregamento"|"caract", n, a_cada, texto, sec}, metodo}]}
  var AGR_IMP = {
    "dnit-450-2024-me": function (r) { return { ea: ok(r.ea) ? String(r.ea) : "" }; },
    "dnit-452-2024-me": function (r) { return { ades: r.status === "sat" ? "S" : r.status === "satDope" ? "S (com melhorador " + fmt(r.teor, 2) + " %)" : r.status === "nao" ? "N" : "" }; },
    "dnit-451-2024-me": function (r) { return { la: ok(r.A) ? String(Math.round(r.A)) : "" }; },
    "dnit-412-2025-me": function () { return { gran: "1" }; },
  };
  G4.secAgregados = function (o) {
    var ks = o.itens.map(function (it) { return it.k; });
    var de = Object.keys(AGR_IMP).filter(function (f) {
      return (f === "dnit-450-2024-me" && ks.indexOf("ea") >= 0) || (f === "dnit-452-2024-me" && ks.indexOf("ades") >= 0) ||
        (f === "dnit-451-2024-me" && ks.indexOf("la") >= 0) || (f === "dnit-412-2025-me" && ks.indexOf("gran") >= 0);
    });
    var params = [];
    if (o.itens.some(function (it) { return it.freq && it.freq.por === "mes"; })) params.push({ k: "meses", r: "Meses de serviço abrangidos pelo lote", ph: "1", dica: "ensaios \"por mês\" da ES" });
    if (o.itens.some(function (it) { return it.freq && it.freq.por === "volume"; })) params.push({ k: "volAgr", r: "Volume de agregado empregado no lote (m³)", dica: "índice de forma a cada 900 m³" });
    if (o.itens.some(function (it) { return it.k === "gran"; }) && o.nAgreg) params.push({ k: "nAgreg", r: o.nAgreg, ph: "1" });
    if (o.itens.some(function (it) { return it.k === "la"; })) params.push({ k: "laDesemp", r: "Agregado com LA > 40 % e desempenho anterior satisfatório comprovado?", tipo: "select",
      opcoes: [["nao", "Não"], ["sim", "Sim — admite-se desgaste maior (anexar a comprovação)"]] });
    params.push(G4.imp("impAgr", "Agregados — EA, adesividade, Los Angeles, granulometria", de, function (lista, P, d) {
      var itens = lista.map(function (e) {
        var i = A.importacao.ident(e), c = { reg: A.importacao.rotulo(e), data: A.dataBR(i.data) };
        Object.assign(c, AGR_IMP[e.ficha](e.resultados || {}));
        return { chave: i.registro || "", cod: A.codigoCurto(e.ficha), col: c };
      });
      A.importacao.substituir(d, "agr", A.importacao.juntarPorRegistro(itens), { chave: ["reg"] });
    }));
    var ROT = { gran: ["Granulometria dos agregados — nº de ensaios", "nº"], ea: ["Equivalente de areia", "%"], ades: ["Adesividade (% ou S/N)", ""], la: ["Desgaste Los Angeles", "%"],
      dur: ["Durabilidade — perda (sulfato)", "%"], if: ["Índice de forma", ""] };
    return {
      params: params,
      tabelas: function () {
        return [{ chave: "agr", titulo: "Agregados — ensaios de controle (" + o.sec + ")", rotulo: "Amostra", iniciais: 1, min: 1,
          dica: "uma coluna por amostra/jornada; adesividade em % (DNER-ME 059) ou S/N (satisfatória, DNER-ME 078/079 → DNIT 452)",
          linhas: [{ k: "reg", r: "Registro / origem", texto: true }, { k: "data", r: "Data / jornada", texto: true }].concat(o.itens.map(function (it) {
            return { k: it.k, r: (it.nome || ROT[it.k][0]) + " (" + it.secao + ")", u: ROT[it.k][1], texto: it.k === "ades" };
          })) }];
      },
      calcular: function (ctx) {
        var P = ctx.P, cols = ctx.d.agr || [];
        o.itens.forEach(function (it) {
          var grp = "Insumos — agregados", l;
          if (it.k === "gran") {
            var nG = cols.reduce(function (s, c) { var v = num(c.gran); return s + (ok(v) ? v : 0); }, 0);
            var mult = o.nAgreg ? nInt(P.nAgreg, 1) : 1;
            ctx.freqs.push(A.frequencia({ ensaio: it.nome || ROT.gran[0].replace(" — nº de ensaios", ""), metodo: it.metodo || "DNER-ME 083 → DNIT 412",
              regra: it.freq.texto + " (" + it.secao + ")", exigido: it.freq.n * ctx.J * mult, realizado: nG }));
            return;
          }
          if (it.k === "ades") {
            var num_ = [], qual = [];
            cols.forEach(function (c, i) {
              var t = String(c.ades === undefined ? "" : c.ades).trim();
              if (!t) return;
              var v = num(t);
              if (ok(v) && !/^s|^n/i.test(t)) num_.push({ v: v, rot: c.reg || "amostra " + (i + 1) });
              else qual.push({ ok: /^s/i.test(t) ? true : /^n/i.test(t) ? false : null, t: t, rot: c.reg || "amostra " + (i + 1) });
            });
            l = A.avaliar({ id: "ades", grupo: grp, criterio: it.nome || "Adesividade", secao: it.secao, unid: "%", casas: 0, pontos: num_, min: it.min, minEstrito: true, individual: true,
              exigido: it.exigido || "> " + it.min + " % (ou satisfatória)" });
            if (qual.length) {
              l.n += qual.length;
              var nsat = qual.filter(function (q) { return q.ok === false; }), ind = qual.filter(function (q) { return q.ok === null; });
              if (l.situacao === "sem_dados") { l.situacao = "conforme"; l.motivo = ""; l.motivos = []; }
              l.resultado = (num_.length ? l.resultado + "; " : "") + qual.map(function (q) { return q.t; }).join("; ");
              if (nsat.length) A.marcar(l, "nao_conforme", "adesividade não satisfatória: " + nsat.map(function (q) { return q.rot; }).join("; ") + " — usar melhorador de adesividade");
              if (ind.length) A.marcar(l, "pendente", "resultado não reconhecido: " + ind.map(function (q) { return q.t; }).join("; "));
              if (!nsat.length && !ind.length && l.situacao === "conforme") l.motivo = "adesividade satisfatória" + (num_.length ? " e > " + it.min + " %" : "");
              if (qual.some(function (q) { return /melhorador/i.test(q.t); })) A.marcar(l, "ressalva", "satisfatória só com melhorador de adesividade — empregar na quantidade fixada no projeto");
            }
          } else {
            l = A.avaliar({ id: it.k, grupo: grp, criterio: it.nome || ROT[it.k][0], secao: it.secao, unid: ROT[it.k][1] || "", casas: it.k === "if" ? 2 : 0,
              pontos: cols.map(function (c, i) { return { v: num(c[it.k]), rot: c.reg || "amostra " + (i + 1) }; }).filter(function (p) { return ok(p.v); }),
              min: it.min, max: it.max, minEstrito: it.minEstrito, individual: true, exigido: it.exigido });
            if (it.k === "la" && l.situacao === "nao_conforme" && P.laDesemp === "sim") {
              l.situacao = "ressalva"; l.motivos = [{ situacao: "ressalva", texto: "LA acima de " + it.max + " %, admitido por desempenho anterior satisfatório (" + it.secao + ") — anexar a comprovação" }];
              l.motivo = l.motivos[0].texto;
            }
          }
          l.naoAvisarEstaca = true;
          var fq = it.freq || { por: "caract" };
          if (fq.por === "caract" && !l.n) { l.situacao = "informativo"; l.motivo = "requisito do material (" + it.secao + "): sem frequência fixada na ES — anexar o ensaio de caracterização"; l.motivos = []; }
          ctx.linhas.push(l);
          if (fq.por === "caract") return;
          var ex = fq.por === "jornada" ? fq.n * ctx.J : fq.por === "mes" ? fq.n * nInt(P.meses, 1) : fq.por === "carregamento" ? Math.max(1, ctx.nCarreg || 0) * fq.n :
            fq.por === "volume" ? (ok(num(P.volAgr)) ? A.nMin(num(P.volAgr), fq.a_cada) : 1) : fq.n;
          ctx.freqs.push(A.frequencia({ ensaio: it.nome || ROT[it.k][0].replace(/ \(.*\)$/, ""), metodo: it.metodo || "—", regra: fq.texto + " (" + (fq.sec || it.secao) + ")", exigido: ex, realizado: l.n }));
        });
      },
    };
  };

  // =====================================================================================
  // SEÇÃO: verificações S/N (condições gerais, calibração, acabamento visual...)
  // =====================================================================================
  // itens: [{id, texto, secao, falha ("nao_conforme"|"ressalva"), se(P), exigido}]
  G4.secVerif = function (itens) {
    function ativos(P) { return itens.filter(function (it) { return !it.se || it.se(P); }); }
    return {
      tabelas: function (d, P) {
        var at = ativos(P);
        if (Array.isArray(d.verif)) while (d.verif.length < itens.length) d.verif.push({});
        return [{ chave: "verif", titulo: "Verificações e inspeções", rotulo: "Item", iniciais: itens.length, min: itens.length, fixo: true,
          nomes: itens.map(function (it) { return it.texto + " (" + it.secao + ")" + (at.indexOf(it) >= 0 ? "" : " — não se aplica"); }),
          dica: "\"S\" (atende) ou \"N\" (não atende) em cada item; vazio = não verificado",
          linhas: [{ k: "atende", r: "Atende? (S / N)", texto: true }, { k: "obs", r: "Observação", texto: true }] }];
      },
      calcular: function (ctx) {
        var P = ctx.P;
        itens.forEach(function (it, i) {
          var c = (ctx.d.verif || [])[i] || {}, sn = G4.simNao(c.atende);
          var l = A.linha({ id: "v_" + it.id, grupo: "Verificações", criterio: it.texto, secao: it.secao, exigido: it.exigido || "atende",
            resultado: sn === true ? "atende" : sn === false ? "não atende" : "—" + (c.obs ? " — " + c.obs : ""), n: sn === null ? 0 : 1 });
          l.semMedia = true; l.txtEstat = "—";
          if (it.se && !it.se(P)) { l.situacao = "nao_exigido"; l.motivo = it.naoAplicaPor || "não se aplica"; }
          else if (sn === null) A.marcar(l, "pendente", "não verificado");
          else if (sn === false) A.marcar(l, it.falha || "nao_conforme", "não atende" + (c.obs ? " — " + c.obs : ""));
          else l.motivo = c.obs || "";
          ctx.linhas.push(l);
        });
      },
    };
  };

  // =====================================================================================
  // DNIT 150/2010-ES — Lama asfáltica
  // =====================================================================================
  var ID = "dnit-150-2010-es";
  var REFS = { reprova: "7.5 b", atende: "7.5 a", corrige: "7.5", regra: "7.5", tabela: "DNER-PRO 277/97 (citada em 7.4)" };
  // Tabela 2: taxa de aplicação da lama (kg/m²) por faixa
  var TAXA = { "dnit-150-2010-es-I": [4, 6], "dnit-150-2010-es-II": [2, 5], "dnit-150-2010-es-III": [5, 8] };
  function freqSeg(ctx) {
    var ar = ctx.L.area, seg = ok(ar) ? Math.max(1, Math.ceil(ar / 3000 - 1e-9)) : 1;
    return { exigido: 5 * seg, regra: "mín. 5 por segmento de área < 3.000 m² (7.2.4)" + (seg > 1 ? " × " + seg + " segmentos" : "") };
  }
  var secoes = [
    G4.secMistura({ norma: ID, faixaPadrao: "dnit-150-2010-es-II", tolTeor: 0.3, secTeor: "7.2.2", secGran: "7.2.3", secFaixa: "5.1.5 c; Tabela 2",
      rotTeor: "Teor de ligante", metodoTeor: "extração Soxhlet (ASTM D 2172)", tabelaK: G4.K_277, refs: REFS, freq: freqSeg,
      avisoFonte: "Teor de ligante por extração centrífuga (DNER-ME 053): a ES manda extrair com o aparelho Soxhlet (ASTM D 2172, 7.2.2) — confirme a equivalência com a Fiscalização." }),
    G4.secValor({ id: "vrd", grupo: "Produto — segurança", criterio: "Valor de resistência à derrapagem (VRD)", secao: "7.3.3", unid: "", casas: 0, min: 55, minEstrito: true,
      exigido: function () { return "> 55 (pêndulo britânico)"; }, metodo: "ASTM E 303", titulo: "Resistência à derrapagem — pêndulo britânico (7.3.3)",
      dica: "locais aleatórios, 1 a cada 200 m de pista", rotV: "VRD", se: function (P) { return P.rolamento !== "nao"; },
      naoAplicaPor: "lama asfáltica não empregada como camada final de rolamento",
      freq: function (ctx) { return { exigido: ok(ctx.L.ext) ? A.nMin(ctx.L.ext, 200) : 1, regra: "1 a cada 200 m de pista (7.3.3)" }; } }),
    G4.secGeo({ alin: { tol: 5, sec: "7.3.2" } }),
    G4.secLigante({ sec: "7.1.1", porCarg: { texto: "viscosidade SF, resíduo por evaporação, peneiramento, carga da partícula", sec: "7.1.1",
      ids: [[["sf25", "sf50"], "viscosidade SF"], ["residuo", "resíduo"], ["pen084", "peneiramento"], ["carga", "carga da partícula"]] },
      por100: { texto: "sedimentação", sec: "7.1.1", ids: [["sed", "sedimentação"]] }, de: ["dnit-165-2013-em"] }),
    G4.secAgregados({ sec: "5.1.4; 7.1.2", nAgreg: "Número de agregados (granulometria de cada agregado, 7.1.2)", itens: [
      { k: "gran", secao: "7.1.2", freq: { texto: "2 de cada agregado por jornada", n: 2 } },
      { k: "ades", secao: "5.1.4 a; 7.1.2", min: 90, metodo: "DNER-ME 059", freq: { por: "jornada", n: 1, texto: "1 por jornada" } },
      { k: "ea", secao: "5.1.4 a; 7.1.2", min: 55, metodo: "DNER-ME 054 → DNIT 450", freq: { por: "jornada", n: 1, texto: "1 por jornada" } },
      { k: "la", secao: "5.1.4 a", max: 40, metodo: "DNER-ME 035 → DNIT 451", freq: { por: "caract" } },
      { k: "dur", secao: "5.1.4 a", max: 12, exigido: "< 12 %", metodo: "DNER-ME 089", freq: { por: "caract" } },
    ] }),
    G4.secVerif([
      { id: "clima", texto: "Execução sem chuva e sem excesso de umidade na superfície", secao: "4 b" },
      { id: "cert", texto: "Certificado de análise do ligante em todo carregamento", secao: "4 c" },
      { id: "calib", texto: "Equipamento calibrado em segmentos experimentais (consistência, projeto, quantidade e velocidade)", secao: "7.2.1" },
      { id: "ajuste", texto: "Ajuste de dosagem nas condições de campo antes do início do serviço", secao: "5.1.5 b" },
      { id: "acab", texto: "Superfície desempenada, com aspecto e textura do segmento experimental (inspeção visual)", secao: "7.3.1" },
      { id: "falhas", texto: "Falhas de execução (escassez/excesso, emendas) corrigidas logo após a execução", secao: "5.3.2", falha: "ressalva" },
    ]),
  ];
  var F = G4.montar({
    id: ID, titulo: "Lama asfáltica — aceitação de lote", tabelaK: G4.K_277, refs: REFS,
    resumo: "Reúne as extrações (teor de ligante ± 0,30 % e granulometria na faixa de trabalho), o VRD, os alinhamentos, o recebimento do ligante e o controle dos agregados; confere a frequência (7.1, 7.2.4, 7.3) e aplica o controle estatístico da 7.5.",
    params: [
      { k: "rolamento", r: "Lama empregada como camada final de rolamento? (7.3.3)", tipo: "select", recarrega: true,
        opcoes: [["sim", "Sim — VRD > 55 exigido"], ["nao", "Não — selagem/impermeabilização sob outra camada"]] },
      { k: "taxaLama", r: "Taxa média de aplicação da lama no lote (kg/m²) — opcional", dica: "Tabela 2: faixa I 4–6, II 2–5, III 5–8 kg/m²" },
    ],
    padrao: { faixa: "dnit-150-2010-es-II", rolamento: "sim", nAgreg: "1", laDesemp: "nao" },
    secoes: secoes,
    extra: function (ctx) {
      var P = ctx.P, tx = num(P.taxaLama), f = TAXA[P.faixa || "dnit-150-2010-es-II"];
      if (ok(tx) && f) {
        var l = A.avaliar({ id: "taxa", grupo: "Mistura — extração", criterio: "Taxa de aplicação da lama (média do lote)", secao: "Tabela 2", unid: "kg/m²", casas: 1,
          pontos: [{ v: tx, rot: "média do lote" }], min: f[0], max: f[1], individual: true, falha: "ressalva" });
        l.naoAvisarEstaca = true;
        if (l.situacao === "ressalva") l.motivos[0].texto = l.motivo = "taxa média fora da faixa recomendada pela Tabela 2 — verificar a calibração (7.2.1 c)";
        ctx.linhas.push(l);
      }
    },
    notas: "Critérios da DNIT 150/2010-ES: teor de ligante por extração (7.2.2, projeto ± 0,30 %), granulometria do agregado extraído na faixa de trabalho = projeto ± tolerâncias da Tabela 2 (7.2.3), com a curva de projeto dentro da faixa I, II ou III (5.1.5 c); mínimo de 5 determinações por segmento de área < 3.000 m² (7.2.4; lotes maiores: 5 por fração de 3.000 m², adotado); VRD > 55 a cada 200 m (7.3.3); alinhamentos ± 5 cm (7.3.2); ligante: SF, resíduo, peneiramento e carga por carregamento e sedimentação a cada 100 t (7.1.1); agregados por jornada: 2 granulometrias de cada agregado, adesividade (> 90 %) e equivalente de areia (≥ 55 %) (7.1.2, 5.1.4). A ES diz \"k tabelado\" sem trazer a tabela: usada a Tabela 1 da DNER-PRO 277/97, citada em 7.4.",
    textos: { REJEITADO: { titulo: "LOTE REJEITADO", texto: "Há critério não conforme (7.5 b). Todo detalhe incorreto ou mal executado deve ser corrigido; o serviço corrigido só é aceito se as correções o colocarem em conformidade (7.5)." } },
  });

  // =====================================================================================
  // Exemplos
  // =====================================================================================
  function importa(d, k, refs) { A.exemplos.importar(F.params, d, k, refs); }
  function colExt(est, teor, pens, reg) {
    var keys = ["r4_8", "r2_4", "r1_2", "r0_6", "r0_3", "r0_15", "r0_074"], c = { est: est, pos: "LD", reg: reg, teor: teor };
    pens.forEach(function (v, i) { c[keys[i]] = A.nstr(v, 1); });
    return c;
  }
  function geo(ini, vals) { return vals.map(function (v, i) { return { est: String(ini + i), alin: A.nstr(v, 1) }; }); }
  F.exemplos = [
    { nome: "Lote aceito — lama faixa II, 600 m × 3,5 m (ligante, EA e adesividade importados dos exemplos ME)", dados: function () {
      var d = { ident: { registro: "LOTE-LA-001", data: "2026-09-10", obra: "Obra A — BR-000", trecho: "Pista direita", local: "Est. 100 a 130", camada: "Lama asfáltica — faixa II (RL-1C)" },
        params: Object.assign({}, F.padrao, { estIni: "100", estFim: "130", largura: "3,50", jornadas: "2", teorProj: "8,20", taxaLama: "3,8" }),
        proj: [{ r4_8: "100", r2_4: "95", r1_2: "78", r0_6: "52", r0_3: "34", r0_15: "22", r0_074: "15" }],
        ext: [
          colExt("102", "8,32", [100, 94.1, 77.2, 51.5, 33.4, 21.6, 14.8], "EXT-L-01 · Soxhlet"), colExt("106", "8,05", [100, 96.2, 79.4, 53.0, 35.1, 22.4, 15.6], "EXT-L-02 · Soxhlet"),
          colExt("111", "8,21", [100, 95.3, 77.9, 52.4, 34.2, 21.9, 14.6], "EXT-L-03 · Soxhlet"), colExt("115", "8,14", [100, 94.8, 78.6, 51.1, 33.8, 22.7, 15.3], "EXT-L-04 · Soxhlet"),
          colExt("119", "8,27", [100, 95.6, 77.5, 52.8, 34.6, 21.4, 14.9], "EXT-L-05 · Soxhlet"), colExt("124", "8,18", [100, 94.5, 78.1, 51.9, 33.9, 22.1, 15.2], "EXT-L-06 · Soxhlet"),
          colExt("128", "8,25", [100, 95.9, 78.8, 52.6, 34.9, 22.5, 15.4], "EXT-L-07 · Soxhlet")],
        vrd: [{ est: "103", reg: "VRD-01", v: "62" }, { est: "112", reg: "VRD-02", v: "59" }, { est: "121", reg: "VRD-03", v: "64" }],
        geo: geo(100, [1.2, -0.8, 2.1, 0.5, -1.6, 1.8, -2.4, 0.9, 1.1, -0.6, 2.8, -1.9, 0.4, 1.5, -1.2, 0.7, -2.2, 1.9, 0.3, -1.4, 2.5, -0.9, 1.6, -0.5, 0.8, -1.8, 2.0, 1.3, -0.7, 0.6, -1.1]),
        verif: [{ atende: "S" }, { atende: "S" }, { atende: "S", obs: "segmento experimental de 100 m" }, { atende: "S" }, { atende: "S" }, { atende: "S" }],
        obs: "Exemplo: teor e granulometria de sete extrações Soxhlet digitadas; carregamento de ligante, EA e adesividade importados dos exemplos das fichas ME (DNIT 165, 450 e 452)." };
      importa(d, "impLig", [["dnit-165-2013-em", 2]]);
      d.lig[0].tipo = "LA-1C"; d.lig[0].obs = "exemplo RR-1C da ficha 165 usado como carregamento do lote";
      importa(d, "impAgr", [["dnit-450-2024-me", 0], ["dnit-452-2024-me", 0]]);
      d.agr = d.agr.concat([{ reg: "GR-J1 · DNIT 412", data: "10/09/2026", gran: "2", ea: "72", ades: "95" }, { reg: "GR-J2 · DNIT 412", data: "11/09/2026", gran: "2" }]);
      return d;
    } },
    { nome: "Lote rejeitado — teor de ligante e nº 200 fora da faixa de trabalho, VRD baixo, frequência incompleta", dados: function () {
      var d = { ident: { registro: "LOTE-LA-002", data: "2026-09-15", obra: "Obra B — BR-000", trecho: "Pista esquerda", local: "Est. 40 a 70", camada: "Lama asfáltica — faixa II" },
        params: Object.assign({}, F.padrao, { estIni: "40", estFim: "70", largura: "3,50", jornadas: "2", teorProj: "8,20", taxaLama: "5,6" }),
        proj: [{ r4_8: "100", r2_4: "95", r1_2: "78", r0_6: "52", r0_3: "34", r0_15: "22", r0_074: "15" }],
        ext: [
          colExt("42", "8,48", [100, 94.0, 76.8, 51.2, 33.0, 21.2, 16.4], "EXT-L-11 · Soxhlet"), colExt("47", "7,86", [100, 96.4, 79.8, 53.6, 35.6, 23.1, 17.2], "EXT-L-12 · Soxhlet"),
          colExt("53", "8,55", [100, 95.1, 78.2, 52.2, 34.0, 22.6, 16.8], "EXT-L-13 · Soxhlet"), colExt("58", "7,94", [100, 94.6, 77.4, 51.0, 33.2, 21.8, 17.5], "EXT-L-14 · Soxhlet"),
          colExt("64", "8,41", [100, 95.8, 78.9, 52.9, 34.8, 22.2, 16.1], "EXT-L-15 · Soxhlet")],
        vrd: [{ est: "45", reg: "VRD-11", v: "58" }, { est: "56", reg: "VRD-12", v: "52" }],
        geo: geo(40, [1.2, -0.8, 2.1, 0.5, -1.6, 6.2, -2.4, 0.9, 1.1, -0.6, 2.8, -1.9, 0.4, 1.5, -1.2]),
        verif: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "N", obs: "excesso de massa e emendas irregulares entre as est. 50 e 52" }, { atende: "S" }],
        obs: "Exemplo de reprovação: teor de ligante com X̄ ± ks fora de 7,90–8,50 %, passante na nº 200 acima da faixa de trabalho, VRD de 52, desvio de alinhamento de 6,2 cm, geometria só até a est. 54, carregamento de ligante reprovado (exemplo da ficha 165) e adesividade não satisfatória (exemplo da ficha 452)." };
      importa(d, "impLig", [["dnit-165-2013-em", 0]]);
      importa(d, "impAgr", [["dnit-450-2024-me", 1], ["dnit-452-2024-me", 2]]);
      d.agr.push({ reg: "GR-J3 · DNIT 412", data: "15/09/2026", gran: "2" });
      return d;
    } },
  ];
})();
