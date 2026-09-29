/*
 * Ficha de ES: DNIT 087/2006-ES — Concreto projetado (recuperação de obras-de-arte especiais).
 * Usa FE.aceitacao (es-comum.js) e FE.aceitacaoG9a (es-dnit-079-2006-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG9a, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var ID = "dnit-087-2006-es";

  A.fichaSimples({
    id: ID,
    titulo: "Concreto projetado — aceitação",
    resumo: "Diretrizes 5.6 (a/c de 0,35 a 0,50; resistência ≥ 1,2 × a do substrato; remoção do concreto contaminado e de todo o cobrimento; armadura com perda > 10 % substituída; " +
      "camadas de 25 a 40 mm — 25 a 50 mm em faces inferiores (7 d); cura ≥ 10 dias; aplicação entre 10 °C e 35 °C), aplicação (7), acabamento (8) e aceitação da seção 11 " +
      "(transcrição da NBR 14026: resistência de testemunhos de placas de controle, espessura por testemunho, fissuras, acabamento/segregação e infiltrações).",
    rotuloLink: "Aceitação do serviço",
    lote: false,
    params: [
      { k: "via", r: "Processo (3.3; 3.4)", tipo: "select", opcoes: [["seca", "Via seca"], ["umida", "Via úmida"]] },
      { k: "posicao", r: "Posição de trabalho (7 d)", tipo: "select", opcoes: [["inferior", "Face inferior de superfície elevada"], ["vertical", "Superfície vertical"], ["horizontal", "Superfície plana horizontal"]] },
      { k: "fcSub", r: "Resistência do substrato (MPa)", dica: "5.6 e: o concreto projetado deve ter resistência ≥ 1,2 × a do substrato" },
      { k: "espProj", r: "Espessura de projeto do concreto projetado (mm)", dica: "conferida em testemunhos da estrutura (11 a)" },
      { k: "nAreas", r: "Nº de áreas/aplicações", dica: "a espessura de cada camada é conferida por aplicação" },
    ].concat(G.paramsConcreto({ rotuloFck: "fck de projeto do concreto projetado (MPa)" })),
    padrao: Object.assign({ via: "seca", posicao: "vertical", nAreas: "1" }, G.padraoConcreto),
    textos: G.textos("A estrutura deve ser rejeitada quando não atender aos requisitos do projeto específico (11; NBR 14026, seção 7)."),
    criterios: [
      { id: "equipe", grupo: "Preparação", texto: "Materiais, equipamentos calibrados e equipe (mangoteiro qualificado) inspecionados por pessoal qualificado", secao: "6.1.5; 7 a, c; 10", tipo: "sim_nao" },
      G.itPlataforma("9", "Preparação"),
      { id: "remocao", grupo: "Preparação", texto: "Concreto contaminado removido até o concreto são (no mínimo todo o cobrimento), arestas arredondadas, jateamento de areia", secao: "5.6 f", tipo: "sim_nao" },
      { id: "armadura", grupo: "Preparação", texto: "Armadura limpa; barras com perda de seção > 10 % substituídas e envolvidas em pasta de cimento", secao: "5.6 g", tipo: "sim_nao" },
      { id: "adicional", grupo: "Preparação", texto: "Armadura adicional soldada à existente ou, com traspasse, a ≥ 2 diâmetros das outras barras", secao: "5.6 h", tipo: "sim_nao" },
      { id: "substrato", grupo: "Preparação", texto: "Substrato novamente limpo e umedecido quando preparado dias antes; aplicações sempre sobre superfície úmida", secao: "5.6 i; 7 b", tipo: "sim_nao" },
      { id: "ac", grupo: "Mistura e aplicação", texto: "Relação água/cimento", secao: "5.6 d", tipo: "valor", unid: "", casas: 2, min: 0.35, max: 0.50, metodo: "controle da dosagem" },
      { id: "temp", grupo: "Mistura e aplicação", texto: "Temperatura ambiente na aplicação", secao: "5.6 k", tipo: "valor", unid: "°C", casas: 0, min: 10, max: 35,
        exigido: "10 °C a 35 °C, sem ventos fortes nem chuvas intensas", metodo: "termômetro", freq: { por: "contagem", a_cada: 1, qtd: "nAreas", unidade: "aplicação(ões)", regra: "cada aplicação" } },
      { id: "clima", grupo: "Mistura e aplicação", texto: "Sem ventos fortes nem chuvas intensas durante a aplicação", secao: "5.6 k", tipo: "sim_nao" },
      { id: "camada", grupo: "Mistura e aplicação", texto: "Espessura de cada camada aplicada", secao: "5.6 i; 7 d", tipo: "valor", unid: "mm", casas: 0, min: 25,
        max: function (P) { return P.posicao === "inferior" ? 50 : 40; }, falha: "ressalva", metodo: "medição / gabarito",
        freq: { por: "contagem", a_cada: 1, qtd: "nAreas", unidade: "aplicação(ões)", regra: "cada aplicação" } },
      { id: "pega", grupo: "Mistura e aplicação", texto: "Camadas sucessivas aplicadas com a anterior em início de pega, sem endurecer", secao: "5.6 i", tipo: "sim_nao" },
      { id: "rebound", grupo: "Mistura e aplicação", texto: "Rebound não reaproveitado", secao: "7 e", tipo: "sim_nao" },
      { id: "acabamento", grupo: "Acabamento e cura", texto: "Acabamento natural; desempeno só sobre camada fina (≈ 6 mm) e úmida de argamassa projetada", secao: "8", tipo: "sim_nao" },
      { id: "cura", grupo: "Acabamento e cura", texto: "Duração da cura", secao: "5.6 j", tipo: "valor", unid: "dias", casas: 0, min: 10, metodo: "diário de obra" },
    ].concat(G.itensConcreto({ secao: "11", grupo: "Aceitação (11)", textoFc: "Resistência à compressão — testemunhos das placas de controle (fc por exemplar)" })).concat([
      { id: "espessura", grupo: "Aceitação (11)", texto: "Espessura em testemunho extraído da estrutura", secao: "11 a", tipo: "valor", unid: "mm", casas: 0,
        min: function (P) { return num(P.espProj); }, metodo: "testemunho extraído" },
      { id: "fissuras", grupo: "Aceitação (11)", texto: "Fissuras identificadas e avaliadas (estrutura, função, durabilidade)", secao: "11 b", tipo: "sim_nao" },
      { id: "segreg", grupo: "Aceitação (11)", texto: "Acabamento sem segregação do material", secao: "11 c", tipo: "sim_nao" },
      { id: "infiltr", grupo: "Aceitação (11)", texto: "Infiltrações d'água avaliadas, sem efeitos nocivos", secao: "11 d", tipo: "sim_nao" },
      G.itManejo("9"),
    ]),
    extra: function (ctx) {
      var P = ctx.P, l = ctx.item.camada, e = ctx.item.espessura;
      if (l && l.situacao !== "nao_exigido") l.exigido = P.posicao === "inferior" ? "25 a 50 mm por camada (7 d)" : "25 a 40 mm por camada (5.6 i)";
      if (e && e.situacao !== "nao_exigido" && !ok(num(P.espProj))) A.marcar(e, "pendente", "informe a espessura de projeto");
      var r0 = G.extraConcreto(ctx, { secao: "projeto; 11" });
      var fs = num(P.fcSub), fc = ctx.item.fc;
      var r = A.linha({ id: "substrato12", grupo: "Aceitação (11)", criterio: "Resistência do concreto projetado ≥ 1,2 × a do substrato", secao: "5.6 e",
        exigido: ok(fs) ? "fck,est ≥ 1,2 × " + fmt(fs, 1) + " = " + fmt(1.2 * fs, 1) + " MPa" : "≥ 1,2 × resistência do substrato" });
      if (!ok(fs)) A.marcar(r, "pendente", "informe a resistência do substrato");
      else if (!r0) A.marcar(r, "pendente", "sem fck estimado do concreto projetado");
      else {
        r.resultado = "fck,est = " + fmt(r0.v, 1) + " MPa (" + fmt(r0.v / fs, 2) + " × substrato)";
        if (r0.v < 1.2 * fs - 1e-9) A.marcar(r, "nao_conforme", "fck,est = " + fmt(r0.v, 1) + " < " + fmt(1.2 * fs, 1) + " MPa");
        else r.motivo = "fck,est ≥ 1,2 × substrato";
      }
      var ic = ctx.linhas.indexOf(fc);
      ctx.linhas.splice(ic >= 0 ? ic + 1 : ctx.linhas.length, 0, r);
      G.ajustarFreq(ctx);
    },
    notas: "Critérios da DNIT 087/2006-ES (5.1 a 5.5 remetem à NBR 14026; a seção 11 transcreve a aceitação da NBR 14026). Espessura por camada: 25 a 40 mm (5.6 i) e 25 a 50 mm em faces " +
      "inferiores (7 d) — a ES se contradiz; adota-se 50 mm só para faces inferiores e, como 7 d diz que \"o comportamento do material comanda a espessura\", fora da faixa é ressalva. " +
      "A resistência ≥ 1,2 × substrato (5.6 e) é conferida com o fck estimado. A ES não fixa a frequência de ensaios (\"função do volume e do tempo de cada etapa\", 11)." + G.notaConcreto,
    exemplos: [
      { nome: "Via seca em face vertical, C25, 6 placas de controle (2 da DNER-ME 091) — aceito", dados: function () {
        var d = { ident: { registro: "PRJ-01", obra: "Ponte sobre o rio A", local: "Encontro E1 — face vertical", data: "2025-06-18" },
          params: { via: "seca", posicao: "vertical", fcSub: "18", espProj: "60", nAreas: "2", fck: "25", condPreparo: "A", amostragem: "parcial", volConc: "2,5" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { real: "2", nc: "0" }, { atende: "S" },
            { atende: "S" }, { atende: "S" }, { atende: "S", obs: "fissuras capilares de retração, sem efeito" }, { atende: "S" }, { atende: "S" }, { atende: "S" }],
          ac: [{ est: "traço", v: "0,42" }],
          temp: [{ est: "aplicação 1", v: "24" }, { est: "aplicação 2", v: "27" }],
          camada: [{ est: "aplicação 1", v: "35" }, { est: "aplicação 2", v: "30" }],
          cura: [{ est: "E1", v: "10" }],
          fc: G.fcTabela(["27,8", "29,1", "26,6", "28,4"], "placas E1"),
          espessura: [{ est: "testemunho T1", v: "62" }, { est: "testemunho T2", v: "65" }] };
        A.exemplos.importar(FE.FICHAS[ID].params, d, "imp_fc", [["dner-me-091-98", 1]]);
        return d;
      } },
      { nome: "Face inferior com camada espessa, cura de 7 dias e resistência baixa — não conforme", dados: function () {
        return { ident: { registro: "PRJ-02", obra: "Obra B", local: "Viaduto B — face inferior da laje", data: "2025-09-03" },
          params: { via: "seca", posicao: "inferior", fcSub: "22", espProj: "50", nAreas: "2", fck: "25", condPreparo: "B", amostragem: "parcial", volConc: "12" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { real: "2", nc: "0" }, { atende: "S" },
            { atende: "S" }, { atende: "S" }, { atende: "S" }, { real: "2", nc: "1", obs: "ninho de segregação junto ao apoio" }, { atende: "S" }, { atende: "S" }],
          ac: [{ est: "traço", v: "0,48" }],
          temp: [{ est: "aplicação 1", v: "22" }, { est: "aplicação 2", v: "19" }],
          camada: [{ est: "aplicação 1", v: "45" }, { est: "aplicação 2", v: "60" }],
          cura: [{ est: "laje", v: "7" }],
          fc: G.fcTabela(["26,1", "24,8", "27,3", "25,5", "23,9", "26,8"], "placas"),
          espessura: [{ est: "testemunho T1", v: "52" }, { est: "testemunho T2", v: "47" }] };
      } },
    ],
  });
})();
