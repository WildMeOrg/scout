module.exports = {
  attributes: {
    name: { type: 'string', required: true, unique: true },
    hotKey: { type: 'string' },
    source: {type: 'string', } // ml or lab lead
  },

  // hard-coded (for now?)
  getMLLabels: async function() {
    
  },   

  getCustomLabels: async function() {
    let labels = await Labels.find({});    
    return labels;
  },

  getAllLabels: async function() {
    let labels = await Labels.find({});    
    return labels;
  },   

  createMLLabel: async function() {
    let newLabel = {};
    [
      'buffalo',
      'camel',
      'canoe',
      'car',
      'cow',
      'crocodile',
      'eland',
      'elephant',
      'gazelle_grants',
      'gazelle_thomsons',
      'gerenuk',
      'giant_forest_hog',
      'giraffe',
      'goat',
      'hartebeest',
      'hippo',
      'impala',
      'kob',
      'kudu',
      'motorcycle',
      'oribi',
      'oryx',
      'ostrich',
      'roof_grass',
      'roof_mabati',
      'sheep',
      'topi',
      'vehicle',
      'warthog',
      'waterbuck',
      'white_bones',
      'wildebeest',
      'zebra'
    ].forEach(async data => {newLabel = await Labels.create({ name: data, source: "ml" }).fetch()})
    return newLabel;
  }
};
