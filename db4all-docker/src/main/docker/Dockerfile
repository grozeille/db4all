# Author: Mathias Kluba
# Inspired from https://hub.docker.com/r/harisekhon/hbase/

FROM alpine:latest
MAINTAINER Mathias Kluba

ENV JAVA_HOME=/usr

LABEL Description="DB4ALL"

WORKDIR /

# bash => entrypoint.sh
# java => hbase engine
RUN set -euxo pipefail && \
    apk add --no-cache bash openjdk8-jre-base

RUN set -euxo pipefail && \
    apk add --no-cache curl zip

COPY entrypoint.sh /

RUN mkdir -p /solr-conf
COPY solr-conf /solr-conf/
RUN set -euxo pipefail && \
    chmod 0555 /entrypoint.sh

COPY profile.d/java.sh /etc/profile.d/


RUN mkdir -p /db4all

COPY update-gelf-logback.sh /
COPY logback.xml /tmp

RUN chmod 0555 /update-gelf-logback.sh

COPY db4all /db4all/
COPY maven/ /db4all/

CMD "/entrypoint.sh"