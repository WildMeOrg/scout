module.exports = {


  friendlyName: 'Exports',


  description: 'Export progress and download page.',


  inputs: {
    exportid : {
      type : 'string',
      description : 'The ID of the export',
      required : true
    }
  },


  exits: {
    success: {
      responseType: 'view',
      viewTemplatePath: 'pages/exports'
    },
    notLoggedIn: {
      responseType: 'redirect',
      description: 'The user is not logged in, so they cannot access this page'
    },
    forbidden: {
      responseType: 'redirect',
      description: 'The user is not allowed to access this page'
    }
  },


  fn: async function (inputs) {

    // Redirect if not logged in
    if(!this.req.session.userId) throw { notLoggedIn: '/'};

    // Redirect if not admin
    if(this.req.session.userRole !== 'admin') throw { forbidden: '/403'};

    let exports = await Exports.find({_id : inputs.exportid});
    if(!exports.length){
      throw { notFound: '/404'};
    }



    let exportData = exports[0];

    let serverData = {
      exportData : exportData
    };
    let clientData = {
      exportData : exportData,
      pageName : 'export'
    };
    let data = await sails.helpers.viewData(this.req,serverData,clientData);
    return data;

  }


};
