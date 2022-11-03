module.exports = {


  friendlyName: 'Annotations create',


  description: '',


  inputs: {
    boxes : {
      type : [{}],
      description : 'array of bounding boxes',
      required : true
    },
    queuedImageId : {
      type : 'string',
      description : 'The item they are submitting annotations for',
      required : true
    }
  },


  exits: {
    success: {
      statusCode: 200,
      description: 'The annotation was created.'
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
    let queuedImages = await QueuedImages.find({id : inputs.queuedImageId});
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

    // Create the annotation
    let annotData = {
      taskId : taskData.id,
      imageId : queuedImageData.imageId,
      queuedImageId : queuedImageData.id,
      assigneeType : taskData.taskType,
      assigneeDiplayName : taskData.assigneeDiplayName,
      assignee : taskData.assignee,
      boundingBoxes : inputs.boxes
    };

    let newAnnotation = await Annotations.create(annotData).fetch();
    if(!newAnnotation){
      throw Error('Unknown error occured');
    }

    return exits.success(newAnnotation);





  }


};
