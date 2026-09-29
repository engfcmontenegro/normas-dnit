/*
 * Ficha: DNER-PRO 005/94 — Coleta de amostras de material de enchimento (registro e verificação).
 * Registra as porções retiradas (uma coluna por porção) e confere: pelo menos 10 porções de pontos ou unidades
 * diferentes; 5 kg para cada 20 t ou fração da partida (3.1); em sacos, pelo menos 1 % das embalagens e nunca menos
 * de 5 sacos (3.2.1.4); identificação (4) e embalagem (5). Registra-se em window.FE.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var LOCAIS = [["transp", "Fábrica — transportadores dos silos (3.2.1.1)"], ["granel", "Fábrica — depósito a granel, na saída (3.2.1.2)"],
    ["ensac", "Fábrica — bicos das ensacadeiras (3.2.1.3)"], ["sacos", "Fábrica — pilhas de material ensacado (3.2.1.4)"],
    ["fora", "Fora da fábrica — em sacos (3.2.2 → 3.2.1.4)"], ["veiculo", "Fábrica — sobre veículos de carga (3.2.1)"]];
  var ID = [["iNat", "natureza do material"], ["iProc", "procedência"], ["iData", "data e local da coleta"], ["iResp", "responsável pela coleta"],
    ["iFim", "fim a que se destina"], ["iLocal", "local em que será empregada"], ["iRem", "remetente"]];
  var SN = [["", "— não verificado"], ["sim", "Sim"], ["nao", "Não"]];
  function loc(d) { return ((d && d.params) || {}).local || "sacos"; }
  function emSacos(d) { var l = loc(d); return l === "sacos" || l === "fora"; }
  function intervalos(d) { var l = loc(d); return l === "transp" || l === "granel" || l === "ensac"; }
  var CHECK = [
    ["chkInt", "3.2.1.1 a 3.2.1.3", "Porções coletadas a intervalos regulares de tempo durante toda a operação", intervalos],
    ["chkPontos", "3.2.1.4", "Sacos retirados de vários pontos do conjunto; amostra coletada pela válvula com amostrador apropriado", emSacos],
    ["chkRapido", "3", "Coleta e remessa feitas da maneira mais rápida possível, sem exposição demorada ao ar", function () { return true; }],
    ["chkEmb", "5", "Amostra em recipiente limpo, hermeticamente fechado e impermeável", function () { return true; }],
  ];

  FE.FICHAS["dner-pro-005-94"] = {
    titulo: "Material de enchimento — Coleta de amostras",
    resumo: "Registro e verificação da coleta de material de enchimento (fíler): no mínimo 10 porções, 5 kg por 20 t ou fração da partida (3.1), 1 % dos sacos e nunca menos de 5 (3.2.1.4), identificação (4) e embalagem hermética (5).",
    params: [
      { k: "local", r: "Local e forma da coleta (3.2)", tipo: "select", recarrega: true, opcoes: LOCAIS },
      { k: "partida", r: "Tamanho da partida, t (3.1)" },
      { k: "nSacos", r: "Número de sacos da partida (3.2.1.4)", se: emSacos },
    ].concat(ID.map(function (e) { return { k: e[0], r: "Identificação (4): " + e[1] }; }))
      .concat(CHECK.map(function (c) { return { k: c[0], r: c[2] + " (" + c[1] + ")", tipo: "select", opcoes: SN, se: c[3] }; })),
    padrao: { local: "sacos" },
    tabelas: function (d) {
      return [{ chave: "por", titulo: "Porções retiradas (3.1)", rotulo: "Porção", iniciais: 10, min: 1,
        linhas: [{ k: "ponto", r: emSacos(d) ? "Saco (posição na pilha / nº)" : "Ponto ou hora da retirada", texto: true },
          { k: "m", r: "Massa da porção", u: "kg" }],
        dica: "pelo menos 10 porções de pontos ou unidades diferentes da partida" }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], r = {};
      var t = num(P.partida), ms = (d.por || []).map(function (x) { return num(x.m); }).filter(ok);
      r.nPor = ms.length;
      r.mTot = ms.reduce(function (a, b) { return a + b; }, 0);
      r.mMin = ok(t) && t > 0 ? 5 * Math.ceil(t / 20 - 1e-9) : NaN;
      if (r.nPor && r.nPor < 10) avisos.push(r.nPor + " porção(ões) — a amostra é formada por pelo menos 10 porções de diferentes pontos ou unidades da partida (3.1).");
      if (ok(r.mMin) && r.nPor && r.mTot < r.mMin) avisos.push("Amostra de " + fmt(r.mTot, 1) + " kg — a proporção é de 5 kg para cada 20 t ou fração: mínimo de " + fmt(r.mMin, 0) + " kg para " + fmt(t, 1) + " t (3.1).");
      if (!ok(t)) avisos.push("Informe o tamanho da partida para conferir a massa mínima (3.1).");
      if (emSacos(d)) {
        var ns = num(P.nSacos);
        r.sacosMin = ok(ns) ? Math.max(5, Math.ceil(ns * 0.01 - 1e-9)) : 5;
        if (ok(ns) && ns < r.sacosMin) r.sacosMin = ns;
        var nsa = (d.por || []).filter(function (x) { return String(x.ponto || "").trim() || ok(num(x.m)); }).map(function (x) { return String(x.ponto || "").trim().toLowerCase(); });
        var distintos = {}; nsa.forEach(function (s, i) { distintos[s || "#" + i] = 1; });
        r.nSacosAm = Object.keys(distintos).length;
        if (r.nSacosAm < r.sacosMin) avisos.push(r.nSacosAm + " saco(s) amostrado(s) — pelo menos 1 % das embalagens e nunca menos de 5 sacos: mínimo " + r.sacosMin + " (3.2.1.4).");
      }
      var falta = ID.filter(function (e) { return !String(P[e[0]] || "").trim(); }).map(function (e) { return e[1]; });
      if (falta.length) avisos.push("Ficha de identificação sem: " + falta.join("; ") + " (4).");
      var chk = { feitos: 0, total: 0, pend: [], nao: 0 };
      CHECK.forEach(function (c) {
        if (!c[3](d)) return;
        chk.total++;
        if (P[c[0]] === "sim") chk.feitos++;
        else if (P[c[0]] === "nao") { chk.nao++; avisos.push("Não atendido (" + c[1] + "): " + c[2] + "."); }
        else chk.pend.push(c[1]);
      });
      r.chk = chk; r.nAvisos = avisos.length;
      return { tab: {}, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, c = r.chk;
      function cx(v, rot) { return '<div class="fe-res-item"><div class="fe-res-v">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var st = r.nAvisos ? '<span class="fe-nok">' + r.nAvisos + " verificação(ões) com aviso</span>" : c.pend.length ? "itens pendentes: " + esc(c.pend.join(", ")) : '<span class="fe-ok">conforme a norma</span>';
      return '<div class="fe-res">' + cx(fmt(r.mTot, 1) + " <small>kg</small>", "Massa da amostra (mínimo " + fmt(r.mMin, 0) + " kg) · " + st) +
        cx(fmt(r.nPor, 0), "Porções (mínimo 10)") + (r.sacosMin ? cx(r.nSacosAm + " / " + r.sacosMin, "Sacos amostrados / mínimo") : "") +
        cx(c.feitos + " / " + c.total, "Procedimentos confirmados") + "</div>";
    },
    relatorio: {
      notas: "Coleta conforme a DNER-PRO 005/94: pelo menos 10 porções de pontos ou unidades diferentes; 5 kg para cada 20 t ou fração da partida (3.1); em sacos, pelo menos 1 % das embalagens, nunca menos de 5 sacos, amostra tirada pela válvula (3.2.1.4); recipiente limpo, hermeticamente fechado e impermeável (5). Sacos amostrados contados pelas identificações distintas das porções.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {};
        var rows = [["Partida", (P.partida || "—") + " t" + (P.nSacos ? " · " + P.nSacos + " sacos" : "")], ["Massa da amostra", fmt(r.mTot, 1) + " kg (mínimo " + fmt(r.mMin, 0) + " kg)"], ["Porções", fmt(r.nPor, 0) + " (mínimo 10)"]];
        if (r.sacosMin) rows.push(["Sacos amostrados", r.nSacosAm + " (mínimo " + r.sacosMin + ")"]);
        rows.push(["Verificações", r.nAvisos ? r.nAvisos + " aviso(s)" : "sem avisos"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Cal hidratada em sacos — partida de 36 t (720 sacos)", dados: function () {
        var por = [];
        for (var i = 0; i < 10; i++) por.push({ ponto: "Saco " + (i + 1) + " — pilha " + (i % 3 + 1), m: ["1,05", "1,02", "0,98", "1,00", "1,04", "0,99", "1,01", "1,03", "0,97", "1,00"][i] });
        return { ident: { registro: "EX-ME-001", data: "2025-03-18", obra: "Obra A", origem: "Fornecedor A", camada: "Fíler — cal hidratada CH-I" },
          params: { local: "fora", partida: "36", nSacos: "720", iNat: "Cal hidratada CH-I", iProc: "Fornecedor A", iData: "18/03/2025 — almoxarifado da Obra A",
            iResp: "Técnico A", iFim: "Fíler para concreto asfáltico", iLocal: "Revestimento — Obra A", iRem: "Unidade A", chkPontos: "sim", chkRapido: "sim", chkEmb: "sim" },
          por: por };
      } },
      { nome: "Pó calcário na ensacadeira — poucas porções e massa curta", dados: function () {
        var por = [];
        for (var i = 0; i < 6; i++) por.push({ ponto: "08:" + (10 + i * 10) + " h", m: "1,5" });
        return { ident: { registro: "EX-ME-002", data: "2025-06-09", obra: "Obra B", origem: "Fornecedor B", camada: "Fíler calcário" },
          params: { local: "ensac", partida: "65", iNat: "Pó calcário", iProc: "Fornecedor B", iData: "09/06/2025 — fábrica", iResp: "", iFim: "Fíler", iLocal: "", iRem: "Unidade B",
            chkInt: "sim", chkRapido: "sim", chkEmb: "nao" },
          por: por };
      } },
    ],
  };
})();
