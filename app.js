//jshint esversion:6
   const express = require('express');
   const ejs = require('ejs');
   const bodyParser = require('body-parser');
   const mongoose = require('mongoose');
   const passportLocalMongoose = require('passport-local-mongoose');
   const LocalStrategy = require('passport-local');
   const passport = require('passport');
   const session = require('express-session');

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

   const userSchema = new mongoose.Schema({})

   userSchema.plugin(passportLocalMongoose);
   const User = new mongoose.model('User', userSchema);
   
   passport.use(User.createStrategy());

   passport.serializeUser(User.serializeUser());
   passport.deserializeUser(User.deserializeUser());

   app.get('/', (req, res)=>{
    res.render('home');
   })

   app.get('/register', (req, res)=>{
    res.render('register');
   })

   app.get('/login', (req, res)=>{
    res.render('login');
   })

   app.get('/secrets', (req, res)=>{
      if (req.isAuthenticated()){
         res.render('secrets');         
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


   app.listen(3000, ()=>{
    console.log("Server started on port: 3000.")
   });