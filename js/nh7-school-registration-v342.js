/* New Hope 7 v3.5.3 — legacy school registration route disabled.
   This path remains only for old cached shells and delegates to the canonical form. */
(()=>{'use strict';
window.NH7_SCHOOL_REGISTRATION_VERSION='3.5.3-legacy-disabled';
if(window.__NH7_CANONICAL_REGISTRATION_V353__)return;
const src='js/nh7-registration-canonical-v353.js?v=3.5.3';
if(!document.querySelector('script[data-nh7-canonical-registration-v353]')){
  const script=document.createElement('script');
  script.src=src;
  script.dataset.nh7CanonicalRegistrationV353='1';
  script.async=false;
  document.head.appendChild(script);
}
})();