var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const authRouter = require('./src/routes/authRoutes');
const dashboardRouter = require('./src/routes/dashboardRoutes');

// Test database connection on startup
const pool = require('./src/config/database');
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('⚠️ Database connection failed:', err.message);
    process.exit(1);
  } else {
    console.log('💾 Database connected successfully');
  }
});

// Test Redis connection on startup
const redis = require('redis');
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DB) || 0,
});

redisClient.connect()
  .then(() => {
    console.log('🔌 Redis connected successfully');
    return redisClient.quit();
  })
  .catch((err) => {
    console.error('⚠️ Redis connection failed:', err.message);
    console.error('⚠️ Make sure Redis is running on', process.env.REDIS_HOST + ':' + process.env.REDIS_PORT);
    console.error('⚠️ If using Docker: docker run -d -p 6379:6379 redis:alpine');
    process.exit(1);
  });

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/dashboard', dashboardRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
// eslint-disable-next-line no-unused-vars
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
