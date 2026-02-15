var mode = ""; //Debug mode is for no Validation on forms
var env = "Prod";
var version = 72;

var ReadOnlyMode = false;
var ReadOnlyAlertEng = "The Friedberg Sites are currently in Read Only mode. Please Try again later.";
var ReadOnlyAlertHeb = "אתרי פרידברג הינם כרגע במצב קריאה בלבד. נא לנסות שנית במועד מאוחר יותר.";


//var fjmsMsgEng = "The Friedberg sites will be in view-only mode in the next few hours, you may encounter some other difficulties too, </br> we apologize for the inconvenience";
//var fjmsMsgHeb = "בשעות הקרובות אתרי פרידברג יהיו לצפייה בלבד ויתכנו שיבושים נוספים, עמכם הסליחה";




var showFjmsMsg = true;

var fjmsMsgEng = "The FJMS Portal will be offline from September 3 to September 6. </br>For more information about the outage and about The National Library of Israel moving to a new location <a href='https://viewstripo.email/4a330d73-de67-48a4-9513-9ad8a71db3d31693378077073' target='_blank' style='color: white'>click here</a>";
var fjmsMsgHeb = "<div style='direction:rtl'>פורטל FJMS לא יהיה זמין מה-3 בספטמבר עד ה-6 בספטמבר </br> למידע נוסף על ההפסקה ועל מעבר הספרייה הלאומית למיקום החדש <a href='https://viewstripo.email/4a330d73-de67-48a4-9513-9ad8a71db3d31693378077073' target='_blank' style='color: white'>לחץ כאן </a></div>";

//var fjmsMsgEng = "The Friedberg Sites are currently in Read Only mode. Please Try again later.";

//var fjmsMsgEng = "The Friedberg Genizah Project (FGP) family, with great sorrow, shares the news of the passing of <br/><br/><b><div style='font-size: 30px;'>Professor Yaacov Choueka</div></b><br/>  Architect and Director of the Project for many years.<br/>He holds a special place in the world of historical Jewish Manuscripts, and his many contributions to the area of Jewish Studies are well known.<br/>We extend our condolences to his dear wife, his sons Roni and Avi who were members of the project, and the family.<br/><br/>The Friedberg Genizah Project - FGP <br/> The Friedberg Jewish Manuscript Society - FJMS<br/>";

//var fjmsMsgHeb = "<br/>משפחת פרויקט פרידברג לחקר הגניזה- אבלה אבל כבד על מותו של אדריכלו, מנווט דרכו ומנהלו לשעבר של הפרויקט<br/><br/><b>פרופ'<span style='font-size: 35px;'> יעקב שוויקה</span>  ז''ל</b><br/><br/>מקום מיוחד שמור לו בעולם המחקר של כתבי יד יהודיים היסטוריים, תרומתו הרבה בשטחי המחשבה וההלכה היהודית ניכרים היטב בכל פועליו הרבים והברוכים<br/></br>תנחומינו הכנים שלוחים לאשתו ולמשפחתו ובתוכם לרוני ואבי עובדי הפרויקט</br></br>פרויקט פרידברג לחקר הגניזה FGP<br/>אגודת פרידברג לכתבי יד יהודיים FJMS <br/>";

//var fjmsMsgHeb = "אתר הכי גרסינן משתדרג בשבילכם! בימים הקרובים יתכנו תקלות קלות ובעיות בפונקציית 'חיפוש', תודה על ההבנה.";
//var fjmsMsgEng = "The Hachi Garsinan Site is being upgraded! In the next few days you may see some minor issues, including the search. Thank you for your understanding";


//var fjmsMsgEng = "In the coming hours, there may be issues on the sites. Sorry for the inconvenience";
//var fjmsMsgHeb = "בשעות הקרובות יתכנו תקלות באתרים, עמכם הסליחה";

//var fjmsMsgEng = "<A href='https://www.youtube.com/playlist?list=PL1znPGBS7L4ho1_JkF4oHTz8xw435MWBH' target='_blank'>Link</A> to Training Videos";
//var fjmsMsgHeb = "<div style='direction:rtl'><A href='https://www.youtube.com/playlist?list=PL1znPGBS7L4ho1_JkF4oHTz8xw435MWBH' target='_blank'>קישור</A> להדרכות מוקלטות</div>";

var fjmsMsgEng = "Migration of FJMS to the National Library – <A href='https://viewstripo.email/d24e0dbd-39c5-45bc-9985-0a0b5e45681e1752565202928' target='_blank' style='color:white'>Read the Latest</A>";
var fjmsMsgHeb = "<div style='direction:rtl'>העברת FJMS לספרייה הלאומית <A href='https://viewstripo.email/8412f767-4801-4730-8296-2cdd4a180da21752402339007' target='_blank' style='color:white'>קראו את העדכונים האחרונים</A> </div>";

var engSites = [
  { key: "The Friedberg Portal", value: 0 },
  { key: "Cairo Genizah", value: 1 },
  { key: "Hachi Garsinan – Bavli", value: 6 },
  { key: "Yad harambam", value: 9 },
  { key: "Nahum Coll.", value: 2 },
  { key: "Judeo-Arabic", value: 3 },
   { key: "Mahadura<br ><span class='smSiteTitle'>Create Transcriptions and Synopsis<\span>", value: 11 },
  { key: "Sussmann C.", value: 5 },
  { key: "Judeo-Arabic Biblio.", value: 4 }
  
];
var hebSites = [
  { key: "פורטל פרידברג", value: 0 },
  { key: "גניזת קהיר", value: 1 },
  { key: "הכי גרסינן – בבלי", value: 6 },
  { key: "יד הרמב\"ם", value: 9 },
  { key: "אוסף נחום", value: 2 },
  { key: "ערבית-יהודית", value: 3 },
	  { key: "מהדורא<br ><span class='smSiteTitle'>יצירת העתקות וסינופסיס<\span> ", value: 11 },
  { key: "קטלוג זוסמן", value: 5 }, 
  { key: "ביבלי' לערבית-יהודית", value: 4 }
  
];

var sitesShort = [
  { key: "fjms", value: 0 },
  { key: "fgp", value: 1 },
  { key: "fbp", value: 6 },
  { key: "frp", value: 9 },
  { key: "fnp", value: 2 },
  { key: "fjp", value: 3 },
  { key: "fkyp", value: 11 },
  { key: "fsp", value: 5 }, 
  { key: "fjbp", value: 4 }
 
];

var sitesUrls = [
  { key: "https://fjms.genizah.org", value: 0 },
  { key: "https://fgp.genizah.org", value: 1 },
  { key: "https://bavli.genizah.org/Account/SSOSignIn", value: 6 },
  { key: "https://rambam.genizah.org/Account/SSOSignIn", value: 9 },
  { key: "http://nachum.genizah.org/indexOnline.htm",value: 2 },
  { key: "https://ja.genizah.org", value: 3 }, 
  { key: "https://Manuscripts.genizah.org/Account/SSOSignIn", value: 11 },
  { key: "http://sussmann.genizah.org/Account/SSOSignIn", value: 5 },
  { key: "http://bibja.genizah.org/Account/SSOSignIn", value: 4 }

];

var adminUrl = "https://admin.genizah.org/GeneralAdmin/MainAdmin.aspx"
var SSObaseUrl = "https://SSO.genizah.org/";
var fjmsLoginUrl = "https://fjms.genizah.org/index.html";
var fjmsLoginUrlMobile = "https://fjms.genizah.org/ResponsivePortal.htm";
var fjmsPagesUrl = "https://fjms.genizah.org/";
var fjmsScriptsUrl = fjmsPagesUrl + 'Scripts/';
var fjmsCSSUrl = fjmsPagesUrl + 'CSS/';
var prUrl = "http://pr.genizah.org/";
var chaptchSiteKey = '6Ld9DjoUAAAAAOPhksuNJnnMWMqt5kYMXc6h6cdW';

//url=coming from. site=going to.
var Guests = [
{
    username: "guestwikijewishbooks",
    url: "wiki.jewishbooks.org.il",
    site: 'fbp',
    isguest: true
},
{
    username: "guestportalhadaf",
    url: "daf-yomi.com", //"jewishmanuscripts.org",//
    site: 'fbp',
    isguest: true
},   
   {
       username: "guestportalhadaf",
       url: "URL_FROM_PORTAL_HADAF",
       site: 'fbp',
	   isguest: true
   },
   { 
		username: "guest",
        url: "*", 
        site: 'fbp',
	    isguest: true
    },
  // {
  //     username: "guestbavlidaf",
  //     url: "*", // * = any domain. should have only ONE username with url *
  //     site: 'fbp'
  // },
   {
       username: "guest",
       url: fjmsLoginUrl , // from Guest button click in portal (index page buttons)
       site: 'fbp',
       isguest: true
   },
   //,
   //{
   //    username: "guestnli",
   //    url: "*", // * = any domain. should have only ONE username with url *
   //    site: 'fgp'
   //}

   { 	username: "guest",
        url: fjmsLoginUrl, // from Guest button click in portal (index page buttons)
        site: 'fgp',
        isguest: true
    },
   { 	username: "guest",
        url: fjmsLoginUrl, // from Guest button click in portal (index page buttons)
        site: 'frp',
        isguest: true
    },

   { username: "guest",
        url: fjmsLoginUrl, // from Guest button click in portal (index page buttons)
        site: 'fnp',
        isguest: true
    },
,
   { username: "guest",
        url: fjmsLoginUrl, // from Guest button click in portal (index page buttons)
        site: 'fjp',
        isguest: true
    },
   { username: "guest",
        url: "*", 
        site: 'frp',
	   isguest: true
    },
	
    { username: "ktiv",  
        url: "URL_FROM_KTIV",
        site: 'fkyp',
        isguest: true
    },	
    { username: "guest",  
        url:fjmsLoginUrl,// "*",
        site: 'fkyp',
        isguest: true
    }
];


   var homepageImagesENG = [
  { key: "ImagesFJMS/computer1EN.png", value: 0 },
  { key: "ImagesFJMS/computer2EN.png", value: 1 },
  { key: "ImagesFJMS/computer3EN.png", value: 2 },
  { key: "ImagesFJMS/computer4EN.png", value: 3 },
  { key: "ImagesFJMS/computer5EN.png", value: 4 },
];

   var homepageImagesHEB = [
  { key: "ImagesFJMS/computer1.png", value: 0 },
  { key: "ImagesFJMS/computer2.png", value: 1 },
  { key: "ImagesFJMS/computer3.png", value: 2 },
  { key: "ImagesFJMS/computer4.png", value: 3 },
  { key: "ImagesFJMS/computer5.png", value: 4 },
];

