var DEFAULT_CONNECTIONS = 15;
var _ = require('underscore');
var oracledb = require('oracledb');
var async = require('async');
var encrypt = require('./rsa');
var poolmanager = require('./poolmanager');
var modify = false;
var oracle_pool = null;
var oracleConfig = {};

oracledb.fetchAsString = [ oracledb.NUMBER ];

//check connection
exports.check_connection = function (config, callback) {
    console.log('--------2--------');
    console.log(config);
    console.log('--------3--------');
    oracledb.getConnection({
        user: config.account,
        password: config.password,
        connectString: config.dbAddress
    }, function (err, connection) {
        if (err) {
            console.log('oracle db connect failed');
            console.log(err.message);
            callback(false);
            return;
        } else {
            console.log('oracle db connected');
            connection.release(function (err) {

                if (err) {
                    console.log(err.message);
                } else {
                    console.log('oracle db released')
                }
            });
            callback(true);
        }
    });
}

//exports pool tool and query function
exports.init_config = function (user, pwd, db, origin) {

    console.log(pwd);
    oracleConfig.user = user;
    oracleConfig.password = pwd;
    oracleConfig.connectString = db;
    if (!origin)
        modify = true;
}

exports.query = function (oracleConfig, sqlObj, sqlTitle, page, size, callback) {
    var result = {code: 0, data: [], dataRoot: [], count: [], error: null};  //0 success 1 pool error 2 sql error
    poolmanager.getConnection(oracleConfig, dealConn);

    function dealConn(conn) {
        if (conn == null) {
            result.code = 1;
            callback(result);
        } else {
            querySyn(conn);
        }
    }

    function querySyn(conn) {
        try {
            var execSql = sqlObj.pop();
            var dataRoot = sqlTitle.pop();
            var error = false;
            if (execSql == null || execSql == undefined || execSql == '') {
                if (error) {
                    result.code = 2;
                }
                conn.release(function (err) {
                });
                callback(result);
                return;
            }
            
            var sql1 = execSql,sql2 = "SELECT MAX(ROWNUM) AS MAXROWNUMBER FROM (" + execSql + ") MAXTEMPTABLE";
            
            if (page != 0 && size != 0) {
                sql1 = "SELECT * FROM ( SELECT PAGETEMPTABLE.*, ROWNUM RN FROM (" + execSql + ") PAGETEMPTABLE WHERE ROWNUM <= " + page * size + " ) WHERE RN >= " + ((page - 1) * size + 1);
            }
            console.log('execsql:' + execSql);
            conn.execute(sql2, [], {resultSet: true}, function (err, rows) {
                if (err) {
                    console.error("query error:" + sql2);
                    console.error("query error:" + err);
                    result.code = 2;
                    error = true;
                    result.error = err;
                    querySyn(conn);
                } else {
                    result.dataRoot.push(dataRoot);
                    var rscounts = 0;
                    var tmparray = [];
                    fetchCountFromRS(rscounts, conn, rows.resultSet, rows.resultSet.metaData, function(rscount){
                        try {
                            result.count.push(rscount);
                            console.log('query end.find ' + rscount + " items");
                            
                            conn.execute(sql1, [], {resultSet: true}, function(err2, rows2){
                                if (err2) {
                                    console.error("query error:" + sql1);
                                    console.error("query error:" + err2);
                                    result.code = 2;
                                    error = true;
                                    result.error = err2;
                                    querySyn(conn);
                                } else{
                                    fetchOneRowFromRS(conn, rows2.resultSet, tmparray, rows2.resultSet.metaData, function (tmpresultarray) {
                                        try {
                                            result.data.push(tmpresultarray);
                                            querySyn(conn);
                                        } catch (e) {
                                            conn.release();
                                            throw e;
                                        }
                                    });
                                }
                            });
                        } catch (e) {
                            conn.release();
                            throw e;
                        }
                    })

                }
            });
        } catch (e) {
            conn.release();
            throw e;
        }
    }


    function fetchCountFromRS(rscounts, connection, resultSet, metaData, cb){
        resultSet.getRow(function (err, tmprow) {
            try {
                if (err) {
                    console.log(err.message);
                    resultSet.close(function (err) {
                        if (err) {
                            console.log(err.message);
                        } else {
                            console.log('rs closed');
                        }
                        connection.release(function (err) {
                            if (err) {
                                console.log(err.message);
                            } else {
                                console.log('connection released');
                            }
                        });
                    });
                } else if (!tmprow) {
                    resultSet.close(function (err) {
                        if (err) {
                            console.log(err.message);
                        } else {
                            console.log('rs closed');
                        }
                        cb(rscounts);
                    });
                } else {
                    console.log(tmprow);
                    console.log(metaData);

                    for (var i = 0; i < tmprow.length; i++) {
                        if (metaData[i]['name'].toLowerCase() == 'maxrownumber') {
                            rscounts = tmprow[i];
                        }
                    }
                    fetchCountFromRS(rscounts, connection, resultSet, metaData, cb);
                }
            } catch (e) {
                connection.release();
                throw e;
            }
        });
    }

    function fetchOneRowFromRS(connection, resultSet, tmparray, metaData, cb) {
        resultSet.getRow(function (err, tmprow) {
            try {
                if (err) {
                    console.log(err.message);
                    resultSet.close(function (err) {
                        if (err) {
                            console.log(err.message);
                        } else {
                            console.log('rs closed');
                        }
                        connection.release(function (err) {
                            if (err) {
                                console.log(err.message);
                            } else {
                                console.log('connection released');
                            }
                        });
                    });
                } else if (!tmprow) {
                    resultSet.close(function (err) {
                        if (err) {
                            console.log(err.message);
                        } else {
                            console.log('rs closed');
                        }
                        cb(tmparray);
                    });
                } else {
                    console.log(tmprow);
                    console.log(metaData);

                    var row = {};
                    for (var i = 0; i < tmprow.length; i++) {
                        row[metaData[i]['name'].toLowerCase()] = tmprow[i];
                    }
                    tmparray.push(row);
                    fetchOneRowFromRS(connection, resultSet, tmparray, metaData, cb);
                }
            } catch (e) {
                connection.release();
                throw e;
            }
        });
    }
};

// not used
exports.querySingle = function (sql, page, size, callback) {
    var result = {code: 0, data: []};  //0 success 1 pool error 2 sql error
    poolmanager.getConnection(oracleConfig, dealConn);

    function dealConn(conn) {
        if (conn == null) {
            result.code = 1;
            callback(result);
        } else {
            console.log('single query start. ');
            var execSql = "SELECT * FROM ( SELECT PAGETEMPTABLE.*, ROWNUM RN,(SELECT MAX(ROWNUM) FROM (" + sql + ") MAXTEMPTABLE) AS MAXROWNUMBER FROM (" + sql + ") PAGETEMPTABLE WHERE ROWNUM <= " + page * size + " ) WHERE RN >= " + ((page - 1) * size + 1);
            console.log('execsql:' + execSql);
            conn.execute(execSql, [], {resultSet: true}, function (err, rows) {
                if (err) {
                    console.log("query error:" + err);
                    result.code = 2;
                    error = true;
                } else {
                    var rscounts = 0;
                    var tmparray = [];
                    fetchOneRowFromRS(rscounts, conn, rows.resultSet, tmparray, rows.metaData, function (rscount, tmpresultarray) {
                        console.log('single query end.find ' + rscount + " items");
                        //console.log(page);
                        //console.log(size);
                        if (page != 0 && size != 0) {
                            var array = [];
                            for (var i = 0; i < size - 1; i++) {
                                if (tmpresultarray[i]) {
                                    array.push(tmpresultarray[i]);
                                }

                            }
                        }
                        //   console.log(array);
                        result.data = array;
                        conn.release(function (err) {
                        });
                        callback(result);
                    });
                }
            });
        }
    }

    function fetchOneRowFromRS(rscounts, connection, resultSet, tmparray, metaData, cb) {
        resultSet.getRow(function (err, tmprow) {
            if (err) {
                console.log(err.message);
                resultSet.close(function (err) {
                    if (err) {
                        console.log(err.message);
                    } else {
                        console.log('rs closed');
                    }
                    connection.release(function (err) {
                        if (err) {
                            console.log(err.message);
                        } else {
                            console.log('connection released');
                        }
                    });
                });
            } else if (!tmprow) {
                resultSet.close(function (err) {
                    if (err) {
                        console.log(err.message);
                    } else {
                        console.log('rs closed');
                    }
                    connection.release(function (err) {
                        if (err) {
                            console.log(err.message);
                        } else {
                            console.log('connection released');
                            cb(rscounts, tmparray);
                        }
                    });
                });
            } else {
                var pushedarray = '({';
                var row = {};
                for (var i = 0; i < tmprow.length; i++) {
                    if (metaData[i]['name'].toLowerCase() == 'maxrownumber') {
                        rscounts = tmprow[i];
                    }
                    row[metaData[i]['name'].toLowerCase()] = tmprow[i];
                }
                tmparray.push(row);
                fetchOneRowFromRS(rscounts, connection, resultSet, tmparray, metaData, cb);
            }
        });
    }

};

exports.shut_down_pool = function () {
    oracle_pool.end();
    console.log("oracle pool shutdown");
};

exports.sqlParser = function (sql, params, conditions, filter) {
    var criteria = _.extend({}, filter, conditions);
    sql = sql.replace(/[\s;]*$/, '');
    _.each(criteria, function(v, k){
        var reg = new RegExp('#' + k, 'ig');
        var paramValue = "'" + v + "'";
        sql = sql.replace(reg, paramValue);
    });
    console.log('Constructed SQL: \n' + sql);
    return sql;
};
