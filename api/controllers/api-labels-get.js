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
    // let query = {};
    // let name = inputs.name.toLowerCase().trim();      
    // query.name = { contains : name };   
    // let Labels = await Labels.find({where : query});   

    // let result = {};
    // result = Labels.find();

    // if(inputs.source == "ml") {
    //   result = await Labels.getMLLabels();
    // } else 
    //  if (inputs.source == "ll") {
    //    result = await Labels.getCustomLabels();
    //  } 
    //  else {
      result = await Labels.getAllLabels()
    // }

    return exits.success(result);
  }

};
