/*
 * Ficha: DNIT 094/2014-EM — Tubos de PRFV e poliolefínicos (PE e PP) para drenagem — recebimento do lote.
 * Usa FE.recebMaterial (site/fichas/dner-em-033-94.js, carregado antes) e FE.aceitacao (es-comum.js).
 * Amostragem por atributos: Tabela 8 (visual e dimensional, dupla) e Tabela 9 (destrutivos).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, R = FE.recebMaterial, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  if (!R) { if (window.console) console.error("dnit-094-2014-em.js: carregue antes site/fichas/dner-em-033-94.js (FE.recebMaterial)."); return; }
  var EPS = 1e-9;
  // Tabelas 8 e 9: [de, até, n1, n2, Ac1, Re1, Ac2, Re2]
  var TAB8 = [[16, 25, 5, 0, 0, 1, NaN, NaN], [26, 90, 8, 8, 0, 2, 1, 2], [91, 150, 13, 13, 0, 3, 3, 4], [151, 280, 20, 20, 1, 4, 4, 5], [281, 500, 32, 32, 2, 5, 6, 7],
    [501, 1200, 50, 50, 3, 7, 8, 9], [1201, 3200, 80, 80, 5, 9, 12, 13], [3201, 10000, 125, 125, 7, 11, 18, 19]];
  var TAB9 = [[16, 150, 3, 0, 0, 1, NaN, NaN], [151, 3200, 8, 8, 0, 2, 1, 2], [3201, 10000, 13, 13, 0, 3, 3, 4]];
  // Tabela 2 — tração axial mínima (kN/m de circunferência) de tubos PRFV: [DN até, valor]
  var TAB2 = [[800, 102], [850, 111], [900, 122], [1000, 137], [1200, 161], [1400, 182], [1600, 210], [1800, 238], [2000, 260], [2200, 280], [2400, 322],
    [2600, 340], [2800, 360], [3000, 400], [3200, 420], [3400, 440], [3600, 480]];
  // Tabela 4 — deformação diametral (%) dos níveis A e B por classe de rigidez (N/m²)
  var TAB4 = { 1250: [18, 30], 2500: [15, 25], 3750: [13, 21], 5000: [12, 20], 7500: [10, 17], 10000: [9, 15] };
  function prfv(P) { return (P.material || "PRFV") === "PRFV"; }
  function tracaoAx(dn) { if (!ok(dn)) return NaN; var r = TAB2.filter(function (x) { return dn <= x[0] + EPS; })[0]; return r ? r[1] : NaN; }
  var GD = "Documentação e qualificação (5.1; 5.11)", GV = "Exames visual e dimensional (5.2 a 5.4; Tabela 8)", GX = "Ensaios destrutivos (5.5; 5.7 a 5.9; Tabela 9)";
  var seP = function (d) { return prfv(d.params || {}); }, seO = function (d) { return !prfv(d.params || {}); };

  var CRIT = [
    { id: "memo", grupo: GD, texto: "Memorial descritivo do fabricante (espessuras, camadas, fibra e resina — PRFV; parede interna, SN — PE/PP; comprimento de montagem, junta, montagem)", secao: "5.1", tipo: "sim_nao", falha: "ressalva" },
    { id: "qual", grupo: GD, texto: "Ensaios de qualificação do projeto: compressão axial (PRFV), estanqueidade da junta e, no PRFV, pressão hidrostática e compressão circunferencial de longa duração", secao: "5.6; 5.10; 5.11", tipo: "sim_nao", falha: "ressalva" },
    { id: "liner", grupo: GD, texto: "Liner de PVC branco conforme NBR 7665 (evidência do fabricante do liner)", secao: "4.2", tipo: "sim_nao", falha: "ressalva",
      se: function (P) { return prfv(P) && P.liner === "sim"; }, naoAplicaPor: "sem liner termoplástico" },
    { id: "aviso", grupo: GD, texto: "Fiscalização avisada com ≥ 10 dias de antecedência; equipamentos calibrados com certificados", secao: "6.1", tipo: "sim_nao", falha: "ressalva" },
  ];

  function tabelasExtra(d) {
    var P = d.params || {}, pf = prfv(P);
    var lv = [{ k: "id", r: "Identificação", texto: true }, { k: "am", r: "Amostra (1 / 2)", texto: true },
      { k: "vis", r: "Sem rebarbas, delaminações, bolhas, furos, fissuras" + (pf ? ", pites ou pontos secos" : "") + "? (S / N)", texto: true },
      { k: "marc", r: "Marcação (DN, classes, rastreabilidade, fabricante, norma, finalidade)? (S / N)", texto: true },
      { k: "eMed", r: "Espessura média da parede", u: "mm" }, { k: "eMin", r: "Espessura mínima (qualquer ponto)", u: "mm" }, { k: "comp", r: "Comprimento total da barra", u: "m" }];
    if (pf) lv.push({ k: "chanfro", r: "Ângulo do chanfro da ponta", u: "°" }, { k: "oval", r: "Ovalização medida (desvio do diâmetro)", u: "mm" });
    var lx = [{ k: "id", r: "Identificação", texto: true }, { k: "am", r: "Amostra (1 / 2)", texto: true },
      { k: "rig", r: pf ? "Rigidez a 5 % de deformação diametral" : "Rigidez anelar (ISO 9969)", u: pf ? "N/m²" : "kPa" }];
    if (pf) lx.push({ k: "nivA", r: "Deformação do nível A sem fissuras? (S / N)", texto: true }, { k: "nivB", r: "Deformação do nível B sem dano estrutural? (S / N)", texto: true },
      { k: "tax", r: "Tração axial na ruptura", u: "kN/m" }, { k: "alax", r: "Alongamento na ruptura (tração axial)", u: "%" }, { k: "tc", r: "Tração circunferencial", u: "kN/m" });
    lx.push({ k: "est", r: "Estanqueidade da junta (" + (pf ? "2 × classe de pressão, 30 s" : "ISO") + ")? (S / N)", texto: true });
    return [{ chave: "vd", titulo: "Exames visual, de marcação e dimensional — barras da amostra (Tabela 8)", rotulo: "Barra", iniciais: 5, min: 1,
      dica: "uma coluna por barra; \"Amostra\" 1 ou 2 (2ª amostragem)", linhas: lv },
      { chave: "dx", titulo: "Ensaios destrutivos — barras aprovadas no visual/dimensional (Tabela 9)", rotulo: "Barra", iniciais: 3, min: 1,
        dica: "\"Amostra\" 1 ou 2; a estanqueidade pode ser feita em só 3 amostras, a critério do inspetor (6.3.2)", linhas: lx }];
  }

  function extra(ctx) {
    var P = ctx.P, pf = prfv(P), N = num(P.tamLote), dn = num(P.dn), eN = num(P.espNom), cMin = ok(num(P.compMin)) ? num(P.compMin) : 6, cr = num(P.cr), l;
    var ovMax = pf && ok(dn) ? (dn > 600 ? 0.005 * dn : dn > 300 ? 3.0 : NaN) : NaN;
    var vd = R.cols(ctx.d, "vd", ["vis", "marc", "eMed", "eMin", "comp", "chanfro", "oval"]).map(function (c, i) {
      var u = R.unidade(c, i, "barra");
      R.confSN(u, c.vis, "aspecto visual");
      R.confSN(u, c.marc, "marcação");
      if (ok(eN)) { R.conf(u, c.eMed, { rot: "espessura média", min: eN, casas: 2, un: "mm" }); R.conf(u, c.eMin, { rot: "espessura mínima", min: 0.95 * eN, casas: 2, un: "mm" }); }
      R.conf(u, c.comp, { rot: "comprimento", min: cMin, casas: 2, un: "m", obrig: false });
      if (pf) { R.conf(u, c.chanfro, { rot: "chanfro", min: 28, max: 32, casas: 0, un: "°", obrig: false }); if (ok(ovMax)) R.conf(u, Math.abs(num(c.oval)), { rot: "ovalização", max: ovMax, casas: 1, un: "mm", obrig: false }); }
      return u;
    });
    var p8 = R.planoTab(TAB8, N);
    l = R.dupla({ id: "vd", grupo: GV, criterio: "Visual, marcação e dimensões — " + P.material + " DN " + (ok(dn) ? dn : "?"), secao: "5.2; 5.3; 5.4; 6.4.2", plano: p8, unidades: vd, rotU: "barra(s)",
      tituloUni: "Exames visual, de marcação e dimensional", semPlano: ok(N) && N < 16 ? "lote com menos de 16 unidades: inspeção por acordo prévio (6.3.1 b)" : "informe o tamanho do lote (16 a 10 000 barras — Tabela 8)" });
    l.exigido = (ok(eN) ? "espessura média ≥ " + fmt(eN, 2) + " mm e mínima ≥ " + fmt(0.95 * eN, 2) + " mm; " : "") + "comprimento ≥ " + fmt(cMin, 1) + " m" +
      (pf ? "; chanfro 30 ± 2°" + (ok(ovMax) ? "; ovalização ≤ " + fmt(ovMax, 1) + " mm" : "") : "") + " — " + R.txtPlano(p8);
    if (!ok(eN)) A.marcar(l, "pendente", "informe a espessura nominal declarada pelo fabricante (5.4.3)");
    ctx.linhas.push(l);
    ctx.freqs.push(R.freqDupla(l, "Exames visual e dimensional", "Tabela 8"));
    // destrutivos
    var niv = TAB4[cr] || null, trAx = tracaoAx(dn), pc = num(P.pc), Si = num(P.si), Sr = num(P.sr), De = num(P.de);
    var r = ok(De) && ok(eN) ? (De - eN) / 2 / 1000 : NaN, Pk = pc * 1000;  // r em m; P em kN/m²
    var fC = ok(r) && ok(Pk) ? Math.max(4.0, ok(Si) && ok(Sr) && Sr > 0 ? Si / Sr : 0) * Pk * r : NaN;
    var dx = R.cols(ctx.d, "dx", ["rig", "nivA", "nivB", "tax", "alax", "tc", "est"]).map(function (c, i) {
      var u = R.unidade(c, i, "barra");
      R.conf(u, c.rig, { rot: "rigidez", min: pf ? cr : cr, casas: pf ? 0 : 1, un: pf ? "N/m²" : "kPa" });
      if (pf) {
        R.confSN(u, c.nivA, "nível A (" + (niv ? niv[0] : "?") + " %)");
        R.confSN(u, c.nivB, "nível B (" + (niv ? niv[1] : "?") + " %)");
        R.conf(u, c.tax, { rot: "tração axial", min: trAx, casas: 0, un: "kN/m" });
        R.conf(u, c.alax, { rot: "alongamento axial", min: 0.25, casas: 2, un: "%" });
        if (ok(fC)) R.conf(u, c.tc, { rot: "tração circunferencial", min: fC, casas: 0, un: "kN/m" }); else if (!R.vazio(c.tc)) u.faltas.push("parâmetros de F (P, De, e)");
      }
      R.confSN(u, c.est, "estanqueidade", false);
      return u;
    });
    var p9 = R.planoTab(TAB9, N);
    l = R.dupla({ id: "dx", grupo: GX, criterio: pf ? "Rigidez (CR) e níveis A/B, tração axial e circunferencial, estanqueidade" : "Rigidez anelar (SN) e estanqueidade", secao: pf ? "5.5; 5.7; 5.8; 5.9.1" : "5.5; 5.9.2",
      plano: p9, unidades: dx, rotU: "barra(s)", tituloUni: "Ensaios destrutivos", semPlano: "informe o tamanho do lote (Tabela 9)" });
    l.exigido = (pf ? "rigidez a 5 % ≥ CR " + (ok(cr) ? fmt(cr, 0) + " N/m²" : "?") + (niv ? "; nível A " + niv[0] + " % e B " + niv[1] + " % sem falha" : "") +
      "; tração axial ≥ " + (ok(trAx) ? trAx : "?") + " kN/m e alongamento ≥ 0,25 %; tração circunferencial ≥ " + (ok(fC) ? fmt(fC, 0) : "?") + " kN/m"
      : "SN ≥ " + (ok(cr) ? fmt(cr, 0) : "?") + " kPa") + "; junta estanque — " + R.txtPlano(p9);
    if (!ok(cr)) A.marcar(l, "pendente", "informe a classe de rigidez / SN declarada");
    if (pf && !ok(fC)) A.marcar(l, "pendente", "informe classe de pressão, diâmetro externo e espessura para a força circunferencial mínima (5.7)");
    if (pf && !ok(trAx)) A.marcar(l, "pendente", "DN fora da Tabela 2 (300 a 3600)");
    ctx.linhas.push(l);
    ctx.freqs.push(R.freqDupla(l, "Ensaios destrutivos", "Tabela 9"));
    if (pf && ok(fC)) ctx.avisos.push("Força circunferencial mínima (5.7): F = máx(Si/Sr; 4,0) × P × r = " + fmt(Math.max(4, ok(Si) && ok(Sr) ? Si / Sr : 0), 2) + " × " + fmt(Pk, 0) +
      " kN/m² × " + fmt(r, 4) + " m = " + fmt(fC, 0) + " kN/m" + (ok(Si) && ok(Sr) ? "" : " (Si/Sr não informados: só a Eq. 2)") + ".");
    if (ok(N) && N > 10000) ctx.avisos.push("Lote acima de 10 000 barras: fora das Tabelas 8 e 9.");
  }

  R.criar({
    id: "dnit-094-2014-em",
    titulo: "Tubos PRFV, PE e PP para drenagem — recebimento do lote",
    resumo: "Recebimento de tubos de PRFV, PE ou PP (DNIT 094/2014-EM): memorial descritivo e ensaios de qualificação (5.1; 5.11); exames visual, de marcação e dimensional — espessura média ≥ nominal e mínima ≥ 95 %, comprimento ≥ 6 m, chanfro 30 ± 2° e ovalização (Tabela 1) no PRFV — com a amostragem dupla da Tabela 8; destrutivos com a Tabela 9 — rigidez ≥ classe declarada (PRFV: a 5 % e níveis A/B da Tabela 4; PE/PP: SN pela ISO 9969), tração axial (Tabela 2, alongamento ≥ 0,25 %), tração circunferencial F = máx(Si/Sr; 4,0)·P·r e estanqueidade da junta.",
    params: R.paramsLote({ phLote: "ex.: lote 1 — DN 600" }).concat([
      { k: "material", r: "Material", tipo: "select", recarrega: true, opcoes: [["PRFV", "PRFV — poliéster reforçado com fibra de vidro"], ["PE", "PE — polietileno"], ["PP", "PP — polipropileno"]] },
      { k: "dn", r: "Diâmetro nominal DN (mm)" },
      { k: "cr", r: "Classe de rigidez declarada — PRFV: CR (N/m²); PE/PP: SN (kPa)", dica: "PRFV: 1250, 2500, 3750, 5000, 7500 ou 10000 (Tabela 3); PE/PP: SN 2, 4, 8 ou 16 (Tabela 5)" },
      { k: "espNom", r: "Espessura nominal da parede declarada (mm)" },
      { k: "compMin", r: "Comprimento total mínimo acordado (m)", dica: "padrão 6 m (5.4.2)" },
      { k: "tamLote", r: "Tamanho do lote (barras)" },
      { k: "pc", r: "Classe de pressão Pc (MPa)", se: seP },
      { k: "de", r: "Diâmetro externo De (mm)", se: seP },
      { k: "si", r: "Si — tensão circunferencial inicial de ruptura (kN/m²) — opcional", se: seP },
      { k: "sr", r: "Sr — tensão circunferencial na classe de pressão (kN/m²) — opcional", se: seP },
      { k: "liner", r: "Tubo com liner termoplástico (PVC)?", tipo: "select", opcoes: [["nao", "Não"], ["sim", "Sim"]], se: seP },
      { k: "norma", r: "Norma de referência das tolerâncias (PE/PP)", tipo: "select", opcoes: [["iso", "ISO 21138-3"], ["m294", "AASHTO M 294"], ["m330", "AASHTO M 330"]], se: seO },
    ]),
    padrao: { material: "PRFV", compMin: "6", liner: "nao", norma: "iso" },
    criterios: CRIT,
    tabelasExtra: tabelasExtra,
    extra: extra,
    textos: { REJEITADO: { texto: "Número de unidades defeituosas igual ou maior que o de rejeição (6.4): o lote deve ser rejeitado (seção 7)." } },
    notas: "Critérios da DNIT 094/2014-EM. Espessura média ≥ nominal e mínima ≥ 95 % da nominal (5.4.3); comprimento total ≥ 6 m (5.4.2); PRFV: chanfro de 30 ± 2° (5.2), ovalização ≤ 3,0 mm (300 < DN ≤ 600) ou ≤ 0,5 % (DN > 600) — Tabela 1; rigidez a 5 % de deformação ≥ CR declarada e deformações dos níveis A e B da Tabela 4 sem falha (5.9.1); tração axial ≥ Tabela 2 com alongamento médio ≥ 0,25 % (5.8); tração circunferencial ≥ F = máx(Si/Sr; 4,0) × P × r, r = (De − e)/2 (5.7); junta estanque a 2 × Pc por 30 s (5.5). PE/PP: SN ≥ declarada (ISO 9969; Tabela 5). Tabela 8 (visual/dimensional) e Tabela 9 (destrutivos): unidades defeituosas ≤ Ac → aceito; ≥ Re → rejeitado; entre os dois → 2ª amostra, acumulando (6.4). Lotes < 16 barras: acordo prévio.",
    exemplos: [
      { nome: "PRFV DN 600, CR 5000, Pc 0,4 MPa, lote de 120 barras — aceito", dados: function () {
        return { ident: { registro: "TUB-01", obra: "Obra A — galeria de drenagem", data: "2026-08-04", origem: "Fornecedor A", camada: "Tubos PRFV DN 600" },
          params: { lote: "Lote 1 — DN 600", fornecedor: "Fornecedor A", nf: "90021", certificado: "MD-601", dataEntrega: "04/08/2026", material: "PRFV", dn: "600", cr: "5000",
            espNom: "9,0", compMin: "6", tamLote: "120", pc: "0,4", de: "618", liner: "nao" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, {}, { atende: "S" }],
          vd: ["01", "14", "27", "33", "45", "52", "68", "71", "84", "90", "103", "111", "118"].map(function (n, i) {
            return { id: "T-" + n, am: "1", vis: "S", marc: "S", eMed: String(9.3 + (i % 3) * 0.1).replace(".", ","), eMin: "8,8", comp: "6,02", chanfro: "30", oval: String(1 + (i % 4) * 0.4).replace(".", ",") };
          }),
          dx: [{ id: "T-27", am: "1", rig: "5420", nivA: "S", nivB: "S", tax: "128", alax: "0,41", tc: "1320", est: "S" },
            { id: "T-68", am: "1", rig: "5610", nivA: "S", nivB: "S", tax: "133", alax: "0,38", tc: "1405", est: "S" },
            { id: "T-111", am: "1", rig: "5390", nivA: "S", nivB: "S", tax: "125", alax: "0,36", tc: "1290", est: "S" }] };
      } },
      { nome: "PE de parede dupla DN 800, SN 4, lote de 60 barras — espessura e rigidez reprovadas (rejeitado)", dados: function () {
        return { ident: { registro: "TUB-02", obra: "Obra B — bueiro", data: "2026-09-01", origem: "Fornecedor B", camada: "Tubos PE DN 800" },
          params: { lote: "Lote 3 — DN 800", fornecedor: "Fornecedor B", nf: "5530", dataEntrega: "01/09/2026", material: "PE", dn: "800", cr: "4", espNom: "5,0", compMin: "6", tamLote: "60", norma: "iso" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, {}, { atende: "S" }],
          vd: [{ id: "P-03", am: "1", vis: "S", marc: "S", eMed: "5,2", eMin: "4,9", comp: "6,00" }, { id: "P-11", am: "1", vis: "S", marc: "S", eMed: "4,8", eMin: "4,6", comp: "6,01" },
            { id: "P-19", am: "1", vis: "S", marc: "S", eMed: "5,1", eMin: "4,8", comp: "6,00" }, { id: "P-26", am: "1", vis: "N", marc: "S", eMed: "5,3", eMin: "5,0", comp: "6,02" },
            { id: "P-34", am: "1", vis: "S", marc: "S", eMed: "5,2", eMin: "4,9", comp: "6,00" }, { id: "P-41", am: "1", vis: "S", marc: "S", eMed: "5,0", eMin: "4,8", comp: "6,01" },
            { id: "P-50", am: "1", vis: "S", marc: "S", eMed: "5,4", eMin: "5,1", comp: "6,00" }, { id: "P-58", am: "1", vis: "S", marc: "S", eMed: "5,1", eMin: "4,9", comp: "6,00" }],
          dx: [{ id: "P-19", am: "1", rig: "3,6", est: "S" }, { id: "P-34", am: "1", rig: "4,3", est: "S" }, { id: "P-50", am: "1", rig: "4,5", est: "S" }] };
      } },
    ],
  });
})();
