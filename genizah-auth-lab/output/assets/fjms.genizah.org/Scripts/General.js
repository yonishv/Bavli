
var userFullName;
var UIT;

var selLang = SetCurrLang();

function SetCurrLang() {

    //FROM OTHER SITES
    if (queryString("lang") != "false")
        selLang = queryString("lang");

    else {
        //FROM Cookies
        if (getCookie("selLang") != "" && getCookie("selLang") != null)
            selLang = getCookie("selLang");
        //FROM Browser
        else 
            selLang =  BrowserLang();
    }
    
    //some kind of mistake
    selLang = selLang.toLowerCase();
    if (selLang != 'heb' && selLang != 'eng') selLang = 'eng';

    return selLang;

}

function BrowserLang() {
    var userLang = navigator.language || navigator.userLanguage;
    
    if (userLang == 'he' || userLang == 'he-IL') 
        return 'heb';
    else 
        return 'eng';

}



function callChangelang() {

    selLang = (selLang == "eng") ? 'heb' : 'eng';
    createCookie("selLang", selLang, 14 * 24); //expires after 2 weeks
    var UIT = getCookie("UIT");

    window.location.href = window.location.pathname + "?" + $.param({ 'UIT': UIT })
    //    window.location.href = window.location.pathname + ((UIT != "") ? ("?" + $.param({ 'UIT': UIT })) : "");//

};


  $(function () {
      GetEnums();

      $(document).ajaxSend(function () {
          $.blockUI({ message: null, overlayCSS: { opacity: 0.2} });
      });

      $(document).ajaxComplete(function () {
          $.unblockUI();
      });


  });

  String.prototype.containsInstances = containsInstances;
  function containsInstances(text) {
      var arr = this.split(text);
      return arr.length - 1;
  }

  String.prototype.removeAll = removeAll;
  function removeAll(charsToRemove) {
      var val = this.toString();
      var newVal = "";
      for (var i = 0; i < val.length; i++) {
          if (!charsToRemove.containsInstances(val.charAt(i))) {
              newVal += val.charAt(i);
          }
      }
      return newVal;
  }

  String.prototype.replaceAll = replaceAll;
  function replaceAll(text1, text2) {
      var val = this.toString();
      arr = val.split(text1);
      var newVal = arr.join(text2);
      return newVal;
  }

function IsHebrew(character) {
    var RTL = ['ת', 'ש', 'ר', 'ק', 'צ', 'פ', 'ע', 'ס', 'נ', 'מ', 'ל', 'כ', 'י', 'ט', 'ח', 'ז', 'ו', 'ה', 'ד', 'ג', 'ב', 'א'];
    return (jQuery.inArray(character, RTL) !== -1)

};

function getLanguage(text) {
    text = text.removeAll("\"'0123456789.()[] :-–");
    text = text.trim();
    if (text == "")
        return "eng";
    if ("אבגדהוזחטיכלמנסעפצקרשתםןךץף".indexOf(text[0]) > -1)
        return "heb";
    else return "eng";
}
      var createCookie = function (name, value, hours) {
          var expires;
          if (hours) {
              var date = new Date();
              date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
              expires = "; expires=" + date.toGMTString();
          }
          else {
              expires = "";
          }
          document.cookie = name + "=" + value + expires + "; path=/";
      }

      function getCookie(c_name) {
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
    
    function GetEnums() {
        $.ajax({
            type: 'GET',
            url: SSObaseUrl + "General/GetEnums",
            dataType: 'jsonp',
            timeout: 3000, // jsonp dose not fall to error without this timeout
            success: function (result) {
                $("head").append('<script>' + result + '</' + 'script>');                
            },

            error: function (x, t, m) {
                if (t === "timeout") {
                    if (env == 'Dev') {
                        alert('Dear Developer, Please run the SSO Project, then refresh Portal with F5');
                    }
                    $('#noSsoMsgDiv').show();
                    $('#noSsoMsgText').html(txtNotiMessg) ;
                    $('#noSsoMsgText').css(selLang + 'NotiMessg');
                }
            }
        });

    }

    function queryString(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
        return results === null ? "false" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
    }

//    function replaceHebLettersToEng(str) {
//        for (var index = 0; index <= str.length; index = index + 1) {
//            //if (str.charCodeAt(index) <= 160) {
//                debugger;
//                str = str.toLowerCase();
//                str = str
//                .replaceAll("/", "q")
//                .replaceAll("'", "w")
//                .replaceAll("ק", "e")
//                .replaceAll("ר", "r")
//                .replaceAll("א", "t")
//                .replaceAll("ט", "y")
//                .replaceAll("ו", "u")
//                .replaceAll("ן", "i")
//                .replaceAll("ם", "o")
//                .replaceAll("פ", "p")
//                .replaceAll("ש", "a")
//                .replaceAll("ד", "s")
//                .replaceAll("ג", "d")
//                .replaceAll("כ", "f")
//                .replaceAll("ע", "g")
//                .replaceAll("י", "h")
//                .replaceAll("ח", "j")
//                .replaceAll("ל", "k")
//                .replaceAll("ך", "l")
//                .replaceAll("ז", "z")
//                .replaceAll("ס", "x")
//                .replaceAll("ב", "c")
//                .replaceAll("ה", "v")
//                .replaceAll("נ", "b")
//                .replaceAll("מ", "n")
//                .replaceAll("צ", "m")
//                .replaceAll("ת", ",")
//                .replaceAll("ץ", ".")
//                .replaceAll("ף", ";");
//                break;
//            //}
//        }

//        return str;
//    }
