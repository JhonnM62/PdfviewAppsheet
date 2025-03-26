const express = require("express");
const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");
const { Poppler } = require("node-poppler");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

const poppler = new Poppler();

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

    // Configuración de la conversión con node-poppler
    // Se generarán archivos con el prefijo "page", ej: page-1.png, page-2.png, etc.
    const opts = {
      pngFile: true, // Genera salida en formato PNG
      singleFile: false, // Convierte todas las páginas del PDF
      firstPageToConvert: 1, // Primera página a convertir
      lastPageToConvert: 0, // 0 significa hasta la última página
      // Puedes agregar más opciones según la documentación de node-poppler
    };

    // Convertir PDF a imágenes. El segundo parámetro es la ruta base para los archivos de salida.
    await poppler.pdfToCairo(pdfPath, path.join(conversionDir, "page"), opts);

    // Listar los archivos generados, filtrando solo los PNG con el prefijo "page"
    const files = await fs.readdir(conversionDir);
    const pngImages = files.filter(
      (file) => file.endsWith(".png") && file.startsWith("page")
    );

    // Opcional: renombrar los archivos para cambiar el guión por un guion bajo, si lo deseas.
    const renamedImages = await Promise.all(
      pngImages.map(async (oldName) => {
        const newName = oldName.replace("page-", "page_");
        await fs.rename(
          path.join(conversionDir, oldName),
          path.join(conversionDir, newName)
        );
        return newName;
      })
    );

    // Generar URLs locales para las imágenes
    const localImageUrls = renamedImages.map(
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
