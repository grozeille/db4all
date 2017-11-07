#!/usr/bin/env bash
#  vim:ts=4:sts=4:sw=4:et
#
#  Author: Hari Sekhon
#  Date: 2016-04-24 21:29:46 +0100 (Sun, 24 Apr 2016)
#
#  https://github.com/harisekhon/Dockerfiles
#
#  License: see accompanying Hari Sekhon LICENSE file
#
#  If you're using my code you're welcome to connect with me on LinkedIn and optionally send me feedback
#
#  https://www.linkedin.com/in/harisekhon
#

set -euo pipefail
[ -n "${DEBUG:-}" ] && set -x

srcdir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

export JAVA_HOME="${JAVA_HOME:-/usr}"

export SOLR_HOME="/solr"

# solr -e cloud fails if not called from $SOLR_HOME
cd "$SOLR_HOME"

# exits with 141 for pipefail breaking yes stdout
set +o pipefail
#solr -e cloud -noprompt
solr start -p 8983 -c -s $SOLR_HOME/server/solr

while ! nc -z localhost 8983; do
  sleep 0.1 # wait for 1/10 of the second before check again
done

while ! nc -z localhost 9983; do
  sleep 0.1 # wait for 1/10 of the second before check again
done