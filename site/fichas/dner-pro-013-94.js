/*
 * Ficha: DNER-PRO 013/94 — Coleta de amostra de misturas betuminosas para pavimentação (registro e verificação).
 * Uma coluna por amostra. Confere a massa mínima (mistura não compactada) ou a área mínima (mistura compactada) da
 * Tabela de 4.3 pelo diâmetro máximo do agregado; o número de pontos e a profundidade conforme a situação (5.1 a 5.4:
 * usina, caminhão, leiras, pista); o intervalo máximo de 150 m (5.3); a distância de 60 cm da borda (5.3 e 5.4);
 * a amostra em toda a espessura da camada (5.4); duas amostras por 8 h de trabalho (5.1 e 5.4) e a etiqueta (6).
 * Registra-se em window.FE.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var TOL_BORDA = 10;   // "60 cm da borda": ± 10 cm (critério da ficha)
  var TOL_PROF = 27;    // "30 cm abaixo da superfície": a partir de 27 cm (critério da ficha)

  // Tabela (4.3): diâmetro máximo nominal (mm) → [massa mínima não compactada (kg), área mínima compactada (cm²)]
  var TAB = [[2.4, 1.8, 230], [4.8, 1.8, 230], [9.5, 3.6, 230], [12.5, 5.4, 410], [19.5, 7.3, 650], [25.4, 8.1, 930], [38.1, 11.3, 930], [50.8, 15.9, 1450]];
  var SIT = [["usina", "Após a produção — saída do misturador ou montes na usina (5.1)"], ["caminhao", "Vagões ou caminhões de transporte (5.2)"],
    ["leira", "Leiras na estrada, na ocasião da aplicação (5.3)"], ["laminada", "Mistura laminada e espalhada em camada uniforme (5.3)"],
    ["execucao", "Revestimento em execução, após a acabadora (5.4)"], ["pista", "Pista — revestimento acabado, amostra compactada (5.4)"]];
  var ETQ = [["eObra", "a) obra, estrada, trecho, local"], ["eProc", "b) procedência (usina: firma, localização, tipo, quantidade da partida, ligante e agregados)"],
    ["eLocal", "c) local de retirada (estrada, posição transversal)"], ["eQtd", "d) quantidade coletada"], ["eResp", "e) nome e função de quem amostrou"],
    ["eData", "f) data da tomada"], ["eRem", "g) remetente"], ["eFim", "h) fins da coleta"], ["eInt", "i) interessado"]];
  var SN = [["", "— não verificado"], ["sim", "Sim"], ["nao", "Não"]];
  function sit(d) { return ((d && d.params) || {}).situacao || "usina"; }
  function em() { var l = arguments; return function (d) { return Array.prototype.indexOf.call(l, sit(d)) >= 0; }; }
  function sempre() { return true; }
  var CHECK = [
    ["chkSeg", "4.4", "Evitada a segregação do agregado graúdo da argamassa betuminosa e a contaminação por pó ou materiais estranhos", sempre],
    ["chkTempo", "4.5", "Coleta anterior à pavimentação feita a tempo de analisar antes da aplicação", em("usina", "caminhao", "leira")],
    ["chkQuart", "5.1 e 5.2", "Material reunido, homogeneizado e reduzido por mistura e quarteamento em superfície limpa e lisa", em("usina", "caminhao")],
    ["chkAquec", "5.1", "Se aquecida para homogeneizar, sem superaquecimento em qualquer parte da amostra", em("usina")],
    ["chkUnif", "5.1", "Amostras para verificar a uniformidade da usina não reunidas, ensaiadas separadamente", em("usina")],
    ["chkEmb", "5.4", "Amostra cortada sem deformações, envolvida e embalada para conservar a forma (densidade)", em("pista")],
  ];
  function linhaTab(dmax) {
    if (!ok(dmax)) return null;
    for (var i = 0; i < TAB.length; i++) if (dmax <= TAB[i][0] + 1e-9) return TAB[i];
    return null;
  }

  FE.FICHAS["dner-pro-013-94"] = {
    titulo: "Misturas betuminosas — Coleta de amostras",
    resumo: "Registro e verificação da coleta de misturas betuminosas na usina, em caminhões, em leiras e na pista: massa ou área mínima pela Tabela de 4.3, pontos de coleta, 30 cm de profundidade na caçamba, intervalos de até 150 m, 60 cm da borda, duas amostras por 8 h e etiqueta (6).",
    params: [
      { k: "situacao", r: "Situação da coleta (3 e 5)", tipo: "select", recarrega: true, opcoes: SIT },
      { k: "dmax", r: "Diâmetro máximo nominal do agregado (Tabela de 4.3)", tipo: "select",
        opcoes: TAB.map(function (t) { return [String(t[0]), fmt(t[0], 1) + " mm — " + fmt(t[1], 1) + " kg · " + fmt(t[2], 0) + " cm²"]; }) },
      { k: "mistura", r: "Mistura", ph: "ex.: CBUQ faixa C, CAP 50/70" },
      { k: "horas", r: "Horas de trabalho representadas (5.1 e 5.4)", se: em("usina", "pista", "execucao") },
      { k: "nEsp", r: "Número de amostras exigido pela especificação da obra (se maior)", se: em("usina", "pista", "execucao") },
    ].concat(CHECK.map(function (c) { return { k: c[0], r: c[2] + " (" + c[1] + ")", tipo: "select", opcoes: SN, se: c[3] }; })),
    padrao: { situacao: "usina", dmax: "19.5" },
    tabelas: function (d) {
      var s = sit(d), L = [{ k: "onde", r: "Hora / partida / estaca", texto: true }];
      if (s === "usina") L.push({ k: "nPt", r: "Pontos de coleta (base e topo, diametralmente opostos)", u: "nº", ph: "2" });
      if (s === "caminhao") L.push({ k: "nPt", r: "Áreas da caçamba amostradas (5.2: seis)", u: "nº", ph: "6" }, { k: "prof", r: "Profundidade abaixo da superfície", u: "cm", ph: "30" });
      if (s === "leira") L.push({ k: "hLeira", r: "Altura da leira achatada (≈ 30 cm)", u: "cm" }, { k: "nPt", r: "Pontos igualmente espaçados (≥ 3)", u: "nº" });
      if (s === "leira" || s === "laminada") L.push({ k: "dist", r: "Distância à amostra anterior (≤ 150 m)", u: "m" });
      if (s === "laminada" || s === "execucao") L.push({ k: "borda", r: "Distância à borda do pavimento (≈ 60 cm)", u: "cm" });
      if (s === "pista") {
        L.push({ k: "a", r: "Dimensão 1 (ou diâmetro do corpo extraído)", u: "cm" }, { k: "b", r: "Dimensão 2 (vazio se circular)", u: "cm" },
          { calc: "area", r: "Área da amostra", u: "cm²", casas: 0 }, { calc: "areaMin", r: "Área mínima (Tabela)", u: "cm²", casas: 0, destaque: true },
          { k: "eCam", r: "Espessura da camada", u: "cm" }, { k: "eAm", r: "Espessura da amostra", u: "cm" });
      } else {
        L.push({ k: "t", r: "Temperatura da mistura (termômetro 0–200 °C)", u: "°C" }, { k: "m", r: "Massa da amostra (não compactada)", u: "kg" },
          { calc: "mMin", r: "Massa mínima (Tabela)", u: "kg", casas: 1, destaque: true });
      }
      L.push({ grupo: "Etiqueta (6)" });
      L = L.concat(ETQ.map(function (e) { return { k: e[0], r: e[1], texto: true }; }));
      return [{ chave: "am", titulo: "Amostras", rotulo: "Amostra", iniciais: 2, min: 1, linhas: L, dica: "uma coluna por amostra" }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], s = sit(d), T = linhaTab(num(P.dmax)), r = { n: 0, atende: 0, sit: s };
      var am = (d.am || []).map(function (x, i) {
        var rot = "Amostra " + (i + 1), o = {}, nPt = num(x.nPt);
        r.n++;
        if (s === "usina" && ok(nPt) && nPt < 2) avisos.push(rot + ": coleta da base e do topo do monte, em dois pontos diametralmente opostos (5.1).");
        if (s === "caminhao") {
          if (ok(nPt) && nPt < 6) avisos.push(rot + ": " + fmt(nPt, 0) + " área(s) — coleta no centro de cada uma das seis áreas da caçamba (5.2).");
          var pr = num(x.prof);
          if (ok(pr) && pr < TOL_PROF) avisos.push(rot + ": coleta a " + fmt(pr, 0) + " cm — deve ser a 30 cm abaixo da superfície (5.2).");
        }
        if (s === "leira") {
          if (ok(nPt) && nPt < 3) avisos.push(rot + ": " + fmt(nPt, 0) + " ponto(s) — três ou mais pontos igualmente espaçados (5.3).");
          var hl = num(x.hLeira);
          if (ok(hl) && Math.abs(hl - 30) > 5) avisos.push(rot + ": leira achatada com " + fmt(hl, 0) + " cm — aproximadamente 30 cm de altura (5.3; critério da ficha ± 5 cm).");
        }
        var di = num(x.dist);
        if (ok(di) && di > 150) avisos.push(rot + ": " + fmt(di, 0) + " m desde a amostra anterior — intervalo máximo de 150 m (5.3).");
        var bo = num(x.borda);
        if (ok(bo) && Math.abs(bo - 60) > TOL_BORDA) avisos.push(rot + ": coleta a " + fmt(bo, 0) + " cm da borda — pontos a aproximadamente 60 cm da borda (" + (s === "execucao" ? "5.4" : "5.3") + "; critério da ficha ± 10 cm).");
        if (s === "pista") {
          var a = num(x.a), b = num(x.b);
          o.area = ok(a) ? (ok(b) ? a * b : Math.PI * a * a / 4) : NaN;
          o.areaMin = T ? T[2] : NaN;
          if (ok(o.area) && ok(o.areaMin)) { if (o.area >= o.areaMin) r.atende++; else avisos.push(rot + ": área de " + fmt(o.area, 0) + " cm² — mínima de " + fmt(o.areaMin, 0) + " cm² para agregado de " + fmt(T[0], 1) + " mm (Tabela de 4.3; 5.4)."); }
          var ec = num(x.eCam), ea = num(x.eAm);
          if (ok(ec) && ok(ea) && ea < ec - 0.3) avisos.push(rot + ": amostra de " + fmt(ea, 1) + " cm numa camada de " + fmt(ec, 1) + " cm — retirar em toda a espessura da camada (5.4).");
        } else {
          var m = num(x.m);
          o.mMin = T ? T[1] : NaN;
          if (ok(m) && ok(o.mMin)) { if (m >= o.mMin) r.atende++; else avisos.push(rot + ": " + fmt(m, 1) + " kg — mínimo de " + fmt(o.mMin, 1) + " kg de mistura não compactada para agregado de " + fmt(T[0], 1) + " mm (Tabela de 4.3)."); }
          var t = num(x.t);
          if (ok(t) && t > 200) avisos.push(rot + ": temperatura acima da escala do termômetro (0–200 °C) — confira (4.1 e).");
        }
        var falta = ETQ.filter(function (e) { return !String(x[e[0]] || "").trim(); }).map(function (e) { return e[1].slice(0, 2); });
        if (falta.length) avisos.push(rot + ": etiqueta sem os itens " + falta.join(" ") + " (6).");
        return o;
      });
      if (s === "usina" || s === "pista" || s === "execucao") {
        var h = num(P.horas), ne = num(P.nEsp);
        r.nMin = ok(h) && h > 0 ? 2 * Math.ceil(h / 8 - 1e-9) : NaN;
        if (ok(ne) && (!ok(r.nMin) || ne > r.nMin)) r.nMin = ne;
        if (ok(r.nMin) && r.n < r.nMin) avisos.push(r.n + " amostra(s) para " + fmt(h, 1) + " h de trabalho — no mínimo 2 amostras a cada 8 horas" + (ok(ne) ? " ou o número da especificação da obra" : "") + ": " + r.nMin + " (" + (s === "usina" ? "5.1" : "5.4") + ").");
      }
      var chk = { feitos: 0, total: 0, pend: [], nao: 0 };
      CHECK.forEach(function (c) {
        if (!c[3](d)) return;
        chk.total++;
        if (P[c[0]] === "sim") chk.feitos++;
        else if (P[c[0]] === "nao") { chk.nao++; avisos.push("Não atendido (" + c[1] + "): " + c[2] + "."); }
        else chk.pend.push(c[1]);
      });
      r.min = T ? (s === "pista" ? T[2] : T[1]) : NaN;
      r.chk = chk; r.nAvisos = avisos.length;
      return { tab: { am: am }, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, c = r.chk;
      function cx(v, rot) { return '<div class="fe-res-item"><div class="fe-res-v">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var st = r.nAvisos ? '<span class="fe-nok">' + r.nAvisos + " verificação(ões) com aviso</span>" : c.pend.length ? "itens pendentes: " + esc(c.pend.join(", ")) : '<span class="fe-ok">conforme a norma</span>';
      return '<div class="fe-res">' + cx(r.atende + " / " + r.n, "Amostras com " + (r.sit === "pista" ? "a área" : "a massa") + " mínima · " + st) +
        cx(r.sit === "pista" ? fmt(r.min, 0) + " <small>cm²</small>" : fmt(r.min, 1) + " <small>kg</small>", r.sit === "pista" ? "Área mínima (Tabela de 4.3)" : "Massa mínima (Tabela de 4.3)") +
        (ok(r.nMin) ? cx(r.n + " / " + r.nMin, "Amostras / mínimo (2 por 8 h)") : "") + cx(c.feitos + " / " + c.total, "Procedimentos confirmados") + "</div>";
    },
    relatorio: {
      notas: "Coleta conforme a DNER-PRO 013/94. Tabela de 4.3 (diâmetro máximo nominal → massa mínima não compactada; área mínima compactada): 2,4 e 4,8 mm → 1,8 kg, 230 cm²; 9,5 → 3,6 kg, 230 cm²; 12,5 → 5,4 kg, 410 cm²; 19,5 → 7,3 kg, 650 cm²; 25,4 → 8,1 kg, 930 cm²; 38,1 → 11,3 kg, 930 cm²; 50,8 → 15,9 kg, 1 450 cm². Caçamba: centro das seis áreas, 30 cm abaixo da superfície; leiras: três ou mais pontos, a cada 150 m no máximo; pista: 60 cm da borda, toda a espessura; duas amostras a cada 8 h. Critérios da ficha: 60 ± 10 cm da borda, profundidade a partir de 27 cm, leira achatada 30 ± 5 cm; área de corpo circular = π D²/4.",
      resultados: function (calc, d) {
        var r = calc.resultados, rows = [];
        (d.am || []).forEach(function (x, i) {
          var o = calc.tab.am[i];
          rows.push(["Amostra " + (i + 1) + (x.onde ? " — " + x.onde : ""), r.sit === "pista" ? "área " + fmt(o.area, 0) + " cm² (mínimo " + fmt(o.areaMin, 0) + ")" : (x.m || "—") + " kg (mínimo " + fmt(o.mMin, 1) + ")"]);
        });
        if (ok(r.nMin)) rows.push(["Número de amostras", r.n + " (mínimo " + r.nMin + ")"]);
        rows.push(["Verificações", r.nAvisos ? r.nAvisos + " aviso(s)" : "sem avisos"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "CBUQ na usina — jornada de 8 h, duas amostras", dados: function () {
        var e = { eObra: "Obra A — BR-000, lote 3", eProc: "Usina A (gravimétrica), partidas de 1 000 kg, CAP 50/70, brita 1, pedrisco e pó", eLocal: "Saída do misturador", eResp: "Técnico A — laboratorista",
          eData: "14/10/2025", eRem: "Unidade A", eFim: "Teor de ligante e granulometria", eInt: "Fiscalização" };
        return { ident: { registro: "EX-MB-001", data: "2025-10-14", obra: "Obra A", origem: "Usina A", camada: "Revestimento — CBUQ faixa C" },
          params: { situacao: "usina", dmax: "19.5", mistura: "CBUQ faixa C, CAP 50/70", horas: "8", chkSeg: "sim", chkTempo: "sim", chkQuart: "sim", chkAquec: "sim", chkUnif: "sim" },
          am: [Object.assign({ onde: "08:40 — partida 12", nPt: "2", t: "158", m: "12,5", eQtd: "12,5 kg" }, e), Object.assign({ onde: "14:15 — partida 61", nPt: "2", t: "162", m: "11,8", eQtd: "11,8 kg" }, e)] };
      } },
      { nome: "Pista acabada — corpos pequenos e sem toda a espessura", dados: function () {
        var e = { eObra: "Obra B — Rua A", eProc: "Usina B", eLocal: "Rua A, trilha de roda externa", eResp: "Técnico B — auxiliar", eData: "02/09/2025", eRem: "Unidade B", eFim: "Densidade aparente", eInt: "" };
        return { ident: { registro: "EX-MB-002", data: "2025-09-02", obra: "Obra B", camada: "Revestimento — CBUQ" },
          params: { situacao: "pista", dmax: "19.5", mistura: "CBUQ faixa C", horas: "10", chkSeg: "sim", chkEmb: "nao" },
          am: [Object.assign({ onde: "Est. 12", a: "10", b: "", eCam: "5,0", eAm: "5,0", eQtd: "1 corpo Ø 10 cm" }, e), Object.assign({ onde: "Est. 20", a: "25", b: "30", eCam: "5,0", eAm: "3,5", eQtd: "placa 25 × 30 cm" }, e)] };
      } },
    ],
  };
})();
