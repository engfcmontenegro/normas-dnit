/*
 * Ficha de ES: DNIT 057/2004-ES — Sub-base de solo melhorado com cimento (pavimento rígido) — aceitação do trecho.
 * GC = GCmédio − k·s ≥ 100 % e ISC = ISCmédio − k·s ≥ 30 % e ≥ ISC de projeto (7.3.1, Tabela 1 = DNER-PRO 277), expansão ≤ 1 %
 * (5.1.4), umidade h ót ± 1 p.p. (7.3.3), grau de pulverização ≥ 80 % (7.3.2), teor de cimento ± 5 % (7.3.4), LL/IP (5.1.3),
 * frequências da 7.2 e controle geométrico (7.4).
 * Usa FE.aceitacaoG6 (definida em es-dnit-047-2004-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG6, num = FE.num, ok = FE.ok, sn = G.sn;
  var ID = "dnit-057-2004-es";
  function pista(P) { return P.mistura === "pista"; }
  function dias(P) { var x = num(P.dias); return ok(x) ? x : 1; }
  var crit = [
    sn("cim", "Cimento Portland (NBR 5732, 11578, 5735 ou 5736), recebido conforme DNIT 050-EM", "4.3; 5.1.1", "Materiais", "certificado / recebimento"),
    { id: "umid", texto: "Umidade antes da compactação", secao: "5.3.1; 7.3.3", grupo: "Controle da execução", tipo: "valor", unid: "%", casas: 1, falha: "nao_conforme", metodo: "DNIT 456 (DNER-ME 052/088)",
      min: function (P) { var h = num(P.hOt); return ok(h) ? h - 1 : NaN; }, max: function (P) { var h = num(P.hOt); return ok(h) ? h + 1 : NaN; },
      importar: { de: "dnit-456-2025-me", valores: function (e) { var r = e.resultados || {}; return ok(r.w) ? [{ v: r.w, est: (e.dados.ident || {}).local || "" }] : []; } },
      freq: { por: "extensao", a_cada: 10 } },
    { id: "p48", texto: "Pulverização na central — material miúdo passando na peneira de 4,8 mm", secao: "5.3.1; 7.2.1 e", grupo: "Controle da execução", tipo: "valor", unid: "%", casas: 0, min: 60, falha: "ressalva",
      metodo: "NBR 7217", se: function (P) { return !pista(P); }, freq: { por: "area", a_cada: 2500 },
      freqG: function (P, L) { return { exigido: Math.max(A.nMin(L.area, 2500, 1), dias(P)), regra: "1 a cada 2 500 m²; mín. 1 por dia" }; } },
    { id: "gp", texto: "Grau de pulverização (mistura na pista)", secao: "5.3.2 b; 7.3.2", grupo: "Controle da execução", tipo: "valor", unid: "%", casas: 0, min: 80, falha: "nao_conforme",
      se: pista, freq: { por: "area", a_cada: 1000 },
      freqG: function (P, L) { return { exigido: Math.max(A.nMin(L.area, 1000, 1), 2 * dias(P)), regra: "1 a cada 1 000 m²; mín. 2 por dia" }; } },
    { id: "teor", texto: "Teor de cimento (mistura na pista)", secao: "7.2.2 b; 7.3.4", grupo: "Controle da execução", tipo: "valor", unid: "%", casas: 2, falha: "nao_conforme", se: pista,
      min: function (P) { var t = num(P.teorProj); return ok(t) ? t * 0.95 : NaN; }, max: function (P) { var t = num(P.teorProj); return ok(t) ? t * 1.05 : NaN; },
      freq: { por: "tempo", a_cada: 1 }, freqG: function (P) { return { exigido: dias(P), regra: "1 por dia" }; } },
    sn("tempo", "Tempo entre a mistura pronta na central e o início da compactação ≤ 1 h (salvo comprovação por ensaio)", "5.3.1", "Execução", "≤ 1 h", "ressalva", function (P) { return !pista(P); }),
    sn("faixa", "Faixa pulverizada não excede a tratável em 2 dias; água incorporada progressivamente (≤ 2 p.p. por passada) e em até 3 h", "5.3.2 b, e", "Execução", "conforme 5.3.2", "ressalva", pista),
    sn("comp", "Compactação uniforme em toda a largura; superfície preparada (drenagem, nivelamento, seção)", "5.3.1", "Execução", "conforme projeto"),
  ];
  G.criarFicha({
    id: ID,
    titulo: "Sub-base de solo melhorado com cimento — aceitação do trecho",
    resumo: "GC e ISC com controle estatístico (7.3.1: X̄ − k·s, Tabela 1), reensaio do GC, expansão, umidade (h ót ± 1), pulverização, teor de cimento, LL/IP, frequências da 7.2 e geometria (7.4).",
    lote: { largura: true, dias: true },
    params: [{ k: "mistura", r: "Processo de mistura", tipo: "select", recarrega: true, opcoes: [["central", "Mistura em central (5.3.1)"], ["pista", "Mistura na pista (5.3.2)"]] },
      { k: "teorProj", r: "Teor de cimento da dosagem (%)", dica: "máx. 5 % em relação à massa de solo seco (5.1.4 e)", se: function (d) { return pista(d.params || {}); } }].concat(G.paramInsumos),
    padrao: { mistura: "central", gcMin: "100", gcReens: "nao", insumos: "lote" },
    criterios: crit,
    preparar: G.preparaHot,
    componentes: [
      G.compProctor({ energia: "intermediária", secao: "5.3.1; 7.2.1 b", importar: ["dnit-164-2013-me", "dner-me-216-94"] }),
      G.compGC({ secao: "7.2.1 a, b", secAuto: "7.3.1.1", secSup: "7.3.1.2", energia: "intermediária", reensaio: "todos100" }),
      G.compISC({ secao: "7.2.1 f" }),
      G.compLimites({ secao: "7.2.1 d" }),
      G.compAgua({ secao: "5.1.2" }),
      G.compGeometria({ modo: "subbase", secao: "7.4", medicao: "minMedia", secMed: "8", base: "camada subjacente",
        provEsp: "Espessura média inferior à de projeto: as partes interessadas definem a decisão (7.4)." }),
    ],
    extra: function (ctx) {
      var t = num(ctx.P.teorProj);
      if (pista(ctx.P) && ok(t) && t > 5) ctx.avisos.push("Teor de cimento da dosagem acima de 5 % da massa de solo seco (5.1.4 e).");
    },
    notas: "Critérios da DNIT 057/2004-ES. GC = GCmédio − k·s ≥ 100 % (energia intermediária) e ISC = ISCmédio − k·s ≥ 30 % e ≥ ISC de projeto (7.3.1), k da Tabela 1 (" + G.K277_TXT + "; n = 11, ausente, usa k de n = 10; n < 5: valores individuais). " +
      "GC sem aceitação automática: se todos os valores individuais ≥ 100 %, reensaio com ≥ 6 determinações (aceito se GC ≥ 100 % ou todos ≥ 100 %); senão, rebater. ISC sem aceitação automática: material rejeitado. " +
      "Expansão ≤ 1 % (5.1.4); umidade = h ót ± 1 p.p. (7.3.3); GP ≥ 80 % (7.3.2, mistura na pista) e 60 % passando na 4,8 mm na central (5.3.1); teor de cimento ± 5 % do teor da dosagem (7.3.4, adotado relativo). " +
      "LL ≤ 40 % e IP ≤ 18 % são preferenciais (5.1.3) → ressalva. Geometria (7.4): largura ± 10 cm; ≥ 6 espessuras a ≤ 20 m, média ≥ projeto e (maior − menor) ≤ 1 cm. Frequências (7.2): densidade in situ e umidade a cada 10 m; " +
      "compactação e ISC a cada 2 500 m²; LL/LP a cada 2 500 m² (mín. 1/dia).",
    exemplos: [
      { nome: "Trecho aceito — mistura em central, 200 m × 8,5 m", dados: function () {
        var F = FE.FICHAS[ID];
        var d = { ident: { registro: "LOTE-SM-001", data: "2026-01-20", obra: "Obra A — BR-000", trecho: "Sub-base — lote 1", local: "Est. 10 a 20", origem: "Jazida 1", camada: "Sub-base de solo melhorado com cimento (3 %)" },
          params: Object.assign({}, F.padrao, { estIni: "10", estFim: "20", largura: "8,50", dias: "1", largProj: "8,50", espProj: "15", iscProj: "30" }),
          verificacoes: G.verifEx(F), umid: [], p48: [], gc: [], isc: [{}], lim: [{}], comp: [{}], agua: [{}] };
        A.exemplos.importar(F.params, d, "impComp", [["dnit-164-2013-me", 0]]);
        d.comp[0].est = "12";
        var h = Math.round(num(d.comp[0].hot) * 10) / 10, pos = ["BD", "eixo", "BE", "eixo"];
        d.umid = []; d.gc = [];
        for (var i = 0; i <= 20; i++) {
          var e = String(10 + Math.floor(i / 2)) + (i % 2 ? "+10" : "");
          d.umid.push({ est: e, reg: "Speedy", v: A.nstr(h + [0.3, -0.4, 0.6, -0.2, 0.1, 0.5, -0.6, 0.2][i % 8], 1) });
          d.gc.push({ est: e, pos: pos[i % 4], reg: "DNIT 458 — furo " + (i + 1), gc: A.nstr(101.2 + [0.4, -0.6, 0.9, 0.1, -0.3, 0.7, -0.1, 0.5, 0.2][i % 9], 1) });
        }
        A.exemplos.importar(F.params, d, "impISC", [["dnit-172-2016-me", 0]]);
        d.isc[0].est = "15";
        A.exemplos.importar(F.params, d, "impLim", [["dner-me-082-94", 0]]);
        d.p48 = [{ est: "14", reg: "NBR 7217", v: "72" }];
        A.exemplos.importar(F.params, d, "impAgua", [["dnit-036-2004-me", 0]]);
        var g = [];
        for (var j = 0; j <= 10; j++) g.push({ est: String(10 + j), pos: "eixo", larg: A.nstr(8.55 + (j % 3) * 0.02, 2), esp: A.nstr(15.3 + (j % 4) * 0.15, 1) });
        d.geo = g;
        d.obs = "Compactação de referência (DNIT 164), ISC (DNIT 172), LL/IP e água importados dos exemplos das fichas ME; densidades e umidades de campo digitadas.";
        return d;
      } },
      { nome: "Trecho rejeitado — mistura na pista: GC com valores < 100 %, GP < 80 % e teor de cimento fora de ± 5 %", dados: function () {
        var F = FE.FICHAS[ID];
        var d = { ident: { registro: "LOTE-SM-002", data: "2026-02-03", obra: "Obra A — BR-000", trecho: "Sub-base — lote 2", local: "Est. 20 a 26", origem: "Subleito local", camada: "Sub-base de solo melhorado com cimento (4 %)" },
          params: Object.assign({}, F.padrao, { mistura: "pista", teorProj: "4", estIni: "20", estFim: "26", largura: "8,50", dias: "1", largProj: "8,50", espProj: "15", hOt: "12,5", insumos: "previo", insumosReg: "RI-01" }),
          verificacoes: G.verifEx(F), umid: [], gp: [], teor: [], gc: [], isc: [], lim: [], comp: [] };
        var pos = ["BD", "eixo", "BE", "eixo"];
        for (var i = 0; i <= 12; i++) {
          var e = String(20 + Math.floor(i / 2)) + (i % 2 ? "+10" : "");
          d.umid.push({ est: e, reg: "Speedy", v: A.nstr(12.5 + [0.4, -0.7, 1.4, 0.2, -0.3][i % 5], 1) });
          d.gc.push({ est: e, pos: pos[i % 4], reg: "DNIT 458 — furo " + (i + 1), gc: A.nstr([100.4, 98.7, 101.1, 99.5, 100.8, 97.9, 100.2][i % 7], 1) });
        }
        d.gp = [{ est: "21", reg: "GP", v: "84" }, { est: "25", reg: "GP", v: "76" }];
        d.teor = [{ est: "23", reg: "titulação", v: "3,62" }];
        d.isc = [{ est: "22", reg: "ISC-0801", isc: "38", exp: "0,4" }, { est: "25", reg: "ISC-0802", isc: "33", exp: "0,6" }];
        d.lim = [{ est: "21", reg: "LL/LP", ll: "36", ip: "14" }];
        d.comp = [{ est: "22", reg: "Proctor intermediário", gs: "1,842", hot: "12,5" }];
        var g = [];
        for (var j = 0; j <= 6; j++) g.push({ est: String(20 + j), pos: "eixo", larg: A.nstr(8.56, 2), esp: A.nstr([15.2, 14.6, 15.1, 14.9, 15.8, 14.7, 15.0][j], 1) });
        d.geo = g;
        return d;
      } },
    ],
  });
})();
