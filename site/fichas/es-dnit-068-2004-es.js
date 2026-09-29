/*
 * Ficha de ES: DNIT 068/2004-ES — Camada superposta de concreto tipo Whitetopping por meio mecânico — aceitação do trecho.
 * Resistência (7.3.2.2: fctMk,est = fctMj − k·s ou fck,est = fcj − k·s, Tabela 1 de Student; 6 exemplares por trecho de até
 * 2.500 m²), consistência (abatimento, ou VeBe nas fôrmas deslizantes — 5.2.4 / 7.2.1), geometria (7.3.1), coeficiente de
 * recalque sobre o pavimento flexível existente (5.4.1), insumos e execução (seção 5).
 * Usa FE.aceitacaoG6 (definida em es-dnit-047-2004-es.js).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, G = FE.aceitacaoG6, num = FE.num, ok = FE.ok, sn = G.sn;
  var ID = "dnit-068-2004-es";
  function desl(P) { return P.equip === "deslizante"; }
  function vebe(P) { return desl(P) && P.consist === "vebe"; }
  var TROCA = {
    dos: sn("dos", "Dosagem: C ≥ 320 kg/m³; a/c conforme a ES do equipamento (047/048/049); Dmáx ≤ 1/3 da espessura e ≤ 50 mm; ar ≤ 5 % (NBR 11686); exsudação ≤ 1,5 %", "5.2.2 a 5.2.7", "Concreto", "estudo de dosagem"),
    formas: sn("formas", "Fôrmas (trilho / pequeno porte): apoio contínuo com argamassa, sem calço transversal; erros ≤ 3 mm na vertical e ≤ 5 mm no alinhamento; fundo de caixa verificado com gabarito", "5.4.2", "Execução",
      "ponteiros a cada 1 m", "ressalva", function (P) { return !desl(P); }),
    fundo: sn("fundo", "Película (papel, plástico ou pintura betuminosa) sobre o pavimento existente, tiras sobrepostas ≥ 10 cm, intacta até o lançamento", "5.4.2; 5.1.8", "Execução", "sobreposição ≥ 10 cm"),
    pel: sn("reparo", "Pavimento flexível existente reparado (panelas, fissuras, desplacamentos) e subleito refeito onde houve falta de suporte ou bombeamento", "5.4.1", "Pavimento existente", "antes da concretagem", "nao_conforme"),
    tempo: sn("tempo", "Tempo entre a mistura e o lançamento ≤ 30 min (≤ 90 min em caminhão-betoneira com agitação); sem redosagem", "5.4.3", "Execução", "≤ 30 / 90 min"),
    regua: sn("regua", "Régua de 3 m sobre o concreto recém-acabado, em toda a largura: variações ≤ 5 mm", "5.4.4.1", "Execução", "≤ 5 mm"),
    acab: sn("acab", "Acabamento final com ranhuras (lona ou vassoura de náilon), contínuas e uniformes", "5.4.5", "Execução", "ranhuras contínuas"),
    ident: sn("ident", "Placas identificadas (número impresso em um canto)", "5.4.6", "Execução", "todas as placas"),
    juntas: sn("juntas", "Juntas nas posições de projeto, desvio de alinhamento ≤ 5 mm", "5.4.7", "Juntas", "\"não se permitindo\" desvio > 5 mm", "nao_conforme"),
    corte: sn("corte", "Juntas serradas entre 6 h e 48 h após a concretagem; juntas de construção nas interrupções > 30 min", "5.4.7.2; 5.4.7.3", "Juntas", "plano de corte"),
    barras: sn("barras", "Barras de transferência lisas, metade + 2 cm engraxada; desvio ≤ ± 1 % e ≤ ± 0,7 % em 2/3 das barras de cada junta", "5.4.7.5; 5.4.7.6", "Juntas", "tolerâncias de alinhamento", "nao_conforme"),
    tela: sn("tela", "Tela soldada: 5 cm da superfície, até meia altura, 5 cm dos bordos", "5.4.8", "Execução", "conforme projeto"),
    cura: sn("cura", "Cura de 7 dias: química 0,35 a 0,50 l/m² nas primeiras ~24 h; depois cobertura (sobreposição ≥ 10 cm, reposição ≤ 30 min)", "5.4.9", "Execução", "7 dias"),
    selag: sn("selag", "Selagem de juntas limpas e secas, sem transbordamento, penetração de projeto", "5.4.10", "Juntas", "profundidade de projeto"),
    desm: sn("desm", "Desmoldagem após 12 h (máx. 24 h), sem esborcinar cantos", "5.4.11", "Execução", "12 h a 24 h", "ressalva", function (P) { return !desl(P); }),
  };
  G.fichaConcreto({
    id: ID, codigo: "DNIT 068/2004-ES", variante: "068",
    titulo: "Whitetopping (camada superposta de concreto) — aceitação do trecho",
    resumo: "Trecho de inspeção de até 2.500 m²: resistência característica estimada (fctMk,est = fctMj − k·s ou fck,est, Tabela 1), consistência (abatimento ou VeBe), " +
      "coeficiente de recalque sobre o pavimento flexível existente, largura e espessura (7.3.1), insumos e verificações de execução da seção 5.",
    txtHomog: "Sim — pavimento flexível em bom estado: a cada 200 m",
    paramsAntes: [{ k: "equip", r: "Equipamento de execução (5.3.3)", tipo: "select", recarrega: true,
      opcoes: [["pequeno", "Pequeno porte (DNIT 047)"], ["trilho", "Fôrma-trilho (DNIT 048)"], ["deslizante", "Fôrmas deslizantes (DNIT 049)"]] },
    { k: "consist", r: "Consistência (5.2.4; 7.2.1)", tipo: "select", recarrega: true, opcoes: [["abat", "Abatimento do tronco de cone"], ["vebe", "Consistômetro VeBe (fôrmas deslizantes)"]],
      se: function (d) { return desl(d.params || {}); } },
    { k: "abMin", r: "Abatimento mínimo (mm)", ph: "60", dica: "DNIT 047/048: 70 ± 10 mm; DNIT 049: ≤ 60 mm", se: function (d) { return !vebe(d.params || {}); } },
    { k: "abMax", r: "Abatimento máximo (mm)", ph: "80", se: function (d) { return !vebe(d.params || {}); } },
    { k: "vbMin", r: "Grau VeBe mínimo de projeto (s)", se: function (d) { return vebe(d.params || {}); } },
    { k: "vbMax", r: "Grau VeBe máximo de projeto (s)", se: function (d) { return vebe(d.params || {}); } }],
    padrao: { equip: "pequeno", consist: "abat", abMin: "60", abMax: "80" },
    res: { secao: "7.3.2.2", secAuto: "7.3.2.3", secMold: "7.2.2.2", secSup: "7.3.2.4", secaoExig: "7.2.2.1",
      provNC: "Revisar o projeto com a espessura média e a resistência estimada (7.3.1); se não aceito: aproveitamento com restrições, reforço, ou demolição e reconstrução (7.3.2.4)." },
    geo: { secao: "7.3.1", secLarg: "7.3.1 a", secEsp: "7.3.1 b", secMed: "8", base: "pavimento existente",
      provEsp: "Revisar o projeto adotando a espessura média e a resistência estimada (7.3.1); se não aceito: decisões da 7.3.2.4." },
    ajustar: function (crit) {
      var out = [];
      crit.forEach(function (it) {
        if (it.id === "nota063" || it.id === "equip") return;
        if (it.id === "abat") {
          it.secao = "5.2.4; 7.2.1"; it.min = function (P) { return num(P.abMin); }; it.max = function (P) { return num(P.abMax); };
          it.exigido = undefined; it.se = function (P) { return !vebe(P); };
          out.push(it);
          out.push({ id: "vebe", texto: "Consistência VeBe", secao: "5.2.4; 7.2.1", grupo: "Controle da produção", tipo: "valor", unid: "s", casas: 1, falha: "ressalva", metodo: "DNIT 064-ME",
            min: function (P) { return num(P.vbMin); }, max: function (P) { return num(P.vbMax); }, se: vebe,
            importar: { de: "dnit-064-2004-me", valores: function (e) { return ((e.resultados || {}).det || []).filter(function (x) { return ok(x.vebe) && x.signif; }).map(function (x) { return { v: x.vebe, rot: x.nome }; }); } },
            freq: { por: "contagem", qtd: "amassadas", a_cada: 1 }, freqG: it.freqG });
          return;
        }
        if (it.id === "krec") { it.secao = "5.4.1"; it.grupo = "Pavimento existente"; }
        if (it.id === "aco") it.secao = "5.1.5";
        out.push(TROCA[it.id] || it);
      });
      out.push(sn("equip", "Equipamento inspecionado e aprovado pela Fiscalização", "4.3", "Execução", "vistoria aprovada"));
      return out;
    },
    notas: "Critérios da DNIT 068/2004-ES. Resistência (7.3.2.2): fctMk,est = fctMj − k·s ≥ fctM,k (ou fck,est = fcj − k·s ≥ fck), idade j de projeto, exemplar = maior de 2 CPs, mín. 6 exemplares por trecho de até 2.500 m²; " +
      "k da Tabela 1 (Student): " + G.STUDENT_TXT + " (n não tabelado: k do n inferior). Sem aceitação automática: ≥ 6 CPs extraídos (7.3.2.4). Geometria (7.3.1): largura com variação < ± 10 %; espessura média ≥ projeto e " +
      "(maior − menor) ≤ 1 cm. Consistência: abatimento conforme a ES do equipamento (DNIT 047/048: 70 ± 10 mm) ou VeBe nas fôrmas deslizantes (faixa de projeto). A 7.3.2.3 da ES escreve \"fctM,est ≥ fctMj\": " +
      "adotado fctMk,est ≥ fctM,k (valor de projeto), coerente com as DNIT 047/048/049. Exigências da seção 5 não atendidas = ressalva, salvo proibições expressas.",
    exemplos: [
      { nome: "Trecho aceito — fôrmas deslizantes, VeBe (importado da DNIT 064), flexão com 10 exemplares", dados: function () {
        var F = FE.FICHAS[ID];
        var d = { ident: { registro: "LOTE-WT-001", data: "2026-05-12", obra: "Obra B — Rua A", trecho: "Trecho de inspeção 1", local: "Est. 0 a 15", camada: "Whitetopping 15 cm sobre CBUQ existente" },
          params: Object.assign({}, F.padrao, { equip: "deslizante", consist: "vebe", vbMin: "10", vbMax: "20", estIni: "0", estFim: "15", largura: "7,00", largProj: "7,00", espProj: "15",
            fctmk: "4,5", amassadas: "6", kProj: "60" }),
          verificacoes: [], res: [], vebe: [{}], krec: [{}], agua: [{}], sel: [{}] };
        d.res = [[5.05, 4.92], [5.21, 5.10], [4.98, 5.14], [5.30, 5.18], [5.12, 4.99], [4.95, 5.07], [5.26, 5.33], [5.08, 4.97], [5.17, 5.02], [5.00, 5.11]]
          .map(function (x, i) { return { est: String(1 + i), reg: "CP-WT-" + (10 + i), idade: "28", cp1: A.nstr(x[0], 2), cp2: A.nstr(x[1], 2) }; });
        A.exemplos.importar(F.params, d, "imp_vebe", [["dnit-064-2004-me", 0]]);
        d.vebe = d.vebe.concat([{ reg: "Betonada 3", v: "15,5" }, { reg: "Betonada 4", v: "13,0" }, { reg: "Betonada 5", v: "16,5" }, { reg: "Betonada 6", v: "14,0" }]);
        d.krec = [["2", "eixo", 72], ["7", "BE", 68], ["13", "BD", 75]].map(function (x) { return { est: x[0], pos: x[1], reg: "PC sobre CBUQ", v: String(x[2]) }; });
        A.exemplos.importar(F.params, d, "impAgua", [["dnit-036-2004-me", 0], ["dnit-037-2004-me", 0]]);
        A.exemplos.importar(F.params, d, "impSel", [["dnit-039-2004-me", 0], ["dnit-040-2004-me", 0]]);
        d.verificacoes = G.verifEx(F);
        d.geo = G.exSecoes(0, [[7.02, 15.3, 15.1, 15.4], [7.01, 15.2, 15.0, 15.5], [7.00, 15.4, 15.2, 15.3], [7.03, 15.1, 15.0, 15.2], [7.02, 15.5, 15.3, 15.6],
          [7.00, 15.2, 15.1, 15.4], [7.01, 15.3, 15.2, 15.5], [7.02, 15.0, 15.1, 15.3], [7.01, 15.4, 15.2, 15.2], [7.03, 15.3, 15.4, 15.5], [7.00, 15.2, 15.1, 15.3],
          [7.02, 15.3, 15.1, 15.2], [7.01, 15.4, 15.3, 15.5], [7.00, 15.1, 15.0, 15.3], [7.02, 15.2, 15.2, 15.4], [7.01, 15.3, 15.1, 15.5]]);
        return d;
      } },
      { nome: "Trecho rejeitado — água reprovada, recalque abaixo do projeto, película e reparo do existente não conformes", dados: function () {
        var F = FE.FICHAS[ID];
        var d = { ident: { registro: "LOTE-WT-002", data: "2026-05-26", obra: "Obra B — Rua A", trecho: "Trecho de inspeção 2", local: "Est. 15 a 25", camada: "Whitetopping 15 cm" },
          params: Object.assign({}, F.padrao, { equip: "pequeno", estIni: "15", estFim: "25", largura: "7,00", largProj: "7,00", espProj: "15", resTipo: "compressao", fck: "30", amassadas: "8", kProj: "60" }),
          verificacoes: [], res: [], abat: [], krec: [], agua: [{}], sel: [{}] };
        d.res = [[33.2, 32.5], [31.8, 32.9], [34.1, 33.0], [32.4, 31.6], [33.7, 34.5], [31.9, 32.8], [33.0, 33.9]]
          .map(function (x, i) { return { est: String(16 + i), reg: "CP-WT-" + (40 + i), idade: "28", cp1: A.nstr(x[0], 1), cp2: A.nstr(x[1], 1) }; });
        d.abat = [72, 68, 70, 75, 66, 71, 73, 69].map(function (v, i) { return { reg: "amassada " + (i + 1), v: String(v) }; });
        d.krec = [["17", "eixo", 64], ["22", "BD", 51]].map(function (x) { return { est: x[0], pos: x[1], reg: "PC sobre CBUQ", v: String(x[2]) }; });
        A.exemplos.importar(F.params, d, "impAgua", [["dnit-036-2004-me", 1], ["dnit-037-2004-me", 1]]);
        A.exemplos.importar(F.params, d, "impSel", [["dnit-039-2004-me", 0]]);
        d.verificacoes = G.verifEx(F, { reparo: { real: "4", nc: "1", obs: "panela não reparada na estaca 21" }, fundo: { real: "5", nc: "1", obs: "plástico rasgado na estaca 19" } });
        d.geo = G.exSecoes(15, [[7.01, 15.3, 15.2, 15.4], [7.02, 15.2, 15.1, 15.5], [7.00, 15.4, 15.2, 15.3], [7.01, 15.1, 15.0, 15.2], [7.03, 15.5, 15.3, 15.6],
          [7.00, 15.2, 15.1, 15.4], [7.02, 15.3, 15.2, 15.5], [7.01, 15.0, 15.1, 15.3], [7.02, 15.4, 15.2, 15.2], [7.03, 15.3, 15.4, 15.5], [7.01, 15.2, 15.1, 15.3]]);
        d.obs = "Exemplo: água de açude fora dos limites da 5.1.3 e comparativo DNIT 037 não satisfatório; k = 51 MPa/m na estaca 22 (< 60 de projeto).";
        return d;
      } },
    ],
  });
})();
