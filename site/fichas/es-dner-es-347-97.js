/*
 * Ficha de ES: DNER-ES 347/97 — Edificações — Alvenarias e painéis (aceitação: seção 6).
 * Usa FE.aceitacaoG10a (definido em es-dner-es-344-97.js) e FE.aceitacao (es-comum.js).
 */
(function () {
  "use strict";
  var FE = window.FE, G = FE.aceitacaoG10a;
  var sn = G.sn, v = G.v, ID = "dner-es-347-97";
  var tijolo = G.selecionado("material", ["furado", "macico", "aparente"]), aparente = G.selecionado("material", ["aparente"]);

  G.ficha({
    id: ID, es: "DNER-ES 347/97", secAceit: "6.3", secRejeita: "6.3.2", secRefazer: "6.3.3", area: true, rotArea: "Área de alvenaria do lote (m²)",
    titulo: "Edificações — alvenarias e painéis — aceitação",
    resumo: "Recebimento (tipo e dimensões, 6.1), execução (5.3–5.15: juntas ≤ 15 mm, tacos a ≤ 80 cm, vergas com traspasse ≥ ¼ do vão, aperto após 8 dias) e inspeção visual (6.2); rejeição por alinhamento, prumo e desempeno (6.3.2).",
    params: [
      { k: "material", r: "Material da alvenaria (5.1.1; 5.15)", tipo: "select", recarrega: true, opcoes: [
        ["furado", "Tijolos furados de barro cozido"], ["macico", "Tijolos maciços de barro cozido"], ["aparente", "Tijolos especiais aparentes"], ["bloco", "Blocos de concreto"]] },
      { k: "vedacao", r: "Paredes de vedação sob vigas/lajes? (5.10)", tipo: "select", recarrega: true, opcoes: G.SN },
    ],
    padrao: { material: "furado", vedacao: "S" },
    criterios: [
      sn("receb", "6.1", "Recebimento: tipo e dimensões dos tijolos/blocos", "tipo e dimensões conforme o projeto"),
      sn("molhar", "5.3", "Tijolos ligeiramente molhados antes da colocação", "molhados", { se: tijolo }),
      sn("traco", "5.4; 5.15", "Traço da argamassa de assentamento", "tijolos: 1:3:5 (cimento, areia, saibro) ou 1:2:9 (cimento, cal, areia média); blocos de concreto: 1:4"),
      sn("chuva", "5.5", "Alvenaria recém-concluída protegida da chuva", "ao abrigo das chuvas"),
      sn("furos", "5.7", "Furos dos tijolos", "furos não voltados no sentido da espessura da parede", { se: G.selecionado("material", ["furado"]) }),
      sn("percinta", "5.11", "Percintas em parapeitos, platibandas e paredes baixas", "percinta de concreto armado como respaldo"),
      sn("faceam", "5.12; 5.13", "Tijolo aparente: prumo numa face, faceamento externo, cintas/vergas recuadas ≈ ½ tijolo", "concreto não aparece na fachada", { se: aparente }),
      sn("alinh", "5.6; 6.3.2", "Alinhamento, prumo, nível das fiadas e desempeno", "fiadas niveladas, alinhadas e aprumadas; parede desempenada"),
      v("junta", "5.6", "Espessura das juntas", "mm", 0, undefined, 15),
      v("taco", "5.8", "Espaçamento entre tacos de fixação", "cm", 0, undefined, 80),
      v("verga", "5.9", "Traspasse da verga para cada lado (em fração do vão)", "% do vão", 0, 25, undefined, { exigido: "≥ ¼ do vão (25 %) para cada lado" }),
      v("aperto", "5.10", "Prazo entre a conclusão do trecho e o aperto (fiada oblíqua)", "dias", 0, 8, undefined, { se: G.sim("vedacao"), naoAplicaPor: "sem paredes de vedação apertadas" }),
    ],
    notas: "Seção 6.2: controle de qualidade visual. A ES não fixa tolerâncias numéricas de prumo e alinhamento (\"perfeitamente\" nivelados, alinhados e aprumados, 5.6): o item é de inspeção, e sua falha rejeita o serviço (6.3.2). Traspasse da verga: informe o traspasse de cada lado dividido pelo vão (%). Prazo do aperto (5.10): \"oito dias após a conclusão\" lido como mínimo de 8 dias.",
    exemplos: [
      { nome: "Alvenaria de tijolos furados — pavimento térreo — aceito", dados: function () {
        var P = { servico: "Bloco A — alvenaria do térreo", area: "320", material: "furado", vedacao: "S" };
        return { ident: { registro: "ED-ALV-01", obra: "Obra A", local: "Bloco A — térreo", data: "2026-08-04" }, params: P, verificacoes: G.verif(ID, {}, P),
          junta: [{ est: "Parede eixo 1", v: "12" }, { est: "Parede eixo 3", v: "14" }, { est: "Parede eixo B", v: "10" }],
          taco: [{ est: "Porta P1", v: "75" }, { est: "Porta P3", v: "80" }],
          verga: [{ est: "Janela J1", pos: "vão 120 cm; 30 cm/lado", v: "25" }, { est: "Porta P2", pos: "vão 80 cm; 25 cm/lado", v: "31" }],
          aperto: [{ est: "Trecho 1", v: "9" }, { est: "Trecho 2", v: "10" }] };
      } },
      { nome: "Parede fora de prumo e juntas grossas — rejeitado", dados: function () {
        var P = { servico: "Bloco B — alvenaria do 1º pavimento", area: "280", material: "furado", vedacao: "S" };
        return { ident: { registro: "ED-ALV-02", obra: "Obra B", local: "Bloco B — 1º pavimento", data: "2026-08-21" }, params: P,
          verificacoes: G.verif(ID, { alinh: { atende: "N", real: "6", nc: "1", obs: "parede do eixo C fora de prumo" } }, P),
          junta: [{ est: "Parede eixo A", v: "13" }, { est: "Parede eixo C", v: "20" }],
          taco: [{ est: "Porta P4", v: "78" }],
          verga: [{ est: "Janela J5", pos: "vão 150 cm; 25 cm/lado", v: "17" }],
          aperto: [{ est: "Trecho 3", v: "5" }] };
      } },
    ],
  });
})();
