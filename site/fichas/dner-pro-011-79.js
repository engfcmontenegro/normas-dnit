/*
 * Ficha: DNER-PRO 011/79 — Avaliação estrutural dos pavimentos flexíveis — Procedimento "B".
 * Registra-se no motor de site/fichas.js (window.FE); usa FE.defl (definido em dner-pro-010-79.js).
 * Estatística das deflexões do segmento homogêneo (4.2.7), deflexão de projeto Dp = Dc × Fs (4.2.8), deflexão
 * admissível log Dadm = 3,01 − 0,176 log N (cap. 5; metade em semirrígido, dobro em tratamento superficial),
 * vida restante Nr = Nt − Ns (cap. 6), hipóteses da Tabela III (cap. 7) e reforço pelo critério deflectométrico
 * h = K log(Dp/Dadm), K = 40 em concreto betuminoso, K do material por medidas antes/depois, hr = K/40 × h40, e
 * camadas múltiplas pelos coeficientes da Tabela IV (8.1).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var DF = FE.defl;

  // Tabela IV — coeficientes de equivalência estrutural (componentes do reforço)
  var TAB4 = [["cb", "Concreto betuminoso", 2.00], ["pmqd", "Pré-misturado a quente de graduação densa", 1.70], ["pmfd", "Pré-misturado a frio de graduação densa", 1.40],
    ["mbp", "Macadame betuminoso por penetração", 1.20], ["bgs", "Brita graduada com ISC > 80", 1.10], ["gran", "Material granular com ISC ≥ 60", 1.00],
    ["sc45", "Solo-cimento, RCS 7 dias > 45 kg/cm²", 1.70], ["sc28", "Solo-cimento, RCS 7 dias entre 28 e 45 kg/cm²", 1.40], ["sc0", "Solo-cimento, RCS 7 dias < 28 kg/cm²", 1.00]];
  // fator da deflexão admissível conforme o tipo de pavimento (cap. 5)
  var TIPOS = { cb: 1, semi: 0.5, ts: 2 };
  function dadm(N, f) { return ok(N) && N > 0 ? f * Math.pow(10, 3.01 - 0.176 * Math.log10(N)) : NaN; }
  function nDe(D, f) { return ok(D) && D > 0 ? Math.pow(10, (3.01 - Math.log10(D / f)) / 0.176) : NaN; }
  function se(k, v) { return function (d) { var x = (d.params || {})[k]; return Array.isArray(v) ? v.indexOf(x) >= 0 : x === v; }; }

  var HIP = {
    I: { q: "BOA", est: "NÃO", crit: "—", med: "Apenas correções de superfície" },
    IIr: { q: "REGULAR", est: "NÃO", crit: "Deflectométrico", med: "Reforço" },
    IIm: { q: "MÁ", est: "SIM", crit: "Deflectométrico e resistência", med: "Reforço ou reconstrução" },
    III: { q: "REGULAR PARA MÁ", est: "SIM", crit: "Deflectométrico e resistência", med: "Reforço ou reconstrução" },
    IV: { q: "MÁ", est: "SIM", crit: "Resistência", med: "Reforço ou reconstrução" },
    V: { q: "MÁ — deformações permanentes e rupturas plásticas generalizadas", est: "SIM", crit: "Resistência", med: "Reconstrução" },
  };

  FE.FICHAS["dner-pro-011-79"] = {
    titulo: "Avaliação estrutural de pavimentos flexíveis — Procedimento B",
    rotuloImportar: function (r) { var g = (r.grupos || [])[0]; return g && g.est ? "Dp " + fmt(g.dp, 1) + " · hip. " + (g.hip || "—") + (ok(g.hr) ? " · h " + fmt(g.hr, 1) + " cm" : "") : ""; },
    resumo: "Estatística das deflexões (4.2.7: Dc = D̄ + σ), Dp = Dc × Fs, Dadm (log Dadm = 3,01 − 0,176 log N), vida restante, hipóteses da Tabela III e reforço h = K log(Dp/Dadm) (8.1), com K = 40 ou do material e camadas múltiplas (Tabela IV).",
    blocos: [],
    params: DF.params("4.2.2").concat(DF.paramsFs("4.2.8")).concat([
      { k: "tipo", r: "Pavimento existente (cap. 5)", tipo: "select",
        opcoes: [["cb", "Concreto betuminoso sobre base granular"], ["semi", "Semirrígido — base de solo-cimento ou brita tratada com cimento (Dadm ÷ 2)"], ["ts", "Tratamento superficial sobre base granular (Dadm × 2 na avaliação)"]] },
      { k: "ns", r: "Ns — N suportado desde a abertura até a avaliação", ph: "ex.: 2,5e6", dica: "verifica a fase elástica (cap. 5) e a vida restante (cap. 6)" },
      { k: "np", r: "Np — N do período de projeto do reforço", ph: "ex.: 5e6", dica: "Dadm do projeto de reforço (cap. 5)" },
      { k: "ntab", r: "N usado na Tabela III", tipo: "select", opcoes: [["ns", "Ns — tráfego já suportado (fase elástica)"], ["np", "Np — tráfego do projeto de reforço"]] },
      { k: "rrep", r: "Raio de curvatura representativo (Tabela III)", tipo: "select", opcoes: [["med", "Média dos raios do segmento"], ["min", "Menor raio do segmento"], ["inf", "Informado"]] },
      { k: "rinf", r: "R informado (m)", se: se("rrep", "inf") },
      { k: "igg", r: "IGG — índice de gravidade global (hipótese V se > 180)" },
      { k: "n1", r: "N do primeiro ano após a avaliação — opcional (vida restante em anos)" },
      { k: "tx", r: "Taxa de crescimento anual do tráfego (%) — opcional" },
      { k: "kmodo", r: "Fator K do material do reforço (8.1.1)", tipo: "select", recarrega: true,
        opcoes: [["40", "K = 40 — concreto betuminoso"], ["inf", "K informado"], ["med", "K = h / log(D0/Dr) — medidas antes e depois de um reforço"]] },
      { k: "k", r: "K informado", se: se("kmodo", "inf") },
      { k: "kh", r: "h do reforço medido (cm)", se: se("kmodo", "med") },
      { k: "kd0", r: "D0 — deflexão antes do reforço (0,01 mm)", se: se("kmodo", "med") },
      { k: "kdr", r: "Dr — deflexão sobre o reforço (0,01 mm)", se: se("kmodo", "med") },
      { k: "multi", r: "Camadas múltiplas (8.1.2, Tabela IV)", tipo: "select", recarrega: true,
        opcoes: [["nao", "Não"], ["sim", "Substituir parte do concreto betuminoso por outro material"]] },
      { k: "hcbsup", r: "Espessura mantida em concreto betuminoso (cm)", ph: "ex.: 5", se: se("multi", "sim") },
      { k: "mat", r: "Material das camadas inferiores (Tabela IV)", tipo: "select", se: se("multi", "sim"),
        opcoes: TAB4.slice(1).map(function (x) { return [x[0], x[1] + " — " + fmt(x[2], 2)]; }) },
    ]),
    padrao: { correl: "nao", universo: "unico", subleito: "arenoso", estacao: "seca", tipo: "cb", ntab: "ns", rrep: "med", kmodo: "40", multi: "nao", mat: "bgs" },
    tabelas: function () {
      return [{ chave: "pts", titulo: "Estações de ensaio — deflexões recuperáveis na trilha de roda externa", rotulo: "Estação", iniciais: 10, min: 1,
        dica: "estações alternadas nas duas faixas, 40 m numa mesma faixa (4.2.1); raios a cada 200 m (4.2.2)", linhas: DF.linhas() }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var proc = DF.processar(d, avisos);
      DF.verificarExtensao(proc.ext, P.universo === "faixa", 2000, avisos, "4.2.6 / 4.2.7");
      var fs = DF.fs(P, avisos, "4.2.8");
      var f = TIPOS[P.tipo || "cb"], fRef = P.tipo === "ts" ? 1 : f;
      var ns = num(P.ns), np = num(P.np), igg = num(P.igg);
      var R = P.rrep === "min" ? proc.rMin : P.rrep === "inf" ? num(P.rinf) : proc.rMed;
      if (!ok(R)) avisos.push("Sem raio de curvatura: a Tabela III usa R ≥ 100 m ou R < 100 m (informe R nas estações ou o valor representativo).");
      var nTab = P.ntab === "np" ? np : ns;
      if (!ok(nTab)) avisos.push("Informe " + (P.ntab === "np" ? "Np" : "Ns") + " para a deflexão admissível da Tabela III (cap. 5).");
      if (!ok(np)) avisos.push("Informe Np (tráfego do período de projeto do reforço) para a Dadm do reforço (cap. 5).");
      var K = 40, kFonte = "concreto betuminoso";
      if (P.kmodo === "inf") { K = num(P.k); kFonte = "informado"; }
      if (P.kmodo === "med") {
        var kh = num(P.kh), k0 = num(P.kd0), kr = num(P.kdr);
        K = ok(kh) && ok(k0) && ok(kr) && k0 > kr ? kh / Math.log10(k0 / kr) : NaN; kFonte = "medido: h / log(D0/Dr)";
        if (!ok(K)) avisos.push("Para K medido informe h, D0 e Dr (D0 > Dr), medidos sob as mesmas condições do subleito e após a consolidação do reforço (8.1.1).");
      }
      var r = { fs: fs, f: f, ns: ns, np: np, igg: igg, R: R, rMed: proc.rMed, rMin: proc.rMin, nR: proc.nR, K: K, kFonte: kFonte, ext: proc.ext,
        dadmTab: dadm(nTab, f), dadmS: dadm(ns, f), dadmP: dadm(np, fRef), grupos: [] };
      proc.grupos.forEach(function (g) {
        var o = { k: g.k, est: g.est };
        if (g.est) {
          o.dp = g.est.dc * fs;
          // Tabela III
          var Da = r.dadmTab, hip = "";
          if (ok(igg) && igg > 180) hip = "V";
          else if (ok(Da) && ok(R)) {
            if (o.dp <= Da) hip = R >= 100 ? "I" : "III";
            else hip = R >= 100 ? (o.dp <= 3 * Da ? "IIr" : "IIm") : "IV";
          }
          o.hipK = hip; o.hip = hip.replace(/[rm]$/, "");
          // vida restante (cap. 6): Dp ≤ Dadm(Ns) e R ≥ 100
          if (ok(ns) && ok(r.dadmS) && o.dp <= r.dadmS && (!ok(R) || R >= 100)) {
            o.nt = nDe(o.dp, f); o.nr = o.nt - ns;
            var n1 = num(P.n1), tx = num(P.tx) / 100;
            if (o.nr > 0 && ok(n1) && n1 > 0) o.anos = ok(tx) && tx > 0 ? Math.log(1 + o.nr * tx / n1) / Math.log(1 + tx) : o.nr / n1;
          }
          // reforço (8.1)
          if (ok(r.dadmP)) {
            o.h40 = 40 * Math.log10(o.dp / r.dadmP);
            o.hr = ok(K) ? K / 40 * o.h40 : NaN;
            if (o.h40 <= 0) { o.h40 = 0; o.hr = 0; }
            if (P.multi === "sim" && o.hr > 0) {
              var hs = num(P.hcbsup), m = TAB4.filter(function (x) { return x[0] === (P.mat || "bgs"); })[0];
              if (ok(hs) && m) {
                o.mhs = Math.min(hs, o.hr); o.msub = Math.max(0, o.hr - hs); o.mmat = m[1]; o.mcoef = m[2];
                o.mh = o.msub * 2.00 / m[2];
              } else avisos.push("Camadas múltiplas: informe a espessura mantida em concreto betuminoso (8.1.2).");
            }
            if (o.hr > 5 && P.multi !== "sim") avisos.push("Reforço de " + fmt(o.hr, 1) + " cm de concreto betuminoso (> 5 cm): estudar camadas múltiplas para as camadas inferiores (8.1.2)" + (g.k ? " — faixa " + g.k : "") + ".");
          }
          if (o.hip === "IV" || o.hip === "V" || o.hipK === "IIm" || o.hip === "III") avisos.push("Hipótese " + o.hip + (g.k ? " (faixa " + g.k + ")" : "") + ": exige estudos complementares e o critério de resistência (Tabela III, 8.2); o h deflectométrico é só indicativo.");
        }
        r.grupos.push(o);
      });
      return { tab: { pts: proc.pts }, pontos: proc.pts, proc: proc, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, h = '<div class="fe-res">', I = DF.item;
      r.grupos.forEach(function (g) {
        var e = g.est, rot = g.k ? " — faixa " + esc(g.k) : "";
        if (!e) return;
        var H = HIP[g.hipK];
        h += I(fmt(e.media, 1) + " ± " + fmt(e.sd, 1) + " <small>0,01 mm</small>", "D̄ ± σ (4.2.7)" + rot + " — n = " + e.n + " de " + e.n0 + ", cv = " + fmt(e.cv * 100, 1) + " %", true) +
          I(fmt(e.dc, 1) + " / " + fmt(g.dp, 1) + " <small>0,01 mm</small>", "Dc = D̄ + σ / Dp = Dc × Fs (Fs = " + fmt(r.fs, 2) + ")" + rot) +
          I(H ? g.hip + " · " + (/BOA/.test(H.q) ? '<span class="fe-ok">' + H.q + "</span>" : '<span class="fe-nok">' + esc(H.q.split(" —")[0]) + "</span>") : "—",
            "Tabela III" + rot + (H ? " — critério: " + esc(H.crit) + "; " + esc(H.med) : " — faltam dados"), true);
        if (ok(g.hr)) h += I(fmt(g.hr, 1) + " <small>cm</small>", "Reforço h = K log(Dp/Dadm) — K = " + fmt(r.K, 1) + " (8.1)" + rot + (g.mh ? "; " + fmt(g.mhs, 1) + " cm CB + " + fmt(g.mh, 1) + " cm de " + esc(g.mmat) : ""));
        if (ok(g.nr)) h += I(DF.fmtN(g.nr), "Vida restante Nr = Nt − Ns (Nt = " + DF.fmtN(g.nt) + ")" + (ok(g.anos) ? " ≈ " + fmt(g.anos, 1) + " ano(s)" : "") + rot, true);
      });
      h += I(fmt(r.dadmTab, 1) + " / " + fmt(r.dadmP, 1), "Dadm da Tabela III / do projeto de reforço (0,01 mm)", true);
      return h + "</div>";
    },
    graficos: function (calc, d, opt) { return [DF.deflectograma(calc.proc, opt, "Dc")]; },
    relatorio: {
      notas: "Estatística (4.2.7): D̄, σ com n − 1, eliminação iterativa fora de D̄ ± zσ (Tabela I), cv = σ/D̄, Dc = D̄ + σ; Dp = Dc × Fs (Tabela II). log Dadm = 3,01 − 0,176 log N (0,01 mm, eixo de 8,2 t; metade em pavimento semirrígido, dobro em tratamento superficial na avaliação — o reforço em CBUQ usa a Dadm do concreto betuminoso). " +
        "Vida restante: Nt = N da Dadm igual a Dp; Nr = Nt − Ns (Dp ≤ Dadm e R ≥ 100 m). Reforço: h40 = 40 log(Dp/Dadm); hr = K/40 × h40; camadas múltiplas: espessura substituída × 2,00 / coeficiente da Tabela IV.",
      resultados: function (calc) {
        var r = calc.resultados, rows = [];
        r.grupos.forEach(function (g) {
          var e = g.est, rot = g.k ? " — faixa " + g.k : "";
          if (!e) return;
          var H = HIP[g.hipK];
          rows.push(["Deflexões" + rot, "n = " + e.n + " de " + e.n0 + (e.elim.length ? " (" + e.elim.length + " eliminada(s))" : "") + "; D̄ = " + fmt(e.media, 1) + "; σ = " + fmt(e.sd, 1) + "; cv = " + fmt(e.cv * 100, 1) + " %"]);
          rows.push(["Dc / Dp" + rot, fmt(e.dc, 1) + " / " + fmt(g.dp, 1) + " × 0,01 mm (Fs = " + fmt(r.fs, 2) + ")"]);
          rows.push(["Tabela III" + rot, H ? "Hipótese " + g.hip + " — qualidade " + H.q + "; estudos complementares: " + H.est + "; critério: " + H.crit + "; " + H.med : "faltam dados"]);
          if (ok(g.nr)) rows.push(["Vida restante" + rot, "Nt = " + DF.fmtN(g.nt) + "; Nr = " + (g.nr > 0 ? DF.fmtN(g.nr) : "≤ 0") + (ok(g.anos) ? " (≈ " + fmt(g.anos, 1) + " anos)" : "")]);
          if (ok(g.hr)) rows.push(["Reforço" + rot, "h40 = " + fmt(g.h40, 1) + " cm; hr = " + fmt(g.hr, 1) + " cm (K = " + fmt(r.K, 1) + ", " + r.kFonte + ")" +
            (g.mh ? " → " + fmt(g.mhs, 1) + " cm de CB + " + fmt(g.mh, 1) + " cm de " + g.mmat + " (" + fmt(g.msub, 1) + " × 2,00 / " + fmt(g.mcoef, 2) + ")" : "")]);
        });
        rows.push(["Dadm (0,01 mm)", "Tabela III: " + fmt(r.dadmTab, 1) + "; Ns: " + fmt(r.dadmS, 1) + "; projeto (Np): " + fmt(r.dadmP, 1)]);
        rows.push(["Tráfego / IGG", "Ns = " + DF.fmtN(r.ns) + "; Np = " + DF.fmtN(r.np) + "; IGG = " + fmt(r.igg, 0)]);
        if (ok(r.R)) rows.push(["Raio de curvatura", "representativo " + fmt(r.R, 0) + " m (médio " + fmt(r.rMed, 0) + "; mínimo " + fmt(r.rMin, 0) + "; " + r.nR + " determinações)"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Segmento de 400 m — hipótese II, reforço em CBUQ e brita graduada (dados gerados)", dados: function () {
        return { ident: { registro: "EX-P011-001", data: "2026-06-03", obra: "BR-000", trecho: "Segmento homogêneo 1 — est. 100 a 119", camada: "CBUQ 5 cm sobre base granular" },
          params: { correl: "nao", universo: "unico", subleito: "argiloso", estacao: "seca", fs: "1,25", tipo: "cb", ns: "2,5e6", np: "6e6", ntab: "ns", rrep: "med", igg: "70",
            kmodo: "40", multi: "sim", hcbsup: "5", mat: "bgs" },
          pts: DF.exemploEstacoes(92, 16, 170, 3) };
      } },
      { nome: "Segmento em boas condições — hipótese I, vida restante (dados gerados)", dados: function () {
        var p = DF.exemploEstacoes(48, 9, 260, 17); p[6].D = "88";
        return { ident: { registro: "EX-P011-002", data: "2026-03-18", obra: "BR-000", trecho: "Segmento homogêneo 4", camada: "CBUQ 7,5 cm" },
          params: { correl: "nao", universo: "unico", subleito: "arenoso", estacao: "chuvosa", fs: "1,00", tipo: "cb", ns: "6e6", np: "8e6", ntab: "ns", rrep: "min", igg: "25",
            n1: "1,0e6", tx: "3", kmodo: "40", multi: "nao" },
          pts: p };
      } },
    ],
  };
})();
