#!/usr/bin/env bash

set -euo pipefail
[ -n "${DEBUG:-}" ] && set -x

srcdir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

export JAVA_HOME="${JAVA_HOME:-/usr}"
export SOLR_URL=http://solrcloud:8983/solr

# wait for solr
until $(curl --output /dev/null --silent --head --fail $SOLR_URL); do
  printf '.'
  sleep 5
done


echo "Creating Project collection"
# solr zk upconfig -z localhost:9983 -n project -d /solr-conf/project
(cd /solr-conf/project/conf && zip -r - *) > project.zip
curl -X POST --header "Content-Type:application/octet-stream" --data-binary @project.zip "$SOLR_URL/admin/configs?action=UPLOAD&name=project"

curl "$SOLR_URL/admin/collections?action=CREATE&name=project&numShards=1&replicationFactor=1&maxShardsPerNode=-1&collection.configName=project"
curl "$SOLR_URL/admin/collections?action=RELOAD&name=project"

echo "Creating Entity collection"
# solr zk upconfig -z localhost:9983 -n entity -d /solr-conf/entity
(cd /solr-conf/entity/conf && zip -r - *) > entity.zip
curl -X POST --header "Content-Type:application/octet-stream" --data-binary @entity.zip "$SOLR_URL/admin/configs?action=UPLOAD&name=entity"

curl "$SOLR_URL/admin/collections?action=CREATE&name=entity&numShards=1&replicationFactor=1&maxShardsPerNode=-1&collection.configName=entity"
curl "$SOLR_URL/admin/collections?action=RELOAD&name=entity"


echo "Starting DB4ALL"
cd /db4all
chmod +x ./start.sh
./start.sh