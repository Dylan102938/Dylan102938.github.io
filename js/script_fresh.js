var $video = document.getElementById('PVideo');

var $cvsContainer = document.getElementById('canvasContainer');
var $resultContainer = document.getElementById('resultContainer');
var scanner = null;
var runtimeSettings = null;

let deafultBarcodeFormatIds = null;
function getQueryStringArgs() {
    var qs = (window.location.search.length > 0 ? window.location.search.substring(1) : ''),
        args = {},
        items = qs.length ? qs.split('&') : [],
        item = null,
        name = null,
        value = null,
        i = 0,
        len = items.length;
    for (i = 0; i < len; i++) {
        item = items[i].split('=');
        name = decodeURIComponent(item[0]);
        value = decodeURIComponent(item[1]);
        if (name.length) {
            args[name] = value;
        }
    }
    return args;
}

let objQueryStringArgs = getQueryStringArgs();
if(objQueryStringArgs.full){
    Dynamsoft.BarcodeReader._bUseFullFeature = !!(getQueryStringArgs().full);
    deafultBarcodeFormatIds = Dynamsoft.EnumBarcodeFormat.BF_ALL;
    $('#div-full-feature').hide();
}else{
    deafultBarcodeFormatIds = (Dynamsoft.EnumBarcodeFormat.BF_ONED | Dynamsoft.EnumBarcodeFormat.BF_QR_CODE | Dynamsoft.EnumBarcodeFormat.BF_PDF417 | Dynamsoft.EnumBarcodeFormat.BF_DATAMATRIX);
    $("#s1DAll").prop("disabled", true);
    $("#s1DAll").parent().children("label").first().hide();
    $("#s2DAll").prop("disabled", true);
    $("#s2DAll").parent().children("label").first().hide();
}

let funcTryRedirectToFull = function(txt){
    if(Dynamsoft.BarcodeReader._bUseFullFeature) return Promise.resolve();
    $("#dialog-redirect-why").text(txt);
    return new Promise((resolve)=>{
        $("#dialog-redirect").show();
        document.getElementById("dialog-redirect-cancel").onclick = function(){
            this.onclick = null;
            $("#dialog-redirect").hide();
            resolve();
        };
    });
};

$("#dialog-redirect-ok").click(function(){
    let locQuestion = window.location.href.lastIndexOf('?');
    let locHash = window.location.href.lastIndexOf('#');
    let strSearch = "full=true";
    let $iptInterval = $('.ls-option input[name="settingInterval"]:checked');
    if($iptInterval.length){
        strSearch += "&interval="+$iptInterval[0].value;
    }
    let $iptMode = $('.ls-option input[name="settingMode"]:checked');
    if($iptMode.length){
        strSearch += "&mode="+$iptMode[0].value;
    }
    if($('#ipt-invertcolor').prop("checked"))strSearch += "&invertcolor=true";
    if($('#ipt-dpm').prop("checked"))strSearch += "&dpm=true";
    if(-1 === locQuestion){
        if(-1 === locHash){
            // no ?, no #
            window.location.href += "?"+strSearch;
        }else{
            // have #
            window.location.href = window.location.href.substring(0, locQuestion) + "?"+strSearch + window.location.href.substring(locQuestion);
        }
    }else{
        // have ?
        window.location.href = window.location.href.substring(0, locQuestion + 1) + strSearch+"&" + window.location.href.substring(locQuestion + 1);
    }
});

Dynamsoft.BarcodeScanner.createInstance().then(async (instance)=>{
    scanner = instance;
    scanner.UIElement = document.body;

    scanner.onUnduplicatedRead = function (txt, result) {
        ringBell();
        const proxyurl = "https://cors-anywhere.herokuapp.com/"; // Use a proxy to avoid CORS error
        const api_key = "pc5bedvbag3y8lkaljlb7qvzysz87p";
        const url = proxyurl + "https://api.barcodelookup.com/v2/products?barcode=" + txt + "&formatted=y&key=" + api_key;

        fetch(url)
            .then(response => response.json())
            .then((data) => {
                var result = data['products'][0];
                console.log(result);

                var prodName = result['product_name'];
                var barcode = result['barcode_number'];
                var image = result['images'][0];
                var ingredients = result['ingredients'];
                var nutrFacts = result['nutrition_facts'];

                document.getElementById("results-card").innerHTML =
                    "<img src = '" + image + "' class = 'scanned_image'>" +
                    "<br><br>" +
                    "Name: " + prodName + "<br><br>" +
                    "Barcode: " + barcode + "<br><br>" +
                    "<button class = 'submit-button'>Add to Storage</button>";

            })
            .catch(err => {
                throw err
            });
    };

    if(Dynamsoft.BarcodeReader._bUseFullFeature){
        runtimeSettings = await scanner.getRuntimeSettings();
        runtimeSettings.barcodeFormatIds_2 = 0x1f00000;
        scanner.updateRuntimeSettings(runtimeSettings);
    }

    runtimeSettings = await scanner.getRuntimeSettings();
    // update settings
    if(objQueryStringArgs.interval){
        $("#ipt-interval-"+objQueryStringArgs.interval).prop('checked', true);
        $("#ipt-interval-"+objQueryStringArgs.interval).change();
    }else{
        $('#ipt-interval-100').prop('checked', true);
        $('#ipt-interval-100').change();
    }
    if(objQueryStringArgs.dpm){ // dpm can work when mode change, so not invork change
        $('#ipt-dpm').prop("checked", true);
    }
    if(objQueryStringArgs.mode){
        $("#ipt-mode-"+objQueryStringArgs.mode).prop('checked', true);
        $("#ipt-mode-"+objQueryStringArgs.mode).change();
    }else{
        $('#ipt-mode-bestspeed').prop('checked', true);
        $('#ipt-mode-bestspeed').change();
    }

    if(objQueryStringArgs.invertcolor){
        $('#ipt-invertcolor').prop("checked", true);
        $('#ipt-invertcolor').change();
    }
    return await scanner.open();
}).then(async function () {
    // camera exist
    $('.picker').fadeIn(300);
    // ui update frame scanning
    $('.scanning-container').css({
        'width': $('#PVideo').css('width'),
        'height': $('#PVideo').css('height')
    });
    // ui update video source
    let curCam = await scanner.getCurrentCamera();
    let allCam = await scanner.getAllCameras();
    for (var i = 0; i < allCam.length; i++) {
        $('#SSource .ls-body').append('<div class="ls-option"><input type="radio" name="source" id="sou' +
            i + '" value="' + allCam[i].deviceId + '"><label for="sou' + i + '" class="radio-btn"></label><label for="sou' + i + '">' + allCam[i].label + '</label></div>');
        if (curCam && allCam[i].deviceId === curCam.deviceId) {
            $('#sou' + i).prop('checked', true);
        }
    }
    // video source changed
    $('.ls-option input[name="source"]').change(function () {
        scanner.play(this.value).then(function (resolution) {
            $('.scanning-container').css({
                'width': resolution.width,
                'height': resolution.height
            });
            $('#cResolution').text(resolution.width + ' × ' + resolution.height);
            $('#MRegion').prop('checked')?resetRegion():setRegion();
        });
    });
    // ui update video resolution
    let resolution = scanner.getResolution();
    $('input[name="resolution"]').each(function () {
        if (($(this).attr('data-width') == resolution[0] && $(this).attr('data-height') == resolution[1]) ||
            (($(this).attr('data-width') == resolution[1] && $(this).attr('data-height') == resolution[0]))) {
            $(this).prop('checked', true);
        }
    });
    $('#cResolution').text(resolution[0] + ' × ' + resolution[1]);

    // ui update barcodeFormat
    $('input[name="format"]').each(function () {
        let formatValue = parseInt(this.getAttribute("value"));
        if(!$(this).hasClass('ipt-bf2')){
            if((runtimeSettings.barcodeFormatIds & formatValue) == (~~formatValue)){
                $(this).prop('checked', true);
            }
        }else{
            if((runtimeSettings.barcodeFormatIds_2 & formatValue) == (~~formatValue)){
                $(this).prop('checked', true);
            }
        }
    });


    resetRegion();

    // ready?
    setTimeout(function () {
        $('.waiting').fadeOut(300);
    }, 100);
}, function (ex) {
    console.error(ex); //eslint-disable-line
    // alert(ex);
    let errorTxt = ex.message || ex;
    if (/t support Webassembly/.test(errorTxt) || /not an object/.test(errorTxt)) {
        $('#notSupport').fadeIn(300);
    } else if (/Permission/.test(errorTxt) || /video/.test(errorTxt) || /device/.test(errorTxt) || /Media/.test(errorTxt) || /agent/.test(errorTxt) || /found/.test(errorTxt))
        $('#noCam').fadeIn(300);
    else {
        alert(errorTxt);
    }
    //scanner.close();
});

// which leftbar item selected
var _itemSelect = 0;

$('.leftbar input[name="lItem"]').click(function () {
    if (_itemSelect === this.value) {
        _itemSelect = 0;
        $('.l-secondary').css('display', 'none');
        this.checked = false;
    } else if (_itemSelect !== this.value) {
        $(".l-secondary").css('display', 'none');
        _itemSelect = this.value;
        switch (this.value) {
            case 'itemSource':
                $('#SSource').css('display', 'block');
                break;
            case 'itemResolution':
                $('#SResolution').css('display', 'block');
                break;
            case 'itemFormats':
                $('#SFormats').css('display', 'block');
                break;
            case 'itemSettings':
                $('#SSettings').css('display', 'block');
                break;
            case 'itemAbout':
                $('#SAbout').css('display', 'block');
                break;
            default:
                break;
        }
    }
});

// click other region to hide left bar
$('.l-item').click(function (ev) {
    ev.stopPropagation();
    $(".l-secondary").css('display', 'none');
});
$(document).click(function (ev) {
    if (!$('.leftbar').is(ev.target) && $('.leftbar').has(ev.target).length === 0 && !$('#MMenu').is(ev.target) && !$('.m-region').is(ev.target)) {
        _itemSelect = 0;
        $('.leftbar input[name="lItem"]').each(function () {
            this.checked = false;
        });
        $('.l-secondary').hide();
        if ($('.h-sign-in-mobile').css('display') === 'block') {
            document.querySelector('#leftbar').className = 'leftbar hidden';
            $('#MMenu').prop('checked', false);
        }
    }
});

// video resolution changed
$('input[name="resolution"]').change(function () {
    var _curDevice = 0,
        _curWidth = $(this).attr('data-width'),
        _curHeight = $(this).attr('data-height');
    $('input[name="source"]').each(function () {
        if (this.checked) _curDevice = this.value;
    });
    scanner.play(_curDevice, _curWidth, _curHeight).then(function (resolution) {
        $('#cResolution').text(resolution.width + ' × ' + resolution.height);
        $('#MRegion').prop('checked')?resetRegion():setRegion();
    });
});

// video format changed
$('#s1DAll').change(async function () {
    let _flag = 0;
    $('.ls-option-2d input[name="format"]').each(function () {
        if (this.checked) _flag |= parseInt(this.value);
    });
    if (this.checked) {
        runtimeSettings.barcodeFormatIds = _flag | Dynamsoft.EnumBarcodeFormat.BF_ONED | Dynamsoft.EnumBarcodeFormat.BF_GS1_DATABAR;
        await scanner.updateRuntimeSettings(runtimeSettings);
        $('.ls-option-1d input').prop('checked', true);
    } else if (!this.checked) {
        if (_flag === 0) {
            $(this).prop('checked', true);
            alert('Please select at lease one barcode format');
        } else {
            runtimeSettings.barcodeFormatIds = _flag;
            await scanner.updateRuntimeSettings(runtimeSettings);
            $('.ls-option-1d input').prop('checked', false);
        }
    }
});
$('#s2DAll').change(async function () {
    let _flag = 0;
    $('.ls-option-1d input[name="format"]').each(function () {
        if (this.checked) _flag |= parseInt(this.value);
    });
    if (this.checked) {
        runtimeSettings.barcodeFormatIds = _flag | ((Dynamsoft.EnumBarcodeFormat.BF_ALL & ~(Dynamsoft.EnumBarcodeFormat.BF_ONED | Dynamsoft.EnumBarcodeFormat.BF_GS1_DATABAR)));
        await scanner.updateRuntimeSettings(runtimeSettings);
        $('.ls-option-2d input').prop('checked', true);
    } else if (!this.checked) {
        if (_flag === 0) {
            $(this).prop('checked', true);
            alert('Please select at lease one barcode format');
        } else {
            runtimeSettings.barcodeFormatIds = _flag;
            await scanner.updateRuntimeSettings(runtimeSettings);
            $('.ls-option-2d input').prop('checked', false);
        }
    }
});
$('.ls-body input[name="format"]').change(async function () {
    let thisValue = parseInt(this.value);
    if(!Dynamsoft.BarcodeReader._bUseFullFeature && (
        (thisValue & deafultBarcodeFormatIds) != (~~thisValue)
        ||
        $(this).hasClass("ipt-bf2")
    )){
        await funcTryRedirectToFull('read ' + $(this).attr('txt'));
        $(this).prop("checked", false);
        return;
    }

    let _flag1 = 0,
        _flag2 = 0,
        _flag3 = 0;
    $('.ls-option-1d input[name="format"]').each(function () {
        if (this.checked) _flag1 |= parseInt(this.value);
    });
    $('.ls-option-2d input[name="format"]').each(function () {
        if (this.checked) _flag2 |= parseInt(this.value);
    });
    $('.ls-option-bf2 input[name="format"]').each(function () {
        if (this.checked) _flag3 |= parseInt(this.value);
    });
    if (_flag1 != (Dynamsoft.EnumBarcodeFormat.BF_ONED | Dynamsoft.EnumBarcodeFormat.BF_GS1_DATABAR)) $('#s1DAll').prop('checked', false);
    if (_flag1 === (Dynamsoft.EnumBarcodeFormat.BF_ONED | Dynamsoft.EnumBarcodeFormat.BF_GS1_DATABAR)) $('#s1DAll').prop('checked', true);
    if (_flag2 != (Dynamsoft.EnumBarcodeFormat.BF_ALL & ~(Dynamsoft.EnumBarcodeFormat.BF_ONED | Dynamsoft.EnumBarcodeFormat.BF_GS1_DATABAR))) $('#s2DAll').prop('checked', false);
    if (_flag2 === (Dynamsoft.EnumBarcodeFormat.BF_ALL & ~(Dynamsoft.EnumBarcodeFormat.BF_ONED | Dynamsoft.EnumBarcodeFormat.BF_GS1_DATABAR))) $('#s2DAll').prop('checked', true);

    if ((_flag1 | _flag2) === 0 && _flag3 === 0) {
        $(this).prop('checked', true);
        alert('Please select at lease one barcode format');
    } else {
        runtimeSettings.barcodeFormatIds = _flag1 | _flag2;
        runtimeSettings.barcodeFormatIds_2 = _flag3;
        await scanner.updateRuntimeSettings(runtimeSettings);
    }
});

// video reading interval chaneged
$('.ls-option input[name="settingInterval"]').change(function () {
    scanner.intervalTime = parseInt(this.value);
});

// video reading mode changed
$('.ls-option input[name="settingMode"]').change(async function () {
    if('bestspeed' == this.value){
        runtimeSettings.deblurLevel = 0;
        runtimeSettings.expectedBarcodesCount = 0;
        runtimeSettings.scaleDownThreshold = 2300;
        runtimeSettings.localizationModes = [
            Dynamsoft.EnumLocalizationMode.LM_SCAN_DIRECTLY,
            Dynamsoft.EnumLocalizationMode.LM_CONNECTED_BLOCKS,
            0,0,0,0,0,0
        ];
        runtimeSettings.timeout = 10000;
    }else if('balance' == this.value){
        runtimeSettings.deblurLevel = 3;
        runtimeSettings.expectedBarcodesCount = 512;
        runtimeSettings.scaleDownThreshold = 2300;
        runtimeSettings.localizationModes = [
            Dynamsoft.EnumLocalizationMode.LM_CONNECTED_BLOCKS,
            Dynamsoft.EnumLocalizationMode.LM_SCAN_DIRECTLY,
            0,0,0,0,0,0
        ];
        runtimeSettings.timeout = 100000;
    }else if('bestcoverage' == this.value){
        runtimeSettings.deblurLevel = 5;
        runtimeSettings.expectedBarcodesCount = 512;
        runtimeSettings.scaleDownThreshold = 100000;
        runtimeSettings.localizationModes = [
            Dynamsoft.EnumLocalizationMode.LM_CONNECTED_BLOCKS,
            Dynamsoft.EnumLocalizationMode.LM_STATISTICS,
            Dynamsoft.EnumLocalizationMode.LM_SCAN_DIRECTLY,
            Dynamsoft.EnumLocalizationMode.LM_LINES,
            0,0,0,0
        ];
        runtimeSettings.timeout = 100000;
    }
    if($('#ipt-dpm').prop("checked")){
        let locModes = runtimeSettings.localizationModes;
        for(let i in locModes){
            if(locModes[i] == Dynamsoft.EnumLocalizationMode.LM_STATISTICS_MARKS){
                break;
            }
            if(locModes[i] == 0){
                locModes[i] = Dynamsoft.EnumLocalizationMode.LM_STATISTICS_MARKS;
                break;
            }
        }
    }
    await scanner.updateRuntimeSettings(runtimeSettings);
});
// video reading feature changed
$('#ipt-invertcolor').change(async function () {
    runtimeSettings.furtherModes.grayscaleTransformationModes = [
        $(this).prop("checked") ? Dynamsoft.EnumGrayscaleTransformationMode.GTM_INVERTED : Dynamsoft.EnumGrayscaleTransformationMode.GTM_ORIGINAL,
        0,0,0,0,0,0,0
    ];
    await scanner.updateRuntimeSettings(runtimeSettings);
});
$('#ipt-dpm').change(async function(){
    if(!Dynamsoft.BarcodeReader._bUseFullFeature){
        await funcTryRedirectToFull("use DPM");
        $(this).prop("checked", false);
        return;
    }
    if($(this).prop('checked')){
        let locModes = runtimeSettings.localizationModes;
        for(let i in locModes){
            if(locModes[i] == Dynamsoft.EnumLocalizationMode.LM_STATISTICS_MARKS){
                break;
            }
            if(locModes[i] == 0){
                locModes[i] = Dynamsoft.EnumLocalizationMode.LM_STATISTICS_MARKS;
                break;
            }
        }
    }else{
        let locModes = runtimeSettings.localizationModes;
        for(let i in locModes){
            if(locModes[i] == Dynamsoft.EnumLocalizationMode.LM_STATISTICS_MARKS){
                locModes[i] = 0;
                break;
            }
            if(locModes[i] == 0){
                break;
            }
        }
    }
    await scanner.updateRuntimeSettings(runtimeSettings);
});

let resetRegion = async () => {

    let videoComputedStyle = window.getComputedStyle($video);
    let videoComputedWidth = Math.round(parseFloat(videoComputedStyle.getPropertyValue('width')));
    let videoComputedHeight = Math.round(parseFloat(videoComputedStyle.getPropertyValue('height')));
    let resizeRate = 1;
    if (videoComputedWidth < $video.videoWidth) {
        resizeRate = videoComputedWidth / $video.videoWidth;
    }

    $cvsContainer.style.transform = 'matrix(' + [resizeRate, 0, 0, resizeRate, 0, 0].join(',') + ')';
    $('.scanning-container').css({
        'width': videoComputedWidth + 'px',
        'height': videoComputedHeight + 'px'
    });
    $cvsContainer.style.width = $video.videoWidth + 'px';
    $cvsContainer.style.height = $video.videoHeight + 'px';

    runtimeSettings.region.regionLeft = runtimeSettings.region.regionTop = 0;
    runtimeSettings.region.regionRight = runtimeSettings.region.regionBottom = 100;
    runtimeSettings.region.regionMeasuredByPercentage = 1;
    await scanner.updateRuntimeSettings(runtimeSettings);
};
var setRegion = async () => {
    // take a center part of the video and resize the part before decode

    let videoComputedStyle = window.getComputedStyle($video);
    let videoComputedWidth = Math.round(parseFloat(videoComputedStyle.getPropertyValue('width')));
    let videoComputedHeight = Math.round(parseFloat(videoComputedStyle.getPropertyValue('height')));
    let resizeRate = 1;
    if (videoComputedWidth < $video.videoWidth) {
        resizeRate = videoComputedWidth / $video.videoWidth;
    }

    $cvsContainer.style.transform = 'matrix(' + [resizeRate, 0, 0, resizeRate, 0, 0].join(',') + ')';
    $('.scanning-container').css({
        'width': videoComputedWidth + 'px',
        'height': videoComputedHeight + 'px'
    });
    $cvsContainer.style.width = $video.videoWidth + 'px';
    $cvsContainer.style.height = $video.videoHeight + 'px';

    setTimeout(async()=>{
        let cw = $('.sc-frame1').width(),
            ch = $('.sc-frame1').height(),
            vw = $('.scanning-container').width(),
            vh = $('.scanning-container').height();
        // sometimes vw, vh got negative number, walk around it.
        if (vw <= 0) { vw = 2; }
        if (vh <= 0) { vw = 2; }

        runtimeSettings.region.regionLeft = Math.round((vw - cw) / resizeRate / 2);
        runtimeSettings.region.regionRight = Math.round((vw + cw) / resizeRate / 2);
        runtimeSettings.region.regionTop = Math.round((vh - ch) / resizeRate / 2);
        runtimeSettings.region.regionBottom = Math.round((vh + ch) / resizeRate / 2);
        runtimeSettings.region.regionMeasuredByPercentage = 0;
        await scanner.updateRuntimeSettings(runtimeSettings);
    },0);

};

$('#ipt-full-feature').change(async function () {
    await funcTryRedirectToFull("support more barcode format and DPM");
    $(this).prop("checked",false);
});
$('#ipt-full-feature').prop('checked', false);

// mobile menu btn
$('#MMenu').change(function () {
    if (this.checked) {
        document.querySelector('#leftbar').className = 'leftbar visible';
    } else {
        document.querySelector('#leftbar').className = 'leftbar hidden';
    }
});

// mobile region btn
$('#MRegion').change(function () {
    $('canvas').remove();
    // full
    if (this.checked) {
        $('.scanning-container').fadeOut(300);
        resetRegion();
    } // region
    else {
        $('.scanning-container').fadeIn(300);
        setRegion();
    }
});

// clear cache
$('#clearCache').click(function(){
    var oldText = this.innerText;
    this.innerText = 'clearing...';
    $(this).addClass('disable-button');
    try{
        var request = window.indexedDB.deleteDatabase('dynamsoft');
        request.onsuccess = request.onerror = ()=>{
            if(request.error){
                alert('Clear failed: '+(request.error.message || request.error));
            }else{
                alert('Clear success!');
            }
            this.innerText = oldText;
            $(this).removeClass('disable-button');
        };
    }catch(ex){
        alert(ex.message || ex);
        this.innerText = oldText;
        $(this).removeClass('disable-button');
    }
});
$('#MRegion').prop('checked', true);

var getVideoFrame = () => {//eslint-disable-line
    if($video.paused){
        let _aImg = document.createElement('a');
        let _canvas = document.createElement("canvas");

        _canvas.width = $video.videoWidth;
        _canvas.height = $video.videoHeight;
        _canvas.getContext('2d').drawImage($video, 0, 0, _canvas.width, _canvas.height);

        _aImg.href = _canvas.toDataURL("image/png");
        _aImg.download = "img.png";
        _aImg.click();

        _canvas.remove();
        _aImg.remove();
    }
};