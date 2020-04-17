import {GetMessages,renderText,calculationProgress,editDomain,deleteDomain,addDomain,singleDomainCheck,allDomainCheck} from "./unitOp.js";

/*对应翻译的字段*/
let messages=[
    {message:"options_header_title"},
    {message:"options_header_content"},
    {message:"options_add_domain"},
    {message:"options_add_domain"},
    {message:"options_check_all_domain"},
    {message:"options_th_domain"},
    {message:"options_th_port"},
    {message:"options_th_result"},
    {message:"options_th_status"},
    // {message:"options_td_operate_ping"},
    // {message:"options_td_operate_edit"},
    // {message:"options_td_operate_save"},
    // {message:"options_td_operate_delete"},
    // {message:"options_save_error_empty"}
];


document.title=chrome.i18n.getMessage('title');

let messageDatas=GetMessages(window.document,...messages);
renderText(window.document,messageDatas);

let domainList=[
    /*
    * status是测试状态，0未开始测试，1测试成功 2测试失败
    * */

    {sort:1,domain:"www.baidu.com",port:443,tts:0,progress:0,status:0},
    {sort:2,domain:"www.jd.com",port:443,tts:0,progress:0,status:0},
    {sort:4,domain:"www.qq.com",port:443,tts:0,progress:0,status:0},
    {sort:3,domain:"www.bing.com",port:443,tts:0,progress:0,status:0},
    {sort:5,domain:"www.yandex.com",port:443,tts:0,progress:0,status:0},
    {sort:7,domain:"www.github.com",port:443,tts:0,progress:0,status:0},
    {sort:6,domain:"segmentfault.com",port:443,tts:0,progress:0,status:0}

];



/**
 * 每个域名记录渲染到dom中
 */
function renderDom(domainList){
    let handleDomainList=calculationProgress(domainList);
    let trList="";
    for (let i = 0; i <handleDomainList.length ; i++) {
        let labelClss=handleDomainList[i].status==0 ? 'label-warning' : handleDomainList[i].status==1 ? 'label-success' : 'label-danger';
        let labelText=handleDomainList[i].status==0 ? 'unInit' : handleDomainList[i].status==1 ? 'success' : 'error';
        let onTr=`<tr>
                <td class="tts-sort">${handleDomainList[i].sort}</td>
                <td class="tts-domain">
                    <div class="form-group">
                        <input type="text" class="form-control" placeholder="doamin" value="${handleDomainList[i].domain}" disabled>
                    </div>
                </td>
                <td class="tts-port">
                    <div class="form-group">
                        <input type="number" class="form-control" placeholder="port" value="${handleDomainList[i].port}" disabled>
                    </div>
                </td>
                <td class="tts-progress">
                    <div class="progress">
                        <div class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="${handleDomainList[i].progress}" aria-valuemin="0" aria-valuemax="100" style="width: ${handleDomainList[i].progress}%;"> ${handleDomainList[i].tts}ms</div>
                    </div>
                </td>
                <td class="tts-label"><span class="label ${labelClss}">${labelText}</span></td>
                <td class="tts-op">
                    <button type="button" class="btn btn-success domain-ping" title="${chrome.i18n.getMessage('options_td_operate_ping')}"><i class="glyphicon glyphicon-play"></i></button>
                    <button class="btn btn-info domain-edit" title="${chrome.i18n.getMessage('options_td_operate_edit')}"><i class="glyphicon glyphicon-edit"></i></button>
                    <button class="btn btn-warning domain-save" title="${chrome.i18n.getMessage('options_td_operate_save')}" style="display: none"><i class="glyphicon glyphicon-floppy-disk"></i></button>
                    <button class="btn btn-danger domain-delete" title="${chrome.i18n.getMessage('options_td_operate_delete')}"><i class="glyphicon glyphicon-trash"></i></button>
                </td>
            </tr>`;
        trList+=onTr;
    }
    $('.domain-table tbody').html(trList);
}
/**
 * 轻提示的方法
 * @param message {String} 显示提示文本
 * @param duration {Number} 显示的时间 单位毫秒
 * @constructor
 */
function Toast(message,duration) {
    if(!message){
        return
    }
    clearTimeout(window.ToastTimeout);
    let time=duration ? duration : 2000;
    $('.toast').html(message);
    $('.toast').show();
    window.ToastTimeout=setTimeout(function () {
        $('.toast').hide();
    },time)
}

/**
 * 显示隐藏加载图标
 * @param flag {Boolean} true 显示  false 隐藏
 */
function showHideLoading(flag) {
    if(flag){
        $('.loading').show();
    }else{
        $('.loading').hide();
    }
}



chrome.storage.sync.get('domainList',function (value) {
    if(value.hasOwnProperty('domainList') && Array.isArray(value.domainList)){
        domainList=value.domainList;
    }
    renderDom(domainList);
});

$('.domain-table tbody').delegate('.domain-edit','click',function (event) {
    $(this).parents('tr').find('td.tts-domain input').removeAttr('disabled');
    $(this).parents('tr').find('td.tts-port input').removeAttr('disabled');
    $(this).siblings('.domain-save').show();
    $(this).hide();
});
$('.domain-table tbody').delegate('.domain-save','click',function (event) {
    let sort=parseInt($(this).parents('tr').find('td.tts-sort').text());
    let domain=$(this).parents('tr').find('td.tts-domain input').val();
    let port=parseInt($(this).parents('tr').find('td.tts-port input').val());
    console.log(domain,port,!domain || !port)
    if(!domain || !port){
        Toast(chrome.i18n.getMessage('options_save_error_empty'));
        return;
    }
    $(this).parents('tr').find('td.tts-domain input').attr('disabled','disabled');
    $(this).parents('tr').find('td.tts-port input').attr('disabled','disabled');
    domainList=editDomain(domainList,sort,domain,port);
    renderDom(domainList);
});
$('.domain-table tbody').delegate('.domain-delete','click',function (event) {
    let sort=parseInt($(this).parents('tr').find('td.tts-sort').text());
    domainList=deleteDomain(domainList,sort);
    renderDom(domainList);
});
$('#addDomain').bind('click',function (event) {
    domainList=addDomain(domainList);
    renderDom(domainList);
    let sort=domainList.length-1;
    let tr=$('.domain-table tbody tr')[sort];
    $(tr).find('.domain-edit').click();
});

$('.domain-table tbody').delegate('.domain-ping','click',function () {
    showHideLoading(true);
    let sort=parseInt($(this).parents('tr').find('td.tts-sort').text());
    singleDomainCheck(domainList,sort,function (result) {
        domainList=result;
        renderDom(domainList);
        showHideLoading(false);
        /*发送一个消息通知*/
        chrome.notifications.create({
            type:"basic",
            title:chrome.i18n.getMessage('options_ping_tip_title'),
            iconUrl:"images/ping128.png",
            message:chrome.i18n.getMessage('options_ping_tip_content'),
        })
    })
});

$('#checkAllDomain').bind('click',function (event) {
    showHideLoading(true);
    allDomainCheck(domainList,function () {
        renderDom(domainList);
        showHideLoading(false);
        /*发送一个消息通知*/
        chrome.notifications.create({
            type:"basic",
            title:chrome.i18n.getMessage('options_ping_tip_title'),
            iconUrl:"images/ping128.png",
            message:chrome.i18n.getMessage('options_ping_tip_content'),
        })
    });
});
