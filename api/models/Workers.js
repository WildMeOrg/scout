module.exports = {
  attributes: {
    name: { type: 'string', required: true },
    statusString: { type: 'string', defaultsTo: 'none'},
    statusNumber:  { type: 'number', defaultsTo : 0},
    statusBoolean:  { type: 'boolean', defaultsTo : false}
  }
};
