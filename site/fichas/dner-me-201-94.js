/*
 * Ficha: DNER-ME 201/94 — Solo-cimento — Compressão axial de corpos-de-prova cilíndricos.
 * Registra-se no motor de site/fichas.js (window.FE).
 */
(function () {
  "use strict";
  var FE = window.FE, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc, media = FE.media;
  var G = 9.80665;

  var CARGAS = [["N", "N"], ["kN", "kN"], ["kgf", "kgf (1 kgf = 9,80665 N)"], ["tf", "tf (1 tf = 9,80665 kN)"]];
  var FATOR = { N: 1, kN: 1000, kgf: G, tf: 1000 * G };

  FE.FICHAS["dner-me-201-94"] = {
    titulo: "Solo-cimento — Compressão axial de corpos de prova cilíndricos",
    resumo: "CPs moldados pela DNER-ME 202 (Ø 100 mm × 127,3 mm), curados em câmara úmida e imersos 4 h; resistência = carga de ruptura (precisão de 50 N) / área da seção, com aproximação de 10 kPa (7.1).",
    blocos: [],
    params: [
      { k: "mistura", r: "Mistura", ph: "ex.: solo A-2-4 + 6 % de cimento CP II-E-32" },
      { k: "finalidade", r: "Finalidade (5.2)", tipo: "select",
        opcoes: [["dosagem", "Dosagem do teor de cimento — cura de 7 dias"], ["controle", "Controle de obra — idade fixada pelo serviço"]] },
      { k: "maquina", r: "Máquina de ensaio (4.1)", tipo: "select",
        opcoes: [["lab", "Laboratório — erro ≤ 1 % (10 % a 100 % da carga máxima)"], ["obra", "Laboratório de obra (controle) — erro ≤ 3 % (4.1.2)"]] },
      { k: "unidade", r: "Unidade da carga lida", tipo: "select", recarrega: true, opcoes: CARGAS },
      { k: "taxa", r: "Taxa de carregamento da prensa hidráulica (kPa/s) — opcional", ph: "140", dica: "(140 ± 70) kPa/s, conforme a resistência dos CPs (6.2)" },
      { k: "minimo", r: "Resistência mínima exigida (MPa) — opcional", ph: "2,1",
        dica: "da especificação (ex.: 2,1 MPa aos 7 dias para base de solo-cimento); compara a média dos CPs da idade de controle" },
      { k: "idadeMin", r: "Idade de controle (dias)", ph: "7", se: function (d) { return ok(num((d.params || {}).minimo)); } },
    ],
    padrao: { finalidade: "dosagem", maquina: "lab", unidade: "N" },
    tabelas: function (d) {
      var P = d.params || {}, u = P.unidade || "N";
      var linhas = [{ k: "id", r: "Identificação do CP (7.2 a)", texto: true },
        { k: "grupo", r: "Grupo (teor de cimento, lote, estaca)", texto: true, ph: "opcional" },
        { grupo: "Cura e imersão (5.2; 5.3)" },
        { k: "idade", r: "Idade (período de cura)", u: "dias" },
        { k: "imersao", r: "Imersão em água antes do ensaio", u: "h", ph: "4" },
        { grupo: "Dimensões (5.3)" },
        { k: "d1", r: "Diâmetro 1 — meia altura (0,1 mm)", u: "mm" },
        { k: "d2", r: "Diâmetro 2 — a 90° do primeiro", u: "mm" },
        { calc: "d", r: "Diâmetro médio", u: "mm", casas: 1 },
        { k: "h", r: "Altura (1 mm; inclui capeamento)", u: "mm" },
        { calc: "A", r: "Área da seção transversal (7.2 c)", u: "cm²", casas: 2 },
        { grupo: "Ruptura (6.2; 7.1)" },
        { k: "q", r: "Carga máxima alcançada", u: u },
        { calc: "Q", r: "Carga de ruptura adotada (precisão de 50 N)", u: "N", casas: 0 },
        { calc: "rc", r: "Resistência à compressão axial (10 kPa)", u: "kPa", casas: 0 },
        { calc: "rcM", r: "Resistência à compressão axial", u: "MPa", casas: 2, destaque: true }];
      return [{ chave: "cp", titulo: "Corpos de prova", rotulo: "CP", iniciais: 3, min: 1, linhas: linhas,
        dica: "uma coluna por corpo de prova; diâmetros com precisão de 0,1 mm e altura de 1 mm" }];
    },
    calcular: function (d) {
      var P = d.params || {}, avisos = [], fat = FATOR[P.unidade] || 1;
      var cps = (d.cp || []).map(function (x, i) {
        var rot = "CP " + (x.id || i + 1), o = {};
        var ds = [num(x.d1), num(x.d2)].filter(ok);
        o.d = ds.length ? media(ds) : NaN;
        o.A = ok(o.d) ? Math.PI * o.d * o.d / 4 / 100 : NaN;  // cm²
        var q = num(x.q);
        o.Q = ok(q) ? Math.round(q * fat / 50) * 50 : NaN;     // 6.2: carga de ruptura com precisão de 50 N
        var kpa = ok(o.Q) && ok(o.A) && o.A > 0 ? o.Q / (o.A * 100) * 1000 : NaN;  // N/mm² = MPa -> kPa
        o.rc = ok(kpa) ? Math.round(kpa / 10) * 10 : NaN;       // 7.1: aproximação de 10 kPa
        o.rcM = ok(o.rc) ? o.rc / 1000 : NaN;
        o.idade = num(x.idade);
        o.grupo = String(x.grupo || "").trim();
        if (ds.length === 1 && ok(o.rc)) avisos.push(rot + ": o diâmetro é a média de dois diâmetros medidos em ângulo reto a meia altura (5.3); há só um.");
        if (ok(o.d) && Math.abs(o.d - 100) > 2) avisos.push(rot + ": diâmetro de " + fmt(o.d, 1) + " mm — o molde da DNER-ME 202 tem Ø 100 ± 0,5 mm; confira a unidade ou o molde.");
        var h = num(x.h);
        if (ok(h) && Math.abs(h - 127.3) > 5) avisos.push(rot + ": altura de " + fmt(h, 0) + " mm — o CP da DNER-ME 202 tem 127,3 mm (verifique rasamento/capeamento).");
        var im = num(x.imersao);
        if (ok(im) && Math.abs(im - 4) > 0.25) avisos.push(rot + ": imersão de " + fmt(im, 1) + " h — os CPs são imersos em água por 4 horas antes do ensaio (5.3).");
        if (P.finalidade === "dosagem" && ok(o.idade) && o.idade !== 7) avisos.push(rot + ": na dosagem a cura é fixa de 7 dias (5.2); informada idade de " + o.idade + " d.");
        return o;
      });
      var taxa = num(P.taxa);
      if (ok(taxa) && (taxa < 70 || taxa > 210)) avisos.push("Taxa de carregamento de " + fmt(taxa, 0) + " kPa/s fora de (140 ± 70) kPa/s (6.2).");
      // médias por grupo e idade (informativas: a norma dá o resultado de cada CP)
      var chaves = [], mapa = {};
      cps.forEach(function (o) {
        if (!ok(o.rc)) return;
        var k = o.grupo + "|" + o.idade;
        if (!mapa[k]) { mapa[k] = { grupo: o.grupo, idade: o.idade, vals: [] }; chaves.push(k); }
        mapa[k].vals.push(o.rcM);
      });
      var grupos = chaves.map(function (k) {
        var g = mapa[k], m = media(g.vals);
        g.n = g.vals.length; g.media = m;
        g.dv = Math.max.apply(null, g.vals.map(function (x) { return Math.abs(x - m) / m * 100; }));
        g.nome = (g.grupo ? g.grupo + " — " : "") + (ok(g.idade) ? g.idade + " dias" : "idade não informada");
        return g;
      });
      grupos.forEach(function (g) {
        if (g.n >= 2 && g.dv > 10) avisos.push(g.nome + ": um CP difere " + fmt(g.dv, 0) + " % da média do grupo — verifique moldagem, capeamento e ruptura.");
      });
      var minimo = num(P.minimo), idadeMin = ok(num(P.idadeMin)) ? num(P.idadeMin) : 7, conforme = null;
      if (ok(minimo)) {
        var gs = grupos.filter(function (x) { return x.idade === idadeMin; });
        if (gs.length) {
          gs.forEach(function (g) {
            g.atende = Math.round(g.media * 100) / 100 >= minimo;
            if (!g.atende) avisos.push(g.nome + ": média = " + fmt(g.media, 2) + " MPa, abaixo do mínimo exigido de " + fmt(minimo, 2) + " MPa.");
          });
          conforme = gs.every(function (g) { return g.atende; });
        } else if (grupos.length) avisos.push("Nenhum CP na idade de controle de " + idadeMin + " dias — a comparação com o mínimo não foi feita.");
      }
      return { tab: { cp: cps }, resultados: { grupos: grupos, minimo: minimo, idadeMin: idadeMin, conforme: conforme,
        individuais: cps.map(function (o) { return o.rcM; }) }, avisos: avisos };
    },
    resultadosHtml: function (calc) {
      var r = calc.resultados;
      if (!r.grupos.length) return '<div class="fe-res"><div class="fe-res-item"><div class="fe-res-v">—</div><div class="fe-res-r">Resistência à compressão axial</div></div></div>';
      return '<div class="fe-res">' + r.grupos.map(function (g) {
        var sel = g.atende !== undefined ? (g.atende ? ' · <span class="fe-ok">atende ao mínimo</span>' : ' · <span class="fe-nok">não atende ao mínimo</span>') : "";
        return '<div class="fe-res-item"><div class="fe-res-v">' + fmt(g.media, 2) + ' <small>MPa</small></div><div class="fe-res-r">Média de ' + g.n + " CP(s) — " + esc(g.nome) + " (" + g.vals.map(function (v) { return fmt(v, 2); }).join("; ") + ")" + sel + "</div></div>";
      }).join("") + "</div>";
    },
    relatorio: {
      notas: "Resistência à compressão axial = carga de ruptura (precisão de 50 N) / área da seção transversal, com aproximação de 10 kPa (6.2 e 7.1); diâmetro = média de dois diâmetros em ângulo reto a meia altura, precisão de 0,1 mm; altura com precisão de 1 mm, incluindo capeamento (5.3). Cura em câmara úmida (23 ± 2 °C, UR ≥ 95 %): 7 dias na dosagem; imersão de 4 h antes do ensaio (5.2 e 5.3). A norma dá o resultado de cada CP; a média por idade e a comparação com o mínimo são informativas (critério da especificação).",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {}, rows = [];
        if (P.mistura) rows.push(["Mistura", P.mistura]);
        r.grupos.forEach(function (g) {
          rows.push(["Resistência à compressão axial — " + g.nome,
            g.vals.map(function (v) { return fmt(v * 1000, 0); }).join("; ") + " kPa — média " + fmt(g.media, 2) + " MPa" +
            (g.atende === undefined ? "" : g.atende ? " — atende" : " — NÃO ATENDE")]);
        });
        if (r.conforme !== null) rows.push(["Mínimo exigido", fmt(r.minimo, 2) + " MPa aos " + r.idadeMin + " dias — " + (r.conforme ? "atende" : "NÃO ATENDE")]);
        return rows;
      },
    },
    exemplos: [
      { nome: "Dosagem — solo arenoso com 5 %, 7 % e 9 % de cimento (7 dias)", dados: function () {
        // valores-alvo 1,45 / 2,25 / 3,10 MPa (média de 2 CPs por teor), CP Ø 100 × 127,3 mm; carga Q = R·A
        function cp(id, d1, d2, h, kn) { return { id: id, grupo: id.split("-")[0].trim(), idade: "7", imersao: "4", d1: d1, d2: d2, h: h, q: kn }; }
        return { ident: { registro: "EX-SC-001", camada: "Base de solo-cimento — dosagem", origem: "Jazida 1" },
          params: { mistura: "Solo A-2-4 + cimento CP II-E-32 (5 %, 7 % e 9 %)", finalidade: "dosagem", maquina: "lab", unidade: "kN", taxa: "140" },
          cp: [cp("5 %-1", "100,2", "100,0", "127", "11,55"), cp("5 %-2", "100,1", "100,3", "128", "11,20"),
            cp("7 %-1", "100,0", "100,2", "127", "17,85"), cp("7 %-2", "100,3", "100,1", "127", "17,50"),
            cp("9 %-1", "100,1", "100,1", "128", "24,60"), cp("9 %-2", "100,2", "100,0", "127", "24,10")] };
      } },
      { nome: "Controle de obra — 7 dias, mínimo de 2,1 MPa atendido", dados: function () {
        return { ident: { registro: "EX-SC-002", obra: "Rodovia X", local: "Est. 120 + 10", camada: "Base de solo-cimento 7 %", data: "2025-08-12" },
          params: { mistura: "Solo-cimento 7 % (pista)", finalidade: "controle", maquina: "obra", unidade: "kgf", minimo: "2,1", idadeMin: "7" },
          cp: [{ id: "120-A", idade: "7", imersao: "4", d1: "100,1", d2: "100,0", h: "127", q: "1850" },
            { id: "120-B", idade: "7", imersao: "4", d1: "100,2", d2: "100,2", h: "127", q: "1795" },
            { id: "120-C", idade: "28", imersao: "4", d1: "100,0", d2: "100,1", h: "128", q: "2640" }] };
      } },
      { nome: "Controle de obra — abaixo do mínimo, imersão curta e CP discrepante", dados: function () {
        return { ident: { registro: "EX-SC-003", local: "Est. 205", camada: "Base de solo-cimento 6 %", data: "2025-09-03" },
          params: { mistura: "Solo-cimento 6 % (pista)", finalidade: "controle", maquina: "obra", unidade: "N", taxa: "250", minimo: "2,1", idadeMin: "7" },
          cp: [{ id: "205-A", idade: "7", imersao: "2", d1: "100,2", d2: "100,1", h: "127", q: "14870" },
            { id: "205-B", idade: "7", imersao: "4", d1: "100,0", d2: "100,1", h: "127", q: "15230" },
            { id: "205-C", idade: "7", imersao: "4", d1: "100,1", d2: "100,3", h: "126", q: "11020" }] };
      } },
    ],
  };
})();
