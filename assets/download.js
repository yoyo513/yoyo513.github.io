function triggerHiddenDownload(url){
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function downloadSimalutor(){
    triggerHiddenDownload("./FluxSECS Simalutor.7z");
}

function downloadSDK(){
    triggerHiddenDownload("./FluxSECS.7z");
}