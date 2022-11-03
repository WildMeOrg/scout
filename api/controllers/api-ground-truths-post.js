module.exports = {


  friendlyName: 'Ground truths create',


  description: '',


  inputs: {
    boxes : {
      type : [{}],
      description : 'array of bounding boxes',
      required : true
    },
    imageId : {
      type : 'string',
      description : 'The image they are submitting ground truths for',
      required : true
    },
    taskId : {
      type : 'string',
      description : 'The task context this GT is being created inside of',
      required : true
    }
  },


  exits: {
    success: {
      statusCode: 200,
      description: 'The ground truth was created.'
    },
    validationFailed: {
      statusCode: 400,
      description: 'There was an error processing the request, see JSON attached.'
    }
  },


  fn: async function (inputs,exits) {

    if(this.req.session.userRole !== 'admin'){
      return exits.forbidden();
    }

    // Create the annotation
    let gtData = {
      taskId : inputs.taskId,
      imageId : inputs.imageId,
      username : this.req.session.username,
      userId : this.req.session.userId,
      boundingBoxes : inputs.boxes
    };

    let newGT = await GroundTruths.create(gtData).fetch();
    if(!newGT){
      throw Error('Unknown error occured');
    }

    return exits.success(newGT);





  }


};
