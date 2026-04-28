FROM nginx:alpine

RUN apk add --no-cache curl

COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/default.conf /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

EXPOSE 80 443 8080

CMD ["nginx", "-g", "daemon off;"]