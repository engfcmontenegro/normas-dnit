/*
 * Ficha: DNER-ME 046/98 — Concreto — Moldagem e cura de corpos de prova cilíndricos ou prismáticos.
 * Ficha de registro/checklist: moldes (Tabela 1), dimensão básica × Dmáx (5.1), camadas e golpes (Tabela 2, Notas 3 e 4),
 * processo de adensamento × abatimento (Tabela 3), vibrador, cura inicial, desforma, cura final e preparo dos topos.
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  // Tabela 2 — número de camadas (e golpes por camada, adensamento manual de cilindros)
  var TAB2 = {
    cil: { manual: { 100: [2, 15], 150: [4, 30], 250: [5, 75] }, vib: { 100: [1], 150: [2], 250: [3], 450: [5] } },
    pri: { manual: { 150: [2], 250: [3] }, vib: { 150: [1], 250: [2], 450: [3] } },
  };
  var SN = [["", "—"], ["sim", "Sim"], ["nao", "Não"]];
  function ehVib(P) { return P.adens === "imersao" || P.adens === "mesa"; }
  // "07:30" -> minutos
  function hm(s) { var m = String(s || "").trim().match(/^(\d{1,2})[:h](\d{2})$/); return m ? +m[1] * 60 + +m[2] : NaN; }

  FE.FICHAS["dner-me-046-98"] = {
    titulo: "Concreto — Moldagem e cura de corpos de prova (registro)",
    resumo: "Registro da moldagem com as verificações da norma: moldes (Tabela 1), d ≥ 3·Dmáx (5.1.1.1), camadas e golpes (Tabela 2; 17 golpes por 10 000 mm² — Nota 4), adensamento conforme o abatimento (Tabela 3), vibrador (4.1.2.2–4.1.2.3), desforma com 24 h (cilindros) ou 48 h (prismas), cura final a 23 ± 2 °C e preparo dos topos (capeamento ≤ 3 mm, planicidade ≤ 0,05 mm).",
    blocos: [],
    params: [
      { k: "concreto", r: "Concreto / material", ph: "ex.: C25, brita 1" },
      { k: "forma", r: "Tipo de corpo de prova", tipo: "select", recarrega: true, opcoes: [["cil", "Cilíndrico (d × 2d)"], ["pri", "Prismático (d × d × ≥ 3d + 50 mm)"]] },
      { k: "d", r: "Dimensão básica d (mm) (3; 5.1)", ph: "150", dica: "cilindros: 100, 150, 250 ou 450 mm" },
      { k: "comp", r: "Comprimento do prisma (mm)", ph: "500", se: function (d) { return (d.params || {}).forma === "pri"; } },
      { k: "dmax", r: "Dimensão máxima característica do agregado D (mm)", ph: "25" },
      { k: "peneirado", r: "Concreto peneirado na peneira de 38 mm (Nota 5)", tipo: "select", opcoes: [["nao", "Não"], ["sim", "Sim"]] },
      { k: "abat", r: "Abatimento do tronco de cone a (mm) (4.6)", ph: "80" },
      { k: "adens", r: "Processo de adensamento (4.6; 5.2)", tipo: "select", recarrega: true,
        opcoes: [["manual", "Manual — haste de socamento Ø 16 mm"], ["imersao", "Vibratório — vibrador de imersão"], ["mesa", "Vibratório — mesa vibratória"]] },
      { k: "camadas", r: "Número de camadas usado", ph: "Tabela 2" },
      { k: "golpes", r: "Golpes por camada usados", ph: "Tabela 2", se: function (d) { return (d.params || {}).adens === "manual"; } },
      { k: "agulha", r: "Diâmetro da agulha do vibrador (mm)", ph: "25", se: function (d) { return (d.params || {}).adens === "imersao"; } },
      { k: "freq", r: "Frequência do vibrador / da mesa (vibrações/min)", ph: "7200", se: function (d) { return ehVib(d.params || {}); } },
      { k: "hAgua", r: "Hora da adição da água de amassamento (4.3.2 b)", ph: "hh:mm" },
      { k: "hIni", r: "Hora do início da moldagem", ph: "hh:mm" },
      { k: "hFim", r: "Hora do fim da moldagem", ph: "hh:mm" },
      { k: "interrup", r: "Moldagem sem interrupções (4.5.3)", tipo: "select", opcoes: SN },
      { k: "untados", r: "Juntas vedadas e moldes untados com óleo mineral (4.2)", tipo: "select", opcoes: SN },
      { k: "base", r: "Moldes sobre base nivelada, livre de choques e vibrações (4.4.1)", tipo: "select", opcoes: SN },
      { k: "cobertos", r: "Cobertos imediatamente com material não reativo e não absorvente (4.7)", tipo: "select", opcoes: SN },
      { k: "desf", r: "Tempo até a desforma (h) (5.3)", ph: "24" },
      { k: "cura", r: "Cura final (5.5)", tipo: "select", recarrega: true,
        opcoes: [["", "—"], ["cal", "Imersos em água saturada de cal"], ["camara", "Câmara úmida (UR ≥ 95 %)"], ["areia", "Enterrados em areia saturada"], ["agua", "Imersos em água sem cal"], ["outra", "Outra"]] },
      { k: "tCura", r: "Temperatura da cura final (°C)", ph: "23" },
      { k: "urCura", r: "Umidade relativa da câmara (%)", ph: "95", se: function (d) { return (d.params || {}).cura === "camara"; } },
      { k: "topo", r: "Preparo dos topos (5.6)", tipo: "select", recarrega: true,
        opcoes: [["", "—"], ["remate", "Remate com pasta de cimento (5.6.1)"], ["capeamento", "Capeamento (5.6.2.2)"], ["retifica", "Retificação (5.6.2.1)"], ["nenhum", "Nenhum"]] },
      { k: "hRemate", r: "Remate — horas após a moldagem", ph: "6 a 15", se: function (d) { return (d.params || {}).topo === "remate"; } },
      { k: "espCap", r: "Espessura do capeamento / remate por topo (mm)", ph: "≤ 3", se: function (d) { var t = (d.params || {}).topo; return t === "capeamento" || t === "remate"; } },
      { k: "plan", r: "Falha de planicidade máxima do topo (mm)", ph: "≤ 0,05", se: function (d) { var t = (d.params || {}).topo; return t === "capeamento" || t === "retifica"; } },
    ],
    padrao: { forma: "cil", adens: "manual", peneirado: "nao" },
    tabelas: function (d) {
      var pri = (d.params || {}).forma === "pri";
      return [{
        chave: "cp", titulo: "Moldes / corpos de prova (Tabela 1)", rotulo: "CP", iniciais: 2, min: 1,
        dica: pri ? "arestas da seção e comprimento do molde" : "dois diâmetros ortogonais (um pela geratriz cortada do molde) e altura",
        linhas: [
          { k: "id", r: "Identificação do CP / molde", texto: true },
          { k: "d1", r: pri ? "Aresta 1 da seção" : "Diâmetro 1", u: "mm" },
          { k: "d2", r: pri ? "Aresta 2 da seção" : "Diâmetro 2 (ortogonal)", u: "mm" },
          { calc: "dif", r: pri ? "Diferença entre arestas" : "Diferença entre diâmetros", u: "mm", casas: 1 },
          { k: "h", r: pri ? "Comprimento" : "Altura", u: "mm" },
          { k: "obs", r: "Observação", texto: true },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], ch = [], pri = P.forma === "pri", vib = ehVib(P);
      var dd = num(P.d), D = num(P.dmax), a = num(P.abat), nc = num(P.camadas), ng = num(P.golpes);
      function add(item, reg, exig, cond) { ch.push({ item: item, reg: reg, exig: exig, ok: cond }); if (cond === false) avisos.push(item + ": " + reg + " — exigido " + exig + "."); }
      // dimensão básica
      if (ok(dd)) {
        if (!pri && [100, 150, 250, 450].indexOf(dd) < 0) add("Dimensão básica do cilindro (5.1.1.1)", fmt(dd, 0) + " mm", "100, 150, 250 ou 450 mm", false);
        if (ok(D)) {
          var excecao = dd === 150 && D > 38 && P.peneirado === "sim";
          add("d ≥ 3·D (5.1.1.1)", fmt(dd, 0) + " mm; 3·D = " + fmt(3 * D, 0) + " mm" + (excecao ? " (Nota 5: concreto peneirado em 38 mm)" : ""), "d ≥ " + fmt(3 * D, 0) + " mm", excecao || dd >= 3 * D - 1e-9);
          if (excecao) avisos.push("Nota 5: correlacionar os resultados dos CPs de concreto peneirado com os de concreto integral.");
        }
        if (pri) {
          var L = num(P.comp);
          if (ok(L)) add("Comprimento do prisma (5.1.2)", fmt(L, 0) + " mm", "≥ 3d + 50 = " + fmt(3 * dd + 50, 0) + " mm", L >= 3 * dd + 50 - 1e-9);
        }
      }
      // Tabela 3 — processo × abatimento
      if (ok(a)) {
        var perm = a < 20 ? ["vib"] : a < 60 ? ["manual", "vib"] : ["manual"];
        var txt = a < 20 ? "vibratório (a < 20 mm)" : a < 60 ? "manual ou vibratório (20 ≤ a < 60 mm)" : "manual (a ≥ 60 mm)";
        add("Processo de adensamento (Tabela 3)", vib ? "vibratório" : "manual", txt, perm.indexOf(vib ? "vib" : "manual") >= 0);
        if (a === 180) avisos.push("Abatimento de 180 mm: a Tabela 3 não cobre a = 180 mm (60 ≤ a < 180 e a > 180) — ambas as faixas indicam adensamento manual.");
      }
      // Tabela 2 — camadas e golpes
      var tab = ((TAB2[pri ? "pri" : "cil"] || {})[vib ? "vib" : "manual"] || {})[dd];
      var Hcp = pri ? dd : 2 * dd;  // altura de enchimento: 2d no cilindro, d (aresta) no prisma
      var ncReq = NaN, ngReq = NaN, base = "";
      if (ok(dd)) {
        if (tab) { ncReq = tab[0]; base = "Tabela 2"; }
        else { ncReq = Math.ceil(Hcp / (vib ? 200 : 100)); base = "d fora da Tabela 2 — camadas de até " + (vib ? 200 : 100) + " mm (Nota 3)"; }
        if (!vib && ok(a) && a > 180) { ncReq = Math.max(1, Math.ceil(ncReq / 2)); base += "; metade das camadas — abatimento > 180 mm (5.2.1.3)"; }
        if (!vib) {
          var area = pri ? dd * (ok(num(P.comp)) ? num(P.comp) : 3 * dd + 50) : Math.PI * dd * dd / 4;
          ngReq = tab && tab[1] ? tab[1] : Math.round(17 * area / 10000);
        }
        if (ok(nc)) add("Número de camadas (" + base + ")", String(nc), String(ncReq), nc === ncReq);
        if (!vib && ok(ng)) add("Golpes por camada (" + (tab && tab[1] ? "Tabela 2" : "17 golpes por 10 000 mm² — Nota 4") + ")", String(ng), String(ngReq), ng === ngReq);
        if (!vib && ok(a) && a > 180 && Hcp / ncReq > 100 + 1e-9) avisos.push("Com a metade das camadas (5.2.1.3) cada camada teria " + fmt(Hcp / ncReq, 0) + " mm, acima dos 100 mm da Nota 3 para adensamento manual — a norma é contraditória neste caso; prevalece a regra específica de 5.2.1.3.");
        var hc = ok(nc) && nc > 0 ? Hcp / nc : NaN;
        if (ok(hc)) add("Altura das camadas (Nota 3)", "≈ " + fmt(hc, 0) + " mm", "≤ " + (vib ? 200 : 100) + " mm", hc <= (vib ? 200 : 100) + 1e-9);
      }
      // vibrador
      if (P.adens === "imersao") {
        var ag = num(P.agulha), agMax = ok(dd) ? dd / (pri ? 3 : 4) : NaN;
        if (ok(ag)) add("Diâmetro da agulha (4.1.2.2.2)", fmt(ag, 0) + " mm", "25 mm a d/" + (pri ? 3 : 4) + (ok(agMax) ? " = " + fmt(agMax, 1) + " mm" : ""), ag >= 25 && (!ok(agMax) || ag <= agMax + 1e-9));
        if (ok(agMax) && agMax < 25) avisos.push("Com d = " + fmt(dd, 0) + " mm, d/" + (pri ? 3 : 4) + " < 25 mm: não há agulha que atenda a 4.1.2.2.2 — use mesa vibratória ou adensamento manual.");
      }
      var fr = num(P.freq);
      if (vib && ok(fr)) add(P.adens === "mesa" ? "Frequência da mesa vibratória (4.1.2.3)" : "Frequência do vibrador de imersão (4.1.2.2.1)", fmt(fr, 0) + " vib/min", "≥ " + fmt(P.adens === "mesa" ? 2400 : 7200, 0) + " vib/min", fr >= (P.adens === "mesa" ? 2400 : 7200));
      // registros sim/não
      [["interrup", "Moldagem sem interrupções (4.5.3)"], ["untados", "Vedação e óleo mineral nos moldes (4.2)"], ["base", "Base nivelada, sem choques/vibrações (4.4.1)"], ["cobertos", "Cobertura imediata dos CPs (4.7)"]].forEach(function (q) {
        if (P[q[0]]) add(q[1], P[q[0]] === "sim" ? "sim" : "não", "sim", P[q[0]] === "sim");
      });
      var tA = hm(P.hAgua), tI = hm(P.hIni), tF = hm(P.hFim);
      if (ok(tI) && ok(tF) && tF < tI) tF += 1440;
      if (ok(tA) && ok(tI) && tI < tA) tI += 1440;
      if (ok(tA) && ok(tI)) ch.push({ item: "Da adição da água ao início da moldagem", reg: fmt(tI - tA, 0) + " min", exig: "registro (4.3.2)", ok: null });
      if (ok(tI) && ok(tF)) ch.push({ item: "Duração da moldagem", reg: fmt(tF - tI, 0) + " min", exig: "sem interrupções (4.5.3)", ok: null });
      // desforma
      var desf = num(P.desf), desfReq = pri ? 48 : 24;
      if (ok(desf)) add("Desforma (5.3)", fmt(desf, 0) + " h", desfReq + " h (" + (pri ? "prismático" : "cilíndrico") + ")", desf >= desfReq - 1);
      if (ok(desf) && desf > desfReq + 24) avisos.push("Desforma com " + fmt(desf, 0) + " h — a norma prevê " + desfReq + " h, salvo se o endurecimento não permitir (5.3).");
      // cura final
      if (P.cura) {
        add("Condição da cura final (5.5)", { cal: "água saturada de cal", camara: "câmara úmida", areia: "areia saturada", agua: "água sem cal", outra: "outra" }[P.cura],
          "água saturada de cal, câmara úmida (UR ≥ 95 %) ou areia saturada", ["cal", "camara", "areia"].indexOf(P.cura) >= 0);
      }
      var tc = num(P.tCura);
      if (ok(tc)) add("Temperatura da cura final (5.5)", fmt(tc, 1) + " °C", "23 ± 2 °C", Math.abs(tc - 23) <= 2 + 1e-9);
      var ur = num(P.urCura);
      if (P.cura === "camara" && ok(ur)) add("Umidade relativa da câmara (5.5)", fmt(ur, 0) + " %", "≥ 95 %", ur >= 95);
      // topos
      var hr = num(P.hRemate), ec = num(P.espCap), pl = num(P.plan);
      if (P.topo === "remate") {
        if (pri) avisos.push("Remate com pasta é opcional só para corpos de prova cilíndricos (5.6.1).");
        if (ok(hr)) add("Remate com pasta (5.6.1.1)", fmt(hr, 1) + " h após a moldagem", "6 h a 15 h", hr >= 6 && hr <= 15);
      }
      if ((P.topo === "capeamento" || P.topo === "remate") && ok(ec)) add(P.topo === "remate" ? "Espessura do remate (5.6.1.1)" : "Espessura do capeamento (5.6.2.2.4)", fmt(ec, 1) + " mm", "≤ 3 mm", ec <= 3 + 1e-9);
      if ((P.topo === "capeamento" || P.topo === "retifica") && ok(pl)) add("Planicidade do topo (" + (P.topo === "retifica" ? "5.6.2.1.2" : "5.6.2.2.3") + ")", fmt(pl, 2) + " mm", "≤ 0,05 mm", pl <= 0.05 + 1e-9);
      if (P.topo === "nenhum" && !pri) avisos.push("Topos sem preparo: CPs que não satisfaçam às tolerâncias devem ser rematados, capeados ou retificados (5.6).");
      // moldes (Tabela 1)
      var tolN = ok(dd) ? (dd <= 100 ? 1.0 : 1.5) : NaN, tolD = tolN;
      var cps = (d.cp || []).map(function (x, i) {
        var o = { nome: String(x.id || i + 1) }, d1 = num(x.d1), d2 = num(x.d2), h = num(x.h);
        o.dif = ok(d1) && ok(d2) ? Math.abs(d1 - d2) : NaN;
        if (!ok(dd)) return o;
        var ruins = [];
        [d1, d2].forEach(function (v) { if (ok(v) && Math.abs(v - dd) > tolN + 1e-9) ruins.push((pri ? "aresta " : "diâmetro ") + fmt(v, 1) + " mm"); });
        var hNom = pri ? (ok(num(P.comp)) ? num(P.comp) : NaN) : 2 * dd;
        if (ok(h) && ok(hNom) && Math.abs(h - hNom) > tolN + 1e-9) ruins.push((pri ? "comprimento " : "altura ") + fmt(h, 1) + " mm (nominal " + fmt(hNom, 0) + ")");
        if (!pri && ok(o.dif) && o.dif > tolD + 1e-9) ruins.push("diferença entre diâmetros de " + fmt(o.dif, 1) + " mm (máx. " + fmt(tolD, 1) + ")");
        if (ruins.length) avisos.push("Molde " + o.nome + " fora das tolerâncias da Tabela 1 (± " + fmt(tolN, 1) + " mm): " + ruins.join("; ") + ".");
        o.okMolde = !ruins.length && (ok(d1) || ok(d2) || ok(h)) ? true : ruins.length ? false : null;
        return o;
      });
      var molOk = cps.filter(function (o) { return o.okMolde !== null && o.okMolde !== undefined; });
      if (molOk.length) ch.push({ item: "Moldes dentro das tolerâncias (Tabela 1)", reg: molOk.filter(function (o) { return o.okMolde; }).length + " de " + molOk.length, exig: "todos", ok: molOk.every(function (o) { return o.okMolde; }) });
      var nOk = ch.filter(function (c) { return c.ok === true; }).length, nNok = ch.filter(function (c) { return c.ok === false; }).length;
      return { tab: { cp: cps }, resultados: { ch: ch, nOk: nOk, nNok: nNok, ncReq: ncReq, ngReq: ngReq, vib: vib }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      var topo = '<div class="fe-res">' +
        '<div class="fe-res-item"><div class="fe-res-v">' + (ok(r.ncReq) ? r.ncReq : "—") + '</div><div class="fe-res-r">Camadas exigidas (Tabela 2)</div></div>' +
        (r.vib ? "" : '<div class="fe-res-item"><div class="fe-res-v">' + (ok(r.ngReq) ? r.ngReq : "—") + '</div><div class="fe-res-r">Golpes por camada exigidos</div></div>') +
        '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (!r.ch.length ? "—" : r.nNok ? '<span class="fe-nok">' + r.nNok + " não conforme(s)</span>" : '<span class="fe-ok">conforme</span>') +
        '</div><div class="fe-res-r">' + r.nOk + " verificação(ões) atendida(s)</div></div></div>";
      if (!r.ch.length) return topo;
      return topo + '<table class="fe-resumo"><thead><tr><th>Verificação</th><th>Registrado</th><th>Exigido</th><th>Situação</th></tr></thead><tbody>' +
        r.ch.map(function (c) { return "<tr><td>" + esc(c.item) + "</td><td>" + esc(c.reg) + "</td><td>" + esc(c.exig) + "</td><td>" + (c.ok === null ? "registro" : c.ok ? '<span class="fe-ok">atende</span>' : '<span class="fe-nok">não atende</span>') + "</td></tr>"; }).join("") +
        "</tbody></table>";
    },
    relatorio: {
      notas: "Moldes: Tabela 1 — dimensões nominais ± 1,0 mm (d = 100) e ± 1,5 mm (d ≥ 150); diferença entre diâmetros ortogonais 1,0 / 1,5 mm; base 4,5 mm e parede 3,0 mm (cilíndricos), 12 mm (prismáticos). Na Tabela 1 (p. 3) o desvio de geratriz aparece como 0,03 mm (d = 100) e 0,3 mm (d ≥ 150) — provável erro de digitação em um dos valores. Tabela 2: cilindros manuais 2 × 15 (100), 4 × 30 (150), 5 × 75 (250); vibratórios 1, 2, 3 e 5 camadas (100 a 450); prismas manuais 2 e 3 camadas com 17 golpes por 10 000 mm²; vibratórios 1, 2 e 3 camadas. Camadas de até 100 mm (manual) e 200 mm (vibratório) (Nota 3); abatimento > 180 mm: metade das camadas (5.2.1.3). Tabela 3: a < 20 mm vibratório; 20 ≤ a < 60 manual ou vibratório; a ≥ 60 mm manual (a = 180 mm não aparece na tabela). Vibrador de imersão ≥ 7200 vib/min, agulha de 25 mm a d/4 (cilindro) ou d/3 (prisma); mesa ≥ 2400 vib/min. Desforma com 24 h (cilíndricos) ou 48 h (prismáticos) (5.3). Cura final em água saturada de cal, câmara úmida com UR ≥ 95 % ou areia saturada, a 23 ± 2 °C (5.5). Remate com pasta 6 h a 15 h após a moldagem, ≤ 3 mm; capeamento ≤ 3 mm por topo; planicidade ≤ 0,05 mm (5.6).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.concreto) rows.push(["Concreto", P.concreto]);
        rows.push(["Corpos de prova", (P.forma === "pri" ? "prismáticos " : "cilíndricos ") + (ok(num(P.d)) ? "d = " + P.d + " mm" : "") + " — " + (d.cp || []).length + " CP(s)"]);
        r.ch.forEach(function (c) { rows.push([c.item, c.reg + " (exigido " + c.exig + ")" + (c.ok === null ? "" : c.ok ? " — atende" : " — NÃO ATENDE")]); });
        rows.push(["Situação", r.nNok ? r.nNok + " verificação(ões) não conforme(s)" : "moldagem e cura conformes às verificações registradas"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "BGTC — 4 CPs 15 × 30 cm, abatimento 7 mm (planilha do laboratório)", dados: function () {
        // MATRIX RUPTURA DE CP'S CONCRETO 25-09-23.xlsx, aba "ROMP. CPs (FX B)" (Unidade B, Obra B): moldes de 15 × 30 cm
        // (área 176,71 cm²), CPs 3 e 4 (dois por lote), "Data de Imersão" 05/10/2021, slump medido 0,7 cm; mistura com brita 1
        // (19 mm) e brita 0 — Dmáx adotado de 25 mm. Processo de adensamento, horários, desforma e cura não constam da
        // planilha: adotados (mesa vibratória, 2 camadas; imersão em água saturada de cal; desforma com 24 h). Dimensões dos moldes = nominais.
        return { ident: { registro: "EX-MO-001", obra: "Obra B", trecho: "BR-000", camada: "BGTC faixa B (DNIT 141-ES) — teste de dosagem", local: "Laboratório da Unidade B", data: "2021-10-05" },
          params: { concreto: "BGTC — 3 % (lote 1) e 4 % (lote 2) de cimento", forma: "cil", d: "150", dmax: "25", peneirado: "nao", abat: "7", adens: "mesa", camadas: "2", freq: "3600",
            interrup: "sim", untados: "sim", base: "sim", cobertos: "sim", desf: "24", cura: "cal", tCura: "23", topo: "capeamento", espCap: "2", plan: "0,05" },
          cp: [{ id: "3-A", d1: "150", d2: "150", h: "300" }, { id: "3-B", d1: "150", d2: "150", h: "300" }, { id: "4-A", d1: "150", d2: "150", h: "300" }, { id: "4-B", d1: "150", d2: "150", h: "300" }] };
      } },
      { nome: "Concreto fluido em CPs 10 × 20 cm com Dmáx 38 mm — camadas, desforma, cura e capeamento fora da norma", dados: function () {
        return { ident: { registro: "EX-MO-002", obra: "Obra C", local: "Canteiro — pilar P7", camada: "Concreto C25 bombeável", data: "2025-08-12" },
          params: { concreto: "C25 com aditivo superplastificante", forma: "cil", d: "100", dmax: "38", peneirado: "nao", abat: "200", adens: "manual", camadas: "2", golpes: "15",
            hAgua: "07:40", hIni: "08:05", hFim: "08:35", interrup: "nao", untados: "sim", base: "sim", cobertos: "nao", desf: "18", cura: "camara", tCura: "27", urCura: "90", topo: "capeamento", espCap: "4", plan: "0,08" },
          cp: [{ id: "P7-1", d1: "100,4", d2: "99,6", h: "200,5" }, { id: "P7-2", d1: "101,2", d2: "99,6", h: "201,8", obs: "molde amassado" }] };
      } },
    ],
  };
})();
