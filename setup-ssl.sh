#!/bin/bash

# Este script debe ejecutarse después de que el contenedor esté en funcionamiento
# y el dominio apunte correctamente al servidor

# Detener Nginx temporalmente
service nginx stop

# Obtener certificado SSL con Certbot
certbot certonly --standalone \
  --preferred-challenges http \
  --agree-tos \
  --email tu_email@example.com \
  -d www.autosystemprojects.site \
  -d autosystemprojects.site

# Copiar los certificados al directorio de nginx
cp /etc/letsencrypt/live/www.autosystemprojects.site/fullchain.pem /etc/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/www.autosystemprojects.site/privkey.pem /etc/nginx/ssl/key.pem

# Reiniciar Nginx
service nginx start

# Configurar renovación automática
echo "0 0,12 * * * root python -c 'import random; import time; time.sleep(random.random() * 3600)' && certbot renew -q && service nginx reload" | tee -a /etc/crontab > /dev/null