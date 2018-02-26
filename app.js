var express     = require('express');
require('dotenv').config();
var path        = require('path');
var favicon     = require('serve-favicon');
var logger      = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser  = require('body-parser');
var bcrypt      = require('bcrypt-nodejs');
var mongoose    = require('mongoose');
var helmet            = require('helmet');
var compression       = require('compression');


var index       = require('./routes/index');
var auth        = require('./routes/auth'); //holds the authentication of the app
var dashboard   = require('./routes/dashboard');//the dashboard
var cookiemonster   = require('./routes/cookiemonster');//the admin access



var app         = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(helmet());
app.use(compression());


app.use('/', index);
app.use('/auth',auth);
app.use('/dashboard',dashboard);
app.use('/cookiemonster',cookiemonster);

//for user Logout
app.get('/logout',function (req,res) {
    res.clearCookie(process.env.TOKEN_NAME);
    res.redirect('/');
});

process.on('uncaughtException', function(err) {
    console.log(err);
});

//CONNECTING TO MONGODB ON START
mongoose.connect(process.env.MONGODB, function(err) {
    if (err) {
        console.log(err);
        //process.exit(1);
    } else {
        console.log('MongoDB Listening at port 3000...');
    }
});
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
/* Use this for localhost , added by kira0204 */
app.listen(8000, 'localhost');
console.log('Localhost running @ port 3000');
