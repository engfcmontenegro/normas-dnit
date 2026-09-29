/*
 * Ficha: DNIT 060/2004-PRO — Pavimento rígido — Inspeção visual.
 * Registra-se no motor de site/fichas.js (window.FE).
 * - Amostragem (5.2.3, Anexos A e B): n = N·S² / [e²/4·(N − 1) + S²], nunca menor que 5; espaçamento i = N/n
 *   truncado; amostras sistemáticas a partir da amostra inicial sorteada em [1:i].
 * - Levantamento por placa (5.3, Anexo E, Ficha de Inspeção do Anexo G): códigos "tipo + grau" em cada placa
 *   (ex.: "1B 13M 10", como na ficha do Anexo J); graus por medida pelas tabelas do Anexo E (tipos 3, 4, 6, 12, 16,
 *   17 e 18); regras de contagem do Anexo E (maior grau por placa, duas fissuras lineares M = uma A, placa dividida
 *   M/A sem outros defeitos, selagem por amostra, tipos 10/11/15 sem grau, buraco pelo defeito de origem).
 * - Resultado: nº de placas afetadas por tipo e grau em cada amostra (página 1 da ficha) e o ICP/conceito pela
 *   DNIT 062/2004-PRO (curvas e VDC da ficha dnit-062-2004-pro, chamada pela API FE.FICHAS).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  var TIPOS = {1: "Alçamento de placas", 2: "Fissura de canto", 3: "Placa dividida", 4: "Degrau de junta (escalonamento)", 5: "Defeito na selagem das juntas",
    6: "Desnível pavimento-acostamento", 7: "Fissuras lineares", 8: "Grandes reparos", 9: "Pequenos reparos", 10: "Desgaste superficial",
    11: "Bombeamento", 12: "Quebras localizadas", 13: "Passagem de nível", 14: "Rendilhado e escamação", 15: "Fissuras de retração plástica",
    16: "Quebra de canto (esborcinamento de canto)", 17: "Esborcinamento de juntas", 18: "Placa bailarina", 19: "Assentamento", 20: "Buracos"};
  var SEM_GRAU = { 10: 1, 11: 1, 15: 1 };  // Anexo E, 10, 11 e 15; Anexo F, 2.2
  var ORD = { B: 1, M: 2, A: 3 }, LET = ["", "B", "M", "A"];

  // ---------- graus de severidade por medida (Anexo E) ----------
  function porDesnivel(v) { return !ok(v) ? null : v < 3 ? "" : v <= 10 ? "B" : v <= 20 ? "M" : "A"; }  // 4 e 18 (tabelas 4 e 18)
  function porAcost(a, b) {  // 6: média entre o menor e o maior desnível da placa
    var m = ok(a) && ok(b) ? (a + b) / 2 : ok(a) ? a : b;
    return !ok(m) ? null : m < 25 ? "" : m <= 50 ? "B" : m <= 100 ? "M" : "A";
  }
  var T3 = { B: ["B", "B", "M"], M: ["M", "M", "A"], A: ["M", "A", "A"] };   // placa dividida: 4–5, 6–8, > 8 pedaços
  var T12 = { B: ["B", "B", "M"], M: ["B", "M", "A"], A: ["M", "A", "A"] };  // quebras localizadas: 2–3, 4–5, > 5 pedaços
  var T17 = { F: [["B", "B"], ["B", "B"]], S: [["B", "M"], ["B", "M"]], A: [["B", "M"], ["M", "A"]] };  // [largura < 100 | > 100][comprimento < 0,6 | > 0,6 m]

  // mede: {tipo, v1, v2, v3, maj} -> {sev, nota}
  function grauMedido(t, x) {
    var v1 = num(x.v1), v2 = num(x.v2), v3 = num(x.v3), maj = String(x.maj || "").trim().toUpperCase().charAt(0), s;
    switch (t) {
      case 4: case 18:
        s = porDesnivel(v1);
        return s === null ? { erro: "informe o desnível (mm)" } : s === "" ? { nulo: "desnível < 3 mm — não é defeito" } : { sev: s, base: "desnível " + fmt(v1, 0) + " mm" };
      case 6:
        s = porAcost(v1, v2);
        return s === null ? { erro: "informe o menor e o maior desnível (mm)" } : s === "" ? { nulo: "desnível médio < 25 mm — não é defeito" } :
          { sev: s, base: "desnível médio " + fmt(ok(v1) && ok(v2) ? (v1 + v2) / 2 : (ok(v1) ? v1 : v2), 0) + " mm" };
      case 3: case 12: {
        if (!ok(v1) || !ORD[maj]) return { erro: "informe o nº de pedaços e o grau da maioria das fissuras (B, M ou A)" };
        var min = t === 3 ? 4 : 2;
        if (v1 < min) return { nulo: t === 3 ? "menos de 4 pedaços — não é placa dividida (DNIT 061-TER)" : "menos de 2 pedaços" };
        var col = t === 3 ? (v1 <= 5 ? 0 : v1 <= 8 ? 1 : 2) : (v1 <= 3 ? 0 : v1 <= 5 ? 1 : 2);
        return { sev: (t === 3 ? T3 : T12)[maj][col], base: fmt(v1, 0) + " pedaços, fissuras " + maj };
      }
      case 16: {
        if (!ok(v1) || !ok(v2) || !ok(v3)) return { erro: "informe a profundidade (mm) e os dois lados da quebra (cm)" };
        if (Math.min(v2, v3) < 13) return { nulo: "lado menor que 13 cm — quebra desprezada (nota do item 16)" };
        var c = Math.min(v2, v3) > 30 ? 1 : 0;
        s = v1 <= 25 ? ["B", "B"][c] : v1 <= 50 ? ["B", "M"][c] : ["M", "A"][c];
        return { sev: s, base: "prof. " + fmt(v1, 0) + " mm, lados " + fmt(v2, 0) + " × " + fmt(v3, 0) + " cm" };
      }
      case 17: {
        var p = maj === "F" || maj === "S" || maj === "A" ? maj : "";
        if (!p || !ok(v1) || !ok(v2)) return { erro: "informe as partes (F firmes, S soltas, A ausentes), a largura (mm) e o comprimento (m)" };
        return { sev: T17[p][v1 > 100 ? 1 : 0][v2 > 0.6 ? 1 : 0], base: { F: "firmes", S: "soltas", A: "ausentes" }[p] + ", largura " + fmt(v1, 0) + " mm, comprimento " + fmt(v2, 2) + " m" };
      }
    }
    return { erro: "o grau por medida vale para os tipos 3, 4, 6, 12, 16, 17 e 18" };
  }

  // "1B 13M 10 2A" -> [{t, s}]
  function lerCodigos(txt) {
    var out = [], re = /(\d{1,2})\s*([BMAbma])?(?![0-9])/g, m;
    String(txt || "").replace(/[,;]/g, " ").replace(re, function (all, t, s) { out.push({ t: Number(t), s: s ? s.toUpperCase() : "" }); return ""; });
    return out;
  }
  function chaveAm(v, ant) { var s = String(v || "").trim(); return s || ant || "1"; }
  function amostrasSistematicas(N, n, ini) {
    var i = Math.floor(N / n), l = [];
    if (!(i >= 1)) return { i: NaN, lista: l };
    if (ok(ini)) for (var k = ini; k <= N; k += i) l.push(k);
    return { i: i, lista: l };
  }

  FE.FICHAS["dnit-060-2004-pro"] = {
    titulo: "Pavimento rígido — inspeção visual (levantamento de defeitos e ICP)",
    rotuloImportar: function (r) { return (r.amostras || []).length + " amostra(s) · ICP " + (r.icp && ok(r.icp.icpT) ? fmt(r.icp.icpT, 0) + " — " + r.icp.conceitoT : "—"); },
    resumo: "Número mínimo de amostras n = N·S² / [e²/4·(N − 1) + S²] ≥ 5 e amostragem sistemática (5.2.3, Anexos A e B); defeitos por placa (códigos do Anexo G), graus por medida e regras de contagem do Anexo E; placas afetadas por tipo e grau em cada amostra e ICP/conceito (DNIT 062-PRO).",
    blocos: [],
    params: [
      { k: "insp", r: "Tipo de inspeção (5.2)", tipo: "select", opcoes: [["amostra", "Por amostragem (5.2.2)"], ["todo", "Em todo o trecho (5.2.1)"]] },
      { k: "ntot", r: "N — número total de amostras do trecho", dica: "amostras de 20 placas (5.1.3)" },
      { k: "S", r: "S — desvio-padrão do ICP adotado", ph: "10", dica: "adotar inicialmente de 8 a 14; S = 10 é uma boa estimativa (5.2.3)", se: function (d) { return (d.params || {}).insp !== "todo"; } },
      { k: "erro", r: "e — erro admissível (± pontos de ICP)", ph: "5", dica: "o Anexo A traz as curvas para e = ± 5", se: function (d) { return (d.params || {}).insp !== "todo"; } },
      { k: "inicial", r: "Amostra inicial sorteada no intervalo [1 : i] (Anexo B)", dica: "vazio = sem lista sistemática; recomendada quando N ≥ 10 (5.2.4)", se: function (d) { return (d.params || {}).insp !== "todo"; } },
      { k: "placas", r: "Placas por amostra (padrão)", ph: "20", dica: "cada amostra tem 20 placas (5.1.3)" },
      { k: "comp", r: "Comprimento da placa (m)", ph: "6,0", dica: "placas com mais de 9 m são subdivididas imaginariamente por juntas perfeitas (5.1.3)" },
      { k: "larg", r: "Largura da placa (m)", ph: "3,8" },
      { k: "qmodo", r: "Contagem de q no ICP (DNIT 062)", tipo: "select",
        opcoes: [["tipo", "O maior valor deduzível de cada tipo (NOTA do gráfico do item 7 da DNIT 062)"], ["todos", "Todos os valores deduzíveis > 5"]] },
    ],
    padrao: { insp: "amostra", S: "10", erro: "5", placas: "20", qmodo: "tipo" },
    tabelas: function () {
      return [
        { chave: "am", titulo: "Amostras inspecionadas", rotulo: "Amostra", iniciais: 1, min: 1,
          dica: "uma coluna por amostra; amostra adicional = com defeito atípico (5.3.3); selagem das juntas: grau da amostra (Anexo F, 2.2)",
          linhas: [
            { k: "am", r: "Amostra nº", texto: true, ph: "1" },
            { k: "adic", r: "Amostra adicional (defeito atípico)? (S/N)", texto: true, ph: "N" },
            { k: "nplac", r: "Placas da amostra (vazio = padrão)", u: "" },
            { k: "sel", r: "Defeito na selagem das juntas (5) — grau B, M ou A", texto: true },
            { k: "atip", r: "Defeitos atípicos / observações (página 2)", texto: true },
            { calc: "npd", r: "Placas com defeito", u: "", casas: 0 },
            { calc: "tdv", r: "Valor deduzível total (DNIT 062)", u: "", casas: 1 },
            { calc: "vdc", r: "Valor deduzível corrigido (VDC)", u: "", casas: 1 },
            { calc: "icp", r: "ICP = 100 − VDC", u: "", casas: 0, destaque: true },
          ] },
        { chave: "pl", titulo: "Placas com defeito (página 1 da Ficha de Inspeção)", rotulo: "Placa", iniciais: 6, min: 1,
          dica: "códigos \"tipo + grau\" separados por espaço, como na ficha do Anexo J: 1B 13M 10 (tipos 10, 11 e 15 sem grau); duas fissuras lineares M: 7M 7M; placa = linha,coluna",
          linhas: [
            { k: "am", r: "Amostra nº (vazio = a da coluna anterior)", texto: true },
            { k: "pos", r: "Placa (linha, coluna)", texto: true, ph: "3,2" },
            { k: "cod", r: "Defeitos (tipo + grau)", texto: true, ph: "2A 10" },
            { k: "obs", r: "Observações / foto nº", texto: true },
            { calc: "nreg", r: "Defeitos contados na placa", u: "", casas: 0 },
          ] },
        { chave: "med", titulo: "Grau de severidade por medida (Anexo E) — opcional", rotulo: "Medida", iniciais: 1, min: 1,
          dica: "o defeito medido é acrescentado à placa indicada. Tipos 4 e 18: v1 = desnível (mm); 6: v1, v2 = menor e maior desnível (mm); 3 e 12: v1 = nº de pedaços, grau da maioria das fissuras; 16: v1 = profundidade (mm), v2 e v3 = lados (cm); 17: partes F/S/A, v1 = largura (mm), v2 = comprimento (m)",
          linhas: [
            { k: "am", r: "Amostra nº", texto: true },
            { k: "pos", r: "Placa (linha, coluna)", texto: true },
            { k: "tipo", r: "Tipo (3, 4, 6, 12, 16, 17, 18)", u: "" },
            { k: "v1", r: "v1", u: "" },
            { k: "v2", r: "v2", u: "" },
            { k: "v3", r: "v3", u: "" },
            { k: "maj", r: "Grau da maioria das fissuras (3, 12) / partes F, S, A (17)", texto: true },
            { calc: "g", r: "Grau calculado (1 = B, 2 = M, 3 = A)", u: "", casas: 0, destaque: true },
          ] },
      ];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], np0 = num(P.placas) || 20, r = {};
      // ---------- amostragem ----------
      var N = num(P.ntot), S = num(P.S), e = num(P.erro), ini = num(P.inicial);
      if (P.insp !== "todo" && ok(N) && N > 0) {
        if (ok(S) && ok(e) && e > 0) {
          r.nEq = N > 1 ? N * S * S / (e * e / 4 * (N - 1) + S * S) : N;
          r.n = Math.min(N, Math.max(5, Math.ceil(r.nEq - 1e-9)));
          if (N < 5) { r.n = N; avisos.push("Trecho com N = " + N + " < 5 amostras: inspecionar todas (o mínimo de 5 amostras não se aplica)."); }
          var sis = amostrasSistematicas(N, r.n, ini);
          r.i = sis.i; r.lista = sis.lista;
          if (ok(ini) && ok(r.i) && (ini < 1 || ini > r.i || ini !== Math.round(ini))) avisos.push("Amostra inicial " + fmt(ini, 0) + " fora do intervalo [1 : " + r.i + "] (Anexo B).");
          if (N >= 10 && !ok(ini)) avisos.push("N ≥ 10: recomenda-se a amostragem sistemática do Anexo B — informe a amostra inicial sorteada em [1 : " + r.i + "] (5.2.4).");
        } else avisos.push("Informe S e o erro admissível e para calcular o número mínimo de amostras (5.2.3).");
      } else if (P.insp !== "todo") avisos.push("Informe N, o número total de amostras do trecho (5.2.3).");
      var comp = num(P.comp);
      if (ok(comp) && comp > 9) avisos.push("Placas de " + fmt(comp, 1) + " m: considerá-las subdivididas por juntas imaginárias em partes de até 9 m — cada parte conta como uma placa (5.1.3).");

      // ---------- amostras ----------
      var mapa = {}, amostras = [], ant = null;
      var tabAm = (d.am || []).map(function (x, k) {
        var nome = chaveAm(x.am, String(k + 1)), sel = String(x.sel || "").trim().toUpperCase().charAt(0);
        if (mapa[nome]) { avisos.push("Amostra " + nome + " repetida na tabela das amostras."); return {}; }
        var a = mapa[nome] = { nome: nome, adic: /^s/i.test(String(x.adic || "")), placas: num(x.nplac) || np0, sel: ORD[sel] ? sel : "", atip: String(x.atip || "").trim(), pl: {}, col: k };
        if (String(x.sel || "").trim() && !ORD[sel]) avisos.push("Amostra " + nome + ": grau da selagem das juntas deve ser B, M ou A.");
        if (a.adic && !a.atip) avisos.push("Amostra " + nome + " adicional: descreva os defeitos atípicos, as causas prováveis e as placas (página 2, Anexo H, 5).");
        if (a.placas !== 20) avisos.push("Amostra " + nome + ": " + a.placas + " placas — a amostra é composta de 20 placas (5.1.3).");
        amostras.push(a);
        return {};
      });
      function amostra(nome) {
        if (!mapa[nome]) { mapa[nome] = { nome: nome, adic: false, placas: np0, sel: "", atip: "", pl: {}, col: -1 }; amostras.push(mapa[nome]); avisos.push("Amostra " + nome + " não consta da tabela das amostras — considerada com " + np0 + " placas, não adicional."); }
        return mapa[nome];
      }
      function placa(a, pos, colunaTxt) {
        var k = String(pos || "").replace(/\s/g, "") || colunaTxt;
        if (!a.pl[k]) a.pl[k] = { pos: k, cods: [], obs: [] };
        return a.pl[k];
      }
      // ---------- placas ----------
      var colDe = {};
      (d.pl || []).forEach(function (x, k) {
        var nome = chaveAm(x.am, ant); ant = nome;
        if (!String(x.cod || "").trim() && !String(x.pos || "").trim()) return;
        var a = amostra(nome), p = placa(a, x.pos, "col. " + (k + 1));
        var cods = lerCodigos(x.cod);
        if (String(x.cod || "").trim() && !cods.length) avisos.push("Amostra " + nome + ", placa " + p.pos + ": códigos não reconhecidos (use \"tipo + grau\", ex.: 2A 10).");
        cods.forEach(function (c) { c.orig = "levantamento"; p.cods.push(c); });
        if (x.obs) p.obs.push(x.obs);
        (colDe[nome + "|" + p.pos] = colDe[nome + "|" + p.pos] || []).push(k);
      });
      var tabMed = (d.med || []).map(function (x, k) {
        var o = {}, t = Math.round(num(x.tipo));
        if (!ok(t)) return o;
        var nome = chaveAm(x.am, null), rot = "Medida " + (k + 1) + " (tipo " + t + ")";
        var g = grauMedido(t, x);
        if (g.erro) { avisos.push(rot + ": " + g.erro + " (Anexo E)."); return o; }
        if (g.nulo) { avisos.push(rot + ": " + g.nulo + " — não registrado."); return o; }
        o.g = ORD[g.sev];
        if (!String(x.pos || "").trim()) { avisos.push(rot + ": informe a placa (linha, coluna) para somar o defeito à contagem."); return o; }
        var p = placa(amostra(nome), x.pos);
        p.cods.push({ t: t, s: g.sev, orig: "medida: " + g.base });
        return o;
      });

      // ---------- contagem (Anexo E) ----------
      var tabPl = (d.pl || []).map(function () { return {}; });
      amostras.forEach(function (a) {
        a.cont = {}; a.info = []; a.npd = 0;
        Object.keys(a.pl).forEach(function (k) {
          var p = a.pl[k], rot = "Amostra " + a.nome + ", placa " + p.pos, porTipo = {};
          p.cods.forEach(function (c) {
            if (c.t < 1 || c.t > 20) { avisos.push(rot + ": tipo " + c.t + " inexistente (1 a 20)."); return; }
            if (c.t === 20) { avisos.push(rot + ": buraco — avaliar e contar conforme o defeito que lhe deu origem (Anexo E, 20)."); return; }
            if (c.t === 5) { avisos.push(rot + ": a selagem das juntas (5) é avaliada na amostra — informe o grau na tabela das amostras (Anexo F, 2.2)."); return; }
            if (c.t === 19) { a.info.push("assentamento" + (c.s ? " " + c.s : "") + " na placa " + p.pos); return; }
            if (SEM_GRAU[c.t]) { if (c.s) avisos.push(rot + ": o tipo " + c.t + " não tem grau de severidade — grau " + c.s + " ignorado (Anexo E, " + c.t + ")."); c.s = ""; }
            else if (!c.s) { avisos.push(rot + ": informe o grau B, M ou A do tipo " + c.t + " (Anexo E)."); return; }
            (porTipo[c.t] = porTipo[c.t] || []).push(c.s);
          });
          var reg = {};
          Object.keys(porTipo).forEach(function (t) {
            var ss = porTipo[t], s;
            t = Number(t);
            if (SEM_GRAU[t]) s = "";
            else if (t === 7 && ss.filter(function (x) { return x === "M"; }).length >= 2 && ss.indexOf("A") < 0) {
              s = "A"; avisos.push(rot + ": duas fissuras lineares de grau M — registrada como uma fissura de grau A (Anexo E, 7 b).");
            } else s = LET[Math.max.apply(null, ss.map(function (x) { return ORD[x]; }))];
            reg[t] = s;
          });
          if (reg[3] === "M" || reg[3] === "A") {
            var outros = Object.keys(reg).filter(function (t) { return Number(t) !== 3; });
            if (outros.length) { avisos.push(rot + ": placa dividida de grau " + reg[3] + " — nenhum outro defeito é registrado (Anexo E, 3 b); desconsiderados os tipos " + outros.join(", ") + "."); outros.forEach(function (t) { delete reg[t]; }); }
          }
          p.reg = reg;
          var nr = Object.keys(reg).length;
          if (nr) a.npd++;
          Object.keys(reg).forEach(function (t) { var ch = t + "|" + reg[t]; a.cont[ch] = (a.cont[ch] || 0) + 1; });
          (colDe[a.nome + "|" + p.pos] || []).forEach(function (c, j) { if (!j) tabPl[c].nreg = nr; });
        });
        a.linhas = Object.keys(a.cont).map(function (ch) { var z = ch.split("|"); return { t: Number(z[0]), s: z[1], npa: a.cont[ch] }; })
          .sort(function (x, y) { return x.t - y.t || ORD[x.s] - ORD[y.s]; });
        a.linhas.forEach(function (l) { if (l.npa > a.placas) avisos.push("Amostra " + a.nome + ": " + l.npa + " placas com o tipo " + l.t + " — mais que as " + a.placas + " da amostra."); });
        if (a.npd > a.placas) avisos.push("Amostra " + a.nome + ": " + a.npd + " placas com defeito — mais que as " + a.placas + " da amostra; confira as coordenadas.");
      });

      // ---------- número de amostras inspecionadas ----------
      var normais = amostras.filter(function (a) { return !a.adic; }), adic = amostras.filter(function (a) { return a.adic; });
      r.nInsp = normais.length; r.nAdic = adic.length;
      if (ok(r.n) && normais.length < r.n) avisos.push("Foram inspecionadas " + normais.length + " amostras (além das adicionais) — o mínimo é n = " + r.n + " (5.2.3); para cada amostra adicional escolhe-se outra amostra aleatoriamente (5.3.3).");
      if (r.lista && r.lista.length) {
        var fora = normais.filter(function (a) { return ok(num(a.nome)) && r.lista.indexOf(num(a.nome)) < 0; });
        if (fora.length) avisos.push("Amostra(s) " + fora.map(function (a) { return a.nome; }).join(", ") + " fora da lista sistemática (" + r.lista.join(", ") + ") — se substituem amostras adicionais, a escolha deve ser aleatória (5.3.3).");
      }
      if (ok(N) && amostras.some(function (a) { return ok(num(a.nome)) && (num(a.nome) < 1 || num(a.nome) > N); })) avisos.push("Há amostra com número fora de 1 a N = " + N + ".");

      // ---------- ICP pela DNIT 062-PRO ----------
      var F62 = FE.FICHAS["dnit-062-2004-pro"];
      var def = [];
      amostras.forEach(function (a) {
        var base = { amostra: a.nome, adic: a.adic ? "S" : "N", nplac: String(a.placas) };
        if (a.sel) def.push(Object.assign({}, base, { tipo: "5", sev: a.sel }));
        a.linhas.forEach(function (l) { def.push(Object.assign({}, base, { tipo: String(l.t), sev: l.s, npa: String(l.npa) })); });
        if (!a.sel && a.col >= 0) avisos.push("Amostra " + a.nome + ": informe o grau do defeito na selagem das juntas (B, M ou A), ou registre a ausência do defeito nas observações.");
      });
      if (F62 && def.length) {
        var c62 = F62.calcular({ params: { placas: String(np0), insp: P.insp === "todo" ? "todo" : "amostra", ntot: P.ntot, erro: P.erro || "5", qmodo: P.qmodo || "tipo" }, def: def });
        r.icp = c62.resultados;
        c62.avisos.forEach(function (x) { if (!/Informe N|número mínimo|abaixo do mínimo/.test(x)) avisos.push("DNIT 062: " + x); });
        r.icp.amostras.forEach(function (x) {
          var a = mapa[x.nome]; if (!a) return;
          a.icp = x.icp; a.tdv = x.tdv; a.vdc = x.vdc; a.q = x.q; a.conceito = x.conceito; a.defs = x.defs;
        });
        // desvio-padrão do ICP das amostras e n recalculado (5.2.3: verificar o S adotado)
        if (ok(r.icp.S) && ok(N) && ok(e) && e > 0 && P.insp !== "todo") {
          r.Scalc = r.icp.S;
          r.nRecalc = Math.min(N, Math.max(5, Math.ceil(N * r.Scalc * r.Scalc / (e * e / 4 * (N - 1) + r.Scalc * r.Scalc) - 1e-9)));
          if (r.nRecalc > normais.length) avisos.push("Com o desvio-padrão calculado das amostras (S = " + fmt(r.Scalc, 1) + "), n = " + r.nRecalc + " > " + normais.length + " amostras inspecionadas — inspecionar mais amostras (5.2.3).");
        }
      } else if (!F62) avisos.push("Ficha da DNIT 062-PRO não carregada — o ICP não foi calculado.");
      amostras.forEach(function (a) {
        if (a.col >= 0) { var t = tabAm[a.col]; t.npd = a.npd; t.tdv = a.tdv; t.vdc = a.vdc; t.icp = a.icp; }
      });
      r.amostras = amostras;
      return { tab: { am: tabAm, pl: tabPl, med: tabMed }, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, h = '<div class="fe-res">';
      if (ok(r.n)) h += '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + r.n + '</div><div class="fe-res-r">Número mínimo de amostras (n = ' + fmt(r.nEq, 2) + (r.nEq < 5 ? " → mínimo 5" : "") + ")" +
        (ok(r.i) ? "; espaçamento i = " + r.i + (r.lista && r.lista.length ? "; amostras " + r.lista.join(", ") : "") : "") + "</div></div>";
      r.amostras.forEach(function (a) {
        h += '<div class="fe-res-item"><div class="fe-res-v' + (ok(a.icp) ? "" : " fe-res-p") + '">' + (ok(a.icp) ? fmt(a.icp, 0) : "—") + '</div><div class="fe-res-r">Amostra ' + esc(a.nome) + (a.adic ? " (adicional)" : "") +
          " — " + a.npd + " placas com defeito" + (ok(a.icp) ? "; ICP " + fmt(a.icp, 0) + " — " + esc(a.conceito) : "") + "</div></div>";
      });
      if (r.icp && ok(r.icp.icpT)) h += '<div class="fe-res-item"><div class="fe-res-v">' + fmt(r.icp.icpT, 0) + '</div><div class="fe-res-r">ICP do trecho (DNIT 062) — ' + esc(r.icp.conceitoT) + "</div></div>";
      h += "</div>";
      r.amostras.forEach(function (a) {
        if (!a.linhas.length && !a.sel) return;
        var vd = {};
        (a.defs || []).forEach(function (x) { vd[x.t + "|" + x.sev] = x; });
        h += '<table class="fe-resumo"><thead><tr><th colspan="5">Amostra ' + esc(a.nome) + (a.adic ? " (adicional)" : "") + " — " + a.placas + " placas</th></tr><tr><th>Tipo de defeito</th><th>Grau</th><th>Placas afetadas</th><th>% de placas</th><th>Valor deduzível</th></tr></thead><tbody>" +
          (a.sel ? "<tr><td>5 — " + TIPOS[5] + "</td><td>" + a.sel + "</td><td>—</td><td>—</td><td>" + fmt((vd["5|" + a.sel] || {}).vd, 1) + "</td></tr>" : "") +
          a.linhas.map(function (l) {
            var v = vd[l.t + "|" + l.s] || {};
            return "<tr><td>" + l.t + " — " + esc(TIPOS[l.t]) + "</td><td>" + (l.s || "—") + "</td><td>" + l.npa + "</td><td>" + fmt(l.npa / a.placas * 100, 1) + "</td><td>" + fmt(v.vd, 1) + "</td></tr>";
          }).join("") +
          (ok(a.icp) ? "<tr><td colspan=\"4\">Valor deduzível total / q / VDC</td><td>" + fmt(a.tdv, 1) + " / " + a.q + " / " + fmt(a.vdc, 1) + "</td></tr><tr><td colspan=\"4\"><b>ICP = 100 − VDC</b></td><td><b>" + fmt(a.icp, 0) + " — " + esc(a.conceito) + "</b></td></tr>" : "") +
          "</tbody></table>";
      });
      return h;
    },
    graficos: function (calc, d, opt) {
      opt = opt || {};
      var imp = opt.imprimir, txt = imp ? "#222" : "var(--text-dim)", borda = imp ? "#555" : "var(--border)", cor = imp ? "#c0392b" : "#e0a13a";
      return calc.resultados.amostras.filter(function (a) { return Object.keys(a.pl).length; }).slice(0, 6).map(function (a) {
        var cel = Object.keys(a.pl).map(function (k) { var m = /^(\d+)[,;x×-](\d+)$/.exec(k); return m ? { l: +m[1], c: +m[2], p: a.pl[k] } : null; }).filter(Boolean);
        if (!cel.length) return '<div class="fe-graf-vazio">Amostra ' + esc(a.nome) + ": informe as placas como linha,coluna para ver o croqui.</div>";
        var nl = Math.max(10, Math.max.apply(null, cel.map(function (x) { return x.l; }))), c0 = Math.min.apply(null, cel.map(function (x) { return x.c; })),
          c1 = Math.max.apply(null, cel.map(function (x) { return x.c; }));
        if (c1 - c0 < 1) c1 = c0 + 1;
        var nc = c1 - c0 + 1, cw = 92, ch = 34, ml = 30, mt = 24, W = ml + nc * cw + 10, H = mt + nl * ch + 22;
        var g = '<svg class="fe-graf" viewBox="0 0 ' + W + " " + H + '" xmlns="http://www.w3.org/2000/svg" font-family="Arial, sans-serif" font-size="11" style="max-width:' + W + 'px">';
        g += '<text x="' + ml + '" y="15" fill="' + txt + '" font-weight="bold">Amostra ' + esc(a.nome) + " — croqui</text>";
        for (var li = 1; li <= nl; li++) {
          var y = mt + (nl - li) * ch;
          g += '<text x="' + (ml - 6) + '" y="' + (y + ch / 2 + 4) + '" text-anchor="end" fill="' + txt + '">' + li + "</text>";
          for (var ci = 0; ci < nc; ci++) g += '<rect x="' + (ml + ci * cw) + '" y="' + y + '" width="' + cw + '" height="' + ch + '" fill="none" stroke="' + borda + '"/>';
        }
        for (ci = 0; ci < nc; ci++) g += '<text x="' + (ml + ci * cw + cw / 2) + '" y="' + (H - 6) + '" text-anchor="middle" fill="' + txt + '">' + (c0 + ci) + "</text>";
        cel.forEach(function (x) {
          var reg = x.p.reg || {}, cods = Object.keys(reg).map(function (t) { return t + reg[t]; });
          if (!cods.length) return;
          var y = mt + (nl - x.l) * ch, xx = ml + (x.c - c0) * cw;
          g += '<rect x="' + (xx + 1) + '" y="' + (y + 1) + '" width="' + (cw - 2) + '" height="' + (ch - 2) + '" fill="' + cor + '" fill-opacity="0.15"/>';
          var l1 = cods.slice(0, 3).join(" "), l2 = cods.slice(3).join(" ");
          g += '<text x="' + (xx + cw / 2) + '" y="' + (y + (l2 ? 14 : 21)) + '" text-anchor="middle" fill="' + txt + '">' + esc(l1) + "</text>";
          if (l2) g += '<text x="' + (xx + cw / 2) + '" y="' + (y + 27) + '" text-anchor="middle" fill="' + txt + '">' + esc(l2) + "</text>";
        });
        return g + "</svg>";
      });
    },
    relatorio: {
      notas: "Amostra de 20 placas com até 9 m (5.1.3). n = N·S² / [e²/4·(N − 1) + S²] (95 % de confiança), nunca menor que 5; S inicial de 8 a 14 (10 é boa estimativa); amostragem sistemática: i = N/n truncado, amostra inicial sorteada em [1 : i] (5.2.3, 5.2.4, Anexo B). " +
        "Graus de severidade e contagem pelo Anexo E: cada placa conta uma vez por tipo, com o maior grau; duas fissuras lineares de grau M = uma de grau A; placa dividida M ou A sem outros defeitos; selagem das juntas por amostra; tipos 10, 11 e 15 sem grau; buracos pelo defeito de origem; assentamento (19) não deduzível. " +
        "Graus por medida: degrau e placa bailarina 3–10 / > 10–20 / > 20 mm; desnível pavimento-acostamento (média do menor e do maior) 25–50 / > 50–100 / > 100 mm; placa dividida e quebras localizadas pelas tabelas de nº de pedaços; quebra de canto: coluna \"mais que 30 × 30\" quando os dois lados excedem 30 cm; esborcinamento de juntas: largura em mm. " +
        "ICP pela DNIT 062/2004-PRO (curvas de valores deduzíveis, VDC e conceitos).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        rows.push(["Tipo de inspeção", P.insp === "todo" ? "Em todo o trecho (5.2.1)" : "Por amostragem (5.2.2)"]);
        if (ok(r.n)) rows.push(["Número mínimo de amostras", "n = " + fmt(r.nEq, 2) + " → " + r.n + (ok(r.i) ? "; i = " + r.i : "") + (r.lista && r.lista.length ? "; amostras sistemáticas: " + r.lista.join(", ") : "")]);
        rows.push(["Amostras inspecionadas", r.nInsp + (r.nAdic ? " + " + r.nAdic + " adicional(is)" : "")]);
        r.amostras.forEach(function (a) {
          rows.push(["Amostra " + a.nome + (a.adic ? " (adicional)" : ""), (a.sel ? "5" + a.sel + "; " : "") + a.linhas.map(function (l) { return l.t + l.s + " = " + l.npa + " pl."; }).join("; ") +
            (ok(a.icp) ? " → VDT " + fmt(a.tdv, 1) + "; q = " + a.q + "; VDC " + fmt(a.vdc, 1) + "; ICP " + fmt(a.icp, 0) + " — " + a.conceito : "") + (a.info.length ? " (" + a.info.join("; ") + ")" : "") + (a.atip ? " — atípicos: " + a.atip : "")]);
        });
        if (r.icp && ok(r.icp.icpT)) rows.push(["ICP do trecho (DNIT 062)", fmt(r.icp.icpT, 1) + " — " + r.icp.conceitoT]);
        if (ok(r.Scalc)) rows.push(["Desvio-padrão do ICP / n recalculado", fmt(r.Scalc, 2) + " / " + r.nRecalc]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Ficha de inspeção do Anexo J da norma — uma amostra de 20 placas (3,8 × 6,0 m)", dados: function () {
        var PL = [["10,2", "10"], ["10,3", "15"], ["9,2", "10"], ["8,2", "10"], ["7,2", "1B 13M 10"], ["7,3", "1B 13M"], ["6,2", "1B 13M 2A 10"], ["6,3", "1B 13M"],
          ["5,2", "11 2B 10"], ["5,3", "11"], ["4,2", "2B 10"], ["3,2", "2A 10"], ["2,2", "10"], ["2,3", "15"], ["1,2", "18B"]];
        var obs = { "3,2": "buraco originado da fissura de canto (Anexo D)", "6,2": "buraco originado da fissura de canto (Anexo D)", "1,2": "placa bailarina (Anexo D)" };
        return { ident: { registro: "EX-IV-001", obra: "Exemplo da norma (Anexo J)", trecho: "Trecho 1 (km 20 – km 22)" },
          params: { insp: "todo", placas: "20", comp: "6,0", larg: "3,8", qmodo: "tipo" },
          obs: "Croqui transcrito da ficha do Anexo J. O croqui mostra o desgaste superficial (10) em 9 placas, mas a ficha registra 10 placas afetadas; a ficha adota a contagem do croqui.",
          am: [{ am: "1", adic: "N", sel: "M", atip: "selagem: falta de material, execução inadequada das juntas (Anexo H)" }],
          pl: PL.map(function (x) { return { am: "1", pos: x[0], cod: x[1], obs: obs[x[0]] || "" }; }), med: [] };
      } },
      { nome: "Inspeção por amostragem com amostras insuficientes, amostra adicional e graus por medida (dados gerados)", dados: function () {
        var am = [{ am: "2", adic: "N", sel: "B" }, { am: "5", adic: "N", sel: "B" }, { am: "8", adic: "N", sel: "M" }, { am: "11", adic: "N", sel: "M" },
          { am: "14", adic: "N", sel: "B" }, { am: "16", adic: "N", sel: "M" }, { am: "20", adic: "S", sel: "A", atip: "caixa de inspeção no pavimento — placas 4,2 e 5,2 rompidas no entorno" }];
        var pl = [
          ["2", "3,2", "7B 10"], ["2", "8,3", "15"], ["2", "9,2", "10"],
          ["5", "1,2", "2B"], ["5", "2,3", "7M 7M"], ["5", "6,2", "11"], ["5", "6,3", "11"], ["5", "7,2", "10"],
          ["8", "2,2", "16B"], ["8", "4,3", "9M 9A"], ["8", "5,2", "10 11"], ["8", "10,3", "15 17B"],
          ["11", "3,2", "10"], ["11", "7,3", "14M"],
          ["14", "5,2", "2A 20"], ["14", "9,3", "7B"],
          ["16", "4,2", "12M"], ["16", "8,2", "10"],
          ["20", "4,2", "3A 7M 10"], ["20", "5,2", "3M"], ["20", "6,2", "8A"]];
        return { ident: { registro: "EX-IV-002", data: "2026-07-21", obra: "Rodovia A — pista em concreto", trecho: "km 30 ao km 34 (pista direita)" },
          params: { insp: "amostra", ntot: "40", S: "10", erro: "5", inicial: "2", placas: "20", comp: "6,0", larg: "3,6", qmodo: "tipo" },
          am: am, pl: pl.map(function (x) { return { am: x[0], pos: x[1], cod: x[2] }; }),
          med: [{ am: "11", pos: "5,3", tipo: "4", v1: "14" }, { am: "11", pos: "6,3", tipo: "4", v1: "8" }, { am: "14", pos: "1,3", tipo: "6", v1: "40", v2: "90" },
            { am: "16", pos: "2,2", tipo: "16", v1: "30", v2: "35", v3: "40" }, { am: "16", pos: "3,2", tipo: "17", maj: "A", v1: "120", v2: "0,8" }, { am: "2", pos: "7,2", tipo: "18", v1: "2" }] };
      } },
    ],
  };
})();
