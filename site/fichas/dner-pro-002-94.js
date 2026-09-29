/*
 * Ficha: DNER-PRO 002/94 — Coleta de amostras indeformadas de solos (registro e verificação).
 * Bloco indeformado (5.1), amostrador "Denison" (5.3), tubo de parede fina — "Shelby" (5.4) e tubo de parede fina com
 * pistão estacionário (5.5). Calcula a relação de áreas (3.4) e a folga interna (3.5) do amostrador e a recuperação;
 * confere as dimensões do bloco e da caixa (5.1), a rotação do Denison (5.3), o comprimento da amostra (5 cm menor
 * que o tubo/camisa), a relação de áreas < 10 % e a folga ≈ 1 % (5.4) ou ≈ 0 (5.5), as etiquetas (5.1 e 5.6),
 * o acondicionamento (6) e os itens do boletim de campo (7). Registra-se em window.FE.
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var TOL_DIM = 0.10;  // "cubo com 30 cm de aresta" e "caixa com 35 cm": ± 10 % (critério da ficha)

  var TIPOS = [["bloco", "Bloco indeformado (5.1)"], ["denison", "Amostrador \"Denison\" — rotativo (5.3)"],
    ["shelby", "Tubo de parede fina — \"Shelby\" (5.4)"], ["pistao", "Tubo de parede fina com pistão estacionário (5.5)"]];
  var ETQ = [["eObra", "nome da obra"], ["eLocal", "local da obra"], ["eFuro", "número da sondagem, do poço ou do corte"],
    ["eLoc", "locação"], ["eNum", "número da amostra"], ["eProf", "profundidade da amostra coletada"]];
  var SN = [["", "— não verificado"], ["sim", "Sim"], ["nao", "Não"]];
  function tipo(d) { return ((d && d.params) || {}).tipo || "shelby"; }
  function em() { var l = arguments; return function (d) { return Array.prototype.indexOf.call(l, tipo(d)) >= 0; }; }
  function tubo(d) { return tipo(d) !== "bloco"; }
  function sempre() { return true; }
  var CHECK = [
    ["chkPano", "5.1", "Pano cobrindo todas as faces, com camada de parafina líquida (operação repetida mais duas vezes); a parafina nunca cobre diretamente a amostra", em("bloco")],
    ["chkSerr", "5.1", "Vazio entre a parafina e a caixa completado com serragem úmida, inclusive na parte superior, e tampa fechada", em("bloco")],
    ["chkFaces", "5.1", "Faces do topo e da parede externa da escavação (ou uma lateral com direção definida) marcadas com tinta na caixa", em("bloco")],
    ["chkEtq2", "5.1", "Duas etiquetas: uma protegida por invólucro plástico dentro da caixa e outra numa das faces", em("bloco")],
    ["chkFuro", "5.2", "Amostrador em perfeitas condições; furo isento de material solto; solo não afetado pela limpeza", tubo],
    ["chkOleo", "5.2", "Parede interna do tubo/camisa untada com óleo ou graxa", tubo],
    ["chkNA", "5.2", "Com água subterrânea, extração com o nível d'água na profundidade encontrada ou acima (restabelecido se baixou)", tubo],
    ["chkCrav", "5.4 e 5.5", "Cravação sob pressão, de uma só vez, sem interrupção nem rotação" + " (haste do pistão fixa, em 5.5)", em("shelby", "pistao")],
    ["chkPontas", "5.3 a 5.5", "Cerca de 2 cm de solo removidos das pontas, vedadas com pano e parafina; solo removido usado na classificação tátil-visual", tubo],
    ["chkTopo", "5.6", "Etiqueta colocada no amostrador; no Denison, posição do topo ou do fundo indicada na camisa", tubo],
    ["chkCaixa", "6", "Tubos/camisas em caixas de madeira com serragem úmida, na vertical, com o fundo na parede inferior da caixa", tubo],
    ["chkAvisos", "6", "Caixa marcada: \"ESTE LADO PARA CIMA\", \"FRÁGIL\", \"EVITAR CALOR\"", tubo],
    ["chkAbrigo", "5.1 a 5.5", "Amostra guardada em local abrigado/protegido até o envio ao laboratório", sempre],
  ];

  FE.FICHAS["dner-pro-002-94"] = {
    titulo: "Solos — Coleta de amostras indeformadas",
    resumo: "Registro e verificação da coleta de amostras indeformadas: bloco (30 cm, caixa de 35 cm), Denison (40 a 125 rpm), Shelby e Shelby com pistão; relação de áreas e folga interna do amostrador (3.4 e 3.5), recuperação, etiquetas, acondicionamento e boletim de campo (7).",
    params: [
      { k: "tipo", r: "Tipo de amostra / amostrador (5)", tipo: "select", recarrega: true, opcoes: TIPOS },
      { k: "avanco", r: "Diâmetro e método de avanço da sondagem (7 f)", se: tubo, ph: "ex.: trado 4\" até 3 m; lavagem 3\"" },
      { k: "cota", r: "Cota da boca do furo, m (7 g)" },
      { k: "revest", r: "Profundidade do revestimento, m (7 h)", se: tubo },
      { k: "naIni", r: "Nível d'água inicial, m (7 l)", ph: "vazio se não encontrado" },
      { k: "na24", r: "Nível d'água após 24 h, m (7 l)" },
      { k: "inicio", r: "Início da sondagem/escavação (7 a)", tipo: "date" },
      { k: "termino", r: "Término (7 a)", tipo: "date" },
    ].concat(CHECK.map(function (c) { return { k: c[0], r: c[2] + " (" + c[1] + ")", tipo: "select", opcoes: SN, se: c[3] }; })),
    padrao: { tipo: "shelby" },
    tabelas: function (d) {
      var t = tipo(d), L = [{ k: "prof", r: "Profundidade do topo da amostra", u: "m" }];
      if (t === "bloco") {
        L = L.concat([
          { k: "aresta", r: "Aresta do bloco (5.1: 30 cm)", u: "cm" },
          { k: "caixa", r: "Aresta interna da caixa de madeira (5.1: 35 cm)", u: "cm" },
          { k: "camadas", r: "Camadas de pano + parafina (1 + 2 repetições)", u: "nº", ph: "3" },
          { calc: "folgaCx", r: "Espaço para serragem em cada lado", u: "cm", casas: 1 },
        ]);
      } else {
        L = L.concat([
          { grupo: "Amostrador" },
          { k: "De", r: "Diâmetro externo De", u: "mm" },
          { k: "Di", r: "Diâmetro interno Di", u: "mm" },
          { k: "Dp", r: "Diâmetro de abertura (bico/sapata) Dp", u: "mm" },
          { calc: "r", r: "Relação de áreas r = (De² − Di²)/Di² × 100 (3.4)", u: "%", casas: 1, destaque: true },
          { calc: "i", r: "Folga interna i = (Di − Dp)/Dp × 100 (3.5)", u: "%", casas: 2, destaque: true },
          { k: "Lt", r: "Comprimento do tubo / camisa", u: "cm" },
        ]);
        if (t === "denison") L.push({ k: "rpm", r: "Velocidade de rotação (5.3: 40 a 125 rpm)", u: "rpm" });
        L = L.concat([
          { grupo: "Amostra (7 m, n)" },
          { k: "pen", r: "Comprimento de penetração do amostrador", u: "cm" },
          { k: "rec", r: "Comprimento recuperado no interior do amostrador", u: "cm" },
          { calc: "recP", r: "Recuperação = recuperado / penetração", u: "%", casas: 0 },
          { calc: "sobra", r: "Tubo − penetração (5 cm na norma)", u: "cm", casas: 1 },
        ]);
      }
      L = L.concat([{ k: "tatil", r: "Análise tátil-visual (7 o)", texto: true }, { grupo: t === "bloco" ? "Etiquetas (5.1)" : "Etiqueta (5.6)" }])
        .concat(ETQ.filter(function (e) { return t === "bloco" || e[0] !== "eNum"; }).map(function (e) { return { k: e[0], r: e[1], texto: true }; }));
      return [{ chave: "am", titulo: "Amostras indeformadas", rotulo: "Amostra", iniciais: 1, min: 1, linhas: L,
        dica: t === "bloco" ? "uma coluna por bloco" : "uma coluna por tubo/camisa; Tabela 1 (Shelby): 50,8 × 1,24; 76,2 × 1,58; 127 × 3,16 mm" }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], t = tipo(d), r = { tipo: t };
      var am = (d.am || []).map(function (x, i) {
        var rot = "Amostra " + (i + 1), o = {};
        if (t === "bloco") {
          var a = num(x.aresta), c = num(x.caixa), n = num(x.camadas);
          o.folgaCx = ok(a) && ok(c) ? (c - a) / 2 : NaN;
          if (ok(a) && Math.abs(a - 30) > 30 * TOL_DIM) avisos.push(rot + ": bloco com " + fmt(a, 0) + " cm de aresta — a norma indica cubo com 30 cm (5.1; critério da ficha ± 10 %).");
          if (ok(c) && Math.abs(c - 35) > 35 * TOL_DIM) avisos.push(rot + ": caixa com " + fmt(c, 0) + " cm de aresta — a norma indica 35 cm (5.1; critério da ficha ± 10 %).");
          if (ok(o.folgaCx) && o.folgaCx <= 0) avisos.push(rot + ": a caixa não comporta o bloco com a serragem (5.1).");
          if (ok(n) && n < 3) avisos.push(rot + ": " + fmt(n, 0) + " camada(s) de pano e parafina — a operação é repetida mais duas vezes (3 camadas) (5.1).");
        } else {
          var De = num(x.De), Di = num(x.Di), Dp = num(x.Dp), Lt = num(x.Lt), pen = num(x.pen), rec = num(x.rec);
          o.r = ok(De) && ok(Di) && Di > 0 ? (De * De - Di * Di) / (Di * Di) * 100 : NaN;
          o.i = ok(Di) && ok(Dp) && Dp > 0 ? (Di - Dp) / Dp * 100 : NaN;
          o.recP = ok(pen) && ok(rec) && pen > 0 ? rec / pen * 100 : NaN;
          o.sobra = ok(Lt) && ok(pen) ? Lt - pen : NaN;
          if (ok(De) && ok(Di) && Di >= De) avisos.push(rot + ": diâmetro interno maior ou igual ao externo — confira.");
          if (t !== "denison") {
            if (ok(o.r) && o.r >= 10) avisos.push(rot + ": relação de áreas de " + fmt(o.r, 1) + " % — deve ser sempre inferior a 10 %, com ótimo em torno de 5 % (5.4).");
            if (t === "shelby" && ok(o.i) && (o.i < 0.5 || o.i > 1.5)) avisos.push(rot + ": folga interna de " + fmt(o.i, 2) + " % — deve ser da ordem de 1 % (5.4; critério da ficha 0,5 a 1,5 %).");
            if (t === "pistao" && ok(o.i) && Math.abs(o.i) > 0.5) avisos.push(rot + ": folga interna de " + fmt(o.i, 2) + " % — no amostrador com pistão deve ser próxima de zero (5.5; critério da ficha ≤ 0,5 %).");
          }
          if (t === "denison") {
            var rpm = num(x.rpm);
            if (ok(rpm) && (rpm < 40 || rpm > 125)) avisos.push(rot + ": rotação de " + fmt(rpm, 0) + " rpm — a velocidade deve ser baixa, de 40 a 125 rpm (5.3).");
          }
          if (ok(o.sobra) && o.sobra < 5 - 0.5) avisos.push(rot + ": amostra de " + fmt(pen, 1) + " cm em tubo/camisa de " + fmt(Lt, 1) + " cm — o comprimento da amostra deve ser 5 cm menor que o " + (t === "denison" ? "da camisa (5.3)" : "do tubo (5.4 e 5.5)") + ".");
          if (ok(rec) && ok(pen) && rec > pen) avisos.push(rot + ": comprimento recuperado maior que a penetração — confira (7 m e n).");
          if (ok(o.recP) && o.recP < 90) avisos.push(rot + ": recuperação de " + fmt(o.recP, 0) + " % — amostra possivelmente perturbada ou perdida no alçamento; registre no boletim (a norma não fixa mínimo).");
        }
        var falta = ETQ.filter(function (e) { return (t === "bloco" || e[0] !== "eNum") && !String(x[e[0]] || "").trim(); }).map(function (e) { return e[1]; });
        o.falta = falta.length;
        if (falta.length) avisos.push(rot + ": etiqueta sem " + falta.join("; ") + " (" + (t === "bloco" ? "5.1" : "5.6") + ").");
        return o;
      });
      var ni = num(P.naIni), n24 = num(P.na24);
      if (ok(ni) && !ok(n24)) avisos.push("Nível d'água encontrado: anote também a leitura após 24 h (7 l).");
      var chk = { feitos: 0, total: 0, pend: [], nao: 0 };
      CHECK.forEach(function (c) {
        if (!c[3](d)) return;
        chk.total++;
        if (P[c[0]] === "sim") chk.feitos++;
        else if (P[c[0]] === "nao") { chk.nao++; avisos.push("Não atendido (" + c[1] + "): " + c[2] + "."); }
        else chk.pend.push(c[1]);
      });
      var o0 = am[0] || {};
      r.r0 = o0.r; r.i0 = o0.i; r.rec0 = o0.recP; r.n = am.length; r.chk = chk; r.nAvisos = avisos.length;
      return { tab: { am: am }, resultados: r, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados, c = r.chk;
      function cx(v, rot) { return '<div class="fe-res-item"><div class="fe-res-v">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var st = r.nAvisos ? '<span class="fe-nok">' + r.nAvisos + " verificação(ões) com aviso</span>" : c.pend.length ? "itens pendentes: " + esc(c.pend.join(", ")) : '<span class="fe-ok">conforme a norma</span>';
      var h = cx(fmt(r.n, 0), "Amostras registradas · " + st);
      if (r.tipo !== "bloco") h += cx(fmt(r.r0, 1) + " <small>%</small>", "Relação de áreas (amostra 1; < 10 %)") + cx(fmt(r.i0, 2) + " <small>%</small>", "Folga interna (amostra 1)") +
        cx(fmt(r.rec0, 0) + " <small>%</small>", "Recuperação (amostra 1)");
      return '<div class="fe-res">' + h + cx(c.feitos + " / " + c.total, "Procedimentos confirmados") + "</div>";
    },
    relatorio: {
      notas: "Coleta conforme a DNER-PRO 002/94. Relação de áreas r = (De² − Di²)/Di² × 100 (3.4) e folga interna i = (Di − Dp)/Dp × 100 (3.5; a norma chama Di de \"diâmetro externo\" na legenda — adotado o interno, coerente com 3.4). Parede fina: r < 10 % (ótimo ≈ 5 %), i ≈ 1 % (5.4); com pistão, i ≈ 0 (5.5). Amostra 5 cm menor que o tubo ou a camisa; Denison a 40–125 rpm; bloco cúbico de 30 cm em caixa de 35 cm com três camadas de pano e parafina. Critérios da ficha: dimensões ± 10 %, folga ≈ 1 % entre 0,5 e 1,5 %, ≈ 0 até 0,5 %, recuperação < 90 % sinalizada.",
      resultados: function (calc, d) {
        var r = calc.resultados, rows = [];
        (d.am || []).forEach(function (x, i) {
          var o = calc.tab.am[i];
          rows.push(["Amostra " + (i + 1) + " — " + (x.prof ? x.prof + " m" : "prof. —"), r.tipo === "bloco" ? "bloco " + (x.aresta || "—") + " cm · caixa " + (x.caixa || "—") + " cm" :
            "r = " + fmt(o.r, 1) + " % · i = " + fmt(o.i, 2) + " % · recuperação " + fmt(o.recP, 0) + " %"]);
        });
        rows.push(["Verificações", r.nAvisos ? r.nAvisos + " aviso(s)" : "sem avisos"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Argila mole — dois tubos Shelby de 76,2 mm", dados: function () {
        var e = { eObra: "Obra A", eLocal: "Aterro da ponte — BR-000", eFuro: "SP-03", eLoc: "Est. 120 + 10, eixo" };
        return { ident: { registro: "EX-AI-001", data: "2025-05-20", obra: "Obra A", local: "Est. 120 + 10", camada: "Argila orgânica mole", responsavel: "Engenheiro A" },
          params: { tipo: "shelby", avanco: "Trado 4\" até 2,0 m; lavagem com revestimento 3\"", cota: "12,35", revest: "3,00", naIni: "1,20", na24: "1,05", inicio: "2025-05-19", termino: "2025-05-20",
            chkFuro: "sim", chkOleo: "sim", chkNA: "sim", chkCrav: "sim", chkPontas: "sim", chkTopo: "sim", chkCaixa: "sim", chkAvisos: "sim", chkAbrigo: "sim" },
          am: [Object.assign({ prof: "3,00", De: "76,2", Di: "73,0", Dp: "72,3", Lt: "70", pen: "65", rec: "63", tatil: "Argila siltosa cinza-escura, muito mole", eProf: "3,00 a 3,65 m" }, e),
            Object.assign({ prof: "4,50", De: "76,2", Di: "73,0", Dp: "72,3", Lt: "70", pen: "65", rec: "61", tatil: "Argila siltosa cinza, mole, com conchas", eProf: "4,50 a 5,15 m" }, e)] };
      } },
      { nome: "Tubo de 50,8 mm com parede grossa e cravação até o fim do tubo", dados: function () {
        return { ident: { registro: "EX-AI-002", data: "2025-06-02", obra: "Obra B", local: "Est. 45", camada: "Argila siltosa" },
          params: { tipo: "shelby", avanco: "Lavagem 2 1/2\"", cota: "8,10", naIni: "0,80", na24: "",
            chkFuro: "sim", chkOleo: "nao", chkNA: "sim", chkCrav: "nao", chkPontas: "sim", chkTopo: "sim", chkCaixa: "sim", chkAvisos: "" },
          am: [{ prof: "2,00", De: "50,8", Di: "46,0", Dp: "44,6", Lt: "60", pen: "59", rec: "48", tatil: "Argila siltosa marrom", eObra: "Obra B", eLocal: "Rua A", eFuro: "SP-01", eLoc: "", eProf: "2,00 m" }] };
      } },
    ],
  };
})();
