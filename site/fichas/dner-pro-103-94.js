/*
 * Ficha: DNER-PRO 103/94 — Coleta de amostras de óleos e graxas lubrificantes (registro e verificação).
 * Número de recipientes a amostrar pela Tabela 1 (óleo em tambores/baldes e produtos em latas, 3.2.2 e 4.3) ou quantidade
 * de graxa pela Tabela 2 (3.2.7); uma coluna por recipiente amostrado (profundidades de tomada, quantidade, aspecto).
 * Confere repouso de 48 h (4.1.2), amostra final ≥ 2 L de óleo ou 2 kg de graxa (3.2.1), recipiente de 2 L / 2 kg sem
 * rolha de borracha (3.1 e 6), limpeza e secagem a 105 °C por 12 h (4.5), composta de graxa e penetração (4.4.9) e a
 * ficha de identificação (5). Registra-se em window.FE.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  // Tabela 1: [até N recipientes, recipientes a amostrar] (1 a 3: todos)
  var TAB1 = [[3, 0], [64, 4], [125, 5], [216, 6], [343, 7], [512, 8], [729, 9], [1000, 10]];
  var ID = [["iNat", "a) natureza do material"], ["iMarca", "b) marca comercial"], ["iCod", "c) código do DNER"], ["iFim", "d) fim a que se destina"],
    ["iQtd", "e) quantidade (volume ou massa)"], ["iFab", "f) nome do fabricante"], ["iData", "g) data e local da coleta"], ["iResp", "h) responsável pela coleta"]];
  var SN = [["", "— não verificado"], ["sim", "Sim"], ["nao", "Não"]];
  function prod(d) { return ((d && d.params) || {}).produto || "oleo"; }
  function emb(d) { return ((d && d.params) || {}).embalagem || "tambor"; }
  function oleo(d) { return prod(d) === "oleo"; }
  function graxa(d) { return prod(d) === "graxa"; }
  var CHECK = [
    ["chkAcaso", "3.2.6", "Recipientes selecionados ao acaso", function () { return true; }],
    ["chkLav", "4.1.2 d/e", "Tubo lavado com o próprio óleo, óleo de lavagem descartado, sem tocar a parte que volta a ser imersa", function (d) { return oleo(d) && emb(d) !== "lata"; }],
    ["chkMao", "4.1.2 h", "Conteúdo transferido ao recipiente sem contato manual com a amostra", function (d) { return oleo(d) && emb(d) !== "lata"; }],
    ["chkExame", "4.4.1 e 4.4.2", "Exame visual da graxa (bordas × centro, a ~15 cm) quanto a estrutura e consistência, comparando os recipientes abertos", graxa],
    ["chkComp", "4.4.9", "Amostra composta de porções iguais bem misturadas com colher/espátula, sem mistura violenta nem entrada de ar", graxa],
    ["chkLimpo", "4.5.1 a 4.5.3", "Recipiente limpo (gasolina, água e sabão, água, álcool absoluto) e seco antes do enchimento", function () { return true; }],
    ["chkHerm", "5 e 6", "Recipientes hermeticamente fechados, sem rolha de borracha e sem vazamento, encaminhados imediatamente ao laboratório", function () { return true; }],
  ];
  function nTab1(N) { if (!ok(N) || N < 1) return NaN; for (var i = 0; i < TAB1.length; i++) if (N <= TAB1[i][0]) return TAB1[i][1] || N; return NaN; }
  // Tabela 2 (graxa) — faixas sobrepostas na norma; a ficha usa a faixa mais estreita que contém N (ver notas)
  function tab2(N, e) {
    if (!ok(N) || N < 1) return null;
    if (e === "balde") return N <= 250 ? { min: 2.0, max: 2.0, rec: 1, txt: "2,0 kg de um ou mais baldes (1 a 250)" } : N <= 1050 ? { min: 1.0, max: 2.5, rec: 2, txt: "1,0 a 2,5 kg de dois ou mais baldes (1 a 1 050)" } : null;
    return N <= 25 ? { min: 2.0, max: 2.0, rec: 1, txt: "2 kg de 1 ou mais tambores (1 a 25)" } : N <= 75 ? { min: 1.0, max: 2.5, rec: 2, txt: "1,0 a 2,5 kg de dois ou mais tambores (1 a 75)" } :
      { min: 1.0, max: 2.5, rec: 3, txt: "1,0 a 2,5 kg de três ou mais tambores (mais de 75)" };
  }

  FE.FICHAS["dner-pro-103-94"] = {
    titulo: "Óleos e graxas lubrificantes — Coleta de amostras",
    resumo: "Registro e verificação da coleta de óleos e graxas lubrificantes em tambores, baldes e latas: recipientes a amostrar (Tabela 1) ou quantidade de graxa (Tabela 2), repouso de 48 h, profundidades de tomada, amostra ≥ 2 L ou 2 kg, recipientes, limpeza e secagem, identificação (5) e remessa (6).",
    params: [
      { k: "produto", r: "Produto (3.2.1)", tipo: "select", recarrega: true, opcoes: [["oleo", "Óleo lubrificante"], ["graxa", "Graxa lubrificante"]] },
      { k: "embalagem", r: "Embalagem (4)", tipo: "select", recarrega: true, opcoes: [["tambor", "Tambor (200 L)"], ["balde", "Balde"], ["lata", "Lata (4.3: todo o conteúdo)"]] },
      { k: "codigo", r: "Código do DNER / fabricante (3.2.4)", ph: "ex.: ML-30 — Fabricante A" },
      { k: "nTot", r: "Quantidade total de recipientes do mesmo produto (mesmo código e fabricante) (3.2.4)" },
      { k: "finalidade", r: "Finalidade da amostragem do óleo (4.1.2 / 4.1.3)", tipo: "select", se: function (d) { return oleo(d) && emb(d) !== "lata"; },
        opcoes: [["agua", "Presença de água, ferrugem e insolúveis — tubo vedado até o fundo (4.1.2)"], ["geral", "Estado geral, produtos em suspensão — tubo livre (4.1.3)"]] },
      { k: "repouso", r: "Tempo do tambor em repouso na vertical, bujões para cima, h (4.1.2 a/b)", se: function (d) { return oleo(d) && emb(d) === "tambor"; } },
      { k: "recip", r: "Recipiente da amostra (3.1)", tipo: "select", opcoes: [["vidro", "Vidro de boca larga, rolha de cortiça ou plástico"], ["flandres", "Folha-de-flandres, rolha de cortiça, plástico ou metálica"], ["borracha", "Com rolha de borracha"]] },
      { k: "capRec", r: "Capacidade do recipiente da amostra, L ou kg (3.1: 2)" },
      { k: "tEst", r: "Secagem do recipiente em estufa — temperatura, °C (4.5.4: 105)" },
      { k: "hEst", r: "Secagem do recipiente em estufa — duração, h (4.5.4: 12)" },
      { k: "penet", r: "Penetração da graxa, 0,1 mm (4.4.9)", se: graxa },
      { k: "variacao", r: "Diferença entre recipientes ou dentro do recipiente? (4.4.6 e 4.4.7)", tipo: "select", se: graxa, opcoes: [["nao", "Não — amostra composta"], ["sim", "Sim — amostras separadas"]] },
    ].concat(ID.map(function (e) { return { k: e[0], r: "Identificação (5): " + e[1] }; }))
      .concat(CHECK.map(function (c) { return { k: c[0], r: c[2] + " (" + c[1] + ")", tipo: "select", opcoes: SN, se: c[3] }; })),
    padrao: { produto: "oleo", embalagem: "tambor", finalidade: "agua", recip: "vidro", variacao: "nao" },
    tabelas: function (d) {
      var g = graxa(d), e = emb(d), L = [{ k: "id", r: "Identificação do recipiente (lote, nº)", texto: true }];
      if (!g && e !== "lata") L.push({ k: "p1", r: "Profundidade da 1ª tomada — lavagem do tubo (4.1.2 c: ≈ 30 cm)", u: "cm" }, { k: "fundo", r: "Tubo introduzido até o fundo? (sim/não)", texto: true });
      if (g) L.push({ k: "pEx", r: "Profundidade do exame visual (4.4.1: ≈ 15 cm)", u: "cm" }, { k: "pCol", r: "Profundidade da tomada no centro (4.4.3: ≈ 10 cm)", u: "cm" },
        { k: "aspecto", r: "Estrutura e consistência (4.4.1)", texto: true });
      L.push({ k: "q", r: g ? "Graxa retirada deste recipiente" : "Óleo retirado deste recipiente", u: g ? "kg" : "L" });
      return [{ chave: "rec", titulo: "Recipientes amostrados", rotulo: "Recipiente", iniciais: g ? 2 : 4, min: 1, linhas: L, dica: "uma coluna por recipiente escolhido ao acaso" }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], g = graxa(d), e = emb(d), N = num(P.nTot), r = { g: g };
      var rec = (d.rec || []).filter(function (x) { return String(x.id || "").trim() || ok(num(x.q)); });
      r.nRec = rec.length;
      r.q = rec.reduce(function (a, x) { return a + (ok(num(x.q)) ? num(x.q) : 0); }, 0);
      if (!g || e === "lata") {
        r.nReq = nTab1(N);
        if (ok(N) && N > 1000) avisos.push("Total de " + fmt(N, 0) + " recipientes acima da Tabela 1 (até 1 000) — a norma não fixa o número a amostrar.");
        if (ok(r.nReq) && r.nRec < r.nReq) avisos.push(r.nRec + " recipiente(s) amostrado(s) — a Tabela 1 pede " + r.nReq + " para " + fmt(N, 0) + " recipientes" + (N <= 3 ? " (todos)" : "") + " (3.2.2; 4.3).");
      } else {
        var t2 = tab2(N, e);
        r.t2 = t2;
        if (ok(N) && !t2) avisos.push("Total de " + fmt(N, 0) + " baldes acima da Tabela 2 (até 1 050).");
        if (t2) {
          r.nReq = t2.rec;
          if (r.nRec < t2.rec) avisos.push(r.nRec + " " + (e === "tambor" ? "tambor(es)" : "balde(s)") + " amostrado(s) — Tabela 2: " + t2.txt + " (3.2.7).");
          if (r.q && (r.q < t2.min - 1e-9 || r.q > t2.max + 1e-9)) avisos.push("Graxa coletada: " + fmt(r.q, 2) + " kg — Tabela 2: " + t2.txt + " (3.2.7).");
        }
      }
      var minQ = 2;
      if (r.q && r.q < minQ - 1e-9 && !(g && r.t2 && r.t2.min < 2)) avisos.push("Amostra de " + fmt(r.q, 2) + (g ? " kg" : " L") + " — no mínimo 2 " + (g ? "kg de graxa" : "litros de óleo") + " (3.2.1).");
      if (!g && e === "tambor") {
        var h = num(P.repouso);
        if (ok(h) && h < 48) avisos.push("Tambor em repouso por " + fmt(h, 0) + " h — deixar na vertical, bujões para cima, por 48 horas antes da coleta (4.1.2 a).");
      }
      rec.forEach(function (x, i) {
        var rot = "Recipiente " + (i + 1);
        if (!g && e !== "lata") {
          var p1 = num(x.p1);
          if (ok(p1) && Math.abs(p1 - 30) > 10) avisos.push(rot + ": 1ª tomada a " + fmt(p1, 0) + " cm — introduzir o tubo até mais ou menos 30 cm (4.1.2 c; critério da ficha ± 10 cm).");
          if (/^n/i.test(String(x.fundo || "").trim())) avisos.push(rot + ": a amostra é tomada com o tubo introduzido até o fundo do tambor (4.1.2 f/g; 4.1.3).");
        }
        if (g) {
          var pe = num(x.pEx), pc = num(x.pCol);
          if (ok(pe) && Math.abs(pe - 15) > 5) avisos.push(rot + ": exame visual a " + fmt(pe, 0) + " cm — aproximadamente 15 cm abaixo da superfície (4.4.1; critério da ficha ± 5 cm).");
          if (ok(pc) && Math.abs(pc - 10) > 5) avisos.push(rot + ": tomada a " + fmt(pc, 0) + " cm — do centro, a aproximadamente 10 cm abaixo da superfície (4.4.3; critério da ficha ± 5 cm).");
        }
      });
      if (P.recip === "borracha") avisos.push("Não é permitido o uso de rolha de borracha (3.1 a; 6).");
      var cap = num(P.capRec);
      if (ok(cap) && Math.abs(cap - 2) > 0.1) avisos.push("Recipiente de " + fmt(cap, 1) + (g ? " kg" : " L") + " — a norma prescreve capacidade de 2 " + (g ? "kg" : "litros") + " (3.1 a/b).");
      var tE = num(P.tEst), hE = num(P.hEst);
      if (ok(tE) && Math.abs(tE - 105) > 5) avisos.push("Secagem do recipiente a " + fmt(tE, 0) + " °C — estufa aquecida a 105 °C (4.5.4).");
      if (ok(hE) && hE < 12) avisos.push("Secagem do recipiente por " + fmt(hE, 0) + " h — 12 horas (4.5.4).");
      if (g) {
        var pn = num(P.penet);
        if (ok(pn) && pn < 175 && P.variacao !== "sim") avisos.push("Graxa com penetração " + fmt(pn, 0) + " (< 175): a amostra composta por transposição de vasilhame não é satisfatória (4.4.9).");
        if (P.variacao === "sim") avisos.push("Com diferença no mesmo recipiente, retirar 2 amostras de cerca de 1,0 kg (superfície junto às paredes e centro a 10 cm); com variação entre recipientes, amostras separadas de cada um, enviadas separadamente com essa indicação no rótulo (4.4.6 a 4.4.8).");
      }
      var falta = ID.filter(function (x) { return !String(P[x[0]] || "").trim(); }).map(function (x) { return x[1]; });
      if (falta.length) avisos.push("Ficha de identificação sem: " + falta.join("; ") + " (5).");
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
      return '<div class="fe-res">' + cx(r.nRec + " / " + (ok(r.nReq) ? r.nReq : "—"), "Recipientes amostrados / " + (r.t2 ? "Tabela 2" : "Tabela 1") + " · " + st) +
        cx(fmt(r.q, 2) + " <small>" + (r.g ? "kg" : "L") + "</small>", "Amostra coletada (mínimo 2 " + (r.g ? "kg" : "L") + ")") + cx(c.feitos + " / " + c.total, "Procedimentos confirmados") + "</div>";
    },
    relatorio: {
      notas: "Coleta conforme a DNER-PRO 103/94. Tabela 1 (total → recipientes amostrados): 1–3 todos; 4–64 → 4; 65–125 → 5; 126–216 → 6; 217–343 → 7; 344–512 → 8; 513–729 → 9; 730–1 000 → 10. Tabela 2 (graxa): as faixas da norma se sobrepõem (1 a 25 e 1 a 75 tambores; 1 a 250 e 1 a 1 050 baldes) — a ficha usa a faixa mais estreita: até 25 tambores, 2 kg de 1 ou mais; 26 a 75, 1,0 a 2,5 kg de 2 ou mais; mais de 75, 1,0 a 2,5 kg de 3 ou mais; até 250 baldes, 2,0 kg de 1 ou mais; 251 a 1 050, 1,0 a 2,5 kg de 2 ou mais. Amostra mínima 2 L de óleo ou 2 kg de graxa (3.2.1); repouso de 48 h (4.1.2); recipiente de 2 L/2 kg sem rolha de borracha; secagem a 105 °C por 12 h (4.5.4). Critérios da ficha: 30 ± 10 cm; 15 e 10 ± 5 cm.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {};
        return [["Produto", (P.codigo || "—") + " · " + (P.nTot || "—") + " recipientes"], ["Recipientes amostrados", r.nRec + " (" + (r.t2 ? "Tabela 2: " + r.t2.txt : "Tabela 1: " + (ok(r.nReq) ? r.nReq : "—")) + ")"],
          ["Amostra coletada", fmt(r.q, 2) + (r.g ? " kg" : " L")], ["Verificações", r.nAvisos ? r.nAvisos + " aviso(s)" : "sem avisos"]];
      },
    },
    exemplos: [
      { nome: "Óleo ML-30 — 90 tambores, 5 amostrados", dados: function () {
        var rec = [];
        for (var i = 0; i < 5; i++) rec.push({ id: "Tambor " + [7, 23, 41, 66, 88][i], p1: "30", fundo: "sim", q: "0,5" });
        return { ident: { registro: "EX-OG-001", data: "2025-02-24", obra: "Obra A", origem: "Fornecedor A", camada: "Óleo lubrificante de motor" },
          params: { produto: "oleo", embalagem: "tambor", codigo: "ML-30 — Fabricante A", nTot: "90", finalidade: "agua", repouso: "72", recip: "vidro", capRec: "2", tEst: "105", hEst: "12",
            iNat: "Óleo lubrificante", iMarca: "Marca M", iCod: "ML-30", iFim: "Recebimento — ensaios de aceitação", iQtd: "2,5 L", iFab: "Fabricante A", iData: "24/02/2025 — depósito da Obra A", iResp: "Técnico A",
            chkAcaso: "sim", chkLav: "sim", chkMao: "sim", chkLimpo: "sim", chkHerm: "sim" },
          rec: rec };
      } },
      { nome: "Graxa em 120 tambores — poucos tambores, rolha de borracha, penetração baixa", dados: function () {
        return { ident: { registro: "EX-OG-002", data: "2025-06-30", obra: "Obra B", origem: "Fornecedor B", camada: "Graxa lubrificante" },
          params: { produto: "graxa", embalagem: "tambor", codigo: "GL-2 — Fabricante B", nTot: "120", recip: "borracha", capRec: "2", tEst: "105", hEst: "6", penet: "160", variacao: "nao",
            iNat: "Graxa lubrificante", iMarca: "Marca N", iCod: "", iFim: "Recebimento", iQtd: "1,8 kg", iFab: "Fabricante B", iData: "30/06/2025", iResp: "Técnico B",
            chkAcaso: "sim", chkExame: "sim", chkComp: "sim", chkLimpo: "sim", chkHerm: "nao" },
          rec: [{ id: "Tambor 12", pEx: "15", pCol: "10", aspecto: "Homogênea, lisa", q: "0,9" }, { id: "Tambor 80", pEx: "15", pCol: "25", aspecto: "Homogênea", q: "0,9" }] };
      } },
    ],
  };
})();
