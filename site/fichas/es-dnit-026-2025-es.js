/*
 * Ficha de ACEITAÇÃO: DNIT 026/2025-ES — Drenagem — Caixas coletoras, caixas de ligação e passagem e bocas de bueiros.
 *
 * O que a ES manda (seções do PDF):
 *   4     sinalização; sem serviço em dia de chuva; escoramento obrigatório de vala > 1,25 m (NR-18, NBR 9061);
 *         sem projeto específico, dispositivos do Álbum de projetos-tipo (IPR 736).
 *   5.1   concreto NBR 6118/12655 com o fck do projeto; aço CA-50 (NBR 7480) nos elementos armados.
 *   5.3.1 locação topográfica; escavação nos alinhamentos, cotas e dimensões do projeto; superfície de assentamento
 *         apiloada, firme e desempenada; regularização compactada com controle de umidade; bota-fora sem prejudicar o
 *         escoamento; dispositivo protegido contra queda de materiais.
 *   5.3.2 caixas: lastro de concreto magro de 5 cm, fck ≥ 15 MPa; fôrmas, armaduras, vibração; fôrmas retiradas só após
 *         a cura; concreto magro elevando o fundo até a geratriz inferior do bueiro de saída; recomposição lateral
 *         compactada; tampas/grelhas após a limpeza total (NOTA 6: grelha de aço com tratamento antioxidante);
 *         NOTA 7: escada de marinheiro nas caixas coletoras.
 *   5.3.3 bocas: lastro de 5 cm (15 MPa); vigas de fundação, laje de fundo, alas e testa monolíticas, com vibração;
 *         canalização a montante e jusante verificada, erosões tratadas, valas de derivação e bacias de captação.
 *   7.1   controle do concreto (NBR 12655/6118); plano de retirada de CPs; consistência (NBR 16889 / 15823-2).
 *   7.2.1 seções transversais: diferença ≤ 1 % do projeto em pontos isolados; espessuras ± 10 % da de projeto.
 *   7.2.2 acabamento visual sem prejuízo hidráulico; embasamento e enchimento das valas acompanhados.
 *   7.3   fck,est ≥ fck → conformidade; fck,est < fck → não conformidade; detalhe mal executado deve ser corrigido.
 * fck,est pela ABNT NBR 12655 e controle geométrico: FE.aceitacaoDrenagem (definido em es-dnit-025-2025-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, D = FE.aceitacaoDrenagem, num = FE.num, fmt = FE.fmt;
  function tipo(P) { return P.tipo || "coletora"; }
  function caixa(P) { return tipo(P) !== "boca"; }
  function boca(P) { return tipo(P) === "boca"; }
  var GM = "Materiais (5.1)", GC = "Controle do concreto (7.1; 7.3)", GE = "Execução (4; 5.3)", GA = "Acabamento e meio ambiente (6; 7.2.2)";

  function preencher(F, d, falhas) {
    d.verificacoes = [];
    F.simples.criterios.filter(function (it) { return it.tipo === "sim_nao"; }).forEach(function (it) {
      if (it.se && !it.se(d.params)) { d.verificacoes.push({}); return; }
      d.verificacoes.push((falhas || {})[it.id] || { atende: "S", real: "1" });
    });
  }

  var F = A.fichaSimples({
    id: "dnit-026-2025-es",
    titulo: "Caixas coletoras, caixas de ligação e passagem e bocas de bueiros — aceitação (DNIT 026/2025-ES)",
    resumo: "Aceitação de caixa coletora, caixa de ligação e passagem ou boca de bueiro em concreto armado moldado in loco: materiais (5.1), controle do concreto com fck,est ≥ fck (7.1; 7.3, NBR 12655), execução (4; 5.3), controle geométrico com seções a ± 1 % e espessuras a ± 10 % do projeto (7.2.1) e acabamento (7.2.2).",
    lote: false,
    params: [
      { k: "tipo", r: "Dispositivo", tipo: "select", recarrega: true, opcoes: [["coletora", "Caixa coletora (5.3.2)"], ["ligacao", "Caixa de ligação e passagem (5.3.2)"], ["boca", "Boca de bueiro (5.3.3)"]] },
      { k: "disp", r: "Identificação do(s) dispositivo(s)", ph: "ex.: CC-03, est. 45+10 LD" },
      { k: "profVala", r: "Profundidade máxima da escavação (m)", dica: "> 1,25 m: escoramento obrigatório (4)" },
      { k: "grelhaAco", r: "Tampa com grelha de aço?", tipo: "select", recarrega: true, opcoes: [["nao", "Não"], ["sim", "Sim — tratamento antioxidante (NOTA 6)"]] },
      { k: "fck", r: "fck do concreto — projeto (MPa)", dica: "5.1.1: resistência mínima especificada no projeto" },
      D.paramCond,
      D.paramModo("fc", "concreto do dispositivo"),
      D.paramModo("fcm", "concreto magro"),
    ],
    padrao: { tipo: "coletora", grelhaAco: "nao", fck: "20", condPreparo: "B", modo_fc: "excepcional", modo_fcm: "excepcional" },
    refs: { reprova: "7.3", corrige: "7.3", regra: "7.3" },
    providencias: function (par) { return par.parecer === "ACEITO" ? [] : ["Todo detalhe incorreto ou mal executado deve ser corrigido; o serviço corrigido só é aceito se a correção o colocar em conformidade com a ES (7.3).",
      "Não conformidades tratadas e registradas conforme a DNIT 011-PRO (7.3)."]; },
    criterios: [
      D.itemFc({ id: "fc", grupo: GM, texto: "Concreto do dispositivo — resistência à compressão aos 28 dias (exemplares)", secao: "5.1.1; 7.3" }),
      D.itemFc({ id: "fcm", grupo: GM, texto: "Concreto magro do lastro — fck ≥ 15 MPa", secao: "5.3.2 a; 5.3.3 a; 7.3" }),
      { id: "aco", grupo: GM, texto: "Aço CA-50 conforme NBR 7480; armadura conforme o projeto (NBR 6118)", secao: "5.1.2", tipo: "sim_nao" },
      { id: "plano", grupo: GC, texto: "Plano de retirada de CPs e de amostras de aço, cimento e agregados estabelecido previamente", secao: "7.1", tipo: "sim_nao" },
      { id: "consist", grupo: GC, texto: "Consistência (NBR 16889 / NBR 15823-2) na 1ª amassada do dia, após interrupção > 2 h, a cada moldagem de CPs, na troca de operador e com variação de umidade dos agregados", secao: "7.1", tipo: "sim_nao" },
      { id: "sinal", grupo: GE, texto: "Sinalização da obra implantada e mantida; serviço não executado em dia de chuva", secao: "4", tipo: "sim_nao" },
      { id: "escora", grupo: GE, texto: "Escoramento da vala (profundidade > 1,25 m ou solo sujeito a desmoronamento) — NR-18 / NBR 9061", secao: "4", tipo: "sim_nao",
        se: function (P) { return !FE.ok(num(P.profVala)) || num(P.profVala) > 1.25; }, naoAplicaPor: "escavação ≤ 1,25 m (exigido também se o solo for instável)" },
      { id: "locacao", grupo: GE, texto: "Locação topográfica; escavação nos alinhamentos, cotas e dimensões do projeto", secao: "5.3.1 b, c", tipo: "sim_nao" },
      { id: "assent", grupo: GE, texto: "Superfície de assentamento apiloada, firme e desempenada (regularização compactada com controle de umidade)", secao: "5.3.1 c", tipo: "sim_nao" },
      { id: "botafora", grupo: GE, texto: "Material excedente em bota-fora sem prejudicar o escoamento; dispositivo protegido contra queda de materiais", secao: "5.3.1 c", tipo: "sim_nao" },
      { id: "lastro", grupo: GE, texto: "Espessura do lastro de concreto magro (5 cm ± 10 %)", secao: "5.3.2 a; 5.3.3 a; 7.2.1", tipo: "valor", unid: "cm", casas: 1, min: 4.5, max: 5.5,
        exigido: "5 cm ± 10 % (4,5 a 5,5 cm)" },
      { id: "formasCx", grupo: GE, texto: "Fôrmas, armaduras e concretagem com vibração (laje de fundo e paredes); fôrmas retiradas só após a cura", secao: "5.3.2 b–g", tipo: "sim_nao", se: caixa, naoAplicaPor: "boca de bueiro" },
      { id: "fundo", grupo: GE, texto: "Fundo elevado com concreto magro até a geratriz inferior do bueiro de saída", secao: "5.3.2 h", tipo: "sim_nao", se: caixa, naoAplicaPor: "boca de bueiro" },
      { id: "recomp", grupo: GE, texto: "Recomposição lateral compactada com material escolhido (sem pedras e fragmentos); vazios preenchidos se o solo for de baixa resistência", secao: "5.3.2 i", tipo: "sim_nao", se: caixa, naoAplicaPor: "boca de bueiro" },
      { id: "tampas", grupo: GE, texto: "Tampas ou grelhas implantadas após a limpeza total do dispositivo", secao: "5.3.2 j; NOTA 6", tipo: "sim_nao", se: caixa, naoAplicaPor: "boca de bueiro" },
      { id: "antiox", grupo: GE, texto: "Grelha de aço com tratamento antioxidante", secao: "5.3.2 NOTA 6", tipo: "sim_nao", se: function (P) { return caixa(P) && P.grelhaAco === "sim"; }, naoAplicaPor: "sem grelha de aço" },
      { id: "escada", grupo: GE, texto: "Escada de marinheiro instalada", secao: "5.3.2 NOTA 7", tipo: "sim_nao", se: function (P) { return tipo(P) === "coletora"; }, naoAplicaPor: "não é caixa coletora" },
      { id: "estrBoca", grupo: GE, texto: "Vigas de fundação, laje de fundo, alas e muro de testa concretados em etapas com vibração, formando conjunto monolítico", secao: "5.3.3 b–g", tipo: "sim_nao", se: boca, naoAplicaPor: "caixa" },
      { id: "canal", grupo: GE, texto: "Canalização a montante e a jusante verificada; erosões tratadas (enrocamento de pedra arrumada ou projeto); valas de derivação e bacias de captação executadas", secao: "5.3.3 h", tipo: "sim_nao", se: boca, naoAplicaPor: "caixa" },
      { id: "geomConf", grupo: GE, texto: "Dimensões e posicionamento conforme projeto / Notas de Serviço (levantamento topográfico e gabaritos)", secao: "7.2.1", tipo: "sim_nao" },
      { id: "acab", grupo: GA, texto: "Acabamento (visual) sem prejuízo à operação hidráulica; embasamento e enchimento das valas acompanhados", secao: "7.2.2", tipo: "sim_nao" },
      { id: "amb", grupo: GA, texto: "Condicionantes ambientais (DNIT 070-PRO e componente ambiental do projeto)", secao: "6", tipo: "sim_nao" },
    ],
    extra: function (ctx) {
      var P = ctx.P;
      D.avaliarFck(ctx, "fc", num(P.fck), { modo: P.modo_fc, cond: P.condPreparo, secao: "7.3" });
      D.avaliarFck(ctx, "fcm", 15, { modo: P.modo_fcm, cond: P.condPreparo, secao: "5.3.2 a; 7.3" });
      D.avaliarGeom(ctx, { secao: "7.2.1" });
    },
    notas: "Critérios da DNIT 026/2025-ES. fck,est pela ABNT NBR 12655 (a ES remete a ela): amostragem parcial (n ≥ 6) fck,est = 2(f1+…+fm−1)/(m−1) − fm, m = n/2, não menor que ψ6·f1; amostragem total fck,est = f1 (n ≤ 20) ou fi com i = 0,05n; caso excepcional (≤ 10 m³, 2 a 5 exemplares) fck,est = ψ6·f1. Controle geométrico: |desvio| ≤ 1 % nas seções transversais (pontos isolados) e ± 10 % nas espessuras, inclusive a do lastro de 5 cm (7.2.1). A ES não fixa frequência: cada item é exigido ao menos uma vez por dispositivo.",
    exemplos: [
      { nome: "Caixa coletora com grelha de aço — aceita", dados: function () {
        var d = { ident: { registro: "CX-A-001", data: "2026-06-18", obra: "Obra A — BR-000", trecho: "Drenagem do corte 3", local: "Est. 45+10 LD" },
          params: { tipo: "coletora", disp: "Caixa coletora CC-03 (1,20 × 1,20 × 1,80 m)", profVala: "2,10", grelhaAco: "sim", fck: "20", condPreparo: "B", modo_fc: "excepcional", modo_fcm: "excepcional" },
          fc: [{ est: "laje de fundo", pos: "ex. 1", v: "25,8" }, { est: "paredes", pos: "ex. 2", v: "27,1" }, { est: "paredes", pos: "ex. 3", v: "26,4" }],
          fcm: [{ est: "lastro", pos: "ex. M1", v: "20,6" }, { est: "lastro", pos: "ex. M2", v: "21,3" }],
          lastro: [{ est: "canto NE", v: "5,2" }, { est: "canto SO", v: "4,8" }, { est: "centro", v: "5,0" }],
          geom: [
            { est: "interna", elem: "comprimento interno", tipo: "D", proj: "1,20", med: "1,205" },
            { est: "interna", elem: "largura interna", tipo: "D", proj: "1,20", med: "1,195" },
            { est: "interna", elem: "profundidade", tipo: "D", proj: "1,80", med: "1,81" },
            { est: "parede N", elem: "parede", tipo: "E", proj: "0,15", med: "0,155" },
            { est: "fundo", elem: "laje de fundo", tipo: "E", proj: "0,15", med: "0,14" }] };
        preencher(F, d);
        return d;
      } },
      { nome: "Boca de bueiro — rejeitada (lastro, seção da ala e erosão a jusante)", dados: function () {
        var d = { ident: { registro: "BOC-B-002", data: "2026-07-30", obra: "Obra B — BR-000", trecho: "Bueiro tubular est. 88", local: "Est. 88+00 — jusante" },
          params: { tipo: "boca", disp: "Boca de jusante BSTC Ø 1,00 m", profVala: "1,10", grelhaAco: "nao", fck: "20", condPreparo: "B", modo_fc: "excepcional", modo_fcm: "excepcional" },
          fc: [{ est: "vigas de fundação", pos: "ex. 1", v: "27,0" }, { est: "alas", pos: "ex. 2", v: "26,8" }],
          fcm: [{ est: "lastro", pos: "ex. M1", v: "21,0" }, { est: "lastro", pos: "ex. M2", v: "20,2" }],
          lastro: [{ est: "soleira", v: "5,0" }, { est: "ala esquerda", v: "4,1" }],
          geom: [
            { est: "soleira", elem: "largura da soleira", tipo: "D", proj: "2,60", med: "2,61" },
            { est: "ala direita", elem: "altura da ala na testa", tipo: "D", proj: "1,60", med: "1,55" },
            { est: "soleira", elem: "laje de fundo", tipo: "E", proj: "0,20", med: "0,19" }] };
        preencher(F, d, { canal: { real: "1", nc: "1", obs: "erosão a jusante sem enrocamento" } });
        return d;
      } },
    ],
  });
  D.estender(F, { tabelas: function () { return [D.tabelaGeom({ unid: "m" })]; }, geom: ["geom"], fck: ["fc", "fcm"], semEstaca: true });
})();
