/*
 * Ficha: DNIT 452/2024-ME — Agregado graúdo — Adesividade ao ligante asfáltico.
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  var M_AGR = 500, M_LIG = 17.5;          // 5 b; 6.2
  var T_AGR = 100, T_LIG = 120, T_BANHO = 40, HORAS = 72;   // 6.1; 6.3 d
  var CRITERIOS = { nao: "sem deslocamento", parcial: "deslocamento parcial", total: "deslocamento total" };

  // leitura da observação da película: não / parcial / total
  function lerDesl(v) {
    var s = String(v === undefined || v === null ? "" : v).trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (!s) return null;
    if (/^(n|nao|nenhum|sem|0|ok|satisf)/.test(s)) return "nao";
    if (/^(p|parc|sim|s$|houve)/.test(s)) return "parcial";
    if (/^(t|tot)/.test(s)) return "total";
    return "?";
  }
  function nomeEnsaio(e, i) {
    return ok(e.teor) && e.teor > 0 ? "Ensaio " + (i + 1) + " — " + fmt(e.teor, 2) + " % de melhorador" : "Ensaio " + (i + 1) + " — sem melhorador";
  }

  FE.FICHAS["dnit-452-2024-me"] = {
    titulo: "Agregado graúdo — Adesividade ao ligante asfáltico",
    rotuloImportar: function (r) { return r.texto || "—"; },
    resumo: "Duas amostras de 500 g (19,0–12,5 mm) envolvidas com 17,5 g de CAP, em água destilada a 40 °C por 72 h: satisfatório se nenhuma película se deslocar nas duas amostras; se não satisfatório, repete-se com melhorador de adesividade (menor teor que resolve).",
    blocos: [],
    params: [
      { k: "material", r: "Agregado graúdo ensaiado", ph: "ex.: brita 1 granítica" },
      { k: "ligante", r: "Ligante asfáltico (CAP)", ph: "ex.: CAP 50/70" },
      { k: "melhorador", r: "Melhorador de adesividade (DOPE) — nome / fabricante", ph: "ex.: amina graxa XYZ",
        dica: "informe o teor de cada ensaio na tabela (0 ou vazio = sem melhorador)" },
      { k: "tAgr", r: "Temperatura do agregado na mistura (°C) (6.1)", ph: String(T_AGR) },
      { k: "tLig", r: "Temperatura do ligante na mistura (°C) (6.1)", ph: String(T_LIG) },
      { k: "tBanho", r: "Temperatura da estufa com o béquer em água (°C) (6.3 d)", ph: String(T_BANHO) },
      { k: "horas", r: "Duração em estufa (h) (6.3 d)", ph: String(HORAS) },
    ],
    padrao: {},
    tabelas: function () {
      return [{ chave: "ens", titulo: "Ensaios (um por teor de melhorador)", rotulo: "Ensaio", iniciais: 1, min: 1,
        dica: "1º ensaio sem melhorador; se não satisfatório, acrescente ensaios com teores crescentes (7 b). Película: escreva não, parcial ou total",
        linhas: [
          { k: "teor", r: "Teor de melhorador (% da massa de ligante; 0 = sem)", u: "%" },
          { calc: "mDope", r: "Massa de melhorador no ligante da amostra 1", u: "g", casas: 3 },
          { grupo: "Amostra 1 (5 b; 6.2)" },
          { k: "a1", r: "Massa de agregado 19,0–12,5 mm", u: "g", ph: String(M_AGR) },
          { k: "l1", r: "Massa de ligante", u: "g", ph: fmt(M_LIG, 1) },
          { k: "d1", r: "Deslocamento da película após 72 h (não / parcial / total)", u: "", texto: true },
          { grupo: "Amostra 2 (5 b; 6.2)" },
          { k: "a2", r: "Massa de agregado 19,0–12,5 mm", u: "g", ph: String(M_AGR) },
          { k: "l2", r: "Massa de ligante", u: "g", ph: fmt(M_LIG, 1) },
          { k: "d2", r: "Deslocamento da película após 72 h (não / parcial / total)", u: "", texto: true },
        ] }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      function confere(v, alvo, tol, rot) {
        var x = num(v);
        if (ok(x) && Math.abs(x - alvo) > tol) avisos.push(rot + ": " + fmt(x, 1) + " (a norma fixa " + fmt(alvo, alvo % 1 ? 1 : 0) + ").");
      }
      confere(P.tAgr, T_AGR, 0.5, "Temperatura do agregado (°C, 6.1)");
      confere(P.tLig, T_LIG, 0.5, "Temperatura do ligante (°C, 6.1)");
      confere(P.tBanho, T_BANHO, 0.5, "Temperatura da estufa (°C, 6.3 d)");
      var h = num(P.horas);
      if (ok(h) && h < HORAS) avisos.push("Duração de " + fmt(h, 0) + " h, menor que as 72 h do ensaio (6.3 d; 3.1).");
      var ens = (d.ens || []).map(function (x, i) {
        var teor = num(x.teor), o = { teor: ok(teor) ? teor : 0 };
        var l1 = num(x.l1), lig = ok(l1) ? l1 : M_LIG;
        if (o.teor > 0) o.mDope = lig * o.teor / 100;
        var rot = nomeEnsaio(o, i);
        [1, 2].forEach(function (k) {
          var a = num(x["a" + k]), l = num(x["l" + k]);
          if (ok(a) && Math.abs(a - M_AGR) > M_AGR * 0.01) avisos.push(rot + ", amostra " + k + ": " + fmt(a, 1) + " g de agregado — cada amostra tem 500 g (5 b).");
          if (ok(l) && Math.abs(l - M_LIG) > 0.1 + 1e-9) avisos.push(rot + ", amostra " + k + ": " + fmt(l, 1) + " g de ligante — a quantidade é 17,5 g (6.2; balança sensível a 0,1 g).");
        });
        var s1 = lerDesl(x.d1), s2 = lerDesl(x.d2);
        o.s1 = s1; o.s2 = s2;
        if (s1 === "?" || s2 === "?") avisos.push(rot + ": observação da película não reconhecida — escreva não, parcial ou total.");
        if (s1 && s2 && s1 !== "?" && s2 !== "?") {
          o.sat = s1 === "nao" && s2 === "nao";          // 7 a / 7 b
          o.diverge = (s1 === "nao") !== (s2 === "nao");
          if (o.diverge) avisos.push(rot + ": as duas amostras divergiram — o ensaio é concluído como não satisfatório (7; Anexo A, observação).");
        } else if (s1 || s2) avisos.push(rot + ": informe a observação das duas amostras (7: o resultado deve ser o mesmo para as duas).");
        return o;
      });
      var feitos = ens.filter(function (o) { return o.sat !== undefined; });
      // resultado: sem melhorador satisfatório; ou menor teor satisfatório (7 b)
      var sem = feitos.filter(function (o) { return !(o.teor > 0); });
      var comSat = feitos.filter(function (o) { return o.teor > 0 && o.sat; }).sort(function (a, b) { return a.teor - b.teor; });
      var res = { status: null, teor: NaN, texto: "—" };
      if (sem.some(function (o) { return o.sat; })) { res.status = "sat"; res.texto = "Satisfatório (sem melhorador)"; }
      else if (comSat.length) { res.status = "satDope"; res.teor = comSat[0].teor; res.texto = "Não satisfatório sem melhorador; satisfatório com " + fmt(res.teor, 2) + " % de melhorador"; }
      else if (feitos.length) { res.status = "nao"; res.texto = "Não satisfatório" + (feitos.some(function (o) { return o.teor > 0; }) ? " (também com os teores de melhorador ensaiados)" : ""); }
      if (sem.length > 1 && sem.some(function (o) { return o.sat; }) && sem.some(function (o) { return !o.sat; })) avisos.push("Há ensaios sem melhorador com resultados diferentes — confira.");
      if (res.status === "sat" && feitos.some(function (o) { return o.teor > 0; })) avisos.push("O ensaio sem melhorador já foi satisfatório; os ensaios com melhorador são informativos.");
      if (!sem.length && feitos.length) avisos.push("Não há ensaio sem melhorador (0 %): o melhorador só é indicado quando o agregado é não satisfatório sem ele (7 b).");
      if (res.status === "nao" && !feitos.some(function (o) { return o.teor > 0; })) avisos.push("Resultado não satisfatório: recomenda-se repetir o ensaio com melhorador de adesividade e adotar a menor porcentagem que garanta o não deslocamento da película (7 b).");
      if (res.status === "satDope") {
        var falhaAcima = feitos.filter(function (o) { return o.teor > res.teor && !o.sat; });
        if (falhaAcima.length) avisos.push("Teor(es) maior(es) que " + fmt(res.teor, 2) + " % não foram satisfatórios — resultados incoerentes; confira ou repita.");
        if (!P.melhorador) avisos.push("Informe o nome do melhorador de adesividade utilizado.");
      }
      return { tab: { ens: ens }, resultados: { status: res.status, teor: res.teor, texto: res.texto, ens: ens, n: feitos.length }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      var cls = r.status === "sat" || r.status === "satDope" ? "fe-ok" : r.status === "nao" ? "fe-nok" : "";
      var h = '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v"><span class="' + cls + '">' +
        (r.status === "sat" ? "Satisfatório" : r.status === "satDope" ? "Satisfatório com " + fmt(r.teor, 2) + " %" : r.status === "nao" ? "Não satisfatório" : "—") +
        '</span></div><div class="fe-res-r">Adesividade ao ligante asfáltico (7) — ' + esc(r.texto) + "</div></div></div>";
      if (r.ens.length) {
        h += '<table class="fe-resumo"><thead><tr><th>Ensaio</th><th>Melhorador</th><th>Amostra 1</th><th>Amostra 2</th><th>Resultado</th></tr></thead><tbody>' +
          r.ens.map(function (o, i) {
            return "<tr><td>" + (i + 1) + "</td><td>" + (o.teor > 0 ? fmt(o.teor, 2) + " %" : "sem") + "</td><td>" + esc(CRITERIOS[o.s1] || "—") + "</td><td>" + esc(CRITERIOS[o.s2] || "—") +
              "</td><td>" + (o.sat === undefined ? "—" : o.sat ? '<span class="fe-ok">satisfatório</span>' : '<span class="fe-nok">não satisfatório</span>') + "</td></tr>";
          }).join("") + "</tbody></table>";
      }
      return h;
    },
    relatorio: {
      notas: "Duas amostras de 500 g de agregado passante na 19,0 mm e retido na 12,5 mm (5 b), aquecidas a 100 °C e envolvidas com 17,5 g de CAP a 120 °C (6.1, 6.2); após esfriar, cobertas com água destilada e mantidas a 40 °C por 72 h (6.3 d). Satisfatório: nenhum deslocamento da película nas duas amostras (7 a); qualquer deslocamento, total ou parcial, ou divergência entre as amostras: não satisfatório (7 b; Anexo A). Com melhorador, adota-se o menor teor satisfatório (7 b); teor em % da massa de ligante.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Agregado graúdo ensaiado", P.material]);
        if (P.ligante) rows.push(["Ligante asfáltico", P.ligante]);
        r.ens.forEach(function (o, i) {
          if (o.sat === undefined) return;
          rows.push([nomeEnsaio(o, i), (o.sat ? "satisfatório" : "não satisfatório") + " (amostra 1: " + CRITERIOS[o.s1] + "; amostra 2: " + CRITERIOS[o.s2] + ")" +
            (ok(o.mDope) ? " — " + fmt(o.mDope, 3) + " g de melhorador" : "")]);
        });
        rows.push(["Adesividade ao ligante asfáltico (7)", r.texto + (r.status === "satDope" && P.melhorador ? " (" + P.melhorador + ")" : "")]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Brita 1 (Pedreira Z) com CAP 30/45 — satisfatório (planilha do laboratório)", dados: function () {
        return { ident: { registro: "EX-ADS-001", obra: "Obra B", origem: "Pedreira Z", camada: "Brita 1 (19 mm) — projeto de CBUQ", laboratorista: "Equipe" },
          params: { material: "Brita 01 (Pedreira Z)", ligante: "CAP 30/45", tAgr: "100", tLig: "120", tBanho: "40", horas: "72" },
          ens: [{ teor: "0", a1: "500", l1: "17,5", d1: "não", a2: "500", l2: "17,5", d2: "não" }],
          obs: "Dados da planilha \"PROJETO TRAÇO ASFALTO.xlsx\" (Unidade B), aba \"LOS ANGEL.\", bloco \"ENSAIO DE ADESIVIDADE (DNIT 452/2024-ME)\": 500 g, CAP 30-45, 17,5 g, 72 h, satisfatório, sem dopante. A planilha registra um único resultado (não as duas amostras) e traz também \"Cap-50/70\" ao lado do campo do dopante; o resumo do projeto indica CAP 30/45." };
      } },
      { nome: "Brita granítica — não satisfatório sem DOPE; satisfatório com 0,5 %", dados: function () {
        return { ident: { registro: "EX-ADS-002", camada: "Brita 1 — concreto asfáltico", origem: "Pedreira A" },
          params: { material: "Brita 1 granítica", ligante: "CAP 50/70", melhorador: "Melhorador de adesividade à base de amina", tAgr: "100", tLig: "120", tBanho: "40", horas: "72" },
          ens: [{ teor: "0", a1: "500,2", l1: "17,5", d1: "parcial", a2: "499,8", l2: "17,5", d2: "parcial" },
            { teor: "0,3", a1: "500,0", l1: "17,5", d1: "não", a2: "500,1", l2: "17,5", d2: "parcial" },
            { teor: "0,5", a1: "500,3", l1: "17,5", d1: "não", a2: "499,9", l2: "17,6", d2: "não" }] };
      } },
      { nome: "Quartzito — não satisfatório, fora das condições da norma", dados: function () {
        return { ident: { registro: "EX-ADS-003", camada: "Brita 1 — tratamento superficial", origem: "Jazida C" },
          params: { material: "Brita 1 de quartzito", ligante: "CAP 50/70", tAgr: "110", tLig: "120", tBanho: "40", horas: "48" },
          ens: [{ teor: "", a1: "480", l1: "18,5", d1: "total", a2: "500", l2: "17,5", d2: "parcial" }] };
      } },
    ],
  };
})();
