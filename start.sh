#!/bin/bash

# Crear certificados SSL autofirmados temporales
if [ ! -f "/etc/nginx/ssl/cert.pem" ]; then
    echo "Generando certificados SSL temporales..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/key.pem -out /etc/nginx/ssl/cert.pem \
        -subj "/C=ES/ST=State/L=City/O=Organization/CN=www.autosystemprojects.site"
fi

# Iniciar nginx en segundo plano
echo "Iniciando Nginx..."
nginx -g "daemon off;" &

# Iniciar la aplicación Node
echo "Iniciando aplicación Node.js..."
node /app/index.js