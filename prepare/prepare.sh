$SOLR_HOME/bin/solr start -p 8983 -c -s $SOLR_HOME/server/solr

$SOLR_HOME/bin/solr zk upconfig -z localhost:9984 -n project -d ../db4all-api/dist/solr-home/project/conf
curl "http://localhost:8984/solr/admin/collections?action=CREATE&name=project&numShards=1&replicationFactor=1&maxShardsPerNode=-1&collection.configName=project"

$SOLR_HOME/bin/solr zk upconfig -z localhost:9984 -n entity -d ../db4all-api/dist/solr-home/entity/conf
curl "http://localhost:8984/solr/admin/collections?action=CREATE&name=entity&numShards=1&replicationFactor=1&maxShardsPerNode=-1&collection.configName=entity"


mvn  compile  -pl db4all-api -am -P dev
npm run serve