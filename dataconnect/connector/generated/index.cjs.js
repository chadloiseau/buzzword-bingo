const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'default',
  service: 'aisandbox',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const seedDataRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SeedData');
}
seedDataRef.operationName = 'SeedData';
exports.seedDataRef = seedDataRef;

exports.seedData = function seedData(dc) {
  return executeMutation(seedDataRef(dc));
};

const listUsersRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListUsers');
}
listUsersRef.operationName = 'ListUsers';
exports.listUsersRef = listUsersRef;

exports.listUsers = function listUsers(dc) {
  return executeQuery(listUsersRef(dc));
};

const getBingoCardRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetBingoCard', inputVars);
}
getBingoCardRef.operationName = 'GetBingoCard';
exports.getBingoCardRef = getBingoCardRef;

exports.getBingoCard = function getBingoCard(dcOrVars, vars) {
  return executeQuery(getBingoCardRef(dcOrVars, vars));
};
