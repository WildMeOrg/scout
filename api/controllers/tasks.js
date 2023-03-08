module.exports = {


  friendlyName: 'Tasks',


  description: 'Tasks something.',


  inputs: {

  },


  exits: {
    success: {
      responseType: 'view',
      viewTemplatePath: 'pages/tasks'
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

    // Get the status of the ingestion worker
    ingestionActive = false;
    let workers = await Workers.find({where : {name : 'imageIngestion'}, limit: 1})
    if(workers.length && workers[0].statusBoolean == true){
      ingestionActive = true;
    }

    let taskCount = await Tasks.count();

    // Get users
    let users = await Users.find();

    // Get the last task created by the user
    lastTaskName = null;
    let lastTasks = await Tasks.find({createdByUserId : this.req.session.userId});
    if(lastTasks.length){
      lastTaskName = lastTasks[0].displayName;
    }

    let availableTags = await Tags.find({where : {}, sort: 'name ASC'});
    let serverData = {
      ingestionActive : ingestionActive,
      secondaryNav : 'tasks',
      users : users,
      availableTags: availableTags,
      lastTaskName : lastTaskName
    };

    let clientData = {
      availableTags: availableTags,
      pageName : 'taskList'
    };
    let data = await sails.helpers.viewData(this.req,serverData,clientData);
    return data;
  }


};
