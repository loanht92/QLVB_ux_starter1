<%-- The following 4 lines are ASP.NET directives needed when using SharePoint components --%>

    <%@ Page Inherits="Microsoft.SharePoint.WebPartPages.WebPartPage, Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" 
	MasterPageFile="tsgmaster.master" Language="C#" %>

        <%@ Register TagPrefix="Utilities" Namespace="Microsoft.SharePoint.Utilities" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
            <%@ Register TagPrefix="WebPartPages" Namespace="Microsoft.SharePoint.WebPartPages" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
                <%@ Register TagPrefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>

                    <%-- The markup and script in the following Content element will be placed in the <head> of the page --%>
                        <asp:Content ContentPlaceHolderID="PlaceHolderAdditionalPageHead" runat="server">
                            <SharePoint:ScriptLink name="sp.js" runat="server" OnDemand="true" LoadAfterUI="true" Localizable="false" />
                            <script type="text/javascript">
                                window["base-url"] = window.location.pathname;
                                window["base-url"] = window["base-url"].slice(0, window["base-url"].lastIndexOf('/'));
                            </script>

                            <meta charset="utf-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1">
                            <link rel="icon" type="image/png" href="./assets/logo.png">

                            <link rel="stylesheet" href="styles.843f9506457f27ab46df.css" type="text/css">
                            </head>
                        </asp:Content>

                        <%-- The markup and script in the following Content element will be placed in the <body> of the page --%>
                            <asp:Content ContentPlaceHolderID="PlaceHolderMain" runat="server">
                                <anms-root>
                                    <div class="app-loading">
                                        <div class="logo">
                                            <svg class="spinner" viewBox="25 25 50 50">
        <circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/>
      </svg>
                                        </div>
                                    </div>
                                </anms-root>
                                <script>
                                    (function(i, s, o, g, r, a, m) {
                                        i['GoogleAnalyticsObject'] = r;
                                        i[r] = i[r] || function() {
                                            (i[r].q = i[r].q || []).push(arguments)
                                        }, i[r].l = 1 * new Date();
                                        a = s.createElement(o),
                                            m = s.getElementsByTagName(o)[0];
                                        a.async = 1;
                                        a.src = g;
                                        m.parentNode.insertBefore(a, m)
                                    })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');

                                    ga('create', 'UA-53234284-5', 'auto');
                                </script>
                                <script src="runtime-es2015.a0c2feb14251d1258909.js" type="module"></script>
                                <script src="polyfills-es2015.c777ec571b57c67e5c1e.js" type="module"></script>
                                <script src="runtime-es5.9c66c21a1fd9ffc1efff.js" nomodule></script>
                                <script src="polyfills-es5.6691e0896a3f6e028498.js" nomodule></script>
                                <script src="main-es2015.95a071eee471ebc3f940.js" type="module"></script>
                                <script src="main-es5.a53cb9fe820a787eac6a.js" nomodule></script>
                                <script>
                                    window["__frmSPDigest"] = document.getElementById("__REQUESTDIGEST").value;
                                </script>
                            </asp:Content>