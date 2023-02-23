module.exports = {

  friendlyName: 'Labels GET',

  description: 'Get all labels',

  inputs: {
    name : {
      type : 'string',
      description : 'label name'
    },  
    source: {
      type : 'string',
      description : 'machine learning or lab lead'
    }  
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
      result = await Labels.getAllLabels()    

    return exits.success(result);
  }

};
