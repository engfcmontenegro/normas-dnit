/*
 * Ficha: DNER-PRO 361/97 — Procedimentos para similaridade de materiais de construção.
 * Registra-se em window.FE (usa FE.aceitacao: linhas de critério e parecer).
 *
 * O que a PRO manda:
 *   2     similaridade: os dois materiais desempenham idêntica função construtiva e têm as mesmas características
 *         exigidas nas EM → a ficha confere cada característica do material proposto com os limites da EM (e, quando
 *         informados, com os valores do material especificado/aprovado, com a tolerância de comparação adotada);
 *   3.1   materiais novos e de primeira qualidade, atendendo às EM;  3.2 amostra aprovada mantida na obra;
 *   3.4   substituição só com autorização expressa, por escrito, para cada caso;  3.5 semelhança (não equivalência):
 *         substituição com compensação financeira;  3.6 critério autorizado pelo autor do projeto/especificador;
 *   3.7   consulta em tempo oportuno (não justifica atraso);
 *   4.1.1 aço estrutural PA-37 / PA-45 — tração (NBR 6152) e dobramento (NBR 6153): tabela da 4.1.1 c;
 *   4.2   aço inoxidável: 10 % Cr e < 0,2 % C (4.2.1); tipo 16-6 (> 16 % Cr, > 6 % Ni, < 0,13 % C) (4.2.2); no mínimo
 *         18-8 com cloretos/sais halóides (4.2.3); alta temperatura: estabilizador Nb ou Ti 0,7 % a 1 %, Ti = 5 × C e
 *         no mínimo 0,4 % a 0,8 % (4.2.4);
 *   4.3   aço para concreto armado: NBR 7480 e tensão de escoamento ≥ 400 MPa (40 kgf/mm²) (4.3.3).
 * A PRO não define estatística de comparação: cada determinação do material proposto deve atender (critério da ficha).
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt, esc = FE.esc;
  var ID = "dner-pro-361-97", EPS = 1e-9, KGF = 9.80665;
  var SN = [["", "— não verificado"], ["S", "Sim / atende"], ["N", "Não / não atende"]];
  var CATS = [["geral", "Material qualquer — características da EM (2)"], ["estrutural", "Aço estrutural — perfis PA-37 / PA-45 (4.1.1)"],
    ["inox", "Aço inoxidável (4.2)"], ["ca", "Aço para concreto armado (4.3)"]];
  // 4.1.1 c — PA-45: a tabela traz 54/54 para o limite de resistência; 4.1.1 b diz que o número é a resistência mínima → 45
  var PA = { "37": { fu: [37, 44], fy: 20, al: 24, ang: 100 }, "45": { fu: [45, 54], fy: 25, al: 22, ang: 180 } };
  var INOX = [["comum", "Uso geral — 10 % Cr e < 0,2 % C (4.2.1)"], ["corrosao", "Maior resistência à oxidação e à corrosão — tipo 16-6 (4.2.2)"],
    ["agressivo", "Cloretos e sais halóides — no mínimo tipo 18-8 (4.2.3)"], ["temperatura", "Elevada temperatura — estabilizado com Nb/Ti (4.2.4)"]];
  function cat(P) { return P.categoria || "geral"; }
  function se(c) { return function (d) { return cat(d.params || {}) === c; }; }
  function linhaSN(v, o) {
    var l = A.linha(Object.assign({ n: v ? 1 : 0, resultado: v === "S" ? "sim" : v === "N" ? "não" : "—" }, o));
    if (v === "N") A.marcar(l, o.falha || "nao_conforme", o.motivoN || "não atende (" + o.secao + ")");
    else if (!v) A.marcar(l, o.falhaVazio || "pendente", "não registrado");
    return l;
  }
  function vals(cols, k) { return cols.map(function (c) { return num(c[k]); }).filter(ok); }
  function lista(v, c) { return v.map(function (x) { return fmt(x, c); }).join("; "); }
  // verificação de uma propriedade em todas as determinações
  function prop(linhas, o) {
    var v = o.v, l = A.linha({ id: o.id, grupo: o.grupo, criterio: o.criterio, secao: o.secao, unid: o.u, casas: o.casas, n: v.length,
      exigido: o.exigido || A.txtLimites(o.min, o.max, o.casasLim !== undefined ? o.casasLim : o.casas, o.u, o.minEstrito) });
    if (!v.length) { A.marcar(l, "sem_dados", "sem determinações"); linhas.push(l); return l; }
    l.resultado = v.length > 1 ? "mín. " + fmt(Math.min.apply(null, v), o.casas) + " · máx. " + fmt(Math.max.apply(null, v), o.casas) + " (" + v.length + " det.)" : fmt(v[0], o.casas) + (o.u ? " " + o.u : "");
    var fora = v.filter(function (x) {
      return (ok(o.min) && (o.minEstrito ? x <= o.min + EPS : x < o.min - EPS)) || (ok(o.max) && (o.maxEstrito ? x >= o.max - EPS : x > o.max + EPS));
    });
    if (fora.length) A.marcar(l, o.falha || "nao_conforme", "determinação(ões) fora: " + lista(fora, o.casas) + (o.u ? " " + o.u : "") + " — exigido " + l.exigido + " (" + o.secao + ")");
    linhas.push(l);
    return l;
  }

  function calcular(d) {
    var P = d.params || {}, avisos = [], linhas = [], C = cat(P), tab = {}, r = { cat: C };
    var G0 = "Condições gerais (2 e 3)";
    linhas.push(linhaSN(P.funcao, { id: "funcao", grupo: G0, criterio: "Idêntica função construtiva à do material especificado", secao: "2", exigido: "sim" }));
    linhas.push(linhaSN(P.novo, { id: "novo", grupo: G0, criterio: "Material novo e de primeira qualidade, atendendo às EM", secao: "3.1", exigido: "sim" }));
    linhas.push(linhaSN(P.autProj, { id: "autProj", grupo: G0, criterio: "Critério de similaridade autorizado pelo autor do projeto e/ou especificador", secao: "3.6", exigido: "sim" }));
    linhas.push(linhaSN(P.autEsc, { id: "autEsc", grupo: G0, criterio: "Autorização expressa, por escrito, para este caso", secao: "3.4", exigido: "sim",
      motivoN: "sem autorização escrita a substituição não pode ser feita (3.4)" }));
    linhas.push(linhaSN(P.prazo, { id: "prazo", grupo: G0, criterio: "Consulta feita em tempo oportuno (sem afetar os prazos contratuais)", secao: "3.7", exigido: "sim", falha: "ressalva",
      motivoN: "a consulta não justifica o descumprimento dos prazos contratuais (3.7)" }));
    linhas.push(linhaSN(P.amostra, { id: "amostra", grupo: G0, criterio: "Amostra aprovada mantida na obra para comparação com o fornecido", secao: "3.2", exigido: "sim", falha: "ressalva", falhaVazio: "ressalva" }));

    var G = "Características do material proposto (" + (C === "geral" ? "2 — EM de referência" : C === "estrutural" ? "4.1.1" : C === "inox" ? "4.2" : "4.3") + ")";
    var difs = [];
    if (C === "geral") {
      var tol = num(P.tolRef);
      tab.car = (d.car || []).map(function (c, i) {
        var o = {}, vp = num(c.vProp), vr = num(c.vRef), mn = num(c.min), mx = num(c.max), nome = String(c.nome || "").trim() || "Característica " + (i + 1);
        if (!String(c.nome || "").trim() && !ok(vp) && !ok(vr)) return o;
        o.dif = ok(vp) && ok(vr) && vr !== 0 ? (vp - vr) / Math.abs(vr) * 100 : NaN;
        var cs = Math.max(decimais(c.vProp), decimais(c.min), decimais(c.max));
        var l = A.linha({ id: "c" + i, grupo: G, criterio: nome + (c.metodo ? " — " + c.metodo : ""), secao: "2", unid: c.unid || "", casas: cs, n: ok(vp) ? 1 : 0,
          exigido: ok(mn) || ok(mx) ? A.txtLimites(mn, mx, cs, c.unid || "") : "—" });
        if (!ok(vp)) A.marcar(l, "sem_dados", "valor do material proposto não informado");
        else {
          l.resultado = fmt(vp, cs) + (c.unid ? " " + c.unid : "") + (ok(vr) ? " (especificado: " + fmt(vr, Math.max(cs, decimais(c.vRef))) + (ok(o.dif) ? "; " + (o.dif >= 0 ? "+" : "−") + fmt(Math.abs(o.dif), 1) + " %" : "") + ")" : "");
          if ((ok(mn) && vp < mn - EPS) || (ok(mx) && vp > mx + EPS)) A.marcar(l, "nao_conforme", "fora do limite da EM: " + l.exigido + " (2 e 3.1)");
          else if (!ok(mn) && !ok(mx) && !ok(vr)) A.marcar(l, "pendente", "informe o limite da EM ou o valor do material especificado");
          if (ok(o.dif) && ok(tol) && Math.abs(o.dif) > tol + EPS) {
            difs.push(nome);
            if (P.enquadramento === "semelhanca") A.marcar(l, "ressalva", "difere " + fmt(Math.abs(o.dif), 1) + " % do material especificado (tolerância de comparação " + fmt(tol, 1) + " %) — semelhança (3.5)");
            else A.marcar(l, "nao_conforme", "difere " + fmt(Math.abs(o.dif), 1) + " % do material especificado (tolerância de comparação " + fmt(tol, 1) + " %) — características não são as mesmas (2)");
          } else if (ok(o.dif) && !ok(tol) && !(ok(mn) || ok(mx))) A.marcar(l, "pendente", "sem limite da EM: informe a tolerância de comparação com o material especificado");
        }
        linhas.push(l);
        return o;
      });
      if (!linhas.some(function (l) { return /^c\d/.test(l.id); })) linhas.push(A.marcar(A.linha({ id: "car", grupo: G, criterio: "Características exigidas na EM", secao: "2", exigido: "todas atendidas" }), "sem_dados", "nenhuma característica informada"));
      r.tol = tol;
    } else if (C === "estrutural") {
      var cl = PA[P.classe === "45" ? "45" : "37"], cps = d.cp || [];
      var nomeCl = "PA-" + (P.classe === "45" ? "45" : "37");
      prop(linhas, { id: "fu", grupo: G, criterio: "Limite de resistência (tração, NBR 6152) — " + nomeCl, secao: "4.1.1 c", u: "kgf/mm²", casas: 1, casasLim: 0, v: vals(cps, "fu"), min: cl.fu[0], max: cl.fu[1] });
      prop(linhas, { id: "fy", grupo: G, criterio: "Limite de escoamento — " + nomeCl, secao: "4.1.1 c", u: "kgf/mm²", casas: 1, casasLim: 0, v: vals(cps, "fy"), min: cl.fy });
      prop(linhas, { id: "al", grupo: G, criterio: "Alongamento em 4,5 √S — " + nomeCl, secao: "4.1.1 c", u: "%", casas: 1, casasLim: 0, v: vals(cps, "al"), min: cl.al });
      prop(linhas, { id: "ang", grupo: G, criterio: "Ângulo de dobramento sem fissura (NBR 6153) — " + nomeCl, secao: "4.1.1 c", u: "°", casas: 0, v: vals(cps, "ang"), min: cl.ang });
      var trinca = cps.filter(function (c) { return /^n/i.test(String(c.trinca || "").trim()); }).length;
      if (trinca) { var lt = linhas[linhas.length - 1]; A.marcar(lt, "nao_conforme", trinca + " corpo(s) de prova com fissura/ruptura no dobramento"); }
      tab.cp = cps.map(function (c) { var o = {}; o.fuMPa = ok(num(c.fu)) ? num(c.fu) * KGF : NaN; o.fyMPa = ok(num(c.fy)) ? num(c.fy) * KGF : NaN; return o; });
      if (P.classe === "45") avisos.push("4.1.1 c: a tabela da PRO dá 54 kgf/mm² como mínimo e como máximo do limite de resistência do PA-45; a ficha usa o mínimo de 45 kgf/mm² (4.1.1 b: o número da categoria é a resistência mínima) e o máximo de 54.");
      r.classe = nomeCl;
    } else if (C === "inox") {
      var an = d.an || [], cond = P.condInox || "comum";
      var cr = vals(an, "cr"), ni = vals(an, "ni"), cc = vals(an, "c");
      tab.an = an.map(function (c) { var o = {}, t = num(c.ti), nb = num(c.nb), k = num(c.c); o.estab = (ok(t) ? t : 0) + (ok(nb) ? nb : 0); if (!ok(t) && !ok(nb)) o.estab = NaN; o.tiC = ok(t) && ok(k) && k > 0 ? t / k : NaN; return o; });
      if (cond === "corrosao") {
        prop(linhas, { id: "cr", grupo: G, criterio: "Cromo — tipo 16-6", secao: "4.2.2", u: "%", casas: 2, casasLim: 0, v: cr, min: 16, minEstrito: true });
        prop(linhas, { id: "ni", grupo: G, criterio: "Níquel — tipo 16-6", secao: "4.2.2", u: "%", casas: 2, casasLim: 0, v: ni, min: 6, minEstrito: true });
        prop(linhas, { id: "c", grupo: G, criterio: "Carbono — tipo 16-6", secao: "4.2.2", u: "%", casas: 3, casasLim: 2, v: cc, max: 0.13, maxEstrito: true, exigido: "< 0,13 %" });
      } else if (cond === "agressivo") {
        prop(linhas, { id: "cr", grupo: G, criterio: "Cromo — no mínimo tipo 18-8", secao: "4.2.3", u: "%", casas: 2, casasLim: 0, v: cr, min: 18 });
        prop(linhas, { id: "ni", grupo: G, criterio: "Níquel — no mínimo tipo 18-8", secao: "4.2.3", u: "%", casas: 2, casasLim: 0, v: ni, min: 8 });
        prop(linhas, { id: "c", grupo: G, criterio: "Carbono (baixo teor)", secao: "4.2.1", u: "%", casas: 3, casasLim: 1, v: cc, max: 0.2, maxEstrito: true, exigido: "< 0,2 %" });
      } else {
        prop(linhas, { id: "cr", grupo: G, criterio: "Cromo (alto teor)", secao: "4.2.1", u: "%", casas: 2, casasLim: 0, v: cr, min: 10 });
        prop(linhas, { id: "c", grupo: G, criterio: "Carbono (baixo teor)", secao: "4.2.1", u: "%", casas: 3, casasLim: 1, v: cc, max: 0.2, maxEstrito: true, exigido: "< 0,2 %" });
      }
      if (cond === "temperatura") {
        var est = tab.an.map(function (o) { return o.estab; }).filter(ok);
        prop(linhas, { id: "estab", grupo: G, criterio: "Estabilizador (colômbio + titânio)", secao: "4.2.4", u: "%", casas: 2, casasLim: 1, v: est, min: 0.7, max: 1.0 });
        var ti = an.map(function (c) { return { t: num(c.ti), c: num(c.c) }; }).filter(function (x) { return ok(x.t) && x.t > 0; });
        var lti = A.linha({ id: "ti", grupo: G, criterio: "Titânio: 5 × carbono e no mínimo 0,4 %", secao: "4.2.4", unid: "%", casas: 2, n: ti.length, exigido: "Ti ≥ 5 × C e Ti ≥ 0,4 %" });
        if (!ti.length) { lti.situacao = "nao_exigido"; lti.motivo = "estabilizado só com colômbio"; }
        else {
          lti.resultado = ti.map(function (x) { return fmt(x.t, 2) + (ok(x.c) ? " (5 × C = " + fmt(5 * x.c, 2) + ")" : ""); }).join("; ");
          var ruins = ti.filter(function (x) { return x.t < 0.4 - EPS || (ok(x.c) && x.t < 5 * x.c - EPS); });
          if (ruins.length) A.marcar(lti, "nao_conforme", "titânio abaixo de 5 × C ou de 0,4 % (4.2.4)");
          if (ti.some(function (x) { return !ok(x.c); })) A.marcar(lti, "pendente", "informe o carbono para conferir Ti ≥ 5 × C");
        }
        linhas.push(lti);
        avisos.push("4.2.4: a PRO pede estabilizador de 0,7 % a 1 % e, para o titânio, \"no mínimo, de 0,4 % a 0,8 %\" — faixas que não se conciliam; a ficha exige Nb + Ti de 0,7 % a 1 % e Ti ≥ 5 × C e ≥ 0,4 %.");
      }
      r.cond = (INOX.filter(function (x) { return x[0] === cond; })[0] || INOX[0])[1];
    } else {
      var cpa = d.cp || [], fy = vals(cpa, "fy");
      prop(linhas, { id: "fy", grupo: G, criterio: "Tensão de escoamento (real ou convencional)", secao: "4.3.3", u: "MPa", casas: 0, v: fy, min: 400, exigido: "≥ 400 MPa (40 kgf/mm²)" });
      linhas.push(linhaSN(P.nbr7480, { id: "nbr7480", grupo: G, criterio: "Atende à NBR 7480 (barras e fios; barras torcidas a frio)", secao: "4.3.1 / 4.3.2", exigido: "sim" }));
      tab.cp = cpa.map(function (c) { return { fyK: ok(num(c.fy)) ? num(c.fy) / KGF : NaN }; });
    }
    // enquadramento: equivalência × semelhança (3.5)
    if (P.enquadramento === "semelhanca") {
      var ls = linhaSN(P.compensacao, { id: "comp", grupo: "Enquadramento (3.5)", criterio: "Semelhança: compensação financeira definida entre contratante e contratada", secao: "3.5", exigido: "sim",
        motivoN: "na semelhança a substituição se processa com a correspondente compensação financeira (3.5)" });
      linhas.push(ls);
    }
    r.difs = difs;
    var par = A.parecer(linhas, [], { textos: {
      ACEITO: { titulo: "MATERIAL SIMILAR — SUBSTITUIÇÃO ADMISSÍVEL", texto: "Mesma função construtiva e mesmas características exigidas na EM, com a autorização escrita (2, 3.4 e 3.6)." },
      RESSALVA: { titulo: "SUBSTITUIÇÃO ADMISSÍVEL COM RESSALVA", texto: "Nenhuma exigência descumprida, mas há pontos a documentar (ressalvas abaixo)." },
      PENDENTE: { titulo: "ANÁLISE DE SIMILARIDADE INCOMPLETA", texto: "Faltam resultados, limites ou autorizações para decidir a substituição." },
      REJEITADO: { titulo: "MATERIAL NÃO SIMILAR — SUBSTITUIÇÃO NÃO ADMITIDA", texto: "Característica exigida não atendida ou condição da PRO descumprida (2, 3)." } } });
    r.linhas = linhas; r.parecer = par; r.catNome = (CATS.filter(function (x) { return x[0] === C; })[0] || CATS[0])[1];
    return { tab: tab, resultados: r, avisos: avisos };
  }
  function decimais(v) {
    var s = String(v === undefined || v === null ? "" : v).trim().replace(/\./g, ",");
    return s.indexOf(",") < 0 ? 0 : Math.min(3, s.split(",")[1].length);
  }

  FE.FICHAS[ID] = {
    titulo: "Similaridade de materiais de construção",
    lote: true,
    resumo: "Confere se o material proposto é similar ao especificado (2): mesma função construtiva, características exigidas na EM (com comparação ao material aprovado), requisitos de aço estrutural PA-37/PA-45 (4.1.1), aço inoxidável (4.2) e aço para concreto armado (4.3), e as condições gerais de autorização (3.1 a 3.7); parecer da substituição.",
    rotuloImportar: function (r) { return (r.catNome ? r.catNome.replace(/ \(.*\)$/, "").replace(/ — .*/, "") + " · " : "") + (r.parecer ? r.parecer.parecer : "—"); },
    params: [
      { k: "matEsp", r: "Material especificado no projeto / amostra aprovada", ph: "ex.: perfil laminado PA-37" },
      { k: "matProp", r: "Material proposto como similar", ph: "fornecedor/marca genéricos" },
      { k: "emRef", r: "EM / especificação de referência", ph: "ex.: EM do material, NBR" },
      { k: "categoria", r: "Tipo de material (4)", tipo: "select", recarrega: true, opcoes: CATS },
      { k: "classe", r: "Categoria do perfilado (4.1.1 b)", tipo: "select", opcoes: [["37", "PA-37"], ["45", "PA-45"]], se: se("estrutural") },
      { k: "condInox", r: "Condição de trabalho do aço inoxidável (4.2)", tipo: "select", recarrega: true, opcoes: INOX, se: se("inox") },
      { k: "nbr7480", r: "Atende à NBR 7480 (4.3.1 / 4.3.2)", tipo: "select", opcoes: SN, se: se("ca") },
      { k: "tolRef", r: "Tolerância de comparação com o material especificado (%) — opcional", ph: "ex.: 10", se: se("geral"),
        dica: "a PRO não fixa: use a do projeto/especificador (3.6); sem ela a comparação é só informativa" },
      { k: "enquadramento", r: "Enquadramento da consulta (3.5 / 3.7)", tipo: "select", opcoes: [["equivalencia", "Equivalência — mesmas características (similar)"], ["semelhanca", "Semelhança — substituição com compensação financeira (3.5)"]] },
      { k: "compensacao", r: "Compensação financeira definida (3.5)", tipo: "select", opcoes: SN, se: function (d) { return (d.params || {}).enquadramento === "semelhanca"; } },
      { k: "funcao", r: "Idêntica função construtiva (2)", tipo: "select", opcoes: SN },
      { k: "novo", r: "Material novo e de primeira qualidade (3.1)", tipo: "select", opcoes: SN },
      { k: "autProj", r: "Critério autorizado pelo autor do projeto / especificador (3.6)", tipo: "select", opcoes: SN },
      { k: "autEsc", r: "Autorização expressa por escrito para este caso (3.4)", tipo: "select", opcoes: SN },
      { k: "prazo", r: "Consulta em tempo oportuno (3.7)", tipo: "select", opcoes: SN },
      { k: "amostra", r: "Amostra aprovada mantida na obra (3.2)", tipo: "select", opcoes: SN },
    ],
    padrao: { categoria: "geral", classe: "37", condInox: "comum", enquadramento: "equivalencia" },
    tabelas: function (d) {
      var C = cat(d.params || {});
      if (C === "estrutural") return [{ chave: "cp", titulo: "Ensaios de tração (NBR 6152) e dobramento (NBR 6153) do material proposto", rotulo: "CP", iniciais: 3, min: 1,
        linhas: [{ k: "id", r: "Identificação do corpo de prova / perfil", texto: true }, { k: "fu", r: "Limite de resistência", u: "kgf/mm²" }, { calc: "fuMPa", r: "Limite de resistência", u: "MPa", casas: 0 },
          { k: "fy", r: "Limite de escoamento", u: "kgf/mm²" }, { calc: "fyMPa", r: "Limite de escoamento", u: "MPa", casas: 0 }, { k: "al", r: "Alongamento em 4,5 √S", u: "%" },
          { k: "ang", r: "Ângulo de dobramento atingido", u: "°" }, { k: "trinca", r: "Sem fissura na face tracionada? (S/N)", texto: true, ph: "S" }] }];
      if (C === "inox") return [{ chave: "an", titulo: "Composição química do material proposto", rotulo: "Análise", iniciais: 1, min: 1,
        linhas: [{ k: "id", r: "Identificação (corrida / certificado)", texto: true }, { k: "cr", r: "Cromo (Cr)", u: "%" }, { k: "ni", r: "Níquel (Ni)", u: "%" }, { k: "c", r: "Carbono (C)", u: "%" },
          { k: "ti", r: "Titânio (Ti)", u: "%" }, { k: "nb", r: "Colômbio / nióbio (Nb)", u: "%" }, { k: "mo", r: "Molibdênio (Mo)", u: "%" },
          { calc: "estab", r: "Estabilizador Nb + Ti", u: "%", casas: 2 }, { calc: "tiC", r: "Relação Ti / C", u: "", casas: 1 }] }];
      if (C === "ca") return [{ chave: "cp", titulo: "Ensaios de tração do aço proposto", rotulo: "CP", iniciais: 3, min: 1,
        linhas: [{ k: "id", r: "Identificação (bitola / lote)", texto: true }, { k: "fy", r: "Tensão de escoamento (real ou convencional)", u: "MPa" }, { calc: "fyK", r: "Tensão de escoamento", u: "kgf/mm²", casas: 1 }] }];
      return [{ chave: "car", titulo: "Características exigidas na EM — material especificado × proposto", rotulo: "Característica", iniciais: 4, min: 1,
        dica: "uma característica por coluna; limites da EM e valores dos dois materiais",
        linhas: [{ k: "nome", r: "Característica", texto: true }, { k: "metodo", r: "Método de ensaio", texto: true }, { k: "unid", r: "Unidade", texto: true },
          { k: "min", r: "Limite mínimo da EM" }, { k: "max", r: "Limite máximo da EM" }, { k: "vRef", r: "Valor do material especificado / aprovado" },
          { k: "vProp", r: "Valor do material proposto" }, { calc: "dif", r: "Diferença proposto − especificado", u: "%", casas: 1, destaque: true }] }];
    },
    calcular: calcular,
    resultadosHtml: function (calc, d) {
      var r = calc.resultados, P = d.params || {};
      var nc = r.linhas.filter(function (l) { return l.situacao === "nao_conforme"; }).length, cf = r.linhas.filter(function (l) { return l.situacao === "conforme"; }).length;
      return A.htmlParecer(r.parecer) + '<div class="fe-res">' + A.cartao(esc(r.catNome.replace(/ \(.*\)$/, "").replace(/ — .*/, "")) + (r.classe ? " " + r.classe : ""), "Tipo de material") +
        A.cartao(esc((P.matProp || "—")), "Proposto × " + esc(P.matEsp || "especificado")) + A.cartao(cf + " / " + r.linhas.length, "Critérios conformes" + (nc ? " · " + nc + " não conforme(s)" : "")) + "</div>" +
        A.htmlCriterios(r.linhas, { estilo: "resultado" });
    },
    relatorio: {
      notas: "DNER-PRO 361/97: similaridade quando os dois materiais desempenham idêntica função construtiva e têm as mesmas características exigidas nas EM (2); substituição só com autorização expressa e por escrito (3.4), pelo critério autorizado pelo autor do projeto/especificador (3.6); semelhança: substituição com compensação financeira (3.5). Aço estrutural (4.1.1 c): PA-37 — limite de resistência 37 a 44 kgf/mm², escoamento ≥ 20, alongamento ≥ 24 %, dobramento 100°; PA-45 — 45 (a tabela diz 54) a 54 kgf/mm², ≥ 25, ≥ 22 %, 180°. Inoxidável (4.2): 10 % Cr e < 0,2 % C; 16-6: > 16 % Cr, > 6 % Ni, < 0,13 % C; cloretos: no mínimo 18-8; alta temperatura: Nb/Ti 0,7 % a 1 %, Ti ≥ 5 × C. Concreto armado (4.3): NBR 7480 e escoamento ≥ 400 MPa. Critério da ficha: cada determinação do material proposto atende ao limite; 1 kgf/mm² = 9,80665 MPa.",
      resultados: function (calc, d) {
        var r = calc.resultados, P = d.params || {};
        var rows = [["Parecer", r.parecer.titulo], ["Material especificado", P.matEsp || "—"], ["Material proposto", P.matProp || "—"], ["Tipo de material", r.catNome + (r.classe ? " — " + r.classe : "") + (r.cond ? " — " + r.cond : "")]];
        if (P.emRef) rows.push(["EM de referência", P.emRef]);
        return rows;
      },
      extraHtml: function (calc) {
        var r = calc.resultados;
        return A.htmlParecer(r.parecer, { relat: true }) + A.htmlCriterios(r.linhas, { relat: true, estilo: "resultado" });
      },
    },
    exemplos: [
      { nome: "Perfil PA-37 de outro fornecedor — três corpos de prova, similar", dados: function () {
        return { ident: { registro: "SIM-01", data: "2026-03-18", obra: "Obra A", local: "Passarela — estrutura metálica", origem: "Fornecedor B", camada: "Perfis laminados" },
          params: { matEsp: "Perfil laminado PA-37 do Fornecedor A (amostra aprovada)", matProp: "Perfil laminado PA-37 do Fornecedor B", emRef: "DNER-PRO 361/97, 4.1.1", categoria: "estrutural", classe: "37",
            enquadramento: "equivalencia", funcao: "S", novo: "S", autProj: "S", autEsc: "S", prazo: "S", amostra: "S" },
          cp: [{ id: "CP-1 (alma)", fu: "40,2", fy: "26,1", al: "29", ang: "180", trinca: "S" }, { id: "CP-2 (mesa)", fu: "41,5", fy: "27,0", al: "27", ang: "180", trinca: "S" },
            { id: "CP-3 (mesa)", fu: "39,8", fy: "25,4", al: "30", ang: "180", trinca: "S" }] };
      } },
      { nome: "Inoxidável para ambiente com cloretos — liga ferrítica proposta no lugar da 18-8: não similar", dados: function () {
        return { ident: { registro: "SIM-02", data: "2026-04-02", obra: "Obra B", local: "Guarda-corpo em área litorânea", origem: "Fornecedor C", camada: "Chapas e tubos inoxidáveis" },
          params: { matEsp: "Aço inoxidável tipo 18-8", matProp: "Aço inoxidável ferrítico (17 % Cr, sem níquel)", emRef: "DNER-PRO 361/97, 4.2.3", categoria: "inox", condInox: "agressivo",
            enquadramento: "equivalencia", funcao: "S", novo: "S", autProj: "S", autEsc: "", prazo: "N" },
          an: [{ id: "Certificado 1", cr: "16,8", ni: "0,30", c: "0,06", mo: "" }, { id: "Certificado 2", cr: "17,1", ni: "0,25", c: "0,07", mo: "" }] };
      } },
      { nome: "Geotêxtil — semelhança com resistência menor, compensação financeira definida (3.5)", dados: function () {
        return { ident: { registro: "SIM-03", data: "2026-05-11", obra: "Obra C", local: "Drenos longitudinais", origem: "Fornecedor E", camada: "Geotêxtil não tecido" },
          params: { matEsp: "Geotêxtil não tecido do Fornecedor D", matProp: "Geotêxtil não tecido do Fornecedor E", emRef: "Especificação particular do projeto", categoria: "geral", tolRef: "10",
            enquadramento: "semelhanca", compensacao: "S", funcao: "S", novo: "S", autProj: "S", autEsc: "S", prazo: "S", amostra: "S" },
          car: [{ nome: "Gramatura", metodo: "NBR ISO 9864", unid: "g/m²", min: "200", vRef: "210", vProp: "205" },
            { nome: "Resistência à tração (faixa larga)", metodo: "NBR ISO 10319", unid: "kN/m", min: "10", vRef: "12", vProp: "10,5" },
            { nome: "Permissividade", metodo: "ASTM D 4491", unid: "s⁻¹", min: "1,0", vRef: "1,8", vProp: "1,7" }] };
      } },
    ],
  };
})();
