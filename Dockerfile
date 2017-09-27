FROM nginx:1.11.12-alpine

COPY . /usr/share/nginx/html/
COPY ./nginx/nginx.conf /etc/nginx/
COPY ./nginx/default.conf /etc/nginx/conf.d/
COPY ./nginx/nginx-start.sh /etc/nginx/

RUN touch /var/run/nginx.pid && \
  chown -R nginx:nginx /var/run/nginx.pid && \
  chown -R nginx:nginx /var/cache/nginx && \
  chown -R nginx:nginx /etc/nginx && \
  chmod 755 /etc/nginx/nginx-start.sh && \
  rm -rf /usr/share/nginx/html/nginx

USER nginx

CMD ["/etc/nginx/nginx-start.sh"]
