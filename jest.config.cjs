module.exports = {
    transform: {
      "^.+\\.js$": "babel-jest",
    },
    testEnvironment: "node", 
    moduleFileExtensions: ["js", "json", "node"], 
    transformIgnorePatterns: ["stadvdb-mco2-stream-games/node_modules/"],
  };
  