var express       = require('express');
var mongoose      = require('mongoose');
var passport      = require('passport');
var bodyParser    = require('body-parser');
var localStrategy = require('passport-local');
var User          = require('./public/javascripts/user');

var app = express();

// view engine setup
app.set('views', 'views');
app.set('view engine', 'ejs');

app.use(express.static('public'));

app.use(bodyParser.urlencoded({extended:true}));

// Connect to the database
mongoose.connect('mongodb://todolist:123456@localhost/user_todolist_app');

app.use(require('express-session')({
    secret: 'This is a string used for encode and decode',
    resave: false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ================
// Functions
// ================

function isLoggedIn(reg,res,next){
    if(reg.isAuthenticated()){
        return next();
    }
    res.redirect('/');
}

// ================
// Routes
// ================

app.get('/todolist/:name',isLoggedIn,function (req,res) {
   var name = req.params.name;
   if(req.user.username !== name){
       res.redirect('/todolist/'+req.user.username);
   };
    User.find({name:name},function (err,data) {
        if(err){
            console.log('Error');
        } else{
            console.log(data);
            var tmp = [];
            for(var i=0;i<data.length;i++){
                tmp.push({
                    'thing':data[i].toJSON()['thing'],
                    'completed':data[i].toJSON()['completed'],
                })
            }
            res.render('index',{myName:name,myThings:tmp});
        }
    });
});

//login process
app.get('/',function (req,res) {
    res.render('login')
});
app.post('/', passport.authenticate('local'), function(req, res) {
        res.redirect('/todolist/' + req.body.username);
});

app.get('/logout',function (req,res) {
    req.logout();
    res.redirect('/');
});

app.get('/register',function (req,res) {
    res.render('register');
});
app.post('/register',function (req,res) {
    var name = req.body.username;
    var passwd = req.body.password;
    User.register(new User({username:name}),passwd,function (err,user) {
        if(err){
            return res.redirect('/register')
        }
        passport.authenticate("local")(req,res,function () {
            res.redirect('/todolist/'+name)
        })
        
    })
});

app.post('/saveData',function (req,res) {
    //console.log("body ", req.body);
    User.remove({name:req.body.name}, function(err, res){
        if (err) {
            console.log("Error:" + err);
        }
        else {
            console.log("Res:" + res);
        }
    });
    for(var i=0;i<req.body.data.length;i++){
        var one = new User(req.body.data[i]);
        one.save(function (err,item) {
            if(err){
                console.log('Wrong')
            }else{
                console.log(item)
            }
        });
    }
    res.redirect('/todolist/'+req.body.name);
});

app.listen(3000);


