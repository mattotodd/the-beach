var when = require("when");
var idm = require('./idm');

var cachedJwts = {};
var getJwtForCredentials = function(account_id, username, password){
    return when.promise(function(resolve, reject) {
        if(cachedJwts[username]){
            var jwtConfig = cachedJwts[username];
            var now  = new Date();
            //check if its been 15 minutes since getting jwt
            var expiration = new Date(jwtConfig.obtained.getTime() + 15*60000);
            if(now < expiration){
                return resolve(cachedJwts[username]);
            }
        }
        loginUser(username, password, account_id).then(function(loginResp){
            if(loginResp == null || !loginResp.hasOwnProperty('jwt')){
                return reject("Error loggin in with user: "+username);
            }

            //cache the result
            cachedJwts[username] = {
                obtained: new Date(),
                jwt: loginResp["jwt"],
                account_id: account_id
            };
            return resolve(cachedJwts[username]);
        }).catch(function(err){
            return reject("Unkown error: "+err);
        });
    });

};

var loginUser = function(username, password, accountId){
    return idm.auth.loginUser(username, password, accountId);
};

module.exports = {
    getJwtForCredentials
};