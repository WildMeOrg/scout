module.exports = {


  friendlyName: 'Annotations',


  description: 'Annotations something.',


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
      viewTemplatePath: 'pages/annotations'
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
      description: 'The user is done annotating'
    }
  },


  fn: async function (inputs) {

    const isBack = typeof(inputs.back) !== 'undefined' && inputs.back ? true : false;

    // Redirect if not logged in
    if(!this.req.session.userId) throw { notLoggedIn: '/'};

    // Check that task exists, or return 404
    let tasks = await Tasks.find({where : {id : inputs.taskid }, limit : 1});
    if(!tasks.length){
      throw { notFound: '/404'};
    }
    let taskData = tasks[0];

    // Check to make sure the logged in user is the asignee of the task or return 403
    if(this.req.session.userId !== taskData.assignee){
      throw { forbidden : '/403'};
    }


    // Logic for back button and back queuedImageId
    backEnabled = false;
    if(typeof(this.req.session.annotationHistory) == 'undefined'){
      this.req.session.annotationHistory = {};
    }
    if(typeof(this.req.session.annotationHistory[taskData.id]) == 'undefined'){
      this.req.session.annotationHistory[taskData.id] = {};
    }

    if(!isBack){
      if(typeof(this.req.session.annotationHistory[taskData.id].current) !== 'undefined'){
          backEnabled = true;
        this.req.session.annotationHistory[taskData.id].last = this.req.session.annotationHistory[taskData.id].current;
      }
    } else {
      this.req.session.annotationHistory[taskData.id].current = this.req.session.annotationHistory[taskData.id].last;
      this.req.session.annotationHistory[taskData.id].last = false;
    }

    // Find a random queued image for this task, that is currently not annotated

    if(!isBack){
      let queuedImages = await QueuedImages.find({
        where : {
          annotationComplete : false,
          taskId : taskData.id
        }
      });
      if(!queuedImages.length){
        let successMessage = `Annotation of task "${taskData.displayName}" is complete.`;
        throw { congrats : '/success/'+successMessage};
      }

      let totalImages = queuedImages.length;
      if (taskData.randomized == false) {
        let timestamps = {};
        for (qid of queuedImages) {
            let images = await Images.find({id : qid.imageId});
            timestamps[qid.imageId] = images[0].exifTimestamp;
        }
        queuedImages.sort(function(a, b) { return timestamps[a.imageId] - timestamps[b.imageId]; });
        queuedImageData = queuedImages[0];
      } else {
          let randomIndex = Math.floor(Math.random() * (totalImages - 1));
          queuedImageData = queuedImages[randomIndex];
      }
      this.req.session.annotationHistory[taskData.id].current = queuedImageData.id;

    } else {
      let queuedImages = await QueuedImages.find({
        where : {id : this.req.session.annotationHistory[taskData.id].current}
      });
      if(queuedImages.length){
        queuedImageData = queuedImages[0];
      } else {
        throw ('Unknown error occured');
      }
    }


    // Get the image data
    let images = await Images.find({id : queuedImageData.imageId});
    let imageData = images[0];


    // Get the existing annotations
    existingAnnotations = false;
    let annots = await Annotations.find({queuedImageId : queuedImageData.id});
    if(annots.length > 0){
      existingAnnotations = annots[0];
    }

    let serverData = {
      backEnabled : backEnabled,
      imageData : imageData,
      secondaryNav : 'annotation',
      existingAnnotations : existingAnnotations
    };
    let clientData = {
      queuedImageId : queuedImageData.id,
      taskId : inputs.taskid,
      existingAnnotations : existingAnnotations,
      pageName : 'annotations'
    };
    let data = await sails.helpers.viewData(this.req,serverData,clientData);
    return data;
  }



};
