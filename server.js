// require all the items we need.  these are included with node,
// or they're defined as dependencies in package.json
var express = require('express');
var app = express();
var fs = require('fs');
var path = require('path');
var bodyParser = require('body-parser');

// tell the app to use /public as the root directory for serving HTML
app.use(express.static(path.join(__dirname, '/public')));
// setting extended to false uses the querystring library instead of the qs library
// meaning, application/x-www-form-urlencoded parser
app.use(bodyParser.urlencoded({ extended: false }));
// allow us to parse application/json
app.use(bodyParser.json());

// when the server tries to access the URL at /favorites...
app.get('/favorites', function(req, res){
  // open a file, read the data (which will be JSON)...
  var data = fs.readFileSync('./data.json');
  // say we're sending application/json..
  res.setHeader('Content-Type', 'application/json');
  // and send it!
  res.send(data);
});

// when the server tries to POST to /favorites...
app.post('/favorites', function(req, res){
  // require that the POST body contains two keys: name and oid
  if(!req.body.name || !req.body.oid){
    // if it doesn't, send an error
    res.send("Error");
    return;
  }

  // get the data currently in the file
  var data = JSON.parse(fs.readFileSync('./data.json'));
  // add the data POSTed from the request body to the existing data
  data.push(req.body);
  // rewrite the file with the data appended
  fs.writeFile('./data.json', JSON.stringify(data));
  res.setHeader('Content-Type', 'application/json');
  res.send(data);
});

// tell the server to listen to port 3000
app.listen(3000, function(){
  console.log("Listening on port 3000");
});
