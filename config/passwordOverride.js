/*
 * Password overrides
 *
 */

const fs = require('fs');
const {resolve} = require("path");
const pathToFile = resolve('/tmp/scout-tmp/password/token.json');

const passwordFile = fs.readFileSync(pathToFile);
const obj = JSON.parse(passwordFile);
const token = obj.token;



module.exports.passwordOverride = {
  token : token
};
