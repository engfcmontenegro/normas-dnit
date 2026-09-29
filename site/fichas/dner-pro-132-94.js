/*
 * Ficha: DNER-PRO 132/94 — Inspeção visual de embalagens de microesferas de vidro retrorrefletivas.
 * Lote = sacos de 25 kg com a mesma data de fabricação (3.1). Inspeção normal (Tabela 1: amostragem simples ou dupla)
 * ou rigorosa na reinspeção de lote rejeitado e recondicionado (Tabela 2, 4.4); contagem de sacos defeituosos pelos
 * defeitos de 3.7 (deficiência de enchimento verificada por pesagem, 3.7.2) e parecer ACEITO / REJEITADO /
 * 2ª AMOSTRAGEM (4.3); reposição dos defeituosos da amostra (4.5).
 *
 * Este arquivo também define FE.inspecaoVisual(cfg), o montador das fichas de inspeção visual de embalagens por
 * plano de amostragem simples/dupla — usado aqui e pela DNER-PRO 231/94 (recipientes de tinta), que carrega depois.
 * Registra-se em window.FE.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var SN = [["", "— não verificado"], ["sim", "Sim"], ["nao", "Não"]];

  // plano: [lote de, até, [n1, Ac1, Re1], [n2, Ac2, Re2] (Ac2/Re2 sobre o total das duas amostras) ou null]
  function planoDe(tab, N) { for (var i = 0; i < tab.length; i++) if (N >= tab[i][0] && N <= tab[i][1]) return tab[i]; return null; }

  // cfg: { id, titulo, resumo, un: ["saco", "sacos"], genero: "o"|"a"?, T1, T2, tabRef: {t1, t2}, secoes: {...},
  //        defeitos: [[k, rótulo]], nota1 (bool: amostra ≥ lote → inspecionar todos), paramsExtra, padrao, checks: [[k, seção, texto, se(d)]],
  //        pesagem: { titulo, declarado(P) -> kg, rotDecl }, notas, exemplos, extraAvisos(d, r, avisos) }
  FE.inspecaoVisual = function (cfg) {
    var U = cfg.un[0], Us = cfg.un[1], S = cfg.secoes;
    function rig(d) { return ((d && d.params) || {}).inspecao === "rigorosa"; }
    function tabela(d) { return rig(d) ? cfg.T2 : cfg.T1; }
    function nomeTab(d) { return rig(d) ? cfg.tabRef.t2 : cfg.tabRef.t1; }

    function avaliar(d) {
      var P = d.params || {}, N = num(P.lote), T = tabela(d), pl = ok(N) ? planoDe(T, N) : null, I = d.insp || [], r = { N: N, pl: pl, tab: nomeTab(d) };
      var i1 = I[0] || {}, i2 = I[1] || {};
      r.n1 = num(i1.nInsp); r.d1 = num(i1.nDef); r.n2 = num(i2.nInsp); r.d2 = num(i2.nDef);
      if (!pl) {
        r.parecer = "PENDENTE";
        r.motivo = ok(N) ? "lote de " + fmt(N, 0) + " " + Us + " fora da " + r.tab + " (" + T[0][0] + " a " + fmt(T[T.length - 1][1], 0) + ")" : "informe o tamanho do lote";
        return r;
      }
      r.req1 = Math.min(pl[2][0], N); r.todos1 = pl[2][0] >= N;
      var q1 = pl[3] ? "1ª amostra" : "amostra única";
      if (!ok(r.d1)) { r.parecer = "PENDENTE"; r.motivo = "inspeção da " + q1 + " não registrada"; return r; }
      if (ok(r.n1) && r.n1 < r.req1) { r.parecer = "PENDENTE"; r.motivo = q1 + " com " + fmt(r.n1, 0) + " " + Us + " — a " + r.tab + " pede " + r.req1; return r; }
      if (r.d1 <= pl[2][1]) { r.parecer = "ACEITO"; r.motivo = q1 + ": " + r.d1 + " defeituoso(s) ≤ número de aceitação " + pl[2][1] + " (" + S.ac1 + ")"; return r; }
      if (r.d1 >= pl[2][2]) { r.parecer = "REJEITADO"; r.motivo = q1 + ": " + r.d1 + " defeituoso(s) ≥ número de rejeição " + pl[2][2] + " (" + S.ac1 + ")"; return r; }
      // entre Ac e Re: segunda amostra, retirada do lote desfalcado da primeira
      r.req2 = Math.min(pl[3][0], Math.max(0, N - (ok(r.n1) ? r.n1 : pl[2][0])));
      if (!ok(r.d2)) { r.parecer = "2ª AMOSTRAGEM"; r.motivo = "1ª amostra: " + r.d1 + " defeituoso(s), entre " + pl[2][1] + " e " + pl[2][2] + " — formar a 2ª amostra de " + pl[3][0] + " " + Us + " (" + S.ac1 + ")"; return r; }
      if (ok(r.n2) && r.n2 < r.req2) { r.parecer = "PENDENTE"; r.motivo = "2ª amostra com " + fmt(r.n2, 0) + " " + Us + " — a " + r.tab + " pede " + r.req2; return r; }
      r.tot = r.d1 + r.d2;
      if (r.tot <= pl[3][1]) { r.parecer = "ACEITO"; r.motivo = "1ª + 2ª amostras: " + r.tot + " defeituoso(s) ≤ número de aceitação " + pl[3][1] + " (" + S.ac2 + ")"; return r; }
      r.parecer = "REJEITADO"; r.motivo = "1ª + 2ª amostras: " + r.tot + " defeituoso(s) ≥ número de rejeição " + pl[3][2] + " (" + S.ac2 + ")";
      return r;
    }
    function txtPlano(pl) {
      if (!pl) return "—";
      return (pl[3] ? "dupla — 1ª: n = " : "simples — n = ") + pl[2][0] + ", Ac " + pl[2][1] + ", Re " + pl[2][2] +
        (pl[3] ? "; 2ª: n = " + pl[3][0] + " (cumulativo " + (pl[2][0] + pl[3][0]) + "), Ac " + pl[3][1] + ", Re " + pl[3][2] : "");
    }
    function segunda(d) { var i2 = (d.insp || [])[1] || {}; return ok(num(i2.nInsp)) || ok(num(i2.nDef)); }

    var checks = [["chkLote", "3.1", cfg.textoLote, function () { return true; }],
      ["chkAcaso", "4.1", Us.charAt(0).toUpperCase() + Us.slice(1) + " da amostra retirad" + (cfg.fem ? "a" : "o") + "s ao acaso", function () { return true; }],
      ["chkReinc", S.reinc, "1ª amostra não reincorporada ao lote antes da retirada da 2ª", segunda],
      ["chkRecond", "4.4", "Reinspeção: o fornecedor eliminou ou recondicionou tod" + (cfg.fem ? "a" : "o") + "s " + (cfg.fem ? "as" : "os") + " " + Us + " em desacordo", rig],
      ["chkRepos", "4.5", cfg.textoRepos, function (d, r) { return r && r.parecer === "ACEITO"; }]];

    var F = {
      titulo: cfg.titulo,
      resumo: cfg.resumo,
      lote: true,
      params: [
        { k: "inspecao", r: "Tipo de inspeção (3.5, 3.6 e 4.4)", tipo: "select", recarrega: true,
          opcoes: [["normal", "Normal — primeira inspeção do lote (" + cfg.tabRef.t1 + ")"], ["rigorosa", "Rigorosa — reinspeção de lote rejeitado e corrigido (" + cfg.tabRef.t2 + ")"]] },
        { k: "lote", r: "Tamanho do lote — " + Us + " (3.1)" },
      ].concat(cfg.paramsExtra || []).concat(checks.map(function (c) { return { k: c[0], r: c[2] + " (" + c[1] + ")", tipo: "select", opcoes: SN, se: function (d) { return c[3](d, avaliar(d)); } }; })),
      padrao: Object.assign({ inspecao: "normal" }, cfg.padrao || {}),
      tabelas: function (d) {
        var T = [{ chave: "insp", titulo: "Inspeção " + (rig(d) ? "rigorosa" : "normal") + " — " + nomeTab(d) + " (4.1 a 4.3)", rotulo: "Amostra", iniciais: 2, min: 2, fixo: true,
          nomes: ["1ª (ou única)", "2ª"],
          linhas: [{ k: "nInsp", r: Us.charAt(0).toUpperCase() + Us.slice(1) + " inspecionad" + (cfg.fem ? "a" : "o") + "s", u: "nº" },
            { k: "nDef", r: Us.charAt(0).toUpperCase() + Us.slice(1) + " defeituos" + (cfg.fem ? "a" : "o") + "s (com um ou mais defeitos) (4.2)", u: "nº" },
            { grupo: "Defeitos encontrados (3.7) — nº de " + Us }].concat(cfg.defeitos.map(function (x) { return { k: x[0], r: x[1], u: "nº" }; })),
          dica: "a 2ª coluna só é usada na amostragem dupla, quando a 1ª amostra fica entre os números de aceitação e de rejeição" }];
        if (cfg.pesagem) T.push({ chave: "pes", titulo: cfg.pesagem.titulo, rotulo: U.charAt(0).toUpperCase() + U.slice(1), iniciais: 2, min: 1,
          linhas: [{ k: "id", r: "Identificação (amostra / posição)", texto: true }, { k: "bruta", r: "Massa bruta", u: "kg" }, { k: "tara", r: "Tara (embalagem)", u: "kg" },
            { calc: "liq", r: "Massa líquida", u: "kg", casas: 2 }, { calc: "falta", r: "Falta em relação ao declarado", u: "kg", casas: 2, destaque: true }],
          dica: "opcional: uma coluna por " + U + " pesad" + (cfg.fem ? "a" : "o") + "; a falta positiva além da tolerância caracteriza deficiência de enchimento" });
        return T;
      },
      calcular: function (d) {
        var P = d.params || {}, avisos = [], r = avaliar(d);
        if (r.pl && r.todos1 && cfg.nota1) avisos.push("Tamanho da amostra (" + r.pl[2][0] + ") ≥ tamanho do lote (" + fmt(r.N, 0) + "): inspecionar tod" + (cfg.fem ? "a" : "o") + "s " + (cfg.fem ? "as" : "os") + " " + Us + " (" + cfg.nota1 + ").");
        if (r.parecer === "PENDENTE" || r.parecer === "2ª AMOSTRAGEM") avisos.push("Parecer " + r.parecer.toLowerCase() + ": " + r.motivo + ".");
        if (r.pl && (r.parecer === "ACEITO" || r.parecer === "REJEITADO") && !ok(r.tot) && segunda(d)) avisos.push("A 1ª amostra já decidiu o lote — a 2ª amostra não é considerada (" + S.ac1 + ").");
        if (ok(r.n1) && r.pl && r.n1 > r.req1) avisos.push("1ª amostra com " + fmt(r.n1, 0) + " " + Us + " — mais que os " + r.req1 + " da " + r.tab + "; os números de aceitação/rejeição valem para o tamanho tabelado.");
        var somaDef = 0;
        (d.insp || []).forEach(function (x, i) {
          var nd = num(x.nDef), ni = num(x.nInsp), soma = cfg.defeitos.reduce(function (a, e) { return a + (ok(num(x[e[0]])) ? num(x[e[0]]) : 0); }, 0);
          somaDef += soma;
          if (ok(nd) && ok(ni) && nd > ni) avisos.push((i + 1) + "ª amostra: mais defeituos" + (cfg.fem ? "a" : "o") + "s que inspecionad" + (cfg.fem ? "a" : "o") + "s — confira.");
          if (ok(nd) && soma < nd) avisos.push((i + 1) + "ª amostra: " + nd + " defeituos" + (cfg.fem ? "a" : "o") + "(s), mas só " + soma + " defeito(s) discriminado(s) — cada " + U + " defeituos" + (cfg.fem ? "a" : "o") + " tem ao menos um defeito de 3.7 (4.2).");
          if (ok(ni)) cfg.defeitos.forEach(function (e) { var v = num(x[e[0]]); if (ok(v) && v > ni) avisos.push((i + 1) + "ª amostra: " + e[1] + " em " + v + " " + Us + ", mais que os inspecionados."); });
        });
        // pesagem (deficiência de enchimento)
        var pes = [], nFalta = 0, decl = cfg.pesagem ? cfg.pesagem.declarado(P) : NaN, tol = num(P.tolEnch);
        if (!ok(tol)) tol = 0;
        (d.pes || []).forEach(function (x, i) {
          var b = num(x.bruta), t = num(x.tara), liq = ok(b) ? b - (ok(t) ? t : 0) : NaN, falta = ok(liq) && ok(decl) ? decl - liq : NaN;
          if (ok(falta) && falta > tol + 1e-9) { nFalta++; avisos.push(U.charAt(0).toUpperCase() + U.slice(1) + " " + (x.id || i + 1) + ": massa líquida " + fmt(liq, 2) + " kg < " + fmt(decl, 2) + " kg declarados — deficiência de enchimento (" + cfg.pesagem.secao + ")."); }
          if (ok(b) && !ok(t)) avisos.push(U.charAt(0).toUpperCase() + U.slice(1) + " " + (x.id || i + 1) + ": sem a tara — a massa líquida considerou tara zero.");
          pes.push({ liq: liq, falta: falta });
        });
        if (cfg.pesagem && pes.some(function (p) { return ok(p.liq); }) && !ok(decl)) avisos.push("Informe o conteúdo declarado no rótulo para verificar a deficiência de enchimento (" + cfg.pesagem.secao + ").");
        var ench = (d.insp || []).reduce(function (a, x) { return a + (ok(num(x[cfg.kEnch])) ? num(x[cfg.kEnch]) : 0); }, 0);
        if (nFalta > ench) avisos.push(nFalta + " " + U + "(s) com falta na pesagem, mas " + ench + " registrad" + (cfg.fem ? "a" : "o") + "(s) com deficiência de enchimento na inspeção — confira.");
        r.nFalta = nFalta; r.nPes = pes.filter(function (p) { return ok(p.liq); }).length; r.decl = decl;
        r.defs = cfg.defeitos.map(function (e) { return [e[1], (d.insp || []).reduce(function (a, x) { return a + (ok(num(x[e[0]])) ? num(x[e[0]]) : 0); }, 0)]; }).filter(function (e) { return e[1] > 0; });
        if (cfg.extraAvisos) cfg.extraAvisos(d, r, avisos);
        var chk = { feitos: 0, total: 0, pend: [] };
        checks.forEach(function (c) {
          if (!c[3](d, r)) return;
          chk.total++;
          if (P[c[0]] === "sim") chk.feitos++;
          else if (P[c[0]] === "nao") avisos.push("Não atendido (" + c[1] + "): " + c[2] + "." + (c[0] === "chkRecond" ? " A reinspeção só é admitida após o fornecedor eliminar ou recondicionar " + (cfg.fem ? "as" : "os") + " " + Us + " em desacordo (4.4)." : c[0] === "chkLote" ? " Separe os lotes antes da inspeção." : ""));
          else chk.pend.push(c[1]);
        });
        if (r.parecer === "REJEITADO" && !rig(d)) avisos.push("Lote rejeitado: pode ser reinspecionado com a inspeção rigorosa (" + cfg.tabRef.t2 + ") depois que o fornecedor eliminar ou recondicionar " + (cfg.fem ? "as" : "os") + " " + Us + " em desacordo (4.4).");
        r.chk = chk; r.nAvisos = avisos.length; r.rig = rig(d);
        return { tab: { pes: pes }, resultados: r, avisos: avisos };
      },
      resultadosHtml: function (calc) {
        var r = calc.resultados, c = r.chk;
        function cx(v, rot) { return '<div class="fe-res-item"><div class="fe-res-v">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
        var cls = r.parecer === "ACEITO" ? "fe-ok" : r.parecer === "REJEITADO" ? "fe-nok" : "";
        return '<div class="fe-res">' + cx('<span class="' + cls + '">' + esc(r.parecer) + "</span>", "Parecer do lote (4.3) · " + esc(r.motivo)) +
          cx(r.pl ? (r.pl[3] ? "dupla" : "simples") : "—", "Inspeção " + (r.rig ? "rigorosa" : "normal") + " · " + esc(r.tab) + (ok(r.N) ? " · lote " + fmt(r.N, 0) + " " + Us : "") + " · " + esc(txtPlano(r.pl))) +
          (r.nPes ? cx(r.nFalta + " / " + r.nPes, Us.charAt(0).toUpperCase() + Us.slice(1) + " pesad" + (cfg.fem ? "a" : "o") + "s com deficiência de enchimento") : "") +
          cx(c.feitos + " / " + c.total, "Verificações confirmadas" + (r.nAvisos ? ' · <span class="fe-nok">' + r.nAvisos + " aviso(s)</span>" : "")) + "</div>";
      },
      relatorio: {
        notas: cfg.notas,
        resultados: function (calc) {
          var r = calc.resultados, rows = [["Parecer do lote na inspeção visual", r.parecer + " — " + r.motivo],
            ["Inspeção", (r.rig ? "Rigorosa (reinspeção, 4.4)" : "Normal") + " — " + r.tab],
            ["Plano de amostragem", txtPlano(r.pl)]];
          if (ok(r.d1)) rows.push([Us.charAt(0).toUpperCase() + Us.slice(1) + " defeituos" + (cfg.fem ? "a" : "o") + "s", "1ª: " + r.d1 + (ok(r.n1) ? " em " + r.n1 : "") + (ok(r.d2) ? " · 2ª: " + r.d2 + (ok(r.n2) ? " em " + r.n2 : "") + (ok(r.tot) ? " · total " + r.tot : "") : "")]);
          if (r.defs.length) rows.push(["Defeitos encontrados (3.7)", r.defs.map(function (e) { return e[0].replace(/^\S+\s/, "") + ": " + e[1]; }).join("; ")]);
          if (r.nPes) rows.push(["Pesagem (deficiência de enchimento)", r.nFalta + " de " + r.nPes + " " + Us + " abaixo de " + fmt(r.decl, 2) + " kg declarados"]);
          rows.push(["Verificações", r.nAvisos ? r.nAvisos + " aviso(s)" : "sem avisos"]);
          return rows;
        },
      },
      exemplos: cfg.exemplos,
      rotuloImportar: function (r) { return "inspeção " + (r.rig ? "rigorosa" : "normal") + " — " + (r.parecer || "—") + (ok(r.N) ? " (lote " + fmt(r.N, 0) + " " + Us + ")" : ""); },
    };
    return F;
  };

  var DEF = [["dEmb", "a) embalagem inadequada (3.7.1)"], ["dEnch", "b) deficiência de enchimento — pesagem (3.7.2)"], ["dFech", "c) fechamento imperfeito — costura (3.7.3)"],
    ["dVaz", "d) vazamento (3.7.4)"], ["dCons", "e) má conservação — molhado, intempéries (3.7.5)"], ["dIdent", "f) identificação deficiente (3.7.6)"], ["dOutros", "g) outros defeitos (3.7.7)"]];

  FE.FICHAS["dner-pro-132-94"] = FE.inspecaoVisual({
    titulo: "Microesferas de vidro — Inspeção visual das embalagens",
    resumo: "Inspeção visual dos sacos de 25 kg de microesferas no recebimento: amostragem simples ou dupla da Tabela 1 (inspeção normal) ou da Tabela 2 (inspeção rigorosa na reinspeção), contagem dos sacos defeituosos pelos defeitos de 3.7 (enchimento verificado por pesagem) e parecer ACEITO / REJEITADO / 2ª amostragem (4.3).",
    un: ["saco", "sacos"], fem: false, kEnch: "dEnch",
    T1: [[2, 180, [2, 0, 1], null], [181, 500, [4, 0, 2], [6, 1, 2]], [501, 800, [8, 2, 4], [10, 3, 4]], [801, 1300, [10, 2, 5], [14, 4, 5]]],
    T2: [[2, 15, [1, 0, 1], null], [16, 40, [3, 0, 1], null], [41, 90, [4, 0, 1], null], [91, 165, [5, 1, 2], null], [166, 275, [6, 1, 2], null],
      [276, 410, [7, 1, 2], null], [411, 610, [8, 2, 3], null], [611, 860, [9, 2, 3], null], [861, 1160, [10, 2, 3], null]],
    tabRef: { t1: "Tabela 1", t2: "Tabela 2" },
    secoes: { ac1: "4.3.1", ac2: "4.3.2", reinc: "Nota de 4.3.2" },
    nota1: "",
    textoLote: "Lote formado por sacos de 25 kg com a mesma data de fabricação",
    textoRepos: "Sacos defeituosos da amostra eliminados do lote e substituídos por perfeitos não existentes na amostra",
    defeitos: DEF,
    paramsExtra: [
      { k: "tipo", r: "Microesferas — tipo / classe", ph: "ex.: tipo II-A" },
      { k: "dataFab", r: "Data de fabricação do lote (3.1)", ph: "ex.: 03/2025" },
      { k: "pedido", r: "Nota fiscal / pedido de compra" },
      { k: "decl", r: "Conteúdo declarado por saco (kg) — rótulo (3.1 e 3.7.2)", ph: "25" },
      { k: "tolEnch", r: "Tolerância de enchimento na pesagem (kg) — opcional", ph: "0", dica: "a norma considera defeito qualquer falta em relação ao declarado; use a tolerância da especificação/pedido, se houver" },
    ],
    padrao: { decl: "25" },
    pesagem: { titulo: "Pesagem dos sacos — deficiência de enchimento (3.7.2)", secao: "3.7.2",
      declarado: function (P) { var v = num(P.decl); return ok(v) ? v : 25; } },
    extraAvisos: function (d, r, avisos) {
      var v = num((d.params || {}).decl);
      if (ok(v) && Math.abs(v - 25) > 1e-9) avisos.push("Conteúdo declarado de " + fmt(v, 1) + " kg — o lote da norma é de sacos de 25 kg (3.1).");
    },
    notas: "Inspeção visual conforme a DNER-PRO 132/94 (não exime a verificação dos demais requisitos do produto, 1.3). Tabela 1 — inspeção normal (lote em sacos → amostra, nº de aceitação/rejeição): 2–180 simples 2 (0/1); 181–500 dupla 4 (0/2) + 6, cumulativo 10 (1/2); 501–800 dupla 8 (2/4) + 10 = 18 (3/4); 801–1 300 dupla 10 (2/5) + 14 = 24 (4/5). Tabela 2 — inspeção rigorosa (reinspeção, simples): 2–15 → 1 (0/1); 16–40 → 3 (0/1); 41–90 → 4 (0/1); 91–165 → 5 (1/2); 166–275 → 6 (1/2); 276–410 → 7 (1/2); 411–610 → 8 (2/3); 611–860 → 9 (2/3); 861–1 160 → 10 (2/3). Aceito se defeituosos ≤ Ac; rejeitado se ≥ Re; entre os dois, 2ª amostra retirada do lote desfalcado da 1ª, com o total das duas comparado aos números da 2ª (4.3). Saco com um ou mais defeitos de 3.7 = defeituoso (4.2). Pesagem: falta = conteúdo declarado − (massa bruta − tara).",
    exemplos: [
      { nome: "Lote de 320 sacos — dupla amostragem, aceito na 2ª amostra", dados: function () {
        return { ident: { registro: "EX-PRO132-01", data: "2025-03-24", obra: "Obra A", origem: "Fornecedor A", camada: "Microesferas tipo II-A" },
          params: { inspecao: "normal", lote: "320", tipo: "II-A (premix)", dataFab: "02/2025", pedido: "NF 1234", decl: "25", chkLote: "sim", chkAcaso: "sim", chkReinc: "sim", chkRepos: "sim" },
          insp: [{ nInsp: "4", nDef: "1", dFech: "1" }, { nInsp: "6", nDef: "0" }],
          pes: [{ id: "1ª-1", bruta: "25,18", tara: "0,15" }, { id: "1ª-2", bruta: "25,21", tara: "0,15" }, { id: "1ª-3", bruta: "25,16", tara: "0,15" }, { id: "1ª-4", bruta: "25,19", tara: "0,15" }] };
      } },
      { nome: "Lote de 150 sacos — amostra única com saco molhado e enchimento deficiente (rejeitado)", dados: function () {
        return { ident: { registro: "EX-PRO132-02", data: "2025-07-02", obra: "Obra B", origem: "Fornecedor B", camada: "Microesferas tipo I-B" },
          params: { inspecao: "normal", lote: "150", tipo: "I-B (drop-on)", dataFab: "05/2025", pedido: "NF 5678", decl: "25", chkLote: "nao", chkAcaso: "sim" },
          insp: [{ nInsp: "2", nDef: "1", dCons: "1", dEnch: "1" }, {}],
          pes: [{ id: "S-12", bruta: "24,38", tara: "0,15" }, { id: "S-97", bruta: "25,17", tara: "0,15" }] };
      } },
    ],
  });
})();
