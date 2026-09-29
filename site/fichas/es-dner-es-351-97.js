/*
 * Ficha de ES: DNER-ES 351/97 — Edificações — Revestimento de paredes (aceitação: verificação final 6.2 — cotas,
 * alinhamentos, espessuras e desempeno — e 6.3; execução pela seção 5, inclusive o quadro de grampos do 5.22.3).
 * Usa FE.aceitacaoG10a (definido em es-dner-es-344-97.js) e FE.aceitacao (es-comum.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG10a, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var sn = G.sn, v = G.v, ID = "dner-es-351-97";
  var tem = function (k) { return G.sim(k); };
  var argamassa = function (P) { return P.argamassa !== "N"; };
  // 5.22.3 — quantidade mínima de grampos por forra (área em m²); faixas da ES com lacunas (0,20–0,21 etc.):
  // limites tomados pelo lado mais exigente (área no limite vai para a faixa de cima)
  function grampos(a) {
    if (!ok(a)) return NaN;
    if (a < 0.20) return 2;
    if (a <= 0.40) return 3;
    if (a <= 1.00) return 4;
    if (a <= 2.00) return 6;
    return Math.ceil(a / 0.30 - 1e-9);
  }

  G.ficha({
    id: ID, es: "DNER-ES 351/97", secAceit: "6.3", secRejeita: "6.3.2", secRefazer: "6.3.3", area: true, rotArea: "Área de revestimento do lote (m²)",
    titulo: "Edificações — revestimento de paredes — aceitação",
    resumo: "Argamassas (chapisco, emboço ≤ 20 mm, total ≤ 25 mm), revestimento cerâmico (cura do emboço, argamassa colante 3–4 mm, uso ≤ 2 h, rejunte após 72 h), laminado, rodapés (tacos a ≤ 0,80 m) e pedras (argamassa > 25 mm, grampos pelo quadro do 5.22.3); verificação final de cotas, alinhamentos, espessuras e desempeno (6.2).",
    params: [
      { k: "argamassa", r: "Revestimento em argamassa (chapisco/emboço/reboco)? (5.5–5.17)", tipo: "select", recarrega: true, opcoes: [["S", "Sim"], ["N", "Não"]] },
      { k: "ceramica", r: "Revestimento cerâmico (azulejos, ladrilhos)? (5.18)", tipo: "select", recarrega: true, opcoes: G.SN },
      { k: "laminado", r: "Chapas de laminado melamínico? (5.20)", tipo: "select", recarrega: true, opcoes: G.SN },
      { k: "rodape", r: "Rodapés de madeira? (5.21)", tipo: "select", recarrega: true, opcoes: G.SN },
      { k: "pedra", r: "Revestimento de pedra? (5.22)", tipo: "select", recarrega: true, opcoes: G.SN },
    ],
    padrao: { argamassa: "S", ceramica: "N", laminado: "N", rodape: "N", pedra: "N" },
    criterios: [
      sn("receb", "6.1", "Materiais conforme os catálogos dos fabricantes", "atendidas as características"),
      sn("geom", "6.2.1", "Cotas e alinhamentos", "conforme o projeto"),
      sn("desempeno", "5.1; 6.2.2", "Desempeno e prumo dos paramentos", "perfeitamente desempenados e aprumados"),
      sn("base", "5.2–5.4; 5.7; 5.8", "Preparo da base", "regular, limpa, áspera e molhada antes do chapisco; tela nas bases de madeira/ferro", { se: argamassa }),
      sn("camadas", "5.5; 5.6; 5.9–5.11", "Camadas (chapisco, emboço, reboco) e guias", "camada anterior firme e umedecida; guias com a argamassa do emboço", { se: argamassa }),
      sn("traco", "5.12; 5.13", "Traços das argamassas", "chapisco 1:3; emboço 1:2:9, 1:8 ou 1:3:5; ao nível do solo 1:3 com impermeabilizante", { se: argamassa }),
      sn("sequencia", "5.14; 5.16", "Sequência dos serviços", "emboço após a pega e as tubulações; reboco após peitoris e marcos, antes de alizares e rodapés", { se: argamassa }),
      sn("colante", "5.18.1; 5.18.2", "Preparo da argamassa de alta adesividade", "consistência pastosa; descanso de 15 min e reamassamento", { se: tem("ceramica") }),
      sn("mosaico", "5.19", "Pastilhas: juntas preenchidas, papel removido, lavagem após 6 dias", "conforme 5.19", { se: tem("ceramica") }),
      sn("lamExec", "5.20", "Laminado: base 1:3 desempenada, adesivo, colagem a prumo, juntas ≈ 0,8 mm", "conforme 5.20", { se: tem("laminado") }),
      sn("rodExec", "5.21", "Rodapé liso 50 × 20 mm fixado a tacos por parafusos", "conforme 5.21", { se: tem("rodape") }),
      sn("pedraExec", "5.22; 5.22.2", "Pedras: tipo e acabamento; grampos de latão 150 mm × 4,7 mm", "conforme o detalhe e 5.22.2", { se: tem("pedra") }),
      v("emboco", "5.15", "Espessura do emboço", "mm", 0, undefined, 20, { se: argamassa, naoAplicaPor: "sem revestimento em argamassa" }),
      v("total", "5.15; 6.2.1", "Espessura total do revestimento de argamassa", "mm", 0, undefined, 25, { se: argamassa, naoAplicaPor: "sem revestimento em argamassa" }),
      v("curaEmb", "5.18", "Cura do emboço antes do assentamento cerâmico", "dias", 0, 10, undefined, { se: tem("ceramica"), falha: "ressalva", exigido: "cerca de 10 dias" }),
      v("camColante", "5.18.4", "Camada de argamassa colante", "mm", 1, 3, 4, { se: tem("ceramica") }),
      v("usoColante", "5.18.3", "Tempo entre o preparo e o uso da argamassa colante", "min", 0, undefined, 120, { se: tem("ceramica") }),
      v("rejunte", "5.18.5", "Prazo entre o assentamento e o rejuntamento", "h", 0, 72, undefined, { se: tem("ceramica") }),
      v("colagem", "5.20.2", "Intervalo entre a pintura de adesivo e a colagem", "h", 0, 9, 12, { se: tem("laminado") }),
      v("tacoRod", "5.21.1", "Espaçamento dos tacos dos rodapés", "m", 2, undefined, 0.80, { se: tem("rodape") }),
      v("argPedra", "5.22.1", "Espessura da argamassa de assentamento das pedras", "mm", 0, 25, undefined, { se: tem("pedra"), minEstrito: true, exigido: "> 25 mm" }),
    ],
    tabelaExtra: { chave: "grampos", titulo: "Grampos por forra de pedra (5.22.3)", rotulo: "Forra", se: tem("pedra"),
      dica: "área da forra e nº de grampos; mínimo: < 0,20 m²: 2 · até 0,40: 3 · até 1,00: 4 · até 2,00: 6 · > 2,00: 1 a cada 0,30 m²",
      linhas: [{ k: "id", r: "Identificação da forra", texto: true }, { k: "area", r: "Área da forra", u: "m²" }, { k: "n", r: "Grampos colocados", u: "nº" }] },
    extra: function (ctx) {
      var P = ctx.P;
      if (!tem("pedra")(P)) { ctx.linhas.push(A.linha({ id: "grampos", criterio: "Quantidade de grampos por forra", secao: "5.22.3", situacao: "nao_exigido", motivo: "sem revestimento de pedra", exigido: "quadro do 5.22.3", resultado: "—" })); return; }
      var fs = (ctx.d.grampos || []).map(function (c, i) { return { id: c.id || "forra " + (i + 1), a: num(c.area), n: num(c.n) }; }).filter(function (f) { return ok(f.a) && ok(f.n); });
      var l = A.linha({ id: "grampos", criterio: "Quantidade de grampos por forra", secao: "5.22.3", exigido: "quadro do 5.22.3", n: fs.length,
        resultado: fs.length ? fs.length + " forra(s) verificada(s)" : "—" });
      var falta = fs.filter(function (f) { return f.n < grampos(f.a); });
      if (!fs.length) A.marcar(l, "sem_dados", "sem forras verificadas");
      else if (falta.length) A.marcar(l, "nao_conforme", falta.map(function (f) { return f.id + ": " + fmt(f.n, 0) + " < " + grampos(f.a) + " (área " + fmt(f.a, 2) + " m²)"; }).join("; "));
      else l.motivo = "todas as forras com o mínimo do quadro";
      ctx.linhas.push(l);
      ctx.freqs.push(A.frequencia({ ensaio: "Quantidade de grampos por forra", metodo: "—", por: "lote", minimo: 1, realizado: fs.length }));
    },
    notas: "Espessuras (5.15): emboço ≤ 20 mm e revestimento de argamassa ≤ 25 mm (com ≈ 5 mm de reboco). Cura do emboço \"cerca de 10 dias\" (5.18): menos = ressalva. Quadro do 5.22.3 (grampos): as faixas da ES têm lacunas e extremos abertos (< 0,20; 0,21 < e < 0,40; 0,41 < e < 1,00; 1,01 < e < 2,00; > 2,00 m²): a ficha lê < 0,20 → 2; 0,20 a 0,40 → 3; até 1,00 → 4; até 2,00 → 6; acima de 2,00 → 1 grampo a cada 0,30 m² (arredondado para cima).",
    exemplos: [
      { nome: "Emboço e reboco com azulejos na cozinha — aceito", dados: function () {
        var P = { servico: "Bloco A — paredes internas do térreo", area: "520", argamassa: "S", ceramica: "S", laminado: "N", rodape: "N", pedra: "N" };
        return { ident: { registro: "ED-PAR-01", obra: "Obra A", local: "Bloco A — térreo", data: "2026-09-12" }, params: P, verificacoes: G.verif(ID, {}, P),
          emboco: [{ est: "Sala 1", v: "18" }, { est: "Sala 2", v: "15" }, { est: "Circulação", v: "20" }],
          total: [{ est: "Sala 1", v: "23" }, { est: "Sala 2", v: "20" }, { est: "Circulação", v: "25" }],
          curaEmb: [{ est: "Cozinha", v: "12" }], camColante: [{ est: "Cozinha", v: "3,5" }], usoColante: [{ est: "Cozinha — betonada 1", v: "90" }],
          rejunte: [{ est: "Cozinha", v: "72" }] };
      } },
      { nome: "Fachada de pedra com grampos insuficientes e emboço grosso — rejeitado", dados: function () {
        var P = { servico: "Fachada principal — Bloco B", area: "140", argamassa: "S", ceramica: "N", laminado: "N", rodape: "N", pedra: "S" };
        return { ident: { registro: "ED-PAR-02", obra: "Obra B", local: "Fachada principal", data: "2026-09-25" }, params: P,
          verificacoes: G.verif(ID, { desempeno: { atende: "N", real: "4", nc: "1", obs: "ondulação no pano entre os eixos 2 e 3" } }, P),
          emboco: [{ est: "Pano 1", v: "18" }, { est: "Pano 2", v: "26" }], total: [{ est: "Pano 1", v: "24" }, { est: "Pano 2", v: "31" }],
          argPedra: [{ est: "Pano 3", v: "30" }, { est: "Pano 4", v: "28" }],
          grampos: [{ id: "F1", area: "0,18", n: "2" }, { id: "F2", area: "0,40", n: "3" }, { id: "F3", area: "0,90", n: "3" }, { id: "F4", area: "2,40", n: "7" }] };
      } },
    ],
  });
})();
