/*
 * Ficha: DNIT 405/2017-ME — Controle de compactação em aterros com o gamadensímetro.
 * Registra-se no motor de site/fichas.js (window.FE).
 * Aferição diária no bloco padronizado (seção 8: |Ns − N0| ≤ 2,0 √(N0/F)), leituras por ponto (diretas ou em
 * contagens convertidas pelas curvas de calibração, 9.2/9.3), teor de umidade w = Mm / (ρT − Mm) × 100 (11.1),
 * ρS = ρT / (1 + w), γS = ρS · g (11.2), grau de compactação em relação ao ensaio de laboratório (11.3) e
 * precisão opcional (Anexo B: P = σ / S).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var G = 9.81;  // aceleração da gravidade (m/s²) para γS = ρS · g
  var NLEIT = 3;  // leituras por ponto (9.2/9.3: "uma ou mais leituras"; 10: leituras adicionais → média)

  var METODOS_UMID = [["aparelho", "Pelo gamadensímetro — Mm (11.1)"], ["lab", "Amostra representativa — estufa (DNIT 456, 5.2)"],
    ["frigideira", "Amostra representativa — frigideira (DNIT 456, 5.1.1)"], ["speedy", "Amostra representativa — \"Speedy\" (DNIT 456, 5.1.2)"]];

  function fatorU(P) { return P.unidade === "gcm3" ? 1000 : 1; }  // leituras → kg/m³
  function contagens(P) { return P.leitura === "contagens"; }
  function aplicarLab(e, P) {
    var r = e.resultados || {}, i = (e.dados || {}).ident || {};
    if (ok(r.gsMax)) P.meLab = fmt(r.gsMax, 3);
    if (ok(r.hOt)) P.hOt = fmt(r.hOt, 1);
    P.labRegistro = (i.registro || "") + (i.origem ? " · " + i.origem : "") + (i.data ? " · " + i.data.split("-").reverse().join("/") : "");
  }
  function meses(de, ate) {  // datas ISO (aaaa-mm-dd)
    var a = new Date(de), b = new Date(ate);
    if (isNaN(a) || isNaN(b)) return NaN;
    return (b - a) / (1000 * 3600 * 24 * 30.44);
  }
  function leituras(p, pref) {
    var v = [];
    for (var j = 1; j <= NLEIT; j++) { var x = num(p[pref + j]); if (ok(x)) v.push(x); }
    return v;
  }

  FE.FICHAS["dnit-405-2017-me"] = {
    titulo: "Controle de compactação em aterros com o gamadensímetro",
    rotuloImportar: function (r) { return "GC médio " + (ok(r.gcMedio) ? fmt(r.gcMedio, 1) + " %" : "—") + " · " + ((r.pts || []).length || "?") + " ponto(s)"; },
    resumo: "Aferição diária no bloco padronizado (|Ns − N0| ≤ 2,0 √(N0/F), seção 8), leituras por ponto (diretas ou contagens pelas curvas de calibração), w = Mm / (ρT − Mm) × 100, ρS = ρT / (1 + w), γS = ρS · g e grau de compactação (seção 11).",
    blocos: ["umidade"],
    params: [
      { k: "metodo", r: "Método (seção 4)", tipo: "select", recarrega: true,
        opcoes: [["transmissao", "Transmissão direta — sonda no furo (4 b, 9.3)"], ["retro", "Retrodispersão — fonte e detector na superfície (4 a, 9.2)"]] },
      { k: "equipamento", r: "Equipamento — marca, modelo e nº de série (12 c)" },
      { k: "leitura", r: "Forma das leituras (9.2 e 9.3)", tipo: "select", recarrega: true,
        opcoes: [["direta", "Valores diretos do aparelho — ρT e Mm"], ["contagens", "Contagens por minuto — convertidas pelas curvas de calibração"]] },
      { k: "unidade", r: "Unidade dos valores de ρT e Mm (leituras diretas ou curvas)", tipo: "select",
        opcoes: [["kgm3", "kg/m³"], ["gcm3", "g/cm³"]] },
      { k: "curvaRef", r: "Abscissa das curvas de calibração", tipo: "select",
        opcoes: [["cpm", "Contagem (cpm)"], ["cr", "Razão de contagem N / Ns (aferição do dia, seção 8)"]],
        dica: "com a razão de contagem, a curva compensa o envelhecimento da fonte usando a média Ns da aferição do dia",
        se: function (d) { return contagens(d.params || {}); } },
      { k: "curvaDens", r: "Curva de calibração da densidade total (contagem = ρT)", ph: "0,55=2350; 0,75=2070; 0,95=1840",
        dica: "pares separados por ponto e vírgula (Anexo A, A.2: tabela); interpolação linear entre os pares",
        se: function (d) { return contagens(d.params || {}); } },
      { k: "curvaUmid", r: "Curva de calibração da umidade (contagem = Mm)", ph: "0,10=60; 0,30=205; 0,50=355",
        se: function (d) { var P = d.params || {}; return contagens(P) && (P.umid || "aparelho") === "aparelho"; } },
      { k: "dataCurva", r: "Data da última verificação das curvas de calibração", tipo: "date",
        dica: "as curvas devem ser verificadas ao menos a cada 12 meses ou após reparos (A.3)" },
      { k: "N0d", r: "N0 — contagem-padrão de densidade do bloco (cpm)", dica: "média de dez leituras previamente estabelecida (seção 8)" },
      { k: "N0u", r: "N0 — contagem-padrão de umidade do bloco (cpm)" },
      { k: "F", r: "F — fator de escala (fornecido pelo fabricante)", dica: "limite da aferição: |Ns − N0| ≤ 2,0 √(N0 / F)" },
      { k: "umid", r: "Teor de umidade (11.1)", tipo: "select", recarrega: true, opcoes: METODOS_UMID,
        dica: "se o aparelho não registra Mm, a umidade vem de ensaio sobre amostra representativa" },
      { k: "curvaSp", r: "Curva de calibração do Speedy (kPa = %)", ph: "20=2,5; 50=6,1; 100=12,0",
        se: function (d) { return (d.params || {}).umid === "speedy"; } },
      { k: "importar", r: "Referência de laboratório: buscar compactação salva", tipo: "importar", de: "dnit-164-2013-me", aplicar: aplicarLab },
      { k: "meLab", r: "Massa específica aparente seca máxima de laboratório (g/cm³)", dica: "ou a de projeto (11.3)" },
      { k: "hOt", r: "Umidade ótima do laboratório (%)" },
      { k: "labRegistro", r: "Ensaio de compactação de referência" },
      { k: "gcMin", r: "Grau de compactação mínimo exigido (%) — opcional", dica: "da especificação de serviço" },
      { k: "prec", r: "Precisão do equipamento (Anexo B)", tipo: "select", recarrega: true,
        opcoes: [["nao", "Não verificar"], ["sim", "Verificar — P = σ / S"]] },
      { k: "nPrec", r: "Nº de leituras repetidas sem mover o aparelho", dica: "mínimo 20 (B.2)", se: function (d) { return (d.params || {}).prec === "sim"; } },
      { k: "sdD", r: "σ das contagens de densidade (cpm)", se: function (d) { return (d.params || {}).prec === "sim"; } },
      { k: "sD", r: "S — inclinação da curva de densidade (cpm por kg/m³, em módulo)", se: function (d) { return (d.params || {}).prec === "sim"; } },
      { k: "sdU", r: "σ das contagens de umidade (cpm)", se: function (d) { return (d.params || {}).prec === "sim"; } },
      { k: "sU", r: "S — inclinação da curva de umidade (cpm por kg/m³)", se: function (d) { return (d.params || {}).prec === "sim"; } },
    ],
    padrao: { metodo: "transmissao", leitura: "direta", unidade: "kgm3", curvaRef: "cpm", umid: "aparelho", prec: "nao" },
    tabelas: function (d) {
      var P = d.params || {}, cont = contagens(P), um = P.umid || "aparelho", un = P.unidade === "gcm3" ? "g/cm³" : "kg/m³";
      var linhas = [
        { k: "estaca", r: "Estaca / local", texto: true },
        { k: "posicao", r: "Posição (LE / eixo / LD)", texto: true },
        { k: "cota", r: "Camada / cota", texto: true },
      ];
      if (P.metodo !== "retro") linhas.push({ k: "profS", r: "Profundidade da sonda (12 d)", u: "cm" },
        { k: "profF", r: "Profundidade da perfuração (≥ sonda + 5 cm, 9.3)", u: "cm" });
      linhas.push({ grupo: "Leituras de 1 minuto (9.2 / 9.3) — " + (cont ? "contagens por minuto" : "valores diretos do aparelho") });
      for (var j = 1; j <= NLEIT; j++) linhas.push({ k: "rd" + j, r: (cont ? "Contagem de densidade" : "Densidade total ρT") + " — leitura " + j, u: cont ? "cpm" : un });
      if (um === "aparelho") for (var k = 1; k <= NLEIT; k++) linhas.push({ k: "ru" + k, r: (cont ? "Contagem de umidade" : "Massa de água por volume Mm") + " — leitura " + k, u: cont ? "cpm" : un });
      if (cont) {
        linhas.push({ calc: "Nd", r: "Contagem média de densidade", u: "cpm", casas: 0 });
        if (um === "aparelho") linhas.push({ calc: "Nu", r: "Contagem média de umidade", u: "cpm", casas: 0 });
      }
      linhas.push({ calc: "rhoT", r: "ρT — densidade total (média" + (cont ? ", pela curva" : "") + ")", u: "kg/m³", casas: 0 });
      if (um === "aparelho") linhas.push({ calc: "Mm", r: "Mm — massa de água por volume (média" + (cont ? ", pela curva" : "") + ")", u: "kg/m³", casas: 0 });
      else linhas = linhas.concat([{ grupo: "Umidade de amostra representativa — bloco Teor de umidade, DNIT 456-ME (11.1)" }])
        .concat(FE.BLOCOS.umidade.linhas("u", "", um));
      linhas.push({ grupo: "Resultados (seção 11)" },
        { calc: "w", r: um === "aparelho" ? "w = Mm / (ρT − Mm) × 100 (11.1)" : "w — da amostra (DNIT 456)", u: "%", casas: 1, destaque: true },
        { calc: "rhoS", r: "ρS = ρT / (1 + w) (11.2)", u: "kg/m³", casas: 0 },
        { calc: "meas", r: "Massa específica aparente seca (ρS)", u: "g/cm³", casas: 3, destaque: true },
        { calc: "gS", r: "γS = ρS · g (11.2)", u: "kN/m³", casas: 2 },
        { calc: "GC", r: "Grau de compactação = ρS / ρS,lab × 100 (11.3)", u: "%", casas: 1, destaque: true },
        { calc: "dw", r: "Desvio de umidade (w − h ótima)", u: "p.p.", casas: 1 });
      return [
        { chave: "afer", titulo: "Aferição diária no bloco padronizado (seção 8)", rotulo: "Leitura", iniciais: 4, min: 4,
          dica: "pelo menos quatro leituras repetidas de 1 minuto sobre o bloco de referência, no início de cada dia",
          linhas: [{ k: "Nd", r: "Contagem de densidade", u: "cpm" }, { k: "Nu", r: "Contagem de umidade", u: "cpm" }] },
        { chave: "pts", titulo: "Pontos ensaiados", rotulo: "Ponto", iniciais: 3, min: 1,
          dica: "uma coluna por ponto; célula afastada ≥ 250 mm de objetos verticais e outras fontes a ≥ 10 m (9.1, 9.3)", linhas: linhas },
      ];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], cont = contagens(P), um = P.umid || "aparelho", fu = fatorU(P);
      // ---- aferição (seção 8) ----
      var F = num(P.F);
      function afer(chave, N0, nome) {
        var v = (d.afer || []).map(function (a) { return num(a[chave]); }).filter(ok);
        var o = { n: v.length, Ns: media(v), N0: N0, lim: ok(N0) && ok(F) && F > 0 ? 2 * Math.sqrt(N0 / F) : NaN };
        o.dif = ok(o.Ns) && ok(N0) ? Math.abs(o.Ns - N0) : NaN;
        o.ok = ok(o.dif) && ok(o.lim) ? o.dif <= o.lim : null;
        if (o.n && o.n < 4) avisos.push("Aferição de " + nome + ": " + o.n + " leitura(s); a norma pede pelo menos quatro leituras de 1 minuto (seção 8).");
        if (o.n && !ok(N0)) avisos.push("Informe N0 de " + nome + " (contagem-padrão do bloco) para verificar a aferição.");
        if (o.n && ok(N0) && !ok(o.lim)) avisos.push("Informe o fator de escala F (fabricante) para calcular o limite da aferição.");
        if (o.ok === false) avisos.push("Aferição de " + nome + " fora do limite: |Ns − N0| = " + fmt(o.dif, 1) + " cpm > 2,0 √(N0/F) = " + fmt(o.lim, 1) +
          " cpm. Aguarde mais aquecimento e afaste fontes de interferência; se a segunda tentativa falhar, o equipamento não está apto (seção 8).");
        return o;
      }
      var afD = afer("Nd", num(P.N0d), "densidade");
      var afU = um === "aparelho" ? afer("Nu", num(P.N0u), "umidade") : null;
      if (!(d.afer || []).some(function (a) { return ok(num(a.Nd)) || ok(num(a.Nu)); }))
        avisos.push("Sem aferição do dia: ela deve ser feita no bloco padronizado antes dos ensaios (seção 8 e 9).");

      // ---- curvas de calibração ----
      var curvaD = FE.curvaSpeedy(P.curvaDens), curvaU = FE.curvaSpeedy(P.curvaUmid), cr = P.curvaRef === "cr";
      if (cont && curvaD.length < 2) avisos.push("Cadastre a curva de calibração da densidade (pelo menos dois pares contagem = ρT).");
      if (cont && um === "aparelho" && curvaU.length < 2) avisos.push("Cadastre a curva de calibração da umidade (pelo menos dois pares contagem = Mm).");
      if (cont && cr && (!ok(afD.Ns) || (afU && !ok(afU.Ns)))) avisos.push("Curvas em razão de contagem: preencha a aferição do dia (Ns) para calcular N / Ns.");
      var dataEns = (d.ident || {}).data || new Date().toISOString().slice(0, 10);
      var m = P.dataCurva ? meses(P.dataCurva, dataEns) : NaN;
      if (ok(m) && m > 12) avisos.push("Curvas de calibração verificadas há " + fmt(m, 0) + " meses: a verificação deve ser feita ao menos a cada 12 meses (A.3).");
      if (!P.dataCurva) avisos.push("Informe a data da última verificação das curvas de calibração (A.3; o relatório deve trazê-las, 12 g).");
      function converte(N, curva, Ns) {
        if (!ok(N)) return NaN;
        var x = cr ? (ok(Ns) && Ns > 0 ? N / Ns : NaN) : N;
        return FE.interpolar(curva, x) * fu;
      }

      // ---- pontos ----
      var meLab = num(P.meLab), hOt = num(P.hOt), gcMin = num(P.gcMin), curvaSp = FE.curvaSpeedy(P.curvaSp);
      var pts = (d.pts || []).map(function (p, i) {
        var rot = "Ponto " + (i + 1) + (p.estaca ? " (" + p.estaca + ")" : ""), o = {}, msgs = [];
        var vd = leituras(p, "rd"), vu = leituras(p, "ru");
        if (cont) {
          o.Nd = media(vd);
          o.rhoT = converte(o.Nd, curvaD, afD.Ns);
          if (ok(o.Nd) && curvaD.length >= 2 && !ok(o.rhoT)) msgs.push("contagem de densidade fora do intervalo da curva de calibração");
          if (um === "aparelho") {
            o.Nu = media(vu);
            o.Mm = converte(o.Nu, curvaU, afU ? afU.Ns : NaN);
            if (ok(o.Nu) && curvaU.length >= 2 && !ok(o.Mm)) msgs.push("contagem de umidade fora do intervalo da curva de calibração");
          }
        } else {
          o.rhoT = vd.length ? media(vd) * fu : NaN;
          if (um === "aparelho") o.Mm = vu.length ? media(vu) * fu : NaN;
        }
        if (um === "aparelho") {
          o.w = ok(o.rhoT) && ok(o.Mm) && o.rhoT > o.Mm ? o.Mm / (o.rhoT - o.Mm) * 100 : NaN;  // 11.1
        } else {
          var u = FE.BLOCOS.umidade.calcular(p, "u", um, curvaSp);
          o.uW = u.w; o.w = u.w;
          if (u.aviso) msgs.push(u.aviso);
        }
        o.rhoS = ok(o.rhoT) && ok(o.w) ? o.rhoT / (1 + o.w / 100) : NaN;  // 11.2 (w sem porcentagem)
        o.meas = o.rhoS / 1000;
        o.gS = o.rhoS * G / 1000;
        o.GC = ok(o.rhoS) && ok(meLab) && meLab > 0 ? o.rhoS / (meLab * 1000) * 100 : NaN;
        o.dw = ok(o.w) && ok(hOt) ? o.w - hOt : NaN;
        if (P.unidade !== "gcm3" && ok(o.rhoT) && o.rhoT < 100) msgs.push("ρT = " + fmt(o.rhoT, 3) + " kg/m³ — as leituras parecem estar em g/cm³ (troque a unidade)");
        var nL = vd.length;
        if (nL && nL < 2 && P.metodo === "retro") msgs.push("retrodispersão com uma só leitura: com partículas ou vazios grandes, faça leituras adicionais adjacentes e use a média (seção 10)");
        if (P.metodo !== "retro") {
          var pS = num(p.profS), pF = num(p.profF);
          if (ok(pS) && ok(pF) && pF < pS + 5) msgs.push("perfuração de " + fmt(pF, 0) + " cm para sonda a " + fmt(pS, 0) + " cm: deve ser pelo menos 5 cm mais profunda (9.3)");
          if (ok(o.rhoT) && !ok(pS)) msgs.push("informe a profundidade da sonda (12 d)");
        }
        if (ok(o.GC) && ok(gcMin) && o.GC < gcMin) msgs.push("GC = " + fmt(o.GC, 1) + " %, abaixo do mínimo exigido de " + fmt(gcMin, 1) + " %");
        if (msgs.length) avisos.push(rot + ": " + msgs.join("; ") + ".");
        o.estaca = p.estaca || ""; o.posicao = p.posicao || "";
        o.conforme = ok(o.GC) && ok(gcMin) ? o.GC >= gcMin : null;
        return o;
      });
      if (pts.some(function (o) { return ok(o.rhoS); }) && !ok(meLab)) avisos.push("Informe a massa específica aparente seca máxima de laboratório (ou busque uma compactação salva) para o grau de compactação (11.3).");

      // ---- precisão (Anexo B) ----
      var prec = null;
      if (P.prec === "sim") {
        var sdD = num(P.sdD), sD = Math.abs(num(P.sD)), sdU = num(P.sdU), sU = Math.abs(num(P.sU)), nP = num(P.nPrec);
        prec = { Pd: ok(sdD) && sD > 0 ? sdD / sD : NaN, Pu: ok(sdU) && sU > 0 ? sdU / sU : NaN, limD: P.metodo === "retro" ? 10 : 5 };
        if (ok(nP) && nP < 20) avisos.push("Precisão: " + fmt(nP, 0) + " leituras repetidas; o desvio-padrão deve vir de pelo menos 20 (B.2).");
        if (ok(prec.Pd) && prec.Pd >= prec.limD) avisos.push("Precisão de densidade P = " + fmt(prec.Pd, 1) + " kg/m³, não inferior a " + prec.limD +
          " kg/m³ (" + (P.metodo === "retro" ? "retrodispersão" : "transmissão direta a 15 cm") + ", B.3): refazer a calibração.");
        if (ok(prec.Pu) && prec.Pu >= 4.8) avisos.push("Precisão de umidade P = " + fmt(prec.Pu, 1) + " kg/m³, não inferior a 4,8 kg/m³ (B.4): refazer a calibração.");
      }
      return { tab: { afer: [], pts: pts }, pontos: pts,
        resultados: { afD: afD, afU: afU, meLab: meLab, hOt: hOt, gcMin: gcMin, prec: prec, pts: pts,
          gcMedio: media(pts.map(function (o) { return o.GC; })), wMedio: media(pts.map(function (o) { return o.w; })) }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      function sit(a) { return a.ok === null ? "" : a.ok ? ' · <span class="fe-ok">satisfatória</span>' : ' · <span class="fe-nok">fora do limite</span>'; }
      function cx(v, rot, p) { return '<div class="fe-res-item"><div class="fe-res-v' + (p ? " fe-res-p" : "") + '">' + v + '</div><div class="fe-res-r">' + rot + "</div></div>"; }
      var h = '<div class="fe-res">' +
        cx(fmt(r.afD.Ns, 0) + " <small>cpm</small>", "Aferição — densidade: Ns (N0 = " + fmt(r.afD.N0, 0) + ", limite ± " + fmt(r.afD.lim, 1) + ")" + sit(r.afD), true) +
        (r.afU ? cx(fmt(r.afU.Ns, 0) + " <small>cpm</small>", "Aferição — umidade: Ns (N0 = " + fmt(r.afU.N0, 0) + ", limite ± " + fmt(r.afU.lim, 1) + ")" + sit(r.afU), true) : "") +
        cx(fmt(r.meLab, 3) + " <small>g/cm³</small>", "Referência de laboratório · h ótima " + fmt(r.hOt, 1) + " %", true) +
        cx(fmt(r.gcMedio, 1) + " <small>%</small>", "Grau de compactação médio" + (ok(r.gcMin) ? " · mínimo " + fmt(r.gcMin, 1) + " %" : ""));
      if (r.prec) h += cx(fmt(r.prec.Pd, 1) + " / " + fmt(r.prec.Pu, 1) + " <small>kg/m³</small>", "Precisão P = σ/S — densidade (< " + r.prec.limD + ") / umidade (< 4,8), Anexo B", true);
      h += "</div>";
      var linhas = r.pts.map(function (o, i) {
        var s = o.conforme === null ? "—" : o.conforme ? '<span class="fe-ok">conforme</span>' : '<span class="fe-nok">abaixo do mínimo</span>';
        return "<tr><td>" + (i + 1) + "</td><td>" + esc(o.estaca) + "</td><td>" + esc(o.posicao) + "</td><td>" + fmt(o.rhoT, 0) + "</td><td>" + fmt(o.w, 1) +
          "</td><td>" + fmt(o.meas, 3) + "</td><td>" + fmt(o.gS, 2) + "</td><td><b>" + fmt(o.GC, 1) + "</b></td><td>" + s + "</td></tr>";
      }).join("");
      return h + '<table class="fe-resumo"><thead><tr><th>Ponto</th><th>Estaca</th><th>Posição</th><th>ρT (kg/m³)</th><th>w (%)</th><th>ρS (g/cm³)</th><th>γS (kN/m³)</th><th>GC (%)</th><th>Situação</th></tr></thead><tbody>' +
        linhas + "</tbody></table>";
    },
    relatorio: {
      notas: "Aferição: |Ns − N0| ≤ 2,0 √(N0/F), com Ns = média de pelo menos quatro leituras de 1 min no bloco (seção 8). Leituras em contagens: a média das contagens do ponto é convertida pela curva de calibração (interpolação linear; em razão de contagem, N/Ns da aferição do dia). " +
        "w = Mm / (ρT − Mm) × 100 (11.1); ρS = ρT / (1 + w) e γS = ρS · g, com g = 9,81 m/s² (11.2); grau de compactação = ρS / ρS,lab × 100 (11.3). Radioproteção conforme CNEN NN 3.01 (seção 5).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {};
        function af(a) { return a ? "Ns = " + fmt(a.Ns, 1) + " cpm; N0 = " + fmt(a.N0, 0) + "; |Ns − N0| = " + fmt(a.dif, 1) + " ≤ " + fmt(a.lim, 1) + "? " + (a.ok === null ? "—" : a.ok ? "SIM — satisfatória" : "NÃO — fora do limite") : "—"; }
        var rows = [["Método", P.metodo === "retro" ? "Retrodispersão" : "Transmissão direta"], ["Aferição do dia — densidade", af(r.afD)]];
        if (r.afU) rows.push(["Aferição do dia — umidade", af(r.afU)]);
        rows.push(["Referência de laboratório / umidade ótima", fmt(r.meLab, 3) + " g/cm³ / " + fmt(r.hOt, 1) + " %"]);
        r.pts.forEach(function (o, i) {
          rows.push(["Ponto " + (i + 1) + (o.estaca ? " — " + o.estaca : "") + (o.posicao ? " (" + o.posicao + ")" : ""),
            "w = " + fmt(o.w, 1) + " % · ρS = " + fmt(o.meas, 3) + " g/cm³ · γS = " + fmt(o.gS, 2) + " kN/m³ · GC = " + fmt(o.GC, 1) + " %" +
            (o.conforme === null ? "" : o.conforme ? " · conforme" : " · ABAIXO DO MÍNIMO")]);
        });
        if (r.prec) rows.push(["Precisão (Anexo B)", "densidade " + fmt(r.prec.Pd, 1) + " kg/m³; umidade " + fmt(r.prec.Pu, 1) + " kg/m³"]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Aterro — transmissão direta a 20 cm, leituras diretas, referência Proctor normal (dados gerados)", dados: function () {
        var F164 = FE.FICHAS["dnit-164-2013-me"], ref = F164.calcular(F164.exemplos[1].dados()).resultados;
        var meLab = Math.round(ref.gsMax * 1000) / 1000, hOt = Math.round(ref.hOt * 10) / 10;
        // [estaca, posição, GC alvo, w alvo]
        var alvo = [["210", "LD", 101.2, 21.6], ["212", "eixo", 100.4, 22.3], ["214", "LE", 102.1, 21.1], ["216", "eixo", 100.8, 22.8]];
        var dv = [[-4, 3, 1], [2, -3, 1], [5, -2, -3], [-1, 3, -2]], du = [[1, -1, 0], [-2, 1, 1], [0, 1, -1], [2, -1, -1]];
        return { ident: { registro: "EX-GD-001", data: "2026-08-18", obra: "Obra A", trecho: "BR-000 — km 20 ao km 21", camada: "Corpo de aterro — 4ª camada", origem: "Jazida 1", laboratorista: "Equipe de campo" },
          params: { metodo: "transmissao", equipamento: "Gamadensímetro — modelo X, nº de série 0000", leitura: "direta", unidade: "kgm3", curvaRef: "cpm",
            dataCurva: "2026-03-10", N0d: "2840", N0u: "680", F: "16", umid: "aparelho", importar: "ex:dnit-164-2013-me:1",
            meLab: FE.fmt(meLab, 3), hOt: FE.fmt(hOt, 1), labRegistro: "EX-002 · Corte km 12 (exemplo Proctor normal)", gcMin: "100", prec: "nao" },
          afer: [{ Nd: "2845", Nu: "684" }, { Nd: "2831", Nu: "676" }, { Nd: "2852", Nu: "690" }, { Nd: "2838", Nu: "681" }],
          pts: alvo.map(function (a, i) {
            var rs = a[2] / 100 * meLab * 1000, rt = rs * (1 + a[3] / 100), mm = rt - rs, p = { estaca: a[0], posicao: a[1], cota: "4ª camada", profS: "20", profF: "25" };
            for (var j = 0; j < 3; j++) { p["rd" + (j + 1)] = String(Math.round(rt + dv[i][j])); p["ru" + (j + 1)] = String(Math.round(mm + du[i][j])); }
            return p;
          }) };
      } },
      { nome: "Camada final — retrodispersão, contagens e curvas de calibração, aferição de umidade fora do limite (dados gerados)", dados: function () {
        var F164 = FE.FICHAS["dnit-164-2013-me"], ref = F164.calcular(F164.exemplos[1].dados()).resultados;
        var meLab = Math.round(ref.gsMax * 1000) / 1000, hOt = Math.round(ref.hOt * 10) / 10;
        var cD = "0,55=2350; 0,65=2200; 0,75=2070; 0,85=1950; 0,95=1840; 1,05=1740", cU = "0,10=60; 0,20=130; 0,30=205; 0,40=280; 0,50=355; 0,60=430; 0,70=505";
        var afer = [[2848, 700], [2836, 705], [2851, 698], [2841, 703]];
        var NsD = media(afer.map(function (x) { return x[0]; })), NsU = media(afer.map(function (x) { return x[1]; }));
        function inv(curva, y) {  // abscissa da curva para um valor y (interpolação inversa)
          var c = FE.curvaSpeedy(curva);
          for (var i = 1; i < c.length; i++) {
            var a = c[i - 1], b = c[i];
            if ((y - a[1]) * (y - b[1]) <= 0) return a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]);
          }
          return NaN;
        }
        var alvo = [["305", "LD", 100.9, 22.4], ["307", "eixo", 96.2, 24.6], ["309", "LE", 101.5, 21.8]];
        var dv = [[-6, 4, 2], [5, -3, -2], [-2, 6, -4]], du = [[3, -2, -1], [-4, 2, 2], [1, -3, 2]];
        return { ident: { registro: "EX-GD-002", data: "2026-09-15", obra: "Obra B", trecho: "Rua A", camada: "Camada final de terraplenagem", origem: "Jazida 1" },
          params: { metodo: "retro", equipamento: "Gamadensímetro — modelo X, nº de série 0000", leitura: "contagens", unidade: "kgm3", curvaRef: "cr",
            curvaDens: cD, curvaUmid: cU, dataCurva: "2025-07-02", N0d: "2840", N0u: "680", F: "16", umid: "aparelho", importar: "ex:dnit-164-2013-me:1",
            meLab: FE.fmt(meLab, 3), hOt: FE.fmt(hOt, 1), labRegistro: "EX-002 · Corte km 12 (exemplo Proctor normal)", gcMin: "100",
            prec: "sim", nPrec: "20", sdD: "9,5", sD: "1,15", sdU: "3,1", sU: "0,95" },
          obs: "Aferição de umidade repetida após 15 min de aquecimento adicional com o mesmo resultado: umidade conferida por amostra (Speedy) antes de liberar a camada.",
          afer: afer.map(function (x) { return { Nd: String(x[0]), Nu: String(x[1]) }; }),
          pts: alvo.map(function (a, i) {
            var rs = a[2] / 100 * meLab * 1000, rt = rs * (1 + a[3] / 100), mm = rt - rs, p = { estaca: a[0], posicao: a[1], cota: "camada final" };
            var nd = inv(cD, rt) * NsD, nu = inv(cU, mm) * NsU;
            for (var j = 0; j < 3; j++) { p["rd" + (j + 1)] = String(Math.round(nd + dv[i][j])); p["ru" + (j + 1)] = String(Math.round(nu + du[i][j])); }
            return p;
          }) };
      } },
    ],
  };
})();
