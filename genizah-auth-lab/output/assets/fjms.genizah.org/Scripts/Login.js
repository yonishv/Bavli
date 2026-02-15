var unameForInst = "";
var passForInst = "LoginAsInst0"; //const. needs to match api const LoginKeyForInstitution
var isGuestMode;
var selectedSite = "";

var $input = $('#txtUserName');

$(document).click(function (evt) {
    var $tgt = $(evt.target);
    if (!$tgt.is('#show-anyways') && !$tgt.is($input)) {
        $input.blur()
    }
})


function GetGuestByUrlAndSite(url, site) {
    //Guests is an array in SSOConfig.js
    return Guests.filter(function (obj) {
        return (url.indexOf(obj.url) > -1 && obj.site == site);
    })[0];
}

function savePasswordInCookie() {
    createCookie($("#txtUserName").val(), $("#txtPassword").val(), 30 * 12); //expires after 1 month
}

function getPassword() {
    var uname = $("#txtUserName").val();
    if (uname != "")
        $("#txtPassword").val(getCookie(uname));
    else return "";
}


function loginAsInstUser(lang) {
    tryLogin(unameForInst, passForInst, lang);
}

function loginAsRegUser(lang, callback) {
    $('#txtPassword').blur();
    savePasswordInCookie();
    isGuestMode = false;
    tryLogin($('#txtUserName').val(), $('#txtPassword').val(), lang, undefined, callback);
    
}

function enterSite() {
    var currSiteURL;
    for (var i = 0; i < sitesUrls.length; i++) {
        if (sitesUrls[i].value === parseInt(currSite)) {
            currSiteURL = sitesUrls[i].key;
        }
    }
    parent.window.location.href = (currSiteURL + "?lang=" + lang + "&UIT=" + UIT);
}

function goToSpecificSite(lang, UIT, site) {
    selectedSite = site;
    doLoginAndGoToSite(UIT, lang);
}

function loginAsGuset(lang, guest) {
    selectedSite = guest.site;
    isGuestMode = true;
    tryLogin(guest.username, 'noPassNeeded', lang);
    
}
function closeRegDialog() {
    $("#registerDialog").dialog('close');
}


function tryLogin(uname, pass, lang, currSite, callback) {
    var userData = { "username": uname, "password": pass };
    if (uname == "" || pass == "") {
        swal({ title: loginFailedTitle, text: missingUsernameAndPassword, type: "warning", confirmButtonText: okBtnText });
        return;
    }

    selLang = lang;

    $.ajax({

        type: 'GET',
        url: SSObaseUrl + "login/GetLoginUIT?screenWidth=" + window.screen.width,
        data: userData,
        dataType: 'jsonp',
        success: function (SSOUIT) {
            //====after REGISTRATION==== user go to login(index) page. user coming from reg page
            if ($("#SSOlogin").length == 0) {
                //createCookie("UIT", SSOUIT.UIT, 1);
                //createCookie("lang", lang, 1);

                if (currSite && currSite != "false") {
                    var currSiteURL = fjmsLoginUrl;
                    for (var i = 0; i < sitesUrls.length; i++) {
                        if (sitesUrls[i].value === parseInt(currSite)) {
                            currSiteURL = sitesUrls[i].key
                        }
                    }
                    parent.parent.window.location.href = (currSiteURL + "?lang=" + lang + "&UIT=" + SSOUIT.UIT);
                } else {
                    parent.window.location.href = (window.screen.width > 800) ? (fjmsLoginUrl + "?lang=" + lang + "&UIT=" + SSOUIT.UIT) : (fjmsLoginUrlMobile + "?lang=" + lang + "&UIT=" + SSOUIT.UIT);
                }

                parent.closeRegDialog();
                return;
            }

            //=====================Guest Mode====================
            //            if (SSOUIT.Status == Enums.loginStatus.canLoginAsGuest) {
            //                doLoginAndGoToSite(SSOUIT.UIT, lang);
            //                return;
            //            }

            //===========USER NEEDS TO AGREE TO NEW FJMS TERMS==========
            console.log("1Enums: " + Enums);
            setStatusLogin(SSOUIT, callback);
            while (Enums == "undefined") {
                setTimeout(setStatusLogin(SSOUIT, callback), 2000);
            }


        },
        error: function (err) {
            swal({ title: loginFailedTitle, text: errorOccurred, type: "error", confirmButtonText: okBtnText });
        }
    });
}

function setStatusLogin(SSOUIT, callback) {
    console.log("2Enums: " + Enums);
    if (Enums != "undefined" && SSOUIT != "undefined" && SSOUIT != undefined) {
        if (SSOUIT.Status == Enums.loginStatus.userNoFullConditions) {
            if (lang == 'heb') { $("[name='engTexts']").hide(); $("[name='hebTexts']").show(); } else { $("[name='hebTexts']").hide(); $("[name='engTexts']").show(); }
            $("#terms").dialog({
                autoOpen: false,
                buttons: {
                    "OK": function () {

                        doLogin(SSOUIT.UIT, true);
                        $(this).dialog("close");
                    },
                    "Cancel": function () {
                        $(this).dialog("close");
                    }
                },
                width: "540px",
                create: function () { $(this).parent().find(".ui-dialog-titlebar-close").bind('touchstart', function () { $(this).click(); }) }
            });

            $("#terms").dialog("open");
        }

        //===========USER NEEDS TO FILL PROFILE==========
        if (SSOUIT.Status == Enums.loginStatus.userNoFullProfile) {
            userProfileNotFull = true;
            if (lang == 'heb') { $("[name='engTexts']").hide(); $("[name='hebTexts']").show(); } else { $("[name='hebTexts']").hide(); $("[name='engTexts']").show(); }
            $("#fillProfile").dialog({
                autoOpen: false,
                buttons: {
                    "OK": function () {
                        doLogin(SSOUIT.UIT, false);
                        setTimeout(InitEditProfile, 1500);
                        $(this).dialog("close");
                    },
                    "Cancel": function () {
                        $(this).dialog("close");
                    }
                },
                width: "540px",
                create: function () { $(this).parent().find(".ui-dialog-titlebar-close").bind('touchstart', function () { $(this).click(); }) }
            });

            $("#fillProfile").dialog("open");
        }

        //============REGULAR LOGIN=================
        if (SSOUIT.Status == Enums.loginStatus.canLogin) {
            doLogin(SSOUIT.UIT, true, callback);
        }
        else {
            userFullName = "";
            DisplayLoginStatusMsg(SSOUIT.Status);
        }
    }
}

function SiteLogOff() {

    $("#hidUIT").val("");
    createCookie("UIT", "", 1);
    createCookie("lang", "", 1);
    $('.changeText').hide();
    $('.changeTextSmall').show();
    HidePermissionBtns();
    SiteLogOffDone("FJMS");
}

function doLogin(UIT, enableSites, callback) {
    GetUserPermissionByUIT(UIT, enableSites, OnLoginSuccess, callback);
}

function OnLoginSuccess(UIT, enableSites) {
    EnableSites(enableSites, UIT);
    $("DivFJMSToolBar").FJMSToolBar(UIT, selLang, "FJMS");
    $("#DivFJMSToolBar").show();
    $("#SSOlogin").hide();
    $("#instDiv").hide();
    $('#fjmscontent').removeClass('content_out');
    $('.changeText').show();
    $('.changeTextSmall').hide();
    $(".wrapperCon").hide();
    $("#btnChangelang").hide();
    createCookie("UIT", UIT, 1); //===THIS IS THE LOGIN UIT COOCKIE=== expires after 1 hour
    createCookie("lang", lang, 1);
    createCookie("isGuestMode", isGuestMode, 1);
    $("#hidUIT").val(UIT); //=============for users that block cookies
}




function doLoginAndGoToSite(UIT, lang) {
    isGuestMode = true;
    $('div[name=btns]')
    .each(function (i, link) {
        var myhref = this.children[0].href;
        $(this.children[0]).attr('href', function () {
            if (myhref.indexOf('&UIT=') > -1)
                myhref = myhref.substring(0, myhref.indexOf('&UIT='));
            myhref = myhref + '&UIT=' + UIT;

            //for bavli Daf GUEST 
            if (queryString('DafID') != "false")
                myhref += '&DivisionA=' + queryString('TractateID') + '&DivisionB=' + queryString('DafID') + '&DivisionC=' + queryString('AmudID');
            if (queryString('FgpNumber') != "false" || queryString('TextualSM') != "false") //for fgp geniza site GUEST 
                myhref += '&FgpNumber=' + queryString('FgpNumber') + '&TextualSM=' + queryString('TextualSM');
            //for location link
            if (queryString('GoToLinkParams') != "false")
                myhref += '&GoToLinkParams=' + queryString('GoToLinkParams');
            if (queryString('KtivRequestId') != "false")
                myhref += '&KtivRequestId=' + queryString('KtivRequestId');

            return myhref;
        });
    });
    lang = queryString("lang") != "false" ? queryString("lang") : lang;
    $("#" + selectedSite + "Link" + lang)[0].click();

}

function DisplayLoginStatusMsg(status) {
    switch (status) {
        case Enums.loginStatus.userNotFound:
            {
                swal({ title: loginFailedTitle, text: userWasNotRecognized, type: "error", confirmButtonText: okBtnText });
                break;
            }
        case Enums.loginStatus.pwdIncorrect:
            {
                var msg = (selLang == 'eng') ? "One of the details you entered is incorrect" : "אחד הפרטים שהזנת שגוי";
                var isHeb = getLanguage($('#txtPassword').val()) == 'heb' || getLanguage($('#txtUserName').val()) == 'heb';
                if (isHeb) msg += "<br /><br /> <b>" + keyboardAlert + "</b>";
                swal({ html: '<br />' + msg, title: loginFailedTitle, type: "error", confirmButtonText: okBtnText });
                //alert(msg);
                break;
            }
        case Enums.loginStatus.userUnapproved:
            {
                swal({ title: loginFailedTitle, text: blockedUser, type: "error", confirmButtonText: okBtnText });
                break;
            }
        case Enums.loginStatus.userLockedOut:
            {
                swal({ title: loginFailedTitle, text: blockedUser, type: "error", confirmButtonText: okBtnText });
                break;
            }
    }

}


function ForgotPass(lang) {
    if (ReadOnlyMode == true)
        (lang == 'eng') ? swal({ title: attentionTitle, text: ReadOnlyAlertEng, type: "info", confirmButtonText: okBtnText }) : swal({ title: attentionTitle, text: ReadOnlyAlertHeb, type: "info", confirmButtonText: okBtnText });
    else {
        var un = $("#txtUserName")[0].value;
        var conf;
        if (un == "")
            swal({ text: missingUserName, type: "warning", confirmButtonText: okBtnText });
        else {
            swal({ html: changePasswordConfirm1 + un + '<br>' + changePasswordConfirm2, type: 'info', showCancelButton: true, confirmButtonText: okBtnText }).then(function (result) {
                if (result.value) {
                    $.ajax({
                        type: 'GET',
                        url: SSObaseUrl + "User/ForgotPasswordSendMail?username=" + encodeURIComponent(un) + "&lang=" + lang,
                        dataType: 'jsonp',
                        success: function (res) {
                            if (res == Enums.changePasswordStatus.notFound)
                                swal({ text: userNameNotFound, type: "error", confirmButtonText: okBtnText });
                            else if (res == Enums.changePasswordStatus.success)
                                swal({ text: emailSendingSucceeded1, type: "success", confirmButtonText: okBtnText });
                            else if (res == Enums.changePasswordStatus.failed)
                                swal({ text: errorOccurred, type: "error", confirmButtonText: okBtnText });
                        },
                        error: function (err) {

                            swal({ text: errorOccurred, type: "error", confirmButtonText: okBtnText });
                        }
                    });
                    createCookie("lang", lang, 1);
                }
            });
        }
    }
}
//bracha
function GetUserPermissionByUIT(UIT, enableSites, onsuccess, callback) {

    $.ajax({
        type: 'GET',
        url: SSObaseUrl + "User/GetUserPermission?UIT=" + UIT,
        dataType: 'jsonp',
        timeout: 5000, //in json this is the only way to fall in error, after timeout
        success: function (res) {
            ButtonPermission(res);
            onsuccess(UIT, enableSites);
            if (callback) {
                callback();
            }
        },
        error: function (err) {
            SiteLogOff();
        }
    });

}
function ButtonPermission(res) {

    res.Folim == true ? $('#BtnFolim').css("display", "block") : $('#BtnFolim').css("display", "none");
    res.TechnicManage == true ? $('#BtnManage').css("display", "block") : $('#BtnManage').css("display", "none");
    res.Statistics == true ? $('#BtnStatistics').css("display", "block") : $('#BtnStatistics').css("display", "none");
    res.TxtSearch == true ? $('#BtnSearchTitle').css("display", "block") : $('#BtnSearchTitle').css("display", "none");
    res.ImageStatus == true ? $('#BtnImagesStatus').css("display", "block") : $('#BtnImagesStatus').css("display", "none");
    if (res.Manuscripts == true) $("#fkyp").removeClass("FGPBtnLogoff");
    if (res.Rambam == true) $("#frp").removeClass("FGPBtnLogoff");
}

function HidePermissionBtns() {
    $('#BtnFolim').css("display", "none");
    $('#BtnManage').css("display", "none");
    $('#BtnStatistics').css("display", "none");
    $('#BtnSearchTitle').css("display", "none");
    $('#BtnImagesStatus').css("display", "none");

}



function GoToRegPage(lang, instReg) {
    if (ReadOnlyMode == true)
        (lang == 'eng') ? swal({ text: ReadOnlyAlertEng, type: "info", confirmButtonText: okBtnText }) : swal({ text: ReadOnlyAlertHeb, type: "info", confirmButtonText: okBtnText });
    else //window.location.href = fjmsPagesUrl + 'Register.htm?lang=' + lang + "&isinstreg=" + instReg;
    {
        dialogWidth = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) ? "auto" : "410px";
        $("#registerDialog").append('<iframe src=' + fjmsPagesUrl + 'Register.htm?lang=' + lang + "&isinstreg=" + instReg + ' height="610px" width=' + dialogWidth + '><iframe>');
        $("#registerDialog").dialog('open');

    }
}

function GoToContactUs(lang) {
    InitContactUs('externalContactUs', lang);
}

if (window.addEventListener) {
    window.addEventListener("message", listenMessage, false);
}
else {
    window.attachEvent("onmessage", listenMessage);
}

function listenMessage(msg) {
    if (msg.data == "closeDialog") {
        $("#externalDialog").dialog('close');
    }
}

//end bracha
function OnGoToSite(btn) {
    var isGuest = false;
    var siteBtn = btn.id.replace('Linkheb', '').replace('Linkeng', '');
    var btnParent = $('#' + btn.id).parent();
    //fill in the short text and img
    document.getElementById("shortDesc").innerHTML = eval('txtAbout' + siteBtn.toUpperCase());
    $('.FGPLinkGuest').attr('onclick', 'loginAsGuset(selLang, GetGuestByUrlAndSite(fjmsLoginUrl, "' + siteBtn + '"))');
    $('.smallImg').css('background', 'url(ImagesFJMS/' + siteBtn.toUpperCase() + '.png) no-repeat center center');

    if (!isGuestMode) {
        if (getCookie('UIT') === null || getCookie('UIT') == '') {
            //SESSION ENDED
            if ($('#DivFJMSToolBar')[0].style.display == "block") {
                swal({ text: sessionEnd, type: "info", confirmButtonText: okBtnText });
                SiteLogOff();
                return false;
            }
            //IN LOGOFF
            else {
                //GUEST
                Guests.forEach(function (obj) {
                    if (obj.site == siteBtn && obj.isguest)
                        isGuest = true;
                });
                if (isGuest) {
                    $('.divGuests').css('display', 'block');
                    $('.divDevelopment').css('display', 'none');
                    $('.divBeta').css('display', 'none');
                    $('.divLogin').css('display', 'none');
                    $('.divBeta').css('display', 'none');
                }
                else {
                    //DEVELOPMENT
                    if (btnParent.children('.soonImg').length > 0) {
                        $('.divGuests').css('display', 'none');
                        $('.divDevelopment').css('display', 'block');
                        $('.divLogin').css('display', 'none');
                        $('.divBeta').css('display', 'none');
                    }
                    //DID NOT LOGIN YET
                    else {
                        $('.divGuests').css('display', 'none');
                        $('.divDevelopment').css('display', 'none');
                        $('.divLogin').css('display', 'block');
                        $('.divBeta').css('display', 'none');
                    }
                }
                openGuestDialog();
                return false;
            }
        }
        else //Normal - LoggedIn
        {
            //DEVELOPMENT
            if (btn.href.indexOf('UIT') == -1) {

                if (btnParent.children('.soonImg').length > 0) {
                    $('.divBeta').css('display', 'none');
                    $('.divGuests').css('display', 'none');
                    $('.divDevelopment').css('display', 'block');
                    $('.divLogin').css('display', 'none');

                }
                else
                    if (btnParent.children('.betaImg').length > 0) {
                        $('.divBeta').css('display', 'block');
                        $('.divGuests').css('display', 'none');
                        $('.divDevelopment').css('display', 'none');
                        $('.divLogin').css('display', 'none');
                    }
                openGuestDialog();
                return false;
            }
        }
    }
}





function EnableSites(enable, UIT) {

    if ($(".FGPButtons").length == 0 && enable == false) return; //do nothing if disabled and needs to stay disabled 
    if ($(".FGPButtonsDisabledUp").length == 0 && enable == true) return; //do nothing enabled and needs to stay enabled 

    if (enable == true) {
        $("#fgp").removeClass("FGPBtnLogoff");
        $("#fbp").removeClass("FGPBtnLogoff");
        $("#fsp").removeClass("FGPBtnLogoff");
        $("#fjbp").removeClass("FGPBtnLogoff");
        $("#fnp").removeClass("FGPBtnLogoff");
        $("#fjp").removeClass("FGPBtnLogoff");
        $("#frp").removeClass("FGPBtnLogoff");
        $("#fkyp").removeClass("FGPBtnLogoff");


        //SITES
        $('div[class^=FGPButtonsDisabled]:not(.FGPBtnLogoff)')
            .each(function (i, link) {
                var myhref = this.children[0].href;
                $(this.children[0]).attr('href', function () {
                    if (myhref.indexOf('&UIT=') > -1)
                        myhref = myhref.substring(0, myhref.indexOf('&UIT='));

                    if (queryString('DafID') != "false") //for bavli Daf GUEST 
                        myhref += '&DivisionA=' + queryString('TractateID') + '&DivisionB=' + queryString('DafID');
                    if (queryString('FgpNumber') != "false" || queryString('TextualSM') != "false") //for fgp geniza site GUEST 
                        myhref += '&FgpNumber=' + queryString('FgpNumber') + '&TextualSM=' + queryString('TextualSM');
                    //for location link
                    if (queryString('GoToLinkParams') != "false")
                        myhref += '&GoToLinkParams=' + queryString('GoToLinkParams');
                    if (queryString('KtivRequestId') != "false")
                        myhref += '&KtivRequestId=' + queryString('KtivRequestId');

                    return myhref + '&UIT=' + UIT;
                });
            });

        //Go to site automatically
        if (selectedSite != "") {
            isGuestMode = true;
            lang = queryString("lang") != "false" ? queryString("lang") : lang;
            $("#" + selectedSite + "Link" + selLang)[0].click();
            return;
        }

        //ADD UIT TO ADMIN
        $('a[name=adminLinks]').each(function (i, link) {
            $(link).attr('href', function () {
                if (this.href.indexOf('&UIT=') > -1) {
                    this.href = this.href.substring(0, this.href.indexOf('&UIT='));
                }
                return this.href + '&UIT=' + UIT;
            });
        });


    }
    else {

        //$("#fgp").addClass('FGPBtnLogoff');//GUEST ALWAYS LOOKS ENABLEd
        //$("#fbp").addClass('FGPBtnLogoff');//GUEST ALWAYS LOOKS ENABLEd
        //$("#fsp").addClass('FGPBtnLogoff');
        //$("#fjbp").addClass('FGPBtnLogoff');
        //$("#fnp").addClass('FGPBtnLogoff');
        //$("#fjp").addClass('FGPBtnLogoff');
        //$("#frp").addClass('FGPBtnLogoff');
        $("#fkyp").addClass('FGPBtnLogoff');

    }

}




     