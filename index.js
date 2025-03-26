const express = require("express");
const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");
const { PDFDocument } = require("pdf-lib");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const pdf2img = require("pdf2img");

// Definir __dirname para compatibilidad
const __dirname = path.resolve();

const app = express();
app.use(express.json());

// Servir archivos estáticos para que las imágenes sean accesibles
app.use("/images", express.static(path.join(__dirname, "converted-pdfs")));

// Función para convertir un PDF a imágenes usando pdf2img
function convertPDFToImages(pdfPath, outputDir) {
  return new Promise((resolve, reject) => {
    // Configurar opciones de conversión
    const options = {
      type: "png", // Tipo de imagen de salida
      size: 1024, // Tamaño de la imagen (ancho en píxeles)
      density: 150, // Densidad de la imagen (DPI)
      outputdir: outputDir, // Directorio de salida
      outputname: "page", // Prefijo del nombre de archivo
      page: null, // Convertir todas las páginas (null)
    };

    // Convertir PDF a imágenes
    pdf2img.convert(pdfPath, options, (err, info) => {
      if (err) {
        console.error("Error en la conversión de PDF:", err);
        return reject(err);
      }

      // Devolver información sobre las imágenes generadas
      resolve(info);
    });
  });
}

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

    // Cargar el PDF con pdf-lib para obtener información
    const pdfBytes = pdfResponse.data;
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();

    console.log(`El PDF tiene ${pageCount} páginas`);

    // Convertir PDF a imágenes usando pdf2img
    try {
      const conversionInfo = await convertPDFToImages(pdfPath, conversionDir);
      console.log("Conversión completada:", conversionInfo);

      // Leer archivos generados
      const imageFiles = await fs.readdir(conversionDir);
      const pngImages = imageFiles.filter(
        (file) => file.endsWith(".png") && file.startsWith("page")
      );

      if (pngImages.length === 0) {
        throw new Error("No se generaron imágenes durante la conversión");
      }

      // Generar URLs locales para las imágenes
      const localImageUrls = pngImages.map(
        (imageName) =>
          `${req.protocol}://${req.get(
            "host"
          )}/images/${conversionId}/${imageName}`
      );

      // Responder con las URLs como string plano separado por comas
      res.send(localImageUrls.join(","));
    } catch (conversionError) {
      console.error(
        "Error en la conversión de PDF a imágenes:",
        conversionError
      );
      throw conversionError;
    }
  } catch (error) {
    console.error("Error en la conversión:", error);
    res.status(500).send("Ocurrió un error al procesar el PDF");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
