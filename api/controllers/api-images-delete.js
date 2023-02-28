module.exports = {


  friendlyName: 'Images delete',


  description: 'Delete images',


  inputs: {
    imageIds : {
      type : ['string'],
      required : true
    }
  },


  exits: {
    success: {
      statusCode: 204,
      description: 'Images deleted.'
    },
    validationFailed: {
      statusCode: 400,
      description: 'There was an error processing the request, see JSON attached.'
    }
  },


  fn: async function (inputs,exits) {
    //this.req.image;

    if(this.req.session.userRole !== 'admin'){
      this.res.forbidden();
    }

    if (!inputs.imageIds.length) throw Error('must provided at least one image id');

    let ct = 0;
    for (const imageId of inputs.imageIds) {
        ct++;
        let res = await Images.deleteCascade(imageId);
        console.debug('%d) api FINISHED deleted Image >>> %o -> %o', ct, imageId, res);
    }

    return exits.success({});





  }


};
