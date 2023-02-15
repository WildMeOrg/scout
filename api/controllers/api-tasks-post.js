module.exports = {


  friendlyName: 'Tasks create',


  description: '',


  inputs: {
    name : {
      type : 'string',
      description : 'Alphanumeric, must be unique',
      required : true
    },
    assignee : {
      type : 'string',
      description : 'either a user ID or an ml config name',
      required : true
    },
    randomized : {
      type : 'boolean',
      description : 'shown in random order (vs sequential)',
      required : true
    },
    orientation : {
      type : 'string',
      description : 'left or right',
      required : true
    },
    filterLabels : {
      type : ['string'],
      description : ''
    },
    filterName : {
      type : 'string',
      description : ''
    },
    filterSource : {
      type : 'string',
      description : 'A task ID to copy from'
    },
    filterDateStart : {
      type : 'string',
      description : ''
    },
    filterDateEnd : {
      type : 'string',
      description : ''
    },
    filterSubsetStart : {
      type : 'string',
      description : ''
    },
    filterSubsetEnd : {
      type : 'string',
      description : ''
    },
    filteredImageCount : {
      type : 'string',
      description : ''
    }
  },


  exits: {
    success: {
      statusCode: 200,
      description: 'The session was created.'
    },
    validationFailed: {
      statusCode: 400,
      description: 'There was an error processing the request, see JSON attached.'
    }
  },


  fn: async function (inputs,exits) {

    let errorsObject = {};
    let mlAssignees = {
      'ml-v1' : 'ML Config: V1 Classifier',
      'ml-v2' :  'ML Config: V2 Classifier',
      'ml-dummy' :  'ML Config: Random Nonsense'
    }
    // Check to see if that name exists
    let matchingName = await Tasks.find({where: { name: inputs.name.trim().toLowerCase() }, });
    if(matchingName.length){
      errorsObject.name = "That name is already taken.";
    }

    // If errors already, return them
    if(Object.keys(errorsObject).length){
      return exits.validationFailed({errorsObject : errorsObject});
    } else {

      let taskData = {
        name : inputs.name.trim().toLowerCase(),
        displayName : inputs.name,
        taskType : mlAssignees.hasOwnProperty(inputs.assignee) ? 'ml' : 'user',
        assignee : inputs.assignee,
        orientation : inputs.orientation,
        randomized : inputs.randomized,
        createdByUserId : this.req.session.userId
      }

      assigneeDiplayName = false;
      if(taskData.taskType == 'ml'){
        assigneeDiplayName = mlAssignees[inputs.assignee];
      } else {
        let matchingUsers = await Users.find({where : {'id' : inputs.assignee}, limit : 1});
        assigneeDiplayName = matchingUsers[0].displayUsername;
      }

      taskData.assigneeDiplayName = assigneeDiplayName

      let newTask = await Tasks.create(taskData).fetch();
      if(!newTask){
        throw Error('Unknown error occured');
      }

      let imageFilters = {
        filterName : inputs.filterName,
        filterLabels : inputs.filterLabels,
        filterSource: inputs.filterSource,
        filterDateStart: inputs.filterDateStart,
        filterDateEnd: inputs.filterDateEnd,
        taskId : newTask.id
      };

      if(inputs.filterSubsetStart.length){
        imageFilters.filterSubsetStart = parseInt(inputs.filterSubsetStart);
      }

      if(inputs.filterSubsetEnd.length){
        imageFilters.filterSubsetEnd = parseInt(inputs.filterSubsetEnd);
      }

      if(inputs.filteredImageCount.length){
        imageFilters.filteredImageCount = parseInt(inputs.filteredImageCount);
      }

      let newUnQueuedTask = await UnQueuedTasks.create(imageFilters).fetch();
      if(!newTask){
        throw Error('Unknown error occured');
      }

      // If successful, return created task

      return exits.success(newTask);


    }


  }


};
