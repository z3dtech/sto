# sto
Generic fully RESTful API for quickly saving and fetching data objects. Does CRD-y things. JSON-API Compliant. Mongo integrated. Node-cache for cache. Express. Ideal for quick, simple, seemless saving and fetching.
<br /><br />

The purpose of sto is to create a generalized API that can seemlessly log and return JSON data objects. Whether you want somewhere to store and retreive the state of your Javascript app, the data of your IoT device, or the user status of your mobile game, sto provides you with the solution. 
<br /><br />
Basically if you don't want to build a database integration or set up a server+API yourself, or if you are limited by architectural or network security constraints, just let sto deal with the data for you.

# How to Install

```
npm init
npm install sto
sto setup
```

Note: `sto setup` will build a config.json file which you can edit directly. <br />More details on what you can do with it are provided in example.config.json in this repo. Do not edit the example.config.json.
<br /><br />
To run 
```
sto 
```
To run in perpetuity -- (incorporate `nohup` or `forever start` per your preference). A proper build process is in the works.

```
sto & > output.log
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
returns a hash 

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

**Delete by hash**
```
DELETE
body: { hashData: [hash], owner: [owner] } 
http(s)://[your-server-here]/v1/delete
```

**Delete by owner**
```
DELETE
body: { owner: [owner-here], skip: [n] } 
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
* Improve build process
* Typescript port + improved architecture
* Restructure routes file
* Interface class for handleCache and handleDB to support redis/sequelize
* Considering adding an /upload path for encoded/form-data


**Planned Integrations**									
* greenlock-express automated SSL certification with letsencrypt		
* AWS Lambda / Zapier callbacks							
* Redis for extended cache
* DataLoader for batched requests						
* Sequelize or PostLoader for relational dbs (PostGres, MySQl, etc.)
* GraphQL Hookup?
* express-ws for sockets										
* Mosca for MQTT										
* Travis CI / Automated Build Checks
* Gulp Grunt Docker builds

# License

[MIT]

Copyright 2017 z3dtech 

If you take my code and modify it without giving me credit, I will hunt you down, read through your code, adopt changes I like, and thank you for your efforts. You've been warned.
