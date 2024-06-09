module.exports = {
  attributes: {
    filterName: { type: 'string'},
    filterLabels: { type: 'json', columnType : 'array' },
    filterSource: { type: 'string' },
    filterDateStart: { type: 'string'},
    filterDateEnd: { type: 'string'},
    filterLatMin: { type: 'string'},
    filterLatMax: { type: 'string'},
    filterLongMin: { type: 'string'},
    filterLongMax: { type: 'string'},
    filterSubsetStart: { type: 'number'},
    filterSubsetEnd: { type: 'number'},
    filterWicMin: { type: 'number'},
    filterWicMax: { type: 'number'},
    filteredImageCount: { type: 'number', required: true },
    taskId: { type: 'string', required: true }
  }
};
