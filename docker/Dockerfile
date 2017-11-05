# Author: Mathias Kluba

FROM alpine:latest
MAINTAINER Mathias Kluba

ARG HBASE_VERSION=1.2.6
ENV PATH $PATH:/hbase/bin

ARG SOLRCLOUD_VERSION=7.1.0
ARG TAR="solr-$SOLRCLOUD_VERSION.tgz"
ENV PATH $PATH:/solr/bin

ENV JAVA_HOME=/usr

LABEL Description="DB4ALL"

WORKDIR /

# bash => entrypoint.sh
# java => hbase engine
RUN set -euxo pipefail && \
    apk add --no-cache bash openjdk8-jre-base

RUN set -euxo pipefail && \
    apk add --no-cache wget tar && \
    # HBase 1.2.6
    url_archive="http://archive.apache.org/dist/hbase/$HBASE_VERSION/hbase-$HBASE_VERSION-bin.tar.gz";  \
    # --max-redirect - some apache mirrors redirect a couple times and give you the latest version instead
    #                  but this breaks stuff later because the link will not point to the right dir
    #                  (and is also the wrong version for the tag)
    wget -t 10 --max-redirect 1 --retry-connrefused -O "hbase-$HBASE_VERSION-bin.tar.gz" "$url_archive" && \
    mkdir "hbase-$HBASE_VERSION" && \
    tar zxf "hbase-$HBASE_VERSION-bin.tar.gz" -C "hbase-$HBASE_VERSION" --strip 1 && \
    test -d "hbase-$HBASE_VERSION" && \
    ln -sv "hbase-$HBASE_VERSION" hbase && \
    rm -fv "hbase-$HBASE_VERSION-bin.tar.gz" && \
    { rm -rf hbase/{docs,src}; : ; } && \
    apk del tar wget

RUN set -euxo pipefail && \
    apk add --no-cache wget tar && \
    # Solr 4+ only
    url_archive="http://archive.apache.org/dist/lucene/solr/$SOLRCLOUD_VERSION/$TAR"; \
    #for x in {1..10}; do wget -t 10 --retry-connrefused -c -O "$TAR" "$url" && break; done && \
    # --max-redirect - some apache mirrors redirect a couple times and give you the latest version instead
    #                  but this breaks stuff later because the link will not point to the right dir
    #                  (and is also the wrong version for the tag)
    wget -t 10 --max-redirect 1 --retry-connrefused -O "${TAR}" "$url_archive" && \
    tar zxf "$TAR" && \
    # check tarball was extracted to the right place, helps ensure it's the right version and the link will work
    test -d "solr-$SOLRCLOUD_VERSION" && \
    ln -sv "solr-$SOLRCLOUD_VERSION" solr && \
    rm -fv "$TAR" && \
    { rm -rf solr/doc; : ; } && \
    apk del tar wget

RUN set -euxo pipefail && \
    apk add --no-cache curl

COPY entrypoint.sh /

COPY conf/hbase-site.xml /hbase/conf/

RUN mkdir -p /solr-conf
COPY solr-home /solr-conf/
COPY solr-start.sh /
RUN set -euxo pipefail && \
    adduser -S -s /bin/bash solr && \
    chown -R solr /solr* && \
    chmod 0555 /entrypoint.sh /solr-start.sh

COPY profile.d/java.sh /etc/profile.d/

COPY "db4all-api-1.0-SNAPSHOT.jar" ./

EXPOSE 8983 16010 9800

CMD "/entrypoint.sh"