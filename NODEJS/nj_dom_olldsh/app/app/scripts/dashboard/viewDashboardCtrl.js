/**
 * Created by LIULU4 on 2016/3/18.
 */
// Not used for the moment, now panels are rendered at server side

angular.module('viewDashboardApp', [
        'toastr', 'ui.select',
        'ui.grid', 'ui.grid.edit', 'ui.grid.selection', 'ui.grid.cellNav', 'ui.grid.resizeColumns', 'ui.grid.moveColumns',
        'gridstack-angular', 'components', 'ui.date',
        'ngDialog','ui.grid.pagination','angularSpinners','bsTable'])
    // 你在这行引入了bsTable的模块，和你临走前写给我的小纸条上不一样，小纸条说引入bsTable是在dashboardviewctrl.js实现的，但是在那里我并不能找到，却在这里找到了
    .controller('viewDashboardCtrl', ['$scope', '$http', 'toastr', 'ngDialog', 'conditionInputValidator',
        function ($scope, $http, toastr, ngDialog, conditionInputValidator) {

            $scope.dashboardConfig = window.dashboardConfig || {panels: []};
            
            $scope.disableGlobalBtn = false;
            // add. $scope.disableGlobalBtn = true;
            // true 代表 “搜索全部” 按钮不可用。


            // 设置，使得打开图标界面的时候自动加载图像，即相当于自动执行一次搜索指令。
            // $(window).load(function(){
            //     document.getElementById("allClick").click();
            //     // $scope.changeCurrentWorkspace($scope.workspaces[0]);
            //     $scope.$apply();
            // })

            // 将自动加载图表功能和前端checkbox的值绑定到一起
            $scope.$watch('dashboardConfig.autoShow', function(){
                // console.log($scope.dashboardConfig.autoShow);
                if($scope.dashboardConfig.autoShow){
                    $(window).load(function(){
                        document.getElementById("allClick").click();
                        // $scope.changeCurrentWorkspace($scope.workspaces[0]);
                        $scope.$apply();
                    })
                }
            })
            // ends
                
            // console.log(dashboardConfig.nameHide);
            $scope.$watch('dashboardConfig.nameHide', function{
                if($scope.dashboardConfig.nameHide){
                   document.getElementById("reportNameHide").style.display="none";
                }
            })

            $scope.RR = RR;

            $scope.options = {
                cellHeight: 25,
                cellWidth: 25,
                verticalMargin: 5,
                animate: false,
                // animate: true,
                resizable: {
                    handles: 'n, e, se, s, sw, w'
                }
            };

            $scope.movable= true;
            $scope.switchLock = function(){
                $scope.movable= !$scope.movable;
                var grid = $('.grid-stack').data('gridstack');
                grid.movable('.grid-stack-item', $scope.movable);
                grid.resizable('.grid-stack-item', $scope.movable);
            };

            setTimeout(function(){
                if($scope.dashboardConfig.panels.length == 1){
                    $scope.switchLock();
                }
            }, 100);

            $scope.$on('processed', function(event){
                $scope.disableGlobalBtn = false;
                // add. $scope.disableGlobalBtn = true;  搜索按钮不可用
            });

            $scope.search = function(){
                var dashboardConfig = $scope.dashboardConfig;
                var ok = conditionInputValidator.validate(dashboardConfig.condition);
                dashboardConfig.ready = ok;
                if(ok){
                    $scope.disableGlobalBtn = true;
                    //add. $scope.disableGlobalBtn = false;
                    $scope.$broadcast('dashboardConditionReady');
                }
            }
        }
    ])




