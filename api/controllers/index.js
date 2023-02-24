module.exports = {


  friendlyName: 'Index',


  description: 'Index something.',


  inputs: {

  },


  exits: {
    noUsers: {
      responseType: 'redirect',
      description: 'No users exist in the system, so redirect to the signup page',
    },
    loggedIn: {
      responseType: 'redirect',
      description: 'The user is logged in, so redirect to the tasks page',
    },
    loggedOut: {
      responseType: 'redirect',
      description: 'The user is not logged in, so redirect to login page',
    }
  },


  fn: async function (inputs) {

      // Check if there are users in the system
      let userCount = await Users.count();

      // If there are no users, redirect to /signup page
      if(!userCount){
        await Labels.createMLLabel();
        throw { noUsers: '/signup'};
      } else {
        // If there are users in the system, check if visitor is logged in
        if(this.req.session.userId){
          // If visitor is logged in, redirect to tasks page
          throw { loggedIn: '/tasks'};
        } else {
          // If visitor is not logged in, redirect to login page
          throw { loggedOut: '/login'};
        }
      }

  }


};
