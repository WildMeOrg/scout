
module.exports = {


  friendlyName: 'Workers GET',


  description: '',


  inputs: {
    name : {
      type : 'string',
      description : 'The name of the worker',
      required : true
    }
  },


  exits: {
    success: {
      statusCode: 200,
      description: 'The workers was found. Details attached.'
    },
    forbidden: {
      statusCode: 403,
      description: 'The user is not allowed to make that request.'
    }
  },


  fn: async function (inputs,exits) {


    if(!this.req.session.userId){
      return exits.forbidden();
    }

    let workerList = await Workers.find({'name' : inputs.name});
    if(workerlist.length == 0){
      return exits.notFound();
    } else {
      return exits.success(workerList[0]);
    }
  }


};
