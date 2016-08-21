/**
 * Created by Tacademy on 2016-08-18.
 */
var async = require('async');
var dbPool = require('../models/common').dbPool;
var path = require('path');
var url = require('url');
var fs = require('fs');

module.exports.findMenu = function(menuId, callback) {
    var sql_select_menu = 'select id, name, price from menu where id = ?';
    var sql_select_file = 'select filename, filepath from file where menu_id = ?';

    dbPool.getConnection(function(err, conn) {
        if (err) return callback(err);

        var menu = {};
        async.parallel([selectMenu, selectFile], function(err, results) {
            if (err) {
                conn.release();
                return callback(err);
            }
            console.log(results);
            menu.id = results[0][0].id;
            menu.name = results[0][0].name;
            menu.price = results[0][0].price;
            menu.file = [];
            // result[1]에 대한 async.each 적용
            async.each(results[1], function(item, done) {
                var filename = path.basename(item.filepath);
                menu.file.push({
                    originalFilename: item.filename,
                    fileUrl: url.resolve('http://localhost:3000', '/images/' + filename)
                });
                done(null);
            }, function(err) {
                if (err) return callback(err);
                conn.release();
                callback(null, menu);
            });
        });

        function selectMenu(done) {
            conn.query(sql_select_menu, [menuId], function(err, results) {
                if (err) return done(err);
                done(null, results);
            });
        }

        function selectFile(done) {
            conn.query(sql_select_file, [menuId], function(err, results) {
                if (err) return done(err);
                done(null, results);
            });
        }
    });
};

module.exports.createMenu = function(menu, callback) {
    var sql_insert_menu = 'insert into menu(name, price) values (?, ?)';
    var sql_insert_file = 'insert into file(menu_id, filename, filepath) values (?, ?, ?)';

    var menu_id;
    dbPool.getConnection(function(err, conn) {
        conn.beginTransaction(function (err) {
            if (err) {
                conn.release();
                return callback(err);
            }
            async.series([insertMenu, insertFile], function (err) {
                if (err) {
                    return conn.rollback(function () {
                        callback(err);
                        conn.release();
                    });
                }
                conn.commit(function () {
                    callback(null, menu_id);
                    conn.release();
                });
            });
        });
        function insertMenu(done) {
            conn.query(sql_insert_menu, [menu.name, menu.price], function(err, result) {
                if (err) return done(err);
                menu_id = result.insertId;
                done(null);
            });
        }

        function insertFile(done) {
            async.each(menu.files, function (item, cb) {
                conn.query(sql_insert_file, [menu_id, item.name, item.path], function (err, result) {
                    if (err) return cb(err);
                    cb(null);
                });
            }, function (err) {
                if (err) return done(err);
                done(null);
            });
        }
    });
};

module.exports.listMenu = function(pageNo, rowCount, callback) {
    var sql = 'select id, name, price ' +
        'from menu ' +
        'order by id ' +
        'limit ?, ?';

    dbPool.getConnection(function(err, conn) {
        if (err) return callback(err);
        conn.query(sql, [rowCount * (pageNo - 1), rowCount], function (err, results) {
          if (err) {
            conn.release();
            return callback(err);
          }
          callback(null, results);
          conn.release();
        });
    });
};

module.exports.updateMenu = function(menu, callback) {
    sql_select_filepath = 'select filepath from file where menu_id = ?';
    sql_delete_file = 'delete from file where menu_id = ?';
    sql_insert_file = 'insert into file(menu_id, filename, filepath) values (?, ?, ?)';

    dbPool.getConnection(function(err, conn) {
        if (err) return callback(err);

        conn.beginTransaction(function (err) {
            if (err) {
                conn.release();
                return callback(err);
            }
            async.series([deleteOriginalFile, deleteFile, insertFile], function (err, results) {
                if (err) {
                    return conn.rollback(function () {
                        callback(err);
                        conn.release();
                    });
                }
                conn.commit(function () {
                    callback(null, results);
                    conn.release();
                });
            });
        });

        function deleteOriginalFile(done) {
            conn.query(sql_select_filepath, [menu.id], function(err, results) {
                if (err) return done(err);

                async.each(results, function(item, cb) {
                    fs.unlink(item.filepath, function (err) {
                        if (err) return cb(err);
                        cb(null);
                    });
                }, function(err) {
                    if (err) return done(err);
                    done(null, results.length);
                });
            });
        }
        function deleteFile(done) {
            conn.query(sql_delete_file, [menu.id], function(err, result) {
                if (err) return done(err);
                done(null, result.affectedRows);
            });
        }
        function insertFile(done) {
            var insertId = [];
            async.each(menu.files, function (item, cb) {
                conn.query(sql_insert_file, [menu.id, item.name, item.path], function (err, result) {
                    if (err) return cb(err);
                    insertId.push(result.insertId);
                    cb(null);
                });
            }, function (err) {
                if (err) return done(err);
                done(null, insertId);
            });
        }
    });
};

module.exports.removeMenu = function(menuId, callback) {
    sql_select_filepath = 'select filepath from file where menu_id = ?';
    sql_delete_file = 'delete from file where menu_id = ?';
    sql_delete_menu = 'delete from menu where id = ?';

    dbPool.getConnection(function(err, conn) {
        if (err) return callback(err);

        conn.beginTransaction(function (err) {
            if (err) {
                conn.release();
                return callback(err);
            }
            async.series([deleteOriginalFile, deleteFile, deleteMenu], function (err, results) {
                if (err) {
                    return conn.rollback(function () {
                        callback(err);
                        conn.release();
                    });
                }
                conn.commit(function () {
                    callback(null, results);
                    conn.release();
                });
            });
        });

        function deleteOriginalFile(done) {
            conn.query(sql_select_filepath, [menuId], function(err, results) {
                async.each(results, function(item, cb) {
                    if (err) return cb(err);

                    fs.unlink(item.filepath, function (err) {
                        if (err) return cb(err);
                        cb(null);
                    });
                }, function(err) {
                    if (err) return done(err);
                    done(null, results.length);
                });
            });
        }
        function deleteFile(done) {
            conn.query(sql_delete_file, [menuId], function(err, result) {
                if (err) return done(err);
                done(null, result.affectedRows);
            });
        }
        function deleteMenu(done) {
            conn.query(sql_delete_menu, [menuId], function(err, result) {
                if (err) return done(err);
                done(null, result.affectedRows);
            });
        }
    });
};
