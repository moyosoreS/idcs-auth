//BEGIN: LOAD EXPRESS AND EJS
    var express = require('express');
    var app = express();
    app.set('view engine', 'ejs');
//END: LOAD EXPRESS AND EJS

//BEGIN: LOAD FILE SYSTEM (TO OPEN CERTIFICATES) AND HTTPS
    var fs = require('fs');
    var https = require('https');
    var server = https.createServer({
        cert: fs.readFileSync('bracket.crt'),
        key: fs.readFileSync('bracket.key')
    }, app);
//END: LOAD FILE SYSTEM (TO OPEN CERTIFICATES) AND HTTPS

//BEGIN: LOAD PASSPORT DEPENDENCIES
    //body-parser: to read credentials from request body
    var bodyParser = require('body-parser');
    app.use(bodyParser.urlencoded({ extended: false }));
    //cookie-parser: to support cookies and hold session in user's browser
    var cookieParser = require('cookie-parser');
    app.use(cookieParser());
    //express-session: to support sessions on server side
    var expressSession = require('express-session');
    app.use(expressSession({ secret: process.env.SESSION_SECRET || 'Welcome1', resave: false, saveUninitialized: false }));
//END: LOAD PASSPORT DEPENDENCIES

//BEGIN: LOAD PASSPORT ENGINE
    var passport = require('passport');
    app.use(passport.initialize());
    app.use(passport.session());
//END: LOAD PASSPORT ENGINE

//BEGIN: IDCS INFORMATION
    var idcsInfo = {
    discoveryURL: 'https://idcs-429d5a47665341b3b3fc1dda8ab6048b.identity.oraclecloud.com/.well-known/idcs-configuration',
    clientID: 'c8c34b2157044407aa258eea23e980b3',
    clientSecret: '6d51f671-247a-40d2-9466-1393d6fc85f0',
    callbackURL: 'https://129.146.124.133:3000/#/',
    profileURL: 'https://idcs-429d5a47665341b3b3fc1dda8ab6048b.identity.oraclecloud.com/admin/v1/Me',
    passReqToCallback: true
  };
//END: IDCS INFORMATION

//BEGIN: LOAD IDCS STRATEGY
    var OIDCSStrategy = require('passport-oauth-oidcs').Strategy;
    var oidcsstrgt = new OIDCSStrategy(idcsInfo,
        function(req, accessToken, refreshToken, profile, done) {
                req.session.idcsAccessToken = accessToken;
                return done(null, profile);
        }
    );
    passport.use('idcs', oidcsstrgt);
//END: LOAD IDCS STRATEGY

//BEGIN: USER SERIALIZATION (REQUIRED BY PASSPORTJS)
    passport.serializeUser(function(user, done) { done(null, user); });
    passport.deserializeUser(function(user, done) { done(null, user); });
//END: USER SERIALIZATION (REQUIRED BY PASSPORTJS)

//BEGIN: PASSPORT ENDPOINTS FOR AUTHENTICATION AND CALLBACK (LINKED TO IDCS STRATEGY)
    app.get('/auth/idcs', passport.authenticate('idcs'));
    app.get('/auth/idcs/callback', passport.authenticate('idcs', { successRedirect: '/', failureRedirect: '/' }));
//END: PASSPORT ENDPOINTS FOR AUTHENTICATION AND CALLBACK (LINKED TO IDCS STRATEGY)
//BEGIN: ENDPOINTS
    app.get('/', function(req, res) {
        res.render('home', {
            isAuthenticated: req.isAuthenticated(),
	    user: req.user
        });
    });
    app.get('/logout', function(req, res) {
        req.logout();//method added by passport to support logout
        res.redirect('/');
    });
//END: ENDPOINTS

//BEGIN: LOAD APP LISTENER
    var port = process.env.PORT || 8000;
    //var server = app.listen(port, function() {
    //    console.log('https://localhost:' + port + '/');
    //});
    server.listen(port, function() {
        console.log('https://localhost:' + port + '/');
    });
    
//END: LOAD APP LISTENER
