/** 引入需要的模块 **/
const fs = require("fs");
const path = require("path");
const qs = require("qs");
const axios = require('axios');
const xlsx = require('node-xlsx');

/** 要爬取信息的条件 **/
searchParasm = {
    sex: 'f', //f（女），m(男),
    key: '', //关键词
    stc: '1:11,2:18.24,3:155.170,23:11', //1:11表示地点北京, 2:18.24表示年龄18到24岁, 3:155.170表示身高在155到170, 23:11表示有照片,stc说明及更多信息请查看README
};
/**要获取的交友信息参数（不需要的信息注释即可）**/
const getInfoParams = {
    nickname: '昵称',
    sex: '性别',
    marriage: '婚否',
    height: '身高',
    education: '学历',
    work_location: '工作地址',
    age: '年龄',
    image: '照片',
    // online: '是否在线',
    // helloUrl: '打招呼地址',
    // sendMsgUrl: '发消息地址',
    shortnote: '交友宣言',
    matchCondition: '交友要求'
}

/**
 * 写入信息到表格中
 * @param {string} name 表名称
 * @param {array} data 表格数据
 */
writeXls = (name, data) => {
    let buffer = xlsx.build([{
        name,
        data
    }]);
    fs.writeFileSync('info.xlsx', buffer, { 'flag': 'w' }); //生成excel
};
/**
 * 下载图片函数
 * **/
downImg = (params) => {
    axios({
        url: params.image,
        responseType: 'arraybuffer'
    }).then(res => {
        fs.writeFile(path.join(__dirname, './imgs/') + `/${params.nickname}.png`, res.data, { encoding: "binary" }, () => {});
    })
};

/**
 * 获取信息函数
 * **/
let pageNow = 1; //当前页面
let pageTotal = 0; //总数量
let tableHeardValue = Object.values(getInfoParams); //表格头部信息
let tableHeardKeys = Object.keys(getInfoParams); //表格头部信息
let tableData = []; //表格数据信息
getInfoHttp = async(p) => {
    await axios.get(`https://search.jiayuan.com/v2/search_v2.php?${qs.stringify(Object.assign(searchParasm,{p}))}`).then(res => {
        if (res.data.count && res.data.userInfo && res.data.userInfo.length) {
            pageTotal ? '' : pageTotal = res.data.pageTotal;
            res.data.userInfo.map(item => {
                // 异步下载头像
                item.image.includes('images1.') ? '' : downImg(item);
                // 过滤数据，存入到表格数组中
                let middle = []
                Object.entries(item).forEach(n => {
                    tableHeardKeys.includes(n[0]) ? middle.push(n[1]) : ''
                })
                tableData.push(middle);
            });
            console.log('\x1B[33m', `共${pageTotal}页，正在爬取第${pageNow}页信息`);
            if (pageNow < pageTotal) {
                getInfoHttp(pageNow++);
            } else {
                writeXls('交友信息', [tableHeardValue].concat(tableData));
                console.info('\x1B[36m%s\x1B[0m', `一共找到${tableData.length+1}个符合你的要求的交友信息！`);
            }
        }
    }).catch(err => {
        console.error('\x1B[31m', err);
    })
};
getInfoHttp();