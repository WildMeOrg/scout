module.exports = {


  friendlyName: 'Oops',


  description: 'Throwing an exception on accident (on purpose)',


  inputs: {

  },


  exits: {
    success: {
      responseType: 'view',
      viewTemplatePath: 'pages/login'
    },
    errorLogged: {
      responseType: 'redirect',
      description: 'The error has been logged'
    },
  },


  fn: async function (inputs) {

    // Cause an exception
    try{
    let foo = '$069*&vjs';
    JSON.parse(foo);
  }catch(e){
    await sails.helpers.logError(e.toString());
  }

  throw { errorLogged: '/500'};


  }


};
