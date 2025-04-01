#!/bin/bash

# Iniciar Nginx en segundo plano
nginx -g "daemon off;" &

# Iniciar la aplicación Node.js
node index.js