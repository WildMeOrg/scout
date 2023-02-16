module.exports = {

  friendlyName: 'Labels GET',

  description: 'Get all labels',

  inputs: {
    name : {
      type : 'string',
      description : 'label name'
    },    
  },


  exits: {
    success: {
      statusCode: 200,
      description: 'Labels were found. Details attached.'
    },

    forbidden: {
      statusCode: 403,
      description: 'The user is not allowed to make that request.'
    },
  },


  fn: async function (inputs,exits) {

    if(!this.req.session.userId){
      return exits.forbidden();
    }
    // let query = {};
    // let name = inputs.name.toLowerCase().trim();      
    // query.name = { contains : name };   
    // let Labels = await Labels.find({where : query});

    let result = await Labels.find();    
    
    return exits.success(result);
  }


};
