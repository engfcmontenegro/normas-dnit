/*
 * Ficha de ES: DNIT 058/2004-ES — Sub-base de solo-cimento (pavimento rígido) — aceitação do trecho.
 * Resistência à compressão aos 7 dias (7.3.1: fc7 − k·s ≥ fc de projeto, Tabela 1 de Student; verificação suplementar com
 * ≥ 6 testemunhos), GC = GCmédio − k·s ≥ 100 % na energia normal (7.3.2, Tabela 2 = DNER-PRO 277) com reensaio, grau de
 * pulverização ≥ 80 % (7.3.3), umidade 0,9 a 1,1 × h ót (5.3.1; 5.3.2 f), LL/IP (5.1.3), frequências da 7.2 e geometria (7.4).
 * Usa FE.aceitacaoG6 (definida em es-dnit-047-2004-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG6, num = FE.num, ok = FE.ok, sn = G.sn;
  var ID = "dnit-058-2004-es";
  function pista(P) { return P.mistura === "pista"; }
  function dias(P) { var x = num(P.dias); return ok(x) ? x : 1; }
  var crit = [
    sn("cim", "Cimento Portland (NBR 5732, 11578, 5735 ou 5736), recebido conforme DNIT 050-EM", "4.3; 5.1.1", "Materiais", "certificado / recebimento"),
    sn("gran", "Solo com granulometria preferencial: 100 % < 76 mm; 50–100 % < nº 4; 15–100 % < nº 40; 5–35 % < nº 200", "5.1.3", "Materiais", "preferencialmente"),
    { id: "umid", texto: "Umidade antes da compactação", secao: "5.3.1; 5.3.2 f", grupo: "Controle da execução", tipo: "valor", unid: "%", casas: 1, falha: "ressalva", metodo: "DNIT 456 (DNER-ME 052/088)",
      exigido: "0,9 a 1,1 × h ót", min: function (P) { var h = num(P.hOt); return ok(h) ? h * 0.9 : NaN; }, max: function (P) { var h = num(P.hOt); return ok(h) ? h * 1.1 : NaN; },
      importar: { de: "dnit-456-2025-me", valores: function (e) { var r = e.resultados || {}; return ok(r.w) ? [{ v: r.w, est: (e.dados.ident || {}).local || "" }] : []; } },
      freq: { por: "extensao", a_cada: 10 } },
    sn("pulvC", "Pulverização na central: ≥ 80 % do material miúdo < 4,8 mm", "5.3.1", "Controle da execução", "≥ 80 %", "ressalva", function (P) { return !pista(P); }),
    { id: "gp", texto: "Grau de pulverização (mistura na pista)", secao: "5.3.2 b; 7.3.3", grupo: "Controle da execução", tipo: "valor", unid: "%", casas: 0, min: 80, falha: "nao_conforme",
      se: pista, freq: { por: "area", a_cada: 1000 },
      freqG: function (P, L) { return { exigido: Math.max(A.nMin(L.area, 1000, 1), 2 * dias(P)), regra: "1 a cada 1 000 m²; mín. 2 por dia" }; } },
    { id: "teor", texto: "Teor de cimento (mistura na pista)", secao: "7.2.2 b", grupo: "Controle da execução", tipo: "valor", unid: "%", casas: 2, se: pista,
      exigido: "registrar (a ES não fixa tolerância)", freq: { por: "tempo", a_cada: 1 }, freqG: function (P) { return { exigido: dias(P), regra: "1 por dia" }; } },
    sn("tempo", "Mistura pronta → início da compactação ≤ 1 h (salvo comprovação por ensaio)", "5.3.1", "Execução", "≤ 1 h", "ressalva", function (P) { return !pista(P); }),
    sn("compac", "Compactação: camada final (rolo pneumático/liso) ≥ 5 cm; acerto final só por corte, sem adição de material; superfície lisa e sem partes soltas", "5.3.1", "Execução", "conforme 5.3.1"),
    sn("faixa", "Faixa pulverizada não excede a tratável em 2 dias; água progressiva (≤ 2 p.p. por passada) incorporada em até 3 h", "5.3.2 b, e", "Execução", "conforme 5.3.2", "ressalva", pista),
    sn("cura", "Cura por ≥ 7 dias (cobertura umedecida ou material betuminoso a 0,8 l/m²); sem tráfego antes do endurecimento", "5.3.1", "Execução", "7 dias"),
  ];
  G.criarFicha({
    id: ID,
    titulo: "Sub-base de solo-cimento — aceitação do trecho",
    resumo: "Resistência à compressão aos 7 dias (fc7 − k·s ≥ fc, Tabela 1), GC estatístico com reensaio (energia normal), pulverização, umidade, LL/IP, frequências da 7.2 e geometria (7.4).",
    lote: { largura: true, dias: true },
    params: [{ k: "mistura", r: "Processo de mistura", tipo: "select", recarrega: true, opcoes: [["central", "Mistura em central (5.3.1)"], ["pista", "Mistura na pista (5.3.2)"]] }].concat(G.paramInsumos),
    padrao: { mistura: "central", gcMin: "100", gcReens: "nao", idadeCtrl: "7", resSup: "nao", insumos: "lote" },
    criterios: crit,
    preparar: G.preparaHot,
    componentes: [
      G.compResistencia({ tipos: ["compressao"], formula: "solo", idadePadrao: 7, secao: "7.3.1", secAuto: "7.3.1 a", secMold: "7.2.1 e", secSup: "7.3.1 b, c", secaoExig: "5.1.4",
        areaTrecho: 1000, porDia: 2, sup: "media", importar: ["dner-me-201-94"],
        provNC: "Demolir e reconstruir o trecho condenado ou reforçar a sub-base, conforme parecer da contratante (7.3.1 c)." }),
      G.compProctor({ energia: "normal", secao: "5.3.1; 7.2.1 b", importar: ["dner-me-216-94", "dnit-164-2013-me"] }),
      G.compGC({ secao: "7.2.1 a, b", secAuto: "7.3.2 a", secSup: "7.3.2 b", energia: "normal", reensaio: "sempre" }),
      G.compLimites({ secao: "7.2.1 d" }),
      G.compAgua({ secao: "5.1.2" }),
      G.compGeometria({ modo: "subbase", secao: "7.4", medicao: "minMedia", secMed: "8", base: "camada subjacente",
        provEsp: "Espessura média inferior à de projeto: as partes interessadas definem a decisão (7.4)." }),
    ],
    notas: "Critérios da DNIT 058/2004-ES. Resistência (7.3.1): fc7 − k·s ≥ fc de projeto (a ES escreve \"fc ≥ fc7 − Ks\" em 7.3.1 a — adotada a forma coerente com a definição de fc), k da Tabela 1 (Student): " + G.STUDENT_TXT +
      "; 1 CP por determinação, a cada 1 000 m² com mín. 2 por dia (7.2.1 e); n < 6 sem estimativa. Verificação suplementar: ≥ 6 testemunhos com idade ≥ 14 dias; adotado aceitar se X̄ − k·s ≥ fc, e ressalva se apenas a média ≥ fc (7.3.1 c escreve \"fc7 ≥ fc\"). " +
      "GC = GCmédio − k·s ≥ 100 % na energia normal, k da Tabela 2 (" + G.K277_TXT + "); sem aceitação automática: reensaio com ≥ 6 determinações, aceito se GC ≥ 100 % ou todos os individuais ≥ 100 %; senão rebater (7.3.2). " +
      "GP ≥ 80 % (7.3.3); umidade 0,9 a 1,1 × h ót (5.3.2 f) → ressalva; LL ≤ 40 % e IP ≤ 18 % preferenciais (5.1.3) → ressalva. Geometria (7.4): largura ± 10 cm; ≥ 6 espessuras a ≤ 20 m, média ≥ projeto e (maior − menor) ≤ 1 cm.",
    exemplos: [
      { nome: "Trecho aceito — mistura em central, 160 m × 8,5 m, resistência com 6 CPs aos 7 dias (2 importados da DNER-ME 201)", dados: function () {
        var F = FE.FICHAS[ID];
        var d = { ident: { registro: "LOTE-SC-001", data: "2026-01-14", obra: "Obra B — BR-000", trecho: "Sub-base — lote 1", local: "Est. 50 a 58", origem: "Jazida 1", camada: "Sub-base de solo-cimento (7 %)" },
          params: Object.assign({}, F.padrao, { estIni: "50", estFim: "58", largura: "8,50", dias: "1", largProj: "8,50", espProj: "15", fck: "2,1" }),
          verificacoes: G.verifEx(F), res: [], umid: [], gc: [], lim: [{}], comp: [{}], agua: [{}] };
        A.exemplos.importar(F.params, d, "impRes", [["dner-me-201-94", 1]]);
        d.res.forEach(function (c) { c.est = "52"; });
        d.res = d.res.concat([2.36, 2.28, 2.41, 2.25].map(function (v, i) { return { est: String(54 + i), reg: "RC-SC-" + (11 + i), idade: "7", cp1: A.nstr(v, 2) }; }));
        A.exemplos.importar(F.params, d, "impComp", [["dner-me-216-94", 0]]);
        d.comp[0].est = "51";
        var h = num(d.comp[0].hot), pos = ["BD", "eixo", "BE", "eixo"];
        for (var i = 0; i <= 16; i++) {
          var e = String(50 + Math.floor(i / 2)) + (i % 2 ? "+10" : "");
          d.umid.push({ est: e, reg: "Speedy", v: A.nstr(h * (1 + [0.03, -0.04, 0.06, -0.02, 0.01][i % 5]), 1) });
          d.gc.push({ est: e, pos: pos[i % 4], reg: "DNIT 458 — furo " + (i + 1), gc: A.nstr(101.4 + [0.3, -0.5, 0.8, 0.0, -0.2, 0.6][i % 6], 1) });
        }
        A.exemplos.importar(F.params, d, "impLim", [["dner-me-082-94", 0]]);
        A.exemplos.importar(F.params, d, "impAgua", [["dnit-036-2004-me", 0]]);
        var g = [];
        for (var j = 0; j <= 8; j++) g.push({ est: String(50 + j), pos: "eixo", larg: A.nstr(8.54 + (j % 2) * 0.03, 2), esp: A.nstr(15.2 + (j % 3) * 0.2, 1) });
        d.geo = g;
        return d;
      } },
      { nome: "Trecho rejeitado — fc7 − k·s < fc e testemunhos também abaixo; GC pendente de reensaio", dados: function () {
        var F = FE.FICHAS[ID];
        var d = { ident: { registro: "LOTE-SC-002", data: "2026-01-28", obra: "Obra B — BR-000", trecho: "Sub-base — lote 2", local: "Est. 58 a 66", origem: "Jazida 1", camada: "Sub-base de solo-cimento (7 %)" },
          params: Object.assign({}, F.padrao, { estIni: "58", estFim: "66", largura: "8,50", dias: "1", largProj: "8,50", espProj: "15", fck: "2,1", hOt: "10,3", resSup: "sim", insumos: "previo", insumosReg: "RI-05" }),
          verificacoes: G.verifEx(F), res: [], ext: [], umid: [], gc: [], lim: [], comp: [] };
        A.exemplos.importar(F.params, d, "impRes", [["dner-me-201-94", 2]]);
        d.res = d.res.concat([2.18, 2.05, 1.96].map(function (v, i) { return { est: String(62 + i), reg: "RC-SC-" + (21 + i), idade: "7", cp1: A.nstr(v, 2) }; }));
        d.ext = [1.92, 2.15, 1.88, 2.02, 2.24, 1.97].map(function (v, i) { return { est: String(59 + i), reg: "Testemunho T" + (i + 1) + " (14 d)", v: A.nstr(v, 2) }; });
        var pos = ["BD", "eixo", "BE", "eixo"];
        for (var i = 0; i <= 16; i++) {
          var e = String(58 + Math.floor(i / 2)) + (i % 2 ? "+10" : "");
          d.umid.push({ est: e, reg: "Speedy", v: A.nstr(10.3 * (1 + [0.03, -0.05, 0.02, 0.06, -0.01][i % 5]), 1) });
          d.gc.push({ est: e, pos: pos[i % 4], reg: "DNIT 458 — furo " + (i + 1), gc: A.nstr(100.1 + [0.2, -0.4, 0.5, -0.3, 0.1, 0.4][i % 6], 1) });
        }
        d.lim = [{ est: "60", reg: "LL/LP", ll: "34", ip: "12" }];
        d.comp = [{ est: "60", reg: "Proctor normal", gs: "1,919", hot: "10,3" }];
        var g = [];
        for (var j = 0; j <= 8; j++) g.push({ est: String(58 + j), pos: "eixo", larg: A.nstr(8.55, 2), esp: A.nstr(15.3 + (j % 3) * 0.2, 1) });
        d.geo = g;
        d.obs = "Resistências de 3 CPs importadas da DNER-ME 201 (um CP discrepante, 1,39 MPa); testemunhos extraídos aos 14 dias.";
        return d;
      } },
    ],
  });
})();
