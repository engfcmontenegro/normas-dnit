/*
 * Ficha de ES: DNIT 047/2004-ES — Pavimento rígido com equipamento de pequeno porte — aceitação do trecho de inspeção.
 *
 * Este arquivo também define FE.aceitacaoG6 (abreviado G), a biblioteca comum das fichas de PAVIMENTO RÍGIDO
 * (DNIT 047, 048, 049, 057, 058, 065, 066, 067 e 068-ES), carregada antes delas (ordem das tags no index.html).
 * Usa a biblioteca FE.aceitacao (es-comum.js): a ficha é uma A.fichaSimples (verificações sim/não e itens de valor)
 * acrescida de "componentes" com regras próprias destas ES:
 *   G.compResistencia  — resistência característica estimada do concreto (fctM,est / fck,est = f̄ − k·s, k de Student
 *                        da Tabela 1 das ES; ou f̄·(1 − 0,842·v) da DNIT 065; ou fc7 − k·s da DNIT 058) + verificação
 *                        suplementar com testemunhos extraídos;
 *   G.compGeometria    — largura e espessura (nivelamento do topo da sub-base e do topo do pavimento, a cada 20 m);
 *   G.compAgua         — água de amassamento (limites da 5.1.3, DNIT 036-ME; ensaios comparativos DNIT 037-ME);
 *   G.compSelante      — material selante (DNIT 046-EM, ensaios DNIT 038 a 052-ME);
 *   G.compGC, G.compISC, G.compProctor, G.compLimites — sub-bases de solo com cimento (DNIT 057 e 058).
 *   G.criarFicha(cfg)  — junta tudo: cfg da fichaSimples + componentes: [...] (+ preparar(d), extra(ctx)).
 * Critério adotado para as exigências da seção 5 (execução): falha = "ressalva" (corrigir / registrar a não
 * conformidade conforme a DNIT 011-PRO), salvo quando a ES proíbe expressamente ("não se permitindo", "não se
 * admitindo", "em nenhuma hipótese") — então "não conforme". Critérios da seção 7 reprovam.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var G = {};

  // Tabela 1 das DNIT 047/048/049/058/068-ES ("Coeficiente de distribuição de Student", amostragem variável); n > 32: 0,842
  G.STUDENT = [[6, 0.920], [7, 0.906], [8, 0.896], [9, 0.889], [10, 0.883], [12, 0.876], [15, 0.868], [18, 0.863], [20, 0.861],
    [25, 0.857], [30, 0.854], [32, 0.842]];
  G.STUDENT_TXT = "n = 6, 7, 8, 9, 10, 12, 15, 18, 20, 25, 30, 32, > 32 → k = 0,920; 0,906; 0,896; 0,889; 0,883; 0,876; 0,868; 0,863; 0,861; 0,857; 0,854; 0,842; 0,842";
  // Tabela 1 da DNER-PRO 277/97 (= Tabela 1 da DNIT 057 e Tabela 2 da DNIT 058): sem n = 11
  G.K277 = [[5, 1.55], [6, 1.41], [7, 1.36], [8, 1.31], [9, 1.25], [10, 1.21], [12, 1.16], [13, 1.13], [14, 1.11], [15, 1.10],
    [16, 1.08], [17, 1.06], [19, 1.04], [21, 1.01]];
  G.K277_TXT = "n = 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16, 17, 19, 21 → k = 1,55; 1,41; 1,36; 1,31; 1,25; 1,21; 1,16; 1,13; 1,11; 1,10; 1,08; 1,06; 1,04; 1,01";

  var imp = A.importacao;
  function P_(d) { return d.params || {}; }
  function cheia(c, ks) { return ks.some(function (k) { return c && String(c[k] === undefined ? "" : c[k]).trim() !== ""; }); }
  function estX(s) { return A.estacaM(s, { estrito: true }); }
  function pt(c, v, rot) { return { v: v, est: c.est || "", x: estX(c.est), rot: rot }; }
  function kTxt(K, tab, nomeTab) {
    if (!K) return "";
    if (K.exato) return "";
    var ult = tab[tab.length - 1];
    return K.nTab >= ult[0] ? " — n > " + ult[0] + ": k = " + fmt(K.k, 3) + " (" + nomeTab + ")" : " — n não tabelado: k de n = " + K.nTab + " (" + nomeTab + ")";
  }
  G.cheia = cheia; G.pt = pt; G.estX = estX;

  // ===================================================================================================
  // linha "estatística pura" (aceitação automática X̄ − k·s ≥ mín.; sem ressalva por valor individual)
  // ===================================================================================================
  G.linhaEst = function (o) {
    var e = A.estatistica(o.pontos, o.min, NaN, { tabelaK: o.tabelaK, nMin: o.nMin, k: o.k });
    var l = A.linha({ id: o.id, grupo: o.grupo || "", criterio: o.criterio, secao: o.secao, unid: o.unid, casas: o.casas, n: e.n,
      media: e.n ? e.X : NaN, s: e.n ? e.s : NaN, lim: { min: o.min }, exigido: o.exigido, pontos: e.vals, est: e });
    l.resultado = e.n ? "n = " + e.n + (ok(e.X) ? " · X̄ = " + fmt(e.X, o.casas) : "") + (ok(e.s) ? " · s = " + fmt(e.s, o.casas + 1) : "") : "—";
    if (e.modo === "estatistico") {
      l.k = e.k; l.inf = e.inf; l.K = A.coefK(e.n, { tabelaK: o.tabelaK, nMin: o.nMin, k: o.k });
      l.resultado += " · k = " + fmt(e.k, 3) + " · X̄ − k·s = " + fmt(e.inf, o.casas + 1);
    }
    return l;
  };

  // ===================================================================================================
  // G.criarFicha
  // ===================================================================================================
  G.criarFicha = function (cfg) {
    var comps = (cfg.componentes || []).filter(Boolean), params = (cfg.params || []).slice();
    comps.forEach(function (c) { params = params.concat(c.params || []); });
    var ult = { tab: {}, res: {}, prov: [] };
    var fs = A.fichaSimples({ id: cfg.id, registrar: false, norma: cfg.norma, titulo: cfg.titulo, resumo: cfg.resumo, rotuloLink: cfg.rotuloLink,
      lote: cfg.lote, params: params, padrao: cfg.padrao, criterios: cfg.criterios || [], refs: cfg.refs, tabelaK: cfg.tabelaK, nMin: cfg.nMin,
      textos: cfg.textos, estilo: "estatistico", notas: cfg.notas,
      providencias: function (par, linhas) {
        var p = [];
        linhas.forEach(function (l) { if (l.prov && (l.situacao === "nao_conforme" || l.situacao === "pendente" || l.situacao === "ressalva") && p.indexOf(l.prov) < 0) p.push(l.prov); });
        return p.concat(ult.prov);
      },
      extra: function (ctx) {
        var ini = [], fim = [], fIni = [];
        // frequência própria de itens (freqG: function (P, L, d) -> {exigido, regra})
        (cfg.criterios || []).forEach(function (it) {
          if (!it.freqG) return;
          ctx.freqs.forEach(function (f, i) {
            if (f.ensaio !== it.texto || f.situacao === "nao_exigido") return;
            var g = it.freqG(ctx.P, ctx.L, ctx.d);
            ctx.freqs[i] = A.frequencia({ ensaio: f.ensaio, metodo: f.metodo, regra: g.regra, exigido: g.exigido, realizado: f.realizado });
          });
        });
        comps.forEach(function (c) {
          if (c.se && !c.se(ctx.P)) return;
          var r = c.calcular(ctx) || {};
          (c.fim ? fim : ini).push.apply(c.fim ? fim : ini, r.linhas || []);
          fIni.push.apply(fIni, r.freqs || []);
          Object.keys(r.tab || {}).forEach(function (k) { ult.tab[k] = r.tab[k]; });
          if (r.res) ult.res[c.id] = r.res;
          (r.avisos || []).forEach(function (a) { ctx.avisos.push(a); });
          (r.cartoes || []).forEach(function (x) { (ult.res._cartoes = ult.res._cartoes || []).push(x); });
          (r.relat || []).forEach(function (x) { (ult.res._relat = ult.res._relat || []).push(x); });
        });
        Array.prototype.splice.apply(ctx.linhas, [0, 0].concat(ini));
        Array.prototype.push.apply(ctx.linhas, fim);
        Array.prototype.splice.apply(ctx.freqs, [0, 0].concat(fIni));
        if (cfg.extra) cfg.extra(ctx, ult);
      },
    });
    var tab0 = fs.tabelas, calc0 = fs.calcular;
    function tabelas(d) {
      var P = P_(d), T = [];
      comps.forEach(function (c) { if (!c.se || c.se(P)) T = T.concat(c.tabelas ? c.tabelas(d, P) || [] : []); });
      return T.concat(tab0(d));
    }
    function calcular(d) {
      ult = { tab: {}, res: {}, prov: [] };
      var dd = cfg.preparar ? cfg.preparar(d) : d;
      var out = calc0(dd);
      out.tab = Object.assign({}, out.tab || {}, ult.tab);
      out.resultados.g6 = ult.res;
      if (dd !== d && dd.params) out.resultados.paramsDerivados = dd.params;
      return out;
    }
    function cartoes(r) {
      var L = r.lote, c = (r.g6 && r.g6._cartoes) || [];
      return '<div class="fe-res">' + A.cartao(ok(L.ext) ? fmt(L.ext, 0) + " m" : "—", "Extensão do trecho" + (ok(L.ini) && ok(L.fim) ? " (est. " + A.fmtEstaca(L.ini) + " a " + A.fmtEstaca(L.fim) + ")" : "")) +
        (ok(L.area) ? A.cartao(fmt(L.area, 0) + " m²", "Área (extensão × largura)") : "") + c.map(function (x) { return A.cartao(x[0], x[1]); }).join("") + "</div>";
    }
    function resultadosHtml(calc) {
      var r = calc.resultados;
      return A.htmlParecer(r.parecer) + cartoes(r) +
        '<h4 style="margin:12px 0 4px">Critérios de aceitação</h4>' + A.htmlCriterios(r.linhas, { estilo: "estatistico" }) +
        (r.freqs.length ? '<h4 style="margin:12px 0 4px">Frequência dos ensaios e verificações</h4>' + A.htmlFrequencia(r.freqs) : "");
    }
    var F = {
      titulo: cfg.titulo, resumo: cfg.resumo || "", rotuloLink: cfg.rotuloLink || "Aceitação de lote", lote: true, blocos: [],
      params: fs.params, padrao: fs.padrao, tabelas: tabelas, calcular: calcular, resultadosHtml: resultadosHtml, graficos: fs.graficos,
      relatorio: {
        notas: fs.relatorio.notas,
        parametros: cfg.parametrosRelatorio,
        resultados: function (calc, d) {
          var rows = fs.relatorio.resultados(calc, d), r = calc.resultados;
          return rows.concat((r.g6 && r.g6._relat) || []);
        },
        extraHtml: fs.relatorio.extraHtml,
      },
      exemplos: cfg.exemplos || [],
      itensSN: (cfg.criterios || []).filter(function (it) { return it.tipo === "sim_nao"; }),
    };
    if (!F.relatorio.parametros) delete F.relatorio.parametros;
    if (cfg.norma) F.norma = cfg.norma;
    FE.FICHAS[cfg.id] = F;
    return F;
  };

  // ===================================================================================================
  // Resistência do concreto
  //   o: { secao, secMold, secSup, tipos: ["flexao","compressao"] | ["flexao"] | ["compressao"], formula: "student" | "cv" | "solo",
  //        exPorTrecho, areaTrecho, volTrecho, porDia, fkPadrao, idadePadrao, sup: "estimativa" | "individual" | "media", supMin,
  //        importar: [fids], secaoExig }
  // ===================================================================================================
  G.compResistencia = function (o) {
    var tipos = o.tipos || ["flexao", "compressao"];
    function tipo(P) { return tipos.length === 1 ? tipos[0] : (P.resTipo === "compressao" ? "compressao" : "flexao"); }
    function sim(P) {
      var t = tipo(P);
      if (o.formula === "solo") return { nome: "fc,est = fc7 − k·s", fk: "fc de projeto", casas: 2, cod: "fc" };
      if (t === "flexao") return { nome: "fctM,est = fctM − k·s", fk: "fctM,k", casas: 2, cod: "fctM" };
      return { nome: o.formula === "cv" ? "fck,est = fc28·(1 − 0,842·v)" : "fck,est = fc − k·s", fk: "fck", casas: 1, cod: "fc" };
    }
    function fk(P) { return num(tipo(P) === "flexao" && o.formula !== "solo" ? P.fctmk : P.fck); }
    function idade(P) { var x = num(P.idadeCtrl); return ok(x) ? x : o.idadePadrao || 28; }
    var params = [];
    if (tipos.length > 1) params.push({ k: "resTipo", r: "Resistência de controle (" + o.secaoExig + ")", tipo: "select", recarrega: true,
      opcoes: [["flexao", "Tração na flexão — CPs prismáticos (NBR 12142)"], ["compressao", "Compressão axial — CPs cilíndricos (NBR 5739), com correlação ensaiada"]] });
    if (tipos.indexOf("flexao") >= 0 && o.formula !== "solo") params.push({ k: "fctmk", r: "fctM,k de projeto (MPa)", ph: "4,5", se: function (d) { return tipo(P_(d)) === "flexao"; } });
    if (tipos.indexOf("compressao") >= 0 || o.formula === "solo") params.push({ k: "fck", r: o.formula === "solo" ? "fc de projeto / dosagem aos 7 dias (MPa)" : "fck de projeto (MPa)" + (o.fkPadrao ? " — ES: " + fmt(o.fkPadrao, 1) : ""),
      se: function (d) { return tipo(P_(d)) === "compressao" || o.formula === "solo"; } });
    params.push({ k: "idadeCtrl", r: "Idade de controle (dias)", ph: String(o.idadePadrao || 28), dica: o.formula === "solo" ? "7 dias (7.3.1)" : "a do projeto (5.1.10 a); as expressões da ES citam 28 dias" });
    params.push({ k: "resSup", r: "Verificação suplementar — testemunhos extraídos (" + o.secSup + ")", tipo: "select", recarrega: true,
      opcoes: [["nao", "Não realizada"], ["sim", "Sim — digitar os resultados dos testemunhos"]] });
    if (o.importar && o.importar.length) params.push({ k: "impRes", r: "Resistência — importar exemplares (" + o.importar.map(A.codigoCurto).join(" / ") + ")", tipo: "importarVarios", de: o.importar,
      dica: "cada exemplar/CP vira uma coluna (as colunas digitadas são mantidas)",
      aplicar: function (lista, P, d) {
        var cols = [];
        lista.forEach(function (e) {
          var r = e.resultados || {}, i = imp.ident(e), loc = i.local || "";
          if (e.ficha === "dner-me-201-94") {
            (r.grupos || []).forEach(function (g) {
              (g.vals || []).forEach(function (v, j) { cols.push({ est: loc, reg: imp.rotulo(e, (g.grupo ? g.grupo + " " : "") + "CP " + (j + 1)), idade: ok(g.idade) ? String(g.idade) : "", cp1: A.nstr(v, 2), cp2: "" }); });
            });
            return;
          }
          (r.lista || []).forEach(function (x) {
            var v = String(x.cps || "").split(";").map(function (s) { return num(String(s).split(":").pop()); }).filter(ok);
            if (!v.length) v = [x.fc];
            cols.push({ est: loc, reg: imp.rotulo(e, x.nome), idade: ok(x.idade) ? String(x.idade) : "", cp1: A.nstr(v[0], 1), cp2: v.length > 1 ? A.nstr(v[1], 1) : "" });
          });
        });
        imp.substituir(d, "res", cols, { chave: ["reg"] });
      } });

    function tabelas(d, P) {
      var s = sim(P), T = [{ chave: "res", titulo: "Resistência do concreto — exemplares (" + o.secMold + ")", rotulo: "Ex.", iniciais: o.formula === "solo" ? 2 : 6, min: 1,
        dica: o.formula === "solo" ? "uma coluna por corpo de prova (resistência à compressão simples, NBR 12025)" : "uma coluna por exemplar (2 CPs da mesma amassada); vale o maior dos dois (" + o.secMold + ")",
        linhas: [{ k: "est", r: o.formula === "solo" ? "Estaca / local" : "Placa / estaca", texto: true, ph: "ex.: 42+10 ou P-118" }, { k: "reg", r: "Registro / origem", texto: true },
          { k: "idade", r: "Idade de ruptura", u: "dias" }, { k: "cp1", r: o.formula === "solo" ? "Resistência do CP" : "CP 1", u: "MPa" }]
          .concat(o.formula === "solo" ? [] : [{ k: "cp2", r: "CP 2", u: "MPa" }, { calc: "fex", r: "Resistência do exemplar (maior)", u: "MPa", casas: s.casas, destaque: true }]) }];
      if (P.resSup === "sim") T.push({ chave: "ext", titulo: "Verificação suplementar — testemunhos extraídos (" + o.secSup + ")", rotulo: "CP", iniciais: 6, min: 1,
        dica: o.sup === "individual" ? "mínimo 6 testemunhos Ø 15 cm (NBR 7680)" : "mínimo 6 CPs extraídos das placas de menor resistência no controle",
        linhas: [{ k: "est", r: "Placa / estaca", texto: true }, { k: "reg", r: "Registro", texto: true }, { k: "v", r: "Resistência", u: "MPa" }] });
      return T;
    }
    function calcular(ctx) {
      var P = ctx.P, d = ctx.d, L = ctx.L, s = sim(P), f = fk(P), id = idade(P), av = [], sec = o.secao;
      var tabRes = (d.res || []).map(function (c) {
        var v = [num(c.cp1), num(c.cp2)].filter(ok);
        return { fex: v.length ? Math.max.apply(null, v) : NaN };
      });
      var pts = [], foraIdade = 0;
      (d.res || []).forEach(function (c, i) {
        var v = tabRes[i].fex;
        if (!ok(v)) return;
        if (ok(num(c.idade)) && num(c.idade) !== id) { foraIdade++; return; }
        pts.push(pt(c, v, (c.est ? String(c.est) : "ex. " + (i + 1))));
      });
      if (foraIdade) av.push("Resistência: " + foraIdade + " exemplar(es) com idade diferente da de controle (" + id + " dias) — fora da estimativa.");
      var tab = o.formula === "cv" ? null : G.STUDENT, nMin = o.formula === "cv" ? 2 : 6;
      var l = G.linhaEst({ id: "res", criterio: "Resistência característica estimada — " + s.nome, secao: sec, unid: "MPa", casas: s.casas, pontos: pts, min: f,
        tabelaK: tab, nMin: nMin, k: o.formula === "cv" ? 0.842 : undefined,
        exigido: s.nome.split(" = ")[0] + " ≥ " + (ok(f) ? fmt(f, s.casas) + " MPa (" + s.fk + ")" : s.fk) });
      l.txtEstat = ok(l.inf) ? s.nome.split(" = ")[0] + " = " + fmt(l.inf, s.casas + 1) : "—";
      var area = o.areaDe ? o.areaDe(P, L) : L.area;
      var nTr = Math.max(1, ok(area) && o.areaTrecho ? Math.ceil(area / o.areaTrecho - 1e-9) : 1, o.volTrecho && ok(num(P.volume)) ? Math.ceil(num(P.volume) / o.volTrecho - 1e-9) : 1);
      var exig = o.porDia ? Math.max(A.nMin(area, o.areaTrecho, 1), o.porDia * (ok(num(P.dias)) ? num(P.dias) : 1)) : o.exPorTrecho * nTr;
      var regra = o.porDia ? "1 a cada " + fmt(o.areaTrecho, 0) + " m²; mín. " + o.porDia + " por dia" :
        "mín. " + o.exPorTrecho + " exemplares por trecho de até " + fmt(o.areaTrecho, 0).replace(/\s/g, ".") + " m²" + (o.volTrecho ? " ou " + fmt(o.volTrecho, 0) + " m³" : "");
      var fr = A.frequencia({ ensaio: "Resistência do concreto (exemplares)", metodo: o.formula === "solo" ? "NBR 12025" : tipo(P) === "flexao" ? "NBR 12142" : "NBR 5739 (DNER-ME 091)", regra: regra, exigido: exig, realizado: l.n });
      var linhas = [l];
      if (!ok(f)) A.marcar(l, "pendente", "informe " + s.fk + " de projeto");
      else if (!l.n) { l.situacao = "sem_dados"; l.motivo = "sem exemplares na idade de controle"; }
      else if (l.n < nMin) A.marcar(l, "pendente", "n = " + l.n + ": a estimativa exige no mínimo " + nMin + " " + (o.formula === "solo" ? "resultados" : "exemplares") + " (" + o.secMold + ")");
      else if (l.inf >= f - 1e-9) {
        l.motivo = "aceitação automática (" + o.secAuto + "): " + l.txtEstat + " ≥ " + fmt(f, s.casas) + " MPa" + (tab ? kTxt(l.K, tab, "Tabela 1") : "");
      } else {
        var base = s.nome.split(" = ")[0] + " = " + fmt(l.inf, s.casas + 1) + " < " + fmt(f, s.casas) + " MPa: sem aceitação automática (" + o.secAuto + ")";
        var ext = (d.ext || []).map(function (c, i) { return pt(c, num(c.v), c.est || "testemunho " + (i + 1)); }).filter(function (p) { return ok(p.v); });
        if (P.resSup !== "sim" || !ext.length) {
          A.marcar(l, "pendente", base + " — verificação suplementar exigida: extrair no mínimo 6 corpos de prova (" + o.secSup + ")");
          l.prov = "Extrair no mínimo 6 corpos de prova das placas de menor resistência e ensaiá-los (" + o.secSup + ").";
        } else {
          var ls;
          if (o.sup === "individual") {
            ls = A.avaliar({ id: "resSup", criterio: "Verificação suplementar — testemunhos (cada resultado)", secao: o.secSup, unid: "MPa", casas: 1, pontos: ext, min: o.supMin, individual: true,
              exigido: "nenhum resultado < " + fmt(o.supMin, 1) + " MPa; mín. 6 testemunhos" });
            if (ext.length < 6) A.marcar(ls, "pendente", "só " + ext.length + " testemunho(s): mínimo 6");
          } else {
            ls = G.linhaEst({ id: "resSup", criterio: "Verificação suplementar — testemunhos (" + s.nome.split(" = ")[0] + ")", secao: o.secSup, unid: "MPa", casas: s.casas,
              pontos: ext, min: f, tabelaK: G.STUDENT, nMin: 6, exigido: s.nome.split(" = ")[0] + " ≥ " + fmt(f, s.casas) + " MPa (mín. 6 CPs)" });
            ls.txtEstat = ok(ls.inf) ? fmt(ls.inf, s.casas + 1) : "—";
            if (ls.n < 6) A.marcar(ls, "pendente", "só " + ls.n + " testemunho(s): mínimo 6");
            else if (ls.inf >= f - 1e-9) ls.motivo = "testemunhos: " + fmt(ls.inf, s.casas + 1) + " ≥ " + fmt(f, s.casas) + " MPa";
            else if (o.sup === "media" && ls.media >= f - 1e-9) A.marcar(ls, "ressalva", "X̄ − k·s = " + fmt(ls.inf, s.casas + 1) + " < fc, mas a média " + fmt(ls.media, 2) + " ≥ fc: aceita pela letra da 7.3.1 c (\"fc7 ≥ fc\") — confirmar com a Fiscalização");
            else A.marcar(ls, "nao_conforme", "testemunhos: " + fmt(ls.inf, s.casas + 1) + " < " + fmt(f, s.casas) + " MPa");
          }
          linhas.push(ls);
          if (ls.situacao === "conforme" || ls.situacao === "ressalva") { l.situacao = ls.situacao; l.motivo = base + "; aceito na verificação suplementar (" + o.secSup + ")"; }
          else if (ls.situacao === "pendente") A.marcar(l, "pendente", base + "; verificação suplementar incompleta");
          else { A.marcar(l, "nao_conforme", base + "; verificação suplementar também não atende"); l.prov = o.provNC; }
        }
      }
      if (o.areaTrecho && !o.porDia && ok(area) && area > o.areaTrecho + 1e-6) A.marcar(l, "ressalva", "lote de " + fmt(area, 0) + " m² > trecho de inspeção de " + fmt(o.areaTrecho, 0) + " m² (" + o.secMold + "): avaliar cada trecho separadamente");
      var cart = ok(l.inf) ? [[fmt(l.inf, s.casas + 1) + " MPa", s.nome.split(" = ")[0] + " (exigido ≥ " + (ok(f) ? fmt(f, s.casas) : "?") + ")"]] : [];
      return { linhas: linhas, freqs: [fr], tab: { res: tabRes }, avisos: av, cartoes: cart,
        relat: ok(l.inf) ? [["Resistência (" + s.nome + ")", fmt(l.inf, s.casas + 1) + " MPa com n = " + l.n + ", X̄ = " + fmt(l.media, s.casas + 1) + ", s = " + fmt(l.s, s.casas + 1) + ", k = " + fmt(l.k, 3)]] : [] };
    }
    return { id: "res", params: params, tabelas: tabelas, calcular: calcular };
  };

  // ===================================================================================================
  // Controle geométrico. modo: "rigido" (047/048/066/068), "049", "subbase" (057/058), "065"
  // ===================================================================================================
  G.compGeometria = function (o) {
    var params = [{ k: "largProj", r: "Largura de projeto (m)" }, { k: "espProj", r: (o.nomeEsp || "Espessura") + " de projeto (cm)" }];
    function tabelas() {
      return [{ chave: "geo", titulo: "Controle geométrico — relocação e nivelamento (" + o.secao + ")", rotulo: "Ponto", iniciais: 6, min: 1,
        dica: "uma coluna por ponto (eixo e bordos, a cada 20 m); a espessura sai das cotas do topo da " + (o.base || "sub-base") + " e do topo da camada, ou é digitada",
        linhas: [{ k: "est", r: "Estaca", texto: true }, { k: "pos", r: "Posição (eixo / BE / BD)", texto: true }, { k: "larg", r: "Largura medida na seção", u: "m" },
          { k: "cb", r: "Cota do topo da " + (o.base || "sub-base"), u: "m" }, { k: "ct", r: "Cota do topo da camada executada", u: "m" }, { k: "esp", r: "Espessura (se não houver cotas)", u: "cm" },
          { calc: "e", r: "Espessura", u: "cm", casas: 1, destaque: true }] }];
    }
    function calcular(ctx) {
      var P = ctx.P, d = ctx.d, L = ctx.L, lp = num(P.largProj), ep = num(P.espProj), linhas = [], av = [];
      var geo = d.geo || [];
      var tabGeo = geo.map(function (c) {
        var cb = num(c.cb), ct = num(c.ct), e = ok(cb) && ok(ct) ? (ct - cb) * 100 : num(c.esp);
        return { e: e };
      });
      var ePts = [], lPts = [], secs = {};
      geo.forEach(function (c, i) {
        var rot = (c.est ? "est. " + c.est : "ponto " + (i + 1)) + (c.pos ? " " + c.pos : "");
        if (ok(tabGeo[i].e)) ePts.push(pt(c, tabGeo[i].e, rot));
        if (ok(num(c.larg))) lPts.push(pt(c, num(c.larg), rot));
        if (cheia(c, ["larg", "esp", "ct"])) secs[String(c.est || "p" + i).trim()] = 1;
      });
      // largura
      var lmin, lmax, lex;
      if (o.modo === "subbase" || o.modo === "065") { lmin = lp - 0.10; lmax = lp + 0.10; lex = "± 10 cm do projeto (" + (ok(lp) ? fmt(lp - 0.1, 2) + " a " + fmt(lp + 0.1, 2) + " m" : "?") + ")"; }
      else { var tol = o.modo === "049" ? 0.01 : 0.10; lmin = lp * (1 - tol); lmax = lp * (1 + tol); lex = "variação < ± " + fmt(tol * 100, 0) + " % do projeto (" + (ok(lp) ? fmt(lmin, 2) + " a " + fmt(lmax, 2) + " m" : "?") + ")"; }
      var lL = A.avaliar({ id: "larg", grupo: "Controle geométrico", criterio: "Largura", secao: o.secLarg || o.secao, unid: "m", casas: 2, pontos: lPts, min: lmin, max: lmax, individual: true, exigido: lex });
      if (!ok(lp) && lL.n) A.marcar(lL, "pendente", "informe a largura de projeto");
      linhas.push(lL);
      // espessura
      var eL = A.linha({ id: "esp", grupo: "Controle geométrico", criterio: (o.nomeEsp || "Espessura") + " média", secao: o.secEsp || o.secao, unid: "cm", casas: 1 });
      var es = A.estatistica(ePts, ep, NaN, { individual: true });
      eL.est = es; eL.pontos = es.vals; eL.n = es.n; eL.media = es.n ? es.X : NaN; eL.s = es.n ? es.s : NaN; eL.lim = { min: ep };
      eL.txtEstat = es.n ? "mín. " + fmt(es.vMin, 1) + " / máx. " + fmt(es.vMax, 1) : "—";
      var linhas2 = [eL];
      if (o.modo === "065") {
        eL.criterio = "Espessura (cada ponto)"; eL.exigido = ok(ep) ? "± 10 % do projeto (" + fmt(ep * 0.9, 1) + " a " + fmt(ep * 1.1, 1) + " cm)" : "± 10 % do projeto";
        var e65 = A.avaliar({ id: "esp", grupo: "Controle geométrico", criterio: "Espessura (cada ponto)", secao: o.secEsp || o.secao, unid: "cm", casas: 1, pontos: ePts, min: ep * 0.9, max: ep * 1.1, individual: true, exigido: eL.exigido });
        if (e65.situacao === "nao_conforme") e65.prov = o.provEsp;
        linhas2 = [e65]; eL = e65;
      } else {
        eL.exigido = "X̄ ≥ " + (ok(ep) ? fmt(ep, 1) : "projeto") + " cm";
        if (!es.n) { eL.situacao = "sem_dados"; eL.motivo = "sem determinações"; }
        else if (!ok(ep)) A.marcar(eL, "pendente", "informe a espessura de projeto");
        else if (es.X < ep - 1e-9) {
          A.marcar(eL, "nao_conforme", "espessura média " + fmt(es.X, 2) + " cm < projeto " + fmt(ep, 1) + " cm");
          eL.prov = o.provEsp;
        } else eL.motivo = "média " + fmt(es.X, 2) + " cm ≥ " + fmt(ep, 1) + " cm";
        var aL;
        if (o.modo === "049") {
          aL = A.avaliar({ id: "espMin", grupo: "Controle geométrico", criterio: "Espessura — valores individuais", secao: o.secEsp || o.secao, unid: "cm", casas: 1, pontos: ePts, min: ep - 1, individual: true,
            exigido: "nenhum < " + (ok(ep) ? fmt(ep - 1, 1) : "projeto − 1") + " cm" });
        } else {
          aL = A.linha({ id: "espAmp", grupo: "Controle geométrico", criterio: "Espessura — maior − menor valor", secao: o.secEsp || o.secao, unid: "cm", casas: 1, n: es.n, semMedia: true,
            exigido: "≤ 1,0 cm", txtEstat: es.n ? fmt(es.vMax - es.vMin, 1) + " cm" : "—" });
          if (!es.n) { aL.situacao = "sem_dados"; aL.motivo = "sem determinações"; }
          else if (es.vMax - es.vMin > 1 + 1e-9) { A.marcar(aL, "nao_conforme", "amplitude " + fmt(es.vMax - es.vMin, 1) + " cm > 1 cm (máx. " + fmt(es.vMax, 1) + "; mín. " + fmt(es.vMin, 1) + ")"); aL.prov = "Espessura irregular (maior − menor > 1 cm): o trecho não é aceito quanto à geometria (" + (o.secEsp || o.secao) + ") — corrigir e refazer a verificação."; }
          else aL.motivo = "amplitude " + fmt(es.vMax - es.vMin, 1) + " cm";
        }
        linhas2.push(aL);
      }
      linhas = linhas.concat(linhas2);
      var nSec = Object.keys(secs).length, exig = A.nPontos(L.ext, 20);
      if (o.modo === "subbase") exig = Math.max(6, ok(exig) ? exig : 6);
      var fr = A.frequencia({ ensaio: "Controle geométrico (seções)", metodo: "relocação e nivelamento", regra: o.modo === "subbase" ? "mín. 6 determinações, a no máximo 20 m" : "de 20 m em 20 m (eixo e bordos)",
        exigido: exig, realizado: nSec });
      var cob = A.cobertura(ePts, L, 20, "Espessura");
      av = av.concat(cob.avisos);
      if (cob.motivo) A.marcar(eL, "ressalva", cob.motivo);
      // medição (informativa)
      var lm = lPts.length ? media(lPts.map(function (p) { return p.v; })) : NaN, em = es.n ? es.X : NaN, q = NaN, qt = "";
      if (ok(L.ext) && o.medicao) {
        var larg = ok(lm) ? lm : lp, e = o.medicao === "media" ? em : o.medicao === "minMedia" ? (ok(em) && ok(ep) ? Math.min(em, ep) : em) : ep;
        if (o.medicao === "area") { q = L.ext * larg; qt = fmt(q, 0) + " m² (extensão × largura média)"; }
        else if (ok(larg) && ok(e)) { q = L.ext * larg * e / 100; qt = fmt(q, 1) + " m³ (extensão × largura " + (ok(lm) ? "média " : "de projeto ") + fmt(larg, 2) + " m × espessura " + fmt(e, 1) + " cm)"; }
      }
      var cart = [];
      if (ok(em)) cart.push([fmt(em, 1) + " cm", (o.nomeEsp || "Espessura") + " média (projeto " + (ok(ep) ? fmt(ep, 1) : "?") + ")"]);
      if (ok(q)) cart.push([qt.split(" (")[0], "Quantidade para medição (" + o.secMed + ")"]);
      return { linhas: linhas, freqs: [fr], tab: { geo: tabGeo }, avisos: av, cartoes: cart,
        relat: [["Largura / espessura médias", (ok(lm) ? fmt(lm, 2) + " m" : "—") + " / " + (ok(em) ? fmt(em, 1) + " cm" : "—")]].concat(ok(q) ? [["Quantidade para medição (" + o.secMed + ")", qt]] : []) };
    }
    return { id: "geo", params: params, tabelas: tabelas, calcular: calcular, fim: true };
  };

  // ===================================================================================================
  // Insumos: água (5.1.3) e selante (5.1.6)
  // ===================================================================================================
  G.paramInsumos = [{ k: "insumos", r: "Controle dos insumos (7.1)", tipo: "select", recarrega: true,
    opcoes: [["lote", "Ensaios de recebimento apresentados neste lote"], ["previo", "Insumos aprovados em registro anterior"]] },
  { k: "insumosReg", r: "Registro da aprovação anterior dos insumos", se: function (d) { return P_(d).insumos === "previo"; } }];
  function previo(P, l) {
    l.situacao = "informativo"; l.motivo = "aprovado anteriormente" + (P.insumosReg ? ": " + P.insumosReg : " — informe o registro");
    return l;
  }
  var LIM_AGUA = [["ph", "pH", 5, 8, 1], ["mo", "Matéria orgânica (O₂ consumido)", NaN, 3, 1], ["res", "Resíduo sólido", NaN, 5000, 0], ["so4", "Sulfatos (SO4)", NaN, 600, 0],
    ["cl", "Cloretos (Cl)", NaN, 1000, 0], ["acucar", "Açúcar", NaN, 5, 0]];
  G.compAgua = function (o) {
    var params = [{ k: "impAgua", r: "Água de amassamento — importar (DNIT 036 / DNIT 037)", tipo: "importarVarios", de: ["dnit-036-2004-me", "dnit-037-2004-me"],
      se: function (d) { return P_(d).insumos !== "previo"; },
      aplicar: function (lista, P, d) {
        var cols = [];
        lista.forEach(function (e) {
          var r = e.resultados || {};
          if (e.ficha === "dnit-037-2004-me") {
            var rels = (r.rc || []).map(function (x) { return x.rel; }).filter(ok);
            cols.push({ reg: imp.rotulo(e, "ensaio comparativo"), pega: ok(r.dIni) ? String(r.dIni) : "", rrel: rels.length ? A.nstr(Math.min.apply(null, rels), 1) : "" });
            return;
          }
          (r.am || []).forEach(function (a) {
            cols.push({ reg: imp.rotulo(e, "amostra " + a.nome), ph: A.nstr(a.ph, 1), mo: A.nstr(a.moR, 1), res: A.nstr(a.resR, 0), so4: A.nstr(a.so4R, 0), cl: A.nstr(a.clR, 0), acucar: A.nstr(a.acucar, 0) });
          });
        });
        imp.substituir(d, "agua", cols, { chave: ["reg"] });
      } }];
    function tabelas(d, P) {
      if (P.insumos === "previo") return [];
      return [{ chave: "agua", titulo: "Água de amassamento (" + o.secao + ")", rotulo: "Amostra", iniciais: 1, min: 1,
        dica: "limites da " + o.secao + " (DNIT 036-ME); nos casos dúbios, ensaio comparativo DNIT 037-ME (Δ início de pega ≤ ± 30 min; resistência ≥ 85 %)",
        linhas: [{ k: "reg", r: "Registro / fonte", texto: true }].concat(LIM_AGUA.map(function (x) { return { k: x[0], r: x[1] + " (" + A.txtLimites(x[2], x[3], x[4], x[0] === "ph" ? "" : "mg/l") + ")", u: x[0] === "ph" ? "" : "mg/l" }; }))
          .concat([{ k: "pega", r: "Comparativo: Δ início de pega (± 30)", u: "min" }, { k: "rrel", r: "Comparativo: resistência relativa (≥ 85)", u: "%" }]) }];
    }
    function calcular(ctx) {
      var P = ctx.P, l = A.linha({ id: "agua", grupo: "Insumos", criterio: "Água de amassamento", secao: o.secao, exigido: "pH 5 a 8; MO ≤ 3; resíduo ≤ 5000; SO4 ≤ 600; Cl ≤ 1000; açúcar ≤ 5 mg/l", semMedia: true });
      if (P.insumos === "previo") return { linhas: [previo(P, l)] };
      var am = (ctx.d.agua || []).filter(function (c) { return cheia(c, ["ph", "mo", "res", "so4", "cl", "acucar", "pega", "rrel"]); });
      l.n = am.length;
      var falhas = [], comp = null, nq = 0;
      am.forEach(function (c) {
        var q = false, fa = [];
        LIM_AGUA.forEach(function (x) {
          var v = num(c[x[0]]);
          if (!ok(v)) return;
          q = true;
          if ((ok(x[2]) && v < x[2] - 1e-9) || v > x[3] + 1e-9) fa.push(x[1] + " " + fmt(v, x[4]));
        });
        if (fa.length) falhas.push((c.reg || "amostra") + ": " + fa.join(", "));
        if (q) nq++;
        var pg = num(c.pega), rr = num(c.rrel);
        if (ok(pg) || ok(rr)) comp = (comp === null ? true : comp) && (!ok(pg) || Math.abs(pg) <= 30 + 1e-9) && (!ok(rr) || rr >= 85 - 1e-9);
      });
      l.txtEstat = nq ? nq + " amostra(s)" : "—";
      if (!am.length) { l.situacao = "sem_dados"; l.motivo = "sem ensaios da água"; }
      else if (!nq && comp === null) A.marcar(l, "pendente", "sem ensaios químicos");
      else if (falhas.length) {
        if (comp === true) A.marcar(l, "ressalva", "fora dos limites: " + falhas.join("; ") + " — ensaio comparativo (DNIT 037) satisfatório");
        else { A.marcar(l, "nao_conforme", "fora dos limites: " + falhas.join("; ") + (comp === false ? "; ensaio comparativo não satisfatório" : "")); l.prov = "Substituir a fonte de água ou comprovar pelo ensaio comparativo da DNIT 037-ME (" + o.secao + ")."; }
      } else l.motivo = "todas as determinações nos limites" + (comp === false ? "; atenção: ensaio comparativo não satisfatório" : "");
      if (comp === false && !falhas.length) A.marcar(l, "nao_conforme", "ensaio comparativo (DNIT 037) não satisfatório");
      return { linhas: [l], freqs: [A.frequencia({ ensaio: "Água de amassamento", metodo: "DNIT 036-ME", regra: "na aprovação da fonte (1 por lote)", exigido: 1, realizado: nq ? 1 : 0 })] };
    }
    return { id: "agua", params: params, tabelas: tabelas, calcular: calcular, fim: true };
  };
  G.SELANTES = ["dnit-038-2004-me", "dnit-039-2004-me", "dnit-040-2004-me", "dnit-041-2004-me", "dnit-042-2004-me", "dnit-043-2004-me", "dnit-044-2004-me",
    "dnit-045-2004-me", "dnit-051-2004-me", "dnit-052-2004-me"];
  G.compSelante = function (o) {
    var params = [{ k: "impSel", r: "Material selante — importar ensaios (DNIT 038 a 052-ME)", tipo: "importarVarios", de: G.SELANTES,
      se: function (d) { return P_(d).insumos !== "previo"; },
      aplicar: function (lista, P, d) {
        imp.substituir(d, "sel", lista.map(function (e) {
          var r = e.resultados || {}, t = (FE.FICHAS[e.ficha] || {}).titulo || "";
          return { reg: imp.rotulo(e), ens: t.replace(/^Selante de juntas — /, ""), at: r.conforme === true ? "S" : r.conforme === false ? "N" : "" };
        }), { chave: ["reg"] });
      } }];
    function tabelas(d, P) {
      if (P.insumos === "previo") return [];
      return [{ chave: "sel", titulo: "Material selante — DNIT 046-EM (" + o.secao + ")", rotulo: "Ensaio", iniciais: 1, min: 1, dica: "um ensaio por coluna; \"S\" = atende à DNIT 046-EM",
        linhas: [{ k: "reg", r: "Registro", texto: true }, { k: "ens", r: "Ensaio / propriedade", texto: true }, { k: "at", r: "Atende? (S / N)", texto: true }] }];
    }
    function calcular(ctx) {
      var P = ctx.P, l = A.linha({ id: "sel", grupo: "Insumos", criterio: "Material selante (DNIT 046-EM)", secao: o.secao, exigido: "produção industrial; atende à DNIT 046-EM", semMedia: true });
      if (P.insumos === "previo") return { linhas: [previo(P, l)] };
      var cs = (ctx.d.sel || []).filter(function (c) { return cheia(c, ["at", "ens"]); }), nok = cs.filter(function (c) { return /^n/i.test(String(c.at).trim()); });
      var sok = cs.filter(function (c) { return /^s/i.test(String(c.at).trim()); });
      l.n = cs.length; l.txtEstat = cs.length ? sok.length + " de " + cs.length + " atendem" : "—";
      if (!cs.length) { l.situacao = "sem_dados"; l.motivo = "sem ensaios/certificado do selante"; }
      else if (nok.length) { A.marcar(l, "nao_conforme", "não atende: " + nok.map(function (c) { return c.ens || c.reg; }).join("; ")); l.prov = "Substituir o material selante por outro que atenda à DNIT 046-EM."; }
      else if (sok.length < cs.length) A.marcar(l, "pendente", "ensaio(s) sem resultado");
      else l.motivo = cs.length + " ensaio(s) conforme(s)";
      return { linhas: [l] };
    }
    return { id: "sel", params: params, tabelas: tabelas, calcular: calcular, fim: true };
  };

  // ===================================================================================================
  // Sub-bases de solo com cimento (DNIT 057 e 058)
  // ===================================================================================================
  // compactação de referência (Proctor): define a umidade ótima usada nos critérios de umidade
  G.compProctor = function (o) {
    var params = [{ k: "hOt", r: "Umidade ótima de referência (%) — vazio = média dos ensaios de compactação" },
      { k: "impComp", r: "Compactação de referência — importar (" + o.importar.map(A.codigoCurto).join(" / ") + ")", tipo: "importarVarios", de: o.importar,
        aplicar: function (lista, P, d) {
          imp.substituir(d, "comp", lista.map(function (e) {
            var r = e.resultados || {};
            return { est: imp.ident(e).local || "", reg: imp.rotulo(e), gs: A.nstr(r.gsMax, 3), hot: A.nstr(r.hOt, 1) };
          }), { chave: ["reg"] });
        } }];
    function tabelas() {
      return [{ chave: "comp", titulo: "Compactação de referência — energia " + o.energia + " (" + o.secao + ")", rotulo: "Ensaio", iniciais: 1, min: 1,
        linhas: [{ k: "est", r: "Estaca / local", texto: true }, { k: "reg", r: "Registro", texto: true }, { k: "gs", r: "Massa específica aparente seca máxima", u: "g/cm³" }, { k: "hot", r: "Umidade ótima", u: "%" }] }];
    }
    function calcular(ctx) {
      var cs = (ctx.d.comp || []).filter(function (c) { return ok(num(c.gs)) || ok(num(c.hot)); });
      var l = A.linha({ id: "comp", grupo: "Controle da execução", criterio: "Compactação de referência (energia " + o.energia + ")", secao: o.secao, n: cs.length, semMedia: true,
        exigido: "referência do GC e da umidade", situacao: "informativo" });
      var P = ctx.P, h = num(P.hOt);
      l.txtEstat = cs.length ? "γs,máx " + cs.map(function (c) { return c.gs; }).filter(Boolean).join("; ") : "—";
      l.motivo = ok(h) ? "h ót de referência = " + fmt(h, 1) + " %" : "sem umidade ótima de referência";
      return { linhas: [l], freqs: [A.frequencia({ ensaio: "Compactação de referência (γs,máx)", metodo: "NBR 7182 / DNIT 164", por: "area", a_cada: 2500, qtd: ctx.L.area, realizado: cs.length })] };
    }
    return { id: "comp", params: params, tabelas: tabelas, calcular: calcular };
  };
  G.preparaHot = function (d) {
    var P = Object.assign({}, d.params || {});
    if (!ok(num(P.hOt))) {
      var hs = (d.comp || []).map(function (c) { return num(c.hot); }).filter(ok);
      if (hs.length) P.hOt = A.nstr(media(hs), 1);
    }
    return Object.assign({}, d, { params: P });
  };
  // Grau de compactação: GC − k·s ≥ 100 % (Tabela da ES = DNER-PRO 277), reensaio (mín. 6) nas verificações suplementares
  //   o: { secao, secAuto, secSup, energia, reensaio: "todos100" (057: só se todos ≥ 100) | "sempre" (058) }
  G.compGC = function (o) {
    var params = [{ k: "gcMin", r: "Grau de compactação mínimo (%)", ph: "100" },
      { k: "gcReens", r: "Reensaio do GC (" + o.secSup + ")", tipo: "select", recarrega: true, opcoes: [["nao", "Não realizado"], ["sim", "Sim — digitar os pontos do reensaio"]] },
      { k: "impGC", r: "Grau de compactação — importar furos (DNIT 458)", tipo: "importarVarios", de: ["dnit-458-2025-me"],
        aplicar: function (lista, P, d) {
          var cols = [];
          lista.forEach(function (e) {
            ((e.resultados || {}).furos || []).forEach(function (f, j) {
              if (ok(f.GC)) cols.push({ est: f.estaca || imp.ident(e).local || "", pos: f.posicao || "", reg: imp.rotulo(e, "furo " + (j + 1)), gc: A.nstr(f.GC, 1) });
            });
          });
          imp.substituir(d, "gc", cols);
        } }];
    function tabelas(d, P) {
      var li = [{ k: "est", r: "Estaca", texto: true }, { k: "pos", r: "Posição (BD / eixo / BE)", texto: true }, { k: "reg", r: "Registro", texto: true }, { k: "gc", r: "Grau de compactação", u: "%" }];
      var T = [{ chave: "gc", titulo: "Massa específica in situ e grau de compactação (" + o.secao + ")", rotulo: "Furo", iniciais: 6, min: 1, dica: "a cada 10 m de pista, alternando borda direita, eixo, borda esquerda (bordas a 60 cm)", linhas: li }];
      if (P.gcReens === "sim") T.push({ chave: "gc2", titulo: "Reensaio do grau de compactação (" + o.secSup + ")", rotulo: "Ponto", iniciais: 6, min: 1, dica: "no mínimo 6 determinações bem espaçadas no trecho", linhas: li });
      return T;
    }
    function calcular(ctx) {
      var P = ctx.P, d = ctx.d, L = ctx.L, gmin = ok(num(P.gcMin)) ? num(P.gcMin) : 100;
      function pts(arr) { return (arr || []).map(function (c, i) { return pt(c, num(c.gc), (c.est ? "est. " + c.est : "furo " + (i + 1)) + (c.pos ? " " + c.pos : "")); }).filter(function (p) { return ok(p.v); }); }
      var p1 = pts(d.gc), l = G.linhaEst({ id: "gc", grupo: "Controle da execução", criterio: "Grau de compactação (energia " + o.energia + ")", secao: o.secao + "; " + o.secAuto, unid: "%", casas: 1,
        pontos: p1, min: gmin, tabelaK: G.K277, nMin: 5, exigido: "GC = GCmédio − k·s ≥ " + fmt(gmin, 0) + " %" });
      var linhas = [l], todos = p1.every(function (p) { return p.v >= gmin - 1e-9; });
      if (!l.n) { l.situacao = "sem_dados"; l.motivo = "sem determinações"; }
      else if (l.n < 5) {
        if (todos) l.motivo = "n < 5 (fora da tabela de k): todos os valores individuais ≥ " + fmt(gmin, 0) + " %";
        else A.marcar(l, "nao_conforme", "n < 5: valor(es) individual(is) < " + fmt(gmin, 0) + " % — " + p1.filter(function (p) { return p.v < gmin; }).map(function (p) { return fmt(p.v, 1) + " (" + p.rot + ")"; }).join("; "));
      } else if (l.inf >= gmin - 1e-9) l.motivo = "aceitação automática: GC = " + fmt(l.inf, 2) + " ≥ " + fmt(gmin, 0) + " %" + kTxt(l.K, G.K277, "Tabela da ES");
      else {
        var base = "GC = " + fmt(l.inf, 2) + " < " + fmt(gmin, 0) + " %";
        if (o.reensaio === "todos100" && !todos) { A.marcar(l, "nao_conforme", base + " e há valores individuais < " + fmt(gmin, 0) + " % — rebater o trecho"); l.prov = "Rebater o trecho até atingir as condições de aceitação (" + o.secSup + ")."; }
        else {
          var p2 = pts(d.gc2);
          if (P.gcReens !== "sim" || !p2.length) { A.marcar(l, "pendente", base + (o.reensaio === "todos100" ? ", com todos os valores individuais ≥ " + fmt(gmin, 0) + " %" : "") + " — reensaiar (mín. 6 determinações, " + o.secSup + ")"); l.prov = "Reensaiar o trecho com no mínimo 6 determinações bem espaçadas (" + o.secSup + ")."; }
          else {
            var l2 = G.linhaEst({ id: "gc2", grupo: "Controle da execução", criterio: "Grau de compactação — reensaio", secao: o.secSup, unid: "%", casas: 1, pontos: p2, min: gmin, tabelaK: G.K277, nMin: 5,
              exigido: "GC ≥ " + fmt(gmin, 0) + " % ou todos os individuais ≥ " + fmt(gmin, 0) + " % (mín. 6)" });
            var t2 = p2.every(function (p) { return p.v >= gmin - 1e-9; });
            if (l2.n < 6) A.marcar(l2, "pendente", "só " + l2.n + " determinação(ões): mínimo 6");
            else if ((ok(l2.inf) && l2.inf >= gmin - 1e-9) || t2) l2.motivo = t2 ? "todos os valores individuais ≥ " + fmt(gmin, 0) + " %" : "GC = " + fmt(l2.inf, 2) + " %";
            else { A.marcar(l2, "nao_conforme", (ok(l2.inf) ? "GC = " + fmt(l2.inf, 2) + " %" : "") + " e valores individuais < " + fmt(gmin, 0) + " % — rebater"); l2.prov = "Rebater o trecho até atingir as condições de aceitação (" + o.secSup + ")."; }
            linhas.push(l2);
            if (l2.situacao === "conforme") l.motivo = base + "; aceito no reensaio (" + o.secSup + ")";
            else A.marcar(l, l2.situacao, base + "; reensaio " + (l2.situacao === "pendente" ? "incompleto" : "também não atende"));
          }
        }
      }
      var cob = A.cobertura(p1, L, 10, "Grau de compactação");
      return { linhas: linhas, avisos: cob.avisos, freqs: [A.frequencia({ ensaio: "Massa específica in situ / GC", metodo: "DNIT 458 (DNER-ME 092)", por: "extensao", a_cada: 10, qtd: L.ext, realizado: p1.length })],
        cartoes: ok(l.inf) ? [[fmt(l.inf, 1) + " %", "GC = GCmédio − k·s"]] : [] };
    }
    return { id: "gc", params: params, tabelas: tabelas, calcular: calcular };
  };
  // ISC (057): ISC − k·s ≥ 30 % e ≥ ISC de projeto; expansão ≤ 1 %
  G.compISC = function (o) {
    var params = [{ k: "iscProj", r: "ISC de projeto (%) — mínimo da ES: 30" },
      { k: "impISC", r: "ISC e expansão — importar (DNIT 172)", tipo: "importarVarios", de: ["dnit-172-2016-me"],
        aplicar: function (lista, P, d) {
          imp.substituir(d, "isc", lista.map(function (e) { var r = e.resultados || {}; return { est: imp.ident(e).local || "", reg: imp.rotulo(e), isc: A.nstr(r.isc, 0), exp: A.nstr(r.exp, 2) }; }), { chave: ["reg"] });
        } }];
    function tabelas() {
      return [{ chave: "isc", titulo: "Índice de suporte Califórnia — energia intermediária (" + o.secao + ")", rotulo: "Ensaio", iniciais: 1, min: 1,
        linhas: [{ k: "est", r: "Estaca / local", texto: true }, { k: "reg", r: "Registro", texto: true }, { k: "isc", r: "ISC", u: "%" }, { k: "exp", r: "Expansão", u: "%" }] }];
    }
    function calcular(ctx) {
      var P = ctx.P, d = ctx.d, L = ctx.L, ip = num(P.iscProj), mn = Math.max(30, ok(ip) ? ip : 30);
      var cs = d.isc || [];
      var pI = cs.map(function (c, i) { return pt(c, num(c.isc), c.est || "ensaio " + (i + 1)); }).filter(function (p) { return ok(p.v); });
      var l = G.linhaEst({ id: "isc", grupo: "Controle da execução", criterio: "Índice de suporte Califórnia", secao: "5.1.4; 7.3.1", unid: "%", casas: 0, pontos: pI, min: mn, tabelaK: G.K277, nMin: 5,
        exigido: "ISC = ISCmédio − k·s ≥ " + fmt(mn, 0) + " % (30 % e projeto)" });
      if (!l.n) { l.situacao = "sem_dados"; l.motivo = "sem ensaios"; }
      else if (l.n < 5) {
        var f = pI.filter(function (p) { return p.v < mn - 1e-9; });
        if (f.length) { A.marcar(l, "nao_conforme", "n < 5: ISC individual < " + fmt(mn, 0) + " %: " + f.map(function (p) { return fmt(p.v, 0); }).join("; ")); l.prov = "Material rejeitado quanto ao ISC (7.3.1.2)."; }
        else l.motivo = "n < 5 (fora da tabela de k): todos os valores individuais ≥ " + fmt(mn, 0) + " %";
      } else if (l.inf >= mn - 1e-9) l.motivo = "aceitação automática: ISC = " + fmt(l.inf, 1) + " ≥ " + fmt(mn, 0) + " %";
      else { A.marcar(l, "nao_conforme", "ISC = " + fmt(l.inf, 1) + " < " + fmt(mn, 0) + " %: sem aceitação automática — material rejeitado (7.3.1.2)"); l.prov = "Material rejeitado quanto ao ISC (7.3.1.2)."; }
      var pE = cs.map(function (c, i) { return pt(c, num(c.exp), c.est || "ensaio " + (i + 1)); }).filter(function (p) { return ok(p.v); });
      var le = A.avaliar({ id: "exp", grupo: "Controle da execução", criterio: "Expansão", secao: "5.1.4", unid: "%", casas: 2, pontos: pE, max: 1, individual: true, exigido: "≤ 1 %" });
      return { linhas: [l, le], freqs: [A.frequencia({ ensaio: "Índice de suporte Califórnia", metodo: "NBR 9895 / DNIT 172", por: "area", a_cada: 2500, qtd: L.area, realizado: pI.length })] };
    }
    return { id: "isc", params: params, tabelas: tabelas, calcular: calcular };
  };
  // LL e IP (5.1.3 — "preferencialmente": ressalva); 1 a cada 2500 m², mín. 1 por dia
  G.compLimites = function (o) {
    var params = [{ k: "impLim", r: "LL e IP — importar (DNER-ME 122 / 082)", tipo: "importarVarios", de: ["dner-me-122-94", "dner-me-082-94"],
      aplicar: function (lista, P, d) {
        imp.substituir(d, "lim", imp.juntarPorRegistro(lista.map(function (e) {
          var r = e.resultados || {}, i = imp.ident(e), c = { est: i.local || "", reg: imp.rotulo(e), ll: "", ip: "" };
          if (e.ficha === "dner-me-082-94") { c.ll = r.llNP ? "NP" : A.nstr(r.LL, 0); c.ip = r.ipNP ? "NP" : A.nstr(r.IP, 0); }
          else c.ll = r.np ? "NP" : A.nstr(r.LL, 0);
          return { chave: i.registro || "", cod: A.codigoCurto(e.ficha), col: c };
        })), { chave: ["reg"] });
      } }];
    function tabelas() {
      return [{ chave: "lim", titulo: "Limites de liquidez e de plasticidade (" + o.secao + ")", rotulo: "Amostra", iniciais: 1, min: 1,
        linhas: [{ k: "est", r: "Estaca / local", texto: true }, { k: "reg", r: "Registro", texto: true }, { k: "ll", r: "LL (ou NP)", u: "%", texto: true }, { k: "ip", r: "IP (ou NP)", u: "%", texto: true }] }];
    }
    function calcular(ctx) {
      var cs = ctx.d.lim || [], L = ctx.L, P = ctx.P;
      function pp(k) { return cs.map(function (c, i) { var x = A.numOuNP(c[k]); return x.np ? pt(c, 0, "NP") : pt(c, x.v, c.est || "amostra " + (i + 1)); }).filter(function (p) { return ok(p.v); }); }
      var a = A.avaliar({ id: "ll", grupo: "Materiais", criterio: "Limite de liquidez", secao: "5.1.3", unid: "%", casas: 0, pontos: pp("ll"), max: 40, individual: true, falha: "ressalva", exigido: "≤ 40 % (preferencialmente)" });
      var b = A.avaliar({ id: "ip", grupo: "Materiais", criterio: "Índice de plasticidade", secao: "5.1.3", unid: "%", casas: 0, pontos: pp("ip"), max: 18, individual: true, falha: "ressalva", exigido: "≤ 18 % (preferencialmente; NP = 0)" });
      var n = cs.filter(function (c) { return cheia(c, ["ll", "ip"]); }).length, dias = ok(num(P.dias)) ? num(P.dias) : 1;
      return { linhas: [a, b], freqs: [A.frequencia({ ensaio: "LL e LP", metodo: "DNER-ME 122 / 082", regra: "1 a cada 2 500 m²; mín. 1 por dia", exigido: Math.max(A.nMin(L.area, 2500, 1), dias), realizado: n })] };
    }
    return { id: "lim", params: params, tabelas: tabelas, calcular: calcular };
  };

  // ===================================================================================================
  // Itens comuns das ES de pavimento de concreto (047, 048, 068) e fábrica de fichas
  // ===================================================================================================
  function sn(id, texto, secao, grupo, exigido, falha, se) { return { id: id, texto: texto, secao: secao, grupo: grupo, tipo: "sim_nao", exigido: exigido, falha: falha || "ressalva", se: se }; }
  G.sn = sn;
  // item de valor do abatimento (5.1.10 d): importa da DNER-ME 404
  G.itemAbatimento = function (o) {
    return { id: "abat", texto: "Abatimento do tronco de cone (consistência)", secao: o.secao, grupo: "Controle da produção", tipo: o.estatistico ? "estatistico" : "valor", unid: "mm", casas: 0,
      min: o.min, max: o.max, falha: "ressalva", metodo: o.metodo || "NBR 7223 / DNER-ME 404", se: o.se,
      exigido: o.exigido, importar: { de: "dner-me-404-00", valores: function (e) {
        return ((e.resultados || {}).ens || []).filter(function (x) { return ok(x.abr); }).map(function (x) { return { v: x.abr, rot: "amassada " + x.nome }; });
      } },
      freq: { por: "contagem", qtd: "amassadas", a_cada: 1, unidade: "amassada(s)" },
      freqG: o.freqG || function (P) { var q = num(P.amassadas); return { exigido: ok(q) ? q : NaN, regra: "cada amassada (betonada) — informe o nº de amassadas" }; } };
  };
  G.itemRecalque = function (o) {
    return { id: "krec", texto: "Coeficiente de recalque (prova de carga)", secao: o.secao, grupo: o.grupo || "Fundação", tipo: "valor", unid: "MPa/m", casas: 0,
      min: function (P) { return num(P.kProj); }, falha: "nao_conforme", metodo: "DNIT 055-ME", se: function (P) { return P.recalque !== "nao"; },
      importar: { de: "dnit-055-2004-me", valores: function (e) { var r = e.resultados || {}; return ok(r.k) ? [{ v: r.k, est: imp.ident(e).local || "", rot: "prova de carga" }] : []; } },
      freq: { por: "extensao", a_cada: 100 },
      freqG: function (P, L) { var p = P.recalque === "homog" ? 200 : 100; return { exigido: A.nMin(L.ext, p, 1), regra: "1 a cada " + p + " m (bordas e eixo, aleatório)" }; } };
  };
  G.paramsRecalque = function (txtHomog) {
    return [{ k: "recalque", r: "Coeficiente de recalque neste lote", tipo: "select", recarrega: true,
      opcoes: [["sim", "Sim — a cada 100 m"], ["homog", txtHomog], ["nao", "Não (controlado em outro registro / ISC com correlação)"]] },
    { k: "kProj", r: "Coeficiente de recalque de projeto (MPa/m)", se: function (d) { return P_(d).recalque !== "nao"; } }];
  };

  FE.aceitacaoG6 = G;

  // ===================================================================================================
  // Ficha de pavimento de concreto (DNIT 047 e 048; base da 068)
  // ===================================================================================================
  G.fichaConcreto = function (cfg) {
    var trilho = cfg.variante === "048";
    var crit = [
      sn("cim", "Cimento Portland: tipo CP-I, CP-II, CP-III ou CP-IV (ou adequação comprovada)", "5.1.1", "Insumos", "NBR 5732, 11578, 5735, 5736; recebimento DNIT 050-EM"),
      sn("agr", "Agregados graúdo e miúdo conforme NBR 7211", "5.1.2", "Insumos", "NBR 7211"),
      sn("adit", "Aditivos (NBR 11768; incorporador de ar também ASTM C 260); dosagem fixada no início", "5.1.4", "Insumos", "NBR 11768"),
      sn("aco", "Aço: transferência CA-25 lisas e retas; ligação CA-50 (ou CA-25); telas NBR 7481", "5.1.5", "Insumos", "NBR 7480 / 7481"),
      sn("dos", "Dosagem: C ≥ 320 kg/m³; a/c ≤ 0,50; Dmáx ≤ 1/3 da espessura e ≤ 50 mm; ar ≤ 0,5 %; exsudação ≤ 1,5 %", "5.1.10 b a g", "Concreto",
        "consumo, a/c, Dmáx, teor de ar (" + (trilho ? "NBR 11686" : "NBR NM 47") + ") e exsudação (NBR NM 102)"),
      G.itemAbatimento({ secao: "5.1.10 d; 7.2.1", min: 60, max: 80, exigido: "70 ± 10 mm (60 a 80 mm), cada amassada" }),
      sn("equip", "Equipamento vistoriado antes do início do serviço", "5.2 (Nota)", "Execução", "vistoria aprovada"),
      G.itemRecalque({ secao: "5.3.1" }),
      sn("formas", trilho ? "Fôrmas: apoio contínuo com argamassa (sem calço transversal); erros ≤ 3 mm na vertical e ≤ 5 mm no alinhamento" :
        "Fôrmas: calçadas em toda a extensão; desvios altimétricos ≤ 3 mm e planialtimétricos ≤ 5 mm", "5.3.3", "Execução", "ponteiros a cada 1 m, no máximo; topo = superfície de rolamento"),
      sn("fundo", "Fundo de caixa: espessura não inferior à de projeto em toda a seção", "5.3.3", "Execução", "\"não se admitindo\" espessura inferior", "nao_conforme"),
      sn("pel", "Película isolante esticada, emendas com recobrimento ≥ 20 cm (quando prevista)", "5.1.8; 5.3.3", "Execução", "membrana 0,2 a 0,3 mm; kraft ≥ 200 g/m²; pintura 0,8 a 1,6 l/m²"),
      sn("tempo", "Tempo entre a mistura e o lançamento ≤ 30 min (≤ 90 min em caminhão-betoneira com agitação); sem redosagem", "5.3.4", "Execução", "≤ 30 / 90 min"),
      sn("regua", "Régua de 3 m: variações ≤ 5 mm corrigidas de pronto", trilho ? "5.3.5" : "5.3.5", "Execução", "depressões/saliências ≤ 5 mm"),
      sn("acab", "Acabamento com ranhuras transversais contínuas e uniformes (lona ou vassoura)", "5.3.6", "Execução", "ranhuras contínuas"),
      sn("ident", "Placas identificadas (número impresso em um canto)", "5.3.7", "Execução", "todas as placas"),
      sn("juntas", "Juntas nas posições de projeto, desvio de alinhamento ≤ 5 mm; transversais retilíneas e perpendiculares", "5.3.8", "Juntas", "\"não se permitindo\" desvio > 5 mm", "nao_conforme"),
      sn("corte", "Juntas serradas entre 6 h e 48 h após a concretagem; juntas de construção nas interrupções > 30 min", "5.3.8.2; 5.3.8.3", "Juntas", "plano de corte 6 h a 48 h"),
      sn("barras", "Barras de transferência lisas, metade + 2 cm engraxada; desvio ≤ ± 1 % do comprimento e ≤ ± 0,7 % em 2/3 das barras de cada junta", "5.3.8.4; 5.3.8.5", "Juntas", "tolerâncias de alinhamento", "nao_conforme"),
      sn("tela", "Tela soldada nas placas irregulares: 5 cm da superfície, até meia altura, 5 cm dos bordos", "5.3.9", "Execução", "conforme projeto"),
      sn("cura", "Cura de 7 dias: química 0,35 a 0,50 l/m² nas primeiras ~24 h, sem trânsito; depois cobertura (sobreposição ≥ 10 cm, reposição ≤ 30 min)", "5.3.10", "Execução", "7 dias"),
      sn("desm", "Desmoldagem após 12 h (máx. 24 h), sem esborcinar cantos; faces laterais protegidas", "5.3.11", "Execução", "12 h a 24 h"),
      sn("selag", "Selagem: sulcos limpos e secos, sem respingos nem transbordamento, penetração conforme projeto", "5.3.12", "Juntas", "profundidade de projeto"),
      { id: "nota063", texto: "Acabamento superficial — nota da avaliação DNIT 063-PRO", secao: "7.3.2", grupo: "Controle do produto", tipo: "valor", unid: "", casas: 0, min: 40,
        falha: "nao_conforme", metodo: "DNIT 063-PRO", exigido: "nota ≥ 40 (0 a 100)", freq: { por: "lote", minimo: 1 } },
    ];
    if (cfg.ajustar) crit = cfg.ajustar(crit);
    var PROV_RES = "Revisar o projeto adotando a resistência característica estimada e a espessura média (7.4.1.3 b); se ainda não aceito: aproveitamento com restrições ao carregamento ou ao uso, reforço, ou demolição e reconstrução (7.4.1.3 c).";
    return G.criarFicha({
      id: cfg.id, titulo: cfg.titulo, resumo: cfg.resumo,
      lote: { largura: true },
      params: (cfg.paramsAntes || []).concat([{ k: "amassadas", r: "Amassadas (betonadas) no trecho", dica: "consistência em cada amassada (7.2.1)" }])
        .concat(G.paramsRecalque(cfg.txtHomog || "Sim — solo homogêneo: a cada 200 m")).concat(G.paramInsumos),
      padrao: Object.assign({ resTipo: "flexao", idadeCtrl: "28", resSup: "nao", insumos: "lote", recalque: "sim" }, cfg.padrao || {}),
      criterios: crit,
      componentes: [
        G.compResistencia(Object.assign({ secao: "7.4.1.1", secAuto: "7.4.1.2", secMold: "7.2.2.2", secSup: "7.4.1.3", secaoExig: "7.2.2.1", exPorTrecho: 6, areaTrecho: 2500,
          sup: "estimativa", importar: ["dner-me-091-98"], provNC: PROV_RES }, cfg.res || {})),
        G.compGeometria(Object.assign({ modo: "rigido", secao: "7.3.1", secLarg: "7.3.1 a", secEsp: "7.3.1 b", medicao: "projeto", secMed: "8", base: "sub-base",
          provEsp: "Revisar o projeto adotando a espessura média e a resistência característica estimada (7.3.1 c); se não aceito, decisões da 7.4.1.3 c." }, cfg.geo || {})),
        G.compAgua({ secao: "5.1.3" }),
        G.compSelante({ secao: "5.1.6" }),
      ],
      refs: { tabela: "Tabela 1" },
      notas: cfg.notas || "Critérios da " + cfg.codigo + ", seções 5 e 7. Resistência (7.4.1): f̄ctM,est = fctM − k·s ≥ fctM,k (ou fck,est = fc − k·s ≥ fck), s com n − 1, exemplar = maior dos 2 CPs; " +
        "k da Tabela 1 (Student): " + G.STUDENT_TXT + " — n não tabelado: k do n imediatamente inferior (mais exigente); mín. 6 exemplares por trecho de até 2.500 m² (7.2.2.2). " +
        "Sem aceitação automática: verificação suplementar com no mínimo 6 CPs extraídos (7.4.1.3), avaliada da mesma forma. Geometria (7.3.1): largura com variação < ± 10 %; espessura média ≥ projeto e " +
        "(maior − menor) ≤ 1 cm. Acabamento (7.3.2): nota DNIT 063-PRO ≥ 40. Abatimento 70 ± 10 mm em cada amassada (valor fora = ressalva: amassada deveria ter sido rejeitada). " +
        "Exigências de execução da seção 5 não atendidas geram ressalva (registro de não conformidade, DNIT 011-PRO), exceto as proibições expressas (fundo de caixa, desvio de juntas, tolerância das barras), que reprovam.",
      exemplos: cfg.exemplos,
    });
  };

  // ===================================================================================================
  // DNIT 047/2004-ES
  // ===================================================================================================
  var ID = "dnit-047-2004-es";
  function secoes(ini, lista, largP) {
    // lista: [largura, esp eixo, esp BE, esp BD] por estaca (a cada 20 m)
    var out = [];
    lista.forEach(function (x, i) {
      var e = String(ini + i);
      out.push({ est: e, pos: "BE", larg: A.nstr(x[0], 2), esp: A.nstr(x[2], 1) }, { est: e, pos: "eixo", esp: A.nstr(x[1], 1) }, { est: e, pos: "BD", esp: A.nstr(x[3], 1) });
    });
    return out;
  }
  G.exSecoes = secoes;
  function ex(nome, fn) { return { nome: nome, dados: fn }; }
  G.fichaConcreto({
    id: ID, codigo: "DNIT 047/2004-ES", variante: "047",
    titulo: "Pavimento rígido com equipamento de pequeno porte — aceitação do trecho",
    resumo: "Reúne os ensaios do trecho de inspeção (até 2.500 m²): resistência característica estimada (fctM,est ou fck,est = f̄ − k·s, Tabela 1), abatimento de cada amassada, " +
      "coeficiente de recalque, largura e espessura (7.3.1), nota de acabamento (7.3.2), insumos e verificações de execução da seção 5, com o parecer do trecho.",
    exemplos: [
      ex("Trecho aceito — flexão, 8 exemplares, 300 m × 7,2 m", function () {
        var F = FE.FICHAS[ID];
        var d = { ident: { registro: "LOTE-PR-001", data: "2026-08-20", obra: "Obra A — BR-000", trecho: "Trecho de inspeção 1", local: "Est. 110 a 125", camada: "Placas de concreto — pequeno porte" },
          params: Object.assign({}, F.padrao, { estIni: "110", estFim: "125", largura: "7,20", largProj: "7,20", espProj: "18", fctmk: "4,5", amassadas: "10", kProj: "40" }),
          verificacoes: [], res: [{}], abat: [{}], krec: [{}], agua: [{}], sel: [{}], nota063: [{}] };
        d.res = [["P-003", 5.12, 4.95], ["P-011", 4.88, 5.21], ["P-019", 5.35, 5.06], ["P-027", 4.97, 5.14], ["P-036", 5.28, 5.40], ["P-044", 5.02, 4.91], ["P-052", 5.19, 5.33], ["P-060", 4.86, 5.08]]
          .map(function (x, i) { return { est: x[0], reg: "CP-PR-" + (101 + i), idade: "28", cp1: A.nstr(x[1], 2), cp2: A.nstr(x[2], 2) }; });
        d.abat = [72, 68, 75, 70, 66, 74, 71, 69, 73, 70].map(function (v, i) { return { est: "", pos: "", reg: "amassada " + (i + 1), v: String(v) }; });
        A.exemplos.importar(F.params, d, "imp_krec", [["dnit-055-2004-me", 0]]);
        d.krec.push({ est: "115", pos: "BD", reg: "PC-0412 (digitado)", v: "46" }, { est: "123", pos: "BE", reg: "PC-0413 (digitado)", v: "52" });
        A.exemplos.importar(F.params, d, "impAgua", [["dnit-036-2004-me", 0]]);
        A.exemplos.importar(F.params, d, "impSel", [["dnit-038-2004-me", 0], ["dnit-040-2004-me", 0], ["dnit-052-2004-me", 0]]);
        d.verificacoes = G.verifEx(F);
        d.nota063 = [{ est: "", reg: "Laudo DNIT 063-PRO nº 12", v: "72" }];
        d.geo = secoes(110, [[7.22, 18.4, 18.2, 18.6], [7.20, 18.3, 18.1, 18.5], [7.24, 18.6, 18.3, 18.4], [7.19, 18.2, 18.0, 18.3], [7.21, 18.5, 18.4, 18.6],
          [7.23, 18.3, 18.2, 18.1], [7.20, 18.4, 18.5, 18.2], [7.22, 18.6, 18.3, 18.5], [7.18, 18.2, 18.0, 18.4], [7.21, 18.5, 18.6, 18.3], [7.24, 18.3, 18.4, 18.2],
          [7.20, 18.4, 18.2, 18.6], [7.22, 18.1, 18.3, 18.2], [7.21, 18.5, 18.4, 18.3], [7.19, 18.3, 18.6, 18.4], [7.23, 18.4, 18.2, 18.5]]);
        d.obs = "Exemplo: exemplares (máximo dos 2 CPs prismáticos) digitados; prova de carga, água e selante importados dos exemplos das fichas ME.";
        return d;
      }),
      ex("Trecho rejeitado — fctM,est < fctM,k também nos testemunhos; espessura irregular; amassada fora do abatimento", function () {
        var F = FE.FICHAS[ID];
        var d = { ident: { registro: "LOTE-PR-002", data: "2026-09-03", obra: "Obra B — Rua A", trecho: "Trecho de inspeção 2", local: "Est. 20 a 32", camada: "Placas de concreto — pequeno porte" },
          params: Object.assign({}, F.padrao, { estIni: "20", estFim: "32", largura: "7,00", largProj: "7,00", espProj: "16", fctmk: "4,5", amassadas: "8", recalque: "nao", resSup: "sim" }),
          verificacoes: [], res: [{}], abat: [{}], agua: [{}], sel: [{}], nota063: [{}], ext: [{}] };
        d.res = [["P-201", 4.62, 4.41], ["P-205", 4.35, 4.52], ["P-210", 4.80, 4.66], ["P-214", 4.28, 4.19], ["P-219", 4.71, 4.55], ["P-223", 4.44, 4.60], ["P-228", 4.39, 4.25]]
          .map(function (x, i) { return { est: x[0], reg: "CP-PR-" + (301 + i), idade: "28", cp1: A.nstr(x[1], 2), cp2: A.nstr(x[2], 2) }; });
        d.ext = [["P-214", 4.31], ["P-228", 4.46], ["P-205", 4.52], ["P-223", 4.58], ["P-201", 4.40], ["P-219", 4.63]].map(function (x, i) { return { est: x[0], reg: "Testemunho T" + (i + 1), v: A.nstr(x[1], 2) }; });
        d.abat = [68, 72, 94, 70, 65, 75, 71, 69].map(function (v, i) { return { reg: "amassada " + (i + 1), v: String(v) }; });
        A.exemplos.importar(F.params, d, "impAgua", [["dnit-036-2004-me", 0]]);
        A.exemplos.importar(F.params, d, "impSel", [["dnit-038-2004-me", 0], ["dnit-043-2004-me", 1]]);
        d.verificacoes = G.verifEx(F, { juntas: { real: "12", nc: "2", obs: "desvio de 8 mm nas juntas das placas P-210 e P-211" } });
        d.nota063 = [{ reg: "Laudo DNIT 063-PRO nº 15", v: "58" }];
        d.geo = secoes(20, [[7.02, 16.2, 15.6, 16.8], [7.01, 15.9, 15.2, 16.5], [6.98, 16.1, 15.4, 16.7], [7.03, 15.7, 15.0, 16.4], [7.00, 16.0, 15.5, 16.6],
          [7.02, 15.8, 15.1, 16.3], [6.99, 16.3, 15.7, 16.9], [7.01, 15.6, 15.0, 16.2], [7.00, 15.9, 15.3, 16.4], [7.02, 15.7, 15.2, 16.1],
          [6.98, 16.0, 15.4, 16.5], [7.01, 15.8, 15.1, 16.2], [7.03, 15.9, 15.3, 16.4]]);
        d.obs = "Exemplo de rejeição: fctM,est abaixo do projeto (sem aceitação automática), testemunhos também abaixo; espessura média < 16 cm e amplitude > 1 cm; selante reprovado na absorção; desvio de juntas.";
        return d;
      }),
    ],
  });
  // verificações dos exemplos: todas "S", exceto as indicadas em nao {id: {real, nc, obs}}
  G.verifEx = function (F, nao) {
    nao = nao || {};
    return F.itensSN.map(function (it) { return nao[it.id] ? Object.assign({ atende: "N" }, nao[it.id]) : { atende: "S" }; });
  };
})();
