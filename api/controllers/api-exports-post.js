const {resolve} = require("path");
const fs = require('fs');
module.exports = {


  friendlyName: 'Exports create',


  description: '',


  inputs: {
    filters : {
      type : {},
      description : 'the filters used to generate the search results on the task page',
      required : true
    },
    type : {
      type : 'string',
      description : 'Either annotations or images',
      required : true
    }
  },


  exits: {
    success: {
      statusCode: 200,
      description: 'The export is being generated.'
    },
    validationFailed: {
      statusCode: 400,
      description: 'There was an error processing the request, see JSON attached.'
    }
  },


  fn: async function (inputs,exits) {

    if(this.req.session.userRole !== 'admin'){
      return exits.forbidden();
    }


    // Name and filepath
    let fileName = 'export-csv-'+inputs.type+'-'+Date.now();
    let settingsObject = sails.config.settings;
    let dir = resolve(settingsObject.imageDirectory+'/'+settingsObject.hiddenDirectory+'/exports/');


    // @TODO remove this, as it's covered in app.js for new installations. Only here so we don't break the QA machine during testing
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }


    // Create the export
    let exportData = {
      type : inputs.type,
      fullPath : resolve(dir+'/'+fileName+'.csv'),
      userId : this.req.session.userId,
      filters : inputs.filters
    };

    let newExport = await Exports.create(exportData).fetch();
    if(!newExport){
      throw Error('Unknown error occured');
    }

    return exits.success(newExport);





  }


};
