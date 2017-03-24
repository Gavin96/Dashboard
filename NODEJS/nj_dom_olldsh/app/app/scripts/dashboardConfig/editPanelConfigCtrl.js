/**
 * Created by LIULU4 on 2016/3/15.
 */
angular.module('panelConfigApp', [
        'toastr', 'ui.select',
        'ui.grid', 'ui.grid.edit', 'ui.grid.selection', 'ui.grid.cellNav', 'ui.grid.resizeColumns', 'ui.grid.moveColumns',
        'eeError', 'components', 'chartConfig','ui.ace','common','chart'])
    .controller('editPanelConfigCtrl', ['$scope', '$http', 'toastr', 'eeValidator', 'conditionGridValidator', 'ngDialog','uiGridConstants','$compile','chartFactory', '$timeout',
        function ($scope, $http, toastr, $eeValidator, conditionGridValidator, ngDialog, uiGridConstants, $compile, chartFactory, $timeout) {

            /***********************************************************
             * ****************initialization part**********************
             **********************************************************/
            $scope.chartTheme = chartFactory.getChartTheme();
            $scope.chartType = chartFactory.getChartType();
            (function(){
                chartFactory.getConnection().then(function(data){
                    $scope.connection = data;
                },function(data){
                    console.log(data + ' get con error!');
                });
            })();
            //extend this if config is saved
            $scope.panelConfig = chartFactory.initializeConfig($scope.$parent.panelInEdit);

            var initialState = chartFactory.typeChange($scope.panelConfig.chartType, $scope.panelConfig.moreConfig.legend.legendType);
            $scope.isWebpageType = initialState.isWebpageType;
            $scope.showTheme = initialState.needShowTheme;
            $scope.isTableType1 = initialState.isTableType1;
            $scope.isTableType2 = initialState.isTableType2;
            $scope.showJs = initialState.isTabType;
            $scope.isTabType = initialState.isTabType;
            $scope.showAxis = initialState.needShowAxis;
            $scope.disableLegendTypeRowOpt = initialState.disableLegendTypeRowOpt;
            $scope.disableLegendTypeColOpt = initialState.disableLegendTypeColOpt;
            $scope.disableLegendTypeNoneOpt = initialState.disableLegendTypeNoneOpt;
            $scope.disableLegendName = initialState.disableLegendName;
            $scope.legendValueMulti = initialState.isLegendValueMulti;
            $scope.disableSeriesData = initialState.disableSeriesData;
            $scope.disableSeriesName = initialState.disableSeriesName;
            $scope.seriesValueMulti = initialState.isSeriesValueMulti;

            if($scope.isTabType){
                $scope.mybtngroup1 = chartFactory.getActiveBtnClass();
                $scope.mybtngroup2 = chartFactory.getInactiveBtnClass();
            }else{
                $scope.mybtngroup2 = chartFactory.getActiveBtnClass();
                $scope.mybtngroup1 = chartFactory.getInactiveBtnClass();
            }

            //persistent data is {Array}
            //when value is not multi, need to transfer to string to bind
            if(!$scope.legendValueMulti){
                $scope.panelConfig.moreConfig.legend.value = $scope.panelConfig.moreConfig.legend.value.length==0?'':$scope.panelConfig.moreConfig.legend.value[0];
            }
            if(!$scope.seriesValueMulti){
                $scope.panelConfig.moreConfig.series.value = $scope.panelConfig.moreConfig.series.value.length==0?'':$scope.panelConfig.moreConfig.series.value[0];
            }

            var uigridConfig = {
                condition:{
                    virtualizationThreshold: 10000,
                    enableRowSelection: true,
                    enableSelectAll: true,
                    selectionRowHeaderWidth: 35,
                    rowHeight: 30,
                    onRegisterApi: function (gridApi) {
                        $scope.conditionApi = gridApi;
                    }
                },
                detail:{
                    virtualizationThreshold: 10000,
                    enableRowSelection: true,
                    enableSelectAll: true,
                    selectionRowHeaderWidth: 35,
                    rowHeight: 30,
                    onRegisterApi: function (gridApi) {
                        $scope.detailApi = gridApi;
                    }
                },
                axisConfig:{
                    selectionRowHeaderWidth: 35,
                    rowHeight: 30,
                    onRegisterApi: function (gridApi) {
                        $scope.axisConfigApi = gridApi;
                    }
                }
            };


            /*******************************************************
             ********************event bind*************************
             ******************************************************/
            $scope.chartTypeChange = function(){
                $scope.panelConfig.moreConfig.legend.legendType = $scope.panelConfig.chartType === chartFactory.getPieChart()?'col':'none';
                $scope.panelConfig.moreConfig.legend.value = '';
                $scope.panelConfig.moreConfig.series.name =  '';
                $scope.panelConfig.moreConfig.series.value = $scope.seriesValueMulti?[]:'';

                var state = chartFactory.typeChange($scope.panelConfig.chartType,$scope.panelConfig.moreConfig.legend.legendType);
                $scope.isWebpageType = state.isWebpageType;
                $scope.showTheme = state.needShowTheme;
                $scope.isTableType1 = state.isTableType1;
                $scope.isTableType2 = state.isTableType2;
                $scope.showJs = state.isTabType;
                $scope.isTabType = state.isTabType;
                $scope.showAxis = state.needShowAxis;
                $scope.disableLegendTypeRowOpt = state.disableLegendTypeRowOpt;
                $scope.disableLegendTypeNoneOpt = state.disableLegendTypeNoneOpt;
                $scope.disableLegendTypeColOpt = state.disableLegendTypeColOpt;
                $scope.disableLegendName = state.disableLegendName;
                $scope.legendValueMulti = state.isLegendValueMulti;
                $scope.disableSeriesData = state.disableSeriesData;
                $scope.disableSeriesName = state.disableSeriesName;
                $scope.seriesValueMulti = state.isSeriesValueMulti;
                uigridConfig.axisConfig.data = state.initAxisData;

                if($scope.isTabType){
                    $scope.mybtngroup1 = chartFactory.getActiveBtnClass();
                    $scope.mybtngroup2 = chartFactory.getInactiveBtnClass();
                }else{
                    $scope.mybtngroup2 = chartFactory.getActiveBtnClass();
                    $scope.mybtngroup1 = chartFactory.getInactiveBtnClass();
                }

                $scope.panelConfig.jsCustomizationCode = '';

            };

            $scope.legendTypeChange = function(){
                var state = chartFactory.typeChange($scope.panelConfig.chartType,$scope.panelConfig.moreConfig.legend.legendType);
                $scope.isWebpageType = state.isWebpageType;
                $scope.showTheme = state.needShowTheme;
                $scope.isTableType1 = state.isTableType1;
                $scope.isTableType2 = state.isTableType2;
                $scope.showJs = state.isTabType;
                $scope.isTabType = state.isTabType;
                $scope.showAxis = state.needShowAxis;
                $scope.disableLegendTypeRowOpt = state.disableLegendTypeRowOpt;
                $scope.disableLegendTypeNoneOpt = state.disableLegendTypeNoneOpt;
                $scope.disableLegendTypeColOpt = state.disableLegendTypeColOpt;
                $scope.disableLegendName = state.disableLegendName;
                $scope.legendValueMulti = state.isLegendValueMulti;
                $scope.disableSeriesData = state.disableSeriesData;
                $scope.disableSeriesName = state.disableSeriesName;
                $scope.seriesValueMulti = state.isSeriesValueMulti;

                if($scope.isTabType){
                    $scope.mybtngroup1 = chartFactory.getActiveBtnClass();
                    $scope.mybtngroup2 = chartFactory.getInactiveBtnClass();
                }else{
                    $scope.mybtngroup2 = chartFactory.getActiveBtnClass();
                    $scope.mybtngroup1 = chartFactory.getInactiveBtnClass();
                }

                $scope.panelConfig.moreConfig.legend.value = $scope.legendValueMulti?[]:'';
                $scope.panelConfig.moreConfig.series.name =  '';
                $scope.panelConfig.moreConfig.series.value = $scope.seriesValueMulti?[]:'';
            };

            $scope.connectionChange = function(){
                var match = _.findWhere($scope.connection,{_id:$scope.panelConfig.connection});
                $scope.panelConfig.connectionName = match['connectionName'];
            };

            $scope.showJS = function(){
                $scope.mybtngroup1 = chartFactory.getActiveBtnClass();
                $scope.mybtngroup2 = chartFactory.getInactiveBtnClass();
                $scope.showJs = true;
            };
            $scope.showCfg = function(){
                $scope.mybtngroup1 = chartFactory.getInactiveBtnClass();
                $scope.mybtngroup2 = chartFactory.getActiveBtnClass();
                $scope.showJs = false;
            };

            $scope.viewDoc = function(){
                window.open('/dashboardConfig/doc#'+ chartFactory.getDocId($scope.panelConfig.chartType),'_blank');
            };


            //---copy from reportconfig---
            var columnDef = function(){

                var typeOptions = [
                    {
                        value:"Textbox"
                    },
                    {
                        value:"Combox"
                    },
                    {
                        value:"Date"
                    }
                ];

                uigridConfig.condition.columnDefs = [
                    {
                        name: 'key', enableCellEdit: false, displayName: '关键字',
                        cellTemplate: '<input type="text" style="height:100%;padding: 6px 12px;text-align: center;" ng-model="row.entity.key" class="uppercase" name="key" required ng-maxlength="100"/>'
                    },
                    {
                        name: 'name', enableCellEdit: false, displayName: '显示名称',
                        cellTemplate: '<input type="text" style="height:100%;padding: 6px 12px;text-align: center;" ng-model="row.entity.name" name="name" required ng-maxlength="100"/>'
                    },
                    {
                        name: 'need', enableCellEdit: false, displayName: '必填',
                        cellTemplate: '<input type="checkbox" style="height:100%;padding: 6px 12px;text-align: center;" ng-model="row.entity.need" name="need"/>'
                    },
                    {
                        name: 'type', enableCellEdit: false, displayName: '控件类型',
                        editableCellTemplate: 'ui-grid/dropdownEditor',
                        editDropdownValueLabel: 'value',
                        editDropdownIdLabel: 'value',
                        editDropdownOptionsArray: typeOptions,
                        cellTemplate: '<select ng-model="row.entity.type" class="eir-grid-cell form-control" name="type" ng-options="cst.value as cst.value for cst in col.colDef.editDropdownOptionsArray" ></select>'
                    },
                    {
                        name: 'multi', enableCellEdit: true, displayName: '多值',
                        cellTemplate: '<input type="checkbox" style="height:100%;padding: 6px 12px;text-align: center;" ng-model="row.entity.multi" name="multi"/>'
                    },
                    {
                        name: 'value', enableCellEdit: true, displayName: '值列表',
                        cellTemplate: '<input type="text" style="height:100%;padding: 6px 12px;text-align: center;" ng-model="row.entity.value" name="conditionvalue" placeholder="A,B,C..."/>'
                    },
                    {
                        name: 'convertTimezone', enableCellEdit: true, displayName: '转换时区',
                        cellTemplate: '<input type="checkbox" style="height:100%;padding: 6px 12px;text-align: center;" ng-model="row.entity.convertTimezone" name="convertTimezone"/>'
                    },
                    {
                        name:'sequenceNum', visible:false,
                        sort: {
                            direction: uiGridConstants.DESC,
                            priority: 1
                        }
                    }
                ];
                uigridConfig.condition.multiSelect = true;

                uigridConfig.detail.columnDefs = [
                    {
                        name: 'key', enableCellEdit: false, displayName: '关键字',width:'320',
                        cellTemplate: '<input type="text" style="height:100%;padding: 6px 12px;text-align: center;" ng-model="row.entity.key" class="uppercase" name="key" required ng-maxlength="100"/>'
                    },
                    {
                        name: 'value', enableCellEdit: false, displayName: '显示名称',width:'320',
                        cellTemplate: '<input type="text" style="height:100%;padding: 6px 12px;text-align: center;" ng-model="row.entity.value" name="value" required ng-maxlength="100"/>'
                    },
                    {
                        name: 'convertTimezone', enableCellEdit: true, displayName: '转换时区',width:'320',
                        cellTemplate: '<input type="checkbox" style="height:100%;padding: 6px 12px;text-align: center;" ng-model="row.entity.convertTimezone" name="convertTimezone" />'
                    },

                ];
                uigridConfig.detail.multiSelect = true;

                uigridConfig.axisConfig.columnDefs = [
                    {
                        name:'which', enableCellEdit: false, displayName: '轴',width:'9%',
                        cellTemplate: '<input type="text" style="height:100%;padding: 6px 12px;text-align: center;" ng-model="row.entity.which" name="which" disabled/>'
                    },
                    {
                        name:'name',enableCellEdit: false, displayName: '名称',width:'16.5%',
                        cellTemplate: '<input type="text" style="height:100%;padding: 6px 12px;text-align: center;" ng-model="row.entity.name" name="name" />'
                    },
                    {
                        name:'type',enableCellEdit: false, displayName: '类别',width:'21%',
                        editableCellTemplate: 'ui-grid/dropdownEditor',
                        editDropdownValueLabel: 'value',
                        editDropdownIdLabel: 'value',
                        editDropdownOptionsArray: [{'value':'value'},{'value':'category'}],
                        cellTemplate: '<select ng-model="row.entity.type" class="eir-grid-cell form-control" name="type" ng-options="cst.value as cst.value for cst in col.colDef.editDropdownOptionsArray" ng-change="row.entity.data = \'\'" ><option value=""></option></select>'
                    },
                    {
                        name:'max',enableCellEdit: false, displayName: '最大值',width:'13%',
                        cellTemplate: '<input type="text" style="height:100%;padding: 6px 12px;text-align: center;" ng-model="row.entity.max" name="max" />'
                    },
                    {
                        name:'interval',enableCellEdit: false, displayName: '坐标轴刻度间隔',width:'24%',
                        cellTemplate: '<input type="text" style="height:100%;padding: 6px 12px;text-align: center;" ng-model="row.entity.interval" name="interval" />'

                    },
                    {
                        name:'data',enableCellEdit: false, displayName: '数据',width:'17%',
                        editableCellTemplate: 'ui-grid/dropdownEditor',
                        editDropdownValueLabel: 'value',
                        editDropdownIdLabel: 'sequenceNum',
                        editDropdownOptionsArray: $scope.panelConfig.detail,
                        cellTemplate: '<select ng-model="row.entity.data" class="eir-grid-cell form-control" name="data" ng-options="cst.key as cst.value for cst in col.colDef.editDropdownOptionsArray" ng-disabled="row.entity.type == \'value\'"><option value=""></option></select>'
                    }
                ];

            };
            var headOptions = [],selectOptions = [],whereOptions = [];
            var select = [],where = [];

            var columnInit = function(){
                uigridConfig.condition.data = $scope.panelConfig.condition;
                uigridConfig.detail.data = $scope.panelConfig.detail;
                uigridConfig.axisConfig.data = $scope.panelConfig.moreConfig.axis;
            };

            var columnReset = function(){
                headOptions = [];
                uigridConfig.condition.data = [];
                uigridConfig.detail.data = [];
            };


            var sqlParse = function(){
                headOptions = [];
                selectOptions = [];
                whereOptions = [];
                var sql = $scope.panelConfig.datasource.replace("\r\n"," ");
                sql=sql.replace(/(\s+$)|(^\s+)/g,"");
                sql=sql.replace(/\s+/g," ");
                sql = sql.split(" ");
                var selectsql = "";
                var wheresql = "";
                var selectitem = [];
                var flag = 0;

                var whereitem = [];
                for(var i = 0;i<sql.length;i++){
                    if(sql[i].toLowerCase()=="from"){
                        flag = 3;
                    }
                    if(flag == 1) {
                        selectsql = selectsql+sql[i]+" ";
                    }
                    if(sql[i].toLowerCase()=="select"){
                        flag = 1;
                    }

                    if(flag == 2){
                        wheresql = wheresql + sql[i] + " ";
                    }
                    if(sql[i].toLowerCase()=="where") {
                        flag =2;
                    }
                }
                select = selectsql.split(",");
                for(var i=0;i<select.length;i++){
                    selectitem = select[i].split(/\sas\s/i);
                    if(selectitem.length==2){
                        select[i] = {key:selectitem[1].trim()};
                    }else{
                        select[i] = {key:select[i].trim()};
                    }
                    selectOptions.push(select[i]);
                    headOptions.push(select[i]);
                }
                where = wheresql.split("#");
                for(var i=1;i<where.length;i++){
                    whereitem = where[i].split(" ");
                    where[i] = {key:(((whereitem[0].trim()).replace('(',"")).replace(')',"")).replace('%',"")};
                    whereOptions.push(where[i]);
                }
            };

            var swap = function(list,i,j){
                var tmp = list[i];
                list[i]=list[j];
                list[j]=tmp;
            };

            var autoAddCondition = function(key){
                var newRow = {
                    key:key,
                    name:key,
                    need:false,
                    type:'Textbox',
                    multi:false,
                    value:null,
                    convertTimezone:false,
                    sequenceNum:1
                };
                for(var i=0;i<uigridConfig.condition.data.length;i++){
                    uigridConfig.condition.data[i].sequenceNum++;
                }
                uigridConfig.condition.data.push(newRow);
            };

            var autoAddDetail = function(key){
                var data = uigridConfig.detail.data;
                var newRow = {
                    key:key,
                    value:key,
                    convertTimezone:'',
                    sequenceNum:1
                };
                for(var i=0;i<data.length;i++){
                    data[i].sequenceNum++;
                }
                data.push(newRow);
            };

            $scope.addCondition = function(){
                sqlParse();
                var data = uigridConfig.condition.data;
                var newRow = {
                    key:'',
                    name:'',
                    need:'',
                    type:'',
                    multi:'',
                    value:'',
                    convertTimezone:'',
                    sequenceNum:1
                };
                for(var i=0;i<data.length;i++){
                    data[i].sequenceNum++;
                }
                data.push(newRow);
                $scope.uigridConfig = uigridConfig;
            };

            $scope.addDetail = function(){
                sqlParse();
                var data = uigridConfig.detail.data;
                var newRow = {
                    key:"",
                    value:"",
                    sequenceNum:1
                };
                for(var i=0;i<data.length;i++){
                    data[i].sequenceNum++;
                }
                data.push(newRow);
                $scope.uigridConfig = uigridConfig;
            };

            $scope.delete = function(type){
                switch(type){
                    case 'condition':{
                        var selectRows = $scope.conditionApi.selection.getSelectedRows();
                        var data = uigridConfig.condition.data;
                    }
                        break;
                    case 'detail':{
                        var selectRows = $scope.detailApi.selection.getSelectedRows();
                        var data = uigridConfig.detail.data;
                    }
                        break;
                }
                if (selectRows.length > 0) {
                    for(var i=0;i<selectRows.length;i++) {
                        for(var j=0;j<data.length;j++)
                        if(selectRows[i]==data[j])
                        data.splice(j, 1);
                    }
                }
                $scope.uigridConfig = uigridConfig;
            };

            $scope.up = function(type){
                switch(type){
                    case 'condition':{
                        var selectRows = $scope.conditionApi.selection.getSelectedRows();
                        var data = uigridConfig.condition.data;
                    }
                        break;
                    case 'detail':{
                        var selectRows = $scope.detailApi.selection.getSelectedRows();
                        var data = uigridConfig.detail.data;
                    }
                        break;
                }

                if (selectRows.length > 0) {
                    var selectRowList = [];
                    var exchangeList = [];
                    var tmp = 100000;
                    var flag = 1;
                    var rowNum;
                    for(var i = 0;i<selectRows.length;i++) {
                        selectRowList.push(selectRows[i].sequenceNum);
                    }
                    for(var i = 0;i<selectRows.length;i++) {
                        tmp = 100000;
                        for(var j = 0;j<data.length;j++){
                            flag = 1;
                            for(var k = 0;k<selectRowList.length;k++){
                                if(selectRowList[k]==data[j].sequenceNum){
                                    flag =2;
                                }
                            }
                            if(data[j].sequenceNum>selectRows[i].sequenceNum&&data[j].sequenceNum<tmp&&flag!=2){
                                tmp = data[j].sequenceNum;
                                rowNum = j;
                            }
                        }
                        if(tmp!=100000){
                            exchangeList.push({exchange:rowNum,select:i,num:selectRows[i].sequenceNum});
                        }
                    }
                    for(var i=0;i<exchangeList.length;i++)
                    {
                        for (var j=exchangeList.length -1 ;j>i;j--)
                        {
                            if (exchangeList[i].num < exchangeList[j].num)
                                swap(exchangeList,i,j);
                        }
                    }
                    for(var i=0;i<exchangeList.length;i++){
                        var exchangeNum=data[exchangeList[i].exchange].sequenceNum;
                        data[exchangeList[i].exchange].sequenceNum=selectRows[exchangeList[i].select].sequenceNum;
                        selectRows[exchangeList[i].select].sequenceNum = exchangeNum;
                    }
                }
                $scope.uigridConfig = uigridConfig;
            };

            $scope.down = function(type){
                switch(type){
                    case 'condition':{
                        var selectRows = $scope.conditionApi.selection.getSelectedRows();
                        var data = uigridConfig.condition.data;
                    }
                        break;
                    case 'detail':{
                        var selectRows = $scope.detailApi.selection.getSelectedRows();
                        var data = uigridConfig.detail.data;
                    }
                        break;
                }
                if (selectRows.length > 0) {
                    var selectRowList = [];
                    var exchangeList = [];
                    var tmp = 0;
                    var flag = 1;
                    var rowNum;
                    for(var i = 0;i<selectRows.length;i++) {
                        selectRowList.push(selectRows[i].sequenceNum);
                    }
                    for(var i = 0;i<selectRows.length;i++) {
                        tmp = 0;
                        for(var j = 0;j<data.length;j++){
                            flag = 1;
                            for(var k = 0;k<selectRowList.length;k++){
                                if(selectRowList[k]==data[j].sequenceNum){
                                    flag =2;
                                }
                            }
                            if(data[j].sequenceNum<selectRows[i].sequenceNum&&data[j].sequenceNum>tmp&&flag!=2){
                                tmp = data[j].sequenceNum;
                                rowNum = j;
                            }
                        }
                        if(tmp!=0){
                            exchangeList.push({exchange:rowNum,select:i,num:selectRows[i].sequenceNum});
                        }
                    }
                    for(var i=0;i<exchangeList.length;i++)
                    {
                        for (var j=exchangeList.length -1 ;j>i;j--)
                        {
                            if (exchangeList[i].num > exchangeList[j].num)
                                swap(exchangeList,i,j);
                        }
                    }
                    for(var i=0;i<exchangeList.length;i++){

                        var exchangeNum=data[exchangeList[i].exchange].sequenceNum;
                        data[exchangeList[i].exchange].sequenceNum=selectRows[exchangeList[i].select].sequenceNum;
                        selectRows[exchangeList[i].select].sequenceNum = exchangeNum;
                    }
                }
                $scope.uigridConfig = uigridConfig;
            };

            // use matching parenthese to detect bad column result
            function isCorrectResultColumnKey(s){
                var p = 0;
                for(var i = 0;i < s.length;i ++){
                    var c = s.charAt(i);
                    if(c == '('){
                        p ++;
                    }else if(c == ')'){
                        p --;
                    }
                }
                return p == 0;
            }

            $scope.autoPrint = function () {
                columnReset();
                if($scope.panelConfig.datasource!==""){
                    sqlParse();
                    for(var i=0;i<select.length;i++){
                        if(isCorrectResultColumnKey(select[i].key)){
                            autoAddDetail(select[i].key.toUpperCase());
                        }
                    }

                    var dashboardConditionKeys = [];
                    _.each($scope.$parent.dashboardConfig.condition, function(c){
                        if(c.key){
                            dashboardConditionKeys.push(c.key.toUpperCase());
                        }
                    });
                    for(var i=1;i<where.length;i++){
                        if(_.indexOf(dashboardConditionKeys,where[i].key.toUpperCase())<0){
                            autoAddCondition(where[i].key.toUpperCase());
                        }
                    }

                    $scope.panelConfig.condition = uigridConfig.condition.data;
                    $scope.panelConfig.detail = uigridConfig.detail.data;

                    columnDef();//更新x,y轴 config下拉选项

                }
                else{
                    toastr.error("请先输入sql语句！");
                }
            };


            /**
             * generate js code according to the chart config
             * except map and other type
             * @return {String}
             */
            var genOpt = function(){
                var chartType = $scope.panelConfig.chartType,
                    legendType = $scope.panelConfig.moreConfig.legend.legendType,
                    legendValue = $scope.panelConfig.moreConfig.legend.value,
                    seriesValue = $scope.panelConfig.moreConfig.series.value,
                    seriesName = $scope.panelConfig.moreConfig.series.name;

                //additional functions
                var getShowName = function(key){
                    var des = _.find($scope.panelConfig.detail,function(obj){
                        return obj.key === key;
                    });
                    return des?des.value:'';
                };
                var isActive = function(axis){
                    return !(!axis.type && !axis.name && !axis.max && !axis.interval);
                };
                var getDataType = function(chartType){
                    switch (chartType){
                        case '柱状图 Bar Chart':return 'bar';
                        case '折线图 Line Chart':return 'line';
                        case '散点图 Scatter Chart':return 'scatter';
                        case '饼图 Pie Chart':return 'pie';
                        case '雷达图 Radar Chart':return 'radar';
                        case '仪表盘 Gauge Chart':return 'gauge';
                        default:return 'line';
                    }
                };

                //generate functions
                var genTitle = function(){
                        var obj = {title:{x:'center'}};
                        obj.title.text = $scope.panelConfig.title;
                        return obj;
                    },
                    genTooltip = function(){
                        var obj = {tooltip:{}};
                        if(_.indexOf(chartFactory.getAxisTypeChart(),chartType)>-1){
                            obj.tooltip.trigger = 'axis';
                        }
                        if(_.indexOf(chartFactory.getItemTypeChart(),chartType)>-1){
                            obj.tooltip.trigger = 'item';
                        }
                        return obj;
                    },
                    genToolbox = function(){
                        return {toolbox:
                        {
                            feature:{
                                dataView:{readOnly:false},
                                restore:{},
                                saveAsImage:{},
                                magicType:{type: ['line', 'bar', 'stack', 'tiled']}}}};
                    },
                    genLegend = function(){
                        var obj = {legend:{left:'',top:'',right:'',bottom:'',padding:'', orient:'vertical'}};
                        var dataStr = '';
                        if(_.indexOf(chartFactory.getSequenceChart(),chartType)>-1 || chartType === chartFactory.getScatterChart()){
                            if(legendType === 'none'){
                                return null;
                            }
                            if(legendType === 'col'){
                                dataStr = ['#',legendValue].join('');
                                obj.legend.data = [dataStr];
                            }
                            if(legendType === 'row'){
                                obj.legend.data = [];
                                for(var i=0;i<legendValue.length;i++){
                                    dataStr = getShowName(legendValue[i]);
                                    obj.legend.data.push(dataStr);
                                }
                            }
                        }else if(_.indexOf(chartFactory.getKeyvalueChart(),chartType)>-1 || chartType === chartFactory.getRadarChart()){
                            if(legendType === 'none'){
                                return null;
                            }
                            if(legendType === 'col'){
                                dataStr = ['#',legendValue].join('');
                                obj.legend.data = [dataStr];
                            }
                        }
                        return obj;
                    },
                    genXaxis = function(){
                        var obj = {xAxis:[{}]};
                        var xaxis = uigridConfig.axisConfig.data[0];
                        if(!isActive(xaxis)) return null;
                        obj.xAxis[0].type = xaxis.type;
                        obj.xAxis[0].name = xaxis.name;
                        if(xaxis.max) obj.xAxis[0].max = xaxis.max;
                        if(xaxis.interval) obj.xAxis[0].interval = xaxis.interval;
                        if(xaxis.data && xaxis.type === 'category') obj.xAxis[0].data = [['#',xaxis.data].join('')];
                        return obj;
                    },
                    genYaxis = function(){
                        var obj = {yAxis:[]};
                        var yaxis1 = uigridConfig.axisConfig.data[1],yaxis2 = uigridConfig.axisConfig.data[2];
                        if(!isActive(yaxis1)) return null;
                        var yobj1 = {};
                        yobj1.type = yaxis1.type;
                        yobj1.name = yaxis1.name;
                        if(yaxis1.max) yobj1.max = yaxis1.max;
                        if(yaxis1.interval) yobj1.interval = yaxis1.interval;
                        if(yaxis1.data && yaxis1.type === 'category') yobj1.data = [['#',yaxis1.data].join('')];
                        obj.yAxis.push(yobj1);
                        if(isActive(yaxis2)){
                            var yobj2 = {};
                            yobj2.type = yaxis2.type;
                            yobj2.name = yaxis2.name;
                            if(yaxis2.max) yobj2.max = yaxis2.max;
                            if(yaxis2.interval) yobj2.interval = yaxis2.interval;
                            if(yaxis2.data && yaxis2.type === 'category') yobj2.data = [['#',yaxis2.data].join('')];
                            obj.yAxis.push(yobj2);
                        }
                        return obj;
                    },
                    genPolarForRadar = function(){
                        if(chartType === chartFactory.getRadarChart()){
                            var obj = {radar:{indicator:[]}};
                            obj.radar.indicator.push({name:['#',seriesName].join('')});
                            return obj;
                        }
                        return null;
                    },
                    genSeriesData = function(){
                        var obj = {series:[]};
                        var type = getDataType(chartType);
                        if(_.indexOf(chartFactory.getSequenceChart(),chartType)>-1){
                            if(legendType === 'none'){
                                var seobj = {type:type};
                                seobj.name = getShowName(seriesValue);
                                seobj.data = [];
                                seobj.data.push(['#',seriesValue].join(''));
                                obj.series.push(seobj);
                            }
                            if(legendType === 'col'){
                                var seobj = {type:type};
                                seobj.data = [];

                                seobj.data.push(['#',seriesValue].join(''));

                                obj.series.push(seobj);
                            }
                            if(legendType === 'row'){
                                var seobj;
                                for(var i=0;i<legendValue.length;i++){
                                    seobj = {};
                                    seobj.type = type;
                                    seobj.name = getShowName(legendValue[i]);
                                    seobj.data = ['#',legendValue[i]].join('');
                                    obj.series.push(seobj);
                                }
                            }
                        }
                        if(chartType === chartFactory.getScatterChart()){
                            var seobj = {type:type,name:''};
                            seobj.data = [];
                            for(var i=0;i<seriesValue.length;i++){
                                seobj.data.push(['#', seriesValue[i]].join(''));
                            }
                            obj.series.push(seobj);
                        }
                        if(_.indexOf(chartFactory.getKeyvalueChart(),chartType)>-1){
                            var seobj = {name:'',type:type};
                            seobj.data = [{value:['#',seriesValue].join(''),name:['#',seriesName].join('')}];
                            obj.series.push(seobj);
                        }
                        if(chartType === chartFactory.getRadarChart()){
                            var seobj = {type:type,name:''};
                            seobj.data = [];
                            seobj.data.push(['#',seriesValue].join(''));
                            obj.series.push(seobj);
                        }

                        return obj;
                    };
                var opts = _.extend(genTitle(),genTooltip(),genToolbox(),genLegend(),genXaxis(),genYaxis(),genPolarForRadar(),genSeriesData());
                return 'option = ' + JSON.stringify(opts,null,2);
            };

            /**
             * generate map js code
             * @returns {string}
             */
            var generateMapOption = function(){
                var obj = {};
                obj.backgroundColor = '#404a59';
                obj.title = {text:$scope.panelConfig.title};
                obj.tooltip = {trigger:'item'};
                obj.legend = {orient:'vertical',top:'bottom',left:'right',data:[['#',$scope.panelConfig.moreConfig.legend.value].join('')],textStyle:{color:'#fff'},selectMode:'single'};
                obj.geo = {map:'china',label:{emphasis:{show:false}},roam:true,itemStyle:{normal:{areaColor:'#323c48',borderColor:'#404a59'},emphasis:{areaColor:'#2a333d'}}};
                obj.series = [{name:['#',$scope.panelConfig.moreConfig.series.value[0]].join('')},{name:['#',$scope.panelConfig.moreConfig.series.value[1]].join(''),value:['#',$scope.panelConfig.moreConfig.series.value[2]].join('')}];
                return 'option = ' + JSON.stringify(obj,null,2)
            };


            $scope.generateCode = function(){
                var code;
                if(chartFactory.getMapChart() === $scope.panelConfig.chartType){
                    code = generateMapOption();
                }else if(_.indexOf(chartFactory.getNoCfgChart(),$scope.panelConfig.chartType)>-1){
                    code = '';
                } else {
                    code = genOpt();
                }

                $scope.panelConfig.jsCustomizationCode = code;
                $scope.mybtngroup1 = chartFactory.getActiveBtnClass();
                $scope.mybtngroup2 = chartFactory.getInactiveBtnClass();
                $scope.showJs = true;
            };

            $scope.saveConfig = function(){
                /**
                 * transfer string or array to array
                 * @param obj
                 * @returns {Array}
                 */
                var dealWithStringAndArray = function(obj){
                    if(!_.isArray(obj)){
                        if(obj && obj.length>0){
                            obj = [obj]
                        }else{
                            obj = [];
                        }
                    }
                    return obj;
                };

                //if genCode btn is not clicked and save btn is clicked,gen code first
                if(!$scope.panelConfig.jsCustomizationCode || $scope.panelConfig.jsCustomizationCode.length===0){
                    var code;
                    if(chartFactory.getMapChart() === $scope.panelConfig.chartType){
                        code = generateMapOption();
                    }else if(_.indexOf(chartFactory.getNoCfgChart(),$scope.panelConfig.chartType )>-1 ){
                        code = '';
                    } else {
                        code = genOpt();
                    }
                    $scope.panelConfig.jsCustomizationCode = code;
                }

                //validation
                if($scope.panelConfig.title==''){
                    toastr.error('图表名未填');
                    return false;
                }
                if($scope.panelConfig.connection==''){
                    toastr.error('连接名称未选');
                    return false;
                }
                if($scope.panelConfig.datasource==''){
                    toastr.error('数据源未填');
                    return false;
                }

                var refreshTime = $scope.panelConfig.refreshInterval;
                if(refreshTime){
                    if(isNaN(refreshTime)){
                        toastr.error('刷新时间必须是数字');
                        return false;
                    }
                    if(parseInt(refreshTime)<=0){
                        toastr.error('刷新时间必须大于0');
                        return false;
                    }
                    $scope.panelConfig.refreshInterval = parseInt(refreshTime);//transform refreshTime using parseInt by default
                }else{
                    if($scope.panelConfig.autoRefresh){
                        toastr.error('刷新时间必须大于0');
                        return false;
                    }
                }

                for(var i=0;i<$scope.uigridConfig.condition.data.length;i++){
                    if($scope.uigridConfig.condition.data[i].type==="Combox" && !($scope.uigridConfig.condition.data[i].value)){
                        toastr.error('列表值错误');
                        return false;
                    }
                }
                var sql = $scope.panelConfig.datasource.toUpperCase().trim();
                if(sql.match(/\sUPDATE\s/i)){
                    toastr.error("sql中不能存在update");
                    return false;
                }
                if(sql.match(/\sINSERT\s/i)){
                    toastr.error("sql中不能存在insert");
                    return isvalid;
                }
                if(sql.match(/\sDELETE\s/i)){
                    toastr.error("sql中不能存在delete");
                    return isvalid;
                }

                $scope.panelConfig.moreConfig.series.value = dealWithStringAndArray($scope.panelConfig.moreConfig.series.value);
                $scope.panelConfig.moreConfig.legend.value = dealWithStringAndArray($scope.panelConfig.moreConfig.legend.value);
                $scope.panelConfig.moreConfig.axis = uigridConfig.axisConfig.data;
                $scope.panelConfig.condition = uigridConfig.condition.data;
                $scope.panelConfig.detail = uigridConfig.detail.data;
                angular.extend($scope.$parent.panelInEdit, $scope.panelConfig);
                ngDialog.close();
                return true;
            };

            $scope.cancelConfig = function(){
                ngDialog.close();
            };

            //initialize grids
            columnDef();
            columnInit();
            $scope.uigridConfig = uigridConfig;

            $timeout(function(){
                var sqlEditor = ace.edit('sqlEditor');
                $( "#sqlEditorWrap" ).resizable({
                    resize: function( event, ui ) {
                        sqlEditor.resize();
                    }
                });
            },1000);
        }
    ]);
