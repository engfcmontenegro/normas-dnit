/*
 * Ficha de ACEITAÇÃO DE LOTE: DNIT 145/2012-ES — Pintura de ligação com ligante asfáltico.
 * Motor comum do grupo: FE.aceitacaoG4a (site/fichas/es-dnit-144-2014-es.js).
 *   5.1 a  ligante: emulsão RR-1C (DNER-EM 369/97), diluída 1:1 com água (5.1 b)
 *   5.1 b  taxa residual recomendada 0,3 a 0,4 l/m²; taxa da emulsão diluída da ordem de 0,8 a 1,0 l/m²
 *   5.3 f  tolerância da taxa T da emulsão diluída: ± 0,2 l/m²
 *   7.1    todo carregamento: Saybolt-Furol a 50 °C, resíduo por evaporação, peneiramento, carga da partícula; 100 t: sedimentação
 *          e Saybolt-Furol a várias temperaturas
 *   7.2.1  temperatura no distribuidor; 7.2.2 taxa T por bandejas (TR após ruptura total); b) até 4.000 m² → mín. 5; c) 4.000 a
 *          20.000 m² → plano de amostragem variável (7.4, DNER-PRO 277/97)
 *   7.3    homogeneidade da aplicação e ruptura do ligante (visual); 7.5 X̄ ± k·s (k "tabelado" — adotada a Tabela 1 da DNER-PRO 277/97)
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG4a, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  if (!G) { if (window.console) console.error("es-dnit-145-2012-es.js: carregue antes site/fichas/es-dnit-144-2014-es.js (motor FE.aceitacaoG4a)."); return; }
  var V = G.verif;

  G.criar({
    id: "dnit-145-2012-es", codigo: "DNIT 145/2012-ES",
    titulo: "Pintura de ligação — aceitação de lote",
    resumo: "Reúne as taxas da emulsão diluída por bandeja (importadas da ficha de taxa ou digitadas), a taxa residual, o recebimento dos carregamentos de RR-1C, as temperaturas e as verificações; " +
      "aplica o controle estatístico da taxa T (projeto ± 0,2 l/m², 5.3 f e 7.5) com o k da DNER-PRO 277/97 e confere a frequência (7.2.2 b, c).",
    refs: { reprova: "7.5 a", atende: "7.5 b", corrige: "7.5", regra: "7.5", tabela: "Tabela 1 da DNER-PRO 277/97" },
    secConf: "7.5", secPlano: "7.4", secLig: "5.1 a", secTaxa: "7.2.2 a", secTemp: "7.2.1", secReceb: "7.1 a", secReceb100: "7.1 b",
    servicos: ["145"],
    ligantes: [
      { id: "rr1c", nome: "Emulsão RR-1C (DNER-EM 369/97), diluída 1:1", classes: ["RR-1C"], taxaLig: ["rr1c"], resMin: 62,
        ens: [["sf50|sf25", "viscosidade Saybolt-Furol (7.1 a pede a 50 °C)"], ["residuo", "resíduo por evaporação"], ["pen084", "peneiramento"], ["carga", "carga da partícula"]] },
    ],
    recebFichas: ["dnit-165-2013-em"], nomeResiduo: "resíduo por evaporação",
    residual: { rec: [0.3, 0.4], sec: "5.1 b" },
    nomeLig: function () { return "Pintura de ligação"; },
    nomeTaxaLig: function () { return "taxa T da emulsão diluída"; },
    limLig: function (P) {
      var pj = num(P.projL), o = { sec: "5.3 f / 7.5", min: ok(pj) ? pj - 0.2 : NaN, max: ok(pj) ? pj + 0.2 : NaN };
      o.txt = ok(pj) ? fmt(pj - 0.2, 2) + " a " + fmt(pj + 0.2, 2) + " l/m² (projeto " + fmt(pj, 2) + " ± 0,2)" : "projeto ± 0,2 l/m²";
      if (ok(pj) && (pj < 0.8 || pj > 1.0)) o.avisos = ["Taxa de projeto da emulsão diluída de " + fmt(pj, 2) + " l/m², fora da ordem de 0,8 a 1,0 l/m² (5.1 b)."];
      return o;
    },
    params: [{ k: "projL", r: "Taxa T de projeto da emulsão diluída 1:1 (l/m²)", ph: "ex.: 0,90", dica: "da ordem de 0,8 a 1,0 l/m² (5.1 b); tolerância ± 0,2 l/m² (5.3 f)" }],
    freqTaxa: { tipo: "4000", sec: "7.2.2 b", secPlano: "7.2.2 c e 7.4" },
    verif: [
      { id: "clima", texto: "Condições para distribuir o ligante: temperatura ambiente ≥ 10 °C, sem chuva, superfície sem excesso de umidade", secao: "4 a", exigido: "atendidas em todas as aplicações" },
      { id: "cert", texto: "Certificado do fabricante/distribuidor em cada carregamento", secao: "4 b", exigido: "certificado com os ensaios de caracterização" },
      { id: "visual", texto: "Homogeneidade da aplicação e ruptura do ligante (inspeção visual)", secao: "7.3", exigido: "sem falhas; falhas corrigidas (5.3 h)" },
      { id: "e100", texto: "Ensaios a cada 100 t: sedimentação e Saybolt-Furol a várias temperaturas", secao: "7.1 b", exigido: "1 conjunto a cada 100 t",
        freq: function (P) { var t = num(P.ton); return { exigido: ok(t) ? A.nMin(t, 100) : NaN, regra: "1 a cada 100 t" }; }, metodo: "DNER-ME 006 / DNER-ME 004" },
    ],
    notas: "Taxa T por bandeja (7.2.2 a): TR = (P₂ − P₁)/A com a bandeja pesada após a ruptura total; T da emulsão diluída obtida pelo resíduo do carregamento (ficha de taxa por bandeja). " +
      "Aceitação: T de projeto ± 0,2 l/m² (5.3 f) com o controle estatístico de 7.5; a taxa residual de 0,3 a 0,4 l/m² (5.1 b) é recomendação — fora dela, ressalva. " +
      "Frequência: até 4.000 m² — mínimo de 5 determinações (7.2.2 b); de 4.000 a 20.000 m² — plano de amostragem variável aprovado (7.2.2 c, 7.4). " +
      "A 7.1 a pede a viscosidade Saybolt-Furol a 50 °C, mas a EM da RR-1C a especifica a 25 °C: aceita-se qualquer das duas como ensaio realizado.",
    padrao: { ligante: "rr1c", nCarreg: "1", nAplic: "1" },
    exemplos: [
      { nome: "Lote aceito — pintura de ligação com RR-1C, 7 bandejas em 3.500 m²", importar: [["impReceb", [["dnit-165-2013-em", 2]]]],
        dados: function () {
          var t = [[81, "LE", 0.86, 0.29], [83, "eixo", 0.93, 0.31], [85, "LD", 0.97, 0.33], [88, "LE", 0.89, 0.30], [91, "eixo", 0.95, 0.32], [94, "LD", 0.88, 0.30], [97, "eixo", 0.92, 0.31]];
          var lig = G.bandejas(t.map(function (x) { return [x[0], x[1], x[2]]; }));
          lig.forEach(function (c, i) { c.res = fmt(t[i][3], 2); });
          return { ident: { registro: "LOTE-PL-001", data: "2026-04-14", obra: "Obra A — BR-000", trecho: "Pista direita", local: "Est. 80 a 100", camada: "Pintura de ligação — RR-1C" },
            params: { estIni: "80", estFim: "100", largura: "8,75", projL: "0,90", tMin: "20", tMax: "50", nAplic: "2", nCarreg: "1", ton: "5" },
            lig1: lig, temp: [{ est: "80", t: "35" }, { est: "90", t: "38" }], verif: V(["S", "S", "S", ["S", 1, 0]]),
            obs: "Taxas calculadas na ficha de taxa por bandeja (bandeja pesada após a ruptura; resíduo do carregamento de 63,7 %)." };
        } },
      { nome: "Lote rejeitado — RR-2C diluída (não admitida), taxa baixa e carregamento reprovado", importar: [["impTaxa", [["dnit-144-2014-es", 1]]], ["impReceb", [["dnit-165-2013-em", 0]]]],
        dados: function () {
          return { ident: { registro: "LOTE-PL-002", data: "2026-01-28", obra: "Obra A", trecho: "Rua B", local: "Est. 0 a 4", camada: "Pintura de ligação" },
            params: { estIni: "0", estFim: "4", largura: "7,00", projL: "0,80", tMin: "20", tMax: "50", nCarreg: "1", ton: "2" },
            temp: [{ est: "0", t: "" }], verif: V(["S", "S", ["N", 1, 1, "faixas sem ligante junto ao meio-fio"], ""]),
            obs: "Taxas das bandejas importadas do exemplo da ficha de taxa (planilha de 28/01/2026: RR-2C diluída, sem resíduo registrado)." };
        } },
    ],
  });
})();
