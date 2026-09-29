/*
 * Ficha de ES: DNIT 032/2005-ES — Areia-asfalto a quente — ACEITAÇÃO DE LOTE.
 * Motor comum: FE.aceitacaoG3.criar (es-dnit-112-2009-es.js). Este arquivo também define FE.aceitacaoG3.familiaDNIT(o),
 * a base comum das ES do DNIT de 2005 com a mesma estrutura de inspeção (DNIT 032, 034 e, por remissão à DNIT 031-ES,
 * DNIT 033/2021): 7.1 insumos; 7.2.1 a–d usinagem (teor ± 0,3 %, granulometria na faixa de trabalho, temperaturas ± 5 °C,
 * Marshall); 7.2.2 GC 97–101 % a cada 700 m²; 7.3 espessura ± 5 %, alinhamentos ± 5 cm, réguas ≤ 0,5 cm, QI < 35,
 * segurança (VDR, HS); 7.4 tabela de amostragem variável; 7.5 conformidade X̄ ± k·s.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G3 = FE.aceitacaoG3, num = FE.num, ok = FE.ok, fmt = FE.fmt;

  function familiaDNIT(o) {
    var rev = o.revestimento || function () { return true; };
    var cfg = {
      estat: "dnit", secK: "7.4",
      refs: { reprova: "7.5", atende: "7.5", corrige: "7.5: todo detalhe incorreto deve ser corrigido", regra: "7.5" },
      secTeor: "7.2.1 a", secGran: "7.2.1 b", secTemp: "5.4.2, 5.4.3, 7.2.1 c, 7.2.2", secGC: "7.2.2", secEsp: "7.3 a", secGeo: "7.3 b, c",
      secAlin: "7.3 b", secRegua: "7.3 c", secChuva: "4", secIns: "7.1", secInsAceite: "7.1",
      phTLig: "107 a 177", dicaTLig: "5.4.2: viscosidade Saybolt-Furol da faixa indicada; entre 107 e 177 °C; ± 5 °C (7.2.1 c)",
      dicaUsina: "extrações de amostras da mistura (7.2.1 a); a ES não fixa a frequência (plano de amostragem, 7.4) — adotado no mínimo 1 por jornada de 8 h",
      freqTeor: function (L) { return { regra: "plano de amostragem (7.4) — adotado mín. 1 por jornada", exigido: ok(L.jor) ? L.jor : NaN }; },
      gc: function () {
        return { min: 97, max: 101, secao: "7.2.2, 7.5 a", exigido: "97 % a 101 % da densidade aparente de projeto",
          freq: function (L) { return { por: "area", a_cada: 700, qtd: L.area, regra: "1 a cada 700 m² de pista" }; } };
      },
      qi: { aplica: rev, secao: "7.3 c", estrito: true, exigido: "QI < 35 contagens/km" },
      seg: function (P) {
        if (!rev(P)) return null;
        return { secao: "7.3 d", itens: [
          { k: "hs", nome: "Altura de areia (HS)", unid: "mm", unidL: "mm", casas: 2, min: 0.6, max: 1.2, exigido: "0,60 mm ≤ HS ≤ 1,20 mm", metodo: "NF P-98-216-7" },
          { k: "vdr", nome: "Resistência à derrapagem — pêndulo britânico (VDR)", unid: "—", casas: 0, min: 45, exigido: "VDR ≥ 45", metodo: "ASTM E 303" }] };
      },
      temps: function (P) {
        var t = [];
        if (o.agregados) t.push({ k: "tagr", nome: "Agregados (descarga do secador)", secao: "5.4.3", lim: G3.tempAgregado(P, 177), exigido: "10 a 15 °C acima do ligante, ≤ 177 °C" });
        t.push({ k: "tlig", nome: "Ligante na usina", secao: "5.4.2, 7.2.1 c", lim: function () { return G3.faixaPM5(P, "tLig", o.morna && o.morna(P) ? NaN : 107, o.morna && o.morna(P) ? NaN : 177); },
          exigido: G3.txtPM5(P, "tLig", o.morna && o.morna(P) ? "mistura morna: temperatura do projeto" : "entre 107 e 177 °C") });
        t.push({ k: "tsai", nome: "Mistura na saída do misturador", secao: "7.2.1 c", lim: function () { return G3.faixaPM5(P, "tMist", NaN, NaN); }, exigido: G3.txtPM5(P, "tMist") });
        t.push({ k: "tesp", nome: "Mistura no espalhamento (início da compressão)", secao: "7.2.1 c, 7.2.2", lim: function () { return G3.faixaPM5(P, "tComp", NaN, NaN); }, exigido: G3.txtPM5(P, "tComp") });
        return t;
      },
      provRejeito: ["Os serviços só devem ser aceitos se atenderem às prescrições da ES; todo detalhe incorreto ou mal executado deve ser corrigido, e o serviço só é aceito se as correções o colocarem em conformidade — caso contrário, rejeitado (7.5).",
        "Registrar as não conformidades nos relatórios periódicos de acompanhamento e tratá-las conforme a DNIT 011/2004-PRO (7.5)."],
      provMedicao: "Nenhuma medição deve ser processada sem o relatório de controle da qualidade com os resultados interpretados (8 d).",
    };
    Object.keys(o).forEach(function (k) { cfg[k] = o[k]; });
    return cfg;
  }
  G3.familiaDNIT = familiaDNIT;

  // =====================================================================================
  var REV = function (P) { return (P.camada || "revestimento") === "revestimento"; };
  G3.criar(familiaDNIT({
    id: "dnit-032-2005-es", codigo: "DNIT 032/2005-ES",
    titulo: "Areia-asfalto a quente — aceitação de lote",
    resumo: "Reúne os ensaios do lote (importados das fichas ME ou digitados), confere a frequência e aplica os critérios da DNIT 032/2005-ES: teor de CAP ± 0,3 %, granulometria na faixa de trabalho, Vv, RBV, estabilidade e fluência (Marshall), temperaturas ± 5 °C, grau de compactação 97–101 % a cada 700 m², espessura ± 5 % em 10 medidas, alinhamentos, réguas, QI < 35 e condições de segurança — controle estatístico X̄ ± k·s (7.4, 7.5).",
    revestimento: REV, agregados: true,
    camadas: [["revestimento", "Revestimento"], ["base", "Base, regularização ou reforço"]],
    dicaCamada: "4: revestimento, base, regularização ou reforço; condições de segurança e QI verificados no revestimento",
    faixas: ["dnit-032-2005-es-A", "dnit-032-2005-es-B"], secFaixa: "5.2 (quadro)",
    teorFaixa: function (P, fx) { return fx ? { A: [6, 12], B: [7, 12] }[fx.faixa] : null; },
    dicaTeor: "quadro de 5.2: A 6–12 %, B 7–12 %; tolerância ± 0,3 % (7.2.1 a)",
    padrao: { camada: "revestimento" },
    marshall: function () {
      return { secao: "7.2.1 d, 5.2 a", dica: "médias de cada conjunto de 3 CPs Marshall (75 golpes), amostras coletadas na pista; 1 conjunto por jornada de 8 h",
        itens: [
          { k: "vv", nome: "Porcentagem de vazios", unid: "%", casas: 1, min: 3, max: 8, modo: "estat", secao: "5.2 a" },
          { k: "rbv", nome: "Relação betume/vazios", unid: "%", casas: 1, min: 65, max: 82, modo: "estat", secao: "5.2 a" },
          { k: "est", nome: "Estabilidade (75 golpes)", unid: "kgf", casas: 0, min: 300, modo: "estat", secao: "7.2.1 d, 5.2 a", obrig: true },
          { k: "flu", nome: "Fluência", unid: "mm", casas: 1, min: 2.0, max: 4.5, modo: "estat", secao: "5.2 a" },
        ],
        freq: function (L) { return { regra: "3 CPs por jornada de 8 h", exigido: ok(L.jor) ? L.jor : NaN }; } };
    },
    freqEsp: function (L, P, fGc) {
      var e = A.frequencia(Object.assign({ realizado: 0 }, fGc)).exigido;
      return { regra: "10 medidas sucessivas (7.3 a); ao menos as do GC", exigido: ok(e) ? Math.max(10, e) : 10 };
    },
    insumos: function (P, L) {
      return [
        ["pen", "CAP — penetração a 25 °C (por carregamento)", G3.porCarreg(L), "nao_conforme"],
        ["ful", "CAP — ponto de fulgor (por carregamento)", G3.porCarreg(L), "nao_conforme"],
        ["esp", "CAP — ensaio de espuma (por carregamento)", G3.porCarreg(L), "nao_conforme"],
        ["ist", "CAP — índice de suscetibilidade térmica (a cada 100 t)", G3.porMassa(L, 100), "nao_conforme"],
        ["vis", "CAP — viscosidade Saybolt-Furol, curva × temperatura (a cada 100 t)", G3.porMassa(L, 100), "nao_conforme"],
        ["gra", "Granulometria da areia de cada silo (por jornada)", ok(L.jor) ? L.silos * L.jor : NaN, "ressalva"],
        ["ea", "Equivalente de areia ≥ 55 % (plano de amostragem)", NaN, "ressalva"],
        ["fil", "Granulometria do fíler (plano de amostragem)", NaN, "ressalva"],
      ];
    },
    silos: true,
    notas: "Critérios da DNIT 032/2005-ES. Controle estatístico de 7.5 com a tabela de amostragem variável de 7.4 (n = 5: 1,55 … n = 21: 1,01): X̄ − k·s ≥ mínimo e/ou X̄ + k·s ≤ máximo (s com n − 1); n < 5: cada valor individual deve atender; estatística atendida com valor individual fora: ressalva (corrigir o local). " +
      "Faixa de trabalho = curva de projeto ± tolerâncias do quadro de 5.2, sem ultrapassar a faixa. GC = Gmb da pista / Gmb de projeto × 100 (densímetro: Gmb = densidade / 0,9971). Espessura: ± 5 % em 10 medidas sucessivas (mínimo de 10). VDR ≥ 45 e 0,6 ≤ HS ≤ 1,2 mm (a ES imprime \"VDR = 45\" e \"0,6 > HS > 1,2\"). QI = 13 × IRI quando só o IRI é informado. Frequência de extrações: a ES remete ao plano de amostragem (7.4); adotada 1 por jornada.",
    exemplos: [
      { nome: "Lote aceito — revestimento faixa A, 200 m (dados gerados)", dados: function () {
        var pens = [9.5, 4.75, 2.0, 0.42, 0.18, 0.075], proj = [100, 90, 76, 30, 9, 5];
        var gc = [98.6, 99.2, 98.1, 99.5, 98.8, 99.0, 98.4, 99.3, 98.9, 98.2], esp = [4.02, 3.96, 4.05, 3.98, 4.08, 4.01, 3.94, 4.03, 3.99, 4.06];
        return G3.montar({ ident: { registro: "LOTE-AAQ-003", data: "2026-08-20", obra: "Obra C", trecho: "Rua A", local: "Est. 0+00 a 10+00", camada: "Revestimento — areia-asfalto a quente, faixa A",
            origem: "Usina C", laboratorista: "Equipe de controle" },
          params: { estIni: "0+00", estFim: "10+00", largura: "7,00", pista: "pista única", camada: "revestimento", faixa: "dnit-032-2005-es-A", teorProj: "8,0", gmbProj: "2,215",
            espProj: "4,0", tLig: "150", tMist: "148", tComp: "140", dataIni: "2026-08-20", dataFim: "2026-08-20", jornadas: "1", massa: "124", nCarreg: "1", massaLig: "10", nSilos: "2",
            chuva: "nao", tAmb: "26", impUsina: [], impMar: [], impPista: [] },
          pens: pens, proj: proj, teores: [8.12], pref: "EXT-0820", data: "20/08/2026",
          mar: [{ reg: "MAR-0820", data: "20/08/2026", teor: "8,10", gmb: "2,221", vv: "5,4", rbv: "76,0", est: "455", flu: "3,1", ncp: "3" }],
          temp: [{ carga: "07h20", tagr: "162", tlig: "150", tsai: "147", tesp: "141" }, { carga: "11h40", tagr: "163", tlig: "151", tsai: "149", tesp: "138" }],
          estIni: "0+00", passoGC: 20, gc: gc, esp: esp, gmbRef: 2.215, nGeo: 11,
          sup: [{ est: "0+00 a 10+00", qi: "29", hs: "0,62", vdr: "54" }],
          ins: [[1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [2, 0], [1, 0], [1, 0]],
          obs: "Dados gerados para demonstração (areia-asfalto a quente, CAP 50/70)." });
      } },
      { nome: "Lote rejeitado — faixa B, 300 m: GC abaixo de 97 %, fluência alta e teor fora (dados gerados)", dados: function () {
        var pens = [4.75, 2.0, 0.42, 0.18, 0.075], proj = [100, 94, 62, 24, 5];
        var gc = [96.2, 97.1, 95.8, 96.6, 97.4, 96.0, 95.5, 96.9, 97.0, 96.3], esp = [3.72, 3.81, 3.66, 3.90, 3.77, 3.69, 3.84, 3.75, 3.70, 3.79];
        return G3.montar({ ident: { registro: "LOTE-AAQ-011", data: "2026-09-03", obra: "Obra D", trecho: "Rua B", local: "Est. 30+00 a 45+00", camada: "Revestimento — areia-asfalto a quente, faixa B",
            origem: "Usina C", laboratorista: "Equipe de controle" },
          params: { estIni: "30+00", estFim: "45+00", largura: "6,00", pista: "pista única", camada: "revestimento", faixa: "dnit-032-2005-es-B", teorProj: "8,5", gmbProj: "2,190",
            espProj: "4,0", tLig: "150", tMist: "148", tComp: "140", dataIni: "2026-09-02", dataFim: "2026-09-03", jornadas: "2", massa: "160", nCarreg: "1", massaLig: "13", nSilos: "2",
            chuva: "nao", tAmb: "23", impUsina: [], impMar: [], impPista: [] },
          pens: pens, proj: proj, teores: [8.61, 8.92], porJ: 1, pref: "EXT-0902", data: "02/09/2026",
          mar: [{ reg: "MAR-0902", data: "02/09/2026", teor: "8,6", gmb: "2,185", vv: "4,9", rbv: "79,0", est: "360", flu: "4,8", ncp: "3" },
            { reg: "MAR-0903", data: "03/09/2026", teor: "8,9", gmb: "2,181", vv: "4,2", rbv: "81,5", est: "335", flu: "5,1", ncp: "3" }],
          temp: [{ carga: "02/09 07h30", tagr: "163", tlig: "150", tsai: "149", tesp: "139" }, { carga: "03/09 07h40", tagr: "161", tlig: "149", tsai: "147", tesp: "141" }],
          estIni: "30+00", passoGC: 30, gc: gc, esp: esp, gmbRef: 2.190, nGeo: 16,
          sup: [{ est: "30+00 a 45+00", qi: "33", hs: "0,58", vdr: "47" }],
          ins: [[1, 0], [1, 0], [1, 0], [1, 0], [1, 0], [4, 0], [1, 0], [1, 0]],
          obs: "Dados gerados para demonstração. Extração do 2º dia com 8,92 % (projeto 8,5 ± 0,3). Espessuras abaixo de 3,80 cm em vários pontos." });
      } },
    ],
  }));
})();
