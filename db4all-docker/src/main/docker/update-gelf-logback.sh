LOGBACK_TEMPLATE=$1
LOGBACK_DESTINATION=$2

# enable Graylog2
if [[ $GRAYLOG2_HOST ]]; then
  CURRENT_GRAYLOG2_PORT="${GRAYLOG2_PORT:-12201}"
  echo "Graylog2 enabled to $GRAYLOG2_HOST:$CURRENT_GRAYLOG2_PORT"
  sed -i -e "s#<host>udp:localhost</host>#<host>udp:$GRAYLOG2_HOST</host>#g" $LOGBACK_TEMPLATE
  sed -i -e "s#<port>12201</port>#<port>$CURRENT_GRAYLOG2_PORT</port>#g" $LOGBACK_TEMPLATE

  CONTAINER_ID=$(cat /proc/self/cgroup | grep "docker" | sed s/\\//\\n/g | tail -1)
  CONTAINER_ID_SHORT=$(cat /proc/self/cgroup | grep "docker" | sed s/\\//\\n/g | tail -1 | head -c 12)


  ADDITIONAL_FIELDS="containerId=$CONTAINER_ID"
  ADDITIONAL_FIELDS+=",containerIdShort=$CONTAINER_ID_SHORT"

  ADDITIONAL_FIELD_TYPES="containerId=String"
  ADDITIONAL_FIELD_TYPES+=",containerIdShort=String"

  # if in rancher, retrieve container data
  if curl --output /dev/null --silent --head --fail "http://rancher-metadata/latest/version"; then
    echo "Container launched in Rancher, fetching additional data"
    RANCHER_CONTAINER_NAME=$(curl -s http://rancher-metadata/latest/self/container/name)
    RANCHER_SERVICE_NAME=$(curl -s http://rancher-metadata/latest/self/service/name)
    RANCHER_STACK_NAME=$(curl -s http://rancher-metadata/latest/self/stack/name)

    ADDITIONAL_FIELDS+=",rancherContainerName=$RANCHER_CONTAINER_NAME"
    ADDITIONAL_FIELDS+=",rancherServiceName=$RANCHER_SERVICE_NAME"
    ADDITIONAL_FIELDS+=",rancherStackName=$RANCHER_STACK_NAME"

    ADDITIONAL_FIELD_TYPES+=",rancherContainerName=String"
    ADDITIONAL_FIELD_TYPES+=",rancherServiceName=String"
    ADDITIONAL_FIELD_TYPES+=",rancherStackName=String"
  fi

  sed -i -e "s#<additionalFields>applicationName=\(.*\)</additionalFields>#<additionalFields>applicationName=\1,$ADDITIONAL_FIELDS</additionalFields>#g" $LOGBACK_TEMPLATE
  sed -i -e "s#<additionalFieldTypes>applicationName=String</additionalFieldTypes>#<additionalFieldTypes>applicationName=String,$ADDITIONAL_FIELD_TYPES</additionalFieldTypes>#g" $LOGBACK_TEMPLATE

  cat $LOGBACK_TEMPLATE > $LOGBACK_DESTINATION
  echo "logback configuration:"
  cat $LOGBACK_DESTINATION
fi