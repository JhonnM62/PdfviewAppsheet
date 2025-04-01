#!/bin/bash

# Iniciar la aplicación Node.js en segundo plano
node /app/index.js &

# Esperar un momento para que Node.js inicie
sleep 5

# Iniciar Nginx en primer plano para mantener el contenedor en ejecución
nginx -g "daemon off;"