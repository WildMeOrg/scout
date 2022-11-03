module.exports = {


  friendlyName: 'Success',


  description: '',


  inputs: {
    message : {
      type : 'string'
    }
  },


  exits: {
    success: {
      responseType: 'view',
      viewTemplatePath: 'pages/success'
    },
  },


  fn: async function (inputs) {

    let serverData = {
      message : inputs.message
    };
    let clientData = {

    };
    let data = await sails.helpers.viewData(this.req,serverData,clientData);
    return data;
  }




};
