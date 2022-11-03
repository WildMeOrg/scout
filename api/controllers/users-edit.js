module.exports = {


  friendlyName: 'Users edit',


  description: '',


  inputs: {

  },


  exits: {
    success: {
      responseType: 'view',
      viewTemplatePath: 'pages/users-edit'
    },
    notLoggedIn: {
      responseType: 'redirect',
      description: 'The user is not logged in, so they cannot access this page'
    },
    forbidden: {
      responseType: 'redirect',
      description: 'The user is not allowed to access this page'
    },
    userNotFound: {
      responseType: 'redirect',
      description: 'The user identified cannot be found'
    }
  },


  fn: async function (inputs) {

    // Redirect if not logged in
    if(!this.req.session.userId) throw { notLoggedIn: '/'};

    // Redirect if not admin
    if(this.req.session.userRole !== 'admin') throw { forbidden: '/403'};

    // Get the ID of the user being edited
    let userBeingEdited = this.req.param('id');
    if(!userBeingEdited){
      throw { userNotFound: '/404'};
    }
    let dataOfUserBeingEdited = await Users.find({'where' : {'id' : userBeingEdited}, limit : 1})
    if(!dataOfUserBeingEdited.length){
      throw { userNotFound: '/404'};
    }

    delete dataOfUserBeingEdited.passwordHash;
    let serverData = {
      userData : dataOfUserBeingEdited[0]
    };
    let clientData = {

    };
    let data = await sails.helpers.viewData(this.req,serverData,clientData);
    return data;

  }


};
