
module.exports = {


  friendlyName: 'CSV Files GET',


  description: 'Serve CSVs from the filesystem',


  inputs: {
    csvid : {
      type : 'string',
      description : 'The id of the csv',
      required : true
    }
  },


  exits: {
    success: {
      statusCode: 200,
      description: 'The csv was found. Payload attached.'
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

    let csvs = await Exports.find({'id' : inputs.csvid});

    if(csvs.length == 0){
      return exits.notFound();
    } else {
      // Feed the image into a buffer
      this.res.download(csvs[0].fullPath, 'scout-export-'+csvs[0].type+'.csv');

    }
  }


};
