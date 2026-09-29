/*
 * Ficha de ES: DNIT 049/2013-ES — Pavimento rígido com equipamento de fôrmas deslizantes — aceitação do trecho de inspeção.
 * Resistência à tração na flexão (7.4.1: fctMk,est = fctM28 − k·s ≥ fctM,k, Tabela 1 de Student; 32 exemplares por trecho de até
 * 5.000 m² ou 1.000 m³), geometria (7.3.1: largura < 1 %; espessura média ≥ projeto e nenhum ponto < projeto − 1 cm),
 * irregularidade (7.3.2: IP ≤ 240 mm/km ou QI ≤ 35 cont/km), mancha de areia (7.3.3: 0,6 ≤ HS ≤ 1,2 mm, a cada 100 m) e
 * controle estatístico geral da 7.5.2 (X̄ ± k·s, k da Tabela 1 da DNER-PRO 277/97) para abatimento e HS.
 * Usa FE.aceitacaoG6 (definida em es-dnit-047-2004-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG6, num = FE.num, ok = FE.ok;
  var ID = "dnit-049-2013-es", sn = G.sn;
  function P_(d) { return d.params || {}; }
  var crit = [
    sn("trexp", "Trecho experimental executado e aprovado (Relatório Específico do DNIT)", "5.3.1", "Planejamento", "obrigatório, prévio"),
    sn("cim", "Cimento Portland CP-I, CP-II, CP-III ou CP-IV (ou adequação comprovada); agregados NBR 7211; aditivos NBR 11768", "5.1.1; 5.1.2; 5.1.4", "Insumos", "recebimento DNIT 050-EM, DNER-EM 036/037/038"),
    sn("agua", "Água de amassamento conforme DNER-EM 034/97 (casos dúbios: DNIT 037-ME, pega ± 30 min e resistência ≥ 85 %)", "4.4; 5.1.3", "Insumos", "DNER-EM 034/97"),
    sn("aco", "Barras de transferência CA-25 lisas e retas; ligação CA-50 (CA-25 se previsto)", "5.1.5", "Insumos", "NBR 7480"),
    sn("emul", "Película isolante: membrana 0,2–0,3 mm ou pintura asfáltica 0,8–1,6 l/m² com ensaios da emulsão por carregamento (resíduo, peneiramento, SSF 50 °C, carga) e a cada 100 t (SSF × T, sedimentação)", "5.1.8", "Insumos", "DNIT 165-EM"),
    sn("curaMat", "Composto de cura química ASTM C309 (branco ou claro)", "5.1.9", "Insumos", "ASTM C309"),
    sn("dos", "Dosagem: C ≥ 350 kg/m³; a/c ≤ 0,50; Dmáx ≤ 1/3 da espessura e ≤ 38 mm; ar incorporado ≤ 4 %", "5.1.10 b, c, e, f", "Concreto", "estudo de dosagem"),
    { id: "abat", texto: "Abatimento do tronco de cone (consistência)", secao: "5.1.10 d; 7.2.1; 7.5.2", grupo: "Controle da produção", tipo: "estatistico", unid: "mm", casas: 0,
      max: function (P) { var x = num(P.abatMax); return ok(x) ? Math.min(60, x) : 60; }, metodo: "NBR NM 67 / DNER-ME 404",
      importar: { de: "dner-me-404-00", valores: function (e) { return ((e.resultados || {}).ens || []).filter(function (x) { return ok(x.abr); }).map(function (x) { return { v: x.abr, rot: "betonada " + x.nome }; }); } },
      freq: { por: "contagem", qtd: "amassadas", a_cada: 1, unidade: "betonada(s)" },
      freqG: function (P) { var q = num(P.amassadas); return { exigido: ok(q) ? q : NaN, regra: "cada betonada — informe o nº de betonadas" }; } },
    sn("equip", "Equipamento vistoriado pela Fiscalização antes do início", "5.2", "Execução", "vistoria aprovada"),
    sn("linhas", "Sub-base nivelada; linhas-guia esticadas, sem catenária, verificadas antes de cada jornada; película com transpasse ≥ 20 cm", "5.3.2", "Execução", "conforme projeto"),
    sn("central", "Central gravimétrica: erros ≤ 2 % (cimento e agregados) e ≤ 1,5 % (água); umidade da areia a cada 2 h; mistura→lançamento ≤ 30 min (≤ 60 min com retardador aprovado)", "5.3.3", "Execução", "sem redosagem"),
    sn("vibro", "Vibroacabadora em passada única, sem paradas (≥ 0,7 m/min); bordas sem abatimento", "5.3.4", "Execução", "bordas verticais"),
    sn("regua", "Régua de alumínio de 3 m: variações na superfície acabada ≤ 5 mm; depressões corrigidas", "5.3.5; 5.3.6", "Execução", "≤ 5 mm"),
    sn("text", "Texturização logo após a perda do brilho; bordas com o mesmo acabamento", "5.3.6", "Execução", "dispositivo previsto no projeto"),
    sn("ident", "Placas identificadas com marcas indeléveis", "5.3.7", "Execução", "todas as placas"),
    sn("cura", "Cura química 0,35 a 0,50 l/m² logo após a texturização; faces laterais protegidas; sem trânsito durante a cura", "5.3.8; 5.3.11", "Execução", "ASTM C309"),
    sn("juntas", "Juntas nas posições de projeto, desvio de alinhamento ≤ 5 mm", "5.3.9", "Juntas", "\"não se permitindo\" desvio > 5 mm", "nao_conforme"),
    sn("corte", "Juntas transversais serradas entre 6 h e 12 h (plano de corte aprovado); longitudinais em até 24 h", "5.3.9.1 a; 5.3.9.2 a", "Juntas", "plano de corte"),
    sn("prof", "Profundidade de corte não inferior à de projeto (gabarito, ≥ 5 pontos por placa)", "5.3.9.2 a", "Juntas", "\"não é permitida, em nenhuma hipótese\"", "nao_conforme"),
    sn("barras", "Barras de transferência CA-25, metade + 2 cm engraxada; desvio ≤ ± 1 % e ≤ ± 0,7 % em 2/3 das barras de cada junta; barras de ligação nas posições de projeto", "5.3.9.3; 5.3.9.4", "Juntas", "tolerâncias de alinhamento", "nao_conforme"),
    sn("selag", "Selagem: sulcos limpos e secos com o fator de forma de projeto; selante sobre o suporte, sem transbordamento", "5.3.10", "Juntas", "profundidade de projeto"),
    { id: "ip", texto: "Índice de Perfil médio diário (Perfilógrafo Califórnia)", secao: "7.3.2; Anexo A", grupo: "Controle do produto", tipo: "valor", unid: "mm/km", casas: 0, max: 240,
      falha: "nao_conforme", metodo: "Anexo A", se: function (P) { return P.irreg !== "qi"; }, exigido: "IP médio ≤ 240 mm/km em cada dia de pavimentação",
      freq: { por: "tempo", a_cada: 1 }, freqG: function (P) { var x = num(P.dias); return { exigido: ok(x) ? x : 1, regra: "1 IP médio por dia de pavimentação (≥ 100 m)" }; } },
    { id: "qi", texto: "Quociente de Irregularidade (medidor tipo resposta)", secao: "7.3.2", grupo: "Controle do produto", tipo: "valor", unid: "cont/km", casas: 0, max: 35,
      falha: "nao_conforme", metodo: "DNER-PRO 182 / 164", se: function (P) { return P.irreg === "qi"; }, exigido: "QI ≤ 35 cont/km (IRI ≤ 2,7 m/km)", freq: { por: "lote", minimo: 1 } },
    { id: "hs", texto: "Altura da mancha de areia (HS)", secao: "7.3.3; 7.5.2", grupo: "Controle do produto", tipo: "estatistico", unid: "mm", casas: 2, min: 0.6, max: 1.2,
      metodo: "ASTM E965", freq: { por: "extensao", a_cada: 100 } },
  ];
  G.criarFicha({
    id: ID,
    titulo: "Pavimento rígido com fôrmas deslizantes — aceitação do trecho",
    resumo: "Trecho de inspeção de até 5.000 m² ou 1.000 m³: resistência à tração na flexão (fctMk,est = fctM − k·s, 32 exemplares), abatimento (≤ 60 mm), largura e espessura (7.3.1), " +
      "irregularidade (IP ≤ 240 mm/km ou QI ≤ 35), mancha de areia (0,6 a 1,2 mm), selante e verificações de execução, com o controle estatístico da 7.5.2.",
    lote: { largura: true, volume: true, dias: true },
    params: [{ k: "amassadas", r: "Betonadas no trecho", dica: "abatimento em cada betonada (7.2.1)" }, { k: "abatMax", r: "Abatimento máximo definido para o equipamento (mm) — ES: ≤ 60" },
      { k: "irreg", r: "Irregularidade longitudinal (7.3.2)", tipo: "select", recarrega: true, opcoes: [["ip", "Perfilógrafo Califórnia — Índice de Perfil"], ["qi", "Medidor tipo resposta — QI"]] }].concat(G.paramInsumos),
    padrao: { resTipo: "flexao", idadeCtrl: "28", resSup: "nao", insumos: "lote", irreg: "ip" },
    criterios: crit,
    tabelaK: G.K277, nMin: 5,
    refs: { reprova: "7.5.2 a", atende: "7.5.2 a", corrige: "7.5.2 c", regra: "7.5.2", tabela: "Tabela 1 da DNER-PRO 277/97" },
    componentes: [
      G.compResistencia({ tipos: ["flexao"], secao: "7.4.1.1", secAuto: "7.4.1.2", secMold: "7.2.2.2", secSup: "7.4.1.3", secaoExig: "7.2.2.1", exPorTrecho: 32, areaTrecho: 5000, volTrecho: 1000,
        sup: "estimativa", provNC: "Verificar com o projetista se a estrutura pode ser aceita com a espessura média e a resistência estimada (7.4.2 a); se não: reforço ou demolição e reconstrução (7.4.2 b)." }),
      G.compGeometria({ modo: "049", secao: "7.3.1", secLarg: "7.3.1 a", secEsp: "7.3.1 b", medicao: "media", secMed: "8 a", base: "sub-base",
        provEsp: "Verificar com o projetista a estrutura com a espessura média e a resistência estimada (7.4.2 a); se não aceita: reforço ou demolição (7.4.2 b)." }),
      G.compSelante({ secao: "5.1.6" }),
    ],
    extra: function (ctx) {
      var ip = ctx.item.ip;
      if (ip && ip.situacao === "nao_conforme") ip.prov = "Suspender a pavimentação até ações corretivas; corrigir os pontos altos > 10 mm em 7,62 m por corte e reavaliar (7.3.2; Anexo A).";
    },
    notas: "Critérios da DNIT 049/2013-ES. Resistência (7.4.1): fctMk,est = fctM28 − k·s ≥ fctM,k; k da Tabela 1 (Student): " + G.STUDENT_TXT + "; exemplar = maior de 2 CPs prismáticos; mín. 32 exemplares " +
      "por trecho de até 5.000 m² ou 1.000 m³ (7.2.2.2); n < 6 sem estimativa. Sem aceitação: ≥ 6 CPs extraídos (7.4.1.3). Geometria (7.3.1): largura com variação < 1 %; espessura média ≥ projeto e nenhum valor < projeto − 1 cm. " +
      "IP médio diário ≤ 240 mm/km (7.3.2); mancha de areia 0,6 ≤ HS ≤ 1,2 mm a cada 100 m (7.3.3). Abatimento ≤ 60 mm (5.1.10 d). Para abatimento e HS aplica-se a 7.5.2: X̄ − k·s ≥ mín. e X̄ + k·s ≤ máx., " +
      "k da Tabela 1 da DNER-PRO 277/97 (" + G.K277_TXT + "); com a estatística atendida, valores individuais fora = ressalva. Exigências da seção 5 não atendidas = ressalva, salvo proibições expressas.",
    exemplos: [
      { nome: "Trecho aceito — 32 exemplares, 400 m × 8,0 m, IP e mancha de areia conformes", dados: function () {
        var F = FE.FICHAS[ID];
        var d = { ident: { registro: "LOTE-FD-001", data: "2026-06-18", obra: "Obra A — BR-000", trecho: "Trecho de inspeção 1 — pista direita", local: "Est. 500 a 520", camada: "Placas de concreto — fôrmas deslizantes" },
          params: Object.assign({}, F.padrao, { estIni: "500", estFim: "520", largura: "8,00", volume: "704", dias: "2", largProj: "8,00", espProj: "22", fctmk: "4,5", amassadas: "40" }),
          verificacoes: G.verifEx(F), res: [], abat: [], ip: [], hs: [], sel: [{}] };
        var base = [5.02, 5.18, 4.95, 5.31, 5.10, 4.88, 5.24, 5.06, 5.15, 4.98, 5.27, 5.09, 4.92, 5.20, 5.13, 5.01, 5.35, 4.96, 5.11, 5.22, 5.04, 4.90, 5.28, 5.07, 5.16, 4.99, 5.19, 5.05, 5.12, 4.94, 5.25, 5.08];
        d.res = base.map(function (v, i) { return { est: String(500 + Math.floor(i * 20 / 32)) + "+" + ((i * 12.5) % 20).toFixed(1).replace(".", ","), reg: "CP-FD-" + (100 + i), idade: "28", cp1: A.nstr(v, 2), cp2: A.nstr(v - 0.12 + (i % 3) * 0.05, 2) }; });
        d.abat = [45, 50, 42, 48, 52, 47, 44, 49, 51, 46, 43, 50, 48, 45, 47, 49, 44, 52, 46, 48, 50, 43, 47, 49, 45, 51, 46, 48, 44, 50, 47, 45, 49, 46, 48, 51, 44, 47, 50, 46]
          .map(function (v, i) { return { reg: "betonada " + (i + 1), v: String(v) }; });
        d.ip = [{ reg: "Dia 1 (200 m)", v: "185" }, { reg: "Dia 2 (200 m)", v: "205" }];
        d.hs = [["500", 0.82], ["505", 0.91], ["510", 0.78], ["515", 0.88], ["520", 0.85]].map(function (x) { return { est: x[0], reg: "MA", v: A.nstr(x[1], 2) }; });
        A.exemplos.importar(F.params, d, "impSel", [["dnit-039-2004-me", 0], ["dnit-040-2004-me", 0], ["dnit-052-2004-me", 0]]);
        var sec = [];
        for (var i = 0; i <= 20; i++) sec.push([8.00 + (i % 3) * 0.02, 22.4 + (i % 4) * 0.1, 22.2 + (i % 2) * 0.2, 22.5 - (i % 3) * 0.1]);
        d.geo = G.exSecoes(500, sec);
        return d;
      } },
      { nome: "Trecho rejeitado — IP diário > 240 mm/km, HS acima de 1,2 mm, espessura abaixo de projeto − 1 cm; só 12 exemplares", dados: function () {
        var F = FE.FICHAS[ID];
        var d = { ident: { registro: "LOTE-FD-002", data: "2026-06-25", obra: "Obra A — BR-000", trecho: "Trecho de inspeção 2", local: "Est. 520 a 530", camada: "Placas de concreto — fôrmas deslizantes" },
          params: Object.assign({}, F.padrao, { estIni: "520", estFim: "530", largura: "8,00", volume: "352", dias: "1", largProj: "8,00", espProj: "22", fctmk: "4,5", amassadas: "20", insumos: "previo", insumosReg: "RI-02" }),
          verificacoes: G.verifEx(F), res: [], abat: [], ip: [], hs: [] };
        d.res = [5.12, 4.98, 5.21, 5.05, 4.93, 5.30, 5.08, 5.16, 4.89, 5.24, 5.02, 5.11].map(function (v, i) { return { est: String(520 + Math.floor(i / 1.2)), reg: "CP-FD-" + (200 + i), idade: "28", cp1: A.nstr(v, 2) }; });
        d.abat = [48, 55, 62, 50, 58, 64, 52, 49, 57, 61, 53, 50, 59, 47, 56, 60, 54, 51, 63, 55].map(function (v, i) { return { reg: "betonada " + (i + 1), v: String(v) }; });
        d.ip = [{ reg: "Dia 1 (200 m)", v: "268" }];
        d.hs = [["520", 1.15], ["525", 1.32], ["530", 1.18]].map(function (x) { return { est: x[0], reg: "MA", v: A.nstr(x[1], 2) }; });
        var sec = [];
        for (var i = 0; i <= 10; i++) sec.push([8.01, 22.1 + (i % 3) * 0.1, i === 6 ? 20.8 : 21.9 + (i % 2) * 0.2, 22.0]);
        d.geo = G.exSecoes(520, sec);
        d.obs = "Exemplo: n = 12 < 32 exemplares exigidos (frequência); IP do dia acima de 240 mm/km — suspender a pavimentação; HS > 1,2 mm na estaca 525; espessura de 20,8 cm na estaca 526 (BE).";
        return d;
      } },
    ],
  });
})();
