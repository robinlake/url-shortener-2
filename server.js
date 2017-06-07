console.log('server started')
var express = require('express')
var app = express();
var mongoDB = require('mongodb')
var mongoClient = mongoDB.MongoClient
var mongoURL = 'mongodb://localhost:27017/urlShortener'
var shortid = require('shortid')
var validURL = require('valid-url')

// create server
var server = app.listen(process.env.PORT || 3000)

// serve homepage
app.get('/', express.static('public'))


// create shortened version of new url
app.get('/new/:url(*)', function(req, res){
  var params = req.params.url
  mongoConnect(res, params, dbCallback, insertNewURL)
})

// redirect to full url
app.get('/:short', function(req,res, next){
  var params = req.params.short
  mongoConnect(res, params, dbCallback, findURL)
})

/*
******************************************
* Business Logic (is a cool sounding term)
******************************************
*/

//connect to MongoDB, execute insertNewURL if successful
function mongoConnect(res, params, dbCallback, mongoCallback) { mongoClient.connect(mongoURL, function(err, db){
    if(err){
      console.log('error connecting to MongoDB')
    } else {
      console.log('MongoDB connection successful')
      var collection = db.collection('urlShortener')
      mongoCallback(res, params, collection, db, dbCallback)
    }
  })
}


//insert new URL into MongoDB. Depends on db connection and req function
function insertNewURL(res, params,collection, callback) {
  console.log('collection = ' + collection)
  if(validURL.isUri(params)){
    var shortCode = shortid.generate()
    var newUrl = {url: params, short: shortCode}
    collection.insert([newUrl])
    res.json({ original_url: params, short_url: "localhost:3000/" + shortCode })
  } else {
    res.json({error: 'invalid url'})
  }
  console.log('new url function activated')
}

//close connection on callback
function dbCallback() {
  db.close()
}

//searches for existing url code in database
function findURL(res, params, collection, db, callback){
  console.log(params)
  collection.findOne({"short": params}, {url: 1, _id:0}, function(err, doc){
    if(doc != null){
      res.redirect(doc.url)
    } else {
      res.json({ error: "Address not found"})
    }
  })
}