module.exports = {


  friendlyName: 'Error 403',


  description: '',


  inputs: {

  },


  exits: {
    success: {
      responseType: 'view',
      viewTemplatePath: 'pages/error-403'
    },
  },


  fn: async function (inputs) {

    let serverData = {

    };
    let clientData = {

    };
    let data = await sails.helpers.viewData(this.req,serverData,clientData);
    return data;
  }



};
