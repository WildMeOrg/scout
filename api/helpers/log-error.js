module.exports = {


  friendlyName: 'Log an error',


  description: '',


  inputs: {
    stackTrace : {
      type : 'string'
    },
    context : {
      type : 'string'
    }

  },

  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs, exits) {

      let logValues = {
        stackTrace : inputs.stackTrace || '',
        context : inputs.context || ''
      };

      let newError = await Errors.create(logValues).fetch();
      if(!newError){
        throw Error('Unknown error occured');
      } 

      return exits.success({});


  }


};
