/*
 * Ficha de ACEITAÇÃO DE LOTE: DNER-ES 391/99 — Tratamento superficial simples com asfalto polímero.
 *
 * Define também FE.aceitacaoG4b.ts(cfg), a montagem COMUM dos tratamentos superficiais e do macadame por penetração
 * com asfalto polímero (DNER-ES 391, 392, 393 e 394/99), sobre o núcleo FE.aceitacaoG4b de es-dnit-150-2010-es.js
 * (carregado antes). 392, 393 e 394 só chamam G4.ts com as suas camadas, taxas e seções.
 *
 * O que a DNER-ES 391/99 manda (seções do PDF; 392 e 393 são idênticas, com 2 e 3 camadas):
 *   5.1.1 CAP modificado por polímero SBS ou emulsões RR-1C/RR-2C modificadas; 5.1.3 agregado: LA ≤ 40 % (maior com
 *   desempenho satisfatório), índice de forma > 0,5, durabilidade < 12 %, adesividade > 90 %, granulometria numa das
 *   faixas do quadro com tolerância na curva de projeto ± 7/5/2 %; 5.1.4 taxas fixadas no projeto (recomendadas: CAP
 *   0,8–1,2 l/m², agregado 8–12 kg/m²; emulsão: ligante residual); 5.3.2 temperatura do CAP: 150 °C + 3 °C por 1 % de
 *   polímero, máx. 180 °C; emulsão: 20 a 100 s SF; 7.1.1 ensaios do ligante por carregamento / 100 t / 500 t;
 *   7.1.2 agregado: 2 granulometrias por jornada, índice de forma a cada 900 m³, adesividade por carregamento de
 *   ligante, LA por mês; 7.2.1 temperatura no caminhão distribuidor; 7.2.2.1 taxa de ligante residual por bandejas,
 *   tolerância ± 0,2 l/m²; 7.2.2.2 taxa de agregado por bandejas, ± 1,5 kg/m²; 7.2.3 tabela de amostragem variável
 *   (com n = 11), mínimo de 5 por segmento de área < 3.000 m²; 7.3.1 réguas ≤ 0,5 cm; 7.3.2 alinhamentos ± 5 cm;
 *   7.4.2 aceitação estatística da granulometria e das taxas (X̄ − ks ≥ mín. e X̄ + ks ≤ máx.); 9.2 α = 0,10 e
 *   determinações a cada 700 m² (recomendação).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G4 = FE.aceitacaoG4b, num = FE.num, ok = FE.ok, fmt = FE.fmt, G = FE.granulometria;
  if (!G4 || !G4.montar) { if (window.console) console.error("es-dner-es-391-99.js: carregue antes site/fichas/es-dnit-150-2010-es.js (FE.aceitacaoG4b)."); return; }
  var TX = "dnit-144-2014-es";

  // =====================================================================================
  // G4.ts — tratamentos superficiais / macadame por penetração com asfalto polímero
  // =====================================================================================
  // c: {id, codigo ("391"), titulo, resumo, notas, refs, tabelaK, secTaxaL, secTaxaA, secK, secFaixa, secMin,
  //     camadas: [{nome, lig: bool, agr: bool, faixaPadrao, faixas(f) -> bool, rec: {lig, agr}, limites(P, i) -> {lig: {min, max, txt}, agr: {...}}}],
  //     tolL, tolA (± de projeto) | limites por camada, geo: {...G4.secGeo}, ligante, agregados, verif, params, padrao, extra(ctx)}
  G4.ts = function (c) {
    var cams = c.camadas;
    function fxDe(P, i) { return G4.faixa(P["faixa" + i]) || G4.faixa(cams[i - 1].faixaPadrao); }
    function limites(P, i) {
      var cm = cams[i - 1];
      if (cm.limites) return cm.limites(P, i);
      var pl = num(P["projL" + i]), pa = num(P["projA" + i]);
      return { lig: { min: pl - c.tolL, max: pl + c.tolL, txt: ok(pl) ? fmt(pl - c.tolL, 2) + " a " + fmt(pl + c.tolL, 2) + " l/m² (" + fmt(pl, 2) + " ± " + fmt(c.tolL, 1) + ")" : "projeto ± " + fmt(c.tolL, 1) + " l/m²", proj: pl },
        agr: { min: pa - c.tolA, max: pa + c.tolA, txt: ok(pa) ? fmt(pa - c.tolA, 1) + " a " + fmt(pa + c.tolA, 1) + " kg/m² (" + fmt(pa, 1) + " ± " + fmt(c.tolA, 1) + ")" : "projeto ± " + fmt(c.tolA, 1) + " kg/m²", proj: pa } };
    }
    function freqTaxa(ctx) {
      var ar = ctx.L.area;
      if (ctx.P.plano === "700") return { exigido: Math.max(5, ok(ar) ? Math.ceil(ar / 700 - 1e-9) : 5), regra: "1 a cada 700 m² (9.2, α = 0,10); mín. 5" };
      var seg = ok(ar) ? Math.max(1, Math.ceil(ar / 3000 - 1e-9)) : 1;
      return { exigido: 5 * seg, regra: "mín. 5 por segmento de área < 3.000 m² (" + c.secMin + ")" + (seg > 1 ? " × " + seg + " segmentos" : "") };
    }
    var nomeCam = function (i) { return cams.length > 1 ? cams[i - 1].nome : "Camada única"; };

    // ---------- seção de uma camada: taxas por bandeja + granulometria do agregado ----------
    function secCamada(i) {
      var cm = cams[i - 1], params = [];
      if (cm.agr !== false) params.push({ k: "faixa" + i, r: nomeCam(i) + " — faixa granulométrica do agregado (" + c.secFaixa + ")", tipo: "select", recarrega: true,
        opcoes: function () { return G4.opcoesFaixa(c.id, cm.faixas); } });
      if (!cm.limites) {
        if (cm.lig !== false) params.push({ k: "projL" + i, r: nomeCam(i) + " — taxa de projeto do ligante (l/m²; emulsão: residual)",
          dica: "tolerância ± " + fmt(c.tolL, 1) + " l/m² (" + c.secTaxaL + ")" + (cm.rec ? "; recomendado " + fmt(cm.rec.lig[0], 2) + " a " + fmt(cm.rec.lig[1], 2) + " l/m²" : "") });
        if (cm.agr !== false) params.push({ k: "projA" + i, r: nomeCam(i) + " — taxa de projeto do agregado (kg/m²)",
          dica: "tolerância ± " + fmt(c.tolA, 1) + " kg/m² (" + c.secTaxaA + ")" + (cm.rec ? "; recomendado " + cm.rec.agr[0] + " a " + cm.rec.agr[1] + " kg/m²" : "") });
      } else (cm.params || []).forEach(function (p) { params.push(p); });
      params.push(G4.imp("impTx" + i, nomeCam(i) + " — taxas por bandeja (DNIT 144 — ficha de taxa de aplicação)", TX, function (lista, P, d) {
        var cols = [];
        lista.forEach(function (e) {
          var X = FE.FICHAS[TX], calc = X.calcular(e.dados), r = calc.resultados, dl = e.dados.lig || [], da = e.dados.agr || [];
          var n = Math.max(dl.length, da.length);
          for (var j = 0; j < n; j++) {
            var tl = calc.tab.lig[j] || {}, ta = (calc.tab.agr || [])[j] || {}, bl = dl[j] || {}, ba = da[j] || {};
            var vL = r.emu ? tl.trv : tl.x, vA = ta.x;
            if (!ok(vL) && !ok(vA)) continue;
            cols.push({ est: bl.est || ba.est || "", pos: bl.lado || ba.lado || "", reg: A.importacao.rotulo(e, "bandeja " + (j + 1) + " · serv. " + ((e.dados.params || {}).servico || "?")),
              lig: cm.lig !== false && ok(vL) ? A.nstr(vL, 3) : "", agr: cm.agr !== false && ok(vA) ? A.nstr(vA, 2) : "" });
          }
        });
        A.importacao.substituir(d, "tx" + i, cols);
      }));
      if (cm.agr !== false) params.push(G4.imp("impGr" + i, nomeCam(i) + " — granulometria do agregado (DNIT 412)", "dnit-412-2025-me", function (lista, P, d) {
        var fx = fxDe(P, i);
        A.importacao.substituir(d, "gr" + i, lista.map(function (e) {
          var g = G4.colGran(e), id = A.importacao.ident(e);
          return G4.pensDaFaixa(fx, g.media, { est: "", pos: id.local || "", reg: A.importacao.rotulo(e) });
        }));
      }));
      return {
        params: params,
        tabelas: function (d, P) {
          var fx = fxDe(P, i), T = [], lin = [{ k: "est", r: "Estaca", texto: true }, { k: "pos", r: "Posição (LE / eixo / LD)", texto: true }, { k: "reg", r: "Registro / origem", texto: true }];
          if (cm.lig !== false) lin.push({ k: "lig", r: "Taxa de ligante" + (c.residual === false ? "" : " residual"), u: "l/m²" });
          if (cm.agr !== false) lin.push({ k: "agr", r: "Taxa de agregado", u: "kg/m²" });
          T.push({ chave: "tx" + i, titulo: nomeCam(i) + " — taxas de aplicação por bandeja (" + [cm.lig !== false ? c.secTaxaL : "", cm.agr !== false ? c.secTaxaA : ""].filter(Boolean).join("; ") + ")",
            rotulo: "Bandeja", iniciais: 1, min: 1, dica: "bandejas de massa e área conhecidas, ao acaso na pista; emulsão: asfalto residual após massa constante", linhas: lin });
          if (cm.agr !== false) {
            T.push({ chave: "proj" + i, titulo: nomeCam(i) + " — curva granulométrica de projeto do agregado (faixa " + (fx ? fx.faixa : "?") + ")", rotulo: "Curva", iniciais: 1, min: 1, fixo: true, nomes: ["Projeto"],
              dica: "tolerância na curva de projeto (" + c.secFaixa + ")", linhas: G4.linhasPen(fx, function (p) { return " — faixa " + p.min + "–" + p.max; }) });
            T.push({ chave: "gr" + i, titulo: nomeCam(i) + " — granulometria do agregado (" + c.secGranFreq + ")", rotulo: "Amostra", iniciais: 1, min: 1,
              dica: "amostras aleatórias; DNER-ME 083 → DNIT 412", linhas: [{ k: "est", r: "Estaca / data", texto: true }, { k: "pos", r: "Local / jornada", texto: true },
                { k: "reg", r: "Registro / origem", texto: true }, { grupo: "% passando" }].concat(G4.linhasPen(fx)) });
          }
          return T;
        },
        calcular: function (ctx) {
          var P = ctx.P, d = ctx.d, lim = limites(P, i), grp = nomeCam(i), K = c.tabelaK, R = c.refs, fr = freqTaxa(ctx), tx = d["tx" + i] || [];
          if (cm.lig !== false) {
            var ll = A.avaliar({ id: "lig" + i, grupo: grp, criterio: "Taxa de aplicação do ligante" + (c.residual === false ? "" : " residual"), secao: c.secTaxaL, unid: "l/m²", casas: 2,
              pontos: G4.pontos(tx, "lig", "bandeja "), min: lim.lig.min, max: lim.lig.max, tabelaK: K, refs: R, exigido: lim.lig.txt });
            ll.graf = true;
            if (ll.n && !(ok(lim.lig.min) && ok(lim.lig.max))) A.marcar(ll, "pendente", lim.lig.falta || "informe a taxa de projeto do ligante");
            ctx.linhas.push(ll);
            ctx.freqs.push(A.frequencia({ ensaio: grp + " — taxa de ligante (bandejas)", metodo: "bandejas", regra: fr.regra, exigido: fr.exigido, realizado: ll.n }));
            if (cm.rec && ok(lim.lig.proj) && (lim.lig.proj < cm.rec.lig[0] - 1e-9 || lim.lig.proj > cm.rec.lig[1] + 1e-9))
              ctx.avisos.push(grp + ": taxa de projeto do ligante (" + fmt(lim.lig.proj, 2) + " l/m²) fora da recomendada de " + fmt(cm.rec.lig[0], 2) + " a " + fmt(cm.rec.lig[1], 2) + " l/m² (" + c.secRec + ") — admissível se fixada no projeto.");
          }
          if (cm.agr !== false) {
            var la = A.avaliar({ id: "agr" + i, grupo: grp, criterio: "Taxa de espalhamento do agregado", secao: c.secTaxaA, unid: "kg/m²", casas: 1,
              pontos: G4.pontos(tx, "agr", "bandeja "), min: lim.agr.min, max: lim.agr.max, tabelaK: K, refs: R, exigido: lim.agr.txt });
            la.graf = true;
            if (la.n && !(ok(lim.agr.min) && ok(lim.agr.max))) A.marcar(la, "pendente", lim.agr.falta || "informe a taxa de projeto do agregado");
            ctx.linhas.push(la);
            ctx.freqs.push(A.frequencia({ ensaio: grp + " — taxa de agregado (bandejas)", metodo: "bandejas", regra: fr.regra, exigido: fr.exigido, realizado: la.n }));
            if (cm.rec && ok(lim.agr.proj) && (lim.agr.proj < cm.rec.agr[0] - 1e-9 || lim.agr.proj > cm.rec.agr[1] + 1e-9))
              ctx.avisos.push(grp + ": taxa de projeto do agregado (" + fmt(lim.agr.proj, 1) + " kg/m²) fora da recomendada de " + cm.rec.agr[0] + " a " + cm.rec.agr[1] + " kg/m² (" + c.secRec + ").");
            var fx = fxDe(P, i), cols = d["gr" + i] || [];
            var gr = G4.avaliarGran({ id: "gr" + i, cols: cols, proj: (d["proj" + i] || [])[0] || {}, fx: fx, grupo: grp + " — granulometria do agregado (" + c.secFaixa + ")",
              secao: c.secGranAcc, secFaixa: c.secFaixa, tabelaK: K, refs: R });
            ctx.linhas = ctx.linhas.concat(gr.linhas);
            var nG = cols.filter(function (col) { return fx && fx.peneiras.some(function (p) { return ok(num(col[G.chavePen(p.mm)])); }); }).length;
            ctx.freqs.push(A.frequencia({ ensaio: grp + " — granulometria do agregado", metodo: "DNER-ME 083 → DNIT 412", regra: "2 por jornada de 8 h (" + c.secGranFreq + ")", exigido: 2 * ctx.J, realizado: nG }));
            ctx.blocos.push({ titulo: grp + " — granulometria do agregado por peneira", html: function (relat) { return G4.htmlGran(gr, relat); } });
            ctx.graf.push(function (opt) { return G4.graficoGran(gr, cols, opt, grp + " — agregado" + (fx ? " (faixa " + fx.faixa + ")" : "")); });
          }
          var serv = tx.filter(function (col) { var m = /serv\. (\w+)/.exec(col.reg || ""); return m && m[1] !== c.codigo; });
          if (serv.length) ctx.avisos.push(grp + ": " + serv.length + " bandeja(s) importada(s) de ensaio da ficha de taxa com outro serviço selecionado (não " + c.codigo + ") — a taxa importada é a do ligante residual; confira a massa específica e o resíduo usados.");
        },
      };
    }

    // ---------- temperatura do ligante (CAP polímero) ----------
    var secTemp = G4.secValor({ id: "temp", grupo: "Execução — temperatura", criterio: "Temperatura do CAP polímero no caminhão distribuidor", secao: c.secTemp + "; " + c.secTempLim, unid: "°C", casas: 0,
      max: 180, obrigMax: true, individual: true, metodo: "termômetro do distribuidor", titulo: "Temperatura do ligante antes da aplicação (" + c.secTemp + ")",
      dica: "medida no caminhão distribuidor imediatamente antes de cada aplicação; recomendada 150 °C + 3 °C por 1 % de polímero, máx. 180 °C", rotV: "Temperatura", rotPos: "Camada / hora",
      exigido: function (P) { var p = num(P.polimero); return "≤ 180 °C" + (ok(p) ? " (recomendada " + fmt(150 + 3 * p, 0) + " °C)" : ""); },
      se: function (P) { return P.ligante !== "emu"; }, naoAplicaPor: "emulsão: aplicação por viscosidade (20 a 100 s SF) — ver verificações", graf: false,
      freq: function () { return { exigido: cams.filter(function (x) { return x.lig !== false; }).length, regra: "antes de cada aplicação de ligante (" + c.secTemp + "; 1 por aplicação no lote, adotado)" }; },
      depois: function (l, ctx) {
        var p = num(ctx.P.polimero);
        if (ok(p) && l.n) {
          var rec = 150 + 3 * p, baixas = l.pontos.filter(function (x) { return x.v < rec - 10; });
          if (baixas.length) ctx.avisos.push("Temperatura do CAP: " + baixas.length + " medição(ões) mais de 10 °C abaixo da recomendada (" + fmt(rec, 0) + " °C para " + fmt(p, 1) + " % de polímero, " + c.secTempLim + ").");
        }
      } });

    var secoes = [];
    for (var i = 1; i <= cams.length; i++) secoes.push(secCamada(i));
    secoes.push(secTemp, G4.secGeo(c.geo), G4.secLigante(c.ligante), G4.secAgregados(c.agregados), G4.secVerif(c.verif));
    var padrao = Object.assign({ ligante: "cap", plano: "seg", meses: "1", laDesemp: "nao" }, c.padrao || {});
    cams.forEach(function (cm, j) { if (cm.faixaPadrao && !padrao["faixa" + (j + 1)]) padrao["faixa" + (j + 1)] = cm.faixaPadrao; });
    return G4.montar({
      id: c.id, titulo: c.titulo, resumo: c.resumo, refs: c.refs, tabelaK: c.tabelaK, textos: c.textos,
      params: [
        { k: "ligante", r: "Ligante asfáltico modificado por polímero (5.1.1)", tipo: "select", recarrega: true,
          opcoes: [["cap", "Cimento asfáltico modificado por polímero SBS"], ["emu", "Emulsão RR-1C ou RR-2C modificada por polímero SBS (asfalto residual)"]] },
        { k: "polimero", r: "Teor de polímero do CAP (%) — opcional", dica: "temperatura recomendada = 150 °C + 3 °C por 1 % de polímero (" + c.secTempLim + ")", se: function (d) { return (d.params || {}).ligante !== "emu"; } },
        { k: "plano", r: "Plano de amostragem das taxas", tipo: "select",
          opcoes: [["seg", "Mínimo de 5 por segmento de área < 3.000 m² (" + c.secMin + ")"], ["700", "1 a cada 700 m² de pista (recomendação 9.2, α = 0,10)"]] },
      ].concat(c.params || []),
      padrao: padrao, secoes: secoes, exemplos: [], extra: c.extra,
      notas: c.notas + " k da tabela de amostragem variável da própria ES (" + c.secK + "). Taxas de ligante: com emulsão, controla-se o ligante residual (bandeja após massa constante); a importação da ficha de taxa por bandeja (DNIT 144) traz a taxa residual (emulsão) ou a taxa do CAP.",
    });
  };

  // =====================================================================================
  // DNER-ES 391/99 — TSS com asfalto polímero
  // =====================================================================================
  var ID = "dner-es-391-99";
  var REFS = { reprova: "7.4.2", atende: "7.4.2", corrige: "7.4.3", regra: "7.4.2", tabela: "tabela de amostragem variável (7.2.3)" };
  // partes comuns das DNER-ES 391, 392 e 393/99 (mesmas seções)
  G4.tsBase = function (codigo) {
    return {
      codigo: codigo, refs: REFS, tabelaK: G4.K_39X, tolL: 0.2, tolA: 1.5, secTaxaL: "7.2.2.1", secTaxaA: "7.2.2.2", secK: "7.2.3", secMin: "7.2.3", secFaixa: "5.1.3 e",
      secGranFreq: "7.1.2", secGranAcc: "7.4.2", secRec: "5.1.4.4", secTemp: "7.2.1", secTempLim: "5.3.2",
      geo: { alin: { tol: 5, sec: "7.3.2" }, regua: { max: 0.5, sec: "7.3.1" } },
      ligante: { sec: "7.1.1", tipoTxt: "especificação do asfalto polímero (DNER-EM 396/99) ou da emulsão polimerizada",
        porCarg: { texto: "CAP: penetração, fulgor, PA, recuperação elástica, espuma, estabilidade ao armazenamento · emulsão: SF, resíduo, peneiramento, carga, recuperação elástica", sec: "7.1.1.1 a; 7.1.1.2 a",
          ids: [[["sf25", "sf50", "pen"], "viscosidade SF / penetração"], [["residuo", "fulgor"], "resíduo / fulgor"], [["pen084", "pa"], "peneiramento / ponto de amolecimento"],
            [["carga", "espuma"], "carga / espuma"], ["recElast", "recuperação elástica"]] },
        por100: { texto: "emulsão: sedimentação, desemulsibilidade, destilação", sec: "7.1.1.2 c", se: function (P) { return P.ligante === "emu"; }, ids: [["sed", "sedimentação"], ["desem", "desemulsibilidade"], [["solv", "residuo"], "destilação"]] },
        por500: { texto: "infravermelho — teor de polímero ± 0,4 %", sec: "7.1.1.1 b; 7.1.1.2 b", ids: [["iv", "infravermelho"]] },
        de: ["dnit-165-2013-em", "dnit-095-2006-em"] },
      agregados: { sec: "5.1.3; 7.1.2", itens: [
        { k: "if", secao: "5.1.3 b; 7.1.2", min: 0.5, minEstrito: true, exigido: "> 0,5", metodo: "DNER-ME 086", freq: { por: "volume", a_cada: 900, texto: "1 a cada 900 m³" } },
        { k: "ades", secao: "5.1.3 d; 7.1.2", min: 90, metodo: "DNER-ME 059 / 078 / 079 → DNIT 452", freq: { por: "carregamento", n: 1, texto: "1 por carregamento de ligante" } },
        { k: "la", secao: "5.1.3 a; 7.1.2", max: 40, metodo: "DNER-ME 035 → DNIT 451", freq: { por: "mes", n: 1, texto: "1 por mês ou com variação do material" } },
        { k: "dur", secao: "5.1.3 c", max: 12, exigido: "< 12 %", metodo: "DNER-ME 089", freq: { por: "caract" } },
      ] },
      verif: [
        { id: "clima", texto: "Execução sem chuva e com temperatura ambiente ≥ 10 °C", secao: "4.1" },
        { id: "cert", texto: "Certificado de análise do ligante em todo carregamento", secao: "4.2" },
        { id: "varr", texto: "Pista imprimada/pintada varrida antes da aplicação", secao: "5.3.1" },
        { id: "visc", texto: "Emulsão aplicada com viscosidade de 20 a 100 s SF", secao: "5.3.2 b", se: function (P) { return P.ligante === "emu"; }, naoAplicaPor: "ligante é CAP polímero" },
        { id: "compr", texto: "Compressão iniciada logo após o espalhamento, dos bordos para o eixo; varredura do material solto", secao: "5.3.6; 5.3.7", falha: "ressalva" },
        { id: "trafego", texto: "Tráfego só após a compressão, de forma controlada", secao: "5.3.8", falha: "ressalva" },
      ],
    };
  };
  function notasTS(nc) {
    return "Critérios da DNER-ES 39" + nc + "/99 (7.4.2): taxa de ligante residual (projeto ± 0,2 l/m², 7.2.2.1), taxa de agregado (projeto ± 1,5 kg/m², 7.2.2.2) e granulometria do agregado (curva de projeto ± 7/5/2 %, faixa do quadro de 5.1.3 e) pelo controle estatístico X̄ − ks ≥ mín. e X̄ + ks ≤ máx.; mínimo de 5 determinações por segmento de área < 3.000 m² (7.2.3; lotes maiores: 5 por fração de 3.000 m², adotado); temperatura do CAP ≤ 180 °C (5.3.2); réguas ≤ 0,5 cm (7.3.1) e alinhamentos ± 5 cm (7.3.2); materiais conforme 5.1 (7.4.1).";
  }
  var F = G4.ts(Object.assign(G4.tsBase("391"), {
    id: ID, titulo: "Tratamento superficial simples com asfalto polímero — aceitação de lote",
    resumo: "Reúne as taxas de ligante residual e de agregado por bandeja (importadas da ficha de taxa ou digitadas), a granulometria do agregado, temperatura, acabamento e alinhamentos, o recebimento do ligante e o controle do agregado; aplica a aceitação estatística da 7.4.2 com a tabela de 7.2.3.",
    camadas: [{ nome: "Camada única", faixaPadrao: "dner-es-391-99-A", rec: { lig: [0.8, 1.2], agr: [8, 12] } }],
    padrao: { projL1: "1,00", projA1: "10" },
    notas: notasTS(1),
  }));

  // =====================================================================================
  // Exemplos
  // =====================================================================================
  function importa(d, k, refs) { A.exemplos.importar(F.params, d, k, refs); }
  // bandejas: [estaca, posição, ligante l/m², agregado kg/m²]
  function tx(lista) { return lista.map(function (x, j) { return { est: x[0], pos: x[1], reg: "BAND-" + (j + 1), lig: A.nstr(x[2], 2), agr: A.nstr(x[3], 1) }; }); }
  G4.tsGeo = function (ini, n, alin, reg) {
    var o = [];
    for (var j = 0; j < n; j++) o.push({ est: String(ini + j), alin: A.nstr(alin[j % alin.length], 1), regua: A.nstr(reg[j % reg.length], 1) });
    return o;
  };
  // granulometrias: [estaca/data, % por peneira na ordem da faixa]
  G4.tsGran = function (fxId, lista, pref) {
    var fx = G4.faixa(fxId);
    return lista.map(function (x, j) {
      var c = { est: x[0], pos: "", reg: pref + "-" + (j + 1) + " · DNIT 412" };
      fx.peneiras.forEach(function (p, k) { if (ok(x[1][k])) c[G.chavePen(p.mm)] = A.nstr(x[1][k], 1); });
      return c;
    });
  };
  G4.tsProj = function (fxId, vals) {
    var fx = G4.faixa(fxId), c = {};
    fx.peneiras.forEach(function (p, k) { c[G.chavePen(p.mm)] = String(vals[k]).replace(".", ","); });
    return [c];
  };
  F.exemplos = [
    { nome: "Lote aceito — TSS com CAP polímero, faixa A, 1 jornada (ligante, adesividade e LA dos exemplos ME)", dados: function () {
      var d = { ident: { registro: "LOTE-TSSP-001", data: "2026-09-05", obra: "Obra A — BR-000", trecho: "Pista direita", local: "Est. 500 a 530", camada: "TSS — CAP polímero SBS, faixa A" },
        params: Object.assign({}, F.padrao, { estIni: "500", estFim: "530", largura: "3,50", jornadas: "1", polimero: "4", projL1: "1,00", projA1: "10", volAgr: "12" }),
        tx1: tx([["501", "LE", 1.04, 10.4], ["504", "eixo", 0.97, 9.6], ["507", "LD", 1.02, 10.9], ["511", "LE", 0.95, 9.8], ["514", "eixo", 1.06, 10.2],
          ["518", "LD", 0.99, 10.6], ["521", "LE", 1.03, 9.5], ["525", "eixo", 0.98, 10.1], ["528", "LD", 1.01, 10.3]]),
        proj1: G4.tsProj("dner-es-391-99-A", [100, 92, 20, 5, 1]),
        gr1: G4.tsGran("dner-es-391-99-A", [["05/09", [100, 93.4, 21.6, 4.8, 0.9]], ["05/09", [100, 91.2, 18.7, 5.6, 1.2]]], "GR-A"),
        temp: [{ est: "", pos: "05/09 08h10", reg: "T-01", v: "163" }],
        geo: G4.tsGeo(500, 31, [1.2, -0.6, 2.1, -1.8, 0.4], [0.2, 0.3, 0.1, 0.4, 0.2]),
        verif: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, {}, { atende: "S" }, { atende: "S" }],
        obs: "Exemplo: bandejas e granulometrias digitadas; carregamento de CAP (exemplo da ficha DNIT 095, ensaios de asfalto polímero completados à mão), adesividade e LA importados dos exemplos das fichas DNIT 452 e 451." };
      importa(d, "impLig", [["dnit-095-2006-em", 1]]);
      Object.assign(d.lig[0], { tipo: "CAP polímero SBS", ensC: "S", ens500: "S", obs: "exemplo CAP da ficha 095; recuperação elástica, estabilidade ao armazenamento e IV conferidos no certificado" });
      importa(d, "impAgr", [["dnit-452-2024-me", 0], ["dnit-451-2024-me", 1]]);
      d.agr.push({ reg: "IF-01", data: "05/09/2026", if: "0,63", dur: "6" });
      return d;
    } },
    { nome: "Lote rejeitado — taxa de ligante abaixo de projeto − 0,2, agregado com variação excessiva, CAP a 186 °C", dados: function () {
      var d = { ident: { registro: "LOTE-TSSP-002", data: "2026-09-09", obra: "Obra B — BR-000", trecho: "Pista esquerda", local: "Est. 40 a 60", camada: "TSS — CAP polímero SBS, faixa B" },
        params: Object.assign({}, F.padrao, { estIni: "40", estFim: "60", largura: "3,50", jornadas: "1", polimero: "4", faixa1: "dner-es-391-99-B", projL1: "0,90", projA1: "9" }),
        tx1: tx([["41", "LE", 0.72, 8.1], ["44", "eixo", 0.80, 10.6], ["47", "LD", 0.68, 7.9], ["51", "LE", 0.77, 9.8], ["55", "eixo", 0.74, 10.9], ["58", "LD", 0.70, 7.6]]),
        proj1: G4.tsProj("dner-es-391-99-B", [100, 92, 25, 1]),
        gr1: G4.tsGran("dner-es-391-99-B", [["09/09", [100, 90.8, 27.9, 1.6]]], "GR-B"),
        temp: [{ est: "", pos: "09/09 07h50", reg: "T-11", v: "186" }],
        geo: G4.tsGeo(40, 21, [1.4, -2.1, 0.8], [0.3, 0.2, 0.7]),
        verif: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, {}, { atende: "S" }, { atende: "S" }],
        obs: "Exemplo de reprovação: taxa de ligante com X̄ − ks < 0,70 l/m², taxa de agregado com X̄ ± ks fora de 7,5–10,5 kg/m², temperatura acima de 180 °C, réguas com 0,7 cm, carregamento de CAP reprovado (exemplo da ficha 095) e só 1 granulometria na jornada." };
      importa(d, "impLig", [["dnit-095-2006-em", 2]]);
      importa(d, "impAgr", [["dnit-452-2024-me", 0]]);
      return d;
    } },
  ];
})();
