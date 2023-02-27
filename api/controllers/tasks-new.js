module.exports = {


  friendlyName: 'Tasks new',


  description: '',


  inputs: {

  },


  exits: {
    success: {
      responseType: 'view',
      viewTemplatePath: 'pages/tasks-new'
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

    // Count the images
    let imageCount = await Images.count();

    // Get users
    let users = await Users.find();

    let allLabels = await Labels.getAllLabels();
    let allLabelNames = [];
    for (let lbl of allLabels) {
        allLabelNames.push(lbl.name);
    }
    allLabelNames = allLabelNames.sort(function (a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
    });

    // Get the status of the ingestion worker
    ingestionActive = false;
    let workers = await Workers.find({where : {name : 'imageIngestion'}, limit: 1})
    if(workers.length && workers[0].statusBoolean == true){
      ingestionActive = true;
    }

    let tasks = await Tasks.find({where : {}, limit: 10, sort: 'name ASC'});

    let serverData = {
      users: users,
      imageCountTotal : imageCount,
      ingestionActive : ingestionActive,
      allLabelNames : allLabelNames,
      tasks : tasks
    };
    let clientData = {

    };
    let data = await sails.helpers.viewData(this.req,serverData,clientData);
    return data;

  }


};
