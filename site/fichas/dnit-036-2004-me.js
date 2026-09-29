/*
 * Ficha: DNIT 036/2004-ME — Pavimento rígido — Água para amassamento do concreto — Ensaios químicos.
 * Resíduo sólido, matéria orgânica (oxigênio consumido), pH, sulfatos (SO4) e cloretos (Cl), comparados
 * com os limites da especificação de serviço (DNIT 047/048/065/068-ES, 5.1.3, ou DNIT 117/2009-ES, 7.1.3).
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  // limites das especificações (a DNIT 036 só dá os métodos)
  var LIMITES = {
    "047": { nome: "DNIT 047/048/065/068-2004-ES (5.1.3)", phMin: 5, phMax: 8, mo: 3, res: 5000, so4: 600, cl: 1000, acucar: 5 },
    "117": { nome: "DNIT 117/2009-ES (7.1.3) — concreto armado ou protendido", phMin: 5.8, phMax: 8, mo: 3, res: 5000, so4: 300, cl: 500, acucar: 500 },
  };
  // valores usados quando a célula fica vazia (volumes e fatores da própria norma)
  var PAD = { vRes: 500, vMO: 100, t: 0.1, vS: 1000, vC: 200, f: 1, F: 1, Q: 0.00035453 };
  function v(x, k) { var n = num(x[k]); return ok(n) ? n : PAD[k]; }
  function r0(x) { return ok(x) ? Math.round(x) : NaN; }
  function r1(x) { return ok(x) ? Math.round(x * 10) / 10 : NaN; }

  var ITENS = [
    { k: "ph", r: "pH (5.3)", u: "", casas: 1 },
    { k: "mo", r: "Matéria orgânica — oxigênio consumido (5.2)", u: "mg/l", casas: 1 },
    { k: "res", r: "Resíduo sólido (5.1)", u: "mg/l", casas: 0 },
    { k: "so4", r: "Sulfatos, em íons SO4 (5.4)", u: "mg/l", casas: 0 },
    { k: "cl", r: "Cloretos, em íons Cl (5.5)", u: "mg/l", casas: 0 },
    { k: "acucar", r: "Açúcar (outro método — não coberto pela DNIT 036)", u: "mg/l", casas: 0 },
  ];

  FE.FICHAS["dnit-036-2004-me"] = {
    titulo: "Água de amassamento do concreto — Ensaios químicos",
    rotuloImportar: function (r) { return (r.am || []).length + " amostra(s)" + ((r.am || []).some(function (o) { return o.atende === false; }) ? " · há amostra fora dos limites" : (r.am || []).some(function (o) { return o.atende === true; }) ? " · atende(m)" : ""); },
    resumo: "Resíduo sólido = G / 0,5 (mg/l); oxigênio consumido pelo permanganato 0,0125 N (mg/l); pH eletrométrico (0,1); sulfatos = 0,414·G / V × 10⁶ (mg/l SO4); cloretos = (A·f − B·F)·Q / V × 10⁶ (mg/l Cl). Resultados comparados com os limites da especificação de serviço.",
    blocos: [],
    params: [
      { k: "origem", r: "Procedência da água", ph: "ex.: poço tubular, rede pública, açude" },
      { k: "coleta", r: "Coleta (NBR 12654) — data e responsável", ph: "dd/mm/aaaa" },
      { k: "espec", r: "Limites de aceitação", tipo: "select",
        opcoes: [["047", "DNIT 047/048/065/068-ES — pavimento de concreto (pH 5 a 8; SO4 ≤ 600; Cl ≤ 1000 mg/l)"],
          ["117", "DNIT 117/2009-ES — concreto armado/protendido (pH 5,8 a 8; SO4 ≤ 300; Cl ≤ 500 mg/l)"],
          ["nenhum", "Não comparar"]],
        dica: "a DNIT 036 não fixa limites; eles vêm da especificação de serviço" },
    ],
    padrao: { espec: "047" },
    tabelas: function () {
      return [{
        chave: "am", titulo: "Amostras de água", rotulo: "Amostra", iniciais: 1, min: 1,
        dica: "uma coluna por amostra; células vazias de volume e fator usam os valores da norma (indicados em cinza)",
        linhas: [
          { k: "id", r: "Identificação da amostra", texto: true },
          { grupo: "Resíduo sólido (5.1) — evaporação e estufa a 125 ± 5 °C por 1 h" },
          { k: "vRes", r: "Volume da amostra evaporada", u: "ml", ph: "500" },
          { k: "cap", r: "Cápsula vazia (tarada)", u: "g" },
          { k: "capR", r: "Cápsula + resíduo", u: "g" },
          { calc: "G", r: "Massa de resíduo (G)", u: "mg", casas: 1 },
          { calc: "res", r: "Resíduo sólido = G / 0,5 (5.1 f)", u: "mg/l", casas: 0, destaque: true },
          { grupo: "Matéria orgânica — oxigênio consumido (5.2)" },
          { k: "vMO", r: "Volume da amostra (diluída a 100 cm³, se preciso — 5.2.2 e)", u: "cm³", ph: "100" },
          { k: "t", r: "Equivalente em oxigênio do KMnO4 0,0125 N (t)", u: "mg/cm³", ph: "0,1" },
          { k: "rA", r: "KMnO4 na titulação por retorno — amostra (5.2.2 c)", u: "cm³" },
          { k: "rB", r: "KMnO4 na titulação por retorno — branco (5.2.2 d)", u: "cm³" },
          { k: "rC", r: "KMnO4 a frio — correção de minerais redutores (5.2.2 f)", u: "cm³", ph: "0" },
          { calc: "V", r: "V = 10 cm³ + retorno — amostra", u: "cm³", casas: 2 },
          { calc: "V1", r: "V1 = 10 cm³ + retorno — branco", u: "cm³", casas: 2 },
          { calc: "mo", r: "Oxigênio consumido = t·(V − V1)·1000 / Va", u: "mg/l", casas: 1, destaque: true },
          { grupo: "pH (5.3) — potenciômetro calibrado com soluções-tampão" },
          { k: "phL", r: "pH lido", u: "" },
          { k: "tph", r: "Temperatura da amostra", u: "°C" },
          { calc: "ph", r: "pH — aproximação de 0,1 (5.3 d)", u: "", casas: 1, destaque: true },
          { grupo: "Sulfatos (5.4) — precipitação como BaSO4, calcinação a 800–900 °C" },
          { k: "vS", r: "Volume da amostra (V)", u: "ml", ph: "1000" },
          { k: "cad", r: "Cadinho vazio (tarado)", u: "g" },
          { k: "cadP", r: "Cadinho + precipitado calcinado", u: "g" },
          { calc: "Gs", r: "Massa de BaSO4 (G)", u: "g", casas: 4 },
          { calc: "so4", r: "Sulfatos = 0,414·G / V × 10⁶ (5.4.3)", u: "mg/l", casas: 0, destaque: true },
          { grupo: "Cloretos (5.5) — método de Volhard" },
          { k: "vC", r: "Volume da amostra (V)", u: "cm³", ph: "200" },
          { k: "A", r: "Nitrato de prata 0,01 N adicionado (A)", u: "cm³" },
          { k: "f", r: "Fator do nitrato de prata (f)", u: "", ph: "1" },
          { k: "B", r: "Tiocianato de amônio 0,01 N na titulação (B)", u: "cm³" },
          { k: "F", r: "Fator do tiocianato (F)", u: "", ph: "1" },
          { k: "Q", r: "Equivalente em Cl da solução de AgNO3 (Q)", u: "g/ml", ph: "0,00035453" },
          { calc: "cl", r: "Cloretos = (A·f − B·F)·Q / V × 10⁶ (5.5.3)", u: "mg/l", casas: 0, destaque: true },
          { grupo: "Outras determinações (fora da DNIT 036)" },
          { k: "acucar", r: "Açúcar — opcional", u: "mg/l" },
        ],
      }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], L = LIMITES[P.espec] || null;
      var am = (d.am || []).map(function (x, i) {
        var rot = "Amostra " + (x.id || i + 1), o = { nome: String(x.id || i + 1) };
        // resíduo sólido
        var cap = num(x.cap), capR = num(x.capR), vRes = v(x, "vRes");
        if (ok(cap) && ok(capR)) {
          o.G = (capR - cap) * 1000;
          o.res = o.G / (vRes / 1000);  // = G / 0,5 com 500 ml
          if (o.G < 0) avisos.push(rot + ": massa da cápsula com resíduo menor que a da cápsula vazia — confira.");
          if (ok(num(x.vRes)) && Math.abs(vRes - 500) > 0.5) avisos.push(rot + ": resíduo sólido com " + fmt(vRes, 0) + " ml — a norma mede 500 ml (5.1 a); o cálculo usou G / (V/1000).");
        }
        // matéria orgânica
        var rA = num(x.rA), rB = num(x.rB), rC = ok(num(x.rC)) ? num(x.rC) : 0, t = v(x, "t"), Va = v(x, "vMO");
        if (ok(rA) && ok(rB)) {
          o.V = 10 + rA; o.V1 = 10 + rB;
          o.mo = t * (o.V - o.V1 - rC) * 1000 / Va;
          if (rA >= 5) avisos.push(rot + ": " + fmt(rA, 2) + " cm³ de KMnO4 na titulação por retorno — deve ser menor que 5 cm³; repita com menor volume de amostra diluído a 100 cm³ (5.2.2 e).");
          if (rB > rA) avisos.push(rot + ": o branco consumiu mais permanganato que a amostra — confira os reagentes (5.2.1 a).");
        }
        // pH
        var ph = num(x.phL);
        if (ok(ph)) {
          o.ph = r1(ph);
          if (ph < 4.5 || ph > 8.5) avisos.push(rot + ": pH " + fmt(ph, 1) + " fora da faixa do potenciômetro especificado (4,5 a 8,5 — 3.3); confira a calibração com soluções-tampão que envolvam o valor.");
        }
        // sulfatos
        var cad = num(x.cad), cadP = num(x.cadP), vS = v(x, "vS");
        if (ok(cad) && ok(cadP)) {
          o.Gs = cadP - cad;
          o.so4 = 0.414 * o.Gs / vS * 1e6;
          if (o.Gs < 0) avisos.push(rot + ": massa do cadinho com precipitado menor que a do cadinho vazio — confira.");
        }
        // cloretos
        var A = num(x.A), B = num(x.B), f = v(x, "f"), F = v(x, "F"), Q = v(x, "Q"), vC = v(x, "vC");
        if (ok(A) && ok(B)) {
          o.cl = (A * f - B * F) * Q / vC * 1e6;
          if (A * f - B * F < 0) avisos.push(rot + ": tiocianato maior que o nitrato de prata adicionado — confira as leituras e os fatores.");
          else if (B * F < 0.1 * A * f) avisos.push(rot + ": quase todo o nitrato de prata foi consumido (excesso de " + fmt(B * F, 2) + " cm³) — o excesso pode ter sido insuficiente; repita com mais AgNO3 (5.5.2 b).");
        }
        o.acucar = num(x.acucar);
        // arredondamentos dos resultados
        o.resR = r0(o.res); o.moR = r1(o.mo); o.so4R = r0(o.so4); o.clR = r0(o.cl);
        // comparação com os limites
        o.sit = {};
        if (L) {
          var falhas = [];
          if (ok(o.ph)) { o.sit.ph = o.ph >= L.phMin && o.ph <= L.phMax; if (!o.sit.ph) falhas.push("pH " + fmt(o.ph, 1) + " (entre " + fmt(L.phMin, 1) + " e " + fmt(L.phMax, 1) + ")"); }
          [["mo", "moR", "matéria orgânica", 1], ["res", "resR", "resíduo sólido", 0], ["so4", "so4R", "sulfatos", 0], ["cl", "clR", "cloretos", 0], ["acucar", "acucar", "açúcar", 0]].forEach(function (q) {
            var val = o[q[1]];
            if (!ok(val)) return;
            o.sit[q[0]] = val <= L[q[0]];
            if (!o.sit[q[0]]) falhas.push(q[2] + " " + fmt(val, q[3]) + " mg/l (máx. " + fmt(L[q[0]], 0) + ")");
          });
          if (falhas.length) avisos.push(rot + ": não atende a " + L.nome + " — " + falhas.join("; ") + ". Em caso de dúvida, fazer os ensaios comparativos da DNIT 037/2004-ME.");
          var vals = Object.keys(o.sit);
          o.atende = vals.length ? vals.every(function (k) { return o.sit[k]; }) : null;
        }
        return o;
      });
      if (L) am.forEach(function (o, i) {
        if (o.atende === null) return;
        var falta = ["ph", "mo", "res", "so4", "cl"].filter(function (k) { return o.sit[k] === undefined; });
        if (falta.length) avisos.push("Amostra " + o.nome + ": sem resultado de " + falta.map(function (k) { return { ph: "pH", mo: "matéria orgânica", res: "resíduo sólido", so4: "sulfatos", cl: "cloretos" }[k]; }).join(", ") + " — a aceitação exige todas as determinações.");
      });
      return { tab: { am: am }, resultados: { am: am, L: L }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, L = r.L;
      if (!r.am.length) return "";
      function lim(k) {
        if (!L) return "";
        if (k === "ph") return fmt(L.phMin, 1) + " a " + fmt(L.phMax, 1);
        return "≤ " + fmt(L[k], 0);
      }
      var cab = "<tr><th>Determinação</th><th>Unid.</th>" + r.am.map(function (o) { return "<th>Amostra " + esc(o.nome) + "</th>"; }).join("") + (L ? "<th>Limite</th>" : "") + "</tr>";
      var linhas = ITENS.map(function (it) {
        var key = { ph: "ph", mo: "moR", res: "resR", so4: "so4R", cl: "clR", acucar: "acucar" }[it.k];
        if (!r.am.some(function (o) { return ok(o[key]); })) return "";
        return "<tr><td>" + esc(it.r) + "</td><td>" + esc(it.u) + "</td>" + r.am.map(function (o) {
          var s = o.sit[it.k];
          return "<td><b>" + fmt(o[key], it.casas) + "</b>" + (s === undefined ? "" : s ? ' <span class="fe-ok">✓</span>' : ' <span class="fe-nok">✗</span>') + "</td>";
        }).join("") + (L ? "<td>" + lim(it.k) + "</td>" : "") + "</tr>";
      }).join("");
      var sit = L ? '<div class="fe-res">' + r.am.map(function (o) {
        return '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + (o.atende === null ? "—" : o.atende ? '<span class="fe-ok">atende</span>' : '<span class="fe-nok">não atende</span>') +
          '</div><div class="fe-res-r">Amostra ' + esc(o.nome) + " — " + esc(L.nome) + "</div></div>";
      }).join("") + "</div>" : "";
      return '<table class="fe-resumo"><thead>' + cab + "</thead><tbody>" + linhas + "</tbody></table>" + sit;
    },
    relatorio: {
      notas: "Resíduo sólido = G / 0,5, com G em mg de resíduo de 500 ml evaporados e secos a 125 ± 5 °C por 1 h (5.1). Oxigênio consumido: 100 cm³ de amostra + 10 cm³ de KMnO4 0,0125 N + 10 cm³ de H2SO4 (1:3), 30 min em banho-maria fervente, 10 cm³ de ácido oxálico 0,0125 N e titulação por retorno a 60–80 °C (5.2.2); retorno menor que 5 cm³ (5.2.2 e). A norma imprime \"10t / (V − V1)\" (5.2.3, p. 4), dimensionalmente incoerente: a ficha usa t·(V − V1)·1000 / Va (= 10·t·(V − V1) para Va = 100 cm³), descontada a correção a frio de minerais redutores (5.2.2 f). pH com aproximação de 0,1 (5.3 d). Sulfatos = 0,414·G / V × 10⁶, G = BaSO4 calcinado em g, V em ml (5.4.3). Cloretos = (A·f − B·F)·Q / V × 10⁶ (5.5.3); Q = 0,01 × 35,453 / 1000 = 0,00035453 g de Cl por ml de AgNO3 0,01 N. Limites: DNIT 047/048/065/068-2004-ES, 5.1.3 (pH 5 a 8; oxigênio consumido 3; resíduo 5000; SO4 600; Cl 1000; açúcar 5 mg/l) ou DNIT 117/2009-ES, 7.1.3 (pH 5,8 a 8,0; 3; 5000; 300; 500; 500 mg/l). Casos duvidosos: ensaios comparativos da DNIT 037/2004-ME.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.origem) rows.push(["Procedência", P.origem]);
        r.am.forEach(function (o) {
          var partes = [];
          if (ok(o.ph)) partes.push("pH " + fmt(o.ph, 1));
          if (ok(o.moR)) partes.push("O2 consumido " + fmt(o.moR, 1) + " mg/l");
          if (ok(o.resR)) partes.push("resíduo " + fmt(o.resR, 0) + " mg/l");
          if (ok(o.so4R)) partes.push("SO4 " + fmt(o.so4R, 0) + " mg/l");
          if (ok(o.clR)) partes.push("Cl " + fmt(o.clR, 0) + " mg/l");
          if (ok(o.acucar)) partes.push("açúcar " + fmt(o.acucar, 0) + " mg/l");
          rows.push(["Amostra " + o.nome, partes.join("; ") + (r.L && o.atende !== null ? (o.atende ? " — ATENDE" : " — NÃO ATENDE") : "")]);
        });
        if (r.L) rows.push(["Limites", r.L.nome + ": pH " + fmt(r.L.phMin, 1) + " a " + fmt(r.L.phMax, 1) + "; O2 ≤ " + r.L.mo + "; resíduo ≤ " + fmt(r.L.res, 0) + "; SO4 ≤ " + r.L.so4 + "; Cl ≤ " + fmt(r.L.cl, 0) + "; açúcar ≤ " + r.L.acucar + " mg/l"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Poço tubular e rede pública — atendem à DNIT 047-ES", dados: function () {
        // valores-alvo: resíduo 367 e 212 mg/l; O2 1,5 e 0,8 mg/l; pH 6,8 e 7,3; SO4 29 e 12 mg/l; Cl 14 e 8 mg/l
        return { ident: { registro: "EX-AG-001", obra: "Obra A", trecho: "BR-000", local: "Central de concreto da Obra A", camada: "Água de amassamento — pavimento de concreto", data: "2025-04-08" },
          params: { origem: "Poço tubular da central (1) e rede pública (2)", coleta: "07/04/2025", espec: "047" },
          am: [
            { id: "1 — poço", vRes: "500", cap: "52,3184", capR: "52,5021", vMO: "100", t: "0,1", rA: "1,85", rB: "0,35", phL: "6,82", tph: "24",
              vS: "1000", cad: "18,4502", cadP: "18,5214", vC: "200", A: "10,00", f: "1,000", B: "2,10", F: "1,002", Q: "0,00035453" },
            { id: "2 — rede", vRes: "500", cap: "49,8870", capR: "49,9930", vMO: "100", t: "0,1", rA: "1,15", rB: "0,35", phL: "7,28", tph: "24",
              vS: "1000", cad: "17,9921", cadP: "18,0211", vC: "200", A: "10,00", f: "1,000", B: "5,48", F: "1,002", Q: "0,00035453" }] };
      } },
      { nome: "Água de açude — reprovada (pH, O2, resíduo e sulfatos); retorno de KMnO4 ≥ 5 cm³", dados: function () {
        return { ident: { registro: "EX-AG-002", obra: "Obra B", local: "Açude próximo ao canteiro", camada: "Água de amassamento — estudo de fonte alternativa", data: "2025-07-15" },
          params: { origem: "Açude (captação superficial)", coleta: "14/07/2025", espec: "047" },
          am: [{ id: "Açude", vRes: "500", cap: "49,1020", capR: "51,8710", vMO: "100", t: "0,1", rA: "5,60", rB: "0,40", rC: "0,20", phL: "4,9", tph: "26",
            vS: "1000", cad: "20,1000", cadP: "21,7200", vC: "200", A: "40,00", f: "0,998", B: "12,30", F: "1,005", Q: "0,00035453", acucar: "0" }] };
      } },
    ],
  };
})();
