/*
 * Ficha: DNER-ME 037/94 — Solo — Massa específica aparente "in situ" com emprego do óleo.
 * Registra-se no motor de site/fichas.js (window.FE).
 *
 * V = V1 − V2 (5.1); γh = Ph / V (5.2); γs = γh × 100 / (100 + h) (5.3); GC = γs / γsl × 100 (5.4).
 * Umidade (4.4: estufa, "Speedy" ou álcool) pelo bloco Teor de umidade (DNIT 456-ME); γsl e h ótima
 * importados de uma compactação salva (DNIT 164/2013-ME ou DNER-ME 162/94), como na ficha DNIT 458.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var U = FE.BLOCOS.umidade;

  // 4.4: "determinar a umidade (h) pelo processo da estufa, do 'speedy' ou do álcool"
  var METODOS = [["lab", "Estufa 105 °C a 110 °C (DNIT 456, 5.2)"], ["speedy", "\"Speedy\" (DNIT 456, 5.1.2)"],
    ["alcool", "Álcool — queima (mesmas pesagens: tara, úmida, seca)"]];
  var PROF = [10, 15];   // 4.2: cavidade com profundidade em torno de 10 cm a 15 cm
  var M_UMID = 100;      // 4.4: tomar 100 g do solo para a umidade

  function aplicarLab(e, P) {
    var r = e.resultados || {}, i = (e.dados || {}).ident || {};
    if (ok(r.gsMax)) P.gsl = fmt(r.gsMax, 3);
    if (ok(r.hOt)) P.hOt = fmt(r.hOt, 1);
    P.labRegistro = (i.registro || "") + (i.origem ? " · " + i.origem : "") + (i.data ? " · " + i.data.split("-").reverse().join("/") : "");
  }

  FE.FICHAS["dner-me-037-94"] = {
    titulo: "Solo — Massa específica aparente in situ (óleo) e grau de compactação",
    rotuloImportar: function (r) { return "GC médio " + (ok(r.gcMedio) ? fmt(r.gcMedio, 1) + " %" : "—") + (r.furos ? " · " + r.furos.length + " furo(s)" : ""); },
    resumo: "Volume da cavidade pelo óleo SAE 40 vertido de proveta de 1 000 ml (V = V1 − V2), massa específica aparente úmida e seca in situ e grau de compactação (5.1 a 5.4). Para solos argilosos/siltosos, inclusive com pedregulho ou brita salientes nas paredes da cavidade.",
    blocos: ["umidade"],
    params: [
      { k: "V1", r: "V1 — volume inicial de óleo na proveta (ml)", recarrega: "tabela", ph: "1000", dica: "até o traço de 1 000 ml (4.5); pode ser informado por furo" },
      { k: "oleo", r: "Óleo", ph: "SAE 40 (3 l)" },
      { k: "metodo", r: "Umidade do solo da cavidade — método (4.4)", tipo: "select", recarrega: true, opcoes: METODOS },
      { k: "curva", r: "Curva de calibração do Speedy (kPa = %)", ph: "20=2,5; 50=6,1; 100=12,0",
        se: function (d) { return (d.params || {}).metodo === "speedy"; } },
      { k: "importar", r: "γsl: buscar compactação salva (DNIT 164)", tipo: "importar", de: "dnit-164-2013-me", aplicar: aplicarLab },
      { k: "importar162", r: "…ou compactação com amostras trabalhadas (DNER-ME 162)", tipo: "importar", de: "dner-me-162-94", aplicar: aplicarLab },
      { k: "gsl", r: "γsl — massa específica aparente seca de laboratório (g/cm³)", dica: "obtida pelo método exigido para a obra (5.4)" },
      { k: "hOt", r: "Umidade ótima do laboratório (%)" },
      { k: "labRegistro", r: "Ensaio de compactação de referência" },
      { k: "gcMin", r: "Grau de compactação mínimo exigido (%) — opcional", dica: "da especificação de serviço (ex.: 100 %)" },
    ],
    padrao: { metodo: "lab" },
    tabelas: function (d) {
      var P = d.params || {};
      return [{ chave: "furos", titulo: "Cavidades ensaiadas (seção 4)", rotulo: "Furo", iniciais: 1, min: 1,
        dica: "uma coluna por cavidade (furo)",
        linhas: [
          { k: "estaca", r: "Estaca", texto: true },
          { k: "posicao", r: "Posição (LE / eixo / LD)", texto: true },
          { k: "prof", r: "Profundidade da cavidade (4.2: 10 cm a 15 cm)", u: "cm" },
          { grupo: "Solo extraído da cavidade (4.3)" },
          { k: "mb", r: "Bandeja + solo úmido", u: "g" },
          { k: "mr", r: "Bandeja (tara)", u: "g", ph: "0" },
          { calc: "Ph", r: "Ph — massa do solo úmido", u: "g", casas: 0 },
          { grupo: "Umidade — cerca de 100 g do solo (4.4), bloco Teor de umidade, DNIT 456-ME" },
        ].concat(U.linhas("u", "", P.metodo === "speedy" ? "speedy" : "lab")).concat([
          { grupo: "Volume da cavidade (4.5 e 4.6)" },
          { k: "V1", r: "V1 — óleo na proveta antes de verter", u: "ml", padrao: "V1", padraoFixo: "1000" },
          { k: "V2", r: "V2 — óleo que permaneceu na proveta", u: "ml" },
          { calc: "V", r: "V = V1 − V2 (5.1)", u: "cm³", casas: 0 },
          { grupo: "Resultados (5.2 a 5.4)" },
          { calc: "gh", r: "γh = Ph / V (5.2)", u: "g/cm³", casas: 3 },
          { calc: "gs", r: "γs = γh × 100 / (100 + h) (5.3)", u: "g/cm³", casas: 3, destaque: true },
          { calc: "GC", r: "GC = γs / γsl × 100 (5.4)", u: "%", casas: 1, destaque: true },
          { calc: "dw", r: "Desvio de umidade (h − h ótima)", u: "p.p.", casas: 1 },
        ]) }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var gsl = num(P.gsl), hOt = num(P.hOt), gcMin = num(P.gcMin);
      var V1p = ok(num(P.V1)) ? num(P.V1) : 1000;
      var metodo = P.metodo === "speedy" ? "speedy" : "lab", curva = FE.curvaSpeedy(P.curva);
      var furos = (d.furos || []).map(function (f, i) {
        var rot = "Furo " + (i + 1) + (f.estaca ? " (estaca " + f.estaca + ")" : "");
        var V1 = ok(num(f.V1)) ? num(f.V1) : V1p, V2 = num(f.V2);
        var V = ok(V2) ? V1 - V2 : NaN;                        // 5.1
        var mr = ok(num(f.mr)) ? num(f.mr) : 0, Ph = num(f.mb) - mr;
        var u = U.calcular(f, "u", metodo, curva);
        if (u.aviso) avisos.push(rot + ": " + u.aviso + ".");
        var gh = ok(Ph) && ok(V) && V > 0 ? Ph / V : NaN;    // 5.2
        var gs = ok(gh) && ok(u.w) ? gh * 100 / (100 + u.w) : NaN;  // 5.3
        var GC = ok(gs) && ok(gsl) && gsl > 0 ? gs / gsl * 100 : NaN;  // 5.4
        if (ok(V2) && V2 < 0) avisos.push(rot + ": V2 negativo — confira a leitura.");
        if (ok(V2) && V2 === 0) avisos.push(rot + ": todo o óleo da proveta foi vertido (V2 = 0) — a cavidade pode não ter ficado cheia; refaça com a proveta completada.");
        if (ok(V) && V <= 0 && V2 >= 0) avisos.push(rot + ": V2 maior ou igual a V1 — confira as leituras (V = V1 − V2).");
        var prof = num(f.prof);
        if (ok(prof) && (prof < PROF[0] || prof > PROF[1])) avisos.push(rot + ": profundidade de " + fmt(prof, 1) + " cm; a norma indica cavidade de 10 cm a 15 cm (4.2).");
        if (metodo === "lab" && ok(u.mUmida) && u.mUmida < 0.9 * M_UMID) avisos.push(rot + ": amostra de umidade com " + fmt(u.mUmida, 1) + " g; a norma manda tomar 100 g (4.4).");
        if (ok(GC) && ok(gcMin) && GC < gcMin) avisos.push(rot + ": GC = " + fmt(GC, 1) + " %, abaixo do mínimo exigido de " + fmt(gcMin, 1) + " %.");
        return { Ph: Ph, uW: u.w, V: V, gh: gh, gs: gs, GC: GC, dw: ok(u.w) && ok(hOt) ? u.w - hOt : NaN,
          estaca: f.estaca, posicao: f.posicao, conforme: ok(GC) && ok(gcMin) ? GC >= gcMin : null };
      });
      if (furos.some(function (f) { return ok(f.gs); }) && !ok(gsl)) avisos.push("Informe γsl (ou busque uma compactação salva) para calcular o grau de compactação (5.4).");
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
        '<div class="fe-res-item"><div class="fe-res-v">' + fmt(r.gsMedio, 3) + ' <small>g/cm³</small></div><div class="fe-res-r">γs in situ médio (5.3)</div></div>' +
        '<div class="fe-res-item"><div class="fe-res-v">' + fmt(r.gcMedio, 1) + ' <small>%</small></div><div class="fe-res-r">Grau de compactação médio (5.4)' +
        (ok(r.gcMin) ? " · mínimo exigido " + fmt(r.gcMin, 1) + " %" : "") + "</div></div></div>" +
        '<table class="fe-resumo"><thead><tr><th>Furo</th><th>Estaca</th><th>Posição</th><th>V (cm³)</th><th>h (%)</th><th>γs (g/cm³)</th><th>GC (%)</th><th>Situação</th></tr></thead><tbody>' +
        linhas + "</tbody></table>";
    },
    relatorio: {
      parametros: [["Aparelhagem", "Proveta de 1 000 ml graduada em 1 ml; bandeja com orifício de 10 cm; óleo SAE 40 (3)"]],
      notas: "V = V1 − V2 (5.1); γh = Ph / V (5.2); γs = γh × 100 / (100 + h) (5.3); GC = γs / γsl × 100 (5.4). A norma não fixa arredondamento: massas específicas com 0,001 g/cm³, umidade e GC com 0,1 %. Umidade pela DNIT 456-ME (no processo do álcool, mesmas pesagens da estufa).",
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
      { nome: "Subleito argiloso com pedregulho — 3 furos, umidade em estufa (100 g)", dados: function () {
        // γsl e h ót. = exemplo "Subleito argiloso — Proctor normal" da DNIT 164 (1,605 g/cm³; 22,0 %)
        return { ident: { registro: "EX-OL-001", obra: "Obra A", trecho: "BR-000, km 12", camada: "Subleito — argila com pedregulho", origem: "Corte km 12" },
          params: { V1: "1000", oleo: "SAE 40", metodo: "lab", gsl: "1,605", hOt: "22,0", labRegistro: "EX-002 (exemplo Proctor normal)", gcMin: "100" },
          furos: [furo("20", "LD", 12, 842, 100.9, 21.6, 780, "41", 1.605), furo("24", "eixo", 13, 915, 101.6, 22.3, 780, "42", 1.605),
            furo("28", "LE", 12, 868, 100.4, 22.9, 780, "43", 1.605)] };
      } },
      { nome: "Sub-base com brita — Speedy; furo raso e GC abaixo do mínimo", dados: function () {
        // γsl e h ót. = exemplo "Base solo-cimento 3 %" da DNIT 164 (1,915 g/cm³; 13,6 %)
        var curva = "20=2,1; 40=4,3; 60=6,6; 80=8,8; 100=11,0; 120=13,1; 150=16,2";
        return { ident: { registro: "EX-OL-002", obra: "Obra B", trecho: "Rua B", camada: "Sub-base — solo-brita", origem: "Jazida 1" },
          params: { V1: "1000", oleo: "SAE 40", metodo: "speedy", curva: curva, gsl: "1,915", hOt: "13,6",
            labRegistro: "EX-001 (exemplo Proctor intermediário)", gcMin: "100" },
          furos: [furoSpeedy("3", "LD", 11, 905, 100.5, 120, 900, curva), furoSpeedy("6", "eixo", 8, 610, 99.7, 126, 900, curva),
            furoSpeedy("9", "LE", 12, 880, 96.8, 132, 900, curva)] };
      } },
    ],
  };

  // furo gerado a partir de V, GC e umidade-alvo (umidade em estufa com ~100 g de solo úmido)
  function furo(est, pos, prof, V, gc, w, tara, cap, gsl) {
    var gs = gc / 100 * gsl, gh = gs * (1 + w / 100);
    var t = 18 + Number(cap) % 5, seco = t + 100 / (1 + w / 100);
    return { estaca: est, posicao: pos, prof: String(prof), mb: String(Math.round(gh * V + tara)), mr: String(tara),
      un: cap, ut: fmt(t, 2), uu: fmt(t + 100, 2), us: fmt(seco, 2), V2: String(1000 - V) };
  }
  function furoSpeedy(est, pos, prof, V, gc, pressao, tara, curva) {
    var w = FE.interpolar(FE.curvaSpeedy(curva), pressao), gs = gc / 100 * 1.915, gh = gs * (1 + w / 100);
    return { estaca: est, posicao: pos, prof: String(prof), mb: String(Math.round(gh * V + tara)), mr: String(tara),
      um: "6", up: String(pressao), V2: String(1000 - V) };
  }
})();
