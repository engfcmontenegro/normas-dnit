/*
 * Ficha de ACEITAÇÃO: DNIT 107/2009-ES — Terraplenagem — Empréstimos.
 * Funções comuns: FE.aceitacaoG7 (es-dnit-104-2009-es.js).
 *
 * O que a ES manda (seções do PDF):
 *   5.1 b  materiais isentos de matéria orgânica, micácea e diatomácea; sem turfa ou argila orgânica.
 *   5.1 c  para o corpo do aterro: ISC ≥ 2 % e expansão ≤ 4 % (compactação e ISC no Método A — DNER-ME 129/049, hoje DNIT 164/172).
 *   5.1 d  para a camada final de aterros / substituição da camada superficial de cortes: "a melhor capacidade de suporte"
 *          (valor do projeto) e expansão ≤ 2 % (Método B). NOTA: estudo com ao menos uma alternativa de CBR ≥ 6 %.
 *   5.3.2/5.3.3 escavação só após desmatamento, destocamento, limpeza e remoção da camada estéril, com autorização.
 *   5.3.4  empréstimos em alargamento de corte: preferencialmente até a cota do greide; nunca conduzir águas pluviais à plataforma.
 *   5.3.5  caixas laterais (greide elevado): borda interna a no mínimo 5,00 m do pé do aterro; declividade longitudinal para drenagem.
 *   5.3.6  caixas laterais: faixa sem exploração de 2,00 m entre a borda externa e o limite da faixa de domínio.
 *   5.3.7  alargamento de corte: essa faixa com no mínimo 3,00 m (valeta de proteção) (p. 4).
 *   5.3.9/5.3.10 bordas sobre taludes estáveis; inclinação dos taludes verificada com gabarito.
 *   7.1    controle tecnológico "na forma das normas específicas vigentes" (a ES não fixa frequência).
 *   7.2    autorização; destinação conforme a distribuição do projeto.   7.3.1 demarcações e 5.3.5–5.3.7.   7.3.2 taludes.   7.3.3 ambiental.
 *   7.4    conformidade inferida de 7.1, 7.2 e 7.3; incorreto → corrigir; corrigido só é aceito se ficar conforme.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G7 = FE.aceitacaoG7, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var ID = "dnit-107-2009-es";
  function final(P) { return P.destino === "final"; }
  function tipo(P) { return P.tipo || "lateral"; }

  A.fichaSimples({
    id: ID,
    titulo: "Empréstimos — aceitação da exploração e do material",
    resumo: "Aplica a DNIT 107/2009-ES a um empréstimo: requisitos do material (ISC e expansão conforme o destino — 5.1 c/d; isento de matéria orgânica — 5.1 b), " +
      "afastamentos das caixas (5,00 m do pé do aterro; faixa sem exploração de 2,00 m ou 3,00 m — 5.3.5 a 5.3.7) e as verificações da seção 7.",
    lote: { largura: false },
    params: [
      { k: "tipo", r: "Tipo de empréstimo", tipo: "select", recarrega: true,
        opcoes: [["lateral", "Caixa de empréstimo lateral (greide elevado)"], ["alargamento", "Alargamento de corte"], ["concentrado", "Empréstimo concentrado (fora da plataforma)"]] },
      { k: "destino", r: "Destino do material", tipo: "select", recarrega: true,
        opcoes: [["corpo", "Corpo de aterro — ISC ≥ 2 %, expansão ≤ 4 % (5.1 c)"], ["final", "Camada final / substituição da camada superficial de cortes — ISC de projeto, expansão ≤ 2 % (5.1 d)"]] },
      { k: "iscMin", r: "ISC mínimo de projeto para a camada final (%)", se: function (d) { return (d.params || {}).destino === "final"; },
        dica: "5.1 d: \"a melhor capacidade de suporte\" — valor fixado no projeto" },
      G7.paramComp("impISC", { isc: "isc", exp: "exp" }, { r: "ISC e expansão do material — importar (DNIT 172)", de: "dnit-172-2016-me" }),
    ],
    padrao: { tipo: "lateral", destino: "corpo" },
    refs: { reprova: "7.4", atende: "7.4", corrige: "7.4", regra: "7.4", tabela: "—" },
    criterios: [
      { id: "isc", grupo: "Material (5.1; 7.1)", texto: "Índice de Suporte Califórnia (ISC) do material", secao: "5.1 c, d", tipo: "valor", unid: "%", casas: 1,
        metodo: "DNIT 172 (antiga DNER-ME 049)", min: function (P) { return final(P) ? num(P.iscMin) : 2; } },
      { id: "exp", grupo: "Material (5.1; 7.1)", texto: "Expansão do material", secao: "5.1 c, d", tipo: "valor", unid: "%", casas: 2,
        metodo: "DNIT 172 (antiga DNER-ME 049)", max: function (P) { return final(P) ? 2 : 4; } },
      { id: "mat", grupo: "Material (5.1; 7.1)", texto: "Material isento de matéria orgânica, micácea e diatomácea; sem turfa ou argila orgânica", secao: "5.1 b", tipo: "sim_nao",
        exigido: "isento (inspeção / caracterização)" },
      { id: "pe", grupo: "Controle geométrico (7.3.1)", texto: "Distância da borda interna da caixa ao pé do aterro", secao: "5.3.5", tipo: "valor", unid: "m", casas: 2,
        min: 5, exigido: "≥ 5,00 m", metodo: "trena / topografia", se: function (P) { return tipo(P) === "lateral"; }, naoAplicaPor: "não é caixa lateral" },
      { id: "faixa", grupo: "Controle geométrico (7.3.1)", texto: "Faixa sem exploração entre a borda externa e o limite da faixa de domínio", secao: "5.3.6; 5.3.7", tipo: "valor",
        unid: "m", casas: 2, min: function (P) { return tipo(P) === "alargamento" ? 3 : 2; }, metodo: "trena / topografia",
        se: function (P) { return tipo(P) !== "concentrado"; }, naoAplicaPor: "empréstimo concentrado fora da faixa" },
      { id: "demarc", grupo: "Controle geométrico (7.3.1)", texto: "Demarcação das áreas e dos horizontes utilizáveis conforme o projeto", secao: "7.3.1", tipo: "sim_nao",
        exigido: "levantamento topográfico e visual" },
      { id: "aut", grupo: "Controle da execução (7.2)", texto: "Exploração autorizada; área desmatada, destocada e limpa, camada estéril removida", secao: "7.2; 5.3.2; 5.3.3", tipo: "sim_nao",
        exigido: "autorizada após a limpeza" },
      { id: "dest", grupo: "Controle da execução (7.2)", texto: "Destinação do material conforme a distribuição do projeto", secao: "7.2", tipo: "sim_nao", exigido: "conforme o projeto" },
      { id: "agua", grupo: "Controle da execução (7.2)", texto: "Drenagem: declividade longitudinal da caixa; sem condução de águas pluviais à plataforma", secao: "5.3.4; 5.3.5", tipo: "sim_nao",
        exigido: "sem águas conduzidas à plataforma", se: function (P) { return tipo(P) !== "concentrado"; }, naoAplicaPor: "empréstimo concentrado" },
      { id: "talude", grupo: "Acabamento (7.3.2)", texto: "Bordas sobre taludes estáveis; inclinação verificada com gabarito", secao: "7.3.2; 5.3.9; 5.3.10", tipo: "sim_nao",
        exigido: "taludes estáveis e com a inclinação devida" },
      G7.ambiental("7.3.3", "6", "Acabamento (7.3.2)"),
    ],
    extra: function (ctx) {
      var P = ctx.P;
      G7.freq(ctx, "isc", { exigido: 1, regra: "\"normas específicas vigentes\" (7.1) — mín. 1 por lote (adotado)" });
      G7.freq(ctx, "exp", { exigido: 1, regra: "\"normas específicas vigentes\" (7.1) — mín. 1 por lote (adotado)" });
      ["pe", "faixa"].forEach(function (id) { if (ctx.item[id] && ctx.item[id].situacao !== "nao_exigido") G7.freq(ctx, id, { exigido: 1, regra: "a ES não fixa — mín. 1 por caixa (adotado)" }); });
      G7.ocultar(ctx, ["pe", "faixa", "agua"]);
      if (final(P) && ok(num(P.iscMin)) && num(P.iscMin) < 6) ctx.avisos.push("ISC de projeto abaixo de 6 %: confira a análise técnico-econômica (5.1 d, NOTA — ao menos uma alternativa com CBR ≥ 6 %).");
    },
    notas: "Critérios da DNIT 107/2009-ES. A ES não traz controle estatístico nem frequência de ensaios (7.1 remete às normas específicas): ISC e expansão avaliados por valor individual, " +
      "mín. 1 ensaio por lote (adotado). Afastamentos das caixas (5.3.5 a 5.3.7) por valor individual. DNER-ME 129 → DNIT 164; DNER-ME 049 → DNIT 172.",
    exemplos: [
      { nome: "Caixa lateral aceita — material para corpo de aterro", dados: function () {
        var d = { ident: { registro: "EMP-L-03", data: "2026-04-22", obra: "Obra A — BR-000", trecho: "Empréstimo lateral LE", local: "Est. 410 a 430", origem: "Empréstimo E-1" },
          params: { estIni: "410", estFim: "430", tipo: "lateral", destino: "corpo" } };
        A.exemplos.importar(FE.FICHAS[ID].params, d, "impISC", [["dnit-172-2016-me", 1]]);
        d.isc[0].est = "418"; d.exp[0].est = "418";
        d.isc.push({ est: "426", reg: "ISC-0391 · DNIT 172 (digitado)", v: "9,6" });
        d.exp.push({ est: "426", reg: "ISC-0391 · DNIT 172 (digitado)", v: "1,85" });
        d.pe = [{ est: "412", v: "6,20" }, { est: "420", v: "5,60" }, { est: "428", v: "5,35" }];
        d.faixa = [{ est: "412", v: "2,40" }, { est: "420", v: "2,15" }, { est: "428", v: "2,30" }];
        d.verificacoes = [{ atende: "S", real: "2" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S", real: "2" }, { atende: "S", real: "2" }, { atende: "S" }];
        return d;
      } },
      { nome: "Alargamento de corte rejeitado — ISC abaixo do projeto e faixa de 2,50 m (< 3,00 m)", dados: function () {
        var d = { ident: { registro: "EMP-A-07", data: "2026-05-30", obra: "Obra B", trecho: "Alargamento do corte 6", local: "Est. 610 a 618", origem: "Empréstimo E-6" },
          params: { estIni: "610", estFim: "618", tipo: "alargamento", destino: "final", iscMin: "8" } };
        A.exemplos.importar(FE.FICHAS[ID].params, d, "impISC", [["dnit-172-2016-me", 1]]);
        d.isc[0].est = "612"; d.exp[0].est = "612";
        d.isc.push({ est: "616", reg: "ISC-0520 · DNIT 172 (digitado)", v: "5,4" });
        d.exp.push({ est: "616", reg: "ISC-0520 · DNIT 172 (digitado)", v: "1,40" });
        d.faixa = [{ est: "611", v: "3,20" }, { est: "615", v: "2,50" }];
        d.verificacoes = [{ real: "2", nc: "1", obs: "bolsão de argila orgânica na est. 614 — segregar" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, {}, { atende: "S" }];
        return d;
      } },
    ],
  });
})();
