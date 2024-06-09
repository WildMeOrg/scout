module.exports = {


  friendlyName: 'Ground truths',


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
      viewTemplatePath: 'pages/ground-truths'
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
    if(typeof(this.req.session.gtHistory) == 'undefined'){
      this.req.session.gtHistory = {};
    }
    if(typeof(this.req.session.gtHistory[taskData.id]) == 'undefined'){
      this.req.session.gtHistory[taskData.id] = {};
    }

    if(!isBack){
      if(typeof(this.req.session.gtHistory[taskData.id].current) !== 'undefined'){
          backEnabled = true;
        this.req.session.gtHistory[taskData.id].last = this.req.session.gtHistory[taskData.id].current;
      }
    } else {
      if(typeof(this.req.session.gtHistory[taskData.id].last) == 'string'){
        this.req.session.gtHistory[taskData.id].current = this.req.session.gtHistory[taskData.id].last;
        this.req.session.gtHistory[taskData.id].last = false;
      } else {
        // They only get here if they try to refresh a page that has a back=true on it
        throw { removeBack: '/ground-truths/'+taskData.id+'/new'};
      }

    }


    // Find a random image for this task, that is currently not ground-truthed

    if(!isBack){
      let images = await Images.find({
        where : {
          gtComplete : {
            '!=' : true
          },
          taskIds : [taskData.id]
        }
      });
      if(!images.length){
        let successMessage = `Ground-Truthing of task "${taskData.displayName}" is complete.`;
        throw { congrats : '/success/'+successMessage};
      }
      let totalImages = images.length;

      // similar to annotations, we can do random or sequential now
      if (taskData.randomized == false) {
        images.sort(function(a, b) { return a.exifTimestamp - b.exifTimestamp; });
        imageData = images[0];
      } else {
          let randomIndex = Math.floor(Math.random() * (totalImages - 1));
          imageData = images[randomIndex];
      }
      this.req.session.gtHistory[taskData.id].current = imageData.id;

    } else {
      let images = await Images.find({
        where : {id : this.req.session.gtHistory[taskData.id].current}
      });
      if(images.length){
        imageData = images[0];
      } else {
        throw ('Unknown error occured');
      }
    }


    // Get the existing annotations
    existingAnnotations = false;
    let annots = await Annotations.find({
      imageId : imageData.id,
      taskId : inputs.taskid
    });
    if(annots.length > 0){
      existingAnnotations = annots[0];
    }

    existingGroundTruths = false;
    let gts = await GroundTruths.find({imageId : imageData.id});
    if(gts.length > 0){
      existingGroundTruths = gts[0];
    }

    let chosenAnnotations = isBack ? existingGroundTruths : existingAnnotations;


    // Look up all queuedImages that are done, for this imageId

    comparisonTasks = await QueuedImages.find({imageId : imageData.id, annotationComplete : true});

    let finalComparisonArray = [];
    for(const comparison of comparisonTasks){
      error = false;
      // Get the task data for each result

      let refTaskList = await Tasks.find({id : comparison.taskId});
      if(refTaskList.length){
        comparison.taskData = refTaskList[0];
      } else {
        error = true;
      }
      // Get the annotation data for each result
      let refAnnotationList = await Annotations.find({queuedImageId : comparison.id});
      if(refAnnotationList.length){
        comparison.annotationData = refAnnotationList[0];
      }
      if(!error){
        finalComparisonArray.push(comparison);
      }

    }


    imageData.imageDate = new Date(imageData.exifTimestamp).toLocaleDateString();
    imageData.hasGpsLocation = Images.hasGpsLocation(imageData);

    let serverData = {
      backEnabled : backEnabled,
      imageData : imageData,
      secondaryNav : 'gt',
      existingAnnotations : chosenAnnotations,
      comparisonTasks : finalComparisonArray
    };
    let clientData = {
      imageId : imageData.id,
      taskId : inputs.taskid,
      chosenAnnotations : chosenAnnotations,
      existingAnnotations : existingAnnotations,
      existingGroundTruths : existingGroundTruths,
      pageName : 'gt',
      comparisonTasks : finalComparisonArray
    };
    let data = await sails.helpers.viewData(this.req,serverData,clientData);
    return data;

  }


};
