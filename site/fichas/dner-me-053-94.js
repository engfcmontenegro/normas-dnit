/*
 * Ficha: DNER-ME 053/94 — Misturas betuminosas — percentagem de betume (extrator centrífugo, "rotarex").
 * Teor de betume = (amostra − agregado recuperado) / amostra × 100 (5 g, 6) e granulometria do agregado
 * recuperado (cálculo da ficha DNIT 412 via FE.granulometria), comparada com a faixa da especificação
 * e, opcionalmente, com a faixa de trabalho (curva de projeto ± tolerâncias).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media, G = FE.granulometria;

  var SOLVENTES = [["", "— não informado —"], ["ccl4", "Tetracloreto de carbono (Nota 2 — ligante asfáltico)"],
    ["benzol", "Benzol (Nota 2 — alcatrão; motor blindado, Nota 3)"], ["tricloro", "Tricloroetileno (não previsto na norma)"],
    ["outro", "Outro (não previsto na norma)"]];

  function faixaSel(P) { return G.faixasDisponiveis().filter(function (f) { return f.id === P.faixa; })[0] || null; }
  function peneiras(P) {
    var fx = faixaSel(P);
    if ((P.serie || "faixa") === "faixa" && fx) return fx.peneiras.map(function (x) { return x.mm; });
    return G.SERIES[P.serie] || G.SERIES.completa;
  }
  function perto(a, b) { return Math.abs(a - b) / b < 0.04; }
  function tolDe(fx, mm, P) {
    var t = fx && fx.tolerancia ? fx.tolerancia.filter(function (x) { return perto(mm, x.mm); })[0] : null;
    if (t) return { v: t.tol, fonte: fx.codigo };
    var g = num(P.tolGran);
    return ok(g) ? { v: g, fonte: "informada" } : null;
  }
  function granOn(P) { return (P.granulometria || "sim") === "sim"; }

  FE.FICHAS["dner-me-053-94"] = {
    titulo: "Misturas betuminosas — percentagem de betume",
    rotuloImportar: function (r) { return "Teor " + (ok(r.teor) ? fmt(r.teor, 2) + " %" : "—") + (r.faixaConf === true ? " · na faixa" : r.faixaConf === false ? " · fora da faixa" : ""); },
    resumo: "Extração do ligante no extrator centrífugo; betume = amostra − agregado recuperado seco (5 g); P = betume / amostra × 100 (6). Granulometria do agregado recuperado comparada com a faixa da especificação e com a faixa de trabalho.",
    blocos: [],
    params: [
      { k: "mistura", r: "Mistura / serviço", ph: "ex.: CBUQ faixa C, PMF, areia-asfalto" },
      { k: "ligante", r: "Ligante da mistura (Nota 2)", tipo: "select", opcoes: [["asfaltico", "Asfáltico (CAP, emulsão, asfalto diluído)"], ["alcatrao", "Alcatrão"]] },
      { k: "solvente", r: "Solvente (Nota 2)", tipo: "select", opcoes: SOLVENTES },
      { k: "teorProjeto", r: "Teor de ligante de projeto (%) — opcional", dica: "do projeto de dosagem da mistura" },
      { k: "tolTeor", r: "Tolerância do teor (± pontos %) — opcional", ph: "0,3",
        dica: "± 0,3 % nas DNIT 385 (item de controle, Tabela de controle), 112 e 153; vazio = 0,3 quando há teor de projeto",
        se: function (d) { return ok(num((d.params || {}).teorProjeto)); } },
      { k: "correcao", r: "Correção da calibração do extrator (pontos %, somada) — opcional",
        dica: "a DNIT 385 exige calibrar a extração na dosagem e corrigir o teor determinado; a DNER-ME 053 não prevê correção" },
      { k: "granulometria", r: "Granulometria do agregado recuperado", tipo: "select", recarrega: true,
        opcoes: [["sim", "Sim — peneirar o agregado extraído (DNIT 412)"], ["nao", "Não — só o teor de betume"]] },
      { k: "faixa", r: "Faixa granulométrica da especificação", tipo: "select", recarrega: true,
        opcoes: function () {
          return [["", "— sem faixa —"]].concat(G.faixasDisponiveis().map(function (f) {
            return [f.id, f.codigo + " — " + f.servico + " — faixa " + f.faixa + (f.condicao ? " (" + f.condicao + ")" : "")];
          }));
        },
        dica: "faixas das especificações de serviço do acervo", se: function (d) { return granOn(d.params || {}); } },
      { k: "serie", r: "Série de peneiras", tipo: "select", recarrega: true,
        opcoes: [["faixa", "Peneiras da faixa escolhida"], ["completa", "Tabela A1 completa (75 a 0,075 mm)"], ["mistura", "Mistura (37,5 a 0,075 mm)"], ["miuda", "Miúdo (9,5 a 0,075 mm)"]],
        se: function (d) { return granOn(d.params || {}); } },
      { k: "projeto", r: "Curva de projeto (faixa de trabalho)", tipo: "select", recarrega: true,
        opcoes: [["nao", "Não informar"], ["sim", "Informar % passando de projeto — verifica a faixa de trabalho"]],
        se: function (d) { return granOn(d.params || {}); } },
      { k: "tolGran", r: "Tolerância da faixa de trabalho (± %) — se a faixa não trouxer",
        dica: "usada nas peneiras sem tolerância tabelada na especificação escolhida",
        se: function (d) { var P = d.params || {}; return granOn(P) && P.projeto === "sim"; } },
    ],
    padrao: { ligante: "asfaltico", solvente: "", granulometria: "sim", faixa: "", serie: "faixa", projeto: "nao" },
    tabelas: function (d) {
      var P = d.params || {};
      var linhas = [
        { grupo: "Pesagens — balança sensível a 0,1 g (3 c)" },
        { k: "tara", r: "Prato do extrator vazio (tara)", u: "g" },
        { k: "pa", r: "Prato + amostra (5 a)", u: "g" },
        { calc: "Ma", r: "Massa da amostra total", u: "g", casas: 1 },
        { k: "papel", r: "Papel de filtro seco, se pesado com o agregado — opcional", u: "g" },
        { k: "pr", r: "Prato + agregado recuperado seco (+ papel) — 5 e, f, g", u: "g" },
        { k: "pr0", r: "Pesagem anterior do prato + agregado (constância de peso) — opcional", u: "g" },
        { calc: "Mr", r: "Massa do agregado recuperado", u: "g", casas: 1 },
        { calc: "Mb", r: "Massa do betume extraído = amostra − agregado (5 g)", u: "g", casas: 1 },
        { calc: "P", r: "P = betume / amostra total × 100 (6)", u: "%", casas: 2, destaque: true },
      ];
      if (ok(num(P.correcao))) linhas.push({ calc: "Pc", r: "Teor corrigido pela calibração", u: "%", casas: 2, destaque: true });
      if (granOn(P)) {
        linhas.push({ grupo: "Granulometria do agregado recuperado — massas retidas (DNIT 412)" });
        peneiras(P).forEach(function (mm) { linhas.push({ k: G.chavePen(mm), r: "Retido na " + G.nomePeneira(mm), u: "g" }); });
        linhas.push({ k: "fundo", r: "Fundo — vazio: calculado por diferença", u: "g" },
          { calc: "fundoC", r: "Fundo considerado", u: "g", casas: 1 },
          { calc: "p200", r: "Passante na 0,075 mm", u: "%", casas: 1 });
      }
      var tabs = [{ chave: "ext", titulo: "Extração", rotulo: "Determinação", iniciais: 1, min: 1,
        dica: "uma coluna por amostra extraída (cerca de 1 000 g, seção 4); com mais de uma, o resultado é a média", linhas: linhas }];
      if (granOn(P) && P.projeto === "sim") {
        tabs.push({ chave: "proj", titulo: "Curva de projeto — % passando", rotulo: "Curva", iniciais: 1, min: 1, fixo: true, nomes: ["Projeto"],
          dica: "composição granulométrica do projeto de dosagem",
          linhas: peneiras(P).map(function (mm) { return { k: G.chavePen(mm), r: G.nomePeneira(mm), u: "%" }; }) });
      }
      return tabs;
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], corr = num(P.correcao);
      var cols = d.ext || [];
      var dets = cols.map(function (c, i) {
        var rot = cols.length > 1 ? "Determinação " + (i + 1) + ": " : "";
        var tara = num(c.tara), pa = num(c.pa), pr = num(c.pr), pr0 = num(c.pr0), papel = num(c.papel);
        var Ma = ok(tara) && ok(pa) ? pa - tara : NaN;
        var Mr = ok(tara) && ok(pr) ? pr - tara - (ok(papel) ? papel : 0) : NaN;
        var Mb = ok(Ma) && ok(Mr) ? Ma - Mr : NaN;
        var Pp = ok(Mb) && Ma > 0 ? Mb / Ma * 100 : NaN;
        var o = { Ma: Ma, Mr: Mr, Mb: Mb, P: Pp, Pc: ok(Pp) && ok(corr) ? Pp + corr : NaN };
        o.teor = ok(o.Pc) ? o.Pc : Pp;
        if (ok(Ma) && Ma <= 0) avisos.push(rot + "a massa do prato + amostra deve ser maior que a tara.");
        if (ok(Mb) && Mb < 0) avisos.push(rot + "o agregado recuperado pesa mais que a amostra — confira as pesagens e a secagem.");
        if (ok(Ma) && Ma > 1500) avisos.push(rot + "amostra de " + fmt(Ma, 1) + " g acima da capacidade do prato (1 500 g, 3 a).");
        else if (ok(Ma) && Ma > 0 && Math.abs(Ma - 1000) > 200) avisos.push(rot + "amostra de " + fmt(Ma, 1) + " g; a norma prevê cerca de 1 000 g obtidos por quarteamento (seção 4).");
        if (ok(pr0) && ok(pr) && Math.abs(pr - pr0) > 0.1 + 1e-6) avisos.push(rot + "as duas últimas pesagens do agregado seco diferem " + fmt(Math.abs(pr - pr0), 1) +
          " g — seque até constância de peso (5 e, f).");
        return o;
      });
      var teores = dets.map(function (o) { return o.teor; }).filter(ok);
      var teor = media(teores);
      if (teores.length > 1) {
        var amp = Math.max.apply(null, teores) - Math.min.apply(null, teores);
        if (amp > 0.3) avisos.push("As determinações diferem " + fmt(amp, 2) + " ponto(s) percentual(is) entre si — verifique a homogeneidade das amostras e a extração.");
      }
      // Nota 2: solvente conforme o ligante
      if (P.solvente === "ccl4" && P.ligante === "alcatrao") avisos.push("Nota 2: para alcatrão a norma usa benzol, não tetracloreto de carbono.");
      if (P.solvente === "benzol" && P.ligante !== "alcatrao") avisos.push("Nota 2: para ligante asfáltico a norma usa tetracloreto de carbono, não benzol.");
      if (P.solvente === "tricloro" || P.solvente === "outro") avisos.push("Solvente não previsto na DNER-ME 053/94 (Nota 2: tetracloreto de carbono para ligante asfáltico, benzol para alcatrão) — registre no relatório.");
      // tolerância do teor de projeto
      var proj = num(P.teorProjeto), tol = num(P.tolTeor);
      if (ok(proj) && !ok(tol)) tol = 0.3;
      var lim = ok(proj) ? { min: proj - tol, max: proj + tol } : null;
      var conf = null;
      if (lim && teores.length) {
        conf = true;
        dets.forEach(function (o, i) {
          if (!ok(o.teor)) return;
          if (o.teor < lim.min - 1e-9 || o.teor > lim.max + 1e-9) {
            conf = false;
            avisos.push((dets.length > 1 ? "Determinação " + (i + 1) + ": " : "") + "teor de " + fmt(o.teor, 2) + " % fora de " + fmt(proj, 2) + " ± " +
              fmt(tol, 2) + " % (" + fmt(lim.min, 2) + " a " + fmt(lim.max, 2) + " %), desvio de " + (o.teor - proj >= 0 ? "+" : "−") + fmt(Math.abs(o.teor - proj), 2) + ".");
          }
        });
      }

      // granulometria do agregado recuperado — cálculo da DNIT 412 (porcentagens sobre o agregado recuperado)
      var gr = null, trab = null, pens = peneiras(P), fx = faixaSel(P);
      var gtab = dets.map(function () { return {}; });
      if (granOn(P)) {
        var d412 = { params: { serie: P.serie || "faixa", faixa: P.faixa || "", lavagem: "nao" },
          amostras: [] };
        var idx = [];
        cols.forEach(function (c, i) {
          var Mr = dets[i].Mr, algum = false, soma = 0;
          var a = { Mi: ok(Mr) ? Mr : "" };
          pens.forEach(function (mm) {
            var v = num(c[G.chavePen(mm)]);
            if (ok(v)) { algum = true; soma += v; a[G.chavePen(mm)] = v; }
          });
          var fundo = num(c.fundo);
          a.fundo = ok(fundo) ? fundo : (ok(Mr) ? Mr - soma : "");
          if (!algum || !ok(Mr)) return;
          if (!ok(fundo) && Mr - soma < -0.05) avisos.push((cols.length > 1 ? "Determinação " + (i + 1) + ": " : "") + "a soma das massas retidas (" + fmt(soma, 1) +
            " g) supera o agregado recuperado (" + fmt(Mr, 1) + " g).");
          gtab[i].fundoC = num(a.fundo);
          idx.push(i);
          d412.amostras.push(a);
        });
        if (d412.amostras.length) {
          gr = G.calcular(d412);
          // avisos da DNIT 412: mantém a soma das massas (8 b) e a faixa; a massa mínima (Tabela 1) e a
          // concordância entre amostras (8 e) não se aplicam ao agregado extraído de ~1 000 g de mistura
          gr.avisos.forEach(function (a) {
            if (/Tabela 1|8 e\)/.test(a)) return;
            avisos.push("Granulometria — " + a.replace(/^Amostra (\d+)/, function (m, n) { return "determinação " + (idx[n - 1] + 1); }));
          });
          gr.amostras.forEach(function (o, n) {
            var p = o.pen ? o.pen.filter(function (x) { return Math.abs(x.mm - 0.075) < 0.001; })[0] : null;
            gtab[idx[n]].p200 = p ? p.pass : NaN;
          });
          // faixa de trabalho: projeto ± tolerância, limitada pela faixa da especificação
          if (P.projeto === "sim") {
            var pj = (d.proj || [])[0] || {};
            trab = gr.resultados.media.map(function (m) {
              var pv = num(pj[G.chavePen(m.mm)]), t = tolDe(fx, m.mm, P);
              var o = { mm: m.mm, pass: m.pass, proj: pv, tol: t ? t.v : NaN, lim: null, dentro: null, faixa: m.lim };
              if (ok(pv) && t) {
                var mn = pv - t.v, mx = pv + t.v;
                if (m.lim) { mn = Math.max(mn, m.lim.min); mx = Math.min(mx, m.lim.max); }
                o.lim = { min: mn, max: mx };
                o.dentro = ok(m.pass) ? m.pass >= mn - 1e-9 && m.pass <= mx + 1e-9 : null;
              }
              if (ok(pv) && m.lim && (pv < m.lim.min - 1e-9 || pv > m.lim.max + 1e-9))
                avisos.push("A curva de projeto está fora da faixa da especificação na " + G.nomePeneira(m.mm) + " (" + fmt(pv, 1) + " %).");
              return o;
            });
            var semTol = trab.filter(function (o) { return ok(o.proj) && !ok(o.tol); });
            if (semTol.length) avisos.push("Sem tolerância para a faixa de trabalho em: " + semTol.map(function (o) { return G.nomePeneira(o.mm); }).join(", ") +
              " — informe a tolerância (± %).");
            var foraT = trab.filter(function (o) { return o.dentro === false; });
            if (foraT.length) avisos.push("Fora da faixa de trabalho em " + foraT.length + " peneira(s): " + foraT.map(function (o) {
              return G.nomePeneira(o.mm) + " (" + fmt(o.pass, 1) + " %, trabalho " + fmt(o.lim.min, 1) + "–" + fmt(o.lim.max, 1) + ")";
            }).join("; ") + ".");
          }
        }
      }
      var tab = dets.map(function (o, i) {
        var x = {}; for (var k in o) x[k] = o[k];
        x.fundoC = gtab[i].fundoC; x.p200 = gtab[i].p200;
        return x;
      });
      var trabConf = trab ? (trab.some(function (o) { return o.dentro === false; }) ? false : trab.some(function (o) { return o.dentro === true; }) ? true : null) : null;
      return { tab: { ext: tab }, dets: dets, gr: gr, trab: trab,
        resultados: { teor: teor, n: teores.length, teores: teores, corr: corr, proj: proj, tol: tol, lim: lim, conforme: conf,
          faixa: fx, faixaConf: gr ? gr.resultados.conforme : null, trabConf: trabConf }, avisos: avisos };
    },
    resultadosHtml: function (calc, d) {
      var r = calc.resultados;
      function cx(v, rot, p) { return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var s = '<div class="fe-res">' +
        cx(ok(r.teor) ? fmt(r.teor, 2) + " <small>%</small>" : "—", "Teor de betume" + (ok(r.corr) ? " corrigido" : "") + " (6)" +
          (r.n > 1 ? " — média de " + r.n + " (" + r.teores.map(function (x) { return fmt(x, 2); }).join("; ") + " %)" : "") +
          (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>'));
      if (r.lim) s += cx(fmt(r.proj, 2) + " ± " + fmt(r.tol, 2) + " %", "Teor de projeto e tolerância (" + fmt(r.lim.min, 2) + " a " + fmt(r.lim.max, 2) + " %)", true);
      if (r.faixaConf !== null) s += cx(r.faixaConf ? '<span class="fe-ok">dentro da faixa</span>' : '<span class="fe-nok">fora da faixa</span>',
        "Agregado recuperado — " + r.faixa.codigo + " faixa " + r.faixa.faixa, true);
      if (r.trabConf !== null) s += cx(r.trabConf ? '<span class="fe-ok">dentro</span>' : '<span class="fe-nok">fora</span>', "Faixa de trabalho (projeto ± tolerâncias)", true);
      s += "</div>";
      if (calc.gr) s += G.tabela(calc.gr, {}, false) + tabelaTrabalho(calc, false);
      return s;
    },
    graficos: function (calc, d, opt) {
      if (!calc.gr) return [];
      var cor = opt && opt.imprimir ? "#222" : "var(--text-dim)";
      function rot(svg, t) {
        return svg.replace("</svg>", '<text x="58" y="30" fill="' + cor + '" font-weight="bold">' + esc(t) + "</text></svg>");
      }
      var fx = calc.resultados.faixa;
      var g = [rot(G.grafico(calc.gr, opt), fx ? "Faixa " + fx.faixa + " — " + fx.codigo : "Agregado recuperado")];
      if (calc.trab && calc.trab.some(function (o) { return o.lim; })) {
        // mesma curva, com a faixa de trabalho sombreada
        var c2 = { amostras: calc.gr.amostras, resultados: { media: calc.gr.resultados.media.map(function (m, j) {
          var t = calc.trab[j]; return { mm: m.mm, pass: m.pass, lim: t.lim, dentro: t.dentro };
        }) } };
        g.push(rot(G.grafico(c2, opt), "Faixa de trabalho (projeto ± tolerâncias)"));
      }
      return g;
    },
    relatorio: {
      notas: "Betume extraído = massa da amostra antes do ensaio − massa do agregado recuperado seco (5 g); P = betume / amostra total × 100 (seção 6). A norma não fixa arredondamento: teor com 0,01 %. Os finos arrastados pelo solvente não são recuperados (a norma não prevê essa correção) e contam como betume. Granulometria do agregado recuperado calculada como na DNIT 412 (porcentagens sobre o agregado recuperado); faixa de trabalho = projeto ± tolerâncias da especificação, limitada pela faixa. O primeiro gráfico mostra a faixa da especificação; o segundo, a faixa de trabalho.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.mistura) rows.push(["Mistura", P.mistura]);
        if (r.n > 1) rows.push(["Teores das determinações", r.teores.map(function (x) { return fmt(x, 2) + " %"; }).join("; ")]);
        if (ok(r.corr)) rows.push(["Correção da calibração aplicada", (r.corr >= 0 ? "+" : "−") + fmt(Math.abs(r.corr), 2) + " ponto(s) %"]);
        rows.push(["Percentagem de betume" + (r.n > 1 ? " (média)" : ""), ok(r.teor) ? fmt(r.teor, 2) + " %" +
          (r.conforme === null ? "" : (r.conforme ? " — ATENDE a " : " — NÃO ATENDE a ") + fmt(r.proj, 2) + " ± " + fmt(r.tol, 2) + " %") : "—"]);
        if (r.faixaConf !== null) rows.push(["Granulometria do agregado recuperado", r.faixa.codigo + " — " + r.faixa.servico + " — faixa " + r.faixa.faixa +
          (r.faixaConf ? " — DENTRO DA FAIXA" : " — FORA DA FAIXA")]);
        if (r.trabConf !== null) rows.push(["Faixa de trabalho (projeto ± tolerâncias)", r.trabConf ? "DENTRO" : "FORA"]);
        return rows;
      },
      extraHtml: function (calc) { return calc.gr ? G.tabela(calc.gr, {}, true) + tabelaTrabalho(calc, true) : ""; },
    },
    exemplos: [
      { nome: "CBUQ faixa C — CP-1-1 e CP-1-2, 600 g (planilha do laboratório, 25/02/2026)", dados: function () {
        var ret = { r19_1: "7,5", r12_7: "16,2", r9_5: "12,2", r6_3: "77,5", r4_8: "51,7", r2_36: "99,6", r1_18: "71,2", r0_6: "67,4", r0_3: "68,3", r0_15: "51,2", r0_075: "22,1" };
        function col(t, pa, pr) { var o = { tara: t, pa: pa, pr: pr }; for (var k in ret) o[k] = ret[k]; return o; }
        return { ident: { registro: "EX-EXT-001", data: "2026-02-25", obra: "Obra A", trecho: "Unidade A — pátio", local: "1º caminhão — CP-1-1 e CP-1-2",
          camada: "CBUQ — revestimento (lançado em 24/02/2026)", origem: "Usina da Unidade A" },
          params: { mistura: "CBUQ faixa C", ligante: "asfaltico", solvente: "", teorProjeto: "4,5", tolTeor: "0,3", granulometria: "sim",
            faixa: "dnit-385-2026-es-C-12-5", serie: "faixa", projeto: "nao" },
          ext: [col("1807,1", "2407,1", "2376,5"), col("1358,2", "1958,2", "1929,1")],
          obs: "Planilha: as massas retidas das duas colunas são as mesmas (peneiramento de um só agregado recuperado)." };
      } },
      { nome: "Estudo — extração com tricloroetileno, teor conhecido 4,5 % (planilha do laboratório)", dados: function () {
        return { ident: { registro: "EX-EXT-002", data: "2026-02-25", obra: "Estudo de solvente", camada: "CBUQ faixa C — teor de CAP 4,5 %" },
          params: { mistura: "CBUQ faixa C (estudo)", ligante: "asfaltico", solvente: "tricloro", teorProjeto: "4,5", tolTeor: "0,3", granulometria: "sim",
            faixa: "dnit-385-2026-es-C-12-5", serie: "faixa", projeto: "nao" },
          ext: [{ tara: "1807,5", pa: "2407,6", pr: "2380,0", r19_1: "6,2", r12_7: "35", r9_5: "31,6", r6_3: "77,4", r4_8: "42,5", r2_36: "65,8",
            r1_18: "62", r0_6: "65,9", r0_3: "68,1", r0_15: "61,3", r0_075: "33,4" }] };
      } },
      { nome: "Pré-misturado a frio DNIT 153 faixa B — 1 000 g, curva de projeto e faixa de trabalho", dados: function () {
        var fx = "dnit-153-2010-es-B", pens = [19.1, 12.7, 9.5, 4.8, 2, 0.075];
        function col(tara, Ma, P, pass, fundoMedido, pr0) {
          var Mb = Math.round(Ma * P / 100 * 10) / 10, Mr = Ma - Mb, o = { tara: fmt(tara, 1), pa: fmt(tara + Ma, 1), pr: fmt(tara + Mr, 1) };
          if (pr0) o.pr0 = fmt(tara + Mr + pr0, 1);
          var ant = 100, soma = 0;
          pens.forEach(function (mm, j) { var m = Math.round((ant - pass[j]) / 100 * Mr * 10) / 10; o[G.chavePen(mm)] = fmt(m, 1); soma += m; ant = pass[j]; });
          if (fundoMedido) o.fundo = fmt(Mr - soma - fundoMedido, 1);
          return o;
        }
        return { ident: { registro: "EX-EXT-003", obra: "Rodovia exemplo", trecho: "km 12 ao km 15", local: "Saída do misturador", camada: "PMF — revestimento" },
          params: { mistura: "PMF com emulsão RL-1C", ligante: "asfaltico", solvente: "ccl4", teorProjeto: "5,0", tolTeor: "0,3", granulometria: "sim",
            faixa: fx, serie: "faixa", projeto: "sim" },
          ext: [col(1512.3, 1000.4, 5.1, [100, 86.5, 53.2, 27.1, 16.4, 3.4], 0, 0.1), col(1498.6, 1001.2, 4.97, [100, 88.9, 56.8, 29.5, 18.2, 3.9], 1.2)],
          proj: [{ r19_1: "100", r12_7: "88", r9_5: "55", r4_8: "28", r2: "17", r0_075: "3" }] };
      } },
    ],
  };

  // faixa de trabalho por peneira (quando há curva de projeto)
  function tabelaTrabalho(calc, relat) {
    var t = calc.trab;
    if (!t || !t.some(function (o) { return ok(o.proj); })) return "";
    var h = '<table class="' + (relat ? "gr" : "fe-resumo fe-gran") + '"><thead><tr><th>Peneira</th><th>% pass. (média)</th><th>Projeto</th><th>± tol.</th>' +
      "<th>Faixa de trabalho</th><th></th></tr></thead><tbody>";
    t.forEach(function (o) {
      if (!ok(o.proj)) return;
      h += "<tr><td>" + esc(G.nomePeneira(o.mm)) + "</td><td><b>" + fmt(o.pass, 1) + "</b></td><td>" + fmt(o.proj, 1) + "</td><td>" +
        (ok(o.tol) ? fmt(o.tol, 0) : "—") + "</td><td>" + (o.lim ? fmt(o.lim.min, 1) + "–" + fmt(o.lim.max, 1) : "—") + "</td><td>" +
        (o.dentro === null ? "" : o.dentro ? (relat ? "ok" : '<span class="fe-ok">ok</span>') : (relat ? "FORA" : '<span class="fe-nok">fora</span>')) + "</td></tr>";
    });
    return h + "</tbody></table>";
  }
})();
