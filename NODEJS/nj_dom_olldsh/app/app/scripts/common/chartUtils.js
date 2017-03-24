angular.module('chart',[])
    .factory('chartFactory',['$q','$http',function($q, $http){
            var service = {};

            var _type = ['柱状图 Bar Chart','折线图 Line Chart','散点图 Scatter Chart','饼图 Pie Chart','雷达图 Radar Chart','仪表盘 Gauge Chart',
                    '地图 Map Chart','表格 Table','红绿灯表格 Table2','标签','网页'],
                _theme = ['macarons','dark','infographic','roma','shine','vintage','dcs'];

            var _connectionUrl = '/support/dataConnection';

        /**
         * toggle class of '设置'，'JS代码' buttons in panel config page
         * @type {string}
         * @private
         */
            var _inactiveBtnClass = 'btn btn-default',
                _activeBtnClass = 'btn btn-default active';
            
            var  _initialDataOfAxisCfg = [
                    {which:'X',name:'',type:'',max:'',interval:'',data:''},
                    {which:'Y1',name:'',type:'',max:'',interval:'',data:''},
                    {which:'Y2',name:'',type:'',max:'',interval:'',data:''}];
        /**
         * moreConfig property should be changed to this obj when a new panel opens
         * @private
         */
            var _initialDataOfMoreCfg = {
                    legend:{
                            legendType:'none',
                            value:[]
                    },
                    series:{
                            name:'',
                            value:[]
                    },
                    axis:angular.copy(_initialDataOfAxisCfg)
            };
        /**
         * this obj is bind to a new panel as moreConfig property
         * @private
         */
            var _flattenedCfgObj = {
                    legend:{
                            value:[]
                    },
                    series:{
                            value:[]
                    },
                    axis:[]
            };
            
            var sequenceChart = ['柱状图 Bar Chart','折线图 Line Chart'];
            var keyvalueChart = ['饼图 Pie Chart','仪表盘 Gauge Chart'];
            var radarChart = '雷达图 Radar Chart';
            var scatterChart = '散点图 Scatter Chart';
            var pieChart = '饼图 Pie Chart';
            var axisTypeChart = ['柱状图 Bar Chart','折线图 Line Chart'];
            var itemTypeChart = ['饼图 Pie Chart','地图 Map Chart','散点图 Scatter Chart'];
            var mapChart = '地图 Map Chart';
            var noCfgChart = ['表格 Table','红绿灯表格 Table2','标签','网页'];

            service.getChartType = function(){
                    return _type;
            };
            
            service.getChartTheme = function(){
                    return _theme;
            };

            service.getConnection = function(){
                    var deferred = $q.defer();
                    $http.post(_connectionUrl).success(function(data){
                            deferred.resolve(data);
                    }).error(function(){
                            deferred.reject('resolve connection url fail');
                    });
                    return deferred.promise;
            };
            
            service.getInactiveBtnClass = function(){
                    return _inactiveBtnClass;
            };
            
            service.getActiveBtnClass = function(){
                    return _activeBtnClass;
            };
            
            service.getRadarChart = function(){
                    return radarChart;
            };
        
            service.getPieChart = function(){
                return pieChart;
            };
        
            service.getScatterChart = function(){
                return scatterChart;    
            };
            
            service.getSequenceChart = function(){
                    return sequenceChart;
            };
            
            service.getKeyvalueChart = function(){
                    return keyvalueChart;
            };
            
            service.getAxisTypeChart = function(){
                    return axisTypeChart;
            };
            
            service.getItemTypeChart = function(){
                    return itemTypeChart;
            };

            service.getMapChart = function(){
                return mapChart;
            };
        
            service.getNoCfgChart = function(){
                return noCfgChart;    
            };

        /**
         * * handle cfg initialization when an old or a new panel is opened
         * should notice {moreConfig}
         * @param panelInEdit should be an instance of
         * @see ReportConfig.js -- reportConfigSchema.panels -- {}
         */
            service.initializeConfig = function(panelInEdit){
                var cfg = angular.copy(panelInEdit);
                cfg.datasource = cfg.datasource || '';
                cfg.chartType = cfg.chartType || _type[0];
                cfg.jsCustomizationCode = cfg.jsCustomizationCode || '';
                cfg.autoRefresh = cfg.autoRefresh || false;
                cfg.refreshInterval = cfg.refreshInterval || '';
                cfg.title = cfg.title || '';
                cfg.remark = cfg.remark || '';
                cfg.detail = cfg.detail || [];
                cfg.condition = cfg.condition || [];
                cfg.moreConfig = cfg.moreConfig?(_.isEqual(cfg.moreConfig,_flattenedCfgObj)?_initialDataOfMoreCfg:cfg.moreConfig):_initialDataOfMoreCfg;
                cfg.webpageUrl = cfg.webpageUrl || '';
                cfg.connection = cfg.connection || '';
                cfg.connectionName = cfg.connectionName || '';
                cfg.theme = cfg.theme || _theme[0];
                return cfg;
            };

        /**
         * when legendType or chartType change, will return an api
         * @param chartType
         * @param legendType
         * @returns {{isTabType, isTableType1, isTableType2, isWebpageType, needShowTheme, needShowAxis, isLegendValueMulti, isSeriesValueMulti, disableLegendTypeRowOpt, disableLegendName, disableSeriesName, disableSeriesData, initAxisData: *}}
         */
            service.typeChange = function(chartType,legendType){
                    var chartType = chartType,
                        legendType = legendType;
                    var needShowTheme = function(){
                                var filter = ['表格 Table','红绿灯表格 Table2','标签','网页'];
                                return !(_.indexOf(filter,chartType)>-1);
                        },
                        isWebpageType = function(){
                                return chartType === '网页';
                        },
                        isTableType1 = function(){
                                return chartType === '表格 Table';
                        },
                        isTableType2 = function(){
                            return chartType === '红绿灯表格 Table2';
                        },
                        isTabType = function(){
                                return chartType === '标签';
                        },
                        needShowAxis = function(){
                                var filter = ['柱状图 Bar Chart','折线图 Line Chart','散点图 Scatter Chart'];
                                return _.indexOf(filter,chartType)>-1;
                        },
                        isLegendValueMulti = function(){
                                return (_.indexOf(sequenceChart,chartType)>-1) && (legendType === 'row');
                        },
                        isSeriesValueMulti = function(){
                                return (chartType === scatterChart || chartType === mapChart || _.indexOf(sequenceChart,chartType)>-1);
                        },
                        disableLegendTypeRowOpt = function(){
                                return _.indexOf(sequenceChart,chartType) === -1;
                        },
                        disableLegendTypeNoneOpt = function(){
                            return chartType === '饼图 Pie Chart';    
                        },
                        disableLegendTypeColOpt = function(){
                            return chartType === '仪表盘 Gauge Chart';
                        },
                        disableLegendName = function(){
                                return legendType === 'none';
                        },
                        disableSeriesName = function(){
                                return !(_.indexOf(keyvalueChart,chartType)>-1 || chartType===radarChart);
                        },
                        disableSeriesData = function(){
                                return (_.indexOf(sequenceChart,chartType)>-1) && (legendType === 'row');
                        };
                    return {
                            isTabType:isTabType(),
                            isTableType1:isTableType1(),
                            isTableType2:isTableType2(),
                            isWebpageType:isWebpageType(),
                            needShowTheme:needShowTheme(),
                            needShowAxis:needShowAxis(),
                            isLegendValueMulti:isLegendValueMulti(),
                            isSeriesValueMulti:isSeriesValueMulti(),
                            disableLegendTypeRowOpt:disableLegendTypeRowOpt(),
                            disableLegendTypeNoneOpt:disableLegendTypeNoneOpt(),
                            disableLegendTypeColOpt:disableLegendTypeColOpt(),
                            disableLegendName:disableLegendName(),
                            disableSeriesName:disableSeriesName(),
                            disableSeriesData:disableSeriesData(),
                            initAxisData:angular.copy(_initialDataOfAxisCfg)
                    }
            };
        service.getDocId = function(type){
            switch (type){
                case '柱状图 Bar Chart':
                    return 'barchart';
                case '折线图 Line Chart':
                    return 'linechart';
                case '散点图 Scatter Chart':
                    return 'scatterchart';
                case '饼图 Pie Chart':
                    return 'piechart';
                case '雷达图 Radar Chart':
                    return 'radarchart';
                case '仪表盘 Gauge Chart':
                    return 'gaugechart';
                case '地图 Map Chart':
                    return 'mapchart';
                case '表格 Table':
                    return 'tablechart';
                case '红绿灯表格 Table2':
                    return 'tablechart';
                case '标签':
                    return 'tabchart';
                case '网页':
                    return 'webpagechart';
                default:
                    return 'barchart';
            }   
        };

            return service;
    }]
)
