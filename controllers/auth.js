const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const User = require('../models/user');

const transporter = nodemailer.createTransport(
  sendgridTransport({

    auth: {
      api_key:
        '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'
    }
  })
);

exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        req.flash('error', 'Invalid email or password.');
        return res.redirect('/login');
      }
      bcrypt
        .compare(password, user.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              console.log(err);
              res.redirect('/');
            });
          }
          req.flash('error', 'Invalid email or password.');
          res.redirect('/login');
        })
        .catch(err => {
          console.log(err);
          res.redirect('/login');
        });
    })
    .catch(err => console.log(err));
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  User.findOne({ email: email })
    .then(userDoc => {
      if (userDoc) {
        req.flash(
          'error',
          'E-Mail exists already, please pick a different one.'
        );
        return res.redirect('/signup');
      }
      return bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
          const user = new User({
            email: email,
            password: hashedPassword,
            cart: { items: [] }
          });
          return user.save();
        })
        .then(result => {
          console.log(result);
          res.redirect('/login');
          return transporter.sendMail({
            to: email,
            from: 'ashish@gmail.com',
            subject: 'Signup succeeded!',
            html: '<h2>You successfully signed up!</h2>'
          });
        })
        .then((result) => {
          console.log(result);
        })
        .catch(err => {
          console.log(err);
        });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message
  });
};


exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if(err) {
      console.log(err);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({email: req.body.email})
      .then(user => {
        if(!user) {
          req.flash('error','No account with that email exist.')
          return res.redirect('/reset');
        }
        user.resetToken = token;
        user.resetTokenExpirationDate = Date.now() + 3600000;
        return user.save();
      })
      .then(result => {
        console.log(result);
        res.redirect('/');
        transporter.sendMail({
          to: req.body.email,
          from: 'ashish@gmail.com',
          subject: 'Password Reset!',
          html: `
              <p>You requested Password Reset!</p>
              <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set new password.</p>
              <p>Please note this link will expire in one hour</p>
          `
        });
      })
      .catch(e => console.log(e));
  });
}

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({resetToken: token, resetTokenExpirationDate: {$gt: Date.now()}})
    .then(user => {
      let message = req.flash('error');
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render('auth/new_password', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token
      });
    })
    .catch(e => console.log(e));
}

exports.postNewPassword = (req, res, next) => {
  const password = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let restUser;

  User.findOne({resetToken: passwordToken, resetTokenExpirationDate: {$gt: Date.now()}, _id: userId})
    .then(user => {
      restUser = user;
      return bcrypt.hash(password, 12);
    })
    .then(hashedPassword => {
      restUser.password = hashedPassword;
      restUser.resetToken = undefined;
      restUser.resetTokenExpirationDate = undefined;
      return restUser.save()
    })
    .then(result => {
      res.redirect('/login');
    })
    .catch(e => console.log(e));
}