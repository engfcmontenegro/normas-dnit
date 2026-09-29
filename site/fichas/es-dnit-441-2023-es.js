/*
 * Ficha de ACEITAÇÃO: DNIT 441/2023-ES — Camada granular para fundação de aterros sobre solos moles.
 * Funções comuns: FE.aceitacaoG7 (es-dnit-104-2009-es.js).
 *
 * O que a ES manda (seções do PDF):
 *   5 a–g  cava drenada antes do lançamento (ou camada inerte ≥ 1,0 m acima do NA / estiva); lançamento em ponta de aterro
 *          com trator de esteira leve; sem compactação direta.
 *   6.1    Tabela 1 (areia): EA ≥ 35 % e permeabilidade ≥ 5,0 × 10⁻³ cm/s, pelo menos 1 ensaio a cada 1.000 m³ ou quando alterar
 *          o material (p. 4). Tabela 2 (geotêxtil não tecido, tipos A/B/C): tração ≥ 12/14/19 kN/m; alongamento ≤ 75 %;
 *          grab ≥ 800/960/1290 N; puncionamento CBR ≥ 2,5/3,0/4,0 kN; permeabilidade ≥ 0,35 cm/s; gramatura 300 g/m²;
 *          AOS 0,11–0,21 / 0,08–0,19 / 0,07–0,16 mm (p. 4).
 *   6.3    NOTA 3: espessura mínima recomendada de 30 cm; NOTA 4: tração nominal do geotêxtil ≥ 50 kN/m; g) transpasse ≥ 10 cm
 *          e grampos a cada 3,0 m; f) enchimento seco dos vazios do rachão; h) camada de regularização com solo compactado.
 *   8.1    areia: a cada 1.000 m³, no mínimo 1 granulometria (DNER-ME 051), 1 impurezas orgânicas (DNER-ME 055) e 1 EA
 *          (DNER-ME 054 — hoje DNIT 450); aceitação: EA ≥ 35 %; granulometria do material pedregulhoso conforme o projeto (p. 5).
 *   8.2    visual (espalhamento, desempeno, sem lama).   8.2.1 geometria: nivelamento do eixo e de no mínimo 3 pontos por seção,
 *          seções a cada 10 m; cotas ± 10,0 cm; largura da cava até + 1,0 m por lado, sem variação negativa (NOTA 6) (p. 6).
 *   8.4    X̄ − k·s ≥ mínimo; X̄ + k·s ≤ máximo; k da Tabela A1 (Anexo A, normativo).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G7 = FE.aceitacaoG7, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var ID = "dnit-441-2023-es";
  function areia(P) { return P.material === "areia"; }
  function geo(P) { return P.geotextil === "sim"; }
  var TIPO = { A: [12, 800, 2.5, 0.11, 0.21], B: [14, 960, 3.0, 0.08, 0.19], C: [19, 1290, 4.0, 0.07, 0.16] };
  function tg(P, i) { return (TIPO[P.tipoGeo] || TIPO.A)[i]; }
  var GG = "Geotêxtil não tecido (Tabela 2; 6.3)";

  A.fichaSimples({
    id: ID,
    titulo: "Camada granular para fundação de aterros sobre solos moles — aceitação",
    resumo: "Aplica a DNIT 441/2023-ES: ensaios da areia a cada 1.000 m³ (EA ≥ 35 % com a estatística da 8.4, permeabilidade, granulometria e impurezas orgânicas), " +
      "requisitos do geotêxtil (Tabela 2), controle geométrico (cotas ± 10 cm; cava até + 1,0 m por lado) e as verificações de execução das seções 5, 6.3 e 8.2.",
    lote: { largura: false, volume: true },
    params: [
      { k: "material", r: "Material da camada granular (6.1)", tipo: "select", recarrega: true,
        opcoes: [["areia", "Areia média ou grossa mal graduada"], ["po", "Pó de pedra"], ["brita", "Pedra britada"], ["rachao", "Rachão / material de 3ª categoria"]] },
      { k: "geotextil", r: "Geotêxtil não tecido previsto em projeto?", tipo: "select", recarrega: true, opcoes: [["nao", "Não"], ["sim", "Sim"]] },
      { k: "tipoGeo", r: "Tipo de geotêxtil (Tabela 2)", tipo: "select", recarrega: true, opcoes: [["A", "Tipo A"], ["B", "Tipo B"], ["C", "Tipo C"]],
        se: function (d) { return (d.params || {}).geotextil === "sim"; } },
      { k: "nota6", r: "Alargamento da cava além de 1,0 m justificado e aprovado (NOTA 6)?", tipo: "select", opcoes: [["nao", "Não"], ["sim", "Sim"]] },
    ],
    padrao: { material: "areia", geotextil: "nao", tipoGeo: "A", nota6: "nao" },
    refs: { reprova: "8.4 b", atende: "8.4 a", corrige: "8.4", regra: "8.4", tabela: "Tabela A1" },
    criterios: [
      { id: "ea", grupo: "Controle dos insumos — areia (8.1; Tabela 1)", texto: "Equivalente de areia", secao: "8.1; Tabela 1", tipo: "estatistico", unid: "%", casas: 0, min: 35,
        metodo: "DNIT 450 (antiga DNER-ME 054)", se: areia, freq: { por: "volume", a_cada: 1000 },
        importar: { de: "dnit-450-2024-me", valores: function (e) { return (e.resultados || {}).ea; } } },
      { id: "perm", grupo: "Controle dos insumos — areia (8.1; Tabela 1)", texto: "Permeabilidade da areia", secao: "Tabela 1", tipo: "valor", unid: "cm/s", casas: 4, min: 0.005,
        exigido: "≥ 5,0 × 10⁻³ cm/s", metodo: "ABNT NBR 13292", se: areia, freq: { por: "volume", a_cada: 1000 } },
      { id: "gran", grupo: "Controle dos insumos — areia (8.1; Tabela 1)", texto: "Granulometria conforme o projeto (areia mal graduada / material pedregulhoso)", secao: "8.1 a", tipo: "sim_nao",
        metodo: "DNER-ME 051", exigido: "conforme projeto" },
      { id: "impur", grupo: "Controle dos insumos — areia (8.1; Tabela 1)", texto: "Impurezas orgânicas da areia (sem matéria orgânica, torrões de argila)", secao: "8.1 b; 6.1 a", tipo: "sim_nao",
        metodo: "DNER-ME 055", se: areia, freq: { por: "volume", a_cada: 1000 }, exigido: "sem impurezas nocivas" },
      { id: "gtr", grupo: GG, texto: "Resistência à tração (direção de menor resistência)", secao: "Tabela 2", tipo: "valor", unid: "kN/m", casas: 1, se: geo,
        min: function (P) { return tg(P, 0); }, metodo: "ABNT NBR ISO 10319" },
      { id: "gnom", grupo: GG, texto: "Resistência à tração nominal (fabricante)", secao: "6.3 d, NOTA 4", tipo: "valor", unid: "kN/m", casas: 1, se: geo, min: 50, metodo: "certificado" },
      { id: "galo", grupo: GG, texto: "Alongamento", secao: "Tabela 2", tipo: "valor", unid: "%", casas: 0, se: geo, max: 75, metodo: "ABNT NBR ISO 10319" },
      { id: "ggrab", grupo: GG, texto: "Resistência à tração Grab", secao: "Tabela 2", tipo: "valor", unid: "N", casas: 0, se: geo, min: function (P) { return tg(P, 1); }, metodo: "ASTM D4632" },
      { id: "gpunc", grupo: GG, texto: "Resistência ao puncionamento CBR", secao: "Tabela 2", tipo: "valor", unid: "kN", casas: 1, se: geo, min: function (P) { return tg(P, 2); }, metodo: "ABNT NBR ISO 12236" },
      { id: "gperm", grupo: GG, texto: "Permeabilidade do geotêxtil", secao: "Tabela 2", tipo: "valor", unid: "cm/s", casas: 2, se: geo, min: 0.35, metodo: "ASTM D4491" },
      { id: "ggram", grupo: GG, texto: "Gramatura", secao: "Tabela 2", tipo: "valor", unid: "g/m²", casas: 0, se: geo, min: 300, exigido: "300 g/m² (adotado como mínimo)", metodo: "ABNT NBR ISO 9864" },
      { id: "gaos", grupo: GG, texto: "Abertura aparente (AOS)", secao: "Tabela 2", tipo: "valor", unid: "mm", casas: 2, se: geo,
        min: function (P) { return tg(P, 3); }, max: function (P) { return tg(P, 4); }, metodo: "ASTM D4751" },
      { id: "gtransp", grupo: GG, texto: "Envelopamento: transpasse ≥ 10 cm e grampos a cada 3,0 m (ou conforme projeto)", secao: "6.3 g", tipo: "sim_nao", se: geo },
      { id: "esp", grupo: "Controle geométrico (8.2.1)", texto: "Espessura da camada granular", secao: "6.3 c, NOTA 3", tipo: "valor", unid: "cm", casas: 0, min: 30, falha: "ressalva",
        exigido: "conforme projeto; recomendado ≥ 30 cm", metodo: "nivelamento antes/depois" },
      { id: "cota", grupo: "Controle geométrico (8.2.1)", texto: "Desvio de cota da camada em relação ao projeto", secao: "8.2.1 a", tipo: "valor", unid: "cm", casas: 1, min: -10, max: 10,
        exigido: "± 10,0 cm (valores individuais)", metodo: "nivelamento", freq: { por: "extensao", a_cada: 10, pontos: true } },
      { id: "larg", grupo: "Controle geométrico (8.2.1)", texto: "Variação da largura da cava de remoção, por lado (medida − projeto)", secao: "8.2.1 b", tipo: "valor", unid: "cm", casas: 0,
        min: 0, max: 100, exigido: "0 a + 100 cm por lado (sem variação negativa)", metodo: "trena", freq: { por: "extensao", a_cada: 10, pontos: true } },
      { id: "dren", grupo: "Execução (5; 6.3; 8.2)", texto: "Cava drenada antes do lançamento (ou camada inerte ≥ 1,0 m acima do NA / estiva)", secao: "5 a–c", tipo: "sim_nao" },
      { id: "lanc", grupo: "Execução (5; 6.3; 8.2)", texto: "Lançamento em ponta de aterro com trator de esteira leve, sem compactação direta", secao: "5 d, g; 6.3 e", tipo: "sim_nao" },
      { id: "espal", grupo: "Execução (5; 6.3; 8.2)", texto: "Espalhamento e desempeno da camada; sem contaminação com lama (visual)", secao: "8.2", tipo: "sim_nao" },
      { id: "vazios", grupo: "Execução (5; 6.3; 8.2)", texto: "Vazios da superfície preenchidos com material de enchimento seco", secao: "6.3 f", tipo: "sim_nao",
        se: function (P) { return P.material === "rachao"; }, naoAplicaPor: "não é rachão/rocha" },
      { id: "regul", grupo: "Execução (5; 6.3; 8.2)", texto: "Camada de regularização com solo compactado acima da camada granular", secao: "6.3 h", tipo: "sim_nao" },
      { id: "amb", grupo: "Execução (5; 6.3; 8.2)", texto: "Condicionantes ambientais (proteção contra erosão, drenagem)", secao: "7", tipo: "sim_nao" },
    ],
    extra: function (ctx) {
      var P = ctx.P;
      if (!areia(P)) G7.freq(ctx, "gran", { exigido: 1, regra: "material não arenoso — 1 verificação por lote (adotado)" });
      else G7.freq(ctx, "gran", { por: "volume", a_cada: 1000, qtd: num(P.volume), regra: "mín. 1 a cada 1.000 m³ (8.1 a)" });
      G7.freqSecoes(ctx, "cota", 10, 3, "eixo e 2 pontos a cada 10 m — mín. 3 pontos por seção (8.2.1)");
      G7.freqSecoes(ctx, "larg", 10, 2, "LE e LD a cada 10 m (adotado — 8.2.1 manda medir à trena)");
      G7.freq(ctx, "esp", { exigido: 1, regra: "a ES não fixa — mín. 1 por lote (adotado)" });
      G7.ocultar(ctx, ["ea", "perm", "impur", "gtr", "gnom", "galo", "ggrab", "gpunc", "gperm", "ggram", "gaos", "gtransp"]);
      var l = ctx.item.larg;
      if (l && l.situacao === "nao_conforme" && P.nota6 === "sim" && !l.est.vals.some(function (p) { return p.v < 0; }))
        G7.abrandar(l, "ressalva", "alargamento da cava além de 1,0 m admitido com justificativa aprovada pela Fiscalização (NOTA 6) — anexar a justificativa");
      if (areia(P) && !ok(num(P.volume))) ctx.avisos.push("Informe o volume da camada (m³): os ensaios da areia são a cada 1.000 m³ (8.1).");
      ctx.avisos.push("O número e a frequência das determinações seguem o Plano de Amostragem aprovado (8.3, DNER-PRO 277): confira com o plano do contrato.");
    },
    notas: "Critérios da DNIT 441/2023-ES. EA avaliado com a estatística da 8.4 (k da Tabela A1); demais requisitos da Tabela 1 e da Tabela 2 por valor individual (1 ensaio/certificado por lote). " +
      "Cotas (± 10 cm) e largura da cava (+ 1,0 m por lado) por valor individual (\"variações individuais\", 8.2.1). Espessura < 30 cm é ressalva (NOTA 3 é recomendação). Gramatura \"300\" da Tabela 2 tratada como mínimo. " +
      "DNER-ME 054 → DNIT 450.",
    exemplos: [
      { nome: "Camada de areia aceita — 100 m, 1.800 m³, sem geotêxtil", dados: function () {
        var d = { ident: { registro: "CG-01", data: "2026-03-18", obra: "Obra A — BR-000", trecho: "Aterro sobre solo mole 1", local: "Est. 700 a 705", origem: "Areal 2" },
          params: { estIni: "700", estFim: "705", volume: "1800", material: "areia", geotextil: "nao", nota6: "nao" } };
        A.exemplos.importar(FE.FICHAS[ID].params, d, "imp_ea", [["dnit-450-2024-me", 0]]);
        d.ea[0].est = "701";
        d.ea.push({ est: "704", reg: "EA-0077 · DNIT 450 (digitado)", v: "78" });
        d.perm = [{ est: "701", reg: "Laboratório", v: "0,0120" }, { est: "704", reg: "Laboratório", v: "0,0085" }];
        d.esp = [{ est: "702", v: "60" }, { est: "704", v: "58" }];
        d.cota = []; d.larg = [];
        for (var i = 0; i <= 10; i++) {
          var e = A.fmtEstaca(14000 + i * 10);
          ["LE", "eixo", "LD"].forEach(function (p, j) { d.cota.push({ est: e, pos: p, reg: "Nivelamento", v: A.nstr([3.5, -4.2, 6.1, -1.8, 8.0][(i + j) % 5], 1) }); });
          d.larg.push({ est: e, pos: "LE", reg: "Trena", v: String([20, 45, 60, 30][i % 4]) });
          d.larg.push({ est: e, pos: "LD", reg: "Trena", v: String([35, 10, 80, 50][i % 4]) });
        }
        d.verificacoes = [{ atende: "S", real: "2" }, { atende: "S", real: "2" }, {}, { atende: "S" }, { atende: "S" }, { atende: "S", real: "2" }, {}, { atende: "S" }, { atende: "S" }];
        return d;
      } },
      { nome: "Camada de rachão com geotêxtil rejeitada — geotêxtil abaixo do tipo B e cota fora de ± 10 cm", dados: function () {
        var d = { ident: { registro: "CG-04", data: "2026-04-09", obra: "Obra B", trecho: "Aterro sobre solo mole 2", local: "Est. 850 a 853", origem: "Pedreira Y" },
          params: { estIni: "850", estFim: "853", volume: "900", material: "rachao", geotextil: "sim", tipoGeo: "B", nota6: "nao" } };
        d.gtr = [{ reg: "Certificado lote 1", v: "13,2" }]; d.gnom = [{ reg: "Ficha técnica", v: "55" }]; d.galo = [{ reg: "Certificado lote 1", v: "62" }];
        d.ggrab = [{ reg: "Certificado lote 1", v: "1010" }]; d.gpunc = [{ reg: "Certificado lote 1", v: "3,2" }]; d.gperm = [{ reg: "Certificado lote 1", v: "0,40" }];
        d.ggram = [{ reg: "Certificado lote 1", v: "300" }]; d.gaos = [{ reg: "Certificado lote 1", v: "0,12" }];
        d.esp = [{ est: "851", v: "80" }];
        d.cota = []; d.larg = [];
        for (var i = 0; i <= 6; i++) {
          var e = A.fmtEstaca(17000 + i * 10);
          ["LE", "eixo", "LD"].forEach(function (p, j) { d.cota.push({ est: e, pos: p, reg: "Nivelamento", v: A.nstr(i === 4 && j === 2 ? -12.5 : [5.0, -3.0, 7.5, 2.0][(i + j) % 4], 1) }); });
          d.larg.push({ est: e, pos: "LE", reg: "Trena", v: String([40, 70, 90][i % 3]) });
          d.larg.push({ est: e, pos: "LD", reg: "Trena", v: String([55, 30, 85][i % 3]) });
        }
        d.verificacoes = [{ atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }, { atende: "S" }];
        return d;
      } },
    ],
  });
})();
