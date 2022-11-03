module.exports = {


  friendlyName: 'Session deletion',


  description: '',


  inputs: {

  },


  exits: {
    success: {
      statusCode: 200,
      description: 'The session was releted.'
    }
  },


  fn: async function (inputs,exits) {

    delete this.req.session.userId;
    delete this.req.session.userRole;
    delete this.req.session.username;

    return exits.success();


  }


};
