FROM postgres:15-alpine

# Install extensions
RUN apk add --no-cache postgresql-contrib

# Add custom configuration
COPY postgresql.conf /etc/postgresql/postgresql.conf
COPY init.sql /docker-entrypoint-initdb.d/

EXPOSE 5432

CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]