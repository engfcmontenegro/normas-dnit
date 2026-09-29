/*
 * Ficha de CONTROLE DE REPAROS: DNIT 154/2010-ES — Recuperação de defeitos em pavimentos asfálticos (áreas restritas):
 * recuperação em áreas degradadas (caixas), remendos superficiais e remendos profundos.
 *
 * O que a ES manda (seções do PDF):
 *   4    reparos em áreas nitidamente diferenciadas; camadas comprometidas removidas; c) sangrias (≈ 0,50 m de largura,
 *        profundidade da base) onde houver água aprisionada.   5.1.2 Tabela 1 — granulometria recomendada da brita das
 *        sangrias.   5.1.1 brita graduada (DNIT 139/141); 5.1.3 CM-30 / DNIT 144 e 145; 5.1.4 PMF (DNIT 153) ou CA (DNIT 031).
 *   5.3.1 caixas: a) quadriláteros; b) paredes 8 (V) : 1 (H); c) saídas de drenagem; d) compactação de ≥ 15 cm do
 *        remanescente a 100 % da massa específica aparente seca máxima "referida no ensaio DNER-ME 037"; e) brita graduada
 *        em camadas de no máximo 15 cm; f) imprimação com CM-30; g) mistura asfáltica até o nível do pavimento;
 *        h) pintura de ligação do reforço só após ≥ 10 dias de tráfego; i) destinação CONAMA 307; j) caixa aberta
 *        sinalizada e preenchida em até 3 dias.
 *   5.3.2 remendos superficiais: b) capa selante só com trincas ≤ 3 mm; c)/d) bordas verticais e limpeza; e) emulsão RR
 *        a 0,5 l/m² (aumentar se as fendas absorverem mais); f) agregado entre 3/8" e nº 10 (recomendado); g) rolo
 *        pneumático; h) tráfego só após a ruptura; i) trincas > 3 mm: mistura a quente.
 *   5.3.3 remendos profundos: b) corte ≥ 30 cm além da parte afetada, bordas verticais; c) pintura de ligação nas faces,
 *        imprimação do fundo granular; d)/e) mistura densa a quente (ou a frio com emulsão RM), compactada.
 *   7.1  insumos pelas ES de cada camada.  7.2 a) controle visual; c) camadas de até 15 cm compactadas.  7.3 inspeção
 *        visual do comportamento sob o tráfego.   A ES não tem seção de conformidade nem frequências.
 * Fichas de origem (importarVarios): DNER-ME 037 (citada na ES) e DNIT 458 (grau de compactação).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var ID = "dnit-154-2010-es";
  function caixa(P) { return P.servico === "caixa"; }
  function sup(P) { return P.servico === "superficial"; }
  function prof(P) { return P.servico === "profundo"; }
  function selante(P) { return sup(P) && P.tecnicaSup !== "quente"; }
  // Tabela 1 (5.1.2, PDF p. 4): [mm, peneira, mín., máx.] — % passando
  var TAB1 = [[38.1, "1 ½\"", 100, 100], [25.4, "1\"", 75, 100], [19.1, "3/4\"", 25, 80], [12.7, "1/2\"", 0, 15], [9.5, "3/8\"", 0, 5], [4.8, "nº 4", 0, 0]];
  function kp(mm) { return "p" + String(mm).replace(".", "_"); }
  var NA = { caixa: "só na recuperação em áreas degradadas (caixas)", sup: "só nos remendos superficiais", sel: "só na capa selante (trincas ≤ 3 mm)",
    quente: "só no remendo superficial com mistura a quente", prof: "só nos remendos profundos" };
  var GG = "Condições gerais e materiais (4 / 5.1 / 7.1)", GK = "Áreas degradadas — caixas (5.3.1)", GS = "Remendos superficiais (5.3.2)",
    GP = "Remendos profundos (5.3.3)", GV = "Verificação do produto e meio ambiente (6 / 7.3)";

  var CRIT = [
    { id: "c0", texto: "Reparo restrito a área nitidamente diferenciada; camadas comprometidas removidas", secao: "4 a / b", tipo: "sim_nao", grupo: GG },
    { id: "sang", texto: "Sangrias transversais (≈ 0,50 m de largura, profundidade da base) onde há água aprisionada", secao: "4 c", tipo: "sim_nao", grupo: GG,
      se: function (P) { return P.agua === "sim"; }, naoAplicaPor: "sem água subterrânea aprisionada" },
    { id: "mat", texto: "Insumos controlados pelas ES das camadas (brita graduada DNIT 139/141, ligantes DNIT 144/145, PMF DNIT 153 ou CA DNIT 031)", secao: "5.1 / 7.1 / 7.2 b", tipo: "sim_nao", grupo: GG },
    // caixas
    { id: "k1", texto: "Perímetros demarcados em quadriláteros", secao: "5.3.1 a", tipo: "sim_nao", grupo: GK, se: caixa, naoAplicaPor: NA.caixa },
    { id: "k2", texto: "Revestimento cortado no perímetro; paredes da caixa com declividade 8 (V) : 1 (H)", secao: "5.3.1 b", tipo: "sim_nao", grupo: GK, se: caixa, naoAplicaPor: NA.caixa },
    { id: "k3", texto: "Caixas com saídas ligadas à drenagem (ou sangrias)", secao: "5.3.1 c", tipo: "sim_nao", grupo: GK, se: caixa, naoAplicaPor: NA.caixa },
    { id: "gc", texto: "Grau de compactação do remanescente (≥ 15 cm)", secao: "5.3.1 d", tipo: "valor", unid: "%", casas: 1, min: 100, grupo: GK,
      metodo: "DNER-ME 037", se: caixa, naoAplicaPor: NA.caixa,
      importar: { de: ["dner-me-037-94", "dnit-458-2025-me"], valores: function (e) {
        return ((e.resultados || {}).furos || []).map(function (f) { return { v: f.GC, est: f.estaca || "", pos: f.posicao || "" }; });
      } } },
    { id: "cam", texto: "Espessura das camadas de brita graduada / material de enchimento", secao: "5.3.1 e / 7.2 c", tipo: "valor", unid: "cm", casas: 1, max: 15, grupo: GK,
      se: function (P) { return caixa(P) || prof(P); }, naoAplicaPor: "só em caixas e remendos profundos" },
    { id: "k4", texto: "Superfície da brita imprimada com CM-30", secao: "5.3.1 f", tipo: "sim_nao", grupo: GK, se: caixa, naoAplicaPor: NA.caixa },
    { id: "k5", texto: "Caixa completada com mistura asfáltica até o nível do pavimento existente", secao: "5.3.1 g / 5.1.4", tipo: "sim_nao", grupo: GK, se: caixa, naoAplicaPor: NA.caixa },
    { id: "dias", texto: "Exposição ao tráfego antes da pintura de ligação do reforço", secao: "5.3.1 h", tipo: "valor", unid: "dias", casas: 0, min: 10, grupo: GK,
      se: function (P) { return caixa(P) && P.reforco === "sim"; }, naoAplicaPor: "só se houver reforço asfáltico sobre os reparos" },
    { id: "k6", texto: "Material removido destinado conforme a Resolução CONAMA 307 (art. 10, I)", secao: "5.3.1 i", tipo: "sim_nao", grupo: GK,
      se: function (P) { return caixa(P) || prof(P); }, naoAplicaPor: "só em caixas e remendos profundos" },
    { id: "aberta", texto: "Caixa aberta: prazo até o preenchimento (sinalizada, sem exposição ao tráfego)", secao: "5.3.1 j", tipo: "valor", unid: "dias", casas: 0, max: 3, grupo: GK,
      se: caixa, naoAplicaPor: NA.caixa },
    // remendos superficiais
    { id: "trinca", texto: "Largura das trincas seladas com capa selante", secao: "5.3.2 b / i", tipo: "valor", unid: "mm", casas: 1, max: 3, grupo: GS, se: selante, naoAplicaPor: NA.sel },
    { id: "s1", texto: "Vala de corte com bordas verticais; área varrida e limpa", secao: "5.3.2 c / d", tipo: "sim_nao", grupo: GS, se: sup, naoAplicaPor: NA.sup },
    { id: "taxa", texto: "Taxa de emulsão de ruptura rápida", secao: "5.3.2 e", tipo: "valor", unid: "l/m²", casas: 2, min: 0.5, grupo: GS, se: selante, naoAplicaPor: NA.sel },
    { id: "s2", texto: "Agregado de cobertura entre 3/8\" e nº 10, espalhado logo após a emulsão (recomendado)", secao: "5.3.2 f", tipo: "sim_nao", grupo: GS, falha: "ressalva",
      se: selante, naoAplicaPor: NA.sel },
    { id: "s3", texto: "Compressão com rolo pneumático (ou pneus do caminhão)", secao: "5.3.2 g", tipo: "sim_nao", grupo: GS, se: selante, naoAplicaPor: NA.sel },
    { id: "s4", texto: "Tráfego liberado só após a ruptura da emulsão", secao: "5.3.2 h", tipo: "sim_nao", grupo: GS, se: selante, naoAplicaPor: NA.sel },
    { id: "s5", texto: "Mistura asfáltica a quente nas trincas com mais de 3 mm", secao: "5.3.2 i", tipo: "sim_nao", grupo: GS,
      se: function (P) { return sup(P) && P.tecnicaSup === "quente"; }, naoAplicaPor: NA.quente },
    // remendos profundos
    { id: "corte", texto: "Extensão do corte além da parte afetada", secao: "5.3.3 b", tipo: "valor", unid: "cm", casas: 0, min: 30, grupo: GP, se: prof, naoAplicaPor: NA.prof },
    { id: "p1", texto: "Material removido até a profundidade necessária; bordas verticais", secao: "5.3.3 a / b", tipo: "sim_nao", grupo: GP, se: prof, naoAplicaPor: NA.prof },
    { id: "p2", texto: "Pintura de ligação nas faces (emulsão RR); fundo granular limpo e imprimado", secao: "5.3.3 c", tipo: "sim_nao", grupo: GP, se: prof, naoAplicaPor: NA.prof },
    { id: "p3", texto: "Mistura densa a quente (ou a frio com emulsão RM) espalhada sem desagregar e compactada", secao: "5.3.3 d / e", tipo: "sim_nao", grupo: GP, se: prof, naoAplicaPor: NA.prof },
    // verificação
    { id: "v1", texto: "Inspeção visual: comportamento do reparo sob o tráfego (sem depressões, desagregação ou exsudação)", secao: "7.2 a / 7.3", tipo: "sim_nao", grupo: GV },
    { id: "amb", texto: "Condicionantes ambientais (DNIT 070-PRO, CONAMA 307)", secao: "6", tipo: "sim_nao", grupo: GV },
  ];
  function ver(m) { return CRIT.filter(function (c) { return c.tipo === "sim_nao"; }).map(function (c) { return m[c.id] || {}; }); }

  var F = A.fichaSimples({
    id: ID, registrar: false,
    titulo: "Recuperação de defeitos em pavimentos asfálticos — controle dos reparos (DNIT 154/2010-ES)",
    resumo: "Verificações da execução de caixas (5.3.1), remendos superficiais (5.3.2) e profundos (5.3.3), com grau de compactação do remanescente ≥ 100 %, camadas ≤ 15 cm, prazos (3 e 10 dias), trincas ≤ 3 mm para capa selante, taxa de emulsão ≥ 0,5 l/m², corte ≥ 30 cm e a granulometria recomendada das sangrias (Tabela 1).",
    rotuloLink: "Controle dos reparos",
    lote: { largura: true },
    params: [
      { k: "servico", r: "Tipo de reparo", tipo: "select", recarrega: true,
        opcoes: [["caixa", "Recuperação em áreas degradadas — caixas (5.3.1)"], ["superficial", "Remendo superficial (5.3.2)"], ["profundo", "Remendo profundo (5.3.3)"]] },
      { k: "tecnicaSup", r: "Remendo superficial — técnica", tipo: "select", recarrega: true, se: function (d) { return sup((d && d.params) || {}); },
        opcoes: [["selante", "Capa selante (trincas ≤ 3 mm)"], ["quente", "Mistura asfáltica a quente (trincas > 3 mm)"]] },
      { k: "agua", r: "Água subterrânea aprisionada (sangrias, 4 c)?", tipo: "select", recarrega: true, opcoes: [["nao", "Não"], ["sim", "Sim"]] },
      { k: "reforco", r: "Haverá reforço asfáltico sobre os reparos (5.3.1 h)?", tipo: "select", recarrega: true, opcoes: [["nao", "Não"], ["sim", "Sim"]] },
      { k: "nReparos", r: "Número de reparos no lote", ph: "ex.: 12" },
      { k: "areaReparos", r: "Área total dos reparos (m²)", ph: "caixas + sangrias", dica: "8 a / c / d: medição por área × espessura média" },
    ],
    padrao: { servico: "caixa", tecnicaSup: "selante", agua: "nao", reforco: "nao" },
    criterios: CRIT,
    extra: function (ctx) {
      var d = ctx.d, P = ctx.P;
      if (P.agua !== "sim") return;
      // Tabela 1 (5.1.2): "recomenda-se" → fora da faixa é ressalva
      var cols = (d.granSang || []).filter(function (c) { return TAB1.some(function (t) { return ok(num(c[kp(t[0])])); }); });
      var l = A.linha({ id: "granSang", grupo: GG, criterio: "Granulometria da brita das sangrias", secao: "5.1.2 (Tabela 1)", n: cols.length,
        exigido: TAB1.map(function (t) { return t[1] + ": " + (t[2] === t[3] ? t[2] : t[2] + "–" + t[3]); }).join("; ") + " % passando (recomendada)" });
      if (!cols.length) { A.marcar(l, "ressalva", "granulometria da brita das sangrias não informada (Tabela 1 é recomendação)"); l.resultado = "—"; }
      else {
        var fora = [];
        cols.forEach(function (c, i) {
          TAB1.forEach(function (t) {
            var v = num(c[kp(t[0])]);
            if (ok(v) && (v < t[2] - 1e-9 || v > t[3] + 1e-9)) fora.push((c.id || "amostra " + (i + 1)) + " — " + t[1] + ": " + fmt(v, 0) + " % (" + t[2] + "–" + t[3] + ")");
          });
        });
        l.resultado = cols.length + " amostra(s)" + (fora.length ? "; " + fora.length + " peneira(s) fora" : "; todas as peneiras na faixa");
        if (fora.length) A.marcar(l, "ressalva", "fora da granulometria recomendada: " + fora.join("; "));
        else l.motivo = "dentro da Tabela 1";
      }
      ctx.linhas.splice(2, 0, l);
    },
    textos: {
      ACEITO: { titulo: "REPAROS CONFORMES", texto: "Execução e verificação visual conforme a DNIT 154/2010-ES." },
      RESSALVA: { titulo: "REPAROS CONFORMES COM RESSALVA", texto: "Nenhuma exigência descumprida, mas há recomendações não seguidas ou pontos a documentar." },
      PENDENTE: { titulo: "CONTROLE INCOMPLETO", texto: "Faltam verificações ou medidas: complete o controle antes de aceitar os reparos." },
      REJEITADO: { titulo: "REPAROS NÃO CONFORMES", texto: "Há exigência da ES não atendida: corrigir o(s) reparo(s) (a ES não tem seção de conformidade; adota-se o critério geral das ES do DNIT)." },
    },
    notas: "DNIT 154/2010-ES: condições gerais 4, materiais 5.1 (Tabela 1 recomendada para a brita das sangrias), execução 5.3.1 a 5.3.3, controle 7.2 " +
      "(visual; camadas de até 15 cm) e verificação visual 7.3. A ES não tem seção de condições de conformidade (embora o Resumo a anuncie) nem frequência: " +
      "cada verificação ≥ 1 por lote e o grau de compactação ≥ 100 % em cada determinação. 5.3.1 d) refere a massa específica máxima \"ao ensaio DNER-ME 037\", " +
      "que é o ensaio in situ (óleo): o grau de compactação é a massa in situ (DNER-ME 037 ou DNIT 458) sobre a máxima do ensaio de compactação.",
    exemplos: [
      { nome: "Caixas com sangrias — GC importado da DNER-ME 037 (conforme)", dados: function () {
        var d = { ident: { registro: "REP-154-01", data: "2025-06-10", obra: "Obra A", trecho: "BR-000 — est. 18 a 30", camada: "Recuperação localizada — caixas" },
          params: { servico: "caixa", agua: "sim", reforco: "nao", estIni: "18", estFim: "30", largura: "7,00", nReparos: "3", areaReparos: "46" },
          verificacoes: ver({ c0: { atende: "S" }, sang: { atende: "S", real: "2" }, mat: { atende: "S" }, k1: { atende: "S", real: "3" }, k2: { atende: "S", real: "3" },
            k3: { atende: "S", real: "3" }, k4: { atende: "S" }, k5: { atende: "S", real: "3" }, k6: { atende: "S" }, v1: { atende: "S", real: "3" }, amb: { atende: "S" } }),
          cam: [{ est: "20", pos: "caixa 1", v: "14" }, { est: "24", pos: "caixa 2", v: "12" }, { est: "28", pos: "caixa 3", v: "15" }],
          aberta: [{ est: "20", pos: "caixa 1", v: "1" }, { est: "24", pos: "caixa 2", v: "2" }, { est: "28", pos: "caixa 3", v: "2" }],
          granSang: [{ id: "sangria 1", p38_1: "100", p25_4: "88", p19_1: "52", p12_7: "9", p9_5: "3", p4_8: "0" }] };
        A.exemplos.importar(F.params, d, "imp_gc", [["dner-me-037-94", 0]]);
        return d;
      } },
      { nome: "Caixas com remanescente mal compactado e caixa aberta 5 dias (não conforme)", dados: function () {
        var d = { ident: { registro: "REP-154-02", data: "2025-06-24", obra: "Obra B", trecho: "Rua B — est. 0 a 10", camada: "Recuperação localizada — caixas" },
          params: { servico: "caixa", agua: "sim", reforco: "sim", estIni: "0", estFim: "10", largura: "6,00", nReparos: "3", areaReparos: "31" },
          verificacoes: ver({ c0: { atende: "S" }, sang: { atende: "S" }, mat: { atende: "S" }, k1: { atende: "S" }, k2: { atende: "S" }, k3: { atende: "S" }, k4: { atende: "S" },
            k5: { atende: "S" }, k6: { atende: "S" }, v1: { atende: "S" }, amb: { atende: "S" } }),
          cam: [{ est: "3", pos: "caixa 1", v: "15" }, { est: "6", pos: "caixa 2", v: "14" }, { est: "9", pos: "caixa 3", v: "13" }],
          dias: [{ pos: "caixas 1 a 3", v: "12" }],
          aberta: [{ est: "3", pos: "caixa 1", v: "2" }, { est: "6", pos: "caixa 2", v: "5" }, { est: "9", pos: "caixa 3", v: "3" }],
          granSang: [{ id: "sangria 1", p38_1: "100", p25_4: "97", p19_1: "86", p12_7: "18", p9_5: "4", p4_8: "0" }] };
        A.exemplos.importar(F.params, d, "imp_gc", [["dner-me-037-94", 1]]);
        return d;
      } },
    ],
  });
  // tabela extra: granulometria da brita das sangrias (Tabela 1), só com água aprisionada
  var tab0 = F.tabelas;
  F.tabelas = function (d) {
    var T = tab0(d), P = d.params || {};
    if (P.agua === "sim") T.push({ chave: "granSang", titulo: "Granulometria da brita das sangrias (5.1.2, Tabela 1 — recomendada)", rotulo: "Amostra", iniciais: 1, min: 1,
      dica: "% em peso passando; faixa recomendada entre parênteses",
      linhas: [{ k: "id", r: "Amostra / sangria", texto: true }].concat(TAB1.map(function (t) {
        return { k: kp(t[0]), r: t[1] + " (" + fmt(t[0], 1) + " mm) — " + (t[2] === t[3] ? t[2] : t[2] + " a " + t[3]), u: "%" };
      })) });
    return T;
  };
  FE.FICHAS[ID] = F;
})();
