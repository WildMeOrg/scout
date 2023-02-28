module.exports = {
  attributes: {
    imageId: { type: 'string', required: true },
    taskId: { type: 'string', required: true },
    annotationComplete : {type : 'boolean', defaultsTo: false},
    annotationError:  { type: 'string' }
  },

    deleteForImage: async function(imageId) {
        let deleted = await QueuedImages.destroy({imageId: imageId}).fetch();
        console.log('- destroyed QueuedImages %o', deleted);
    }
};
