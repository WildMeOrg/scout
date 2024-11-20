module.exports = {


  friendlyName: 'Task Images Preview',


  description: '',


  inputs: {
    taskid : {
      type : 'string',
      description : 'id of task'
    },
    sortby: {
        type: 'string',
        description: 'field to sort by'
    }
  },


  exits: {
    success: {
      responseType: 'view',
      viewTemplatePath: 'pages/task-images-preview'
    },
    notLoggedIn: {
      responseType: 'redirect',
      description: 'The user is not logged in, so they cannot access this page'
    },
    forbidden: {
      responseType: 'redirect',
      description: 'The user is not allowed to access this page'
    },
    notFound: {
      responseType: 'redirect',
      description: 'The specified task could not be found'
    },
    congrats: {
      responseType: 'redirect',
      description: 'The user is done ground-truthing'
    }
  },


  fn: async function (inputs) {

    // Redirect if not logged in
    if(!this.req.session.userId) throw { notLoggedIn: '/'};

    // Redirect if not admin
    if(this.req.session.userRole !== 'admin') throw { forbidden: '/403'};

    // Check that task exists, or return 404
    let tasks = await Tasks.find({where : {id : inputs.taskid }, limit : 1});
    if(!tasks.length){
      throw { notFound: '/404'};
    }
    let taskData = tasks[0];

    let sortBy = inputs.sortby || 'exifTimestamp';
  let images = await Images.find({
    where : {
      taskIds : [taskData.id]
    },
    sort: sortBy
  });

    let serverData = {
      sortBy: sortBy,
      taskData: taskData,
      images: images
    };
    let clientData = {
      taskId : inputs.taskid
    };
    let data = await sails.helpers.viewData(this.req,serverData,clientData);
    return data;

  }


};
