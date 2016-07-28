var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var busboy = require('connect-busboy'); 
var fs = require('fs-extra')
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.locals.delimiters = '<% %>';

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(busboy());
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

app.get('/docs', function(req,res){
  db.collection('docs').find({}).toArray(function(err, docs){
    res.json({'success': true, 'docs':docs});
  });
});

app.post('/upload', function(req, res){
  var fstream;
  req.pipe(req.busboy);
  req.busboy.on('file', function (fieldname, file, oldname) {
      console.log("Uploading: " + oldname);
      var uuid = require('node-uuid');
      var filename = uuid.v4() +"."+ (/(?:\.([^.]+))?$/.exec(oldname)[1]);
      var filepath = __dirname + '/docs/' + filename;
      fstream = fs.createWriteStream(filepath);
      file.pipe(fstream);
      fstream.on('close', function () {    
          console.log("Upload Finished of " + filename);      
          var textract = require('textract');
          textract.fromFileWithPath(filepath, function( error, text ) {
            fs.stat(filepath, function(error, stats){
              var fileInfo = {
                'name':oldname,
                'filename':filename,
                'atime':stats.atime,
                'mtime':stats.mtime,
                'ctime':stats.ctime,
                'size':stats.size,
                'text':text
              };
              db.collection('docs').insert(fileInfo, function(err, result){
                res.render('upload', {'success':true});
              });
            });
          });
      });
  });
});



app.get('/upload', function(req, res){
  res.render('upload');
});

app.get('/import', function(req, res){
  res.render('import');
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
