const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const errorController = require('./controllers/error');
const User = require('./models/user');

const app = express();
const store = new MongoDBStore({
  uri: 'mongodb+srv://ashish:bEsad@22MA@cluster0-mq0zw.mongodb.net/shop',
  collection: 'sessions',
});

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: 'secret key', 
    resave: false, 
    saveUninitialized: false,
    store: store 
  })
);

app.use((req, res, next) => {
  if(!req.session.user) {
    console.log('not1');
    return next();
  } 
  console.log('present');
  User.findById(req.session.user._id)
  .then(user => {
      req.user = user;
      next();
  })
  .catch(e => console.log(e));
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose
  .connect(
    'mongodb+srv://cluster0-mq0zw.mongodb.net/shop?retryWrites=true', 
     {auth: {
        user: "ashish",
        password: "bEsad@22MA"
      }, 
      useNewUrlParser: true , 
    }
  )
  .then(result => {
    User.findOne()
      .then(user => {
        if(!user) {
          const user = new User({
            name: 'Ashish',
            email: 'ashish@gmail.com',
            cart: { items: [] }
          });
          user.save();
        }
      });
    console.log('Listening on port 3000')
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });
