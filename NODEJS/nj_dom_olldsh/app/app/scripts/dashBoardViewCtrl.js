var app = angular.module('dashBoardViewApp',['ui.grid','ui.grid.edit', 'ui.grid.pagination','ui.grid.resizeColumns', 'ui.grid.moveColumns',
    'toastr','eeError','ui.grid.exporter','gridstack-angular','ui.date', 'components','angularSpinners']);
app.controller('dashBoardViewCtrl', ['$scope','$http', 'toastr','spinnerService',function ($scope, $http, toastr,spinnerService) {
    $scope.ReportInfo = window.reportInfo;
    var dashBoardId = $scope.ReportInfo._id;
    var tmpcondition = $("#condition_name").attr('value').split(',');
    var name = [];
    var charts = [];

    $(".from_date").each(function(){
        $scope[(this.name).replace(".","_")+"_From_condition"]=new Date();
        $scope[(this.name).replace(".","_")+"_From_condition"].setDate($scope[(this.name).replace(".","_")+"_From_condition"].getDate()-7);

    });
    $(".to_date").each(function(){
        $scope[(this.name).replace(".","_")+"_To_condition"]=new Date();
    });

    $scope.paginationOptions = {
        pageNumber: 1,
        pageSize: 20000
    };

    $(function() {
        $('.chosen-select').chosen();
    });

    $scope.globalBtnDisable = false;

    var runChart = function(i, triggerByGridPaging){
        var spinnerName = 'mySpinner'+i;

        if(!$scope.ReportInfo.panels[i].chartType){
            spinnerService.hide(spinnerName);
        }else {
            var chartId = $scope.ReportInfo.panels[i]._id;
            var condition = $("#condition_name" + i).attr('value');
            var conditions = condition.split(',');

            var isTable = $scope.ReportInfo.panels[i].chartType == '表格 Table' || '红绿灯表格 Table2';
            if(isTable && ! triggerByGridPaging){
                $scope['grid' + i].paginationOptions.pageNumber = 1;
                $scope['grid' + i].paginationCurrentPage = 1;
            }
            var pageInfo = isTable ?
            {
                size: $scope['grid' + i].paginationOptions.pageSize,
                page: $scope['grid' + i].paginationOptions.pageNumber
            }:{
                size: $scope.paginationOptions.pageSize,
                page: $scope.paginationOptions.pageNumber
            };

            var conditionData = _.extend({
                dashBoardId: dashBoardId,
                chartId: chartId,
                data: {}
            }, pageInfo);

            var conditionData = generateCriteria(conditions, conditionData, i);
            var dashConditionData = {data: {}}
            dashConditionData = generateCriteria(tmpcondition, dashConditionData, '');
            _.extend(conditionData.data, dashConditionData.data);
            conditionData.filter = window.filter;

            $http.post('/runChart', conditionData).then(function (data, status, headers, config) {
                var seq = i;
                if ($scope.ReportInfo.panels[seq].chartType.indexOf('Chart') != -1) { //ns 如果带Chart的话
                    if ($scope.ReportInfo.panels[seq].chartType == '地图 Map Chart') {
                        $.get('/scripts/dashboardConfig/china.json', function (chinaJson) {
                            echarts.registerMap('china', chinaJson);
                            charts[seq] = echarts.init(document.getElementById('chart' + seq), $scope.ReportInfo.panels[seq].theme);
                            charts[seq].setOption(data.data.option);
                        })
                    } else {
                        charts[seq] = echarts.init(document.getElementById('chart' + seq), $scope.ReportInfo.panels[seq].theme);
                        charts[seq].setOption(data.data.option);
                    }
                } else if ($scope.ReportInfo.panels[seq].chartType == '网页') {
                    $scope.ReportInfo.panels[seq].webpageUrl = 'http://' + $scope.ReportInfo.panels[seq].webpageUrl;
                    var dom = $('#chart' + seq);
                    dom.children().remove();
                    dom.append("<iframe id ='fr' width='100%' height='" + $scope.ReportInfo.panels[seq].frame.height * 32 + "'></iframe>");
                    $('#fr').attr("src", $scope.ReportInfo.panels[seq].webpageUrl);
                    $('#fr').attr("id", "fr" + seq);
                } else if ($scope.ReportInfo.panels[seq].chartType == '表格 Table' || '红绿灯表格 Table2') {  //ns 如果是table
                    $scope['grid' + seq].data = data.data.rawData;
                    $scope['grid' + seq].totalItems = data.data.totalItems;
                } else if ($scope.ReportInfo.panels[seq].chartType == '标签') {
                    var labelData = data.data.rawData[0];
                    var label = $scope.ReportInfo.panels[seq].jsCustomizationCode;
                    var array = label.match(/#\w+/g);
                    _.each(array, function (item) {
                        label = label.replace(item, labelData[item.match(/\w+/g)[0].toLowerCase()]);
                    })
                    var dom = $('#chart' + seq);
                    dom.children().remove();
                    var title = '<div align="center" style="font-size: 2em">' + $scope.ReportInfo.panels[seq].title + '</div>';
                    var content = '<div align="center">' + label + '</div>';
                    dom.append(title);
                    dom.append(content);
                }
                spinnerService.hide(spinnerName);
                $scope.globalBtnDisable = false;
            }, function(response){
                spinnerService.hide(spinnerName);
                $scope.globalBtnDisable = false;
                var error = response && response.data
                    ? (response.data.error || '查询失败，请连系系统管理员')
                    : '查询超时';
                toastr.error(error);
            })
        }
    }

    $scope.runChart = runChart;

    //run the report
    $scope.searchCharts = function () {
        if(checkCondition()){
            $scope.$error = checkCondition();
            return false;
        }
        $scope.$error = null;

        spinnerService.showGroup('reportFoo');
        $scope.globalBtnDisable = true;
        _.each($scope.ReportInfo.panels, function(panel, i){
            runChart(i);
        })

    };

    if(_.isEmpty($scope.ReportInfo.condition)){
        setTimeout(function() {
            _.each($scope.ReportInfo.panels, function(panel, i){
                if(_.isEmpty(panel.condition)){
                    runChart(i);
                }
            });
        });
    }

    Date.prototype.Format = function(fmt)
    {
        var o = {
            "M+" : this.getMonth()+1,
            "d+" : this.getDate(),
            "h+" : this.getHours(),
            "m+" : this.getMinutes(),
            "s+" : this.getSeconds(),
            "q+" : Math.floor((this.getMonth()+3)/3),
            "S"  : this.getMilliseconds()
        };
        if(/(y+)/.test(fmt))
            fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
        for(var k in o)
            if(new RegExp("("+ k +")").test(fmt))
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
        return fmt;
    };

    function generateCriteria(conditionlist, conditionData,seq){
        for(var i=0;i<conditionlist.length;i++){
            var pair = conditionlist[i].split("||");
            switch(pair[1]){
                case "Textbox":
                    conditionData.data[pair[2]]=$scope[pair[2].replace(".","_")+"_condition"+seq];
                    break;
                case "Combox":
                    if($scope[pair[2].replace(".","_")+"_condition"+seq] instanceof Array){
                        var tmpConditionArray = $scope[pair[2].replace(".","_")+"_condition"+seq];
                        var tmpArray = [];
                        var tmpConditionArrayLength = tmpConditionArray.length;
                        for(var x=0;x<tmpConditionArrayLength;x++){
                            if(tmpConditionArray[x].split("}").length>1){
                                for(var y = 0;y<(tmpConditionArray[x].split("}")[0]).split("|").length;y++){
                                    tmpArray.push((tmpConditionArray[x].split("}")[0]).split("|")[y]);
                                }
                            }
                        }
                        tmpConditionArray = [];
                        for(var x = 0;x<tmpArray.length;x++){
                            tmpConditionArray.push(tmpArray[x]);
                        }
                        if(tmpConditionArray!=[]){
                            if(!($("#"+pair[2].replace(".","_")+"_condition_default"+seq).attr('value'))){
                                conditionData.data[pair[2]]=tmpConditionArray;
                            }else{
                                conditionData.data[pair[2]] = (($("#"+pair[2].replace(".","_")+"_condition_default"+seq).attr('value')).split("}")[0]).split("|");
                            }
                        }else{
                            conditionData.data[pair[2]]=tmpConditionArray;
                        }

                    }else{
                        if($scope[pair[2].replace(".","_")+"_condition"+seq]){
                            if($scope[pair[2].replace(".","_")+"_condition"+seq].split("}").length>1){
                                var tmpArray = ($scope[pair[2].replace(".","_")+"_condition"+seq].split("}")[0]).split("|");
                                conditionData.data[pair[2]]=tmpArray;
                            }else{
                                conditionData.data[pair[2]]=$scope[pair[2].replace(".","_")+"_condition"+seq];
                            }
                        }else{
                            if(!($("#"+pair[2].replace(".","_")+"_condition_default"+seq).attr('value'))){
                                conditionData.data[pair[2]]=[];
                            }else{
                                conditionData.data[pair[2]] = (($("#"+pair[2].replace(".","_")+"_condition_default"+seq).attr('value')).split("}")[0]).split("|");
                            }
                        }
                    }
                    break;
                case "Date":
                    if($scope[pair[2].replace(".","_")+"_To_condition"+seq]) {
                        if ((new Date($scope[pair[2].replace(".", "_") + "_From_condition"+seq])) > (new Date($scope[pair[2].replace(".", "_") + "_To_condition"+seq]))) {
                            toastr.error("error");
                            return;
                        }
                        conditionData.data[pair[2]]={from:new Date($scope[pair[2].replace(".","_")+"_From_condition"+seq]).setHours(0,0,0,0),to:new Date($scope[pair[2].replace(".","_")+"_To_condition"+seq]).setHours(23,59,59,999)};
                    }else{
                        conditionData.data[pair[2]]={from:new Date($scope[pair[2].replace(".","_")+"_From_condition"+seq]).setHours(0,0,0,0),to:new Date('2200/12/31')};
                    }
                    break;
            }
        }
        return conditionData;
    }

    var checkCondition = function(){
        var errors;
        var conNames = _.pluck(_.filter($scope.ReportInfo.condition,function(obj){
            return obj.need == true;
        }),'key');
        var dashConditionData = {data:{}}
        dashConditionData = generateCriteria(tmpcondition,dashConditionData,'');
        angular.forEach(dashConditionData.data,function(v,k){
            if(_.indexOf(conNames,k)>-1 && (typeof v == 'undefined' || (v && v.length == 0))){
                if(errors)
                    errors[k]  = '必填字段';
                else{
                    errors = {};
                    errors[k] = '必填字段';
                }

            }
        });
        return errors;
    }

    $scope.searchChart = function(i){
        if(checkCondition()){
            $scope.$error = checkCondition();
            return false;
        }
        $scope.$error = null;

        var spinnerName = 'mySpinner'+i;
        spinnerService.show(spinnerName);
        runChart(i);

    }

    _.each($scope.ReportInfo.panels, function(panel, i){
            var seq = i;
            if($scope.ReportInfo.panels[seq].chartType) {
                if ($scope.ReportInfo.panels[seq].chartType.indexOf('Chart') != -1) {
                    charts[seq] = echarts.init(document.getElementById('chart' + seq));
                    if ($scope.ReportInfo.panels[seq].autoRefresh) {
                        var conditionStr = $('#condition_name' + seq).attr('value');
                        setInterval(function () {
                            $scope.searchChart(seq);
                        }, $scope.ReportInfo.panels[seq].refreshInterval * 1000);
                    }
                } else if ($scope.ReportInfo.panels[seq].chartType == '网页') {
                    $scope.ReportInfo.panels[seq].webpageUrl = 'http://' + $scope.ReportInfo.panels[seq].webpageUrl;
                    var dom = $('#chart' + seq);
                    dom.append("<iframe id ='fr' width='100%' height='" + $scope.ReportInfo.panels[seq].frame.height * 32 + "'></iframe>");
                    $('#fr').attr("src", $scope.ReportInfo.panels[seq].webpageUrl);
                    $('#fr').attr("id", "fr" + seq);
                } else if ($scope.ReportInfo.panels[seq].chartType == '表格 Table' || '红绿灯表格 Table2') {
                    var columns = [];
                    _.each($scope.ReportInfo.panels[seq].detail, function (item) {
                        columns.push({
                            field: item.key.toLowerCase(),
                            displayName: item.value.toLowerCase(),
                            width: 100
                        });
                    });
                    var gridId = 'grid' + seq;
                    $scope[gridId] = {
                        virtualizationThreshold: 10000,
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
                                $scope[gridId].paginationOptions.pageNumber = newPage;
                                $scope[gridId].paginationOptions.pageSize = pageSize;
                                $scope.runChart(seq, true);
                            });
                        }
                    };
                    $scope[gridId].columnDefs = columns;
                    $scope[gridId].data = $scope.ReportInfo.panels[seq].rawData;
                    if ($scope.ReportInfo.panels[seq].autoRefresh) {
                        setInterval(function () {
                            $scope.searchChart(seq);
                        }, $scope.ReportInfo.panels[seq].refreshInterval * 1000);
                    }
                    // ns 表格结束
                } else if ($scope.ReportInfo.panels[seq].chartType == '标签') {
                    if ($scope.ReportInfo.panels[seq].autoRefresh) {
                        setInterval(function () {
                            $scope.searchChart(seq);
                        }, $scope.ReportInfo.panels[seq].refreshInterval * 1000);
                    }
                }
            }
        }
    );

    function adjustTablePanelSize() {
        var tableContainers = $('.ee-table-container');
        _.each(tableContainers, function (tableContainer) {
            var table = $(tableContainer).find('.ui-grid');
            $(table).height(tableContainer.clientHeight - 37);// 35 is height of pagination bar
            var viewport = $(tableContainer).find('.ui-grid-viewport');
            $(viewport).height(tableContainer.clientHeight - 68);
        });
    }

    $('.grid-stack').on('change', function(event, obj){
        for(var i = 0;i < charts.length;i ++){
            var chart = charts[i];
            if(chart)
                chart.resize();
        }
        adjustTablePanelSize();
    });
    angular.element(document).ready(function(){
        adjustTablePanelSize();
    });
    angular.element(document).resize(function(){
        adjustTablePanelSize();
    });
}]);


