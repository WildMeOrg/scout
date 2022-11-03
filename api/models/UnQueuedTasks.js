module.exports = {
  attributes: {
    filterName: { type: 'string'},
    filterSource: { type: 'string' },
    filterDateStart: { type: 'string'},
    filterDateEnd: { type: 'string'},
    filterSubsetStart: { type: 'number'},
    filterSubsetEnd: { type: 'number'},
    filteredImageCount: { type: 'number', required: true },
    taskId: { type: 'string', required: true }
  }
};
