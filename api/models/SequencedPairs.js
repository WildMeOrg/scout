module.exports = {
  attributes: {
    taskId: { type: 'string', required: true },
    imageLeftId: { type: 'string', required: true },
    imageRightId: { type: 'string', required: true },
    divisionComplete :  { type: 'boolean', defaultsTo: false },
    index: { type: 'number', required: true}
  },

    deleteForImage: async function(imageId) {
        let deleted = await SequencedPairs.destroy({
            or: [ {imageLeftId: imageId}, {imageRightId: imageId} ]
        }).fetch();
        console.log('- destroyed SequencedPairs %o', deleted);
    }
};
