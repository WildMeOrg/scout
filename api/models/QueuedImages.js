module.exports = {
  attributes: {
    imageId: { type: 'string', required: true },
    taskId: { type: 'string', required: true },
    annotationComplete : {type : 'boolean', defaultsTo: false},
    annotationError:  { type: 'string' }
  },

    deleteForImage: async function(imageId) {
console.log('deleted QueuedImage for imageId=%o', imageId);
    }
};
