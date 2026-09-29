/*
 * Ficha: DNIT 063/2004-PRO — Pavimento rígido — Avaliação subjetiva.
 * Registra-se no motor de site/fichas.js (window.FE).
 * Uma coluna por trecho inspecionado: notas dos três avaliadores (escala do Anexo B, 0 a 100, com os conceitos
 * Destruído … Excelente), conceito por consenso ou pela média aritmética das três notas (5.2), locais que merecem
 * atenção (Anexo A e 5.4 d) e verificações das condições de inspeção (5.1 e seção 6).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  // Anexo B — escala de avaliação (mesma faixa de conceitos da DNIT 062-PRO, Anexo B)
  var ESCALA = [[85, "Excelente"], [70, "Muito bom"], [55, "Bom"], [40, "Razoável"], [25, "Ruim"], [10, "Muito ruim"], [0, "Destruído"]];
  function conceito(n) { if (!ok(n)) return ""; for (var i = 0; i < ESCALA.length; i++) if (n >= ESCALA[i][0]) return ESCALA[i][1]; return "Destruído"; }
  function codigo(c) { return ESCALA.map(function (x) { return x[1]; }).indexOf(c); }

  FE.FICHAS["dnit-063-2004-pro"] = {
    titulo: "Pavimento rígido — avaliação subjetiva",
    rotuloImportar: function (r) { return (r.n || 0) + " trecho(s) · nota média " + (ok(r.mediaGeral) ? fmt(r.mediaGeral, 0) : "—"); },
    resumo: "Notas dos três avaliadores por trecho (escala 0–100 do Anexo B), conceito por consenso ou pela média das três notas (5.2), locais que merecem atenção e verificação das condições de inspeção (5.1, seção 6).",
    blocos: [],
    params: [
      { k: "av1", r: "Avaliador 1 — nome", ph: "Avaliador A" },
      { k: "av2", r: "Avaliador 2 — nome", ph: "Avaliador B" },
      { k: "av3", r: "Avaliador 3 — nome", ph: "Avaliador C" },
      { k: "veic", r: "Veículos — um por avaliador, de uso comum na rodovia (5.1)", tipo: "select", opcoes: [["sim", "Sim"], ["nao", "Não"]] },
      { k: "passadas", r: "Cada avaliador percorreu cada trecho duas vezes (5.1 a)", tipo: "select", opcoes: [["sim", "Sim — lenta e próxima ao limite de velocidade"], ["nao", "Não"]] },
      { k: "sigilo", r: "Notas mantidas em sigilo até a reunião (5.1 d)", tipo: "select", opcoes: [["sim", "Sim"], ["nao", "Não"]] },
      { k: "clima", r: "Condições climáticas favoráveis (seção 6)", tipo: "select", opcoes: [["sim", "Sim"], ["nao", "Não"]] },
      { k: "limite", r: "Nota abaixo da qual o trecho merece atenção especial — opcional", ph: "40" },
    ],
    padrao: { veic: "sim", passadas: "sim", sigilo: "sim", clima: "sim", limite: "40" },
    tabelas: function () {
      return [{ chave: "tr", titulo: "Trechos inspecionados", rotulo: "Trecho", iniciais: 4, min: 1,
        dica: "notas de 0 a 100 na escala do Anexo B; consenso: nota acordada na reunião dos avaliadores (5.2 c)",
        linhas: [
          { k: "id", r: "Trecho (km inicial – km final)", texto: true, ph: "km 10 – km 12" },
          { k: "n1", r: "Nota do avaliador 1", u: "0–100" },
          { k: "n2", r: "Nota do avaliador 2", u: "0–100" },
          { k: "n3", r: "Nota do avaliador 3", u: "0–100" },
          { k: "cons", r: "Nota de consenso (se houver)", u: "0–100" },
          { k: "locais", r: "Locais que não apresentam boas condições", texto: true },
          { calc: "med", r: "Média aritmética das três notas", u: "", casas: 1 },
          { calc: "fin", r: "Nota adotada", u: "", casas: 1, destaque: true },
        ] }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      [["veic", "cada avaliador deve usar um veículo separado, de uso comum na rodovia (5.1)"], ["passadas", "cada trecho deve ser percorrido duas vezes por avaliador (5.1 a)"],
        ["sigilo", "as notas devem ser mantidas em sigilo até a reunião (5.1 d)"], ["clima", "as inspeções devem ser feitas sob condições climáticas favoráveis (seção 6)"]].forEach(function (x) {
        if (P[x[0]] === "nao") avisos.push("Inspeção fora do procedimento: " + x[1] + ".");
      });
      var lim = num(P.limite);
      var tr = (d.tr || []).map(function (t, i) {
        var o = {}, ns = [num(t.n1), num(t.n2), num(t.n3)], nome = t.id || "Trecho " + (i + 1);
        o.nome = nome; o.locais = t.locais || "";
        if (ns.some(function (x) { return ok(x) && (x < 0 || x > 100); })) avisos.push(nome + ": nota fora da escala 0–100 (Anexo B).");
        var val = ns.filter(ok);
        if (!val.length) return o;
        if (val.length < 3) avisos.push(nome + ": são necessárias as notas dos três avaliadores (5.1).");
        o.med = media(val);
        var cs = val.map(conceito), cons = num(t.cons);
        o.consensoConceito = val.length === 3 && cs.every(function (c) { return c === cs[0]; });
        if (ok(cons)) { o.fin = cons; o.base = "nota de consenso"; }
        else { o.fin = o.med; o.base = o.consensoConceito ? "média (os três conceitos coincidem)" : "média aritmética das três notas (sem consenso, 5.2)"; }
        o.conceito = conceito(o.fin);
        var amp = Math.max.apply(null, val) - Math.min.apply(null, val);
        o.amp = amp;
        var saltos = Math.max.apply(null, cs.map(codigo)) - Math.min.apply(null, cs.map(codigo));
        if (saltos >= 2) avisos.push(nome + ": notas divergentes (" + val.map(function (x) { return fmt(x, 0); }).join(", ") + ") em conceitos não adjacentes — debater na reunião dos avaliadores (5.2 b).");
        if (ok(lim) && o.fin < lim) avisos.push(nome + ": nota " + fmt(o.fin, 1) + " < " + fmt(lim, 0) + " — indicar no laudo, por quilometragem, os locais que merecem atenção (5.4 d)" + (o.locais ? "" : "; registre os locais") + ".");
        return o;
      });
      var fins = tr.map(function (o) { return o.fin; }).filter(ok);
      return { tab: { tr: tr }, resultados: { trechos: tr, n: fins.length, mediaGeral: media(fins) }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var h = '<div class="fe-res">';
      calc.resultados.trechos.forEach(function (o) {
        if (!ok(o.fin)) return;
        h += '<div class="fe-res-item"><div class="fe-res-v">' + fmt(o.fin, 0) + '</div><div class="fe-res-r">' + esc(o.nome) + " — " + esc(o.conceito) + " (" + esc(o.base) + ")</div></div>";
      });
      return h + "</div>";
    },
    relatorio: {
      notas: "Escala do Anexo B: Excelente 85–100; Muito bom 70–85; Bom 55–70; Razoável 40–55; Ruim 25–40; Muito ruim 10–25; Destruído 0–10. Conceito pela nota de consenso ou, sem consenso, pela média aritmética das notas dos três avaliadores (5.2). Laudo assinado pelos três avaliadores (5.4 f).",
      resultados: function (calc, d) {
        var P = d.params || {}, rows = [];
        rows.push(["Avaliadores", [P.av1, P.av2, P.av3].filter(Boolean).join("; ") || "—"]);
        calc.resultados.trechos.forEach(function (o) {
          if (!ok(o.fin)) return;
          rows.push([o.nome, fmt(o.fin, 1) + " — " + o.conceito + " (" + o.base + "; média " + fmt(o.med, 1) + ", amplitude " + fmt(o.amp, 0) + ")" + (o.locais ? "; atenção: " + o.locais : "")]);
        });
        return rows;
      },
    },
    exemplos: [
      { nome: "Três trechos com notas concordantes (dados gerados)", dados: function () {
        return { ident: { registro: "EX-AVS-001", data: "2026-05-14", obra: "Rodovia A — pista em concreto", trecho: "km 0 ao km 6" },
          params: { av1: "Avaliador A", av2: "Avaliador B", av3: "Avaliador C", veic: "sim", passadas: "sim", sigilo: "sim", clima: "sim", limite: "40" },
          tr: [{ id: "km 0 – km 2", n1: "78", n2: "74", n3: "80" }, { id: "km 2 – km 4", n1: "66", n2: "62", n3: "68", cons: "65" }, { id: "km 4 – km 6", n1: "58", n2: "61", n3: "56" }] };
      } },
      { nome: "Notas divergentes e trecho em mau estado; inspeção com chuva (dados gerados)", dados: function () {
        return { ident: { registro: "EX-AVS-002", data: "2026-10-02", obra: "Rodovia A — pista em concreto", trecho: "km 6 ao km 10" },
          params: { av1: "Avaliador A", av2: "Avaliador B", av3: "Avaliador D", veic: "sim", passadas: "nao", sigilo: "sim", clima: "nao", limite: "40" },
          tr: [{ id: "km 6 – km 8", n1: "72", n2: "45", n3: "60" }, { id: "km 8 – km 10", n1: "30", n2: "36", n3: "28", locais: "km 8,6 a 9,1 — placas rompidas e degraus" }] };
      } },
    ],
  };
})();
