/*
 * Ficha: DNIT 162/2012-PRO — Determinação de deflexões com o deflectógrafo Lacroix (registro do levantamento).
 * Registra-se em window.FE (usa FE.aceitacao para critérios e parecer).
 *
 * O que a PRO manda (seções do PDF):
 *   5.1    caminhão de 2 eixos, entre-eixos 6 750 ± 100 mm, roda dupla traseira, pneus 1000 × 20 de 12 lonas com câmara a
 *          0,56 MPa, eixo com 8,2 tf simetricamente distribuídas (outra carga "quando julgado conveniente").
 *   5.2    viga sincronizada à velocidade de operação de 3,0 ± 0,5 km/h; medição do deslocamento com precisão ± 0,02 mm, 0 a 3 mm.
 *   6.2    calibração no início de cada jornada (DNIT 163/2012-PRO — ficha importável); temperatura da superfície ± 2 °C.
 *   6.3.2  alerta de erro do programa → nova calibração.
 *   7.1    por medição: distância (m), dM na trilha externa e interna (0,01 mm), Rc externo e interno (m), área A (mm²),
 *          temperatura do pavimento (°C).  7.2: relatório com dados gerais, dM, Rc, A, temperaturas no início e no fim
 *          do levantamento, condições e incidentes.
 * A PRO não define estatística nem limites para dM: a ficha mostra média, desvio-padrão (n − 1), mínimo e máximo por
 * trilha como informação (a análise do segmento é de outras normas).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var ID = "dnit-162-2012-pro";
  var SN = [["", "—"], ["sim", "Sim"], ["nao", "Não"]];
  var CAMPOS = [["dE", "dM — trilha externa (TRE)", "0,01 mm"], ["dI", "dM — trilha interna (TRI)", "0,01 mm"], ["rE", "Rc — trilha externa", "m"], ["rI", "Rc — trilha interna", "m"],
    ["aE", "Área A — trilha externa", "mm²"], ["aI", "Área A — trilha interna", "mm²"], ["t", "Temperatura do pavimento", "°C"]];

  function desvio(v) { var m = media(v); return v.length > 1 ? Math.sqrt(v.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0) / (v.length - 1)) : NaN; }
  function faixa(id, grupo, crit, secao, v, lo, hi, exig, casas, u, falha) {
    var x = num(v), l = A.linha({ id: id, grupo: grupo, criterio: crit, secao: secao, exigido: exig, resultado: ok(x) ? fmt(x, casas) + " " + u : "—", n: ok(x) ? 1 : 0 });
    if (!ok(x)) A.marcar(l, "pendente", "não informado");
    else if (x < lo - 1e-9 || x > hi + 1e-9) A.marcar(l, falha || "nao_conforme", "fora de " + exig);
    return l;
  }
  function resumo(vals) { return { n: vals.length, m: media(vals), s: desvio(vals), min: vals.length ? Math.min.apply(null, vals) : NaN, max: vals.length ? Math.max.apply(null, vals) : NaN }; }

  function calcular(d) {
    var P = d.params || {}, avisos = [], linhas = [];
    var G0 = "Calibração e equipamento (5 / 6.2)", G1 = "Medições (6.3 / 7.1)";
    var lc = A.linha({ id: "cal", grupo: G0, criterio: "Calibração no início da jornada (DNIT 163/2012-PRO)", secao: "6.2", exigido: "calibrado", resultado: P.calRef || (P.calOk === "sim" ? "sim" : P.calOk === "nao" ? "não" : "—"), n: 1 });
    if (P.calOk === "nao") A.marcar(lc, "nao_conforme", "calibração não aceita: não medir");
    else if (P.calOk !== "sim") A.marcar(lc, "pendente", "informe ou importe a calibração do dia");
    if (P.alerta === "sim" && P.recal !== "sim") A.marcar(lc, "nao_conforme", "houve alerta de erro do programa sem nova calibração (6.3.2)");
    linhas.push(lc);
    linhas.push(faixa("eixos", G0, "Distância entre eixos", "5.1", P.eixos, 6650, 6850, "6 750 ± 100 mm", 0, "mm"));
    linhas.push(faixa("press", G0, "Pressão dos pneus", "5.1", P.pressao, 0.555, 0.565, "0,56 MPa", 2, "MPa"));
    var lq = faixa("carga", G0, "Carga no eixo traseiro", "5.1", P.carga, 8.15, 8.25, "8,2 tf", 2, "tf", "ressalva");
    if (lq.situacao === "ressalva") lq.motivos[0].texto = lq.motivo = "carga diferente de 8,2 tf: admitida quando julgado conveniente — justificar (5.1)";
    linhas.push(lq);
    var lpn = A.linha({ id: "pneus", grupo: G0, criterio: "Pneus 1000 × 20, 12 lonas, com câmara; carga simétrica", secao: "5.1", exigido: "sim", resultado: P.pneus === "sim" ? "sim" : P.pneus === "nao" ? "não" : "—", n: 1 });
    if (P.pneus === "nao") A.marcar(lpn, "nao_conforme", "não atende"); else if (P.pneus !== "sim") A.marcar(lpn, "pendente", "não verificado");
    linhas.push(lpn);
    linhas.push(faixa("vel", G0, "Velocidade de operação", "5.2", P.vel, 2.5, 3.5, "3,0 ± 0,5 km/h", 1, "km/h"));

    var pts = (d.pt || []).map(function (c, i) {
      var o = { x: num(c.loc), rot: c.loc !== undefined && c.loc !== "" ? c.loc + " m" : "medição " + (i + 1) };
      CAMPOS.forEach(function (f) { o[f[0]] = num(c[f[0]]); });
      return o;
    }).filter(function (o) { return CAMPOS.some(function (f) { return ok(o[f[0]]); }); });
    var R = {};
    CAMPOS.forEach(function (f) { R[f[0]] = resumo(pts.map(function (o) { return o[f[0]]; }).filter(ok)); });
    var lm = A.linha({ id: "med", grupo: G1, criterio: "Medições com dM, Rc e A nas duas trilhas e temperatura", secao: "7.1 a–h", n: pts.length,
      exigido: "todos os dados de 7.1", resultado: pts.length + " medição(ões)" });
    if (!pts.length) A.marcar(lm, "sem_dados", "sem medições");
    var incompletas = pts.filter(function (o) { return !CAMPOS.every(function (f) { return ok(o[f[0]]); }) || !ok(o.x); });
    if (incompletas.length) A.marcar(lm, "ressalva", incompletas.length + " medição(ões) com dado de 7.1 faltando: " + incompletas.slice(0, 5).map(function (o) { return o.rot; }).join(", "));
    var neg = pts.filter(function (o) { return ["dE", "dI", "rE", "rI", "aE", "aI"].some(function (k) { return ok(o[k]) && o[k] <= 0; }); });
    if (neg.length) A.marcar(lm, "nao_conforme", "valores nulos ou negativos: " + neg.map(function (o) { return o.rot; }).join(", "));
    var acima = pts.filter(function (o) { return (ok(o.dE) && o.dE > 300) || (ok(o.dI) && o.dI > 300); });
    if (acima.length) A.marcar(lm, "ressalva", "dM acima de 300 (0,01 mm) — fora da faixa de 0 a 3 mm do sistema de medição (5.2 d): " + acima.map(function (o) { return o.rot; }).join(", "));
    var xs = pts.map(function (o) { return o.x; }).filter(ok);
    if (xs.some(function (x, i) { return i && x <= xs[i - 1]; })) A.marcar(lm, "ressalva", "distâncias fora de ordem crescente");
    linhas.push(lm);
    var ti = num(P.tIni), tf = num(P.tFim);
    var lt = A.linha({ id: "temp", grupo: G1, criterio: "Temperatura da superfície no início e no fim do levantamento", secao: "7.2 e", exigido: "registradas", resultado: (ok(ti) ? fmt(ti, 0) : "—") + " / " + (ok(tf) ? fmt(tf, 0) : "—") + " °C", n: ok(ti) && ok(tf) ? 1 : 0 });
    if (!ok(ti) || !ok(tf)) A.marcar(lt, "pendente", "registre as duas temperaturas");
    linhas.push(lt);
    var par = A.parecer(linhas, [], { textos: {
      ACEITO: { titulo: "LEVANTAMENTO VÁLIDO", texto: "Levantamento com o deflectógrafo Lacroix conforme a DNIT 162/2012-PRO." },
      RESSALVA: { titulo: "LEVANTAMENTO VÁLIDO COM RESSALVA", texto: "Dados utilizáveis; há condições a registrar no relatório (7.2 f)." },
      PENDENTE: { titulo: "LEVANTAMENTO COM REGISTROS INCOMPLETOS", texto: "Faltam registros exigidos pela PRO." },
      REJEITADO: { titulo: "LEVANTAMENTO NÃO CONFORME", texto: "Equipamento fora das condições da PRO ou sem calibração válida: refazer." } } });
    return { tab: {}, resultados: { linhas: linhas, parecer: par, R: R, pts: pts }, avisos: avisos };
  }

  function htmlResumo(r, relat) {
    return '<table class="' + (relat ? "gr" : "fe-resumo") + '"><thead><tr><th style="text-align:left">Grandeza (7.1)</th><th>n</th><th>Média</th><th>Desvio (n − 1)</th><th>Mín.</th><th>Máx.</th></tr></thead><tbody>' +
      CAMPOS.map(function (f) {
        var x = r.R[f[0]], c = f[2] === "0,01 mm" || f[2] === "°C" ? 1 : 0;
        return '<tr><td style="text-align:left">' + esc(f[1]) + " (" + f[2] + ")</td><td>" + x.n + "</td><td>" + fmt(x.m, c) + "</td><td>" + fmt(x.s, c + 1) + "</td><td>" + fmt(x.min, 0) + "</td><td>" + fmt(x.max, 0) + "</td></tr>";
      }).join("") + "</tbody></table>";
  }
  function graficos(calc, d, opt) {
    var r = calc.resultados, out = [];
    var sE = r.pts.filter(function (o) { return ok(o.x) && ok(o.dE); }).map(function (o) { return { x: o.x, y: o.dE }; });
    var sI = r.pts.filter(function (o) { return ok(o.x) && ok(o.dI); }).map(function (o) { return { x: o.x, y: o.dI }; });
    if (sE.length) out.push(A.grafico("dM na trilha externa (0,01 mm) × distância (m)", sE, [{ y: r.R.dE.m, tipo: "med", txt: "média " + fmt(r.R.dE.m, 1) }], opt));
    if (sI.length) out.push(A.grafico("dM na trilha interna (0,01 mm) × distância (m)", sI, [{ y: r.R.dI.m, tipo: "med", txt: "média " + fmt(r.R.dI.m, 1) }], opt));
    return out.filter(Boolean);
  }

  function colunas(rows) { return rows.map(function (x) { return { loc: x[0], dE: x[1], dI: x[2], rE: x[3], rI: x[4], aE: x[5], aI: x[6], t: x[7] }; }); }

  FE.FICHAS[ID] = {
    titulo: "Deflexões com o deflectógrafo Lacroix",
    lote: true,
    resumo: "Registro do levantamento: calibração do dia (DNIT 163-PRO), condições do caminhão (6 750 ± 100 mm, 0,56 MPa, 8,2 tf) e da velocidade (3,0 ± 0,5 km/h), dados de cada medição (dM, Rc e área nas duas trilhas, temperatura — 7.1) e resumo por trilha.",
    rotuloImportar: function (r) { return r.R && r.R.dE.n ? "dM TRE médio " + fmt(r.R.dE.m, 1) + " · TRI " + fmt(r.R.dI.m, 1) + " (0,01 mm)" : "—"; },
    blocos: [],
    params: [
      { k: "impCal", r: "Calibração do dia: importar da DNIT 163/2012-PRO", tipo: "importar", de: "dnit-163-2012-pro",
        aplicar: function (e, P) {
          var r = e.resultados || {}, i = (e.dados || {}).ident || {}, cod = (r.parecer || {}).parecer;
          P.calOk = cod === "ACEITO" || cod === "RESSALVA" ? "sim" : cod === "REJEITADO" ? "nao" : "";
          P.calRef = (i.registro || "calibração") + (i.data ? " — " + A.dataBR(i.data) : "") + " — " + ((r.parecer || {}).titulo || "");
        } },
      { k: "calOk", r: "Calibração do dia aceita (6.2)?", tipo: "select", opcoes: SN },
      { k: "calRef", r: "Referência da calibração" },
      { k: "alerta", r: "Houve alerta de erro do programa durante o levantamento (6.3.2)?", tipo: "select", recarrega: true, opcoes: [["nao", "Não"], ["sim", "Sim"]] },
      { k: "recal", r: "Nova calibração feita após o alerta?", tipo: "select", opcoes: SN, se: function (d) { return (d.params || {}).alerta === "sim"; } },
      { k: "equip", r: "Equipamento / programa", ph: "Deflectógrafo A — Deflectographe 98" },
      { k: "eixos", r: "Distância entre eixos (mm) (5.1)", ph: "6750" },
      { k: "pressao", r: "Pressão dos pneus (MPa) (5.1)", ph: "0,56" },
      { k: "carga", r: "Carga no eixo traseiro (tf) (5.1)", ph: "8,2" },
      { k: "pneus", r: "Pneus 1000 × 20, 12 lonas, com câmara; carga simétrica (5.1)?", tipo: "select", opcoes: SN },
      { k: "vel", r: "Velocidade de operação (km/h) (5.2)", ph: "3,0" },
      { k: "faixa", r: "Pista / faixa / sentido" },
      { k: "tIni", r: "Temperatura do pavimento no início (°C) (7.2 e)" },
      { k: "tFim", r: "Temperatura do pavimento no fim (°C) (7.2 e)" },
    ],
    padrao: { alerta: "nao" },
    tabelas: function () {
      return [{ chave: "pt", titulo: "Medições (7.1)", rotulo: "Medição", iniciais: 6, min: 1, dica: "dados fornecidos pela central de computação a cada ciclo de medição",
        linhas: [{ k: "loc", r: "Distância ao início do ensaio", u: "m" }].concat(CAMPOS.map(function (f) { return { k: f[0], r: f[1], u: f[2] }; })) }];
    },
    calcular: calcular,
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return A.htmlParecer(r.parecer) + '<h4 style="margin:12px 0 4px">Resumo por trilha (informativo)</h4>' + htmlResumo(r) + '<h4 style="margin:12px 0 4px">Verificações</h4>' + A.htmlCriterios(r.linhas, { estilo: "resultado" });
    },
    graficos: graficos,
    relatorio: {
      notas: "DNIT 162/2012-PRO: dM em 0,01 mm, Rc em m e área A em mm² fornecidos pelo equipamento para as trilhas externa e interna (7.1). Média, desvio e extremos por trilha são informativos (a PRO não os define).",
      resultados: function (calc, d) {
        var r = calc.resultados;
        return [["Parecer", r.parecer.titulo], ["Medições", String(r.pts.length)], ["dM TRE — média / máx.", fmt(r.R.dE.m, 1) + " / " + fmt(r.R.dE.max, 0) + " (0,01 mm)"],
          ["dM TRI — média / máx.", fmt(r.R.dI.m, 1) + " / " + fmt(r.R.dI.max, 0) + " (0,01 mm)"]];
      },
      extraHtml: function (calc) { var r = calc.resultados; return A.htmlParecer(r.parecer, { relat: true }) + "<h2>Resumo por trilha</h2>" + htmlResumo(r, true) + A.htmlCriterios(r.linhas, { relat: true, estilo: "resultado" }); },
    },
    exemplos: [
      { nome: "Exemplo de apresentação da seção 7.1 (6 medições)", dados: function () {
        return { ident: { registro: "LX-01", data: "2026-08-17", obra: "Obra A", trecho: "BR-000 — km 10" },
          params: { calOk: "sim", calRef: "CAL-LX-01 — 17/08/2026", alerta: "nao", equip: "Deflectógrafo A — Deflectographe 98", eixos: "6750", pressao: "0,56", carga: "8,2", pneus: "sim", vel: "3,0",
            faixa: "pista simples, faixa direita, sentido crescente", tIni: "50", tFim: "52" },
          pt: colunas([["0,0", "22", "14", "285", "660", "95", "57", "50"], ["4,7", "33", "22", "254", "278", "131", "90", "53"], ["9,4", "25", "29", "173", "412", "99", "146", "53"],
            ["14,1", "29", "23", "332", "388", "128", "95", "53"], ["39,6", "27", "28", "405", "284", "134", "134", "52"], ["44,3", "28", "28", "251", "268", "118", "123", "53"]]) };
      } },
      { nome: "Levantamento com alerta de erro sem recalibração, velocidade alta e carga de 10 tf", dados: function () {
        return { ident: { registro: "LX-02", data: "2026-08-19", obra: "Obra A", trecho: "BR-000 — km 22" },
          params: { calOk: "sim", calRef: "CAL-LX-03 — 19/08/2026", alerta: "sim", recal: "nao", eixos: "6760", pressao: "0,56", carga: "10", pneus: "sim", vel: "4,2", tIni: "38" },
          pt: colunas([["0,0", "41", "35", "190", "240", "160", "140", "38"], ["4,8", "46", "", "172", "", "171", "", "39"], ["9,5", "39", "37", "205", "226", "152", "146", "39"]]) };
      } },
    ],
  };
})();
