module.exports = {


  friendlyName: 'Images put',


  description: 'Update an image with a ground-truthed status, then kick off the recalculation helper',


  inputs: {
    imageid : {
      type : 'string',
      required : true
    },
    taskId : {
      type : 'string',
      description : 'The task context this GT is being created inside of',
      required : true
    },
    gtComplete : {
      type : 'boolean',
      description : 'marking this image as complete with ground truthing',
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

    if(this.req.session.userRole !== 'admin'){
      this.res.forbidden();
    }

    // Update the image with the new status
    let updatedImage = await Images.updateOne({ id: inputs.imageid })
    .set({
      gtComplete:true
    });
    if (!updatedImage) {
      throw Error('Unknown error occured');
    }

    // Kick off the recalc helper for all tasks where this image exists
    let imagesList = await Images.find({where : {id : inputs.imageid}})
    let imageData = imagesList[0];
    for(const taskId of imageData.taskIds){
      await sails.helpers.recalculatePercentages('gt',taskId);
    }



    return exits.success({});





  }


};
