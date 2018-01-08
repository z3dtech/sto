# sto
Generic fully RESTful CRUD API for quickly saving and fetching data objects. JSON-API Compliant. Mongo integrated. Node-cache for cache. Express and express-ws. Ideal for quick, simple, seemless saving and fetching.
<br /><br />

The purpose of sto is to create a generalized API that can seemlessly log and return JSON data objects. Whether you want somewhere to store and retreive the state of your Javascript app, the data of your IoT device, or the user status of your mobile game, sto provides you with an easy to setup solution. 
<br /><br />
Basically if you don't want to build a custom database integration or set up a server+API yourself, and your use case is tremendously simple, or if you are limited from direct database interaction by architectural or network security constraints, just set up sto and go.

# How to Install

```
npm install -g sto
sto setup
```

Note: `sto setup` will build a config.json file which you can edit directly. <br />More details on what you can do with it are provided in example.config.json in this repo. Do not edit the example.config.json.
<br /><br />
To run 
```
sto 
```

(**NOTE**: logs will still be populated in the ./logs/ directory for warnings and errors. In future versions this will be adjustable in the config.)
<br />


# How to Use:

Make HTTP requests to the following paths. For a more detailed implementation, check out test.js.

**Insert data**
```
POST
body: {collection: [collection], owner: [owner], data: [JSON-data-content]}
http(s)://[your-server-here]/v1/insert
returns a hash + id
```

**Update data**
```
PUT
body: {collection: [collection], id: [id], data: [JSON-data-content]}
http(s)://[your-server-here]/v1/update
returns a hash + id
```

**Fetch by id**
```
GET
http(s)://[your-server-here]/v1/[collection]/id/[id]
```
**Fetch last input**
```
GET
http(s)://[your-server-here]/v1/[collection]/last/[owner]
```

**Fetch last 5 inputs**
```
GET
http(s)://[your-server-here]/v1/[collection]/last/[owner]/5
```

**Fetch page 2 of inputs split by 5 (newest first)**
```
GET
http(s)://[your-server-here]/v1/[collection]/last/[owner]/5/page/1
# 0 indexed pages
```

**Fetch first 5 inputs**
```
GET
http(s)://[your-server-here]/v1/[collection]/first/[owner]/5
```

**Fetch page 2 of inputs split by 5 (oldest first)**
```
GET
http(s)://[your-server-here]/v1/[collection]/first/[owner]/5/page/1
# 0 indexed pages
```

**Fetch by hash (unique to data)**
```
GET
http(s)://[your-server-here]/v1/[collection]/hash/[hash]
```

**Get a total count of data objects stored for a collection/owner**
```
GET
http(s)://[your-server-here]/v1/[collection]/count/[owner]
#owner is optional 
```

**Delete by id**
```
DELETE
body: { collection: [collection], id: [id] } 
http(s)://[your-server-here]/v1/delete
```

**Delete by hash (with owner-specific option)**
```
DELETE
body: { collection: [collection], hashData: [hash], owner: [owner] } 
http(s)://[your-server-here]/v1/delete
```

**Delete all documents by owner (with skip last n inserts option)**
```
DELETE
body: { collection: [collection], owner: [owner-here], skip: [n] } 
http(s)://[your-server-here]/v1/delete
#including a skip value will preserver the last n inserts for specified owner
```

(**NOTE**: Collection specifications are always optional in these requests. If you do not include a collection, the default will be read from the config file.)


# Things to do (please help!):

Write more docs<br />
Write more tests<br />
Integrations<br />
Build more standardized clients+wrappers<br />
<br />


**Wrappers**
* [x] [Python](https://github.com/z3dtech/StoPy) 
* [ ] Node
* [ ] Lua
* [ ] Ruby
* [ ] Java
* [ ] C++
* etc.

<br />


**Key Feature Priorities**
* Managed API Keys in storage
* Improved build process
* Typescript port
* Interface class for 
	- handleCache -> Redis
	- handleDB -> sequelize (postgres + mysql), aurora, dynamo
* Adding an /upload path for encoded/form-data

**Planned Integrations**									
* AWS Lambda / Zapier callbacks							
* Redis for extended cache
* DataLoader for batched requests						
* Sequelize or PostLoader for relational dbs (PostGres, MySQl, etc.)								* Mosca for MQTT					
* Gulp Grunt Webpack builds
* Docker File					
* Travis CI / Automated Build Checks

# License

[MIT]

Copyright 2017 z3dtech 

If you take my code and modify it without giving me credit, I will hunt you down, read through your code, adopt changes I like, and thank you for your efforts. You've been warned.
