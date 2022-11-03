module.exports = {


  friendlyName: 'Line divisions create',


  description: '',


  inputs: {
    topX : {
      type : 'number',
      required : true
    },
    bottomX : {
      type : 'number',
      required : true
    },
    sequencedPairId : {
      type : 'string',
      description : 'The sequenced pair they are submitting ground truths for',
      required : true
    },
    taskId : {
      type : 'string',
      description : 'The task context this LD is being created inside of',
      required : true
    },
    imageLeftId : {
      type : 'string',
      description : 'The id of the image on the left',
      required : true
    },
    imageRightId : {
      type : 'string',
      description : 'The id of the image on the right',
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
    let ldData = {
      topX : inputs.topX,
      bottomX : inputs.bottomX,
      taskId : inputs.taskId,
      sequencedPairId : inputs.sequencedPairId,
      imageLeftId : inputs.imageLeftId,
      imageRightId : inputs.imageRightId,
      userId : this.req.session.userId,

    };

    let newLD = await LineDivisions.create(ldData).fetch();
    if(!newLD){
      throw Error('Unknown error occured');
    }

    return exits.success(newLD);





  }


};
