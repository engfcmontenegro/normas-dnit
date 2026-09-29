/*
 * Ficha: DNER-PRO 003/94 — Coleta de amostras deformadas de solos (boletim de sondagem e verificação).
 * Uma coluna por camada atravessada no furo de trado ou no poço (5 e 6): profundidades, coleta (ou motivo da não
 * coleta), massa coletada frente aos mínimos de 10 kg (caracterização) e 60 kg (compactação/ISC), amostra para
 * umidade natural (~0,5 kg), identificação tátil-visual (7) e etiquetas. Confere continuidade das camadas, diâmetro
 * do poço (> 0,80 m) e leituras do nível d'água (inicial e após 24 h). Registra-se em window.FE.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var ETQ = [["eObra", "nome da obra"], ["eLocal", "local da obra"], ["eFuro", "número da sondagem ou poço"],
    ["eLoc", "locação"], ["eNum", "número da amostra"], ["eProf", "profundidade da amostra coletada"]];
  var SN = [["", "— não verificado"], ["sim", "Sim"], ["nao", "Não"]];
  var CHECK = [
    ["chkLona", "6", "Solo removido depositado em lona, em montes individuais por ordem de profundidade; novos montes a cada diferença significativa", ""],
    ["chkHaste", "5", "Comprimento total da haste medido e anotado a cada mudança de camada (no poço, medido nas paredes)", ""],
    ["chkEtq2", "6", "Duas etiquetas: uma na parte externa e outra, em invólucro plástico, dentro do saco", ""],
    ["chkSaco", "4 l", "Sacos de lona ou plástico com capacidade de, no mínimo, 60 kg", ""],
    ["chkAbrigo", "6", "Recipientes de umidade natural (vidro com tampa ou plástico) etiquetados e guardados em local abrigado", ""],
  ];
  function destino(s) {
    s = String(s || "");
    var isc = /isc|compact/i.test(s), car = /carac/i.test(s) || /(^|[^a-z])c([^a-z]|$)/i.test(s.replace(/isc/ig, " "));
    return { isc: isc, car: car, min: (car ? 10 : 0) + (isc ? 60 : 0) };
  }

  FE.FICHAS["dner-pro-003-94"] = {
    titulo: "Solos — Coleta de amostras deformadas",
    resumo: "Boletim de sondagem a trado ou poço com a coleta de amostras deformadas de todas as camadas: massas mínimas de 10 kg (caracterização) e 60 kg (compactação/ISC), umidade natural, identificação tátil-visual, etiquetas e nível d'água inicial e após 24 h.",
    params: [
      { k: "metodo", r: "Método de avanço (5; relatório de campo f)", tipo: "select", opcoes: [["concha", "Trado de concha"], ["helicoidal", "Trado helicoidal"], ["mecanico", "Trado mecânico"], ["poco", "Poço exploratório (pá e picareta)"]] },
      { k: "diam", r: "Diâmetro do furo ou do poço, m (relatório de campo f)" },
      { k: "cota", r: "Cota da boca do furo, m (relatório de campo g)" },
      { k: "naIni", r: "Nível d'água — profundidade inicial, m (6; relatório de campo l)", ph: "vazio se não encontrado" },
      { k: "na24", r: "Nível d'água — profundidade após 24 h, m (6)" },
      { k: "inicio", r: "Início da sondagem (relatório de campo a)", tipo: "date" },
      { k: "termino", r: "Término da sondagem (relatório de campo a)", tipo: "date" },
      { k: "fim", r: "Motivo da paralisação", ph: "ex.: profundidade prevista; NA; impenetrável ao trado" },
    ].concat(CHECK.map(function (c) { return { k: c[0], r: c[2] + " (" + c[1] + ")", tipo: "select", opcoes: SN }; })),
    padrao: { metodo: "concha" },
    tabelas: function () {
      var L = [
        { grupo: "Camada (5; relatório de campo h)" },
        { k: "de", r: "Profundidade — de", u: "m" },
        { k: "ate", r: "Profundidade — até", u: "m" },
        { calc: "esp", r: "Espessura", u: "m", casas: 2 },
        { k: "tipo", r: "Tipo do solo: coesivo / não coesivo; granulação da areia (7 a)", texto: true },
        { k: "cor", r: "Cor (7 b)", texto: true },
        { grupo: "Amostra (6)" },
        { k: "motivo", r: "Motivo da não coleta (vazio = coletada)", texto: true },
        { k: "ens", r: "Ensaios: C (caracterização), ISC (compactação/ISC), C+ISC", texto: true },
        { k: "m", r: "Massa coletada", u: "kg" },
        { calc: "mMin", r: "Massa mínima (6: 10 kg C; 60 kg ISC)", u: "kg", casas: 0 },
        { k: "mUn", r: "Amostra para umidade natural (≈ 0,5 kg)", u: "kg" },
        { grupo: "Etiquetas (6)" },
      ].concat(ETQ.map(function (e) { return { k: e[0], r: e[1], texto: true }; }));
      return [{ chave: "cam", titulo: "Camadas e amostras", rotulo: "Camada", iniciais: 3, min: 1, linhas: L,
        dica: "uma coluna por camada atravessada, em ordem de profundidade; todas devem ser amostradas" }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], r = { n: 0, col: 0, atende: 0 }, antAte = NaN, prof = NaN;
      var cam = (d.cam || []).map(function (x, i) {
        var rot = "Camada " + (i + 1), o = {}, de = num(x.de), ate = num(x.ate);
        o.esp = ok(de) && ok(ate) ? ate - de : NaN;
        if (ok(o.esp) && o.esp <= 0) avisos.push(rot + ": profundidade final menor ou igual à inicial.");
        if (ok(de) && ok(antAte) && Math.abs(de - antAte) > 0.005) avisos.push(rot + ": começa em " + fmt(de, 2) + " m, mas a camada anterior termina em " + fmt(antAte, 2) + " m — registre todas as camadas atravessadas.");
        if (i === 0 && ok(de) && de > 0.005) avisos.push("A primeira camada começa em " + fmt(de, 2) + " m — registre desde a superfície.");
        if (ok(ate)) { antAte = ate; prof = ate; }
        r.n++;
        var coletada = !String(x.motivo || "").trim(), m = num(x.m), dst = destino(x.ens);
        o.mMin = coletada && dst.min ? dst.min : NaN;
        if (coletada) {
          r.col++;
          if (!String(x.ens || "").trim() && !ok(m)) avisos.push(rot + ": camada sem amostra e sem o motivo da não coleta (6).");
          if (ok(m) && ok(o.mMin)) { if (m >= o.mMin) r.atende++; else avisos.push(rot + ": " + fmt(m, 1) + " kg coletados — mínimo de " + fmt(o.mMin, 0) + " kg para " + (dst.car && dst.isc ? "caracterização (10 kg) e compactação/ISC (60 kg), somados (critério da ficha)" : dst.isc ? "compactação/ISC" : "caracterização") + " (6)."); }
          if (ok(m) && !ok(o.mMin)) avisos.push(rot + ": informe os ensaios a que se destina (C, ISC ou C+ISC) para conferir a massa mínima (6).");
          var falta = ETQ.filter(function (e) { return !String(x[e[0]] || "").trim(); }).map(function (e) { return e[1]; });
          if (falta.length) avisos.push(rot + ": etiqueta sem " + falta.join("; ") + " (6).");
        }
        var mu = num(x.mUn);
        if (ok(mu) && (mu < 0.1 || mu > 0.75)) avisos.push(rot + ": amostra de umidade natural de " + fmt(mu, 2) + " kg — recipiente de cerca de 0,5 kg (4 m; 6).");
        if (!String(x.tipo || "").trim() || !String(x.cor || "").trim()) avisos.push(rot + ": identificação tátil-visual incompleta — tipo do solo e cor (7).");
        return o;
      });
      if (P.metodo === "poco" && ok(num(P.diam)) && num(P.diam) <= 0.80) avisos.push("Poço exploratório com " + fmt(num(P.diam), 2) + " m — o diâmetro é sempre superior a 0,80 m (5).");
      var ni = num(P.naIni), n24 = num(P.na24);
      if (ok(ni) && !ok(n24)) avisos.push("Nível d'água encontrado a " + fmt(ni, 2) + " m: faça nova leitura 24 horas após e anote-a (6).");
      if (ok(ni) && ok(prof) && ni > prof + 0.005) avisos.push("Nível d'água abaixo do fundo do furo — confira.");
      var chk = { feitos: 0, total: 0, pend: [], nao: 0 };
      CHECK.forEach(function (c) {
        chk.total++;
        if (P[c[0]] === "sim") chk.feitos++;
        else if (P[c[0]] === "nao") { chk.nao++; avisos.push("Não atendido (" + c[1] + "): " + c[2] + "."); }
        else chk.pend.push(c[1]);
      });
      r.prof = prof; r.chk = chk; r.nAvisos = avisos.length;
      return { tab: { cam: cam }, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, c = r.chk;
      function cx(v, rot) { return '<div class="fe-res-item"><div class="fe-res-v">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var st = r.nAvisos ? '<span class="fe-nok">' + r.nAvisos + " verificação(ões) com aviso</span>" : c.pend.length ? "itens pendentes: " + esc(c.pend.join(", ")) : '<span class="fe-ok">conforme a norma</span>';
      return '<div class="fe-res">' + cx(fmt(r.prof, 2) + " <small>m</small>", "Profundidade atingida · " + st) +
        cx(r.col + " / " + r.n, "Camadas amostradas") + cx(r.atende + " / " + r.col, "Amostras com a massa mínima") +
        cx(c.feitos + " / " + c.total, "Procedimentos confirmados") + "</div>";
    },
    relatorio: {
      notas: "Coleta conforme a DNER-PRO 003/94: amostras de todas as camadas atravessadas (ou motivo da não coleta), no mínimo 10 kg para caracterização e 60 kg para compactação e ISC (6); para uma camada destinada às duas finalidades a ficha exige a soma, 70 kg (critério da ficha). Umidade natural em recipiente fechado de cerca de 0,5 kg; nível d'água lido ao ser encontrado e 24 h após; poço exploratório com diâmetro superior a 0,80 m (5).",
      resultados: function (calc, d) {
        var r = calc.resultados, rows = [["Profundidade atingida", fmt(r.prof, 2) + " m"]];
        (d.cam || []).forEach(function (x, i) {
          rows.push(["Camada " + (i + 1) + " (" + (x.de || "—") + " a " + (x.ate || "—") + " m)", [x.tipo, x.cor].filter(Boolean).join(", ") + " · " +
            (String(x.motivo || "").trim() ? "não coletada: " + x.motivo : (x.m ? x.m + " kg" : "—") + (x.ens ? " (" + x.ens + ")" : ""))]);
        });
        var P = d.params || {};
        rows.push(["Nível d'água", P.naIni ? "inicial " + P.naIni + " m; após 24 h " + (P.na24 || "—") + " m" : "não encontrado"]);
        rows.push(["Verificações", r.nAvisos ? r.nAvisos + " aviso(s)" : "sem avisos"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Furo de trado em jazida — três camadas", dados: function () {
        var e = { eObra: "Obra A", eLocal: "Jazida 1", eFuro: "T-07", eLoc: "Malha 30 m, ponto 7" };
        return { ident: { registro: "EX-AD-001", data: "2025-04-10", obra: "Obra A", origem: "Jazida 1", laboratorista: "Técnico A" },
          params: { metodo: "concha", diam: "0,10", cota: "85,40", naIni: "", inicio: "2025-04-10", termino: "2025-04-10", fim: "Profundidade prevista",
            chkLona: "sim", chkHaste: "sim", chkEtq2: "sim", chkSaco: "sim", chkAbrigo: "sim" },
          cam: [Object.assign({ de: "0", ate: "0,30", tipo: "Solo orgânico (expurgo)", cor: "Preta", motivo: "Camada vegetal — expurgo", eNum: "", eProf: "" }, e),
            Object.assign({ de: "0,30", ate: "1,60", tipo: "Areia argilosa, não coesivo, granulação fina", cor: "Vermelha", ens: "C+ISC", m: "74", mUn: "0,5", eNum: "T-07/1", eProf: "0,30 a 1,60 m" }, e),
            Object.assign({ de: "1,60", ate: "3,00", tipo: "Argila arenosa, coesivo", cor: "Amarela", ens: "C", m: "12", mUn: "0,5", eNum: "T-07/2", eProf: "1,60 a 3,00 m" }, e)] };
      } },
      { nome: "Poço com camada não registrada, massa curta e NA sem leitura de 24 h", dados: function () {
        var e = { eObra: "Obra B", eLocal: "Corte 4", eFuro: "P-02", eLoc: "Est. 210, LD 15 m" };
        return { ident: { registro: "EX-AD-002", data: "2025-08-05", obra: "Obra B", local: "Est. 210", laboratorista: "Técnico B" },
          params: { metodo: "poco", diam: "0,70", cota: "40,20", naIni: "2,80", na24: "", fim: "Nível d'água",
            chkLona: "sim", chkHaste: "sim", chkEtq2: "nao", chkSaco: "sim", chkAbrigo: "" },
          cam: [Object.assign({ de: "0", ate: "1,10", tipo: "Silte argiloso, coesivo", cor: "Marrom", ens: "C+ISC", m: "48", mUn: "0,5", eNum: "P-02/1", eProf: "0 a 1,10 m" }, e),
            Object.assign({ de: "1,40", ate: "2,90", tipo: "Areia média, não coesivo", cor: "", ens: "C", m: "8", mUn: "1,5", eNum: "P-02/2", eProf: "" }, e)] };
      } },
    ],
  };
})();
