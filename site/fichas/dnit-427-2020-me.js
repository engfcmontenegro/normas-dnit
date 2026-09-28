/*
 * Ficha: DNIT 427/2020-ME — Misturas asfálticas — Densidade relativa máxima medida (Gmm) e massa específica
 * máxima medida (MEmm) em amostras não compactadas (método Rice).
 * Registra-se no motor de site/fichas.js (window.FE).
 *
 * Campos de calcular(d).resultados (gravados junto com o ensaio salvo; use-os em outras fichas por um parâmetro
 * {tipo: "importar", de: "dnit-427-2020-me", aplicar: function (e, P) { ... e.resultados.gmm ... }}):
 *   resultados.gmm        Gmm — média das amostras (adimensional; relatar com 3 casas, 9 a)
 *   resultados.memm       MEmm — média das amostras (g/cm³; 3 casas)
 *   resultados.n          número de amostras (determinações) consideradas
 *   resultados.desvioMax  maior |Gmm da amostra − média| (limite ± 0,020, seção 8)
 *   resultados.conforme   true/false quando há ≥ 3 amostras (todas dentro de ± 0,020 da média), senão null
 *   resultados.secao6     true se foi usada a correção de absorção (seção 6)
 *   resultados.amostras[] {nome, partes, massa, gmm, memm, desvio}  — uma por amostra (partes somadas, NOTA 2)
 *   resultados.dets[]     {amostra, A, vol, gmm, rhoW, memm}         — uma por coluna (determinação/parte)
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  var RHO_25 = 0.9971;  // massa específica da água a 25 °C adotada pela norma (eq. 2 e NOTA 3)
  // massa específica da água (g/cm³) para temperaturas fora de 25 ± 1 °C (NOTA 3)
  var AGUA = [[20, 0.99821], [21, 0.99799], [22, 0.99777], [23, 0.99754], [24, 0.99730], [25, 0.99705],
    [26, 0.99679], [27, 0.99652], [28, 0.99624], [29, 0.99595], [30, 0.99565]];
  function rhoAgua(t) {
    if (!ok(t) || Math.abs(t - 25) <= 1) return RHO_25;
    return FE.interpolar(AGUA, t);  // NaN fora de 20–30 °C
  }
  // Tabela 1 — massa mínima de amostra (g) pelo tamanho máximo nominal do agregado
  var TAB1 = [["38", "38 mm ou maior", 5000], ["19", "19 mm a 25 mm", 2500], ["12,5", "12,5 mm", 1500]];
  var TOL = 0.020;  // seção 8: cada determinação não deve divergir ± 0,020 da média

  FE.FICHAS["dnit-427-2020-me"] = {
    titulo: "Misturas asfálticas — Densidade relativa máxima medida (Gmm, método Rice)",
    // resumo mostrado no seletor de importação de outras fichas (ex.: DNIT 428)
    rotuloImportar: function (r) { return "Gmm " + FE.fmt(r.gmm, 3) + (FE.ok(r.memm) ? " · MEmm " + FE.fmt(r.memm, 3) + " g/cm³" : ""); },
    resumo: "Gmm = A / (A + B − C) (eq. 1) e MEmm = 0,9971 × Gmm (eq. 2) em mistura solta sob vácuo; resultado: média de no mínimo três amostras, cada uma a no máximo ± 0,020 da média; três casas decimais.",
    blocos: [],
    params: [
      { k: "mistura", r: "Tipo de mistura (9 b)", ph: "ex.: CBUQ faixa C, CAP 50/70, 5,0 %" },
      { k: "origemAm", r: "Obtenção da amostra (4.1)", tipo: "select",
        opcoes: [["lab", "Preparada em laboratório — 2 h em estufa na temperatura de compactação (4.1 a)"],
          ["campo", "Extraída de corpo de prova de campo — aquecida a (105 ± 5) °C e desagregada (4.1 b)"],
          ["usina", "Coletada após usinagem ou no transporte (4.1 c)"]] },
      { k: "recipiente", r: "Tipo de recipiente (3.2)", tipo: "select",
        opcoes: [["kitasato", "Frasco de vidro tipo Kitasato"], ["metalico", "Frasco metálico"], ["pmma", "Recipiente de PMMA transparente"]] },
      { k: "volFrasco", r: "Capacidade do recipiente (ml) — opcional", ph: "4000",
        dica: "mínimo 4.000 ml (3.2); amostra com volume maior que 2/3 do frasco deve ser ensaiada em partes (4.2)" },
      { k: "tnm", r: "Tamanho máximo nominal do agregado (Tabela 1)", tipo: "select",
        opcoes: [["", "—"]].concat(TAB1.map(function (t) { return [t[0], t[1] + " — mínimo " + t[2].toLocaleString("pt-BR") + " g"]; })) },
      { k: "agitacao", r: "Agitação durante o vácuo", tipo: "select",
        opcoes: [["mecanica", "Agitador mecânico (5 d)"], ["manual", "Manual, vigorosa, a cada 2 min (NOTA 1)"]] },
      { k: "secao6", r: "Agregados porosos — verificação de absorção de água (seção 6)", tipo: "select", recarrega: true,
        opcoes: [["nao", "Não aplicada"], ["sim", "Aplicada — massa com superfície seca após o ensaio"]],
        dica: "a massa com superfície seca (perda < 0,05 % em 15 min) entra no lugar de A no volume (ver notas)" },
    ],
    padrao: { origemAm: "lab", recipiente: "kitasato", agitacao: "mecanica", secao6: "nao" },
    tabelas: function (d) {
      var s6 = (d.params || {}).secao6 === "sim";
      var linhas = [
        { k: "amostra", r: "Amostra nº (partes da mesma amostra: mesmo nº — NOTA 2)", texto: true, ph: "auto" },
        { k: "frasco", r: "Recipiente nº", texto: true },
        { grupo: "Pesagens (seção 5)" },
        { k: "A", r: "A — massa da amostra seca ao ar (5 b)", u: "g" },
        { k: "B", r: "B — recipiente cheio de água a 25 °C, com a placa (5 a)", u: "g" },
        { k: "C", r: "C — recipiente + amostra + água, completo, com a placa (5 f)", u: "g" },
      ];
      if (s6) linhas.push({ k: "Ass", r: "A' — massa da amostra com superfície seca (seção 6)", u: "g" });
      linhas = linhas.concat([
        { grupo: "Condições do ensaio" },
        { k: "temp", r: "Temperatura da água no recipiente (5 f) — (25 ± 1) °C", u: "°C", ph: "25,0" },
        { k: "pres", r: "Pressão residual aplicada — (3,7 ± 0,3) kPa (5 d)", u: "kPa" },
        { k: "tempo", r: "Tempo sob vácuo — (15 ± 2) min (5 d)", u: "min" },
        { grupo: "Cálculos (seção 7)" },
        { calc: "vol", r: (s6 ? "A' + B − C" : "A + B − C") + " (massa de água deslocada)", u: "g", casas: 1 },
        { calc: "gmm", r: "Gmm = A / (" + (s6 ? "A'" : "A") + " + B − C) (eq. 1)", u: "—", casas: 4, destaque: true },
        { calc: "rhoW", r: "Massa específica da água na temperatura (NOTA 3)", u: "g/cm³", casas: 4 },
        { calc: "memm", r: "MEmm = ρágua × Gmm (eq. 2)", u: "g/cm³", casas: 4 },
        { calc: "gmmAm", r: "Gmm da amostra (média ponderada das partes — NOTA 2)", u: "—", casas: 4 },
        { calc: "desv", r: "Diferença para a média (limite ± 0,020, seção 8)", u: "—", casas: 4 },
      ]);
      return [{ chave: "det", titulo: "Determinações", rotulo: "Det.", iniciais: 3, min: 1, linhas: linhas,
        dica: "uma coluna por determinação; no mínimo três amostras da mesma mistura (seção 8). Amostra ensaiada em partes: dê o mesmo nº de amostra às colunas das partes." }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], s6 = P.secao6 === "sim";
      var dets = (d.det || []).map(function (x, i) {
        var A = num(x.A), B = num(x.B), C = num(x.C), Ass = num(x.Ass), t = num(x.temp);
        var Aden = s6 && ok(Ass) ? Ass : A;
        var vol = Aden + B - C;
        var gmm = ok(A) && ok(vol) && vol > 0 ? A / vol : NaN;  // eq. 1
        var rw = rhoAgua(t);
        var nome = String(x.amostra || "").trim() || String(i + 1);
        var rot = "Determinação " + (i + 1);
        if (ok(A) && ok(B) && ok(C) && C <= B) avisos.push(rot + ": C deve ser maior que B (a amostra desloca menos água do que pesa) — confira as pesagens.");
        if (s6 && ok(A) && !ok(Ass)) avisos.push(rot + ": informe A' (massa com superfície seca, seção 6) ou desmarque a seção 6.");
        if (s6 && ok(A) && ok(Ass) && Ass < A) avisos.push(rot + ": A' (superfície seca) menor que A — a amostra absorve água, A' deve ser ≥ A.");
        if (ok(t) && Math.abs(t - 25) > 1) {
          avisos.push(rot + ": água a " + fmt(t, 1) + " °C, fora de (25 ± 1) °C (5 f)" +
            (ok(rw) ? "; MEmm calculada com a massa específica da água a essa temperatura (NOTA 3)." : "; temperatura fora da tabela de 20 °C a 30 °C."));
        }
        var pr = num(x.pres);
        if (ok(pr) && Math.abs(pr - 3.7) > 0.3 + 1e-9) avisos.push(rot + ": pressão residual de " + fmt(pr, 1) + " kPa, fora de (3,7 ± 0,3) kPa (5 d).");
        var tm = num(x.tempo);
        if (ok(tm) && Math.abs(tm - 15) > 2 + 1e-9) avisos.push(rot + ": vácuo mantido por " + fmt(tm, 1) + " min, fora de (15,0 ± 2,0) min (5 d).");
        return { amostra: nome, A: A, vol: vol, gmm: gmm, rhoW: ok(gmm) ? rw : NaN, memm: ok(gmm) && ok(rw) ? rw * gmm : NaN };
      });
      // amostras: partes com o mesmo nº são combinadas por média ponderada pela massa (NOTA 2)
      var ordem = [], grupos = {};
      dets.forEach(function (o, i) {
        if (!ok(o.gmm)) return;
        if (!grupos[o.amostra]) { grupos[o.amostra] = []; ordem.push(o.amostra); }
        grupos[o.amostra].push(i);
      });
      var amostras = ordem.map(function (nome) {
        var ids = grupos[nome], m = 0, sg = 0, sm = 0;
        ids.forEach(function (i) { m += dets[i].A; sg += dets[i].A * dets[i].gmm; sm += dets[i].A * dets[i].memm; });
        return { nome: nome, partes: ids.length, ids: ids, massa: m, gmm: sg / m, memm: ok(sm) ? sm / m : NaN };
      });
      var gmm = media(amostras.map(function (a) { return a.gmm; }));
      var memm = media(amostras.map(function (a) { return a.memm; }));
      var desvioMax = NaN;
      amostras.forEach(function (a) {
        a.desvio = a.gmm - gmm;
        a.desvioMe = a.memm - memm;
        a.ids.forEach(function (i) { dets[i].gmmAm = a.gmm; dets[i].desv = a.desvio; });
        desvioMax = ok(desvioMax) ? Math.max(desvioMax, Math.abs(a.desvio)) : Math.abs(a.desvio);
        var rot = "Amostra " + a.nome;
        if (amostras.length > 1 && Math.abs(a.desvio) > TOL + 1e-9) avisos.push(rot + ": Gmm = " + fmt(a.gmm, 3) + " difere " + fmt(Math.abs(a.desvio), 3) +
          " da média (" + fmt(gmm, 3) + "), acima de ± 0,020 (8 a) — descarte a amostra e ensaie outra.");
        else if (amostras.length > 1 && ok(a.desvioMe) && Math.abs(a.desvioMe) > TOL + 1e-9) avisos.push(rot + ": MEmm difere " + fmt(Math.abs(a.desvioMe), 3) + " g/cm³ da média, acima de ± 0,020 g/cm³ (8 b).");
        // massa mínima (Tabela 1) e partes (4.2)
        var minimo = (TAB1.filter(function (t) { return t[0] === P.tnm; })[0] || [])[2];
        if (minimo && a.massa < minimo) avisos.push(rot + ": massa de " + fmt(a.massa, 1) + " g, abaixo do mínimo de " + minimo.toLocaleString("pt-BR") + " g (Tabela 1).");
        if (a.partes > 1) a.ids.forEach(function (i) {
          if (dets[i].A < 1250) avisos.push(rot + ", determinação " + (i + 1) + ": parte com " + fmt(dets[i].A, 1) + " g; cada parte deve ter pelo menos 1.250 g (4.2).");
        });
        var vf = num(P.volFrasco);
        if (ok(vf)) a.ids.forEach(function (i) {
          var vAm = dets[i].A / dets[i].gmm;  // volume aproximado da mistura (cm³)
          if (vAm > vf * 2 / 3) avisos.push(rot + ", determinação " + (i + 1) + ": volume da mistura ≈ " + fmt(vAm, 0) + " cm³, maior que 2/3 do recipiente (" +
            fmt(vf * 2 / 3, 0) + " ml) — ensaiar em partes de pelo menos 1.250 g (4.2).");
        });
      });
      var vf2 = num(P.volFrasco);
      if (ok(vf2) && vf2 < 4000) avisos.push("Recipiente de " + fmt(vf2, 0) + " ml: a norma pede capacidade mínima de 4.000 ml (3.2).");
      if (amostras.length && amostras.length < 3) avisos.push("O resultado deve ser a média de, no mínimo, três amostras da mesma mistura (seção 8); há " + amostras.length + ".");
      var conforme = amostras.length >= 3 ? amostras.every(function (a) { return Math.abs(a.desvio) <= TOL + 1e-9 && (!ok(a.desvioMe) || Math.abs(a.desvioMe) <= TOL + 1e-9); }) : null;
      return { tab: { det: dets },
        resultados: { gmm: gmm, memm: memm, n: amostras.length, desvioMax: desvioMax, conforme: conforme, secao6: s6,
          amostras: amostras.map(function (a) { return { nome: a.nome, partes: a.partes, massa: a.massa, gmm: a.gmm, memm: a.memm, desvio: a.desvio }; }),
          dets: dets.map(function (o) { return { amostra: o.amostra, A: o.A, vol: o.vol, gmm: o.gmm, rhoW: o.rhoW, memm: o.memm }; }) },
        avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      var sit = r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">amostras dentro de ± 0,020</span>' : ' · <span class="fe-nok">amostra fora de ± 0,020</span>';
      var linhas = r.amostras.map(function (a) {
        return "<tr><td>" + esc(a.nome) + "</td><td>" + a.partes + "</td><td>" + fmt(a.massa, 1) + "</td><td><b>" + fmt(a.gmm, 3) + "</b></td><td>" +
          fmt(a.memm, 3) + "</td><td>" + (a.desvio >= 0 ? "+" : "") + fmt(a.desvio, 3) + "</td><td>" +
          (Math.abs(a.desvio) <= TOL + 1e-9 ? '<span class="fe-ok">ok</span>' : '<span class="fe-nok">&gt; 0,020</span>') + "</td></tr>";
      }).join("");
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + fmt(r.gmm, 3) + '</div>' +
        '<div class="fe-res-r">Densidade relativa máxima medida Gmm — média de ' + r.n + " amostra(s)" + sit + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v">' + fmt(r.memm, 3) + ' <small>g/cm³</small></div>' +
        '<div class="fe-res-r">Massa específica máxima medida MEmm (eq. 2)</div></div>' +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (ok(r.desvioMax) ? "± " + fmt(r.desvioMax, 3) : "—") + '</div>' +
        '<div class="fe-res-r">Maior diferença de uma amostra para a média (limite ± 0,020)' + (r.secao6 ? " · com correção da seção 6" : "") + "</div></div></div>" +
        (r.amostras.length ? '<table class="fe-resumo"><thead><tr><th>Amostra</th><th>Partes</th><th>Massa (g)</th><th>Gmm</th><th>MEmm (g/cm³)</th><th>Dif. média</th><th>Situação</th></tr></thead><tbody>' +
          linhas + "</tbody></table>" : "");
    },
    relatorio: {
      notas: "Gmm = A / (A + B − C) (eq. 1); MEmm = 0,9971 × Gmm (eq. 2), 0,9971 g/cm³ = água a 25 °C — em outra temperatura usa-se a massa específica da água correspondente (NOTA 3). " +
        "Amostra ensaiada em partes: Gmm pela média ponderada (pela massa) das partes (NOTA 2). Resultado: média de no mínimo três amostras, cada uma a no máximo ± 0,020 da média, com três casas decimais (seções 8 e 9). " +
        "Seção 6 (agregados porosos): a massa com superfície seca A' substitui A no denominador — Gmm = A / (A' + B − C), como na ASTM D2041 citada pela norma. " +
        "Precisão (Anexo B, informativo): diferença aceitável entre dois ensaios de um operador d2s = 0,023 (0,018 com a seção 6).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.mistura) rows.push(["Tipo de mistura", P.mistura]);
        rows.push(["Densidade relativa máxima medida (Gmm)", fmt(r.gmm, 3) + " — média de " + r.n + " amostra(s)" +
          (r.conforme === null ? "" : r.conforme ? " — todas dentro de ± 0,020 da média" : " — HÁ AMOSTRA FORA DE ± 0,020 DA MÉDIA")]);
        rows.push(["Massa específica máxima medida (MEmm)", fmt(r.memm, 3) + " g/cm³"]);
        var dets = (d.det || []);
        var temps = dets.map(function (x) { return num(x.temp); }).filter(ok);
        rows.push(["Temperatura da água", temps.length ? temps.map(function (t) { return fmt(t, 1); }).join(" / ") + " °C" : "25 °C (não informada)"]);
        rows.push(["Amostras / determinações", r.n + " amostra(s), " + r.dets.filter(function (x) { return ok(x.gmm); }).length + " determinação(ões); massas: " +
          r.amostras.map(function (a) { return fmt(a.massa, 1) + " g"; }).join(", ")]);
        if (r.secao6) rows.push(["Correção de absorção (seção 6)", "aplicada"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "CBUQ usinado, 3 amostras — mistura da MATRIZ CBUQ (Obra B)", dados: function () {
        // As planilhas do laboratório não têm ensaio Rice (usam a DMT calculada, 2,540). Pesagens geradas para
        // Gmm ≈ 2,515 (um pouco abaixo da DMT, como prevê o resumo da norma), frasco metálico de 4.000 ml.
        return { ident: { registro: "EX-RICE-001", obra: "Obra B", local: "Alça 1 Retorno 2 / Pista direita 2", camada: "Binder — CBUQ",
          origem: "Usina (CAP 30/45, 4,6 %)", data: "2024-07-08" },
          params: { mistura: "CBUQ — binder, CAP 30/45, 4,6 %", origemAm: "usina", recipiente: "metalico", volFrasco: "4000", tnm: "19",
            agitacao: "mecanica", secao6: "nao" },
          det: [
            { amostra: "1", frasco: "M1", A: "2548,6", B: "7412,3", C: "8946,7", temp: "25,2", pres: "3,7", tempo: "15" },
            { amostra: "2", frasco: "M1", A: "2561,2", B: "7412,3", C: "8956,3", temp: "25,0", pres: "3,6", tempo: "15" },
            { amostra: "3", frasco: "M2", A: "2553,9", B: "7398,8", C: "8937,6", temp: "24,8", pres: "3,8", tempo: "16" },
          ] };
      } },
      { nome: "Agregado poroso — seção 6 e amostra ensaiada em duas partes (NOTA 2)", dados: function () {
        return { ident: { registro: "EX-RICE-002", camada: "Capa — CBUQ faixa C", origem: "Laboratório — dosagem, teor 5,5 %" },
          params: { mistura: "CBUQ faixa C, CAP 50/70, 5,5 %", origemAm: "lab", recipiente: "kitasato", volFrasco: "4000", tnm: "12,5",
            agitacao: "manual", secao6: "sim" },
          det: [
            { amostra: "1", frasco: "K1", A: "1602,4", B: "6215,0", C: "7166,6", Ass: "1605,1", temp: "25,0", pres: "3,7", tempo: "15" },
            { amostra: "2", frasco: "K1", A: "1597,8", B: "6215,0", C: "7165,6", Ass: "1600,6", temp: "25,1", pres: "3,7", tempo: "15" },
            { amostra: "3", frasco: "K1", A: "1320,5", B: "6215,0", C: "6998,6", Ass: "1322,8", temp: "24,9", pres: "3,8", tempo: "14" },
            { amostra: "3", frasco: "K2", A: "1285,0", B: "6230,4", C: "6995,6", Ass: "1287,3", temp: "24,9", pres: "3,8", tempo: "14" },
          ] };
      } },
      { nome: "Amostra fora de ± 0,020, massa insuficiente e ensaio fora das condições", dados: function () {
        return { ident: { registro: "EX-RICE-003", camada: "Capa — CBUQ faixa B", origem: "Extraído de corpo de prova de campo" },
          params: { mistura: "CBUQ faixa B, CAP 50/70", origemAm: "campo", recipiente: "kitasato", volFrasco: "4000", tnm: "19",
            agitacao: "mecanica", secao6: "nao" },
          det: [
            { amostra: "1", frasco: "K1", A: "2512,0", B: "6215,0", C: "7710,0", temp: "25,0", pres: "3,7", tempo: "15" },
            { amostra: "2", frasco: "K1", A: "2530,6", B: "6215,0", C: "7734,6", temp: "27,5", pres: "4,4", tempo: "15" },
            { amostra: "3", frasco: "K2", A: "2280,3", B: "6230,4", C: "7586,0", temp: "25,0", pres: "3,7", tempo: "10" },
          ] };
      } },
    ],
  };
})();
