const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const errorController = require('./controllers/error');
const User = require('./models/user');

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  User.findById('5c2786e8019a636bd2ac32cf')
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => console.log(err));
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

mongoose
  .connect(
    'mongodb+srv://cluster0-mq0zw.mongodb.net/shop?retryWrites=true', 
     {auth: {
        user: "ashish",
        password: "password"
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
