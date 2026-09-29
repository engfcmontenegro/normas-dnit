/*
 * Fichas de ES — ACEITAÇÃO DE LOTE das misturas asfálticas usinadas a quente do grupo 3:
 *   DNIT 112/2009-ES (CA com asfalto-borracha), DNIT 032/2005-ES (areia-asfalto a quente), DNIT 033/2021-ES (CA reciclado
 *   em usina), DNIT 034/2005-ES (CA reciclado no local), DNER-ES 386/99 (camada porosa de atrito com asfalto polímero),
 *   DNER-ES 387/99 (areia-asfalto com asfalto polímero) e DNER-ES 388/99 (micro pré-misturado com asfalto polímero).
 *
 * Este arquivo (o primeiro do grupo no index.html) traz o MOTOR COMUM, exposto em FE.aceitacaoG3.criar(cfg), e a ficha
 * da DNIT 112/2009-ES. As outras seis fichas (es-dnit-032-2005-es.js ... es-dner-es-388-99.js) só passam a configuração
 * da sua ES. O motor usa a biblioteca FE.aceitacao (es-comum.js): linhas de critério, A.avaliar (valores individuais /
 * X̄ ± k·s), A.frequencia, A.parecer, HTML, gráficos e importação.
 *
 * O que o motor verifica (cada ES liga o que exige, com a sua seção e os seus limites):
 *  - usinagem: teor de ligante = projeto ± 0,3 % (extrações DNER-ME 053, importáveis); granulometria do agregado extraído
 *    na faixa de trabalho = curva de projeto ± tolerâncias da ES, limitada pela faixa (peneira a peneira);
 *    CPs Marshall da produção (Vv, RBV ou VAM, estabilidade, fluência), resistência à tração (DNIT 136, antiga DNER-ME 138),
 *    desgaste Cantabro (DNER-ME 383);
 *  - temperaturas: ligante, agregados, mistura na saída e no início da compactação (limites absolutos da ES e ± 5 °C do
 *    projeto);
 *  - execução: grau de compactação (CPs extraídos DNIT 428 ou densímetro DNIT 431) e espessura;
 *  - produto: alinhamentos (± 5 cm), acabamento com réguas de 3,00 m e 1,20 m (≤ 0,5 cm), irregularidade (QI), condições
 *    de segurança (pêndulo britânico, mancha de areia, IFI) quando a ES as exige;
 *  - insumos (contagem de ensaios × frequência da ES) e condições gerais (chuva, temperatura ambiente).
 *  - controle estatístico: DNIT (7.5): X̄ − k·s ≥ mín. e/ou X̄ + k·s ≤ máx., Tabela de amostragem variável (n = 5…21);
 *    DNER-ES 386/387/388 (7.4.2): só nos itens que a ES lista, com a tabela própria (sem n = 11) e no mínimo 5 determinações
 *    por jornada. Com n < 5, valores individuais.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media, G = FE.granulometria;
  var RHO = 0.9971;  // DNIT 428 eq. 7: MEa = 0,9971 × Gmb (densímetro DNIT 431 → Gmb)
  var EPS = 1e-9;
  var nstr = A.nstr, fmtR = A.fmtR, dataBR = A.dataBR, lim = A.txtLimites;

  // Tabela de amostragem variável das DNER-ES 386, 387 e 388/99 (7.2.1.5): igual à das ES do DNIT, mas SEM n = 11
  var K_DNER = [[5, 1.55, 0.45], [6, 1.41, 0.35], [7, 1.36, 0.30], [8, 1.31, 0.25], [9, 1.25, 0.19], [10, 1.21, 0.15],
    [12, 1.16, 0.10], [13, 1.13, 0.08], [14, 1.11, 0.06], [15, 1.10, 0.05], [16, 1.08, 0.04], [17, 1.06, 0.03], [19, 1.04, 0.02], [21, 1.01, 0.01]];

  // ---------- utilidades ----------
  function perto(a, b) { return Math.abs(a - b) / b < 0.04; }
  function faixaDe(P) { return G.faixasDisponiveis().filter(function (f) { return f.id === P.faixa; })[0] || null; }
  // % passando numa peneira: chave exata ou peneira equivalente (4,75 ≈ 4,8; 0,425 ≈ 0,42; 19,0 ≈ 19,1 ...)
  function lerPass(u, mm) {
    var v = num(u[G.chavePen(mm)]);
    if (ok(v)) return v;
    var ks = Object.keys(u || {});
    for (var i = 0; i < ks.length; i++) {
      var m = /^r(\d+)(?:_(\d+))?$/.exec(ks[i]);
      if (!m) continue;
      var x = Number(m[1] + (m[2] ? "." + m[2] : ""));
      if (perto(x, mm)) { v = num(u[ks[i]]); if (ok(v)) return v; }
    }
    return NaN;
  }
  function u2(u) { return u ? " " + u : ""; }
  function contar(arr, k) { return (arr || []).filter(function (p) { return ok(num(p[k])); }).length; }
  function rotEst(p, i, pref) { return p.est ? "est. " + p.est : p.carga || p.reg || (pref || "det.") + " " + (i + 1); }
  function pontos(arr, k, pref, fx) {
    return (arr || []).map(function (p, i) {
      var v = fx ? fx(p, i) : num(p[k]);
      return { v: v, est: p.est || "", x: A.estacaM(p.est, { estrito: true }), rot: rotEst(p, i, pref) };
    }).filter(function (p) { return ok(p.v); });
  }
  function sim(v) { return v === "sim"; }
  function impDica(t) { return "marque os ensaios e clique em \"Importar selecionados\": " + t + " (substitui as colunas importadas antes; as colunas digitadas e o que foi digitado nas importadas são mantidos)"; }

  // avaliação individual com limites próprios de cada ponto ({v, min, max, rot}) — temperaturas
  function indivPts(cfg, pts) {
    var l = A.linha({ id: cfg.id, grupo: cfg.grupo, criterio: cfg.criterio, secao: cfg.secao, unid: cfg.unid || "", casas: cfg.casas || 0, exigido: cfg.exigido });
    var v = pts.filter(function (p) { return ok(p.v); });
    l.n = v.length; l.pontos = v;
    if (!v.length) { l.situacao = "sem_dados"; l.motivo = "sem determinações"; return l; }
    var xs = v.map(function (p) { return p.v; });
    l.media = media(xs); l.s = NaN; l.semMedia = false; l.txtEstat = "individual";
    l.resultado = (v.length > 1 ? fmt(Math.min.apply(null, xs), l.casas) + " a " + fmt(Math.max.apply(null, xs), l.casas) : fmt(xs[0], l.casas)) + u2(l.unid);
    var fora = v.filter(function (p) { return (ok(p.min) && p.v < p.min - EPS) || (ok(p.max) && p.v > p.max + EPS); });
    l.fora = fora;
    if (fora.length) A.marcar(l, cfg.falha || "ressalva", fora.length + " de " + v.length + " fora: " + fora.map(function (p) {
      return p.rot + " " + fmt(p.v, l.casas) + u2(l.unid) + " (" + lim(p.min, p.max, 0, l.unid) + ")";
    }).join("; ") + (cfg.sufixo ? " — " + cfg.sufixo : ""));
    else l.motivo = "todos os valores individuais atendem";
    return l;
  }

  // =====================================================================================
  // MOTOR
  // =====================================================================================
  function criar(cfg) {
    var ID = cfg.id, COD = cfg.codigo, dner = cfg.estat === "dner";
    var OPT_K = dner ? { tabelaK: K_DNER, nMin: 5 } : {};
    var TAB_K = dner ? "tabela de amostragem variável, " + cfg.secK : "tabela de amostragem variável, " + cfg.secK;
    var REFS = cfg.refs;
    function refs(extra) { return Object.assign({ tabela: TAB_K }, REFS, extra || {}); }
    // avaliação de um requisito: modo "estat" (X̄ ± ks com a tabela da ES; n < 5 → individual), "indiv" (individual, reprova),
    // "ressalva" (individual; fora → ressalva)
    function aval(o, modo) {
      var c = Object.assign({ refs: refs(o.refs) }, OPT_K, o);
      if (modo === "indiv") { c.individual = true; }
      if (modo === "ressalva") { c.individual = true; c.falha = "ressalva"; }
      return A.avaliar(c);
    }

    function rolamento(P) { return cfg.rolamento ? cfg.rolamento(P) : true; }

    // ---------- parâmetros ----------
    var params = [
      { k: "estIni", r: "Estaca inicial do lote", ph: "ex.: 20+00", dica: "estaca de 20 m: 20+10,5 = 410,5 m" },
      { k: "estFim", r: "Estaca final do lote", ph: "ex.: 45+00" },
      { k: "ext", r: "Extensão do lote (m) — opcional", ph: "pelas estacas", dica: "vazio = diferença entre as estacas" },
      { k: "largura", r: "Largura executada (m)", dica: "com a extensão, dá a área do lote (frequências por m²)" },
      { k: "pista", r: "Pista / faixa / lado", ph: "ex.: pista direita, faixa 1" },
    ];
    if (cfg.camadas) params.push({ k: "camada", r: "Camada / emprego", tipo: "select", recarrega: true, opcoes: cfg.camadas, dica: cfg.dicaCamada || "" });
    params.push({ k: "faixa", r: "Faixa granulométrica do projeto (" + cfg.secFaixa + ")", tipo: "select", recarrega: true,
      opcoes: function () {
        return [["", "—"]].concat(G.faixasDisponiveis().filter(function (f) { return cfg.faixas.indexOf(f.id) >= 0; }).map(function (f) {
          return [f.id, (cfg.rotFaixa ? cfg.rotFaixa(f) : "Faixa " + f.faixa) + (f.condicao ? " — " + f.condicao : "")];
        }));
      },
      dica: "a curva de projeto vai na tabela \"Curva granulométrica de projeto\"; faixa de trabalho = projeto ± tolerâncias (" + cfg.secFaixa + "), sem ultrapassar a faixa" });
    params.push({ k: "teorProj", r: "Teor de ligante de projeto (%)", dica: cfg.dicaTeor || "tolerância ± 0,3 % (" + cfg.secTeor + ")" });
    if (cfg.fatorK) params.push({ k: "fatorK", r: "Fator k de correção do teor (borracha insolúvel) — certificado", ph: "ex.: 1,08",
      dica: "4 b e 7.2.1 a: o teor extraído (DNER-ME 053) é corrigido pelo fator k do fabricante; a ES não diz como — aqui: teor corrigido = teor extraído × k (ou digite o teor corrigido)" });
    if (cfg.polimero) params.push({ k: "pctPol", r: "Teor de polímero do ligante (%)", dica: "5.4.2: ligante a 150 °C + 3 °C por 1 % de polímero (máx. 180 °C); 5.4.6.4: compactação a 140 °C + 3 °C por 1 %" });
    if (cfg.vam) params.push({ k: "tnm", r: "Tamanho nominal máximo (VAM mínimo — " + cfg.vam.secao + ")", tipo: "select",
      opcoes: [["", "—"]].concat(Object.keys(cfg.vam.tab).map(function (k) { return [k, cfg.vam.nomes[k] || k]; })),
      dica: cfg.vam.dica || "a mistura atende se a RBV estiver na faixa OU o VAM for ≥ o mínimo" });
    if (cfg.gcMoldados) params.push({ k: "gcRef", r: "Referência do grau de compactação (7.2.2.2)", tipo: "select", recarrega: true,
      opcoes: [["projeto", "Densidade de projeto — GC ≥ 97 %"], ["moldados", "CPs moldados no local (autorizado pela Fiscalização) — GC ≥ 100 %"]] });
    params.push({ k: "gmbProj", r: "Densidade aparente de referência (Gmb)", dica: "projeto da mistura (ou média dos CPs moldados no local); GC = Gmb da pista / referência × 100" });
    params.push({ k: "espProj", r: "Espessura de projeto (cm)", dica: "± 5 % (" + cfg.secEsp + ")" });
    params = params.concat([
      { k: "tLig", r: "Temperatura do ligante indicada (°C)", ph: cfg.phTLig || "", dica: cfg.dicaTLig || "± 5 °C" },
      { k: "tAgr", r: "Temperatura dos agregados indicada (°C) — opcional", dica: "vazio: ligante + 10 a 15 °C" },
      { k: "tMist", r: "Temperatura da mistura na saída do misturador indicada (°C)", dica: "± 5 °C" },
      { k: "tComp", r: "Temperatura indicada para a compactação (°C)", ph: cfg.phTComp || "", dica: cfg.dicaTComp || "espalhamento / início da compactação: ± 5 °C" },
    ]);
    (cfg.params || []).forEach(function (p) { params.push(p); });
    params = params.concat([
      { k: "dataIni", r: "Início da execução do lote", tipo: "date" },
      { k: "dataFim", r: "Fim da execução do lote", tipo: "date" },
      { k: "jornadas", r: "Jornadas de 8 h de produção no lote", dica: cfg.dicaJornada || "frequências por jornada de 8 h" },
      { k: "massa", r: "Massa de mistura aplicada (t) — opcional", dica: "medição em toneladas (8)" },
      { k: "nCarreg", r: "Carregamentos de ligante recebidos no período", dica: "ensaios de 7.1.1 em todo carregamento" },
      { k: "massaLig", r: "Ligante recebido no período (t)", dica: cfg.dicaMassaLig || "ensaios a cada 100 t" },
      { k: "nSilos", r: "Silos quentes (frações) em uso", ph: "3", dica: "granulometria de cada silo quente (7.1.2)", se: function () { return !!cfg.silos; } },
      { k: "chuva", r: "Houve execução com chuva?", tipo: "select", opcoes: [["", "—"], ["sim", "Sim"], ["nao", "Não"]], dica: "não permitida (" + cfg.secChuva + ")" },
      { k: "tAmb", r: "Menor temperatura ambiente durante a execução (°C) — opcional", dica: "> 10 °C (" + cfg.secChuva + ")" },
    ]);
    // importações
    params.push({ k: "impUsina", r: "Extrações (teor + granulometria)", tipo: "importarVarios", de: ["dner-me-053-94", "dnit-412-2025-me"],
      dica: impDica("DNER-ME 053 (teor e granulometria do agregado recuperado) ou DNIT 412 (só granulometria)"),
      aplicar: function (lista, P, d) { A.importacao.substituir(d, "usina", lista.map(colUsina).filter(Boolean)); } });
    if (cfg.marshall) params.push({ k: "impMar", r: "CPs Marshall da produção (controle)", tipo: "importarVarios", de: "dnit-385-2026-es",
      dica: impDica("ficha de dosagem Marshall com um só teor (modo controle); dosagens com vários teores são ignoradas"),
      aplicar: function (lista, P, d) {
        var ign = [], cols = [];
        lista.forEach(function (e) {
          var i = e.dados.ident || {}, t = ((e.resultados || {}).teores) || [];
          if (t.length !== 1) { ign.push((i.registro || "sem registro") + " (" + t.length + " teores)"); return; }
          var u = t[0];
          cols.push({ reg: i.registro || "", data: dataBR(i.data), teor: nstr(u.teor, 2), gmb: nstr(u.gmb, 4), vv: nstr(u.vv, 2), rbv: nstr(u.rbv, 1),
            vam: nstr(u.vam, 2), est: nstr(u.est, 0), flu: nstr(u.flu, 2), ncp: String(u.n) });
        });
        P.impMarIgn = ign.join("; ");
        A.importacao.substituir(d, "mar", cols);
      } });
    if (cfg.rt) params.push({ k: "impRt", r: "Resistência à tração (RT)", tipo: "importarVarios", de: "dnit-136-2018-me", dica: impDica("DNIT 136 (antiga DNER-ME 138)"),
      aplicar: function (lista, P, d) {
        A.importacao.substituir(d, "rt", lista.map(function (e) {
          var i = e.dados.ident || {}, r = e.resultados || {};
          return { reg: i.registro || "", data: dataBR(i.data), rt: nstr(r.rt, 2),
            obs: r.pista ? "CPs extraídos da pista" : r.criterio === false ? "individual a mais de ± 10 % da média (DNIT 136)" : "" };
        }));
      } });
    if (cfg.cantabro) params.push({ k: "impCant", r: "Desgaste Cantabro", tipo: "importarVarios", de: "dner-me-383-99", dica: impDica("DNER-ME 383"),
      aplicar: function (lista, P, d) {
        A.importacao.substituir(d, "cant", lista.map(function (e) {
          var i = e.dados.ident || {}, r = e.resultados || {};
          return { reg: i.registro || "", data: dataBR(i.data), a: nstr(r.a, 0), obs: (e.dados.params || {}).teor ? "teor " + e.dados.params.teor + " %" : "" };
        }));
      } });
    params.push({ k: "impPista", r: "Pista — CPs extraídos ou densímetro", tipo: "importarVarios", de: ["dnit-428-2022-me", "dnit-431-2020-me"],
      dica: impDica("DNIT 428 (Gmb e altura de cada CP extraído) ou DNIT 431 (densidade corrigida de cada ponto; Gmb = densidade / 0,9971)"),
      aplicar: function (lista, P, d) {
        var cols = [];
        lista.forEach(function (e) {
          var i = e.dados.ident || {}, r = e.resultados || {};
          if (e.ficha === "dnit-428-2022-me") {
            (r.cps || []).forEach(function (o) {
              if (!o.valido) return;
              cols.push({ est: i.local && /^\d+(\s*\+\s*[\d.,]+)?$/.test(String(i.local).trim()) ? i.local : "", pos: "CP " + o.nome, reg: (i.registro || "") + " — DNIT 428", gmb: nstr(o.gmb, 4), esp: nstr(o.H, 2) });
            });
          } else {
            (r.pts || []).forEach(function (o) {
              if (!ok(o.corr)) return;
              cols.push({ est: o.estaca || "", pos: o.posicao || "", reg: (i.registro || "") + " — DNIT 431", gmb: nstr(o.corr / RHO, 4) });
            });
          }
        });
        A.importacao.substituir(d, "pista", cols);
      } });

    // coluna da tabela de usinagem a partir de uma extração (053) ou granulometria (412)
    function colUsina(e) {
      var i = e.dados.ident || {}, col = { reg: i.registro || "", data: dataBR(i.data), per: i.local || "" };
      var med = null;
      if (e.ficha === "dner-me-053-94") {
        var c = FE.FICHAS[e.ficha].calcular(e.dados);
        col.teor = nstr(c.resultados.teor, 2);
        col.orig = "DNER-ME 053/94";
        med = c.gr ? c.gr.resultados.media : null;
      } else {
        col.orig = "DNIT 412 (sem teor)";
        med = (e.resultados || {}).media;
      }
      (med || []).forEach(function (m) { if (ok(m.pass)) col[G.chavePen(m.mm)] = nstr(m.pass, 1); });
      return col;
    }

    // ---------- tabelas ----------
    function tabelas(d) {
      var P = d.params || {}, fx = faixaDe(P), T = [], pens = fx ? fx.peneiras : [];
      T.push({ chave: "proj", titulo: "Curva granulométrica de projeto — % passando", rotulo: "Curva", iniciais: 1, min: 1, fixo: true, nomes: ["Projeto"],
        dica: fx ? "do projeto da mistura (faixa " + fx.faixa + ")" : "escolha a faixa do projeto nos parâmetros",
        linhas: pens.map(function (p) { return { k: G.chavePen(p.mm), r: p.nome + " — " + fmt(p.mm, p.mm < 1 ? 3 : 1) + " mm (faixa " + p.min + "–" + p.max + ")", u: "%" }; }) });
      var lu = [{ k: "reg", r: "Registro", texto: true }, { k: "data", r: "Data", texto: true }, { k: "per", r: "Jornada / hora / local da coleta", texto: true },
        { k: "orig", r: "Ensaio de origem", texto: true }, { k: "teor", r: cfg.fatorK ? "Teor extraído (DNER-ME 053)" : "Teor de ligante (DNER-ME 053)", u: "%" }];
      if (cfg.fatorK) lu.push({ k: "teorC", r: "Teor corrigido (vazio = extraído × k)", u: "%" }, { calc: "tCorr", r: "Teor considerado", u: "%", casas: 2 });
      lu.push({ calc: "dTeor", r: "Desvio do teor de projeto (± 0,3 %)", u: "%", casas: 2, destaque: true }, { grupo: "Agregado extraído — % passando (DNER-ME 083)" });
      T.push({ chave: "usina", titulo: "Usinagem — teor de ligante e granulometria do agregado extraído (" + cfg.secTeor + ", " + cfg.secGran + ")", rotulo: "Amostra", iniciais: 1, min: 1,
        dica: cfg.dicaUsina || "uma coluna por extração",
        linhas: lu.concat(pens.map(function (p) { return { k: G.chavePen(p.mm), r: p.nome + " — " + fmt(p.mm, p.mm < 1 ? 3 : 1) + " mm", u: "%" }; }))
          .concat([{ calc: "nFora", r: "Peneiras fora da faixa de trabalho", u: "nº", casas: 0, destaque: true }]) });
      if (cfg.marshall) {
        var M = cfg.marshall(P), lm = [{ k: "reg", r: "Registro", texto: true }, { k: "data", r: "Data / jornada", texto: true }, { k: "teor", r: "Teor de ligante", u: "%" },
          { k: "gmb", r: "Gmb (densidade aparente)", u: "—" }];
        M.itens.forEach(function (it) { lm.push({ k: it.k, r: it.nome + " (" + lim(it.min, it.max, it.casas, "") + ")", u: it.unid }); });
        if (M.vam && !M.itens.some(function (it) { return it.k === "vam"; })) lm.push({ k: "vam", r: "VAM (alternativa à RBV — " + cfg.vam.secao + ")", u: "%" }, { calc: "vamMin", r: "VAM mínimo", u: "%", casas: 1 });
        lm.push({ k: "ncp", r: "Nº de CPs", texto: true });
        T.push({ chave: "mar", titulo: "CPs Marshall da produção (" + M.secao + ")", rotulo: "Conjunto", iniciais: 1, min: 1, dica: M.dica, linhas: lm });
      }
      if (cfg.rt) T.push({ chave: "rt", titulo: "Resistência à tração por compressão diametral a 25 °C (" + cfg.rt.secao + ")", rotulo: "Ensaio", iniciais: 1, min: 1, dica: cfg.rt.dica,
        linhas: [{ k: "reg", r: "Registro", texto: true }, { k: "data", r: "Data / jornada", texto: true }, { k: "rt", r: "RT (média dos CPs)", u: "MPa" }, { k: "obs", r: "Observação", texto: true }] });
      if (cfg.cantabro) T.push({ chave: "cant", titulo: "Desgaste por abrasão Cantabro (" + cfg.cantabro.secao + ")", rotulo: "Ensaio", iniciais: 1, min: 1, dica: cfg.cantabro.dica,
        linhas: [{ k: "reg", r: "Registro", texto: true }, { k: "data", r: "Data / jornada", texto: true }, { k: "a", r: "Desgaste Cantabro (média de 3 CPs)", u: "%" }, { k: "obs", r: "Observação", texto: true }] });
      var TT = cfg.temps(P, true);
      T.push({ chave: "temp", titulo: "Temperaturas (" + cfg.secTemp + ")", rotulo: "Medição", iniciais: 1, min: 1, dica: "uma coluna por medição (hora / caminhão); deixe em branco o que não foi medido",
        linhas: [{ k: "carga", r: "Hora / caminhão / jornada", texto: true }].concat(TT.map(function (t) { return { k: t.k, r: t.nome, u: "°C" }; })) });
      T.push({ chave: "pista", titulo: "Pista — grau de compactação e espessura (" + cfg.secGC + ", " + cfg.secEsp + ")", rotulo: "Ponto", iniciais: 1, min: 1,
        dica: "CPs extraídos com broca rotativa em locais aleatórios (ou outro método indicado no projeto); a espessura pode vir do CP ou do nivelamento",
        linhas: [{ k: "est", r: "Estaca", texto: true }, { k: "pos", r: "Posição / CP", texto: true }, { k: "reg", r: "Registro / método", texto: true },
          { k: "gmb", r: "Gmb da pista (densidade aparente)", u: "—" }, { calc: "gc", r: "GC = Gmb pista / referência × 100", u: "%", casas: 1, destaque: true },
          { k: "esp", r: "Espessura", u: "cm" }, { calc: "dEsp", r: "Desvio da espessura de projeto (± 5 %)", u: "%", casas: 1 }] });
      var geo = [{ k: "est", r: "Estaca", texto: true }, { grupo: "Alinhamentos — desvio em relação à locação (± 5 cm)" }, { k: "aEixo", r: "Eixo", u: "cm" }, { k: "aBordo", r: "Bordo", u: "cm" },
        { grupo: "Acabamento — maior variação entre dois pontos de contato (≤ 0,5 cm)" }, { k: "r3", r: "Régua de 3,00 m (transversal)", u: "cm" }, { k: "r12", r: "Régua de 1,20 m (longitudinal)", u: "cm" }];
      T.push({ chave: "geo", titulo: "Alinhamentos e acabamento da superfície (" + cfg.secGeo + ")", rotulo: "Estaca", iniciais: 1, min: 1, dica: "uma coluna por estaca da locação", linhas: geo });
      if (cfg.qi || cfg.seg) {
        var sup = [{ k: "est", r: "Segmento / estaca", texto: true }];
        if (cfg.qi && cfg.qi.aplica(P)) sup.push({ k: "qi", r: "QI (contagens/km)", u: "cont/km" }, { k: "iri", r: "…ou IRI (QI = 13 × IRI)", u: "m/km" });
        var S = cfg.seg ? cfg.seg(P) : null;
        if (S) S.itens.forEach(function (it) { sup.push({ k: it.k, r: it.nome, u: it.unid }); });
        if (sup.length > 1) T.push({ chave: "sup", titulo: "Irregularidade" + (S ? " e condições de segurança" : "") + " (" + [cfg.qi && cfg.qi.aplica(P) ? cfg.qi.secao : "", S ? S.secao : ""].filter(Boolean).join(", ") + ")",
          rotulo: "Segmento", iniciais: 1, min: 1, dica: "uma coluna por segmento medido (escolhido aleatoriamente)", linhas: sup });
      }
      (cfg.tabelasExtra ? cfg.tabelasExtra(P) : []).forEach(function (t) { T.push(t); });
      var INS = cfg.insumos(P, lote(P));
      T.push({ chave: "ins", titulo: "Controle dos insumos (" + cfg.secIns + ") — contagem", rotulo: "Ensaio", iniciais: INS.length, min: INS.length, fixo: true,
        nomes: INS.map(function (x) { return x[1]; }), dica: "número de ensaios realizados no período do lote e quantos tiveram resultado fora da especificação",
        linhas: [{ calc: "exig", r: "Mínimo exigido no período", u: "nº", casas: 0 }, { k: "real", r: "Realizados", u: "nº" }, { k: "nc", r: "Com resultado fora da especificação", u: "nº" }] });
      return T;
    }

    // ---------- lote ----------
    function lote(P) {
      var L = A.lote(P, { estrito: true }), jor = num(P.jornadas);
      if (!ok(jor) && P.dataIni && P.dataFim) {
        var d0 = Date.parse(P.dataIni), d1 = Date.parse(P.dataFim);
        if (ok(d0) && ok(d1) && d1 >= d0) jor = Math.round((d1 - d0) / 864e5) + 1;
      }
      return Object.assign(L, { jor: jor, carreg: num(P.nCarreg), mLig: num(P.massaLig), silos: ok(num(P.nSilos)) ? num(P.nSilos) : 3, massa: num(P.massa) });
    }

    // ---------- faixa de trabalho ----------
    function faixaTrabalho(d, P, avisos) {
      var fx = faixaDe(P), proj = (d.proj || [])[0] || {};
      if (!fx) return { fx: null, trab: [] };
      var tolTab = fx.tolerancia || [];
      var trab = fx.peneiras.map(function (p) {
        var pv = num(proj[G.chavePen(p.mm)]), t = tolTab.filter(function (x) { return perto(p.mm, x.mm); })[0];
        var o = { mm: p.mm, nome: p.nome, fmin: p.min, fmax: p.max, proj: pv, tol: t ? t.tol : NaN, min: NaN, max: NaN, ajuste: "" };
        if (ok(pv)) {
          var a = ok(o.tol) ? pv - o.tol : pv, b = ok(o.tol) ? pv + o.tol : pv;
          if (a < p.min) { a = p.min; o.ajuste = "mín."; }
          if (b > p.max) { b = p.max; o.ajuste += (o.ajuste ? " e " : "") + "máx."; }
          o.min = a; o.max = b;
          if (pv < p.min - EPS || pv > p.max + EPS) avisos.push("Curva de projeto fora da faixa " + fx.faixa + " na peneira " + p.nome + " (" + fmt(pv, 1) + " %, faixa " + p.min + "–" + p.max + ") — " + cfg.secFaixa + ".");
        }
        return o;
      });
      var com = trab.filter(function (o) { return ok(o.proj); });
      if (!com.length) avisos.push("Informe a curva granulométrica de projeto para construir a faixa de trabalho (" + cfg.secFaixa + ").");
      else if (com.length < trab.length) avisos.push("Curva de projeto incompleta: " + (trab.length - com.length) + " peneira(s) sem % passando.");
      if (cfg.retido4) for (var j = 1; j < trab.length; j++) {
        if (ok(trab[j - 1].proj) && ok(trab[j].proj) && trab[j - 1].proj < 100 - EPS && trab[j - 1].proj - trab[j].proj < 4 - EPS)
          avisos.push("Curva de projeto: retido entre " + trab[j - 1].nome + " e " + trab[j].nome + " = " + fmt(trab[j - 1].proj - trab[j].proj, 1) + " % (< 4 % do total, " + cfg.retido4 + ").");
      }
      return { fx: fx, trab: trab };
    }

    // ---------- cálculo ----------
    function calcular(d) {
      var P = d.params || {}, L = lote(P), avisos = [], linhas = [], freqs = [], tab = {};
      var FT = faixaTrabalho(d, P, avisos), fx = FT.fx, trab = FT.trab;
      var teorProj = num(P.teorProj), gmbRef = num(P.gmbProj), espProj = num(P.espProj), J = L.jor;
      if (!ok(L.ext)) avisos.push("Informe as estacas inicial e final (ou a extensão) do lote.");
      if (!ok(L.area)) avisos.push("Informe a largura executada: frequências por área (m²) dependem dela.");
      if (!ok(J)) avisos.push("Informe as jornadas de 8 h de produção (ou as datas): frequências por jornada dependem delas.");
      if (!fx) avisos.push("Escolha a faixa granulométrica do projeto (" + cfg.secFaixa + ").");
      if (P.impMarIgn) avisos.push("Importação de CPs Marshall: ignorados os ensaios com mais de um teor (dosagem, não controle): " + P.impMarIgn + ".");
      var faixaTeor = cfg.teorFaixa ? cfg.teorFaixa(P, fx) : null;
      if (faixaTeor && ok(teorProj) && (teorProj < faixaTeor[0] - EPS || teorProj > faixaTeor[1] + EPS))
        avisos.push("Teor de projeto de " + fmt(teorProj, 2) + " % fora do intervalo da faixa (" + fmt(faixaTeor[0], 1) + " a " + fmt(faixaTeor[1], 1) + " %, " + cfg.secFaixa + ").");
      if (cfg.dmax && fx && ok(espProj)) {
        var dm = fx.peneiras.length ? Math.min.apply(null, fx.peneiras.filter(function (p) { return p.min >= 100 - EPS; }).map(function (p) { return p.mm; })) : NaN;
        if (ok(dm) && dm / 10 >= espProj * 2 / 3 - EPS) avisos.push("Diâmetro máximo da faixa " + fx.faixa + " (" + fmt(dm, 1) + " mm) não é inferior a 2/3 da espessura de projeto (" + fmt(espProj * 2 / 3 * 10, 1) + " mm) — " + cfg.dmax + ".");
      }
      if (cfg.espFaixa && fx) { var tx = cfg.espFaixa(fx, espProj); if (tx) avisos.push(tx); }
      var nJ = function (porJ, min) { return ok(J) ? Math.max(min || 1, Math.ceil(J * porJ - EPS)) : NaN; };

      // ---- condições gerais ----
      var cg = A.linha({ id: "cg", grupo: "Condições gerais", criterio: "Condições de execução (chuva, temperatura ambiente)", secao: cfg.secChuva, exigido: "sem chuva; temperatura ambiente > 10 °C", semMedia: true, txtEstat: "—" });
      var partes = [];
      if (P.chuva === "sim") { partes.push("execução com chuva"); A.marcar(cg, "ressalva", "houve execução com chuva — não permitida (" + cfg.secChuva + "); avaliar o trecho"); }
      else if (P.chuva === "nao") partes.push("sem chuva");
      var tAmb = num(P.tAmb);
      if (ok(tAmb)) { partes.push("mín. " + fmt(tAmb, 0) + " °C"); if (tAmb <= 10 + EPS) A.marcar(cg, "ressalva", "temperatura ambiente de " + fmt(tAmb, 0) + " °C — a ES exige > 10 °C (" + cfg.secChuva + ")"); }
      cg.resultado = partes.join("; ") || "—";
      if (partes.length) { if (cg.situacao === "conforme") cg.motivo = "atende"; linhas.push(cg); }

      // ---- teor de ligante ----
      var k = num(P.fatorK);
      var usina = (d.usina || []).map(function (u, i) {
        var o = { teorExt: num(u.teor) }, tc = num(u.teorC);
        o.teor = cfg.fatorK ? (ok(tc) ? tc : ok(o.teorExt) && ok(k) ? o.teorExt * k : o.teorExt) : o.teorExt;
        o.tCorr = cfg.fatorK ? o.teor : NaN;
        o.dTeor = ok(o.teor) && ok(teorProj) ? o.teor - teorProj : NaN;
        o.pass = trab.map(function (t) { return lerPass(u, t.mm); });
        o.temGran = o.pass.some(ok);
        o.fora = [];
        if (o.temGran) trab.forEach(function (t, j) {
          var v = o.pass[j];
          if (ok(v) && ok(t.min) && (v < t.min - EPS || v > t.max + EPS)) o.fora.push(t.nome + " " + fmt(v, 1) + " % (" + fmt(t.min, 0) + "–" + fmt(t.max, 0) + ")");
        });
        o.nFora = o.temGran && trab.some(function (t) { return ok(t.min); }) ? o.fora.length : NaN;
        o.rot = "amostra " + (i + 1) + (u.reg ? " (" + u.reg + ")" : "");
        return o;
      });
      tab.usina = usina;
      if (cfg.fatorK && usina.some(function (o) { return ok(o.teorExt); }) && !ok(k) && !(d.usina || []).some(function (u) { return ok(num(u.teorC)); }))
        avisos.push("Informe o fator k de correção do teor (4 b, 7.2.1 a): sem ele o teor extraído é comparado diretamente com o de projeto.");
      if (!ok(teorProj) && usina.some(function (o) { return ok(o.teor); })) avisos.push("Informe o teor de ligante de projeto.");
      var ptsTeor = usina.map(function (o, i) { return { v: o.teor, rot: "amostra " + (i + 1) }; }).filter(function (p) { return ok(p.v); });
      var lTeor = aval({ id: "teor", grupo: "Usinagem", criterio: "Teor de ligante" + (cfg.fatorK ? " (corrigido pelo fator k)" : ""), secao: cfg.secTeor, unid: "%", casas: 2,
        min: teorProj - 0.3, max: teorProj + 0.3, pontos: ptsTeor, exigido: ok(teorProj) ? fmt(teorProj, 2) + " ± 0,3 % (" + fmt(teorProj - 0.3, 2) + " a " + fmt(teorProj + 0.3, 2) + " %)" : "projeto ± 0,3 %" }, cfg.modoTeor || "estat");
      if (ptsTeor.length && !ok(teorProj)) A.marcar(lTeor, "pendente", "informe o teor de projeto");
      linhas.push(lTeor);
      var fT = cfg.freqTeor(L, P);
      freqs.push(A.frequencia(Object.assign({ ensaio: "Teor de ligante (extração)", metodo: "DNER-ME 053", realizado: ptsTeor.length }, fT)));

      // ---- granulometria (peneira a peneira) ----
      var comGran = usina.filter(function (o) { return o.temGran; });
      var lG = A.linha({ id: "gran", grupo: "Usinagem", criterio: "Granulometria do agregado extraído", secao: cfg.secGran, unid: "%", casas: 1, semMedia: true,
        exigido: "faixa de trabalho: projeto ± tolerâncias, dentro da faixa " + (fx ? fx.faixa : "") });
      lG.n = comGran.length;
      var granEst = [];
      if (!comGran.length) { lG.situacao = "sem_dados"; lG.motivo = "sem determinações"; lG.txtEstat = "—"; }
      else if (!trab.some(function (t) { return ok(t.min); })) { A.marcar(lG, "pendente", "sem curva de projeto não há faixa de trabalho"); lG.txtEstat = "—"; }
      else {
        var modoG = cfg.modoGran || "estat";
        trab.forEach(function (t, j) {
          if (!ok(t.min)) return;
          var pts = comGran.map(function (o) { return { v: o.pass[j], rot: o.rot }; }).filter(function (p) { return ok(p.v); });
          if (!pts.length) return;
          var e = A.estatistica(pts, t.min, t.max, modoG === "estat" ? OPT_K : { individual: true });
          granEst.push({ t: t, e: e });
          var nm = t.nome + " (" + fmt(t.min, 0) + "–" + fmt(t.max, 0) + " %)";
          if (e.modo === "estatistico") {
            if (!e.conforme) A.marcar(lG, "nao_conforme", nm + ": " + (e.okMin === false ? "X̄ − k·s = " + fmt(e.inf, 1) : "") + (e.okMin === false && e.okMax === false ? "; " : "") + (e.okMax === false ? "X̄ + k·s = " + fmt(e.sup, 1) : "") + " %");
            else if (e.fora.length) A.marcar(lG, "ressalva", nm + ": estatística atende, mas " + e.fora.length + " valor(es) fora (" + e.fora.map(function (p) { return p.rot + " " + fmt(p.v, 1); }).join("; ") + ") — corrigir a usinagem");
          } else if (e.fora.length) A.marcar(lG, cfg.falhaGranIndiv || "nao_conforme", nm + ": " + e.fora.map(function (p) { return p.rot + " " + fmt(p.v, 1) + " %"; }).join("; ") + (modoG === "estat" ? " (n < 5, valores individuais)" : ""));
        });
        var nEst = granEst.filter(function (g) { return g.e.modo === "estatistico"; }).length;
        lG.txtEstat = nEst ? "por peneira (tabela abaixo)" : "individual (n < 5)";
        lG.resultado = comGran.length + " curva(s) em " + granEst.length + " peneira(s)";
        if (lG.situacao === "conforme") lG.motivo = nEst ? "X̄ ± k·s dentro da faixa de trabalho em todas as peneiras" : "todos os valores dentro da faixa de trabalho";
      }
      linhas.push(lG);
      freqs.push(A.frequencia(Object.assign({ ensaio: "Granulometria do agregado extraído", metodo: "DNER-ME 083", realizado: comGran.length }, fT)));

      // ---- CPs Marshall ----
      var mar = d.mar || [];
      if (cfg.marshall) {
        var M = cfg.marshall(P);
        tab.mar = mar.map(function (m) { var vv = num(m.vv); return { vamMin: M.vam ? M.vam(P, vv) : NaN }; });
        var nMar = mar.filter(function (m) { return M.itens.some(function (it) { return ok(num(m[it.k])); }); }).length;
        M.itens.forEach(function (it) {
          var pts = mar.map(function (m, i) { return { v: num(m[it.k]), rot: m.reg || "conjunto " + (i + 1) }; }).filter(function (p) { return ok(p.v); });
          var l = aval({ id: "mar_" + it.k, grupo: "Mistura — CPs Marshall", criterio: it.nome, secao: it.secao || M.secao, unid: it.unid, casas: it.casas, min: it.min, max: it.max, pontos: pts, exigido: it.exigido }, it.modo);
          if (it.k === "rbv" && M.vam && (l.situacao === "nao_conforme" || l.situacao === "ressalva")) {
            // RBV fora: atende se o VAM de cada conjunto for ≥ o mínimo (alternativa da ES)
            var vams = mar.map(function (m, i) { return { v: num(m.vam), m: tab.mar[i].vamMin, r: num(m.rbv) }; }).filter(function (x) { return ok(x.r); });
            var alt = vams.length && vams.every(function (x) { return (x.r >= it.min - EPS && x.r <= it.max + EPS) || (ok(x.v) && ok(x.m) && x.v >= x.m - EPS); });
            if (alt) { l.situacao = "conforme"; l.motivos = []; l.motivo = "RBV fora de " + lim(it.min, it.max, 0, "%") + ", mas VAM ≥ mínimo (" + cfg.vam.secao + ": RBV ou VAM mínimo)"; }
            else if (vams.some(function (x) { return !ok(x.m) && ok(x.v); })) A.marcar(l, "pendente", "escolha o tamanho nominal máximo para verificar a alternativa do VAM mínimo (" + cfg.vam.secao + ")");
          }
          if (it.nota) l.motivo = (l.motivo ? l.motivo + "; " : "") + it.nota;
          if (pts.length || it.obrig) linhas.push(l);
        });
        freqs.push(A.frequencia(Object.assign({ ensaio: "Ensaio Marshall (conjuntos de CPs)", metodo: "DNER-ME 043", realizado: nMar }, M.freq(L, P))));
        mar.forEach(function (m, i) {
          var t = num(m.teor);
          if (ok(t) && ok(teorProj) && Math.abs(t - teorProj) > 0.3 + EPS) avisos.push("CPs Marshall " + (i + 1) + ": moldados com teor de " + fmt(t, 2) + " %, fora do projeto ± 0,3 %.");
        });
      }
      if (cfg.rt) {
        var ptsRt = (d.rt || []).map(function (r, i) { return { v: num(r.rt), rot: r.reg || "ensaio " + (i + 1) }; }).filter(function (p) { return ok(p.v); });
        var rtMin = cfg.rt.min(P);
        var lRt = aval({ id: "rt", grupo: "Mistura — CPs Marshall", criterio: "Resistência à tração (25 °C)", secao: cfg.rt.secao, unid: "MPa", casas: 2, min: rtMin, pontos: ptsRt, exigido: cfg.rt.exigido ? cfg.rt.exigido(P) : null }, cfg.rt.modo || "estat");
        linhas.push(lRt);
        freqs.push(A.frequencia(Object.assign({ ensaio: "Resistência à tração", metodo: "DNIT 136 (DNER-ME 138)", realizado: ptsRt.length }, cfg.rt.freq(L, P))));
        (d.rt || []).forEach(function (r, i) { if (r.obs) avisos.push("RT " + (i + 1) + (r.reg ? " (" + r.reg + ")" : "") + ": " + r.obs + "."); });
      }
      if (cfg.cantabro) {
        var ptsC = (d.cant || []).map(function (r, i) { return { v: num(r.a), rot: r.reg || "ensaio " + (i + 1) }; }).filter(function (p) { return ok(p.v); });
        var lC = aval({ id: "cant", grupo: "Mistura — CPs Marshall", criterio: "Desgaste Cantabro", secao: cfg.cantabro.secao, unid: "%", casas: 0, max: cfg.cantabro.max, pontos: ptsC }, "estat");
        linhas.push(lC);
        freqs.push(A.frequencia(Object.assign({ ensaio: "Desgaste Cantabro", metodo: "DNER-ME 383", realizado: ptsC.length }, cfg.cantabro.freq(L, P))));
      }

      // ---- temperaturas ----
      var temp = d.temp || [];
      cfg.temps(P).forEach(function (t) {
        var pts = temp.map(function (p, i) {
          var v = num(p[t.k]), lm = t.lim(p);
          return { v: v, min: lm[0], max: lm[1], rot: p.carga || "medição " + (i + 1) };
        });
        var l = indivPts({ id: "t_" + t.k, grupo: "Temperaturas", criterio: t.nome, secao: t.secao, unid: "°C", casas: 0, exigido: t.exigido, falha: t.falha || "ressalva",
          sufixo: t.sufixo || "avaliar as cargas correspondentes" }, pts);
        if (t.extra) t.extra(l, pts, avisos);
        linhas.push(l);
        freqs.push(A.frequencia({ ensaio: "Temperatura — " + t.nome.toLowerCase(), metodo: "termômetro", regra: "durante cada jornada de 8 h", exigido: nJ(1), realizado: l.n }));
      });
      if (temp.some(function (p) { return ok(num(p.tsai)) || ok(num(p.tesp)); }) && (!ok(num(P.tMist)) || !(ok(num(P.tComp)) || cfg.tCompPadrao && ok(cfg.tCompPadrao(P)))))
        avisos.push("Informe as temperaturas indicadas (mistura na saída do misturador e compactação) para verificar ± 5 °C.");

      // ---- grau de compactação e espessura ----
      var pista = (d.pista || []).map(function (p) {
        var g = num(p.gmb), e = num(p.esp);
        return { gc: ok(g) && ok(gmbRef) && gmbRef > 0 ? g / gmbRef * 100 : NaN, dEsp: ok(e) && ok(espProj) && espProj > 0 ? (e - espProj) / espProj * 100 : NaN, x: A.estacaM(p.est, { estrito: true }) };
      });
      tab.pista = pista;
      if ((d.pista || []).some(function (p) { return ok(num(p.gmb)); }) && !ok(gmbRef)) avisos.push("Informe a densidade aparente de referência (Gmb) para o grau de compactação.");
      var GC = cfg.gc(P);
      var ptsGc = (d.pista || []).map(function (p, i) { return { v: pista[i].gc, est: p.est || "", x: pista[i].x, rot: p.est ? "est. " + p.est : p.pos || "ponto " + (i + 1) }; }).filter(function (p) { return ok(p.v); });
      var lGc = aval({ id: "gc", grupo: "Execução", criterio: "Grau de compactação", secao: GC.secao, unid: "%", casas: 1, min: GC.min, max: GC.max, pontos: ptsGc, exigido: GC.exigido }, "estat");
      linhas.push(lGc);
      var fGc = GC.freq(L, P);
      freqs.push(A.frequencia(Object.assign({ ensaio: "Grau de compactação", metodo: "CPs extraídos (DNIT 428) / densímetro (DNIT 431)", realizado: ptsGc.length }, fGc)));
      var cb = A.cobertura(ptsGc, L, 100, "Grau de compactação");
      cb.avisos.forEach(function (t) { avisos.push(t); });
      var ptsEsp = (d.pista || []).map(function (p, i) { return { v: num(p.esp), est: p.est || "", x: pista[i].x, rot: p.est ? "est. " + p.est : p.pos || "ponto " + (i + 1) }; }).filter(function (p) { return ok(p.v); });
      var lEsp = aval({ id: "esp", grupo: "Execução", criterio: "Espessura da camada", secao: cfg.secEsp, unid: "cm", casas: 2, min: espProj * 0.95, max: espProj * 1.05, pontos: ptsEsp,
        exigido: ok(espProj) ? fmt(espProj, 1) + " cm ± 5 % (" + fmt(espProj * 0.95, 2) + " a " + fmt(espProj * 1.05, 2) + " cm)" : "projeto ± 5 %" }, cfg.modoEsp || "estat");
      if (ptsEsp.length && !ok(espProj)) A.marcar(lEsp, "pendente", "informe a espessura de projeto");
      linhas.push(lEsp);
      var fEsp = cfg.freqEsp ? cfg.freqEsp(L, P, fGc) : fGc;
      freqs.push(A.frequencia(Object.assign({ ensaio: "Espessura", metodo: "CPs extraídos ou nivelamento", realizado: ptsEsp.length }, fEsp)));

      // ---- alinhamentos e acabamento ----
      var geo = d.geo || [], nGeo = ok(L.ext) ? A.nPontos(L.ext, 20) : NaN, modoGeo = cfg.modoGeo || "estat";
      var al = [];
      geo.forEach(function (p, i) { [["aEixo", "eixo"], ["aBordo", "bordo"]].forEach(function (c) { var v = num(p[c[0]]); if (ok(v)) al.push({ v: v, est: p.est, x: A.estacaM(p.est, { estrito: true }), rot: (p.est ? "est. " + p.est : "seção " + (i + 1)) + " " + c[1] }); }); });
      linhas.push(aval({ id: "alin", grupo: "Produto", criterio: "Alinhamentos (eixo e bordos)", secao: cfg.secAlin, unid: "cm", casas: 1, min: -5, max: 5, pontos: al, exigido: "desvios ≤ ± 5 cm" }, modoGeo));
      freqs.push(A.frequencia({ ensaio: "Alinhamentos", metodo: "locação / trena", regra: "seções das estacas da locação (a cada 20 m)", exigido: nGeo,
        realizado: geo.filter(function (p) { return ok(num(p.aEixo)) || ok(num(p.aBordo)); }).length }));
      var rg = [];
      geo.forEach(function (p, i) { [["r3", "régua 3,00 m"], ["r12", "régua 1,20 m"]].forEach(function (c) { var v = num(p[c[0]]); if (ok(v)) rg.push({ v: v, est: p.est, x: A.estacaM(p.est, { estrito: true }), rot: (p.est ? "est. " + p.est : "seção " + (i + 1)) + " " + c[1] }); }); });
      linhas.push(aval({ id: "regua", grupo: "Produto", criterio: "Acabamento — réguas de 3,00 m e 1,20 m", secao: cfg.secRegua, unid: "cm", casas: 1, max: 0.5, pontos: rg, exigido: "variação ≤ 0,5 cm" }, modoGeo));
      freqs.push(A.frequencia({ ensaio: "Acabamento (réguas)", metodo: "réguas de 3,00 m e 1,20 m", regra: "em cada estaca da locação", exigido: nGeo,
        realizado: geo.filter(function (p) { return ok(num(p.r3)) || ok(num(p.r12)); }).length }));
      var sup = d.sup || [];
      if (cfg.qi && cfg.qi.aplica(P)) {
        var ptsQi = sup.map(function (p, i) { var q = num(p.qi), r = num(p.iri); return { v: ok(q) ? q : ok(r) ? 13 * r : NaN, est: p.est, rot: p.est ? "seg. " + p.est : "segmento " + (i + 1) }; }).filter(function (p) { return ok(p.v); });
        var lQ = aval({ id: "qi", grupo: "Produto", criterio: "Irregularidade longitudinal (QI)", secao: cfg.qi.secao, unid: "cont/km", casas: 0,
          max: cfg.qi.estrito ? 35 - 1e-6 : 35, pontos: ptsQi, exigido: cfg.qi.exigido }, cfg.qi.modo || modoGeo);
        linhas.push(lQ);
        freqs.push(A.frequencia({ ensaio: "Irregularidade (QI)", metodo: "DNER-PRO 164 e 182", regra: "medição do lote", exigido: 1, realizado: ptsQi.length }));
      }
      var S = cfg.seg ? cfg.seg(P) : null;
      if (S) S.itens.forEach(function (it) {
        var pts = sup.map(function (p, i) { return { v: num(p[it.k]), est: p.est, rot: p.est ? "seg. " + p.est : "segmento " + (i + 1) }; }).filter(function (p) { return ok(p.v); });
        linhas.push(aval({ id: "s_" + it.k, grupo: "Segurança", criterio: it.nome, secao: S.secao, unid: it.unidL || "", casas: it.casas, min: it.min, max: it.max, pontos: pts, exigido: it.exigido }, S.modo || modoGeo));
        freqs.push(A.frequencia({ ensaio: it.nome, metodo: it.metodo, regra: "segmentos escolhidos aleatoriamente", exigido: 1, realizado: pts.length }));
      });

      // ---- itens próprios da ES ----
      if (cfg.extra) cfg.extra({ d: d, P: P, L: L, linhas: linhas, freqs: freqs, avisos: avisos, tab: tab, nJ: nJ, aval: aval });

      // ---- insumos (contagem) ----
      var INS = cfg.insumos(P, L), ins = d.ins || [];
      tab.ins = INS.map(function (x) { return { exig: x[2] }; });
      var lI = A.linha({ id: "ins", grupo: "Insumos", criterio: "Controle dos insumos", secao: cfg.secIns, exigido: "frequências de " + cfg.secIns + "; resultados conformes", semMedia: true, txtEstat: "contagem" });
      var partesI = [];
      INS.forEach(function (x, i) {
        var p = ins[i] || {}, ex = x[2], re = num(p.real), nc = num(p.nc);
        if (ex === 0) return;
        if (!ok(re)) { if (ok(ex)) A.marcar(lI, "pendente", x[1] + ": informe os realizados (mínimo " + ex + ")"); return; }
        partesI.push(x[1].replace(/ \(.*$/, "") + " " + fmt(re, 0) + (ok(ex) ? "/" + ex : ""));
        if (ok(ex) && re < ex) A.marcar(lI, re === 0 ? "pendente" : "ressalva", x[1] + ": " + fmt(re, 0) + " de " + ex + " exigidos");
        if (ok(nc) && nc > 0) A.marcar(lI, x[3] || "ressalva", x[1] + ": " + fmt(nc, 0) + " resultado(s) fora da especificação" + (x[3] === "nao_conforme" ? " — o insumo não deve ser aceito (" + cfg.secInsAceite + ")" : ""));
      });
      lI.resultado = partesI.length ? partesI.join("; ") : "—";
      lI.n = partesI.length;
      if (lI.situacao === "conforme") lI.motivo = partesI.length ? "frequências atendidas, sem resultados fora" : "";
      if (!partesI.length && lI.situacao === "conforme") { lI.situacao = "pendente"; lI.motivo = "informe os ensaios de controle dos insumos"; }
      linhas.push(lI);

      var par = A.parecer(linhas, freqs, { providencias: prov });
      return { tab: tab, avisos: avisos, resultados: { lote: L, linhas: linhas, freqs: freqs, parecer: par, trab: trab, fx: fx, usina: usina, granEst: granEst } };
    }
    function prov(par, linhas) {
      var p = [];
      if (par.parecer === "REJEITADO") p = p.concat(cfg.provRejeito);
      if (linhas.some(function (l) { return (l.id === "teor" || l.id === "gran") && l.situacao === "nao_conforme"; })) p.push("Teor de ligante ou granulometria fora: corrigir imediatamente a usinagem (dosagem dos silos e do ligante) e reavaliar a produção.");
      if (par.parecer === "PENDENTE") p.push("Completar os ensaios, determinações e informações pendentes antes de concluir a aceitação do lote.");
      if (par.res.length) p.push("Ressalvas: tratar cada ponto indicado (corrigir o local, avaliar as cargas, complementar a frequência) e registrar no relatório periódico de acompanhamento.");
      p.push(cfg.provMedicao);
      return p;
    }

    // ---------- apresentação ----------
    function cabecalho(r, P) {
      var L = r.lote;
      return (P.estIni || P.estFim ? "Est. " + (P.estIni || "?") + " a " + (P.estFim || "?") + " · " : "") + (ok(L.ext) ? fmt(L.ext, 0) + " m" : "extensão ?") +
        (ok(L.larg) ? " × " + fmt(L.larg, 2) + " m = " + fmt(L.area, 0) + " m²" : "") + (P.pista ? " · " + P.pista : "");
    }
    function tabGran(r, relat) {
      var t = r.trab, us = r.usina.filter(function (o) { return o.temGran; });
      if (!t || !t.length || (!t.some(function (o) { return ok(o.proj); }) && !us.length)) return "";
      var cls = relat ? "gr" : "fe-resumo";
      var h = '<table class="' + cls + '"><thead><tr><th>Peneira</th><th>Faixa ' + esc(r.fx ? r.fx.faixa : "") + "</th><th>Projeto</th><th>Tol.</th><th>Faixa de trabalho</th>" +
        us.map(function (o) { return "<th>Am. " + (r.usina.indexOf(o) + 1) + "</th>"; }).join("") + "<th>n</th><th>X̄</th><th>s</th><th>X̄ − ks</th><th>X̄ + ks</th></tr></thead><tbody>";
      t.forEach(function (o, j) {
        var ge = r.granEst.filter(function (g) { return g.t === o; })[0], e = ge ? ge.e : null, est = e && e.modo === "estatistico";
        var ruim = e && (est ? !e.conforme : e.fora.length);
        h += "<tr><td>" + esc(o.nome) + " — " + fmt(o.mm, o.mm < 1 ? 3 : 1) + "</td><td>" + o.fmin + "–" + o.fmax + "</td><td>" + (ok(o.proj) ? fmt(o.proj, 1) : "—") + "</td><td>" +
          (ok(o.tol) ? "± " + fmt(o.tol, 0) : "—") + "</td><td>" + (ok(o.min) ? fmt(o.min, 0) + "–" + fmt(o.max, 0) + (o.ajuste ? " *" : "") : "—") + "</td>" +
          us.map(function (u) {
            var v = u.pass[j], f = ok(v) && ok(o.min) && (v < o.min - EPS || v > o.max + EPS);
            return "<td>" + (ok(v) ? (f ? (relat ? "<b>" + fmt(v, 1) + "*</b>" : '<span class="fe-nok">' + fmt(v, 1) + "</span>") : fmt(v, 1)) : "—") + "</td>";
          }).join("") +
          "<td>" + (e ? e.n : "—") + "</td><td>" + (e ? fmt(e.X, 1) : "—") + "</td><td>" + (e && e.n > 1 ? fmt(e.s, 2) : "—") + "</td><td" + (ruim && !relat ? ' class="fe-nok"' : "") + ">" +
          (est ? fmt(e.inf, 1) : "—") + "</td><td" + (ruim && !relat ? ' class="fe-nok"' : "") + ">" + (est ? fmt(e.sup, 1) : "—") + "</td></tr>";
      });
      h += "</tbody></table>";
      if (t.some(function (o) { return o.ajuste; })) h += '<p class="' + (relat ? "nota" : "fe-hint") + '">* limite da faixa de trabalho ajustado ao limite da faixa ' + esc(r.fx ? r.fx.faixa : "") + " (a tolerância não pode ultrapassar a faixa).</p>";
      return h;
    }
    function resultadosHtml(calc, d) {
      var r = calc.resultados, P = d.params || {}, L = r.lote;
      var h = A.htmlParecer(r.parecer);
      h += '<div class="fe-res">' + A.cartao(esc(cabecalho(r, P)), "Lote" + (r.fx ? " · faixa " + esc(r.fx.faixa) : "")) +
        A.cartao((ok(L.jor) ? fmt(L.jor, 0) + " jornada(s)" : "? jornadas") + (ok(L.massa) ? " · " + fmt(L.massa, 1) + " t" : ""), "Produção") + "</div>";
      h += A.htmlCriterios(r.linhas, { estilo: "estatistico" });
      h += "<h4>Frequência dos ensaios</h4>" + A.htmlFrequencia(r.freqs);
      var g = tabGran(r, false);
      if (g) h += "<h4>Granulometria — faixa de trabalho e controle por peneira</h4>" + g;
      return h;
    }
    function graficos(calc, d, opt) {
      var r = calc.resultados, out = [];
      ["gc", "esp", "teor"].forEach(function (id) {
        var l = r.linhas.filter(function (x) { return x.id === id; })[0];
        if (l && l.n) { var g = A.graficoLinha(l, opt); if (g) out.push(g); }
      });
      var us = r.usina.filter(function (o) { return o.temGran; });
      if (us.length && r.trab.some(function (t) { return ok(t.min); })) {
        var am = us.map(function (o) { return { pen: r.trab.map(function (t, j) { return { mm: t.mm, pass: o.pass[j] }; }).filter(function (x) { return ok(x.pass); }) }; });
        var med = r.trab.map(function (t, j) {
          var v = media(us.map(function (o) { return o.pass[j]; }));
          return { mm: t.mm, pass: v, lim: ok(t.min) ? { min: t.min, max: t.max } : null, dentro: ok(v) && ok(t.min) ? v >= t.min - EPS && v <= t.max + EPS : null };
        }).filter(function (x) { return ok(x.pass); });
        var svg = G.grafico({ amostras: am, resultados: { media: med } }, opt);
        var cor = opt && opt.imprimir ? "#222" : "var(--text-dim)";
        if (svg) out.push(svg.replace("</svg>", '<text x="56" y="28" fill="' + cor + '" font-weight="bold">' + esc("Agregado extraído × faixa de trabalho — " + cfg.secGran + (us.length > 1 ? " (tracejadas: amostras; cheia: média)" : "")) + "</text></svg>"));
      }
      return out;
    }
    function relResultados(calc, d) {
      var r = calc.resultados, P = d.params || {}, L = r.lote, rows = [];
      rows.push(["PARECER DO LOTE", r.parecer.titulo]);
      rows.push(["Lote", cabecalho(r, P) + (ok(L.massa) ? " · " + fmt(L.massa, 1) + " t aplicadas" : "")]);
      rows.push(["Produção", (ok(L.jor) ? fmt(L.jor, 0) + " jornada(s) de 8 h" : "jornadas não informadas") + (P.dataIni ? " · " + dataBR(P.dataIni) + (P.dataFim && P.dataFim !== P.dataIni ? " a " + dataBR(P.dataFim) : "") : "")]);
      rows.push(["Critérios", r.linhas.length + " verificados: " + ["conforme", "ressalva", "pendente", "sem_dados", "nao_conforme"].map(function (s) {
        var n = r.linhas.filter(function (l) { return l.situacao === s; }).length;
        return n ? n + " " + A.SITUACAO[s][0] : "";
      }).filter(Boolean).join(", ")]);
      return rows;
    }

    var padrao = Object.assign({ faixa: "", chuva: "", gcRef: "projeto" }, cfg.padrao || {});
    if (cfg.camadas) padrao.camada = padrao.camada || cfg.camadas[0][0];
    var F = {
      lote: true,
      titulo: cfg.titulo,
      resumo: cfg.resumo,
      blocos: [],
      params: params,
      padrao: padrao,
      tabelas: tabelas,
      calcular: calcular,
      resultadosHtml: resultadosHtml,
      graficos: graficos,
      relatorio: {
        notas: cfg.notas,
        resultados: relResultados,
        extraHtml: function (calc) {
          var r = calc.resultados, g = tabGran(r, true);
          return A.htmlParecer(r.parecer, { relat: true }) + "<h2>Critérios de aceitação</h2>" + A.htmlCriterios(r.linhas, { relat: true, estilo: "estatistico" }) +
            "<h2>Frequência dos ensaios</h2>" + A.htmlFrequencia(r.freqs, true) + (g ? "<h2>Granulometria — faixa de trabalho</h2>" + g : "");
        },
      },
      exemplos: [],
    };
    if (cfg.norma) { F.norma = cfg.norma; F.rotuloLink = cfg.rotuloLink || "Aceitação de lote"; }
    FE.FICHAS[ID] = F;
    F.exemplos = (cfg.exemplos || []).map(function (ex) {
      return { nome: ex.nome, dados: function () { var d = ex.dados(); d.params = Object.assign({}, padrao, d.params || {}); ex.depois && ex.depois(d, params); return d; } };
    });
    F.exemplo = F.exemplos[0] && F.exemplos[0].dados;
    return F;
  }

  // =====================================================================================
  // helpers para configurar as ES e montar exemplos
  // =====================================================================================
  // temperaturas comuns: projeto ± 5 °C, limitadas pelos extremos absolutos da ES
  function tProj(P, k) { return num(P[k]); }
  function faixaPM5(P, k, absMin, absMax) {
    var t = tProj(P, k), a = ok(t) ? t - 5 : absMin, b = ok(t) ? t + 5 : absMax;
    if (ok(absMin)) a = ok(a) ? Math.max(a, absMin) : absMin;
    if (ok(absMax)) b = ok(b) ? Math.min(b, absMax) : absMax;
    return [a, b];
  }
  function txtPM5(P, k, abs) { var t = tProj(P, k); return (ok(t) ? fmt(t, 0) + " ± 5 °C" : "indicada ± 5 °C") + (abs ? "; " + abs : ""); }
  // agregados: 10 a 15 °C acima do ligante (medido na mesma coluna ou indicado), sem ultrapassar máx.
  function tempAgregado(P, maxAbs, estrito) {
    return function (p) {
      var tl = ok(num(p.tlig)) ? num(p.tlig) : num(P.tLig), ta = num(P.tAgr);
      var a = ok(ta) ? ta - 5 : ok(tl) ? tl + 10 : NaN, b = ok(ta) ? ta + 5 : ok(tl) ? tl + 15 : NaN;
      var mx = estrito ? maxAbs - 1 : maxAbs;
      return [a, ok(b) ? Math.min(b, mx) : mx];
    };
  }
  // insumos: [chave, texto, exigido, gravidade dos resultados fora]
  function porCarreg(L) { return ok(L.carreg) ? L.carreg : NaN; }
  function porMassa(L, t) { return ok(L.mLig) ? Math.ceil(L.mLig / t - EPS) : NaN; }
  function porJornada(L, n) { return ok(L.jor) ? L.jor * (n || 1) : NaN; }
  // série pseudoaleatória reprodutível
  function serie(n, seed, a, b) { var out = [], s = seed; for (var i = 0; i < n; i++) { s = (s * 9301 + 49297) % 233280; out.push(a + (b - a) * s / 233280); } return out; }
  function colGran(pens, vals) { var o = {}; pens.forEach(function (mm, j) { if (ok(vals[j])) o[G.chavePen(mm)] = nstr(vals[j], 1); }); return o; }
  function estacas(ini, n, passo) { var out = []; for (var i = 0; i < n; i++) out.push(A.fmtEstaca(A.estacaM(ini) + i * passo)); return out; }
  // exemplo genérico: {pens, proj, desvGran: [[...], ...], teores, ...}
  function montar(o) {
    var d = { ident: o.ident, params: o.params, proj: [colGran(o.pens, o.proj)], obs: o.obs };
    d.usina = o.teores.map(function (t, i) {
      var dv = o.desvGran && o.desvGran[i] ? o.desvGran[i] : serie(o.pens.length, 11 + i * 7, -1.8, 1.8);
      return Object.assign({ reg: (o.pref || "EXT") + "-" + (i + 1), data: o.data || "", per: "jornada " + (Math.floor(i / (o.porJ || 1)) + 1), orig: "DNER-ME 053/94", teor: nstr(t, 2) },
        colGran(o.pens, o.proj.map(function (p, j) { return p >= 100 ? 100 : Math.min(100, p + dv[j] * (o.escala || 1)); })));
    });
    if (o.mar) d.mar = o.mar;
    if (o.rt) d.rt = o.rt.map(function (v, i) { return { reg: "RT-" + (i + 1), data: o.data || "", rt: nstr(v, 2) }; });
    if (o.cant) d.cant = o.cant.map(function (v, i) { return { reg: "CANT-" + (i + 1), data: o.data || "", a: String(v) }; });
    d.temp = o.temp;
    var ests = estacas(o.estIni, o.gc.length, o.passoGC || 20);
    d.pista = o.gc.map(function (g, i) {
      return { est: o.estGC ? o.estGC[i] : ests[i], pos: ["LD 1,0 m", "LE 1,5 m", "eixo", "LD 2,5 m", "LE 1,0 m"][i % 5], reg: "CP-" + (i + 1) + " — DNIT 428",
        gmb: ok(g) ? nstr(g * o.gmbRef / 100, 4) : "", esp: o.esp && ok(o.esp[i]) ? nstr(o.esp[i], 2) : "" };
    });
    var ng = o.nGeo, eg = estacas(o.estIni, ng, 20), al = serie(2 * ng, 5, -3, 3), rr = serie(2 * ng, 9, 0.1, 0.45);
    d.geo = eg.map(function (e, i) { return { est: e, aEixo: nstr(al[2 * i], 0), aBordo: nstr(al[2 * i + 1], 0), r3: nstr(rr[2 * i], 1), r12: nstr(rr[2 * i + 1], 1) }; });
    if (o.geoMod) o.geoMod(d.geo);
    d.sup = o.sup || [];
    d.ins = o.ins.map(function (x) { return { real: x[0] === null ? "" : String(x[0]), nc: x[1] === null ? "" : String(x[1]) }; });
    return d;
  }

  FE.aceitacaoG3 = { criar: criar, K_DNER: K_DNER, faixaPM5: faixaPM5, txtPM5: txtPM5, tempAgregado: tempAgregado, porCarreg: porCarreg, porMassa: porMassa,
    porJornada: porJornada, serie: serie, colGran: colGran, estacas: estacas, montar: montar, lerPass: lerPass };

  // =====================================================================================
  // DNIT 112/2009-ES — Concreto asfáltico com asfalto-borracha, via úmida, "terminal blending"
  // =====================================================================================
  var G3 = FE.aceitacaoG3;
  // Tabela 3 (p. 6): VAM mínimo por TNM e Vv (3, 4, 5, 6 %), interpolado
  var VAM112 = { "37.5": [10, 11, 12, 13], "25": [11, 12, 13, 14], "19": [12, 13, 14, 15], "12.5": [13, 14, 15, 16], "9.5": [14, 15, 16, 17],
    "4.75": [16, 17, 18, 19], "2.36": [19, 20, 21, 22], "1.18": [21.5, 22.5, 23.5, 24.5] };
  var NOMES_TNM = { "37.5": "1 ½\" — 37,5 mm", "25": "1\" — 25 mm", "19": "¾\" — 19 mm", "12.5": "½\" — 12,5 mm", "9.5": "⅜\" — 9,5 mm",
    "4.75": "nº 4 — 4,75 mm", "2.36": "nº 8 — 2,36 mm", "1.18": "nº 10 (sic) — 1,18 mm" };
  function vam112(P, vv) {
    var l = VAM112[P.tnm];
    if (!l || !ok(vv)) return NaN;
    var v = Math.min(Math.max(vv, 3), 6), i = Math.min(Math.floor(v - 3), 2);
    return l[i] + (l[i + 1] - l[i]) * (v - 3 - i);
  }
  // Tabela 2 (p. 6) por camada
  var T2 = { rolamento: { vv: [3, 5], est: 800, rt: 0.75, nome: "rolamento" }, gap: { vv: [4, 6], est: 700, rt: 0.50, nome: "rolamento gap graded" },
    ligacao: { vv: [4, 6], est: 700, rt: 0.65, nome: "ligação (binder)" }, base: { vv: [4, 6], est: 700, rt: 0.65, nome: "base (limites da camada de ligação)" } };
  function t2(P) { return T2[P.camada] || T2.rolamento; }
  // Tabela 1: asfalto solúvel no CS2 por faixa
  var TEOR112 = { A: [4.0, 7.0], B: [4.5, 7.5], C: [4.5, 8.0], "Gap graded": [5.0, 8.0] };

  G3.criar({
    id: "dnit-112-2009-es", codigo: "DNIT 112/2009-ES",
    titulo: "Concreto asfáltico com asfalto-borracha (terminal blending) — aceitação de lote",
    resumo: "Reúne os ensaios do lote (importados das fichas ME ou digitados), confere a frequência e aplica os critérios da DNIT 112/2009-ES: teor de asfalto-borracha corrigido pelo fator k ± 0,3 %, granulometria na faixa de trabalho, Vv, RBV ou VAM, estabilidade e RT (Tabela 2), temperaturas, grau de compactação 97–101 %, espessura ± 5 %, alinhamentos, réguas, QI ≤ 35 e condições de segurança — controle estatístico X̄ ± k·s (7.5).",
    estat: "dnit", secK: "7.5 / DNER-PRO 277 (a ES não transcreve a tabela de k)",
    refs: { reprova: "7.5", atende: "7.5", corrige: "7.5: todo detalhe incorreto deve ser corrigido", regra: "7.5" },
    camadas: [["rolamento", "Camada de rolamento (faixas contínuas)"], ["gap", "Camada de rolamento gap graded"], ["ligacao", "Camada de ligação (binder)"], ["base", "Base"]],
    dicaCamada: "Tabela 2: Vv, RBV, estabilidade e RT por camada (4 a: rolamento, ligação ou base — para base a Tabela 2 não tem coluna: usam-se os limites da camada de ligação)",
    faixas: ["dnit-112-2009-es-A", "dnit-112-2009-es-B", "dnit-112-2009-es-C", "dnit-112-2009-es-gap-graded"],
    secFaixa: "5.2, Tabela 1", teorFaixa: function (P, fx) { return fx ? TEOR112[fx.faixa] : null; }, retido4: "5.2", dmax: "5.2",
    secTeor: "7.2.1 a", secGran: "7.2.1 b", secTemp: "5.4.2 a 5.4.6, 7.2.1 c, 7.2.2", secGC: "7.2.2", secEsp: "7.3 a", secGeo: "7.3 b, c",
    secAlin: "7.3 b", secRegua: "7.3 c", secChuva: "4 b", secIns: "7.1", secInsAceite: "7.1",
    fatorK: true, silos: true,
    dicaTeor: "Tabela 1: A 4,0–7,0; B 4,5–7,5; C 4,5–8,0; gap graded 5,0–8,0 % (asfalto solúvel no CS2, % da mistura de agregados); tolerância ± 0,3 % (7.2.1 a)",
    dicaUsina: "amostras coletadas na pista logo após a acabadora; no mínimo 1 a cada 700 m² de pista (7.2.1 a)",
    phTLig: "170 a 180", dicaTLig: "5.4.2: entre 170 e 180 °C; ± 5 °C (7.2.1 c), sem sair de 170–180 °C",
    phTComp: "≥ 145", dicaTComp: "7.2.2: temperatura indicada ± 5 °C; nunca inferior a 145 °C durante a rolagem",
    vam: { secao: "5.2 c, Tabela 3", tab: VAM112, nomes: NOMES_TNM },
    rolamento: function (P) { return P.camada === "rolamento" || P.camada === "gap"; },
    params: [
      { k: "obra", r: "Tipo de obra (IFI — 7.3 d)", tipo: "select", opcoes: [["nova", "Obra nova (IFI ≥ 0,22)"], ["rest", "Pavimento restaurado (IFI ≥ 0,15)"]] },
      { k: "seguranca", r: "Resistência à derrapagem (7.3 d)", tipo: "select", recarrega: true,
        opcoes: [["mp", "Pêndulo britânico + mancha de areia"], ["ifi", "Pêndulo + mancha de areia + IFI (ASTM E 1960)"]] },
    ],
    padrao: { camada: "rolamento", obra: "nova", seguranca: "mp" },
    freqTeor: function (L) { return { por: "area", a_cada: 700, qtd: L.area, regra: "1 a cada 700 m² de pista" }; },
    marshall: function (P) {
      var c = t2(P);
      return { secao: "7.2.1 d, Tabela 2 (" + c.nome + ")", dica: "médias de cada conjunto de 3 CPs Marshall (75 golpes) moldados in loco, antes da compactação; 1 conjunto por jornada de 8 h",
        vam: vam112,
        itens: [
          { k: "vv", nome: "Porcentagem de vazios", unid: "%", casas: 1, min: c.vv[0], max: c.vv[1], modo: "estat", secao: "Tabela 2" },
          { k: "rbv", nome: "Relação betume/vazios", unid: "%", casas: 1, min: 65, max: 78, modo: "estat", secao: "Tabela 2, 5.2 c" },
          { k: "est", nome: "Estabilidade (75 golpes)", unid: "kgf", casas: 0, min: c.est, modo: "estat", secao: "7.2.1 d, Tabela 2", obrig: true },
        ],
        freq: function (L) { return { regra: "3 CPs por jornada de 8 h", exigido: ok(L.jor) ? L.jor : NaN }; } };
    },
    rt: { secao: "7.2.1 d, Tabela 2", min: function (P) { return t2(P).rt; }, dica: "em material coletado após a acabadora, CPs moldados in loco; 1 por jornada de 8 h (junto com o Marshall)",
      freq: function (L) { return { regra: "1 por jornada de 8 h", exigido: ok(L.jor) ? L.jor : NaN }; } },
    temps: function (P) {
      return [
        { k: "tagr", nome: "Agregados no silo quente", secao: "5.4.3, 7.2.1 c", lim: G3.tempAgregado(P, 180), exigido: "10 a 15 °C acima do ligante, ≤ 180 °C (± 5 °C do indicado)" },
        { k: "tlig", nome: "Ligante (asfalto-borracha) na usina", secao: "5.4.2, 7.2.1 c", lim: function () { return G3.faixaPM5(P, "tLig", 170, 180); }, exigido: G3.txtPM5(P, "tLig", "entre 170 e 180 °C") },
        { k: "tsai", nome: "Mistura na saída do misturador", secao: "5.4.4, 7.2.1 c", lim: function () { return G3.faixaPM5(P, "tMist", 165, 180); }, exigido: G3.txtPM5(P, "tMist", "usinagem entre 165 e 180 °C") },
        { k: "tesp", nome: "Mistura no espalhamento (antes da compactação)", secao: "5.4.6, 7.2.2", lim: function () { return G3.faixaPM5(P, "tComp", NaN, NaN); }, exigido: G3.txtPM5(P, "tComp", "nunca < 145 °C"),
          extra: function (l, pts) {
            var fr = pts.filter(function (p) { return ok(p.v) && p.v < 145; });
            if (fr.length) A.marcar(l, "nao_conforme", "abaixo de 145 °C (7.2.2: a temperatura da massa na rolagem nunca deve ser inferior a 145 °C): " + fr.map(function (p) { return p.rot + " " + fmt(p.v, 0) + " °C"; }).join("; "));
          } },
      ];
    },
    gc: function () {
      return { min: 97, max: 101, secao: "7.2.2, 7.5 a", exigido: "97 % a 101 % da densidade aparente de projeto",
        freq: function (L) { return { regra: "locais aleatórios durante a jornada — plano de amostragem (7.4); mín. 1 por jornada", exigido: ok(L.jor) ? L.jor : NaN }; } };
    },
    qi: { aplica: function (P) { return P.camada === "rolamento" || P.camada === "gap"; }, secao: "7.3 c", exigido: "QI ≤ 35 contagens/km (IRI ≤ 2,7 m/km)" },
    seg: function (P) {
      if (!(P.camada === "rolamento" || P.camada === "gap")) return null;
      var it = [{ k: "hs", nome: "Macrotextura — mancha de areia (HS)", unid: "mm", unidL: "mm", casas: 2, min: 0.6, max: 1.2, exigido: "0,6 mm ≤ HS ≤ 1,2 mm", metodo: "ASTM E 965" },
        { k: "vdr", nome: "Microtextura — pêndulo britânico (VRD)", unid: "—", casas: 0, min: 47, exigido: "VRD ≥ 47", metodo: "ASTM E 303" }];
      if (P.seguranca === "ifi") it.push({ k: "ifi", nome: "Índice internacional de atrito IFI (F60)", unid: "—", casas: 2, min: P.obra === "rest" ? 0.15 : 0.22,
        exigido: "F60 ≥ " + (P.obra === "rest" ? "0,15 (restaurado)" : "0,22 (obra nova)") + " — valor recomendado", metodo: "ASTM E 1960" });
      return { secao: "7.3 d", itens: it };
    },
    insumos: function (P, L) {
      return [
        ["pen", "Asfalto-borracha — penetração a 25 °C (por carregamento)", G3.porCarreg(L), "nao_conforme"],
        ["ful", "Asfalto-borracha — ponto de fulgor (por carregamento)", G3.porCarreg(L), "nao_conforme"],
        ["brk", "Asfalto-borracha — viscosidade Brookfield a 175 °C (por carregamento)", G3.porCarreg(L), "nao_conforme"],
        ["rec", "Asfalto-borracha — recuperação elástica (por carregamento)", G3.porCarreg(L), "nao_conforme"],
        ["amo", "Asfalto-borracha — ponto de amolecimento (a cada 100 t)", G3.porMassa(L, 100), "nao_conforme"],
        ["sox", "Extração Soxhlet — fator k (ASTM D 2172)", 1, "ressalva"],
        ["gra", "Granulometria de cada silo quente (2 por silo por jornada)", ok(L.jor) ? 2 * L.silos * L.jor : NaN, "ressalva"],
        ["ea", "Equivalente de areia do agregado miúdo ≥ 55 % (por jornada)", G3.porJornada(L), "ressalva"],
        ["fil", "Granulometria do fíler (por jornada)", G3.porJornada(L), "ressalva"],
      ];
    },
    provRejeito: ["Os serviços só devem ser aceitos se atenderem às prescrições da ES; todo detalhe incorreto ou mal executado deve ser corrigido, e o serviço só é aceito se as correções o colocarem em conformidade — caso contrário, rejeitado (7.5).",
      "Registrar as não conformidades no relatório periódico de acompanhamento e tratá-las conforme a DNIT 011/2004-PRO (7.5)."],
    provMedicao: "A medição (toneladas aplicadas) só deve ser processada com o relatório de controle da qualidade anexado (8 d).",
    notas: "Critérios da DNIT 112/2009-ES. Controle estatístico de 7.5: X̄ − k·s ≥ mínimo e/ou X̄ + k·s ≤ máximo, s com n − 1; a ES cita o k \"tabelado\" sem transcrever a tabela (remete à DNER-PRO 277 e ao plano de amostragem de 7.4) — usada a tabela de amostragem variável das ES do DNIT (n = 5: 1,55 … n = 21: 1,01); n < 5: cada valor individual deve atender; estatística atendida com valor individual fora: ressalva (corrigir o local). " +
      "Teor: extração DNER-ME 053 corrigida pelo fator k (aqui: teor × k). Faixa de trabalho = curva de projeto ± tolerâncias da Tabela 1, sem ultrapassar a faixa. RBV fora de 65–78 % é aceita se o VAM atender à Tabela 3 (5.2 c). GC = Gmb da pista / Gmb de projeto × 100 (densímetro DNIT 431: Gmb = densidade corrigida / 0,9971). QI = 13 × IRI quando só o IRI é informado. Temperaturas fora do indicado: ressalva (avaliar as cargas); mistura a menos de 145 °C na compactação: não conforme (7.2.2).",
    exemplos: [
      { nome: "Lote aceito — binder faixa B, 60 m (CPs Marshall, RT e densímetro importados dos exemplos das fichas ME)", dados: function () {
        var pens = [38.1, 25.4, 19.1, 9.5, 4.8, 2.0, 0.42, 0.18, 0.075], proj = [100, 97, 88, 62, 44, 32, 20, 13, 5.5];
        var d = G3.montar({ ident: { registro: "LOTE-AB-001", data: "2026-09-15", obra: "Obra A", trecho: "BR-000 — km 20", local: "Est. 20+00 a 23+00",
            camada: "Camada de ligação — CA asfalto-borracha AB-8, faixa B", origem: "Usina A", laboratorista: "Equipe de controle" },
          params: { estIni: "20+00", estFim: "23+00", largura: "3,60", pista: "pista direita", camada: "ligacao", faixa: "dnit-112-2009-es-B", teorProj: "4,8", fatorK: "1,04",
            tnm: "25", gmbProj: "2,380", espProj: "6,0", tLig: "170", tMist: "172", tComp: "160", dataIni: "2026-09-15", dataFim: "2026-09-15", jornadas: "1", massa: "31",
            nCarreg: "1", massaLig: "30", nSilos: "3", chuva: "nao", tAmb: "24" },
          pens: pens, proj: proj, teores: [4.83], pref: "EXT-0915", data: "15/09/2026", escala: 1,
          temp: [{ carga: "07h30 — caminhão 1", tagr: "180", tlig: "170", tsai: "171", tesp: "161" }, { carga: "10h10 — caminhão 3", tsai: "173", tesp: "158" }],
          estIni: "20+00", gc: [], esp: [], gmbRef: 2.380, nGeo: 4,
          ins: [[1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [6, 0], [1, 0], [1, 0]],
          obs: "Lote de demonstração: CPs Marshall (controle, 3 CPs), RT (DNIT 136) e grau de compactação pelo densímetro (DNIT 431) importados dos exemplos das fichas ME; espessuras dos pontos do densímetro, extração, temperaturas e geometria digitadas. Teor extraído 4,83 % × k 1,04 = 5,02 %." });
        return d;
      }, depois: function (d, params) {
        A.exemplos.importar(params, d, "impMar", [["dnit-385-2026-es", 1]]);
        A.exemplos.importar(params, d, "impRt", [["dnit-136-2018-me", 0]]);
        A.exemplos.importar(params, d, "impPista", [["dnit-431-2020-me", 0]]);
        ["6,05", "5,92", "6,11", "6,02", "5,97", "6,08"].forEach(function (e, i) { if (d.pista[i]) d.pista[i].esp = e; });
        d.params.impUsina = []; d.params.impCant = [];
      } },
      { nome: "Lote rejeitado — rolamento faixa C, 400 m: GC acima de 101 %, estabilidade e RT baixas, compactação a < 145 °C (dados gerados)", dados: function () {
        var pens = [19.1, 12.7, 9.5, 4.8, 2.0, 0.42, 0.18, 0.075], proj = [100, 90, 80, 56, 35, 17, 10, 6];
        var gc = [100.6, 101.4, 100.9, 101.8, 100.2, 101.1, 101.6], esp = [5.02, 4.88, 5.10, 4.93, 5.06, 4.97, 4.91];
        return G3.montar({ ident: { registro: "LOTE-AB-007", data: "2026-10-02", obra: "Obra B", trecho: "BR-000 — km 55", local: "Est. 100+00 a 120+00",
            camada: "Revestimento — CA asfalto-borracha AB-8, faixa C", origem: "Usina B", laboratorista: "Equipe de controle" },
          params: { estIni: "100+00", estFim: "120+00", largura: "3,60", pista: "pista esquerda", camada: "rolamento", faixa: "dnit-112-2009-es-C", teorProj: "5,6", fatorK: "1,05",
            tnm: "12.5", gmbProj: "2,352", espProj: "5,0", tLig: "170", tMist: "172", tComp: "158", dataIni: "2026-10-01", dataFim: "2026-10-02", jornadas: "2", massa: "175",
            nCarreg: "2", massaLig: "60", nSilos: "3", chuva: "nao", tAmb: "21", obra: "nova", seguranca: "mp", impUsina: [], impMar: [], impRt: [], impPista: [] },
          pens: pens, proj: proj, teores: [5.28, 5.41, 5.36], porJ: 2, pref: "EXT-1001", data: "01/10/2026",
          mar: [{ reg: "MAR-1001", data: "01/10/2026", teor: "5,65", gmb: "2,361", vv: "4,1", rbv: "73,5", vam: "15,4", est: "742", ncp: "3" },
            { reg: "MAR-1002", data: "02/10/2026", teor: "5,58", gmb: "2,356", vv: "4,6", rbv: "71,2", vam: "15,9", est: "768", ncp: "3" }],
          rt: [0.71, 0.73],
          temp: [{ carga: "01/10 07h40", tagr: "180", tlig: "170", tsai: "173", tesp: "157" }, { carga: "01/10 13h20", tagr: "180", tlig: "170", tsai: "170", tesp: "143" },
            { carga: "02/10 07h30", tagr: "180", tlig: "170", tsai: "174", tesp: "159" }, { carga: "02/10 12h50", tagr: "180", tlig: "170", tsai: "171", tesp: "156" }],
          estIni: "100+00", passoGC: 60, gc: gc, esp: esp, gmbRef: 2.352, nGeo: 21,
          geoMod: function (g) { g[7].r3 = "0,7"; },
          sup: [{ est: "100+00 a 110+00", qi: "28", hs: "0,72", vdr: "52" }, { est: "110+00 a 120+00", qi: "31", hs: "0,66", vdr: "49" }],
          ins: [[2, 0], [2, 0], [2, 0], [2, 0], [1, 0], [1, 0], [12, 0], [2, 0], [2, 0]],
          obs: "Dados gerados para demonstração. Teores extraídos × k 1,05. Rolagem da carga das 13h20 iniciada a 143 °C. Est. 107+00: régua de 3 m com 0,7 cm." });
      } },
    ],
  });
})();
