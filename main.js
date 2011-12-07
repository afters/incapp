var request = require('request'),
  fs = require('fs');

var jsonifyConf = function (jsConf) {
  var jsonConf = {
    source: jsConf.source,
    map: jsConf.map.toString(),
    reduces: {}
  }
  var reduceName, reduceInfo;
  for (reduceName in jsConf.reduces) {
    reduceInfo = jsConf.reduces[reduceName];
    jsonConf.reduces[reduceName] = {
      fn: reduceInfo.fn.toString(),
      group_levels: reduceInfo.group_levels
    }
  }
  return jsonConf;
}


var dirToJsonConf = function (appPath) {
  var jsonConf;
  try {
    jsonConf = {
      source: fs.readFileSync(appPath + '/source', 'utf8').replace(/(\r?\n)+$/, ''),
      map: fs.readFileSync(appPath + '/map.js', 'utf8'),
      reduces: (function () {
        var reduces = {};
        var reduceDirs = fs.readdirSync(appPath + '/reduces');
        reduceDirs.forEach( function (reduceName) {
          var reducePath = appPath + '/reduces/' + reduceName;
          reduces[reduceName] = {
            "fn": fs.readFileSync(reducePath + '/fn.js', 'utf8'),
            group_levels: JSON.parse(fs.readFileSync(reducePath + '/group_levels', 'utf8'))
          };
        });
        return reduces;
      }())
    };
  }
  catch (e) {
    throw e;
  }
  return jsonConf;
}

// opts: 
//  jsonConf - JSON object
//  incarnatorUrl - string
//  force - boolean
var deploy = function (opts, cb) {

  var incarnatorUrl = opts.incarnatorUrl;
  var force = opts.force || false;
  var jsonConf = opts.jsonConf;
  
  var putNewConf = function () {
    request({
        method: 'PUT',
        uri: incarnatorUrl,
        body: JSON.stringify(jsonConf)
      },
      function (err, res) {
        if (err || res.statusCode !== 201) {
          cb(new Error());
          return;
        }
        cb();
      }
    );
  }
  try {
    if (force) {
      putNewConf();
      return;
    }
    request({
        method: 'GET',
        uri: incarnatorUrl
      },
      function (err, res, state) {
        if (err || (res.statusCode !== 200 && res.statusCode !== 404)) {
          cb(new Error());
          return;
        }

        var equalJsons = function (a, b) {
          var serialize = JSON.stringify;
          return serialize(a) === serialize(b);
        }

        if (equalJsons(jsonConf, JSON.parse(state).conf)) {
          cb();
          return;
        }
        putNewConf();
      }
    );
  }
  catch (e) {
    cb(new Error());
  }
}

exports.jsonifyConf = jsonifyConf;
exports.dirToJsonConf = dirToJsonConf;
exports.deploy = deploy;

