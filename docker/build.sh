#!/usr/bin/env bash

cp -r ../db4all-api/dist/solr-home ./
cp ../db4all-api/target/db4all-api-1.0-SNAPSHOT.jar ./

docker build . -t grozeille/db4all:1.0
#docker push grozeille/db4all:1.0