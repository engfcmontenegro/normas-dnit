/*
 * Ficha: DNIT 062/2004-PRO — Pavimento rígido — Avaliação objetiva (ICP).
 * Registra-se no motor de site/fichas.js (window.FE).
 * Uma coluna por defeito registrado na Ficha de Inspeção (amostra, tipo 1 a 18, grau de severidade, nº de placas
 * afetadas). Densidade = placas afetadas / placas da amostra; valor deduzível pelas curvas do Anexo A, item 6
 * (digitalizadas das figuras da norma, interpolação linear); selagem de juntas pela tabela de 6.5 (2, 4, 8 pontos).
 * VDC pelo gráfico do item 7 (curvas q = 1 a 6, digitalizadas); ICP = 100 − VDC; ICP do trecho pela média ou pela
 * fórmula das amostras adicionais (Anexo A, 3); conceito pelo Anexo B; desvio-padrão e número mínimo de amostras (seção 6).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;

  var TIPOS = [[1, "Alçamento de placas"], [2, "Fissura de canto"], [3, "Placa dividida (rompida)"], [4, "Escalonamento ou degrau"], [5, "Defeito na selagem das juntas"],
    [6, "Desnível pavimento-acostamento"], [7, "Fissuras lineares"], [8, "Grandes reparos (> 0,45 m²)"], [9, "Pequenos reparos (≤ 0,45 m²)"], [10, "Desgaste superficial"],
    [11, "Bombeamento"], [12, "Quebras localizadas"], [13, "Passagem de nível"], [14, "Rendilhado e escamação"], [15, "Fissuras de retração plástica"],
    [16, "Esborcinamento ou quebra de canto"], [17, "Esborcinamento de juntas"], [18, "Placa bailarina"]];
  // Curvas do Anexo A, item 6: [densidade %, valor deduzível] por grau de severidade (U = curva única)
  var CURVAS = {
    1: {"A":[[0,0],[2,13.9],[4,28.5],[6,38.9],[8,47.4],[10,55.1],[15,65.2],[20,71.7],[25,76.6],[30,80.8],[40,87.9],[50,93.9],[60,99.6]],"M":[[0,0],[2,3.4],[4,6.7],[6,9.9],[8,12.9],[10,15.9],[15,22.9],[20,29.3],[25,35.2],[30,40.9],[40,50.6],[50,58.8],[60,65.7],[70,71.5],[80,76.1],[90,79.8],[100,82.6]],"B":[[0,0],[2,1.6],[4,3.1],[6,4.7],[8,6.1],[10,7.5],[15,10.9],[20,14.1],[25,17.2],[30,20.0],[40,25.1],[50,29.6],[60,33.5],[70,36.9],[80,39.8],[90,42.2],[100,44.3]]},
    2: {"A":[[0,0],[2,5.4],[4,10.2],[6,14.7],[8,18.8],[10,22.7],[15,31.3],[20,38.5],[25,44.7],[30,49.9],[40,58.2],[50,64.5],[60,69.1],[70,72.7],[80,75.2],[90,77.0],[100,78.3]],"M":[[0,0],[2,4.0],[4,7.8],[6,11.2],[8,14.3],[10,17.3],[15,24.0],[20,29.6],[25,34.5],[30,38.9],[40,45.9],[50,51.3],[60,55.5],[70,58.6],[80,60.7],[90,62.2],[100,62.9]],"B":[[0,0],[2,1.9],[4,3.8],[6,5.6],[8,7.3],[10,8.9],[15,13.0],[20,16.6],[25,20.0],[30,23.2],[40,28.8],[50,33.8],[60,38.1],[70,41.8],[80,44.9],[90,47.6],[100,49.8]]},
    3: {"A":[[0,0],[2,10.4],[4,17.6],[6,23.1],[8,27.5],[10,31.5],[15,39.9],[20,46.5],[25,52.1],[30,56.9],[40,65.0],[50,71.4],[60,76.8],[70,81.3],[80,85.2],[90,88.6],[100,91.6]],"M":[[0,0],[2,3.9],[4,7.4],[6,10.8],[8,13.9],[10,16.8],[15,23.5],[20,29.4],[25,34.6],[30,39.4],[40,47.6],[50,54.3],[60,60.0],[70,64.7],[80,68.7],[90,72.1],[100,74.9]],"B":[[0,0],[2,2.4],[4,4.6],[6,6.8],[8,8.8],[10,10.7],[15,15.2],[20,19.2],[25,22.9],[30,26.1],[40,31.7],[50,36.4],[60,40.2],[70,43.3],[80,45.8],[90,47.7],[100,49.2]]},
    4: {"A":[[0,0],[2,3.8],[4,7.2],[6,10.4],[8,13.4],[10,16.2],[15,22.8],[20,28.7],[25,34.0],[30,38.9],[40,47.7],[50,55.5],[60,62.3],[70,68.5],[80,74.1],[90,79.2],[100,84.0]],"M":[[0,0],[2,1.7],[4,3.5],[6,5.2],[8,6.8],[10,8.5],[15,12.4],[20,16.1],[25,19.8],[30,23.1],[40,29.4],[50,35.1],[60,40.1],[70,44.5],[80,48.2],[90,51.4],[100,53.8]],"B":[[0,0],[2,0.5],[4,1.1],[6,1.8],[8,2.4],[10,3.1],[15,5.2],[20,7.4],[25,9.8],[30,12.1],[40,16.8],[50,20.9],[60,24.3],[70,26.8],[80,28.6],[90,29.7],[100,30.0]]},
    6: {"A":[[0,0],[2,1.9],[4,3.6],[6,5.3],[8,6.8],[10,8.2],[15,11.5],[20,14.4],[25,16.9],[30,19.1],[40,22.8],[50,25.8],[60,28.1],[70,29.9],[80,31.3],[90,32.2],[100,32.9]],"M":[[0,0],[2,0.8],[4,1.6],[6,2.4],[8,3.2],[10,4.0],[15,5.8],[20,7.5],[25,9.0],[30,10.4],[40,12.9],[50,15.0],[60,16.7],[70,18.0],[80,19.0],[90,19.7],[100,20.0]],"B":[[0,0],[2,0.2],[4,0.4],[6,0.5],[8,0.6],[10,0.7],[15,1.0],[20,1.3],[25,1.6],[30,1.9],[40,2.5],[50,3.0],[60,3.4],[70,3.9],[80,4.2],[90,4.5],[100,4.9]]},
    7: {"A":[[0,0],[2,4.9],[4,8.9],[6,12.4],[8,15.5],[10,18.3],[15,24.3],[20,29.3],[25,33.7],[30,37.5],[40,43.8],[50,49.0],[60,53.2],[70,56.9],[80,59.9],[90,62.6],[100,65.0]],"M":[[0,0],[2,1.8],[4,3.5],[6,5.1],[8,6.6],[10,8.0],[15,11.3],[20,14.3],[25,16.9],[30,19.3],[40,23.4],[50,26.9],[60,29.7],[70,32.0],[80,34.0],[90,35.6],[100,36.8]],"B":[[0,0],[2,1.3],[4,2.4],[6,3.5],[8,4.5],[10,5.4],[15,7.6],[20,9.4],[25,11.0],[30,12.4],[40,14.8],[50,16.7],[60,18.2],[70,19.4],[80,20.4],[90,21.0],[100,21.6]]},
    8: {"A":[[0,0],[2,4.8],[4,8.7],[6,12.1],[8,15.2],[10,18.0],[15,24.2],[20,29.3],[25,33.8],[30,37.8],[40,44.6],[50,50.2],[60,54.9],[70,59.0],[80,62.4],[90,65.4],[100,67.9]],"M":[[0,0],[2,1.1],[4,2.3],[6,3.7],[8,5.1],[10,6.5],[15,10.3],[20,13.8],[25,17.1],[30,20.3],[40,26.0],[50,30.9],[60,35.3],[70,39.1],[80,42.5],[90,45.4],[100,48.0]],"B":[[0,0],[2,0.6],[4,1.3],[6,1.9],[8,2.6],[10,3.3],[15,5.2],[20,7.1],[25,9.1],[30,11.0],[40,14.8],[50,18.1],[60,21.0],[70,23.2],[80,25.0],[90,26.5],[100,27.7]]},
    9: {"A":[[0,0],[2,1.0],[4,2.4],[6,3.5],[8,4.5],[10,5.6],[15,7.8],[20,9.8],[25,11.5],[30,13.1],[40,15.8],[50,18.1],[60,19.9],[70,21.6],[80,22.9],[90,24.1],[100,25.0]],"M":[[0,0],[2,1.0],[4,1.4],[6,2.0],[8,2.5],[10,3.1],[15,4.3],[20,5.4],[25,6.4],[30,7.4],[40,9.1],[50,10.5],[60,11.7],[70,12.7],[80,13.6],[90,14.2],[100,14.8]],"B":[[16.1,0],[20,0.6],[25,1.0],[30,1.4],[40,2.2],[50,2.8],[60,3.3],[70,3.7],[80,4.0],[90,4.3],[100,4.3]]},
    10: {"U":[[0,0],[2,0.4],[4,0.8],[6,1.2],[8,1.6],[10,2.0],[15,3.0],[20,3.9],[25,4.6],[30,5.4],[40,6.7],[50,7.8],[60,8.7],[70,9.3],[80,9.8],[90,10.0],[100,10.0]]},
    11: {"U":[[0,0],[2,1.3],[4,2.6],[6,3.9],[8,5.1],[10,6.3],[15,9.1],[20,11.7],[25,14.2],[30,16.5],[40,20.7],[50,24.4],[60,27.6],[70,30.6],[80,33.1],[90,35.3],[100,37.4]]},
    12: {"A":[[0,0],[2,8.5],[4,15.6],[6,21.4],[8,26.3],[10,30.7],[15,40.1],[20,47.5],[25,53.6],[30,58.7],[40,66.8],[50,72.9],[60,77.4],[70,80.9],[80,83.4],[90,85.4],[100,86.6]],"M":[[0,0],[2,6.1],[4,11.3],[6,15.7],[8,19.7],[10,23.1],[15,30.6],[20,36.7],[25,41.7],[30,45.9],[40,52.8],[50,58.0],[60,62.1],[70,65.3],[80,67.9],[90,70.1],[100,71.8]],"B":[[0,0],[2,3.1],[4,5.8],[6,8.4],[8,10.7],[10,13.0],[15,17.9],[20,22.2],[25,26.0],[30,29.4],[40,35.1],[50,40.1],[60,44.2],[70,47.6],[80,50.6],[90,53.1],[100,55.2]]},
    13: {"A":[[0,0],[2,27.2],[4,37.5],[6,44.3],[8,49.7],[10,54.2],[15,62.9],[20,69.6],[25,74.8],[30,79.0],[40,85.6],[50,90.5],[60,94.3]],"M":[[0,0],[2,4.5],[4,8.4],[6,11.8],[8,14.9],[10,17.7],[15,23.7],[20,28.8],[25,32.9],[30,36.6],[40,42.2],[50,46.4],[60,49.6]],"B":[[0,0],[2,2.1],[4,3.9],[6,5.6],[8,7.2],[10,8.6],[15,11.8],[20,14.6],[25,17.1],[30,19.3],[40,23.1],[50,26.4],[60,29.3]]},
    14: {"A":[[0,0],[2,3.9],[4,7.3],[6,10.4],[8,13.1],[10,15.8],[15,21.4],[20,26.3],[25,30.6],[30,34.3],[40,41.0],[50,46.4],[60,51.2],[70,55.2],[80,58.9],[90,62.2],[100,65.1]],"M":[[0,0],[2,2.5],[4,4.5],[6,6.2],[8,7.7],[10,9.0],[15,11.8],[20,14.1],[25,16.1],[30,17.8],[40,20.6],[50,22.9],[60,24.8],[70,26.4],[80,27.7],[90,28.9],[100,30.0]],"B":[[0,0],[2,0.4],[4,0.9],[6,1.3],[8,1.7],[10,2.1],[15,3.1],[20,3.9],[25,4.8],[30,5.5],[40,6.7],[50,7.8],[60,8.5],[70,9.2],[80,9.6],[90,9.9],[100,9.9]]},
    15: {"U":[[16.4,0],[20,0.7],[25,1.2],[30,1.6],[40,2.4],[50,3.0],[60,3.4],[70,3.7],[80,4.0],[90,4.2],[100,4.3]]},
    16: {"A":[[0,0],[2,1.7],[4,3.2],[6,4.7],[8,6.0],[10,7.3],[15,10.1],[20,12.8],[25,15.1],[30,17.2],[40,20.8],[50,23.7],[60,25.9],[70,27.6],[80,28.8],[90,29.5],[100,30.0]],"M":[[0,0],[2,1.0],[4,1.9],[6,2.8],[8,3.7],[10,4.6],[15,6.7],[20,8.6],[25,10.4],[30,12.0],[40,14.9],[50,17.3],[60,19.3],[70,20.8],[80,21.9],[90,22.6],[100,23.0]],"B":[[0,0],[2,0.4],[4,0.7],[6,1.2],[8,1.6],[10,1.9],[15,2.9],[20,3.9],[25,4.8],[30,5.7],[40,7.3],[50,9.0],[60,10.4],[70,11.7],[80,12.9],[90,13.9],[100,14.6]]},
    17: {"A":[[0,0],[2,1.9],[4,3.5],[6,5.0],[8,6.6],[10,8.0],[15,11.7],[20,15.2],[25,18.5],[30,21.7],[40,27.8],[50,33.5],[60,38.9],[70,43.9],[80,48.6],[90,53.1],[100,57.4]],"M":[[0,0],[2,0.6],[4,1.5],[6,2.1],[8,2.8],[10,3.5],[15,5.2],[20,6.9],[25,8.4],[30,9.9],[40,12.7],[50,15.3],[60,17.7],[70,19.9],[80,21.8],[90,23.5],[100,24.9]],"B":[[0,0],[2,0.6],[4,1.0],[6,1.5],[8,1.9],[10,2.4],[15,3.4],[20,4.5],[25,5.4],[30,6.3],[40,7.9],[50,9.2],[60,10.3],[70,11.1],[80,11.5],[90,11.7],[100,11.7]]},
    18: {"A":[[0,0],[2,3.8],[4,7.2],[6,10.4],[8,13.4],[10,16.2],[15,22.8],[20,28.7],[25,34.0],[30,38.9],[40,47.7],[50,55.5],[60,62.3],[70,68.5],[80,74.1],[90,79.2],[100,84.0]],"M":[[0,0],[2,1.7],[4,3.5],[6,5.2],[8,6.8],[10,8.5],[15,12.4],[20,16.1],[25,19.8],[30,23.1],[40,29.4],[50,35.1],[60,40.1],[70,44.5],[80,48.2],[90,51.4],[100,53.8]],"B":[[0,0],[2,0.5],[4,1.1],[6,1.8],[8,2.4],[10,3.1],[15,5.2],[20,7.4],[25,9.8],[30,12.1],[40,16.8],[50,20.9],[60,24.3],[70,26.8],[80,28.6],[90,29.7],[100,30.0]]}
  };
  var SELAGEM = { B: 2, M: 4, A: 8 };  // 6.5
  // Item 7 — valor deduzível corrigido: [VDT, VDC] por q (digitalizado; início de cada curva conforme o gráfico)
  var CDV = {
    1: [[0, 0], [5, 5.7], [10, 10.8], [15, 15.7], [20, 20.8], [25, 25.6], [30, 30.5], [35, 35.3], [40, 40], [45, 44.9], [50, 49.6], [55, 54.5], [60, 59.2], [65, 64], [70, 68.9], [75, 73.8], [80, 79], [85, 84.1], [90, 89.3], [95, 94.8], [100, 100]],
    2: [[11.5, 8.5], [15, 10.8], [20, 15.1], [25, 19.1], [30, 23.2], [35, 27], [40, 30.7], [45, 34.5], [50, 38], [55, 41.5], [60, 44.9], [65, 48.3], [70, 51.7], [75, 54.8], [80, 58], [85, 61], [90, 63.9], [95, 66.9], [100, 69.8], [105, 72.7], [110, 75.4], [115, 78.2], [120, 80.9], [125, 83.4], [130, 86], [135, 88.5], [140, 91], [145, 93.4], [150, 95.7], [155, 98], [160, 100]],
    3: [[16.5, 8.7], [20, 11], [25, 14.8], [30, 18.5], [35, 21.9], [40, 25.2], [45, 28.7], [50, 31.8], [55, 35], [60, 38], [65, 41], [70, 44.1], [75, 47], [80, 50], [85, 52.8], [90, 55.5], [95, 58.3], [100, 61], [105, 63.8], [110, 66.4], [115, 69.1], [120, 71.8], [125, 74.3], [130, 76.9], [135, 79.4], [140, 81.9], [145, 84.4], [150, 86.8], [155, 89.2], [160, 91.5], [165, 93.9], [170, 96.2], [175, 98.3], [180, 100]],
    4: [[24, 12], [25, 12.4], [30, 15.8], [35, 18.9], [40, 22.1], [45, 25.1], [50, 28.1], [55, 31.1], [60, 33.8], [65, 36.5], [70, 39.4], [75, 42], [80, 44.8], [85, 47.3], [90, 49.9], [95, 52.5], [100, 55], [105, 57.6], [110, 60], [115, 62.5], [120, 65], [125, 67.3], [130, 69.8], [135, 72.1], [140, 74.4], [145, 76.7], [150, 78.9], [155, 81.2], [160, 83.4], [165, 85.6], [170, 87.7], [175, 89.9], [180, 91.9], [185, 93.9], [190, 95.9], [195, 97.8], [200, 99.4]],
    5: [[36, 16], [40, 18.3], [45, 21.5], [50, 24.4], [55, 27.4], [60, 30.1], [65, 32.8], [70, 35.5], [75, 38], [80, 40.7], [85, 43.2], [90, 45.6], [95, 48.1], [100, 50.5], [105, 53], [110, 55.3], [115, 57.6], [120, 60], [125, 62.3], [130, 64.6], [135, 66.9], [140, 69.1], [145, 71.3], [150, 73.6], [155, 75.7], [160, 77.9], [165, 80.1], [170, 82.2], [175, 84.2], [180, 86.4], [185, 88.4], [190, 90.4], [195, 92.2], [200, 93.9]],
    6: [[54, 23], [55, 23.1], [60, 25.9], [65, 28.6], [70, 31.1], [75, 33.6], [80, 36], [85, 38.4], [90, 40.5], [95, 42.9], [100, 45], [105, 47.3], [110, 49.4], [115, 51.7], [120, 53.7], [125, 55.8], [130, 57.9], [135, 60], [140, 62], [145, 64], [150, 66], [155, 68.1], [160, 70.1], [165, 72.1], [170, 74], [175, 75.9], [180, 77.9], [185, 79.8], [190, 81.7], [195, 83.6], [200, 85.4]],
  };
  // interpolação linear; fora: {v, fora: "abaixo"|"acima"}
  function interp(pts, x) {
    if (x < pts[0][0]) return { v: NaN, fora: "abaixo" };
    if (x > pts[pts.length - 1][0]) return { v: pts[pts.length - 1][1], fora: "acima" };
    for (var i = 1; i < pts.length; i++) if (x <= pts[i][0]) {
      var a = pts[i - 1], b = pts[i];
      return { v: a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]) };
    }
    return { v: pts[pts.length - 1][1] };
  }
  function vdc(tdv, q) {
    var qq = Math.min(6, Math.max(1, q)), c = CDV[qq], r = interp(c, tdv);
    if (qq === 1) r = { v: Math.min(tdv, 100) };  // q = 1: a curva do item 7 é a reta VDC = VDT
    if (r.fora === "abaixo") {  // extrapolação linear pelo início da curva
      var a = c[0], b = c[1]; r = { v: Math.max(0, a[1] + (b[1] - a[1]) * (tdv - a[0]) / (b[0] - a[0])), fora: "abaixo" };
    }
    if (r.v > 100) r.v = 100;
    r.q = qq;
    return r;
  }
  var CONCEITOS = [[85, "Excelente"], [70, "Muito bom"], [55, "Bom"], [40, "Razoável"], [25, "Ruim"], [10, "Muito ruim"], [0, "Destruído"]];
  function conceito(icp) { if (!ok(icp)) return ""; for (var i = 0; i < CONCEITOS.length; i++) if (icp >= CONCEITOS[i][0]) return CONCEITOS[i][1]; return "Destruído"; }
  function desvio(v) { var m = media(v); return v.length > 1 ? Math.sqrt(v.reduce(function (a, x) { return a + (x - m) * (x - m); }, 0) / (v.length - 1)) : NaN; }
  function nomeTipo(t) { var x = TIPOS.filter(function (y) { return y[0] === t; })[0]; return x ? x[1] : "tipo " + t; }

  FE.FICHAS["dnit-062-2004-pro"] = {
    titulo: "Pavimento rígido — avaliação objetiva (ICP)",
    rotuloImportar: function (r) { return "ICP " + (ok(r.icpT) ? fmt(r.icpT, 0) + " — " + r.conceitoT : "—"); },
    resumo: "Defeitos por amostra (tipo, severidade, placas afetadas), densidade, valores deduzíveis (curvas do Anexo A, digitalizadas), VDC pelo gráfico do item 7, ICP = 100 − VDC, ICP do trecho, conceito (Anexo B) e número mínimo de amostras (seção 6).",
    blocos: [],
    params: [
      { k: "placas", r: "Placas por amostra (padrão)", ph: "20", dica: "a densidade é calculada sobre o total de placas da amostra — de preferência 20" },
      { k: "dim", r: "Medida da placa (m)", ph: "3,8 × 6,0" },
      { k: "insp", r: "Tipo de inspeção", tipo: "select", opcoes: [["todo", "Inspeção em todo o trecho — ICP do trecho = média"], ["amostra", "Por amostragem (aleatórias e adicionais)"]] },
      { k: "ntot", r: "N — número total de amostras do trecho" },
      { k: "erro", r: "e — erro admitido na inspeção (pontos de ICP)", ph: "5" },
      { k: "qmodo", r: "Contagem de q (valores deduzíveis > 5)", tipo: "select",
        opcoes: [["tipo", "O maior valor de cada tipo de defeito (NOTA do gráfico do item 7)"], ["todos", "Todos os valores > 5 (nota 2 da ficha-exemplo, 5)"]],
        dica: "a ficha-exemplo diz q = 6, mas o VDC = 48 que ela registra corresponde à curva q = 5 (maior valor por tipo)" },
    ],
    padrao: { placas: "20", insp: "todo", erro: "5", qmodo: "tipo" },
    tabelas: function () {
      return [{ chave: "def", titulo: "Defeitos registrados na Ficha de Inspeção", rotulo: "Registro", iniciais: 6, min: 1,
        dica: "uma coluna por tipo e grau de severidade em cada amostra; severidade B, M ou A (vazio nos tipos 10, 11 e 15, de curva única)",
        linhas: [
          { k: "amostra", r: "Amostra nº", texto: true, ph: "1" },
          { k: "adic", r: "Amostra adicional? (S/N)", texto: true, ph: "N" },
          { k: "nplac", r: "Placas da amostra (vazio = padrão)", u: "" },
          { k: "tipo", r: "Tipo de defeito (1 a 18)", u: "" },
          { k: "sev", r: "Grau de severidade (B, M, A)", texto: true },
          { k: "npa", r: "Nº de placas afetadas", u: "" },
          { calc: "dens", r: "Densidade — % de placas afetadas", u: "%", casas: 1 },
          { calc: "vd", r: "Valor deduzível (curvas do Anexo A)", u: "", casas: 1, destaque: true },
        ] }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], np0 = num(P.placas) || 20, amostras = [], mapa = {};
      var tab = (d.def || []).map(function (x, i) {
        var o = {}, t = Math.round(num(x.tipo)), sev = String(x.sev || "").trim().toUpperCase().charAt(0), npa = num(x.npa);
        var nomeAm = String(x.amostra || "").trim() || (i ? (tabAnt || "1") : "1");
        tabAnt = nomeAm;
        var npl = num(x.nplac) || np0;
        if (!ok(t)) return o;
        var am = mapa[nomeAm];
        if (!am) { am = mapa[nomeAm] = { nome: nomeAm, adic: /^s/i.test(String(x.adic || "")), placas: npl, defs: [] }; amostras.push(am); }
        if (/^s/i.test(String(x.adic || ""))) am.adic = true;
        var rot = "Registro " + (i + 1) + " (amostra " + nomeAm + ", tipo " + t + (sev ? " " + sev : "") + ")";
        if (t < 1 || t > 18) { avisos.push(rot + ": tipo fora de 1 a 18 (assentamento e buracos não são deduzíveis — 5.1.3)."); return o; }
        if (t === 5) {
          o.vd = SELAGEM[sev];
          if (!ok(o.vd)) avisos.push(rot + ": informe o grau de severidade B, M ou A da selagem (6.5).");
        } else {
          o.dens = ok(npa) ? npa / npl * 100 : NaN;
          if (ok(npa) && npa > npl) avisos.push(rot + ": placas afetadas acima do total da amostra.");
          var C = CURVAS[t], curva = C.U ? C.U : C[sev];
          if (!C.U && !curva) { avisos.push(rot + ": informe o grau de severidade B, M ou A."); return o; }
          if (C.U && sev) avisos.push(rot + ": o tipo " + t + " tem curva única — severidade ignorada.");
          if (ok(o.dens)) {
            var r = interp(curva, o.dens);
            o.vd = r.fora === "abaixo" ? 0 : r.v;
            if (r.fora === "acima") avisos.push(rot + ": densidade de " + fmt(o.dens, 1) + " % além do fim da curva (" + curva[curva.length - 1][0] + " %) — adotado o último valor.");
          }
        }
        if (ok(o.vd)) am.defs.push({ t: t, sev: sev, vd: o.vd, dens: o.dens });
        return o;
      });
      var tabAnt;
      amostras.forEach(function (am) {
        am.tdv = am.defs.reduce(function (s, x) { return s + x.vd; }, 0);
        if (P.qmodo === "todos") am.q = am.defs.filter(function (x) { return x.vd > 5; }).length;
        else {
          var maxT = {};
          am.defs.forEach(function (x) { maxT[x.t] = Math.max(maxT[x.t] || 0, x.vd); });
          am.q = Object.keys(maxT).filter(function (k) { return maxT[k] > 5; }).length;
        }
        var c = vdc(am.tdv, am.q);
        am.vdc = c.v; am.qUsado = c.q;
        if (am.q > 6) avisos.push("Amostra " + am.nome + ": q = " + am.q + " > 6 — usada a curva q = 6 do gráfico (item 7).");
        if (am.tdv > 200) avisos.push("Amostra " + am.nome + ": valor deduzível total " + fmt(am.tdv, 1) + " > 200 (fim do gráfico) — VDC limitado.");
        if (c.fora === "abaixo" && am.q > 1) avisos.push("Amostra " + am.nome + ": VDT = " + fmt(am.tdv, 1) + " antes do início da curva q = " + c.q + " — VDC extrapolado linearmente.");
        am.icp = Math.max(0, 100 - am.vdc);
        am.conceito = conceito(am.icp);
        if (am.icp <= 40) avisos.push("Amostra " + am.nome + ": ICP = " + fmt(am.icp, 0) + " ≤ 40 — descrever no laudo o estado da amostra (5.5 f).");
      });
      var r = { amostras: amostras };
      var ale = amostras.filter(function (a) { return !a.adic; }), adi = amostras.filter(function (a) { return a.adic; });
      var N = num(P.ntot), icps = amostras.map(function (a) { return a.icp; });
      r.icp1 = media(ale.map(function (a) { return a.icp; })); r.icp2 = media(adi.map(function (a) { return a.icp; }));
      if (P.insp === "amostra" && adi.length) {
        if (!ok(N)) { avisos.push("Informe N, o número total de amostras do trecho, para ponderar as amostras adicionais (Anexo A, 3 b)."); r.icpT = media(icps); }
        else r.icpT = (N - adi.length) / N * r.icp1 + adi.length / N * r.icp2;
        r.formula = true;
      } else r.icpT = media(icps);
      r.conceitoT = conceito(r.icpT);
      r.S = desvio(icps);
      var e = num(P.erro);
      if (ok(N) && ok(r.S) && ok(e) && e > 0) {
        r.nMin = N * r.S * r.S / (e * e / 4 * (N - 1) + r.S * r.S);
        r.nMinInt = Math.ceil(r.nMin - 1e-9);
        if (ale.length < r.nMinInt) avisos.push("Amostras inspecionadas (" + ale.length + ") abaixo do mínimo recalculado n = " + r.nMinInt + ": avaliar a inspeção de novas amostras (seção 6).");
      } else if (P.insp === "amostra") avisos.push("Informe N e o erro admitido para recalcular o número mínimo de amostras (seção 6).");
      return { tab: { def: tab }, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, h = '<div class="fe-res">';
      r.amostras.forEach(function (a) {
        h += '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + fmt(a.icp, 0) + '</div><div class="fe-res-r">Amostra ' + esc(a.nome) + (a.adic ? " (adicional)" : "") + " — VDT " + fmt(a.tdv, 1) + ", q = " + a.q + ", VDC " + fmt(a.vdc, 1) + " — " + esc(a.conceito) + "</div></div>";
      });
      h += '<div class="fe-res-item"><div class="fe-res-v">' + (ok(r.icpT) ? fmt(r.icpT, 0) : "—") + '</div><div class="fe-res-r">ICP do trecho' + (r.formula ? " (com amostras adicionais)" : " (média)") + " — " + esc(r.conceitoT) + "</div></div>";
      if (ok(r.nMin)) h += '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + r.nMinInt + '</div><div class="fe-res-r">Número mínimo de amostras (S = ' + fmt(r.S, 1) + ")</div></div>";
      return h + "</div>";
    },
    relatorio: {
      notas: "Valores deduzíveis lidos nas curvas do Anexo A (6.1 a 6.18) digitalizadas das figuras da norma, com interpolação linear; selagem de juntas: 2, 4 e 8 pontos (6.5). VDC pelas curvas q = 1 a 6 do item 7 (digitalizadas); ICP = 100 − VDC. " +
        "ICP do trecho: média, ou ICPt = (N − A)/N × ICP1 + A/N × ICP2 com amostras adicionais. n = N S² / [e²/4 (N − 1) + S²]. Conceitos do Anexo B. A figura do item 6.18 (placa bailarina) é idêntica à do item 6.4 no PDF da norma.",
      resultados: function (calc) {
        var r = calc.resultados, rows = [];
        r.amostras.forEach(function (a) {
          rows.push(["Amostra " + a.nome + (a.adic ? " (adicional)" : ""), a.defs.map(function (x) { return x.t + (x.sev ? x.sev : "") + " = " + fmt(x.vd, 1); }).join("; ") +
            " → VDT " + fmt(a.tdv, 1) + "; q = " + a.q + "; VDC " + fmt(a.vdc, 1) + "; ICP " + fmt(a.icp, 0) + " — " + a.conceito]);
        });
        rows.push(["ICP do trecho", (ok(r.icpT) ? fmt(r.icpT, 1) : "—") + " — " + r.conceitoT + (r.formula ? " (ICP1 = " + fmt(r.icp1, 1) + "; ICP2 = " + fmt(r.icp2, 1) + ")" : "")]);
        if (ok(r.S)) rows.push(["Desvio-padrão / n mínimo", fmt(r.S, 2) + (ok(r.nMin) ? " / " + fmt(r.nMin, 2) + " → " + r.nMinInt + " amostras" : "")]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Ficha de inspeção do exemplo da norma (Anexo A, 5) — uma amostra de 20 placas", dados: function () {
        var L = [["5", "M", ""], ["10", "", "10"], ["11", "", "2"], ["15", "", "2"], ["1", "B", "4"], ["2", "B", "2"], ["2", "A", "2"], ["13", "M", "4"], ["18", "B", "1"]];
        return { ident: { registro: "EX-ICP-001", obra: "Exemplo da norma", trecho: "Trecho 1" },
          params: { placas: "20", dim: "3,8 × 6,0", insp: "todo", erro: "5", qmodo: "tipo" },
          obs: "A ficha-exemplo registra valores deduzíveis 4, 8, 6, —, 15, 10, 23, 29 e 2 (total 97), VDC = 48 e ICP = 52 (Razoável).",
          def: L.map(function (x) { return { amostra: "1", adic: "N", tipo: x[0], sev: x[1], npa: x[2] }; }) };
      } },
      { nome: "Trecho por amostragem — 3 amostras aleatórias e 1 adicional (dados gerados)", dados: function () {
        var L = [["2", "N", "7", "B", "3"], ["2", "N", "10", "", "6"], ["2", "N", "5", "B", ""],
          ["7", "N", "2", "M", "2"], ["7", "N", "3", "B", "1"], ["7", "N", "11", "", "3"], ["7", "N", "16", "A", "2"],
          ["12", "N", "10", "", "4"], ["12", "N", "17", "M", "5"],
          ["15", "S", "3", "A", "4"], ["15", "S", "4", "A", "6"], ["15", "S", "12", "M", "3"], ["15", "S", "11", "", "8"], ["15", "S", "5", "A", ""]];
        return { ident: { registro: "EX-ICP-002", data: "2026-06-18", obra: "Rodovia A — pista em concreto", trecho: "km 10 ao km 12" },
          params: { placas: "20", dim: "3,5 × 5,0", insp: "amostra", ntot: "40", erro: "5", qmodo: "tipo" },
          def: L.map(function (x) { return { amostra: x[0], adic: x[1], tipo: x[2], sev: x[3], npa: x[4] }; }) };
      } },
    ],
  };
})();
