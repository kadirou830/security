//jshint esversion:6
   const express = require('express');
   const ejs = require('ejs');
   const bodyParser = require('body-parser');
   const mongoose = require('mongoose');
   const passportLocalMongoose = require('passport-local-mongoose');
   const LocalStrategy = require('passport-local');
   const passport = require('passport');
   const session = require('express-session');
   const GoogleStrategy = require('passport-google-oauth20').Strategy;
   const FacebookStrategy = require('passport-facebook').Strategy;
   const findOrCreate = require('mongoose-findorcreate');

   require('dotenv').config()

   const app = express();

   app.use(express.static('public'));
   app.set('view engine', 'ejs');
   app.use(bodyParser.urlencoded({
    extended: true
   }));

   app.use(session({
      secret: 'my little secret.',
      resave: false,
      saveUninitialized: true,
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1:27017/userDB",
() => {
  console.log("DB connected");
},
(e) => console.log(e)
);

   const userSchema = new mongoose.Schema({
      googleId: String,
      facebookId: String,
      secret: String
   })

   userSchema.plugin(passportLocalMongoose);
   userSchema.plugin(findOrCreate);
   const User = new mongoose.model('User', userSchema);
   

   passport.use(User.createStrategy());

   passport.serializeUser((user, done)=>{
      done(null, user.id);
   });
   passport.deserializeUser((id, done)=>{
      User.findById(id, (err, user)=>{
         done(err, user);
      })
   });

   passport.use(new GoogleStrategy({
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
    },
    function(accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  ));

  passport.use(new FacebookStrategy({
   clientID: process.env.FACEBOOKAPP_ID,
   clientSecret: process.env.FACEBOOKSECRET_ID,
   callbackURL: "http://localhost:3000/auth/facebook/secrets",
 },
 function(accessToken, refreshToken, profile, cb) {
   User.findOrCreate({ facebookId: profile.id }, function (err, user) {
     return cb(err, user);
   });
 }
));

   app.get('/', (req, res)=>{
    res.render('home');
   })

   app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

  app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });


  app.get('/auth/facebook',
  passport.authenticate('facebook'));

  app.get('/auth/facebook/secrets', 
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });


   app.get('/register', (req, res)=>{
    res.render('register');
   })

   app.get('/login', (req, res)=>{
    res.render('login');
   })

   app.get('/secrets', (req, res)=>{
         User.find({'secret': {$ne: null}}, (err, foundusers) => {
            if(err){
               console.log(err)
            }else{
               res.render('secrets', {usersWithSecrets: foundusers});
            }
         });   
   });

   app.get('/submit', (req, res)=>{
      if (req.isAuthenticated()){
         res.render('submit');         
      }else{
         res.redirect('/login');
      }
   })

   app.get('/logout', (req, res)=>{
      req.logout((err)=>{
         if (err){
         console.log(err)
         }else{
         res.redirect('/');         
         }
      });
   });

   app.post('/register', function(req, res){
      User.register(new User({username: req.body.username}), req.body.password, (err, user)=>{
         if(err){
            res.redirect('/register');
            console.log(err)
         }else{
            passport.authenticate("local")(req, res, ()=>{
               res.redirect('/secrets');
            });
         }
      });
   });

   app.post('/login', (req, res)=>{
         const user = new User({
            username: req.body.username,
            password: req.body.password
         })
         req.logIn(user, (err)=>{
            if(err){
               console.log(err)
            }else{
               passport.authenticate("local")(req, res, ()=>{
                  res.redirect('/secrets');
               });
            }
         })
   });

   app.post('/submit', (req, res)=>{
         const mySecret = req.body.secret;
         User.findById(req.user.id, (err, founduser)=>{
            if(err){console.log(err)}else{
               founduser.secret = mySecret;
               founduser.save((err)=>{
                  if(err){console.log(err)}else{
                     res.redirect('/secrets');
                  }
               });
            }
         });
   })


   app.listen(3000, ()=>{
    console.log("Server started on port: 3000.")
   });