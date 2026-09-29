/*
 * Ficha: DNER-EM 364/97 — Alcatrões para pavimentação (RT-1 a RT-12) — recebimento do fornecimento.
 * NORMA CANCELADA (o motor mostra a tarja na ficha e no relatório): ficha mantida para consulta e registro de fornecimentos antigos.
 * Usa o motor FE.recebimentoLigante (site/fichas/dnit-095-2006-em.js) e as extensões FE.recebimentoLigante.ext
 * (site/fichas/dnit-129-2011-em.js, carregado antes). Limites: Tabela anexa (conferida no PDF, p. 3 — os sinais ≤/≥ do PDF são
 * glifos sem mapeamento; água "≤" e densidade "≥", como no markdown).
 */
(function () {
  "use strict";
  var FE = window.FE, ok = FE.ok, A = FE.aceitacao;
  var RL = FE.recebimentoLigante, X = RL && RL.ext;
  if (!X) { if (window.console) console.error("dner-em-364-97.js: carregue antes site/fichas/dnit-095-2006-em.js e dnit-129-2011-em.js."); return; }
  var L = RL.L;

  var C = [], i;
  for (i = 1; i <= 12; i++) C.push("RT-" + i);
  function por(vals) { var o = {}; C.forEach(function (c, k) { o[c] = vals[k] || null; }); return o; }
  var _ = null;
  var APL = ["pintura de solo", "pintura de solo", "pintura de solo e tratamento superficial", "pintura de solo e tratamento superficial",
    "tratamento superficial e mistura na estrada", "tratamento superficial e mistura na estrada",
    "tratamento superficial, mistura na capa selante e concreto", "tratamento superficial, mistura na capa selante e concreto",
    "tratamento superficial, mistura na capa selante e concreto",
    "tratamento superficial, capa selante, macadame por penetração e concreto betuminoso",
    "tratamento superficial, capa selante, macadame por penetração e concreto betuminoso",
    "tratamento superficial, capa selante, macadame por penetração e concreto betuminoso"];
  var G = "Alcatrão (Tabela)";
  function mx(v) { return L(null, v); }
  function mn(v) { return L(v, null); }
  function isento() { return { igual: "isento" }; }

  var ENSAIOS = [
    { id: "agua", grupo: G, r: "Água, máx.", u: "%", casas: 1, metodo: "ASTM D 95", lim: por([mx(2.0), mx(2.0), mx(2.0), mx(2.0), mx(1.5), mx(1.5), mx(1.0)]) },
    { id: "aguaIs", grupo: G, tipo: "qual", r: "Água (isento)", u: "", metodo: "ASTM D 95", ph: "isento / contém água",
      lim: por([_, _, _, _, _, _, _, isento(), isento(), isento(), isento(), isento()]),
      opcoes: [["is", "isento", /^(isent|aus|n[aã]o|0([,.]0*)?\s*%?$)/i], ["ag", "contém água", /^(cont|sim|tra|pres|[1-9]|0[,.]0*[1-9])/i]] },
    { id: "dens", grupo: G, r: "Densidade a 25/25 °C, mín.", u: "", casas: 3, metodo: "ASTM D 70 · DNER-ME 193/96",
      lim: por([mn(1.08), mn(1.08), mn(1.09), mn(1.09), mn(1.10), mn(1.10), mn(1.12), mn(1.14), mn(1.14), mn(1.15), mn(1.16), mn(1.16)]) },
    { id: "eng40", grupo: G, r: "Viscosidade específica Engler a 40 °C", u: "°E", casas: 1, metodo: "ASTM D 1665",
      lim: por([L(5, 8), L(8, 13), L(13, 22), L(22, 35)]) },
    { id: "eng50", grupo: G, r: "Viscosidade específica Engler a 50 °C", u: "°E", casas: 1, metodo: "ASTM D 1665",
      lim: por([_, _, _, _, L(17, 26), L(26, 40)]) },
    { id: "flut32", grupo: G, r: "Ensaio de flutuação a 32 °C (tempo; a Tabela indica °E)", curto: "Flutuação a 32 °C", u: "s", casas: 0, metodo: "ASTM D 139",
      lim: por([_, _, _, _, _, _, L(50, 80), L(80, 120), L(120, 200)]) },
    { id: "flut50", grupo: G, r: "Ensaio de flutuação a 50 °C (tempo; a Tabela indica °E)", curto: "Flutuação a 50 °C", u: "s", casas: 0, metodo: "ASTM D 139",
      lim: por([_, _, _, _, _, _, _, _, _, L(75, 100), L(100, 150), L(150, 200)]) },
  ];

  var MAPAS = { "dner-me-193-96": X.M.dens("dens") };

  var F = RL.criar({
    titulo: "Recebimento de alcatrão para pavimentação (norma cancelada)",
    resumo: "NORMA CANCELADA — ficha mantida para consulta e registro de fornecimentos antigos. Ensaios de recebimento do alcatrão comparados com a Tabela anexa (RT-1 a RT-12): " +
      "água, densidade a 25/25 °C, viscosidade específica Engler (40 °C ou 50 °C) ou ensaio de flutuação (32 °C ou 50 °C), conforme o tipo; importa a densidade da ficha DNER-ME 193.",
    tabela: "Tabela",
    textoTodos: "Todos os resultados devem atender à Tabela (6.1.2); o resultado geral vale só para os ensaios realizados.",
    rotuloClasse: "Tipo de alcatrão (4.1)",
    classes: C.map(function (c, k) { return [c, c + " — " + APL[k]]; }),
    padrao: { classe: "RT-10", inspecao: "ok" },
    params: [X.paramInspecao("6")].concat(X.importar("dner-em-364-97", MAPAS, "DNER-ME 193 (densidade a 25/25 °C pelo picnômetro)")),
    ensaios: ENSAIOS,
    avisos: function (res, V, P, avisos) {
      avisos.push("DNER-EM 364/97 cancelada: use a ficha só para registro/consulta; não há especificação vigente do DNIT para alcatrões.");
    },
    notas: "Resultado de cada ensaio = média das determinações, comparada com a Tabela da DNER-EM 364/97 para o tipo (RT-1 a RT-4: Engler a 40 °C; RT-5 e RT-6: Engler a 50 °C; " +
      "RT-7 a RT-9: flutuação a 32 °C; RT-10 a RT-12: flutuação a 50 °C). Água: RT-8 a RT-12 isentos. Unidade de compra: litro (4.3). " +
      "Aceitação (6.1.2): todos os resultados atendendo, o fornecimento é aceito; um ou mais fora da Tabela, é rejeitado (sem contraprova prevista). " +
      "Com base na inspeção, o comprador pode rejeitar o fornecimento total ou parcialmente (6.1.1).",
    exemplos: [
      { nome: "RT-3 — pintura de solo e tratamento superficial, fornecimento aceito", dados: function () {
        return { ident: { registro: "REC-RT3-EX-01", data: "1996-09-12", obra: "Obra A", origem: "Fornecedor A", camada: "Alcatrão RT-3" },
          params: { classe: "RT-3", inspecao: "ok", nf: "1204", quantidade: "12 000 L", procedencia: "Fornecedor A", dataCarga: "12/09/1996" },
          det: [{ agua: "1,2", dens: "1,112", eng40: "17,5" }, { agua: "1,0", dens: "1,114", eng40: "18,1" }, {}] };
      } },
      { nome: "RT-10 — densidade abaixo do mínimo (importada da DNER-ME 193) e com água", dados: function () {
        var d = { ident: { registro: "REC-RT10-EX-02", data: "1996-11-04", obra: "Obra B", origem: "Fornecedor B", camada: "Alcatrão RT-10" },
          params: { classe: "RT-10", inspecao: "acond", nf: "3377", quantidade: "8 000 L", procedencia: "Fornecedor B", dataCarga: "04/11/1996" },
          det: [{ aguaIs: "contém água (traços)", flut50: "92" }, { flut50: "95" }, {}] };
        A.exemplos.importar(FE.FICHAS["dner-em-364-97"].params, d, "imp", [["dner-me-193-96", 2]]);
        return d;
      } },
    ],
  });
  FE.FICHAS["dner-em-364-97"] = X.lote(F, { tabela: "Tabela", secao: "6.1.2", secaoInspecao: "6 e 6.1.1", contraprova: false, nome: "fornecimento" });
})();
