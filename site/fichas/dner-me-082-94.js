/*
 * Ficha: DNER-ME 082/94 — Solos — Limite de plasticidade (e índice de plasticidade, 6 notas 1 a 4).
 * Registra-se no motor de site/fichas.js (window.FE). O LL pode vir de um ensaio salvo da DNER-ME 122/94.
 *
 * Campos de calcular(d).resultados:
 *   resultados.LP       limite de plasticidade (média das determinações consideradas) aproximado ao inteiro
 *   resultados.LPexato  média antes do arredondamento
 *   resultados.lpNP     true quando o LP não pôde ser determinado (NP)
 *   resultados.LL       LL usado no IP (número) ou NaN; resultados.llNP true quando o LL é NP
 *   resultados.IP       índice de plasticidade = LL − LP (número) ou NaN; resultados.ipNP true quando IP = NP
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var U = FE.BLOCOS.umidade;
  var TOL = 5;  // 5 d: três valores que não difiram da respectiva média de mais de 5 %

  function txtLL(r) { return r.llNP ? "NP" : ok(r.LL) ? fmt(r.LL, 0) + " %" : "—"; }
  function txtLP(r) { return r.lpNP ? "NP" : ok(r.LP) ? fmt(r.LP, 0) + " %" : "—"; }
  function txtIP(r) { return r.ipNP ? "NP" : ok(r.IP) ? fmt(r.IP, 0) + " %" : "—"; }

  FE.FICHAS["dner-me-082-94"] = {
    titulo: "Solos — Limite de plasticidade e índice de plasticidade",
    rotuloImportar: function (r) { return "LP " + txtLP(r) + " · IP " + txtIP(r); },
    resumo: "Rolagem de cilindros de 3 mm na placa de vidro; umidade de cada determinação; LP = média de três valores que não difiram mais de 5 % da média (5 d e 6). IP = LL − LP, ou NP (6, notas 1 a 4).",
    blocos: ["umidade"],
    params: [
      { k: "lpNP", r: "Foi possível determinar o LP?", tipo: "select",
        opcoes: [["sim", "Sim"], ["nao", "Não — o cilindro de 3 mm não se forma (NP, notas 2 e 3)"]],
        dica: "em solos extremamente arenosos o LP é feito antes do LL; se não puder ser determinado, LL e LP são NP (nota 3)" },
      { k: "importar", r: "Limite de liquidez: buscar ensaio salvo (DNER-ME 122/94)", tipo: "importar", de: "dner-me-122-94",
        dica: "traz o LL (ou NP) de um ensaio da ficha de limite de liquidez",
        aplicar: function (e, P) {
          var r = e.resultados || {}, i = (e.dados || {}).ident || {};
          P.LL = r.np ? "NP" : ok(r.LL) ? String(r.LL) : "";
          P.llRegistro = (i.registro || "") + (i.origem ? " · " + i.origem : "") + (i.data ? " · " + i.data.split("-").reverse().join("/") : "");
        } },
      { k: "LL", r: "Limite de liquidez LL (%) — ou NP", ph: "ex.: 35", dica: "DNER-ME 122/94; digite NP se o solo não apresenta LL" },
      { k: "llRegistro", r: "Ensaio de limite de liquidez de referência" },
      { k: "preparo", r: "Preparação da amostra (DNER-ME 041/94, 4)", ph: "ex.: passada na peneira de 0,42 mm, cerca de 50 g" },
    ],
    padrao: { lpNP: "sim" },
    tabelas: function () {
      return [{ chave: "det", titulo: "Determinações", rotulo: "Det.", iniciais: 3, min: 3, usar: true,
        dica: "uma coluna por cilindro fragmentado (cerca de 20 g cada, 5 b); desmarque \"usar\" para excluir um valor discrepante e repita até ter três aceitos (5 d)",
        linhas: [{ grupo: "Umidade do cilindro fragmentado — bloco Teor de umidade, DNIT 456-ME (= 5 c)" }]
          .concat(U.linhas("u", "", "lab"))
          .concat([{ calc: "dev", r: "Diferença para a média dos valores considerados (≤ 5 %, 5 d)", u: "%", casas: 1 }]) }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var det = (d.det || []).map(function (p) {
        var h = U.calcular(p, "u", "lab").w;
        return { uW: h, h: h, usar: p.usar !== false };
      });
      var usados = det.filter(function (o) { return o.usar && ok(o.h); });
      var m = media(usados.map(function (o) { return o.h; }));
      det.forEach(function (o) { o.dev = ok(o.h) && ok(m) && m > 0 ? Math.abs(o.h - m) / m * 100 : NaN; });
      var lpNP = P.lpNP === "nao";
      var res = { LPexato: NaN, LP: NaN, lpNP: lpNP, LL: NaN, llNP: false, IP: NaN, ipNP: false, n: usados.length, conforme: null };
      if (!lpNP) {
        det.forEach(function (o, i) {
          if (o.usar && o.dev > TOL) avisos.push("Determinação " + (i + 1) + ": umidade de " + fmt(o.h, 2) + " % difere " + fmt(o.dev, 1) +
            " % da média (" + fmt(m, 2) + " %), acima de 5 % — repita a operação ou desmarque o valor (5 d).");
        });
        if (usados.length && usados.length < 3) avisos.push("O LP é a média de três valores que não difiram da média de mais de 5 % (5 d); há " + usados.length + " considerado(s).");
        res.conforme = usados.length >= 3 ? usados.every(function (o) { return o.dev <= TOL; }) : null;
        res.LPexato = m;
        res.LP = ok(m) ? Math.round(m) : NaN;
      }
      // LL informado ou importado
      var llTxt = String(P.LL || "").trim();
      if (/^np$/i.test(llTxt)) res.llNP = true;
      else res.LL = num(llTxt);
      if (lpNP) {
        res.ipNP = true;
        if (!res.llNP) avisos.push("LP não determinado: anote LL e LP como NP e o IP como NP (6, notas 2 e 3).");
      } else if (res.llNP) {
        res.ipNP = true;
        avisos.push("LL não determinado (NP): o índice de plasticidade é NP (6, nota 2).");
      } else if (ok(res.LL) && ok(res.LP)) {
        if (res.LP >= res.LL) { res.ipNP = true; avisos.push("LP (" + res.LP + " %) igual ou maior que o LL (" + fmt(res.LL, 0) + " %): IP = NP (6, nota 4)."); }
        else res.IP = res.LL - res.LP;  // 6, nota 1
      }
      return { tab: { det: det }, resultados: res, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      function cx(v, rot) { return '<div class="fe-res-item"><div class="fe-res-v">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      return '<div class="fe-res">' +
        cx(r.lpNP ? "NP" : ok(r.LP) ? r.LP + " <small>%</small>" : "—", "Limite de plasticidade (LP) — média de " + r.n + " valor(es)" +
          (ok(r.LPexato) && !r.lpNP ? " (" + fmt(r.LPexato, 2) + " %)" : "") +
          (r.conforme === null || r.lpNP ? "" : r.conforme ? ' · <span class="fe-ok">todos a ≤ 5 % da média</span>' : ' · <span class="fe-nok">valor a mais de 5 % da média</span>')) +
        cx(r.llNP ? "NP" : ok(r.LL) ? fmt(r.LL, 0) + " <small>%</small>" : "—", "Limite de liquidez (LL) — DNER-ME 122/94") +
        cx(r.ipNP ? "NP" : ok(r.IP) ? fmt(r.IP, 0) + " <small>%</small>" : "—", "Índice de plasticidade IP = LL − LP (6, nota 1)") + "</div>";
    },
    relatorio: {
      notas: "Umidade: h = (Ph − Ps) / Ps × 100 (5 c; a norma omite o fator 100, mas define h em porcentagem), igual à eq. 1 da DNIT 456-ME. LP = média dos valores considerados, cada um a no máximo 5 % (relativo) da média (5 d e 6); a norma não fixa o arredondamento do LP: adotado o inteiro mais próximo, como o LL (DNER-ME 122/94, 7.2.4). IP = LL − LP; NP quando LL ou LP não puderem ser determinados ou quando LP ≥ LL (6, notas 1 a 4).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {};
        return [["Limite de plasticidade (LP)", txtLP(r) + (ok(r.LPexato) && !r.lpNP ? " (média de " + r.n + " valores: " + fmt(r.LPexato, 2) + " %)" : "")],
          ["Limite de liquidez (LL)", txtLL(r) + (P.llRegistro ? " — ensaio " + P.llRegistro : "")],
          ["Índice de plasticidade (IP)", txtIP(r)]];
      },
    },
    exemplos: [
      { nome: "Rua A — 5 determinações, LL importado (planilha PROCTOR INTERMEDIÁRIO, Unidade A)", dados: function () {
        return { ident: { registro: "12", data: "2024-12-09", obra: "Obra A", trecho: "Rua A (estaca 11 a 14)", origem: "Unidade A" },
          params: { lpNP: "sim", importar: "ex:dner-me-122-94:0", LL: "25", llRegistro: "12 · Unidade A · 09/12/2024" },
          det: [["35", "6,50", "8,00", "7,71"], ["36", "5,50", "7,70", "7,30"], ["37", "6,23", "7,60", "7,35"], ["38", "11,98", "13,50", "13,21"],
            ["39", "11,69", "13,30", "13,00"]].map(function (x) { return { usar: true, un: x[0], ut: x[1], uu: x[2], us: x[3] }; }) };
      } },
      { nome: "Obra C — 5 determinações, uma a mais de 5 % da média (matriz de solos do Unidade B)", dados: function () {
        return { ident: { registro: "1", data: "2026-06-05", obra: "Obra C", trecho: "RO-000", camada: "Sub-base — argila/areia", origem: "Unidade B" },
          params: { lpNP: "sim", importar: "ex:dner-me-122-94:1", LL: "43", llRegistro: "1 · Unidade B · 05/06/2026" },
          det: [["16", "7,2", "9,0", "8,7"], ["152", "6,5", "9,0", "8,6"], ["74", "7,8", "10,7", "10,2"], ["104", "5,0", "6,9", "6,6"],
            ["87", "7,1", "8,3", "8,1"]].map(function (x) { return { usar: true, un: x[0], ut: x[1], uu: x[2], us: x[3] }; }) };
      } },
      { nome: "Argila siltosa — LL digitado, 3 determinações", dados: function () {
        // alvos de umidade 30,6 / 31,2 / 30,9 % (LP 31) e LL 58 → IP 27
        var alvo = [30.6, 31.2, 30.9];
        return { ident: { registro: "EX-LP-003", camada: "Subleito — argila siltosa", origem: "Corte km 12" },
          params: { lpNP: "sim", LL: "58", llRegistro: "EX-LL-003 (repetido)" },
          det: alvo.map(function (h, i) {
            var t = 12.4 + i * 0.83, ms = 11.5 + i * 1.7, s = t + ms;
            return { usar: true, un: String(60 + i), ut: fmt(t, 2), uu: fmt(s + ms * h / 100, 2), us: fmt(s, 2) };
          }) };
      } },
    ],
  };
})();
