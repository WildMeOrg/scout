/*
 * Settings that are persisted to tmp location

 *
 */

 const fs = require('fs');
 const {resolve} = require("path");
 const pathToFile = resolve('/tmp/scout-tmp/config/settings.json');
 const configFile = fs.readFileSync(pathToFile);
 let data = JSON.parse(configFile);


module.exports.settings = data;
