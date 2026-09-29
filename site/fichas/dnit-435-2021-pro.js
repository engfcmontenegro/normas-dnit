/*
 * Ficha: DNIT 435/2021-PRO — Materiais rochosos usados em rodovias — Análise petrográfica (registro estruturado).
 * Amostra (5), lâmina delgada (6: ≥ 2,0 × 2,5 cm; espessura da ordem de 0,03 mm — 3.2), descrição macroscópica (7) e
 * microscópica (8), composição mineralógica estimada (minerais essenciais, acessórios < 5 % — 3.5 —, secundários,
 * opacos), minerais deletérios e de atenção (8 b, 8 c), classificação pelo grau de alteração (Tabela A1) e de
 * coerência (Tabela A2) e itens obrigatórios da apresentação dos resultados (9 a–h). Registra-se em window.FE.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  // Tabela A1 — alteração da rocha (símbolo, grau, indicação resumida da própria tabela quanto ao uso)
  var ALTERACAO = {
    IA: ["Rocha sã", "propriedades de agregados sem influência do intemperismo", "adequada"],
    IB: ["Rocha levemente alterada", "propriedades de agregados sem influência significativa do intemperismo", "adequada"],
    II: ["Rocha pouco alterada", "propriedades de agregados com influência significativa do intemperismo; resistência e abrasão mais fracas", "restricao"],
    III: ["Rocha moderadamente alterada", "propriedades dos agregados significativamente influenciadas pelo intemperismo; minerais com microfraturas", "restricao"],
    IV: ["Rocha muito alterada", "geralmente inadequada para agregados; pode servir a porções inferiores de pavimentos", "inadequada"],
    V: ["Rocha completamente alterada", "não adequada para agregado ou pavimentação; pode servir a aterros", "inadequada"],
    VI: ["Solo residual", "rocha convertida em solo; pode servir a aterros", "inadequada"],
  };
  // Tabela A2 — coerência
  var COERENCIA = {
    C1: ["Muito coerente", "quebra com dificuldade ao golpe do martelo; bordas cortantes resistem à lâmina de aço; superfície dificilmente riscável"],
    C2: ["Coerente", "quebra com relativa facilidade; bordas cortantes abrandadas pela lâmina; superfície riscável"],
    C3: ["Pouco coerente", "quebra com facilidade; bordas quebradas pela pressão dos dedos; sulcos acentuados com a lâmina"],
    C4: ["Friável", "esfarela ao golpe do martelo; desagrega sob pressão dos dedos"],
  };
  // minerais e feições a destacar (8 b e 8 c) — busca pelo nome digitado
  var ATENCAO = [
    [/opala/i, "opala (sílica amorfa — potencialmente reativa)"], [/calced[oô]nia/i, "calcedônia (sílica criptocristalina)"],
    [/s[ií]lica\s*amorfa|vidro\s*vulc/i, "sílica amorfa / vidro vulcânico"], [/tridimita|cristobalita/i, "tridimita/cristobalita"],
    [/pirita|pirrotita|sulfeto|marcassita/i, "sulfetos"], [/limonita/i, "limonita"], [/gipso|gipsita/i, "gipso"],
    [/ze[oó]lit/i, "zeólitas"], [/esmectita|montmorilonita|vermiculita|argilomineral\s*expansivo/i, "argilominerais expansivos"],
    [/gibbsita|alumina\s*livre/i, "alumina livre"], [/biotita|muscovita|mica|sericita|clorita/i, "micas / filossilicatos"],
  ];
  var CAT = { E: "essencial", A: "acessório", S: "secundário / de alteração", O: "opaco" };
  var SN = [["", "— não registrado"], ["sim", "Sim"], ["nao", "Não"]];
  var ITENS9 = [
    ["r9a", "a", "Denominação da rocha"], ["r9b", "b", "Fotos de campo"], ["r9c", "c", "Descrição do afloramento ou local de coleta"],
    ["r9d", "d", "Fotomicrografias com escala"], ["r9e", "e", "Descrição macroscópica formal das amostras"], ["r9f", "f", "Descrição formal das lâminas petrográficas"],
    ["r9g", "g", "Informações relevantes para o comportamento da rocha na aplicação"], ["r9h", "h", "Indicação de ensaios e análises adicionais (DRX, MEV, térmicas), quando necessário"],
  ];
  function sedim(P) { return P.genese === "sedimentar"; }
  var GRAN = { fina: "fina", media: "média", grossa: "grossa", muito: "muito grossa", inequi: "inequigranular" };
  var MICROF = { ausente: "ausente", intra: "intracristalina", inter: "intercristalina", ambas: "intra e intercristalina" };

  FE.FICHAS["dnit-435-2021-pro"] = {
    titulo: "Materiais rochosos — Análise petrográfica (macro e microscópica)",
    rotuloImportar: function (r) { return (r.denominacao || "rocha") + " · " + (r.alt || "grau de alteração —") + (r.coe ? " · " + r.coe : "") + (r.nAtencao ? " · " + r.nAtencao + " mineral(is) de atenção" : ""); },
    resumo: "Registro da análise petrográfica: amostra e lâmina (5 e 6), descrição macroscópica (7) e microscópica (8), composição mineralógica estimada, minerais deletérios, grau de alteração (Tabela A1) e de coerência (Tabela A2) e itens da apresentação dos resultados (9).",
    blocos: [],
    params: [
      { k: "denominacao", r: "Denominação da rocha (9 a)", ph: "ex.: granito, basalto, gnaisse" },
      { k: "genese", r: "Classificação genética (8 a)", tipo: "select", recarrega: true,
        opcoes: [["", "—"], ["ignea", "Ígnea / magmática"], ["metamorfica", "Metamórfica"], ["sedimentar", "Sedimentar"]] },
      { k: "tipoAmostra", r: "Tipo de amostra (7 a)", tipo: "select", opcoes: [["", "—"], ["fragmento", "Fragmento de rocha / bloco"], ["testemunho", "Testemunho de sondagem"], ["agregado", "Agregado britado"], ["seixo", "Seixo / cascalho"]] },
      { k: "coleta", r: "Local de coleta e coordenadas (5 e 9 c)", ph: "ex.: Pedreira X, frente 2 — UTM 000000 E / 0000000 N (DATUM)" },
      { k: "litotipos", r: "Litotipos da ocorrência e frequência (5)", ph: "ex.: granito 80 %, diabásio 20 %" },
      { k: "geologo", r: "Amostra coletada, fotografada e identificada por geólogo (5)", tipo: "select", opcoes: SN },
      { k: "tamanho", r: "Amostra para lâmina com tamanho de um punho cerrado, etiquetada e numerada (5)", tipo: "select", opcoes: SN },
      { k: "cor", r: "Cor (7 a / 8 a)", ph: "ex.: cinza-claro com pontuações pretas" },
      { k: "granulacao", r: "Granulação — tamanho predominante dos minerais", tipo: "select",
        opcoes: [["", "—"], ["fina", "Fina (< 1 mm)"], ["media", "Média (1 a 5 mm)"], ["grossa", "Grossa (5 a 30 mm)"], ["muito", "Muito grossa (> 30 mm)"], ["inequi", "Inequigranular / porfirítica"]] },
      { k: "textura", r: "Textura (7 a / 8 a)", ph: "ex.: fanerítica, hipidiomórfica, granoblástica" },
      { k: "estrutura", r: "Estruturas (foliação, lineação, dobras, vesículas, fraturas, poros...)", ph: "ex.: maciça; fraturas fechadas" },
      { k: "foliada", r: "Rocha foliada / com lineação (6)", tipo: "select", recarrega: true,
        opcoes: [["nao", "Não"], ["foliada", "Foliada — lâmina perpendicular à foliação"], ["lineacao", "Foliada com lineação — lâminas paralela e perpendicular à lineação"]] },
      { k: "laminaOrient", r: "Orientação das lâminas preparadas (6)", ph: "ex.: perpendicular à foliação", se: function (d) { return (d.params || {}).foliada !== "nao"; } },
      { k: "alteracao", r: "Grau de alteração (7 b, 9 e Tabela A1)", tipo: "select",
        opcoes: [["", "—"]].concat(Object.keys(ALTERACAO).map(function (k) { return [k, k + " — " + ALTERACAO[k][0]]; })) },
      { k: "coerencia", r: "Grau de coerência (7 b, 9 e Tabela A2)", tipo: "select",
        opcoes: [["", "—"]].concat(Object.keys(COERENCIA).map(function (k) { return [k, k + " — " + COERENCIA[k][0]]; })) },
      { k: "evidencias", r: "Evidências de alteração (oxidação de opacos, cloritização, sericitização...) (7 a / 8 b)", ph: "ex.: sericitização incipiente dos plagioclásios" },
      { k: "intemperismo", r: "A alteração se deu por intemperismo? (8 b)", tipo: "select", opcoes: [["", "—"], ["sim", "Sim — intempérica"], ["nao", "Não — hidrotermal / deutérica"], ["misto", "Ambos"]] },
      { k: "microfis", r: "Microfissuração (8 b e 9)", tipo: "select",
        opcoes: [["", "—"], ["ausente", "Ausente"], ["intra", "Intracristalina"], ["inter", "Intercristalina"], ["ambas", "Intra e intercristalina"]] },
      { k: "preench", r: "Fissuras preenchidas? tipo de preenchimento (8 b)", ph: "ex.: abertas / preenchidas por carbonato" },
      { k: "vazios", r: "Vazios ou poros — densidade e dimensões (8 b)", ph: "ex.: raros, < 0,5 mm" },
      { k: "cimento", r: "Cimento (sedimentares: carbonato, óxidos de ferro, sílica)", se: function (d) { return sedim(d.params || {}); } },
      { k: "matriz", r: "Matriz (sedimentares)", se: function (d) { return sedim(d.params || {}); } },
      { k: "arcabouco", r: "Arcabouço — composição, tamanho, arredondamento, esfericidade, seleção e contatos (7 c, 8 d)", se: function (d) { return sedim(d.params || {}); } },
      { k: "estSed", r: "Estruturas sedimentares (7 c, 8 d)", se: function (d) { return sedim(d.params || {}); } },
      { k: "adicionais", r: "Análises adicionais realizadas ou indicadas (4.2 d–h, 9 h)", ph: "ex.: DRX para argilominerais" },
      { k: "aplicacao", r: "Informações relevantes para a aplicação (9 g)", ph: "ex.: agregado para concreto asfáltico" },
    ].concat(ITENS9.map(function (c) { return { k: c[0], r: "Relatório contém: " + c[2] + " (9 " + c[1] + ")", tipo: "select", opcoes: SN }; })),
    padrao: { foliada: "nao" },
    tabelas: function () {
      return [
        { chave: "lam", titulo: "Lâminas delgadas (6)", rotulo: "Lâmina", iniciais: 1, min: 1,
          dica: "preparo a critério do laboratório; posição do corte e número de lâminas a cargo do geólogo",
          linhas: [
            { k: "id", r: "Identificação da lâmina / amostra", texto: true },
            { k: "la", r: "Dimensão da porção analisada — lado 1", u: "cm", ph: "≥ 2,0" },
            { k: "lb", r: "Dimensão da porção analisada — lado 2", u: "cm", ph: "≥ 2,5" },
            { k: "esp", r: "Espessura da seção delgada", u: "mm", ph: "≈ 0,03" },
            { calc: "area", r: "Área analisada", u: "cm²", casas: 1 },
          ] },
        { chave: "min", titulo: "Composição mineralógica estimada (8 a e 8 c)", rotulo: "Mineral", iniciais: 5, min: 1,
          dica: "categoria: E = essencial, A = acessório (< 5 %, 3.5), S = secundário / de alteração, O = opaco",
          linhas: [
            { k: "nome", r: "Mineral / constituinte", texto: true },
            { k: "cat", r: "Categoria (E, A, S ou O)", texto: true },
            { k: "pct", r: "Proporção estimada (% em volume)", u: "%" },
            { k: "tam", r: "Tamanho dos cristais", u: "mm" },
            { k: "obs", r: "Alteração / observações", texto: true },
          ] },
      ];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var lam = (d.lam || []).map(function (x, i) {
        var o = {}, a = num(x.la), b = num(x.lb), e = num(x.esp), rot = "Lâmina " + (x.id || i + 1);
        o.area = ok(a) && ok(b) ? a * b : NaN;
        if (ok(a) && ok(b) && (Math.min(a, b) < 2.0 || Math.max(a, b) < 2.5)) avisos.push(rot + ": porção analisada de " + fmt(a, 1) + " × " + fmt(b, 1) + " cm — mínimo 2,0 cm × 2,5 cm (6).");
        if (ok(e) && (e < 0.02 || e > 0.05)) avisos.push(rot + ": espessura de " + fmt(e, 3) + " mm — a seção delgada é da ordem de 0,03 mm (3.2).");
        return o;
      });
      var tot = { E: 0, A: 0, S: 0, O: 0, outro: 0 }, soma = 0, atencao = [], mins = [];
      (d.min || []).forEach(function (x, i) {
        var p = num(x.pct), c = String(x.cat || "").trim().toUpperCase().charAt(0), nome = String(x.nome || "").trim();
        if (!nome && !ok(p)) return;
        if (ok(p)) { soma += p; if (CAT[c]) tot[c] += p; else tot.outro += p; }
        if (nome && !CAT[c]) avisos.push("Mineral \"" + nome + "\": informe a categoria (E, A, S ou O).");
        if (c === "A" && ok(p) && p >= 5) avisos.push("\"" + nome + "\" como acessório com " + fmt(p, 1) + " % — minerais acessórios perfazem menos de 5 % do volume (3.5); reclassifique como essencial.");
        ATENCAO.forEach(function (a) { if (a[0].test(nome)) atencao.push({ nome: nome, tipo: a[1], pct: p }); });
        mins.push({ nome: nome, cat: CAT[c] || "—", pct: p, obs: x.obs || "" });
      });
      if (mins.length && Math.abs(soma - 100) > 5) avisos.push("As proporções estimadas somam " + fmt(soma, 1) + " % — confira (esperado ≈ 100 %).");
      if (mins.length && !tot.E) avisos.push("Nenhum mineral essencial informado — são eles que definem a classificação da rocha (3.4).");
      atencao.forEach(function (a) { if (!/mica/.test(a.tipo)) avisos.push("Presença de " + a.tipo + ": \"" + a.nome + "\"" + (ok(a.pct) ? " — " + fmt(a.pct, 1) + " %" : "") + " — registre a quantidade e avalie o efeito no uso pretendido (8 b, 8 c, 9 g)."); });
      // classificação
      var A = ALTERACAO[P.alteracao], Co = COERENCIA[P.coerencia];
      if (!A) avisos.push("Classifique o grau de alteração pela Tabela A1 (7 b e 9).");
      if (!Co) avisos.push("Classifique o grau de coerência pela Tabela A2 (7 b e 9)" + (sedim(P) ? " — obrigatório para rochas sedimentares." : "."));
      if (A && tot.S > 2 && P.alteracao === "IA") avisos.push("Rocha classificada como sã (IA) com " + fmt(tot.S, 1) + " % de minerais secundários — confira a classificação (9: o grau decorre da quantidade de minerais alterados e secundários; alerta acima de 2 %, critério da ficha).");
      if (sedim(P)) ["cimento", "matriz", "arcabouco"].forEach(function (k) { if (!P[k]) avisos.push("Rocha sedimentar: descreva " + ({ cimento: "o cimento", matriz: "a matriz", arcabouco: "o arcabouço (composição, tamanho, arredondamento, seleção, contatos)" })[k] + " (7 c e 8 d)."); });
      if (P.foliada !== "nao" && !P.laminaOrient) avisos.push(P.foliada === "lineacao" ? "Rocha com lineação: prepare lâminas paralela e perpendicular à lineação, ambas perpendiculares à foliação (6)." : "Rocha foliada: recomenda-se lâmina perpendicular à foliação (6).");
      if (P.granulacao === "inequi") avisos.push("Rocha inequigranular: garanta que o corte da lâmina não seja ocupado por um único fenocristal (NOTA de 5).");
      if (P.geologo === "nao") avisos.push("As amostras devem ser coletadas, fotografadas, identificadas e marcadas por geólogo (5).");
      if (P.tamanho === "nao") avisos.push("A amostra para lâmina pode ter o tamanho de um punho cerrado, etiquetada e numerada (5).");
      var faltam = ITENS9.filter(function (c) { return P[c[0]] !== "sim"; });
      ITENS9.forEach(function (c) { if (P[c[0]] === "nao") avisos.push("A apresentação dos resultados deve conter: " + c[2].toLowerCase() + " (9 " + c[1] + ")."); });
      var uso = A ? A[2] : "";
      return { tab: { lam: lam, min: [] }, resultados: {
        denominacao: P.denominacao || "", genese: P.genese || "", alt: A ? P.alteracao + " — " + A[0] : "", altDesc: A ? A[1] : "", uso: uso,
        coe: Co ? P.coerencia + " — " + Co[0] : "", coeDesc: Co ? Co[1] : "", mins: mins, soma: soma, tot: tot, atencao: atencao, nAtencao: atencao.filter(function (a) { return !/mica/.test(a.tipo); }).length,
        itensOk: ITENS9.length - faltam.length, itensTotal: ITENS9.length, itensFaltam: faltam.map(function (c) { return "9 " + c[1]; }) }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      function cx(v, rot, p) { return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var usoTxt = r.uso === "adequada" ? '<span class="fe-ok">propriedades de agregado preservadas</span>' : r.uso === "restricao" ? '<span class="fe-nok">influência significativa do intemperismo</span>' : r.uso === "inadequada" ? '<span class="fe-nok">inadequada para agregado</span>' : "";
      var h = '<div class="fe-res">' + cx(esc(r.alt || "—"), "Grau de alteração (Tabela A1)" + (usoTxt ? " · " + usoTxt : "")) +
        cx(esc(r.coe || "—"), "Grau de coerência (Tabela A2)", true) +
        cx(esc(r.denominacao || "—"), "Denominação" + (r.genese ? " — rocha " + ({ ignea: "ígnea", metamorfica: "metamórfica", sedimentar: "sedimentar" })[r.genese] : ""), true) +
        cx(r.itensOk + " / " + r.itensTotal, "Itens da apresentação dos resultados (9)" + (r.itensFaltam.length ? " — pendentes: " + esc(r.itensFaltam.join(", ")) : ""), true) + "</div>";
      if (r.altDesc || r.coeDesc) h += '<p class="fe-res-r">' + (r.altDesc ? "Tabela A1: " + esc(r.altDesc) + ". " : "") + (r.coeDesc ? "Tabela A2: " + esc(r.coeDesc) + "." : "") + "</p>";
      if (r.mins.length) h += '<table class="fe-resumo"><tr><th>Mineral</th><th>Categoria</th><th>%</th><th>Observações</th></tr>' + r.mins.map(function (m) {
        return "<tr><td>" + esc(m.nome) + "</td><td>" + esc(m.cat) + "</td><td>" + fmt(m.pct, 1) + "</td><td>" + esc(m.obs) + "</td></tr>";
      }).join("") + "<tr><td><b>Total</b></td><td>essenciais " + fmt(r.tot.E, 1) + " · acessórios " + fmt(r.tot.A, 1) + " · secundários " + fmt(r.tot.S, 1) + " · opacos " + fmt(r.tot.O, 1) + "</td><td><b>" + fmt(r.soma, 1) + "</b></td><td></td></tr></table>";
      if (r.atencao.length) h += '<p class="fe-res-r">Minerais de atenção (8 b, 8 c): ' + r.atencao.map(function (a) { return esc(a.nome) + " — " + esc(a.tipo) + (ok(a.pct) ? " (" + fmt(a.pct, 1) + " %)" : ""); }).join("; ") + "</p>";
      return h;
    },
    graficos: function (calc, d, opt) {
      opt = opt || {};
      var r = calc.resultados, mins = r.mins.filter(function (m) { return ok(m.pct) && m.pct > 0; });
      if (!mins.length) return ['<div class="fe-graf-vazio">O gráfico da composição aparece com as proporções dos minerais.</div>'];
      var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)";
      var corCat = { "essencial": imp ? "#1f5fbf" : "#4f8cff", "acessório": imp ? "#2e8b57" : "#34c38f", "secundário / de alteração": imp ? "#c77d12" : "#e0a13a", "opaco": imp ? "#555" : "#8892a6", "—": imp ? "#999" : "#9aa3b2" };
      var W = opt.w || 560, rowH = 20, m = { l: 150, r: 60, t: 10 }, H = m.t + mins.length * rowH + 30;
      var max = Math.max.apply(null, mins.map(function (x) { return x.pct; }));
      var s = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="10.5">';
      mins.slice().sort(function (a, b) { return b.pct - a.pct; }).forEach(function (x, i) {
        var y = m.t + i * rowH, w = x.pct / max * (W - m.l - m.r);
        s += '<text x="' + (m.l - 6) + '" y="' + (y + 13) + '" text-anchor="end" fill="' + txt + '">' + esc(x.nome.length > 24 ? x.nome.slice(0, 23) + "…" : x.nome) + "</text>";
        s += '<rect x="' + m.l + '" y="' + (y + 3) + '" width="' + w.toFixed(1) + '" height="' + (rowH - 6) + '" fill="' + corCat[x.cat] + '"/>';
        s += '<text x="' + (m.l + w + 4) + '" y="' + (y + 13) + '" fill="' + txt + '">' + fmt(x.pct, 1) + " %</text>";
      });
      var ly = H - 10, lx = m.l;
      ["essencial", "acessório", "secundário / de alteração", "opaco"].forEach(function (c) {
        s += '<rect x="' + lx + '" y="' + (ly - 9) + '" width="10" height="10" fill="' + corCat[c] + '"/><text x="' + (lx + 14) + '" y="' + ly + '" fill="' + txt + '">' + c + "</text>";
        lx += 20 + c.length * 5.6;
      });
      return [s + "</svg>"];
    },
    relatorio: {
      notas: "Classificação pelo grau de alteração (Tabela A1: IA a VI) e pela coerência (Tabela A2: C1 a C4), com base na quantidade de minerais alterados e secundários, na microfissuração e nas demais feições (seção 9). A indicação de uso resume a própria Tabela A1. Minerais acessórios: menos de 5 % do volume (3.5). Lâmina: porção analisada de no mínimo 2,0 cm × 2,5 cm (6), espessura da ordem de 0,03 mm (3.2). Fotos de campo e fotomicrografias com escala (9 b e 9 d) podem ser anexadas à ficha.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        rows.push(["Denominação da rocha (9 a)", (r.denominacao || "—") + (r.genese ? " — " + ({ ignea: "ígnea / magmática", metamorfica: "metamórfica", sedimentar: "sedimentar" })[r.genese] : "")]);
        if (P.coleta) rows.push(["Local de coleta (9 c)", P.coleta]);
        rows.push(["Descrição macroscópica (7)", [P.cor, P.granulacao ? "granulação " + (GRAN[P.granulacao] || P.granulacao) : "", P.textura, P.estrutura].filter(Boolean).join("; ") || "—"]);
        rows.push(["Grau de alteração (Tabela A1)", r.alt ? r.alt + " — " + r.altDesc : "não classificado"]);
        rows.push(["Grau de coerência (Tabela A2)", r.coe ? r.coe + " — " + r.coeDesc : "não classificado"]);
        if (r.mins.length) rows.push(["Composição mineralógica (8)", r.mins.map(function (m) { return m.nome + " " + fmt(m.pct, 1) + " % (" + m.cat + ")"; }).join("; ")]);
        rows.push(["Microfissuração / alteração (8 b)", [P.microfis ? "microfissuração " + (MICROF[P.microfis] || P.microfis) : "", P.evidencias, P.preench, P.vazios].filter(Boolean).join("; ") || "—"]);
        if (P.genese === "sedimentar") rows.push(["Sedimentar (7 c, 8 d)", ["cimento: " + (P.cimento || "—"), "matriz: " + (P.matriz || "—"), "arcabouço: " + (P.arcabouco || "—"), P.estSed].filter(Boolean).join("; ")]);
        rows.push(["Minerais de atenção (8 b, 8 c)", r.atencao.length ? r.atencao.map(function (a) { return a.nome + " (" + a.tipo + (ok(a.pct) ? ", " + fmt(a.pct, 1) + " %" : "") + ")"; }).join("; ") : "nenhum identificado"]);
        if (P.aplicacao) rows.push(["Informações para a aplicação (9 g)", P.aplicacao]);
        if (P.adicionais) rows.push(["Análises adicionais (9 h)", P.adicionais]);
        rows.push(["Itens da apresentação (9)", r.itensOk + " de " + r.itensTotal + (r.itensFaltam.length ? " — pendentes: " + r.itensFaltam.join(", ") : "")]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Granito são para brita — rocha IA, coerente", dados: function () {
        var p = { denominacao: "Biotita granito", genese: "ignea", tipoAmostra: "fragmento", coleta: "Pedreira X — frente 1, UTM 000000 E / 0000000 N (SIRGAS 2000)", litotipos: "granito 100 %",
          geologo: "sim", tamanho: "sim", cor: "cinza-claro com pontuações pretas", granulacao: "media", textura: "fanerítica, hipidiomórfica granular", estrutura: "maciça; fraturas fechadas",
          foliada: "nao", alteracao: "IA", coerencia: "C1", evidencias: "sericitização incipiente em núcleos de plagioclásio", intemperismo: "nao", microfis: "intra", preench: "fissuras fechadas, sem preenchimento",
          vazios: "ausentes", aplicacao: "Agregado graúdo para concreto asfáltico e base granular", adicionais: "não necessárias" };
        ITENS9.forEach(function (c) { p[c[0]] = "sim"; });
        return { ident: { registro: "EX-PT-001", obra: "Obra A", origem: "Pedreira X", camada: "Rocha para brita", data: "2025-07-14" }, params: p,
          lam: [{ id: "L-01", la: "2,5", lb: "3,5", esp: "0,03" }],
          min: [{ nome: "Quartzo", cat: "E", pct: "30", tam: "2", obs: "extinção ondulante" }, { nome: "Feldspato potássico (microclínio)", cat: "E", pct: "35", tam: "4" },
            { nome: "Plagioclásio (oligoclásio)", cat: "E", pct: "25", tam: "3", obs: "sericitização incipiente" }, { nome: "Biotita", cat: "E", pct: "7", tam: "1" },
            { nome: "Opacos (magnetita)", cat: "O", pct: "1,5", tam: "0,3" }, { nome: "Titanita, apatita, zircão", cat: "A", pct: "1", tam: "0,2" }, { nome: "Sericita", cat: "S", pct: "0,5", tam: "0,05" }] };
      } },
      { nome: "Basalto alterado com argilominerais — rocha III, lâmina pequena e itens pendentes", dados: function () {
        return { ident: { registro: "EX-PT-002", obra: "Obra B", origem: "Pedreira Y", camada: "Rocha para brita", data: "2025-09-02" },
          params: { denominacao: "Basalto amigdaloidal", genese: "ignea", tipoAmostra: "testemunho", geologo: "sim", tamanho: "nao", cor: "cinza-escuro a castanho", granulacao: "fina",
            textura: "afanítica, intergranular", estrutura: "vesículas preenchidas", foliada: "nao", alteracao: "III", coerencia: "C3",
            evidencias: "oxidação de opacos; esmectita nas amígdalas", intemperismo: "sim", microfis: "ambas", vazios: "amígdalas de até 5 mm", adicionais: "DRX para confirmar esmectita",
            r9a: "sim", r9b: "nao", r9c: "sim", r9d: "nao", r9e: "sim", r9f: "sim" },
          lam: [{ id: "L-07", la: "1,8", lb: "2,4", esp: "0,03" }],
          min: [{ nome: "Plagioclásio (labradorita)", cat: "E", pct: "45" }, { nome: "Piroxênio (augita)", cat: "E", pct: "30" }, { nome: "Opacos", cat: "O", pct: "6" },
            { nome: "Vidro vulcânico", cat: "E", pct: "4" }, { nome: "Esmectita", cat: "S", pct: "8", obs: "preenchendo amígdalas" }, { nome: "Calcedônia", cat: "A", pct: "6", obs: "em amígdalas" }, { nome: "Limonita", cat: "S", pct: "1" }] };
      } },
    ],
  };
})();
