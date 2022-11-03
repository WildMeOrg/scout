const crypto = require('crypto');

module.exports = {


  friendlyName: 'Users create',


  description: '',


  inputs: {
    username : {
      type : 'string',
      description : 'Alphanumeric, must be unique',
      required : true
    },
    password : {
      type : 'string',
      description : 'First password',
      required : true
    },
    passwordConfirm : {
      type : 'string',
      description : 'Second password',
      required : true
    },
    adminPassword : {
      type : 'string',
      description : 'Password of the logged in user'
    },
    role : {
      type : 'string',
      description : 'Admin or user',
      required : true
    },
  },


  exits: {
    success: {
      statusCode: 200,
      description: 'The user was created. User details are included.'
    },
    validationFailed: {
      statusCode: 400,
      description: 'There was an error processing the request, see JSON attached.'
    },
    forbidden: {
      statusCode: 403,
      description: 'The user is not allowed to make that request.'
    }
  },


  fn: async function (inputs,exits) {


    // Check that there are currently no users in the DB or the user making the request is an admin
    let userCount = await Users.count();

    const isAdmin = this.req.session.userRole == 'admin' ? true : false;
    if(userCount && !isAdmin){
      return exits.forbidden();
    }

    let errorsObject = {};

    // If an admin is submitting this form, they must have included their password
    if(isAdmin){
      if(typeof(inputs.adminPassword) !== 'string'){
        errorsObject.adminPassword = "Please enter your password";
      } else {
        // Check that the password provided matches the one on file
        let hashedAdminPassword = crypto.createHash('sha256').update(inputs.adminPassword).digest('base64');

        let matchingAdminUser = await Users.find({
          where: {
            id: this.req.session.userId,
            passwordHash :  hashedAdminPassword
          },
          limit: 1,
        });
        if(!matchingAdminUser.length){
          errorsObject.adminPassword = "Your password was incorrect";
        }


      }

    }

    // Check if the passwords match for frontend validation
    if(inputs.password !== inputs.passwordConfirm){
      errorsObject.passwordConfirm = "Your passwords don't match";
    }

    // Check that the role is valid
    const validRoles = ['admin','user'];
    if(validRoles.indexOf(inputs.role) < 0){
      errorsObject.role = "The role is invalid";
    }

    // Make sure username is fully alphanumeric
    const strippedUsername = inputs.username.replace(/[^a-z0-9]/gi, '');
    if(strippedUsername.length !== inputs.username.length){
      errorsObject.username = "Alphanumeric characters only please.";
    }

    // Check to see if that username exists
    let matchingUsernames = await Users.count({where: { username: inputs.username.trim().toLowerCase() }});
    if(matchingUsernames){
      errorsObject.username = "That username is taken";
    }


    // If errors already, return them
    if(Object.keys(errorsObject).length){
      return exits.validationFailed({errorsObject : errorsObject});
    } else {

      // Hash one password
      let hashedPassword = crypto.createHash('sha256').update(inputs.password).digest('base64');

      // Attempt to create user
      let initialValues = {
        username : inputs.username.trim().toLowerCase(),
        displayUsername : inputs.username,
        passwordHash : hashedPassword,
        role : inputs.role
      };
      let newUser = await Users.create(initialValues).fetch();
      if(!newUser){
        throw Error('Unknown error occured');
      }

      // If successful, return created user, minus the passwords
      delete newUser.passwordHash;

      // If they're not an admin, modify their session with their new username, userId and role
      if(!isAdmin){
        this.req.session.userId = newUser.id;
        this.req.session.userRole = newUser.role;
        this.req.session.username = newUser.displayUsername;
      }

      return exits.success(newUser);
    }


  }


};
