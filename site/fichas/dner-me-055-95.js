/*
 * Ficha: DNER-ME 055/95 — Areia — determinação de impurezas orgânicas (ensaio colorimétrico).
 * Registro qualitativo: cor da solução da areia em NaOH a 3 % comparada à da solução padrão (ácido tânico).
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  var CORES = [["", "— (ainda não avaliada)"], ["clara", "Mais clara que a solução padrão"], ["igual", "Igual à solução padrão"],
    ["escura", "Mais escura que a solução padrão"]];

  function parecer(cor) {
    if (cor === "escura") return { ok: false, curto: "Possível presença de compostos orgânicos nocivos",
      texto: "Cor mais escura que a da solução padrão: indica a possibilidade de a areia ser portadora de compostos orgânicos nocivos; devem ser realizados ensaios posteriores visando à aprovação ou à rejeição do material para uso em argamassa de cimento e em concreto (8.2.1)." };
    if (cor === "igual") return { ok: null, curto: "Cor igual à da solução padrão (no limite)",
      texto: "Cor igual à da solução padrão: a norma só exige ensaios posteriores quando a cor é mais escura (8.2.1); o resultado está no limite do padrão — recomenda-se cautela e, havendo dúvida, ensaios complementares (1.2)." };
    if (cor === "clara") return { ok: true, curto: "Sem indicação de impurezas orgânicas nocivas",
      texto: "Cor mais clara que a da solução padrão: o ensaio não indica a presença de compostos orgânicos nocivos acima do padrão; não há advertência para ensaios posteriores (8.2.1). O método não detecta óleos, graxas, parafinas, glucose e outras substâncias (1.3)." };
    return null;
  }
  function nomeCor(cor) { return (CORES.filter(function (c) { return c[0] === cor; })[0] || ["", "—"])[1]; }

  FE.FICHAS["dner-me-055-95"] = {
    titulo: "Impurezas orgânicas da areia — ensaio colorimétrico",
    resumo: "200 g de areia seca ao ar + 100 ml de NaOH a 3 %, repouso de 24 h, filtragem e comparação em tubo Nessler com a solução padrão (3 ml de ácido tânico a 2 % + 97 ml de NaOH a 3 %); registro: mais clara, igual ou mais escura.",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: areia natural de rio" },
      { k: "cor", r: "Cor da solução da areia comparada à solução padrão (7.2)", tipo: "select", opcoes: CORES },
      { k: "comparacao", r: "Comparação (7.1)", tipo: "select",
        opcoes: [["visual", "Visual — tubos Nessler lado a lado"], ["colorimetro", "Colorímetro"]] },
      { k: "padraoHoje", r: "Solução padrão preparada no momento do ensaio (4.2.1.3)", tipo: "select", opcoes: [["sim", "Sim"], ["nao", "Não"]] },
      { k: "secaAr", r: "Areia seca ao ar (6.1)", tipo: "select", opcoes: [["sim", "Sim"], ["nao", "Não"]] },
    ],
    padrao: { cor: "", comparacao: "visual", padraoHoje: "sim", secaAr: "sim" },
    tabelas: function () {
      return [{
        chave: "ens", titulo: "Preparação do ensaio", rotulo: "Ensaio", iniciais: 1, min: 1, fixo: true, nomes: ["Registro"],
        dica: "os dois frascos (areia e solução padrão) ficam 24 h em repouso e são filtrados em papel qualitativo para os tubos Nessler (6.1 a 6.3)",
        linhas: [
          { k: "massa", r: "Massa de areia seca ao ar no erlenmeyer (6.1)", u: "g", ph: "200" },
          { k: "naoh", r: "Solução de hidróxido de sódio a 3 % adicionada (6.1)", u: "ml", ph: "100" },
          { k: "padrao", r: "Solução padrão no outro erlenmeyer (6.2)", u: "ml", ph: "100" },
          { k: "inicio", r: "Início do repouso (data e hora)", texto: true, ph: "ex.: 12/05 08:30" },
          { k: "fim", r: "Filtragem e comparação (data e hora)", texto: true, ph: "ex.: 13/05 08:40" },
          { k: "repouso", r: "Tempo de repouso (6.1 e 6.2)", u: "h", ph: "24" },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], x = (d.ens || [])[0] || {};
      var massa = num(x.massa), naoh = num(x.naoh), pad = num(x.padrao), rep = num(x.repouso);
      if (ok(massa) && Math.abs(massa - 200) > 1) avisos.push("Massa de areia de " + fmt(massa, 2) + " g; a norma usa 200 g (6.1).");
      if (ok(naoh) && Math.abs(naoh - 100) > 0.5) avisos.push("Volume de NaOH de " + fmt(naoh, 1) + " ml; a norma usa 100 ml (6.1).");
      if (ok(pad) && Math.abs(pad - 100) > 0.5) avisos.push("Volume de solução padrão de " + fmt(pad, 1) + " ml; a norma usa 100 ml (6.2).");
      if (ok(rep) && rep < 24) avisos.push("Repouso de " + fmt(rep, 1) + " h; a norma exige 24 h para as duas soluções (6.1 e 6.2).");
      if (P.padraoHoje === "nao") avisos.push("A solução padrão deve ser preparada no momento do ensaio (4.2.1.3).");
      if (P.secaAr === "nao") avisos.push("O ensaio é feito com areia seca ao ar (6.1).");
      var p = parecer(P.cor);
      if (!p) avisos.push("Registre a cor da solução da areia em relação à solução padrão (7.2).");
      else if (p.ok === false) avisos.push("Cor mais escura que a solução padrão: realizar ensaios posteriores antes de aprovar a areia (8.2.1).");
      return { tab: { ens: [{}] }, resultados: { cor: P.cor || "", corNome: nomeCor(P.cor || ""), parecer: p ? p.texto : "", curto: p ? p.curto : "", conforme: p ? p.ok : null },
        avisos: avisos };
    },
    rotuloImportar: function (r) { return r.corNome || "—"; },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      var cls = r.conforme === true ? "fe-ok" : r.conforme === false ? "fe-nok" : "";
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v fe-res-p">' + esc(r.cor ? r.corNome : "—") + '</div>' +
        '<div class="fe-res-r">Avaliação da cor (7.2)</div></div>' +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (r.curto ? (cls ? '<span class="' + cls + '">' + esc(r.curto) + "</span>" : esc(r.curto)) : "—") + '</div>' +
        '<div class="fe-res-r">' + esc(r.parecer || "Parecer conforme 8.2") + "</div></div></div>";
    },
    relatorio: {
      parametros: [["Soluções", "NaOH a 3 % (30 g em 1000 ml); ácido tânico a 2 % (2 g em 10 ml de álcool a 95 % + água até 100 ml); padrão = 3 ml de ácido tânico a 2 % + 97 ml de NaOH a 3 %"]],
      notas: "Ensaio qualitativo (seção 7): compara-se a cor da solução obtida com a areia à da solução padrão, nos tubos Nessler. O ensaio é uma advertência para a necessidade de exames mais completos antes da aprovação da areia (1.2); não determina óleos, graxas, parafinas, glucose e outras substâncias (1.3).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Avaliação da cor", r.cor ? r.corNome : "—"]);
        rows.push(["Parecer (8.2)", r.parecer || "—"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Areia natural de rio — mais clara que o padrão", dados: function () {
        return { ident: { registro: "EX-IO-001", camada: "Areia para concreto", origem: "Porto de areia B" },
          params: { material: "Areia natural de rio", cor: "clara", comparacao: "visual", padraoHoje: "sim", secaAr: "sim" },
          ens: [{ massa: "200,00", naoh: "100", padrao: "100", inicio: "12/05 08:30", fim: "13/05 08:40", repouso: "24" }] };
      } },
      { nome: "Areia de cava com matéria orgânica — mais escura que o padrão", dados: function () {
        return { ident: { registro: "EX-IO-002", camada: "Areia para argamassa", origem: "Cava 3" },
          params: { material: "Areia de cava", cor: "escura", comparacao: "visual", padraoHoje: "sim", secaAr: "sim" },
          ens: [{ massa: "200,05", naoh: "100", padrao: "100", inicio: "12/05 09:00", fim: "13/05 09:10", repouso: "24" }] };
      } },
      { nome: "Areia fina — cor igual à do padrão, repouso incompleto", dados: function () {
        return { ident: { registro: "EX-IO-003", camada: "Areia fina", origem: "Jazida 7" },
          params: { material: "Areia fina", cor: "igual", comparacao: "visual", padraoHoje: "nao", secaAr: "sim" },
          ens: [{ massa: "180,40", naoh: "100", padrao: "100", inicio: "12/05 14:00", fim: "13/05 08:00", repouso: "18" }] };
      } },
    ],
  };
})();
