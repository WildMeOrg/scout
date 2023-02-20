module.exports = {
  friendlyName: 'Add Label',
  description: 'Add a new label to the database',
  inputs: {
    name: {
      type: 'string',
      required: true
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
    },
    forbidden: {
      statusCode: 403,
      description: 'The user is not allowed to make that request.'
    },
  },

  fn: async function (inputs, exits) {

    let errorsObject = {};

    // if (!this.req.session.userId) {
    //   return exits.forbidden();
    // }

    let matchingName = await Labels.find({where: { name: inputs.name.trim().toLowerCase() }, });
    if(matchingName.length){
      errorsObject.name = "That label is already taken.";
    }

    if(Object.keys(errorsObject).length){
      return exits.validationFailed({errorsObject : errorsObject});
    }

    if(!inputs.name.trim().toLowerCase().length) {
      errorsObject.name = "Label name cannot be empty."
      return exits.validationFailed({errorsObject : errorsObject});
    }
    // Create a new label with the provided name    
    let  newLabel = await Labels.create({ name: inputs.name }).fetch();    

    // If successful, return created label

    return exits.success(newLabel);
  }

};