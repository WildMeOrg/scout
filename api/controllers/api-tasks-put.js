module.exports = {


  friendlyName: 'Tasks put',


  description: 'Update a task with a tag',


  inputs: {
    taskId : {
      type : 'string',
      description : 'Task ID',
      required : true
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
    let tagIds = task.tagIds || [];
//console.log('got task=%o tag=%o tagIds=%o', task, tag, tagIds);
    if (tagIds.indexOf(tag.id)) {
        tagIds.push(tag.id);
        let updatedTask = await Tasks.updateOne({ id: task.id }).set({tagIds: tagIds});
        if (!updatedTask) throw Error('unknown error');
    }
    return exits.success({tagIds: tagIds});
  }


};
