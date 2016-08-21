var async = require('async');
var dbPool = require('../models/common').dbPool;

function findByEmail(email, callback) {
  var sql = 'SELECT id, name, email, password FROM customer WHERE email = ?';

  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);
    conn.query(sql, [email], function (err, results) {
      conn.release();
      if (err) {
        return callback(err);
      }
      if (results.length === 0) {
        return callback(null, null);
      }
      callback(null, results[0]);
    })
  });
}

function verifyPassword(password, hashPassword, callback) {
  var sql = 'SELECT SHA2(?, 512) password';

  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);
    conn.query(sql, [password], function (err, results) {
      conn.release();
      if (err) {
        return callback(err);
      }
      if (results[0].password !== hashPassword) {
        return callback(null, false)
      }
      callback(null, true);
    });
  });
}

function findCustomer(customerId, callback) {
  var sql = 'SELECT id, name, email, facebookid FROM customer WHERE id = ?';

  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);
    conn.query(sql, [customerId], function (err, results) {
      conn.release();
      if (err) {
        return callback(err);
      }
      var user = {};
      user.id = results[0].id;
      user.name = results[0].name;
      user.email = results[0].email;
      user.facebookid = results[0].facebookid;
      callback(null, user);
    });
  });
}

function findOrCreate(profile, callback) {
  var sql_facebookid = "select id, name, email, facebookid " +
                       "from customer " +
                       "where facebookid = ?";
  var sql_insert_facebookid = "insert into customer(name, email, facebookid) " +
                              "value (?, ?, ?)";

  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);
    conn.query(sql_facebookid, [profile.id], function (err, results) {
      if (err) {
        conn.release();
        return callback(err);
      }
      if (results.length !== 0) {
        conn.release();
        var user = {};
        user.id = results[0].id;
        user.name = results[0].name;
        user.email = results[0].email;
        user.facebookid = results[0].facebookid;
        return callback(null, user);
      }
      conn.query(sql_insert_facebookid, [profile.displayName, profile.emails[0].value, profile.id], function (err, result) {
        conn.release();
        if (err) {
          return callback(err);
        }
        var user = {};
        user.id = result.insertId;
        user.name = profile.displayName;
        user.email = profile.emails[0].value;
        user.facebookid = profile.id;
        return callback(null, user);
      });
    });
  });
}

function registerCustomer(newCustomer, callback) {
  var sql = 'insert into customer(name, email, password) ' +
      'values(?, ?, sha2(?, 512))';

  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);
    conn.query(sql, [newCustomer.name, newCustomer.email, newCustomer.password], function (err, result) {
      conn.release();
      if (err) {
        return callback(err);
      }
      callback(null, result);
    });
  });
}

function updateCustomer(customer, callback) {
  var sql = 'update customer ' +
      'set password = sha2(?, 512) ' +
      'where id = ?';

  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);
    conn.query(sql, [customer.password, customer.cid], function (err, result) {
      conn.release();
      if (err) {
        return callback(err);
      }
      callback(null, result);
    });
  });
}

function listCustomers(pageNo, rowCount, callback) {
  var sql = 'select name, email ' +
      'from customer ' +
      'order by id ' +
      'limit ?, ?';

  dbPool.getConnection(function(err, conn) {
    if (err) return callback(err);
    conn.query(sql, [rowCount * (pageNo - 1), rowCount], function (err, results) {
      conn.release();
      if (err) {
        return callback(err);
      }
      callback(null, results);
    });
  });
}

module.exports.findCustomer = findCustomer;
module.exports.registerCustomer = registerCustomer;
module.exports.updateCustomer = updateCustomer;
module.exports.listCustomers = listCustomers;
module.exports.findByEmail = findByEmail;
module.exports.verifyPassword = verifyPassword;
module.exports.findOrCreate = findOrCreate;
