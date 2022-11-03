module.exports = {


  friendlyName: 'Simple Boxes Demo',


  description: '',


  inputs: {

  },


  exits: {
    success: {
      responseType: 'view',
      viewTemplatePath: 'pages/simple-boxes'
    },
  },


  fn: async function (inputs) {


    let randImages = await Images.find({where : {},limit : 2});




    let serverData = {
      secondaryNav : 'simpleBoxes',
      img1 : randImages[0],
      img2 : randImages[1]
    };
    let clientData = {
      secondaryNav : 'simpleBoxes',
      img1 : randImages[0],
      img2 : randImages[1],
    };
    let data = await sails.helpers.viewData(this.req,serverData,clientData);
    return data;
  }




};
