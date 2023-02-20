#!/bin/bash
set -eo pipefail

mkdir ~/log
mongod --fork --logpath ~/log/mongod.log  &&
npm start
#sails lift
