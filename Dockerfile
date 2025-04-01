FROM node:18-bullseye

# Actualizar repositorios e instalar dependencias necesarias
RUN apt-get update && apt-get install -y \
    poppler-utils \
    ghostscript \
    imagemagick \
    nginx \
    certbot \
    python3-certbot-nginx

# Modificar la política de ImageMagick para permitir la conversión de PDFs
RUN sed -i 's/<policy domain="coder" rights="none" pattern="PDF" \/>/<policy domain="coder" rights="read|write" pattern="PDF" \/>/' /etc/ImageMagick-6/policy.xml

# Configurar directorio de trabajo
WORKDIR /app

# Copiar archivos del proyecto
COPY package*.json ./
RUN npm install
COPY . .

# Crear directorios para certificados
RUN mkdir -p /etc/nginx/ssl

# Configurar Nginx como proxy inverso
RUN rm /etc/nginx/sites-enabled/default
COPY nginx.conf /etc/nginx/sites-available/
RUN ln -s /etc/nginx/sites-available/nginx.conf /etc/nginx/sites-enabled/

# Script de inicio para ejecutar tanto Node.js como Nginx
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Exponer puertos HTTP y HTTPS
EXPOSE 80
EXPOSE 443

# Comando para iniciar la aplicación
CMD ["/app/start.sh"]