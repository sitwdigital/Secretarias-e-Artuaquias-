// src/pdf/PDFDocument.jsx
import React from "react";
import { Page, Document, Image, StyleSheet, Text, View, Font } from "@react-pdf/renderer";

Font.register({
  family: "AMSIPRO",
  src: "/fonts/AMSIPRO-SEMIBOLD.ttf",
  fontWeight: "semibold",
});

// import das páginas
import RankingGanhoSeguidoresPDF from "./RankingGanhoSeguidoresPDF";
import RankingPerfisEngajadosPDF from "./RankingPerfisEngajadosPDF";
import RankingInstagramPDF from "./RankingInstagramPDF";
import RankingFacebookPDF from "./RankingFacebookPDF";
import RankingTwitterPDF from "./RankingTwitterPDF";
import SectionPublicacoesPDF from "./SectionPublicacoesPDF";

const styles = StyleSheet.create({
  fullPage: { width: "100%", height: "100%" },
  overlayContainer: {
    position: "relative",
    width: "100%",
    height: "100%",
  },
  dataOverlay: {
    position: "absolute",
    left: 50,
    top: 400,
    fontSize: 24,
    fontFamily: "AMSIPRO",
    fontWeight: "semibold",
    color: "#000",
  },
});

const enrichRankingGanho = (rankingGanho, instagram, facebook, twitter) => {
  const todos = [...(instagram || []), ...(facebook || []), ...(twitter || [])];
  return rankingGanho.map((p) => {
    const match = todos.find((x) => x.nome === p.nome);
    return { ...p, foto: match?.foto || null };
  });
};

const PDFDocument = ({ dados = {}, dataRelatorio }) => {
  const rankingGanhoEnriquecido = Array.isArray(dados.rankingGanho)
    ? enrichRankingGanho(dados.rankingGanho, dados.instagram, dados.facebook, dados.twitter)
    : [];

  return (
    <Document>
      {/* Página 1: Capa */}
      <Page size="A4" orientation="landscape">
        <View style={styles.overlayContainer}>
          <Image src="/pdf-assets/cover_Relatorio.png" style={styles.fullPage} />
          {dataRelatorio && <Text style={styles.dataOverlay}>{dataRelatorio}</Text>}
        </View>
      </Page>

      {/* Ranking Ganho de Seguidores */}
      {rankingGanhoEnriquecido.length > 0 && (
        <RankingGanhoSeguidoresPDF dados={rankingGanhoEnriquecido} />
      )}

      {/* Perfis mais engajados */}
      {Array.isArray(dados.perfisEngajados) && dados.perfisEngajados.length > 0 && (
        <RankingPerfisEngajadosPDF dados={dados.perfisEngajados} />
      )}

      {/* Publicações mais engajadas */}
      {Array.isArray(dados.publicacoesEngajadas) && dados.publicacoesEngajadas.length > 0 && (
        <SectionPublicacoesPDF dados={dados.publicacoesEngajadas} />
      )}

      {/* Instagram */}
      {Array.isArray(dados.instagram) && dados.instagram.length > 0 && (
        <RankingInstagramPDF dados={dados.instagram} />
      )}

      {/* Facebook */}
      {Array.isArray(dados.facebook) && dados.facebook.length > 0 && (
        <RankingFacebookPDF dados={dados.facebook} />
      )}

      {/* Twitter */}
      {Array.isArray(dados.twitter) && dados.twitter.length > 0 && (
        <RankingTwitterPDF dados={dados.twitter} />
      )}

      {/* Última página: Endpage */}
      <Page size="A4" orientation="landscape">
        <Image src="/pdf-assets/endpage_Relatorio.png" style={styles.fullPage} />
      </Page>
    </Document>
  );
};

export default PDFDocument;