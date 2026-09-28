/*
 * Ficha: DNER-ME 036/94 — Solo — Massa específica aparente "in situ" com emprego do balão de borracha.
 * Registra-se no motor de site/fichas.js (window.FE).
 *
 * V = L1 − L2 (6.1); γh = Ph / V (6.2); γs = γh × 100 / (100 + h) (6.3); GC = γs / γsl × 100 (6.4).
 * Umidade do solo da cavidade pelo bloco Teor de umidade (DNIT 456-ME); γsl e h ótima importados de uma
 * compactação salva (DNIT 164/2013-ME ou DNER-ME 162/94), como na ficha DNIT 458.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, fmtSig = FE.fmtSig, esc = FE.esc, media = FE.media;
  var U = FE.BLOCOS.umidade;

  // 3 h: "estufa capaz de manter a temperatura entre 105 °C – 110 °C ou instrumental que permita a determinação da umidade"
  var METODOS = [["lab", "Estufa 105 °C a 110 °C (DNIT 456, 5.2)"], ["frigideira", "Expedito — frigideira (DNIT 456, 5.1.1)"],
    ["speedy", "Expedito — \"Speedy\" (DNIT 456, 5.1.2)"]];
  // Tabela (5.2): diâmetro máximo das partículas → volume mínimo da cavidade (cm³) e altura mínima (cm)
  var TABELA = [["4", "Nº 4 (peneira)", 450, 6], ["12", "1/2 pol", 600, 8], ["34", "3/4 pol", 700, 9], ["1", "1 pol", 750, 10]];
  var V_BALAO = 1500;  // Nota 2: borracha adequada para medir volumes até 1 500 cm³

  function linhaTabela(P) { return TABELA.filter(function (t) { return t[0] === P.diametro; })[0] || null; }

  // referência de laboratório importada (DNIT 164 ou DNER-ME 162): γs,máx e umidade ótima
  function aplicarLab(e, P) {
    var r = e.resultados || {}, i = (e.dados || {}).ident || {};
    if (ok(r.gsMax)) P.gsl = fmt(r.gsMax, 3);
    if (ok(r.hOt)) P.hOt = fmt(r.hOt, 1);
    P.labRegistro = (i.registro || "") + (i.origem ? " · " + i.origem : "") + (i.data ? " · " + i.data.split("-").reverse().join("/") : "");
  }

  FE.FICHAS["dner-me-036-94"] = {
    titulo: "Solo — Massa específica aparente in situ (balão de borracha) e grau de compactação",
    rotuloImportar: function (r) { return "GC médio " + (ok(r.gcMedio) ? fmt(r.gcMedio, 1) + " %" : "—") + (r.furos ? " · " + r.furos.length + " furo(s)" : ""); },
    resumo: "Volume da cavidade pelo balão de borracha (V = L1 − L2), massa específica aparente úmida e seca in situ e grau de compactação em relação à massa específica aparente seca de laboratório (6.1 a 6.4). Solos com partículas de até 2,5 cm.",
    blocos: ["umidade"],
    params: [
      { k: "aparelho", r: "Aparelho (conjunto do balão) nº" },
      { k: "L1", r: "L1 — leitura de volume zero na calibração (ml)", recarrega: "tabela",
        dica: "leitura constante com o balão pressionado sobre superfície plana (4 e); pode ser informada por furo na tabela" },
      { k: "diametro", r: "Diâmetro máximo das partículas do solo (Tabela, 5.2)", tipo: "select",
        opcoes: [["", "—"]].concat(TABELA.map(function (t) { return [t[0], t[1] + " — volume mínimo " + t[2] + " cm³, altura mínima " + t[3] + " cm"]; })),
        dica: "define o volume e a profundidade mínimos da cavidade" },
      { k: "metodo", r: "Umidade do solo da cavidade — método (5.4)", tipo: "select", recarrega: true, opcoes: METODOS },
      { k: "curva", r: "Curva de calibração do Speedy (kPa = %)", ph: "20=2,5; 50=6,1; 100=12,0",
        se: function (d) { return (d.params || {}).metodo === "speedy"; } },
      { k: "importar", r: "γsl: buscar compactação salva (DNIT 164)", tipo: "importar", de: "dnit-164-2013-me", aplicar: aplicarLab },
      { k: "importar162", r: "…ou compactação com amostras trabalhadas (DNER-ME 162)", tipo: "importar", de: "dner-me-162-94", aplicar: aplicarLab },
      { k: "gsl", r: "γsl — massa específica aparente seca de laboratório (g/cm³)", dica: "obtida pelo método exigido para a obra (6.4)" },
      { k: "hOt", r: "Umidade ótima do laboratório (%)" },
      { k: "labRegistro", r: "Ensaio de compactação de referência" },
      { k: "gcMin", r: "Grau de compactação mínimo exigido (%) — opcional", dica: "da especificação de serviço (ex.: 100 %)" },
    ],
    padrao: { metodo: "lab" },
    tabelas: function (d) {
      var P = d.params || {};
      return [{ chave: "furos", titulo: "Cavidades ensaiadas (seção 5)", rotulo: "Furo", iniciais: 1, min: 1,
        dica: "uma coluna por cavidade (furo)",
        linhas: [
          { k: "estaca", r: "Estaca", texto: true },
          { k: "posicao", r: "Posição (LE / eixo / LD)", texto: true },
          { k: "prof", r: "Altura (profundidade) da cavidade (5.2)", u: "cm" },
          { grupo: "Volume da cavidade (4 e 5.5)" },
          { k: "L1", r: "L1 — leitura de volume zero", u: "ml", padrao: "L1" },
          { k: "L2", r: "L2 — leitura com o balão enchendo a cavidade", u: "ml" },
          { calc: "V", r: "V = L1 − L2 (6.1)", u: "cm³", casas: 0 },
          { grupo: "Solo extraído da cavidade (5.3)" },
          { k: "mb", r: "Bandeja + solo úmido", u: "g" },
          { k: "mr", r: "Bandeja (tara)", u: "g", ph: "0" },
          { calc: "Ph", r: "Ph — massa do solo úmido", u: "g", casas: 0 },
          { grupo: "Umidade do solo da cavidade (5.4) — bloco Teor de umidade, DNIT 456-ME" },
        ].concat(U.linhas("u", "", P.metodo || "lab")).concat([
          { grupo: "Resultados (6.2 a 6.4)" },
          { calc: "gh", r: "γh = Ph / V (6.2)", u: "g/cm³", casas: 3 },
          { calc: "gs", r: "γs = γh × 100 / (100 + h) (6.3)", u: "g/cm³", casas: 3, destaque: true },
          { calc: "GC", r: "GC = γs / γsl × 100 (6.4)", u: "%", casas: 1, destaque: true },
          { calc: "dw", r: "Desvio de umidade (h − h ótima)", u: "p.p.", casas: 1 },
        ]) }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var gsl = num(P.gsl), hOt = num(P.hOt), gcMin = num(P.gcMin), L1p = num(P.L1);
      var curva = FE.curvaSpeedy(P.curva), tab = linhaTabela(P);
      var furos = (d.furos || []).map(function (f, i) {
        var rot = "Furo " + (i + 1) + (f.estaca ? " (estaca " + f.estaca + ")" : "");
        var L1 = ok(num(f.L1)) ? num(f.L1) : L1p, L2 = num(f.L2);
        var V = ok(L1) && ok(L2) ? L1 - L2 : NaN;            // 6.1
        var mr = ok(num(f.mr)) ? num(f.mr) : 0, Ph = num(f.mb) - mr;
        var u = U.calcular(f, "u", P.metodo || "lab", curva);
        if (u.aviso) avisos.push(rot + ": " + u.aviso + ".");
        var gh = ok(Ph) && ok(V) && V > 0 ? Ph / V : NaN;    // 6.2
        var gs = ok(gh) && ok(u.w) ? gh * 100 / (100 + u.w) : NaN;  // 6.3
        var GC = ok(gs) && ok(gsl) && gsl > 0 ? gs / gsl * 100 : NaN;  // 6.4
        if (ok(L2) && !ok(L1)) avisos.push(rot + ": informe a leitura de volume zero L1 (calibração, 4 e).");
        if (ok(V) && V <= 0) avisos.push(rot + ": L2 maior ou igual a L1 — confira as leituras (V = L1 − L2).");
        if (ok(V) && V > V_BALAO) avisos.push(rot + ": volume de " + fmt(V, 0) + " cm³, acima dos 1 500 cm³ que o balão deve medir sem romper (Nota 2).");
        if (tab && ok(V) && V > 0 && V < tab[2]) avisos.push(rot + ": volume da cavidade de " + fmt(V, 0) + " cm³, abaixo do mínimo de " + tab[2] +
          " cm³ para diâmetro máximo " + tab[1] + " (Tabela) — só admitido se a espessura da camada não permitir (Nota 1).");
        var prof = num(f.prof);
        if (tab && ok(prof) && prof < tab[3]) avisos.push(rot + ": altura da cavidade de " + fmt(prof, 1) + " cm, abaixo do mínimo de " + tab[3] +
          " cm para diâmetro máximo " + tab[1] + " (Tabela).");
        if (ok(GC) && ok(gcMin) && GC < gcMin) avisos.push(rot + ": GC = " + fmt(GC, 1) + " %, abaixo do mínimo exigido de " + fmt(gcMin, 1) + " %.");
        return { V: V, Ph: Ph, uW: u.w, gh: gh, gs: gs, GC: GC, dw: ok(u.w) && ok(hOt) ? u.w - hOt : NaN,
          estaca: f.estaca, posicao: f.posicao, conforme: ok(GC) && ok(gcMin) ? GC >= gcMin : null };
      });
      if (furos.some(function (f) { return ok(f.gs); }) && !ok(gsl)) avisos.push("Informe γsl (ou busque uma compactação salva) para calcular o grau de compactação (6.4).");
      if (!P.diametro && furos.some(function (f) { return ok(f.V); })) avisos.push("Informe o diâmetro máximo das partículas para verificar o volume e a altura mínimos da cavidade (Tabela).");
      return { tab: { furos: furos }, resultados: { gsl: gsl, hOt: hOt, gcMin: gcMin, furos: furos,
        gsMedio: media(furos.map(function (f) { return f.gs; })), gcMedio: media(furos.map(function (f) { return f.GC; })) }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      var linhas = r.furos.map(function (f, i) {
        var sit = f.conforme === null ? "—" : f.conforme ? '<span class="fe-ok">conforme</span>' : '<span class="fe-nok">abaixo do mínimo</span>';
        return "<tr><td>" + (i + 1) + "</td><td>" + esc(f.estaca || "") + "</td><td>" + esc(f.posicao || "") + "</td><td>" + fmt(f.V, 0) +
          "</td><td>" + fmt(f.uW, 1) + "</td><td>" + fmt(f.gs, 3) + "</td><td><b>" + fmt(f.GC, 1) + "</b></td><td>" + sit + "</td></tr>";
      }).join("");
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + fmt(r.gsl, 3) + ' <small>g/cm³</small></div>' +
        '<div class="fe-res-r">γsl (laboratório) · h ótima ' + fmt(r.hOt, 1) + " %</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v">' + fmt(r.gsMedio, 3) + ' <small>g/cm³</small></div><div class="fe-res-r">γs in situ médio (6.3)</div></div>' +
        '<div class="fe-res-item"><div class="fe-res-v">' + fmt(r.gcMedio, 1) + ' <small>%</small></div><div class="fe-res-r">Grau de compactação médio (6.4)' +
        (ok(r.gcMin) ? " · mínimo exigido " + fmt(r.gcMin, 1) + " %" : "") + "</div></div></div>" +
        '<table class="fe-resumo"><thead><tr><th>Furo</th><th>Estaca</th><th>Posição</th><th>V (cm³)</th><th>h (%)</th><th>γs (g/cm³)</th><th>GC (%)</th><th>Situação</th></tr></thead><tbody>' +
        linhas + "</tbody></table>";
    },
    relatorio: {
      parametros: [["Aparelhagem", "Conjunto do balão de borracha com proveta de 1,5 l graduada em 5 ml; bandeja com orifício de 10 cm (3)"]],
      notas: "V = L1 − L2 (6.1); γh = Ph / V (6.2); γs = γh × 100 / (100 + h) (6.3); GC = γs / γsl × 100 (6.4). A norma não fixa arredondamento: massas específicas com 0,001 g/cm³, umidade e GC com 0,1 %. Umidade pela DNIT 456-ME.",
      resultados: function (calc) {
        var r = calc.resultados;
        return [["γsl / umidade ótima (laboratório)", fmt(r.gsl, 3) + " g/cm³ / " + fmt(r.hOt, 1) + " %"]].concat(r.furos.map(function (f, i) {
          return ["Furo " + (i + 1) + (f.estaca ? " — estaca " + f.estaca : "") + (f.posicao ? " (" + f.posicao + ")" : ""),
            "V = " + fmt(f.V, 0) + " cm³ · h = " + fmt(f.uW, 1) + " % · γs = " + fmt(f.gs, 3) + " g/cm³ · GC = " + fmt(f.GC, 1) + " %" +
            (f.conforme === null ? "" : f.conforme ? " · conforme" : " · ABAIXO DO MÍNIMO")];
        })).concat([["Grau de compactação médio", fmt(r.gcMedio, 1) + " %"]]);
      },
    },
    exemplos: [
      { nome: "Subleito argiloso — 3 furos, umidade em estufa, γsl do exemplo Proctor normal", dados: function () {
        // γsl e h ót. = exemplo "Subleito argiloso — Proctor normal" da DNIT 164 (1,605 g/cm³; 22,0 %)
        return { ident: { registro: "EX-BAL-001", obra: "Obra A", trecho: "BR-000, km 10 ao km 11", camada: "Subleito — argila siltosa", origem: "Corte km 12" },
          params: { aparelho: "1", L1: "1480", diametro: "4", metodo: "lab", gsl: "1,605", hOt: "22,0",
            labRegistro: "EX-002 (exemplo Proctor normal)", gcMin: "100" },
          furos: [furo("10", "LD", 12, 1480, 1185, 101.4, 21.3, 850, "31", 1.605), furo("14", "eixo", 11, 1480, 1230, 100.3, 22.6, 850, "32", 1.605),
            furo("18", "LE", 12, 1480, 1150, 102.1, 21.8, 850, "33", 1.605)] };
      } },
      { nome: "Aterro com pedregulho (3/4 pol) — Speedy; cavidade rasa e um furo abaixo do mínimo", dados: function () {
        // γsl e h ót. = exemplo "Base solo-cimento 3 %" da DNIT 164 (1,915 g/cm³; 13,6 %)
        return { ident: { registro: "EX-BAL-002", obra: "Obra B", trecho: "Rua A", camada: "Aterro — camada final", origem: "Jazida 1" },
          params: { aparelho: "2", L1: "1495", diametro: "34", metodo: "speedy", curva: "20=2,1; 40=4,3; 60=6,6; 80=8,8; 100=11,0; 120=13,1; 150=16,2",
            gsl: "1,915", hOt: "13,6", labRegistro: "EX-001 (exemplo Proctor intermediário)", gcMin: "100" },
          furos: [furoSpeedy("5", "LD", 10, 1495, 760, 100.8, 118, 900), furoSpeedy("8", "eixo", 7, 1495, 640, 100.2, 124, 900),
            furoSpeedy("11", "LE", 10, 1495, 745, 97.6, 130, 900)] };
      } },
    ],
  };

  // furo gerado a partir de V, GC e umidade-alvo (umidade em estufa, ~150 g de solo seco na cápsula)
  function furo(est, pos, prof, L1, V, gc, w, tara, cap, gsl) {
    var gs = gc / 100 * gsl, gh = gs * (1 + w / 100);
    var t = 20 + Number(cap) % 7, seco = t + 150;
    return { estaca: est, posicao: pos, prof: String(prof), L2: String(L1 - V), mb: String(Math.round(gh * V + tara)), mr: String(tara),
      un: cap, ut: fmt(t, 2), uu: fmt(seco + 150 * w / 100, 2), us: fmt(seco, 2) };
  }
  // furo com umidade pelo Speedy (pressão lida; umidade pela curva do aparelho)
  function furoSpeedy(est, pos, prof, L1, V, gc, pressao, tara) {
    var curva = FE.curvaSpeedy("20=2,1; 40=4,3; 60=6,6; 80=8,8; 100=11,0; 120=13,1; 150=16,2");
    var w = FE.interpolar(curva, pressao), gs = gc / 100 * 1.915, gh = gs * (1 + w / 100);
    return { estaca: est, posicao: pos, prof: String(prof), L2: String(L1 - V), mb: String(Math.round(gh * V + tara)), mr: String(tara),
      um: "6", up: String(pressao) };
  }
})();
