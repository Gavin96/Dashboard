
var app = angular.module('',['ui.grid', 'ui.grid.edit', 'ui.grid.selection','ui.grid.resizeColumns', 'ui.grid.moveColumns', 'toastr','ui.grid.cellNav','ngDialog']);


app.controller('chartConfigCtrl',['$scope', 'toastr','uiGridConstants','ngDialog',function($scope,toastr,uiGridConstants,ngDialog){

    $scope.panelConfig.condition = $scope.$parent.condition;
    $scope.panelConfig = $scope.$parent.panelConfig;
    $scope.connection = $scope.$parent.connection;

    $scope.chartType = ['柱状图 Bar Chart','折线图 Line Chart','散点图 Scatter Chart','饼图 Pie Chart','雷达图 Radar Chart','仪表盘 Guage Chart',
        '地图 Map Chart','其他 Other Chart','表格 Table','红绿灯表格 Table2','标签','网页'];
    $scope.defaultChartType = $scope.chartType[0];


    var headOptions = [],selectOptions = [],whereOptions = [];

    var uigridConfig = {
        condition:{
            enableRowSelection: true,
            enableSelectAll: true,
            selectionRowHeaderWidth: 35,
            rowHeight: 30,
            onRegisterApi: function (gridApi) {
                $scope.conditionApi = gridApi;
            }
        },
        detail:{
            enableRowSelection: true,
            enableSelectAll: true,
            selectionRowHeaderWidth: 35,
            rowHeight: 30,
            onRegisterApi: function (gridApi) {
                $scope.detailApi = gridApi;
            }
        }
    };

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
                cellTemplate: '<input type="text" style="height:100%;padding: 6px 12px;text-align: center;" ng-model="row.entity.value" name="conditionvalue"/>'
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
                name: 'key', enableCellEdit: false, displayName: '关键字',
                cellTemplate: '<input type="text" style="height:100%;padding: 6px 12px;text-align: center;" ng-model="row.entity.key" class="uppercase" name="key" required ng-maxlength="100"/>'
            },
            {
                name: 'value', enableCellEdit: false, displayName: '显示名称',
                cellTemplate: '<input type="text" style="height:100%;padding: 6px 12px;text-align: center;" ng-model="row.entity.value" name="value" required ng-maxlength="100"/>'
            },
            {
                name:'sequenceNum', visible:false,
                sort: {
                    direction: uiGridConstants.DESC,
                    priority: 1
                }
            }
        ];
        uigridConfig.detail.multiSelect = true;
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
        var sql = $scope.panelConfig.datasource.replace("\n"," ");
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
            selectitem = select[i].split(/\sas\s|\sAS\s|\sAs\s|\saS\s/);
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

    var findRowNum = function(row,data){
        var rowNum;
        for(var i = 0; i<data.length;i++){
            if(row.$$hashKey == data[i].$$hashKey){
                rowNum = i;
            }
        }
        return rowNum;
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
            sequenceNum:1
        };
        for(var i=0;i<data.length;i++){
            data[i].sequenceNum++;
        }
        data.push(newRow);
    };

    var checkValid = function(data,isvalid,type){
        sqlParse();
        var tmpdata = data;
        var flag = 1;

        if(type==1){
            for(var i=0;i<tmpdata.length;i++){
                flag = 1;
                for(var j=0;j<where.length-1;j++){
                    if((tmpdata[i].key).toUpperCase()==where[j+1].key.toUpperCase()){
                        flag = 2;
                        break;
                    }
                }
                if(flag ==1){
                    toastr.error(tmpdata[i].key+"不在sql语句查询条件中");
                    isvalid = false;
                    return isvalid;
                }
            }
        }else{
            if(type==5){
                for(var i=0;i<tmpdata.length;i++){
                    flag = 1;
                    for(var j=0;j<subselect.length;j++){
                        if((tmpdata[i].key).toUpperCase()==subselect[j].key.toUpperCase()){
                            flag = 2;
                            break;
                        }
                    }
                    if(flag ==1){
                        toastr.error(tmpdata[i].key+"不在sql语句中");
                        isvalid = false;
                        return isvalid;
                    }
                }
            }else{
                for(var i=0;i<tmpdata.length;i++){
                    flag = 1;
                    for(var j=0;j<select.length;j++){
                        if((tmpdata[i].key).toUpperCase()==select[j].key.toUpperCase()){
                            flag = 2;
                            break;
                        }
                    }
                    if(flag ==1){
                        toastr.error(tmpdata[i].key+"不在sql语句中");
                        isvalid = false;
                        return isvalid;
                    }
                }
            }
        }
        flag = 1;
        for(var i=0;i<tmpdata.length;i++){
            flag = 1;
            if(type==1){
                if(tmpdata[i].key==null||tmpdata[i].name==null||tmpdata[i].type==""||tmpdata[i].type==null){
                    isvalid = false;
                    toastr.error('条件为空');
                    return isvalid;
                }
            }else{
                if(tmpdata[i].key==null||tmpdata[i].value==null){
                    isvalid = false;
                    switch(type){
                        case 1:toastr.error('条件错误');break;
                        case 2:toastr.error('报表头错误');break;
                        case 3:toastr.error('明细错误');break;
                        case 4:toastr.error('报表页脚错误');break;
                        case 5:toastr.error('子报表明细错误');break;
                    }
                    return isvalid;
                }
            }
            for(var j=0;j<data.length;j++){
                data[i].key=data[i].key.toUpperCase();
                if(tmpdata[i].key==data[j].key){
                    flag++;
                    if(flag>2){
                        isvalid = false;
                        switch(type){
                            case 1:toastr.error('条件重复:'+data[j].key);break;
                            case 2:toastr.error('报表头重复:'+data[j].key);break;
                            case 3:toastr.error('明细重复:'+data[j].key);break;
                            case 4:toastr.error('报表页脚重复:'+data[j].key);break;
                            case 5:toastr.error('子报表明细重复:'+data[j].key);break;
                        }
                        return isvalid;
                    }
                }
            }
        }
        return isvalid;
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
            };break;
            case 'detail':{
                var selectRows = $scope.detailApi.selection.getSelectedRows();
                var data = uigridConfig.detail.data;
            };break;
        }
        if (selectRows.length > 0) {
            for(var i=0;i<selectRows.length;i++) {
                var rowNum = findRowNum(selectRows[i], data);
                data.splice(rowNum, 1);
            }
        }
        $scope.uigridConfig = uigridConfig;
    };

    $scope.up = function(type){
        switch(type){
            case 'condition':{
                var selectRows = $scope.conditionApi.selection.getSelectedRows();
                var data = uigridConfig.condition.data;
            };break;
            case 'detail':{
                var selectRows = $scope.detailApi.selection.getSelectedRows();
                var data = uigridConfig.detail.data;
            };break;
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
            };break;
            case 'detail':{
                var selectRows = $scope.detailApi.selection.getSelectedRows();
                var data = uigridConfig.detail.data;
            };break;
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

    $scope.autoPrint = function () {
        columnReset();
        if($scope.uigridConfig.datasource!==""){
            sqlParse();
            for(var i=0;i<select.length;i++){
                autoAddDetail(select[i].key.toUpperCase());
            }
            for(var i=1;i<where.length;i++){
                autoAddCondition(where[i].key.toUpperCase());
            }
            columnDef();}
        else{
            toastr.error("请先输入sql语句！");
        }
    };

    $scope.saveConfig = function(){
        var isvalid = true;
        if($scope.panelConfig.title==''){
            isvalid = false;
            toastr.error('图表名未填');
            return isvalid;
        }
        if($scope.panelConfig.datasource==''){
            isvalid = false;
            toastr.error('数据源未填');
            return isvalid;
        }
        if($scope.panelConfig.jsCustomizationCode==''){
            isvalid = false;
            toastr.error('请检查图表设置');
            return isvalid;
        }
        for(var i=0;i<$scope.uigridConfig.condition.data.length;i++){
            if($scope.uigridConfig.condition.data[i].type=="Combox"&&!($scope.uigridConfig.condition.data[i].value)){
                isvalid = false;
                toastr.error('列表值错误');
                return isvalid;
            }
        }
        var sql = $scope.ReportInfo.datasource.toUpperCase().trim();
        if(sql.indexOf('UPDATE')!=-1){
            isvalid = false;
            toastr.error("sql中不能存在update");
            return isvalid;
        }
        if(sql.indexOf('INSERT')!=-1){
            isvalid = false;
            toastr.error("sql中不能存在insert");
            return isvalid;
        }
        if(sql.indexOf('DELETE')!=-1){
            isvalid = false;
            toastr.error("sql中不能存在delete");
            return isvalid;
        }
        if(checkValid($scope.uigridConfig.condition.data,isvalid,1) &&
            checkValid($scope.uigridConfig.detail.data,isvalid,3)){
            return true;
        }else{
            return false;
        }
    };

    $scope.advanceConfig = function(){
        var dialog = ngDialog.open({
            template:'chartAdvanceConfig.ejs',
            scope:$scope
        });

        dialog.closePromise.then(function(data){

        });
    };

    columnDef();
    $scope.uigridConfig = uigridConfig;


    //$scope.chartType = ['柱状图 Bar Chart','折线图 Line Chart','散点图 Scatter Chart','饼图 Pie Chart','雷达图 Radar Chart','仪表盘 Guage Chart',
    //    '地图 Map Chart','其他 Other Chart','表格 Table','标签','网页'];
    $('#charttypeselect').change(function(){
        var sel = $(this).children('option:selected').val();
        var fso, ts, s ;
        var ForReading = 1;
        fso = new ActiveXObject("Scripting.FileSystemObject");

        var fileLocation;

        switch(sel.indexOf($scope.chartType)){
            case 0:
                fileLocation = './exampleChartTpl/barChartTpl.js';
                break;
            case 1:
                fileLocation = './exampleChartTpl/lineChartTpl.txt';
                break;
            case 2:
                fileLocation = './exampleChartTpl/scatterChartTpl.txt';
                break;
            case 3:
                fileLocation = './exampleChartTpl/pieChartTpl.txt';
                break;
            case 4:
                fileLocation = './exampleChartTpl/radarChartTpl.txt';
                break;
            case 5:
                fileLocation = './exampleChartTpl/guageChartTpl.txt';
                break;
            case 6:
                fileLocation = './exampleChartTpl/mapChartTpl.txt';
                break;
            case 7:
                fileLocation = './exampleChartTpl/otherChartTpl.txt';
                break;
            default:
                fileLocation = './exampleChartTpl/barChartTpl.js';
                break;
            }

        ts = fso.OpenTextFile(fileLocation, ForReading);
        s = ts.ReadLine();
        $('#chartarea').text(s);
        eval($('#chartarea').val());
    });

    var generateOption = function(config){
        var genTitle = function(title){
            return ['title:{','\ntext:',title,'\n},'];
            },
            genLegend = function(legend){
                return
            },
            genXaxis = function(xaxis){
                var xaxisopt = ['xAxis:[\n{',
                        '\ntype:',xaxis.type,
                        ',\nname:',xaxis.name];
                if(xaxis.max){
                    xaxisopt.extend([',\nmax:',xaxis.max])
                }
                if(xaxis.interval){
                    xaxisopt.extend([',\ninterval:',xaxis.interval])
                }
                xaxisopt.push('\n}\n]');
                return xaxisopt;
            },
            genYaxis = function(yaxis1,yaxis2){
                var yaxisopt = ['yAxis:[\n{',
                            '\ntype:',yaxis1.type,
                            ',\nname:',yaxis1.name];
                if(yaxis1.max){
                    yaxisopt.extend([',\nmax:',yaxis1.max])
                }
                if(yaxis1.interval){
                    yaxisopt.extend([',\ninterval:',yaxis1.interval])
                }
                yaxisopt.push('\n}');
                if(yaxis2.active){
                    yaxisopt.push(',\n{');
                    yaxisopt.extend(['\ntype:',yaxis2.type,
                                    ',\nname:',yaxis2.name]);
                    if(yaxis2.max){
                        yaxisopt.extend([',\nmax:',yaxis2.max])
                    }
                    if(yaxis2.interval){
                        yaxisopt.extend([',\ninterval:',yaxis2.interval])
                    }
                    yaxisopt.extend([',\ninverse:true','\n}'])
                }
                yaxisopt.push('\n]');
                return yaxisopt;
            },
            genSeriesData = function(cfg){

            };

    }





}])

//折线图，柱状图，雷达图 ,  '[#column]'
//饼图，仪表盘，漏斗图,韦恩图,字符云, 力导向分布图,和玄图      `{value:'#column1',name:'#column2'},{source:'#column1',target:'#column2'}
//散点图，热力图，K线图,和玄图 ['#column1','#column2','#column3','#column4']
//地图[{name:'#column1'},{name:'#column2'}]
//树{name:'#column1',value:'#column2'，children:{name:'#column3',value:'#column4'}}

