module.exports = {


  friendlyName: 'Tasks put',


  description: 'Update a task with a tag',


  inputs: {
    taskId : {
      type : 'string',
      description : 'Task ID',
      required : true
    },
    remove: {
        type: 'boolean'
    },
    tagId : {
      type : 'string',
      required : true
    }
  },


  exits: {
    success: {
      statusCode: 200,
      description: 'The item as marked as complete.'
    },
    notFound: {
        statusCode: 404
    },
    validationFailed: {
      statusCode: 400,
      description: 'There was an error processing the request, see JSON attached.'
    }
  },


  fn: async function (inputs,exits) {

    if(this.req.session.userRole !== 'admin'){
      this.res.forbidden();
    }

    // Update the image with the new status
    let task = await Tasks.findOne({id: inputs.taskId});
    if (!task) return exits.notFound({description: 'unknown task'});
    let tag = await Tags.findOne({id: inputs.tagId});
    if (!tag) return exits.notFound({description: 'unknown tag'});
    let rtn = {};
    if (inputs.remove) {
        // rtn can include .destroyedTagId
        rtn = await Tasks.removeTagId(task, inputs.tagId);
    } else {
        rtn.tagIds = await Tasks.addTagId(task, inputs.tagId);
    }
    return exits.success(rtn);
  }


};
