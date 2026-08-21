(function () {
  "use strict";
  var base = document.createElement("base");
  base.href = location.hostname.endsWith(".github.io") ? "/chomchom-sushibar.de/" : "/";
  document.head.appendChild(base);
})();
