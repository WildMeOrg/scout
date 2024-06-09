
module.exports = {


  friendlyName: 'Images GET',


  description: '',


  inputs: {
    originalFilenameLower : {
      type : 'string',
      description : 'Partial match or use * as wildcard for image name'
    },
    labels: {
      type: 'ref',
      description: 'labels to match'
    },
    sourceTask : {
      type : 'string',
      description : 'The source task to copy from'
    },
    startDate : {
      type : 'string',
      description : 'Date from'
    },
    endDate : {
      type : 'string',
      description : 'Date to'
    },
    // Lat+Long are strings otherwise validation throws errors when typing negatives
    latMin : {
      type : 'string',
      description : 'latitude minimum'
    },
    latMax : {
      type : 'string',
      description : 'latitude maximum'
    },
    longMin : {
      type : 'string',
      description : 'longitude minimum'
    },
    longMax : {
      type : 'string',
      description : 'longitude maximum'
    },
    subsetStart : {
      type : 'number',
      description : 'End of subset'
    },
    subsetEnd : {
      type : 'number',
      description : 'End of subset'
    },
    wicMin : {
      type : 'number',
      description : 'wic minimum'
    },
    wicMax : {
      type : 'number',
      description : 'wic maximum'
    },
  },

  exits: {
    success: {
      statusCode: 200,
      description: 'Images were found. Details attached.'
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

    // @TODO consolidate this logic into a helper and have this controller share with with the taskQueuer worker
    overrideToZero = false;
    let originalFilenameLower = inputs.originalFilenameLower.toLowerCase().trim();

    let query = {};
    if(!originalFilenameLower.includes("*")) {      
      query.originalFilenameLower = {
        contains: originalFilenameLower
      };
    }  
    else {      
      query.originalFilenameLower = {        
         like: originalFilenameLower.replaceAll("*","%")
      };
    }

    let labels = [];
    // what a hassle
    if (inputs.labels) {
        let arr = [];
        if (Array.isArray(inputs.labels)) {
            arr = inputs.labels;
        } else {  // assuming string, sorrynotsorry
            arr.push(inputs.labels);
        }
        for (const label of arr) {
            if (label.length) labels.push(label);
        }
    }

    if(inputs.sourceTask){
      let matchingTasks = await Tasks.find({where : {displayName : inputs.sourceTask}, limit : 1})

      if(matchingTasks.length > 0){
        let taskId = matchingTasks[0].id;
        query.taskIds = [taskId];
      } else {
        overrideToZero = true;
      }

    }

    if(inputs.startDate){
      let start = Date.parse(inputs.startDate);
      query.exifTimestamp = { '>=': start };
    }

    if(inputs.endDate){
      let end = Date.parse(inputs.endDate) + (1000 * 60 * 60 * 24);
      if(typeof(query.exifTimestamp) == 'undefined'){
        query.exifTimestamp = {};
      }
      query.exifTimestamp['<='] = end;
    }

    const {latMin, latMax, longMin, longMax} = inputs;
    Images.addGpsQueryFilter(latMin, latMax, longMin, longMax, query);

    let cmd = {
      where : query,
      sort : 'exifTimestamp ASC'
    };
    skip = 0
    if(inputs.subsetStart && inputs.subsetStart > 1){
      skip = inputs.subsetStart - 1;
      cmd.skip = skip;
    }


    if(inputs.subsetEnd){
      let limit = inputs.subsetEnd - skip > 0 ? inputs.subsetEnd - skip: 0;
      cmd.limit = limit;

    }

    //If user didn't enter any wicMin/wicMax, set it to -99999999/99999999 
    //because Infinity/Number.MAX_VALUE will cause some errors here
    if(!inputs.wicMin && inputs.wicMin !== 0){
      inputs.wicMin = -99999999;
    }

    if(!inputs.wicMax && inputs.wicMax !== 0){
      inputs.wicMax = 99999999;
    }

    if(inputs.wicMin || inputs.wicMin === 0){
      inputs.wicMin = parseFloat(inputs.wicMin);
    }

    if(inputs.wicMax || inputs.wicMax === 0){
      inputs.wicMax = parseFloat(inputs.wicMax);
    }

    imageCount = 0;
    if(!overrideToZero){
      let imagesFound = await Images.find(cmd);
      imagesFound = await Images.filterByLabels(imagesFound, labels);
      imagesFound = await Images.filterByWic(imagesFound, inputs.wicMin, inputs.wicMax);
      imageCount = imagesFound.length;
    }

    return exits.success({
      imageCount : imageCount
    });
  }


};
