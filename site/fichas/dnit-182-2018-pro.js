/*
 * Ficha: DNIT 182/2018-PRO — Conservação rodoviária — Determinação do nível de esforço de roçada.
 * Registra-se no motor de site/fichas.js (window.FE).
 * NERP = Σ (NERE,i / di) / Σ (1 / di) (eq. 1), com 2 a 5 estações pluviométricas da Tabela 1 (Anexo A), as mais
 * próximas do ponto médio do trecho; NERP inteiro (arredondamento do Anexo B: 3,4 → 3; 3,5 → 4) e ajuste de ± 1
 * (fertilidade do solo / tipo de vegetação, seção 3). Distâncias digitadas (régua do Google Earth, seção 5) ou
 * calculadas pela ficha (círculo máximo) a partir das coordenadas do ponto e das estações da Tabela 1.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;

  // Tabela 1 (Anexo A): [código, estação, UF, latitude, longitude (graus decimais), nd, NERE]
  var EST = [
    ["967000","Rio Branco","AC",-9.97583,-67.8,0.03744,5.8], ["1067003","Vila Capixaba","AC",-10.57583,-67.67667,0.02546,4.3], 
    ["8050000","Carmo","AP",0.50806,-50.74833,0.03308,5.3], ["8251001","Cunani","AP",2.69833,-51.36139,0.08774,12], 
    ["765000","Cachoeira","AM",-7.7025,-66.05139,0.04543,6.8], ["759000","Vila do Apuí","AM",-7.20083,-59.89222,0.05509,8], 
    ["470002","Esteirão do Repouso","AM",-4.38333,-70.96667,0.05583,8.1], ["8069004","Pirarara Poço","AM",-0.14278,-69.21333,0.07611,10.6], 
    ["363000","Barro Alto","AM",-3.875,-63.78583,0.04304,6.5], ["259000","Cachoeira Morena","AM",-2.11444,-59.33528,0.03572,5.6], 
    ["267001","Espírito Santo","AM",-2.75,-67.56667,0.06215,8.8], ["247000","Badajós","PA",-2.51278,-47.76806,0.04139,6.3], 
    ["555002","Km 1130 da BR163","PA",-6.67139,-55.49583,0.04395,6.6], ["152005","Almeirim","PA",-1.22639,-52.57833,0.04223,6.4], 
    ["47003","Curuçá","PA",-0.7375,-47.85361,0.05177,7.6], ["352005","Brasil Novo","PA",-3.30778,-52.54194,0.0498,7.3], 
    ["862000","Tabajara","RO",-8.93222,-62.05389,0.04426,6.6], ["1160000","Marco Rondon","RO",-12.01528,-60.855,0.03849,5.9], 
    ["1063000","Escola Caramurú","RO",-10.505,-63.64611,0.0541,7.9], ["8360002","Fazenda Passarão","RR",3.20778,-60.57111,0.02703,4.5], 
    ["8161001","Caracaraí","RR",1.82139,-61.12361,0.0349,5.5], ["61000","Santa Maria do Boiaçú","RR",-0.50667,-61.78583,0.04878,7.2], 
    ["1148000","Fazenda Lobeira","TO",-11.53139,-48.29472,0.0272,4.5], ["848000","Colinas do Tocantins","TO",-8.05278,-48.48167,0.03527,5.5], 
    ["1547013","Taquara","DF",-15.63222,-47.52028,0.01966,3.6], ["1547004","Brasília","DF",-15.79,-47.92278,0.02543,4.3], 
    ["1750001","Fazenda do Turno","GO",-17.07917,-50.28944,0.0252,4.3], ["1549001","Goianésia","GO",-15.32917,-49.12167,0.02632,4.4], 
    ["1156000","Fazenda Itaubá","MT",-11.47139,-56.43333,0.04125,6.3], ["1351000","Trecho Médio","MT",-14.08806,-51.69889,0.03102,5], 
    ["1655001","Córrego Grande","MT",-16.60806,-55.20639,0.03385,5.4], ["1456008","Rosário Oeste","MT",-14.83417,-56.41167,0.02655,4.5], 
    ["1951003","Fazenda Pindorama","MS",-19.39083,-51.60889,0.03005,4.9], ["1956005","Bodoquena","MS",-19.87083,-56.98361,0.02235,3.9], 
    ["2254000","Caarapó","MS",-22.62444,-54.82472,0.0266,4.5], ["2055002","Palmeiras","MS",-20.44889,-55.43083,0.02829,4.7], 
    ["2352002","Quinta do Sol","PR",-23.81667,-52.18333,0.03011,4.9], ["2549000","São Bento","PR",-25.93333,-49.78333,0.02775,4.6], 
    ["2552001","Águas do Vere","PR",-25.77389,-52.93278,0.0459,6.8], ["3050002","Palmares do Sul","RS",-30.25139,-50.50583,0.01998,3.7], 
    ["2953030","Tupancireta","RS",-29.08556,-53.81917,0.03925,6], ["2750001","Campo Belo do Sul","SC",-27.89889,-50.75361,0.02811,4.7], 
    ["2651040","Ponte Serrada","SC",-26.92056,-51.92806,0.04152,6.3], ["1840000","Águia Branca","ES",-18.98556,-40.74611,0.02295,4], 
    ["2041018","Usina Fortaleza","ES",-20.37139,-41.40889,0.02655,4.5], ["2044042","Carmo da Mata (Copasa)","MG",-20.5625,-44.8675,0.026,4.4], 
    ["1844018","Ponte do Bicudo","MG",-18.20111,-44.57722,0.0211,3.8], ["1941018","Itanhomi","MG",-19.16167,-41.86222,0.01878,3.5], 
    ["1542016","Serra Branca","MG",-15.63667,-42.94361,0.01557,3.1], ["1847010","Iraí de Minas","MG",-18.98194,-47.4575,0.02554,4.3], 
    ["2142022","Aldeia","RJ",-21.95139,-42.35611,0.02159,3.9], ["2243004","Conservatória","RJ",-22.2875,-43.92944,0.03002,4.9], 
    ["2345067","Ponte Alta 1","SP",-23.32917,-45.14028,0.03204,5.1], ["2147117","Pirassununga","SP",-21.99972,-47.41667,0.02573,4.4], 
    ["2151039","Lucélia","SP",-21.73333,-51.01667,0.02442,4.2], ["2348088","Engenheiro Barcelar","SP",-23.88306,-48.77222,0.02405,4.2], 
    ["935012","MuriciPonte","AL",-9.31361,-35.94972,0.01954,3.6], ["937013","Delmiro Gouvêia","AL",-9.39278,-37.99417,0.00658,2], 
    ["1539022","Camacan (Vargito)","BA",-15.42528,-39.49278,0.02017,3.7], ["1144005","Fazenda Macambira","BA",-11.61389,-44.1575,0.01853,3.5], 
    ["1139022","Gavião II","BA",-11.47417,-39.78472,0.00685,2], ["940024","Juazeiro","BA",-9.40556,-40.50333,0.00766,2.1], 
    ["1241001","Fazenda Iguaçú","BA",-12.93472,-41.06583,0.01228,2.7], ["1137043","Usina Altamira","BA",-11.76833,-37.80361,0.01671,3.3], 
    ["1739021","Cachoeira Grande","BA",-17.25361,-39.77833,0.01819,3.4], ["339000","Amontada","CE",-3.36333,-39.82944,0.01335,2.8], 
    ["438011","Baú","CE",-4.12139,-38.65917,0.01983,3.6], ["638014","Icó","CE",-6.40889,-38.86361,0.0141,2.9], 
    ["440005","Croatá","CE",-4.41639,-40.90417,0.00802,2.2], ["644003","Colinas","MA",-6.0275,-44.25389,0.02309,4], 
    ["444001","Coroatá","MA",-4.16278,-44.16583,0.03187,5.1], ["638032","Antenor Navarro","PB",-6.73528,-38.44806,0.01889,3.5], 
    ["735009","Mulungu","PB",-7.02944,-35.46806,0.01389,2.9], ["835138","Pirapama","PE",-8.27917,-35.06333,0.03228,5.2], 
    ["838004","Belém de São Francisco","PE",-8.765,-38.96056,0.00845,2.2], ["840010","Fazenda São Bento","PE",-8.61611,-39.99944,0.00868,2.3], 
    ["844008","Cristino Castro II","PI",-8.81306,-44.21556,0.01496,3], ["541002","Fazenda Boa Esperança","PI",-5.22472,-41.73694,0.02096,3.8], 
    ["537035","Fazenda Angicos","RN",-5.28889,-37.28889,0.00927,2.3], ["637010","Açude Lagoinha","RN",-6.46222,-37.3025,0.01358,2.9], 
    ["1037049","Santa Rosa de Lima","SE",-10.65278,-37.19278,0.01807,3.4], ["1137017","Estância","SE",-11.26667,-37.44306,0.02437,4.2]
  ];
  var ND_MIN = 0.00658, ND_MAX = 0.08774, NER_MIN = 2, NER_MAX = 12;  // seção 3: extremos da relação linear
  var R_TERRA = 6371.0088;  // km (raio médio)

  function porCodigo(c) { c = String(c || "").replace(/\D/g, ""); for (var i = 0; i < EST.length; i++) if (EST[i][0] === c) return EST[i]; return null; }
  // "19°5'4.44\" S", "19 5 4,44 S", "-19,0846" -> graus decimais (S e W negativos)
  function coord(s, tipo) {
    s = String(s || "").trim();
    if (!s) return NaN;
    var hemi = (s.match(/[NSLEWO]\s*$/i) || [""])[0].toUpperCase().trim();
    var neg = /^-/.test(s) || hemi === "S" || hemi === "W" || hemi === "O";
    var p = s.replace(/[NSLEWO]\s*$/i, "").replace(/^-/, "").split(/[°º'’"″ \s]+/).filter(Boolean).map(num);
    if (!p.length || !p.every(ok)) return NaN;
    var v = p[0] + (p[1] || 0) / 60 + (p[2] || 0) / 3600;
    if (v > (tipo === "lat" ? 90 : 180)) return NaN;
    return neg ? -v : v;
  }
  function dms(v, tipo) {
    if (!ok(v)) return "—";
    var a = Math.abs(v), g = Math.floor(a), m = Math.floor((a - g) * 60), s = (a - g - m / 60) * 3600;
    if (s >= 59.995) { s = 0; m++; } if (m >= 60) { m = 0; g++; }
    return g + "°" + m + "'" + fmt(s, 2) + '" ' + (tipo === "lat" ? (v < 0 ? "S" : "N") : (v < 0 ? "W" : "E"));
  }
  function dist(la1, lo1, la2, lo2) {
    var r = Math.PI / 180, dLa = (la2 - la1) * r, dLo = (lo2 - lo1) * r;
    var h = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(dLo / 2) * Math.sin(dLo / 2);
    return 2 * R_TERRA * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  function nerDeNd(nd) { return NER_MIN + (NER_MAX - NER_MIN) * (nd - ND_MIN) / (ND_MAX - ND_MIN); }
  function arred(x) { return Math.floor(x + 0.5 + 1e-9); }  // Anexo B: 3,4 → 3; 3,5 → 4

  FE.FICHAS["dnit-182-2018-pro"] = {
    titulo: "Conservação — nível de esforço de roçada (NERP)",
    rotuloImportar: function (r) { return ok(r.nerpFinal) ? "NERP " + r.nerpFinal + " (eq. 1 = " + fmt(r.nerp, 2) + ")" : "—"; },
    resumo: "NERP = Σ(NERE,i / di) / Σ(1 / di) (eq. 1) com as 2 a 5 estações pluviométricas da Tabela 1 mais próximas do ponto médio do trecho; distâncias digitadas ou calculadas pelas coordenadas; NERP inteiro e ajuste de ± 1 (seção 3).",
    blocos: [],
    params: [
      { k: "lat", r: "Ponto médio do trecho — latitude", ph: "19°5'4,44\" S ou −19,0846", dica: "graus, minutos e segundos com S/N, ou graus decimais (sul negativo)" },
      { k: "lon", r: "Ponto médio do trecho — longitude", ph: "42°11'8,14\" W ou −42,1856" },
      { k: "nest", r: "Número de estações consideradas (i)", tipo: "select", opcoes: [["5", "5"], ["4", "4"], ["3", "3"], ["2", "2"]],
        dica: "2 ≤ i ≤ 5, necessariamente as mais próximas do ponto, não necessariamente da mesma UF (seção 3)" },
      { k: "ajuste", r: "Ajuste do NERP (seção 3)", tipo: "select", opcoes: [["0", "Sem ajuste"], ["1", "+ 1 (solo fértil / vegetação de crescimento rápido)"], ["-1", "− 1 (solo pouco fértil / vegetação de crescimento lento)"]] },
      { k: "justif", r: "Justificativa do ajuste", ph: "fertilidade do solo e/ou tipo de vegetação", se: function (d) { return num((d.params || {}).ajuste) !== 0 && ok(num((d.params || {}).ajuste)); } },
    ],
    padrao: { nest: "5", ajuste: "0" },
    tabelas: function () {
      return [{ chave: "est", titulo: "Estações pluviométricas consideradas (Tabela 1)", rotulo: "Estação", iniciais: 5, min: 1,
        dica: "deixe tudo vazio para a ficha escolher as i estações mais próximas pelas coordenadas; distância vazia = calculada pelas coordenadas (círculo máximo)",
        linhas: [
          { k: "cod", r: "Código da estação (Tabela 1)", texto: true, ph: "1941018" },
          { k: "d", r: "Distância di digitada (régua do Google Earth)", u: "km" },
          { k: "ner", r: "NERE digitado (vazio = Tabela 1)", u: "" },
          { calc: "nerT", r: "NERE da Tabela 1", u: "", casas: 1 },
          { calc: "dc", r: "Distância calculada pelas coordenadas", u: "km", casas: 1 },
          { calc: "peso", r: "Peso 1/di", u: "1/km", casas: 5 },
          { calc: "prod", r: "NERE,i × 1/di", u: "", casas: 5, destaque: true },
        ] }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [];
      var la = coord(P.lat, "lat"), lo = coord(P.lon, "lon"), temPto = ok(la) && ok(lo);
      if (String(P.lat || "").trim() && !ok(la)) avisos.push("Latitude do ponto médio não reconhecida — use 19°5'4,44\" S ou −19,0846.");
      if (String(P.lon || "").trim() && !ok(lo)) avisos.push("Longitude do ponto médio não reconhecida — use 42°11'8,14\" W ou −42,1856.");
      var nest = Math.round(num(P.nest)) || 5;
      // estações mais próximas do ponto (Tabela 1)
      var prox = temPto ? EST.map(function (e) { return { e: e, d: dist(la, lo, e[3], e[4]) }; }).sort(function (a, b) { return a.d - b.d; }) : [];
      var linhas = (d.est || []).map(function (x, i) { return { x: x, i: i }; }).filter(function (o) { return String(o.x.cod || "").trim() || ok(num(o.x.d)) || ok(num(o.x.ner)); });
      var auto = !linhas.length && temPto;
      var tab = (d.est || []).map(function () { return {}; });
      var usadas = [];
      if (auto) {
        prox.slice(0, nest).forEach(function (p) { usadas.push({ cod: p.e[0], nome: p.e[1] + " (" + p.e[2] + ")", ner: p.e[6], nerT: p.e[6], nd: p.e[5], d: p.d, dc: p.d, calc: true }); });
      } else {
        linhas.forEach(function (o) {
          var x = o.x, e = porCodigo(x.cod), t = tab[o.i], rot = "Estação " + (String(x.cod || "").trim() || "da coluna " + (o.i + 1));
          var u = { cod: e ? e[0] : String(x.cod || "").trim(), nome: e ? e[1] + " (" + e[2] + ")" : "—", nerT: e ? e[6] : NaN, nd: e ? e[5] : NaN };
          if (String(x.cod || "").trim() && !e) avisos.push(rot + ": código não encontrado na Tabela 1 (Anexo A) — o NERE deve ser o da Tabela 1 (seção 4).");
          u.dc = e && temPto ? dist(la, lo, e[3], e[4]) : NaN;
          var dd = num(x.d);
          u.d = ok(dd) ? dd : u.dc; u.calc = !ok(dd);
          var nd = num(x.ner);
          u.ner = ok(nd) ? nd : u.nerT;
          if (ok(nd) && ok(u.nerT) && Math.abs(nd - u.nerT) > 1e-9) avisos.push(rot + ": NERE digitado (" + fmt(nd, 1) + ") difere do da Tabela 1 (" + fmt(u.nerT, 1) + ").");
          if (ok(dd) && ok(u.dc) && Math.abs(dd - u.dc) > Math.max(2, 0.05 * u.dc)) avisos.push(rot + ": distância digitada de " + fmt(dd, 1) + " km difere da calculada pelas coordenadas (" + fmt(u.dc, 1) + " km) — confira o ponto médio e a medição.");
          if (!ok(u.d)) avisos.push(rot + ": informe a distância di ou as coordenadas do ponto médio.");
          if (!ok(u.ner)) avisos.push(rot + ": informe o NERE (ou um código da Tabela 1).");
          if (ok(u.d) && u.d <= 0) { avisos.push(rot + ": distância nula — o ponto coincide com a estação; adotado o NERE dessa estação."); }
          t.nerT = u.nerT; t.dc = u.dc;
          u.col = o.i;
          usadas.push(u);
        });
      }
      if (!linhas.length && !temPto) avisos.push("Informe as coordenadas do ponto médio do trecho ou as estações consideradas com as distâncias.");
      var validas = usadas.filter(function (u) { return ok(u.d) && ok(u.ner); });
      var zero = validas.filter(function (u) { return u.d <= 0; })[0];
      var sP = 0, sW = 0;
      validas.forEach(function (u) {
        u.peso = u.d > 0 ? 1 / u.d : NaN; u.prod = u.ner * u.peso;
        if (ok(u.peso)) { sP += u.prod; sW += u.peso; }
        if (u.col !== undefined) { tab[u.col].peso = u.peso; tab[u.col].prod = u.prod; }
      });
      var r = { usadas: usadas, auto: auto, lat: la, lon: lo, sP: sP, sW: sW };
      r.nerp = zero ? zero.ner : (sW > 0 ? sP / sW : NaN);
      if (validas.length && (validas.length < 2 || validas.length > 5)) avisos.push("Foram consideradas " + validas.length + " estação(ões): a norma exige de 2 a 5 (2 ≤ i ≤ 5, seção 3).");
      else if (!auto && validas.length && validas.length !== nest) avisos.push("Estações informadas (" + validas.length + ") diferem do número escolhido i = " + nest + " — valem as informadas.");
      // as estações devem ser as mais próximas
      if (temPto && !auto && validas.length) {
        var k = validas.length, maisProx = prox.slice(0, k).map(function (p) { return p.e[0]; });
        var fora = validas.filter(function (u) { return u.cod && maisProx.indexOf(u.cod) < 0; });
        if (fora.length) {
          avisos.push("Estação(ões) " + fora.map(function (u) { return u.cod; }).join(", ") + " não está(ão) entre as " + k + " mais próximas do ponto: " +
            prox.slice(0, k).map(function (p) { return p.e[0] + " " + p.e[1] + " (" + fmt(p.d, 1) + " km)"; }).join("; ") + " — as estações devem ser necessariamente as mais próximas (seção 3).");
          r.naoProx = true;
        }
      }
      r.prox = prox.slice(0, 6).map(function (p) { return { cod: p.e[0], nome: p.e[1] + " (" + p.e[2] + ")", d: p.d, ner: p.e[6] }; });
      if (ok(r.nerp)) {
        r.nerpInt = arred(r.nerp);
        var aj = num(P.ajuste); r.ajuste = ok(aj) ? aj : 0;
        r.nerpFinal = r.nerpInt + r.ajuste;
        if (r.ajuste && !String(P.justif || "").trim()) avisos.push("Justifique o ajuste de " + (r.ajuste > 0 ? "+" : "−") + " 1 (fertilidade do solo e/ou tipo de vegetação, seção 3).");
        if (r.nerpFinal < 1) avisos.push("NERP ajustado menor que 1 — reveja o ajuste.");
      }
      return { tab: { est: tab }, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, h = '<div class="fe-res">';
      h += '<div class="fe-res-item"><div class="fe-res-v">' + (ok(r.nerpFinal) ? r.nerpFinal : "—") + '</div><div class="fe-res-r">NERP adotado' +
        (ok(r.nerpFinal) && r.ajuste ? " (" + r.nerpInt + (r.ajuste > 0 ? " + 1" : " − 1") + ", seção 3)" : " (inteiro)") + "</div></div>";
      h += '<div class="fe-res-item"><div class="fe-res-v fe-res-p">' + fmt(r.nerp, 2) + '</div><div class="fe-res-r">Eq. 1 — média de NERE ponderada por 1/d (' + r.usadas.length + " estações" + (r.auto ? ", escolhidas pela ficha" : "") + ")</div></div></div>";
      if (r.usadas.length) {
        h += '<table class="fe-resumo"><thead><tr><th>Código</th><th>Estação</th><th>NERE</th><th>d (km)</th><th>1/d</th><th>NERE/d</th></tr></thead><tbody>' +
          r.usadas.map(function (u) {
            return "<tr><td>" + esc(u.cod) + "</td><td>" + esc(u.nome) + "</td><td>" + fmt(u.ner, 1) + "</td><td>" + fmt(u.d, 1) + (u.calc ? " *" : "") + "</td><td>" + fmt(u.peso, 5) + "</td><td>" + fmt(u.prod, 5) + "</td></tr>";
          }).join("") + "<tr><td colspan=\"4\"><b>Σ</b></td><td><b>" + fmt(r.sW, 5) + "</b></td><td><b>" + fmt(r.sP, 5) + "</b></td></tr></tbody></table>" +
          (r.usadas.some(function (u) { return u.calc; }) ? "<small>* distância calculada pelas coordenadas (círculo máximo, R = 6371 km).</small>" : "");
      }
      return h;
    },
    relatorio: {
      notas: "NERP = Σ(NERE,i × 1/di) / Σ(1/di) (eq. 1), com 2 ≤ i ≤ 5 estações pluviométricas da Tabela 1 (Anexo A), necessariamente as mais próximas do ponto médio do trecho, não necessariamente da mesma UF (seção 3). " +
        "NERP inteiro, arredondado como no Anexo B (3,4 → 3; 3,5 → 4); pode-se somar ou subtrair uma unidade para considerar a fertilidade do solo e/ou o tipo de vegetação (seção 3). " +
        "A norma mede di com a régua do Google Earth (seção 5); quando não digitadas, a ficha calcula as distâncias pelo círculo máximo (R = 6371 km) a partir das coordenadas da Tabela 1 — diferenças de até ~1 % em relação à régua. " +
        "Na Tabela 1, NERE = 2 + 10 × (nd − 0,00658) / (0,08774 − 0,00658) (relação linear da seção 3, extremos nas estações de maior e menor nd).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (ok(r.lat) && ok(r.lon)) rows.push(["Ponto médio do trecho", dms(r.lat, "lat") + "  " + dms(r.lon, "lon")]);
        r.usadas.forEach(function (u) { rows.push(["Estação " + u.cod + " — " + u.nome, "NERE " + fmt(u.ner, 1) + "; d = " + fmt(u.d, 1) + " km" + (u.calc ? " (calculada)" : "") + "; 1/d = " + fmt(u.peso, 5)]); });
        rows.push(["NERP pela eq. 1", fmt(r.nerp, 2) + (ok(r.nerpInt) ? " → " + r.nerpInt : "")]);
        rows.push(["NERP adotado", ok(r.nerpFinal) ? r.nerpFinal + (r.ajuste ? " (ajuste " + (r.ajuste > 0 ? "+" : "−") + " 1" + (P.justif ? ": " + P.justif : "") + ")" : "") : "—"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Exemplo do Anexo B da norma — 5 estações, distâncias medidas (NERP 3,78 → 4)", dados: function () {
        var L = [["1840000", "152,2"], ["2041018", "162,7"], ["2044042", "323,5"], ["1844018", "270,8"], ["1941018", "35,5"]];
        return { ident: { registro: "EX-NER-001", obra: "Exemplo da norma (Anexo B)", trecho: "Ponto médio do trecho" },
          params: { lat: "19°5'4,44\" S", lon: "42°11'8,14\" W", nest: "5", ajuste: "0" },
          obs: "Estações e distâncias do quadro do Anexo B. Pelas coordenadas da Tabela 1, a estação 2142022 (≈ 319 km) fica mais perto do ponto que a 2044042 (323,5 km no Anexo B), por isso o aviso: o exemplo da norma não usa exatamente as 5 estações mais próximas.",
          est: L.map(function (x) { return { cod: x[0], d: x[1] }; }) };
      } },
      { nome: "Estações fora das mais próximas, NERE digitado divergente e ajuste sem justificativa (dados gerados)", dados: function () {
        return { ident: { registro: "EX-NER-002", data: "2026-03-10", obra: "Contrato de conservação A", trecho: "BR-000 — km 100 ao km 140" },
          params: { lat: "-15,95", lon: "-47,60", nest: "3", ajuste: "1", justif: "" },
          est: [{ cod: "1547013" }, { cod: "1547004", ner: "4,5" }, { cod: "1750001" }] };
      } },
    ],
  };
})();
