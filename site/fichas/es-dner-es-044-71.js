/*
 * Ficha de ACEITAÇÃO: DNER-ES 044/71 — Proteção do corpo estradal — Revestimento de taludes com solo-cimento.
 * Funções comuns: FE.aceitacaoG7 (es-dnit-104-2009-es.js).
 *
 * O que a ES manda (seções do PDF, 3 páginas):
 *   2.1/2.2 cimento Portland (EB-1) e água isenta de substâncias nocivas.
 *   2.3   solo sem teor elevado de matéria orgânica; sem material retido na peneira de 1" e no máximo 30 % retido na de 4,8 mm (p. 1).
 *   4.1   talude plano, sem ressaltos terrosos; sulcos de erosão preenchidos com solo-cimento (até 10 % de cimento), em caixas com
 *         no mínimo 10 cm em qualquer dimensão (p. 2).
 *   4.3   no máximo 3 horas entre a incorporação do cimento e o acabamento; aplicação do pé para a crista (p. 2).
 *   4.4   compactação com soquetes, do pé para a crista, antes do início da pega.   4.5 cura de 7 dias (terra 5 cm / capim, úmido; ou RR-2K diluída).
 *   5     caracterização, RCS aos 7 dias ≥ 70 % da dosagem na mesma idade; GC ≥ 95 % (MB-33 — hoje DNIT 164);
 *         umidade de aplicação com variação máxima de 0,5 % em relação à h ót; nova dosagem se mudar o solo (p. 3).
 * A ES não fixa frequência nem controle estatístico: a ficha adota 1 determinação por lote como mínimo e avalia valores individuais.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G7 = FE.aceitacaoG7, num = FE.num, ok = FE.ok;
  var ID = "dner-es-044-71";
  function furosVal(campo) {
    return function (e) { return G7.furos(e).map(function (f) { return { v: f[campo], est: f.est, pos: f.pos, rot: f.rot }; }); };
  }
  function sulcos(P) { return P.sulcos === "sim"; }

  A.fichaSimples({
    id: ID,
    titulo: "Revestimento de taludes com solo-cimento — aceitação",
    resumo: "Aplica a DNER-ES 044/71: solo (sem retido em 1\", ≤ 30 % retido na 4,8 mm), resistência à compressão aos 7 dias ≥ 70 % da dosagem, GC ≥ 95 %, umidade h ót ± 0,5 %, " +
      "prazo de 3 h entre a incorporação do cimento e o acabamento, cura de 7 dias e preenchimento dos sulcos de erosão.",
    lote: { largura: false },
    params: [
      { k: "rcsDos", r: "RCS da dosagem de laboratório aos 7 dias (MPa)", dica: "seção 5: a RCS da mistura aplicada não pode ser inferior a 70 % dela" },
      { k: "sulcos", r: "Houve preenchimento de sulcos de erosão (4.1)?", tipo: "select", recarrega: true, opcoes: [["nao", "Não"], ["sim", "Sim"]] },
      { k: "mudou", r: "Houve mudança do solo utilizado?", tipo: "select", recarrega: true, opcoes: [["nao", "Não"], ["sim", "Sim — nova dosagem obrigatória (5)"]] },
    ],
    padrao: { sulcos: "nao", mudou: "nao" },
    refs: { reprova: "5", atende: "5", corrige: "5", regra: "5", tabela: "—" },
    criterios: [
      { id: "p25", grupo: "Materiais (2)", texto: "Solo — % passando na peneira de 1\" (25 mm)", secao: "2.3", tipo: "valor", unid: "%", casas: 1, min: 100,
        exigido: "100 % (sem material retido em 1\")", metodo: "DNIT 412", importar: { de: "dnit-412-2025-me", valores: G7.passante(25) } },
      { id: "p48", grupo: "Materiais (2)", texto: "Solo — % passando na peneira de 4,8 mm", secao: "2.3", tipo: "valor", unid: "%", casas: 1, min: 70,
        exigido: "≥ 70 % (no máximo 30 % retido)", metodo: "DNIT 412", importar: { de: "dnit-412-2025-me", valores: G7.passante(4.8) } },
      { id: "mat", grupo: "Materiais (2)", texto: "Solo sem teor elevado de matéria orgânica; cimento EB-1; água sem substâncias nocivas", secao: "2.1–2.3", tipo: "sim_nao" },
      { id: "dos", grupo: "Materiais (2)", texto: "Nova dosagem da mistura após a mudança do solo", secao: "5", tipo: "sim_nao", se: function (P) { return P.mudou === "sim"; },
        naoAplicaPor: "mesmo solo da dosagem" },
      { id: "rcs", grupo: "Controle (5)", texto: "Resistência à compressão simples aos 7 dias da mistura aplicada", secao: "5", tipo: "valor", unid: "MPa", casas: 2,
        min: function (P) { var r = num(P.rcsDos); return ok(r) ? 0.7 * r : NaN; }, metodo: "DNER-ME 201",
        importar: { de: "dner-me-201-94", valores: function (e) {
          return ((e.resultados || {}).grupos || []).filter(function (g) { return g.idade === 7 && ok(g.media); }).map(function (g) { return { v: g.media, rot: g.nome }; });
        } } },
      { id: "gc", grupo: "Controle (5)", texto: "Grau de compactação da mistura", secao: "5", tipo: "valor", unid: "%", casas: 1, min: 95, metodo: "DNIT 164 (MB-33) + DNIT 458 / DNER-ME 036/037",
        importar: { de: G7.FONTES_GC, valores: furosVal("GC") } },
      { id: "dw", grupo: "Controle (5)", texto: "Umidade de aplicação: Δw = w − h ót", secao: "5", tipo: "valor", unid: "p.p.", casas: 1, min: -0.5, max: 0.5,
        exigido: "h ót ± 0,5", importar: { de: G7.FONTES_GC, valores: furosVal("dw") } },
      { id: "tempo", grupo: "Execução (4)", texto: "Tempo entre a incorporação do cimento e o acabamento", secao: "4.3", tipo: "valor", unid: "h", casas: 1, max: 3, exigido: "≤ 3 h" },
      { id: "cxs", grupo: "Execução (4)", texto: "Menor dimensão das caixas de regularização dos sulcos", secao: "4.1", tipo: "valor", unid: "cm", casas: 0, min: 10, se: sulcos,
        naoAplicaPor: "sem preenchimento de sulcos" },
      { id: "teor", grupo: "Execução (4)", texto: "Teor de cimento no preenchimento dos sulcos", secao: "4.1", tipo: "valor", unid: "%", casas: 1, max: 10, exigido: "até 10 % em peso", se: sulcos,
        naoAplicaPor: "sem preenchimento de sulcos" },
      { id: "prep", grupo: "Execução (4)", texto: "Talude preparado: superfície plana, sem ressaltos terrosos nem cavidades", secao: "4.1", tipo: "sim_nao" },
      { id: "apl", grupo: "Execução (4)", texto: "Aplicação e compactação com soquete do pé para a crista, antes da pega; seção projetada", secao: "4.3; 4.4", tipo: "sim_nao" },
      { id: "cura", grupo: "Execução (4)", texto: "Cura de 7 dias (terra de 5 cm ou capim, mantido úmido; ou RR-2K diluída)", secao: "4.5", tipo: "sim_nao" },
    ],
    extra: function (ctx) {
      G7.ocultar(ctx, ["cxs", "teor", "dos"]);
      if (!ok(num(ctx.P.rcsDos))) ctx.avisos.push("Informe a RCS da dosagem de laboratório aos 7 dias: o mínimo da mistura aplicada é 70 % dela (seção 5).");
    },
    notas: "Critérios da DNER-ES 044/71 (seção 5). A ES não fixa frequência nem controle estatístico: valores individuais, mín. 1 determinação por lote (adotado). " +
      "MB-33 (ABNT) → DNIT 164; Δw importado dos furos de GC (umidade in situ logo após a aplicação) ou digitado; a variação de \"0,5 %\" foi lida como 0,5 ponto percentual em torno da h ót.",
    exemplos: [
      { nome: "Revestimento aceito — talude do aterro 2 (RCS e GC dos exemplos ME)", dados: function () {
        var d = { ident: { registro: "RSC-01", data: "2026-05-05", obra: "Obra A", trecho: "Talude do aterro 2", local: "Est. 40 a 46", origem: "Jazida 1" },
          params: { estIni: "40", estFim: "46", rcsDos: "3,0", sulcos: "sim", mudou: "nao" } };
        var par = FE.FICHAS[ID].params;
        d.p25 = [{ est: "42", reg: "GR-0501 (digitado)", v: "100" }]; d.p48 = [{ est: "42", reg: "GR-0501 (digitado)", v: "84,5" }];
        A.exemplos.importar(par, d, "imp_rcs", [["dner-me-201-94", 1]]);
        d.rcs[0].est = "43";
        A.exemplos.importar(par, d, "imp_gc", [["dner-me-036-94", 0]]);
        ["41", "43", "45"].forEach(function (e, i) { d.gc[i].est = e; });
        d.dw = [{ est: "41", v: "-0,3" }, { est: "43", v: "0,2" }, { est: "45", v: "0,4" }];
        d.tempo = [{ est: "41", v: "1,5" }, { est: "44", v: "2,2" }];
        d.cxs = [{ est: "44", v: "12" }]; d.teor = [{ est: "44", v: "8" }];
        d.verificacoes = [{ atende: "S" }, {}, { atende: "S", real: "2" }, { atende: "S", real: "2" }, { atende: "S" }];
        return d;
      } },
      { nome: "Revestimento rejeitado — RCS abaixo de 70 % da dosagem, GC < 95 % e 4 h até o acabamento", dados: function () {
        var d = { ident: { registro: "RSC-02", data: "2026-06-11", obra: "Obra B", trecho: "Talude do corte 5", local: "Est. 90 a 94", origem: "Jazida 2" },
          params: { estIni: "90", estFim: "94", rcsDos: "3,0", sulcos: "nao", mudou: "sim" } };
        var par = FE.FICHAS[ID].params;
        d.p25 = [{ est: "92", v: "100" }]; d.p48 = [{ est: "92", v: "76,0" }];
        A.exemplos.importar(par, d, "imp_rcs", [["dner-me-201-94", 2]]);
        d.rcs[0].est = "92";
        d.gc = [{ est: "91", v: "96,2" }, { est: "93", v: "93,8" }];
        d.dw = [{ est: "91", v: "0,3" }, { est: "93", v: "0,9" }];
        d.tempo = [{ est: "93", v: "4,0" }];
        d.verificacoes = [{ atende: "S" }, {}, { atende: "S" }, { atende: "S" }, { atende: "S" }];
        return d;
      } },
    ],
  });
})();
