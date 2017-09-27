#!/bin/sh

PORT="${PORT:-8080}"
/bin/sed -i "s/listen 8080/listen ${PORT}/" /etc/nginx/conf.d/default.conf
nginx -g "daemon off;"
