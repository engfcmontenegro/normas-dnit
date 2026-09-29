/*
 * Ficha de aceitação — DNER-ES 355/97 Edificações — Vidraçaria.
 * Usa FE.aceitacaoG10b (definido em es-dner-es-353-97.js).
 */
(function () {
  "use strict";
  var FE = window.FE, G = FE.aceitacaoG10b;

  var F = G.ficha({
    id: "dner-es-355-97",
    titulo: "Vidraçaria (DNER-ES 355/97) — aceitação do serviço",
    resumo: "Controle visual do recebimento e da instalação dos vidros (seção 6) com as exigências da seção 5: ondulações na horizontal, " +
      "bordas esmerilhadas, vidro de segurança abaixo de 0,90 m nas fachadas sem proteção acima do térreo, vidro recozido interno a partir de " +
      "0,10 m do piso, assentamento sem contato metal–vidro, dois calços e folga de 3,0 a 5,0 mm entre o vidro e a esquadria.",
    lote: false,
    params: [
      { k: "qtd", r: "Área de vidro instalada no lote (m²)", dica: "medição por m² de vidro instalado (seção 7)" },
      { k: "nChapas", r: "Nº de chapas instaladas", dica: "seção 6: controle visual de todas as chapas" },
      G.sel("acimaTerreo", "Há vidros em faces externas de pavimentos acima do térreo? (5.4)"),
      G.sel("temperado", "Há vidros temperados? (5.5)"),
      G.sel("grampos", "Há vidros fixados com grampos ou prendedores? (5.6)"),
      G.sel("caixilho", "Há vidros assentados em caixilhos? (5.7)"),
    ],
    padrao: { acimaTerreo: "sim", temperado: "nao", grampos: "nao", caixilho: "sim" },
    providencias: function (par) { return par.parecer === "REJEITADO" ? ["Substituir as chapas recusadas ou refazer o assentamento e repetir a inspeção visual (seção 6)."] : []; },
    criterios: [
      { id: "projeto", grupo: "Condições gerais", texto: "Execução conforme projeto, desenhos e demais elementos", secao: "4.1", tipo: "sim_nao", exigido: "conforme o projeto" },
      { id: "ondul", grupo: "Condições específicas", texto: "Vidros comuns lisos e transparentes com as ondulações na horizontal", secao: "5.1", tipo: "sim_nao",
        exigido: "ondulações na horizontal" },
      { id: "bordas", grupo: "Condições específicas", texto: "Bordas de corte esmerilhadas, lisas, sem arestas estilhaçadas", secao: "5.3", tipo: "sim_nao",
        exigido: "sem arestas estilhaçadas" },
      { id: "seguranca", grupo: "Condições específicas", texto: "Faces externas sem proteção, acima do térreo: abaixo de 0,90 m só vidro de segurança (laminado ou aramado)",
        secao: "5.4", tipo: "sim_nao", se: G.se("acimaTerreo"), exigido: "vidro de segurança abaixo de 0,90 m" },
      { id: "hExt", grupo: "Condições específicas", texto: "Cota inferior do vidro comum (não de segurança) em face externa sem proteção, acima do térreo",
        secao: "5.4", tipo: "valor", unid: "m", casas: 2, min: 0.90, se: G.se("acimaTerreo"), metodo: "trena", exigido: "≥ 0,90 m acima do piso" },
      { id: "hInt", grupo: "Condições específicas", texto: "Cota inferior dos vidros recozidos internos", secao: "5.4", tipo: "valor", unid: "m", casas: 2, min: 0.10,
        metodo: "trena", exigido: "≥ 0,10 m acima do piso" },
      { id: "temp", grupo: "Condições específicas", texto: "Vidros temperados: dispositivos de assentamento detalhados; sustentação indeformável e resistente", secao: "5.5",
        tipo: "sim_nao", se: G.se("temperado"), exigido: "sem cortes ou furos no canteiro; apoios verificados" },
      { id: "cartao", grupo: "Condições específicas", texto: "Grampos/prendedores sem contato direto metal–vidro (cartão intercalado)", secao: "5.6", tipo: "sim_nao",
        se: G.se("grampos"), exigido: "cartão apropriado entre metal e vidro" },
      { id: "calcos", grupo: "Condições específicas", texto: "Em caixilhos: gaxetas de neoprene ou baguetes baixos; chapa apoiada só em dois calços a 1/3 do vão das extremidades",
        secao: "5.7", tipo: "sim_nao", se: G.se("caixilho"), exigido: "dois calços; sem apoio em toda a borda" },
      { id: "folga", grupo: "Condições específicas", texto: "Folga entre o vidro e a esquadria", secao: "5.7", tipo: "valor", unid: "mm", casas: 1, min: 3.0, max: 5.0,
        se: G.se("caixilho"), falha: "ressalva", metodo: "calibre / paquímetro", exigido: "da ordem de 3,0 a 5,0 mm" },
      { id: "visual", grupo: "Inspeção", texto: "Controle visual do recebimento e da instalação (chapas sem trincas, riscos ou falhas de assentamento)", secao: "6",
        tipo: "sim_nao", exigido: "todas as chapas conformes", freq: G.todas("nChapas", "todas as chapas") },
    ],
    notas: "DNER-ES 355/97: controle visual do recebimento e da instalação (seção 6). A ES não tem seção de aceitação e rejeição; a ficha aplica a regra " +
      "das demais ES de edificações do grupo (ex.: DNER-ES 353/97, 6.3). A folga de 3,0 a 5,0 mm é dada como \"da ordem de\" (5.7): fora dela, ressalva.",
  });

  F.exemplos = [
    { nome: "Lote aceito — vidros das janelas do pavimento superior (Obra A)", dados: function () {
      return G.dados(F, { ident: { registro: "VID-01", data: "2026-08-27", obra: "Obra A — edifício administrativo", local: "Bloco 1 — pavimento superior",
          camada: "Vidro liso 4 mm e laminado 6 mm (peitoris)" },
        params: { qtd: "31,5", nChapas: "18" },
        verificacoes: [{ atende: "S" }, { real: "18", nc: "0" }, { real: "18", nc: "0" }, { real: "6", nc: "0" }, {}, {}, { real: "18", nc: "0" }, { real: "18", nc: "0" }],
        hExt: [{ est: "J1", v: "0,95" }, { est: "J3", v: "1,00" }, { est: "J5", v: "0,92" }],
        hInt: [{ est: "Div. 1", v: "0,15" }, { est: "Div. 2", v: "0,12" }],
        folga: [{ est: "J1", v: "4,0" }, { est: "J2", v: "3,5" }, { est: "J4", v: "4,5" }, { est: "J6", v: "3,0" }] });
    } },
    { nome: "Lote com ressalva — folga abaixo de 3 mm em duas janelas (Obra B)", dados: function () {
      return G.dados(F, { ident: { registro: "VID-02", data: "2026-09-08", obra: "Obra B — posto de pesagem", local: "Sala de controle",
          camada: "Vidro liso 5 mm" },
        params: { qtd: "12,8", nChapas: "8", acimaTerreo: "nao" },
        verificacoes: [{ atende: "S" }, { real: "8", nc: "0" }, { real: "8", nc: "0" }, {}, {}, {}, { real: "8", nc: "0" }, { real: "8", nc: "0" }],
        hInt: [{ est: "Visor", v: "0,90" }],
        folga: [{ est: "J1", v: "3,5" }, { est: "J2", v: "2,0" }, { est: "J3", v: "4,0" }, { est: "J4", v: "2,5" }] });
    } },
  ];
})();
