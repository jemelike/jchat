const app = require('./components/app')
const routes = require('./routes')
let body = $("body")


window.addEventListener('load', function (e) {

    var webAuth = new auth0.WebAuth({
        domain: 'je-tech.auth0.com',
        clientID: 'S3qDeWH5m32ZRuHY2xRmbpM2zfG1ccyB',
        responseType: 'token id_token',
        audience: 'https://je-tech.auth0.com/userinfo',
        scope: 'openid',
        redirectUri: 'localhost:8080/static/staffer.html'
    });
    
        e.preventDefault();
        webAuth.authorize();

});
