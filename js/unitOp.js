/**
 * 批量获取相应的本地化字符串
 * @param document {document} dom对象
 * @param messages {Array} 待翻译的文本  如[{message:"options_header_title",placeholders:["测试"]}]   options_header_title是页面的id
 * @returns {{}}  返回本地化之后的数据
 * @constructor
 */
export function GetMessages(document,...messages) {
    let messageDatas={}; /*翻译的文本对应*/
    console.log(messages)
    if (messages.length==0){
        return messageDatas
    }
    for (let i = 0; i <messages.length ; i++) {
        if(messages[i].hasOwnProperty('placeholders') && messages[i]['placeholders']){
            messageDatas[messages[i].message]= chrome.i18n.getMessage(messages[i].message,messages[i].placeholders);
        }else{
            console.log(messages[i].message)
            messageDatas[messages[i].message]= chrome.i18n.getMessage(messages[i].message);
        }
    }
    return messageDatas;
}

/**
 * 根据id批量对页面进行文本渲染
 * @param document {document} dom对象
 * @param messageDatas {Object} 翻译文本的对象 如[{message:"options_header_title",placeholders:["测试"]}]   options_header_title是页面的id
 */
export function renderText(document,messageDatas){
    let qtype=Object.prototype.toString.call(messageDatas).split(" ")[1];
    qtype=qtype.substring(0,qtype.length-1);
    if(qtype!="Object"){
        return
    }
    for (let key in messageDatas){
        try {
            let keyEle=document.getElementById(key);
            keyEle.innerText=messageDatas[key];
        }catch (e) {
            console.log(e)
        }

    }
}

/**
 * 根据每个域名的tts计算进度条的大小，并且根据sort字段进行排序
 * @param domainList {Array} 域名的列表
 * @returns {[]} 返回处理后的域名列表
 */
export function calculationProgress(domainList) {
    let handleDomainList=[];
    let qtype=Object.prototype.toString.call(domainList).split(" ")[1];
    qtype=qtype.substring(0,qtype.length-1);
    if(qtype!="Array"){
        return handleDomainList
    }
    let step=10; /*每个区间的步长*/
    let ttsMin=100;  /*整个区间最小长度*/
    let multipleStep=50;  /*整个区间的基础倍数*/
    let ttsList=domainList.map(item=>item.tts);
    let ttsMax=Math.max(...ttsList);
    ttsMax=(parseInt(ttsMax/multipleStep)+(ttsMax%multipleStep>0 ? 1 : 0))*multipleStep;
    ttsMax=ttsMax>ttsMin ? ttsMax : ttsMin;
    let stepCount=ttsMax/step;  /*多少个步长区间*/

    for (let i = 0; i < domainList.length; i++) {
        if(domainList[i].tts){
            let tmpCount=Math.round((ttsMax-domainList[i].tts)/step);
            domainList[i].progress=(tmpCount/stepCount*100).toFixed(2);
            handleDomainList.push(domainList[i]);
        }else{
            domainList[i].progress=0;
            handleDomainList.push(domainList[i]);
        }

    }
    handleDomainList.sort((a,b)=>{
        return a.sort-b.sort
    });
    return handleDomainList
}

/**
 * 修改单条记录的域名、端口
 * @param domainList {Array} 全部域名记录
 * @param sort {Number} 记录序号
 * @param domain {String} 域名
 * @param port {Number} 端口
 * @returns {[]} 返回处理后的域名列表
 */
export function editDomain(domainList,sort,domain,port){
    for (let i = 0; i < domainList.length; i++) {
        if(domainList[i].sort==sort){
            domainList[i].domain=domain;
            domainList[i].port=port;
            domainList[i].status=0;
            break;
        }
    }
    chrome.storage.sync.set({domainList});
    return domainList
}

/**
 * 根据sort删除记录
 * @param domainList {Array} 全部域名记录
 * @param sort {Number} 记录序号
 * @returns {*} 返回处理后的域名列表
 */
export function deleteDomain(domainList,sort) {
    let  handleDomainList=domainList.filter(function (item) {
        return item.sort!=sort
    })
    chrome.storage.sync.set({domainList:handleDomainList});
    return handleDomainList
}

/**
 * 增加域名记录
 * @param domainList {Array} 全部域名记录
 * @returns {*} 返回处理后的域名列表
 */
export function addDomain(domainList) {
    let sort=domainList.length+1;
    let one={sort:sort,domain:"",port:0,tts:0,progress:0,status:0};
    domainList.push(one);
    chrome.storage.sync.set({domainList});
    return domainList
}

/**
 * 测试域名的延时时间
 * @param domain {String} 域名
 * @param port {Number} 端口
 * @param callback 回调函数
 */
function checkTts(domain,port,callback) {
    let startTime=new Date();
    if(!domain || !port){
        if(callback && typeof callback=='function'){
            callback(false,0)
        }
        return
    }
    chrome.sockets.tcp.create(function (createInfo) {
        let socketId=createInfo.socketId;
        chrome.sockets.tcp.connect(socketId,domain,port,function (result) {
            if(result>=0){
                /*握手成功*/
                let endTime=new Date();
                let tts=endTime-startTime;
                if(callback && typeof callback=='function'){
                    callback(true,tts);
                }
                chrome.sockets.tcp.disconnect(socketId,function () {
                    // console.log('sockets disconnect')
                });
            }else{
                /*握手失败*/
                if(callback && typeof callback=='function'){
                    callback(false,0)
                }
            }
            chrome.sockets.tcp.close(socketId,function () {
                // console.log("sockets close")
            });
        })
    })
}

/**
 * 单条域名记录的测试
 * @param domainList {Array} 全部域名记录
 * @param sort {Number} 记录序号
 * @param callback {Function} 执行完成的回调函数
 */
export function singleDomainCheck(domainList,sort,callback) {
    let data={};
    let index=NaN;
    for (let i = 0; i <domainList.length ; i++) {
        if(domainList[i].sort==sort){
            data=domainList[i];
            index=i;
            break
        }
    }
    checkTts(data.domain,data.port,function (result,tts) {
        console.log(result,tts)
        if(result){
            domainList[index].tts=tts;
            domainList[index].status=1;
        }else{
            domainList[index].tts=tts;
            domainList[index].status=2;
        }
        chrome.storage.sync.set({domainList});
        callback(domainList);
    })
}

/**
 * 全部域名记录的测试
 * @param domainList {Array} 全部域名记录
 * @param callback {Function} 执行完成的回调函数
 * @constructor
 */
export function allDomainCheck(domainList,callback) {
    let index=0;
    let count=domainList.length;
    let doamin=domainList[index].domain;
    let port=domainList[index].port;
    if(index==count){
        if(callback && typeof callback=='function'){
            callback()
        }
        return
    }
    function checkOne(domain,port) {
        checkTts(domain,port,function (result,tts) {
            if(result){
                domainList[index].tts=tts;
                domainList[index].status=1;
            }else{
                domainList[index].tts=tts;
                domainList[index].status=2;
            }
            index+=1;
            if(index==count){
                chrome.storage.sync.set({domainList});
                if(callback && typeof callback=='function'){
                    callback()
                }
                return
            }
            checkOne(domainList[index].domain, domainList[index].port);
        })
    }
    checkOne(doamin,port)
}
