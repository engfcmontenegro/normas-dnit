/*
 * Ficha: DNER-ME 223/94 — Argilas para fabricação de agregado sintético de argila calcinada —
 * seleção expedita pelo processo de fervura. Ensaio qualitativo: corpo de prova cilíndrico (Ø 1,5 × 4 cm)
 * calcinado a 776 ± 10 °C por 15 min, fervido 15 min em panela de pressão; sem alteração de volume (visual)
 * nem de consistência (tátil) → argila provavelmente apta (seção 7).
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  // resposta sim/não digitada na célula: true = houve alteração, false = não, null = em branco/ilegível
  function simNao(v) {
    var s = String(v || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (!s) return null;
    if (/^(n|nao|sem|0)\b/.test(s)) return false;
    if (/^(s|sim|com|1)\b/.test(s)) return true;
    return null;
  }

  FE.FICHAS["dner-me-223-94"] = {
    titulo: "Argila para agregado sintético calcinado — seleção expedita por fervura",
    resumo: "Corpo de prova cilíndrico de argila (Ø 1,5 ± 0,1 cm × 4 ± 0,1 cm) moldado próximo ao LP, calcinado a 776 ± 10 °C por 15 min e fervido 15 min em panela de pressão (0,098 MPa); sem alteração de volume nem de consistência, a argila é provavelmente apta.",
    blocos: [],
    params: [
      { k: "material", r: "Argila (descrição)", ph: "ex.: argila plástica cinza, horizonte B" },
      { k: "moldagem", r: "Moldagem do corpo de prova (5.3.1)", tipo: "select", opcoes: [["manual", "Manual"], ["mecanica", "Mecânica"]] },
      { k: "umidade", r: "Umidade de moldagem (%) — opcional", dica: "próxima ao limite de plasticidade (5.3.1)" },
      { k: "lp", r: "Limite de plasticidade (%) — opcional" },
    ],
    padrao: { moldagem: "manual" },
    tabelas: function () {
      return [{
        chave: "cps", titulo: "Corpos de prova (5.3, 6.1 e 6.2)", rotulo: "CP", iniciais: 1, min: 1,
        dica: "vários frascos podem ir juntos à panela de pressão (Nota de 6.2); responda \"não\" ou \"sim\" nas alterações",
        linhas: [
          { grupo: "Corpo de prova (5.3.1)" },
          { k: "diam", r: "Diâmetro da base (1,5 ± 0,1)", u: "cm" },
          { k: "alt", r: "Altura (4 ± 0,1)", u: "cm" },
          { grupo: "Calcinação no forno elétrico (6.1.1)" },
          { k: "temp", r: "Temperatura de calcinação (776 ± 10)", u: "°C" },
          { k: "tcal", r: "Tempo de calcinação (15)", u: "min" },
          { grupo: "Fervura em panela de pressão (6.2)" },
          { k: "tferv", r: "Fervura após a válvula soltar vapor (15)", u: "min" },
          { k: "vol", r: "Alteração de volume — exame visual (7)", u: "", texto: true, ph: "não / sim" },
          { k: "cons", r: "Alteração de consistência — exame tátil (7)", u: "", texto: true, ph: "não / sim" },
          { k: "obs", r: "Descrição (fissuras, desagregação, amolecimento…)", u: "", texto: true },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], lista = [];
      (d.cps || []).forEach(function (c, i) {
        var n = i + 1, di = num(c.diam), al = num(c.alt), te = num(c.temp), tc = num(c.tcal), tf = num(c.tferv);
        var vol = simNao(c.vol), cons = simNao(c.cons);
        var vazio = [di, al, te, tc, tf].every(function (x) { return !ok(x); }) && vol === null && cons === null;
        if (vazio) return;
        if (ok(di) && Math.abs(di - 1.5) > 0.1 + 1e-9) avisos.push("CP " + n + ": diâmetro de " + fmt(di, 2) + " cm fora de 1,5 ± 0,1 cm (5.3.1).");
        if (ok(al) && Math.abs(al - 4) > 0.1 + 1e-9) avisos.push("CP " + n + ": altura de " + fmt(al, 2) + " cm fora de 4 ± 0,1 cm (5.3.1).");
        if (ok(te) && Math.abs(te - 776) > 10) avisos.push("CP " + n + ": calcinação a " + fmt(te, 0) + " °C, fora de 776 ± 10 °C (6.1.1).");
        if (ok(tc) && tc !== 15) avisos.push("CP " + n + ": calcinação por " + fmt(tc, 0) + " min — a norma prescreve 15 min (6.1.1).");
        if (ok(tf) && tf !== 15) avisos.push("CP " + n + ": fervura de " + fmt(tf, 0) + " min após a válvula soltar vapor — a norma prescreve 15 min (6.2.3).");
        if (String(c.vol || "").trim() && vol === null) avisos.push("CP " + n + ": resposta de alteração de volume não reconhecida — use \"não\" ou \"sim\".");
        if (String(c.cons || "").trim() && cons === null) avisos.push("CP " + n + ": resposta de alteração de consistência não reconhecida — use \"não\" ou \"sim\".");
        var apto = vol === false && cons === false ? true : vol === true || cons === true ? false : null;
        lista.push({ n: n, vol: vol, cons: cons, apto: apto, obs: c.obs || "" });
      });
      var h = num(P.umidade), lp = num(P.lp);
      if (ok(h) && ok(lp) && Math.abs(h - lp) > 3) avisos.push("Umidade de moldagem (" + fmt(h, 1) + " %) afastada do LP (" + fmt(lp, 1) + " %): a norma pede teor próximo ao limite de plasticidade (5.3.1; a ficha alerta acima de ± 3 pontos).");
      var comRes = lista.filter(function (x) { return x.apto !== null; });
      var result = !comRes.length ? null : comRes.every(function (x) { return x.apto; }) ? true : false;
      if (lista.length && comRes.length < lista.length) avisos.push("Há corpo de prova sem o exame de volume e consistência registrado.");
      if (result === false) avisos.push("Houve alteração de volume e/ou consistência após a fervura: a argila não é indicada para agregado sintético de argila calcinada por este critério expedito (7).");
      return { tab: { cps: lista.map(function () { return {}; }) }, resultados: { lista: lista, apto: result }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      var txt = r.apto === null ? "—" : r.apto ? '<span class="fe-ok">Provavelmente apta</span>' : '<span class="fe-nok">Não indicada</span>';
      var linhas = r.lista.map(function (x) {
        function sn(v) { return v === null ? "—" : v ? "sim" : "não"; }
        return "<tr><td>" + x.n + "</td><td>" + sn(x.vol) + "</td><td>" + sn(x.cons) + "</td><td>" + (x.apto === null ? "—" : x.apto ? '<span class="fe-ok">sem alteração</span>' : '<span class="fe-nok">alterado</span>') +
          "</td><td>" + esc(x.obs) + "</td></tr>";
      }).join("");
      return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">' + txt + '</div><div class="fe-res-r">Argila para agregado sintético de argila calcinada (7) — ' + r.lista.length + " corpo(s) de prova</div></div></div>" +
        (linhas ? '<table class="fe-resumo"><thead><tr><th>CP</th><th>Alteração de volume</th><th>Alteração de consistência</th><th>Situação</th><th>Descrição</th></tr></thead><tbody>' + linhas + "</tbody></table>" : "");
    },
    relatorio: {
      notas: "Corpo de prova cilíndrico com Ø 1,5 ± 0,1 cm e altura de 4 ± 0,1 cm, moldado com umidade próxima ao LP (5.3.1); calcinação a 776 ± 10 °C por 15 min (6.1.1); fervura em frasco aberto com água destilada, dentro de panela de pressão com válvula de 0,098 MPa, por 15 min após a válvula soltar vapor (6.2). Se o corpo de prova não apresentar alteração de volume (exame visual) nem de consistência (exame tátil), é provável que a argila seja apta à fabricação de agregado sintético de argila calcinada (7). Ensaio expedito e qualitativo.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Argila", P.material]);
        r.lista.forEach(function (x) {
          rows.push(["CP " + x.n, (x.vol === null ? "volume: —" : "volume: " + (x.vol ? "alterado" : "sem alteração")) + "; " +
            (x.cons === null ? "consistência: —" : "consistência: " + (x.cons ? "alterada" : "sem alteração")) + (x.obs ? " (" + x.obs + ")" : "")]);
        });
        rows.push(["Resultado (7)", r.apto === null ? "—" : r.apto ? "Argila provavelmente apta à fabricação de agregado sintético de argila calcinada"
          : "Argila NÃO indicada — houve alteração após a fervura"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Jazida de argila — dois CPs sem alteração (provavelmente apta)", dados: function () {
        return { ident: { registro: "EX-ARG-001", data: "2025-08-05", obra: "Obra A", origem: "Jazida 1", local: "Furo 3 — 0,5 a 1,5 m" },
          params: { material: "Argila plástica cinza", moldagem: "manual", umidade: "27,5", lp: "26,8" },
          cps: [{ diam: "1,50", alt: "4,02", temp: "778", tcal: "15", tferv: "15", vol: "não", cons: "não", obs: "cor avermelhada, íntegro" },
            { diam: "1,52", alt: "3,98", temp: "778", tcal: "15", tferv: "15", vol: "não", cons: "não", obs: "íntegro" }] };
      } },
      { nome: "Argila siltosa — CP inchou e amoleceu (não indicada)", dados: function () {
        return { ident: { registro: "EX-ARG-002", data: "2025-08-12", obra: "Obra B", origem: "Jazida 3", local: "Furo 1 — 0,3 a 1,0 m" },
          params: { material: "Argila siltosa amarela", moldagem: "manual", umidade: "31,0", lp: "24,5" },
          cps: [{ diam: "1,55", alt: "4,05", temp: "760", tcal: "15", tferv: "15", vol: "sim", cons: "sim", obs: "fissurado, desagrega ao toque" },
            { diam: "1,50", alt: "4,00", temp: "772", tcal: "15", tferv: "15", vol: "não", cons: "sim", obs: "superfície amolecida" }] };
      } },
    ],
  };
})();
