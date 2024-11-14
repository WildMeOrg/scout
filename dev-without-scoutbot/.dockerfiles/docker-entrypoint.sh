#!/bin/bash
set -eo pipefail


echo url: http://`hostname -i`:1337
mkdir ~/log
mongod --fork --logpath ~/log/mongod.log  &&
npm start
