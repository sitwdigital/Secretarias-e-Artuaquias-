// src/pdf/RankingPerfisEngajadosPDF.jsx
import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { fotoPorNome } from "../utils/fotoCatalog"; // ⟵ usa o catálogo para achar a imagem

const headerImg = "/pdf-assets/Perfismaisengajados.png";
const footerImg = "/pdf-assets/footer_Relatorio.png";
const iconInsta  = "/pdf-assets/instagram.png";

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#fff",
    fontFamily: "AMSIPRO",
    paddingBottom: 40,
    position: "relative",
  },
  header: { width: "100%" },
  footer: { width: "100%", position: "absolute", bottom: 0, left: 0 },

  title: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 5,
    fontWeight: "bold",
    marginTop: 10
  },

  chartWrapper: {
    marginHorizontal: 40,
    marginTop: 40,
    flexDirection: "row",
  },

  chartArea: {
    flex: 1,
    height: 200,
    borderLeft: "1pt solid #ccc",
    borderBottom: "1pt solid #ccc",
    position: "relative",
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#ddd",
  },
  yAxis: {
    width: 30,
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginRight: 4,
  },
  yLabel: { fontSize: 8, color: "#444" },

  plotArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  barWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  foto: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginBottom: 3,
    objectFit: "cover",
  },
  bar: {
    width: 24,
    backgroundColor: "#F77737",
    borderRadius: 6,
  },

  nomeRow: {
    position: "absolute",
    bottom: -20,
    left: 0,
    right: 0,
    flexDirection: "row",
  },
  nome: {
    flex: 1,
    fontSize: 8,
    textAlign: "center",
    lineHeight: 1,
  },

  descricao: {
    marginTop: 60,
    marginHorizontal: 180,
    fontSize: 10,
    textAlign: "center",
    color: "#333",
  },
});

const RankingPerfisEngajadosPDF = ({ dados = [] }) => {
  if (!Array.isArray(dados) || dados.length === 0) return null;

  const engajados = dados.slice(0, 10);
  const max = Math.max(...engajados.map((e) => e.engajamento));
  const ySteps = [0, 0.03, 0.05, 0.07, 0.1];

  return (
    <Page size="A4" orientation="landscape" style={styles.page}>
      <Image src={headerImg} style={styles.header} />
      <Text style={styles.title}>Perfis mais engajados no Instagram</Text>

      <View style={styles.chartWrapper}>
        {/* Eixo Y */}
        <View style={styles.yAxis}>
          {ySteps.slice().reverse().map((y, i) => (
            <Text key={i} style={styles.yLabel}>
              {(y * 100).toFixed(0)}%
            </Text>
          ))}
        </View>

        {/* Área do gráfico */}
        <View style={styles.chartArea}>
          {/* linhas */}
          {ySteps.map((y, i) => (
            <View
              key={i}
              style={[
                styles.gridLine,
                { bottom: (y / Math.max(...ySteps)) * 180 },
              ]}
            />
          ))}

          {/* Barras */}
          <View style={styles.plotArea}>
            {engajados.map((p, i) => {
              // 🔎 pega a foto pelo catálogo; se não achar, usa ícone padrão
              const fotoUrl = fotoPorNome(p.nome) || iconInsta;
              return (
                <View key={i} style={styles.barWrapper}>
                  <Image src={fotoUrl} style={styles.foto} />
                  <View
                    style={[
                      styles.bar,
                      { height: (p.engajamento / max) * 150 },
                    ]}
                  />
                </View>
              );
            })}
          </View>

          {/* Nomes (absolute) */}
          <View style={styles.nomeRow}>
            {engajados.map((p, i) => {
              const partes = (p.nome || "").split(" ");
              const primeiro = partes[0];
              const sobrenome = partes.slice(1).join(" ");
              return (
                <View key={i} style={{ flex: 1, alignItems: "center" }}>
                  <Text style={styles.nome}>{primeiro}</Text>
                  {sobrenome && <Text style={styles.nome}>{sobrenome}</Text>}
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <Text style={styles.descricao}>
        Engajamento nas redes sociais é a interação ativa dos seguidores com seu
        conteúdo, como curtidas, comentários, compartilhamentos e mensagens,
        que mostram envolvimento e interesse.
      </Text>

      <Image src={footerImg} style={styles.footer} />
    </Page>
  );
};

export default RankingPerfisEngajadosPDF;
