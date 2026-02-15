

//selLang = SetCurrLang();
var stopAnimation = false;
var currentImage = 0;
var hideMode = false;							   

$(document).ready(function () {
    
    if (queryString("KtivRequestId") != "false" || queryString("TractateID") != "false") {
		hideMode = true;				  
        $("#alertByMovingToAnotherSite").css({ display: "block" });
        $("#alertByMovingToAnotherSite").text(selLang == 'eng' ? 'Please wait, Switching between sites' : 'נא להמתין, מתבצע מעבר בין האתרים');
        $("#alertByMovingToAnotherSite").prepend('<div class="loader"></div>');
    }
	if (queryString("GoToLinkParams") != "false" )
		hideMode = true;
});
function checkClientBrowser() {// if in ie8 displays a message
    $.ajax({
        type: 'GET',
        url: SSObaseUrl + "General/GetBrowser",
        dataType: 'jsonp',
        success: function (browser) {
            if (browser != null && browser != "") {
                if (browser.BrowserBrand == 0 && parseInt(browser.BrowserVersion) == 8) {//if in ie8
                    $('#fjmsMsgWrpr').show();
                    selLang == 'eng' ? $('#fjmsMsgText').html(ie8MsgEng) : $('#fjmsMsgText').html(ie8MsgHeb);
                    $('#fjmsMsgText').css(selLang + 'NotiMessg');
                }
            }
        },
        error: function (err) {
            alert(err.statusText);
        }
    });
}

function login() {
    //setTimeout(function(){
    //debugger
    var UIT = queryString("UIT");   //USER COMING FROM OTHER SITE has UIT in QS
    if (UIT == undefined) { return; }
    //USER LOGGED OFF OTHER SITE
    if (UIT == "") {
        createCookie("UIT", "", 1);
        createCookie("lang", "", 1);
        $("#hidUIT").val("");
        checkIfInst(UIT);
        return;
    }

    //NO UIT IN QS
    if (UIT == "false") {
        UIT = getCookie("UIT");
        $("#hidUIT").val(UIT);
        if (getCookie("isGuestMode") == "true" && UIT != "")
                UIT = "";
        //========goToSpecificSite=============
        if (queryString("site") != "false") {
            var url = (document.referrer == "") ? '*' : document.referrer; // coming from link = *

            var site = queryString("site");
            var lang = queryString("lang") != "false" ? queryString("lang") : selLang;
            var src = queryString("src");
            
            if (UIT == "") {//nothing in cookie. not logged in    //UIT == "false"
                //                var mahaduraG = Guests.filter(function (obj) {
                //                    return (url.indexOf(obj.url) > -1 && obj.site == site);
                //                })[0];

                if (site == "fbp" && queryString("TractateID") != "false") {
                    url = "URL_FROM_PORTAL_HADAF";
                }

                if (site == "fkyp" && queryString("KtivRequestId") != "false") {

                    mahaduraG = true;
                    url = "URL_FROM_KTIV";
                }
                //no need for this code since I added a guest user to Mahadurah
                // else if (site == "fkyp" && mahaduraG == undefined) {
                if (site == "fbp" && src == "wjb" && queryString("TractateID") != "false") {
                    url = "wiki.jewishbooks.org.il";
                }
                //     alert("על מנת להכנס לשיתוף יש לבצע לוגין וללחוץ שוב על השיתוף");
                //     return;
                //  }   
      
                loginAsGuset(lang, GetGuestByUrlAndSite(url, site));
            }
            else //logged in 
                goToSpecificSite(lang, UIT, site);
            return;
        }
        //========goToSpecificSite END=============

        //NO LOGIN COOKIE
        if (UIT == "") {
            checkIfInst(UIT);
            return;
        }
    }

    //UIT alive from QS or from COOKIE (USER CAME "Back to FJMS" or LOGIN COOKIE alive (and NO LOGOFF PORTAL accured))
    createCookie("UIT", UIT, 1); //===THIS IS THE LOGIN UIT COOCKIE=== expires after 1 hour
    createCookie("lang", lang, 1);
    doLogin(UIT, true);

    //}, 3000);
}

function eraseCache() {
    if (navigator.cookieEnabled) {
        //force new version dowload - like ctrl f5 in users browser
        var versionInCache = getCookie("GotNewVersion");
        if (versionInCache != version.toString()) {
            createCookie("GotNewVersion", version, 24 * 30 * 12); //one year
            window.location = window.location.href + '?eraseCache=true';

        }
    }
}

function createAdminBtns() {
    $(".wraaperAdmin").append("<a id='BtnFolim' href='" + adminUrl + "?type=Folim' onclick='OnGoToSite();' class='portallink' style='display:none' name='adminLinks'> " + txtFolim + "</a>" +
                              "<a id='BtnStatistics' href='" + adminUrl + "?type=Statistics' onclick='OnGoToSite();' class='portallink' style='display:none'  name='adminLinks'> " + txtStatistics + "</a>" +
                              "<a id='BtnManage' href='" + adminUrl + "?type=Manage' onclick='OnGoToSite();' class='portallink' style='display:none' name='adminLinks'> " + txtManagement + "</a>" +
                              "<a id='BtnSearchTitle' href='" + adminUrl + "?type=SearchTitle' onclick='OnGoToSite();' class='portallink' style='display:none' name='adminLinks'> " + txtSearchTitle + "</a>  " +
                              "<a id='BtnImagesStatus' href='" + adminUrl + "?type=ImagesStatus' onclick='OnGoToSite();'  class='portallink' style='display:none' name='adminLinks'>" + txtImageStatus + "</a>"
                             );

}
function createSiteBtn(siteObj, index) {
    var site = siteObj.key;
    if (siteObj.value != 0 && siteObj.value != 4 && siteObj.value != 5)//dont create buttons && siteObj.value != 4 && siteObj.value != 5
    {

        var ImgStr = "<img src='ImagesFJMS/" + site + "Text.png' id='" + site + "Img' />";
        var cls = "'portalButtonsup'";
        var siteName = (selLang == 'heb') ? hebSites[index].key : engSites[index].key;
        $("#" + site).append("<a id='" + sitesShort[index].key + "Link" + selLang + "' href='" + sitesUrls[index].key
             + "?lang=" + (siteObj.value == 10 ? "heb" : selLang)    //selLang always heb in mahadura, temp. when eng works in mhadura change back to : //+ "?lang=" + selLang
             + "' onclick='return OnGoToSite(this);' class=" + cls + " >" + siteName + "</a>"
             + (siteObj.value == 99999 ? "<div class='soonImg'></div>" : "") //for under dev sites
             + (siteObj.value == 99999 ? "<div class='betaImg'></div>" : "") //for beta sites
             + (siteObj.value == 99999 ? "<div class='newImg'></div>" : "") //for new sites
             + (siteObj.value == 99999 ? "<div class='betaImg newBetaImg'></div>" : "") //for new beta sites
            );
    }
}

function getBrowsingStatistics() {
    $.ajax({
        type: 'GET',
        url: SSObaseUrl + "general/GetStatistics",
        dataType: 'jsonp',
        success: function (res) {
            fillStatTableData(res);
        },
        error: function (err) {
            alert(err.statusText);

        }
    });
	if ($("#StatDialog").length){									  
    $("#StatDialog").dialog({
        autoOpen: false,
        buttons: {
            "Close / סגור": function () {
                $(this).dialog("close");
            }
        },
        title: "Browsing Statistics / סטטיסטיקות גלישה",
        width: (window.screen.width > 800) ? "1200px" : "350px",
        create: function () { $(this).parent().find(".ui-dialog-titlebar-close").bind('touchstart', function () { $(this).click(); }) }
    });
	}
}

function getSystemData() {
    $.ajax({
        type: 'GET',
        url: SSObaseUrl + "general/getSystemData",
        dataType: 'jsonp',
        success: function (res) {
            $('.fjmsDetails p')[2].innerHTML = (parseInt(res[0].TotalImages) / 1000).toFixed(0) + "K+";
            $('.fjmsDetails p')[1].innerHTML = (parseInt(res[0].TotalTranscriptions) / 1000).toFixed(0) + "K+";
            $('.fjmsDetails p')[3].innerHTML = (parseInt(res[0].TotalJoins) / 1000).toFixed(0) + "K+";
        },
        error: function (err) {
            alert(err.statusText);

        }
    });
    //number of sites
    $('.fjmsDetails p')[0].innerHTML = $('div[class^=FGPButtonsDisabled]').length;
}

function setMovingTexts() {

    $('.changeText').hide();
    selLang == 'eng' ? $('.changeText').text(homepageImagesTextENG[0].key) : $('.changeText').text(homepageImagesTextHEB[0].key);
    $('.changeTextSmall').show();
    selLang == 'eng' ? $('.changeTextSmall').text(homepageImagesTextENG[0].key) : $('.changeTextSmall').text(homepageImagesTextHEB[0].key);
    selLang == 'eng' ? $('.computerFade').attr('src', homepageImagesENG[0].key) : $('.computerFade').attr('src', homepageImagesHEB[0].key);
    selLang == 'eng' ? $('.computerNoFade').attr('src', homepageImagesENG[0].key) : $('.computerNoFade').attr('src', homepageImagesHEB[0].key);


    currentImage == 0 && (selLang == 'eng' ? homepageImagesENG[0].value : homepageImagesHEB[0].value) != 0 ? $("div[class^='changeText']").addClass("importantMessage") : $("div[class^='changeText']").removeClass("importantMessage");
    setInterval(function () {
        var curImgValue = selLang == 'eng' ? homepageImagesENG[0].value : homepageImagesHEB[0].value;
        if (currentImage == 0 && curImgValue != 0)
            setTimeout(function () { changeImageTextL(); }, 4000);
        else
            changeImageTextL();
    }, 6000);

    $(".wrrapeImages").mouseenter(function () {
        stopAnimation = true;
    });
    $(".wrrapeImages").mouseleave(function () {
        stopAnimation = false;
    });

}

function setFjmsDialogs() {
    //pop ups
    $('.divGuests').css('display', 'none');
    $('.divDevelopment').css('display', 'none');
    $('.divBeta').css('display', 'none');
    $('.divLogin').css('display', 'none');
    var dialogWidth = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) ? "80%" : "622px";


	if ($("#portalGuestMsgBnt").length){										  
    $("#portalGuestMsgBnt").dialog({    //guest dialog
        autoOpen: false,
        close: function () {
            //$.unblockUI();
            //$(".blockUI").fadeOut("slow");
            $('body').unblock();
        },
        width: dialogWidth,
        zIndex: '99999',
        create: function () { $(this).parent().find(".ui-dialog-titlebar-close").bind('touchstart', function () { $(this).click(); }) }
    }).prev(".ui-dialog-titlebar").css({ 'background': '#ffffff', 'border': 'none' });
	}
    dialogWidth = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) ? "auto" : "445px";

	if ($("#registerDialog").length){										   
    $("#registerDialog").dialog({
        autoOpen: false,
        show: { effect: "fade", duration: 200 },
        hide: { effect: "fade", duration: 200 },
        width: dialogWidth,
        position: 'center',
        create: function () { $(this).parent().find(".ui-dialog-titlebar-close").bind('touchstart', function () { $(this).click(); }) },
        close: function () {
            $(this).empty();
            $(this).dialog("close");
        }
    }).prev(".ui-dialog-titlebar").css({ 'background': '#ffffff', 'border': 'none' });
	}
}

$(function () {

    checkClientBrowser();

    eraseCache();

    if (!hideMode) {
        setLang();

        createAdminBtns();
    }
    sitesShort.forEach(createSiteBtn);

    if (!hideMode) {
        getBrowsingStatistics();

        getSystemData();

        setMovingTexts();

        if (env == 'Prod') {
            $('#test').hide();
        }

        $('#txtUserName').focus();

        $("#txtPassword").keyup(function (event) {
            if (event.keyCode == 13) {
                $("#loginBtn").click();
            }
        });

        $("#txtUserName").keyup(function (e) {
            var code = e.keyCode || e.which;
            if (code === 13) {
                $("#loginBtn").click();
            }
        });

        $("#DivFJMSToolBar").hide();
    }
    if (showFjmsMsg == true) {
        $('#fjmsMsgWrpr').show();
        selLang == 'eng' ? $('#fjmsMsgText').html(fjmsMsgEng) : $('#fjmsMsgText').html(fjmsMsgHeb);
        $('#fjmsMsgText').css(selLang + 'NotiMessg');
    }

    setFjmsDialogs();

    login();

});


function openStatDialog() { $("#StatDialog").dialog("open"); }

function openGuestDialog() {
    $("#portalGuestMsgBnt").dialog("open");
    //$.blockUI({ overlayCSS: { backgroundColor: '#2a2a65' }, message: null });
    $('body').block({
        message: null,
        centerX: true,
        centerY: true,
        overlayCSS: { backgroundColor: '#2a2a65' }
    });
}

function closeGuestDialog() {
    $('body').unblock();
    $("#portalGuestMsgBnt").dialog("close");

}

function GoToPr() { window.open(prUrl); }

function checkIfInst() {
    $.ajax({
        type: 'GET',
        url: SSObaseUrl + "login/GetUsernameIfInst",
        dataType: 'jsonp',
        success: function (uname) {
            if (uname != null && uname != "") {
                unameForInst = uname;
                $("#instDiv").show();
            }
        },
        error: function (err) {
            alert(err.statusText);
        }
    });
}



//STATISTICS - MORE CODE

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function minutesToString(m) {
    var value = m;
    var units = {
        "Hour": 60//,
        //"Minute": 1
    }
    var result = []
    for (var name in units) {
        var p = Math.floor(value / units[name]);
        if (p == 1) result.push(" " + numberWithCommas(p) + " " + name);
        if (p >= 2) result.push(" " + numberWithCommas(p) + " " + name + "s");
        value %= units[name]
    }
    return result;
}

function fillStatTableData(data) {
    var r = new Array(), j = -1;
    var numSites = sitesShort.length;
    var d;
    r[++j] = '<thead><th></th>';
    for (var i = 1; i < numSites; i++)
        r[++j] = '<th>' + engSites[i].key + ' / ' + hebSites[i].key + '</th>';

    r[++j] = '<th></th></thead>';

    for (var i = 0; i < data.length; i++) {
        if (i == 0) r[++j] = '<tr><td>Num Of Accesses';
        if (i == 1) r[++j] = '<tr><td>Num Of Different Users';
        if (i == 2) r[++j] = '<tr><td>Total Browsing Time';

        for (var y = 1; y < numSites; y++) {
            if (engSites[y].value != 10 && engSites[y].value != 9)//do not show statistics for Manuscripts and Rambam
            {
                d = data[i]["Column" + engSites[y].value];
                if (d != undefined) {
                    if (i == 0) //num of accesses
                        d = numberWithCommas(d);
                    else
                        if (i == 2) //browsing time
                            d = minutesToString(d);

                    r[++j] = '<td>';
                    r[++j] = d;
                }
            }
        }
        if (i == 0) r[++j] = '<td>מספר כניסות' + '</tr>';
        if (i == 1) r[++j] = '<td>מספר משתמשים שונים';
        if (i == 2) r[++j] = '<td>זמן גלישה כולל';

        r[++j] = '</tr>';
    }

    $('#StatTable').html(r.join(''));
}

function changeImageTextR() {

    if ($('.computerFade').css('opacity') == 1) {
        var imagesArray = (selLang == 'eng') ? homepageImagesENG : homepageImagesHEB;
        var textArray = (selLang == 'eng') ? homepageImagesTextENG : homepageImagesTextHEB;
        if (currentImage > 0) {
            $('.computerFade').attr("src", imagesArray[currentImage - 1].key);
            $('.changeText').text(textArray[currentImage - 1].key);
            $('.changeTextSmall').text(textArray[currentImage - 1].key);
            currentImage -= 1;
        }
        else {
            $('.computerFade').attr("src", imagesArray[imagesArray.length - 1].key);
            $('.changeText').text(textArray[textArray.length - 1].key);
            $('.changeTextSmall').text(textArray[textArray.length - 1].key);
            currentImage = imagesArray.length - 1;
        }
        currentImage == 0 && imagesArray[currentImage].value != 0 ? $("div[class^='changeText']").addClass("importantMessage") : $("div[class^='changeText']").removeClass("importantMessage");
        doAnimation();
    }
}

function changeImageTextL() {
    if (!stopAnimation) {
        if ($('.computerFade').css('opacity') == 1) {
            var imagesArray = (selLang == 'eng') ? homepageImagesENG : homepageImagesHEB;
            var textArray = (selLang == 'eng') ? homepageImagesTextENG : homepageImagesTextHEB;
            if (currentImage < imagesArray.length - 1) {
                $('.computerFade').attr('src', imagesArray[currentImage + 1].key);
                $('.changeText').text(textArray[currentImage + 1].key);
                $('.changeTextSmall').text(textArray[currentImage + 1].key);
                currentImage += 1;
            }
            else {
                $('.computerFade').attr('src', imagesArray[0].key);
                $('.changeText').text(textArray[0].key);
                $('.changeTextSmall').text(textArray[0].key);
                currentImage = 0;
            }
            currentImage == 0 && imagesArray[currentImage].value != 0 ? $("div[class^='changeText']").addClass("importantMessage") : $("div[class^='changeText']").removeClass("importantMessage");
            doAnimation();
        }
    }
}

function doAnimation() {
    $('.changeText').hide();
    $('.changeTextSmall').hide();
    if ($('.SSOlogin').css('display') == "none")
        $(".changeText").fadeIn(3000);
    else
        window.innerWidth < '1000' && window.innerWidth > '800' ? $(".changeTextSmall").hide() : $(".changeTextSmall").fadeIn(3000);
    $(".computerFade").css('display', 'none');
    $(".computerFade").fadeIn(3000);
    setTimeout(function () {
        $('.computerNoFade').attr('src', $('.computerFade').attr('src'));
    }, 2500);
}

function toggleNav() {
    var x = document.getElementById("topnav");
    if (x.className === "topnav") {
        x.className += " responsive";
    } else {
        x.className = "topnav";
    }
    if ($('.wraaperAdmin').children().css('display') == 'block' && $('.topnav').hasClass('responsive') != true)
        $('.coverwraaperAdmin').css('display', 'block');
    else
        $('.coverwraaperAdmin').css('display', 'none');

}

function setLang() {
    document.getElementById("Chat").value = txtChat;
    document.getElementById("ContactUs").value = txtContactUs;
    document.getElementById("pr").value = txtPR;
    document.getElementById("GoToRegisterMsg").innerHTML = txtGoToRegisterMsg;
    document.getElementById("LoginInstHeb").value = txtLoginInst;
    document.getElementById("regHeb").value = txtRegister;
    document.getElementById("InstRegistration").value = txtInstRegistration;
    document.getElementById("GetContact").innerHTML = txtGetContact;
    document.getElementById("txtUserName").setAttribute('placeholder', txtUserName);
    document.getElementById("txtPassword").setAttribute('placeholder', txtPassword);
    document.getElementById("btnForgotPass").value = txtForgotPass;
    document.getElementById("loginBtn").value = txtLogin;
    document.getElementById("btnStatist").value = txtbtnStatist;

    document.getElementById("GeneralMsg").innerHTML = txtGeneralMsg;
    document.getElementById("SpnGuestMsg").innerHTML = txtSpnGuestMsg;
    document.getElementById("GuestLogin").value = txtGuestLogin;
    //    document.getElementById("siteLogOffBtn").innerHTML = txtsiteLogOffBtn;

    document.getElementById("SpnDevMsg").innerHTML = txtSpnDevMsg;
    document.getElementById("SpnBetaMsg").innerHTML = txtSpnBetaMsg;
    document.getElementById("backToLoginBtn").innerHTML = txtbackToLoginBtn;
    //    document.getElementById("backToLoginBtnDev").innerHTML = txtbackToLoginBtn;
    document.getElementById("SpnLoginMsg").innerHTML = txtSpnLoginMsg;
    if (window.location.toString().indexOf('ResponsivePortal.htm') > -1)
        document.getElementById("message").innerHTML = txtSliderMsg;

    document.getElementById("spnDeclaration").innerHTML = txtDeclaration;
    document.getElementById("pFjmsinfo").innerHTML = txtfjmsinfo;
    document.getElementById("titlepFjmsinfo").innerHTML = txtfjmsinfoH;
    document.getElementById("pSites").innerHTML = txtSites;
    document.getElementById("pImages").innerHTML = txtImages;
    document.getElementById("pTransc").innerHTML = txtTransc;
    document.getElementById("pJoins").innerHTML = txtJoins;

    //document.getElementById("fjmsMsg").innerHTML = txtfjmsMsg;
    //document.getElementById("divNotiMessg").innerHTML = txtNotiMessg;


    document.getElementById("aboutFGPtext").innerHTML = txtAboutFGP;
    document.getElementById("aboutFBPtext").innerHTML = txtAboutFBP;
    document.getElementById("aboutFJPtext").innerHTML = txtAboutFJP;
    document.getElementById("aboutFNPtext").innerHTML = txtAboutFNP;
    document.getElementById("aboutFRPtext").innerHTML = txtAboutFRP;
    document.getElementById("aboutFKYPtext").innerHTML = txtAboutFKYP;

    document.getElementById("footer").innerHTML = txtCredits;

    //document.getElementById("Aboutus").innerHTML = txtAboutus;

    //            document.getElementById("xxx").innerHTML = xxx;  
    //            document.getElementById("xxx").value = xxx;


}

             