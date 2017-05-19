var ReportConfig = require('../models/ReportConfig');
var DataConnection = require('../models/DataConnection');
var mongoose = require('./index');
var _pool = require('./utils/mysql-tool');
var _oracle = require('./utils/oracle-tool');
var _ = require('underscore');
var passport = require('./utils/passport');
var async = require('async');
var ObjectId = require('mongodb').ObjectID;
var planePath = 'path://M1705.06,1318.313v-89.254l-319.9-221.799l0.073-208.063c0.521-84.662-26.629-121.796-63.961-121.491c-37.332-0.305-64.482,36.829-63.961,121.491l0.073,208.063l-319.9,221.799v89.254l330.343-157.288l12.238,241.308l-134.449,92.931l0.531,42.034l175.125-42.917l175.125,42.917l0.531-42.034l-134.449-92.931l12.238-241.308L1705.06,1318.313z';
var placeholder = /#\w+/;
var reg = /\[#\w+\]/;
var timezoneHelper = require('./timezoneHelper');
var usageHelper = require('./usageLogHelper');
var queryHelper = require('./queryHelper');

exports.previewDashboard = function(req, res){
    ReportConfig.find({
        _id: req.query.id
    }, {}, function (err, data) {
        if (err) {
            res.send(err);
            console.log(err);
        } else {
            if (data.length == 0) {
                res.render('errorTpl', {code: '400', description: "参数有误"});
            } else {
                console.log("data connection page with param");
                var filterStr = req.param('defaultFilter');
                if(filterStr){
                    try{
                        var filterObj = JSON.parse(filterStr);
                        res.render('dashboard/viewDashboard', {ReportInfo:data[0], preview: true, filter: filterObj});
                    }catch(e){
                        res.render('errorTpl', {code: '520', description: e});
                    }
                }else{
                    res.render('dashboard/viewDashboard', {ReportInfo:data[0], preview: true, filter: {}});
                }
            }
        }
    });
}

exports.searchGlobal = function(req, res){
    ReportConfig.find({
        _id: req.body.dashBoardId,
        type: 'dashboard'
    }, {}, function (err, data) {
        if (err) {
            res.send(err);
            console.log(err);
        } else {
            if (data.length == 0) {
                res.render('errorTpl', {code: '400', description: "参数有误"});
            } else {
                console.log("data connection page with param");
                var clientInfo = passport.getUserInfo(req);
                var conditions =  req.body.condition;
                data[0].panels = generateAllCharts(data[0].panels,conditions,clientInfo,dealResult);
            }
        }
        function dealResult(result){
            data[0].panels = result;
            res.json(data[0].panels);
        }
    });
}

function generateAllCharts(panels,conditions,clientInfo,callback){
    var i = 0;
    var panelArray = [];
    async.eachSeries(panels, function(panel,callback){
        if(panel.chartType.indexOf('网页')==-1){
            DataConnection.find({_id: panel.connection},function (err, conn) {
                if(conn[0].connType=='database'){
                    var dbConfig =
                    {
                        host:conn[0].dbAddress.split('/')[0].split(':')[0],
                        port:conn[0].dbAddress.split('/')[0].split(':')[1],
                        user:conn[0].account,
                        password:conn[0].password,
                        database:conn[0].dbAddress.split('/')[1]
                    };
                }else if(conn[0].connType=='oracledatabase'){
                    var dbConfig =
                    {
                        user: conn[0].account,
                        password:conn[0].password,
                        connectString: conn[0].dbAddress
                    };
                }
                var sqlObj = [];
                var sqlTitle = [];
                sqlTitle.push('data');
                if(conn[0].connType=='database'){
                    sqlObj.push(_pool.sqlParser(panel.datasource, '', conditions[i].data, clientInfo['filter']));
                }else if(conn[0].connType=='oracledatabase'){
                    sqlObj.push(_oracle.sqlParser(panel.datasource, '', conditions[i].data, clientInfo['filter']));
                }
                if(conn[0].connType=='database'){
                    _pool.query(dbConfig,sqlObj, sqlTitle, conditions[i].page, conditions[i].size, dealData);
                }else if(conn[0].connType=='oracledatabase'){
                    _oracle.query(dbConfig,sqlObj, sqlTitle, conditions[i].page, conditions[i].size, dealData);
                }
                i++;
            });

            function dealData(result) {
                if (result.code == 0) {
                    if(panel.chartType.indexOf('Chart')!=-1)
                        panelArray.push(generateChart(panel,result.data[0]));
                    else{
                        panel._doc.rawData = result.data[0];
                        panelArray.push(panel);
                    }
                    callback();
                }
            }
        }else{
            panelArray.push(panel);
            callback();
        }
    }, function(err){
        callback(panelArray);
    })
}


exports.runChart =  function(req, res){
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
            var sqlTitle = [];
            sqlTitle.push('data');
            var parameters = req.body.data;
            var processedParameter = timezoneHelper.processParameter(parameters, report, panel, req.body);
            if(connection.connType=='database'){
                var dbConfig =
                {
                    host:connection.dbAddress.split('/')[0].split(':')[0],
                    port:connection.dbAddress.split('/')[0].split(':')[1],
                    user:connection.account,
                    password:connection.password,
                    database:connection.dbAddress.split('/')[1]
                };
                sqlObj.push(_pool.sqlParser(panel.datasource, '', processedParameter, req.body['filter']));
            }else if(connection.connType=='oracledatabase'){
                var dbConfig =
                {
                    user: connection.account,
                    password:connection.password,
                    connectString: connection.dbAddress
                };
                sqlObj.push(_oracle.sqlParser(panel.datasource, '', processedParameter, req.body['filter']));
            }
            var sqlStatement = sqlObj[0];
            var sqlStatementForClient = passport.pass(clientInfo['user'],clientInfo['sid']) ? sqlStatement: '';
            if(connection.connType=='database'){
                _pool.query(dbConfig,sqlObj, sqlTitle, req.body.page, req.body.size, dealData);
            }else if(connection.connType=='oracledatabase'){
                _oracle.query(dbConfig,sqlObj, sqlTitle, req.body.page, req.body.size, dealData);
            }

            function dealData(result) {
                if (result.code == 0) {
                    if(panel.chartType.indexOf('Chart')!=-1) {
                        timezoneHelper.processResultTable(result.data[0], panel, req.body);
                        panel = genChartOpt(panel, result.data[0]);
                        panel.executedSqlStatement = sqlStatementForClient;
                    }
                    else{
                        // TODO, dead fork
                        panel._doc.rawData = result.data[0];
                        panel._doc.totalItems = result.count[0];
                        panel._doc.executedSqlStatement = sqlStatementForClient;
                    }

                    res.json(panel);
                }else{
                    var error = result.error ? result.error.message : '';
                    res.status(520).json({error: error, sql: sqlStatementForClient});
                }
            }
        });
}

function genChartOpt(panel, rows){
    var deepCopy = function(obj){
        return JSON.parse(JSON.stringify(obj));
    };
    var optionStr = panel.jsCustomizationCode,
        option = JSON.parse(optionStr.substr(optionStr.indexOf('{'))),
        configs = _.pairs(option),
        xaxisCfg = _.find(configs, function(cfg){
            return cfg[0] === 'xAxis'  &&  placeholder.test(JSON.stringify(cfg[1]));
        }),
        yaxisCfg = _.find(configs, function(cfg){
            return cfg[0] === 'yAxis'  &&  placeholder.test(JSON.stringify(cfg[1]));
        }),
        legendCfg = _.find(configs, function(cfg){
            return cfg[0] === 'legend';
        }),
        seriesCfg = _.find(configs, function(cfg){
            return cfg[0] === 'series';
        }),
        radarCfg = _.find(configs, function(cfg){
            return cfg[0] === 'radar';
        });
    if(_.isEmpty(seriesCfg)){
        panel._doc.option = null;
        return panel;
    }
    if(panel.chartType == '地图 Map Chart'){
        option = generateValue4Map(rows,option);
    }else{
        var chartType = seriesCfg[1][0].type;
        var legendType = !!legendCfg ? (legendCfg[1].data.length === 1 ? 'col' : 'row') : 'none';
        var legendValue;
        if(legendType === 'none') legendValue = null;
        if(legendType === 'col') legendValue = legendCfg[1].data[0].match(/\w+/g)[0].toLowerCase();
        if(legendType === 'row'){
            if(!placeholder.test(JSON.stringify(legendCfg))){
                legendValue = null;
            }else{
                legendValue = _.map(_.pluck(seriesCfg[1],'data'),function(each){
                    return each.match(/\w+/g)[0].toLowerCase();
                });
            }
        }
        var seriesName = (chartType === 'pie' || chartType === 'gauge') ? seriesCfg[1][0].data[0].name.match(/\w+/g)[0].toLowerCase() :(chartType === 'radar'? seriesCfg[1][0].data[0].match(/\w+/g)[0].toLowerCase() : null);
        var seriesValue = (chartType === 'scatter') ? _.map(seriesCfg[1][0].data,function(d){
            return d.match(/\w+/g)[0].toLowerCase();
        }) : (legendType === 'row' ? null : (chartType === 'pie' || chartType === 'gauge') ? seriesCfg[1][0].data[0].value.match(/\w+/g)[0].toLowerCase() :seriesCfg[1][0].data[0].match(/\w+/g)[0].toLowerCase());
        var radar = !!radarCfg ? radarCfg[1].indicator[0].name.match(/\w+/g)[0].toLowerCase() : null;
        var xaxis = !!xaxisCfg ? xaxisCfg[1][0].data[0].match(/\w+/g)[0].toLowerCase() : null;
        var yaxis = !!yaxisCfg ? yaxisCfg[1][0].data[0].match(/\w+/g)[0].toLowerCase() : null;

        if(chartType === 'line' || chartType === 'bar'){
            if(legendType === 'none'){
                var axisData,axis;
                if(!!xaxis){
                    axisData = option.xAxis[0].data = _.uniq(_.pluck(rows,xaxis));
                    axis = xaxis;
                }
                if(!!yaxis){
                    axisData = option.yAxis[0].data = _.uniq(_.pluck(rows,yaxis));
                    axis = yaxis;
                }

                option.series[0].data = [];
                for(var i=0;i<axisData.length;i++){
                    option.series[0].data.push(_.find(rows,function(row){
                        return row[axis] == axisData[i];
                    })[seriesValue]);
                }
            }
            if(legendType === 'col'){
                var axisData,axis;
                if(!!xaxis){
                    axisData = option.xAxis[0].data = _.uniq(_.pluck(rows,xaxis));
                    axis = xaxis;
                }
                if(!!yaxis){
                    axisData = option.yAxis[0].data = _.uniq(_.pluck(rows,yaxis));
                    axis = yaxis;
                }

                var legendData = option.legend.data = _.uniq(_.pluck(rows,legendValue));
                var sampleSeriesData = deepCopy(seriesCfg[1][0]);
                option.series = [];
                for(var i=0;i<legendData.length;i++){
                    var copy = deepCopy(sampleSeriesData);
                    copy.name = legendData[i];
                    copy.data = [];
                    for(var j=0;j<axisData.length;j++){
                        var findValue = _.find(rows,function(row){
                            return row[axis] == axisData[j] && row[legendValue] == legendData[i];
                        });
                        if(!!findValue){
                            copy.data.push(findValue[seriesValue]);
                        }
                        // copy.data.push(_.find(rows,function(row){
                        //     return row[xaxis] == xaxisData[j] && row[legendValue] == legendData[i];
                        // })[seriesValue]);
                    }
                    option.series.push(copy);
                }
            }
            if(legendType === 'row'){
                var axisData,axis;
                if(!!xaxis){
                    axisData = option.xAxis[0].data = _.uniq(_.pluck(rows,xaxis));
                    axis = xaxis;
                }
                if(!!yaxis){
                    axisData = option.yAxis[0].data = _.uniq(_.pluck(rows,yaxis));
                    axis = yaxis;
                }

                var seriesData = deepCopy(seriesCfg[1]);
                option.series = [];
                for(var i=0;i<seriesData.length;i++){
                    var copy = seriesData[i];
                    var dataType = copy.data.match(/\w+/g)[0].toLowerCase();
                    copy.data = [];
                    for(var j=0;j<axisData.length;j++){
                        copy.data.push(_.find(rows,function(row){
                            return row[axis] == axisData[j];
                        })[dataType]);
                    }
                    option.series.push(copy);
                }
            }
        }

        if(chartType === 'scatter'){
            if(legendType === 'none'){
                option.xAxis[0].data = _.uniq(_.pluck(rows,xaxis));
                var copy = _.map(rows, function(row){
                    return _.values(_.pick(row,seriesValue));
                });
                option.series[0].data = copy;
            }
            if(legendType === 'col'){
                option.xAxis[0].data = _.uniq(_.pluck(rows,xaxis));
                var legendData = option.legend.data = _.uniq(_.pluck(rows,legendValue));
                var sampleSeriesData = deepCopy(seriesCfg[1][0]);
                option.series = [];
                for(var i=0;i<legendData.length;i++){
                    var copy = deepCopy(sampleSeriesData);
                    copy.name = legendData[i];
                    copy.data = _.map(_.filter(rows, function(r){return r[legendValue] === legendData[i];}), function(row){
                        return _.values(_.pick(row,seriesValue));
                    });
                    option.series.push(copy);
                }
            }
        }

        if(chartType === 'radar'){
            if(legendType === 'none'){
                option.radar.indicator = [];
                var inds = _.uniq(_.pluck(rows,radar));
                var values = [];
                for(var i=0;i<inds.length;i++){
                    option.radar.indicator.push({name: inds[i]});
                    values.push(_.find(rows,function(row){
                        return row[radar] == inds[i];
                    })[seriesValue]);
                }
                option.series[0].data[0] = {value: values,name: ''};
            }
            if(legendType === 'col'){
                var legendData = option.legend.data = _.uniq(_.pluck(rows,legendValue));
                option.radar.indicator = [];
                option.series = [];
                var inds = _.uniq(_.pluck(rows,radar));
                var sampleSeriesData = deepCopy(seriesCfg[1][0]);
                sampleSeriesData.data = [];
                for(var i=0;i<inds.length;i++){
                    option.radar.indicator.push({name: inds[i]});
                }
                for(var i=0;i<legendData.length;i++){
                    var copy = {};
                    copy.name = legendData[i];
                    copy.value = [];
                    for(var j=0;j<inds.length;j++){
                        var findValue = _.find(rows,function(row){
                            return row[radar] == inds[j]  &&  row[legendValue] === legendData[i];
                        });
                        if(!!findValue){
                            copy.value.push(findValue[seriesValue]);
                        }
                        // copy.value.push(_.find(rows,function(row){
                        //     return row[radar] == inds[j]  &&  row[legendValue] === legendData[i];
                        // })[seriesValue]);
                    }
                    sampleSeriesData.data.push(copy)
                }
                option.series.push(sampleSeriesData);
            }
        }

        if(chartType === 'pie'){
            var legendData = option.legend.data = _.uniq(_.pluck(rows,legendValue));
            var seriesDatas = [];
            for(var i=0;i<legendData.length;i++){
                var copy = {};
                copy.name = legendData[i];
                copy.value = _.find(rows, function(row){
                    return row[legendValue] == legendData[i];
                })[seriesValue];
                seriesDatas.push(copy);
            }
            option.series[0].data = seriesDatas;
        }

        if(chartType === 'gauge'){
            option.series[0].data = [];
            var val = rows[0][seriesValue];
            var name = rows[0][seriesName];
            option.series[0].data.push({value:val,name:name});
        }
    }


    var panelObj = panel;
    panelObj.option = option;
    return panelObj;
}


function generateChart(panel,rows){
    var option = panel.jsCustomizationCode;
    option = option.substring(option.indexOf('{'),option.length);
    option = JSON.parse(option);
    var pairs = _.pairs(option);
    var series = _.find(pairs,function(pair){
        return pair[0] == 'series';
    });
    var xAxis = _.find(pairs,function(pair){
        return pair[0] == 'xAxis' && placeholder.test(JSON.stringify(pair[1])) ;
    });
    var xAxisCol = null;
    if(xAxis){
        xAxisCol = xAxis[1][0].data[0].match(/\w+/g)[0].toLowerCase();
        option.xAxis[0].data = _.keys(_.groupBy(rows,xAxisCol));
    }
    if(panel.chartType == '地图 Map Chart'){
        var option = generateValue4Map(rows,option);
    }else if(placeholder.test(JSON.stringify(option.legend.data))){
        if(xAxis)
            var result = generateValue4legendCol(option.legend.data[0].match(/\w+/g)[0],rows,option.series[0],xAxis[1][0].data,xAxisCol);
        else
            var result = generateValue4legendCol(option.legend.data[0].match(/\w+/g)[0],rows,option.series[0],xAxis,xAxisCol);
        option.series = result.series;
        option.legend.data= result.legend;
    }else {
        if(_.isArray(series[1])){
            _.each(series[1],function(item){
                for(var key in item){
                    if(!_.isEmpty(item[key])&&placeholder.test(JSON.stringify(item[key]))){
                        if(_.isArray(item[key])&&reg.test(JSON.stringify(item[key]))){
                            _.each(item[key],function(data){
                                data = fillDataInChart(data,rows);
                            })
                        }else if(JSON.stringify(item[key]).indexOf('children')!=-1){
                            item[key] = generateData4Tree(item[key],rows);
                        }
                        else
                            item[key] = fillDataInChart(item[key],rows);
                    }
                }
            })
        }else{
            for(var key in series[1]){
                if(placeholder.test(JSON.stringify(series[1][key]))){
                    if(_.isArray(series[1][key])&&reg.test(JSON.stringify(series[1][key]))){
                        _.each(series[1][key],function(data){
                            data = fillDataInChart(data,rows);
                        })
                    }else if(JSON.stringify(series[1][key]).indexOf('children')!=-1){
                        series[1][key] = generateData4Tree(series[1][key],rows);
                    }
                    else
                        series[1][key]= fillDataInChart(series[1][key],rows);
                }
            }
        }
        option.series = series[1];
    }

    var polar = _.find(pairs,function(pair){
        if(pair[0]=='radar'&&placeholder.test(JSON.stringify(pair[1]))) {
            return pair;
        }
    })
    if(polar)
        option.radar[0].indicator = fillDataInChart(polar[1][0].indicator[0],rows);

    var legend = _.find(pairs,function(pair){
        if(pair[0]=='legend'&&placeholder.test(JSON.stringify(pair[1]))) {
            return pair;
        }
    })
    if(legend){
        if(legend[1].data[0].match(/\w+/g)!=null)
            option.legend.data = _.pluck(rows, legend[1].data[0].match(/\w+/g)[0].toLowerCase());
    }
    var yAxis = _.find(pairs,function(pair){
        if(pair[0]=='yAxis'&&placeholder.test(JSON.stringify(pair[1]))) {
            return pair;
        }
    })
    var yAxisCol = null;
    if(yAxis){
        yAxisCol = yAxis[1][0].data[0].match(/\w+/g)[0].toLowerCase();
        option.yAxis[0].data = _.keys(_.groupBy(rows,yAxisCol));
        if(yAxis[1][1]){
            yAxisCol = yAxis[1][1].data[0].match(/\w+/g)[0].toLowerCase();
            option.yAxis[1].data = _.keys(_.groupBy(rows,yAxisCol));
        }
    }
    panel._doc.option = option;
    return panel;
}


function generateValue4Map(rows,option){
    var obj = _.groupBy(rows,option.series[0].name.match(/\w+/g)[0].toLowerCase());
    var resultArray = [];
    for(var key in obj){
        var groupArray=[];
        var item1 = {name:key};
        _.each(obj[key],function(item){
            var item2 = generateValue(option.series[1],item);
            var array = [];
            array.push(item1);
            array.push(item2);
            // array.push(item3);
            groupArray.push(array);
        })
        resultArray.push([key,groupArray]);
    }
    var series = [];
    resultArray.forEach(function (item, i) {
        series.push({
                name: item[0],
                type: 'lines',
                zlevel: 1,
                effect: {
                    show: true,
                    period: 6,
                    trailLength: 0.7,
                    color: '#fff',
                    symbolSize: 3
                },
                lineStyle: {
                    normal: {
                        color: '#a6c84c',
                        width: 0,
                        curveness: 0.2
                    }
                },
                data: convertData(item[1])
            },
            {
                name: item[0],
                type: 'lines',
                zlevel: 2,
                effect: {
                    show: true,
                    period: 6,
                    trailLength: 0,
                    symbol: planePath,
                    symbolSize: 15
                },
                lineStyle: {
                    normal: {
                        color: '#a6c84c',
                        width: 1,
                        opacity: 0.4,
                        curveness: 0.2
                    }
                },
                data: convertData(item[1]),
            },
            {
                name: item[0],
                type: 'effectScatter',
                coordinateSystem: 'geo',
                zlevel: 2,
                rippleEffect: {
                    brushType: 'stroke'
                },
                label: {
                    normal: {
                        show: true,
                        position: 'right',
                        formatter: '{b}'
                    }
                },
                // symbol:'emptyCircle',
                // mapType: 'none',
                // symbolSize: function (val) {
                //     return val[2] / 8;
                // },
                // symbolSize: function (val) {
                //     return val[2] / 8;
                // },


                itemStyle: {
                    normal: {
                        color:'#a6c84c'
                    }
                },
                data: item[1].map(function (dataItem) {
                    return {
                        name: dataItem[1].name,
                        // value: geoCoordMap[dataItem[1].name]
                        // value: dataItem[1].value
                        value: geoCoordMap[dataItem[1].name].concat([dataItem[1].value]),
                        // value: value1[1],
                        // value: dataItem[1].value,
                        // symbolSize: dataItem[1].value1 / 8,
                        symbolSize: dataItem[1].scope ,
                        // formmatter:
                    };
                })
            });
    });
    option.series = series;
    option.legend.data = _.keys(obj);
    return option;
}

//legend choose one column case
function generateValue4legendCol(column,rows,series,xAxis,xAxisCol){
    var result = {};
    if(_.isObject(series.data[0])){
        result.series = [];
        result.series[0] = _.clone(series);
        result.legend = _.union(_.pluck(rows,column.toLowerCase()));
        result.series[0].data = fillDataInChart(series.data[0],rows);
    }else{
        var data = _.groupBy(rows,column.toLowerCase());
        var seriesArray = [];
        var legend = [];
        for(var key in data){
            var object = _.clone(series);
            object.name = key;
            legend.push(key);
            //delete data[key][column];
            object.data = fillDataInChartCol(series.data,data[key],xAxis,xAxisCol);//_.pluck(data[key],JSON.stringify(series.data).match(/\w+/g)[0].toLowerCase());
            seriesArray.push(object);
        }
        result.legend = legend;
        result.series = seriesArray;
    }
    return result;
}

function generateData4Tree(data,rows){
    var tree = _.groupBy(rows,data.name.match(/\w+/g)[0].toLowerCase());
    var results = [];
    for(var item in tree){
        var object = _.clone(data);
        object['name'] = item;
        var array = [];
        _.each(tree[item],function(obj){
            var children = _.clone(data.children);
            if(JSON.stringify(children).indexOf('children')!=-1)
                array.push(generateData4Tree(children,tree[item]));
            else{
                var hasChild = false;
                for(var key in children){
                    if (placeholder.test(children[key])){
                        children[key] = obj[children[key].match(/\w+/g)[0].toLowerCase()];
                        if(_.isNumber(children[key])&&children[key]!=0)
                            hasChild = true;
                        else if(_.isString(children[key])&& !_.isEmpty(children[key]))
                            hasChild = true;
                    }
                }
                if(hasChild)
                    array.push(children);
            }
        })
        if(!_.isEmpty(array))
            object['children'] = array;
        else
            delete object.children;
        results.push(object);
    }
    return results;
}

function fillDataInChartCol(data,rows,xAxis,xAxisCol) {
    if(_.isArray(data)&&data.length==1)
        data = data[0];
    var a = JSON.stringify(data);
    var results = [];
    if (reg.test(a)||/\[\"#\w+\"\]/.test(a)) {//匹配'[#column]'
        if(_.isObject(data)){
            for (var key in data) {
                if (reg.test(data[key]))
                    data[key] = _.pluck(rows, data[key].match(/\w+/g)[0].toLowerCase());
            }
        }else{
            data = _.pluck(rows, data.match(/\w+/g)[0].toLowerCase());
        }
        results = data;
    } else{
        if(xAxis) {
            _.each(xAxis,function(axis){
                var found = false;
                _.each(rows,function(row) {
                    if (axis == row[xAxisCol]) {
                        results.push(generateValue(data, row));
                        found = true;
                    }
                })
                if(!found)
                    results.push(0);
            })
        }else{
            _.each(rows,function(row){
                results.push(generateValue(data, row));
            })
        }
    }
    return results;
}

function fillDataInChart(data,rows) {
    if(_.isArray(data)&&data.length==1)
        data = data[0];
    var a = JSON.stringify(data);
    var results = [];
    if (reg.test(a)||/\[\"#\w+\"\]/.test(a)) {//匹配'[#column]'
        if(_.isObject(data)){
            for (var key in data) {
                if (reg.test(data[key]))
                    data[key] = _.pluck(rows, data[key].match(/\w+/g)[0].toLowerCase());
            }
        }else{
            data = _.pluck(rows, data.match(/\w+/g)[0].toLowerCase());
        }
        results = data;
    } else{
        _.each(rows,function(row){
            results.push(generateValue(data, row));
        })
    }
    return results;
}

function generateValue(data,row){
    if(_.isArray(data)){
        var results = [];
        _.each(data,function(item){
            var result = generateValue(item,row);
            results.push(result);
        })
        return results;
    }else if(_.isObject(data)){
        var object = _.clone(data);
        for (var key in data) {
            if (placeholder.test(object[key]))
                object[key] = row[object[key].match(/\w+/g)[0].toLowerCase()];
        }
        return object;
    }else if(placeholder.test(data)){
        return row[data.match(/\w+/g)[0].toLowerCase()];
    }
}


var geoCoordMap = {
    "海门":[121.15,31.89],
    "鄂尔多斯":[109.781327,39.608266],
    "招远":[120.38,37.35],
    "舟山":[122.207216,29.985295],
    "齐齐哈尔":[123.97,47.33],
    "盐城":[120.13,33.38],
    "赤峰":[118.87,42.28],
    "青岛":[120.33,36.07],
    "乳山":[121.52,36.89],
    "金昌":[102.188043,38.520089],
    "泉州":[118.58,24.93],
    "莱西":[120.53,36.86],
    "日照":[119.46,35.42],
    "胶南":[119.97,35.88],
    "南通":[121.05,32.08],
    "拉萨":[91.11,29.97],
    "云浮":[112.02,22.93],
    "梅州":[116.1,24.55],
    "文登":[122.05,37.2],
    "上海":[121.48,31.22],
    "攀枝花":[101.718637,26.582347],
    "威海":[122.1,37.5],
    "承德":[117.93,40.97],
    "厦门":[118.1,24.46],
    "汕尾":[115.375279,22.786211],
    "潮州":[116.63,23.68],
    "丹东":[124.37,40.13],
    "太仓":[121.1,31.45],
    "曲靖":[103.79,25.51],
    "烟台":[121.39,37.52],
    "福州":[119.3,26.08],
    "瓦房店":[121.979603,39.627114],
    "即墨":[120.45,36.38],
    "抚顺":[123.97,41.97],
    "玉溪":[102.52,24.35],
    "张家口":[114.87,40.82],
    "阳泉":[113.57,37.85],
    "莱州":[119.942327,37.177017],
    "湖州":[120.1,30.86],
    "汕头":[116.69,23.39],
    "昆山":[120.95,31.39],
    "宁波":[121.56,29.86],
    "湛江":[110.359377,21.270708],
    "揭阳":[116.35,23.55],
    "荣成":[122.41,37.16],
    "连云港":[119.16,34.59],
    "葫芦岛":[120.836932,40.711052],
    "常熟":[120.74,31.64],
    "东莞":[113.75,23.04],
    "河源":[114.68,23.73],
    "淮安":[119.15,33.5],
    "泰州":[119.9,32.49],
    "南宁":[108.33,22.84],
    "营口":[122.18,40.65],
    "惠州":[114.4,23.09],
    "江阴":[120.26,31.91],
    "蓬莱":[120.75,37.8],
    "韶关":[113.62,24.84],
    "嘉峪关":[98.289152,39.77313],
    "广州":[113.23,23.16],
    "延安":[109.47,36.6],
    "太原":[112.53,37.87],
    "清远":[113.01,23.7],
    "中山":[113.38,22.52],
    "昆明":[102.73,25.04],
    "寿光":[118.73,36.86],
    "盘锦":[122.070714,41.119997],
    "长治":[113.08,36.18],
    "深圳":[114.07,22.62],
    "珠海":[113.52,22.3],
    "宿迁":[118.3,33.96],
    "咸阳":[108.72,34.36],
    "铜川":[109.11,35.09],
    "平度":[119.97,36.77],
    "佛山":[113.11,23.05],
    "海口":[110.35,20.02],
    "江门":[113.06,22.61],
    "章丘":[117.53,36.72],
    "肇庆":[112.44,23.05],
    "大连":[121.62,38.92],
    "临汾":[111.5,36.08],
    "吴江":[120.63,31.16],
    "石嘴山":[106.39,39.04],
    "沈阳":[123.38,41.8],
    "苏州":[120.62,31.32],
    "茂名":[110.88,21.68],
    "嘉兴":[120.76,30.77],
    "长春":[125.35,43.88],
    "胶州":[120.03336,36.264622],
    "银川":[106.27,38.47],
    "张家港":[120.555821,31.875428],
    "三门峡":[111.19,34.76],
    "锦州":[121.15,41.13],
    "南昌":[115.89,28.68],
    "柳州":[109.4,24.33],
    "三亚":[109.511909,18.252847],
    "自贡":[104.778442,29.33903],
    "吉林":[126.57,43.87],
    "阳江":[111.95,21.85],
    "泸州":[105.39,28.91],
    "西宁":[101.74,36.56],
    "宜宾":[104.56,29.77],
    "呼和浩特":[111.65,40.82],
    "成都":[104.06,30.67],
    "大同":[113.3,40.12],
    "镇江":[119.44,32.2],
    "桂林":[110.28,25.29],
    "张家界":[110.479191,29.117096],
    "宜兴":[119.82,31.36],
    "北海":[109.12,21.49],
    "西安":[108.95,34.27],
    "金坛":[119.56,31.74],
    "东营":[118.49,37.46],
    "牡丹江":[129.58,44.6],
    "遵义":[106.9,27.7],
    "绍兴":[120.58,30.01],
    "扬州":[119.42,32.39],
    "常州":[119.95,31.79],
    "潍坊":[119.1,36.62],
    "重庆":[106.54,29.59],
    "台州":[121.420757,28.656386],
    "南京":[118.78,32.04],
    "滨州":[118.03,37.36],
    "贵阳":[106.71,26.57],
    "无锡":[120.29,31.59],
    "本溪":[123.73,41.3],
    "克拉玛依":[84.77,45.59],
    "渭南":[109.5,34.52],
    "马鞍山":[118.48,31.56],
    "宝鸡":[107.15,34.38],
    "焦作":[113.21,35.24],
    "句容":[119.16,31.95],
    "北京":[116.46,39.92],
    "徐州":[117.2,34.26],
    "衡水":[115.72,37.72],
    "包头":[110,40.58],
    "绵阳":[104.73,31.48],
    "乌鲁木齐":[87.68,43.77],
    "枣庄":[117.57,34.86],
    "杭州":[120.19,30.26],
    "淄博":[118.05,36.78],
    "鞍山":[122.85,41.12],
    "溧阳":[119.48,31.43],
    "库尔勒":[86.06,41.68],
    "安阳":[114.35,36.1],
    "开封":[114.35,34.79],
    "济南":[117,36.65],
    "德阳":[104.37,31.13],
    "温州":[120.65,28.01],
    "九江":[115.97,29.71],
    "邯郸":[114.47,36.6],
    "临安":[119.72,30.23],
    "兰州":[103.73,36.03],
    "沧州":[116.83,38.33],
    "临沂":[118.35,35.05],
    "南充":[106.110698,30.837793],
    "天津":[117.2,39.13],
    "富阳":[119.95,30.07],
    "泰安":[117.13,36.18],
    "诸暨":[120.23,29.71],
    "郑州":[113.65,34.76],
    "哈尔滨":[126.63,45.75],
    "聊城":[115.97,36.45],
    "芜湖":[118.38,31.33],
    "唐山":[118.02,39.63],
    "平顶山":[113.29,33.75],
    "邢台":[114.48,37.05],
    "德州":[116.29,37.45],
    "济宁":[116.59,35.38],
    "荆州":[112.239741,30.335165],
    "宜昌":[111.3,30.7],
    "义乌":[120.06,29.32],
    "丽水":[119.92,28.45],
    "洛阳":[112.44,34.7],
    "秦皇岛":[119.57,39.95],
    "株洲":[113.16,27.83],
    "石家庄":[114.48,38.03],
    "莱芜":[117.67,36.19],
    "常德":[111.69,29.05],
    "保定":[115.48,38.85],
    "湘潭":[112.91,27.87],
    "金华":[119.64,29.12],
    "岳阳":[113.09,29.37],
    "长沙":[113,28.21],
    "衢州":[118.88,28.97],
    "廊坊":[116.7,39.53],
    "菏泽":[115.480656,35.23375],
    "合肥":[117.27,31.86],
    "武汉":[114.31,30.52],
    "大庆":[125.03,46.58]
};

var convertData = function (data) {
    var res = [];
    for (var i = 0; i < data.length; i++) {
        var dataItem = data[i];
        var fromCoord = geoCoordMap[dataItem[0].name];
        var toCoord = geoCoordMap[dataItem[1].name];
        if (fromCoord && toCoord) {
            res.push([{
                coord: fromCoord
            }, {
                coord: toCoord
            }]);
        }
    }
    return res;
};