/*
 * Ficha de ACEITAÇÃO: DNIT 104/2009-ES — Terraplenagem — Serviços preliminares (desmatamento, destocamento e limpeza).
 *
 * Este arquivo é o PRIMEIRO do grupo de terraplenagem / proteção do corpo estradal carregado pelo index.html
 * (104, 106, 107, 108, 441, 445, DNER-ES 044, 102, 103) e por isso também define FE.aceitacaoG7: funções comuns das
 * fichas de terraplenagem (importação de GC/Δw das fichas de massa específica in situ, de γs,máx/ISC/expansão das
 * fichas de compactação e ISC, granulometria/LL/IP, itens de compactação da DNIT 108 reaproveitados pela 106, e
 * ajuste de frequências no hook "extra" do A.fichaSimples).
 *
 * O que a DNIT 104/2009-ES manda (seções do PDF):
 *   5.3.2 operações restritas aos off-sets + faixa adicional mínima; empréstimos/áreas de apoio: área mínima.
 *   5.3.3 cortes: camada de 60 cm abaixo do greide totalmente isenta de tocos e raízes.
 *   5.3.4 aterros com cota vermelha < 2,00 m: remover a camada superficial com raízes e restos vegetais;
 *         > 2,00 m: corte das árvores no máximo rente ao terreno (sem destocamento).
 *   5.3.7 árvores a preservar assinaladas pela Fiscalização (caiação) e preservadas; toras reservadas transportadas.
 *   5.3.10 cercas: construir a nova antes de remover a antiga.
 *   7.1   execução autorizada; avanço com defasagem adequada da terraplenagem; seções 4 e 5 atendidas.
 *   7.2.1 largura da faixa trabalhada: tolerância de + 0,15 m para cada lado do eixo, sem variação negativa (p. 7).
 *   7.2.2 acabamento visual: área isenta da camada vegetal e de elementos que prejudiquem a terraplenagem.
 *   7.2.3 atendimento ambiental (seção 6).
 *   7.3   aceito se 7.1 e 7.2 atendidos; o incorreto deve ser corrigido; corrigido só é aceito se ficar conforme.
 * A ES não fixa frequência para o controle geométrico: a ficha adota uma seção por estaca (20 m), medindo os dois lados.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt;

  // =====================================================================================================
  // FE.aceitacaoG7 — funções comuns às fichas de terraplenagem e proteção do corpo estradal
  // =====================================================================================================
  var G7 = {};
  // fichas de origem do grau de compactação (furos/pontos com GC, w e Δw = w − h ót)
  G7.FONTES_GC = ["dnit-458-2025-me", "dner-me-036-94", "dner-me-037-94", "dnit-417-2019-me", "dnit-405-2017-me"];
  // fichas de origem da compactação (γs,máx e h ót) e do ISC/expansão
  G7.FONTES_COMP = ["dnit-164-2013-me", "dnit-172-2016-me", "dnit-443-2023-me"];

  // furos/pontos de uma ficha de massa específica in situ → [{GC, w, dw, est, pos, rot}]
  G7.furos = function (e) {
    var r = e.resultados || {}, i = A.importacao.ident(e), pts = r.furos || r.pts || [];
    var nome = /417|405/.test(e.ficha) ? "ponto " : "furo ";
    return pts.map(function (f, j) {
      var w = ok(f.uW) ? f.uW : f.w, h = ok(r.hOt) ? r.hOt : NaN;
      var dw = ok(f.dw) ? f.dw : ok(w) && ok(h) ? w - h : NaN;
      return { GC: f.GC, w: w, dw: dw, est: f.estaca || i.local || "", pos: f.posicao || "", rot: nome + (j + 1) };
    }).filter(function (f) { return ok(f.GC); });
  };

  // parâmetro importarVarios: GC (e Δw) dos furos → tabelas d[idGC] e d[idDW] (colunas {est, pos, reg, v})
  G7.paramGC = function (k, idGC, idDW, opt) {
    opt = opt || {};
    return { k: k, r: opt.r || "Grau de compactação e umidade — importar furos/pontos (DNIT 458, DNER-ME 036/037, DNIT 417, DNIT 405)",
      tipo: "importarVarios", de: opt.de || G7.FONTES_GC, se: opt.se,
      dica: "cada furo/ponto vira uma coluna na tabela do GC" + (idDW ? " e na do Δw = w − h ót" : "") + ", com a estaca e a posição da ficha de origem",
      aplicar: function (lista, P, d) {
        var gc = [], dw = [];
        lista.forEach(function (e) {
          G7.furos(e).forEach(function (f) {
            var base = { est: f.est, pos: f.pos, reg: A.importacao.rotulo(e, f.rot) };
            gc.push(Object.assign({}, base, { v: A.nstr(f.GC, 1) }));
            if (ok(f.dw)) dw.push(Object.assign({}, base, { v: A.nstr(f.dw, 1) }));
          });
        });
        A.importacao.substituir(d, idGC, gc);
        if (idDW) A.importacao.substituir(d, idDW, dw);
      } };
  };

  // parâmetro importarVarios: compactação (γs,máx) e ISC/expansão (DNIT 172) → d[ids.comp], d[ids.isc], d[ids.exp]
  G7.paramComp = function (k, ids, opt) {
    opt = opt || {};
    return { k: k, r: opt.r || "Compactação, ISC e expansão — importar (DNIT 164 / 443 / 172)", tipo: "importarVarios",
      de: opt.de || G7.FONTES_COMP, se: opt.se,
      dica: "a DNIT 172 traz γs,máx, h ót, ISC e expansão; a 164 e a 443 só γs,máx e h ót",
      aplicar: function (lista, P, d) {
        var c = [], is = [], ex = [];
        lista.forEach(function (e) {
          var r = e.resultados || {}, i = A.importacao.ident(e), base = { est: i.local || "", pos: "", reg: A.importacao.rotulo(e) };
          if (ids.comp && ok(r.gsMax)) c.push(Object.assign({}, base, { v: A.nstr(r.gsMax, 3), reg: A.importacao.rotulo(e, ok(r.hOt) ? "h ót " + fmt(r.hOt, 1) + " %" : "") }));
          if (ids.isc && ok(r.isc)) is.push(Object.assign({}, base, { v: A.nstr(r.isc, r.isc >= 10 ? 0 : 1) }));
          if (ids.exp && ok(r.exp)) ex.push(Object.assign({}, base, { v: A.nstr(r.exp, 2) }));
        });
        if (ids.comp) A.importacao.substituir(d, ids.comp, c);
        if (ids.isc) A.importacao.substituir(d, ids.isc, is);
        if (ids.exp) A.importacao.substituir(d, ids.exp, ex);
      } };
  };

  // valores das fichas de caracterização (para "importar" de itens do A.fichaSimples)
  G7.p200 = function (e) {
    var m = ((e.resultados || {}).media || []).filter(function (x) { return Math.abs(x.mm - 0.075) < 0.004 && ok(x.pass); })[0];
    return m ? m.pass : NaN;
  };
  G7.passante = function (mm) {
    return function (e) {
      var m = ((e.resultados || {}).media || []).filter(function (x) { return Math.abs(x.mm - mm) / mm < 0.04 && ok(x.pass); })[0];
      return m ? m.pass : NaN;
    };
  };
  G7.ll = function (e) { var r = e.resultados || {}; return r.np || r.llNP ? NaN : r.LL; };
  G7.ip = function (e) { var r = e.resultados || {}; return r.ipNP ? 0 : r.IP; };

  // ---------- frequências no hook "extra" do A.fichaSimples ----------
  // índice da frequência do item (a fichaSimples usa o texto do item como nome do ensaio)
  function idxFreq(ctx, id) {
    var l = ctx.item[id];
    if (!l) return -1;
    for (var i = 0; i < ctx.freqs.length; i++) if (ctx.freqs[i].ensaio === l.criterio) return i;
    return -1;
  }
  // troca (cfg = objeto de A.frequencia, sem "ensaio"/"metodo"/"realizado") ou remove (cfg = null) a frequência do item
  G7.freq = function (ctx, id, cfg) {
    var i = idxFreq(ctx, id), l = ctx.item[id];
    if (!l) return null;
    if (cfg === null) { if (i >= 0) ctx.freqs.splice(i, 1); return null; }
    var velha = i >= 0 ? ctx.freqs[i] : {};
    var f = A.frequencia(Object.assign({ ensaio: l.criterio, metodo: velha.metodo || l.metodo || "—", realizado: l.n || 0 }, cfg));
    if (l.situacao === "nao_exigido") f.situacao = "nao_exigido";
    if (i >= 0) ctx.freqs[i] = f; else ctx.freqs.push(f);
    return f;
  };
  // n exigido de uma frequência já calculada (NaN se não houver)
  G7.exigido = function (ctx, id) { var i = idxFreq(ctx, id); return i >= 0 ? ctx.freqs[i].exigido : NaN; };
  // seções de controle geométrico a cada "passo" m (incluindo as pontas), com "porSecao" medidas por seção
  G7.freqSecoes = function (ctx, id, passo, porSecao, regra) {
    var L = ctx.L, sec = ok(L.ext) ? A.nPontos(L.ext, passo) : NaN;
    return G7.freq(ctx, id, { exigido: ok(sec) ? sec * porSecao : NaN, regra: regra });
  };
  // retira da tela/relatório as linhas "não exigido" dos itens listados (itens que só existem numa variante do serviço)
  G7.ocultar = function (ctx, ids) {
    ids.forEach(function (id) {
      var l = ctx.item[id];
      if (!l || l.situacao !== "nao_exigido") return;
      G7.freq(ctx, id, null);
      var i = ctx.linhas.indexOf(l);
      if (i >= 0) ctx.linhas.splice(i, 1);
    });
  };
  // situação de uma linha forçada (A.marcar só piora; aqui é para abrandar com justificativa da ES)
  G7.abrandar = function (l, sit, texto) {
    l.situacao = sit; l.motivo = texto; l.motivos = [{ situacao: sit, texto: texto }];
    return l;
  };

  // ---------- itens de compactação da DNIT 108 (7.1, 7.2.3, 5.3.5) — usados pela 108 e pela 106 ----------
  // o: { pre: prefixo dos ids, camada: function (P) -> "corpo" | "final", se: function (P) (aplica-se?), grupoIns, grupoComp,
  //      iscMin: function (P), gcMin: function (P), secao: {…} textos de seção }
  G7.itensCompactacao = function (o) {
    var pre = o.pre || "", cam = o.camada, se = o.se || function () { return true; };
    var final = function (P) { return cam(P) === "final"; };
    var gI = o.grupoIns || "Controle dos insumos (7.1)", gC = o.grupoComp || "Compactação (5.3.5 e 7.2.3)";
    return [
      { id: pre + "comp", grupo: gI, texto: "Ensaio de compactação — γs,máx", secao: o.secComp || "7.1 a, b", tipo: "valor", unid: "g/cm³", casas: 3,
        metodo: "DNIT 164 (antiga DNER-ME 129)", se: se, exigido: "referência do GC — Método A (corpo) / B (camada final)" },
      { id: pre + "gran", grupo: gI, texto: "Granulometria — % passando na nº 200", secao: o.secGran || "7.1 c, d", tipo: "valor", unid: "%", casas: 1,
        metodo: "DNIT 412 (antiga DNER-ME 080)", se: se, exigido: "caracterização conforme projeto (5.1 a)",
        importar: { de: "dnit-412-2025-me", valores: G7.p200 } },
      { id: pre + "ll", grupo: gI, texto: "Limite de liquidez", secao: o.secGran || "7.1 c, d", tipo: "valor", unid: "%", casas: 0,
        metodo: "DNER-ME 122", se: se, exigido: "caracterização conforme projeto (5.1 a)",
        importar: { de: ["dner-me-122-94", "dner-me-082-94"], valores: G7.ll } },
      { id: pre + "ip", grupo: gI, texto: "Índice de plasticidade", secao: o.secGran || "7.1 c, d", tipo: "valor", unid: "%", casas: 0,
        metodo: "DNER-ME 082", se: se, exigido: "caracterização conforme projeto (5.1 a); NP = 0",
        importar: { de: "dner-me-082-94", valores: G7.ip } },
      { id: pre + "isc", grupo: gI, texto: "Índice de Suporte Califórnia (ISC)", secao: o.secIsc || "5.1 c, d; 7.1 e; 7.4", tipo: "estatistico", unid: "%", casas: 1,
        metodo: "DNIT 172 (antiga DNER-ME 049)", se: se, min: function (P) { return final(P) ? (o.iscMin ? o.iscMin(P) : num(P.iscMin)) : 2; } },
      { id: pre + "exp", grupo: gI, texto: "Expansão", secao: o.secExp || "5.1 c, d; 7.4", tipo: "estatistico", unid: "%", casas: 2,
        metodo: "DNIT 172 (antiga DNER-ME 049)", se: se, max: function (P) { return final(P) ? 2 : 4; } },
      { id: pre + "gc", grupo: gC, texto: "Grau de compactação (GC)", secao: o.secGC || "5.3.5; 7.2.3 c; 7.4", tipo: "estatistico", unid: "%", casas: 1,
        metodo: "DNIT 458 (DNER-ME 092) / DNER-ME 037", se: o.seGC || se, min: function (P) { return o.gcMin ? o.gcMin(P) : ok(num(P.gcMin)) ? num(P.gcMin) : 100; } },
      { id: pre + "dw", grupo: gC, texto: "Umidade de compactação: Δw = w − h ót", secao: o.secDw || "5.3.5 a", tipo: "valor", unid: "p.p.", casas: 1,
        min: -3, max: 3, falha: "ressalva", se: o.seDw || o.seGC || se, exigido: "h ót ± 3 (Δw de −3,0 a +3,0)" },
    ];
  };
  // frequências dos itens de compactação (7.1 a–e, 7.2.3 a) e remoção das que a ES não fixa
  G7.freqCompactacao = function (ctx, o) {
    var P = ctx.P, pre = o.pre || "", final = o.camada(P) === "final", aplica = !o.se || o.se(P);
    var aplicaGC = (o.seGC || o.se || function () { return true; })(P), nPlan = num(P.nGC);
    if (aplicaGC) G7.freq(ctx, pre + "gc", { exigido: Math.max(5, ok(nPlan) ? Math.round(nPlan) : 0),
      regra: "mín. 5 por camada/segmento (" + (o.secFreqGC || "7.2.3 a") + ")" + (ok(nPlan) ? "; " + Math.round(nPlan) + " informadas pelo executante (NOTA)" : "") });
    G7.freq(ctx, pre + "dw", null);
    if (!aplica) return;
    var vol = num(P[o.volume || "volume"]);
    G7.freq(ctx, pre + "comp", { por: "volume", a_cada: final ? 200 : 1000, qtd: vol, unidade: "m³",
      regra: "1 a cada " + (final ? "200" : "1.000") + " m³ (" + (final ? "7.1 b" : "7.1 a") + ")" });
    var nComp = Math.max(G7.exigido(ctx, pre + "comp") || 0, (ctx.item[pre + "comp"] || {}).n || 0), grupo = final ? 4 : 10;
    if (!ok(vol) && !nComp) ctx.avisos.push("Informe o volume compactado no lote (m³): a frequência dos ensaios de compactação depende dele (7.1).");
    ["gran", "ll", "ip"].forEach(function (x) {
      G7.freq(ctx, pre + x, { exigido: Math.max(1, Math.ceil(nComp / grupo)), regra: "1 por grupo de " + grupo + " ensaios de compactação (" + (final ? "7.1 d" : "7.1 c") + ")" });
    });
    ["isc", "exp"].forEach(function (x) {
      if (final) G7.freq(ctx, pre + x, { exigido: Math.max(1, Math.ceil(nComp / 4)), regra: "1 por grupo de 4 ensaios de compactação (7.1 e)" });
      else G7.freq(ctx, pre + x, { exigido: 1, regra: "7.1 não fixa para o corpo — mín. 1 por lote (adotado, 5.1 c)" });
    });
  };

  // ---------- itens de verificação comuns ----------
  G7.ambiental = function (secao, secao6, grupo) {
    return { id: "amb", grupo: grupo || "Verificações", texto: "Atendimento ambiental (condicionantes da seção " + (secao6 || "6") + ")", secao: secao, tipo: "sim_nao",
      exigido: "medidas da seção " + (secao6 || "6") + " observadas" };
  };

  FE.aceitacaoG7 = G7;

  // =====================================================================================================
  // Ficha da DNIT 104/2009-ES
  // =====================================================================================================
  var ID = "dnit-104-2009-es";
  var P_ = function (P) { return P || {}; };
  A.fichaSimples({
    id: ID,
    titulo: "Serviços preliminares de terraplenagem (desmatamento, destocamento e limpeza) — aceitação",
    resumo: "Verificações da seção 7 da DNIT 104/2009-ES: autorização e programação (7.1), largura da faixa trabalhada (+ 0,15 m por lado, sem variação negativa — 7.2.1), " +
      "acabamento (7.2.2), tocos e raízes nos cortes e aterros (5.3.3, 5.3.4), árvores preservadas e cercas (5.3.7, 5.3.10) e atendimento ambiental (7.2.3).",
    lote: { largura: false },
    params: [
      { k: "local", r: "Tipo de área", tipo: "select", recarrega: true, opcoes: [["plataforma", "Plataforma da via (cortes e aterros)"], ["emprestimo", "Empréstimo / área de apoio"]] },
      { k: "temCorte", r: "Há segmentos em corte no lote?", tipo: "select", recarrega: true, opcoes: [["sim", "Sim"], ["nao", "Não"]],
        se: function (d) { return P_(d.params).local !== "emprestimo"; } },
      { k: "temAterro", r: "Há segmentos em aterro no lote?", tipo: "select", recarrega: true, opcoes: [["sim", "Sim"], ["nao", "Não"]],
        se: function (d) { return P_(d.params).local !== "emprestimo"; } },
      { k: "cercas", r: "Houve remoção de cercas?", tipo: "select", recarrega: true, opcoes: [["nao", "Não"], ["sim", "Sim"]] },
    ],
    padrao: { local: "plataforma", temCorte: "sim", temAterro: "sim", cercas: "nao" },
    refs: { reprova: "7.3", atende: "7.3", corrige: "7.3", regra: "7.2", tabela: "—" },
    criterios: [
      { id: "aut", grupo: "Controle da execução (7.1)", texto: "Execução formalmente autorizada pela Fiscalização", secao: "7.1", tipo: "sim_nao", exigido: "autorização registrada" },
      { id: "prog", grupo: "Controle da execução (7.1)", texto: "Avanço com defasagem adequada da terraplenagem e conforme a programação", secao: "7.1", tipo: "sim_nao",
        exigido: "conforme a programação (4.2.7)" },
      { id: "limites", grupo: "Controle da execução (7.1)", texto: "Operações restritas aos off-sets + faixa mínima de operação (ou à área mínima do empréstimo)", secao: "5.3.2", tipo: "sim_nao",
        exigido: "sem desmatamento além do necessário" },
      { id: "corte60", grupo: "Controle da execução (7.1)", texto: "Cortes: camada de 60 cm abaixo do greide isenta de tocos e raízes", secao: "5.3.3", tipo: "sim_nao",
        exigido: "totalmente isenta", se: function (P) { return P.local !== "emprestimo" && P.temCorte !== "nao"; }, naoAplicaPor: "sem segmentos em corte" },
      { id: "aterro2", grupo: "Controle da execução (7.1)", texto: "Aterros: camada vegetal removida (cota vermelha < 2,00 m) ou corte rente ao terreno (> 2,00 m)", secao: "5.3.4", tipo: "sim_nao",
        exigido: "conforme a cota vermelha", se: function (P) { return P.local !== "emprestimo" && P.temAterro !== "nao"; }, naoAplicaPor: "sem segmentos em aterro" },
      { id: "arvores", grupo: "Controle da execução (7.1)", texto: "Árvores assinaladas preservadas sem danos; toras reservadas transportadas ao local determinado", secao: "5.3.7", tipo: "sim_nao",
        exigido: "sem danos às árvores preservadas" },
      { id: "cercas", grupo: "Controle da execução (7.1)", texto: "Nova cerca construída antes da remoção da antiga", secao: "5.3.10", tipo: "sim_nao",
        se: function (P) { return P.cercas === "sim"; }, naoAplicaPor: "sem remoção de cercas" },
      { id: "larg", grupo: "Verificação do produto (7.2)", texto: "Variação da largura da faixa trabalhada em relação à Nota de Serviço (por lado do eixo)", secao: "7.2.1",
        tipo: "valor", unid: "cm", casas: 0, min: 0, max: 15, exigido: "0 a + 15 cm por lado (sem variação negativa)", metodo: "levantamento topográfico",
        se: function (P) { return P.local !== "emprestimo"; }, naoAplicaPor: "empréstimo/área de apoio: área mínima (5.3.2)",
        freq: { por: "extensao", a_cada: 20, pontos: true } },
      { id: "acab", grupo: "Verificação do produto (7.2)", texto: "Acabamento: área isenta da camada vegetal e de elementos que prejudiquem a terraplenagem (visual)", secao: "7.2.2",
        tipo: "sim_nao", exigido: "superfície limpa", freq: { por: "extensao", a_cada: 100, regra: "1 inspeção a cada 100 m (adotado — a ES não fixa)" } },
      { id: "amb", grupo: "Verificação do produto (7.2)", texto: "Atendimento ambiental (condicionantes da seção 6)", secao: "7.2.3", tipo: "sim_nao", exigido: "medidas da seção 6 observadas" },
    ],
    extra: function (ctx) {
      // largura: LE e LD em cada seção (uma por estaca de 20 m, adotado)
      if (ctx.P.local !== "emprestimo") FE.aceitacaoG7.freqSecoes(ctx, "larg", 20, 2, "LE e LD a cada 20 m, incluindo as pontas (adotado — a ES não fixa)");
    },
    textos: {
      REJEITADO: { titulo: "LOTE REJEITADO", texto: "Há verificação não conforme: \"todo componente ou detalhe incorreto deve ser corrigido\" e o serviço só é aceito se as correções o colocarem em conformidade (7.3)." },
      ACEITO: { titulo: "LOTE ACEITO", texto: "Prescrições das subseções 7.1 e 7.2 atendidas: o serviço deve ser aceito (7.3)." },
    },
    notas: "Critérios da DNIT 104/2009-ES, seção 7. Largura da faixa trabalhada (7.2.1): + 0,15 m por lado do eixo, sem variação negativa — digite a variação medida − projeto, em cm, " +
      "para cada lado (LE/LD) de cada seção. A ES não fixa a frequência das verificações: a ficha adota uma seção por estaca (20 m) e uma inspeção de acabamento a cada 100 m.",
    exemplos: [
      { nome: "Lote aceito — 200 m de plataforma com cortes e aterros", dados: function () {
        var larg = [];
        [6, 9, 4, 12, 8, 3, 10, 7, 5, 11, 9].forEach(function (v, i) {
          larg.push({ est: String(60 + i), pos: "LE", reg: "Topografia — seção " + (60 + i), v: String(v) });
          larg.push({ est: String(60 + i), pos: "LD", reg: "Topografia — seção " + (60 + i), v: String([5, 8, 11, 6, 2, 9, 13, 4, 7, 10, 6][i]) });
        });
        return { ident: { registro: "LOTE-DL-01", data: "2026-05-12", obra: "Obra A — BR-000", trecho: "Segmento 3", local: "Est. 60 a 70" },
          params: { estIni: "60", estFim: "70", local: "plataforma", temCorte: "sim", temAterro: "sim", cercas: "sim" },
          verificacoes: [{ atende: "S", real: "1" }, { atende: "S", real: "2" }, { atende: "S", real: "2" }, { atende: "S", real: "3", obs: "estacas 61 a 64" },
            { atende: "S", real: "2", obs: "cota vermelha < 2 m: camada removida" }, { atende: "S", real: "1", obs: "4 árvores caiadas preservadas" }, { atende: "S", real: "1" },
            { atende: "S", real: "2" }, { atende: "S", real: "1" }],
          larg: larg };
      } },
      { nome: "Lote rejeitado — faixa estreita num lado, tocos no corte e acabamento pendente", dados: function () {
        var larg = [];
        [4, 7, 2, -8, 5, 9].forEach(function (v, i) {
          larg.push({ est: String(10 + i), pos: "LE", reg: "Topografia", v: String(v) });
          larg.push({ est: String(10 + i), pos: "LD", reg: "Topografia", v: String([6, 18, 3, 5, 8, 4][i]) });
        });
        return { ident: { registro: "LOTE-DL-02", data: "2026-06-03", obra: "Obra B", trecho: "Segmento 1", local: "Est. 10 a 15" },
          params: { estIni: "10", estFim: "15", local: "plataforma", temCorte: "sim", temAterro: "nao", cercas: "nao" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { real: "3", nc: "1", obs: "tocos a 40 cm do greide na estaca 13" },
            {}, { atende: "S" }, {}, {}, { atende: "S" }],
          larg: larg };
      } },
    ],
  });
})();
