/*
 * Ficha de ES: DNIT 072/2006-ES — Tratamento ambiental de áreas de uso de obras e do passivo ambiental de áreas
 * íngremes ou de difícil acesso pelo processo de revegetação herbácea (hidrossemeadura, recuperação de voçorocas,
 * revegetação manual) — aceitação da área tratada. Usa A.fichaSimples via FE.aceitacaoG11 (es-dnit-071-2006-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG11, num = FE.num, ok = FE.ok, fmt = FE.fmt;

  var hidro = function (P) { return P.processo !== "manual"; };
  var voc = function (P) { return G.sim(P, "vocoroca"); };
  var sc = function (P) { return G.sim(P, "ripsc"); };
  var C = [
    { id: "analise", texto: "Análise edáfica e pedológica do solo do talude — define calagem, adubação e espécies", secao: "4", grupo: "Materiais", tipo: "sim_nao",
      exigido: "realizada antes do plantio" },
    { id: "certif", texto: "Certificado das sementes (origem, data de expedição, nome científico, poder germinativo, grau de pureza e valor cultural); fornecedor idôneo",
      secao: "5.1.2", grupo: "Materiais", tipo: "sim_nao", exigido: "certificado de cada lote" },
    G.calcario("5.1.1 c"),
    { id: "adubos", texto: "Adubos e compostos orgânicos industrializados: registro do produtor no Ministério da Agricultura", secao: "5.4.1 d", grupo: "Materiais",
      tipo: "sim_nao", exigido: "registro apresentado" },
    { id: "adesivo", texto: "Camada protetora (fibras vegetais / celulose) e adesivo fixador com as características de 5.1.3 e 5.1.4", secao: "5.1.3; 5.1.4",
      grupo: "Materiais", tipo: "sim_nao", se: hidro, naoAplicaPor: "revegetação manual", exigido: "conforme 5.1.3 e 5.1.4" },
    { id: "regul", texto: "Regularização manual dos taludes (de cima para baixo, superfícies planas sem ressaltos ou cavidades) e escarificação com furos ou covas desencontrados",
      secao: "5.4.1 a, b", grupo: "Execução", tipo: "sim_nao", exigido: "inspeção antes do plantio" },
    { id: "antcal", texto: "Antecedência da calagem em relação ao plantio", secao: "5.4.1 c", grupo: "Execução", tipo: "valor", unid: "dias", casas: 0,
      min: 30, falha: "ressalva", exigido: "≈ 30 dias antes do plantio (pode ser substituída por matéria orgânica em taludes muito altos)", freq: G.lote() },
    { id: "taxa", texto: "Taxa de aplicação da mistura aquosa (hidrossemeadura)", secao: "5.2.1; 5.4.1 f", grupo: "Execução", tipo: "valor", unid: "L/m²", casas: 2,
      min: 1.5, max: 2.0, falha: "ressalva", se: hidro, naoAplicaPor: "revegetação manual",
      exigido: "1,5 a 2,0 L/m² (5.000 L para 2.500 a 3.300 m²)", freq: { por: "lote", minimo: 1, regra: "por carga do caminhão (5.000 L); mín. 1 por lote" } },
    { id: "mulch", texto: "Camada protetora (mulch) aplicada", secao: "5.2.1; 5.4.1 e", grupo: "Execução", tipo: "valor", unid: "kg/ha", casas: 0,
      min: 3000, se: hidro, naoAplicaPor: "revegetação manual", exigido: "≥ 3.000 kg/ha (quantidade mínima exigida)", freq: G.lote() },
    { id: "irrig", texto: "Irrigação em chuvisco leve até umidade a 10 cm de profundidade, até 50 % das sementes germinarem; no período seco ≥ 1 vez por semana, 1 a 2 L/m²",
      secao: "5.4.1 (irrigação); 5.4.1 g", grupo: "Execução", tipo: "sim_nao", falha: "ressalva", exigido: "registro das irrigações" },
    { id: "adubcob", texto: "Adubação de cobertura: 1ª aos 45 dias após o plantio e outra no período chuvoso (≥ 2 fertilizações)", secao: "5.4.1 h", grupo: "Execução",
      tipo: "sim_nao", se: G.etapa2, naoAplicaPor: "verificada na 2ª etapa", exigido: "≥ 2 fertilizações" },
    { id: "replantio", texto: "Replantio das falhas de germinação ou de aplicação até o revestimento completo", secao: "5.4.1 j", grupo: "Execução", tipo: "sim_nao",
      se: G.etapa2, naoAplicaPor: "verificado na 2ª etapa", exigido: "sem falhas remanescentes" },
    { id: "cabeceira", texto: "Voçoroca: drenagem de contorno, proteção da cabeceira e do deságue, modelagem e diques conforme o projeto ambiental",
      secao: "5.4.2 b a f", grupo: "Voçoroca e rip-rap", tipo: "sim_nao", se: voc, naoAplicaPor: "sem recuperação de voçoroca", exigido: "conforme projeto ambiental" },
    { id: "geomvoc", texto: "Voçoroca: controle geométrico — alinhamento, declividade e dimensões do projeto ambiental", secao: "6", grupo: "Voçoroca e rip-rap",
      tipo: "sim_nao", se: voc, naoAplicaPor: "sem recuperação de voçoroca", exigido: "conforme projeto ambiental" },
    { id: "tcomp", texto: "Rip-rap de solo-cimento: tempo entre o preparo da mistura e a compactação dos sacos", secao: "5.4.2 d", grupo: "Voçoroca e rip-rap",
      tipo: "valor", unid: "h", casas: 1, max: 2, se: sc, naoAplicaPor: "sem rip-rap de solo-cimento", exigido: "≤ 2 h após o preparo", freq: G.lote() },
    { id: "muro", texto: "Rip-rap de solo-cimento: sacos a 80 %, fileiras em mata-junta compactadas do centro para a periferia; muro com face 1/4, altura ≤ 4 m, base ≥ 1/3 da altura, dreno vertical e barbacãs",
      secao: "5.2.2; 5.4.2 d", grupo: "Voçoroca e rip-rap", tipo: "sim_nao", se: sc, naoAplicaPor: "sem rip-rap de solo-cimento", exigido: "conforme 5.4.2 d" },
    { id: "rcsc", texto: "Resistência à compressão simples do solo-cimento (corpos de prova)", secao: "6; 5.2.2", grupo: "Voçoroca e rip-rap", tipo: "valor",
      unid: "MPa", casas: 2, min: function (P) { return num(P.fcsc); }, se: sc, naoAplicaPor: "sem rip-rap de solo-cimento", metodo: "DNER-ME 201/94",
      exigido: "≥ resistência desejada (30 kgf/cm² ≈ 2,94 MPa no traço em peso)",
      freq: { por: "lote", minimo: 1, regra: "controle assistemático — CPs rompidos aos 30 dias (6)" },
      importar: { de: "dner-me-201-94", valores: function (e) {
        var cps = (e.dados || {}).cp || [], ind = (e.resultados || {}).individuais || [];
        // só CPs com idade ≥ 28 dias (a seção 6 manda romper aos 30 dias; 5.2.2 cita 28 dias); CPs mais novos não entram
        return ind.map(function (v, i) {
          var c = cps[i] || {}, id = num(c.idade);
          if (ok(id) && id < 28) return { v: NaN };
          return { v: v, pos: (c.idade ? c.idade + " dias" : ""), rot: "CP " + (c.id || i + 1) + (c.idade ? " · " + c.idade + " d" : "") };
        });
      } } },
    { id: "acab", texto: "Acabamento das superfícies revegetadas: apresentação visual uniforme e harmoniosa com o relevo circundante", secao: "6", grupo: "Produto",
      tipo: "sim_nao", exigido: "aprovado pela Fiscalização" },
    G.inspecoes("insp", "6", "Inspeções técnicas (desenvolvimento das espécies, grau de cobertura, vigor e demais exigências agronômicas)", 30),
    G.cobertura("6; 7 b"),
  ];

  G.fichaComSementes({
    id: "dnit-072-2006-es",
    titulo: "Revegetação herbácea de áreas íngremes ou de difícil acesso (hidrossemeadura, voçorocas) — aceitação da área tratada",
    resumo: "Verificações da DNIT 072/2006-ES: sementes (Tabelas 3 e 4), calcário ≤ 1,5 t/ha, preparo do talude, taxa da mistura (1,5 a 2,0 L/m²), camada protetora ≥ 3.000 kg/ha, irrigação, adubação de cobertura, voçorocas e rip-rap de solo-cimento (compressão simples), inspeções a cada 30 dias e cobertura vegetal completa (2ª etapa).",
    lote: false,
    params: [G.paramArea, G.ETAPA,
      { k: "processo", r: "Processo de revegetação", tipo: "select", recarrega: true, opcoes: [["hidro", "Hidrossemeadura (5.4.1)"], ["manual", "Revegetação manual (5.4.3)"]] },
      { k: "vocoroca", r: "Recuperação de voçoroca (5.4.2)?", tipo: "select", recarrega: true, opcoes: G.SIM_NAO },
      { k: "ripsc", r: "Diques / muros de rip-rap de solo-cimento?", tipo: "select", recarrega: true, opcoes: G.SIM_NAO },
      { k: "fcsc", r: "Resistência desejada do solo-cimento (MPa)", se: sc, dica: "5.2.2: 30 kgf/cm² ≈ 2,94 MPa (traço em peso); 6: conforme a relação experimental de resistências desejadas" },
      G.paramSeco, G.paramDias],
    padrao: { etapa: "1", processo: "hidro", vocoroca: "nao", ripsc: "nao", fcsc: "2,94", seco: "nao" },
    criterios: C,
    extra: function (ctx) {
      var P = ctx.P, ci = ctx.item.cobertura;
      if (ci && ci.situacao === "nao_conforme") A.marcar(ci, "nao_conforme", "área não aceita para a 2ª medição (7 b): replantio (5.4.1 j) até o fechamento da cobertura");
      if (G.etapa2(P) && ok(num(P.dias)) && num(P.dias) < 45) ctx.avisos.push("2ª etapa com menos de 45 dias do plantio: a 1ª adubação de cobertura é aos 45 dias (5.4.1 h).");
    },
    notas: "Critérios da DNIT 072/2006-ES: seção 6 (acabamento visual, controle geométrico das voçorocas pelo projeto ambiental, inspeções técnicas a cada 30 dias e controle tecnológico do solo-cimento por compressão simples aos 30 dias, \"controle assistemático\") e valores das seções 5.1 a 5.4. Taxa da mistura, antecedência da calagem e dose de calcário: ressalva (descritos \"da ordem de\"); camada protetora ≥ 3.000 kg/ha (\"quantidades mínimas exigidas\") e compactação do solo-cimento em até 2 h: não conformidade. Resistência do solo-cimento: valor desejado do projeto (padrão 30 kgf/cm² = 2,94 MPa, citado em 5.2.2 para 28 dias). Sementes: Tabelas 3 e 4; VC = pureza × germinação / 100, leguminosas nacionais VC ≥ 56,25 % (a ES imprime 56,26 %).",
    exemplos: [
      { nome: "Talude de corte — hidrossemeadura, 2ª etapa (aceito)", dados: function () {
        var P = { area: "3800", etapa: "2", processo: "hidro", vocoroca: "nao", ripsc: "nao", fcsc: "2,94", seco: "nao", dias: "95" };
        return { ident: { registro: "AMB-072-01", data: "2026-04-22", obra: "Obra A", trecho: "BR-000 — km 22 a km 22,4", local: "Talude de corte LE, est. 110 a 128" },
          params: P, verificacoes: G.verif(C, P, { insp: { real: "3" } }),
          sementes: [{ reg: "Azevém — lote 3", tipo: "G", orig: "I", pur: "92", ger: "85" }, { reg: "Brachiaria — lote 4", tipo: "G", orig: "N", pur: "60", ger: "66" },
            { reg: "Mucuna — lote 5", tipo: "L", orig: "N", pur: "88", ger: "80" }],
          calcario: G.vals([["Talude todo", "1,00"]]),
          antcal: G.vals([["Calagem 15/12 → plantio 16/01", "32"]]),
          taxa: G.vals([["Carga 1 (5.000 L / 2.900 m²)", "1,72"], ["Carga 2 (3.000 L / 1.800 m²)", "1,67"]]),
          mulch: G.vals([["Consumo total / área", "3150"]]),
          cobertura: G.vals([["Inspeção de 95 dias", "100"]]) };
      } },
      { nome: "Voçoroca com rip-rap de solo-cimento — 1ª etapa (rejeitada)", dados: function () {
        var P = { area: "6400", etapa: "1", processo: "hidro", vocoroca: "sim", ripsc: "sim", fcsc: "2,94", seco: "nao", dias: "35" };
        var d = { ident: { registro: "AMB-072-02", data: "2026-07-08", obra: "Obra C", trecho: "BR-000 — km 61", local: "Voçoroca a jusante do bueiro, lado direito" },
          params: P, verificacoes: G.verif(C, P, { insp: { real: "1" }, geomvoc: { atende: "N", obs: "dique 3 com crista 0,4 m abaixo do projeto" } }),
          sementes: [{ reg: "Capim-gordura — lote 9", tipo: "G", orig: "N", pur: "50", ger: "64" }],
          calcario: G.vals([["Área toda", "1,40"]]),
          antcal: G.vals([["Calagem → plantio", "21"]]),
          taxa: G.vals([["Carga 1", "1,25"], ["Carga 2", "1,60"]]),
          mulch: G.vals([["Consumo total / área", "2600"]]),
          tcomp: G.vals([["Dique 1", "1,5"], ["Dique 3", "2,5"]]) };
        A.exemplos.importar(FE.FICHAS["dnit-072-2006-es"].params, d, "imp_rcsc", [["dner-me-201-94", 1]]);
        return d;
      } },
    ],
  }, { secao: "5.1.2", tabs: "Tabelas 3 e 4" });
})();
