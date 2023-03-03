module.exports = {
  friendlyName: 'Delete Tag',
  description: 'Remove tag to the database',
  inputs: {
    id: {
      type: 'string',
      required: true
    }
  },
  exits: {
    success: {
      statusCode: 204,
      description: 'The tag was deleted.'
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

    if(this.req.session.userRole !== 'admin'){
        return exits.forbidden();
    }

    let destroyed = await Tags.destroy({id: inputs.id}).fetch();
    if (!destroyed.length) {
      errorsObject.name = "No such tag";
      return exits.validationFailed({errorsObject : errorsObject});
    }

    console.log('destroyed Tag %o', destroyed[0]);
    return exits.success({});
  }

};
