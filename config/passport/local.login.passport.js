const LocalStrategy = require('passport-local').Strategy;
const User = require('../../src/models/Users')
const db = require('../db/db.base.conf')
module.exports = new LocalStrategy(
    (username, password, done) => {
        User.findOne({ username: username }, function (err, user) {
            if (err) { return done(err); }
            if (!user) {
              console.log("user: " + user)
              return done(null, false, { message: 'Incorrect username.' },null);
            }
            if (!user.validPassword(password)) {
              return done(null, false, { message: 'Incorrect password.' });
            }
            console.log(user)
            return done(null, user);
          });
    })