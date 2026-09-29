/*
 * Ficha de ACEITAÇÃO DE LOTE: DNIT 142/2022-ES — Base de solo melhorado com cimento.
 * Usa o construtor comum FE.aceitacaoG2.soloMelhorado (es-dnit-140-2022-es.js): o texto da 142 é o da 140 com:
 *   5.2   expansão ≤ 0,5 %; empírico: ISC ≥ 80 %, LL ≤ 25 %, IP ≤ 6 %.
 *   5.1.3 / Anexo A (informativo) faixas A–D de referência para a seleção do solo (NOTA 2: exemplificativas).
 *   7.3.2 a compactação na energia MODIFICADA (Método C da DNIT 164); b) GC ≥ 100 %.
 *   7.3.3 deflexão: Dc = D̄ + k·S ≤ LSE, n ≥ 15, k da Tabela B1 (Anexo B, normativo) = A.K_DNIT.
 *   7.4 geometria; 7.6 conformidade (X̄ ± k·s).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G2 = FE.aceitacaoG2;
  var ID = "dnit-142-2022-es";
  G2.soloMelhorado({
    id: ID, codigo: "DNIT 142/2022-ES", tabela: "B1", energia: "energia modificada", metodoC: "Método C", expMax: 0.5, iscMin: 80,
    gcMin: 100, secGC: "7.3.2 b", notaMR: "4", faixaRef: true,
    gcTxt: "7.3.2 b: ≥ 100 %",
    titulo: "Base de solo melhorado com cimento — aceitação de lote",
    resumo: "Reúne os ensaios do lote (importados das fichas ME ou digitados), confere a frequência e aplica os critérios da DNIT 142/2022-ES: umidade (h ót ± 1), " +
      "expansão ≤ 0,5 %, ISC ≥ 80 %, LL ≤ 25 %, IP ≤ 6 % (projeto empírico), GC ≥ 100 % (energia modificada), pulverização ≥ 50 %, tempos, finura do cimento, " +
      "MR (mecanicista), deflexão (Dc ≤ LSE) e controle geométrico, com o controle estatístico de 7.6 (Tabela B1). Faixas A–D do Anexo A só como referência.",
    notas: "DNIT 142/2022-ES. Umidade: \"± 1 %\" da h ót lido como ± 1 ponto percentual. Frequências: a ES remete ao plano de amostragem (7.5, DNER-PRO 277); " +
      "sem plano informado, a ficha exige 5 determinações (menor n da Tabela B1) de umidade e GC e 1 dos demais; MR a cada 1500 m (7.3.2 a); finura ≥ 1 por dia (7.1 c); " +
      "deflexão ≥ 15 (7.3.3). Faixas A–D (Tabela A1, Anexo A informativo, NOTA 2) só geram aviso. Na Tabela A1 a célula 3/8\" da faixa A aparece como \"30 - 65 65\" (adotado 30–65). " +
      "Métodos citados e substituídos: DNER-ME 092 → DNIT 458; DNER-ME 052/088 → DNIT 456; DNER-ME 080 → DNIT 412.",
    exemplos: function (F) {
      var X = G2.ex;
      function base(reg, extra) {
        return { ident: Object.assign({ registro: reg, data: "2026-08-18", obra: "Obra B — BR-000", origem: "Jazida 2 + cimento do Fornecedor A", camada: "Base de solo melhorado com cimento (4 %)" }, extra.ident || {}),
          params: Object.assign({}, F.padrao, extra.params), umid: [{}], comp: [{}], gc: [{}], gran: [{}], pulv: [{}], cim: [{}], fin: [{}], lim: [{}], obs: "" };
      }
      return [
        { nome: "Lote aceito — base 4 % de cimento, 240 m (ensaios dos exemplos ME + campo digitado)", dados: function () {
          var d = base("LOTE-BMC-01", { ident: { trecho: "Lote 1", local: "Est. 50 a 62" },
            params: { estIni: "50", estFim: "62", largura: "7,80", espessura: "16", lse: "60", jornadas: "2", faixa: "dnit-142-2022-es-B", taxaProj: "10,5" } });
          X.importar(F, d, "impComp", [["dnit-172-2016-me", 0]]);
          d.comp[0].est = "53";
          d.comp.push({ est: "59", reg: "ISC-0731 · DNIT 172 (digitado)", gs: "1,928", hot: "13,1", isc: "97", exp: "0,08" });
          d.umid = X.cols(["w"], [["51", 13.6], ["54", 13.1], ["56", 14.0], ["58", 13.5], ["61", 13.0]], { reg: "Campo — Speedy" });
          d.gc = [["50", "LD", 101.3], ["52", "eixo", 100.9], ["55", "LE", 102.2], ["57", "LD", 101.0], ["59", "eixo", 101.8], ["61", "LE", 100.7]]
            .map(function (x, i) { return { est: x[0], pos: x[1], reg: "DNIT 458 — furo " + (i + 1), gc: A.nstr(x[2], 1) }; });
          X.importar(F, d, "impGran", [["dnit-412-2025-me", 1]]);
          d.gran[0].est = "56";
          d.pulv = X.cols(["p4"], [["52", 72], ["58", 69]], { reg: "Peneira nº 4" });
          d.cim = X.cols(["taxa", "t1", "t2"], [["51", 10.7, 0.5, 2.0], ["57", 10.3, 0.7, 2.3]], { reg: "Bandeja / tempos" });
          d.fin = X.cols(["res"], [["canteiro", 12.1], ["canteiro", 11.4]], { reg: "NBR 16372" });
          X.importar(F, d, "impLim", [["dner-me-082-94", 0]]);
          d.defl = X.deflexoes(50, [41, 44, 38, 47, 43, 40, 45, 49, 42, 39, 46, 44, 41, 48, 43, 40]);
          d.defl.forEach(function (c, i) { c.est = A.fmtEstaca(1000 + i * 15, { simples: true }); });
          d.geo = X.secoes(50, [[7.84, 16.3, 3.1, 3.0], [7.82, 15.8, 3.2, 3.1], [7.86, 16.6, 3.0, 3.2], [7.81, 15.5, 3.1, 3.1], [7.85, 16.1, 3.3, 3.0], [7.83, 16.4, 3.2, 3.1],
            [7.80, 15.9, 3.0, 3.2], [7.84, 16.2, 3.1, 3.1], [7.87, 16.0, 3.2, 3.0], [7.82, 15.6, 3.3, 3.2], [7.83, 16.5, 3.1, 3.1], [7.85, 16.2, 3.0, 3.3], [7.81, 15.9, 3.2, 3.2]]);
          d.verif = X.verif(8);
          d.obs = "Exemplo: compactação/ISC (DNIT 172), granulometria (DNIT 412) e LL/IP (DNER-ME 082) importados dos exemplos das fichas ME; demais determinações digitadas.";
          return d;
        } },
        { nome: "Lote aceito com ressalva — um furo com GC abaixo de 100 % (estatística atendida); granulometria fora da faixa de referência (aviso)", dados: function () {
          var d = base("LOTE-BMC-02", { ident: { trecho: "Lote 2", local: "Est. 80 a 90" },
            params: { estIni: "80", estFim: "90", largura: "7,80", espessura: "16", lse: "60", faixa: "dnit-142-2022-es-A" } });
          X.importar(F, d, "impComp", [["dnit-172-2016-me", 0]]);
          d.comp[0].est = "85";
          d.umid = X.cols(["w"], [["81", 13.2], ["83", 14.0], ["85", 13.8], ["87", 14.3], ["89", 13.0]], { reg: "Campo — Speedy" });
          d.gc = [["80", "LE", 102.4], ["82", "eixo", 103.0], ["84", "LD", 99.6], ["86", "LE", 102.8], ["88", "eixo", 103.1], ["89", "LD", 102.2]]
            .map(function (x, i) { return { est: x[0], pos: x[1], reg: "DNIT 417 — ponto " + (i + 1), gc: A.nstr(x[2], 1) }; });
          X.importar(F, d, "impGran", [["dnit-412-2025-me", 1]]);
          d.gran[0].est = "84";
          d.pulv = X.cols(["p4"], [["83", 64]], { reg: "Peneira nº 4" });
          d.cim = X.cols(["taxa", "t1", "t2"], [["82", 10.4, 0.8, 2.6]], { reg: "Bandeja / tempos" });
          d.fin = X.cols(["res"], [["canteiro", 12.8]], { reg: "NBR 16372" });
          X.importar(F, d, "impLim", [["dner-me-082-94", 0]]);
          d.defl = X.deflexoes(80, [48, 52, 45, 55, 50, 47, 53, 49, 51, 46, 54, 50, 48, 52, 47, 51, 49, 53, 50, 48]).slice(0, 16);
          d.defl.forEach(function (c, i) { c.est = A.fmtEstaca(1600 + i * 12.5, { simples: true }); });
          d.geo = X.secoes(80, [[7.83, 16.1, 3.1, 3.1], [7.85, 15.7, 3.2, 3.0], [7.82, 16.4, 3.0, 3.1], [7.86, 15.9, 3.1, 3.2], [7.84, 16.2, 3.2, 3.1], [7.81, 16.6, 3.1, 3.0],
            [7.85, 15.8, 3.0, 3.1], [7.83, 16.3, 3.1, 3.2], [7.84, 16.0, 3.2, 3.1], [7.82, 15.6, 3.1, 3.0], [7.86, 16.5, 3.0, 3.1]]);
          d.verif = X.verif(8);
          d.obs = "Exemplo de ressalva: o ponto da estaca 84 (GC 99,6 %) deve ser corrigido localmente, embora X̄ − k·s ≥ 100 %. A curva média fica fora da faixa A de referência — só informativo (NOTA 2).";
          return d;
        } },
      ];
    },
  });
})();
