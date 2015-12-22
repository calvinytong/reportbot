var express = require('express'),
    bodyParser = require('body-parser'),
    reportbot = require('./reportbot'),
    stylus = require('stylus'),
    nib = require('nib'),
    path = require('path');

var app = express();
function compile(str, path) {
    return stylus(str)
        .set('filename', path)
        .use(nib());
}

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(stylus.middleware({
        src: __dirname + '/public',
        compile: compile
    }
));
app.use(express.static(__dirname + '/public'));

// body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));

// index route
app.get('/', function (req, res) {
    //res.render('index', { title : 'Home' });
    res.sendFile(path.join('public/index.html'));
});

// reportbot route
app.post('/report', reportbot);

// error handler
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(400).send(err.message);
});

var port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('listening on port ' + port);
});
