/*
 * Ficha: DNIT 433/2021-PRO — Percentual de área trincada e afundamento de trilha de roda (trechos experimentais,
 * monitorados ou homogêneos de curta extensão).
 * Registra-se no motor de site/fichas.js (window.FE).
 * Área trincada por faixa (5.2.1, eq. 1): células de 2 m × 1/3 da faixa com trincas, panelas ou remendos / total de
 * células, em % (Anexo C, eq. 5 e 6). Flechas nas trilhas TRI e TRE a cada 10 m (5.3): média, desvio-padrão e
 * variância (eq. 2 a 4) por trilha, em pista simples (ambas as faixas; 3ª faixa em separado) ou por pista em pista dupla.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  function desvio(v) { var m = media(v); return v.length > 1 ? Math.sqrt(v.reduce(function (a, x) { return a + (x - m) * (x - m); }, 0) / (v.length - 1)) : NaN; }
  function metros(s) {
    s = String(s || "").trim();
    var m = /^(\d+)\s*\+\s*([\d.,]+)$/.exec(s);
    if (m) return Number(m[1]) * 20 + num(m[2]);
    return /^\d+([.,]\d+)?$/.test(s) ? num(s) * 20 : NaN;
  }

  FE.FICHAS["dnit-433-2021-pro"] = {
    titulo: "Área trincada e afundamento de trilha de roda",
    rotuloImportar: function (r) { return "AT " + (r.faixas || []).map(function (f) { return fmt(f.at, 1) + " %"; }).join(" / ") + " · flecha média " + fmt(r.fMed, 1) + " mm"; },
    resumo: "Percentual de área trincada por faixa (células de 2 m × 1/3 da faixa, eq. 1) e flechas nas trilhas TRI e TRE a cada 10 m: média, desvio-padrão e variância por trilha (eq. 2 a 4).",
    blocos: [],
    params: [
      { k: "pista", r: "Tipo de pista (5.3.1)", tipo: "select", opcoes: [["simples", "Pista simples — TRI e TRE de ambas as faixas (3ª faixa em separado)"], ["dupla", "Pista dupla — faixa mais solicitada de cada pista, separadamente"]] },
      { k: "interditado", r: "Trecho interditado durante o levantamento (5.1 a)", tipo: "select", opcoes: [["sim", "Sim"], ["nao", "Não"]] },
      { k: "trelica", r: "Treliça — base de 1,20 m (identificação)", ph: "Treliça de alumínio nº 1" },
      { k: "revest", r: "Revestimento", ph: "ex.: concreto asfáltico 5 cm" },
    ],
    padrao: { pista: "simples", interditado: "sim" },
    tabelas: function () {
      return [
        { chave: "fx", titulo: "Área trincada por faixa de rolamento (5.2)", rotulo: "Faixa", iniciais: 2, min: 1,
          dica: "células de 2 m de comprimento por 1/3 da largura (TI, CE, TE); total = extensão / 2 × 3, ou informado",
          linhas: [
            { k: "nome", r: "Faixa", texto: true, ph: "Faixa 1" },
            { k: "ei", r: "Estaca inicial", texto: true, ph: "0" },
            { k: "ef", r: "Estaca final", texto: true, ph: "2" },
            { k: "ntot", r: "Total de células (vazio = pela extensão)", u: "" },
            { k: "ndef", r: "Células com trincas, fissuras, panelas ou remendos", u: "" },
            { calc: "ext", r: "Extensão", u: "m", casas: 0 },
            { calc: "nt", r: "Total de células da faixa", u: "", casas: 0 },
            { calc: "at", r: "AT % = ndef / ntotal × 100 (eq. 1)", u: "%", casas: 1, destaque: true },
          ] },
        { chave: "fl", titulo: "Flechas nas trilhas de roda — a cada 10 m (5.3)", rotulo: "Seção", iniciais: 6, min: 1,
          dica: "leitura máxima deslocando a treliça transversalmente dentro da trilha; grupo: faixa/pista para a estatística",
          linhas: [
            { k: "estaca", r: "Estaca", texto: true, ph: "0+10" },
            { k: "grupo", r: "Grupo (pista simples, 3ª faixa, pista N/S…)", texto: true, ph: "Pista" },
            { k: "faixa", r: "Faixa", texto: true, ph: "Faixa 1" },
            { k: "tri", r: "Flecha TRI", u: "mm" },
            { k: "tre", r: "Flecha TRE", u: "mm" },
          ] },
      ];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      if (P.interditado === "nao") avisos.push("O trecho deve estar interditado durante os levantamentos (5.1 a).");
      var fx = (d.fx || []).map(function (f, i) {
        var o = { nome: f.nome || "Faixa " + (i + 1) }, a = metros(f.ei), b = metros(f.ef);
        o.ext = ok(a) && ok(b) ? Math.abs(b - a) : NaN;
        o.nt = ok(num(f.ntot)) ? num(f.ntot) : ok(o.ext) ? o.ext / 2 * 3 : NaN;
        var nd = num(f.ndef);
        o.at = ok(nd) && ok(o.nt) && o.nt > 0 ? nd / o.nt * 100 : NaN;
        if (ok(nd) && ok(o.nt) && nd > o.nt) avisos.push(o.nome + ": células com defeito acima do total.");
        if (ok(num(f.ntot)) && ok(o.ext) && Math.abs(num(f.ntot) - o.ext / 2 * 3) > 0.5) avisos.push(o.nome + ": total informado (" + fmt(num(f.ntot), 0) + ") difere de extensão/2 × 3 = " + fmt(o.ext / 2 * 3, 0) + " células.");
        if (ok(o.ext) && o.ext % 20) avisos.push(o.nome + ": extensão de " + fmt(o.ext, 0) + " m — o trecho deve estar demarcado por estacas a cada 20 m (5.1 c).");
        return o;
      });
      // flechas
      var grupos = [], mapa = {};
      (d.fl || []).forEach(function (s, i) {
        var g = String(s.grupo || "").trim() || "Pista";
        if (!mapa[g]) { mapa[g] = { nome: g, tri: [], tre: [], m: [] }; grupos.push(mapa[g]); }
        var G = mapa[g], a = num(s.tri), b = num(s.tre);
        if (ok(a)) G.tri.push(a); if (ok(b)) G.tre.push(b);
        var m = metros(s.estaca); if (ok(m)) G.m.push(m);
        if ((ok(a) && a < 0) || (ok(b) && b < 0)) avisos.push("Seção " + (i + 1) + ": flecha negativa — confira a leitura.");
      });
      grupos.forEach(function (G) {
        ["tri", "tre"].forEach(function (k) {
          var v = G[k], m = media(v), s = desvio(v);
          G[k + "S"] = { n: v.length, media: m, sd: s, var: s * s, max: v.length ? Math.max.apply(null, v) : NaN };
        });
        var ms = G.m.slice().sort(function (x, y) { return x - y; }), irreg = 0;
        for (var i = 1; i < ms.length; i++) if (Math.abs(ms[i] - ms[i - 1] - 10) > 0.5 && ms[i] !== ms[i - 1]) irreg++;
        if (irreg) avisos.push(G.nome + ": " + irreg + " intervalo(s) entre seções diferente(s) de 10 m (5.3 a).");
      });
      var todas = [];
      grupos.forEach(function (G) { todas = todas.concat(G.tri, G.tre); });
      return { tab: { fx: fx, fl: [] }, resultados: { faixas: fx, grupos: grupos, fMed: media(todas) }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, h = '<div class="fe-res">';
      r.faixas.forEach(function (f) { h += '<div class="fe-res-item"><div class="fe-res-v">' + fmt(f.at, 1) + ' <small>%</small></div><div class="fe-res-r">Área trincada — ' + esc(f.nome) + " (" + fmt(f.nt, 0) + " células)</div></div>"; });
      r.grupos.forEach(function (G) {
        ["tri", "tre"].forEach(function (k) {
          var S = G[k + "S"];
          if (S.n) h += '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + fmt(S.media, 1) + " ± " + fmt(S.sd, 1) + ' <small>mm</small></div><div class="fe-res-r">' + esc(G.nome) + " — " + k.toUpperCase() + ": ᾱ ± S (n = " + S.n + ", S² = " + fmt(S.var, 2) + " mm²)</div></div>";
        });
      });
      return h + "</div>";
    },
    relatorio: {
      notas: "AT % = número de células com trincas, fissuras, panelas ou remendos / número total de células × 100 (eq. 1 e Anexo C; qualquer defeito na célula compromete a célula inteira). Flechas: ᾱ = Σαi/n; S = √[Σ(αi − ᾱ)²/(n − 1)]; S² (eq. 2 a 4).",
      resultados: function (calc) {
        var r = calc.resultados, rows = [];
        r.faixas.forEach(function (f) { rows.push(["Área trincada — " + f.nome, fmt(f.at, 1) + " % (" + fmt(f.nt, 0) + " células; extensão " + fmt(f.ext, 0) + " m)"]); });
        r.grupos.forEach(function (G) {
          ["tri", "tre"].forEach(function (k) {
            var S = G[k + "S"];
            if (S.n) rows.push(["Flechas " + k.toUpperCase() + " — " + G.nome, "n = " + S.n + "; ᾱ = " + fmt(S.media, 2) + " mm; S = " + fmt(S.sd, 2) + " mm; S² = " + fmt(S.var, 2) + " mm²; máx. " + fmt(S.max, 1) + " mm"]);
          });
        });
        return rows;
      },
    },
    exemplos: [
      { nome: "Exemplo do Anexo C (estacas 0 a 2) e flechas a cada 10 m (flechas geradas)", dados: function () {
        var fl = [], tri = [3, 4, 2, 5, 4], tre = [5, 6, 4, 7, 6];
        for (var i = 0; i < 5; i++) {
          var est = Math.floor(i * 10 / 20) + (i % 2 ? "+10" : "");
          fl.push({ estaca: est, grupo: "Pista", faixa: "Faixa 1", tri: String(tri[i]), tre: String(tre[i]) });
          fl.push({ estaca: est, grupo: "Pista", faixa: "Faixa 2", tri: String(tri[(i + 2) % 5]), tre: String(tre[(i + 1) % 5]) });
        }
        return { ident: { registro: "EX-AT-001", data: "2026-03-10", obra: "Trecho experimental A", trecho: "Estacas 0 a 2" },
          params: { pista: "simples", interditado: "sim", trelica: "Treliça de alumínio 1,20 m", revest: "Concreto asfáltico" },
          obs: "Anexo C da norma: faixa 1 com 3 células e faixa 2 com 5 células comprometidas em 60 — AT = 5 % e 8,3 %.",
          fx: [{ nome: "Faixa 1", ei: "0", ef: "2", ndef: "3" }, { nome: "Faixa 2", ei: "0", ef: "2", ndef: "5" }], fl: fl };
      } },
      { nome: "Trecho monitorado de 200 m — trilhas afundadas e espaçamento irregular (dados gerados)", dados: function () {
        var fl = [], m;
        for (var i = 0; i <= 20; i++) {
          m = i * 10 + (i === 12 ? 5 : 0);
          var est = Math.floor(m / 20) + (m % 20 ? "+" + (m % 20) : "");
          fl.push({ estaca: est, grupo: "Pista", faixa: i % 2 ? "Faixa 2" : "Faixa 1", tri: String(6 + (i * 7) % 5), tre: String(9 + (i * 3) % 7 + (i > 14 ? 6 : 0)) });
        }
        return { ident: { registro: "EX-AT-002", data: "2026-09-21", obra: "Trecho monitorado B", trecho: "Estacas 0 a 10" },
          params: { pista: "simples", interditado: "nao", trelica: "Treliça 1,20 m", revest: "CBUQ 4 cm" },
          fx: [{ nome: "Faixa 1", ei: "0", ef: "10", ndef: "84" }, { nome: "Faixa 2", ei: "0", ef: "10", ntot: "320", ndef: "133" }], fl: fl };
      } },
    ],
  };
})();
