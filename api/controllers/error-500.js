module.exports = {


  friendlyName: 'Error 500',


  description: '',


  inputs: {

  },


  exits: {
    success: {
      responseType: 'view',
      viewTemplatePath: 'pages/error-500'
    },
  },


  fn: async function (inputs) {

    stackTrace = 'No recent error logs were found.';

    let errs = await Errors.find({sort: 'createdAt DESC', limit : 10});
    if(errs.length){
      stackTrace = '';
      for(const err of errs){
        stackTrace+=err.stackTrace.toString()+`

`;
      }
    }

    let serverData = {
      stackTrace : stackTrace
    };
    let clientData = {

    };
    let data = await sails.helpers.viewData(this.req,serverData,clientData);
    return data;
  }




};
