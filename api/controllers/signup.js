module.exports = {


  friendlyName: 'Signup',


  description: 'Signup something.',


  inputs: {

  },


  exits: {
    success: {
      responseType: 'view',
      viewTemplatePath: 'pages/signup'
    },
    usersExist: {
      responseType: 'redirect',
      description: 'At least one user already exists in the system, so redirect to the homepage',
    }
  },


  fn: async function (inputs) {

    // Check if there are users in the system
    let userCount = await Users.count();

    // If there are users already, redirect to home page
    if(userCount){
      throw { usersExist: '/'};
    } else {

      let serverData = {

      };
      let clientData = {

      };
      let data = await sails.helpers.viewData(this.req,serverData,clientData);
      return data;

    }

  }


};
