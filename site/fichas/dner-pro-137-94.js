/*
 * Ficha: DNER-PRO 137/94 — Coleta de amostras de água para ensaios químicos (registro e verificação).
 * Uma coluna por amostra: fonte (5.2 d a g), frascos de 1 000 cm³ e volume total (≥ 2 L, 5.1), tempo de
 * escoamento/bombeamento antes da coleta (3 a 5 min em torneiras; 5 min em bomba manual), profundidade do frasco
 * (metade da altura d'água no poço sem bomba; 15 cm abaixo do nível em cursos d'água), intervalo entre a coleta e a
 * remessa (≤ 24 h, 6.2) e a etiqueta (5.3). Registra-se em window.FE.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var FONTES = [["rede", "Sistema de distribuição — torneira (5.2 d)"], ["pocoEl", "Poço com bomba elétrica (5.2 e)"], ["pocoMan", "Poço com bomba manual (5.2 e)"],
    ["pocoSem", "Poço sem bomba — frasco lastrado (5.2 e)"], ["reserv", "Reservatório ou cisterna (5.2 f)"], ["curso", "Curso d'água (5.2 g)"]];
  var ETQ = [["eNat", "natureza do material"], ["eProc", "procedência"], ["eMarc", "marcação dos frascos da mesma amostra"], ["eQtd", "quantidade, em litro"],
    ["eData", "data, local e hora da coleta"], ["eResp", "responsável pela coleta"], ["eEmp", "local em que será empregada"], ["eFim", "fim a que se destina"], ["eRem", "nome do remetente"]];
  var SN = [["", "— não verificado"], ["sim", "Sim"], ["nao", "Não"]];
  var CHECK = [
    ["chkFrasco", "4 e 5.2 a", "Frascos de vidro incolor de 1 000 cm³, tampa esmerilhada (ou rolha de borracha/cortiça envolvida em papel manilha), previamente limpos"],
    ["chkEnx", "5.2 b", "Frasco enxaguado várias vezes com a própria água a ser analisada"],
    ["chkAssep", "3 e 5.2 c", "Técnica asséptica: nada tocou o interior do frasco ou da tampa após a coleta"],
    ["chkVed", "6.1", "Frascos perfeitamente vedados e embalados contra quebra no transporte"],
  ];
  // fonte digitada na tabela: código ou texto livre
  function fonteDe(s) {
    s = String(s || "").trim().toLowerCase();
    if (!s) return "rede";
    for (var i = 0; i < FONTES.length; i++) if (FONTES[i][0].toLowerCase() === s) return FONTES[i][0];
    if (/sem bomba|lastr/.test(s)) return "pocoSem";
    if (/manual/.test(s)) return "pocoMan";
    if (/reserv|cisterna/.test(s)) return "reserv";
    if (/curso|rio|c[óo]rrego|riacho|canal/.test(s)) return "curso";
    if (/po[çc]o/.test(s)) return "pocoEl";
    if (/rede|torneira|distrib/.test(s)) return "rede";
    return null;
  }
  // "dd/mm/aaaa hh:mm" ou "aaaa-mm-ddThh:mm" -> ms
  function quando(s) {
    s = String(s || "").trim();
    var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2})[:h](\d{2})/);
    if (m) { var a = +m[3]; if (a < 100) a += 2000; return Date.UTC(a, +m[2] - 1, +m[1], +m[4], +m[5]); }
    m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{1,2}):(\d{2})/);
    if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
    return NaN;
  }

  FE.FICHAS["dner-pro-137-94"] = {
    titulo: "Água para ensaios químicos — Coleta de amostras",
    resumo: "Registro e verificação da coleta de água em torneiras, poços, reservatórios e cursos d'água: frascos de 1 000 cm³, pelo menos 2 L (5.1), tempo de escoamento ou bombeamento, profundidade do frasco, remessa em até 24 h (6.2) e etiqueta (5.3).",
    params: CHECK.map(function (c) { return { k: c[0], r: c[2] + " (" + c[1] + ")", tipo: "select", opcoes: SN }; }),
    padrao: {},
    tabelas: function () {
      var L = [
        { k: "fonte", r: "Fonte (rede, poço elétrico, poço manual, poço sem bomba, reservatório, curso d'água)", texto: true, ph: "rede" },
        { k: "ponto", r: "Ponto de coleta (torneira, poço, estaca do curso d'água)", texto: true },
        { grupo: "Quantidade (5.1)" },
        { k: "nFr", r: "Frascos", u: "nº" },
        { k: "vFr", r: "Volume por frasco", u: "cm³", ph: "1000" },
        { calc: "vol", r: "Volume total da amostra", u: "L", casas: 1, destaque: true },
        { grupo: "Procedimento (5.2)" },
        { k: "tEsc", r: "Escoamento da torneira ou bombeamento antes da coleta", u: "min" },
        { k: "hAgua", r: "Poço sem bomba: altura da lâmina d'água", u: "m" },
        { k: "pFr", r: "Profundidade do frasco abaixo do nível d'água", u: "m" },
        { calc: "relP", r: "Profundidade do frasco / lâmina d'água (poço: ½)", u: "%", casas: 0 },
        { k: "jus", r: "Curso d'água: boca do frasco voltada para jusante? (sim/não)", texto: true },
        { grupo: "Remessa (6.2)" },
        { k: "tCol", r: "Data e hora da coleta (dd/mm/aaaa hh:mm)", texto: true },
        { k: "tRem", r: "Data e hora da remessa (dd/mm/aaaa hh:mm)", texto: true },
        { calc: "horas", r: "Intervalo coleta → remessa (≤ 24 h)", u: "h", casas: 1 },
        { grupo: "Etiqueta (5.3)" },
      ].concat(ETQ.map(function (e) { return { k: e[0], r: e[1], texto: true }; }));
      return [{ chave: "am", titulo: "Amostras de água", rotulo: "Amostra", iniciais: 1, min: 1, linhas: L,
        dica: "uma coluna por amostra; a fonte define as verificações de 5.2 d a g" }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], r = { n: 0, ok2L: 0 };
      var am = (d.am || []).map(function (x, i) {
        var rot = "Amostra " + (i + 1), o = {}, f = fonteDe(x.fonte);
        if (!f) { avisos.push(rot + ": fonte \"" + x.fonte + "\" não reconhecida — use rede, poço elétrico, poço manual, poço sem bomba, reservatório ou curso d'água."); f = "?"; }
        o.fonte = f;
        r.n++;
        var nf = num(x.nFr), vf = ok(num(x.vFr)) ? num(x.vFr) : 1000;
        o.vol = ok(nf) ? nf * vf / 1000 : NaN;
        if (ok(num(x.vFr)) && Math.abs(vf - 1000) > 50) avisos.push(rot + ": frascos de " + fmt(vf, 0) + " cm³ — a norma prescreve frascos de 1 000 cm³ (4 a; 5.2 a).");
        if (ok(o.vol)) { if (o.vol >= 2 - 1e-9) r.ok2L++; else avisos.push(rot + ": " + fmt(o.vol, 1) + " L — as amostras devem ter pelo menos 2 litros (5.1)."); }
        var te = num(x.tEsc);
        if ((f === "rede" || f === "pocoEl" || f === "reserv") && ok(te) && te < 3) avisos.push(rot + ": coleta após " + fmt(te, 1) + " min de escoamento — iniciar após 3 a 5 minutos da abertura da torneira (5.2 d/e).");
        if (f === "pocoMan" && ok(te) && te < 5) avisos.push(rot + ": coleta após " + fmt(te, 1) + " min de bombeamento — em poços com bomba manual, após 5 minutos (5.2 e).");
        var ha = num(x.hAgua), pf = num(x.pFr);
        o.relP = f === "pocoSem" && ok(ha) && ok(pf) && ha > 0 ? pf / ha * 100 : NaN;
        if (ok(o.relP) && Math.abs(o.relP - 50) > 15) avisos.push(rot + ": frasco a " + fmt(o.relP, 0) + " % da lâmina d'água — suspenso até a metade da altura da água no poço (5.2 e; critério da ficha 35 a 65 %).");
        if (f === "curso") {
          if (ok(pf) && Math.abs(pf - 0.15) > 0.05) avisos.push(rot + ": frasco a " + fmt(pf * 100, 0) + " cm — colocar a 15 cm abaixo do nível da água (5.2 g; critério da ficha ± 5 cm).");
          if (/^n/i.test(String(x.jus || "").trim())) avisos.push(rot + ": a boca do frasco deve ficar voltada para jusante (5.2 g).");
        }
        var tc = quando(x.tCol), tr = quando(x.tRem);
        o.horas = ok(tc) && ok(tr) ? (tr - tc) / 3600000 : NaN;
        if (ok(o.horas) && o.horas < 0) avisos.push(rot + ": remessa anterior à coleta — confira as datas.");
        if (ok(o.horas) && o.horas > 24) avisos.push(rot + ": remessa " + fmt(o.horas, 1) + " h após a coleta — não deve exceder 24 horas (6.2).");
        if ((String(x.tCol || "").trim() && !ok(tc)) || (String(x.tRem || "").trim() && !ok(tr))) avisos.push(rot + ": data/hora em formato não reconhecido — use dd/mm/aaaa hh:mm.");
        var falta = ETQ.filter(function (e) { return !String(x[e[0]] || "").trim(); }).map(function (e) { return e[1]; });
        if (falta.length) avisos.push(rot + ": etiqueta sem " + falta.join("; ") + " (5.3).");
        return o;
      });
      var chk = { feitos: 0, total: 0, pend: [], nao: 0 };
      CHECK.forEach(function (c) {
        chk.total++;
        if (P[c[0]] === "sim") chk.feitos++;
        else if (P[c[0]] === "nao") { chk.nao++; avisos.push("Não atendido (" + c[1] + "): " + c[2] + "."); }
        else chk.pend.push(c[1]);
      });
      r.vol0 = (am[0] || {}).vol; r.h0 = (am[0] || {}).horas; r.chk = chk; r.nAvisos = avisos.length;
      return { tab: { am: am }, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, c = r.chk;
      function cx(v, rot) { return '<div class="fe-res-item"><div class="fe-res-v">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var st = r.nAvisos ? '<span class="fe-nok">' + r.nAvisos + " verificação(ões) com aviso</span>" : c.pend.length ? "itens pendentes: " + esc(c.pend.join(", ")) : '<span class="fe-ok">conforme a norma</span>';
      return '<div class="fe-res">' + cx(r.ok2L + " / " + r.n, "Amostras com pelo menos 2 L · " + st) + cx(fmt(r.vol0, 1) + " <small>L</small>", "Volume (amostra 1)") +
        cx(fmt(r.h0, 1) + " <small>h</small>", "Coleta → remessa (amostra 1; ≤ 24 h)") + cx(c.feitos + " / " + c.total, "Procedimentos confirmados") + "</div>";
    },
    relatorio: {
      notas: "Coleta conforme a DNER-PRO 137/94: frascos de vidro incolor de 1 000 cm³ com tampa esmerilhada, enxaguados com a própria água; pelo menos 2 L por amostra (5.1); torneiras abertas 3 a 5 min antes (5.2 d), bomba manual 5 min (5.2 e), poço sem bomba com frasco à metade da lâmina d'água, curso d'água a 15 cm abaixo do nível com a boca para jusante (5.2 g); remessa em até 24 h (6.2). Critérios da ficha: metade da lâmina = 35 a 65 %; 15 ± 5 cm.",
      resultados: function (calc, d) {
        var r = calc.resultados, rows = [];
        (d.am || []).forEach(function (x, i) {
          var o = calc.tab.am[i], f = FONTES.filter(function (q) { return q[0] === o.fonte; })[0];
          rows.push(["Amostra " + (i + 1) + (x.ponto ? " — " + x.ponto : ""), (f ? f[1] : o.fonte) + " · " + fmt(o.vol, 1) + " L · remessa " + fmt(o.horas, 1) + " h após a coleta"]);
        });
        rows.push(["Verificações", r.nAvisos ? r.nAvisos + " aviso(s)" : "sem avisos"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Água para concreto — rede do canteiro e poço com bomba elétrica", dados: function () {
        var e = { eNat: "Água para amassamento de concreto", eResp: "Técnico A", eEmp: "Obra A — pontes", eFim: "Ensaios químicos (água para concreto)", eRem: "Unidade A" };
        return { ident: { registro: "EX-AG-001", data: "2025-02-11", obra: "Obra A", camada: "Água de amassamento" },
          params: { chkFrasco: "sim", chkEnx: "sim", chkAssep: "sim", chkVed: "sim" },
          am: [Object.assign({ fonte: "rede", ponto: "Torneira da central de concreto", nFr: "2", vFr: "1000", tEsc: "4", tCol: "11/02/2025 08:30", tRem: "11/02/2025 14:00",
            eProc: "Rede do canteiro", eMarc: "A1-1 e A1-2", eQtd: "2 L", eData: "11/02/2025, central de concreto, 08:30" }, e),
            Object.assign({ fonte: "poço com bomba elétrica", ponto: "Poço tubular do canteiro", nFr: "3", vFr: "1000", tEsc: "5", tCol: "11/02/2025 09:10", tRem: "11/02/2025 14:00",
            eProc: "Poço tubular 1", eMarc: "A2-1 a A2-3", eQtd: "3 L", eData: "11/02/2025, poço 1, 09:10" }, e)] };
      } },
      { nome: "Curso d'água — um frasco, raso e remessa após 2 dias", dados: function () {
        return { ident: { registro: "EX-AG-002", data: "2025-07-28", obra: "Obra B", local: "Córrego na Est. 300", camada: "Água para concreto" },
          params: { chkFrasco: "sim", chkEnx: "nao", chkAssep: "sim", chkVed: "sim" },
          am: [{ fonte: "curso d'água", ponto: "Margem direita, Est. 300", nFr: "1", vFr: "1000", pFr: "0,05", jus: "não", tCol: "28/07/2025 10:00", tRem: "30/07/2025 09:00",
            eNat: "Água de curso d'água", eProc: "Córrego na Est. 300", eMarc: "B1", eQtd: "1 L", eData: "28/07/2025, Est. 300, 10:00", eResp: "Técnico B", eEmp: "", eFim: "Ensaios químicos", eRem: "Unidade B" }] };
      } },
    ],
  };
})();
