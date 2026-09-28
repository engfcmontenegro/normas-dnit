/*
 * Ficha: DNIT 450/2024-ME — Equivalente de areia.
 * Registra-se no motor de site/fichas.js (window.FE). Modelo para as fichas em arquivo próprio.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  // EA de uma determinação: leitura no topo da areia / leitura no topo da argila × 100 (eq. 1)
  function ea(det) {
    var ar = num(det.areia), ag = num(det.argila);
    return ok(ar) && ok(ag) && ag > 0 ? ar / ag * 100 : NaN;
  }
  // maior variação relativa entre as determinações e a média (8: "superior a 5 %")
  function variacao(vals) {
    var m = media(vals);
    return vals.length && ok(m) ? Math.max.apply(null, vals.map(function (v) { return Math.abs(v - m) / m * 100; })) : NaN;
  }

  FE.FICHAS["dnit-450-2024-me"] = {
    titulo: "Equivalente de areia",
    rotuloImportar: function (r) { return "EA " + (ok(r.ea) ? r.ea + " %" : "—"); },
    resumo: "Material passante na peneira de 4,8 mm; EA = leitura no topo da areia / leitura no topo da argila × 100; média de três determinações, arredondada ao inteiro.",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: areia, pó de pedra, solo-agregado" },
      { k: "refeito", r: "Ensaio refeito (seção 8)", tipo: "select", recarrega: true,
        opcoes: [["nao", "Não — três determinações"], ["sim", "Sim — três determinações iniciais + três do novo ensaio"]],
        dica: "refaz-se quando alguma determinação difere mais de 5 % da média" },
      { k: "agitacao", r: "Agitação", tipo: "select", opcoes: [["mecanica", "Agitador de proveta (7 e)"], ["manual", "Manual — 90 ciclos em ~30 s (7 f, g)"]] },
      { k: "minimo", r: "Equivalente de areia mínimo exigido (%) — opcional", dica: "da especificação (ex.: ≥ 55 % para agregado miúdo de concreto asfáltico)" },
    ],
    padrao: { refeito: "nao", agitacao: "mecanica" },
    tabelas: function (d) {
      var ref = (d.params || {}).refeito === "sim", n = ref ? 6 : 3;
      // três colunas, ou seis quando o ensaio foi refeito (ajusta antes de desenhar a tabela)
      if (Array.isArray(d.det)) { while (d.det.length < n) d.det.push({}); if (d.det.length > n) d.det.length = n; }
      return [{
        chave: "det", titulo: "Determinações", rotulo: "Det.", iniciais: 3, min: 3, fixo: true,
        nomes: ref ? ["1", "2", "3", "4 (novo)", "5 (novo)", "6 (novo)"] : ["1", "2", "3"],
        dica: "leituras após 20 min de repouso (7 k–n); topo da argila com precisão de 2 mm",
        linhas: [
          { k: "argila", r: "Leitura no topo da suspensão argilosa (7 l)", u: "mm" },
          { k: "areia", r: "Leitura no topo da areia — parafuso do pistão (7 n)", u: "mm" },
          { calc: "ea", r: "EA = areia / argila × 100 (eq. 1)", u: "%", casas: 1, destaque: true },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, ref = P.refeito === "sim", avisos = [];
      var dets = (d.det || []).map(function (x, i) {
        var o = { ea: ea(x) };
        var ar = num(x.areia), ag = num(x.argila);
        if (ok(ar) && ok(ag) && ar > ag) avisos.push("Determinação " + (i + 1) + ": leitura da areia maior que a da argila — confira.");
        return o;
      });
      var ini = dets.slice(0, 3).map(function (o) { return o.ea; }).filter(ok);
      var novo = dets.slice(3, 6).map(function (o) { return o.ea; }).filter(ok);
      var vIni = variacao(ini), vNovo = variacao(novo);
      var resultado = NaN, base = "";
      if (!ref) {
        resultado = media(ini);
        base = "média das três determinações";
        if (ini.length === 3 && vIni > 5) avisos.push("Variação de " + fmt(vIni, 1) + " % entre uma determinação e a média (limite 5 %): o ensaio deve ser refeito desde o início (8). Marque \"Ensaio refeito\" e informe as novas determinações.");
      } else if (novo.length === 3) {
        if (vNovo <= 5) { resultado = media(novo); base = "média das três determinações do novo ensaio"; }
        else { resultado = media(ini.concat(novo)); base = "média das seis determinações (novo ensaio também variou " + fmt(vNovo, 1) + " %)"; }
      } else {
        resultado = media(ini);
        base = "média das determinações iniciais (faltam as do novo ensaio)";
      }
      if (ini.length && ini.length < 3) avisos.push("O resultado é a média de três determinações (8); há " + ini.length + ".");
      var minimo = num(P.minimo), final = ok(resultado) ? Math.round(resultado) : NaN;
      if (ok(final) && ok(minimo) && final < minimo) avisos.push("EA = " + final + " %, abaixo do mínimo exigido de " + fmt(minimo, 0) + " %.");
      return { tab: { det: dets }, resultados: { ea: final, eaExato: resultado, base: base, vIni: vIni, vNovo: vNovo, minimo: minimo,
        conforme: ok(final) && ok(minimo) ? final >= minimo : null }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + (ok(r.ea) ? r.ea : "—") + ' <small>%</small></div>' +
        '<div class="fe-res-r">Equivalente de areia — ' + esc(r.base) + (ok(r.eaExato) ? " (" + fmt(r.eaExato, 1) + " %)" : "") +
        (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>') + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (ok(r.vIni) ? fmt(r.vIni, 1) + " %" : "—") +
        (ok(r.vNovo) ? " / " + fmt(r.vNovo, 1) + " %" : "") + '</div><div class="fe-res-r">Maior variação em relação à média (limite 5 %)</div></div></div>';
    },
    relatorio: {
      notas: "EA = leitura no topo da areia / leitura no topo da argila × 100 (eq. 1). Resultado: média de três determinações, arredondada ao inteiro; variação individual superior a 5 % em relação à média implica refazer o ensaio (seção 8). Variação calculada em relação à média (relativa).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {};
        var rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Equivalente de areia", (ok(r.ea) ? r.ea + " %" : "—") + " — " + r.base +
          (r.conforme === null ? "" : r.conforme ? " — atende ao mínimo de " + fmt(r.minimo, 0) + " %" : " — NÃO ATENDE ao mínimo de " + fmt(r.minimo, 0) + " %")]);
        rows.push(["Maior variação em relação à média", (ok(r.vIni) ? fmt(r.vIni, 1) + " %" : "—") + (ok(r.vNovo) ? " (novo ensaio: " + fmt(r.vNovo, 1) + " %)" : "")]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Areia — 3 determinações (planilha do laboratório)", dados: function () {
        // a planilha registra a "altura da camada de argila" como a leitura do topo da suspensão
        return { ident: { registro: "EX-EA-001", obra: "Obra A", origem: "Fornecedor A", data: "2025-10-02" },
          params: { material: "Areia", refeito: "nao", agitacao: "mecanica", minimo: "55" },
          det: [{ argila: "95", areia: "91" }, { argila: "96", areia: "90" }, { argila: "95,5", areia: "90,5" }] };
      } },
      { nome: "Pó de pedra com finos — variação acima de 5 %, ensaio refeito", dados: function () {
        return { ident: { registro: "EX-EA-002", camada: "Pó de pedra", origem: "Pedreira A" },
          params: { material: "Pó de pedra", refeito: "sim", agitacao: "mecanica", minimo: "55" },
          det: [{ argila: "142", areia: "84" }, { argila: "138", areia: "90" }, { argila: "150", areia: "82" },
            { argila: "140", areia: "86" }, { argila: "142", areia: "87" }, { argila: "144", areia: "86" }] };
      } },
      { nome: "Solo-agregado para base — EA abaixo do mínimo", dados: function () {
        return { ident: { registro: "EX-EA-003", camada: "Base — solo-brita", origem: "Jazida 4" },
          params: { material: "Solo-agregado (fração < 4,8 mm)", refeito: "nao", agitacao: "manual", minimo: "30" },
          det: [{ argila: "262", areia: "70" }, { argila: "258", areia: "72" }, { argila: "266", areia: "71" }] };
      } },
    ],
  };
})();
