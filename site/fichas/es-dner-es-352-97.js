/*
 * Ficha de ES: DNER-ES 352/97 — Edificações — Forros (aceitação: controle do material 6.1, verificação final 6.2 —
 * cotas e alinhamentos — e 6.3; execução pela seção 5).
 * Usa FE.aceitacaoG10a (definido em es-dner-es-344-97.js) e FE.aceitacao (es-comum.js).
 */
(function () {
  "use strict";
  var FE = window.FE, G = FE.aceitacaoG10a;
  var sn = G.sn, v = G.v, ID = "dner-es-352-97";
  var tipo = function (l) { return G.selecionado("tipo", l); }, metal = tipo(["metalico"]);

  G.ficha({
    id: ID, es: "DNER-ES 352/97", secAceit: "6.3", secRejeita: "6.3.2", secRefazer: "6.3.3", area: true, rotArea: "Área de forro do lote (m²)",
    titulo: "Edificações — forros — aceitação",
    resumo: "Materiais conforme os catálogos (6.1), início após as tubulações (5.1), execução por tipo de forro (metálico: perfis a ≤ 1,10 m, suspensão a ≤ 1,40 m, lâminas de 0,3 a 0,7 mm e ≤ 9,0 m; fibra vegetal/vermiculita, fibra de vidro, gesso, plástico, madeira) e verificação final de cotas e alinhamentos (6.2.1).",
    params: [
      { k: "tipo", r: "Tipo de forro (5.2)", tipo: "select", recarrega: true, opcoes: [
        ["metalico", "Metálico — alumínio ou aço (5.3)"], ["vegetal", "Fibra vegetal ou vermiculita (5.4)"], ["vidro", "Fibra de vidro (5.5)"],
        ["gesso", "Gesso em placas (5.6)"], ["plastico", "Plástico — PVC (5.7)"], ["madeira", "Madeira (5.8)"]] },
    ],
    padrao: { tipo: "metalico" },
    criterios: [
      sn("receb", "6.1", "Materiais conforme os catálogos dos fabricantes", "atendidas as exigências"),
      sn("tubos", "5.1", "Início após as tubulações a ocultar", "todas as tubulações executadas antes do forro"),
      sn("geom", "6.2.1", "Cotas e alinhamentos", "conforme o projeto"),
      sn("susp", "5.3.1; 5.3.2", "Suspensão do forro metálico", "suportes fixados à estrutura por pinos ou buchas; fita galvanizada 1,0 × 20 mm ou tirante Ø 3/16\"", { se: metal }),
      sn("anticor", "5.3.3; 5.3.4", "Lâminas: liga/aço especificados, tratamento anticorrosivo e acabamento", "AlMg 5050H ou SAE 1010; esmaltadas, anodizadas ou cromatizadas", { se: metal }),
      sn("arremate", "5.3.5", "Arremates com cantoneiras do mesmo material", "junto à estrutura, luminárias, difusores, sprinklers etc.", { se: metal }),
      sn("trelica", "5.4; 5.4.1", "Fibra vegetal/vermiculita: treliça de madeira paralela ao menor vão; fixações", "conforme 5.4 (ou suspensão metálica, 5.4.2)", { se: tipo(["vegetal"]) }),
      sn("vidroExec", "5.5", "Fibra de vidro: placas rígidas sobre perfis T (alumínio anodizado ou aço galvanizado pintado); tirantes", "conforme 5.5", { se: tipo(["vidro"]) }),
      sn("gessoSeco", "5.6", "Gesso: suspensão por arame galvanizado/tirantes; placas completamente secas", "placas assentadas secas", { se: tipo(["gesso"]) }),
      sn("pvc", "5.7", "Plástico: PVC extrudado auto-extinguível; estrutura auxiliar", "conforme 5.7", { se: tipo(["plastico"]) }),
      sn("frisos", "5.8", "Madeira: frisos maciços macho-fêmea secos em estufa", "conforme 5.8", { se: tipo(["madeira"]) }),
      v("perfis", "5.3", "Distância entre eixos dos perfis de sustentação", "m", 2, undefined, 1.10, { se: metal }),
      v("suspMed", "5.3", "Espaçamento da suspensão", "m", 2, undefined, 1.40, { se: metal }),
      v("espLam", "5.3.3", "Espessura das lâminas/painéis", "mm", 2, 0.3, 0.7, { se: metal }),
      v("compLam", "5.3.4", "Comprimento das lâminas", "m", 2, undefined, 9.0, { se: metal }),
    ],
    notas: "Seção 6.2.1: verificação das cotas e alinhamentos indicados no projeto; a ES não fixa tolerâncias numéricas (itens de inspeção). Forro metálico: \"distância máxima de eixo a eixo dos perfis de sustentação de 1,10 m e suspensão a um máximo de 1,40 m\" (5.3) — a suspensão foi lida como o espaçamento entre pontos de suspensão.",
    exemplos: [
      { nome: "Forro de lâminas de alumínio — aceito", dados: function () {
        var P = { servico: "Bloco A — forro do térreo", area: "260", tipo: "metalico" };
        return { ident: { registro: "ED-FOR-01", obra: "Obra A", local: "Bloco A — térreo", data: "2026-09-22" }, params: P, verificacoes: G.verif(ID, {}, P),
          perfis: [{ est: "Sala 1", v: "1,05" }, { est: "Sala 3", v: "1,10" }], suspMed: [{ est: "Sala 1", v: "1,20" }, { est: "Sala 3", v: "1,35" }],
          espLam: [{ est: "Lote de lâminas 1", v: "0,50" }], compLam: [{ est: "Sala 3", v: "6,00" }] };
      } },
      { nome: "Forro de gesso com placas úmidas — rejeitado", dados: function () {
        var P = { servico: "Bloco B — forro do 1º pavimento", area: "180", tipo: "gesso" };
        return { ident: { registro: "ED-FOR-02", obra: "Obra B", local: "Bloco B — 1º pavimento", data: "2026-09-26" }, params: P,
          verificacoes: G.verif(ID, { gessoSeco: { atende: "N", real: "3", nc: "1", obs: "placas úmidas assentadas na sala 5" },
            tubos: { atende: "N", real: "1", nc: "1", obs: "eletroduto executado após o fechamento" } }, P) };
      } },
    ],
  });
})();
