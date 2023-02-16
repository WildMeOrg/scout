
module.exports = {

  friendlyName: 'Labels GET',

  description: '',

  inputs: {
    name : {
      type : 'string',
      description : ''
    },    
  },


  exits: {
    success: {
      statusCode: 200,
      description: 'Labels were found. Details attached.'
    },
    // forbidden: {
    //   statusCode: 403,
    //   description: 'The user is not allowed to make that request.'
    // },
  },


  fn: async function (exits) {

    // if(!this.req.session.userId){
    //   return exits.forbidden();
    // }

    // let name = inputs.name.toLowerCase().trim();      
    // query.name = { contains : name };          

    let Labels = await Labels.find();

    // let Labels = await Labels.find({where : query});
    
    return exits.success(Labels);
  }


};
