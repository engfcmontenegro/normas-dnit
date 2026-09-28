/*
 * Ficha: DNIT 428/2022-ME — Misturas asfálticas — Densidade relativa aparente (Gmb) e massa específica aparente
 * (MEa) de corpos de prova compactados (moldados em laboratório ou extraídos da pista).
 * Registra-se no motor de site/fichas.js (window.FE).
 *
 * Campos de calcular(d).resultados (gravados junto com o ensaio salvo; use-os em outras fichas por um parâmetro
 * {tipo: "importar", de: "dnit-428-2022-me", aplicar: function (e, P, d) { ... e.resultados.cps[i].gmb ... }}):
 *   resultados.gmb        Gmb médio dos CPs válidos (adimensional; relatar com 4 casas, 8 c)
 *   resultados.mea        MEa média (g/cm³; 4 casas)
 *   resultados.vv         volume de vazios médio (%) — só com Gmm informado (eq. 12)
 *   resultados.gmm        Gmm usado na eq. 12 (DNIT 427-ME), ou NaN
 *   resultados.n          número de CPs com Gmb válido (entram na média)
 *   resultados.dcil       densidade do cilindro de calibração (eq. 2), ou NaN
 *   resultados.dpa        densidade do filme PVC usada (eq. 3 ou valor adotado; 3 casas), ou NaN
 *   resultados.procedimento  "hidro" (6.1/6.2 → 7.1/7.2) ou "geom" (6.3 → 7.3)
 *   resultados.cps[]      uma por coluna (CP): {nome, eq ("7.1" | "7.2" | "7.3" | ""), valido (entra na média),
 *                         abs (% água absorvida, eq. 1), eUmid (g, eq. 4), A, V (cm³, 7.3), H, D (cm),
 *                         gmb, mea, vv}
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  var RHO = 0.9971;  // eq. 7, 9 e 11
  // Anexo A (informativo) — d2s, um operador
  var D2S = { "12,5": 0.023, "19": 0.037 }, D2S_PVC = 0.079;

  function leituras(p, pref, n) {
    var v = [];
    for (var i = 1; i <= n; i++) { var x = num(p[pref + i]); if (ok(x)) v.push(x); }
    return v;
  }

  FE.FICHAS["dnit-428-2022-me"] = {
    titulo: "Misturas asfálticas — Densidade relativa aparente (Gmb) e massa específica aparente de CPs compactados",
    rotuloImportar: function (r) { return "Gmb " + (ok(r.gmb) ? fmt(r.gmb, 4) : "—") + " · " + (r.n || 0) + " CP(s)" + (r.procedimento === "geom" ? " · geométrico" : ""); },
    resumo: "Pesagem hidrostática (Gmb = A / (C − B)), com filme PVC quando a absorção passa de 2 % (eq. 8), ou medição geométrica para vazios ≥ 10 % (eq. 10); MEa = 0,9971 × Gmb; volume de vazios com o Gmm da DNIT 427-ME (eq. 12).",
    blocos: [],
    params: [
      { k: "mistura", r: "Tipo de mistura (8 d)", ph: "ex.: CBUQ faixa C, CAP 50/70, 5,0 %" },
      { k: "origemCP", r: "Corpos de prova", tipo: "select",
        opcoes: [["lab", "Moldados em laboratório (DNIT 178-PRO)"], ["campo", "Extraídos da pista por sonda rotativa (ASTM D5361)"]] },
      { k: "proc", r: "Procedimento", tipo: "select", recarrega: true,
        opcoes: [["hidro", "Vazios < 10 % — pesagem hidrostática (6.1; 6.2 com filme PVC se absorção > 2 %)"],
          ["geom", "Vazios ≥ 10 % — massa seca e volume pelas dimensões (6.3 e 7.3)"]] },
      { k: "tmax", r: "Tamanho máximo do agregado (mm) — opcional", dica: "diâmetro ≥ 4 × e espessura ≥ 1,5 × o tamanho máximo (seção 5, recomendação)" },
      { k: "tnm", r: "Tamanho nominal máximo — precisão (Anexo A)", tipo: "select",
        opcoes: [["", "—"], ["12,5", "12,5 mm (d2s = 0,023)"], ["19", "19,0 mm (d2s = 0,037)"]],
        dica: "compara a amplitude do Gmb entre os CPs com a faixa aceitável entre dois resultados de um operador (informativo)" },
      { k: "importar", r: "Gmm: buscar ensaio Rice salvo (DNIT 427)", tipo: "importar", de: "dnit-427-2020-me",
        aplicar: function (e, P) {
          var r = e.resultados || {}, i = (e.dados || {}).ident || {};
          if (ok(r.gmm)) P.gmm = fmt(r.gmm, 3);
          P.gmmRef = "DNIT 427 — " + (i.registro || "ensaio salvo") + (i.data ? " · " + i.data.split("-").reverse().join("/") : "");
        } },
      { k: "gmm", r: "Gmm — densidade relativa máxima medida (DNIT 427-ME) — opcional", dica: "para o volume de vazios (7.4, eq. 12)" },
      { k: "gmmRef", r: "Origem do Gmm", ph: "ex.: ensaio Rice nº …" },
      { k: "m1", r: "Cilindro de calibração — m1, massa seca ao ar (g)", se: function (d) { return (d.params || {}).proc !== "geom"; },
        dica: "6.2.4 — só quando algum CP precisar do filme PVC (absorção > 2 %)" },
      { k: "m2", r: "Cilindro — m2, massa na água a 25 °C (g)", se: function (d) { return (d.params || {}).proc !== "geom"; } },
      { k: "m3", r: "Cilindro revestido — m3, massa seca ao ar (g)", se: function (d) { return (d.params || {}).proc !== "geom"; } },
      { k: "m4", r: "Cilindro revestido — m4, massa na água a 25 °C (g)", se: function (d) { return (d.params || {}).proc !== "geom"; } },
      { k: "dpaAdot", r: "…ou densidade do filme PVC adotada (Dpa)", se: function (d) { return (d.params || {}).proc !== "geom"; },
        dica: "usada só se a calibração acima estiver incompleta" },
    ],
    padrao: { origemCP: "lab", proc: "hidro" },
    tabelas: function (d) {
      var geom = (d.params || {}).proc === "geom";
      var linhas = [{ k: "nome", r: "Identificação do CP", texto: true }];
      if (geom) {
        linhas = linhas.concat([
          { k: "A", r: "A — massa do CP seco ao ar (6.3.1)", u: "g" },
          { grupo: "Altura — quatro leituras em posições diametralmente opostas (6.3.2)" },
          { k: "h1", r: "Altura — leitura 1", u: "cm" }, { k: "h2", r: "Altura — leitura 2", u: "cm" },
          { k: "h3", r: "Altura — leitura 3", u: "cm" }, { k: "h4", r: "Altura — leitura 4", u: "cm" },
          { grupo: "Diâmetro — duas leituras perpendiculares em cada face (6.3.2)" },
          { k: "d1", r: "Diâmetro — face 1, leitura 1", u: "cm" }, { k: "d2", r: "Diâmetro — face 1, leitura 2", u: "cm" },
          { k: "d3", r: "Diâmetro — face 2, leitura 1", u: "cm" }, { k: "d4", r: "Diâmetro — face 2, leitura 2", u: "cm" },
          { grupo: "Cálculos (7.3 e 7.4)" },
          { calc: "H", r: "H — altura média", u: "cm", casas: 3 },
          { calc: "D", r: "D — diâmetro médio", u: "cm", casas: 3 },
          { calc: "V", r: "V = H × π × D² / 4 (eq. 5)", u: "cm³", casas: 2 },
          { calc: "mea", r: "MEa = A / V (eq. 10)", u: "g/cm³", casas: 4, destaque: true },
          { calc: "gmb", r: "Gmb = MEa / 0,9971 (eq. 11)", u: "—", casas: 4, destaque: true },
          { calc: "vv", r: "Vv = (1 − Gmb / Gmm) × 100 (eq. 12)", u: "%", casas: 1 },
        ]);
      } else {
        linhas = linhas.concat([
          { grupo: "6.1 — pesagem hidrostática a (25 ± 1) °C" },
          { k: "A", r: "A — massa do CP seco ao ar (6.1.1)", u: "g" },
          { k: "B", r: "B — massa do CP imerso em água, 3 a 5 min (6.1.2)", u: "g" },
          { k: "C", r: "C — massa do CP saturado com superfície seca (6.1.3)", u: "g" },
          { calc: "abs", r: "Água absorvida = 100 × (C − A) / (C − B) (eq. 1)", u: "%", casas: 1 },
          { grupo: "6.2 — filme PVC (só se a absorção for > 2 %)" },
          { k: "Dm", r: "D — massa do CP seco ao ar (6.2.1)", u: "g" },
          { k: "E", r: "E — massa do CP revestido, ao ar (6.2.2 d)", u: "g" },
          { k: "F", r: "F — massa do CP revestido, na água (6.2.3)", u: "g" },
          { k: "Eo", r: "Eoriginal — massa original, se úmido/solvente (6.2.5 a)", u: "g" },
          { k: "Es", r: "Eseca — massa após secagem (6.2.5 b)", u: "g" },
          { calc: "eUmid", r: "Eumidade = Eoriginal − Eseca (eq. 4), subtraída de D, E e F", u: "g", casas: 1 },
          { grupo: "Dimensões — opcional (8 e)" },
          { k: "hm", r: "Altura média do CP", u: "cm" },
          { k: "dm", r: "Diâmetro médio do CP", u: "cm" },
          { grupo: "Resultados (7.1, 7.2 e 7.4)" },
          { calc: "gmb", r: "Gmb — eq. 6: A / (C − B), ou eq. 8 com filme PVC", u: "—", casas: 4, destaque: true },
          { calc: "mea", r: "MEa = 0,9971 × Gmb (eq. 7 / eq. 9)", u: "g/cm³", casas: 4, destaque: true },
          { calc: "vv", r: "Vv = (1 − Gmb / Gmm) × 100 (eq. 12)", u: "%", casas: 1 },
        ]);
      }
      return [{ chave: "cps", titulo: "Corpos de prova", rotulo: "CP", iniciais: 3, min: 1, linhas: linhas,
        dica: geom ? "uma coluna por CP; leituras com paquímetro de resolução 0,1 mm, em centímetros"
          : "uma coluna por CP; preencha 6.2 só nos CPs com absorção > 2 % (o mesmo CP segue para o filme PVC)" }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], geom = P.proc === "geom";
      var gmm = num(P.gmm);
      // densidade do filme PVC (6.2.4)
      var m1 = num(P.m1), m2 = num(P.m2), m3 = num(P.m3), m4 = num(P.m4);
      var dcil = ok(m1) && ok(m2) && m1 > m2 ? m1 / (m1 - m2) : NaN;              // eq. 2
      var dpa = ok(dcil) && ok(m3) && ok(m4) ? (m3 - m1) / (m3 - m4 - m1 / dcil) : NaN;  // eq. 3
      var origemDpa = ok(dpa) ? "calibração (eq. 3)" : "";
      if (!ok(dpa) && ok(num(P.dpaAdot))) { dpa = num(P.dpaAdot); origemDpa = "valor adotado"; }
      if (!geom && ok(dpa) && (dpa < 0.5 || dpa > 2)) avisos.push("Densidade do filme PVC = " + fmt(dpa, 3) + ", fora do esperado — confira m1 a m4 (6.2.4).");
      var tmax = num(P.tmax);
      var cps = (d.cps || []).map(function (p, i) {
        var nome = String(p.nome || "").trim() || String(i + 1), rot = "CP " + nome;
        var o = { nome: nome, eq: "", valido: false, abs: NaN, eUmid: NaN, A: num(p.A), V: NaN, H: NaN, D: NaN, gmb: NaN, mea: NaN, vv: NaN };
        if (geom) {
          var hs = leituras(p, "h", 4), ds = leituras(p, "d", 4);
          o.H = media(hs); o.D = media(ds);
          if (ok(o.H) && ok(o.D)) {
            o.V = o.H * Math.PI * o.D * o.D / 4;             // eq. 5
            if (ok(o.A)) { o.mea = o.A / o.V; o.gmb = o.mea / RHO; o.eq = "7.3"; o.valido = true; }  // eq. 10 e 11
            if (hs.length < 4) avisos.push(rot + ": " + hs.length + " leitura(s) de altura; a norma pede a média de quatro (6.3.2).");
            if (ds.length < 4) avisos.push(rot + ": " + ds.length + " leitura(s) de diâmetro; a norma pede quatro — duas perpendiculares em cada face (6.3.2).");
          }
        } else {
          var A = o.A, B = num(p.B), C = num(p.C);
          if (ok(A) && ok(B) && ok(C) && C > B) o.abs = 100 * (C - A) / (C - B);  // eq. 1
          if (ok(A) && ok(C) && C < A) avisos.push(rot + ": C (saturado com superfície seca) menor que A (seco) — confira as pesagens.");
          var Dm = num(p.Dm), E = num(p.E), F = num(p.F), Eo = num(p.Eo), Es = num(p.Es);
          o.eUmid = ok(Eo) && ok(Es) ? Eo - Es : NaN;                               // eq. 4
          var temPVC = ok(Dm) && ok(E) && ok(F);
          if (ok(o.abs) && o.abs <= 2) {
            o.gmb = A / (C - B); o.eq = "7.1"; o.valido = true;                     // eq. 6
            if (temPVC) avisos.push(rot + ": absorção de " + fmt(o.abs, 1) + " % (≤ 2 %) — vale a eq. 6 (7.1); os dados do filme PVC foram ignorados.");
          } else if (temPVC || (ok(o.abs) && o.abs > 2)) {
            if (temPVC && ok(dpa)) {
              var eu = ok(o.eUmid) ? o.eUmid : 0;
              var Dc = Dm - eu, Ec = E - eu, Fc = F - eu;                            // 6.2.5: subtrair Eumidade das massas
              var den = Ec - Fc - (Ec - Dc) / dpa;
              if (den > 0) { o.gmb = Dc / den; o.eq = "7.2"; o.valido = true; }      // eq. 8
              if (E < Dm) avisos.push(rot + ": E (revestido) menor que D (seco) — confira as pesagens.");
            } else if (temPVC) {
              avisos.push(rot + ": informe a calibração do filme PVC (m1 a m4) ou a Dpa adotada para aplicar a eq. 8.");
            } else {
              o.gmb = A / (C - B); o.eq = "7.1";                                    // calculado, mas não vale (absorção > 2 %)
              avisos.push(rot + ": absorção de " + fmt(o.abs, 1) + " % (> 2 %): a norma manda seguir com o mesmo CP para o filme PVC (6.1.4 e 6.2). " +
                "Gmb pela eq. 6 = " + fmt(o.gmb, 4) + " mostrado, mas fora da média.");
            }
          }
          if (ok(o.eUmid) && o.eUmid < 0) avisos.push(rot + ": Eseca maior que Eoriginal — confira (6.2.5).");
          o.H = num(p.hm); o.D = num(p.dm);
        }
        if (ok(o.gmb)) o.mea = geom ? o.mea : RHO * o.gmb;                          // eq. 7 / 9
        if (ok(o.gmb) && ok(gmm) && gmm > 0) {
          o.vv = (1 - o.gmb / gmm) * 100;                                            // eq. 12
          if (o.valido && !geom && o.vv >= 10) avisos.push(rot + ": Vv = " + fmt(o.vv, 1) + " % (≥ 10 %): o procedimento adequado é o geométrico (6.3 e 7.3) — recalcule (7.4).");
          if (o.valido && geom && o.vv < 10) avisos.push(rot + ": Vv = " + fmt(o.vv, 1) + " % (< 10 %): o procedimento adequado é a pesagem hidrostática (6.1/6.2, 7.1/7.2) — recalcule (7.4).");
          if (o.vv < 0) avisos.push(rot + ": Gmb maior que Gmm (vazios negativos) — confira o Gmm e as pesagens.");
        }
        if (ok(tmax) && tmax > 0) {
          if (ok(o.D) && o.D * 10 < 4 * tmax) avisos.push(rot + ": diâmetro de " + fmt(o.D, 1) + " cm, menor que 4 × o tamanho máximo do agregado (" + fmt(4 * tmax / 10, 1) + " cm) — seção 5.");
          if (ok(o.H) && o.H * 10 < 1.5 * tmax) avisos.push(rot + ": espessura de " + fmt(o.H, 1) + " cm, menor que 1,5 × o tamanho máximo do agregado (" + fmt(1.5 * tmax / 10, 1) + " cm) — seção 5.");
        }
        return o;
      });
      var val = cps.filter(function (o) { return o.valido; });
      var gmb = media(val.map(function (o) { return o.gmb; })), mea = media(val.map(function (o) { return o.mea; }));
      var vv = media(val.map(function (o) { return o.vv; }));
      if (val.length && !ok(gmm)) avisos.push("Informe o Gmm (DNIT 427-ME) para verificar o volume de vazios e se o procedimento foi o adequado (7.4).");
      if (!geom && cps.some(function (o) { return o.eq === "7.2"; }) && origemDpa === "valor adotado") avisos.push("Densidade do filme PVC adotada (" + fmt(dpa, 3) + "): a norma determina-a com o cilindro de calibração a (25 ± 1) °C (6.2.4).");
      // precisão (Anexo A, informativo)
      if (val.length >= 2) {
        var gs = val.map(function (o) { return o.gmb; }), amp = Math.max.apply(null, gs) - Math.min.apply(null, gs);
        var lim = val.some(function (o) { return o.eq === "7.2"; }) ? D2S_PVC : D2S[P.tnm];
        if (!geom && lim && amp > lim) avisos.push("Amplitude do Gmb entre os CPs = " + fmt(amp, 3) + ", acima da faixa aceitável entre dois resultados de um operador (d2s = " +
          fmt(lim, 3) + ", Anexo A — informativo).");
      }
      return { tab: { cps: cps },
        resultados: { gmb: gmb, mea: mea, vv: vv, gmm: gmm, n: val.length, dcil: dcil, dpa: dpa, origemDpa: origemDpa,
          procedimento: geom ? "geom" : "hidro", cps: cps }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      function item(v, u, rot) { return '<div class="fe-res-item"><div class="fe-res-v">' + v + (u ? " <small>" + u + "</small>" : "") + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var linhas = r.cps.map(function (o) {
        var sit = o.valido ? '<span class="fe-ok">eq. ' + o.eq + "</span>" : o.eq ? '<span class="fe-nok">fora da média</span>' : "—";
        return "<tr><td>" + esc(o.nome) + "</td><td>" + fmt(o.abs, 1) + "</td><td><b>" + fmt(o.gmb, 4) + "</b></td><td>" + fmt(o.mea, 4) + "</td><td>" +
          fmt(o.vv, 1) + "</td><td>" + sit + "</td></tr>";
      }).join("");
      return '<div class="fe-res">' + item(fmt(r.gmb, 4), "", "Densidade relativa aparente Gmb — média de " + r.n + " CP(s)") +
        item(fmt(r.mea, 4), "g/cm³", "Massa específica aparente MEa (média)") +
        item(fmt(r.vv, 1), "%", "Volume de vazios médio (eq. 12)" + (ok(r.gmm) ? " · Gmm " + fmt(r.gmm, 3) : " · informe o Gmm")) +
        (ok(r.dpa) && r.procedimento === "hidro" ? item(fmt(r.dpa, 3), "", "Densidade do filme PVC (" + esc(r.origemDpa) + ")") : "") + "</div>" +
        (r.cps.length ? '<table class="fe-resumo"><thead><tr><th>CP</th><th>Absorção (%)</th><th>Gmb</th><th>MEa (g/cm³)</th><th>Vv (%)</th><th>Cálculo</th></tr></thead><tbody>' +
          linhas + "</tbody></table>" : "");
    },
    relatorio: {
      notas: "Pesagem hidrostática a (25 ± 1) °C: água absorvida = 100 × (C − A)/(C − B) (eq. 1); se ≤ 2 %, Gmb = A/(C − B) (eq. 6); se > 2 %, o mesmo CP é revestido com filme PVC e Gmb = D/(E − F − (E − D)/Dpa) (eq. 8), " +
        "Dpa pelo cilindro de calibração (eq. 2 e 3); com umidade/solvente, Eumidade = Eoriginal − Eseca (eq. 4) é subtraída de D, E e F (6.2.5). Vazios ≥ 10 %: MEa = A/V, V = H × π × D²/4 (eq. 5, 10 e 11). " +
        "MEa = 0,9971 × Gmb. Vv = (1 − Gmb/Gmm) × 100 (eq. 12) indica se o procedimento foi o adequado (7.4). Resultados: absorção com 1 casa, Dpa com 3, Gmb e MEa com 4 casas (seção 8). " +
        "CP com absorção > 2 % sem o ensaio com filme PVC não entra na média.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.mistura) rows.push(["Tipo de mistura", P.mistura]);
        rows.push(["Densidade relativa aparente (Gmb) — média", fmt(r.gmb, 4) + " (" + r.n + " CP)"]);
        rows.push(["Massa específica aparente (MEa) — média", fmt(r.mea, 4) + " g/cm³"]);
        if (ok(r.gmm)) rows.push(["Volume de vazios médio (Gmm = " + fmt(r.gmm, 3) + (P.gmmRef ? " — " + P.gmmRef : "") + ")", fmt(r.vv, 1) + " %"]);
        if (r.procedimento === "hidro" && r.cps.some(function (o) { return o.eq === "7.2"; })) rows.push(["Densidade do filme PVC", fmt(r.dpa, 3) + " (" + r.origemDpa + ")"]);
        r.cps.forEach(function (o) {
          if (!o.eq) return;
          var tam = ok(o.D) && ok(o.H) ? " · Ø " + fmt(o.D, 2) + " × " + fmt(o.H, 2) + " cm" : "";
          rows.push(["CP " + o.nome, (ok(o.abs) ? "absorção " + fmt(o.abs, 1) + " % · " : "") + "Gmb = " + fmt(o.gmb, 4) + " · MEa = " + fmt(o.mea, 4) + " g/cm³" +
            (ok(o.vv) ? " · Vv = " + fmt(o.vv, 1) + " %" : "") + " · eq. " + o.eq + (ok(o.eUmid) ? " · correção de umidade " + fmt(o.eUmid, 4) + " g" : "") + tam +
            (o.valido ? "" : " · FORA DA MÉDIA")]);
        });
        return rows;
      },
    },
    exemplos: [
      { nome: "CPs Marshall da usina — MATRIZ CBUQ (Obra B, 08/07/2024)", dados: function () {
        // planilha ESTABILIDADE E FLUÊNCIA (CPs nº 1, 2 e 4). O Gmm não foi medido: a planilha usa a DMT calculada.
        return { ident: { registro: "EX-GMB-001", obra: "Obra B", local: "Alça 1 Retorno 2 / Pista direita 2 — est. 0 a 1 / 215 a 216",
          camada: "Binder — CBUQ", origem: "Mistura em usina — 75 golpes, 150 °C", data: "2024-07-08" },
          params: { mistura: "CBUQ binder, CAP 30/45, 4,6 %", origemCP: "lab", proc: "hidro", tmax: "19", tnm: "19",
            gmm: "2,5402", gmmRef: "DMT calculada na planilha (não é Gmm Rice)" },
          cps: [
            { nome: "1", A: "1233,6", B: "725,0", C: "1236,9", hm: "6,5", dm: "10,1" },
            { nome: "2", A: "1241,2", B: "731,8", C: "1244,0", hm: "6,7", dm: "10,1" },
            { nome: "4", A: "1203,9", B: "713,2", C: "1208,6", hm: "6,4", dm: "10,1" },
          ] };
      } },
      { nome: "Corpos extraídos da pista, medição geométrica — relatório CP CBUQ (Unidade A, 26/02/2026)", dados: function () {
        // planilha RELATÓRIO DE DADOS DOS ENSAIOS (CP CBUQ), aba de 02 MAR: CB3-1, CB3-2 e o 3º corpo (também rotulado CB3-2).
        // A planilha tem só duas leituras de diâmetro por corpo.
        return { ident: { registro: "EX-GMB-002", obra: "Unidade A", camada: "Revestimento — CBUQ", origem: "Corpos extraídos por sonda rotativa", data: "2026-02-26" },
          params: { mistura: "CBUQ", origemCP: "campo", proc: "geom", tmax: "19" },
          cps: [
            { nome: "CB3-1", A: "1202,2", h1: "6,369", h2: "6,555", h3: "6,503", h4: "6,423", d1: "9,979", d2: "9,991" },
            { nome: "CB3-2", A: "1064,1", h1: "5,880", h2: "5,877", h3: "5,839", h4: "5,808", d1: "9,970", d2: "9,965" },
            { nome: "CB3-2 (3º)", A: "1189,2", h1: "6,509", h2: "6,561", h3: "6,693", h4: "6,796", d1: "9,879", d2: "9,865" },
          ] };
      } },
      { nome: "Mistura absorvente — filme PVC, correção de umidade e CP sem o ensaio com PVC", dados: function () {
        return { ident: { registro: "EX-GMB-003", camada: "Capa — CBUQ faixa C", origem: "Corpos extraídos da pista (úmidos)" },
          params: { mistura: "CBUQ faixa C, CAP 50/70, 5,2 %", origemCP: "campo", proc: "hidro", tmax: "12,5", tnm: "12,5",
            gmm: "2,468", gmmRef: "Rice — EX-RICE (exemplo)", m1: "1250,0", m2: "787,4", m3: "1263,8", m4: "789,8" },
          cps: [
            { nome: "P1", A: "1180,4", B: "671,9", C: "1193,6", Dm: "1180,4", E: "1195,0", F: "661,5", hm: "6,3", dm: "10,0" },
            { nome: "P2", A: "1175,2", B: "668,3", C: "1186,0", Dm: "1177,6", E: "1191,5", F: "660,1", Eo: "1177,6", Es: "1175,2", hm: "6,2", dm: "10,0" },
            { nome: "P3", A: "1169,8", B: "663,0", C: "1182,6", hm: "6,2", dm: "10,0" },
          ] };
      } },
    ],
  };
})();
