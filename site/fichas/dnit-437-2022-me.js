/*
 * Ficha: DNIT 437/2022-ME — Massa unitária e volume de vazios de agregados em estado solto e compactado.
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  // Tabela 1: TNM (mm) → diâmetro, altura (mm), volume nominal (L)
  var TAB1 = [["12,5", 150, 170, 2.8], ["25,4", 220, 250, 9.5], ["38,0", 250, 290, 14.2], ["76,0", 320, 350, 28.1],
    ["100", 440, 465, 70.7], ["125", 500, 510, 100.1]];
  // Tabela 3: densidade da água (kg/m³)
  var TAB3 = [[15.6, 999.01], [18.3, 998.54], [21.1, 997.97], [23.0, 997.54], [23.9, 997.32], [26.7, 996.59], [29.4, 995.83]];
  var ESTADOS = { solto: { t: "Estado solto (6.2)", G: "Gs", eq: "2", MU: "MUs", Vv: "Vvs", eqV: "4" },
    comp: { t: "Estado compactado (6.3)", G: "Gc", eq: "3", MU: "MUc", Vv: "Vvc", eqV: "5" } };

  function densidade(T) {  // interpolação linear na Tabela 3 (extrapola nas pontas, com aviso)
    if (!ok(T)) return NaN;
    var i = 1;
    while (i < TAB3.length - 1 && T > TAB3[i][0]) i++;
    var a = TAB3[i - 1], b = TAB3[i];
    return a[1] + (b[1] - a[1]) * (T - a[0]) / (b[0] - a[0]);
  }
  function r10(x) { return ok(x) ? Math.round(x / 10) * 10 : NaN; }
  function estadosDe(d) { var e = (d.params || {}).estados || "ambos"; return e === "ambos" ? ["solto", "comp"] : [e]; }
  function tnm(d) { return TAB1.filter(function (t) { return t[0] === (d.params || {}).tnm; })[0]; }
  function tnmNum(d) { var t = tnm(d); return t ? num(t[0]) : NaN; }

  // volume do recipiente em m³: informado (L) ou calibrado pela eq. 1
  function volume(P) {
    if (P.volModo === "calibrar") {
      var R = num(P.R), C = num(P.C), D = densidade(num(P.temp));
      return { V: ok(R) && ok(C) && ok(D) && C > R ? (C - R) / D : NaN, D: D };
    }
    var VL = num(P.VL);
    return { V: ok(VL) && VL > 0 ? VL / 1000 : NaN, D: NaN };
  }

  FE.FICHAS["dnit-437-2022-me"] = {
    titulo: "Massa unitária e volume de vazios — estados solto e compactado",
    rotuloImportar: function (r) { var F = window.FE, s = r.solto || {}, c = r.comp || {}; return "MU solto " + (F.ok(s.MU) ? F.fmt(s.MU, 0) + " kg/m³" : "—") + (F.ok(c.MU) ? " · compactado " + F.fmt(c.MU, 0) + " kg/m³" : ""); },
    resumo: "MU = (massa do recipiente com agregado − recipiente) / V, em kg/m³ (eq. 2 e 3); Vv = 100 × (1 − MU / (1000 × MEsb)) (eq. 4 e 5); média de pelo menos três determinações; MU com aproximação de 10 kg/m³ e Vv de 1 %.",
    blocos: [],
    params: [
      { k: "material", r: "Material", ph: "ex.: brita 1, areia média" },
      { k: "tnm", r: "Tamanho nominal máximo — TNM (Tabela 1)", tipo: "select",
        opcoes: [["", "—"]].concat(TAB1.map(function (t) { return [t[0], "≤ " + t[0] + " mm — recipiente Ø " + t[1] + " × " + t[2] + " mm, " + fmt(t[3], 1) + " L"]; })),
        dica: "define o recipiente (4.4) e o tipo de compactação (6.3.1 ou 6.3.2)" },
      { k: "estados", r: "Estados ensaiados", tipo: "select", recarrega: true,
        opcoes: [["ambos", "Solto e compactado"], ["solto", "Só solto (6.2)"], ["comp", "Só compactado (6.3)"]] },
      { k: "volModo", r: "Volume do recipiente (6.1 e 7.1)", tipo: "select", recarrega: true,
        opcoes: [["informado", "Volume já determinado (informar em litros)"], ["calibrar", "Determinar agora com água e placa de vidro (eq. 1)"]] },
      { k: "VL", r: "Volume do recipiente (L = dm³)", dica: "da última determinação (NOTA 2: ao menos uma vez por ano)",
        se: function (d) { return (d.params || {}).volModo !== "calibrar"; } },
      { k: "R", r: "R — recipiente + placa de vidro (kg)", dica: "secos e limpos, precisão de 0,05 kg (6.1 a)", se: function (d) { return (d.params || {}).volModo === "calibrar"; } },
      { k: "C", r: "C — recipiente + água + placa de vidro (kg)", dica: "6.1 e", se: function (d) { return (d.params || {}).volModo === "calibrar"; } },
      { k: "temp", r: "Temperatura da água (°C)", dica: "precisão de 0,1 °C; densidade D pela Tabela 3, interpolada (6.1 f)", se: function (d) { return (d.params || {}).volModo === "calibrar"; } },
      { k: "T", r: "Massa do recipiente vazio T (kg)", dica: "valor usado nas colunas em que T não for informado (6.2 b e 6.3 b)" },
      { k: "mesb", r: "Massa específica aparente MEsb (g/cm³) — para o volume de vazios", dica: "DNIT 411-ME (miúdo) ou DNIT 413-ME (graúdo)" },
    ],
    padrao: { estados: "ambos", volModo: "informado" },
    tabelas: function (d) {
      return estadosDe(d).map(function (e) {
        var E = ESTADOS[e];
        return { chave: e, titulo: E.t, rotulo: "Det.", iniciais: 3, min: 1,
          dica: e === "solto" ? "lançar o agregado no centro, de no máximo 5 cm acima da borda, até transbordar; nivelar (6.2 c, d)"
            : "três camadas de 1/3 da altura; TNM ≤ 38 mm: 25 golpes de haste por camada; 38 < TNM: 50 quedas alternadas de 50 mm (6.3)",
          linhas: [
            { k: "T", r: "Massa do recipiente vazio (T)", u: "kg", padrao: "T" },
            { k: "G", r: "Recipiente + agregado (" + E.G + ")", u: "kg" },
            { calc: "Ma", r: "Massa de agregado = " + E.G + " − T", u: "kg", casas: 3 },
            { calc: "MU", r: E.MU + " = (" + E.G + " − T) / V (eq. " + E.eq + ")", u: "kg/m³", casas: 1, destaque: true },
            { calc: "Vv", r: E.Vv + " = 100 × (1 − " + E.MU + " / (1000 × MEsb)) (eq. " + E.eqV + ")", u: "%", casas: 1 },
          ] };
      });
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], R = {}, tab = {};
      var vol = volume(P), V = vol.V, mesb = num(P.mesb), Tpad = num(P.T);
      R.V = V; R.D = vol.D;
      if (P.volModo === "calibrar") {
        var tp = num(P.temp);
        if (ok(tp) && (tp < TAB3[0][0] || tp > TAB3[TAB3.length - 1][0])) avisos.push("Temperatura da água de " + fmt(tp, 1) + " °C fora da Tabela 3 (15,6 °C a 29,4 °C): densidade extrapolada.");
      }
      if (!ok(V)) avisos.push("Informe o volume do recipiente (ou as pesagens da calibração, eq. 1).");
      var t1 = tnm(d);
      if (t1 && ok(V) && V * 1000 < t1[3] * 0.95) avisos.push("Recipiente de " + fmt(V * 1000, 3) + " L, menor que o volume nominal de " + fmt(t1[3], 1) + " L exigido para TNM ≤ " + t1[0] + " mm (Tabela 1).");
      estadosDe(d).forEach(function (e) {
        var E = ESTADOS[e];
        var dets = (d[e] || []).map(function (x, i) {
          var T = ok(num(x.T)) ? num(x.T) : Tpad, G = num(x.G), o = {};
          if (ok(T) && ok(G)) {
            if (G <= T) { avisos.push(E.t + ", det. " + (i + 1) + ": massa com agregado menor que a do recipiente — confira."); return o; }
            o.Ma = G - T;
            if (ok(V)) o.MU = o.Ma / V;
            if (ok(o.MU) && ok(mesb) && mesb > 0) o.Vv = 100 * (1 - o.MU / (1000 * mesb));
          }
          return o;
        });
        tab[e] = dets;
        var mus = dets.map(function (o) { return o.MU; }).filter(ok);
        var r = { MU: media(mus), n: mus.length, amp: mus.length > 1 ? Math.max.apply(null, mus) - Math.min.apply(null, mus) : NaN };
        r.Vv = ok(r.MU) && ok(mesb) && mesb > 0 ? 100 * (1 - r.MU / (1000 * mesb)) : NaN;
        r.MUr = r10(r.MU); r.Vvr = ok(r.Vv) ? Math.round(r.Vv) : NaN;
        if (mus.length && mus.length < 3) avisos.push(E.t + ": o resultado é a média de pelo menos três determinações (8.1); há " + mus.length + ".");
        if (r.amp > 40 + 1e-9) avisos.push(E.t + ": as determinações variam " + fmt(r.amp, 1) + " kg/m³ — acima de 40 kg/m³, limite para dois resultados do mesmo operador (8.2.1).");
        R[e] = r;
      });
      if (R.solto && R.comp && ok(R.solto.MU) && ok(R.comp.MU) && R.comp.MU < R.solto.MU) avisos.push("A massa unitária compactada ficou menor que a solta — confira.");
      if (!ok(mesb) && (R.solto && ok(R.solto.MU) || R.comp && ok(R.comp.MU))) avisos.push("Informe a MEsb (DNIT 411-ME ou 413-ME) para calcular o volume de vazios (7.4).");
      var tn = tnmNum(d);
      R.compactacao = !ok(tn) ? "" : tn <= 38 ? "haste de 16 mm, 25 golpes por camada, 3 camadas (6.3.1)" : "3 camadas, 50 quedas alternadas de ~50 mm por camada (6.3.2)";
      return { tab: tab, resultados: R, avisos: avisos };
    },
    resultadosHtml: function (calc, d) {
      var R = calc.resultados, h = '<div class="fe-res">';
      estadosDe(d).forEach(function (e) {
        var r = R[e] || {}, nome = e === "solto" ? "solta" : "compactada";
        h += '<div class="fe-res-item"><div class="fe-res-v">' + (ok(r.MUr) ? fmt(r.MUr, 0) : "—") + ' <small>kg/m³</small></div>' +
          '<div class="fe-res-r">Massa unitária ' + nome + " — média de " + (r.n || 0) + " det. (" + fmt(r.MU, 1) + " kg/m³; aproximação de 10 kg/m³)</div></div>" +
          '<div class="fe-res-item"><div class="fe-res-v">' + (ok(r.Vvr) ? fmt(r.Vvr, 0) : "—") + ' <small>%</small></div>' +
          '<div class="fe-res-r">Volume de vazios — estado ' + (e === "solto" ? "solto" : "compactado") + (ok(r.Vv) ? " (" + fmt(r.Vv, 1) + " %)" : "") + "</div></div>";
      });
      h += '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (ok(R.V) ? fmt(R.V * 1000, 3) + " L" : "—") + '</div><div class="fe-res-r">Volume do recipiente' +
        (ok(R.D) ? " (D = " + fmt(R.D, 2) + " kg/m³, Tabela 3)" : "") + "</div></div>";
      return h + "</div>";
    },
    relatorio: {
      notas: "V = (C − R)/D (eq. 1); MUs = (Gs − T)/V (eq. 2); MUc = (Gc − T)/V (eq. 3); Vv = 100 × (1 − MU/(1000 × MEsb)) (eq. 4 e 5). Resultados: média de pelo menos três determinações; massa unitária com aproximação de 10 kg/m³ e volume de vazios de 1 % (8.1). O limite de 40 kg/m³ (8.2.1) refere-se a dois ensaios do mesmo operador; aqui é aplicado, como alerta, à variação entre as determinações.",
      resultados: function (calc, d) {
        var R = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        rows.push(["Volume do recipiente", ok(R.V) ? fmt(R.V, 6) + " m³ (" + fmt(R.V * 1000, 3) + " L)" + (ok(R.D) ? " — D = " + fmt(R.D, 2) + " kg/m³" : "") : "—"]);
        estadosDe(d).forEach(function (e) {
          var r = R[e] || {};
          rows.push([e === "solto" ? "Massa unitária solta (MUs)" : "Massa unitária compactada (MUc)", (ok(r.MUr) ? fmt(r.MUr, 0) + " kg/m³" : "—") + " — média de " + (r.n || 0) + " determinação(ões)"]);
          rows.push([e === "solto" ? "Volume de vazios — solto (Vvs)" : "Volume de vazios — compactado (Vvc)", ok(r.Vvr) ? fmt(r.Vvr, 0) + " %" : "— (informe a MEsb)"]);
        });
        if (R.comp && R.compactacao) rows.push(["Compactação", R.compactacao]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Brita 1 — estado solto, 3 determinações (planilha do laboratório)", dados: function () {
        return { ident: { registro: "EX-MU-001", obra: "Obra A", origem: "Pedreira X", camada: "Brita 1", data: "2025-10-17" },
          params: { material: "Brita 1", tnm: "25,4", estados: "solto", volModo: "informado", VL: "0,996", T: "5,200", mesb: "2,464" },
          solto: [{ G: "6,585" }, { G: "6,610" }, { G: "6,570" }],
          obs: "Planilha do laboratório (NBR 7251): recipiente de 996 cm³ e massas em gramas; a média lá é =AVERAGE(M47:N47), que pega só a 3ª determinação (1,376 g/cm³). MEsb = média das duas determinações da própria planilha (NBR 9937: 2,520 e 2,408 g/cm³)." };
      } },
      { nome: "Areia — estado solto, 2 determinações (planilha do laboratório)", dados: function () {
        return { ident: { registro: "EX-MU-002", obra: "Obra A", origem: "Fornecedor A", camada: "Areia", data: "2025-10-02" },
          params: { material: "Areia", tnm: "12,5", estados: "solto", volModo: "informado", VL: "0,996", T: "5,200", mesb: "" },
          solto: [{ G: "6,585" }, { G: "6,595" }] };
      } },
      { nome: "Brita graduada — solto e compactado, recipiente calibrado (eq. 1)", dados: function () {
        var V = (17.93 - 8.45) / densidade(23.0), T = 6.10;
        function G(mu) { return fmt(T + mu * V, 3); }
        return { ident: { registro: "EX-MU-003", camada: "Base — brita graduada", origem: "Pedreira A" },
          params: { material: "Brita graduada simples", tnm: "25,4", estados: "ambos", volModo: "calibrar", R: "8,450", C: "17,930", temp: "23,0", T: "6,100", mesb: "2,705" },
          solto: [{ G: G(1552) }, { G: G(1561) }, { G: G(1547) }],
          comp: [{ G: G(1718) }, { G: G(1771) }, { G: G(1726) }] };
      } },
    ],
  };
})();
