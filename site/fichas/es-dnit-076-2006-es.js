/*
 * Ficha de ES: DNIT 076/2006-ES — Tratamento ambiental acústico das áreas lindeiras da faixa de domínio (barreiras
 * arbóreas, cercas vivas e barreiras artificiais) — aceitação (A.fichaSimples via FE.aceitacaoG11,
 * definido em es-dnit-071-2006-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG11, num = FE.num;

  var veg = function (P) { return G.sim(P, "vegetal"); };
  var art = function (P) { return G.sim(P, "artificial"); };
  var C = [
    { id: "especies", texto: "Espécies conforme o projeto (cerca viva: sabiá-do-campo, ora-pro-nóbis; barreiras arbóreas: relação da DNIT 073/2006-ES)",
      secao: "5.1.1", grupo: "Barreira vegetal", tipo: "sim_nao", se: veg, naoAplicaPor: "sem barreira vegetal" },
    { id: "plantio", texto: "Produção, plantio, tutoramento e tratos culturais e fitossanitários das mudas conforme a DNIT 073/2006-ES", secao: "5; 5.4",
      grupo: "Barreira vegetal", tipo: "sim_nao", se: veg, naoAplicaPor: "sem barreira vegetal" },
    G.inspecoes("insp", "6", "Inspeções mensais da Fiscalização: germinação e crescimento; substituição das mudas doentes ou mortas", 30, veg, "Barreira vegetal"),
    G.mudasEst("6; 7 b; 8", function (P) { return veg(P) && G.etapa2(P); }),
    { id: "paineis", texto: "Materiais dos painéis / blocos conforme o projeto e os catálogos dos fabricantes", secao: "5.1.1.3", grupo: "Barreira artificial",
      tipo: "sim_nao", se: art, naoAplicaPor: "sem barreira artificial" },
    { id: "execart", texto: "Barreira artificial executada conforme o projeto de engenharia e controlada pelas normas ABNT específicas", secao: "5.4; 6",
      grupo: "Barreira artificial", tipo: "sim_nao", se: art, naoAplicaPor: "sem barreira artificial" },
    { id: "ruido", texto: "Nível de ruído medido no receptor após a implantação (monitoramento)", secao: "4 (NBR 10151)", grupo: "Monitoramento", tipo: "valor",
      unid: "dB(A)", casas: 1, max: function (P) { return num(P.limite); }, falha: "ressalva", se: function (P) { return G.sim(P, "monit"); },
      naoAplicaPor: "sem monitoramento de ruído", exigido: "≤ limite do projeto (padrão legal de 60 dB(A) citado na seção 4)", freq: G.lote("pontos do projeto de monitoramento") },
  ];

  A.fichaSimples({
    id: "dnit-076-2006-es",
    titulo: "Tratamento ambiental acústico (barreiras vegetais e artificiais) — aceitação",
    resumo: "Verificações da DNIT 076/2006-ES: barreiras arbóreas e cercas vivas (espécies, plantio conforme DNIT 073, inspeções mensais, mudas estabelecidas), barreiras artificiais conforme projeto e, opcionalmente, o nível de ruído do monitoramento.",
    lote: { largura: false },
    params: [G.ETAPA,
      { k: "vegetal", r: "Barreira vegetal / cerca viva?", tipo: "select", recarrega: true, opcoes: G.SIM_NAO },
      { k: "artificial", r: "Barreira artificial (painéis)?", tipo: "select", recarrega: true, opcoes: G.SIM_NAO },
      G.paramMudas, G.paramDias,
      { k: "monit", r: "Monitoramento de ruído após a implantação?", tipo: "select", recarrega: true, opcoes: G.SIM_NAO },
      { k: "limite", r: "Nível de ruído limite do projeto — dB(A)", dica: "seção 4: padrão legal de 60 dB(A) (NBR 10151)" }],
    padrao: { etapa: "1", vegetal: "sim", artificial: "nao", monit: "nao", limite: "60" },
    criterios: C,
    extra: G.extraMudas,
    notas: "Critérios da DNIT 076/2006-ES: a seção 6 prevê inspeções visuais mensais das barreiras vegetais (germinação, crescimento, substituição de mudas doentes ou mortas) e remete o controle das barreiras artificiais às normas ABNT específicas; plantio e manutenção conforme a DNIT 073/2006-ES. O nível de ruído não é critério de aceitação da ES (a seção 4 cita o padrão legal de 60 dB(A)); quando monitorado, valor acima do limite é ressalva.",
    exemplos: [
      { nome: "Cerca viva de sabiá-do-campo — 2ª etapa (aceita)", dados: function () {
        var P = { estIni: "120", estFim: "145", etapa: "2", vegetal: "sim", artificial: "nao", mudas: "500", dias: "95", monit: "nao", limite: "60" };
        return { ident: { registro: "AMB-076-01", data: "2026-04-08", obra: "Obra A", trecho: "BR-000 — travessia urbana A", local: "Est. 120 a 145, LD" },
          params: P, verificacoes: G.verif(C, P, { insp: { real: "3" } }), estab: G.vals([["Contagem", "100", "", "132"]]) };
      } },
      { nome: "Barreira arbórea + painéis — falhas e ruído acima do limite (ressalva)", dados: function () {
        var P = { estIni: "300", estFim: "318", etapa: "2", vegetal: "sim", artificial: "sim", mudas: "240", dias: "130", monit: "sim", limite: "60" };
        return { ident: { registro: "AMB-076-02", data: "2026-08-20", obra: "Obra B", trecho: "BR-000 — travessia urbana B", local: "Est. 300 a 318, junto a escola" },
          params: P, verificacoes: G.verif(C, P, { insp: { real: "4" } }), estab: G.vals([["Contagem", "90", "", "310"]]),
          ruido: G.vals([["Receptor R1 (escola)", "62,5", "Medição 1", "305"], ["Receptor R2", "58,0", "Medição 1", "314"]]) };
      } },
    ],
  });
})();
