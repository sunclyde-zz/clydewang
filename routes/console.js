var express = require('express');
var router = express.Router();
var util = require('../app/util/util');
var Page = require('../app/core/Page');
var UserMgr = require('../app/core/UserMgr');
var PreferenceMgr = require('../app/core/PreferenceMgr');
var page = new Page();

/* filter */
router.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

router.use(function (req, res, next) {
    try {
        initSession(req);

        var noLoginPath = [
                '/console',
                '/console/login',
                '/console/register'
            ], inPath = false,
            path = null,
            err = null;

        if (!!!req.session.authenticated) {
            for (var i = 0; i < noLoginPath.length; i++) {
                path = noLoginPath[i];
                if (!util.empty(path) && (path == req.originalUrl)) {
                    inPath = true;
                    break;
                }
            }
            console.log('not in path? ' + !inPath);
            if (!inPath) {
                err = new Error('Not authenticated');
                err.status = 401;
                next(err);
            } else {
                next();
            }
        } else {
            console.log('authenticated');
            next();
        }
    } catch (e) {
        console.log(e);
    }
});

/* GET console */
router.get('/', function (req, res, next) {
    if (!!!req.session.authenticated) {
        res.redirect('/console/login');
    } else {
        page = new Page();
        page.ns = 'console';
        page.params['username'] = req.session.username;
        res.render('console/console', {page: page});
    }
});

/* GET login */
router.get('/login', function (req, res, next) {
    page = new Page();
    page.ns = 'console-login';
    res.render('console/login', {page: page});
});

/* GET logout */
router.get('/logout', function (req, res, next) {
    req.session.authenticated = false;
    req.session.username = "";
    res.redirect('/console/login');
});

/* POST login */
router.post('/login', function (req, res, next) {
    page = new Page();
    page.ns = 'console-login';
    UserMgr.UserModel.findOne(req.body, function (err, result) {
        if (result != null) {
            console.log('user ' + result.login + ' logged in');
            req.session.authenticated = true;
            req.session.username = result.login;
            res.redirect('/console');
        } else {
            page.params['formMessage'] = 'Username and Password not match, please try again.';
            req.session.authenticated = false;
            req.session.username = "";
            res.render('console/login', {page: page});
        }
    });
});

/* GET register */
router.get('/register', function (req, res, next) {
    page = new Page();
    page.ns = 'console-register';
    res.render('console/register', {page: page});
});

/* POST register */
router.post('/register', function (req, res, next) {
    page = new Page();
    page.ns = 'console-register';
    var UserModel = UserMgr.UserModel;
    var user = new UserModel(req.body);
    user.save(function (err) {
        if (err) {
            req.session.authenticated = false;
            res.render('console/register', {page: page});
        } else {
            req.session.authenticated = true;
            res.redirect('/console');
        }
    });
});

/* GET datatable */
router.get('/datatable', function (req, res, next) {
    page = new Page();
    page.ns = 'datatable';

    PreferenceMgr.PreferenceGroupModel.find({}, function (err, result) {
        if (result != null) {
            page.params['tables'] = result;
        } else {
            page.params['tables'] = [];
        }
        res.render('console/datatable', {page: page});
    });

});

/* GET preference */
router.get('/preference', function (req, res, next) {
    page = new Page();
    page.ns = 'preference';
    res.render('console/preference', {page: page});
});

/* common functions */
function initSession(req) {
    req.session.type = "console";
}

module.exports = router;
