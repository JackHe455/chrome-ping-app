/*chrome app启动事件*/
chrome.app.runtime.onLaunched.addListener(function () {
    /*创建窗口*/
    chrome.app.window.create('index.html',{
        outerBounds:{
            width:1000,
            height:800
        }
    },function () {
        /*发送一个消息通知*/
        // chrome.notifications.create({
        //     type:"basic",
        //     title:"提示",
        //     iconUrl:"images/snake48.png",
        //     message:"fuck you man",
        //     contextMessage:"yeah girl!"
        // })
    })
});
/*chrome app在安装成功或app更新成功再启动时的事件*/
chrome.runtime.onInstalled.addListener(function () {
    /*获取manifest文件配置*/
    let manifestData = chrome.runtime.getManifest();
    let version=manifestData.version;
    chrome.storage.local.set({version},function () {
        console.log("fuck")
    })
});

