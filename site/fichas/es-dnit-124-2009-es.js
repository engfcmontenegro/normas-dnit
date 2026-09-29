/*
 * Ficha de ES: DNIT 124/2009-ES — Pontes e viadutos rodoviários — Escoramentos (aceitação). Usa FE.aceitacao e
 * FE.aceitacaoG9b (es-dnit-116-2009-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG9b, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var ID = "dnit-124-2009-es";
  // 7.1 — prazos mínimos de retirada sem cimento ARI e sem demonstração (dias)
  var PRAZO = { lateral: 3, pontaletes: 14, inferior: 21 };
  var PRUMO = { p500: 2.0, p32: 3.2 / 0.9 }; // mm por m de altura (5.3.3)

  var GP = "Projeto e materiais (4; 5.1; 5.2)", GM = "Montagem (5.3; 5.4.1)", GC = "Concretagem e após (5.4.2; 5.4.3; 7.1)", GR = "Retirada e remoção (5.4.4; 6; 7.1)";
  var CRIT = [
    { id: "projeto", grupo: GP, texto: "Projeto do escoramento apresentado à Fiscalização (sobrecargas, equipamentos, vento, velocidade de concretagem; forma e prazo de remoção)", secao: "4; 5.1", tipo: "sim_nao" },
    { id: "liberado", grupo: GP, texto: "Escoramento entra em carga só após liberação da Fiscalização", secao: "4", tipo: "sim_nao" },
    { id: "madeira", grupo: GP, texto: "Peças de madeira inspecionadas, não pintadas; ligações por conectores/parafusos", secao: "5.2.1", tipo: "sim_nao",
      se: function (P) { return P.material !== "aco"; }, naoAplicaPor: "escoramento metálico" },
    { id: "aco", grupo: GP, texto: "Aço identificado (na dúvida, ASTM A7: fy = 240 MPa, fu = 370 MPa); sistema padronizado conforme o fabricante", secao: "5.2.2; 5.3.3; 5.3.4", tipo: "sim_nao",
      se: function (P) { return P.material !== "madeira"; }, naoAplicaPor: "escoramento de madeira" },
    { id: "fund", grupo: GM, texto: "Fundações do escoramento em terreno adequado, protegidas de erosão, enchentes e choques", secao: "5.3.1; 5.3.2; 5.4.1 c", tipo: "sim_nao" },
    { id: "desenhos", grupo: GM, texto: "Montagem conforme desenhos e instruções; materiais recomendados em boas condições", secao: "5.4.1 a, b", tipo: "sim_nao" },
    { id: "contrav", grupo: GM, texto: "Contraventamentos corretamente espaçados; conexões confiáveis; montantes protegidos contra choques", secao: "5.3.4; 5.4.1 d, e", tipo: "sim_nao" },
    { id: "prumo", grupo: GM, texto: "Desvio de prumo dos montantes", secao: "5.3.3", tipo: "valor", unid: "mm/m", casas: 1, falha: "ressalva",
      max: function (P) { return PRUMO[P.critPrumo] || PRUMO.p500; }, exigido: "recomendação de 5.3.3 (1/500 da altura ou 3,2 mm / 0,90 m)" },
    { id: "contato", grupo: GM, texto: "Desvio de prumo entre duas peças em contato", secao: "5.4.1 d", tipo: "valor", unid: "mm", casas: 1, max: 1.6 },
    { id: "concr", grupo: GC, texto: "Concretagem conforme o plano; recalques controlados com topografia/defletômetros; sem pessoas sob o trecho concretado", secao: "5.4.2; 7.1", tipo: "sim_nao" },
    { id: "recalque", grupo: GC, texto: "Sem recalques durante a concretagem (ou concretagem suspensa e corrigida)", secao: "5.4.2 b", tipo: "sim_nao" },
    { id: "apos", grupo: GC, texto: "Inspeção continuada até a retirada (redistribuição por retração e protensão)", secao: "5.4.3", tipo: "sim_nao" },
    { id: "prazo", grupo: GR, texto: "Prazo de retirada das fôrmas e do escoramento", secao: "7.1", tipo: "valor", unid: "dias", casas: 0,
      min: function (P) { return PRAZO[P.face] || 21; }, se: function (P) { return P.ari !== "sim"; }, naoAplicaPor: "cimento ARI / endurecimento acelerado ou resistência demonstrada",
      exigido: "faces laterais 3 d; inferiores com pontaletes 14 d; sem pontaletes 21 d" },
    { id: "semchoque", grupo: GR, texto: "Retirada sem choques, conforme o programa; nivelamento levantado após a retirada (bordas e centro)", secao: "7.1", tipo: "sim_nao",
      se: function (P) { return P.fase === "removido"; }, naoAplicaPor: "escoramento ainda em uso" },
    { id: "estacas", grupo: GR, texto: "Estacas do escoramento extraídas ou cortadas abaixo do terreno acabado", secao: "5.4.4; 7.1", tipo: "valor", unid: "cm", casas: 0, min: 50,
      se: function (P) { return P.fase === "removido" && P.estacas === "sim"; }, naoAplicaPor: "sem estacas ou escoramento ainda em uso", exigido: "≥ 50 cm abaixo do nível acabado (7.1)" },
    { id: "limpeza", grupo: GR, texto: "Escoramento e remanescentes (inclusive concreto e dentes) removidos; terreno e vegetação recompostos", secao: "5.4.4; 6; 7.1", tipo: "sim_nao",
      se: function (P) { return P.fase === "removido"; }, naoAplicaPor: "escoramento ainda em uso" },
  ];

  var F = A.fichaSimples({
    id: ID, registrar: false,
    titulo: "Pontes e viadutos — escoramentos — aceitação",
    resumo: "Aceitação do escoramento de um trecho pela DNIT 124/2009-ES: projeto e liberação (4; 5.1), materiais (5.2), inspeções na montagem, na concretagem e após (5.4 — prumo: 1/500 da altura ou 3,2 mm/0,90 m; peças em contato 1,6 mm), controle de recalques (7.1), prazos mínimos de retirada (faces laterais 3 d; inferiores com pontaletes 14 d; sem pontaletes 21 d) e remoção (estacas cortadas ≥ 50 cm abaixo do terreno; recomposição ambiental).",
    lote: false,
    params: [
      { k: "trecho", r: "Trecho / vão escorado", ph: "ex.: vão 2 — cimbramento da laje" },
      { k: "material", r: "Material", tipo: "select", opcoes: [["aco", "Aço (sistema padronizado ou não)"], ["madeira", "Madeira"], ["misto", "Misto (torres e treliças)"]] },
      { k: "critPrumo", r: "Critério de prumo adotado (5.3.3)", tipo: "select", opcoes: [["p500", "1/500 da altura da coluna (2,0 mm/m)"], ["p32", "3,2 mm por 0,90 m (3,6 mm/m)"]] },
      { k: "face", r: "Retirada (7.1)", tipo: "select", opcoes: [["inferior", "Faces inferiores sem pontaletes (21 d)"], ["pontaletes", "Faces inferiores deixando pontaletes (14 d)"], ["lateral", "Faces laterais (3 d)"]] },
      { k: "ari", r: "Cimento ARI, endurecimento acelerado ou resistência demonstrada?", tipo: "select", opcoes: [["nao", "Não"], ["sim", "Sim (prazos de 7.1 não se aplicam)"]] },
      { k: "fase", r: "Fase", tipo: "select", opcoes: [["uso", "Montado / em uso"], ["removido", "Retirado e removido"]] },
      { k: "estacas", r: "Escoramento apoiado em estacas?", tipo: "select", opcoes: [["nao", "Não"], ["sim", "Sim"]] },
    ],
    padrao: { material: "aco", critPrumo: "p500", face: "inferior", ari: "nao", fase: "uso", estacas: "nao" },
    criterios: CRIT,
    refs: { reprova: "7.2.2", atende: "7.2.1", regra: "7.2" },
    extra: function (ctx) {
      var P = ctx.P, lp = ctx.item.prumo;
      if (lp) lp.exigido = "≤ " + fmt(PRUMO[P.critPrumo] || PRUMO.p500, 1) + " mm/m (" + (P.critPrumo === "p32" ? "3,2 mm / 0,90 m" : "1/500 da altura") + " — recomendação de 5.3.3)";
      if (ctx.item.prazo) ctx.item.prazo.exigido = "≥ " + (PRAZO[P.face] || 21) + " dias (" + { lateral: "faces laterais", pontaletes: "faces inferiores com pontaletes", inferior: "faces inferiores sem pontaletes" }[P.face || "inferior"] + ")";
      if (P.fase === "removido" && P.estacas === "sim") ctx.avisos.push("5.4.4 admite estacas cortadas no nível do terreno; 7.1 exige pelo menos 50 cm abaixo do nível acabado — adotado o mais exigente (7.1).");
    },
    notas: "Critérios da DNIT 124/2009-ES. Conformes os escoramentos que atendam à seção 4 e às subseções 5.1, 5.3 e 7.1 (7.2.1); não conformes corrigidos, complementados ou refeitos (7.2.2). Prumo: a ES só cita recomendações de publicações (5.3.3) — desvio acima delas tratado como ressalva; peças em contato: 1,6 mm (5.4.1 d). Prazos mínimos de retirada (7.1) quando não demonstrada a resistência e sem cimento ARI. Estacas de apoio extraídas ou cortadas ≥ 50 cm abaixo do terreno acabado (7.1).",
    exemplos: [
      { nome: "Cimbramento metálico do vão 2, retirado aos 22 dias — aceito", dados: function () {
        return { ident: { registro: "ESC-01", obra: "Obra A — ponte sobre o rio A", camada: "Vão 2 — cimbramento da laje e vigas", data: "2025-05-30" },
          params: { trecho: "Vão 2", material: "aco", critPrumo: "p500", face: "inferior", ari: "nao", fase: "removido", estacas: "sim" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, {}, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S", obs: "nível de precisão, recalque máx. 3 mm" },
            { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }],
          prumo: [{ est: "torre T1", v: "1,2" }, { est: "torre T2", v: "0,8" }, { est: "torre T3", v: "1,5" }, { est: "torre T4", v: "1,1" }],
          contato: [{ est: "T1-T2", v: "0,8" }, { est: "T3-T4", v: "1,2" }],
          prazo: [{ est: "vão 2", v: "22" }],
          estacas: [{ est: "estaca 1", v: "60" }, { est: "estaca 2", v: "55" }] };
      } },
      { nome: "Escoramento de madeira pintada, recalque na concretagem e retirada aos 10 dias — rejeitado", dados: function () {
        return { ident: { registro: "ESC-02", obra: "Obra B — viaduto", camada: "Vão 1 — escoramento de madeira roliça", data: "2025-09-12" },
          params: { trecho: "Vão 1", material: "madeira", critPrumo: "p32", face: "inferior", ari: "nao", fase: "removido", estacas: "sim" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { real: "12", nc: "2", obs: "peças pintadas e ligações só pregadas" }, {}, { atende: "S" }, { atende: "S" }, { atende: "S" },
            { atende: "S" }, { atende: "N", obs: "recalque de 12 mm no meio do vão sem suspender a concretagem" }, { atende: "S" }, { atende: "S" }, { atende: "N", obs: "madeira abandonada no local" }],
          prumo: [{ est: "linha A", v: "2,8" }, { est: "linha B", v: "4,5" }],
          contato: [{ est: "A3-A4", v: "2,0" }],
          prazo: [{ est: "vão 1", v: "10" }],
          estacas: [{ est: "estaca 1", v: "0" }, { est: "estaca 2", v: "20" }] };
      } },
    ],
  });
  G.registrar(F, ID);
})();
