module.exports = {
  attributes: {
    taskId: { type: 'string', required: true },
    imageId: { type: 'string', required: true },
    username: { type: 'string', required: true},
    userId: { type: 'string', required: true},
    boundingBoxes : { type: 'json', columnType : "array" }
  },

    deleteForImage: async function(imageId) {
console.log('deleted GroundTruths for imageId=%o', imageId);
    }
};
