#!/bin/bash

# Detener nginx temporalmente
service nginx stop

# Obtener certificados SSL con certbot
certbot certonly --standalone -d www.autosystemprojects.site --agree-tos --email tu_email@ejemplo.com --non-interactive

# Copiar certificados a la ubicación apropiada
cp /etc/letsencrypt/live/www.autosystemprojects.site/fullchain.pem /etc/nginx/ssl/
cp /etc/letsencrypt/live/www.autosystemprojects.site/privkey.pem /etc/nginx/ssl/

# Configurar permisos adecuados
chmod 644 /etc/nginx/ssl/fullchain.pem
chmod 600 /etc/nginx/ssl/privkey.pem

# Iniciar nginx nuevamente
service nginx start

echo "Configuración SSL completada."