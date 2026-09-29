/*
 * Ficha de ACEITAÇÃO: DNIT 102/2009-ES — Proteção do corpo estradal — Proteção vegetal.
 * Funções comuns: FE.aceitacaoG7 (es-dnit-104-2009-es.js).
 *
 * O que a ES manda (seções do PDF):
 *   4.4    análise do solo (acidez, fertilidade) corrigida por calagem e adubação; teste de germinação das sementes; vigor e sanidade das mudas.
 *   5.3.1 a) sulcos em taludes: perpendiculares à declividade, espaçados de 0,70 m a 1,00 m, com 0,15 m de profundidade e 0,20 m de
 *          largura; irrigação de 10 L/m² a cada 5 dias até a germinação/pegamento; adubação de cobertura após 6 meses (p. 5).
 *   5.3.1 b) enleivamento (placas fixadas por estacas); c) hidrossemeadura (adesivo 1.000 L/ha; mulch 3 t/ha; solução ≈ 20.000 L/ha).
 *   5.3.2 a) áreas planas, lanço: aração e gradagem com no mínimo 8 cm; sementes incorporadas a 1,0 cm e totalmente cobertas;
 *          b) mudas em sulcos: espaçamento de 1 m, profundidade de 15 cm, mudas a cada 40–50 cm.
 *   7.1    insumos (corretivos, fertilizantes, sementes e mudas) conforme as Instruções Normativas do MAPA.
 *   7.2    taxas de adubação, espécies do projeto, períodos e quantidades de irrigação.
 *   7.3    inspeções visuais a cada 30 dias (espécies, germinação, pegamento, % de cobertura, fitossanidade); "usual" cobertura
 *          de 100 % da área em 120 a 150 dias (p. 7).
 *   7.4    atender às seções 4 e 5; 8: medição em duas etapas (50 % no plantio aprovado; 50 % com cobertura completa).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G7 = FE.aceitacaoG7, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var ID = "dnit-102-2009-es";
  function met(P) { return P.metodo || "sulcos"; }
  function se(lista) { return function (P) { return lista.indexOf(met(P)) >= 0; }; }
  var GE = "Execução (5.3)";

  A.fichaSimples({
    id: ID,
    titulo: "Proteção vegetal — aceitação",
    resumo: "Verificações da DNIT 102/2009-ES: insumos (7.1), execução conforme o método de plantio (dimensões dos sulcos, aração, espaçamento das mudas — 5.3), " +
      "irrigação e adubação (7.2), inspeções a cada 30 dias e cobertura vegetal (7.3), com a etapa de medição da seção 8.",
    lote: { largura: false },
    params: [
      { k: "metodo", r: "Método de proteção vegetal (5.3)", tipo: "select", recarrega: true,
        opcoes: [["sulcos", "Talude — plantio em sulcos (5.3.1 a)"], ["leivas", "Talude — enleivamento (5.3.1 b)"], ["hidro", "Talude — hidrossemeadura (5.3.1 c)"],
          ["lanco", "Área plana — lanço de sementes (5.3.2 a)"], ["mudas", "Área plana — hastes e estolões em sulcos (5.3.2 b)"]] },
      { k: "areaT", r: "Área tratada (m²) — medida na superfície do talude (8)" },
      { k: "dias", r: "Dias decorridos desde o plantio", dica: "inspeções a cada 30 dias (7.3); cobertura de 100 % usual entre 120 e 150 dias" },
    ],
    padrao: { metodo: "sulcos" },
    refs: { reprova: "7.4", atende: "7.4", corrige: "7.3", regra: "7.4", tabela: "—" },
    criterios: [
      { id: "ins", grupo: "Insumos (7.1)", texto: "Corretivos, fertilizantes, sementes e mudas com qualidade comprovada (Instruções Normativas do MAPA)", secao: "7.1", tipo: "sim_nao",
        exigido: "certificados / garantias" },
      { id: "solo", grupo: "Insumos (7.1)", texto: "Análise do solo e teste de germinação realizados; calagem e adubação conforme o padrão", secao: "4.4; 5.3.3", tipo: "sim_nao" },
      { id: "esp", grupo: "Controle da execução (7.2)", texto: "Espécies vegetais recomendadas no projeto", secao: "7.2", tipo: "sim_nao" },
      { id: "irr", grupo: "Controle da execução (7.2)", texto: "Irrigação: períodos e quantidades (10 L/m² a cada 5 dias até a germinação/pegamento)", secao: "7.2; 5.3.1 a", tipo: "sim_nao" },
      { id: "prep", grupo: GE, texto: "Preparo do solo: regularização, ravinas recuperadas, tocos e pedras retirados", secao: "5.3.1; 5.3.2", tipo: "sim_nao" },
      { id: "sEsp", grupo: GE, texto: "Espaçamento entre sulcos", secao: "5.3.1 a", tipo: "valor", unid: "m", casas: 2, min: 0.7, max: 1.0, se: se(["sulcos"]),
        exigido: "0,70 a 1,00 m", naoAplicaPor: "outro método" },
      { id: "sProf", grupo: GE, texto: "Profundidade dos sulcos", secao: "5.3.1 a; 5.3.2 b", tipo: "valor", unid: "cm", casas: 0, min: 15, falha: "ressalva", se: se(["sulcos", "mudas"]),
        exigido: "15 cm (mínimo adotado)", naoAplicaPor: "outro método" },
      { id: "sLarg", grupo: GE, texto: "Largura dos sulcos", secao: "5.3.1 a", tipo: "valor", unid: "cm", casas: 0, min: 20, falha: "ressalva", se: se(["sulcos"]),
        exigido: "20 cm (mínimo adotado)", naoAplicaPor: "outro método" },
      { id: "arac", grupo: GE, texto: "Profundidade da aração e gradagem", secao: "5.3.2 a", tipo: "valor", unid: "cm", casas: 0, min: 8, se: se(["lanco", "mudas"]),
        exigido: "≥ 8 cm (ou a recomendada para o solo)", naoAplicaPor: "talude" },
      { id: "mEsp", grupo: GE, texto: "Espaçamento entre mudas no sulco", secao: "5.3.2 b", tipo: "valor", unid: "cm", casas: 0, min: 40, max: 50, se: se(["mudas"]),
        exigido: "40 a 50 cm", naoAplicaPor: "outro método" },
      { id: "leiva", grupo: GE, texto: "Placas de leiva fixadas por estacas", secao: "5.3.1 b", tipo: "sim_nao", se: se(["leivas"]), naoAplicaPor: "outro método" },
      { id: "hidro", grupo: GE, texto: "Hidrossemeadura: calcário, adesivo (1.000 L/ha, 1/20), mulch (3 t/ha) e solução (≈ 20.000 L/ha) homogênea", secao: "5.3.1 c", tipo: "sim_nao",
        se: se(["hidro"]), naoAplicaPor: "outro método" },
      { id: "cobre", grupo: GE, texto: "Sementes incorporadas (≈ 1,0 cm) e totalmente cobertas de terra", secao: "5.3.2 a, b", tipo: "sim_nao", se: se(["lanco", "mudas"]), naoAplicaPor: "talude" },
      { id: "insp", grupo: "Verificação do produto (7.3)", texto: "Inspeção visual: espécies, germinação, pegamento, fitossanidade; invasoras eliminadas e mudas mortas substituídas", secao: "7.3",
        tipo: "sim_nao", freq: { por: "tempo", a_cada: 30, qtd: "dias", unidade: "dias" } },
      { id: "cob", grupo: "Verificação do produto (7.3)", texto: "Cobertura vegetal da área plantada", secao: "7.3", tipo: "valor", unid: "%", casas: 0, min: 100, falha: "ressalva",
        exigido: "100 % (usual entre 120 e 150 dias)", se: function (P) { return num(P.dias) >= 120; }, naoAplicaPor: "menos de 120 dias do plantio" },
      G7.ambiental("6", "6", "Verificação do produto (7.3)"),
    ],
    extra: function (ctx) {
      var P = ctx.P;
      G7.ocultar(ctx, ["sEsp", "sProf", "sLarg", "arac", "mEsp", "leiva", "hidro", "cobre"]);
      if (!ok(num(P.dias))) ctx.avisos.push("Informe os dias decorridos desde o plantio: as inspeções são a cada 30 dias (7.3).");
      var c = ctx.item.cob, a = num(P.areaT), pleno = c && c.situacao === "conforme";
      var l = A.linha({ id: "med", grupo: "Verificação do produto (7.3)", criterio: "Etapa de medição (8)", secao: "8", situacao: "informativo",
        exigido: "50 % no plantio aprovado; 50 % com cobertura completa",
        resultado: (pleno ? "100 % da área medível" : "50 % da área medível (1ª etapa)") + (ok(a) ? " — " + fmt(pleno ? a : a / 2, 0) + " m² de " + fmt(a, 0) + " m²" : "") });
      ctx.linhas.push(l);
      if (c && c.situacao === "ressalva" && num(P.dias) > 150) A.marcar(c, "ressalva", "cobertura incompleta após 150 dias: replantar/adubar e reinspecionar (7.3)");
    },
    notas: "Critérios da DNIT 102/2009-ES. A ES não traz limites de aceitação numéricos nem estatística: dimensões de execução (5.3) avaliadas por valor individual — profundidade e largura " +
      "dos sulcos como mínimos com ressalva; cobertura de 100 % (\"usual\" em 120–150 dias, 7.3) exigida a partir de 120 dias, com ressalva. Inspeções a cada 30 dias contadas pelos dias desde o plantio.",
    exemplos: [
      { nome: "Talude com plantio em sulcos aceito — 150 dias, cobertura completa", dados: function () {
        return { ident: { registro: "PV-01", data: "2026-09-10", obra: "Obra A", trecho: "Talude de corte 3 (LD)", local: "Est. 120 a 135" },
          params: { estIni: "120", estFim: "135", metodo: "sulcos", areaT: "2400", dias: "150" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S", real: "5" }, { atende: "S" }, {}, {}, {}, { atende: "S", real: "5" }, { atende: "S" }],
          sEsp: [{ est: "122", v: "0,80" }, { est: "128", v: "0,90" }, { est: "133", v: "0,75" }],
          sProf: [{ est: "122", v: "15" }, { est: "128", v: "16" }, { est: "133", v: "15" }],
          sLarg: [{ est: "122", v: "20" }, { est: "128", v: "22" }, { est: "133", v: "21" }],
          cob: [{ est: "122", v: "100" }, { est: "128", v: "100" }, { est: "133", v: "100" }] };
      } },
      { nome: "Área plana por lanço rejeitada — aração rasa, inspeções atrasadas e cobertura incompleta aos 160 dias", dados: function () {
        return { ident: { registro: "PV-02", data: "2026-09-15", obra: "Obra B", trecho: "Caixa de empréstimo E-2 (recuperação)", local: "Empréstimo E-2" },
          params: { metodo: "lanco", areaT: "8500", dias: "160" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S", real: "3" }, { atende: "S" }, {}, {}, { atende: "S" }, { atende: "S", real: "3" }, { atende: "S" }],
          arac: [{ est: "", pos: "quadra 1", v: "10" }, { est: "", pos: "quadra 2", v: "6" }],
          cob: [{ pos: "quadra 1", v: "95" }, { pos: "quadra 2", v: "80" }] };
      } },
    ],
  });
})();
