var express = require('express');
var router = express.Router();
var formidable = require('formidable');
var path = require('path');
var Menu = require('../models/menu');
var async  = require('async');
var isAuthenticated = require('./common').isAuthenticated;


// 메뉴 조회
router.get('/:mid', function(req, res, next) {
  var menuId = req.params.mid;

  Menu.findMenu(menuId, function(err, menu) {
    if (err) return next(err);
    res.send({
      message: 'show menu(' + menuId + ')',
      menu: menu
    });
  });
});

// 메뉴 생성
router.post('/', isAuthenticated, function(req, res, next) {
  var form = new formidable.IncomingForm();
  form.uploadDir = path.join(__dirname, '../uploads/images/menus');
  form.keepExtensions = true;
  form.multiples = true;
  form.parse(req, function(err, fields, files) {
    if(err) return next(err);
    var menu = {};
    menu.name = fields.menu_name;
    menu.price = parseInt(fields.price, 10);
    menu.files = [];

    var message = '';
    /* files.photos가 Array일 경우 */
    if(files.photos instanceof Array) {
      message = 'create menu with files';

      async.each(files.photos, function(item, done) {
        menu.files.push({
          path: item.path,
          name: item.name
        });
        done(null);
      }, function(err) {
        if(err) return next(err);
      });
    } else if (files.photos) {
      message = 'create menu with a file';

      menu.files.push({
        path: files.photos.path,
        name: files.photos.name
      });
    } else {
      message = 'create menu without a file';
    }

    Menu.createMenu(menu, function(err, result) {
      if(err) return next(err);
      menu.id = result;
      res.send({
        message: message,
        menu: menu
      });
    });
  });
});

// 메뉴 목록
router.get('/', function(req, res, next) {
  // querystring : 페이지 카운트
  var pageNo = parseInt(req.query.pageNo, 10) || 1;
  var rowCount = parseInt(req.query.rowCount, 10) || 10;

  Menu.listMenu(pageNo, rowCount, function(err, menus) {
    if (err) {
      return next(err);
    }
    res.send({
      message: 'list menus',
      data: menus
    });
  });
});

// 메뉴 변경
router.put('/:mid', isAuthenticated, function(req, res, next) {
  var menuId = req.params.mid;
  var form = new formidable.IncomingForm();
  form.uploadDir = path.join(__dirname, '../uploads/images/menus');
  form.keepExtensions = true;
  form.multiples = true;
  form.parse(req, function(err, fields, files) {
    if(err) return next(err);
    var menu = {};
    menu.id = menuId;
    menu.files = [];

    var message = '';
    /* files.photos가 Array일 경우 */
    if(files.photos instanceof Array) {
      message = 'update menu('+ menuId +') with files';

      async.each(files.photos, function(item, done) {
        menu.files.push({
          path: item.path,
          name: item.name
        });
        done(null);
      }, function(err) {
        if(err) return next(err);
      });
    } else if (files.photos) {
      message = 'update menu('+ menuId +') with a file';

      menu.files.push({
        path: files.photos.path,
        name: files.photos.name
      });
    } else {
        res.send({ message: '1개 이상 메뉴 이미지를 등록하세요!!' });
    }

    Menu.updateMenu(menu, function(err, results) {
      if(err) return next(err);

      res.send({
        message: message,
        results: {
            originalFile: results[0] + ' remove',
            fileTable: results[1] + ' row remove',
            insertId: results[2]
        }
      });
    });
  });
});


// 메뉴 삭제
router.delete('/:mid', isAuthenticated, function(req, res, next) {
  var menuId = req.params.mid;

  Menu.removeMenu(menuId, function(err, results) {
    if (err) {
      return next(err);
    }
    res.send({
        message: 'delete menu(' + req.params.mid + ')',
        results: {
            originalFile: results[0] + ' remove',
            fileTable: results[1] + ' row remove',
            menuTable: results[2] + ' row remove'
        }
    });
  });
});

module.exports = router;
