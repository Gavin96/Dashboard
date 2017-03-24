/**
 * Created by LIULU4 on 2016/3/23.
 */
// Not used for the moment, now panels are rendered at server side
var app=angular.module('components') // do not specify dependency so that it will use existing module
    .directive('dashboardPanel', ['$http','spinnerService', 'conditionInputValidator', 'toastr',
        function($http,spinnerService,conditionInputValidator, toastr){
        return {
            restrict: 'E',
            templateUrl: '/views/components/dashboardPanel.html',
            scope: {
                panelConfig: '=',
                dashboardConfig: '=',
            },
            link: function($scope, element, attributes) {
                var dashboardConfig = $scope.dashboardConfig;
                var panelConfig = $scope.panelConfig;

                if(panelConfig.active){
                    $scope.$on('dashboardConditionReady', function(event){
                        $scope.search();
                    });
                }

                $scope.disableBtn = false;

                $scope.RR=RR;

                $scope.searchbtn=RR("searchbtn");
                
                function upperCaseTableKeys(table){
                    _.each(table, function(row){
                        _.each(row, function(v, k){
                            row[k.toUpperCase()] = v;
                        })
                    });
                }

                function getParameters() {
                    var parameters = {};

                    var conditions = [].concat(dashboardConfig.condition, panelConfig.condition);

                    _.each(conditions, function (c) {
                        var conditionValue = c.conditionValue;
                        var storage = window.localStorage;
                        switch (c.type) {
                            case "Textbox":
                                parameters[c.key] = conditionValue;
                                storage.setItem(c._id,parameters[c.key]);
                                break;
                            case "Date":
                                if (conditionValue && _.isDate(conditionValue)) {
                                    conditionValue = moment(conditionValue).format('YYYY/MM/DD 00:00:00');
                                }
                                parameters[c.key] = conditionValue;
                                storage.setItem(c._id,parameters[c.key]);
                                break;
                            case "Combox":

                                storage.setItem(c._id,conditionValue);
                                if (conditionValue && _.isArray(conditionValue)) {
                                    conditionValue = conditionValue.join(',');
                                }
                                parameters[c.key] = conditionValue;

                                break;
                        }

                        if(parameters[c.key]==undefined)
                            storage.removeItem(c._id);
                    });
                    return parameters;
                }

                $scope.search = function()
                {
                    var panelConfigOk = conditionInputValidator.validate(panelConfig.condition);

                    if (panelConfigOk) {
                        $scope.disableBtn = true;
                        $(element.context).find('.ng-isolate-scope.ng-hide').removeClass('ng-hide');

                        var parameters = getParameters();
                        //parameter for sql query
                        var params = _.extend({
                            //used by runDashboard
                            reportId: dashboardConfig._id,
                            externalSystemId: dashboardConfig.externalSystemId || dashboardConfig.externalSystem[0],
                            connectionId: panelConfig.connection,
                            panelId: panelConfig._id,
                            data: parameters,
                            //used by /runchart
                            chartId: panelConfig._id,
                            dashBoardId: dashboardConfig._id,
                            timezone: (new Date()).getTimezoneOffset(),
                            filter: window.filter
                        }, panelConfig.chartType.indexOf('Chart') != -1 ? {
                            size: 0,
                            page: 0
                        } : {
                            size: $scope.gridResult.paginationOptions.pageSize,
                            page: $scope.gridResult.paginationOptions.pageNumber
                        });


                        //ask database for data
                        if(panelConfig.chartType.indexOf('Chart') != -1) {
                            $http.post('/runChart', params).then(function (data) {
                                data = data.data;
                                $scope.resultData = data;

                                //alert(panelConfig.datasource);
                                if (panelConfig.chartType.indexOf('Chart') != -1) {
                                    if (panelConfig.chartType == '地图 Map Chart') {
                                        $.get('/scripts/dashboardConfig/china.json', function (chinaJson) {
                                            echarts.registerMap('china', chinaJson);
                                            $scope.mychart = echarts.init($(element.context).find('.chartCanvas')[0], panelConfig.theme);
                                            $scope.mychart.setOption(data.option);
                                        })

                                    }
                                    else {
                                        $scope.mychart = echarts.init($(element.context).find('.chartCanvas')[0], panelConfig.theme);
                                        $scope.mychart.setOption(data.option);

                                    }
                                }
                                $(element.context).find('img').parent().addClass('ng-hide');
                                $scope.disableBtn = false;
                                $scope.$emit('processed');
                            }, function (response) {
                                $(element.context).find('img').parent().addClass('ng-hide');
                                $scope.disableBtn = false;
                                $scope.$emit('processed');
                                var error = response && response.data
                                    ? (response.data.error || '查询失败，请连系系统管理员')
                                    : '查询超时';
                                console.error(response.data.executedSqlStatement);
                                toastr.error(panelConfig.title + ' : ' + error);
                            })
                        }
                        else {
                            $http.post('/runDashboard', params).then(function (data) {
                                console.log(data);
                                console.log(panelConfig.jsCustomizationCode);
                                // 重现eval，将JS代码区域的操作应用使得将table中的数值数据转化成相应的图片
                                var options = [];
                                eval(panelConfig.jsCustomizationCode);
                                console.log(data);
                                options.forEach(function(option, index) {
                                    if(option.show !== ""){
                                        data.data.rows.forEach(function(data2, indexi){
                                            // console.log(option);
                                            data2[option.name] = option.func(data2[option.name]);
                                            data2[option.name].show = option.show;
                                        });
                                    }
                                });
                                console.log(data.data.rows);
                                var keys = [];
                                // console.log(data.data.rows[0]);
                                console.log(keys);
                                for ( var tempq in data.data.rows[0]) {
                                    if ( tempq != "maxrownumber" && tempq != "rn") {
                                        if ( data.data.rows[0][tempq]!= null) {
                                            keys.push({
                                                key:tempq,      // 获取列名，并赋值给keys[]
                                                show:data.data.rows[0][tempq]["show"]||"orign"                                               
                                            });
                                        }
                                    }
                                } // 获取键值，将列名显示出来
                                console.log(keys);

                                function gebstable( arows, keys) {

                                    $scope.workspaces = [];
                                    $scope.workspaces.push({ name: 'Workspace 1'});
                                    $scope.workspaces.push({ name: 'Workspace 2'});
                                    $scope.workspaces.push({ name: 'Workspace 3'});
                                    function makeRows(colData, arows, keys){
                                        var rows = [];
                                        var temobj = {};
                                        for ( var i = 0; i < arows.length; i++){
                                            temobj = {index:i};
                                            for( var j = 0; j < keys.length; j++){
                                                temobj[keys[j].key] = arows[i][keys[j].key];
                                                // 将行的值赋值到temobj这个结构体
                                            }
                                            rows.push($.extend(temobj, colData));
                                            // 再将temobj这个结构体中的值赋值到rows中，以备展示
                                        }
                                        // console.log(rows);
                                        return rows;
                                    }
                                    $scope.workspaces.forEach(function ( wk, index) {
                                        var colData = { workspace: wk.name};
                                        wk.rows = makeRows( colData, arows, keys);
                                        wk.bsTableControl = {
                                            options: {
                                                data: wk.rows,
                                                rowStyle: function( row, index){
                                                    return { classes: 'none'};
                                                },
                                                cache: false,
                                                height: 500,
                                                striped: true,
                                                pagination: true,
                                                pageSize: 7,
                                                pageList: [5, 10, 25, 50, 100, 200],
                                                search: true,
                                                showColumns: true,
                                                showRefresh: true,
                                                minimumCountColumns: 2,
                                                clickToSelect: false,
                                                showToggle: false,
                                                maintainSelected: false,
                                                searchAlign:'left',
                                                columns: [ {
                                                    field: 'index',
                                                    title: '#',
                                                    align: 'center',
                                                    valign: 'middle',
                                                    sortable: true
                                                }]
                                            }
                                        };

                                        for ( var i = 0; i < keys.length; i++){
                                            var tempobj = {align : 'center', valign: 'middle', sortable: true};
                                                if ( keys[i].show == "icon" ){
                                                    tempobj.formatter = (function (i) {
                                                        // console.log(i);
                                                        return function(value, row, index){
                                                            return '<img title="'+row[keys[i].key].org+'" src="img/' + row[keys[i].key].content + '"/>';
                                                        }
                                                    })(i);
                                                } else if(keys[i].show == "text"){
                                                    tempobj.formatter = (function(i){
                                                        return function( value, row, index){
                                                            return '<span title="' + row[keys[i].key].org + '">' + row[keys[i].key].content + '</span>';
                                                        }
                                                    })(i);
                                                }
                                            tempobj.field = keys[i].key;
                                            tempobj.title = keys[i].key.toUpperCase();
                                            wk.bsTableControl.options.columns.push(tempobj);
                                        }
                                    });

                                    $scope.changeCurrentWorkspace = function (wk) {
                                        $scope.currentWorkspace = wk;
                                    };  // 转换工作的区域
                                    $scope.currentWorkspace = $scope.workspaces[0];
                                }
                                gebstable(data.data.rows, keys);



                                data = data.data;
                                $scope.resultData = data;
                                //alert(panelConfig.datasource);
                                if (panelConfig.chartType == '表格 Table' || '红绿灯表格 Table2') {
                                    upperCaseTableKeys($scope.resultData.rows);
                                    $scope.gridResult.data = $scope.resultData.rows;
                                    $scope.gridResult.totalItems = $scope.resultData.totalItemCount;
                                }
                                else if (panelConfig.chartType == '网页') {
                                    panelConfig.webpageUrl = 'http://' + panelConfig.webpageUrl;
                                    element.children().remove();
                                    element.append("<iframe id ='fr' width='100%' height='" + panelConfig.frame.height * 32 + "'></iframe>");
                                    $('#fr').attr("src", panelConfig.webpageUrl);
                                    $('#fr').attr("id", "fr");
                                }
                                else if (panelConfig.chartType == '标签') {
                                    var labelData = $scope.resultData.rows;
                                    var label = panelConfig.jsCustomizationCode;
                                    var array = label.match(/#\w+/g);
                                    _.each(array, function (item) {
                                        label = label.replace(item, labelData[0][item.match(/\w+/g)[0].toLowerCase()]);
                                    })
                                    element.children().remove();
                                    var title = '<div align="center" style="font-size: 2em">' + panelConfig.title + '</div>';
                                    var content = '<div align="center">' + label;
                                    element.append(title);
                                    element.append(content);
                                }
                                $scope.$emit('processed');
                                $(element.context).find('img').parent().addClass('ng-hide');
                                $scope.disableBtn = false;
                            }, function (response) {
                                $(element.context).find('img').parent().addClass('ng-hide');
                                $scope.disableBtn = false;
                                var error = response && response.data
                                    ? (response.data.error || '查询失败，请连系系统管理员')
                                    : '查询超时';
                                console.error(response.data.executedSqlStatement);
                                toastr.error(panelConfig.title + ' : ' + error);
                                $scope.$emit('processed');
                            })
                        }
                    }
                };

                //design the interface
                $scope.gridResult = {
                    flatEntityAccess: true,
                    virtualizationThreshold: 10000, // use a large threshold so that auto height will work
                    enableRowSelection: ! $scope.disabled,
                    enableSelectAll: ! $scope.disabled,
                    selectionRowHeaderWidth: 35,
                    rowHeight: 30,
                    enablePaging: true,
                    enableVerticalScrollbar: true,
                    paginationPageSizes: [20, 50, 100],
                    paginationPageSize: 20,
                    paginationOptions: {
                        pageSize: 20,
                        pageNumber: 1
                    },
                    useExternalPagination: true,
                    paginationTemplate : '/views/gridPagination.html',
                    onRegisterApi: function (gridApi) {
                        $scope.gridApi = gridApi;
                        gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
                            $scope.gridResult .paginationOptions.pageNumber = newPage;
                            $scope.gridResult .paginationOptions.pageSize = pageSize;
                            $scope.search();
                        });
                    },
                    columnDefs: _.map($scope.panelConfig.detail, function(d){
                        // console.log($scope.panelConfig);
                        return {
                            name: d.key.toUpperCase(),
                            displayName: d.value,
                            cellTemplate: 'ui-grid/uiGridCell',
                            width: 200
                        }
                    }),
                    downloadAll: function(){
                        var panelConfigOk = conditionInputValidator.validate(panelConfig.condition);

                        if (panelConfigOk) {
                            var parameters = getParameters();
                            var body = {
                                reportId: dashboardConfig._id,
                                externalSystemId: dashboardConfig.externalSystemId || dashboardConfig.externalSystem[0],
                                connectionId: panelConfig.connection,
                                panelId: panelConfig._id,
                                data: parameters,
                                timezone: (new Date()).getTimezoneOffset(),
                                page: 0,
                                size: 0,
                                filter: window.filter
                            }
                        }
                        window.open('/DownloadAll?json='+encodeURIComponent(JSON.stringify(body)));
                    }
                };

                //adjust the picture size
                function adjustTablePanelSize() {
                    var contentPanels = $('.content-panel');
                    _.each(contentPanels, function (tableContainer) {
                        var table = $(tableContainer).find('.ui-grid');
                        angular.element(table).css('height', tableContainer.clientHeight - 37);// 35 is height of pagination bar
                        var viewport = $(tableContainer).find('.chartCanvas');
                        $(viewport).height(tableContainer.clientHeight - 68);
                    });
                }

                $(window).resize(function(){
                    if($scope.mychart) {
                        $scope.mychart.resize();
                    }
                });

                $('.grid-stack').on('change', function(event, obj){
                    if($scope.mychart) {
                        $scope.mychart.resize();
                    }
                    adjustTablePanelSize();
                    // trigger window resize event otherwise ui-grid will suck
                    setTimeout(function(){$(window).trigger('resize');}, 100);
                });

                //refresh
                if (panelConfig.autoRefresh) {
                    setInterval(function () {
                        $scope.search();
                    },panelConfig.refreshInterval * 1000);
                }

                setTimeout(function(){
                    adjustTablePanelSize();
                    setTimeout(function(){$(window).trigger('resize');}, 100);
                }, 300);
            }
        };

    }])
