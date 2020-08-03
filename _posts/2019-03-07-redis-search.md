---
title: "Search On Steroids"
excerpt: "Create blazing fast search based applications with RediSearch"
header:
  teaser: "/assets/images/search.png"
tags:
  - redis
  - search
  - react
toc: true
---

<figure>
    <a href="/assets/images/search.png"><img src="/assets/images/search.png"></a>
</figure>

One of the common use cases that I have encountered lately is to have search capabilities. This capability seems like a common standard now for all applications and channels that we tackle during our day to day use cases. In this post, I will address the needs and some of the challenges, and show how easy it is to implement blazing fast search capabilities using [RediSearch](http://redisearch.io).

## The Recipe
We will create a product catalog, the products will be indexed in Redis using RediSearch capabilities and on top, we will create a simple web client to search the products including autocomplete with React.
* Redis - will take the role of our blazing fast search engine.
* Search server - which will generate, index random product data and serve as the backend for the autocomplete and search capabilities.
* Client - client to query the generated data, with autocomplete capability.

## Prolog
Text search and autocomplete, is around us for quite a while we need it when we are looking for a friend in social media, maps searches, product catalog and many more. There are quite a few known solutions like Lucene and engines that are based on it such as Solr and ElasticCache, in this post, I will explore an extension to Redis which offers these capabilities with the performance that you would expect from Redis...

## Preparing the ingredients

Like always I will spin a Redis container which also contains the RediSearch module, and will require a password for accessing the Redis instance.
For those who do not know, Redis offers the ability to extend Redis core capabilities and there are some great extensions that are ready to use, or you can even create your own, you can find some more info [here](https://redis.io/modules)

```bash
$docker run --name redisearch -p 6379:6379 -d redislabs/redisearch --requirepass password --loadmodule /usr/lib/redis/modules/redisearch.so
```

You can find some more info [here](https://hub.docker.com/_/redis) about running Redis as a docker container.

## Search Server

Now that we have our Redis instance ready, with the search capabilities up and ready we can start and index some data.
Just a second before we start it is good to know that one of the challenges with search engines, is that the data needs to be indexed before it can be accessed for searches. This means that there is a delay between we get new data, and the time that the data can be accessed by our customers and able to be searched. Think about this in the gaming industry, you have joined a new mobile game, and you would like your friends to be able to search you up so you can play together for example.

As you can see this can be quite challenging when we want to deliver search capabilities with an immediate availability as new data arrives in our system.
With all that said, let's see how this can be done with RediSearch 🙂

So let's do some coding, and see how we can easily index some data with RediSearch.

```bash
$npm -init -y
```
We will use [Faker](https://github.com/Marak/faker.js) to generate data, yargs for parsing argv and of course, Redis.
In the generator code, I will use the simple Redis client, so that you can examine RediSearch API directly. You can find out more about the available [clients](https://oss.redislabs.com/redisearch/Clients.html)

```bash
$npm install faker yargs express redis 
```

Just before the full code for our backend, let's see how we will use the search API, we will use 4 methods:
* Create - to create the new index with a schema
* Add - to add new data to our index
* Search - to search the data, and including highlighting which is super cool (surrounded with bold HTML tag)
* Suggest - autocomplete, suggest results according to a passed string

```javascript
    // This is how we create an index, we just supply the index name, and specify the schema.
    let args = [
        indexName,
        'SCHEMA', 'company', 'text', 'product', 'text', 'color', 'text', 'price', 'numeric'
    ];

    redisClient.send_command(
        'FT.CREATE',
        args,
        function (err) {
            if (err) {
                console.error(err);
            }
        });
    //////////////////////////

    // Now we can index some documents
    let args = [
        indexName,
        id,
        1,          // default - this should be to be set in future versions
        'REPLACE',  // do an UPSERT style insertion
        'FIELDS', 'company', companyName, 'product', productName, 'color', faker.commerce.color(), 'price', faker.commerce.price()
    ];

    redisClient.send_command(
        'FT.ADD',
        args,
        function (err) {
            if (err) {
                console.error(err);
            }
        });
    //////////////////////////

    // Now we can easily search our documents, including highlighting
    let query = req.query.search;
    let args = [
        indexName,
        query,
        'HIGHLIGHT'
    ];

    redisClient.send_command(
        'FT.SEARCH',
        args,
        function (err, resp) {
            if (err) {
                console.error(err);
                res.send(err.message);
            } else {
                // transform redis RESP to REST, read more about RESP https://redis.io/topics/protocol
                let result = [];
                resp.slice(1).map(function (record) {
                    if (Array.isArray(record)) {
                        let obj = {}
                        for (var i = 0; i < record.length; i += 2) {
                            obj[record[i]] = record[i + 1];
                        }
                        result.push(obj);
                    }
                });
                res.send(result);
            }
        });

    //////////////////////////

    // autocomplete
    let suggest = req.query.suggest;
    let args = [
        suggProdIndex,
        suggest
    ];

    redisClient.send_command(
        'FT.SUGGET',
        args,
        function (err, resp) {
            if (err) {
                console.error(err);
                res.send(err.message);
            } else {
                let result = [];
                resp.map(function (record) {
                    let obj = {name: record}
                    result.push(obj);
                });
                res.send(result);
            }
        });
```

Now for some coding, this is the final version of our server side code. I

```javascript
const
    argv = require('yargs')                         // yargs' is a command line parser
        .demandOption('credentials')                // complain if the '--credentials' argument isn't supplied
        .argv,
    express = require('express'),
    redis = require('redis'),                       // node_redis module
    credentials = require(argv.credentials),        // Our credentials are stored in a node_redis connection object - see https://github.com/NodeRedis/node_redis#rediscreateclient
    redisClient = redis.createClient(credentials),  // Client object for connection to the Redis server
    faker = require('faker'),                       // Faker will be used to generate data
    indexName = 'searchIndex',                      // the name of the search index that we will be created
    suggCompIndex = 'autoCompanyIndex',             // auto complete index for company
    suggProdIndex = 'autoProductIndex'              // auto complete index for product



const app = express();

const port = 5000;

// Print redis errors to the console
redisClient.on('error', (err) => {
    console.error(err);
}).on('connection', () => {
    console.log('Connected to Redis');
});

//Query data
function doSearch(req, res, next) {
    let query = req.query.search;
    let args = [
        indexName,
        query,
        'HIGHLIGHT'
    ];

    redisClient.send_command(
        'FT.SEARCH',
        args,
        function (err, resp) {
            if (err) {
                console.error(err);
                res.send(err.message);
            } else {
                // transform redis RESP to REST, read more about RESP https://redis.io/topics/protocol
                let result = [];
                resp.slice(1).map(function (record) {
                    if (Array.isArray(record)) {
                        let obj = {}
                        for (var i = 0; i < record.length; i += 2) {
                            obj[record[i]] = record[i + 1];
                        }
                        result.push(obj);
                    }
                });
                res.send(result);
            }
        });
};

//Query data
function doSuggest(req, res, next) {
    let suggest = req.query.suggest;
    let args = [
        suggProdIndex,
        suggest
    ];

    redisClient.send_command(
        'FT.SUGGET',
        args,
        function (err, resp) {
            if (err) {
                console.error(err);
                res.send(err.message);
            } else {
                let result = [];
                resp.map(function (record) {
                    let obj = {name: record}
                    result.push(obj);
                });
                res.send(result);
            }
        });
};

//Index data
function doIndex(req, res, next) {
    if(!req.query.numberOfDocs) {
        res.send('numberOfDocs param is missing');
        return;
    }
    // check if the index is found
    redisClient.send_command('FT.INFO', [indexName], function (err, info) {
        if (err) {
            // if the index does not exist then create it
            if (String(err).indexOf('Unknown Index name') > 0) {
                let args = [
                    indexName,
                    'SCHEMA', 'company', 'text', 'product', 'text', 'color', 'text', 'price', 'numeric'
                ];

                redisClient.send_command(
                    'FT.CREATE',
                    args,
                    function (err) {
                        if (err) {
                            console.error(err);
                        }
                    });
            }

        }

        // index some documents
        for (i = 0; i < req.query.numberOfDocs; i++) {
            indexDocument(i);
        }
        res.send('OK');
    });
}

function indexDocument(id) {
    const companyName = faker.company.companyName();
    const productName = faker.commerce.productName();

    let args = [
        indexName,
        id,
        1,          // default - this should be to be set in future versions
        'REPLACE',  // do an UPSERT style insertion
        'FIELDS', 'company', companyName, 'product', productName, 'color', faker.commerce.color(), 'price', faker.commerce.price()
    ];

    redisClient.send_command(
        'FT.ADD',
        args,
        function (err) {
            if (err) {
                console.error(err);
            }
        });

    args = [
        suggCompIndex,
        companyName,
        100
    ];

    redisClient.send_command(
        'FT.SUGADD',
        args,
        function (err) {
            if (err) {
                console.error(err);
            }
        });

    args = [
        suggProdIndex,
        productName,
        100
    ];

    redisClient.send_command(
        'FT.SUGADD',
        args,
        function (err) {
            if (err) {
                console.error(err);
            }
        });
}

app.set('port', process.env.port || port); // set express to use this port

// configure middleware
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/search', doSearch);

app.get('/suggest', doSuggest);

app.get('/index', doIndex);

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});
```
You can test our server by running it

```bash
$node server.js --credentials ./cred.json
```

Then you can test it from your browser, for example:

```
http://localhost:5000/index?numberOfDocs=1000
http://localhost:5000/search?search=sil*
```
As you can see indexing using RediSearch is simple, and even more important it is very fast and can give the ability to index and search the data instantly.
You can check out the Redis Search Server repo [here](https://github.com/ohad-israeli/searchserver)

## The Client

Now let's create a client to test and search the data that we have just generated.
We will create a simple React client, that will be able to search data as well as demonstrate autocomplete capabilities as well.

```bash
$npx create-react-app searchclient
```

After the application is created, we will add html-react-parser so we can easily parse html tags in strings that we will use to highlight the search pattern in the results. We will also use react-autosuggest as our autocomplete component.

```bash
$npm install html-react-parser react-autosuggest
```

In my App.js I will just add a single component which we will soon implement, this is our App.js:


```javascript
import React, { Component } from 'react';
import SearchResults from './SearchResults';
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <SearchResults />
      </div>
    );
  }
}

export default App;
```

Next up is SearchResults.js, the code is also relatively simple as well. The render method is built in two parts:

The header which includes our search input, and a search button. 
The second part, renders the products in a list with headers.

```javascript
import React, { Component } from 'react';
import parser from 'html-react-parser';
import Autosuggest from 'react-autosuggest';

class SearchResults extends Component {

    constructor() {
        super()
        this.state = {
            products: [],
            value: '',
            suggestions: []
        }
    }

    onChange = (event, { newValue }) => {
        this.setState({
            value: newValue
        });
    };

    // Autosuggest will call this function every time you need to update suggestions.
    onSuggestionsFetchRequested = ({ value }) => {
        console.time('Suggest');
        // Do the search
        fetch(`http://localhost:5000/suggest?suggest=${this.state.value}`)
            .then(result => {
                console.timeEnd('Suggest');
                return result.json();
            }).then(data => {
                this.setState({
                    suggestions: data
                });
            });
    };

    // Autosuggest will call this function every time you need to clear suggestions.
    onSuggestionsClearRequested = () => {
        this.setState({
            suggestions: []
        });
    };

    getSuggestionValue = suggestion => suggestion.name;

    // Use your imagination to render suggestions.
    renderSuggestion = suggestion => (
        <div>
            {suggestion.name}
        </div>
    );

    queryProducts = () => {
        console.time('Query');
        // Do the search
        fetch(`http://localhost:5000/search?search=${this.state.value}`)
            .then(result => {
                console.timeEnd('Query');
                return result.json();
            }).then(data => {
                // foreach row render the name of the employee
                let prodData = data.map((prodRec, i) => {
                    return (
                        <div className="TableRow">
                            <div className="TableCell">
                                {parser(prodRec.company)}
                            </div>
                            <div className="TableCell">
                                <div>{parser(prodRec.product)}</div>
                            </div>
                            <div className="TableCell">
                                <div>{parser(prodRec.color)}</div>
                            </div>
                            <div className="TableCell">
                                <div>{parser(prodRec.price)}</div>
                            </div>
                        </div>
                    )
                });
                this.setState({ products: prodData });
            });
    }

    render() {
        const { value, suggestions } = this.state;

        // Autosuggest will pass through all these props to the input.
        const inputProps = {
            placeholder: 'Type product or search anything...',
            value,
            onChange: this.onChange
        };

        return (
            <div className="SearchResults">
                <div className="header">
                    <Autosuggest
                        suggestions={suggestions}
                        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
                        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
                        getSuggestionValue={this.getSuggestionValue}
                        renderSuggestion={this.renderSuggestion}
                        inputProps={inputProps}
                    />
                    <button onClick={this.queryProducts}> Search </button>
                </div>
                <span style={{ display: 'block', height: 10 }}></span>
                <div class="ResultsTable">
                    <div class="TableRow">
                        <div class="TableHead"><strong>Company</strong></div>
                        <div class="TableHead"><strong>Product</strong></div>
                        <div class="TableHead"><strong>Color</strong></div>
                        <div class="TableHead"><strong>Price</strong></div>
                    </div>
                    <div>{this.state.products}</div>
                </div>
            </div>
        )
    }
}

export default SearchResults
```

You can check out the Search Client repo [here](https://github.com/ohad-israeli/searchclient)
Now can run the final piece in the puzzle

```bash
npm start
```

Below is the final result

<figure>
    <a href="/assets/images/search-demo.png"><img src="/assets/images/search-demo.png"></a>
</figure>

My next recipe is already in the oven, will update soon...
