 
var UIT;
var lang = 'eng';
var portal = "FJMS";
var siteName=portal;//default
var btnTexts;
var IsGuest = false;
var IsInst = false;
var userProfileNotFull = false; //this will be false if user needs to fill profile and then true after user filled his missing profile.

(function ($) {
    $.fn.FJMSToolBar = function (uit, language, currentSite) {
        ElementName = this.selector;
         if ($("#" + ElementName).closest("#topnav").length)
         {
            $("#" + ElementName).closest("#topnav").after('<div id="FlexibleModal" class="flexibleModal"><div class="flexibleModalContent" id="FlexibleModalContent"><span id="FlexibleCloseBtn" class="flexibleCloseBtn" onclick="CloseFlexibleModal()">&times;</span></div></div>');
        } else
        {
            $("#" + ElementName).append('<div id="FlexibleModal" class="flexibleModal"><div class="flexibleModalContent" id="FlexibleModalContent"><span id="FlexibleCloseBtn" class="flexibleCloseBtn" onclick="CloseFlexibleModal()">&times;</span></div></div>');
        }
        
        if (language == "") // language = "eng"; //default        
            if (selLang != "") language = selLang;
        var homePageClass = "HomeLink";
       
        if (language == "eng") {            
            btnTexts = { AboutUs: "About Us", ContactUs: "Contact Us", EditProfile: "Edit Profile", LogOff: "Log Off FJMS", SiteLogOff: "Back To FJMS", BackToHomePg: "Home Page", Chat:"Chat" };
        }
        else {
            btnTexts = { AboutUs: "אודותינו", ContactUs: "צור קשר", EditProfile: "עריכת פרופיל", LogOff: "יציאה מהפורטל", SiteLogOff: "חזרה לפורטל", BackToHomePg: "דף הבית" , Chat:"צ'ט עם נציג"};
            homePageClass = homePageClass + "Heb";   
            $("#FlexibleCloseBtn").addClass("closeHebBtn");    
        }
        
        if (typeof callChangelang == 'function') {
            var langCls=(language=='eng')? 'changelangEng':'';
            $("#" + ElementName).append('<input class="prtalTollBarLink changelang '+langCls+'" style="margin-top: 0px;" name="btnChangelang" type="button" onclick="callChangelang()" />');
        }
        $("#" + ElementName).append('<input class="prtalTollBarLink" name="AboutUsBtn" type="button" style="display:none" value="' + btnTexts.AboutUs + '" onclick="InitAboutUs()" />'); //כרגע מוסתר
        if(language == "eng")
            $("#" + ElementName).append('<input class="prtalTollBarLink" id="LPChatDIVFriedbergEng" type="button" value="' + btnTexts.Chat + '" onclick="openChat()" />'); 
        else
            $("#" + ElementName).append('<input class="prtalTollBarLink" id="LPChatDIVFriedberg" type="button" value="' + btnTexts.Chat + '" onclick="openChat()" />'); 
     
        $("#" + ElementName).append('<input class="prtalTollBarLink" name="ContactUsBtn" type="button" value="' + btnTexts.ContactUs + '" onclick="InitContactUs(this)" />'); // 
        $("#" + ElementName).append('<input class="prtalTollBarLink" name="EditProfileBtn" type="button" value="' + btnTexts.EditProfile + '" onclick="InitEditProfile()" />');
        $("#" + ElementName).append('<input class="prtalTollBarLink" name="LogOffFJMSBtn" type="button" value="' + btnTexts.LogOff + '" onclick="LogOff(portal)" />');
        if (currentSite != portal) {
            $("#" + ElementName).append('<input class="prtalTollBarLink" name="BackToFJMSBtn" type="button" value="' + btnTexts.SiteLogOff + '" onclick="LogOff(siteName)" />');
            $("#" + ElementName).append('<input class="prtalTollBarLink ' + homePageClass + '" name="BackToHomePg" type="button" value="' + btnTexts.BackToHomePg + '" onclick="FJMSToolBar_BackToHomePg()" />');
        }
        $("#" + ElementName).append('<span class="FJMSWelcomeText" name="WelcomeText"><span />');
        //if(uit=="")
        //window.location.href = fjmsLoginUrl + "?UIT="; 
        
        UIT = uit;
        lang = language;
        createCookie("selLang","",-1);
        createCookie("selLang", lang, 14 * 24); //expires after 2 weeks
        siteName = currentSite;
        ShowWelcomeText(UIT, lang);

    };

  

} (jQuery));

if (window.addEventListener) {
    window.addEventListener("message", listenMessage, false);
}
else {
    window.attachEvent("onmessage", listenMessage);
}

function createCookie(name, value, days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        var expires = "; expires=" + date.toGMTString();
    }
    else var expires = "";
    document.cookie = name + "=" + value + expires + "; path=/";
}

function listenMessage(msg) {

    if (msg.data == "ProfileFilled" && userProfileNotFull == true) {
        userProfileNotFull = false;
        window.location.href = fjmsLoginUrl;
    }
    else
        $("#FJMSdialog").dialog('close');

    if (msg.data == "closeDialog") {
        $("#FJMSdialog").dialog('close');
    }

    if (msg.data == "closeFlexibleModal") {
        CloseFlexibleModal();
    }

    if (msg.data == "changeFlexibleModalHeight") {
        ChangeFlexibleModalHeight();
    }

    if (msg.data == "changeFlexibleModalWidth430") {
        ChangeFlexibleModalWidth(430);
    }

    if (msg.data == "changeFlexibleModalWidth570") {
        ChangeFlexibleModalWidth(570);
    }    
}
function FillFJMSdialogIframe(url, title, elem, dHeight, dWidth, dClass) {
    //debugger;
    var dialogWidth = (url.indexOf("EditProfile") > -1) ? "950px" : "450px";
    var dialogHeight = (url.indexOf("EditProfile") > -1) ? "550px" : "480px";
    //var dialogHeight = (dHeight != undefined)? dHeight : "900px";
    dialogWidth = (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) ? "auto" : dialogWidth;
    if ($("#dialog").length < 1)
        $("#DivFJMSToolBar").append('<span id="dialog"></span>');
    var title;
 
    $("#dialog").empty();
    $("#dialog").innerHTML = null;
    $("#dialog").append($("<iframe width='90%' height='500px' border='0' frameBorder='0' />").attr("src", url)).dialog(
        {
         //   position: 'center',
            title: title,
            draggable: false,
            width: dWidth != undefined ? dWidth : dialogWidth,
            height: dialogHeight + " !important",//"900px !important", //
            resizable: true,
            //modal: true,
                 dialogClass: dClass ? dClass : "FJMSdialogCSS",
        position: {
            my: "center",
            at: "top",
            of: $("body"),
            within: $("body")
       }
        });

    $('.ui-dialog').css({ 'z-index': '100001' });
    $('.ui-dialog').css({ 'top': '70px' });
    $('#dialog').height(dialogHeight);
    $('#dialog').width(dialogWidth);

    if (lang == "eng")//when this is shown in the top toolbar of the site the eng.css is not used that's why it's written in js
    { // these properties set the dialog title for english site
        $('.FJMSdialogCSS.ui-dialog .ui-dialog-title').css('float','left');
        $('.FJMSdialogCSS.ui-dialog .ui-dialog-titlebar-close').css('position','absolute');
        $('.FJMSdialogCSS.ui-dialog .ui-dialog-titlebar-close').css('float', 'right');
    }

}

function InitAboutUs() {
    var title;
    (lang == 'heb') ? title = 'אודותינו' : title = 'About Us';
    var urlForCU = fjmsPagesUrl + "AboutUs.htm?lang=" + lang + "&siteName=" + siteName;
    if (!IsGuest)
        urlForCU += "&UIT=" + UIT;
    FillFJMSdialogIframe(urlForCU, title);
}




$("body").on("click", ".glassix-widget-icon-wrapper", function (elm) {
    chatBubbleHidden = $("#glassix-widget-iframe-container").attr("aria-hidden") == 'true';
    if (chatBubbleHidden) {
        $("#glassix-container").hide();
    }
    else {
        $("#glassix-container").show();
    }
});

function openChat(error) {
//  lang = getLangCookie();
//    if (lang == "eng") {        
//        $("#LPChatDIVFriedbergEng").children().click();
//    }
//    else {        
//        $("#LPChatDIVFriedberg").children().click();
//    } 

    $("#glassix-container .glassix-widget-icon-wrapper").click();
    chatBubbleHidden = $("#glassix-widget-iframe-container").attr("aria-hidden") == 'true';
    if (chatBubbleHidden) {
        $("#glassix-container").hide();
    }
    else {
        $("#glassix-container").show();
    }
}

function InitContactUs(elem) {
    lang = getLangCookie();
    if (UIT != "" && UIT != "false" && UIT != undefined) {
        $.ajax({
            type: 'GET',
            url: SSObaseUrl + "user/GetContactUsInfo?UIT=" + UIT + "&lang=" + lang,
            dataType: 'jsonp',
            timeout: 3000,
            success: function (result) {
                if (result!=null){
                    var firstName = result.FirstName;
                    var lastName = result.LastName;
                    email = result.Email;
                    url = fjmsPagesUrl + "ContactUsSalesforce.html?lang=" + lang + "&firstname=" + firstName + "&lastname=" + lastName + "&email=" + email;
                }
                else
                    url = fjmsPagesUrl + "ContactUsSalesforce.html?lang=" + lang
                url = encodeURI(url); //so will work also if there are hebrew names
                OpenContactUs(url, elem);
            },
            error: function (res) {
                url = fjmsPagesUrl + "ContactUsSalesforce.html?lang=" + lang
                url = encodeURI(url);
                OpenContactUs(url, elem);

            }
        });
    }
    else 
    {
        url = fjmsPagesUrl + "ContactUsSalesforce.html?lang=" + lang
        url = encodeURI(url);
        OpenContactUs(url, elem);
    }


    
}

function getLangCookie() {
    var c_name = "selLang";
          if (document.cookie.length > 0) {
              c_start = document.cookie.indexOf(c_name + "=");
              if (c_start != -1) {
                  c_start = c_start + c_name.length + 1;
                  c_end = document.cookie.indexOf(";", c_start);
                  if (c_end == -1) {
                      c_end = document.cookie.length;
                  }
                  return unescape(document.cookie.substring(c_start, c_end));
              }
          }
          return "";
      }


function OpenContactUs(url, elem) {
    var title;
    (lang == 'heb') ? title = 'צור קשר' : title = 'Contact Us';
    FillFJMSdialogIframe(url, title);

//    $("#dialog").empty();
//      $("#dialog").innerHTML = null;
//    $("#dialog").append($("<iframe width='500px' height='600px' border='0' frameBorder='0' />").attr("src", url)).dialog(
//        {
//            position: 'center',
//            title: title,
//            draggable: false,
//            width: 600,
//            height: 570,
//            resizable: true,
//            dialogClass:  "FJMSdialogCSS",
//           // modal: true
//        });

///////////////////////////////////////////////////////////////////
 //    $('.ui-dialog').css({'z-index':'100001'});


//    var title;
//    var langFromCookie = getLangCookie();
//    if (langFromCookie!="")
//        lang = langFromCookie;
//    (lang == 'heb') ? title = 'צור קשר' : title = 'Contact Us';

//    var urlForCU = url; 
//    //if (!IsGuest && !IsInst)
//    //    urlForCU += "&UIT=" + UIT;
//    FillFJMSdialogIframe(urlForCU, title, elem);
}

function InitEditProfile() {
    if (ReadOnlyMode == true) {
        if (lang == 'eng')
            setTimeout(function () {
                swal({ title: attentionTitle, text: ReadOnlyAlertEng, type: "info", confirmButtonText: okBtnText })
            }, 500)
        else
            setTimeout(function () {
                swal({ title: attentionTitle, text: ReadOnlyAlertHeb, type: "info", confirmButtonText: okBtnText });
            }, 500)
    }
    else {
        //from sites or from portal when token alive
        if (siteName != 'portal' || getCookie('UIT')) {
            var title;
            (lang == 'heb') ? title = 'עריכת פרופיל' : title = 'Edit Profile';
            FillFJMSdialogIframe(fjmsPagesUrl + "EditProfile.htm?UIT=" + UIT + "&lang=" + lang, title);
        }
        else {
            setTimeout(function () {
                swal({ text: sessionEnd, type: "info", confirmButtonText: okBtnText });
            }, 500)
            //
            SiteLogOff();
        }
    }
}

function InitRegister() {
    if (ReadOnlyMode == true)
        (lang == 'eng') ? alert(ReadOnlyAlertEng) : alert(ReadOnlyAlertHeb);
    else {
        var title;
        (lang == 'heb') ? title = 'הרשמה' : title = 'Register';
        FillFJMSdialogIframe(fjmsPagesUrl + "Register.htm?UIT=" + UIT + "&lang=" + lang + "&currSite=" + siteName , title);
    }
}

function ChangeFlexibleModalHeight() {
    $(".flexibleModalContent").css("height","455px");
}

function ChangeFlexibleModalWidth(newWidth) {
    $(".flexibleModalContent").css("width",newWidth + "px");
}

function CloseFlexibleModal() {
    $(".flexibleModal").each(function(){
    $(this).css("display","none");});
}

function OpenFlexibleModal() {
    $(".flexibleModalContent").each(function(){
  $(this).draggable();});
    $(".flexibleModal").each(function(){
    $(this).css("display","block");});
}

function InitLoginOrReg(isGuest, isFirstTime, isGuestPlus) {
    $(".flexibleModalContent").each(function(){
    isGuestPlus == "True" ? $(this).css("height", "240px").css("width", "570px") : $(this).css("height", "190px").css("width", "570px");
    var guestPlus = isGuestPlus != undefined ? "&isGuestPlus=" + isGuestPlus : "";
    url = fjmsPagesUrl + "Login.htm?UIT=" + UIT + "&lang=" + lang + "&currSite=" + siteName + "&isGuest=" + isGuest + guestPlus + "&isFirstTime=" + isFirstTime;
    var iframe = $(this).find("iframe")[0];
    if (iframe) {
        iframe.src = url;
    } else {
        $(this).append('<iframe src=' + url + ' width="100%" height="430px" frameBorder="0"><iframe>');
    }   
    });
        
    OpenFlexibleModal();
}


function LogOff(siteToLogoff) {
    SiteLogOff(siteToLogoff); //this Func should be implemented in each one of the sites
}

function SiteLogOffDone(siteToLogoff) {
    
    //var url = SSObaseUrl + 'Login/UserLogOff?UIT=' + UIT + "&site=" + siteToLogoff;//temp cuase of prob with closing other sites

    //dont do real log off when log off comes from portal. sites cant really close by this.
    if (siteName == portal || siteToLogoff == portal) {//temp cuase of prob with closing other sites
        UIT = "";
        var uitQS = "?lang=" + lang + "&UIT=" + UIT;
        window.location.href = fjmsLoginUrl + uitQS;
        return;
    }

    var url = SSObaseUrl + 'Login/UserLogOff?UIT=' + UIT + "&site=" + siteName; //temp-never closes FJMS, never kills token

    $.ajax({
        type: 'GET',
        url: url,
        success: function () {//isGuest) {
            //if (isGuest == true) UIT = ""; // logs off portal// ended up hiding button
            if (siteToLogoff == portal) UIT = "";
            var uitQS = "?lang=" + lang + "&UIT=" + UIT;
            window.location.href = fjmsLoginUrl + uitQS;
        },
        error: function (err) {
            alert(err.statusText);
        }
    });
}

function NoPulse() {
    window.location.replace(fjmsPagesUrl + "NoPulse.htm");
}

// function ChangeSiteLang(language) {
//        debugger;
//        $('.changelang').each(function () {
//            $(this).attr('class', 'lang-lg')});
//            var langImg = (language == "heb") ? "en" : "iw";
//            $('.changelang').each(function () {$(this).attr('lang', langImg)});
//    };


function ShowWelcomeText(UIT, lang) {
    $.ajax({
        type: 'GET',
        url: SSObaseUrl + "user/GetUserInfo?UIT=" + UIT + "&lang=" + lang,
        dataType: 'jsonp',
        success: function (res) {
            if (res.fullName != null) {

                IsGuest = res.IsGuest;
                IsInst = res.IsInst;
                $("[name=EditProfileBtn]").each(function () { this.style.display = (IsInst == true || IsGuest == true) ? "none" : "" });
                $("[name=BackToFJMSBtn]").each(function () { this.style.display = (IsGuest == true) ? "none" : "" });
                $("[name=LogOffFJMSBtn]").each(function () { $(this).val((IsGuest == true) ? btnTexts.SiteLogOff : btnTexts.LogOff) });
                if (lang == "heb") {
                    if (IsHebrew(res.fullName.trim()[0]))
                        $("[name=WelcomeText]").text("ברוכים הבאים " + res.fullName);
                    else
                        $("[name=WelcomeText]").text(res.fullName + " ברוכים הבאים ");
                }
                else
                    $("[name=WelcomeText]").text("Welcome " + res.fullName);
            }
            else SiteLogOff(portal);
        },
        error: function (err) {
            alert(err.statusText);
        }
    });
}


function IsHebrew(character) {
    var RTL = ['ת', 'ש', 'ר', 'ק', 'צ', 'פ', 'ע', 'ס', 'נ', 'מ', 'ל', 'כ', 'י', 'ט', 'ח', 'ז', 'ו', 'ה', 'ד', 'ג', 'ב', 'א'];
    return (jQuery.inArray(character, RTL) !== -1)

}

//load inner site scripts for Google Tag Manager...
(function(){
     /* BEGIN LivePerson Monitor for the chat */
//     var chatScript = "window.lpTag = window.lpTag || {}, 'undefined' == typeof window.lpTag._tagCount ? (window.lpTag = { wl: lpTag.wl || null, scp: lpTag.scp || null, site: '91630553' || '', section: lpTag.section || '', tagletSection: lpTag.tagletSection || null, autoStart: lpTag.autoStart !== !1, ovr: lpTag.ovr || {}, _v: '1.10.0', _tagCount: 1, protocol: 'https:', events: { bind: function (t, e, i) { lpTag.defer(function () { lpTag.events.bind(t, e, i) }, 0) }, trigger: function (t, e, i) { lpTag.defer(function () { lpTag.events.trigger(t, e, i) }, 1) } }, defer: function (t, e) { 0 === e ? (this._defB = this._defB || [], this._defB.push(t)) : 1 === e ? (this._defT = this._defT || [], this._defT.push(t)) : (this._defL = this._defL || [], this._defL.push(t)) }, load: function (t, e, i) { var n = this; setTimeout(function () { n._load(t, e, i) }, 0) }, _load: function (t, e, i) { var n = t; t || (n = this.protocol + '//' + (this.ovr && this.ovr.domain ? this.ovr.domain : 'lptag.liveperson.net') + '/tag/tag.js?site=' + this.site); var o = document.createElement('script'); o.setAttribute('charset', e ? e : 'UTF-8'), i && o.setAttribute('id', i), o.setAttribute('src', n), document.getElementsByTagName('head').item(0).appendChild(o) }, init: function () { this._timing = this._timing || {}, this._timing.start = (new Date).getTime(); var t = this; window.attachEvent ? window.attachEvent('onload', function () { t._domReady('domReady') }) : (window.addEventListener('DOMContentLoaded', function () { t._domReady('contReady') }, !1), window.addEventListener('load', function () { t._domReady('domReady') }, !1)), 'undefined' === typeof window._lptStop && this.load() }, start: function () { this.autoStart = !0 }, _domReady: function (t) { this.isDom || (this.isDom = !0, this.events.trigger('LPT', 'DOM_READY', { t: t })), this._timing[t] = (new Date).getTime() }, vars: lpTag.vars || [], dbs: lpTag.dbs || [], ctn: lpTag.ctn || [], sdes: lpTag.sdes || [], hooks: lpTag.hooks || [], identities: lpTag.identities || [], ev: lpTag.ev || [] }, lpTag.init()) : window.lpTag._tagCount += 1;";
//    document.write('<script type="text/javascript">'+ chatScript +'</script>');
//    document.write(' <div id="LPChatDIVFriedbergEng" style="display:none;"></div>');
//    document.write(' <div id="LPChatDIVFriedberg" style="display:none;"></div>');
   
    /* END LivePerson Monitor. */


     /* Start of Glassix Chat Widget */
    var GlassixChat = 'var widgetOptions = {apiKey: "c4225c7b-ce7f-41af-a6e2-28b9c680b5b9", snippetId: "kl3ZIfe1IPptnXUSnB9J"}; (function(n){var u=function(){GlassixWidgetClient&&typeof GlassixWidgetClient=="function"?(window.widgetClient=new GlassixWidgetClient(n),widgetClient.attach(),window.glassixWidgetScriptLoaded&&window.glassixWidgetScriptLoaded()):f()},f=function(){r.src="https://cdn.glassix.net/clients/widget.1.2.min.js";r.onload=u;document.body.removeChild(t);i.parentNode.insertBefore(r,i)},i=document.getElementsByTagName("script")[0],t=document.createElement("script"),r;(t.async=!0,t.type="text/javascript",t.crossorigin="anonymous",t.id="glassix-widget-script",r=t.cloneNode(),t.onload=u,t.src="https://cdn.glassix.com/clients/widget.1.2.min.js",!document.getElementById(t.id)&&document.body)&&(i.parentNode.insertBefore(t,i),t.onerror=f)})(widgetOptions)';
    document.write('<script type="text/javascript">'+ GlassixChat +'</script>');
    document.write('<div id="glassix-client"></div>');
    /* End of Glassix Chat Widget */

    setTimeout(function(){
    /*note: in the code there is "\" mark - this enables string with multi line.*/

   //for head:==========================================
    var headCode=" \
       (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': \
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0], \
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src= \
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f); \
        })(window,document,'script','dataLayer','GTM-NBTXXBZ'); \
    ";
    var s = document.createElement('script');
    s.type = 'text/javascript'; 
    s.appendChild(document.createTextNode(headCode));
    
    //now add it to head:
    //document.getElementsByTagName('head')[0].insertAdjacentHTML('afterbegin', headCode);
    document.getElementsByTagName('head')[0].appendChild(s);

   //for body:==========================================
    var bodyCode=' \
        <!-- Google Tag Manager (noscript) --> \
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NBTXXBZ" \
        height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript> \
        <!-- End Google Tag Manager (noscript) --> \
    ';

    //now add it to body:
    document.getElementsByTagName('body')[0].insertAdjacentHTML('afterbegin', bodyCode);
    
    },2000);    
})();


