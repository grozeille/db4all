#!/usr/bin/env bash

set -euo pipefail
[ -n "${DEBUG:-}" ] && set -x

srcdir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

export JAVA_HOME="${JAVA_HOME:-/usr}"

# tries to run zookeepers.sh distributed via SSH, run zookeeper manually instead now
#RUN sed -i 's/# export HBASE_MANAGES_ZK=true/export HBASE_MANAGES_ZK=true/' /hbase/conf/hbase-env.sh
echo
echo "Starting local Zookeeper"
mkdir -p /hbase/logs/
/hbase/bin/hbase zookeeper &>/hbase/logs/zookeeper.log &
echo

echo "Starting HBase"
/hbase/bin/start-hbase.sh
echo

echo "Starting Solr"

export SOLR_USER="solr"

if [ "$(whoami)" = "root" ]; then
    su - "$SOLR_USER" <<-EOF
        # preserve PATH from root
        export PATH="$PATH"
        /solr-start.sh
EOF
else
    solr-start.sh
fi

sleep 180

echo "Creating Project collection"
solr zk upconfig -z localhost:9983 -n project -d /solr-conf/project
curl "http://localhost:8983/solr/admin/collections?action=CREATE&name=project&numShards=1&replicationFactor=1&maxShardsPerNode=-1&collection.configName=project"
curl "http://localhost:8983/solr/admin/collections?action=RELOAD&name=project"

echo "Creating Project entity"
solr zk upconfig -z localhost:9983 -n entity -d /solr-conf/entity
curl "http://localhost:8983/solr/admin/collections?action=CREATE&name=entity&numShards=1&replicationFactor=1&maxShardsPerNode=-1&collection.configName=entity"
curl "http://localhost:8983/solr/admin/collections?action=RELOAD&name=entity"


echo "Starting DB4ALL"
cd /db4all
chmod +x ./start.sh
./start.sh