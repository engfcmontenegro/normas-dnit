/*
 * Ficha: DNER-ME 091/98 — Concreto — Ensaio de compressão de corpos-de-prova cilíndricos.
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var G = 9.80665;  // kgf -> N

  var CARGAS = [["kN", "kN"], ["N", "N"], ["tf", "tf (1 tf = 9,80665 kN)"], ["kgf", "kgf (1 kgf = 9,80665 N)"]];
  var FATOR = { N: 1, kN: 1000, tf: 1000 * G, kgf: G };
  // Tabela 1 — tolerância de tempo em função da idade de ruptura (idade em dias -> tolerância em horas)
  var TOL = { 1: 0.5, 3: 2, 7: 6, 28: 20, 60: 36, 90: 48 };
  var TOL_TXT = { 1: "± 30 min", 3: "± 2 h", 7: "± 6 h", 28: "± 20 h", 60: "± 36 h", 90: "± 2 d" };

  // "05/10/2021 08:00", "2021-10-05 08:00", "05/10/21" -> {t: ms, hora: bool}
  function dataHora(s) {
    s = String(s || "").trim();
    if (!s) return null;
    var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2})[:h](\d{2})?)?/), a, me, di;
    if (m) { di = +m[1]; me = +m[2]; a = +m[3]; if (a < 100) a += 2000; }
    else {
      m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2})[:h](\d{2})?)?/);
      if (!m) return null;
      a = +m[1]; me = +m[2]; di = +m[3];
    }
    var hora = m[4] !== undefined;
    return { t: Date.UTC(a, me - 1, di, hora ? +m[4] : 0, hora && m[5] ? +m[5] : 0), hora: hora };
  }
  function cargaN(v, P) { var x = num(v); return ok(x) ? x * (FATOR[P.unidade] || 1000) : NaN; }

  FE.FICHAS["dner-me-091-98"] = {
    titulo: "Concreto — Compressão de corpos de prova cilíndricos",
    resumo: "fc = 4Q / (π·d²), com Q (carga máxima) em N e d (média de dois diâmetros a meia altura) em mm; resultado em MPa com aproximação de 0,1 MPa. Idade de ruptura com as tolerâncias da Tabela 1.",
    blocos: [],
    params: [
      { k: "material", r: "Concreto / material", ph: "ex.: concreto C25, BGTC 3 % de cimento" },
      { k: "tipo", r: "Corpos de prova (1.2; 4.1–4.2)", tipo: "select",
        opcoes: [["moldado", "Moldados (DNER-ME 046 / NM 05:03-0136)"], ["testemunho", "Testemunhos extraídos da estrutura (NM 69)"]] },
      { k: "unidade", r: "Unidade da carga lida", tipo: "select", recarrega: true, opcoes: CARGAS },
      { k: "exemplar", r: "Resultado por exemplar", tipo: "select", recarrega: true,
        opcoes: [["cp", "Não — resultado de cada CP (DNER-ME 091)"], ["maior", "Sim — maior valor dos CPs do mesmo exemplar (NBR 12655 / NBR 5738)"]],
        dica: "a DNER-ME 091 não define exemplar; a prática da ABNT toma o maior dos dois CPs moldados da mesma amassada" },
      { k: "capacidade", r: "Capacidade da escala utilizada da prensa (na unidade da carga) — opcional",
        dica: "leituras válidas entre 20 % e 90 % da capacidade da escala (3.1.5.2)" },
      { k: "taxa", r: "Taxa de carregamento aplicada (MPa/s) — opcional", ph: "0,25", dica: "0,15 a 0,35 MPa/s (5.2.1)" },
      { k: "fck", r: "fck especificado (MPa) — opcional", dica: "compara os resultados da idade de controle com o fck (critério da especificação, não da DNER-ME 091)" },
      { k: "idadeFck", r: "Idade de controle para o fck (dias)", ph: "28", se: function (d) { return ok(num((d.params || {}).fck)); } },
    ],
    padrao: { tipo: "moldado", unidade: "kN", exemplar: "cp" },
    tabelas: function (d) {
      var P = d.params || {}, u = (CARGAS.filter(function (c) { return c[0] === P.unidade; })[0] || CARGAS[0])[0];
      var linhas = [{ k: "id", r: "Identificação do CP (7 a)", texto: true }];
      if (P.exemplar === "maior") linhas.push({ k: "ex", r: "Exemplar (mesma amassada)", texto: true });
      linhas.push({ grupo: "Idade (5.2.3, Tabela 1)" },
        { k: "idade", r: "Idade especificada", u: "dias" },
        { k: "mold", r: "Moldagem — data e hora", texto: true, ph: "dd/mm/aaaa hh:mm" },
        { k: "rupt", r: "Ruptura — data e hora", texto: true, ph: "dd/mm/aaaa hh:mm" },
        { calc: "idadeReal", r: "Idade real no rompimento", u: "h", casas: 1 },
        { grupo: "Dimensões (4.5)" },
        { k: "d1", r: "Diâmetro 1 — meia altura", u: "mm" },
        { k: "d2", r: "Diâmetro 2 — meia altura", u: "mm" },
        { calc: "d", r: "Diâmetro médio (d)", u: "mm", casas: 1 },
        { k: "h", r: "Altura com capeamento", u: "mm" },
        { calc: "hd", r: "Relação h/d (informativa)", u: "", casas: 2 },
        { grupo: "Ruptura (5.2.2; 6)" },
        { k: "q", r: "Carga máxima alcançada", u: u });
      if (P.unidade !== "N") linhas.push({ calc: "Q", r: "Carga máxima (Q)", u: "N", casas: 0 });
      linhas.push({ calc: "fc", r: "fc = 4Q / (π·d²) (seção 6)", u: "MPa", casas: 1, destaque: true },
        { k: "rup", r: "Tipo de ruptura (7 g)", texto: true },
        { k: "def", r: "Defeitos observados (7 f)", texto: true });
      return [{ chave: "cp", titulo: "Corpos de prova", rotulo: "CP", iniciais: 2, min: 1, linhas: linhas,
        dica: "uma coluna por corpo de prova; diâmetros e altura com precisão de 1 mm" }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var cap = num(P.capacidade), fck = num(P.fck), idadeFck = ok(num(P.idadeFck)) ? num(P.idadeFck) : 28;
      var cps = (d.cp || []).map(function (x, i) {
        var rot = "CP " + (x.id || i + 1);
        var ds = [num(x.d1), num(x.d2)].filter(ok), o = {};
        o.d = ds.length ? media(ds) : NaN;
        o.hd = ok(o.d) && ok(num(x.h)) ? num(x.h) / o.d : NaN;
        o.Q = cargaN(x.q, P);
        o.fc = ok(o.Q) && ok(o.d) && o.d > 0 ? 4 * o.Q / (Math.PI * o.d * o.d) : NaN;
        o.idade = num(x.idade);
        if (ds.length === 1 && ok(o.fc)) avisos.push(rot + ": o diâmetro é a média de dois diâmetros medidos a meia altura (4.5.1); há só um.");
        if (ok(o.d) && o.d < 30) avisos.push(rot + ": diâmetro de " + fmt(o.d, 1) + " mm — confira se as medidas estão em mm.");
        if (ok(o.hd) && (o.hd < 1.9 || o.hd > 2.1)) avisos.push(rot + ": h/d = " + fmt(o.hd, 2) + (P.tipo === "testemunho"
          ? " — a DNER-ME 091 não traz fator de correção de h/d; para testemunhos, siga a NM 69 (correção do resultado)."
          : " — CP moldado deve ter altura igual ao dobro do diâmetro; a DNER-ME 091 não traz fator de correção de h/d."));
        // idade real e tolerância da Tabela 1
        var a = dataHora(x.mold), b = dataHora(x.rupt);
        if (a && b) {
          var hs = (b.t - a.t) / 3600000;
          if (a.hora && b.hora) {
            o.idadeReal = hs;
            if (ok(o.idade) && TOL[o.idade] !== undefined && Math.abs(hs - o.idade * 24) > TOL[o.idade] + 1e-9) {
              avisos.push(rot + ": rompido com " + fmt(hs, 1) + " h (" + fmt(hs / 24, 2) + " d), fora da tolerância de " + TOL_TXT[o.idade] +
                " para a idade de " + o.idade + " d (Tabela 1).");
            }
          } else {
            var dias = Math.round((Math.floor(b.t / 86400000) - Math.floor(a.t / 86400000)));  // sem hora: só as datas
            if (ok(o.idade) && dias !== o.idade) avisos.push(rot + ": entre as datas de moldagem e ruptura há " + dias + " dia(s), diferente da idade especificada de " + o.idade + " d (5.2.3); informe as horas para conferir a tolerância da Tabela 1.");
          }
        }
        if (ok(o.idade) && TOL[o.idade] === undefined && ok(o.fc)) o.foraTabela = true;
        if (ok(cap) && ok(num(x.q)) && (num(x.q) < 0.2 * cap || num(x.q) > 0.9 * cap)) {
          avisos.push(rot + ": carga de " + fmt(num(x.q), 2) + " " + P.unidade + " fora de 20 % a 90 % da capacidade da escala (" + fmt(cap, 0) + " " + P.unidade + ") — leitura não válida (3.1.5.2).");
        }
        o.rot = rot; o.ex = String(x.ex || "").trim();
        return o;
      });
      var fora = cps.filter(function (o) { return o.foraTabela; }).map(function (o) { return o.rot + " (" + o.idade + " d)"; });
      if (fora.length) avisos.push("Idade fora da Tabela 1 (24 h, 3, 7, 28, 60 e 90 d) — sem tolerância definida: " + fora.join("; ") + ".");
      var taxa = num(P.taxa);
      if (ok(taxa) && (taxa < 0.15 || taxa > 0.35)) avisos.push("Taxa de carregamento de " + fmt(taxa, 2) + " MPa/s fora de 0,15 a 0,35 MPa/s (5.2.1).");

      // resultados: cada CP, ou exemplares (maior valor)
      var resultados = [];
      if (P.exemplar === "maior") {
        var grupos = {}, ordem = [];
        cps.forEach(function (o, i) {
          if (!ok(o.fc)) return;
          // exemplar = CPs da mesma amassada rompidos na mesma idade
          var k = (o.ex || ("CP " + ((d.cp[i] || {}).id || i + 1))) + (ok(o.idade) ? " — " + o.idade + " d" : "");
          if (!grupos[k]) { grupos[k] = []; ordem.push(k); }
          grupos[k].push(o);
        });
        ordem.forEach(function (k) {
          var g = grupos[k];
          var best = g.reduce(function (a, b) { return b.fc > a.fc ? b : a; });
          resultados.push({ nome: "Exemplar " + k, fc: best.fc, idade: best.idade, cps: g.map(function (o) { return o.rot + ": " + fmt(o.fc, 1); }).join("; "), n: g.length });
          if (g.length < 2) avisos.push("Exemplar " + k + ": só um CP — o exemplar é formado por dois CPs da mesma amassada (NBR 12655 / NBR 5738).");
          if (g.length === 2) {
            var dif = Math.abs(g[0].fc - g[1].fc) / Math.max(g[0].fc, g[1].fc) * 100;
            if (dif > 20) avisos.push("Exemplar " + k + ": os dois CPs diferem " + fmt(dif, 0) + " % — verifique moldagem, capeamento e tipo de ruptura.");
          }
        });
      } else {
        cps.forEach(function (o) { if (ok(o.fc)) resultados.push({ nome: o.rot, fc: o.fc, idade: o.idade }); });
      }
      var conforme = null;
      if (ok(fck)) {
        var ctrl = resultados.filter(function (r) { return r.idade === idadeFck; });
        if (ctrl.length) {
          ctrl.forEach(function (r) { r.atende = Math.round(r.fc * 10) / 10 >= fck; });
          conforme = ctrl.every(function (r) { return r.atende; });
          var nao = ctrl.filter(function (r) { return !r.atende; });
          if (nao.length) avisos.push(nao.map(function (r) { return r.nome + " (" + fmt(r.fc, 1) + " MPa)"; }).join("; ") + ": abaixo do fck de " + fmt(fck, 1) + " MPa aos " + idadeFck + " dias.");
        } else if (resultados.length) {
          avisos.push("Nenhum resultado na idade de controle de " + idadeFck + " dias — a comparação com o fck não foi feita.");
        }
      }
      return { tab: { cp: cps }, resultados: { lista: resultados, fck: fck, idadeFck: idadeFck, conforme: conforme,
        exemplar: P.exemplar === "maior" }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      if (!r.lista.length) return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">—</div><div class="fe-res-r">Resistência à compressão</div></div></div>';
      var linhas = r.lista.map(function (x) {
        return "<tr><td>" + esc(x.nome) + "</td><td>" + (ok(x.idade) ? x.idade + " d" : "—") + "</td><td><b>" + fmt(x.fc, 1) + "</b></td>" +
          (r.exemplar ? "<td>" + esc(x.cps || "") + "</td>" : "") +
          (ok(r.fck) ? "<td>" + (x.atende === undefined ? "—" : x.atende ? '<span class="fe-ok">≥ fck</span>' : '<span class="fe-nok">&lt; fck</span>') + "</td>" : "") + "</tr>";
      }).join("");
      return '<table class="fe-resumo"><thead><tr><th>' + (r.exemplar ? "Exemplar" : "CP") + "</th><th>Idade</th><th>fc (MPa)</th>" +
        (r.exemplar ? "<th>CPs do exemplar (MPa)</th>" : "") + (ok(r.fck) ? "<th>fck " + fmt(r.fck, 1) + " MPa (" + r.idadeFck + " d)</th>" : "") +
        "</tr></thead><tbody>" + linhas + "</tbody></table>" +
        (r.conforme === null ? "" : '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v fe-res-p">' +
          (r.conforme ? '<span class="fe-ok">todos ≥ fck</span>' : '<span class="fe-nok">há resultados &lt; fck</span>') +
          '</div><div class="fe-res-r">Comparação individual com o fck aos ' + r.idadeFck + " dias (informativa)</div></div></div>");
    },
    relatorio: {
      notas: "fc = 4Q / (π·d²), com Q em N e d em mm, aproximação de 0,1 MPa (seção 6); d = média de dois diâmetros medidos a meia altura com precisão de 1 mm (4.5.1); altura com capeamento (4.5.2). Tolerâncias de idade da Tabela 1: 24 h ± 30 min; 3 d ± 2 h; 7 d ± 6 h; 28 d ± 20 h; 60 d ± 36 h; 90 d ± 2 d. A DNER-ME 091 não prevê fator de correção de h/d nem define exemplar; quando marcado, o resultado do exemplar é o maior valor dos seus CPs (prática da NBR 12655 / NBR 5738). A comparação com o fck é individual e informativa — a aceitação do concreto segue a especificação da obra (fck estimado).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.material) rows.push(["Material", P.material]);
        r.lista.forEach(function (x) {
          rows.push([x.nome + (!r.exemplar && ok(x.idade) ? " — " + x.idade + " dias" : ""), fmt(x.fc, 1) + " MPa" + (x.cps ? " (CPs: " + x.cps + ")" : "") +
            (x.atende === undefined ? "" : x.atende ? " — ≥ fck" : " — ABAIXO DO fck")]);
        });
        if (ok(r.fck)) rows.push(["fck especificado", fmt(r.fck, 1) + " MPa aos " + r.idadeFck + " dias" +
          (r.conforme === null ? " — sem resultados nessa idade" : r.conforme ? " — todos os resultados atendem" : " — há resultados abaixo do fck")]);
        return rows;
      },
    },
    exemplos: [
      { nome: "BGTC — CPs 15 × 30 cm, 7 dias, 2 lotes (planilha do laboratório)", dados: function () {
        // MATRIX RUPTURA DE CP'S CONCRETO 25-09-23.xlsx, aba "ROMP. CPs (FX B)" (Unidade B, Obra B): BGTC faixa B,
        // lote 1 = 3 % de cimento (CP 3, cargas 2,77 e 2,73 tf), lote 2 = 4 % (CP 4, 6,80 e 5,86 tf); a coluna "Data de Imersão"
        // (05/10/2021, sem hora) foi tomada como data de moldagem;
        // ruptura 12/10/2021 15:30; área de 176,71 cm² (Ø 150 mm); fck de projeto 3,5 MPa aos 7 dias.
        return { ident: { registro: "EX-CP-001", obra: "Obra B", trecho: "BR-000", camada: "BGTC faixa B (DNIT 141-ES) — teste de dosagem", local: "Laboratório da Unidade B", data: "2021-10-12" },
          params: { material: "BGTC — 3 % (lote 1) e 4 % (lote 2) de cimento", tipo: "moldado", unidade: "tf", exemplar: "maior", fck: "3,5", idadeFck: "7" },
          cp: [
            { id: "3-A", ex: "Lote 1 (3 %)", idade: "7", mold: "05/10/2021", rupt: "12/10/2021 15:30", d1: "150", d2: "150", h: "300", q: "2,77", rup: "C" },
            { id: "3-B", ex: "Lote 1 (3 %)", idade: "7", mold: "05/10/2021", rupt: "12/10/2021 15:30", d1: "150", d2: "150", h: "300", q: "2,73", rup: "B" },
            { id: "4-A", ex: "Lote 2 (4 %)", idade: "7", mold: "05/10/2021", rupt: "12/10/2021 15:30", d1: "150", d2: "150", h: "300", q: "6,80", rup: "B" },
            { id: "4-B", ex: "Lote 2 (4 %)", idade: "7", mold: "05/10/2021", rupt: "12/10/2021 15:30", d1: "150", d2: "150", h: "300", q: "5,86", rup: "C" }] };
      } },
      { nome: "Concreto C25 — CPs 10 × 20 cm, exemplares aos 7 e 28 dias", dados: function () {
        // valores-alvo: 7 d ≈ 18,6 / 19,4 MPa; 28 d ≈ 27,3 / 28,1 e 26,2 / 25,4 MPa (Q = fc·π·d²/4)
        return { ident: { registro: "EX-CP-002", obra: "Ponte sobre o rio A", camada: "Concreto estrutural C25 — laje", data: "2025-03-20" },
          params: { material: "Concreto C25, abatimento 100 ± 20 mm", tipo: "moldado", unidade: "kN", exemplar: "maior", capacidade: "500", taxa: "0,25", fck: "25", idadeFck: "28" },
          cp: [
            { id: "1", ex: "E1", idade: "7", mold: "20/02/2025 09:00", rupt: "27/02/2025 10:30", d1: "100", d2: "101", h: "201", q: "149,0", rup: "cônica" },
            { id: "2", ex: "E1", idade: "7", mold: "20/02/2025 09:00", rupt: "27/02/2025 10:40", d1: "100", d2: "100", h: "200", q: "152,4", rup: "cônica" },
            { id: "3", ex: "E1", idade: "28", mold: "20/02/2025 09:00", rupt: "20/03/2025 08:50", d1: "101", d2: "100", h: "201", q: "217,9", rup: "cônica e bipartida" },
            { id: "4", ex: "E1", idade: "28", mold: "20/02/2025 09:00", rupt: "20/03/2025 09:00", d1: "100", d2: "100", h: "200", q: "220,7", rup: "cônica" },
            { id: "5", ex: "E2", idade: "28", mold: "20/02/2025 11:00", rupt: "20/03/2025 09:10", d1: "100", d2: "100", h: "200", q: "205,8", rup: "cisalhada" },
            { id: "6", ex: "E2", idade: "28", mold: "20/02/2025 11:00", rupt: "20/03/2025 09:20", d1: "100", d2: "101", h: "200", q: "201,5", rup: "cônica" }] };
      } },
      { nome: "Concreto C30 — CPs individuais, idade fora da tolerância e carga abaixo de 20 % da escala", dados: function () {
        return { ident: { registro: "EX-CP-003", camada: "Concreto C30 — pilar P4", data: "2025-05-14" },
          params: { material: "Concreto C30", tipo: "moldado", unidade: "kN", exemplar: "cp", capacidade: "1000", taxa: "0,45", fck: "30", idadeFck: "28" },
          cp: [
            { id: "P4-1", idade: "28", mold: "16/04/2025 14:00", rupt: "14/05/2025 08:00", d1: "100", d2: "100", h: "200", q: "245,0", rup: "cônica" },
            { id: "P4-2", idade: "28", mold: "16/04/2025 14:00", rupt: "15/05/2025 14:00", d1: "100", d2: "99", h: "199", q: "231,0", rup: "colunar" },
            { id: "P4-3", idade: "3", mold: "16/04/2025 14:00", rupt: "19/04/2025 14:30", d1: "100", d2: "100", h: "160", q: "118,5", rup: "cisalhada", def: "base mal capeada" }] };
      } },
    ],
  };
})();
