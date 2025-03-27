FROM node:18-bullseye as bot
# Establece el directorio de trabajo en el contenedor

# Actualizar repositorios e instalar dependencias
RUN apt-get update && apt-get install -y poppler-utils imagemagick

# Modificar la política de ImageMagick para permitir la conversión de PDFs
RUN sed -i 's/<policy domain="coder" rights="none" pattern="PDF" \/>/<policy domain="coder" rights="read|write" pattern="PDF" \/>/' /etc/ImageMagick-6/policy.xml

WORKDIR /app

# Copia los archivos de tu proyecto al contenedor
COPY package*.json ./

# Instala las dependencias del proyecto
RUN npm install

# Copia el resto de los archivos del proyecto al contenedor
COPY . .



# Comando para iniciar tu aplicación Node.js
CMD ["node", "index.js"]