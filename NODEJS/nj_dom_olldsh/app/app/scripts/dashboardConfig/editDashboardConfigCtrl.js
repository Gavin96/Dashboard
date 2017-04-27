angular.module('dashboardConfigApp', [
    'toastr', 'ui.select',
    'ui.grid', 'ui.grid.edit', 'ui.grid.selection', 'ui.grid.cellNav', 'ui.grid.resizeColumns', 'ui.grid.moveColumns',
    'eeError', 'components', 'ngSanitize', 'ui.ace',
    'gridstack-angular', 'chartConfig',
    'ngDialog', 'panelConfigApp'])
    .controller('editDashboardConfigCtrl', ['$scope', '$http', 'toastr', 'eeValidator', 'conditionGridValidator', 'ngDialog', '$sce', '$timeout','utils',
        function ($scope, $http, toastr, $eeValidator, conditionGridValidator, ngDialog, $sce, $timeout, utils) {

            $scope.dashboardConfig = window.dashboardConfig || {active: true, panels: [], externalSystem: []};
            $scope.dashboardBaseUrl = window.location.origin;

            var defaultCss =
                '.dashboard-panel-content { \n' +
                '    border-style: solid; \n' +
                '    border-color: #d3d3d3;  \n' +
                '    border-width: thin;   \n' +
                '    padding: 10px;  \n' +
                '} \n' +
                '.dashboard-container { \n' +
                '   padding-top: 15px; \n' +
                '   padding-bottom: 15px;\n' +
                '   border-left: 1px solid #d4d4d4;\n' +
                '   border-bottom: 1px solid #d4d4d4;\n' +
                '   border-right: 1px solid #d4d4d4;\n' +
                '}\n';

            if(typeof $scope.dashboardConfig.css == 'undefined'){
                $scope.dashboardConfig.css = defaultCss;
            }

            $scope.getPreviewLink = function(externalSystem){
                if($scope.dashboardConfig.active){
                    return $scope.dashboardBaseUrl +
                        '/showReport?sysName=' + encodeURIComponent($scope.getSystemProperty(externalSystem, "sysName"))
                        + '&reportName=' + encodeURIComponent($scope.dashboardConfig.reportName)
                        + '&accessKey=' + encodeURIComponent($scope.getSystemProperty(externalSystem, 'accessKey'))
                        + '&defaultFilter=' + encodeURIComponent($scope.getDefaultFilter(externalSystem));
                }
            };

            $scope.layouts = [
                {
                    image: '/images/layouts/image1.png',
                    layoutConfig: [
                        {
                            "x": 0,
                            "y": 0,
                            "width": 12,
                            "height": 20
                        }
                    ]
                },
                {
                    image: '/images/layouts/image2.png',
                    layoutConfig: [
                        {
                            "x": 0,
                            "y": 0,
                            "width": 6,
                            "height": 20
                        },
                        {
                            "x": 6,
                            "y": 0,
                            "width": 6,
                            "height": 20
                        }
                    ]
                },
                {
                    image: '/images/layouts/image3.png',
                    layoutConfig: [
                        {
                            "x": 0,
                            "y": 0,
                            "width": 12,
                            "height": 10
                        },
                        {
                            "x": 0,
                            "y": 10,
                            "width": 6,
                            "height": 10
                        },
                        {
                            "x": 6,
                            "y": 10,
                            "width": 6,
                            "height": 10
                        }
                    ]
                },
                {
                    "image": "/images/layouts/image4.png",
                    "layoutConfig": [
                        {
                            "x": 0,
                            "y": 0,
                            "width": 6,
                            "height": 11
                        },
                        {
                            "x": 6,
                            "y": 0,
                            "width": 6,
                            "height": 11
                        },
                        {
                            "x": 0,
                            "y": 11,
                            "width": 12,
                            "height": 11
                        }
                    ]
                },
                {
                    "image": "/images/layouts/image5.png",
                    "layoutConfig": [
                        {
                            "x": 0,
                            "y": 0,
                            "width": 6,
                            "height": 9
                        },
                        {
                            "x": 6,
                            "y": 0,
                            "width": 6,
                            "height": 9
                        },
                        {
                            "x": 0,
                            "y": 9,
                            "width": 6,
                            "height": 9
                        },
                        {
                            "x": 6,
                            "y": 9,
                            "width": 6,
                            "height": 9
                        }
                    ]
                },
                {
                    "image": "/images/layouts/image6.png",
                    "layoutConfig": [
                        {
                            "x": 0,
                            "y": 0,
                            "width": 6,
                            "height": 20
                        },
                        {
                            "x": 6,
                            "y": 0,
                            "width": 6,
                            "height": 10
                        },
                        {
                            "x": 6,
                            "y": 10,
                            "width": 6,
                            "height": 10
                        }
                    ]
                },
                {
                    "image": "/images/layouts/image7.png",
                    "layoutConfig": [
                        {
                            "x": 0,
                            "y": 0,
                            "width": 6,
                            "height": 10
                        },
                        {
                            "x": 6,
                            "y": 0,
                            "width": 6,
                            "height": 20
                        },
                        {
                            "x": 0,
                            "y": 10,
                            "width": 6,
                            "height": 10
                        }
                    ]
                },
                {
                    "image": "/images/layouts/image8.png",
                    "layoutConfig": [
                        {
                            "x": 0,
                            "y": 0,
                            "width": 4,
                            "height": 20
                        },
                        {
                            "x": 4,
                            "y": 0,
                            "width": 4,
                            "height": 20
                        },
                        {
                            "x": 8,
                            "y": 0,
                            "width": 4,
                            "height": 20
                        }
                    ]
                },
                {
                    "image": "/images/layouts/image9.png",
                    "layoutConfig": [
                        {
                            "height": "9",
                            "width": "12",
                            "y": "0",
                            "x": "0"
                        },
                        {
                            "height": "11",
                            "width": "4",
                            "y": "9",
                            "x": "0"
                        },
                        {
                            "height": "11",
                            "width": "4",
                            "y": "9",
                            "x": "4"
                        },
                        {
                            "height": "11",
                            "width": "4",
                            "y": "9",
                            "x": "8"
                        }
                    ]
                },
                {
                    "image": "/images/layouts/image10.png",
                    "layoutConfig": [
                        {
                            "x": 0,
                            "y": 0,
                            "width": 6,
                            "height": 11
                        },
                        {
                            "x": 6,
                            "y": 0,
                            "width": 6,
                            "height": 11
                        },
                        {
                            "x": 0,
                            "y": 11,
                            "width": 4,
                            "height": 9
                        },
                        {
                            "x": 4,
                            "y": 11,
                            "width": 4,
                            "height": 9
                        },
                        {
                            "x": 8,
                            "y": 11,
                            "width": 4,
                            "height": 9
                        }
                    ]
                },
                {
                    "image": "/images/layouts/image11.png",
                    "layoutConfig": [
                        {
                            "height": 9,
                            "width": 4,
                            "y": 0,
                            "x": 0
                        },
                        {
                            "height": 9,
                            "width": 4,
                            "y": 0,
                            "x": 4
                        },
                        {
                            "height": 9,
                            "width": 4,
                            "y": 0,
                            "x": 8
                        },
                        {
                            "height": 11,
                            "width": 6,
                            "y": 9,
                            "x": 0
                        },
                        {
                            "height": 11,
                            "width": 6,
                            "y": 9,
                            "x": 6
                        }
                    ]
                }
            ];

            $scope.themes = [
                {
                    image: '/images/themes/vintage.png',
                    themeName: 'vintage'
                },
                {
                    image: '/images/themes/dark.png',
                    themeName: 'dark'
                },
                {
                    image: '/images/themes/macarons.png',
                    themeName: 'macarons'
                },
                {
                    image: '/images/themes/infographic.png',
                    themeName: 'infographic'
                },
                {
                    image: '/images/themes/shine.png',
                    themeName: 'shine'
                },
                {
                    image: '/images/themes/roma.png',
                    themeName: 'roma'
                },
                {
                    image: '/images/themes/dcs.png',
                    themeName: 'dcs'
                }
            ];
            
            $scope.sortPanels = function(nodes, dir, width) {
                width = width || _.chain(nodes).map(function(node) { return node.frame.x + node.frame.width; }).max().value();
                dir = dir != -1 ? 1 : -1;
                return _.sortBy(nodes, function(n) { return dir * (n.frame.x + n.frame.y * width); });
            };

            $scope.selectLayout = function(layout){
                var gsConfig = layout.layoutConfig;

                var panels = $scope.dashboardConfig.panels;
                function applyLayout(){
                    while(panels.length < gsConfig.length){
                        panels.push($scope.getInitialGsConfig());
                    }
                    while(panels.length > gsConfig.length){
                        panels.splice(panels.length - 1, 1);
                    }

                    $timeout(function(){
                        for(var i = 0;i < gsConfig.length;i ++){
                            panels[i].frame.x = gsConfig[i].x;
                            panels[i].frame.y = gsConfig[i].y;
                            panels[i].frame.width = gsConfig[i].width;
                            panels[i].frame.height = gsConfig[i].height;
                        }
                    });

                }
                if(panels.length > gsConfig.length){
                    $.messager.confirm('删除多余的图表', '应用该布局将删除多余的图表，确定？', function () {
                        $scope.$apply(function(){
                            applyLayout();
                        });
                    });
                }else{
                    applyLayout();
                }
            };

            $scope.getFrames = function(){
                var ps = $scope.dashboardConfig.panels;
                var fs = [];
                _.each(ps, function(p){
                    fs.push(p.frame);
                });
                var cfg = {
                    image: '/images/layouts/image1.png',
                    layoutConfig: fs
                };
                return JSON.stringify(cfg, null, 4);
            };

            $scope.selectTheme = function(theme){
                var ps = $scope.dashboardConfig.panels;
                _.each(ps, function(p){
                    p.theme = theme.themeName;
                });
            };
            
            $scope.externalSystems = [];
            $http.post('/support/externalSystem').success(function (data) {
                $scope.externalSystems = data;
                //重刷$scope.dashboardConfig.externalSystem,使下拉列表不出现异常
                $scope.dashboardConfig.externalSystem = [].concat($scope.dashboardConfig.externalSystem);

            });

            $scope.authorizedUsers = [];
            $http.post('/support/userInformation').success(function (data) {
                $scope.authorizedUsers = data;
                $scope.dashboardConfig.authorizedUser = [].concat($scope.dashboardConfig.authorizedUser);
            });

            $scope.getSystemProperty = function(externalSystemId, name){
                var propertyValue = null;
                if($scope.externalSystems && $scope.dashboardConfig.externalSystem){
                    var system = _.findWhere($scope.externalSystems, {_id: externalSystemId});
                    if(!system){
                        return null;
                    }
                    propertyValue = system[name];
                }
                return propertyValue;
            };


            $scope.getDefaultFilter = function(externalSystemId){
                var params = $scope.getSystemProperty(externalSystemId, 'params');
                if(!params){
                    return '{}';
                }
                var paramArray = params.split('\n');
                paramArray = paramArray.filter(function(p){return p.length > 0;})
                var paramObject = {};
                _.each(paramArray, function(p){
                    paramObject[p] = '';
                });
                return JSON.stringify(paramObject);
            };

            $scope.options = {
                cellHeight: 25,
                cellWidth: 25,
                verticalMargin: 5,
                animate: false,
                width: 12,
                resizable: {
                    handles: 'n, e, se, s, sw, w'
                }
            };

            $scope.getInitialGsConfig = function() {
                return {
                    active: true,
                    frame: {x: 0, y: 0, width: 12, height: 20}
                };
            };

            $scope.addPanel = function(){
                $scope.dashboardConfig.panels.push($scope.getInitialGsConfig());
            };

            $scope.focusTextarea=function()
            {
                toastr.clear();
                $('#myModal').modal('show');
                $('#myModal').on('shown.bs.modal', function (e) {
                    $('#pasteText').focus();
                    $scope.myValue="";
                })
            }

            $scope.pastePanel = function(){
                // get from the clipboard
                var pasteJsonText=$scope.myValue;
                console.log(pasteJsonText);
                $scope.myValue="";
                try {
                    // get dashboard-panel config content in json
                    var pasteText=JSON.parse(pasteJsonText);
                    $('#myModal').modal('hide');
                    // console.log(pasteText);
                }
                catch(e)
                {
                    $('#myModal').modal('hide');
                    toastr.error("保存失败");
                }
                toastr.success("保存成功");
                // 将新复制下来的信息放入panel数组中，增加数组中的panel数目
                $scope.dashboardConfig.panels.push(pasteText);
            };

            $scope.configPanel = function(panel){
                $scope.panelInEdit = panel;
                ngDialog.open({
                    template: '/views/dashboardConfig/editPanelConfig.html',
                    controller: 'editPanelConfigCtrl',
                    scope: $scope,
                    closeByDocument: false
                });
            };

            var initializing = true;
            $scope.$watch('dashboardConfig.activePanels', function(){
                if(initializing){
                    initializing = false;
                    return;
                }
                _.each($scope.dashboardConfig.panels, function(p){
                    p.active = $scope.dashboardConfig.activePanels;
                });
            });

            $scope.deletePanel = function(panel){
                $.messager.confirm('删除图表', '确定删除该图表？', function () {
                    var index = $scope.dashboardConfig.panels.indexOf(panel);
                    $scope.$apply(function(){
                        $scope.dashboardConfig.panels.splice(index, 1);
                    });
                });
            };

            $scope.copyPanel = function(panel){
                var index = $scope.dashboardConfig.panels.indexOf(panel);
                // console.log(dashboardConfig.panels[index].$$hashKey);
                delete dashboardConfig.panels[index].$$hashKey;
                // delete dashboardConfig.panels[index];
                var copyText=JSON.stringify(dashboardConfig.panels[index]);

                utils.copyValue(copyText);

                // console.log(copyText);
                toastr.success("复制成功");
            };

            $scope.validate = function () {
                var errors = $eeValidator.validate($scope.dashboardConfig, {
                    reportName: {required: true},
                    externalSystem: {required: true}
                });
                $scope.$error = errors;
                var conditionOK = conditionGridValidator.validate($scope.dashboardConfig.condition);
                return (!errors) && conditionOK;
            };

            if(!$scope.dashboardConfig.authorizedUser)
                $scope.dashboardConfig.authorizedUser = [];


            //add current user to Name, and get current user's _id in mongodb
            $scope.currentUser = [];
            $http.post('/user/getLoginUser').success(function(data){

                $scope.currentUser = data;
                angular.forEach($scope.dashboardConfig.authorizedUser, function(element,index,array) {
                    if(element == data._id) {
                        $scope.dashboardConfig.authorizedUser.splice(index, 1);
                    }
                });

            }).error(function(data) {
                console.log("Ops: " + data);
                alert('请检查网络连接');
            });





            $scope.languages=["中文","英文"];
            if( $scope.dashboardConfig.language=="zh_CN")
            $scope.defaultLanguage="中文";
            else
                $scope.defaultLanguage="英文";


            $scope.showChange=function(language)
            {
                if(language=="中文")
                    $scope.dashboardConfig.language="zh_CN";
                else if( language=="英文")
                    $scope.dashboardConfig.language="en_US";

            }


            $scope.submitForm = function (callback) {
                if (!$scope.validate()) {
                    $eeValidator.makeErrorVisible();
                    return;
                }

                $scope.dashboardConfig.type = 'dashboard';
                $scope.dashboardConfig.externalSystemName = _.map(
                    $scope.dashboardConfig.externalSystem, function(id){
                        var sys = _.findWhere($scope.externalSystems, {_id: id});
                        return sys.sysName;
                    }
                ).join(',');



                $scope.dashboardConfig.authorizedUserName = _.map(
                    $scope.dashboardConfig.authorizedUser, function(id){
                        var user = _.findWhere($scope.authorizedUsers, {_id: id});
                        return user.Name;
                    }
                ).join(',');

                //将当前user的objectid加入权限控制部分相应的键值对内
                if($scope.currentUser.isAdmin==false){
                    $scope.dashboardConfig.authorizedUser.push($scope.currentUser._id);
                    $scope.dashboardConfig.authorizedUserName = $scope.currentUser.Name + "," + $scope.dashboardConfig.authorizedUserName;
                }

                $scope.dashboardConfig.panels = $scope.sortPanels($scope.dashboardConfig.panels, 1, 12);
                $http.post('/dashboardConfig/edit', JSON.stringify($scope.dashboardConfig))
                    .success(function (data, status, headers, dashboardConfig) {

                        if (data.status == "success") {
                            toastr.success("保存成功");
                            if (!$scope.dashboardConfig._id) {
                                $scope.dashboardConfig._id = data.id;
                            }
                            //防止当前用户姓名显示在界面的权限控制上
                            if($scope.currentUser.isAdmin==false) {
                                $scope.dashboardConfig.authorizedUser.pop();
                            }

                            if(callback){
                                callback();
                            }
                        } else if (data.error) {
                            $scope.$error = data.error;
                            $eeValidator.makeErrorVisible();
                        } else {
                            toastr.error("保存失败，请检查输入或询问开发者");
                        }
                    });
            };

            $scope.preview = function(){
                $scope.submitForm(function(){
                    window.open('/previewReport?id=' + $scope.dashboardConfig._id);
                });
            };

            $scope.clearFields = function () {
                $scope.dashboardConfig = {
                    sysName: '',
                    connType: 'database',
                    dbAddress: '',
                    account: '',
                    accessKey: '',
                    ipAddress: '',
                    params: '',
                    remark: ''
                    // adds
                    // autoShow:false
                };
            };

            $scope.deleteDashboardConfig = function () {
                $.messager.confirm('删除外部系统', '确定删除该外部系统吗？', function () {
                    $http.post('/dashboardConfig/delete', {id: [$scope.dashboardConfig._id]})
                        .success(function (data, status, headers, dashboardConfig) {
                            console.log("data -- > " + data);
                            if (data.status == "success") {
                                toastr.success("外部系统删除成功", null, {
                                    autoDismiss: false,
                                    closeButton: true
                                });
                                setTimeout(function () {
                                    window.location.href = '/dashboardConfig/maintain';
                                }, 1300);
                            } else if (data.status == 'exist') {
                                var str = '';
                                for (var i = 0; i < data.dup.length; i++) {
                                    str += data.dup[i] + " ";
                                }
                                toastr.error("外部系统删除失败,系统:" + str + "仍存在报表配置", null, {
                                    autoDismiss: false,
                                    closeButton: true
                                });
                            }
                            else {
                                toastr.error('系统错误', null, {
                                    autoDismiss: false,
                                    closeButton: true
                                });
                            }
                        }).error(function (data, status, headers, dashboardConfig) {
                            console.log("Ops: " + data);
                            toastr.error('请检查网络连接', null, {
                                autoDismiss: false,
                                closeButton: true
                            });
                        });
                });
            }
        }
    ])
    .directive('panelPreview', function(){
        return {
            restrict: 'E',
            templateUrl: '/views/dashboardConfig/panelPreview.html',
            scope: {
                panelConfig: '=',
                configPanel: '=',
                deletePanel: '=',
                copyPanel:'='
            },
            link: function ($scope, element, attributes) {

            }
        }
    });


