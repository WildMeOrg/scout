module.exports = {


  friendlyName: 'Line divisions',


  description: '',


  inputs: {
    taskid : {
      type : 'string',
      description : 'id of task'
    },
    back : {
      type : 'boolean'
    }
  },


  exits: {
    success: {
      responseType: 'view',
      viewTemplatePath: 'pages/line-divisions'
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
      description: 'The user is done line-dividing'
    },
    removeBack : {
      responseType: 'redirect'
    }
  },


  fn: async function (inputs) {

    const isBack = typeof(inputs.back) !== 'undefined' && inputs.back ? true : false;

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

    // Logic for back button and back imageId
    backEnabled = false;
    if(typeof(this.req.session.ldHistory) == 'undefined'){
      this.req.session.ldHistory = {};
    }
    if(typeof(this.req.session.ldHistory[taskData.id]) == 'undefined'){
      this.req.session.ldHistory[taskData.id] = {};
    }

    if(!isBack){
      if(typeof(this.req.session.ldHistory[taskData.id].current) !== 'undefined'){
          backEnabled = true;
        this.req.session.ldHistory[taskData.id].last = this.req.session.ldHistory[taskData.id].current;
      }
    } else {
      if(typeof(this.req.session.ldHistory[taskData.id].last) == 'string'){
        this.req.session.ldHistory[taskData.id].current = this.req.session.ldHistory[taskData.id].last;
        this.req.session.ldHistory[taskData.id].last = false;
      } else {
        // They only get here if they try to refresh a page that has a back=true on it
        throw { removeBack: '/line-divisions/'+taskData.id+'/new'};
      }

    }



    // Get the first unfinished pair
    if(!isBack){
    let pairs = await SequencedPairs.find({
      where : {
        divisionComplete : false,
        taskId : inputs.taskid
      },
      sort : 'index ASC',
      limit: 1
    });
    if(!pairs.length){
      let successMessage = `Line-Division of task "${taskData.displayName}" is complete.`;
      throw { congrats : '/success/'+successMessage};
    }
    pairData = pairs[0];
    this.req.session.ldHistory[taskData.id].current = pairData.id;
    } else {
      let pairs = await SequencedPairs.find({
        where : {id : this.req.session.ldHistory[taskData.id].current}
      });
      if(pairs.length){
        pairData = pairs[0];
      } else {
        throw ('Unknown error occured');
      }
    }

    existingLineDivisions = false;
    let lds = await LineDivisions.find({sequencedPairId : pairData.id});
    if(lds.length > 0){
      existingLineDivisions = lds[0];
    }

    let serverData = {
      pageName : 'division',
      secondaryNav : 'division',
      imageLeftId : pairData.imageLeftId,
      imageRightId : pairData.imageRightId,
      sequencedPairId : pairData.id
    };
    let clientData = {
      pageName : 'division',
      taskId : taskData.id,
      imageLeftId : pairData.imageLeftId,
      imageRightId : pairData.imageRightId,
      sequencedPairId : pairData.id,
      existingLineDivisions : existingLineDivisions
    };
    let data = await sails.helpers.viewData(this.req,serverData,clientData);
    return data;

  }


};
