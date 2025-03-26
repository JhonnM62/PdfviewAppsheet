const express = require("express");
const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");
const { PDFImage } = require("pdf-image");
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

    // Guardar PDF temporalmente
    const pdfPath = path.join(conversionDir, "original.pdf");
    await fs.writeFile(pdfPath, pdfResponse.data);

    // Configuración de conversión
    const convertPdfToImages = async (pdfPath) => {
      const pdfImage = new PDFImage(pdfPath, {
        outputDirectory: conversionDir,
        fileName: "page_",
        convertOptions: {
          "-density": "300",
          "-quality": "90",
        },
      });

      try {
        const imagePaths = await pdfImage.convertAll();
        return imagePaths;
      } catch (error) {
        console.error("Error en conversión:", error);
        throw error;
      }
    };

    // Convertir PDF a imágenes
    const imagePaths = await convertPdfToImages(pdfPath);

    // Leer archivos generados
    const imageFiles = await fs.readdir(conversionDir);
    const pngImages = imageFiles.filter(
      (file) => file.endsWith(".png") && file.startsWith("page_")
    );

    // Generar URLs locales para las imágenes
    const localImageUrls = pngImages.map(
      (imageName) =>
        `${req.protocol}://${req.get(
          "host"
        )}/images/${conversionId}/${imageName}`
    );

    // Responder con las URLs como string plano separado por comas
    res.send(localImageUrls.join(","));
  } catch (error) {
    console.error("Error en la conversión:", error);
    res.status(500).send("Ocurrió un error al procesar el PDF");
  }
});

const PORT = process.env.PORT || 8004;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
