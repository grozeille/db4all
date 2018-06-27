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


## TODO

1. **ENH**: Parameter validation of the API
2. **BUG**: When we remove all rows of a table, the UI doesn't display the columns anymore
3. **ENH**: When pushing data in a table, ignore the columns with bad columnId
4. **ENH**: When pushing data in a table, ignore the data that are not correctly formated depending of the column type
5. **ENH**: Be able to "PATCH" in the table data API, to add new rows or update existing rows without replacing everithing
6. **ENH**: To handle large volumes, split the data in "bunch" of rows (ex: 500)
6. **ENH**: Update only lines / bunch of lines that changed when updating a table
