module.exports = {
  attributes: {
    role: { type: 'string', required: true },
    username: { type: 'string', required: true, unique: true },
    displayUsername : { type: 'string', required: true },
    passwordHash : { type: 'string', required: true }
  }
};
