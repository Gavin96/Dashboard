var ReportConfig = require('../models/ReportConfig');
var DataConnection = require('../models/DataConnection');
var ExternalSystem = require('../models/ExternalSystem');
var _pool = require('./utils/mysql-tool');
var _oracle = require('./utils/oracle-tool');
var passport = require('./utils/passport');
var dailyLog = require('./utils/operationLog');
var async = require('async');
var SECRET_ACCESS = 'YzdiYjNhOTBhYmM3ZmRmMzIxOWIyYjliOGQ2YmU5OWY';
var _ = require('underscore');
var dashboardRouter = require('./dashboardRouter');
var nodeExcel = require('node-xlsx');
var moment = require('moment');
var timezoneHelper = require('./timezoneHelper');
var usageHelper = require('./usageLogHelper');
var queryHelper = require('./queryHelper');

// 预览报表
exports.loadPage = function (req, res) {
    console.log("previewPageLoad");
    var reportId = req.query.id;
    if(!reportId){
        return res.status(404).end();
    }
    var context = {};
    async.auto({
        findReport: function(next){
            ReportConfig.find({_id: reportId}).exec(function(err, docs){
                if(err){
                    console.error(err);
                    next(520);
                }else if(!docs || docs.length == 0){
                    next(404);
                }else{
                    context.reportConfig = docs[0];
                    next();
                }
            });
        }
    }, function(error){
        if(error){
            res.status(error).end();
        }else if(! context.reportConfig.active){
            res.render('errorTpl', {code: '404', description: 'Dashboard is inactive'});
        }else{
            //add passport session
            res.setHeader("Set-Cookie", ["s_sid=" + passport.db_pass_create(req.headers['host']) + ";path=/",
                "filter=;path=/"
            ]);
            if(context.reportConfig.type == 'report'){
                res.render('previewReport', {ReportInfo: context.reportConfig, preview: true});
            }else{
                req.query = {
                    id: context.reportConfig._id
                };
                dashboardRouter.previewDashboard(req, res);
                // res.render('dashboard/viewDashboard', {
                //     dashboardConfig: context.reportConfig,
                //     isPreview:false
                // });
            }
        }
    });
};

// 运行报表
exports.runReport = function (req, res) {
    console.log('run report');
    var code = 0; // 0 success ,1 wrong param or auth problem ,2 server 500
    if (req.query && req.query.sysName && req.query.reportName && req.query.accessKey) {
        ExternalSystem.find({sysName: req.query.sysName}, {}, function (err, docs) {
            if (err) {
                console.log(err);
                code = 2;
            } else if (docs.length != 0) {
                var externalSystem = docs[0];
                ReportConfig.find(
                    {
                        reportName: req.query.reportName,
                        externalSystem: {
                            $elemMatch: {$eq: docs[0]._id}
                        }
                    }).exec(function(err, configs){
                    if(err){
                        console.error(err);
                        res.status(520).end();
                    }else if(!configs || configs.length == 0){
                        res.status(404).end();
                    }else if(!configs[0].active){
                        res.render('errorTpl', {code: '404', description: 'Dashboard is inactive'});
                    }else{
                        var reportConfig = configs[0].toObject();
                        usageHelper.recordUsageLog(req, 'loadDashboardPage', reportConfig, externalSystem);
                        if(reportConfig.type == 'dashboard'){
                            var filterStr = req.param('defaultFilter');
                            if(filterStr){
                                try{
                                    var filterObj = JSON.parse(filterStr);
                                    _.each(filterObj, function(v, k){
                                        if(_.isArray(v)){
                                            filterObj[k] = v.join(',');
                                        }
                                    });
                                    res.render('dashboard/viewDashboard', {ReportInfo:reportConfig, preview: false, filter: filterObj});
                                }catch(e){
                                    res.render('errorTpl', {code: '520', description: e});
                                }
                            }else{
                                res.render('dashboard/viewDashboard', {ReportInfo:reportConfig, preview: false, filter: {}});
                            }
                            return;
                        }
                        DataConnection.find({_id: reportConfig.connection}).exec(function(error, connections){
                            if(error){
                                console.error(error);
                                res.status(520).end();
                            }else if(!configs || configs.length == 0){
                                res.status(404).end();
                            }else{
                                var dataConnection = connections[0];
                                //if (req.headers['host'] == docs[0].ipAddress) {
                                //console.log("ip correct");
                                if (req.query.accessKey == externalSystem.accessKey) {
                                    console.log("key correct");

                                    //add passport session
                                    if (!!req.query.defaultFilter) {
                                        res.setHeader("Set-Cookie", ["s_sid=" + passport.db_pass_create(req.headers['host']) + ";path=/",
                                            "filter=" + passport.base.encode(req.query.defaultFilter) + ";path=/"
                                        ]);
                                    } else {
                                        res.setHeader("Set-Cookie", ["s_sid=" + passport.db_pass_create(req.headers['host']) + ";path=/",
                                            "filter=;path=/"
                                        ]);
                                    }
                                    reportConfig.externalSystemId = externalSystem._id;
                                    res.render('previewReport', {ReportInfo: reportConfig, preview: false});
                                } else {
                                    res.render('errorTpl', {code: '401', description: 'wrong access key'});
                                }
                            }
                        });

                    }
                });
            } else {
                res.render('errorTpl', {code: '401', description: 'wrong system name or report name'});
            }
        });
    } else {
        code = 1;
    }
    //deal errors
    switch (code) {
        case 1:
            res.render('errorTpl', {code: '401', description: 'wrong param or auth problem'});
            break;
        case 2:
            res.render('errorTpl', {code: '500', description: 'server 500'});
            break;
    }
};


function queryDB(dataConnection, sqlObj, sqlTitle, paging, dealData) {
    if (dataConnection.connType == 'database') {
        var dbConfig =
        {
            host: dataConnection.dbAddress.split('/')[0].split(':')[0],
            port: dataConnection.dbAddress.split('/')[0].split(':')[1],
            user: dataConnection.account,
            password: dataConnection.password,
            database: dataConnection.dbAddress.split('/')[1]
        };
        _pool.query(dbConfig, sqlObj, sqlTitle, paging.page, paging.size, dealData);
    } else if (dataConnection.connType == 'oracledatabase') {
        var dbConfig =
        {
            user: dataConnection.account,
            password: dataConnection.password,
            connectString: dataConnection.dbAddress
        };
        _oracle.query(dbConfig, sqlObj, sqlTitle, paging.page, paging.size, dealData);
    }
}

// 纯数据报表查询
exports.getReportData = function (req, res) {
    //post logic: ip - s_sid validate -> get data -> adapt data to grid -> send data
    console.log('get report data');
    var resultJson = {
        status: 0, description: 'success', data: [], count: []   // 0/1 => success/fail
    };

    var clientInfo = passport.getUserInfo(req);
    if (passport.db_access_pass(req.headers['host'], clientInfo['s_sid'])) {
        if (req.body && req.body.connectionId && req.body.reportId && req.body.page && req.body.size) {
            ExternalSystem.find({_id: req.body.externalSystemId}).exec(function(err, systems){
                if(err){
                    return res.status(520).end();
                }
                if(!systems || systems.length == 0){
                    return res.status(404).end();
                }
                var externalSystem = systems[0];
                DataConnection.find({_id: req.body.connectionId}, {}, function (err, docs) {
                    if (err) {
                        resultJson.status = 1;
                        resultJson.description = 'server 500';
                        res.send(resultJson);
                        console.log(err);
                    } else if (docs.length != 0) {
                        var dataConnection = docs[0];
                        ReportConfig.find({
                            _id: req.body.reportId
                        }, {}, function (err, config) {
                            //find config
                            if (err) {
                                resultJson.status = 1;
                                resultJson.description = 'server 500';
                                res.send(resultJson);
                                console.log(err);
                            } else if (config.length != 0) {
                                //push query criteria
                                var sqlObj = [];
                                var sqlTitle = [];

                                if(dataConnection.connType=='database'){
                                    sqlObj.push(_pool.sqlParser(config[0].datasource, externalSystem.params, req.body.data, clientInfo['filter']));
                                }else if(dataConnection.connType=='oracledatabase'){
                                    sqlObj.push(_oracle.sqlParser(config[0].datasource, externalSystem.params, req.body.data, clientInfo['filter']));
                                }
                                sqlTitle.push('data');
                                for (var i = 0; i < config[0].sub.length; i++) {
                                    sqlTitle.push(config[0].sub[i].sequenceNum + '||' + config[0].sub[i].name);
                                    if(dataConnection.connType=='database'){
                                        sqlObj.push(_pool.sqlParser(config[0].sub[i].datasource, externalSystem.params, req.body.data, clientInfo['filter']));
                                    }else if(dataConnection.connType=='oracledatabase'){
                                        sqlObj.push(_oracle.sqlParser(config[0].sub[i].datasource, externalSystem.params, req.body.data, clientInfo['filter']));
                                    }
                                }
                                //validate success ,create dataConnection pool
                                queryDB(dataConnection, sqlObj, sqlTitle, req.body, dealData);
                            }else{
                                resultJson.status = 1;
                                resultJson.description = 'sql wrong';
                                res.send(resultJson);
                            }
                        });
                    } else {
                        resultJson.status = 1;
                        resultJson.description = 'no such connection';
                        res.send(resultJson);
                    }
                });
            });
        } else {
            resultJson.status = 1;
            resultJson.description = 'no such config';
            res.send(resultJson);
        }
    } else {
        resultJson.status = 1;
        resultJson.description = 'auth problem';
        res.send(resultJson);
    }

    function dealData(result) {
        if (result.code == 0) {
            resultJson.data = result.data;
            resultJson.dataRoot = result.dataRoot;
            resultJson.count = result.count;
        } else if (result.code == 1) {
            resultJson.status = 1;
            resultJson.description = 'connection can\'t get';
        } else {
            resultJson.status = 1;
            resultJson.description = 'wrong sql sequence';
        }
        res.send(resultJson);
    }
};



exports.runDashboard = function(req, res){
    var clientInfo = passport.getUserInfo(req);

    var body = req.body;
    if(!body.externalSystemId || !body.reportId || !body.connectionId || !body.panelId){
        return res.status(404).end();
    }
    queryHelper.prepareDoc(body, function(error, docs){
        if(error){
            return res.status(520).end();
        }
        var report = docs.reportConfig.toObject();
        var system = docs.externalSystem.toObject();
        var connection = docs.dataConnection.toObject();
        var panel = _.find(report.panels, function(p){ return p._id.toString() == body.panelId;});
        usageHelper.recordUsageLog(req, 'runDashboardPanel', report, system, connection, panel);
        var sqlObj = [];
        var sqlTitle = ['data'];
        var parameters = req.body.data;
        var processedParameter = timezoneHelper.processParameter(parameters, report, panel, body);
        if(connection.connType=='database'){
            // todo filter should not be saved in cookie because we may visit multiple page at the same time
            sqlObj.push(_pool.sqlParser(panel.datasource, system.params, processedParameter, req.body.filter));
        }else if(connection.connType=='oracledatabase'){
            sqlObj.push(_oracle.sqlParser(panel.datasource, system.params, processedParameter, req.body.filter));
        }
        var sqlStatement = sqlObj[0];
        var sqlStatementForClient = passport.pass(clientInfo['user'],clientInfo['sid']) ? sqlStatement: '';
        queryDB(connection, sqlObj, sqlTitle, req.body, function(data){
            if(data.code != 0){
                res.status(520).json({
                    success: false,
                    error: data.error ? data.error.message : '',
                    executedSqlStatement: sqlStatementForClient
                });
            }else{
                timezoneHelper.processResultTable(data.data[0], panel, body);
                res.json({
                    success: true,
                    rows: data.data[0],
                    totalItemCount: data.count[0],
                    executedSqlStatement: sqlStatementForClient
                });
            }
        });
    });
};


exports.getReportDataDaily = function (req, res) {
    //post logic: ip - s_sid validate -> get data -> adapt data to grid -> send data
    console.log('get report data');
    var resultJson = {
        status: 0, description: 'success', data: [], count: []   // 0/1 => success/fail
    };

    DataConnection.find({sysName: req.body.sysName}, {}, function (err, docs) {
        if (err) {
            console.log(err);
        } else if (docs.length != 0) {
            if(docs[0].connType=='database'){
                _pool.init_config(docs[0].dbAddress.split('/')[0].split(':')[0], docs[0].dbAddress.split('/')[0].split(':')[1], docs[0].account, docs[0].password, docs[0].dbAddress.split('/')[1], true);
            }else if(docs[0].connType=='oracledatabase'){
                _oracle.init_config(docs[0].account, docs[0].password, docs[0].dbAddress, true);
            }
            if (req.body.secret == SECRET_ACCESS) {
                if (req.body && req.body.sysName && req.body.reportName && req.body.page && req.body.size) {
                    DataConnection.find({sysName: req.body.sysName}, {}, function (err, docs) {
                        if (err) {
                            resultJson.status = 1;
                            resultJson.description = 'server 500';
                            res.send(resultJson);
                            console.log(err);
                        } else if (docs.length != 0) {
                            ReportConfig.find({
                                sysName: req.body.sysName,
                                reportName: req.body.reportName
                            }, {}, function (err, config) {
                                //find config
                                if (err) {
                                    resultJson.status = 1;
                                    resultJson.description = 'server 500';
                                    res.send(resultJson);
                                    console.log(err);
                                } else if (config.length != 0) {
                                    //push query criteria
                                    var sqlObj = [];
                                    var sqlTitle = [];
                                    if(docs[0].connType=='database'){
                                        sqlObj.push(_pool.sqlParser(config[0].datasource, docs[0].params, req.body.data, ""));
                                    }else if(docs[0].connType=='oracledatabase'){
                                        sqlObj.push(_oracle.sqlParser(config[0].datasource, docs[0].params, req.body.data, ""));
                                    }
                                    sqlTitle.push('data');
                                    for (var i = 0; i < config[0].sub.length; i++) {
                                        sqlTitle.push(config[0].sub[i].sequenceNum + '||' + config[0].sub[i].name);
                                        if(docs[0].connType=='database'){
                                            sqlObj.push(_pool.sqlParser(config[0].sub[i].datasource, docs[0].params, req.body.data, ""));
                                        }else if(docs[0].connType=='oracledatabase'){
                                            sqlObj.push(_oracle.sqlParser(config[0].sub[i].datasource, docs[0].params, req.body.data, ""));
                                        }
                                    }
                                    if(docs[0].connType=='database'){
                                        _pool.query(sqlObj, sqlTitle, req.body.page, req.body.size, dealData);
                                    }else if(docs[0].connType=='oracledatabase'){
                                        _oracle.query(sqlObj, sqlTitle, req.body.page, req.body.size, dealData);
                                    }
                                } else {
                                    resultJson.status = 1;
                                    resultJson.description = 'sql wrong';
                                    res.send(resultJson);
                                }
                            });
                        } else {
                            resultJson.status = 1;
                            resultJson.description = 'no such connection';
                            res.send(resultJson);
                        }
                    });
                } else {
                    resultJson.status = 1;
                    resultJson.description = 'no such config';
                    res.send(resultJson);
                }
            } else {
                resultJson.status = 1;
                resultJson.description = 'auth problem';
                res.send(resultJson);
            }
        }
    });

    function dealData(result) {
        if (result.code == 0) {
            resultJson.data = result.data;
            resultJson.dataRoot = result.dataRoot;
            resultJson.count = result.count;
        } else if (result.code == 1) {
            resultJson.status = 1;
            resultJson.description = 'connection can\'t get';
        } else {
            resultJson.status = 1;
            resultJson.description = 'wrong sql sequence';
        }
        res.send(resultJson);
    }
};

exports.getDailyReportPage = function(req,res) {
    res.render('chartDailyTpl',{});
};

// 报表的翻页查询，同时支持主报表和子报表
exports.getReportDataByGrid = function (req, res) {
    //post logic: ip - s_sid validate -> get data -> adapt data to grid -> send data
    console.log('get report data by single grid');
    var resultJson = {
        status: 0, description: 'success', data: []   // 0/1 => success/fail
    };

    var clientInfo = passport.getUserInfo(req);
    if (passport.db_access_pass(req.headers['host'], clientInfo['s_sid'])) {
        queryHelper.prepareDoc(req.body, function(error, docs){
            if(error){
                res.status(error).end();
            }else{
                var sql;
                var connection = docs.dataConnection;
                var externalSystem = docs.externalSystem;
                var reportConfig = docs.reportConfig;
                if (req.body.sequence == 0) {
                    if(connection.connType=='database'){
                        sql = _pool.sqlParser(reportConfig.datasource, externalSystem.params, req.body.data, clientInfo['filter']);
                    }else if(connection.connType=='oracledatabase'){
                        sql = _oracle.sqlParser(reportConfig.datasource, externalSystem.params, req.body.data, clientInfo['filter']);
                    }
                } else {
                    for (var i = 0; i < reportConfig.sub.length; i++) {
                        if (reportConfig.sub[i].sequenceNum == req.body.sequence) {
                            if(connection.connType=='database'){
                                sql = _pool.sqlParser(reportConfig.sub[i].datasource, externalSystem.params, req.body.data, clientInfo['filter']);
                            }else if(connection.connType=='oracledatabase'){
                                sql = _oracle.sqlParser(reportConfig.sub[i].datasource, externalSystem.params, req.body.data, clientInfo['filter']);
                            }
                            break;
                        }
                    }
                }
                queryDB(docs.dataConnection, [sql], ['result'], req.body, dealData);
            }
        });
    } else {
        resultJson.status = 1;
        resultJson.description = 'auth problem';
        res.send(resultJson);
    }

    function dealData(result) {
        if (result.code == 0) {
            resultJson.data = result.data[0];
        } else if (result.code == 1) {
            resultJson.status = 1;
            resultJson.description = 'connection can\'t get';
        } else {
            resultJson.status = 1;
            resultJson.description = 'wrong sql sequence';
        }
        res.send(resultJson);
    }
};

// Dashboard grid download all
exports.downLoadAll = function (req, res) {
    var clientInfo = passport.getUserInfo(req);

    var body = JSON.parse(req.query.json);

    queryHelper.prepareDoc(body, function (error, docs) {
        var report = docs.reportConfig.toObject();
        var system = docs.externalSystem.toObject();
        var connection = docs.dataConnection.toObject();
        var panel = _.find(report.panels, function (p) {
            return p._id.toString() == body.panelId;
        });
        usageHelper.recordUsageLog(req, 'downloadAll', report, system, connection, panel);
        var sqlObj = [];
        var sqlTitle = ['data'];
        var parameters = body.data;
        var processedParameter = timezoneHelper.processParameter(parameters, report, panel, body);
        if (connection.connType == 'database') {
            sqlObj.push(_pool.sqlParser(panel.datasource, system.params, processedParameter, body['filter']));
        } else if (connection.connType == 'oracledatabase') {
            sqlObj.push(_oracle.sqlParser(panel.datasource, system.params, processedParameter, body['filter']));
        }
        queryDB(connection, sqlObj, sqlTitle, body, function (data) {
            if (data.code != 0) {
                res.json({
                    success: false,
                    error: data.error
                });
            } else {
                var datatable = data.data[0];
                timezoneHelper.processResultTable(datatable, panel, body);

                var data = [];

                //  列名
                row = [];
                for (var i = 0; i < panel.detail.length; i++) {
                    row.push(panel.detail[i].value);
                }
                data.push(row);   //push the column name into the array row[], like row=[X,Y]

                //  数据
                // var testNum1 = /^(\+|-)?[0-9]+\.?[0-9]*$/;   //integer and fraction
                // var testAll = /^(((\+|-)?[0-9]+\.?[0-9]*)[-+*/]((\+|-)?[0-9]+\.?[0-9]*))+$/;
                var testNumFloat = /^(\+|-)?[0-9]+\.[0-9]*$/;
                var testNumInt = /^(\+|-)?[0-9]+[0-9]*$/;
                var testNumFloat2 = /^(\+|-)?\.[0-9]*$/;
                // var testExpression = /^(((\+|-)?0|[1-9]*)[-+*/](0|[1-9]?\d*))+$/;
                for (var i = 0; i < datatable.length; i++) {
                    row = [];
                    for (var j = 0; j < panel.detail.length; j++) {
                        // it is true when that pushed variable is (+/-)number
                        if (testNumFloat.test(datatable[i][panel.detail[j].key.toLowerCase()]) ||
                            testNumInt.test(datatable[i][panel.detail[j].key.toLowerCase()]) ||
                            testNumFloat2.test(datatable[i][panel.detail[j].key.toLowerCase()])){
                            row.push(parseFloat(datatable[i][panel.detail[j].key.toLowerCase()]));
                        }
                        else row.push(datatable[i][panel.detail[j].key.toLowerCase()]);
                    }
                    data.push(row);    // push data of each row from the column name
                }

                var filename = panel.hideTitle ? report.reportName : panel.title;
                var buffer = nodeExcel.build([{name: filename, data: data}]);

                res.setHeader("Content-type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                res.setHeader("Content-Disposition", "attachment;filename*=utf-8''" + encodeURIComponent(filename) + ".xlsx");
                res.setHeader("Expires", "0");
                res.setHeader("Cache-Control", "no-cache, must-revalidate");
                res.setHeader("Pragma", "no-cache");

                res.send(buffer);
            }
        });
    });
};

exports.downLoadExcel = function (req, res) {
    console.log('get report data');
    var resultJson = {
        status: 0, description: '', data: []   // 0/1 => success/fail
    };

    var clientInfo = passport.getUserInfo(req);
    if (passport.db_access_pass(req.headers['host'], clientInfo['s_sid'])) {
        console.log(req.query.json);
        var jsondata = JSON.parse(req.query.json);
        console.log(jsondata.sysName);
        console.log(jsondata.reportName);
        queryHelper.prepareDoc(jsondata, function(error, docs){
            if(error){
                return res.status(error).end();
            }
            //push query criteria
            var sqlObj = [];
            var sqlTitle = [];
            if (jsondata.detail.download) {
                if(docs.dataConnection.connType=='database'){
                    sqlObj.push(_pool.sqlParser(docs.reportConfig.datasource, docs.externalSystem.params, jsondata.data, clientInfo['filter']));
                }else if(docs.dataConnection.connType=='oracledatabase'){
                    sqlObj.push(_oracle.sqlParser(docs.reportConfig.datasource, docs.externalSystem.params, jsondata.data, clientInfo['filter']));
                }
            }
            sqlTitle.push('data');
            for (var j = 0; j < jsondata.subreport.length; j++) {
                for (var i = 0; i < docs.reportConfig.sub.length; i++) {
                    if (docs.reportConfig.sub[i].name == jsondata.subreport[j].name && jsondata.subreport[j].download) {
                        sqlTitle.push(docs.reportConfig.sub[i].name);
                        if(docs.dataConnection.connType=='database'){
                            sqlObj.push(_pool.sqlParser(docs.reportConfig.sub[i].datasource, docs.externalSystem.params, jsondata.data, clientInfo['filter']));
                        }else if(docs.dataConnection.connType=='oracledatabase'){
                            sqlObj.push(_oracle.sqlParser(docs.reportConfig.sub[i].datasource, docs.externalSystem.params, jsondata.data, clientInfo['filter']));
                        }
                    }
                }
            }
            queryDB(docs.dataConnection, sqlObj, sqlTitle, {page: 0, size: 0}, dealWithData);



            //使用node-xlsx将数据制成excel
            function dealWithData(result){
                var data = [];
                var row = [];
                var requestdata = jsondata;
                var headerKeys = [];
                var headerValues = [];
                var footerKeys = [];
                var footerValues = [];
                var emptyLine = [null];
                // console.log(requestdata.header);


                //报表头
                if (requestdata.header.download && requestdata.header.columnlist.length > 0) {
                    row.push("报表表头");
                    data.push(row);
                    row = [];
                    for (var i = 0; i < requestdata.header.columnlist.length; i++) {
                        headerKeys.push(requestdata.header.columnlist[i].key);
                        headerValues.push(result.data[result.data.length - 1][0][requestdata.header.columnlist[i].key.toLowerCase()]);
                    }
                    data.push(headerKeys);
                    data.push(headerValues);
                    data.push(emptyLine);
                }

                //报表明细
                if (requestdata.detail.download) {
                    row.push("报表明细");
                    row.push(requestdata.detail.detailname);
                    data.push(row);
                    //  列名
                    row = [];
                    for (var i = 0; i < requestdata.detail.columnlist.length; i++) {

                        if (requestdata.detail.columnlist[i][1] || requestdata.detail.columnlist[i][1] == 0) {
                            row.push(requestdata.detail.columnlist[i][0]);
                        }

                    }
                    data.push(row);
                    //  数据
                    for (var i = 0; i < result.data[result.data.length - 1].length; i++) {
                        row = [];
                        for (var j = 0; j < requestdata.detail.columnlist.length; j++){

                            row.push(result.data[result.data.length - 1][i][requestdata.detail.columnlist[j][0].toLowerCase()]);

                        }
                        data.push(row);
                    }

                    data.push(emptyLine);
                }

                //子报表

                for (var i = 0; i < requestdata.subreport.length; i++) {
                    //每一个子报表
                    if (requestdata.subreport[i].download) {
                        row = [];
                        row.push(requestdata.subreport[i].name);
                        data.push(row);

                        for (var j = 0; j < result.dataRoot.length; j++) {
                            if (requestdata.subreport[i].name == result.dataRoot[j]) {
                                result.data[j];
                                if (requestdata.subreport[i].columnlist.length > 0) {

                                    //子报表列名
                                    row = [];
                                    for (var n = 0; n < requestdata.subreport[i].columnlist.length; n++) {
                                        if (requestdata.subreport[i].columnlist[n].value || requestdata.subreport[i].columnlist[n].value == 0) {
                                            row.push(requestdata.subreport[i].columnlist[n].value);
                                        }
                                    }
                                    data.push(row);

                                    //子报表数据
                                    for (var m = 0; m < result.data[j].length; m++) {
                                        row = [];
                                        for (var n = 0; n < requestdata.subreport[i].columnlist.length; n++) {
                                            row.push(result.data[j][m][requestdata.subreport[i].columnlist[n].key.toLowerCase()]);
                                        }
                                        data.push(row);

                                    }
                                    data.push(emptyLine);

                                }
                            }
                        }

                    }
                }

                //报表页脚
                if (requestdata.footer.download && requestdata.footer.columnlist.length > 0){
                    row = [];
                    row.push("报表页脚");
                    data.push(row);

                    for (var i = 0; i < requestdata.footer.columnlist.length; i++) {
                        footerKeys.push(requestdata.footer.columnlist[i].key);
                        footerValues.push(result.data[result.data.length - 1][0][requestdata.footer.columnlist[i].key.toLowerCase()]);
                    }

                    data.push(footerKeys);
                    data.push(footerValues);
                    data.push(emptyLine);
                }

                
                var buffer = nodeExcel.build([{name: "mySheetName", data: data}]);

                res.setHeader("Content-type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                res.setHeader("Content-Disposition", "attachment;filename*=utf-8''" + encodeURIComponent(docs.reportConfig.reportName) + ".xlsx");
                res.setHeader("Expires", "0");
                res.setHeader("Cache-Control", "no-cache, must-revalidate");
                res.setHeader("Pragma", "no-cache");

                res.send(buffer);
            }
        });
    } else {
        resultJson.status = 1;
        resultJson.description = 'auth problem';
        res.send(resultJson);
    }
};



function checkDate(data) {
    var test = /^[a-zA-Z][a-zA-Z][a-zA-Z]\s[a-zA-Z][a-zA-Z][a-zA-Z]\s(\d{2})\s(\d{4})\s(\d{2}):(\d{2}):(\d{2})\s[a-zA-Z][a-zA-Z][a-zA-Z]\+(\d{4})\s.*$/;
    //var date = 'Mon Aug 17 2015 07:41:02 GMT+0800';
    //console.log(test.test(data));
    //console.log(test.test(date));
    //console.log(data);
    if (test.test(data)) {
        return (new Date(data)).Format('yyyy-M-d');
    } else {
        return data;
    }
}

exports.savePageHeight = function (req, res) {
    req.body.updateUser = passport.getUserInfo(req)['user'];
    ReportConfig.update({'reportName': req.body.reportName, 'sysName': req.body.sysName},
        {$set: req.body}, {},
        function (err) {
            if (err) {
                console.log('error:' + err);
                res.json({
                    result: 'error'
                });
            } else {
                res.json({
                    result: 'exist'
                });
            }
        }
    );
};


exports.getPageHeight = function (req, res) {
    console.log('get scroll height.');
    if (!!req.body.sysName || !!req.body.reportName) {
        ReportConfig.find({
            reportName: req.body.reportName,
            sysName: req.body.sysName
        }, {}, function (err, data) {
            if (err) {
                res.send('0');
                console.log(err);
            } else {
                if (data.length == 0) {
                    res.send('0');
                } else {
                    if (!!data[0].pageHeight) {
                        res.send({height: data[0].pageHeight});
                    } else {
                        res.send('0');
                    }

                }
            }
        });
    } else {
        res.send('0');
    }
};
