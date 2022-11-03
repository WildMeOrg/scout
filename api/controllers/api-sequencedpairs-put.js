module.exports = {


  friendlyName: 'Sequenced pairs put',


  description: 'Update a sequenced pair with a done status, then kick off the recalculation helper',


  inputs: {
    sequencedpairid : {
      type : 'string',
      required : true
    },
    taskId : {
      type : 'string',
      description : 'The task context this LD is being created inside of',
      required : true
    },
    divisionComplete : {
      type : 'boolean',
      description : 'marking this sequenced pair as complete',
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
      return exits.forbidden();
    }
    // Update the image with the new status
    let updatedSequencedPair = await SequencedPairs.updateOne({ id: inputs.sequencedpairid })
    .set({
      divisionComplete:true
    });
    if (!updatedSequencedPair) {
      throw Error('Unknown error occured');
    }
    await sails.helpers.recalculatePercentages('ld',inputs.taskId);
    return exits.success({});


  }


};
