
module.exports = {


  friendlyName: 'Uploads GET',


  description: 'Serve images from the filesystem',


  inputs: {
    imageid : {
      type : 'string',
      description : 'The id of the image',
      required : true
    }
  },


  exits: {
    success: {
      statusCode: 200,
      description: 'The image was found. Payload attached.'
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

    let images = await Images.find({'id' : inputs.imageid});

    if(images.length == 0){
      return exits.notFound();
    } else {
      // Feed the image into a buffer
      this.res.sendFile(images[0].fullPath);
      
    }
  }


};
