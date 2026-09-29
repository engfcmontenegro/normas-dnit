/*
 * Ficha de ACEITAÇÃO: DNIT 027/2004-ES — Drenagem — Demolição de dispositivos de concreto.
 *
 * O que a ES manda (seções do PDF):
 *   4     demolição só depois de instalado o dispositivo novo (ou provisório) que escoe os deflúvios sem risco ao tráfego
 *         e à estabilidade da rodovia; atividades planejadas e programadas; equipamentos e materiais de substituição no
 *         canteiro antes da demolição; integridade das estruturas anexas mantida.
 *   5.2   NOTA: equipamentos vistoriados antes do início (sem o que não é autorizada a utilização).
 *   5.3   a) dispositivo/fração a demolir e processos indicados e avaliados; b) demolição manual ou mecânica;
 *         c) fragmentos reduzidos para permitir a carga; d) material disposto sem interferir no escoamento e
 *         transportado aos bota-foras previamente escolhidos; e) superfície resultante limpa.
 *   6     manejo ambiental: excedente removido; destino definido com a Fiscalização, sem atingir cursos d'água;
 *         proteção nos deságues; sem tráfego desnecessário em terreno natural; DNER-ISA 07.
 *   7.1   apreciação visual da demolição e verificação da adequação do local de deposição do material removido.
 *   7.2   verificação por levantamento topográfico e medidas a régua/trena nos locais das Notas de Serviço;
 *         acompanhamento dos volumes demolidos e da fragmentação; controle visual sem prejuízo à operação do
 *         dispositivo ou canalização envolvido.
 *   7.3   conforme se atendidas as exigências; em caso contrário, os serviços devem ser refeitos ou complementados.
 * A ES não tem ensaio nem tolerância numérica: a ficha é uma lista de verificações; o volume demolido (medição, 8 a)
 * aparece como informação, comparado ao das Notas de Serviço.
 */
(function () {
  "use strict";
  var FE = window.FE, A = FE.aceitacao, num = FE.num, ok = FE.ok, fmt = FE.fmt;
  var G4 = "Condições gerais (4; 5.2)", G5 = "Execução (5.3)", G6 = "Manejo ambiental (6)", G7 = "Inspeção (7.1; 7.2)";
  function preencher(F, d, falhas) {
    d.verificacoes = [];
    F.simples.criterios.filter(function (it) { return it.tipo === "sim_nao"; }).forEach(function (it) {
      if (it.se && !it.se(d.params)) { d.verificacoes.push({}); return; }
      d.verificacoes.push((falhas || {})[it.id] || { atende: "S", real: "1" });
    });
  }
  var F = A.fichaSimples({
    id: "dnit-027-2004-es",
    titulo: "Demolição de dispositivos de concreto — aceitação (DNIT 027/2004-ES)",
    resumo: "Aceitação da demolição de dispositivo de drenagem: condições prévias (4), etapas de execução (5.3), manejo ambiental (6) e inspeção visual, topográfica e dos volumes (7.1; 7.2). Não conforme → refazer ou complementar (7.3).",
    lote: false,
    params: [
      { k: "disp", r: "Dispositivo demolido", ph: "ex.: sarjeta de concreto SCC, est. 10 a 15 LE" },
      { k: "ns", r: "Nota de Serviço", ph: "ex.: NS-12" },
      { k: "tipoConc", r: "Material", tipo: "select", opcoes: [["simples", "Concreto simples"], ["armado", "Concreto armado"], ["misto", "Concreto simples e armado"], ["outro", "Alvenaria / tubo metálico / outro"]] },
      { k: "volNS", r: "Volume a demolir — Nota de Serviço (m³)" },
      { k: "volExec", r: "Volume demolido — medido antes da demolição (m³)", dica: "8 a: medido previamente à demolição, separando concreto armado e simples" },
    ],
    padrao: { tipoConc: "simples" },
    refs: { reprova: "7.3" },
    textos: { REJEITADO: { titulo: "SERVIÇO NÃO CONFORME", texto: "Há exigência da ES não atendida: os serviços devem ser refeitos ou complementados, de forma a atenderem ao especificado (7.3)." },
      ACEITO: { titulo: "SERVIÇO CONFORME", texto: "Todas as exigências da DNIT 027/2004-ES verificadas e atendidas (7.3)." } },
    providencias: function (par) { return par.parecer === "ACEITO" ? [] : ["Serviço não conforme: refazer ou complementar e verificar de novo (7.3)."]; },
    criterios: [
      { id: "substituto", grupo: G4, texto: "Dispositivo novo (ou provisório) instalado antes da demolição, escoando os deflúvios sem risco ao tráfego e à estabilidade da rodovia", secao: "4", tipo: "sim_nao" },
      { id: "planej", grupo: G4, texto: "Atividades planejadas e programadas; equipamentos e materiais de substituição disponíveis no canteiro antes da demolição", secao: "4", tipo: "sim_nao" },
      { id: "anexas", grupo: G4, texto: "Integridade das estruturas anexas mantida", secao: "4", tipo: "sim_nao" },
      { id: "equip", grupo: G4, texto: "Equipamentos vistoriados antes do início do serviço", secao: "5.2 NOTA", tipo: "sim_nao" },
      { id: "indicacao", grupo: G5, texto: "Dispositivo ou fração a demolir e processos indicados e avaliados (Notas de Serviço)", secao: "5.3 a; 7.2", tipo: "sim_nao" },
      { id: "fragm", grupo: G5, texto: "Fragmentos reduzidos a dimensões que permitam a carga manual ou mecânica", secao: "5.3 c; 7.2", tipo: "sim_nao" },
      { id: "disposicao", grupo: G5, texto: "Material demolido disposto sem interferir no escoamento das águas e transportado aos bota-foras previamente escolhidos", secao: "5.3 d", tipo: "sim_nao" },
      { id: "limpeza", grupo: G5, texto: "Superfície resultante da remoção limpa (vassouras manuais ou mecânicas)", secao: "5.3 e", tipo: "sim_nao" },
      { id: "excedente", grupo: G6, texto: "Material excedente removido das proximidades e levado a local definido com a Fiscalização, sem atingir cursos d'água", secao: "6 a, b", tipo: "sim_nao" },
      { id: "desague", grupo: G6, texto: "Obras de proteção nos pontos de deságue (sem erosão nem assoreamento)", secao: "6 c", tipo: "sim_nao" },
      { id: "trafego", grupo: G6, texto: "Sem tráfego desnecessário de equipamentos em terreno natural; recomendações da DNER-ISA 07", secao: "6 d, e", tipo: "sim_nao" },
      { id: "visual", grupo: G7, texto: "Apreciação visual da demolição efetuada", secao: "7.1", tipo: "sim_nao" },
      { id: "deposito", grupo: G7, texto: "Local de deposição do material removido adequado", secao: "7.1", tipo: "sim_nao" },
      { id: "topo", grupo: G7, texto: "Segmentos e peças demolidos conferidos por topografia e medidas a régua/trena nos locais das Notas de Serviço", secao: "7.2", tipo: "sim_nao" },
      { id: "operacao", grupo: G7, texto: "Sem prejuízo à operação da canalização ou dispositivo envolvido", secao: "7.2", tipo: "sim_nao" },
    ],
    extra: function (ctx) {
      var v0 = num(ctx.P.volNS), v1 = num(ctx.P.volExec);
      if (!ok(v1)) return;
      var l = A.linha({ id: "vol", grupo: G7, criterio: "Volume demolido × Nota de Serviço", secao: "7.2; 8 a", situacao: "informativo",
        exigido: ok(v0) ? fmt(v0, 2) + " m³ (Nota de Serviço)" : "—", resultado: fmt(v1, 2) + " m³" + (ok(v0) && v0 > 0 ? " (" + A.fmtR((v1 / v0 - 1) * 100, 1) + " %)" : ""),
        motivo: "acompanhamento dos volumes (7.2); a ES não fixa tolerância" });
      ctx.linhas.push(l);
    },
    notas: "Critérios da DNIT 027/2004-ES (seções 4 a 7). A ES não define ensaios nem tolerâncias numéricas nem frequência: cada verificação é exigida ao menos uma vez por serviço (Nota de Serviço). Não conforme → os serviços devem ser refeitos ou complementados (7.3).",
    exemplos: [
      { nome: "Demolição de sarjeta de concreto — conforme", dados: function () {
        var d = { ident: { registro: "DEM-A-001", data: "2026-05-12", obra: "Obra A — BR-000", trecho: "Restauração — segmento 2", local: "Est. 10 a 15 LE" },
          params: { disp: "Sarjeta de concreto triangular, est. 10 a 15 LE", ns: "NS-12", tipoConc: "simples", volNS: "4,50", volExec: "4,38" } };
        preencher(F, d);
        return d;
      } },
      { nome: "Demolição de boca de bueiro — não conforme (entulho no talvegue)", dados: function () {
        var d = { ident: { registro: "DEM-B-002", data: "2026-06-03", obra: "Obra B — BR-000", trecho: "Substituição de bueiro", local: "Est. 230+00" },
          params: { disp: "Boca de montante de bueiro tubular Ø 0,80 m", ns: "NS-31", tipoConc: "misto", volNS: "6,20", volExec: "6,55" } };
        preencher(F, d, {
          fragm: { real: "1", nc: "1", obs: "blocos grandes da ala deixados no local" },
          disposicao: { real: "2", nc: "1", obs: "parte do entulho lançada no talvegue, obstruindo o escoamento" },
          deposito: { real: "1", nc: "1", obs: "bota-fora não previsto, junto ao curso d'água" } });
        return d;
      } },
    ],
  });
})();
