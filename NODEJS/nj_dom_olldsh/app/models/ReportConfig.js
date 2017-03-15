var mongoose = require('./index');
//define of ReportConfig
var conditionSchema = mongoose.Schema({
    key:String,
    name:String,
    need:Boolean,
    type:String,
    multi:Boolean,
    value:String,
    convertTimezone:Boolean,
    sequenceNum:Number,
    default:String,
});
var headerSchema = mongoose.Schema({
    key:String,
    value:String,
    sequenceNum:Number
});
var footerSchema = mongoose.Schema({
    key:String,
    value:String,
    sequenceNum:Number
});
var detailSchema = mongoose.Schema({
    key:String,
    value:String,
    convertTimezone:Boolean,
    sequenceNum:Number
});

var subSchema = mongoose.Schema({
    name:String,
    datasource:String,
    detail:[detailSchema],
    sequenceNum:Number
});

var axisSchema = mongoose.Schema({
    which:String,
    name:String,
    type:String,
    max:Number,
    interval:Number,
    data:String//which column
});

var reportConfigSchema = mongoose.Schema({
    //report & dashboard common
    type: String,// report or dashboard
    reportName:String,
    externalSystem:[mongoose.Schema.Types.ObjectId],
    externalSystemName: String,
    authorizedUser:[mongoose.Schema.Types.ObjectId],
    authorizedUserName: String,
    remark:{type: String, default: ''},
    internalRemark: {type: String, default: ''},
    condition:[conditionSchema],
    createUser:{type:String,default:'ADMIN'},
    // createUser:[mongoose.Schema.Types.ObjectId],
    createDate:{type:Date,default:Date.now},
    updateUser:{type:String,default:'ADMIN'},
    updateDate:{type:Date,default:Date.now},
    language:String,

    //report specific
    connection: mongoose.Schema.Types.ObjectId,
    connectionName: String,
    datasource:String,
    detailName:String,
    header:[headerSchema],
    detail:[detailSchema],
    footer:[footerSchema],
    sub:[subSchema],
    pageHeight:Number,


    //dashboard specific
    css:String,
    panels: [
        {
            title: String,
            remark: String,
            condition: [conditionSchema],
            detail: [detailSchema],
            connection: mongoose.Schema.Types.ObjectId,
            connectionName: String,
            datasource: String,
            chartType: String,
            jsCustomizationCode: String,
            webpageUrl: String,
            frame: {x: Number, y: Number, width: Number, height: Number},
            autoRefresh: Boolean,
            refreshInterval: Number,
            moreConfig:{
                legend:{
                    legendType:String,
                    value:[String]
                },
                series:{
                    name:String,
                    value:[String]
                },
                axis:[axisSchema]//length=3
            },
            theme:String,
            active: Boolean,
            // autoShow:Boolean,
            hideTitle: Boolean
        }
    ],
    // adds.
    autoShow: Boolean,
    active: Boolean
});


//define interface of DataConnection
reportConfigSchema.methods.getParameters = function () {
    return this.params.split('\n');
};
var ReportConfig = mongoose.model('ReportConfig',reportConfigSchema);
module.exports = ReportConfig;
//OR Mapping

