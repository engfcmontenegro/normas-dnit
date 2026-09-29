/*
 * Ficha de ES: DNER-ES 346/97 — Edificações — Estruturas (aceitação: seção 6 — controle do material, da execução,
 * resistência do concreto pela NBR 6118/80 15.1.1, verificação final e aceitação 6.4).
 * Usa FE.aceitacaoG10a (definido em es-dner-es-344-97.js) e FE.aceitacao (es-comum.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG10a, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var sn = G.sn, v = G.v, ID = "dner-es-346-97";

  G.ficha({
    id: ID, es: "DNER-ES 346/97", secAceit: "6.4", secRejeita: "6.4.2", secRefazer: "6.4.3",
    titulo: "Edificações — estruturas de concreto — aceitação",
    resumo: "Materiais e formas, lançamento (altura ≤ 2,0 m, ≤ 1 h após o amassamento), adensamento, juntas, cura (≥ 7 dias; vapor 38–66 °C), prazos de desforma, abatimento e resistência (1 exemplar de 2 CPs a cada 25 m³, mínimos por elemento, fck,est pela NBR 6118/80 15.1.1), cotas e dimensões (6.3).",
    params: [
      { k: "volume", r: "Volume de concreto aplicado no lote (m³)", dica: "1 exemplar a cada 25 m³ (6.2.2)" },
      { k: "fund", r: "O lote inclui fundações? (6.2.3)", tipo: "select", opcoes: G.SN, dica: "mínimo de 8 exemplares nas fundações" },
      { k: "tetos", r: "Nº de tetos (lajes com vigas) do lote (6.2.3)", dica: "mínimo de 4 exemplares por teto" },
      { k: "pavPilar", r: "Nº de pavimentos com pilares no lote (6.2.3)", dica: "mínimo de 4 exemplares nas extremidades dos pilares de cada pavimento" },
      { k: "retard", r: "Aditivo retardador de pega? (5.4.7)", tipo: "select", recarrega: true, opcoes: G.SN },
      { k: "prazoLanc", r: "Prazo de lançamento com retardador (min)", se: function (d) { return (d.params || {}).retard === "S"; }, dica: "função das características do aditivo (5.4.7)" },
      { k: "faceInf", r: "Há peças com faces inferiores (lajes, vigas)? (5.4.22 b–c)", tipo: "select", recarrega: true, opcoes: G.SN },
      { k: "vapor", r: "Cura a vapor? (5.4.21)", tipo: "select", recarrega: true, opcoes: G.SN },
      { k: "cobrProj", r: "Cobrimento mínimo de projeto (mm)", dica: "NBR 6118/80, 6.3.3.1 (5.2.6); ES 5.2.7 para estruturas resistentes ao fogo" },
    ].concat(G.PARAMS_CONCRETO),
    padrao: { fund: "N", faceInf: "S", retard: "N", vapor: "N" },
    criterios: [
      sn("receb", "6.1", "Controle de recebimento dos materiais", "conforme DNER-ES 330/97"),
      sn("compat", "5.1", "Compatibilização estrutura × fundações", "projetos compatibilizados"),
      sn("aco", "5.2.4; 5.2.9", "Estado das barras de aço e esperas", "sem excesso de ferrugem, óleo, argamassa aderente ou substâncias que prejudiquem a aderência"),
      sn("plataf", "5.2.5; 5.2.18", "Plataformas e andaimes", "firmes e rígidos; sem deslocar as armaduras"),
      sn("afast", "5.2.6", "Armadura afastada da forma", "sem contato direto com a forma (distância mínima da NBR 6118/80)"),
      sn("cimPeso", "5.2.11", "Medição do cimento", "em peso (proibido em volume)"),
      sn("formas", "5.2.12–5.2.15", "Formas e escoramentos", "NBR 7190; sem deformações; contraflecha nos grandes vãos; limpas e estanques"),
      sn("molhar", "5.2.16; 5.2.17", "Formas molhadas até a saturação; desmoldante antes da armadura", "conforme 5.2.16 e 5.2.17"),
      sn("aditivo", "5.2.19", "Aditivos identificados", "fabricante idôneo; marca, procedência e composição indicadas"),
      sn("equip", "5.2.20", "Equipamento mínimo", "1 betoneira (dispensável com concreto pré-misturado) e 2 vibradores"),
      sn("dosagem", "5.2.21", "Dosagem experimental (racional)", "traço que atenda ao fck do projeto"),
      sn("transp", "5.4.1–5.4.4", "Transporte do concreto", "sem segregação ou perdas; sem carrinhos de roda de ferro/borracha maciça; bomba com tubo ≥ 3 × Dmáx"),
      sn("pega", "5.4.8; 5.4.9", "Lançamento antes do início da pega; sem remistura", "nenhum lançamento após o início da pega; concreto não remisturado"),
      sn("adens", "5.4.10–5.4.12", "Adensamento mecânico", "vibradores (sem adensamento manual); sem vibrar a armadura"),
      sn("juntas", "5.4.13–5.4.18", "Juntas de concretagem", "fora dos planos de cisalhamento; vigas no terço médio; lajes no terço médio do maior vão; junta limpa e saturada"),
      sn("escor", "5.4.23", "Retirada do escoramento", "progressiva, com cuidado nos balanços"),
      sn("prumo", "5.4.24", "Prumo e nível das formas durante a concretagem", "verificação permanente; correção imediata"),
      sn("geom", "6.3", "Cotas, alinhamentos e dimensões das peças", "conforme as indicações do projeto"),
      v("altLanc", "5.4.5", "Altura de lançamento em queda livre", "m", 2, undefined, 2.0, { exigido: "≤ 2,0 m (acima: calhas, janelas, funis ou trombas)" }),
      v("tLanc", "5.4.7", "Tempo entre o fim do amassamento e o lançamento", "min", 0, undefined,
        function (P) { var t = num(P.prazoLanc); return P.retard === "S" && ok(t) ? t : 60; }, { exigido: "≤ 60 min (ou o prazo do retardador)" }),
      v("cura", "5.4.19", "Duração da cura", "dias", 0, 7, undefined),
      v("tVapor", "5.4.21", "Temperatura da cura a vapor", "°C", 0, 38, 66, { se: G.sim("vapor"), naoAplicaPor: "sem cura a vapor" }),
      v("desfLat", "5.4.22 a", "Prazo de retirada das formas — faces laterais", "dias", 0, 3, undefined),
      v("desfInf", "5.4.22 b", "Prazo de retirada das formas — faces inferiores", "dias", 0, 14, undefined, { se: G.sim("faceInf"), naoAplicaPor: "sem faces inferiores no lote" }),
      v("desfSem", "5.4.22 c", "Prazo de retirada — faces inferiores sem pontaletes", "dias", 0, 21, undefined, { se: G.sim("faceInf"), naoAplicaPor: "sem faces inferiores no lote" }),
      v("cobr", "5.2.6", "Cobrimento das armaduras (medido)", "mm", 0, function (P) { var c = num(P.cobrProj); return ok(c) ? c : undefined; }, undefined),
      G.abat({ secao: "5.2.3; 5.2.22 c" }),
      G.fc({ secao: "6.2.1; 6.2.2", freq: { por: "volume", a_cada: 25, qtd: "volume", unidade: "m³" } }),
    ],
    extra: function (ctx) {
      var P = ctx.P;
      G.fckEst(ctx, { es: "DNER-ES 346/97", secExemplar: "6.2.2", secFreq: "6.2.2/6.2.3", secControle: "6.2.1" });
      // 6.2.3: mínimos por elemento da estrutura
      var nEl = (P.fund === "S" ? 8 : 0) + 4 * (num(P.tetos) || 0) + 4 * (num(P.pavPilar) || 0);
      if (nEl > 0) {
        var real = ctx.item.fc ? ctx.item.fc.n || 0 : 0;
        ctx.freqs.push(A.frequencia({ ensaio: "Exemplares por elemento da estrutura (6.2.3)", metodo: "DNER-ME 091", exigido: nEl, realizado: real,
          regra: [P.fund === "S" ? "8 nas fundações" : "", num(P.tetos) ? "4 × " + fmt(num(P.tetos), 0) + " teto(s)" : "", num(P.pavPilar) ? "4 × " + fmt(num(P.pavPilar), 0) + " pavimento(s) de pilares" : ""].filter(Boolean).join(" + ") }));
      }
    },
    notas: "Resistência (6.2.1): a ES remete ao 15.1.1 da NBR 6118/80; a ficha calcula o estimador fck,est = 2·(f1 + … + fm−1)/(m − 1) − fm (exemplares de 28 dias em ordem crescente, m = n/2, desprezado o maior valor se n for ímpar; n ≥ 6); se ficar abaixo do fck, o limite inferior ψ6·f1 da mesma norma só é aplicado quando o ψ6 for informado (senão o critério fica pendente). Cada exemplar = 2 corpos de prova (6.2.2); vale o maior dos dois (resultado \"por exemplar\" da ficha da DNER-ME 091). Frequência: 1 exemplar a cada 25 m³ (6.2.2) e os mínimos por elemento do 6.2.3 (8 nas fundações, 4 por teto com as vigas, 4 nas extremidades dos pilares de cada pavimento). Prazos de desforma (5.4.22), cura (5.4.19) e altura de lançamento (5.4.5) como valores mínimos/máximos individuais.",
    exemplos: [
      { nome: "Laje e vigas do 1º teto (C25) — aceito", dados: function () {
        var P = { servico: "Bloco A — 1º teto (laje L1–L6 e vigas)", volume: "48", fund: "N", tetos: "1", pavPilar: "0", faceInf: "S", retard: "N", vapor: "N", cobrProj: "20", fck: "25", slump: "100", slumpTol: "20" };
        return { ident: { registro: "ED-EST-01", obra: "Obra A", local: "Bloco A — 1º teto", data: "2026-07-08" }, params: P, verificacoes: G.verif(ID, {}, P),
          altLanc: [{ est: "Laje L2", v: "1,2" }, { est: "Viga V4", v: "1,6" }],
          tLanc: [{ est: "Caminhão 1", v: "35" }, { est: "Caminhão 2", v: "42" }, { est: "Caminhão 3", v: "50" }],
          cura: [{ est: "Laje", v: "7" }], desfLat: [{ est: "Vigas", v: "3" }], desfInf: [{ est: "Laje", v: "15" }], desfSem: [{ est: "Laje L6 (balanço)", v: "21" }],
          cobr: [{ est: "Laje L1", v: "22" }, { est: "Viga V2", v: "25" }, { est: "Viga V5", v: "21" }],
          abat: [{ est: "Caminhão 1", reg: "NF 3101", v: "95" }, { est: "Caminhão 2", reg: "NF 3102", v: "105" }, { est: "Caminhão 3", reg: "NF 3103", v: "110" }],
          fc: [["26,4", "L1"], ["27,9", "L2"], ["25,8", "L3"], ["28,6", "L4"], ["27,1", "V2"], ["29,3", "V4"]].map(function (x, i) {
            return { est: x[1], reg: "Exemplar " + (i + 1) + " (2 CPs, maior valor)", v: x[0] }; }) };
      } },
      { nome: "Pilares — desforma antecipada e fck,est abaixo do fck — rejeitado", dados: function () {
        var P = { servico: "Bloco B — pilares do térreo", volume: "30", fund: "N", tetos: "0", pavPilar: "1", faceInf: "N", retard: "N", vapor: "N", cobrProj: "25", fck: "30", psi6: "0,89", slump: "100", slumpTol: "20" };
        var d = { ident: { registro: "ED-EST-02", obra: "Obra B", local: "Bloco B — térreo", data: "2026-08-19" }, params: P,
          verificacoes: G.verif(ID, { adens: { atende: "N", real: "2", nc: "1", obs: "adensamento manual no pilar P7" } }, P),
          altLanc: [{ est: "P3", v: "2,8" }], tLanc: [{ est: "Caminhão 1", v: "55" }, { est: "Caminhão 2", v: "75" }],
          cura: [{ est: "Pilares", v: "5" }], desfLat: [{ est: "Pilares", v: "2" }],
          cobr: [{ est: "P1", v: "25" }, { est: "P7", v: "18" }],
          abat: [{ est: "Caminhão 1", v: "105" }, { est: "Caminhão 2", v: "115" }], fc: [] };
        FE.aceitacao.exemplos.importar(FE.FICHAS[ID].params, d, "imp_fc", [["dner-me-091-98", 2]]);
        d.fc = d.fc.concat([["27,4", "P1–P2"], ["28,2", "P3–P4"], ["26,5", "P5–P6"], ["29,0", "P7–P8"]].map(function (x, i) {
          return { est: x[1], reg: "Exemplar " + (i + 1) + " (2 CPs)", v: x[0] }; }));
        return d;
      } },
    ],
  });
})();
