
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
    tags: {
        type: 'string'
    },
    randomized : {
      type : 'boolean'
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

    // ordering (randomized)

    if (inputs.randomized != undefined) {
      if (inputs.randomized) {
        // this will get previously existing null values (which means randomized)
        query.randomized = { '!=': false };
      } else {
        query.randomized = false;
      }
    }

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

    if (inputs.tags) {
        let tagIds = inputs.tags.split(',');
        if (tagIds.length == 1) {
            query.tagIds = { contains: tagIds[0] };
        } else if (tagIds.length > 1) {
            if (query.or) {
                query.and = [ { or: JSON.parse(JSON.stringify(query.or)) } ];
                delete query.or;
                let tagOr = { or: [] };
                for (const tagId of tagIds) {
                    tagOr.or.push({ tagIds: { contains: tagId } });
                }
                query.and.push(tagOr);
            } else {
                query.or = [];
                for (const tagId of tagIds) {
                    query.or.push({ tagIds: { contains: tagId } });
                }
            }
        }
    }
    //console.dir(query, {depth: null});

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
