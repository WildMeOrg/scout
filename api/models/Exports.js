module.exports = {
  attributes: {
    type: { type: 'string', required : true },
    fileType: { type: 'string', defaultsTo: "csv" },
    fullPath: { type: 'string', required : true },
    userId: { type: 'string', required: true},
    isQueued : { type : 'boolean', defaultsTo : false},
    progress :  { type: 'number', defaultsTo: 0},
    filters :  { type: 'json', columnType: 'array', required: true}
  }
};
