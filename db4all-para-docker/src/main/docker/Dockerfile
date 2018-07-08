# Author: Mathias Kluba

FROM alpine:latest
MAINTAINER Mathias Kluba

ENV JAVA_HOME=/usr

LABEL Description="PARA WITH CASSANDRA"

WORKDIR /

# bash => entrypoint.sh
RUN set -euxo pipefail && \
    apk add --no-cache bash openjdk8-jre-base

RUN set -euxo pipefail && \
    apk add --no-cache curl zip

COPY profile.d/java.sh /etc/profile.d/

COPY entrypoint.sh /

 RUN mkdir -p /db4all

# to send log to GELF
#COPY update-gelf-logback.sh /
#COPY logback.xml /tmp
#RUN chmod 0555 /update-gelf-logback.sh

# the maven docker plugin output
COPY maven/ /db4all/

# the configuration files
COPY db4all /db4all/

CMD "/entrypoint.sh"