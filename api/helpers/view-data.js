module.exports = {


  friendlyName: 'View data',


  description: '',


  inputs: {
    req: {
      type: 'ref',
      description: 'The current incoming request (req).',
      required: true
    },
    serverData : {type : {}},
    clientData :  {type : {}},

  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs, exits) {

    // Get logged in user
    const userId = inputs.req.session.userId ? inputs.req.session.userId : false;
    const loggedIn = userId ? true : false;
    const userRole = userId ? inputs.req.session.userRole : false;

    let defaultClientData = {
      appName : 'scout',
      userId : userId,
      userRole : userRole,
      loggedIn : loggedIn

    };

    let defaultServerData = {
      pageTitle: 'Welcome to Scout',
      userId : userId,
      userRole : userRole,
      loggedIn : loggedIn
    }

    let finalClientData  = _.assign({}, defaultClientData, inputs.clientData);

    let finalServerData  = _.assign({}, defaultServerData, inputs.serverData);

    let combinedData = finalServerData;
    combinedData.clientData = JSON.stringify(finalClientData);


    return exits.success(combinedData);
  }


};
