/*
 * FE.aceitacaoG2 — construtor comum das fichas de ACEITAÇÃO DE LOTE das camadas tratadas com cimento/cal e das
 * reciclagens (grupo 2): DNIT 140/2022, 142/2022, 143/2025, 420/2019, 421/2019, 167/2013, 166/2013 e 169/2014-ES.
 * Fica neste arquivo (o primeiro do grupo no index.html) e é usado pelos outros sete.
 *
 *   var G2 = FE.aceitacaoG2;
 *   G2.criar({ id, codigo, titulo, resumo, refs, tabelaK, tabelaTxt, porFaixa, params, padrao, grupos: [...],
 *              verificacoes: [...], textos, notas, exemplos })
 *
 * Grupos (cada um vira uma tabela de resultados, linhas de critério e linhas de frequência):
 *   G2.umidade({secao, modo: "pp" (h ót ± tol, em pontos percentuais) | "rel" (faixa × h ót) | "info", tol, faixa, freq})
 *   G2.valores({chave, titulo, secao, rotulo, texto: [{k, r}], campos: [{k, r, u, casas, crit}], importar, freq, se})
 *       crit: {criterio, secao, min, max (número ou fn(P, ctx)), minEstrito, individual, falha, obrigMin, obrigMax,
 *              exigido, aplica: fn(P), naoAplicaPor, informativo, proj: fn(P) (compara a média com o projeto), grafico}
 *   G2.granulometria({secao, obrig (faixa da ES obrigatória?), extras: [{mm, min, max, secao, texto}], freq})
 *   G2.limites({secao, ll, ip, aplica, freq})      LL/IP ("NP" aceito)
 *   G2.deflexao({secao, modo: "estat" (Dc = D̄ + k·s ≤ LSE, n ≥ 15) | "complementar" (cada valor < projeto)})
 *   G2.geometria({secao, largura: "semFalta" | "pm" | "excesso", decl: true|false, espLim: {min, max, secao}})
 *   Frequência de um grupo: {ensaio, metodo, secao, por: "extensao" | "faixa" (m de faixa de tráfego) | "plano"
 *     (plano de amostragem da ES — parâmetro espPlano) | "jornada" | "carregamento" | "lote" | "pontos", a_cada,
 *     minimo, ouJornada, conta: [campos], se: fn(P), regra}
 * Situações e parecer: os da biblioteca FE.aceitacao (es-comum.js).
 *
 * ---------------------------------------------------------------------------------------------------------------
 * Ficha registrada aqui: DNIT 140/2022-ES — Sub-base de solo melhorado com cimento.
 *   5.2   mistura: expansão ≤ 1 % (DNIT 172); empírico: ISC ≥ 30 %, LL ≤ 25 %, IP ≤ 6 %; mecanicista: MR e DP do projeto.
 *   5.4.1 b / 7.3.1 a  pulverização: ≥ 50 % passando na 4,8 mm.   5.4.4  umidade: h ót ± 1 %.
 *   5.4.5 tempo água → início do espalhamento ≤ 1 h (salvo comprovação); água → fim da compactação ≤ 3 h.
 *   5.4.6 espessura compactada 10 a 20 cm.   5.4.9 cura ≥ 7 dias.
 *   7.1   cimento: certificado (DNER-EM 036), mesmo tipo da dosagem, finura ≥ 1 por dia; resíduo na nº 200 ≤ 10 %
 *         (alto-forno) ou ≤ 15 % (comum).   7.2 mecanicista: MR (triplicata) e DP antes da obra.
 *   7.3.2 umidade, compactação (intermediária, Método B da DNIT 164), ISC (se especificado), expansão, MR a cada 1500 m;
 *         GC (DNER-ME 092 → DNIT 458, DNER-ME 036, DNIT 417) — a ES NÃO fixa o GC mínimo (ver parâmetro gcMin).
 *   7.3.3 deflexão após 7 dias de cura: n ≥ 15, a cada 20 m em faixas alternadas; Dc = D̄ + k·S ≤ LSE (eq. 1).
 *   7.4   geometria: largura até +10 cm (sem falta); flecha +20 % ou declividade +0,5 % (sem falta); espessura ± 10 %.
 *   7.5   plano de amostragem (DNER-PRO 277) — a ES não fixa as frequências dos ensaios de execução.
 *   7.6   X̄ − k·s ≥ mín.; X̄ + k·s ≤ máx. (eq. 2 e 3), k da Tabela A1 (Anexo A, normativo) = tabela padrão A.K_DNIT.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var G2 = {};
  var EPS = 1e-9;

  // DNER-PRO 277/97, Tabela 1 (e a tabela transcrita nas DNIT 420/421-ES): sem n = 11
  G2.K_PRO277 = A.K_DNIT.filter(function (x) { return x[0] !== 11; });

  // ------------------------------------------------------------------------------------------------------------
  // utilidades
  // ------------------------------------------------------------------------------------------------------------
  function val(v, P, ctx) { return typeof v === "function" ? v(P || {}, ctx) : v; }
  function cheio(c, ks) { return ks.some(function (k) { return String(c[k] === undefined || c[k] === null ? "" : c[k]).trim() !== ""; }); }
  function simNao(t) {
    t = String(t === undefined || t === null ? "" : t).trim().toLowerCase();
    if (!t) return null;
    if (/^(s|sim|ok|c|conforme|atende|x|1)$/.test(t)) return true;
    if (/^(n|n[aã]o|nc|n[aã]o conforme|0)$/.test(t)) return false;
    return null;
  }
  function perto(a, b) { return Math.abs(a - b) / b < 0.04; }
  function kPen(mm) { return "p" + String(mm).replace(".", "_"); }
  function rotPen(p) { return p.nome + " (" + fmt(p.mm, p.mm < 1 ? 3 : p.mm < 10 ? 2 : 1).replace(/,?0+$/, "") + " mm)"; }
  function estat(pts) { var e = A.estatistica(pts); return e; }
  var L_EST = { k: "est", r: "Estaca / local", texto: true };
  var L_POS = { k: "pos", r: "Posição (LE / eixo / LD)", texto: true };
  var L_REG = { k: "reg", r: "Registro / origem", texto: true };
  G2.util = { val: val, cheio: cheio, simNao: simNao, kPen: kPen };

  // ------------------------------------------------------------------------------------------------------------
  // frequência de um grupo
  // ------------------------------------------------------------------------------------------------------------
  function frequenciaDe(fr, ctx, real) {
    var P = ctx.P, L = ctx.L, nF = ctx.nFaixas, jorn = ctx.jornadas, min = fr.minimo || 1, exig, regra;
    var ens = fr.ensaio || "", met = fr.metodo || "—", sec = fr.secao ? " (" + fr.secao + ")" : "";
    if (fr.se && !fr.se(P, ctx)) return A.frequencia({ ensaio: ens, metodo: met, regra: fr.naoRegra || "não exigido", aplica: false, realizado: real });
    switch (fr.por) {
      case "extensao":
        exig = A.nMin(L.ext, fr.a_cada, min); regra = "1 a cada " + fmt(fr.a_cada, 0) + " m"; break;
      case "faixa":
        exig = A.nMin(ok(L.ext) ? L.ext * nF : NaN, fr.a_cada, min); regra = "1 a cada " + fmt(fr.a_cada, 0) + " m de faixa de tráfego"; break;
      case "pontos":
        exig = A.nPontos(L.ext, fr.a_cada, min); regra = "a cada " + fmt(fr.a_cada, 0) + " m"; break;
      case "plano":
        var esp = num(P.espPlano), qtd = ok(L.ext) ? L.ext * (ctx.cfg.porFaixa ? nF : 1) : NaN;
        var usaEsp = fr.usaEsp !== undefined ? fr.usaEsp : min > 1;
        if (usaEsp && ok(esp) && esp > 0) { exig = A.nMin(qtd, esp, min); regra = "plano de amostragem: 1 a cada " + fmt(esp, 0) + " m" + (ctx.cfg.porFaixa ? " de faixa" : ""); }
        else { exig = min; regra = "plano de amostragem (a ES não fixa)"; }
        if (min > 1) regra += "; mín. " + min + (fr.motivoMin ? " (" + fr.motivoMin + ")" : "");
        break;
      case "jornada":
        exig = jorn * (fr.qtd || 1); regra = (fr.qtd || 1) + " por " + (fr.unid || "dia de trabalho"); break;
      case "carregamento":
        exig = Math.max(0, Math.round(num(P.nCarreg))); regra = (fr.qtd || 1) + " por carregamento recebido";
        if (!ok(exig)) exig = NaN;
        break;
      default:
        exig = min; regra = min + " por lote";
    }
    if (fr.ouJornada && ok(exig)) { exig = Math.max(exig, jorn); regra += " ou por jornada (" + jorn + ")"; }
    if (fr.exig) { var e2 = fr.exig(P, L, ctx); exig = e2.exig; regra = e2.regra; }
    return A.frequencia({ ensaio: ens, metodo: met, regra: (fr.regra || regra) + sec, exigido: exig, realizado: real });
  }

  // ------------------------------------------------------------------------------------------------------------
  // linha de critério de um campo numérico
  // ------------------------------------------------------------------------------------------------------------
  function resumoInfo(pts, casas, unid) {
    var xs = pts.map(function (p) { return p.v; });
    if (!xs.length) return "—";
    var u = unid ? " " + unid : "";
    return xs.length > 1 ? "X̄ = " + fmt(media(xs), casas) + u + " (" + fmt(Math.min.apply(null, xs), casas) + " a " + fmt(Math.max.apply(null, xs), casas) + "; n = " + xs.length + ")" : fmt(xs[0], casas) + u;
  }
  function linhaCampo(g, c, cols, ctx) {
    var cr = c.crit || {}, P = ctx.P, casas = c.casas === undefined ? 1 : c.casas;
    var pts = cols.map(function (col, i) {
      return { v: num(col[c.k]), est: col.est || "", x: A.estacaM(col.est), rot: (g.rotulo || "det.").toLowerCase() + " " + (i + 1) + (col.pos ? " " + col.pos : "") };
    }).filter(function (p) { return ok(p.v); });
    var min = val(cr.min, P, ctx), max = val(cr.max, P, ctx);
    var aplica = cr.aplica ? cr.aplica(P, ctx) !== false : true;
    if (g.se && !g.se(P)) aplica = false;
    var base = { id: cr.id || g.chave + "_" + c.k, grupo: cr.grupo || g.grupo || "", criterio: cr.criterio || c.r, secao: cr.secao || g.secao || "",
      unid: c.u || "", casas: casas, pontos: pts, metodo: cr.metodo || g.metodo };
    var l;
    if (cr.informativo || (!ok(min) && !ok(max))) {
      l = A.linha(base);
      l.n = pts.length; l.lim = {};
      if (pts.length) { var e = A.estatistica(pts); l.media = e.X; l.s = e.s; l.est = e; }
      l.exigido = val(cr.exigido, P, ctx) || (cr.informativo ? "informativo" : "conforme projeto");
      l.resultado = resumoInfo(pts, casas, c.u);
      if (!aplica) { l.situacao = "nao_exigido"; l.motivo = val(cr.naoAplicaPor, P, ctx) || "não exigido"; return l; }
      l.situacao = "informativo";
      var pj = val(cr.proj, P, ctx);
      if (pts.length && ok(pj)) {
        var dv = (l.media - pj) / pj * 100;
        l.motivo = "média " + fmt(l.media, casas) + (c.u ? " " + c.u : "") + ", " + (dv >= 0 ? "+" : "−") + fmt(Math.abs(dv), 1) + " % em relação ao projeto (" + fmt(pj, casas) + ")";
        var tol = val(cr.tolProj, P, ctx);
        if (ok(tol) && Math.abs(dv) > tol + EPS) { l.situacao = "conforme"; A.marcar(l, "ressalva", "desvio de " + fmt(Math.abs(dv), 1) + " % > " + fmt(tol, 0) + " % adotado" + (cr.msgProj ? " — " + cr.msgProj : "")); }
      } else if (pts.length) l.motivo = cr.motivoInfo || "sem limite numérico na ES — registrar";
      else l.motivo = "sem determinações";
      if (cr.semLimite === "pendente" && pts.length && !ok(min) && !ok(max) && !cr.informativo) { l.situacao = "conforme"; A.marcar(l, "pendente", "informe o valor de projeto para avaliar"); }
    } else {
      l = A.avaliar(Object.assign(base, { min: min, max: max, minEstrito: cr.minEstrito, individual: cr.individual, falha: cr.falha,
        obrigMin: cr.obrigMin, obrigMax: cr.obrigMax, exigido: val(cr.exigido, P, ctx), aplica: aplica,
        naoAplicaPor: val(cr.naoAplicaPor, P, ctx) || "não exigido", refs: ctx.cfg.refs, tabelaK: ctx.cfg.tabelaK }));
    }
    l.grafico = !!cr.grafico;
    if (cr.pos) cr.pos(l, P, ctx);
    return l;
  }
  function foraDoLote(cols, keys, nome, ctx) {
    var L = ctx.L;
    if (!ok(L.ini) || !ok(L.fim)) return;
    var fora = cols.filter(function (c) {
      var x = A.estacaM(c.est);
      return cheio(c, keys) && ok(x) && (x < L.ini - 1e-6 || x > L.fim + 1e-6);
    });
    if (fora.length) ctx.avisos.push(nome + ": " + fora.length + " determinação(ões) fora das estacas do lote (" + fora.map(function (c) { return c.est; }).join("; ") + ").");
  }

  // ------------------------------------------------------------------------------------------------------------
  // grupo genérico de valores (uma coluna por determinação)
  // ------------------------------------------------------------------------------------------------------------
  G2.valores = function (g) {
    var campos = g.campos || [], chaves = campos.map(function (c) { return c.k; });
    var params = [];
    if (g.importar) {
      params.push({ k: g.importar.k, r: g.importar.r, tipo: "importarVarios", de: g.importar.de,
        dica: g.importar.dica || "marque os ensaios e clique em \"Importar selecionados\" (substitui as colunas importadas antes; as digitadas são mantidas)",
        se: g.se ? function (d) { return g.se(d.params || {}); } : undefined,
        aplicar: function (lista, P, d) {
          var cols = [];
          lista.forEach(function (e) {
            (g.importar.map(e, P) || []).forEach(function (c) {
              if (!c.reg) c.reg = A.importacao.rotulo(e);
              cols.push(c);
            });
          });
          A.importacao.substituir(d, g.chave, cols, g.importar.chave ? { chave: g.importar.chave } : undefined);
        } });
      if (!params[0].se) delete params[0].se;
    }
    return {
      tipo: "valores", chave: g.chave, params: params, cfg: g,
      tabela: function (P) {
        if (g.se && !g.se(P)) return null;
        var linhas = [L_EST];
        if (g.posicao) linhas.push(L_POS);
        linhas.push(L_REG);
        (g.texto || []).forEach(function (t) { linhas.push({ k: t.k, r: t.r, u: t.u || "", texto: t.texto !== false }); });
        campos.forEach(function (c) { linhas.push({ k: c.k, r: c.r, u: c.u || "", texto: !!c.texto, padrao: c.padrao }); });
        return { chave: g.chave, titulo: g.titulo + (g.secao ? " (" + g.secao + ")" : ""), rotulo: g.rotulo || "Det.", iniciais: 1, min: 1, dica: g.dica || "", linhas: linhas };
      },
      calcular: function (ctx) {
        var P = ctx.P, cols = ctx.d[g.chave] || [], ativo = !g.se || g.se(P);
        if (ativo) foraDoLote(cols, chaves, g.titulo, ctx);
        campos.forEach(function (c) {
          if (!c.crit) return;
          if (!ativo && c.crit.ocultarSeInativo) return;
          ctx.linhas.push(linhaCampo(g, c, ativo ? cols : [], ctx));
        });
        [].concat(g.freq || []).forEach(function (fr) {
          var ks = fr.conta || chaves;
          var real = ativo ? cols.filter(function (c) { return ks.some(function (k) { return ok(num(c[k])); }); }).length : 0;
          var f = frequenciaDe(Object.assign({ se: g.se ? function (P2) { return g.se(P2); } : undefined }, fr), ctx, real);
          ctx.freqs.push(f);
        });
        if (g.extra) g.extra(ctx, ativo ? cols : []);
      },
    };
  };

  // ------------------------------------------------------------------------------------------------------------
  // umidade imediatamente antes da compactação: Δw = w − h ót (± tol) ou w / h ót (faixa)
  // ------------------------------------------------------------------------------------------------------------
  G2.umidade = function (g) {
    var modo = g.modo || "pp", tol = g.tol === undefined ? 1 : g.tol, fx = g.faixa || [0.9, 1.1];
    return {
      tipo: "umidade", chave: "umid", cfg: g,
      params: [{ k: "impUmid", r: "Teor de umidade — importar (DNIT 456)", tipo: "importarVarios", de: "dnit-456-2025-me",
        dica: "estaca = campo \"Estaca / local\" da ficha de origem",
        aplicar: function (lista, P, d) {
          A.importacao.substituir(d, "umid", lista.map(function (e) {
            var r = e.resultados || {};
            return { est: loc(A.importacao.ident(e)), reg: A.importacao.rotulo(e), w: ok(r.w) ? A.nstr(r.w, 1) : "" };
          }));
        } }],
      tabela: function () {
        var calc = modo === "rel" ? { calc: "rw", r: "w / h ót (admitido " + fmt(fx[0], 1) + " a " + fmt(fx[1], 1) + ")", u: "", casas: 2, destaque: true }
          : { calc: "dw", r: "Δw = w − h ót" + (modo === "pp" ? " (admitido ± " + fmt(tol, 0) + ")" : ""), u: "p.p.", casas: 1, destaque: true };
        return { chave: "umid", titulo: (g.titulo || "Teor de umidade imediatamente antes da compactação") + " (" + g.secao + ")", rotulo: "Det.", iniciais: 1, min: 1,
          dica: g.dica || "", linhas: [L_EST, L_REG, { k: "w", r: "Teor de umidade (w)", u: "%" },
            { k: "hot", r: "Umidade ótima de referência", u: "%", padrao: "hOt" }, calc] };
      },
      calcular: function (ctx) {
        var cols = ctx.d.umid || [], h0 = ctx.hRef;
        foraDoLote(cols, ["w"], "Umidade", ctx);
        var tab = cols.map(function (c) {
          var w = num(c.w), h = ok(num(c.hot)) ? num(c.hot) : h0;
          return { dw: ok(w) && ok(h) ? w - h : NaN, rw: ok(w) && ok(h) && h > 0 ? w / h : NaN };
        });
        ctx.tab.umid = tab;
        if (cols.some(function (c) { return ok(num(c.w)) && !ok(num(c.hot)); }) && !ok(h0))
          ctx.avisos.push("Umidade: sem umidade ótima de referência — informe a h ót (parâmetro) ou importe o ensaio de compactação.");
        var k = modo === "rel" ? "rw" : "dw";
        var pts = cols.map(function (c, i) { return { v: tab[i][k], est: c.est || "", x: A.estacaM(c.est), rot: "det. " + (i + 1) }; }).filter(function (p) { return ok(p.v); });
        var l;
        var base = { id: "umid", criterio: g.criterio || (modo === "rel" ? "Umidade antes da compactação: w / h ót" : "Umidade antes da compactação: Δw = w − h ót"), secao: g.secao,
          unid: modo === "rel" ? "" : "p.p.", casas: modo === "rel" ? 2 : 1, pontos: pts, refs: ctx.cfg.refs, tabelaK: ctx.cfg.tabelaK };
        if (modo === "info") {
          l = A.linha(base); l.n = pts.length; l.lim = {};
          if (pts.length) { var e = A.estatistica(pts); l.media = e.X; l.s = e.s; l.est = e; }
          l.exigido = g.exigido || "informativo"; l.resultado = resumoInfo(pts, 1, "p.p.");
          l.situacao = "informativo"; l.motivo = g.motivoInfo || (pts.length ? "a ES não fixa tolerância numérica" : "sem determinações");
        } else if (modo === "rel") {
          l = A.avaliar(Object.assign(base, { min: fx[0], max: fx[1], exigido: fmt(fx[0], 1) + " a " + fmt(fx[1], 1) + " × h ót" }));
        } else {
          l = A.avaliar(Object.assign(base, { min: -tol, max: tol, exigido: "h ót ± " + fmt(tol, 1) + " (Δw de −" + fmt(tol, 1) + " a +" + fmt(tol, 1) + ")" }));
        }
        l.grafico = true;
        ctx.linhas.push(l);
        [].concat(g.freq || []).forEach(function (fr) {
          ctx.freqs.push(frequenciaDe(Object.assign({ ensaio: "Teor de umidade", metodo: "DNIT 456" }, fr), ctx, cols.filter(function (c) { return ok(num(c.w)); }).length));
        });
      },
    };
  };

  // ------------------------------------------------------------------------------------------------------------
  // importações prontas (map das fichas ME de origem)
  // ------------------------------------------------------------------------------------------------------------
  function id_(e) { return A.importacao.ident(e); }
  // "Est. 120 + 10" → "120 + 10" (o texto da ficha de origem já traz "Est.")
  function loc(i) { return String((i && i.local) || "").replace(/^\s*est(aca)?\.?\s*/i, ""); }
  G2.util.loc = loc;
  G2.map = {
    // compactação: DNIT 164 / 172 / DNER-ME 216 / 181 (γs,máx, h ót, ISC e expansão quando houver)
    compactacao: function (e) {
      var r = e.resultados || {}, i = id_(e);
      return [{ est: loc(i), reg: A.importacao.rotulo(e), gs: ok(r.gsMax) ? A.nstr(r.gsMax, 3) : "", hot: ok(r.hOt) ? A.nstr(r.hOt, 1) : "",
        isc: ok(r.isc) ? A.nstr(Math.round(r.isc), 0) : "", exp: ok(r.exp) ? A.nstr(r.exp, 2) : "" }];
    },
    // grau de compactação: furos (DNIT 458, DNER-ME 036) ou pontos (DNIT 417)
    gc: function (e) {
      var r = e.resultados || {}, i = id_(e), pts = r.furos || r.pts || [], nome = e.ficha === "dnit-417-2019-me" ? "ponto " : "furo ";
      var gref = ok(r.meLab) ? r.meLab : r.gsl;
      return pts.filter(function (f) { return ok(f.GC); }).map(function (f, j) {
        var w = ok(f.uW) ? f.uW : f.w;
        return { est: f.estaca || loc(i), pos: f.posicao || "", reg: A.importacao.rotulo(e, nome + (j + 1)), gc: A.nstr(f.GC, 1),
          w: ok(w) ? A.nstr(w, 1) : "", gref: ok(gref) ? A.nstr(gref, 3) : "" };
      });
    },
    // resistência à compressão simples (DNER-ME 201): grupo de 7 dias (ou o primeiro)
    rcs: function (e) {
      var r = e.resultados || {}, i = id_(e), gs = r.grupos || [];
      var g = gs.filter(function (x) { return x.idade === 7; })[0] || gs[0];
      if (!g || !ok(g.media)) return [];
      return [{ est: loc(i), reg: A.importacao.rotulo(e, (g.idade ? g.idade + " dias" : "")), idade: g.idade ? String(g.idade) : "", ncp: String(g.n || ""), v: A.nstr(g.media, 2) }];
    },
    // resistência à tração por compressão diametral: DNIT 136 (misturas) / DNER-ME 181 (7 dias, na umidade ótima)
    rt: function (e) {
      var r = e.resultados || {}, i = id_(e);
      if (e.ficha === "dner-me-181-94") {
        var c = (r.rcs || {})["7"];
        return c && ok(c.naOtima) ? [{ est: loc(i), reg: A.importacao.rotulo(e, "7 dias"), idade: "7", ncp: String(c.n || ""), v: A.nstr(c.naOtima, 2) }] : [];
      }
      return ok(r.rt) ? [{ est: loc(i), reg: A.importacao.rotulo(e), idade: "", ncp: String(r.n || ""), v: A.nstr(r.rt, 2) }] : [];
    },
  };

  // ------------------------------------------------------------------------------------------------------------
  // granulometria: faixa da ES (obrigatória ou de referência) e faixa de trabalho = projeto ± tolerância
  // ------------------------------------------------------------------------------------------------------------
  G2.granulometria = function (g) {
    function faixas(ctxId) { return FE.granulometria.faixasDisponiveis().filter(function (f) { return f.norma === ctxId; }); }
    function faixaSel(P, id) { return faixas(id).filter(function (f) { return f.id === P.faixa; })[0] || faixas(id)[0] || null; }
    // peneiras: união das peneiras das faixas da ES (ordem decrescente)
    function peneiras(id) {
      var ps = [];
      faixas(id).forEach(function (f) { f.peneiras.forEach(function (p) { if (!ps.some(function (q) { return perto(q.mm, p.mm); })) ps.push({ mm: p.mm, nome: p.nome }); }); });
      return ps.sort(function (a, b) { return b.mm - a.mm; });
    }
    function tolDe(f, mm) { var t = ((f && f.tolerancia) || []).filter(function (x) { return perto(x.mm, mm); })[0]; return t ? t.tol : NaN; }
    return {
      tipo: "granulometria", chave: "gran", cfg: g,
      paramsDe: function (cfg) {
        var fs = faixas(cfg.id);
        var p = [];
        if (fs.length > 1 || !g.obrig) p.push({ k: "faixa", r: g.rotuloFaixa || (g.obrig ? "Faixa granulométrica da ES" : "Faixa granulométrica de referência (informativa)"), tipo: "select",
          opcoes: function () { return (g.obrig ? [] : [["", "— nenhuma —"]]).concat(faixas(cfg.id).map(function (f) { return [f.id, "Faixa " + f.faixa + " (" + f.tabela + ")"]; })); },
          dica: g.dicaFaixa || "" });
        p.push({ k: "impGran", r: "Granulometria — importar (DNIT 412)", tipo: "importarVarios", de: "dnit-412-2025-me",
          aplicar: function (lista, P, d) {
            var ps = peneiras(cfg.id);
            A.importacao.substituir(d, "gran", lista.map(function (e) {
              var r = e.resultados || {}, c = { est: loc(id_(e)), reg: A.importacao.rotulo(e) };
              ps.forEach(function (pp) {
                var m = (r.media || []).filter(function (x) { return perto(x.mm, pp.mm) && ok(x.pass); })[0];
                c[kPen(pp.mm)] = m ? A.nstr(m.pass, 1) : "";
              });
              return c;
            }));
          } });
        return p;
      },
      tabelas: function (P, cfg) {
        var ps = peneiras(cfg.id), f = faixaSel(P, cfg.id);
        var t = [{ chave: "gran", titulo: (g.titulo || "Granulometria da mistura — % passando") + " (" + g.secao + ")", rotulo: "Amostra", iniciais: 1, min: 1, dica: g.dica || "",
          linhas: [L_EST, L_REG].concat(ps.map(function (p) { return { k: kPen(p.mm), r: rotPen(p), u: "%" }; })) }];
        if (g.projeto !== false) t.push({ chave: "proj", titulo: "Curva granulométrica de projeto — % passando (faixa de trabalho = projeto ± tolerância)", rotulo: "Curva", iniciais: 1, min: 1, fixo: true, nomes: ["Projeto"],
          dica: "deixe vazio se não houver curva de projeto: vale só a faixa da ES", linhas: ps.map(function (p) {
            var tl = tolDe(f, p.mm);
            return { k: kPen(p.mm), r: rotPen(p) + (ok(tl) ? " — tolerância ± " + tl : ""), u: "%" };
          }) });
        return t;
      },
      calcular: function (ctx) {
        var P = ctx.P, cfg = ctx.cfg, ps = peneiras(cfg.id), f = faixaSel(P, cfg.id), proj = (ctx.d.proj || [])[0] || {};
        var cols = ctx.d.gran || [];
        var usadas = cols.filter(function (c) { return ps.some(function (p) { return ok(num(c[kPen(p.mm)])); }); });
        foraDoLote(cols, ps.map(function (p) { return kPen(p.mm); }), "Granulometria", ctx);
        var temProj = g.projeto !== false && ps.some(function (p) { return ok(num(proj[kPen(p.mm)])); });
        var porPen = ps.map(function (p) {
          var k = kPen(p.mm), fl = f ? f.peneiras.filter(function (x) { return perto(x.mm, p.mm); })[0] : null, tl = tolDe(f, p.mm), pj = num(proj[k]);
          var mn = NaN, mx = NaN;
          if (temProj && ok(pj)) { var t2 = ok(tl) ? tl : 0; mn = Math.max(0, pj - t2); mx = Math.min(100, pj + t2); }
          if (g.obrig && fl) { mn = ok(mn) ? Math.max(mn, fl.min) : fl.min; mx = ok(mx) ? Math.min(mx, fl.max) : fl.max; }
          (g.extras || []).forEach(function (x) { if (perto(x.mm, p.mm)) { if (ok(x.min)) mn = ok(mn) ? Math.max(mn, x.min) : x.min; if (ok(x.max)) mx = ok(mx) ? Math.min(mx, x.max) : x.max; } });
          var pts = cols.map(function (c, i) { return { v: num(c[k]), est: c.est || "", x: A.estacaM(c.est), rot: "amostra " + (i + 1) }; }).filter(function (q) { return ok(q.v); });
          var av = A.avaliar({ id: "pen" + k, criterio: "Peneira " + p.nome, secao: g.secao, unid: "%", casas: 1, pontos: pts, min: mn, max: mx,
            aplica: ok(mn) || ok(mx), naoAplicaPor: "sem limite", refs: cfg.refs, tabelaK: cfg.tabelaK });
          var xm = media(pts.map(function (q) { return q.v; }));
          return { mm: p.mm, nome: p.nome, pj: pj, tol: tl, faixa: fl ? { min: fl.min, max: fl.max } : null, min: mn, max: mx, av: av, media: xm,
            refDentro: fl && ok(xm) ? xm >= fl.min - EPS && xm <= fl.max + EPS : null };
        });
        ctx.R.gran = { pen: porPen, faixa: f, temProj: temProj, obrig: !!g.obrig };
        var l = A.linha({ id: "gran", criterio: g.criterio || (g.obrig ? "Granulometria na faixa da ES" + (temProj ? " e na faixa de trabalho" : "") : "Granulometria na faixa de trabalho (projeto ± tolerância)"),
          secao: g.secao, n: usadas.length, semMedia: true, txtEstat: "—", exigido: g.obrig ? (f ? "faixa " + f.faixa + (temProj ? " ∩ projeto ± tol." : "") : "faixa da ES") : "projeto ± tolerância" });
        var aval = porPen.filter(function (x) { return x.av.situacao !== "nao_exigido"; });
        if (!aval.length) { l.situacao = "nao_exigido"; l.motivo = g.obrig ? "sem faixa" : "sem curva de projeto (faixas só de referência)"; }
        else if (!usadas.length) { l.situacao = "sem_dados"; l.motivo = "sem determinações"; }
        else {
          var nc = aval.filter(function (x) { return x.av.situacao === "nao_conforme"; }), cr = aval.filter(function (x) { return x.av.situacao === "ressalva"; });
          l.situacao = nc.length ? "nao_conforme" : cr.length ? "ressalva" : "conforme";
          l.motivo = nc.length ? "fora: " + nc.map(function (x) { return x.nome + " — " + x.av.motivo; }).join(" | ")
            : cr.length ? cr.map(function (x) { return x.nome + " — " + x.av.motivo; }).join(" | ")
            : (usadas.length >= 5 ? "todas as peneiras atendem (X̄ ± k·s)" : "todas as peneiras atendem (valores individuais, n < 5)");
          if (l.situacao !== "conforme") l.motivos = [{ situacao: l.situacao, texto: l.motivo }];
        }
        l.resultado = usadas.length + " amostra(s)";
        ctx.linhas.push(l);
        if (!g.obrig && f) {
          var fora = porPen.filter(function (x) { return x.refDentro === false; });
          if (fora.length) ctx.avisos.push("Granulometria média fora da faixa " + f.faixa + " de referência em " + fora.map(function (x) {
            return x.nome + " (" + fmt(x.media, 1) + " %; " + x.faixa.min + "–" + x.faixa.max + ")"; }).join(", ") + " — apenas informativo (" + (g.secaoRef || g.secao) + ").");
        }
        [].concat(g.freq || []).forEach(function (fr) {
          ctx.freqs.push(frequenciaDe(Object.assign({ ensaio: "Granulometria", metodo: "DNIT 412" }, fr), ctx, usadas.length));
        });
      },
      html: function (R, relat) {
        var gr = R.gran;
        if (!gr || !gr.pen.some(function (x) { return x.av.n || ok(x.pj); })) return "";
        var cls = relat ? "gr" : "fe-resumo";
        return '<table class="' + cls + '"><thead><tr><th>Peneira</th><th>Faixa da ES' + (gr.obrig ? "" : " (ref.)") + "</th><th>Projeto</th><th>Tol.</th><th>Limites adotados</th><th>n</th><th>X̄</th><th>X̄ − k·s / X̄ + k·s</th><th>Situação</th></tr></thead><tbody>" +
          gr.pen.map(function (x) {
            var a = x.av;
            return "<tr><td>" + esc(x.nome) + " (" + fmt(x.mm, x.mm < 1 ? 3 : x.mm < 10 ? 2 : 1).replace(/,?0+$/, "") + " mm)</td><td>" + (x.faixa ? x.faixa.min + "–" + x.faixa.max : "—") +
              "</td><td>" + (ok(x.pj) ? fmt(x.pj, 0) : "—") + "</td><td>" + (ok(x.tol) ? "± " + x.tol : "—") + "</td><td>" + (ok(x.min) || ok(x.max) ? (ok(x.min) ? fmt(x.min, 0) : "—") + "–" + (ok(x.max) ? fmt(x.max, 0) : "—") : "—") +
              "</td><td>" + (a.n || 0) + "</td><td>" + (ok(x.media) ? fmt(x.media, 1) : "—") + "</td><td>" + (ok(a.inf) ? fmt(a.inf, 1) + " / " + fmt(a.sup, 1) : "—") + "</td><td>" +
              A.situacaoHtml(a.situacao, relat) + "</td></tr>";
          }).join("") + "</tbody></table>";
      },
      grafico: function (R, d, opt) {
        var gr = R.gran;
        if (!gr) return null;
        var am = (d.gran || []).map(function (c) {
          var pen = gr.pen.map(function (x) { return { mm: x.mm, pass: num(c[kPen(x.mm)]) }; }).filter(function (x) { return ok(x.pass); });
          return pen.length >= 2 ? { pen: pen } : null;
        }).filter(Boolean);
        if (!am.length) return null;
        var med = gr.pen.filter(function (x) { return ok(x.media); }).map(function (x) {
          var lim = ok(x.min) && ok(x.max) ? { min: x.min, max: x.max } : x.faixa;
          return { mm: x.mm, pass: x.media, lim: lim, dentro: lim ? x.media >= lim.min - EPS && x.media <= lim.max + EPS : null };
        });
        return FE.granulometria.grafico({ amostras: am, resultados: { media: med } }, opt);
      },
    };
  };

  // ------------------------------------------------------------------------------------------------------------
  // LL e IP (NP aceito; IP "NP" = 0)
  // ------------------------------------------------------------------------------------------------------------
  G2.limites = function (g) {
    return {
      tipo: "limites", chave: "lim",
      params: [{ k: "impLim", r: "LL e IP — importar (DNER-ME 122 / 082)", tipo: "importarVarios", de: ["dner-me-082-94", "dner-me-122-94"],
        dica: "ensaios com o mesmo registro vão para a mesma coluna", se: g.aplica ? function (d) { return g.aplica(d.params || {}); } : undefined,
        aplicar: function (lista, P, d) {
          A.importacao.substituir(d, "lim", A.importacao.juntarPorRegistro(lista.map(function (e) {
            var r = e.resultados || {}, i = id_(e), c = { est: loc(i), reg: A.importacao.rotulo(e), ll: "", ip: "" };
            if (e.ficha === "dner-me-082-94") { c.ll = r.llNP ? "NP" : ok(r.LL) ? fmt(r.LL, 0) : ""; c.ip = r.ipNP ? "NP" : ok(r.IP) ? fmt(r.IP, 0) : ""; }
            else { c.ll = r.np ? "NP" : ok(r.LL) ? fmt(r.LL, 0) : ""; }
            return { chave: i.registro || "", cod: A.codigoCurto(e.ficha), col: c };
          })));
        } }],
      tabela: function (P) {
        if (g.aplica && !g.aplica(P)) return null;
        return { chave: "lim", titulo: "Limites de consistência da mistura (" + g.secao + ")", rotulo: "Amostra", iniciais: 1, min: 1,
          dica: "LL ≤ " + g.ll + " %, IP ≤ " + g.ip + " %; \"NP\" aceito", linhas: [L_EST, L_REG, { k: "ll", r: "Limite de liquidez (DNER-ME 122)", u: "%", texto: true },
            { k: "ip", r: "Índice de plasticidade (DNER-ME 082)", u: "%", texto: true }] };
      },
      calcular: function (ctx) {
        var P = ctx.P, ap = !g.aplica || g.aplica(P), cols = ap ? ctx.d.lim || [] : [];
        var ll = [], ip = [], llNP = 0;
        cols.forEach(function (c, i) {
          var a = A.numOuNP(c.ll), b = A.numOuNP(c.ip);
          if (a.np) llNP++;
          if (ok(a.v)) ll.push({ v: a.v, est: c.est || "", x: A.estacaM(c.est), rot: "amostra " + (i + 1) });
          if (b.np || ok(b.v)) ip.push({ v: b.np ? 0 : b.v, est: c.est || "", x: A.estacaM(c.est), rot: "amostra " + (i + 1) });
        });
        var o = { secao: g.secao, unid: "%", casas: 0, aplica: ap, naoAplicaPor: g.naoAplicaPor || "não exigido", refs: ctx.cfg.refs, tabelaK: ctx.cfg.tabelaK };
        var lL = A.avaliar(Object.assign({ id: "ll", criterio: "Limite de liquidez", max: g.ll, pontos: ll }, o));
        if (ap && !ll.length && llNP) { lL.situacao = "conforme"; lL.n = llNP; lL.motivo = "NP em todas as amostras"; lL.resultado = "NP"; }
        var lI = A.avaliar(Object.assign({ id: "ip", criterio: "Índice de plasticidade", max: g.ip, pontos: ip }, o));
        ctx.linhas.push(lL, lI);
        [].concat(g.freq || []).forEach(function (fr) {
          var real = cols.filter(function (c) { var a = A.numOuNP(c.ll), b = A.numOuNP(c.ip); return (a.np || ok(a.v)) && (b.np || ok(b.v)); }).length;
          ctx.freqs.push(frequenciaDe(Object.assign({ ensaio: "LL e IP", metodo: "DNER-ME 122 / 082", se: g.aplica }, fr), ctx, real));
        });
      },
    };
  };

  // ------------------------------------------------------------------------------------------------------------
  // deflexão: controle unilateral Dc = D̄ + k·s ≤ LSE (n ≥ 15) ou controle complementar (cada valor < projeto)
  // ------------------------------------------------------------------------------------------------------------
  G2.deflexao = function (g) {
    var comp = g.modo === "complementar";
    function exigida(P) { return comp ? P.defl === "realizado" : P.defl !== "dispensada"; }
    return {
      tipo: "deflexao", chave: "defl",
      params: [
        comp ? { k: "defl", r: "Controle deflectométrico complementar (" + g.secao + " NOTA)", tipo: "select", recarrega: true,
          opcoes: [["nao", "Não realizado (é complementar na ES)"], ["realizado", "Realizado — viga Benkelman ou FWD"]] }
          : { k: "defl", r: "Controle construtivo por deflexão (" + g.secao + ")", tipo: "select", recarrega: true,
            opcoes: [["exigido", "Realizado — Viga Benkelman (DNER-ME 024) ou FWD (DNER-PRO 273)"], ["dispensada", "Não informado / dispensado — registrar a justificativa"]] },
        { k: "lse", r: comp ? "Deflexão de projeto da camada (0,01 mm)" : "Deflexão admissível de projeto — LSE (0,01 mm)", se: function (d) { return exigida(d.params || {}); } },
      ],
      tabela: function (P) {
        if (!exigida(P)) return null;
        return { chave: "defl", titulo: "Deflexões recuperáveis máximas D₀ (" + g.secao + ")", rotulo: "Det.", iniciais: comp ? 1 : 15, min: 1,
          dica: comp ? "pelo menos uma a cada 20 m, alternando bordas e centro" : "a cada 20 m em faixas alternadas" + (g.cada40 ? " (40 m na mesma faixa)" : "") + "; mínimo de 15 determinações",
          linhas: [L_EST, { k: "faixa", r: "Faixa / bordo (LE / eixo / LD)", texto: true }, { k: "d0", r: "D₀", u: "0,01 mm" }] };
      },
      calcular: function (ctx) {
        var P = ctx.P, ex = exigida(P), lse = num(P.lse), cols = ex ? ctx.d.defl || [] : [];
        foraDoLote(cols, ["d0"], "Deflexão", ctx);
        var pts = cols.map(function (c, i) { return { v: num(c.d0), est: c.est || "", x: A.estacaM(c.est), rot: "det. " + (i + 1) }; }).filter(function (p) { return ok(p.v); });
        var l;
        if (!ex) {
          l = A.linha({ id: "defl", criterio: comp ? "Deflexão (controle complementar)" : "Deflexão característica Dc = D̄ + k·S", secao: g.secao, n: 0, exigido: "—", txtEstat: "—" });
          l.situacao = comp ? "nao_exigido" : "pendente";
          l.motivo = comp ? "não realizado (controle complementar, " + g.secao + " NOTA)" : "controle de deflexão não informado — a ES exige-o antes da camada seguinte e da liberação ao tráfego (" + g.secao + ")";
          if (!comp) l.motivos = [{ situacao: "pendente", texto: l.motivo }];
          ctx.linhas.push(l);
          return;
        }
        if (comp) {
          l = A.avaliar({ id: "defl", criterio: "Deflexão D₀ (controle complementar)", secao: g.secao + " NOTA", unid: "0,01 mm", casas: 0, pontos: pts, max: lse, individual: true,
            falha: "ressalva", exigido: ok(lse) ? "< " + fmt(lse, 0) + " (projeto), cada valor" : "< valor de projeto", refs: ctx.cfg.refs });
          if (l.situacao === "ressalva") { l.motivo += " — pesquisar a causa; se falha executiva, material inadequado ou excesso de umidade, refazer antes da camada seguinte (" + g.secao + " NOTA)"; l.motivos = [{ situacao: "ressalva", texto: l.motivo }]; }
          if (pts.length && !ok(lse)) { l.situacao = "conforme"; A.marcar(l, "pendente", "informe a deflexão de projeto"); }
        } else {
          l = A.avaliar({ id: "defl", criterio: "Deflexão característica Dc = D̄ + k·S", secao: g.secao + " (eq. 1)", unid: "0,01 mm", casas: 0, pontos: pts, max: lse,
            exigido: ok(lse) ? "Dc ≤ " + fmt(lse, 0) + " (LSE); n ≥ 15" : "Dc ≤ LSE; n ≥ 15", refs: ctx.cfg.refs, tabelaK: ctx.cfg.tabelaK });
          if (ok(l.sup)) l.txtEstat = "Dc = " + fmt(l.sup, 1);
          if (pts.length && !ok(lse)) { l.situacao = "conforme"; l.motivos = []; A.marcar(l, "pendente", "informe a deflexão admissível de projeto (LSE)"); }
          else if (pts.length && pts.length < 15) A.marcar(l, "pendente", "apenas " + pts.length + " determinações: mínimo de 15 por subtrecho (" + g.secao + ")");
        }
        l.grafico = true;
        ctx.linhas.push(l);
        ctx.freqs.push(frequenciaDe({ ensaio: "Deflexão D₀", metodo: "DNER-ME 024 / DNER-PRO 273", secao: g.secao, por: "pontos", a_cada: 20, minimo: comp ? 1 : 15,
          regra: comp ? "≥ 1 a cada 20 m" : "a cada 20 m em faixas alternadas; mín. 15" }, ctx, pts.length));
      },
    };
  };

  // ------------------------------------------------------------------------------------------------------------
  // controle geométrico: largura, flecha / declividade, espessura; medição
  // ------------------------------------------------------------------------------------------------------------
  G2.geometria = function (g) {
    var decl = g.decl !== false;
    return {
      tipo: "geometria", chave: "geo",
      params: [
        decl ? { k: "secaoT", r: "Seção transversal (" + g.secao + " b)", tipo: "select", recarrega: true,
          opcoes: [["simples", "Declividade transversal de caimento simples (%)"], ["abaul", "Abaulamento — flecha (cm)"]] } : null,
        { k: "declProj", r: "Declividade transversal de projeto (%)", ph: "3", se: function (d) { return decl && (d.params || {}).secaoT !== "abaul"; } },
        { k: "flechaProj", r: "Flecha de abaulamento de projeto (cm)", se: function (d) { return !decl || (d.params || {}).secaoT === "abaul"; } },
        { k: "espGeo", r: "Espaçamento das seções do controle geométrico (m)", ph: "20", dica: "a ES não fixa; padrão: uma seção por estaca (20 m)" },
      ].filter(Boolean),
      tabela: function (P) {
        var ln = [L_EST, { k: "larg", r: "Largura da plataforma", u: "m" }, { k: "esp", r: "Espessura da camada", u: "cm" }];
        if (!decl || P.secaoT === "abaul") ln.push({ k: "flecha", r: "Flecha de abaulamento", u: "cm" });
        else ln.push({ k: "dle", r: "Declividade transversal — lado esquerdo", u: "%" }, { k: "dld", r: "Declividade transversal — lado direito", u: "%" });
        return { chave: "geo", titulo: "Controle geométrico — relocação e nivelamento do eixo e bordas (" + g.secao + ")", rotulo: "Seção", iniciais: 1, min: 1,
          dica: g.dica || "", linhas: ln };
      },
      calcular: function (ctx) {
        var P = ctx.P, L = ctx.L, cols = ctx.d.geo || [], larg = L.larg, espP = num(P.espessura), refs = ctx.cfg.refs, K = ctx.cfg.tabelaK;
        var usadas = cols.filter(function (c) { return cheio(c, ["larg", "esp", "dle", "dld", "flecha"]); });
        foraDoLote(cols, ["larg", "esp", "dle", "dld", "flecha"], "Controle geométrico", ctx);
        function gp(k, suf) { return cols.map(function (c, i) { return { v: num(c[k]), est: c.est || "", x: A.estacaM(c.est), rot: "seção " + (i + 1) + (suf || "") }; }).filter(function (p) { return ok(p.v); }); }
        var lm = g.largura || "semFalta";
        var lmin = lm === "pm" ? larg - 0.10 : larg, lmax = ok(larg) ? larg + 0.10 : NaN;
        ctx.linhas.push(A.avaliar({ id: "larg", criterio: "Largura da plataforma", secao: g.secao + " a", unid: "m", casas: 2, pontos: gp("larg"), min: lmin, max: lmax,
          obrigMin: lm === "semFalta", exigido: ok(larg) ? (lm === "pm" ? "projeto ± 0,10 m (" : lm === "semFalta" ? "projeto a +0,10 m, sem falta (" : "projeto a +0,10 m (") + fmt(lmin, 2) + " a " + fmt(lmax, 2) + " m)" : undefined,
          aplica: ok(larg), naoAplicaPor: "informe a largura de projeto", refs: refs, tabelaK: K }));
        if (!decl || P.secaoT === "abaul") {
          var fl = num(P.flechaProj);
          ctx.linhas.push(A.avaliar({ id: "flecha", criterio: "Flecha de abaulamento", secao: g.secao + " b", unid: "cm", casas: 1, pontos: gp("flecha"), min: fl, max: ok(fl) ? fl * 1.2 : NaN,
            obrigMin: true, exigido: ok(fl) ? "projeto a +20 %, sem falta (" + fmt(fl, 1) + " a " + fmt(fl * 1.2, 1) + " cm)" : undefined, aplica: ok(fl), naoAplicaPor: "informe a flecha de projeto", refs: refs, tabelaK: K }));
        } else {
          var dp = num(P.declProj);
          ctx.linhas.push(A.avaliar({ id: "decl", criterio: "Declividade transversal (caimento simples)", secao: g.secao + " b", unid: "%", casas: 1, pontos: gp("dle", " LE").concat(gp("dld", " LD")),
            min: dp, max: ok(dp) ? dp + 0.5 : NaN, obrigMin: true, exigido: ok(dp) ? "projeto a +0,5 %, sem falta (" + fmt(dp, 1) + " a " + fmt(dp + 0.5, 1) + " %)" : undefined,
            aplica: ok(dp), naoAplicaPor: "informe a declividade de projeto", refs: refs, tabelaK: K }));
        }
        var le = A.avaliar({ id: "esp", criterio: "Espessura da camada", secao: g.secao + " c", unid: "cm", casas: 1, pontos: gp("esp"), min: ok(espP) ? espP * 0.9 : NaN, max: ok(espP) ? espP * 1.1 : NaN,
          exigido: ok(espP) ? "projeto ± 10 % (" + fmt(espP * 0.9, 1) + " a " + fmt(espP * 1.1, 1) + " cm)" : undefined, aplica: ok(espP), naoAplicaPor: "informe a espessura de projeto", refs: refs, tabelaK: K });
        le.grafico = true;
        ctx.linhas.push(le);
        if (g.espLim && ok(espP)) {
          var el = g.espLim;
          if ((ok(el.min) && espP < el.min - EPS) || (ok(el.max) && espP > el.max + EPS))
            ctx.avisos.push("Espessura de projeto de " + fmt(espP, 1) + " cm: " + el.texto + " (" + el.secao + ").");
        }
        if (!ok(larg)) ctx.avisos.push("Informe a largura de projeto (controle geométrico, " + g.secao + " a).");
        if (!ok(espP)) ctx.avisos.push("Informe a espessura de projeto (controle geométrico, " + g.secao + " c).");
        var espGeo = num(P.espGeo) > 0 ? num(P.espGeo) : 20;
        ctx.freqs.push(frequenciaDe({ ensaio: "Controle geométrico (seções)", metodo: "—", por: "pontos", a_cada: espGeo, minimo: 1, regra: "eixo e bordas; 1 seção a cada " + fmt(espGeo, 0) + " m (adotado)", secao: g.secao }, ctx, usadas.length));
        // medição: volume com largura e espessura médias do controle geométrico, limitado ao projeto
        var largM = media(cols.map(function (c) { return num(c.larg); })), espM = media(cols.map(function (c) { return num(c.esp); }));
        var vExec = ok(L.ext) && ok(largM) && ok(espM) ? L.ext * largM * espM / 100 : NaN;
        var vProj = ok(L.ext) && ok(larg) && ok(espP) ? L.ext * larg * espP / 100 : NaN;
        ctx.R.med = { largM: largM, espM: espM, vExec: vExec, vProj: vProj, vMed: ok(vExec) && ok(vProj) ? Math.min(vExec, vProj) : vExec };
      },
    };
  };

  // ------------------------------------------------------------------------------------------------------------
  // construtor da ficha
  // ------------------------------------------------------------------------------------------------------------
  G2.criar = function (cfg) {
    var grupos = cfg.grupos || [], verif = cfg.verificacoes || [];
    var usaPlano = grupos.some(function (g) { return [].concat(((g.cfg || {}).freq) || []).some(function (f) { return f && f.por === "plano"; }); }) || cfg.usaPlano;
    var usaJorn = cfg.usaJornada !== false;
    var params = [
      { k: "estIni", r: "Estaca inicial do lote", ph: "ex.: 40 ou 40 + 10,00" },
      { k: "estFim", r: "Estaca final do lote", ph: "ex.: 55" },
      { k: "ext", r: "Extensão do lote (m) — opcional", dica: "se vazia, calculada pelas estacas (20 m)" },
      { k: "largura", r: "Largura de projeto da plataforma (m)", dica: "controle geométrico e área do lote" },
      { k: "espessura", r: "Espessura de projeto da camada compactada (cm)", dica: cfg.dicaEspessura || "tolerância ± 10 %" },
    ];
    if (cfg.porFaixa) params.push({ k: "nFaixas", r: "Faixas de tráfego executadas no lote", ph: "1", dica: "as frequências da ES são por extensão de faixa de tráfego" });
    if (usaJorn) params.push({ k: "jornadas", r: cfg.rotuloJornadas || "Jornadas / dias de trabalho no lote", ph: "1" });
    if (usaPlano) params.push({ k: "espPlano", r: cfg.rotuloPlano || "Plano de amostragem: 1 determinação de umidade e de GC a cada … m — opcional", dica: cfg.dicaPlano || "a ES remete ao plano aprovado pela Fiscalização; vazio = mínimo de cada ensaio (5 para os avaliados estatisticamente)" });
    params.push({ k: "hOt", r: "Umidade ótima de referência (%) — opcional", dica: "se vazia, média das umidades ótimas da tabela de compactação" });
    params = params.concat(cfg.params || []);
    grupos.forEach(function (g) {
      var ps = g.paramsDe ? g.paramsDe(cfg) : g.params || [];
      params = params.concat(ps);
    });
    // chaves únicas (a última definição vence)
    var vistos = {};
    params = params.reverse().filter(function (p) { if (vistos[p.k]) return false; vistos[p.k] = 1; return true; }).reverse();

    function aplicaV(v, P) { return !v.se || v.se(P); }
    function tabelas(d) {
      var P = d.params || {}, T = [];
      grupos.forEach(function (g) {
        var t = g.tabelas ? g.tabelas(P, cfg) : g.tabela(P);
        [].concat(t || []).forEach(function (x) { if (x) T.push(x); });
      });
      if (verif.length) {
        if (Array.isArray(d.verif)) while (d.verif.length < verif.length) d.verif.push({});
        T.push({ chave: "verif", titulo: "Verificações e inspeções (insumos, execução, cura)", rotulo: "Item", iniciais: verif.length, min: verif.length, fixo: true,
          nomes: verif.map(function (v) { return v.texto + " (" + v.secao + ")" + (aplicaV(v, P) ? "" : " — não se aplica"); }),
          dica: "uma coluna por item da ES: \"S\" (atende) ou \"N\"; ou o nº de verificações realizadas e de não conformes",
          linhas: [{ k: "atende", r: "Atende? (S / N)", texto: true }, { k: "real", r: "Verificações realizadas", u: "nº" },
            { k: "nc", r: "Verificações não conformes", u: "nº" }, { k: "obs", r: "Observação", texto: true }] });
      }
      return T;
    }
    function calcular(d) {
      var P = d.params || {}, L = A.lote(P, { crescente: true }), avisos = [];
      if (!ok(L.ext)) avisos.push("Informe as estacas inicial e final (ou a extensão) do lote: as frequências dependem da extensão.");
      if (ok(L.ini) && ok(L.fim) && L.fim <= L.ini && !ok(num(P.ext))) avisos.push("A estaca final deve ser maior que a inicial.");
      var nF = Math.max(1, Math.round(num(P.nFaixas)) || 1), jorn = Math.max(1, Math.round(num(P.jornadas)) || 1);
      var comp = (d.comp || []).filter(function (c) { return ok(num(c.hot)); });
      var hRef = ok(num(P.hOt)) ? num(P.hOt) : media(comp.map(function (c) { return num(c.hot); }));
      var ctx = { d: d, P: P, L: L, cfg: cfg, nFaixas: cfg.porFaixa ? nF : 1, jornadas: jorn, hRef: hRef, linhas: [], freqs: [], avisos: avisos, tab: {}, R: {} };
      if (cfg.antes) cfg.antes(ctx);
      grupos.forEach(function (g) { g.calcular(ctx); });
      // verificações sim / não
      verif.forEach(function (v, i) {
        var c = (d.verif || [])[i] || {}, sn = simNao(c.atende), real = num(c.real), nc = num(c.nc);
        if (!ok(real)) real = sn === null ? (ok(nc) ? nc : 0) : 1;
        if (!ok(nc)) nc = sn === false ? 1 : 0;
        if (nc > real) real = nc;
        var l = A.linha({ id: "v_" + v.id, grupo: "", criterio: v.texto, secao: v.secao, exigido: v.exigido || "conforme a ES", n: real, txtEstat: "—", semMedia: true,
          resultado: real ? (real - nc) + " de " + real + " conforme(s)" + (c.obs ? " — " + c.obs : "") : "—" });
        if (!aplicaV(v, P)) { l.situacao = "nao_exigido"; l.motivo = v.naoAplicaPor || "não se aplica"; }
        else if (!real) A.marcar(l, "sem_dados", "não verificado");
        else if (nc > 0) A.marcar(l, v.falha || "nao_conforme", nc + " de " + real + " verificação(ões) não conforme(s)" + (c.obs ? " — " + c.obs : ""));
        else l.motivo = real + " verificação(ões) conforme(s)" + (c.obs ? " — " + c.obs : "");
        ctx.linhas.push(l);
      });
      if (cfg.depois) cfg.depois(ctx);
      ctx.freqs.forEach(function (f) { if (f.situacao === "insuficiente") avisos.push("Frequência: " + f.ensaio + " — " + f.realizado + " de " + f.exigido + " exigida(s) (" + f.regra + ")."); });
      var nMinK = (cfg.tabelaK || A.K_DNIT)[0][0];
      var nota = ctx.linhas.filter(function (l) { return (l.situacao === "conforme" || l.situacao === "ressalva") && /^valores individuais \(n </.test(l.regra || ""); }).map(function (l) { return l.criterio; });
      var par = A.parecer(ctx.linhas, ctx.freqs, { textos: cfg.textos, providencias: cfg.providencias,
        nota: nota.length ? "Avaliados por valor individual (n < " + nMinK + ", fora da " + ((cfg.refs || {}).tabela || "tabela de k") + "): " + nota.join("; ") + "." : "" });
      var R = ctx.R;
      R.lote = L; R.linhas = ctx.linhas; R.freqs = ctx.freqs; R.parecer = par; R.hRef = hRef; R.conforme = par.parecer === "ACEITO" || par.parecer === "RESSALVA";
      return { tab: ctx.tab, resultados: R, avisos: avisos };
    }
    function cartoes(r) {
      var L = r.lote, m = r.med || {};
      return '<div class="fe-res">' +
        A.cartao(ok(L.ext) ? fmt(L.ext, 0) + " m" : "—", "Extensão do lote" + (ok(L.ini) && ok(L.fim) ? " (est. " + A.fmtEstaca(L.ini, { simples: true }) + " a " + A.fmtEstaca(L.fim, { simples: true }) + ")" : "")) +
        A.cartao(ok(L.area) ? fmt(L.area, 0) + " m²" : "—", "Área (extensão × largura de projeto)") +
        A.cartao(ok(r.hRef) ? fmt(r.hRef, 1) + " %" : "—", "Umidade ótima de referência") +
        A.cartao(ok(m.vMed) ? fmt(m.vMed, 1) + " m³" : "—", "Volume para medição (" + (cfg.secaoMedicao || "8") + ")" + (ok(m.vExec) && ok(m.vProj) && m.vExec > m.vProj ? " — limitado ao projeto" : "")) +
        "</div>";
    }
    var gGran = grupos.filter(function (g) { return g.tipo === "granulometria"; })[0];
    function resultadosHtml(calc) {
      var r = calc.resultados, gh = gGran ? gGran.html(r, false) : "";
      return A.htmlParecer(r.parecer) + cartoes(r) +
        '<h4 style="margin:12px 0 4px">Critérios de aceitação</h4>' + A.htmlCriterios(r.linhas, { estilo: "estatistico" }) +
        '<h4 style="margin:12px 0 4px">Frequência dos ensaios</h4>' + A.htmlFrequencia(r.freqs) +
        (gh ? '<h4 style="margin:12px 0 4px">Granulometria por peneira</h4>' + gh : "");
    }
    function graficos(calc, d, opt) {
      var r = calc.resultados, out = [];
      r.linhas.forEach(function (l) { if (l.grafico && l.est && l.n) { var s = A.graficoLinha(l, opt); if (s) out.push(s); } });
      if (gGran) { var s = gGran.grafico(r, d, opt); if (s) out.push(s); }
      return out.length ? out : ['<div class="fe-graf-vazio">Os gráficos aparecem com os resultados do lote.</div>'];
    }
    var K = cfg.tabelaK || A.K_DNIT;
    var notaK = "Conformidade (" + (cfg.refs || {}).regra + "): X̄ − k·s ≥ valor mínimo e X̄ + k·s ≤ valor máximo, X̄ = Σxᵢ/n e s = √[Σ(xᵢ − X̄)²/(n − 1)]; k da " +
      ((cfg.refs || {}).tabela || "tabela de amostragem variável") + ": " + K.map(function (x) { return "n = " + x[0] + " → " + fmt(x[1], 2); }).join("; ") +
      ". Critérios adotados pela ficha: n < " + K[0][0] + " → avaliação por valor individual; n não tabelado → k do n tabelado imediatamente inferior; n > " + K[K.length - 1][0] +
      " → k = " + fmt(K[K.length - 1][1], 2) + ". Com a estatística atendida, valores individuais fora do limite geram ressalva (corrigir o local), exceto onde a ES não tolera falta.";
    var F = {
      titulo: cfg.titulo, rotuloLink: "Aceitação de lote", resumo: cfg.resumo, blocos: [], params: params, padrao: cfg.padrao || {},
      tabelas: tabelas, calcular: calcular, resultadosHtml: resultadosHtml, graficos: graficos,
      relatorio: {
        notas: (cfg.notas ? cfg.notas + " " : "") + notaK,
        parametros: [["Critério de aceitação", cfg.codigo + ", " + (cfg.refs || {}).regra + " — controle estatístico com a " + ((cfg.refs || {}).tabela || "tabela de k")]],
        resultados: function (calc) {
          var r = calc.resultados, L = r.lote, m = r.med || {};
          var rows = [["Parecer do lote", r.parecer.titulo],
            ["Lote", (ok(L.ini) && ok(L.fim) ? "estaca " + A.fmtEstaca(L.ini, { simples: true }) + " a " + A.fmtEstaca(L.fim, { simples: true }) + " · " : "") + (ok(L.ext) ? fmt(L.ext, 0) + " m" : "—") + (ok(L.area) ? " · " + fmt(L.area, 0) + " m²" : "")]];
          if (cfg.linhasRelatorio) rows = rows.concat(cfg.linhasRelatorio(calc) || []);
          if (ok(m.largM) || ok(m.espM)) rows.push(["Largura / espessura médias (controle geométrico)", (ok(m.largM) ? fmt(m.largM, 2) + " m" : "—") + " / " + (ok(m.espM) ? fmt(m.espM, 1) + " cm" : "—")]);
          if (ok(m.vMed)) rows.push(["Volume para medição (" + (cfg.secaoMedicao || "8") + ")", fmt(m.vMed, 1) + " m³" + (ok(m.vExec) && ok(m.vProj) && m.vExec > m.vProj ? " (executado " + fmt(m.vExec, 1) + " m³, limitado ao projeto)" : "")]);
          return rows;
        },
        extraHtml: function (calc) {
          var r = calc.resultados, gh = gGran ? gGran.html(r, true) : "";
          return A.htmlParecer(r.parecer, { relat: true }) + "<h2>Critérios de aceitação</h2>" + A.htmlCriterios(r.linhas, { relat: true, estilo: "estatistico" }) +
            "<h2>Frequência dos ensaios</h2>" + A.htmlFrequencia(r.freqs, true) + (gh ? "<h2>Granulometria por peneira</h2>" + gh : "");
        },
      },
      exemplos: [],
    };
    if (cfg.norma) F.norma = cfg.norma;
    FE.FICHAS[cfg.id] = F;
    if (cfg.exemplos) F.exemplos = cfg.exemplos(F);
    return F;
  };

  // ------------------------------------------------------------------------------------------------------------
  // ajudas para os exemplos
  // ------------------------------------------------------------------------------------------------------------
  G2.ex = {
    importar: function (F, d, k, refs) { A.exemplos.importar(F.params, d, k, refs); },
    // seções geométricas por estaca: [largura, espessura, a, b] — a/b = declividades LE/LD, ou a = flecha
    secoes: function (ini, lista, flecha) {
      return lista.map(function (x, i) {
        var c = { est: String(ini + i), larg: A.nstr(x[0], 2), esp: A.nstr(x[1], 1) };
        if (flecha) c.flecha = A.nstr(x[2], 1); else { c.dle = A.nstr(x[2], 1); c.dld = A.nstr(x[3], 1); }
        return c;
      });
    },
    deflexoes: function (ini, vals, passo) {
      passo = passo || 1;
      return vals.map(function (v, i) { return { est: String(ini + i * passo), faixa: i % 2 ? "LD" : "LE", d0: String(v) }; });
    },
    // colunas simples: [[est, v1, v2...]] → [{est, k1: v1, k2: v2}]
    cols: function (ks, lista, extra) {
      return lista.map(function (x, i) {
        var c = { est: String(x[0]) };
        ks.forEach(function (k, j) { if (x[j + 1] !== undefined && x[j + 1] !== null) c[k] = typeof x[j + 1] === "number" ? A.nstr(x[j + 1], k === "gs" || k === "gref" ? 3 : String(x[j + 1]).split(".")[1] ? String(x[j + 1]).split(".")[1].length : 0) : String(x[j + 1]); });
        if (extra) Object.keys(extra).forEach(function (k) { c[k] = typeof extra[k] === "function" ? extra[k](i) : extra[k]; });
        return c;
      });
    },
    verif: function (n, nao) {
      var v = [];
      for (var i = 0; i < n; i++) v.push({ atende: nao && nao.indexOf(i) >= 0 ? "N" : "S" });
      return v;
    },
  };

  FE.aceitacaoG2 = G2;

  // ==============================================================================================================
  // Agregados adicionais das reciclagens (DNIT 167/2013, 166/2013, 169/2014-ES) — só quando houver adição
  // ==============================================================================================================
  // o: {sec5 (requisitos), sec7 (frequências), lamelar (167: lamelaridade < 20 %)}
  G2.agregados = function (o) {
    var ag = function (P) { return P.agreg === "sim"; };
    return [
      G2.valores({ chave: "agg", titulo: "Agregado graúdo adicional", secao: o.sec5 + " / " + o.sec7 + " a", rotulo: "Ensaio", se: ag,
        dica: "um ensaio antes do início da utilização e sempre que variar a natureza do material",
        importar: { k: "impLA", r: "Abrasão Los Angeles — importar (DNIT 451)", de: "dnit-451-2024-me",
          map: function (e) { var r = e.resultados || {}; return ok(r.A) ? [{ est: "", reg: A.importacao.rotulo(e, r.g ? "graduação " + r.g : ""), la: A.nstr(Math.round(r.A), 0) }] : []; } },
        campos: [
          { k: "la", r: "Desgaste Los Angeles (DNER-ME 035 → DNIT 451)", u: "%", casas: 0, crit: { criterio: "Desgaste Los Angeles do agregado graúdo", max: 55, individual: true,
            exigido: "≤ 55 % (maior, só com desempenho satisfatório comprovado ou ensaios específicos)", pos: function (l, P) {
              if (l.situacao === "nao_conforme" && P.laDesemp === "sim") { l.situacao = "ressalva"; l.motivo += " — admitido por desempenho satisfatório comprovado (" + o.sec5 + ") — anexar a comprovação"; l.motivos = [{ situacao: "ressalva", texto: l.motivo }]; }
            } } },
          { k: "if", r: "Índice de forma (DNER-ME 086)", u: "", casas: 2, crit: { criterio: "Índice de forma do agregado graúdo", min: 0.5, individual: true } },
          o.lamelar ? { k: "lam", r: "Partículas lamelares (DNER-ME 086)", u: "%", casas: 0, crit: { criterio: "Índice de lamelaridade", max: 20, individual: true, exigido: "< 20 %" } } : null,
          { k: "dur", r: "Durabilidade — perda (DNER-ME 089)", u: "%", casas: 1, crit: { criterio: "Durabilidade do agregado graúdo (perda)", max: 12, individual: true, exigido: "< 12 %" } },
        ].filter(Boolean),
        freq: [{ ensaio: "Los Angeles / forma / durabilidade", metodo: "DNIT 451, DNER-ME 086, 089", secao: o.sec7 + " a", por: "lote", minimo: 1, conta: ["la"], regra: "1 no início da utilização e a cada variação do material" }] }),
      G2.valores({ chave: "ea", titulo: "Agregado miúdo adicional (pó de pedra) — equivalente de areia", secao: o.sec5 + " / " + o.sec7 + " b", rotulo: "Ensaio", se: ag,
        importar: { k: "impEA", r: "Equivalente de areia — importar (DNIT 450)", de: "dnit-450-2024-me",
          map: function (e) { var r = e.resultados || {}; return ok(r.ea) ? [{ est: loc(A.importacao.ident(e)), reg: A.importacao.rotulo(e), ea: A.nstr(r.ea, 0) }] : []; } },
        campos: [{ k: "ea", r: "Equivalente de areia (DNER-ME 054 → DNIT 450)", u: "%", casas: 0, crit: { criterio: "Equivalente de areia do agregado miúdo", min: 40 } }],
        freq: { ensaio: "Equivalente de areia", metodo: "DNIT 450", secao: o.sec7 + " b", por: "jornada", unid: "dia de trabalho" } }),
    ];
  };
  G2.paramsAgregados = [
    { k: "agreg", r: "Houve adição de agregados?", tipo: "select", recarrega: true, opcoes: [["nao", "Não"], ["sim", "Sim — agregado graúdo e/ou miúdo adicional"]] },
    { k: "laDesemp", r: "LA > 55 %: desempenho satisfatório comprovado?", tipo: "select", opcoes: [["nao", "Não"], ["sim", "Sim — admitido"]], se: function (d) { return (d.params || {}).agreg === "sim"; } },
  ];

  // ==============================================================================================================
  // Reciclagens com espuma de asfalto — DNIT 166/2013-ES (in situ) e DNIT 169/2014-ES (em usina)
  // ==============================================================================================================
  // o: {id, codigo, titulo, resumo, usina, s: {espuma, agreg5, agreg7, tab1, rt, umid, mist, gc, espum7, fin, geo, defl, espLim},
  //     freqMist (frequência dos controles da mistura), rtCura, rtCPs, verificacoes, notas, exemplos}
  G2.espumaAsfalto = function (o) {
    var s = o.s, fm = o.freqMist;
    function fMist(ens, met, conta, extra) { var f = Object.assign({ ensaio: ens, metodo: met, secao: s.mist }, fm, extra || {}); if (conta) f.conta = conta; return f; }
    var grupos = [
      o.usina ? G2.umidade({ secao: s.umid, modo: "info", criterio: "Umidade da mistura: Δw = w − h ót (informativo)", titulo: "Teor de umidade da mistura (após água e homogeneização)", exigido: "umidade ótima ou ligeiramente acima",
        motivoInfo: "a ES não fixa tolerância numérica (" + s.umid + ": \"umidade ótima, ou ligeiramente acima\")", freq: fMist("Teor de umidade da mistura", "DNIT 456") })
        : G2.umidade({ secao: s.umid, modo: "rel", faixa: [0.9, 1.1], criterio: "Umidade da mistura: w / h ót", titulo: "Teor de umidade da mistura (após água e homogeneização)",
          dica: "tolerada umidade entre 0,9 e 1,1 vez a do ensaio de compactação do trecho", freq: fMist("Teor de umidade da mistura", "DNIT 456") }),
      G2.valores({ chave: "comp", titulo: "Referências de compactação: Proctor modificado e CPs Marshall (75 golpes)", secao: s.mist + (o.usina ? " a, e" : " b, f"), rotulo: "Amostra",
        dica: "GC em relação à MAIOR massa específica entre o Proctor modificado e o Marshall (" + s.gc + " b)",
        importar: { k: "impComp", r: "Compactação — importar (DNIT 164, energia modificada)", de: ["dnit-164-2013-me", "dnit-172-2016-me"], map: G2.map.compactacao },
        campos: [
          { k: "gs", r: "γs,máx — Proctor modificado (DNIT 164)", u: "g/cm³", casas: 3, crit: { criterio: "γs,máx Proctor modificado", informativo: true, exigido: "referência" } },
          { k: "hot", r: "Umidade ótima", u: "%", casas: 1 },
          { k: "gm", r: "Massa específica aparente — CPs Marshall (72 h a " + o.rtCura + ")", u: "g/cm³", casas: 3, crit: { criterio: "Massa específica aparente dos CPs Marshall", informativo: true, exigido: "referência" } },
        ],
        freq: [fMist("Compactação (Proctor modificado)", "DNIT 164", ["gs"]),
          fMist("Massa específica dos CPs Marshall", o.usina ? "DNER-ME 117" : "—", ["gm"], o.usina ? { por: "lote", minimo: 1, regra: "mín. 2 CPs por traço" } : {})] }),
      G2.valores({ chave: "gc", titulo: "Grau de compactação na pista (frasco de areia)", secao: s.gc, rotulo: "Furo", posicao: true,
        dica: "DNER-ME 092 (hoje DNIT 458); GC ≥ 100 % da maior massa específica (Proctor modificado ou Marshall 75 golpes)",
        importar: { k: "impGC", r: "Grau de compactação — importar furos (DNIT 458, DNER-ME 036, DNIT 417)", de: ["dnit-458-2025-me", "dner-me-036-94", "dnit-417-2019-me"], map: G2.map.gc },
        campos: [{ k: "gc", r: "Grau de compactação (GC)", u: "%", casas: 1, crit: { criterio: "Grau de compactação", secao: s.gc + " b", min: 100, grafico: true } },
          { k: "w", r: "Umidade do furo (informativa)", u: "%" }, { k: "gref", r: "γs de referência usado no GC", u: "g/cm³" }],
        freq: { ensaio: "Grau de compactação", metodo: "DNER-ME 092 → DNIT 458", secao: s.gc + " a", por: "faixa", a_cada: 250, ouJornada: true, conta: ["gc"] },
        extra: function (ctx, cols) {
          var comp = ctx.d.comp || [], gs = media(comp.map(function (c) { return num(c.gs); })), gm = media(comp.map(function (c) { return num(c.gm); }));
          var ref = Math.max(ok(gs) ? gs : -1, ok(gm) ? gm : -1);
          if (ref <= 0) return;
          var bx = cols.filter(function (c) { return ok(num(c.gc)) && ok(num(c.gref)) && num(c.gref) < ref - 0.0015; });
          if (bx.length) ctx.avisos.push("GC calculado com γs de referência menor que a maior massa específica do lote (" + fmt(ref, 3) + " g/cm³, " + s.gc + " b) em " + bx.length + " furo(s): recalcule o GC com a referência maior.");
        } }),
      G2.granulometria({ secao: s.tab1 + " / " + s.mist + (o.usina ? " c" : " d"), obrig: true, titulo: "Granulometria do material reciclado — % passando",
        dica: "faixa da Tabela 1 e faixa de trabalho = projeto ± tolerância", freq: fMist("Granulometria", o.usina ? "DNER-ME 083" : "DNIT 412") }),
      G2.valores({ chave: "bet", titulo: "Teor de betume do material reciclado", secao: s.mist + (o.usina ? " c" : " d"), rotulo: "Amostra",
        campos: [{ k: "tb", r: "Teor de betume", u: "%", casas: 2, crit: { criterio: "Teor de betume", informativo: true, proj: function (P) { return num(P.betProj); },
          exigido: "conforme projeto", motivoInfo: "a ES não fixa tolerância — comparar com o projeto da mistura" } }],
        freq: fMist("Teor de betume", o.usina ? "DNIT 158" : "—", ["tb"]) }),
      G2.valores({ chave: "rt", titulo: "Resistência à tração indireta (compressão diametral) a 25 °C — CPs Marshall 75 golpes, 72 h a " + o.rtCura, secao: s.rt + " / " + s.mist + (o.usina ? " d" : " e"), rotulo: "Conjunto",
        dica: o.rtCPs + "; DNIT 136. Seca ≥ 0,25 MPa; saturada ≥ 0,15 MPa",
        importar: { k: "impRT", r: "Tração indireta — importar (DNIT 136: seca; DNIT 180: seca e condicionada)", de: ["dnit-136-2018-me", "dnit-180-2018-me"],
          map: function (e) {
            var r = e.resultados || {}, i = A.importacao.ident(e);
            if (e.ficha === "dnit-180-2018-me") return [{ est: loc(i), reg: A.importacao.rotulo(e), ncp: String((r.nC || 0) + (r.nN || 0)), rts: ok(r.rt) ? A.nstr(r.rt, 2) : "", rtu: ok(r.rtc) ? A.nstr(r.rtc, 2) : "" }];
            return ok(r.rt) ? [{ est: loc(i), reg: A.importacao.rotulo(e), ncp: String(r.n || ""), rts: A.nstr(r.rt, 2), rtu: "" }] : [];
          } },
        texto: [{ k: "ncp", r: "Nº de CPs do conjunto", texto: false }],
        campos: [{ k: "rts", r: "RT seca (média)", u: "MPa", casas: 2, crit: { criterio: "Resistência à tração indireta seca", secao: s.rt, min: 0.25, grafico: true } },
          { k: "rtu", r: "RT saturada (média)", u: "MPa", casas: 2, crit: { criterio: "Resistência à tração indireta saturada", secao: s.rt, min: 0.15 } }],
        freq: fMist("Tração indireta (seca e saturada)", "DNIT 136", ["rts"]) }),
      G2.valores({ chave: "esp", titulo: "Espuma de asfalto — taxa de expansão e meia-vida", secao: s.espuma + " / " + s.espum7, rotulo: "Ensaio",
        campos: [{ k: "exp", r: "Taxa de expansão (vezes o volume original)", u: "", casas: 0, crit: { criterio: "Taxa de expansão da espuma", secao: s.espuma + " a", min: 10 } },
          { k: "mv", r: "Meia-vida", u: "s", casas: 0, crit: { criterio: "Meia-vida da espuma", secao: s.espuma + " b", min: 8 } }],
        freq: { ensaio: "Taxa de expansão e meia-vida", metodo: "—", secao: s.espum7, por: "faixa", a_cada: 500, ouJornada: true, conta: ["exp"], regra: "a cada 500 m de faixa ou por jornada de 8 h" } }),
      G2.valores({ chave: "fin", titulo: o.usina ? "Filler — cimento: finura (NBR 11579)" : "Cimento Portland — finura (NBR 11579)", secao: s.fin, rotulo: "Ensaio",
        campos: [{ k: "res", r: "Finura — resíduo na peneira 75 µm", u: "%", casas: 1, crit: { criterio: "Finura do cimento", informativo: true, exigido: "DNER-EM 036 (a ES não fixa o limite)" } }],
        freq: o.usina ? { ensaio: "Finura do cimento", metodo: "NBR 11579", secao: s.fin, por: "jornada", unid: "jornada de 8 h", se: function (P) { return P.filler !== "cal"; }, naoRegra: "filler de cal hidratada" }
          : { ensaio: "Finura do cimento", metodo: "NBR 11579", secao: s.fin, por: "faixa", a_cada: 250 } }),
    ];
    if (!o.usina) grupos.push(G2.valores({ chave: "cim", titulo: "Quantidade de cimento incorporada", secao: s.mist + " a", rotulo: "Det.",
      campos: [{ k: "taxa", r: "Cimento incorporado", u: "kg/m²", casas: 1, crit: { criterio: "Quantidade de cimento incorporada", informativo: true, proj: function (P) { return num(P.taxaProj); },
        exigido: "conforme dosagem", motivoInfo: "a ES não fixa tolerância: comparar com a dosagem" } }],
      freq: fMist("Quantidade de cimento incorporada", "massa ou volume", ["taxa"]) }),
      G2.valores({ chave: "mr", titulo: "Módulo de resiliência da mistura", secao: s.mist + " h", rotulo: "Ensaio",
        campos: [{ k: "mr", r: "Módulo de resiliência (DNIT 135)", u: "MPa", casas: 0, crit: { criterio: "Módulo de resiliência", informativo: true, proj: function (P) { return num(P.mrProj); },
          exigido: "registrar (a ES não fixa limite)" } }],
        freq: { ensaio: "Módulo de resiliência", metodo: "DNIT 135", secao: s.mist + " h", por: "lote", minimo: 2, regra: "2 por traço de mistura executado" } }));
    grupos = grupos.concat(G2.agregados({ sec5: s.agreg5, sec7: s.agreg7 }));
    grupos.push(G2.deflexao({ secao: s.defl, modo: "complementar" }), G2.geometria({ secao: s.geo, largura: "excesso", espLim: s.espLim }));
    return G2.criar({
      id: o.id, codigo: o.codigo, titulo: o.titulo, resumo: o.resumo, grupos: grupos, porFaixa: true, tabelaK: G2.K_PRO277,
      refs: { reprova: "7.4.2 a", atende: "7.4.2 a", corrige: "7.4.2 c", regra: "7.4.2", tabela: "Tabela 1 da DNER-PRO 277/97" },
      rotuloJornadas: "Jornadas de 8 h de trabalho no lote", dicaEspessura: "tolerância ± 10 % (7.3 c)",
      params: [
        o.usina ? { k: "filler", r: "Filler da mistura", tipo: "select", opcoes: [["cim", "Cimento Portland"], ["cal", "Cal hidratada CH-I"]] } : null,
        { k: "betProj", r: "Teor de betume de projeto (%) — opcional" },
        o.usina ? null : { k: "taxaProj", r: "Cimento de projeto (kg/m²) — opcional" },
        o.usina ? null : { k: "mrProj", r: "Módulo de resiliência de projeto (MPa) — opcional" },
      ].filter(Boolean).concat(G2.paramsAgregados),
      padrao: { nFaixas: "1", jornadas: "1", agreg: "nao", laDesemp: "nao", defl: "nao", secaoT: "simples", declProj: "3", espGeo: "20", filler: "cim" },
      verificacoes: o.verificacoes, notas: o.notas, exemplos: o.exemplos,
      textos: { REJEITADO: { titulo: "LOTE REJEITADO", texto: "Há critério não conforme (7.4.2 a). O serviço corrigido só é aceito se as correções o colocarem em conformidade com a norma; caso contrário, é rejeitado (7.4.2 c)." } },
    });
  };

  // ==============================================================================================================
  // Blocos comuns às DNIT 140/2022 e 142/2022-ES (solo melhorado com cimento — textos quase idênticos)
  // ==============================================================================================================
  G2.soloMelhorado = function (o) {
    // o: {id, codigo, camada, expMax, iscMin, energia, metodoC, gcMin (número ou null), gcTxt, secGC, faixaRef, notas, exemplos, resumo, titulo, NOTAdefl}
    var emp = function (P) { return P.dimens !== "mec"; }, mec = function (P) { return P.dimens === "mec"; };
    var iscCtrl = function (P) { return emp(P) && P.iscCtrl !== "nao"; };
    var grupos = [
      G2.umidade({ secao: "5.4.4 / 7.3.2 a", modo: "pp", tol: 1, dica: "imediatamente antes da compactação; admitido h ót ± 1 (5.4.4)",
        freq: { ensaio: "Teor de umidade antes da compactação", metodo: "DNER-ME 052 / 088 → DNIT 456", secao: "7.3.2 a, 7.5", por: "plano", minimo: 5, motivoMin: "menor n da Tabela " + o.tabela } }),
      G2.valores({ chave: "comp", titulo: "Compactação (" + o.energia + "), expansão e ISC da mistura", secao: "5.2 / 7.3.2 a", rotulo: "Amostra",
        dica: "DNIT 164 (" + o.metodoC + ") e DNIT 172; o ISC só é exigido no controle se especificado em projeto",
        importar: { k: "impComp", r: "Compactação, expansão e ISC — importar (DNIT 172 / DNIT 164)", de: ["dnit-172-2016-me", "dnit-164-2013-me"], map: G2.map.compactacao,
          dica: "a DNIT 172 traz γs,máx, h ót, ISC e expansão; a 164 só γs,máx e h ót" },
        campos: [
          { k: "gs", r: "γs,máx (DNIT 164)", u: "g/cm³", casas: 3, crit: { criterio: "Massa específica aparente seca máxima (referência do GC)", informativo: true, exigido: "referência" } },
          { k: "hot", r: "Umidade ótima", u: "%", casas: 1 },
          { k: "exp", r: "Expansão (DNIT 172)", u: "%", casas: 2, crit: { criterio: "Expansão", secao: "5.2", max: o.expMax } },
          { k: "isc", r: "ISC (DNIT 172)", u: "%", casas: 0, crit: { criterio: "Índice de Suporte Califórnia", secao: "5.2 / 7.3.2 a", min: o.iscMin, aplica: iscCtrl,
            naoAplicaPor: function (P) { return emp(P) ? "ISC não especificado em projeto para o controle (7.3.2 a)" : "projeto mecanicista (5.2)"; } } },
        ],
        freq: [{ ensaio: "Compactação (" + o.metodoC + ")", metodo: "DNIT 164", secao: "7.3.2 a", por: "plano", minimo: 1, conta: ["gs"] },
          { ensaio: "Expansão", metodo: "DNIT 172", secao: "7.3.2 a", por: "plano", minimo: 1, conta: ["exp"] },
          { ensaio: "Índice de Suporte Califórnia", metodo: "DNIT 172", secao: "7.3.2 a", por: "plano", minimo: 1, conta: ["isc"], se: iscCtrl, naoRegra: "não especificado em projeto" }] }),
      G2.valores({ chave: "gc", titulo: "Grau de compactação na pista", secao: o.secGC, rotulo: "Furo", posicao: true,
        dica: "massa específica in situ pela DNIT 458 (antiga DNER-ME 092), DNER-ME 036 ou DNIT 417",
        importar: { k: "impGC", r: "Grau de compactação — importar furos/pontos (DNIT 458, DNER-ME 036, DNIT 417)", de: ["dnit-458-2025-me", "dner-me-036-94", "dnit-417-2019-me"], map: G2.map.gc,
          dica: "cada furo/ponto vira uma coluna, com a estaca e a posição da ficha de origem" },
        campos: [{ k: "gc", r: "Grau de compactação (GC)", u: "%", casas: 1, crit: { criterio: "Grau de compactação", secao: o.secGC, grafico: true,
            min: function (P) { var x = num(P.gcMin); return ok(x) ? x : o.gcMin; }, semLimite: "pendente",
            exigido: function (P) { var x = num(P.gcMin); return ok(x) ? "≥ " + fmt(x, 1) + " %" + (o.gcMin === null ? " (valor adotado — a ES não fixa)" : "") : "≥ mínimo (a ES não fixa — informe)"; } } },
          { k: "w", r: "Umidade do furo (informativa)", u: "%" }, { k: "gref", r: "γs,máx de referência usado no GC", u: "g/cm³" }],
        freq: { ensaio: "Grau de compactação", metodo: "DNIT 458 / DNER-ME 036 / DNIT 417", secao: "7.3.2 b, 7.5", por: "plano", minimo: 5, motivoMin: "menor n da Tabela " + o.tabela, conta: ["gc"] } }),
      G2.valores({ chave: "pulv", titulo: "Grau de pulverização do solo — % passando na peneira nº 4 (4,8 mm)", secao: "5.4.1 b / 7.3.1 a", rotulo: "Det.",
        dica: "antes da aplicação do cimento; exige-se no mínimo 50 % passando na 4,8 mm",
        campos: [{ k: "p4", r: "Passando na nº 4 (4,8 mm)", u: "%", casas: 0, crit: { criterio: "Grau de pulverização (passando na 4,8 mm)", min: 50 } }],
        freq: { ensaio: "Grau de pulverização", metodo: "peneira nº 4", secao: "7.3.1 a, 7.5", por: "plano", minimo: 1 } }),
      G2.valores({ chave: "cim", titulo: "Quantidade de cimento incorporada e tempos de execução", secao: "7.3.1 b / 5.4.5", rotulo: "Det.",
        dica: "taxa de cimento verificada por peso ou volume; tempos contados a partir da adição da água",
        campos: [
          { k: "taxa", r: "Cimento incorporado", u: "kg/m²", casas: 1, crit: { criterio: "Quantidade de cimento incorporada", secao: "7.3.1 b", informativo: true,
            proj: function (P) { return num(P.taxaProj); }, exigido: function (P) { return ok(num(P.taxaProj)) ? "≈ " + fmt(num(P.taxaProj), 1) + " kg/m² (projeto)" : "conforme dosagem"; },
            motivoInfo: "a ES não fixa tolerância: comparar com a dosagem" } },
          { k: "t1", r: "Tempo adição da água → início do espalhamento", u: "h", casas: 2, crit: { criterio: "Tempo água → início do espalhamento", secao: "5.4.5", max: 1, individual: true, falha: "ressalva",
            exigido: "≤ 1 h (mais, só comprovado por ensaios e a critério da Fiscalização)" } },
          { k: "t2", r: "Tempo adição da água → fim da compactação", u: "h", casas: 2, crit: { criterio: "Tempo água → fim da compactação", secao: "5.4.5", max: 3, individual: true,
            exigido: "≤ 3 h em qualquer hipótese" } },
        ],
        freq: { ensaio: "Quantidade de cimento incorporada", metodo: "peso ou volume", secao: "7.3.1 b, 7.5", por: "plano", minimo: 1, conta: ["taxa"] } }),
      G2.valores({ chave: "fin", titulo: "Cimento — finura (resíduo na peneira nº 200)", secao: "7.1 c, d", rotulo: "Ensaio",
        dica: "ABNT NBR 16372; no mínimo um ensaio por dia de trabalho, antes do uso",
        campos: [{ k: "res", r: "Resíduo na peneira nº 200 (0,075 mm)", u: "%", casas: 1, crit: { criterio: "Resíduo do cimento na peneira nº 200", secao: "7.1 d", individual: true,
          max: function (P) { return P.tipoCim === "comum" ? 15 : 10; }, exigido: function (P) { return P.tipoCim === "comum" ? "≤ 15 % (cimento Portland comum)" : "≤ 10 % (cimento de alto-forno)"; } } }],
        freq: { ensaio: "Finura do cimento", metodo: "ABNT NBR 16372", secao: "7.1 c", por: "jornada", unid: "dia de trabalho" } }),
      G2.limites({ secao: "5.2", ll: 25, ip: 6, aplica: emp, naoAplicaPor: "projeto mecanicista (5.2)",
        freq: { secao: "5.2 (caracterização — mín. 1 por lote, adotado)", por: "lote", minimo: 1 } }),
      G2.valores({ chave: "mr", titulo: "Módulo de resiliência da mistura (triplicata)", secao: "7.2 / 7.3.2 a", rotulo: "Ensaio", se: mec,
        dica: "DNIT 134 (triplicata) a cada 1500 m, ou confirmação com equipamento de campo calibrado",
        campos: [{ k: "mr", r: "Módulo de resiliência (média da triplicata)", u: "MPa", casas: 0, crit: { criterio: "Módulo de resiliência", informativo: true,
          proj: function (P) { return num(P.mrProj); }, tolProj: function (P) { return num(P.mrTol); },
          msgProj: "submeter à Supervisora/Projetista (7.2, NOTA " + o.notaMR + ")",
          exigido: function (P) { return ok(num(P.mrProj)) ? "≈ " + fmt(num(P.mrProj), 0) + " MPa (sem variação significativa)" : "conforme projeto"; } } }],
        freq: { ensaio: "Módulo de resiliência", metodo: "DNIT 134", secao: "7.3.2 a", por: "extensao", a_cada: 1500 } }),
      G2.deflexao({ secao: "7.3.3", modo: "estat", cada40: true }),
      G2.geometria({ secao: "7.4", largura: "semFalta", espLim: { min: 10, max: 20, secao: "5.4.6", texto: "a camada compactada deve ter entre 10 e 20 cm; acima de 20 cm, subdividir em camadas de no mínimo 10 cm" } }),
    ];
    if (o.faixaRef) grupos.splice(4, 0, G2.granulometria({ secao: "5.1.3 / Anexo A", obrig: false, projeto: false, secaoRef: "Anexo A, NOTA 2",
      titulo: "Granulometria do solo (ou solo + material granular) — % passando", dicaFaixa: "NOTA 2: faixas exemplificativas — só informam",
      freq: { secao: "5.1.3 (seleção do solo — adotado 1 por lote)", por: "lote", minimo: 1, se: function () { return false; }, naoRegra: "referência (Anexo A informativo)" } }));
    return G2.criar({
      id: o.id, codigo: o.codigo, titulo: o.titulo, resumo: o.resumo, grupos: grupos,
      refs: { reprova: "7.6 b", atende: "7.6 a", corrige: "7.6", regra: "7.6", tabela: "Tabela " + o.tabela },
      dicaEspessura: "entre 10 e 20 cm (5.4.6); tolerância ± 10 % (7.4 c)",
      params: [
        { k: "dimens", r: "Dimensionamento do pavimento (5.2)", tipo: "select", recarrega: true,
          opcoes: [["emp", "Empírico — ISC, LL e IP exigidos"], ["mec", "Mecanicista — MR e DP conforme projeto"]] },
        { k: "iscCtrl", r: "ISC no controle da execução (7.3.2 a)", tipo: "select", se: function (d) { return emp(d.params || {}); },
          opcoes: [["sim", "Especificado em projeto — exigido"], ["nao", "Não especificado — só na dosagem (5.2)"]] },
        { k: "gcMin", r: "Grau de compactação mínimo (%)", ph: o.gcMin === null ? "a ES não fixa" : String(o.gcMin), dica: o.gcTxt },
        { k: "tipoCim", r: "Tipo de cimento (7.1 d)", tipo: "select", opcoes: [["af", "Portland de alto-forno — resíduo ≤ 10 %"], ["comum", "Portland comum — resíduo ≤ 15 %"]] },
        { k: "taxaProj", r: "Cimento de projeto (kg/m²) — opcional", dica: "para comparar a quantidade incorporada (7.3.1 b)" },
        { k: "mrProj", r: "Módulo de resiliência de projeto (MPa)", se: function (d) { return mec(d.params || {}); } },
        { k: "mrTol", r: "Variação admitida do MR em relação ao projeto (%) — opcional", se: function (d) { return mec(d.params || {}); },
          dica: "a ES só diz \"não deve variar de forma significativa\" (7.2): vazio = só informa o desvio" },
      ],
      padrao: { dimens: "emp", iscCtrl: "sim", gcMin: o.gcMin === null ? "100" : String(o.gcMin), tipoCim: "comum", defl: "exigido", secaoT: "simples", declProj: "3", espGeo: "20", jornadas: "1" },
      verificacoes: [
        { id: "cert", texto: "Cimento com certificado do fabricante (DNER-EM 036) em cada carregamento", secao: "4 b / 7.1 a" },
        { id: "tipo", texto: "Cimento do mesmo tipo usado na dosagem", secao: "7.1 b" },
        { id: "exp", texto: "Segmento experimental aprovado pela Fiscalização", secao: "4 d, e" },
        { id: "chuva", texto: "Sem execução em dias de chuva", secao: "4 a" },
        { id: "mist", texto: "Mistura: projeto mecanicista — MR (triplicata) e DP antes da obra, sem variação significativa", secao: "7.2", se: mec, naoAplicaPor: "projeto empírico" },
        { id: "junta", texto: "Etapa única em toda a largura (sem juntas longitudinais); juntas transversais adequadas", secao: "5.4.8" },
        { id: "cura", texto: "Cura com emulsão (RR-2C ou EAI, DNIT 165) por ≥ 7 dias antes da camada seguinte", secao: "5.4.9" },
        { id: "acab", texto: "Acabamento só em corte (sem correção de depressões com material)", secao: "5.4.7" },
      ],
      textos: {
        RESSALVA: { titulo: "LOTE ACEITO COM RESSALVAS", texto: "Os critérios de aceitação (7.6) são atendidos, mas há pontos a corrigir ou a documentar: \"todo detalhe incorreto ou mal executado deve ser corrigido\" (7.6)." },
        REJEITADO: { titulo: "LOTE REJEITADO", texto: "Há critério não conforme (7.6 b). O serviço corrigido só é aceito se as correções o colocarem em conformidade com a norma; caso contrário, é rejeitado (7.6)." },
      },
      notas: o.notas, exemplos: o.exemplos,
    });
  };

  // ==============================================================================================================
  // DNIT 140/2022-ES — Sub-base de solo melhorado com cimento
  // ==============================================================================================================
  var ID = "dnit-140-2022-es";
  G2.soloMelhorado({
    id: ID, codigo: "DNIT 140/2022-ES", tabela: "A1", energia: "energia intermediária", metodoC: "Método B", expMax: 1, iscMin: 30,
    gcMin: null, secGC: "7.3.2 b", notaMR: "3",
    gcTxt: "a DNIT 140/2022-ES NÃO fixa o GC mínimo (7.3.2 b só manda determinar); padrão 100 % adotado — confirme no projeto/plano",
    titulo: "Sub-base de solo melhorado com cimento — aceitação de lote",
    resumo: "Reúne os ensaios do lote (importados das fichas ME ou digitados), confere a frequência e aplica os critérios da DNIT 140/2022-ES: umidade (h ót ± 1), " +
      "expansão ≤ 1 %, ISC ≥ 30 %, LL ≤ 25 %, IP ≤ 6 % (projeto empírico), grau de compactação, pulverização ≥ 50 %, tempos, finura do cimento, MR (mecanicista), " +
      "deflexão (Dc ≤ LSE) e controle geométrico, com o controle estatístico de 7.6 (Tabela A1).",
    notas: "DNIT 140/2022-ES. GC: a norma não fixa valor mínimo (7.3.2 b) — a ficha usa o parâmetro \"GC mínimo\" (padrão 100 %, adotado). " +
      "Umidade: \"± 1 %\" da h ót lido como ± 1 ponto percentual. Frequências: a ES remete ao plano de amostragem (7.5, DNER-PRO 277); sem plano informado, " +
      "a ficha exige 5 determinações (menor n da Tabela A1) de umidade e GC e 1 dos demais; MR a cada 1500 m (7.3.2 a); finura ≥ 1 por dia (7.1 c); " +
      "deflexão ≥ 15 (7.3.3). Métodos citados e substituídos: DNER-ME 092 → DNIT 458; DNER-ME 052/088 → DNIT 456.",
    exemplos: function (F) {
      var X = G2.ex;
      function base(reg, extra) {
        return { ident: Object.assign({ registro: reg, data: "2026-08-10", obra: "Obra A — BR-000", origem: "Jazida 1 + cimento do Fornecedor A", camada: "Sub-base de solo melhorado com cimento (3 %)" }, extra.ident || {}),
          params: Object.assign({}, F.padrao, extra.params), umid: [{}], comp: [{}], gc: [{}], pulv: [{}], cim: [{}], fin: [{}], lim: [{}], obs: "" };
      }
      return [
        { nome: "Lote aceito — sub-base 3 % de cimento, 200 m (ensaios dos exemplos ME + campo digitado)", dados: function () {
          var d = base("LOTE-SMC-01", { ident: { trecho: "Lote 1 — pista direita", local: "Est. 100 a 110" },
            params: { estIni: "100", estFim: "110", largura: "8,40", espessura: "15", lse: "85", jornadas: "2", taxaProj: "7,0" } });
          X.importar(F, d, "impComp", [["dnit-172-2016-me", 0]]);
          d.comp[0].est = "104";
          d.comp.push({ est: "108", reg: "ISC-0612 · DNIT 172 (digitado)", gs: "1,921", hot: "13,4", isc: "88", exp: "0,05" });
          d.umid = X.cols(["w"], [["101", 13.2], ["103", 14.1], ["105", 13.9], ["107", 12.9], ["109", 13.6]], { reg: "Campo — Speedy" });
          d.gc = [["101", "LE", 100.9], ["102", "eixo", 101.6], ["104", "LD", 100.4], ["106", "LE", 102.0], ["107", "eixo", 101.2], ["109", "LD", 100.8]]
            .map(function (x, i) { return { est: x[0], pos: x[1], reg: "DNIT 458 — furo " + (i + 1), gc: A.nstr(x[2], 1) }; });
          d.pulv = X.cols(["p4"], [["102", 68], ["106", 71]], { reg: "Peneira nº 4" });
          d.cim = X.cols(["taxa", "t1", "t2"], [["101", 7.1, 0.6, 2.1], ["106", 6.9, 0.8, 2.4]], { reg: "Bandeja / tempos" });
          d.fin = X.cols(["res"], [["canteiro", 9.8], ["canteiro", 10.6]], { reg: "NBR 16372" });
          X.importar(F, d, "impLim", [["dner-me-082-94", 0]]);
          d.defl = X.deflexoes(100, [62, 58, 66, 71, 60, 55, 68, 64, 59, 73, 61, 57, 66, 63, 69, 60], 0.625);
          d.defl.forEach(function (c, i) { c.est = A.fmtEstaca(2000 + i * 12.5, { simples: true }); });
          d.geo = X.secoes(100, [[8.44, 15.3, 3.1, 3.0], [8.42, 14.8, 3.2, 3.1], [8.46, 15.6, 3.0, 3.2], [8.41, 14.5, 3.1, 3.1], [8.45, 15.1, 3.3, 3.0], [8.43, 15.4, 3.2, 3.1],
            [8.40, 14.9, 3.0, 3.2], [8.44, 15.2, 3.1, 3.1], [8.47, 15.0, 3.2, 3.0], [8.42, 14.6, 3.3, 3.2], [8.43, 15.5, 3.1, 3.1]]);
          d.verif = X.verif(8);
          d.obs = "Exemplo: compactação/ISC (DNIT 172) e LL/IP (DNER-ME 082) importados dos exemplos das fichas ME; umidade, GC, pulverização, tempos, finura, deflexões e geometria digitados.";
          return d;
        } },
        { nome: "Lote rejeitado — umidade, GC e expansão fora; deflexão acima do LSE; frequência incompleta", dados: function () {
          var d = base("LOTE-SMC-02", { ident: { trecho: "Lote 2", local: "Est. 200 a 215" },
            params: { estIni: "200", estFim: "215", largura: "7,20", espessura: "18", lse: "80", tipoCim: "af", espPlano: "40" } });
          X.importar(F, d, "impComp", [["dnit-172-2016-me", 1]]);
          d.comp[0].est = "205";
          d.umid = X.cols(["w"], [["201", 13.4], ["204", 15.9], ["208", 11.8], ["211", 14.6], ["214", 12.2]], { reg: "Campo — Speedy", hot: "13,6" });
          X.importar(F, d, "impGC", [["dnit-458-2025-me", 1]]);
          d.gc.forEach(function (c, i) { c.est = String(201 + 3 * i); });
          d.gc.push({ est: "213", pos: "LD", reg: "DNIT 458 — furo digitado", gc: "97,8" });
          d.pulv = X.cols(["p4"], [["203", 47]], { reg: "Peneira nº 4" });
          d.cim = X.cols(["taxa", "t1", "t2"], [["202", 6.1, 1.4, 3.3]], { reg: "Bandeja / tempos" });
          d.fin = X.cols(["res"], [["canteiro", 11.2]], { reg: "NBR 16372" });
          X.importar(F, d, "impLim", [["dner-me-082-94", 1]]);
          d.defl = X.deflexoes(200, [72, 88, 79, 95, 70, 84, 91, 76, 82, 99, 74, 86, 80, 93, 77, 85]);
          d.geo = X.secoes(200, [[7.24, 17.1, 3.1, 3.0], [7.18, 16.2, 2.9, 3.1], [7.26, 17.4, 3.0, 3.2], [7.22, 15.9, 3.1, 3.0], [7.21, 16.5, 3.2, 3.1], [7.25, 17.0, 3.0, 3.1],
            [7.23, 16.1, 3.1, 3.0], [7.22, 16.8, 3.0, 3.2], [7.26, 15.8, 3.2, 3.1], [7.21, 16.4, 3.1, 3.0], [7.24, 17.2, 3.0, 3.1], [7.22, 16.0, 3.1, 3.2],
            [7.25, 16.6, 3.2, 3.0], [7.23, 15.7, 3.0, 3.1], [7.24, 16.9, 3.1, 3.1], [7.22, 16.3, 3.0, 3.0]]);
          d.verif = X.verif(8, [6]);
          d.verif[6].obs = "cura interrompida no 4º dia";
          d.obs = "Exemplo de reprovação: umidade fora de h ót ± 1, GC abaixo do mínimo adotado, expansão > 1 % e LL/IP acima (solo do exemplo DNER-ME 082 nº 2), pulverização < 50 %, tempos acima do limite, Dc > LSE, espessura média baixa e cura não conforme.";
          return d;
        } },
      ];
    },
  });
})();
