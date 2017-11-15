# sto.js
Generic fully restful node API for quickly saving and fetching data objects. Does CRD-y things. JSON-API Compliant. Mongo integrated. Node-cache for cache. Express.
<br /><br />
Ideal for quick and simple logging and fetching.
<br />

# How to Install

``
npm init
npm install sto
sto setup
``

Note: `sto setup` will build a config.json file which you can edit directly. More details on what you can do with it are provided in example.config.json.
<br />
To run in perpetuity

``
sto &
``


# How to Use:

**Insert data**
``
//cURL request here

``

**Fetch last input**
``
//cURL request here

``

**Fetch last 5 inputs**
``
//cURL request here

``

**Fetch page 2 of inputs split by 5**
`` 
//cURL request here

``

**Fetch by hash (unique to data)**
``
//cURL request here

``

**Delete by hash**
``
//cURL request here
``

**Delete by owner**
``
//cURL request here
``

# Things to do (please help!):

Write docs<br />															
Publish	<br />
Build standardized clients<br />
<br />
**Standard Clients**
*NodeJS
*Python
*Lua
*PHP
*Java
*etc.

<br />
**More Tests**																
* Test for multiple data entries 				
* Test Delete 									
* Test pagination 								
* Test for improperly formatted data 			
* Test for proper headers						
<br />


**Planned Integrations**
* Log4JS Errors to err.log											
* greenlock-express automated SSL certification with letsencrypt											
* AWS Lambda callbacks														
* Mosca for MQTT																
* Redis for extended cache															
* Sequelize for relational dbs (PostGres, MySQl, etc.)
* DynamoDB, Cassandra, Aurora											
* Travis CI / Automated Build Checks
