const express = require("express");
const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");
const { fromBuffer } = require("pdf2pic");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

// Servir archivos estáticos para que las imágenes sean accesibles
app.use("/images", express.static(path.join(__dirname, "converted-pdfs")));

app.post("/convert-pdf-to-images", async (req, res) => {
  try {
    const { pdfUrl } = req.body;

    // Validar que se proporcione la URL del PDF
    if (!pdfUrl) {
      return res.status(400).send("Se requiere la URL del PDF");
    }

    // Crear directorio para almacenar PDFs convertidos
    const outputDir = path.join(__dirname, "converted-pdfs");
    await fs.mkdir(outputDir, { recursive: true });

    // Generar un ID único para esta conversión
    const conversionId = uuidv4();
    const conversionDir = path.join(outputDir, conversionId);
    await fs.mkdir(conversionDir);

    // Descargar el PDF
    const pdfResponse = await axios({
      method: "get",
      url: pdfUrl,
      responseType: "arraybuffer",
    });

    // Configuración de conversión
    const options = {
      density: 300,
      saveFilename: "page",
      savePath: conversionDir,
      format: "png",
      width: 2000,
      height: 2000,
    };

    // Convertir PDF a imágenes
    const convert = fromBuffer(pdfResponse.data, options);
    const pageConverted = await convert.bulk(-1); // Convierte todas las páginas

    // Generar URLs locales para las imágenes
    const localImageUrls = pageConverted.map(
      (page) =>
        `${req.protocol}://${req.get(
          "host"
        )}/images/${conversionId}/${path.basename(page.path)}`
    );

    // Responder con las URLs como string plano separado por comas
    res.send(localImageUrls.join(","));
  } catch (error) {
    console.error("Error en la conversión:", error);
    res.status(500).send("Ocurrió un error al procesar el PDF");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
