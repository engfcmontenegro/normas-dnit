/*
 * Ficha de ES: DNER-ES 144/85 — Defensas metálicas — aceitação da instalação (A.fichaSimples via FE.aceitacaoG11,
 * definido em es-dnit-071-2006-es.js). Condições gerais de instalação da seção 3.3: altura da guia (750 / 650 mm)
 * ± 40 mm, desvio lateral ± 30 mm, afastamento ≥ 0,50 m, desvio angular ≤ 2°20′, cravação ≥ 1.100 mm, ancoragem.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG11, num = FE.num;

  function hNom(P) { return P.caminhoes === "acima" ? 750 : 650; }
  var med = function (secao) {
    return { por: "extensao", a_cada: 1, pontos: true, regra: "1 seção a cada \"passo\" m do parâmetro (adotado: a ES não fixa)",
      qtd: function (P, L) { var p = num(P.passo); return p > 0 ? L.ext / p : NaN; } };
  };
  var C = [
    { id: "em145", texto: "Defensas (lâminas, postes, espaçadores, fixações) conforme DNER-EM 145/85", secao: "2.1", grupo: "Materiais e equipamento", tipo: "sim_nao",
      exigido: "recebimento conforme a EM" },
    { id: "equip", texto: "Equipamento mínimo: compressor ≥ 3,5 m³/min; bate-estacas pneumático ≥ 170 J e 660 impactos/min, com torre regulável (cravação vertical); chave pneumática",
      secao: "3.1", grupo: "Materiais e equipamento", tipo: "sim_nao" },
    { id: "projtipo", texto: "Disposição conforme o projeto-tipo do local (figuras 1 a 12: obras-de-arte, bordas de aterro, canteiros, passagens de pedestres, obstáculos, cortes em rocha)",
      secao: "3.2", grupo: "Instalação", tipo: "sim_nao" },
    { id: "ancor", texto: "Ancoragem: descida da guia de deslizamento em 16,00 m até 0,20 m abaixo do nível do solo (borda superior da lâmina — figuras 13 a 17)",
      secao: "3.3.1", grupo: "Instalação", tipo: "sim_nao", exigido: "em cada extremidade" },
    { id: "superp", texto: "Superposição das lâminas com arestas e cantos vivos voltados para o sentido contrário ao do trânsito", secao: "3.3.2", grupo: "Instalação",
      tipo: "sim_nao", exigido: "em cada emenda" },
    { id: "cravacao", texto: "Extensão cravada dos postes", secao: "3.3.8", grupo: "Instalação", tipo: "valor", unid: "mm", casas: 0, min: 1100,
      se: function (P) { return P.poste !== "base"; }, naoAplicaPor: "postes com base e chumbadores (3.3.9)", freq: med() },
    { id: "chumb", texto: "Postes com base soldada fixados por chumbadores (rocha / obra-de-arte — figuras 3, 4 e 12)", secao: "3.3.9", grupo: "Instalação", tipo: "sim_nao",
      se: function (P) { return P.poste === "base"; }, naoAplicaPor: "postes cravados" },
    { id: "afast", texto: "Afastamento da guia de deslizamento à borda da pista", secao: "3.3.3", grupo: "Geometria", tipo: "valor", unid: "m", casas: 2, min: 0.5,
      exigido: "≥ 0,50 m (respeitadas as faixas de segurança e acostamentos)", freq: med() },
    { id: "altura", texto: "Altura da parte superior da guia de deslizamento", secao: "3.3.4; 3.3.5", grupo: "Geometria", tipo: "valor", unid: "mm", casas: 0,
      min: function (P) { return hNom(P) - 40; }, max: function (P) { return hNom(P) + 40; },
      exigido: "750 mm (caminhões > 30 %) ou 650 mm (< 30 %), ± 40 mm", freq: med() },
    { id: "lateral", texto: "Desvio lateral em relação ao eixo da pista", secao: "3.3.6", grupo: "Geometria", tipo: "valor", unid: "mm", casas: 0, min: -30, max: 30,
      exigido: "± 30 mm", freq: med() },
    { id: "angular", texto: "Desvio angular em relação ao eixo da pista", secao: "3.3.7", grupo: "Geometria", tipo: "valor", unid: "°", casas: 2, max: 2 + 20 / 60,
      se: function (P) { return G.sim(P, "transicao"); }, naoAplicaPor: "sem transição angular", exigido: "≤ 2°20′ (≈ 2,33°; ≈ 1:25)", freq: G.lote() },
  ];

  A.fichaSimples({
    id: "dner-es-144-85",
    titulo: "Defensas metálicas — aceitação da instalação",
    resumo: "Verificações da DNER-ES 144/85: materiais (DNER-EM 145/85), equipamento mínimo, projetos-tipo, ancoragem de 16,00 m, superposição das lâminas, cravação ≥ 1.100 mm, afastamento ≥ 0,50 m, altura da guia 750 / 650 mm ± 40 mm, desvio lateral ± 30 mm e desvio angular ≤ 2°20′.",
    lote: { largura: false },
    params: [{ k: "caminhoes", r: "Caminhões no volume de tráfego (3.3.4)", tipo: "select", opcoes: [["acima", "Acima de 30 % do total — h = 750 mm"], ["abaixo", "Inferior a 30 % do total — h = 650 mm"]] },
      { k: "poste", r: "Fixação dos postes", tipo: "select", recarrega: true, opcoes: [["cravado", "Postes de aço cravados"], ["madeira", "Postes de madeira (solo compactado em camadas de 15 cm)"], ["base", "Base soldada e chumbadores (3.3.9)"]] },
      { k: "transicao", r: "Há desvio angular por imposição do projeto (3.3.7)?", tipo: "select", recarrega: true, opcoes: G.SIM_NAO },
      { k: "passo", r: "Espaçamento das seções de verificação (m)", dica: "a ES não fixa a frequência das medidas; padrão: 1 seção por estaca (20 m)" }],
    padrao: { caminhoes: "acima", poste: "cravado", transicao: "nao", passo: "20" },
    criterios: C,
    extra: function (ctx) {
      if (ctx.P.caminhoes === "acima" || ctx.P.caminhoes === "abaixo") return;
      ctx.avisos.push("Informe a participação de caminhões no tráfego: a altura da guia é 750 mm acima de 30 % e 650 mm abaixo de 30 % (3.3.4).");
    },
    notas: "Critérios da DNER-ES 144/85, seção 3.3 (condições gerais de instalação). Altura da guia: valor nominal de 3.3.4 com a variação de ± 40 mm de 3.3.5; exatamente 30 % de caminhões não é tratado pela ES (adotado 750 mm só acima de 30 %). A ES não tem seção de controle nem frequência: 1 seção de verificação a cada \"passo\" m (padrão 20 m), incluindo as pontas. Desvios fora das tolerâncias: não conformidade (reinstalar).",
    exemplos: [
      { nome: "Defensa em borda de aterro (aceita)", dados: function () {
        var P = { estIni: "250", estFim: "256", caminhoes: "acima", poste: "cravado", transicao: "nao", passo: "20" };
        var est = ["250", "251", "252", "253", "254", "255", "256"];
        function col(vs) { return vs.map(function (v, i) { return { est: est[i], pos: "", reg: "", v: v }; }); }
        return { ident: { registro: "OC-144-01", data: "2026-05-27", obra: "Obra A", trecho: "BR-000 — km 5", local: "Aterro alto LD, est. 250 a 256" },
          params: P, verificacoes: G.verif(C, P),
          cravacao: col(["1150", "1120", "1100", "1180", "1130", "1110", "1140"]),
          afast: col(["0,80", "0,78", "0,82", "0,80", "0,81", "0,79", "0,80"]),
          altura: col(["752", "760", "745", "748", "771", "738", "755"]),
          lateral: col(["5", "-12", "8", "20", "-4", "0", "15"]) };
      } },
      { nome: "Defensa em acesso de ponte — altura e cravação fora (rejeitada)", dados: function () {
        var P = { estIni: "88", estFim: "91", caminhoes: "abaixo", poste: "cravado", transicao: "sim", passo: "20" };
        var est = ["88", "89", "90", "91"];
        function col(vs) { return vs.map(function (v, i) { return { est: est[i], pos: "", reg: "", v: v }; }); }
        return { ident: { registro: "OC-144-02", data: "2026-08-11", obra: "Obra B", trecho: "BR-000 — km 33", local: "Acesso à ponte, est. 88 a 91" },
          params: P, verificacoes: G.verif(C, P, { superp: { atende: "N", obs: "2 emendas com aresta voltada para o trânsito" } }),
          cravacao: col(["1100", "950", "1120", "1080"]),
          afast: col(["0,60", "0,55", "0,45", "0,60"]),
          altura: col(["655", "700", "640", "660"]),
          lateral: col(["10", "35", "-5", "12"]),
          angular: G.vals([["Transição acesso / ponte", "2,10", "", "90"]]) };
      } },
    ],
  });
})();
