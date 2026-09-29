/*
 * Ficha de ES: DNER-ES 345/97 — Edificações — Fundações (aceitação: condições específicas 5 e tolerâncias 7.1).
 * Usa FE.aceitacaoG10a (definido em es-dner-es-344-97.js) e FE.aceitacao (es-comum.js).
 */
(function () {
  "use strict";
  var FE = window.FE, G = FE.aceitacaoG10a, num = FE.num, ok = FE.ok;
  var sn = G.sn, v = G.v, ID = "dner-es-345-97";
  var MOLD = ["moldada", "strauss", "franki"], CRAV = ["premoldada", "metalica", "madeira", "franki"];
  var EST = ["moldada", "strauss", "franki", "premoldada", "metalica", "madeira"];
  function tipo(lista) { return G.selecionado("tipo", lista); }
  function e(k, f) { return function (P) { return f(P) && (P || {}).travada === (k ? "S" : "N"); }; }
  var moldada = tipo(MOLD);

  G.ficha({
    id: ID, es: "DNER-ES 345/97", secAceit: "7.2", secRejeita: "7.2.1", secRefazer: "7.2.2",
    titulo: "Edificações — fundações — aceitação",
    resumo: "Cavas e lastro, estacas (nega, penetração no bloco, diâmetro, espaçamento, cobrimento, consumo de cimento, comprimento das Strauss, energia das Franki), concreto (fck, abatimento) e tolerâncias de execução das estacas moldadas in situ (7.1: excentricidade, acréscimo de carga, inclinação).",
    params: [
      { k: "tipo", r: "Tipo de fundação do lote (5.3)", tipo: "select", recarrega: true, opcoes: [
        ["direta", "Direta — sapatas, blocos, radier (5.3.1–5.3.2)"], ["moldada", "Estacas moldadas no solo — brocas, simplex etc. (5.4.6)"],
        ["strauss", "Estacas Strauss (5.4.7)"], ["franki", "Estacas Franki (5.4.8)"], ["premoldada", "Estacas pré-moldadas de concreto"],
        ["metalica", "Estacas metálicas"], ["madeira", "Estacas de madeira"]] },
      { k: "nEst", r: "Nº de estacas do lote", se: function (d) { return EST.indexOf((d.params || {}).tipo) >= 0; },
        dica: "frequência da nega e da penetração no bloco: todas as estacas" },
      { k: "diam", r: "Diâmetro das estacas (cm)", se: function (d) { return moldada(d.params || {}); }, dica: "espaçamento mínimo = 3 × diâmetro (5.4.6.1 e); Franki: energia pelo diâmetro (5.4.8.1)" },
      { k: "nega", r: "Nega de projeto (mm / 10 golpes)", ph: "20", se: function (d) { return tipo(CRAV)(d.params || {}); }, dica: "vazio = 2,0 cm para 10 golpes (5.4.2)" },
      { k: "empirica", r: "Dosagem empírica do concreto? (5.4.6.1 b)", tipo: "select", recarrega: true, opcoes: G.SN, se: function (d) { return moldada(d.params || {}); } },
      { k: "travada", r: "Estacas isoladas travadas por vigas? (7.1.2)", tipo: "select", recarrega: true, opcoes: G.SN, se: function (d) { return moldada(d.params || {}); } },
      { k: "volume", r: "Volume de concreto do lote (m³) — informativo" },
    ].concat(G.PARAMS_CONCRETO),
    padrao: { tipo: "moldada", empirica: "N", travada: "N" },
    criterios: [
      sn("projeto", "4; 5.1.1", "Tipo e execução conforme o projeto", "tipo de fundação e elementos rigorosamente conforme o projeto"),
      sn("aguaAgr", "5.2.2", "Investigação de águas agressivas no subsolo", "investigada; ocorrência comunicada à Fiscalização"),
      sn("cota", "5.2.5", "Cota de assentamento da fundação direta", "escavação levada até terreno com resistência suficiente", { se: tipo(["direta"]) }),
      sn("cavas", "5.2.6", "Limpeza das cavas antes da concretagem", "isentas de madeira, solo carreado e outros materiais nocivos"),
      sn("esgot", "5.2.7", "Esgotamento das valas antes da concretagem", "sem água na vala ao concretar"),
      sn("brita", "5.2.8", "Camada de brita no fundo da vala", "≈ 3,0 cm de brita sob o concreto magro"),
      sn("divisa", "5.4.3", "Blocos dentro do terreno", "sem invadir terreno vizinho nem o passeio"),
      sn("arras", "5.4.4", "Corte das cabeças das estacas", "com ponteiros, até a cota de arrasamento prevista", { se: tipo(EST) }),
      sn("cravacao", "5.4.1", "Profundidade das estacas", "cravação/execução até camada resistente (nega e material extraído)", { se: tipo(EST) }),
      sn("percinta", "5.4.6.1 g–h", "Armadura para esforço horizontal; ligação dos topos por percintas/blocos", "estacas com deslocamento horizontal armadas; fustes ligados por percintas ou blocos", { se: moldada }),
      sn("straussSolo", "5.4.7.2", "Condição do solo para estaca Strauss", "camada resistente não acima do nível d'água; sem argila submersa muito mole", { se: tipo(["strauss"]) }),
      sn("frankiFuste", "5.4.8.2", "Franki em argila média/rija ou vizinhança sensível", "fuste executado por escavação quando exigido; cuidados em argila submersa mole", { se: tipo(["franki"]) }),
      v("magro", "5.2.8", "Espessura do concreto magro no fundo da vala", "cm", 1, 7, undefined),
      v("negaMed", "5.4.2", "Nega (penetração em 10 golpes, 3ª tentativa consecutiva)", "mm", 1, undefined,
        function (P) { var n = num(P.nega); return ok(n) ? n : 20; }, { se: tipo(CRAV), exigido: "≤ 20 mm/10 golpes ou a de projeto",
          freq: { por: "contagem", a_cada: 1, qtd: "nEst", unidade: "estaca(s)", regra: "todas as estacas" } }),
      v("penet", "5.4.5", "Penetração da estaca no bloco de coroamento", "cm", 1,
        function (P) { return P.tipo === "metalica" ? 20 : 10; }, undefined, { se: tipo(EST), exigido: "≥ 10 cm (concreto) / ≥ 20 cm (metálica)",
          freq: { por: "contagem", a_cada: 1, qtd: "nEst", unidade: "estaca(s)", regra: "todas as estacas" } }),
      v("diamMed", "5.4.6.1 a", "Diâmetro da estaca moldada no solo", "cm", 1, 25, undefined, { se: moldada }),
      v("espac", "5.4.6.1 e", "Espaçamento entre eixos de estacas", "cm", 1, function (P) { var d = num(P.diam); return ok(d) ? 3 * d : undefined; }, undefined,
        { se: moldada, exigido: "≥ 3 × diâmetro da menor estaca" }),
      v("cobr", "5.4.6.1 f", "Recobrimento das armaduras das estacas", "mm", 0, 25, undefined, { se: moldada, exigido: "≥ 25 mm (salvo especificação diversa)" }),
      v("consumo", "5.4.6.1 d", "Consumo de cimento (dosagem empírica)", "kg/m³", 0, 300, undefined,
        { se: function (P) { return moldada(P) && P.empirica === "S"; }, naoAplicaPor: "dosagem racional" }),
      v("compStrauss", "5.4.7.2", "Comprimento da estaca Strauss", "m", 2, undefined, 15, { se: tipo(["strauss"]) }),
      v("energia", "5.4.8.1", "Energia de introdução dos últimos 150 L de concreto (base)", "MN·m", 2,
        function (P) { var d = num(P.diam); return ok(d) && d > 45 ? 5 : 2.5; }, undefined, { se: tipo(["franki"]), exigido: "≥ 2,5 MN·m (D ≤ 45 cm) / ≥ 5,0 MN·m (D > 45 cm)" }),
      v("exc", "7.1.2 a", "Excentricidade estaca × resultante do pilar (estaca isolada não travada)", "% do diâmetro", 1, undefined, 10, { se: e(false, moldada) }),
      v("excT", "7.1.2 b", "Excentricidade (estaca isolada travada)", "% do diâmetro", 1, undefined, 10,
        { se: e(true, moldada), falha: "ressalva", exigido: "≤ 10 %; acima: vigas de travamento dimensionadas p/ a excentricidade real" }),
      v("carga", "7.1.3; 7.1.4", "Acréscimo de carga na estaca mais solicitada", "%", 1, undefined, 15, { se: moldada, exigido: "≤ 15 % da carga admissível (acima: corrigir)" }),
      v("incl", "7.1.5", "Desvio de inclinação", "%", 2, undefined, 1, { se: moldada, exigido: "≤ 1:100 (1 %)" }),
      G.fc({ secao: "5.2.4" }),
      G.abat({ secao: "5.2.4" }),
    ],
    extra: function (ctx) {
      G.fckEst(ctx, { es: "DNER-ES 345/97", secExemplar: "5.2.4", secFreq: "5.2.4", secControle: "5.2.4" });
      var l = ctx.item.excT;
      if (l && l.situacao === "ressalva") l.motivo = l.motivos[0].texto = "excentricidade acima de 10 % em estaca travada: verificar o dimensionamento das vigas de travamento para a excentricidade real (7.1.2 b) — " + l.motivo;
      var c = ctx.item.carga;
      if (c && c.situacao === "nao_conforme") c.motivo = c.motivos[0].texto = "acréscimo superior a 15 %: corrigir com acréscimo de estacas ou recurso estrutural (7.1.3/7.1.4) — " + c.motivo;
    },
    notas: "5.2.4: o concreto deve atender ao fck e ao abatimento do projeto; a ficha estima o fck pela NBR 6118/80, 15.1.1 (mesmo procedimento da DNER-ES 346/97) com os exemplares de 28 dias importados da DNER-ME 091. As tolerâncias de 7.1 são as da estaca moldada in situ (título do 7.1.1) e foram aplicadas só a esse grupo (moldadas, Strauss, Franki). Nega: 2,0 cm/10 golpes quando o projeto não definir (5.4.2). 7.2.2 da ES diz \"a contratante\" obrigada a refazer: lido como a executante (contratada).",
    exemplos: [
      { nome: "Estacas Strauss Ø 32 cm — aceito", dados: function () {
        var P = { servico: "Bloco B — fundação (estacas E1 a E8)", tipo: "strauss", nEst: "8", diam: "32", empirica: "N", travada: "N", volume: "12", fck: "25", slump: "100", slumpTol: "20" };
        var d = { ident: { registro: "ED-FUN-01", obra: "Obra A", local: "Bloco B", data: "2026-05-12" }, params: P, verificacoes: G.verif(ID, {}, P),
          magro: [{ est: "Bloco B1", v: "7,5" }, { est: "Bloco B2", v: "7,0" }],
          penet: [1, 2, 3, 4, 5, 6, 7, 8].map(function (i) { return { est: "E" + i, v: i % 2 ? "10,5" : "12,0" }; }),
          diamMed: [{ est: "E1", v: "32" }, { est: "E5", v: "32" }],
          espac: [{ est: "E1–E2", v: "100" }, { est: "E5–E6", v: "98" }],
          cobr: [{ est: "E1", v: "30" }, { est: "E6", v: "28" }],
          compStrauss: [{ est: "E1", v: "9,5" }, { est: "E4", v: "11,0" }, { est: "E8", v: "10,2" }],
          exc: [{ est: "E3", v: "4,0" }, { est: "E7", v: "6,5" }],
          carga: [{ est: "Bloco B1", pos: "estaca mais solicitada", v: "8,0" }],
          incl: [{ est: "E2", v: "0,5" }, { est: "E6", v: "0,8" }],
          abat: [{ est: "Caminhão 1", reg: "NF 2101", v: "95" }, { est: "Caminhão 2", reg: "NF 2102", v: "110" }, { est: "Caminhão 3", reg: "NF 2103", v: "105" }] };
        d.fc = [["E1", "27,2"], ["E2", "28,4"], ["E3", "26,1"], ["E4", "29,0"], ["E5", "27,8"], ["E6", "30,3"], ["E7", "26,9"], ["E8", "28,0"]]
          .map(function (x, i) { return { est: x[0], reg: "CP-" + (101 + i) + " · exemplar " + (i + 1), v: x[1] }; });
        return d;
      } },
      { nome: "Estacas Franki Ø 40 cm — energia insuficiente e desvio de inclinação — rejeitado", dados: function () {
        var P = { servico: "Bloco C — fundação", tipo: "franki", nEst: "4", diam: "40", empirica: "N", travada: "S", volume: "8", fck: "25", slump: "100", slumpTol: "20" };
        var d = { ident: { registro: "ED-FUN-02", obra: "Obra B", local: "Bloco C", data: "2026-06-03" }, params: P,
          verificacoes: G.verif(ID, { esgot: { atende: "N", real: "4", nc: "1", obs: "água no fundo da cava do bloco C2" } }, P),
          magro: [{ est: "Bloco C1", v: "7,0" }, { est: "Bloco C2", v: "5,5" }],
          negaMed: [{ est: "E1", v: "15" }, { est: "E2", v: "18" }, { est: "E3", v: "24" }, { est: "E4", v: "12" }],
          penet: [{ est: "E1", v: "12" }, { est: "E2", v: "11" }, { est: "E3", v: "10" }, { est: "E4", v: "12" }],
          diamMed: [{ est: "E1", v: "40" }], espac: [{ est: "E1–E2", v: "125" }], cobr: [{ est: "E1", v: "25" }],
          energia: [{ est: "E1", v: "2,6" }, { est: "E2", v: "2,2" }],
          excT: [{ est: "E4", v: "12,5" }],
          carga: [{ est: "Bloco C1", pos: "estaca mais solicitada", v: "12,0" }],
          incl: [{ est: "E2", v: "1,5" }],
          fc: [], abat: [] };
        FE.aceitacao.exemplos.importar(FE.FICHAS[ID].params, d, "imp_abat", [["dner-me-404-00", 1]]);
        FE.aceitacao.exemplos.importar(FE.FICHAS[ID].params, d, "imp_fc", [["dner-me-091-98", 1]]);
        return d;
      } },
    ],
  });
})();
