
module.exports = {


  friendlyName: 'Tasks GET',


  description: '',


  inputs: {
    name : {
      type : 'string',
      description : 'Partial match for task name'
    },
    startDate : {
      type : 'string',
      description : 'Date from'
    },
    endDate : {
      type : 'string',
      description : 'Date to'
    },
    page : {
      type : 'number'
    },
    phase : {
      type : 'string'
    },
    assignee : {
      type : 'string'
    },
  },


  exits: {
    success: {
      statusCode: 200,
      description: 'Tasks were found. Details attached.'
    },
    forbidden: {
      statusCode: 403,
      description: 'The user is not allowed to make that request.'
    }
  },


  fn: async function (inputs,exits) {

    if(!this.req.session.userId){
      return exits.forbidden();
    }

    let query = {};
    // @TODO consolidate with the logic in the app.js csvQueuer worker

    // Name

    if(inputs.name && inputs.name.length && inputs.name.trim().length){
      let name = inputs.name.toLowerCase().trim();
      if(!name.includes("*")) {
        query.name = { contains : name };
      }else {
        query.name = {  like : name.replaceAll("*","%")}
      }      
    }

    // Date created - start
    if(inputs.startDate){
      let start = Date.parse(inputs.startDate);
      query.createdAt = { '>=': start };
    }

    // Date created - end
    if(inputs.endDate){
      let end = Date.parse(inputs.endDate) + (1000 * 60 * 60 * 24);
      if(typeof(query.createdAt) == 'undefined'){
        query.createdAt = {};
      }
      query.createdAt['<='] = end;
    }

    // Assignee (multiselect)
    if(inputs.assignee && inputs.assignee.length && inputs.assignee.trim().length){
      let arr = inputs.assignee.trim().split(',');
      query.assignee = arr;
    }

    // Phase (multiselect)
    if(inputs.phase && inputs.phase.length && inputs.phase.trim().length){
        let arr = inputs.phase.trim().split(',');
        let phase = {};
        for(const item of arr){
          phase[item] = true;
        }

        query.or = []

      // Annotation
      if(phase.ns == true){
        let obj = {
          progressAnnotation : 0
        };
        query.or.push(obj);
      }
      if(phase.as == true){
        let obj = {
          progressAnnotation : {
            '>' : 0,
            '<' : 1
          }
        };
        query.or.push(obj);
      }
      if(phase.af == true){
        let obj = {
          progressAnnotation : 1
        };
        query.or.push(obj);
      }
      // GT

      if(phase.gs == true){
        let obj = {
          progressGroundTruth : {
            '>' : 0,
            '<' : 1
          }
        };
        query.or.push(obj);
      }
      if(phase.gf == true){
        let obj = {
          progressGroundTruth : 1
        };
        query.or.push(obj);
      }

      // Line division
      if(phase.ds == true){
        let obj = {
          progressAnnotation : {
            '>' : 0,
            '<' : 1
          }
        };
        query.or.push(obj);
      }
      if(phase.df == true){
        let obj = {
          progressGroundTruth : 1
        };
        query.or.push(obj);
      }
    }

    // Page
    let page = inputs.page || 1;
    const itemsPerPage = 50;
    let skip = (page - 1) * itemsPerPage;

    let tasks = await Tasks.find({where : query, limit: itemsPerPage, skip : skip, sort: 'name ASC'});
    for (const task of tasks) {
      task.iCanAnnotate = task.progressAnnotation < 1 && task.imageCount > 0 && this.req.session.userId == task.assignee ? true : false;
      task.iCanGroundTruth = task.progressAnnotation == 1 && task.progressGroundTruth < 1 ? true : false;
      task.iCanDivide = task.progressGroundTruth == 1 && task.sequencingComplete == true && task.progressLineDivision < 1 ? true : false;
      task.iCanDelete = this.req.session.userRole == 'admin' ? true : false;
    }


    let taskCount = await Tasks.count({where : query});
    let returnData = {
      page : page,
      itemsPerPage : itemsPerPage,
      tasks: tasks,
      taskCount : taskCount
    };
    return exits.success(returnData);
  }


};
