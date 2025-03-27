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
    if (!pdfUrl) {
      return res.status(400).send("Se requiere la URL del PDF");
    }

    // Crear directorio para almacenar PDFs convertidos
    const outputDir = path.join(__dirname, "converted-pdfs");
    await fs.mkdir(outputDir, { recursive: true });

    // Generar un ID único para la conversión
    const conversionId = uuidv4();
    const conversionDir = path.join(outputDir, conversionId);
    await fs.mkdir(conversionDir);

    // Descargar el PDF
    const pdfResponse = await axios({
      method: "get",
      url: pdfUrl,
      responseType: "arraybuffer",
    });
    const pdfPath = path.join(conversionDir, "original.pdf");
    await fs.writeFile(pdfPath, pdfResponse.data);

    // Configurar PDFImage con opciones para recortar bordes (-trim) y ajustar la densidad (-density)
    const pdfImage = new PDFImage(pdfPath, {
      outputDirectory: conversionDir,
      convertOptions: {
        "-density": "150", // Ajusta la densidad para mejorar la calidad
        "-trim": "", // Recorta bordes innecesarios
      },
    });

    // Obtener el número de páginas del PDF
    const numPages = await pdfImage.numberOfPages();

    // Convertir cada página a imagen
    const convertPromises = [];
    for (let i = 0; i < numPages; i++) {
      convertPromises.push(pdfImage.convertPage(i));
    }
    const imagePaths = await Promise.all(convertPromises);

    // Extraer nombres de archivo de las rutas completas
    const imageFiles = imagePaths.map((fullPath) => path.basename(fullPath));

    // Generar URLs locales para las imágenes
    const localImageUrls = imageFiles.map(
      (imageName) =>
        `${req.protocol}://${req.get(
          "host"
        )}/images/${conversionId}/${imageName}`
    );

    // Responder con las URLs separadas por comas
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
