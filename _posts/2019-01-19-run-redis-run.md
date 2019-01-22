---
title: "Run Redis Run"
excerpt: "Cache your MySQL database with Redis. A full example including MySQL+Redis+NodeJS+React"
header:
  teaser: "/assets/images/cache-diagram.png"
tags: 
  - redis
toc: true
---
In my first [post](https://ohad-israeli.github.io/redis-the-beginning/), I have explained a little about what is Redis, and what are the common use cases for using it. In this post, we will bake a simple cache solution using Redis.


## The Recipe

* MySQL database - in our scenario will play the role of the primary database.
* Redis - which will be our blazing fast cache
* Backend server - which will handle clients requests and, fetch the data needed from the Redis and MySQL in case the data is not in Redis. 
* Client - will display the data which will be retrieved from the backend server.

<figure>
    <a href="/assets/images/cache-diagram.png"><img src="/assets/images/cache-diagram.png"></a>
</figure>

## Preparing the ingredients

To make things sweet and simple I will use docker to help me in setting up all the ingredients.

The first Docker container will be our database, in this case, I will use MySQL. To get things running on my mac, I did the following:

```bash
$docker run -p 3306:3306 -d --name mysql -e MYSQL_ROOT_PASSWORD=password mysql/mysql-server
```

Since I want access to the database, outside of the container I had to the following steps:

Login into to MySQL, within the docker container, and then login using the password that we have supplied in our case it was password.

```bash
$docker exec -it mysql bash
bash-4.2# mysql -uroot -ppassword
```
Then to enable access from outside the container we need to create a user and grant him privileges. (use % instead of localhost)


```sql
mysql> CREATE USER 'geek'@'%' IDENTIFIED WITH mysql_native_password BY 'password';
Query OK, 0 rows affected (0.00 sec)

mysql> GRANT ALL PRIVILEGES on * . * to 'geek'@'%';
Query OK, 0 rows affected (0.00 sec)
```

Then finally we can access MySQL from outside the container and load some data to it using this repo. We can also now connect with Workbench to our newly created database.


In order to spin up a Redis container on localhost, just run:

```bash
$docker run --name myredis -d redis
```
You can find some more info here about running Redis as a docker container.


## Hard Working Server

Now that we have our database all set and ready with some data we can query, let's bake the server.


Create the server working folder and initialize our node backend project

```bash
$mkdir QueryCacheServer
$npm -init -y
```
We will use Express framework, and install the Redis and MySQL clients as dependencies. We will also install sha1 for hashing the queries as our keys to Redis.

$npm install express redis mysql sha1
***Tip:*** if you are using npm 5, you do not to specify -S or --save flag to save as a dependency in your package.json file.



Now for some code, this is our server.js

```javascript
const express = require('express');
const path = require('path');
const redis = require('redis');
const mysql = require('mysql');
const sha1 = require('sha1');

const app = express();
const port = 5000;

// create connection to database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'geek',
    password: 'password',
    database: 'employees'
});

// connect to database
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});

// create and connect redis client to local instance.
const client = redis.createClient();
console.log('Connected to redis');

// Print redis errors to the console
client.on('error', (err) => {
    console.log("Error " + err);
});
client.flushall();

//Query data
function doQuery(req, res, next) {
    console.log('Start Query');
    //query from MySQL
    let query = `select * from employees.employees e where last_name like '%${req.query.name}%'`;
    let key = sha1(query);

    client.exists(key, (err, isExist) => {
        if (isExist) {
            console.log('Feeling lucky, key found in Redis');

            //mesure time against Redis
            console.time('CacheQuery');
            client.get(key, function (err, reply) {
                res.send(reply);
            });
            //end mesure time of query against MySQL
            console.timeEnd('CacheQuery');
            return;
        }
        else {
            console.log('No luck, get the data from DB');
            //measure time against MySQL
            console.time('DBQuery');
            db.query(query, (err, result) => {
                if (err) {
                    res.redirect('/');
                }
                let data = JSON.stringify(result);
                res.send(data);
                //end measure time of query against MySQL
                console.timeEnd('DBQuery');
                client.set(key, data, redis.print);
            });
        }
    });
};

// configure middleware
app.set('port', process.env.port || port); // set express to use this port

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/query', doQuery);

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});
```

As you can see in the code, we can test it with our browser at localhost:5000/query. 

We need to pass a query parameter for the name to search. If you will try it you can see that in the first time it, of course, needs to load the data from the DB on the second try it will get it from Redis.

Here are the results I got

```
Connected to redis
Server running on port: 5000
Connected to database
Start Query
No luck, get the data from DB
DBQuery: 152.330ms
Reply: OK
Start Query
Feeling lucky, key found in Redis
CacheQuery: 0.103ms
```
Quite impressive don't you think 😃
You can check out the repo [here](https://github.com/ohad-israeli/querycacheserver)

## The Client

Now it is time to create our good looking client, for that we will use React. To get started quickly with React just run:

```bash
$npx create-react-app querycacheclient
```
In my App.js I will just add a single component which we will soon implement, this is our App.js:


```javascript
import React, { Component } from 'react';
import EmpList from './EmpList'
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <EmpList/>
      </div>
    );
  }
}

export default App;
```

Next up is EmpList.js, the code is also relatively simple as well. The render method is built in two parts: 

The header which includes our search input, and a search button. The second part, we render the employees list, and each item in the list will consist of the full name only.



```javascript
import React, { Component } from 'react';

class EmpList extends Component {

    constructor() {
        super()
        this.state = {
            employees: [],
        }
    }

    handleInput = e => {
        this.searchPattern = e.target.value;
    }

    queryEmps = () => {
        console.time('DBQuery');
        // Fetch the data from our hard working server
        fetch(`http://localhost:5000/query?name=${this.searchPattern}`)
            .then(result => {
                console.timeEnd('DBQuery');
                return result.json();
            }).then(data => {
                // foreach row render the name of the employee
                let empData = data.map((empRec) => {
                    return (
                        <li key={empRec.emp_no}>{`${empRec.first_name} ${empRec.last_name}`}</li>
                    );
                });
                this.setState({ employees: empData });
            });
    }

    render() {
        return (
            <div className="EmpList">
                <div className="header">
                    <input>
                        placeholder="Search"
                        onChange={this.handleInput}
                        value={this.state.searchPattern}
                    />
                    <button onClick={this.queryEmps} Search </button>
                </div>
                <ul className="theList">{this.state.employees}</ul>
            </div>
        )
    }
}

export default EmpList
```

You can check out the repo [here](https://github.com/ohad-israeli/querycacheclient)
Now we can finally test all the pieces together.

<figure>
    <a href="/assets/images/cache-client.png"><img src="/assets/images/cache-client.png"></a>
</figure>

I leave it to you guys to see the results of queries that are cached compared to ones that are not.


Hope you like this recipe, waiting to hear from you on this or on any other subject.