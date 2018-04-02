const LocalStrategy = require('passport-local').Strategy;
const User = require('../../src/models/Users')

module.exports = new LocalStrategy(
    (username, password, done) => {
        User.findOne({ username: username }, function (err, user) {
            if (err) { return done(err); }
            if (!user) {
              console.log("Did not work")
              return done(null, false, { message: 'Incorrect username.' },null);
            }
            if (!user.validPassword(password)) {
              return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, user);
          });
    })