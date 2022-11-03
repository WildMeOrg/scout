const crypto = require('crypto');

module.exports = {


  friendlyName: 'Users PUT',


  description: '',


  inputs: {
    id : {
      type : 'string',
      description : 'The user id',
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
    }
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


    if(this.req.session.userRole !== 'admin'){
      return exits.forbidden();
    }

    let errorsObject = {};

    // Check the password of the user submitting this form
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

    // Check if the passwords match for frontend validation
    if(inputs.password !== inputs.passwordConfirm){
      errorsObject.passwordConfirm = "Your passwords don't match";
    }


    // If errors already, return them
    if(Object.keys(errorsObject).length){
      return exits.validationFailed({errorsObject : errorsObject});
    } else {

      // Hash one password
      let hashedPassword = crypto.createHash('sha256').update(inputs.password).digest('base64');

      // Attempt to update user with new password
      let updatedUser = await Users.updateOne({ id: inputs.id })
      .set({
        passwordHash:hashedPassword
      });

      if (!updatedUser) {
        throw Error('Unknown error occured');
      }


      return exits.success();
    }


  }


};
