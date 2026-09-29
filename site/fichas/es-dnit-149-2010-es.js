/*
 * Ficha de ACEITAÇÃO DE LOTE: DNIT 149/2010-ES — Macadame betuminoso com ligante asfáltico convencional por penetração.
 * Motor comum do grupo: FE.aceitacaoG4a (site/fichas/es-dnit-144-2014-es.js).
 *   5.1.1 CAP 85-100 / 150-200 ou RR-2C · 5.1.3 agregado: LA ≤ 40 % (7.1.2: ensaiado quando houver dúvida), índice de forma > 0,5,
 *   durabilidade < 12 %, granulometria nas faixas das Tabelas 1 (CAP) e 2 (emulsão) do Anexo A (normativo)
 *   Tabela 1 (CAP): uma aplicação de ligante por faixa (A 7,9–10,0; B 5,6–7,9; C 4,5–6,8; D 3,4–5,4), tolerância ± 0,3; agregado
 *   1ª/2ª camada em kg/m² (A 190–217/19–27; B 136–163/14–22; C 109–136/11–19; D 81–109/8–14), sem tolerância ("-")
 *   Tabela 2 (emulsão, 65 % de resíduo — Nota): 1ª e 2ª aplicação (A 6,8–8,1/5,4–6,8; B 4,5–6,8/5,4–6,8; C 4,5–5,4/5,4–6,8;
 *   D 4,1–5,0/3,2–4,5; E 3,2–4,1/3,6–4,5 l/m²); agregado 195/171/146/123/98 kg/m² (1ª) e 16 kg/m² (2ª); sem tolerâncias
 *   7.2.2 taxas por bandeja (tolerâncias das Tabelas 1 e 2); mín. 5 por segmento < 3.000 m² · 7.3 réguas ≤ 0,5 cm, alinhamento
 *   ± 5 cm, espessura ± 10 % · 7.5 X̄ ± k·s (k "tabelado" — adotada a Tabela 1 da DNER-PRO 277/97)
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG4a, num = FE.num, ok = FE.ok, fmt = FE.fmt, media = FE.media;
  if (!G) { if (window.console) console.error("es-dnit-149-2010-es.js: carregue antes site/fichas/es-dnit-144-2014-es.js (motor FE.aceitacaoG4a)."); return; }
  var V = G.verif, B = G.bandejas, EPS = 1e-9;

  // Anexo A — Tabela 1 (CAP): [ligante mín, máx, agregado 1ª mín, máx, agregado 2ª mín, máx, espessura mín, máx]
  var T1 = { A: [7.9, 10.0, 190, 217, 19, 27, 9.0, 10.0], B: [5.6, 7.9, 136, 163, 14, 22, 6.5, 7.5], C: [4.5, 6.8, 109, 136, 11, 19, 5.0, 6.5], D: [3.4, 5.4, 81, 109, 8, 14, 4.0, 5.0] };
  // Anexo A — Tabela 2 (emulsão com 65 % de resíduo): [1ª mín, máx, 2ª mín, máx, agregado 1ª, agregado 2ª, espessura, total mín, máx]
  var T2 = { A: [6.8, 8.1, 5.4, 6.8, 195, 16, 10.0, 12.2, 14.9], B: [4.5, 6.8, 5.4, 6.8, 171, 16, 9.0, 9.9, 13.2], C: [4.5, 5.4, 5.4, 6.8, 146, 16, 7.5, 9.9, 12.2],
    D: [4.1, 5.0, 3.2, 4.5, 123, 16, 6.5, 7.3, 9.5], E: [3.2, 4.1, 3.6, 4.5, 98, 16, 5.0, 6.8, 8.6] };
  var PRE = "dnit-149-2010-es-";
  function emu(P) { return P.ligante === "rr2c"; }
  function letra(P) {
    var m = /-(cap|emulsao)-([A-F])-1$/.exec(P.faixa1 || "");
    return m ? m[2] : emu(P) ? "A" : "A";
  }
  function residuo(P, d) { return media(((d || {}).rec || []).map(function (x) { return num(x.res); }).filter(ok)); }
  var dAtual = null;  // dados do cálculo em curso (a correção da Nota da Tabela 2 usa o resíduo dos carregamentos)

  G.criar({
    id: "dnit-149-2010-es", codigo: "DNIT 149/2010-ES",
    titulo: "Macadame betuminoso por penetração — aceitação de lote",
    resumo: "Reúne as taxas de ligante e de agregado por bandeja (1ª e 2ª camadas), o recebimento do ligante, a granulometria e a qualidade do agregado, as temperaturas e o controle do produto " +
      "(réguas, alinhamento e espessura ± 10 %); aplica 7.5 com as faixas e tolerâncias das Tabelas 1 e 2 do Anexo A e confere as frequências.",
    refs: { reprova: "7.5 b", atende: "7.5 a", corrige: "7.5", regra: "7.5", tabela: "Tabela 1 da DNER-PRO 277/97" },
    secConf: "7.5", secPlano: "7.4", secLig: "5.1.1", secTaxa: "7.2.2 a", secTaxaAgr: "7.2.2 b", secTemp: "7.2.1", secReceb: "7.1.1", secReceb100: "7.1.1",
    servicos: [],
    ligantes: [
      { id: "cap", nome: "CAP 85-100 ou 150-200 (DNIT 095/2006-EM)", classes: ["85/100", "150/200"], taxaLig: ["cap"],
        ens: [["pen", "penetração a 25 °C"], ["sf135", "viscosidade Saybolt-Furol a 135 °C"], ["espuma", "espuma"], ["ist", "índice de suscetibilidade térmica"]] },
      { id: "rr2c", nome: "Emulsão RR-2C (DNER-EM 369/97)", classes: ["RR-2C"], taxaLig: ["rr2c"], resMin: 67,
        ens: [["residuo|solv", "resíduo de destilação (NBR 6568)"], ["pen084", "peneiramento"], ["desem", "desemulsibilidade"], ["carga", "carga da partícula"]] },
    ],
    recebFichas: ["dnit-095-2006-em", "dnit-165-2013-em"], nomeResiduo: "resíduo da emulsão (a Tabela 2 refere-se a 65 %)",
    maxLig: 2, maxAgr: 2, nLig: function (P) { return emu(P) ? 2 : 1; }, nAgr: function () { return 2; },
    nomeLig: function (c, P) { return emu(P) ? "Emulsão — " + c + "ª aplicação" : "CAP — aplicação única"; },
    nomeAgr: function (c) { return c + "ª camada"; },
    nomeTaxaLig: function (P) { return emu(P) ? "taxa da emulsão" : "taxa do CAP"; },
    limLig: function (P, c) {
      var f = letra(P), pj = num(P["projL" + c]), o = { sec: "Anexo A, Tabela " + (emu(P) ? "2" : "1") + " / 7.2.2 a", avisos: [] };
      var tol = emu(P) ? (ok(num(P.tolEmu)) ? num(P.tolEmu) : 0.3) : 0.3;
      o.min = ok(pj) ? pj - tol : NaN; o.max = ok(pj) ? pj + tol : NaN;
      o.txt = ok(pj) ? fmt(pj - tol, 2) + " a " + fmt(pj + tol, 2) + " l/m² (projeto " + fmt(pj, 2) + " ± " + fmt(tol, 1) + ")" : "projeto ± " + fmt(tol, 1) + " l/m²";
      o.falta = "informe a taxa de ligante de projeto (" + (emu(P) ? c + "ª aplicação" : "aplicação única") + ")";
      var fx = emu(P) ? T2[f] : T1[f];
      if (fx && ok(pj)) {
        var r = emu(P) ? (c === 1 ? [fx[0], fx[1]] : [fx[2], fx[3]]) : [fx[0], fx[1]], res = residuo(P, dAtual), cor = emu(P) && ok(res) && res > 0 ? 65 / res : 1;
        var rc = [r[0] * cor, r[1] * cor];
        if (pj < rc[0] - EPS || pj > rc[1] + EPS) o.avisos.push("Taxa de ligante de projeto (" + (emu(P) ? c + "ª aplicação" : "aplicação única") + ") de " + fmt(pj, 2) + " l/m², fora de " + fmt(rc[0], 1) + " a " + fmt(rc[1], 1) +
          " l/m² da faixa " + f + " (Anexo A, Tabela " + (emu(P) ? "2" : "1") + (cor !== 1 ? ", corrigida para o resíduo de " + fmt(res, 1) + " % — Nota" : "") + ") — admissível se fixada no projeto e ajustada em trecho experimental (5.1.4).");
      }
      if (emu(P) && c === 1) o.avisos.push("Emulsão: a Tabela 2 do Anexo A não dá tolerância para a taxa de aplicação (7.2.2 a remete às Tabelas 1 e 2) — adotada ± " + fmt(tol, 1) + " l/m²" + (ok(num(P.tolEmu)) ? " (informada)" : ", por analogia com a Tabela 1") + ".");
      return o;
    },
    limAgr: function (P, c) {
      var f = letra(P), o = { sec: "Anexo A, Tabela " + (emu(P) ? "2" : "1") + " / 7.2.2 b", avisos: [] };
      if (emu(P)) {
        var t = T2[f], v = t ? (c === 1 ? t[4] : t[5]) : NaN;
        o.txt = ok(v) ? fmt(v, 0) + " kg/m² (Tabela 2, faixa " + (c === 1 ? f : "F") + ") — sem tolerância" : "Tabela 2";
        o.informativo = "a Tabela 2 dá um valor único (" + (ok(v) ? fmt(v, 0) + " kg/m²" : "—") + ") sem tolerância: média comparada só como informação";
        return o;
      }
      var mn = num(P["minA" + c]), mx = num(P["maxA" + c]), T = T1[f];
      if (!ok(mn) && T) mn = c === 1 ? T[2] : T[4];
      if (!ok(mx) && T) mx = c === 1 ? T[3] : T[5];
      o.min = mn; o.max = mx;
      o.txt = ok(mn) && ok(mx) ? fmt(mn, 0) + " a " + fmt(mx, 0) + " kg/m² (" + (ok(num(P["minA" + c])) ? "projeto" : "Tabela 1, faixa " + f) + ")" : "Tabela 1";
      return o;
    },
    params: [
      { k: "faixa1", r: "Faixa granulométrica — 1ª camada (Anexo A)", tipo: "select", recarrega: true,
        opcoes: function (d) { var e = emu((d || {}).params || {}); return (e ? ["A", "B", "C", "D", "E"] : ["A", "B", "C", "D"]).map(function (l) {
          var id = PRE + (e ? "emulsao-" : "cap-") + l + "-1", fx = G.faixaPorId(id); return [id, "Faixa " + l + (fx && fx.condicao ? " (" + fx.condicao + ")" : "")]; }); },
        dica: "a faixa define também as taxas recomendadas das Tabelas 1 e 2" },
      { k: "faixa2", r: "Faixa granulométrica — 2ª camada (Anexo A)", tipo: "select", recarrega: true,
        opcoes: function (d) { var e = emu((d || {}).params || {}); return e ? [[PRE + "emulsao-F-2", "Faixa F (2ª camada de todas as faixas da Tabela 2)"]] :
          ["A", "B", "C", "D"].map(function (l) { return [PRE + "cap-" + l + "-2", "Faixa " + l + " — 2ª camada"]; }); } },
      { k: "projL1", r: "Taxa de ligante de projeto — CAP (aplicação única) ou emulsão 1ª aplicação (l/m²)", ph: "ex.: 6,5", dica: "fixada no projeto e ajustada em trecho experimental (5.1.4 a)" },
      { k: "projL2", r: "Taxa de emulsão de projeto — 2ª aplicação (l/m²)", se: function (d) { return emu((d || {}).params || {}); } },
      { k: "tolEmu", r: "Tolerância da taxa de emulsão (l/m²) — a Tabela 2 não fixa", ph: "0,3", se: function (d) { return emu((d || {}).params || {}); } },
      { k: "minA1", r: "Agregado 1ª camada — mínimo de projeto (kg/m²) — opcional", se: function (d) { return !emu((d || {}).params || {}); }, dica: "vazio = faixa da Tabela 1" },
      { k: "maxA1", r: "Agregado 1ª camada — máximo de projeto (kg/m²) — opcional", se: function (d) { return !emu((d || {}).params || {}); } },
      { k: "minA2", r: "Agregado 2ª camada — mínimo de projeto (kg/m²) — opcional", se: function (d) { return !emu((d || {}).params || {}); } },
      { k: "maxA2", r: "Agregado 2ª camada — máximo de projeto (kg/m²) — opcional", se: function (d) { return !emu((d || {}).params || {}); } },
    ],
    padrao: { ligante: "cap", faixa1: PRE + "cap-B-1", faixa2: PRE + "cap-B-2", nCarreg: "1", nAplic: "1", jornadas: "1", laDesemp: "nao" },
    freqTaxa: { tipo: "3000", sec: "7.2.2 b" },
    agregado: { laMax: 40, laExige: false, laNaoExige: "7.1.2: Los Angeles só quando houver dúvidas ou variação da origem e natureza do material", secLA: "5.1.3 a / 7.1.2", secIF: "5.1.3 b",
      secDur: "5.1.3 c", secGran: "5.1.3 d / 7.1.2", secAdes: "5.1.2 / 7.1.2", secMelh: "5.1.2 / 7.1.3", secFreq: "7.1.2", secQual: "5.1.3", tabGran: "1/2 do Anexo A" },
    produto: { regua: "7.3.1", alinh: "7.3.2", esp: "7.3.3" },
    verif: [
      { id: "cert", texto: "Certificado do fabricante/distribuidor em cada carregamento", secao: "4 b", exigido: "certificado com os ensaios de caracterização" },
      { id: "e100", texto: "Ensaios a cada 100 t: Saybolt-Furol a diferentes temperaturas (relação viscosidade × temperatura)", secao: "7.1.1", exigido: "1 a cada 100 t",
        freq: function (P) { var t = num(P.ton); return { exigido: ok(t) ? A.nMin(t, 100) : NaN, regra: "1 a cada 100 t" }; }, metodo: "DNER-ME 004" },
      { id: "melh", texto: "Adesividade do asfalto aditivado — a cada incorporação e antes da aplicação (se houver melhorador)", secao: "7.1.3", exigido: "satisfatória (DNER-ME 078)", opcional: true,
        naoRegistrado: "exigido só quando se usa melhorador de adesividade" },
      { id: "exec", texto: "Execução: ligante sobre superfície seca, compressão até o mínimo de passadas do trecho experimental, juntas com papel, controle do tráfego", secao: "5.3", exigido: "conforme 5.3" },
    ],
    extra: function (ctx) {
      var P = ctx.P, f = letra(P), ep = num(P.espProj), t = emu(P) ? T2[f] : T1[f];
      if ((/emulsao/.test(P.faixa1 || "") && !emu(P)) || (/-cap-/.test(P.faixa1 || "") && emu(P)))
        ctx.avisos.push("A faixa escolhida é da Tabela " + (emu(P) ? "1 (CAP)" : "2 (emulsão)") + ", mas o ligante é " + (emu(P) ? "emulsão" : "CAP") + ": escolha a faixa da tabela do ligante (5.1.3 d).");
      if (ok(ep) && t) {
        var e0 = emu(P) ? t[6] : t[6], e1 = emu(P) ? t[6] : t[7];
        if (ep < e0 - EPS || ep > e1 + EPS) ctx.avisos.push("Espessura de projeto de " + fmt(ep, 1) + " cm, diferente da indicada para a faixa " + f + " (" + (e0 === e1 ? fmt(e0, 1) : fmt(e0, 1) + " a " + fmt(e1, 1)) + " cm, Anexo A).");
      }
      if (emu(P)) {
        var l1 = ctx.linhas.filter(function (l) { return l.id === "lig1"; })[0], l2 = ctx.linhas.filter(function (l) { return l.id === "lig2"; })[0];
        if (l1 && l2 && l1.n && l2.n && t) {
          var tot = l1.media + l2.media, res = residuo(P, ctx.d), cor = ok(res) && res > 0 ? 65 / res : 1;
          var lt = A.linha({ id: "totEmu", grupo: "Taxa de aplicação do ligante e de espalhamento do agregado", criterio: "Total de emulsão (1ª + 2ª aplicação, médias)", secao: "Anexo A, Tabela 2",
            unid: "l/m²", casas: 2, n: l1.n + l2.n, media: tot, exigido: fmt(t[7] * cor, 1) + " a " + fmt(t[8] * cor, 1) + " l/m² (faixa " + f + (cor !== 1 ? ", corrigido para " + fmt(res, 1) + " % de resíduo" : "") + ")" });
          lt.resultado = fmt(tot, 2) + " l/m²";
          if (tot < t[7] * cor - EPS || tot > t[8] * cor + EPS) A.marcar(lt, "ressalva", "total médio de " + fmt(tot, 2) + " l/m² fora do recomendado para a faixa " + f + " (Tabela 2) — conferir o projeto");
          else lt.motivo = "total médio de " + fmt(tot, 2) + " l/m² dentro do recomendado";
          ctx.linhas.splice(ctx.linhas.indexOf(l2) + 1, 0, lt);
        }
      }
    },
    notas: "Taxas por bandeja de peso e área conhecidos (7.2.2): ligante (CAP em aplicação única, 5.3.1; emulsão em duas aplicações, 5.3.2 d) e agregado da 1ª e da 2ª camada. " +
      "Aceitação: CAP — taxa de projeto ± 0,3 (Tabela 1); agregado — faixa da Tabela 1 (ou mín./máx. de projeto); emulsão — a Tabela 2 não traz tolerância (adotada ± 0,3 l/m², editável) e dá o agregado como valor único (informativo); " +
      "valores da Tabela 2 referidos a 65 % de resíduo, corrigidos pelo resíduo médio dos carregamentos (Nota). Mínimo de 5 determinações por segmento de área inferior a 3.000 m² (7.2.2 b). " +
      "Produto: réguas (≤ 0,5 cm), alinhamento (± 5 cm) e espessura no eixo e bordas (± 10 % do projeto) nas estacas de locação (7.3). Métodos citados e substituídos: DNER-ME 035 → DNIT 451; DNER-ME 083 → DNIT 412; DNER-ME 086 → DNIT 424; DNER-ME 078 → DNIT 452.",
    exemplos: [
      { nome: "Lote aceito — macadame betuminoso com CAP 150/200, faixa B, 1.200 m²", importar: [["impAgq", [["dnit-424-2020-me", 1], ["dnit-452-2024-me", 0]]]],
        dados: function () {
          function geo(ini, l) { return l.map(function (x, i) { return { est: String(ini + i), r12: fmt(x[0], 1), r3: fmt(x[1], 1), ae: fmt(x[2], 0), ale: fmt(x[3], 0), ald: fmt(x[4], 0), ee: fmt(x[5], 1), ele: fmt(x[6], 1), eld: fmt(x[7], 1) }; }); }
          return { ident: { registro: "LOTE-MB-001", data: "2026-08-04", obra: "Obra C — BR-000", trecho: "Base — pista direita", local: "Est. 600 a 610", camada: "Macadame betuminoso — CAP 150/200", origem: "Pedreira Z" },
            params: { estIni: "600", estFim: "610", largura: "6,00", ligante: "cap", faixa1: PRE + "cap-B-1", faixa2: PRE + "cap-B-2", projL1: "6,50", espProj: "7,0",
              tMin: "150", tMax: "175", nAplic: "1", nCarreg: "1", ton: "8", jornadas: "1", volAgr: "90" },
            lig1: B([[600, "LE", 6.42], [602, "eixo", 6.61], [604, "LD", 6.55], [606, "LE", 6.38], [608, "eixo", 6.49], [610, "LD", 6.58]]),
            agr1: B([[600, "LE", 148], [602, "eixo", 152], [604, "LD", 145], [606, "LE", 150], [608, "eixo", 155], [610, "LD", 147]], 0),
            agr2: B([[600, "LE", 17.5], [602, "eixo", 18.2], [604, "LD", 16.9], [606, "LE", 18.8], [608, "eixo", 17.2], [610, "LD", 18.0]], 1),
            rec: [{ reg: "REC-CAP-15 · DNIT 095 (digitado)", classe: "150/200", sit: "aprovado" }],
            temp: [{ est: "600", t: "164" }],
            gran1: [{ est: "04/08", reg: "GR-601", p76_2: "100", p63_5: "95,2", p50_8: "52,6", p38_1: "7,4" }],
            gran2: [{ est: "04/08", reg: "GR-602", p25_4: "100", p19_1: "94,5", p9_5: "38,1", p4_8: "5,2", p2: "2,3" }],
            proj: [{ p76_2: "100", p63_5: "95", p50_8: "52", p38_1: "8" }, { p25_4: "100", p19_1: "95", p9_5: "37", p4_8: "5", p2: "2" }],
            agq: [{ reg: "DUR-21 · DNER-ME 089 (digitado)", dur: "3,9" }],
            geo: geo(600, [[0.2, 0.3, 1, -1, 2, 7.1, 6.9, 7.2], [0.1, 0.2, 0, 2, -1, 7.3, 7.0, 6.8], [0.3, 0.4, -1, 1, 0, 6.9, 7.2, 7.1], [0.2, 0.3, 2, -2, 1, 7.0, 6.7, 7.3],
              [0.2, 0.3, 0, 1, -2, 7.2, 7.1, 6.9], [0.1, 0.4, 1, 0, 1, 6.8, 7.0, 7.2], [0.3, 0.2, -2, 1, 0, 7.1, 7.3, 7.0], [0.2, 0.3, 1, -1, 2, 7.0, 6.9, 7.1],
              [0.2, 0.4, 0, 2, -1, 7.2, 7.0, 6.8], [0.1, 0.3, -1, 0, 1, 6.9, 7.1, 7.2], [0.2, 0.2, 1, 1, 0, 7.0, 7.2, 7.0]]),
            verif: V(["S", ["S", 1, 0], "", "S"]),
            obs: "Índice de forma e adesividade importados dos exemplos das fichas ME; Los Angeles não ensaiado (sem dúvida sobre a origem, 7.1.2)." };
        } },
      { nome: "Lote rejeitado — macadame com RR-2C: 2ª aplicação de emulsão e espessura abaixo do projeto",
        dados: function () {
          function geo(ini, l) { return l.map(function (x, i) { return { est: String(ini + i), r12: "0,3", r3: "0,4", ae: "1", ale: "-2", ald: "2", ee: fmt(x[0], 1), ele: fmt(x[1], 1), eld: fmt(x[2], 1) }; }); }
          return { ident: { registro: "LOTE-MB-002", data: "2026-08-18", obra: "Obra D", trecho: "Reforço", local: "Est. 700 a 705", camada: "Macadame betuminoso — RR-2C" },
            params: { estIni: "700", estFim: "705", largura: "7,00", ligante: "rr2c", faixa1: PRE + "emulsao-C-1", faixa2: PRE + "emulsao-F-2", projL1: "5,00", projL2: "6,00", espProj: "7,5",
              tMin: "50", tMax: "80", nAplic: "2", nCarreg: "1", ton: "6", jornadas: "1" },
            lig1: B([[700, "LE", 4.95], [701, "eixo", 5.10], [702, "LD", 4.88], [703, "LE", 5.04], [704, "eixo", 4.97]]),
            lig2: B([[700, "LE", 5.52], [701, "eixo", 5.61], [702, "LD", 5.45], [703, "LE", 5.70], [704, "eixo", 5.58]]),
            agr1: B([[700, "LE", 144], [701, "eixo", 150], [702, "LD", 141], [703, "LE", 147], [704, "eixo", 149]], 0),
            agr2: B([[700, "LE", 15.4], [701, "eixo", 16.8], [702, "LD", 15.9], [703, "LE", 16.2], [704, "eixo", 16.5]], 1),
            rec: [{ reg: "REC-RR2C-21 · DNIT 165 (digitado)", classe: "RR-2C", sit: "aprovado", res: "67,5" }],
            temp: [{ est: "700", t: "62" }, { est: "703", t: "64" }],
            gran1: [{ est: "18/08", reg: "GR-701", p50_8: "100", p38_1: "74", p25_4: "46", p19_1: "25", p12_7: "8", p4_8: "2" }],
            gran2: [{ est: "18/08", reg: "GR-702", p19_1: "100", p12_7: "97", p9_5: "58", p4_8: "6", p2: "2" }],
            agq: [{ reg: "AG-71 (digitado)", fi: "0,57", dur: "5,1", ades: "satisfatória" }],
            geo: geo(700, [[6.6, 6.4, 6.9], [6.8, 6.5, 6.7], [6.5, 6.9, 6.6], [6.7, 6.3, 6.8], [6.4, 6.6, 6.5], [6.9, 6.7, 6.6]]),
            verif: V(["S", ["S", 1, 0], "", "S"]),
            obs: "Exemplo de reprovação: X̄ − k·s da 2ª aplicação de emulsão abaixo de 5,70 l/m² e espessura média de 6,6 cm (projeto 7,5 cm ± 10 %)." };
        } },
    ],
  });
  // a correção da Nota da Tabela 2 usa o resíduo dos carregamentos: guarda os dados do cálculo em curso
  var F = FE.FICHAS["dnit-149-2010-es"], calc0 = F.calcular;
  F.calcular = function (d) { dAtual = d; try { return calc0(d); } finally { dAtual = null; } };
})();
