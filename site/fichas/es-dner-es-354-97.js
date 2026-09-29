/*
 * Ficha de aceitação — DNER-ES 354/97 Edificações — Ferragens.
 * Usa FE.aceitacaoG10b (definido em es-dner-es-353-97.js).
 */
(function () {
  "use strict";
  var FE = window.FE, G = FE.aceitacaoG10b, num = FE.num, ok = FE.ok;
  function hProj(P) { var h = num((P || {}).hMacaneta); return ok(h) ? h : 105; }
  function tol(P) { var t = num((P || {}).tol); return ok(t) ? Math.abs(t) : 0; }

  var F = G.ficha({
    id: "dner-es-354-97",
    titulo: "Ferragens (DNER-ES 354/97) — aceitação do serviço",
    resumo: "Inspeção das ferragens das esquadrias (seções 5 e 6): material e acabamento, rebaixos com a forma das ferragens, " +
      "localização precisa, altura das maçanetas (105,0 cm do piso acabado, 5.4), robustez, catálogos (6.1) e verificação visual " +
      "das condições e do funcionamento de todas as peças (6.2).",
    lote: false,
    params: [
      { k: "nPecas", r: "Nº de peças de ferragem do lote (unidades)", dica: "medição por unidade de peça (seção 7); 6.2: todas são verificadas" },
      { k: "hMacaneta", r: "Altura das maçanetas do piso acabado (cm)", ph: "105,0", dica: "5.4: 105,0 cm, salvo condições especiais (informe a de projeto)" },
      { k: "tol", r: "Tolerância de posicionamento adotada (± cm)", dica: "a ES não fixa tolerância; 0 = exatamente a altura de projeto" },
    ],
    padrao: { hMacaneta: "105,0", tol: "1,0" },
    providencias: function (par) { return par.parecer === "REJEITADO" ? ["Substituir ou reinstalar as ferragens não conformes e repetir a verificação (4.1 e 6.2)."] : []; },
    criterios: [
      { id: "projeto", grupo: "Condições gerais", texto: "Execução conforme projeto, desenhos e demais elementos", secao: "4.1", tipo: "sim_nao", exigido: "conforme o projeto" },
      { id: "material", grupo: "Condições específicas", texto: "Ferragens em latão cromado ou ferro cromado, acabamento (fosco/polido) conforme especificado", secao: "5.1",
        tipo: "sim_nao", exigido: "material e acabamento do projeto" },
      { id: "rebaixo", grupo: "Condições específicas", texto: "Rebaixos e encaixes com a forma das ferragens, sem folgas com emendas ou enchimento de taliscas", secao: "5.2",
        tipo: "sim_nao", exigido: "sem folgas que exijam emenda ou enchimento" },
      { id: "local", grupo: "Condições específicas", texto: "Localização precisa, sem discrepâncias de posição ou de nível perceptíveis à vista", secao: "5.3",
        tipo: "sim_nao", exigido: "posições e níveis uniformes" },
      { id: "robustez", grupo: "Condições específicas", texto: "Ferragens (principalmente dobradiças) robustas para o regime de trabalho", secao: "5.5",
        tipo: "sim_nao", exigido: "suportar com folga o regime de trabalho" },
      { id: "hMac", grupo: "Condições específicas", texto: "Altura das maçanetas acima do piso acabado", secao: "5.4", tipo: "valor", unid: "cm", casas: 1,
        min: function (P) { return hProj(P) - tol(P); }, max: function (P) { return hProj(P) + tol(P); }, metodo: "trena",
        freq: { por: "lote", minimo: 1, regra: "todas as portas (mín. 1 por lote)" } },
      { id: "catalogo", grupo: "Inspeção", texto: "Instalação conforme as exigências dos catálogos dos fabricantes", secao: "6.1", tipo: "sim_nao", exigido: "catálogos atendidos" },
      { id: "funcion", grupo: "Inspeção", texto: "Verificação visual das condições das ferragens e do seu funcionamento", secao: "6.2", tipo: "sim_nao",
        exigido: "todas as peças em bom estado e funcionando", freq: G.todas("nPecas", "todas as peças") },
    ],
    notas: "DNER-ES 354/97: a ES não tem seção de aceitação e rejeição; a ficha aplica a regra das demais ES de edificações do mesmo grupo " +
      "(ex.: DNER-ES 353/97, 6.3): aceitação condicionada ao atendimento de todas as exigências. A altura das maçanetas é conferida contra a de projeto " +
      "(105,0 cm por padrão) com a tolerância informada (a ES não fixa tolerância).",
  });

  F.exemplos = [
    { nome: "Lote aceito — ferragens de 10 portas (Obra A)", dados: function () {
      return G.dados(F, { ident: { registro: "FER-01", data: "2026-08-25", obra: "Obra A — edifício administrativo", local: "Bloco 1 — pavimento superior",
          camada: "Fechaduras, dobradiças e maçanetas em latão cromado" },
        params: { nPecas: "40" },
        verificacoes: [{ atende: "S" }, { atende: "S" }, { real: "10", nc: "0" }, { real: "10", nc: "0" }, { atende: "S" }, { atende: "S" }, { real: "40", nc: "0" }],
        hMac: [{ est: "P1", v: "105,0" }, { est: "P2", v: "105,5" }, { est: "P3", v: "104,5" }, { est: "P4", v: "105,0" }, { est: "P5", v: "105,0" },
          { est: "P6", v: "104,8" }, { est: "P7", v: "105,2" }, { est: "P8", v: "105,0" }, { est: "P9", v: "105,0" }, { est: "P10", v: "105,3" }] });
    } },
    { nome: "Lote rejeitado — maçaneta fora da altura e fechadura com taliscas (Obra B)", dados: function () {
      return G.dados(F, { ident: { registro: "FER-02", data: "2026-09-05", obra: "Obra B — posto de pesagem", local: "Alojamento",
          camada: "Ferragens em ferro cromado" },
        params: { nPecas: "24" },
        verificacoes: [{ atende: "S" }, { atende: "S" }, { real: "6", nc: "1", obs: "P4: rebaixo da fechadura com enchimento de taliscas" }, { real: "6", nc: "0" },
          { atende: "S" }, { atende: "S" }, { real: "24", nc: "0" }],
        hMac: [{ est: "P1", v: "105,0" }, { est: "P2", v: "103,0" }, { est: "P3", v: "105,5" }, { est: "P4", v: "105,0" }, { est: "P5", v: "104,6" }, { est: "P6", v: "105,0" }] });
    } },
  ];
})();
