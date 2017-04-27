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

            // 将自动加载图表功能和前端checkbox的值绑定到一起
            // $scope.$watch('dashboardConfig.autoShow', function(){
                if($scope.dashboardConfig.autoShow){
                    $(window).load(function(){
                        document.getElementById("allClick").click();
                        $scope.$apply();
                    })
                }
            // })
            // ends

            // console.log(dashboardConfig.nameHide);
            $scope.$watch('dashboardConfig.nameHide', function(){
                if($scope.dashboardConfig.nameHide){
                    // document.getElementById("reportNameHide").style.display="none";
                    document.getElementById("reportNameHide").style.cssText = "display: none";
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
                grid.movable('.grid-stack-item', $scope.movable);  // set the chart movable or not (false:can't move)
                grid.resizable('.grid-stack-item', $scope.movable);  // set the chart resizable or not
            };

            $(window).load(function(){
                if(!$scope.dashboardConfig.beAdjustable){
                    document.getElementById("lockShow").className = "layout-lock-button layout-lock-button-locked";
                    document.getElementById("lockShow").style.cssText = "display: none;";
                    var grid = $('.grid-stack').data('gridstack');
                    grid.movable('.grid-stack-item', false);   // set the chart can't be movable
                    // grid.movable('.grid-stack-item', $scope.movable);
                    grid.resizable('.grid-stack-item', false);  // set the chart cantresizable or not
                    // document.getElementsByClassName("ui-resizable-handle").style.cssText = "display:none";
                }
            });

            var grid = $('.grid-stack').data('gridstack');

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




