var express = require('express');
var router = express.Router();
var Customer = require('../models/customer');

// 회원 조회
router.get('/:cid', function(req, res, next) {
  console.log(req.user);
  var cid = req.params.cid;

  Customer.findCustomer(cid, function(err, result) {
    if (err) {
      return next(err);
    }
    res.send({
      message: '회원 조회',
      data: result
    });
  });
});

// 회원 생성
router.post('/', function(req, res, next) {
  var newCustomer = {};
  newCustomer.name = req.body.name;
  newCustomer.email = req.body.email;
  newCustomer.password = req.body.password;

  Customer.registerCustomer(newCustomer, function(err, result) {
    if (err) {
      return next(err);
    }
    res.send({
      message: 'Customer no: ' + result.insertId,
      data: result
    });
  });
});

// 회원 목록
router.get('/', function(req, res, next) {
  // querystring : 페이지 카운트
  var pageNo = parseInt(req.query.pageNo, 10);
  var rowCount = parseInt(req.query.rowCount, 10);
  // Customer 모델 연결
  Customer.listCustomer(pageNo, rowCount, function(err, customers) {
    if (err) {
      return next(err);
    }
    res.send({
      message: '회원 목록',
      data: customers
    });
  });
});

// 회원 변경
router.put('/:cid', function(req, res, next) {
  var customer = {};
  customer.cid = req.params.cid;
  customer.password = req.body.password;

  Customer.updateCustomer(customer, function(err, result) {
    if (err) {
      return next(err);
    }
    res.send({
      message: customer.cid + ', update customer',
      result: result
    });
  });
});

module.exports = router;
