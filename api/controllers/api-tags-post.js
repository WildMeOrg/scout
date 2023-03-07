module.exports = {
  friendlyName: 'Add Tag',
  description: 'Add a new tag to the database',
  inputs: {
    name: {
      type: 'string',
      required: true
    },
    taskId: {
        type: 'string'
    }
  },
  exits: {
    success: {
      statusCode: 200,
      description: 'The tag was created.'
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

    let name = inputs.name.trim();
    if(!name.length) {
      errorsObject.name = "Tag name cannot be empty.";
      return exits.validationFailed({errorsObject : errorsObject});
    }

    let found = await Tags.find({name: name});
    if (found.length) {
      errorsObject.name = "Tag name already exists.";
      return exits.validationFailed({errorsObject : errorsObject});
    }

    let task = null;
    if (inputs.taskId) {
        task = await Tasks.findOne({id: inputs.taskId});
        if (!task) {
            errorsObject.name = "Invalid task ID";
            return exits.validationFailed({errorsObject : errorsObject});
        }
    }
    newTag = await Tags.create({ name: name }).fetch(); 
    if (task) await Tasks.addTagId(task, newTag.id);
    return exits.success(newTag);
  }

};
