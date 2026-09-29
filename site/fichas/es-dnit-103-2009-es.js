/*
 * Ficha de ACEITAÇÃO: DNIT 103/2009-ES — Proteção do corpo estradal — Estruturas de arrimo com gabião.
 * Funções comuns: FE.aceitacaoG7 (es-dnit-104-2009-es.js).
 *
 * O que a ES manda (seções do PDF):
 *   5.1.1 malha hexagonal de dupla torção, arame zincado (NBR 8964); revestimento de PVC com espessura mínima de 0,4 mm
 *         (NBR 10514) em ambientes quimicamente corrosivos.
 *   5.1.2 pedra de mão de rocha sã, não friável, granulometria uniforme, menor dimensão entre 1 e 2 vezes a malha; aconselhável
 *         peso específico ≥ 2.300 kg/m³ (p. 3).
 *   5.3   montagem, enchimento com mínimo de vazios, fechamento e amarração; plastificados: sem danos ao PVC, costura plastificada.
 *   7.1.1 certificado do fabricante para cada lote de malha/arame que chegar à obra.   7.1.2 pedra: exame visual/testes expeditos.
 *   7.2.1 medidas das caixas com variação de até 1,0 %; posição das caixas até 10 cm do projeto (trena/topografia) (p. 4).
 *   7.2.2 montagem visual: mínimo de vazios, gaiola paralelepipédica, arestas fechadas com o fio especificado.
 *   7.3   medidas geométricas externas do muro com tolerância de 10 % em medidas isoladas e posicionamento de projeto (p. 5).
 *   7.4   controle das medidas externas e do posicionamento; controle estatístico conforme DNER-PRO 277 (sem critério numérico na ES).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G7 = FE.aceitacaoG7, num = FE.num, ok = FE.ok;
  var ID = "dnit-103-2009-es";

  A.fichaSimples({
    id: ID,
    titulo: "Estruturas de arrimo com gabião — aceitação",
    resumo: "Aplica a DNIT 103/2009-ES: certificados da malha e dos arames (um por lote de material), pedra de mão (1 a 2 vezes a malha; ≥ 2.300 kg/m³ aconselhável), " +
      "revestimento de PVC ≥ 0,4 mm, medidas das caixas (± 1,0 %) e posicionamento (10 cm), montagem (visual) e medidas externas do muro (± 10 %).",
    lote: { largura: false },
    params: [
      { k: "tipo", r: "Tipo de gabião (4.2)", tipo: "select", opcoes: [["caixa", "Caixa"], ["reno", "Colchão Reno"], ["saco", "Cilíndrico (saco / bolsa)"]] },
      { k: "pvc", r: "Malha revestida com PVC (ambiente corrosivo)?", tipo: "select", recarrega: true, opcoes: [["nao", "Não — só galvanizada"], ["sim", "Sim — plastificada"]] },
      { k: "malha", r: "Dimensão da malha (cm)", ph: "ex.: 8", dica: "a menor dimensão da pedra de mão deve estar entre 1 e 2 vezes a malha (5.1.2)" },
      { k: "lotesMat", r: "Lotes de malha/arame recebidos na obra", ph: "1", dica: "7.1.1: um certificado para cada lote" },
    ],
    padrao: { tipo: "caixa", pvc: "nao", lotesMat: "1" },
    refs: { reprova: "7.4", atende: "7.4", corrige: "7.4", regra: "7.4", tabela: "—" },
    criterios: [
      { id: "cert", grupo: "Insumos (7.1)", texto: "Certificado do fabricante da malha e dos arames (NBR 8964, zincagem)", secao: "7.1.1; 5.1.1", tipo: "sim_nao",
        exigido: "um certificado por lote", freq: { por: "contagem", a_cada: 1, qtd: "lotesMat", unidade: "lote(s)", regra: "1 certificado por lote de material (7.1.1)" } },
      { id: "pvc", grupo: "Insumos (7.1)", texto: "Espessura do revestimento de PVC", secao: "5.1.1", tipo: "valor", unid: "mm", casas: 2, min: 0.4, metodo: "NBR 10514 / certificado",
        se: function (P) { return P.pvc === "sim"; }, naoAplicaPor: "malha só galvanizada" },
      { id: "pedra", grupo: "Insumos (7.1)", texto: "Pedra de mão de rocha sã, não friável, granulometria uniforme (visual / testes expeditos)", secao: "7.1.2; 5.1.2", tipo: "sim_nao" },
      { id: "relPedra", grupo: "Insumos (7.1)", texto: "Menor dimensão da pedra de mão / dimensão da malha", secao: "5.1.2", tipo: "valor", unid: "×", casas: 2, min: 1, max: 2,
        exigido: "1 a 2 vezes a malha" },
      { id: "peso", grupo: "Insumos (7.1)", texto: "Peso específico da pedra", secao: "5.1.2", tipo: "valor", unid: "kg/m³", casas: 0, min: 2300, falha: "ressalva",
        exigido: "≥ 2.300 kg/m³ (aconselhável)" },
      { id: "cxDim", grupo: "Controle da execução (7.2)", texto: "Variação das medidas geométricas das caixas", secao: "7.2.1", tipo: "valor", unid: "%", casas: 1, min: -1, max: 1,
        exigido: "até ± 1,0 %", metodo: "trena" },
      { id: "cxPos", grupo: "Controle da execução (7.2)", texto: "Afastamento das caixas em relação à posição de projeto", secao: "7.2.1", tipo: "valor", unid: "cm", casas: 1, max: 10,
        exigido: "≤ 10 cm", metodo: "trena / topografia" },
      { id: "mont", grupo: "Controle da execução (7.2)", texto: "Montagem: mínimo de vazios, gaiola paralelepipédica, arestas fechadas e costuradas com o fio especificado", secao: "7.2.2; 5.3",
        tipo: "sim_nao" },
      { id: "pvcDano", grupo: "Controle da execução (7.2)", texto: "PVC sem danos no manuseio; costura com fio plastificado", secao: "5.3.2; 5.3.4", tipo: "sim_nao",
        se: function (P) { return P.pvc === "sim"; }, naoAplicaPor: "malha só galvanizada" },
      { id: "muro", grupo: "Verificação do produto (7.3)", texto: "Variação das medidas geométricas externas do muro (medidas isoladas)", secao: "7.3", tipo: "valor", unid: "%", casas: 1,
        min: -10, max: 10, exigido: "até ± 10 %", metodo: "trena / topografia" },
      { id: "muroPos", grupo: "Verificação do produto (7.3)", texto: "Posicionamento do muro conforme o projeto", secao: "7.3; 7.4", tipo: "sim_nao" },
      G7.ambiental("6", "6", "Verificação do produto (7.3)"),
    ],
    extra: function (ctx) {
      G7.ocultar(ctx, ["pvc", "pvcDano"]);
    },
    notas: "Critérios da DNIT 103/2009-ES, seção 7. Variações das caixas (± 1,0 %) e das medidas externas do muro (± 10 %) digitadas como (medida − projeto)/projeto × 100, por valor individual. " +
      "Peso específico ≥ 2.300 kg/m³ é \"aconselhável\" (ressalva). A razão pedra/malha usa a menor dimensão da pedra. 7.4 remete ao controle estatístico da DNER-PRO 277 sem dar critério: valores individuais. Frequência não fixada pela ES (1 por lote adotado), exceto os certificados (1 por lote de material).",
    exemplos: [
      { nome: "Muro de gabião caixa aceito — 3 lotes de malha, pedra e geometria conformes", dados: function () {
        return { ident: { registro: "GAB-01", data: "2026-04-14", obra: "Obra A", trecho: "Muro de arrimo 1", local: "Est. 230 a 233" },
          params: { estIni: "230", estFim: "233", tipo: "caixa", pvc: "nao", malha: "8", lotesMat: "3" },
          verificacoes: [{ atende: "S", real: "3" }, { atende: "S", real: "2" }, { atende: "S", real: "4" }, {}, { atende: "S", real: "2" }, { atende: "S" }],
          relPedra: [{ pos: "amostra 1", v: "1,50" }, { pos: "amostra 2", v: "1,75" }],
          peso: [{ reg: "Laboratório", v: "2650" }],
          cxDim: [{ est: "230", v: "0,5" }, { est: "231", v: "-0,8" }, { est: "232", v: "0,3" }, { est: "233", v: "0,9" }],
          cxPos: [{ est: "230", v: "4" }, { est: "232", v: "7" }],
          muro: [{ pos: "comprimento", v: "1,2" }, { pos: "altura", v: "-2,5" }, { pos: "base", v: "3,0" }] };
      } },
      { nome: "Gabião plastificado rejeitado — certificado faltando, PVC fino e caixa fora de 1 %", dados: function () {
        return { ident: { registro: "GAB-02", data: "2026-05-20", obra: "Obra B", trecho: "Proteção de margem", local: "Est. 15 a 18" },
          params: { estIni: "15", estFim: "18", tipo: "reno", pvc: "sim", malha: "6", lotesMat: "2" },
          verificacoes: [{ atende: "S", real: "1" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }],
          pvc: [{ reg: "Certificado", v: "0,35" }],
          relPedra: [{ pos: "amostra 1", v: "1,30" }, { pos: "amostra 2", v: "2,20" }],
          peso: [{ reg: "Laboratório", v: "2250" }],
          cxDim: [{ est: "15", v: "0,6" }, { est: "16", v: "1,8" }],
          cxPos: [{ est: "16", v: "6" }],
          muro: [{ pos: "comprimento", v: "2,0" }] };
      } },
    ],
  });
})();
