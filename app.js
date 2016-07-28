var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
var session = require('express-session');
app.use(session({secret: '1234567890QWERTY'}));


var MongoClient = require('mongodb').MongoClient;
var db;
var port = 3000;

MongoClient.connect("mongodb://localhost:27017/document-review", function(err, database) {
  if(err) throw err;
  db = database;
  app.listen(port);
  console.log('document-review listening on port '+port+'!');
});


app.all('*', function (req, res, next) {
  if (req.session.login || req.url === '/login'){
    next();    
  } else{
    res.redirect('/login');
  }
});

app.get('/', function (req, res) {
  res.render('index');
});

app.get('/login', function (req, res) {
  res.render('login');
});
app.post('/login', function (req, res) {
  var username = req.body.username;
  var password = req.body.password;
  db.collection('user').findOne({'username':username, 'password':password}, function(err, doc){
    if (doc){
        req.session.login = true;
        res.redirect('/');    
    } else {
      res.render('login', {failure:true});    
    }
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});



module.exports = app;
