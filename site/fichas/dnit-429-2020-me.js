/*
 * Ficha: DNIT 429/2020-ME — Agregados — Porcentagem de partículas achatadas e alongadas em agregados graúdos
 * (cálibre / paquímetro proporcional). Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  // frações = material retido em cada peneira de 4.2 (passa na anterior); a última coluna é o fundo
  var PEN = [63, 50, 37.5, 25, 19, 12.5, 9.5, 4.75];
  var SUP = [75, 63, 50, 37.5, 25, 19, 12.5, 9.5];
  function mm(v) { return fmt(v, v % 1 ? (v * 10 % 1 ? 2 : 1) : 0); }
  var NOMES = PEN.map(function (p, i) { return mm(p) + " mm (" + mm(SUP[i]) + "–" + mm(p) + ")"; }).concat(["Fundo"]);
  // Tabela 1 — massa mínima (kg) pelo tamanho nominal máximo
  var TAB1 = [[9.5, 1], [12.5, 2], [19, 5], [25, 10], [37.5, 15], [50, 20], [63, 35], [75, 60]];
  var RAZOES = [["2", "2:1"], ["3", "3:1"], ["4", "4:1"], ["5", "5:1"]];
  var MIN_PART = 200;   // 6 d
  var MIN_FR = 10;      // 6 c: frações com menos de 10 % não são ensaiadas

  function soma(a) { return a.filter(ok).reduce(function (s, v) { return s + v; }, 0); }

  FE.FICHAS["dnit-429-2020-me"] = {
    titulo: "Agregado graúdo — Partículas achatadas e alongadas (cálibre proporcional)",
    resumo: "Frações retidas com ≥ 10 % da amostra; ≥ 200 partículas por fração avaliadas no cálibre na razão escolhida (2:1 a 5:1); Pᵢ = CA / T × 100 por fração e média ponderada pelas % retidas.",
    blocos: [],
    params: [
      { k: "material", r: "Agregado graúdo ensaiado (8 a)", ph: "ex.: brita 1 granítica" },
      { k: "base", r: "Determinação (6 a; 7 a)", tipo: "select", recarrega: true,
        opcoes: [["massa", "Por massa — amostra seca em estufa a (110 ± 5) °C"], ["contagem", "Por contagem de partículas — sem secagem"]] },
      { k: "razao", r: "Razão dimensional comprimento : espessura (6 e; 8 e)", tipo: "select", opcoes: RAZOES,
        dica: "o cálibre da Figura A2 permite 2:1, 3:1, 4:1 e 5:1" },
      { k: "limite", r: "Peneiramento até a peneira (6 b)", tipo: "select", recarrega: true,
        opcoes: [["9.5", "9,5 mm — ensaia frações retidas a partir de 9,5 mm"], ["4.75", "4,75 mm — ensaia também a fração retida na 4,75 mm"]] },
      { k: "massaTotal", r: "Massa da amostra original (g) — opcional", dica: "sem ela, usa a soma das massas retidas + fundo (Anexo B)" },
      { k: "maximo", r: "Porcentagem máxima admitida (%) — opcional", dica: "limite da especificação da obra para a razão escolhida" },
    ],
    padrao: { base: "massa", razao: "5", limite: "9.5" },
    tabelas: function (d) {
      var P = d.params || {}, massa = P.base !== "contagem";
      var u = massa ? "g" : "partíc.";
      var lin = [
        { grupo: "Granulometria da amostra original (6 b, 6 c; 8 b)" },
        { k: "m", r: "Massa retida na peneira", u: "g" },
        { calc: "pr", r: "% retida (aproximação de 0,1 %, 6 c)", u: "%", casas: 1 },
        { calc: "ens", r: "Fração a ensaiar (1 = sim: ≥ 10 % e acima da peneira-limite)", u: "", casas: 0 },
        { grupo: "Avaliação no cálibre proporcional (6 d–h)" },
      ];
      if (massa) {
        lin.push({ k: "n", r: "Nº de partículas ensaiadas (mín. 200, 6 d; 8 c)", u: "partíc." },
          { k: "T", r: "T — massa total da fração ensaiada (após quarteamento, se houver)", u: "g" },
          { k: "CA", r: "CA — massa das partículas achatadas e alongadas", u: "g" });
      } else {
        lin.push({ k: "T", r: "T — nº total de partículas da fração (mín. 200, 6 d)", u: u },
          { k: "CA", r: "CA — nº de partículas achatadas e alongadas", u: u });
      }
      lin.push({ calc: "Pi", r: "Pᵢ = CA / T × 100 (eq. 1)", u: "%", casas: 2 },
        { calc: "Pr", r: "Pᵢ com aproximação de 1 % (7 a)", u: "%", casas: 0, destaque: true },
        { calc: "AC", r: "% ponderada da fração = % retida × Pᵢ / 100 (Anexo B, coluna D)", u: "%", casas: 2 });
      return [{ chave: "fr", titulo: "Frações retidas nas peneiras", rotulo: "Retido na peneira", iniciais: NOMES.length, min: NOMES.length,
        fixo: true, nomes: NOMES, dica: "preencha a massa retida de todas as peneiras (inclusive fundo); avalie no cálibre só as frações indicadas com 1", linhas: lin }];
    },
    calcular: function (d) {
      var P = d.params || {}, massaM = P.base !== "contagem", avisos = [];
      var lim = num(P.limite) || 9.5, razao = (RAZOES.filter(function (r) { return r[0] === P.razao; })[0] || RAZOES[3])[1];
      d.fr = d.fr || [];
      while (d.fr.length < NOMES.length) d.fr.push({});
      var ms = d.fr.map(function (x) { return num(x.m); });
      var somaM = soma(ms), mT = num(P.massaTotal);
      var base = ok(mT) && mT > 0 ? mT : somaM;
      if (ok(mT) && somaM > 0 && Math.abs(somaM - mT) / mT > 0.003) avisos.push("Soma das massas retidas (" + fmt(somaM, 1) + " g) difere da massa da amostra original (" + fmt(mT, 1) + " g) em " + fmt(Math.abs(somaM - mT) / mT * 100, 1) + " % — confira o peneiramento.");
      var S1 = 0, S2 = 0, linhas = [];
      var tab = d.fr.map(function (x, i) {
        var o = {}, fundo = i >= PEN.length;
        if (ok(ms[i]) && base > 0) o.pr = Math.round(ms[i] / base * 1000) / 10;   // 6 c: aproximação de 0,1 %
        var prExato = ok(ms[i]) && base > 0 ? ms[i] / base * 100 : NaN;
        var elegivel = !fundo && PEN[i] >= lim - 1e-9;
        var ensaiar = elegivel && ok(prExato) && prExato >= MIN_FR;
        if (ok(prExato)) o.ens = ensaiar ? 1 : 0;
        var T = num(x.T), CA = num(x.CA), n = num(x.n);
        var temDados = ok(T) || ok(CA);
        var nome = NOMES[i];
        if (temDados && !ensaiar) {
          avisos.push("Fração " + nome + ": " + (!elegivel ? "abaixo da peneira-limite do ensaio (6 b)" : ok(prExato) ? "tem " + fmt(o.pr, 1) + " % da amostra, menos que 10 % — não deve ser ensaiada (6 c)" : "sem massa retida informada") + "; fica fora do resultado.");
        }
        if (ensaiar && !temDados) avisos.push("Fração " + nome + " (" + fmt(o.pr, 1) + " %): tem 10 % ou mais da amostra e deve ser ensaiada (6 c, 6 d) — informe T e CA.");
        if (ensaiar && ok(T) && ok(CA)) {
          if (T <= 0 || CA < 0) { avisos.push("Fração " + nome + ": valores inválidos de T ou CA."); return o; }
          if (CA > T) { avisos.push("Fração " + nome + ": CA maior que T — confira (a parcela achatada e alongada é parte da fração)."); return o; }
          o.Pi = CA / T * 100;                     // eq. 1
          o.Pr = Math.round(o.Pi);                 // 7 a
          o.AC = prExato * o.Pi / 100;             // Anexo B: coluna A × coluna C
          S1 += prExato; S2 += o.AC;
          var nPart = massaM ? n : T;
          if (ok(nPart) && nPart < MIN_PART) avisos.push("Fração " + nome + ": " + fmt(nPart, 0) + " partículas avaliadas — o mínimo é 200 por fração (6 d).");
          if (massaM && !ok(n)) avisos.push("Fração " + nome + ": registre o número de partículas ensaiadas (8 c; mínimo 200, 6 d).");
          if (!massaM && T % 1) avisos.push("Fração " + nome + ": na determinação por contagem T e CA são números de partículas (inteiros).");
          if (massaM && ok(ms[i]) && T > ms[i] * 1.005) avisos.push("Fração " + nome + ": T (" + fmt(T, 1) + " g) maior que a massa retida na peneira (" + fmt(ms[i], 1) + " g) — confira.");
          linhas.push({ nome: nome, pr: o.pr, prExato: prExato, T: T, CA: CA, n: massaM ? n : T, Pi: o.Pi, Pr: o.Pr, AC: o.AC, reduzida: massaM && ok(ms[i]) && T < ms[i] * 0.995 });
        } else if (ensaiar && temDados) avisos.push("Fração " + nome + ": informe T e CA.");
        return o;
      });
      // TNM (3.2): peneira imediatamente acima da primeira que retém mais de 10 % (retido acumulado)
      var tnm = NaN, acum = 0;
      if (base > 0) {
        for (var i = 0; i < PEN.length; i++) {
          if (ok(ms[i])) acum += ms[i];
          if (acum / base * 100 > MIN_FR) { tnm = SUP[i]; break; }
        }
      }
      var mMin = NaN;
      TAB1.forEach(function (t) { if (Math.abs(t[0] - tnm) < 1e-9) mMin = t[1]; });
      if (ok(mMin) && base > 0 && base < mMin * 1000) avisos.push("Amostra de " + fmt(base / 1000, 2) + " kg, abaixo da massa mínima de " + mMin + " kg para TNM " + mm(tnm) + " mm (Tabela 1).");
      if (somaM > 0 && !linhas.length && !tab.some(function (o) { return o.ens === 1; })) avisos.push("Nenhuma fração acima da peneira-limite com 10 % ou mais da amostra — não há o que ensaiar (6 c).");
      var pond = S1 > 0 ? S2 / S1 * 100 : NaN;   // 7 b / Anexo B: Σ2 / Σ1
      var max = num(P.maximo), conf = ok(pond) && ok(max) ? Math.round(pond * 10) / 10 <= max + 1e-9 : null;
      if (conf === false) avisos.push("Porcentagem média ponderada de " + fmt(pond, 1) + " % acima do máximo admitido de " + fmt(max, 1) + " % (razão " + razao + ").");
      return { tab: { fr: tab }, resultados: { pond: pond, S1: S1, S2: S2, linhas: linhas, razao: razao, tnm: tnm, mMin: mMin, base: base,
        massa: massaM, max: max, conforme: conf }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      function cx(v, rot, p) { return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var h = '<div class="fe-res">' +
        cx(ok(r.pond) ? fmt(r.pond, 1) + " <small>%</small>" : "—", "Partículas achatadas e alongadas — média ponderada Σ2 / Σ1 (7 b), razão " + r.razao +
          (ok(r.max) ? " · máximo " + fmt(r.max, 1) + " %" : "") +
          (r.conforme === null ? "" : r.conforme ? ' · <span class="fe-ok">atende</span>' : ' · <span class="fe-nok">não atende</span>')) +
        cx(fmt(r.S1, 2) + " % / " + fmt(r.S2, 2) + " %", "Σ1 (% retida das frações ensaiadas) / Σ2 (Σ % retida × Pᵢ)", true) +
        cx(ok(r.tnm) ? mm(r.tnm) + " mm" + (ok(r.mMin) ? " · mín. " + r.mMin + " kg" : "") : "—", "Tamanho nominal máximo (3.2) e massa mínima (Tabela 1)", true) + "</div>";
      if (r.linhas.length) {
        h += '<table class="fe-resumo"><thead><tr><th>Fração</th><th>% retida</th><th>' + (r.massa ? "Partículas" : "T (partíc.)") + "</th><th>Pᵢ (%)</th><th>% ponderada</th></tr></thead><tbody>" +
          r.linhas.map(function (x) {
            return "<tr><td>" + esc(x.nome) + (x.reduzida ? " (reduzida)" : "") + "</td><td>" + fmt(x.pr, 1) + "</td><td>" + (ok(x.n) ? fmt(x.n, 0) : "—") + "</td><td>" + x.Pr + " (" + fmt(x.Pi, 2) + ")</td><td>" + fmt(x.AC, 2) + "</td></tr>";
          }).join("") + "<tr><td><b>Total</b></td><td><b>" + fmt(r.S1, 1) + "</b></td><td></td><td></td><td><b>" + fmt(r.S2, 2) + "</b></td></tr></tbody></table>";
      }
      return h;
    },
    relatorio: {
      notas: "Pᵢ = CA / T × 100 (eq. 1), CA e T em massa ou em número de partículas da fração i, expresso com aproximação de 1 % (7 a). Média ponderada (7 b; Anexo B) = Σ(% retida × Pᵢ) / Σ(% retida) sobre as frações ensaiadas, com Pᵢ não arredondado; expressa ao décimo. Ensaiam-se só as frações acima da peneira-limite com 10 % ou mais da amostra original (6 c), com no mínimo 200 partículas (6 d). Partícula achatada e alongada: a espessura passa inteira pela menor abertura do cálibre ajustado ao comprimento (6 f). TNM (3.2) determinado pelo retido acumulado.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Agregado graúdo ensaiado", P.material]);
        rows.push(["Razão dimensional (8 e)", r.razao]);
        rows.push(["Determinação", r.massa ? "por massa" : "por contagem de partículas"]);
        if (ok(r.tnm)) rows.push(["Tamanho nominal máximo / massa da amostra", mm(r.tnm) + " mm / " + fmt(r.base / 1000, 3) + " kg" + (ok(r.mMin) ? " (mínimo " + r.mMin + " kg, Tabela 1)" : "")]);
        r.linhas.forEach(function (x) {
          rows.push(["Fração " + x.nome + " (8 c, 8 d)", fmt(x.pr, 1) + " % retida; " + (ok(x.n) ? fmt(x.n, 0) + " partículas; " : "") +
            (r.massa ? "T = " + fmt(x.T, 1) + " g, CA = " + fmt(x.CA, 1) + " g" : "CA = " + fmt(x.CA, 0) + " de " + fmt(x.T, 0)) + "; Pᵢ = " + x.Pr + " %"]);
        });
        rows.push(["% média ponderada de partículas achatadas e alongadas (8 f)", (ok(r.pond) ? fmt(r.pond, 1) + " %" : "—") +
          (r.conforme === null ? "" : r.conforme ? " — atende ao máximo de " + fmt(r.max, 1) + " %" : " — NÃO ATENDE ao máximo de " + fmt(r.max, 1) + " %")]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Exemplo do Anexo B da norma — por massa, frações 9,5 e 4,75 mm", dados: function () {
        return { ident: { registro: "EX-PAA-001", camada: "Agregado graúdo — exemplo do Anexo B" },
          params: { material: "Agregado graúdo (Tabela B1)", base: "massa", razao: "5", limite: "4.75", massaTotal: "2468,60" },
          fr: [{}, {}, {}, {}, {}, { m: "102,30" }, { m: "2118,10", n: "212", T: "2118,10", CA: "123,70" }, { m: "248,20", n: "236", T: "248,20", CA: "45,10" }, {}],
          obs: "Dados da Tabela B1 (Anexo B). A norma não informa a razão dimensional nem o nº de partículas do exemplo: adotados 5:1 e contagens ilustrativas. Resultado da norma: 7,13 %. Não havia ensaio de partículas achatadas e alongadas nas planilhas do laboratório (5º e Unidade A)." };
      } },
      { nome: "Brita 1 — por contagem, razão 3:1, fração < 10 % descartada", dados: function () {
        return { ident: { registro: "EX-PAA-002", camada: "Brita 1 — concreto asfáltico", origem: "Pedreira A" },
          params: { material: "Brita 1 granítica", base: "contagem", razao: "3", limite: "9.5", maximo: "20" },
          fr: [{}, {}, {}, { m: "0" }, { m: "412,0" }, { m: "3148,5", T: "205", CA: "21" }, { m: "1732,2", T: "214", CA: "33" }, { m: "396,8" }, { m: "58,1" }] };
      } },
      { nome: "Brita 2 — por massa, 5:1, amostra abaixo da Tabela 1 e acima do limite", dados: function () {
        return { ident: { registro: "EX-PAA-003", camada: "Brita 2 — base de macadame", origem: "Pedreira B" },
          params: { material: "Brita 2 basáltica", base: "massa", razao: "5", limite: "9.5", maximo: "10" },
          fr: [{}, {}, {}, { m: "812" }, { m: "3920", n: "203", T: "2890", CA: "402" }, { m: "3310", n: "188", T: "1530", CA: "176" }, { m: "604" }, { m: "180" }, { m: "74" }] };
      } },
    ],
  };
})();
