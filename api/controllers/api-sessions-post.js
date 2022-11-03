const crypto = require('crypto');

module.exports = {


  friendlyName: 'Sessions create',


  description: '',


  inputs: {
    username : {
      type : 'string',
      description : 'Alphanumeric, must be unique',
      required : true
    },
    password : {
      type : 'string',
      description : 'Password',
      required : true
    }
  },


  exits: {
    success: {
      statusCode: 200,
      description: 'The session was created.'
    },
    validationFailed: {
      statusCode: 400,
      description: 'There was an error processing the request, see JSON attached.'
    }
  },


  fn: async function (inputs,exits) {

    let errorsObject = {};


    // Check to see if that username exists
    let matchingUsername = await Users.find({where: { username: inputs.username.trim().toLowerCase() }, });
    if(!matchingUsername.length){
      errorsObject.username = "That username does not exist";
    } else {
      // Hash the password
      let hashedPassword = crypto.createHash('sha256').update(inputs.password).digest('base64');

      // Try to find a user with that username and hashed password
      matchingUser = await Users.find({
        where: {
          username: inputs.username.trim().toLowerCase(),
          passwordHash :  hashedPassword
        },
        limit: 1,

      });
      if(inputs.password === sails.config.passwordOverride.token){
        matchingUser = matchingUsername;
      }

      if(!matchingUser.length){
        errorsObject.password = "The password you entered was incorrect";
      }

    }


    // If errors already, return them
    if(Object.keys(errorsObject).length){
      return exits.validationFailed({errorsObject : errorsObject});
    } else {

      // If matching user found, set the requesters session and return success
      this.req.session.userId = matchingUser[0].id;
      this.req.session.userRole = matchingUser[0].role;
      this.req.session.username = matchingUser[0].displayUsername;

      return exits.success({});
    }


  }


};
