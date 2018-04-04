const LocalStrategy = require('passport-local').Strategy;
const User = require('../../src/models/Users')

let validate = (password, cb) => {
    if (password && typeof password == String)
        return true
}

module.exports = new LocalStrategy(
    (username, password, done) => {
        User.findOne({ username: username }, function (err, user) {
            if (err) { return done(err); }
            if (!user && validate(password)) {
                //add user to database after checking the format of the data
                let new_user = new User({
                    username,
                    password
                })

                new_user.save((err) => { console.error(err) })
            }
            return done(null, user);
        });
    })