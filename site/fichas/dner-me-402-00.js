/*
 * Ficha: DNER-ME 402/00 — Concreto — Amostragem de concreto fresco.
 * Ficha de registro com as verificações da norma: porções entre 15 % e 85 % da descarga (4.3.1), intervalo entre a primeira
 * e a última porção ≤ 15 min (4.1.3), volume ≥ 1,5 × o necessário e ≥ 30 l (4.2), início do abatimento/ar ≤ 5 min e da
 * moldagem ≤ 15 min após a última porção (5.2), proteção da amostra (5.3) e identificação (6).
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var SN = [["", "—"], ["sim", "Sim"], ["nao", "Não"]];
  var ORIG = {
    estac: "Betoneira estacionária (4.3)", caminhao: "Caminhão-betoneira (4.4)", pav: "Concreto para pavimentos — após a descarga (4.5)",
    aberto: "Caminhão aberto, caçamba ou misturador com agitador (4.6)", bomba: "Final da tubulação de bombeamento (4.7)",
  };
  function hm(s) { var m = String(s || "").trim().match(/^(\d{1,2})[:h](\d{2})$/); return m ? +m[1] * 60 + +m[2] : NaN; }
  function dif(a, b) { if (!ok(a) || !ok(b)) return NaN; var x = b - a; return x < -720 ? x + 1440 : x; }  // passa da meia-noite

  FE.FICHAS["dner-me-402-00"] = {
    titulo: "Concreto — Amostragem de concreto fresco (registro)",
    resumo: "Registro da coleta com as verificações da norma: amostra composta coletada após a incorporação de toda a água, em duas ou mais porções entre 15 % e 85 % da descarga, em até 15 min; volume ≥ 1,5 × o necessário aos ensaios e ≥ 30 l; abatimento e ar iniciados em até 5 min e moldagem em até 15 min após a última porção; amostra protegida do sol, vento e contaminação.",
    blocos: [],
    params: [
      { k: "concreto", r: "Concreto", ph: "ex.: C30, brita 1, abatimento 100 ± 20 mm" },
      { k: "origem", r: "Coleta de", tipo: "select", recarrega: true, opcoes: Object.keys(ORIG).map(function (k) { return [k, ORIG[k]]; }) },
      { k: "veiculo", r: "Betoneira / caminhão / nota fiscal", ph: "ex.: NF 1021, caminhão 07" },
      { k: "localAplic", r: "Local de aplicação do concreto (6 d)", ph: "ex.: placa 12, faixa direita" },
      { k: "volTotal", r: "Volume total da betonada / carga (m³)", ph: "8,0", se: function (d) { var o = (d.params || {}).origem; return o === "estac" || o === "caminhao" || o === "aberto"; } },
      { k: "hAgua", r: "Horário da aplicação total da água de mistura (6 b)", ph: "hh:mm" },
      { k: "homog", r: "Coleta após completadas a adição e a homogeneização de todos os componentes (4.1.1)", tipo: "select", opcoes: SN },
      { k: "fluxo", r: "Interceptada toda a seção do fluxo, sem restringi-lo (4.3.2)", tipo: "select", opcoes: SN,
        se: function (d) { var o = (d.params || {}).origem; return o === "estac" || o === "caminhao" || o === "bomba"; } },
      { k: "calha", r: "Descarga à velocidade normal, calha totalmente aberta (4.4)", tipo: "select", opcoes: SN, se: function (d) { return (d.params || {}).origem === "caminhao"; } },
      { k: "contam", r: "Sem contaminação com material da sub-base (4.5)", tipo: "select", opcoes: SN, se: function (d) { return (d.params || {}).origem === "pav"; } },
      { k: "bombIF", r: "Evitados o início e o final do bombeamento (4.7)", tipo: "select", opcoes: SN, se: function (d) { return (d.params || {}).origem === "bomba"; } },
      { k: "volNec", r: "Volume necessário aos ensaios (l)", ph: "ex.: 28" },
      { k: "volAm", r: "Volume da amostra coletada (l)", ph: "≥ 30" },
      { k: "mistura", r: "Porções misturadas até a uniformidade (4.1.3; 5.1)", tipo: "select", opcoes: SN },
      { k: "prot", r: "Amostra protegida do sol, do vento e de contaminação (5.3)", tipo: "select", opcoes: SN },
      { k: "hAbat", r: "Início do abatimento / teor de ar (hh:mm)", ph: "≤ 5 min após a última porção" },
      { k: "hMold", r: "Início da moldagem dos CPs (hh:mm)", ph: "≤ 15 min após a última porção" },
    ],
    padrao: { origem: "caminhao" },
    tabelas: function (d) {
      var o = (d.params || {}).origem;
      var lin = [{ k: "hora", r: "Horário de obtenção", u: "hh:mm", texto: true, ph: "09:15" }];
      if (o === "estac" || o === "caminhao" || o === "aberto") lin.push({ k: "desc", r: "Volume já descarregado", u: "m³" }, { k: "pct", r: "— ou % já descarregado", u: "%" }, { calc: "pctC", r: "Descarga no momento da porção", u: "%", casas: 0, destaque: true });
      lin.push({ k: "ponto", r: "Ponto / observação", texto: true, ph: o === "pav" ? "ponto 1 a 5" : "" });
      return [{ chave: "por", titulo: "Porções da amostra composta (4.1.3; 4.3 a 4.7)", rotulo: "Porção", iniciais: o === "pav" ? 5 : o === "bomba" ? 1 : 2, min: 1, linhas: lin,
        dica: "uma coluna por porção, na ordem de obtenção" }];
    },
    calcular: function (d) {
      var P = d.params || {}, I = d.ident || {}, avisos = [], ch = [], orig = P.origem || "caminhao";
      function add(item, reg, exig, cond) { ch.push({ item: item, reg: reg, exig: exig, ok: cond }); if (cond === false) avisos.push(item + ": " + reg + " — exigido " + exig + "."); }
      var vt = num(P.volTotal);
      var por = (d.por || []).map(function (x, i) {
        var o = { t: hm(x.hora) }, ds = num(x.desc), pc = num(x.pct);
        o.pctC = ok(pc) ? pc : ok(ds) && ok(vt) && vt > 0 ? ds / vt * 100 : NaN;
        if (String(x.hora || "").trim() && !ok(o.t)) avisos.push("Porção " + (i + 1) + ": horário \"" + x.hora + "\" não reconhecido — use hh:mm.");
        if (ok(ds) && !ok(vt) && !ok(pc)) avisos.push("Informe o volume total da betonada para calcular a porcentagem descarregada.");
        return o;
      });
      var comHora = por.filter(function (o) { return ok(o.t); });
      var n = por.length, t1 = comHora.length ? comHora[0].t : NaN, tN = comHora.length ? comHora[comHora.length - 1].t : NaN;
      // número de porções
      if (orig === "estac" || orig === "caminhao") add("Número de porções (4.3.1)", String(n), "duas ou mais, regularmente espaçadas", n >= 2);
      if (orig === "pav") add("Pontos de coleta (4.5)", String(n), "cinco pontos diferentes", n >= 5);
      if (orig === "bomba") add("Porções (4.7)", String(n), "uma só porção", n === 1);
      // intervalo
      var dt = dif(t1, tN);
      if (comHora.length > 1) add("Intervalo entre a 1ª e a última porção (4.1.3)", fmt(dt, 0) + " min", "≤ 15 min", dt <= 15);
      // faixa da descarga
      if (orig === "estac" || orig === "caminhao") {
        var fora = por.map(function (o, i) { return ok(o.pctC) && (o.pctC < 15 || o.pctC > 85) ? "porção " + (i + 1) + " com " + fmt(o.pctC, 0) + " %" : null; }).filter(Boolean);
        var comPct = por.filter(function (o) { return ok(o.pctC); }).length;
        if (comPct) add("Porções entre 15 % e 85 % da descarga (4.3.1)", fora.length ? fora.join("; ") : "todas (" + comPct + ")", "após os primeiros 15 % e antes de 85 %", !fora.length);
      }
      // volume
      var vn = num(P.volNec), va = num(P.volAm), vmin = Math.max(30, ok(vn) ? 1.5 * vn : 0);
      if (ok(va)) add("Volume da amostra (4.2)", fmt(va, 0) + " l", "≥ " + fmt(vmin, 0) + " l (1,5 × necessário e ≥ 30 l)", va >= vmin - 1e-9);
      // tempos de utilização
      var tA = hm(P.hAbat), tM = hm(P.hMold), tAg = hm(P.hAgua);
      if (ok(tA) && ok(tN)) add("Início do abatimento / ar após a última porção (5.2.1)", fmt(dif(tN, tA), 0) + " min", "≤ 5 min", dif(tN, tA) <= 5 && dif(tN, tA) >= 0);
      if (ok(tM) && ok(tN)) add("Início da moldagem após a última porção (5.2.2)", fmt(dif(tN, tM), 0) + " min", "≤ 15 min", dif(tN, tM) <= 15 && dif(tN, tM) >= 0);
      if (ok(tAg) && ok(t1)) {
        var da = dif(tAg, t1);
        ch.push({ item: "Da aplicação total da água à 1ª porção", reg: fmt(da, 0) + " min", exig: "registro (6 b)", ok: null });
        if (da < 0) avisos.push("1ª porção obtida antes do horário de aplicação total da água — a amostra deve ser coletada após a incorporação de toda a água (4.1.1).");
      }
      // sim/não
      [["homog", "Coleta após a homogeneização de todos os componentes (4.1.1)"], ["fluxo", "Interceptação de toda a seção do fluxo (4.3.2)"], ["calha", "Descarga normal, calha totalmente aberta (4.4)"],
        ["contam", "Sem contaminação com a sub-base (4.5)"], ["bombIF", "Evitados início e fim do bombeamento (4.7)"], ["mistura", "Porções misturadas até a uniformidade (5.1)"], ["prot", "Amostra protegida (5.3)"]].forEach(function (q) {
        var f = FE.FICHAS["dner-me-402-00"].params.filter(function (p) { return p.k === q[0]; })[0];
        if (P[q[0]] && (!f.se || f.se(d))) add(q[1], P[q[0]] === "sim" ? "sim" : "não", "sim", P[q[0]] === "sim");
      });
      // identificação (6)
      var falta = [];
      if (!I.data) falta.push("data da coleta (a)");
      if (!ok(tAg)) falta.push("horário da aplicação total da água (b)");
      if (!ok(t1) || (n > 1 && !ok(tN))) falta.push("horários da primeira e da última porção (c)");
      if (!P.localAplic && !I.local) falta.push("local de aplicação do concreto (d)");
      if (falta.length) avisos.push("Identificação da amostra incompleta (6): falta " + falta.join("; ") + ".");
      var nNok = ch.filter(function (c) { return c.ok === false; }).length, nOk = ch.filter(function (c) { return c.ok === true; }).length;
      return { tab: { por: por }, resultados: { ch: ch, nNok: nNok, nOk: nOk, dt: dt, n: n, orig: orig }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      var topo = '<div class="fe-res">' +
        '<div class="fe-res-item"><div class="fe-res-v">' + r.n + '</div><div class="fe-res-r">Porções — ' + esc(ORIG[r.orig]) + "</div></div>" +
        '<div class="fe-res-item"><div class="fe-res-v">' + (ok(r.dt) ? fmt(r.dt, 0) + " <small>min</small>" : "—") + '</div><div class="fe-res-r">Intervalo entre a 1ª e a última porção (≤ 15 min)</div></div>' +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (!r.ch.length ? "—" : r.nNok ? '<span class="fe-nok">' + r.nNok + " não conforme(s)</span>" : '<span class="fe-ok">amostragem conforme</span>') +
        '</div><div class="fe-res-r">' + r.nOk + " verificação(ões) atendida(s)</div></div></div>";
      if (!r.ch.length) return topo;
      return topo + '<table class="fe-resumo"><thead><tr><th>Verificação</th><th>Registrado</th><th>Exigido</th><th>Situação</th></tr></thead><tbody>' +
        r.ch.map(function (c) { return "<tr><td>" + esc(c.item) + "</td><td>" + esc(c.reg) + "</td><td>" + esc(c.exig) + "</td><td>" + (c.ok === null ? "registro" : c.ok ? '<span class="fe-ok">atende</span>' : '<span class="fe-nok">não atende</span>') + "</td></tr>"; }).join("") +
        "</tbody></table>";
    },
    relatorio: {
      notas: "Amostras obtidas aleatoriamente após a adição e a homogeneização de todos os componentes, principalmente da água (4.1.1); amostra composta em até 15 min entre a primeira e a última porção (4.1.3); volume ≥ 1,5 vez o necessário aos ensaios e nunca inferior a 30 l (4.2). Betoneiras estacionárias e caminhões-betoneira: coleta após os primeiros 15 % e antes de 85 % da descarga, em dois ou mais períodos regularmente espaçados, interceptando toda a seção do fluxo (4.3, 4.4); pavimentos: cinco pontos logo após a descarga (4.5); bombeamento: uma só porção, evitando o início e o final (4.7). Abatimento e ar incorporado iniciados em até 5 min e moldagem em até 15 min após a última porção (5.2); amostra protegida (5.3). Registro: data, horário da aplicação total da água, horários da primeira e da última porção e local de aplicação (6). Frequência e número de amostras: NBR 12655 (4.1.2).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.concreto) rows.push(["Concreto", P.concreto]);
        rows.push(["Coleta", ORIG[r.orig] + (P.veiculo ? " — " + P.veiculo : "")]);
        if (P.localAplic) rows.push(["Local de aplicação", P.localAplic]);
        r.ch.forEach(function (c) { rows.push([c.item, c.reg + " (exigido " + c.exig + ")" + (c.ok === null ? "" : c.ok ? " — atende" : " — NÃO ATENDE")]); });
        rows.push(["Situação", r.nNok ? r.nNok + " verificação(ões) não conforme(s)" : "amostragem conforme às verificações registradas"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Caminhão-betoneira de 8 m³ — três porções em 8 min, amostra de 45 l (conforme)", dados: function () {
        return { ident: { registro: "EX-AM-001", obra: "Obra A", trecho: "BR-000", local: "Placa 12 — faixa direita", camada: "Concreto de pavimento", data: "2025-04-22" },
          params: { concreto: "Concreto de pavimento, fctM,k 4,5 MPa, abatimento 60 ± 10 mm", origem: "caminhao", veiculo: "NF 1021 — caminhão 07 (Fornecedor A)", localAplic: "Placa 12 — faixa direita",
            volTotal: "8,0", hAgua: "08:35", homog: "sim", fluxo: "sim", calha: "sim", volNec: "28", volAm: "45", mistura: "sim", prot: "sim", hAbat: "09:23", hMold: "09:30" },
          por: [{ hora: "09:12", desc: "2,0" }, { hora: "09:16", desc: "4,0" }, { hora: "09:20", desc: "6,0" }] };
      } },
      { nome: "Betoneira estacionária — porções fora de 15–85 %, 20 min entre porções, 25 l, moldagem tardia", dados: function () {
        return { ident: { registro: "EX-AM-002", obra: "Obra C", camada: "Concreto C25 — muro de ala", data: "2025-07-03" },
          params: { concreto: "C25, brita 1", origem: "estac", veiculo: "Betoneira de 400 l — traço 3", volTotal: "0,32", hAgua: "10:02", homog: "sim", fluxo: "nao",
            volNec: "20", volAm: "25", mistura: "sim", prot: "nao", hAbat: "10:31", hMold: "10:48" },
          por: [{ hora: "10:05", pct: "5" }, { hora: "10:25", pct: "90" }] };
      } },
    ],
  };
})();
