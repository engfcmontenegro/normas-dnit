/*
 * Ficha: DNIT 425/2020-ME — Agregado — Índice de forma com paquímetro.
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  // frações das peneiras de ensaio (4 b): [passa, retida] em mm; a última coluna é o passante na 9,5 mm (desprezado, 6 c)
  var FR = [[75, 63], [63, 50], [50, 37.5], [37.5, 25], [25, 19], [19, 12.5], [12.5, 9.5]];
  var NOMES_FR = FR.map(function (f) { return fmt(f[1], 1).replace(",0", "") + " mm (" + fmt(f[0], 1).replace(",0", "") + "–" + fmt(f[1], 1).replace(",0", "") + ")"; })
    .concat(["Passa 9,5 mm"]);
  var LIN_BLOCO = 50;          // grãos por bloco (como na planilha de laboratório: 4 blocos de 50)
  var N_TOTAL = 200;           // 6 f: número de partículas do ensaio
  var CE_ALERTA = 10;          // c/e acima disso: conferir a leitura (critério da ficha)

  // Tabela 1 — massa mínima (kg) pela fração granulométrica (abertura da peneira)
  function massaMin(aberturaSup) {
    if (aberturaSup <= 19) return 5;      // "< 19" (a Tabela 1 não cobre exatamente 19 mm; adotado 5 kg)
    if (aberturaSup <= 25) return 10;     // "> 19 e ≤ 25"
    if (aberturaSup <= 37.5) return 15;   // "> 25 e ≤ 37,5"
    return 20;                            // "> 37,5"
  }
  function nomeBloco(j) {
    var b = Math.floor(j / 2);
    return "Grãos " + (b * LIN_BLOCO + 1) + "–" + (b * LIN_BLOCO + LIN_BLOCO) + " · " + (j % 2 ? "e" : "c");
  }
  // lê a tabela de grãos: colunas alternadas c, e; ordem = bloco 1 linhas 1..50, bloco 2 ...
  function lerGraos(cols, avisos) {
    var graos = [], invalidos = [], meios = [], trocados = [], altos = [];
    for (var b = 0; 2 * b < cols.length; b++) {
      var cc = cols[2 * b] || {}, ce = cols[2 * b + 1] || {};
      for (var k = 1; k <= LIN_BLOCO; k++) {
        var n = b * LIN_BLOCO + k, sc = cc["g" + k], se = ce["g" + k];
        var vazioC = sc === undefined || String(sc).trim() === "", vazioE = se === undefined || String(se).trim() === "";
        if (vazioC && vazioE) continue;
        var c = num(sc), e = num(se);
        if ((!vazioC && !ok(c)) || (!vazioE && !ok(e))) { invalidos.push(n); continue; }
        if (vazioC || vazioE) { meios.push(n); continue; }
        if (c <= 0 || e <= 0) { invalidos.push(n); continue; }
        if (e > c) trocados.push(n);
        else if (c / e > CE_ALERTA) altos.push(n + " (c/e = " + fmt(c / e, 1) + ")");
        graos.push({ n: n, c: c, e: e });
      }
    }
    if (invalidos.length) avisos.push("Grão(s) " + invalidos.join(", ") + ": valor inválido — o grão fica fora do cálculo até ser corrigido.");
    if (meios.length) avisos.push("Grão(s) " + meios.join(", ") + ": falta o comprimento ou a espessura — fora do cálculo.");
    if (trocados.length) avisos.push("Grão(s) " + trocados.join(", ") + ": espessura maior que o comprimento — o comprimento é a maior dimensão (3.1) e a espessura a menor (3.2); confira a leitura.");
    if (altos.length) avisos.push("Grão(s) " + altos.join(", ") + ": relação c/e acima de " + CE_ALERTA + " — confira a leitura do paquímetro.");
    return graos;
  }

  FE.FICHAS["dnit-425-2020-me"] = {
    titulo: "Agregado graúdo — Índice de forma com paquímetro",
    resumo: "Frações retidas a partir de 9,5 mm com ≥ 5 %; 200 grãos distribuídos por Nᵢ = 200 Fᵢ / ΣFᵢ; comprimento c e espessura e de cada grão; I = c médio / e médio, ao décimo.",
    blocos: [],
    params: [
      { k: "material", r: "Agregado ensaiado (8 a)", ph: "ex.: brita 1 granítica" },
      { k: "entrada", r: "Medidas", tipo: "select", recarrega: true,
        opcoes: [["graos", "Grão a grão — c e e de cada partícula (6 g)"], ["somas", "Somas por fração — Σc e Σe (medidas registradas à parte)"]] },
      { k: "massa", r: "Massa da amostra inicial (kg) — Tabela 1", dica: "mínimo: 5 kg (< 19 mm), 10 kg (19–25), 15 kg (25–37,5), 20 kg (> 37,5)" },
      { k: "maximo", r: "Índice de forma máximo admitido — opcional", ph: "2,0",
        dica: "DNIT 385/2026-ES (concreto asfáltico): I ≤ 2,0; DNIT 462/2025-EM (concreto de cimento): I ≤ 3,0" },
    ],
    padrao: { entrada: "graos" },
    tabelas: function (d) {
      var P = d.params || {}, graos = P.entrada !== "somas";
      var linFr = [
        { k: "F", r: "Fᵢ — % retida na fração (granulometria DNIT 412-ME, 6 b e 6 d)", u: "%" },
        { calc: "Fc", r: "Fᵢ considerada — retida a partir de 9,5 mm e ≥ 5 % (6 c)", u: "%", casas: 1 },
        { calc: "Ni", r: "Nᵢ = 200 × Fᵢ / ΣFᵢ, arredondado (eq. 1)", u: "grãos", casas: 0, destaque: true },
      ];
      if (graos) {
        linFr.push({ calc: "nm", r: "Grãos medidos atribuídos à fração (na ordem da tabela de grãos)", u: "grãos", casas: 0 });
      } else {
        linFr.push({ k: "nm", r: "Nº de grãos medidos", u: "grãos" },
          { k: "sc", r: "Σc — soma dos comprimentos", u: "mm" },
          { k: "se", r: "Σe — soma das espessuras", u: "mm" },
          { k: "sr", r: "Σ(c/e) — soma das relações (opcional)", u: "" });
      }
      linFr.push({ calc: "cm", r: "c médio da fração", u: "mm", casas: 2 }, { calc: "em", r: "e médio da fração", u: "mm", casas: 2 },
        { calc: "If", r: "Índice de forma da fração (c médio / e médio)", u: "", casas: 2 });
      var tabs = [{ chave: "fr", titulo: "Graduação e distribuição das partículas (6 b–f; 8 b)", rotulo: "Fração retida na peneira", iniciais: NOMES_FR.length,
        min: NOMES_FR.length, fixo: true, nomes: NOMES_FR,
        dica: graos ? "sem Fᵢ, todos os grãos formam um único conjunto (o índice do agregado não muda)" : "uma coluna por fração ensaiada",
        linhas: linFr }];
      if (graos) {
        var n = Math.max(2, (d.graos || []).length);
        var nomes = [];
        for (var j = 0; j < n; j++) nomes.push(nomeBloco(j));
        var lin = [];
        for (var k = 1; k <= LIN_BLOCO; k++) lin.push({ k: "g" + k, r: "Linha " + k, u: "mm" });
        lin.push({ calc: "n", r: "Grãos na coluna", u: "", casas: 0 }, { calc: "med", r: "Média da coluna", u: "mm", casas: 2, destaque: true });
        tabs.push({ chave: "graos", titulo: "Medidas com o paquímetro — c (comprimento) e e (espessura) em mm (6 g)", rotulo: "Coluna",
          iniciais: 8, min: 2, nomes: nomes,
          dica: "colunas aos pares c / e, 50 grãos por bloco (4 blocos = 200 grãos). Meça as frações em sequência: os primeiros N₁ grãos são da 1ª fração considerada, os N₂ seguintes da 2ª…",
          linhas: lin });
      }
      return tabs;
    },
    calcular: function (d) {
      var P = d.params || {}, graosM = P.entrada !== "somas", avisos = [];
      d.fr = d.fr || [];
      while (d.fr.length < NOMES_FR.length) d.fr.push({});
      var Fs = d.fr.map(function (x) { return num(x.F); });
      var temF = Fs.some(ok);
      var somaF = Fs.filter(ok).reduce(function (a, b) { return a + b; }, 0);
      if (temF && Math.abs(somaF - 100) > 1) avisos.push("A soma dos percentuais retidos (incluindo o passante na 9,5 mm) é " + fmt(somaF, 1) + " % — deveria ser 100 %.");
      // frações consideradas (6 c) e Nᵢ (eq. 1)
      var cons = FR.map(function (f, i) { return ok(Fs[i]) && Fs[i] >= 5; });
      var desprezadas = FR.map(function (f, i) { return ok(Fs[i]) && Fs[i] > 0 && Fs[i] < 5 ? NOMES_FR[i] : null; }).filter(Boolean);
      var somaC = FR.reduce(function (s, f, i) { return s + (cons[i] ? Fs[i] : 0); }, 0);
      var fr = d.fr.map(function (x, i) {
        var o = {};
        if (i < FR.length && cons[i]) { o.Fc = Fs[i]; o.Ni = Math.round(N_TOTAL * Fs[i] / somaC); }
        return o;
      });
      var sNi = fr.reduce(function (s, o) { return s + (ok(o.Ni) ? o.Ni : 0); }, 0);
      if (somaC && sNi !== N_TOTAL) avisos.push("ΣNᵢ = " + sNi + " grãos (arredondamento de cada Nᵢ ao inteiro mais próximo, 6 f).");
      if (desprezadas.length) avisos.push("Fração(ões) com menos de 5 % desprezada(s) (6 c): " + desprezadas.join(", ") + ".");
      if (temF && !somaC) avisos.push("Nenhuma fração retida a partir de 9,5 mm com 5 % ou mais — o ensaio não se aplica (6 c).");
      // massa mínima (Tabela 1): pela maior fração presente
      var maior = null;
      FR.forEach(function (f, i) { if (maior === null && ok(Fs[i]) && Fs[i] > 0) maior = f; });
      var massa = num(P.massa);
      if (maior && ok(massa)) {
        var mMin = massaMin(maior[0]);
        if (massa < mMin) avisos.push("Amostra inicial de " + fmt(massa, 1) + " kg, abaixo do mínimo de " + mMin + " kg para a fração " + fmt(maior[1], 1) + "–" + fmt(maior[0], 1) + " mm (Tabela 1).");
      }
      var tab = { fr: fr };
      var SC = 0, SE = 0, SR = 0, N = 0, temSR = true, porFr = [];
      if (graosM) {
        var cols = d.graos || [];
        var graos = lerGraos(cols, avisos);
        tab.graos = cols.map(function (col, j) {
          var vals = [];
          for (var k = 1; k <= LIN_BLOCO; k++) { var v = num(col["g" + k]); if (ok(v)) vals.push(v); }
          return { n: vals.length, med: vals.length ? vals.reduce(function (a, b) { return a + b; }, 0) / vals.length : NaN };
        });
        if (cols.length % 2) avisos.push("A tabela de grãos tem número ímpar de colunas: as colunas devem vir aos pares c / e.");
        // atribui os grãos às frações consideradas, em ordem
        var pos = 0;
        fr.forEach(function (o, i) {
          if (!ok(o.Ni)) return;
          var gs = graos.slice(pos, pos + o.Ni);
          pos += o.Ni;
          o.nm = gs.length;
          porFr.push({ o: o, gs: gs, i: i });
        });
        if (!somaC) porFr = [{ o: null, gs: graos }];
        else if (graos.length > pos) avisos.push((graos.length - pos) + " grão(s) além do total ΣNᵢ = " + sNi + " — não atribuídos a nenhuma fração (entram no índice do agregado).");
        graos.forEach(function (g) { SC += g.c; SE += g.e; SR += g.c / g.e; });
        N = graos.length;
        porFr.forEach(function (p) {
          if (!p.o || !p.gs.length) return;
          var sc = 0, se = 0;
          p.gs.forEach(function (g) { sc += g.c; se += g.e; });
          p.o.cm = sc / p.gs.length; p.o.em = se / p.gs.length; p.o.If = sc / se;
          if (p.gs.length < p.o.Ni) avisos.push("Fração " + NOMES_FR[p.i] + ": " + p.gs.length + " grão(s) medidos de Nᵢ = " + p.o.Ni + ".");
        });
        if (!temF && N) avisos.push("Informe os percentuais retidos Fᵢ (6 b–f) para calcular Nᵢ e o índice de cada fração; sem eles, os grãos formam um único conjunto.");
      } else {
        fr.forEach(function (o, i) {
          var x = d.fr[i] || {}, nm = num(x.nm), sc = num(x.sc), se = num(x.se), sr = num(x.sr);
          if (!ok(nm) || !ok(sc) || !ok(se) || nm <= 0 || se <= 0) {
            if (ok(o.Ni) && (ok(nm) || ok(sc) || ok(se))) avisos.push("Fração " + NOMES_FR[i] + ": informe nº de grãos, Σc e Σe.");
            return;
          }
          if (!ok(o.Ni)) avisos.push("Fração " + NOMES_FR[i] + ": medidas informadas numa fração não considerada (6 c) — conferir Fᵢ.");
          o.cm = sc / nm; o.em = se / nm; o.If = sc / se;
          if (ok(o.Ni) && nm !== o.Ni) avisos.push("Fração " + NOMES_FR[i] + ": " + fmt(nm, 0) + " grão(s) medidos; Nᵢ = " + o.Ni + " (eq. 1).");
          if (se > sc) avisos.push("Fração " + NOMES_FR[i] + ": Σe maior que Σc — confira.");
          SC += sc; SE += se; N += nm;
          if (ok(sr)) SR += sr; else temSR = false;
        });
      }
      if (N && Math.abs(N - N_TOTAL) > 0 && (!somaC || N !== sNi)) avisos.push("Foram medidos " + N + " grãos; o ensaio usa 200 partículas (6 f)" + (somaC ? ", distribuídas em ΣNᵢ = " + sNi : "") + ".");
      var cm = N ? SC / N : NaN, em = N ? SE / N : NaN;
      var I = ok(cm) && ok(em) && em > 0 ? cm / em : NaN;            // eq. 2
      var IR = ok(I) ? Math.round(I * 10) / 10 : NaN;                 // 7: décimo mais próximo
      var mRel = N && temSR ? SR / N : NaN;                           // média das relações c/e (3.3 e texto do 7)
      var max = num(P.maximo), conf = ok(IR) && ok(max) ? IR <= max + 1e-9 : null;
      if (conf === false) avisos.push("Índice de forma I = " + fmt(IR, 1) + ", acima do máximo admitido de " + fmt(max, 1) + ".");
      return { tab: tab, resultados: { I: I, IR: IR, cm: cm, em: em, N: N, sNi: sNi, mRel: mRel, max: max, conforme: conf, temF: temF && somaC > 0,
        fr: fr.map(function (o, i) { return { nome: NOMES_FR[i], F: Fs[i], Ni: o.Ni, If: o.If }; }) }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      function cx(v, rot, p) { return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var h = '<div class="fe-res">' +
        cx(ok(r.IR) ? fmt(r.IR, 1) : "—", "Índice de forma I = c médio / e médio (eq. 2)" + (ok(r.I) ? " — " + fmt(r.I, 3) : "") +
          (ok(r.max) ? " · máximo " + fmt(r.max, 1) : "") +
          (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>')) +
        cx(fmt(r.cm, 2) + " / " + fmt(r.em, 2) + " <small>mm</small>", "c médio / e médio (8 c) — " + r.N + " grãos", true) +
        cx(ok(r.mRel) ? fmt(r.mRel, 2) : "—", "Média das relações c/e dos grãos (3.3; informativo)", true) + "</div>";
      var frs = r.fr.filter(function (x) { return ok(x.Ni); });
      if (frs.length) {
        h += '<table class="fe-resumo"><thead><tr><th>Fração</th><th>Fᵢ (%)</th><th>Nᵢ</th><th>I da fração</th></tr></thead><tbody>' +
          frs.map(function (x) { return "<tr><td>" + esc(x.nome) + "</td><td>" + fmt(x.F, 1) + "</td><td>" + x.Ni + "</td><td>" + fmt(x.If, 2) + "</td></tr>"; }).join("") +
          "<tr><td><b>Total</b></td><td></td><td><b>" + r.sNi + "</b></td><td><b>" + fmt(r.IR, 1) + "</b></td></tr></tbody></table>";
      }
      return h;
    },
    relatorio: {
      notas: "Nᵢ = 200 × Fᵢ / ΣFᵢ, arredondado ao inteiro (eq. 1), sobre as frações retidas a partir de 9,5 mm com 5 % ou mais (6 c). I = c médio / e médio dos grãos medidos (eq. 2), expresso ao décimo (7). Como Nᵢ é proporcional a Fᵢ, a média sobre todos os grãos já é ponderada pelas frações. A média das relações c/e (definição 3.3) é informada à parte; o resultado da norma é o da eq. 2 (8 e).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Agregado ensaiado", P.material]);
        if (r.temF) rows.push(["Frações consideradas (Fᵢ; Nᵢ)", r.fr.filter(function (x) { return ok(x.Ni); }).map(function (x) {
          return x.nome + ": " + fmt(x.F, 1) + " %; " + x.Ni + (ok(x.If) ? "; I = " + fmt(x.If, 2) : "");
        }).join(" · ")]);
        rows.push(["c médio / e médio (8 c)", fmt(r.cm, 2) + " mm / " + fmt(r.em, 2) + " mm — " + r.N + " grãos"]);
        rows.push(["Índice de forma I (eq. 2)", (ok(r.IR) ? fmt(r.IR, 1) : "—") +
          (r.conforme === null ? "" : r.conforme ? " — atende ao máximo de " + fmt(r.max, 1) : " — NÃO ATENDE ao máximo de " + fmt(r.max, 1))]);
        if (ok(r.mRel)) rows.push(["Média das relações c/e (informativo)", fmt(r.mRel, 2)]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Brita 1 (Pedreira Z) — 200 grãos, obra B (planilha do laboratório)", dados: function () {
        return { ident: { registro: "EX-IFP-001", obra: "Obra B", origem: "Pedreira Z", camada: "Brita 1 (3/4\") — projeto de CBUQ", data: "2022-05-30", laboratorista: "Equipe" },
          params: { material: "Brita 01 (Pedreira Z)", entrada: "graos", maximo: "2,0" },
          graos: blocos(G_OBRA_B_1),
          obs: "Dados da planilha \"PROJETO TRAÇO ASFALTO.xlsx\", aba \"indice de forma b1\" (Unidade B). O grão 59 estava digitado \"21,,83\" e a planilha o excluiu da média de c (I = 1,873); aqui foi corrigido para 21,83. A granulometria (Fᵢ) não consta da planilha." };
      } },
      { nome: "Brita 1 (Obra B) — 200 grãos, I > 2,0 (planilha do laboratório; não atende DNIT 385-ES)", dados: function () {
        return { ident: { registro: "EX-IFP-002", obra: "Obra B", camada: "Brita 1 (3/4\") — projeto de CBUQ", laboratorista: "Equipe" },
          params: { material: "Brita 1", entrada: "graos", maximo: "2,0" },
          graos: blocos(G_OBRA_B_2),
          obs: "Dados da planilha \"PROJETO TRAÇO ASFALTO.xlsx\", aba \"idc forma B1 OBRA B\" (Unidade B), que o resumo do projeto compara com \"> 0,5\" — limite do método dos crivos (DNIT 424), não do paquímetro." };
      } },
      { nome: "Brita 2 para concreto — somas por fração, fração < 5 % desprezada", dados: function () {
        return { ident: { registro: "EX-IFP-003", camada: "Concreto de cimento — brita 2", origem: "Pedreira A" },
          params: { material: "Brita 2 granítica", entrada: "somas", massa: "15", maximo: "3,0" },
          fr: [{}, {}, {}, { F: "22,4", nm: "49", sc: "1871,8", se: "1004,5", sr: "95,55" }, { F: "41,3", nm: "90", sc: "2664,0", se: "1476,0", sr: "169,20" },
            { F: "27,6", nm: "60", sc: "1284,0", se: "714,0", sr: "112,20" }, { F: "4,1" }, { F: "4,6" }] };
      } },
    ],
  };

  // dados de grãos "c e; c e; ..." -> colunas alternadas c / e com 50 linhas
  function blocos(txt) {
    var pares = txt.split(";").map(function (p) { return p.trim().split(/\s+/); });
    var cols = [];
    pares.forEach(function (p, i) {
      var b = Math.floor(i / LIN_BLOCO), k = i % LIN_BLOCO + 1;
      cols[2 * b] = cols[2 * b] || {}; cols[2 * b + 1] = cols[2 * b + 1] || {};
      cols[2 * b]["g" + k] = p[0].replace(".", ",");
      cols[2 * b + 1]["g" + k] = p[1].replace(".", ",");
    });
    return cols;
  }
  // planilha "PROJETO TRAÇO ASFALTO.xlsx" (Unidade B): abas "indice de forma b1" e "idc forma B1 OBRA B" — pares c e (mm), grãos 1 a 200
  var G_OBRA_B_1 = "29 14.2;28.9 13.29;32.77 14.4;33.48 15.2;22.95 13.4;29.73 15;26.73 15.27;33.76 14.16;23.4 13.19;36.37 10.1;18.96 14.61;29.73 11.2;46.33 16.2;25.03 14.01;30.7 10.94;34.24 12.37;26.55 14.37;32.35 14.25;25.77 13.03;28.63 12.34;29.91 14.35;31.78 18.23;27.52 15.42;23.35 12.45;24.62 16.78;29.11 13.43;27.72 19.71;31.88 12.75;28.06 15.7;28.39 15.2;26.85 13.04;26.45 13.91;30.2 19.24;24.43 16.63;33.54 17.95;19.61 14.75;27.29 13.26;18.69 14.22;26.86 15.98;26.82 15.44;26.04 9.7;19.94 8.4;20.91 11.71;36.5 13.06;27.14 14.68;18.73 12.74;21.09 13.87;28.71 14.67;23.76 15.86;22.3 15.1;32.6 9.84;17.05 10.61;16.17 11.14;16.66 14.02;25.7 18.5;26.75 13.99;19.26 15.4;21.52 12.97;21.83 15.45;24.32 13.52;20.99 14.69;27.86 12.68;17.15 14.24;21.37 13.45;26.66 13.49;26.72 16.38;22.89 14.13;24.22 14.81;21.99 19.69;21.96 15.71;32.58 19.09;35.77 12.37;38.42 11.57;23.08 13.4;30.35 10.9;30.8 10.38;23.89 11.23;26.08 14.89;26 14.33;26.42 13.5;36.12 14.23;22.5 18;26.95 31.13;27.22 12.1;26.84 13.03;32.61 14.2;16.52 7.5;25.23 9.52;23.99 11.54;17.87 11.34;31.89 14;18.41 13.62;19.3 9.4;18.43 14.58;24.52 9.41;23.78 12.4;20.94 11.25;24.64 15.41;30.04 12.24;21.78 15.07;26.33 12.2;19.43 12.82;20.84 15.59;16.84 11.45;22.69 11.47;21.83 12.45;20.19 13.4;29.75 12.96;23.75 12.4;28.01 19.21;24.43 14.1;21.79 16.19;28.92 15.42;21.17 16.93;20.07 17.74;28.64 14.04;31.25 19.69;19.03 15.79;23.83 16.39;40.09 13.34;22.01 12.45;26.72 11.7;27.84 19.82;17.81 9.88;33.2 14.22;16.8 14.28;20.74 15.53;21.54 15.21;21.44 14.76;21.91 10.73;21.92 13.75;20.52 12.17;20.25 15.13;29.55 13.34;33.37 12.3;23.91 8.57;37.31 12.1;29.13 11.5;21.7 13.84;24.66 11.6;18.35 14.8;26.09 10.5;24.25 10.4;18.19 9.5;33.02 10.41;16.62 12.65;29.07 10.1;27.91 11.4;26.59 18.7;25.06 11.23;23.25 14.22;19.03 14;23.76 16.71;18.99 13.84;21.84 12.41;22.25 14.86;19.9 11.37;27.46 13.4;24.41 15.19;28.97 14.31;36.2 15.42;43.32 15.87;22.85 16.91;23.4 15.35;27.18 17.41;48.66 15.37;23.22 14.15;22.44 12.83;25.82 14.6;35.83 12;23.31 15.24;28.1 15.64;26.9 10.17;24.24 11.83;21.14 15.42;26.31 11.45;28.46 13.29;29.25 9.34;25.83 9.14;21.09 11.97;27.13 10.34;16.51 15;25.52 15.06;20.44 15.99;22.74 13.28;24.65 14.3;28.4 16.27;25.81 15.48;22.72 13.45;27.52 10.45;32.28 10.48;26.21 13.4;21.3 13.57;24.75 13.54;25.8 9.65;17.02 8.74;26.22 11.4;27.54 15.99;22.26 9.54;24.63 8.34";
  var G_OBRA_B_2 = "28.4 15.5;33.9 6.3;18.8 0.6;28 16.7;29.4 10.1;45.5 12.1;28.1 8.3;32.1 7.5;27.4 9.5;26.5 8.3;23.1 8.6;35.2 11.4;31.8 6.6;23.4 3.8;30 12.6;29.2 9.9;34.6 6;34.8 8.6;27.8 13.4;30 12.2;32.4 13.6;30 4.8;32.2 9.7;25.1 12.9;29.9 5;22.7 5.5;30.5 11;33.3 6.1;37.5 16.3;30 10.5;22.6 9.5;29.2 6.4;24.8 7.5;30.4 9.3;23.6 8.24;21.8 4.6;19.6 9;21.6 8.3;27.7 6;33.4 12.2;26.4 12.3;25 9.4;24.4 10.3;25.8 13.5;26.8 4.4;19.1 9.2;26 12;28.5 5.6;25 4.1;21.2 9.4;29.1 8.5;32.3 12.1;17.6 3.4;18.1 6.6;25.4 12;29.5 6;22.6 7.1;26 6.1;26.2 9.3;19.8 7.2;20.8 4.6;25.8 11.2;20.2 7.4;18.7 7.2;28.2 12.6;22 9.1;31.6 14.4;23.4 11.5;24.8 9.5;22.6 11.6;25.4 10.1;25.5 11.4;28.5 7;30.8 11.4;36 6.6;21.9 11.3;24.3 9;37.7 1.64;24.8 8;21.1 9.6;23.8 11.1;22.4 6.1;23.6 6.4;32.6 8.8;16.2 11.2;26.1 5;21 7.4;28.3 13.5;26.2 15.9;17.1 7.9;21.1 13.4;22.6 11.9;21.8 11.1;30.3 12.6;29.2 11.4;31.8 18.7;20.6 9.3;21.6 7.9;27.6 9.8;24.3 10.2;29.2 8.8;23.9 9.7;23.4 11.1;27.6 11.9;30.4 10;21.5 2.7;27.7 9.5;23.6 11.8;25.4 8.8;26.1 4;29.9 11.8;22.62 11.7;21.4 11.6;32.5 8.6;23.7 8.2;22.4 10.5;24.1 10;24.3 16.3;23.2 6.4;15.8 7.9;26.3 12.6;20.6 10.7;27.6 13.4;19.5 6.2;27.7 10.1;29.5 5.2;25.8 3.6;23 11.2;21 9.9;21.1 9.6;31.4 8.6;25.1 7.1;24.7 9.5;29.6 8.8;25 8.8;29.3 7.2;28.5 7.6;20.2 9.9;19.4 12.6;24.3 12.1;25.2 11.2;21.9 11.4;23.4 8.6;27.2 7.5;26.1 6.2;22.4 9;24.1 8.9;27.2 9.4;26.2 7.2;22.8 9.2;25.4 5;24.8 8.3;22.2 9.4;21.1 11.7;25.9 11.4;23.4 9.25;27.4 11.9;21.1 6.2;26.1 6.5;20 6.7;28.4 7.3;24.8 8.3;20.5 10.4;24.8 8.5;26.2 7.6;23.7 11;24.9 6.1;24.9 6.1;25.5 8.8;17.9 13.5;24.1 5.9;16.4 7.2;27.2 10.9;22.6 9.9;28.1 12.6;30.5 9.4;23.4 9.1;22.1 6.6;32.2 11.4;21.9 13.2;28.1 8.4;33.9 10.4;20 12.1;24.9 14.01;34.3 11.3;26.7 10.4;24.8 15.3;24.2 10.5;25.4 8.4;22.2 13.6;23.1 5.3;21.8 13.2;26.3 8.3;28.4 10.7;18.6 3.7;28.3 7.6;27.4 9.1;40.5 12.4;29.1 9.4;31.4 11.5";
})();
