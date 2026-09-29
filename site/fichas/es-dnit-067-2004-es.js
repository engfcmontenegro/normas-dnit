/*
 * Ficha de ES: DNIT 067/2004-ES — Pavimento rígido — Reabilitação — aceitação dos reparos de um segmento.
 * A inspeção (6) exige reparos feitos exatamente como descritos na ES ("não serão aceitos os reparos feitos de maneira
 * diferente" — 6.1) e o controle do concreto "como especificado para os pavimentos executados com equipamento de pequeno
 * porte" (6.2 = DNIT 047/2004-ES: abatimento e resistência característica estimada, Tabela 1 de Student).
 * Usa FE.aceitacaoG6 (definida em es-dnit-047-2004-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG6;
  var ID = "dnit-067-2004-es";
  var SERV = [["sEsb", "Esborcinamento de juntas (5.2.1.1)"], ["sSel", "Resselagem de juntas (5.2.1.2)"], ["sFis", "Tratamento de fissuras (5.2.2)"],
    ["sDes", "Desgaste superficial / escamação (5.2.3)"], ["sTra", "Reparo em toda a espessura — fissura transversal (5.3)"], ["sRec", "Reconstituição parcial da placa (5.4)"],
    ["sTot", "Reconstituição total da placa (5.5)"]];
  function tem(k) { return function (P) { return P[k] === "sim"; }; }
  function concreto(P) { return ["sEsb", "sDes", "sTra", "sRec", "sTot"].some(function (k) { return P[k] === "sim"; }); }
  function it(id, texto, secao, grupo, exigido, se) { return { id: id, texto: texto, secao: secao, grupo: grupo, tipo: "sim_nao", exigido: exigido, falha: "nao_conforme", se: se }; }
  var crit = [
    it("esb", "Esborcinamento: corte de 1,5–2 cm a ~15 cm da junta, remoção até ≥ 5 cm, limpeza, ponte epóxi 1–2 mm (não na placa vizinha), talisca para recompor a junta; concreto C ≥ 350 kg/m³, Dmáx ≤ 1/3 do reparo; cura química + úmida ≥ 7 dias",
      "5.2.1.1", "Reparos parciais", "procedimento da 5.2.1.1", tem("sEsb")),
    it("sel", "Resselagem: remoção do selante antigo, limpeza com ar comprimido, fator de forma garantido (fita ou cordão), selante apropriado", "5.2.1.2", "Juntas e fissuras", "procedimento da 5.2.1.2", tem("sSel")),
    it("fis", "Fissuras: ≤ 1 mm inativas — injeção/selagem epóxi; > 1 mm ou esborcinadas — ranhura 25 mm × ≤ 30 mm e selante; rendilhado — epóxi ou endurecedor 20–30 %", "5.2.2", "Juntas e fissuras", "procedimento da 5.2.2", tem("sFis")),
    it("des", "Desgaste/escamação: corte 1,5–2 cm, remoção ≥ 5 cm, paredes verticais, limpeza, ponte de aderência (epóxi ou argamassa 1,5–3 mm, sem secar); concreto a/c ≤ 0,45 e Dmáx ≤ 1/3 do reparo; cura",
      "5.2.3", "Reparos parciais", "procedimento da 5.2.3", tem("sDes")),
    it("tra", "Fissura transversal: cortes paralelos a ~100 cm, remoção em toda a espessura, sub-base examinada/reparada, filme sobre a sub-base, barras de transferência a meia altura (metade engraxada), ponte de aderência; juntas aprofundadas 1–2 cm e seladas",
      "5.3", "Reparos em toda a espessura", "procedimento da 5.3.1", tem("sTra")),
    it("rec", "Reconstituição parcial: L orientado no sentido longitudinal (L/B ≈ 1,5 a 2), suporte recompactado/substituído, armadura com 25 cm de espera, barras mantidas se não oxidadas, juntas refeitas e seladas; área de 1/3 a 2/3 da placa quando em toda a largura",
      "5.4", "Reconstituição da placa", "procedimento da 5.4", tem("sRec")),
    it("tot", "Reconstituição total (reparo > 2/3 da placa): concreto pobre de 10 cm na fundação (salvo sub-base semirrígida em bom estado), barras de transferência/ligação, juntas refeitas e seladas", "5.5", "Reconstituição da placa",
      "procedimento da 5.5", tem("sTot")),
    it("conc", "Concreto de reparo: resistência que atenda ao projeto e no mínimo igual à do concreto existente; baixa a/c; medidas contra a retração", "5.3.1 g a j", "Concreto", "fck/fctM,k ≥ projeto e ≥ existente", concreto),
    G.itemAbatimento({ secao: "6.2 (DNIT 047: 5.1.10 d; 7.2.1)", min: 60, max: 80, exigido: "70 ± 10 mm (DNIT 047), cada amassada", se: concreto }),
  ];
  var params = SERV.map(function (s) { return { k: s[0], r: "Serviço executado: " + s[1], tipo: "select", recarrega: true, opcoes: [["nao", "Não"], ["sim", "Sim"]] }; })
    .concat([{ k: "areaConc", r: "Área de placas reconstituídas / reparadas com concreto (m²)", dica: "define o nº de exemplares (6 por 2.500 m², DNIT 047)" }, { k: "amassadas", r: "Amassadas (betonadas) de concreto de reparo", dica: "abatimento em cada amassada (DNIT 047, 7.2.1)" }]);
  var padrao = { resTipo: "flexao", idadeCtrl: "28", resSup: "nao" };
  SERV.forEach(function (s) { padrao[s[0]] = "nao"; });
  var comp = G.compResistencia({ secao: "6.2 (DNIT 047: 7.4.1.1)", secAuto: "DNIT 047: 7.4.1.2", secMold: "DNIT 047: 7.2.2.2", secSup: "DNIT 047: 7.4.1.3", secaoExig: "DNIT 047: 7.2.2.1",
    exPorTrecho: 6, areaTrecho: 2500, sup: "estimativa", areaDe: function (P) { return FE.num(P.areaConc); }, importar: ["dner-me-091-98"],
    provNC: "Refazer os reparos com concreto conforme (6.2) ou adotar as decisões da DNIT 047, 7.4.1.3 c." });
  comp.se = concreto;
  G.criarFicha({
    id: ID,
    titulo: "Reabilitação de pavimento rígido — aceitação dos reparos",
    resumo: "Marque os serviços executados no segmento: cada um é verificado contra o procedimento da ES (6.1 — reparo feito de outra maneira não é aceito); o concreto dos reparos é controlado como na DNIT 047 (6.2): abatimento e resistência característica estimada.",
    lote: { largura: false },
    params: params, padrao: padrao,
    criterios: crit,
    componentes: [comp],
    extra: function (ctx) {
      if (!SERV.some(function (s) { return ctx.P[s[0]] === "sim"; })) ctx.avisos.push("Marque ao menos um serviço executado no segmento.");
    },
    notas: "Critérios da DNIT 067/2004-ES, seção 6. Cada serviço marcado exige a verificação do procedimento da seção 5 (6.1: \"não serão aceitos os reparos que forem feitos de maneira diferente\") — falha reprova. " +
      "Concreto (6.2): controlado como na DNIT 047/2004-ES — abatimento 70 ± 10 mm em cada amassada e fctM,est = fctM − k·s ≥ fctM,k (ou fck,est), k da Tabela 1 de Student da DNIT 047 (" + G.STUDENT_TXT + "), mín. 6 exemplares; " +
      "sem aceitação automática, ≥ 6 CPs extraídos. Requisitos do concreto de reparo: C ≥ 350 kg/m³ (5.2.1.1 f), a/c ≤ 0,45 (5.2.3), Dmáx ≤ 1/3 da espessura do reparo, resistência ≥ projeto e ≥ existente (5.3.1 i).",
    exemplos: [
      { nome: "Reparos aceitos — resselagem, fissuras e 2 placas reconstituídas (concreto com 6 exemplares)", dados: function () {
        var F = FE.FICHAS[ID];
        var d = { ident: { registro: "LOTE-RB-001", data: "2026-02-12", obra: "Obra A — BR-000", trecho: "Segmento de restauração 1", local: "Est. 40 a 90", camada: "Reabilitação de pavimento de concreto" },
          params: Object.assign({}, F.padrao, { estIni: "40", estFim: "90", sSel: "sim", sFis: "sim", sTot: "sim", areaConc: "52", fctmk: "4,5", amassadas: "4" }),
          verificacoes: G.verifEx(F), res: [], abat: [] };
        d.res = [[5.21, 5.04], [4.98, 5.15], [5.33, 5.20], [5.09, 4.94], [5.26, 5.38], [5.02, 5.11]].map(function (x, i) {
          return { est: i < 3 ? "P-512" : "P-640", reg: "CP-RB-" + (10 + i), idade: "28", cp1: A.nstr(x[0], 2), cp2: A.nstr(x[1], 2) }; });
        d.abat = [72, 68, 74, 70].map(function (v, i) { return { reg: "amassada " + (i + 1), v: String(v) }; });
        d.obs = "Placas P-512 e P-640 reconstituídas integralmente (5.5); resselagem de 420 m de juntas; 35 m de fissuras tratadas.";
        return d;
      } },
      { nome: "Reparos rejeitados — escamação sem ponte de aderência; concreto com só 4 exemplares", dados: function () {
        var F = FE.FICHAS[ID];
        var d = { ident: { registro: "LOTE-RB-002", data: "2026-02-26", obra: "Obra A — BR-000", trecho: "Segmento de restauração 2", local: "Est. 90 a 120", camada: "Reabilitação de pavimento de concreto" },
          params: Object.assign({}, F.padrao, { estIni: "90", estFim: "120", sEsb: "sim", sDes: "sim", areaConc: "38", fctmk: "4,5", amassadas: "3" }),
          verificacoes: G.verifEx(F, { des: { real: "5", nc: "2", obs: "ponte de aderência seca antes do lançamento em 2 reparos (placas P-702 e P-715)" } }), res: [], abat: [] };
        d.res = [[5.01, 4.88], [4.76, 4.92], [5.12, 5.05], [4.85, 4.70]].map(function (x, i) { return { est: "P-70" + i, reg: "CP-RB-" + (30 + i), idade: "28", cp1: A.nstr(x[0], 2), cp2: A.nstr(x[1], 2) }; });
        d.abat = [71, 66, 88].map(function (v, i) { return { reg: "amassada " + (i + 1), v: String(v) }; });
        return d;
      } },
    ],
  });
})();
