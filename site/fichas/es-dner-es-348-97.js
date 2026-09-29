/*
 * Ficha de ES: DNER-ES 348/97 — Edificações — Coberturas (a ES não tem seção de aceitação: condição geral 4 e
 * verificação final 6.2 — dimensões, alinhamentos e declividades conforme o projeto).
 * Usa FE.aceitacaoG10a (definido em es-dner-es-344-97.js) e FE.aceitacao (es-comum.js).
 */
(function () {
  "use strict";
  var FE = window.FE, G = FE.aceitacaoG10a, num = FE.num, ok = FE.ok;
  var sn = G.sn, v = G.v, ID = "dner-es-348-97";
  var telha = function (l) { return G.selecionado("telha", l); };
  var madeira = G.selecionado("estrutura", ["madeira"]), aluminio = telha(["aluminio"]);
  function inclMin(P) {
    if (P.telha === "aluminio") return 17.6;
    if (P.telha === "cimento") return P.superp === "S" ? 9 : 3;
    if (P.telha === "ceramica") return num(P.canal) > 5 ? 50 : 32.4;
    var x = num(P.inclProj); return ok(x) ? x : undefined;
  }

  G.ficha({
    id: ID, es: "DNER-ES 348/97", secAceit: "6.2", semAceitacao: true, area: true, rotArea: "Área da cobertura em projeção (m²)",
    titulo: "Edificações — coberturas — aceitação",
    resumo: "Recebimento visual (6.1), madeiramento (emendas nos apoios, tratamento, talas), telhamento (inclinação mínima por tipo de telha, fixação e furação das telhas de alumínio), rufos e vedação; verificação final de dimensões, alinhamentos e declividades (6.2).",
    params: [
      { k: "estrutura", r: "Estrutura da cobertura (5.1.1)", tipo: "select", recarrega: true, opcoes: [["madeira", "Madeira"], ["metalica", "Metálica"]] },
      { k: "telha", r: "Telhas (5.1.2)", tipo: "select", recarrega: true, opcoes: [["ceramica", "Cerâmicas (5.16)"], ["cimento", "Cimento-amianto (5.2.17)"],
        ["aluminio", "Alumínio (5.2.12–5.2.15)"], ["outra", "Fibrocimento, aço, vidro, outras (fabricante, 5.2.7)"]] },
      { k: "superp", r: "Telhas com superposição de peças? (5.2.17)", tipo: "select", opcoes: G.SN, se: function (d) { return (d.params || {}).telha === "cimento"; } },
      { k: "canal", r: "Comprimento dos canais (m) (5.16)", se: function (d) { return (d.params || {}).telha === "ceramica"; }, dica: "> 5,0 m: inclinação mínima de 50 %" },
      { k: "inclProj", r: "Inclinação mínima do fabricante/projeto (%)", se: function (d) { return (d.params || {}).telha === "outra"; } },
    ],
    padrao: { estrutura: "madeira", telha: "ceramica", superp: "N" },
    criterios: [
      sn("receb", "6.1", "Recebimento dos materiais (inspeção visual)", "madeira e telhas conforme o projeto"),
      sn("especie", "5.2.3", "Espécie da madeira", "peroba do campo, ipê, maçaranduba ou equivalente", { se: madeira }),
      sn("emendas", "5.2.1; 5.2.5", "Emendas do madeiramento", "sobre apoios (asnas das tesouras ou pontaletes); emendas de linhas com talas ou braçadeiras parafusadas", { se: madeira }),
      sn("tratam", "5.2.4", "Tratamento preservativo da madeira", "toda a estrutura tratada", { se: madeira }),
      sn("contato", "5.2.6", "Isolamento estrutura metálica × telhas de alumínio", "pintura de cromato de zinco entre as superfícies",
        { se: function (P) { return P.estrutura === "metalica" && P.telha === "aluminio"; } }),
      sn("fabric", "5.2.7", "Orientações do fabricante das telhas", "seguidas rigorosamente", { se: telha(["cimento", "aluminio", "outra"]) }),
      sn("transito", "5.2.8", "Trânsito sobre a cobertura durante a obra", "sobre o madeiramento, nunca sobre as telhas nuas"),
      sn("vedacao", "5.2.9", "Vedação com calafetador", "flexível, aderente e resistente à água e ao tempo"),
      sn("rufos", "5.2.10; 5.2.11", "Rufos nas concordâncias parede × telhado", "rufos metálicos ou de concreto (impermeabilizados)"),
      sn("montAl", "5.2.12; 5.2.13", "Montagem das telhas de alumínio", "vão vencido com peça única sempre que possível; dos beirais para a cumeeira, contra os ventos dominantes", { se: aluminio }),
      sn("fixAl", "5.2.14; 5.2.18", "Fixação transversal e material dos fixadores", "a cada 2 ondas; fixadores de alumínio ou aço galvanizado", { se: aluminio }),
      sn("geom", "6.2", "Dimensões e alinhamentos", "conforme o projeto"),
      v("incl", "5.2.12; 5.2.17; 5.16; 6.2", "Inclinação do telhamento", "%", 1, inclMin, undefined,
        { exigido: "cerâmica ≥ 32,4 % (≥ 50 % com canais > 5 m); cimento-amianto ≥ 3 % (≥ 9 % com superposição); alumínio ≥ 17,6 % (10°)" }),
      v("fixLong", "5.2.14", "Espaçamento longitudinal dos elementos de fixação", "m", 2, undefined, 1.0, { se: aluminio }),
      v("folga", "5.2.15", "Folga do furo em relação ao diâmetro do parafuso", "mm", 1, undefined, 0.8, { se: aluminio }),
      v("borda", "5.2.15", "Distância do furo à borda da telha", "mm", 0, 40, undefined, { se: aluminio }),
    ],
    extra: function (ctx) {
      var l = ctx.item.incl, m = inclMin(ctx.P);
      var tx = { ceramica: "cerâmica" + (num(ctx.P.canal) > 5 ? ", canais > 5 m" : ""), cimento: "cimento-amianto" + (ctx.P.superp === "S" ? " com superposição" : ", peça única"),
        aluminio: "alumínio, 10°", outra: "fabricante/projeto" }[ctx.P.telha];
      if (l && ok(m)) l.exigido = "≥ " + FE.fmt(m, 1) + " % (" + tx + ")";
    },
    notas: "A DNER-ES 348/97 não tem seção de aceitação e rejeição (termina em 6.2 e 7 — medição): a ficha rejeita o serviço que não atenda ao projeto e às exigências da ES (condição geral 4). Inclinações mínimas: cerâmica 32,4 % (18°) e 50 % (26°33') com canais > 5,0 m (item numerado 5.16 na ES), cimento-amianto 3 % (peça única) e 9 % (superposição), alumínio 10° (17,6 %); outras telhas: a do fabricante/projeto (5.2.7).",
    exemplos: [
      { nome: "Telhado cerâmico sobre madeira — aceito", dados: function () {
        var P = { servico: "Bloco A — cobertura", area: "410", estrutura: "madeira", telha: "ceramica", canal: "4,2" };
        return { ident: { registro: "ED-COB-01", obra: "Obra A", local: "Bloco A", data: "2026-09-01" }, params: P, verificacoes: G.verif(ID, {}, P),
          incl: [{ est: "Água 1", v: "35,0" }, { est: "Água 2", v: "34,5" }, { est: "Água 3", v: "33,8" }] };
      } },
      { nome: "Telhas de alumínio — inclinação e furação fora — rejeitado", dados: function () {
        var P = { servico: "Galpão B — cobertura", area: "600", estrutura: "metalica", telha: "aluminio" };
        return { ident: { registro: "ED-COB-02", obra: "Obra B", local: "Galpão B", data: "2026-09-15" }, params: P,
          verificacoes: G.verif(ID, { contato: { atende: "N", real: "2", nc: "1", obs: "sem pintura de cromato de zinco na terça T3" } }, P),
          incl: [{ est: "Água 1", v: "18,0" }, { est: "Água 2", v: "15,5" }],
          fixLong: [{ est: "Faixa 1", v: "0,95" }, { est: "Faixa 4", v: "1,00" }],
          folga: [{ est: "Faixa 1", v: "0,5" }, { est: "Faixa 4", v: "1,2" }],
          borda: [{ est: "Faixa 1", v: "45" }, { est: "Faixa 4", v: "42" }] };
      } },
    ],
  });
})();
