module.exports = {


  friendlyName: 'Queued images put',


  description: 'Update a queued image with a done status, then kick off the recalculation helper',


  inputs: {
    queuedimageid : {
      type : 'string',
      required : true
    },
    annotationComplete : {
      type : 'boolean',
      description : 'marking this queue item as complete',
      required : true
    }
  },


  exits: {
    success: {
      statusCode: 200,
      description: 'The item as marked as complete.'
    },
    validationFailed: {
      statusCode: 400,
      description: 'There was an error processing the request, see JSON attached.'
    }
  },


  fn: async function (inputs,exits) {

    if(!this.req.session.userId){
      return exits.forbidden();
    }

    // Look up the queuedImageId to get the task and image
    let queuedImages = await QueuedImages.find({id : inputs.queuedimageid});
    if(!queuedImages.length){
      return exits.notFound();
    }

    let queuedImageData = queuedImages[0];

    // Look up the task data
    let tasks = await Tasks.find({id : queuedImageData.taskId});
    if(!tasks.length){
      throw Error('Unknown error occured');
    }
    let taskData = tasks[0];

    // Check that the submitter is the assignee
    if(this.req.session.userId !== taskData.assignee){
      return exits.forbidden;
    }

    // Update the queuedImage with the new status
    let updatedQueuedImage = await QueuedImages.updateOne({ id: inputs.queuedimageid })
    .set({
      annotationComplete:true
    });

    // Kick off the recalc helper
    await sails.helpers.recalculatePercentages('annotations',taskData.id);

    if (!updatedQueuedImage) {
      throw Error('Unknown error occured');
    }

    return exits.success({});





  }


};
