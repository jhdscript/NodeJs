var fs = require('fs'),
  path = require('path'),
  crypto = require('crypto'),
  algorithm = 'aes-128-ctr',
  password = 'd6F3Efeq';

var crypter = {};

crypter.encryptText = function encryptText(text) {
  var cipher = crypto.createCipher(algorithm, password);
  var crypted = cipher.update(text, 'utf8', 'hex');
  crypted += cipher.final('hex');
  return crypted;
};

crypter.decryptText = function decryptText(text) {
  var decipher = crypto.createDecipher(algorithm, password);
  var dec = decipher.update(text, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
};

crypter.encryptFile = function encryptFile(filepath, destpath) {
  // input file
  var r = fs.createReadStream(filepath);

  // encrypt content
  var encrypt = crypto.createCipher(algorithm, password);

  // write file
  var w = fs.createWriteStream(destpath);

  // start pipe
  r.pipe(encrypt).pipe(w);
};

crypter.decryptFile = function decryptFile(filepath, destpath) {
  // input file
  var r = fs.createReadStream(filepath);

  // decrypt content
  var decrypt = crypto.createDecipher(algorithm, password);

  // write file
  var w = fs.createWriteStream(destpath);

  // start pipe
  r.pipe(decrypt).pipe(w);
};

crypter.decryptFilePipe = function decryptFilePipe(filepath, res) {
  var r = fs.createReadStream(filepath);

  // decrypt content
  var decrypt = crypto.createDecipher(algorithm, password);

  // start pipe
  r.pipe(decrypt).pipe(res);
};

crypter.getFoldersAndFilesRecursive = function getFoldersAndFilesRecursive(dirpath) {
  var ret = null;
  if (fs.existsSync(dirpath)) {
    if (fs.lstatSync(dirpath).isDirectory()) {
      var d = {
        "type": 0,
        "path": dirpath,
        "children": []
      };
      fs.readdirSync(dirpath).forEach(function(file, index) {
        var curPath = path.join(dirpath, file);
        if (fs.lstatSync(curPath).isDirectory()) {
          d['children'].push(crypter.getFoldersAndFilesRecursive(curPath));
        } else {
          d['children'].push({
            "type": 1,
            "path": curPath
          });
        }
      });
      ret = d;
    } else {
      var d = {
        "type": 1,
        "path": dirpath
      };
      ret = d;
    }
  }
  return ret;
};

crypter.encryptAll = function encryptAll(o, destpath) {
  if (!o) {
    return;
  }
  var basename = crypter.encryptText(path.basename(o.path));
  var newdestpath = path.join(destpath, basename);
  if (o.type === 0) {
    fs.mkdirSync(newdestpath);
    for (var i = 0; i < o.children.length; i++) {
      crypter.encryptAll(o.children[i], newdestpath);
    }
  } else {
    crypter.encryptFile(o.path, newdestpath);
  }
};

crypter.decryptAll = function decryptAll(o, destpath) {
  if (!o) {
    return;
  }
  var basename = crypter.decryptText(path.basename(o.path));
  var newdestpath = path.join(destpath, basename);
  if (o.type === 0) {
    fs.mkdirSync(newdestpath);
    for (var i = 0; i < o.children.length; i++) {
      crypter.decryptAll(o.children[i], newdestpath);
    }
  } else {
    crypter.decryptFile(o.path, newdestpath);
  }
};

crypter.listAll = function listAll(o, destpath) {
  var ret = [];
  if (o) {
    var basename = path.basename(o.path);
    try {
      basename = crypter.decryptText(path.basename(o.path));
    } catch (e) {}

    var newdestpath = path.join(destpath, basename);
    if (o.type === 0) {
      ret.push({
        "type": 0,
        "crypted": o.path,
        "decrypted": newdestpath
      });
      for (var i = 0; i < o.children.length; i++) {
        ret = ret.concat(crypter.listAll(o.children[i], newdestpath));
      }
    } else {
      ret.push({
        "type": 1,
        "crypted": o.path,
        "decrypted": newdestpath
      });
    }
  }
  return ret;
};

module['exports'] = crypter;

/*****************************
 *        USE SAMPLE          *
 *****************************/
//var crypter = require('./crypter.js');

/* Crypt Folder */
//var o = crypter.getFoldersAndFilesRecursive("C:\\_temp");
//crypter.encryptAll(o, "C:\\_out");

/* Decrypt Folder */
//var oo = crypter.getFoldersAndFilesRecursive("C:\\_out\\360cf8e630");
//crypter.decryptAll(oo, "C:\\_out");

/* Crypt File */
//var o = crypter.getFoldersAndFilesRecursive("C:\\_out\\_temp\\test\\a.avi");
//crypter.encryptAll(o, "C:\\_out");

/* Decrypt File */
//var oo = crypter.getFoldersAndFilesRecursive("C:\\_out\\0856fcfd29");
//crypter.decryptAll(oo, "C:\\_out");

/* List Folder */
//var ooo = crypter.getFoldersAndFilesRecursive("C:\\_out\\360cf8e630");
//var l = crypter.listAll(ooo, "C:\\_out");
//console.log(l);