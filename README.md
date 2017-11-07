# DB4ALL


## Run local springboot API

```
mvn spring-boot:run -pl db4all-api -am -P dev
```

## Run local node WebApp

```
cd db4all-web
npm install
npm run serve
```

## Package & publish docker image

```
mvn clean deploy -pl db4all-docker -am -P docker,web
```

## Run the docker image

```
docker-compose up
```
