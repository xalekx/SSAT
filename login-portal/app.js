
var session = require("express-session");
var createError = require('http-errors');
var express = require('express');
var path = require('path');

var okta = require("@okta/okta-sdk-nodejs");
var ExpressOIDC = require("@okta/oidc-middleware").ExpressOIDC;
var logger = require('morgan');
const dashboardRouter = require("./routes/dashboard");
const publicRouter = require("./routes/public");
const usersRouter = require("./routes/users");
const registerRouter = require('./routes/register')

var app = express();

var oktaClient = new okta.Client({
  orgUrl: 'https://dev-930032.oktapreview.com',
  token: '00tHiTZxK7TYulw4lkT8uFWP1wgYM61WSaC9p_s4mz'
});
const oidc = new ExpressOIDC({
  issuer: "https://dev-930032.oktapreview.com/oauth2/default",
  client_id: '0oag4mpfwfLYkdefF0h7',
  client_secret: '6sMB7p51KiK8-PGaNED7pNa4whRa8YGBWKD8H0mz',
  redirect_uri: 'https://ssat:443/users/callback',
  scope: "openid profile",
  routes: {
    login: {
      path: "/users/login"
    },
    callback: {
      path: "/users/callback",
      defaultRedirect: "/dashboard"
    }
  }
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'e3t983t8919g83tupfqe82y138[9r0hahfs;ofh2817g1pfaubsu;ogusa;o821t9guabu;gsd;bgashfia]',
  resave: true,
  saveUninitialized: false
}));
app.use(oidc.router);

app.use((req, res, next) => {
  if (!req.userinfo) {
    return next();
  }

  oktaClient.getUser(req.userinfo.sub)
    .then(user => {
      req.user = user;
      res.locals.user = user;
      next();
    }).catch(err => {
      next(err);
    });
});

function loginRequired(req, res, next) {
  if (!req.user) {
    return res.status(401).render("unauthenticated");
  }

  next();
}

app.use('/', publicRouter);
app.use('/dashboard', loginRequired, dashboardRouter);
app.use('/users', usersRouter);
app.use('/register', registerRouter)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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
