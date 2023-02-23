module.exports = {
  friendlyName: 'Add Label',
  description: 'Add a new label to the database',
  inputs: {
    id : {
      type: "string"
    },
    name: {
      type: 'string',
      required: true
    },
    hotKey: {
      type: 'string',
    },
    source: {
      type: 'string',
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

    if (!this.req.session.userId) {
      return exits.forbidden();
    }

    if(!inputs.name.trim().toLowerCase().length) {
      errorsObject.name = "Label name cannot be empty."
      return exits.validationFailed({errorsObject : errorsObject});
    }

    let matchingName = await Labels.find({where: { name: inputs.name.trim().toLowerCase() }, });
    let newLabel = {};
    if(matchingName.length){
      newLabel = await Labels.update({ name: inputs.name }).set({ name: inputs.name.trim().toLowerCase(), hotKey: inputs.hotKey, source: inputs.source }).fetch();
    } else {
      newLabel = await Labels.create({ name: inputs.name.trim().toLowerCase(), hotKey: inputs.hotKey, source: inputs.source }).fetch(); 
    } 

    
       
    // If successful, return created label

    return exits.success(newLabel);
  }

};