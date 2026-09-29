/*
 * Ficha de ACEITAÇÃO DE TRECHO: DNER-ES 327/97 — Pavimento com peças pré-moldadas de concreto.
 *
 * O que a ES manda (seções do PDF):
 *   5.1.1 peças conforme ABNT NBR 9781, formato geométrico regular, "dimensões mínimas: comprimento de 40 cm, largura de
 *         10 cm e altura de 6 cm" (p. 2).       5.1.2 areia do colchão conforme DNER-EM 038.
 *   5.1.3 rejuntamento com CAP 40/50 ou 50/60.  5.2 a) rolo liso de 10 a 12 t.
 *   5.3.1 subleito regularizado (DNER-ES 299) e, se necessário, reforçado (DNER-ES 300).
 *   4.1 / 5.3.2 sub-base sem expansibilidade nem bombeamento, com os caimentos de drenagem; espessura de projeto, ≥ 15 cm.
 *   5.3.3 colchão de areia compactado com espessura uniforme e igual a 4 cm; guias e sarjetas obrigatórias (confinamento).
 *   5.3.4.2 ponteiros das linhas de referência a no máximo 10 m; cordéis nivelados.  5.3.4.3 assentamento, alinhamento
 *         e nivelamento das fileiras.  5.3.4.4 rejuntamento: pedrisco (≈ ¾ da altura da junta), compressão com rolo e
 *         derrame de asfalto até aflorar.  5.3.4.5 valetas provisórias; sem tráfego durante a construção.
 *   6.1   controle de recebimento dos materiais conforme 5.1.
 *   6.2   após cada trecho: relocação e nivelamento do eixo e dos bordos de 20 m em 20 m (largura e espessura).
 *   6.2.1 aceitação: a) variação da largura inferior a ± 10 % da de projeto; b) espessura média ≥ espessura de projeto e
 *         diferença entre a maior e a menor espessura ≤ 1 cm.
 *   7     medição em m² com as larguras médias do controle geométrico (7.2), limitada ao projeto (7.3).
 * Resistência das peças: a ES só remete à NBR 9781 (valor de projeto como parâmetro); importação opcional da DNER-ME 091.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, media = FE.media;
  var ID = "dner-es-327-97";
  var EPS = 1e-9;

  function vals(l) { return (l.pontos || []).filter(function (p) { return ok(p.v); }); }

  A.fichaSimples({
    id: ID,
    titulo: "Pavimento com peças pré-moldadas de concreto — aceitação do trecho (DNER-ES 327/97)",
    resumo: "Recebimento dos materiais (5.1 / 6.1), verificações da execução (5.3) e controle geométrico de 20 em 20 m (6.2): largura dentro de ± 10 % do projeto e espessura média ≥ projeto com amplitude ≤ 1 cm (6.2.1); área para medição com a largura média (7.2).",
    lote: { largura: true },
    refs: { regra: "6.2.1", tabela: "—" },
    params: [
      { k: "largProj", r: "Largura de projeto do pavimento (m)", dica: "6.2.1 a: variação inferior a ± 10 %" },
      { k: "espProj", r: "Espessura de projeto do pavimento (cm)", dica: "6.2.1 b: mesma grandeza medida no nivelamento de 6.2 (ex.: peça + colchão de areia)" },
      { k: "espSB", r: "Espessura de projeto da sub-base (cm)", ph: "15", dica: "5.3.2.2: definida em projeto, não inferior a 15 cm" },
      { k: "fpk", r: "Resistência à compressão exigida das peças (MPa)", ph: "ex.: 35", dica: "5.1.1: valor da ABNT NBR 9781 adotado no projeto" },
    ],
    padrao: { espSB: "15" },
    criterios: [
      // ---- materiais (5.1 / 6.1)
      { id: "pecas", texto: "Peças conforme ABNT NBR 9781, formato geométrico regular", secao: "5.1.1 / 6.1", tipo: "sim_nao", grupo: "Materiais (5.1 / 6.1)",
        metodo: "NBR 9781", exigido: "conforme NBR 9781" },
      { id: "comp", texto: "Comprimento das peças", secao: "5.1.1", tipo: "valor", unid: "cm", casas: 1, min: 40, falha: "ressalva", grupo: "Materiais (5.1 / 6.1)",
        exigido: "≥ 40 cm (texto da ES; ver nota)" },
      { id: "largPeca", texto: "Largura das peças", secao: "5.1.1", tipo: "valor", unid: "cm", casas: 1, min: 10, grupo: "Materiais (5.1 / 6.1)" },
      { id: "alt", texto: "Altura das peças", secao: "5.1.1", tipo: "valor", unid: "cm", casas: 1, min: 6, grupo: "Materiais (5.1 / 6.1)" },
      { id: "fc", texto: "Resistência à compressão das peças", secao: "5.1.1 (NBR 9781)", tipo: "valor", unid: "MPa", casas: 1, grupo: "Materiais (5.1 / 6.1)",
        metodo: "NBR 9781", min: function (P) { return num(P.fpk); },
        importar: { de: "dner-me-091-98", valores: function (e) {
          var r = e.resultados || {}, id = r.idadeFck;
          return (r.lista || []).filter(function (x) { return ok(x.fc) && (!ok(id) || x.idade === id); }).map(function (x) { return { v: x.fc, rot: x.nome }; });
        } } },
      { id: "areia", texto: "Areia do colchão conforme DNER-EM 038", secao: "5.1.2 / 6.1", tipo: "sim_nao", grupo: "Materiais (5.1 / 6.1)", metodo: "DNER-EM 038" },
      { id: "cap", texto: "Rejuntamento com CAP 40/50 ou 50/60", secao: "5.1.3 / 6.1", tipo: "sim_nao", grupo: "Materiais (5.1 / 6.1)", exigido: "CAP 40/50 ou 50/60" },
      // ---- execução (5.3)
      { id: "subleito", texto: "Subleito regularizado (DNER-ES 299) e reforçado quando necessário (DNER-ES 300)", secao: "5.3.1", tipo: "sim_nao", grupo: "Execução (5.3)" },
      { id: "sbMat", texto: "Sub-base sem expansibilidade nem bombeamento, com os caimentos de drenagem e a conformação mantida", secao: "4.1 / 5.3.2.1", tipo: "sim_nao", grupo: "Execução (5.3)" },
      { id: "espSBm", texto: "Espessura da sub-base", secao: "5.3.2.2", tipo: "valor", unid: "cm", casas: 1, grupo: "Execução (5.3)",
        min: function (P) { var e = num(P.espSB); return Math.max(15, ok(e) ? e : 15); }, freq: { por: "extensao", a_cada: 20, pontos: true } },
      { id: "colchao", texto: "Espessura do colchão de areia compactado", secao: "5.3.3", tipo: "valor", unid: "cm", casas: 1, min: 4, max: 4, falha: "ressalva",
        grupo: "Execução (5.3)", exigido: "uniforme e igual a 4 cm" },
      { id: "guias", texto: "Guias e sarjetas assentadas (confinamento do colchão — obrigatório)", secao: "5.3.3", tipo: "sim_nao", grupo: "Execução (5.3)" },
      { id: "linhas", texto: "Linhas de referência: ponteiros a no máximo 10 m, cordéis esticados e nivelados no abaulamento de projeto", secao: "5.3.4.2", tipo: "sim_nao", grupo: "Execução (5.3)" },
      { id: "assent", texto: "Assentamento: fileiras no esquadro, nivelamento com régua, alinhamento sob o cordel e juntas igualadas", secao: "5.3.4.3", tipo: "sim_nao", grupo: "Execução (5.3)" },
      { id: "rejunte", texto: "Rejuntamento: pedrisco (≈ ¾ da junta), compressão com rolo liso de 10 a 12 t e asfalto até aflorar", secao: "5.3.4.4 / 5.2 a", tipo: "sim_nao", grupo: "Execução (5.3)" },
      { id: "protecao", texto: "Valetas provisórias e ausência de tráfego durante a construção", secao: "5.3.4.5", tipo: "sim_nao", grupo: "Execução (5.3)" },
      // ---- controle geométrico (6.2)
      { id: "larg", texto: "Largura do pavimento", secao: "6.2 / 6.2.1 a", tipo: "valor", unid: "m", casas: 2, grupo: "Controle geométrico (6.2)",
        min: function (P) { var l = num(P.largProj); return ok(l) ? 0.9 * l : NaN; }, minEstrito: true,
        max: function (P) { var l = num(P.largProj); return ok(l) ? 1.1 * l : NaN; },
        exigido: "variação inferior a ± 10 % da largura de projeto", freq: { por: "extensao", a_cada: 20, pontos: true, regra: "a cada 20 m (relocação do eixo e bordos)" } },
      { id: "esp", texto: "Espessura do pavimento", secao: "6.2 / 6.2.1 b", tipo: "valor", unid: "cm", casas: 1, grupo: "Controle geométrico (6.2)",
        exigido: "média ≥ projeto; maior − menor ≤ 1 cm",
        freq: { por: "extensao", a_cada: 1, qtd: function (P, L) { return ok(L.ext) ? 3 * A.nPontos(L.ext, 20) : NaN; }, minimo: 3,
          regra: "eixo e bordos a cada 20 m (3 por seção)" } },
    ],
    extra: function (ctx) {
      var P = ctx.P, L = ctx.L, it = ctx.item;
      // 6.2.1 a: "inferior a ± 10 %" — a variação de exatamente 10 % também não atende
      var lg = it.larg, lp = num(P.largProj);
      if (lg && lg.situacao !== "nao_exigido" && ok(lp)) {
        var lim = vals(lg).filter(function (p) { return Math.abs(Math.abs(p.v / lp - 1) - 0.10) < 1e-6 && lg.fora.indexOf(p) < 0; });
        if (lim.length) A.marcar(lg, "nao_conforme", "variação de exatamente 10 % (a ES exige inferior a ± 10 %): " + lim.map(function (p) { return fmt(p.v, 2) + " m"; }).join("; "));
        vals(lg).forEach(function (p) { p.var = (p.v / lp - 1) * 100; });
        if (vals(lg).length) lg.resultado += " · variação " + fmt(Math.min.apply(null, vals(lg).map(function (p) { return p.var; })), 1) + " a " +
          fmt(Math.max.apply(null, vals(lg).map(function (p) { return p.var; })), 1) + " %";
      }
      if (lg && !ok(lp) && vals(lg).length) A.marcar(lg, "pendente", "informe a largura de projeto");
      // 6.2.1 b: espessura média ≥ projeto e amplitude ≤ 1 cm
      var le = it.esp, ep = num(P.espProj), pe = vals(le);
      if (pe.length) {
        var xs = pe.map(function (p) { return p.v; }), X = media(xs), mx = Math.max.apply(null, xs), mn = Math.min.apply(null, xs), amp = mx - mn;
        le.situacao = "conforme"; le.motivos = []; le.motivo = ""; le.media = X;
        le.resultado = "X̄ = " + fmt(X, 2) + " cm · maior − menor = " + fmt(mx, 1) + " − " + fmt(mn, 1) + " = " + fmt(amp, 1) + " cm (n = " + pe.length + ")";
        le.exigido = (ok(ep) ? "X̄ ≥ " + fmt(ep, 1) + " cm" : "X̄ ≥ projeto") + "; maior − menor ≤ 1,0 cm";
        if (le.est) le.est.min = ep;
        if (!ok(ep)) A.marcar(le, "pendente", "informe a espessura de projeto");
        else if (X < ep - EPS) A.marcar(le, "nao_conforme", "espessura média " + fmt(X, 2) + " cm < projeto " + fmt(ep, 1) + " cm (6.2.1 b)");
        if (amp > 1 + EPS) A.marcar(le, "nao_conforme", "diferença entre a maior e a menor espessura = " + fmt(amp, 1) + " cm > 1 cm (6.2.1 b)");
        if (le.situacao === "conforme") le.motivo = "média ≥ projeto e amplitude ≤ 1 cm (6.2.1 b)";
      }
      // 7.2 / 7.3: área para medição com a largura média, limitada ao projeto
      var lv = lg ? vals(lg) : [];
      if (ok(L.ext) && lv.length) {
        var lm = media(lv.map(function (p) { return p.v; })), am = L.ext * lm, ap = ok(lp) ? L.ext * lp : NaN;
        ctx.linhas.push(A.linha({ id: "medicao", grupo: "Medição (7)", criterio: "Área para medição = extensão × largura média", secao: "7.1 a 7.3", situacao: "informativo",
          n: lv.length, exigido: ok(ap) ? "≤ área de projeto " + fmt(ap, 0) + " m²" : "limitada ao projeto",
          resultado: fmt(L.ext, 0) + " m × " + fmt(lm, 2) + " m = " + fmt(am, 0) + " m²" + (ok(ap) && am > ap ? " → medir " + fmt(ap, 0) + " m² (7.3)" : ""),
          motivo: ok(ap) && am > ap ? "área executada acima do projeto: mede-se a de projeto (7.3)" : "" }));
      }
    },
    textos: {
      ACEITO: { titulo: "TRECHO ACEITO", texto: "Materiais, execução e controle geométrico conforme a DNER-ES 327/97 (6.2.1)." },
      RESSALVA: { titulo: "TRECHO ACEITO COM RESSALVA", texto: "Nenhum critério reprovado, mas há pontos a corrigir ou a documentar (ressalvas abaixo)." },
      PENDENTE: { titulo: "TRECHO PENDENTE — CONTROLE INCOMPLETO", texto: "Nenhum critério reprovado, mas faltam verificações ou medidas exigidas: complete o controle antes de aceitar o trecho." },
      REJEITADO: { titulo: "TRECHO NÃO ACEITO", texto: "Há critério não conforme: o trecho não atende ao 6.2.1 ou a exigência de material/execução; corrigir e reinspecionar." },
    },
    notas: "DNER-ES 327/97: materiais 5.1 (controle 6.1), execução 5.3, controle geométrico 6.2 (relocação e nivelamento do eixo e dos bordos de 20 em 20 m) " +
      "e aceitação 6.2.1 (largura com variação inferior a ± 10 %; espessura média ≥ projeto e maior − menor ≤ 1 cm). Medição 7: m² com a largura média, " +
      "limitada ao projeto. Comprimento das peças: a ES pede \"dimensões mínimas\" de 40 cm de comprimento (5.1.1) — incompatível com as peças usuais " +
      "(a NBR 9781 fixa 40 cm como comprimento MÁXIMO); por isso o desvio é registrado como ressalva, e não como reprovação. Resistência das peças: " +
      "a ES só remete à NBR 9781 — informe o valor adotado no projeto.",
    exemplos: [
      { nome: "Trecho urbano de 200 m, peças 20 × 10 × 8 cm (aceito com ressalva do comprimento)", dados: function () {
        var larg = [7.02, 6.98, 7.05, 7.00, 6.95, 7.03, 7.01, 6.97, 7.04, 7.00, 6.99];
        var esp = [[12.3, 12.1, 12.4], [12.0, 12.2, 12.5], [12.4, 12.3, 12.1], [12.2, 12.0, 12.3], [12.5, 12.4, 12.2], [12.1, 12.3, 12.4],
          [12.3, 12.2, 12.0], [12.4, 12.5, 12.3], [12.2, 12.1, 12.4], [12.0, 12.3, 12.2], [12.3, 12.4, 12.1]];
        var d = { ident: { registro: "TR-PPM-01", data: "2025-10-06", obra: "Obra A", trecho: "Rua A — est. 10 a 20", camada: "Pavimento de peças pré-moldadas" },
          params: { estIni: "10", estFim: "20", largura: "7,00", largProj: "7,00", espProj: "12", espSB: "15", fpk: "35" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S", real: "11" },
            { atende: "S", real: "4" }, { atende: "S" }, { atende: "S" }],
          comp: [{ pos: "lote de peças 1", v: "20,0" }], largPeca: [{ pos: "lote de peças 1", v: "10,0" }], alt: [{ pos: "lote de peças 1", v: "8,0" }],
          fc: [{ pos: "lote 1 — média de 6 peças", reg: "Fornecedor A — laudo 112", v: "38,6" }, { pos: "lote 2 — média de 6 peças", reg: "Fornecedor A — laudo 118", v: "37,2" }],
          espSBm: [], colchao: [{ est: "12", pos: "eixo", v: "4,0" }, { est: "16", pos: "eixo", v: "4,0" }, { est: "19", pos: "eixo", v: "4,0" }],
          larg: [], esp: [] };
        [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].forEach(function (e, i) {
          d.espSBm.push({ est: String(e), pos: "eixo", v: A.nstr(15.5 + (i % 3) * 0.4, 1) });
          d.larg.push({ est: String(e), pos: "bordo a bordo", v: A.nstr(larg[i], 2) });
          ["BE", "eixo", "BD"].forEach(function (p, j) { d.esp.push({ est: String(e), pos: p, v: A.nstr(esp[i][j], 1) }); });
        });
        return d;
      } },
      { nome: "Trecho de 120 m com espessura irregular, alargamento de 11 % e sub-base fina (não aceito)", dados: function () {
        var larg = [6.02, 6.05, 5.98, 6.66, 6.01, 6.03, 5.97];
        var esp = [[12.0, 12.6, 11.8], [11.4, 12.1, 12.5], [12.3, 12.8, 12.2], [11.9, 12.4, 11.5], [12.0, 12.2, 12.1], [11.7, 12.0, 12.3], [12.1, 12.4, 11.9]];
        var sb = [15.2, 13.0, 15.6, 14.8, 15.4, 15.1, 15.9];
        var d = { ident: { registro: "TR-PPM-02", data: "2025-10-14", obra: "Obra B", trecho: "Acesso B — est. 0 a 6", camada: "Pavimento de peças pré-moldadas" },
          params: { estIni: "0", estFim: "6", largura: "6,00", largProj: "6,00", espProj: "12", espSB: "15", fpk: "35" },
          verificacoes: [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "N", obs: "guias ausentes entre as est. 4 e 5" },
            { atende: "S" }, { atende: "S", real: "3" }, { atende: "S" }, { atende: "S" }],
          comp: [{ pos: "lote de peças 1", v: "20,0" }], largPeca: [{ pos: "lote de peças 1", v: "10,0" }], alt: [{ pos: "lote de peças 1", v: "8,0" }],
          espSBm: [], colchao: [{ est: "2", pos: "eixo", v: "4,0" }, { est: "5", pos: "eixo", v: "5,5" }], larg: [], esp: [] };
        [0, 1, 2, 3, 4, 5, 6].forEach(function (e, i) {
          d.espSBm.push({ est: String(e), pos: "eixo", v: A.nstr(sb[i], 1) });
          d.larg.push({ est: String(e), pos: "bordo a bordo", v: A.nstr(larg[i], 2) });
          ["BE", "eixo", "BD"].forEach(function (p, j) { d.esp.push({ est: String(e), pos: p, v: A.nstr(esp[i][j], 1) }); });
        });
        var F = FE.FICHAS[ID];
        A.exemplos.importar(F.params, d, "imp_fc", [["dner-me-091-98", 1]]);
        return d;
      } },
    ],
  });
})();
