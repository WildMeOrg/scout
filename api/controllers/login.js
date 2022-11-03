module.exports = {


  friendlyName: 'Login',


  description: 'Login something.',


  inputs: {

  },


  exits: {
    success: {
      responseType: 'view',
      viewTemplatePath: 'pages/login'
    },
    loggedIn: {
      responseType: 'redirect',
      description: 'The user is already logged in, so they cannot access this page'
    },
    noUsers: {
      responseType: 'redirect',
      description: 'There are no users in the database, so nobody should be able to access this page'
    },
  },


  fn: async function (inputs) {

    let userCount = await Users.count();

    if(!userCount) throw { noUsers: '/'};

    // Redirect if logged in
    if(this.req.session.userId) throw { loggedIn: '/'};

    let serverData = {

    };
    let clientData = {

    };
    let data = await sails.helpers.viewData(this.req,serverData,clientData);
    return data;

  }


};
