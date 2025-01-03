const fs = require('fs');
const path = require('path');
const csvString = require('csv-string'); 

module.exports = async function (req, res) {
    try {
      const filePath = path.join('/data/test', 'externalreference.csv'); 

      if (!fs.existsSync(filePath)) {
        return res.status(404).send({ error: 'CSV not found' });
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8'); 

      const rows = csvString.parse(fileContent); 

      const headers = rows[0];
      const data = rows.slice(1).map((row) => {
        return headers.reduce((obj, header, index) => {
          obj[header.trim()] = row[index] ? row[index].trim() : null;
          return obj;
        }, {});
      });

      return res.json({ data });

    } catch (err) {
      return res.status(500).send({ error: 'internal error', details: err.message });
    }
  
};
