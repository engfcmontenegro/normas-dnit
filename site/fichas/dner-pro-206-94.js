/*
 * Ficha: DNER-PRO 206/94 — Avaliação da resistência do concreto por ensaio de luva expansível.
 * Áreas de ensaio (6.1: ≥ 15 cm de cantos e arestas, > 169 cm², ≥ 5 cm entre áreas, ≥ 2 por peça; ≥ 4 em peças de
 * grande volume), índice de fratura por peça = média das áreas, desprezando os individuais afastados mais de ± 25 %
 * da média (7.1 e 7.2); corpos de prova (6.3.3 e 7.3); aferição semestral (5.3); correlação com a resistência (7.6,
 * Anexo A-4.2) pela curva da DNER-PRO 179 (E = t·Sd ≤ 4 N/mm²). Registra-se em window.FE (usa FE.correlacaoConcreto).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var C = FE.correlacaoConcreto;  // definido na ficha da DNER-PRO 179/94 (carregada antes)

  function modoCP(P) { return P.local === "cp"; }
  function comCorr(P) { return P.corr === "pares" || P.corr === "coef"; }
  // diferença em dias entre duas datas "aaaa-mm-dd"
  function dias(a, b) {
    var da = Date.parse(a), db = Date.parse(b);
    return ok(da) && ok(db) ? (db - da) / 86400000 : NaN;
  }

  FE.FICHAS["dner-pro-206-94"] = {
    titulo: "Concreto — Resistência pelo ensaio de luva expansível",
    rotuloImportar: function (r) { return "IF " + (r.grupos || []).map(function (g) { return g.nome + " " + fmt(g.media, 1); }).join("; ") + " " + (r.unid || ""); },
    resumo: "Índice de fratura de cada peça = média dos índices das áreas de ensaio, desprezando os individuais afastados mais de ± 25 % da média (7.1 e 7.2); verificação das áreas (6.1), da aferição (5.3) e da idade (Anexo B-2); resistência estimada só com correlação confiável (A-4.2 e 7.6).",
    blocos: [],
    params: [
      { k: "parte", r: "Parte da estrutura em estudo (7.5)", ph: "ex.: pilares do pavimento térreo" },
      { k: "local", r: "Ensaio em", tipo: "select", recarrega: true,
        opcoes: [["estrutura", "Estrutura — áreas de ensaio (6.1)"], ["cp", "Corpos de prova ≥ 30 × 30 × 6 cm (6.3.3 e 7.3)"]] },
      { k: "grande", r: "Peças com grandes volumes de concreto (6.1.5)", tipo: "select",
        opcoes: [["nao", "Não — mínimo de 2 áreas por peça (6.1.4)"], ["sim", "Sim — recomendável ≥ 4 áreas, duas a duas em faces opostas"]],
        se: function (d) { return !modoCP(d.params || {}); } },
      { k: "unid", r: "Unidade do índice de fratura (4.2)", tipo: "select", opcoes: [["N·m", "N·m"], ["MPa", "MPa"], ["N", "N"]] },
      { k: "equip", r: "Equipamento (marca / nº de série)" },
      { k: "aferido", r: "Data da última aferição (5.3)", tipo: "date", dica: "aferir de 6 em 6 meses e após cada manutenção" },
      { k: "manut", r: "Houve manutenção (troca de luva/parafuso) após a última aferição? (5.2 e 5.3)", tipo: "select", opcoes: [["nao", "Não"], ["sim", "Sim"]] },
      { k: "orificio", r: "Orifício (6.3)", tipo: "select", opcoes: [["broqueado", "Broqueado no concreto endurecido"], ["moldado", "Moldado no concreto"]] },
      { k: "idade", r: "Idade do concreto (dias)", dica: "correlações não valem automaticamente abaixo de 7 dias; recomenda-se correlação a 28 dias (B-2)" },
      { k: "agregado", r: "Agregado graúdo do concreto", ph: "ex.: brita granítica", dica: "o tipo de agregado altera o índice (B-1)" },
      { k: "corr", r: "Avaliação da resistência à compressão (A-4.2 e 7.6)", tipo: "select", recarrega: true,
        opcoes: [["nao", "Não — só índice de fratura (comparação relativa, A-4.1)"], ["pares", "Correlação ajustada agora — pares CP × índice"], ["coef", "Correlação já estabelecida — informar a, b e E"]] },
      { k: "curva", r: "Forma da curva", tipo: "select", opcoes: function () { return C.CURVAS; }, se: function (d) { return comCorr(d.params || {}); } },
      { k: "ca", r: "Coeficiente a", se: function (d) { return (d.params || {}).corr === "coef"; } },
      { k: "cb", r: "Coeficiente b", se: function (d) { return (d.params || {}).corr === "coef"; } },
      { k: "cE", r: "E = t·Sd da correlação (N/mm²)", dica: "critério da DNER-PRO 179 (5.2): ≤ 4 N/mm²", se: function (d) { return (d.params || {}).corr === "coef"; } },
      { k: "cOrigem", r: "Como a correlação foi obtida (7.6)", ph: "ex.: 12 pares, mesmos materiais, 28 dias", se: function (d) { return comCorr(d.params || {}); } },
      { k: "critico", r: "Índice de fratura crítico / referencial (A-4.1) — opcional", dica: "ex.: para remoção de formas ou manuseio de pré-moldados" },
    ],
    padrao: { local: "estrutura", grande: "nao", unid: "N·m", manut: "nao", orificio: "broqueado", corr: "nao", curva: "linear" },
    tabelas: function (d) {
      var P = d.params || {}, u = P.unid || "N·m", tabs = [];
      if (modoCP(P)) {
        tabs.push({ chave: "cps", titulo: "Corpos de prova (6.3.3 e 7.3)", rotulo: "CP", iniciais: 2, min: 1,
          dica: "ponto de ensaio no centro da face; cura conforme a ABNT MB-2 (NBR 5738)",
          linhas: [
            { k: "nome", r: "Identificação do CP", texto: true },
            { k: "c1", r: "Dimensão 1", u: "cm", ph: "≥ 30" }, { k: "c2", r: "Dimensão 2", u: "cm", ph: "≥ 30" }, { k: "e", r: "Espessura", u: "cm", ph: "≥ 6" },
            { k: "sup", r: "Índice de fratura — face superior", u: u },
            { k: "inf", r: "Índice de fratura — face inferior", u: u },
            { calc: "IF", r: "Índice de fratura do CP (média das faces, 7.3)", u: u, casas: 1, destaque: true },
            { calc: "fc", r: "Resistência estimada pela correlação", u: "MPa", casas: 1 },
          ] });
      } else {
        tabs.push({ chave: "areas", titulo: "Áreas de ensaio (6.1 e 6.4)", rotulo: "Área", iniciais: 4, min: 1,
          dica: "uma coluna por área; repita o nome da peça nas áreas da mesma peça — a média e o critério de ± 25 % são por peça",
          linhas: [
            { k: "peca", r: "Peça / elemento", texto: true },
            { k: "pos", r: "Posição da área (croqui, 7.5)", texto: true },
            { k: "canto", r: "Distância a cantos e arestas", u: "cm", ph: "≥ 15" },
            { k: "la", r: "Lado a da área", u: "cm" }, { k: "lb", r: "Lado b da área", u: "cm" },
            { k: "viz", r: "Distância à área de ensaio mais próxima", u: "cm", ph: "≥ 5" },
            { k: "IF", r: "Índice de fratura individual (6.4)", u: u },
            { calc: "area", r: "Área de ensaio a × b", u: "cm²", casas: 0 },
            { calc: "desv", r: "Afastamento da média da peça", u: "%", casas: 1 },
            { calc: "usado", r: "Usado na média (1 = sim, 0 = desprezado, 7.2)", u: "", casas: 0 },
          ] });
      }
      if (P.corr === "pares") tabs.push({ chave: "cor", titulo: "Correlação índice de fratura × resistência (7.6)", rotulo: "Par", iniciais: 6, min: 3,
        dica: "correlação empírica com os materiais em questão, de preferência aos 28 dias (A-3, A-4.2 e B-2)",
        linhas: [{ k: "x", r: "Índice de fratura", u: u }, { k: "fc", r: "Resistência à compressão do CP", u: "MPa" },
          { calc: "fcAj", r: "fc pela curva", u: "MPa", casas: 1 }, { calc: "res", r: "Resíduo", u: "MPa", casas: 2 }] });
      return tabs;
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], u = P.unid || "N·m", tab = {};
      // aferição (5.3)
      var dAf = dias(P.aferido, (d.ident || {}).data);
      if (ok(dAf) && dAf > 183) avisos.push("Última aferição há " + fmt(dAf, 0) + " dias — o equipamento deve ser aferido de seis em seis meses (5.3).");
      if (ok(dAf) && dAf < 0) avisos.push("Data de aferição posterior à data do ensaio — confira.");
      if (!P.aferido) avisos.push("Informe a data da última aferição do equipamento (5.3: semestral, com certificado).");
      if (P.manut === "sim") avisos.push("Houve manutenção após a última aferição: o equipamento deve ser aferido em seguida a cada manutenção (5.3).");
      var idade = num(P.idade);
      if (ok(idade) && idade < 7) avisos.push("Concreto com " + fmt(idade, 0) + " dias: as correlações não são automaticamente válidas abaixo de 7 dias; considere fatores específicos (B-2).");
      // correlação
      var curva = null;
      if (P.corr === "pares") {
        var xs = (d.cor || []).map(function (x) { return num(x.x); }), ys = (d.cor || []).map(function (x) { return num(x.fc); });
        curva = C.ajustar(xs, ys, P.curva || "linear");
        tab.cor = (d.cor || []).map(function (x) {
          var o = {}, xv = num(x.x), yv = num(x.fc);
          if (curva && ok(xv)) { o.fcAj = curva.f(xv); if (ok(yv)) o.res = yv - o.fcAj; }
          return o;
        });
        if (!curva) avisos.push("A correlação precisa de pelo menos 3 pares completos.");
      } else if (P.corr === "coef") {
        var a = num(P.ca), b = num(P.cb);
        if (ok(a) && ok(b)) curva = { tipo: P.curva || "linear", a: a, b: b, f: C.fCurva(P.curva || "linear", a, b), E: num(P.cE), informada: true };
        else avisos.push("Informe os coeficientes a e b da correlação.");
      }
      var curvaOk = !!(curva && ok(curva.E) && curva.E <= C.EMAX + 1e-9);
      if (comCorr(P) && curva && !curvaOk) avisos.push("Correlação sem confiabilidade demonstrada (E = t·Sd " + (ok(curva.E) ? "= " + fmt(curva.E, 2) + " N/mm² > 4" : "não informado") +
        ", critério da DNER-PRO 179, 5.2): não se recomenda avaliar diretamente a resistência à compressão (A-4.2).");
      if (comCorr(P) && !P.cOrigem) avisos.push("Descreva como a correlação foi obtida — a apresentação dos resultados deve conter as correlações e sua obtenção (7.6).");
      function fcDe(v) { return curvaOk && ok(v) ? curva.f(v) : NaN; }

      var grupos = [];
      if (modoCP(P)) {
        tab.cps = (d.cps || []).map(function (x, i) {
          var o = {}, rot = "CP " + (x.nome || i + 1), s = num(x.sup), f = num(x.inf);
          ["c1", "c2"].forEach(function (k) { var v = num(x[k]); if (ok(v) && v < 30) avisos.push(rot + ": dimensão de " + fmt(v, 1) + " cm — mínimo 30 × 30 × 6 cm (6.3.3)."); });
          if (ok(num(x.e)) && num(x.e) < 6) avisos.push(rot + ": espessura de " + fmt(num(x.e), 1) + " cm — mínimo 6 cm (6.3.3).");
          if (ok(s) !== ok(f)) avisos.push(rot + ": o índice do CP é a média das faces superior e inferior (7.3) — falta uma das faces.");
          o.IF = media([s, f]);
          o.fc = fcDe(o.IF);
          if (ok(o.IF)) grupos.push({ nome: x.nome || "CP " + (i + 1), media: o.IF, n: [s, f].filter(ok).length, indiv: [s, f].filter(ok), desprez: [], fc: o.fc });
          return o;
        });
      } else {
        var areas = d.areas || [], ordem = [], G = {};
        tab.areas = areas.map(function (x, i) {
          var o = {}, rot = "Área " + (i + 1) + (x.peca ? " (" + x.peca + ")" : "");
          var canto = num(x.canto), la = num(x.la), lb = num(x.lb), viz = num(x.viz);
          if (ok(canto) && canto < 15) avisos.push(rot + ": a " + fmt(canto, 1) + " cm de canto/aresta — mínimo 15 cm (6.1.2).");
          o.area = ok(la) && ok(lb) ? la * lb : NaN;
          if (ok(o.area) && o.area <= 169) avisos.push(rot + ": área de " + fmt(o.area, 0) + " cm² — deve ser superior a 169 cm² (13 cm × 13 cm) (6.1.3).");
          if (ok(viz) && viz < 5) avisos.push(rot + ": a " + fmt(viz, 1) + " cm da área vizinha — distância mínima de 5 cm (6.1.6).");
          var nome = String(x.peca || "").trim() || "Peça sem nome";
          if (ok(num(x.IF))) {
            if (!G[nome]) { G[nome] = []; ordem.push(nome); }
            G[nome].push({ i: i, v: num(x.IF) });
          }
          return o;
        });
        ordem.forEach(function (nome) {
          var L = G[nome], m0 = media(L.map(function (a) { return a.v; }));
          var usados = [], desp = [];
          L.forEach(function (a) {
            var dv = (a.v - m0) / m0 * 100;
            tab.areas[a.i].desv = dv;
            if (Math.abs(dv) > 25 + 1e-9) { desp.push(a.v); tab.areas[a.i].usado = 0; } else { usados.push(a.v); tab.areas[a.i].usado = 1; }
          });
          var m1 = media(usados);
          var min = P.grande === "sim" ? 4 : 2;
          if (L.length < min) avisos.push(nome + ": " + L.length + " área(s) de ensaio — " + (min === 4 ? "recomendável pelo menos quatro em peças de grande volume (6.1.5)" : "pelo menos duas por peça (6.1.4)") + ".");
          if (desp.length) avisos.push(nome + ": " + desp.length + " índice(s) individual(is) afastado(s) mais de ± 25 % da média (" + fmt(m0, 1) + " " + u + ") desprezado(s) (7.2): " + desp.map(function (v) { return fmt(v, 1); }).join("; ") + ".");
          if (usados.length < 2 && L.length >= 2) avisos.push(nome + ": restou " + usados.length + " índice válido após o critério de ± 25 % — o índice é a média de dois valores individuais (7.1): ensaie novas áreas.");
          grupos.push({ nome: nome, media: m1, mediaIni: m0, n: usados.length, nTot: L.length, indiv: L.map(function (a) { return a.v; }), desprez: desp, fc: fcDe(m1) });
        });
      }
      var crit = num(P.critico);
      grupos.forEach(function (g) { g.atendeCrit = ok(crit) && ok(g.media) ? g.media >= crit : null; });
      var abaixo = grupos.filter(function (g) { return g.atendeCrit === false; });
      if (abaixo.length) avisos.push("Abaixo do índice de fratura crítico de " + fmt(crit, 1) + " " + u + ": " + abaixo.map(function (g) { return g.nome + " (" + fmt(g.media, 1) + ")"; }).join("; ") + " (A-4.1).");
      var vals = grupos.map(function (g) { return g.media; }).filter(ok);
      return { tab: tab, resultados: { grupos: grupos, unid: u, n: vals.length, min: vals.length ? Math.min.apply(null, vals) : NaN, media: media(vals),
        curva: curva ? { tipo: curva.tipo, a: curva.a, b: curva.b, n: curva.n, Sd: curva.Sd, t: curva.t, E: curva.E, r2: curva.r2, informada: !!curva.informada } : null,
        curvaOk: curvaOk, critico: crit, diasAfericao: dAf }, avisos: avisos };
    },
    resultadosHtml: function (calc, d) {
      var r = calc.resultados, P = d.params || {};
      function cx(v, rot, p) { return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var h = '<div class="fe-res">' + cx(fmt(r.min, 1) + " <small>" + esc(r.unid) + "</small>", "Menor índice de fratura entre " + r.n + (modoCP(P) ? " CP(s)" : " peça(s)")) +
        cx(fmt(r.media, 1) + " <small>" + esc(r.unid) + "</small>", "Média geral") +
        (r.curva ? cx(ok(r.curva.E) ? fmt(r.curva.E, 2) + " N/mm²" : "—", "E = t·Sd da correlação · " + (r.curvaOk ? '<span class="fe-ok">utilizável</span>' : '<span class="fe-nok">não confiável</span>'), true) : "") +
        cx(ok(r.diasAfericao) ? fmt(r.diasAfericao, 0) + " dias" : "—", "Desde a última aferição (≤ 6 meses, 5.3)", true) + "</div>";
      if (r.grupos.length) h += '<table class="fe-resumo"><tr><th>' + (modoCP(P) ? "CP" : "Peça") + "</th><th>Índices individuais</th><th>Desprezados (± 25 %)</th><th>Índice de fratura (" + esc(r.unid) + ")</th>" +
        (r.curvaOk ? "<th>fc estimado (MPa)</th>" : "") + (ok(r.critico) ? "<th>≥ crítico</th>" : "") + "</tr>" +
        r.grupos.map(function (g) {
          return "<tr><td>" + esc(g.nome) + "</td><td>" + g.indiv.map(function (v) { return fmt(v, 1); }).join("; ") + "</td><td>" + (g.desprez.length ? g.desprez.map(function (v) { return fmt(v, 1); }).join("; ") : "—") +
            "</td><td><b>" + fmt(g.media, 1) + "</b></td>" + (r.curvaOk ? "<td>" + fmt(g.fc, 1) + "</td>" : "") +
            (ok(r.critico) ? "<td>" + (g.atendeCrit ? '<span class="fe-ok">sim</span>' : '<span class="fe-nok">não</span>') + "</td>" : "") + "</tr>";
        }).join("") + "</table>";
      if (r.curva) h += '<p class="fe-res-r" style="margin-top:6px">Correlação: ' + esc(C.textoCurva(r.curva)) + (r.curva.informada ? " (informada)" : " · n = " + r.curva.n + " · Sd = " + fmt(r.curva.Sd, 2) + " MPa · t = " + fmt(r.curva.t, 3) + " · R² = " + fmt(r.curva.r2, 3)) + "</p>";
      return h;
    },
    relatorio: {
      notas: "Índice de fratura: esforço para provocar fratura interna próxima à superfície (≈ 2 cm) pela expansão da luva (4.2 e A-2). Por peça: média aritmética dos índices das áreas de ensaio (7.1); índice individual afastado mais de ± 25 % da média é desprezado (7.2) e a média é refeita com os restantes. Em corpos de prova, média das faces superior e inferior (7.3). Áreas: ≥ 15 cm de cantos e arestas, > 169 cm², ≥ 5 cm entre áreas, ≥ 2 por peça (≥ 4 em grandes volumes) (6.1). Aferição semestral e após manutenção (5.3). O ensaio é complementar (A-1); só se avalia a resistência à compressão com correlação confiável obtida com os materiais em questão (A-4.2), aqui verificada pelo critério E = t·Sd ≤ 4 N/mm² da DNER-PRO 179 (5.2), à qual a norma remete (3.1 e).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.parte) rows.push(["Parte da estrutura", P.parte]);
        r.grupos.forEach(function (g) {
          rows.push([(modoCP(P) ? "CP " : "Peça ") + g.nome, "índices " + g.indiv.map(function (v) { return fmt(v, 1); }).join("; ") + " " + r.unid +
            (g.desprez.length ? " (desprezados: " + g.desprez.map(function (v) { return fmt(v, 1); }).join("; ") + ")" : "") + " — média " + fmt(g.media, 1) + " " + r.unid +
            (r.curvaOk ? " — fc estimado " + fmt(g.fc, 1) + " MPa" : "") + (g.atendeCrit === false ? " — ABAIXO do crítico" : "")]);
        });
        if (r.curva) rows.push(["Correlação (7.6)", C.textoCurva(r.curva) + (P.cOrigem ? " — " + P.cOrigem : "") + " — E = " + fmt(r.curva.E, 2) + " N/mm² (" + (r.curvaOk ? "≤ 4: utilizável" : "não confiável") + ")"]);
        rows.push(["Aferição do equipamento", P.aferido ? P.aferido.split("-").reverse().join("/") + (ok(r.diasAfericao) ? " (" + fmt(r.diasAfericao, 0) + " dias antes do ensaio)" : "") : "não informada"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Pilares — 3 peças, 2 a 3 áreas cada, com correlação de 8 pares", dados: function () {
        return { ident: { registro: "EX-LE-001", obra: "Obra A", local: "Pilares P1 a P3", data: "2025-08-20" },
          params: { parte: "Pilares do pavimento térreo", local: "estrutura", grande: "nao", unid: "N·m", equip: "Equipamento de luva nº 01", aferido: "2025-04-10", manut: "nao",
            orificio: "broqueado", idade: "35", agregado: "Brita granítica", corr: "pares", curva: "linear", cOrigem: "8 pares, mesmos materiais, 28 dias" },
          areas: [["P1", "face norte, h = 1,0 m", "20", "15", "15", "12", "11,8"], ["P1", "face sul, h = 1,2 m", "22", "15", "15", "12", "12,6"],
            ["P2", "face leste, h = 1,0 m", "18", "14", "14", "10", "10,9"], ["P2", "face oeste, h = 1,1 m", "18", "14", "14", "10", "11,5"], ["P2", "face norte, h = 1,5 m", "20", "14", "14", "10", "11,1"],
            ["P3", "face norte, h = 1,0 m", "25", "15", "15", "15", "13,0"], ["P3", "face sul, h = 1,0 m", "25", "15", "15", "15", "12,4"]].map(function (a) {
            return { peca: a[0], pos: a[1], canto: a[2], la: a[3], lb: a[4], viz: a[5], IF: a[6] };
          }),
          cor: [["8,0", "18,2"], ["9,1", "21,0"], ["10,0", "23,5"], ["10,8", "25,1"], ["11,9", "28,3"], ["12,7", "30,0"], ["13,6", "32,6"], ["14,5", "34,4"]].map(function (p) { return { x: p[0], fc: p[1] }; }) };
      } },
      { nome: "Laje — áreas fora das distâncias, índice desprezado e aferição vencida", dados: function () {
        return { ident: { registro: "EX-LE-002", obra: "Obra B", local: "Laje L2", data: "2025-11-05" },
          params: { parte: "Laje L2 — painel central", local: "estrutura", grande: "nao", unid: "N·m", aferido: "2025-01-15", manut: "sim", orificio: "broqueado", idade: "5", corr: "nao", critico: "9" },
          areas: [["L2", "canto A", "10", "12", "12", "3", "7,9"], ["L2", "centro", "40", "14", "14", "3", "8,4"], ["L2", "borda B", "16", "14", "14", "8", "12,9"]].map(function (a) {
            return { peca: a[0], pos: a[1], canto: a[2], la: a[3], lb: a[4], viz: a[5], IF: a[6] };
          }) };
      } },
    ],
  };
})();
