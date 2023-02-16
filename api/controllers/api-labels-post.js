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
    forbidden: {
      statusCode: 403,
      description: 'The user is not allowed to make that request.'
    },
  },

  fn: async function (inputs, exits) {

    if (!this.req.session.userId) {
      return exits.forbidden();
    }
    // Create a new label with the provided name    
    let newLabel = Labels.create({ name: inputs.name }).fetch();

    return exits.success(newLabel);
  }
};