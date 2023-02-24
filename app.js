//jshint esversion:6
   const express = require('express');
   const ejs = require('ejs');
   const bodyParser = require('body-parser');

   const app = express();

   app.use(express.static('public'));
   app.set('view engine', 'ejs');
   app.use(bodyParser.urlencoded({
    extended: true
   }));

   app.get('/', (req, res)=>{
    res.render('home');
   })

   app.get('/register', (req, res)=>{
    res.render('register');
   })

   app.get('/login', (req, res)=>{
    res.render('login');
   })

   app.post('/register', (req, res)=>{

   });

   app.post('/login', (req, res)=>{

   });

   app.listen(3000, ()=>{
    console.log("Server started on port: 3000.")
   });